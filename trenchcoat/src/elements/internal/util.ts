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
