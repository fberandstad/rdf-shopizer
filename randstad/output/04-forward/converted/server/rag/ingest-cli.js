// CLI to (re)build RAG indexes. Requires OPENAI_API_KEY + a running Postgres.
// Usage: node rag/ingest-cli.js [catalog|twin|all]
const { ingestCatalog, ingestTwinKnowledge } = require('./ingest');
const config = require('./../config');

async function main() {
  const scope = process.argv[2] || 'all';
  if (!config.openai.apiKey) {
    console.error('OPENAI_API_KEY not set — cannot embed.'); process.exit(1);
  }
  if (scope === 'catalog' || scope === 'all') await ingestCatalog();
  if (scope === 'twin' || scope === 'all') await ingestTwinKnowledge(config.rag.twinRoot);
  console.log('[rag] ingest complete:', scope);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
