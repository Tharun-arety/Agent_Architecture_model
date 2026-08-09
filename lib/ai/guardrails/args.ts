/**
 * Tool-argument guardrail. Two gates, in order:
 *
 *   args.schema  — ajv, compiled against the *same* JSON Schema literal that
 *                  was handed to the model. One source of truth, so the model
 *                  can never be told one contract and judged against another.
 *   args.bounds  — the semantic checks a schema cannot express: does this rig
 *                  exist, does this date fall inside the recorded window.
 *
 * A rejection is not an error. It is a `tool` message containing the reason,
 * appended to the transcript so the model reads its own mistake and corrects
 * it on the next iteration. That is the difference between a guardrail and a
 * crash: the turn still ends with an answer.
 *
 * The retry budget is finite (`AGENT_MAX_ARG_RETRIES`). Without it a model that
 * keeps guessing `rig_999` would spend the whole iteration ceiling being told
 * no, and the user would wait through all of it for a timeout.
 */

import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

import type { ToolSpec } from "@/lib/ai/tools/registry";
import { type GuardrailVerdict, fail, pass } from "./types";

// `allErrors` so a call with two bad fields is corrected in one round trip
// rather than two. `coerceTypes` is off on purpose: silently turning the string
// "3" into the number 3 hides the fact that the model emitted the wrong type,
// and that is a signal worth keeping.
const ajv = new Ajv({ allErrors: true, strict: false, coerceTypes: false });
addFormats(ajv);

const compiled = new Map<string, ValidateFunction>();

function validatorFor(spec: ToolSpec): ValidateFunction {
  let validate = compiled.get(spec.name);
  if (!validate) {
    validate = ajv.compile(spec.parameters);
    compiled.set(spec.name, validate);
  }
  return validate;
}

export type ArgCheck = {
  verdicts: GuardrailVerdict[];
  /** Present only when both gates passed. Normalised by `bounds`, so the
   *  handler receives clamped and canonicalised values rather than raw ones. */
  args?: Record<string, unknown>;
  /** Handed to the model verbatim when a gate rejected the call. */
  message?: string;
};

export async function validateToolCall(
  spec: ToolSpec,
  rawArgs: unknown,
): Promise<ArgCheck> {
  const verdicts: GuardrailVerdict[] = [];

  // --- Gate 1: schema ------------------------------------------------------
  const schemaStarted = performance.now();
  const args = (rawArgs && typeof rawArgs === "object" ? rawArgs : {}) as Record<string, unknown>;
  const validate = validatorFor(spec);
  const schemaOk = validate(args);
  const schemaLatency = performance.now() - schemaStarted;

  if (!schemaOk) {
    const problems = (validate.errors ?? []).map((error) => {
      const where = error.instancePath || "(root)";
      return `${where} ${error.message ?? "is invalid"}`.trim();
    });
    const message =
      `Your call to ${spec.name} did not match its schema: ${problems.join("; ")}. ` +
      "Re-read the tool definition and call it again with corrected arguments.";
    verdicts.push(
      fail("args.schema", schemaLatency, message, {
        tool: spec.name,
        supplied: args,
        problems,
      }),
    );
    return { verdicts, message };
  }
  verdicts.push(pass("args.schema", schemaLatency, { tool: spec.name }));

  // --- Gate 2: bounds ------------------------------------------------------
  if (!spec.bounds) return { verdicts, args };

  const boundsStarted = performance.now();
  const result = await spec.bounds(args);
  const boundsLatency = performance.now() - boundsStarted;

  if (!result.ok) {
    const message = result.message ?? `Arguments for ${spec.name} are out of bounds.`;
    verdicts.push(
      fail("args.bounds", boundsLatency, message, {
        tool: spec.name,
        supplied: args,
        ...(result.detail ?? {}),
      }),
    );
    return { verdicts, message };
  }

  verdicts.push(pass("args.bounds", boundsLatency, { tool: spec.name }));
  return { verdicts, args: result.value ?? args };
}
