/**
 * The pipeline, and the three decisions worth defending.
 *
 * Quieter than a feature row on purpose. By this point a technical reader wants
 * file names, and everyone else has already stopped.
 */

import { REPO_URL } from "@/components/site/system-entries";

const PIPELINE = `User query
    |
    v
+--------------------+   secrets redacted . injections refused . off-topic declined
|  INPUT GUARDRAILS  |   deterministic, and BEFORE the first model call
+---------+----------+
          v
     +---------+
     | Router  |  knowledge | telemetry | general
     +----+----+
   +------+------+
   v             v
+---------+  +----------+
|Knowledge|  |Telemetry |   hand-written tool loop, ceiling of 3 iterations
|  agent  |  |  agent   |
+----+----+  +----+-----+
     |            |
     v            v
+--------------------+   ajv against the same schema the model got, plus bounds
|   ARG GUARDRAILS   |   only the database knows. Rejection goes back to the
+---------+----------+   model as a tool message and it corrects itself.
          v
+--------------------+   cosine floor 0.35, calibrated. Nothing above it means
| GROUNDING GUARDRAIL|   refuse, and skip the synthesis call entirely.
+---------+----------+
          v
     Synthesiser --> SSE --> chat and inspector
                              |
                              +-> citation check: every cited source has to
                                  have been retrieved, and each one links to
                                  the passage it came from`;

const DECISIONS = [
  {
    title: "The tool loop is written by hand",
    file: "lib/ai/loop.ts",
    body: "No Vercel AI SDK and no LangGraph. The message array, the tool calls, the tool replies and the iteration ceiling are all in one readable file, which is what lets the argument guardrail sit exactly where it has to: between the model asking for a call and the call happening.",
  },
  {
    title: "One schema serves the model and the validator",
    file: "lib/ai/guardrails/args.ts",
    body: "OpenAI tool parameters are already JSON Schema, so ajv compiles against the same literal the model was given. A Zod mirror would be a second source of truth, and the day it drifts from the first is the day the validator stops describing what the model was told.",
  },
  {
    title: "Retrieval runs in Postgres",
    file: "lib/db/queries.ts",
    body: "Neon with pgvector, so the embeddings live next to the telemetry and both are queryable with SQL. For a corpus this size that is faster to operate and cheaper to reason about than a separate service.",
  },
];

export function HowItsBuilt() {
  return (
    <section className="bg-veil">
      <div className="shell py-16 lg:py-24">
        <span className="eyebrow">How it is built</span>
        <h2 className="display-sm text-ink mt-5 max-w-[26ch]">
          Every check sits between two steps of the pipeline
        </h2>

        <div className="frame mt-10 overflow-x-auto p-5">
          <pre className="text-dim font-mono text-[10.5px] leading-[1.55] whitespace-pre">
            {PIPELINE}
          </pre>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-12">
          {DECISIONS.map((decision) => (
            <div key={decision.title}>
              <h3 className="text-ink text-[15px] leading-snug font-medium">{decision.title}</h3>
              <p className="text-dim mt-3 text-[13.5px] leading-[1.7]">{decision.body}</p>
              <a
                href={`${REPO_URL}/blob/main/${decision.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cold hover:text-ink mt-3 inline-block font-mono text-[11px] underline decoration-dotted underline-offset-4 transition-colors"
              >
                {decision.file}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
