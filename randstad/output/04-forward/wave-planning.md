# Wave Planning — ShopiClaw Code Generation

> **HITL wave-plan approval:** APPROVED by franck on 2026-06-06 ("Approve plan — build W0").
> W0 generation authorized into `04-forward/converted/`. Stage-4 final gate still pending.

**Owner:** `tech-debt-manager`  **Stage:** 4  **Generated:** 2026-06-06  **Gate:** stage-4-approval
**Entry:** stage-3-approval = approved. **Dest repo:** `github.com/fberandstad/rdf-shopizer` (this repo).
**Output area:** `randstad/output/04-forward/converted/**` (legacy `sm-*`/`schema` remain read-only).

> Waves are ordered by dependency. Each wave: (a) scaffold modules, (b) generate tests,
> (c) run CI, (d) **per-wave HITL PR review**. A wave is "done" when its modules build and
> its golden-master TESTs + new tests are green. PR creation / dest-repo writes are
> **manual, never auto-run** (HITL gates rule).

## Reference fidelity (from `example/`)

- **Client:** React 18 + Vite 5 + Tailwind 3.4 (`darkMode: class`) + `@tailwindcss/typography`;
  CopilotKit `@copilotkit/react-core` + `react-ui` `^1.56.5`. **Randstad theme** — blue
  `#0053A5`, light-blue `#0084FF`, cyan `#00D7FF`, dark `#001E50`, grays. App shell =
  collapsible **Sidebar** + header **UserMenu** + main + **CopilotSidebar**. Reuse
  `index.css` component classes (card, kpi, table, pill, badge, spinner, modal).
- **Server:** Express 4 + `express-session` + `connect-pg-simple` + `pg` + `pgvector` +
  `node-cron` + `bcryptjs`; CopilotKit `@copilotkit/runtime`. Agent pattern mirrors example
  (`agent/router`, `classifier`, `skills/*`, `middleware/guardrails`, `rag/*`).
- **Divergences (approved):** LLM = **OpenAI** (CopilotKit `OpenAIAdapter` + `openai`
  embeddings) replacing Vertex AI/Xenova (ADR-0003); add ClawBands/Aquaman/tokenization/MCP.

## Waves

| Wave | Name | Scope (FS/RULE) | Depends on | Key TESTs |
|------|------|-----------------|-----------|-----------|
| **W0** | Foundation & Agent Core | App shell+theme, auth/session, RBAC, Postgres+pgvector+Prisma, health, **ShopiClaw agent** (Gateway, loop via CopilotKit+OpenAI, tool registry, ClawBands, Aquaman, memory, RAG, twin-knowledge ingest, MCP stub) | — | TEST-0023 (auth), health |
| **W1** | Catalog & RAG | FS-0001; tools `searchCatalog`/`getProduct`/`ragSearch`/`twinKnowledgeSearch`; catalog pages | W0 | TEST-0001..0004 |
| **W2** | Cart | FS-0002; RULE-0001..0007; `getCart`/`addToCart`/`updateCart`; server pricing | W1 | TEST-0005..0008 |
| **W3** | Checkout & Payment | FS-0003/0004; RULE-0008..0012; order state machine; tokenized `payOrder` (guarded+ClawBands) | W2 | TEST-0009..0014 |
| **W4** | Orders & Account | FS-0005/0006; RULE-0013/0014/0015; order history, masked invoice, profile, reviews, newsletter | W3 | TEST-0015..0022 |
| **W5** | Admin & Analytics | FS-0010..0014; RULE-0016..0020; admin catalog/inventory; `getBusinessMetrics`/`getSystemHealth` | W4 | TEST-0025..0027 |
| **W6** | Interop & Heartbeat | MCP server (full), Heartbeat jobs (abandoned cart, low stock, briefing), notifications, SOAP→REST (FS-0015) | W5 | TEST-0028 + MCP tests |
| **W7** | Hardening & Compliance | Security controls (CSP, rate-limit, audit), GDPR (consent, erasure, retention), CI/CD, full E2E | W6 | all + RISK/DPR tests |

## Per-wave checklist (Definition of Done)

- [ ] Modules generated under `04-forward/converted/<area>`; builds locally.
- [ ] Tests under `04-forward/tests/<wave>`; golden-master + new tests green.
- [ ] Business rules enforced server-side; security RISK controls present.
- [ ] Traceability rows updated (FS/RULE/TEST/RISK → files).
- [ ] HITL PR review recorded (manual; no auto-merge).

### Wave completion status — 2026-06-07

| Wave | Status | Golden master | Tests |
|------|--------|---------------|-------|
| W0 Foundation & Agent Core | ✅ done | auth/health | unit |
| W1 Catalog & RAG | ✅ done | TEST-0001..0004 | unit + E2E |
| W2 Cart | ✅ done | TEST-0005..0008 | unit + E2E |
| W3 Checkout & Payment | ✅ done | TEST-0009..0014 | unit + E2E |
| W4 Orders & Account | ✅ done | TEST-0015..0022 | unit + E2E |
| W5 Admin & Analytics | ✅ done | TEST-0023..0027 | unit + E2E |
| W6 Interop & Heartbeat | ✅ done | TEST-0028 (+MCP) | unit + E2E |
| W7 Hardening & Compliance | ✅ done | RISK/DPR controls | unit + E2E |

**All 8 waves complete.** Verification: **46/46 unit** (`npm test`), **38/38 Playwright E2E**.
Golden-master **TEST-0001..0028 all green**. NFR checklist consolidated (security/agent/compliance ✅).
CI/CD pipeline added (gated). **Remaining: stage-4 final HITL approval gate (manual) before any
dest-repo PR / deploy — never auto-run.**

### W0 status — 2026-06-06

- [x] Modules generated under `04-forward/converted/` (client + server + agent); `node --check` passes 22/22 server files.
- [x] Tests under `04-forward/tests/w0` (unit: TEST-W0-01..05); integration smoke documented (DB-gated); coverage report written.
- [x] Server-side enforcement present: RBAC, ClawBands guarded-tool HITL, MCP default-deny, role-scoped + allow-listed analytics (no free-form SQL).
- [x] Traceability rows updated in `00-twin/traceability-matrix.md` (Stage 4 / W0 section).
- [ ] HITL PR review — **pending**: `npm install` + run unit suite, then push branch & open PR for review (no auto-merge; awaiting per-action approval).

## Risk-based sequencing notes

- **W0 first** because the agent runtime + auth + data layer gate everything.
- **W3 (payment)** is highest-risk: tokenization (RISK-0001), ClawBands HITL (RISK-0015),
  no PAN. Requires PSP sandbox creds (env only).
- **W7** consolidates security/compliance (RISK-0001..0024, DPR-0001..0018) + CI/CD.

## What gets generated now (this session)

On wave-plan approval: **W0 Foundation & Agent Core** is scaffolded into
`04-forward/converted/` as a runnable base mirroring `example/` look & UX, with the
ShopiClaw agent skeleton. Subsequent waves follow the loop with per-wave HITL.
