"use client";

/**
 * The corpus inventory — what the Knowledge agent can answer from, before
 * anyone has asked it anything.
 *
 * Shown until a retrieval happens, at which point the citation list replaces it
 * with the passages that particular answer used. Both panes are making the same
 * argument from different ends: this system's scope is a finite, inspectable
 * set of documents, and here it is.
 *
 * The unreachable source is listed too. A corpus page that quietly omits the
 * one URL that 403s is telling a tidier story than the ingest actually had.
 */

import { ExternalLink, FileText, Library, TriangleAlert } from "lucide-react";

import type { CorpusDocument } from "@/lib/db/queries";

const TYPE_LABELS: Record<string, string> = {
  vendor_technical: "vendor technical",
  product_page: "product",
  project_page: "EU project",
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
    <div className="border-border bg-surface flex h-full flex-col rounded-lg border">
      <header className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Library className="text-accent size-4" />
            Knowledge corpus
          </h2>
          <p className="text-fg-subtle mt-0.5 text-[11px]">
            {documents.length} public documents · {total} chunks indexed · fetched at
            seed time, not committed to the repository
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {documents.map((doc) => (
          <div
            key={doc.sourceRef}
            className="border-border bg-surface-muted rounded-md border px-2.5 py-2"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-accent shrink-0 font-mono text-[10px]">{doc.sourceRef}</span>
              <span className="text-fg-subtle shrink-0 text-[10px]">
                {TYPE_LABELS[doc.docType] ?? doc.docType}
              </span>
              <span className="tnum text-fg-subtle ml-auto shrink-0 text-[10px]">
                {doc.chunks} chunks
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <a
                href={doc.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg-muted hover:text-accent group inline-flex min-w-0 items-center gap-1 text-[11px] transition"
              >
                <span className="truncate">{doc.docTitle}</span>
                <ExternalLink className="size-2.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
              </a>
            </div>

            {/* Share of the index. WIKI-MCE holding a third of it is the reason
                retrieval caps at two passages per source — visible here rather
                than only in the README. */}
            <div className="bg-bg mt-1.5 h-0.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-accent/50 h-full rounded-full"
                style={{ width: `${Math.max(2, Math.round((doc.chunks / widest) * 100))}%` }}
              />
            </div>
          </div>
        ))}

        {unreachable?.map((source) => (
          <div
            key={source.sourceRef}
            className="border-warn/30 bg-warn/5 flex items-start gap-2 rounded-md border px-2.5 py-2"
          >
            <TriangleAlert className="text-warn mt-0.5 size-3 shrink-0" />
            <div className="min-w-0">
              <span className="text-warn font-mono text-[10px]">{source.sourceRef}</span>
              <p className="text-fg-subtle mt-0.5 text-[10px] leading-relaxed">
                In the source manifest, but unreachable at ingest
                {source.detail ? ` — ${source.detail}` : ""}. Recorded and skipped rather
                than failing the run.
              </p>
            </div>
          </div>
        ))}
      </div>

      <footer className="border-border text-fg-subtle border-t px-3 py-2 text-[10px] leading-relaxed">
        <FileText className="mr-1 inline size-3 align-[-2px]" />
        Ask a question and this pane is replaced by the passages that answer used,
        with their similarity scores.
      </footer>
    </div>
  );
}
