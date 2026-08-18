"use client";

/**
 * Header, contact and footer.
 *
 * The header is fixed, which is the one place `backdrop-blur` is cheap enough
 * to use, and it is why every section carries `scroll-margin-top` in
 * `globals.css`. Without that, clicking a nav link lands with the heading
 * hidden behind this bar.
 */

import Link from "next/link";
import { Mail } from "lucide-react";

import { GithubMark } from "@/components/site/GithubMark";

import { EvalBadge } from "@/components/EvalBadge";
import { Monogram } from "@/components/site/Monogram";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { REPO_URL } from "@/components/site/system-entries";
import { EMAIL } from "@/components/site/site-data";

const NAV = [
  { href: "/#approach", label: "Approach" },
  { href: "/projects", label: "Projects" },
  { href: "/#stack", label: "Stack" },
  { href: "/#resume", label: "Background" },
];

export function SiteHeader() {
  return (
    <header className="border-rule bg-ground/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="shell flex h-16 items-center gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Monogram />
          <span className="min-w-0">
            <span className="text-ink block truncate text-[13px] leading-tight font-medium">
              Tharun Arety
            </span>
            <span className="text-faint block truncate text-[10px] leading-tight">
              AI-Leveraged Systems Architect
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-dim hover:text-ink text-[12px] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="hidden sm:block">
            <EvalBadge />
          </div>
          <ThemeToggle />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source on GitHub"
            className="border-rule text-dim hover:text-ink flex size-9 items-center justify-center rounded-full border transition-colors"
          >
            <GithubMark className="size-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

export function Contact() {
  return (
    <section id="contact" className="bg-veil">
      <div className="shell py-16 lg:py-24">
        <span className="eyebrow">Contact</span>
        <h2 className="display-sm text-ink mt-5 max-w-[22ch]">
          If people in your company keep asking for something a system already knows, write to me
        </h2>
        <p className="lede mt-4">
          Tell me which manual process costs the most time, or which question keeps needing three
          systems to answer. That is usually enough for me to say whether an agent is the right
          tool and what building it would involve.
        </p>

        <a
          href={`mailto:${EMAIL}`}
          className="text-cold hover:text-ink mt-8 inline-flex items-center gap-3 text-[19px] transition-colors lg:text-[24px]"
        >
          <Mail className="size-5 shrink-0" aria-hidden="true" />
          {EMAIL}
        </a>

        <p className="text-faint mt-6 text-[12px]">Augsburg, Germany · Open to relocation</p>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-rule border-t">
      <div className="shell flex flex-wrap items-start justify-between gap-6 py-10">
        <div className="max-w-[52ch]">
          <p className="text-faint text-[11px] leading-relaxed">
            The document corpus is real public web pages, fetched at seed time and cited with links
            back to the original. The rig telemetry is synthetic, generated for the demonstration,
            and is not any company&rsquo;s production data.
          </p>
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-dim hover:text-ink inline-flex items-center gap-1.5 text-[12px] transition-colors"
        >
          <GithubMark className="size-3.5" />
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
