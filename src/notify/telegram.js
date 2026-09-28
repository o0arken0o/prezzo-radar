import cfg from '../config.js';

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function notify(item, verdict) {
  const text = [
    `<b>${esc(verdict.reasons.join('\n'))}</b>`,
    '',
    esc(item.title),
    `💶 Prezzo: <b>${item.price ?? '?'} ${item.currency || 'EUR'}</b>` + (verdict.ref ? ` (rif. ${Number(verdict.ref).toFixed(2)})` : ''),
    `🤖 Agente: ${item.source}`,
    item.url
  ].join('\n');

  if (!cfg.telegramToken || !cfg.telegramChat) { console.log('\n--- ALLERTA ---\n' + text); return; }
  const res = await fetch(`https://api.telegram.org/bot${cfg.telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: cfg.telegramChat, text, parse_mode: 'HTML', disable_web_page_preview: false })
  });
  if (!res.ok) console.error('Telegram errore', res.status, await res.text());
}
