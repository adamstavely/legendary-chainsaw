import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";

/*
 * <tc-tag-input> – a field of free-text chips: keywords, labels, email domains. Type and press Enter, a comma or Tab
 * to add what you typed; pasting "a, b, c" adds three. `suggestions` opens a list under the field filtered by what's
 * typed (↑ ↓ and Enter pick one); with `allow-custom="false"` only suggestions can be added. Tags are unique (ignoring
 * case) unless `unique="false"`, `max` caps how many, and `validate` can refuse one with a reason – shown under the
 * field and sent as `tc-invalid-tag`. Backspace in the empty field marks the last chip and a second press removes it;
 * ← from the start of the text steps onto the chips, where ← → move and Delete or Backspace removes one.
 * Standard: the field in the gray tray, outlined chips. Clean: a white field, filled chips.
 *
 *   <tc-tag-input label="Keywords" name="keywords" .value=${["archives"]} .suggestions=${terms}></tc-tag-input>
 *
 * A form-associated element: each tag is submitted as its own entry under `name`, `required` needs at least one, and
 * a form reset brings back the first tags. Every change fires a cancelable `tc-value-change` ({ value, added,
 * removed }); preventDefault() keeps `value` under the page's control.
 */

export type TagInputValueChange = { value: string[]; added?: string[]; removed?: string[] };
export type TagInvalidReason = "duplicate" | "max" | "not-allowed" | "invalid";
export type TagInvalid = { text: string; reason: TagInvalidReason; message: string };
/** Returns why `text` can't be added (shown under the field), or nothing to accept it */
export type TagValidator = (text: string, value: string[]) => string | null | undefined | void;

/** Splits pasted or typed text into tags: commas and new lines separate them */
export const splitTags = (text: string) =>
  text
    .split(/[,\n\r]+/)
    .map((t) => t.trim())
    .filter(Boolean);

const glyph = (d: string) => html`<svg viewBox="0 0 24 24" class="ui-tgi__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const keepFocus = (e: Event) => e.preventDefault();
const boolDefaultTrue = { fromAttribute: (v: string | null) => v !== "false" };
let instances = 0;

/**
 * A field of free-text chips with suggestions, limits and validation.
 * @tag tc-tag-input
 * @fires tc-value-change - Tags were added or removed ({ value, added, removed }: TagInputValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-invalid-tag - A tag was refused ({ text, reason, message }: TagInvalid)
 */
export class TcTagInput extends TcElement {
  static override ui = "tgi";
  static formAssociated = true;

  /** The tags. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: string[] = [];
  /** Offered in a list under the field, filtered by what's typed */
  @property({ attribute: false }) accessor suggestions: string[] = [];
  /** Accept tags that aren't in `suggestions`; set allow-custom="false" to allow only suggestions */
  @property({ attribute: "allow-custom", converter: boolDefaultTrue }) accessor allowCustom = true;
  /** The most tags the field holds */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** Refuse a tag that's already there (ignoring case); set unique="false" to allow repeats */
  @property({ converter: boolDefaultTrue }) accessor unique = true;
  /** Checks a tag before it's added: return the reason it can't be, or nothing */
  @property({ attribute: false }) accessor validate: TagValidator | undefined = undefined;
  /** Visible label above the field (or use a page <label for>) */
  @property() accessor label = "";
  /** Text in the empty input */
  @property() accessor placeholder = "Add a tag…";
  /** Submitted with the form: one entry per tag */
  @property({ reflect: true }) accessor name = "";
  /** Can't be changed or focused; also disabled inside a disabled <fieldset> */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** At least one tag before the form submits */
  @property({ type: Boolean, reflect: true }) accessor required = false;
  /** Shows the field as invalid */
  @property({ type: Boolean, reflect: true }) accessor invalid = false;

  @state() private accessor draft = "";
  @state() private accessor armed = false;
  @state() private accessor error = "";
  @state() private accessor listOpen = false;
  @state() private accessor activeIndex = 0;
  @state() private accessor announce = "";
  @state() private accessor formDisabled = false;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-tgi${++instances}`;
  private initialValue: string[] | undefined = undefined;
  /** The suggestions shown in the last render */
  private shown: string[] = [];

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.addEventListener("click", (e) => {
      if (e.target === this) this.input?.focus();
    });
    this.addEventListener("focusout", (e) => {
      if (this.contains(e.relatedTarget as Node | null)) return;
      this.listOpen = false;
      this.armed = false;
    });
  }

  private get input() {
    return this.querySelector<HTMLInputElement>(".ui-tgi__input");
  }
  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  override focus(options?: FocusOptions) {
    this.input?.focus(options);
  }

  /* ---------- Adding and removing ---------- */

  private commit(next: string[], change: { added?: string[]; removed?: string[] }) {
    if (this.isDisabled) return false;
    if (!this.emit<TagInputValueChange>("tc-value-change", { value: next, ...change }, { cancelable: true })) return false;
    this.value = next;
    return true;
  }

  /** Why `text` can't join `list`, or "" */
  private refuse(text: string, list: string[]): { reason: TagInvalidReason; message: string } | null {
    const lower = text.toLowerCase();
    if (this.max !== undefined && list.length >= this.max) return { reason: "max", message: `You can add up to ${this.max} tag${this.max === 1 ? "" : "s"}.` };
    if (this.unique && list.some((t) => t.toLowerCase() === lower)) return { reason: "duplicate", message: `“${text}” is already added.` };
    if (!this.allowCustom && !this.suggestions.some((s) => s.toLowerCase() === lower)) return { reason: "not-allowed", message: `Pick “${text}” from the suggestions, or something else.` };
    const why = this.validate?.(text, list);
    if (why) return { reason: "invalid", message: why };
    return null;
  }

  /** Adds each text that passes; the first refusal is shown. Returns whether any were added */
  private addTexts(texts: string[]) {
    if (this.isDisabled) return false;
    const next = [...this.value];
    const added: string[] = [];
    let refused: TagInvalid | null = null;
    for (const raw of texts) {
      const typed = raw.trim();
      if (!typed) continue;
      // A suggestion typed in another case takes the suggestion's spelling
      const text = this.suggestions.find((s) => s.toLowerCase() === typed.toLowerCase()) ?? typed;
      const no = this.refuse(text, next);
      if (no) {
        const detail: TagInvalid = { text, ...no };
        this.emit<TagInvalid>("tc-invalid-tag", detail);
        refused ??= detail;
        continue;
      }
      next.push(text);
      added.push(text);
    }
    this.error = refused?.message ?? "";
    if (!added.length) {
      if (refused) this.announce = refused.message;
      return false;
    }
    if (!this.commit(next, { added })) return false;
    this.announce = `Added ${added.join(", ")}. ${next.length} tag${next.length === 1 ? "" : "s"}${refused ? `. ${refused.message}` : ""}`;
    return true;
  }

  private addDraft() {
    const text = this.draft.trim();
    if (!text) return false;
    // Only what was added leaves the input – a refused tag stays there to fix
    const ok = this.addTexts([text]);
    if (ok) this.draft = "";
    this.listOpen = false;
    return ok;
  }

  private removeAt(index: number, focusAfter: "chip" | "input" = "input") {
    const tag = this.value[index];
    if (tag === undefined || this.isDisabled) return;
    const next = this.value.filter((_, i) => i !== index);
    if (!this.commit(next, { removed: [tag] })) return;
    this.armed = false;
    this.error = "";
    this.announce = `Removed ${tag}. ${next.length} tag${next.length === 1 ? "" : "s"}`;
    void this.updateComplete.then(() => {
      if (focusAfter === "chip" && next.length) this.chipAt(Math.min(index, next.length - 1))?.focus();
      else this.input?.focus();
    });
  }

  private chipAt(i: number) {
    return this.querySelectorAll<HTMLElement>(".ui-tgi__chip-body")[i] ?? null;
  }

  /* ---------- Lifecycle ---------- */

  formResetCallback() {
    this.value = [...(this.initialValue ?? [])];
    this.draft = "";
    this.error = "";
  }
  formDisabledCallback(disabled: boolean) {
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!this.hasUpdated) this.initialValue = [...this.value];
    this.toggleAttribute("data-disabled", this.isDisabled);
    this.toggleAttribute("data-invalid", this.invalid || !!this.error);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.syncForm();
    this.labelInput();
    if (this.listOpen) this.querySelector(".ui-tgi__option[data-active]")?.scrollIntoView?.({ block: "nearest" });
  }

  private syncForm() {
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    if (this.name && !disabled && this.value.length) {
      const data = new FormData();
      for (const t of this.value) data.append(this.name, t);
      this.internals.setFormValue(data);
    } else this.internals.setFormValue(null);
    if (this.required && !disabled && !this.value.length) this.internals.setValidity({ valueMissing: true }, "Add at least one tag.", this.input ?? undefined);
    else this.internals.setValidity({});
  }

  private labelInput() {
    const input = this.input;
    if (!input || this.label) return;
    const labels = [...((this.internals.labels as NodeListOf<HTMLLabelElement> | undefined) ?? [])];
    if (!labels.length) return;
    labels.forEach((l, i) => (l.id ||= `${this.uid}-for${i}`));
    input.setAttribute("aria-labelledby", labels.map((l) => l.id).join(" "));
    input.removeAttribute("aria-label");
  }

  /* ---------- Keyboard ---------- */

  private onInputKey = (e: KeyboardEvent) => {
    if (e.isComposing || e.keyCode === 229) return;
    const input = e.target as HTMLInputElement;
    if (e.key !== "Backspace") this.armed = false;
    const open = this.listOpen && this.shown.length > 0;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!this.suggestions.length) return;
      e.preventDefault();
      if (!open) {
        this.listOpen = true;
        this.activeIndex = 0;
        return;
      }
      const n = this.shown.length;
      this.activeIndex = (this.activeIndex + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
    } else if (e.key === "Enter") {
      if (open && this.shown[this.activeIndex] !== undefined) {
        e.preventDefault();
        if (this.addTexts([this.shown[this.activeIndex]])) this.draft = "";
        this.listOpen = false;
      } else if (this.draft.trim()) {
        e.preventDefault();
        this.addDraft();
      }
    } else if (e.key === "," || (e.key === "Tab" && !e.shiftKey && this.draft.trim())) {
      e.preventDefault();
      this.addDraft();
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        this.listOpen = false;
      } else if (this.draft) {
        e.preventDefault();
        this.draft = "";
        this.error = "";
      }
    } else if (e.key === "Backspace" && !input.value && this.value.length) {
      e.preventDefault();
      if (this.armed) this.removeAt(this.value.length - 1);
      else {
        this.armed = true;
        this.announce = `${this.value[this.value.length - 1]} – press Backspace again to remove`;
      }
    } else if (e.key === "ArrowLeft" && input.selectionStart === 0 && input.selectionEnd === 0 && this.value.length) {
      e.preventDefault();
      this.chipAt(this.value.length - 1)?.focus();
    }
  };

  private onChipKey = (e: KeyboardEvent, index: number) => {
    if (e.key === "ArrowLeft") this.chipAt(Math.max(0, index - 1))?.focus();
    else if (e.key === "ArrowRight") {
      if (index >= this.value.length - 1) this.input?.focus();
      else this.chipAt(index + 1)?.focus();
    } else if (e.key === "Home") this.chipAt(0)?.focus();
    else if (e.key === "End") this.input?.focus();
    else if (e.key === "Delete" || e.key === "Backspace") this.removeAt(index, "chip");
    else return;
    e.preventDefault();
  };

  private onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData("text/plain") ?? "";
    if (!/[,\n\r]/.test(text)) return;
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const before = input.value.slice(0, input.selectionStart ?? input.value.length);
    const after = input.value.slice(input.selectionEnd ?? input.value.length);
    const parts = splitTags(before + text + after);
    // Text after the last separator stays in the input to keep typing
    const trailing = /[,\n\r]\s*$/.test(text + after) ? "" : (parts.pop() ?? "");
    this.addTexts(parts);
    this.draft = trailing;
  };

  /* ---------- Render ---------- */

  protected override render() {
    const disabled = this.isDisabled;
    const q = this.draft.trim().toLowerCase();
    const taken = new Set(this.value.map((t) => t.toLowerCase()));
    const shown = this.suggestions.filter((s) => (!q || s.toLowerCase().includes(q)) && !(this.unique && taken.has(s.toLowerCase()))).slice(0, 8);
    this.shown = shown;
    const open = this.listOpen && shown.length > 0 && !disabled;
    const active = Math.min(this.activeIndex, shown.length - 1);
    const listId = `${this.uid}-list`;
    const hasList = this.suggestions.length > 0;
    const full = this.max !== undefined && this.value.length >= this.max;
    const describedBy = [`${this.uid}-keys`, this.error ? `${this.uid}-error` : ""].filter(Boolean).join(" ");
    return html`
      ${this.label ? html`<label class="ui-tgi__label" id=${`${this.uid}-label`} for=${`${this.uid}-input`}>${this.label}</label>` : nothing}
      <div
        class="ui-tgi__field"
        @mousedown=${(e: MouseEvent) => {
          if (disabled || (e.target as HTMLElement).closest("button, input")) return;
          e.preventDefault();
          this.input?.focus();
        }}
      >
        ${this.value.length
          ? html`<ul class="ui-tgi__chips" aria-label=${this.label ? `${this.label}, added` : "Added tags"}>
              ${repeat(
                this.value,
                (t, i) => `${t}\u0000${i}`,
                (t, i) => html`<li class="ui-tgi__chip" ?data-armed=${this.armed && i === this.value.length - 1}>
                  <button type="button" class="ui-tgi__chip-body" tabindex="-1" ?disabled=${disabled} aria-describedby=${`${this.uid}-chipkeys`} @keydown=${(e: KeyboardEvent) => this.onChipKey(e, i)}>
                    <span class="ui-tgi__chip-label" title=${t}>${t}</span>
                  </button>
                  <button type="button" class="ui-tgi__x" tabindex="-1" ?disabled=${disabled} aria-label=${`Remove ${t}`} @mousedown=${keepFocus} @click=${() => this.removeAt(i)}>
                    ${glyph("M7 7l10 10M17 7 7 17")}
                  </button>
                </li>`,
              )}
            </ul>`
          : nothing}
        <input
          id=${`${this.uid}-input`}
          class="ui-tgi__input"
          .value=${live(this.draft)}
          placeholder=${ifDefined(full ? undefined : this.placeholder)}
          autocomplete="off"
          spellcheck="false"
          .enterKeyHint=${"done"}
          role=${ifDefined(hasList ? "combobox" : undefined)}
          aria-expanded=${ifDefined(hasList ? (open ? "true" : "false") : undefined)}
          aria-controls=${ifDefined(open ? listId : undefined)}
          aria-autocomplete=${ifDefined(hasList ? "list" : undefined)}
          aria-activedescendant=${ifDefined(open ? `${this.uid}-o${active}` : undefined)}
          aria-labelledby=${ifDefined(this.label ? `${this.uid}-label` : undefined)}
          aria-label=${ifDefined(this.label ? undefined : this.placeholder)}
          aria-describedby=${describedBy}
          aria-required=${ifDefined(this.required ? "true" : undefined)}
          aria-invalid=${ifDefined(this.invalid || this.error ? "true" : undefined)}
          ?disabled=${disabled}
          @input=${(e: Event) => {
            this.draft = (e.target as HTMLInputElement).value;
            this.armed = false;
            this.error = "";
            this.activeIndex = 0;
            this.listOpen = !!this.draft.trim();
          }}
          @keydown=${this.onInputKey}
          @paste=${this.onPaste}
          @blur=${() => (this.armed = false)}
        />
      </div>
      ${open
        ? html`<ul class="ui-tgi__pop" id=${listId} role="listbox" aria-label=${this.label ? `${this.label} suggestions` : "Suggestions"} @mousedown=${keepFocus}>
            ${shown.map(
              (s, i) => html`<li
                id=${`${this.uid}-o${i}`}
                class="ui-tgi__option"
                role="option"
                aria-selected=${i === active ? "true" : "false"}
                ?data-active=${i === active}
                @mousemove=${() => (this.activeIndex = i)}
                @click=${() => {
                  if (this.addTexts([s])) this.draft = "";
                  this.listOpen = false;
                  this.input?.focus();
                }}
              >
                ${this.mark(s, this.draft.trim())}
              </li>`,
            )}
          </ul>`
        : nothing}
      <p class="ui-tgi__error" id=${`${this.uid}-error`} ?hidden=${!this.error}>${this.error}</p>
      <span class="tc-sr-only" id=${`${this.uid}-keys`}>Press Enter or comma to add.${this.max !== undefined ? ` Up to ${this.max}.` : ""}</span>
      <span class="tc-sr-only" id=${`${this.uid}-chipkeys`}>Press Delete to remove.</span>
      <span class="tc-sr-only" role="status">${this.announce}</span>
    `;
  }

  private mark(text: string, query: string) {
    const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
    if (i < 0) return html`${text}`;
    return html`${text.slice(0, i)}<mark>${text.slice(i, i + query.length)}</mark>${text.slice(i + query.length)}`;
  }

  static override css = /* css */ `
[data-ui="tgi"] {
  position: relative;
  display: block;
  width: 100%;
  max-width: 440px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="tgi"] *, [data-ui="tgi"] *::before, [data-ui="tgi"] *::after { box-sizing: border-box; }
:where([data-ui="tgi"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="tgi"]) svg { display: block; flex: none; }
.ui-tgi__glyph { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.ui-tgi__label { display: block; font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-tgi__label { margin: 0 0 var(--tc-space-2) var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-tgi__label { margin: 0 0 var(--tc-space-1-5) var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-tgi__field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1);
  min-height: var(--tc-field-h);
  padding: var(--tc-space-1);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  cursor: text;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tgi__field:hover { box-shadow: var(--tc-field-shadow-hover); }
[data-ui="tgi"][data-invalid] .ui-tgi__field { box-shadow: var(--tc-field-shadow-invalid); }
[data-ui="tgi"] .ui-tgi__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-tgi__chips { display: contents; margin: 0; padding: 0; list-style: none; }
.ui-tgi__chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  height: calc(var(--tc-field-h) - var(--tc-space-2));
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-fill-default);
  animation: ui-tgi-pop var(--tc-duration-moderate) var(--tc-ease-spring) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tgi__chip { box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-tgi__chip { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-tgi__chip[data-armed] { background: var(--tc-fill-strong); box-shadow: inset 0 0 0 1px var(--tc-border-strong); }
.ui-tgi__chip-body { display: inline-flex; align-items: center; min-width: 0; height: 100%; padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); }
.ui-tgi__chip-body:focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring); outline-offset: 1px; }
.ui-tgi__chip-label { min-width: 0; max-width: 200px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* The ×: drawn small, a 24 × 24 target */
.ui-tgi__x { position: relative; display: grid; place-items: center; flex: none; width: 20px; height: 20px; margin-right: var(--tc-space-0-5); border-radius: var(--tc-radius-xs); color: var(--tc-icon-muted); }
.ui-tgi__x::after { content: ""; position: absolute; top: 50%; left: 50%; width: 24px; height: 24px; transform: translate(-50%, -50%); }
.ui-tgi__x:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
.ui-tgi__input {
  flex: 1 0 96px;
  min-width: 96px;
  height: calc(var(--tc-field-h) - var(--tc-space-2));
  margin: 0;
  padding: 0 var(--tc-space-1-5);
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
  outline: none;
}
.ui-tgi__input::placeholder { color: var(--tc-text-placeholder); }
.ui-tgi__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  left: 0;
  right: 0;
  max-height: 260px;
  margin: var(--tc-space-1-5) 0 0;
  padding: var(--tc-menu-padding);
  overflow-y: auto;
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  list-style: none;
  animation: ui-tgi-open var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-tgi__option { display: flex; align-items: center; min-height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); cursor: pointer; user-select: none; }
.ui-tgi__option[data-active] { background: var(--tc-menu-item-hover); }
[data-ui="tgi"] mark { border-radius: var(--tc-radius-2xs); background: var(--tc-accent-highlight); color: inherit; }
.ui-tgi__error { margin: var(--tc-space-1-5) 0 0 var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); }
.ui-tgi__error[hidden] { display: none; }
[data-ui="tgi"][data-disabled] .ui-tgi__field { background: var(--tc-fill-subtle); color: var(--tc-text-disabled); cursor: not-allowed; }
@keyframes ui-tgi-pop { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }
@keyframes ui-tgi-open { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@container (max-width: 380px) {
  .ui-tgi__chip-label { max-width: 132px; }
  .ui-tgi__input { flex-basis: 64px; min-width: 64px; }
}
@media (hover: none) and (pointer: coarse) {
  .ui-tgi__chip { height: 32px; }
  .ui-tgi__input { height: 32px; font-size: var(--tc-font-size-xl); }
  .ui-tgi__option { min-height: 44px; }
}
@media (forced-colors: active) {
  .ui-tgi__chip { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tgi"] *, [data-ui="tgi"] *::before, [data-ui="tgi"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-tag-input")) customElements.define("tc-tag-input", TcTagInput);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tag-input": TcTagInput;
  }
}
