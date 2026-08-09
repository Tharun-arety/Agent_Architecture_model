/**
 * One shape for every guardrail verdict, whichever layer produced it.
 *
 * A verdict is recorded whether it passed or failed. A pipeline that only logs
 * its blocks cannot answer the question that actually matters about a
 * guardrail — how often does it fire on traffic that was fine? — so the false
 * positive rate would be unmeasurable, and the eval suite exists to measure it.
 */

export type GuardrailId =
  | "input.secrets"
  | "input.injection"
  | "input.domain"
  | "args.schema"
  | "args.bounds"
  | "grounding.floor"
  | "grounding.citations";

export const GUARDRAIL_LABELS: Record<GuardrailId, string> = {
  "input.secrets": "Secret redaction",
  "input.injection": "Prompt-injection filter",
  "input.domain": "Domain constraint",
  "args.schema": "Tool argument schema",
  "args.bounds": "Tool argument bounds",
  "grounding.floor": "Retrieval similarity floor",
  "grounding.citations": "Citation check",
};

export type GuardrailVerdict = {
  id: GuardrailId;
  passed: boolean;
  /** One sentence, shown to the user when the verdict is what stopped the turn.
   *  Written to be read by a person, not parsed. */
  reason?: string;
  /** Whatever the check measured — the matched pattern, the score against the
   *  floor, the field that failed. This is what the inspector expands into. */
  detail?: Record<string, unknown>;
  latencyMs: number;
};

export const pass = (
  id: GuardrailId,
  latencyMs: number,
  detail?: Record<string, unknown>,
): GuardrailVerdict => ({ id, passed: true, latencyMs, detail });

export const fail = (
  id: GuardrailId,
  latencyMs: number,
  reason: string,
  detail?: Record<string, unknown>,
): GuardrailVerdict => ({ id, passed: false, latencyMs, reason, detail });

/** Deterministic refusals. Constants rather than inline strings because the
 *  eval suite asserts on them exactly, and a reworded refusal that silently
 *  stops matching its test is a regression nobody notices. */
export const REFUSAL = {
  offTopic:
    "System restricted to MAGNOTHERM test rig data and engineering documentation.",
  injection:
    "That request looks like an attempt to change my instructions rather than a question about the engineering data, so I have not acted on it. Ask about the corpus or the test rigs and I will.",
  ungrounded:
    "No verified patent or technical documentation matches this query with sufficient confidence.",
  argsExhausted:
    "I could not construct a valid query for that. Check the rig name and the date range — the seeded data covers a fixed window, and rig ids look like rig_1, rig_2, rig_3.",
} as const;
