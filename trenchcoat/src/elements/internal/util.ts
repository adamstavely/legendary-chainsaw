/*
 * Small helpers several elements share (remediation 5.0) – before this, each element carried its own copy.
 */

/** One or two capitals from a name: "Maya Chen" → "MC", "Priya" → "P" */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

/** Copies text to the clipboard; true when it worked. Falls back to a hidden textarea where the async API is
 *  unavailable (older browsers, non-secure contexts) */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/** A duration token (`--tc-duration-slow`) read as milliseconds where it's used, for motion run from code */
export function tokenMs(el: Element, name: string, fallback: number) {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? (v.endsWith("ms") ? n : n * 1000) : fallback;
}

/** Apple keyboards: ⌘ instead of Ctrl in shortcut hints */
export function isMac() {
  const p = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
  return /mac|iphone|ipad|ipod/i.test(p || navigator.userAgent);
}

const MIRRORED = [
  "boxSizing", "width", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderStyle",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "fontStyle", "fontVariant", "fontWeight", "fontStretch",
  "fontSize", "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent", "letterSpacing", "wordSpacing", "tabSize",
] as const;

/** Where the caret at `index` sits in a textarea or input, in viewport pixels – a hidden mirror lays the text out */
export function textCaret(field: HTMLTextAreaElement | HTMLInputElement, index: number) {
  const doc = field.ownerDocument;
  const style = getComputedStyle(field);
  const copy = doc.createElement("div");
  for (const p of MIRRORED) copy.style[p] = style[p];
  Object.assign(copy.style, { position: "absolute", top: "0", left: "-9999px", visibility: "hidden", overflow: "hidden", whiteSpace: field instanceof HTMLInputElement ? "pre" : "pre-wrap", overflowWrap: "break-word" });
  copy.textContent = field.value.slice(0, index);
  const mark = doc.createElement("span");
  mark.textContent = field.value.slice(index, index + 1) || ".";
  copy.append(mark);
  doc.body.append(copy);
  const box = copy.getBoundingClientRect();
  const at = mark.getClientRects()[0] ?? mark.getBoundingClientRect();
  copy.remove();
  const r = field.getBoundingClientRect();
  const left = r.left + at.left - box.left - field.scrollLeft;
  const top = r.top + at.top - box.top - field.scrollTop;
  return { left, top, bottom: top + at.height };
}

/** A table's entry for a key from data, else the fallback's – so a tone, kind or icon the element doesn't know is
 *  drawn as a sensible default instead of breaking the render */
export function pick<K extends string, V>(table: Record<K, V>, key: unknown, fallback: K): V {
  return typeof key === "string" && Object.hasOwn(table, key) ? table[key as K] : table[fallback];
}

/** A date or time in words, like Intl.DateTimeFormat#format – but a missing or invalid date reads as `unknown` and a
 *  locale the browser rejects falls back to its own, instead of throwing during render */
export function formatDate(ms: number | Date | undefined | null, locale: string | string[] | undefined, options: Intl.DateTimeFormatOptions = {}, unknown = "–") {
  const t = ms instanceof Date ? ms.getTime() : ms;
  if (typeof t !== "number" || !Number.isFinite(t)) return unknown;
  try {
    return new Intl.DateTimeFormat(locale, options).format(t);
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(t);
  }
}

/** A date for a `datetime` attribute, or undefined (bind it with `ifDefined`) when it isn't a valid date */
export function isoDate(ms: number | Date | undefined | null) {
  const t = ms instanceof Date ? ms.getTime() : ms;
  return typeof t === "number" && Number.isFinite(t) ? new Date(t).toISOString() : undefined;
}
