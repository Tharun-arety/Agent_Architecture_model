/**
 * One project, in the same order for all of them.
 *
 * Problem, then what was built, then what changed. The prototype on the
 * homepage follows the same order and then adds a live console, so reading a
 * second project costs nothing once you have read the first.
 */

import { ArrowUpRight } from "lucide-react";

import { GithubMark } from "@/components/site/GithubMark";
import type { Project } from "@/components/site/system-entries";

const STATUS_LABEL: Record<Project["status"], string> = {
  prototype: "Prototype",
  live: "Live",
  "in-progress": "In progress",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="border-rule border-t pt-8">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="tnum text-faint font-mono text-[12px]">{project.index}</span>
        <h3 className="text-ink min-w-0 flex-1 text-[19px] leading-snug font-medium">
          {project.title}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase ${
            project.status === "live"
              ? "border-cold/50 text-cold"
              : "border-rule text-faint"
          }`}
        >
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      <p className="lede mt-4 max-w-[62ch]">{project.summary}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-12">
        <div>
          <h4 className="legend">The problem</h4>
          <p className="text-dim mt-3 text-[13.5px] leading-[1.7]">{project.problem}</p>
        </div>

        <div>
          <h4 className="legend">What I built</h4>
          <ul className="mt-3 space-y-2.5">
            {project.built.map((item) => (
              <li key={item} className="text-dim text-[13.5px] leading-[1.7]">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="legend">What changed</h4>
          <p className="text-dim mt-3 text-[13.5px] leading-[1.7]">{project.outcome}</p>

          <dl className="mt-5">
            <dt className="micro">stack</dt>
            <dd className="text-faint mt-1.5 font-mono text-[11px] leading-relaxed">
              {project.stack.join(" · ")}
            </dd>
          </dl>

          {(project.liveUrl || project.repoUrl) && (
            <div className="mt-5 flex flex-wrap gap-4">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cold hover:text-ink inline-flex items-center gap-1.5 text-[12px] transition-colors"
                >
                  Visit
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dim hover:text-ink inline-flex items-center gap-1.5 text-[12px] transition-colors"
                >
                  <GithubMark className="size-3.5" />
                  Source
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
