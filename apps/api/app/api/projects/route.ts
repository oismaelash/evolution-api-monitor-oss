import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProjectService } from '@/services/project.service';
import { parsePagination } from '@pilot/shared';
import { toErrorResponse } from '@/lib/http';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const result = await ProjectService.list(session.user.id, page, limit);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const project = await ProjectService.create(session.user.id, body);
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
