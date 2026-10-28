import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { HotkeyController } from "./internal/controllers";
import { isMac } from "./internal/util";

/*
 * <tc-ai-search> – one search box with two modes. In search mode it's a single-line field with suggestions – the
 * person's recent searches and suggested ones, filtered as they type – in a list below it. Switch on AI mode and the
 * field becomes a prompt of a few lines with example prompts to start from. Under the field: the AI mode switch and
 * "Search within file contents". Scopes the page sets show as chips inside the field, each removable, and a clear
 * button empties it.
 *   · search mode: ↓ / ↑ move through the suggestions, Enter searches for the one picked or for what's typed, Escape
 *     closes the list, then clears the field
 *   · AI mode: Enter asks, Shift+Enter starts a new line
 *   · ⌘K / Ctrl K focuses the field from anywhere – change it or turn it off with `hotkey`
 *   · every submit fires tc-submit ({ query, mode, contents, scopes }); the mode and contents switches fire cancelable
 *     changes, so the page can own them
 * Both looks are a field with the field recipe; Standard sets the suggestions in a menu on a tray, Clean in one menu.
 *
 *   <tc-ai-search .suggestions=${[{ label: "invoice 7741", kind: "recent" }]}></tc-ai-search>
 */

export type AiSearchMode = "search" | "ai";
export type AiSearchSuggestion = { label: string; kind?: "recent" | "suggested" };
export type AiSearchScope = { id: string; label: string };

/** Details of the events */
export type AiSearchSubmit = { query: string; mode: AiSearchMode; contents: boolean; scopes: string[] };
export type AiSearchModeChange = { mode: AiSearchMode };
export type AiSearchContentsChange = { contents: boolean };
export type AiSearchQueryChange = { query: string };
export type AiSearchScopeRemove = { id: string };

let uidCount = 0;

/* search, sparkles, x, arrow-up, clock, corner-down-left: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const searchIcon = () => lucide(16, svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`);
const sparkleIcon = (size = 16) =>
  lucide(size, svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>`);
const xIcon = (size = 14) => lucide(size, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const sendIcon = () => lucide(16, svg`<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>`);
const clockIcon = () => lucide(14, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`);

/** The keys of a combination as shown on key chips */
const comboKeys = (combo: string, mod: string) =>
  combo
    .split("+")
    .map((p) => p.trim().toLowerCase())
    .map((p) => (p === "mod" ? mod : p === "ctrl" || p === "control" ? "Ctrl" : p === "meta" || p === "cmd" ? "⌘" : p === "shift" ? "⇧" : p === "alt" || p === "option" ? "⌥" : p.toUpperCase()));

/**
 * A search box with an AI mode – suggestions in search mode, a multi-line prompt with examples in AI mode, a "Search
 * within file contents" switch, removable scope chips, Clear and a ⌘K hotkey.
 * @tag tc-ai-search
 * @fires tc-submit - A search or a question was sent ({ query, mode, contents, scopes }: AiSearchSubmit)
 * @fires tc-mode-change - AI mode was switched ({ mode }: AiSearchModeChange); cancelable – prevented, `mode` stays as it was
 * @fires tc-contents-change - "Search within file contents" was switched ({ contents }: AiSearchContentsChange); cancelable – prevented, `contents` stays as it was
 * @fires tc-query-change - The text changed ({ query }: AiSearchQueryChange); cancelable – prevented, `value` stays as it was
 * @fires tc-scope-remove - A scope chip was removed ({ id }: AiSearchScopeRemove); cancelable – prevented, `scopes` stays as it was
 */
export class TcAiSearch extends TcElement {
  static override ui = "aisr";

  /** The field's name for assistive tech */
  @property() accessor label = "Search";
  /** Search or AI mode. Changed by the user unless a tc-mode-change listener calls preventDefault() */
  @property({ reflect: true }) accessor mode: AiSearchMode = "search";
  /** Whether to search inside files as well as their names. Changed by the user unless tc-contents-change is prevented */
  @property({ type: Boolean, reflect: true }) accessor contents = false;
  /** The text in the field */
  @property() accessor value = "";
  /** The hint in search mode */
  @property() accessor placeholder = "Search files, people and topics";
  /** The hint in AI mode */
  @property({ attribute: "ai-placeholder" }) accessor aiPlaceholder = "Ask a question about your files";
  /** Recent and suggested searches, shown in search mode and filtered by what's typed */
  @property({ attribute: false }) accessor suggestions: AiSearchSuggestion[] = [];
  /** Prompts to start from in AI mode */
  @property({ attribute: false }) accessor examples: string[] = [];
  /** Where the search looks, as chips inside the field; removable */
  @property({ attribute: false }) accessor scopes: AiSearchScope[] = [];
  /** The AI mode switch's label */
  @property({ attribute: "ai-label" }) accessor aiLabel = "AI mode";
  /** The contents switch's label */
  @property({ attribute: "contents-label" }) accessor contentsLabel = "Search within file contents";
  /** Focuses the field from anywhere ("mod+k" is ⌘K on Apple keyboards, Ctrl K elsewhere); false turns it off */
  @property({ attribute: false }) accessor hotkey: string | false = "mod+k";

  @state() private accessor open = false;
  @state() private accessor activeIndex = -1;
  @state() private accessor focused = false;
  @state() private accessor announce = "";

  private uid = `tc-aisr-${++uidCount}`;

  constructor() {
    super();
    new HotkeyController(
      this,
      () => this.isConnected && this.hotkey,
      () => {
        const f = this.field;
        f?.focus();
        if (f instanceof HTMLInputElement) f.select();
      },
    );
  }

  private get field() {
    return this.querySelector<HTMLInputElement | HTMLTextAreaElement>(".ui-aisr__input");
  }

  /* ---------- The model ---------- */

  /** The suggestions that fit what's typed: recent first, at most eight */
  private get options() {
    const q = this.value.trim().toLowerCase();
    const fit = this.suggestions.filter((s) => !q || s.label.toLowerCase().includes(q));
    return [...fit.filter((s) => (s.kind ?? "suggested") === "recent"), ...fit.filter((s) => (s.kind ?? "suggested") !== "recent")].slice(0, 8);
  }
  private get listShown() {
    return this.mode === "search" && this.open && this.options.length > 0;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("mode") && this.mode !== "search") this.open = false;
    if (this.activeIndex > this.options.length - 1) this.activeIndex = -1;
  }

  /* ---------- Actions ---------- */

  private setValue(query: string) {
    // Prevented, the field shows `value` again
    if (!this.emit<AiSearchQueryChange>("tc-query-change", { query }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.value = query;
  }
  private submit(query = this.value) {
    const q = query.trim();
    if (!q) return;
    this.open = false;
    this.activeIndex = -1;
    this.emit<AiSearchSubmit>("tc-submit", { query: q, mode: this.mode, contents: this.contents, scopes: this.scopes.map((s) => s.id) });
    this.announce = this.mode === "ai" ? "Question sent" : `Searching for ${q}`;
  }
  private toggleMode() {
    const mode: AiSearchMode = this.mode === "ai" ? "search" : "ai";
    if (!this.emit<AiSearchModeChange>("tc-mode-change", { mode }, { cancelable: true })) return;
    this.mode = mode;
    this.announce = mode === "ai" ? "AI mode on" : "AI mode off";
  }
  private toggleContents() {
    const contents = !this.contents;
    if (!this.emit<AiSearchContentsChange>("tc-contents-change", { contents }, { cancelable: true })) {
      // Controlled: the checkbox shows the property again
      this.requestUpdate();
      return;
    }
    this.contents = contents;
  }
  private removeScope(s: AiSearchScope) {
    if (!this.emit<AiSearchScopeRemove>("tc-scope-remove", { id: s.id }, { cancelable: true })) return;
    this.scopes = this.scopes.filter((x) => x.id !== s.id);
    this.announce = `${s.label} removed`;
    void this.updateComplete.then(() => this.field?.focus());
  }
  private clear() {
    this.setValue("");
    this.activeIndex = -1;
    this.field?.focus();
  }

  /* ---------- Keyboard ---------- */

  private onKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    if (this.mode === "ai") {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.submit();
      }
      return;
    }
    const opts = this.options;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!opts.length) return;
      e.preventDefault();
      if (!this.open) {
        this.open = true;
        this.activeIndex = e.key === "ArrowDown" ? 0 : opts.length - 1;
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      this.activeIndex = (this.activeIndex + step + opts.length) % opts.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = this.listShown && this.activeIndex >= 0 ? opts[this.activeIndex] : undefined;
      if (picked) this.setValue(picked.label);
      this.submit(picked?.label);
    } else if (e.key === "Escape") {
      if (this.listShown) {
        e.preventDefault();
        this.open = false;
        this.activeIndex = -1;
      } else if (this.value) {
        e.preventDefault();
        this.clear();
      }
    }
  };

  /* ---------- Rendering ---------- */

  private renderList() {
    if (!this.listShown) return nothing;
    const opts = this.options;
    const id = this.uid;
    const recent = opts.filter((o) => (o.kind ?? "suggested") === "recent");
    const suggested = opts.filter((o) => (o.kind ?? "suggested") !== "recent");
    const option = (o: AiSearchSuggestion, i: number) => html`<li
      role="option"
      id=${`${id}-opt-${i}`}
      class="ui-aisr__option"
      aria-selected=${i === this.activeIndex ? "true" : "false"}
      @pointerdown=${(e: PointerEvent) => e.preventDefault()}
      @pointermove=${() => (this.activeIndex = i)}
      @click=${() => {
        this.setValue(o.label);
        this.submit(o.label);
      }}
    ><span class="ui-aisr__option-icon" aria-hidden="true">${(o.kind ?? "suggested") === "recent" ? clockIcon() : searchIcon()}</span><span class="ui-aisr__option-label">${o.label}</span></li>`;
    return html`<div class="ui-aisr__pop">
      <div class="ui-aisr__menu">
        <ul class="ui-aisr__list" id=${`${id}-list`} role="listbox" aria-label="Suggestions">
          ${recent.length
            ? html`<li role="presentation" class="ui-aisr__group" aria-hidden="true">Recent</li>
                ${recent.map((o, i) => option(o, i))}`
            : nothing}
          ${suggested.length
            ? html`<li role="presentation" class="ui-aisr__group" aria-hidden="true">Suggested</li>
                ${suggested.map((o, i) => option(o, recent.length + i))}`
            : nothing}
        </ul>
      </div>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const ai = this.mode === "ai";
    const hotkey = this.hotkey;
    const showKeys = !!hotkey && !this.focused && !this.value;
    const active = this.listShown && this.activeIndex >= 0 ? `${id}-opt-${this.activeIndex}` : undefined;
    const onInput = (e: Event) => {
      this.setValue((e.target as HTMLInputElement | HTMLTextAreaElement).value);
      if (!ai) {
        this.open = true;
        this.activeIndex = -1;
      }
    };
    const common = {
      focus: () => {
        this.focused = true;
        if (!ai) this.open = true;
      },
      blur: () => {
        this.focused = false;
        this.open = false;
        this.activeIndex = -1;
      },
    };
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <div class="ui-aisr__box" ?data-ai=${ai}>
        <div class="ui-aisr__field">
          <span class="ui-aisr__lead" aria-hidden="true">${ai ? sparkleIcon() : searchIcon()}</span>
          ${this.scopes.length
            ? html`<span class="ui-aisr__scopes" role="group" aria-label="Scopes">
                ${this.scopes.map(
                  (s) => html`<span class="ui-aisr__scope">${s.label}<button type="button" class="ui-aisr__scope-x" aria-label=${`Remove ${s.label}`} @click=${() => this.removeScope(s)}>${xIcon(12)}</button></span>`,
                )}
              </span>`
            : nothing}
          ${ai
            ? html`<textarea
                class="ui-aisr__input"
                rows="3"
                aria-label=${`${this.label}, ${this.aiLabel}`}
                placeholder=${this.aiPlaceholder}
                .value=${live(this.value)}
                @input=${onInput}
                @keydown=${this.onKey}
                @focus=${common.focus}
                @blur=${common.blur}
              ></textarea>`
            : html`<input
                class="ui-aisr__input"
                type="text"
                role="combobox"
                autocomplete="off"
                .enterKeyHint=${"search"}
                aria-label=${this.label}
                aria-autocomplete="list"
                aria-expanded=${this.listShown ? "true" : "false"}
                aria-controls=${`${id}-list`}
                aria-activedescendant=${ifDefined(active)}
                placeholder=${this.placeholder}
                .value=${live(this.value)}
                @input=${onInput}
                @keydown=${this.onKey}
                @focus=${common.focus}
                @blur=${common.blur}
              />`}
          <span class="ui-aisr__trail">
            ${showKeys && hotkey ? html`<span class="ui-aisr__keys" aria-hidden="true">${comboKeys(hotkey, isMac() ? "⌘" : "Ctrl").map((k) => html`<kbd>${k}</kbd>`)}</span>` : nothing}
            ${this.value ? html`<button type="button" class="ui-aisr__clear" aria-label="Clear" @click=${() => this.clear()}>${xIcon()}</button>` : nothing}
            <button type="button" class="ui-aisr__send" aria-label=${ai ? "Ask" : "Search"} ?disabled=${!this.value.trim()} @click=${() => this.submit()}>${sendIcon()}</button>
          </span>
        </div>
        ${this.renderList()}
      </div>
      ${ai && this.examples.length
        ? html`<div class="ui-aisr__examples" role="group" aria-label="Example prompts">
            ${this.examples.map(
              (x) => html`<button
                type="button"
                class="ui-aisr__example"
                @click=${() => {
                  this.setValue(x);
                  void this.updateComplete.then(() => this.field?.focus());
                }}
              >${sparkleIcon(12)}${x}</button>`,
            )}
          </div>`
        : nothing}
      <div class="ui-aisr__opts">
        <button type="button" role="switch" class="ui-aisr__switch" aria-checked=${ai ? "true" : "false"} @click=${() => this.toggleMode()}>
          <span class="ui-aisr__track" aria-hidden="true"><span class="ui-aisr__knob"></span></span>
          ${this.aiLabel}
        </button>
        <label class="ui-aisr__check">
          <input type="checkbox" .checked=${live(this.contents)} @change=${() => this.toggleContents()} />
          ${this.contentsLabel}
        </label>
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="aisr"] {
  position: relative;
  box-sizing: border-box;
  display: grid;
  gap: var(--tc-space-2);
  width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="aisr"] *, [data-ui="aisr"] *::before, [data-ui="aisr"] *::after { box-sizing: border-box; }
:where([data-ui="aisr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="aisr"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="aisr"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="aisr"] svg { display: block; flex: none; }
/* ----- The field: lead icon, scopes, the input or prompt, then keys, Clear and Send ----- */
.ui-aisr__box { position: relative; }
.ui-aisr__field { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-field-h); padding: 0 var(--tc-space-1) 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aisr__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-aisr__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-aisr__box[data-ai] .ui-aisr__field { align-items: flex-start; padding-top: var(--tc-space-2); padding-bottom: var(--tc-space-1); }
.ui-aisr__lead { display: grid; place-items: center; color: var(--tc-icon-muted); }
.ui-aisr__box[data-ai] .ui-aisr__lead { padding-top: var(--tc-space-0-5); color: var(--tc-tone-violet-fg); }
.ui-aisr__input { flex: 1; min-width: 0; height: var(--tc-field-h); padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); outline: none; resize: none; }
textarea.ui-aisr__input { height: auto; min-height: calc(3 * var(--tc-line-height-normal) * 1em); line-height: var(--tc-line-height-normal); field-sizing: content; max-height: 12em; }
.ui-aisr__input::placeholder { color: var(--tc-text-placeholder); }
.ui-aisr__scopes { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-aisr__scope { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: var(--tc-pill-h); padding: 0 var(--tc-space-0-5) 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-aisr__scope-x { display: grid; place-items: center; width: var(--tc-space-4); height: var(--tc-space-4); border-radius: var(--tc-radius-full); color: var(--tc-icon-muted); }
.ui-aisr__scope-x:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
.ui-aisr__trail { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); }
.ui-aisr__box[data-ai] .ui-aisr__trail { align-self: flex-end; }
.ui-aisr__keys { display: inline-flex; gap: var(--tc-space-0-5); margin-right: var(--tc-space-1); }
.ui-aisr__keys kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); color: var(--tc-kbd-fg); }
.ui-aisr__clear { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-aisr__clear:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-aisr__send { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aisr__send:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-aisr__send:disabled { opacity: 0.35; cursor: not-allowed; }
/* ----- Suggestions: a menu below the field ----- */
.ui-aisr__pop { position: absolute; z-index: var(--tc-z-dropdown); top: calc(100% + var(--tc-space-1-5)); left: 0; right: 0; box-shadow: var(--tc-menu-shadow); animation: ui-aisr-open var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-aisr__pop { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-aisr__menu { overflow: hidden; border-radius: calc(var(--tc-tray-radius) - var(--tc-tray-inset)); background: var(--tc-menu-bg); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-aisr__pop { overflow: hidden; border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); }
.ui-aisr__list { max-height: 320px; padding: var(--tc-menu-padding); overflow-y: auto; overscroll-behavior: contain; }
.ui-aisr__group { padding: var(--tc-space-1-5) var(--tc-menu-item-px) var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-aisr__option { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); color: var(--tc-text-primary); cursor: pointer; }
.ui-aisr__option[aria-selected="true"] { background: var(--tc-menu-item-hover); }
.ui-aisr__option-icon { color: var(--tc-icon-muted); }
.ui-aisr__option-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* ----- Examples, then the switches ----- */
.ui-aisr__examples { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-aisr__example { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aisr__example:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-aisr__example svg { color: var(--tc-tone-violet-fg); }
.ui-aisr__opts { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-5); font-size: var(--tc-font-size-sm); }
.ui-aisr__switch { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); color: var(--tc-text-secondary); }
.ui-aisr__track { position: relative; display: block; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aisr__knob { position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: var(--tc-radius-full); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-aisr__switch[aria-checked="true"] .ui-aisr__track { background: var(--tc-switch-on); }
.ui-aisr__switch[aria-checked="true"] .ui-aisr__knob { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-aisr__switch[aria-checked="true"] { color: var(--tc-text-primary); }
.ui-aisr__check { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); color: var(--tc-text-secondary); cursor: pointer; }
.ui-aisr__check input { width: var(--tc-space-4); height: var(--tc-space-4); margin: 0; accent-color: var(--tc-accent); cursor: pointer; }
.ui-aisr__check input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@keyframes ui-aisr-open { from { opacity: 0; transform: translateY(-2px) scale(0.99); } }
@media (forced-colors: active) {
  .ui-aisr__option[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-aisr__track { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="aisr"] *, [data-ui="aisr"] *::before, [data-ui="aisr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-ai-search")) customElements.define("tc-ai-search", TcAiSearch);

declare global {
  interface HTMLElementTagNameMap {
    "tc-ai-search": TcAiSearch;
  }
}
