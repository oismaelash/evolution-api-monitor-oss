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
COPY packages/config/tsconfig.base.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/database/prisma ./packages/database/prisma
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/database/tsconfig.json ./packages/database/

# We also need src files for shared/database because postinstall builds them
COPY packages/shared/src ./packages/shared/src
COPY packages/database/src ./packages/database/src

# npm install (não npm ci): lockfile pode estar fora de sync com package.json dos workspaces
# --ignore-scripts: evita ETXTBSY no postinstall do esbuild (vitest) em overlay Docker.
# Reproduz o que o postinstall da raiz faria + postinstall do database (prisma generate).
# Retries/timeouts: registry pode falhar por rede lenta ou timeout no build remoto.
RUN npm config set fetch-retries 10 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && sh -c 'for i in 1 2 3; do npm install --ignore-scripts && exit 0; echo "npm install failed, retry $i/3 in 25s"; sleep 25; done; exit 1' \
    && npm run generate --workspace=@monitor/database \
    && npm run build --workspace=@monitor/shared \
    && npm run build --workspace=@monitor/database

FROM deps AS builder
WORKDIR /app
COPY . .

# Pass build args to Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# --- Unified Production Image ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/api/.next/standalone ./
COPY --from=builder /app/apps/api/.next/static ./apps/api/.next/static
COPY --from=builder /app/apps/api/public ./apps/api/public
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN npm prune --omit=dev

RUN chown -R node:node /app
USER node
EXPOSE 3000

CMD ["node", "apps/api/server.js"]
