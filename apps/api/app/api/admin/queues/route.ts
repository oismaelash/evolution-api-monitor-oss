import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@monitor/database';
import { UserRole } from '@prisma/client';
import { loadEnv } from '@monitor/shared';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
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
