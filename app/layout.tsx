import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

/**
 * Two families, each with one job.
 *
 * Space Grotesk carries the chrome: legends, headings, prose. Its clipped
 * terminals and squared bowls read as drawn rather than typeset, which suits a
 * faceplate. JetBrains Mono carries everything that is a measurement — scores,
 * limits, source handles, tool arguments — because those are read in columns
 * and compared, and proportional digits make that harder than it needs to be.
 *
 * Self-hosted through next/font: no third-party request on load, and no layout
 * shift when the faces arrive.
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
  title: "Magnetocaloric Engineering Agent — guardrails & evals",
  description:
    "Two agents over magnetocaloric cooling data — retrieval from real public documents and " +
    "queries over synthetic test-rig telemetry — behind an input, argument and grounding " +
    "guardrail pipeline, with every verdict, tool call and token cost on show.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
