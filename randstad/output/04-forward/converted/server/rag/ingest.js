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

// Build a searchable text blob for a product (pure → unit-testable).
function productToText(p) {
  const price = ((p.price_cents || 0) / 100).toFixed(2);
  const attrs = p.attributes && typeof p.attributes === 'object'
    ? Object.entries(p.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')
    : '';
  return [
    `Product: ${p.name}`,
    `SKU: ${p.sku}`,
    p.category_name ? `Category: ${p.category_name}` : '',
    `Price: ${price} ${p.currency || 'EUR'}`,
    p.description ? `Description: ${p.description}` : '',
    attrs ? `Attributes: ${attrs}` : '',
  ].filter(Boolean).join('\n');
}

// Index all enabled products into the 'catalog' collection for ragSearch (FS-0001).
async function ingestCatalog() {
  const { rows } = await pool.query(
    `SELECT p.id, p.sku, p.name, p.description, p.price_cents, p.currency,
            p.attributes, c.name AS category_name
     FROM product p LEFT JOIN category c ON c.id = p.category_id
     WHERE p.enabled = true`);
  await pool.query(`DELETE FROM rag_document WHERE collection = 'catalog'`);
  for (const p of rows) {
    await ingestDocument({
      collection: 'catalog',
      ref: p.sku,
      content: productToText(p),
      metadata: { sku: p.sku, productId: p.id, source: `product:${p.sku}` },
    });
  }
  console.log(`[rag] ingested ${rows.length} catalog products`);
  return rows.length;
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

module.exports = { ingestDocument, ingestCatalog, ingestTwinKnowledge, productToText };
