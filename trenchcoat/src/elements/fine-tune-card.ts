import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-fine-tune-card> – an inspector where an agent tunes a design and the person can take over. Sections of fields –
 * numbers with a unit (W, H, Radius), a percentage (Opacity), a choice (Type) and colour swatches – under a small
 * preview that follows width, height, radius, opacity and fill. Adjust asks the agent to tune (tc-adjust-request); when
 * it changes a field (`agentChanges`, or applyAgentChange()), the value counts to its new number with a brief
 * highlight and an Agent marker that stays until the person edits that field. Revert agent changes puts them all back.
 *   · a number's label is a scrub handle: drag it sideways, or focus it and use the arrows (Shift for ×10)
 *   · in a number's box, ↑ / ↓ step (Shift ×10), Enter or leaving it commits, Escape restores
 *   · the swatches are a radio group: one tab stop, arrows move and choose
 *   · `values` can be controlled: every change asks first with tc-values-change, saying who made it
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-fine-tune-card heading="Findings summary" .sections=${[…]} .values=${{ w: 320 }}></tc-fine-tune-card>
 */

type FieldBase = {
  /** The key in `values` */
  id: string;
  /** The short label shown, such as "W" */
  label: string;
  /** The full name screen readers hear, such as "Width"; by default the label */
  name?: string;
};
export type FineTuneField =
  | (FieldBase & { kind: "number"; unit?: string; min?: number; max?: number; step?: number })
  | (FieldBase & { kind: "percent" })
  | (FieldBase & { kind: "select"; options: FineTuneOption[] })
  | (FieldBase & { kind: "color"; options: FineTuneOption[] });
export type FineTuneOption = { value: string; label: string };
export type FineTuneSection = { label: string; fields: FineTuneField[] };
export type FineTuneValues = Record<string, number | string>;
export type FineTuneAgentChange = { field: string; to: number | string };
/** Which fields the preview follows, by field id */
export type FineTunePreview = { width?: string; height?: string; radius?: string; opacity?: string; fill?: string; type?: string };
export type FineTuneLabels = { adjust: string; adjusting: string; agent: string; revert: string; preview: string };

/** Details of the events */
export type FineTuneValuesChange = { values: FineTuneValues; field: string | null; source: "person" | "agent" | "revert" };
export type FineTuneAdjustRequest = { heading: string };

/** The words used when the page gives none */
export const defaultFineTuneLabels: FineTuneLabels = {
  adjust: "Adjust",
  adjusting: "Adjusting…",
  agent: "Agent",
  revert: "Revert agent changes",
  preview: "Preview",
};
const DEFAULT_PREVIEW: FineTunePreview = { width: "w", height: "h", radius: "radius", opacity: "opacity", fill: "fill", type: "type" };
/** The preview's room, in px: a bigger design is drawn smaller */
const ROOM = { width: 220, height: 96 };
/** How long a number takes to count to the agent's value */
const TWEEN_MS = 420;

/* The header's icon and the agent's spark: Lucide (ISC, lucide.dev) */
const headIcon = svg`<path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle>`;
const spark = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
  >${svg`<path d="M9.94 14.06 4 20M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z"></path>`}</svg
>`;

const bounds = (f: FineTuneField) =>
  f.kind === "percent" ? { min: 0, max: 100, step: 1, unit: "%" } : f.kind === "number" ? { min: f.min ?? -Infinity, max: f.max ?? Infinity, step: f.step ?? 1, unit: f.unit ?? "" } : null;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round = (n: number, step: number) => {
  const places = (String(step).split(".")[1] ?? "").length;
  return Number((Math.round(n / step) * step).toFixed(places));
};

let uid = 0;

/**
 * An inspector where an agent tunes a design's properties and the person can take over: numbers, a percentage, a choice and swatches, a live preview, Agent markers and a revert.
 * @tag tc-fine-tune-card
 * @fires tc-values-change - A field changed, by the person, the agent or a revert ({ values, field, source }: FineTuneValuesChange); cancelable – prevented, `values` stays as it was
 * @fires tc-adjust-request - Adjust was pressed: the page should ask its agent to tune ({ heading }: FineTuneAdjustRequest)
 */
export class TcFineTuneCard extends TcElement {
  static override ui = "ftc";

  /** What's being tuned, such as "Findings summary"; empty draws no header */
  @property() accessor heading = "Fine-tune";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The fields, in sections */
  @property({ attribute: false }) accessor sections: FineTuneSection[] = [];
  /** Each field's value by its id. Changed by the fields unless a tc-values-change listener calls preventDefault() */
  @property({ attribute: false }) accessor values: FineTuneValues = {};
  /** Changes the agent made; each new list is applied, counted in and marked */
  @property({ attribute: false }) accessor agentChanges: FineTuneAgentChange[] = [];
  /** The agent is working: Adjust says so and waits */
  @property({ type: Boolean, reflect: true }) accessor adjusting = false;
  /** Which fields the preview follows, by id; an empty object hides the preview */
  @property({ attribute: false }) accessor preview: FineTunePreview = DEFAULT_PREVIEW;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<FineTuneLabels> = {};

  /** Fields the agent set, with its value and what was there before */
  @state() private accessor marked: Record<string, { to: number | string; before: number | string | undefined }> = {};
  /** Numbers counting towards the agent's value */
  @state() private accessor shown: Record<string, number> = {};
  /** Fields flashing after an agent change */
  @state() private accessor flashing: string[] = [];

  private readonly key = `tc-ftc-${++uid}`;
  /** Agent changes proposed, not yet seen in `values` */
  private awaiting = new Map<string, { to: number | string; before: number | string | undefined }>();
  private seen: FineTuneValues = this.values;
  private frame = 0;
  /** Numbers counting: from, to, and the first frame's time */
  private runs: Record<string, [number, number, number | null]> = {};
  private scrub: { id: string; x: number; start: number } | null = null;

  private word<K extends keyof FineTuneLabels>(key: K) {
    return this.labels[key] ?? defaultFineTuneLabels[key];
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private get fields() {
    return this.sections.flatMap((s) => s.fields);
  }
  private valueOf(f: FineTuneField): number | string {
    const v = this.values[f.id];
    if (v !== undefined) return v;
    const b = bounds(f);
    if (b) return Number.isFinite(b.min) ? b.min : 0;
    return (f as { options: FineTuneOption[] }).options[0]?.value ?? "";
  }

  /* ---------- Changes ---------- */

  private propose(field: string | null, values: FineTuneValues, source: FineTuneValuesChange["source"]) {
    if (!this.emit<FineTuneValuesChange>("tc-values-change", { values, field, source }, { cancelable: true })) return false;
    this.values = values;
    return true;
  }
  /** A change the person made */
  private set(f: FineTuneField, raw: number | string) {
    const b = bounds(f);
    const next = b ? clamp(round(Number(raw), b.step), b.min, b.max) : raw;
    if (b && !Number.isFinite(next as number)) return;
    if (next === this.valueOf(f)) return;
    this.propose(f.id, { ...this.values, [f.id]: next }, "person");
  }
  /** Applies one change from the agent: it counts in, flashes and is marked until the person edits the field */
  applyAgentChange(field: string, to: number | string) {
    this.applyAgentChanges([{ field, to }]);
  }
  /** Applies several of the agent's changes as one change to `values` */
  applyAgentChanges(changes: FineTuneAgentChange[]) {
    const values = { ...this.values };
    const applied: string[] = [];
    for (const { field, to } of changes) {
      const f = this.fields.find((x) => x.id === field);
      if (!f || to === this.valueOf(f)) continue;
      this.awaiting.set(field, { to, before: this.marked[field]?.before ?? this.values[field] });
      values[field] = to;
      applied.push(field);
    }
    if (applied.length) this.propose(applied.length === 1 ? applied[0] : null, values, "agent");
  }
  /** Puts back every value the agent changed */
  revertAgentChanges() {
    const entries = Object.entries(this.marked);
    if (!entries.length) return;
    const values = { ...this.values };
    for (const [id, m] of entries) {
      if (m.before === undefined) delete values[id];
      else values[id] = m.before;
    }
    this.propose(null, values, "revert");
  }

  /** Values arrived (set here or by the page): mark the agent's, unmark any the person changed since */
  private reconcile(before: FineTuneValues) {
    const marked = { ...this.marked };
    const flash: string[] = [];
    for (const [id, m] of this.awaiting) {
      if (this.values[id] !== m.to) continue;
      marked[id] = m;
      flash.push(id);
      this.awaiting.delete(id);
      const from = Number(before[id] ?? m.before);
      if (typeof m.to === "number" && Number.isFinite(from) && from !== m.to) this.tween(id, from, m.to);
    }
    for (const id of Object.keys(marked)) if (this.values[id] !== marked[id].to) delete marked[id];
    this.marked = marked;
    if (flash.length) this.flashing = [...new Set([...this.flashing, ...flash])];
  }

  /** Counts a number from where it was to the agent's value */
  private tween(id: string, from: number, to: number) {
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.runs[id] = [from, to, null];
    this.shown = { ...this.shown, [id]: from };
    if (this.frame) return;
    const step = (t: number) => {
      const all = this.runs;
      const shown: Record<string, number> = {};
      for (const [k, run] of Object.entries(all)) {
        run[2] ??= t;
        const p = Math.min(1, (t - run[2]) / TWEEN_MS);
        if (p >= 1) delete all[k];
        else shown[k] = run[0] + (run[1] - run[0]) * (1 - (1 - p) ** 3);
      }
      this.shown = shown;
      this.frame = Object.keys(all).length ? requestAnimationFrame(step) : 0;
    };
    this.frame = requestAnimationFrame(step);
  }

  private endFlash(id: string) {
    this.flashing = this.flashing.filter((x) => x !== id);
  }

  /* ---------- Inputs ---------- */

  private onNumberKey(f: FineTuneField, e: KeyboardEvent) {
    const b = bounds(f)!;
    const input = e.currentTarget as HTMLInputElement;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const base = Number(input.value);
      const from = Number.isFinite(base) ? base : Number(this.valueOf(f));
      this.set(f, from + (e.key === "ArrowUp" ? 1 : -1) * b.step * (e.shiftKey ? 10 : 1));
      input.value = String(this.valueOf(f));
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.commitInput(f, input);
    } else if (e.key === "Escape") {
      input.value = String(this.valueOf(f));
    }
  }
  private commitInput(f: FineTuneField, input: HTMLInputElement) {
    const n = parseFloat(input.value.replace(",", "."));
    if (Number.isFinite(n)) this.set(f, n);
    input.value = String(this.valueOf(f));
  }
  private onScrubKey(f: FineTuneField, e: KeyboardEvent) {
    const b = bounds(f)!;
    const dir = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    const v = Number(this.valueOf(f));
    if (dir) {
      e.preventDefault();
      this.set(f, v + dir * b.step * (e.shiftKey ? 10 : 1));
    } else if (e.key === "Home" && Number.isFinite(b.min)) {
      e.preventDefault();
      this.set(f, b.min);
    } else if (e.key === "End" && Number.isFinite(b.max)) {
      e.preventDefault();
      this.set(f, b.max);
    }
  }
  private onScrubDown(f: FineTuneField, e: PointerEvent) {
    if (e.button !== 0) return;
    // Capture keeps the drag going off the handle; a pointer that's already gone can't be captured, and needn't be
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* the drag still works while the pointer stays over the handle */
    }
    this.scrub = { id: f.id, x: e.clientX, start: Number(this.valueOf(f)) };
  }
  private onScrubMove(f: FineTuneField, e: PointerEvent) {
    if (!this.scrub || this.scrub.id !== f.id) return;
    const b = bounds(f)!;
    // Two pixels a step; Shift for ten
    this.set(f, this.scrub.start + Math.round((e.clientX - this.scrub.x) / 2) * b.step * (e.shiftKey ? 10 : 1));
  }
  private onScrubUp = () => {
    this.scrub = null;
  };
  private onSwatchKey(f: FineTuneField & { options: FineTuneOption[] }, e: KeyboardEvent) {
    const i = f.options.findIndex((o) => o.value === this.valueOf(f));
    const n = f.options.length;
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined || !n) return;
    e.preventDefault();
    const next = f.options[(to + n) % n];
    this.set(f, next.value);
    const group = e.currentTarget as HTMLElement;
    void this.updateComplete.then(() => group.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus());
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.values !== this.seen) {
      const before = this.seen;
      this.seen = this.values;
      this.reconcile(before);
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (changed.has("agentChanges") && this.agentChanges.length) this.applyAgentChanges(this.agentChanges);
  }

  /* ---------- Rendering ---------- */

  private renderField(f: FineTuneField) {
    const id = `${this.key}-${f.id}`;
    const name = f.name ?? f.label;
    const agent = this.marked[f.id];
    const flags = { agent: !!agent, flash: this.flashing.includes(f.id) };
    const marker = agent
      ? html`<span class="ui-ftc__agent">${spark}<span>${this.word("agent")}</span></span>`
      : nothing;
    const row = (control: unknown, label: unknown) =>
      html`<div class="ui-ftc__field" data-field=${f.id} data-kind=${f.kind} ?data-agent=${flags.agent} ?data-flash=${flags.flash} @animationend=${(e: AnimationEvent) => e.animationName === "ui-ftc-flash" && this.endFlash(f.id)}>
        ${label}${control}${marker}
      </div>`;
    const b = bounds(f);
    if (b) {
      const v = Number(this.valueOf(f));
      const shown = this.shown[f.id];
      const display = shown === undefined ? String(v) : String(Math.round(shown / b.step) * b.step).replace(/(\.\d{0,3})\d+$/, "$1");
      return row(
        html`<span class="ui-ftc__box"
          ><input
            class="ui-ftc__input"
            id=${id}
            type="text"
            inputmode="decimal"
            autocomplete="off"
            spellcheck="false"
            aria-label=${b.unit ? `${name} (${b.unit})` : name}
            .value=${display}
            @keydown=${(e: KeyboardEvent) => this.onNumberKey(f, e)}
            @change=${(e: Event) => this.commitInput(f, e.currentTarget as HTMLInputElement)}
          />${b.unit ? html`<span class="ui-ftc__unit" aria-hidden="true">${b.unit}</span>` : nothing}</span
        >`,
        html`<span
          class="ui-ftc__scrub"
          role="slider"
          tabindex="0"
          aria-label=${name}
          aria-valuenow=${v}
          aria-valuemin=${Number.isFinite(b.min) ? b.min : nothing}
          aria-valuemax=${Number.isFinite(b.max) ? b.max : nothing}
          aria-valuetext=${`${v}${b.unit === "%" ? "%" : b.unit ? ` ${b.unit}` : ""}`}
          @keydown=${(e: KeyboardEvent) => this.onScrubKey(f, e)}
          @pointerdown=${(e: PointerEvent) => this.onScrubDown(f, e)}
          @pointermove=${(e: PointerEvent) => this.onScrubMove(f, e)}
          @pointerup=${this.onScrubUp}
          @pointercancel=${this.onScrubUp}
          ><span aria-hidden="true">${f.label}</span></span
        >`,
      );
    }
    const options = (f as { options: FineTuneOption[] }).options;
    const v = String(this.valueOf(f));
    if (f.kind === "select")
      return row(
        html`<span class="ui-ftc__box ui-ftc__box--select"
          ><select class="ui-ftc__select" id=${id} @change=${(e: Event) => this.set(f, (e.currentTarget as HTMLSelectElement).value)}>
            ${options.map((o) => html`<option value=${o.value} ?selected=${o.value === v}>${o.label}</option>`)}
          </select></span
        >`,
        html`<label class="ui-ftc__label" for=${id}><span aria-hidden="true">${f.label}</span><span class="ui-ftc__sr">${name}</span></label>`,
      );
    const labelId = `${id}-label`;
    const current = options.some((o) => o.value === v) ? v : options[0]?.value;
    return row(
      html`<span class="ui-ftc__swatches" role="radiogroup" aria-labelledby=${labelId} @keydown=${(e: KeyboardEvent) => this.onSwatchKey(f as FineTuneField & { options: FineTuneOption[] }, e)}>
        ${options.map(
          (o) => html`<button
            type="button"
            role="radio"
            class="ui-ftc__swatch"
            data-value=${o.value}
            aria-checked=${o.value === v ? "true" : "false"}
            tabindex=${o.value === current ? 0 : -1}
            style=${styleMap({ "--tc-ftc-swatch": o.value })}
            @click=${() => this.set(f, o.value)}
          ><span class="ui-ftc__sr">${o.label}</span></button>`,
        )}
      </span>`,
      html`<span class="ui-ftc__label" id=${labelId}><span aria-hidden="true">${f.label}</span><span class="ui-ftc__sr">${name}</span></span>`,
    );
  }

  private renderPreview() {
    const p = this.preview;
    if (!Object.keys(p).length) return nothing;
    const num = (id: string | undefined, fallback: number) => {
      if (!id) return fallback;
      const shown = this.shown[id];
      const v = shown ?? Number(this.values[id]);
      return Number.isFinite(v) ? v : fallback;
    };
    const w = Math.max(1, num(p.width, ROOM.width));
    const h = Math.max(1, num(p.height, ROOM.height));
    const scale = Math.min(1, ROOM.width / w, ROOM.height / h);
    const fill = p.fill ? this.values[p.fill] : undefined;
    const style = {
      width: `${Math.round(w * scale)}px`,
      height: `${Math.round(h * scale)}px`,
      "border-radius": `${Math.round(num(p.radius, 0) * scale)}px`,
      opacity: String(clamp(num(p.opacity, 100), 0, 100) / 100),
      ...(typeof fill === "string" && fill ? { "--tc-ftc-fill": fill } : {}),
    };
    const type = p.type ? String(this.values[p.type] ?? "") : "";
    return html`<div class="ui-ftc__preview" aria-hidden="true">
      <div class="ui-ftc__shape" data-type=${type} style=${styleMap(style)}>
        <span class="ui-ftc__line ui-ftc__line--title"></span><span class="ui-ftc__line"></span><span class="ui-ftc__line ui-ftc__line--short"></span>
      </div>
    </div>`;
  }

  protected override render() {
    const count = Object.keys(this.marked).length;
    const adjust = html`<button
      type="button"
      class="ui-ftc__adjust"
      aria-disabled=${this.adjusting ? "true" : "false"}
      @click=${() => !this.adjusting && this.emit<FineTuneAdjustRequest>("tc-adjust-request", { heading: this.heading })}
    >${spark}<span>${this.word(this.adjusting ? "adjusting" : "adjust")}</span></button>`;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside: adjust }) : nothing}
      <div class="ui-ftc__card">
        ${this.heading ? nothing : html`<div class="ui-ftc__bar">${adjust}</div>`} ${this.renderPreview()}
        ${this.sections.map(
          (s, i) => html`<fieldset class="ui-ftc__section">
            <legend class="ui-ftc__legend" id=${`${this.key}-s${i}`}>${s.label}</legend>
            <div class="ui-ftc__grid">${s.fields.map((f) => this.renderField(f))}</div>
          </fieldset>`,
        )}
        ${count
          ? html`<div class="ui-ftc__foot">
              <button type="button" class="ui-ftc__revert" @click=${() => this.revertAgentChanges()}>${this.word("revert")} (${count})</button>
            </div>`
          : nothing}
        <span class="ui-ftc__sr" role="status">${this.adjusting ? this.word("adjusting") : ""}</span>
      </div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ftc"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ftc"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="ftc"] *, [data-ui="ftc"] *::before, [data-ui="ftc"] *::after { box-sizing: border-box; }
:where([data-ui="ftc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ftc"] :is(button, .ui-ftc__scrub):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="ftc"] svg { display: block; flex: none; }
.ui-ftc__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ui-ftc__card { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-ftc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-ftc__adjust { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-ftc__adjust:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ftc__adjust svg { color: var(--tc-accent); }
.ui-ftc__adjust[aria-disabled="true"] { color: var(--tc-text-muted); cursor: progress; }
.ui-ftc__bar { display: flex; justify-content: flex-end; padding: var(--tc-space-2) var(--tc-space-3) 0; }
/* The preview: the design drawn small on a sunken well */
.ui-ftc__preview { display: grid; place-items: center; min-height: calc(96px + var(--tc-space-6)); margin: var(--tc-space-3); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
.ui-ftc__shape { display: grid; align-content: start; gap: var(--tc-space-1-5); padding: var(--tc-space-3); overflow: hidden; background: var(--tc-ftc-fill, var(--tc-surface-raised)); box-shadow: var(--tc-shadow-raised); transition: width var(--tc-duration-moderate) var(--tc-ease-move), height var(--tc-duration-moderate) var(--tc-ease-move), border-radius var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-move), background-color var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-ftc__line { display: block; height: var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); }
.ui-ftc__line--title { width: 60%; height: var(--tc-space-2-5); background: var(--tc-text-secondary); }
.ui-ftc__line--short { width: 45%; }
.ui-ftc__shape[data-type="Heading"] .ui-ftc__line--title, .ui-ftc__shape[data-type="heading"] .ui-ftc__line--title { width: 75%; height: var(--tc-space-3-5); }
.ui-ftc__shape[data-type="Caption"] .ui-ftc__line--title, .ui-ftc__shape[data-type="caption"] .ui-ftc__line--title { width: 40%; height: var(--tc-space-1-5); }
/* Sections */
.ui-ftc__section { margin: 0; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); border: 0; border-top: var(--tc-hairline) solid var(--tc-divider); min-width: 0; }
.ui-ftc__legend { float: left; width: 100%; margin: 0 0 var(--tc-space-2); padding: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-ftc__grid { clear: both; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-2); }
.ui-ftc__field { position: relative; display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1) 0 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg-sunken); }
.ui-ftc__field[data-kind="select"], .ui-ftc__field[data-kind="color"] { grid-column: 1 / -1; }
.ui-ftc__field[data-kind="color"] { background: none; }
.ui-ftc__scrub, .ui-ftc__label { flex: none; display: grid; place-items: center; min-width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); user-select: none; }
.ui-ftc__scrub { cursor: ew-resize; touch-action: none; }
.ui-ftc__scrub:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-ftc__field[data-kind="color"] .ui-ftc__label { place-items: center start; padding: 0; }
.ui-ftc__box { display: flex; align-items: center; flex: 1 1 auto; min-width: 0; }
.ui-ftc__input, .ui-ftc__select { width: 100%; min-width: 0; height: var(--tc-control-h-sm); margin: 0; padding: 0; border: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-ftc__input:focus-visible, .ui-ftc__select:focus-visible { outline: none; }
.ui-ftc__field:focus-within:not([data-kind="color"]) { box-shadow: var(--tc-field-shadow-focus); }
.ui-ftc__select { cursor: pointer; }
.ui-ftc__unit { flex: none; padding-right: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-ftc__swatches { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-ftc__swatch { width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-full); background: var(--tc-ftc-swatch); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-ftc__swatch[aria-checked="true"] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong), 0 0 0 2px var(--tc-surface-raised), 0 0 0 4px var(--tc-text-primary); }
/* The agent's change: a brief highlight, then a marker until the person edits the field */
.ui-ftc__agent { flex: none; display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-ftc__field[data-flash] { animation: ui-ftc-flash var(--tc-duration-reveal) var(--tc-ease-standard); }
@keyframes ui-ftc-flash {
  from { box-shadow: 0 0 0 2px var(--tc-accent); }
  to { box-shadow: 0 0 0 2px transparent; }
}
.ui-ftc__foot { display: flex; justify-content: flex-end; padding: var(--tc-space-2) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ftc__revert { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); color: var(--tc-accent-text); font-size: var(--tc-font-size-sm); text-decoration: underline; text-underline-offset: 0.2em; }
.ui-ftc__revert:hover { background: var(--tc-fill-hover); }
@container (max-width: 20rem) {
  .ui-ftc__grid { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ftc__shape { transition: none; }
  .ui-ftc__field[data-flash] { animation: none; }
}
@media (forced-colors: active) {
  .ui-ftc__swatch { forced-color-adjust: none; border: 1px solid CanvasText; }
  .ui-ftc__swatch[aria-checked="true"] { outline: 2px solid Highlight; }
  .ui-ftc__agent { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-fine-tune-card")) customElements.define("tc-fine-tune-card", TcFineTuneCard);
declare global {
  interface HTMLElementTagNameMap {
    "tc-fine-tune-card": TcFineTuneCard;
  }
}
