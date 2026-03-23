---
name: worker-bullmq-redis
description: >-
  Worker apps/worker: BullMQ jobs, acquireLock/releaseLock antes de mudar estado de Number, logs JSON,
  ErrorType em falhas, state machine explícita, requeue com delay quando lock falha. Use ao criar jobs,
  filas, redis-lock, evolution health-check, ou padrões tipo BullMQ/Redis do awesome-agent-skills.
---

# Worker — BullMQ + Redis

## Fluxo típico de job

1. **`acquireLock`** em chave `number:<id>:lock` (TTL ~ 2× duração esperada).
2. Se não ganhar lock: **log** + `moveToDelayed` (ou equivalente) — não falhar em silêncio.
3. Buscar estado atual no **DB** (não confiar só em `job.data` para estado mutável).
4. Executar trabalho (Evolution, state machine, alertas).
5. **`releaseLock`** no `finally` (Lua/compare-and-del se o projeto usar token de lock).

## Logs

Objeto JSON por linha (nível + campos), nunca string solta sem estrutura.

## Falhas

Classificar com **`ErrorType`** do projeto; jobs não devem lançar erro genérico sem categoria quando a regra exige enum.

## Estado

Transições de `NumberState` só por **state machine** com grafo explícito — não inferir próximo estado por string solta.

## Referência cruzada

- `.cursor/rules/004-worker.mdc`, `006-bullmq-redis.mdc`
