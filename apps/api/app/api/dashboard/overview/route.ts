import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/services/dashboard.service';
import { toErrorResponse } from '@/lib/http';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await DashboardService.getOverview(session.user.id);
    return NextResponse.json(payload);
  } catch (e) {
    return toErrorResponse(e);
  }
}
