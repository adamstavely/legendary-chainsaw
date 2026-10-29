import { type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./base";

let nextId = 0;
export type SettingsChange<T> = { value: T };

/** Form association, controlled changes and cancelable asynchronous actions shared by settings controls. */
export abstract class TcSettingsElement<T> extends TcElement {
  static formAssociated = true;
  /** Current value; prevent tc-value-change to control it from the application. */
  @property({ attribute: false }) accessor value: T;
  /** Visible heading or field label. */
  @property() accessor label = "";
  /** Supporting explanation under the label. */
  @property() accessor description = "";
  /** Form field name; objects and arrays are serialized as JSON. */
  @property({ reflect: true }) accessor name = "";
  /** Disable editing and omit the control from form submission. */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Require a nonempty value. */
  @property({ type: Boolean, reflect: true }) accessor required = false;
  @state() protected accessor formDisabled = false;
  @state() protected accessor message = "";
  protected readonly uid = `tc-setting-${++nextId}`;
  private readonly internals: ElementInternals;
  private initial: T | undefined;

  constructor(initial: T) {
    super();
    this.value = initial;
    this.internals = this.attachInternals();
  }
  protected get blocked() {
    return this.disabled || this.formDisabled;
  }
  protected submissionValue(): unknown {
    return this.value;
  }
  private requiredError(): string {
    return this.required &&
      (this.value === "" ||
        this.value == null ||
        (Array.isArray(this.value) && !this.value.length) ||
        this.value === false)
      ? "Complete this field."
      : "";
  }
  protected validate(): string {
    return "";
  }
  private error() {
    return this.requiredError() || this.validate();
  }
  protected commit(value: T) {
    if (this.blocked) return false;
    const accepted = this.emit<SettingsChange<T>>(
      "tc-value-change",
      { value },
      { cancelable: true },
    );
    if (accepted) this.value = value;
    this.requestUpdate();
    return accepted;
  }
  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!this.hasUpdated) this.initial = structuredClone(this.value);
  }
  protected override updated() {
    if (typeof this.internals.setFormValue !== "function") return;
    const invalid = this.blocked ? "" : this.error();
    const submitted = this.submissionValue();
    const value =
      typeof submitted === "string" ? submitted : JSON.stringify(submitted);
    this.internals.setFormValue(
      this.name && !this.blocked && submitted != null ? value : null,
    );
    this.internals.setValidity(
      invalid ? { customError: true } : {},
      invalid,
      this.querySelector<HTMLElement>("input,textarea,select,button") ??
        undefined,
    );
  }
  /** Check the current form validity. */
  checkValidity() {
    return this.blocked || !this.error();
  }
  /** Show the current validation message and focus the first control. */
  reportValidity() {
    this.message = this.blocked ? "" : this.error();
    if (this.message)
      this.querySelector<HTMLElement>("input,textarea,select,button")?.focus();
    return !this.message;
  }
  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }
  formResetCallback() {
    if (this.initial !== undefined) {
      const value = structuredClone(this.initial);
      if (
        this.emit<SettingsChange<T>>(
          "tc-value-change",
          { value },
          { cancelable: true },
        )
      )
        this.value = value;
      else this.requestUpdate();
    }
    this.message = "";
  }
}

const rawSettingsCss = /* css */ `
.tc-settings { min-width: 0; color: var(--tc-text-primary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; }
.tc-settings, .tc-settings * { box-sizing: border-box; }
.tc-settings-card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.tc-settings-card > header { padding: var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.tc-settings h3 { margin: 0; color: var(--tc-title-color); font-size: var(--tc-title-font-size); line-height: var(--tc-title-line-height); font-weight: var(--tc-title-font-weight); letter-spacing: var(--tc-title-tracking); }
.tc-settings p { margin: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.tc-settings header p { margin-top: var(--tc-space-1); color: var(--tc-subtitle-color); font-size: var(--tc-subtitle-font-size); line-height: var(--tc-subtitle-line-height); }
.tc-settings fieldset { display: grid; align-content: start; gap: var(--tc-space-4); min-width: 0; padding: 0; margin: 0; border: 0; }
.tc-settings-card > fieldset { padding: var(--tc-space-4); }
.tc-settings-field { display: grid; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.tc-settings input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), .tc-settings select, .tc-settings textarea { appearance: none; width: 100%; min-width: 0; height: var(--tc-field-h); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); box-shadow: var(--tc-field-shadow); background: var(--tc-field-bg); color: var(--tc-text-primary); font-family: inherit; font-size: var(--tc-field-font-size); font-weight: var(--tc-font-weight-regular); transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard); }
.tc-settings input::-webkit-inner-spin-button, .tc-settings input::-webkit-outer-spin-button { appearance: none; margin: 0; }
.tc-settings input[type="number"] { -moz-appearance: textfield; }
.tc-settings textarea { height: auto; min-height: 100px; padding: var(--tc-space-2) var(--tc-field-px); line-height: var(--tc-line-height-normal); resize: vertical; }
.tc-settings input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):hover, .tc-settings select:hover, .tc-settings textarea:hover { box-shadow: var(--tc-field-shadow-hover); }
.tc-settings input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus, .tc-settings select:focus, .tc-settings textarea:focus { box-shadow: var(--tc-field-shadow-focus); }
.tc-settings input[aria-invalid="true"], .tc-settings textarea[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.tc-settings input:focus-visible, .tc-settings select:focus-visible, .tc-settings textarea:focus-visible, .tc-settings button:focus-visible, .tc-settings summary:focus-visible, .tc-settings [tabindex]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.tc-settings input[type="checkbox"], .tc-settings input[type="radio"] { appearance: none; flex: none; width: var(--tc-space-4-5); height: var(--tc-space-4-5); margin: var(--tc-space-1) 0; border: var(--tc-hairline) solid var(--tc-border-control); border-radius: var(--tc-radius-sm); background: var(--tc-surface-control); cursor: pointer; display: grid; place-content: center; }
.tc-settings input[type="radio"] { border-radius: var(--tc-radius-full); }
.tc-settings input[type="checkbox"]:checked, .tc-settings input[type="radio"]:checked { background: var(--tc-surface-inverse); border-color: var(--tc-surface-inverse); }
[data-look="clean"] > .tc-settings input[type="checkbox"]:checked, [data-look="clean"] > .tc-settings input[type="radio"]:checked { background: var(--tc-accent); border-color: var(--tc-accent); }
.tc-settings input[type="checkbox"]:checked::before { content: ""; width: var(--tc-space-2); height: var(--tc-space-1); border-left: var(--tc-focus-ring-width) solid var(--tc-text-on-inverse); border-bottom: var(--tc-focus-ring-width) solid var(--tc-text-on-inverse); transform: translateY(-1px) rotate(-45deg); }
[data-look="clean"] > .tc-settings input[type="checkbox"]:checked::before { border-color: var(--tc-text-on-accent); }
.tc-settings input[type="radio"]:checked::before { content: ""; width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-text-on-inverse); }
[data-look="clean"] > .tc-settings input[type="radio"]:checked::before { background: var(--tc-text-on-accent); }
[data-ui="switch"] > .tc-settings input[type="checkbox"] { position: relative; width: var(--tc-switch-w); height: var(--tc-switch-h); border: 0; border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background var(--tc-duration-moderate) var(--tc-ease-standard); }
[data-ui="switch"] > .tc-settings input[type="checkbox"]::before { content: ""; position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border: 0; border-radius: var(--tc-switch-radius); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transform: translateX(0); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
[data-ui="switch"] > .tc-settings input[type="checkbox"]:checked { background: var(--tc-switch-on); }
[data-ui="switch"] > .tc-settings input[type="checkbox"]:checked::before { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.tc-settings button, .tc-settings input::file-selector-button { justify-self: start; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); box-shadow: var(--tc-action-secondary-shadow); background: var(--tc-action-secondary-bg); color: var(--tc-action-secondary-fg); font-family: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard), background var(--tc-duration-quick) var(--tc-ease-standard); }
.tc-settings button:hover, .tc-settings input::file-selector-button:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.tc-settings button[data-variant="primary"] { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); }
.tc-settings button[data-variant="primary"]:hover { background: var(--tc-action-primary-bg-hover); }
.tc-settings button[data-variant="primary"]:active { background: var(--tc-action-primary-bg-active); }
.tc-settings button[data-variant="destructive"] { color: var(--tc-status-danger-fg); background: var(--tc-status-danger-bg); box-shadow: none; }
.tc-settings button[data-variant="destructive"]:hover { background: color-mix(in srgb, var(--tc-status-danger-bg) 88%, var(--tc-status-danger-solid)); }
.tc-settings button[data-variant="ghost"] { color: var(--tc-action-ghost-fg); background: transparent; box-shadow: none; }
.tc-settings button[data-variant="ghost"]:hover { background: var(--tc-action-ghost-bg-hover); }
.tc-settings button:disabled, .tc-settings input:disabled, .tc-settings select:disabled, .tc-settings textarea:disabled { opacity: 0.5; cursor: not-allowed; }
.tc-settings-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-space-6); }
.tc-settings-control { display: grid; gap: var(--tc-space-1-5); padding: 0; background: transparent; box-shadow: none; }
.tc-settings-control fieldset { gap: var(--tc-space-2); }
.tc-settings [hidden] { display: none; }
.tc-settings pre { overflow: auto; max-height: 280px; padding: var(--tc-space-3); margin: 0; border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); box-shadow: var(--tc-shadow-sunken); color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); white-space: pre-wrap; overflow-wrap: anywhere; }
.tc-settings details { min-width: 0; border-top: var(--tc-hairline) solid var(--tc-divider); padding-top: var(--tc-space-3); }
.tc-settings summary { cursor: pointer; color: var(--tc-text-secondary); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.tc-settings details[open] summary { margin-bottom: var(--tc-space-3); }
[data-ui="slider-field"] > .tc-settings .tc-settings-field { grid-template-columns: minmax(0, 1fr) 80px; align-items: center; }
.tc-settings input[type="range"] { appearance: none; width: 100%; height: var(--tc-space-6); margin: 0; padding: 0; background: transparent; cursor: pointer; }
.tc-settings input[type="range"]::-webkit-slider-runnable-track { height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.tc-settings input[type="range"]::-moz-range-track { height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.tc-settings input[type="range"]::-webkit-slider-thumb { appearance: none; width: var(--tc-space-4); height: var(--tc-space-4); margin-top: calc((var(--tc-meter-h) - var(--tc-space-4)) / 2); border: var(--tc-hairline) solid var(--tc-border-control); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); }
.tc-settings input[type="range"]::-moz-range-thumb { width: var(--tc-space-4); height: var(--tc-space-4); border: var(--tc-hairline) solid var(--tc-border-control); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); }
.tc-settings-secret { display: flex; align-items: center; gap: var(--tc-space-2); }
.tc-settings-secret input { flex: 1; }
.tc-settings-secret button { flex: none; }
.tc-settings input::file-selector-button { margin-right: var(--tc-space-3); }
.tc-settings-badge { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); background: var(--tc-fill-subtle); }
.tc-settings-badge[data-status="ready"] { color: var(--tc-status-success-fg); background: var(--tc-status-success-bg); }
.tc-settings-badge[data-status="failed"] { color: var(--tc-status-danger-fg); background: var(--tc-status-danger-bg); }
.tc-settings-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--tc-space-3); min-width: 0; }
.tc-settings-columns > section { min-width: 0; }
.tc-settings-stack { display: grid; gap: var(--tc-space-3); }
.tc-settings-definition { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--tc-space-2); margin: 0; font-size: var(--tc-font-size-sm); }
.tc-settings-definition dt { color: var(--tc-text-secondary); }
.tc-settings-definition dd { margin: 0; }
.tc-settings blockquote { margin: 0; padding-left: var(--tc-space-3); border-left: var(--tc-hairline) solid var(--tc-border-control); overflow-wrap: anywhere; }
.tc-settings strong, .tc-settings li, .tc-settings code { overflow-wrap: anywhere; }
.tc-settings-media { display: block; max-width: 100%; max-height: 240px; border-radius: var(--tc-radius-md); object-fit: contain; }
@media (prefers-reduced-motion: reduce) { .tc-settings input, .tc-settings button, .tc-settings input::before { transition: none; } }
`;

/*
 * The primitives' own parts only. A primitive that hosts the app's content (tc-dialog's body and actions) marks that
 * region .tc-settings-host, and the descendant rules above (`.tc-settings button`, `.tc-settings p` …) must not reach
 * into it – a hosted tc-button or progress tracker keeps its own styling. Every selector that goes below a
 * .tc-settings root gets OWN on its last compound: not inside a host, unless inside a primitive nested in one (a
 * tc-switch placed in a dialog still gets its styles). :where() adds no specificity, so the primitives render exactly
 * as before.
 */
const OWN = ":where(:not(.tc-settings-host *), .tc-settings-host .tc-settings *)";
const scopeSelector = (selector: string) => {
  if (!/\.tc-settings[\w-]*[^,]*?[\s>]+\S/.test(selector)) return selector;
  const pseudo = selector.indexOf("::");
  return pseudo < 0 ? selector + OWN : selector.slice(0, pseudo) + OWN + selector.slice(pseudo);
};
export const settingsCss = rawSettingsCss.replace(
  /(?<=^|[;{}])(\s*)([^{}@;]+?)(\s*\{)/g,
  (_whole, lead: string, selectors: string, open: string) =>
    lead +
    selectors
      .split(/,(?![^(]*\))/)
      .map((s) => scopeSelector(s.trim()))
      .join(", ") +
    open,
);

