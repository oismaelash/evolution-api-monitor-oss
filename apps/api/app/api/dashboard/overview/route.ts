import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { toErrorResponse } from '@/lib/http';

export async function GET() {
  try {
    const userId = 'oss-user-id';
    const payload = await DashboardService.getOverview(userId);
    return NextResponse.json(payload);
  } catch (e) {
    return toErrorResponse(e);
  }
}
