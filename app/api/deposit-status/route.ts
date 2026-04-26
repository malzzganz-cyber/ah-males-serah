import { NextResponse } from 'next/server';
import { rotpFetch } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deposit_id = searchParams.get('deposit_id') || '';
    const r = await rotpFetch('/api/v2/deposit/get_status', { deposit_id });
    return NextResponse.json(r.data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
