# Evolution API: verificar conexão e reconectar instância

Referência dos **endpoints da Evolution API** usados no Evolution API Monitor para saber se uma instância está conectada e para **reconectar** (QR / pairing). Substitua `{base}` pela URL base configurada em `EVOLUTION_API_URL` (sem barra final) e `{instanceName}` pelo nome da instância na Evolution (URL-encoded se tiver espaços ou caracteres especiais).

Autenticação padrão da Evolution: header **`apikey`** com a chave da API (`EVOLUTION_API_KEY`).

Documentação oficial do projeto Evolution API: [Evolution API no GitHub](https://github.com/EvolutionAPI/evolution-api) (rotas podem variar levemente por versão).

---

## 1. Estado da conexão (`connectionState`)

Verifica o estado atual da sessão WhatsApp da instância.

| | |
|---|---|
| **Método** | `GET` |
| **URL** | `{base}/instance/connectionState/{instanceName}` |
| **Headers** | `apikey: <sua-api-key>` |
| **Body** | *(nenhum)* |

### Resposta (exemplo típico)

A Evolution costuma devolver JSON onde o estado aparece em **`instance.state`** ou, em algumas versões, em **`state`** no topo:

```json
{
  "instance": {
    "instanceName": "Minha Instancia",
    "state": "open"
  }
}
```

Valores comuns de estado (normalmente **case-insensitive** na prática; o Pilot normaliza para maiúsculas):

| Estado (exemplos) | Significado usual |
|-------------------|-------------------|
| `open` | Conectado / sessão ativa |
| `close` | Desconectado |
| `connecting` | Em processo de conexão (QR, etc.) |

No código do Pilot, `CONNECTING` é tratado como **ainda não conectado** para evitar falso positivo antes da checagem de presença.

Erros HTTP e corpos de erro seguem o padrão da sua instalação Evolution (ex.: `400`, `404`, JSON com `message` / `error`).

### Instância não encontrada (`404`)

Quando **`{instanceName}`** não existe nesse servidor Evolution (nome errado, instância nunca criada ou já removida), a API costuma responder **HTTP 404** com um JSON no estilo:

```json
{
  "status": 404,
  "error": "Not Found",
  "response": {
    "message": [
      "The \"minha-instancia\" instance does not exist"
    ]
  }
}
```

- O texto exato de `message` pode variar entre versões, mas em geral indica que **a instância não existe** no servidor.
- Confira se o nome na URL está **idêntico** ao cadastrado na Evolution (incluindo espaços e maiúsculas) e se está **URL-encoded** no path.
- Nos fluxos do **worker** (`connectionState` / `setPresence`), esse padrão de 404 (`not found` + `does not exist` no corpo) é tratado como estado lógico **`not_found`** ou presença inválida — não como sessão aberta.

Os mesmos endpoints de **seção 2** e **seção 3** podem retornar **404** em situações análogas (instância inexistente); o backend do Pilot pode propagar isso como erro de rede/Evolution (ex.: `502` na API interna) em vez de um JSON “sucesso”.

---

## 2. Presença (`setPresence`) — checagem adicional

Alguns fluxos chamam este endpoint depois que `connectionState` indica `open`, para confirmar que a sessão responde de fato (o Pilot só considera “conectado” se a resposta for **201** e o corpo **não** indicar desconexão).

| | |
|---|---|
| **Método** | `POST` |
| **URL** | `{base}/instance/setPresence/{instanceName}` |
| **Headers** | `Content-Type: application/json`<br>`apikey: <sua-api-key>` |
| **Body (JSON)** | Ver abaixo |

### Request body

```json
{
  "presence": "available"
}
```

Valores usados no projeto / docs internos:

| `presence` | Uso |
|------------|-----|
| `available` | “Online” / disponível |
| `unavailable` | Indisponível |

### Response (sucesso observado)

HTTP **201** com corpo do tipo:

```json
{
  "presence": "available"
}
```

O Pilot trata como falha de “presença ok” se o status **não** for `201` ou se o texto da resposta contiver `"close"` (comparação case-insensitive), e nesse caso a instância é considerada desconectada para aquele fluxo.

---

## 3. Reconectar / obter QR Code e pairing (`instance/connect`)

Solicita novo fluxo de conexão (QR em base64 e/ou código de pareamento), conforme a Evolution expuser na sua versão.

| | |
|---|---|
| **Método** | `GET` |
| **URL** | `{base}/instance/connect/{instanceName}` |
| **Query (opcional)** | `number` — número em formato internacional **só dígitos** (ex.: `5511999999999`), usado em fluxos de pairing por número |
| **Headers** | `apikey: <sua-api-key>` |
| **Body** | *(nenhum)* |

### Exemplo de URL com query

```http
GET {base}/instance/connect/Nome%20Da%20Instancia?number=5511999999999
apikey: ***
```

(No worker de notificação de desconexão o Pilot monta essa URL com `number` para pairing.)

### Response (200) — exemplo real do repositório

```json
{
  "pairingCode": "AAW1ZW76",
  "code": "2@rjw7I08OSnennsLs2yMMAr+fyfXSh25bML95xkScuX6skA5Q4e4GaoRvwWv/eA1ijXLSs0XVWDwPkD6ojnkrXTupnoE/o9C/8qs=,...",
  "base64": "data:image/png;base64,iVBORw0KGgo...",
  "count": 1
}
```

| Campo | Descrição |
|-------|-----------|
| `pairingCode` | Código de pareamento (quando aplicável) |
| `code` | String de pairing/código interno da Evolution |
| `base64` | Imagem do QR (às vezes já com prefixo `data:image/png;base64,`) |
| `count` | Contador retornado pela API neste exemplo |

O backend do Pilot lê o QR de `base64` ou, em alguns casos, de `qrcode.base64` (compatibilidade entre formatos de resposta).

Se **`{instanceName}`** não existir, a Evolution pode responder **404** (corpo sem QR / mensagem de instância inexistente) em vez de **200** — mesmo padrão de erro descrito na seção **Instância não encontrada (404)** acima.

---

## 4. Listar todas as instâncias (`fetchInstances`)

Retorna um **array JSON** com todas as instâncias visíveis para a chave da API.

| | |
|---|---|
| **Método** | `GET` |
| **URL** | `{base}/instance/fetchInstances` |
| **Headers** | `apikey: <sua-api-key>` |
| **Body** | *(nenhum)* |

### Exemplo (`curl`)

```bash
curl --location 'https://evolution.iaxp.cloud/instance/fetchInstances' \
  --header 'apikey: <sua-api-key>'
```

(`evolution.iaxp.cloud` é apenas exemplo; use o mesmo host de `EVOLUTION_API_URL`.)

### Response **200**

Corpo: **array** de objetos — um elemento por instância. Campos principais (nomes e aninhamentos podem variar levemente por versão da Evolution):

| Campo | Descrição |
|-------|-----------|
| `id` | UUID da instância no banco da Evolution |
| `name` | Nome da instância (usado em `connectionState`, `connect`, etc.) |
| `connectionStatus` | Ex.: `open`, `close` — visão geral de conexão |
| `ownerJid` | JID do WhatsApp quando conectado, ou `null` |
| `profileName` / `profilePicUrl` | Nome e foto do perfil, ou `null` |
| `integration` | Ex.: `WHATSAPP-BAILEYS` |
| `number` | Número associado (dígitos) |
| `token` | Token interno da instância na Evolution (tratar como sensível) |
| `disconnectionReasonCode` / `disconnectionObject` / `disconnectionAt` | Metadados da última desconexão, ou `null` |
| `Proxy` | Configuração de proxy, ou `null` |
| `Setting` | Preferências da instância (rejectCall, groupsIgnore, etc.) |
| `_count` | Contagens agregadas (ex.: `Message`, `Contact`, `Chat`) |

`Chatwoot`, `Rabbitmq`, `Nats`, `Sqs`, `Websocket` costumam vir `null` se não estiverem integrados.

### Exemplo de payload **200** (estrutura, **1 item** com valores ilustrativos)

O array real pode ter muitos itens no mesmo formato. Abaixo um único objeto representativo (tokens, senhas e URLs longas abreviados):

```json
[
  {
    "id": "0033ccb7-2a33-4c58-8fbe-d693706bfe27",
    "name": "PS-cmmsdk3w-53e24350",
    "connectionStatus": "open",
    "ownerJid": "558881360134@s.whatsapp.net",
    "profileName": "Regis Designer",
    "profilePicUrl": "https://pps.whatsapp.net/...",
    "integration": "WHATSAPP-BAILEYS",
    "number": "558881360134",
    "businessId": null,
    "token": "<token-instancia>",
    "clientName": "evolution_exchange",
    "disconnectionReasonCode": 401,
    "disconnectionObject": "{\"error\":{...},\"date\":\"2026-03-21T10:34:14.613Z\"}",
    "disconnectionAt": "2026-03-21T10:34:14.616Z",
    "createdAt": "2026-03-21T09:22:50.070Z",
    "updatedAt": "2026-03-23T21:29:15.396Z",
    "Chatwoot": null,
    "Proxy": {
      "id": "cmn04ie7k010foa8pol2binlh",
      "enabled": true,
      "host": "gate.nodemaven.com",
      "port": "8080",
      "protocol": "http",
      "username": "<proxy-username>",
      "password": "<proxy-password>",
      "createdAt": "2026-03-21T09:26:20.529Z",
      "updatedAt": "2026-03-21T09:26:20.529Z",
      "instanceId": "0033ccb7-2a33-4c58-8fbe-d693706bfe27"
    },
    "Rabbitmq": null,
    "Nats": null,
    "Sqs": null,
    "Websocket": null,
    "Setting": {
      "id": "cmn04dvto0101oa8pu57heg0f",
      "rejectCall": false,
      "msgCall": "",
      "groupsIgnore": true,
      "alwaysOnline": false,
      "readMessages": false,
      "readStatus": false,
      "syncFullHistory": false,
      "wavoipToken": "",
      "createdAt": "2026-03-21T09:22:50.075Z",
      "updatedAt": "2026-03-23T14:50:35.670Z",
      "instanceId": "0033ccb7-2a33-4c58-8fbe-d693706bfe27"
    },
    "_count": {
      "Message": 35,
      "Contact": 779,
      "Chat": 4
    }
  }
]
```

Outros itens no array podem ter `connectionStatus: "close"`, `Proxy: null`, `ownerJid` / `profileName` nulos quando nunca conectou, etc.

---

## Resumo das rotas Evolution

| Objetivo | Método | Caminho Evolution |
|----------|--------|-------------------|
| Listar instâncias | `GET` | `/instance/fetchInstances` |
| Ler se está conectado | `GET` | `/instance/connectionState/{instanceName}` |
| Testar presença após `open` | `POST` | `/instance/setPresence/{instanceName}` |
| Reconectar / QR / pairing | `GET` | `/instance/connect/{instanceName}` (`?number=` opcional) |

Todos usam o header **`apikey`**. Não há body em `GET`; `setPresence` usa JSON no `POST`.

---

## Erros genéricos (referência interna)

Quando a instância está desconectada e se tenta enviar mensagem, a Evolution pode responder com estruturas como:

```json
{
  "status": 400,
  "error": "Bad Request",
  "response": {
    "message": ["Error: Connection Closed"]
  }
}
```

(Isso não é específico dos endpoints de instância acima, mas ajuda a interpretar falhas no mesmo servidor Evolution.)
