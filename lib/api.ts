export const ROTP_BASE = 'https://www.rumahotp.io';

export function getApiKey(): string {
  const key = process.env.RUMAHOTP_API_KEY;
  if (!key) {
    throw new Error('RUMAHOTP_API_KEY tidak ditemukan di environment.');
  }
  return key;
}

export function buildUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const apiKey = getApiKey();
  const url = new URL(ROTP_BASE + path);
  url.searchParams.set('apikey', apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function rotpFetch(path: string, params: Record<string, string | number | undefined> = {}) {
  const url = buildUrl(path, params);
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

export function applyMarkup(price: number): number {
  if (!price || isNaN(price)) return price;
  return price <= 15000 ? price + 500 : price + 1000;
}
