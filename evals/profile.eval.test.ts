/**
 * The profile agent's retrieval, asserted.
 *
 * Deterministic and free: it runs against the committed corpus vectors and the
 * committed golden queries, with no model call. The query embeddings are
 * generated once by `npm run embed:profile:eval` and committed alongside them,
 * for the same reason the corpus is: an eval that needs an API key is an eval
 * that stops being run.
 *
 * What this pins down is the claim made in `lib/profile/retrieve.ts`: the floor
 * answers every real question, blocks every unrelated one outright, and lets a
 * narrow band through to the model. If a corpus edit breaks any of those, this
 * fails before anyone notices on the site.
 */

import { describe, expect, it } from "vitest";

import corpus from "../data/profile-corpus.json";
import queries from "./cases/profile-vectors.json";
import golden from "./cases/profile.json";
import { PROFILE_FLOOR } from "../lib/profile/retrieve";

type Entry = { ref: string; embedding: number[] };

const ENTRIES = corpus.entries as Entry[];
const VECTORS = queries.vectors as Record<string, number[]>;
const TOP_K = 6;

const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);

function rank(query: string) {
  const vector = VECTORS[query];
  if (!vector) throw new Error(`No committed embedding for "${query}". Re-run the vector script.`);
  return ENTRIES.map((entry) => ({ ref: entry.ref, similarity: dot(vector, entry.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_K);
}

/** Genuinely unrelated. These must clear nothing, so no model call happens. */
const UNRELATED = [
  "What is the capital of France?",
  "Write me a poem about the sea",
  "Explain how a diesel engine works",
  "Does he have children?",
  "What did he have for breakfast?",
];

describe("profile retrieval: every real question is answerable", () => {
  for (const testCase of golden.inCorpus) {
    it(`${testCase.query}`, () => {
      const above = rank(testCase.query).filter((row) => row.similarity >= PROFILE_FLOOR);
      const matched = above.filter((row) => testCase.expect.includes(row.ref));
      expect(
        matched.length,
        `nothing from ${testCase.expect.join("/")} cleared ${PROFILE_FLOOR}`,
      ).toBeGreaterThan(0);
    });
  }
});

describe("profile retrieval: unrelated questions clear nothing", () => {
  for (const query of UNRELATED) {
    it(`${query}`, () => {
      const above = rank(query).filter((row) => row.similarity >= PROFILE_FLOOR);
      expect(above.map((row) => row.ref), "should have been refused before any model call").toEqual(
        [],
      );
    });
  }
});

describe("profile corpus", () => {
  it("has an embedding for every passage", () => {
    expect(ENTRIES.every((entry) => entry.embedding?.length === corpus.dimensions)).toBe(true);
  });

  it("has no duplicate refs, since a ref is a citation handle", () => {
    const refs = ENTRIES.map((entry) => entry.ref);
    expect(new Set(refs).size).toBe(refs.length);
  });
});
