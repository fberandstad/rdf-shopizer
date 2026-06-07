// Semantic memory over pgvector (ADR-0008). Replaces OpenClaw's SQLite vector store.
// PII written to memory is tagged for GDPR lifecycle (DPR-0010) and erasure (DPR-0006).
const pgvector = require('pgvector/pg');
const { pool } = require('./../db');
const { embed } = require('./../rag/embedder');
const { redact } = require('./aquaman');

async function remember(userId, content, { pii = false } = {}) {
  const safe = redact(content);
  const vec = await embed(safe);
  await pool.query(
    `INSERT INTO agent_memory (user_id, content, pii, embedding) VALUES ($1,$2,$3,$4)`,
    [userId || null, safe, pii, pgvector.toSql(vec)]
  );
}

async function recall(userId, queryText, limit = 5) {
  const vec = await embed(queryText);
  const { rows } = await pool.query(
    `SELECT content, 1 - (embedding <=> $1) AS score
     FROM agent_memory
     WHERE (user_id = $2 OR user_id IS NULL) AND embedding IS NOT NULL
     ORDER BY embedding <=> $1 LIMIT $3`,
    [pgvector.toSql(vec), userId || null, limit]
  );
  return rows;
}

// GDPR erasure: remove a user's semantic memory (DPR-0006 cascade target).
async function eraseUser(userId) {
  await pool.query('DELETE FROM agent_memory WHERE user_id=$1', [userId]);
}

module.exports = { remember, recall, eraseUser };
