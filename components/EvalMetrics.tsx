/**
 * The offline eval scores, drawn as bars against their target.
 *
 * Shared by the header badge and the section that explains the suite, so there
 * is one rendering of these numbers rather than two that can drift apart.
 *
 * Each bar is measured against the same target line, because that is what the
 * rest of the interface does with a number being judged: the acceptance limit
 * on the chart, the similarity floor in the evidence pane, and this.
 */

export type Metric = {
  name: string;
  label: string;
  score: number;
  passed: number;
  total: number;
};

export type EvalReport = {
  generatedAt: string;
  model: string;
  tier: string;
  overall?: number;
  metrics: Metric[];
};

/** Below this a metric is a regression worth opening, and the bar says so
 *  without needing a legend. */
export const TARGET = 0.9;

/** Mean of the metric scores. Not the same figure as cases passed over cases
 *  run, which weights every case equally instead of every metric. */
export function overallScore(report: EvalReport): number {
  if (report.overall != null) return report.overall;
  return report.metrics.reduce((sum, m) => sum + m.score, 0) / Math.max(1, report.metrics.length);
}

export function caseTotals(report: EvalReport): { passed: number; total: number } {
  return report.metrics.reduce(
    (acc, m) => ({ passed: acc.passed + m.passed, total: acc.total + m.total }),
    { passed: 0, total: 0 },
  );
}

export function EvalMetrics({
  metrics,
  size = "sm",
}: {
  metrics: Metric[];
  size?: "sm" | "md";
}) {
  const label = size === "md" ? "text-[12px]" : "text-[10px]";
  const figure = size === "md" ? "text-[11px]" : "text-[9px]";
  const bar = size === "md" ? "h-1.5" : "h-1";

  return (
    <div className={size === "md" ? "space-y-3" : "space-y-2"}>
      {metrics.map((metric) => (
        <div key={metric.name}>
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-dim truncate ${label}`}>{metric.label}</span>
            <span className={`tnum text-faint shrink-0 font-mono ${figure}`}>
              <span className={metric.score >= TARGET ? "text-cold" : "text-warm"}>
                {(metric.score * 100).toFixed(0)}%
              </span>{" "}
              {metric.passed}/{metric.total}
            </span>
          </div>
          <div className={`bg-inset relative mt-1 w-full ${bar}`}>
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
  );
}

/** The legend that explains the target line. Rendered next to the bars in both
 *  places they appear. */
export function EvalTargetNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-faint text-[10px] leading-relaxed ${className}`}>
      <span className="bg-hot/70 mr-1 inline-block h-2 w-px align-[-1px]" /> Target{" "}
      {(TARGET * 100).toFixed(0)}%. Faithfulness and relevance are scored by a judge model and
      are the least reliable rows here. Read them as a signal to go and look.
    </p>
  );
}
