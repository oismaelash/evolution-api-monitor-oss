---
name: pilot-status-billing
description: >-
  Cobrança cloud: interface PaymentProvider (Stripe/Pague.dev), NoOp quando CLOUD_BILLING desligado,
  webhooks com assinatura e idempotência Redis, sync de quantidade com COUNT real, grace period. Use ao
  tocar billing, webhooks, assinaturas, ou skills stripe/stripe-best-practices em conjunto com este repo.
---

# Billing — Evolution API Monitor (cloud)

## Abstração

- Código de negócio depende de **`PaymentProvider`** (`packages/shared`), não de SDK Stripe direto nos domínios principais.
- **`CLOUD_BILLING`≠true** → `NoOpPaymentProvider` (OSS / dev).

## Webhooks

- Corpo **raw** + verificação de assinatura via `handleWebhook`.
- **Idempotência**: ex. chave `webhook:processed:<eventId>` no Redis com TTL.
- Retornar 400 se assinatura inválida.

## Quantidade (números)

- Sincronizar assinatura com **COUNT** real de números faturáveis — não contador só em memória.
- Hooks: adicionar/remover número, toggle monitorado, job de reconciliação se existir.

## Ciclo de vida

- **PAST_DUE**: grace (ex. 7 dias) com monitoramento ainda ativo conforme regra do projeto.
- **UNPAID** após grace: restringir novos health checks sem apagar histórico.
- **CANCELED**: respeitar `currentPeriodEnd` para corte de serviço.

## Referência cruzada

- `.cursor/rules/008-billing.mdc`
- Skills/plugins Stripe externos: validar contra `PaymentProvider` e testes de webhook.
