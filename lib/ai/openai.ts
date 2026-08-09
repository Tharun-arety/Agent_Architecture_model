/**
 * The model client. Three operations, which is all the pipeline needs:
 *
 *   classify   — one call constrained by a JSON schema (the router)
 *   callTools  — one call that may request tool invocations
 *   streamText — the final answer, token by token
 *
 * Deliberately not a framework. The tool-calling loop in `loop.ts` is the part
 * of this project worth reading, and wrapping it in an SDK that hides the
 * message array would defeat the point. What lives here is the OpenAI wire
 * format and nothing else.
 *
 * Also deliberately absent: `temperature`, `top_p`. Newer models reject
 * non-default sampling parameters outright, and leaving them unset keeps the
 * code portable across whatever model id ends up in .env.
 */

import OpenAI from "openai";
import { config, hasOpenAIKey } from "@/lib/config";

export type Usage = { inputTokens: number; outputTokens: number; model: string };

export type ToolCall = { id: string; name: string; arguments: unknown };

export type ToolTurn = {
  content: string | null;
  toolCalls: ToolCall[];
  /** Appended verbatim to the transcript. Rebuilt by hand rather than passed
   *  through from the SDK response: the API rejects the extra fields the SDK
   *  attaches to a message it produced. */
  rawMessage: ChatMessage;
  usage: Usage;
};

export type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string | null; tool_calls?: RawToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type RawToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type OpenAITool = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

let cached: OpenAI | null = null;

function client(): OpenAI {
  if (!hasOpenAIKey()) {
    throw new Error(
      "OPENAI_API_KEY is not set. This project has no stub mode: every answer " +
        "it gives is grounded in a real retrieval or a real query, and a canned " +
        "one would misrepresent that.",
    );
  }
  if (!cached) cached = new OpenAI({ apiKey: config.openaiApiKey });
  return cached;
}

function usageOf(model: string, usage: { prompt_tokens?: number; completion_tokens?: number } | null | undefined): Usage {
  return {
    model,
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
  };
}

/** One call whose reply is constrained to `schema`. Used by the router. */
export async function classify<T>(
  messages: ChatMessage[],
  schema: Record<string, unknown>,
  schemaName: string,
): Promise<{ value: T; usage: Usage }> {
  const response = await client().chat.completions.create({
    model: config.model,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    response_format: {
      type: "json_schema",
      json_schema: { name: schemaName, strict: true, schema },
    },
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  return { value: JSON.parse(content) as T, usage: usageOf(config.model, response.usage) };
}

/** One call that may request tool invocations. */
export async function callTools(
  messages: ChatMessage[],
  tools: OpenAITool[],
): Promise<ToolTurn> {
  const response = await client().chat.completions.create({
    model: config.model,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: tools as any,
    max_completion_tokens: config.maxOutputTokens,
  });

  const message = response.choices[0]?.message;
  const rawCalls = (message?.tool_calls ?? []) as unknown as RawToolCall[];

  const toolCalls: ToolCall[] = rawCalls.map((call) => {
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(call.function.arguments || "{}");
    } catch {
      // Left as `{}` on purpose. Unparseable arguments are a guardrail concern,
      // not a crash: the validator downstream will reject the empty object
      // against the tool's required fields and hand the model its own error.
      parsed = {};
    }
    return { id: call.id, name: call.function.name, arguments: parsed };
  });

  const rawMessage: ChatMessage = {
    role: "assistant",
    content: message?.content ?? null,
    ...(rawCalls.length
      ? {
          tool_calls: rawCalls.map((call) => ({
            id: call.id,
            type: "function" as const,
            function: { name: call.function.name, arguments: call.function.arguments },
          })),
        }
      : {}),
  };

  return {
    content: message?.content ?? null,
    toolCalls,
    rawMessage,
    usage: usageOf(config.model, response.usage),
  };
}

/** The final answer, streamed. Yields deltas; the closing value is the usage,
 *  which OpenAI only sends on the last chunk. */
export async function* streamText(
  messages: ChatMessage[],
): AsyncGenerator<string, Usage, void> {
  const stream = await client().chat.completions.create({
    model: config.synthesisModel,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    stream: true,
    stream_options: { include_usage: true },
    max_completion_tokens: config.maxOutputTokens,
  });

  let usage: Usage = { model: config.synthesisModel, inputTokens: 0, outputTokens: 0 };
  for await (const chunk of stream) {
    if (chunk.usage) usage = usageOf(config.synthesisModel, chunk.usage);
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
  return usage;
}

/** Embeddings. Batched, because the ingest embeds a few hundred chunks and one
 *  request per chunk would be both slower and rate-limited. */
export async function embed(texts: string[]): Promise<{ vectors: number[][]; usage: Usage }> {
  const response = await client().embeddings.create({
    model: config.embeddingModel,
    input: texts,
  });
  return {
    vectors: response.data.map((row) => row.embedding),
    usage: {
      model: config.embeddingModel,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: 0,
    },
  };
}

export async function embedOne(text: string): Promise<number[]> {
  const { vectors } = await embed([text]);
  return vectors[0];
}
