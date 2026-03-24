import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BillingService } from '@/services/billing.service';
import { toErrorResponse } from '@/lib/http';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const result = await BillingService.getSubscription(session.user.id);
    return NextResponse.json({ data: result });
  } catch (e) {
    return toErrorResponse(e);
  }
}
