/**
 * The systems section on the main page.
 *
 * All four are visible without a click, because a visitor should not have to
 * navigate to find out what has been built. The featured one keeps its live
 * console above the grid, since a working thing beats a description of one and
 * it is the only project that can offer that.
 */

import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";

import { Console } from "@/components/site/Console";
import { GithubMark } from "@/components/site/GithubMark";
import { ProjectCard } from "@/components/site/ProjectCard";
import { StatusChip } from "@/components/site/StatusChip";
import { FEATURED, PROJECTS } from "@/components/site/system-entries";

export function Systems() {
  const entry = FEATURED;
  const live = PROJECTS.filter((project) => project.status === "live").length;

  return (
    <section id="systems">
      <div className="shell pt-16 lg:pt-24">
        <span className="eyebrow">Systems</span>
        <h2 className="display-sm text-ink mt-5 max-w-[28ch]">
          Four systems, and one of them is running on this page
        </h2>
        <p className="lede mt-4">
          {live} are in production inside client systems, so those are described rather than handed
          over. The one I can hand you outright is a prototype, built to the same standard and open
          to being taken apart.
        </p>
      </div>

      {/* The featured project, with the thing you can actually operate. */}
      <div className="shell pt-12 lg:pt-16">
        <div className="border-rule flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t pt-8">
          <span className="tnum text-faint font-mono text-[12px]">{entry.index}</span>
          <h3 className="text-ink min-w-0 flex-1 text-[19px] leading-snug font-medium">
            {entry.title}
          </h3>
          <StatusChip status={entry.status} />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="lede">{entry.problem}</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              <Link
                href={`/projects/${entry.slug}`}
                className="text-cold hover:text-ink inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
              >
                Read the case study
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              {entry.repoUrl && (
                <a
                  href={entry.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dim hover:text-ink inline-flex items-center gap-1.5 text-[13px] transition-colors"
                >
                  <GithubMark className="size-3.5" />
                  Source
                </a>
              )}
            </div>
          </div>

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
      </div>

      {/* Everything, including the one above, so the set reads as a set. */}
      <div className="shell pt-16 lg:pt-24">
        <h3 className="legend">All four</h3>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
