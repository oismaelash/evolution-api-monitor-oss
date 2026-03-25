import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { prisma } from '@monitor/database';
import { resetEnvCacheForTests } from '@monitor/shared';

describe('Projects Integration', () => {
  let userId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      }
    });
    userId = user.id;
  });

  beforeEach(async () => {
    resetEnvCacheForTests();
    await prisma.project.deleteMany();
  });

  it('should create a project with default config', async () => {
    const project = await prisma.project.create({
      data: {
        userId,
        name: 'My Test Project',
        evolutionUrl: 'http://test-evo.com',
        evolutionApiKey: 'secret123',
        config: {
          create: {} // Should use schema defaults
        }
      },
      include: {
        config: true
      }
    });

    expect(project.name).toBe('My Test Project');
    expect(project.config).toBeDefined();
    expect(project.config?.pingInterval).toBe(300);
    expect(project.config?.maxRetries).toBe(2);
  });

  it('should list projects for a user', async () => {
    await prisma.project.create({
      data: {
        userId,
        name: 'Proj 1',
        evolutionUrl: 'http://test-evo.com',
        evolutionApiKey: 'secret123'
      }
    });

    const projects = await prisma.project.findMany({
      where: { userId }
    });

    expect(projects.length).toBe(1);
    expect(projects[0].name).toBe('Proj 1');
  });
});
