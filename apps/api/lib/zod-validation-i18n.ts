import type { ZodIssue } from 'zod';

import type { Translator } from '@/lib/i18n';

function typeLabel(v: unknown): string {
  return typeof v === 'string' ? v : String(v);
}

/**
 * Traduz uma issue do Zod 3 para PT/EN usando o mesmo padrão `t(pt, en)` do app.
 */
export function translateZodIssue(issue: ZodIssue, t: Translator): string {
  switch (issue.code) {
    case 'invalid_type': {
      return t(
        `Tipo inválido: esperado ${typeLabel(issue.expected)}, recebido ${typeLabel(issue.received)}`,
        `Invalid type: expected ${typeLabel(issue.expected)}, received ${typeLabel(issue.received)}`,
      );
    }
    case 'invalid_literal': {
      return t('Valor literal inválido', 'Invalid literal value');
    }
    case 'unrecognized_keys': {
      return t(
        `Campos não reconhecidos: ${issue.keys.join(', ')}`,
        `Unrecognized keys: ${issue.keys.join(', ')}`,
      );
    }
    case 'invalid_union': {
      const nested = issue.unionErrors[0]?.issues[0];
      if (nested) {
        return translateZodIssue(nested, t);
      }
      return t('Valor inválido', 'Invalid value');
    }
    case 'invalid_union_discriminator': {
      return t('Valor de discriminador inválido', 'Invalid discriminator value');
    }
    case 'invalid_enum_value': {
      return t(
        `Valor inválido: ${String(issue.received)}`,
        `Invalid enum value: ${String(issue.received)}`,
      );
    }
    case 'invalid_string': {
      const v = issue.validation;
      if (v === 'email') {
        return t('E-mail inválido', 'Invalid email');
      }
      if (v === 'url') {
        return t('URL inválida', 'Invalid URL');
      }
      if (v === 'uuid') {
        return t('UUID inválido', 'Invalid UUID');
      }
      if (typeof v === 'object' && v !== null && 'includes' in v) {
        return t('Formato de texto inválido', 'Invalid string format');
      }
      return t('Texto inválido', 'Invalid string');
    }
    case 'too_small': {
      const min = issue.minimum;
      const typ = issue.type;
      const exact = issue.exact === true;
      if (typ === 'string') {
        if (exact) {
          return t(
            `O texto deve ter exatamente ${String(min)} caractere(s)`,
            `String must contain exactly ${String(min)} character(s)`,
          );
        }
        return t(
          `Informe pelo menos ${String(min)} caractere(s)`,
          `Must contain at least ${String(min)} character(s)`,
        );
      }
      if (typ === 'number') {
        return t(
          `O número deve ser maior ou igual a ${String(min)}`,
          `Number must be greater than or equal to ${String(min)}`,
        );
      }
      if (typ === 'array') {
        return t(
          `Informe pelo menos ${String(min)} item(ns)`,
          `Array must contain at least ${String(min)} element(s)`,
        );
      }
      if (typ === 'bigint') {
        return t(
          `O valor deve ser >= ${String(min)}`,
          `Value must be >= ${String(min)}`,
        );
      }
      if (typ === 'date') {
        return t('Data muito cedo', 'Date too early');
      }
      if (typ === 'set') {
        return t(
          `O conjunto deve ter pelo menos ${String(min)} item(ns)`,
          `Set must contain at least ${String(min)} element(s)`,
        );
      }
      return t('Valor abaixo do mínimo', 'Value too small');
    }
    case 'too_big': {
      const max = issue.maximum;
      const typ = issue.type;
      const exact = issue.exact === true;
      if (typ === 'string') {
        if (exact) {
          return t(
            `O texto deve ter exatamente ${String(max)} caractere(s)`,
            `String must contain exactly ${String(max)} character(s)`,
          );
        }
        return t(
          `No máximo ${String(max)} caractere(s)`,
          `Must contain at most ${String(max)} character(s)`,
        );
      }
      if (typ === 'number') {
        return t(
          `O número deve ser menor ou igual a ${String(max)}`,
          `Number must be less than or equal to ${String(max)}`,
        );
      }
      if (typ === 'array') {
        return t(
          `No máximo ${String(max)} item(ns)`,
          `Array must contain at most ${String(max)} element(s)`,
        );
      }
      if (typ === 'bigint') {
        return t(
          `O valor deve ser <= ${String(max)}`,
          `Value must be <= ${String(max)}`,
        );
      }
      if (typ === 'date') {
        return t('Data muito tarde', 'Date too late');
      }
      if (typ === 'set') {
        return t(
          `No máximo ${String(max)} item(ns) no conjunto`,
          `Set must contain at most ${String(max)} element(s)`,
        );
      }
      return t('Valor acima do máximo', 'Value too large');
    }
    case 'invalid_date': {
      return t('Data inválida', 'Invalid date');
    }
    case 'invalid_intersection_types': {
      return t('Interseção de tipos inválida', 'Invalid intersection types');
    }
    case 'not_multiple_of': {
      return t(
        `O valor deve ser múltiplo de ${String(issue.multipleOf)}`,
        `Value must be a multiple of ${String(issue.multipleOf)}`,
      );
    }
    case 'not_finite': {
      return t('O número deve ser finito', 'Number must be finite');
    }
    case 'custom': {
      return issue.message;
    }
    case 'invalid_arguments': {
      const inner = issue.argumentsError.issues[0];
      if (inner) {
        return translateZodIssue(inner, t);
      }
      return t('Argumentos inválidos', 'Invalid arguments');
    }
    case 'invalid_return_type': {
      const inner = issue.returnTypeError.issues[0];
      if (inner) {
        return translateZodIssue(inner, t);
      }
      return t('Tipo de retorno inválido', 'Invalid return type');
    }
    default: {
      return (issue as ZodIssue).message;
    }
  }
}

export function formatZodIssues(
  issues: ZodIssue[],
  t: Translator,
  options?: { withPath?: boolean },
): string {
  const withPath = options?.withPath ?? false;
  return issues
    .map((issue) => {
      const text = translateZodIssue(issue, t);
      if (withPath && issue.path.length > 0) {
        return `${issue.path.join('.')}: ${text}`;
      }
      return text;
    })
    .join(' · ');
}
