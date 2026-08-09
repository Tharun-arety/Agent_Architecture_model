/**
 * The eval runner.
 *
 *   npm run eval:fast    deterministic + embeddings only. No chat completions.
 *   npm run eval:full    adds routing, tool-calling and the judged metrics.
 *
 * Writes `evals/report/latest.json`, `evals/report/latest.md`, and
 * `public/eval-report.json` — the last of which the app's header badge reads,
 * so the scores shown in the UI are the ones this run actually measured.
 *
 * Split by cost on purpose. The fast tier is free enough to run on every
 * commit; the full tier costs real money and belongs to a deliberate run. A
 * suite nobody runs because it is expensive measures nothing.
 */

import "../scripts/lib/env";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "../lib/config";
import { runAgent } from "../lib/ai/loop";
import { applyGroundingFloor } from "../lib/ai/guardrails/grounding";
import { validateToolCall } from "../lib/ai/guardrails/args";
import { runInputGuardrails } from "../lib/ai/guardrails/input";
import { embedOne } from "../lib/ai/openai";
import { TOOL_REGISTRY } from "../lib/ai/tools/registry";
import "../lib/ai/tools";
import { searchKnowledge } from "../lib/db/queries";
import { judgeFaithfulness, judgeRelevance } from "./judges";

const HERE = dirname(fileURLToPath(import.meta.url));
const CASES = join(HERE, "cases");
const REPORT_DIR = join(HERE, "report");
const PUBLIC_REPORT = join(HERE, "..", "public", "eval-report.json");

const fast = process.argv.includes("--fast");

type Case = { id: string; passed: boolean; detail: string };
type Metric = {
  name: string;
  label: string;
  score: number;
  passed: number;
  total: number;
  cases: Case[];
  note?: string;
};

const metrics: Metric[] = [];
const notes: string[] = [];

const load = async <T>(file: string): Promise<T> =>
  JSON.parse(await readFile(join(CASES, file), "utf8")) as T;

function record(
  name: string,
  label: string,
  cases: Case[],
  note?: string,
): Metric {
  const passed = cases.filter((c) => c.passed).length;
  const metric: Metric = {
    name,
    label,
    score: cases.length ? passed / cases.length : 0,
    passed,
    total: cases.length,
    cases,
    note,
  };
  metrics.push(metric);

  const pct = (metric.score * 100).toFixed(1).padStart(5);
  const mark = metric.score === 1 ? "✓" : metric.score >= 0.9 ? "~" : "✗";
  console.log(`  ${mark} ${label.padEnd(34)} ${pct}%  ${passed}/${cases.length}`);
  for (const failure of cases.filter((c) => !c.passed)) {
    console.log(`      · ${failure.id}: ${failure.detail}`);
  }
  return metric;
}

// ---------------------------------------------------------------------------
// Tier 1 — deterministic. No model calls at all.
// ---------------------------------------------------------------------------

type GuardrailCases = {
  adversarial: { id: string; query: string; expect: string }[];
  benign: { id: string; query: string; note?: string }[];
  secrets: { id: string; query: string; expectRedacted: string[] }[];
};

async function guardrailMetrics(): Promise<void> {
  const data = await load<GuardrailCases>("guardrails.json");

  // Trigger rate: does the adversarial set get caught, by the right guardrail?
  record(
    "guardrail_trigger",
    "Guardrail trigger rate",
    data.adversarial.map((testCase) => {
      const result = runInputGuardrails(testCase.query);
      const firedBy = result.blocked?.by.id;
      return {
        id: testCase.id,
        passed: firedBy === testCase.expect,
        detail: firedBy
          ? `blocked by ${firedBy}, expected ${testCase.expect}`
          : `NOT BLOCKED — expected ${testCase.expect}`,
      };
    }),
    "Adversarial inputs that must be refused, by the specific guardrail named.",
  );

  // False positives: the metric a trigger rate on its own conceals entirely.
  const benign = data.benign.map((testCase) => {
    const result = runInputGuardrails(testCase.query);
    return {
      id: testCase.id,
      passed: result.blocked === null,
      detail: result.blocked
        ? `FALSE POSITIVE — ${result.blocked.by.id} blocked a legitimate question${testCase.note ? ` (${testCase.note})` : ""}`
        : "admitted",
    };
  });
  const falsePositives = benign.filter((c) => !c.passed).length;
  record(
    "guardrail_specificity",
    "Guardrail specificity",
    benign,
    `Legitimate questions that must NOT be blocked. False-positive rate: ` +
      `${((falsePositives / benign.length) * 100).toFixed(1)}%.`,
  );

  record(
    "secret_redaction",
    "Secret redaction",
    data.secrets.map((testCase) => {
      const result = runInputGuardrails(testCase.query);
      const verdict = result.verdicts.find((v) => v.id === "input.secrets");
      const redacted = (verdict?.detail?.redacted as string[] | undefined) ?? [];
      const missing = testCase.expectRedacted.filter((label) => !redacted.includes(label));
      const leaked = /sk-proj-[A-Za-z0-9]|AKIAIOSFODNN7EXAMPLE|hunter2|@example\.com/.test(result.text);
      return {
        id: testCase.id,
        passed: missing.length === 0 && !leaked,
        detail: missing.length
          ? `did not redact ${missing.join(", ")}`
          : leaked
            ? "a secret survived into the forwarded text"
            : `redacted ${redacted.join(", ")}`,
      };
    }),
    "Credentials must be replaced before the text reaches the model.",
  );
}

type ArgCases = {
  invalid: { id: string; tool: string; args: Record<string, unknown>; expect: string }[];
  valid: { id: string; tool: string; args: Record<string, unknown> }[];
};

async function argMetrics(): Promise<void> {
  const data = await load<ArgCases>("tool-args.json");

  const invalid: Case[] = [];
  for (const testCase of data.invalid) {
    const spec = TOOL_REGISTRY.get(testCase.tool)!;
    const check = await validateToolCall(spec, testCase.args);
    const failedBy = check.verdicts.find((v) => !v.passed)?.id;
    invalid.push({
      id: testCase.id,
      passed: failedBy === testCase.expect,
      detail: failedBy
        ? `rejected by ${failedBy}, expected ${testCase.expect}`
        : `ACCEPTED — expected rejection by ${testCase.expect}`,
    });
  }
  record(
    "arg_rejection",
    "Tool argument rejection",
    invalid,
    "Malformed or out-of-bounds calls, rejected by the correct gate.",
  );

  const valid: Case[] = [];
  for (const testCase of data.valid) {
    const spec = TOOL_REGISTRY.get(testCase.tool)!;
    const check = await validateToolCall(spec, testCase.args);
    valid.push({
      id: testCase.id,
      passed: Boolean(check.args),
      detail: check.args ? "accepted" : `FALSE POSITIVE — ${check.message}`,
    });
  }
  record(
    "arg_acceptance",
    "Tool argument acceptance",
    valid,
    "Legitimate calls that must pass. A bounds check that rejects these burns " +
      "the model's retry budget and turns good questions into refusals.",
  );
}

type RetrievalCases = {
  inCorpus: { id: string; query: string; expectAnyOf: string[] }[];
  offCorpus: { id: string; query: string }[];
};

async function retrievalMetrics(): Promise<void> {
  const data = await load<RetrievalCases>("retrieval.json");
  const K = 6;

  const inCorpusScores: number[] = [];
  const recall: Case[] = [];
  for (const testCase of data.inCorpus) {
    const hits = await searchKnowledge(await embedOne(testCase.query), K);
    const grounded = applyGroundingFloor(hits);
    const refs = grounded.kept.map((hit) => hit.sourceRef);
    const found = testCase.expectAnyOf.filter((ref) => refs.includes(ref));
    if (hits[0]) inCorpusScores.push(hits[0].similarity);
    recall.push({
      id: testCase.id,
      passed: found.length > 0,
      detail: found.length
        ? `found ${found.join(", ")} (top ${hits[0]?.similarity.toFixed(3)})`
        : `expected any of ${testCase.expectAnyOf.join(", ")}, got ${refs.join(", ") || "nothing above the floor"}`,
    });
  }
  record("retrieval_recall", `Retrieval recall@${K}`, recall, "In-corpus questions must surface a relevant document above the floor.");

  const offCorpusScores: number[] = [];
  const refusal: Case[] = [];
  for (const testCase of data.offCorpus) {
    const hits = await searchKnowledge(await embedOne(testCase.query), K);
    const grounded = applyGroundingFloor(hits);
    if (hits[0]) offCorpusScores.push(hits[0].similarity);
    refusal.push({
      id: testCase.id,
      passed: grounded.kept.length === 0,
      detail:
        grounded.kept.length === 0
          ? `correctly ungrounded (best ${hits[0]?.similarity.toFixed(3)})`
          : `LEAKED ${grounded.kept.length} passage(s) above the floor — top ${hits[0]?.similarity.toFixed(3)} from ${grounded.kept[0].sourceRef}`,
    });
  }

  const mean = (values: number[]) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const inMean = mean(inCorpusScores);
  const offMean = mean(offCorpusScores);
  const separation = inMean - offMean;

  record(
    "grounding_refusal",
    "Grounding refusal (off-corpus)",
    refusal,
    `Off-corpus questions must clear nothing. Mean top score: in-corpus ` +
      `${inMean.toFixed(3)}, off-corpus ${offMean.toFixed(3)} — separation ` +
      `${separation.toFixed(3)}. Floor is ${config.groundingFloor.toFixed(2)}.`,
  );

  notes.push(
    `Grounding floor ${config.groundingFloor.toFixed(2)}: in-corpus queries score ` +
      `${inMean.toFixed(3)} on average at rank 1, off-corpus ${offMean.toFixed(3)}. ` +
      `The floor sits ${(config.groundingFloor - offMean).toFixed(3)} above the off-corpus ` +
      `mean and ${(inMean - config.groundingFloor).toFixed(3)} below the in-corpus mean.`,
  );
}

// ---------------------------------------------------------------------------
// Tier 2 — model-backed.
// ---------------------------------------------------------------------------

type RoutingCases = { cases: { id: string; query: string; expect: string }[] };

async function routingMetric(): Promise<void> {
  const data = await load<RoutingCases>("routing.json");
  const results: Case[] = [];
  const confusion: Record<string, Record<string, number>> = {};

  for (const testCase of data.cases) {
    let routed = "error";
    await runAgentSilently(testCase.query, (trace) => {
      routed = trace;
    });
    confusion[testCase.expect] ??= {};
    confusion[testCase.expect][routed] = (confusion[testCase.expect][routed] ?? 0) + 1;
    results.push({
      id: testCase.id,
      passed: routed === testCase.expect,
      detail: `routed ${routed}, expected ${testCase.expect}`,
    });
  }

  const rows = Object.entries(confusion)
    .map(([expected, got]) =>
      `${expected} → ${Object.entries(got).map(([k, v]) => `${k}:${v}`).join(" ")}`,
    )
    .join("; ");
  record("routing_accuracy", "Routing accuracy", results, `Confusion: ${rows}`);
}

/** Route only: the router runs, the spokes do not. Keeps the routing metric to
 *  one cheap call per case instead of a full turn. */
async function runAgentSilently(query: string, onIntent: (intent: string) => void): Promise<void> {
  const { classify } = await import("../lib/ai/openai");
  const { ROUTER_PROMPT, ROUTER_SCHEMA } = await import("../lib/ai/prompts");
  const guard = runInputGuardrails(query);
  if (guard.blocked) {
    onIntent("refused");
    return;
  }
  if (guard.isMeta) {
    onIntent("general");
    return;
  }
  const { value } = await classify<{ intent: string }>(
    [
      { role: "system", content: ROUTER_PROMPT },
      { role: "user", content: guard.text },
    ],
    ROUTER_SCHEMA as unknown as Record<string, unknown>,
    "route_decision",
  );
  onIntent(value.intent);
}

type E2ECase = {
  id: string;
  query: string;
  expectIntent?: string;
  expectRefusal?: boolean;
  expectRefusalContains?: string;
  expectToolRejection?: boolean;
  expectTool?: string;
  mustMention?: string[];
  mustCite?: boolean;
  rubric?: string;
};

async function endToEndMetrics(): Promise<void> {
  const data = await load<{ cases: E2ECase[] }>("faithfulness.json");

  const behaviour: Case[] = [];
  const faithful: Case[] = [];
  const relevant: Case[] = [];
  const toolAccuracy: Case[] = [];

  for (const testCase of data.cases) {
    const frames: { tool: string; payload: unknown }[] = [];
    const result = await runAgent({
      message: testCase.query,
      emit: (frame) => {
        if (frame.event === "tool_result") frames.push(frame.data);
      },
    });

    // --- deterministic behavioural assertions ------------------------------
    const problems: string[] = [];

    if (testCase.expectRefusal && !result.refused) problems.push("expected a refusal, got an answer");
    if (testCase.expectRefusal && testCase.expectRefusalContains && !result.text.includes(testCase.expectRefusalContains)) {
      problems.push(`refusal text did not contain ${JSON.stringify(testCase.expectRefusalContains)}`);
    }
    if (!testCase.expectRefusal && result.refused) problems.push(`unexpected refusal: ${result.text.slice(0, 90)}`);
    if (testCase.expectIntent && result.intent !== testCase.expectIntent) {
      problems.push(`routed ${result.intent}, expected ${testCase.expectIntent}`);
    }
    for (const term of testCase.mustMention ?? []) {
      if (!result.text.toLowerCase().includes(term.toLowerCase())) {
        problems.push(`answer never mentions ${JSON.stringify(term)}`);
      }
    }
    if (testCase.mustCite) {
      const citation = result.trace.guardrails.find((v) => v.id === "grounding.citations");
      const cited = (citation?.detail?.cited as string[] | undefined) ?? [];
      if (!citation || !cited.length) problems.push("answer cited no source");
      else if (!citation.passed) problems.push(`cited a source that was not retrieved: ${citation.reason}`);
    }
    if (testCase.expectToolRejection) {
      const rejected = result.trace.toolAttempts.some((a) => !a.accepted);
      if (!rejected) problems.push("expected a tool call to be rejected by the bounds gate");
    }

    behaviour.push({
      id: testCase.id,
      passed: problems.length === 0,
      detail: problems.join("; ") || "as specified",
    });

    // --- tool-calling accuracy --------------------------------------------
    if (testCase.expectIntent && testCase.expectIntent !== "general" && !testCase.expectRefusal) {
      // Named per case where it matters. An earlier version derived it from the
      // intent, which marked `list_rigs` wrong for "which rigs are there?" —
      // the metric was measuring the test's assumption, not the agent.
      const expectedTool =
        testCase.expectTool ??
        (testCase.expectIntent === "knowledge"
          ? "search_engineering_knowledge"
          : "query_rig_telemetry");
      const called = result.trace.toolAttempts.map((a) => a.name);
      const ok = testCase.expectToolRejection
        ? result.trace.toolAttempts.some((a) => !a.accepted)
        : called.includes(expectedTool);
      toolAccuracy.push({
        id: testCase.id,
        passed: ok,
        detail: ok ? `called ${called.join(", ")}` : `called ${called.join(", ") || "nothing"}, expected ${expectedTool}`,
      });
    }

    // --- judged metrics ----------------------------------------------------
    if (result.refused) continue; // nothing to judge; behaviour already covered it

    const evidence = JSON.stringify(frames.map((f) => f.payload)).slice(0, 12_000);
    const [faithfulness, relevance] = await Promise.all([
      judgeFaithfulness({ question: testCase.query, answer: result.text, evidence, rubric: testCase.rubric }),
      judgeRelevance({ question: testCase.query, answer: result.text, rubric: testCase.rubric }),
    ]);

    faithful.push({
      id: testCase.id,
      passed: faithfulness.passed,
      detail: `${faithfulness.score.toFixed(2)} — ${faithfulness.reason}`,
    });
    relevant.push({
      id: testCase.id,
      passed: relevance.passed,
      detail: `${relevance.score.toFixed(2)} — ${relevance.reason}`,
    });
  }

  record("behaviour", "End-to-end behaviour", behaviour, "Deterministic assertions: routing, refusals, citations, required terms.");
  record("tool_accuracy", "Tool-calling accuracy", toolAccuracy, "The right tool, reached the right way.");
  record("faithfulness", "Faithfulness (LLM judge)", faithful, "Every claim traceable to the retrieved evidence.");
  record("relevance", "Answer relevance (LLM judge)", relevant, "Does it answer the question that was asked?");
}

// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const startedAt = new Date();
  console.log(
    `\n  Eval suite — ${fast ? "FAST" : "FULL"} tier` +
      `\n  model ${config.model} · judge ${config.model} · floor ${config.groundingFloor}\n`,
  );

  console.log("  Deterministic");
  await guardrailMetrics();
  await argMetrics();

  console.log("\n  Retrieval (embeddings only)");
  await retrievalMetrics();

  if (!fast) {
    console.log("\n  Routing");
    await routingMetric();
    console.log("\n  End-to-end (this one costs money)");
    await endToEndMetrics();
  } else {
    notes.push("Fast tier: routing, tool-calling and the judged metrics were not run.");
  }

  const overall = metrics.reduce((sum, m) => sum + m.score, 0) / Math.max(1, metrics.length);
  const totalCases = metrics.reduce((sum, m) => sum + m.total, 0);
  const totalPassed = metrics.reduce((sum, m) => sum + m.passed, 0);

  console.log(
    `\n  Overall ${(overall * 100).toFixed(1)}%  (${totalPassed}/${totalCases} cases across ${metrics.length} metrics)\n`,
  );
  for (const note of notes) console.log(`  ${note}\n`);

  const report = {
    generatedAt: startedAt.toISOString(),
    tier: fast ? "fast" : "full",
    model: config.model,
    embeddingModel: config.embeddingModel,
    groundingFloor: config.groundingFloor,
    overall,
    totals: { passed: totalPassed, total: totalCases },
    notes,
    metrics,
  };

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(join(REPORT_DIR, "latest.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  await writeFile(join(REPORT_DIR, "latest.md"), markdown(report), "utf8");

  // Trimmed copy for the browser: the header badge needs the scores, not every
  // case detail, and shipping the failure text to every visitor is noise.
  await mkdir(dirname(PUBLIC_REPORT), { recursive: true });
  await writeFile(
    PUBLIC_REPORT,
    JSON.stringify(
      {
        generatedAt: report.generatedAt,
        tier: report.tier,
        model: report.model,
        overall: report.overall,
        metrics: metrics.map(({ name, label, score, passed, total }) => ({
          name,
          label,
          score,
          passed,
          total,
        })),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  console.log("  Wrote evals/report/latest.{json,md} and public/eval-report.json\n");

  // Non-zero when anything failed, so this is usable as a gate.
  return totalPassed === totalCases ? 0 : 1;
}

function markdown(report: {
  generatedAt: string;
  tier: string;
  model: string;
  groundingFloor: number;
  overall: number;
  totals: { passed: number; total: number };
  notes: string[];
  metrics: Metric[];
}): string {
  const lines = [
    "# Eval report",
    "",
    `Generated ${report.generatedAt} · ${report.tier} tier · model \`${report.model}\` · grounding floor ${report.groundingFloor}`,
    "",
    `**Overall ${(report.overall * 100).toFixed(1)}%** — ${report.totals.passed}/${report.totals.total} cases across ${report.metrics.length} metrics.`,
    "",
    "| Metric | Score | Cases |",
    "|---|---:|---:|",
    ...report.metrics.map(
      (m) => `| ${m.label} | ${(m.score * 100).toFixed(1)}% | ${m.passed}/${m.total} |`,
    ),
    "",
  ];

  for (const note of report.notes) lines.push(`> ${note}`, "");

  for (const metric of report.metrics) {
    lines.push(`## ${metric.label}`, "");
    if (metric.note) lines.push(metric.note, "");
    const failures = metric.cases.filter((c) => !c.passed);
    if (!failures.length) {
      lines.push(`All ${metric.total} cases passed.`, "");
      continue;
    }
    lines.push(`${failures.length} of ${metric.total} failed:`, "");
    for (const failure of failures) lines.push(`- \`${failure.id}\` — ${failure.detail}`);
    lines.push("");
  }

  return lines.join("\n");
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("\nEval run failed:", error);
    process.exit(1);
  });
