const UA = process.env.USER_AGENT || 'PrezzoRadarBot/1.0';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function get(url, { json = false, headers = {}, method = 'GET', body } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      method,
      body,
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, 'Accept-Language': 'it-IT,it;q=0.9', ...headers }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
    return json ? res.json() : res.text();
  } finally {
    clearTimeout(t);
  }
}

// "3,99 €" / "1.299,00" / "12.50" -> numero
export function parsePrice(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  let s = String(v).replace(/[^\d.,]/g, '');
  if (!s) return null;
  if (s.includes(',') && s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
