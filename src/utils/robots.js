import { get } from './http.js';

// Rispetta robots.txt (versione semplice: regole Disallow per User-agent: *)
const cache = new Map();

function parse(txt) {
  const rules = [];
  let applies = false;
  for (const raw of txt.split('\n')) {
    const line = raw.split('#')[0].trim();
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    if (k === 'user-agent') applies = v === '*';
    else if (applies && k === 'disallow' && v) rules.push(v.replace(/\*.*$/, ''));
  }
  return rules;
}

export async function allowed(url) {
  const u = new URL(url);
  if (!cache.has(u.origin)) {
    let rules = [];
    try { rules = parse(await get(`${u.origin}/robots.txt`)); } catch { /* nessun robots */ }
    cache.set(u.origin, rules);
  }
  const path = u.pathname + u.search;
  return !cache.get(u.origin).some((r) => r && path.startsWith(r));
}
