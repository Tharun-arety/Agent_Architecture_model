/**
 * The projects, and the case studies behind them.
 *
 * `featured` decides which one gets the live console on the main page.
 * `index` decides the order everywhere. Adding a project is an entry here plus
 * a diagram in `ProjectDiagram.tsx`, and nothing else.
 *
 * `liveUrl` and `repoUrl` render as links only when set, so an entry never
 * advertises a destination that does not exist.
 *
 * Everything in `caseStudy` has to be traceable to work that was actually done.
 * If a number is not one I can point at, it does not go in.
 */

import { PDM_CASE } from "@/components/site/pdm-case";
import { TALENTFLOW_CASE } from "@/components/site/talentflow-case";

export const REPO_URL = "https://github.com/Tharun-arety/Agent_Architecture_model";

export type ProjectStatus = "prototype" | "live" | "in-progress";

export type CaseSection = {
  /** Short label above the heading, as on the main page. */
  eyebrow: string;
  title: string;
  body: string[];
  /** Key into CASE_VISUALS. A section without one falls back to the
   *  architecture diagram, which is better than an empty frame. */
  visual?: string;
  /** One line under the frame, for what the visual cannot say itself. */
  note?: string;
};

export type CaseStudy = {
  /** The situation in full, longer than the card's `problem`. */
  context: string[];
  /** Prose that reads alongside the architecture diagram. */
  architecture: string[];
  sections: CaseSection[];
  /** Headline figures. Only ones that can be stated plainly. */
  results: { value: string; label: string; note: string }[];
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  /** What it is, in one line, before any detail. */
  summary: string;
  domain: string;
  status: ProjectStatus;
  /** The situation before it existed. */
  problem: string;
  /** What was actually built. */
  built: string[];
  /** What changed as a result. */
  outcome: string;
  stack: string[];
  liveUrl?: string;
  /** Button text. Defaults to "Live app" when the URL is the system itself. */
  liveLabel?: string;
  /** Shown beside the link. Required when the URL is a demonstration rather
   *  than the production system, so the button cannot overstate what it opens. */
  liveNote?: string;
  repoUrl?: string;
  /** One concrete thing to do in the live app. Rendered as a prompt beside the
   *  link, because "have a look around" is not a demonstration. */
  tryThis?: string;
  /** Renders the live console on the main page and in its case study. */
  featured?: boolean;
  caseStudy: CaseStudy;
};

const ENTRIES: Project[] = [
  {
    slug: "agentic-pdm-ecm-qms",
    index: "01",
    title: "An agentic toolchain across eleven enterprise domains",
    summary:
      "PDM, ECM, QMS, procurement, controlling and six more behind one interface, where the agent reads everything and changes nothing without a named approval.",
    domain: "Manufacturing engineering operations",
    status: "live",
    problem:
      "A failed test sample raises five questions at once, and each answer lives in a different system: which lot, which supplier, which units, what it costs to fix, and did anyone close the loop.",
    built: [
      "A LangGraph and FastAPI service putting eleven record domains behind one queryable interface, with pgvector retrieval and async SQLAlchemy over Postgres.",
      "An approval inbox where every agent-proposed change waits with a field-level dry-run diff until someone holding the required role approves it, in one transaction, under their own name.",
      "An offline eval suite running against a stub model client, asserting tool timeouts, domain isolation, injection resistance, the mutation invariant and a pinned token budget.",
    ],
    outcome:
      "A supplier receipt now traces in eight recorded steps to a released, repriced change notice that hybrid search can cite, and no agent applied any of it unsupervised.",
    stack: ["FastAPI", "LangGraph", "PostgreSQL", "pgvector", "SQLAlchemy 2 async", "Next.js"],
    liveUrl: "https://agentic-enterprise-tool.vercel.app/",
    liveLabel: "Open the sandbox",
    liveNote:
      "Signs you straight in on a seeded seat, no account needed. Records are invented and contain no customer data. The production instance is not mine to publish.",
    tryThis:
      "Sign in as Admin, then open the approval inbox. Two agent proposals are waiting there with the exact field-level diff each would apply. Expand the tool call that produced one, and note that approving is the only thing that writes.",
    caseStudy: PDM_CASE,
  },
  {
    slug: "grounded-engineering-agent",
    index: "02",
    title: "A guardrailed agent with every check on show",
    summary:
      "Two agents behind a router, built so the guardrails, the retrieval scores and the cost of every turn are visible while you use it.",
    domain: "Magnetocaloric refrigeration equipment",
    status: "prototype",
    problem:
      "The documentation a company like this runs on sits in vendor pages, PDFs and a wiki. The operating data sits in a database. A useful agent answers from both, and the hard part is stopping it from filling in the parts it does not know.",
    built: [
      "A tool-calling loop written by hand against the OpenAI API, with no agent framework in it, so the argument guardrail sits between the model asking for a call and the call happening.",
      "Three guardrail layers: deterministic input checks before the first model call, ajv plus database bounds on every tool argument, and a calibrated similarity floor around the answer.",
      "An offline eval suite of 144 cases across 12 metrics, including guardrail specificity, which is what makes the trigger rate mean anything.",
    ],
    outcome:
      "The suite scores 95.9% and found three real defects on its first run, each recorded with what it was and what fixed it.",
    stack: ["Next.js", "OpenAI", "Neon", "pgvector", "ajv", "vitest"],
    repoUrl: REPO_URL,
    featured: true,
    caseStudy: {
      context: [
        "This one exists to be taken apart. The production work sits inside client systems, so it can be described but not handed over. This was built to the same standard with everything open: the source, the eval report, and an inspector that shows what every turn actually cost.",
        "The domain is magnetocaloric refrigeration, chosen because it is genuinely messy. The documentation is real public web pages of varying quality. The operating data is synthetic and labelled as such everywhere it appears, because inventing a company's measurements and presenting them as real would undercut the whole argument.",
      ],
      architecture: [
        "A router classifies the question, then one of two agents handles it. The knowledge agent retrieves from the document corpus. The telemetry agent queries a time-series database of rig readings. Both run through the same hand-written tool-calling loop.",
        "No agent framework sits in the middle, and that is the point rather than a preference. The argument guardrail has to run between the model asking for a tool call and that call happening, and owning the loop is what makes that position available.",
        "A rejection at that gate becomes a message the model reads and corrects from, rather than an exception. Ask for a rig that does not exist and you can watch it recover by calling the tool that lists them.",
      ],
      sections: [
        {
          eyebrow: "Validation",
          title: "ajv over the same schema the model gets",
          body: [
            "OpenAI tool parameters are JSON Schema already. Validating with ajv against that same literal means one source of truth serves both the model and the validator.",
            "A Zod mirror would be a second definition that can drift from what the model was told, which is a bug that only shows up in production.",
          ],
        },
        {
          eyebrow: "Calibration",
          title: "The floor was measured, not chosen",
          body: [
            "The first value was 0.70, which sounded prudent and refused almost every question the system could answer, scoring 8% recall. Sweeping the golden set turned a guess into a measurement and put it at 0.35.",
            "Questions the corpus can answer score 0.512 on average at rank one. Questions it cannot score 0.198. The floor sits inside that gap, and the evidence pane draws it so both sides are visible.",
          ],
        },
        {
          eyebrow: "Evals",
          title: "What the first eval run found",
          body: [
            "It scored 85.6% and surfaced three defects that were mine. The floor was guessed. The router sent datasheet questions to the telemetry agent because they contain metric words. And one Wikipedia article held a third of the index, so broad questions returned five passages from it and nothing else.",
            "Two later failures turned out to be the test's fault rather than the system's, which is the more useful thing to find. The judged metrics are the least reliable rows in the report, and the README says so rather than quietly rounding them up.",
          ],
        },
      ],
      results: [
        {
          value: "95.9%",
          label: "Mean eval score",
          note: "Across 12 metrics and 144 cases, up from 85.6% on the first run.",
        },
        {
          value: "0 ms",
          label: "Cost of a refused injection",
          note: "Deterministic checks refuse it before any model call, so it costs nothing.",
        },
        {
          value: "3",
          label: "Guardrail layers",
          note: "Input, tool arguments, and grounding around the answer.",
        },
      ],
    },
  },
  {
    slug: "autonomous-compliance",
    index: "03",
    title: "Autonomous compliance system",
    summary:
      "Certificate extraction, expiry monitoring and supplier chasing, running without anyone maintaining a spreadsheet.",
    domain: "Supplier compliance",
    status: "live",
    problem:
      "Compliance certificates arrived as scanned documents and were tracked by hand, which meant expiry dates were noticed late and suppliers were chased inconsistently.",
    built: [
      "A vision pipeline that reads certificates and extracts the fields that matter, with automated schema validation on everything it produces.",
      "Expiry monitoring that watches the extracted dates and raises what is about to lapse.",
      "Supplier outreach triggered from that monitoring, so the chase happens without someone remembering to start it.",
    ],
    outcome:
      "Processing went from about 60 minutes to under 2 minutes per batch, a 96% reduction, and expiries surface before they lapse rather than after.",
    stack: ["Python", "Vision models", "Schema validation"],
    caseStudy: {
      context: [
        "Supplier compliance is a job that is boring until it is urgent. Certificates arrive as scans, often as photographs of paper. Someone opens each one, reads the issuer, the scope and the expiry, types it into a spreadsheet, and remembers to check that spreadsheet later.",
        "Every part of that fails quietly. The typing introduces errors nobody catches. The remembering is the weakest link, so expiries get noticed after they lapse. And the chasing is inconsistent, because whether a supplier hears from you depends on who was looking that week.",
        "It cost about an hour per batch, and the hour was the least of it. The real cost was a lapsed certificate discovered by an auditor rather than by the process.",
      ],
      architecture: [
        "Three stages, each of which can be checked. A vision model reads the scan and extracts the fields. Every extraction is validated against a schema before it is stored, so a misread date or a missing issuer is caught at the boundary rather than sitting in the record.",
        "Monitoring runs against the stored dates rather than against the documents, which is what makes it cheap enough to run continuously. It raises what is about to lapse on a horizon rather than on the day.",
        "Outreach is triggered by that monitoring. The chase is a consequence of a date crossing a threshold, not of someone remembering.",
      ],
      sections: [
        {
          eyebrow: "The boundary",
          visual: "schemaGate",
          note: "A well-formed wrong answer is the failure mode. Only the schema is positioned to catch it.",
          title: "Schema validation is the load-bearing part",
          body: [
            "A vision model reading a photographed certificate will occasionally produce a confident, well-formed, wrong answer. An expiry date read as 2027 instead of 2021 is not visibly wrong anywhere downstream.",
            "Validating every extraction against a schema at the point it is produced turns that class of failure into a rejection rather than a record. It is the same argument as the tool-argument guardrail in the agent work: the check belongs between the model and the system, not after it.",
          ],
        },
        {
          eyebrow: "Cadence",
          visual: "cadenceSplit",
          note: "Two jobs with different cost shapes, deliberately not run on the same schedule.",
          title: "Why monitoring is separate from reading",
          body: [
            "Reading a document is expensive and happens once. Checking whether a date has passed is nearly free and has to happen constantly.",
            "Splitting them means the continuous part costs almost nothing to run, which is what lets it watch a horizon rather than run as a periodic scramble.",
          ],
        },
      ],
      results: [
        {
          value: "96%",
          label: "Less processing time",
          note: "About 60 minutes per batch became under 2.",
        },
        {
          value: "None",
          label: "Spreadsheets maintained",
          note: "Tracking is a consequence of the extraction rather than a separate job.",
        },
      ],
    },
  },
  {
    slug: "talentflow",
    index: "04",
    title: "TalentFlow",
    summary:
      "An applicant tracking system covering the whole pipeline, from opening a requisition to making the hire.",
    domain: "Recruitment",
    status: "live",
    problem:
      "Recruitment ran across email threads and spreadsheets, so the state of any given candidate depended on who you asked.",
    built: [
      "A custom applicant tracking system covering requisition, pipeline stages, candidate records and offers.",
      "A typed Postgres schema through Drizzle, so the pipeline states are enforced by the database rather than by convention.",
    ],
    outcome: "One place holds the state of every open role and every candidate in it.",
    stack: ["Next.js", "PostgreSQL", "Drizzle", "NextAuth"],
    liveUrl: "https://talentflow-virid-zeta.vercel.app/careers",
    liveLabel: "See the public job board",
    liveNote:
      "The candidate-facing half is open to anyone. The hiring pipeline behind it is invite-only, which is the point: the two audiences share a database and see nothing of each other.",
    tryThis:
      "Filter the board by team. Every role you see is a live requisition in the pipeline behind it, not a copy someone remembered to update.",
    caseStudy: TALENTFLOW_CASE,
  },
];

/** Ordered by index, so the enterprise toolchain leads and the operable
 *  prototype follows it. */
export const PROJECTS: Project[] = [...ENTRIES].sort((a, b) => a.index.localeCompare(b.index));

/** The one with a live console on the main page. */
export const FEATURED = ENTRIES.find((project) => project.featured) ?? ENTRIES[0];

export const bySlug = (slug: string): Project | undefined =>
  PROJECTS.find((project) => project.slug === slug);
