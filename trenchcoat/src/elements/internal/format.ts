/*
 * Number formats several elements share (remediation 5.0): run durations, money and counts, as the run views write them.
 */
const SEC = 1000;

/** A run's duration: 420ms · 3.4s · 48s · 2m 05s */
export function duration(ms: number) {
  if (ms < SEC) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 10 * SEC) return `${(ms / SEC).toFixed(1)}s`;
  const s = Math.round(ms / SEC);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

/** A cost in dollars at the precision that matters: $0 · $0.004 · $1.27 · $1,240 */
export function dollars(n: number) {
  return n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(3)}` : n < 100 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString("en-US")}`;
}

/** A token or item count: 940 · 3.4k · 48k */
export function compact(n: number) {
  return n < 1000 ? String(n) : n < 10_000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n / 1000)}k`;
}
