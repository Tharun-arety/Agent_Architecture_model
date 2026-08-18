/**
 * GET /api/health — what is configured, and what is actually loaded.
 *
 * The corpus counts are queried rather than asserted. "Configured" and
 * "working" are different states, and a deploy where DATABASE_URL is set but
 * the ingest never ran looks identical from the outside until something asks
 * the database a question.
 */

import { config, hasDatabase, hasOpenAIKey } from "@/lib/config";
import { corpusStats, dataWindow, listRigs } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const base = {
    status: "ok" as string,
    model: config.model,
    synthesisModel: config.synthesisModel,
    embeddingModel: config.embeddingModel,
    groundingFloor: config.groundingFloor,
    maxToolIterations: config.maxToolIterations,
    openaiConfigured: hasOpenAIKey(),
    databaseConfigured: hasDatabase(),
  };

  if (!hasDatabase()) {
    return Response.json({ ...base, status: "degraded", detail: "DATABASE_URL is not set." });
  }

  try {
    const [corpus, rigs, window] = await Promise.all([corpusStats(), listRigs(), dataWindow()]);
    return Response.json({
      ...base,
      status: corpus.chunks > 0 && rigs.length > 0 ? "ok" : "degraded",
      corpus,
      rigs: rigs.length,
      telemetryWindow: window,
      ...(corpus.chunks === 0 ? { detail: "Corpus is empty — run `npm run ingest`." } : {}),
      ...(rigs.length === 0 ? { detail: "No rigs — run `npm run seed:telemetry`." } : {}),
    });
  } catch (cause) {
    return Response.json(
      {
        ...base,
        status: "error",
        detail: cause instanceof Error ? cause.message : String(cause),
      },
      { status: 503 },
    );
  }
}
