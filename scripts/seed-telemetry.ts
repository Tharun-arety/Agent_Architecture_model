/**
 * Synthetic test-rig telemetry.
 *
 *   npm run seed:telemetry
 *
 * This data is generated, and the UI says so on every screen that shows it. The
 * numbers are not MAGNOTHERM's measurements and must never be presented as if
 * they were.
 *
 * What is *not* pretend is the shape, because that is what the agent and the
 * guardrails are actually exercised against:
 *
 *   - a rig registry, so `rig_id` is a value the argument guardrail can check
 *     against reality rather than a string it has to trust;
 *   - a bounded date window, so "give me 2099" is a rejectable request;
 *   - acceptance limits stored per reading, so a pass/fail verdict is a
 *     historical fact rather than something recomputed against today's spec;
 *   - two planted anomalies, so "is anything out of family?" has a right answer
 *     the eval suite can assert on.
 *
 * The PRNG is seeded with a constant, so re-running produces byte-identical
 * rows. An eval golden set written against drifting numbers is not a golden set.
 */

import "./lib/env";

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { getSql } from "../lib/db/client";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(HERE, "..", "lib", "db", "schema.sql");

/** mulberry32 — small, fast, and identical across platforms, which matters more
 *  here than statistical quality. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RIGS = [
  {
    rigId: "rig_1",
    label: "POLARIS 100W bench",
    productLine: "POLARIS",
    location: "Darmstadt — Lab A",
    commissioned: "2024-03-11",
  },
  {
    rigId: "rig_2",
    label: "ECLIPSE 1kW bench",
    productLine: "ECLIPSE",
    location: "Darmstadt — Lab A",
    commissioned: "2024-11-04",
  },
  {
    rigId: "rig_3",
    label: "STELLAR high-capacity bench",
    productLine: "STELLAR",
    location: "Darmstadt — Hall 2",
    commissioned: "2025-06-23",
  },
] as const;

type Metric = {
  metric: string;
  unit: string;
  /** Per-rig nominal value. A 100W bench and a 125kW bench do not share a
   *  baseline, and pretending they do would make "out of family" meaningless. */
  base: Record<string, number>;
  noise: number;
  /**
   * Whether `noise` is in the metric's own units or a fraction of the base.
   *
   * Stated rather than inferred from the magnitude. An earlier version guessed
   * — anything under 0.5 was treated as a fraction — which silently turned the
   *  0.35 K span jitter into ±35% of the base, i.e. ±6.5 K on rig_3, and
   * produced 102 limit breaches on a rig that is supposed to be clean on that
   * metric. The seed's own breach summary is what caught it.
   */
  noiseKind: "absolute" | "relative";
  /** Which rigs this limit is enforced on. A limit belongs to a product's
   *  acceptance spec, not to a metric name. */
  limitLow?: number;
  limitHigh?: number;
  limitAppliesTo?: string[];
};

const METRICS: Metric[] = [
  {
    metric: "temperature_span_K",
    unit: "K",
    base: { rig_1: 12.4, rig_2: 16.1, rig_3: 18.7 },
    noise: 0.35,
    noiseKind: "absolute",
    // The ECLIPSE acceptance floor. rig_1 is a 100 W bench and rig_3 a
    // high-capacity one; neither is held to another product's spec.
    limitLow: 15.0,
    limitAppliesTo: ["rig_2"],
  },
  {
    metric: "cooling_capacity_W",
    unit: "W",
    base: { rig_1: 104, rig_2: 1015, rig_3: 126_500 },
    noise: 0.02,
    noiseKind: "relative",
  },
  {
    metric: "pressure_drop_mbar",
    unit: "mbar",
    base: { rig_1: 410, rig_2: 850, rig_3: 1180 },
    noise: 0.03,
    noiseKind: "relative",
    limitHigh: 1400,
    limitAppliesTo: ["rig_3"],
  },
  {
    metric: "magnetization_cycles_hz",
    unit: "Hz",
    base: { rig_1: 2.1, rig_2: 3.4, rig_3: 1.7 },
    noise: 0.04,
    noiseKind: "relative",
  },
];

// The window every date argument is validated against. Fixed, not "now minus
// 90 days": a moving window makes yesterday's eval case fail today.
export const WINDOW_START = new Date("2026-05-04T06:00:00Z");
export const WINDOW_END = new Date("2026-08-01T18:00:00Z");
const READINGS_PER_DAY = 4;

type Row = {
  rigId: string;
  recordedAt: Date;
  metric: string;
  value: number;
  unit: string;
  limitLow: number | null;
  limitHigh: number | null;
  withinLimits: boolean;
};

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/**
 * The two planted anomalies. Both are the kind of thing a rig actually does,
 * and both are things the eval suite asserts the agent can find.
 *
 *   rig_2 — temperature span decays across the last three weeks of the window
 *           and crosses the 15.0 K acceptance floor. This is a degradation
 *           trend, not a spike: a bot that only reports min/max misses it.
 *   rig_3 — a two-day pressure excursion mid-window that breaches the 1400 mbar
 *           ceiling and then recovers. This is a spike, not a trend: a bot that
 *           only reports the mean misses it.
 */
function anomalyFactor(rigId: string, metric: string, at: Date): number {
  if (rigId === "rig_2" && metric === "temperature_span_K") {
    const decayStart = new Date("2026-07-11T00:00:00Z").getTime();
    if (at.getTime() < decayStart) return 1;
    const days = (at.getTime() - decayStart) / 86_400_000;
    return 1 - Math.min(0.14, days * 0.0068);
  }
  if (rigId === "rig_3" && metric === "pressure_drop_mbar") {
    const spikeStart = new Date("2026-06-17T00:00:00Z").getTime();
    const spikeEnd = new Date("2026-06-19T00:00:00Z").getTime();
    const t = at.getTime();
    if (t >= spikeStart && t < spikeEnd) return 1.27;
  }
  return 1;
}

function generate(): Row[] {
  const random = rng(0x4d61676e); // "Magn"
  const rows: Row[] = [];
  const stepMs = 86_400_000 / READINGS_PER_DAY;

  for (const rig of RIGS) {
    const commissioned = new Date(`${rig.commissioned}T00:00:00Z`);
    for (let t = WINDOW_START.getTime(); t <= WINDOW_END.getTime(); t += stepMs) {
      const at = new Date(t);
      if (at < commissioned) continue;

      for (const spec of METRICS) {
        const base = spec.base[rig.rigId];
        if (base === undefined) continue;

        const amplitude = spec.noiseKind === "relative" ? spec.noise * base : spec.noise;
        const jitter = (random() - 0.5) * 2 * amplitude;
        const value = base * anomalyFactor(rig.rigId, spec.metric, at) + jitter;

        const applies = !spec.limitAppliesTo || spec.limitAppliesTo.includes(rig.rigId);
        const limitLow = applies ? (spec.limitLow ?? null) : null;
        const limitHigh = applies ? (spec.limitHigh ?? null) : null;

        const withinLimits =
          (limitLow === null || value >= limitLow) && (limitHigh === null || value <= limitHigh);

        rows.push({
          rigId: rig.rigId,
          recordedAt: at,
          metric: spec.metric,
          value: round(value, spec.metric === "cooling_capacity_W" ? 1 : 2),
          unit: spec.unit,
          limitLow,
          limitHigh,
          withinLimits,
        });
      }
    }
  }
  return rows;
}

async function main(): Promise<number> {
  const sql = getSql();

  const schema = await readFile(SCHEMA_PATH, "utf8");
  for (const statement of schema.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
    await sql.query(statement);
  }

  const rows = generate();
  console.log(`\n  Generated ${rows.length} readings across ${RIGS.length} rigs.`);
  console.log(
    `  Window: ${WINDOW_START.toISOString().slice(0, 10)} → ${WINDOW_END.toISOString().slice(0, 10)}\n`,
  );

  await sql.query("DELETE FROM rig_reading");
  await sql.query("DELETE FROM rig");

  for (const rig of RIGS) {
    await sql.query(
      `INSERT INTO rig (rig_id, label, product_line, location, commissioned)
       VALUES ($1,$2,$3,$4,$5)`,
      [rig.rigId, rig.label, rig.productLine, rig.location, rig.commissioned],
    );
  }

  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const values: unknown[] = [];
    const tuples = batch.map((row, n) => {
      const b = n * 8;
      values.push(
        row.rigId,
        row.recordedAt.toISOString(),
        row.metric,
        row.value,
        row.unit,
        row.limitLow,
        row.limitHigh,
        row.withinLimits,
      );
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8})`;
    });
    await sql.query(
      `INSERT INTO rig_reading
         (rig_id, recorded_at, metric, value, unit, limit_low, limit_high, within_limits)
       VALUES ${tuples.join(",")}`,
      values,
    );
    process.stdout.write(`\r  ${Math.min(i + BATCH, rows.length)}/${rows.length} written`);
  }

  const failures = rows.filter((r) => !r.withinLimits);
  console.log(`\r  ${rows.length}/${rows.length} written\n`);
  console.log(`  ${failures.length} readings breach their acceptance limit:`);
  for (const rig of RIGS) {
    const forRig = failures.filter((f) => f.rigId === rig.rigId);
    if (!forRig.length) continue;
    const metrics = [...new Set(forRig.map((f) => f.metric))].join(", ");
    console.log(`    ${rig.rigId}  ${String(forRig.length).padStart(3)}  ${metrics}`);
  }
  console.log("");
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exit(1);
  });
