// Digital Twin knowledge Q&A (ADR-0011). Returns grounded passages + citations.
const express = require('express');
const OpenAI = require('openai');
const { byName } = require('./../agent/tools');
const config = require('./../config');

const router = express.Router();
const client = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : null;

router.post('/search', async (req, res) => {
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: 'question required' });
  try {
    const { passages, citations } = await byName.twinKnowledgeSearch.handler({ question });
    // No grounded passages → return an explicit message instead of a blank card.
    // Most often this means the Digital Twin index is empty (run POST /api/rag/ingest
    // with scope "twin") or the question has no relevant match in the corpus.
    if (!passages.length) {
      return res.json({
        answer: 'No relevant information found in the Digital Twin for this question. '
          + 'The knowledge base covers ShopiClaw itself — its architecture, business rules, '
          + 'ADRs and legacy behavior — not the product catalog. '
          + 'If you expected an answer, an admin may need to (re)build the index.',
        citations: [],
      });
    }
    const citationList = citations.map(source => ({ source }));

    // The LLM MUST be polled with the retrieved Digital Twin passages to synthesize a
    // grounded answer. Without an OpenAI client we cannot synthesize — say so explicitly
    // rather than dumping raw passages that masquerade as an answer.
    if (!client) {
      return res.json({
        answer: 'AI answer synthesis is unavailable because the assistant is not configured '
          + '(no OPENAI_API_KEY). The relevant Digital Twin passages are listed under Sources.',
        citations: citationList,
        aiSynthesized: false,
      });
    }

    const context = passages.map(p => `[${p.source}] ${p.content}`).join('\n---\n');
    let answer;
    try {
      const completion = await client.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: 'Answer ONLY from the provided Digital Twin context. ' +
            'Cite sources by their bracketed path. If unknown, say so. Do not fabricate.' },
          { role: 'user', content: `Question: ${question}\n\nContext:\n${context}` },
        ],
      });
      answer = completion.choices?.[0]?.message?.content?.trim();
    } catch (e) {
      console.error('[knowledge] LLM completion failed:', e.message);
      return res.status(502).json({
        error: `AI synthesis failed: ${e.message}`,
        citations: citationList,
        aiSynthesized: false,
      });
    }
    if (!answer) {
      return res.status(502).json({
        error: 'The assistant returned an empty answer. Please try rephrasing your question.',
        citations: citationList,
        aiSynthesized: false,
      });
    }
    res.json({ answer, citations: citationList, aiSynthesized: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
