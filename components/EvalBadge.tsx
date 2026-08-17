"use client";

/**
 * The latest offline eval scores, from `npm run eval:full`.
 *
 * These are not computed per turn. Faithfulness needs a judge model and a
 * known-correct answer, and neither exists at request time. Showing a live
 * score would mean inventing a number that looks like a measurement, which is
 * the habit the guardrails downstairs exist to prevent.
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";

import {
  EvalMetrics,
  EvalTargetNote,
  overallScore,
  type EvalReport,
} from "@/components/EvalMetrics";

export function EvalBadge() {
  const [report, setReport] = React.useState<EvalReport | null | "missing">(null);
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

  if (report === null || report === "missing") return null;

  const overall = overallScore(report);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="border-rule text-dim hover:text-ink flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[10px] tracking-[0.14em] uppercase transition-colors"
      >
        <span className="micro">evals</span>
        <span className="tnum text-cold font-mono text-[11px] normal-case">
          {(overall * 100).toFixed(0)}%
        </span>
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-rule-strong bg-panel absolute right-0 z-30 mt-1 w-[19rem] rounded-xl border p-3 shadow-2xl">
          <p className="text-faint mb-2.5 font-mono text-[9px] leading-relaxed">
            offline suite · {report.tier} tier · judged by {report.model}
          </p>
          <EvalMetrics metrics={report.metrics} />
          <EvalTargetNote className="border-rule mt-2.5 border-t pt-2" />
        </div>
      )}
    </div>
  );
}
