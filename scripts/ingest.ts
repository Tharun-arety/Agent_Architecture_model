/**
 * Corpus ingest: fetch -> extract -> chunk -> embed -> upsert.
 *
 *   npm run ingest -- --dry-run     fetch and report, write nothing
 *   npm run ingest                  the real thing
 *
 * The sources are real public web pages, which means this is the "messy
 * real-world documents" path rather than a tidy fixture load. Three things
 * follow from that, and all three are handled loudly rather than silently:
 *
 *   1. A source can be unreachable. That is recorded and skipped — one dead URL
 *      must not cost the other ten.
 *   2. A source can return a page whose readable body is a cookie banner. The
 *      dry run prints extracted character counts per source so a collapse is
 *      visible before anything is embedded.
 *   3. A source can change underneath the eval golden set. The SHA-256 of each
 *      fetched document is stored and compared on re-ingest, so drift is
 *      reported instead of quietly re-embedding different claims.
 */

import "./lib/env";

import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "../lib/config";
import { getSql, toVectorLiteral } from "../lib/db/client";
import { embed } from "../lib/ai/openai";
import { chunkText, htmlToText } from "./lib/extract";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCES_PATH = join(HERE, "sources.json");
const SNAPSHOT_PATH = join(HERE, "..", "evals", "corpus-snapshot.json");
const SCHEMA_PATH = join(HERE, "..", "lib", "db", "schema.sql");

const USER_AGENT =
  "magnotherm-agentic-poc/0.1 (portfolio project; contact via repository)";

type Source = {
  sourceRef: string;
  url: string;
  title: string;
  docType: string;
  note?: string;
};

type Fetched = { source: Source; text: string; sha256: string };

type Report = {
  sourceRef: string;
  url: string;
  status: "ok" | "fetch_failed" | "too_short" | "drifted";
  httpStatus?: number;
  chars?: number;
  chunks?: number;
  sha256?: string;
  previousSha256?: string;
  detail?: string;
};

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

// A page whose readable body comes back under this is a consent wall or a
// JavaScript shell, not a document. Embedding it would poison retrieval with a
// high-scoring chunk that says nothing.
const MIN_DOCUMENT_CHARS = 400;

async function loadSources(): Promise<Source[]> {
  const raw = JSON.parse(await readFile(SOURCES_PATH, "utf8")) as { sources: Source[] };
  return raw.sources;
}

async function loadSnapshot(): Promise<Record<string, string>> {
  try {
    const raw = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8")) as {
      documents: Record<string, string>;
    };
    return raw.documents ?? {};
  } catch {
    return {};
  }
}

async function fetchSource(source: Source): Promise<Fetched | Report> {
  try {
    const response = await fetch(source.url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      return {
        sourceRef: source.sourceRef,
        url: source.url,
        status: "fetch_failed",
        httpStatus: response.status,
        detail: response.statusText,
      };
    }
    const html = await response.text();
    const text = htmlToText(html);
    const sha256 = createHash("sha256").update(text).digest("hex");

    if (text.length < MIN_DOCUMENT_CHARS) {
      return {
        sourceRef: source.sourceRef,
        url: source.url,
        status: "too_short",
        chars: text.length,
        detail: `readable body under ${MIN_DOCUMENT_CHARS} chars — probably a consent wall or a client-rendered shell`,
      };
    }
    return { source, text, sha256 };
  } catch (cause) {
    return {
      sourceRef: source.sourceRef,
      url: source.url,
      status: "fetch_failed",
      detail: cause instanceof Error ? cause.message : String(cause),
    };
  }
}

async function main(): Promise<number> {
  const sources = await loadSources();
  const previous = await loadSnapshot();

  console.log(
    `\nIngesting ${sources.length} sources${dryRun ? "  [DRY RUN — nothing is written]" : ""}\n`,
  );

  // Sequential on purpose. Eleven public pages fetched in parallel from one IP
  // reads like a scraper; one at a time reads like a reader.
  const fetched: Fetched[] = [];
  const reports: Report[] = [];

  for (const source of sources) {
    const result = await fetchSource(source);
    if ("status" in result) {
      reports.push(result);
      console.log(`  ✗ ${source.sourceRef.padEnd(14)} ${result.status}  ${result.detail ?? ""}`);
      continue;
    }

    const before = previous[source.sourceRef];
    const drifted = Boolean(before) && before !== result.sha256;
    const chunks = chunkText(result.text);

    reports.push({
      sourceRef: source.sourceRef,
      url: source.url,
      status: drifted ? "drifted" : "ok",
      chars: result.text.length,
      chunks: chunks.length,
      sha256: result.sha256,
      previousSha256: before,
    });
    fetched.push(result);

    const flag = drifted ? "~" : "✓";
    console.log(
      `  ${flag} ${source.sourceRef.padEnd(14)} ${String(result.text.length).padStart(6)} chars  ` +
        `${String(chunks.length).padStart(3)} chunks  ${result.sha256.slice(0, 12)}` +
        (drifted ? `  DRIFTED from ${before.slice(0, 12)}` : ""),
    );
  }

  const drifted = reports.filter((r) => r.status === "drifted");
  const failed = reports.filter((r) => r.status !== "ok" && r.status !== "drifted");

  console.log(
    `\n  ${fetched.length}/${sources.length} sources usable` +
      (failed.length ? `, ${failed.length} unusable` : "") +
      (drifted.length ? `, ${drifted.length} drifted` : ""),
  );

  if (drifted.length && !dryRun && !force) {
    console.error(
      `\n  Refusing to re-ingest: ${drifted.length} source(s) changed upstream since the\n` +
        "  snapshot was taken. The eval golden set is written against the previous\n" +
        "  content, so re-embedding now would move the target without saying so.\n" +
        "  Review the diff, then re-run with --force to accept the new content and\n" +
        "  update the snapshot.\n",
    );
    return 1;
  }

  if (fetched.length === 0) {
    console.error("\n  No usable sources. Nothing to ingest.\n");
    return 1;
  }

  if (dryRun) {
    console.log("\n  Dry run: no embeddings requested, no rows written.\n");
    return failed.length === sources.length ? 1 : 0;
  }

  // --- Embed -------------------------------------------------------------
  const rows: {
    source: Source;
    chunk: { index: number; text: string; tokenEstimate: number };
    sha256: string;
  }[] = [];
  for (const item of fetched) {
    for (const chunk of chunkText(item.text)) {
      rows.push({ source: item.source, chunk, sha256: item.sha256 });
    }
  }

  console.log(`\n  Embedding ${rows.length} chunks with ${config.embeddingModel}…`);
  const vectors: number[][] = [];
  const BATCH = 64;
  let embeddingTokens = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { vectors: batchVectors, usage } = await embed(batch.map((r) => r.chunk.text));
    vectors.push(...batchVectors);
    embeddingTokens += usage.inputTokens;
    process.stdout.write(`\r  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log(`\r  ${rows.length}/${rows.length} embedded  (${embeddingTokens} tokens)`);

  // --- Write -------------------------------------------------------------
  const sql = getSql();
  const schema = await readFile(SCHEMA_PATH, "utf8");
  for (const statement of schema.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
    await sql.query(statement);
  }

  const refs = fetched.map((f) => f.source.sourceRef);
  await sql.query("DELETE FROM knowledge_chunk WHERE source_ref = ANY($1)", [refs]);

  const fetchedAt = new Date().toISOString();
  for (let i = 0; i < rows.length; i++) {
    const { source, chunk, sha256 } = rows[i];
    await sql.query(
      `INSERT INTO knowledge_chunk
         (source_ref, source_url, doc_title, doc_type, chunk_index, text,
          token_estimate, embedding, content_sha256, fetched_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::vector,$9,$10)`,
      [
        source.sourceRef,
        source.url,
        source.title,
        source.docType,
        chunk.index,
        chunk.text,
        chunk.tokenEstimate,
        toVectorLiteral(vectors[i]),
        sha256,
        fetchedAt,
      ],
    );
  }

  // Built after the rows land: IVFFlat picks its lists from the data present at
  // build time, so an index created on an empty table is a slow sequential scan
  // wearing an index's name.
  const lists = Math.max(1, Math.min(100, Math.floor(Math.sqrt(rows.length))));
  await sql.query("DROP INDEX IF EXISTS knowledge_chunk_embedding_idx");
  await sql.query(
    `CREATE INDEX knowledge_chunk_embedding_idx ON knowledge_chunk
       USING ivfflat (embedding vector_cosine_ops) WITH (lists = ${lists})`,
  );

  await mkdir(dirname(SNAPSHOT_PATH), { recursive: true });
  await writeFile(
    SNAPSHOT_PATH,
    JSON.stringify(
      {
        $comment:
          "SHA-256 of each source document's extracted text at ingest time. The " +
          "ingest refuses to re-embed drifted content without --force, because " +
          "the eval golden set is written against these exact documents.",
        ingestedAt: fetchedAt,
        embeddingModel: config.embeddingModel,
        chunkCount: rows.length,
        documents: Object.fromEntries(fetched.map((f) => [f.source.sourceRef, f.sha256])),
        unusable: failed.map((r) => ({ sourceRef: r.sourceRef, status: r.status, detail: r.detail })),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  console.log(
    `\n  Wrote ${rows.length} chunks from ${fetched.length} documents.` +
      `\n  Snapshot: evals/corpus-snapshot.json\n`,
  );
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("\nIngest failed:", error);
    process.exit(1);
  });
