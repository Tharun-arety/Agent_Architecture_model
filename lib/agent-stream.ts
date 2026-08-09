/**
 * SSE client for POST /api/chat.
 *
 * The browser's `EventSource` only issues GET requests and this endpoint needs
 * a JSON body, so the stream is read off `fetch` and the frames are parsed by
 * hand. That is about forty lines and removes a dependency.
 */

import type { Frame } from "@/lib/types";

const KNOWN = new Set(["agent_state", "guardrail", "tool_result", "token", "trace", "final", "error"]);

function parseFrame(raw: string): Frame | null {
  let event = "message";
  const data: string[] = [];

  for (const line of raw.split("\n")) {
    if (line.startsWith(":")) continue; // keep-alive comment
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }

  if (!data.length || !KNOWN.has(event)) return null;
  try {
    return { event, data: JSON.parse(data.join("\n")) } as Frame;
  } catch {
    console.warn("Unparseable SSE payload", data);
    return null;
  }
}

export async function* streamAgent(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  signal?: AbortSignal,
): AsyncGenerator<Frame> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!response.ok || !response.body) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      /* not JSON; the status line is all there is */
    }
    throw new Error(detail);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      // Normalise CRLF so one split rule works whatever terminates the lines.
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const frame = parseFrame(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (frame) yield frame;
        boundary = buffer.indexOf("\n\n");
      }
    }
    // A trailing frame with no blank line after it still deserves delivery.
    const tail = parseFrame(buffer);
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}
