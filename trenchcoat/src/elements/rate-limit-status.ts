import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { compact } from "./internal/format";
import { pick } from "./internal/util";

/*
 * <tc-rate-limit-status> – how close each model is to its provider's rate limits. One row per provider and model:
 * requests, input tokens and output tokens a minute, each a meter against its limit; the headroom in words – Plenty,
 * Near limit, or Limited with a countdown to when the window resets; how many requests were turned away (429s) in the
 * last hour; the tier; and a sparkline of the last hour's peak use. The tightest rows come first.
 *   · the headroom is the fullest of the three meters: under 70% is Plenty, under 100% Near limit, at or over it Limited
 *   · the countdown comes from `now`, or the element's own clock, which ticks once a second while a row is limited
 *   · the sort is a native select; changing it fires a cancelable tc-sort-change ({ sort })
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-rate-limit-status .rows=${[{ id: "l1", provider: "Model provider", model: "large-1", tier: "Tier 3",
 *     requests: { used: 4200, limit: 5000 }, inputTokens: { used: 610000, limit: 800000 } }]}></tc-rate-limit-status>
 */

export type RateLimitMetric = "requests" | "inputTokens" | "outputTokens";
export type RateLimitUsage = {
  /** Used in the current minute */
  used: number;
  /** The limit a minute */
  limit: number;
};
export type RateLimitRow = {
  id: string;
  /** Who serves the model, e.g. "Model provider" */
  provider: string;
  /** The model, e.g. "large-1" */
  model: string;
  /** The account's tier with that provider, e.g. "Tier 3" */
  tier?: string;
  requests?: RateLimitUsage;
  inputTokens?: RateLimitUsage;
  outputTokens?: RateLimitUsage;
  /** When the limited window resets, epoch ms */
  resetAt?: number;
  /** Requests turned away with a 429 in the last hour */
  throttled?: number;
  /** The last hour's peak use, one value a minute (or any even step), as a share of the tightest limit – 0 to 1 or more */
  history?: number[];
};
export type RateLimitHeadroom = "plenty" | "near" | "limited";
export type RateLimitSort = "tightest" | "name";

/** Details of the events */
export type RateLimitSortChange = { sort: RateLimitSort };

/** The words the element uses; the page can rename any of them */
export type RateLimitStatusLabels = {
  metrics: Record<RateLimitMetric, string>;
  /** The meters' units, read out by screen readers */
  units: Record<RateLimitMetric, string>;
  headroom: Record<RateLimitHeadroom, string>;
  resetsIn: string;
  sort: string;
  sorts: Record<RateLimitSort, string>;
  throttled: string;
  throttledOne: string;
  noThrottled: string;
  peak: string;
  limitedCount: string;
  empty: string;
};
/** Labels the page passes: any of them, and any of the nested ones */
export type RateLimitStatusLabelsInput = Partial<Omit<RateLimitStatusLabels, "metrics" | "units" | "headroom" | "sorts">> & {
  metrics?: Partial<Record<RateLimitMetric, string>>;
  units?: Partial<Record<RateLimitMetric, string>>;
  headroom?: Partial<Record<RateLimitHeadroom, string>>;
  sorts?: Partial<Record<RateLimitSort, string>>;
};
export const defaultRateLimitStatusLabels: RateLimitStatusLabels = {
  metrics: { requests: "Requests / min", inputTokens: "Input tokens / min", outputTokens: "Output tokens / min" },
  units: { requests: "requests a minute", inputTokens: "input tokens a minute", outputTokens: "output tokens a minute" },
  headroom: { plenty: "Plenty", near: "Near limit", limited: "Limited" },
  resetsIn: "resets in",
  sort: "Sort",
  sorts: { tightest: "Tightest first", name: "By name" },
  throttled: "{n} rate-limited requests in the last hour",
  throttledOne: "1 rate-limited request in the last hour",
  noThrottled: "No rate-limited requests in the last hour",
  peak: "Peak in the last hour: {p} of the limit",
  limitedCount: "{n} limited",
  empty: "No providers connected yet",
};

const METRICS: RateLimitMetric[] = ["requests", "inputTokens", "outputTokens"];
const TONE: Record<RateLimitHeadroom, "success" | "warning" | "danger"> = { plenty: "success", near: "warning", limited: "danger" };

/** The fullest of a row's meters, as a share of its limit (0 when it has none) */
export function rateLimitShare(row: RateLimitRow) {
  let share = 0;
  for (const m of METRICS) {
    const u = row[m];
    if (u && u.limit > 0) share = Math.max(share, u.used / u.limit);
  }
  return share;
}
/** Plenty under 70% of the limit, Near limit under 100%, Limited at or over it */
export function rateLimitHeadroom(row: RateLimitRow): RateLimitHeadroom {
  const share = rateLimitShare(row);
  return share >= 1 ? "limited" : share >= 0.7 ? "near" : "plenty";
}
/** "18 s", "2 min 5 s" – the time until a reset */
export function rateLimitCountdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m} min ${s % 60} s` : `${m} min`;
}

/* Gauge and the headroom marks: Lucide (ISC, lucide.dev) */
const gauge = svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK: Record<RateLimitHeadroom, () => ReturnType<typeof lucide>> = {
  plenty: () => lucide(12, svg`<path d="M20 6 9 17l-5-5"></path>`),
  near: () => lucide(12, svg`<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path>`),
  limited: () => lucide(12, svg`<circle cx="12" cy="12" r="10"></circle><path d="m4.9 4.9 14.2 14.2"></path>`),
};

const SPARK_W = 96;
const SPARK_H = 24;

let uidCount = 0;

/**
 * Usage against each provider's rate limits – requests, input and output tokens a minute as meters, the headroom in
 * words with a countdown when limited, 429s in the last hour, the tier and a sparkline, tightest first.
 * @tag tc-rate-limit-status
 * @fires tc-sort-change - The sort was changed ({ sort }: RateLimitSortChange); cancelable – prevented, `sort` stays as it was
 */
export class TcRateLimitStatus extends TcElement {
  static override ui = "rlst";

  /** The heading */
  @property() accessor heading = "Rate limits";
  /** A line under the heading, e.g. the window the numbers cover */
  @property() accessor description = "";
  /** One row per provider and model */
  @property({ attribute: false }) accessor rows: RateLimitRow[] = [];
  /** The order: the tightest headroom first, or by provider and model. Changed by the user unless a tc-sort-change listener calls preventDefault() */
  @property() accessor sort: RateLimitSort = "tightest";
  /** Hides the sort select */
  @property({ type: Boolean, attribute: "hide-sort" }) accessor hideSort = false;
  /** The time now, epoch ms, for the reset countdown; leave it unset and the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The element's words, merged over defaultRateLimitStatusLabels */
  @property({ attribute: false }) accessor labels: RateLimitStatusLabelsInput = {};

  @state() private accessor clock = 0;

  private uid = `tc-rlst-${++uidCount}`;
  private tickTimer: number | undefined;

  private get words(): RateLimitStatusLabels {
    const l = this.labels;
    const d = defaultRateLimitStatusLabels;
    return {
      ...d,
      ...l,
      metrics: { ...d.metrics, ...l.metrics },
      units: { ...d.units, ...l.units },
      headroom: { ...d.headroom, ...l.headroom },
      sorts: { ...d.sorts, ...l.sorts },
    };
  }

  /** The rows in their order: tightest share first, or provider then model */
  get ordered() {
    const rows = [...this.rows];
    if (this.sort === "name") return rows.sort((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model));
    return rows.sort((a, b) => rateLimitShare(b) - rateLimitShare(a));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.syncClock();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.tickTimer);
    this.tickTimer = undefined;
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("now") || changed.has("rows")) this.syncClock();
  }
  /** The own clock ticks once a second, only while `now` isn't given and a row is limited with a reset time */
  private syncClock() {
    const want = this.isConnected && this.now === undefined && this.rows.some((r) => r.resetAt != null && rateLimitHeadroom(r) === "limited");
    if (want && this.tickTimer === undefined) {
      this.clock = Date.now();
      this.tickTimer = window.setInterval(() => (this.clock = this.clock + 1000), 1000);
    } else if (!want && this.tickTimer !== undefined) {
      clearInterval(this.tickTimer);
      this.tickTimer = undefined;
    }
  }

  private setSort(next: RateLimitSort) {
    if (next === this.sort) return;
    if (!this.emit<RateLimitSortChange>("tc-sort-change", { sort: next }, { cancelable: true })) {
      // Prevented: put the select back
      this.requestUpdate();
      const select = this.querySelector<HTMLSelectElement>(".ui-rlst__sort select");
      if (select) select.value = this.sort;
      return;
    }
    this.sort = next;
  }

  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  private fill(s: string, values: Record<string, string>) {
    return s.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");
  }
  /** A row's headroom in words: "Limited – resets in 18 s", "Near limit", "Plenty" */
  headroomText(row: RateLimitRow) {
    const w = this.words;
    const level = rateLimitHeadroom(row);
    const word = w.headroom[level];
    if (level !== "limited" || row.resetAt == null) return word;
    const now = this.now ?? this.clock;
    if (!now) return word;
    return `${word} – ${w.resetsIn} ${rateLimitCountdown(row.resetAt - now)}`;
  }

  private renderMeter(row: RateLimitRow, m: RateLimitMetric) {
    const u = row[m];
    if (!u) return nothing;
    const w = this.words;
    const share = u.limit > 0 ? u.used / u.limit : 0;
    const pct = Math.round(share * 100);
    const level: RateLimitHeadroom = share >= 1 ? "limited" : share >= 0.7 ? "near" : "plenty";
    const id = `${this.uid}-${row.id}-${m}`;
    return html`<div class="ui-rlst__metric" data-tone=${TONE[level]}>
      <span class="ui-rlst__metric-label" id=${id}>${w.metrics[m]}</span>
      <span class="ui-rlst__metric-value" aria-hidden="true">${compact(u.used)} / ${compact(u.limit)}</span>
      <!-- role="meter" goes through the ARIA-reflecting role property: lit-analyzer's role list predates ARIA 1.2's meter -->
      <div
        class="ui-rlst__meter"
        .role=${"meter"}
        aria-labelledby=${id}
        aria-valuemin="0"
        aria-valuemax=${u.limit}
        aria-valuenow=${Math.min(u.used, u.limit)}
        aria-valuetext=${`${this.num(u.used)} of ${this.num(u.limit)} ${w.units[m]}, ${pct}%`}
      >
        <span class="ui-rlst__meter-fill" style=${`inline-size: ${Math.min(100, pct)}%`}></span>
      </div>
    </div>`;
  }

  private renderSpark(row: RateLimitRow) {
    const points = row.history ?? [];
    if (points.length < 2) return nothing;
    const max = Math.max(1, ...points);
    const step = SPARK_W / (points.length - 1);
    const y = (v: number) => SPARK_H - 1 - (Math.max(0, v) / max) * (SPARK_H - 2);
    const d = points.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const limitY = y(1);
    const peak = Math.round(Math.max(...points) * 100);
    return html`<span class="ui-rlst__spark">
      <svg viewBox=${`0 0 ${SPARK_W} ${SPARK_H}`} width=${SPARK_W} height=${SPARK_H} aria-hidden="true" preserveAspectRatio="none">
        ${svg`<line class="ui-rlst__spark-limit" x1="0" x2=${SPARK_W} y1=${limitY} y2=${limitY}></line><path class="ui-rlst__spark-line" d=${d}></path>`}
      </svg>
      <span class="ui-rlst__spark-text">${this.fill(this.words.peak, { p: `${peak}%` })}</span>
    </span>`;
  }

  private renderRow(row: RateLimitRow) {
    const w = this.words;
    const level = rateLimitHeadroom(row);
    const n = row.throttled ?? 0;
    const throttled = n === 0 ? w.noThrottled : n === 1 ? w.throttledOne : this.fill(w.throttled, { n: this.num(n) });
    return html`<li class="ui-rlst__row" data-headroom=${level}>
      <div class="ui-rlst__row-head">
        <span class="ui-rlst__name">
          <span class="ui-rlst__model">${row.model}</span>
          <span class="ui-rlst__provider">${row.provider}</span>
        </span>
        ${row.tier ? html`<span class="ui-rlst__tier">${row.tier}</span>` : nothing}
        <span class="ui-rlst__headroom" data-tone=${pick(TONE, level, "plenty")}>${pick(MARK, level, "plenty")()}<span>${this.headroomText(row)}</span></span>
      </div>
      <div class="ui-rlst__metrics">${METRICS.map((m) => this.renderMeter(row, m))}</div>
      <div class="ui-rlst__row-foot">
        <span class="ui-rlst__throttled" data-some=${n > 0 ? "true" : "false"}>${throttled}</span>
        ${this.renderSpark(row)}
      </div>
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const id = this.uid;
    const rows = this.ordered;
    const limited = rows.filter((r) => rateLimitHeadroom(r) === "limited").length;
    const sortSelect = this.hideSort
      ? nothing
      : html`<label class="ui-rlst__sort">
          <span>${w.sort}</span>
          <select .value=${this.sort} @change=${(e: Event) => this.setSort((e.target as HTMLSelectElement).value as RateLimitSort)}>
            ${(["tightest", "name"] as const).map((s) => html`<option value=${s} ?selected=${s === this.sort}>${w.sorts[s]}</option>`)}
          </select>
        </label>`;
    return html`
      ${cardHead({
        icon: gauge,
        title: this.heading,
        subtitle: this.description || undefined,
        id: `${id}-title`,
        aside: limited ? html`<span class="ui-rlst__count" data-tone="danger">${this.fill(w.limitedCount, { n: String(limited) })}</span>` : nothing,
      })}
      <div class="ui-rlst__card">
        ${rows.length && !this.hideSort ? html`<div class="ui-rlst__bar">${sortSelect}</div>` : nothing}
        ${rows.length
          ? html`<ul class="ui-rlst__rows" aria-labelledby=${`${id}-title`}>${repeat(rows, (r) => r.id, (r) => this.renderRow(r))}</ul>`
          : html`<p class="ui-rlst__empty">${w.empty}</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rlst"] {
  position: relative;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rlst"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
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
[data-ui="rlst"] *, [data-ui="rlst"] *::before, [data-ui="rlst"] *::after { box-sizing: border-box; }
[data-ui="rlst"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="rlst"] p { margin: 0; }
[data-ui="rlst"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rlst"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlst__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-rlst__card { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
/* Tones */
[data-ui="rlst"] [data-tone="success"] { --tc-rlst-tone: var(--tc-status-success-fg); --tc-rlst-tone-bg: var(--tc-status-success-bg); }
[data-ui="rlst"] [data-tone="warning"] { --tc-rlst-tone: var(--tc-status-warning-fg); --tc-rlst-tone-bg: var(--tc-status-warning-bg); }
[data-ui="rlst"] [data-tone="danger"] { --tc-rlst-tone: var(--tc-status-danger-fg); --tc-rlst-tone-bg: var(--tc-status-danger-bg); }
.ui-rlst__count { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; background: var(--tc-rlst-tone-bg); color: var(--tc-rlst-tone); }
/* ----- Sort ----- */
.ui-rlst__bar { display: flex; justify-content: flex-end; }
.ui-rlst__sort { display: inline-flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-rlst__sort select { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; cursor: pointer; }
.ui-rlst__sort select:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-rlst__sort select:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ----- Rows ----- */
.ui-rlst__rows { display: grid; gap: var(--tc-space-3); }
.ui-rlst__row { display: grid; gap: var(--tc-space-2-5); padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rlst__row:first-child { padding-top: 0; border-top: 0; }
.ui-rlst__row-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-rlst__name { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1-5); margin-right: auto; min-width: 0; }
.ui-rlst__model { color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlst__model { font-weight: var(--tc-font-weight-medium); }
.ui-rlst__provider { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rlst__tier { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); white-space: nowrap; }
.ui-rlst__headroom { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-rlst-tone-bg); color: var(--tc-rlst-tone); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-rlst__headroom svg { width: 11px; height: 11px; }
/* ----- Meters ----- */
.ui-rlst__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-3); }
.ui-rlst__metric { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-rlst__metric-label { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ui-rlst__metric-value { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rlst__meter { grid-column: 1 / -1; position: relative; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); overflow: hidden; }
.ui-rlst__meter-fill { position: absolute; inset: 0 auto 0 0; border-radius: inherit; background: var(--tc-rlst-tone); transition: inline-size var(--tc-duration-base) var(--tc-ease-standard); }
[data-tone="success"] > .ui-rlst__meter .ui-rlst__meter-fill { background: var(--tc-meter-fill); }
/* ----- Foot ----- */
.ui-rlst__row-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-xs); }
.ui-rlst__throttled { color: var(--tc-text-muted); }
.ui-rlst__throttled[data-some="true"] { color: var(--tc-status-danger-fg); }
.ui-rlst__spark { display: inline-flex; align-items: center; gap: var(--tc-space-2); color: var(--tc-text-muted); }
.ui-rlst__spark-line { fill: none; stroke: var(--tc-accent-text); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.ui-rlst__spark-limit { stroke: var(--tc-status-danger-fg); stroke-width: 1; stroke-dasharray: 2 2; vector-effect: non-scaling-stroke; }
.ui-rlst__empty { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
@container (max-width: 520px) {
  .ui-rlst__metrics { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2); }
}
@media (forced-colors: active) {
  .ui-rlst__meter { border: 1px solid CanvasText; }
  .ui-rlst__meter-fill { background: Highlight; }
  .ui-rlst__headroom, .ui-rlst__tier, .ui-rlst__count { border: 1px solid CanvasText; }
  .ui-rlst__spark-line { stroke: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rlst"] *, [data-ui="rlst"] *::before, [data-ui="rlst"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-rate-limit-status")) customElements.define("tc-rate-limit-status", TcRateLimitStatus);

declare global {
  interface HTMLElementTagNameMap {
    "tc-rate-limit-status": TcRateLimitStatus;
  }
}
