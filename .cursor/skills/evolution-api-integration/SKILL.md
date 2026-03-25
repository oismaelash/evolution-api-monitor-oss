---
name: evolution-api-integration
description: >-
  Integração Evolution API via EvolutionClient no worker/servidor: header apikey, instance name URL-encoded,
  health check duplo (connectionState open + setPresence), timeouts, parsing defensivo. Proibido chamar
  Evolution do browser. Evolution Go: paths /instance/all, /instance/qr, /instance/status (ver seção no SKILL).
  Índice oficial: docs.evolutionfoundation.com.br/llms.txt. Use ao implementar health-check, restart, QR,
  fetchInstances, ou regra 009-evolution-api.
---

# Evolution API — integração

## Onde roda

- **Somente servidor/worker** — credenciais descriptografadas, timeouts, retries.
- Frontend fala com **rotas internas** da API que orquestram persistência e filas.

## Cliente

- Classe **`EvolutionClient`**: `baseUrl` sem barra final, header `apikey`, `Content-Type: application/json`.
- Sempre **`encodeURIComponent(instanceName)`** nos paths.
- Usar **`fetchWithTimeout`** (ou padrão do repo) com limites distintos (ping vs restart vs QR).

## Health check duplo

Para considerar saudável: **`connectionState`** com estado `open` **e** **`setPresence`** bem-sucedido (conforme implementação atual em `health-checker`). Ambos falham → classificar `errorType` apropriado.

## Respostas

Parsing **defensivo** — a Evolution pode variar formato; normalizar para tipos internos e mapear erros de rede/HTTP para `ErrorType`.

## Referência cruzada

- `.cursor/rules/009-evolution-api.mdc`

## Evolution Go (documentação oficial)

Implementação WhatsApp em Go ([Evolution Go](https://docs.evolutionfoundation.com.br/evolution-go/index.md)). **Não é o mesmo conjunto de paths** do `EvolutionClient` deste monorepo (que segue a Evolution API em Node: `fetchInstances`, `connectionState/:name`, `setPresence/:name`, `connect/:name`, etc.).

### Índice e OpenAPI

- **Índice para LLM / descoberta de páginas**: [llms.txt](https://docs.evolutionfoundation.com.br/llms.txt) (lista Evolution Go, EvoAI Core, CRM, etc.).
- **Bundles OpenAPI Evolution Go** (YAML): [evo-go-instance](https://docs.evolutionfoundation.com.br/api-reference/openapi/Evolution-Go/evo-go-instance.yaml), [evo-go-chat](https://docs.evolutionfoundation.com.br/api-reference/openapi/Evolution-Go/evo-go-chat.yaml), [evo-go-group](https://docs.evolutionfoundation.com.br/api-reference/openapi/Evolution-Go/evo-go-group.yaml), [evo-go-message](https://docs.evolutionfoundation.com.br/api-reference/openapi/Evolution-Go/evo-go-message.yaml), [evo-go-label](https://docs.evolutionfoundation.com.br/api-reference/openapi/Evolution-Go/evo-go-label.yaml), [send-message](https://docs.evolutionfoundation.com.br/api-reference/openapi/Evolution-Go/send-message.yaml), [user](https://docs.evolutionfoundation.com.br/api-reference/openapi/Evolution-Go/user.yaml), [newsletter](https://docs.evolutionfoundation.com.br/api-reference/openapi/Evolution-Go/newsletter.yaml), [community](https://docs.evolutionfoundation.com.br/api-reference/openapi/Evolution-Go/community.yaml).

### Autenticação (igual ao padrão Evolution)

- Header **`apikey`**: chave global ou por instância ([ApiKeyAuth](https://docs.evolutionfoundation.com.br/api-reference/authentication.md) na doc EvoAI).

### Três endpoints de instância (GET, sem body)

Documentação de página:

| Recurso | Método e path | Doc |
|--------|----------------|-----|
| Listar instâncias | `GET /instance/all` | [Get all instances](https://docs.evolutionfoundation.com.br/evolution-go/get-all-instances) |
| QR da instância | `GET /instance/qr` | [Get instance QR code](https://docs.evolutionfoundation.com.br/evolution-go/get-instance-qr-code) |
| Status da instância | `GET /instance/status` | [Get instance status](https://docs.evolutionfoundation.com.br/evolution-go/get-instance-status) |

**Respostas (exemplos oficiais)** — o schema OpenAPI às vezes cita `success` + `instances`/`qrCode` no topo, mas os **exemplos** usam envelope `data` + `message: success`. Tratar com **parsing defensivo** (como nas outras integrações Evolution).

- **`GET /instance/all` (200)**: exemplo com `data` como array de objetos com campos entre outros: `id`, `name`, `token`, `jid`, `qrcode`, `connected`, `createdAt`, flags (`alwaysOnline`, `readMessages`, …).
- **`GET /instance/qr` (200)**: exemplo `data.Qrcode` (data URI PNG base64), `data.Code` (string do código de pareamento).
- **`GET /instance/status` (200)**: exemplo `data.Connected`, `data.LoggedIn`, `data.Name`.

**Erros (padrão documentado)**: `400` BAD_REQUEST, `401` UNAUTHORIZED, `403` FORBIDDEN, `404` NOT_FOUND (ex.: instância no QR/status), `500` — corpo `success: false`, `error.code`, `error.message`, opcional `meta` (timestamp, path, method).

### Outras páginas úteis (mesmo índice)

- [Getting started](https://docs.evolutionfoundation.com.br/evolution-go/getting-started.md), [Installation](https://docs.evolutionfoundation.com.br/evolution-go/installation.md), [Create a new instance](https://docs.evolutionfoundation.com.br/evolution-go/create-a-new-instance.md), [Connect / Disconnect / Logout](https://docs.evolutionfoundation.com.br/evolution-go/connect-to-instance.md) (links no `llms.txt` sob `evolution-go/`).
