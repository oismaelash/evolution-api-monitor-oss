import { NextRequest, NextResponse } from 'next/server';
import { AlertService } from '@/services/alert.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ alertId: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { alertId } = await ctx.params;
    const alert = await AlertService.acknowledge(userId, alertId);
    return NextResponse.json(alert);
  } catch (e) {
    return toErrorResponse(e);
  }
}
