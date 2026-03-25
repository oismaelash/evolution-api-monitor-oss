import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/services/project.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ projectId: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { projectId } = await ctx.params;
    const body = await req.json();
    const cfg = await ProjectService.upsertConfig(userId, projectId, body);
    return NextResponse.json(cfg);
  } catch (e) {
    return toErrorResponse(e);
  }
}
