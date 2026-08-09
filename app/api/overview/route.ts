/**
 * GET /api/overview — first-paint data for the dashboard.
 *
 * Plain database reads, no model call. A visitor who has asked nothing should
 * still see what this system holds: the rigs it can query and the documents it
 * can answer from. An empty pane implies unlimited scope, which is the opposite
 * of what a grounded system should communicate.
 *
 * `rig_2` is the default because it is the one carrying the planted anomaly —
 * the chart is worth looking at before anyone types anything.
 */

import { corpusDocuments, queryRigTelemetry } from "@/lib/db/queries";
import { hasDatabase } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_RIG = "rig_2";

export async function GET(request: Request) {
  if (!hasDatabase()) {
    return Response.json({ error: "DATABASE_URL is not set." }, { status: 503 });
  }

  const requested = new URL(request.url).searchParams.get("rig") ?? DEFAULT_RIG;

  try {
    const [telemetry, corpus] = await Promise.all([
      queryRigTelemetry({ rigId: requested }),
      corpusDocuments(),
    ]);
    return Response.json({ telemetry, corpus });
  } catch (cause) {
    return Response.json(
      { error: cause instanceof Error ? cause.message : String(cause) },
      { status: 503 },
    );
  }
}
