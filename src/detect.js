const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Ritorna null se e' tutto normale, altrimenti i motivi dell'allerta
export function evaluate(item, history, cfg) {
  const reasons = [];
  const past = history.map((h) => Number(h.price)).filter((p) => p > 0);
  const ref = item.refPrice || median(past);

  if (item.price !== null && item.price !== undefined) {
    if (item.price <= cfg.zeroThreshold && (!ref || ref > 1)) {
      reasons.push('🚨 PREZZO ZERO / QUASI ZERO');
    } else if (ref && ref >= cfg.minRefPrice && item.price < ref * (1 - cfg.dropPct)) {
      reasons.push(`📉 -${Math.round((1 - item.price / ref) * 100)}% rispetto al riferimento`);
    }
  }
  if (item.hint) reasons.push(`🔎 ${item.hint}`);
  return reasons.length ? { reasons, ref } : null;
}
