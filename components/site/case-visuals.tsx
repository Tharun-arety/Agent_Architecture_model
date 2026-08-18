/**
 * The visuals that sit beside each case study section.
 *
 * Built as components from data observed in the running systems on 18 Aug 2026,
 * not as screenshots. Two reasons, the same ones the main page uses: they
 * theme with the site, and they stay sharp at any width.
 *
 * Every record id, figure and status here was read off the live application.
 * Where a number could not be observed it is not shown.
 */

import { Check, Minus, X } from "lucide-react";

/* ── shared shells ───────────────────────────────────────────────────── */

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

/* ── 01 · the golden thread ──────────────────────────────────────────── */

const THREAD = [
  { n: 1, domain: "PROCUREMENT", state: "Received", line: "Supplier receipt captured", ref: "GR-2026-0018 · Rhine Magnetics GmbH" },
  { n: 2, domain: "GENEALOGY", state: "Traceable", line: "Material lot traced into build", ref: "MAG-L-2312 → unit ECL-M-097" },
  { n: 3, domain: "QUALITY", state: "Failed", line: "Acceptance test breached", ref: "2 samples below the 15.0 K limit", breach: true },
  { n: 4, domain: "QMS", state: "Escalated", line: "Lot-scoped non-conformance", ref: "NCR-26-001 · Open", breach: true },
  { n: 5, domain: "ECM", state: "Converted", line: "Impact assessment generated", ref: "ECR-26-002 · product, units, docs, cost frozen" },
  { n: 6, domain: "CCB", state: "Approved", line: "Cross-functional approval", ref: "4 of 4 board seats" },
  { n: 7, domain: "CONTROLLING", state: "Released", line: "MBOM rebuilt and repriced", ref: "EUR 2,656.81 → 2,620.81 (−36.00)" },
  { n: 8, domain: "KNOWLEDGE", state: "Searchable", line: "Change evidence indexed", ref: "ECN-26-001.md · citable revision" },
];

export function GoldenThread() {
  return (
    <Shell>
      <Head
        label="traceability · receipt to searchable change notice"
        right={<span className="text-cold font-mono text-[10px]">8 links</span>}
      />
      <ol className="divide-rule divide-y">
        {THREAD.map((step) => (
          <li key={step.n} className="flex gap-3 px-3 py-2">
            <span className="tnum text-faint w-3 shrink-0 font-mono text-[10px] leading-5">
              {step.n}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="micro">{step.domain}</span>
                <span
                  className={`font-mono text-[9px] tracking-wide ${
                    step.breach ? "text-hot" : "text-cold"
                  }`}
                >
                  {step.state}
                </span>
              </span>
              <span className="text-ink block text-[11.5px] leading-tight">{step.line}</span>
              <span className="text-faint block font-mono text-[9.5px] leading-tight">
                {step.ref}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

/* ── 01 · the approval diff ──────────────────────────────────────────── */

export function ApprovalDiff() {
  return (
    <Shell>
      <Head
        label="approval inbox · ecm impact analyst"
        right={<span className="text-warm font-mono text-[10px]">Pending</span>}
      />
      <p className="text-dim border-rule border-b px-3 py-2 text-[11.5px] leading-relaxed">
        Raise a change request over FLD-WA-001: specify minimum ethanol fraction on the transfer
        fluid drawing. Reaches 1 product, 2 assemblies above it, 3 captured baselines.
      </p>

      <div className="px-3 py-2">
        <p className="micro mb-1.5">field-level changes this proposal would make</p>
        <table className="w-full border-collapse font-mono text-[9.5px]">
          <thead>
            <tr className="text-faint text-left">
              <th className="pb-1 font-normal">CHANGE</th>
              <th className="pb-1 font-normal">TARGET</th>
              <th className="pb-1 font-normal">FROM</th>
              <th className="pb-1 font-normal">TO</th>
            </tr>
          </thead>
          <tbody className="text-dim">
            <tr className="border-rule border-t">
              <td className="text-cold py-1">Add</td>
              <td className="py-1">ChangeRequest</td>
              <td className="text-faint py-1">—</td>
              <td className="text-ink py-1">Specify minimum ethanol fraction</td>
            </tr>
            <tr className="border-rule border-t">
              <td className="text-warm py-1">Modify</td>
              <td className="py-1">Part FLD-WA-001</td>
              <td className="text-faint py-1">—</td>
              <td className="text-faint py-1">affected by</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-rule flex flex-wrap items-center gap-2 border-t px-3 py-2">
        <span className="border-cold/50 text-cold rounded-full border px-2.5 py-1 text-[10px]">
          Approve &amp; apply
        </span>
        <span className="border-rule text-faint rounded-full border px-2.5 py-1 text-[10px]">
          Reject
        </span>
        <span className="text-faint ml-auto font-mono text-[9px]">note required to reject</span>
      </div>
      <p className="text-warm border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        Approving runs the tool for real, inside one transaction, with your name on it.
      </p>
    </Shell>
  );
}

/* ── 01 · the offline suite ──────────────────────────────────────────── */

const CASES = [
  { name: "Tool timeouts", detail: "Every tool carries a deadline between 1 and 30 seconds." },
  { name: "Domain isolation", detail: "All 29 tools belong to exactly one scoped domain." },
  { name: "Retrieved prompt is untrusted", detail: "No governance operation is registered as a tool, so an injected “call approve_proposal” has nothing to call." },
  { name: "Mutation invariant", detail: "All 4 mutating tools pair an applier with an approving role." },
  { name: "Pinned budget", detail: "Token budget per turn is capped at 12,000." },
];

export function OfflineSuite() {
  return (
    <Shell>
      <Head
        label="offline suite · deterministic client"
        right={<span className="text-cold font-mono text-[10px]">5 / 5 pass</span>}
      />
      <ul className="divide-rule divide-y">
        {CASES.map((testCase) => (
          <li key={testCase.name} className="flex gap-2.5 px-3 py-2">
            <Check className="text-cold mt-0.5 size-3 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="text-ink block text-[11.5px] leading-tight">{testCase.name}</span>
              <span className="text-faint block text-[10px] leading-snug">{testCase.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        Run against a stub model client, so a regression check spends no tokens.
      </p>
    </Shell>
  );
}

/* ── 04 · the funnel, counted two ways ───────────────────────────────── */

const FUNNEL = [
  { stage: "Applied", reached: 52, sitting: 18, step: null as string | null },
  { stage: "Screening", reached: 33, sitting: 11, step: "63% from applied" },
  { stage: "Interview", reached: 10, sitting: 6, step: "30% from screening" },
  { stage: "Offer", reached: 5, sitting: 3, step: "50% from interview" },
  { stage: "Hired", reached: 2, sitting: 2, step: "40% from offer" },
];

export function Funnel() {
  const max = FUNNEL[0].reached;
  return (
    <Shell>
      <Head label="conversion · reached, not sitting in" />
      <ul className="divide-rule divide-y">
        {FUNNEL.map((row) => (
          <li key={row.stage} className="px-3 py-2">
            <div className="flex items-baseline gap-2">
              <span className="text-ink w-20 shrink-0 text-[11.5px]">{row.stage}</span>
              <span className="tnum text-ink font-mono text-[13px]">{row.reached}</span>
              {row.step && <span className="text-faint text-[10px]">{row.step}</span>}
              <span className="tnum text-faint ml-auto shrink-0 font-mono text-[10px]">
                {row.sitting} here now
              </span>
            </div>
            {/* Two bars, same axis: everything that reached the stage, and the
                slice still sitting in it. The gap between them is the number a
                board-shaped funnel silently throws away. */}
            <div className="mt-1.5 h-2.5 w-full">
              <div
                className="bg-cold/35 h-1 rounded-sm"
                style={{ width: `${(row.reached / max) * 100}%` }}
              />
              <div
                className="bg-cold mt-0.5 h-1 rounded-sm"
                style={{ width: `${(row.sitting / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-faint border-rule flex items-center gap-3 border-t px-3 py-2 text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="bg-cold/35 inline-block h-1 w-4 rounded-sm" /> reached
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-cold inline-block h-1 w-4 rounded-sm" /> sitting there now
        </span>
      </p>
    </Shell>
  );
}

/* ── 04 · where it slows down ────────────────────────────────────────── */

const DWELL = [
  { stage: "Applied", days: 12.6 },
  { stage: "Screening", days: 12.7 },
  { stage: "Interview", days: 13.1 },
  { stage: "Offer", days: 11.5 },
];

const IDLE = [
  { who: "Julia Duval", role: "Engineering Manager", days: 16, source: "LinkedIn" },
  { who: "Fatima Moreau", role: "Data Analyst", days: 17, source: "Agency" },
  { who: "Priyanka Diallo", role: "Backend Engineer", days: 18, source: "LinkedIn" },
  { who: "Ingrid Fischer", role: "Data Analyst", days: 20, source: "Referral" },
];

export function Dwell() {
  const max = Math.max(...DWELL.map((d) => d.days));
  return (
    <Shell>
      <Head label="time in stage · average days" />
      <ul className="divide-rule divide-y">
        {DWELL.map((row) => (
          <li key={row.stage} className="flex items-center gap-3 px-3 py-2">
            <span className="text-dim w-20 shrink-0 text-[11.5px]">{row.stage}</span>
            <span className="bg-rule h-1 flex-1 rounded-sm">
              <span
                className="bg-warm block h-1 rounded-sm"
                style={{ width: `${(row.days / max) * 100}%` }}
              />
            </span>
            <span className="tnum text-ink w-12 shrink-0 text-right font-mono text-[11px]">
              {row.days}d
            </span>
          </li>
        ))}
      </ul>

      <div className="border-rule border-t px-3 py-2">
        <p className="micro mb-1.5">longest idle right now</p>
        <ul className="space-y-1">
          {IDLE.map((row) => (
            <li key={row.who} className="flex items-baseline gap-2 text-[10.5px]">
              <span className="text-dim min-w-0 flex-1 truncate">
                {row.who} <span className="text-faint">· {row.role}</span>
              </span>
              <span className="text-faint shrink-0 font-mono text-[9px]">{row.source}</span>
              <span className="tnum text-warm w-8 shrink-0 text-right font-mono">{row.days}d</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        The failure of a pipeline is rarely a wrong decision. It is no decision.
      </p>
    </Shell>
  );
}

/* ── 04 · attribution ────────────────────────────────────────────────── */

const ACTIVITY = [
  { who: "Diego Alvarez", move: "Offer", by: "Marcus Webb", when: "10 days ago" },
  { who: "Hannah Kovacs", move: "Interview", by: "Ana Sousa", when: "14 days ago" },
  { who: "Julia Petrova", move: "Rejected", by: "Priya Raman", when: "14 days ago", out: true },
  { who: "Nathan Costa", move: "Offer", by: "Ana Sousa", when: "15 days ago" },
];

export function Attribution() {
  return (
    <Shell>
      <Head label="activity · every move has a name on it" />
      <ul className="divide-rule divide-y">
        {ACTIVITY.map((row) => (
          <li key={row.who} className="flex items-baseline gap-2 px-3 py-2 text-[11.5px]">
            <span className="text-ink shrink-0">{row.who}</span>
            <span className="text-faint">moved to</span>
            <span className={row.out ? "text-hot" : "text-cold"}>{row.move}</span>
            <span className="text-faint">by</span>
            <span className="text-dim min-w-0 truncate">{row.by}</span>
            <span className="text-faint ml-auto shrink-0 font-mono text-[9px]">{row.when}</span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

/* ── 03 · schema validation at the boundary ──────────────────────────── */

const EXTRACTIONS = [
  { field: "Issuer", value: "Rhine Magnetics GmbH", ok: true },
  { field: "Scope", value: "ISO 9001:2015 · magnet assemblies", ok: true },
  { field: "Issued", value: "2026-03-11", ok: true },
  { field: "Expires", value: "2027-03-10", ok: true, note: "plausible, and 11 months out" },
  { field: "Expires", value: "2021-03-10", ok: false, note: "well-formed, and in the past" },
];

export function SchemaGate() {
  return (
    <Shell>
      <Head label="extraction · validated before it is stored" />
      <ul className="divide-rule divide-y">
        {EXTRACTIONS.map((row, index) => (
          <li key={index} className="flex gap-2.5 px-3 py-2">
            {row.ok ? (
              <Check className="text-cold mt-0.5 size-3 shrink-0" aria-hidden="true" />
            ) : (
              <X className="text-hot mt-0.5 size-3 shrink-0" aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="micro">{row.field}</span>
                <span
                  className={`font-mono text-[11px] ${row.ok ? "text-ink" : "text-hot line-through"}`}
                >
                  {row.value}
                </span>
              </span>
              {row.note && (
                <span className="text-faint block text-[10px] leading-snug">{row.note}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-hot border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        A misread date is not visibly wrong anywhere downstream. The schema is the only place it can
        still be caught.
      </p>
    </Shell>
  );
}

/* ── 03 · read once, watch continuously ──────────────────────────────── */

export function CadenceSplit() {
  return (
    <Shell>
      <Head label="cost shape" />
      <div className="divide-rule divide-y">
        <div className="px-3 py-2.5">
          <p className="flex items-baseline gap-2">
            <span className="micro">read</span>
            <span className="text-ink text-[11.5px]">once per document</span>
            <span className="text-warm ml-auto font-mono text-[10px]">expensive</span>
          </p>
          <p className="text-faint mt-1 text-[10px] leading-snug">
            A vision pass over a photograph of paper, plus validation.
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="flex items-baseline gap-2">
            <span className="micro">watch</span>
            <span className="text-ink text-[11.5px]">continuously, over stored dates</span>
            <span className="text-cold ml-auto font-mono text-[10px]">nearly free</span>
          </p>
          <p className="text-faint mt-1 text-[10px] leading-snug">
            A comparison against a horizon. No document is opened again.
          </p>
        </div>
        <div className="flex items-baseline gap-2 px-3 py-2.5">
          <Minus className="text-faint size-3 shrink-0" aria-hidden="true" />
          <span className="text-dim text-[11px] leading-snug">
            Splitting them is what lets the second one run all the time, which is the only way an
            expiry surfaces before it lapses.
          </span>
        </div>
      </div>
      <p className="text-cold border-rule border-t px-3 py-2 font-mono text-[10.5px]">
        60 min → under 2 min per batch
      </p>
    </Shell>
  );
}


/* ── 01 · what a report can answer, and what it cannot ───────────────── */

const BOUNDED = [
  "How many parts are at revision C?",
  "Which NCRs are open this month?",
  "What is the BOM cost of ECL-SYS-1000?",
];

const UNBOUNDED = [
  "Why did this part change, and did the quality issue behind it ever close?",
  "Which built units contain the lot that failed, and what would recalling them cost?",
  "Has anything like this happened before on another product line?",
];

export function QuestionShapes() {
  return (
    <Shell>
      <Head label="two kinds of question" />
      <div className="border-rule border-b px-3 py-2.5">
        <p className="flex items-baseline gap-2">
          <span className="micro">a report answers</span>
          <span className="text-faint ml-auto font-mono text-[9px]">known in advance</span>
        </p>
        <ul className="mt-1.5 space-y-1">
          {BOUNDED.map((q) => (
            <li key={q} className="text-dim text-[11px] leading-snug">
              {q}
            </li>
          ))}
        </ul>
      </div>
      <div className="px-3 py-2.5">
        <p className="flex items-baseline gap-2">
          <span className="micro">someone has to go and look</span>
          <span className="text-warm ml-auto font-mono text-[9px]">crosses systems</span>
        </p>
        <ul className="mt-1.5 space-y-1">
          {UNBOUNDED.map((q) => (
            <li key={q} className="text-ink text-[11px] leading-snug">
              {q}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        You can build a report for the first list because you can write it down. The second list is
        the one that costs an afternoon, and it is different every time.
      </p>
    </Shell>
  );
}

/* ── 01 · what an impact assessment freezes ──────────────────────────── */

const IMPACT = [
  { label: "Product", value: "ECL-SYS-1000", note: "1 product line reached" },
  { label: "Units", value: "2 built", note: "which ones already shipped" },
  { label: "Documents", value: "drawings, baselines", note: "3 captured baselines contain it" },
  { label: "Revalidation", value: "required", note: "what has to be re-tested" },
  { label: "Cost exposure", value: "frozen for review", note: "before anyone approves" },
];

export function ImpactScope() {
  return (
    <Shell>
      <Head
        label="ecr-26-002 · impact assessment"
        right={<span className="text-warm font-mono text-[10px]">before approval</span>}
      />
      <ul className="divide-rule divide-y">
        {IMPACT.map((row) => (
          <li key={row.label} className="flex items-baseline gap-3 px-3 py-2">
            <span className="micro w-24 shrink-0">{row.label}</span>
            <span className="text-ink min-w-0 flex-1 font-mono text-[11px]">{row.value}</span>
            <span className="text-faint shrink-0 text-[9.5px]">{row.note}</span>
          </li>
        ))}
      </ul>
      <div className="border-rule border-t px-3 py-2.5">
        <p className="micro mb-1">on release, the MBOM was rebuilt and repriced</p>
        <p className="flex items-baseline gap-2 font-mono">
          <span className="tnum text-faint text-[12px] line-through">EUR 2,656.81</span>
          <span className="text-faint text-[10px]">→</span>
          <span className="tnum text-ink text-[14px]">EUR 2,620.81</span>
          <span className="tnum text-cold ml-auto text-[11px]">−36.00</span>
        </p>
      </div>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        The expensive mistake is approving a change whose full reach nobody worked out. This is that
        work, done before the decision rather than discovered after it.
      </p>
    </Shell>
  );
}

/* ── 01 · what adoption actually involves ────────────────────────────── */

const ADOPTION = [
  { phase: "Stays as it is", detail: "PDM, ERP, QMS and the rest keep holding the records of truth. Nothing is migrated.", tone: "cold" },
  { phase: "Added", detail: "Read-only connectors, an index over the combined record set, and the agent.", tone: "ink" },
  { phase: "Added", detail: "An approval inbox, and the roles that decide who may approve what.", tone: "ink" },
  { phase: "Never added", detail: "Any path that lets the agent write to a released record on its own.", tone: "warm" },
];

export function AdoptionPath() {
  return (
    <Shell>
      <Head label="what changes on your side" />
      <ul className="divide-rule divide-y">
        {ADOPTION.map((row, index) => (
          <li key={index} className="px-3 py-2.5">
            <p
              className={`micro ${row.tone === "cold" ? "text-cold" : row.tone === "warm" ? "text-warm" : ""}`}
            >
              {row.phase}
            </p>
            <p className="text-dim mt-1 text-[11.5px] leading-snug">{row.detail}</p>
          </li>
        ))}
      </ul>
      <p className="text-faint border-rule border-t px-3 py-2 text-[10.5px] leading-relaxed">
        Read-only first is not caution for its own sake. It means the worst outcome during a trial
        is a wrong answer on a screen, which costs a conversation rather than a record.
      </p>
    </Shell>
  );
}

/** Every visual, keyed by the name a case study section refers to. */
export const CASE_VISUALS: Record<string, () => React.ReactElement> = {
  goldenThread: GoldenThread,
  approvalDiff: ApprovalDiff,
  offlineSuite: OfflineSuite,
  funnel: Funnel,
  dwell: Dwell,
  attribution: Attribution,
  schemaGate: SchemaGate,
  cadenceSplit: CadenceSplit,
  questionShapes: QuestionShapes,
  impactScope: ImpactScope,
  adoptionPath: AdoptionPath,
};
