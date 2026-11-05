/*
 * ANSI (SGR) escape codes to token classes, shared by the elements that show terminal output. Text is never parsed as
 * HTML: escape sequences become classes named from `prefix` (`${prefix}__fg-red`), everything else stays text.
 */

const COLOURS = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"] as const;
type Sgr = { fg: string | null; bg: string | null; b: boolean; d: boolean; i: boolean; u: boolean; inv: boolean };
const PLAIN: Sgr = { fg: null, bg: null, b: false, d: false, i: false, u: false, inv: false };

/** The nearest of the eight colours (or gray) for a 256-colour or true-colour value */
function nearest(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 48) return max > 200 ? "white" : max < 72 ? "black" : "gray";
  const d = max - min;
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const deg = h * 60;
  return deg < 20 || deg >= 330 ? "red" : deg < 70 ? "yellow" : deg < 160 ? "green" : deg < 200 ? "cyan" : deg < 260 ? "blue" : "magenta";
}
function indexed(n: number): string | null {
  if (!Number.isFinite(n) || n < 0 || n > 255) return null;
  if (n < 8) return COLOURS[n];
  if (n === 8) return "gray";
  if (n < 16) return COLOURS[n - 8];
  if (n < 232) {
    const v = (k: number) => (k ? 55 + k * 40 : 0);
    const c = n - 16;
    return nearest(v(Math.floor(c / 36)), v(Math.floor(c / 6) % 6), v(c % 6));
  }
  const level = 8 + (n - 232) * 10;
  return level > 200 ? "white" : level < 72 ? "black" : "gray";
}

/** Applies SGR parameters. Each is a code with any colon sub-parameters (`4:3`, `38:2::255:0:0`), so a sub-parameter is
 *  never read as a code of its own; the older `38;5;n` and `38;2;r;g;b` spell the colour across several parameters */
function applySgr(from: Sgr, params: number[][]): Sgr {
  const s = { ...from };
  if (!params.length) return { ...PLAIN };
  for (let i = 0; i < params.length; i++) {
    const [p, ...sub] = params[i];
    if (p === 38 || p === 48) {
      let c: string | null = null;
      if (sub.length) {
        // 38:5:n, and 38:2:r:g:b or 38:2:<colour space>:r:g:b
        if (sub[0] === 5) c = indexed(sub[1]);
        else if (sub[0] === 2) {
          const rgb = sub.length >= 5 ? sub.slice(-3) : sub.slice(1, 4);
          c = nearest(rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0);
        }
      } else if (params[i + 1]?.[0] === 5) {
        c = indexed(params[i + 2]?.[0]);
        i += 2;
      } else if (params[i + 1]?.[0] === 2) {
        c = nearest(params[i + 2]?.[0] ?? 0, params[i + 3]?.[0] ?? 0, params[i + 4]?.[0] ?? 0);
        i += 4;
      }
      if (p === 38) s.fg = c;
      else s.bg = c;
    } else if (p === 4 && sub.length) s.u = sub[0] !== 0; // 4:0 is no underline; 4:1–4:5 are underline styles
    else if (sub.length) continue; // Other codes with sub-parameters (such as 58, the underline's colour) aren't drawn
    else if (p === 0) Object.assign(s, PLAIN);
    else if (p === 1) s.b = true;
    else if (p === 2) s.d = true;
    else if (p === 3) s.i = true;
    else if (p === 4) s.u = true;
    else if (p === 7) s.inv = true;
    else if (p === 21 || p === 22) s.b = s.d = false;
    else if (p === 23) s.i = false;
    else if (p === 24) s.u = false;
    else if (p === 27) s.inv = false;
    else if (p >= 30 && p <= 37) s.fg = COLOURS[p - 30];
    else if (p === 39) s.fg = null;
    else if (p >= 40 && p <= 47) s.bg = COLOURS[p - 40];
    else if (p === 49) s.bg = null;
    else if (p >= 90 && p <= 97) s.fg = p === 90 ? "gray" : COLOURS[p - 90];
    else if (p >= 100 && p <= 107) s.bg = p === 100 ? "gray" : COLOURS[p - 100];
  }
  return s;
}

const classCache = new Map<string, string>();
/** The span's classes for a style – "" for plain text */
function classOf(s: Sgr, prefix: string): string {
  const fg = s.fg ?? (s.d ? "gray" : null);
  const key = `${prefix}|${fg}|${s.bg}|${+s.b}${+s.i}${+s.u}${+s.inv}`;
  let cls = classCache.get(key);
  if (cls === undefined) {
    const parts: string[] = [];
    if (fg) parts.push(`${prefix}__fg-${fg}`);
    if (s.bg) parts.push(`${prefix}__bg-${s.bg}`);
    if (s.b) parts.push(`${prefix}__b`);
    if (s.i) parts.push(`${prefix}__i`);
    if (s.u) parts.push(`${prefix}__u`);
    if (s.inv) parts.push(`${prefix}__inv`);
    cls = parts.join(" ");
    classCache.set(key, cls);
  }
  return cls;
}

/** One line of output: its plain text, and the styled runs when it has any */
export type AnsiLine = { text: string; runs: Array<[cls: string, text: string]> | null };

// CSI (colours, cursor moves), OSC (titles, links) and the two-byte escapes; only SGR ("m") changes the style. CSI's
// parameter bytes are 0x30–0x3F, which includes the private markers < = > ? that TUIs send (`\x1b[>4;2m`)
const ESCAPE = /\x1b(?:\[([0-?]*)[ -/]*([@-~])|\][^\x07\x1b]*(?:\x07|\x1b\\)?|[@-Z\\-_])/g;
/** An SGR's parameters: `;` separates them, `:` separates a parameter's sub-parameters; empty is 0 */
const sgrParams = (raw: string) => (raw ? raw.split(";").map((p) => p.split(":").map((n) => (n === "" ? 0 : Number(n)))) : []);
const CONTROL = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

/** Parses one line (no \n) from a style; returns the line and the style after it */
function parseLine(raw: string, from: Sgr, prefix: string): { line: AnsiLine; style: Sgr } {
  let style = from;
  if (raw.endsWith("\r")) raw = raw.slice(0, -1);
  let runs: Array<[string, string]> = [];
  const push = (piece: string) => {
    // A carriage return goes back to the start of the line: what came before is overwritten (progress bars)
    const cr = piece.lastIndexOf("\r");
    if (cr >= 0) {
      runs = [];
      piece = piece.slice(cr + 1);
    }
    piece = piece.replace(CONTROL, "");
    if (!piece) return;
    const cls = classOf(style, prefix);
    const last = runs[runs.length - 1];
    if (last && last[0] === cls) last[1] += piece;
    else runs.push([cls, piece]);
  };
  if (raw.indexOf("\x1b") < 0) push(raw);
  else {
    ESCAPE.lastIndex = 0;
    let at = 0;
    let m: RegExpExecArray | null;
    while ((m = ESCAPE.exec(raw))) {
      if (m.index > at) push(raw.slice(at, m.index));
      // A private marker (`\x1b[>4;2m` sets a key mode) makes it something other than a style
      if (m[2] === "m" && !/[<=>?]/.test(m[1])) style = applySgr(style, sgrParams(m[1]));
      at = m.index + m[0].length;
    }
    if (at < raw.length) push(raw.slice(at));
  }
  const text = runs.map((r) => r[1]).join("");
  return { line: { text, runs: runs.some((r) => r[0]) ? runs : null }, style };
}

/** A step's parsed output. Lines up to `frozen` (complete, ending in \n) are kept when the output grows */
export type AnsiParsed = { source: string; lines: AnsiLine[]; frozen: number; frozenAt: number; frozenStyle: Sgr };

/** Parses `source`, reusing the complete lines of `prev` when the new text starts with them */
export function parseOutput(source: string, prefix: string, prev?: AnsiParsed): AnsiParsed {
  if (prev && prev.source === source) return prev;
  let lines: AnsiLine[] = [];
  let at = 0;
  let style = PLAIN;
  if (prev && source.length >= prev.frozenAt && source.startsWith(prev.source.slice(0, prev.frozenAt))) {
    lines = prev.lines;
    lines.length = prev.frozen;
    at = prev.frozenAt;
    style = prev.frozenStyle;
  }
  let frozen = lines.length;
  let frozenAt = at;
  let frozenStyle = style;
  while (at <= source.length) {
    const nl = source.indexOf("\n", at);
    if (nl < 0) {
      // The last line, still being written – parsed again when more arrives; an empty one isn't shown
      if (at < source.length) lines.push(parseLine(source.slice(at), style, prefix).line);
      break;
    }
    const r = parseLine(source.slice(at, nl), style, prefix);
    lines.push(r.line);
    style = r.style;
    at = nl + 1;
    frozen = lines.length;
    frozenAt = at;
    frozenStyle = style;
  }
  return { source, lines, frozen, frozenAt, frozenStyle };
}
