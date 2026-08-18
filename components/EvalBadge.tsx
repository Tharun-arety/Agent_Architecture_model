"use client";

/**
 * The latest offline eval scores, from `npm run eval:full`.
 *
 * These are deliberately *not* computed per turn: faithfulness needs a judge
 * model and a known-correct answer, and neither exists at request time. A live
 * score would be a number invented to look like a measurement, which is the
 * habit the guardrails downstairs exist to prevent.
 *
 * Each metric is drawn against the same threshold device the rest of the panel
 * uses — a target line with the bar measured against it — because it is the
 * same statement: a value being judged against a stated bound.
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";

type Metric = { name: string; label: string; score: number; passed: number; total: number };
type Report = { generatedAt: string; model: string; tier: string; metrics: Metric[] };

/** Anything under this is a regression worth looking at, and the bar says so
 *  without needing a legend. */
const TARGET = 0.9;

export function EvalBadge() {
  const [report, setReport] = React.useState<Report | null | "missing">(null);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/eval-report.json")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setReport)
      .catch(() => setReport("missing"));
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (report === null) return null;

  if (report === "missing") {
    return (
      <span
        className="border-rule text-faint hidden border px-2.5 py-1.5 text-[10px] tracking-[0.14em] uppercase md:inline-flex"
        title="Run `npm run eval:full` to generate it."
      >
        no evals
      </span>
    );
  }

  const overall =
    report.metrics.reduce((sum, m) => sum + m.score, 0) / Math.max(1, report.metrics.length);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="border-rule text-dim hover:text-ink flex cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-[10px] tracking-[0.14em] uppercase transition-colors"
      >
        <span className="micro">evals</span>
        <span className="tnum text-cold font-mono text-[11px] normal-case">
          {(overall * 100).toFixed(0)}%
        </span>
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-rule-strong bg-panel absolute right-0 z-20 mt-1 w-[19rem] border p-3 shadow-2xl">
          <p className="text-faint mb-2.5 font-mono text-[9px] leading-relaxed">
            offline suite · {report.tier} tier · judged by {report.model} ·{" "}
            {new Date(report.generatedAt).toLocaleDateString("en-GB")}
          </p>

          <div className="space-y-2">
            {report.metrics.map((metric) => (
              <div key={metric.name}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-dim truncate text-[10px]">{metric.label}</span>
                  <span className="tnum text-faint shrink-0 font-mono text-[9px]">
                    <span className={metric.score >= TARGET ? "text-cold" : "text-warm"}>
                      {(metric.score * 100).toFixed(0)}%
                    </span>{" "}
                    {metric.passed}/{metric.total}
                  </span>
                </div>
                {/* The bar against its target, in the panel's own language. */}
                <div className="bg-inset relative mt-1 h-1 w-full">
                  <div
                    className={`h-full ${metric.score >= TARGET ? "bg-cold/70" : "bg-warm/70"}`}
                    style={{ width: `${Math.round(metric.score * 100)}%` }}
                  />
                  <span
                    className="bg-hot/70 absolute inset-y-[-2px] w-px"
                    style={{ left: `${TARGET * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="border-rule text-faint mt-2.5 border-t pt-2 text-[9px] leading-relaxed">
            <span className="bg-hot/70 mr-1 inline-block h-2 w-px align-[-1px]" /> target{" "}
            {(TARGET * 100).toFixed(0)}%. Faithfulness and relevance are LLM-judged and the least
            reliable rows here — read them as a signal to go and look.
          </p>
        </div>
      )}
    </div>
  );
}
