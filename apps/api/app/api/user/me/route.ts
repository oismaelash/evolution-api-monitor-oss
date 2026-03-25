import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { AppError } from '@monitor/shared';

import { authOptions } from '@/lib/auth';
import { UserService } from '@/services/user.service';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await UserService.updateDisplayName(session.user.id, body);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json(
        { error: e.message, code: e.code, meta: e.meta },
        { status: e.statusCode },
      );
    }
    throw e;
  }
}
