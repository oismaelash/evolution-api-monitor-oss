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

ARG BULL_BOARD_SECRET
ENV BULL_BOARD_SECRET=$BULL_BOARD_SECRET
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG ENCRYPTION_KEY
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
ARG MONITOR_STATUS_API_KEY
ENV MONITOR_STATUS_API_KEY=$MONITOR_STATUS_API_KEY
ARG MONITOR_STATUS_BASE_URL
ENV MONITOR_STATUS_BASE_URL=$MONITOR_STATUS_BASE_URL
ARG MONITOR_STATUS_TEMPLATE_ID
ENV MONITOR_STATUS_TEMPLATE_ID=$MONITOR_STATUS_TEMPLATE_ID
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
ARG OPEN_SOURCE_REPO_URL
ENV OPEN_SOURCE_REPO_URL=$OPEN_SOURCE_REPO_URL
ARG PING_TIMEOUT_MS
ENV PING_TIMEOUT_MS=$PING_TIMEOUT_MS
ARG POSTGRES_DB
ENV POSTGRES_DB=$POSTGRES_DB
ARG POSTGRES_PASSWORD
ENV POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ARG POSTGRES_USER
ENV POSTGRES_USER=$POSTGRES_USER
ARG REDIS_URL
ENV REDIS_URL=$REDIS_URL
ARG RESTART_TIMEOUT_MS
ENV RESTART_TIMEOUT_MS=$RESTART_TIMEOUT_MS

RUN npm run build

# --- Unified Production Image ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app ./

RUN chown -R node:node /app
USER node
EXPOSE 3000

CMD ["npm", "run", "start"]
