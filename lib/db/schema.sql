-- Magnotherm agentic PoC — schema.
--
-- Two concerns share one database because they share one question: "what does
-- the evidence actually say?". The knowledge side answers it from documents,
-- the telemetry side from measurements, and the agent has to be able to reach
-- both without a second connection.
--
-- Apply with:  npm run db:push

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Knowledge corpus (RAG)
-- ---------------------------------------------------------------------------
-- One row per chunk, not per document. Provenance is carried on the chunk
-- rather than on a parent document row: a citation has to name the URL it came
-- from, and a join to find that out is a join that can be forgotten.
--
-- `content_sha256` is the hash of the *whole source document* at fetch time.
-- The eval golden set is written against specific documents, so an upstream
-- edit that silently changes what "the AMR geometry ECO" says would invalidate
-- the expected answers. Storing the hash lets the ingest script say so out loud
-- instead of quietly re-embedding different text.

CREATE TABLE IF NOT EXISTS knowledge_chunk (
    id              BIGSERIAL PRIMARY KEY,
    source_ref      TEXT        NOT NULL,   -- short citable handle, e.g. 'MT-TECH'
    source_url      TEXT        NOT NULL,
    doc_title       TEXT        NOT NULL,
    doc_type        TEXT        NOT NULL,   -- 'technology' | 'patent_abstract' | ...
    chunk_index     INTEGER     NOT NULL,
    text            TEXT        NOT NULL,
    token_estimate  INTEGER     NOT NULL,
    embedding       vector(1536),
    content_sha256  TEXT        NOT NULL,
    fetched_at      TIMESTAMPTZ NOT NULL,
    UNIQUE (source_ref, chunk_index)
);

-- IVFFlat needs a populated table to build meaningful lists, so it is created
-- by the ingest script after the rows land, not here. See scripts/ingest.ts.
CREATE INDEX IF NOT EXISTS knowledge_chunk_source_idx
    ON knowledge_chunk (source_ref);

-- ---------------------------------------------------------------------------
-- Test-rig telemetry (synthetic)
-- ---------------------------------------------------------------------------
-- The data is generated, and the UI says so. What is *not* pretend is the
-- shape: a rig registry the argument guardrail can check `rig_id` against, and
-- readings carrying the acceptance limit that was applied at the time.

CREATE TABLE IF NOT EXISTS rig (
    rig_id       TEXT PRIMARY KEY,           -- 'rig_1'
    label        TEXT NOT NULL,              -- 'POLARIS 100W bench'
    product_line TEXT NOT NULL,
    location     TEXT NOT NULL,
    commissioned DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS rig_reading (
    id            BIGSERIAL PRIMARY KEY,
    rig_id        TEXT        NOT NULL REFERENCES rig (rig_id) ON DELETE CASCADE,
    recorded_at   TIMESTAMPTZ NOT NULL,
    metric        TEXT        NOT NULL,
    value         DOUBLE PRECISION NOT NULL,
    unit          TEXT        NOT NULL,
    -- Stored, not recomputed. A reading was judged against the limit in force
    -- on the day it was taken; deriving the verdict at query time would let a
    -- later change to the limit silently rewrite last year's pass/fail record.
    limit_low     DOUBLE PRECISION,
    limit_high    DOUBLE PRECISION,
    within_limits BOOLEAN     NOT NULL
);

CREATE INDEX IF NOT EXISTS rig_reading_lookup_idx
    ON rig_reading (rig_id, metric, recorded_at);
