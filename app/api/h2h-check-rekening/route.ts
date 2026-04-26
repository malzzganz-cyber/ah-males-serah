import { NextResponse } from 'next/server';
import { rotpFetch } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bank_code = searchParams.get('bank_code') || '';
    const account_number = searchParams.get('account_number') || '';
    const r = await rotpFetch('/api/v1/h2h/check/rekening', {
      bank_code,
      account_number,
    });
    return NextResponse.json(r.data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
