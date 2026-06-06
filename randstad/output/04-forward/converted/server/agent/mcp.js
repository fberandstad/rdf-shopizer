// MCP server (ADR-0013, RISK-0022/0023). Exposes read/safe ShopiClaw tools + twin-knowledge
// resources to external agents over a minimal JSON-RPC endpoint.
// - Guarded/money-path tools are NOT exposed (default-deny).
// - Per-client bearer auth + per-client allow-list.
// - Every call is audited (tool_audit with channel='mcp').
const { byName, MCP_SAFE } = require('./tools');
const { enforce, audit } = require('./clawbands');
const config = require('./../config');

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

  if (method === 'tools/list') {
    return res.json({
      tools: MCP_SAFE.map(n => ({
        name: n,
        description: byName[n]?.description || '',
      })),
    });
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
