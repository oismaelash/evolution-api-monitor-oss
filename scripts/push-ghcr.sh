#!/bin/bash

# Build e push das imagens Docker (Next.js API + BullMQ worker) para o GitHub Container Registry.
# Monorepo: evolution-online — Dockerfile na raiz, targets: api | worker | migrate.
#
# Uso: ./scripts/push-ghcr.sh
#
# Obrigatórias (env ou .env):
#   GHCR_TOKEN
#
# Versão da tag (GHCR_IMAGE_VERSION):
#   export / .env, ou "version" no package.json da raiz, ou (fallback) git rev-parse --short HEAD
#
# Opcionais:
#   GHCR_USERNAME      — inferido do remote origin (github.com)
#   GHCR_IMAGE_NAME    — base do nome (padrão: campo "name" do package.json da raiz)
#                        imagens: ${GHCR_IMAGE_NAME}-api e ${GHCR_IMAGE_NAME}-worker
#   ENV_FILE           — padrão: .env
#   SKIP_CHECKS=1      — não roda npm run push:checks antes do build
#   GHCR_PUSH_MIGRATE=true — também build/push de ${GHCR_IMAGE_NAME}-migrate (Prisma migrate one-off)
#
set -euo pipefail

# Remover credsStore do ~/.docker/config.json (WSL / UtilAcceptVsock)
DOCKER_CONFIG="${HOME}/.docker/config.json"
if [ -f "$DOCKER_CONFIG" ]; then
    if command -v jq &> /dev/null; then
        jq 'del(.credsStore)' "$DOCKER_CONFIG" > "${DOCKER_CONFIG}.tmp" && mv "${DOCKER_CONFIG}.tmp" "$DOCKER_CONFIG"
    else
        node -e "
        const fs = require('fs');
        const p = process.env.HOME + '/.docker/config.json';
        const c = JSON.parse(fs.readFileSync(p, 'utf8'));
        delete c.credsStore;
        fs.writeFileSync(p, JSON.stringify(c, null, 2));
        "
    fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Push das imagens Evolution API Monitor para GHCR${NC}"
echo -e "   Projeto: ${ROOT_DIR}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ docker não está no PATH${NC}"
    exit 1
fi

if [[ "${SKIP_CHECKS:-}" != "1" ]]; then
    echo -e "${YELLOW}🧪 Rodando push:checks (lint + test)...${NC}"
    npm run push:checks
    echo -e "${GREEN}✅ Checks OK${NC}"
else
    echo -e "${YELLOW}⏭️  SKIP_CHECKS=1 — pulando push:checks${NC}"
fi

ENV_FILE=${ENV_FILE:-.env}
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}📁 Carregando ${ENV_FILE} (GHCR_*)...${NC}"
    while IFS= read -r line || [[ -n "$line" ]]; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*(.*)[[:space:]]*$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
            if [[ -z "${!key:-}" ]]; then
                export "$key=$value"
                if [[ "$key" =~ ^GHCR_ ]]; then
                    echo -e "   $key"
                fi
            fi
        fi
    done < "$ENV_FILE"
fi

if [ -z "${GHCR_USERNAME:-}" ] && command -v git &> /dev/null && [ -d .git ]; then
    GIT_REMOTE=$(git config --get remote.origin.url 2>/dev/null || echo "")
    if [[ "$GIT_REMOTE" =~ github\.com[:/]([^/]+) ]]; then
        GHCR_USERNAME="${BASH_REMATCH[1]}"
        echo -e "${YELLOW}📦 GHCR_USERNAME (git): ${GHCR_USERNAME}${NC}"
    fi
fi

if [ -z "${GHCR_IMAGE_NAME:-}" ] && [ -f package.json ] && command -v node &> /dev/null; then
    GHCR_IMAGE_NAME=$(node -e "console.log(require('./package.json').name)" 2>/dev/null || echo "")
    if [[ -n "$GHCR_IMAGE_NAME" ]]; then
        echo -e "${YELLOW}📦 GHCR_IMAGE_NAME (package.json): ${GHCR_IMAGE_NAME}${NC}"
    fi
fi
if [ -z "${GHCR_IMAGE_NAME:-}" ]; then
    GHCR_IMAGE_NAME=$(basename "$(pwd)")
    echo -e "${YELLOW}📦 GHCR_IMAGE_NAME (diretório): ${GHCR_IMAGE_NAME}${NC}"
fi

if [ -z "${GHCR_IMAGE_VERSION:-}" ] && [ -f package.json ] && command -v node &> /dev/null; then
    GHCR_IMAGE_VERSION=$(node -e "console.log(require('./package.json').version || '')" 2>/dev/null || echo "")
    [[ -n "$GHCR_IMAGE_VERSION" ]] && echo -e "${YELLOW}📦 GHCR_IMAGE_VERSION (package.json): ${GHCR_IMAGE_VERSION}${NC}"
fi
if [ -z "${GHCR_IMAGE_VERSION:-}" ] && command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null; then
    GHCR_IMAGE_VERSION=$(git rev-parse --short HEAD)
    echo -e "${YELLOW}📦 GHCR_IMAGE_VERSION (git short SHA): ${GHCR_IMAGE_VERSION}${NC}"
fi

if [ -z "${GHCR_IMAGE_NAME:-}" ]; then
    echo -e "${RED}❌ GHCR_IMAGE_NAME indefinido${NC}"
    exit 1
fi
if [ -z "${GHCR_IMAGE_VERSION:-}" ]; then
    echo -e "${RED}❌ GHCR_IMAGE_VERSION indefinido (export, .env, package.json version ou repo git)${NC}"
    exit 1
fi
if [ -z "${GHCR_TOKEN:-}" ]; then
    echo -e "${RED}❌ GHCR_TOKEN indefinido${NC}"
    exit 1
fi
if [ -z "${GHCR_USERNAME:-}" ]; then
    echo -e "${RED}❌ GHCR_USERNAME indefinido${NC}"
    exit 1
fi

API_IMAGE="ghcr.io/${GHCR_USERNAME}/${GHCR_IMAGE_NAME}"
TAG_VER="${GHCR_IMAGE_VERSION}"

echo -e "${GREEN}📋 Imagem Única:${NC}"
echo -e "   ${API_IMAGE}:${TAG_VER} , :latest"

echo -e "${YELLOW}🔐 Login GHCR...${NC}"
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

docker_build_push() {
    local image_base="$1"
    echo -e "${YELLOW}🔨 Build unificado → ${image_base}...${NC}"
    
    local build_args=()
    if [ -f "$ENV_FILE" ]; then
        while IFS= read -r line || [[ -n "$line" ]]; do
            [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
            if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*= ]]; then
                local key="${BASH_REMATCH[1]}"
                if [[ ! "$key" =~ ^GHCR_ ]]; then
                    build_args+=(--build-arg "${key}=${!key:-}")
                fi
            fi
        done < "$ENV_FILE"
    fi

    docker build \
        -f Dockerfile \
        "${build_args[@]}" \
        -t "${image_base}:${TAG_VER}" \
        -t "${image_base}:latest" \
        .
    docker push "${image_base}:${TAG_VER}"
    docker push "${image_base}:latest"
    echo -e "${GREEN}✅ ${image_base} (${TAG_VER}, latest)${NC}"
}

docker_build_push "$API_IMAGE"

echo -e "${GREEN}🎉 Concluído.${NC}"
