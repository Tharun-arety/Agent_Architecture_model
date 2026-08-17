/**
 * Background, on the page rather than only in a file.
 *
 * Someone who has just read the prototype section should not have to open a PDF
 * to find out who built it.
 *
 * The content below is a placeholder until the source document is supplied.
 * Nothing here is invented: `HAS_RESUME_PDF` stays false and the download stays
 * hidden until the real file is in `public/`, and the entries array is empty
 * rather than filled with plausible-looking history.
 */

import { Download } from "lucide-react";

import { EMAIL } from "@/components/site/site-data";

/** Flip to true once `public/tharun-arety-resume.pdf` exists. */
const HAS_RESUME_PDF = false;
const RESUME_PATH = "/tharun-arety-resume.pdf";
const RESUME_UPDATED = "";

type Entry = {
  period: string;
  role: string;
  organisation: string;
  lines: string[];
};

/** Populated from the source document. Empty until then. */
const ENTRIES: Entry[] = [];

const SKILLS: { group: string; items: string }[] = [];

export function Resume() {
  return (
    <section id="resume">
      <div className="shell py-16 lg:py-24">
        <span className="eyebrow">Background</span>
        <h2 className="display-sm text-ink mt-5 max-w-[24ch]">Where this comes from</h2>

        {ENTRIES.length === 0 ? (
          <p className="lede mt-4">
            Written up shortly. In the meantime the prototype above is the fullest account of how I
            work, and{" "}
            <a
              href={`mailto:${EMAIL}`}
              className="text-cold underline decoration-dotted underline-offset-4"
            >
              an email
            </a>{" "}
            gets you the rest.
          </p>
        ) : (
          <>
            <div className="mt-10 space-y-8">
              {ENTRIES.map((entry) => (
                <article
                  key={`${entry.period}-${entry.role}`}
                  className="border-rule grid gap-2 border-t pt-6 lg:grid-cols-[10rem_1fr] lg:gap-8"
                >
                  <p className="tnum text-faint font-mono text-[11px]">{entry.period}</p>
                  <div>
                    <h3 className="text-ink text-[15px] font-medium">{entry.role}</h3>
                    <p className="text-dim mt-0.5 text-[13px]">{entry.organisation}</p>
                    <ul className="mt-3 space-y-1.5">
                      {entry.lines.map((line) => (
                        <li key={line} className="text-dim text-[13.5px] leading-[1.7]">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>

            {SKILLS.length > 0 && (
              <dl className="border-rule mt-10 grid gap-x-8 gap-y-4 border-t pt-8 sm:grid-cols-2">
                {SKILLS.map((skill) => (
                  <div key={skill.group}>
                    <dt className="micro">{skill.group}</dt>
                    <dd className="text-dim mt-1 font-mono text-[12px] leading-relaxed">
                      {skill.items}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )}

        {HAS_RESUME_PDF && (
          <div className="mt-10">
            <a
              href={RESUME_PATH}
              download
              className="border-rule text-dim hover:text-ink hover:border-rule-strong inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[13px] transition-colors"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Download the résumé
            </a>
            {RESUME_UPDATED && (
              <p className="text-faint mt-2 text-[11px]">PDF, updated {RESUME_UPDATED}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
