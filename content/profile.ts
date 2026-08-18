/**
 * What the profile agent is allowed to know.
 *
 * Written as discrete passages rather than one long document, because each one
 * is retrieved and cited on its own. A passage should answer a question a
 * visitor might actually ask, and should be readable when it appears alone
 * under an answer.
 *
 * This file is the source. `npm run embed:profile` turns it into
 * `data/profile-corpus.json` with vectors attached. Edit here, re-run that, and
 * commit both.
 *
 * Nothing here is generated. If a claim is not in the CV or in the repository,
 * it does not belong in this file.
 */

export type ProfileDoc = {
  /** Shown as the citation handle, so keep it short and readable. */
  ref: string;
  title: string;
  text: string;
};

export const PROFILE_DOCS: ProfileDoc[] = [
  {
    ref: "SUMMARY",
    title: "In one paragraph",
    text: "Tharun Arety is an AI systems architect based in Augsburg, Germany, open to relocation. He builds agentic systems for businesses: ERP, CRM and PDM toolchains, RAG pipelines and MCP integrations that turn fragmented business data into something a team can query and act on. He owns the full stack himself, from Python and TypeScript services through Postgres and pgvector infrastructure to the eval suites and guardrail pipelines that make agents safe to run in front of people.",
  },
  {
    ref: "WHAT-HE-DOES",
    title: "The kind of work he takes on",
    text: "The work is usually one of three shapes. Automating a manual business workflow that costs a team hours a week, such as compliance checking or document processing. Building an agentic toolchain that spans systems which do not talk to each other, so that ERP, CRM, PDM, ECM and QMS data can be reached from one place. Or making an existing agent trustworthy enough to deploy, by adding guardrails, retrieval grounding and an offline eval suite that shows whether it improved.",
  },
  {
    ref: "ROLE-VEXOS",
    title: "AI Systems Architect and AI Engineer at Vexos",
    text: "From 2025 to 2026, remote. He replaced ERP, CRM and PDM software by architecting a custom end-to-end agentic toolchain, which removed the SaaS dependencies it stood in for. He cut compliance processing from about 60 minutes to under 2 minutes per batch, a 96 percent reduction, using a vision-based pipeline with automated schema validation. He opened siloed business data to natural-language querying by deploying RAG pipelines, MCP servers and tool-calling agents that can execute workflows rather than only answer questions.",
  },
  {
    ref: "ROLE-AUGSBURG",
    title: "Research Associate at the University of Augsburg",
    text: "From 2023 to 2026, in the Data-driven Product Engineering and Design group at MRM, Augsburg, Germany. He scaled computational engineering throughput by automating the simulation lifecycle across large design spaces. He accelerated design space evaluation by building PyTorch and JAX surrogate models and differentiable optimisation frameworks in place of slower traditional methods. He also integrated LLMs and coding agents into daily research workflows to shorten software and automation cycles.",
  },
  {
    // Added after calibration: "what has he actually shipped?" scored 0.356
    // against WHAT-HE-DOES and nothing else, so the agent answered that the
    // passages did not specify. Each project passage described one system well
    // and none of them answered the question of what exists in total.
    ref: "SHIPPED",
    title: "What he has built and put into production",
    text: "Three systems are running in production and one is a public prototype. In production: an agentic PDM, ECM and QMS toolchain that unifies product data, engineering change and quality management behind one interface; an autonomous compliance system that reads certificates, monitors expiries and chases suppliers, cutting a batch from about 60 minutes to under 2; and TalentFlow, an applicant tracking system covering requisition through to hire. The prototype is the magnetocaloric engineering agent on this site, built so its guardrails and eval scores can be inspected while you use it.",
  },
  {
    ref: "PROJ-PDM",
    title: "Agentic PDM, ECM and QMS toolchain",
    text: "A production system that unifies product data management, engineering change management and quality management behind one interface. Built with FastAPI and LangGraph over PostgreSQL with pgvector and async SQLAlchemy 2. Product data, change requests and quality records previously lived in separate systems, so answering a question about a part meant opening three of them. The agent can now propose a change against the combined record set, and a person approves it before anything reaches a released record. Human-in-the-loop approval is a requirement of the design rather than a setting.",
  },
  {
    ref: "PROJ-COMPLIANCE",
    title: "Autonomous compliance system",
    text: "A production system that replaced manual compliance tracking. Certificates arrived as scanned documents and were tracked by hand, so expiry dates were noticed late and suppliers were chased inconsistently. A vision pipeline reads each certificate and extracts the fields that matter, with automated schema validation on everything it produces. Expiry monitoring watches the extracted dates and raises what is about to lapse, and supplier outreach is triggered from that monitoring. Processing went from roughly 60 minutes to under 2 minutes per batch.",
  },
  {
    ref: "PROJ-AGENT",
    title: "The magnetocaloric engineering agent on this site",
    text: "The live prototype on this site. Two agents behind a router, one retrieving from a corpus of real public web pages and one querying a time-series database of synthetic test-rig readings. The tool-calling loop is written by hand against the OpenAI API with no agent framework, so the argument guardrail sits between the model asking for a call and the call happening. Three guardrail layers: deterministic input checks before the first model call, ajv plus database bounds on every tool argument, and a calibrated similarity floor around the answer. An offline eval suite of 144 cases across 12 metrics scores 95.9 percent.",
  },
  {
    ref: "PROJ-TALENTFLOW",
    title: "TalentFlow",
    text: "A production applicant tracking system covering the whole recruitment pipeline, from opening a requisition through pipeline stages and candidate records to making the offer. Built with Next.js and PostgreSQL using Drizzle, with a typed schema so pipeline states are enforced by the database rather than by convention. It replaced a process that ran across email threads and spreadsheets.",
  },
  {
    ref: "GUARDRAILS",
    title: "How he makes agents safe to deploy",
    text: "Checks run in three places. Before the first model call, deterministic pattern checks redact credentials and refuse prompt injection, because a filter that has to ask a model whether something is an injection can be talked out of the answer. Before any tool runs, arguments are validated against the same JSON Schema the model was given, plus bounds only the database knows, and a rejection goes back to the model as a message it can correct from. Around the answer, a calibrated similarity floor decides whether there is enough evidence to answer at all, and every citation is checked against what retrieval actually returned.",
  },
  {
    ref: "EVALS",
    title: "How he measures whether an agent works",
    text: "With an offline eval suite built from real questions with known answers, split into a free deterministic tier and a paid judged tier. It measures guardrail trigger rate and, more importantly, guardrail specificity, which is whether benign questions that look adversarial are wrongly blocked. A guardrail that blocks everything scores perfectly on trigger rate alone. On the prototype on this site, the first run scored 85.6 percent and found three real defects: a similarity floor set by guesswork, a router misdirecting datasheet questions, and one document dominating the index. The current run scores 95.9 percent.",
  },
  {
    ref: "STACK",
    title: "What he builds with",
    text: "Python and TypeScript as the main languages. FastAPI and Node for services, Next.js and React on the front end. PostgreSQL with pgvector for retrieval, and async SQLAlchemy. LangGraph for graph-shaped agent workflows, and hand-written loops against the OpenAI API where the control flow needs to be explicit. Docker and Linux, Git, and ajv for schema validation. On the practice side: RAG, hybrid retrieval, embeddings, MCP servers, tool calling, evals, LLM-as-judge, guardrail pipelines and human-in-the-loop review.",
  },
  {
    ref: "MCP",
    title: "MCP and tool-calling experience",
    text: "He has deployed MCP servers in production to expose business systems to agents as callable tools, alongside RAG pipelines and tool-calling agents that execute workflows rather than only retrieve text. The distinction matters in his work: an agent that can only answer questions leaves the manual work in place, while an agent that can call the systems that hold the data can complete the task and leave a record of what it did.",
  },
  {
    ref: "BACKGROUND",
    title: "Education and background",
    text: "M.Sc. Materials Engineering at the University of Augsburg, Germany, 2022 to 2026. B.Tech. Mechanical Engineering at NIT Agartala, India, 2016 to 2020. The engineering background is why the agentic work tends to land on engineering data: bills of materials, engineering change, product data and quality records are domains he already understands. He holds a scholarship from the Albert Leimer Stiftung and DAAD, awarded for academic performance during the M.Sc.",
  },
  {
    ref: "AVAILABILITY",
    title: "Location, availability and work status",
    text: "Based in Augsburg, Germany, and open to relocation. Indian national, authorised to work in Germany with no sponsorship required, so no visa sponsorship is needed to hire him. Available to start immediately. English at C1, German at B1 and working towards C1.",
  },
  {
    // Split out of AVAILABILITY because calibration showed "how do I contact
    // him?" scoring 0.254 against the combined passage: the email was buried
    // behind visa status and language levels, and the embedding averaged it
    // away. A passage should answer one question.
    ref: "CONTACT",
    title: "How to get in touch",
    text: "Email is the way to reach Tharun: tharun.nstn@gmail.com. He replies to enquiries about building agents, automating a manual workflow, or connecting business systems that do not currently talk to each other. A first message that says what your team keeps asking for, and where the answer currently lives, is enough to get a useful reply about whether an agent is the right tool.",
  },
  {
    ref: "ENGAGEMENT",
    title: "Who he works with and how a project starts",
    text: "The work suits companies of roughly 11 to 50 people who have a manual process that costs real time, or business data spread across systems that do not talk to each other. A useful first conversation is about what people in the company keep asking for and where the answer currently lives. That is usually enough to say whether an agent is the right tool and what building it would involve.",
  },
];
