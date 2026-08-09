/**
 * The pipeline. Input guardrails -> router -> spoke tool loop -> grounding ->
 * synthesis, emitting SSE frames as it goes.
 *
 * The tool-calling loop is written out rather than delegated to a framework.
 * That is the point of this file: the message array, the tool_calls, the
 * `role: "tool"` replies and the iteration ceiling are all visible, and the
 * argument guardrail sits exactly where it has to sit — between the model
 * asking for a call and the call happening.
 *
 * Two properties worth stating, because both are easy to get wrong:
 *
 *   - A rejected tool call is appended to the transcript as a tool message, so
 *     the model reads its own error and corrects. It is not an exception. The
 *     turn still ends with an answer.
 *   - A refusal short-circuits. When a guardrail blocks, no downstream model
 *     call is made — not the router, not the synthesiser. A pipeline that
 *     refuses *after* paying for the answer has not saved anything.
 */

import { config } from "@/lib/config";
import { applyGroundingFloor, checkCitations, formatEvidence } from "@/lib/ai/guardrails/grounding";
import { validateToolCall } from "@/lib/ai/guardrails/args";
import { runInputGuardrails } from "@/lib/ai/guardrails/input";
import { REFUSAL, type GuardrailVerdict } from "@/lib/ai/guardrails/types";
import { callTools, classify, streamText, type ChatMessage } from "@/lib/ai/openai";
import {
  GENERAL_PROMPT,
  ROUTER_PROMPT,
  ROUTER_SCHEMA,
  SPOKE_PROMPTS,
  SYNTHESIS_PROMPT,
} from "@/lib/ai/prompts";
import "@/lib/ai/tools"; // side effect: populates TOOL_REGISTRY
import { TOOL_REGISTRY, asOpenAITool, toolsForDomain, type ToolDomain } from "@/lib/ai/tools/registry";
import { TraceBuilder, type TurnTrace } from "@/lib/ai/trace";
import type { KnowledgeHit } from "@/lib/db/queries";

export type Frame =
  | { event: "agent_state"; data: { agent: string; status: string; detail?: string } }
  | { event: "guardrail"; data: GuardrailVerdict }
  | { event: "tool_result"; data: { tool: string; payload: unknown } }
  | { event: "token"; data: { text: string } }
  | { event: "trace"; data: TurnTrace }
  | { event: "final"; data: { text: string; intent: string; refused: boolean } }
  | { event: "error"; data: { message: string } };

export type Emit = (frame: Frame) => Promise<void> | void;

export type Turn = { role: "user" | "assistant"; content: string };

type Intent = "knowledge" | "telemetry" | "general";

export type RunResult = { text: string; intent: Intent; refused: boolean; trace: TurnTrace };

export async function runAgent(options: {
  message: string;
  history?: Turn[];
  emit: Emit;
}): Promise<RunResult> {
  const { message, history = [], emit } = options;
  const trace = new TraceBuilder();

  // -------------------------------------------------------------------------
  // 1. Input guardrails — before any model call
  // -------------------------------------------------------------------------
  await emit({ event: "agent_state", data: { agent: "Guardrails", status: "checking input" } });

  const guardStarted = performance.now();
  const input = runInputGuardrails(message);
  trace.stage("input_guardrails", performance.now() - guardStarted);
  trace.guardrail(...input.verdicts);
  for (const verdict of input.verdicts) await emit({ event: "guardrail", data: verdict });

  if (input.blocked) {
    trace.refuse(input.blocked.by.id);
    return finish(emit, trace, input.blocked.reason, "general", true);
  }

  // -------------------------------------------------------------------------
  // 2. Router
  // -------------------------------------------------------------------------
  await emit({ event: "agent_state", data: { agent: "Router", status: "thinking" } });

  const routerStarted = performance.now();
  const { value: decision, usage: routerUsage } = await classify<{
    intent: Intent;
    rationale: string;
  }>(
    [
      { role: "system", content: ROUTER_PROMPT },
      ...toMessages(history),
      { role: "user", content: input.text },
    ],
    ROUTER_SCHEMA as unknown as Record<string, unknown>,
    "route_decision",
  );
  trace.stage("router", performance.now() - routerStarted, routerUsage);

  const intent: Intent = ["knowledge", "telemetry", "general"].includes(decision.intent)
    ? decision.intent
    : "general";
  trace.setRoute(intent, decision.rationale ?? "");

  // A meta question ("what can you do?") routed to a data spoke would call a
  // tool it has no argument for. The input layer already identified it, and
  // that signal is more reliable here than the router's.
  const effectiveIntent: Intent = input.isMeta && intent !== "telemetry" ? "general" : intent;

  await emit({
    event: "agent_state",
    data: { agent: "Router", status: "routed", detail: `${effectiveIntent} — ${decision.rationale}` },
  });

  // -------------------------------------------------------------------------
  // 3. Spoke: the hand-rolled tool loop
  // -------------------------------------------------------------------------
  let evidence = "";
  let keptHits: KnowledgeHit[] = [];

  if (effectiveIntent !== "general") {
    const domain = effectiveIntent as ToolDomain;
    const agentLabel = domain === "knowledge" ? "Knowledge Agent" : "Telemetry Agent";
    await emit({ event: "agent_state", data: { agent: agentLabel, status: "working" } });

    const specs = toolsForDomain(domain);
    const messages: ChatMessage[] = [
      { role: "system", content: SPOKE_PROMPTS[domain] },
      ...toMessages(history),
      { role: "user", content: input.text },
    ];

    const payloads: { tool: string; payload: unknown }[] = [];
    let argRetries = 0;
    const loopStarted = performance.now();

    for (let iteration = 0; iteration < config.maxToolIterations; iteration++) {
      const turn = await callTools(messages, specs.map(asOpenAITool));
      trace.attachUsage("tool_loop", turn.usage);
      messages.push(turn.rawMessage);

      if (!turn.toolCalls.length) break;

      for (const call of turn.toolCalls) {
        const spec = TOOL_REGISTRY.get(call.name);
        if (!spec) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ error: `Unknown tool ${call.name}.` }),
          });
          continue;
        }

        await emit({
          event: "agent_state",
          data: { agent: agentLabel, status: "calling tool", detail: call.name },
        });

        const attemptStarted = performance.now();
        const check = await validateToolCall(spec, call.arguments);
        trace.guardrail(...check.verdicts);
        for (const verdict of check.verdicts) await emit({ event: "guardrail", data: verdict });

        // --- rejected: hand the model its own error and let it correct -----
        if (!check.args) {
          argRetries += 1;
          trace.tool({
            name: call.name,
            arguments: call.arguments,
            accepted: false,
            verdicts: check.verdicts,
            durationMs: Math.round(performance.now() - attemptStarted),
            error: check.message,
          });
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ error: check.message, retry: argRetries <= config.maxArgRetries }),
          });
          continue;
        }

        // --- accepted -------------------------------------------------------
        let payload: unknown;
        try {
          payload = await spec.handler(check.args);
        } catch (cause) {
          const detail = cause instanceof Error ? cause.message : String(cause);
          trace.tool({
            name: call.name,
            arguments: check.args,
            accepted: true,
            verdicts: check.verdicts,
            durationMs: Math.round(performance.now() - attemptStarted),
            error: detail,
          });
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ error: detail }),
          });
          continue;
        }

        trace.tool({
          name: call.name,
          arguments: check.args,
          accepted: true,
          verdicts: check.verdicts,
          durationMs: Math.round(performance.now() - attemptStarted),
        });

        // --- grounding, for retrieval results only --------------------------
        let modelFacing: unknown = payload;
        if (spec.domain === "knowledge") {
          const hits = (payload as { hits: KnowledgeHit[] }).hits ?? [];
          const grounding = applyGroundingFloor(hits);
          trace.guardrail(grounding.verdict);
          await emit({ event: "guardrail", data: grounding.verdict });
          trace.setRetrieval({
            floor: config.groundingFloor,
            kept: grounding.kept.map((h) => ({
              sourceRef: h.sourceRef,
              docTitle: h.docTitle,
              sourceUrl: h.sourceUrl,
              similarity: h.similarity,
            })),
            rejected: grounding.rejected.map((h) => ({
              sourceRef: h.sourceRef,
              similarity: h.similarity,
            })),
          });

          keptHits = grounding.kept;
          // Sub-floor passages never enter the context window. This is the
          // substitution that makes the floor real rather than advisory.
          modelFacing = { query: (payload as { query: string }).query, hits: grounding.kept };
        }

        payloads.push({ tool: call.name, payload: modelFacing });
        await emit({ event: "tool_result", data: { tool: call.name, payload: modelFacing } });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(modelFacing).slice(0, 12_000),
        });
      }

      if (argRetries > config.maxArgRetries) break;
    }

    trace.stage("tool_loop", performance.now() - loopStarted);

    // Retrieval ran and nothing cleared the floor: refuse without paying for a
    // synthesis call that could only have invented an answer.
    if (domain === "knowledge" && payloads.length && keptHits.length === 0) {
      trace.refuse("grounding.floor");
      return finish(emit, trace, REFUSAL.ungrounded, effectiveIntent, true);
    }

    // Every attempt was rejected and the budget is spent. Refuse concretely
    // rather than letting the synthesiser narrate an empty evidence block.
    if (!payloads.length && argRetries > config.maxArgRetries) {
      trace.refuse("args.bounds");
      return finish(emit, trace, REFUSAL.argsExhausted, effectiveIntent, true);
    }

    evidence = JSON.stringify(payloads).slice(0, 14_000);
    if (domain === "knowledge" && keptHits.length) evidence = formatEvidence(keptHits);
  }

  // -------------------------------------------------------------------------
  // 4. Synthesis
  // -------------------------------------------------------------------------
  await emit({ event: "agent_state", data: { agent: "Synthesizer", status: "writing" } });

  const question = evidence
    ? `${input.text}\n\n<evidence>\n${evidence}\n</evidence>\n\nAnswer using only the evidence above.`
    : input.text;

  const synthesisStarted = performance.now();
  const stream = streamText([
    { role: "system", content: effectiveIntent === "general" ? GENERAL_PROMPT : SYNTHESIS_PROMPT },
    ...toMessages(history),
    { role: "user", content: question },
  ]);

  const chunks: string[] = [];
  let next = await stream.next();
  while (!next.done) {
    chunks.push(next.value);
    await emit({ event: "token", data: { text: next.value } });
    next = await stream.next();
  }
  trace.stage("synthesis", performance.now() - synthesisStarted, next.value);

  const answer = chunks.join("").trim();

  // -------------------------------------------------------------------------
  // 5. Citation check — after the answer exists
  // -------------------------------------------------------------------------
  if (effectiveIntent === "knowledge") {
    const citations = checkCitations(answer, keptHits);
    trace.guardrail(citations);
    await emit({ event: "guardrail", data: citations });
  }

  return finish(emit, trace, answer, effectiveIntent, false);
}

async function finish(
  emit: Emit,
  trace: TraceBuilder,
  text: string,
  intent: Intent,
  refused: boolean,
): Promise<RunResult> {
  const built = trace.build();
  if (refused) await emit({ event: "token", data: { text } });
  await emit({ event: "trace", data: built });
  await emit({ event: "final", data: { text, intent, refused } });
  return { text, intent, refused, trace: built };
}

const toMessages = (history: Turn[]): ChatMessage[] =>
  history.slice(-8).map((turn) => ({ role: turn.role, content: turn.content }));
