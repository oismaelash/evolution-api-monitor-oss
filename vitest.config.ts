import { defineConfig } from 'vitest/config';
import { URL } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    globalSetup: './test-setup.ts',
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    alias: {
      '@': new URL('./apps/api', import.meta.url).pathname,
      '@monitor/shared': new URL('./packages/shared/src/index.ts', import.meta.url).pathname,
      '@monitor/database': new URL('./packages/database/src/index.ts', import.meta.url).pathname,
    },
  },
});
