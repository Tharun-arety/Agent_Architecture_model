/**
 * Load `.env.local` for the CLI scripts.
 *
 * Next.js reads `.env.local` on its own, but `tsx` does not, and the ingest and
 * seed scripts need the same `DATABASE_URL` and `OPENAI_API_KEY` the app uses.
 * Imported for its side effect, first, before anything reads `process.env`.
 */

import { config as loadEnv } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// `.env.local` wins; `.env` fills the gaps. dotenv never overwrites a variable
// that is already set, so the real environment still beats both — which is what
// makes the same scripts usable in CI.
loadEnv({ path: join(ROOT, ".env.local"), quiet: true });
loadEnv({ path: join(ROOT, ".env"), quiet: true });
