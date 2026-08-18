"use client";

/**
 * The agent that answers about the person who built the site.
 *
 * A floating launcher, sized to be noticed, that expands into a chat panel.
 * It runs the same shape of pipeline as the console further up the page:
 * secrets redacted, injection refused, retrieval scored against a floor, and
 * every citation checked against what was actually retrieved.
 *
 * Citations render as the passage title rather than a bare handle, because a
 * visitor here has not read the corpus and `[ROLE-VEXOS]` means nothing to
 * them. A handle that was never retrieved still renders in the breach colour,
 * for the same reason it does in the console.
 */

import * as React from "react";
import { CornerDownLeft, Loader2, MessageSquare, ShieldCheck, X } from "lucide-react";

const SUGGESTIONS = [
  "What has he actually shipped?",
  "How does he stop an agent from making things up?",
  "Can he work in Germany, and when is he available?",
  "What would a first project with him look like?",
];

type Source = { ref: string; title: string; similarity: number };
type Turn = { role: "user" | "assistant"; content: string; sources?: Source[]; refused?: boolean };

const CITATION = /\[([A-Z][A-Z0-9-]{2,})\]/g;

/**
 * Renders `[HANDLE]` as a numbered marker, with the passages listed underneath.
 *
 * The first version put the passage title inline where the handle was, which
 * read as prose and produced sentences ending "…prevents erroneous outputs How
 * he makes agents safe to deploy." A number stays out of the way and the list
 * below says what it points at. A handle that was never retrieved is still
 * shown and still marked, for the same reason the console marks one.
 */
function Answer({ text, sources }: { text: string; sources?: Source[] }) {
  const byRef = new Map((sources ?? []).map((source) => [source.ref, source]));
  const order: Source[] = [];
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of text.matchAll(CITATION)) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push(text.slice(cursor, start));
    const ref = match[1];
    const source = byRef.get(ref);

    if (source) {
      let index = order.findIndex((entry) => entry.ref === ref);
      if (index === -1) index = order.push(source) - 1;
      parts.push(
        <sup
          key={`c-${key++}`}
          title={`${source.title} · similarity ${source.similarity.toFixed(3)}`}
          className="text-cold ml-0.5 cursor-help font-mono text-[10px]"
        >
          {index + 1}
        </sup>,
      );
    } else {
      parts.push(
        <span
          key={`c-${key++}`}
          title="This source was not retrieved for this question."
          className="text-hot border-hot/50 bg-hot/10 mx-0.5 border px-1 font-mono text-[10px]"
        >
          {ref} ?
        </span>,
      );
    }
    cursor = start + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <>
      <span className="whitespace-pre-wrap">{parts}</span>
      {order.length > 0 && (
        <span className="border-rule mt-2.5 block border-t pt-2">
          {order.map((source, index) => (
            <span key={source.ref} className="text-faint flex gap-2 text-[10.5px] leading-relaxed">
              <span className="text-cold shrink-0 font-mono">{index + 1}</span>
              <span className="min-w-0 flex-1">{source.title}</span>
              <span className="tnum shrink-0 font-mono">{source.similarity.toFixed(3)}</span>
            </span>
          ))}
        </span>
      )}
    </>
  );
}

export function ProfileAgent() {
  const [open, setOpen] = React.useState(false);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [draft, setDraft] = React.useState("");
  const [streaming, setStreaming] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refusedCount, setRefusedCount] = React.useState(0);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, streaming]);

  // Escape closes it, which is what anyone will try first.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const send = React.useCallback(
    async (message: string) => {
      const text = message.trim();
      if (!text || busy) return;

      setBusy(true);
      setError(null);
      setDraft("");
      const history = turns.map((turn) => ({ role: turn.role, content: turn.content }));
      setTurns((prev) => [...prev, { role: "user", content: text }]);

      const assistant: Turn = { role: "assistant", content: "" };
      let assembled = "";

      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        });

        if (!response.ok || !response.body) {
          const detail = await response.json().catch(() => null);
          throw new Error(detail?.error ?? "The agent is not available right now.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const eventLine = frame.match(/^event: (.+)$/m);
            const dataLine = frame.match(/^data: (.+)$/m);
            if (!eventLine || !dataLine) continue;
            const data = JSON.parse(dataLine[1]);

            if (eventLine[1] === "sources") {
              assistant.sources = data.kept as Source[];
            } else if (eventLine[1] === "token") {
              assembled += data.text;
              setStreaming(assembled);
            } else if (eventLine[1] === "final") {
              assembled = data.text || assembled;
              assistant.refused = data.refused;
            } else if (eventLine[1] === "error") {
              setError(data.message);
            }
          }
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not reach the agent.");
      } finally {
        if (assembled.trim()) {
          assistant.content = assembled.trim();
          setTurns((prev) => [...prev, assistant]);
          if (assistant.refused) setRefusedCount((n) => n + 1);
        }
        setStreaming("");
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, turns],
  );

  return (
    <>
      {/* The launcher. Large enough to be the obvious next thing to click, and
          it says what it does rather than showing a bare chat bubble. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-cold/50 bg-cold/15 text-cold hover:bg-cold/25 fixed right-5 bottom-5 z-50 flex h-14 cursor-pointer items-center gap-3 rounded-full border px-5 shadow-2xl backdrop-blur transition-colors sm:right-8 sm:bottom-8"
        >
          <MessageSquare className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-left text-[13px] leading-tight font-medium">
            Ask about my work
            <span className="text-dim block text-[10px] font-normal">grounded in my background</span>
          </span>
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Ask about Tharun's work"
          className="frame fixed right-4 bottom-4 left-4 z-50 flex max-h-[min(34rem,80dvh)] flex-col sm:right-8 sm:bottom-8 sm:left-auto sm:w-[26rem]"
        >
          <header className="border-rule bg-panel flex shrink-0 items-center gap-3 border-b px-4 py-3">
            <ShieldCheck className="text-cold size-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-ink text-[13px] leading-tight font-medium">Ask about my work</p>
              <p className="text-faint text-[10px] leading-tight">
                Answers only from what is written about me
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-faint hover:text-ink -mr-1 flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors"
            >
              <X className="size-4" />
            </button>
          </header>

          <div ref={scrollRef} className="pane-scroll min-h-0 flex-1 space-y-4 px-4 py-4">
            {turns.length === 0 && !streaming && (
              <div className="space-y-3">
                <p className="text-dim text-[12.5px] leading-relaxed">
                  This runs the same pipeline as the prototype further up the page, over a corpus
                  of my background. Ask it something it does not know and it will say so instead of
                  guessing.
                </p>
                <div className="border-rule border-t">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="border-rule text-dim hover:bg-raised hover:text-ink flex w-full cursor-pointer items-start gap-2 border-b px-1 py-2.5 text-left text-[12.5px] leading-snug transition-colors"
                    >
                      <span className="text-faint mt-px shrink-0 font-mono text-[10px]">›</span>
                      <span className="min-w-0 flex-1">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn, index) => (
              <div key={index}>
                {turn.role === "user" ? (
                  <p className="text-faint border-rule-strong border-l-2 pl-2.5 text-[12px] leading-relaxed">
                    {turn.content}
                  </p>
                ) : (
                  <div
                    className={`border-l-2 pl-2.5 ${turn.refused ? "border-warm/60" : "border-cold/50"}`}
                  >
                    <p className="text-ink text-[13px] leading-[1.65]">
                      <Answer text={turn.content} sources={turn.sources} />
                    </p>
                  </div>
                )}
              </div>
            ))}

            <div aria-live="polite" className="contents">
              {streaming && (
                <div className="border-cold/50 border-l-2 pl-2.5">
                  <p className="text-ink text-[13px] leading-[1.65] whitespace-pre-wrap">
                    {streaming}
                    <span className="bg-cold cursor-bar ml-0.5 inline-block h-3 w-[2px] align-middle" />
                  </p>
                </div>
              )}
              {busy && !streaming && (
                <p className="text-faint flex items-center gap-2 font-mono text-[10px]">
                  <Loader2 className="size-3 animate-spin" />
                  retrieving
                </p>
              )}
            </div>

            {error && (
              <p className="text-hot border-hot/40 bg-hot/5 border px-2.5 py-2 text-[11.5px] leading-relaxed">
                {error}
              </p>
            )}

            {refusedCount > 0 && (
              <p className="text-faint border-rule border-t pt-3 text-[10.5px] leading-relaxed">
                A refusal here is the grounding floor doing its job. Nothing in the corpus scored
                high enough, so no answer was written rather than one being invented.
              </p>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
            className="border-rule shrink-0 border-t p-3"
          >
            <div className="border-rule focus-within:border-cold/60 bg-inset flex items-end gap-2 border px-2.5 py-2 transition-colors">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(draft);
                  }
                }}
                rows={1}
                disabled={busy}
                aria-label="Ask about my work"
                placeholder="Ask a question…"
                className="text-ink placeholder:text-faint max-h-24 min-h-[2rem] flex-1 resize-none bg-transparent text-[13px] leading-relaxed outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Send"
                className="border-cold/40 bg-cold/10 text-cold hover:bg-cold/20 flex size-8 shrink-0 cursor-pointer items-center justify-center border transition-colors disabled:cursor-not-allowed disabled:opacity-30"
              >
                {busy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CornerDownLeft className="size-3.5" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
