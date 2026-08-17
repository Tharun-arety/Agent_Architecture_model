"use client";

/**
 * The inspect toggle.
 *
 * This was a 10px uppercase text button in the page header, which nobody
 * noticed, and it controls the single most interesting thing on the page: the
 * per-turn record of what every guardrail decided and what it cost. So it is a
 * real switch now, it says what it does underneath itself, and it sits on the
 * panel whose output it changes rather than in the chrome above.
 *
 * The track is 44x24 with the label inside the hit area, which clears the 44px
 * touch minimum without drawing a 44px-tall control.
 */

export function InspectSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group -my-2 flex cursor-pointer items-center gap-2.5 py-2 text-left"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
          checked ? "border-cold/60 bg-cold/20" : "border-rule bg-inset"
        }`}
      >
        <span
          className={`absolute size-3 rounded-full transition-transform duration-150 ease-out ${
            checked ? "bg-cold translate-x-[26px]" : "bg-faint translate-x-[6px]"
          }`}
        />
      </span>

      <span className="min-w-0">
        <span
          className={`block text-[13px] leading-tight transition-colors ${
            checked ? "text-ink" : "text-dim group-hover:text-ink"
          }`}
        >
          Inspect mode
        </span>
        <span className="text-faint block text-[10px] leading-tight">
          guardrail verdicts, tool calls, cost
        </span>
      </span>
    </button>
  );
}
