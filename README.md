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

Requires Docker and Docker Compose v2. The repo is bind-mounted into the container; `node_modules` stays from the image so you do not need `npm install` on the host.

```bash
# build + start (foreground logs)
npm run dev:docker

# or
docker compose -f docker-compose.dev.yml up --build
```

Then open [http://localhost:3000](http://localhost:3000). Edit files under `apps/api` (and shared roots)—Next.js will reload.

`WATCHPACK_POLLING` and `CHOKIDAR_USEPOLLING` are enabled for reliable file watching on Docker Desktop / some WSL setups. If changes still do not reload, try `docker compose -f docker-compose.dev.yml up --build` after dependency changes (rebuild the image).

## Structure

- `apps/api` — Next.js 14 (App Router): public marketing site and future API/dashboard
- `docs/` — product and API reference documents

## Domains (product)

- Open source / marketing: [evolutionapi.online](https://evolutionapi.online)
- Cloud: [cloud.evolutionapi.online](https://cloud.evolutionapi.online)
