/**
 * The tool registry: one declaration, several consumers.
 *
 * A `ToolSpec` carries the JSON Schema that is handed to the model *and*
 * compiled by the argument guardrail. One literal, two consumers — which is the
 * whole reason this project validates with `ajv` rather than a separate schema
 * library. A second schema in another notation is a second source of truth, and
 * the two drift silently: the model gets told one thing and the validator
 * enforces another, which shows up as an agent that "randomly" fails.
 *
 * `bounds` is the part a schema cannot express. `rig_id` being a string is a
 * schema question; `rig_id` naming a rig that exists is a database question,
 * and it is the one that actually stops a bad query.
 */

import type { GuardrailVerdict } from "@/lib/ai/guardrails/types";

export type ToolDomain = "knowledge" | "telemetry";

export type BoundsResult = {
  ok: boolean;
  /** Human-readable, and handed back to the model verbatim so it can correct
   *  itself. "Unknown rig 'rig_999'. Known rigs: rig_1, rig_2, rig_3." teaches;
   *  "invalid argument" does not. */
  message?: string;
  detail?: Record<string, unknown>;
  /** Normalised arguments — a bounds check may clamp rather than reject. */
  value?: Record<string, unknown>;
};

export type ToolSpec = {
  name: string;
  domain: ToolDomain;
  description: string;
  parameters: Record<string, unknown>;
  /** Semantic checks needing the database. Runs only after the schema passes. */
  bounds?: (args: Record<string, unknown>) => Promise<BoundsResult>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

export const TOOL_REGISTRY = new Map<string, ToolSpec>();

export function register(spec: ToolSpec): ToolSpec {
  if (TOOL_REGISTRY.has(spec.name)) {
    throw new Error(
      `Tool ${spec.name} is already registered. A silent overwrite would mean ` +
        "one of the two is never called, which surfaces only as an agent being " +
        "confidently wrong.",
    );
  }
  TOOL_REGISTRY.set(spec.name, spec);
  return spec;
}

export function toolsForDomain(domain: ToolDomain): ToolSpec[] {
  return [...TOOL_REGISTRY.values()].filter((spec) => spec.domain === domain);
}

export function asOpenAITool(spec: ToolSpec) {
  return {
    type: "function" as const,
    function: {
      name: spec.name,
      description: spec.description,
      parameters: spec.parameters,
    },
  };
}

/** One attempted call and what the guardrails made of it. Recorded whether it
 *  ran or was rejected — a rejected call is the interesting one. */
export type ToolAttempt = {
  name: string;
  arguments: unknown;
  accepted: boolean;
  verdicts: GuardrailVerdict[];
  durationMs: number;
  error?: string;
};
