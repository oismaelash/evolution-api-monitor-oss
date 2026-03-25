import { NextRequest, NextResponse } from 'next/server';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@monitor/database';
import { loadEnv, UserRole } from '@monitor/shared';

export async function GET(req: NextRequest) {
  const userId = 'oss-user-id';
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const env = loadEnv();
  const secret = req.headers.get('x-bull-board-secret') ?? req.nextUrl.searchParams.get('secret');
  if (env.BULL_BOARD_SECRET && secret !== env.BULL_BOARD_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const names = ['health-check', 'restart', 'alert', 'dead-letter'];
  try {
    const queues = await Promise.all(
      names.map(async (name) => {
        const q = new Queue(name, { connection: connection as never });
        const counts = await q.getJobCounts();
        return { name, ...counts };
      })
    );
    return NextResponse.json({ queues });
  } finally {
    connection.disconnect();
  }
}
