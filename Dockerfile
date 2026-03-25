# syntax=docker/dockerfile:1
# Multi-target production image: api | worker | migrate
# Build: docker build --target api -t monitor-api .
#        docker build --target worker -t monitor-worker .

FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/database/prisma ./packages/database/prisma

# npm install (não npm ci): lockfile pode estar fora de sync com package.json dos workspaces
RUN npm install

FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

# --- Next.js API (standalone) ---
FROM node:20-bookworm-slim AS api
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/api/.next/standalone ./
COPY --from=builder /app/apps/api/.next/static ./apps/api/.next/static
COPY --from=builder /app/apps/api/public ./apps/api/public

RUN chown -R node:node /app
USER node
EXPOSE 3000
# OAuth (Google/GitHub) and NextAuth: set at runtime via compose/K8s — GOOGLE_* / GITHUB_* / GITHUB_CLIENT_*,
# NEXTAUTH_URL, NEXTAUTH_SECRET (do not bake secrets into the image).
CMD ["node", "apps/api/server.js"]

# --- BullMQ worker ---
FROM node:20-bookworm-slim AS worker
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

RUN npm prune --omit=dev

RUN chown -R node:node /app
USER node
CMD ["node", "apps/worker/dist/index.js"]

# --- One-off Prisma migrations (same layers as builder; run manually / init job) ---
FROM builder AS migrate
WORKDIR /app
CMD ["npm", "run", "migrate:deploy", "--workspace=@monitor/database"]
