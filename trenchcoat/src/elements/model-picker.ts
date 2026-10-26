import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { RollingController } from "./internal/controllers";

/*
 * <tc-model-picker> – the Lit port of src/components/model-picker.tsx: the model menu of an AI chat.
 * A small trigger (glyph, model name, chevron) sits in your composer toolbar; it opens a menu that unfolds softly from it:
 *   · one row per model with three tiny strength bars – Speed, Quality, Cost. Point at a row and its bars fill
 *   · Extended thinking and Web search as switches; the Effort control (Low / Medium / High) unfolds under thinking
 *   · the line on the gray tray says what the model you point at costs you – first-token time and price –
 *     and its numbers roll when the model or the effort changes
 *   · arrows move, Enter picks, Tab reaches the switches, Esc or a click outside closes
 *
 *   <tc-model-picker value="atlas" .models=${[{ id: "atlas", name: "Atlas", speed: 4, quality: 4, cost: 3 }]}></tc-model-picker>
 *
 * Clean drops the gray tray: one white popover with hairline shadows and a blue accent, whose last row holds the cost
 * line; its icons are a size larger with thinner lines, and the Effort fill is measured to sit under its level.
 */

export type PickerModel = {
  id: string;
  name: string;
  /** One short line under the name, e.g. "Hardest problems" */
  description?: string;
  /** Glyph in front of the name – an element that's cloned, sized to 18px. Defaults to the first letter on a soft tile */
  icon?: Element;
  /** Strengths from 1 to 5. Cost 5 is the most expensive. Leave all three out for a router like "Auto" */
  speed?: number;
  quality?: number;
  cost?: number;
  /** Typical time to the first token without extended thinking, in milliseconds */
  latencyMs?: number;
  /** Price per million output tokens, in dollars */
  pricePerM?: number;
};

export type ModelEffort = "low" | "medium" | "high";

/* ---------- Helpers ---------- */

const EFFORTS: { id: ModelEffort; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];
/** How much longer the first token takes while the model thinks first */
const THINK_FACTOR: Record<ModelEffort, number> = { low: 1.6, medium: 2.5, high: 4 };
const STRENGTHS = [
  { key: "speed", label: "Speed" },
  { key: "quality", label: "Quality" },
  { key: "cost", label: "Cost" },
] as const;

const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n)));
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const dollars = (n: number, target: number) => `$${n.toFixed(Number.isInteger(target) ? 0 : 2)}`;

/* ---------- Icons (Clean draws them a size larger, with thinner lines) ---------- */

const chevronIcon = (clean: boolean) =>
  html`<svg class="ui-mdp__chevron" width=${clean ? 14 : 12} height=${clean ? 14 : 12} viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<path d="m3 4.5 3 3 3-3" stroke="currentColor" stroke-width=${clean ? 1.2 : 1.4} stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const checkIcon = (clean: boolean) =>
  html`<svg class="ui-mdp__check" width=${clean ? 16 : 14} height=${clean ? 16 : 14} viewBox="0 0 14 14" fill="none" aria-hidden="true">${svg`<path d="m3.4 7.3 2.4 2.4 4.8-5.2" stroke="currentColor" stroke-width=${clean ? 1.3 : 1.6} stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const thinkIcon = (clean: boolean) =>
  html`<svg width=${clean ? 16 : 14} height=${clean ? 16 : 14} viewBox="0 0 14 14" fill="none" aria-hidden="true">${svg`<path d="M5.3 10.6h3.4M5.8 12.3h2.4M7 1.7a3.9 3.9 0 0 0-2.3 7c.4.3.6.7.6 1.1v.1h3.4v-.1c0-.4.2-.8.6-1.1A3.9 3.9 0 0 0 7 1.7Z" stroke="currentColor" stroke-width=${clean ? 1.2 : 1.4} stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const globeIcon = (clean: boolean) =>
  html`<svg width=${clean ? 16 : 14} height=${clean ? 16 : 14} viewBox="0 0 14 14" fill="none" aria-hidden="true">${svg`<circle cx="7" cy="7" r="5.3" stroke="currentColor" stroke-width=${clean ? 1.2 : 1.4} stroke-linecap="round" stroke-linejoin="round"></circle><path d="M1.9 7h10.2M7 1.7c1.4 1.5 2 3.3 2 5.3s-.6 3.8-2 5.3c-1.4-1.5-2-3.3-2-5.3s.6-3.8 2-5.3Z" stroke="currentColor" stroke-width=${clean ? 1.2 : 1.4} stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;

const glyph = (model: PickerModel) => html`<span class="ui-mdp__glyph" aria-hidden="true">${model.icon ? model.icon.cloneNode(true) : model.name.trim().charAt(0).toUpperCase()}</span>`;

/** Text that changes without a jump: the old line stays for a moment and fades out underneath while the new one fades in */
type SwapLine = { id: string; content: unknown };
type Swap = { last: SwapLine | null; out: SwapLine | null; timer: number };

let uid = 0;

/**
 * The model menu of an AI chat: models with strength bars, extended thinking with its effort, and web search.
 * @tag tc-model-picker
 * @fires tc-value-change - A model was picked (`{ value: string }`); cancelable – prevent it to keep `value` (controlled use)
 * @fires tc-thinking-change - Extended thinking was switched (`{ thinking: boolean }`); cancelable
 * @fires tc-web-search-change - Web search was switched (`{ webSearch: boolean }`); cancelable
 * @fires tc-effort-change - The effort changed (`{ effort: ModelEffort }`); cancelable
 * @fires tc-open-change - The menu opens or closes (`{ open: boolean }`); cancelable
 */
export class TcModelPicker extends TcElement {
  static override ui = "mdp";

  @property({ attribute: false }) accessor models: PickerModel[] = [];
  /** Id of the chosen model – unset or unknown shows the first */
  @property() accessor value = "";
  /** Extended thinking switch */
  @property({ type: Boolean }) accessor thinking = false;
  /** Web search switch */
  @property({ type: Boolean, attribute: "web-search" }) accessor webSearch = false;
  /** How hard the model thinks – only shown while extended thinking is on */
  @property() accessor effort: ModelEffort = "medium";
  /** Whether the menu is open */
  @property({ type: Boolean }) accessor open = false;
  /** Which edge of the trigger the menu lines up with */
  @property() accessor align: "start" | "end" = "start";
  /** Whether the menu opens below or above the trigger – above suits a composer at the bottom of the screen */
  @property() accessor side: "bottom" | "top" = "bottom";

  /** @internal The row the arrows (or the pointer) are on */
  @state() accessor active = 0;
  /** @internal Someone is actually pointing at a row */
  @state() accessor pointing = false;
  /** @internal The arrows moved the active row – it then carries the focus ring */
  @state() accessor keyed = false;
  /** @internal The last choice, for the status region */
  @state() accessor announced = "";
  /** @internal A switch under the pointer or the focus – the tray then talks about it */
  @state() accessor hint: "search" | null = null;
  /** @internal How far the menu slides in to stay whole near the edge of the screen */
  @state() accessor shift = 0;
  /** @internal Clean's measured Effort fill */
  @state() accessor thumb: { x: number; w: number } | null = null;

  private uid = `tc-mdp-${++uid}`;
  private swaps: Record<"name" | "tray", Swap> = { name: { last: null, out: null, timer: 0 }, tray: { last: null, out: null, timer: 0 } };
  private roll = new RollingController(this, () => this.rollTarget(), 560);

  private onDocDown = (e: PointerEvent) => {
    if (!this.contains(e.target as Node)) this.setOpen(false);
  };
  private measureShift = () => {
    const trigger = this.querySelector(".ui-mdp__trigger")?.getBoundingClientRect();
    const width = this.querySelector<HTMLElement>(".ui-mdp__pop")?.offsetWidth ?? 0;
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
    for (const s of Object.values(this.swaps)) {
      window.clearTimeout(s.timer);
      s.timer = 0;
      s.out = null;
    }
  }

  /* ---------- Derived ---------- */

  private get chosenIndex() {
    return Math.max(0, this.models.findIndex((m) => m.id === this.value));
  }
  private get factor() {
    return this.thinking ? THINK_FACTOR[this.effort] : 1;
  }
  private get litModel(): PickerModel | undefined {
    return this.models[this.pointing ? this.active : this.chosenIndex] ?? this.models[this.chosenIndex];
  }
  private rollTarget(): Record<string, number> {
    const lit = this.litModel;
    if (!lit || this.hint === "search") return {};
    const to: Record<string, number> = {};
    if (lit.latencyMs !== undefined) to.l = lit.latencyMs * this.factor;
    if (lit.pricePerM !== undefined) to.p = lit.pricePerM;
    return to;
  }

  /* ---------- Changing things ---------- */

  /** Reports a change through its cancelable event and applies it unless prevented */
  private change<K extends "value" | "thinking" | "webSearch" | "effort" | "open">(key: K, event: string, next: this[K]) {
    if (this.emit(event, { [key]: next }, { cancelable: true })) this[key] = next;
  }

  private setOpen(next: boolean, focus?: "list" | "trigger") {
    if (next !== this.open) {
      if (next) {
        this.active = this.chosenIndex;
        this.pointing = false;
        this.keyed = false;
      } else this.hint = null;
      this.change("open", "tc-open-change", next);
    }
    // Focus only moves for people – a page opening the menu through `open` leaves the focus where it is
    if (focus === "list") requestAnimationFrame(() => this.querySelector<HTMLElement>(".ui-mdp__list")?.focus({ preventScroll: true }));
    if (focus === "trigger") this.querySelector<HTMLElement>(".ui-mdp__trigger")?.focus({ preventScroll: true });
  }

  private pick(index: number) {
    const m = this.models[index];
    if (!m) return;
    this.change("value", "tc-value-change", m.id);
    this.announced = `${m.name} selected`;
    this.setOpen(false, this.contains(document.activeElement) ? "trigger" : undefined);
  }

  private setEffort(next: ModelEffort) {
    if (next !== this.effort) this.change("effort", "tc-effort-change", next);
  }

  /* ---------- Keyboard ---------- */

  private onTriggerKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.setOpen(true, "list");
    }
  };
  private onListKey = (e: KeyboardEvent) => {
    const n = this.models.length;
    if (!n) return;
    const move = (to: number) => {
      e.preventDefault();
      this.active = ((to % n) + n) % n;
      this.pointing = true;
      this.keyed = true;
    };
    if (e.key === "ArrowDown") move(this.active + 1);
    else if (e.key === "ArrowUp") move(this.active - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(n - 1);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.pick(this.active);
    }
  };
  private onEffortKey = (e: KeyboardEvent) => {
    const i = EFFORTS.findIndex((x) => x.id === this.effort);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = EFFORTS[(i + step + EFFORTS.length) % EFFORTS.length];
    this.setEffort(next.id);
    this.querySelector<HTMLElement>(`.ui-mdp__seg-btn[data-effort="${next.id}"]`)?.focus();
  };

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The page may open the menu itself – start on the chosen row
    if (changed.has("open") && this.open && !changed.get("open") && this.hasUpdated) {
      this.active = this.chosenIndex;
      this.pointing = false;
    }
    this.toggleAttribute("data-open", this.open);
    this.dataset.align = this.align;
    this.dataset.side = this.side;
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
    if (this.open && (changed.has("open") || changed.has("align"))) this.measureShift();
    // Clean: the Effort fill sits under the chosen level – the levels are as wide as their words, so it is measured
    if (this.resolvedLook === "clean") {
      const btn = this.querySelector<HTMLElement>(`.ui-mdp__seg-btn[data-effort="${this.effort}"]`);
      if (btn && (btn.offsetLeft !== this.thumb?.x || btn.offsetWidth !== this.thumb?.w)) this.thumb = { x: btn.offsetLeft, w: btn.offsetWidth };
    }
    // A line that was swapped out fades for a moment, then goes
    for (const s of Object.values(this.swaps)) {
      if (s.out && !s.timer)
        s.timer = window.setTimeout(() => {
          s.timer = 0;
          s.out = null;
          this.requestUpdate();
        }, 260);
    }
  }

  /* ---------- Rendering ---------- */

  private swap(slot: "name" | "tray", id: string, content: unknown) {
    const s = this.swaps[slot];
    if (s.last && s.last.id !== id) {
      s.out = s.last;
      window.clearTimeout(s.timer);
      s.timer = 0;
    }
    s.last = { id, content };
    return html`<span class="ui-mdp__swap">${s.out ? keyed(`out-${s.out.id}`, html`<span class="ui-mdp__swap-item" data-out="" aria-hidden="true">${s.out.content}</span>`) : nothing}${keyed(id, html`<span class="ui-mdp__swap-item">${content}</span>`)}</span>`;
  }

  /** What the tray says: the model you point at – first-token time and price, rolling – or what web search does */
  private tray(lit: PickerModel | undefined): { key: string; content: unknown } {
    if (this.hint === "search") return { key: `search-${this.webSearch}`, content: this.webSearch ? "Looks things up on the web when it helps" : "Answers from what it already knows" };
    if (!lit || (lit.latencyMs === undefined && lit.pricePerM === undefined)) return { key: `plain-${lit?.id}`, content: lit?.description ?? lit?.name ?? "" };
    const latency = (lit.latencyMs ?? 0) * this.factor;
    const price = lit.pricePerM ?? 0;
    const shown = this.roll.shown;
    const parts: TemplateResult[] = [];
    if (lit.latencyMs !== undefined) parts.push(html`<span>~<b>${seconds(shown.l ?? latency)}</b> first token</span>`);
    if (lit.pricePerM !== undefined) parts.push(html`<span><b>${dollars(shown.p ?? price, price)}</b> / M tokens</span>`);
    // One key for every model with numbers – the numbers roll instead of the line swapping
    return { key: "stats", content: parts.map((p, i) => (i ? html`<span class="ui-mdp__dot"> · </span>${p}` : p)) };
  }

  private row(m: PickerModel, i: number, lit: PickerModel | undefined, clean: boolean) {
    const chosen = i === this.chosenIndex;
    const rated = m.speed !== undefined || m.quality !== undefined || m.cost !== undefined;
    // What the bars and the tray show, as words – part of the option's name (its visible text comes first)
    const details = [
      rated ? `Speed ${m.speed ?? 0}, quality ${m.quality ?? 0}, cost ${m.cost ?? 0} of 5` : "",
      m.latencyMs !== undefined ? `about ${seconds(m.latencyMs * this.factor)} to the first token` : "",
      m.pricePerM !== undefined ? `${dollars(m.pricePerM, m.pricePerM)} per million tokens` : "",
    ]
      .filter(Boolean)
      .join(", ");
    return html`<div
      id=${`${this.uid}-opt-${i}`}
      role="option"
      aria-selected=${chosen ? "true" : "false"}
      class="ui-mdp__option"
      ?data-active=${i === this.active}
      ?data-lit=${m.id === lit?.id}
      @pointerenter=${(e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        this.active = i;
        this.pointing = true;
        this.keyed = false;
      }}
      @click=${() => this.pick(i)}
    >
      ${glyph(m)}
      <span class="ui-mdp__text">
        <span class="ui-mdp__title"><span class="ui-mdp__title-name">${m.name}</span>${chosen ? checkIcon(clean) : nothing}</span>
        ${m.description ? html`<span class="ui-mdp__desc">${m.description}</span>` : nothing}
        ${details ? html`<span class="ui-mdp__sr">. ${details}</span>` : nothing}
      </span>
      ${rated
        ? html`<span class="ui-mdp__bars" aria-hidden="true">${STRENGTHS.map((s, c) => {
            const level = clamp(m[s.key] ?? 0);
            return html`<span class="ui-mdp__meter" style=${styleMap({ "--c": String(c) })}>${[0, 1, 2, 3, 4].map((k) => html`<span class="ui-mdp__seg" ?data-on=${k < level} style=${styleMap({ "--s": String(k) })}></span>`)}</span>`;
          })}</span>`
        : html`<span class="ui-mdp__varies" aria-hidden="true">Varies</span>`}
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const chosen = this.models[this.chosenIndex];
    const lit = this.litModel;
    const tray = this.tray(lit);
    // Option ids come from the row's position, never from model ids (user data)
    const activeId = this.models[this.active] ? `${this.uid}-opt-${this.active}` : undefined;
    const effortIndex = EFFORTS.findIndex((x) => x.id === this.effort);
    const segStyle = clean ? (this.thumb ? { "--x": `${this.thumb.x}px`, "--w": `${this.thumb.w}px` } : {}) : { "--i": String(effortIndex) };

    return html`
      <button
        type="button"
        class="ui-mdp__trigger"
        aria-haspopup="dialog"
        aria-expanded=${this.open ? "true" : "false"}
        aria-controls=${`${this.uid}-menu`}
        @click=${() => this.setOpen(!this.open, this.open ? undefined : "list")}
        @keydown=${this.onTriggerKey}
      >
        ${chosen ? glyph(chosen) : nothing}
        <span class="ui-mdp__sr">Model: </span>
        <span class="ui-mdp__name">${this.swap("name", chosen?.id ?? "none", chosen?.name ?? "Choose a model")}</span>
        <span class="ui-mdp__flag" ?data-on=${this.thinking} aria-hidden="true"><span>${thinkIcon(clean)}</span></span>
        ${this.thinking ? html`<span class="ui-mdp__sr">, extended thinking</span>` : nothing}
        ${chevronIcon(clean)}
      </button>

      <div id=${`${this.uid}-menu`} class="ui-mdp__pop" style=${styleMap(this.shift ? { translate: `${this.shift}px 0` } : {})} role="dialog" aria-label="Model settings" .inert=${!this.open}>
        <div class="ui-mdp__card">
          <div class="ui-mdp__head" aria-hidden="true">
            <span>Model</span>
            <span class="ui-mdp__cols">${STRENGTHS.map((s) => html`<span>${s.label}</span>`)}</span>
          </div>

          <div
            class="ui-mdp__list"
            role="listbox"
            aria-label="Model"
            tabindex="0"
            aria-activedescendant=${ifDefined(this.open ? activeId : undefined)}
            ?data-pointing=${this.pointing}
            ?data-keyed=${this.keyed}
            @keydown=${this.onListKey}
            @pointerleave=${() => (this.pointing = false)}
          >
            ${this.models.map((m, i) => this.row(m, i, lit, clean))}
          </div>

          <div class="ui-mdp__settings">
            <button type="button" role="switch" aria-checked=${this.thinking ? "true" : "false"} class="ui-mdp__toggle" @click=${() => this.change("thinking", "tc-thinking-change", !this.thinking)}>
              <span class="ui-mdp__toggle-icon">${thinkIcon(clean)}</span>
              <span class="ui-mdp__toggle-label">Extended thinking</span>
              <span class="ui-mdp__switch" aria-hidden="true"></span>
            </button>

            <div class="ui-mdp__fold" ?data-open=${this.thinking} .inert=${!this.thinking}>
              <div class="ui-mdp__clip">
                <div class="ui-mdp__effort">
                  <span class="ui-mdp__effort-label" id=${`${this.uid}-effort`}>Effort</span>
                  <div class="ui-mdp__segmented" role="radiogroup" aria-labelledby=${`${this.uid}-effort`} style=${styleMap(segStyle)} @keydown=${this.onEffortKey}>
                    <span class="ui-mdp__thumb" aria-hidden="true"></span>
                    ${EFFORTS.map(
                      (x) => html`<button
                        type="button"
                        role="radio"
                        aria-checked=${x.id === this.effort ? "true" : "false"}
                        tabindex=${x.id === this.effort ? 0 : -1}
                        data-effort=${x.id}
                        class="ui-mdp__seg-btn"
                        @click=${() => this.setEffort(x.id)}
                      >${x.label}</button>`,
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked=${this.webSearch ? "true" : "false"}
              class="ui-mdp__toggle"
              @click=${() => this.change("webSearch", "tc-web-search-change", !this.webSearch)}
              @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hint = "search")}
              @pointerleave=${() => (this.hint = null)}
              @focus=${() => (this.hint = "search")}
              @blur=${() => (this.hint = null)}
            >
              <span class="ui-mdp__toggle-icon">${globeIcon(clean)}</span>
              <span class="ui-mdp__toggle-label">Web search</span>
              <span class="ui-mdp__switch" aria-hidden="true"></span>
            </button>
          </div>
        </div>

        <div class="ui-mdp__foot">
          <span class="ui-mdp__caption" aria-hidden="true">${this.swap("tray", tray.key, tray.content)}</span>
          <span class="ui-mdp__keys" aria-hidden="true"><kbd>↑↓</kbd><kbd>↵</kbd></span>
        </div>
      </div>
      <span class="ui-mdp__sr" role="status">${this.announced}</span>
    `;
  }

  static override css = /* css */ `

[data-ui="mdp"] {
  position: relative;
  display: inline-block;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mdp"] { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mdp"] { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-primary); }
[data-ui="mdp"] *, [data-ui="mdp"] *::before, [data-ui="mdp"] *::after { box-sizing: border-box; }
:where([data-ui="mdp"]) button { appearance: none; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="mdp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="mdp"] svg { display: block; flex: none; }
[data-ui="mdp"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-mdp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- Trigger: a ghost button – glyph, name and a small chevron ----- */
.ui-mdp__trigger { display: inline-flex; align-items: center; max-width: 100%; height: var(--tc-control-h-md); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-control-radius-md); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mdp__trigger:hover, [data-ui="mdp"][data-open] .ui-mdp__trigger { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__trigger { gap: var(--tc-space-2); padding-right: var(--tc-space-2); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__trigger .ui-mdp__glyph { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__trigger { gap: var(--tc-space-1-5); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__trigger .ui-mdp__glyph { width: 18px; height: 18px; font-size: var(--tc-font-size-2xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__trigger .ui-mdp__glyph > svg { width: 10px; height: 10px; }
.ui-mdp__name { display: grid; min-width: 0; }
.ui-mdp__chevron { transition: transform var(--tc-duration-slow) var(--tc-ease-emphasized); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__chevron { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__chevron { margin-left: -2px; color: var(--tc-icon-muted); }
[data-ui="mdp"][data-open] .ui-mdp__chevron { transform: rotate(180deg); }
.ui-mdp__flag { display: grid; grid-template-columns: 0fr; opacity: 0; transition: grid-template-columns var(--tc-duration-slow) var(--tc-ease-emphasized), margin var(--tc-duration-slow) var(--tc-ease-emphasized), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mdp__flag[data-on] { grid-template-columns: 1fr; opacity: 1; transition: grid-template-columns var(--tc-duration-slow) var(--tc-ease-emphasized), margin var(--tc-duration-slow) var(--tc-ease-emphasized), opacity var(--tc-duration-moderate) var(--tc-ease-standard) 80ms; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__flag { margin-left: -7px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__flag[data-on] { margin-left: -3px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__flag { margin-left: -6px; color: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__flag[data-on] { margin-left: -2px; }
.ui-mdp__flag > span { min-width: 0; overflow: hidden; }
/* Glyph: a small tile with a hairline */
.ui-mdp__glyph { display: grid; flex: none; place-items: center; overflow: hidden; font-weight: var(--tc-avatar-font-weight); line-height: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__glyph { width: 22px; height: 22px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); font-size: var(--tc-font-size-2xs); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__glyph { width: 20px; height: 20px; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-surface-control); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); color: var(--tc-text-strong); }
.ui-mdp__glyph > svg, .ui-mdp__glyph > img { width: 12px; height: 12px; }
/* ----- Menu: unfolds softly from the trigger. Standard: a white menu card on a gray tray; Clean: one menu surface ----- */
.ui-mdp__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + 6px);
  left: 0;
  width: min(320px, calc(100vw - 32px));
  container-type: inline-size;
  box-shadow: var(--tc-menu-shadow);
  transform-origin: top left;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px) scale(0.96);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-emphasized), visibility 0s linear var(--tc-duration-base);
}
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__pop { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__pop { border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); }
[data-ui="mdp"][data-align="end"] .ui-mdp__pop { left: auto; right: 0; transform-origin: top right; }
[data-ui="mdp"][data-side="top"] .ui-mdp__pop { top: auto; bottom: calc(100% + 6px); transform-origin: bottom left; transform: translateY(4px) scale(0.96); }
[data-ui="mdp"][data-side="top"][data-align="end"] .ui-mdp__pop { transform-origin: bottom right; }
[data-ui="mdp"][data-open] .ui-mdp__pop { opacity: 1; visibility: visible; transform: none; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-emphasized), visibility 0s; }
.ui-mdp__card { padding: var(--tc-menu-padding); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__card { border-radius: calc(var(--tc-tray-radius) - var(--tc-tray-inset)); background: var(--tc-menu-bg); box-shadow: var(--tc-shadow-raised); }
.ui-mdp__head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__head { height: 24px; padding: 0 var(--tc-menu-item-px); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
/* Clean: the column names are a section caption */
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__head { height: 28px; padding: 4px var(--tc-menu-item-px) 0; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-mdp__cols { display: grid; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__cols { grid-template-columns: repeat(3, 34px); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__cols { grid-template-columns: repeat(3, 40px); }
.ui-mdp__cols > span { display: flex; justify-content: center; white-space: nowrap; }
/* ----- Rows: menu rows, two lines tall ----- */
.ui-mdp__list { display: grid; border-radius: var(--tc-menu-item-radius); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__list { gap: 1px; }
/* The active row carries the focus ring itself (aria-activedescendant), so the list draws none */
.ui-mdp__list:focus-visible { outline: none; }
.ui-mdp__option { display: flex; align-items: center; gap: var(--tc-space-2-5); padding: 6px var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); cursor: pointer; transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate), box-shadow var(--tc-duration-instant) var(--tc-ease-decelerate); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__option { min-height: 48px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__option { min-height: 44px; }
/* The fill appears crisply on the row under the pointer and fades out when the pointer leaves the list */
.ui-mdp__list[data-pointing] .ui-mdp__option[data-active] { background: var(--tc-menu-item-hover); }
/* Keyboard: the active row gets the focus ring (≥ 3:1) */
.ui-mdp__list:focus-visible .ui-mdp__option[data-active],
.ui-mdp__list:focus[data-keyed] .ui-mdp__option[data-active] { background: var(--tc-menu-item-hover); box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-mdp__text { display: grid; flex: 1; min-width: 0; }
.ui-mdp__title { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__title { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__title { color: var(--tc-text-strong); }
.ui-mdp__title-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* The chosen model: a check in the menu's selected colour */
.ui-mdp__check { color: var(--tc-menu-item-selected-fg); animation: ui-mdp-pop var(--tc-duration-slow) var(--tc-ease-emphasized) both; }
.ui-mdp__desc { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__desc { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__desc { color: var(--tc-text-secondary); }
/* Strength bars: five small segments each, the filled ones ≥ 3:1. The lit row fills them one after another */
.ui-mdp__bars { display: grid; flex: none; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__bars { grid-template-columns: repeat(3, 34px); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__bars { grid-template-columns: repeat(3, 40px); }
.ui-mdp__meter { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__meter { height: 5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__meter { height: 4px; }
.ui-mdp__seg { border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-emphasized); }
.ui-mdp__seg[data-on] { background: var(--tc-icon-muted); }
.ui-mdp__option[data-lit] .ui-mdp__seg[data-on] { transition-delay: calc(var(--c) * 70ms + var(--s) * 45ms); animation: ui-mdp-fill var(--tc-duration-slow) var(--tc-ease-emphasized) both; animation-delay: calc(var(--c) * 70ms + var(--s) * 45ms); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__option[data-lit] .ui-mdp__seg[data-on] { background: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__option[data-lit] .ui-mdp__seg[data-on] { background: var(--tc-accent); }
.ui-mdp__varies { flex: none; color: var(--tc-text-muted); text-align: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__varies { width: 118px; font-size: var(--tc-font-size-xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__varies { width: 136px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* ----- Switches and effort ----- */
.ui-mdp__settings { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__settings { margin-top: var(--tc-space-1-5); padding-top: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__settings { margin: var(--tc-space-1) -4px 0; padding: var(--tc-space-1) var(--tc-space-1) 0; }
.ui-mdp__toggle { display: flex; align-items: center; gap: var(--tc-space-2-5); width: 100%; height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate); }
.ui-mdp__toggle:hover { background: var(--tc-menu-item-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__toggle { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__toggle { color: var(--tc-text-primary); }
.ui-mdp__toggle-icon { display: grid; flex: none; place-items: center; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__toggle-icon { width: 22px; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__toggle-icon { width: 20px; color: var(--tc-icon-muted); }
.ui-mdp__toggle[aria-checked="true"] .ui-mdp__toggle-icon { color: var(--tc-text-primary); }
.ui-mdp__toggle-label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* Switch: the pattern's track and knob; the off track is a ≥ 3:1 control edge */
.ui-mdp__switch { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mdp__switch::after { content: ""; position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: max(0px, calc(var(--tc-switch-radius) - (var(--tc-switch-h) - var(--tc-switch-knob)) / 2)); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-emphasized); }
.ui-mdp__toggle[aria-checked="true"] .ui-mdp__switch { background: var(--tc-switch-on); }
.ui-mdp__toggle[aria-checked="true"] .ui-mdp__switch::after { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-mdp__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-emphasized), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mdp__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-emphasized), opacity var(--tc-duration-slow) var(--tc-ease-standard) 100ms; }
.ui-mdp__clip { min-height: 0; overflow: hidden; }
.ui-mdp__effort { display: flex; align-items: center; gap: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__effort { padding: var(--tc-space-0-5) var(--tc-space-2-5) var(--tc-space-1-5) 42px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__effort { padding: var(--tc-space-0-5) var(--tc-space-2) var(--tc-space-1-5) 38px; }
.ui-mdp__effort-label { flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__effort-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__effort-label { color: var(--tc-text-secondary); }
/* Effort – Standard: a segmented track with a sliding thumb; Clean: each level as wide as its word, the measured fill
   glides from one to the next. The chosen level carries a ring in the selected colour, not only a fill */
.ui-mdp__segmented { position: relative; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__segmented { display: grid; grid-template-columns: repeat(3, 58px); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__thumb { position: absolute; top: var(--tc-seg-pad); bottom: var(--tc-seg-pad); left: var(--tc-seg-pad); width: 58px; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 1px var(--tc-border-selected); transform: translateX(calc(var(--i) * 100%)); transition: transform var(--tc-duration-slow) var(--tc-ease-emphasized); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__seg-btn { position: relative; height: 24px; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-align: center !important; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__seg-btn[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__seg-btn:hover { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__segmented { display: flex; gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__thumb { position: absolute; top: 0; bottom: 0; left: 0; width: var(--w, 0); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); transform: translateX(var(--x, 0)); transition: transform var(--tc-duration-base) var(--tc-ease-move), width var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__seg-btn { position: relative; height: 22px; padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); text-align: center !important; transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__seg-btn[aria-checked="false"]:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-mdp__seg-btn[aria-checked="true"] { color: var(--tc-text-primary); }
/* ----- Tray (Standard) / last row (Clean): what the model you point at costs you ----- */
.ui-mdp__foot { display: flex; align-items: center; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__foot { height: 38px; padding: var(--tc-space-1) var(--tc-space-2) 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__foot { height: 36px; padding: 0 var(--tc-space-2) 0 var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mdp__caption { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__caption { font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__caption { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__dot { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__dot { color: var(--tc-text-disabled); }
.ui-mdp__swap { display: grid; min-width: 0; }
.ui-mdp__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; animation: ui-mdp-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-mdp__swap-item[data-out] { animation: ui-mdp-swap-out var(--tc-duration-base) var(--tc-ease-standard) both; }
.ui-mdp__keys { display: flex; flex: none; gap: var(--tc-space-1); }
.ui-mdp__keys kbd { display: grid; place-items: center; min-width: calc(var(--tc-kbd-h) + 2px); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: 1; color: var(--tc-kbd-fg); }
@keyframes ui-mdp-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-mdp-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
@keyframes ui-mdp-pop { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-mdp-fill { 0% { transform: scaleY(1); } 45% { transform: scaleY(1.6); } 100% { transform: scaleY(1); } }
/* Narrow menus: the glyphs in the rows and the key hints give way, effort moves left; Standard's bars move closer */
@container (max-width: 300px) {
.ui-mdp__option .ui-mdp__glyph { display: none; }
.ui-mdp__keys { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__cols,
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__bars { grid-template-columns: repeat(3, 30px); gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__varies { width: 102px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__effort { padding-left: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__segmented { grid-template-columns: repeat(3, 52px); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__thumb { width: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__effort { padding-left: var(--tc-space-2); }
}
@media (pointer: coarse) {
.ui-mdp__keys { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__trigger { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__option { min-height: 54px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__toggle { height: 42px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__seg-btn { height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__trigger { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__option { min-height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__toggle { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__seg-btn { height: 30px; padding: 0 var(--tc-space-2-5); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mdp"] *, [data-ui="mdp"] *::before, [data-ui="mdp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-model-picker")) customElements.define("tc-model-picker", TcModelPicker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-model-picker": TcModelPicker;
  }
}
