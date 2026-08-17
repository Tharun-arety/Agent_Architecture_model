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
 * `color-scheme: dark` is what stops the browser rendering native scrollbars
 * and form controls light against a dark page. `themeColor` matches the ground
 * so mobile browser chrome does not sit as a pale band above it.
 */
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b1015",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
