import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AlertService } from '@/services/alert.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ alertId: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { alertId } = await ctx.params;
    const alert = await AlertService.acknowledge(session.user.id, alertId);
    return NextResponse.json(alert);
  } catch (e) {
    return toErrorResponse(e);
  }
}
