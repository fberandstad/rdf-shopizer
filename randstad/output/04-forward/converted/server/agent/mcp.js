// MCP server (ADR-0013, RISK-0022/0023). Exposes read/safe ShopiClaw tools + twin-knowledge
// resources to external agents over a minimal JSON-RPC endpoint.
// - Guarded/money-path tools are NOT exposed (default-deny).
// - Per-client bearer auth + per-client allow-list.
// - Every call is audited (tool_audit with channel='mcp').
const { byName, MCP_SAFE } = require('./tools');
const { enforce, audit } = require('./clawbands');
const config = require('./../config');

const SERVER_INFO = { name: 'shopiclaw-mcp', version: '1.0.0' };
const PROTOCOL_VERSION = '2024-11-05';

// Read-only knowledge resources exposed to external agents (ADR-0011/0013). Content is
// served via the twinKnowledgeSearch tool; these are stable, citable entry points.
const RESOURCES = [
  { uri: 'twin://knowledge/architecture', name: 'Target architecture', mimeType: 'text/markdown',
    description: 'ShopiClaw target architecture, ADRs and component design.' },
  { uri: 'twin://knowledge/business-rules', name: 'Business rules', mimeType: 'text/markdown',
    description: 'Catalog/cart/checkout/admin business rules (RULE-####).' },
  { uri: 'twin://knowledge/functional-specs', name: 'Functional specifications', mimeType: 'text/markdown',
    description: 'Functional specifications (FS-####) reverse-engineered from the legacy app.' },
];

// Minimal zod->JSON-Schema for tool input advertisement (MCP tools/list inputSchema).
function zodToJsonSchema(schema) {
  const shape = schema?._def?.shape ? schema._def.shape() : (schema?.shape || null);
  if (!shape) return { type: 'object' };
  const properties = {}; const required = [];
  for (const [key, def] of Object.entries(shape)) {
    let inner = def; let optional = false;
    while (inner?._def?.typeName === 'ZodOptional' || inner?._def?.typeName === 'ZodDefault') {
      optional = inner._def.typeName === 'ZodOptional' || optional;
      inner = inner._def.innerType;
    }
    const tn = inner?._def?.typeName;
    const type = tn === 'ZodNumber' ? 'number' : tn === 'ZodBoolean' ? 'boolean'
      : tn === 'ZodEnum' ? 'string' : tn === 'ZodObject' ? 'object' : 'string';
    properties[key] = { type };
    if (tn === 'ZodEnum' && Array.isArray(inner._def.values)) properties[key].enum = inner._def.values;
    if (!optional) required.push(key);
  }
  return { type: 'object', properties, required };
}

function authenticate(req) {
  const hdr = req.headers['authorization'] || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return null;
  const entry = Object.entries(config.mcp.clientTokens).find(([, t]) => t === token);
  return entry ? entry[0] : null; // returns clientId
}

// JSON-RPC-ish handler: { method: 'tools/list' | 'tools/call', params }
async function handle(req, res) {
  if (!config.mcp.enabled) return res.status(404).json({ error: 'mcp disabled' });
  const clientId = authenticate(req);
  if (!clientId) return res.status(401).json({ error: 'invalid mcp client token' });

  const { method, params = {} } = req.body || {};

  // Lifecycle
  if (method === 'initialize') {
    return res.json({
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: SERVER_INFO,
      capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
    });
  }
  if (method === 'ping') return res.json({ ok: true });

  if (method === 'tools/list') {
    return res.json({
      tools: MCP_SAFE.map(n => ({
        name: n,
        description: byName[n]?.description || '',
        inputSchema: byName[n] ? zodToJsonSchema(byName[n].parameters) : { type: 'object' },
      })),
    });
  }

  if (method === 'resources/list') {
    return res.json({ resources: RESOURCES });
  }

  if (method === 'resources/read') {
    const uri = params.uri;
    const resource = RESOURCES.find(r => r.uri === uri);
    if (!resource) return res.status(404).json({ error: `resource '${uri}' not found` });
    let text = `${resource.name} — ${resource.description}`;
    try {
      // Best-effort grounded content via twin-knowledge tool (degrades gracefully w/o OpenAI).
      const r = await byName.twinKnowledgeSearch.handler({ question: resource.name });
      if (r?.passages?.length) text = r.passages.map(p => p.content).join('\n\n');
    } catch (_) { /* embeddings unavailable — return descriptor text */ }
    await audit({ actor: clientId, channel: 'mcp', tool: 'resources/read', sensitivity: 'read',
      approved: true, outcome: 'ok', detail: { uri } });
    return res.json({ contents: [{ uri, mimeType: resource.mimeType, text }] });
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params;
    if (!MCP_SAFE.includes(name)) {
      await audit({ actor: clientId, channel: 'mcp', tool: name, sensitivity: 'guarded',
        approved: false, outcome: 'denied', detail: { reason: 'not in MCP allow-list' } });
      return res.status(403).json({ error: `tool '${name}' not exposed over MCP` });
    }
    const tool = byName[name];
    try {
      const parsed = tool.parameters.parse(args);
      const ctx = { actor: clientId, channel: 'mcp', role: 'customer' }; // external = least privilege
      const result = await enforce(ctx, tool, parsed, tool.handler);
      return res.json({ result });
    } catch (e) {
      return res.status(400).json({ error: e.message, code: e.code });
    }
  }

  return res.status(400).json({ error: 'unknown method' });
}

module.exports = { handle };
