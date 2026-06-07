// RAG retriever over pgvector. Collections: 'catalog', 'twin_knowledge', 'policy'.
const pgvector = require('pgvector/pg');
const { pool } = require('./../db');
const { embed } = require('./embedder');

async function search(queryText, { collection = 'catalog', limit = 5 } = {}) {
  const vec = await embed(queryText);
  const { rows } = await pool.query(
    `SELECT id, collection, ref, content, metadata,
            1 - (embedding <=> $1) AS score
     FROM rag_document
     WHERE collection = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1
     LIMIT $3`,
    [pgvector.toSql(vec), collection, limit]
  );
  return rows;
}

module.exports = { search };
