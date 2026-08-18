import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, MousePointerClick } from "lucide-react";

import { Console } from "@/components/site/Console";
import { GithubMark } from "@/components/site/GithubMark";
import { ProfileAgent } from "@/components/site/ProfileAgent";
import { ProjectDiagram } from "@/components/site/ProjectDiagram";
import { Contact, SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { StatusChip } from "@/components/site/StatusChip";
import { PROJECTS, bySlug } from "@/components/site/system-entries";

/**
 * One case study.
 *
 * Static at build time, one page per entry in `system-entries.ts`. Every
 * project is told in the same order — the situation, the architecture, the
 * decisions worth defending, what changed — so reading a second one costs
 * nothing once you have read the first.
 *
 * The featured project drops its live console in below the architecture. The
 * others cannot, and saying so plainly is better than staging a screenshot that
 * implies otherwise.
 */

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = bySlug(slug);
  if (!project) return { title: "Not found" };
  return {
    title: `${project.title} · Tharun Arety`,
    description: project.summary,
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = bySlug(slug);
  if (!project) notFound();

  const position = PROJECTS.findIndex((entry) => entry.slug === slug);
  const next = PROJECTS[(position + 1) % PROJECTS.length];

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="shell pt-12 pb-10 lg:pt-20">
          <Link
            href="/projects"
            className="text-faint hover:text-ink inline-flex items-center gap-2 text-[12px] transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            All projects
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="tnum text-faint font-mono text-[12px]">{project.index}</span>
            <StatusChip status={project.status} />
          </div>

          <h1 className="display text-ink mt-5 max-w-[20ch]">{project.title}</h1>
          <p className="lede mt-6 max-w-[58ch]">{project.summary}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-cold/50 bg-cold/10 text-cold hover:bg-cold/20 inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[13px] font-medium transition-colors"
              >
                {project.liveLabel ?? "Open the live app"}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-rule text-dim hover:text-ink hover:border-rule-strong inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[13px] transition-colors"
              >
                <GithubMark className="size-4" />
                Read the source
              </a>
            )}
          </div>

          {project.liveNote && (
            <p className="text-faint mt-4 max-w-[54ch] text-[12px] leading-relaxed">
              {project.liveNote}
            </p>
          )}

          {/* One concrete instruction beats an invitation to look around. A
              visitor who does this single thing has seen the argument. */}
          {project.tryThis && (
            <div className="border-cold/40 bg-cold/5 mt-6 max-w-[62ch] border-l-2 py-3 pl-4">
              <p className="text-cold flex items-center gap-2 text-[12px] font-medium">
                <MousePointerClick className="size-3.5 shrink-0" aria-hidden="true" />
                Try this first
              </p>
              <p className="text-dim mt-2 text-[13px] leading-relaxed">{project.tryThis}</p>
            </div>
          )}

          <dl className="border-rule text-faint mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t pt-6 font-mono text-[11px]">
            <Meta label="domain" value={project.domain} />
            <Meta label="stack" value={project.stack.join(", ")} />
          </dl>
        </section>

        <section className="bg-veil">
          <div className="shell py-14 lg:py-20">
            <h2 className="legend">The situation</h2>
            <div className="mt-6 max-w-[68ch] space-y-4">
              {project.caseStudy.context.map((paragraph) => (
                <p key={paragraph} className="text-dim text-[15px] leading-[1.75]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-14 lg:py-20">
          <h2 className="legend">How it is put together</h2>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
            <div className="min-w-0 space-y-4">
              {project.caseStudy.architecture.map((paragraph) => (
                <p key={paragraph} className="text-dim text-[14.5px] leading-[1.75]">
                  {paragraph}
                </p>
              ))}
            </div>
            {/* min-w-0: a grid item defaults to min-width:auto, so without it the
                track sizes to the diagram's 520px minimum and the whole page
                scrolls sideways on a phone instead of just the diagram. */}
            <div className="min-w-0">
              <ProjectDiagram slug={project.slug} />
              <p className="text-faint mt-3 text-[11.5px] leading-relaxed">
                Drawn, not screenshotted. The production interfaces belong to the companies running
                them, and a form does not show where the agent sits or what stops it.
              </p>
            </div>
          </div>

          {project.featured && (
            <div className="mt-14">
              <h2 className="legend">Running, right here</h2>
              <p className="text-dim mt-4 max-w-[58ch] text-[14px] leading-[1.7]">
                Not a recording. Ask it something, then try one of the two probes that are meant to
                fail.
              </p>
              <div className="mt-8">
                <Console />
              </div>
            </div>
          )}
        </section>

        <section className="bg-veil">
          <div className="shell py-14 lg:py-20">
            <h2 className="legend">Decisions worth defending</h2>
            <div className="mt-8 grid gap-10 md:grid-cols-2 lg:gap-14">
              {project.caseStudy.sections.map((section) => (
                <article key={section.title}>
                  <h3 className="text-ink text-[16px] leading-snug font-medium">{section.title}</h3>
                  <div className="mt-3 space-y-3">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-dim text-[14px] leading-[1.7]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-14 lg:py-20">
          <h2 className="legend">What changed</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {project.caseStudy.results.map((result) => (
              <div key={result.label} className="border-rule border-t pt-5">
                <p className="tnum text-ink font-mono text-[26px] leading-none">{result.value}</p>
                <p className="micro mt-3">{result.label}</p>
                <p className="text-dim mt-2 text-[13px] leading-relaxed">{result.note}</p>
              </div>
            ))}
          </div>

          <p className="text-dim mt-10 max-w-[62ch] text-[14.5px] leading-[1.75]">
            {project.outcome}
          </p>
        </section>

        <section className="shell pb-16 lg:pb-24">
          <Link
            href={`/projects/${next.slug}`}
            className="frame hover:border-rule-strong group flex flex-wrap items-center gap-x-6 gap-y-3 p-6 transition-colors"
          >
            <span className="micro">next</span>
            <span className="text-ink min-w-0 flex-1 text-[16px] leading-snug font-medium">
              {next.title}
            </span>
            <ArrowRight
              className="text-cold size-4 shrink-0 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </section>

        <Contact />
      </main>
      <SiteFooter />
      <ProfileAgent />
    </>
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
