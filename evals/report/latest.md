# Eval report

Generated 2026-08-09T20:53:21.343Z · full tier · model `gpt-4o-mini` · grounding floor 0.35

**Overall 95.9%** — 138/144 cases across 12 metrics.

| Metric | Score | Cases |
|---|---:|---:|
| Guardrail trigger rate | 100.0% | 18/18 |
| Guardrail specificity | 100.0% | 14/14 |
| Secret redaction | 100.0% | 4/4 |
| Tool argument rejection | 100.0% | 12/12 |
| Tool argument acceptance | 100.0% | 7/7 |
| Retrieval recall@6 | 100.0% | 12/12 |
| Grounding refusal (off-corpus) | 100.0% | 5/5 |
| Routing accuracy | 100.0% | 22/22 |
| End-to-end behaviour | 92.9% | 13/14 |
| Tool-calling accuracy | 100.0% | 12/12 |
| Faithfulness (LLM judge) | 83.3% | 10/12 |
| Answer relevance (LLM judge) | 75.0% | 9/12 |

> Grounding floor 0.35: in-corpus queries score 0.582 on average at rank 1, off-corpus 0.189. The floor sits 0.161 above the off-corpus mean and 0.232 below the in-corpus mean.

## Guardrail trigger rate

Adversarial inputs that must be refused, by the specific guardrail named.

All 18 cases passed.

## Guardrail specificity

Legitimate questions that must NOT be blocked. False-positive rate: 0.0%.

All 14 cases passed.

## Secret redaction

Credentials must be replaced before the text reaches the model.

All 4 cases passed.

## Tool argument rejection

Malformed or out-of-bounds calls, rejected by the correct gate.

All 12 cases passed.

## Tool argument acceptance

Legitimate calls that must pass. A bounds check that rejects these burns the model's retry budget and turns good questions into refusals.

All 7 cases passed.

## Retrieval recall@6

In-corpus questions must surface a relevant document above the floor.

All 12 cases passed.

## Grounding refusal (off-corpus)

Off-corpus questions must clear nothing. Mean top score: in-corpus 0.582, off-corpus 0.189 — separation 0.393. Floor is 0.35.

All 5 cases passed.

## Routing accuracy

Confusion: knowledge → knowledge:9; telemetry → telemetry:10; general → general:3

All 22 cases passed.

## End-to-end behaviour

Deterministic assertions: routing, refusals, citations, required terms.

1 of 14 failed:

- `e2e-iso` — answer cited no source

## Tool-calling accuracy

The right tool, reached the right way.

All 12 cases passed.

## Faithfulness (LLM judge)

Every claim traceable to the retrieved evidence.

2 of 12 failed:

- `e2e-iso` — 0.00 — The answer suggests that there are specific disciplines of configuration management under ISO 10007, naming activities like ensuring product identification and traceability, managing configuration items, and defining configuration baselines, which are not explicitly stated in the provided evidence.
- `e2e-rig-list` — 0.80 — The answer includes all three rigs and their respective details accurately, but it mentions 'designated for its specific performance range and capabilities' without specific evidence to support that claim.

## Answer relevance (LLM judge)

Does it answer the question that was asked?

3 of 12 failed:

- `e2e-transfer-fluid` — 0.60 — The answer identifies the fluid as water-based but does not specify the correct mixture with ethanol and inaccurately states the pressure level.
- `e2e-iso` — 0.40 — The answer does not list the specific disciplines of configuration management as requested, instead providing general information and mentioning that specific details are not addressed.
- `e2e-rig2-anomaly` — 0.60 — While the answer states there is something out of family on rig_2, it fails to identify that the temperature span degrades over the later part of the window, specifically noting the trend in temperature readings.
