import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";

/*
 * <tc-sensitivity-label-picker> – sets a file's classification. A small button shows the label's mark and word, and opens
 * a list of labels with what each one means. Raising the sensitivity happens at once; lowering it first asks why, inline,
 * because it may let more people see the file. The mark shows the level as filled bars, so colour is never the only cue.
 * ↑ ↓ Home End move, Enter or Space picks, Escape closes.
 * It only records the choice: the server decides what a label allows.
 *
 *   <tc-sensitivity-label-picker file-name="Q3 audit.pdf" value="internal"></tc-sensitivity-label-picker>
 */

export type SensitivityLabel = {
  id: string;
  label: string;
  description?: string;
  /** Higher is more sensitive */
  level: number;
  /** A hex colour for the mark */
  color?: string;
};
export type SensitivityDirection = "raise" | "lower" | "set";
export type SensitivityValueChange = { value: string; label: SensitivityLabel; reason?: string; direction: SensitivityDirection };

/** The picker's words, every one renameable through `labels` */
export type SensitivityLabelPickerWords = {
  set: string;
  unknown: string;
  /** Names the list; {file} is the file's name, when given */
  list: string;
  listNoFile: string;
  /** {label} */
  reasonTitle: string;
  reasonHint: string;
  reasonPlaceholder: string;
  needsReason: string;
  confirm: string;
  back: string;
  /** Announced; {label} */
  changed: string;
};
export const defaultSensitivityLabelPickerWords: SensitivityLabelPickerWords = {
  set: "Set sensitivity",
  unknown: "Unknown label",
  list: "Sensitivity of {file}",
  listNoFile: "Sensitivity",
  reasonTitle: "Lower to {label}?",
  reasonHint: "This may let more people see it. Say why.",
  reasonPlaceholder: "This goes in the record",
  needsReason: "Add a reason for lowering it.",
  confirm: "Lower sensitivity",
  back: "Back",
  changed: "Sensitivity set to {label}",
};

/** The labels when `options` isn't set, least sensitive first */
export const defaultSensitivityLabels: SensitivityLabel[] = [
  { id: "public", label: "Public", description: "Anyone can see this.", level: 1 },
  { id: "internal", label: "Internal", description: "For people in the organization.", level: 2 },
  { id: "confidential", label: "Confidential", description: "For the teams that need it.", level: 3 },
  { id: "restricted", label: "Restricted", description: "For named people only.", level: 4 },
];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const CHECK = svg`<path d="M20 6 9 17l-5-5"></path>`;
let instances = 0;

/**
 * Sets a file's classification, asking why before lowering it.
 * @tag tc-sensitivity-label-picker
 * @fires tc-value-change - The label changed ({ value, label, reason, direction }: SensitivityValueChange); cancelable – prevented, `value` stays as it was
 */
export class TcSensitivityLabelPicker extends TcElement {
  static override ui = "slp";

  /** The labels to choose from */
  @property({ attribute: false }) accessor options: SensitivityLabel[] = defaultSensitivityLabels;
  /** The id of the file's label, or null for none. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property() accessor value: string | null = null;
  /** The file's name, so the control says which file it's for */
  @property({ attribute: "file-name" }) accessor fileName = "";
  /** Show the label without letting it change */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<SensitivityLabelPickerWords> = {};

  @state() private accessor active = 0;
  @state() private accessor pending: SensitivityLabel | null = null;
  @state() private accessor reason = "";
  @state() private accessor tried = false;
  @state() private accessor announce = "";
  private readonly uid = `tc-slp-${++instances}`;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-slp__pop"),
    anchor: () => this.querySelector<HTMLElement>(".ui-slp__trigger"),
    side: "bottom",
    align: "start",
    kind: "dialog",
    returnFocus: () => this.querySelector<HTMLElement>(".ui-slp__trigger"),
    initialFocus: () => this.optionAt(this.active),
    tabBridge: true,
    closeOnFocusOut: true,
    onClose: () => {
      this.pending = null;
      this.requestUpdate();
    },
  });

  private get words(): SensitivityLabelPickerWords {
    return { ...defaultSensitivityLabelPickerWords, ...this.labels };
  }
  private get ordered() {
    return [...this.options].sort((a, b) => a.level - b.level);
  }
  private get current() {
    return this.options.find((o) => o.id === this.value) ?? null;
  }
  private optionAt(i: number) {
    return this.querySelectorAll<HTMLElement>(".ui-slp__option")[i] ?? null;
  }

  /** How high a label sits: as filled bars out of the number of labels */
  private mark(label: SensitivityLabel | null) {
    const all = this.ordered;
    const filled = label ? all.findIndex((o) => o.id === label.id) + 1 : 0;
    const bars = Math.max(all.length, 1);
    const style = label?.color && HEX.test(label.color) ? { "--tc-slp-mark": label.color } : {};
    return html`<svg class="ui-slp__mark" viewBox=${`0 0 ${bars * 6 - 2} 16`} aria-hidden="true" style=${styleMap(style)} data-level=${filled}>
      ${all.map((_, i) => svg`<rect class="ui-slp__bar" x=${i * 6} y=${12 - ((i + 1) / bars) * 12} width="4" height=${4 + ((i + 1) / bars) * 12} rx="1" data-on=${i < filled ? "true" : "false"}></rect>`)}
    </svg>`;
  }

  private toggle() {
    if (this.pop.open) {
      this.pop.close();
      return;
    }
    this.active = Math.max(0, this.ordered.findIndex((o) => o.id === this.value));
    this.pending = null;
    this.pop.show({ focus: true });
    this.requestUpdate();
  }

  private pick(label: SensitivityLabel) {
    if (label.id === this.value) {
      this.pop.close();
      return;
    }
    const current = this.current;
    if (current && label.level < current.level) {
      this.pending = label;
      this.reason = "";
      this.tried = false;
      this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-slp__reason")?.focus());
      return;
    }
    this.apply(label, current ? "raise" : "set");
  }

  private apply(label: SensitivityLabel, direction: SensitivityDirection, reason?: string) {
    const detail: SensitivityValueChange = { value: label.id, label, direction, ...(reason ? { reason } : {}) };
    if (this.emit<SensitivityValueChange>("tc-value-change", detail, { cancelable: true })) {
      this.value = label.id;
      this.announce = this.words.changed.replace("{label}", label.label);
    }
    this.pop.close();
  }

  private confirm() {
    const reason = this.reason.trim();
    if (!reason) {
      this.tried = true;
      this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-slp__reason")?.focus());
      return;
    }
    if (this.pending) this.apply(this.pending, "lower", reason);
  }

  private back() {
    this.pending = null;
    this.updateComplete.then(() => this.optionAt(this.active)?.focus());
  }

  private onListKey(e: KeyboardEvent) {
    const all = this.ordered;
    let next = this.active;
    if (e.key === "ArrowDown") next = Math.min(all.length - 1, this.active + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, this.active - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = all.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const label = all[this.active];
      if (label) this.pick(label);
      return;
    } else return;
    e.preventDefault();
    this.active = next;
    this.updateComplete.then(() => this.optionAt(next)?.focus());
  }

  private renderReason(label: SensitivityLabel) {
    const w = this.words;
    const id = `${this.uid}-reason`;
    const missing = this.tried && !this.reason.trim();
    return html`<div class="ui-slp__ask">
      <label class="ui-slp__ask-title" for=${id}>${w.reasonTitle.replace("{label}", label.label)}</label>
      <p class="ui-slp__ask-hint">${w.reasonHint}</p>
      <textarea
        id=${id}
        class="ui-slp__reason"
        rows="2"
        placeholder=${w.reasonPlaceholder}
        aria-required="true"
        aria-invalid=${missing ? "true" : "false"}
        aria-describedby=${missing ? `${id}-error` : nothing}
        .value=${live(this.reason)}
        @input=${(e: Event) => (this.reason = (e.target as HTMLTextAreaElement).value)}
      ></textarea>
      ${missing ? html`<p class="ui-slp__error" id=${`${id}-error`}>${w.needsReason}</p>` : nothing}
      <div class="ui-slp__ask-actions">
        <button type="button" class="tc-btn-sm ui-slp__back" @click=${this.back}>${w.back}</button>
        <button type="button" class="tc-btn-sm ui-slp__confirm" @click=${this.confirm}>${w.confirm}</button>
      </div>
    </div>`;
  }

  private renderPopover() {
    const w = this.words;
    const name = this.fileName ? w.list.replace("{file}", this.fileName) : w.listNoFile;
    return html`<div class="tc-pop ui-slp__pop" id=${`${this.uid}-pop`} aria-label=${name}>
      ${this.pending
        ? this.renderReason(this.pending)
        : html`<div class="ui-slp__list" role="listbox" aria-label=${name} @keydown=${this.onListKey}>
            ${this.ordered.map((o, i) => {
              const selected = o.id === this.value;
              return html`<div class="ui-slp__option" role="option" aria-selected=${selected ? "true" : "false"} tabindex=${i === this.active ? 0 : -1} @click=${() => this.pick(o)}>
                ${this.mark(o)}
                <span class="ui-slp__text"><span class="ui-slp__name">${o.label}</span>${o.description ? html`<span class="ui-slp__about">${o.description}</span>` : nothing}</span>
                ${selected ? html`<svg class="ui-slp__check" viewBox="0 0 24 24" aria-hidden="true">${CHECK}</svg>` : nothing}
              </div>`;
            })}
          </div>`}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const label = this.current;
    const text = label?.label ?? (this.value !== null ? w.unknown : w.set);
    return html`<button type="button" class="ui-slp__trigger" data-empty=${label ? "false" : "true"} aria-haspopup="dialog" aria-expanded=${this.pop.open ? "true" : "false"} aria-controls=${ifDefined(this.pop.open ? `${this.uid}-pop` : undefined)} ?disabled=${this.disabled} @click=${this.toggle}>
        ${this.mark(label)}<span class="ui-slp__label">${text}</span>${this.fileName ? html`<span class="tc-sr-only">, ${this.fileName}</span>` : nothing}
      </button>
      ${this.pop.open ? this.renderPopover() : nothing}
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="slp"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="slp"] {
  display: inline-block; max-width: 100%; min-width: 0; font-family: var(--tc-font-sans); font-size: var(--tc-control-font-size); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-align: left; vertical-align: middle; -webkit-font-smoothing: antialiased;
}
/* The list's width and the mark's colour – override them on the element */
[data-ui="slp"] { --tc-slp-list-width: 300px; --tc-slp-mark: var(--tc-text-primary); }
[data-ui="slp"] *, [data-ui="slp"] *::before, [data-ui="slp"] *::after { box-sizing: border-box; }
[data-ui="slp"] :where(p) { margin: 0; }
.ui-slp__trigger { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); max-width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font: inherit; font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-slp__trigger:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-slp__trigger:focus-visible, .ui-slp__option:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-slp__trigger:disabled { background: var(--tc-fill-hover); box-shadow: none; color: var(--tc-text-secondary); cursor: default; }
.ui-slp__trigger[data-empty="true"] { color: var(--tc-text-secondary); }
.ui-slp__label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-slp__mark { flex: none; width: var(--tc-icon-size-md, 16px); height: var(--tc-icon-size-md, 16px); }
.ui-slp__bar { fill: var(--tc-border-strong); }
.ui-slp__bar[data-on="true"] { fill: var(--tc-slp-mark); }
.ui-slp__pop { width: var(--tc-slp-list-width); max-width: calc(100vw - var(--tc-space-4)); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-slp__list { display: grid; gap: var(--tc-space-0-5); }
.ui-slp__option { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-slp__option:hover { background: var(--tc-fill-hover); }
.ui-slp__option[aria-selected="true"] { background: var(--tc-fill-selected); }
.ui-slp__text { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-slp__name { font-weight: var(--tc-font-weight-medium); }
.ui-slp__about, .ui-slp__ask-hint { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-normal); }
.ui-slp__check { flex: none; width: var(--tc-icon-size-md, 16px); height: var(--tc-icon-size-md, 16px); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-slp__ask { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2); }
.ui-slp__ask-title { font-weight: var(--tc-font-weight-medium); }
.ui-slp__reason { width: 100%; padding: var(--tc-space-1-5) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; resize: vertical; }
.ui-slp__reason:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-slp__reason[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-slp__reason::placeholder { color: var(--tc-text-muted); }
.ui-slp__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-slp__ask-actions { display: flex; justify-content: flex-end; gap: var(--tc-space-2); }
@media (forced-colors: active) {
  .ui-slp__bar[data-on="true"] { fill: CanvasText; }
  .ui-slp__bar { fill: GrayText; }
  .ui-slp__option[aria-selected="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-sensitivity-label-picker")) customElements.define("tc-sensitivity-label-picker", TcSensitivityLabelPicker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-sensitivity-label-picker": TcSensitivityLabelPicker;
  }
}
