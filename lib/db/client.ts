/**
 * Neon over HTTP.
 *
 * The serverless driver rather than `pg`: a Vercel route handler is a
 * short-lived function, and a TCP connection pool there is either cold on every
 * request or leaked between them. Neon's HTTP endpoint sidesteps the question —
 * each query is a fetch, which is the one thing the platform is good at.
 *
 * The trade is that there are no interactive transactions over HTTP. Nothing
 * here writes during a request, so that costs nothing; the seed and ingest
 * scripts run under Node with the same driver and batch their writes instead.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "@/lib/config";

export type Sql = ReturnType<typeof neon>;

let cached: Sql | null = null;

export function getSql(): Sql {
  if (!config.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it " +
        "at a Neon database with the `vector` extension available.",
    );
  }
  if (!cached) cached = neon(config.databaseUrl);
  return cached;
}

/** pgvector's text input format. The driver has no native vector codec, so the
 *  literal is built here rather than in each caller. */
export function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}
