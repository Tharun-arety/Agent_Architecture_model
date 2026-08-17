/**
 * The systems on this page.
 *
 * One entry today. The array exists so a second is a data change rather than a
 * rebuild: `Systems` maps over it, renders the first in full with its live
 * console, and can render later ones as summary cards.
 */

export const REPO_URL = "https://github.com/Tharun-arety/Agent_Architecture_model";

export type SystemStatus = "prototype" | "live" | "in-progress";

export type SystemEntry = {
  slug: string;
  index: string;
  title: string;
  domain: string;
  status: SystemStatus;
  /** One sentence, read before anything below it. */
  summary: string;
  stack: string[];
  repoUrl?: string;
};

export const SYSTEMS: SystemEntry[] = [
  {
    slug: "grounded-engineering-agent",
    index: "01",
    title: "An agent that answers from your documents and your operating data",
    domain: "Magnetocaloric refrigeration equipment",
    status: "prototype",
    summary:
      "Two agents behind a router. One retrieves from a corpus of real public web pages, the other queries a time-series database of test-rig readings. Everything they do is checked, and every check is on screen.",
    stack: ["Next.js", "OpenAI", "Neon", "pgvector", "ajv", "vitest"],
    repoUrl: REPO_URL,
  },
];
