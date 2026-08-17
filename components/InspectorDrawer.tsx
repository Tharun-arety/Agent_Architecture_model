"use client";

/**
 * The inspector: the turn, measured.
 *
 * Everything here is recorded while the turn runs and carried on the `trace`
 * frame. Nothing is estimated and nothing is scored after the fact. In
 * particular there is no faithfulness number: faithfulness is judged offline by
 * `npm run eval:full`, and rendering a live figure that was never computed is
 * exactly the failure this project argues against. The eval scores are linked
 * from the header instead.
 *
 * Styled as a readout strip rather than a settings accordion: the four headline
 * figures are always visible, and the detail is behind engraved section legends
 * in the same language as the rest of the panel.
 */

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { GUARDRAIL_LABELS, type GuardrailVerdict, type StageName, type TurnTrace } from "@/lib/types";

const STAGE_LABELS: Record<StageName, string> = {
  input_guardrails: "Input guardrails",
  router: "Router",
  tool_loop: "Tool loop",
  grounding: "Grounding",
  synthesis: "Synthesis",
};

function Section({
  title,
  meta,
  tone = "normal",
  children,
  defaultOpen = false,
}: {
  title: string;
  meta?: React.ReactNode;
  tone?: "normal" | "alert";
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-rule border-t">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="hover:bg-raised/50 flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left transition-colors"
      >
        <ChevronRight
          className={`text-faint size-2.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className={`micro ${tone === "alert" ? "text-hot" : ""}`}>{title}</span>
        <span className="tnum text-faint ml-auto shrink-0 font-mono text-[10px]">{meta}</span>
      </button>
      {open && <div className="px-2.5 pb-2.5">{children}</div>}
    </div>
  );
}

function GuardrailRow({ verdict }: { verdict: GuardrailVerdict }) {
  const [open, setOpen] = React.useState(false);
  const redacted =
    verdict.passed && verdict.id === "input.secrets" && Boolean(verdict.detail?.redacted);

  const tone = !verdict.passed ? "text-hot" : redacted ? "text-warm" : "text-cold";
  const glyph = !verdict.passed ? "✕" : redacted ? "◐" : "✓";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="hover:bg-raised/60 flex w-full cursor-pointer items-center gap-2 py-0.5 text-left transition-colors"
      >
        <span className={`w-3 shrink-0 font-mono text-[10px] ${tone}`}>{glyph}</span>
        <span className="text-dim min-w-0 flex-1 truncate text-[10px]">
          {GUARDRAIL_LABELS[verdict.id] ?? verdict.id}
        </span>
        <span className="tnum text-faint shrink-0 font-mono text-[9px]">
          {verdict.latencyMs.toFixed(1)}ms
        </span>
      </button>
      {open && (
        <div className="border-rule mt-1 mb-1.5 ml-3 space-y-1 border-l pl-2">
          {verdict.reason && (
            <p className="text-dim text-[10px] leading-relaxed">{verdict.reason}</p>
          )}
          {verdict.detail && (
            <pre className="bg-inset text-faint overflow-x-auto p-1.5 font-mono text-[9px] leading-relaxed">
              {JSON.stringify(verdict.detail, null, 1)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export function InspectorDrawer({
  trace,
  guardrails,
}: {
  trace?: TurnTrace;
  /** Verdicts that arrived before the trace did, shown while streaming. */
  guardrails?: GuardrailVerdict[];
}) {
  const verdicts = trace?.guardrails ?? guardrails ?? [];

  if (!trace) {
    return verdicts.length ? (
      <div className="border-rule bg-panel mt-2 border px-2.5 py-1.5">
        {verdicts.map((verdict, i) => (
          <GuardrailRow key={`${verdict.id}-${i}`} verdict={verdict} />
        ))}
      </div>
    ) : null;
  }

  const { totals, stages, toolAttempts, retrieval } = trace;
  const slowest = Math.max(...stages.map((s) => s.durationMs), 1);
  const blocked = verdicts.filter((v) => !v.passed).length;
  const rejectedCalls = toolAttempts.filter((a) => !a.accepted).length;

  return (
    <div className="border-rule bg-panel mt-2 border">
      {/* Four figures, always visible. Everything else is one click away. */}
      <div className="border-rule grid grid-cols-2 gap-px border-b bg-[var(--color-rule)] sm:grid-cols-4">
        <Figure value={`${totals.durationMs}`} unit="ms" label="wall clock" />
        <Figure
          value={totals.costUsd < 0.00001 ? "0" : totals.costUsd.toFixed(5)}
          unit="usd"
          label={`${totals.modelCalls} model call${totals.modelCalls === 1 ? "" : "s"}`}
        />
        <Figure value={trace.intent} label={trace.refusedBy ? "refused" : "routed"} mono={false} />
        <Figure
          value={`${verdicts.length - blocked}/${verdicts.length}`}
          label="guardrails"
          tone={blocked ? "hot" : "cold"}
        />
      </div>

      <Section title="Latency by stage" meta={`${totals.durationMs}ms`}>
        <div className="space-y-1.5">
          {stages.map((stage, i) => (
            <div key={`${stage.name}-${i}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-dim text-[10px]">
                  {STAGE_LABELS[stage.name] ?? stage.name}
                </span>
                <span className="tnum text-faint font-mono text-[9px]">
                  {stage.durationMs}ms
                  {stage.usage && ` · ${stage.usage.inputTokens}→${stage.usage.outputTokens}t`}
                </span>
              </div>
              <div className="bg-inset mt-0.5 h-0.5 w-full">
                <div
                  className="bg-cold/60 h-full"
                  style={{ width: `${Math.max(1, Math.round((stage.durationMs / slowest) * 100))}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-faint pt-1 font-mono text-[9px]">
            {totals.inputTokens} in · {totals.outputTokens} out
          </p>
        </div>
      </Section>

      <Section
        title="Guardrails"
        tone={blocked ? "alert" : "normal"}
        meta={blocked ? `${blocked} blocked` : `${verdicts.length} passed`}
        defaultOpen={blocked > 0}
      >
        <div>
          {verdicts.map((verdict, i) => (
            <GuardrailRow key={`${verdict.id}-${i}`} verdict={verdict} />
          ))}
          {trace.refusedBy && (
            <p className="border-hot/40 bg-hot/5 text-hot mt-2 border-l-2 py-1 pl-2 text-[10px] leading-relaxed">
              Refused by <span className="font-mono">{trace.refusedBy}</span>. No further model
              calls were made.
            </p>
          )}
        </div>
      </Section>

      <Section title="Routing" meta={trace.intent}>
        <p className="text-dim text-[10px] leading-relaxed">
          {trace.routerRationale || "No rationale returned."}
        </p>
      </Section>

      {toolAttempts.length > 0 && (
        <Section
          title="Tool calls"
          tone={rejectedCalls ? "alert" : "normal"}
          meta={`${toolAttempts.length - rejectedCalls}/${toolAttempts.length} accepted`}
          defaultOpen={rejectedCalls > 0}
        >
          <div className="space-y-1.5">
            {toolAttempts.map((attempt, i) => (
              <div
                key={i}
                className={`border-l-2 pl-2 ${
                  attempt.accepted ? "border-cold/40" : "border-hot/60"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-ink font-mono text-[10px]">{attempt.name}</span>
                  <span className="tnum text-faint font-mono text-[9px]">
                    {attempt.durationMs}ms
                  </span>
                </div>
                <pre className="text-faint mt-0.5 overflow-x-auto font-mono text-[9px]">
                  {JSON.stringify(attempt.arguments)}
                </pre>
                {attempt.error && (
                  <p className="text-hot mt-1 text-[10px] leading-relaxed">{attempt.error}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {retrieval && (
        <Section
          title="Retrieval"
          meta={`${retrieval.kept.length} above floor ${retrieval.floor.toFixed(2)}`}
        >
          <div className="space-y-0.5">
            {retrieval.kept.map((hit, i) => (
              <div key={`k-${i}`} className="flex items-baseline gap-2 text-[10px]">
                <span className="tnum text-cold w-9 shrink-0 font-mono">
                  {hit.similarity.toFixed(3)}
                </span>
                <span className="text-dim min-w-0 flex-1 truncate">{hit.docTitle}</span>
                <span className="text-faint shrink-0 font-mono text-[9px]">{hit.sourceRef}</span>
              </div>
            ))}
            {retrieval.rejected.length > 0 && <div className="threshold my-1.5" />}
            {retrieval.rejected.map((hit, i) => (
              <div key={`r-${i}`} className="flex items-baseline gap-2 text-[10px] opacity-55">
                <span className="tnum text-hot w-9 shrink-0 font-mono">
                  {hit.similarity.toFixed(3)}
                </span>
                <span className="text-faint min-w-0 flex-1 truncate">below floor</span>
                <span className="text-faint shrink-0 font-mono text-[9px]">{hit.sourceRef}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Figure({
  value,
  unit,
  label,
  tone,
  mono = true,
}: {
  value: string;
  unit?: string;
  label: string;
  tone?: "cold" | "hot";
  mono?: boolean;
}) {
  const colour = tone === "hot" ? "text-hot" : tone === "cold" ? "text-cold" : "text-ink";
  return (
    <div className="bg-panel px-2.5 py-1.5">
      <div className="flex items-baseline gap-1">
        <span className={`tnum truncate ${mono ? "font-mono" : ""} text-[13px] ${colour}`}>
          {value}
        </span>
        {unit && <span className="text-faint font-mono text-[9px]">{unit}</span>}
      </div>
      <div className="micro mt-0.5 truncate">{label}</div>
    </div>
  );
}
