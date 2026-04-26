import { NextResponse } from 'next/server';
import { rotpFetch } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const number_id = searchParams.get('number_id') || '';
    const provider_id = searchParams.get('provider_id') || '';
    const operator_id = searchParams.get('operator_id') || undefined;
    const params: Record<string, string> = { number_id, provider_id };
    if (operator_id) params.operator_id = operator_id;
    const r = await rotpFetch('/api/v2/orders', params);
    return NextResponse.json(r.data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
