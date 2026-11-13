import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-ghost-completion> – a text field that offers the rest of what you're writing as dimmed text after the caret.
 * The page supplies the suggestion: a `suggest(text, signal)` function, asked a moment after typing stops and
 * aborted as soon as typing starts again, or a `suggestion` property it sets itself. Tab takes the whole suggestion,
 * Ctrl/⌘ + → the next word, Escape dismisses it; typing the same letters as the suggestion uses them up instead of
 * asking again. A suggestion only shows while the caret is at the end of the text.
 * Standard: the header on a gray tray above a white card holding the field. Clean: one white card, the header its
 * first row.
 *
 * The suggestion is drawn by a mirror behind the textarea: the same font, padding and wrapping, with the typed text
 * hidden and the suggestion after it in a muted colour. Screen readers hear a new suggestion in a polite status
 * region – at most one every couple of seconds – and the keys from the field's description.
 *
 *   <tc-ghost-completion label="Finding" .suggest=${(text, signal) => api.complete(text, { signal })}></tc-ghost-completion>
 */

export type GhostCompletionSuggest = (text: string, signal: AbortSignal) => string | Promise<string>;
/** tc-value-change: the field's new text */
export type GhostCompletionValueChange = { value: string };
/** tc-accept: the text taken from the suggestion, and whether it was all of it */
export type GhostCompletionAccept = { text: string; whole: boolean };
/** tc-dismiss: the suggestion that was dismissed */
export type GhostCompletionDismiss = { text: string };

export type GhostCompletionLabels = {
  /** The key named in the hint */
  hintKey: string;
  /** The hint after the key */
  hint: string;
  /** Read with every new suggestion: "Suggestion: …" */
  suggestion: string;
  /** Shown in the header while a suggestion is on its way */
  loading: string;
  /** The field's description: what the keys do */
  keys: string;
};

export const defaultGhostCompletionLabels: GhostCompletionLabels = {
  hintKey: "Tab",
  hint: "to accept",
  suggestion: "Suggestion",
  loading: "Suggesting…",
  keys: "Suggestions appear after the cursor as you type. Tab accepts one, Control or Command with Right Arrow accepts its next word, Escape dismisses it.",
};

/** The next word of a suggestion, with the space before it */
export function nextWord(text: string) {
  return /^\s*\S+/.exec(text)?.[0] ?? text;
}

let uid = 0;

// The header icon: a text cursor with sparkle (Lucide "text-cursor-input" and "sparkles", ISC)
const ghostIcon = svg`<path d="M5 4h1a3 3 0 0 1 3 3 3 3 0 0 1 3-3h1"></path><path d="M13 20h-1a3 3 0 0 1-3-3 3 3 0 0 1-3 3H5"></path><path d="M9 7v10"></path><path d="M18 3v4"></path><path d="M20 5h-4"></path>`;

/**
 * A text field with dimmed AI suggestions after the caret – Tab accepts, Ctrl/⌘ + → takes a word, Escape dismisses.
 * @tag tc-ghost-completion
 * @fires tc-value-change - The text changed by typing or accepting ({ value }: GhostCompletionValueChange); cancelable – prevented, the field keeps its text
 * @fires tc-accept - Some or all of a suggestion was taken ({ text, whole }: GhostCompletionAccept)
 * @fires tc-dismiss - The suggestion was dismissed with Escape ({ text }: GhostCompletionDismiss)
 */
export class TcGhostCompletion extends TcElement {
  static override ui = "ghc";

  /** The heading */
  @property() accessor heading = "Draft";
  /** The field's visible label */
  @property() accessor label = "Message";
  /** The text in the field */
  @property() accessor value = "";
  /** Shown while the field is empty and there's no suggestion */
  @property() accessor placeholder = "";
  /** The field's height in lines */
  @property({ type: Number }) accessor rows = 4;
  /** A suggestion the page sets itself: the text to show after what's typed. Typing that matches it uses it up */
  @property() accessor suggestion = "";
  /** Asked for a suggestion a moment after typing stops; the signal aborts when typing starts again */
  @property({ attribute: false }) accessor suggest: GhostCompletionSuggest | undefined = undefined;
  /** How long typing must pause before `suggest` is asked, in ms */
  @property({ type: Number }) accessor debounce = 300;
  /** No editing and no suggestions */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Words the page can rename, merged over defaultGhostCompletionLabels */
  @property({ attribute: false }) accessor labels: Partial<GhostCompletionLabels> = {};

  /** @internal The suggestion showing now */
  @state() accessor ghost = "";
  /** @internal A suggestion is on its way */
  @state() accessor loading = false;
  /** @internal The hint shows until the first suggestion is taken or dismissed */
  @state() accessor hintDone = false;
  /** @internal What the status region says */
  @state() accessor announce = "";

  private uid = `tc-ghc-${++uid}`;
  private timer = 0;
  private controller: AbortController | null = null;
  private quiet = 0;
  private pending = "";

  private get field() {
    return this.querySelector<HTMLTextAreaElement>(".ui-ghc__input");
  }

  private get words(): GhostCompletionLabels {
    return { ...defaultGhostCompletionLabels, ...this.labels };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cancel();
    window.clearTimeout(this.quiet);
    this.quiet = 0;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("value") && changed.get("value") !== undefined) this.follow(changed.get("value") as string);
    if (changed.has("suggestion")) this.show(this.suggestion);
    if (changed.has("disabled") && this.disabled) this.clear();
  }

  /**
   * The text changed – typed, accepted, or set by the page. Letters that match the suggestion use it up; anything else
   * drops it. Typing in the field then asks for a new one once the suggestion is used up
   */
  private follow(before: string) {
    const added = this.value.startsWith(before) ? this.value.slice(before.length) : null;
    if (added && this.ghost.startsWith(added)) this.ghost = this.ghost.slice(added.length);
    else this.ghost = "";
    if (!this.ghost && this.field && document.activeElement === this.field) this.ask();
  }

  protected override updated() {
    this.syncScroll();
  }

  /** Puts focus in the field */
  override focus(options?: FocusOptions) {
    this.field?.focus(options);
  }

  /** Takes the suggestion – all of it, or its next word */
  accept(whole = true) {
    const ghost = this.ghost;
    if (!ghost) return;
    const text = whole ? ghost : nextWord(ghost);
    this.hintDone = true;
    // The new value uses the suggestion up as it arrives (follow) – here, or when the page passes it back
    if (!this.change(this.value + text)) return;
    this.emit<GhostCompletionAccept>("tc-accept", { text, whole: text === ghost });
    this.updateComplete.then(() => {
      const f = this.field;
      if (f) f.selectionStart = f.selectionEnd = f.value.length;
    });
  }

  /** Hides the suggestion until the next one */
  dismiss() {
    const text = this.ghost;
    this.clear();
    if (!text) return;
    this.hintDone = true;
    this.emit<GhostCompletionDismiss>("tc-dismiss", { text });
  }

  /** Reports a new value; false when the page kept the old one */
  private change(value: string) {
    if (!this.emit<GhostCompletionValueChange>("tc-value-change", { value }, { cancelable: true })) {
      // Prevented: the field goes back to the value the page kept
      this.requestUpdate();
      return false;
    }
    this.value = value;
    return true;
  }

  private clear() {
    this.cancel();
    this.ghost = "";
  }

  private cancel() {
    window.clearTimeout(this.timer);
    this.controller?.abort();
    this.controller = null;
    this.loading = false;
  }

  /** A new suggestion: shown, and read out – at most one every couple of seconds */
  private show(text: string) {
    this.ghost = text;
    if (!text) return;
    if (this.quiet) {
      this.pending = text;
      return;
    }
    this.announce = `${this.words.suggestion}: ${text.trim()}`;
    this.quiet = window.setTimeout(() => {
      this.quiet = 0;
      const next = this.pending;
      this.pending = "";
      if (next && next === this.ghost) this.show(next);
    }, 2000);
  }

  private atEnd() {
    const f = this.field;
    return !!f && f.selectionStart === f.value.length && f.selectionEnd === f.value.length;
  }

  /** Asks `suggest` a moment after typing stops */
  private ask() {
    this.cancel();
    const suggest = this.suggest;
    if (!suggest || this.disabled || !this.value.trim()) return;
    this.timer = window.setTimeout(async () => {
      const controller = new AbortController();
      this.controller = controller;
      const text = this.value;
      this.loading = true;
      try {
        const result = await suggest(text, controller.signal);
        if (controller.signal.aborted || text !== this.value || !this.atEnd()) return;
        this.show(result ?? "");
      } catch {
        // A failed or aborted suggestion just doesn't show
      } finally {
        if (this.controller === controller) {
          this.controller = null;
          this.loading = false;
        }
      }
    }, this.debounce);
  }

  private onInput(e: Event) {
    // The suggestion follows in willUpdate, here or once the page passes the text back
    this.change((e.target as HTMLTextAreaElement).value);
  }

  private onKeydown(e: KeyboardEvent) {
    if (e.isComposing || !this.ghost) return;
    if (e.key === "Tab" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.accept(true);
    } else if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey) && this.atEnd()) {
      e.preventDefault();
      this.accept(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.dismiss();
    }
  }

  /** Moving the caret off the end hides the suggestion */
  private onCaret = () => {
    if (this.ghost && !this.atEnd()) this.clear();
  };

  private syncScroll = () => {
    const f = this.field;
    const mirror = this.querySelector<HTMLElement>(".ui-ghc__mirror");
    if (f && mirror) mirror.scrollTop = f.scrollTop;
  };

  protected override render() {
    const w = this.words;
    const ghost = this.disabled ? "" : this.ghost;
    const hint = ghost && !this.hintDone;
    return html`
      ${cardHead({ icon: ghostIcon, title: this.heading, aside: this.loading ? html`<span class="ui-ghc__loading">${w.loading}</span>` : nothing })}
      <div class="ui-ghc__card">
        <label class="ui-ghc__label" for=${`${this.uid}-input`}>${this.label}</label>
        <div class="ui-ghc__field" style=${`--tc-ghc-rows: ${Math.max(1, this.rows)}`}>
          <div class="ui-ghc__mirror" aria-hidden="true"><span class="ui-ghc__typed">${this.value}</span><span class="ui-ghc__ghost">${ghost}</span></div>
          <textarea
            id=${`${this.uid}-input`}
            class="ui-ghc__input"
            rows=${this.rows}
            .value=${live(this.value)}
            placeholder=${ghost ? "" : this.placeholder}
            ?disabled=${this.disabled}
            aria-describedby=${`${this.uid}-keys`}
            spellcheck="true"
            @input=${this.onInput}
            @keydown=${this.onKeydown}
            @click=${this.onCaret}
            @keyup=${this.onCaret}
            @select=${this.onCaret}
            @scroll=${this.syncScroll}
            @blur=${() => this.clear()}
          ></textarea>
        </div>
        <p class="ui-ghc__hint" ?hidden=${!hint}><kbd class="ui-ghc__kbd">${w.hintKey}</kbd> ${w.hint}</p>
      </div>
      <span class="ui-ghc__sr" id=${`${this.uid}-keys`}>${w.keys}</span>
      <span class="ui-ghc__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="ghc"] {
  --tc-ghc-ghost: var(--tc-text-muted);
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  max-width: 560px;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  -webkit-font-smoothing: antialiased;
}
[data-ui="ghc"] *, [data-ui="ghc"] *::before, [data-ui="ghc"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ghc"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ghc__card {
  padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ghc"] {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ghc__card {
  padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
.ui-ghc__loading { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-ghc__label { display: block; margin-bottom: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
/* The field and its mirror share one grid cell, and every metric that decides where text wraps */
.ui-ghc__field {
  display: grid;
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ghc__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-ghc__field:has(.ui-ghc__input:focus-visible) { box-shadow: var(--tc-field-shadow-focus); }
.ui-ghc__mirror, .ui-ghc__input {
  grid-area: 1 / 1;
  margin: 0;
  padding: var(--tc-space-2-5) var(--tc-field-px);
  border: 0;
  font: inherit;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: normal;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: normal;
  tab-size: 4;
  scrollbar-gutter: stable;
  height: calc(var(--tc-ghc-rows) * 1lh + var(--tc-space-2-5) * 2);
}
.ui-ghc__mirror { overflow: hidden; pointer-events: none; }
.ui-ghc__typed { visibility: hidden; }
.ui-ghc__ghost { color: var(--tc-ghc-ghost); animation: ui-ghc-in var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ghc__input {
  position: relative;
  width: 100%;
  overflow-y: auto;
  resize: none;
  outline: none;
  background: transparent;
  color: var(--tc-text-primary);
  caret-color: var(--tc-accent);
}
.ui-ghc__input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
.ui-ghc__input:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-ghc__hint { display: flex; align-items: center; gap: var(--tc-space-1-5); margin: var(--tc-space-2) 0 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-ghc__hint[hidden] { display: none; }
.ui-ghc__kbd {
  display: inline-grid;
  place-items: center;
  min-width: 2.25em;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-badge);
  background: var(--tc-fill-default);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
  font: inherit;
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-secondary);
}
.ui-ghc__sr { position: absolute; width: 1px; height: 1px; margin: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes ui-ghc-in { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
.ui-ghc__ghost { animation: none; }
.ui-ghc__field { transition: none; }
}
@media (forced-colors: active) {
.ui-ghc__ghost { color: GrayText; }
}
[data-ui="ghc"] textarea:focus-visible { outline: none; }
`;
}

if (!customElements.get("tc-ghost-completion")) customElements.define("tc-ghost-completion", TcGhostCompletion);

declare global {
  interface HTMLElementTagNameMap {
    "tc-ghost-completion": TcGhostCompletion;
  }
}
