"use client";

/**
 * The passages the answer was actually built from.
 *
 * Shown in full, with the score and a link to the source. A citation the reader
 * cannot open is a citation they have to take on trust, and taking retrieval on
 * trust is the habit this whole project is arguing against.
 */

import * as React from "react";
import { ChevronRight, ExternalLink, FileText } from "lucide-react";

import type { KnowledgePayload } from "@/lib/types";

export function CitationList({ data }: { data: KnowledgePayload }) {
  return (
    <div className="border-border bg-surface flex h-full flex-col rounded-lg border">
      <header className="border-border border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="text-accent size-4" />
          Retrieved evidence
        </h2>
        <p className="text-fg-subtle mt-0.5 truncate text-[11px]">
          {data.hits.length} passage{data.hits.length === 1 ? "" : "s"} above the grounding floor
          {data.query ? ` for “${data.query}”` : ""}
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {data.hits.length === 0 && (
          <p className="text-fg-subtle text-xs">
            Nothing cleared the similarity floor, so nothing was passed to the model.
          </p>
        )}
        {data.hits.map((hit, index) => (
          <Passage key={`${hit.sourceRef}-${hit.chunkIndex}-${index}`} hit={hit} />
        ))}
      </div>
    </div>
  );
}

function Passage({ hit }: { hit: KnowledgePayload["hits"][number] }) {
  const [open, setOpen] = React.useState(false);

  // Above 0.8 is a strong match; between the floor and 0.8 is "relevant, but
  // weigh it". Colouring the score makes that legible without a legend.
  const tone = hit.similarity >= 0.8 ? "text-ok" : "text-warn";

  return (
    <div className="border-border bg-surface-muted rounded-md border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
