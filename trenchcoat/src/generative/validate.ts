/*
 * Checks what a model wrote for a component against the component's schema (scripts/gen-schemas.mjs) and keeps what's
 * safe to set: an answer is never rejected whole, so a bad property is dropped, a bad list item is left out, and each is
 * reported as an issue. On top of the schema – guardrails a schema can't say:
 *   · links (href, url, src …) must be http(s), mailto or relative – never javascript: or data:
 *   · lists are capped at MAX_ITEMS, strings at MAX_STRING, nesting at MAX_DEPTH, the whole props at MAX_BYTES
 * Covers the JSON Schema the generator writes: type, enum, const, properties, required, additionalProperties,
 * items, anyOf / oneOf, $ref to definitions.
 */

export type Schema = {
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean | Schema;
  items?: Schema | Schema[];
  anyOf?: Schema[];
  oneOf?: Schema[];
  $ref?: string;
  definitions?: Record<string, Schema>;
  description?: string;
};
export type GenerativeIssue = { path: string; message: string };
export type Checked = { props: Record<string, unknown>; issues: GenerativeIssue[] };

export const MAX_ITEMS = 200;
export const MAX_STRING = 4000;
export const MAX_DEPTH = 8;
export const MAX_BYTES = 200_000;
/** Property names that hold a link */
const LINK = /^(href|url|src|link|image|picture|avatar|logo|thumbnail)$/i;
const SAFE_LINK = /^(https?:\/\/|mailto:|\/(?!\/)|\.{0,2}\/|#|\?)/i;

const NO = Symbol("invalid");
type Out = unknown | typeof NO;

const typeOf = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v);
const fits = (v: unknown, t: string) => {
  const actual = typeOf(v);
  return actual === t || (t === "number" && actual === "integer") || (t === "integer" && actual === "integer");
};

export function checkProps(schema: Schema, raw: unknown): Checked {
  const issues: GenerativeIssue[] = [];
  const defs = schema.definitions ?? {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { props: {}, issues: raw === undefined ? [] : [{ path: "props", message: "props should be an object – left out" }] };
  if (JSON.stringify(raw).length > MAX_BYTES) return { props: {}, issues: [{ path: "props", message: `props are larger than ${MAX_BYTES / 1000} KB – left out` }] };

  const resolve = (s: Schema): Schema => {
    let at = s;
    for (let i = 0; at.$ref && i < 20; i++) at = defs[decodeURIComponent(at.$ref.replace("#/definitions/", ""))] ?? {};
    return at;
  };

  /** A value checked against a schema: the kept value, or NO when it can't be kept */
  const value = (s0: Schema, v: unknown, path: string, key: string, depth: number, quiet = false): Out => {
    const s = resolve(s0);
    const fail = (message: string): Out => {
      if (!quiet) issues.push({ path, message });
      return NO;
    };
    if (depth > MAX_DEPTH) return fail(`nested deeper than ${MAX_DEPTH} levels – left out`);
    if (s.anyOf || s.oneOf) {
      for (const alt of (s.anyOf ?? s.oneOf)!) {
        const before = issues.length;
        const out = value(alt, v, path, key, depth, true);
        issues.length = before;
        if (out !== NO) return value(alt, v, path, key, depth, quiet);
      }
      return fail("doesn't match any of the allowed shapes – left out");
    }
    if ("const" in s && v !== s.const) return fail(`should be ${JSON.stringify(s.const)} – left out`);
    if (s.enum && !s.enum.includes(v)) return fail(`should be one of ${s.enum.map((e) => JSON.stringify(e)).join(", ")} – left out`);
    const types = s.type === undefined ? [] : Array.isArray(s.type) ? s.type : [s.type];
    if (types.length && !types.some((t) => fits(v, t))) return fail(`should be ${types.join(" or ")}, not ${typeOf(v)} – left out`);
    if (typeof v === "string") {
      if (LINK.test(key) && v && !SAFE_LINK.test(v.trim())) return fail("a link must be http(s), mailto or relative – left out");
      if (v.length > MAX_STRING) {
        if (!quiet) issues.push({ path, message: `longer than ${MAX_STRING} characters – cut` });
        return v.slice(0, MAX_STRING);
      }
      return v;
    }
    if (typeof v === "number") return Number.isFinite(v) ? v : fail("should be a finite number – left out");
    if (Array.isArray(v)) {
      const items = s.items;
      let list = v;
      if (list.length > MAX_ITEMS) {
        if (!quiet) issues.push({ path, message: `more than ${MAX_ITEMS} items – cut to ${MAX_ITEMS}` });
        list = list.slice(0, MAX_ITEMS);
      }
      const out: unknown[] = [];
      list.forEach((item, i) => {
        const itemSchema = Array.isArray(items) ? items[i] ?? {} : items ?? {};
        const kept = value(itemSchema, item, `${path}/${i}`, key, depth + 1, quiet);
        if (kept !== NO) out.push(kept);
      });
      return out;
    }
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      const props = s.properties ?? {};
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        const sub = props[k] ?? (typeof s.additionalProperties === "object" ? s.additionalProperties : undefined);
        if (!sub) {
          if (s.additionalProperties === false || s.properties) {
            if (!quiet) issues.push({ path: `${path}/${k}`, message: "not a property here – left out" });
            continue;
          }
          out[k] = x;
          continue;
        }
        const kept = value(sub, x, `${path}/${k}`, k, depth + 1, quiet);
        if (kept !== NO) out[k] = kept;
      }
      const missing = (s.required ?? []).filter((r) => !(r in out));
      if (missing.length) return fail(`needs ${missing.join(", ")} – left out`);
      return out;
    }
    return v;
  };

  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const sub = schema.properties?.[k];
    if (!sub) {
      issues.push({ path: `props/${k}`, message: "not a property of this component – left out" });
      continue;
    }
    const kept = value(sub, v, `props/${k}`, k, 1);
    if (kept !== NO) props[k] = kept;
  }
  return { props, issues };
}
