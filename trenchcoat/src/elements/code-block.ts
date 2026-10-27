import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { guard } from "lit/directives/guard.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { OffScreenController } from "./internal/controllers";
import type { Look } from "./internal/look";
import { diffWords } from "./inline-diff";

/*
 * <tc-code-block> – code an AI writes, streaming in with syntax colours from the theme. A head with the file name and
 * the language, and a toolbar: Diff (against the file as it is now, when `current` is given), Copy and Apply (when
 * `applyable`). The code can grow every frame: it is split into lines and each line is coloured once – only the lines
 * that changed (normally the last one) are tokenized and rendered again. While `streaming`, a caret blinks at the end,
 * the body follows the end (unless the reader scrolled up) and Diff and Apply wait for the code to settle.
 *
 *   <tc-code-block filename="src/auth/session.ts" language="ts" .code=${code} .current=${before} applyable></tc-code-block>
 *
 * The colours are a small tokenizer per language (TypeScript/JavaScript, Python, JSON, HTML/XML, CSS, shell, plain),
 * mapped onto existing tokens through --tc-code-block-* properties. The diff is line by line – inline-diff's Myers diff
 * run over one token per line – with long unchanged runs folded behind a button. Standard sits on the gray tray with
 * the head on the tray and the code on a white card; Clean is one white card with a hairline head row. `bare` drops the
 * frame (for use inside another component's card).
 */

/* ---------- Tokenizer ---------- */

/** What a piece of code is; null is plain text */
export type CodeBlockTokenType = "keyword" | "string" | "number" | "comment" | "function" | "type" | "property" | "tag" | "punctuation";
export type CodeBlockToken = { type: CodeBlockTokenType | null; text: string };
export type CodeBlockView = "code" | "diff";
export type CodeBlockViewChange = { view: CodeBlockView };
export type CodeBlockCopy = { text: string };
export type CodeBlockApply = { code: string; filename: string; language: string };
/** One row of a line diff: unchanged, removed or added, with its line numbers in the old and the new text */
export type CodeBlockDiffLine = { kind: "same" | "removed" | "added"; text: string; oldLine: number | null; newLine: number | null };

type Lang = "ts" | "py" | "json" | "html" | "css" | "sh" | "plain";
// Internal token classes: one letter each, "" is plain
type Tok = [string, string];
const TYPE_OF: Record<string, CodeBlockTokenType> = { k: "keyword", s: "string", n: "number", c: "comment", f: "function", t: "type", p: "property", g: "tag", u: "punctuation" };

const ALIASES: Record<string, Lang> = {
  ts: "ts", typescript: "ts", tsx: "ts", js: "ts", javascript: "ts", jsx: "ts", mjs: "ts", cjs: "ts",
  py: "py", python: "py",
  json: "json", jsonc: "json",
  html: "html", xml: "html", svg: "html", vue: "html", svelte: "html",
  css: "css", scss: "css", less: "css",
  sh: "sh", bash: "sh", shell: "sh", zsh: "sh", console: "sh", terminal: "sh",
};
const LABELS: Record<string, string> = {
  ts: "TypeScript", typescript: "TypeScript", tsx: "TSX", js: "JavaScript", javascript: "JavaScript", jsx: "JSX", mjs: "JavaScript", cjs: "JavaScript",
  py: "Python", python: "Python", json: "JSON", jsonc: "JSON", html: "HTML", xml: "XML", svg: "SVG", vue: "Vue", svelte: "Svelte",
  css: "CSS", scss: "SCSS", less: "Less", sh: "Shell", bash: "Bash", shell: "Shell", zsh: "Zsh", console: "Shell", terminal: "Shell",
};
const langOf = (language: string): Lang => ALIASES[language.trim().toLowerCase()] ?? "plain";
/** The language's display name: "ts" → "TypeScript"; unknown ones as given, empty → "Text" */
export const codeBlockLanguageLabel = (language: string) => LABELS[language.trim().toLowerCase()] ?? (language.trim() || "Text");

const words = (s: string) => new Set(s.split(" "));
type CLike = { line: string | null; block: [string, string] | null; quotes: string; multi: string[]; kw: Set<string>; lit: Set<string>; types: Set<string>; keys?: boolean; prefixes?: boolean };
const C: Record<"ts" | "py" | "json", CLike> = {
  ts: {
    line: "//",
    block: ["/*", "*/"],
    quotes: `'"`,
    multi: ["`"],
    kw: words(
      "abstract as async await break case catch class const continue debugger declare default delete do else enum export extends finally for from function get if implements import in instanceof interface is keyof let new of private protected public readonly return satisfies set static super switch this throw try type typeof var void while with yield",
    ),
    lit: words("true false null undefined NaN Infinity"),
    types: words("string number boolean any unknown never bigint symbol object"),
  },
  py: {
    line: "#",
    block: null,
    quotes: `'"`,
    multi: [`"""`, `'''`],
    kw: words("and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case self cls"),
    lit: words("True False None"),
    types: words("int float str bool list dict tuple set bytes object"),
    prefixes: true,
  },
  json: { line: "//", block: ["/*", "*/"], quotes: `"`, multi: [], kw: new Set(), lit: words("true false null"), types: new Set(), keys: true },
};

const IDENT = /[A-Za-z_$][\w$]*/y;
const NUMBER = /(?:0[xXbBoO][\da-fA-F_]+n?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?[njJ]?)/y;
const PY_PREFIX = /[rRbBfFuU]{1,2}(?=["'])/y;

function sticky(re: RegExp, s: string, i: number) {
  re.lastIndex = i;
  return re.exec(s)?.[0] ?? null;
}

/** Index just past the closing `q` (backslash escapes skipped), or -1 when the line ends first */
function closeAt(s: string, from: number, q: string) {
  for (let j = from; j < s.length; j++) {
    if (s[j] === "\\") j++;
    else if (s.startsWith(q, j)) return j + q.length;
  }
  return -1;
}

function tokens() {
  const out: Tok[] = [];
  const push = (cls: string, text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last && last[0] === cls) last[1] += text;
    else out.push([cls, text]);
  };
  return { out, push };
}

const nextNonSpace = (s: string, i: number) => {
  while (i < s.length && (s[i] === " " || s[i] === "\t")) i++;
  return s[i] ?? "";
};

/** TypeScript/JavaScript, Python and JSON. State: "" | "bc" (inside a block comment) | "q<delim>" (inside a multi-line string) */
function lexC(s: string, state: string, c: CLike): [Tok[], string] {
  const { out, push } = tokens();
  let i = 0;
  if (state === "bc" && c.block) {
    const end = s.indexOf(c.block[1]);
    if (end < 0) return push("c", s), [out, "bc"];
    i = end + c.block[1].length;
    push("c", s.slice(0, i));
  } else if (state.startsWith("q")) {
    const end = closeAt(s, 0, state.slice(1));
    if (end < 0) return push("s", s), [out, state];
    i = end;
    push("s", s.slice(0, i));
  }
  while (i < s.length) {
    const ch = s[i];
    if (ch === " " || ch === "\t") {
      let j = i;
      while (j < s.length && (s[j] === " " || s[j] === "\t")) j++;
      push("", s.slice(i, j));
      i = j;
      continue;
    }
    if (c.line && s.startsWith(c.line, i)) {
      push("c", s.slice(i));
      break;
    }
    if (c.block && s.startsWith(c.block[0], i)) {
      const end = s.indexOf(c.block[1], i + c.block[0].length);
      if (end < 0) return push("c", s.slice(i)), [out, "bc"];
      push("c", s.slice(i, end + c.block[1].length));
      i = end + c.block[1].length;
      continue;
    }
    const multi = c.multi.find((m) => s.startsWith(m, i));
    if (multi) {
      const end = closeAt(s, i + multi.length, multi);
      if (end < 0) return push("s", s.slice(i)), [out, `q${multi}`];
      push("s", s.slice(i, end));
      i = end;
      continue;
    }
    if (c.quotes.includes(ch)) {
      const close = closeAt(s, i + 1, ch);
      const end = close < 0 ? s.length : close;
      push(c.keys && nextNonSpace(s, end) === ":" ? "p" : "s", s.slice(i, end));
      i = end;
      continue;
    }
    const prefix = c.prefixes ? sticky(PY_PREFIX, s, i) : null;
    if (prefix) {
      push("s", prefix);
      i += prefix.length;
      continue;
    }
    if (/\d/.test(ch) || (ch === "." && /\d/.test(s[i + 1] ?? ""))) {
      const num = sticky(NUMBER, s, i)!;
      push("n", num);
      i += num.length;
      continue;
    }
    const word = sticky(IDENT, s, i);
    if (word) {
      const after = nextNonSpace(s, i + word.length);
      const member = s[i - 1] === ".";
      const cls = c.kw.has(word) && !member ? "k" : c.lit.has(word) ? "n" : after === "(" ? "f" : member ? "" : c.types.has(word) || /^[A-Z]/.test(word) ? "t" : "";
      push(cls, word);
      i += word.length;
      continue;
    }
    if (ch === "@" && c !== C.json) {
      const name = sticky(IDENT, s, i + 1);
      push("f", `@${name ?? ""}`);
      i += 1 + (name?.length ?? 0);
      continue;
    }
    push("u", ch);
    i++;
  }
  return [out, ""];
}

const SH_KW = words("if then else elif fi for while until do done case esac in function select return export local readonly declare unset source alias sudo");
const SH_WORD = /[^\s'"|&;<>()$#`]+/y;
const SH_VAR = /\$(?:\{[^}]*\}?|\(|[A-Za-z_]\w*|[0-9@#?*!$-])/y;

/** Shell: comments, strings, $variables, flags, and the command word of each command */
function lexSh(s: string): [Tok[], string] {
  const { out, push } = tokens();
  let i = 0;
  let cmd = true;
  if (/^\$ /.test(s) || /^> /.test(s)) {
    push("u", s.slice(0, 2));
    i = 2;
  }
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      push("", ch);
      i++;
      continue;
    }
    if (ch === "#" && (i === 0 || /\s/.test(s[i - 1]))) {
      push("c", s.slice(i));
      break;
    }
    if (ch === "'" || ch === '"') {
      const close = closeAt(s, i + 1, ch);
      const end = close < 0 ? s.length : close;
      push("s", s.slice(i, end));
      i = end;
      cmd = false;
      continue;
    }
    const v = ch === "$" ? sticky(SH_VAR, s, i) : null;
    if (v) {
      push("p", v);
      i += v.length;
      cmd = false;
      continue;
    }
    const word = sticky(SH_WORD, s, i);
    if (word) {
      const assign = cmd ? /^([A-Za-z_]\w*)=(.*)$/.exec(word) : null;
      if (assign) {
        push("p", assign[1]);
        push("u", "=");
        push("", assign[2]);
      } else if (cmd) {
        push(SH_KW.has(word) ? "k" : "f", word);
        cmd = SH_KW.has(word);
      } else push(word.startsWith("-") ? "n" : /^\d+$/.test(word) ? "n" : "", word);
      i += word.length;
      continue;
    }
    push("u", ch);
    if ("|&;(".includes(ch)) cmd = true;
    i++;
  }
  return [out, ""];
}

const TAG_NAME = /[A-Za-z][\w:.-]*/y;
const ATTR = /[^\s=>/"']+/y;

/** HTML and XML. State: "" (text) | "hc" (inside a comment) | "tag" (inside a tag, after its name) */
function lexHtml(s: string, state: string): [Tok[], string] {
  const { out, push } = tokens();
  let i = 0;
  while (i < s.length) {
    if (state === "hc") {
      const end = s.indexOf("-->", i);
      if (end < 0) return push("c", s.slice(i)), [out, "hc"];
      push("c", s.slice(i, end + 3));
      i = end + 3;
      state = "";
      continue;
    }
    const ch = s[i];
    if (state === "tag") {
      if (/\s/.test(ch)) {
        push("", ch);
        i++;
      }
      else if (s.startsWith("/>", i)) {
        push("u", "/>");
        i += 2;
        state = "";
      }
      else if (ch === ">") {
        push("u", ">");
        i++;
        state = "";
      }
      else if (ch === "=") {
        push("u", "=");
        i++;
      }
      else if (ch === '"' || ch === "'") {
        const close = closeAt(s, i + 1, ch);
        const end = close < 0 ? s.length : close;
        push("s", s.slice(i, end));
        i = end;
      } else {
        const a = sticky(ATTR, s, i) ?? ch;
        push("p", a);
        i += a.length;
      }
      continue;
    }
    if (s.startsWith("<!--", i)) {
      state = "hc";
      continue;
    }
    if (ch === "<" && /[A-Za-z/!?]/.test(s[i + 1] ?? "")) {
      const open = s[i + 1] === "/" || s[i + 1] === "!" || s[i + 1] === "?" ? s.slice(i, i + 2) : "<";
      push("u", open);
      i += open.length;
      const name = sticky(TAG_NAME, s, i);
      if (name) {
        push("g", name);
        i += name.length;
      }
      state = "tag";
      continue;
    }
    if (ch === "&") {
      const ent = /&#?\w+;/y;
      const e = sticky(ent, s, i);
      if (e) {
        push("n", e);
        i += e.length;
        continue;
      }
    }
    let j = i + 1;
    while (j < s.length && s[j] !== "<" && s[j] !== "&") j++;
    push("", s.slice(i, j));
    i = j;
  }
  return [out, state];
}

const CSS_IDENT = /-?[A-Za-z_][\w-]*/y;
const CSS_NUM = /-?(?:\d+\.?\d*|\.\d+)(?:%|[A-Za-z]+)?/y;

/** CSS. State: the brace depth, with "c" after it inside a comment ("0", "1c" …) */
function lexCss(s: string, state: string): [Tok[], string] {
  const { out, push } = tokens();
  let depth = parseInt(state, 10) || 0;
  let comment = state.endsWith("c");
  let prop = true;
  let i = 0;
  // Selector context: at the top level, or a nested rule (a selector up to a "{" before any ";")
  const selectorAhead = (from: number) => depth === 0 || /^[^;{}]*\{/.test(s.slice(from));
  let sel = selectorAhead(0);
  while (i < s.length) {
    if (comment) {
      const end = s.indexOf("*/", i);
      if (end < 0) return push("c", s.slice(i)), [out, `${depth}c`];
      push("c", s.slice(i, end + 2));
      i = end + 2;
      comment = false;
      continue;
    }
    const ch = s[i];
    if (/\s/.test(ch)) {
      push("", ch);
      i++;
    } else if (s.startsWith("/*", i)) comment = true;
    else if (ch === '"' || ch === "'") {
      const close = closeAt(s, i + 1, ch);
      const end = close < 0 ? s.length : close;
      push("s", s.slice(i, end));
      i = end;
    } else if (ch === "{" || ch === "}" || ch === ";") {
      push("u", ch);
      if (ch === "{") depth++;
      if (ch === "}") depth = Math.max(0, depth - 1);
      prop = true;
      i++;
      sel = selectorAhead(i);
    } else if (ch === "@") {
      const name = sticky(CSS_IDENT, s, i + 1) ?? "";
      push("k", `@${name}`);
      i += 1 + name.length;
    } else if (sel) {
      // Selectors: classes and ids as types, element names as tags, pseudo-classes as functions
      if ((ch === "." || ch === "#") && sticky(CSS_IDENT, s, i + 1)) {
        const name = sticky(CSS_IDENT, s, i + 1)!;
        push("t", ch + name);
        i += 1 + name.length;
      } else if (ch === ":") {
        const colons = s[i + 1] === ":" ? "::" : ":";
        const name = sticky(CSS_IDENT, s, i + colons.length) ?? "";
        push("f", colons + name);
        i += colons.length + name.length;
      } else {
        const name = sticky(CSS_IDENT, s, i);
        if (name) {
          push("g", name);
          i += name.length;
        } else {
          push("u", ch);
          i++;
        }
      }
    } else {
      // Declarations: property: value;
      const name = /[A-Za-z-]/.test(ch) ? sticky(CSS_IDENT, s, i) : null;
      if (name && prop && nextNonSpace(s, i + name.length) === ":") {
        push("p", name);
        i += name.length;
      } else if (ch === ":") {
        push("u", ch);
        prop = false;
        i++;
      } else if (ch === "#" && /[\da-fA-F]/.test(s[i + 1] ?? "")) {
        const hex = /#[\da-fA-F]+/y;
        const h = sticky(hex, s, i)!;
        push("n", h);
        i += h.length;
      } else if (ch === "!" && s.startsWith("!important", i)) {
        push("k", "!important");
        i += 10;
      } else if (/[\d.]/.test(ch) || (ch === "-" && /[\d.]/.test(s[i + 1] ?? ""))) {
        const n = sticky(CSS_NUM, s, i) ?? ch;
        push("n", n);
        i += n.length;
      } else if (name) {
        push(nextNonSpace(s, i + name.length) === "(" ? "f" : "", name);
        i += name.length;
      } else {
        push("u", ch);
        i++;
      }
    }
  }
  return [out, `${depth}${comment ? "c" : ""}`];
}

function lexLine(lang: Lang, s: string, state: string): [Tok[], string] {
  switch (lang) {
    case "ts":
    case "py":
    case "json":
      return lexC(s, state, C[lang]);
    case "html":
      return lexHtml(s, state);
    case "css":
      return lexCss(s, state);
    case "sh":
      return lexSh(s);
    default:
      return [s ? [["", s]] : [], ""];
  }
}

type Line = { text: string; start: string; end: string; toks: Tok[] };

/** Lines of `code`, reusing the lines of `prev` whose text and starting state are unchanged */
function lexLines(code: string, lang: Lang, prev: Line[] = []): Line[] {
  const texts = code.split("\n");
  const out: Line[] = [];
  let st = "";
  for (let i = 0; i < texts.length; i++) {
    const old = prev[i];
    if (old && old.start === st && old.text === texts[i]) {
      out.push(old);
      st = old.end;
      continue;
    }
    const [toks, end] = lexLine(lang, texts[i], st);
    out.push({ text: texts[i], start: st, end, toks });
    st = end;
  }
  return out;
}

/** The code as lines of coloured tokens – what the element renders, for tests and other renderers */
export function codeBlockTokens(code: string, language = ""): CodeBlockToken[][] {
  return lexLines(code, langOf(language)).map((l) => l.toks.map(([cls, text]) => ({ type: TYPE_OF[cls] ?? null, text })));
}

/* ---------- Line diff ---------- */

const splitLines = (text: string) => (text === "" ? [] : text.replace(/\n$/, "").split("\n"));

/**
 * A line diff of two texts: inline-diff's Myers diff (diffWords) run over one token per distinct line, read back as
 * rows. Within a change, the removed lines come first, then the added ones.
 */
export function codeBlockDiff(before: string, after: string): CodeBlockDiffLine[] {
  const ids = new Map<string, number>();
  const texts: string[] = [];
  const encode = (lines: string[]) =>
    lines
      .map((l) => {
        let id = ids.get(l);
        if (id === undefined) {
          id = texts.length;
          ids.set(l, id);
          texts.push(l);
        }
        return `l${id}`;
      })
      .join(" ");
  const a = encode(splitLines(before));
  const b = encode(splitLines(after));
  const read = (s: string) => [...s.matchAll(/l(\d+)/g)].map((m) => texts[+m[1]]);
  const out: CodeBlockDiffLine[] = [];
  let o = 1;
  let n = 1;
  for (const seg of diffWords(a, b)) {
    if (seg.type === "equal") for (const text of read(seg.text)) out.push({ kind: "same", text, oldLine: o++, newLine: n++ });
    else {
      for (const text of read(seg.remove)) out.push({ kind: "removed", text, oldLine: o++, newLine: null });
      for (const text of read(seg.insert)) out.push({ kind: "added", text, oldLine: null, newLine: n++ });
    }
  }
  return out;
}

/* ---------- Clipboard ---------- */

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure contexts
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

/* ---------- Icons ---------- */

const icon = (cls: string, body: TemplateResult) => html`<svg class=${cls} viewBox="0 0 16 16" aria-hidden="true">${body}</svg>`;
const fileIcon = (look: Look) =>
  icon("ui-cblk__file", look === "clean" ? svg`<path d="M4.25 1.75h4.5l3.5 3.5v8a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-10.5a1 1 0 0 1 1-1Z"></path><path d="M8.5 1.75v3.75h3.75"></path>` : svg`<path d="M4 1.75h4.75L12.25 5.25v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2.75a1 1 0 0 1 1-1Z"></path><path d="M8.5 1.75V5.5h3.75"></path>`);
const copyIcon = (look: Look) =>
  icon(
    "ui-cblk__copy-icon",
    look === "clean"
      ? svg`<rect x="5.5" y="5.5" width="8.5" height="8.5" rx="2"></rect><path d="M10.5 3.75v-.25A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h.25"></path>`
      : svg`<rect x="5.25" y="5.25" width="8" height="8" rx="2"></rect><path d="M10.75 5.25v-1a1.5 1.5 0 0 0-1.5-1.5h-4.5a2 2 0 0 0-2 2v4.5a1.5 1.5 0 0 0 1.5 1.5h1"></path>`,
  );
const checkPath = svg`<path d="M3.5 8.4 6.6 11.3 12.5 4.9"></path>`;
const copyDone = icon("ui-cblk__copy-done", checkPath);
const applyIcon = icon("ui-cblk__glyph", svg`<path d="M12.75 3.5v3.75a2 2 0 0 1-2 2H3.75"></path><path d="M6.25 6.5 3.5 9.25 6.25 12"></path>`);
const appliedIcon = icon("ui-cblk__glyph", checkPath);
const diffIcon = icon("ui-cblk__glyph", svg`<path d="M8 2.5v6M5 5.5h6M5 12.5h6"></path>`);
const unfoldIcon = icon("ui-cblk__glyph", svg`<path d="M8 2v4.25M5.75 4.25 8 2l2.25 2.25M8 14V9.75M5.75 11.75 8 14l2.25-2.25"></path>`);

/* ---------- Element ---------- */

/** Unchanged lines kept around a change; longer unchanged runs fold */
const CONTEXT = 3;
const COPIED_MS = 1600;

type Row =
  | { kind: "same" | "removed" | "added"; old: number | null; new: number | null; toks: Tok[]; key: string }
  | { kind: "gap"; count: number; key: string };

let instances = 0;

/**
 * Streaming code with syntax colours, Copy, Apply, and a line diff against the current file.
 * @tag tc-code-block
 * @fires tc-copy - The code was copied to the clipboard ({ text: string })
 * @fires tc-apply - Apply was pressed ({ code: string, filename: string, language: string })
 * @fires tc-view-change - Code or Diff was picked ({ view: "code" | "diff" }); cancelable
 */
export class TcCodeBlock extends TcElement {
  static override ui = "cblk";

  /** The code; it may grow every frame while streaming */
  @property() accessor code = "";
  /** Language for the colours: ts, tsx, js, jsx, py, json, html, xml, css, sh/bash, or plain */
  @property() accessor language = "";
  /** File name shown in the head, e.g. "src/auth/session.ts" */
  @property() accessor filename = "";
  /** The file as it is now. When given, a Diff button shows the changes the code would make */
  @property({ attribute: false }) accessor current: string | undefined = undefined;
  /** "code" or "diff". Changed by the user unless a tc-view-change listener calls preventDefault() */
  @property({ reflect: true }) accessor view: CodeBlockView = "code";
  /** The code is still coming in: a caret blinks at the end, Diff and Apply wait */
  @property({ type: Boolean, reflect: true }) accessor streaming = false;
  /** Show the Apply button (fires tc-apply) */
  @property({ type: Boolean }) accessor applyable = false;
  /** The code has been applied: Apply turns into a disabled "Applied" */
  @property({ type: Boolean }) accessor applied = false;
  /** Apply button text */
  @property({ attribute: "apply-label" }) accessor applyLabel = "Apply";
  /** Applied state text */
  @property({ attribute: "applied-label" }) accessor appliedLabel = "Applied";
  /** Line numbers in a gutter */
  @property({ type: Boolean, attribute: "line-numbers" }) accessor lineNumbers = true;
  /** Wrap long lines instead of scrolling sideways */
  @property({ type: Boolean }) accessor wrap = false;
  /** Cap the body's height in px (0: grow with the code); a capped body scrolls and follows the end while streaming */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 0;
  /** No tray or card around it – for use inside another component's card */
  @property({ type: Boolean, reflect: true }) accessor bare = false;

  @state() private accessor copied = false;
  @state() private accessor message = "";
  @state() private accessor expanded: ReadonlySet<string> = new Set();
  @state() private accessor tool = 0;

  private readonly uid = `tc-cblk${++instances}`;
  private lines: Line[] = [];
  private lexed: { code: string; lang: Lang } | null = null;
  private diffKey: { current: string; code: string; lang: Lang } | null = null;
  private diff: { rows: CodeBlockDiffLine[]; old: Line[]; added: number; removed: number } | null = null;
  private copyTimer = 0;
  /** The reader is at the end of a capped body: streaming keeps it there */
  private following = true;

  constructor() {
    super();
    // The caret's blink pauses while the block is off-screen
    new OffScreenController(this, () => this.streaming);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.copyTimer);
    this.copyTimer = 0;
  }

  /** @internal */
  get lang() {
    return langOf(this.language);
  }
  private get diffable() {
    return this.current !== undefined && !this.streaming;
  }
  /** @internal The view on screen: Diff only once there is something to diff */
  get shownView(): CodeBlockView {
    return this.view === "diff" && this.diffable ? "diff" : "code";
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const lang = this.lang;
    if (!this.lexed || this.lexed.code !== this.code || this.lexed.lang !== lang) {
      this.lines = lexLines(this.code, lang, this.lexed?.lang === lang ? this.lines : []);
      this.lexed = { code: this.code, lang };
    }
    if (this.diffable) {
      const k = this.diffKey;
      const current = this.current!;
      if (!k || k.current !== current || k.code !== this.code || k.lang !== lang) {
        this.diffKey = { current, code: this.code, lang };
        const rows = codeBlockDiff(current, this.code);
        this.diff = {
          rows,
          old: lexLines(current, lang),
          added: rows.filter((r) => r.kind === "added").length,
          removed: rows.filter((r) => r.kind === "removed").length,
        };
        if (changed.has("current") || (k && k.current !== current)) this.expanded = new Set();
      }
    } else if (this.current === undefined) {
      this.diff = null;
      this.diffKey = null;
    }
  }

  protected override updated(changed: PropertyValues) {
    // A capped body follows the end of streaming code, unless the reader scrolled up
    const body = this.querySelector<HTMLElement>(".ui-cblk__scroll");
    // Switching between the code and the diff starts at the top
    if (body && changed.has("view") && changed.get("view") !== undefined) {
      body.scrollTop = 0;
      body.scrollLeft = 0;
    }
    if (body && this.maxHeight > 0 && this.streaming && this.following && changed.has("code")) body.scrollTop = body.scrollHeight;
  }

  private onScroll = (e: Event) => {
    const b = e.currentTarget as HTMLElement;
    this.following = b.scrollTop + b.clientHeight >= b.scrollHeight - 8;
  };

  /* ---------- Actions ---------- */

  private setView(view: CodeBlockView) {
    if (view === this.view) return;
    if (this.emit<CodeBlockViewChange>("tc-view-change", { view }, { cancelable: true })) this.view = view;
  }

  private async copy() {
    const text = this.code;
    const ok = await copyText(text);
    if (!ok) {
      this.message = "Couldn't copy";
      return;
    }
    this.emit<CodeBlockCopy>("tc-copy", { text });
    this.copied = true;
    this.message = "Copied";
    window.clearTimeout(this.copyTimer);
    this.copyTimer = window.setTimeout(() => {
      this.copied = false;
      this.message = "";
    }, COPIED_MS);
  }

  private apply() {
    if (this.applied || this.streaming) return;
    this.emit<CodeBlockApply>("tc-apply", { code: this.code, filename: this.filename, language: this.language });
  }

  /* ---------- Toolbar (WAI-ARIA toolbar: one tab stop, arrows move between the buttons) ---------- */

  private toolButtons() {
    return [...this.querySelectorAll<HTMLButtonElement>(".ui-cblk__tools > button")];
  }
  private onToolKey(e: KeyboardEvent) {
    const all = this.toolButtons();
    const usable = all.filter((b) => !b.disabled);
    const at = usable.indexOf(e.target as HTMLButtonElement);
    if (at < 0) return;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (at + 1) % usable.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (at - 1 + usable.length) % usable.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = usable.length - 1;
    if (next < 0) return;
    e.preventDefault();
    this.tool = all.indexOf(usable[next]);
    usable[next].focus();
  }

  /* ---------- Render ---------- */

  private toks(toks: Tok[]) {
    return toks.map(([cls, text]) => (cls ? html`<span class=${`ui-cblk__t-${cls}`}>${text}</span>` : text));
  }

  private codeRows() {
    const numbers = this.lineNumbers;
    // A final newline doesn't show as an empty last line – unless the code is still coming in
    const lines = !this.streaming && this.lines.length > 1 && this.lines[this.lines.length - 1].text === "" ? this.lines.slice(0, -1) : this.lines;
    return lines.map((l, i) =>
      guard([l, numbers, i], () => html`<div class="ui-cblk__row">${numbers ? html`<span class="ui-cblk__no" aria-hidden="true">${i + 1}</span>` : nothing}<span class="ui-cblk__lc">${this.toks(l.toks)}</span></div>`),
    );
  }

  /** The diff as rows, with long unchanged runs folded into a gap (unless expanded) */
  private diffRows(): Row[] {
    const d = this.diff!;
    const rows: Row[] = [];
    const list = d.rows;
    let i = 0;
    while (i < list.length) {
      if (list[i].kind !== "same") {
        const r = list[i];
        const toks = r.kind === "removed" ? d.old[r.oldLine! - 1]?.toks : this.lines[r.newLine! - 1]?.toks;
        rows.push({ kind: r.kind, old: r.oldLine, new: r.newLine, toks: toks ?? [["", r.text]], key: `${r.kind}${r.oldLine ?? r.newLine}` });
        i++;
        continue;
      }
      let j = i;
      while (j < list.length && list[j].kind === "same") j++;
      const head = i === 0 ? 0 : CONTEXT;
      const tail = j === list.length ? 0 : CONTEXT;
      const key = `g${list[i].oldLine}`;
      const fold = j - i - head - tail;
      for (let k = i; k < j; k++) {
        const inFold = fold > 3 && !this.expanded.has(key) && k >= i + head && k < j - tail;
        if (inFold) {
          if (k === i + head) rows.push({ kind: "gap", count: fold, key });
          continue;
        }
        const r = list[k];
        rows.push({ kind: "same", old: r.oldLine, new: r.newLine, toks: this.lines[r.newLine! - 1]?.toks ?? [["", r.text]], key: `s${r.newLine}` });
      }
      i = j;
    }
    return rows;
  }

  private diffBody() {
    const numbers = this.lineNumbers;
    return this.diffRows().map((r) => {
      if (r.kind === "gap")
        return html`<div class="ui-cblk__row ui-cblk__row--gap"><button type="button" class="ui-cblk__gap" @click=${() => (this.expanded = new Set([...this.expanded, r.key]))}>${unfoldIcon}Show ${r.count} unchanged lines</button></div>`;
      const sign = r.kind === "added" ? "+" : r.kind === "removed" ? "−" : " ";
      return html`<div class="ui-cblk__row" data-kind=${r.kind}>${numbers
          ? html`<span class="ui-cblk__no" aria-hidden="true">${r.old ?? ""}</span><span class="ui-cblk__no" aria-hidden="true">${r.new ?? ""}</span>`
          : nothing}<span class="ui-cblk__sign" aria-hidden="true">${sign}</span><span class="ui-cblk__lc">${r.kind === "same" ? nothing : html`<span class="ui-cblk__sr">${r.kind === "added" ? "Added: " : "Removed: "}</span>`}${this.toks(r.toks)}</span></div>`;
    });
  }

  private tools(look: Look, diffOn: boolean) {
    const d = this.diff;
    const buttons: TemplateResult[] = [];
    const showDiff = this.current !== undefined && !this.bare;
    const idx = { diff: -1, copy: -1, apply: -1 };
    let n = 0;
    if (showDiff) idx.diff = n++;
    idx.copy = n++;
    if (this.applyable) idx.apply = n++;
    // The roving tab stop: the last button used, else the first one that works
    const usable = [showDiff && this.diffable, true, this.applyable && !this.applied && !this.streaming];
    const order = [idx.diff, idx.copy, idx.apply];
    const stop = order.includes(this.tool) && usable[order.indexOf(this.tool)] ? this.tool : idx.copy;
    const tab = (i: number) => (i === stop ? "0" : "-1");
    if (showDiff)
      buttons.push(html`<button
        type="button"
        class="ui-cblk__btn ui-cblk__btn--toggle"
        tabindex=${tab(idx.diff)}
        aria-pressed=${diffOn ? "true" : "false"}
        ?disabled=${!this.diffable}
        title=${this.streaming ? "Diff is ready once the code is written" : "Compare with the current file"}
        @focus=${() => (this.tool = idx.diff)}
        @click=${() => this.setView(diffOn ? "code" : "diff")}
      >${diffIcon}<span>Diff</span>${d && this.diffable ? html`<span class="ui-cblk__stat"><span class="ui-cblk__plus">+${d.added}</span><span class="ui-cblk__minus">−${d.removed}</span></span>` : nothing}</button>`);
    buttons.push(html`<button
      type="button"
      class="ui-cblk__icon"
      tabindex=${tab(idx.copy)}
      ?data-copied=${this.copied}
      aria-label="Copy code"
      title=${this.copied ? "Copied" : "Copy code"}
      @focus=${() => (this.tool = idx.copy)}
      @click=${() => void this.copy()}
    >${copyIcon(look)}${copyDone}</button>`);
    if (this.applyable)
      buttons.push(html`<button
        type="button"
        class=${this.applied ? "ui-cblk__btn ui-cblk__btn--done" : "ui-cblk__btn ui-cblk__btn--primary"}
        tabindex=${tab(idx.apply)}
        ?disabled=${this.applied || this.streaming}
        title=${this.applied ? this.appliedLabel : this.applyLabel}
        @focus=${() => (this.tool = idx.apply)}
        @click=${() => this.apply()}
      >${this.applied ? appliedIcon : applyIcon}<span>${this.applied ? this.appliedLabel : this.applyLabel}</span></button>`);
    return html`<div class="ui-cblk__tools" role="toolbar" aria-label="Code actions" @keydown=${(e: KeyboardEvent) => this.onToolKey(e)}>${buttons}</div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const view = this.shownView;
    const diffOn = view === "diff";
    const label = codeBlockLanguageLabel(this.language);
    const name = this.filename;
    // The folder truncates first; the file's own name stays readable
    const cut = name.lastIndexOf("/") + 1;
    const dir = name.slice(0, cut);
    const base = name.slice(cut);
    const d = this.diff;
    const digits = String(Math.max(this.lines.length, d && diffOn ? (this.diff!.old.length ?? 0) : 0, 9)).length;
    const head = html`<div class="ui-cblk__head">
      <span class="ui-cblk__title">
        ${name ? html`${fileIcon(look)}<span class="ui-cblk__name" title=${name}>${dir ? html`<span class="ui-cblk__dir">${dir}</span>` : nothing}<span class="ui-cblk__base">${base}</span></span>` : nothing}
        <span class="ui-cblk__lang">${label}</span>
        ${this.streaming ? html`<span class="ui-cblk__writing"><span class="ui-cblk__dot" aria-hidden="true"></span>Writing</span>` : nothing}
        ${this.bare && diffOn && d ? html`<span class="ui-cblk__stat"><span class="ui-cblk__plus">+${d.added}</span><span class="ui-cblk__minus">−${d.removed}</span></span>` : nothing}
      </span>
      ${this.tools(look, diffOn)}
    </div>`;
    const scrollStyle = styleMap({ maxHeight: this.maxHeight > 0 ? `${this.maxHeight}px` : undefined, "--tc-code-block-digits": String(digits) });
    const what = name || `${label} code`;
    const body = html`<div
      class="ui-cblk__scroll"
      id=${`${this.uid}-body`}
      role="region"
      tabindex="0"
      aria-label=${diffOn ? `Changes to ${what}` : what}
      aria-busy=${ifDefined(this.streaming ? "true" : undefined)}
      ?data-wrap=${this.wrap}
      ?data-numbers=${this.lineNumbers}
      data-view=${view}
      style=${scrollStyle}
      @scroll=${this.onScroll}
    >
      <div class="ui-cblk__rows">${diffOn ? this.diffBody() : this.codeRows()}</div>
    </div>`;
    const status = html`<span class="ui-cblk__sr" role="status">${this.message}</span>`;
    if (look === "clean" || this.bare) return html`<div class="ui-cblk__card">${head}${body}</div>${status}`;
    return html`${head}<div class="ui-cblk__card">${body}</div>${status}`;
  }

  static override css = /* css */ `
/* Syntax colours: existing tokens, so they follow both looks and both themes. Override them on [data-ui="cblk"] */
[data-ui="cblk"] {
  --tc-code-block-keyword: var(--tc-syntax-keyword);
  --tc-code-block-string: var(--tc-syntax-string);
  --tc-code-block-number: var(--tc-syntax-number);
  --tc-code-block-comment: var(--tc-syntax-comment);
  --tc-code-block-function: var(--tc-syntax-function);
  --tc-code-block-type: var(--tc-syntax-type);
  --tc-code-block-property: var(--tc-syntax-property);
  --tc-code-block-tag: var(--tc-syntax-tag);
  --tc-code-block-punctuation: var(--tc-syntax-punctuation);
  --tc-code-block-text: var(--tc-syntax-text);
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cblk"] *, [data-ui="cblk"] *::before, [data-ui="cblk"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cblk"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-secondary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  letter-spacing: var(--tc-tracking-normal);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cblk"] {
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
}
[data-ui="cblk"][bare] { padding: 0; border-radius: 0; background: none; }
/* The card the code sits on */
.ui-cblk__card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__card { border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
[data-ui="cblk"][bare] > .ui-cblk__card { border-radius: 0; background: none; box-shadow: none; }
/* Head: file name and language on the left, the toolbar on the right */
.ui-cblk__head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cblk__head { min-height: 40px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__head { min-height: 44px; padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-3-5); border-bottom: 0.5px solid var(--tc-border-default); }
[data-ui="cblk"][bare] .ui-cblk__head { min-height: 40px; padding: var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-border-default); }
.ui-cblk__title { display: flex; flex: 1; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-cblk__file { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__file { width: 16px; height: 16px; stroke-width: 1.1; }
.ui-cblk__name { display: flex; min-width: 0; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-cblk__dir { min-width: 0; overflow: hidden; color: var(--tc-text-secondary); text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__dir { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-cblk__base { flex: none; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.ui-cblk__lang { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-cblk__name + .ui-cblk__lang::before { content: "·"; margin-right: var(--tc-space-2); }
.ui-cblk__writing { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-cblk__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--tc-accent); animation: ui-cblk-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-cblk__stat { display: inline-flex; gap: var(--tc-space-1); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-cblk__plus { color: var(--tc-status-success-fg); }
.ui-cblk__minus { color: var(--tc-status-danger-fg); }
/* Toolbar: Diff (a toggle), Copy (an icon), Apply (the primary action) */
.ui-cblk__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-1); }
.ui-cblk__btn,
.ui-cblk__icon,
.ui-cblk__gap {
  appearance: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  margin: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: transparent;
  color: var(--tc-action-ghost-fg);
  font: inherit;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
  -webkit-tap-highlight-color: transparent;
}
.ui-cblk__btn { padding: 0 var(--tc-control-px-sm) 0 var(--tc-space-2); }
.ui-cblk__icon { width: var(--tc-control-h-sm); padding: 0; }
.ui-cblk__btn:hover:not(:disabled),
.ui-cblk__icon:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cblk__btn:active:not(:disabled),
.ui-cblk__icon:active { transform: scale(0.97); }
.ui-cblk__btn:focus-visible,
.ui-cblk__icon:focus-visible,
.ui-cblk__gap:focus-visible,
.ui-cblk__scroll:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-cblk__scroll:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-cblk__btn:disabled { cursor: default; opacity: 0.4; }
/* Diff pressed: the selected chip – a white card on the tray, a soft fill in Clean */
:where([data-look="standard"], [data-look="standard"] *).ui-cblk__btn--toggle[aria-pressed="true"] { background: var(--tc-surface-on-tray); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__btn--toggle[aria-pressed="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-cblk__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-cblk__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); color: var(--tc-action-primary-fg); }
.ui-cblk__btn--primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active); }
.ui-cblk__btn--done:disabled { opacity: 1; color: var(--tc-status-success-fg); }
.ui-cblk__glyph { flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__glyph { width: 16px; height: 16px; stroke-width: 1.1; }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__btn:not(.ui-cblk__btn--primary) .ui-cblk__glyph { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__btn--done .ui-cblk__glyph { color: currentColor; }
/* Copy: the icon swaps for a check */
.ui-cblk__icon svg { position: absolute; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), filter var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__icon svg { width: 16px; height: 16px; stroke-width: 1.1; }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__icon { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__copy-icon rect { fill: currentColor; stroke: none; }
.ui-cblk__copy-done { opacity: 0; transform: scale(0.6); filter: blur(2px); }
.ui-cblk__icon[data-copied] { color: var(--tc-status-success-fg); }
.ui-cblk__icon[data-copied] .ui-cblk__copy-icon { opacity: 0; transform: scale(0.6); filter: blur(2px); }
.ui-cblk__icon[data-copied] .ui-cblk__copy-done { opacity: 1; transform: none; filter: none; }
/* The code: mono, one row per line, a gutter of line numbers */
.ui-cblk__scroll {
  position: relative;
  overflow: auto;
  color: var(--tc-code-block-text);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  letter-spacing: 0;
  tab-size: 2;
  overscroll-behavior: contain;
}
.ui-cblk__rows { display: grid; width: max-content; min-width: 100%; padding: var(--tc-space-3) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-cblk__rows { padding: var(--tc-space-2-5) 0 var(--tc-space-3); }
.ui-cblk__scroll[data-wrap] .ui-cblk__rows { width: auto; }
.ui-cblk__row { display: flex; min-width: 0; }
.ui-cblk__no {
  flex: none;
  width: calc(var(--tc-code-block-digits, 2) * 1ch + var(--tc-space-4));
  padding-right: var(--tc-space-3);
  color: var(--tc-text-muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
  user-select: none;
  -webkit-user-select: none;
}
.ui-cblk__lc { flex: 1; min-height: var(--tc-line-height-normal); padding: 0 var(--tc-space-4); white-space: pre; }
.ui-cblk__scroll[data-numbers] .ui-cblk__lc { padding-left: var(--tc-space-1); }
.ui-cblk__scroll[data-wrap] .ui-cblk__lc { white-space: pre-wrap; overflow-wrap: anywhere; }
/* The caret at the end of streaming code */
[data-ui="cblk"][streaming] .ui-cblk__scroll[data-view="code"] .ui-cblk__row:last-child .ui-cblk__lc::after {
  content: "";
  display: inline-block;
  width: 7px;
  height: 14px;
  margin-left: var(--tc-space-0-5);
  vertical-align: -2px;
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-accent);
  animation: ui-cblk-blink var(--tc-duration-shimmer) steps(2, jump-none) infinite;
}
[data-ui="cblk"][data-offscreen] .ui-cblk__lc::after,
[data-ui="cblk"][data-offscreen] .ui-cblk__dot { animation-play-state: paused; }
/* Token colours */
.ui-cblk__t-k { color: var(--tc-code-block-keyword); }
.ui-cblk__t-s { color: var(--tc-code-block-string); }
.ui-cblk__t-n { color: var(--tc-code-block-number); }
.ui-cblk__t-c { color: var(--tc-code-block-comment); font-style: italic; }
.ui-cblk__t-f { color: var(--tc-code-block-function); }
.ui-cblk__t-t { color: var(--tc-code-block-type); }
.ui-cblk__t-p { color: var(--tc-code-block-property); }
.ui-cblk__t-g { color: var(--tc-code-block-tag); }
.ui-cblk__t-u { color: var(--tc-code-block-punctuation); }
/* Diff rows: a soft tint, a sign – never colour alone – and the line numbers of both sides */
.ui-cblk__sign { flex: none; width: 2ch; color: var(--tc-text-muted); text-align: center; user-select: none; -webkit-user-select: none; }
.ui-cblk__scroll[data-view="diff"] .ui-cblk__no { width: calc(var(--tc-code-block-digits, 2) * 1ch + var(--tc-space-3)); padding-right: var(--tc-space-2); }
.ui-cblk__scroll[data-view="diff"] .ui-cblk__lc { padding-left: var(--tc-space-1); }
.ui-cblk__row[data-kind="added"] { background: var(--tc-status-success-bg); }
.ui-cblk__row[data-kind="removed"] { background: var(--tc-status-danger-bg); }
.ui-cblk__row[data-kind="added"] .ui-cblk__sign,
.ui-cblk__row[data-kind="added"] .ui-cblk__no { color: var(--tc-status-success-fg); }
.ui-cblk__row[data-kind="removed"] .ui-cblk__sign,
.ui-cblk__row[data-kind="removed"] .ui-cblk__no { color: var(--tc-status-danger-fg); }
.ui-cblk__row--gap { padding: var(--tc-space-0-5) var(--tc-space-2); }
.ui-cblk__gap {
  position: sticky;
  left: var(--tc-space-2);
  height: 24px;
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-subtle);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-regular);
}
.ui-cblk__gap:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-cblk__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@keyframes ui-cblk-blink { from { opacity: 1; } to { opacity: 0; } }
@keyframes ui-cblk-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
/* Narrow: the language and the diff label give way to the file name and the counts */
@container (max-width: 480px) {
  .ui-cblk__name + .ui-cblk__lang, .ui-cblk__btn--toggle > span:not(.ui-cblk__stat) { display: none; }
}
@container (max-width: 360px) {
  .ui-cblk__writing { display: none; }
  .ui-cblk__dir { max-width: 3ch; }
  .ui-cblk__btn--primary { width: var(--tc-control-h-sm); padding: 0; }
  .ui-cblk__btn--primary > span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
@media (hover: none) and (pointer: coarse) {
  .ui-cblk__btn, .ui-cblk__icon { height: 34px; }
  .ui-cblk__icon { width: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cblk"] *, [data-ui="cblk"] *::before, [data-ui="cblk"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-code-block")) customElements.define("tc-code-block", TcCodeBlock);

declare global {
  interface HTMLElementTagNameMap {
    "tc-code-block": TcCodeBlock;
  }
}
