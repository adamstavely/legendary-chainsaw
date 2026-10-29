import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { ModalController } from "./internal/modal";
import { safeUrl } from "./internal/safe-url";
import { copyText, formatDate } from "./internal/util";

/*
 * <tc-json-viewer> – a JSON document laid out for someone to review: an API response, an extraction an agent made, a
 * config or a record export. Two views of the same document:
 *   · Document – read like a form: fields as labelled rows (keys in plain words – "invoice_date" reads "Invoice date"),
 *     nested objects as sections, lists of like objects as tables, lists of values as chips; links, dates, yes/no and
 *     null drawn as what they are
 *   · Raw – the JSON itself, pretty-printed, with line numbers and syntax colours
 * A search box marks matching keys and values in both views and counts them; Enter goes to the next. Reviewers flag a
 * field with a note beside its row, and the flags travel in tc-flags-change, so the page can keep them; Copy and Download hand over the JSON.
 *
 * Give it `value` (already parsed) or `source` (text: it's parsed, and a syntax error is shown at its line and
 * column with the text around it). With `modal`, it's a dialog: `open` shows it (tc-open-change asks to close, from
 * Escape or Close), and the page behind is inert while it's up.
 *
 * With `layout="split"` Document and Raw sit side by side (no tabs then – both are showing), each scrolling on its own; pointing at or focusing a field marks its lines in the raw JSON and scrolls them into view, and
 * clicking a raw line finds its field. A toolbar button switches between the two layouts (tc-layout-change); narrow,
 * the two panes stack.
 *
 * Paths are JSON Pointers ("/line_items/0/amount"). Long lists show their first 50 entries in Document, with Show all.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-json-viewer heading="Invoice INV-2207" .value=${extraction}></tc-json-viewer>
 *   <tc-json-viewer modal open heading="Response" .source=${text} @tc-open-change=${close}></tc-json-viewer>
 */

/** Any JSON value */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type JsonViewerView = "document" | "raw";
/** One view at a time behind tabs, or the rendered view and the raw JSON side by side */
export type JsonViewerLayout = "tabs" | "split";
/** A reviewer's flag: the field (a JSON Pointer) and what they said about it */
export type JsonFlag = { path: string; note: string };
/** How Document names a field: in plain words ("Invoice date"), or the key as written */
export type JsonKeyStyle = "words" | "raw";

/** Details of the events */
export type JsonViewerViewChange = { view: JsonViewerView };
export type JsonViewerLayoutChange = { layout: JsonViewerLayout };
export type JsonViewerOpenChange = { open: boolean };
export type JsonViewerFilterChange = { filter: string };
/** `flags` is the list as it will be; `note` is null when the flag was removed */
export type JsonViewerFlagsChange = { flags: JsonFlag[]; path: string; note: string | null };
export type JsonViewerCopy = { text: string };
export type JsonViewerDownload = { filename: string; text: string };

let uidCount = 0;
const ROW_CAP = 50;
const EMPTY_KEY = "(empty key)";
/** How much of a nested value a table cell shows inline */
const INLINE_CHARS = 80;
const RAW_CAP = 4000;
const TABLE_COLUMNS = 8;

/* braces, search, flag, copy, download, x, check, external-link, columns-2, circle-alert: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>, cls = "") =>
  html`<svg class=${cls || nothing} width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const bracesIcon = svg`<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"></path><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"></path>`;
const searchIcon = () => lucide(14, svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`);
const flagIcon = (size = 14) => lucide(size, svg`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" x2="4" y1="22" y2="15"></line>`);
const copyIcon = () => lucide(14, svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const downloadIcon = () => lucide(14, svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line>`);
const xIcon = (size = 16) => lucide(size, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const checkIcon = (size = 14) => lucide(size, svg`<path d="M20 6 9 17l-5-5"></path>`);
const linkIcon = () => lucide(12, svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`);
const splitIcon = () => lucide(14, svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M12 3v18"></path>`);
const alertIcon = () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line>`);

/* ---------- JSON helpers, exported for pages ---------- */

const isContainer = (v: unknown): v is JsonValue[] | { [k: string]: JsonValue } => v !== null && typeof v === "object";
const entriesOf = (v: JsonValue[] | { [k: string]: JsonValue }): [string, JsonValue][] => (Array.isArray(v) ? v.map((x, i) => [String(i), x]) : Object.entries(v));

/** A key as a JSON Pointer token: ~ and / escaped */
const token = (key: string) => key.replace(/~/g, "~0").replace(/\//g, "~1");
/** The path of `key` under `parent` */
export const jsonPointer = (parent: string, key: string) => `${parent}/${token(key)}`;

/** The value at a JSON Pointer, or undefined */
export function valueAt(doc: unknown, path: string): unknown {
  if (path === "") return doc;
  let cur: unknown = doc;
  for (const raw of path.slice(1).split("/")) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isContainer(cur)) return undefined;
    cur = Array.isArray(cur) ? cur[Number(key)] : (cur as Record<string, unknown>)[key];
    if (cur === undefined) return undefined;
  }
  return cur;
}

const ACRONYMS = new Set(["id", "ids", "url", "uri", "api", "ip", "ui", "sku", "vat", "iban", "json", "html", "pdf", "utc", "iso", "ssn", "eta", "faq"]);
/** A key in plain words: "invoice_date", "invoiceDate" and "invoice-date" all read "Invoice date"; "vendor_id" reads "Vendor ID" */
export function keyWords(key: string) {
  if (/^\d+$/.test(key)) return `Item ${Number(key) + 1}`;
  const words = key
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_\-.]+/)
    .filter(Boolean);
  if (!words.length) return key;
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      if (/^[A-Z\d]+$/.test(w) && w.length > 1) return w;
      return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(" ");
}

/** Where JSON text first goes wrong, as an offset – a small scanner, for browsers whose messages don't say; -1 when it's valid */
export function firstJsonError(text: string): number {
  let i = 0;
  const ws = () => {
    while (i < text.length && " \t\n\r".includes(text[i])) i++;
  };
  const fail = (): never => {
    throw i;
  };
  const lit = (word: string) => {
    for (const ch of word) {
      if (text[i] !== ch) fail();
      i++;
    }
  };
  const str = () => {
    i++;
    while (i < text.length && text[i] !== '"') {
      if (text[i] === "\\") {
        i++;
        if (text[i] === "u") {
          if (!/^[0-9a-f]{4}$/i.test(text.slice(i + 1, i + 5))) fail();
          i += 4;
        } else if (!'"\\/bfnrt'.includes(text[i] ?? "")) fail();
      } else if (text.charCodeAt(i) < 0x20) fail();
      i++;
    }
    if (text[i] !== '"') fail();
    i++;
  };
  const num = () => {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail();
    i += m![0].length;
  };
  const value = (): void => {
    ws();
    const c = text[i];
    if (c === "{") {
      i++;
      ws();
      if (text[i] === "}") return void i++;
      for (;;) {
        ws();
        if (text[i] !== '"') fail();
        str();
        ws();
        if (text[i] !== ":") fail();
        i++;
        value();
        ws();
        if (text[i] === ",") i++;
        else if (text[i] === "}") return void i++;
        else fail();
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (text[i] === "]") return void i++;
      for (;;) {
        value();
        ws();
        if (text[i] === ",") i++;
        else if (text[i] === "]") return void i++;
        else fail();
      }
    }
    if (c === '"') return str();
    if (c === "t") return lit("true");
    if (c === "f") return lit("false");
    if (c === "n") return lit("null");
    if (c === "-" || (c >= "0" && c <= "9")) return num();
    fail();
  };
  try {
    value();
    ws();
    return i < text.length ? i : -1;
  } catch (at) {
    return typeof at === "number" ? at : 0;
  }
}

/** A JSON syntax error's position in the text: 1-based line and column, from the browser's message or found by scanning */
export function errorPosition(text: string, message: string): { line: number; column: number } | null {
  const lc = /line (\d+) column (\d+)/i.exec(message);
  if (lc) return { line: Number(lc[1]), column: Number(lc[2]) };
  const pos = /position (\d+)/i.exec(message);
  const at = pos ? Number(pos[1]) : firstJsonError(text);
  if (at < 0) return null;
  const lines = text.slice(0, at).split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A JSON document laid out for review – Document and Raw, one at a time or side by side, search across them, flags with notes on fields,
 * Copy and Download – inline or as a modal.
 * @tag tc-json-viewer
 * @fires tc-view-change - The view changed ({ view }: JsonViewerViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-layout-change - Tabs or side by side was switched ({ layout }: JsonViewerLayoutChange); cancelable – prevented, `layout` stays as it was
 * @fires tc-filter-change - The search changed ({ filter }: JsonViewerFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-flags-change - A flag was added, edited or removed ({ flags, path, note }: JsonViewerFlagsChange); cancelable – prevented, `flags` stays as it was
 * @fires tc-open-change - With `modal`: asks to open or close ({ open }: JsonViewerOpenChange), from Escape or Close; cancelable – prevented, `open` stays
 * @fires tc-copy - The JSON was copied ({ text }: JsonViewerCopy); cancelable – prevented, nothing is copied
 * @fires tc-download - Download was pressed ({ filename, text }: JsonViewerDownload); cancelable – prevented, the page saves it its own way
 */
export class TcJsonViewer extends TcElement {
  static override ui = "jsv";

  /** The heading, and the viewer's name */
  @property() accessor heading = "JSON";
  /** One line under the heading; by default the document's size and how many values it holds */
  @property() accessor description: string | undefined = undefined;
  /** The document, already parsed. `source` is used when this is undefined */
  @property({ attribute: false }) accessor value: JsonValue | undefined = undefined;
  /** The document as JSON text, parsed when `value` isn't given; a syntax error is shown where it is */
  @property() accessor source: string | undefined = undefined;
  /** The view shown. Changed by the user unless a tc-view-change listener calls preventDefault() */
  @property({ reflect: true }) accessor view: JsonViewerView = "document";
  /** "tabs" shows one view at a time; "split" shows the rendered view beside the raw JSON. Switched by the user unless tc-layout-change is prevented */
  @property({ reflect: true }) accessor layout: JsonViewerLayout = "tabs";
  /** Whether the toolbar offers the switch between tabs and side by side */
  @property({ type: Boolean, attribute: "layout-toggle" }) accessor layoutToggle = true;
  /** What the search box holds. Changed by the user unless tc-filter-change is prevented */
  @property() accessor filter = "";
  /** The reviewer's flags. Changed by the user unless tc-flags-change is prevented */
  @property({ attribute: false }) accessor flags: JsonFlag[] = [];
  /** Whether reviewers can flag fields */
  @property({ type: Boolean, attribute: "flaggable" }) accessor flaggable = true;
  /** How Document names fields: "words" ("Invoice date") or "raw" (the key as written) */
  @property({ attribute: "key-style" }) accessor keyStyle: JsonKeyStyle = "words";
  /** The name Download saves the file under */
  @property() accessor filename = "document.json";
  /** The language for numbers and dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Show it as a dialog, opened by `open` */
  @property({ type: Boolean, reflect: true }) accessor modal = false;
  /** With `modal`: whether the dialog is showing. Escape and Close ask to close (tc-open-change) */
  @property({ type: Boolean, reflect: true }) accessor open = false;

  @state() private accessor editing: string | null = null;
  @state() private accessor draft = "";
  @state() private accessor showAll = new Set<string>();
  @state() private accessor rawAll = false;
  @state() private accessor copied = false;
  @state() private accessor hitAt = -1;
  @state() private accessor announce = "";

  private uid = `tc-jsv-${++uidCount}`;
  private copiedTimer = 0;
  private parsed: { value: JsonValue | undefined; error: string | null; position: { line: number; column: number } | null } = { value: undefined, error: null, position: null };
  private readonly modalCtl = new ModalController(this, {
    dialog: () => this.querySelector<HTMLDialogElement>(".ui-jsv__dialog"),
    focus: () => this.querySelector<HTMLElement>(".ui-jsv__close"),
    lockScroll: true,
  });

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  /* ---------- The model ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("value") || changed.has("source")) {
      this.parse();
      this.showAll = new Set();
      this.rawAll = false;
      this.hitAt = -1;
    }
    if (changed.has("filter")) this.hitAt = -1;
    if (changed.has("filter") || changed.has("value") || changed.has("source") || changed.has("keyStyle")) {
      this.hits = this.findMatches();
      this.hitSet = new Set(this.hits);
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.modal) this.modalCtl.sync(this.open);
    // A render puts the raw lines back as they were: mark the linked field's lines again
    const want = this.linked;
    this.linked = null;
    if (this.layout === "split") this.link(want, false);
  }

  private parse() {
    if (this.value !== undefined) {
      this.parsed = { value: this.value, error: null, position: null };
      return;
    }
    if (this.source === undefined || !this.source.trim()) {
      this.parsed = { value: undefined, error: null, position: null };
      return;
    }
    try {
      this.parsed = { value: JSON.parse(this.source) as JsonValue, error: null, position: null };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.parsed = { value: undefined, error: message, position: errorPosition(this.source, message) };
    }
  }

  /** The document shown */
  get document(): JsonValue | undefined {
    return this.parsed.value;
  }

  private get query() {
    return this.filter.trim().toLowerCase();
  }

  /** Paths whose key or (plain) value matches the search, in document order – worked out once per change */
  private hits: string[] = [];
  private hitSet = new Set<string>();
  private findMatches(): string[] {
    const q = this.query;
    const doc = this.document;
    if (!q || doc === undefined) return [];
    const out: string[] = [];
    const walk = (v: JsonValue, path: string, key: string | null) => {
      const keyHit = key !== null && !/^\d+$/.test(key) && (key.toLowerCase().includes(q) || keyWords(key).toLowerCase().includes(q));
      const valueHit = !isContainer(v) && String(v).toLowerCase().includes(q);
      if (keyHit || valueHit) out.push(path);
      if (isContainer(v)) for (const [k, c] of entriesOf(v)) walk(c, jsonPointer(path, k), k);
    };
    walk(doc, "", null);
    return out;
  }

  private flagAt(path: string) {
    return this.flags.find((f) => f.path === path);
  }

  /* ---------- Actions ---------- */

  private setView(view: JsonViewerView) {
    if (view === this.view) return;
    if (!this.emit<JsonViewerViewChange>("tc-view-change", { view }, { cancelable: true })) return;
    this.view = view;
    this.editing = null;
  }

  private setLayout(layout: JsonViewerLayout) {
    if (layout === this.layout) return;
    if (!this.emit<JsonViewerLayoutChange>("tc-layout-change", { layout }, { cancelable: true })) return;
    this.layout = layout;
    this.announce = layout === "split" ? "Side by side" : "One view at a time";
  }

  /** The view on the left: side by side, it's always Document (Raw is on the right) */
  private get leftView(): JsonViewerView {
    return this.layout === "split" ? "document" : this.view;
  }

  /** The field whose raw lines are marked, side by side – set straight on the lines, so pointing doesn't re-render */
  private linked: string | null = null;
  private link(path: string | null, scroll = true) {
    if (this.layout !== "split" || path === this.linked) return;
    this.linked = path;
    const raw = this.querySelector<HTMLElement>(".ui-jsv__pane[data-raw]");
    if (!raw) return;
    for (const l of raw.querySelectorAll("[data-linked]")) l.removeAttribute("data-linked");
    if (path === null) return;
    const lines = [...raw.querySelectorAll<HTMLElement>(".ui-jsv__line[data-path]")].filter((l) => {
      const p = l.dataset.path!;
      return p === path || (path === "" ? true : p.startsWith(`${path}/`));
    });
    for (const l of lines) l.setAttribute("data-linked", "");
    // Scrolled within the raw pane only – the page stays where it is
    const first = lines[0];
    if (scroll && first) {
      const top = first.offsetTop - raw.offsetTop;
      const bottom = lines[lines.length - 1].offsetTop - raw.offsetTop + lines[lines.length - 1].offsetHeight;
      if (top < raw.scrollTop || bottom > raw.scrollTop + raw.clientHeight) raw.scrollTop = Math.max(0, top - raw.clientHeight / 3);
    }
  }
  /** The field (or row) under the pointer or focus on the left, by its data-path */
  private onLeftPoint = (e: Event) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>("[data-path]");
    if (el && this.contains(el)) this.link(el.dataset.path ?? null);
  };
  /** A raw line clicked: its field, found on the left */
  private onRawClick = (e: Event) => {
    const line = (e.target as Element | null)?.closest<HTMLElement>(".ui-jsv__line[data-path]");
    if (!line) return;
    const path = line.dataset.path!;
    this.link(path, false);
    const left = this.querySelector<HTMLElement>(".ui-jsv__pane[data-left]");
    let target: HTMLElement | null = null;
    for (let p = path; ; p = p.slice(0, p.lastIndexOf("/"))) {
      target = left?.querySelector<HTMLElement>(`[data-path="${CSS.escape(p)}"]`) ?? null;
      if (target || !p) break;
    }
    if (left && target) {
      left.scrollTop = Math.max(0, target.offsetTop - left.offsetTop - left.clientHeight / 3);
      target.setAttribute("data-found", "");
      setTimeout(() => target!.removeAttribute("data-found"), 1200);
    }
  };

  private setFilter(filter: string) {
    if (!this.emit<JsonViewerFilterChange>("tc-filter-change", { filter }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.filter = filter;
    const n = this.findMatches().length;
    this.announce = filter.trim() ? (n ? `${n} ${n === 1 ? "match" : "matches"}` : "No matches") : "";
  }

  /** Enter in the search: the next match, scrolled into view */
  private nextMatch(back = false) {
    const list = this.hits;
    if (!list.length) return;
    this.hitAt = (this.hitAt + (back ? -1 : 1) + list.length) % list.length;
    const path = list[this.hitAt];
    this.announce = `Match ${this.hitAt + 1} of ${list.length}`;
    void this.updateComplete.then(() => {
      // The match itself, or the nearest thing drawn that holds it (a table cell showing a nested value)
      let el: HTMLElement | null = null;
      for (let p = path; ; p = p.slice(0, p.lastIndexOf("/"))) {
        el = this.querySelector<HTMLElement>(`.ui-jsv__body [data-path="${CSS.escape(p)}"]`);
        if (el || !p) break;
      }
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  private setFlag(path: string, note: string | null) {
    const rest = this.flags.filter((f) => f.path !== path);
    const flags = note === null ? rest : [...rest, { path, note }];
    if (!this.emit<JsonViewerFlagsChange>("tc-flags-change", { flags, path, note }, { cancelable: true })) return false;
    this.flags = flags;
    this.announce = note === null ? `Flag removed from ${this.label(path)}` : `Flagged ${this.label(path)}`;
    return true;
  }

  private startFlag(path: string) {
    this.editing = path;
    this.draft = this.flagAt(path)?.note ?? "";
    void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>(".ui-jsv__note-input")?.focus());
  }
  private saveFlag() {
    const path = this.editing;
    if (path === null) return;
    // Prevented, the page owns the flags and shows its own next render; the note box closes either way
    this.setFlag(path, this.draft.trim());
    this.editing = null;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-flag-for="${CSS.escape(path)}"]`)?.focus());
  }
  private cancelFlag() {
    const path = this.editing;
    this.editing = null;
    if (path !== null) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-flag-for="${CSS.escape(path)}"]`)?.focus());
  }

  private async copy() {
    const text = JSON.stringify(this.document, null, 2);
    if (!this.emit<JsonViewerCopy>("tc-copy", { text }, { cancelable: true })) return;
    if (!(await copyText(text))) return;
    this.copied = true;
    this.announce = "JSON copied";
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = false), 1600);
  }


  private download() {
    const text = JSON.stringify(this.document, null, 2);
    if (!this.emit<JsonViewerDownload>("tc-download", { filename: this.filename, text }, { cancelable: true })) return;
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = this.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private setOpen(open: boolean) {
    if (!this.emit<JsonViewerOpenChange>("tc-open-change", { open }, { cancelable: true })) return;
    this.open = open;
  }

  /* ---------- Rendering helpers ---------- */

  private label(path: string) {
    if (!path) return "the document";
    return this.keyName(path.slice(path.lastIndexOf("/") + 1).replace(/~1/g, "/").replace(/~0/g, "~"));
  }
  /** A key as Document names it: in words or as written; the empty key ("") gets a name of its own */
  private keyName(key: string) {
    if (key === "") return EMPTY_KEY;
    return this.keyStyle === "words" ? keyWords(key) : key;
  }
  private keyCell(key: string) {
    return key === "" ? html`<span class="ui-jsv__empty">${EMPTY_KEY}</span>` : this.hl(this.keyName(key));
  }

  /** Text with the search's matches marked */
  private hl(text: string): unknown {
    const q = this.query;
    if (!q) return text;
    const lower = text.toLowerCase();
    const parts: unknown[] = [];
    let at = 0;
    for (let i = lower.indexOf(q); i >= 0; i = lower.indexOf(q, at)) {
      parts.push(text.slice(at, i), html`<mark class="ui-jsv__mark">${text.slice(i, i + q.length)}</mark>`);
      at = i + q.length;
    }
    parts.push(text.slice(at));
    return parts;
  }

  private fmtNumber(n: number) {
    if (!Number.isFinite(n) || Math.abs(n) >= 1e15) return String(n);
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 20 }).format(n);
  }

  /** A plain value drawn as what it is: a link, a date, yes / no, null, a number or text */
  private prim(v: JsonValue): TemplateResult {
    if (v === null) return html`<span class="ui-jsv__null">null</span>`;
    if (typeof v === "boolean")
      return html`<span class="ui-jsv__bool" data-v=${String(v)}>${v ? checkIcon(12) : xIcon(12)}${v ? "Yes" : "No"}<span class="tc-sr-only"> (${String(v)})</span></span>`;
    if (typeof v === "number") return html`<span class="ui-jsv__num">${this.hl(this.fmtNumber(v))}</span>`;
    const s = String(v);
    if (!s) return html`<span class="ui-jsv__empty">Empty</span>`;
    if (/^https?:\/\//i.test(s) && safeUrl(s))
      return html`<a class="ui-jsv__link" href=${ifDefined(safeUrl(s))} target="_blank" rel="noopener noreferrer">${this.hl(s)}${linkIcon()}</a>`;
    if (EMAIL.test(s)) return html`<a class="ui-jsv__link" href=${ifDefined(safeUrl(`mailto:${s}`))}>${this.hl(s)}</a>`;
    if (ISO_DATE.test(s)) {
      const ms = Date.parse(s.length === 10 ? `${s}T00:00:00` : s);
      if (!Number.isNaN(ms)) {
        const opts: Intl.DateTimeFormatOptions = s.length > 10 ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" };
        return html`<time class="ui-jsv__date" datetime=${s} title=${s}>${this.hl(formatDate(ms, this.locale, opts))}</time>`;
      }
    }
    return html`<span class="ui-jsv__str">${this.hl(s)}</span>`;
  }

  /** A nested value in a table cell: its JSON on one line (searchable, marked), shortened with its size when long */
  private inline(v: JsonValue[] | { [k: string]: JsonValue }, path: string) {
    const full = JSON.stringify(v);
    const short = full.length > INLINE_CHARS ? `${full.slice(0, INLINE_CHARS - 1)}…` : full;
    const hidden = short !== full && this.hits.some((h) => h.startsWith(`${path}/`)) && !short.toLowerCase().includes(this.query);
    return html`<code class="ui-jsv__inline" title=${full} ?data-match=${hidden}>${this.hl(short)}</code>${short !== full ? html` <span class="ui-jsv__count">${this.summary(v)}</span>` : nothing}`;
  }

  private summary(v: JsonValue) {
    if (Array.isArray(v)) return `${v.length} ${v.length === 1 ? "item" : "items"}`;
    if (isContainer(v)) {
      const n = Object.keys(v).length;
      return `${n} ${n === 1 ? "field" : "fields"}`;
    }
    return "";
  }

  /* ---------- Flags ---------- */

  private flagButton(path: string) {
    if (!this.flaggable) return nothing;
    const f = this.flagAt(path);
    return html`<button
      type="button"
      class="ui-jsv__flag-btn"
      data-flag-for=${path}
      ?data-on=${!!f}
      aria-pressed=${f ? "true" : "false"}
      title=${f ? "Edit flag" : "Flag"}
      @click=${() => this.startFlag(path)}
    >${flagIcon()}<span class="tc-sr-only">${f ? "Edit flag on" : "Flag"} ${this.label(path)}</span></button>`;
  }

  /** The note under a flagged field, or the box for writing one */
  private flagNote(path: string) {
    if (this.editing === path) {
      const id = `${this.uid}-note`;
      return html`<div class="ui-jsv__note-edit" @click=${(e: Event) => e.stopPropagation()}>
        <label class="tc-sr-only" for=${id}>Note on ${this.label(path)}</label>
        <textarea
          id=${id}
          class="ui-jsv__note-input"
          rows="2"
          placeholder="What needs checking?"
          .value=${live(this.draft)}
          @input=${(e: Event) => (this.draft = (e.target as HTMLTextAreaElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              e.preventDefault();
              this.cancelFlag();
            } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              this.saveFlag();
            }
          }}
        ></textarea>
        <div class="ui-jsv__note-actions">
          ${this.flagAt(path)
            ? html`<button type="button" class="ui-jsv__text-btn" @click=${() => {
                this.setFlag(path, null);
                this.editing = null;
              }}>Remove flag</button>`
            : nothing}
          <span class="ui-jsv__spacer"></span>
          <button type="button" class="ui-jsv__btn" @click=${() => this.cancelFlag()}>Cancel</button>
          <button type="button" class="ui-jsv__btn" data-primary @click=${() => this.saveFlag()}>Save flag</button>
        </div>
      </div>`;
    }
    const f = this.flagAt(path);
    if (!f) return nothing;
    return html`<p class="ui-jsv__note">${flagIcon(12)}<span>${f.note || "Flagged"}</span></p>`;
  }

  /* ---------- Document ---------- */

  private docValue(v: JsonValue, path: string, depth: number): TemplateResult {
    if (!isContainer(v)) return this.prim(v);
    if (Array.isArray(v)) return this.docArray(v, path, depth);
    return this.docObject(v, path, depth);
  }

  private docObject(v: { [k: string]: JsonValue }, path: string, depth: number): TemplateResult {
    const entries = Object.entries(v);
    if (!entries.length) return html`<p class="ui-jsv__empty">No fields</p>`;
    // Plain fields as rows; containers as sections – in the document's order
    const out: TemplateResult[] = [];
    let rows: TemplateResult[] = [];
    const flush = () => {
      if (rows.length) out.push(html`<dl class="ui-jsv__fields">${rows}</dl>`);
      rows = [];
    };
    for (const [k, c] of entries) {
      const p = jsonPointer(path, k);
      if (isContainer(c) && entriesOf(c).length) {
        flush();
        out.push(this.docSection(k, c, p, depth));
      } else {
        rows.push(this.docRow(k, c, p));
      }
    }
    flush();
    return html`${out}`;
  }

  private docRow(key: string, v: JsonValue, path: string) {
    const flagged = !!this.flagAt(path);
    return html`<div class="ui-jsv__row" data-path=${path} ?data-flagged=${flagged} ?data-match=${this.hitSet.has(path)}>
      <dt class="ui-jsv__key" title=${key}>${this.keyCell(key)}</dt>
      <dd class="ui-jsv__val">
        <div class="ui-jsv__val-main">${isContainer(v) ? html`<span class="ui-jsv__empty">${Array.isArray(v) ? "Empty list" : "No fields"}</span>` : this.prim(v)}${this.flagNote(path)}</div>
        ${this.flagButton(path)}
      </dd>
    </div>`;
  }

  private docSection(key: string, v: JsonValue[] | { [k: string]: JsonValue }, path: string, depth: number) {
    const level = Math.min(6, 4 + depth);
    const title = html`${this.keyCell(key)} <span class="ui-jsv__count">${this.summary(v)}</span>`;
    const heading =
      level === 4
        ? html`<h4 class="ui-jsv__heading">${title}</h4>`
        : level === 5
          ? html`<h5 class="ui-jsv__heading">${title}</h5>`
          : html`<h6 class="ui-jsv__heading">${title}</h6>`;
    return html`<section class="ui-jsv__section" data-path=${path} data-depth=${Math.min(depth, 3)} ?data-flagged=${!!this.flagAt(path)}>
      <div class="ui-jsv__section-head">${heading}${this.flagButton(path)}</div>
      ${this.flagNote(path)}
      <div class="ui-jsv__section-body">${this.docValue(v, path, depth + 1)}</div>
    </section>`;
  }

  /** A list: chips for short values, a table for like objects, otherwise one section per item */
  private docArray(v: JsonValue[], path: string, depth: number): TemplateResult {
    if (!v.length) return html`<p class="ui-jsv__empty">Empty list</p>`;
    // While searching, a list with a match past the cap shows all of it, so the match can be seen
    const matchBeyond = this.hits.some((h) => h.startsWith(`${path}/`) && Number(h.slice(path.length + 1).split("/")[0]) >= ROW_CAP);
    const capped = !this.showAll.has(path) && v.length > ROW_CAP && !matchBeyond;
    const shown = capped ? v.slice(0, ROW_CAP) : v;
    const more = capped
      ? html`<button type="button" class="ui-jsv__text-btn ui-jsv__more" @click=${() => (this.showAll = new Set(this.showAll).add(path))}>Show all ${this.fmtNumber(v.length)}</button>`
      : nothing;
    if (v.every((x) => !isContainer(x))) {
      const short = v.every((x) => String(x).length <= 40);
      if (short)
        return html`<ul class="ui-jsv__chips">
            ${shown.map((x, i) => {
              const p = jsonPointer(path, String(i));
              return html`<li class="ui-jsv__chip" data-path=${p} ?data-match=${this.hitSet.has(p)}>${this.prim(x)}</li>`;
            })}
          </ul>
          ${more}`;
      return html`<ol class="ui-jsv__list">
          ${shown.map((x, i) => {
            const p = jsonPointer(path, String(i));
            return html`<li class="ui-jsv__list-item" data-path=${p}>${this.prim(x)}</li>`;
          })}
        </ol>
        ${more}`;
    }
    const columns = this.tableColumns(v);
    if (columns) {
      return html`<div class="ui-jsv__table-wrap" tabindex="0" role="region" aria-label=${`${this.label(path)} table`}>
          <table class="ui-jsv__table">
            <thead>
              <tr>
                ${columns.map((c) => html`<th scope="col" title=${c}>${this.keyCell(c)}</th>`)}
                ${this.flaggable ? html`<th scope="col"><span class="tc-sr-only">Flag</span></th>` : nothing}
              </tr>
            </thead>
            <tbody>
              ${shown.map((row, i) => {
                const p = jsonPointer(path, String(i));
                const obj = row as { [k: string]: JsonValue };
                return html`<tr data-path=${p} ?data-flagged=${!!this.flagAt(p)}>
                    ${columns.map((c) => {
                      const cell = obj[c];
                      const cp = jsonPointer(p, c);
                      return html`<td data-path=${cp} ?data-match=${this.hitSet.has(cp)} ?data-num=${typeof cell === "number"}>
                        ${cell === undefined ? html`<span class="ui-jsv__empty">–</span>` : isContainer(cell) ? this.inline(cell, cp) : this.prim(cell)}
                      </td>`;
                    })}
                    ${this.flaggable ? html`<td class="ui-jsv__flag-cell">${this.flagButton(p)}</td>` : nothing}
                  </tr>
                  ${this.editing === p || this.flagAt(p) ? html`<tr class="ui-jsv__note-row"><td colspan=${columns.length + (this.flaggable ? 1 : 0)}>${this.flagNote(p)}</td></tr>` : nothing}`;
              })}
            </tbody>
          </table>
        </div>
        ${more}`;
    }
    return html`${shown.map((x, i) => {
        const p = jsonPointer(path, String(i));
        return isContainer(x) ? this.docSection(String(i), x, p, depth) : html`<dl class="ui-jsv__fields">${this.docRow(String(i), x, p)}</dl>`;
      })}
      ${more}`;
  }

  /** The columns when every item is an object of mostly plain values sharing its keys; otherwise null */
  private tableColumns(v: JsonValue[]): string[] | null {
    if (!v.every((x) => isContainer(x) && !Array.isArray(x))) return null;
    const cols: string[] = [];
    let plain = 0;
    let all = 0;
    for (const x of v as { [k: string]: JsonValue }[]) {
      for (const [k, c] of Object.entries(x)) {
        if (!cols.includes(k)) cols.push(k);
        all++;
        if (!isContainer(c)) plain++;
      }
    }
    if (!cols.length || cols.length > TABLE_COLUMNS || plain < all * 0.75) return null;
    return cols;
  }

  /* ---------- Views ---------- */

  private renderDocument() {
    const doc = this.document!;
    return html`<div class="ui-jsv__doc">
      ${isContainer(doc) ? this.docValue(doc, "", 0) : html`<dl class="ui-jsv__fields">${this.docRow("value", doc, "")}</dl>`}
    </div>`;
  }

  private renderRaw() {
    const lines: TemplateResult[] = [];
    const ind = (n: number) => "  ".repeat(n);
    // Keys as JSON writes them – quotes, backslashes and line breaks escaped, so every line stays valid JSON
    const key = (k: string) => html`<span class="ui-jsv__s-prop">${this.hl(JSON.stringify(k))}</span><span class="ui-jsv__s-punc">: </span>`;
    const prim = (v: JsonValue) => {
      if (v === null) return html`<span class="ui-jsv__s-kw">null</span>`;
      if (typeof v === "boolean") return html`<span class="ui-jsv__s-kw">${String(v)}</span>`;
      if (typeof v === "number") return html`<span class="ui-jsv__s-num">${this.hl(String(v))}</span>`;
      return html`<span class="ui-jsv__s-str">${this.hl(JSON.stringify(v))}</span>`;
    };
    const comma = (yes: boolean) => (yes ? html`<span class="ui-jsv__s-punc">,</span>` : nothing);
    const emit = (v: JsonValue, depth: number, k: string | null, trailing: boolean, path: string) => {
      if (lines.length > RAW_CAP && !this.rawAll) return;
      const head = k === null ? nothing : key(k);
      if (!isContainer(v)) {
        lines.push(html`<span class="ui-jsv__line" data-path=${path} ?data-flagged=${!!this.flagAt(path)}>${ind(depth)}${head}${prim(v)}${comma(trailing)}</span>`);
        return;
      }
      const arr = Array.isArray(v);
      const kids = entriesOf(v);
      const [o, c] = arr ? ["[", "]"] : ["{", "}"];
      if (!kids.length) {
        lines.push(html`<span class="ui-jsv__line" data-path=${path}>${ind(depth)}${head}<span class="ui-jsv__s-punc">${o}${c}</span>${comma(trailing)}</span>`);
        return;
      }
      lines.push(html`<span class="ui-jsv__line" data-path=${path} ?data-flagged=${!!this.flagAt(path)}>${ind(depth)}${head}<span class="ui-jsv__s-punc">${o}</span></span>`);
      kids.forEach(([ck, cv], i) => emit(cv, depth + 1, arr ? null : ck, i < kids.length - 1, jsonPointer(path, ck)));
      lines.push(html`<span class="ui-jsv__line" data-path=${path} data-close>${ind(depth)}<span class="ui-jsv__s-punc">${c}</span>${comma(trailing)}</span>`);
    };
    emit(this.document!, 0, null, false, "");
    const capped = !this.rawAll && lines.length > RAW_CAP;
    return html`<pre class="ui-jsv__raw" tabindex="0" aria-label=${`${this.heading} as JSON`}><code>${capped ? lines.slice(0, RAW_CAP) : lines}</code></pre>
      ${capped ? html`<button type="button" class="ui-jsv__text-btn ui-jsv__more" @click=${() => (this.rawAll = true)}>Show the whole document</button>` : nothing}`;
  }

  private renderError() {
    const pos = this.parsed.position;
    const src = this.source ?? "";
    const lines = src.split("\n");
    const from = pos ? Math.max(1, pos.line - 2) : 1;
    const to = pos ? Math.min(lines.length, pos.line + 2) : Math.min(lines.length, 5);
    return html`<div class="ui-jsv__error" role="alert">
      <p class="ui-jsv__error-title">${alertIcon()}<span>This isn't valid JSON${pos ? html` – line ${pos.line}, column ${pos.column}` : nothing}</span></p>
      <p class="ui-jsv__error-msg">${this.parsed.error}</p>
      <pre class="ui-jsv__snippet"><code>${lines.slice(from - 1, to).map(
        (l, i) =>
          html`<span class="ui-jsv__line" data-n=${from + i} ?data-bad=${pos?.line === from + i}>${l}</span>${pos?.line === from + i
              ? html`<span class="ui-jsv__caret" aria-hidden="true">${" ".repeat(Math.max(0, pos.column - 1))}^</span>`
              : nothing}`,
      )}</code></pre>
    </div>`;
  }

  private renderTabs() {
    const views: [JsonViewerView, string][] = [
      ["document", "Document"],
      ["raw", "Raw"],
    ];
    const current = this.leftView;
    return html`<div class="ui-jsv__tabs" role="tablist" aria-label="View">
      ${views.map(
        ([id, label]) => html`<button
          type="button"
          role="tab"
          class="ui-jsv__tab"
          id=${`${this.uid}-tab-${id}`}
          aria-selected=${current === id ? "true" : "false"}
          aria-controls=${`${this.uid}-panel`}
          tabindex=${current === id ? 0 : -1}
          @click=${() => this.setView(id)}
          @keydown=${(e: KeyboardEvent) => {
            const i = views.findIndex((v) => v[0] === current);
            const next = e.key === "ArrowRight" ? views[(i + 1) % views.length] : e.key === "ArrowLeft" ? views[(i + views.length - 1) % views.length] : e.key === "Home" ? views[0] : e.key === "End" ? views[views.length - 1] : null;
            if (!next) return;
            e.preventDefault();
            this.setView(next[0]);
            void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-tab-${this.leftView}`)?.focus());
          }}
        >${label}</button>`,
      )}
    </div>`;
  }

  private stats() {
    const doc = this.document;
    if (doc === undefined) return "";
    let n = 0;
    const walk = (v: JsonValue) => {
      n++;
      if (isContainer(v)) for (const [, c] of entriesOf(v)) walk(c);
    };
    walk(doc);
    const bytes = new TextEncoder().encode(JSON.stringify(doc)).length;
    const size = bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${this.fmtNumber(Math.round(bytes / 102.4) / 10)} KB` : `${this.fmtNumber(Math.round(bytes / 104857.6) / 10)} MB`;
    return `${size} · ${this.fmtNumber(n)} ${n === 1 ? "value" : "values"}`;
  }

  private renderPanel() {
    const id = this.uid;
    const doc = this.document;
    const error = this.parsed.error;
    const n = this.hits.length;
    const flags = this.flags.filter((f) => valueAt(doc, f.path) !== undefined);
    const head = cardHead({
      icon: bracesIcon,
      title: this.heading,
      subtitle: this.description ?? this.stats(),
      id: `${id}-title`,
      level: this.modal ? 2 : 3,
      keepAside: this.modal,
      aside: html`${doc !== undefined && this.layout === "tabs" ? this.renderTabs() : nothing}${this.modal
        ? html`<button type="button" class="ui-jsv__close" @click=${() => this.setOpen(false)}>${xIcon()}<span class="tc-sr-only">Close</span></button>`
        : nothing}`,
    });
    return html`
      ${head}
      <div class="ui-jsv__card">
        ${doc !== undefined
          ? html`<div class="ui-jsv__toolbar">
              <label class="ui-jsv__search" ?data-count=${!!this.query}>
                <span class="ui-jsv__search-icon" aria-hidden="true">${searchIcon()}</span>
                <span class="tc-sr-only">Search keys and values</span>
                <input
                  type="search"
                  class="ui-jsv__search-input"
                  placeholder="Search keys and values"
                  aria-describedby=${`${id}-count`}
                  .value=${live(this.filter)}
                  @input=${(e: Event) => this.setFilter((e.target as HTMLInputElement).value)}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      this.nextMatch(e.shiftKey);
                    } else if (e.key === "Escape" && this.filter) {
                      e.preventDefault();
                      e.stopPropagation();
                      this.setFilter("");
                    }
                  }}
                />
                <span class="ui-jsv__matches" id=${`${id}-count`}>${this.query ? (n ? `${this.hitAt >= 0 ? `${this.hitAt + 1} of ` : ""}${n} ${n === 1 ? "match" : "matches"}` : "No matches") : ""}</span>
              </label>
              <span class="ui-jsv__spacer"></span>
              ${this.layoutToggle
                ? html`<button type="button" class="ui-jsv__btn" data-compact title="Side by side" aria-pressed=${this.layout === "split" ? "true" : "false"} @click=${() => this.setLayout(this.layout === "split" ? "tabs" : "split")}
                    >${splitIcon()}<span class="ui-jsv__btn-label">Side by side</span></button
                  >`
                : nothing}
              <button type="button" class="ui-jsv__btn" title="Copy JSON" @click=${() => this.copy()}>${this.copied ? checkIcon() : copyIcon()}<span class="ui-jsv__btn-label">${this.copied ? "Copied" : "Copy JSON"}</span></button>
              <button type="button" class="ui-jsv__btn" title="Download" @click=${() => this.download()}>${downloadIcon()}<span class="ui-jsv__btn-label">Download</span></button>
            </div>`
          : nothing}
        ${doc !== undefined && !error && this.layout === "split"
          ? html`<div class="ui-jsv__split">
              <div
                class="ui-jsv__body ui-jsv__pane"
                data-left
                id=${`${id}-panel`}
                role="region"
                aria-label=${`${this.heading}, document`}
                @pointerover=${this.onLeftPoint}
                @focusin=${this.onLeftPoint}
                @pointerleave=${() => this.link(null, false)}
              >
                ${this.renderDocument()}
              </div>
              <div class="ui-jsv__body ui-jsv__pane" data-raw role="region" aria-label="Raw JSON" @click=${this.onRawClick}>${this.renderRaw()}</div>
            </div>`
          : html`<div class="ui-jsv__body" id=${`${id}-panel`} role=${ifDefined(doc !== undefined ? "tabpanel" : undefined)} aria-labelledby=${ifDefined(doc !== undefined ? `${id}-tab-${this.view}` : undefined)}>
              ${error
                ? this.renderError()
                : doc === undefined
                  ? html`<p class="ui-jsv__none">No document to show.</p>`
                  : this.view === "raw"
                    ? this.renderRaw()
                    : this.renderDocument()}
            </div>`}
        ${doc !== undefined && this.flaggable && flags.length
          ? html`<div class="ui-jsv__flags">
              ${flagIcon()}
              <span>${flags.length} ${flags.length === 1 ? "field" : "fields"} flagged</span>
              <span class="ui-jsv__flag-list">
                ${flags.map(
                  (f) => html`<button
                    type="button"
                    class="ui-jsv__flag-chip"
                    title=${f.note}
                    @click=${() => {
                      // In tabs, Raw shows no flags' fields: go to Document first
                      if (this.layout === "tabs" && this.view === "raw") this.setView("document");
                      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-jsv__doc [data-path="${CSS.escape(f.path)}"]`)?.scrollIntoView({ block: "nearest" }));
                    }}
                  >${this.label(f.path)}</button>`,
                )}
              </span>
            </div>`
          : nothing}
      </div>
    `;
  }

  protected override render() {
    const status = html`<span class="tc-sr-only" role="status">${this.announce}</span>`;
    if (!this.modal) return html`${status}${this.renderPanel()}`;
    return html`<dialog
      class="ui-jsv__dialog"
      aria-labelledby=${`${this.uid}-title`}
      @cancel=${(e: Event) => {
        e.preventDefault();
        if (this.editing !== null) return;
        this.setOpen(false);
      }}
      @close=${() => {
        if (this.modalCtl.ownClose() || !this.open) return;
        this.setOpen(false);
        if (this.open) requestAnimationFrame(() => this.open && this.modalCtl.reopen());
      }}
    >
      <div class="ui-jsv__panel">${status}${this.renderPanel()}</div>
    </dialog>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="jsv"] {
  --tc-jsv-body-h: 520px;
  --tc-jsv-key-w: 34%;
  --tc-jsv-count-w: 6.5rem;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a gray tray holding a white card. Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="jsv"]:not([modal]) { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-jsv__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="jsv"]:not([modal]) { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-jsv__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="jsv"] *, [data-ui="jsv"] *::before, [data-ui="jsv"] *::after { box-sizing: border-box; }
:where([data-ui="jsv"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="jsv"] :is(button, a, [tabindex], textarea):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="jsv"]) :is(h4, h5, h6, p, dl, dd, ul, ol, pre) { margin: 0; padding: 0; }
[data-ui="jsv"] :is(ul, ol) { list-style: none; }
[data-ui="jsv"] svg { display: block; flex: none; }
/* ----- As a dialog ----- */
/* As a dialog the host has no box of its own: the dialog is the tray (Standard) or the card (Clean) */
[data-ui="jsv"][modal] { display: contents; }
.ui-jsv__dialog { box-sizing: border-box; width: min(960px, calc(100vw - 2 * var(--tc-space-4))); height: min(820px, calc(100dvh - 2 * var(--tc-space-4))); max-width: none; max-height: none; margin: auto; padding: 0; overflow: hidden; border: 0; color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; }
.ui-jsv__dialog:not([open]) { display: none; }
.ui-jsv__dialog::backdrop { background: var(--tc-scrim); }
.ui-jsv__dialog[open] { animation: ui-jsv-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *) .ui-jsv__dialog { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); box-shadow: var(--tc-shadow-overlay); }
:where([data-look="clean"], [data-look="clean"] *) .ui-jsv__dialog { border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); }
.ui-jsv__panel { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.ui-jsv__panel > .ui-jsv__card { display: flex; flex: 1; flex-direction: column; min-height: 0; }
.ui-jsv__panel .ui-jsv__body { flex: 1; max-height: none; }
.ui-jsv__close { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-jsv__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* ----- Header tabs ----- */
.ui-jsv__tabs { display: inline-flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-jsv__tab { display: inline-flex; align-items: center; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-jsv__tab[aria-selected="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-jsv__tab[aria-selected="true"] { font-weight: var(--tc-font-weight-strong); }
.tc-head__aside:has(.ui-jsv__close) { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
/* ----- Toolbar: search, Side by side, Copy and Download ----- */
.ui-jsv__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2); }
.ui-jsv__search { position: relative; display: flex; flex: 1 1 14rem; align-items: center; min-width: 0; max-width: 26rem; }
.ui-jsv__search-icon { position: absolute; left: var(--tc-space-2-5); color: var(--tc-icon-muted); pointer-events: none; }
.ui-jsv__search-input { width: 100%; height: var(--tc-control-h-md); padding: 0 var(--tc-field-px) 0 calc(var(--tc-space-2-5) + var(--tc-space-5)); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-fill-subtle); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-jsv__search[data-count] .ui-jsv__search-input { padding-right: calc(var(--tc-space-2-5) + var(--tc-jsv-count-w)); }
.ui-jsv__search-input::placeholder { color: var(--tc-text-placeholder); }
.ui-jsv__search-input::-webkit-search-cancel-button { display: none; }
.ui-jsv__search-input:hover { background: var(--tc-fill-hover); }
.ui-jsv__search-input:focus-visible { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
.ui-jsv__matches { position: absolute; right: var(--tc-space-2-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; }
.ui-jsv__spacer { flex: 1; }
.ui-jsv__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-jsv__btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-jsv__btn[data-primary] { padding: 0 var(--tc-control-px-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-weight: var(--tc-control-font-weight); }
.ui-jsv__btn[data-primary]:hover { background: var(--tc-action-primary-bg-hover); color: var(--tc-action-primary-fg); }
.ui-jsv__text-btn { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); }
.ui-jsv__text-btn:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-jsv__more { margin-top: var(--tc-space-2); }
.ui-jsv__mark { border-radius: var(--tc-radius-2xs); background: var(--tc-tone-amber-bg); color: inherit; box-shadow: 0 0 0 1px var(--tc-tone-amber-border); }
/* ----- The body: one view at a time, scrolling inside ----- */
.ui-jsv__body { max-height: var(--tc-jsv-body-h); overflow: auto; overscroll-behavior: contain; padding: var(--tc-space-1) var(--tc-space-4) var(--tc-space-4); scrollbar-width: thin; }
.ui-jsv__none { padding: var(--tc-space-8) 0; color: var(--tc-text-muted); text-align: center; }
/* ----- Side by side: the rendered view and the raw JSON, each scrolling on its own ----- */
.ui-jsv__split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-jsv__pane { height: var(--tc-jsv-body-h); max-height: none; }
.ui-jsv__pane[data-raw] { padding: var(--tc-space-1) var(--tc-space-3) var(--tc-space-3); border-left: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-surface-sunken); }
.ui-jsv__pane[data-raw] .ui-jsv__raw { padding-top: var(--tc-space-2); border-radius: 0; background: none; box-shadow: none; }
.ui-jsv__panel .ui-jsv__split { flex: 1; min-height: 0; }
.ui-jsv__panel .ui-jsv__pane { height: auto; min-height: 0; }
.ui-jsv__pane[data-raw] .ui-jsv__line[data-path] { cursor: pointer; }
.ui-jsv__raw .ui-jsv__line[data-linked] { background: var(--tc-fill-selected); box-shadow: inset 2px 0 0 var(--tc-accent); }
[data-found] { animation: ui-jsv-found var(--tc-duration-slowest) var(--tc-ease-standard); }
@keyframes ui-jsv-found { 0%, 60% { background: var(--tc-fill-selected); } }
/* ----- Document ----- */
.ui-jsv__doc { display: grid; gap: var(--tc-space-3); }
.ui-jsv__fields { display: grid; }
.ui-jsv__row { position: relative; display: grid; grid-template-columns: var(--tc-jsv-key-w) minmax(0, 1fr); align-items: start; column-gap: var(--tc-space-3); padding: var(--tc-space-2) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-jsv__row:last-child { border-bottom: 0; }
.ui-jsv__key { padding-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); overflow-wrap: anywhere; }
/* The value, then the flag button at the row's end (inside the dd: a dl row holds only its dt and dd) */
.ui-jsv__val { display: grid; grid-template-columns: minmax(0, 1fr) var(--tc-control-h-sm); align-items: start; column-gap: var(--tc-space-2); min-width: 0; color: var(--tc-text-primary); }
.ui-jsv__val-main { min-width: 0; padding-top: var(--tc-space-0-5); overflow-wrap: anywhere; white-space: pre-wrap; }
.ui-jsv__row[data-flagged], tr[data-flagged] > td { background: linear-gradient(var(--tc-tone-amber-bg), var(--tc-tone-amber-bg)); }
.ui-jsv__row[data-flagged] { margin: 0 calc(-1 * var(--tc-space-2)); padding-inline: var(--tc-space-2); border-radius: var(--tc-radius-md); }
.ui-jsv__section { display: grid; gap: var(--tc-space-1-5); }
.ui-jsv__section[data-depth="1"], .ui-jsv__section[data-depth="2"], .ui-jsv__section[data-depth="3"] { padding-left: var(--tc-space-3); border-left: 2px solid var(--tc-divider); }
.ui-jsv__section-head { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); }
.ui-jsv__heading { display: flex; flex: 1; align-items: baseline; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-jsv__section[data-depth="0"] > .ui-jsv__section-head .ui-jsv__heading { padding-top: var(--tc-space-2); }
.ui-jsv__section[data-flagged] > .ui-jsv__section-head { margin: 0 calc(-1 * var(--tc-space-2)); padding-inline: var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-tone-amber-bg); }
.ui-jsv__count { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-jsv__section[data-flagged] > .ui-jsv__section-head .ui-jsv__count { color: var(--tc-text-secondary); }
.ui-jsv__section-body { display: grid; gap: var(--tc-space-3); min-width: 0; }
.ui-jsv__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-jsv__chip { display: inline-flex; align-items: center; min-height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-jsv__list { display: grid; gap: var(--tc-space-1); padding-left: var(--tc-space-5) !important; list-style: decimal !important; color: var(--tc-text-primary); }
.ui-jsv__list-item::marker { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-jsv__table-wrap { overflow-x: auto; border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); scrollbar-width: thin; }
.ui-jsv__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); }
.ui-jsv__table th { padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-fill-subtle); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); text-align: left; white-space: nowrap; }
.ui-jsv__table td { padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-primary); vertical-align: top; }
.ui-jsv__table tbody tr:last-child td { border-bottom: 0; }
.ui-jsv__table td[data-num] { text-align: right; }
.ui-jsv__table .ui-jsv__flag-cell { width: calc(var(--tc-control-h-sm) + 2 * var(--tc-space-1)); padding: var(--tc-space-1); }
.ui-jsv__note-row td { padding-top: 0; }
/* A nested value in a table cell, on one line */
.ui-jsv__inline { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-jsv__inline[data-match] { box-shadow: 0 0 0 1px var(--tc-tone-amber-border); border-radius: var(--tc-radius-2xs); }
/* Values drawn as what they are */
.ui-jsv__num { font-variant-numeric: tabular-nums; }
.ui-jsv__null, .ui-jsv__empty { color: var(--tc-text-muted); font-style: italic; }
.ui-jsv__bool { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-jsv__bool[data-v="true"] svg { color: var(--tc-status-success-solid); }
.ui-jsv__bool[data-v="false"] svg { color: var(--tc-icon-muted); }
.ui-jsv__link { display: inline-flex; align-items: center; gap: var(--tc-space-1); max-width: 100%; color: var(--tc-accent-text); text-decoration: none; overflow-wrap: anywhere; }
.ui-jsv__link:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-jsv__date { font-variant-numeric: tabular-nums; }
/* ----- Flags ----- */
.ui-jsv__flag-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-jsv__flag-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-jsv__flag-btn[data-on] { color: var(--tc-tone-amber-fg); }
@media (hover: hover) and (pointer: fine) {
  .ui-jsv__row:not(:hover, :focus-within) .ui-jsv__flag-btn:not([data-on]),
  .ui-jsv__section-head:not(:hover, :focus-within) > .ui-jsv__flag-btn:not([data-on]),
  .ui-jsv__table tr:not(:hover, :focus-within) .ui-jsv__flag-btn:not([data-on]) { opacity: 0; }
}
.ui-jsv__note { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-tone-amber-fg); white-space: normal; }
.ui-jsv__note svg { margin-top: var(--tc-space-0-5); }
.ui-jsv__note-edit { display: grid; gap: var(--tc-space-2); margin-top: var(--tc-space-2); white-space: normal; }
.ui-jsv__note-input { width: 100%; min-height: calc(2 * var(--tc-line-height-normal) * var(--tc-font-size-sm) + 2 * var(--tc-space-2)); padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); resize: vertical; outline: none; }
.ui-jsv__note-input:focus-visible { box-shadow: var(--tc-field-shadow-focus); outline: none; }
.ui-jsv__note-actions { display: flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-jsv__flags { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); color: var(--tc-tone-amber-fg); }
.ui-jsv__flag-list { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-jsv__flag-chip { display: inline-flex; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-tone-amber-bg); color: var(--tc-text-primary); font-size: var(--tc-font-size-xs); }
.ui-jsv__flag-chip:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-tone-amber-border); }
/* ----- Raw ----- */
.ui-jsv__raw { overflow-x: auto; padding: var(--tc-space-3) 0; border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); box-shadow: var(--tc-shadow-sunken); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-syntax-text); counter-reset: ui-jsv-line; tab-size: 2; scrollbar-width: thin; }
.ui-jsv__raw code, .ui-jsv__snippet code { display: block; min-width: max-content; font: inherit; }
.ui-jsv__line { display: block; padding-right: var(--tc-space-4); white-space: pre; }
.ui-jsv__raw .ui-jsv__line::before { counter-increment: ui-jsv-line; content: counter(ui-jsv-line); display: inline-block; width: 4ch; margin-right: var(--tc-space-3); padding-right: var(--tc-space-2); color: var(--tc-text-muted); text-align: right; user-select: none; }
.ui-jsv__raw .ui-jsv__line[data-flagged] { background: var(--tc-tone-amber-bg); }
.ui-jsv__s-prop { color: var(--tc-syntax-property); }
.ui-jsv__s-str { color: var(--tc-syntax-string); }
.ui-jsv__s-num { color: var(--tc-syntax-number); }
.ui-jsv__s-kw { color: var(--tc-syntax-keyword); }
.ui-jsv__s-punc { color: var(--tc-syntax-punctuation); }
/* ----- A syntax error ----- */
.ui-jsv__error { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) 0; }
.ui-jsv__error-title { display: flex; align-items: center; gap: var(--tc-space-2); font-weight: var(--tc-font-weight-strong); color: var(--tc-status-danger-fg); }
.ui-jsv__error-msg { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-jsv__snippet { overflow-x: auto; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
.ui-jsv__snippet .ui-jsv__line::before { content: attr(data-n); display: inline-block; width: 4ch; margin-right: var(--tc-space-3); color: var(--tc-text-muted); text-align: right; }
.ui-jsv__snippet .ui-jsv__line[data-bad] { color: var(--tc-status-danger-fg); }
.ui-jsv__caret { display: block; padding-left: calc(4ch + var(--tc-space-3)); color: var(--tc-status-danger-solid); white-space: pre; }
@keyframes ui-jsv-pop { from { opacity: 0; transform: translateY(var(--tc-space-2)) scale(0.985); } }
/* Narrower: the toolbar's buttons keep their icons and lose their words; then keys go above values */
@container (max-width: 640px) {
  .ui-jsv__btn[data-compact] .ui-jsv__btn-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-jsv__btn[data-compact] { width: var(--tc-control-h-sm); justify-content: center; padding: 0; }
}
/* Side by side needs room: narrower, the raw JSON goes under the rendered view */
@container (max-width: 640px) {
  .ui-jsv__split { grid-template-columns: minmax(0, 1fr); }
  .ui-jsv__pane { height: calc(var(--tc-jsv-body-h) / 2 + var(--tc-space-12)); }
  .ui-jsv__pane[data-raw] { border-left: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
}
@container (max-width: 480px) {
  .ui-jsv__toolbar .ui-jsv__btn-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-jsv__toolbar .ui-jsv__btn { width: var(--tc-control-h-sm); justify-content: center; padding: 0; }
  .ui-jsv__row { grid-template-columns: minmax(0, 1fr); row-gap: var(--tc-space-0-5); }
  .ui-jsv__search { flex-basis: 100%; max-width: none; }
}
@media (forced-colors: active) {
  .ui-jsv__tab[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-jsv__mark { outline: 1px solid Highlight; }
  .ui-jsv__search-input { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="jsv"] *, [data-ui="jsv"] *::before, [data-ui="jsv"] *::after, .ui-jsv__dialog { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-json-viewer")) customElements.define("tc-json-viewer", TcJsonViewer);

declare global {
  interface HTMLElementTagNameMap {
    "tc-json-viewer": TcJsonViewer;
  }
}
