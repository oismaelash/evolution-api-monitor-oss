---
name: "docker-deploy"
description: "Gerenciamento de Docker e deploy do projeto, incluindo os containers da API e do Worker. Invoque quando o usuário pedir ajuda com docker, compose ou deploy."
---

# Docker & Deploy Skill

Esta skill ajuda com a orquestração de containers do Evolution API Monitor.

## Estrutura de Containers
O projeto divide a execução em dois serviços principais:
1. **API**: Serve o Next.js (Frontend e Backend integrados).
2. **Worker**: Roda o Node.js puro com BullMQ para processamento em background.

## Ambientes
- **Desenvolvimento**: Use `docker-compose.dev.yml` com `Dockerfile.dev`.
- **Produção**: Use `docker-compose.prod.yml` com `Dockerfile`.

## Tarefas Comuns
- Ao alterar dependências ou o arquivo `package.json`, certifique-se de que a imagem do Docker é reconstruída adequadamente.
- Verifique se as variáveis de ambiente necessárias (como `DATABASE_URL` e `REDIS_URL`) estão mapeadas corretamente nos arquivos compose.
