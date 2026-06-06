# Stage 1: Build React client
FROM node:20-alpine AS builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Production server
FROM node:20-slim
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev
COPY server/ .
COPY --from=builder /app/client/dist ./client-dist
ENV CLIENT_DIST=/app/client-dist
EXPOSE 4000
CMD ["node", "index.js"]
