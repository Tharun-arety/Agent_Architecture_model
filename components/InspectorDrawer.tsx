"use client";

/**
 * The Inspector.
 *
 * Everything here is measured during the turn and carried on the `trace` frame.
 * Nothing is estimated, and nothing is scored after the fact — in particular
 * there is no faithfulness number, because faithfulness is judged offline by
 * `npm run eval:full` and rendering a live figure that was never computed is
 * exactly the failure this project argues against. The eval scores are linked
 * instead.
 */

import * as React from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Route,
  ShieldCheck,
  ShieldX,
  Wrench,
  X,
} from "lucide-react";

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
  icon,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-border border-t first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-fg-muted hover:text-fg flex w-full items-center gap-1.5 px-3 py-2 text-left text-[11px] font-medium transition"
      >
        <ChevronRight
          className={`size-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="text-fg-subtle shrink-0">{icon}</span>
        <span className="min-w-0 flex-1">{title}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function Bar({ fraction }: { fraction: number }) {
  return (
    <div className="bg-surface-muted h-1 w-full overflow-hidden rounded-full">
      <div
        className="bg-accent h-full rounded-full"
        style={{ width: `${Math.max(1, Math.round(fraction * 100))}%` }}
      />
    </div>
  );
}

function GuardrailChip({ verdict }: { verdict: GuardrailVerdict }) {
  const [open, setOpen] = React.useState(false);
  const redacted =
    verdict.passed && verdict.id === "input.secrets" && Boolean(verdict.detail?.redacted);

  const tone = !verdict.passed
    ? "border-danger/40 bg-danger/10 text-danger"
    : redacted
      ? "border-warn/40 bg-warn/10 text-warn"
      : "border-border bg-surface-muted text-fg-muted";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-1.5 rounded border px-1.5 py-1 text-left text-[10px] transition ${tone}`}
      >
        {verdict.passed ? (
          redacted ? (
            <AlertTriangle className="size-2.5 shrink-0" />
          ) : (
            <Check className="size-2.5 shrink-0" />
          )
        ) : (
          <X className="size-2.5 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate">{GUARDRAIL_LABELS[verdict.id] ?? verdict.id}</span>
        <span className="tnum text-fg-subtle shrink-0">{verdict.latencyMs.toFixed(1)}ms</span>
      </button>
      {open && (
        <div className="text-fg-subtle mt-1 space-y-1 pl-2 text-[10px] leading-relaxed">
          {verdict.reason && <p className="text-fg-muted">{verdict.reason}</p>}
          {verdict.detail && (
            <pre className="bg-bg border-border overflow-x-auto rounded border p-1.5 font-mono">
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
  /** Verdicts that arrived before the trace did — shown while streaming. */
  guardrails?: GuardrailVerdict[];
}) {
  const verdicts = trace?.guardrails ?? guardrails ?? [];

  if (!trace) {
    return verdicts.length ? (
      <div className="border-border bg-surface mt-2 space-y-1 rounded-md border p-2">
        {verdicts.map((verdict, i) => (
          <GuardrailChip key={`${verdict.id}-${i}`} verdict={verdict} />
        ))}
      </div>
    ) : null;
  }

  const { totals, stages, toolAttempts, retrieval } = trace;
  const slowest = Math.max(...stages.map((s) => s.durationMs), 1);
  const blocked = verdicts.filter((v) => !v.passed).length;

  return (
    <div className="border-border bg-surface mt-2 overflow-hidden rounded-md border text-[11px]">
      {/* Headline row: the four numbers worth seeing without expanding. */}
      <div className="border-border grid grid-cols-4 gap-px border-b bg-[var(--color-border)]">
        {[
          { icon: <Clock className="size-3" />, value: `${totals.durationMs}ms`, label: "latency" },
          {
            icon: <Coins className="size-3" />,
            value: `$${totals.costUsd.toFixed(5)}`,
            label: `${totals.modelCalls} call${totals.modelCalls === 1 ? "" : "s"}`,
          },
          {
            icon: <Route className="size-3" />,
            value: trace.intent,
            label: trace.refusedBy ? "refused" : "routed",
          },
          {
            icon: blocked ? <ShieldX className="size-3" /> : <ShieldCheck className="size-3" />,
            value: `${verdicts.length - blocked}/${verdicts.length}`,
            label: "guardrails",
          },
        ].map((cell, i) => (
          <div key={i} className="bg-surface px-2 py-1.5">
            <div
              className={`flex items-center gap-1 ${
                i === 3 && blocked ? "text-danger" : "text-accent"
              }`}
            >
              {cell.icon}
              <span className="tnum truncate font-medium">{cell.value}</span>
            </div>
            <div className="text-fg-subtle mt-0.5 text-[10px]">{cell.label}</div>
          </div>
        ))}
      </div>

      <Section
        title={`Latency by stage · ${totals.durationMs}ms`}
        icon={<Clock className="size-3" />}
      >
        <div className="space-y-1.5">
          {stages.map((stage, i) => (
            <div key={`${stage.name}-${i}`}>
              <div className="text-fg-muted flex justify-between text-[10px]">
                <span>{STAGE_LABELS[stage.name] ?? stage.name}</span>
                <span className="tnum">
                  {stage.durationMs}ms
                  {stage.usage
                    ? ` · ${stage.usage.inputTokens}→${stage.usage.outputTokens} tok`
                    : ""}
                </span>
              </div>
              <Bar fraction={stage.durationMs / slowest} />
            </div>
          ))}
          <p className="text-fg-subtle pt-1 text-[10px]">
            {totals.inputTokens} input + {totals.outputTokens} output tokens across{" "}
            {totals.modelCalls} model call{totals.modelCalls === 1 ? "" : "s"}.
          </p>
        </div>
      </Section>

      <Section
        title={
          <>
            Guardrails · {verdicts.length - blocked} passed
            {blocked > 0 && <span className="text-danger"> · {blocked} blocked</span>}
          </>
        }
        icon={blocked ? <ShieldX className="size-3" /> : <ShieldCheck className="size-3" />}
        defaultOpen={blocked > 0}
      >
        <div className="space-y-1">
          {verdicts.map((verdict, i) => (
            <GuardrailChip key={`${verdict.id}-${i}`} verdict={verdict} />
          ))}
          {trace.refusedBy && (
            <p className="text-danger border-danger/30 bg-danger/5 mt-1.5 rounded border px-1.5 py-1 text-[10px]">
              Turn refused by <span className="font-mono">{trace.refusedBy}</span>. No further model
              calls were made.
            </p>
          )}
        </div>
      </Section>

      <Section
        title={`Routing → ${trace.intent}`}
        icon={<Route className="size-3" />}
      >
        <p className="text-fg-muted text-[10px] leading-relaxed">
          {trace.routerRationale || "No rationale returned."}
        </p>
      </Section>

      {toolAttempts.length > 0 && (
        <Section
          title={`Tool calls · ${toolAttempts.filter((a) => a.accepted).length}/${toolAttempts.length} accepted`}
          icon={<Wrench className="size-3" />}
          defaultOpen={toolAttempts.some((a) => !a.accepted)}
        >
          <div className="space-y-1.5">
            {toolAttempts.map((attempt, i) => (
              <div
                key={i}
                className={`rounded border p-1.5 ${
                  attempt.accepted
                    ? "border-border bg-surface-muted"
                    : "border-danger/40 bg-danger/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px]">{attempt.name}</span>
                  <span className="tnum text-fg-subtle text-[10px]">{attempt.durationMs}ms</span>
                </div>
                <pre className="text-fg-muted mt-1 overflow-x-auto font-mono text-[10px]">
                  {JSON.stringify(attempt.arguments)}
                </pre>
                {attempt.error && (
                  <p className="text-danger mt-1 text-[10px] leading-relaxed">
                    rejected — {attempt.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {retrieval && (
        <Section
          title={`Retrieval · ${retrieval.kept.length} kept, ${retrieval.rejected.length} below floor`}
          icon={<ShieldCheck className="size-3" />}
        >
          <div className="space-y-1">
            <p className="text-fg-subtle text-[10px]">
              Cosine floor {retrieval.floor.toFixed(2)}. Passages below it never entered the context
              window.
            </p>
            {retrieval.kept.map((hit, i) => (
              <div key={`k-${i}`} className="flex items-center gap-2 text-[10px]">
                <span className="text-ok tnum w-10 shrink-0">{hit.similarity.toFixed(3)}</span>
                <span className="text-fg-muted min-w-0 flex-1 truncate">{hit.docTitle}</span>
                <span className="text-fg-subtle shrink-0 font-mono">{hit.sourceRef}</span>
              </div>
            ))}
            {retrieval.rejected.map((hit, i) => (
              <div key={`r-${i}`} className="flex items-center gap-2 text-[10px] opacity-60">
                <span className="text-danger tnum w-10 shrink-0">{hit.similarity.toFixed(3)}</span>
                <span className="text-fg-subtle min-w-0 flex-1 truncate">rejected</span>
                <span className="text-fg-subtle shrink-0 font-mono">{hit.sourceRef}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
