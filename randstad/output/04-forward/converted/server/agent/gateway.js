// Agent Gateway — wires the ShopiClaw agent to CopilotKit using the OpenAI adapter (ADR-0003).
//
// Tool execution is NOT registered here. CopilotKit's OpenAIAdapter advertises tools to
// the LLM but does not run backend `CopilotRuntime` action handlers — it emits each tool
// call to the client for execution. So the React client registers the agent's tools as
// frontend actions (see client `useShopiClawActions`) that proxy to `POST /api/agent/tool`,
// where the real handlers run through ClawBands (audit + guarded-tool HITL approval).
// This gateway only provides the LLM connection (runtime + OpenAI adapter + HTTP endpoint).

// Disable CopilotKit telemetry BEFORE the runtime loads: this version's telemetry client
// throws (`lambdaClient.send is not a function`) on an async tick and would crash the
// process. We also avoid phoning home with usage data (privacy). Must precede the require.
process.env.COPILOTKIT_TELEMETRY_DISABLED = process.env.COPILOTKIT_TELEMETRY_DISABLED || 'true';
process.env.DO_NOT_TRACK = process.env.DO_NOT_TRACK || '1';

const {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNodeHttpEndpoint,
} = require('@copilotkit/runtime');
const OpenAI = require('openai');
const config = require('./../config');

function createCopilotHandler() {
  const openai = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : new OpenAI({ apiKey: 'sk-missing' });
  const serviceAdapter = new OpenAIAdapter({ openai, model: config.openai.model });

  return (req, res, next) => {
    const runtime = new CopilotRuntime();
    const handler = copilotRuntimeNodeHttpEndpoint({
      endpoint: '/api/copilotkit',
      runtime,
      serviceAdapter,
    });
    // This is mounted via app.use('/api/copilotkit', …), which strips the mount
    // prefix from req.url (leaving '/'). The CopilotKit/yoga handler matches the
    // request path against the configured `endpoint`, so it must see the FULL path
    // — otherwise both the GET runtime-info handshake and the POST chat call 404
    // and the chat input never enables. Restore the original URL before delegating.
    req.url = req.originalUrl;
    return handler(req, res, next);
  };
}

module.exports = { createCopilotHandler };
