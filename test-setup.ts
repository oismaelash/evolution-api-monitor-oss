import { execSync } from 'child_process';

export async function setup() {
  console.log('Starting test containers...');
  execSync('docker compose -f docker-compose.test.yml up -d --wait', { stdio: 'inherit' });
  
  // Set env vars for tests
  process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/test_db?schema=public';
  process.env.REDIS_URL = 'redis://localhost:6380';
  
  // Run migrations
  console.log('Running database migrations...');
  execSync('npm run db:migrate:deploy', { stdio: 'inherit', env: { ...process.env } });
}

export async function teardown() {
  console.log('Stopping test containers...');
  execSync('docker compose -f docker-compose.test.yml down -v', { stdio: 'inherit' });
}
