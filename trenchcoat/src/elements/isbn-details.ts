import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";
import { marks } from "./internal/selection";
import { copyText } from "./internal/util";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-isbn-details> – ISBN numbers in a passage of text, found, validated and marked. Each valid ISBN-10 or ISBN-13
 * (with or without hyphens or spaces, after "ISBN", "ISBN-10" or "ISBN-13" or on its own) becomes a mark; hovering
 * it (after a short pause) or focusing it opens a card with the book's cover, title, authors, publisher, year and
 * pages, and the ISBN in both forms with Copy. Numbers whose check digit is wrong – phone numbers, order ids – stay
 * plain text.
 *
 *   <tc-isbn-details .text=${reading} .resolve=${(isbn13, signal) => books.get(isbn13, { signal })}></tc-isbn-details>
 *
 * The component never calls a network. The details come from the app: `resolve(isbn13, signal)` (a book, null for
 * none, or a promise of either), or a cancelable tc-isbn-lookup event whose detail has `respondWith(book | promise)`.
 * The event fires first; preventing it without responding means there are no details. Answers are cached by ISBN-13
 * for the element's life (`clearCache()` forgets them); failures aren't cached – the card offers Retry. The signal
 * aborts when the element leaves the page.
 *
 * Also exported: `parseIsbn()` → { isbn10?, isbn13, valid } (converting between the forms; 979 numbers have no
 * ISBN-10), `isValidIsbn()`, and `findIsbns(text)` → the ranges the element marks.
 *
 * Keyboard. Each mark is a button in the tab order. Focus opens its card; Tab or Enter moves into the card (its Copy
 * buttons, Retry), Shift + Tab from the card's first control goes back to the mark, Tab from its last moves on to the
 * next mark; Esc closes the card and returns focus to the mark. The pointer can move from the mark into the card – it
 * stays open while the pointer is over either. Results are announced in a polite status region.
 *
 * Standard tints each mark with a soft accent fill and a solid underline, and frames the cover with a raised shadow;
 * Clean marks with a dotted underline only and gives the cover a hairline.
 */

/** What parseIsbn() finds: the ISBN in both forms (no ISBN-10 for 979 numbers). Invalid input gives `isbn13: ""` */
export type IsbnParts = { isbn10?: string; isbn13: string; valid: boolean };
/** A valid ISBN found in text: where it is (UTF-16 offsets, `end` exclusive), as written, and in both forms */
export type IsbnMatch = { start: number; end: number; text: string; isbn13: string; isbn10?: string };
/** A book's details, as the app supplies them */
export type IsbnBook = {
  title: string;
  /** A subtitle, shown after the title */
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  /** The publication year */
  year?: number | string;
  /** Number of pages */
  pages?: number;
  /** The cover image's URL (a data: URL works) */
  cover?: string;
};
/** Supplies a book's details: the book, null or undefined when there are none, or a promise of either. Throw (or reject) when the lookup failed */
export type IsbnResolver = (isbn13: string, signal: AbortSignal) => IsbnBook | null | undefined | Promise<IsbnBook | null | undefined>;
/** tc-isbn-lookup: the ISBN to look up, a signal that aborts when the element leaves the page, and `respondWith()` for the answer */
export type IsbnLookupDetail = {
  isbn13: string;
  isbn10?: string;
  signal: AbortSignal;
  respondWith: (book: IsbnBook | null | undefined | Promise<IsbnBook | null | undefined>) => void;
};
/** tc-copy: the ISBN being copied and which form it is */
export type IsbnCopyDetail = { text: string; form: "isbn13" | "isbn10" };
/** tc-open-change: the ISBN whose card opened, or null when it closed */
export type IsbnOpenChange = { isbn13: string | null };

/* ---------- ISBN maths ---------- */

const isDigit = (c: string | undefined) => c !== undefined && c >= "0" && c <= "9";
const isWord = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}_]/u.test(c);

/** The ISBN-10 check character for nine digits: weights 10 to 2, mod 11; 10 is written X */
function check10(d9: string) {
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * Number(d9[i]);
  const c = (11 - (sum % 11)) % 11;
  return c === 10 ? "X" : String(c);
}
/** The ISBN-13 (EAN-13) check digit for twelve digits: weights 1 and 3, mod 10 */
function check13(d12: string) {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d12[i]) * (i % 2 ? 3 : 1);
  return String((10 - (sum % 10)) % 10);
}
const valid10 = (c: string) => /^\d{9}[\dX]$/.test(c) && check10(c) === c[9];
// Only the book prefixes (978, 979): other EAN-13s with a valid check digit aren't ISBNs
const valid13 = (c: string) => /^97[89]\d{10}$/.test(c) && check13(c) === c[12];

/**
 * Reads an ISBN-10 or ISBN-13, written with or without hyphens or spaces and optionally after "ISBN", "ISBN-10" or
 * "ISBN-13", and gives it in both forms. A 979 ISBN-13 has no ISBN-10. Invalid input gives `{ isbn13: "", valid: false }`.
 */
export function parseIsbn(input: string): IsbnParts {
  const c = String(input ?? "")
    .trim()
    .replace(/^ISBN(?:-1[03])?\s*:?\s*/i, "")
    .replace(/[\s­‐‑-]/g, "")
    .toUpperCase();
  if (c.length === 10 && valid10(c)) {
    const d12 = `978${c.slice(0, 9)}`;
    return { isbn10: c, isbn13: d12 + check13(d12), valid: true };
  }
  if (c.length === 13 && valid13(c)) {
    if (!c.startsWith("978")) return { isbn13: c, valid: true };
    const d9 = c.slice(3, 12);
    return { isbn10: d9 + check10(d9), isbn13: c, valid: true };
  }
  return { isbn13: "", valid: false };
}

/** Whether `input` is a valid ISBN-10 or ISBN-13 (check digit included) */
export function isValidIsbn(input: string) {
  return parseIsbn(input).valid;
}

/** May a number start at `i`? Not inside a word or a longer number ("A12…", "4-0306…", "1.0306…") – but right after "ISBN" is fine */
function startsHere(text: string, i: number) {
  const prev = text[i - 1];
  if (prev === undefined) return true;
  if (isWord(prev)) return /ISBN:?$/i.test(text.slice(Math.max(0, i - 5), i));
  if (prev === "-" || prev === "." || prev === "," || prev === "/") return !isWord(text[i - 2]);
  return true;
}

/** The longest valid ISBN that starts at `i`, ending where a group of digits ends */
function matchAt(text: string, i: number): IsbnMatch | null {
  type Group = { start: number; end: number };
  const groups: Group[] = [];
  const seps: string[] = [];
  const ends: { end: number; groups: number; digits: string }[] = [];
  let digits = "";
  let j = i;
  for (;;) {
    const start = j;
    while (isDigit(text[j]) && digits.length < 14) digits += text[j++];
    // X is only ever an ISBN-10's tenth character
    let closed = false;
    if ((text[j] === "X" || text[j] === "x") && digits.length === 9) {
      digits += "X";
      j++;
      closed = true;
    }
    groups.push({ start, end: j });
    if (digits.length === 10 || digits.length === 13) ends.push({ end: j, groups: groups.length, digits });
    const sep = text[j];
    const next = text[j + 1];
    if (closed || digits.length >= 13 || (sep !== "-" && sep !== " ") || !(isDigit(next) || ((next === "X" || next === "x") && digits.length === 9))) break;
    seps.push(sep);
    j++;
  }
  for (const e of ends.reverse()) {
    const after = text[e.end];
    // The number must end here: not run into a word, or on into more digits after a hyphen or a point
    if (isWord(after) || ((after === "-" || after === ".") && isDigit(text[e.end + 1]))) continue;
    const used = seps.slice(0, e.groups - 1);
    const g = groups.slice(0, e.groups);
    const same = used.every((s) => s === used[0]);
    const len = (k: number) => g[k].end - g[k].start;
    const last = len(g.length - 1);
    // Compact, or hyphenated as published: ISBN-10 in four groups, ISBN-13 in five (or 978 / 979 then the rest)
    const shaped =
      used.length === 0 ||
      (same && e.digits.length === 10 && used.length === 3 && last === 1) ||
      (same && e.digits.length === 13 && used.length === 4 && len(0) === 3 && last === 1) ||
      (e.digits.length === 13 && used.length === 1 && len(0) === 3);
    if (!shaped) continue;
    const ok = e.digits.length === 10 ? valid10(e.digits) : valid13(e.digits);
    if (!ok) continue;
    const parts = parseIsbn(e.digits);
    const m: IsbnMatch = { start: i, end: e.end, text: text.slice(i, e.end), isbn13: parts.isbn13 };
    if (parts.isbn10) m.isbn10 = parts.isbn10;
    return m;
  }
  return null;
}

/**
 * Every valid ISBN in `text`, in order: compact or hyphenated (or spaced) as published, with or without an "ISBN"
 * label (the range covers the number only). Numbers that fail the check digit, 13-digit numbers without the 978 / 979
 * prefix, and numbers inside longer runs of digits aren't returned.
 */
export function findIsbns(text: string): IsbnMatch[] {
  const out: IsbnMatch[] = [];
  const s = String(text ?? "");
  let i = 0;
  while (i < s.length) {
    if (isDigit(s[i]) && startsHere(s, i)) {
      const m = matchAt(s, i);
      if (m) {
        out.push(m);
        i = m.end;
        continue;
      }
      // Skip the rest of this run of digits: a number can't start inside it
      while (isDigit(s[i + 1])) i++;
    }
    i++;
  }
  return out;
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-isbn__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const bookIcon = svg`<path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>`;
const copyIcon = svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`;
const checkIcon = svg`<path d="M20 6 9 17l-5-5"></path>`;
const retryIcon = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`;

type Entry = { status: "loading" } | { status: "done"; book: IsbnBook | null } | { status: "error"; message: string };

const NO_ANSWER = Symbol("no answer");
let instances = 0;

/**
 * ISBN numbers in text, validated and marked: hover or focus one for the book's details.
 * @tag tc-isbn-details
 * @fires tc-isbn-lookup - A card needs a book's details ({ isbn13, isbn10, signal, respondWith }: IsbnLookupDetail); cancelable – call respondWith() with the book (or a promise), or prevent it without responding for "no details"
 * @fires tc-copy - Copy was pressed on an ISBN ({ text, form }: IsbnCopyDetail); cancelable – prevent it to copy your own way
 * @fires tc-open-change - A card opened or closed ({ isbn13 }: IsbnOpenChange; null when closed)
 */
export class TcIsbnDetails extends TcElement {
  static override ui = "isbn";

  /** The text to find ISBNs in: plain text, shown as written (line breaks kept) */
  @property() accessor text = "";
  /** Supplies a book's details for an ISBN-13 – a book, null for none, or a promise; used when no tc-isbn-lookup listener responds */
  @property({ attribute: false }) accessor resolve: IsbnResolver | undefined = undefined;
  /** How long the pointer rests on a mark before its card opens, ms */
  @property({ type: Number, attribute: "hover-delay" }) accessor hoverDelay = 300;
  /** What the card says when there are no details for an ISBN */
  @property({ attribute: "not-found-text" }) accessor notFoundText = "No details for this ISBN";
  /** What the card says when the lookup failed */
  @property({ attribute: "error-text" }) accessor errorText = "Couldn't load the details.";

  /** @internal The open card's mark (index into the matches), or -1 */
  @state() accessor openAt = -1;
  /** @internal Bumped when the cache changes */
  @state() accessor version = 0;
  /** @internal The form just copied, for the check mark */
  @state() accessor copied: "" | "isbn13" | "isbn10" = "";
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-isbn${++instances}`;
  private found: IsbnMatch[] = [];
  private foundFor: string | null = null;
  private readonly cache = new Map<string, Entry>();
  private readonly aborts = new Set<AbortController>();
  private copiedTimer = 0;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-isbn__pop"),
    anchor: () => {
      const m = this.markAt(this.openAt);
      if (!m?.isConnected) return null;
      // The mark's first line, when it wraps
      return m.getClientRects()[0] ?? m.getBoundingClientRect();
    },
    side: "bottom",
    align: "start",
    kind: "dialog",
    trigger: () => this.markAt(this.openAt),
    returnFocus: () => this.markAt(this.openAt),
    // The card stays open until dismissed once it's opened by a click or from the keyboard (pinned)
    hover: { delay: () => this.hoverDelay },
    tabBridge: true,
    closeOnFocusOut: true,
    onClose: () => this.closed(),
  });

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const a of this.aborts) a.abort();
    this.aborts.clear();
    // Lookups in flight were aborted: forget them, so the card asks again if the element comes back
    for (const [k, e] of this.cache) if (e.status === "loading") this.cache.delete(k);
    clearTimeout(this.copiedTimer);
  }

  /** The valid ISBNs in `text`, in order */
  get isbns(): IsbnMatch[] {
    if (this.foundFor !== this.text) {
      this.found = findIsbns(this.text);
      this.foundFor = this.text;
    }
    return this.found;
  }

  /** Forgets cached details – one ISBN-13's, or all of them – so the next card asks again */
  clearCache(isbn13?: string) {
    if (isbn13) this.cache.delete(isbn13);
    else this.cache.clear();
    this.version++;
  }

  /** Opens the card for the ISBN at `index` in `isbns`, pinned open; focus stays where it is */
  openCard(index = 0) {
    this.open(index, { pin: true });
  }

  /** Closes the open card, if any */
  closeCard() {
    this.close();
  }

  /* ---------- Opening and closing ---------- */

  private markAt(i: number) {
    return i < 0 ? null : this.querySelector<HTMLElement>(`.ui-isbn__mark[data-i="${i}"]`);
  }

  private open(i: number, how: { pin?: boolean; focus?: boolean } = {}) {
    const m = this.isbns[i];
    if (!m) return;
    if (this.openAt !== i) {
      if (this.openAt >= 0) this.pop.pinned = false;
      this.openAt = i;
      this.copied = "";
      this.emit<IsbnOpenChange>("tc-open-change", { isbn13: m.isbn13 });
      void this.lookup(m);
    }
    this.pop.show({ focus: !!how.focus, pin: !!how.pin });
  }

  private close() {
    if (this.pop.open) this.pop.close();
    else this.closed();
  }

  /** After the controller closed it (Escape, outside, focus gone, anchor gone) or close() */
  private closed() {
    if (this.openAt < 0) return;
    this.openAt = -1;
    this.copied = "";
    this.emit<IsbnOpenChange>("tc-open-change", { isbn13: null });
  }

  private onMarkClick(e: MouseEvent, i: number) {
    // Enter or Space (detail 0): into the card. A click: pin it open, or close a pinned one
    if (e.detail === 0) this.open(i, { pin: true, focus: true });
    else if (this.openAt === i && this.pop.pinned) this.close();
    else this.open(i, { pin: true });
  }

  /* ---------- Looking up ---------- */

  private async lookup(m: IsbnMatch) {
    const key = m.isbn13;
    if (this.cache.has(key)) return;
    this.cache.set(key, { status: "loading" });
    this.version++;
    const abort = new AbortController();
    this.aborts.add(abort);
    let answer: unknown = NO_ANSWER;
    const detail: IsbnLookupDetail = { isbn13: m.isbn13, signal: abort.signal, respondWith: (book) => (answer = book) };
    if (m.isbn10) detail.isbn10 = m.isbn10;
    const go = this.emit<IsbnLookupDetail>("tc-isbn-lookup", detail, { cancelable: true });
    try {
      let result: unknown = null;
      if (answer !== NO_ANSWER) result = answer;
      else if (go && this.resolve) result = this.resolve(key, abort.signal);
      const book = (await result) as IsbnBook | null | undefined;
      if (abort.signal.aborted) return;
      const ok = !!book && typeof book === "object" && typeof book.title === "string" && book.title.trim() !== "";
      this.cache.set(key, { status: "done", book: ok ? book : null });
      if (this.isbns[this.openAt]?.isbn13 === key) this.say(ok ? `${book.title}${book.authors?.length ? `, by ${book.authors.join(", ")}` : ""}` : this.notFoundText);
    } catch (err) {
      if (abort.signal.aborted) return;
      this.cache.set(key, { status: "error", message: err instanceof Error ? err.message : String(err ?? "") });
      if (this.isbns[this.openAt]?.isbn13 === key) this.say(this.errorText);
    } finally {
      this.aborts.delete(abort);
      this.version++;
    }
  }

  private retry(m: IsbnMatch) {
    this.cache.delete(m.isbn13);
    this.say("Trying again…");
    void this.lookup(m);
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  private async copy(form: "isbn13" | "isbn10", text: string) {
    if (!this.emit<IsbnCopyDetail>("tc-copy", { text, form }, { cancelable: true })) return;
    const ok = await copyText(text);
    const name = form === "isbn13" ? "ISBN-13" : "ISBN-10";
    this.say(ok ? `Copied ${name}` : `Couldn't copy – select ${text} and press Ctrl+C`);
    if (!ok) return;
    this.copied = form;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = ""), 1600);
  }

  /* ---------- Render ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The text changed under an open card: close it if its ISBN went away
    if (changed.has("text") && this.openAt >= 0) {
      const was = this.found[this.openAt]?.isbn13;
      if (this.isbns[this.openAt]?.isbn13 !== was) {
        this.openAt = -1;
        if (this.pop.open) this.pop.close("anchor-gone");
      }
    }
  }

  private renderCard() {
    const m = this.isbns[this.openAt];
    if (!this.pop.open || !m) return nothing;
    const entry = this.cache.get(m.isbn13) ?? { status: "loading" };
    const titleId = `${this.uid}-title`;
    const book = entry.status === "done" ? entry.book : null;
    const label = book ? undefined : `Book details for ISBN ${m.isbn13}`;
    return html`<div
      class="tc-pop ui-isbn__pop"
      role="dialog"
      aria-label=${ifDefined(label)}
      aria-labelledby=${ifDefined(book ? titleId : undefined)}
      aria-busy=${entry.status === "loading" ? "true" : "false"}
      data-status=${entry.status === "done" && !book ? "empty" : entry.status}
    >
      <div class="ui-isbn__book">
        ${this.renderCover(entry, book)}
        <div class="ui-isbn__info">${this.renderInfo(entry, book, m, titleId)}</div>
      </div>
      <dl class="ui-isbn__ids">
        ${this.renderId("isbn13", "ISBN-13", m.isbn13)} ${this.renderId("isbn10", "ISBN-10", m.isbn10 ?? "")}
      </dl>
    </div>`;
  }

  private renderCover(entry: Entry, book: IsbnBook | null) {
    if (entry.status === "loading") return html`<div class="ui-isbn__cover" data-loading aria-hidden="true"></div>`;
    if (book?.cover) return html`<div class="ui-isbn__cover"><img class="ui-isbn__img" src=${ifDefined(safeMediaUrl(book.cover))} alt="" loading="lazy" decoding="async" @error=${(e: Event) => ((e.target as HTMLElement).hidden = true)} />${glyph(bookIcon, "ui-isbn__placeholder")}</div>`;
    return html`<div class="ui-isbn__cover" data-empty>${glyph(bookIcon, "ui-isbn__placeholder")}</div>`;
  }

  private renderInfo(entry: Entry, book: IsbnBook | null, m: IsbnMatch, titleId: string) {
    if (entry.status === "loading")
      return html`<span class="ui-isbn__sr">Looking up this ISBN…</span>
        <span class="ui-isbn__line" data-w="title" aria-hidden="true"></span>
        <span class="ui-isbn__line" data-w="by" aria-hidden="true"></span>
        <span class="ui-isbn__line" data-w="meta" aria-hidden="true"></span>`;
    if (entry.status === "error")
      return html`<p class="ui-isbn__msg" data-kind="error">${this.errorText}</p>
        <button type="button" class="ui-isbn__retry" @click=${() => this.retry(m)}>${glyph(retryIcon)}<span>Retry</span></button>`;
    if (!book) return html`<p class="ui-isbn__msg">${this.notFoundText}</p>`;
    const meta = [book.publisher, book.year !== undefined && book.year !== "" ? String(book.year) : "", typeof book.pages === "number" && book.pages > 0 ? `${book.pages.toLocaleString()} pages` : ""].filter(Boolean);
    return html`<p class="ui-isbn__title" id=${titleId}>${book.title}${book.subtitle ? html`<span class="ui-isbn__subtitle">: ${book.subtitle}</span>` : nothing}</p>
      ${book.authors?.length ? html`<p class="ui-isbn__authors">${book.authors.join(", ")}</p>` : nothing}
      ${meta.length ? html`<p class="ui-isbn__meta">${meta.map((x, k) => html`${k ? html`<span aria-hidden="true"> · </span><span class="ui-isbn__sr">, </span>` : nothing}${x}`)}</p>` : nothing}`;
  }

  private renderId(form: "isbn13" | "isbn10", name: string, value: string) {
    const done = this.copied === form;
    return html`<div class="ui-isbn__id" data-form=${form}>
      <dt>${name}</dt>
      <dd>
        ${value
          ? html`<code class="ui-isbn__num">${value}</code>
              <button type="button" class="ui-isbn__copy" aria-label=${`Copy ${name}`} title=${done ? "Copied" : `Copy ${name}`} ?data-done=${done} @click=${() => void this.copy(form, value)}>${glyph(done ? checkIcon : copyIcon)}</button>`
          : html`<span class="ui-isbn__none">None – a 979 ISBN has no ISBN-10</span>`}
      </dd>
    </div>`;
  }

  protected override render() {
    void this.version;
    const list = this.isbns;
    const hint = `${this.uid}-hint`;
    const body = marks(this.text, list, (seg) => {
      const i = list.indexOf(seg.ranges[0]);
      const open = this.openAt === i && this.pop.open;
      return html`<button
        type="button"
        class="ui-isbn__mark"
        data-i=${i}
        aria-haspopup="dialog"
        aria-expanded=${open ? "true" : "false"}
        aria-describedby=${hint}
        ?data-open=${open}
        @pointerenter=${(e: PointerEvent) => this.pop.hoverEnter(e, () => this.open(i))}
        @pointerleave=${this.pop.hoverLeave}
        @click=${(e: MouseEvent) => this.onMarkClick(e, i)}
        @focus=${() => (this.openAt !== i || !this.pop.open) && this.open(i)}
      >${seg.text}</button>`;
    });
    return html`<div class="ui-isbn__text">${body}</div>${this.renderCard()}<span class="ui-isbn__sr" id=${hint}>Book details. Tab moves into them</span><span class="ui-isbn__sr" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="isbn"] {
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-relaxed);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="isbn"] *, .ui-isbn__pop *, .ui-isbn__pop *::before, .ui-isbn__pop *::after { box-sizing: border-box; }
:where([data-ui="isbn"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="isbn"]) :is(p, dl, dd) { margin: 0; padding: 0; }
[data-ui="isbn"] :is(button, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-isbn__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-isbn__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-isbn__glyph { stroke-width: 1.4; }
.ui-isbn__text { white-space: pre-wrap; overflow-wrap: break-word; }
/* ----- The marks ----- */
.ui-isbn__mark { display: inline; padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); color: var(--tc-accent-text); font-variant-numeric: tabular-nums; white-space: nowrap; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; box-decoration-break: clone; -webkit-box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-isbn__mark { background: var(--tc-accent-subtle); text-decoration-color: color-mix(in srgb, var(--tc-accent-text) 45%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-isbn__mark:is(:hover, [data-open]) { background: var(--tc-accent-highlight); text-decoration-color: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-isbn__mark { padding: 0; text-decoration-style: dotted; text-decoration-thickness: 1.5px; text-decoration-color: color-mix(in srgb, var(--tc-accent-text) 60%, transparent); }
:where([data-look="clean"], [data-look="clean"] *).ui-isbn__mark:is(:hover, [data-open]) { background: var(--tc-accent-subtle); text-decoration-color: currentColor; }
.ui-isbn__mark:focus-visible { outline-offset: 1px; }
/* ----- The card (internal/popover.ts places it) ----- */
.tc-pop.ui-isbn__pop { display: grid; gap: var(--tc-space-3); width: 320px; padding: var(--tc-space-3); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); text-align: left; -webkit-font-smoothing: antialiased; }
.ui-isbn__pop :is(p, dl, dd) { margin: 0; padding: 0; }
.ui-isbn__pop button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
.ui-isbn__pop :is(button, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-isbn__book { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: var(--tc-space-3); align-items: start; }
.ui-isbn__cover { position: relative; display: grid; place-items: center; width: 64px; aspect-ratio: 2 / 3; overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
:where([data-look="standard"], [data-look="standard"] *) .ui-isbn__cover:not([data-loading]) { box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *) .ui-isbn__cover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
/* No book to show: a smaller placeholder */
.ui-isbn__pop:is([data-status="empty"], [data-status="error"]) .ui-isbn__book { grid-template-columns: 40px minmax(0, 1fr); }
.ui-isbn__pop:is([data-status="empty"], [data-status="error"]) .ui-isbn__cover { width: 40px; }
.ui-isbn__pop:is([data-status="empty"], [data-status="error"]) .ui-isbn__placeholder { width: 18px; height: 18px; }
.ui-isbn__img { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; }
.ui-isbn__img[hidden] { display: none; }
.ui-isbn__placeholder { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.ui-isbn__info { display: grid; gap: var(--tc-space-1); align-content: start; min-width: 0; }
.ui-isbn__title { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-isbn__subtitle { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-secondary); }
.ui-isbn__authors { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-isbn__meta { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-isbn__msg { color: var(--tc-text-secondary); }
.ui-isbn__msg[data-kind="error"] { color: var(--tc-status-danger-fg); }
.ui-isbn__retry { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); margin-top: var(--tc-space-1); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); }
/* Loading: the shapes of what's coming */
.ui-isbn__cover[data-loading], .ui-isbn__line { background: var(--tc-fill-default); animation: ui-isbn-pulse var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
.ui-isbn__line { display: block; height: 10px; margin: var(--tc-space-1) 0; border-radius: var(--tc-radius-2xs); }
.ui-isbn__line[data-w="title"] { width: 85%; height: 12px; }
.ui-isbn__line[data-w="by"] { width: 55%; }
.ui-isbn__line[data-w="meta"] { width: 70%; }
@keyframes ui-isbn-pulse { 50% { opacity: 0.5; } }
/* Both forms of the number, each with Copy */
.ui-isbn__ids { display: grid; gap: var(--tc-space-0-5); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-isbn__id { display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); }
.ui-isbn__id dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-isbn__id dd { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-isbn__num { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-md); font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; user-select: all; -webkit-user-select: all; }
.ui-isbn__none { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-isbn__copy { display: grid; place-items: center; flex: none; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-isbn__copy:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-isbn__copy[data-done] { color: var(--tc-status-success-fg); }
@media (forced-colors: active) {
  .ui-isbn__mark { forced-color-adjust: none; color: LinkText; background: none; text-decoration-color: LinkText; }
  .ui-isbn__mark:is(:hover, [data-open]) { outline: 2px solid Highlight; }
  .ui-isbn__cover { border: 1px solid CanvasText; }
}
@media (pointer: coarse) {
  .ui-isbn__copy, .ui-isbn__retry { height: var(--tc-control-h-md); min-width: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="isbn"] *, .ui-isbn__pop, .ui-isbn__pop * { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-isbn-details")) customElements.define("tc-isbn-details", TcIsbnDetails);

declare global {
  interface HTMLElementTagNameMap {
    "tc-isbn-details": TcIsbnDetails;
  }
}
