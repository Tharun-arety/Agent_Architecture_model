/**
 * LLM-as-judge, used offline only.
 *
 * Two judges, kept separate because they fail separately. An answer can be
 * perfectly relevant and completely unfaithful — the model answering from
 * pre-training rather than from what was retrieved — and a single "is this
 * good?" score hides exactly that case, which is the one worth catching.
 *
 * The prompts push toward failing. A judge asked "is this supported?" agrees
 * far too readily; a judge told that an unsupported specific is a failure even
 * when the answer is true will actually mark it. This biases toward false
 * negatives, which is the right direction for a metric you intend to act on.
 *
 * Neither judge runs at request time. See `components/InspectorDrawer.tsx`.
 */

import { classify, type Usage } from "@/lib/ai/openai";

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    score: {
      type: "number",
      description: "0.0 to 1.0. Be strict; reserve 1.0 for answers with no defect.",
    },
    passed: { type: "boolean" },
    reason: { type: "string", description: "One or two sentences naming the specific defect, or its absence." },
  },
  required: ["score", "passed", "reason"],
  additionalProperties: false,
} as const;

export type Verdict = { score: number; passed: boolean; reason: string; usage: Usage };

const FAITHFULNESS_PROMPT = `\
You judge whether an assistant's answer is FAITHFUL to the evidence it was given.

Faithful means: every factual claim in the answer is supported by the evidence \
block. Nothing else counts as support.

Mark it unfaithful if the answer:
- states a number, name, date or specification that does not appear in the evidence
- attributes a claim to a source that does not carry it
- asserts something the evidence merely implies, as though the evidence stated it
- fills a gap in the evidence from general knowledge

An answer can be TRUE and still unfaithful. That is a failure, not a technicality: \
it means the grounding did no work, and the same behaviour on a question the model \
happens to be wrong about produces a confident fabrication.

Saying "the evidence does not cover this" is FAITHFUL and should score highly. \
Refusing to answer when the evidence does cover it is not unfaithful, but note it \
in your reason.

Judge only faithfulness. Style, length and helpfulness are not your concern.`;

const RELEVANCE_PROMPT = `\
You judge whether an assistant's answer ADDRESSES the question it was asked.

Relevant means: a reader with that question would have it answered, or would be \
told plainly why it cannot be.

Mark it irrelevant if the answer:
- answers a different, adjacent question
- dumps data without saying what it means for the question
- is so hedged that no position is taken

An explicit, specific refusal — naming what is missing — is RELEVANT. A vague \
non-answer is not.

Judge only relevance. Whether the content is factually correct is not your concern.`;

async function judge(
  systemPrompt: string,
  userContent: string,
  schemaName: string,
): Promise<Verdict> {
  const { value, usage } = await classify<{ score: number; passed: boolean; reason: string }>(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    VERDICT_SCHEMA as unknown as Record<string, unknown>,
    schemaName,
  );
  return { ...value, usage };
}

export function judgeFaithfulness(input: {
  question: string;
  answer: string;
  evidence: string;
  rubric?: string;
}): Promise<Verdict> {
  return judge(
    FAITHFULNESS_PROMPT,
    [
      `QUESTION\n${input.question}`,
      `EVIDENCE THE ASSISTANT WAS GIVEN\n${input.evidence || "(none — no retrieval ran)"}`,
      `ANSWER\n${input.answer}`,
      input.rubric ? `WHAT A GOOD ANSWER LOOKS LIKE\n${input.rubric}` : "",
    ]
      .filter(Boolean)
      .join("\n\n---\n\n"),
    "faithfulness_verdict",
  );
}

export function judgeRelevance(input: {
  question: string;
  answer: string;
  rubric?: string;
}): Promise<Verdict> {
  return judge(
    RELEVANCE_PROMPT,
    [
      `QUESTION\n${input.question}`,
      `ANSWER\n${input.answer}`,
      input.rubric ? `WHAT A GOOD ANSWER LOOKS LIKE\n${input.rubric}` : "",
    ]
      .filter(Boolean)
      .join("\n\n---\n\n"),
    "relevance_verdict",
  );
}
