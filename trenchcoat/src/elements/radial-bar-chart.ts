import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, categoricalInk, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { numGetter, strGetter } from "./internal/chart/accessor";
import type { FormatName } from "./internal/chart/format";
import { arcLine, polar, TAU } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-radial-bar-chart> – a few ratios as rings round a centre: how far each item has got towards a target, its ring
 * filled that far round a track. Ported from ztd-charts' RadialBarChart (MIT, © 2026 Junhan2). The largest takes the
 * accent and the rest stay quiet (`highlight` picks others). On an open sweep (270° by default) each ring is named
 * with its value in the empty corner where the rings start; a full circle writes the emphasised value in the middle.
 * Rings sweep round one after another when the chart comes on screen and glide when the data changes.
 * `variant="rings"` draws activity rings instead: thick full circles in the categorical inks, each filling towards its
 * own `target` and wrapping round in a darker lap past it, a glyph (the name's initial) where each starts, and a tile
 * per ring under the chart with its value against its target – pointing at a tile isolates its ring, and the other way
 * round.
 *   · one tab stop: arrows move ring to ring, each read with its value
 *   · rings: the tiles are a second tab stop – arrows move tile to tile, each isolating its ring; Enter picks it
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-radial-bar-chart heading="Grant milestones" .data=${[{ label: "Genomics", value: 82 }, …]}></tc-radial-bar-chart>
 */

/** A radial bar chart: three open rings, drawn in the Lucide style */
const radialIcon = svg`<path d="M12 3a9 9 0 1 1-9 9"></path><path d="M12 7a5 5 0 1 1-5 5"></path><path d="M12 11a1 1 0 1 1-1 1"></path>`;

type Ring = { i: number; label: string; value: number; frac: number; hi: boolean; target: number; glyph: string; ink: string };

/** "bars": open rings round a sweep, named where they start; "rings": activity rings with a tile each */
export type RadialBarVariant = "bars" | "rings";

/**
 * A few ratios as rings round a centre – progress towards a target – the largest emphasised, each named with its
 * value beside where it starts, and a table view.
 * @tag tc-radial-bar-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a ring, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A ring was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcRadialBarChart<T = Row> extends TcChartElement<Ring, T> {
  static override ui = "rbr";

  /** The label field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The value of a full ring – the target; by default 100 */
  @property({ type: Number }) accessor max = 100;
  /** How far round a ring goes, in degrees (30–360); by default 270 */
  @property({ type: Number }) accessor sweep = 270;
  /** "bars" (open rings named where they start) or "rings" (activity rings with a tile each) */
  @property({ reflect: true }) accessor variant: RadialBarVariant = "bars";
  /** Each item's own target – a full ring – for the rings variant; by default `max` */
  @property({ attribute: false }) accessor target: Accessor<T, number> | undefined = undefined;
  /** The short mark drawn where each activity ring starts; by default the first letter of its label */
  @property({ attribute: false }) accessor glyph: Accessor<T, string> | undefined = undefined;

  /** @internal The tile that holds the tiles' tab stop */
  @state() accessor tileFocus = 0;

  protected override readonly kind = "Radial bar chart";
  protected override readonly icon = radialIcon;
  protected override defaultDuration = 1000;
  protected override stagger = 120;
  protected override defaultFormat: FormatName | undefined = "percent";
  protected override modelKeys = ["label", "value", "max", "sweep", "variant", "target", "glyph"];

  private rings: Ring[] = [];
  private g = { cx: 0, cy: 0, R: 0, inner: 0, step: 0, thick: 0, span: 0, deg: 270 };

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(270, w * 0.6));
  }

  private get isRings() {
    return this.variant === "rings";
  }

  protected override willUpdate(changed: PropertyValues) {
    // Activity rings count things against targets: plain numbers unless `format` says otherwise
    if (changed.has("variant")) this.defaultFormat = this.variant === "rings" ? "number" : "percent";
    super.willUpdate(changed);
  }

  private radius(k: number) {
    return this.g.R - this.g.step * k - this.g.step / 2;
  }

  protected override buildModel(f: ChartFrame): ChartModel<Ring, T> {
    const { width: W, height: H } = f;
    const max = this.max > 0 ? this.max : 100;
    const deg = Math.max(30, Math.min(360, this.sweep || 270));
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    const rings = this.isRings;
    const gt = this.target !== undefined ? numGetter(this.target, "target") : null;
    const gg = this.glyph !== undefined ? strGetter(this.glyph, "glyph") : null;
    const rows = this.data.map((d, i) => ({ d, i, label: gl(d, i), value: gv(d, i) || 0, target: (gt && gt(d, i)) || max }));
    const hi = resolveHighlight(this.highlight, rows.map((r) => r.d), rows.map((r) => r.label), rows.map((r) => r.value), rings ? "none" : "max");
    this.rings = rows.map((r) => ({
      i: r.i,
      label: r.label,
      value: r.value,
      // An activity ring wraps round once more past its target
      frac: Math.max(0, Math.min(rings ? 2 : 1, r.value / (rings ? (r.target > 0 ? r.target : max) : max))),
      hi: hi.has(r.i),
      target: r.target,
      glyph: rings ? (gg ? gg(r.d, r.i) : r.label.trim().charAt(0).toUpperCase()) : "",
      ink: rings ? categoricalInk(r.i) : emphasisInk(hi.has(r.i)),
    }));
    if (this.tileFocus >= this.rings.length) this.tileFocus = 0;

    const n = Math.max(1, this.rings.length);
    if (rings) {
      // Full circles, centred, thick and close together
      const R = Math.max(30, Math.min(H / 2 - 6, W / 2 - 8));
      const inner = R * 0.3;
      const step = (R - inner) / n;
      this.g = { cx: W / 2, cy: H / 2, R, inner, step, thick: Math.max(6, Math.min(28, step * 0.86)), span: TAU, deg: 360 };
      const marks = this.rings.map((r, k) => ({ key: `r:${r.label}`, to: [r.frac], from: [0], enter: [0], delay: k * this.stagger, data: r }));
      const events = this.rings.map((r) => ({ datum: this.data[r.i] ?? null, index: r.i, key: r.label, label: r.label, value: r.value, formatted: `${f.fv(r.value)} of ${f.fv(r.target)}` }));
      const summary = this.rings.map((r) => `${r.label} ${f.fv(r.value)} of ${f.fv(r.target)}`).join(", ");
      return { marks, events, summary };
    }
    const R = Math.max(30, Math.min(H / 2 - 6, W / 2 - 8));
    // An open sweep leaves the top-left corner empty for the names: the rings move right to make room
    const cx = W / 2 + (deg < 360 ? R * 0.18 : 0);
    const inner = R * 0.26;
    const step = (R - inner) / n;
    this.g = { cx, cy: H / 2, R, inner, step, thick: Math.max(4, Math.min(18, step * 0.64)), span: (deg / 360) * TAU, deg };

    const marks = this.rings.map((r, k) => ({ key: `r:${r.label}`, to: [r.frac], from: [0], enter: [0], delay: k * this.stagger, data: r }));
    const events = this.rings.map((r) => ({ datum: this.data[r.i] ?? null, index: r.i, key: r.label, label: r.label, value: r.value, formatted: f.fv(r.value) }));
    const summary = this.rings.map((r) => `${r.label} ${f.fv(r.value)}`).join(", ");
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const r = this.rings[i];
    if (!r) return null;
    const { cx, cy, span } = this.g;
    const [x, y] = polar(cx, cy, this.radius(i), span * r.frac);
    const max = this.max > 0 ? this.max : 100;
    if (this.isRings)
      return {
        x,
        y,
        title: r.label,
        rows: [
          { label: this.words.value, value: f.fv(r.value), color: r.ink },
          { label: "Target", value: f.fv(r.target) },
          { label: "Of target", value: f.pct(r.target > 0 ? (r.value / r.target) * 100 : 0) },
        ],
      };
    return {
      x,
      y,
      title: r.label,
      rows: [
        { label: this.words.value, value: f.fv(r.value), color: emphasisInk(r.hi) },
        { label: "Of target", value: f.pct((r.value / max) * 100) },
      ],
    };
  }

  protected override tableHeader() {
    return "Item";
  }

  /** Activity rings: a tinted track, the lap to the target, a darker lap past it, the glyph where each starts */
  private drawRings() {
    const { cx, cy, thick } = this.g;
    return svg`${this.motion.items.map((it) => {
      if (it.exiting) return nothing;
      const r = it.data;
      const rad = this.radius(r.i);
      const t = it.v[0];
      const focus = this.active === r.i && this.via === "keyboard";
      const h = this.hover(r.i);
      const [gx, gy] = polar(cx, cy, rad, 0);
      return svg`<g class="tc-chart__mark ui-rbr__ring" opacity=${this.dim(r.i)} style=${`--tc-rbr-ink: ${r.ink}`} @pointerenter=${h.enter} @click=${h.click}>
        <path class="ui-rbr__track ui-rbr__track--ring" d=${arcLine(cx, cy, rad, 0, TAU)} stroke-width=${thick}></path>
        ${t > 0.002 ? svg`<path class="ui-rbr__bar" d=${arcLine(cx, cy, rad, 0, TAU * Math.min(1, t))} stroke-width=${thick} style=${`stroke: ${r.ink}`}></path>` : nothing}
        ${t > 1.002 ? svg`<path class="ui-rbr__lap" d=${arcLine(cx, cy, rad, 0, TAU * (t - 1))} stroke-width=${thick}></path>` : nothing}
        ${thick >= 12 && r.glyph ? svg`<text class="ui-rbr__glyph" x=${gx} y=${gy} text-anchor="middle" dominant-baseline="central">${r.glyph}</text>` : nothing}
        ${focus ? svg`<path class="ui-rbr__focus" d=${arcLine(cx, cy, rad + thick / 2 + 2, 0, TAU)}></path>` : nothing}
      </g>`;
    })}`;
  }

  /* ---------- The rings' tiles ---------- */

  private tileKey = (e: KeyboardEvent) => {
    const n = this.rings.length;
    const cur = this.tileFocus;
    if (e.key === "Escape") {
      if (this.active === null) return;
      e.preventDefault();
      this.setActive(null);
      return;
    }
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (cur + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (cur - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (next === null) return;
    e.preventDefault();
    this.tileFocus = next;
    void this.updateComplete.then(() => this.querySelectorAll<HTMLButtonElement>(".ui-rbr__tile")[next]?.focus());
  };

  private tiles() {
    const f = this.frame;
    return html`<ul class="ui-rbr__tiles" aria-label="Rings" @keydown=${this.tileKey}>
      ${this.rings.map(
        (r, k) => html`<li class="ui-rbr__tile-item">
          <button type="button" class="ui-rbr__tile" tabindex=${k === this.tileFocus ? 0 : -1} ?data-active=${this.active === k} style=${`--tc-rbr-ink: ${r.ink}`}
            @pointerenter=${() => this.setActive(k, "pointer")}
            @pointerleave=${() => this.via === "pointer" && this.setActive(null)}
            @focus=${() => {
              this.tileFocus = k;
              this.setActive(k, "keyboard");
            }}
            @blur=${(e: FocusEvent) => {
              if (!(e.relatedTarget instanceof Element && e.relatedTarget.closest(".ui-rbr__tiles"))) this.setActive(null);
            }}
            @click=${() => this.clickMark(k)}>
            <span class="ui-rbr__tile-name"><span class="ui-rbr__tile-swatch" aria-hidden="true"></span>${r.label}</span>
            <span class="ui-rbr__tile-value"><strong>${f.fmt(r.value)}</strong> / ${f.fmt(r.target)}${this.unit}</span>
          </button>
        </li>`,
      )}
    </ul>`;
  }

  protected override render() {
    const chart = super.render();
    return this.isRings && this.rings.length ? html`${chart}${this.tiles()}` : chart;
  }

  protected override draw(f: ChartFrame) {
    if (this.isRings) return this.drawRings();
    const { cx, cy, inner, step, thick, span, deg } = this.g;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const rings = m.items.map((it) => {
      // A ring's place comes from the data order; a leaving ring would push the inner ones out until it left
      if (it.exiting) return nothing;
      const r = it.data;
      const rad = this.radius(r.i);
      const t = it.v[0];
      const focus = this.active === r.i && this.via === "keyboard";
      const h = this.hover(r.i);
      return svg`<g class="tc-chart__mark" opacity=${this.dim(r.i)} @pointerenter=${h.enter} @click=${h.click}>
        <path class="ui-rbr__track" d=${arcLine(cx, cy, rad, 0, span)} stroke-width=${thick}></path>
        ${t > 0.002 ? svg`<path class="ui-rbr__bar" d=${arcLine(cx, cy, rad, 0, span * t)} stroke-width=${thick} style=${`stroke: ${emphasisInk(r.hi)}`}></path>` : nothing}
        ${focus ? svg`<path class="ui-rbr__focus" d=${arcLine(cx, cy, rad + thick / 2 + 2, 0, span)}></path>` : nothing}
      </g>`;
    });
    let words: unknown = nothing;
    if (!this.hideLabels && this.rings.length) {
      if (deg < 360) {
        // Each ring named with its value just left of where it starts, when the rings are far enough apart
        if (step >= AXIS_FONT) {
          const labelMax = Math.max(40, cx - 12);
          words = this.rings.map((r, k) => {
            const [lx, ly] = polar(cx, cy, this.radius(k), 0);
            const text = truncate(`${r.label} ${f.fv(r.value)}`, labelMax, AXIS_FONT, r.hi ? 700 : 500);
            return txt(lx - 8, ly, text, { anchor: "end", cls: "value", strong: r.hi, opacity: m.fade(k * this.stagger + D * 0.3, 280) });
          });
        }
      } else if (inner >= 18) {
        const r = this.rings.find((q) => q.hi) ?? this.rings[0];
        words = svg`<g class="ui-rbr__centre">${txt(cx, cy, f.fv(r.value), { anchor: "middle", cls: "value", strong: true, opacity: m.fade(D * 0.4, 300) })}</g>`;
      }
    }
    return svg`${rings}${words}`;
  }

  static override css = /* css */ `
[data-ui="rbr"] {
  --tc-rbr-track: var(--tc-plot-grid);
  /* Activity rings: how much of the ring's ink tints its track, and the ink its lap past the target is mixed with */
  --tc-rbr-ring-tint: 18%;
  --tc-rbr-lap-mix: 70%;
  --tc-rbr-lap-ink: var(--tc-zinc-950);
  --tc-rbr-tile-min: 112px;
}
.ui-rbr__track { fill: none; stroke: var(--tc-rbr-track); stroke-linecap: round; }
.ui-rbr__bar { fill: none; stroke-linecap: round; }
.ui-rbr__focus { fill: none; stroke: var(--tc-plot-focus); stroke-width: 1.5; stroke-dasharray: 2 3; }
.ui-rbr__centre .tc-chart__value { font-size: var(--tc-font-size-xl); }
.ui-rbr__track--ring { stroke: color-mix(in srgb, var(--tc-rbr-ink) var(--tc-rbr-ring-tint), var(--tc-plot-bg)); }
.ui-rbr__lap { fill: none; stroke: color-mix(in srgb, var(--tc-rbr-ink) var(--tc-rbr-lap-mix), var(--tc-rbr-lap-ink)); stroke-linecap: round; }
.ui-rbr__glyph { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-strong); fill: var(--tc-text-on-accent); pointer-events: none; }
/* The tiles under the activity rings: white tiles on the Standard tray, wells inside the Clean card */
.ui-rbr__tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--tc-rbr-tile-min), 1fr)); gap: var(--tc-space-2); margin: var(--tc-space-2) 0 0; padding: 0; list-style: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rbr"]:not([bare]) .ui-rbr__tiles { margin: 0; padding: 0 var(--tc-space-4) var(--tc-space-4); }
.ui-rbr__tile-item { min-width: 0; }
.ui-rbr__tile { display: flex; flex-direction: column; gap: var(--tc-space-0-5); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-3); border: 0; border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); text-align: left; cursor: pointer; box-shadow: inset 0 0 0 1px transparent; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rbr"] .ui-rbr__tile { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-rbr__tile[data-active], :where([data-look="standard"], [data-look="standard"] *)[data-ui="rbr"] .ui-rbr__tile[data-active] { box-shadow: inset 0 0 0 1.5px var(--tc-rbr-ink); }
.ui-rbr__tile:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rbr__tile-name { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-rbr__tile-swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-full); background: var(--tc-rbr-ink); }
.ui-rbr__tile-value { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rbr__tile-value strong { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
@media (forced-colors: active) {
  .ui-rbr__bar, .ui-rbr__lap, .ui-rbr__track--ring, .ui-rbr__tile-swatch { forced-color-adjust: none; }
  .ui-rbr__track { stroke: GrayText; }
  .ui-rbr__focus { stroke: Highlight; }
}
`;
}

if (!customElements.get("tc-radial-bar-chart")) customElements.define("tc-radial-bar-chart", TcRadialBarChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-radial-bar-chart": TcRadialBarChart;
  }
}
