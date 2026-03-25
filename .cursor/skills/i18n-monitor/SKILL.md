---
name: "i18n-monitor"
description: "Padrões de internacionalização do projeto para pt-BR e en. Invoque quando o usuário pedir para traduzir, adicionar idiomas ou formatar textos visíveis ao usuário."
---

# i18n Monitor Skill

O Evolution API Monitor possui um sistema próprio e minimalista de internacionalização, suportando os idiomas `pt` e `en`.

## Como usar (Frontend - Client Components)
Use o hook `useT`:
```tsx
'use client';
import { useT } from '@/components/i18n/i18n-provider';

export function MyComponent() {
  const t = useT();
  return <button>{t('Salvar', 'Save')}</button>;
}
```

## Como usar (Server Components e Actions)
Importe a função apropriada de `lib/i18n-server`:
```ts
import { getTranslator } from '@/lib/i18n-server';

export async function MyServerComponent() {
  const t = await getTranslator();
  return <h1>{t('Bem-vindo', 'Welcome')}</h1>;
}
```

## Regras
- SEMPRE utilize estas funções ao adicionar novos textos em telas visíveis pelo usuário.
- Mantenha `pt` como primeiro argumento e `en` como segundo, consistentemente em todo o projeto.
