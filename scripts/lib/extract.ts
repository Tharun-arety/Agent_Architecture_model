/**
 * HTML -> readable text, and text -> chunks.
 *
 * Hand-rolled rather than pulling in a readability library. Two reasons: the
 * corpus is eleven known pages rather than the open web, and the failure mode
 * of a black-box extractor — quietly returning a navigation menu as the
 * document body — is exactly the kind of thing this project is meant to catch
 * rather than inherit. Everything here is inspectable in a dry run.
 */

const BLOCK_TAGS = /<\/(p|div|section|article|h[1-6]|li|tr|blockquote|br)\s*>/gi;

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&deg;": "°",
  "&euro;": "€",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
};

export function htmlToText(html: string): string {
  let text = html;

  // Order matters: strip the containers whose *content* is not prose before
  // touching the tags, or their innards survive as loose text.
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<(script|style|noscript|svg|iframe|form)\b[\s\S]*?<\/\1>/gi, " ");
  text = text.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, " ");

  // Keep block boundaries as newlines so sentences from separate paragraphs do
  // not fuse into one run and get chunked as a single thought.
  text = text.replace(BLOCK_TAGS, "\n");
  text = text.replace(/<[^>]+>/g, " ");

  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  for (const [entity, char] of Object.entries(ENTITIES)) {
    text = text.split(entity).join(char);
  }

  return text
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** Rough token count. Good enough to size chunks; not used for billing. */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export type Chunk = { index: number; text: string; tokenEstimate: number };

/**
 * Split on paragraph boundaries, packing up to `maxChars` and carrying
 * `overlapChars` of the previous chunk forward.
 *
 * The overlap is not decoration. A claim whose subject is named in one
 * paragraph and quantified in the next is unretrievable if the split lands
 * between them, and that is the exact shape of most engineering prose:
 * "the transfer medium is a water-ethanol mixture. It circulates below 1 bar."
 */
export function chunkText(text: string, maxChars = 1200, overlapChars = 180): Chunk[] {
  const paragraphs = text.split(/\n{2,}|\n(?=[A-Z0-9])/).map((p) => p.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let buffer = "";

  const flush = () => {
    const body = buffer.trim();
    if (body.length < 40) return; // a stray heading is not a retrievable claim
    chunks.push({ index: chunks.length, text: body, tokenEstimate: estimateTokens(body) });
  };

  for (const paragraph of paragraphs) {
    if (buffer && buffer.length + paragraph.length + 1 > maxChars) {
      flush();
      buffer = buffer.slice(-overlapChars);
      // Resume at a word boundary; a chunk starting mid-word embeds badly.
      const space = buffer.indexOf(" ");
      buffer = space === -1 ? "" : buffer.slice(space + 1);
    }
    buffer = buffer ? `${buffer}\n${paragraph}` : paragraph;
  }
  flush();

  return chunks;
}
