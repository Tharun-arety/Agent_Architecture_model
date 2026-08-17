"use client";

/**
 * Rig telemetry as a strip-chart trace.
 *
 * The acceptance limit is the same threshold device the evidence pane uses for
 * the grounding floor, because it is the same statement: a value being judged
 * against a stated bound. The out-of-limit region is shaded rather than only
 * ruled, so "how far outside, and for how long" is legible without reading the
 * axis.
 *
 * The chart never parses the model's prose. It reads the same JSON the model
 * read, which is what makes the two impossible to disagree.
 *
 * One metric at a time: cooling capacity on rig_3 is ~126 kW and magnetisation
 * frequency is ~1.7 Hz, five orders of magnitude apart. On a shared axis the
 * frequency line *is* the x-axis.
 */

import * as React from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FlaskConical } from "lucide-react";

import type { TelemetryResult } from "@/lib/types";

const METRIC_LABELS: Record<string, string> = {
  temperature_span_K: "Temperature span",
  cooling_capacity_W: "Cooling capacity",
  pressure_drop_mbar: "Pressure drop",
  magnetization_cycles_hz: "Magnetisation freq.",
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const fmt = (value: number) =>
  value.toLocaleString("en-GB", { maximumFractionDigits: 2 });

export function TelemetryChart({ data }: { data: TelemetryResult }) {
  const metrics = data.summaries.map((s) => s.metric);
  const [selected, setActive] = React.useState<string | null>(null);

  // Open on a metric that has something to show. Metrics arrive alphabetically,
  // which puts cooling capacity first, a flat line with noise on it, and the
  // least informative thing a visitor could land on. A limit breach is the
  // reason someone opened this pane.
  const fallback = data.summaries.find((s) => s.breaches > 0)?.metric ?? metrics[0] ?? "";
  const active = selected && metrics.includes(selected) ? selected : fallback;

  const summary = data.summaries.find((s) => s.metric === active);
  const series = data.series[active] ?? [];

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-2">
        <h3 className="legend shrink-0 after:hidden">Rig telemetry</h3>
        <p className="text-faint min-w-0 flex-1 truncate font-mono text-[11px]">
          {data.rig.rigId} · {data.rig.label}
        </p>
        <span className="text-warm micro shrink-0" title="Generated for this demonstration">
          <FlaskConical className="mr-1 inline size-3 align-[-2px]" />
          Synthetic
        </span>
      </header>

      <div className="border-rule bg-panel flex min-h-0 flex-1 flex-col border">
        {/* Channel selector. Breach count sits on the tab, so the metric worth
            opening announces itself before you open it. */}
        <div className="border-rule flex flex-wrap gap-px border-b bg-[var(--color-rule)]">
          {data.summaries.map((s) => {
            const on = s.metric === active;
            return (
              <button
                key={s.metric}
                type="button"
                onClick={() => setActive(s.metric)}
                aria-pressed={on}
                // No flex-1: four equal-width tabs each holding their label on
                // one line give the row a min-content width wider than a phone,
                // and the whole panel stops shrinking. Letting them size to
                // their text and wrap costs nothing on a wide screen.
                className={`grow cursor-pointer px-3 py-2 text-left text-[11px] whitespace-nowrap transition-colors ${
                  on ? "bg-raised text-ink" : "bg-panel text-faint hover:text-dim"
                }`}
              >
                <span className={on ? "border-cold border-b pb-0.5" : ""}>
                  {METRIC_LABELS[s.metric] ?? s.metric}
                </span>
                {s.breaches > 0 && (
                  <span className="tnum text-hot ml-1.5 font-mono">{s.breaches}</span>
                )}
              </button>
            );
          })}
        </div>

        {summary && (
          <div className="border-rule flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b px-3 py-2.5">
            <Readout label="latest" value={summary.latest} unit={summary.unit} emphasis />
            {/* A span bracket: the two ends of the range read as one measurement
                rather than as two unrelated statistics. */}
            <div className="flex items-baseline gap-1.5">
              <span className="micro">span</span>
              <span className="text-rule-strong font-mono text-[11px]">⌐</span>
              <span className="tnum text-dim font-mono text-[12px]">{fmt(summary.min)}</span>
              <span className="text-faint text-[10px]">–</span>
              <span className="tnum text-dim font-mono text-[12px]">{fmt(summary.max)}</span>
            </div>
            <Readout label="mean" value={summary.mean} unit={summary.unit} />
            <div className="ml-auto flex items-baseline gap-1.5">
              <span className="micro">n</span>
              <span className="tnum text-dim font-mono text-[12px]">{summary.count}</span>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 p-2">
          <ResponsiveContainer width="100%" height="100%" minHeight={180}>
            <ComposedChart data={series} margin={{ top: 10, right: 10, bottom: 2, left: -14 }}>
              <CartesianGrid stroke="var(--color-rule)" strokeDasharray="1 5" vertical={false} />
              <XAxis
                dataKey="recordedAt"
                tickFormatter={shortDate}
                stroke="var(--color-rule-strong)"
                tick={{ fontSize: 9, fill: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
                minTickGap={44}
                tickLine={false}
              />
              <YAxis
                stroke="var(--color-rule-strong)"
                tick={{ fontSize: 9, fill: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
                domain={["auto", "auto"]}
                width={54}
                tickLine={false}
              />

              {/* The out-of-limit region, shaded. A rule alone tells you where
                  the bound is; the band tells you how far past it the trace went
                  and for how long. */}
              {summary?.limitLow != null && summary.limitLow > 0 && (
                <ReferenceArea
                  y1={Math.min(summary.min, summary.limitLow) - Math.abs(summary.limitLow) * 0.04}
                  y2={summary.limitLow}
                  fill="var(--color-hot)"
                  fillOpacity={0.07}
                  strokeOpacity={0}
                />
              )}
              {summary?.limitHigh != null && (
                <ReferenceArea
                  y1={summary.limitHigh}
                  y2={Math.max(summary.max, summary.limitHigh) * 1.02}
                  fill="var(--color-hot)"
                  fillOpacity={0.07}
                  strokeOpacity={0}
                />
              )}

              <Tooltip
                cursor={{ stroke: "var(--color-rule-strong)", strokeWidth: 1 }}
                contentStyle={{
                  background: "var(--color-inset)",
                  border: "1px solid var(--color-rule-strong)",
                  borderRadius: 0,
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-ink)",
                }}
                labelStyle={{ color: "var(--color-faint)", fontSize: 10 }}
                labelFormatter={(value) => new Date(String(value)).toLocaleString("en-GB")}
                formatter={(value) => [
                  `${fmt(Number(value))} ${summary?.unit ?? ""}`,
                  METRIC_LABELS[active] ?? active,
                ]}
              />

              {summary?.limitLow != null && summary.limitLow > 0 && (
                <ReferenceLine
                  y={summary.limitLow}
                  stroke="var(--color-hot)"
                  strokeDasharray="4 5"
                  label={{
                    value: `MIN ${summary.limitLow}`,
                    fill: "var(--color-hot)",
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    position: "insideTopLeft",
                  }}
                />
              )}
              {summary?.limitHigh != null && (
                <ReferenceLine
                  y={summary.limitHigh}
                  stroke="var(--color-hot)"
                  strokeDasharray="4 5"
                  label={{
                    value: `MAX ${summary.limitHigh}`,
                    fill: "var(--color-hot)",
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    position: "insideBottomLeft",
                  }}
                />
              )}

              {/* One trace, no fill. The line and the shaded out-of-limit band
                  both carry meaning; a gradient under the line carried none. */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-cold)"
                strokeWidth={1.25}
                dot={(props: { cx?: number; cy?: number; payload?: { withinLimits?: boolean } }) =>
                  props.payload?.withinLimits === false ? (
                    <circle
                      key={`${props.cx}-${props.cy}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={2}
                      fill="var(--color-hot)"
                    />
                  ) : (
                    <g key={`${props.cx}-${props.cy}`} />
                  )
                }
                activeDot={{ r: 3, fill: "var(--color-cold)", stroke: "var(--color-ground)" }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {summary && summary.breaches > 0 && (
          <p className="border-rule text-hot border-t px-3 py-2 text-[11px] leading-relaxed">
            <span className="tnum font-mono">{summary.breaches}</span> of{" "}
            <span className="tnum font-mono">{summary.count}</span> readings outside the
            acceptance limit
            {summary.limitLow != null && summary.limitLow > 0 && (
              <span className="font-mono"> (min {summary.limitLow} {summary.unit})</span>
            )}
            {summary.limitHigh != null && (
              <span className="font-mono"> (max {summary.limitHigh} {summary.unit})</span>
            )}
            .
          </p>
        )}
      </div>
    </section>
  );
}

function Readout({
  label,
  value,
  unit,
  emphasis = false,
}: {
  label: string;
  value: number;
  unit: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="micro">{label}</span>
      <span
        className={`tnum font-mono ${emphasis ? "text-ink text-[15px]" : "text-dim text-[12px]"}`}
      >
        {fmt(value)}
      </span>
      <span className="text-faint font-mono text-[10px]">{unit}</span>
    </div>
  );
}
