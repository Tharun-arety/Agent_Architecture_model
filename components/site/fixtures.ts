/**
 * Frozen examples for the explanatory sections.
 *
 * Each of these was captured from a real run against the live system and then
 * pinned, so the page can show a specific behaviour without waiting for someone
 * to type the right question. They are illustrative. The console further up the
 * page is the live one.
 *
 * Typed against the same types the pipeline emits, so a change to a frame's
 * shape breaks the build here rather than rendering something stale.
 *
 * No eval numbers live in this file. Those come from `public/eval-report.json`,
 * which is written by `npm run eval:full`.
 */

import type { KnowledgePayload, TurnTrace } from "@/lib/types";

/**
 * The injection probe, refused.
 *
 * The figures worth reading are the last two: zero model calls and zero cost.
 * The refusal happened in the process, before the request would have left it.
 */
export const REFUSAL_TRACE: TurnTrace = {
  intent: "refused",
  routerRationale: "The router never ran. Input guardrails ended the turn first.",
  stages: [{ name: "input_guardrails", durationMs: 4 }],
  guardrails: [
    { id: "input.secrets", passed: true, latencyMs: 0.4, detail: { redacted: 0 } },
    {
      id: "input.injection",
      passed: false,
      latencyMs: 3.1,
      reason:
        "That request looks like an attempt to change my instructions rather than a question about the engineering data, so I have not acted on it. Ask about the corpus or the test rigs and I will.",
      detail: {
        pattern: "instruction_override",
        matched: "ignore previous instructions",
      },
    },
  ],
  toolAttempts: [],
  retrieval: null,
  totals: {
    durationMs: 4,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    modelCalls: 0,
  },
  refusedBy: "input.injection",
};

/**
 * A retrieval with passages on both sides of the floor.
 *
 * The three at the bottom scored 0.296, 0.249 and 0.217. They were dropped
 * before the model was called, and they are on screen so the threshold can be
 * checked rather than taken on trust.
 */
export const ISO_RETRIEVAL: KnowledgePayload = {
  query: "What does ISO 10007 require for configuration management?",
  floor: 0.35,
  hits: [
    {
      sourceRef: "WIKI-ISO10007",
      sourceUrl: "https://en.wikipedia.org/wiki/ISO_10007",
      docTitle: "ISO 10007",
      docType: "standard_summary",
      chunkIndex: 0,
      similarity: 0.611,
      text: "ISO 10007 gives guidance on the use of configuration management within an organization. It covers configuration identification, change control, configuration status accounting and configuration audit, and applies to the support of products from concept through to disposal.",
    },
    {
      sourceRef: "WIKI-ISO10007",
      sourceUrl: "https://en.wikipedia.org/wiki/ISO_10007",
      docTitle: "ISO 10007",
      docType: "standard_summary",
      chunkIndex: 2,
      similarity: 0.548,
      text: "A configuration baseline is the approved product configuration information that establishes the characteristics of a product at a point in time, and which serves as the reference for activities throughout the product life cycle.",
    },
    {
      sourceRef: "MT-TECH",
      sourceUrl: "https://www.magnotherm.com/technology",
      docTitle: "Technology",
      docType: "vendor_technical",
      chunkIndex: 4,
      similarity: 0.421,
      text: "The active magnetic regenerator alternately magnetises and demagnetises a bed of magnetocaloric material while a heat-transfer fluid is pushed through it, building a temperature span far larger than the single-cycle adiabatic temperature change of the material itself.",
    },
    {
      sourceRef: "HAUSER-MCC",
      sourceUrl: "https://www.hauser.com/en/blog/magnetocaloric-cooling-game-changer-industry",
      docTitle: "Magnetocaloric cooling: a game changer for industry",
      docType: "industry_analysis",
      chunkIndex: 1,
      similarity: 0.389,
      text: "Traceability requirements in commercial refrigeration are tightening, and manufacturers increasingly have to show which revision of which component went into a given serial number.",
    },
    {
      sourceRef: "WIKI-MCE",
      sourceUrl: "https://en.wikipedia.org/wiki/Magnetic_refrigeration",
      docTitle: "Magnetic refrigeration",
      docType: "reference",
      chunkIndex: 12,
      similarity: 0.372,
      text: "Development programmes typically maintain a documented record of prototype revisions, since the performance of a regenerator depends strongly on bed geometry and on the exact alloy composition used.",
    },
    {
      sourceRef: "MT-FAQ",
      sourceUrl: "https://www.magnotherm.com/faq",
      docTitle: "FAQ",
      docType: "vendor_technical",
      chunkIndex: 3,
      similarity: 0.356,
      text: "Each unit is built to a released bill of materials, and changes to that bill are tracked so that a unit in the field can be matched to the configuration it shipped with.",
    },
  ],
  rejected: [
    {
      sourceRef: "ATMO-R290",
      sourceUrl: "https://naturalrefrigerants.com/news/",
      docTitle: "Refrigerant-free cooling, 15% more efficient than propane",
      docType: "press",
      chunkIndex: 2,
      similarity: 0.296,
      text: "The company says its magnetocaloric system is roughly 15% more energy efficient than an equivalent propane unit.",
    },
    {
      sourceRef: "HYLICAL",
      sourceUrl: "https://www.hylical.eu/",
      docTitle: "HyLICAL",
      docType: "project_page",
      chunkIndex: 0,
      similarity: 0.249,
      text: "HyLICAL is a European project developing hydrogen liquefaction using superconducting magnets.",
    },
    {
      sourceRef: "EIT-STORY",
      sourceUrl: "https://www.eit.europa.eu/news-events/success-stories/",
      docTitle: "Revolutionising refrigeration through magnetic cooling",
      docType: "press",
      chunkIndex: 1,
      similarity: 0.217,
      text: "The team was supported through an EIT innovation programme during its early commercialisation.",
    },
  ],
};

/**
 * An answer with its citations live.
 *
 * `ATMO-R404A` was never retrieved. The citation check catches it and the
 * interface marks it in the sentence that used it, rather than only in the
 * inspector where nobody would look.
 */
export const ANSWER_SAMPLE = {
  text:
    "The regenerator builds a temperature span by cycling a magnetocaloric bed in and out of a magnetic field while a transfer fluid moves through it, which produces a span much larger than the material's single-cycle adiabatic change [MT-TECH]. Measured against a propane system, the vendor reports roughly 15% better energy efficiency [ATMO-R290]. An earlier HFC comparison [ATMO-R404A] is not in the retrieved set.",
  /** Handles this turn's retrieval actually returned. */
  knownRefs: new Set(["MT-TECH", "ATMO-R290"]),
};
