---
name: prisma-pilot-database
description: >-
  Prisma em packages/database: singleton PrismaClient, queries com ownership por userId, paginação com take,
  migrations via migrate dev/deploy, encrypt/decrypt de campos sensíveis. Use ao alterar schema, services
  que acessam DB, ou ao citarem padrões tipo Prisma Postgres best practices neste repositório.
---

# Prisma / PostgreSQL — monorepo

## Cliente

- Um **singleton** `PrismaClient` exportado de `packages/database` (padrão dev/prod com `globalThis`).

## Queries

- Incluir cadeia de ownership: ex. `where` que garanta `project.userId` / relações conforme modelo.
- `findMany` **sempre** com `take` (limite padrão do projeto, ex. 50).
- Listagens: preferir `select` explícito para não vazar colunas desnecessárias.
- Histórico / logs: filtrar por `numberId` + intervalo de datas com índices já previstos no schema.

## Paginação

Retornar `{ data, meta: { page, limit, total, totalPages } }` alinhado aos services da API.

## Migrations

- Gerar com `prisma migrate dev --name <descricao>` — não editar SQL gerado manualmente depois do fato.
- Produção: `prisma migrate deploy`.
- Renomeações pesadas: coluna nova → backfill → remover antiga (migrations separadas).

## Dados sensíveis

Criptografar antes de persistir (ex. API keys Evolution); descriptografar só no ponto de uso (não em listagens).

## Referência cruzada

- `.cursor/rules/005-database-prisma.mdc`
