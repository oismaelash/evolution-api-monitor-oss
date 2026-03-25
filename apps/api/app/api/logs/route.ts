import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LogService } from '@/services/log.service';
import { toErrorResponse } from '@/lib/http';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const result = await LogService.listGlobal(session.user.id, req.nextUrl.searchParams);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
