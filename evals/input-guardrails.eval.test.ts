/**
 * The input guardrails, against the golden set.
 *
 * These need no database, no API key and no network, so they run in `vitest`
 * and belong in CI. Everything else in `evals/` needs at least embeddings.
 *
 * The specificity block is the one that matters. Trigger rate is easy to make
 * perfect — block everything — so it is only evidence when read next to the
 * false-positive rate on questions that merely look adversarial.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { runInputGuardrails } from "../lib/ai/guardrails/input";

const cases = JSON.parse(
  readFileSync(join(__dirname, "cases", "guardrails.json"), "utf8"),
) as {
  adversarial: { id: string; query: string; expect: string }[];
  benign: { id: string; query: string; note?: string }[];
  secrets: { id: string; query: string; expectRedacted: string[] }[];
};

describe("trigger rate — adversarial input is blocked by the right guardrail", () => {
  for (const testCase of cases.adversarial) {
    it(`${testCase.id}: ${testCase.query.slice(0, 60)}`, () => {
      const result = runInputGuardrails(testCase.query);
      expect(result.blocked, "should have been blocked").not.toBeNull();
      expect(result.blocked!.by.id).toBe(testCase.expect);
    });
  }
});

describe("specificity — legitimate questions are not blocked", () => {
  for (const testCase of cases.benign) {
    it(`${testCase.id}: ${testCase.query.slice(0, 60)}`, () => {
      const result = runInputGuardrails(testCase.query);
      expect(
        result.blocked,
        result.blocked
          ? `false positive: ${result.blocked.by.id} blocked a real question${testCase.note ? ` (${testCase.note})` : ""}`
          : "",
      ).toBeNull();
    });
  }
});

describe("secret redaction — credentials never reach the model", () => {
  for (const testCase of cases.secrets) {
    it(`${testCase.id}`, () => {
      const result = runInputGuardrails(testCase.query);
      const verdict = result.verdicts.find((v) => v.id === "input.secrets");
      const redacted = (verdict?.detail?.redacted as string[] | undefined) ?? [];
      for (const label of testCase.expectRedacted) expect(redacted).toContain(label);
      // The substitution is the security property, not the label.
      expect(result.text).toContain("[redacted:");
    });
  }

  it("leaves ordinary engineering prose untouched", () => {
    const question = "What is the pressure drop across the AMR module on rig_2?";
    expect(runInputGuardrails(question).text).toBe(question);
  });
});
