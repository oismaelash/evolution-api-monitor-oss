import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (process.env.CLOUD_BILLING !== 'true') {
    return NextResponse.json({ error: 'Billing disabled' }, { status: 404 });
  }
  const raw = await req.text();
  return NextResponse.json({ received: true, bytes: raw.length }, { status: 200 });
}
