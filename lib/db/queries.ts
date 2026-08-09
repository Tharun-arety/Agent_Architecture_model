/**
 * Every database read the tools make. Nothing here knows it is a tool.
 *
 * The dependency runs queries <- tools <- loop, never the reverse, so the same
 * functions can be called from the eval suite without standing up an agent.
 */

import { config } from "@/lib/config";
import { getSql, toVectorLiteral } from "@/lib/db/client";

// ---------------------------------------------------------------------------
// Knowledge
// ---------------------------------------------------------------------------

export type KnowledgeHit = {
  sourceRef: string;
  sourceUrl: string;
  docTitle: string;
  docType: string;
  chunkIndex: number;
  text: string;
  /** Cosine similarity in [-1, 1]; 1.0 is an exact directional match. */
  similarity: number;
};

/**
 * At most this many passages from any one document in a single result set.
 *
 * Without it the corpus's own shape decides the answer. `WIKI-MCE` is 41 of 121
 * chunks, so a broad query — "magnetocaloric materials" — came back as five
 * consecutive Wikipedia passages and the vendor documentation never appeared.
 * The answer that followed described gadolinium, which is what an encyclopedia
 * leads with, rather than the LaFeSi alloy the technology pages name. Every
 * passage scored well; the retrieval was still wrong.
 *
 * Two is enough to keep a document that genuinely owns the answer while leaving
 * room for a second opinion. `evals/cases/retrieval.json` covers both
 * directions: recall must not drop, and off-corpus queries must still clear
 * nothing.
 */
const MAX_CHUNKS_PER_SOURCE = 2;

/**
 * Cosine search over the corpus, diversified by source.
 *
 * Returns *everything* it selects with its score, including hits below the
 * grounding floor. Filtering happens in `guardrails/grounding.ts` rather than
 * here, so the inspector can show what was retrieved and then rejected — a
 * threshold you cannot see the other side of is a threshold nobody can
 * challenge.
 */
export async function searchKnowledge(
  queryVector: number[],
  limit: number,
  /**
   * The grounding floor, so diversification only trades between passages that
   * will actually survive it.
   *
   * Passed in rather than read here because the floor belongs to the guardrail
   * layer; this function needs to know it only to avoid spending a slot on a
   * passage that layer is about to discard. Which is precisely the bug this
   * parameter fixes: capping per source *before* the floor gave a slot to a
   * 0.25-scoring passage from another document, and the floor then threw it
   * away — so the query returned five usable passages instead of six, and the
   * one displaced was the only chunk that answered the question.
   */
  floor: number = config.groundingFloor,
): Promise<KnowledgeHit[]> {
  const sql = getSql();

  // Over-fetch, then diversify. Capping inside SQL would need a window function
  // over the whole table on every query; ranking a few dozen rows in memory is
  // cheaper and the logic is visible.
  const rows = (await sql.query(
    `SELECT source_ref, source_url, doc_title, doc_type, chunk_index, text,
            1 - (embedding <=> $1::vector) AS similarity
       FROM knowledge_chunk
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2`,
    [toVectorLiteral(queryVector), limit * 4],
  )) as Record<string, unknown>[];

  const candidates: KnowledgeHit[] = rows.map((row) => ({
    sourceRef: String(row.source_ref),
    sourceUrl: String(row.source_url),
    docTitle: String(row.doc_title),
    docType: String(row.doc_type),
    chunkIndex: Number(row.chunk_index),
    text: String(row.text),
    similarity: Math.round(Number(row.similarity) * 10_000) / 10_000,
  }));

  // Only passages that clear the floor compete for slots. Everything below it
  // is going to be discarded by `guardrails/grounding.ts` anyway, so letting one
  // displace a usable passage costs recall and buys nothing.
  const viable = candidates.filter((hit) => hit.similarity >= floor);
  const weak = candidates.filter((hit) => hit.similarity < floor);

  const perSource = new Map<string, number>();
  const selected: KnowledgeHit[] = [];
  const overflow: KnowledgeHit[] = [];

  for (const hit of viable) {
    const taken = perSource.get(hit.sourceRef) ?? 0;
    if (taken < MAX_CHUNKS_PER_SOURCE && selected.length < limit) {
      perSource.set(hit.sourceRef, taken + 1);
      selected.push(hit);
    } else {
      overflow.push(hit);
    }
  }

  // When one document is the only one with anything to say, the cap yields.
  // Preventing monoculture is worth a slot; starving the answer is not.
  for (const hit of overflow) {
    if (selected.length >= limit) break;
    selected.push(hit);
  }

  // Sub-floor passages are appended, never substituted, so the inspector can
  // still show what was retrieved and rejected. They are trimmed hard: showing
  // the three nearest misses makes the threshold legible, and showing twenty
  // makes it noise.
  selected.push(...weak.slice(0, 3));

  return selected;
}

export type CorpusDocument = {
  sourceRef: string;
  sourceUrl: string;
  docTitle: string;
  docType: string;
  chunks: number;
  fetchedAt: string;
};

/** The corpus inventory, for the first-paint dashboard.
 *
 *  A visitor who has not asked anything yet should still be able to see what
 *  this system can and cannot answer from. "Ten documents, and here they are"
 *  is a far more honest opening than an empty pane that implies unlimited
 *  scope. */
export async function corpusDocuments(): Promise<CorpusDocument[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT source_ref, source_url, doc_title, doc_type,
            count(*)::int AS chunks, max(fetched_at) AS fetched_at
       FROM knowledge_chunk
      GROUP BY source_ref, source_url, doc_title, doc_type
      ORDER BY count(*) DESC`,
  )) as Record<string, unknown>[];

  return rows.map((row) => ({
    sourceRef: String(row.source_ref),
    sourceUrl: String(row.source_url),
    docTitle: String(row.doc_title),
    docType: String(row.doc_type),
    chunks: Number(row.chunks),
    fetchedAt: new Date(String(row.fetched_at)).toISOString(),
  }));
}

export async function corpusStats(): Promise<{ chunks: number; documents: number }> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT count(*)::int AS chunks, count(DISTINCT source_ref)::int AS documents FROM knowledge_chunk",
  )) as Record<string, unknown>[];
  return {
    chunks: Number(rows[0]?.chunks ?? 0),
    documents: Number(rows[0]?.documents ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

export type Rig = {
  rigId: string;
  label: string;
  productLine: string;
  location: string;
  commissioned: string;
};

export async function listRigs(): Promise<Rig[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT rig_id, label, product_line, location, commissioned
       FROM rig ORDER BY rig_id`,
  )) as Record<string, unknown>[];
  return rows.map((row) => ({
    rigId: String(row.rig_id),
    label: String(row.label),
    productLine: String(row.product_line),
    location: String(row.location),
    commissioned: new Date(String(row.commissioned)).toISOString().slice(0, 10),
  }));
}

/** The window the seeded data actually covers, read from the data rather than
 *  hard-coded — the argument guardrail validates date ranges against this, and
 *  a constant that drifts from the rows is a guardrail that rejects valid
 *  questions. */
export async function dataWindow(): Promise<{ from: string; to: string } | null> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT min(recorded_at) AS lo, max(recorded_at) AS hi FROM rig_reading",
  )) as Record<string, unknown>[];
  const lo = rows[0]?.lo;
  const hi = rows[0]?.hi;
  if (!lo || !hi) return null;
  return {
    from: new Date(String(lo)).toISOString(),
    to: new Date(String(hi)).toISOString(),
  };
}

export type MetricSummary = {
  metric: string;
  unit: string;
  count: number;
  min: number;
  max: number;
  mean: number;
  latest: number;
  latestAt: string;
  limitLow: number | null;
  limitHigh: number | null;
  breaches: number;
};

export type SeriesPoint = { recordedAt: string; value: number; withinLimits: boolean };

export type TelemetryResult = {
  rig: Rig;
  from: string;
  to: string;
  summaries: MetricSummary[];
  series: Record<string, SeriesPoint[]>;
  note: string;
};

const SERIES_CAP = 120;

export async function queryRigTelemetry(args: {
  rigId: string;
  metrics?: string[];
  from?: string;
  to?: string;
}): Promise<TelemetryResult> {
  const sql = getSql();

  const rig = (await listRigs()).find((r) => r.rigId === args.rigId);
  if (!rig) throw new Error(`Unknown rig ${args.rigId}.`);

  const window = await dataWindow();
  const from = args.from ?? window?.from ?? "1970-01-01T00:00:00Z";
  const to = args.to ?? window?.to ?? new Date().toISOString();

  const rows = (await sql.query(
    `SELECT metric, unit, recorded_at, value, within_limits, limit_low, limit_high
       FROM rig_reading
      WHERE rig_id = $1
        AND recorded_at >= $2 AND recorded_at <= $3
        AND ($4::text[] IS NULL OR metric = ANY($4))
      ORDER BY metric, recorded_at`,
    [args.rigId, from, to, args.metrics?.length ? args.metrics : null],
  )) as Record<string, unknown>[];

  const byMetric = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = String(row.metric);
    const bucket = byMetric.get(key);
    if (bucket) bucket.push(row);
    else byMetric.set(key, [row]);
  }

  const summaries: MetricSummary[] = [];
  const series: Record<string, SeriesPoint[]> = {};

  for (const [metric, readings] of byMetric) {
    const values = readings.map((r) => Number(r.value));
    const last = readings[readings.length - 1];
    summaries.push({
      metric,
      unit: String(readings[0].unit),
      count: readings.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000,
      latest: Number(last.value),
      latestAt: new Date(String(last.recorded_at)).toISOString(),
      limitLow: last.limit_low === null ? null : Number(last.limit_low),
      limitHigh: last.limit_high === null ? null : Number(last.limit_high),
      breaches: readings.filter((r) => r.within_limits === false).length,
    });

    // Downsampled for the chart, but breaches are always kept: dropping the
    // two readings that failed is the one way a thinning strategy can turn a
    // failing rig into a passing one.
    const stride = Math.max(1, Math.ceil(readings.length / SERIES_CAP));
    series[metric] = readings
      .filter((r, i) => i % stride === 0 || r.within_limits === false || i === readings.length - 1)
      .map((r) => ({
        recordedAt: new Date(String(r.recorded_at)).toISOString(),
        value: Number(r.value),
        withinLimits: r.within_limits !== false,
      }));
  }

  return {
    rig,
    from,
    to,
    summaries,
    series,
    note: "Synthetic test-rig data generated for this demonstration. Not MAGNOTHERM measurements.",
  };
}
