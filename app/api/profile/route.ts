/**
 * POST /api/profile. One question about the person who built this, streamed.
 *
 * The same pipeline as the main agent, over a different corpus. Secrets are
 * redacted and injections refused before the first model call, retrieval runs
 * against the committed profile corpus, a floor decides whether there is enough
 * evidence to answer at all, and every citation is checked against what was
 * actually retrieved.
 *
 * Two deliberate differences from `/api/chat`.
 *
 * There is no tool loop, because there are no tools. The only thing this agent
 * can do is read passages, so the argument guardrail has nothing to guard and
 * adding it would be decoration.
 *
 * There is no domain guardrail either. The main agent needs one because it
 * covers a subject with an edge. Here the floor does that job: ask about
 * something this corpus does not hold, nothing clears 0.28, and the turn ends
 * without a model call. That is the same argument the README makes about the
 * floor being the backstop, applied honestly.
 *
 * Frames match the main route so the two are read the same way:
 *   guardrail  {id, passed, reason?, latencyMs}
 *   sources    {kept, rejected, floor}
 *   token      {text}
 *   final      {text, refused, citedUnknown}
 *   error      {message}
 */

import { checkInjection, redactSecrets } from "@/lib/ai/guardrails/input";
import { streamText, type ChatMessage } from "@/lib/ai/openai";
import { config, hasOpenAIKey } from "@/lib/config";
import { CORPUS_STALE, PROFILE_FLOOR, retrieveProfile } from "@/lib/profile/retrieve";
import { checkRateLimit, clientKey, sweep } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_MESSAGE_CHARS = 500;
const MAX_HISTORY = 8;

const REFUSAL =
  "I only answer from what is written about Tharun's background and projects, and nothing in there covers that. Ask about his experience, the systems he has built, how he handles guardrails or evals, or how to get in touch.";

const SYSTEM = `\
You answer questions about Tharun Arety, using only the passages provided.

Rules:
- Answer only from the passages. If they do not cover the question, say so in one \
sentence and suggest what you can answer instead. Never guess and never fill a gap \
from general knowledge.
- Cite the passage each claim came from with its handle in square brackets, like \
[ROLE-VEXOS]. Cite only handles that appear in the passages given to you.
- Write in third person about Tharun. Two or three sentences is usually right. \
Four is the maximum.
- Be concrete. Prefer the specific number, system or role name over a summary of it.
- You are talking to someone deciding whether to hire or contract him, so answer \
the question asked rather than selling.`;

const CITATION = /\[([A-Z][A-Z0-9-]{2,})\]/g;

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  if (!hasOpenAIKey()) {
    return Response.json({ error: "Server is not configured." }, { status: 503 });
  }
  if (CORPUS_STALE) {
    // content/profile.ts was edited without re-running npm run embed:profile.
    // Answering would mean citing text that no longer matches the source.
    return Response.json(
      { error: "The profile corpus is out of date on this deployment." },
      { status: 503 },
    );
  }

  sweep();
  const verdict = checkRateLimit(`profile:${clientKey(request)}`, config.rateLimitPerMinute);
  if (!verdict.allowed) {
    return Response.json(
      { error: `Rate limit reached (${config.rateLimitPerMinute}/min). This is a public demo.` },
      { status: 429, headers: { "retry-after": String(verdict.retryAfterSeconds) } },
    );
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const raw = typeof body.message === "string" ? body.message.trim() : "";
  if (!raw) return Response.json({ error: "`message` is required." }, { status: 400 });
  if (raw.length > MAX_MESSAGE_CHARS) {
    return Response.json(
      { error: `Questions are limited to ${MAX_MESSAGE_CHARS} characters.` },
      { status: 400 },
    );
  }

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter(
      (turn): turn is { role: "user" | "assistant"; content: string } =>
        !!turn &&
        typeof turn === "object" &&
        ["user", "assistant"].includes((turn as { role?: string }).role ?? "") &&
        typeof (turn as { content?: unknown }).content === "string",
    )
    .slice(-MAX_HISTORY);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      try {
        // 1. Input guardrails, before anything is sent anywhere.
        const redaction = redactSecrets(raw);
        send("guardrail", redaction.verdict);

        const injection = checkInjection(redaction.text);
        send("guardrail", injection);
        if (!injection.passed) {
          send("final", { text: injection.reason, refused: true, citedUnknown: [] });
          controller.close();
          return;
        }

        // 2. Retrieval, and the floor.
        const started = performance.now();
        const { kept, rejected } = await retrieveProfile(redaction.text);
        const retrievalMs = performance.now() - started;

        send("sources", {
          floor: PROFILE_FLOOR,
          kept: kept.map((hit) => ({
            ref: hit.ref,
            title: hit.title,
            similarity: hit.similarity,
          })),
          rejected: rejected.map((hit) => ({ ref: hit.ref, similarity: hit.similarity })),
        });

        send("guardrail", {
          id: "grounding.floor",
          passed: kept.length > 0,
          latencyMs: retrievalMs,
          reason: kept.length > 0 ? undefined : REFUSAL,
          detail: { floor: PROFILE_FLOOR, kept: kept.length, best: rejected[0]?.similarity ?? 0 },
        });

        if (kept.length === 0) {
          // Nothing cleared the floor, so there is nothing to write from. The
          // synthesis call is skipped entirely rather than hedged.
          send("final", { text: REFUSAL, refused: true, citedUnknown: [] });
          controller.close();
          return;
        }

        // 3. Synthesis, from the passages that cleared it.
        const context = kept
          .map((hit) => `[${hit.ref}] ${hit.title}\n${hit.text}`)
          .join("\n\n");

        const messages: ChatMessage[] = [
          { role: "system", content: SYSTEM },
          ...history.map((turn) => ({ role: turn.role, content: turn.content }) as ChatMessage),
          {
            role: "user",
            content: `Passages:\n\n${context}\n\nQuestion: ${redaction.text}`,
          },
        ];

        let answer = "";
        const generator = streamText(messages);
        while (true) {
          const next = await generator.next();
          if (next.done) break;
          answer += next.value;
          send("token", { text: next.value });
        }

        // 4. Citation check. Every handle named has to be one that was retrieved.
        const known = new Set(kept.map((hit) => hit.ref));
        const cited = [...answer.matchAll(CITATION)].map((match) => match[1]);
        const citedUnknown = [...new Set(cited.filter((ref) => !known.has(ref)))];

        send("guardrail", {
          id: "grounding.citations",
          passed: citedUnknown.length === 0,
          latencyMs: 0,
          reason: citedUnknown.length
            ? `Cited ${citedUnknown.join(", ")}, which was not retrieved for this question.`
            : undefined,
          detail: { cited: [...new Set(cited)], unknown: citedUnknown },
        });

        send("final", { text: answer, refused: false, citedUnknown });
        controller.close();
      } catch (cause) {
        send("error", {
          message: cause instanceof Error ? cause.message : "The agent could not answer.",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
