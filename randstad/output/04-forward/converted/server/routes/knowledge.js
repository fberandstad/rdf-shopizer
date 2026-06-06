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
    let answer = passages.map(p => p.content).join('\n\n').slice(0, 1500);
    if (client && passages.length) {
      const context = passages.map(p => `[${p.source}] ${p.content}`).join('\n---\n');
      const completion = await client.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: 'Answer ONLY from the provided Digital Twin context. ' +
            'Cite sources by their bracketed path. If unknown, say so. Do not fabricate.' },
          { role: 'user', content: `Question: ${question}\n\nContext:\n${context}` },
        ],
      });
      answer = completion.choices[0].message.content;
    }
    res.json({ answer, citations: citations.map(source => ({ source })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
