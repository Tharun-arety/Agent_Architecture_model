import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magnetocaloric Engineering Agent — guardrails & evals",
  description:
    "Two agents over magnetocaloric cooling data — retrieval from real public documents and " +
    "queries over synthetic test-rig telemetry — behind an input, argument and grounding " +
    "guardrail pipeline, with every verdict, tool call and token cost on show.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
