/**
 * Grounding guardrails. Two checks, on opposite sides of the answer.
 *
 *   grounding.floor      — before synthesis. A retrieved passage scoring below
 *                          the floor never enters the context window.
 *   grounding.citations  — after synthesis. Every source the answer cites must
 *                          be one that was actually retrieved.
 *
 * The floor is the more important of the two, and the reason is worth stating.
 * Vector search always returns its `limit` rows. Ask a corpus about
 * magnetocaloric regenerators for something it has never heard of and it will
 * still hand back the six least-unrelated passages, with no signal that they
 * are unrelated other than the score nobody looked at. A model given six
 * irrelevant passages and told to answer from them will oblige. The floor is
 * what turns "here is the closest thing I have" into "I do not have this".
 *
 * Where 0.70 comes from: it is `GROUNDING_SIMILARITY_FLOOR`, tuned against the
 * corpus rather than picked from the air. `npm run eval:fast` prints the
 * separation between in-corpus and off-corpus queries; move the floor and the
 * false-refusal rate in that report moves with it.
 */

import { config } from "@/lib/config";
import type { KnowledgeHit } from "@/lib/db/queries";
import { type GuardrailVerdict, REFUSAL, fail, pass } from "./types";

export type GroundingResult = {
  kept: KnowledgeHit[];
  rejected: KnowledgeHit[];
  verdict: GuardrailVerdict;
  /** Set when nothing cleared the floor: the turn must refuse without calling
   *  the synthesis model at all. */
  refusal: string | null;
};

export function applyGroundingFloor(
  hits: KnowledgeHit[],
  floor: number = config.groundingFloor,
): GroundingResult {
  const started = performance.now();

  const kept = hits.filter((hit) => hit.similarity >= floor);
  const rejected = hits.filter((hit) => hit.similarity < floor);
  const latency = performance.now() - started;

  const detail = {
    floor,
    retrieved: hits.length,
    kept: kept.length,
    rejected: rejected.length,
    topScore: hits[0]?.similarity ?? null,
    // The best score that still failed. This is the number that tells you
    // whether the floor is set sensibly: a stream of 0.69s means it is too
    // high, a stream of 0.71s that produce nonsense means it is too low.
    bestRejected: rejected[0]?.similarity ?? null,
  };

  if (!kept.length) {
    return {
      kept,
      rejected,
      refusal: REFUSAL.ungrounded,
      verdict: fail("grounding.floor", latency, REFUSAL.ungrounded, detail),
    };
  }

  return { kept, rejected, refusal: null, verdict: pass("grounding.floor", latency, detail) };
}

/**
 * Every `source_ref` the answer names must be one that was retrieved.
 *
 * This does not catch a fabricated *claim* attributed to a real document —
 * that is what the offline faithfulness eval is for, and it needs a judge. What
 * it does catch is the cheaper and more embarrassing failure: an answer citing
 * `ECO-24-005` because that is the shape a citation takes, when no such
 * document is in the corpus. Cheap, deterministic, and it runs on every turn.
 */
export function checkCitations(answer: string, kept: KnowledgeHit[]): GuardrailVerdict {
  const started = performance.now();

  const available = new Set(kept.map((hit) => hit.sourceRef.toUpperCase()));
  // Matches the handle shape used across the corpus: MT-TECH, WIKI-ISO10007,
  // and the ECO-24-005 / NCR-26-001 forms a model is likely to invent.
  const cited = [...answer.matchAll(/\b([A-Z]{2,}[A-Z0-9]*(?:-[A-Z0-9]{2,}){1,3})\b/g)].map(
    (match) => match[1].toUpperCase(),
  );

  const unknown = [...new Set(cited)].filter((ref) => !available.has(ref));
  const latency = performance.now() - started;

  const detail = { cited: [...new Set(cited)], available: [...available], unknown };

  if (unknown.length) {
    return fail(
      "grounding.citations",
      latency,
      `The answer cites ${unknown.join(", ")}, which was not among the retrieved sources.`,
      detail,
    );
  }
  return pass("grounding.citations", latency, detail);
}

/** The retrieved passages, formatted for the synthesis prompt. Scores are
 *  included on purpose: a passage that only just cleared the floor should be
 *  leaned on less heavily than one at 0.9, and the model can only weigh that
 *  if it is told. */
export function formatEvidence(hits: KnowledgeHit[]): string {
  return hits
    .map(
      (hit) =>
        `[${hit.sourceRef}] ${hit.docTitle} (similarity ${hit.similarity.toFixed(3)})\n${hit.text}`,
    )
    .join("\n\n---\n\n");
}
