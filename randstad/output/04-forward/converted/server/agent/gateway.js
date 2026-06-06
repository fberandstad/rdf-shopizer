// Agent Gateway — wires the ShopiClaw agent to CopilotKit using the OpenAI adapter (ADR-0003).
// Read/safe tools are registered as CopilotKit actions; every call runs through ClawBands
// (audit + guarded-tool approval). Guarded tools surface an APPROVAL_REQUIRED signal.

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
const { z } = require('zod');
const config = require('./../config');
const { tools } = require('./tools');
const { enforce } = require('./clawbands');

// Map a Zod object schema to CopilotKit action parameters (best-effort, primitives).
function zodToParams(schema) {
  const shape = schema?._def?.shape ? schema._def.shape() : {};
  return Object.entries(shape).map(([name, def]) => {
    const typeName = def?._def?.typeName || '';
    const type = typeName === 'ZodNumber' ? 'number'
      : typeName === 'ZodBoolean' ? 'boolean' : 'string';
    return {
      name,
      type,
      description: name,
      required: !def.isOptional?.(),
    };
  });
}

function buildActions(getCtx) {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: zodToParams(tool.parameters),
    handler: async (args) => {
      const ctx = getCtx();
      const parsed = tool.parameters.parse(args || {});
      try {
        return await enforce(ctx, tool, parsed, tool.handler);
      } catch (e) {
        if (e.code === 'APPROVAL_REQUIRED') {
          return { status: 'approval_required', approvalId: e.approvalId,
            message: `This action needs human approval (id ${e.approvalId}).` };
        }
        return { status: 'error', message: e.message };
      }
    },
  }));
}

function createCopilotHandler() {
  const openai = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : new OpenAI({ apiKey: 'sk-missing' });
  const serviceAdapter = new OpenAIAdapter({ openai, model: config.openai.model });

  return (req, res, next) => {
    // Per-request context (actor/role/channel) for ClawBands + role-scoped tools.
    const ctx = {
      actor: req.user ? String(req.user.id) : 'anonymous',
      role: req.user?.role || 'customer',
      channel: 'webchat',
      sessionKey: req.sessionID || null,
    };
    const runtime = new CopilotRuntime({ actions: buildActions(() => ctx) });
    const handler = copilotRuntimeNodeHttpEndpoint({
      endpoint: '/api/copilotkit',
      runtime,
      serviceAdapter,
    });
    return handler(req, res, next);
  };
}

module.exports = { createCopilotHandler };
