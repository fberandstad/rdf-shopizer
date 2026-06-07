// PostgreSQL connection pool + pgvector registration.
const { Pool } = require('pg');
const pgvector = require('pgvector/pg');
const config = require('./config');

const pool = new Pool(config.pg);

pool.on('connect', async (client) => {
  try { await pgvector.registerType(client); } catch (_) { /* extension may not be ready yet */ }
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
