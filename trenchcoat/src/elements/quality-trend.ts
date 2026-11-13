import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { ToolbarController } from "./internal/controllers";

/*
 * <tc-quality-trend> – judge scores on live chats, day by day, with what changed along the way. A line per criterion
 * (or one for the overall score), a band round each line that is wide on days with few chats and narrow on busy ones,
 * and the changes – a new prompt version, a model switch, a new tool – pinned on the time axis.
 *   · the summary says the movement in words: "Helpfulness 4.2 → 3.8 since v14 on 3 Nov" – the mean of the days before
 *     the latest change in range against the days from it, weighted by chats
 *   · the range switch shows the last 7, 30 or 90 days of the data (no clock: the last day in `days` is "today")
 *   · each criterion is a toggle in the legend; a line is drawn solid, dashed or dotted as well as in its colour
 *   · the change pins are one tab stop (arrows move); hover or focus shows the change, Enter or a click fires
 *     tc-change-open
 *   · Table swaps the chart for the same days as a table
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-quality-trend .criteria=${[…]} .days=${[…]} .changes=${[…]}></tc-quality-trend>
 *
 * `range`, `shown` and `view` change on their own; preventDefault() on tc-range-change, tc-shown-change or
 * tc-view-change keeps control.
 */

export type QualityCriterion = {
  id: string;
  /** What the judge scores – "Correctness", "Cites policy" */
  label: string;
  /** Any CSS colour; unset takes --tc-chart-1…6 in order */
  color?: string;
};

/** One criterion's scores on one day: the mean, how many chats were scored, and their spread if known */
export type QualityScore = { mean: number; n: number; sd?: number };

export type QualityDay = {
  /** The day, as epoch ms – midnight UTC by default (see `timeZone`) */
  date: number;
  /** The day's score per criterion id; a criterion with none that day leaves a gap in its line */
  scores: Record<string, QualityScore | undefined>;
};

export type QualityChangeKind = "prompt" | "model" | "tool" | "other";

export type QualityChange = {
  id: string;
  /** When it went live, as epoch ms */
  at: number;
  /** What changed, in a few words – "Prompt v13 → v14" */
  label: string;
  /** The short name the summary uses – "v14"; defaults to the label */
  short?: string;
  kind?: QualityChangeKind;
  /** A line more, shown in the pin's tooltip */
  detail?: string;
};

export type QualityRange = "7d" | "30d" | "90d";
export type QualityTrendView = "chart" | "table";
export type QualityTrendRangeChange = { range: QualityRange };
export type QualityTrendShownChange = { shown: string[] };
export type QualityTrendViewChange = { view: QualityTrendView };
export type QualityTrendChangeOpen = { id: string; change: QualityChange };
/** A criterion's mean before a moment and from it, weighted by chats; null where there are no scores */
export type QualityShift = { before: number | null; after: number | null; beforeN: number; afterN: number };

const DAY = 86_400_000;
const RANGE_DAYS: Record<QualityRange, number> = { "7d": 7, "30d": 30, "90d": 90 };
const RANGE_LABEL: Record<QualityRange, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days" };
const KIND_LABEL: Record<QualityChangeKind, string> = { prompt: "Prompt", model: "Model", tool: "Tool", other: "Change" };
/** Solid, dashed, dotted, dash-dot – so a line is told apart without its colour */
const DASHES = [undefined, "6 4", "1.5 3.5", "8 3.5 1.5 3.5"];
const colorOf = (c: QualityCriterion, k: number) => c.color || `var(--tc-chart-${(k % 6) + 1})`;
const dashOf = (k: number) => DASHES[k % DASHES.length];

/** Half the width of a score's band: z × standard error, from its own spread or the element's `spread` */
export function qualityBand(score: QualityScore, spread = 1, z = 1.96) {
  return score.n > 0 ? (z * (score.sd ?? spread)) / Math.sqrt(score.n) : 0;
}

/** A criterion's mean on the days before `at` and on the days from it, each weighted by the day's chats */
export function qualityShift(days: readonly QualityDay[], id: string, at: number): QualityShift {
  let b = 0;
  let bn = 0;
  let a = 0;
  let an = 0;
  for (const d of days) {
    const s = d.scores[id];
    if (!s || !(s.n > 0)) continue;
    if (d.date < at) {
      b += s.mean * s.n;
      bn += s.n;
    } else {
      a += s.mean * s.n;
      an += s.n;
    }
  }
  return { before: bn ? b / bn : null, after: an ? a / an : null, beforeN: bn, afterN: an };
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
/** activity: a pulse line – quality over time */
const mark = svg`<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>`;
const glyph = (d: TemplateResult) => html`<svg class="ui-qtr__glyph" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** The pins' marks, by kind: file-text (prompt), cpu (model), wrench (tool), git-commit (other) */
const KIND_ICON: Record<QualityChangeKind, TemplateResult> = {
  prompt: glyph(svg`<path d="M14 3v5h5"></path><path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"></path><path d="M9 13h6M9 17h4"></path>`),
  model: glyph(svg`<rect x="6" y="6" width="12" height="12" rx="2"></rect><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"></path>`),
  tool: glyph(svg`<path d="M14.7 6.3a4 4 0 0 0 5 5l-8.4 8.4a2.1 2.1 0 0 1-3-3z"></path><path d="M14.7 6.3 17 4"></path>`),
  other: glyph(svg`<circle cx="12" cy="12" r="3"></circle><path d="M3 12h6M15 12h6"></path>`),
};

/** The plot's frame: room for the y labels at the left and the dates below */
const PAD = { top: 10, right: 10, bottom: 24, left: 30 };
const HEIGHT = 196;

let instances = 0;

/**
 * Judge scores on live chats day by day, a line per criterion with a band from its sample size, the changes pinned on
 * the time axis, a 7 / 30 / 90-day switch, and a table view.
 * @tag tc-quality-trend
 * @fires tc-range-change - 7, 30 or 90 days was picked ({ range }: QualityTrendRangeChange); cancelable – prevented, `range` stays as it was
 * @fires tc-shown-change - A criterion was shown or hidden ({ shown }: QualityTrendShownChange); cancelable – prevented, `shown` stays as it was
 * @fires tc-view-change - Table was pressed ({ view }: QualityTrendViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-change-open - A change pin was clicked or picked with Enter ({ id, change }: QualityTrendChangeOpen)
 */
export class TcQualityTrend extends TcElement {
  static override ui = "qtr";

  /** The heading */
  @property() accessor heading = "Quality on live chats";
  /** A line under the heading – the agent, the judge */
  @property() accessor description = "";
  /** The criteria the judge scores, in legend order */
  @property({ attribute: false }) accessor criteria: QualityCriterion[] = [];
  /** One entry per day, any order – the last day is the end of every range */
  @property({ attribute: false }) accessor days: QualityDay[] = [];
  /** The changes made to the agent – prompts, models, tools – pinned where they went live */
  @property({ attribute: false }) accessor changes: QualityChange[] = [];
  /** How many days show: "7d", "30d" or "90d" */
  @property() accessor range: QualityRange = "30d";
  /** The ids of the criteria drawn; null draws every one */
  @property({ attribute: false }) accessor shown: string[] | null = null;
  /** "chart", or "table" for the same days as a table */
  @property() accessor view: QualityTrendView = "chart";
  /** The lowest score on the scale */
  @property({ type: Number }) accessor min = 1;
  /** The highest score on the scale */
  @property({ type: Number }) accessor max = 5;
  /** A score's spread (standard deviation) when a day gives none – sets the band's width with the day's chats */
  @property({ type: Number }) accessor spread = 1;
  /** How far a mean must move for the summary to call it a change */
  @property({ type: Number }) accessor threshold = 0.1;
  /** Formats dates and numbers */
  @property() accessor locale = "en-US";
  /** The time zone dates are read in – UTC by default, so a day's midnight stays that day */
  @property({ attribute: "time-zone" }) accessor timeZone = "UTC";

  /** @internal The plot's width, measured */
  @state() accessor width = 560;
  /** @internal The change pin under the pointer or keyboard */
  @state() accessor pin: string | null = null;
  /** @internal What the status region says after a change */
  @state() accessor spoken = "";

  private readonly uid = `tc-qtr${++instances}`;
  private readonly pins = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-qtr__pin")] });
  private resize?: ResizeObserver;
  /** @internal The days in range, oldest first */
  private inRange: QualityDay[] = [];
  private from = 0;
  private to = 0;
  private visible: { c: QualityCriterion; k: number }[] = [];
  private pinned: QualityChange[] = [];
  private summaryText = "";

  override connectedCallback() {
    super.connectedCallback();
    if (typeof ResizeObserver === "undefined") return;
    this.resize = new ResizeObserver(() => {
      const w = Math.round(this.querySelector<HTMLElement>(".ui-qtr__stage")?.clientWidth ?? 0);
      if (w > 0 && w !== this.width) this.width = w;
    });
    void this.updateComplete.then(() => {
      const stage = this.querySelector(".ui-qtr__stage");
      if (stage) this.resize?.observe(stage);
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resize?.disconnect();
    this.resize = undefined;
  }

  /** @internal */
  private get dateFmt() {
    return new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", timeZone: this.timeZone });
  }

  /** @internal */
  private score(n: number) {
    return n.toLocaleString(this.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const sorted = [...this.days].sort((a, b) => a.date - b.date);
    const last = sorted.length ? sorted[sorted.length - 1].date : 0;
    const span = RANGE_DAYS[this.range] ?? 30;
    this.to = last;
    this.from = last - (span - 1) * DAY;
    this.inRange = sorted.filter((d) => d.date >= this.from);
    const shown = this.shown;
    this.visible = this.criteria.map((c, k) => ({ c, k })).filter(({ c }) => !shown || shown.includes(c.id));
    this.pinned = this.changes.filter((c) => c.at >= this.from && c.at < this.to + DAY).sort((a, b) => a.at - b.at);
    if (this.pin && !this.pinned.some((c) => c.id === this.pin)) this.pin = null;
    this.summaryText = this.summarise();
  }

  /** @internal The movement since the latest change in range, in words */
  private summarise() {
    if (!this.inRange.length) return "No scores yet";
    if (!this.visible.length) return "Pick a criterion to show";
    const change = this.pinned[this.pinned.length - 1];
    if (!change) {
      const { c } = this.visible[0];
      const s = qualityShift(this.inRange, c.id, Infinity);
      return s.before === null ? `No ${c.label} scores in the last ${RANGE_LABEL[this.range]}` : `${c.label} averaged ${this.score(s.before)} over the last ${RANGE_LABEL[this.range]}`;
    }
    const since = `since ${change.short ?? change.label} on ${this.dateFmt.format(change.at)}`;
    const moved = this.visible
      .map(({ c }) => ({ c, s: qualityShift(this.inRange, c.id, change.at) }))
      .filter(({ s }) => s.before !== null && s.after !== null && Math.abs(s.after - s.before) >= this.threshold - 1e-9)
      .sort((a, b) => Math.abs(b.s.after! - b.s.before!) - Math.abs(a.s.after! - a.s.before!))
      .slice(0, 2);
    if (!moved.length) return `No criterion moved by ${this.score(this.threshold)} or more ${since}`;
    return moved.map(({ c, s }, i) => `${c.label} ${this.score(s.before!)} → ${this.score(s.after!)}${i === 0 ? ` ${since}` : ""}`).join("; ");
  }

  /** @internal */
  private setRange(range: QualityRange, focus = false) {
    if (range !== this.range && this.emit<QualityTrendRangeChange>("tc-range-change", { range }, { cancelable: true })) this.range = range;
    void this.updateComplete.then(() => {
      this.spoken = `Last ${RANGE_LABEL[this.range]}. ${this.summaryText}`;
      if (focus) this.querySelector<HTMLElement>(`.ui-qtr__range [aria-checked="true"]`)?.focus();
    });
  }

  /** @internal */
  private toggle(c: QualityCriterion) {
    const all = this.criteria.map((x) => x.id);
    const now = this.shown ?? all;
    const on = now.includes(c.id);
    const shown = on ? now.filter((id) => id !== c.id) : all.filter((id) => id === c.id || now.includes(id));
    if (this.emit<QualityTrendShownChange>("tc-shown-change", { shown }, { cancelable: true })) this.shown = shown;
    void this.updateComplete.then(() => (this.spoken = `${c.label} ${(this.shown ?? all).includes(c.id) ? "shown" : "hidden"}`));
  }

  /** @internal */
  private setView(view: QualityTrendView) {
    if (view !== this.view && this.emit<QualityTrendViewChange>("tc-view-change", { view }, { cancelable: true })) this.view = view;
  }

  /** @internal APG radio group: arrows move and pick */
  private onRangeKey = (e: KeyboardEvent) => {
    const all = Object.keys(RANGE_DAYS) as QualityRange[];
    const at = all.indexOf(this.range);
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in step)) return;
    e.preventDefault();
    this.setRange(all[(at + step[e.key] + all.length) % all.length], true);
  };

  /** @internal */
  private openChange(c: QualityChange) {
    this.pin = c.id;
    this.emit<QualityTrendChangeOpen>("tc-change-open", { id: c.id, change: c });
  }

  /** @internal x for a date, in the plot's px */
  private x(t: number) {
    const w = this.width - PAD.left - PAD.right;
    const span = this.to - this.from;
    return PAD.left + (span > 0 ? ((t - this.from) / span) * w : w / 2);
  }

  /** @internal y for a score, in the plot's px */
  private y(v: number) {
    const h = HEIGHT - PAD.top - PAD.bottom;
    const lo = this.min;
    const hi = this.max > lo ? this.max : lo + 1;
    const clamped = Math.max(lo, Math.min(hi, v));
    return PAD.top + (1 - (clamped - lo) / (hi - lo)) * h;
  }

  /** @internal The y ticks: whole scores on short scales, five steps on long ones */
  private ticks() {
    const lo = this.min;
    const hi = this.max > lo ? this.max : lo + 1;
    const steps = hi - lo <= 10 && Number.isInteger(lo) && Number.isInteger(hi) ? hi - lo : 4;
    return Array.from({ length: steps + 1 }, (_, i) => lo + ((hi - lo) * i) / steps);
  }

  /** @internal A few dates along the x axis, never crowded */
  private dateTicks() {
    const n = this.inRange.length;
    if (!n) return [];
    const fit = Math.max(2, Math.floor((this.width - PAD.left - PAD.right) / 72));
    const every = Math.max(1, Math.ceil(RANGE_DAYS[this.range] / fit));
    const out: number[] = [];
    for (let t = this.to; t >= this.from; t -= every * DAY) out.unshift(t);
    return out;
  }

  /** @internal One criterion's line and band, broken where a day has no score */
  private series(c: QualityCriterion, k: number) {
    const runs: { t: number; s: QualityScore }[][] = [];
    let run: { t: number; s: QualityScore }[] = [];
    for (const d of this.inRange) {
      const s = d.scores[c.id];
      if (s && s.n > 0 && Number.isFinite(s.mean)) run.push({ t: d.date, s });
      else if (run.length) {
        runs.push(run);
        run = [];
      }
    }
    if (run.length) runs.push(run);
    const color = colorOf(c, k);
    return svg`<g class="ui-qtr__series" data-id=${c.id} style=${styleMap({ "--tc-quality-trend-ink": color })}>
      ${runs.map((r) => {
        const up = r.map(({ t, s }) => `${this.x(t)},${this.y(s.mean + qualityBand(s, this.spread))}`);
        const down = r.map(({ t, s }) => `${this.x(t)},${this.y(s.mean - qualityBand(s, this.spread))}`).reverse();
        const line = r.map(({ t, s }) => `${this.x(t)},${this.y(s.mean)}`).join(" ");
        return svg`${r.length > 1 ? svg`<polygon class="ui-qtr__band" points=${[...up, ...down].join(" ")}></polygon>` : nothing}
          ${r.length > 1
            ? svg`<polyline class="ui-qtr__line" points=${line} stroke-dasharray=${dashOf(k) ?? nothing}></polyline>`
            : svg`<circle class="ui-qtr__dot" cx=${this.x(r[0].t)} cy=${this.y(r[0].s.mean)} r="2.5"></circle>`}`;
      })}
    </g>`;
  }

  /** @internal The chart: grid, bands, lines, the change rules, and the pins above them */
  private chart() {
    const w = this.width;
    const bottom = HEIGHT - PAD.bottom;
    const fmt = this.dateFmt;
    const active = this.pinned.find((c) => c.id === this.pin);
    return html`<div class="ui-qtr__plot">
      <svg class="ui-qtr__svg" width=${w} height=${HEIGHT} viewBox=${`0 0 ${w} ${HEIGHT}`} aria-hidden="true">
        ${this.ticks().map(
          (v) => svg`<line class="ui-qtr__grid" x1=${PAD.left} x2=${w - PAD.right} y1=${this.y(v)} y2=${this.y(v)}></line>
            <text class="ui-qtr__tick" x=${PAD.left - 8} y=${this.y(v)} text-anchor="end" dominant-baseline="middle">${Number.isInteger(v) ? v : this.score(v)}</text>`,
        )}
        ${this.dateTicks().map((t) => svg`<text class="ui-qtr__tick" x=${this.x(t)} y=${bottom + 16} text-anchor="middle">${fmt.format(t)}</text>`)}
        ${this.pinned.map((c) => svg`<line class="ui-qtr__rule" ?data-active=${c.id === this.pin} x1=${this.x(c.at)} x2=${this.x(c.at)} y1=${PAD.top} y2=${bottom}></line>`)}
        ${this.visible.map(({ c, k }) => this.series(c, k))}
      </svg>
      ${this.pinned.length
        ? html`<div class="ui-qtr__pins" role="toolbar" aria-label="Changes" @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Escape" && this.pin) {
              e.preventDefault();
              this.pin = null;
              return;
            }
            this.pins.onKeyDown(e);
          }} @focusin=${this.pins.onFocusIn}>
            ${this.pinned.map(
              (c) => html`<button
                type="button"
                class="ui-qtr__pin"
                data-kind=${c.kind ?? "other"}
                ?data-active=${c.id === this.pin}
                style=${styleMap({ left: `${this.x(c.at)}px` })}
                @pointerenter=${() => (this.pin = c.id)}
                @pointerleave=${(e: PointerEvent) => {
                  if (this.pin === c.id && document.activeElement !== e.currentTarget) this.pin = null;
                }}
                @focus=${() => (this.pin = c.id)}
                @blur=${() => (this.pin = this.pin === c.id ? null : this.pin)}
                @click=${() => this.openChange(c)}
              >${KIND_ICON[c.kind ?? "other"]}<span class="ui-qtr__sr">${c.label}, ${fmt.format(c.at)}${c.detail ? `. ${c.detail}` : ""}</span></button>`,
            )}
          </div>`
        : nothing}
      ${active
        ? html`<div
            class="ui-qtr__tip"
            aria-hidden="true"
            data-side=${this.x(active.at) > w * 0.6 ? "left" : "right"}
            style=${styleMap({ left: `${this.x(active.at)}px` })}
          >
            <span class="ui-qtr__tip-kind">${KIND_LABEL[active.kind ?? "other"]} · ${fmt.format(active.at)}</span>
            <span class="ui-qtr__tip-label">${active.label}</span>
            ${active.detail ? html`<span class="ui-qtr__tip-detail">${active.detail}</span>` : nothing}
          </div>`
        : nothing}
    </div>`;
  }

  /** @internal The same days as a table, newest first */
  private table() {
    const fmt = this.dateFmt;
    const days = [...this.inRange].reverse();
    return html`<div class="ui-qtr__table-wrap" tabindex="0" role="region" aria-label="Daily scores">
      <table class="ui-qtr__table">
        <thead>
          <tr>
            <th scope="col">Day</th>
            ${this.visible.map(({ c }) => html`<th scope="col">${c.label}</th>`)}
            <th scope="col">Changes</th>
          </tr>
        </thead>
        <tbody>
          ${days.map((d) => {
            const changes = this.pinned.filter((c) => c.at >= d.date && c.at < d.date + DAY);
            return html`<tr>
              <th scope="row">${fmt.format(d.date)}</th>
              ${this.visible.map(({ c }) => {
                const s = d.scores[c.id];
                return html`<td>${s && s.n > 0 ? html`${this.score(s.mean)}<span class="ui-qtr__n"> · ${s.n.toLocaleString(this.locale)} chats</span>` : html`<span class="ui-qtr__n">–</span>`}</td>`;
              })}
              <td>${changes.length ? changes.map((c) => c.label).join(", ") : ""}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </div>`;
  }

  /** @internal The legend: a toggle per criterion, its swatch drawn in its colour and dash */
  private legend() {
    const all = this.criteria.map((c) => c.id);
    const shown = new Set(this.shown ?? all);
    return html`<div class="ui-qtr__legend" role="group" aria-label="Criteria">
      ${this.criteria.map((c, k) => {
        const s = qualityShift(this.inRange, c.id, Infinity);
        return html`<button type="button" class="ui-qtr__crit" aria-pressed=${shown.has(c.id) ? "true" : "false"} @click=${() => this.toggle(c)}>
          <svg class="ui-qtr__swatch" viewBox="0 0 18 6" aria-hidden="true" style=${styleMap({ "--tc-quality-trend-ink": colorOf(c, k) })}>${svg`<line x1="1" y1="3" x2="17" y2="3" stroke-dasharray=${dashOf(k) ?? nothing}></line>`}</svg>
          ${c.label}${s.before !== null ? html`<span class="ui-qtr__crit-mean"><span class="ui-qtr__sr">, average </span>${this.score(s.before)}</span>` : nothing}
        </button>`;
      })}
    </div>`;
  }

  protected override render() {
    const titleId = `${this.uid}-title`;
    const ranges = Object.keys(RANGE_DAYS) as QualityRange[];
    const empty = !this.inRange.length;
    return html`
      ${cardHead({ icon: mark, title: this.heading, id: titleId, subtitle: this.description || nothing })}
      <div class="ui-qtr__card">
        <div class="ui-qtr__bar">
          <p class="ui-qtr__summary" id=${`${this.uid}-summary`}>${this.summaryText}</p>
          <div class="ui-qtr__controls">
            <div class="ui-qtr__range" role="radiogroup" aria-label="Range" @keydown=${this.onRangeKey}>
              ${ranges.map(
                (r) => html`<button
                  type="button"
                  role="radio"
                  class="ui-qtr__opt"
                  aria-checked=${r === this.range ? "true" : "false"}
                  tabindex=${r === this.range ? 0 : -1}
                  @click=${() => this.setRange(r)}
                >${r}<span class="ui-qtr__sr">, last ${RANGE_LABEL[r]}</span></button>`,
              )}
            </div>
            <button type="button" class="ui-qtr__view" aria-pressed=${this.view === "table" ? "true" : "false"} @click=${() => this.setView(this.view === "table" ? "chart" : "table")}>Table</button>
          </div>
        </div>
        ${this.criteria.length > 1 ? this.legend() : nothing}
        <div class="ui-qtr__stage" role="figure" aria-labelledby=${titleId} aria-describedby=${`${this.uid}-summary`}>
          ${empty ? html`<p class="ui-qtr__empty">No scores yet</p>` : this.view === "table" ? this.table() : this.chart()}
        </div>
      </div>
      <span class="ui-qtr__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="qtr"] */
[data-ui="qtr"] {
  --tc-quality-trend-band: 0.14;
  --tc-quality-trend-tip-w: 220px;
  --tc-quality-trend-pin: 22px;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-qtr / inline-size;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="qtr"] {
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="qtr"] *, [data-ui="qtr"] *::before, [data-ui="qtr"] *::after { box-sizing: border-box; }
[data-ui="qtr"] :is(p, table) { margin: 0; }
:where([data-ui="qtr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="qtr"] button:focus-visible, .ui-qtr__table-wrap:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-qtr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-qtr__glyph { display: block; width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.ui-qtr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-qtr__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
/* ----- The summary and the controls ----- */
.ui-qtr__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-2); }
.ui-qtr__summary { flex: 1 1 260px; min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-qtr__controls { display: flex; flex: none; align-items: center; gap: var(--tc-space-2); }
.ui-qtr__range { display: flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-qtr__opt { display: inline-flex; align-items: center; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="qtr"] .ui-qtr__opt:hover { color: var(--tc-text-primary); }
[data-ui="qtr"] .ui-qtr__opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-qtr__view { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); }
[data-ui="qtr"] .ui-qtr__view:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
[data-ui="qtr"] .ui-qtr__view[aria-pressed="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
/* ----- The legend ----- */
.ui-qtr__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-3-5) var(--tc-space-2); }
.ui-qtr__crit { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-muted); white-space: nowrap; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="qtr"] .ui-qtr__crit:hover { background: var(--tc-fill-hover); }
[data-ui="qtr"] .ui-qtr__crit[aria-pressed="true"] { background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-primary); }
.ui-qtr__crit[aria-pressed="false"] .ui-qtr__swatch { opacity: 0.4; }
.ui-qtr__swatch { display: block; flex: none; width: 18px; height: 6px; }
.ui-qtr__swatch line { stroke: var(--tc-quality-trend-ink); stroke-width: 2.25; stroke-linecap: round; }
.ui-qtr__crit-mean { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- The chart ----- */
.ui-qtr__stage { position: relative; min-width: 0; padding: 0 var(--tc-space-2) var(--tc-space-3); }
.ui-qtr__plot { position: relative; padding-top: calc(var(--tc-quality-trend-pin) + var(--tc-space-1)); }
.ui-qtr__svg { display: block; overflow: visible; }
.ui-qtr__grid { stroke: var(--tc-border-subtle); stroke-width: 1; }
.ui-qtr__tick { fill: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-qtr__rule { stroke: var(--tc-border-strong); stroke-width: 1; stroke-dasharray: 3 3; }
.ui-qtr__rule[data-active] { stroke: var(--tc-text-secondary); }
.ui-qtr__band { fill: var(--tc-quality-trend-ink); fill-opacity: var(--tc-quality-trend-band); stroke: none; }
.ui-qtr__line { fill: none; stroke: var(--tc-quality-trend-ink); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.ui-qtr__dot { fill: var(--tc-quality-trend-ink); }
/* The pins: a round mark per change above the plot, on the change's date */
.ui-qtr__pins { position: absolute; top: 0; right: 0; left: 0; height: var(--tc-quality-trend-pin); }
.ui-qtr__pin { position: absolute; top: 0; display: grid; place-items: center; width: var(--tc-quality-trend-pin); height: var(--tc-quality-trend-pin); translate: -50% 0; border-radius: 50%; background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="qtr"] .ui-qtr__pin:is(:hover, [data-active]) { background: var(--tc-text-primary); color: var(--tc-surface-raised); box-shadow: none; }
.ui-qtr__tip { position: absolute; top: calc(var(--tc-quality-trend-pin) + var(--tc-space-1-5)); z-index: 2; display: grid; gap: var(--tc-space-0-5); width: max-content; max-width: var(--tc-quality-trend-tip-w); padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); font-size: var(--tc-tooltip-font-size); line-height: var(--tc-line-height-snug); pointer-events: none; }
.ui-qtr__tip[data-side="right"] { translate: calc(-1 * var(--tc-space-3)) 0; }
.ui-qtr__tip[data-side="left"] { translate: calc(-100% + var(--tc-space-3)) 0; }
.ui-qtr__tip-kind { font-size: var(--tc-font-size-xs); color: inherit; }
.ui-qtr__tip-label { font-weight: var(--tc-font-weight-medium); }
.ui-qtr__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- The table ----- */
.ui-qtr__table-wrap { max-height: 280px; margin: 0 var(--tc-space-1-5); overflow: auto; border-radius: var(--tc-radius-md); }
.ui-qtr__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-qtr__table :is(th, td) { padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-border-subtle); text-align: left; white-space: nowrap; }
.ui-qtr__table thead th { position: sticky; top: 0; background: var(--tc-surface-on-tray); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *) .ui-qtr__table thead th { background: var(--tc-surface-raised); }
.ui-qtr__table tbody th { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-secondary); }
.ui-qtr__table td { color: var(--tc-text-primary); }
.ui-qtr__n { color: var(--tc-text-muted); }
@container ui-qtr (max-width: 480px) {
  .ui-qtr__summary { flex-basis: 100%; }
  .ui-qtr__crit-mean { display: none; }
}
@media (forced-colors: active) {
  .ui-qtr__line, .ui-qtr__swatch line { stroke: CanvasText; }
  .ui-qtr__band { fill: GrayText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="qtr"] *, [data-ui="qtr"] *::before, [data-ui="qtr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-quality-trend")) customElements.define("tc-quality-trend", TcQualityTrend);

declare global {
  interface HTMLElementTagNameMap {
    "tc-quality-trend": TcQualityTrend;
  }
}
