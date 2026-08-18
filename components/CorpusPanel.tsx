"use client";

/**
 * The corpus inventory — what the Knowledge agent can answer from, before
 * anyone has asked it anything.
 *
 * Shown until a retrieval happens, at which point the evidence pane replaces it
 * with the passages that particular answer used. Both are making the same
 * argument from different ends: this system's scope is a finite, inspectable
 * set of documents, and here it is.
 *
 * Share-of-index is drawn per row because it explains a design decision made
 * elsewhere: one document holding a third of the corpus is why retrieval caps
 * at two passages per source.
 */

import { ExternalLink, TriangleAlert } from "lucide-react";

import type { CorpusDocument } from "@/lib/db/queries";

const TYPE_LABELS: Record<string, string> = {
  vendor_technical: "vendor",
  product_page: "product",
  project_page: "project",
  press: "press",
  industry_analysis: "industry",
  reference: "reference",
  standard_summary: "standard",
};

export function CorpusPanel({
  documents,
  unreachable,
}: {
  documents: CorpusDocument[];
  unreachable?: { sourceRef: string; detail?: string }[];
}) {
  const total = documents.reduce((sum, doc) => sum + doc.chunks, 0);
  const widest = Math.max(...documents.map((d) => d.chunks), 1);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-2">
        <h2 className="legend shrink-0 after:hidden">Knowledge corpus</h2>
        <p className="text-faint min-w-0 flex-1 truncate text-[11px]">
          fetched at seed time, not committed to the repository
        </p>
        <span className="tnum text-faint shrink-0 font-mono text-[10px]">
          {documents.length} docs · {total} chunks
        </span>
      </header>

      <div className="border-rule bg-panel min-h-0 flex-1 overflow-y-auto border">
        {documents.map((doc) => (
          <a
            key={doc.sourceRef}
            href={doc.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-rule hover:bg-raised/60 group flex items-center gap-2.5 border-b px-3 py-2 transition-colors last:border-b-0"
          >
            <span className="text-cold w-[104px] shrink-0 font-mono text-[10px] tracking-wide">
              {doc.sourceRef}
            </span>

            {/* Share of the index, as a measured length. */}
            <span className="bg-inset relative hidden h-1 w-16 shrink-0 overflow-hidden sm:block">
              <span
                className="bg-cold/45 absolute inset-y-0 left-0"
                style={{ width: `${Math.max(3, Math.round((doc.chunks / widest) * 100))}%` }}
              />
            </span>

            <span className="tnum text-faint w-8 shrink-0 text-right font-mono text-[10px]">
              {doc.chunks}
            </span>

            <span className="text-dim group-hover:text-ink min-w-0 flex-1 truncate text-[11px] transition-colors">
              {doc.docTitle}
            </span>

            <span className="micro hidden shrink-0 md:inline">
              {TYPE_LABELS[doc.docType] ?? doc.docType}
            </span>
            <ExternalLink className="text-faint size-2.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}

        {unreachable?.map((source) => (
          <div
            key={source.sourceRef}
            className="border-rule flex items-start gap-2.5 border-b px-3 py-2 opacity-60 last:border-b-0"
          >
            <span className="text-warm w-[104px] shrink-0 font-mono text-[10px] tracking-wide">
              {source.sourceRef}
            </span>
            <TriangleAlert className="text-warm mt-0.5 size-3 shrink-0" />
            <p className="text-faint min-w-0 flex-1 text-[10px] leading-relaxed">
              In the manifest, unreachable at ingest
              {source.detail ? ` — ${source.detail}` : ""}. Recorded and skipped rather than
              failing the run.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
