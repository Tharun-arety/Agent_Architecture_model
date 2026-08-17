/**
 * The stack, as icon tiles.
 *
 * A server component on purpose. `simple-icons` is imported here, the paths are
 * inlined into the HTML at build time, and the package never reaches the
 * browser bundle.
 *
 * Two kinds of thing are listed and they are kept apart. Tools have a logo and
 * get a tile. Practices like RAG, evals and human-in-the-loop have no logo, and
 * inventing one would be worse than listing them as text, so they are chips
 * underneath.
 *
 * Everything here is from the CV. Nothing was added because it would round out
 * a row.
 */

import * as si from "simple-icons";

type Tool = {
  /** Key in `simple-icons`. */
  icon?: keyof typeof si;
  label: string;
  /** Set when the brand's own colour is unreadably dark on this ground. */
  colour?: string;
};

type Group = { title: string; tools: Tool[]; practices?: string[] };

const GROUPS: Group[] = [
  {
    title: "Agents and AI",
    tools: [
      { icon: "siPython", label: "Python" },
      { icon: "siLangchain", label: "LangGraph" },
      { icon: "siAnthropic", label: "Anthropic", colour: "#d4d4d4" },
      { icon: "siHuggingface", label: "Hugging Face" },
      { icon: "siPytorch", label: "PyTorch" },
    ],
    practices: [
      "AI agents",
      "LLM APIs",
      "Tool calling",
      "RAG",
      "Vector and hybrid retrieval",
      "Embeddings",
      "MCP servers",
      "Prompt engineering",
      "Coding agents",
    ],
  },
  {
    title: "Reliability and guardrails",
    tools: [{ icon: "siJson", label: "ajv", colour: "#8fb8d8" }],
    practices: [
      "Evals",
      "LLM-as-judge",
      "Guardrail pipelines",
      "Schema validation",
      "Tool-argument validation",
      "Human-in-the-loop",
      "Observability",
    ],
  },
  {
    title: "Software and infrastructure",
    tools: [
      { icon: "siTypescript", label: "TypeScript" },
      { icon: "siNextdotjs", label: "Next.js", colour: "#e8e8e8" },
      { icon: "siReact", label: "React" },
      { icon: "siNodedotjs", label: "Node.js" },
      { icon: "siFastapi", label: "FastAPI" },
      { icon: "siPostgresql", label: "PostgreSQL" },
      { icon: "siSqlalchemy", label: "SQLAlchemy", colour: "#e05545" },
      { icon: "siDocker", label: "Docker" },
      { icon: "siLinux", label: "Linux" },
      { icon: "siGit", label: "Git" },
      { icon: "siGithub", label: "GitHub", colour: "#d4d4d4" },
      { icon: "siVercel", label: "Vercel", colour: "#e8e8e8" },
    ],
    practices: ["pgvector", "REST APIs", "Async services"],
  },
  {
    title: "Enterprise and engineering data",
    tools: [],
    practices: [
      "ERP",
      "CRM",
      "PDM",
      "ECM",
      "QMS",
      "BOM and engineering change",
      "Compliance automation",
      "Knowledge management",
      "Document intelligence",
    ],
  },
];

/** simple-icons ships a full `<svg>` string. Only the path data is wanted, so
 *  it can be sized and coloured like everything else here. */
function pathOf(key: keyof typeof si): string | null {
  const entry = si[key] as unknown as { path?: string } | undefined;
  return entry?.path ?? null;
}

export function TechStack() {
  return (
    <section id="stack" className="bg-veil">
      <div className="shell py-16 lg:py-24">
        <span className="eyebrow">Stack</span>
        <h2 className="display-sm text-ink mt-5 max-w-[24ch]">What I build with</h2>
        <p className="lede mt-4">
          The tools below are the ones I reach for. The practices beside them are the part that
          decides whether an agent is safe to put in front of anyone.
        </p>

        <div className="mt-12 space-y-12">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="legend">{group.title}</h3>

              {group.tools.length > 0 && (
                <ul className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {group.tools.map((tool) => {
                    const icon = tool.icon ? (si[tool.icon] as unknown as { hex: string }) : null;
                    const path = tool.icon ? pathOf(tool.icon) : null;
                    return (
                      <li
                        key={tool.label}
                        className="border-rule bg-panel hover:border-rule-strong flex flex-col items-center gap-2.5 rounded-xl border px-2 py-4 transition-colors"
                      >
                        {path && (
                          <svg
                            viewBox="0 0 24 24"
                            className="size-6 shrink-0"
                            style={{ fill: tool.colour ?? `#${icon?.hex}` }}
                            aria-hidden="true"
                          >
                            <path d={path} />
                          </svg>
                        )}
                        <span className="text-dim w-full truncate text-center text-[11px]">
                          {tool.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {group.practices && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.practices.map((practice) => (
                    <li
                      key={practice}
                      className="border-rule text-dim rounded-full border px-3 py-1.5 text-[12px]"
                    >
                      {practice}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
