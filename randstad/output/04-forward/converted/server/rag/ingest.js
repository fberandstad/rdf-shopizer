// RAG ingest. Includes embedding of the Digital Twin knowledge (ADR-0011).
// Redaction (DPR-0009) is applied before any content is embedded/indexed.
const fs = require('fs');
const path = require('path');
const pgvector = require('pgvector/pg');
const { pool } = require('./../db');
const { embed } = require('./embedder');
const { redact } = require('./../agent/aquaman');

function chunk(text, size = 1200, overlap = 150) {
  const out = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    out.push(text.slice(i, i + size));
  }
  return out;
}

async function ingestDocument({ collection, ref, content, metadata = {} }) {
  const safe = redact(content);
  for (const piece of chunk(safe)) {
    const vec = await embed(piece);
    await pool.query(
      `INSERT INTO rag_document (collection, ref, content, metadata, embedding)
       VALUES ($1,$2,$3,$4,$5)`,
      [collection, ref, piece, metadata, pgvector.toSql(vec)]
    );
  }
}

// Ingest the Twin knowledge corpus (00-twin / 02-reverse / 03-target) for twinKnowledgeSearch.
async function ingestTwinKnowledge(twinRoot) {
  const roots = ['00-twin', '02-reverse', '03-target'].map(d => path.join(twinRoot, d));
  let count = 0;
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const file of walk(root)) {
      if (!/\.(md|ya?ml)$/i.test(file)) continue;
      const content = fs.readFileSync(file, 'utf8');
      await ingestDocument({
        collection: 'twin_knowledge',
        ref: path.relative(twinRoot, file),
        content,
        metadata: { source: path.relative(twinRoot, file) },
      });
      count++;
    }
  }
  console.log(`[rag] ingested ${count} twin-knowledge documents`);
  return count;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

module.exports = { ingestDocument, ingestTwinKnowledge };
