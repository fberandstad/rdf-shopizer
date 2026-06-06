# AGENTS — ShopiClaw

Roster and responsibilities of the embedded agent (OpenClaw-modeled).

## ShopiClaw (primary)
- **Role:** conversational commerce assistant + merchant copilot.
- **Channels:** WebChat (primary, via CopilotKit). MCP exposes read/safe tools to other agents.
- **Loop:** assemble context (history + RAG + memory + twin-knowledge) → OpenAI tool-calling
  → ClawBands policy/approval → execute → stream. Serialized per session; max 12 tool iterations.
- **Tools:** see `TOOLS.md`. Commerce tools are deterministic services; the agent orchestrates.
- **Memory:** `MEMORY.md` (curated) + pgvector semantic memory (`agent_memory`).
- **Guardrails:** money-path tools are guarded (HITL via ClawBands); secrets via Aquaman only;
  PII minimized in prompts/memory; instruction/data separation against prompt injection.

## Heartbeat (proactive)
- Cron-scheduled checks (low-stock now; abandoned-cart/briefings in later waves).
- Cheap deterministic checks first; escalate to OpenAI only on significant change.
