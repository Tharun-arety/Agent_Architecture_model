/**
 * The visuals that carry the commercial argument.
 *
 * Kept apart from `case-visuals.tsx`, which shows what a system does. These
 * show why it is worth paying for, which is a different claim and a more
 * dangerous one: it is where an invented figure would do real damage.
 *
 * So the rule here is stricter than elsewhere. Every number is either observed
 * in the running system or taken from the CV. Where the honest answer is "that
 * depends on your business", the visual says so and hands the reader the
 * multiplication rather than performing it for them.
 */

import { Check, X } from "lucide-react";

function Head({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="border-rule bg-panel flex items-baseline gap-3 border-b px-3 py-2">
      <span className="micro">{label}</span>
      {right && <span className="ml-auto shrink-0">{right}</span>}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="bg-inset border-rule border">{children}</div>;
}

/* ── 02 · what being wrong costs ─────────────────────────────────────── */

const OUTCOMES = [
  {
    kind: "A refusal",
    cost: "0 ms · 0 tokens",
    detail: "Nothing clears the floor, so no model is called and the system says so.",
    bad: false,
  },
  {
    kind: "A grounded answer",
    cost: "one call",
    detail: "Cited, with every handle checked against what retrieval actually returned.",
    bad: false,
  },
  {
    kind: "A confident wrong answer",
    cost: "the account",
    detail:
      "Cheapest of the three to produce, and the only one that cannot be undone. Nobody asks a second question after the first invented one.",
    bad: true,
  },
];

export function RefusalEconomics() {
  return (
    <Shell>
      <Head label="three outcomes, priced" />
      <ul className="divide-rule divide-y">
        {OUTCOMES.map((row) => (
          <li key={row.kind} className="px-3 py-2.5">
            <p className="flex items-baseline gap-2">
              <span
                className={`text-[11.5px] font-medium ${row.bad ? "text-hot" : "text-cold"}`}
              >
                {row.kind}
              </span>
              <span
                className={`ml-auto font-mono text-[10px] ${row.bad ? "text-hot" : "text-faint"}`}
              >
                {row.cost}
              </span>
            </p>
            <p className="text-dim mt-1 text-[10.5px] leading-snug">{row.detail}</p>
          </li>
        ))}
      </ul>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        Guardrails are not there to make an agent timid. They are there because two of these cost
        almost nothing and the third is not recoverable.
      </p>
    </Shell>
  );
}

/* ── 02 · the suite having a before ──────────────────────────────────── */

const RUNS = [
  { run: "First run", score: 85.6, fixed: "Baseline. Three defects found, and all three were mine." },
  { run: "After calibration", score: 90.3, fixed: "Floor measured rather than guessed: 0.70 down to 0.35." },
  { run: "After routing fix", score: 95.2, fixed: "Datasheet questions stopped being sent to the telemetry agent." },
  { run: "After diversification", score: 95.9, fixed: "One document no longer monopolises broad queries." },
];

export function EvalProgress() {
  return (
    <Shell>
      <Head label="four runs · the same 144 cases" />
      <ul className="divide-rule divide-y">
        {RUNS.map((row) => (
          <li key={row.run} className="px-3 py-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-ink text-[11.5px]">{row.run}</span>
              <span className="tnum text-cold ml-auto font-mono text-[12px]">{row.score}%</span>
            </div>
            <div className="bg-rule mt-1.5 h-1 w-full rounded-sm">
              <div className="bg-cold h-1 rounded-sm" style={{ width: `${row.score}%` }} />
            </div>
            <p className="text-faint mt-1.5 text-[10px] leading-snug">{row.fixed}</p>
          </li>
        ))}
      </ul>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        Without the first row, the last one is only a number I chose to publish.
      </p>
    </Shell>
  );
}

/* ── 03 · which work is worth automating ─────────────────────────────── */

const SHAPE = [
  { trait: "Volume", value: "Every supplier, every renewal, forever", good: true },
  { trait: "Rules", value: "The fields wanted are always the same", good: true },
  { trait: "Judgement", value: "Almost none, until something is wrong", good: true },
  { trait: "Cost of an error", value: "High, and discovered long after the fact", good: false },
  { trait: "Who wants the job", value: "Nobody", good: true },
];

export function WorkShape() {
  return (
    <Shell>
      <Head label="why this task, and not another" />
      <ul className="divide-rule divide-y">
        {SHAPE.map((row) => (
          <li key={row.trait} className="flex items-baseline gap-3 px-3 py-2">
            {row.good ? (
              <Check className="text-cold mt-0.5 size-3 shrink-0" aria-hidden="true" />
            ) : (
              <X className="text-hot mt-0.5 size-3 shrink-0" aria-hidden="true" />
            )}
            <span className="micro w-24 shrink-0">{row.trait}</span>
            <span className="text-dim min-w-0 flex-1 text-[11px] leading-snug">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        High volume, stable rules, little judgement, expensive when wrong. That combination is where
        automation pays, and it is rarer than the sales pitch for it suggests.
      </p>
    </Shell>
  );
}

/* ── 03 · what a lapse actually costs ────────────────────────────────── */

const LAPSE = [
  { when: "Day 0", what: "A certificate quietly expires", cost: "nothing yet", tone: "faint" },
  { when: "Day 1 on", what: "Goods keep being received against a supplier with no valid certificate", cost: "invisible", tone: "warm" },
  { when: "At audit", what: "A finding is raised against the receiving process itself", cost: "corrective action", tone: "hot" },
  { when: "After", what: "Re-qualify the supplier, then quarantine or re-inspect what came in meanwhile", cost: "the expensive part", tone: "hot" },
];

export function LapseCost() {
  return (
    <Shell>
      <Head label="a certificate nobody noticed had expired" />
      <ol className="divide-rule divide-y">
        {LAPSE.map((row) => (
          <li key={row.when} className="px-3 py-2.5">
            <p className="flex items-baseline gap-2">
              <span className="micro w-16 shrink-0">{row.when}</span>
              <span className="text-ink min-w-0 flex-1 text-[11px] leading-snug">{row.what}</span>
            </p>
            <p
              className={`mt-0.5 pl-[4.5rem] font-mono text-[9.5px] ${
                row.tone === "hot" ? "text-hot" : row.tone === "warm" ? "text-warm" : "text-faint"
              }`}
            >
              {row.cost}
            </p>
          </li>
        ))}
      </ol>
      <p className="text-cold border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        Monitoring moves the discovery from the audit back to thirty days before expiry, where it
        costs an email.
      </p>
    </Shell>
  );
}

/* ── 04 · what each channel is worth ─────────────────────────────────── */

const SOURCES = [
  { name: "Careers site", pct: 35, count: 18, paid: false },
  { name: "LinkedIn", pct: 21, count: 11, paid: false },
  { name: "Referral", pct: 17, count: 9, paid: false },
  { name: "Agency", pct: 15, count: 8, paid: true },
  { name: "Inbound", pct: 12, count: 6, paid: false },
];

export function SourceMix() {
  return (
    <Shell>
      <Head label="where candidates come from" />
      <ul className="divide-rule divide-y">
        {SOURCES.map((row) => (
          <li key={row.name} className="flex items-center gap-3 px-3 py-2">
            <span className="text-dim w-24 shrink-0 text-[11.5px]">{row.name}</span>
            <span className="bg-rule h-1 flex-1 rounded-sm">
              <span
                className={`block h-1 rounded-sm ${row.paid ? "bg-warm" : "bg-cold"}`}
                style={{ width: `${(row.pct / 35) * 100}%` }}
              />
            </span>
            <span className="tnum text-ink w-8 shrink-0 text-right font-mono text-[11px]">
              {row.pct}%
            </span>
            <span className="tnum text-faint w-5 shrink-0 text-right font-mono text-[10px]">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-faint border-rule flex flex-wrap items-center gap-x-3 border-t px-3 py-2 text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="bg-cold inline-block h-1 w-4 rounded-sm" /> costs you nothing per hire
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-warm inline-block h-1 w-4 rounded-sm" /> billed as a percentage
        </span>
      </p>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        The only channel billed per hire is the second smallest. You can make that trade knowingly,
        but only if attribution was recorded at the point of application.
      </p>
    </Shell>
  );
}

/* ── 04 · the cost of a seat nobody is in ────────────────────────────── */

const VACANCY = [
  { value: "32", unit: "days", label: "average time to hire", tone: "ink" },
  { value: "8", unit: "seats", label: "open right now, across 5 roles", tone: "warm" },
  { value: "20", unit: "days", label: "longest a candidate has sat untouched", tone: "hot" },
];

export function VacancyCost() {
  return (
    <Shell>
      <Head label="what an open role costs while it stays open" />
      <div className="divide-rule divide-y">
        {VACANCY.map((row) => (
          <div key={row.label} className="flex items-baseline gap-2 px-3 py-2.5">
            <span
              className={`tnum font-mono text-[16px] ${
                row.tone === "hot" ? "text-hot" : row.tone === "warm" ? "text-warm" : "text-ink"
              }`}
            >
              {row.value}
            </span>
            <span className="text-faint font-mono text-[10px]">{row.unit}</span>
            <span className="text-dim ml-auto max-w-[60%] text-right text-[10.5px] leading-snug">
              {row.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        Multiply the first two by whatever an empty seat costs you and you have the figure this is
        measured against. The third is the one you can do something about this afternoon.
      </p>
    </Shell>
  );
}

export const VALUE_VISUALS: Record<string, () => React.ReactElement> = {
  refusalEconomics: RefusalEconomics,
  evalProgress: EvalProgress,
  workShape: WorkShape,
  lapseCost: LapseCost,
  sourceMix: SourceMix,
  vacancyCost: VacancyCost,
};
