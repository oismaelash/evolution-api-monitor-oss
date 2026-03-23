---
name: evolution-api-integration
description: >-
  Integração Evolution API via EvolutionClient no worker/servidor: header apikey, instance name URL-encoded,
  health check duplo (connectionState open + setPresence), timeouts, parsing defensivo. Proibido chamar
  Evolution do browser. Use ao implementar health-check, restart, QR, fetchInstances, ou regra 009-evolution-api.
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
