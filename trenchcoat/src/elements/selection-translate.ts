import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";
import { segments, SelectionController, trimRange, type TextSelection } from "./internal/selection";
import { passageRect, SelectionToolbarController } from "./internal/selection-toolbar";
import { copyText } from "./internal/util";

/*
 * <tc-selection-translate> – translate part of any text where it stands. Select a passage with the pointer, or with
 * the keyboard in the text's caret mode, choose Translate from the small toolbar, and a card opens under it:
 *   · the translation, in the target language chosen in the card's select (`target`; changing it fires a cancelable
 *     tc-target-change, so the app can remember it)
 *   · the source language the app detected, as the app gives it
 *   · Copy, Replace in place (only when `editable` – a cancelable tc-text-change, then `text` changes), and Show
 *     original, which opens the passage under the translation
 * The app does the translating. The element fires a cancelable tc-translate ({ text, target, start, end, signal,
 * respondWith }); a listener answers with `detail.respondWith(promiseOrResult)`. Without an answer it calls the
 * `resolveTranslate` resolver property, `(text, target, signal) => Promise<{ text, source? }>` (not `translate`, which
 * every HTML element already has); with neither, the card says
 * no translator is connected. A listener that calls preventDefault() without answering takes the request elsewhere,
 * and the card closes. Loading, error and Retry are shown in the card; answers are cached by text and target for the
 * element's life, and the signal aborts when the card closes, the target changes or the element is removed.
 *
 *   <tc-selection-translate .text=${post} target="en" .resolveTranslate=${(text, to, signal) => myApi(text, to, signal)}>
 *   </tc-selection-translate>
 *
 * The text is the `text` property – plain text, paragraphs separated by blank lines – not slotted: offsets must index
 * one exact string. Set `lang` on the element when you know the text's language.
 *
 * Keyboard (as tc-text-annotator). The text is one tab stop in caret mode (internal/selection.ts): ← → a character,
 * Ctrl/Alt + ← → a word, ↑ ↓ a line, Home / End, Shift to extend, Ctrl/⌘ + A all. With a selection, Tab moves into the
 * toolbar (Shift + Tab or Esc back). Translate opens the card – a non-modal dialog – and focus moves to its language
 * select; Tab walks its controls, Esc closes it and puts focus back in the text after the passage. Screen readers hear
 * the card's name ("Translation"), its state in a polite status region ("Translating to English…", "Translated from
 * French: …", "Couldn't translate"), and the passage marked as "Translating:" while the card is open.
 *
 * Neither look adds a card around the text: it sits on whatever surface holds it. Both looks share the popover
 * surface; Standard sets the translation a step larger with filled Copy / Replace buttons, Clean keeps body size,
 * ghost buttons and thinner icons.
 */

/** A target language: a BCP 47 code and the name people read */
export type TranslateLanguage = { code: string; name: string };
/** The app's answer: the translation and, when it knows, the detected source language (a code or a name) */
export type SelectionTranslation = { text: string; source?: string };
/** The `resolveTranslate` resolver */
export type SelectionTranslateResolver = (text: string, target: string, signal: AbortSignal) => Promise<SelectionTranslation> | SelectionTranslation;
/** tc-translate: a translation is needed */
export type SelectionTranslateRequest = {
  text: string;
  target: string;
  start: number;
  end: number;
  /** Aborted when the card closes, the target changes, or the element is removed */
  signal: AbortSignal;
  /** Answer the request – with the result, or a promise of it */
  respondWith: (answer: SelectionTranslation | Promise<SelectionTranslation>) => void;
};
/** tc-target-change: the target language was changed in the card */
export type SelectionTranslateTargetChange = { target: string };
/** tc-copy: Copy was chosen on a translation */
export type SelectionTranslateCopy = { text: string };
/** tc-text-change: Replace was chosen – the text with the passage replaced by its translation */
export type SelectionTranslateTextChange = { text: string; previous: string; start: number; end: number; replacement: string; target: string };

export const TRANSLATE_LANGUAGES: TranslateLanguage[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

const shorten = (t: string, n = 48) => {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
};

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult) => html`<svg class="ui-strn__glyph" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const langIcon = glyph(svg`<path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path>`);
const copyIcon = glyph(svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const replaceIcon = glyph(svg`<path d="M4 7h11"></path><path d="m12 4 3 3-3 3"></path><path d="M20 17H9"></path><path d="m12 14-3 3 3 3"></path>`);
const xIcon = glyph(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const arrowIcon = glyph(svg`<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>`);
const chevronIcon = glyph(svg`<path d="m6 9 6 6 6-6"></path>`);

let instances = 0;
let displayNames: Intl.DisplayNames | null | undefined;

/**
 * Select text and translate it in place: the translation in a card with the detected language, Copy, Replace in place
 * and Show original. The app translates; the element never calls a service.
 * @tag tc-selection-translate
 * @fires tc-translate - A translation is needed ({ text, target, start, end, signal, respondWith }: SelectionTranslateRequest); answer with `detail.respondWith()`, or leave it to `resolveTranslate`; prevented without an answer, the card closes
 * @fires tc-target-change - The target language was changed in the card ({ target }: SelectionTranslateTargetChange); cancelable – prevent it to control `target`
 * @fires tc-copy - Copy was chosen on a translation ({ text }: SelectionTranslateCopy); cancelable – prevent it to copy your own way
 * @fires tc-text-change - Replace was chosen ({ text, previous, start, end, replacement, target }: SelectionTranslateTextChange); cancelable – prevent it to control `text`
 */
export class TcSelectionTranslate extends TcElement {
  static override ui = "strn";

  /** The text: plain text, paragraphs separated by blank lines. Offsets index into it */
  @property() accessor text = "";
  /** Replace in place is offered: the text can be changed by the element (tc-text-change) */
  @property({ type: Boolean, reflect: true }) accessor editable = false;
  /** The language to translate into, as a code from `languages`. Changed from the card unless a tc-target-change listener calls preventDefault() */
  @property() accessor target = "en";
  /** The languages the card offers */
  @property({ attribute: false }) accessor languages: TranslateLanguage[] = TRANSLATE_LANGUAGES;
  /** Translates when no tc-translate listener answers: (text, target, signal) => { text, source? } */
  @property({ attribute: false }) accessor resolveTranslate: SelectionTranslateResolver | undefined = undefined;
  /** The text's accessible name */
  @property({ attribute: "text-label" }) accessor textLabel = "Text";

  /** @internal The trimmed selection the toolbar acts on */
  @state() accessor picked: { start: number; end: number } | null = null;
  /** @internal The passage the card shows, and how its translation stands */
  @state() accessor card: {
    start: number;
    end: number;
    text: string;
    target: string;
    status: "loading" | "done" | "error";
    result?: SelectionTranslation;
    error?: string;
  } | null = null;
  /** @internal The original is open under the translation */
  @state() accessor showOriginal = false;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-strn${++instances}`;
  private readonly cache = new Map<string, SelectionTranslation>();
  private abort: AbortController | null = null;
  private focusAfter: (() => HTMLElement | null | undefined) | null = null;
  /** Where the caret goes after the next update */
  private caretTo: number | null = null;

  private readonly sel = new SelectionController(this, {
    root: () => this.textRoot,
    caret: true,
    caretEl: () => this.querySelector<HTMLElement>(".ui-strn__caret"),
    onChange: (s, how) => this.onSelection(s, how.cause, how.final),
  });
  private readonly bar = new SelectionToolbarController(this, {
    sel: this.sel,
    root: () => this.textRoot,
    range: () => this.picked,
    box: true,
    popover: () => this.querySelector<HTMLElement>(".ui-strn__pop"),
    items: () => [...this.querySelectorAll<HTMLElement>(".ui-strn__pop .ui-strn__tool")],
  });
  private readonly cardPop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-strn__card"),
    anchor: () => passageRect(this.textRoot, this.card, true),
    kind: "dialog",
    side: "bottom",
    trigger: () => this.textRoot,
    returnFocus: () => this.textRoot,
    tabBridge: true,
    onClose: (reason) => {
      const c = this.card;
      this.abort?.abort();
      this.abort = null;
      this.card = null;
      this.showOriginal = false;
      if (c && reason === "escape") this.caretTo = c.end;
    },
  });

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.abort?.abort();
    this.abort = null;
  }

  private get textRoot() {
    return this.querySelector<HTMLElement>(".ui-strn__text");
  }

  /** A language's name: from `languages`, else the browser's name for the code, else as given */
  langName(code: string | undefined) {
    if (!code) return "";
    const known = this.languages.find((l) => l.code.toLowerCase() === code.toLowerCase());
    if (known) return known.name;
    // A name ("French") is shown as given; only codes are looked up
    if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(code)) return code;
    if (displayNames === undefined) {
      try {
        displayNames = new Intl.DisplayNames(undefined, { type: "language" });
      } catch {
        displayNames = null;
      }
    }
    try {
      return displayNames?.of(code) ?? code;
    } catch {
      return code;
    }
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  /* ---------- Translating ---------- */

  private open() {
    const r = this.picked;
    if (!r) return;
    this.bar.pop.close();
    this.showOriginal = false;
    this.run(r.start, r.end, this.target, false);
    if (!this.card) return;
    this.cardPop.show();
    this.focusAfter = () => this.querySelector<HTMLElement>(".ui-strn__select");
  }

  private run(start: number, end: number, target: string, retry: boolean) {
    this.abort?.abort();
    this.abort = null;
    const text = this.text.slice(start, end);
    const key = `${target}\u0000${text}`;
    const hit = retry ? undefined : this.cache.get(key);
    if (hit) {
      this.card = { start, end, text, target, status: "done", result: hit };
      this.announce(hit, target);
      return;
    }
    const abort = new AbortController();
    this.abort = abort;
    this.card = { start, end, text, target, status: "loading" };
    this.say(`Translating to ${this.langName(target)}…`);
    let answer: Promise<SelectionTranslation> | undefined;
    const detail: SelectionTranslateRequest = {
      text,
      target,
      start,
      end,
      signal: abort.signal,
      respondWith: (a) => {
        answer ??= Promise.resolve(a);
      },
    };
    const go = this.emit<SelectionTranslateRequest>("tc-translate", detail, { cancelable: true });
    if (!answer && !go) {
      // Taken elsewhere
      this.abort = null;
      this.card = null;
      this.cardPop.close();
      this.say("");
      return;
    }
    const resolver = this.resolveTranslate;
    answer ??= resolver ? Promise.resolve().then(() => resolver(text, target, abort.signal)) : Promise.reject(new Error("No translator is connected"));
    answer.then(
      (res) => {
        if (abort.signal.aborted || this.abort !== abort) return;
        this.abort = null;
        if (!res || typeof res.text !== "string") {
          this.fail("The translator gave no text");
          return;
        }
        const result: SelectionTranslation = { text: res.text, ...(res.source ? { source: res.source } : {}) };
        this.cache.set(key, result);
        this.card = { start, end, text, target, status: "done", result };
        this.announce(result, target);
      },
      (err: unknown) => {
        if (abort.signal.aborted || this.abort !== abort) return;
        this.abort = null;
        this.fail(err instanceof Error && err.message ? err.message : "");
      },
    );
  }

  private fail(why: string) {
    const c = this.card;
    if (!c) return;
    this.card = { ...c, status: "error", error: why };
    this.say(`Couldn't translate${why ? `: ${why}` : ""}. Retry is in the card`);
  }

  private announce(r: SelectionTranslation, target: string) {
    const from = this.langName(r.source);
    this.say(`Translated ${from ? `from ${from} ` : ""}to ${this.langName(target)}: ${shorten(r.text, 160)}`);
  }

  private retry() {
    const c = this.card;
    if (!c) return;
    this.run(c.start, c.end, c.target, true);
    this.focusAfter = () => this.querySelector<HTMLElement>(".ui-strn__select");
  }

  private changeTarget(target: string) {
    if (target === this.target) return;
    if (!this.emit<SelectionTranslateTargetChange>("tc-target-change", { target }, { cancelable: true })) {
      // The app keeps `target`: the select shows it again
      this.requestUpdate();
      return;
    }
    this.target = target;
  }

  private async copy() {
    const r = this.card?.result;
    if (!r) return;
    if (!this.emit<SelectionTranslateCopy>("tc-copy", { text: r.text }, { cancelable: true })) return;
    this.say((await copyText(r.text)) ? "Copied" : "Couldn't copy – use Ctrl+C");
  }

  private replace() {
    const c = this.card;
    const r = c?.result;
    if (!this.editable || !c || !r) return;
    const previous = this.text;
    const text = previous.slice(0, c.start) + r.text + previous.slice(c.end);
    // Prevented, the app applies `text` itself; the card is done either way
    if (this.emit<SelectionTranslateTextChange>("tc-text-change", { text, previous, start: c.start, end: c.end, replacement: r.text, target: c.target }, { cancelable: true })) this.text = text;
    this.caretTo = c.start + r.text.length;
    this.cardPop.close();
    this.textRoot?.focus({ preventScroll: true });
    this.say(`Replaced with the ${this.langName(c.target)} translation`);
  }

  /* ---------- Selection and keys ---------- */

  private onSelection(s: TextSelection | null, cause: string, final: boolean) {
    const r = s && !s.collapsed ? trimRange(this.text, s.start, s.end) : null;
    this.picked = r && r.end > r.start ? r : null;
    this.bar.follow(!!this.picked, final);
    if (!this.picked || !final) return;
    if (cause === "keyboard") this.say(`Selected “${shorten(this.text.slice(this.picked.start, this.picked.end))}”. Tab to translate`);
  }

  private onTextKey(e: KeyboardEvent) {
    if (e.target !== this.textRoot) return;
    if (e.key === "Escape" && this.bar.pop.open) return;
    this.sel.onKeyDown(e);
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const c = this.card;
    // The passage moved out from under the card (the app changed the text)
    if (changed.has("text") && c && this.text.slice(c.start, c.end) !== c.text) {
      this.abort?.abort();
      this.abort = null;
      this.card = null;
      this.cardPop.close("anchor-gone");
    } else if (changed.has("target") && c && c.target !== this.target) this.run(c.start, c.end, this.target, false);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    const f = this.focusAfter;
    if (f) {
      this.focusAfter = null;
      f()?.focus({ preventScroll: true });
    }
    if (this.caretTo !== null) {
      const at = this.caretTo;
      this.caretTo = null;
      this.sel.select(at);
    }
  }

  /* ---------- Render ---------- */

  private renderText() {
    const c = this.card;
    if (!c) return this.text;
    let first = true;
    return segments(this.text, [{ start: c.start, end: c.end }]).map((seg) => {
      if (!seg.ranges.length) return seg.text;
      const label = first ? html`<span class="ui-strn__sr" data-tc-skip>Translating: </span>` : nothing;
      first = false;
      return html`<mark class="ui-strn__mark">${label}${seg.text}</mark>`;
    });
  }

  private renderToolbar() {
    if (!this.bar.pop.open) return nothing;
    return html`<div class="tc-pop ui-strn__pop" role="toolbar" aria-label="Selection">
      <button type="button" class="ui-strn__tool" @click=${() => this.open()}>${langIcon}<span>Translate</span></button>
    </div>`;
  }

  private renderCard() {
    const c = this.card;
    if (!c || !this.cardPop.open) return nothing;
    const id = this.uid;
    const done = c.status === "done" && c.result;
    const source = done ? this.langName(c.result!.source) : "";
    const known = this.languages.some((l) => l.code === this.target);
    return html`<div class="tc-pop ui-strn__card" role="dialog" aria-labelledby=${`${id}-title`} aria-busy=${c.status === "loading" ? "true" : "false"}>
      <div class="ui-strn__head">
        <span class="ui-strn__title" id=${`${id}-title`}>${langIcon}Translation</span>
        <button type="button" class="ui-strn__close" aria-label="Close translation" title="Close" @click=${() => this.cardPop.close()}>${xIcon}</button>
      </div>
      <div class="ui-strn__langs">
        <span class="ui-strn__from" data-state=${c.status}>${c.status === "loading" ? "Detecting…" : source ? html`<span class="ui-strn__sr">Detected: </span>${source}` : "Unknown language"}</span>
        <span class="ui-strn__arrow" aria-hidden="true">${arrowIcon}</span>
        <span class="ui-strn__pick">
          <select class="ui-strn__select" aria-label="Translate to" .value=${live(this.target)} @change=${(e: Event) => this.changeTarget((e.target as HTMLSelectElement).value)}>
            ${known ? nothing : html`<option value=${this.target} selected>${this.langName(this.target)}</option>`}
            ${this.languages.map((l) => html`<option value=${l.code} ?selected=${l.code === this.target}>${l.name}</option>`)}
          </select>
          ${chevronIcon}
        </span>
      </div>
      <div class="ui-strn__body">
        ${c.status === "loading"
          ? html`<div class="ui-strn__loading" aria-hidden="true"><span class="ui-strn__line"></span><span class="ui-strn__line"></span><span class="ui-strn__line" data-short></span></div>`
          : c.status === "error"
            ? html`<p class="ui-strn__error">${c.error ? `Couldn't translate: ${c.error}` : "Couldn't translate this."}</p>`
            : html`<p class="ui-strn__out" lang=${c.target}>${c.result!.text}</p>`}
        ${this.showOriginal
          ? html`<div class="ui-strn__original" id=${`${id}-orig`}>
              <span class="ui-strn__caption">Original${source ? ` · ${source}` : ""}</span>
              <p lang=${ifDefined(c.result?.source && /^[a-z]{2,3}(-|$)/i.test(c.result.source) ? c.result.source : undefined)}>${c.text}</p>
            </div>`
          : nothing}
      </div>
      <div class="ui-strn__acts">
        ${c.status === "error" ? html`<button type="button" class="ui-strn__btn" data-kind="retry" @click=${() => this.retry()}>Retry</button>` : nothing}
        ${done
          ? html`<button type="button" class="ui-strn__btn" data-kind="copy" @click=${() => void this.copy()}>${copyIcon}<span>Copy</span></button>
              ${this.editable ? html`<button type="button" class="ui-strn__btn" data-kind="replace" @click=${() => this.replace()}>${replaceIcon}<span>Replace</span></button>` : nothing}`
          : nothing}
        <button type="button" class="ui-strn__btn" data-kind="original" aria-expanded=${this.showOriginal ? "true" : "false"} aria-controls=${ifDefined(this.showOriginal ? `${id}-orig` : undefined)} @click=${() => (this.showOriginal = !this.showOriginal)}>
          ${this.showOriginal ? "Hide original" : "Show original"}
        </button>
      </div>
    </div>`;
  }

  protected override render() {
    return html`
      <div class="ui-strn__doc">
        <div class="ui-strn__text" role="document" tabindex="0" aria-label=${this.textLabel} aria-describedby=${`${this.uid}-hint`} @keydown=${this.onTextKey}>${this.renderText()}</div>
        <span class="ui-strn__caret" aria-hidden="true" hidden></span>
        ${this.renderToolbar()} ${this.renderCard()}
      </div>
      <p class="ui-strn__hint" id=${`${this.uid}-hint`} hidden>Select text with Shift and the arrow keys, then press Tab to translate it.</p>
      <span class="ui-strn__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="strn"] {
  --tc-selection-translate-card-w: 340px;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="strn"] *, [data-ui="strn"] *::before, [data-ui="strn"] *::after { box-sizing: border-box; }
:where([data-ui="strn"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="strn"]) p { margin: 0; }
[data-ui="strn"] :is(button, [tabindex], select):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-strn__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; user-select: none; -webkit-user-select: none; }
.ui-strn__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-strn__glyph { stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-strn__glyph { stroke-width: 1.4; }
/* ----- The text ----- */
.ui-strn__doc { position: relative; min-width: 0; }
.ui-strn__text { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-loose); white-space: pre-wrap; overflow-wrap: break-word; cursor: text; border-radius: var(--tc-radius-xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-strn__text { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); }
.ui-strn__text:focus-visible { outline-offset: var(--tc-space-1); }
.ui-strn__text::selection, .ui-strn__text ::selection { background: var(--tc-accent-highlight); }
.ui-strn__caret { position: absolute; top: 0; left: -1px; width: 2px; border-radius: var(--tc-radius-2xs); background: var(--tc-accent); pointer-events: none; animation: ui-strn-blink var(--tc-duration-shimmer) steps(1) infinite; }
.ui-strn__caret[hidden] { display: none; }
@keyframes ui-strn-blink { 50% { opacity: 0; } }
/* The passage the card is about */
.ui-strn__mark { padding: var(--tc-space-0-5) 0; border-radius: var(--tc-radius-2xs); background: var(--tc-highlight-blue-bg); color: var(--tc-highlight-blue-fg); box-decoration-break: clone; -webkit-box-decoration-break: clone; }
/* ----- The toolbar ----- */
.ui-strn__pop { display: flex; align-items: center; gap: var(--tc-space-0-5); }
.ui-strn__tool { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-strn__tool:hover { background: var(--tc-menu-item-hover); color: var(--tc-text-primary); }
[data-ui="strn"] .ui-strn__tool:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
/* ----- The card (internal/popover.ts places it) ----- */
.ui-strn__card { display: grid; gap: var(--tc-space-2-5); width: var(--tc-selection-translate-card-w); padding: var(--tc-space-3); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
.ui-strn__head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); margin: calc(var(--tc-space-1) * -1) calc(var(--tc-space-1) * -1) 0 0; }
.ui-strn__title { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); }
.ui-strn__close { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-strn__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-strn__langs { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-strn__from { overflow: hidden; color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
.ui-strn__from[data-state="loading"] { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-strn__arrow { color: var(--tc-icon-muted); }
.ui-strn__arrow .ui-strn__glyph { width: 12px; height: 12px; }
.ui-strn__pick { position: relative; display: inline-flex; align-items: center; min-width: 0; }
.ui-strn__select { appearance: none; -webkit-appearance: none; height: var(--tc-field-h-sm); padding: 0 calc(var(--tc-space-2) + var(--tc-space-4)) 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); cursor: pointer; }
.ui-strn__select:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-strn__pick > .ui-strn__glyph { position: absolute; right: var(--tc-space-1-5); width: 12px; height: 12px; color: var(--tc-icon-muted); pointer-events: none; }
.ui-strn__body { display: grid; gap: var(--tc-space-2-5); min-width: 0; }
.ui-strn__out { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: break-word; }
:where([data-look="clean"], [data-look="clean"] *).ui-strn__out { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
.ui-strn__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-md); }
.ui-strn__loading { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-1) 0; }
.ui-strn__line { position: relative; display: block; overflow: hidden; height: 10px; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-hover); }
.ui-strn__line[data-short] { width: 60%; }
/* A sweep of light across each line – a transform, so it stays on the compositor */
.ui-strn__line::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--tc-fill-strong), transparent); transform: translateX(-100%); animation: ui-strn-sweep var(--tc-duration-shimmer) linear infinite; }
@keyframes ui-strn-sweep { to { transform: translateX(100%); } }
.ui-strn__original { display: grid; gap: var(--tc-space-1); padding-top: var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-secondary); white-space: pre-wrap; overflow-wrap: break-word; animation: ui-strn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-strn__caption { color: var(--tc-text-muted); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); }
.ui-strn__acts { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-strn__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-strn__btn[data-kind="original"] { margin-left: auto; color: var(--tc-action-ghost-fg); }
.ui-strn__btn[data-kind="original"]:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-strn__btn:is([data-kind="copy"], [data-kind="retry"]) { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-strn__btn[data-kind="replace"] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-strn__btn[data-kind="replace"]:hover { background: var(--tc-action-primary-bg-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-strn__btn:is([data-kind="copy"], [data-kind="retry"], [data-kind="replace"]) { color: var(--tc-action-ghost-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-strn__btn:is([data-kind="copy"], [data-kind="retry"], [data-kind="replace"]):hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-strn__btn[data-kind="replace"] { color: var(--tc-accent-text); }
@keyframes ui-strn-in { from { opacity: 0; transform: translateY(2px); } }
@media (forced-colors: active) {
  .ui-strn__mark { forced-color-adjust: none; background: Mark; color: MarkText; }
  .ui-strn__caret { background: CanvasText; }
  .ui-strn__line { forced-color-adjust: none; background: GrayText; }
}
@media (pointer: coarse) {
  .ui-strn__tool, .ui-strn__btn, .ui-strn__close { height: var(--tc-control-h-md); min-width: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="strn"] *, [data-ui="strn"] *::before, [data-ui="strn"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-selection-translate")) customElements.define("tc-selection-translate", TcSelectionTranslate);

declare global {
  interface HTMLElementTagNameMap {
    "tc-selection-translate": TcSelectionTranslate;
  }
}
