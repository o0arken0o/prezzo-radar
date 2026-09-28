// Agente "Negozi": legge i dati strutturati schema.org (JSON-LD) delle pagine prodotto
import * as cheerio from 'cheerio';
import { get, parsePrice, sleep } from '../utils/http.js';
import { allowed } from '../utils/robots.js';

function findProducts(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { node.forEach((n) => findProducts(n, out)); return out; }
  const type = [].concat(node['@type'] || []);
  if (type.includes('Product')) out.push(node);
  if (node['@graph']) findProducts(node['@graph'], out);
  return out;
}

function offerPrice(offers) {
  const o = [].concat(offers || [])[0];
  if (!o) return {};
  return {
    price: parsePrice(o.price ?? o.lowPrice ?? o.priceSpecification?.price),
    currency: o.priceCurrency || 'EUR',
    refPrice: parsePrice(o.highPrice) || null
  };
}

export default {
  name: 'negozi',
  enabled: (cfg) => cfg.watchlist.pages?.length > 0,
  async fetch(cfg) {
    const items = [];
    for (const url of cfg.watchlist.pages) {
      try {
        if (!(await allowed(url))) { console.log(`[negozi] robots.txt vieta ${url}`); continue; }
        const $ = cheerio.load(await get(url));
        let found = false;
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            for (const p of findProducts(JSON.parse($(el).contents().text()))) {
              const { price, currency, refPrice } = offerPrice(p.offers);
              if (price === null || price === undefined) continue;
              items.push({ id: `web:${url}`, source: 'negozi', url, title: p.name || url, price, currency, refPrice });
              found = true;
              return false;
            }
          } catch { /* JSON non valido */ }
        });
        if (!found) {
          const price = parsePrice($('meta[property="product:price:amount"]').attr('content'));
          if (price !== null) items.push({ id: `web:${url}`, source: 'negozi', url, title: $('title').text().trim(), price, currency: 'EUR' });
        }
      } catch (e) {
        console.error(`[negozi] ${url}: ${e.message}`);
      }
      await sleep(2000); // gentile con i server
    }
    return items;
  }
};
