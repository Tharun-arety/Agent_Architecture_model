/**
 * The three claims, in the reader's vocabulary rather than in agent jargon.
 *
 * A twenty-person manufacturer is deciding here whether any of this is about
 * them, so each block names a problem they recognise and then the mechanism
 * that answers it. The mechanism is what a technical reader checks; the problem
 * is what everyone else reads.
 */

import { FileSearch, Gauge, ShieldCheck } from "lucide-react";

const BLOCKS = [
  {
    icon: FileSearch,
    title: "Documents and data an agent can answer from",
    body: "Most of what a company knows is spread across vendor PDFs, an internal wiki, a shared drive and a database nobody queries directly. I build the retrieval layer that makes those answerable together, and keep every answer traceable to the passage it came from.",
  },
  {
    icon: ShieldCheck,
    title: "Agents that are stopped from inventing things",
    body: "An agent that is confidently wrong once will not be trusted again. Checks run before the model is called, on the arguments it wants to pass to your systems, and on whether the evidence actually supports the answer. Each verdict is recorded whether it passes or fails.",
  },
  {
    icon: Gauge,
    title: "A measured before and after",
    body: "Improvement gets demonstrated rather than claimed. I build a test set from real questions with known answers, run it offline, and fix what it catches. The scores from the prototype below are on this page, including the three that sit under target.",
  },
];

export function WhatIDo() {
  return (
    <section id="approach" className="bg-veil">
      <div className="shell py-16 lg:py-24">
        <span className="eyebrow">Approach</span>
        <h2 className="display-sm text-ink mt-5 max-w-[24ch]">
          What I actually do, in three parts
        </h2>

        <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-12">
          {BLOCKS.map((block) => (
            <div key={block.title}>
              <block.icon className="text-cold size-6" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="text-ink mt-4 text-[16px] leading-snug font-medium">{block.title}</h3>
              <p className="text-dim mt-3 text-[14px] leading-[1.7]">{block.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
