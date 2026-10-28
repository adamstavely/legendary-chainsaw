import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-model-settings> – how one model generates, for the model the app supplies. Only the parameters that model
 * supports are shown, each with a plain-language line on what it does:
 *   · Presets – named sets of values (Precise, Balanced, Creative) as a segmented control; "Custom" once a value moves
 *   · Parameters – a slider for numbers (temperature, top-p, output length), a segmented control for choices (reasoning
 *     effort), the value beside the label and a Reset once it differs from the model's default
 *   · Check – incompatible settings: two parameters that shouldn't both move (`conflicts`), and values the model
 *     ignores (a reasoning model and temperature) with the app's reason and a Clear
 *   · Changed – a compact read-back of what differs from the defaults, with Reset all
 * Reasoning effort says how hard the model works; its working itself is never shown, configured or exported here.
 *
 *   <tc-model-settings .model=${{ id: "m", label: "Atlas 2", supports: ["temperature", "maxOutputTokens"] }} .value=${{ temperature: 0.4 }}></tc-model-settings>
 *
 * `value` holds the values the person set, by parameter id; anything missing is the model's default. Every change fires
 * one cancelable tc-value-change ({ value, changed }) – call preventDefault() to control `value`. With `name` it's a form
 * control that submits the supported values as JSON.
 * Keyboard: the sliders are native ranges (arrows, Page Up/Down, Home/End); presets and choices are radio groups
 * (arrows); everything else is a button. Standard is a white card on a gray tray, values in filled chips and an ink
 * preset pill. Clean is one white card with hairline dividers, plain values and an accent-tinted read-back.
 */

/** A value a parameter can take */
export type ModelParamValue = number | string;
/** One generation parameter. `range` is a slider; `choice` a segmented control */
export type ModelParam = {
  id: string;
  label: string;
  /** What it does, in plain words – shown under the label */
  description?: string;
  kind: "range" | "choice";
  /** The default when the model doesn't give one */
  default: ModelParamValue;
  /** range: the bounds and step */
  min?: number;
  max?: number;
  step?: number;
  /** range: words at the two ends of the track, e.g. ["Focused", "Varied"] */
  ends?: [string, string];
  /** range: a unit after the value, e.g. "tokens" */
  unit?: string;
  /** choice: the options */
  options?: { value: string; label: string }[];
};
/** The model the settings are for, as the app reports it */
export type ModelSettingsModel = {
  id: string;
  label: string;
  /** What kind of model it is, in a line – e.g. "Reasoning model · plans before it answers" */
  description?: string;
  /** The ids of the parameters it accepts; the others are hidden */
  supports: string[];
  /** Its own defaults, by parameter id, over the parameters' */
  defaults?: Record<string, ModelParamValue>;
  /** Why it ignores a parameter, by id – shown when a value is set for one it doesn't support */
  ignores?: Record<string, string>;
};
/** A named set of values */
export type ModelSettingsPreset = { id: string; label: string; description?: string; values: Record<string, ModelParamValue> };
/** Two or more parameters that shouldn't all move from their defaults at once */
export type ModelSettingsConflict = { params: string[]; message: string };
/** The values the person set, by parameter id; missing ones are the model's defaults */
export type ModelSettingsValue = Record<string, ModelParamValue>;
/** tc-value-change: the next value and the ids that changed */
export type ModelSettingsChange = { value: ModelSettingsValue; changed: string[] };
/** One line of feedback */
export type ModelSettingsIssue = { kind: "conflict" | "ignored"; params: string[]; message: string };

export const defaultModelParams: ModelParam[] = [
  {
    id: "temperature",
    label: "Temperature",
    kind: "range",
    min: 0,
    max: 2,
    step: 0.1,
    default: 1,
    ends: ["Focused", "Varied"],
    description: "How much the wording varies between answers. Lower sticks to the likeliest words; higher tries less likely ones.",
  },
  {
    id: "topP",
    label: "Top-p",
    kind: "range",
    min: 0,
    max: 1,
    step: 0.05,
    default: 1,
    description: "Which words are in the running: only the likeliest ones that add up to this share. Lower is more predictable.",
  },
  {
    id: "maxOutputTokens",
    label: "Output length",
    kind: "range",
    min: 256,
    max: 16384,
    step: 256,
    default: 4096,
    unit: "tokens",
    description: "The longest an answer can be. An answer that reaches it stops mid-sentence.",
  },
  {
    id: "reasoningEffort",
    label: "Reasoning effort",
    kind: "choice",
    default: "medium",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
    description: "How much work the model does before it answers. More is slower and costs more. Only the answer comes back – its working isn't shown or kept.",
  },
];
export const defaultModelPresets: ModelSettingsPreset[] = [
  { id: "precise", label: "Precise", description: "Nearly the same answer every time – for extraction, classification and facts", values: { temperature: 0.2, reasoningEffort: "high" } },
  { id: "balanced", label: "Balanced", description: "Natural wording with few surprises – a good default for conversation", values: { temperature: 0.7, reasoningEffort: "medium" } },
  { id: "creative", label: "Creative", description: "More varied wording and ideas – for drafts and brainstorming", values: { temperature: 1.2, reasoningEffort: "low" } },
];
export const defaultModelConflicts: ModelSettingsConflict[] = [
  { params: ["temperature", "topP"], message: "Temperature and top-p both change how varied answers are. Move one and leave the other at its default." },
];

const decimals = (step = 1) => (Number.isInteger(step) ? 0 : (String(step).split(".")[1]?.length ?? 1));
const same = (a: ModelParamValue | undefined, b: ModelParamValue | undefined) => (typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-9 : a === b);
const list = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

/** A parameter's value as text: "0.7", "4,096 tokens", "High" */
export function formatModelParam(p: ModelParam, v: ModelParamValue | undefined): string {
  if (v === undefined) return "";
  if (p.kind === "choice") return p.options?.find((o) => o.value === v)?.label ?? String(v);
  const n = Number(v);
  const text = Number.isInteger(p.step ?? 1) ? n.toLocaleString("en-US") : n.toFixed(decimals(p.step));
  return p.unit ? `${text} ${p.unit}` : text;
}

/* sliders-horizontal, rotate-ccw, triangle-alert, info: Lucide (ISC, lucide.dev) */
const lucide = (cls: string, body: ReturnType<typeof svg>) =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const slidersIcon = svg`<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"></path>`;
const resetIcon = () => lucide("ui-mset__btn-icon", svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`);
const alertIcon = () => lucide("ui-mset__issue-icon", svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`);
const infoIcon = () => lucide("ui-mset__issue-icon", svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>`);

let instances = 0;

/**
 * How one model generates: its supported parameters with plain explanations, presets, feedback on incompatible
 * settings and what differs from the defaults.
 * @tag tc-model-settings
 * @fires tc-value-change - A value changed ({ value: ModelSettingsValue, changed: string[] }); cancelable – prevent it to control `value`
 */
export class TcModelSettings extends TcElement {
  static override ui = "mset";
  static formAssociated = true;

  /** The heading, and the group's name */
  @property() accessor heading = "Model settings";
  /** The model the settings are for; unset shows every parameter */
  @property({ attribute: false }) accessor model: ModelSettingsModel | undefined = undefined;
  /** The values the person set, by parameter id; missing ones are the defaults. Changed by the user unless tc-value-change is prevented */
  @property({ attribute: false }) accessor value: ModelSettingsValue = {};
  /** Every parameter the app knows; only those the model supports are shown */
  @property({ attribute: false }) accessor parameters: ModelParam[] = defaultModelParams;
  /** Named sets of values; a preset is picked when the shown values match it */
  @property({ attribute: false }) accessor presets: ModelSettingsPreset[] = defaultModelPresets;
  /** Parameters that shouldn't all move from their defaults at once, with what to say when they do */
  @property({ attribute: false }) accessor conflicts: ModelSettingsConflict[] = defaultModelConflicts;
  /** Submitted with the form: the supported values as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the settings out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Shows the signature above the controls: every value on its range with the default and presets marked. Off by
   *  default – the controls already show each value, so it's for pages that want the at-a-glance picture too */
  @property({ type: Boolean }) accessor signature = false;

  @state() private accessor formDisabled = false;
  @state() private accessor announcement = "";

  private readonly internals: ElementInternals;
  private readonly uid = `tc-mset${++instances}`;
  private initialValue: ModelSettingsValue | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.initialValue ??= this.value;
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  formResetCallback() {
    this.value = this.initialValue ?? {};
  }
  formDisabledCallback(disabled: boolean) {
    // Also called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  /* ---------- The model ---------- */

  /** The parameters the model supports, in the order `parameters` lists them */
  get supported(): ModelParam[] {
    const ids = this.model?.supports;
    return ids ? this.parameters.filter((p) => ids.includes(p.id)) : this.parameters;
  }

  /** A parameter's default for this model */
  defaultOf(p: ModelParam): ModelParamValue {
    return this.model?.defaults?.[p.id] ?? p.default;
  }

  /** Every supported value, the defaults filled in */
  get resolved(): ModelSettingsValue {
    return Object.fromEntries(this.supported.map((p) => [p.id, this.value[p.id] ?? this.defaultOf(p)]));
  }

  /** The supported parameters whose value differs from the default */
  get changes(): ModelParam[] {
    return this.supported.filter((p) => this.value[p.id] !== undefined && !same(this.value[p.id], this.defaultOf(p)));
  }

  /** The presets that set something this model supports */
  private get usablePresets() {
    const ids = new Set(this.supported.map((p) => p.id));
    return this.presets.filter((pr) => Object.keys(pr.values).some((k) => ids.has(k)));
  }

  /** The preset the shown values match, or null for custom values */
  get preset(): string | null {
    const r = this.resolved;
    return this.usablePresets.find((pr) => Object.entries(pr.values).every(([k, v]) => !(k in r) || same(r[k], v)))?.id ?? null;
  }

  /** What to fix: conflicting changes, then values the model ignores */
  get issues(): ModelSettingsIssue[] {
    const changed = new Set(this.changes.map((p) => p.id));
    const label = (id: string) => this.parameters.find((p) => p.id === id)?.label ?? id;
    const out: ModelSettingsIssue[] = this.conflicts.filter((c) => c.params.length && c.params.every((id) => changed.has(id))).map((c) => ({ kind: "conflict", params: c.params, message: c.message }));
    if (this.model) {
      for (const id of Object.keys(this.value)) {
        if (this.model.supports.includes(id) || this.value[id] === undefined) continue;
        const p = this.parameters.find((x) => x.id === id);
        const shown = p ? formatModelParam(p, this.value[id]) : String(this.value[id]);
        const why = this.model.ignores?.[id];
        out.push({ kind: "ignored", params: [id], message: `${this.model.label} ignores ${label(id).toLowerCase()} (set to ${shown}) – it's left out of requests.${why ? ` ${why}` : ""}` });
      }
    }
    return out;
  }

  private commit(next: ModelSettingsValue, changed: string[], say: string) {
    if (this.isDisabled) return;
    if (this.emit<ModelSettingsChange>("tc-value-change", { value: next, changed }, { cancelable: true })) {
      this.value = next;
      this.announcement = say;
    } else this.requestUpdate();
  }

  private set(p: ModelParam, v: ModelParamValue) {
    if (same(this.value[p.id], v)) return;
    this.commit({ ...this.value, [p.id]: v }, [p.id], "");
  }

  private reset(ids: string[], say: string) {
    const next = { ...this.value };
    for (const id of ids) delete next[id];
    this.commit(next, ids, say);
  }

  private applyPreset(id: string) {
    const pr = this.usablePresets.find((x) => x.id === id);
    if (!pr) return;
    const ids = this.supported.map((p) => p.id).filter((k) => k in pr.values);
    const next = { ...this.value };
    for (const k of ids) next[k] = pr.values[k];
    this.commit(next, ids, `${pr.label} preset applied`);
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-disabled", this.isDisabled);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-h`);
    if (typeof this.internals.setFormValue === "function") this.internals.setFormValue(this.name && !this.isDisabled ? JSON.stringify(this.resolved) : null);
  }

  /* ---------- Rendering ---------- */

  private renderPresets(look: "standard" | "clean") {
    const presets = this.usablePresets;
    if (!presets.length) return nothing;
    const picked = this.preset;
    const options: SegmentOption[] = presets.map((p) => ({ value: p.id, label: p.label }));
    if (!picked) options.push({ value: "custom", label: "Custom", disabled: true });
    const desc = presets.find((p) => p.id === picked)?.description ?? "Your own values – pick a preset to start again from one.";
    return html`<div class="ui-mset__presets">
      <span class="ui-mset__section-label" id=${`${this.uid}-pre`}>Preset</span>
      <tc-segmented-control
        look=${look}
        class="ui-mset__seg"
        size="sm"
        aria-labelledby=${`${this.uid}-pre`}
        aria-describedby=${`${this.uid}-pre-d`}
        .options=${options}
        .value=${picked ?? "custom"}
        ?disabled=${this.isDisabled}
        @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
          // The inner control's event stops here: the page hears this element's tc-value-change only
          e.stopPropagation();
          e.preventDefault();
          this.applyPreset(e.detail.value);
        }}
      ></tc-segmented-control>
      <span class="ui-mset__hint" id=${`${this.uid}-pre-d`}>${desc}</span>
    </div>`;
  }

  /** The signature: every shown value against its range, with the default and each preset marked – a picture of
   *  where these settings sit, read at a glance. The controls below say the same in words, so it's hidden from
   *  assistive tech */
  private renderProfile() {
    const shown = this.supported;
    if (!shown.length) return nothing;
    const presets = this.usablePresets;
    const picked = this.preset;
    const r = this.resolved;
    const changed = new Set(this.changes.map((p) => p.id));
    const letter = (label: string) => label.charAt(0).toUpperCase();
    const row = (p: ModelParam) => {
      const v = r[p.id];
      const marks = presets.filter((pr) => p.id in pr.values);
      let body: unknown;
      if (p.kind === "choice") {
        const opts = p.options ?? [];
        body = html`<span class="ui-mset__pips">
          ${opts.map(
            (o) => html`<span class="ui-mset__pip" ?data-on=${o.value === v} ?data-default=${o.value === this.defaultOf(p)}>
              <span class="ui-mset__pip-marks">${marks.filter((pr) => pr.values[p.id] === o.value).map((pr) => html`<span class="ui-mset__mk" ?data-on=${pr.id === picked}>${letter(pr.label)}</span>`)}</span>
            </span>`,
          )}
        </span>`;
      } else {
        const min = p.min ?? 0;
        const max = p.max ?? 1;
        const at = (x: ModelParamValue) => String(Math.max(0, Math.min(1, (Number(x) - min) / (max - min || 1))));
        body = html`<span class="ui-mset__sig-track">
          <span class="ui-mset__sig-fill" style=${styleMap({ "--at": at(v) })}></span>
          <span class="ui-mset__sig-default" style=${styleMap({ "--at": at(this.defaultOf(p)) })}></span>
          ${marks.map((pr) => html`<span class="ui-mset__mk ui-mset__mk--on-track" ?data-on=${pr.id === picked} style=${styleMap({ "--at": at(pr.values[p.id]) })}>${letter(pr.label)}</span>`)}
          <span class="ui-mset__sig-dot" style=${styleMap({ "--at": at(v) })}></span>
        </span>`;
      }
      return html`<span class="ui-mset__sig-row" data-kind=${p.kind} ?data-changed=${changed.has(p.id)}>
        <span class="ui-mset__sig-name">${p.label}</span>${body}<span class="ui-mset__sig-val">${formatModelParam(p, v)}</span>
      </span>`;
    };
    return html`<div class="ui-mset__profile" aria-hidden="true">
      ${shown.map(row)}
      <span class="ui-mset__legend">
        <span class="ui-mset__key"><span class="ui-mset__key-dot"></span>Now</span>
        <span class="ui-mset__key"><span class="ui-mset__key-tick"></span>Default</span>
        ${presets.map((pr) => html`<span class="ui-mset__key"><span class="ui-mset__mk" ?data-on=${pr.id === picked}>${letter(pr.label)}</span>${pr.label}</span>`)}
      </span>
    </div>`;
  }

  private renderControl(p: ModelParam, v: ModelParamValue, look: "standard" | "clean") {
    const id = `${this.uid}-p-${p.id}`;
    if (p.kind === "choice")
      return html`<tc-segmented-control
        look=${look}
        class="ui-mset__seg"
        size="sm"
        aria-labelledby=${`${id}-l`}
        aria-describedby=${ifDefined(p.description ? `${id}-d` : undefined)}
        .options=${(p.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
        .value=${String(v)}
        ?disabled=${this.isDisabled}
        @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
          e.stopPropagation();
          e.preventDefault();
          this.set(p, e.detail.value);
        }}
      ></tc-segmented-control>`;
    const min = p.min ?? 0;
    const max = p.max ?? 1;
    const n = Number(v);
    const frac = (x: number) => Math.max(0, Math.min(1, (x - min) / (max - min || 1)));
    return html`<div class="ui-mset__track">
        <input
          id=${id}
          class="ui-mset__range"
          type="range"
          min=${min}
          max=${max}
          step=${p.step ?? 1}
          .value=${live(String(n))}
          aria-valuetext=${formatModelParam(p, n)}
          aria-describedby=${ifDefined(p.description ? `${id}-d` : undefined)}
          ?disabled=${this.isDisabled}
          style=${styleMap({ "--fill": `${frac(n) * 100}%` })}
          @input=${(e: Event) => this.set(p, Number(Number((e.target as HTMLInputElement).value).toFixed(decimals(p.step))))}
        />
        <span class="ui-mset__default-tick" aria-hidden="true" style=${styleMap({ "--default-at": String(frac(Number(this.defaultOf(p)))) })}></span>
      </div>
      ${p.ends ? html`<div class="ui-mset__ends" aria-hidden="true"><span>${p.ends[0]}</span><span>${p.ends[1]}</span></div>` : nothing}`;
  }

  private renderParam(p: ModelParam, look: "standard" | "clean") {
    const v = this.value[p.id] ?? this.defaultOf(p);
    const changed = this.value[p.id] !== undefined && !same(this.value[p.id], this.defaultOf(p));
    const flagged = this.issues.some((i) => i.kind === "conflict" && i.params.includes(p.id));
    const id = `${this.uid}-p-${p.id}`;
    const label = p.kind === "range" ? html`<label class="ui-mset__label" id=${`${id}-l`} for=${id}>${p.label}</label>` : html`<span class="ui-mset__label" id=${`${id}-l`}>${p.label}</span>`;
    return html`<li class="ui-mset__param" data-id=${p.id} ?data-changed=${changed} ?data-flagged=${flagged}>
      <div class="ui-mset__param-head">
        ${label}
        ${p.kind === "range" ? html`<span class="ui-mset__value" aria-hidden="true">${formatModelParam(p, v)}</span>` : nothing}
        <span class="ui-mset__is-default">${changed ? `Default ${formatModelParam(p, this.defaultOf(p))}` : "Default"}</span>
        ${changed
          ? html`<button type="button" class="ui-mset__reset" aria-label=${`Reset ${p.label.toLowerCase()} to ${formatModelParam(p, this.defaultOf(p))}`} ?disabled=${this.isDisabled} @click=${() => this.reset([p.id], `${p.label} reset to ${formatModelParam(p, this.defaultOf(p))}`)}>
              ${resetIcon()}<span>Reset</span>
            </button>`
          : nothing}
      </div>
      ${p.description ? html`<p class="ui-mset__desc" id=${`${id}-d`}>${p.description}</p>` : nothing}
      ${this.renderControl(p, v, look)}
    </li>`;
  }

  private renderIssues() {
    const issues = this.issues;
    if (!issues.length) return nothing;
    return html`<ul class="ui-mset__issues" aria-label="Check these settings">
      ${issues.map(
        (i) => html`<li class="ui-mset__issue" data-kind=${i.kind}>
          ${i.kind === "conflict" ? alertIcon() : infoIcon()}
          <span class="ui-mset__issue-text">${i.message}</span>
          ${i.kind === "ignored"
            ? html`<button type="button" class="ui-mset__btn" ?disabled=${this.isDisabled} @click=${() => this.reset(i.params, `Cleared ${i.params.join(", ")}`)}>Clear</button>`
            : nothing}
        </li>`,
      )}
    </ul>`;
  }

  private renderSummary() {
    const changes = this.changes;
    const r = this.resolved;
    return html`<div class="ui-mset__summary" data-state=${changes.length ? "changed" : "default"}>
      <p class="ui-mset__summary-text">
        ${changes.length
          ? html`<span class="ui-mset__summary-lead">${changes.length === 1 ? "1 change" : `${changes.length} changes`} from the defaults:</span>
              ${changes.map(
                (p, i) => html`${i ? html`<span class="ui-mset__sep" aria-hidden="true"> · </span>` : nothing}<span class="ui-mset__change"
                    ><span class="ui-mset__change-name">${p.label}</span> ${formatModelParam(p, r[p.id])}<span class="ui-mset__was"
                      >, was ${formatModelParam(p, this.defaultOf(p))}</span
                    ></span
                  >`,
              )}`
          : html`<span class="ui-mset__summary-lead">Everything is at ${this.model ? `${this.model.label}'s` : "the"} defaults.</span>`}
      </p>
      ${changes.length
        ? html`<button type="button" class="ui-mset__btn ui-mset__reset-all" ?disabled=${this.isDisabled} @click=${() => this.reset(changes.map((p) => p.id), "Every setting is back to its default")}>${resetIcon()}Reset all</button>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const shown = this.supported;
    const hidden = this.model ? this.parameters.filter((p) => !this.model!.supports.includes(p.id)) : [];
    // The header (.tc-head): on the tray above the card in Standard, the card's first row in Clean
    const head = cardHead({
      icon: slidersIcon,
      title: this.heading,
      id: `${this.uid}-h`,
      subtitle: this.model ? html`<span class="ui-mset__model-name">${this.model.label}</span>${this.model.description ? html` · ${this.model.description}` : nothing}` : undefined,
    });
    const body = html`
      ${this.signature ? this.renderProfile() : nothing} ${this.renderPresets(look)}
      ${shown.length
        ? html`<ul class="ui-mset__params" aria-label="Parameters">
            ${repeat(
              shown,
              (p) => p.id,
              (p) => this.renderParam(p, look),
            )}
          </ul>`
        : html`<p class="ui-mset__empty">${this.model?.label ?? "This model"} has no settings to change.</p>`}
      ${hidden.length ? html`<p class="ui-mset__unsupported">Not available for ${this.model!.label}: ${list(hidden.map((p) => p.label.toLowerCase()))}.</p>` : nothing}
      ${this.renderIssues()} ${this.renderSummary()}
    `;
    return html`<span class="ui-mset__sr" role="status">${this.announcement}</span>${head}${clean ? body : html`<div class="ui-mset__card">${body}</div>`}`;
  }

  static override css = /* css */ `
[data-ui="mset"] {
  display: flow-root;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="mset"] *, [data-ui="mset"] *::before, [data-ui="mset"] *::after { box-sizing: border-box; }
:where([data-ui="mset"]) :is(p, ul) { margin: 0; padding: 0; }
:where([data-ui="mset"]) ul { list-style: none; }
:where([data-ui="mset"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="mset"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="mset"] button:disabled { cursor: not-allowed; opacity: 0.55; }
/* Standard: a gray tray around a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mset"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-mset__card { display: flow-root; padding-top: var(--tc-space-1); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one white card with hairline shadows */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mset"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-mset__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-mset__btn-icon, .ui-mset__issue-icon { flex: none; width: 14px; height: 14px; stroke-width: 1.75; }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-mset__btn-icon, .ui-mset__issue-icon) { stroke-width: 1.5; }

/* ---------- In the header's subtitle: the model's name stands out ---------- */
.ui-mset__model-name { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }

/* ---------- The signature: values against their ranges ---------- */
.ui-mset__profile { display: grid; gap: var(--tc-space-2); margin: var(--tc-space-3) var(--tc-space-4) 0; padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-2-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__profile { border-radius: var(--tc-radius-md); background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-mset__sig-row { display: grid; grid-template-columns: minmax(0, 7.5rem) minmax(0, 1fr) minmax(4.5rem, auto); align-items: end; gap: var(--tc-space-3); min-height: var(--tc-space-7); }
.ui-mset__sig-name { overflow: hidden; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); white-space: nowrap; text-overflow: ellipsis; }
.ui-mset__sig-val { color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.ui-mset__sig-row[data-changed] .ui-mset__sig-val { color: var(--tc-accent-text); }
/* A range: a thin track, the value filled in, the default a tick, presets as letters above */
.ui-mset__sig-track { position: relative; height: var(--tc-space-5); }
.ui-mset__sig-track::before { content: ""; position: absolute; right: 0; bottom: var(--tc-space-1); left: 0; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-mset__sig-fill { position: absolute; bottom: var(--tc-space-1); left: 0; width: calc(var(--at) * 100%); height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-fill); transition: width var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__sig-fill { background: var(--tc-accent); }
.ui-mset__sig-default { position: absolute; bottom: 0; left: calc(var(--at) * 100%); width: 1px; height: calc(var(--tc-meter-h) + var(--tc-space-2)); background: var(--tc-text-muted); }
.ui-mset__sig-dot { position: absolute; bottom: calc(var(--tc-space-1) + var(--tc-meter-h) / 2); left: calc(var(--at) * 100%); width: 10px; height: 10px; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: 0 0 0 2px var(--tc-accent), var(--tc-shadow-control); transform: translate(-50%, 50%); transition: left var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-mset__mk { display: inline-grid; place-items: center; min-width: var(--tc-space-3-5); height: var(--tc-space-3-5); padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); color: var(--tc-text-muted); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); }
.ui-mset__mk[data-on] { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__mk[data-on] { background: var(--tc-accent); color: var(--tc-text-on-accent); }
.ui-mset__mk--on-track { position: absolute; bottom: calc(var(--tc-space-1) + var(--tc-meter-h) + var(--tc-space-1)); left: calc(var(--at) * 100%); transform: translateX(-50%); }
/* A choice: one cell per option, the current one filled */
.ui-mset__pips { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: var(--tc-space-1); }
.ui-mset__pip { position: relative; display: grid; justify-items: center; align-content: end; gap: var(--tc-space-1); height: var(--tc-space-5); }
.ui-mset__pip::after { content: ""; align-self: end; width: 100%; height: var(--tc-meter-h); margin-bottom: var(--tc-space-1); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-mset__pip[data-on]::after { background: var(--tc-meter-fill); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__pip[data-on]::after { background: var(--tc-accent); }
.ui-mset__pip-marks { display: flex; gap: var(--tc-space-0-5); }
.ui-mset__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); padding-top: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-mset__key { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-mset__key-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: 0 0 0 2px var(--tc-accent); }
.ui-mset__key-tick { width: 1px; height: var(--tc-space-2-5); background: var(--tc-text-muted); }

/* ---------- Presets ---------- */
.ui-mset__presets { display: grid; justify-items: start; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
.ui-mset__section-label { color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-mset__seg { max-width: 100%; }
.ui-mset__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }

/* ---------- Parameters ---------- */
.ui-mset__params { display: grid; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mset__param { display: grid; gap: var(--tc-space-1-5); min-width: 0; padding: var(--tc-space-3-5) var(--tc-space-4); }
.ui-mset__param + .ui-mset__param { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mset__param-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-height: var(--tc-control-h-sm); }
.ui-mset__label { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__label { font-weight: var(--tc-font-weight-regular); }
.ui-mset__value { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-mset__value { background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__value { padding: 0; color: var(--tc-text-secondary); }
.ui-mset__param[data-changed] .ui-mset__value { color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-mset__param[data-changed] .ui-mset__value { background: var(--tc-accent-subtle); }
.ui-mset__is-default { margin-left: auto; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-mset__reset { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); margin-right: calc(-1 * var(--tc-space-2)); }
.ui-mset__reset:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-mset__desc { max-width: 60ch; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mset__param[data-flagged] .ui-mset__label::after { content: ""; display: inline-block; width: 6px; height: 6px; margin-left: var(--tc-space-1-5); border-radius: 50%; background: var(--tc-status-warning-solid); vertical-align: middle; }
/* The slider: a native range on the meter tokens; a tick marks the default */
.ui-mset__track { position: relative; margin-top: var(--tc-space-1); }
.ui-mset__range { display: block; width: 100%; height: 20px; margin: 0; background: transparent; cursor: pointer; appearance: none; -webkit-appearance: none; }
.ui-mset__range:disabled { cursor: not-allowed; opacity: 0.55; }
.ui-mset__range::-webkit-slider-runnable-track { height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: linear-gradient(to right, var(--tc-meter-fill) var(--fill), var(--tc-meter-track) var(--fill)); }
.ui-mset__range::-moz-range-track { height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: linear-gradient(to right, var(--tc-meter-fill) var(--fill), var(--tc-meter-track) var(--fill)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__range::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--tc-accent) var(--fill), var(--tc-meter-track) var(--fill)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__range::-moz-range-track { background: linear-gradient(to right, var(--tc-accent) var(--fill), var(--tc-meter-track) var(--fill)); }
.ui-mset__range::-webkit-slider-thumb { width: 16px; height: 16px; margin-top: calc((var(--tc-meter-h) - var(--tc-space-4)) / 2); border: 0; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control), 0 0 0 1px var(--tc-border-control); appearance: none; -webkit-appearance: none; }
.ui-mset__range::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control), 0 0 0 1px var(--tc-border-control); }
.ui-mset__range:focus-visible { outline: none; }
.ui-mset__range:focus-visible::-webkit-slider-thumb { box-shadow: var(--tc-shadow-control), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-mset__range:focus-visible::-moz-range-thumb { box-shadow: var(--tc-shadow-control), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-mset__default-tick { position: absolute; top: calc(50% + var(--tc-meter-h) / 2 + var(--tc-space-0-5)); left: calc(8px + (100% - 16px) * var(--default-at, 0)); width: 1px; height: 4px; background: var(--tc-icon-muted); pointer-events: none; }
.ui-mset__ends { display: flex; justify-content: space-between; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }

/* ---------- Feedback ---------- */
.ui-mset__unsupported { padding: 0 var(--tc-space-4) var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mset__empty { padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); }
.ui-mset__issues { display: grid; gap: var(--tc-space-2); padding: 0 var(--tc-space-4) var(--tc-space-3); }
.ui-mset__issue { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); animation: ui-mset-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-mset__issue[data-kind="conflict"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-mset__issue[data-kind="ignored"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-mset__issue .ui-mset__issue-icon { margin-top: var(--tc-space-0-5); }
.ui-mset__issue-text { flex: 1; min-width: 0; }
.ui-mset__issue .ui-mset__btn { height: var(--tc-control-h-sm); margin: calc(-1 * var(--tc-space-1)) calc(-1 * var(--tc-space-1)) calc(-1 * var(--tc-space-1)) 0; }

/* ---------- What differs from the defaults ---------- */
.ui-mset__summary { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); margin: 0 var(--tc-space-4) var(--tc-space-4); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__summary { border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-mset__summary[data-state="changed"] { background: var(--tc-accent-subtle); }
.ui-mset__summary-text { flex: 1 1 16rem; min-width: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mset__summary-lead { color: var(--tc-text-primary); }
.ui-mset__summary[data-state="default"] .ui-mset__summary-lead { color: var(--tc-text-muted); }
.ui-mset__change { white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-mset__change-name { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-mset__was { color: var(--tc-text-muted); }
.ui-mset__btn { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mset__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
@keyframes ui-mset-in { from { opacity: 0; transform: translateY(3px); } }

/* Narrow: tighter sides */
@container (max-width: 400px) {
  .ui-mset__presets, .ui-mset__param, .ui-mset__unsupported, .ui-mset__issues { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-mset__summary, .ui-mset__profile { margin-left: var(--tc-space-3); margin-right: var(--tc-space-3); }
  .ui-mset__sig-row { grid-template-columns: minmax(0, 1fr) minmax(4rem, auto); grid-template-areas: "name val" "track track"; gap: var(--tc-space-0-5) var(--tc-space-2); }
  .ui-mset__sig-name { grid-area: name; }
  .ui-mset__sig-val { grid-area: val; }
  .ui-mset__sig-track, .ui-mset__pips { grid-area: track; }
  .ui-mset__change { white-space: normal; }
}
@media (pointer: coarse) {
  .ui-mset__btn, .ui-mset__reset { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mset"] *, [data-ui="mset"] *::before, [data-ui="mset"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-model-settings")) customElements.define("tc-model-settings", TcModelSettings);

declare global {
  interface HTMLElementTagNameMap {
    "tc-model-settings": TcModelSettings;
  }
}
