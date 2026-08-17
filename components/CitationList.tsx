"use client";

/**
 * The evidence pane.
 *
 * Most RAG interfaces render retrieval as a list with a number beside each row,
 * which hides the fact that the number is being judged. Here the grounding
 * floor is drawn as a rule across the pane, passages sit above or below it by
 * score, and the ones below stay on screen.
 *
 * That matters because the floor is a claim about separation. In-corpus
 * questions score 0.582 at rank 1 on average and off-corpus questions score
 * 0.189, so 0.35 sits inside a gap of 0.393. Showing the rejected passages is
 * what lets a reader check that rather than take it on trust.
 *
 * `focus` is set when a `[SOURCE-REF]` in an answer is clicked: the matching
 * passage opens and scrolls into view. Where a source contributed several
 * passages the highest-scoring one wins, since it most likely carried the claim.
 */

import * as React from "react";
import { ChevronRight, ExternalLink } from "lucide-react";

import type { KnowledgePayload } from "@/lib/types";

export type CitationFocus = { sourceRef: string; nonce: number } | null;

/** Scores from this embedding model live in roughly 0.1–0.8, so a 0–1 axis
 *  would compress every bar into the left third and make them unreadable. */
const SCALE_MAX = 0.85;
const pct = (score: number) => Math.max(2, Math.min(100, (score / SCALE_MAX) * 100));

export function CitationList({
  data,
  floor,
  focus,
}: {
  data: KnowledgePayload;
  floor: number;
  focus?: CitationFocus;
}) {
  // Two things can open a passage: a click here, or a citation in the answer.
  // Each carries a nonce and the more recent wins. Derived during render
  // rather than synchronised in an effect, so the list cannot disagree with
  // itself for a frame.
  const [manual, setManual] = React.useState<{ key: string | null; nonce: number }>({
    key: null,
    nonce: -1,
  });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const keyOf = (hit: KnowledgePayload["hits"][number], index: number) =>
    `${hit.sourceRef}-${hit.chunkIndex}-${index}`;

  // `hits` cleared the floor; `rejected` did not and is sent to the interface
  // only. Merged and re-sorted here so the pane is one ranked column with the
  // threshold drawn through it.
  const ranked = React.useMemo(
    () =>
      [...data.hits, ...(data.rejected ?? [])]
        .sort((a, b) => b.similarity - a.similarity)
        .map((hit, index) => ({ hit, key: keyOf(hit, index) })),
    [data.hits, data.rejected],
  );
  const kept = ranked.filter((row) => row.hit.similarity >= floor);
  const rejected = ranked.filter((row) => row.hit.similarity < floor);

  const targetKey = React.useMemo(() => {
    if (!focus) return null;
    let best: { key: string; similarity: number } | null = null;
    for (const row of ranked) {
      if (row.hit.sourceRef.toUpperCase() !== focus.sourceRef) continue;
      if (!best || row.hit.similarity > best.similarity) {
        best = { key: row.key, similarity: row.hit.similarity };
      }
    }
    return best ? (best as { key: string }).key : null;
  }, [ranked, focus]);

  const focusNonce = focus?.nonce ?? -1;
  const openKey = manual.nonce >= focusNonce ? manual.key : targetKey;

  // Scrolling is a real DOM side effect and belongs in an effect; nothing here
  // sets state. Keyed on the nonce too, so clicking the same citation twice
  // scrolls back to it instead of doing nothing.
  React.useEffect(() => {
    if (!targetKey || focusNonce < 0) return;
    containerRef.current
      ?.querySelector(`[data-passage="${targetKey}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetKey, focusNonce]);

  const toggle = (key: string) =>
    setManual((prev) => ({
      key: openKey === key ? null : key,
      nonce: Math.max(prev.nonce, focusNonce) + 1,
    }));

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-2">
        <h3 className="legend shrink-0 after:hidden">Retrieved evidence</h3>
        <p className="text-faint min-w-0 flex-1 truncate text-[11px]">
          {data.query ? `“${data.query}”` : "no query"}
        </p>
        <span className="tnum text-faint shrink-0 font-mono text-[10px]">
          <span className="text-cold">{kept.length}</span> above ·{" "}
          <span className="text-hot">{rejected.length}</span> below
        </span>
      </header>

      <div
        ref={containerRef}
        className="border-rule bg-panel pane-scroll min-h-0 flex-1 border"
      >
        {ranked.length === 0 && (
          <p className="text-faint p-4 text-xs">Nothing was retrieved for this turn.</p>
        )}

        {kept.map((row) => (
          <Passage
            key={row.key}
            passageKey={row.key}
            hit={row.hit}
            open={openKey === row.key}
            highlighted={targetKey === row.key && focusNonce >= manual.nonce}
            onToggle={() => toggle(row.key)}
          />
        ))}

        {ranked.length > 0 && <FloorRule floor={floor} rejectedCount={rejected.length} />}

        {rejected.map((row) => (
          <Passage
            key={row.key}
            passageKey={row.key}
            hit={row.hit}
            below
            open={openKey === row.key}
            highlighted={targetKey === row.key && focusNonce >= manual.nonce}
            onToggle={() => toggle(row.key)}
          />
        ))}
      </div>
    </section>
  );
}

/** The threshold, drawn. Everything above it reached the model; everything
 *  below was discarded before the model saw it. */
function FloorRule({ floor, rejectedCount }: { floor: number; rejectedCount: number }) {
  return (
    <div className="relative select-none px-3 py-2.5">
      <div className="threshold" />
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <span className="micro text-hot">Grounding floor</span>
        <span className="tnum text-hot font-mono text-[10px]">{floor.toFixed(3)}</span>
      </div>
      <p className="text-faint mt-0.5 text-[10px] leading-relaxed">
        {rejectedCount === 0
          ? "Nothing scored below it on this query."
          : `${rejectedCount} passage${rejectedCount === 1 ? "" : "s"} discarded before the model saw them.`}
      </p>
    </div>
  );
}

function Passage({
  passageKey,
  hit,
  open,
  highlighted,
  below = false,
  onToggle,
}: {
  passageKey: string;
  hit: KnowledgePayload["hits"][number];
  open: boolean;
  highlighted: boolean;
  below?: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      data-passage={passageKey}
      className={`border-rule border-b transition-colors last:border-b-0 ${
        highlighted ? "bg-cold/5" : ""
      } ${below ? "opacity-55" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="hover:bg-raised/60 flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors"
      >
        <ChevronRight
          className={`text-faint size-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />

        <span
          className={`tnum w-11 shrink-0 font-mono text-[11px] ${below ? "text-hot" : "text-cold"}`}
        >
          {hit.similarity.toFixed(3)}
        </span>

        {/* The score as a measured length, not just a printed number. Read
            across a column of rows it shows the gap between a strong match and
            a marginal one at a glance. */}
        <span className="bg-inset relative hidden h-1 w-16 shrink-0 overflow-hidden sm:block">
          <span
            className={`absolute inset-y-0 left-0 ${below ? "bg-hot/60" : "bg-cold/70"}`}
            style={{ width: `${pct(hit.similarity)}%` }}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-cold block font-mono text-[10px] tracking-wide">
            {hit.sourceRef}
          </span>
          <span className="text-dim mt-0.5 block truncate text-[11px]">{hit.docTitle}</span>
        </span>
      </button>

      {open && (
        <div className="border-rule bg-inset space-y-2 border-t px-3 py-2.5">
          <p className="text-dim text-[11px] leading-relaxed whitespace-pre-wrap">{hit.text}</p>
          <a
            href={hit.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cold hover:text-ink inline-flex items-center gap-1 font-mono text-[10px] transition-colors"
          >
            <ExternalLink className="size-2.5" />
            {new URL(hit.sourceUrl).hostname}
          </a>
        </div>
      )}
    </article>
  );
}
