/**
 * Typed configuration, read once from the environment.
 *
 * Every tunable that a reviewer might want to challenge — the grounding floor,
 * the tool-loop ceiling, the model ids — lives here rather than inline at its
 * point of use, so "what threshold did you pick and why" has one answer.
 */

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number, got ${JSON.stringify(raw)}`);
  }
  return parsed;
}

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",

  /** Router and both spokes. Cheap tier: this path is classification and
   *  function calling over structured results, not prose. */
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  /** Final answer only. Falls back to `model`. One call per turn, so this is
   *  the one worth upgrading independently. */
  synthesisModel: process.env.OPENAI_SYNTHESIS_MODEL || (process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",

  /**
   * Cosine similarity below which a retrieved chunk never enters context.
   *
   * Measured, not chosen. `npx tsx evals/calibrate.ts` sweeps the retrieval
   * golden set and reports recall against leak at each candidate; 0.30–0.40 is
   * the plateau where every in-corpus question still finds its document and no
   * off-corpus question finds anything, so this is its midpoint.
   *
   * It is embedding-model-specific and not transferable. text-embedding-3-small
   * puts genuine in-corpus matches at 0.40–0.71 and unrelated queries at
   * 0.10–0.28; a round 0.70 — plausible, and what this project started with —
   * scores 8% recall, i.e. it refuses nearly everything. Re-run the calibration
   * when the corpus or the embedding model changes.
   */
  groundingFloor: num("GROUNDING_SIMILARITY_FLOOR", 0.35),
  /** Hard ceiling on the tool-calling loop inside a spoke. */
  maxToolIterations: num("AGENT_MAX_TOOL_ITERATIONS", 3),
  /** How many times a rejected tool call may be handed back for correction. */
  maxArgRetries: num("AGENT_MAX_ARG_RETRIES", 2),

  /** Unauthenticated endpoint spending a real API key: cap both dimensions. */
  rateLimitPerMinute: num("RATE_LIMIT_PER_MINUTE", 10),
  maxOutputTokens: num("MAX_OUTPUT_TOKENS", 700),
} as const;

export const hasOpenAIKey = () => config.openaiApiKey.trim().length > 0;
export const hasDatabase = () => config.databaseUrl.trim().length > 0;

/** USD per 1M tokens, used to price a turn in the inspector. Update alongside
 *  OPENAI_MODEL; an unknown model prices at zero rather than guessing. */
export const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2, output: 8 },
  "text-embedding-3-small": { input: 0.02, output: 0 },
};

export function priceUsd(model: string, inputTokens: number, outputTokens: number): number {
  const rate = PRICING[model];
  if (!rate) return 0;
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000;
}
