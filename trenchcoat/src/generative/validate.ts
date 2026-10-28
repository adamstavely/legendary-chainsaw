/*
 * Checks what a model wrote for a component against the component's schema (scripts/gen-schemas.mjs) and keeps what's
 * safe to set: an answer is never rejected whole, so a bad property is dropped, a bad list item is left out, and each is
 * reported as an issue. The props are untrusted – on top of the schema, guardrails a schema can't say:
 *   · links must be http(s), mailto, tel or relative – never javascript:, data: or another site's //host (safeUrl).
 *     A link is a string the element binds to href or src (the generator marks those `format: "uri-reference"`) or
 *     one whose name ends in href, url or src
 *   · images and other resources that load by themselves can be held to allowedOrigins
 *   · colours (…color, …fill, background …) are colours – never url(…) or another CSS function that loads something
 *   · lists are capped at MAX_ITEMS, strings at MAX_STRING, nesting at MAX_DEPTH, the whole props at MAX_BYTES (UTF-8)
 *   · `__proto__` is never a key, and a key is only a property when the schema has it as its own
 * Covers the JSON Schema the generator writes: type, enum, const, properties, required, additionalProperties, items
 * (lists and tuples), minItems / maxItems, anyOf / oneOf, not, format (date-time becomes a Date, as the elements type
 * it), $ref to definitions – plus minimum / maximum / exclusiveMinimum / exclusiveMaximum, minLength / maxLength and
 * pattern for hand-written schemas.
 */
import { safeUrl } from "../elements/internal/safe-url";

export type Schema = {
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean | Schema;
  items?: Schema | Schema[];
  minItems?: number;
  maxItems?: number;
  anyOf?: Schema[];
  oneOf?: Schema[];
  not?: Schema;
  format?: string;
  contentMediaType?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  $ref?: string;
  definitions?: Record<string, Schema>;
  description?: string;
};
export type GenerativeIssue = { path: string; message: string };
export type Checked = { props: Record<string, unknown>; issues: GenerativeIssue[] };
export type CheckOptions = {
  /**
   * Origins that images and other resources a component loads by itself may come from ("https://cdn.example.com").
   * Unset, any http(s) origin is allowed; set, a resource from anywhere else is left out – a prompt-injected model
   * can otherwise send data out in an image's address. Relative resources are always allowed.
   */
  allowedOrigins?: readonly string[];
};

export const MAX_ITEMS = 200;
export const MAX_STRING = 4000;
export const MAX_DEPTH = 8;
export const MAX_BYTES = 200_000;

/**
 * Names that hold a link whatever the element does with them, by their ending: href, policyHref, siteUrl, src. Broader
 * words (image, avatar, link) are often labels or initials, so those count only where the generator saw the element
 * bind them to href or src
 */
const LINK = /(href|url|src)$/i;
/** …and the names of ones a browser loads by itself, without a click */
const RESOURCE = /src$/i;
/** Names of properties that hold a colour */
const COLOUR = /(colou?rs?|fill|stroke|background|tint)$/i;
/** CSS functions a colour may use – none of them loads anything */
const COLOUR_FUNCTIONS = new Set(["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color", "color-mix", "light-dark", "var", "calc"]);
const LINK_FORMATS = new Set(["uri", "uri-reference", "iri", "iri-reference"]);
/** Keys that are never set, whatever the schema says: assigning __proto__ swaps an object's prototype */
const NEVER = new Set(["__proto__"]);

/** Whether a string at this key, with this schema, is a link the guardrails check */
export const isLinkField = (key: string, s: Schema) => LINK_FORMATS.has(s.format ?? "") || LINK.test(key);
/** Whether a link loads by itself (an image), so allowedOrigins applies */
export const isResourceField = (key: string, s: Schema) => (s.contentMediaType ?? "").startsWith("image/") || RESOURCE.test(key);

/** A colour value: hex, a name, or the colour functions – no url(), image() or anything else that loads */
export function isSafeColour(v: string) {
  if (!/^[\w#(),.%\s/+*-]*$/.test(v)) return false;
  for (const m of v.matchAll(/([\w-]+)\s*\(/g)) if (!COLOUR_FUNCTIONS.has(m[1].toLowerCase())) return false;
  return true;
}

const NO = Symbol("invalid");
type Out = unknown | typeof NO;

const typeOf = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v);
const fits = (v: unknown, t: string) => {
  const actual = typeOf(v);
  return actual === t || (t === "number" && actual === "integer");
};
const own = <T>(map: Record<string, T> | undefined, k: string): T | undefined => (map && Object.hasOwn(map, k) ? map[k] : undefined);
const bytes = (raw: unknown) => {
  try {
    return new TextEncoder().encode(JSON.stringify(raw)).length;
  } catch {
    return Infinity; // a cycle or a BigInt – not JSON
  }
};
/** Cut a string at n UTF-16 units without leaving half a surrogate pair */
const cut = (v: string, n: number) => (/[\uD800-\uDBFF]/.test(v[n - 1] ?? "") ? v.slice(0, n - 1) : v.slice(0, n));

export function checkProps(schema: Schema, raw: unknown, options: CheckOptions = {}): Checked {
  const issues: GenerativeIssue[] = [];
  const defs = schema.definitions ?? {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { props: {}, issues: raw === undefined ? [] : [{ path: "props", message: "props should be an object – left out" }] };
  if (bytes(raw) > MAX_BYTES) return { props: {}, issues: [{ path: "props", message: `props are larger than ${MAX_BYTES / 1000} KB – left out` }] };
  const origins = options.allowedOrigins?.map((o) => {
    try {
      return new URL(o).origin;
    } catch {
      return o;
    }
  });

  const resolve = (s: Schema): Schema => {
    let at = s;
    for (let i = 0; at.$ref && i < 20; i++) at = own(defs, decodeURIComponent(at.$ref.replace("#/definitions/", ""))) ?? {};
    return at;
  };

  /** A link's problem, or null when it can be set */
  const linkProblem = (v: string, key: string, s: Schema): string | null => {
    if (!v.trim()) return null;
    const url = safeUrl(v);
    if (url === undefined) return "a link must be http(s), mailto, tel or relative – left out";
    if (origins && isResourceField(key, s)) {
      let origin: string | null = null;
      try {
        // Relative resources stay on the page's own origin
        if (/^[a-z][a-z\d+.-]*:/i.test(url)) origin = new URL(url).origin;
      } catch {
        return "not a web address – left out";
      }
      if (origin !== null && !origins.includes(origin)) return `loads from ${origin}, which isn't an allowed origin – left out`;
    }
    return null;
  };

  /**
   * A value checked against a schema: the kept value, or NO when it can't be kept. Issues go to `sink`, so a branch of
   * anyOf can be tried without reporting. `colour` is set below a colour-named key.
   */
  const value = (s0: Schema, v: unknown, path: string, key: string, depth: number, sink: GenerativeIssue[], colour: boolean): Out => {
    const s = resolve(s0);
    const fail = (message: string): Out => {
      sink.push({ path, message });
      return NO;
    };
    if (depth > MAX_DEPTH) return fail(`nested deeper than ${MAX_DEPTH} levels – left out`);
    if (s.not) {
      const kept = value(s.not, v, path, key, depth, [], colour);
      if (kept !== NO) return fail("not allowed here – left out");
    }
    const alts = s.anyOf ?? s.oneOf;
    if (alts) {
      // The branch that keeps the most: fewest issues, the first on a tie
      let best: { out: Out; found: GenerativeIssue[] } | null = null;
      for (const alt of alts) {
        const found: GenerativeIssue[] = [];
        const out = value(alt, v, path, key, depth, found, colour);
        if (out !== NO && (!best || found.length < best.found.length)) best = { out, found };
        if (best?.found.length === 0) break;
      }
      if (!best) return fail("doesn't match any of the allowed shapes – left out");
      sink.push(...best.found);
      return best.out;
    }
    if ("const" in s && v !== s.const) return fail(`should be ${JSON.stringify(s.const)} – left out`);
    if (s.enum && !s.enum.includes(v)) return fail(`should be one of ${s.enum.map((e) => JSON.stringify(e)).join(", ")} – left out`);
    const types = s.type === undefined ? [] : Array.isArray(s.type) ? s.type : [s.type];
    if (types.length && !types.some((t) => fits(v, t))) return fail(`should be ${types.join(" or ")}, not ${typeOf(v)} – left out`);

    if (typeof v === "string") {
      if (isLinkField(key, s)) {
        const problem = linkProblem(v, key, s);
        if (problem) return fail(problem);
      }
      if ((colour || COLOUR.test(key)) && !isSafeColour(v)) return fail("a colour must be a colour value – left out");
      if (s.minLength !== undefined && v.length < s.minLength) return fail(`shorter than ${s.minLength} characters – left out`);
      if (s.pattern !== undefined) {
        let re: RegExp | null = null;
        try {
          re = new RegExp(s.pattern, "u");
        } catch {
          // A pattern this engine can't read isn't the model's fault
        }
        if (re && !re.test(v)) return fail("doesn't have the expected form – left out");
      }
      if (s.format === "date-time") {
        const at = Date.parse(v);
        return Number.isFinite(at) ? new Date(at) : fail("should be a date and time (ISO 8601) – left out");
      }
      const max = Math.min(MAX_STRING, s.maxLength ?? Infinity);
      if (v.length > max) {
        sink.push({ path, message: `longer than ${max} characters – cut` });
        return cut(v, max);
      }
      return v;
    }
    if (typeof v === "number") {
      if (!Number.isFinite(v)) return fail("should be a finite number – left out");
      if (s.minimum !== undefined && v < s.minimum) return fail(`should be at least ${s.minimum} – left out`);
      if (s.maximum !== undefined && v > s.maximum) return fail(`should be at most ${s.maximum} – left out`);
      if (s.exclusiveMinimum !== undefined && v <= s.exclusiveMinimum) return fail(`should be more than ${s.exclusiveMinimum} – left out`);
      if (s.exclusiveMaximum !== undefined && v >= s.exclusiveMaximum) return fail(`should be less than ${s.exclusiveMaximum} – left out`);
      return v;
    }
    if (Array.isArray(v)) {
      const items = s.items;
      if (Array.isArray(items)) {
        // A tuple: every place has its own meaning, so one bad item is a bad tuple
        if (s.maxItems !== undefined && v.length > s.maxItems) return fail(`should have at most ${s.maxItems} items – left out`);
        const out: unknown[] = [];
        for (let i = 0; i < v.length; i++) {
          const kept = value(items[i] ?? {}, v[i], `${path}/${i}`, key, depth + 1, sink, colour);
          if (kept === NO) return fail("a tuple with a bad item – left out");
          out.push(kept);
        }
        if (s.minItems !== undefined && out.length < s.minItems) return fail(`needs at least ${s.minItems} items – left out`);
        return out;
      }
      const cap = Math.min(MAX_ITEMS, s.maxItems ?? Infinity);
      let list = v;
      if (list.length > cap) {
        sink.push({ path, message: `more than ${cap} items – cut to ${cap}` });
        list = list.slice(0, cap);
      }
      const out: unknown[] = [];
      list.forEach((item, i) => {
        const kept = value(items ?? {}, item, `${path}/${i}`, key, depth + 1, sink, colour);
        if (kept !== NO) out.push(kept);
      });
      if (s.minItems !== undefined && out.length < s.minItems) return fail(`needs at least ${s.minItems} items – left out`);
      return out;
    }
    if (v && typeof v === "object") return object(s, v as Record<string, unknown>, path, depth, sink, colour);
    return v;
  };

  /** An object's own keys, each checked against its property (or additionalProperties); `required` checked after */
  const object = (s: Schema, v: Record<string, unknown>, path: string, depth: number, sink: GenerativeIssue[], colour: boolean): Out => {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const at = `${path}/${k}`;
      if (NEVER.has(k)) {
        sink.push({ path: at, message: "not a property name – left out" });
        continue;
      }
      const sub = own(s.properties, k) ?? (typeof s.additionalProperties === "object" ? s.additionalProperties : undefined);
      if (!sub) {
        if (s.additionalProperties === false || s.properties) {
          sink.push({ path: at, message: "not a property here – left out" });
          continue;
        }
        // An open object (a map of anything): its values still get the guardrails
        const kept = value({}, x, at, k, depth + 1, sink, colour);
        if (kept !== NO) out[k] = kept;
        continue;
      }
      // A colours map's keys are values ("success": "#0a0"), so the colour rule follows its additionalProperties
      const kept = value(sub, x, at, k, depth + 1, sink, colour || (!own(s.properties, k) && COLOUR.test(path.split("/").pop() ?? "")));
      if (kept !== NO) out[k] = kept;
    }
    const missing = (s.required ?? []).filter((r) => !Object.hasOwn(out, r));
    if (missing.length) {
      sink.push({ path, message: `needs ${missing.join(", ")} – left out` });
      return NO;
    }
    return out;
  };

  const root = object({ ...schema, additionalProperties: schema.additionalProperties ?? false }, raw as Record<string, unknown>, "props", 0, issues, false);
  if (root === NO) {
    // The component needs a property the model didn't give: nothing is set, so the element keeps its defaults
    return { props: {}, issues };
  }
  // At the top level "not a property here" reads better as the component's
  for (const i of issues) if (/^props\/[^/]+$/.test(i.path) && i.message === "not a property here – left out") i.message = "not a property of this component – left out";
  return { props: root as Record<string, unknown>, issues };
}
