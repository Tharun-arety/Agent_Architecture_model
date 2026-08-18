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

export const REPO_URL = "https://github.com/Tharun-arety/Agent_Architecture_model";

export type ProjectStatus = "prototype" | "live" | "in-progress";

export type CaseSection = {
  title: string;
  body: string[];
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
  /** Renders the live console on the main page and in its case study. */
  featured?: boolean;
  caseStudy: CaseStudy;
};

const ENTRIES: Project[] = [
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
    liveUrl: "https://agentic-enterprise-tool.vercel.app/",
    liveLabel: "Open the sandbox",
    liveNote:
      "A public sandbox of the same toolchain, seeded with invented records and no customer data. The production instance is not mine to publish.",
    caseStudy: {
      context: [
        "A manufacturer's engineering record is not one thing. The bill of materials and part revisions sit in PDM. The requests to change them sit in ECM. The inspection results, non-conformances and corrective actions that justify a change sit in QMS. Each system is reasonable on its own, and each was bought to solve its own problem.",
        "The cost shows up in the questions that cross them. Why did this part revision change, and did the quality issue that triggered it ever get closed? Answering that means opening three systems, matching identifiers that do not agree, and trusting whoever did the matching. It is slow, and it is the kind of slow that makes people stop asking.",
        "Replacing all three was never the goal. They hold the records of truth and they are not going anywhere. What was missing was something that could reach across them.",
      ],
      architecture: [
        "A FastAPI service sits in front of all three record sets, with LangGraph holding the workflow. The graph shape matters here: an engineering change is not a single question and answer, it is a sequence with branches and a point where it stops and waits for a person.",
        "Retrieval runs over the combined record set with pgvector, so a question about a part reaches its BOM position, the changes that touched it and the quality findings that reference it, without the asker knowing which system holds which. Postgres and async SQLAlchemy sit underneath.",
        "The approval gate is what makes it deployable. The agent drafts a change against the combined record and stops. Nothing reaches a released record until a person signs it off, so the failure mode of a wrong draft is wasted review time rather than a corrupted engineering record.",
      ],
      sections: [
        {
          title: "Why a graph and not a loop",
          body: [
            "An engineering change has states. It is drafted, it is reviewed, it is approved or sent back, and each of those can branch on what the quality record says. A single tool-calling loop can be made to imitate that, but the state ends up implicit in the conversation, which means it cannot be inspected or resumed.",
            "LangGraph makes the states explicit. The workflow can pause at the approval node for as long as the reviewer takes, and pick up where it stopped.",
          ],
        },
        {
          title: "Human-in-the-loop as a requirement, not a setting",
          body: [
            "Approval is not a configuration flag that can be turned off for throughput. It is a node in the graph that the path to a released record has to pass through.",
            "That is a deliberate constraint on what the agent is allowed to be. It removes the most impressive-sounding claim, that the system changes records by itself, and it is the reason the system can be run against real engineering data at all.",
          ],
        },
        {
          title: "What retrieval has to bridge",
          body: [
            "The three systems do not use the same identifiers, and their text is written by different people for different readers. A quality finding describes a symptom. A change request describes an intent. A BOM entry describes neither.",
            "Retrieval over the combined set has to bridge that, which is why it is embedding-based rather than a join. A join needs the identifiers to agree. Retrieval only needs the language to overlap.",
          ],
        },
      ],
      results: [
        {
          value: "3 to 1",
          label: "Systems to open",
          note: "A question that crosses PDM, ECM and QMS is answered from one interface.",
        },
        {
          value: "Every one",
          label: "Changes reviewed by a person",
          note: "The approval node is on the only path to a released record.",
        },
      ],
    },
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
          title: "ajv over the same schema the model gets",
          body: [
            "OpenAI tool parameters are JSON Schema already. Validating with ajv against that same literal means one source of truth serves both the model and the validator.",
            "A Zod mirror would be a second definition that can drift from what the model was told, which is a bug that only shows up in production.",
          ],
        },
        {
          title: "The floor was measured, not chosen",
          body: [
            "The first value was 0.70, which sounded prudent and refused almost every question the system could answer, scoring 8% recall. Sweeping the golden set turned a guess into a measurement and put it at 0.35.",
            "Questions the corpus can answer score 0.512 on average at rank one. Questions it cannot score 0.198. The floor sits inside that gap, and the evidence pane draws it so both sides are visible.",
          ],
        },
        {
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
          title: "Schema validation is the load-bearing part",
          body: [
            "A vision model reading a photographed certificate will occasionally produce a confident, well-formed, wrong answer. An expiry date read as 2027 instead of 2021 is not visibly wrong anywhere downstream.",
            "Validating every extraction against a schema at the point it is produced turns that class of failure into a rejection rather than a record. It is the same argument as the tool-argument guardrail in the agent work: the check belongs between the model and the system, not after it.",
          ],
        },
        {
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
    stack: ["Next.js", "PostgreSQL", "Drizzle"],
    caseStudy: {
      context: [
        "Recruitment ran on email threads and a spreadsheet. That works until two people are hiring at once, and then the state of a candidate depends on who you ask and how recently they refreshed the tab.",
        "The specific failure was not losing candidates. It was disagreeing about where they were: someone treated as rejected in one thread and awaiting feedback in another, which is worse than losing them, because nobody knows there is anything to fix.",
      ],
      architecture: [
        "A Next.js application over Postgres, with the schema defined through Drizzle. Requisitions, candidates, pipeline stages and offers are all first-class records rather than columns in a sheet.",
        "The pipeline states are enforced in the database rather than by convention in the interface. A candidate cannot be in a state the schema does not allow, so the disagreement the system was built to fix cannot be represented.",
      ],
      sections: [
        {
          title: "Constraints in the schema, not in the interface",
          body: [
            "It is tempting to enforce a hiring pipeline in the front end, because that is where it is visible. The problem is that every other path into the database bypasses it: an import, a fix applied by hand, a second client.",
            "Putting the states in the schema means the rule holds regardless of what wrote the row. The interface then only has to render what is already guaranteed.",
          ],
        },
      ],
      results: [
        {
          value: "One",
          label: "Source of truth",
          note: "Requisition through to offer, with no parallel spreadsheet.",
        },
      ],
    },
  },
];

/** Ordered by index, so the enterprise toolchain leads and the operable
 *  prototype follows it. */
export const PROJECTS: Project[] = [...ENTRIES].sort((a, b) => a.index.localeCompare(b.index));

/** The one with a live console on the main page. */
export const FEATURED = ENTRIES.find((project) => project.featured) ?? ENTRIES[0];

export const bySlug = (slug: string): Project | undefined =>
  PROJECTS.find((project) => project.slug === slug);
