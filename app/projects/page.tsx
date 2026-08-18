import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProjectCard } from "@/components/site/ProjectCard";
import { ProfileAgent } from "@/components/site/ProfileAgent";
import { Contact, SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { PROJECTS } from "@/components/site/system-entries";

export const metadata: Metadata = {
  title: "Projects · Tharun Arety",
  description:
    "Agentic systems built end to end: a guardrailed RAG prototype, a PDM, ECM and QMS toolchain, an autonomous compliance system and an applicant tracking system.",
};

/**
 * Everything, in one place.
 *
 * The homepage carries one project, because a visitor deciding whether to make
 * contact needs one thing they can try rather than four they have to skim. The
 * rest live here, in the same problem, built, changed order.
 */
export default function ProjectsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="shell pt-16 pb-12 lg:pt-24">
          <span className="eyebrow">Projects</span>
          <h1 className="display text-ink mt-6 max-w-[18ch]">Things I have built</h1>
          <p className="lede mt-6">
            Four systems, three of them running in production and one built to be taken apart. Each
            one is described the same way: what the problem was, what I built, and what changed.
          </p>
          <Link
            href="/#systems"
            className="text-dim hover:text-ink mt-8 inline-flex items-center gap-2 text-[13px] transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to the live prototype
          </Link>
        </section>

        <section className="shell space-y-14 pb-20 lg:pb-28">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </section>

        <Contact />
      </main>
      <SiteFooter />
      <ProfileAgent />
    </>
  );
}
