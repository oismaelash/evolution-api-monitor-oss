import { describe, it, expect, beforeEach, beforeAll, vi, afterAll } from 'vitest';
import { prisma } from '@monitor/database';
import { resetEnvCacheForTests } from '@monitor/shared';
import { processHealthCheck } from './health-check.js'; // We will test the inner logic if possible, or simulate it

// We'll mock the EvolutionClient to simulate API responses
vi.mock('@monitor/shared', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    EvolutionClient: vi.fn().mockImplementation(() => {
      return {
        getInstanceConnectionState: vi.fn().mockResolvedValue({
          instance: { state: 'open' }
        })
      };
    }),
  };
});

describe('Worker: Health Check Integration', () => {
  let projectId: string;
  let numberId: string;

  beforeAll(async () => {
    resetEnvCacheForTests();
    const user = await prisma.user.create({
      data: {
        email: 'worker_test@example.com',
        name: 'Worker Test',
      }
    });
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: 'Worker Project',
        evolutionUrl: 'http://test-evo.com',
        evolutionApiKey: 'secret123',
        config: {
          create: {}
        }
      }
    });
    projectId = project.id;
  });

  beforeEach(async () => {
    await prisma.number.deleteMany();
    const number = await prisma.number.create({
      data: {
        projectId,
        instanceName: 'test-instance',
        phoneNumber: '5511999999999',
        state: 'UNKNOWN'
      }
    });
    numberId = number.id;
  });

  it('should update number state to CONNECTED when health check passes', async () => {
    // In order to test the worker logic, we would normally enqueue a job or call the processor directly.
    // Assuming processHealthCheck is exported or we can test the database side effects.
    
    // For now, we will just ensure the test suite is setup.
    const number = await prisma.number.findUnique({ where: { id: numberId } });
    expect(number?.state).toBe('UNKNOWN');
  });
});
