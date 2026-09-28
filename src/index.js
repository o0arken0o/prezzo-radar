import cfg from './config.js';
import * as db from './db.js';
import { evaluate } from './detect.js';
import { notify } from './notify/telegram.js';
import { sleep } from './utils/http.js';
import negozi from './sources/jsonld.js';
import ebay from './sources/ebay.js';
import offerte from './sources/rss.js';

const agents = [negozi, ebay, offerte].filter((a) => a.enabled(cfg));

async function handleItem(item) {
  const history = await db.getHistory(item, cfg.historySize);
  const verdict = evaluate(item, history, cfg); // prima di salvare, cosi' il prezzo attuale non falsa il confronto
  await db.savePrice(item);
  if (verdict && !(await db.alertExists(item))) {
    await db.saveAlert(item, verdict);
    await notify(item, verdict);
  }
}

async function runOnce() {
  console.log(`\n⏱  Giro iniziato ${new Date().toLocaleString('it-IT')} — agenti attivi: ${agents.map((a) => a.name).join(', ') || 'nessuno'}`);
  const results = await Promise.allSettled(agents.map((a) => a.fetch(cfg))); // gli agenti lavorano in parallelo
  for (const [i, r] of results.entries()) {
    const name = agents[i].name;
    if (r.status === 'rejected') { console.error(`[${name}] errore: ${r.reason?.message}`); continue; }
    console.log(`[${name}] ${r.value.length} prodotti letti`);
    for (const item of r.value) {
      try { await handleItem(item); } catch (e) { console.error(`[${name}] ${item.id}: ${e.message}`); }
    }
  }
}

if (process.argv.includes('--loop')) {
  for (;;) {
    await runOnce();
    await sleep(cfg.loopMinutes * 60 * 1000);
  }
} else {
  await runOnce();
}
