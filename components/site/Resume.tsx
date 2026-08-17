/**
 * Background, on the page rather than only in a file.
 *
 * Someone who has just read the prototype should not have to open a PDF to find
 * out who built it, so the substance is here and the download is for anyone who
 * wants it in one file.
 *
 * The phone number in the PDF is deliberately not rendered. This page is
 * unauthenticated and indexable, and an email is enough to start a
 * conversation.
 */

import { Download } from "lucide-react";

import { EMAIL } from "@/components/site/site-data";

const RESUME_PATH = "/tharun-arety-cv.pdf";

const PROFILE =
  "AI systems builder with an engineering background. I build agentic ERP, CRM and PDM systems, RAG pipelines and MCP integrations that turn fragmented business data into something a team can query. I own the full stack myself: Python and TypeScript services, Postgres and pgvector infrastructure, and the eval suites and guardrail pipelines that keep agents safe to run.";

type Entry = {
  period: string;
  role: string;
  organisation: string;
  place: string;
  lines: string[];
};

const EXPERIENCE: Entry[] = [
  {
    period: "2025 – 2026",
    role: "AI Systems Architect / AI Engineer",
    organisation: "Vexos",
    place: "Remote",
    lines: [
      "Replaced ERP, CRM and PDM software by architecting a custom end-to-end agentic toolchain, removing the SaaS dependencies it stood in for.",
      "Cut compliance processing from 60 minutes to under 2 minutes per batch, a 96% reduction, with a vision-based pipeline and automated schema validation.",
      "Opened siloed business data to natural-language querying by deploying RAG pipelines, MCP servers and tool-calling agents.",
    ],
  },
  {
    period: "2023 – 2026",
    role: "Research Associate, Data-driven Product Engineering and Design",
    organisation: "MRM, University of Augsburg",
    place: "Augsburg, Germany",
    lines: [
      "Scaled computational engineering throughput by automating the simulation lifecycle across large design spaces.",
      "Accelerated design space evaluation with PyTorch and JAX surrogate models and differentiable optimisation frameworks.",
      "Integrated LLMs and coding agents into daily research workflows to shorten software and automation cycles.",
    ],
  },
];

const EDUCATION = [
  {
    period: "2022 – 2026",
    award: "M.Sc. Materials Engineering",
    place: "University of Augsburg, Germany",
  },
  {
    period: "2016 – 2020",
    award: "B.Tech. Mechanical Engineering",
    place: "NIT Agartala, India",
  },
];

const OTHER_PROJECTS = [
  {
    name: "Agentic PDM, ECM and QMS toolchain",
    stack: "FastAPI · LangGraph · PostgreSQL and pgvector · SQLAlchemy 2 async",
    line: "Unified quality data behind one interface, so changes can be proposed by an agent and approved by a person.",
  },
  {
    name: "Autonomous compliance system",
    stack: "Vision extraction · scheduled monitoring",
    line: "Replaced manual compliance tracking with certificate extraction, expiry monitoring and supplier outreach that runs itself.",
  },
  {
    name: "TalentFlow",
    stack: "Next.js · PostgreSQL · Drizzle",
    line: "An applicant tracking system covering the whole pipeline from requisition to hire.",
  },
];

export function Resume() {
  return (
    <section id="resume">
      <div className="shell py-16 lg:py-24">
        <span className="eyebrow">Background</span>
        <h2 className="display-sm text-ink mt-5 max-w-[24ch]">Where this comes from</h2>
        <p className="lede mt-4">{PROFILE}</p>

        <div className="mt-10">
          <a
            href={RESUME_PATH}
            download
            className="border-rule text-dim hover:text-ink hover:border-rule-strong inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[13px] transition-colors"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Download the CV
          </a>
        </div>

        <h3 className="legend mt-14">Experience</h3>
        <div className="mt-6 space-y-8">
          {EXPERIENCE.map((entry) => (
            <article
              key={entry.role}
              className="border-rule grid gap-2 border-t pt-6 lg:grid-cols-[11rem_1fr] lg:gap-8"
            >
              <p className="tnum text-faint font-mono text-[11px]">{entry.period}</p>
              <div>
                <h4 className="text-ink text-[15px] leading-snug font-medium">{entry.role}</h4>
                <p className="text-dim mt-0.5 text-[13px]">
                  {entry.organisation} · {entry.place}
                </p>
                <ul className="mt-3 space-y-2">
                  {entry.lines.map((line) => (
                    <li key={line} className="text-dim text-[13.5px] leading-[1.7]">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <h3 className="legend mt-14">Other work</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {OTHER_PROJECTS.map((project) => (
            <article key={project.name} className="frame p-5">
              <h4 className="text-ink text-[14px] leading-snug font-medium">{project.name}</h4>
              <p className="text-faint mt-2 font-mono text-[10px] leading-relaxed">
                {project.stack}
              </p>
              <p className="text-dim mt-3 text-[13px] leading-relaxed">{project.line}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="legend">Education</h3>
            <dl className="mt-5 space-y-4">
              {EDUCATION.map((item) => (
                <div key={item.award} className="border-rule border-t pt-4">
                  <dt className="text-ink text-[14px] font-medium">{item.award}</dt>
                  <dd className="text-dim mt-1 text-[13px]">{item.place}</dd>
                  <dd className="tnum text-faint mt-0.5 font-mono text-[11px]">{item.period}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="legend">Also worth knowing</h3>
            <dl className="mt-5 space-y-4">
              <div className="border-rule border-t pt-4">
                <dt className="micro">languages</dt>
                <dd className="text-dim mt-1 text-[13px]">
                  English (C1). German (B1, working towards C1).
                </dd>
              </div>
              <div className="border-rule border-t pt-4">
                <dt className="micro">work status</dt>
                <dd className="text-dim mt-1 text-[13px]">
                  Indian national, authorised to work in Germany. No sponsorship required, and
                  available immediately.
                </dd>
              </div>
              <div className="border-rule border-t pt-4">
                <dt className="micro">scholarship</dt>
                <dd className="text-dim mt-1 text-[13px]">
                  Albert Leimer Stiftung and DAAD, for academic performance during the M.Sc.
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <p className="text-faint mt-12 text-[12px] leading-relaxed">
          Anything else is best asked directly:{" "}
          <a
            href={`mailto:${EMAIL}`}
            className="text-cold underline decoration-dotted underline-offset-4"
          >
            {EMAIL}
          </a>
        </p>
      </div>
    </section>
  );
}
