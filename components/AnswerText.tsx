"use client";

/**
 * Renders an answer with its `[SOURCE-REF]` citations as live links into the
 * evidence pane.
 *
 * A citation you cannot follow asks the reader to take the grounding on trust,
 * which is the one thing this project is built to avoid. Clicking one scrolls
 * the retrieved-evidence list to that passage and opens it, so "the answer says
 * X because MT-TECH says X" is one click to verify rather than a claim.
 *
 * A reference the retrieval did not return is rendered in the danger colour
 * instead of being made a link. That is the `grounding.citations` guardrail's
 * verdict made visible at the point it matters — inline, in the sentence making
 * the claim, rather than only in the inspector.
 */

import * as React from "react";

const CITATION = /\[([A-Z]{2,}[A-Z0-9]*(?:-[A-Z0-9]{2,}){1,3})\]/g;

export function AnswerText({
  text,
  knownRefs,
  onCite,
}: {
  text: string;
  /** Source handles the retrieval actually returned for this turn. */
  knownRefs?: Set<string>;
  onCite?: (sourceRef: string) => void;
}) {
  // No retrieval on this turn (telemetry, refusal, general) means there is
  // nothing to link to, and bracketed text is just text.
  if (!knownRefs || knownRefs.size === 0) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of text.matchAll(CITATION)) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push(text.slice(cursor, start));

    const ref = match[1];
    const known = knownRefs.has(ref.toUpperCase());

    parts.push(
      known ? (
        <button
          key={`cite-${key++}`}
          type="button"
          onClick={() => onCite?.(ref.toUpperCase())}
          title={`Show the ${ref} passage this came from`}
          className="text-accent hover:bg-accent/15 border-accent/30 mx-0.5 rounded border px-1 py-px font-mono text-[10px] align-baseline transition"
        >
          {ref}
        </button>
      ) : (
        <span
          key={`cite-${key++}`}
          title="This source was not among the passages retrieved for this answer."
          className="text-danger border-danger/40 bg-danger/10 mx-0.5 rounded border px-1 py-px font-mono text-[10px] align-baseline"
        >
          {ref} ?
        </span>
      ),
    );
    cursor = start + match[0].length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));

  return <span className="whitespace-pre-wrap">{parts}</span>;
}
