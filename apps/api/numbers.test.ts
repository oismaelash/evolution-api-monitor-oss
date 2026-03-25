import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { prisma } from '@monitor/database';

describe('Numbers Integration', () => {
  let projectId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test_numbers@example.com',
        name: 'Test User',
      }
    });
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: 'Test Project for Numbers',
        evolutionUrl: 'http://test-evo.com',
        evolutionApiKey: 'secret123'
      }
    });
    projectId = project.id;
  });

  beforeEach(async () => {
    await prisma.number.deleteMany();
  });

  it('should create a number and default state to UNKNOWN', async () => {
    const number = await prisma.number.create({
      data: {
        projectId,
        instanceName: 'test-instance',
        phoneNumber: '5511999999999',
        label: 'Support Number'
      }
    });

    expect(number.instanceName).toBe('test-instance');
    expect(number.state).toBe('UNKNOWN');
    expect(number.monitored).toBe(true);
  });

  it('should enforce unique instanceName per project', async () => {
    await prisma.number.create({
      data: {
        projectId,
        instanceName: 'unique-instance'
      }
    });

    await expect(prisma.number.create({
      data: {
        projectId,
        instanceName: 'unique-instance'
      }
    })).rejects.toThrow();
  });
});
