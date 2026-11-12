// Tuning a piece by hand with DialKit: a dial for each prop the schema describes simply (a toggle, a choice, a number,
// a line of text or a colour) and for each of the component's tokens that sit on a scale. What the dials say becomes
// a variant – the props and tokens that differ from where they started – checked and kept like a riffed one.
import type { DialConfig } from "dialkit/vue";

type PropSchema = { type?: string | string[]; enum?: unknown[]; minimum?: number; maximum?: number; format?: string; description?: string };
export type TunableToken = { token: string; options: string[] };
export type Dials = {
  config: DialConfig;
  /** The props with a dial, and their starting values */
  props: Record<string, unknown>;
  /** Dial key → the token it sets */
  tokens: Record<string, string>;
};

/** Props whose names say they're links or colours get no free-text dial */
const LINK = /(href|url|src)$/i;
const COLOUR = /(colou?rs?|fill|stroke|background|tint)$/i;
const MAX_TEXT = 200;
const TOKENS = "tokens";

const typeOf = (s: PropSchema) => (Array.isArray(s.type) ? s.type.filter((t) => t !== "null") : [s.type]).filter(Boolean);
const tokenKey = (token: string) => token.replace(/^--tc-/, "");

/** The dial for one prop, or null when it has no simple one */
export function dialFor(name: string, schema: PropSchema, value: unknown): DialConfig[string] | null {
  const [type, ...more] = typeOf(schema);
  if (more.length) return null;
  if (schema.enum && schema.enum.every((v) => typeof v === "string")) {
    const options = schema.enum as string[];
    return { type: "select", options, default: typeof value === "string" && options.includes(value) ? value : options[0] };
  }
  if (type === "boolean") return typeof value === "boolean" ? value : false;
  if ((type === "number" || type === "integer") && typeof value === "number" && Math.abs(value) < 1e6) {
    const min = schema.minimum ?? Math.min(0, value * 2);
    // A fraction (an opacity, a ratio) runs to 1; anything else to three times where it is
    const fraction = type === "number" && value >= 0 && value <= 1;
    const max = schema.maximum ?? (fraction ? 1 : Math.max(value * 3, 10));
    // DialKit snaps a value to its step, so a whole number steps by 1 – or it would move before anyone touched it
    const step = type === "integer" || Number.isInteger(value) ? 1 : 0.01;
    return [value, min, max, step];
  }
  if (type === "string" && typeof value === "string" && value.length <= MAX_TEXT && !LINK.test(name) && !schema.format) {
    return COLOUR.test(name) ? { type: "color", default: value } : { type: "text", default: value };
  }
  return null;
}

/** The dials for a piece: its simple props, then a folder of its scale tokens */
export function dialsFor(schema: { properties?: Record<string, PropSchema> }, current: Record<string, unknown>, tokens: readonly TunableToken[]): Dials {
  const config: DialConfig = {};
  const props: Record<string, unknown> = {};
  for (const [name, s] of Object.entries(schema.properties ?? {})) {
    const dial = dialFor(name, s, current[name]);
    if (dial === null) continue;
    config[name] = dial;
    // Where the dial starts: the piece's value, or the dial's own default when the piece doesn't set one
    props[name] = current[name] ?? (typeof dial === "object" && !Array.isArray(dial) && "default" in dial ? dial.default : dial);
  }
  const map: Record<string, string> = {};
  if (tokens.length) {
    const folder: DialConfig = {};
    for (const { token, options } of tokens) {
      folder[tokenKey(token)] = { type: "select", options: options.map((o) => ({ value: o, label: tokenKey(o) })), default: token };
      map[tokenKey(token)] = token;
    }
    config[TOKENS] = folder;
  }
  return { config, props, tokens: map };
}

/**
 * What the dials have moved: the props that differ from where they started, and each token set to another step of
 * its scale. An override pointing at another overridden token would be a cycle, so it's left out
 */
export function tunedVariant(dials: Dials, values: Record<string, unknown>): { props: Record<string, unknown>; tokens: Record<string, string> } {
  const props: Record<string, unknown> = {};
  for (const [name, start] of Object.entries(dials.props)) if (Object.hasOwn(values, name) && values[name] !== start) props[name] = values[name];
  const chosen = (values[TOKENS] ?? {}) as Record<string, string>;
  const moved = Object.entries(dials.tokens).filter(([key, token]) => chosen[key] && chosen[key] !== token);
  const overridden = new Set(moved.map(([, token]) => token));
  const tokens = Object.fromEntries(moved.filter(([key]) => !overridden.has(chosen[key])).map(([key, token]) => [token, `var(${chosen[key]})`]));
  return { props, tokens };
}

/** Sets the dials' props on the piece and its token overrides, clearing the ones moved back */
export function applyTuned(el: HTMLElement, dials: Dials, tuned: { props: Record<string, unknown>; tokens: Record<string, string> }) {
  Object.assign(el, { ...dials.props, ...tuned.props });
  for (const token of Object.values(dials.tokens)) {
    if (tuned.tokens[token]) el.style.setProperty(token, tuned.tokens[token]);
    else el.style.removeProperty(token);
  }
}
