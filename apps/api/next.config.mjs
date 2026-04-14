import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** CJS package; avoid Turbopack/SSR bundle resolution issues (bcryptjs v3 is ESM-only). */
  serverExternalPackages: ['bcryptjs'],
  transpilePackages: ['@monitor/shared', '@monitor/database'],
  output: 'standalone',
  // Standalone Docker: trace files from monorepo root (moved out of experimental in Next 16)
  outputFileTracingRoot: monorepoRoot,
  // npm workspaces hoist deps to repo root; Turbopack defaults to apps/api and won't resolve outside it
  turbopack: {
    root: monorepoRoot,
  },
  webpack: (config, context) => {
    if (context.dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
