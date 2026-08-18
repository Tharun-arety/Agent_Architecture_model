/**
 * The three claims, in the reader's vocabulary rather than in agent jargon.
 *
 * A twenty-person manufacturer is deciding here whether any of this is about
 * them, so each block names a situation they recognise and then the mechanism
 * that answers it. The mechanism is what a technical reader checks; the
 * situation is what everyone else reads.
 */

import { Network, ShieldCheck, Workflow } from "lucide-react";

const BLOCKS = [
  {
    icon: Workflow,
    title: "Manual work that an agent can take over",
    body: "Compliance checks, document processing, change requests, quote preparation. The jobs that cost a person hours a week and follow rules they could describe to you. I build agents that do the work and leave a record of what they did, with a person approving anything that touches a released record.",
  },
  {
    icon: Network,
    title: "One knowledge layer across systems that do not talk",
    body: "ERP, CRM, PDM, ECM and QMS each hold part of the answer, so questions get answered by opening three of them. An agentic toolchain reaches all of them through one interface, using MCP servers and tool calling, so a question can be answered and then acted on rather than just researched.",
  },
  {
    icon: ShieldCheck,
    title: "Agents you can actually put in front of people",
    body: "An agent that is confidently wrong once will not be trusted again. Checks run before the model is called, on the arguments it wants to pass to your systems, and on whether the evidence supports the answer. Then an offline eval suite measures whether a change made it better, which is how improvement gets demonstrated rather than claimed.",
  },
];

export function WhatIDo() {
  return (
    <section id="approach" className="bg-veil">
      <div className="shell py-16 lg:py-24">
        <span className="eyebrow">Approach</span>
        <h2 className="display-sm text-ink mt-5 max-w-[26ch]">
          Where agents earn their place in a business
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
