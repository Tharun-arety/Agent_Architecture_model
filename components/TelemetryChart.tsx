"use client";

/**
 * Rig telemetry, rendered from the structured `tool_result` payload.
 *
 * The chart never parses the model's prose. It reads the same JSON the model
 * read, which is what makes the two impossible to disagree.
 *
 * One metric at a time rather than all four on shared axes: cooling capacity on
 * rig_3 is ~126 kW and magnetisation frequency is ~1.7 Hz, five orders of
 * magnitude apart. On one axis the frequency line is the x-axis and the whole
 * point of looking at it disappears.
 */

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, FlaskConical } from "lucide-react";

import type { TelemetryResult } from "@/lib/types";

const METRIC_LABELS: Record<string, string> = {
  temperature_span_K: "Temperature span",
  cooling_capacity_W: "Cooling capacity",
  pressure_drop_mbar: "Pressure drop",
  magnetization_cycles_hz: "Magnetisation frequency",
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export function TelemetryChart({ data }: { data: TelemetryResult }) {
  const metrics = data.summaries.map((s) => s.metric);
  const [selected, setActive] = React.useState<string | null>(null);

  // Derived during render rather than synced by an effect. A new rig query can
  // return a different metric set, and a stale selection would render an empty
  // chart; falling back here means the tab bar and the plot cannot disagree
  // even for one frame.
  const active = selected && metrics.includes(selected) ? selected : (metrics[0] ?? "");

  const summary = data.summaries.find((s) => s.metric === active);
  const series = data.series[active] ?? [];

  return (
    <div className="border-border bg-surface flex h-full flex-col rounded-lg border">
      <header className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{data.rig.label}</h2>
          <p className="text-fg-subtle mt-0.5 truncate text-[11px]">
            <span className="font-mono">{data.rig.rigId}</span> · {data.rig.location} ·{" "}
            {shortDate(data.from)} – {shortDate(data.to)}
          </p>
        </div>
        <span className="text-warn border-warn/30 bg-warn/5 flex shrink-0 items-center gap-1 rounded border px-1.5 py-1 text-[10px]">
          <FlaskConical className="size-3" />
          Synthetic data
        </span>
      </header>

      <div className="border-border flex flex-wrap gap-1 border-b px-3 py-2">
        {data.summaries.map((s) => (
          <button
            key={s.metric}
            type="button"
            onClick={() => setActive(s.metric)}
            className={`rounded border px-2 py-1 text-[11px] transition ${
              s.metric === active
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
            }`}
          >
            {METRIC_LABELS[s.metric] ?? s.metric}
            {s.breaches > 0 && (
              <span className="text-danger ml-1.5 font-medium">{s.breaches}✕</span>
            )}
          </button>
        ))}
      </div>

      {summary && (
        <div className="border-border grid grid-cols-2 gap-px border-b bg-[var(--color-border)] sm:grid-cols-4">
          {[
            { label: "latest", value: summary.latest },
            { label: "mean", value: summary.mean },
            { label: "min", value: summary.min },
            { label: "max", value: summary.max },
          ].map((cell) => (
            <div key={cell.label} className="bg-surface px-3 py-2">
              <div className="tnum text-sm font-medium">
                {cell.value.toLocaleString("en-GB", { maximumFractionDigits: 2 })}
                <span className="text-fg-subtle ml-1 text-[10px]">{summary.unit}</span>
              </div>
              <div className="text-fg-subtle text-[10px]">{cell.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 p-3">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <LineChart data={series} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="recordedAt"
              tickFormatter={shortDate}
              stroke="var(--color-fg-subtle)"
              tick={{ fontSize: 10 }}
              minTickGap={40}
            />
            <YAxis
              stroke="var(--color-fg-subtle)"
              tick={{ fontSize: 10 }}
              domain={["auto", "auto"]}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-muted)",
                border: "1px solid var(--color-border-strong)",
                borderRadius: 6,
                fontSize: 11,
              }}
              labelFormatter={(value) => new Date(String(value)).toLocaleString("en-GB")}
              formatter={(value) => [
                `${Number(value).toLocaleString("en-GB", { maximumFractionDigits: 2 })} ${summary?.unit ?? ""}`,
                METRIC_LABELS[active] ?? active,
              ]}
            />
            {/* The acceptance limit, drawn where it applies. A trend line with
                no limit beside it cannot be read as pass or fail. */}
            {summary?.limitLow != null && summary.limitLow > 0 && (
              <ReferenceLine
                y={summary.limitLow}
                stroke="var(--color-danger)"
                strokeDasharray="4 4"
                label={{ value: "min", fill: "var(--color-danger)", fontSize: 10, position: "left" }}
              />
            )}
            {summary?.limitHigh != null && (
              <ReferenceLine
                y={summary.limitHigh}
                stroke="var(--color-danger)"
                strokeDasharray="4 4"
                label={{ value: "max", fill: "var(--color-danger)", fontSize: 10, position: "left" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              dot={(props: { cx?: number; cy?: number; payload?: { withinLimits?: boolean } }) =>
                props.payload?.withinLimits === false ? (
                  <circle
                    key={`${props.cx}-${props.cy}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={2.5}
                    fill="var(--color-danger)"
                  />
                ) : (
                  <g key={`${props.cx}-${props.cy}`} />
                )
              }
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {summary && summary.breaches > 0 && (
        <p className="text-danger border-danger/30 bg-danger/5 mx-3 mb-3 flex items-start gap-1.5 rounded border px-2 py-1.5 text-[11px]">
          <AlertTriangle className="mt-px size-3 shrink-0" />
          <span>
            {summary.breaches} of {summary.count} readings breached the acceptance limit
            {summary.limitLow != null && summary.limitLow > 0 && ` (min ${summary.limitLow} ${summary.unit})`}
            {summary.limitHigh != null && ` (max ${summary.limitHigh} ${summary.unit})`}.
          </span>
        </p>
      )}
    </div>
  );
}
