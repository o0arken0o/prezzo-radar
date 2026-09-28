# 🎯 Prezzo Radar

Tre agenti che lavorano 24/7 cercando **prezzi bassissimi** ed **errori di prezzo** (es. 0 € invece di 50 €) e ti avvisano subito su **Telegram**.

| Agente | Cosa fa |
|---|---|
| **negozi** | Controlla le pagine prodotto in `watchlist.json` leggendo i dati schema.org (rispetta robots.txt) |
| **ebay** | Usa l'API ufficiale eBay Italia sugli annunci appena pubblicati |
| **offerte** | Legge i feed RSS dei siti di offerte e cerca parole tipo "errore di prezzo" |

Ogni prezzo viene salvato su Supabase. Scatta l'allerta quando:
- il prezzo è **≤ 0,50 €** su un prodotto che vale di più → 🚨 prezzo zero
- il prezzo è **sotto del 60%** rispetto al prezzo pieno o alla media storica → 📉
- il titolo contiene parole chiave sospette → 🔎

Nessuna allerta doppia per lo stesso prezzo nelle 24 ore.

## Avvio in 5 passi

1. **Supabase**: crea un progetto, apri *SQL Editor*, incolla `supabase/schema.sql` ed esegui.
2. **Telegram**: crea un bot con @BotFather (ti dà il token), scrivigli un messaggio, prendi il tuo chat id con @userinfobot.
3. **eBay** (opzionale): chiavi gratuite su developer.ebay.com → Application Keys (Production).
4. **GitHub**: *Settings → Secrets and variables → Actions* → aggiungi `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`.
5. Modifica `watchlist.json` e vai su *Actions → Prezzo Radar → Run workflow* per il primo giro. Poi parte da solo ogni 15 minuti.

## Prova sul computer

```bash
npm install
cp .env.example .env   # compila i valori
node --env-file=.env src/index.js          # un giro
node --env-file=.env src/index.js --loop   # sempre acceso
```
Senza Supabase/Telegram funziona lo stesso in modalità prova: le allerte escono nel terminale.

## Regolare la sensibilità
Nel `.env` (o nei secrets): `DROP_PCT`, `ZERO_THRESHOLD`, `MIN_REF_PRICE`, `LOOP_MINUTES`.

## Aggiungere un agente
Crea un file in `src/sources/` che esporta `{ name, enabled(cfg), fetch(cfg) }` e restituisce prodotti `{ id, source, url, title, price, currency, refPrice? }`, poi aggiungilo in `src/index.js`.

## ⚠️ Da sapere
- In Italia un errore di prezzo **evidente** permette spesso al venditore di annullare l'ordine (errore riconoscibile, art. 1428 c.c.): l'allerta non garantisce il guadagno.
- Amazon e molti grandi siti vietano lo scraping nei termini d'uso: per Amazon usare API ufficiali (es. Keepa o Amazon PA-API).
- Rivendere in modo abituale richiede la partita IVA.
