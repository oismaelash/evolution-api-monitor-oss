# evolution-api-monitor

SaaS + open-source platform to monitor WhatsApp instances connected via Evolution API (**Evolution API Monitor**).

## Requirements

- Node.js 18+
- npm

## Development

### Local (Node)

From the repository root:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the marketing landing (`apps/api`).

Other root scripts: `npm run build`, `npm run lint`, `npm run start`.

### Docker (hot reload)

Requires Docker and Docker Compose v2. The compose file starts **PostgreSQL**, **Redis**, and the **api** service. Create a `.env` from `.env.example` (at minimum `NEXTAUTH_SECRET` and `ENCRYPTION_KEY`; `DATABASE_URL` / `REDIS_URL` are overridden for in-network services). The repo is bind-mounted; `node_modules` comes from the image.

```bash
# build + start (foreground logs)
npm run dev:docker

# or
docker compose -f docker-compose.dev.yml up --build
```

Then open [http://localhost:3000](http://localhost:3000). Edit files under `apps/api` and packages—Next.js will reload.

`WATCHPACK_POLLING` and `CHOKIDAR_USEPOLLING` are enabled for reliable file watching on Docker Desktop / some WSL setups. If changes still do not reload, try `docker compose -f docker-compose.dev.yml up --build` after dependency changes (rebuild the image).

## Environment

Copy [`.env.example`](.env.example) to `.env` and set at least:

- `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET` (32+ chars), `ENCRYPTION_KEY` (64 hex chars, e.g. `openssl rand -hex 32`)

## Database

After dependencies are installed:

```bash
npm run db:migrate
# or: npm run migrate:dev --workspace=@monitor/database
```

Apply migrations in production with `prisma migrate deploy` from `packages/database`.

## Worker (BullMQ)

Health checks and alerts run in `apps/worker` (requires Redis + DB):

```bash
npm run dev:worker
```

## Structure

- `apps/api` — Next.js 14 (App Router): marketing, dashboard, REST API (`/api/*`)
- `apps/worker` — BullMQ workers (health-check, restart, alert)
- `packages/database` — Prisma schema and client
- `packages/shared` — DTOs, env validation, Evolution client, crypto
- `packages/config` — shared TypeScript / ESLint base
- `docs/` — product and API reference documents

## Domains (product)

- Open source / marketing: [evolutionapi.online](https://evolutionapi.online)
- Cloud: [cloud.evolutionapi.online](https://cloud.evolutionapi.online)
