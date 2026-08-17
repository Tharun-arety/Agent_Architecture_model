/**
 * The systems section, and the prototype inside it.
 *
 * There is one entry today, and the page says so rather than implying a
 * portfolio. `SYSTEMS` is an array so a second becomes a data change.
 */

import { FlaskConical } from "lucide-react";

import { GithubMark } from "@/components/site/GithubMark";

import { Console } from "@/components/site/Console";
import { SYSTEMS } from "@/components/site/system-entries";

export function Systems() {
  const [lead, ...rest] = SYSTEMS;

  return (
    <section id="systems">
      <div className="shell pt-16 lg:pt-24">
        <span className="eyebrow">Systems</span>
        <h2 className="display-sm text-ink mt-5 max-w-[26ch]">
          One published so far. It is running on this page.
        </h2>
        <p className="lede mt-4">
          Not client work. I built it to have something concrete to point at, and it is live rather
          than a screenshot, so you can try to break it while you read.
        </p>
      </div>

      {lead && <CaseStudy />}

      {rest.length > 0 && (
        <div className="shell grid gap-4 pb-16 md:grid-cols-2">
          {rest.map((entry) => (
            <article key={entry.slug} className="frame p-5">
              <span className="micro">{entry.index}</span>
              <h3 className="text-ink mt-2 text-[15px] leading-snug font-medium">{entry.title}</h3>
              <p className="text-dim mt-2 text-[13px] leading-relaxed">{entry.summary}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CaseStudy() {
  const entry = SYSTEMS[0];

  return (
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
        <p className="lede">
          The documentation a company like this runs on sits in vendor pages, PDFs and a wiki. The
          operating data sits in a database. A useful agent answers from both, and the hard part is
          stopping it from filling in the parts it does not know.
        </p>
        <div className="border-warm/30 bg-warm/5 border-l-2 py-3 pl-4">
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

      <div className="mt-10 pb-4">
        <Console />
      </div>

      <p className="text-faint mt-4 pb-12 text-[12px] leading-relaxed">
        Two of the four suggested questions are supposed to fail. They are the quickest way to see
        what the guardrails do.
      </p>
    </div>
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
