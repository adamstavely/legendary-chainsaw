import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-change-impact> – did this change make the agent better or worse? Before against after for one change (a prompt,
 * a model, a tool), from the counts the page supplies: a row per judge criterion with the two means as a dumbbell, the
 * difference, and a verdict in words – "Better, likely", "No clear change", "Worse, likely" – then cost and latency,
 * the sample sizes, and one line that sums it up.
 *   · a verdict is "likely" when the difference is at least `z` standard errors (1.96 – about 95%); a criterion's
 *     standard error comes from its own spread, its pass counts, or the element's `spread`
 *   · the segment switch reads the same change for one slice of the traffic (a topic, a language)
 *   · each row's before and after buttons fire tc-examples-open, for the page to show example chats
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-change-impact .change=${{ label: "Prompt v13 → v14", before: "v13", after: "v14" }} .criteria=${[…]}></tc-change-impact>
 *
 * `segment` changes on its own; preventDefault() on tc-segment-change keeps control.
 */

/** A criterion on one side: a judge score (its mean, the chats scored and, if known, the spread) or pass counts */
export type ImpactValue = { mean: number; n: number; sd?: number } | { passes: number; n: number };

export type ImpactCriterion = {
  id: string;
  label: string;
  before: ImpactValue;
  after: ImpactValue;
  /** False when a lower number is the better one – a refusal rate */
  higherIsBetter?: boolean;
};

/** Before and after for cost (per chat) or latency (median ms) – lower is better */
export type ImpactMetric = { before: number; after: number };

export type ImpactChange = {
  /** What changed – "Prompt v13 → v14" */
  label: string;
  /** The side before – "v13" */
  before: string;
  /** The side after – "v14" */
  after: string;
  kind?: "prompt" | "model" | "tool" | "other";
};

export type ImpactSegment = {
  id: string;
  /** The slice – "Refunds", "Spanish" */
  label: string;
  criteria: ImpactCriterion[];
  cost?: ImpactMetric;
  latency?: ImpactMetric;
};

export type ImpactVerdict = "better" | "worse" | "same";
export type ImpactResult = { before: number; after: number; delta: number; z: number; verdict: ImpactVerdict; nBefore: number; nAfter: number; rate: boolean };
export type ChangeImpactSegmentChange = { segment: string | null };
export type ChangeImpactExamplesOpen = { criterion: string; side: "before" | "after" };

const isRate = (v: ImpactValue): v is { passes: number; n: number } => "passes" in v;
const meanOf = (v: ImpactValue) => (isRate(v) ? (v.n ? v.passes / v.n : 0) : v.mean);
/** The standard error of one side */
const seOf = (v: ImpactValue, spread: number) => {
  if (!(v.n > 0)) return Infinity;
  if (isRate(v)) {
    const p = v.n ? v.passes / v.n : 0;
    return Math.sqrt(Math.max(p * (1 - p), 0.25 / v.n) / v.n);
  }
  return (v.sd ?? spread) / Math.sqrt(v.n);
};

/** One criterion's before, after, difference, how many standard errors that is, and the verdict */
export function changeImpact(c: ImpactCriterion, spread = 1, z = 1.96): ImpactResult {
  const before = meanOf(c.before);
  const after = meanOf(c.after);
  const delta = after - before;
  const se = Math.sqrt(seOf(c.before, spread) ** 2 + seOf(c.after, spread) ** 2);
  const score = Number.isFinite(se) && se > 0 ? delta / se : 0;
  const good = c.higherIsBetter === false ? -score : score;
  const verdict: ImpactVerdict = good >= z ? "better" : good <= -z ? "worse" : "same";
  return { before, after, delta, z: score, verdict, nBefore: c.before.n, nAfter: c.after.n, rate: isRate(c.before) };
}

const VERDICT: Record<ImpactVerdict, string> = { better: "Better, likely", worse: "Worse, likely", same: "No clear change" };

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult) => html`<svg class="ui-chi__glyph" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** git-compare-arrows */
const mark = svg`<circle cx="5" cy="6" r="3"></circle><path d="M12 6h5a2 2 0 0 1 2 2v7"></path><path d="m15 9-3-3 3-3"></path><circle cx="19" cy="18" r="3"></circle><path d="M12 18H7a2 2 0 0 1-2-2V9"></path><path d="m9 15 3 3-3 3"></path>`;
const VERDICT_ICON: Record<ImpactVerdict, TemplateResult> = {
  better: glyph(svg`<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>`),
  worse: glyph(svg`<path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path>`),
  same: glyph(svg`<path d="M5 12h14"></path>`),
};

let instances = 0;

/**
 * Before against after for one change – per-criterion differences with a verdict in words, a dumbbell row each, cost and
 * latency, sample sizes, a summary line, and a segment switch.
 * @tag tc-change-impact
 * @fires tc-segment-change - A segment was picked, or all traffic ({ segment }: ChangeImpactSegmentChange); cancelable – prevented, `segment` stays as it was
 * @fires tc-examples-open - A row's before or after examples were asked for ({ criterion, side }: ChangeImpactExamplesOpen)
 */
export class TcChangeImpact extends TcElement {
  static override ui = "chi";

  /** The heading */
  @property() accessor heading = "Change impact";
  /** The change being judged, and the names of its two sides */
  @property({ attribute: false }) accessor change: ImpactChange | null = null;
  /** One entry per judge criterion, over all traffic */
  @property({ attribute: false }) accessor criteria: ImpactCriterion[] = [];
  /** Cost per chat before and after, over all traffic */
  @property({ attribute: false }) accessor cost: ImpactMetric | null = null;
  /** Median latency in ms before and after, over all traffic */
  @property({ attribute: false }) accessor latency: ImpactMetric | null = null;
  /** Slices of the traffic, each with its own criteria (and cost and latency, if known) */
  @property({ attribute: false }) accessor segments: ImpactSegment[] = [];
  /** The segment shown; null for all traffic */
  @property({ attribute: false }) accessor segment: string | null = null;
  /** The lowest judge score – the dumbbells' left edge for scores (pass rates run 0–100%) */
  @property({ type: Number }) accessor min = 1;
  /** The highest judge score */
  @property({ type: Number }) accessor max = 5;
  /** A score's spread (standard deviation) when a criterion gives none */
  @property({ type: Number }) accessor spread = 1;
  /** How many standard errors make a difference "likely" */
  @property({ type: Number }) accessor z = 1.96;
  /** The currency of `cost` */
  @property() accessor currency = "USD";
  /** Formats numbers */
  @property() accessor locale = "en-US";

  /** @internal */
  @state() accessor spoken = "";

  private readonly uid = `tc-chi${++instances}`;
  private rows: { c: ImpactCriterion; r: ImpactResult }[] = [];
  private metrics: { cost: ImpactMetric | null; latency: ImpactMetric | null } = { cost: null, latency: null };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const seg = this.segment ? this.segments.find((s) => s.id === this.segment) : undefined;
    const criteria = seg ? seg.criteria : this.criteria;
    this.rows = criteria.map((c) => ({ c, r: changeImpact(c, this.spread, this.z) }));
    this.metrics = seg ? { cost: seg.cost ?? null, latency: seg.latency ?? null } : { cost: this.cost, latency: this.latency };
  }

  /** @internal */
  private value(n: number, rate: boolean) {
    return rate ? `${(n * 100).toLocaleString(this.locale, { maximumFractionDigits: 1 })}%` : n.toLocaleString(this.locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  }

  /** @internal The difference with its sign, in points for rates */
  private diff(r: ImpactResult) {
    const d = r.rate ? r.delta * 100 : r.delta;
    const abs = Math.abs(d).toLocaleString(this.locale, { maximumFractionDigits: r.rate ? 1 : 2, minimumFractionDigits: r.rate ? 0 : 1 });
    return `${d > 0 ? "+" : d < 0 ? "−" : "±"}${abs}${r.rate ? " pts" : ""}`;
  }

  /** @internal The overall verdict and the line that sums it up */
  private overall() {
    const by = (v: ImpactVerdict) => this.rows.filter((x) => x.r.verdict === v).map((x) => x.c.label);
    const better = by("better");
    const worse = by("worse");
    const same = by("same");
    const verdict = better.length && worse.length ? "mixed" : worse.length ? "worse" : better.length ? "better" : "same";
    const list = (xs: string[]) => (xs.length <= 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
    const parts = [
      better.length ? `better on ${list(better)}` : "",
      worse.length ? `worse on ${list(worse)}` : "",
      same.length ? `no clear change on ${list(same)}` : "",
    ].filter(Boolean);
    const cost = this.metrics.cost;
    const pct = cost && cost.before ? Math.round(((cost.after - cost.before) / cost.before) * 100) : null;
    const costText = pct === null ? "" : pct === 0 ? "cost unchanged" : `cost ${pct > 0 ? "up" : "down"} ${Math.abs(pct)}%`;
    const line = [...parts, costText].filter(Boolean).join(", ");
    return { verdict: verdict as ImpactVerdict | "mixed", line: line ? line[0].toUpperCase() + line.slice(1) + "." : "No criteria yet." };
  }

  /** @internal */
  private setSegment(segment: string | null) {
    if (segment === this.segment) return;
    if (this.emit<ChangeImpactSegmentChange>("tc-segment-change", { segment }, { cancelable: true })) this.segment = segment;
    void this.updateComplete.then(() => {
      const label = this.segment ? this.segments.find((s) => s.id === this.segment)?.label : "All traffic";
      this.spoken = `${label}: ${this.overall().line}`;
    });
  }

  /** @internal One criterion: its name and samples, the dumbbell, the numbers, the verdict, and the example buttons */
  private row({ c, r }: { c: ImpactCriterion; r: ImpactResult }) {
    const lo = r.rate ? 0 : this.min;
    const hi = r.rate ? 1 : this.max > this.min ? this.max : this.min + 1;
    const pos = (v: number) => `${Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * 100}%`;
    const a = pos(r.before);
    const b = pos(r.after);
    const left = r.before <= r.after ? a : b;
    const right = r.before <= r.after ? b : a;
    const change = this.change;
    return html`<li class="ui-chi__row" data-verdict=${r.verdict}>
      <div class="ui-chi__name">
        <span class="ui-chi__label">${c.label}</span>
        <span class="ui-chi__n">${r.nBefore.toLocaleString(this.locale)} → ${r.nAfter.toLocaleString(this.locale)} chats</span>
      </div>
      <div class="ui-chi__bell" aria-hidden="true">
        <span class="ui-chi__track"></span>
        <span class="ui-chi__span" style=${styleMap({ left, width: `calc(${right} - ${left})` })}></span>
        <span class="ui-chi__dot" data-side="before" style=${styleMap({ left: a })}></span>
        <span class="ui-chi__dot" data-side="after" style=${styleMap({ left: b })}></span>
      </div>
      <p class="ui-chi__nums">
        <span>${this.value(r.before, r.rate)}</span><span class="ui-chi__arrow" aria-hidden="true">→</span><span class="ui-chi__sr"> to </span><span class="ui-chi__after">${this.value(r.after, r.rate)}</span>
        <span class="ui-chi__delta">${this.diff(r)}</span>
      </p>
      <p class="ui-chi__verdict" data-verdict=${r.verdict}>${VERDICT_ICON[r.verdict]}${VERDICT[r.verdict]}</p>
      <div class="ui-chi__examples">
        <button type="button" class="ui-chi__ex" @click=${() => this.emit<ChangeImpactExamplesOpen>("tc-examples-open", { criterion: c.id, side: "before" })}>
          ${change?.before ?? "Before"}<span class="ui-chi__sr"> examples, ${c.label}</span>
        </button>
        <button type="button" class="ui-chi__ex" @click=${() => this.emit<ChangeImpactExamplesOpen>("tc-examples-open", { criterion: c.id, side: "after" })}>
          ${change?.after ?? "After"}<span class="ui-chi__sr"> examples, ${c.label}</span>
        </button>
      </div>
    </li>`;
  }

  /** @internal Cost and latency: before → after and the change, lower is better */
  private metricRow(label: string, m: ImpactMetric, format: (n: number) => string) {
    const pct = m.before ? ((m.after - m.before) / m.before) * 100 : 0;
    const tone = Math.abs(pct) < 1 ? "same" : pct < 0 ? "better" : "worse";
    const sign = pct > 0 ? "+" : pct < 0 ? "−" : "±";
    return html`<div class="ui-chi__metric" data-verdict=${tone}>
      <dt class="ui-chi__metric-label">${label}</dt>
      <dd class="ui-chi__metric-value">
        ${format(m.before)}<span class="ui-chi__arrow" aria-hidden="true"> → </span><span class="ui-chi__sr"> to </span>${format(m.after)}
        <span class="ui-chi__delta" data-verdict=${tone}>${sign}${Math.abs(Math.round(pct))}%<span class="ui-chi__sr">, ${tone === "better" ? "lower" : tone === "worse" ? "higher" : "about the same"}</span></span>
      </dd>
    </div>`;
  }

  protected override render() {
    const titleId = `${this.uid}-title`;
    const { verdict, line } = this.overall();
    const change = this.change;
    const nBefore = Math.max(0, ...this.rows.map((x) => x.r.nBefore));
    const nAfter = Math.max(0, ...this.rows.map((x) => x.r.nAfter));
    const money = new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, maximumSignificantDigits: 3 });
    const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString(this.locale, { maximumFractionDigits: 1 })} s` : `${Math.round(n).toLocaleString(this.locale)} ms`);
    const word = verdict === "mixed" ? "Mixed" : verdict === "better" ? "Better" : verdict === "worse" ? "Worse" : "No clear change";
    const selectId = `${this.uid}-segment`;
    return html`
      ${cardHead({
        icon: mark,
        title: this.heading,
        id: titleId,
        subtitle: change ? change.label : nothing,
        aside: this.rows.length ? html`<span class="ui-chi__overall" data-verdict=${verdict}>${word}</span>` : nothing,
      })}
      <div class="ui-chi__card">
        <div class="ui-chi__top">
          <p class="ui-chi__line">${line}</p>
          ${this.rows.length ? html`<p class="ui-chi__samples">${nBefore.toLocaleString(this.locale)} chats on ${change?.before ?? "before"} · ${nAfter.toLocaleString(this.locale)} on ${change?.after ?? "after"}</p>` : nothing}
          ${this.segments.length
            ? html`<div class="ui-chi__seg">
                <label class="ui-chi__seg-label" for=${selectId}>Segment</label>
                <select class="ui-chi__select" id=${selectId} .value=${this.segment ?? ""} @change=${(e: Event) => {
                  const v = (e.target as HTMLSelectElement).value;
                  this.setSegment(v || null);
                  (e.target as HTMLSelectElement).value = this.segment ?? "";
                }}>
                  <option value="" ?selected=${!this.segment}>All traffic</option>
                  ${this.segments.map((s) => html`<option value=${s.id} ?selected=${s.id === this.segment}>${s.label}</option>`)}
                </select>
              </div>`
            : nothing}
        </div>
        ${this.rows.length
          ? html`<div class="ui-chi__key" aria-hidden="true">
                <span><span class="ui-chi__dot" data-side="before"></span>${change?.before ?? "Before"}</span>
                <span><span class="ui-chi__dot" data-side="after"></span>${change?.after ?? "After"}</span>
              </div>
              <ul class="ui-chi__rows" aria-label="Criteria">${this.rows.map((x) => this.row(x))}</ul>`
          : html`<p class="ui-chi__empty">No criteria yet</p>`}
        ${this.metrics.cost || this.metrics.latency
          ? html`<dl class="ui-chi__metrics">
              ${this.metrics.cost ? this.metricRow("Cost per chat", this.metrics.cost, (n) => money.format(n)) : nothing}
              ${this.metrics.latency ? this.metricRow("Median latency", this.metrics.latency, ms) : nothing}
            </dl>`
          : nothing}
      </div>
      <span class="ui-chi__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="chi"] {
  --tc-change-impact-dot: 10px;
  --tc-change-impact-better: var(--tc-status-success-solid);
  --tc-change-impact-worse: var(--tc-status-danger-solid);
  --tc-change-impact-same: var(--tc-text-muted);
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
  container: ui-chi / inline-size;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="chi"] {
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="chi"] *, [data-ui="chi"] *::before, [data-ui="chi"] *::after { box-sizing: border-box; }
[data-ui="chi"] :is(p, ul, dl, dd) { margin: 0; }
[data-ui="chi"] ul { padding: 0; list-style: none; }
:where([data-ui="chi"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="chi"] :is(button, select):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-chi__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-chi__glyph { display: block; flex: none; width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2.25; stroke-linecap: round; stroke-linejoin: round; }
.ui-chi__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-chi__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-chi__overall { height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); white-space: nowrap; }
.ui-chi__overall[data-verdict="better"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-chi__overall[data-verdict="worse"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-chi__overall[data-verdict="mixed"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-chi__overall[data-verdict="same"] { background: var(--tc-fill-subtle); color: var(--tc-text-secondary); }
/* ----- The summary, the samples and the segment switch ----- */
.ui-chi__top { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-chi__line { grid-column: 1; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-chi__samples { grid-column: 1; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-chi__seg { grid-column: 2; grid-row: 1 / span 2; display: flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-chi__seg-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-chi__select { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font: inherit; font-size: var(--tc-control-font-size); color: var(--tc-text-primary); }
/* ----- The rows ----- */
.ui-chi__key { display: flex; justify-content: flex-end; gap: var(--tc-space-3); padding: var(--tc-space-2) var(--tc-space-3-5) 0; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-chi__key > span { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-chi__key .ui-chi__dot { position: static; translate: none; }
.ui-chi__rows { display: grid; }
.ui-chi__row { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.4fr) minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-chi__name { display: grid; min-width: 0; }
.ui-chi__label { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-chi__n { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-chi__bell { position: relative; height: var(--tc-control-h-sm); min-width: 80px; }
.ui-chi__track { position: absolute; top: 50%; right: 0; left: 0; height: var(--tc-hairline); background: var(--tc-border-subtle); }
.ui-chi__span { position: absolute; top: calc(50% - 1.5px); height: 3px; border-radius: var(--tc-radius-xs); background: var(--tc-change-impact-same); }
.ui-chi__row[data-verdict="better"] .ui-chi__span { background: var(--tc-change-impact-better); }
.ui-chi__row[data-verdict="worse"] .ui-chi__span { background: var(--tc-change-impact-worse); }
.ui-chi__dot { position: absolute; top: 50%; display: inline-block; width: var(--tc-change-impact-dot); height: var(--tc-change-impact-dot); border-radius: 50%; translate: -50% -50%; }
.ui-chi__dot[data-side="before"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--tc-text-muted); }
.ui-chi__dot[data-side="after"] { background: var(--tc-text-primary); }
.ui-chi__row[data-verdict="better"] .ui-chi__dot[data-side="after"] { background: var(--tc-change-impact-better); }
.ui-chi__row[data-verdict="worse"] .ui-chi__dot[data-side="after"] { background: var(--tc-change-impact-worse); }
.ui-chi__nums { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-chi__after { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-chi__arrow { color: var(--tc-text-muted); }
.ui-chi__delta { margin-left: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-chi__verdict { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-chi__verdict[data-verdict="better"] { color: var(--tc-status-success-fg); }
.ui-chi__verdict[data-verdict="worse"] { color: var(--tc-status-danger-fg); }
.ui-chi__verdict[data-verdict="same"] { color: var(--tc-text-muted); }
.ui-chi__examples { display: flex; gap: var(--tc-space-1); }
.ui-chi__ex { display: inline-flex; align-items: center; min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-accent-text); white-space: nowrap; }
[data-ui="chi"] .ui-chi__ex:hover { background: var(--tc-action-ghost-bg-hover); }
.ui-chi__empty { padding: var(--tc-space-5) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- Cost and latency ----- */
.ui-chi__metrics { display: flex; flex-wrap: wrap; gap: var(--tc-space-2) var(--tc-space-6); padding: var(--tc-space-3) var(--tc-space-3-5); }
.ui-chi__metric { display: grid; gap: var(--tc-space-0-5); }
.ui-chi__metric-label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-chi__metric-value { color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-chi__metric-value .ui-chi__delta[data-verdict="better"] { color: var(--tc-status-success-fg); }
.ui-chi__metric-value .ui-chi__delta[data-verdict="worse"] { color: var(--tc-status-danger-fg); }
/* Narrow: each row stacks – name and verdict, then the dumbbell, then the numbers and examples */
@container ui-chi (max-width: 620px) {
  .ui-chi__top { grid-template-columns: minmax(0, 1fr); }
  .ui-chi__seg { grid-column: 1; grid-row: auto; }
  .ui-chi__row { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-chi__bell { grid-column: 1 / -1; grid-row: 2; }
  .ui-chi__nums { grid-column: 1; grid-row: 3; }
  .ui-chi__examples { grid-column: 2; grid-row: 3; }
  .ui-chi__verdict { grid-column: 2; grid-row: 1; }
}
@media (forced-colors: active) {
  .ui-chi__span, .ui-chi__dot[data-side="after"] { background: CanvasText !important; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="chi"] *, [data-ui="chi"] *::before, [data-ui="chi"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-change-impact")) customElements.define("tc-change-impact", TcChangeImpact);

declare global {
  interface HTMLElementTagNameMap {
    "tc-change-impact": TcChangeImpact;
  }
}
