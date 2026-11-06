/*
 * Charts as SVG text, without a browser (ztd-charts' renderSpecToSVG, MIT, © 2026 Junhan2, rebuilt for Lit): a spec is
 * checked, its chart is built off-screen, drawn with every mark where it ends, and the Lit template turned into a
 * string. The chart's CSS goes in with it, and the design tokens it uses are resolved to plain values for one look and
 * one theme, so the SVG stands alone – in a file, an email, a README or a PDF.
 *
 * In Node, call installDomShim() first (it gives Lit the minimal DOM it needs); a browser needs nothing.
 */
import { noChange, nothing, type TemplateResult } from "lit";
import { chartSheets } from "./element";
import { chartType, specToElement, validateSpec, type ChartSpec } from "./spec";

/* ---------- Lit templates to text ---------- */

type Directive = { _$litDirective$: { name?: string } & (new (...a: never[]) => unknown); values: unknown[] };
const isTemplate = (v: unknown): v is TemplateResult => !!v && typeof v === "object" && "_$litType$" in v && "strings" in v;
const isDirective = (v: unknown): v is Directive => !!v && typeof v === "object" && "_$litDirective$" in v;

const escText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => escText(s).replace(/"/g, "&quot;");

/** The value a directive stands for: keyed(k, v) → v; repeat(items, key?, template) → the templates; styleMap → CSS */
function unwrap(v: Directive): unknown {
  const [a, b, c] = v.values;
  const name = (v._$litDirective$ as { name?: string }).name ?? "";
  if (/keyed/i.test(name)) return b;
  if (/repeat/i.test(name)) {
    const items = [...((a as Iterable<unknown>) ?? [])];
    const tpl = (c ?? b) as (item: unknown, i: number) => unknown;
    return items.map((it, i) => tpl(it, i));
  }
  if (/style/i.test(name) && a && typeof a === "object")
    return Object.entries(a as Record<string, unknown>)
      .filter(([, x]) => x !== undefined && x !== null && x !== "")
      .map(([k, x]) => `${k.startsWith("--") ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${x}`)
      .join("; ");
  // ifDefined, live and the like hold the value itself
  return a;
}

function valueText(v: unknown): string {
  if (v === nothing || v === noChange || v === null || v === undefined || v === false) return "";
  if (isDirective(v)) return valueText(unwrap(v));
  if (isTemplate(v)) return templateToString(v);
  if (Array.isArray(v)) return v.map(valueText).join("");
  if (typeof v === "object" && Symbol.iterator in (v as object)) return [...(v as Iterable<unknown>)].map(valueText).join("");
  return escText(String(v));
}

/** Where a binding sits: in an attribute (with its prefix and quote), or between tags */
const ATTR_END = /([.?@]?)([^\s"'>/=]+)\s*=\s*(["']?)$/;

/**
 * A Lit template as markup. Event (@) and property (.) bindings are dropped, boolean (?) attributes are written or left
 * out, and every value is escaped
 */
export function templateToString(t: TemplateResult): string {
  const { strings, values } = t;
  let out = "";
  let skipQuote = "";
  for (let i = 0; i < strings.length; i++) {
    let s = strings[i];
    if (skipQuote && s.startsWith(skipQuote)) s = s.slice(1);
    skipQuote = "";
    if (i === values.length) {
      out += s;
      break;
    }
    let v: unknown = values[i];
    if (isDirective(v)) v = unwrap(v);
    // In a tag? Count the < and > before this binding
    const before = out + s;
    const inTag = before.lastIndexOf("<") > before.lastIndexOf(">");
    const m = inTag ? ATTR_END.exec(s) : null;
    if (!m) {
      // Within a quoted attribute value (class="a ${b}") or between tags
      out += s + (inTag ? escAttr(v === nothing || v === undefined || v === null ? "" : String(v)) : valueText(v));
      continue;
    }
    const [whole, prefix, name, quote] = m;
    const head = s.slice(0, s.length - whole.length);
    skipQuote = quote;
    if (prefix === "@" || prefix === ".") {
      out += head;
      continue;
    }
    if (prefix === "?") {
      out += head + (v && v !== nothing ? name : "");
      continue;
    }
    if (v === nothing || v === undefined || v === null) {
      out += head;
      continue;
    }
    out += `${head}${name}="${escAttr(String(v))}"`;
  }
  return out;
}

/* ---------- Tokens to values ---------- */

export type RenderLook = "standard" | "clean";
export type RenderTheme = "light" | "dark";

/** Splits a value at its top-level commas: "light-dark(a, b)" → a and b */
function splitArgs(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      out.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(s.slice(start).trim());
  return out;
}

/** Replaces light-dark(a, b) with one side, at every depth */
function pickScheme(value: string, theme: RenderTheme): string {
  let s = value;
  for (let guard = 0; guard < 50; guard++) {
    const i = s.indexOf("light-dark(");
    if (i < 0) break;
    let depth = 0;
    let end = -1;
    for (let j = i + 10; j < s.length; j++) {
      if (s[j] === "(") depth++;
      else if (s[j] === ")" && --depth === 0) {
        end = j;
        break;
      }
    }
    if (end < 0) break;
    const [light, dark] = splitArgs(s.slice(i + 11, end));
    s = s.slice(0, i) + (theme === "dark" ? dark ?? light : light) + s.slice(end + 1);
  }
  return s;
}

/** The rule blocks at the top level, as [selector, body]; @-rules (fallbacks, forced colours) are skipped whole */
function topLevelBlocks(css: string): [string, string][] {
  const out: [string, string][] = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const sel = css.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    for (; j < css.length && depth; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
    }
    if (!sel.startsWith("@")) out.push([sel, css.slice(open + 1, j - 1)]);
    i = j;
  }
  return out;
}

/**
 * The tokens as name → value for one look and theme, from tokens.css: the base block, then the look's block over it,
 * light-dark() settled for the theme
 */
export function tokenValues(tokensCss: string, look: RenderLook, theme: RenderTheme): Map<string, string> {
  const vars = new Map<string, string>();
  const blocks = topLevelBlocks(tokensCss.replace(/\/\*[\s\S]*?\*\//g, ""));
  const take = (body: string) => {
    for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars.set(m[1], pickScheme(m[2].trim(), theme));
  };
  // The base (:root alone), then the look's own block – the standard one also matches :root, so it comes after
  for (const [sel, body] of blocks) if (/^\s*:where\(:root\)\s*$/.test(sel)) take(body);
  for (const [sel, body] of blocks) if (sel.includes(`[data-look="${look}"]`)) take(body);
  // Tokens built on other tokens, settled to plain values
  for (const [k, v] of vars) if (v.includes("var(")) vars.set(k, pickScheme(resolveVars(v, vars), theme));
  return vars;
}

/** var(--x, fallback) replaced by its value, again and again until none is left */
function resolveVars(css: string, vars: Map<string, string>): string {
  let s = css;
  for (let guard = 0; guard < 12 && s.includes("var(--"); guard++) {
    s = s.replace(/var\((--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (all, name: string, fb?: string) => vars.get(name) ?? fb ?? all);
  }
  return s;
}

/* ---------- Scoping ---------- */

/** Splits a selector list at its top-level commas */
const selectors = (list: string) => splitArgs(list).filter(Boolean);

/**
 * The CSS for one SVG: every selector under `#id`, so several SVGs on one page don't restyle each other, and the rules
 * for the chart's own root – the card, the tray, its tokens – left out, as the SVG is just the plot
 */
function scopeCss(css: string, id: string): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const head = css.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    for (; j < css.length && depth; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
    }
    const body = css.slice(open + 1, j - 1);
    i = j;
    if (head.startsWith("@keyframes")) out += `${head}{${body}}`;
    else if (head.startsWith("@")) {
      const inner = scopeCss(body, id);
      if (inner) out += `${head}{${inner}}`;
    } else {
      const kept = selectors(head)
        .filter((sel) => !/\[data-chart\]|\[data-ui=|\[data-look=/.test(sel))
        .map((sel) => `#${id} ${sel}`);
      if (kept.length) out += `${kept.join(",")}{${body}}`;
    }
  }
  return out;
}

let svgCount = 0;

/* ---------- Rendering ---------- */

export type RenderOptions = {
  /** The width in px; by default 720 */
  width?: number;
  /** The plot's height in px; by default the chart's own for its width */
  height?: number;
  /** "standard" (default) or "clean" – their chart inks differ */
  look?: RenderLook;
  /** "light" (default) or "dark" */
  theme?: RenderTheme;
  /** tokens.css as text, to resolve the tokens; without it the SVG keeps var(--tc-…) and needs the page's tokens */
  tokensCss?: string;
  /** Paints the card's colour behind the chart; by default true */
  background?: boolean;
};

/** A chart's module, by tag – the renderer imports only the one a spec names */
export type ChartLoader = (tag: string) => Promise<unknown>;

/**
 * A spec as a standalone SVG string. The spec's data must be inline (resolveSpecData fetches { url } first); the chart
 * modules come from `load`. Throws with the spec's problems when it isn't valid
 */
export async function renderChartToSVG(spec: ChartSpec, load: ChartLoader, options: RenderOptions = {}): Promise<string> {
  const check = validateSpec(spec);
  if (!check.valid) throw new Error(`Invalid spec: ${check.errors.map((e) => `${e.path || "spec"} ${e.message}`).join("; ")}`);
  if (chartType(spec.type)?.pageOnly) throw new Error(`A ${chartType(spec.type)!.name.toLowerCase()} is drawn in pages only: use <tc-chart> or <${chartType(spec.type)!.tag}>`);
  const { tag, props } = specToElement(spec);
  await load(tag);
  const Cls = customElements.get(tag) as unknown as (new () => HTMLElement) & { elementProperties?: Map<string, unknown>; css?: string; ui?: string };
  if (!Cls) throw new Error(`<${tag}> isn't defined`);
  const el = new Cls() as HTMLElement & Record<string, unknown> & { drawStatic(w: number): { width: number; height: number; content: TemplateResult; summary: string } };
  for (const [k, v] of Object.entries(props)) if (Cls.elementProperties?.has(k)) el[k] = v;
  if (options.height !== undefined) el.height = options.height;
  // The plot is as wide as asked: the SVG is the plot, without the card's padding
  const width = Math.max(120, Math.round(options.width ?? 720));
  const look = options.look ?? "standard";
  const theme = options.theme ?? "light";
  const drawn = el.drawStatic(width);
  const body = templateToString(drawn.content);
  const title = typeof props.heading === "string" && props.heading ? props.heading : tag;
  let css = [...chartSheets.values(), Cls.css ?? ""].join("\n");
  let markup = `${options.background === false ? "" : `<rect x="0" y="0" width="${drawn.width}" height="${drawn.height}" style="fill: var(--tc-plot-bg)"></rect>`}${body}`;
  let rootStyle = "font-family: var(--tc-font-sans); color: var(--tc-text-secondary)";
  if (options.tokensCss) {
    const vars = tokenValues(options.tokensCss, look, theme);
    // The charts' own tokens: the plot inks on [data-chart] (and the look's), then each chart's on its host
    const own = (re: RegExp, keep = (_m: RegExpMatchArray) => true) => {
      for (const m of css.matchAll(re)) if (keep(m)) for (const d of m[m.length - 1].matchAll(/(--tc-[\w-]+)\s*:\s*([^;]+);/g)) vars.set(d[1], d[2].trim());
    };
    own(/(?:^|\n)\[data-chart\]\s*\{([^{}]*)\}/g);
    own(/:where\(\[data-look="(\w+)"\][^{]*\)\[data-chart\][^{]*\{([^{}]*)\}/g, (m) => m[1] === look);
    own(/\[data-ui="[\w-]+"\]\s*\{([^{}]*)\}/g);
    // Set at run time by the tooltip, which a still drawing never shows
    vars.set("--tc-chart-tip-x", "-50%");
    css = resolveVars(css, vars);
    markup = resolveVars(markup, vars);
    rootStyle = resolveVars(rootStyle, vars);
  }
  const id = `tc-chart-svg-${++svgCount}`;
  css = scopeCss(css, id);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" id="${id}" viewBox="0 0 ${drawn.width} ${drawn.height}" width="${drawn.width}" height="${drawn.height}" role="img" aria-label="${escAttr(title)}" data-chart="" data-ui="${escAttr(String(Cls.ui ?? ""))}" data-look="${look}" style="${escAttr(rootStyle)}; color-scheme: ${theme}">`,
    `<title>${escText(title)}</title><desc>${escText(drawn.summary)}</desc>`,
    `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`,
    markup,
    `</svg>`,
  ].join("");
}

/** Gives Lit the little DOM it needs in Node (no-op in a browser) */
export async function installDomShim() {
  if (typeof globalThis.HTMLElement !== "undefined" && typeof globalThis.customElements !== "undefined") return;
  const shim = await import("@lit-labs/ssr-dom-shim");
  const g = globalThis as Record<string, unknown>;
  g.HTMLElement ??= shim.HTMLElement;
  g.Element ??= shim.Element;
  g.customElements ??= shim.customElements;
  g.CustomEvent ??= shim.CustomEvent;
  g.Event ??= shim.Event;
  g.EventTarget ??= shim.EventTarget;
}
