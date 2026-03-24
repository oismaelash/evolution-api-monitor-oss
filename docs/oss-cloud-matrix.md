# OSS vs Cloud (§10)

Feature flags control behavior in both environments. Set them in `.env` (or your hosting provider).

| Flag | `true` (Cloud / SaaS) | `false` (OSS / self-hosted) |
|------|------------------------|-------------------------------|
| `CLOUD_BILLING` | Stripe checkout + webhooks, `syncActiveNumberCount` → Stripe quantity, `NoOpPaymentProvider` when keys missing | `NoOpPaymentProvider` only; billing API routes return 404 |
| `CLOUD_ADVANCED_ALERTS` | Handlebars rendering for `ProjectConfig.alertTemplate` in email + Monitor alerts | Plain default message text only |
| `CLOUD_EXPONENTIAL_RETRY` | Worker uses exponential jitter + `RetryStrategy.EXPONENTIAL_JITTER` when enabled | `RetryStrategy` from `ProjectConfig` only (fixed delay by default) |

**Additional env (timeouts):**

- `PING_TIMEOUT_MS` — Evolution `connectionState`/`setPresence`/`fetchInstances` timeouts (default 5000).
- `RESTART_TIMEOUT_MS` — Evolution `restart` call timeout (default 10000).

**Billing (when `CLOUD_BILLING=true`):**

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (checkout).
- `PAGUE_DEV_WEBHOOK_SECRET` for PIX webhook verification (HMAC).
- Grace: `PAST_DUE` sets `pastDueGraceEndsAt` (+7 days); `UNPAID` skips health checks; `CANCELED` after `currentPeriodEnd` skips health checks.

**Admin (queues):**

- `GET /api/admin/queues` — ADMIN user only; optional `BULL_BOARD_SECRET` or `?secret=` query / `x-bull-board-secret` header.
