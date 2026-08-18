/**
 * POST /api/chat — one agent turn, streamed as Server-Sent Events.
 *
 * Frames:
 *   agent_state  {agent, status, detail?}   what the pipeline is doing
 *   guardrail    {id, passed, reason?, ...} one verdict, as it is decided
 *   tool_result  {tool, payload}            structured data for the chart/citations
 *   token        {text}                     one delta of the answer
 *   trace        {...}                      the whole turn, measured
 *   final        {text, intent, refused}    authoritative answer
 *   error        {message}
 *
 * Structured payloads travel on their own frame so the UI renders real data.
 * The chart and the citation list never parse prose to find numbers.
 *
 * Node runtime, not Edge: the OpenAI SDK and the streaming generator want it.
 */

import { runAgent, type Frame, type Turn } from "@/lib/ai/loop";
import { config, hasDatabase, hasOpenAIKey } from "@/lib/config";
import { checkRateLimit, clientKey, sweep } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY = 16;

function sse(frame: Frame): string {
  return `event: ${frame.event}\ndata: ${JSON.stringify(frame.data)}\n\n`;
}

export async function POST(request: Request) {
  if (!hasOpenAIKey() || !hasDatabase()) {
    return Response.json(
      { error: "Server is not configured. OPENAI_API_KEY and DATABASE_URL are both required." },
      { status: 503 },
    );
  }

  sweep();
  const verdict = checkRateLimit(clientKey(request), config.rateLimitPerMinute);
  if (!verdict.allowed) {
    return Response.json(
      {
        error:
          `Rate limit reached (${config.rateLimitPerMinute}/min). This is a public demo ` +
          "spending a real API key, so the cap is deliberate.",
      },
      { status: 429, headers: { "retry-after": String(verdict.retryAfterSeconds) } },
    );
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({ error: "`message` is required." }, { status: 400 });
  if (message.length > MAX_MESSAGE_CHARS) {
    return Response.json(
      { error: `\`message\` is limited to ${MAX_MESSAGE_CHARS} characters.` },
      { status: 400 },
    );
  }

  const history: Turn[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (turn): turn is Turn =>
            !!turn &&
            typeof turn === "object" &&
            (turn as Turn).role !== undefined &&
            ["user", "assistant"].includes((turn as Turn).role) &&
            typeof (turn as Turn).content === "string",
        )
        .slice(-MAX_HISTORY)
    : [];

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (frame: Frame) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sse(frame)));
        } catch {
          // The client went away mid-stream. Stop writing; the run is
          // abandoned below rather than left spending tokens into a void.
          closed = true;
        }
      };

      try {
        await runAgent({ message, history, emit });
      } catch (cause) {
        const detail = cause instanceof Error ? cause.message : String(cause);
        console.error("Agent run failed:", cause);
        emit({ event: "error", data: { message: detail } });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed by a client disconnect */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Vercel's proxy and nginx both buffer by default, which turns a stream
      // into one delivery at the end. This is the header that stops it.
      "x-accel-buffering": "no",
    },
  });
}
