// Agente "eBay": usa l'API ufficiale Browse di eBay Italia, annunci piu' recenti
import { get, parsePrice } from '../utils/http.js';

let token = null;
let tokenExp = 0;

async function getToken(cfg) {
  if (token && Date.now() < tokenExp) return token;
  const auth = Buffer.from(`${cfg.ebayId}:${cfg.ebaySecret}`).toString('base64');
  const data = await get('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    json: true,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope'
  });
  token = data.access_token;
  tokenExp = Date.now() + (data.expires_in - 60) * 1000;
  return token;
}

export default {
  name: 'ebay',
  enabled: (cfg) => Boolean(cfg.ebayId && cfg.ebaySecret && cfg.watchlist.ebay_queries?.length),
  async fetch(cfg) {
    const t = await getToken(cfg);
    const items = [];
    for (const q of cfg.watchlist.ebay_queries) {
      const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}` +
        `&limit=50&sort=newlyListed&filter=buyingOptions:%7BFIXED_PRICE%7D,priceCurrency:EUR`;
      try {
        const data = await get(url, { json: true, headers: { Authorization: `Bearer ${t}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_IT' } });
        for (const it of data.itemSummaries || []) {
          items.push({
            id: `ebay:${it.itemId}`,
            source: 'ebay',
            url: it.itemWebUrl,
            title: it.title,
            price: parsePrice(it.price?.value),
            currency: it.price?.currency || 'EUR',
            refPrice: parsePrice(it.marketingPrice?.originalPrice?.value),
            group: `ebay-q:${q}` // per confrontare con il prezzo tipico della ricerca
          });
        }
      } catch (e) {
        console.error(`[ebay] "${q}": ${e.message}`);
      }
    }
    return items;
  }
};
