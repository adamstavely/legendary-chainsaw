import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-cited-answer> – the Lit port of src/components/cited-answer.tsx: an AI answer whose sentences and sources are
 * wired to each other. The answer is a list of text segments that name the sources they rely on; small numbered
 * markers end each cited sentence and the sources wait below as chips.
 *   · point at a marker: its source chip lights up and the sentence gets a soft highlight
 *   · point at a chip: every sentence that cites it lights up and the rest of the answer fades back
 *   · click a marker or chip: a preview unfolds in place, with Open source and Copy quote. One at a time
 *   · the line on the tray always says what you are pointing at
 *
 *   <tc-cited-answer .segments=${segments} .sources=${sources} pages-read="14"></tc-cited-answer>
 *
 * The open preview is `preview` (null: closed) with a cancelable `tc-preview-change`. Open source fires
 * `tc-open-source`; with `open-handled` the link doesn't navigate on its own (and sources without a url get the button).
 * The host is the group ("Answer with sources") unless the page names it.
 */

export type CitedSegment = {
  /** A sentence or part of one. Spaces at the start or end are kept outside the highlight */
  text: string;
  /** Ids of the sources this text relies on – one marker each, in this order */
  cite?: string[];
  /** Starts a new paragraph */
  paragraph?: boolean;
};

export type CitedSource = {
  id: string;
  /** Headline of the page or document */
  title: string;
  url?: string;
  /** Short name on the chip, e.g. "Latency Notes" */
  site: string;
  /** Ready-to-show date, e.g. "Sep 12, 2026" */
  date?: string;
  /** The passage the answer relies on */
  quote?: string;
  /** Words or phrases of the quote to mark. Without it, words the quote shares with the citing sentences are marked */
  highlight?: string[];
  /** A favicon or logo element (cloned), shown at 16px – a letter on a soft color when left out */
  icon?: Element;
};

/* ---------- Helpers ---------- */

const TONES = ["blue", "violet", "green", "amber", "gray"] as const;
const tone = (name: string) => TONES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) % TONES.length];
const domain = (url?: string) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const STOP = new Set([
  "about", "after", "again", "their", "there", "these", "those", "which", "while", "would", "could", "should",
  "every", "other", "being", "still", "where", "until", "since", "under", "first", "people", "thing", "things",
]);

/** The quote with the phrases (or, without them, the words shared with the answer) wrapped in <mark> */
function marked(quote: string, phrases: string[] | undefined, answer: string) {
  let pattern: RegExp | null = null;
  if (phrases?.length) {
    const list = phrases.filter((p) => p.trim()).map(escape);
    if (list.length) pattern = new RegExp(`(${list.join("|")})`, "gi");
  } else {
    const words = [...new Set((answer.toLowerCase().match(/[a-z0-9%]+/g) ?? []).filter((w) => (w.length >= 5 || /\d/.test(w)) && !STOP.has(w)))];
    if (words.length) pattern = new RegExp(`\\b(${words.map(escape).join("|")})\\b`, "gi");
  }
  if (!pattern) return quote;
  return quote.split(pattern).map((part, i) => (i % 2 ? html`<mark>${part}</mark>` : part));
}

/* ---------- Icons – Standard: 10–12px with 1.4px lines; Clean: 16px, thin 1.1px lines with round caps ---------- */

const stroke = (d: string, w = 1.4) => svg`<path d=${d} stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round"></path>`;
const standardIcons = {
  close: html`<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">${stroke("m2.5 2.5 5 5m0-5-5 5")}</svg>`,
  out: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroke("M4.5 3h4.5v4.5M8.8 3.2 3 9")}</svg>`,
  copy: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<rect x="4.2" y="4.2" width="5.8" height="5.8" rx="1.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></rect>`}${stroke("M7.8 2.6A1.2 1.2 0 0 0 6.6 2H3.2A1.2 1.2 0 0 0 2 3.2v3.4a1.2 1.2 0 0 0 .6 1")}</svg>`,
  done: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroke("m2.6 6.3 2.2 2.2 4.6-5", 1.6)}</svg>`,
  arrow: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroke("M2.5 6h7M6.5 3l3 3-3 3")}</svg>`,
};
const cleanIcons = {
  close: "M4.75 4.75l6.5 6.5m0-6.5-6.5 6.5",
  out: "M6.5 4.5h5v5M11.25 4.75 4.5 11.5",
  copy: "M6.75 5.5h5c.69 0 1.25.56 1.25 1.25v5c0 .69-.56 1.25-1.25 1.25h-5c-.69 0-1.25-.56-1.25-1.25v-5c0-.69.56-1.25 1.25-1.25ZM10.5 3.5A1.25 1.25 0 0 0 9.25 3h-5C3.56 3 3 3.56 3 4.25v5c0 .54.34 1 .82 1.17",
  done: "M3.75 8.4 6.6 11.2 12.25 5",
  arrow: "M3.5 8h9M8.75 4.25 12.5 8l-3.75 3.75",
};
const icon = (name: keyof typeof cleanIcons, look: Look) =>
  look === "clean" ? html`<svg viewBox="0 0 16 16" class="ui-ca__icon" aria-hidden="true">${svg`<path d=${cleanIcons[name]}></path>`}</svg>` : standardIcons[name];

const glyph = (s: CitedSource) => html`<span class="ui-ca__glyph" data-tone=${tone(s.site)} aria-hidden="true">${s.icon ? s.icon.cloneNode(true) : s.site.trim().charAt(0).toUpperCase()}</span>`;

/** What the pointer (or focus) is on: one marker in one sentence, or a whole source */
type Hot = { source: string; segment?: number } | null;
type Line = { id: string; tone?: string; node: TemplateResult | string };

/** Gap between Clean's chips – the "+N" fit measures with it */
const CHIP_GAP = 4;
let uidCount = 0;

/**
 * An AI answer with numbered source markers, source chips and an in-place source preview.
 * @tag tc-cited-answer
 * @fires tc-preview-change - The open preview changes; detail `{ preview: string | null }` (null: closed). Cancelable.
 * @fires tc-open-source - Open source was pressed; detail `{ source: CitedSource }`
 * @fires tc-action - The action button (`actionLabel`) was pressed; detail: null
 */
export class TcCitedAnswer extends TcElement {
  static override ui = "ca";

  /** The answer as text segments, each naming the sources it relies on – a numbered marker ends each cited one */
  @property({ attribute: false }) accessor segments: CitedSegment[] = [];
  /** The sources, numbered in this order – chips under the answer and the passages their previews quote */
  @property({ attribute: false }) accessor sources: CitedSource[] = [];
  /** Pages the model read while searching – shown in the head next to the source count */
  @property({ type: Number, attribute: "pages-read" }) accessor pagesRead: number | undefined = undefined;
  /** Id of the source whose preview is open (null: closed) */
  @property({ attribute: false }) accessor preview: string | null = null;
  /** The app opens sources itself (it listens to tc-open-source): links don't navigate, and sources without a url get Open source too */
  @property({ type: Boolean, attribute: "open-handled" }) accessor openHandled = false;
  /** A button on the tray that fires tc-action, e.g. "Follow up" */
  @property({ attribute: "action-label" }) accessor actionLabel = "";

  /** @internal */
  @state() accessor hot: Hot = null;
  /** @internal While the preview folds away it keeps showing the last source */
  @state() accessor lastOpen: string | null = null;
  /** @internal The last copy attempt; `ok` is false when the clipboard refused it */
  @state() accessor copied: { id: number; source: string; ok: boolean } | null = null;
  /** @internal Clean: how many chips fit on one line */
  @state() accessor fit = Infinity;
  /** @internal */
  @state() accessor allChips = false;
  /** @internal The caption line fading out underneath the new one */
  @state() accessor swapOut: Line | null = null;

  private uid = `tc-ca-${++uidCount}`;
  private opener: HTMLElement | null = null;
  private lastShown: string | null = null;
  private revealFrom: number | null = null;
  private copies = 0;
  private copiedTimer = 0;
  private swapTimer = 0;
  private swapLine: Line | null = null;
  private ro?: ResizeObserver;
  private observed: Element | null = null;
  private ownName = false;

  constructor() {
    super();
    // Safety net: a preview closed from outside while focus was in it
    new FocusRescueController(this, () => (this.lastShown ? this.returnTo(this.lastShown) : null));
  }

  private get chips() {
    return this.querySelector<HTMLElement>(".ui-ca__chips");
  }

  /** @internal The open preview: `preview` when it is one of the sources */
  get open() {
    const wanted = this.preview;
    return wanted && this.sources.some((s) => s.id === wanted) ? wanted : null;
  }

  private index() {
    return new Map(this.sources.map((s, i) => [s.id, i]));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby");
    if (!this.ownName) this.setAttribute("aria-label", "Answer with sources");
    this.addEventListener("keydown", this.onKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onKeyDown);
    window.clearTimeout(this.copiedTimer);
    window.clearTimeout(this.swapTimer);
    this.ro?.disconnect();
    this.ro = undefined;
    this.observed = null;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const open = this.open;
    if (open && open !== this.lastOpen) this.lastOpen = open;
    if (open) this.lastShown = open;
    const hot = this.hot;
    if (hot) this.dataset.hot = hot.segment !== undefined ? "mark" : "source";
    else delete this.dataset.hot;
    if (changed.has("sources") || changed.has("look") || changed.has("contextLook")) this.fit = this.sources.length;
    // The caption: when it says something else, the old line fades out underneath for a moment
    const index = this.index();
    const byId = (id: string | null | undefined) => (id == null ? null : (this.sources[index.get(id) ?? -1] ?? null));
    const segments = this.segments;
    const sentences = segments.filter((s) => s.text.trim()).length;
    const cited = segments.filter((s) => s.text.trim() && s.cite?.some((id) => index.has(id))).length;
    const line = this.caption(cited, sentences, byId, (id) => segments.filter((s) => s.cite?.includes(id)).length);
    const before = this.swapLine;
    if (before && before.id !== line.id) {
      this.swapOut = before;
      window.clearTimeout(this.swapTimer);
      this.swapTimer = window.setTimeout(() => (this.swapOut = null), 260);
    }
    this.swapLine = line;
  }

  protected override updated(changed: PropertyValues) {
    // Clean: measure the chips at their natural width (in a hidden copy) against the width of the row
    const row = this.resolvedLook === "clean" ? this.chips : null;
    if (row !== this.observed) {
      this.ro?.disconnect();
      this.ro = undefined;
      this.observed = row;
      if (row && typeof ResizeObserver === "function") {
        this.ro = new ResizeObserver(() => this.measure());
        this.ro.observe(row);
        // Web fonts change the widths once they arrive
        document.fonts?.ready.then(() => this.measure()).catch(() => {});
      }
    }
    if (row && (changed.has("sources") || changed.has("look") || changed.has("contextLook"))) queueMicrotask(() => this.measure());
    // "+N" goes away when pressed: focus moves to the first chip it revealed
    if (changed.has("allChips") && this.allChips && this.revealFrom !== null) {
      const from = this.revealFrom;
      this.revealFrom = null;
      this.chips?.querySelectorAll<HTMLElement>(".ui-ca__chip")[from]?.focus({ preventScroll: true });
    }
  }

  private measure() {
    const row = this.observed;
    const ruler = this.querySelector<HTMLElement>(".ui-ca__ruler");
    if (!row || !ruler) return;
    const widths = [...ruler.querySelectorAll<HTMLElement>("[data-chip]")].map((el) => el.offsetWidth);
    const more = ruler.querySelector<HTMLElement>("[data-more]")?.offsetWidth ?? 36;
    const width = row.clientWidth;
    const total = widths.reduce((a, w) => a + w, 0) + CHIP_GAP * Math.max(0, widths.length - 1);
    let fit = widths.length;
    if (total > width + 0.5) {
      let used = 0;
      let k = 0;
      for (; k < widths.length; k++) {
        const next = used + (k ? CHIP_GAP : 0) + widths[k];
        if (next + CHIP_GAP + more > width) break;
        used = next;
      }
      fit = Math.max(1, k);
    }
    if (fit !== this.fit) this.fit = fit;
  }

  /* ---------- Opening and closing ---------- */

  private setPreview(next: string | null) {
    if (this.emit("tc-preview-change", { preview: next }, { cancelable: true })) this.preview = next;
  }

  private toggle(id: string, from?: HTMLElement) {
    if (from) this.opener = from;
    this.setPreview(this.open === id ? null : id);
  }

  /** Where focus goes when the preview of `id` closes: what opened it, else its chip, else its first marker */
  private returnTo(id: string) {
    const back = this.opener;
    if (back?.isConnected && back.getAttribute("data-source") === id) return back;
    return this.chips?.querySelector<HTMLElement>(`[data-source="${CSS.escape(id)}"]`) ?? this.querySelector<HTMLElement>(`.ui-ca__marker[data-source="${CSS.escape(id)}"]`) ?? null;
  }

  private close() {
    const was = this.open;
    if (!was) return;
    this.setPreview(null);
    rescueFocus(this, [this.returnTo(was)]);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return;
    if (e.key === "Escape" && this.open) {
      e.stopPropagation();
      this.close();
    }
  };

  /** Arrow keys walk along the chips (and Clean's "+N" at the end) */
  private onChipKey = (e: KeyboardEvent) => {
    const items = [...(this.chips?.querySelectorAll<HTMLElement>(".ui-ca__chip, .ui-ca__more") ?? [])];
    const i = items.indexOf(e.currentTarget as HTMLElement);
    const last = items.length - 1;
    const to = e.key === "ArrowRight" ? Math.min(last, i + 1) : e.key === "ArrowLeft" ? Math.max(0, i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (to === null || i < 0) return;
    e.preventDefault();
    items[to]?.focus();
  };

  private async copyQuote(s: CitedSource) {
    const text = `“${s.quote ?? s.title}” – ${s.title}, ${s.site}${s.url ? ` (${s.url})` : ""}`;
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Denied, or no clipboard at all (insecure page): no check, the caption says so
      ok = false;
    }
    if (!this.isConnected) return;
    this.copied = { id: ++this.copies, source: s.id, ok };
    window.clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = null), 1800);
  }

  private openSource(e: Event, s: CitedSource) {
    if (this.openHandled) e.preventDefault();
    this.emit("tc-open-source", { source: s });
  }

  /* ---------- What the tray (Clean: the card's last row) says ---------- */

  private caption(cited: number, sentences: number, byId: (id: string | null | undefined) => CitedSource | null, citedIn: (id: string) => number): Line {
    const copied = this.copied;
    const hot = this.hot;
    const hotSource = byId(hot?.source);
    const openSource = byId(this.open);
    if (copied) return { id: `copied-${copied.id}`, tone: copied.ok ? "ok" : "error", node: copied.ok ? "Quote copied" : "Couldn't copy the quote" };
    if (hotSource && hot?.segment !== undefined) return { id: `mark-${hot.segment}-${hotSource.id}`, node: html`<b>${hotSource.site}</b> <span class="ui-ca__dot">·</span> ${hotSource.title}` };
    if (hotSource) {
      const n = citedIn(hotSource.id);
      return {
        id: `src-${hotSource.id}`,
        node: n
          ? html`<b>${hotSource.site}</b> <span class="ui-ca__dot">·</span> cited in ${n} ${n === 1 ? "sentence" : "sentences"}`
          : html`<b>${hotSource.site}</b> <span class="ui-ca__dot">·</span> read, not cited`,
      };
    }
    if (openSource) return { id: `open-${openSource.id}`, node: html`Quote from <b>${openSource.site}</b>` };
    return { id: "rest", node: html`<b>${cited}</b> of ${sentences} ${sentences === 1 ? "sentence" : "sentences"} backed by a source` };
  }

  /** Text that changes without a jump: the old line stays for a moment and fades out underneath while the new one fades in */
  private swap() {
    const line = this.swapLine!;
    const out = this.swapOut;
    return html`<span class="ui-ca__swap">${out ? keyed(`out-${out.id}`, html`<span class="ui-ca__swap-item" data-out="" data-tone=${ifDefined(out.tone)} aria-hidden="true">${out.node}</span>`) : nothing}${keyed(line.id, html`<span class="ui-ca__swap-item" data-tone=${ifDefined(line.tone)}>${line.node}</span>`)}</span>`;
  }

  /* ---------- Parts ---------- */

  private chipRow(visible: number, hidden: number, all: boolean, previewId: string) {
    const focusSource = this.hot?.source ?? null;
    const open = this.open;
    return html`<div class="ui-ca__chips" ?data-all=${all} role="list" aria-label="Sources" @pointerleave=${() => (this.hot = null)}>${this.sources.slice(0, visible).map((s, i) => {
      const lit = focusSource === s.id;
      return html`<span role="listitem" class="ui-ca__chip-item"><button
            type="button"
            class="ui-ca__chip"
            data-source=${s.id}
            ?data-lit=${lit}
            ?data-dim=${!!focusSource && !lit}
            aria-expanded=${open === s.id ? "true" : "false"}
            aria-controls=${previewId}
            @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hot = { source: s.id })}
            @focus=${() => (this.hot = { source: s.id })}
            @blur=${() => (this.hot = null)}
            @keydown=${this.onChipKey}
            @click=${(e: Event) => this.toggle(s.id, e.currentTarget as HTMLElement)}
          >${glyph(s)}<span class="ui-ca__chip-name">${s.site}</span><span class="ui-ca__chip-num">${i + 1}</span><span class="ui-ca__sr">, source: ${s.title}</span></button></span>`;
    })}${hidden > 0
      ? html`<span role="listitem" class="ui-ca__chip-item"><button
            type="button"
            class="ui-ca__more"
            aria-label=${`+${hidden} more ${hidden === 1 ? "source" : "sources"}`}
            @keydown=${this.onChipKey}
            @click=${() => {
              this.revealFrom = visible;
              this.allChips = true;
            }}
          >+${hidden}</button></span>`
      : nothing}</div>`;
  }

  private answerText(paragraphs: { seg: CitedSegment; index: number }[][], known: (id: string) => boolean, byId: (id: string) => CitedSource | null, previewId: string) {
    const hot = this.hot;
    const open = this.open;
    const index = this.index();
    const segState = (seg: CitedSegment, i: number) => {
      if (hot) {
        if (hot.segment !== undefined) return hot.segment === i ? "hl" : undefined;
        return seg.cite?.includes(hot.source) ? "hl" : "dim";
      }
      if (open && seg.cite?.includes(open)) return "hl";
      return undefined;
    };
    return html`<div class="ui-ca__text" @pointerleave=${() => (this.hot = null)}>${paragraphs.map(
      (para) =>
        html`<p class="ui-ca__p">${para.map(({ seg, index: i }) => {
          const [, lead, body, trail] = seg.text.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? ["", "", seg.text, ""];
          const marks = (seg.cite ?? []).filter(known);
          const st = segState(seg, i);
          // The last word travels with the markers, so a marker never starts a line on its own
          const cut = marks.length ? Math.max(0, body.search(/\S+$/)) : body.length;
          return html`<span>${lead}<span class="ui-ca__seg" ?data-hl=${st === "hl"} ?data-dim=${st === "dim"}>${body.slice(0, cut)}<span class="ui-ca__keep">${body.slice(cut)}${marks.map((id) => {
            const s = byId(id)!;
            const lit = (hot?.segment === i && hot.source === id) || (hot?.segment === undefined && hot?.source === id);
            return html`<button
              type="button"
              class="ui-ca__marker"
              data-source=${id}
              ?data-lit=${lit}
              ?data-dim=${!!hot && !lit}
              aria-expanded=${open === id ? "true" : "false"}
              aria-controls=${previewId}
              @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hot = { source: id, segment: i })}
              @pointerleave=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hot = null)}
              @focus=${() => (this.hot = { source: id, segment: i })}
              @blur=${() => (this.hot = null)}
              @click=${(e: Event) => this.toggle(id, e.currentTarget as HTMLElement)}
            >${(index.get(id) ?? -1) + 1}<span class="ui-ca__sr">, source: ${s.site} – ${s.title}</span></button>`;
          })}</span></span>${trail}</span>`;
        })}</p>`,
    )}</div>`;
  }

  private sourcePreview(source: CitedSource, look: Look, number: number, answer: string, copied: boolean) {
    const clean = look === "clean";
    const openLabel = html`${clean ? icon("out", look) : nothing}Open source${!clean ? icon("out", look) : nothing}`;
    return html`<div class="ui-ca__preview">
      <div class="ui-ca__pv-head">
        ${glyph(source)}
        <span class="ui-ca__pv-meta"><span class="ui-ca__pv-domain">${domain(source.url) || source.site}</span>${source.date ? html`<span class="ui-ca__pv-date"><span class="ui-ca__dot"> · </span>${source.date}</span>` : nothing}</span>
        <span class="ui-ca__pv-num">${number}</span>
        <button type="button" class="ui-ca__close" aria-label="Close source" @click=${() => this.close()}>${icon("close", look)}</button>
      </div>
      <div class="ui-ca__pv-title">${source.title}</div>
      ${source.quote ? html`<blockquote class="ui-ca__quote">${marked(source.quote, source.highlight, answer)}</blockquote>` : nothing}
      <div class="ui-ca__pv-actions">
        ${safeUrl(source.url)
          ? html`<a class="ui-ca__btn ui-ca__btn--main" href=${ifDefined(safeUrl(source.url))} target="_blank" rel="noreferrer noopener" @click=${(e: Event) => this.openSource(e, source)}>${openLabel}</a>`
          : this.openHandled
            ? html`<button type="button" class="ui-ca__btn ui-ca__btn--main" @click=${(e: Event) => this.openSource(e, source)}>${openLabel}</button>`
            : nothing}
        ${source.quote
          ? html`<button type="button" class="ui-ca__btn" ?data-done=${copied} aria-label=${copied ? "Copied" : "Copy quote"} @click=${() => void this.copyQuote(source)}>
              ${keyed(copied ? "done" : "idle", html`<span class="ui-ca__btn-icon">${icon(copied ? "done" : "copy", look)}</span>`)}
              <span class="ui-ca__btn-text">${copied ? "Copied" : "Copy quote"}</span>
            </button>`
          : nothing}
      </div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const sources = this.sources;
    const segments = this.segments;
    const index = this.index();
    const byId = (id: string | null | undefined) => (id == null ? null : (sources[index.get(id) ?? -1] ?? null));
    const known = (id: string) => index.has(id);
    const number = (id: string) => (index.get(id) ?? -1) + 1;
    const open = this.open;

    // Group the segments into paragraphs, remembering each one's index
    const paragraphs: { seg: CitedSegment; index: number }[][] = [];
    segments.forEach((seg, i) => {
      if (seg.paragraph || paragraphs.length === 0) paragraphs.push([]);
      paragraphs[paragraphs.length - 1].push({ seg, index: i });
    });
    const citing = (id: string) => segments.filter((s) => s.cite?.includes(id));

    const visible = !clean || this.allChips ? sources.length : Math.min(this.fit, sources.length);
    const hidden = sources.length - visible;
    const shown = byId(open ?? this.lastOpen);
    const previewId = `${this.uid}-preview`;
    const meta = [`${sources.length} ${sources.length === 1 ? "source" : "sources"}`, this.pagesRead !== undefined ? `${this.pagesRead} ${this.pagesRead === 1 ? "page" : "pages"} read` : null].filter(Boolean) as string[];
    const copiedSource = this.copied?.ok ? this.copied.source : null;
    const chips = this.chipRow(visible, hidden, clean && this.allChips, previewId);

    return html`
      <div class=${clean ? "ui-ca__body" : "ui-ca__card"}>
        <div class="ui-ca__head">
          <span class="ui-ca__stack" aria-hidden="true">${sources.slice(0, 3).map(glyph)}</span>
          <span class="ui-ca__meta">${meta.map((m, i) => html`<span>${i > 0 ? html`<span class="ui-ca__dot"> · </span>` : nothing}${m}</span>`)}</span>
        </div>
        ${this.answerText(paragraphs, known, (id) => byId(id), previewId)}
        ${clean ? chips : nothing}
        ${clean
          ? html`<div class="ui-ca__ruler" aria-hidden="true">${sources.map((s, i) => html`<span class="ui-ca__chip" data-chip="">${glyph(s)}<span class="ui-ca__chip-name">${s.site}</span><span class="ui-ca__chip-num">${i + 1}</span></span>`)}<span class="ui-ca__more" data-more="">+${sources.length}</span></div>`
          : nothing}
        <div id=${previewId} class="ui-ca__fold" ?data-open=${!!open} .inert=${!open} role="region" aria-label=${shown ? `Source ${number(shown.id)}: ${shown.site}` : "Source"}>
          <div class="ui-ca__clip">
            ${shown
              ? keyed(
                  shown.id,
                  this.sourcePreview(
                    shown,
                    look,
                    number(shown.id),
                    citing(shown.id)
                      .map((seg) => seg.text)
                      .join(" "),
                    copiedSource === shown.id,
                  ),
                )
              : nothing}
          </div>
        </div>
      </div>
      ${!clean ? chips : nothing}
      <div class="ui-ca__foot">
        <span class="ui-ca__sr" role="status">${this.copied ? (this.copied.ok ? "Quote copied" : "Couldn't copy the quote") : ""}</span>
        <span class="ui-ca__caption">${this.swap()}</span>
        ${this.actionLabel ? html`<button type="button" class="ui-ca__action" @click=${() => this.emit("tc-action", null)}>${this.actionLabel}${icon("arrow", look)}</button>` : nothing}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ca"] {
  /* insets and hover fills: a light grey on the card, lighter than the card in dark mode */
  --tc-cited-answer-well: light-dark(#f4f4f5, #222225);
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  min-width: 0;
  container-type: inline-size;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="ca"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ca"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  min-width: 0;
  container-type: inline-size;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="ca"] *, [data-ui="ca"] *::before, [data-ui="ca"] *::after { box-sizing: border-box; }
:where([data-ui="ca"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ca"] :is(button, a):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ca__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
[data-ui="ca"] svg { display: block; flex: none; }
[data-ui="ca"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* Letter glyphs on a soft tint – stand-ins for favicons */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ca"] [data-tone="blue"] { --tc-cited-answer-glyph-fg: light-dark(#1f55d6, #9bb8ff); --tc-cited-answer-glyph-bg: light-dark(rgba(47, 107, 255, 0.12), rgba(79, 130, 255, 0.2)); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ca"] [data-tone="violet"] { --tc-cited-answer-glyph-fg: light-dark(#6941c6, #c3b1ff); --tc-cited-answer-glyph-bg: light-dark(rgba(124, 92, 255, 0.13), rgba(124, 92, 255, 0.22)); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ca"] [data-tone="green"] { --tc-cited-answer-glyph-fg: light-dark(#18794e, #6ee7a8); --tc-cited-answer-glyph-bg: light-dark(rgba(34, 160, 90, 0.13), rgba(34, 160, 90, 0.2)); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ca"] [data-tone="amber"] { --tc-cited-answer-glyph-fg: light-dark(#96590a, #f5c264); --tc-cited-answer-glyph-bg: light-dark(rgba(240, 160, 32, 0.18), rgba(240, 160, 32, 0.2)); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ca"] [data-tone="gray"] { --tc-cited-answer-glyph-fg: light-dark(#5f5f66, #b4b4bb); --tc-cited-answer-glyph-bg: light-dark(rgba(110, 110, 120, 0.12), rgba(110, 110, 120, 0.22)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__glyph { display: grid; flex: none; place-items: center; width: 16px; height: 16px; overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-cited-answer-glyph-bg); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); color: var(--tc-cited-answer-glyph-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__dot { color: var(--tc-text-disabled); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__icon { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
/* Letter glyphs on a light tint – stand-ins for favicons */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ca"] [data-tone="blue"] { --tc-cited-answer-glyph-fg: light-dark(#1f5fd1, #9bbcff); --tc-cited-answer-glyph-bg: light-dark(rgba(0, 96, 226, 0.08), rgba(77, 141, 255, 0.16)); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ca"] [data-tone="violet"] { --tc-cited-answer-glyph-fg: light-dark(#6a4fd0, #c3b4ff); --tc-cited-answer-glyph-bg: light-dark(rgba(110, 86, 230, 0.09), rgba(124, 92, 255, 0.18)); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ca"] [data-tone="green"] { --tc-cited-answer-glyph-fg: light-dark(#1a8a4a, #6ee7a8); --tc-cited-answer-glyph-bg: light-dark(rgba(26, 154, 82, 0.09), rgba(34, 160, 90, 0.16)); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ca"] [data-tone="amber"] { --tc-cited-answer-glyph-fg: light-dark(#a46a06, #f5c264); --tc-cited-answer-glyph-bg: light-dark(rgba(232, 162, 12, 0.12), rgba(240, 160, 32, 0.16)); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ca"] [data-tone="gray"] { --tc-cited-answer-glyph-fg: light-dark(rgba(0, 0, 0, 0.55), rgba(255, 255, 255, 0.62)); --tc-cited-answer-glyph-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__glyph { display: grid; flex: none; place-items: center; width: 16px; height: 16px; overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-cited-answer-glyph-bg); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-cited-answer-glyph-fg); }
.ui-ca__glyph > :is(img, svg) { width: 100%; height: 100%; object-fit: cover; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__card { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- Head ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__head { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 22px; }
/* Everything above the last row */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__body { padding: var(--tc-space-4) var(--tc-space-5) var(--tc-space-4); }
/* ----- Head ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__head { display: flex; align-items: center; gap: var(--tc-space-2); height: 16px; }
.ui-ca__stack { display: flex; flex: none; }
.ui-ca__stack .ui-ca__glyph { box-shadow: 0 0 0 1.5px var(--tc-surface-raised); }
.ui-ca__stack .ui-ca__glyph + .ui-ca__glyph { margin-left: -4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__meta { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* ----- Answer ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__text { margin-top: var(--tc-space-2); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__p { margin: 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__meta { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* ----- Answer ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__text { margin-top: var(--tc-space-3); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__p { margin: 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); }
.ui-ca__p + .ui-ca__p { margin-top: var(--tc-space-2-5); }
.ui-ca__seg { margin: 0 -2px; padding: var(--tc-space-0-5) var(--tc-space-0-5); border-radius: var(--tc-radius-xs); -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__seg[data-hl] { background: var(--tc-accent-highlight); color: var(--tc-text-primary); }
/* Sentences that don't cite the source in focus step back – to muted, still readable */
.ui-ca__seg[data-dim] { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__seg[data-hl] { background: var(--tc-accent-highlight); color: var(--tc-text-strong); }
.ui-ca__keep { white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker { position: relative; display: inline-grid; place-items: center; min-width: 16px; height: 16px; margin-left: var(--tc-space-1); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-cited-answer-well); box-shadow: inset 0 0 0 1px var(--tc-border-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); vertical-align: 1px; font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
/* Citation markers: the gray tab look; the linked one gets a touch darker */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker { position: relative; display: inline-grid; place-items: center; min-width: 16px; height: 16px; margin-left: var(--tc-space-1); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); vertical-align: 1px; font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ca__marker + .ui-ca__marker { margin-left: var(--tc-space-0-5); }
.ui-ca__marker::after { content: ""; position: absolute; inset: -4px -2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker[data-lit] { background: var(--tc-accent); box-shadow: inset 0 0 0 1px var(--tc-accent); color: var(--tc-text-on-accent); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker[aria-expanded="true"] { background: var(--tc-surface-inverse); box-shadow: inset 0 0 0 1px var(--tc-surface-inverse); color: var(--tc-text-on-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker[data-lit] { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
/* The open one is the chosen state: accent */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker[aria-expanded="true"] { background: var(--tc-accent); box-shadow: none; color: var(--tc-text-on-accent); }
.ui-ca__marker[data-dim]:not([aria-expanded="true"]) { color: var(--tc-text-muted); }
/* ----- Preview: unfolds in place, nothing travels ----- */
.ui-ca__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ca__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-instant); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__clip { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__preview { margin-top: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3); border-radius: var(--tc-radius-xl); background: var(--tc-cited-answer-well); animation: ui-ca-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-head { display: flex; align-items: center; gap: var(--tc-space-2); height: 22px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-meta { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* ----- Sources: one row of tab chips ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chips { display: flex; gap: ${CHIP_GAP}px; margin-top: var(--tc-space-4); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chips[data-all] { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip-item { display: flex; flex: none; min-width: 0; max-width: 100%; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip-item:only-child,
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chips:not([data-all]) .ui-ca__chip-item:first-child:nth-last-child(2) { flex: 0 1 auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; max-width: 100%; height: 28px; padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip[data-lit] { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
/* The open source: a fill plus a selected ring (≥ 3:1), not the fill alone */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip[aria-expanded="true"] { background: var(--tc-fill-default); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); }
/* Chips of other sources step back while one is in focus: muted text, faded glyph */
.ui-ca__chip[data-dim]:not([aria-expanded="true"]) { color: var(--tc-text-muted); }
.ui-ca__chip[data-dim]:not([aria-expanded="true"]) .ui-ca__glyph { opacity: 0.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip-num { flex: none; margin-left: -1px; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__more { display: inline-grid; flex: none; place-items: center; height: 28px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__more:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__ruler { position: absolute; top: 0; left: 0; display: flex; gap: ${CHIP_GAP}px; height: 0; overflow: hidden; visibility: hidden; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__ruler > * { flex: none; }
/* A few pixels of room so the preview's shadow isn't cut off */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__clip { min-height: 0; overflow: hidden; margin: 0 -4px -4px; padding: 0 var(--tc-space-1) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__preview { margin-top: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); animation: ui-ca-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-head { display: flex; align-items: center; gap: var(--tc-space-2); height: 24px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-meta { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-ca__pv-domain { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-num { display: grid; flex: none; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__close { display: grid; flex: none; place-items: center; width: 24px; height: 24px; margin-right: -5px; border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__close:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-title { display: -webkit-box; margin-top: var(--tc-space-1-5); overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__quote { margin: var(--tc-space-2) 0 0; padding: 0 0 0 var(--tc-space-2-5); border-left: 2px solid var(--tc-border-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-num { display: grid; flex: none; place-items: center; min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__close { display: grid; flex: none; place-items: center; width: 24px; height: 24px; margin-right: -6px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__close:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-title { display: -webkit-box; margin-top: var(--tc-space-1-5); overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__quote { margin: var(--tc-space-2) 0 0; padding: 0 0 0 var(--tc-space-2-5); border-left: 2px solid var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-ca__quote mark { margin: 0 -1px; padding: 1px 1px; border-radius: var(--tc-radius-2xs); background: var(--tc-accent-highlight); color: var(--tc-text-primary); -webkit-box-decoration-break: clone; box-decoration-break: clone; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); margin-top: var(--tc-space-3); }
/* Copy quote: the library's ghost button; Open source: its secondary button */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); text-decoration: none; white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn--main { padding: 0 var(--tc-space-2) 0 var(--tc-space-2-5); }
[data-ui="ca"] .ui-ca__btn--main { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
[data-ui="ca"] .ui-ca__btn--main:hover { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow-hover); color: var(--tc-action-secondary-fg); }
.ui-ca__btn--main :is(svg, .ui-ca__icon) { transition: transform var(--tc-duration-base) var(--tc-ease-move), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ca__btn--main:hover :is(svg, .ui-ca__icon) { transform: translate(1px, -1px); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn[data-done] { color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn-icon { display: grid; place-items: center; width: 12px; height: 12px; animation: ui-ca-swap-in var(--tc-duration-moderate) var(--tc-ease-standard) both; }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); padding: var(--tc-space-1-5) var(--tc-space-1) 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip-item { display: flex; min-width: 0; max-width: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; max-width: 100%; height: 28px; padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip[data-lit] { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip[aria-expanded="true"] { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised), inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip-num { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__foot { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 36px; padding: var(--tc-space-0-5) var(--tc-space-1) 0 var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); margin-top: var(--tc-space-3); }
/* Copy quote: a ghost button; Open source: the white secondary button */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-normal); color: var(--tc-action-ghost-fg); text-decoration: none; white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn .ui-ca__icon { color: var(--tc-icon-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn:hover .ui-ca__icon { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn[data-done],
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn[data-done] .ui-ca__icon { color: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn-icon { display: grid; place-items: center; width: 16px; height: 16px; animation: ui-ca-swap-in var(--tc-duration-moderate) var(--tc-ease-standard) both; }
/* ----- The last row ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__foot { display: flex; align-items: center; gap: var(--tc-space-3); height: 44px; padding: 0 var(--tc-space-2) 0 var(--tc-space-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__foot:not(:has(.ui-ca__action)) { padding-right: var(--tc-space-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-ca__swap { display: grid; min-width: 0; }
.ui-ca__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-ca-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-ca__swap-item[data-out] { animation: ui-ca-swap-out var(--tc-duration-base) var(--tc-ease-standard) both; }
.ui-ca__swap-item[data-tone="error"] { color: var(--tc-status-danger-fg); }
.ui-ca__swap-item[data-tone="ok"] { color: var(--tc-status-success-fg); }
/* The tray's action: the library's ghost button */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__action { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__action:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-ca__action :is(svg, .ui-ca__icon) { transition: transform var(--tc-duration-base) var(--tc-ease-move), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ca__action:hover :is(svg, .ui-ca__icon) { transform: translateX(2px); }
/* Follow up: the secondary button, as Button draws it */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 8px 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-normal); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action .ui-ca__icon { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action:hover .ui-ca__icon { color: var(--tc-text-primary); }
@keyframes ui-ca-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-ca-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
/* Narrow cards: tighter padding, chip names shorten, Copy quote keeps only its icon */
@container (max-width: 360px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ca__card { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-num { display: none; }
}
/* Narrow cards: tighter padding, the preview drops its number tag, Copy quote keeps only its icon */
@container (max-width: 400px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ca__body { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__foot { padding-left: var(--tc-space-4); }
}
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-num { display: none; }
}
@container (max-width: 280px) {
  .ui-ca__btn-text { display: none; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker::after { inset: -8px -5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__close { width: 30px; height: 30px; margin-right: -7px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__action { height: 30px; }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker::after { inset: -8px -5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip,
:where([data-look="clean"], [data-look="clean"] *).ui-ca__more { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__close { width: 32px; height: 32px; margin-right: -8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__foot { height: 52px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ca"] *, [data-ui="ca"] *::before, [data-ui="ca"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-cited-answer")) customElements.define("tc-cited-answer", TcCitedAnswer);

declare global {
  interface HTMLElementTagNameMap {
    "tc-cited-answer": TcCitedAnswer;
  }
}
