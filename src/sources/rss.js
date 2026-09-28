// Agente "Offerte": legge i feed RSS dei siti di offerte e cerca parole tipo "errore di prezzo"
import * as cheerio from 'cheerio';
import { get, parsePrice } from '../utils/http.js';

const HOT = /errore di prezzo|price error|prezzo sbagliato|glitch|bug di prezzo|gratis|0[,.]00\s?€/i;
const PRICE_RE = /(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s?€|€\s?(\d+(?:[.,]\d{1,2})?)/g;

export default {
  name: 'offerte',
  enabled: (cfg) => cfg.watchlist.rss_feeds?.length > 0,
  async fetch(cfg) {
    const items = [];
    for (const feed of cfg.watchlist.rss_feeds) {
      try {
        const $ = cheerio.load(await get(feed), { xmlMode: true });
        $('item, entry').each((_, el) => {
          const title = $(el).find('title').first().text().trim();
          const link = $(el).find('link').first().text().trim() || $(el).find('link').attr('href');
          if (!title || !link) return;
          const prices = [...title.matchAll(PRICE_RE)].map((m) => parsePrice(m[1] || m[2])).filter((p) => p !== null);
          items.push({
            id: `rss:${link}`,
            source: 'offerte',
            url: link,
            title,
            price: prices.length ? Math.min(...prices) : null,
            refPrice: prices.length > 1 ? Math.max(...prices) : null,
            currency: 'EUR',
            hint: HOT.test(title) ? 'Parola chiave: possibile errore di prezzo' : null
          });
        });
      } catch (e) {
        console.error(`[offerte] ${feed}: ${e.message}`);
      }
    }
    return items;
  }
};
