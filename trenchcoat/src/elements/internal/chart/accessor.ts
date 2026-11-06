/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/data/accessor.ts. */
/** Reading fields from rows: getters, number and date coercion, unique values */
import { toDate } from "./format";
import type { Accessor } from "./types";

/**
  * Whether a row has the field. Names inherited from Object.prototype (constructor, toString) aren't fields;
  * a class instance's getters (on its prototype) are
 */
export function hasField(o: object, k: string): boolean {
  return Object.hasOwn(o, k) || (k in o && !(k in {}));
}

function field(d: unknown, k: string): unknown {
  if (d === null || d === undefined) return undefined;
  if (typeof d !== "object") return undefined;
  const o = d as Record<string, unknown>;
  if (hasField(o, k)) return o[k];
  if (k.includes(".")) {
    let cur: unknown = o;
    for (const p of k.split(".")) {
      if (cur === null || typeof cur !== "object" || !hasField(cur, p)) return undefined;
      cur = (cur as Record<string, unknown>)[p];
    }
    return cur;
  }
  return undefined;
}

/** Strings such as "1,234", "12%", "₩5,000" or " 3.5 " read as numbers. NaN when they can't be read ("$", "1,2,3" too) */
export function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") {
    const s = v.trim();
    const neg = /^\(.*\)$/.test(s);
    const body = s.replace(/[()\s%₩$€£¥]/g, "").replace(/^\+/, "");
    // No digits left, or misplaced thousands commas (1,2,3), isn't a number. The same rule as coerceCell
    if (!body || (body.includes(",") && !/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(body))) return NaN;
    const n = Number(body.replace(/,/g, ""));
    return Number.isFinite(n) ? (neg ? -n : n) : NaN;
  }
  if (v instanceof Date) return v.getTime();
  if (typeof v === "boolean") return v ? 1 : 0;
  return NaN;
}

export function getter<T>(a: Accessor<T, unknown> | undefined, def: string): (d: T, i: number) => unknown {
  if (typeof a === "function") return a;
  const k = a ?? def;
  return (d) => field(d, k);
}

export function numGetter<T>(a: Accessor<T, unknown> | undefined, def: string): (d: T, i: number) => number {
  const g = getter(a, def);
  return (d, i) => toNumber(g(d, i));
}

export function strGetter<T>(a: Accessor<T, unknown> | undefined, def: string): (d: T, i: number) => string {
  const g = getter(a, def);
  return (d, i) => {
    const v = g(d, i);
    if (v === undefined || v === null) return "";
    // As a local date. toISOString is UTC, so midnight east of UTC would be the day before; shift by the offset
    if (v instanceof Date) return new Date(v.getTime() - v.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    return String(v);
  };
}

export function dateGetter<T>(a: Accessor<T, unknown> | undefined, def: string): (d: T, i: number) => Date | null {
  const g = getter(a, def);
  return (d, i) => toDate(g(d, i));
}

/** The name a field accessor points at when the data lacks it (for validation) */
export function missingField<T>(a: Accessor<T, unknown> | undefined, def: string, data: readonly T[]): string | null {
  if (typeof a === "function" || !data.length) return null;
  const k = a ?? def;
  const sample = data.slice(0, 20);
  return sample.some((d) => field(d, k) !== undefined) ? null : k;
}

/** Unique values in the order they first appear */
export function uniq(xs: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs)
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  return out;
}
