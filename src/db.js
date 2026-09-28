import { createClient } from '@supabase/supabase-js';
import cfg from './config.js';

const sb = cfg.supabaseUrl && cfg.supabaseKey ? createClient(cfg.supabaseUrl, cfg.supabaseKey) : null;
if (!sb) console.warn('⚠️  Supabase non configurato: modalita\' prova (memoria temporanea)');

const mem = { prices: new Map(), alerts: new Set() };

// Per eBay confrontiamo con lo storico della ricerca (group), per il resto col prodotto stesso
const key = (item) => item.group || item.id;

export async function getHistory(item, n) {
  if (!sb) return (mem.prices.get(key(item)) || []).slice(-n);
  const { data, error } = await sb.from('price_history').select('price').eq('series', key(item))
    .order('seen_at', { ascending: false }).limit(n);
  if (error) throw error;
  return data;
}

export async function savePrice(item) {
  if (item.price === null || item.price === undefined) return;
  if (!sb) {
    const k = key(item);
    mem.prices.set(k, [...(mem.prices.get(k) || []), { price: item.price }]);
    return;
  }
  await sb.from('products').upsert({
    id: item.id, source: item.source, url: item.url, title: item.title,
    currency: item.currency, last_price: item.price, last_seen: new Date().toISOString()
  });
  await sb.from('price_history').insert({ product_id: item.id, series: key(item), price: item.price });
}

export async function alertExists(item) {
  if (!sb) return mem.alerts.has(`${item.id}|${item.price}`);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data } = await sb.from('alerts').select('id').eq('product_id', item.id)
    .eq('price', item.price ?? -1).gte('created_at', since).limit(1);
  return Boolean(data?.length);
}

export async function saveAlert(item, verdict) {
  if (!sb) { mem.alerts.add(`${item.id}|${item.price}`); return; }
  await sb.from('alerts').insert({
    product_id: item.id, title: item.title, url: item.url,
    price: item.price ?? -1, ref_price: verdict.ref, reasons: verdict.reasons.join(' | ')
  });
}
