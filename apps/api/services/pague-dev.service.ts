import { loadEnv } from '@monitor/shared';

export interface StaticQrCodeRequest {
    amount: number;
    description: string;
    projectId?: string;
    externalReference?: string;
    metadata?: Record<string, any>;
}

export interface StaticQrCodeResponse {
    id: string;
    status: string;
    amount: number;
    currency: string;
    pixCopyPaste: string;
    createdAt: string;
    qrCodeBase64: string;
    externalReference?: string;
}

export class PagueDevService {
    private static getHeaders() {
        const env = loadEnv();
        const apiKey = env.PAGUE_DEV_API_KEY;
        if (!apiKey) {
            throw new Error('PAGUE_DEV_API_KEY is not configured');
        }
        return {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
        };
    }

    static async createStaticQrCode(data: StaticQrCodeRequest): Promise<StaticQrCodeResponse> {
        const headers = this.getHeaders();
        const res = await fetch('https://api.pague.dev/v1/pix/qrcode-static', {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Pague Dev API error: ${res.status} - ${errorText}`);
        }

        return res.json();
    }
}
