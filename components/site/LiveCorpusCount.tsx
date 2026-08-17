"use client";

/**
 * Corpus size, read from the running system.
 *
 * The chunk count lives in the database rather than in the repository, so
 * writing it into the markup would mean writing down a number that goes stale
 * the next time anything is ingested. It renders a dash until `/api/health`
 * answers.
 */

import * as React from "react";

import { Figure } from "@/components/site/Hero";

type Health = { corpus?: { chunks: number; documents: number } };

export function LiveCorpusCount({ manifestSources }: { manifestSources: number }) {
  const [corpus, setCorpus] = React.useState<Health["corpus"] | null>(null);

  React.useEffect(() => {
    let live = true;
    fetch("/api/health")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: Health) => live && setCorpus(data.corpus ?? null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <Figure
      value={corpus ? String(corpus.chunks) : "—"}
      label="passages indexed"
      detail={
        corpus
          ? `${corpus.documents} of ${manifestSources} sources ingested`
          : `from ${manifestSources} public sources`
      }
    />
  );
}
