/**
 * One project in the grid.
 *
 * Compact on purpose: the grid is an index, and the case study is where the
 * detail lives. Every card exposes the same three affordances in the same
 * place — read the case study, open the live app, read the source — and shows
 * only the ones that exist.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { GithubMark } from "@/components/site/GithubMark";
import { StatusChip } from "@/components/site/StatusChip";
import type { Project } from "@/components/site/system-entries";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="frame flex flex-col p-6">
      <div className="flex items-baseline gap-3">
        <span className="tnum text-faint font-mono text-[12px]">{project.index}</span>
        <StatusChip status={project.status} className="ml-auto" />
      </div>

      <h3 className="text-ink mt-3 text-[17px] leading-snug font-medium">{project.title}</h3>
      <p className="text-dim mt-2.5 text-[13.5px] leading-[1.65]">{project.summary}</p>

      <p className="text-faint mt-4 font-mono text-[10px] leading-relaxed">
        {project.stack.join(" · ")}
      </p>

      {/* mt-auto keeps the action row on the bottom edge, so a row of cards
          with different amounts of text still lines its links up. */}
      <div className="border-rule mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4">
        <Link
          href={`/projects/${project.slug}`}
          className="text-cold hover:text-ink inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-colors"
        >
          Case study
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>

        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dim hover:text-ink inline-flex items-center gap-1.5 text-[12.5px] transition-colors"
          >
            Live app
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        )}

        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dim hover:text-ink inline-flex items-center gap-1.5 text-[12.5px] transition-colors"
          >
            <GithubMark className="size-3.5" />
            Source
          </a>
        )}
      </div>
    </article>
  );
}
