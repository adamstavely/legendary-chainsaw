import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { npsBand, type ScoreSurveyKind } from "./score-survey";

/*
 * <tc-score-summary> – the results of an NPS or CSAT survey: the score in big type with its name ("NPS +32",
 * "CSAT 84%"), how many answered, and how it compares with last time and the target.
 *   · NPS is the share of promoters (9–10) minus the share of detractors (0–6), from −100 to +100; CSAT is the share
 *     of 4s and 5s. Both are worked out from the counts and rounded once (half away from zero); the band shares are
 *     rounded separately so they add up to 100, so the score can differ by 1 from their difference
 *   · a stacked bar splits the answers into bands – detractors, passives, promoters, or the five CSAT answers – each
 *     named with its share and count in text, so colour is never the only cue
 *   · the distribution is a bar per score; the bars are one tab stop (arrows move, Enter picks, Escape clears), and
 *     picking one fires tc-score-select – to filter the comments, say
 *   · `previous` or `trend` add the change ("Up 6 points from Q2") and a sparkline; `target` adds a marker
 * Standard is a gray tray with the header on it and the results on a white card; Clean is one white card, the header
 * its first row.
 *
 *   <tc-score-summary kind="nps" .responses=${[4, 2, 3, 5, 6, 9, 12, 30, 41, 58, 70]}></tc-score-summary>
 *
 * The picked score is `selected` – a pick fires a cancelable tc-score-select ({ score, selected }); preventDefault() keeps
 * control.
 */

export type ScoreTrendPoint = {
  /** The period – "Q2" */
  label: string;
  /** The NPS or CSAT for it */
  value: number;
};

export type ScoreBandKey = "detractor" | "passive" | "promoter" | "1" | "2" | "3" | "4" | "5";
export type ScoreBand = {
  key: ScoreBandKey;
  label: string;
  count: number;
  /** Rounded so a summary's bands add up to 100 */
  percent: number;
};

export type ScoreSummaryResult = {
  total: number;
  /** NPS (−100…100) or CSAT (0…100); null with no responses */
  value: number | null;
  bands: ScoreBand[];
  /** Answers per score, lowest score first */
  counts: number[];
};

export type ScoreSummaryLabels = {
  detractors: string;
  passives: string;
  promoters: string;
  /** The five CSAT answers, from 1 to 5 */
  csat: [string, string, string, string, string];
  /** "responses" – after the count */
  responses: string;
  /** "response" – after a count of one */
  response: string;
  empty: string;
  target: string;
  distribution: string;
};

/** `selected` repeats `score`, so the event carries the property it changes */
export type ScoreSummaryScoreSelect = { score: number | null; selected: number | null };

export const defaultScoreSummaryLabels: ScoreSummaryLabels = {
  detractors: "Detractors",
  passives: "Passives",
  promoters: "Promoters",
  csat: ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"],
  responses: "responses",
  response: "response",
  empty: "No responses yet",
  target: "Target",
  distribution: "Answers by score",
};

/** Rounds shares of `total` so they add up to exactly 100 – largest remainder first */
export function percentsTo100(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    out[i]++;
    left--;
  }
  return out;
}

const scaleOf = (kind: ScoreSurveyKind) => (kind === "csat" ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

/** The counts per score from either input: counts lowest score first, or a list of scores */
export function scoreCounts(kind: ScoreSurveyKind, responses: number[] = [], scores: number[] = []): number[] {
  const scale = scaleOf(kind);
  if (responses.length) return scale.map((_, i) => Math.max(0, Math.floor(Number(responses[i]) || 0)));
  const counts = scale.map(() => 0);
  for (const s of scores) {
    const i = scale.indexOf(Math.round(s));
    if (i >= 0) counts[i]++;
  }
  return counts;
}

/** NPS or CSAT, its bands and the counts – what <tc-score-summary> shows */
export function summarizeScores(kind: ScoreSurveyKind, counts: number[], labels: ScoreSummaryLabels = defaultScoreSummaryLabels): ScoreSummaryResult {
  const total = counts.reduce((a, b) => a + b, 0);
  let bands: ScoreBand[];
  if (kind === "csat") {
    const pct = percentsTo100(counts);
    bands = counts.map((count, i) => ({ key: String(i + 1) as ScoreBandKey, label: labels.csat[i], count, percent: pct[i] }));
  } else {
    const by = { detractor: 0, passive: 0, promoter: 0 };
    counts.forEach((c, s) => (by[npsBand(s)] += c));
    const pct = percentsTo100([by.detractor, by.passive, by.promoter]);
    bands = [
      { key: "detractor", label: labels.detractors, count: by.detractor, percent: pct[0] },
      { key: "passive", label: labels.passives, count: by.passive, percent: pct[1] },
      { key: "promoter", label: labels.promoters, count: by.promoter, percent: pct[2] },
    ];
  }
  // From the counts, not the rounded band shares: those can be 1 out, and even flip the sign of a balanced NPS
  const exact = !total ? 0 : kind === "csat" ? ((bands[3].count + bands[4].count) / total) * 100 : ((bands[2].count - bands[0].count) / total) * 100;
  const value = !total ? null : Math.sign(exact) * Math.round(Math.abs(exact));
  return { total, value, bands, counts };
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-ssm__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** A gauge: a score */
const gaugeMark = svg`<path d="M4 15a8 8 0 1 1 16 0"></path><path d="M12 15l3.5-4.5"></path><path d="M4 19h16"></path>`;
const upIcon = glyph(svg`<path d="M7 17L17 7M9 7h8v8"></path>`);
const downIcon = glyph(svg`<path d="M7 7l10 10M17 9v8H9"></path>`);
const flatIcon = glyph(svg`<path d="M5 12h14"></path>`);

let instances = 0;

/**
 * NPS or CSAT results: the score, the bands, the answers per score, the change and the target.
 * @tag tc-score-summary
 * @fires tc-score-select - A score's bar was picked or cleared ({ score, selected }: ScoreSummaryScoreSelect); cancelable – prevented, `selected` stays as it was
 */
export class TcScoreSummary extends TcElement {
  static override ui = "ssm";

  /** The heading; defaults to "Net Promoter Score" or "Customer satisfaction" */
  @property() accessor heading = "";
  /** The line under the heading – the survey and the period */
  @property() accessor description = "";
  /** "nps" for 0–10 answers, "csat" for 1–5 */
  @property() accessor kind: ScoreSurveyKind = "nps";
  /** Answers per score, lowest score first: 11 for NPS (0–10), 5 for CSAT (1–5) */
  @property({ attribute: false }) accessor responses: number[] = [];
  /** Or the answers themselves, one score each – used when `responses` is empty */
  @property({ attribute: false }) accessor scores: number[] = [];
  /** The score last time, for the change; defaults to the last `trend` point */
  @property({ type: Number }) accessor previous: number | undefined = undefined;
  /** Earlier scores, oldest first – drawn as a sparkline ending at the current score */
  @property({ attribute: false }) accessor trend: ScoreTrendPoint[] = [];
  /** What the change is compared with – "last quarter"; defaults to the last `trend` label, else "last time" */
  @property({ attribute: "compared-to" }) accessor comparedTo = "";
  /** The score to reach, shown as a marker */
  @property({ type: Number }) accessor target: number | undefined = undefined;
  /** The picked score. Changed by the user unless a tc-score-select listener calls preventDefault() */
  @property({ type: Number }) accessor selected: number | null = null;
  /** Words the page can rename, merged over `defaultScoreSummaryLabels` */
  @property({ attribute: false }) accessor labels: Partial<ScoreSummaryLabels> = {};
  /** The locale for numbers */
  @property() accessor locale: string | undefined = undefined;

  /** @internal The bar with focus */
  @state() accessor active: number | null = null;

  private readonly uid = `tc-ssm${++instances}`;

  /** @internal */
  private get l(): ScoreSummaryLabels {
    return { ...defaultScoreSummaryLabels, ...this.labels };
  }

  /** The numbers shown: the total, NPS or CSAT, the bands and the counts */
  get summary(): ScoreSummaryResult {
    return summarizeScores(this.kind, scoreCounts(this.kind, this.responses, this.scores), this.l);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const scale = scaleOf(this.kind);
    if (this.selected !== null && !scale.includes(this.selected)) this.selected = null;
    if (this.active !== null && !scale.includes(this.active)) this.active = null;
  }

  /** @internal */
  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }

  /** @internal The score as written: "+32", "−8", "84%" */
  private fmt(v: number) {
    if (this.kind === "csat") return `${this.num(v)}%`;
    return v > 0 ? `+${this.num(v)}` : v < 0 ? `−${this.num(-v)}` : "0";
  }

  /** @internal */
  private setSelected(next: number | null) {
    if (next === this.selected) return;
    if (this.emit<ScoreSummaryScoreSelect>("tc-score-select", { score: next, selected: next }, { cancelable: true })) this.selected = next;
  }

  /** @internal */
  private focusBar(score: number) {
    this.active = score;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-dist [data-score="${score}"]`)?.focus());
  }

  /** @internal Toolbar keys: arrows move, Home and End go to the ends, Escape clears */
  private onKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-score]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const scale = scaleOf(this.kind);
    const i = scale.indexOf(Number(el.dataset.score));
    const moves: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: scale.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      this.focusBar(scale[Math.max(0, Math.min(scale.length - 1, moves[e.key]))]);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  /** @internal The change from last time, in words, with an arrow */
  private change(value: number) {
    const last = this.trend.at(-1);
    const previous = this.previous ?? last?.value;
    if (previous === undefined || !Number.isFinite(previous)) return nothing;
    const than = this.comparedTo || last?.label || "last time";
    const d = Math.round(value - previous);
    const n = Math.abs(d);
    const words = d === 0 ? `No change from ${than}` : `${d > 0 ? "Up" : "Down"} ${this.num(n)} ${n === 1 ? "point" : "points"} from ${than}`;
    return html`<span class="ui-ssm__change" data-dir=${d > 0 ? "up" : d < 0 ? "down" : "flat"}>${d > 0 ? upIcon : d < 0 ? downIcon : flatIcon}${words}</span>`;
  }

  /** @internal The trend as a sparkline, ending at the current score */
  private spark(value: number) {
    const pts = [...this.trend.map((p) => p.value), value].filter((v) => Number.isFinite(v));
    if (pts.length < 2) return nothing;
    const lo = Math.min(...pts);
    const hi = Math.max(...pts);
    const W = 96;
    const H = 28;
    const x = (i: number) => 2 + (i * (W - 4)) / (pts.length - 1);
    const y = (v: number) => (hi === lo ? H / 2 : 2 + ((hi - v) * (H - 4)) / (hi - lo));
    const line = pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const said = [...this.trend.map((p) => `${p.label} ${this.fmt(p.value)}`), `now ${this.fmt(value)}`].join(", ");
    return html`<span class="ui-ssm__spark">
      <svg class="ui-ssm__spark-svg" viewBox=${`0 0 ${W} ${H}`} aria-hidden="true">
        <polyline class="ui-ssm__spark-line" points=${line}></polyline>
        <circle class="ui-ssm__spark-dot" cx=${x(pts.length - 1)} cy=${y(value)} r="2.5"></circle>
      </svg>
      <span class="ui-ssm__sr">Trend: ${said}</span>
    </span>`;
  }

  /** @internal The scale the score sits on, with the target marker */
  private meter(value: number) {
    const nps = this.kind === "nps";
    const min = nps ? -100 : 0;
    const pos = (v: number) => ((Math.max(min, Math.min(100, v)) - min) / (100 - min)) * 100;
    const zero = pos(0);
    const at = pos(value);
    const t = this.target;
    const hasTarget = t !== undefined && Number.isFinite(t);
    const gap = hasTarget ? Math.round(value - t) : 0;
    return html`<div class="ui-ssm__meter">
      <span class="ui-ssm__track" aria-hidden="true">
        <span class="ui-ssm__fill" data-neg=${ifDefined(value < 0 ? "" : undefined)} style=${`left: ${Math.min(zero, at)}%; width: ${Math.abs(at - zero)}%`}></span>
        ${nps ? html`<span class="ui-ssm__zero" style=${`left: ${zero}%`}></span>` : nothing}
        ${hasTarget ? html`<span class="ui-ssm__target-tick" style=${`left: ${pos(t)}%`}></span>` : nothing}
      </span>
      <span class="ui-ssm__scale-ends" aria-hidden="true"><span>${this.fmt(min)}</span><span>${this.fmt(100)}</span></span>
      ${hasTarget
        ? html`<span class="ui-ssm__target" ?data-met=${gap >= 0}>${this.l.target} ${this.fmt(t)} · ${gap >= 0 ? "met" : `${this.num(-gap)} ${-gap === 1 ? "point" : "points"} below`}</span>`
        : nothing}
    </div>`;
  }

  /** @internal The bands as one stacked bar, then each named with its share and count */
  private bands(bands: ScoreBand[]) {
    return html`<div class="ui-ssm__bands">
      <div class="ui-ssm__stack" aria-hidden="true">
        ${bands.filter((b) => b.count > 0).map((b) => html`<span class="ui-ssm__seg" data-band=${b.key} style=${`flex-grow: ${b.count}`}></span>`)}
      </div>
      <ul class="ui-ssm__legend">
        ${bands.map(
          (b) => html`<li class="ui-ssm__key" data-band=${b.key}>
            <span class="ui-ssm__swatch" aria-hidden="true"></span>
            <span class="ui-ssm__key-label">${b.label}</span>
            <span class="ui-ssm__key-pct">${b.percent}%</span>
            <span class="ui-ssm__key-count">${this.num(b.count)}</span>
          </li>`,
        )}
      </ul>
    </div>`;
  }

  /** @internal A bar per score */
  private distribution(r: ScoreSummaryResult) {
    const scale = scaleOf(this.kind);
    const pct = percentsTo100(r.counts);
    const max = Math.max(1, ...r.counts);
    const stop = this.active ?? this.selected ?? scale[0];
    const l = this.l;
    const picked = this.selected === null ? -1 : scale.indexOf(this.selected);
    const bandOf = (s: number) => (this.kind === "csat" ? String(s) : npsBand(s));
    const unit = (n: number) => (n === 1 ? l.response : l.responses);
    return html`<div class="ui-ssm__dist-wrap">
      <span class="ui-ssm__caption" id=${`${this.uid}-dist-label`}>${l.distribution}</span>
      <div class="ui-ssm__dist" id=${`${this.uid}-dist`} role="toolbar" aria-labelledby=${`${this.uid}-dist-label`} data-kind=${this.kind} @keydown=${this.onKey}>
        ${scale.map((s, i) => {
          const c = r.counts[i];
          return html`<button
            type="button"
            class="ui-ssm__bar"
            data-score=${s}
            data-band=${bandOf(s)}
            ?data-zero=${c === 0}
            aria-pressed=${this.selected === s ? "true" : "false"}
            tabindex=${s === stop ? 0 : -1}
            @focus=${() => (this.active = s)}
            @click=${() => {
              this.active = s;
              this.setSelected(this.selected === s ? null : s);
            }}
          >
            <span class="ui-ssm__bar-count" aria-hidden="true">${this.num(c)}</span>
            <span class="ui-ssm__bar-track" aria-hidden="true"><span class="ui-ssm__bar-fill" style=${`height: ${c ? Math.max(3, (c / max) * 100) : 0}%`}></span></span>
            <span class="ui-ssm__bar-score">${s}</span><span class="ui-ssm__sr">: ${this.num(c)} ${unit(c)}, ${pct[i]}%</span>
          </button>`;
        })}
      </div>
      ${picked >= 0
        ? html`<p class="ui-ssm__picked">
            Score ${this.selected} · ${this.num(r.counts[picked])} ${unit(r.counts[picked])} (${pct[picked]}%)${this.kind === "nps" ? ` · ${r.bands.find((b) => b.key === npsBand(this.selected!))!.label}` : ` · ${l.csat[picked]}`}
          </p>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const r = this.summary;
    const l = this.l;
    const titleId = `${this.uid}-title`;
    const name = this.kind === "csat" ? "CSAT" : "NPS";
    const heading = this.heading || (this.kind === "csat" ? "Customer satisfaction" : "Net Promoter Score");
    const count = `${this.num(r.total)} ${r.total === 1 ? l.response : l.responses}`;
    return html`
      ${cardHead({ icon: gaugeMark, title: heading, subtitle: this.description || undefined, id: titleId, aside: html`<span class="ui-ssm__total">${count}</span>` })}
      <div class="ui-ssm__card" role="group" aria-labelledby=${titleId}>
        ${r.value === null
          ? html`<div class="ui-ssm__empty"><span class="ui-ssm__hero"><span class="ui-ssm__name">${name}</span> <span class="ui-ssm__value">–</span></span><p class="ui-ssm__empty-text">${l.empty}</p></div>`
          : html`<div class="ui-ssm__top">
                <div class="ui-ssm__score">
                  <span class="ui-ssm__hero"><span class="ui-ssm__name">${name}</span> <span class="ui-ssm__value">${this.fmt(r.value)}</span></span>
                  <div class="ui-ssm__beside">${this.change(r.value)}${this.spark(r.value)}</div>
                </div>
                ${this.meter(r.value)}
              </div>
              ${this.bands(r.bands)} ${this.distribution(r)}`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="ssm"] */
[data-ui="ssm"] {
  --tc-ssm-detractor: var(--tc-status-danger-solid);
  --tc-ssm-passive: var(--tc-chart-neutral);
  --tc-ssm-promoter: var(--tc-status-success-solid);
  --tc-ssm-csat-1: var(--tc-status-danger-solid);
  --tc-ssm-csat-2: var(--tc-status-warning-solid);
  --tc-ssm-csat-3: var(--tc-chart-neutral);
  --tc-ssm-csat-4: color-mix(in oklab, var(--tc-status-success-solid) 55%, var(--tc-surface-raised));
  --tc-ssm-csat-5: var(--tc-status-success-solid);
  --tc-ssm-dist-h: 88px;
  position: relative;
  box-sizing: border-box;
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
  container: ui-ssm / inline-size;
}
/* Clean: no tray – one white card, the header its first row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ssm"] {
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="ssm"] *, [data-ui="ssm"] *::before, [data-ui="ssm"] *::after { box-sizing: border-box; }
[data-ui="ssm"] svg { display: block; flex: none; }
[data-ui="ssm"] :is(p, ul) { margin: 0; padding: 0; list-style: none; }
:where([data-ui="ssm"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ssm"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ssm__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-ssm__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-ssm__total { flex: none; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- The card ----- */
.ui-ssm__card { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-ssm__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
/* ----- The score, the change and the sparkline; the meter beside them ----- */
.ui-ssm__top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: end; gap: var(--tc-space-3) var(--tc-space-6); }
.ui-ssm__score { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-ssm__hero { display: flex; align-items: baseline; gap: var(--tc-space-2); }
.ui-ssm__name { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-ssm__value { font-size: var(--tc-font-size-4xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-ssm__beside { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); }
.ui-ssm__change { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-ssm__change[data-dir="up"] { color: var(--tc-status-success-fg); }
.ui-ssm__change[data-dir="down"] { color: var(--tc-status-danger-fg); }
.ui-ssm__spark-svg { width: 96px; height: 28px; overflow: visible; }
.ui-ssm__spark-line { fill: none; stroke: var(--tc-chart-1); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-ssm__spark-dot { fill: var(--tc-chart-1); }
.ui-ssm__meter { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-ssm__track { position: relative; display: block; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-ssm__fill { position: absolute; top: 0; bottom: 0; border-radius: var(--tc-meter-radius); background: var(--tc-meter-fill); }
.ui-ssm__fill[data-neg] { background: var(--tc-status-danger-solid); }
.ui-ssm__zero { position: absolute; top: -2px; bottom: -2px; width: 1px; background: var(--tc-border-strong); }
.ui-ssm__target-tick { position: absolute; top: -4px; bottom: -4px; width: 2px; transform: translateX(-50%); border-radius: var(--tc-radius-2xs); background: var(--tc-text-primary); }
.ui-ssm__scale-ends { display: flex; justify-content: space-between; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-ssm__target { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-ssm__target[data-met] { color: var(--tc-status-success-fg); }
/* ----- The bands: one stacked bar, then a key with each band's share and count ----- */
.ui-ssm__bands { display: grid; gap: var(--tc-space-2); }
.ui-ssm__stack { display: flex; gap: var(--tc-space-0-5); height: 10px; overflow: hidden; border-radius: var(--tc-meter-radius); }
.ui-ssm__seg { display: block; min-width: 4px; height: 100%; background: var(--tc-ssm-band); }
.ui-ssm__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); }
.ui-ssm__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-ssm__swatch { width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); background: var(--tc-ssm-band); }
.ui-ssm__key-label { color: var(--tc-text-secondary); }
.ui-ssm__key-pct { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-ssm__key-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-ssm__key-count::before { content: "· "; }
[data-ui="ssm"] [data-band="detractor"] { --tc-ssm-band: var(--tc-ssm-detractor); }
[data-ui="ssm"] [data-band="passive"] { --tc-ssm-band: var(--tc-ssm-passive); }
[data-ui="ssm"] [data-band="promoter"] { --tc-ssm-band: var(--tc-ssm-promoter); }
[data-ui="ssm"] [data-band="1"] { --tc-ssm-band: var(--tc-ssm-csat-1); }
[data-ui="ssm"] [data-band="2"] { --tc-ssm-band: var(--tc-ssm-csat-2); }
[data-ui="ssm"] [data-band="3"] { --tc-ssm-band: var(--tc-ssm-csat-3); }
[data-ui="ssm"] [data-band="4"] { --tc-ssm-band: var(--tc-ssm-csat-4); }
[data-ui="ssm"] [data-band="5"] { --tc-ssm-band: var(--tc-ssm-csat-5); }
/* ----- The distribution: a bar per score ----- */
.ui-ssm__dist-wrap { display: grid; gap: var(--tc-space-2); padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ssm__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-ssm__dist { display: grid; grid-template-columns: repeat(11, minmax(0, 1fr)); gap: var(--tc-space-1); }
.ui-ssm__dist[data-kind="csat"] { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--tc-space-3); }
.ui-ssm__bar { display: grid; grid-template-rows: auto var(--tc-ssm-dist-h) auto; justify-items: center; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-1) 0; border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="ssm"] .ui-ssm__bar:hover { background: var(--tc-fill-subtle); }
[data-ui="ssm"] .ui-ssm__bar[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); }
.ui-ssm__bar-count { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-ssm__bar-track { display: flex; align-items: flex-end; width: min(100%, 28px); height: 100%; }
.ui-ssm__bar-fill { display: block; width: 100%; border-radius: var(--tc-radius-2xs) var(--tc-radius-2xs) 0 0; background: var(--tc-ssm-band); }
.ui-ssm__bar-score { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-ssm__bar[aria-pressed="true"] .ui-ssm__bar-score { color: var(--tc-accent-text); }
.ui-ssm__bar[aria-pressed="true"] .ui-ssm__bar-count { color: var(--tc-text-secondary); }
.ui-ssm__picked { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
/* ----- Empty ----- */
.ui-ssm__empty { display: grid; gap: var(--tc-space-1); }
.ui-ssm__empty .ui-ssm__value { color: var(--tc-text-muted); }
.ui-ssm__empty-text { color: var(--tc-text-muted); }
/* Narrow: the meter goes under the score; the counts over the bars go */
@container ui-ssm (max-width: 480px) {
  .ui-ssm__top { grid-template-columns: minmax(0, 1fr); }
  .ui-ssm__total { display: none; }
  .ui-ssm__dist { gap: var(--tc-space-0-5); }
  .ui-ssm__bar-count { visibility: hidden; }
  .ui-ssm__value { font-size: var(--tc-font-size-3xl); }
}
@media (forced-colors: active) {
  .ui-ssm__bar[aria-pressed="true"] { outline: 2px solid Highlight; }
  .ui-ssm__seg, .ui-ssm__swatch, .ui-ssm__bar-fill, .ui-ssm__fill { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ssm"] *, [data-ui="ssm"] *::before, [data-ui="ssm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-score-summary")) customElements.define("tc-score-summary", TcScoreSummary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-score-summary": TcScoreSummary;
  }
}
