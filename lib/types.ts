/**
 * Types shared between the pipeline and the browser.
 *
 * Re-exported from their definitions rather than restated, so a change to a
 * frame's shape is a type error in the component that renders it rather than a
 * runtime surprise.
 */

export type { GuardrailVerdict, GuardrailId } from "@/lib/ai/guardrails/types";
export { GUARDRAIL_LABELS } from "@/lib/ai/guardrails/types";
export type { Frame } from "@/lib/ai/loop";
export type { TurnTrace, Stage, StageName, RetrievalTrace } from "@/lib/ai/trace";
export type { ToolAttempt } from "@/lib/ai/tools/registry";
export type { KnowledgeHit, TelemetryResult, MetricSummary, SeriesPoint, Rig } from "@/lib/db/queries";

import type { TurnTrace } from "@/lib/ai/trace";
import type { GuardrailVerdict } from "@/lib/ai/guardrails/types";
import type { KnowledgeHit, TelemetryResult } from "@/lib/db/queries";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  /** Present on assistant turns once the run finishes. Drives the inspector. */
  trace?: TurnTrace;
  refused?: boolean;
  /** Verdicts stream in before the trace does, so they are collected here and
   *  the trace replaces them when it arrives. */
  guardrails?: GuardrailVerdict[];
};

export type KnowledgePayload = { query: string; hits: KnowledgeHit[] };

export type DashboardState = {
  telemetry: TelemetryResult | null;
  knowledge: KnowledgePayload | null;
};
