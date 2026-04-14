import { execSync } from 'child_process';

export async function setup() {
  console.log('Starting test containers...');
  execSync('docker compose -f docker-compose.test.yml up -d --wait', { stdio: 'inherit' });
  
  // Set env vars for tests
  process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/test_db?schema=public';
  process.env.REDIS_URL = 'redis://localhost:6380';
  // Stable crypto + disable OSS access gate before any test file calls loadEnv() (order-independent).
  process.env.ENCRYPTION_KEY =
    process.env.ENCRYPTION_KEY ?? 'a'.repeat(64);
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? 'x'.repeat(32);
  process.env.APP_ACCESS_LOCK = 'false';
  
  // Run migrations
  console.log('Running database migrations...');
  execSync('npm run db:migrate:deploy', { stdio: 'inherit', env: { ...process.env } });
}

export async function teardown() {
  console.log('Stopping test containers...');
  execSync('docker compose -f docker-compose.test.yml down -v', { stdio: 'inherit' });
}
