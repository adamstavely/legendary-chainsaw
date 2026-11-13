import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-cost-anomaly> – one spend spike and what caused it. A headline – "$1,240 over expected on 14 Nov" and "Spent
 * $1,640 against an expected $400 – 310% above" – over a small chart of daily spend: bars, the expected range as a band
 * and the spike's bar marked. Then the likely cause and any others, each with its share of the extra cost; the evidence
 * the page supplies (the costliest runs or requests during the spike); and Set a limit, Investigate and Mark as
 * expected (with Undo).
 *   · the chart is drawn for sighted readers and summed up in a sentence; "Show as table" swaps in a real table
 *   · evidence rows are buttons (tc-evidence-open); every action is a plain button
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-cost-anomaly .days=${[{ date: …, spend: 410, expected: 400, low: 340, high: 470 }, …]} .causes=${[…]}></tc-cost-anomaly>
 */

/** A trending-up line with a warning: Lucide's "trending-up" (ISC, lucide.dev) */
const spikeIcon = svg`<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline>`;

export type CostDay = {
  /** The day, epoch ms */
  date: number;
  /** What was spent that day, in `currency` */
  spend: number;
  /** What was expected that day; drawn as a dashed line */
  expected?: number;
  /** The low end of the normal range; with `high`, drawn as a band */
  low?: number;
  /** The high end of the normal range */
  high?: number;
};
export type AnomalyCauseKind = "agent" | "feature" | "key" | "model" | "member" | "team";
export type AnomalyCause = {
  id: string;
  kind: AnomalyCauseKind;
  /** e.g. "Invoice matcher" */
  name: string;
  /** Its share of the extra cost, 0 to 1 */
  share: number;
  /** One line on why, e.g. "Retried every invoice 6 times after a parser change" */
  note?: string;
};
export type AnomalyEvidence = {
  id: string;
  /** A run or request, e.g. "Run 8f2c · Invoice matcher" */
  label: string;
  /** One line under it, e.g. "large-1 · 412k tokens · 6 retries" */
  detail?: string;
  /** What it cost, in `currency` */
  cost: number;
  /** When, epoch ms */
  at?: number;
};
export type AnomalyStatus = "open" | "expected";

/** Details of the events */
export type AnomalyStatusChange = { status: AnomalyStatus };
export type AnomalyTarget = { target: AnomalyCause | null };
export type AnomalyEvidenceOpen = { id: string; evidence: AnomalyEvidence };

/** The words for each kind of cause */
export const defaultAnomalyCauseLabels: Record<AnomalyCauseKind, string> = {
  agent: "Agent",
  feature: "Feature",
  key: "API key",
  model: "Model",
  member: "Member",
  team: "Team",
};

/** The spike: the given day, or the day furthest above what was expected */
export function anomalySpike(days: CostDay[], at?: number) {
  if (!days.length) return undefined;
  if (at !== undefined) {
    const hit = days.find((d) => d.date === at);
    if (hit) return hit;
  }
  return days.reduce((best, d) => (d.spend - (d.expected ?? d.high ?? 0) > best.spend - (best.expected ?? best.high ?? 0) ? d : best));
}

let uidCount = 0;

/**
 * Cost anomaly: one spend spike – how far over expected, a chart of daily spend with the expected band, the likely
 * cause and its share of the extra cost, the evidence, and Set a limit, Investigate and Mark as expected.
 * @tag tc-cost-anomaly
 * @fires tc-status-change - Marked as expected, or back to open ({ status }: AnomalyStatusChange); cancelable – prevented, `status` stays as it was
 * @fires tc-set-limit - Set a limit was pressed ({ target }: AnomalyTarget)
 * @fires tc-investigate - Investigate was pressed ({ target }: AnomalyTarget)
 * @fires tc-evidence-open - An evidence row was opened ({ id, evidence }: AnomalyEvidenceOpen)
 */
export class TcCostAnomaly extends TcElement {
  static override ui = "coa";

  /** The heading */
  @property() accessor heading = "Cost spike";
  /** One line under the heading, e.g. the workspace */
  @property() accessor description: string | undefined = undefined;
  /** Daily spend around the spike, oldest first */
  @property({ attribute: false }) accessor days: CostDay[] = [];
  /** The spike's day, epoch ms; by default the day furthest above what was expected */
  @property({ type: Number }) accessor spike: number | undefined = undefined;
  /** What drove the extra cost, the likeliest first */
  @property({ attribute: false }) accessor causes: AnomalyCause[] = [];
  /** The costliest runs or requests during the spike */
  @property({ attribute: false }) accessor evidence: AnomalyEvidence[] = [];
  /** "open", or "expected" once marked. Changed by Mark as expected and Undo unless a tc-status-change listener calls preventDefault() */
  @property({ reflect: true }) accessor status: AnomalyStatus = "open";
  /** The spend's currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The language for numbers and dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The time zone the days are counted in */
  @property({ attribute: "time-zone" }) accessor timeZone = "UTC";
  /** The words for each kind of cause, merged over defaultAnomalyCauseLabels */
  @property({ attribute: false }) accessor causeLabels: Partial<Record<AnomalyCauseKind, string>> = {};

  /** The chart is shown as a table */
  @state() private accessor table = false;
  /** The polite announcement */
  @state() private accessor announce = "";

  private uid = `tc-coa-${++uidCount}`;

  /* ---------- The model ---------- */

  private money(v: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, maximumFractionDigits: 0 }).format(v);
    } catch {
      return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 }).format(v);
    }
  }
  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(v);
  }
  private day(ms: number) {
    return formatDate(ms, this.locale, { day: "numeric", month: "short", timeZone: this.timeZone });
  }
  private time(ms: number) {
    return formatDate(ms, this.locale, { hour: "numeric", minute: "2-digit", timeZone: this.timeZone });
  }
  private kindWord(k: AnomalyCauseKind) {
    return this.causeLabels[k] ?? defaultAnomalyCauseLabels[k] ?? k;
  }
  private expectedOf(d: CostDay) {
    return d.expected ?? (d.low !== undefined && d.high !== undefined ? (d.low + d.high) / 2 : undefined);
  }

  private setStatus(next: AnomalyStatus) {
    if (next === this.status) return;
    if (!this.emit<AnomalyStatusChange>("tc-status-change", { status: next }, { cancelable: true })) return;
    this.status = next;
    this.announce = next === "expected" ? "Marked as expected" : "Marked as open again";
    const focus = next === "expected" ? ".ui-coa__undo" : ".ui-coa__expected";
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(focus)?.focus());
  }

  /* ---------- Rendering ---------- */

  private renderChart(spike: CostDay) {
    const days = this.days;
    const W = 600;
    const H = 120;
    const top = Math.max(...days.map((d) => Math.max(d.spend, d.high ?? 0, d.expected ?? 0)), 1) * 1.08;
    const n = days.length;
    const slot = W / n;
    const y = (v: number) => H - (Math.max(0, v) / top) * H;
    const x = (i: number) => slot * i + slot / 2;
    const banded = days.every((d) => d.low !== undefined && d.high !== undefined);
    const band = banded ? [...days.map((d, i) => `${x(i)},${y(d.high!)}`), ...days.map((_, i) => `${x(n - 1 - i)},${y(days[n - 1 - i].low!)}`)].join(" ") : "";
    const expectedPts = days.map((d, i) => (this.expectedOf(d) === undefined ? null : `${x(i)},${y(this.expectedOf(d)!)}`)).filter(Boolean).join(" ");
    const bw = Math.max(2, slot * 0.6);
    return html`<svg class="ui-coa__chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      ${banded ? svg`<polygon class="ui-coa__band" points=${band}></polygon>` : nothing}
      ${days.map((d, i) => svg`<rect class="ui-coa__bar" ?data-spike=${d === spike} x=${x(i) - bw / 2} y=${y(d.spend)} width=${bw} height=${Math.max(1, H - y(d.spend))} rx="1.5"></rect>`)}
      ${expectedPts ? svg`<polyline class="ui-coa__expected-line" points=${expectedPts}></polyline>` : nothing}
    </svg>`;
  }

  private renderTable() {
    return html`<table class="ui-coa__table" id=${`${this.uid}-table`}>
      <caption class="ui-coa__sr">Daily spend</caption>
      <thead>
        <tr><th scope="col">Day</th><th scope="col" class="ui-coa__num">Spent</th><th scope="col" class="ui-coa__num">Expected</th></tr>
      </thead>
      <tbody>
        ${this.days.map((d) => {
          const e = this.expectedOf(d);
          const range = d.low !== undefined && d.high !== undefined ? `${this.money(d.low)}–${this.money(d.high)}` : e !== undefined ? this.money(e) : "–";
          return html`<tr><th scope="row">${this.day(d.date)}</th><td class="ui-coa__num">${this.money(d.spend)}</td><td class="ui-coa__num">${range}</td></tr>`;
        })}
      </tbody>
    </table>`;
  }

  protected override render() {
    const id = this.uid;
    const spike = anomalySpike(this.days, this.spike);
    const likely = this.causes[0] ?? null;
    const expected = spike ? this.expectedOf(spike) : undefined;
    const extra = spike && expected !== undefined ? Math.max(0, spike.spend - expected) : undefined;
    const statusWord = this.status === "expected" ? "Expected" : "Open";
    if (!spike)
      return html`${cardHead({ icon: spikeIcon, title: this.heading, subtitle: this.description, id: `${id}-title` })}
        <div class="ui-coa__card"><p class="ui-coa__empty">No spend to show yet.</p></div>`;
    const usual = this.days.filter((d) => d !== spike);
    const lo = usual.length ? Math.min(...usual.map((d) => d.low ?? d.spend)) : spike.spend;
    const hi = usual.length ? Math.max(...usual.map((d) => d.high ?? d.spend)) : spike.spend;
    const summary = `Daily spend from ${this.day(this.days[0].date)} to ${this.day(this.days[this.days.length - 1].date)}. Usually ${this.money(lo)}–${this.money(hi)} a day; on ${this.day(spike.date)} it was ${this.money(spike.spend)}.`;
    return html`
      <span class="ui-coa__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: spikeIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: html`<span class="ui-coa__status" data-status=${this.status}><span class="ui-coa__dot" aria-hidden="true"></span>${statusWord}</span>`,
      })}
      <div class="ui-coa__card">
        <div class="ui-coa__head">
          <p class="ui-coa__headline">
            ${extra !== undefined ? html`<strong>${this.money(extra)} over expected</strong> on ${this.day(spike.date)}` : html`<strong>${this.money(spike.spend)}</strong> on ${this.day(spike.date)}`}
          </p>
          ${expected !== undefined
            ? html`<p class="ui-coa__subline">
                Spent ${this.money(spike.spend)} against an expected ${this.money(expected)}${expected > 0 ? html` – <span class="ui-coa__above">${this.pct((spike.spend - expected) / expected)} above</span>` : nothing}
              </p>`
            : nothing}
        </div>
        <figure class="ui-coa__figure">
          ${this.table
            ? this.renderTable()
            : html`<div class="ui-coa__plot">
                ${this.renderChart(spike)}
                <span class="ui-coa__axis" aria-hidden="true"><span>${this.day(this.days[0].date)}</span><span>${this.day(this.days[this.days.length - 1].date)}</span></span>
              </div>`}
          <figcaption class="ui-coa__caption">
            <span class="ui-coa__summary">${summary}</span>
            <button type="button" class="ui-coa__toggle" aria-pressed=${this.table ? "true" : "false"} @click=${() => (this.table = !this.table)}>Show as table</button>
          </figcaption>
        </figure>
        ${this.causes.length
          ? html`<section class="ui-coa__section" aria-labelledby=${`${id}-causes`}>
              <h4 class="ui-coa__sub" id=${`${id}-causes`}>${this.causes.length === 1 ? "Likely cause" : "What drove it"}</h4>
              <ul class="ui-coa__causes">
                ${this.causes.map((c, i) => {
                  const share = Math.max(0, Math.min(1, c.share));
                  return html`<li class="ui-coa__cause" data-id=${c.id}>
                    <span class="ui-coa__cause-top">
                      ${i === 0 && this.causes.length > 1 ? html`<span class="ui-coa__likely">Likely cause</span>` : nothing}
                      <span class="ui-coa__cause-name">${c.name}</span>
                      <span class="ui-coa__cause-kind">${this.kindWord(c.kind)}</span>
                      <span class="ui-coa__cause-share">${this.pct(share)} of the extra cost${extra !== undefined ? html` (${this.money(extra * share)})` : nothing}</span>
                    </span>
                    <span class="ui-coa__track" aria-hidden="true"><span class="ui-coa__fill" style=${`inline-size: ${share * 100}%`}></span></span>
                    ${c.note ? html`<span class="ui-coa__note">${c.note}</span>` : nothing}
                  </li>`;
                })}
              </ul>
            </section>`
          : nothing}
        ${this.evidence.length
          ? html`<section class="ui-coa__section" aria-labelledby=${`${id}-evidence`}>
              <h4 class="ui-coa__sub" id=${`${id}-evidence`}>Evidence</h4>
              <ul class="ui-coa__evidence">
                ${this.evidence.map(
                  (ev) => html`<li>
                    <button type="button" class="ui-coa__ev" data-id=${ev.id} @click=${() => this.emit<AnomalyEvidenceOpen>("tc-evidence-open", { id: ev.id, evidence: ev })}>
                      <span class="ui-coa__ev-what"
                        ><span class="ui-coa__ev-label">${ev.label}</span>${ev.detail || ev.at !== undefined
                          ? html` <span class="ui-coa__ev-detail">${[ev.at !== undefined ? this.time(ev.at) : "", ev.detail].filter(Boolean).join(" · ")}</span>`
                          : nothing}</span
                      >
                      <span class="ui-coa__ev-cost">${this.money(ev.cost)}</span>
                    </button>
                  </li>`,
                )}
              </ul>
            </section>`
          : nothing}
        <div class="ui-coa__actions">
          ${this.status === "expected"
            ? html`<p class="ui-coa__done">Marked as expected.</p>
                <button type="button" class="tc-btn-sm ui-coa__undo" @click=${() => this.setStatus("open")}>Undo</button>`
            : html`${likely
                  ? html`<button type="button" class="tc-btn-sm ui-coa__limit" @click=${() => this.emit<AnomalyTarget>("tc-set-limit", { target: likely })}>
                      Set a limit<span class="ui-coa__sr"> on ${likely.name}</span>
                    </button>`
                  : nothing}
                <button type="button" class="tc-btn-sm ui-coa__investigate" @click=${() => this.emit<AnomalyTarget>("tc-investigate", { target: likely })}>Investigate</button>
                <button type="button" class="tc-btn-sm ui-coa__expected" @click=${() => this.setStatus("expected")}>Mark as expected</button>`}
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="coa"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="coa"] {
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
[data-ui="coa"] *, [data-ui="coa"] *::before, [data-ui="coa"] *::after { box-sizing: border-box; }
:where([data-ui="coa"]) .ui-coa__toggle, :where([data-ui="coa"]) .ui-coa__ev { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="coa"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="coa"] ul, [data-ui="coa"] h4, [data-ui="coa"] figure { margin: 0; padding: 0; list-style: none; }
[data-ui="coa"] p { margin: 0; }
.ui-coa__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-coa__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-coa__status { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-coa__status[data-status="expected"] { background: var(--tc-fill-subtle); color: var(--tc-text-secondary); }
.ui-coa__dot { width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: currentColor; }
/* ----- Headline ----- */
.ui-coa__head { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-coa__head { padding-top: var(--tc-space-1); }
.ui-coa__headline { color: var(--tc-text-secondary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-snug); }
.ui-coa__headline strong { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); font-variant-numeric: tabular-nums; }
.ui-coa__subline { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-coa__above { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
/* ----- Chart ----- */
.ui-coa__figure { padding: 0 var(--tc-space-4) var(--tc-space-3) !important; }
.ui-coa__plot { display: grid; gap: var(--tc-space-1); }
.ui-coa__chart { display: block; width: 100%; height: 120px; overflow: visible; }
.ui-coa__band { fill: var(--tc-fill-subtle); stroke: none; }
.ui-coa__bar { fill: var(--tc-chart-neutral); }
.ui-coa__bar[data-spike] { fill: var(--tc-status-danger-solid); }
.ui-coa__expected-line { fill: none; stroke: var(--tc-text-muted); stroke-width: 1.5; stroke-dasharray: 4 3; vector-effect: non-scaling-stroke; }
.ui-coa__axis { display: flex; justify-content: space-between; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-coa__caption { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); margin-top: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-coa__summary { flex: 1 1 18em; }
.ui-coa__toggle { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) !important; border-radius: var(--tc-radius-md); color: var(--tc-accent-text) !important; font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-coa__toggle[aria-pressed="true"] { background: var(--tc-fill-subtle); }
.ui-coa__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-coa__table th, .ui-coa__table td { padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); text-align: left; }
.ui-coa__table thead th { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-coa__table tbody th { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-coa__table .ui-coa__num { text-align: right; }
/* ----- Causes and evidence ----- */
.ui-coa__section { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-coa__sub { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-coa__causes { display: grid; gap: var(--tc-space-3); }
.ui-coa__cause { display: grid; gap: var(--tc-space-1); }
.ui-coa__cause-top { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-coa__likely { padding: var(--tc-space-0-5) var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); text-transform: uppercase; letter-spacing: var(--tc-tracking-caps); }
.ui-coa__cause-name { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-coa__cause-kind { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-coa__cause-share { margin-inline-start: auto; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-coa__track { display: block; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-coa__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-status-danger-solid); }
.ui-coa__note { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-coa__evidence { display: grid; margin: 0 calc(var(--tc-space-2-5) * -1) !important; }
.ui-coa__ev { display: flex !important; align-items: center; justify-content: space-between; gap: var(--tc-space-3); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-2-5) !important; border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-coa__ev:hover { background: var(--tc-fill-subtle); }
.ui-coa__ev-what { display: grid; min-width: 0; }
.ui-coa__ev-label { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.ui-coa__ev-detail { overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-coa__ev-cost { flex: none; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* ----- Actions ----- */
.ui-coa__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-coa__done { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-coa__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 420px) {
  .ui-coa__cause-share { margin-inline-start: 0; flex-basis: 100%; }
}
@media (forced-colors: active) {
  .ui-coa__bar { fill: GrayText; }
  .ui-coa__bar[data-spike], .ui-coa__fill { fill: CanvasText; background: CanvasText; }
  .ui-coa__band { fill: Canvas; stroke: GrayText; }
  .ui-coa__expected-line { stroke: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="coa"] *, [data-ui="coa"] *::before, [data-ui="coa"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-cost-anomaly")) customElements.define("tc-cost-anomaly", TcCostAnomaly);

declare global {
  interface HTMLElementTagNameMap {
    "tc-cost-anomaly": TcCostAnomaly;
  }
}
