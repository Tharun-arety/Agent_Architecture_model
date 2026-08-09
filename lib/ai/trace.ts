/**
 * The per-turn trace: what happened, how long it took, what it cost.
 *
 * Built by the pipeline as it runs and emitted on its own SSE frame at the end,
 * so the Inspector drawer renders measurements rather than a story about them.
 * Nothing here is reconstructed after the fact — every number is recorded at
 * the moment the thing it describes happened.
 */

import { priceUsd } from "@/lib/config";
import type { GuardrailVerdict } from "@/lib/ai/guardrails/types";
import type { Usage } from "@/lib/ai/openai";
import type { ToolAttempt } from "@/lib/ai/tools/registry";

export type StageName =
  | "input_guardrails"
  | "router"
  | "tool_loop"
  | "grounding"
  | "synthesis";

export type Stage = { name: StageName; durationMs: number; usage?: Usage };

export type RetrievalTrace = {
  floor: number;
  kept: { sourceRef: string; docTitle: string; sourceUrl: string; similarity: number }[];
  rejected: { sourceRef: string; similarity: number }[];
};

export type TurnTrace = {
  intent: string;
  routerRationale: string;
  stages: Stage[];
  guardrails: GuardrailVerdict[];
  toolAttempts: ToolAttempt[];
  retrieval: RetrievalTrace | null;
  totals: {
    durationMs: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    modelCalls: number;
  };
  /** True when the turn ended in a deterministic refusal rather than an answer.
   *  Kept explicit so the inspector can say *which* guardrail stopped it. */
  refusedBy: string | null;
};

export class TraceBuilder {
  private started = performance.now();
  private stages: Stage[] = [];
  private guardrails: GuardrailVerdict[] = [];
  private toolAttempts: ToolAttempt[] = [];
  private retrieval: RetrievalTrace | null = null;
  private intent = "general";
  private rationale = "";
  private refusedBy: string | null = null;

  stage<T>(name: StageName, fn: () => Promise<T>): Promise<T>;
  stage(name: StageName, durationMs: number, usage?: Usage): void;
  stage<T>(
    name: StageName,
    fnOrDuration: (() => Promise<T>) | number,
    usage?: Usage,
  ): Promise<T> | void {
    if (typeof fnOrDuration === "number") {
      this.stages.push({ name, durationMs: fnOrDuration, usage });
      return;
    }
    const started = performance.now();
    return fnOrDuration().finally(() => {
      this.stages.push({ name, durationMs: performance.now() - started });
    });
  }

  /** Attach usage to the most recent stage of that name. Called after a model
   *  call returns, because usage is only known then. */
  attachUsage(name: StageName, usage: Usage): void {
    for (let i = this.stages.length - 1; i >= 0; i--) {
      if (this.stages[i].name === name) {
        const existing = this.stages[i].usage;
        this.stages[i].usage = existing
          ? {
              model: usage.model,
              inputTokens: existing.inputTokens + usage.inputTokens,
              outputTokens: existing.outputTokens + usage.outputTokens,
            }
          : usage;
        return;
      }
    }
    this.stages.push({ name, durationMs: 0, usage });
  }

  guardrail(...verdicts: GuardrailVerdict[]): void {
    this.guardrails.push(...verdicts);
  }

  tool(attempt: ToolAttempt): void {
    this.toolAttempts.push(attempt);
  }

  setRoute(intent: string, rationale: string): void {
    this.intent = intent;
    this.rationale = rationale;
  }

  setRetrieval(trace: RetrievalTrace): void {
    this.retrieval = trace;
  }

  refuse(guardrailId: string): void {
    this.refusedBy = guardrailId;
  }

  build(): TurnTrace {
    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;
    let modelCalls = 0;

    for (const stage of this.stages) {
      if (!stage.usage) continue;
      modelCalls += 1;
      inputTokens += stage.usage.inputTokens;
      outputTokens += stage.usage.outputTokens;
      costUsd += priceUsd(stage.usage.model, stage.usage.inputTokens, stage.usage.outputTokens);
    }

    return {
      intent: this.intent,
      routerRationale: this.rationale,
      stages: this.stages.map((s) => ({ ...s, durationMs: Math.round(s.durationMs) })),
      guardrails: this.guardrails.map((v) => ({ ...v, latencyMs: Math.round(v.latencyMs * 100) / 100 })),
      toolAttempts: this.toolAttempts,
      retrieval: this.retrieval,
      totals: {
        durationMs: Math.round(performance.now() - this.started),
        inputTokens,
        outputTokens,
        // Sub-cent turns: six places or the inspector shows $0.00 for
        // everything and the number stops being informative.
        costUsd: Math.round(costUsd * 1_000_000) / 1_000_000,
        modelCalls,
      },
      refusedBy: this.refusedBy,
    };
  }
}
