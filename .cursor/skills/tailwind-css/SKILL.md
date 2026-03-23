---
name: tailwind-css
description: >-
  Estilização utility-first com Tailwind CSS (v4): @import "tailwindcss", @theme, breakpoints mobile-first,
  dark:, composição de classes, arbitrary values, acessibilidade (focus-visible, sr-only), evitar strings gigantes
  de className. Use ao estilizar UI no monorepo (Next.js), ao citarem tailwindcss.com, classes utilitárias ou migração v3→v4.
---

# Tailwind CSS — uso no projeto

Documentação oficial: [tailwindcss.com](https://tailwindcss.com/) (instalação, referência de utilitários, upgrade guides).

## Quando aplicar

- Novos componentes React/Next.js com classes no markup (ou helpers que geram classes).
- Revisão de UI: consistência de espaçamento, tipografia, estados hover/focus, dark mode.
- Integração ou atualização do pipeline CSS (PostCSS / bundler) para Tailwind v4.

## v4 — entrada em CSS

Padrão atual do framework: um arquivo CSS importa o motor Tailwind e, opcionalmente, estende o tema.

```css
@import "tailwindcss";

@theme {
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --color-brand-500: oklch(0.55 0.2 250);
}
```

- Tokens de design ficam em **`@theme`** (variáveis CSS consumidas pelas utilities).
- **`@layer`** — ordem: theme, base, components, utilities (o próprio Tailwind organiza specificity).
- Conteúdo / escaneamento: seguir a doc da versão instalada para `@source` ou equivalente no bundler (Next, Vite, etc.).

Se o repositório ainda tiver **`tailwind.config`** legível (v3), consultar o [guia de upgrade](https://tailwindcss.com/docs/upgrade-guide) antes de misturar padrões.

## Composição e layout

- **Mobile-first**: utilitários sem prefixo aplicam a todos os tamanhos; prefixos `sm:`, `md:`, `lg:`, `xl:`, `2xl:` refinam acima do breakpoint.
- **Flexbox e grid**: preferir `flex`, `grid`, `gap-*`, `items-*`, `justify-*` em vez de margens ad hoc quando o layout for estrutural.
- **Espaçamento**: escala consistente (`p-*`, `m-*`, `space-*`, `gap-*`); evitar valores mágicos soltos quando existe token próximo.
- **Tipografia**: `text-*`, `font-*`, `leading-*`, `tracking-*`; equilibrar hierarquia visual com poucos tamanhos base.

## Cores e temas

- **`dark:`** — prefixo para variantes em modo escuro (quando o projeto define estratégia dark: classe no `html`, `media`, etc.).
- **P3 / paleta** — classes `*-50` … `*-950` na doc; para marca, preferir tokens em `@theme` e nomes semânticos no código (`bg-brand-500`).
- **Arbitrary values** — `[13px]`, `[#0a0]`, `[length:var(--x)]` só quando não houver utilitário ou token; documentar o motivo se for exceção frequente.

## Estados e acessibilidade

- Interação: `hover:`, `active:`, `focus:`, **`focus-visible:`** para foco de teclado (evitar `outline-none` sem substituto visível).
- Leitores de tela: `sr-only` quando o design esconde texto que deve permanecer anunciado.
- Contraste: verificar WCAG ao escolher pares texto/fundo; não depender só da cor para significado (`aria-*`, ícones com `title`/`aria-label` quando aplicável).

## Organização no React / Next.js

- Componentes pequenos e classes co-localizadas são idiomáticos; para variantes repetidas (botão, badge), usar **`cva`** (class-variance-authority) ou utilitário interno do projeto — evitar strings de 40+ classes duplicadas em vários arquivos.
- **`clsx` / `tailwind-merge`**: combinar classes condicionais sem conflitos (`twMerge` quando duas utilities competem).
- Não misturar dezenas de `style={{}}` inline quando utilities cobrem o caso; inline só para valores dinâmicos que não valem token.

## Performance e higiene

- Build de produção remove CSS não usado (tree-shaking de utilities) — manter classes **detectáveis** pelo scanner (evitar concatenação dinâmica que esconda nomes completos; ver doc *content detection* da versão em uso).
- Evitar `@apply` em excesso para não recriar “CSS nomeado” gigante; usar com moderação em base/components.

## Referência cruzada

- Regras do repositório: `.cursor/rules/` (padrões de frontend e produto).
- Ao adicionar Tailwind ao monorepo: seguir a doc oficial de [framework guides](https://tailwindcss.com/docs/installation/framework-guides) para a stack exata (Next.js App Router, PostCSS, etc.).
