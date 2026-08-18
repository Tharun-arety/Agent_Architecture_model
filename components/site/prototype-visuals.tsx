/**
 * The prototype's own visuals: the real components, fed from real fixtures.
 *
 * This is the one project whose interface I can show directly, because I built
 * it and it is open. So its case study should not settle for a drawing of the
 * architecture when it can render the thing itself — the same components the
 * main page uses, from the same captured turns.
 */

import { AnswerText } from "@/components/AnswerText";
import { CitationList } from "@/components/CitationList";
import { EvalMetrics, EvalTargetNote, type EvalReport } from "@/components/EvalMetrics";
import { InspectorDrawer } from "@/components/InspectorDrawer";
import report from "@/public/eval-report.json";
import { ANSWER_SAMPLE, ISO_RETRIEVAL, REFUSAL_TRACE } from "@/components/site/fixtures";
import { GROUNDING_FLOOR } from "@/components/site/site-data";

const evalReport = report as EvalReport;

/** A refusal that cost nothing, as the inspector recorded it. */
function RefusalTrace() {
  return <InspectorDrawer trace={REFUSAL_TRACE} />;
}

/** The evidence pane, with the floor drawn and passages either side of it. */
function EvidencePane() {
  return <CitationList data={ISO_RETRIEVAL} floor={GROUNDING_FLOOR} />;
}

/** An answer whose citations are checked, including one that was not retrieved. */
function CheckedAnswer() {
  return (
    <div className="bg-inset border-rule border p-4">
      <p className="text-ink text-[13px] leading-[1.7]">
        <AnswerText text={ANSWER_SAMPLE.text} knownRefs={ANSWER_SAMPLE.knownRefs} />
      </p>
    </div>
  );
}

/** The current report, rendered by the same component as the badge. */
function EvalReportVisual() {
  return (
    <div className="p-1">
      <EvalMetrics metrics={evalReport.metrics} size="md" />
      <EvalTargetNote className="border-rule mt-4 border-t pt-3" />
    </div>
  );
}

export const PROTOTYPE_VISUALS: Record<string, () => React.ReactElement> = {
  refusalTrace: RefusalTrace,
  evidencePane: EvidencePane,
  checkedAnswer: CheckedAnswer,
  evalReport: EvalReportVisual,
};
