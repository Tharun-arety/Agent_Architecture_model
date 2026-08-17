/**
 * The handful of fixed values the page states in prose.
 *
 * Everything else numeric on this page is computed: the eval figures come from
 * `public/eval-report.json`, and the corpus size is read from `/api/health` at
 * runtime. These four are here because they are structural rather than
 * measured, or because they come from a report section the interface does not
 * otherwise load.
 *
 * `SEPARATION`, `IN_CORPUS_MEAN` and `OFF_CORPUS_MEAN` are from the grounding
 * section of `evals/report/latest.md`. If the floor is ever recalibrated, these
 * move with it.
 */

export const EMAIL = "tharun.nstn@gmail.com";

export const GROUNDING_FLOOR = 0.35;

/** Mean top-ranked similarity for questions the corpus can answer. */
export const IN_CORPUS_MEAN = 0.582;

/** The same measure for questions it cannot. */
export const OFF_CORPUS_MEAN = 0.189;

/** The gap between them. The floor sits inside it. */
export const SEPARATION = IN_CORPUS_MEAN - OFF_CORPUS_MEAN;

/** Sources listed in `scripts/sources.json`. One returns 403, so ten ingest. */
export const MANIFEST_SOURCES = 11;
