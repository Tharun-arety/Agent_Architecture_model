/**
 * The mark: initials in a rounded square.
 *
 * Deliberately plain. A personal site does not need a logo, and an abstract
 * glyph on one would read as a product. Initials are unambiguous at 20px, work
 * as a favicon, and carry no claim.
 *
 * Drawn rather than set in text so it stays square regardless of the loaded
 * face, and so it can be reused for an icon file later.
 */

export function Monogram({ className = "size-8" }: { className?: string }) {
  return (
    <span
      className={`${className} border-rule bg-raised text-ink flex shrink-0 items-center justify-center rounded-lg border font-semibold tracking-tight select-none`}
      style={{ fontSize: "0.6875em" }}
      aria-hidden="true"
    >
      TA
    </span>
  );
}
