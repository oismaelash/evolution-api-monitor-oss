---
name: pilot-status-api
description: >-
  Integra Pilot Status (WhatsApp transacional): x-api-key, TEST vs LIVE, POST /v1/messages/send
  (deliverAt opcional, 202), E.164, opt-in e query %2B, números com QR base64, erros 400/401/403/404/429,
  webhooks e SDKs @pilot-status/sdk e pilot-status. Use para AlertProvider, worker de alertas, webhooks;
  quando citarem pilotstatus.online ou llms.txt.
---

# Pilot Status — integração no Evolution API Monitor (API + produto externo)

Fonte resumida oficial: [llms.txt](https://pilotstatus.online/llms.txt). Detalhes na [documentação](https://pilotstatus.online/docs). [Terms](https://pilotstatus.online/terms) / [Privacy](https://pilotstatus.online/privacy).

## Conceitos

- **Projetos** — isolamento (templates, API keys, webhooks por projeto).
- **Templates** — criados/aprovados no dashboard; envio via API usa `templateId` e variáveis `{{key}}`.
- **Idiomas** — conteúdo do site/docs em pt-BR e en.

## Autenticação e ambientes

- Todas as requisições: header **`x-api-key`** (chaves em `/api-keys`).
- Prefixos: **`ps_test_*`** (TEST), **`ps_live_*`** (LIVE).
- **TEST**: sandbox; só envia para o WhatsApp configurado em **Profile** (`/profile`).
- **LIVE**: requer fluxo de aprovação em Profile (vídeo etc., conforme produto).

## API — envio e consulta

**`POST /v1/messages/send`**

```json
{
  "templateId": "meu-template",
  "destinationNumber": "+5511999999999",
  "variables": { "name": "Ana" },
  "deliverAt": "2026-03-23T15:00:00.000Z"
}
```

- `deliverAt` (opcional): ISO 8601 para agendar.
- **`destinationNumber`**: E.164 com **`+`** e código do país.

Resposta típica **202** com `id`, `correlationId`, `status`, `createdAt` (e demais campos conforme API).

**`GET /v1/messages/<messageId>`** — status (QUEUED, SENT, etc.).

**`GET /v1/messages/opt-in?destinationNumber=...`**

- Na query string, codificar **`+` como `%2B`** (ex.: `destinationNumber=%2B5511999999999`).

## Opt-in em LIVE (número Pilot)

- Destinatário deve ter consentimento explícito para receber no número Pilot em LIVE.
- Opt-in é registrado quando o usuário envia mensagem ao WhatsApp Pilot (não só via API).
- Para reconhecimento automático, a mensagem deve **terminar** com:  
  `ps optin <PROJECT_ID>`  
  (substituir `PROJECT_ID` pelo id do projeto de `GET /v1/projects`).

## Projetos, chaves e números

- `GET` / `POST /v1/projects` — listar/criar projetos.
- `GET` / `POST /v1/api-keys` — chaves criadas herdam **projeto + ambiente** da `x-api-key` usada na chamada.
- **Retenção (PII)** — por API key; com retenção desligada, webhooks podem omitir alguns campos sensíveis (IDs e status seguem).
- **`POST /v1/numbers`** — criar instância WhatsApp; resposta inclui **QR code em base64**.
- **`GET /v1/numbers/<id>/status`** — estado da instância.

## Erros HTTP

| Status | Uso típico |
|--------|------------|
| 400 | Validação |
| 401 | API key ausente ou inválida |
| 403 | LIVE não aprovado ou violação de regra de ambiente (ex.: TEST) |
| 404 | Template sem versão aprovada |
| 429 | Rate limit |

## Webhooks

- Configurar no dashboard para receber eventos de entrega e respostas do destinatário.
- SDKs oficiais ajudam a validar/parsear payloads: ver abaixo.

## SDKs oficiais

- **Node/TypeScript**: [`@pilot-status/sdk`](https://www.npmjs.com/package/@pilot-status/sdk)
- **Python**: [`pilot-status`](https://pypi.org/project/pilot-status/) (`pilot_status`)

## Fluxo de integração (produto)

1. Criar templates em `/templates`.
2. Configurar WhatsApp em `/profile`.
3. Gerar API key em `/api-keys`.
4. (Opcional) Solicitar Production (LIVE) em Profile.
5. Enviar com `POST /v1/messages/send`.
6. Acompanhar com `GET /v1/messages/<messageId>`.

## Boas práticas (Evolution API Monitor)

1. Chamar Pilot só de **worker** ou **servidor** — nunca do browser.
2. Encapsular em **AlertProvider**; env (`PILOT_STATUS_API_KEY` ou nome validado no projeto).
3. Logs **JSON estruturados**; falhas com **ErrorType** no worker.
4. Respeitar **cooldown** de alertas e não retentar POST sem backoff (anti-spam).
5. Compliance: volume alto e mensagens não solicitadas podem acionar anti-spam do WhatsApp; usuário responsável por opt-in e leis aplicáveis.

## Fetch mínimo (TypeScript)

```typescript
const res = await fetch('https://pilotstatus.online/v1/messages/send', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    accept: 'application/json',
    'x-api-key': process.env.PILOT_STATUS_API_KEY!,
  },
  body: JSON.stringify({
    templateId,
    destinationNumber,
    variables: variables ?? {},
    ...(deliverAt && { deliverAt }),
  }),
});
// Sucesso costuma ser 202 Accepted
if (res.status !== 202 && !res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error(typeof err?.error === 'string' ? err.error : `HTTP ${res.status}`);
}
```

## Referência cruzada

- Rule: `.cursor/rules/010-pilot-status-api.mdc`
- Evolution (monitoramento de instância): `.cursor/rules/009-evolution-api.mdc`
