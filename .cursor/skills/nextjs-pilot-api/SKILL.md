---
name: nextjs-pilot-api
description: >-
  Next.js 14 App Router no apps/api: handlers finos (auth → parse → service → JSON), NextAuth session,
  AppError, paginação { data, meta }. Use ao criar ou alterar app/api, middleware, lib de API, ou ao
  citarem padrões tipo vercel-labs/next-best-practices aplicados a este monorepo.
---

# Next.js (App Router) — `apps/api`

## Padrão de route handler

1. **Auth primeiro** — `getServerSession(authOptions)`; sem `session.user.id` → 401.
2. **Parse** — query/body com Zod/schemas de `@pilot/shared` onde existir.
3. **Delegar** — `SomeService.method(session.user.id, …)`; zero regra de negócio no arquivo da rota.
4. **Resposta** — JSON; erros `{ error: string }` (e `code` se `AppError`); paginação `{ data, meta: { page, limit, total, totalPages } }`.

## Proibições

- Não confiar em `userId` do cliente para ownership — checagem no **service**.
- Não vazar mensagens cruas do Prisma ao cliente.
- Não acoplar chamadas HTTP a Evolution nem Pilot Status no handler — usar serviços que já encapsulam integrações.

## Erros

Preferir wrapper/middleware global (`withErrorHandler` ou equivalente do projeto) para mapear `AppError` → status HTTP.

## Referência cruzada

- `.cursor/rules/002-nextjs-api.mdc`, `003-nextjs-frontend.mdc`
