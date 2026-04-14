import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    globalSetup: './test-setup.ts',
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    alias: {
      '@': path.join(__dirname, 'apps/api'),
      '@monitor/shared': path.join(__dirname, 'packages/shared/src/index.ts'),
      '@monitor/shared/oss-access-process-env': path.join(
        __dirname,
        'packages/shared/src/oss-access-process-env.ts',
      ),
      '@monitor/database': path.join(__dirname, 'packages/database/src/index.ts'),
    },
  },
});
