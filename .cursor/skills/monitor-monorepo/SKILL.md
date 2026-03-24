---
name: monitor-monorepo
description: >-
  Contexto do monorepo Evolution API Monitor (npm workspaces): apps/api Next.js 14, apps/worker BullMQ,
  packages/database Prisma, shared/config. Regras absolutas (session, Evolution só no servidor, Redis lock,
  logs JSON, ErrorType). Use ao criar features, onboarding no repo, ou ao citarem estrutura de pastas,
  workspaces, evolutionapi.online / cloud.evolutionapi.online.
---

# Evolution API Monitor — monorepo

## O que é

SaaS + open source para monitorar instâncias WhatsApp via Evolution API: usuários têm **Projetos**; cada projeto tem **Numbers** (uma instância Evolution = um número).

## Layout

| Pacote / app | Papel |
|--------------|--------|
| `apps/api` | Next.js 14 App Router — UI + rotas `/api/*` |
| `apps/worker` | Node + BullMQ — health checks, restarts, alertas |
| `packages/database` | Prisma + PostgreSQL |
| `packages/shared` | Tipos, DTOs, providers, retry |
| `packages/config` | tsconfig/eslint base |

## Regras não negociáveis

1. Lógica de negócio em **services/lib**, nunca só no route handler.
2. **`userId`** apenas da sessão NextAuth — nunca do body/params como fonte de verdade.
3. **Evolution API**: nunca `fetch` no frontend — sempre API interna + worker.
4. Secrets só via **env** com validação em runtime; nada commitado.
5. Falhas em jobs worker classificadas como **`ErrorType`** (enum).
6. Logs **JSON estruturados** (não `console.log` de string solta).
7. **Redis lock** obrigatório antes de mutar estado de `Number`.

## Variáveis críticas

`DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`. Opcional: `CLOUD_BILLING=true` (Stripe + Pague.dev); sem isso usar `NoOpPaymentProvider`.

## Skills irmãos (este repositório)

| Skill | Uso |
|-------|-----|
| `nextjs-monitor-api` | App Router, rotas finas, auth |
| `prisma-monitor-database` | Prisma em `packages/database` |
| `worker-bullmq-redis` | Jobs, lock, state machine |
| `evolution-api-integration` | `EvolutionClient`, health check duplo |
| `monitor-billing` | `PaymentProvider`, webhooks |
| `monitor-status-api` | Contrato REST do provedor (alertas WhatsApp) |
| `tailwind-css` | UI Tailwind v4 |

## Ecossistema externo (curadoria)

Lista alinhada a [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills): skills oficiais de **Vercel** (Next/React), **Stripe**, **Prisma**, etc., podem ser instaladas em `~/.cursor/skills/` ou referenciadas como documentação — o comportamento deste repo continua governado pelas regras em `.cursor/rules/` e pelos skills acima.

## Referência cruzada

- `.cursor/rules/000-project-overview.mdc`, `general.mdc`
