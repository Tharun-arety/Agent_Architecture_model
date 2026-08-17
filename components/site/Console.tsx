"use client";

/**
 * The live console.
 *
 * This is the only part of the page that is an instrument rather than a
 * document. It keeps the dense readouts, the sharp corners and the palette
 * where every colour is a verdict, because a visitor is operating it rather
 * than reading it.
 *
 * On a wide screen it is a fixed-height panel that scrolls internally, so the
 * page can scroll around it. On a phone that would mean three nested scroll
 * areas competing for 800px, so each panel takes its natural height and the
 * whole thing scrolls once.
 */

import * as React from "react";
import { Loader2 } from "lucide-react";

import { ChatPanel } from "@/components/ChatPanel";
import { CitationList, type CitationFocus } from "@/components/CitationList";
import { CorpusPanel } from "@/components/CorpusPanel";
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
 * One source in `scripts/sources.json` returns 403 to a scripted request, so it
 * never reaches the database. It is listed anyway. A corpus panel showing only
 * what succeeded tells a tidier story than the ingest actually had.
 */
const UNREACHABLE = [{ sourceRef: "SOG-HYLICAL", detail: "HTTP 403 Forbidden" }];

const FALLBACK_FLOOR = 0.35;

export function Console() {
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

    // First paint without a model call. Someone who has asked nothing still sees
    // exactly what this system holds.
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

  // The nonce is what makes clicking the same citation twice scroll back to it
  // rather than doing nothing because the ref did not change.
  const [citationFocus, setCitationFocus] = React.useState<CitationFocus>(null);
  const focusCitation = React.useCallback(
    (sourceRef: string) =>
      setCitationFocus((prev) => ({ sourceRef, nonce: (prev?.nonce ?? 0) + 1 })),
    [],
  );

  const floor = dashboard.knowledge?.floor ?? health?.groundingFloor ?? FALLBACK_FLOOR;

  return (
    <div className="frame flex flex-col lg:h-[46rem]">
      {/* What the instrument is currently configured to do belongs on its front
          panel rather than in a menu. */}
      <header className="border-rule bg-panel flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-b px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Mark />
          <p className="text-dim truncate text-[12px] leading-tight">
            Magnetocaloric engineering agent
          </p>
        </div>

        {health && (
          <dl className="text-faint hidden items-center gap-5 font-mono text-[10px] md:flex">
            <Stat label="model" value={health.model} />
            {health.corpus && (
              <Stat label="corpus" value={`${health.corpus.chunks}/${health.corpus.documents}`} />
            )}
            <Stat label="floor" value={health.groundingFloor.toFixed(2)} />
          </dl>
        )}

        <span
          className={`ml-auto size-1.5 shrink-0 ${health?.status === "ok" ? "bg-cold" : "bg-warm"}`}
          title={health?.detail ?? "All providers configured"}
          aria-label={`status ${health?.status ?? "unknown"}`}
        />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(30rem,34rem)]">
        {/* min-w-0 as well as min-h-0: a grid item defaults to min-width:auto,
            so without it the panel refuses to shrink below its content and the
            whole column scrolls sideways on a phone. */}
        <main className="grid grid-rows-[minmax(320px,auto)_minmax(300px,auto)] gap-4 p-4 lg:min-h-0 lg:grid-rows-[minmax(320px,1.15fr)_minmax(260px,1fr)]">
          <div className="min-h-0 min-w-0">
            {dashboard.telemetry ? (
              <TelemetryChart data={dashboard.telemetry} />
            ) : (
              <Placeholder loading={loading} label="rig telemetry" detail={health?.detail} />
            )}
          </div>

          <div className="min-h-0 min-w-0">
            {dashboard.knowledge ? (
              <CitationList data={dashboard.knowledge} floor={floor} focus={citationFocus} />
            ) : corpus && corpus.length > 0 ? (
              <CorpusPanel documents={corpus} unreachable={UNREACHABLE} />
            ) : (
              <Placeholder loading={loading} label="knowledge corpus" detail={health?.detail} />
            )}
          </div>
        </main>

        <aside className="border-rule min-h-[36rem] border-t lg:min-h-0 lg:border-t-0 lg:border-l">
          <ChatPanel
            inspect={inspect}
            onInspectChange={setInspect}
            onDashboard={applyDashboard}
            onCite={focusCitation}
          />
        </aside>
      </div>
    </div>
  );
}

/**
 * A magnetisation cycle: two poles, the field between them, and the span it
 * produces. It is where the two-pole palette comes from.
 */
function Mark({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} shrink-0`}
      aria-hidden="true"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="square"
    >
      <rect x="0.75" y="0.75" width="22.5" height="22.5" stroke="var(--color-rule-strong)" />
      <path d="M4 15.5 Q 8 4.5, 12 12 T 20 8.5" stroke="var(--color-cold)" />
      <line x1="4" y1="19" x2="20" y2="19" stroke="var(--color-hot)" strokeDasharray="2 3" />
    </svg>
  );
}

export { Mark };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="micro">{label}</dt>
      <dd className="tnum text-dim">{value}</dd>
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
    <div className="border-rule text-faint flex h-full items-center justify-center border border-dashed p-6 text-xs">
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin" />
          Reading {label}…
        </span>
      ) : (
        <span className="max-w-sm text-center leading-relaxed">
          {detail ?? `No ${label} available right now.`}
        </span>
      )}
    </div>
  );
}
