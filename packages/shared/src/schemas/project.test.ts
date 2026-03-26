import { describe, expect, it } from 'vitest';
import { createProjectSchema, updateProjectSchema, projectConfigSchema } from './project.js';

describe('Project Schemas', () => {
  describe('createProjectSchema', () => {
    it('parses valid input', () => {
      const parsed = createProjectSchema.parse({
        name: 'proj',
        evolutionUrl: 'http://example.com',
        evolutionApiKey: 'key',
      });
      expect(parsed.name).toBe('proj');
    });

    it('preprocesses alertPhone empty string to undefined', () => {
      const parsed = createProjectSchema.parse({
        name: 'proj',
        evolutionUrl: 'http://example.com',
        evolutionApiKey: 'key',
        alertPhone: '   ',
      });
      expect(parsed.alertPhone).toBeUndefined();
    });

    it('allows valid alertPhone', () => {
      const parsed = createProjectSchema.parse({
        name: 'proj',
        evolutionUrl: 'http://example.com',
        evolutionApiKey: 'key',
        alertPhone: '+5511999999999',
      });
      expect(parsed.alertPhone).toBe('+5511999999999');
    });

    it('ignores non-string alertPhone preprocess', () => {
      expect(() => createProjectSchema.parse({
        name: 'proj',
        evolutionUrl: 'http://example.com',
        evolutionApiKey: 'key',
        alertPhone: 123, // not string, falls back to validation failure
      })).toThrow();
    });
  });

  describe('updateProjectSchema', () => {
    it('preprocesses alertPhone empty string to null', () => {
      const parsed = updateProjectSchema.parse({
        alertPhone: '   ',
      });
      expect(parsed.alertPhone).toBeNull();
    });

    it('allows null alertPhone', () => {
      const parsed = updateProjectSchema.parse({
        alertPhone: null,
      });
      expect(parsed.alertPhone).toBeNull();
    });

    it('trims valid alertPhone', () => {
      const parsed = updateProjectSchema.parse({
        alertPhone: ' +5511999999999 ',
      });
      expect(parsed.alertPhone).toBe('+5511999999999');
    });

    it('ignores non-string for update', () => {
      expect(() => updateProjectSchema.parse({ alertPhone: 123 })).toThrow();
    });

    it('preprocesses alertPhone undefined to undefined', () => {
      const parsed = updateProjectSchema.parse({ alertPhone: undefined });
      expect(parsed.alertPhone).toBeUndefined();
    });
  });

  describe('projectConfigSchema', () => {
    it('preprocesses alertEmail empty string to null', () => {
      const parsed = projectConfigSchema.parse({ alertEmail: '' });
      expect(parsed.alertEmail).toBeNull();
    });

    it('preprocesses smtpFrom empty string to null', () => {
      const parsed = projectConfigSchema.parse({ smtpFrom: '' });
      expect(parsed.smtpFrom).toBeNull();
    });
  });
});
