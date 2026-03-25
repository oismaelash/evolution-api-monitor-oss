import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    globalSetup: './test-setup.ts',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
