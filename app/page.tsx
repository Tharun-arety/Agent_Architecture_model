"use client";

import * as React from "react";
import { Activity, Loader2, ScanEye } from "lucide-react";

import { ChatPanel } from "@/components/ChatPanel";
import { CitationList } from "@/components/CitationList";
import { CorpusPanel } from "@/components/CorpusPanel";
import { EvalBadge } from "@/components/EvalBadge";
import { TelemetryChart } from "@/components/TelemetryChart";
import type { CorpusDocument } from "@/lib/db/queries";
import type { DashboardState } from "@/lib/types";

type Health = {
  status: string;
  model: string;
  groundingFloor: number;
  corpus?: { chunks: number; documents: number };
  rigs?: number;
  detail?: string;
};

/**
 * Listed from the ingest's own record rather than hard-coded: this source is in
 * `scripts/sources.json` and returns 403 to a scripted request, so it never
 * makes it into the database. Surfacing it is the point — a corpus page that
 * shows only what succeeded tells a tidier story than the ingest actually had.
 */
const UNREACHABLE = [{ sourceRef: "SOG-HYLICAL", detail: "HTTP 403 Forbidden" }];

export default function Page() {
  const [dashboard, setDashboard] = React.useState<DashboardState>({
    telemetry: null,
    knowledge: null,
  });
  const [corpus, setCorpus] = React.useState<CorpusDocument[] | null>(null);
  const [inspect, setInspect] = React.useState(true);
  const [health, setHealth] = React.useState<Health | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth(null));

    // First paint without a model call. The dashboard shows the default rig and
    // the corpus inventory immediately, so someone who has asked nothing still
    // sees exactly what this system holds.
    fetch("/api/overview")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { telemetry: DashboardState["telemetry"]; corpus: CorpusDocument[] }) => {
        setDashboard((prev) => ({ ...prev, telemetry: prev.telemetry ?? data.telemetry }));
        setCorpus(data.corpus);
      })
      .catch(() => setCorpus([]))
      .finally(() => setLoading(false));
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
                className={`size-1.5 rounded-full ${health.status === "ok" ? "bg-ok" : "bg-warn"}`}
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
        <main className="grid min-h-0 grid-rows-[minmax(340px,3fr)_minmax(260px,2fr)] gap-4 overflow-y-auto p-4">
          {dashboard.telemetry ? (
            <TelemetryChart data={dashboard.telemetry} />
          ) : (
            <Placeholder loading={loading} label="test-rig telemetry" />
          )}

          {dashboard.knowledge ? (
            <CitationList data={dashboard.knowledge} />
          ) : corpus && corpus.length > 0 ? (
            <CorpusPanel documents={corpus} unreachable={UNREACHABLE} />
          ) : (
            <Placeholder loading={loading} label="knowledge corpus" detail={health?.detail} />
          )}
        </main>

        <aside className="min-h-0">
          <ChatPanel inspect={inspect} onDashboard={applyDashboard} />
        </aside>
      </div>
    </div>
  );
}

function Placeholder({
  loading,
  label,
  detail,
}: {
  loading: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <div className="border-border text-fg-subtle flex items-center justify-center rounded-lg border border-dashed p-6 text-xs">
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin" />
          Loading {label}…
        </span>
      ) : (
        <span className="max-w-sm text-center leading-relaxed">
          No {label} available.{" "}
          {detail ?? "Check DATABASE_URL, then run `npm run ingest` and `npm run seed:telemetry`."}
        </span>
      )}
    </div>
  );
}
