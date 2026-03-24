import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@monitor/database';
import { LogLevel } from '@monitor/shared';

export async function POST(req: NextRequest) {
    try {
        const { parseCustomerWebhook } = await import('@pilot-status/sdk');
        const body = await req.json();
        const event = parseCustomerWebhook(body);

        const data = event.data as any;
        const messageId = data.messageId;

        if (!messageId) {
            return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
        }

        // Find the alert by the pilotStatusId stored in the payload
        // Note: This is an expensive query if not indexed. In production, consider adding a dedicated field.
        const alert = await prisma.alert.findFirst({
            where: {
                payload: {
                    path: ['pilotStatusId'],
                    equals: messageId,
                },
            },
            include: { number: true },
        });

        if (!alert) {
            // It might be a message not sent by this system or we haven't stored the ID yet
            return NextResponse.json({ ok: true, note: 'Alert not found' });
        }

        if (event.event === 'message.delivered' || event.event === 'message.read') {
            await prisma.alert.update({
                where: { id: alert.id },
                data: { delivered: true },
            });
        }

        if (event.event === 'message.failed') {
            await prisma.alert.update({
                where: { id: alert.id },
                data: { deliveryError: data.errorMessage || 'Unknown error' },
            });

            await prisma.log.create({
                data: {
                    numberId: alert.numberId,
                    projectId: alert.number.projectId,
                    level: LogLevel.ERROR as never,
                    event: 'alert_delivery_failed',
                    meta: { messageId, error: data.errorMessage },
                },
            });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('Pilot Status webhook error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
