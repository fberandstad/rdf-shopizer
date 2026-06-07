# ShopiClaw production image (Wave 7 hardening). Multi-stage: build the SPA, then a slim
# runtime that serves the API + static client. Runs as non-root with tini as PID 1.
# Migrations run automatically on boot (server/index.js -> runMigrations).

# Stage 1: Build React client
FROM node:20-alpine AS builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Production server
FROM node:20-slim
ENV NODE_ENV=production
# tini = proper signal handling/zombie reaping for the Node PID 1.
RUN apt-get update && apt-get install -y --no-install-recommends tini curl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force
COPY server/ .
COPY --from=builder /app/client/dist ./client-dist
ENV CLIENT_DIST=/app/client-dist \
    PORT=4000
# Drop privileges (the node image ships an unprivileged 'node' user).
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:4000/api/ops/health || exit 1
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.js"]
