/**
 * Grounding-floor calibration sweep.
 *
 *   npx tsx evals/calibrate.ts
 *
 * The floor is the single most consequential number in this system: too high
 * and every real question is refused, too low and the model is handed the
 * least-unrelated passage and told to answer from it. Picking it by intuition
 * is how you get a threshold nobody can defend.
 *
 * So it is measured. This sweeps candidate floors across the retrieval golden
 * set and reports, at each one:
 *
 *   recall   in-corpus questions whose expected document survives the floor
 *   leak     off-corpus questions where anything survives it
 *
 * The two move in opposite directions. The floor to pick is the widest plateau
 * where recall is at its maximum and leak is zero — the middle of that band,
 * not its edge, so that normal variation in either direction does not fall off
 * a cliff.
 *
 * Embedding calls only, so this is cheap to re-run whenever the corpus or the
 * embedding model changes. It should be re-run on both.
 */

import "../scripts/lib/env";

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "../lib/config";
import { embedOne } from "../lib/ai/openai";
import { searchKnowledge } from "../lib/db/queries";

const HERE = dirname(fileURLToPath(import.meta.url));
const K = 6;

type Cases = {
  inCorpus: { id: string; query: string; expectAnyOf: string[] }[];
  offCorpus: { id: string; query: string }[];
};

async function main(): Promise<void> {
  const cases = JSON.parse(
    await readFile(join(HERE, "cases", "retrieval.json"), "utf8"),
  ) as Cases;

  console.log(`\n  Calibrating the grounding floor — ${config.embeddingModel}, k=${K}\n`);

  // Score every case once; the sweep is then pure arithmetic over the results.
  const inCorpus: { id: string; expectedScore: number | null; topScore: number }[] = [];
  for (const testCase of cases.inCorpus) {
    const hits = await searchKnowledge(await embedOne(testCase.query), K);
    const expected = hits.filter((hit) => testCase.expectAnyOf.includes(hit.sourceRef));
    inCorpus.push({
      id: testCase.id,
      // The score the floor has to stay below for this case to pass: the best
      // score among the documents that would actually answer it.
      expectedScore: expected.length ? Math.max(...expected.map((h) => h.similarity)) : null,
      topScore: hits[0]?.similarity ?? 0,
    });
  }

  const offCorpus: { id: string; topScore: number }[] = [];
  for (const testCase of cases.offCorpus) {
    const hits = await searchKnowledge(await embedOne(testCase.query), K);
    offCorpus.push({ id: testCase.id, topScore: hits[0]?.similarity ?? 0 });
  }

  console.log("  In-corpus — score of the expected document at rank ≤ k");
  for (const row of [...inCorpus].sort((a, b) => (a.expectedScore ?? 0) - (b.expectedScore ?? 0))) {
    const score = row.expectedScore;
    console.log(
      `    ${row.id.padEnd(24)} ${score === null ? "  not in top-k" : score.toFixed(3)}` +
        `   (top hit ${row.topScore.toFixed(3)})`,
    );
  }

  console.log("\n  Off-corpus — best score of anything at all");
  for (const row of [...offCorpus].sort((a, b) => b.topScore - a.topScore)) {
    console.log(`    ${row.id.padEnd(24)} ${row.topScore.toFixed(3)}`);
  }

  const worstInCorpus = Math.min(
    ...inCorpus.filter((r) => r.expectedScore !== null).map((r) => r.expectedScore!),
  );
  const bestOffCorpus = Math.max(...offCorpus.map((r) => r.topScore));

  console.log(
    `\n  Weakest in-corpus match : ${worstInCorpus.toFixed(3)}` +
      `\n  Strongest off-corpus hit: ${bestOffCorpus.toFixed(3)}` +
      `\n  Usable band             : ${(worstInCorpus - bestOffCorpus > 0
        ? `${bestOffCorpus.toFixed(3)} … ${worstInCorpus.toFixed(3)} (width ${(worstInCorpus - bestOffCorpus).toFixed(3)})`
        : "NONE — the two distributions overlap; no single floor separates them")}\n`,
  );

  console.log("  floor   recall   leak");
  const rows: { floor: number; recall: number; leak: number }[] = [];
  for (let floor = 0.1; floor <= 0.75001; floor += 0.025) {
    const recall =
      inCorpus.filter((r) => r.expectedScore !== null && r.expectedScore >= floor).length /
      inCorpus.length;
    const leak = offCorpus.filter((r) => r.topScore >= floor).length / offCorpus.length;
    rows.push({ floor, recall, leak });

    const bar = "█".repeat(Math.round(recall * 20)).padEnd(20, "·");
    const flag = leak > 0 ? ` LEAK ${(leak * 100).toFixed(0)}%` : "";
    console.log(
      `  ${floor.toFixed(3)}  ${(recall * 100).toFixed(0).padStart(4)}%  ${bar}${flag}` +
        (Math.abs(floor - config.groundingFloor) < 0.0125 ? "   ← configured" : ""),
    );
  }

  // The widest run of floors where recall is maximal and nothing leaks.
  const best = Math.max(...rows.filter((r) => r.leak === 0).map((r) => r.recall), 0);
  const plateau = rows.filter((r) => r.leak === 0 && r.recall === best);
  if (plateau.length) {
    const lo = plateau[0].floor;
    const hi = plateau[plateau.length - 1].floor;
    const mid = Math.round(((lo + hi) / 2) * 100) / 100;
    console.log(
      `\n  Best achievable recall with zero leak: ${(best * 100).toFixed(0)}%` +
        `\n  Plateau: ${lo.toFixed(3)} … ${hi.toFixed(3)}` +
        `\n  Midpoint → GROUNDING_SIMILARITY_FLOOR=${mid.toFixed(2)}\n`,
    );
  }
}

main().catch((error) => {
  console.error("\nCalibration failed:", error);
  process.exit(1);
});
