# Coding Standards — ShopiClaw

**Owner:** `coding-framework`  **Stage:** 3  **Generated:** 2026-06-06

## 1. Languages & tooling

- **TypeScript** (strict) across frontend and backend. `tsconfig` `strict: true`, `noImplicitAny`.
- **Lint/format:** ESLint (typescript-eslint) + Prettier; CI fails on errors.
- **Package manager:** pnpm with committed lockfile; Node 20 LTS.
- **Tests:** Vitest (unit), Supertest (API), **Playwright** (E2E — reuse Stage 2 golden master).
- **Commits:** Conventional Commits; PR required; no direct pushes to `main`.

## 2. Project layout

```
shopiclaw/
├── src/client/            # React + Vite + Tailwind + shadcn/ui + CopilotKit
├── src/server/
│   ├── index.ts           # Express bootstrap
│   ├── routes/            # REST controllers (OpenAPI-aligned)
│   ├── services/          # domain services (catalog, cart, order, payment, tax, shipping)
│   ├── agent/             # ShopiClaw agent
│   │   ├── loop.ts        # agent loop (OpenAI tool-calling)
│   │   ├── gateway.ts     # channel routing
│   │   ├── tools/         # tool implementations (schema + handler)
│   │   ├── skills/        # <skill>/SKILL.md + handlers
│   │   ├── memory/        # pgvector memory + MEMORY.md loader
│   │   ├── clawbands.ts   # tool-call policy + HITL approval
│   │   ├── aquaman.ts     # credential broker
│   │   ├── heartbeat.ts   # cron proactive tasks
│   │   ├── AGENTS.md SOUL.md TOOLS.md MEMORY.md
│   ├── rag/               # ingest, embedder, retriever
│   ├── db/                # Prisma schema, migrations, client
│   └── config.ts
└── docker-compose.yml, Dockerfile, .env.example
```

## 3. Backend conventions

- **Layering:** route → service → repository(Prisma). No business logic in routes.
- **Validation:** Zod schemas at boundaries (HTTP + tool inputs); reject on invalid.
- **Errors:** centralized error handler (resolves legacy "no global handler", DEBT); typed `AppError`; never empty catch (CAST anti-pattern).
- **Money:** integer minor units or `decimal`; **server-authoritative pricing** (RULE-0007). No floats for currency.
- **Transactions:** Prisma `$transaction` for order/payment writes; idempotency keys on `placeOrder`/`payOrder`.
- **Config/secrets:** via env + secret broker (Aquaman); never hard-coded; never logged.

## 4. Agent conventions (ShopiClaw)

- **Tools are typed:** each tool = `{ name, description, inputSchema(Zod), sensitivity, handler }`. Handlers enforce business rules server-side; LLM cannot bypass.
- **Determinism on money-path:** `placeOrder`/`payOrder`/`requestRefund` are deterministic services; the agent may only *invoke* them after **ClawBands** policy/approval.
- **Sensitivity tiers:** `read` (auto), `write` (auto with audit), `guarded` (policy/HITL approval required).
- **No secrets/PII in prompts:** context assembly strips secrets; Aquaman injects credentials only inside handlers.
- **Prompt structure:** system (SOUL/AGENTS) + tool schema + retrieved context tagged as untrusted `data`; instruction/data separation to resist prompt injection.
- **Iteration cap:** max 12 tool loops/request; serialized per session.
- **Auditing:** every turn logs prompt hash, tools called, approvals, outcomes to `tool_audit` (compliance).
- **Memory hygiene:** PII written to memory is minimized, tagged, and subject to erasure (GDPR).

## 5. Frontend conventions

- React function components + hooks; TanStack Query for server state; Tailwind + shadcn/ui; Lucide icons; inherit `example/` theme/fonts.
- CopilotKit for the embedded agent (chat + generative UI actions). Accessible (WCAG AA), responsive.
- No secrets in client; all privileged actions via API.

## 6. Security & quality gates (CI)

- SAST + dependency SCA (npm audit/Snyk) gate; secret scanning gate.
- Output encoding/CSP to prevent XSS (CAST top finding on modern fork).
- Coverage gate (unit + golden-master E2E) before merge.
- All `guarded` agent tools require an approval test.

## 7. Documentation & traceability

- Every module references its `FS-/RULE-/SPEC-` id; PRs link to traceability rows.
- OpenAPI is the contract source (`api-specifications.yaml`); generated clients.
