import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { arcLine, TAU } from "./internal/chart/geometry";
import { MotionController } from "./internal/chart/motion-controller";

/*
 * <tc-score-ring> – one overall score made of weighted sub-scores. A ring split into a segment per sub-score, each as
 * long as its weight and filled as far as its own score, the overall score (0–100) large in its middle with its band
 * word ("Good", "Fair", "Needs attention") and a caption. Beside it a row per sub-score; pointing at a segment or its
 * row, or focusing the row, isolates it – the other segments go quiet and the middle shows that sub-score. Below,
 * metric rows give the plain facts behind the score. The segments sweep round in turn when the ring first comes on
 * screen (at once with `still` or reduced motion) and glide when the scores change.
 *   · the sub-score rows are one tab stop: arrows move, Home / End go to the ends, Enter or Space selects the
 *     sub-score (again clears it), Escape clears it
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row. When
 * narrow, the rows sit under the ring.
 *
 *   <tc-score-ring heading="Data quality" .subscores=${[{ id: "complete", label: "Completeness", score: 91, weight: 3 }, …]}></tc-score-ring>
 */

/** A gauge: Lucide (ISC, lucide.dev) */
const gaugeIcon = svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`;

export type ScoreRingTone = "success" | "info" | "neutral" | "warning" | "danger";

export type ScoreRingSubscore = {
  id: string;
  label: string;
  /** Its own score, 0–100 */
  score: number;
  /** How much it counts towards the overall score; the segment's length. By default 1 */
  weight?: number;
  /** The segment's colour, any CSS colour; by default the chart palette in turn */
  color?: string;
};

export type ScoreRingMetric = {
  label: string;
  /** The value as a number (formatted for `locale`) or as written */
  value: number | string;
  /** After the value: "%", "days" */
  unit?: string;
  /** The change since last time, as written: "+4%", "−2 days" */
  change?: string;
  /** Whether the change is good news; colours it, beside its sign */
  trend?: "good" | "bad" | "neutral";
};

export type ScoreRingBand = {
  /** The lowest overall score in the band */
  min: number;
  /** The band's word, under the score */
  label: string;
  tone: ScoreRingTone;
};

/** Details of the events */
export type ScoreRingSubscoreChange = {
  /** The selected sub-score's id; null when cleared */
  subscore: string | null;
  item?: ScoreRingSubscore;
};

/** The bands when the page gives none: 80 and up Good, 60 and up Fair, else Needs attention */
export const defaultScoreRingBands: ScoreRingBand[] = [
  { min: 80, label: "Good", tone: "success" },
  { min: 60, label: "Fair", tone: "warning" },
  { min: 0, label: "Needs attention", tone: "danger" },
];

type Seg = { id: string; a0: number; a1: number; frac: number; ink: string };

/** The ring's geometry, in viewBox units */
const SIZE = 120;
const R = 50;
const STROKE = 11;
/** The gap between segments, in radians */
const GAP = 0.07;

let uidCount = 0;

const clampScore = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0);

/**
 * One overall score from weighted sub-scores – a ring with a segment per sub-score, the score and its band in the
 * middle, a row per sub-score that isolates its segment, and the metrics behind it.
 * @tag tc-score-ring
 * @fires tc-subscore-change - A sub-score was selected or cleared ({ subscore, item }: ScoreRingSubscoreChange); cancelable – prevented, `subscore` stays as it was
 */
export class TcScoreRing extends TcElement {
  static override ui = "scrg";

  /** The heading */
  @property() accessor heading = "Score";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The parts of the score, in the order they go round the ring from the top */
  @property({ attribute: false }) accessor subscores: ScoreRingSubscore[] = [];
  /** The overall score, 0–100; by default the sub-scores' average weighted by `weight` */
  @property({ type: Number }) accessor score: number | undefined = undefined;
  /** The words for score ranges, any order; by default Good (80+), Fair (60+) and Needs attention */
  @property({ attribute: false }) accessor bands: ScoreRingBand[] = defaultScoreRingBands;
  /** The line under the band word */
  @property() accessor caption = "out of 100";
  /** The facts behind the score, as rows under the ring */
  @property({ attribute: false }) accessor metrics: ScoreRingMetric[] = [];
  /** The selected sub-score's id, isolated until cleared. Changed by the user unless a tc-subscore-change listener calls preventDefault() */
  @property() accessor subscore: string | null = null;
  /** Draw without motion */
  @property({ type: Boolean }) accessor still = false;
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor hover: string | null = null;
  @state() private accessor activeId = "";
  @state() private accessor announce = "";
  @state() private accessor onScreen = false;

  private uid = `tc-scrg-${++uidCount}`;
  private motion = new MotionController<Seg>(this);
  private io?: IntersectionObserver;
  private segs: Seg[] = [];

  override connectedCallback() {
    super.connectedCallback();
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((entries) => {
        if (entries[entries.length - 1].isIntersecting) {
          this.onScreen = true;
          this.io?.disconnect();
        }
      });
      this.io.observe(this);
    } else this.onScreen = true;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
  }

  /** Plays the sweep again */
  replay() {
    this.motion.replay();
  }

  /* ---------- The model ---------- */

  private get list() {
    return this.subscores.filter((s) => s && s.id);
  }
  private weightOf(s: ScoreRingSubscore) {
    const w = s.weight ?? 1;
    return Number.isFinite(w) && w > 0 ? w : 0;
  }
  private get overall() {
    if (this.score !== undefined && Number.isFinite(this.score)) return Math.round(clampScore(this.score));
    let w = 0;
    let t = 0;
    for (const s of this.list) {
      const k = this.weightOf(s);
      w += k;
      t += clampScore(s.score) * k;
    }
    return w ? Math.round(t / w) : null;
  }
  private bandOf(score: number) {
    const bands = [...(this.bands.length ? this.bands : defaultScoreRingBands)].sort((a, b) => b.min - a.min);
    return bands.find((b) => score >= b.min) ?? bands[bands.length - 1];
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(n);
  }
  private share(s: ScoreRingSubscore) {
    const total = this.list.reduce((n, x) => n + this.weightOf(x), 0);
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(total ? this.weightOf(s) / total : 0);
  }

  private buildSegs(): Seg[] {
    const list = this.list.filter((s) => this.weightOf(s) > 0);
    const total = list.reduce((n, s) => n + this.weightOf(s), 0);
    if (!total) return [];
    const gap = list.length > 1 ? GAP : 0;
    const room = TAU - gap * list.length;
    let a = gap / 2;
    return list.map((s, k) => {
      const len = (room * this.weightOf(s)) / total;
      const seg = { id: s.id, a0: a, a1: a + len, frac: clampScore(s.score) / 100, ink: s.color ?? `var(--tc-chart-${(k % 6) + 1})` };
      a += len + gap;
      return seg;
    });
  }

  /* ---------- Selection and keyboard ---------- */

  private setSubscore(next: string | null) {
    if (next === this.subscore) return;
    const item = next === null ? undefined : this.list.find((s) => s.id === next);
    if (!this.emit<ScoreRingSubscoreChange>("tc-subscore-change", { subscore: next, item }, { cancelable: true })) return;
    this.subscore = next;
    this.announce = item ? `Selected ${item.label}: ${this.num(clampScore(item.score))}` : "Selection cleared";
  }

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-subscore]");
    if (!row || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const list = this.list;
    const i = list.findIndex((s) => s.id === row.dataset.subscore);
    if (e.key === "Escape") {
      if (this.subscore !== null) {
        e.preventDefault();
        this.setSubscore(null);
      }
      return;
    }
    const to =
      e.key === "ArrowDown" || e.key === "ArrowRight" ? i + 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = list[Math.max(0, Math.min(list.length - 1, to))];
    this.activeId = next.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-subscore="${CSS.escape(next.id)}"]`)?.focus());
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.subscore !== null && !this.list.some((s) => s.id === this.subscore)) this.subscore = null;
    if (this.hover !== null && !this.list.some((s) => s.id === this.hover)) this.hover = null;
    if (!this.hasUpdated || changed.has("subscores") || changed.has("still") || changed.has("onScreen")) {
      if (!this.hasUpdated || changed.has("subscores")) this.segs = this.buildSegs();
      this.motion.sync(
        this.segs.map((s, k) => ({ key: s.id, to: [s.frac], from: [0], enter: [0], delay: k * 140, data: s })),
        {
          enabled: !this.still && !reducedMotion(),
          active: this.onScreen,
          dataKey: this.segs.map((s) => `${s.id}:${s.frac}:${s.a0}`).join("|"),
          easing: "easeOut",
          duration: 900,
          stagger: 60,
        },
      );
    }
  }

  /* ---------- Rendering ---------- */

  private renderRing(shown: ScoreRingSubscore | undefined, overall: number) {
    const c = SIZE / 2;
    const iso = shown?.id ?? null;
    const band = this.bandOf(overall);
    const summary = `${this.heading}: ${this.num(overall)} ${this.caption}, ${band.label}. ${this.list.map((s) => `${s.label} ${this.num(clampScore(s.score))}`).join(", ")}`;
    return html`<div class="ui-scrg__ring" role="img" aria-label=${summary}>
      <svg viewBox=${`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        ${repeat(
          this.segs,
          (s) => s.id,
          (s) => {
            const t = Math.max(0, Math.min(1, this.motion.get(s.id)?.[0] ?? s.frac));
            const end = s.a0 + (s.a1 - s.a0) * t;
            return svg`<g
              class="ui-scrg__seg"
              data-seg=${s.id}
              ?data-muted=${iso !== null && iso !== s.id}
              ?data-on=${iso === s.id}
              style=${`--tc-scrg-ink: ${s.ink}`}
              @pointerenter=${() => (this.hover = s.id)}
              @click=${() => this.setSubscore(this.subscore === s.id ? null : s.id)}
            >
              <path class="ui-scrg__track" d=${arcLine(c, c, R, s.a0, s.a1)} stroke-width=${STROKE}></path>
              ${end - s.a0 > 0.001 ? svg`<path class="ui-scrg__fill" d=${arcLine(c, c, R, s.a0, end)} stroke-width=${STROKE}></path>` : nothing}
            </g>`;
          },
        )}
      </svg>
      <span class="ui-scrg__mid" aria-hidden="true">
        ${shown
          ? html`<span class="ui-scrg__num">${this.num(clampScore(shown.score))}</span><span class="ui-scrg__band ui-scrg__band--sub">${shown.label}</span>`
          : html`<span class="ui-scrg__num">${this.num(overall)}</span><span class="ui-scrg__band" data-tone=${band.tone}><span class="ui-scrg__dot"></span>${band.label}</span><span class="ui-scrg__caption">${this.caption}</span>`}
      </span>
    </div>`;
  }

  private renderRows(shown: ScoreRingSubscore | undefined) {
    const list = this.list;
    const stop = list.some((s) => s.id === this.activeId) ? this.activeId : (this.subscore ?? list[0]?.id);
    const ink = new Map(this.segs.map((s) => [s.id, s.ink]));
    return html`<div class="ui-scrg__rows" role="group" aria-label=${`${this.heading} sub-scores`} aria-describedby=${`${this.uid}-keys`} @keydown=${this.onKey}>
      ${repeat(
        list,
        (s) => s.id,
        (s) => html`<button
          type="button"
          class="ui-scrg__row"
          data-subscore=${s.id}
          aria-pressed=${this.subscore === s.id ? "true" : "false"}
          ?data-muted=${shown !== undefined && shown.id !== s.id}
          tabindex=${s.id === stop ? 0 : -1}
          style=${`--tc-scrg-ink: ${ink.get(s.id) ?? "var(--tc-chart-neutral)"}`}
          @pointerenter=${() => (this.hover = s.id)}
          @focus=${() => {
            this.activeId = s.id;
            this.hover = s.id;
          }}
          @blur=${() => {
            if (this.hover === s.id) this.hover = null;
          }}
          @click=${() => this.setSubscore(this.subscore === s.id ? null : s.id)}
        >
          <span class="ui-scrg__swatch" aria-hidden="true"></span>
          <span class="ui-scrg__row-label">${s.label}</span>
          <span class="ui-scrg__row-weight">${this.share(s)}<span class="ui-scrg__sr"> of the score</span></span>
          <span class="ui-scrg__row-score">${this.num(clampScore(s.score))}</span>
        </button>`,
      )}
    </div>`;
  }

  private renderMetrics() {
    if (!this.metrics.length) return nothing;
    return html`<dl class="ui-scrg__metrics">
      ${this.metrics.map(
        (m) => html`<div class="ui-scrg__metric">
          <dt class="ui-scrg__metric-label">${m.label}</dt>
          <dd class="ui-scrg__metric-value">
            ${typeof m.value === "number" ? this.num(m.value) : m.value}${m.unit ? html`<span class="ui-scrg__metric-unit"> ${m.unit}</span>` : nothing}
            ${m.change ? html`<span class="ui-scrg__metric-change" data-trend=${m.trend ?? "neutral"}>${m.change}</span>` : nothing}
          </dd>
        </div>`,
      )}
    </dl>`;
  }

  protected override render() {
    const id = this.uid;
    const overall = this.overall;
    const shownId = this.hover ?? this.subscore;
    const shown = shownId === null ? undefined : this.list.find((s) => s.id === shownId);
    return html`
      <span class="ui-scrg__sr" role="status">${this.announce}</span>
      <span class="ui-scrg__sr" id=${`${id}-keys`}>Arrow keys move between sub-scores; Enter selects one</span>
      ${cardHead({ icon: gaugeIcon, title: this.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-scrg__card" @pointerleave=${() => (this.hover = null)}>
        ${overall === null
          ? html`<p class="ui-scrg__empty">No score to show yet.</p>`
          : html`<div class="ui-scrg__top">${this.renderRing(shown, overall)}${this.renderRows(shown)}</div>`}
        ${this.renderMetrics()}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="scrg"] {
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
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="scrg"] {
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
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The empty part of each segment and the ring's size – override either on the element */
[data-ui="scrg"] { --tc-scrg-track: var(--tc-meter-track); --tc-scrg-size: 152px; }
[data-ui="scrg"] *, [data-ui="scrg"] *::before, [data-ui="scrg"] *::after { box-sizing: border-box; }
[data-ui="scrg"] p, [data-ui="scrg"] dl, [data-ui="scrg"] dd { margin: 0; }
[data-ui="scrg"] svg { display: block; }
:where([data-ui="scrg"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-scrg__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ui-scrg__card { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-scrg__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-scrg__card { padding-top: var(--tc-space-1); }
.ui-scrg__top { display: flex; align-items: center; gap: var(--tc-space-5); }
/* ----- The ring ----- */
.ui-scrg__ring { position: relative; flex: none; width: var(--tc-scrg-size); height: var(--tc-scrg-size); }
.ui-scrg__ring svg { width: 100%; height: 100%; overflow: visible; }
.ui-scrg__seg { cursor: pointer; }
.ui-scrg__track, .ui-scrg__fill { fill: none; stroke-linecap: butt; transition: stroke var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-scrg__track { stroke: var(--tc-scrg-track); }
.ui-scrg__fill { stroke: var(--tc-scrg-ink); }
/* Isolated: the other segments go quiet, mixed most of the way into the track */
.ui-scrg__seg[data-muted] .ui-scrg__fill { stroke: color-mix(in oklab, var(--tc-scrg-ink) 22%, var(--tc-scrg-track)); }
.ui-scrg__mid { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; padding: var(--tc-space-5); text-align: center; }
.ui-scrg__num { font-size: var(--tc-font-size-4xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-scrg__band { display: inline-flex; align-items: center; gap: var(--tc-space-1); margin-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); }
.ui-scrg__band--sub { color: var(--tc-text-secondary); }
.ui-scrg__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--tc-text-secondary); }
.ui-scrg__band[data-tone="success"] .ui-scrg__dot { background: var(--tc-status-success-fg); }
.ui-scrg__band[data-tone="info"] .ui-scrg__dot { background: var(--tc-status-info-fg); }
.ui-scrg__band[data-tone="warning"] .ui-scrg__dot { background: var(--tc-status-warning-fg); }
.ui-scrg__band[data-tone="danger"] .ui-scrg__dot { background: var(--tc-status-danger-fg); }
.ui-scrg__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
/* ----- A row per sub-score ----- */
.ui-scrg__rows { display: grid; flex: 1 1 auto; min-width: 0; gap: var(--tc-space-0-5); }
.ui-scrg__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) !important; border-radius: var(--tc-radius-sm); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-scrg__row:hover { background: var(--tc-fill-hover); }
.ui-scrg__row[aria-pressed="true"] { background: var(--tc-fill-selected); }
.ui-scrg__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-scrg__swatch { width: 10px; height: 10px; border-radius: var(--tc-radius-2xs); background: var(--tc-scrg-ink); }
.ui-scrg__row[data-muted] .ui-scrg__swatch { background: color-mix(in oklab, var(--tc-scrg-ink) 30%, var(--tc-scrg-track)); }
.ui-scrg__row-label { overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-scrg__row-weight { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-scrg__row-score { min-width: 2.5ch; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); text-align: right; font-variant-numeric: tabular-nums; }
.ui-scrg__row[data-muted] .ui-scrg__row-label, .ui-scrg__row[data-muted] .ui-scrg__row-score { color: var(--tc-text-secondary); }
/* ----- The facts behind the score ----- */
.ui-scrg__metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--tc-space-2); padding-top: var(--tc-space-3) !important; border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-scrg__metric { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-scrg__metric-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-scrg__metric-value { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-1-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-scrg__metric-unit { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-scrg__metric-change { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-scrg__metric-change[data-trend="good"] { color: var(--tc-status-success-fg); }
.ui-scrg__metric-change[data-trend="bad"] { color: var(--tc-status-danger-fg); }
.ui-scrg__empty { padding: var(--tc-space-6) 0 !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 420px) {
  .ui-scrg__top { flex-direction: column; align-items: stretch; }
  .ui-scrg__ring { align-self: center; }
}
@media (forced-colors: active) {
  .ui-scrg__fill { stroke: CanvasText; }
  .ui-scrg__seg[data-muted] .ui-scrg__fill, .ui-scrg__track { stroke: GrayText; }
  .ui-scrg__seg[data-on] .ui-scrg__fill { stroke: Highlight; }
  .ui-scrg__swatch { forced-color-adjust: none; }
  .ui-scrg__row[aria-pressed="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="scrg"] *, [data-ui="scrg"] *::before, [data-ui="scrg"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-score-ring")) customElements.define("tc-score-ring", TcScoreRing);

declare global {
  interface HTMLElementTagNameMap {
    "tc-score-ring": TcScoreRing;
  }
}
