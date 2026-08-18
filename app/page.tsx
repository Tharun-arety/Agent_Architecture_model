"use client";

import * as React from "react";
import { Loader2, ScanEye } from "lucide-react";

import { ChatPanel } from "@/components/ChatPanel";
import { CitationList, type CitationFocus } from "@/components/CitationList";
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
 * In `scripts/sources.json` and returns 403 to a scripted request, so it never
 * reaches the database. Surfaced deliberately — a corpus panel showing only what
 * succeeded tells a tidier story than the ingest actually had.
 */
const UNREACHABLE = [{ sourceRef: "SOG-HYLICAL", detail: "HTTP 403 Forbidden" }];

const FALLBACK_FLOOR = 0.35;

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
  // rather than being a no-op because the ref did not change.
  const [citationFocus, setCitationFocus] = React.useState<CitationFocus>(null);
  const focusCitation = React.useCallback(
    (sourceRef: string) =>
      setCitationFocus((prev) => ({ sourceRef, nonce: (prev?.nonce ?? 0) + 1 })),
    [],
  );

  const floor = dashboard.knowledge?.floor ?? health?.groundingFloor ?? FALLBACK_FLOOR;

  return (
    <div className="flex h-dvh flex-col">
      {/* The faceplate header: identity, then the instrument's own settings as
          a live readout strip. What the machine is currently configured to do
          belongs on its front panel, not in a menu. */}
      <header className="border-rule bg-panel flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Mark />
          <div className="min-w-0">
            <h1 className="truncate text-[13px] leading-tight font-semibold tracking-tight">
              Magnetocaloric Engineering Agent
            </h1>
            <p className="text-faint truncate text-[10px] leading-tight">
              Retrieval and telemetry, with the evidence on show
            </p>
          </div>
        </div>

        {health && (
          <dl className="text-faint hidden items-center gap-4 font-mono text-[10px] lg:flex">
            <Stat label="model" value={health.model} />
            {health.corpus && (
              <Stat label="corpus" value={`${health.corpus.chunks}/${health.corpus.documents}`} />
            )}
            <Stat label="floor" value={health.groundingFloor.toFixed(2)} />
            <span
              className={`size-1.5 shrink-0 ${health.status === "ok" ? "bg-cold" : "bg-warm"}`}
              title={health.detail ?? "All providers configured"}
              aria-label={`status ${health.status}`}
            />
          </dl>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInspect((v) => !v)}
            aria-pressed={inspect}
            className={`flex cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-[10px] tracking-[0.14em] uppercase transition-colors ${
              inspect
                ? "border-cold/50 bg-cold/10 text-cold"
                : "border-rule text-faint hover:text-dim"
            }`}
          >
            <ScanEye className="size-3" />
            Inspect
          </button>
          <EvalBadge />
        </div>
      </header>

      {/* Two behaviours, deliberately different. On a wide screen this is a
          fixed-height instrument: panels hold their place and each scrolls
          internally. On a phone that would mean three nested scroll areas
          fighting over 800px, so the page becomes one ordinary scroll with each
          panel at its natural height. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_400px] lg:overflow-hidden">
        <main className="grid grid-rows-[minmax(320px,auto)_minmax(300px,auto)] gap-4 p-4 lg:min-h-0 lg:grid-rows-[minmax(320px,1.15fr)_minmax(260px,1fr)] lg:overflow-y-auto">
          {/* min-w-0 as well as min-h-0: a grid item defaults to min-width:auto,
              so without it the panel refuses to shrink below its content and
              the whole column scrolls sideways on a phone. */}
          <div className="settle min-h-0 min-w-0" style={{ animationDelay: "40ms" }}>
            {dashboard.telemetry ? (
              <TelemetryChart data={dashboard.telemetry} />
            ) : (
              <Placeholder loading={loading} label="rig telemetry" />
            )}
          </div>

          <div className="settle min-h-0 min-w-0" style={{ animationDelay: "120ms" }}>
            {dashboard.knowledge ? (
              <CitationList data={dashboard.knowledge} floor={floor} focus={citationFocus} />
            ) : corpus && corpus.length > 0 ? (
              <CorpusPanel documents={corpus} unreachable={UNREACHABLE} />
            ) : (
              <Placeholder loading={loading} label="knowledge corpus" detail={health?.detail} />
            )}
          </div>
        </main>

        <aside
          className="settle border-rule min-h-[36rem] border-t lg:min-h-0 lg:border-t-0 lg:border-l"
          style={{ animationDelay: "200ms" }}
        >
          <ChatPanel inspect={inspect} onDashboard={applyDashboard} onCite={focusCitation} />
        </aside>
      </div>
    </div>
  );
}

/**
 * The mark: a magnetisation cycle. Two poles, the field between them, and the
 * span it produces — the whole technology in 20 pixels, and the source of the
 * page's two-pole palette.
 */
function Mark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6 shrink-0"
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
          No {label} available.{" "}
          {detail ?? "Set DATABASE_URL, then run `npm run ingest` and `npm run seed:telemetry`."}
        </span>
      )}
    </div>
  );
}
