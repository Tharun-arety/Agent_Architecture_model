/**
 * Text on one side, a working piece of the system on the other.
 *
 * The visual slot holds a real component fed from `fixtures.ts` rather than a
 * screenshot, so a reader sees the thing itself and it cannot go stale when the
 * interface changes.
 */

import type { LucideIcon } from "lucide-react";

export function FeatureRow({
  eyebrow,
  icon: Icon,
  title,
  children,
  visual,
  visualNote,
  reverse = false,
  veiled = false,
}: {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  visual: React.ReactNode;
  /** One line under the frame, for anything the visual cannot say itself. */
  visualNote?: string;
  reverse?: boolean;
  veiled?: boolean;
}) {
  return (
    <section className={veiled ? "bg-veil" : ""}>
      <div className="shell grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className={reverse ? "lg:order-2" : ""}>
          <span className="eyebrow">{eyebrow}</span>
          <h3 className="display-sm text-ink mt-5 flex items-start gap-3">
            <Icon className="text-cold mt-1 size-6 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{title}</span>
          </h3>
          <div className="lede mt-4 space-y-4">{children}</div>
        </div>

        <div className={`min-w-0 ${reverse ? "lg:order-1" : ""}`}>
          <div className="frame p-3">{visual}</div>
          {visualNote && (
            <p className="text-faint mt-3 text-[11px] leading-relaxed">{visualNote}</p>
          )}
        </div>
      </div>
    </section>
  );
}
