/**
 * The projects.
 *
 * `featured` decides what the homepage shows. Everything here appears on
 * `/projects`. Adding a project is an entry in this array and nothing else.
 *
 * `liveUrl` and `repoUrl` are optional and render as links only when set, so an
 * entry never advertises a destination that does not exist.
 */

export const REPO_URL = "https://github.com/Tharun-arety/Agent_Architecture_model";

export type ProjectStatus = "prototype" | "live" | "in-progress";

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
  /** What changed as a result. Only claims that can be stated plainly. */
  outcome: string;
  stack: string[];
  liveUrl?: string;
  repoUrl?: string;
  /** Renders the live console on the homepage and on /projects. */
  featured?: boolean;
};

const ENTRIES: Project[] = [
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
  },
  {
    slug: "agentic-pdm-ecm-qms",
    index: "01",
    title: "Agentic PDM, ECM and QMS toolchain",
    summary:
      "Product data, engineering change and quality management behind one interface, where an agent proposes changes and a person approves them.",
    domain: "Manufacturing engineering data",
    status: "live",
    problem:
      "Product data, change requests and quality records lived in separate systems, so answering a question about a part meant opening three of them and reconciling the answers by hand.",
    built: [
      "A LangGraph and FastAPI service unifying product data, engineering change and quality management behind one queryable interface.",
      "Retrieval over the combined record set with pgvector, and async SQLAlchemy against Postgres underneath it.",
      "Human-in-the-loop approval on every agent-proposed change, so nothing reaches a released record without a person signing it off.",
    ],
    outcome:
      "Change management runs against one set of data instead of three, and the agent drafts the change while a person keeps the decision.",
    stack: ["FastAPI", "LangGraph", "PostgreSQL", "pgvector", "SQLAlchemy 2 async"],
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
    stack: ["Next.js", "PostgreSQL", "Drizzle"],
  },
];

/** Ordered by index, so the enterprise toolchain leads and the operable
 *  prototype follows it. */
export const PROJECTS: Project[] = [...ENTRIES].sort((a, b) => a.index.localeCompare(b.index));

/** The one with a live console on the homepage. */
export const FEATURED = ENTRIES.find((project) => project.featured) ?? ENTRIES[0];
