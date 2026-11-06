/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/core/format.ts. */
/** Number and date formats, through Intl; the default locale is en-US */
export type FormatName = "number" | "integer" | "percent" | "ratio" | "compact" | "currency" | "decimal";
export type ValueFormatter = (v: number) => string;
export type FormatSpec = FormatName | ValueFormatter | (Intl.NumberFormatOptions & { suffix?: string; prefix?: string });

export const DEFAULT_LOCALE = "en-US";

const nfCache = new Map<string, Intl.NumberFormat>();
/** One decimal unless maximum digits are given; more when the minimum asks for more; a currency keeps its own digits (USD 2) */
function nf(locale: string, o: Intl.NumberFormatOptions): Intl.NumberFormat {
  const opts = o.maximumFractionDigits !== undefined || o.style === "currency" ? o : { ...o, maximumFractionDigits: Math.max(1, o.minimumFractionDigits ?? 0) };
  const key = locale + JSON.stringify(opts);
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, opts);
    nfCache.set(key, f);
  }
  return f;
}

/** Drops the "-0" of a negative that rounds to zero (-0.03 → "0", "-0%" → "0%"): zero when no digit is non-zero */
function dropNegativeZero(s: string): string {
  return /^[-\u2212]/.test(s) && !/[1-9]/.test(s) ? s.slice(1) : s;
}

export function formatNumber(v: number, opts: Intl.NumberFormatOptions & { locale?: string } = {}): string {
  if (!Number.isFinite(v)) return "-";
  const { locale = DEFAULT_LOCALE, ...rest } = opts;
  return dropNegativeZero(nf(locale, rest).format(v));
}

/** A 0–100 value as "42%"; one decimal only under 1% */
export function formatPercent(v: number, opts: Intl.NumberFormatOptions & { locale?: string } = {}): string {
  if (!Number.isFinite(v)) return "-";
  const a = Math.abs(v);
  return `${formatNumber(v, { maximumFractionDigits: a > 0 && a < 1 ? 1 : 0, ...opts })}%`;
}

/** A short number: 1.2K, 3.4M, 1.2B (Intl compact) */
export function formatCompact(v: number, opts: Intl.NumberFormatOptions & { locale?: string } = {}): string {
  if (!Number.isFinite(v)) return "-";
  const { locale = DEFAULT_LOCALE, ...rest } = opts;
  return dropNegativeZero(nf(locale, { notation: "compact", ...rest }).format(v));
}

/** Currency options: US dollars unless a currency is given, with that currency's own decimals */
const currencyOptions = (currency = "USD"): Intl.NumberFormatOptions => ({ style: "currency", currency });

export function formatCurrency(v: number, opts: Intl.NumberFormatOptions & { locale?: string } = {}): string {
  const { currency, ...rest } = opts;
  return formatNumber(v, { ...currencyOptions(currency), ...rest });
}

/** A formatter from a format name, Intl options or a function; each Intl instance is made once */
export function makeFormatter(spec: FormatSpec | undefined, locale = DEFAULT_LOCALE, fallback?: FormatName): ValueFormatter {
  if (typeof spec === "function") return spec;
  const fixed = (opts: Intl.NumberFormatOptions, suffix = "", prefix = ""): ValueFormatter => {
    const f = nf(locale, opts);
    return (v) => (Number.isFinite(v) ? `${prefix}${dropNegativeZero(f.format(v))}${suffix}` : "-");
  };
  if (spec && typeof spec === "object") {
    const { suffix = "", prefix = "", ...o } = spec;
    return fixed(o, suffix, prefix);
  }
  switch (spec ?? fallback) {
    case "integer":
      return fixed({ maximumFractionDigits: 0 });
    case "decimal":
      return fixed({ minimumFractionDigits: 1, maximumFractionDigits: 2 });
    case "percent":
      return (v) => formatPercent(v, { locale });
    case "ratio":
      return (v) => formatPercent(v * 100, { locale });
    case "compact":
      return (v) => formatCompact(v, { locale });
    case "currency":
      return fixed(currencyOptions());
    default:
      return fixed({ maximumFractionDigits: 1 });
  }
}

/** For axis ticks: large numbers short */
export function makeTickFormatter(spec: FormatSpec | undefined, locale = DEFAULT_LOCALE, maxAbs = 0): ValueFormatter {
  if (spec !== undefined) return makeFormatter(spec, locale);
  if (maxAbs >= 1e5) return (v) => formatCompact(v, { locale });
  return (v) => formatNumber(v, { locale });
}

/** Local midnight from year, month and day; a day that doesn't exist ("2024-02-30") is null, not next month */
function ymd(y: string | number, m: string | number, d: string | number = 1): Date | null {
  const t = new Date(+y, +m - 1, +d);
  return t.getMonth() === +m - 1 && t.getDate() === +d ? t : null;
}

/** Whether a value is a four-digit integer read as a year */
export const isYear = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1000 && (v as number) <= 9999;

/** A date from "2024-03", "2024-03-15", 20240315 (YYYYMMDD), a timestamp or a Date */
export function toDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return null;
    if (Number.isInteger(v)) {
      // Four digits are a year
      if (isYear(v)) return new Date(v, 0, 1);
      // Eight digits 19000101–21001231 are YYYYMMDD (those ms are the early hours of 1970-01-01, so they never clash with real timestamps)
      if (v >= 19000101 && v <= 21001231) return toDate(`${v}`);
    }
    return new Date(v);
  }
  if (typeof v === "string" && v.trim()) {
    const s = v.trim();
    const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(s) ?? /^(\d{4})[./](\d{1,2})[./](\d{1,2})\.?$/.exec(s) ?? /^(19\d\d|20\d\d|2100)(\d\d)(\d\d)$/.exec(s);
    if (m) return ymd(m[1], m[2], m[3]);
    if (/^\d{4}$/.test(s)) return new Date(Number(s), 0, 1);
    if (!/\d{4}/.test(s)) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const dfCache = new Map<string, Intl.DateTimeFormat>();
export function formatDate(v: unknown, opts: Intl.DateTimeFormatOptions & { locale?: string } = { month: "short", day: "numeric" }): string {
  const d = toDate(v);
  if (!d) return "-";
  const { locale = DEFAULT_LOCALE, ...rest } = opts;
  const key = locale + JSON.stringify(rest);
  let f = dfCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, rest);
    dfCache.set(key, f);
  }
  return f.format(d);
}
