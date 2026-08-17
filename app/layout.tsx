import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

/**
 * Two families, each with one job.
 *
 * Space Grotesk carries the chrome: headings, legends, prose. Its clipped
 * terminals and squared bowls read as drawn rather than typeset, which suits an
 * instrument. JetBrains Mono carries everything that is a measurement, because
 * scores, limits, source handles and tool arguments get read in columns and
 * compared, and proportional digits make that harder than it needs to be.
 *
 * Self-hosted through next/font, so there is no third-party request on load and
 * no layout shift when the faces arrive.
 */
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tharun Arety · AI-Leveraged Systems Architect",
  description:
    "I turn fragmented business data, documents, knowledge and workflows into " +
    "systems that AI agents can understand, operate and continuously improve. " +
    "Includes a working prototype you can query, with its guardrails and eval " +
    "scores on the page.",
  authors: [{ name: "Tharun Arety" }],
  openGraph: {
    type: "website",
    title: "Tharun Arety · AI-Leveraged Systems Architect",
    description:
      "A working agent prototype with its guardrail verdicts, retrieval scores " +
      "and offline eval results visible in the interface.",
    locale: "en_GB",
  },
};

/**
 * `themeColor` follows the system preference so mobile browser chrome matches
 * the ground rather than sitting as a pale band above it. `color-scheme` is set
 * per theme in `globals.css` instead of here, because the toggle can override
 * the system preference and this export is static.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1015" },
  ],
};

/**
 * Runs before the first paint, which is the only way to avoid a dark page
 * flashing white (or the reverse) while React boots. Kept to one expression and
 * wrapped in try/catch, since a thrown error here would block rendering.
 */
const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem("theme");
  var system = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.dataset.theme = stored === "light" || stored === "dark" ? stored : system;
} catch (e) {
  document.documentElement.dataset.theme = "dark";
}
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
