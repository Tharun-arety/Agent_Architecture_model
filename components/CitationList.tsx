"use client";

/**
 * The passages the answer was actually built from.
 *
 * Shown in full, with the score and a link to the source. A citation the reader
 * cannot open is a citation they have to take on trust, and taking retrieval on
 * trust is the habit this whole project is arguing against.
 *
 * `focus` is set when a `[SOURCE-REF]` in the answer is clicked: the matching
 * passage opens and scrolls into view. Where a source contributed several
 * passages, the highest-scoring one wins — it is the one that most likely
 * carried the claim.
 */

import * as React from "react";
import { ChevronRight, ExternalLink, FileText } from "lucide-react";

import type { KnowledgePayload } from "@/lib/types";

export type CitationFocus = { sourceRef: string; nonce: number } | null;

export function CitationList({ data, focus }: { data: KnowledgePayload; focus?: CitationFocus }) {
  // Two things can open a passage — a click on it here, or a click on a
  // citation in the answer — so each carries a nonce and the more recent one
  // wins. Deriving the open passage during render rather than synchronising two
  // sources of truth in an effect means the list cannot briefly disagree with
  // itself.
  const [manual, setManual] = React.useState<{ key: string | null; nonce: number }>({
    key: null,
    nonce: -1,
  });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const keyOf = (hit: KnowledgePayload["hits"][number], index: number) =>
    `${hit.sourceRef}-${hit.chunkIndex}-${index}`;

  // The best-scoring passage for each source, so a click has one destination.
  const targetKey = React.useMemo(() => {
    if (!focus) return null;
    let best: { key: string; similarity: number } | null = null;
    data.hits.forEach((hit, index) => {
      if (hit.sourceRef.toUpperCase() !== focus.sourceRef) return;
      if (!best || hit.similarity > best.similarity) {
        best = { key: keyOf(hit, index), similarity: hit.similarity };
      }
    });
    return best ? (best as { key: string }).key : null;
  }, [data.hits, focus]);

  const focusNonce = focus?.nonce ?? -1;
  const openKey = manual.nonce >= focusNonce ? manual.key : targetKey;

  // Scrolling is a real DOM side effect, so it belongs here — but nothing in
  // this effect sets state. It is keyed on the nonce as well as the target, so
  // clicking the same citation twice scrolls back to it rather than doing
  // nothing the second time.
  React.useEffect(() => {
    if (!targetKey || focusNonce < 0) return;
    const node = containerRef.current?.querySelector(`[data-passage="${targetKey}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetKey, focusNonce]);

  const toggle = (key: string) =>
    setManual((prev) => ({
      key: openKey === key ? null : key,
      nonce: Math.max(prev.nonce, focusNonce) + 1,
    }));

  return (
    <div className="border-border bg-surface flex h-full flex-col rounded-lg border">
      <header className="border-border border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="text-accent size-4" />
          Retrieved evidence
        </h2>
        <p className="text-fg-subtle mt-0.5 truncate text-[11px]">
          {data.hits.length} passage{data.hits.length === 1 ? "" : "s"} above the grounding floor
          {data.query ? ` for “${data.query}”` : ""} · click a citation in the answer to jump here
        </p>
      </header>

      <div ref={containerRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {data.hits.length === 0 && (
          <p className="text-fg-subtle text-xs">
            Nothing cleared the similarity floor, so nothing was passed to the model.
          </p>
        )}
        {data.hits.map((hit, index) => {
          const key = keyOf(hit, index);
          return (
            <Passage
              key={key}
              passageKey={key}
              hit={hit}
              open={openKey === key}
              highlighted={targetKey === key && focusNonce >= manual.nonce}
              onToggle={() => toggle(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Passage({
  passageKey,
  hit,
  open,
  highlighted,
  onToggle,
}: {
  passageKey: string;
  hit: KnowledgePayload["hits"][number];
  open: boolean;
  highlighted: boolean;
  onToggle: () => void;
}) {
  // Above 0.5 is a strong match for this embedding model; between the floor and
  // 0.5 is "relevant, but weigh it". Colouring the score makes that legible
  // without a legend.
  const tone = hit.similarity >= 0.5 ? "text-ok" : "text-warn";

  return (
    <div
      data-passage={passageKey}
      className={`rounded-md border transition ${
        highlighted ? "border-accent/60 bg-accent/5" : "border-border bg-surface-muted"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-2 px-2.5 py-2 text-left"
      >
        <ChevronRight
          className={`text-fg-subtle mt-0.5 size-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-accent shrink-0 font-mono text-[10px]">{hit.sourceRef}</span>
            <span className={`tnum shrink-0 text-[10px] ${tone}`}>{hit.similarity.toFixed(3)}</span>
          </span>
          <span className="text-fg-muted mt-0.5 block truncate text-[11px]">{hit.docTitle}</span>
        </span>
      </button>

      {open && (
        <div className="border-border space-y-2 border-t px-2.5 py-2">
          <p className="text-fg-muted text-[11px] leading-relaxed whitespace-pre-wrap">{hit.text}</p>
          <a
            href={hit.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-fg inline-flex items-center gap-1 text-[10px] transition"
          >
            <ExternalLink className="size-2.5" />
            {new URL(hit.sourceUrl).hostname}
          </a>
        </div>
      )}
    </div>
  );
}
