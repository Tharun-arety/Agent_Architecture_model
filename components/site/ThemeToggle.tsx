"use client";

/**
 * Light and dark.
 *
 * The theme lives on `<html data-theme>`, set before first paint by the inline
 * script in `layout.tsx`, which is what stops a dark page flashing white on the
 * way in. The choice is stored so it survives a reload.
 *
 * That attribute is the source of truth rather than a copy of it held in React
 * state, so this subscribes to it with `useSyncExternalStore` and a
 * MutationObserver. Mirroring it into state would mean two places that can
 * disagree, and the server snapshot would have to guess.
 */

import * as React from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const readTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

/** What the server rendered. The inline script may well have chosen light by
 *  the time this hydrates, which is why the button renders both icons and lets
 *  CSS pick. */
const serverTheme = (): Theme => "dark";

export function ThemeToggle() {
  const theme = React.useSyncExternalStore(subscribe, readTheme, serverTheme);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode, or storage disabled. The theme still applies to this page
      // view, it just will not be remembered.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="border-rule text-dim hover:text-ink hover:border-rule-strong flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors"
    >
      {/* Both icons are in the markup and CSS hides one, so the control is
          correct on the first paint rather than after hydration. */}
      <Sun className="dark-only size-4" aria-hidden="true" />
      <Moon className="light-only size-4" aria-hidden="true" />
    </button>
  );
}
