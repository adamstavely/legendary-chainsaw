import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";

/*
 * <tc-select> – a plain single-choice dropdown: a button showing the chosen option and a chevron, sized like a
 * secondary button so it sits in a page header beside <tc-button>s, opening a listbox of options under it.
 *   · each option is a label with an optional description line; the chosen one carries a check
 *   · ↓ / ↑ on the trigger open the list; in it the arrows, Home and End move (past disabled options), Enter or
 *     Space picks, typing jumps to the next option starting with those letters, Esc closes and returns focus to the
 *     trigger, Tab closes. A press outside closes it too
 *   · near the edge of the screen the list slides in to stay whole
 *
 *   <tc-select label="Period" value="month" .options=${[{ value: "month", label: "This month" }, { value: "last", label: "Last month" }]}></tc-select>
 *
 * `label` names the control: shown above the trigger with `label-visible`, else read by screen readers only.
 * `label-placement="start"` puts the visible label before the trigger on one line instead, as a small caption.
 * Every pick fires a cancelable `tc-value-change` ({ value }): call preventDefault() to keep control of `value`.
 * Standard and Clean differ in the control's and the menu's own tokens only: the same trigger, list and keys.
 */

export type SelectOption = {
  /** What `value` holds when this option is chosen */
  value: string;
  /** The option's text, in the list and on the trigger */
  label: string;
  /** One short line under the label, in the list only */
  description?: string;
  /** Shown but can't be picked; the keys skip it */
  disabled?: boolean;
};

export type SelectValueChange = { value: string };
export type SelectValueChangeEvent = CustomEvent<SelectValueChange>;
export type SelectOpenChange = { open: boolean };
export type SelectOpenChangeEvent = CustomEvent<SelectOpenChange>;

const chevronIcon = html`<svg class="ui-select__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<path d="m3 4.5 3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const checkIcon = html`<svg class="ui-select__check" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">${svg`<path d="m3.4 7.3 2.4 2.4 4.8-5.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;

/** Letters typed within this long of each other make one search */
const TYPE_AHEAD_MS = 600;

let uid = 0;

/**
 * A single-choice dropdown: a secondary-button trigger that opens a listbox of options.
 * @tag tc-select
 * @fires tc-value-change - An option was picked (`{ value: string }`: SelectValueChange); cancelable – prevent it to keep `value` (controlled use)
 * @fires tc-open-change - The list opens or closes (`{ open: boolean }`: SelectOpenChange); cancelable
 */
export class TcSelect extends TcElement {
  static override ui = "select";

  /** The options, in list order */
  @property({ attribute: false }) accessor options: SelectOption[] = [];
  /** The chosen option's value – unset or unknown shows the placeholder */
  @property() accessor value = "";
  /** The control's accessible name; shown above the trigger with `label-visible` */
  @property() accessor label = "";
  /** Show `label` above the trigger instead of only to screen readers */
  @property({ type: Boolean, attribute: "label-visible" }) accessor labelVisible = false;
  /** Where the visible label sits, with `label-visible` only: "top", above the trigger (default), or "start", before it on the same line in the caption style. Without `label-visible` it changes nothing */
  @property({ attribute: "label-placement" }) accessor labelPlacement: "top" | "start" = "top";
  /** What the trigger says while no option is chosen */
  @property() accessor placeholder = "Choose…";
  /** Whether the list is open */
  @property({ type: Boolean }) accessor open = false;
  /** Which edge of the trigger the list lines up with */
  @property() accessor align: "start" | "end" = "start";
  /** Turns the control off; the hidden form input is disabled too */
  @property({ type: Boolean }) accessor disabled = false;
  /** Submits the chosen value with a native form, through a hidden input */
  @property() accessor name: string | undefined = undefined;

  /** @internal The option the arrows (or the pointer) are on */
  @state() accessor active = -1;
  /** @internal The arrows or typing moved the active option – it then carries the focus ring */
  @state() accessor keyed = false;
  /** @internal How far the list slides in to stay whole near the edge of the screen */
  @state() accessor shift = 0;

  private uid = `tc-select-${++uid}`;
  private typed = "";
  private typedAt = -Infinity;

  private onDocDown = (e: PointerEvent) => {
    if (!this.contains(e.target as Node)) this.setOpen(false);
  };
  private measureShift = () => {
    const trigger = this.querySelector(".ui-select__trigger")?.getBoundingClientRect();
    const width = this.querySelector<HTMLElement>(".ui-select__pop")?.offsetWidth ?? 0;
    if (!trigger || !width) return;
    const room = document.documentElement.clientWidth;
    const left = this.align === "end" ? trigger.right - width : trigger.left;
    const margin = 12;
    this.shift = left < margin ? margin - left : left + width > room - margin ? Math.min(0, room - margin - (left + width)) : 0;
  };

  constructor() {
    super();
    this.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !this.open) return;
      e.stopPropagation();
      this.setOpen(false, "trigger");
    });
    this.addEventListener("focusout", (e) => {
      if (this.open && e.relatedTarget && !this.contains(e.relatedTarget as Node)) this.setOpen(false);
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.onDocDown);
    window.removeEventListener("resize", this.measureShift);
  }

  /* ---------- Derived ---------- */

  private get chosenIndex() {
    return this.options.findIndex((o) => o.value === this.value);
  }
  /** Where the list starts: the chosen option if it can be picked, else the first that can */
  private get startIndex() {
    const i = this.chosenIndex;
    return i >= 0 && !this.options[i].disabled ? i : this.options.findIndex((o) => !o.disabled);
  }

  /* ---------- Changing things ---------- */

  private setOpen(next: boolean, focus?: "list" | "trigger") {
    if (next && this.disabled) return;
    if (next !== this.open) {
      if (next) {
        this.active = this.startIndex;
        this.keyed = false;
      }
      if (this.emit<SelectOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
    }
    // Focus only moves for people – a page opening the list through `open` leaves the focus where it is
    if (focus === "list" && this.open) requestAnimationFrame(() => this.querySelector<HTMLElement>(".ui-select__list")?.focus({ preventScroll: true }));
    if (focus === "trigger") this.querySelector<HTMLElement>(".ui-select__trigger")?.focus({ preventScroll: true });
  }

  private pick(index: number) {
    const o = this.options[index];
    if (!o || o.disabled) return;
    if (o.value !== this.value && this.emit<SelectValueChange>("tc-value-change", { value: o.value }, { cancelable: true })) this.value = o.value;
    this.setOpen(false, this.contains(document.activeElement) ? "trigger" : undefined);
  }

  /** The next option that can be picked from `from`, stepping by `step` (wrapping round); -1 when none can */
  private step(from: number, step: 1 | -1) {
    const n = this.options.length;
    for (let k = 1; k <= n; k++) {
      const i = (((from + step * k) % n) + n) % n;
      if (!this.options[i].disabled) return i;
    }
    return -1;
  }

  /* ---------- Keyboard ---------- */

  private onTriggerKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.setOpen(true, "list");
    }
  };

  private onListKey = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      // Focus moves on as usual; the list closes behind it
      this.setOpen(false);
      return;
    }
    if (!this.options.length) return;
    const move = (to: number) => {
      e.preventDefault();
      if (to < 0) return;
      this.active = to;
      this.keyed = true;
    };
    const last = this.options.length;
    if (e.key === "ArrowDown") move(this.step(this.active < 0 ? -1 : this.active, 1));
    else if (e.key === "ArrowUp") move(this.step(this.active < 0 ? last : this.active, -1));
    else if (e.key === "Home") move(this.step(-1, 1));
    else if (e.key === "End") move(this.step(last, -1));
    // Space picks, unless it's part of a name being typed
    else if (e.key === "Enter" || (e.key === " " && !(this.typed && e.timeStamp - this.typedAt <= TYPE_AHEAD_MS))) {
      e.preventDefault();
      this.pick(this.active);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) this.typeAhead(e);
  };

  /** Letters jump to the next option starting with them; more letters typed quickly narrow the search */
  private typeAhead(e: KeyboardEvent) {
    e.preventDefault();
    if (e.timeStamp - this.typedAt > TYPE_AHEAD_MS) this.typed = "";
    this.typedAt = e.timeStamp;
    const char = e.key.toLowerCase();
    // The same letter again cycles through the options starting with it
    const repeat = this.typed.length > 0 && [...this.typed].every((c) => c === char);
    this.typed += char;
    const search = repeat ? char : this.typed;
    const n = this.options.length;
    const from = this.active < 0 ? -1 : this.active;
    // A longer search may stay on the active option; a new letter starts after it
    const start = search.length > 1 ? 0 : 1;
    for (let k = start; k < n + start; k++) {
      const i = (((from + k) % n) + n) % n;
      const o = this.options[i];
      if (!o.disabled && o.label.trim().toLowerCase().startsWith(search)) {
        this.active = i;
        this.keyed = true;
        return;
      }
    }
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The page may open the list itself – start on the chosen option
    if (changed.has("open") && this.open && !changed.get("open")) {
      this.active = this.startIndex;
      this.keyed = false;
    }
    if (changed.has("disabled") && this.disabled && this.open) this.open = false;
    if (changed.has("open") && !this.open) this.typed = "";
    this.toggleAttribute("data-open", this.open);
    this.toggleAttribute("data-disabled", this.disabled);
    this.dataset.align = this.align;
    this.toggleAttribute("data-label-start", this.labelVisible && !!this.label && this.labelPlacement === "start");
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has("open")) {
      if (this.open) {
        document.addEventListener("pointerdown", this.onDocDown);
        window.addEventListener("resize", this.measureShift);
      } else {
        document.removeEventListener("pointerdown", this.onDocDown);
        window.removeEventListener("resize", this.measureShift);
      }
    }
    if (this.open && (changed.has("open") || changed.has("align") || changed.has("options"))) this.measureShift();
    if (this.open && this.keyed && changed.has("active")) this.querySelector(`#${this.uid}-opt-${this.active}`)?.scrollIntoView({ block: "nearest" });
  }

  /* ---------- Rendering ---------- */

  private row(o: SelectOption, i: number) {
    const chosen = i === this.chosenIndex;
    // Option ids come from the position, never from option values (user data)
    return html`<div
      id=${`${this.uid}-opt-${i}`}
      role="option"
      class="ui-select__option"
      aria-selected=${chosen ? "true" : "false"}
      aria-disabled=${ifDefined(o.disabled ? "true" : undefined)}
      ?data-active=${i === this.active}
      @pointerenter=${(e: PointerEvent) => {
        if (e.pointerType !== "mouse" || o.disabled) return;
        this.active = i;
        this.keyed = false;
      }}
      @click=${() => this.pick(i)}
    >
      <span class="ui-select__text">
        <span class="ui-select__option-label">${o.label}</span>
        ${o.description ? html`<span class="ui-select__desc">${o.description}</span>` : nothing}
      </span>
      <span class="ui-select__mark">${chosen ? checkIcon : nothing}</span>
    </div>`;
  }

  protected override render() {
    const chosen = this.options[this.chosenIndex];
    const activeId = this.options[this.active] ? `${this.uid}-opt-${this.active}` : undefined;
    const showLabel = this.labelVisible && !!this.label;
    return html`
      ${showLabel ? html`<label class="ui-select__label" id=${`${this.uid}-label`} for=${`${this.uid}-trigger`}>${this.label}</label>` : nothing}
      <button
        type="button"
        id=${`${this.uid}-trigger`}
        class="ui-select__trigger"
        aria-haspopup="listbox"
        aria-expanded=${this.open ? "true" : "false"}
        aria-controls=${`${this.uid}-list`}
        aria-labelledby=${ifDefined(showLabel ? `${this.uid}-label ${this.uid}-value` : undefined)}
        ?disabled=${this.disabled}
        @click=${() => this.setOpen(!this.open, this.open ? undefined : "list")}
        @keydown=${this.onTriggerKey}
      >
        ${this.label && !showLabel ? html`<span class="ui-select__sr">${this.label}: </span>` : nothing}
        <span class="ui-select__value" id=${`${this.uid}-value`} ?data-placeholder=${!chosen}>${chosen?.label ?? this.placeholder}</span>
        ${chevronIcon}
      </button>
      <div class="ui-select__pop" style=${styleMap(this.shift ? { translate: `${this.shift}px 0` } : {})} .inert=${!this.open}>
        <div
          id=${`${this.uid}-list`}
          class="ui-select__list"
          role="listbox"
          tabindex="0"
          aria-label=${ifDefined(showLabel ? undefined : this.label || "Options")}
          aria-labelledby=${ifDefined(showLabel ? `${this.uid}-label` : undefined)}
          aria-activedescendant=${ifDefined(this.open ? activeId : undefined)}
          ?data-keyed=${this.keyed}
          @keydown=${this.onListKey}
        >
          ${this.options.map((o, i) => this.row(o, i))}
        </div>
      </div>
      ${this.name !== undefined ? html`<input type="hidden" name=${this.name} .value=${chosen?.value ?? ""} ?disabled=${this.disabled} />` : nothing}
    `;
  }

  static override css = /* css */ `

[data-ui="select"] {
  position: relative;
  display: inline-block;
  max-width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  vertical-align: middle;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="select"] *, [data-ui="select"] *::before, [data-ui="select"] *::after { box-sizing: border-box; }
[data-ui="select"] svg { display: block; flex: none; }
.ui-select__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- Label: above the trigger, as the fields' labels are ----- */
.ui-select__label { display: block; font-weight: var(--tc-font-weight-medium); cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-select__label { margin: 0 0 var(--tc-space-2) var(--tc-space-0-5); font-size: var(--tc-font-size-md); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-select__label { margin: 0 0 var(--tc-space-1-5) var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
/* ----- Label at the start: on the trigger's line, vertically centred, as a caption; the list stays under the trigger ----- */
[data-ui="select"][data-label-start] { display: inline-grid; grid-template-columns: auto minmax(0, auto); align-items: center; column-gap: var(--tc-space-2); }
[data-ui="select"][data-label-start] .ui-select__label { grid-column: 1; grid-row: 1; margin: 0; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); white-space: nowrap; }
[data-ui="select"][data-label-start] .ui-select__trigger { grid-column: 2; grid-row: 1; }
[data-ui="select"][data-label-start] .ui-select__pop { grid-column: 2; grid-row: 1; }
/* ----- Trigger: a secondary button – the chosen label and a chevron ----- */
.ui-select__trigger {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  max-width: 100%;
  height: var(--tc-control-h-md);
  margin: 0;
  padding: 0 calc(var(--tc-control-px-md) - var(--tc-space-0-5)) 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font: var(--tc-control-font-weight) var(--tc-control-font-size) / var(--tc-line-height-normal) var(--tc-font-sans);
  color: var(--tc-action-secondary-fg);
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-select__trigger { letter-spacing: var(--tc-tracking-snug); }
.ui-select__trigger:hover:not(:disabled), [data-ui="select"][data-open] .ui-select__trigger { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-select__trigger:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-select__trigger:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-select__value { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-select__value[data-placeholder] { color: var(--tc-text-placeholder); }
.ui-select__trigger:disabled .ui-select__value { color: var(--tc-text-disabled); }
.ui-select__chevron { color: var(--tc-icon-muted); transition: transform var(--tc-duration-slow) var(--tc-ease-emphasized); }
.ui-select__trigger:disabled .ui-select__chevron { color: var(--tc-text-disabled); }
[data-ui="select"][data-open] .ui-select__chevron { transform: rotate(180deg); }
/* ----- List: the menu pattern, unfolding softly from the trigger ----- */
.ui-select__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + 6px);
  left: 0;
  width: max-content;
  min-width: max(100%, 180px);
  max-width: min(320px, calc(100vw - 32px));
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  transform-origin: top left;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px) scale(0.97);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-emphasized), visibility 0s linear var(--tc-duration-base);
}
[data-ui="select"][data-align="end"] .ui-select__pop { left: auto; right: 0; transform-origin: top right; }
[data-ui="select"][data-open] .ui-select__pop { opacity: 1; visibility: visible; transform: none; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-emphasized), visibility 0s; }
.ui-select__list { display: grid; gap: var(--tc-hairline); max-height: min(320px, 60vh); overflow-y: auto; overscroll-behavior: contain; border-radius: var(--tc-menu-item-radius); }
/* The active option carries the focus ring itself (aria-activedescendant), so the list draws none */
.ui-select__list:focus-visible { outline: none; }
.ui-select__option { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-menu-item-h); padding: var(--tc-space-1) var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); color: var(--tc-text-primary); cursor: pointer; transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate), box-shadow var(--tc-duration-instant) var(--tc-ease-decelerate); }
.ui-select__option[data-active]:not([aria-disabled]) { background: var(--tc-menu-item-hover); }
/* Keyboard: the active option gets the focus ring (≥ 3:1) */
.ui-select__list:focus[data-keyed] .ui-select__option[data-active] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-select__option[aria-disabled] { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-select__text { display: grid; flex: 1; min-width: 0; }
.ui-select__option-label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-select__option[aria-selected="true"] .ui-select__option-label { font-weight: var(--tc-font-weight-medium); }
.ui-select__desc { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-select__desc { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-select__desc { color: var(--tc-text-secondary); }
.ui-select__option[aria-disabled] .ui-select__desc { color: var(--tc-text-disabled); }
/* The chosen option: a check in the menu's selected colour, in a fixed slot so the labels line up */
.ui-select__mark { display: grid; flex: none; place-items: center; width: 16px; }
.ui-select__check { color: var(--tc-menu-item-selected-fg); }
@media (pointer: coarse) {
  .ui-select__option { min-height: var(--tc-control-h-lg); }
}
@media (forced-colors: active) {
  .ui-select__check { color: CanvasText; }
  .ui-select__option[data-active] { outline: var(--tc-hairline) solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="select"] *, [data-ui="select"] *::before, [data-ui="select"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-select")) customElements.define("tc-select", TcSelect);

declare global {
  interface HTMLElementTagNameMap {
    "tc-select": TcSelect;
  }
}
