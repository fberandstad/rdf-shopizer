# ShopiClaw — Agentic Commerce App

Modernized target for Shopizer v1.1.5 (Stage 4, Wave 0 — Foundation & Agent Core).
Built on the `example/` "cockpit" stack; **LLM provider: OpenAI** (ADR-0003).

> Scope of this wave (W0): runnable foundation — app shell + Randstad theme, auth/session,
> RBAC, PostgreSQL+pgvector schema, health/metrics, and the **ShopiClaw agent** skeleton
> (Gateway via CopilotKit, OpenAI tool-calling, ClawBands tool-approval, Aquaman credential
> broker, pgvector memory, RAG + embedded Digital-Twin knowledge, MCP server stub, Heartbeat).
> Later waves add catalog, cart, checkout/payment, orders, admin/analytics, interop, hardening.

## Stack

- **Client:** React 18 + Vite 5 + Tailwind 3.4 + CopilotKit (`@copilotkit/react-*` ^1.56.5).
- **Server:** Node 20 + Express 4 (CommonJS) + `pg` + `pgvector` + `express-session` +
  `connect-pg-simple` + `node-cron` + `@copilotkit/runtime` + `openai`.
- **DB:** PostgreSQL 16 + pgvector.

## Quick start

```bash
# 1) Start Postgres (pgvector)
docker compose up -d postgres

# 2) Server
cd server && npm install
cp ../.env.example ../.env   # set OPENAI_API_KEY
npm run dev                  # http://localhost:4000  (runs migrations on boot)

# 3) Client
cd client && npm install && npm run dev   # http://localhost:5173 (proxies /api,/auth)
```

Default admin: `admin@randstad.fr` / `admin123` (change via `.env`).

## Layout

```
converted/
├── client/   # React + Vite + Tailwind + CopilotKit (Randstad theme)
├── server/   # Express API + ShopiClaw agent (OpenAI)
│   ├── agent/   # gateway, tools, clawbands, aquaman, memory, mcp, heartbeat, *.md config
│   ├── rag/     # OpenAI embedder, retriever, twin-knowledge ingest
│   ├── routes/  # catalog, ops (health/metrics), knowledge
│   └── middleware/
├── docker-compose.yml, Dockerfile, .env.example
```

## Traceability

W0 implements foundation for FS-0001.. (see `randstad/output/04-forward/wave-planning.md`),
security controls RISK-0002/0010/0013/0014/0015/0016/0022/0024, ADR-0002/0003/0007/0008/0011/0012/0013.
