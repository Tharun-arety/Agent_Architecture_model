"use client";

import * as React from "react";
import { Activity, FlaskConical, ScanEye } from "lucide-react";

import { ChatPanel } from "@/components/ChatPanel";
import { EvalBadge } from "@/components/EvalBadge";
import { CitationList } from "@/components/CitationList";
import { TelemetryChart } from "@/components/TelemetryChart";
import type { DashboardState } from "@/lib/types";

type Health = {
  status: string;
  model: string;
  groundingFloor: number;
  corpus?: { chunks: number; documents: number };
  rigs?: number;
  detail?: string;
};

export default function Page() {
  const [dashboard, setDashboard] = React.useState<DashboardState>({
    telemetry: null,
    knowledge: null,
  });
  const [inspect, setInspect] = React.useState(true);
  const [health, setHealth] = React.useState<Health | null>(null);

  React.useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const applyDashboard = React.useCallback(
    (next: Partial<DashboardState>) => setDashboard((prev) => ({ ...prev, ...next })),
    [],
  );

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-border bg-surface flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-accent/10 text-accent rounded-md p-1.5">
            <Activity className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">Magnetocaloric Engineering Agent</h1>
            <p className="text-fg-subtle truncate text-[11px]">
              Guardrailed RAG + telemetry, with the evidence on show
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {health && (
            <span
              className="text-fg-subtle hidden items-center gap-2 text-[11px] md:flex"
              title={health.detail ?? "All providers configured"}
            >
              <span
                className={`size-1.5 rounded-full ${
                  health.status === "ok" ? "bg-ok" : "bg-warn"
                }`}
              />
              <span className="font-mono">{health.model}</span>
              {health.corpus && (
                <span className="tnum">
                  {health.corpus.chunks} chunks / {health.corpus.documents} docs
                </span>
              )}
              <span className="tnum">floor {health.groundingFloor.toFixed(2)}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setInspect((v) => !v)}
            aria-pressed={inspect}
            className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
              inspect
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border text-fg-muted hover:text-fg"
            }`}
          >
            <ScanEye className="size-3.5" />
            Inspect Mode
          </button>

          <EvalBadge />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
        <main className="min-h-0 overflow-y-auto p-4">
          {dashboard.telemetry || dashboard.knowledge ? (
            <div className="grid h-full min-h-0 gap-4">
              {dashboard.telemetry && (
                <div className="min-h-[380px]">
                  <TelemetryChart data={dashboard.telemetry} />
                </div>
              )}
              {dashboard.knowledge && (
                <div className="min-h-[320px]">
                  <CitationList data={dashboard.knowledge} />
                </div>
              )}
            </div>
          ) : (
            <EmptyState health={health} />
          )}
        </main>

        <aside className="min-h-0">
          <ChatPanel inspect={inspect} onDashboard={applyDashboard} />
        </aside>
      </div>
    </div>
  );
}

function EmptyState({ health }: { health: Health | null }) {
  return (
    <div className="border-border flex h-full min-h-[400px] items-center justify-center rounded-lg border border-dashed p-8">
      <div className="max-w-lg space-y-5">
        <div>
          <h2 className="text-sm font-semibold">Two agents, one guardrail pipeline</h2>
          <p className="text-fg-muted mt-1.5 text-xs leading-relaxed">
            A <strong className="text-fg">Knowledge agent</strong> retrieves from real public
            documents about magnetocaloric cooling. A{" "}
            <strong className="text-fg">Telemetry agent</strong> queries synthetic test-rig
            readings. Every turn passes input guardrails before any model call, tool-argument
            guardrails before any query, and a similarity floor before any answer.
          </p>
        </div>

        <ul className="text-fg-muted space-y-2 text-xs">
          {[
            ["Input", "Secrets redacted, injections refused, off-topic questions declined — all before the first model call."],
            ["Arguments", "Every tool call validated against the same JSON Schema the model was given, plus bounds only the database knows."],
            ["Grounding", "Passages below the similarity floor never enter the context window. Nothing above it means a refusal, not a guess."],
          ].map(([label, body]) => (
            <li key={label} className="flex gap-2.5">
              <span className="text-accent w-20 shrink-0 font-mono text-[11px]">{label}</span>
              <span className="min-w-0 flex-1 leading-relaxed">{body}</span>
            </li>
          ))}
        </ul>

        <div className="border-border text-fg-subtle flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <FlaskConical className="size-3" />
            Rig telemetry is synthetic
          </span>
          {health?.corpus && (
            <span className="tnum">
              {health.corpus.documents} public documents · {health.corpus.chunks} chunks indexed
            </span>
          )}
          {health?.detail && <span className="text-warn">{health.detail}</span>}
        </div>
      </div>
    </div>
  );
}
