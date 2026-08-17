/**
 * The featured project on the homepage.
 *
 * One project here on purpose. A visitor deciding whether to make contact needs
 * one thing they can actually try, not four they have to skim. The other three
 * are on `/projects`, linked at the end of this section.
 */

import { ArrowRight, FlaskConical } from "lucide-react";

import { Console } from "@/components/site/Console";
import { GithubMark } from "@/components/site/GithubMark";
import { FEATURED, PROJECTS } from "@/components/site/system-entries";

export function Systems() {
  const entry = FEATURED;
  const others = PROJECTS.length - 1;

  return (
    <section id="systems">
      <div className="shell pt-16 lg:pt-24">
        <span className="eyebrow">Systems</span>
        <h2 className="display-sm text-ink mt-5 max-w-[26ch]">
          One of them is running on this page
        </h2>
        <p className="lede mt-4">
          This one I built to be taken apart, so it is live rather than a screenshot. Try to break
          it while you read.
        </p>
      </div>

      <div className="shell pt-12 lg:pt-16">
        <div className="border-rule flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t pt-8">
          <span className="tnum text-faint font-mono text-[12px]">{entry.index}</span>
          <h3 className="text-ink min-w-0 flex-1 text-[19px] leading-snug font-medium">
            {entry.title}
          </h3>
          {entry.repoUrl && (
            <a
              href={entry.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dim hover:text-ink inline-flex items-center gap-1.5 text-[12px] transition-colors"
            >
              <GithubMark className="size-3.5" />
              Source
            </a>
          )}
        </div>

        <dl className="text-faint mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px]">
          <Meta label="domain" value={entry.domain} />
          <Meta label="status" value={entry.status} />
          <Meta label="stack" value={entry.stack.join(", ")} />
        </dl>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <p className="lede">{entry.problem}</p>
          <div className="border-warm/40 bg-warm/5 border-l-2 py-3 pl-4">
            <p className="text-warm flex items-center gap-2 text-[12px] font-medium">
              <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
              What is real here and what is not
            </p>
            <p className="text-dim mt-2 text-[13px] leading-relaxed">
              The document corpus is real public web pages, fetched at seed time and cited with
              links back to the original. The rig telemetry is generated for this demonstration. It
              is not any company&rsquo;s production data and it is labelled as synthetic everywhere
              it appears.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <Console />
        </div>

        <p className="text-faint mt-4 text-[12px] leading-relaxed">
          Two of the four suggested questions are supposed to fail. They are the quickest way to see
          what the guardrails do.
        </p>

        <a
          href="/projects"
          className="border-rule text-dim hover:text-ink hover:border-rule-strong mt-10 inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[13px] transition-colors"
        >
          See the other {others} projects
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="micro">{label}</dt>
      <dd className="text-dim">{value}</dd>
    </div>
  );
}
