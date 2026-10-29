import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";

/*
 * <tc-gauge> – one value against its range: a 270° dial (`variant` arc), a half dial (semicircle) or a straight bar.
 * The value is in big type in the middle with the band it falls in under it – “Warning”, in the band's colour with a
 * mark – and the bands themselves (good, warning, bad …) run round the outside with a tick between each. A target is
 * a line across the dial; `previous` adds the change under it (“Up 1.2 °C from the last reading”). A new value
 * sweeps to its place (at once with reduced motion).
 *   · a `meter` named by its label, read as “72%, Warning”
 *   · `editable` makes it a slider: ← / → or ↑ / ↓ move by `step`, Page Up / Down by ten steps, Home / End to the
 *     ends; dragging along the dial or bar sets it too
 * Standard: a white card on a gray tray. Clean: one white card.
 *
 *   <tc-gauge label="Freezer B" unit="°C" min="-90" max="-60" value="-78" .bands=${[…]}></tc-gauge>
 */

export type GaugeTone = "success" | "info" | "neutral" | "warning" | "danger";
export type GaugeBand = {
  /** Where the band ends; it starts where the one before ends (the first at `min`), and the last runs to `max` */
  to: number;
  tone: GaugeTone;
  /** Its name, said with the value: "Warning" */
  label: string;
};
export type GaugeVariant = "arc" | "semicircle" | "bar";

/** Details of the events */
export type GaugeValueChange = { value: number };

let uidCount = 0;

/** The dials' shapes: where the sweep starts (degrees clockwise from 3 o'clock), how far it goes, and the box */
const SHAPES = {
  arc: { start: 135, sweep: 270, box: "0 0 120 120" },
  semicircle: { start: 180, sweep: 180, box: "0 0 120 66" },
} as const;
const CX = 60;
const CY = 60;
const R = 46;
/** The ring of bands, outside the dial */
const RB = 56;

const rad = (deg: number) => (deg * Math.PI) / 180;
const at = (deg: number, r: number) => `${(CX + r * Math.cos(rad(deg))).toFixed(2)} ${(CY + r * Math.sin(rad(deg))).toFixed(2)}`;
/** An arc of radius r from one angle to another, clockwise */
const arcPath = (from: number, to: number, r: number) => `M ${at(from, r)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${at(to, r)}`;

/**
 * One value against its range – a dial, a half dial or a bar – with the band it's in, the bands round it, a target
 * and the change since last time; optionally a slider.
 * @tag tc-gauge
 * @fires tc-value-change - The value was moved, when editable ({ value }: GaugeValueChange); cancelable – prevented, `value` stays as it was
 */
export class TcGauge extends TcElement {
  static override ui = "gau";

  /** What it measures, named above the dial – the meter's name */
  @property() accessor label = "Gauge";
  /** One line under the label */
  @property() accessor description: string | undefined = undefined;
  /** The value. Changed by the user when editable, unless a tc-value-change listener calls preventDefault() */
  @property({ type: Number }) accessor value = 0;
  /** The start of the range */
  @property({ type: Number }) accessor min = 0;
  /** The end of the range */
  @property({ type: Number }) accessor max = 100;
  /** The bands from `min` up – each runs to its `to`, the last to `max`; none draws the dial in one colour */
  @property({ attribute: false }) accessor bands: GaugeBand[] = [];
  /** A value to mark across the dial, e.g. a set point */
  @property({ type: Number }) accessor target: number | undefined = undefined;
  /** What the target is called */
  @property({ attribute: "target-label" }) accessor targetLabel = "Target";
  /** The value before, for the change under the dial */
  @property({ type: Number }) accessor previous: number | undefined = undefined;
  /** When the previous value was, after "from": "the last reading" */
  @property({ attribute: "previous-label" }) accessor previousLabel = "last time";
  /** Which way is good, to colour the change: "up" or "down"; unset leaves it neutral */
  @property() accessor good: "up" | "down" | undefined = undefined;
  /** The shape: a 270° dial, a half dial or a straight bar */
  @property() accessor variant: GaugeVariant = "arc";
  /** The size of the dial */
  @property() accessor size: "sm" | "md" | "lg" = "md";
  /** The colour without bands */
  @property() accessor tone: GaugeTone = "info";
  /** The unit after the number: "%", "°C", "GB" */
  @property() accessor unit: string | undefined = undefined;
  /** Writes a value, e.g. (v) => `${v} of 40 racks`; replaces the number and `unit` */
  @property({ attribute: false }) accessor format: ((value: number) => string) | undefined = undefined;
  /** Makes it a slider the user can move */
  @property({ type: Boolean, reflect: true }) accessor editable = false;
  /** How far an arrow key moves it, when editable */
  @property({ type: Number }) accessor step = 1;
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  private uid = `tc-gau-${++uidCount}`;
  private dragging = false;

  /* ---------- The model ---------- */

  private get range() {
    const lo = Number.isFinite(this.min) ? this.min : 0;
    const hi = Number.isFinite(this.max) ? this.max : 100;
    return hi > lo ? { lo, hi } : { lo, hi: lo + 1 };
  }
  private frac(v: number) {
    const { lo, hi } = this.range;
    return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  }
  private num(v: number) {
    if (this.format) return this.format(v);
    const n = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(v);
    if (!this.unit) return n;
    return /^[%°]/.test(this.unit) ? `${n}${this.unit}` : `${n} ${this.unit}`;
  }
  /** The bands, in order, each with where it starts and ends inside the range */
  private get spans() {
    const { lo, hi } = this.range;
    const sorted = [...this.bands].filter((b) => Number.isFinite(b.to)).sort((a, b) => a.to - b.to);
    let from = lo;
    return sorted.flatMap((b, i) => {
      const to = i === sorted.length - 1 ? hi : Math.max(lo, Math.min(hi, b.to));
      const span = { band: b, from, to };
      from = to;
      return span.to > span.from || i === sorted.length - 1 ? [span] : [];
    });
  }
  /** The band the value falls in */
  private get current() {
    const v = Number.isFinite(this.value) ? this.value : this.range.lo;
    const sorted = [...this.bands].filter((b) => Number.isFinite(b.to)).sort((a, b) => a.to - b.to);
    return sorted.find((b) => v <= b.to) ?? sorted[sorted.length - 1];
  }
  private get valueText() {
    const v = Number.isFinite(this.value) ? this.value : this.range.lo;
    const band = this.current;
    return band ? `${this.num(v)}, ${band.label}` : this.num(v);
  }

  /* ---------- Editing ---------- */

  private setValue(raw: number) {
    const { lo, hi } = this.range;
    const step = this.step > 0 ? this.step : 1;
    // Snapped to the step from the start of the range, without float dust
    const snapped = lo + Math.round((Math.max(lo, Math.min(hi, raw)) - lo) / step) * step;
    const decimals = (String(step).split(".")[1] ?? "").length;
    const value = Math.max(lo, Math.min(hi, Number(snapped.toFixed(decimals))));
    if (value === this.value) return;
    if (!this.emit<GaugeValueChange>("tc-value-change", { value }, { cancelable: true })) return;
    this.value = value;
  }

  private onKey = (e: KeyboardEvent) => {
    if (!this.editable || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const { lo, hi } = this.range;
    const step = this.step > 0 ? this.step : 1;
    const v = Number.isFinite(this.value) ? this.value : lo;
    const next: Record<string, number> = {
      ArrowRight: v + step,
      ArrowUp: v + step,
      ArrowLeft: v - step,
      ArrowDown: v - step,
      PageUp: v + step * 10,
      PageDown: v - step * 10,
      Home: lo,
      End: hi,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    this.setValue(next[e.key]);
  };

  /** The value under the pointer: along the bar, or by the angle round the dial's centre */
  private fromPointer(e: PointerEvent) {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const { lo, hi } = this.range;
    if (this.variant === "bar") return lo + Math.max(0, Math.min(1, (e.clientX - box.left) / box.width)) * (hi - lo);
    const shape = SHAPES[this.variant === "semicircle" ? "semicircle" : "arc"];
    const [, , w, hgt] = shape.box.split(" ").map(Number);
    const x = ((e.clientX - box.left) / box.width) * w - CX;
    const y = ((e.clientY - box.top) / box.height) * hgt - CY;
    const deg = (Math.atan2(y, x) * 180) / Math.PI;
    let rel = (((deg - shape.start) % 360) + 360) % 360;
    // Past the end of the sweep: the nearer end
    if (rel > shape.sweep) rel = rel > shape.sweep + (360 - shape.sweep) / 2 ? 0 : shape.sweep;
    return lo + (rel / shape.sweep) * (hi - lo);
  }
  private onDown = (e: PointerEvent) => {
    if (!this.editable || e.button !== 0) return;
    const v = this.fromPointer(e);
    if (v === null) return;
    this.dragging = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // A pointer the browser no longer tracks: the drag still works while the pointer stays over the gauge
    }
    this.querySelector<HTMLElement>(".ui-gau__meter")?.focus({ preventScroll: true });
    this.setValue(v);
  };
  private onMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const v = this.fromPointer(e);
    if (v !== null) this.setValue(v);
  };
  private onUp = () => {
    this.dragging = false;
  };

  /* ---------- Rendering ---------- */

  private renderDial() {
    const shape = SHAPES[this.variant === "semicircle" ? "semicircle" : "arc"];
    const deg = (f: number) => shape.start + f * shape.sweep;
    const v = Number.isFinite(this.value) ? this.value : this.range.lo;
    const f = this.frac(v);
    const spans = this.spans;
    const target = this.target !== undefined && Number.isFinite(this.target) ? deg(this.frac(this.target)) : null;
    const tone = this.current?.tone ?? this.tone;
    return svg`<svg class="ui-gau__svg" viewBox=${shape.box} aria-hidden="true">
      <path class="ui-gau__track" d=${arcPath(deg(0), deg(1), R)}></path>
      <path class="ui-gau__fill" data-tone=${tone} ?data-empty=${f === 0} pathLength="100" d=${arcPath(deg(0), deg(1), R)} style=${`stroke-dashoffset: ${(100 - f * 100).toFixed(2)}`}></path>
      ${spans.map((s) => svg`<path class="ui-gau__band" data-tone=${s.band.tone} d=${arcPath(deg(this.frac(s.from)), deg(this.frac(s.to)), RB)}></path>`)}
      ${spans.slice(1).map((s) => {
        const a = deg(this.frac(s.from));
        return svg`<path class="ui-gau__tick" d=${`M ${at(a, RB - 4)} L ${at(a, RB + 3)}`}></path>`;
      })}
      ${target !== null ? svg`<path class="ui-gau__target" d=${`M ${at(target, R - 9)} L ${at(target, RB + 3)}`}></path>` : nothing}
    </svg>`;
  }

  private renderBar() {
    const v = Number.isFinite(this.value) ? this.value : this.range.lo;
    const f = this.frac(v);
    const tone = this.current?.tone ?? this.tone;
    const target = this.target !== undefined && Number.isFinite(this.target) ? this.frac(this.target) : null;
    return html`<div class="ui-gau__rail" aria-hidden="true">
      <div class="ui-gau__bar-track"><div class="ui-gau__bar-fill" data-tone=${tone} style=${`transform: scaleX(${f.toFixed(4)})`}></div></div>
      ${this.spans.length
        ? html`<div class="ui-gau__bar-bands">
            ${this.spans.map((s) => html`<span class="ui-gau__bar-band" data-tone=${s.band.tone} style=${`flex-grow: ${Math.max(0.0001, this.frac(s.to) - this.frac(s.from))}`}></span>`)}
          </div>`
        : nothing}
      ${target !== null ? html`<span class="ui-gau__bar-target" style=${`left: ${(target * 100).toFixed(2)}%`}></span>` : nothing}
    </div>`;
  }

  private renderChange() {
    if (this.previous === undefined || !Number.isFinite(this.previous) || !Number.isFinite(this.value)) return nothing;
    const diff = this.value - this.previous;
    // Rounded as it's shown, so a change too small to show reads as none
    const shown = Number(new Intl.NumberFormat("en", { maximumFractionDigits: 1, useGrouping: false }).format(Math.abs(diff)));
    if (!shown) return html`<p class="ui-gau__change" data-tone="neutral">No change from ${this.previousLabel}</p>`;
    const up = diff > 0;
    const tone = !this.good ? "neutral" : up === (this.good === "up") ? "success" : "danger";
    const amount = this.num(Math.abs(diff));
    return html`<p class="ui-gau__change" data-tone=${tone}><span class="ui-gau__arrow" aria-hidden="true">${up ? "▲" : "▼"}</span>${up ? "Up" : "Down"} ${amount} from ${this.previousLabel}</p>`;
  }

  protected override render() {
    const id = this.uid;
    const { lo, hi } = this.range;
    const v = Number.isFinite(this.value) ? this.value : lo;
    const band = this.current;
    const bar = this.variant === "bar";
    const hasTarget = this.target !== undefined && Number.isFinite(this.target);
    // role goes through the ARIA-reflecting `role` property: lit-analyzer's role list predates ARIA 1.2's meter
    return html`<div class="ui-gau__card">
      <div class="ui-gau__head">
        <span class="ui-gau__label" id=${`${id}-label`}>${this.label}</span>
        ${this.description ? html`<span class="ui-gau__desc">${this.description}</span>` : nothing}
      </div>
      <div
        class="ui-gau__meter"
        .role=${this.editable ? "slider" : "meter"}
        tabindex=${ifDefined(this.editable ? 0 : undefined)}
        aria-labelledby=${`${id}-label`}
        aria-valuenow=${Math.max(lo, Math.min(hi, v))}
        aria-valuemin=${lo}
        aria-valuemax=${hi}
        aria-valuetext=${this.valueText}
        aria-orientation=${ifDefined(this.editable ? "horizontal" : undefined)}
        data-variant=${bar ? "bar" : this.variant === "semicircle" ? "semicircle" : "arc"}
        data-size=${this.size}
        @keydown=${this.onKey}
      >
        <div class="ui-gau__face" @pointerdown=${this.onDown} @pointermove=${this.onMove} @pointerup=${this.onUp} @pointercancel=${this.onUp}>
          ${bar ? this.renderBar() : this.renderDial()}
          <div class="ui-gau__read" aria-hidden="true">
            <span class="ui-gau__value">${this.num(v)}</span>
            ${band ? html`<span class="ui-gau__band-label" data-tone=${band.tone}><span class="ui-gau__dot"></span>${band.label}</span>` : nothing}
          </div>
        </div>
        ${bar
          ? html`<div class="ui-gau__ends" aria-hidden="true"><span>${this.num(lo)}</span><span>${this.num(hi)}</span></div>`
          : nothing}
      </div>
      ${hasTarget || this.previous !== undefined
        ? html`<div class="ui-gau__foot">
            ${this.renderChange()}
            ${hasTarget ? html`<p class="ui-gau__target-text"><span class="ui-gau__target-mark" aria-hidden="true"></span>${this.targetLabel} ${this.num(this.target!)}</p>` : nothing}
          </div>`
        : nothing}
    </div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="gau"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="gau"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The dial's size and the fill's colour – override them on the element */
[data-ui="gau"] { --tc-gau-dial: 168px; --tc-gau-ink: var(--tc-status-info-solid); --tc-gau-band: var(--tc-text-muted); }
[data-ui="gau"] *, [data-ui="gau"] *::before, [data-ui="gau"] *::after { box-sizing: border-box; }
[data-ui="gau"] p { margin: 0; }
.ui-gau__card { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-gau__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-gau__head { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-gau__label { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-gau__desc { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* ----- The meter ----- */
.ui-gau__meter { display: grid; gap: var(--tc-space-1); justify-items: center; border-radius: var(--tc-radius-md); outline: none; }
.ui-gau__meter[data-variant="bar"] { justify-items: stretch; }
.ui-gau__meter:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-gau__meter[data-size="sm"] { --tc-gau-dial: 112px; }
.ui-gau__meter[data-size="lg"] { --tc-gau-dial: 216px; }
.ui-gau__face { position: relative; width: var(--tc-gau-dial); max-width: 100%; touch-action: none; }
[data-ui="gau"][editable] .ui-gau__face { cursor: pointer; }
.ui-gau__meter[data-variant="bar"] .ui-gau__face { display: flex; flex-direction: column-reverse; gap: var(--tc-space-2); width: 100%; }
.ui-gau__svg { display: block; width: 100%; height: auto; overflow: visible; }
.ui-gau__track, .ui-gau__fill { fill: none; stroke-width: 9; stroke-linecap: round; }
.ui-gau__track { stroke: var(--tc-meter-track); }
.ui-gau__fill { stroke: var(--tc-gau-ink); stroke-dasharray: 100 100; transition: stroke-dashoffset var(--tc-duration-slowest) var(--tc-ease-move), stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-gau__fill[data-empty] { stroke: none; }
.ui-gau__band { fill: none; stroke: var(--tc-gau-band); stroke-width: 3; }
.ui-gau__tick { stroke: var(--tc-surface-raised); stroke-width: 2; }
:where([data-look="standard"], [data-look="standard"] *) .ui-gau__tick { stroke: var(--tc-surface-on-tray); }
.ui-gau__target { stroke: var(--tc-text-primary); stroke-width: 2.5; stroke-linecap: round; }
/* Tones: the fill takes the band's solid colour, the band's words its text colour */
[data-ui="gau"] [data-tone="success"] { --tc-gau-ink: var(--tc-status-success-solid); --tc-gau-band: var(--tc-status-success-solid); --tc-gau-word: var(--tc-status-success-fg); }
[data-ui="gau"] [data-tone="info"] { --tc-gau-ink: var(--tc-status-info-solid); --tc-gau-band: var(--tc-status-info-solid); --tc-gau-word: var(--tc-status-info-fg); }
[data-ui="gau"] [data-tone="neutral"] { --tc-gau-ink: var(--tc-chart-neutral); --tc-gau-band: var(--tc-chart-neutral); --tc-gau-word: var(--tc-text-secondary); }
[data-ui="gau"] [data-tone="warning"] { --tc-gau-ink: var(--tc-status-warning-solid); --tc-gau-band: var(--tc-status-warning-solid); --tc-gau-word: var(--tc-status-warning-fg); }
[data-ui="gau"] [data-tone="danger"] { --tc-gau-ink: var(--tc-status-danger-solid); --tc-gau-band: var(--tc-status-danger-solid); --tc-gau-word: var(--tc-status-danger-fg); }
/* The reading, in the dial's middle (low in a half dial, above a bar) */
.ui-gau__read { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: var(--tc-space-0-5); pointer-events: none; }
.ui-gau__meter[data-variant="semicircle"] .ui-gau__read { place-content: end center; }
.ui-gau__meter[data-variant="bar"] .ui-gau__read { position: static; display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); }
.ui-gau__value { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-gau__meter[data-size="sm"] .ui-gau__value { font-size: var(--tc-font-size-xl); }
.ui-gau__meter[data-size="lg"] .ui-gau__value { font-size: var(--tc-font-size-4xl); }
.ui-gau__band-label { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-gau-word); white-space: nowrap; }
.ui-gau__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--tc-gau-band); }
/* ----- The bar ----- */
.ui-gau__rail { position: relative; display: grid; gap: var(--tc-space-1); }
.ui-gau__bar-track { height: 10px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-meter-track); }
.ui-gau__bar-fill { height: 100%; border-radius: var(--tc-radius-full); background: var(--tc-gau-ink); transform-origin: left center; transition: transform var(--tc-duration-slowest) var(--tc-ease-move), background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-gau__bar-bands { display: flex; gap: var(--tc-space-0-5); height: 3px; }
.ui-gau__bar-band { flex: 1 1 0; border-radius: var(--tc-radius-full); background: var(--tc-gau-band); }
.ui-gau__bar-target { position: absolute; top: -3px; bottom: -3px; width: 2.5px; border-radius: var(--tc-radius-full); background: var(--tc-text-primary); transform: translateX(-50%); }
.ui-gau__ends { display: flex; justify-content: space-between; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- The change and the target ----- */
.ui-gau__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-gau__change { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-gau__change[data-tone="success"] { color: var(--tc-status-success-fg); }
.ui-gau__change[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-gau__arrow { font-size: var(--tc-font-size-2xs); }
.ui-gau__target-text { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-gau__target-mark { width: 2.5px; height: 10px; border-radius: var(--tc-radius-full); background: var(--tc-text-primary); }
@media (forced-colors: active) {
  .ui-gau__fill, .ui-gau__band { stroke: Highlight; }
  .ui-gau__track { stroke: GrayText; }
  .ui-gau__target { stroke: CanvasText; }
  .ui-gau__bar-fill, .ui-gau__bar-band, .ui-gau__dot { background: Highlight; }
  .ui-gau__bar-track { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="gau"] *, [data-ui="gau"] *::before, [data-ui="gau"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-gauge")) customElements.define("tc-gauge", TcGauge);

declare global {
  interface HTMLElementTagNameMap {
    "tc-gauge": TcGauge;
  }
}
