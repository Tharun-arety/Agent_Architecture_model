import type { Metadata } from "next";

import { ProfileAgent } from "@/components/site/ProfileAgent";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Contact, SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { PROJECTS } from "@/components/site/system-entries";

export const metadata: Metadata = {
  title: "Projects · Tharun Arety",
  description:
    "Agentic systems built end to end: a PDM, ECM and QMS toolchain, a guardrailed RAG prototype, an autonomous compliance system and an applicant tracking system.",
};

/** The index. Each card is a way in to a case study; the depth lives there. */
export default function ProjectsPage() {
  const live = PROJECTS.filter((project) => project.status === "live").length;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="shell pt-16 pb-12 lg:pt-24">
          <span className="eyebrow">Projects</span>
          <h1 className="display text-ink mt-6 max-w-[18ch]">Things I have built</h1>
          <p className="lede mt-6">
            {PROJECTS.length} systems, {live} of them running in production and one built to be
            taken apart. Each case study is told the same way: the situation, how it is put
            together, the decisions worth defending, and what changed.
          </p>
        </section>

        <section className="shell grid gap-5 pb-20 md:grid-cols-2 lg:pb-28">
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
