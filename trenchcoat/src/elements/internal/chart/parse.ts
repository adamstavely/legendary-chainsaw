/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/data/parse.ts. */
/** Turning any data shape into rows: CSV, JSON, 2-D arrays, wide tables, signatures, downsampling */
import { toNumber } from "./accessor";

export type Cell = string | number | null;
export type CsvRow = Record<string, Cell>;

export interface ParseCSVOptions {
  /** The delimiter; by default picked from , \t and ; by looking at the first line */
  delimiter?: string;
  /** Cells that look numeric become numbers. Default true */
  typed?: boolean;
  /** The first line is the header. Default true */
  header?: boolean;
}

function detectDelimiter(src: string): string {
  const firstLine: string[] = [];
  let q = false;
  for (let i = 0; i < src.length && i < 4000; i++) {
    const c = src[i];
    if (c === '"') q = !q;
    else if (!q && (c === "\n" || c === "\r")) break;
    firstLine.push(q ? "" : c);
  }
  const line = firstLine.join("");
  const count = (d: string) => line.split(d).length - 1;
  const cands = [",", "\t", ";", "|"];
  let best = ",";
  let bc = 0;
  for (const d of cands) {
    const c = count(d);
    if (c > bc) {
      bc = c;
      best = d;
    }
  }
  return best;
}

const NUMERIC = /^[-+(]?[₩$€£¥]?\s?\d[\d,]*(\.\d+)?([eE][-+]?\d+)?\)?\s?%?$/;

/** One string cell as a typed value */
export function coerceCell(s: string): Cell {
  const t = s.trim();
  if (t === "") return null;
  // Codes with leading zeros (postcodes and the like) stay strings
  if (/^-?0\d/.test(t)) return t;
  if (NUMERIC.test(t) || /^[-+]?\.\d+$/.test(t)) {
    // Misplaced thousands commas (1,2,3) make toNumber NaN, so the cell stays text
    const n = toNumber(t);
    if (Number.isFinite(n)) return n;
  }
  return t;
}

/** RFC 4180 CSV parser: quotes, line breaks in cells, BOM and CRLF */
export function parseCSV(text: string, options: ParseCSVOptions = {}): CsvRow[] {
  const { typed = true, header = true } = options;
  const src = text.replace(/^\uFEFF/, "");
  if (!src.trim()) return [];
  const delim = options.delimiter ?? detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += c;
    } else if (c === '"' && !cell.trim()) {
      // A quote at a cell's start makes a quoted cell even after leading spaces (a, "b, c")
      q = true;
      cell = "";
    }
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const clean = rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
  if (!clean.length) return [];
  const conv = (s: string): Cell => (typed ? coerceCell(s) : s);
  if (!header) return clean.map((r) => Object.fromEntries(r.map((v, i) => [String(i), conv(v)])));
  const keys: string[] = [];
  const used = new Set<string>();
  clean[0].forEach((k, i) => {
    const base = k.trim() || `col${i + 1}`;
    let name = base;
    // On a clash, the first of _2, _3 … not taken yet (so a,a,a_2 doesn't give two a_2 and lose a column)
    for (let n = 2; used.has(name); n++) name = `${base}_${n}`;
    used.add(name);
    keys.push(name);
  });
  return clean.slice(1).map((r) => Object.fromEntries(keys.map((k, i) => [k, conv(r[i] ?? "")])));
}

/** An array of objects as a CSV string */
export function toCSV(rows: readonly Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.map(esc).join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

/**
  * A 2-D array as an array of objects; the first row is the header.
  * For shapes such as the Google Sheets API (values) and SQL results (rows + fields).
 */
export function fromRows(rows: readonly (readonly unknown[])[], columns?: readonly string[], options: { typed?: boolean } = {}): Record<string, unknown>[] {
  if (!rows.length) return [];
  const { typed = true } = options;
  const head = (columns ?? rows[0]).map((k, i) => String(k ?? "").trim() || `col${i + 1}`);
  const body = columns ? rows : rows.slice(1);
  return body.map((r) => Object.fromEntries(head.map((k, i) => [k, typed && typeof r[i] === "string" ? coerceCell(r[i] as string) : r[i] ?? null])));
}

/**
  * An object as an array of objects.
  * - { "Jan": 10, "Feb": 12 } -> [{ label: "Jan", value: 10 }, ...]
  * - { month: ["Jan","Feb"], sales: [10,12] } (columns) -> [{ month: "Jan", sales: 10 }, ...]
 */
export function fromObjects(obj: Record<string, unknown>, options: { labelKey?: string; valueKey?: string } = {}): Record<string, unknown>[] {
  const { labelKey = "label", valueKey = "value" } = options;
  const vals = Object.values(obj);
  if (vals.length && vals.every((v) => Array.isArray(v))) {
    const cols = Object.keys(obj);
    const n = Math.max(...vals.map((v) => (v as unknown[]).length));
    return Array.from({ length: n }, (_, i) => Object.fromEntries(cols.map((c) => [c, (obj[c] as unknown[])[i] ?? null])));
  }
  return Object.entries(obj).map(([k, v]) => ({ [labelKey]: k, [valueKey]: v }));
}

/** A wide table (a column per series) as a long one (series, value) */
export function melt(rows: readonly Record<string, unknown>[], idKeys: readonly string[], options: { seriesKey?: string; valueKey?: string; valueKeys?: readonly string[] } = {}): Record<string, unknown>[] {
  const { seriesKey = "series", valueKey = "value" } = options;
  const out: Record<string, unknown>[] = [];
  for (const r of rows) {
    const keys = options.valueKeys ?? Object.keys(r).filter((k) => !idKeys.includes(k));
    const base = Object.fromEntries(idKeys.map((id) => [id, r[id]]));
    for (const k of keys) out.push({ ...base, [seriesKey]: k, [valueKey]: r[k] });
  }
  return out;
}

/** The inner array at a path ("data.items") */
export function pluck(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const p of path.split(".").filter(Boolean)) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/**
  * Any input shape as an array of objects:
  * a CSV string, a JSON string, a 2-D array, an array of numbers, an array of objects,
  * { data: [...] }, { rows, columns }, { values: [[...]] } (Google Sheets) or a key–value map
 */
export function normalizeData(input: unknown): Record<string, unknown>[] {
  if (input === null || input === undefined) return [];
  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return [];
    if (s.startsWith("[") || s.startsWith("{")) {
      try {
        return normalizeData(JSON.parse(s));
      } catch {
        /* Read as CSV */
      }
    }
    return parseCSV(s);
  }
  if (Array.isArray(input)) {
    if (!input.length) return [];
    if (Array.isArray(input[0])) return fromRows(input as unknown[][]);
    if (typeof input[0] === "number") return (input as number[]).map((v, i) => ({ label: String(i + 1), value: v }));
    return input.filter((r) => r && typeof r === "object") as Record<string, unknown>[];
  }
  if (typeof input === "object") {
    const o = input as Record<string, unknown>;
    if (Array.isArray(o.data)) return normalizeData(o.data);
    if (Array.isArray(o.rows) && Array.isArray(o.columns)) return fromRows(o.rows as unknown[][], (o.columns as unknown[]).map((c) => (typeof c === "object" && c && "name" in c ? String((c as { name: unknown }).name) : String(c))));
    if (Array.isArray(o.rows) && Array.isArray(o.fields)) return normalizeData(o.rows);
    if (Array.isArray(o.rows)) return normalizeData(o.rows);
    if (Array.isArray(o.values)) return fromRows(o.values as unknown[][]);
    if (Array.isArray(o.items)) return normalizeData(o.items);
    if (Array.isArray(o.results)) return normalizeData(o.results);
    return fromObjects(o);
  }
  return [];
}

/** A signature for spotting data changes; large arrays are sampled */
export function dataSignature(data: unknown): string {
  if (!Array.isArray(data)) {
    try {
      return JSON.stringify(data ?? null) ?? "";
    } catch {
      return String(data);
    }
  }
  const n = data.length;
  const safe = (v: unknown) => {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };
  if (n <= 300) return safe(data);
  const step = Math.ceil(n / 60);
  const sample: unknown[] = [];
  for (let i = 0; i < n; i += step) sample.push(data[i]);
  sample.push(data[n - 1]);
  return `${n}:${safe(sample)}`;
}

/** Largest-Triangle-Three-Buckets: fewer points, keeping the line's shape */
export function lttb<P extends { x: number; y: number }>(pts: readonly P[], threshold: number): P[] {
  const n = pts.length;
  if (threshold >= n || threshold < 3) return pts.slice();
  const out: P[] = [pts[0]];
  const every = (n - 2) / (threshold - 2);
  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    const s = Math.floor((i + 1) * every) + 1;
    const e = Math.min(Math.floor((i + 2) * every) + 1, n);
    let ax = 0;
    let ay = 0;
    for (let j = s; j < e; j++) {
      ax += pts[j].x;
      ay += pts[j].y;
    }
    const len = Math.max(1, e - s);
    ax /= len;
    ay /= len;
    const rs = Math.floor(i * every) + 1;
    const re = Math.floor((i + 1) * every) + 1;
    let best = rs;
    let max = -1;
    for (let j = rs; j < re; j++) {
      const area = Math.abs((pts[a].x - ax) * (pts[j].y - pts[a].y) - (pts[a].x - pts[j].x) * (ay - pts[a].y));
      if (area > max) {
        max = area;
        best = j;
      }
    }
    out.push(pts[best]);
    a = best;
  }
  out.push(pts[n - 1]);
  return out;
}
