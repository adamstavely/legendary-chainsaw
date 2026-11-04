import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-web-vitals> – how a page loads and responds, one tile per measure: the short and full name, the value, a word for
 * how it rates ("Good", "Needs improvement", "Poor"), a track with the three zones and a marker at the value, and a
 * small line of earlier readings when given. LCP, INP, CLS, FCP and TTFB know their usual limits; any other measure
 * passes its own. With `device` set, the header has a Mobile / Desktop switch – the page swaps the numbers.
 *   · read-only: the switch is the one control, a radio group (← / → move)
 *   · the tiles reflow to one column when it's narrow
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-web-vitals .metrics=${[{ id: "lcp", value: 2140 }, { id: "cls", value: 0.04 }]}></tc-web-vitals>
 */

export type WebVitalId = "lcp" | "inp" | "cls" | "fcp" | "ttfb";
export type WebVitalUnit = "ms" | "s" | "";
export type WebVitalRating = "good" | "needs" | "poor";
export type WebVitalDevice = "mobile" | "desktop";
export type WebVital = {
  /** "lcp", "inp", "cls", "fcp", "ttfb" or a measure of the page's own */
  id: WebVitalId | (string & {});
  /** The short name shown; by default the id in capitals */
  label?: string;
  /** The full name; known ids have one */
  name?: string;
  value: number;
  /** "ms" (the default for known timings), "s", or "" for a score such as CLS */
  unit?: WebVitalUnit;
  /** At or under this it's good; known ids have defaults */
  good?: number;
  /** Over this it's poor; known ids have defaults */
  poor?: number;
  /** Earlier readings, oldest first */
  history?: number[];
};
export type WebVitalsDeviceChange = { device: WebVitalDevice };
export type WebVitalsLabels = Record<WebVitalRating | WebVitalDevice | "device" | "empty" | "trend" | "goodCount", string>;
export const defaultWebVitalsLabels: WebVitalsLabels = {
  good: "Good",
  needs: "Needs improvement",
  poor: "Poor",
  mobile: "Mobile",
  desktop: "Desktop",
  device: "Device",
  empty: "No measurements yet",
  trend: "Earlier readings",
  goodCount: "good",
};

/** The usual limits and names (web.dev, 2024) */
export const webVitalDefaults: Record<WebVitalId, { name: string; unit: WebVitalUnit; good: number; poor: number }> = {
  lcp: { name: "Largest Contentful Paint", unit: "ms", good: 2500, poor: 4000 },
  inp: { name: "Interaction to Next Paint", unit: "ms", good: 200, poor: 500 },
  cls: { name: "Cumulative Layout Shift", unit: "", good: 0.1, poor: 0.25 },
  fcp: { name: "First Contentful Paint", unit: "ms", good: 1800, poor: 3000 },
  ttfb: { name: "Time to First Byte", unit: "ms", good: 800, poor: 1800 },
};

/** "good" at or under `good`, "poor" over `poor`, "needs" between */
export function rateWebVital(value: number, good: number, poor: number): WebVitalRating {
  return value <= good ? "good" : value > poor ? "poor" : "needs";
}

type Resolved = Required<Pick<WebVital, "id" | "value" | "good" | "poor">> & { label: string; name: string; unit: WebVitalUnit; history: number[]; rating: WebVitalRating };

/* Icons: Lucide (ISC, lucide.dev) – gauge */
const headIcon = svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`;
/* A mark per rating, so the colour is never the only cue: a filled circle, a triangle, a square */
const MARK: Record<WebVitalRating, unknown> = {
  good: svg`<circle cx="6" cy="6" r="4.5"></circle>`,
  needs: svg`<path d="M6 1.5 10.8 10H1.2Z"></path>`,
  poor: svg`<rect x="1.75" y="1.75" width="8.5" height="8.5" rx="1"></rect>`,
};

/**
 * Core Web Vitals for a page: a tile per measure with its value, a rating word, a three-zone track and earlier readings.
 * @tag tc-web-vitals
 * @fires tc-device-change - Mobile or Desktop was chosen ({ device }: WebVitalsDeviceChange); cancelable – prevented, `device` stays as it was
 */
export class TcWebVitals extends TcElement {
  static override ui = "wvit";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Web vitals";
  /** Small text under the heading – the page or route measured */
  @property() accessor description = "";
  /** The measures, in order */
  @property({ attribute: false }) accessor metrics: WebVital[] = [];
  /** Which device the numbers are for; set, the header shows the switch */
  @property() accessor device: WebVitalDevice | null = null;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<WebVitalsLabels> = {};
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  private resolved: Resolved[] = [];

  private get words() {
    return { ...defaultWebVitalsLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.resolved = this.metrics.map((m) => {
      const d = Object.hasOwn(webVitalDefaults, m.id) ? webVitalDefaults[m.id as WebVitalId] : undefined;
      const unit = m.unit ?? d?.unit ?? "";
      // Supplied limits already use the metric's unit; convert only defaults defined in milliseconds.
      const scale = d?.unit === "ms" && unit === "s" ? 1 / 1000 : 1;
      const good = m.good ?? (d ? d.good * scale : 0);
      const poor = Math.max(good, m.poor ?? (d ? d.poor * scale : good));
      return { id: m.id, value: m.value, good, poor, label: m.label ?? m.id.toUpperCase(), name: m.name ?? d?.name ?? "", unit, history: m.history ?? [], rating: rateWebVital(m.value, good, poor) };
    });
  }

  /** "180 ms", "2.1 s" for timings of a second or more, "0.08" for a score */
  private format(value: number, unit: WebVitalUnit) {
    const n = (v: number, digits: number) => new Intl.NumberFormat(this.locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
    if (unit === "") return n(value, 2);
    const s = unit === "s" ? value : value / 1000;
    if (unit === "s" || value >= 1000) return `${n(s, s < 10 ? 1 : 0)} s`;
    return `${n(value, 0)} ms`;
  }

  private setDevice(device: WebVitalDevice, focus = false) {
    if (device !== this.device && this.emit<WebVitalsDeviceChange>("tc-device-change", { device }, { cancelable: true })) this.device = device;
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-wvit__dev[aria-checked="true"]`)?.focus());
  }

  private onDeviceKey = (e: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next: WebVitalDevice = e.key === "Home" ? "mobile" : e.key === "End" ? "desktop" : this.device === "mobile" ? "desktop" : "mobile";
    this.setDevice(next, true);
  };

  private track(m: Resolved) {
    // The scale runs to half again past the poor limit, or further when the value is past that
    const max = Math.max(m.poor * 1.5, m.value * 1.05, m.good * 2) || 1;
    const pct = (v: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`;
    return html`<div class="ui-wvit__track" aria-hidden="true">
      <span class="ui-wvit__zone" data-zone="good" style=${styleMap({ width: pct(m.good) })}></span>
      <span class="ui-wvit__zone" data-zone="needs" style=${styleMap({ width: `calc(${pct(m.poor)} - ${pct(m.good)})` })}></span>
      <span class="ui-wvit__zone" data-zone="poor"></span>
      <span class="ui-wvit__marker" style=${styleMap({ left: pct(m.value) })}></span>
    </div>`;
  }

  private spark(m: Resolved) {
    const h = m.history;
    if (h.length < 2) return nothing;
    const lo = Math.min(...h);
    const hi = Math.max(...h);
    const span = hi - lo || 1;
    const points = h.map((v, i) => `${((i / (h.length - 1)) * 100).toFixed(2)},${(22 - ((v - lo) / span) * 20).toFixed(2)}`).join(" ");
    return html`<div class="ui-wvit__trend">
      <svg class="ui-wvit__spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">${svg`<polyline points=${points}></polyline>`}</svg>
      <span class="ui-wvit__sr">${this.words.trend}: ${h.map((v) => this.format(v, m.unit)).join(", ")}</span>
    </div>`;
  }

  private tile(m: Resolved) {
    const w = this.words;
    return html`<li class="ui-wvit__tile" data-id=${m.id} data-rating=${m.rating}>
      <div class="ui-wvit__names">
        <span class="ui-wvit__short">${m.label}</span>${m.name ? html` <span class="ui-wvit__name">${m.name}</span>` : nothing}
      </div>
      <div class="ui-wvit__reading">
        <span class="ui-wvit__value">${this.format(m.value, m.unit)}</span>
        <span class="ui-wvit__rating"><svg class="ui-wvit__mark" viewBox="0 0 12 12" aria-hidden="true">${MARK[m.rating]}</svg>${w[m.rating]}</span>
      </div>
      ${this.track(m)}${this.spark(m)}
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const good = this.resolved.filter((m) => m.rating === "good").length;
    const count = this.resolved.length ? html`<span class="ui-wvit__count">${good}/${this.resolved.length} ${w.goodCount}</span>` : nothing;
    const devices = this.device
      ? html`<div class="ui-wvit__devs" role="radiogroup" aria-label=${w.device} @keydown=${this.onDeviceKey}>
          ${(["mobile", "desktop"] as const).map(
            (d) => html`<button type="button" role="radio" class="ui-wvit__dev" data-device=${d} aria-checked=${d === this.device ? "true" : "false"} tabindex=${d === this.device ? 0 : -1} @click=${() => this.setDevice(d)}>${w[d]}</button>`,
          )}
        </div>`
      : nothing;
    const aside = count === nothing && devices === nothing ? undefined : html`${count}${devices}`;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside }) : nothing}
      <div class="ui-wvit__card">
        ${this.resolved.length
          ? html`<ul class="ui-wvit__grid" aria-label=${this.heading || "Web vitals"}>${this.resolved.map((m) => this.tile(m))}</ul>`
          : html`<p class="ui-wvit__empty">${w.empty}</p>`}
      </div>`;
  }

  static override css = /* css */ `
[data-ui="wvit"] {
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  container-type: inline-size;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
  --tc-wvit-tile-min: 13rem;
  --tc-wvit-track-h: var(--tc-space-1-5);
}
[data-ui="wvit"] *, [data-ui="wvit"] *::before, [data-ui="wvit"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wvit"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wvit"] .ui-wvit__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="wvit"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-wvit__card { overflow: hidden; }
.ui-wvit__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-wvit__count { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-wvit__devs { display: flex; gap: var(--tc-space-0-5); padding: var(--tc-space-0-5); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-wvit__dev { min-height: calc(var(--tc-control-h-sm) - var(--tc-space-1)); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-sm); cursor: pointer; }
.ui-wvit__dev:hover { color: var(--tc-text-primary); }
.ui-wvit__dev[aria-checked="true"] { background: var(--tc-surface-control); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-text-primary); }
.ui-wvit__dev:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }

.ui-wvit__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--tc-wvit-tile-min)), 1fr)); gap: var(--tc-hairline); margin: 0; padding: 0; list-style: none; background: var(--tc-divider); }
.ui-wvit__tile { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3) var(--tc-space-4); background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="wvit"] .ui-wvit__tile { background: var(--tc-surface-raised); }
.ui-wvit__names { display: grid; min-width: 0; }
.ui-wvit__short { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); }
.ui-wvit__name { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-wvit__reading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-wvit__value { color: var(--tc-text-strong); font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-wvit__rating { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-wvit__mark { flex: none; width: var(--tc-space-2-5); height: var(--tc-space-2-5); fill: currentColor; }
[data-rating="good"] .ui-wvit__rating { color: var(--tc-status-success-fg); }
[data-rating="needs"] .ui-wvit__rating { color: var(--tc-status-warning-fg); }
[data-rating="poor"] .ui-wvit__rating { color: var(--tc-status-danger-fg); }
.ui-wvit__track { position: relative; display: flex; gap: var(--tc-hairline); height: var(--tc-wvit-track-h); margin: var(--tc-space-1) 0; }
.ui-wvit__zone { flex: none; height: 100%; }
.ui-wvit__zone[data-zone="good"] { border-radius: var(--tc-meter-radius) 0 0 var(--tc-meter-radius); background: var(--tc-status-success-border); }
.ui-wvit__zone[data-zone="needs"] { background: var(--tc-status-warning-border); }
.ui-wvit__zone[data-zone="poor"] { flex: 1; border-radius: 0 var(--tc-meter-radius) var(--tc-meter-radius) 0; background: var(--tc-status-danger-border); }
.ui-wvit__marker { position: absolute; top: 50%; width: var(--tc-space-1); height: calc(var(--tc-wvit-track-h) + var(--tc-space-2)); border-radius: var(--tc-radius-full); background: var(--tc-text-strong); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-surface-raised); transform: translate(-50%, -50%); }
.ui-wvit__trend { min-width: 0; }
.ui-wvit__spark { display: block; width: 100%; height: var(--tc-space-6); overflow: visible; }
.ui-wvit__spark polyline { fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ui-wvit__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
@media (forced-colors: active) {
  .ui-wvit__zone { background: GrayText; }
  .ui-wvit__marker { background: CanvasText; }
  .ui-wvit__spark polyline { stroke: CanvasText; }
  .ui-wvit__dev[aria-checked="true"] { outline: var(--tc-hairline) solid Highlight; }
}
`;
}

if (!customElements.get("tc-web-vitals")) customElements.define("tc-web-vitals", TcWebVitals);
declare global {
  interface HTMLElementTagNameMap {
    "tc-web-vitals": TcWebVitals;
  }
}
