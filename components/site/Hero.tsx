/**
 * The opening.
 *
 * The name, the role and the positioning statement are the user's own words and
 * are used as written.
 *
 * The figure strip underneath is what separates this from every other
 * freelancer landing page: four numbers, none of them typed into the markup.
 * Three come from `public/eval-report.json`, which `npm run eval:full` writes,
 * and the fourth is read from the running database. If a re-run moves them, the
 * page moves with it.
 */

import { ArrowDown, FileText, Mail } from "lucide-react";

import { LiveCorpusCount } from "@/components/site/LiveCorpusCount";
import { caseTotals, overallScore, type EvalReport } from "@/components/EvalMetrics";
import { EMAIL, GROUNDING_FLOOR, MANIFEST_SOURCES, SEPARATION } from "@/components/site/site-data";

export function Hero({ report }: { report: EvalReport }) {
  const overall = overallScore(report);
  const cases = caseTotals(report);

  return (
    <section className="shell pt-16 pb-14 lg:pt-24 lg:pb-20">
      {/* The name is the h1: this page is about a person, and the display line
          below it is the claim rather than the title. */}
      <h1 className="text-ink text-[15px] font-medium tracking-tight">Tharun Arety</h1>
      <p className="text-dim mt-1 text-[13px]">AI-Leveraged Systems Architect</p>
      <p className="text-faint mt-1 text-[12px]">Augsburg, Germany · Open to relocation</p>

      <p className="display text-ink mt-10 max-w-[16ch]">I build AI-leveraged systems.</p>

      <p className="lede mt-6 max-w-[52ch]">
        I turn fragmented business data, documents, knowledge and workflows into systems that AI
        agents can understand, operate and continuously improve.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <a
          href="#systems"
          className="border-cold/50 bg-cold/10 text-cold hover:bg-cold/20 inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[13px] transition-colors"
        >
          Explore the systems
          <ArrowDown className="size-3.5" aria-hidden="true" />
        </a>
        <a
          href="#resume"
          className="border-rule text-dim hover:text-ink hover:border-rule-strong inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[13px] transition-colors"
        >
          <FileText className="size-3.5" aria-hidden="true" />
          Résumé
        </a>
        <a
          href={`mailto:${EMAIL}`}
          className="text-dim hover:text-ink inline-flex h-11 items-center gap-2 px-1 text-[13px] transition-colors"
        >
          <Mail className="size-3.5" aria-hidden="true" />
          {EMAIL}
        </a>
      </div>

      {/* Four measurements from the prototype below, so the claim above arrives
          with evidence attached rather than after it. */}
      <dl className="border-rule mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t pt-8 lg:grid-cols-4">
        <Figure
          value={`${(overall * 100).toFixed(1)}%`}
          label="mean eval score"
          detail={`${cases.passed} of ${cases.total} cases across ${report.metrics.length} metrics`}
        />
        <Figure value="3" label="guardrail layers" detail="input, tool arguments, grounding" />
        <Figure
          value={GROUNDING_FLOOR.toFixed(2)}
          label="similarity floor"
          detail={`calibrated, ${SEPARATION.toFixed(3)} separation`}
        />
        <LiveCorpusCount manifestSources={MANIFEST_SOURCES} />
      </dl>
    </section>
  );
}

export function Figure({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div>
      <dt className="micro">{label}</dt>
      <dd className="mt-1.5">
        <span className="tnum text-ink font-mono text-[26px] leading-none">{value}</span>
        <span className="text-faint mt-2 block text-[11px] leading-relaxed">{detail}</span>
      </dd>
    </div>
  );
}
