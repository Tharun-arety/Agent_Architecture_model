/**
 * Sweeps the profile agent's similarity floor.
 *
 *   npx tsx evals/calibrate-profile.ts
 *
 * Same method as `evals/calibrate.ts` for the document corpus, and the same
 * reason: a floor picked because it sounds cautious is a guess, and this one
 * decides whether a visitor gets an answer or a refusal.
 *
 * Two numbers matter and they pull against each other. Recall is the share of
 * in-corpus questions that surface a passage that can actually answer them.
 * Leak is the share of off-corpus questions that clear the floor at all, which
 * is what lets the agent be talked into answering something it knows nothing
 * about. The floor belongs at the top of the range where recall is still total
 * and leak is still zero.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import "../scripts/lib/env";
import corpus from "../data/profile-corpus.json";
import { embed } from "../lib/ai/openai";

type Entry = { ref: string; title: string; text: string; embedding: number[] };
type Golden = {
  inCorpus: { query: string; expect: string[] }[];
  offCorpus: { query: string }[];
};

/** Mirrors `TOP_K` in lib/profile/retrieve.ts. Calibrating against a different
 *  depth than the route uses would measure a system nobody runs. */
const TOP_K = 6;

const CANDIDATES = [0.18, 0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.4];

const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);

async function main() {
  const entries = corpus.entries as Entry[];
  const golden: Golden = JSON.parse(
    await readFile(join(process.cwd(), "evals", "cases", "profile.json"), "utf8"),
  );

  const queries = [...golden.inCorpus.map((c) => c.query), ...golden.offCorpus.map((c) => c.query)];
  console.log(`Embedding ${queries.length} golden queries…`);
  const { vectors } = await embed(queries);

  const rank = (vector: number[]) =>
    entries
      .map((entry) => ({ ref: entry.ref, similarity: dot(vector, entry.embedding) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, TOP_K);

  const inRanked = golden.inCorpus.map((c, i) => ({ ...c, ranked: rank(vectors[i]) }));
  const offRanked = golden.offCorpus.map((c, i) => ({
    ...c,
    ranked: rank(vectors[golden.inCorpus.length + i]),
  }));

  console.log(`\nfloor   recall   leak   note`);
  const rows = CANDIDATES.map((floor) => {
    const hits = inRanked.filter((c) =>
      c.ranked.some((r) => r.similarity >= floor && c.expect.includes(r.ref)),
    ).length;
    const leaks = offRanked.filter((c) => c.ranked.some((r) => r.similarity >= floor)).length;
    return {
      floor,
      recall: hits / inRanked.length,
      leak: leaks / offRanked.length,
      leakCount: leaks,
    };
  });

  for (const row of rows) {
    const bar = "#".repeat(Math.round(row.recall * 20)).padEnd(20, ".");
    const note = row.leakCount ? `LEAK ${(row.leak * 100).toFixed(0)}% (${row.leakCount})` : "";
    console.log(
      `${row.floor.toFixed(3)}  ${(row.recall * 100).toFixed(0).padStart(4)}%   ${bar}  ${note}`,
    );
  }

  const clean = rows.filter((r) => r.recall === 1 && r.leak === 0);
  if (clean.length) {
    const best = clean[clean.length - 1];
    console.log(
      `\nTotal recall with no leak from ${clean[0].floor.toFixed(3)} to ${best.floor.toFixed(3)}.`,
    );
    console.log(`Set PROFILE_FLOOR to ${best.floor.toFixed(2)}: the highest floor that costs nothing.`);
  } else {
    console.log("\nNo floor gives total recall with zero leak. Widen the corpus or the golden set.");
  }

  // The near misses are where the next corpus gap is.
  console.log("\nWeakest in-corpus questions, by best matching score:");
  const weakest = inRanked
    .map((c) => ({
      query: c.query,
      best: Math.max(...c.ranked.filter((r) => c.expect.includes(r.ref)).map((r) => r.similarity), 0),
    }))
    .sort((a, b) => a.best - b.best)
    .slice(0, 5);
  for (const row of weakest) console.log(`  ${row.best.toFixed(3)}  ${row.query}`);

  console.log("\nHighest off-corpus scores, which is what the floor has to sit above:");
  const strongest = offRanked
    .map((c) => ({ query: c.query, best: c.ranked[0]?.similarity ?? 0 }))
    .sort((a, b) => b.best - a.best)
    .slice(0, 5);
  for (const row of strongest) console.log(`  ${row.best.toFixed(3)}  ${row.query}`);
}

main().catch((cause) => {
  console.error(cause);
  process.exit(1);
});
