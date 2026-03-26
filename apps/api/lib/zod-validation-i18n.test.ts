import { describe, expect, it, vi } from 'vitest';
import type { ZodIssue } from 'zod';
import { translateZodIssue, formatZodIssues } from './zod-validation-i18n.js';

describe('Zod Validation I18n', () => {
  const t = vi.fn().mockImplementation((pt: string, _en: string) => pt);

  it('translates various invalid types', () => {
    const issue1 = { code: 'invalid_type', expected: 'string', received: 'number' } as unknown as ZodIssue;
    expect(translateZodIssue(issue1, t)).toBe('Tipo inválido: esperado string, recebido number');
    
    const issue2 = { code: 'invalid_literal' } as unknown as ZodIssue;
    expect(translateZodIssue(issue2, t)).toBe('Valor literal inválido');

    const issue3 = { code: 'unrecognized_keys', keys: ['a', 'b'] } as unknown as ZodIssue;
    expect(translateZodIssue(issue3, t)).toBe('Campos não reconhecidos: a, b');

    const issue4 = { code: 'invalid_union', unionErrors: [] } as unknown as ZodIssue;
    expect(translateZodIssue(issue4, t)).toBe('Valor inválido');

    const issue5 = { code: 'invalid_union_discriminator' } as unknown as ZodIssue;
    expect(translateZodIssue(issue5, t)).toBe('Valor de discriminador inválido');

    const issue6 = { code: 'invalid_enum_value', received: 'x' } as unknown as ZodIssue;
    expect(translateZodIssue(issue6, t)).toBe('Valor inválido: x');
  });

  it('translates invalid_string forms', () => {
    const issue1 = { code: 'invalid_string', validation: 'email' } as unknown as ZodIssue;
    expect(translateZodIssue(issue1, t)).toBe('E-mail inválido');

    const issue2 = { code: 'invalid_string', validation: 'url' } as unknown as ZodIssue;
    expect(translateZodIssue(issue2, t)).toBe('URL inválida');

    const issue3 = { code: 'invalid_string', validation: 'uuid' } as unknown as ZodIssue;
    expect(translateZodIssue(issue3, t)).toBe('UUID inválido');

    const issue4 = { code: 'invalid_string', validation: { includes: 'a' } } as unknown as ZodIssue;
    expect(translateZodIssue(issue4, t)).toBe('Formato de texto inválido');

    const issue5 = { code: 'invalid_string', validation: 'cuid' } as unknown as ZodIssue;
    expect(translateZodIssue(issue5, t)).toBe('Texto inválido');
  });

  it('translates too_small variations', () => {
    const s1 = { code: 'too_small', type: 'string', minimum: 5, exact: true } as unknown as ZodIssue;
    expect(translateZodIssue(s1, t)).toBe('O texto deve ter exatamente 5 caractere(s)');
    
    const s2 = { code: 'too_small', type: 'string', minimum: 5, exact: false } as unknown as ZodIssue;
    expect(translateZodIssue(s2, t)).toBe('Informe pelo menos 5 caractere(s)');

    const n1 = { code: 'too_small', type: 'number', minimum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(n1, t)).toBe('O número deve ser maior ou igual a 10');

    const a1 = { code: 'too_small', type: 'array', minimum: 1 } as unknown as ZodIssue;
    expect(translateZodIssue(a1, t)).toBe('Informe pelo menos 1 item(ns)');

    const b1 = { code: 'too_small', type: 'bigint', minimum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(b1, t)).toBe('O valor deve ser >= 10');

    const d1 = { code: 'too_small', type: 'date', minimum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(d1, t)).toBe('Data muito cedo');

    const set1 = { code: 'too_small', type: 'set', minimum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(set1, t)).toBe('O conjunto deve ter pelo menos 10 item(ns)');

    const other = { code: 'too_small', type: 'map', minimum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(other, t)).toBe('Valor abaixo do mínimo');
  });

  it('translates too_big variations', () => {
    const s1 = { code: 'too_big', type: 'string', maximum: 5, exact: true } as unknown as ZodIssue;
    expect(translateZodIssue(s1, t)).toBe('O texto deve ter exatamente 5 caractere(s)');
    
    const s2 = { code: 'too_big', type: 'string', maximum: 5, exact: false } as unknown as ZodIssue;
    expect(translateZodIssue(s2, t)).toBe('No máximo 5 caractere(s)');

    const n1 = { code: 'too_big', type: 'number', maximum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(n1, t)).toBe('O número deve ser menor ou igual a 10');

    const a1 = { code: 'too_big', type: 'array', maximum: 1 } as unknown as ZodIssue;
    expect(translateZodIssue(a1, t)).toBe('No máximo 1 item(ns)');

    const b1 = { code: 'too_big', type: 'bigint', maximum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(b1, t)).toBe('O valor deve ser <= 10');

    const d1 = { code: 'too_big', type: 'date', maximum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(d1, t)).toBe('Data muito tarde');

    const set1 = { code: 'too_big', type: 'set', maximum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(set1, t)).toBe('No máximo 10 item(ns) no conjunto');

    const other = { code: 'too_big', type: 'map', maximum: 10 } as unknown as ZodIssue;
    expect(translateZodIssue(other, t)).toBe('Valor acima do máximo');
  });

  it('translates remaining issues', () => {
    expect(translateZodIssue({ code: 'invalid_date' } as unknown as ZodIssue, t)).toBe('Data inválida');
    expect(translateZodIssue({ code: 'invalid_intersection_types' } as unknown as ZodIssue, t)).toBe('Interseção de tipos inválida');
    expect(translateZodIssue({ code: 'not_multiple_of', multipleOf: 2 } as unknown as ZodIssue, t)).toBe('O valor deve ser múltiplo de 2');
    expect(translateZodIssue({ code: 'not_finite' } as unknown as ZodIssue, t)).toBe('O número deve ser finito');
    expect(translateZodIssue({ code: 'custom', message: 'x' } as unknown as ZodIssue, t)).toBe('x');
    expect(translateZodIssue({ code: 'invalid_arguments', argumentsError: { issues: [] } } as unknown as ZodIssue, t)).toBe('Argumentos inválidos');
    expect(translateZodIssue({ code: 'invalid_return_type', returnTypeError: { issues: [] } } as unknown as ZodIssue, t)).toBe('Tipo de retorno inválido');
    expect(translateZodIssue({ code: 'unknown_code', message: 'fallback' } as unknown as ZodIssue, t)).toBe('fallback');
  });

  it('translates nested union/arguments/return errors', () => {
    const inner = { code: 'invalid_type', expected: 'string', received: 'number' };
    const union = { code: 'invalid_union', unionErrors: [{ issues: [inner] }] } as unknown as ZodIssue;
    expect(translateZodIssue(union, t)).toBe('Tipo inválido: esperado string, recebido number');

    const args = { code: 'invalid_arguments', argumentsError: { issues: [inner] } } as unknown as ZodIssue;
    expect(translateZodIssue(args, t)).toBe('Tipo inválido: esperado string, recebido number');

    const ret = { code: 'invalid_return_type', returnTypeError: { issues: [inner] } } as unknown as ZodIssue;
    expect(translateZodIssue(ret, t)).toBe('Tipo inválido: esperado string, recebido number');
  });

  it('formats multiple issues with path', () => {
    const issues = [
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['user', 'name'] },
      { code: 'too_small', type: 'string', minimum: 3, exact: false, path: ['user', 'bio'] }
    ] as unknown as ZodIssue[];
    
    const formatted = formatZodIssues(issues, t, { withPath: true });
    expect(formatted).toBe('user.name: Tipo inválido: esperado string, recebido number · user.bio: Informe pelo menos 3 caractere(s)');
  });

  it('formats multiple issues without path', () => {
    const issues = [
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['user', 'name'] }
    ] as unknown as ZodIssue[];
    
    const formatted = formatZodIssues(issues, t, { withPath: false });
    expect(formatted).toBe('Tipo inválido: esperado string, recebido number');
  });
});
