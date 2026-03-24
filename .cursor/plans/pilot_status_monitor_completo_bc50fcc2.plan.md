---
name: Evolution API Monitor completo
overview: "Construir o restante do Evolution API Monitor conforme o PRD em docs/evolution-api-monitor.md: packages (Prisma, shared, config), worker BullMQ, API de domínio, dashboard autenticado, alertas, billing opcional e DevOps. A landing pública em apps/api (grupo (marketing), componentes hero/features/OSS vs cloud/footer) já está pronta — o escopo abaixo começa pela fundação do monorepo e não inclui refazer marketing."
todos:
  - id: landing-marketing
    content: Landing page marketing em apps/api (route (marketing), layout, hero, features, OSS vs cloud, header/footer)
    status: completed
  - id: foundation-monorepo
    content: Criar packages/config, shared, database; validação env; tooling TS/ESLint/Vitest
    status: completed
  - id: prisma-schema
    content: Schema Prisma completo + migrations + criptografia de secrets + ownership nas queries
    status: completed
  - id: nextauth-dashboard-shell
    content: NextAuth + middleware + layout dashboard + padrão handler→service (convive com (marketing))
    status: completed
  - id: api-projects-numbers
    content: Serviços e rotas REST projects/config/numbers/sync/restart com paginação
    status: completed
  - id: evolution-client
    content: EvolutionClient + ErrorType + testes com mock HTTP
    status: completed
  - id: worker-bullmq
    content: "apps/worker: filas, locks Redis, jobs health/restart/alert, state machine, logs JSON"
    status: completed
  - id: alert-providers
    content: Monitor (WhatsApp), email, webhook + cooldown Redis + templates (flags cloud)
    status: completed
  - id: frontend-product
    content: "Dashboard app: projects, numbers, logs, uptime (UI produto — distinta da landing já feita)"
    status: completed
  - id: billing-cloud
    content: PaymentProvider Stripe/Pague + webhooks + UI billing quando CLOUD_BILLING
    status: completed
  - id: devops-ci
    content: Docker Compose, CI, documentação de setup e deploy
    status: completed
isProject: false
---

# Plano: sistema Evolution API Monitor (MVP + evolução)

## O que já está pronto

- **Landing / marketing** em [apps/api](apps/api): `app/(marketing)/`, layout, componentes (`marketing-hero`, `marketing-features`, `marketing-oss-vs-cloud`, `marketing-header`, `marketing-footer`), stack Next.js 14 + Tailwind. Tráfego público e CTAs permanecem aqui; o produto autenticado será outro grupo de rotas, p.ex. `app/(dashboard)/`, sem duplicar o trabalho visual da landing.

## Estado atual vs. alvo


| Área        | Hoje                                 | Alvo (fonte de verdade)                                                                                                       |
| ----------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Marketing   | Landing implementada                 | Manter e evoluir links/CTA quando existir signup real                                                                         |
| Monorepo    | Só [apps/api](apps/api) no workspace | `apps/worker`, [packages/database](packages/database), [packages/shared](packages/shared), [packages/config](packages/config) |
| App produto | Não existe                           | Dashboard autenticado + `/api/`* (seção 6 do [docs/evolution-api-monitor.md](docs/evolution-api-monitor.md))                  |
| Dados       | Nenhum                               | Prisma + PostgreSQL (schema seção 4 do doc)                                                                                   |
| Jobs        | Nenhum                               | BullMQ + Redis locks (seções 3–5)                                                                                             |


Toda a modelagem de produto, endpoints, worker, billing e roadmap continua em [docs/evolution-api-monitor.md](docs/evolution-api-monitor.md). Regras do projeto: `.cursor/rules/000-project-overview.mdc` (services, `userId` só da session, Evolution só no servidor, logs JSON, `ErrorType`, lock Redis em estado de Number).

---

## Arquitetura alvo (visão)

```mermaid
flowchart LR
  subgraph clients [Clients]
    Browser[Browser]
  end
  subgraph next [apps/api]
    Landing[Landing marketing]
    Dash[Dashboard UI]
    API[Route handlers]
    Auth[NextAuth]
  end
  subgraph worker [apps/worker]
    HC[health-check]
    RS[restart]
    AL[alert]
  end
  subgraph data [Data layer]
    PG[(PostgreSQL)]
    Redis[(Redis)]
  end
  subgraph external [External]
    Evo[Evolution API]
    PS[Monitor (WhatsApp) API]
    Stripe[Stripe]
    Pague[Pague.dev]
  end
  Browser --> Landing
  Browser --> Dash
  Browser --> API
  API --> Auth
  API --> PG
  API --> Redis
  worker --> PG
  worker --> Redis
  HC --> Evo
  AL --> PS
  API --> Stripe
  API --> Pague
```



---

## Fase 0 — Fundação do monorepo e tooling

- Criar workspaces faltantes: `packages/config` (tsconfig/eslint base), `packages/shared` (tipos, `AppError`, DTOs, retry ADR-005), `packages/database` (Prisma).
- Validação de env em runtime: `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, etc. (`.cursor/rules/001-typescript.mdc`).
- ESLint/Prettier/tsconfig via `packages/config`; scripts raiz `build` / `lint` / `test` incluindo workspaces novos **e** `apps/api` existente.
- Vitest + factories (`.cursor/rules/007-testing.mdc`).

**Entregável:** workspaces resolvem; `prisma validate` passa; `apps/api` continua buildando com a landing.

---

## Fase 1 — Banco de dados e criptografia

- Schema em `packages/database/prisma/schema.prisma` conforme doc (User, Project, ProjectConfig, Number, HealthCheck, Alert, Log, Subscription, NextAuth).
- Criptografia de segredos na camada de serviço ([005-database-prisma](.cursor/rules/005-database-prisma.mdc)).
- Migração inicial + seed opcional.
- Queries sempre com ownership correto.

**Entregável:** `migrate dev` ok; client usado por `api` e `worker`.

---

## Fase 2 — Autenticação e shell do produto (Next.js)

- NextAuth + `app/api/auth/[...nextauth]/route.ts`; providers conforme PRD.
- Middleware: rotas públicas incluem a **landing** `(marketing)`; rotas `(dashboard)` protegidas.
- Handlers finos: auth → parse → **service** → JSON ([nextjs-monitor-api skill](.cursor/skills/nextjs-monitor-api/SKILL.md)).
- Layout dashboard: sidebar, tokens seção 7 do doc — **novo layout**, reutilizando apenas tokens/componentes compartilhados se fizer sentido (não misturar hero da landing no app logado).

**Entregável:** login + `/dashboard` vazio autenticado; `/` continua sendo a landing.

---

## Fase 3 — Domínio Projects / Numbers (API + serviços)

- Tabela **6.2** do doc: CRUD projetos, config, numbers, sync, restart, paginação `{ data, meta }`.
- `userId` apenas da session.

**Entregável:** API testável; contrato para o frontend do produto.

---

## Fase 4 — Cliente Evolution e classificação de erros

- `EvolutionClient`: apikey, URL encode, health duplo, timeouts ([evolution-api-integration skill](.cursor/skills/evolution-api-integration/SKILL.md)).
- Enum `ErrorType` mapeado nas respostas.

**Entregável:** sync + health testáveis com mock HTTP.

---

## Fase 5 — Worker BullMQ, locks e máquina de estados

- `apps/worker`: filas health-check, restart, alert, sync; locks Redis; jobs e state machine seção 3.4 ([worker-bullmq-redis skill](.cursor/skills/worker-bullmq-redis/SKILL.md)); logs JSON; Bull Board opcional ([006-bullmq-redis](.cursor/rules/006-bullmq-redis.mdc)).

**Entregável:** fluxo local health → restart → alert (providers mock).

---

## Fase 6 — Alert providers e Monitor (WhatsApp)

- `AlertProvider` em `packages/shared`; Monitor (WhatsApp), email, webhook; cooldown Redis; templates se `CLOUD_ADVANCED_ALERTS` ([monitor-status-api skill](.cursor/skills/monitor-status-api/SKILL.md)).

**Entregável:** alerta e2e em staging.

---

## Fase 7 — Observabilidade e frontend do produto

- Endpoints de health-checks, logs, uptime, alerts (seção 6.2).
- UI: `/dashboard`, `/projects`, `/projects/[id]`, `/numbers/[id]`, `/logs` — **área logada**, não confundir com a landing.

**Entregável:** onboarding completo pela UI do produto.

---

## Fase 8 — Billing cloud (feature-flag)

- `CLOUD_BILLING`: Stripe + Pague.dev, webhooks, UI billing ([monitor-billing skill](.cursor/skills/monitor-billing/SKILL.md), [008-billing](.cursor/rules/008-billing.mdc)); OSS com `NoOpPaymentProvider`.

---

## Fase 9 — DevOps e qualidade

- Docker Compose, CI, docs de env; hardening de API.

---

## Pós-MVP

Conforme seções 10–11 do doc: API pública + webhooks outbound, equipe por projeto, integrações, escala, plataforma. Flags: `CLOUD_ADVANCED_ALERTS`, `CLOUD_EXPONENTIAL_RETRY`.

---

## Riscos e dependências

- Evolution v2.3 vs [postman collection](docs/Evolution%20API%20-%20v2.3.-.postman_collection.json).
- Monitor (WhatsApp): credenciais não-prod.
- Jobs ↔ DB: alterar `pingInterval` / `monitored` deve atualizar repeatable jobs.

---

## Documento mestre

[docs/evolution-api-monitor.md](docs/evolution-api-monitor.md); desvios documentados em `docs/` ou ADRs.