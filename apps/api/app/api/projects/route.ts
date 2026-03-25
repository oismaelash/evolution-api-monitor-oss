import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/services/project.service';
import { parsePagination } from '@monitor/shared';
import { toErrorResponse } from '@/lib/http';

export async function GET(req: NextRequest) {
  try {
    const userId = 'oss-user-id';
    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const result = await ProjectService.list(userId, page, limit);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = 'oss-user-id';
    const body = await req.json();
    const project = await ProjectService.create(userId, body);
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
