// OpenAI embeddings (ADR-0003) — replaces the example's Xenova local embedder.
const OpenAI = require('openai');
const config = require('./../config');

const client = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : null;

// text-embedding-3-large supports a 1536 dimension projection (matches schema vector(1536)).
async function embed(text) {
  if (!client) {
    // Deterministic fallback so the app boots without a key (dev only).
    return new Array(1536).fill(0);
  }
  const res = await client.embeddings.create({
    model: config.openai.embeddingModel,
    input: text,
    dimensions: 1536,
  });
  return res.data[0].embedding;
}

module.exports = { embed };
