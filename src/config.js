import fs from 'node:fs';

const num = (v, d) => (v === undefined || v === '' ? d : Number(v));
const watchlist = JSON.parse(fs.readFileSync(new URL('../watchlist.json', import.meta.url)));

export default {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChat: process.env.TELEGRAM_CHAT_ID,
  ebayId: process.env.EBAY_CLIENT_ID,
  ebaySecret: process.env.EBAY_CLIENT_SECRET,
  dropPct: num(process.env.DROP_PCT, 0.6),
  zeroThreshold: num(process.env.ZERO_THRESHOLD, 0.5),
  minRefPrice: num(process.env.MIN_REF_PRICE, 5),
  historySize: num(process.env.HISTORY_SIZE, 20),
  loopMinutes: num(process.env.LOOP_MINUTES, 15),
  watchlist
};
