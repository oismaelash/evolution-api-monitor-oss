import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PagueDevService, StaticQrCodeRequest } from '@/services/pague-dev.service';
import { toErrorResponse } from '@/lib/http';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json() as StaticQrCodeRequest;

        // Validation (Basic)
        if (!body.amount || body.amount < 1) {
            return NextResponse.json({ error: 'Amount must be >= 1' }, { status: 400 });
        }
        if (!body.description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        const result = await PagueDevService.createStaticQrCode(body);

        return NextResponse.json(result);
    } catch (e) {
        return toErrorResponse(e);
    }
}
