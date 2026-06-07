# ShopiClaw — Infrastructure as Code

Artifacts to build, run, and deploy ShopiClaw. Maps to `03-target/target-architecture.md §3`
(containerized, horizontally scalable) and the Wave 7 NFR/security controls.

> **HITL / safety:** these are *artifacts only*. Per `rules/hitl-gates.md`, no deploy, image
> push, or dest-repo PR is performed automatically. Production actions require explicit human
> approval. Never commit real secrets (`rules/data-redaction.md`, DPR-0004).

## Layout

| Path | Purpose |
|------|---------|
| `../Dockerfile` | Multi-stage prod image (non-root, tini, healthcheck, NODE_ENV=production) |
| `../.dockerignore` | Keeps build context small + secret-free |
| `../docker-compose.yml` | Local/one-box stack: pgvector + app (runs out of the box) |
| `k8s/namespace.yaml` | `shopiclaw` namespace |
| `k8s/configmap.yaml` | Non-secret runtime config |
| `k8s/secret.example.yaml` | Secret **template** — replace with sealed/external secret |
| `k8s/postgres.yaml` | Postgres 16 + pgvector StatefulSet + headless Service |
| `k8s/deployment.yaml` | App Deployment (2 replicas) + Service + HPA (CPU 70%, 2→8) |
| `k8s/ingress.yaml` | TLS-only ingress + HSTS (RISK-0010, DPR-0001) |
| `k8s/seed-job.yaml` | One-shot sample-data seed (optional) |
| `k8s/kustomization.yaml` | Aggregates the manifests |

## Local (Docker Compose)

```bash
# from converted/
cp .env.example .env            # set OPENAI_API_KEY, SESSION_SECRET, etc.
docker compose up --build
# app:  http://localhost:14000
# db:   localhost:15432 (pgvector/pg16)
```
Migrations run on boot. To seed demo data + default admin:
```bash
docker compose exec shopiclaw node seed.js
```

## Kubernetes

```bash
# 1) Create the real secret out-of-band (do NOT use the template values):
kubectl create namespace shopiclaw
kubectl -n shopiclaw create secret generic shopiclaw-secrets \
  --from-literal=SESSION_SECRET="$(openssl rand -hex 24)" \
  --from-literal=PG_PASSWORD="$(openssl rand -hex 16)" \
  --from-literal=CONFIG_ENC_KEY="$(openssl rand -hex 24)" \
  --from-literal=OPENAI_API_KEY="sk-..." \
  --from-literal=PSP_API_KEY="" \
  --from-literal=MCP_CLIENT_TOKENS='{}'

# 2) Apply manifests (excluding the secret template):
kubectl apply -f k8s/namespace.yaml -f k8s/configmap.yaml \
  -f k8s/postgres.yaml -f k8s/deployment.yaml -f k8s/ingress.yaml

# 3) (optional) seed sample data
kubectl -n shopiclaw apply -f k8s/seed-job.yaml
```

Health/readiness probes hit `/api/ops/health` (liveness) and `/api/ops/ready` (readiness).

## Image build & publish (gated)

```bash
docker build -t ghcr.io/fberandstad/rdf-shopizer:v1.0.0 .
# Publishing + deploying is a gated, human-approved action (see CI: ../.github/workflows/ci.yml).
```

## Production notes / roadmap

- **DB:** prefer a managed Postgres with pgvector + encryption at rest (DPR-0002); point
  `PG_HOST`/secret at it and drop the StatefulSet.
- **Secrets:** integrate the Aquaman broker / external secret manager (DPR-0004); replace the
  Secret template with SealedSecrets or External Secrets Operator.
- **Sessions/scale:** sessions are Postgres-backed today; Redis is the roadmap option for
  cache/rate-limit/heartbeat locks at higher scale (DEBT-0019).
- **TLS:** ingress assumes cert-manager + nginx; adjust to your platform (HSTS is also set by
  the app in production via `middleware/security.js`).
- **Image:** pin by digest in `kustomization.yaml` for reproducible deploys.
