"use client";

/**
 * The latest offline eval scores, linked from the header.
 *
 * These come from `npm run eval:full`, which writes `public/eval-report.json`.
 * They are deliberately *not* computed per turn — faithfulness needs a judge
 * model and a known-correct answer, and neither exists at request time. A live
 * score would be a number invented to look like measurement, which is the exact
 * habit the guardrails downstairs are built to prevent.
 *
 * If the report is missing the badge says so rather than rendering a zero.
 */

import * as React from "react";
import { BarChart3, ChevronDown } from "lucide-react";

type Metric = { name: string; label: string; score: number; passed: number; total: number };
type Report = { generatedAt: string; model: string; tier: string; metrics: Metric[] };

export function EvalBadge() {
  const [report, setReport] = React.useState<Report | null | "missing">(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    fetch("/eval-report.json")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setReport)
      .catch(() => setReport("missing"));
  }, []);

  if (report === null) return null;

  if (report === "missing") {
    return (
      <span
        className="border-border text-fg-subtle hidden rounded-md border px-2 py-1.5 text-[11px] md:inline-flex"
        title="Run `npm run eval:full` to generate it."
      >
        no eval report
      </span>
    );
  }

  const overall =
    report.metrics.reduce((sum, m) => sum + m.score, 0) / Math.max(1, report.metrics.length);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-border text-fg-muted hover:text-fg flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] transition"
      >
        <BarChart3 className="size-3.5" />
        <span className="tnum">evals {(overall * 100).toFixed(0)}%</span>
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-border bg-surface absolute right-0 z-20 mt-1.5 w-72 rounded-lg border p-3 shadow-xl">
          <p className="text-fg-subtle mb-2 text-[10px] leading-relaxed">
            Offline suite, {report.tier} tier · judged by {report.model} ·{" "}
            {new Date(report.generatedAt).toLocaleDateString("en-GB")}
          </p>
          <div className="space-y-1.5">
            {report.metrics.map((metric) => (
              <div key={metric.name}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-fg-muted">{metric.label}</span>
                  <span className="tnum">
                    {(metric.score * 100).toFixed(0)}%
                    <span className="text-fg-subtle ml-1">
                      {metric.passed}/{metric.total}
                    </span>
                  </span>
                </div>
                <div className="bg-surface-muted mt-0.5 h-1 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${
                      metric.score >= 0.9 ? "bg-ok" : metric.score >= 0.7 ? "bg-warn" : "bg-danger"
                    }`}
                    style={{ width: `${Math.round(metric.score * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
