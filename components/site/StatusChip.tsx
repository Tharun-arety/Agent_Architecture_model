/**
 * Live, prototype or in progress.
 *
 * Shared so the grid, the case study header and the main page cannot drift into
 * describing the same project three different ways. A live system gets the
 * verified colour and a filled dot; everything else stays neutral, because
 * "prototype" is a fact rather than a warning.
 */

import type { ProjectStatus } from "@/components/site/system-entries";

const LABEL: Record<ProjectStatus, string> = {
  prototype: "Prototype",
  live: "Live",
  "in-progress": "In progress",
};

export function StatusChip({
  status,
  className = "",
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const live = status === "live";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase ${
        live ? "border-cold/50 text-cold" : "border-rule text-faint"
      } ${className}`}
    >
      <span
        className={`size-1.5 rounded-full ${live ? "bg-cold" : "border-faint border"}`}
        aria-hidden="true"
      />
      {LABEL[status]}
    </span>
  );
}
