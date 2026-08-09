/**
 * Tool declarations. Importing this module populates `TOOL_REGISTRY`.
 *
 * Three tools across two domains. Each spoke is given only its own domain's
 * tools: restricting the set per agent is what makes the routing decision
 * meaningful — a node that could call anything would make the router decorative.
 */

import { config } from "@/lib/config";
import { embedOne } from "@/lib/ai/openai";
import {
  dataWindow,
  listRigs,
  queryRigTelemetry,
  searchKnowledge,
} from "@/lib/db/queries";
import { register, type BoundsResult, type ToolSpec } from "./registry";

// ---------------------------------------------------------------------------
// Knowledge
// ---------------------------------------------------------------------------

export const searchKnowledgeTool: ToolSpec = register({
  name: "search_engineering_knowledge",
  domain: "knowledge",
  description:
    "Semantic search over the engineering knowledge corpus: magnetocaloric " +
    "technology pages, product documentation, EU project material, industry " +
    "analysis and configuration-management references. Use this for questions " +
    "about how or why something works, what a product is, what changed, or what " +
    "a standard requires. Returns passages with their source and a similarity " +
    "score; passages scoring below the grounding floor are discarded before you " +
    "see them.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Natural-language description of what to find. Prefer the user's own " +
          "technical vocabulary over a paraphrase — the corpus is indexed on the " +
          "engineering terms.",
      },
      limit: {
        type: "integer",
        description: "Maximum passages to retrieve (1-10). Default 6.",
        minimum: 1,
        maximum: 10,
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  bounds: async (args): Promise<BoundsResult> => {
    const query = String(args.query ?? "").trim();
    if (query.length < 3) {
      return { ok: false, message: "The search query is empty or too short to retrieve anything." };
    }
    const limit = Math.max(1, Math.min(10, Number(args.limit ?? 6)));
    return { ok: true, value: { query, limit } };
  },
  handler: async (args) => {
    const vector = await embedOne(String(args.query));
    const hits = await searchKnowledge(vector, Number(args.limit ?? 6));
    return { query: args.query, floor: config.groundingFloor, hits };
  },
});

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

export const listRigsTool: ToolSpec = register({
  name: "list_rigs",
  domain: "telemetry",
  description:
    "List the test rigs available, with the product line each one benches, its " +
    "location and commissioning date. Call this when the user names a rig " +
    "loosely, or asks what data exists, before querying telemetry.",
  parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
  handler: async () => {
    const rigs = await listRigs();
    const window = await dataWindow();
    return { rigs, dataWindow: window };
  },
});

const KNOWN_METRICS = [
  "temperature_span_K",
  "cooling_capacity_W",
  "pressure_drop_mbar",
  "magnetization_cycles_hz",
];

export const queryRigTelemetryTool: ToolSpec = register({
  name: "query_rig_telemetry",
  domain: "telemetry",
  description:
    "Retrieve time-series readings for one test rig, with per-metric " +
    "min/max/mean/latest, the acceptance limits that applied, and a count of " +
    "readings that breached them. Rig ids are rig_1 (POLARIS 100W), rig_2 " +
    "(ECLIPSE 1kW) and rig_3 (STELLAR). Metrics are " +
    `${KNOWN_METRICS.join(", ")}. Omit the dates to cover the whole available ` +
    "window; the interface renders the chart, so interpret the numbers rather " +
    "than transcribing them.",
  parameters: {
    type: "object",
    properties: {
      rig_id: {
        type: "string",
        description: "Which rig, e.g. 'rig_2'. Must be one of the ids list_rigs returns.",
      },
      metrics: {
        type: "array",
        description: "Metrics to return. Omit for all of them.",
        items: { type: "string", enum: KNOWN_METRICS },
      },
      from: { type: "string", description: "ISO date (YYYY-MM-DD), inclusive." },
      to: { type: "string", description: "ISO date (YYYY-MM-DD), inclusive." },
    },
    required: ["rig_id"],
    additionalProperties: false,
  },

  /**
   * The checks a JSON Schema cannot make.
   *
   * `rig_id: string` is satisfied by "rig_999"; only the database knows that no
   * such rig exists. `from: string` is satisfied by "2099-01-01"; only the data
   * knows the window ends in 2026. Both cases would otherwise return an empty
   * result set, and an empty result set is indistinguishable from "the rig was
   * idle" — so the model would report silence as a finding.
   */
  bounds: async (args): Promise<BoundsResult> => {
    const rigs = await listRigs();
    const known = rigs.map((r) => r.rigId);
    const rigId = String(args.rig_id ?? "").trim();

    if (!known.includes(rigId)) {
      return {
        ok: false,
        message:
          `Unknown rig ${JSON.stringify(rigId)}. Known rigs: ${known.join(", ")}. ` +
          "Call list_rigs if you are unsure which one the user means.",
        detail: { supplied: rigId, known },
      };
    }

    const window = await dataWindow();
    if (!window) {
      return { ok: false, message: "No telemetry has been seeded yet.", detail: {} };
    }

    const value: Record<string, unknown> = { rigId };

    for (const key of ["from", "to"] as const) {
      const raw = args[key];
      if (raw === undefined || raw === null || raw === "") continue;
      const parsed = new Date(String(raw));
      if (Number.isNaN(parsed.getTime())) {
        return {
          ok: false,
          message: `${key} is not a date I can parse: ${JSON.stringify(raw)}. Use YYYY-MM-DD.`,
          detail: { field: key, supplied: raw },
        };
      }
      const lo = new Date(window.from);
      const hi = new Date(window.to);
      if (parsed < lo || parsed > hi) {
        return {
          ok: false,
          message:
            `${key}=${String(raw)} falls outside the recorded window ` +
            `${window.from.slice(0, 10)} to ${window.to.slice(0, 10)}. ` +
            "Re-query inside that range, or omit the dates for the full window.",
          detail: { field: key, supplied: raw, window },
        };
      }
      value[key] = parsed.toISOString();
    }

    if (value.from && value.to && new Date(String(value.from)) > new Date(String(value.to))) {
      return {
        ok: false,
        message: "`from` is later than `to`. Swap them.",
        detail: { from: value.from, to: value.to },
      };
    }

    const metrics = Array.isArray(args.metrics) ? args.metrics.map(String) : undefined;
    const unknownMetrics = metrics?.filter((m) => !KNOWN_METRICS.includes(m)) ?? [];
    if (unknownMetrics.length) {
      return {
        ok: false,
        message: `Unknown metric(s): ${unknownMetrics.join(", ")}. Available: ${KNOWN_METRICS.join(", ")}.`,
        detail: { supplied: metrics, known: KNOWN_METRICS },
      };
    }
    if (metrics?.length) value.metrics = metrics;

    return { ok: true, value };
  },

  handler: async (args) =>
    queryRigTelemetry({
      rigId: String(args.rigId ?? args.rig_id),
      metrics: Array.isArray(args.metrics) ? args.metrics.map(String) : undefined,
      from: args.from ? String(args.from) : undefined,
      to: args.to ? String(args.to) : undefined,
    }),
});
