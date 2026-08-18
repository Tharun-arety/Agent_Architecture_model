/**
 * Retrieval over the profile corpus.
 *
 * Fifteen passages, so the whole index is a JSON file loaded once at module
 * scope and searched with a dot product. No database, no round trip, and the
 * corpus is reviewable in a diff.
 *
 * The embeddings are unit vectors from the OpenAI embedding endpoint, so a dot
 * product is already the cosine similarity and there is nothing to normalise.
 */

import corpus from "@/data/profile-corpus.json";
import { PROFILE_DOCS } from "@/content/profile";
import { embedOne } from "@/lib/ai/openai";
import { sourceHash } from "@/lib/profile/hash";

export type ProfileHit = {
  ref: string;
  title: string;
  text: string;
  similarity: number;
};

type Entry = { ref: string; title: string; text: string; embedding: number[] };

const ENTRIES = corpus.entries as Entry[];

/**
 * Editing the source without re-embedding would leave the agent answering from
 * text nobody can see. Checked once, at module load, so it fails on the first
 * request rather than on an unlucky one.
 */
const EXPECTED = sourceHash(PROFILE_DOCS);
export const CORPUS_STALE = corpus.sourceHash !== EXPECTED;

/**
 * Swept with `npx tsx evals/calibrate-profile.ts` against
 * `evals/cases/profile.json`. 0.32 is the highest value that still answers
 * every question in the golden set, so it costs nothing and blocks the most.
 *
 * The sweep found something worth writing down rather than hiding: no floor
 * separates the two sets cleanly. Questions like "what is his salary
 * expectation" and "what does he think about Kubernetes" score 0.42, higher
 * than genuine questions such as "what did he study" at 0.33, because they are
 * about him in vocabulary while being unanswerable from the corpus.
 *
 * So the floor is not doing the whole job, and pretending otherwise would be
 * the kind of claim this project exists to avoid. It does two things well.
 * Genuinely unrelated questions, the capital of France or how a diesel engine
 * works, all score below 0.22 and are refused here with no model call at all.
 * And every real question clears it. The narrow band in between reaches the
 * model, which declines from the passages it was given, and `evals/profile.eval.test.ts`
 * asserts that it does.
 *
 * The first calibration run also found a corpus defect: "how do I contact him"
 * scored 0.254 because the email sat at the end of a passage about visas and
 * language levels. Splitting `CONTACT` out lifted total recall from 0.24 to
 * this value.
 */
export const PROFILE_FLOOR = 0.32;

const TOP_K = 6;

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export type ProfileRetrieval = {
  kept: ProfileHit[];
  /** Below the floor. Never sent to the model, and returned only so the
   *  interface can say how close the near misses were. */
  rejected: ProfileHit[];
};

export async function retrieveProfile(query: string): Promise<ProfileRetrieval> {
  const vector = await embedOne(query);

  const scored: ProfileHit[] = ENTRIES.map((entry) => ({
    ref: entry.ref,
    title: entry.title,
    text: entry.text,
    similarity: dot(vector, entry.embedding),
  })).sort((a, b) => b.similarity - a.similarity);

  const top = scored.slice(0, TOP_K);

  return {
    kept: top.filter((hit) => hit.similarity >= PROFILE_FLOOR),
    rejected: top.filter((hit) => hit.similarity < PROFILE_FLOOR),
  };
}
