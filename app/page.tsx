/**
 * The page.
 *
 * A server component: the hero figures come from the eval report at build time
 * rather than from a fetch, so the numbers are in the first byte of HTML. Only
 * the console, the eval badge and the corpus count are client islands, because
 * only they need to talk to a running system.
 *
 * Two surfaces with two jobs. Everything here is a document, written for
 * someone deciding whether to get in touch. The console inside the systems
 * section is an instrument, and it keeps its own denser visual language.
 */

import { FileCheck2, Link2, Ruler, ShieldAlert } from "lucide-react";

import report from "@/public/eval-report.json";
import { AnswerText } from "@/components/AnswerText";
import { CitationList } from "@/components/CitationList";
import { EvalMetrics, EvalTargetNote, type EvalReport } from "@/components/EvalMetrics";
import { InspectorDrawer } from "@/components/InspectorDrawer";
import { FeatureRow } from "@/components/site/FeatureRow";
import { Hero } from "@/components/site/Hero";
import { HowItsBuilt } from "@/components/site/HowItsBuilt";
import { Resume } from "@/components/site/Resume";
import { Contact, SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { Systems } from "@/components/site/Systems";
import { TechStack } from "@/components/site/TechStack";
import { WhatIDo } from "@/components/site/WhatIDo";
import { ANSWER_SAMPLE, ISO_RETRIEVAL, REFUSAL_TRACE } from "@/components/site/fixtures";
import {
  GROUNDING_FLOOR,
  IN_CORPUS_MEAN,
  OFF_CORPUS_MEAN,
  SEPARATION,
} from "@/components/site/site-data";

const evalReport = report as EvalReport;

const belowTarget = evalReport.metrics.filter((metric) => metric.score < 0.9).length;

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div id="top">
          <Hero report={evalReport} />
        </div>

        <WhatIDo />
        <Systems />

        <FeatureRow
          eyebrow="Guardrails"
          icon={ShieldAlert}
          title="Bad input never reaches the model"
          veiled
          visual={<InspectorDrawer trace={REFUSAL_TRACE} />}
          visualNote="A real refusal, captured. Read the last two figures: no model was called, so it cost nothing."
        >
          <p>
            The checks that catch prompt injection are patterns, not a classifier call. That is the
            point. A filter that has to ask a model whether something is an injection can itself be
            talked out of the answer.
          </p>
          <p>
            Credentials are found and replaced before the request leaves the process, so an API key
            pasted into the box never reaches a third party. Across the test set, 18 adversarial
            inputs are refused and 14 benign questions that resemble them are let through, which is
            the number that makes the first one mean anything.
          </p>
        </FeatureRow>

        <FeatureRow
          eyebrow="Grounding"
          icon={Ruler}
          title="The similarity floor was calibrated, and you can see both sides of it"
          reverse
          visual={<CitationList data={ISO_RETRIEVAL} floor={GROUNDING_FLOOR} />}
          visualNote="Six passages cleared the floor and reached the model. Three did not, and they are still on screen."
        >
          <p>
            Questions the corpus can answer score {IN_CORPUS_MEAN.toFixed(3)} on average at rank
            one. Questions it cannot score {OFF_CORPUS_MEAN.toFixed(3)}. That gap of{" "}
            {SEPARATION.toFixed(3)} is where the floor belongs, and{" "}
            {GROUNDING_FLOOR.toFixed(2)} sits inside it.
          </p>
          <p>
            The first value I tried was 0.70, which sounded prudent and refused almost every
            question the system could actually answer. Sweeping the test set turned a guess into a
            measurement. When nothing clears the floor the system says so and skips the model call
            entirely, which is cheaper and more honest than a hedged paragraph.
          </p>
        </FeatureRow>

        <FeatureRow
          eyebrow="Citations"
          icon={Link2}
          title="Every citation links to the passage it came from"
          veiled
          visual={
            <div className="bg-inset border-rule border p-4">
              <p className="text-ink text-[13.5px] leading-[1.7]">
                <AnswerText text={ANSWER_SAMPLE.text} knownRefs={ANSWER_SAMPLE.knownRefs} />
              </p>
            </div>
          }
          visualNote="In the live console the blue handles scroll the evidence pane to the passage and open it."
        >
          <p>
            Once the answer is written, every source it cites is checked against what retrieval
            actually returned. A handle that was never retrieved gets marked in the sentence that
            used it, rather than logged somewhere nobody looks.
          </p>
          <p>
            That is the third citation above. The model reached for a comparison it had not been
            given, and the interface says so in the place where the claim is made.
          </p>
        </FeatureRow>

        <FeatureRow
          eyebrow="Evals"
          icon={FileCheck2}
          title="The suite has a before, which is the only reason the after means anything"
          reverse
          visual={
            <div className="p-1">
              <EvalMetrics metrics={evalReport.metrics} size="md" />
              <EvalTargetNote className="border-rule mt-4 border-t pt-3" />
            </div>
          }
          visualNote={`Last run on ${evalReport.model}, ${evalReport.tier} tier. ${belowTarget} of ${evalReport.metrics.length} metrics sit under target.`}
        >
          <p>
            The first run scored 85.6%. Three defects it found were mine, and each one was a
            different kind of wrong: the floor was set to a number I had guessed, the router sent
            datasheet questions to the telemetry agent because they contain metric words, and one
            document held a third of the index so broad questions returned five passages from it
            and nothing else.
          </p>
          <p>
            Two failures turned out to be the test&rsquo;s fault rather than the system&rsquo;s,
            which is the more useful thing to find. The two judged rows are the least reliable here
            and are best read as a prompt to go and look at the answer yourself.
          </p>
        </FeatureRow>

        <HowItsBuilt />
        <TechStack />
        <Resume />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
