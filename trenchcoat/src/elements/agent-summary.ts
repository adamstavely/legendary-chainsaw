import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { duration } from "./internal/format";

/*
 * <tc-agent-summary> – one agent's profile: its status, model, tools, owner and which version is live against the
 * draft, then two weeks of runs as a small daily chart of succeeded and failed, the success rate, the median run time
 * and the cost, and the recent failures with their errors. Edit, Run test and Pause / Resume fire tc-action; Pause
 * and Resume change `status` unless prevented, Edit and Run test are the page's.
 *   · the chart is a picture of the table it can switch to: "Show as table" shows the same days as rows
 *   · status is a mark and a word; failed runs are a second colour and a word in the table
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-agent-summary name="Invoice matcher" status="live" model="Model M" .days=${days}></tc-agent-summary>
 */

export type AgentSummaryStatus = "live" | "draft" | "paused" | "failing";
export type AgentSummaryAction = "edit" | "test" | "pause" | "resume";
export type AgentSummaryDay = {
  /** The day, epoch ms (any time in it) */
  date: number;
  succeeded: number;
  failed: number;
};
export type AgentSummaryFailure = {
  id: string;
  /** When, epoch ms */
  at: number;
  /** What went wrong, in words */
  error: string;
  /** The step it failed at */
  step?: string;
};
export type AgentSummaryActionDetail = { action: AgentSummaryAction };

/** The element's words, every one renameable through `labels` */
export type AgentSummaryLabels = Record<AgentSummaryStatus, string> & {
  model: string;
  tools: string;
  noTools: string;
  owner: string;
  version: string;
  liveVersion: string;
  draftVersion: string;
  runs: string;
  chart: string;
  chartSummary: string;
  showTable: string;
  day: string;
  succeeded: string;
  failed: string;
  successRate: string;
  median: string;
  cost: string;
  failures: string;
  noFailures: string;
  noRuns: string;
  at: string;
  edit: string;
  test: string;
  pause: string;
  resume: string;
};
export const defaultAgentSummaryLabels: AgentSummaryLabels = {
  live: "Live",
  draft: "Draft",
  paused: "Paused",
  failing: "Failing",
  model: "Model",
  tools: "Tools",
  noTools: "No tools",
  owner: "Owner",
  version: "Version",
  liveVersion: "{v} live",
  draftVersion: "{v} in draft",
  runs: "Runs, last 14 days",
  chart: "Runs per day",
  chartSummary: "{runs} runs over {days} days: {succeeded} succeeded, {failed} failed.",
  showTable: "Show as table",
  day: "Day",
  succeeded: "Succeeded",
  failed: "Failed",
  successRate: "Success rate",
  median: "Median run",
  cost: "Cost",
  failures: "Recent failures",
  noFailures: "No failures in this period.",
  noRuns: "No runs in this period.",
  at: "at",
  edit: "Edit",
  test: "Run test",
  pause: "Pause",
  resume: "Resume",
};

/* bot: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>`;
const CHART_W = 280;
const CHART_H = 64;
let instances = 0;

/** Runs, successes and failures over the days, and the success rate (null with no runs) */
export function agentSummaryTotals(days: AgentSummaryDay[]) {
  const succeeded = days.reduce((n, d) => n + d.succeeded, 0);
  const failed = days.reduce((n, d) => n + d.failed, 0);
  const runs = succeeded + failed;
  return { runs, succeeded, failed, rate: runs ? succeeded / runs : null };
}

/**
 * One agent's profile: status, model, tools, owner, version, two weeks of runs, and recent failures.
 * @tag tc-agent-summary
 * @fires tc-action - Edit, Run test, Pause or Resume was pressed ({ action }: AgentSummaryActionDetail); cancelable – prevented, Pause and Resume leave `status` as it was
 */
export class TcAgentSummary extends TcElement {
  static override ui = "agsm";

  /** The agent's name, the heading */
  @property() accessor name = "Agent";
  /** A line under the name: what the agent does */
  @property() accessor description: string | undefined = undefined;
  /** Where it stands: "live", "draft", "paused" or "failing" */
  @property({ reflect: true }) accessor status: AgentSummaryStatus = "live";
  /** The model it runs on */
  @property() accessor model: string | undefined = undefined;
  /** The tools it may call, as words */
  @property({ attribute: false }) accessor tools: string[] = [];
  /** Who owns it */
  @property() accessor owner: string | undefined = undefined;
  /** The version that's live, e.g. "v12" */
  @property({ attribute: "live-version" }) accessor liveVersion: string | undefined = undefined;
  /** A draft version waiting to go live, e.g. "v13" */
  @property({ attribute: "draft-version" }) accessor draftVersion: string | undefined = undefined;
  /** Runs per day, oldest first – usually the last 14 */
  @property({ attribute: false }) accessor days: AgentSummaryDay[] = [];
  /** The median run time, ms */
  @property({ type: Number, attribute: "median-duration" }) accessor medianDuration: number | undefined = undefined;
  /** What the period cost */
  @property({ type: Number }) accessor cost: number | undefined = undefined;
  /** The cost's currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** Recent failures, newest first */
  @property({ attribute: false }) accessor failures: AgentSummaryFailure[] = [];
  /** Offer Edit, Run test and Pause / Resume; set actions="false" to only show */
  @property({ attribute: "actions", converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor actions = true;
  /** The locale for dates, numbers and money */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AgentSummaryLabels> = {};

  @state() private accessor table = false;
  private readonly uid = `tc-agsm-${++instances}`;

  private get words(): AgentSummaryLabels {
    return { ...defaultAgentSummaryLabels, ...this.labels };
  }

  private money(n: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, maximumFractionDigits: 2 }).format(n);
    } catch {
      return `${n.toFixed(2)} ${this.currency}`;
    }
  }

  private percent(n: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
  }

  private day(ms: number, long = false) {
    return new Intl.DateTimeFormat(this.locale, long ? { weekday: "short", month: "short", day: "numeric" } : { month: "short", day: "numeric" }).format(ms);
  }

  private stamp(ms: number) {
    return new Intl.DateTimeFormat(this.locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ms);
  }

  private act(action: AgentSummaryAction) {
    if (!this.emit<AgentSummaryActionDetail>("tc-action", { action }, { cancelable: true })) return;
    if (action === "pause") this.status = "paused";
    else if (action === "resume") this.status = "live";
  }

  private renderChart() {
    const days = this.days;
    const most = Math.max(1, ...days.map((d) => d.succeeded + d.failed));
    const slot = CHART_W / Math.max(1, days.length);
    const bar = Math.max(2, slot * 0.64);
    return svg`${days.map((d, i) => {
      const x = i * slot + (slot - bar) / 2;
      const hs = (d.succeeded / most) * CHART_H;
      const hf = (d.failed / most) * CHART_H;
      return svg`<rect class="ui-agsm__bar" data-kind="succeeded" x=${x} y=${CHART_H - hs} width=${bar} height=${hs}></rect>
        <rect class="ui-agsm__bar" data-kind="failed" x=${x} y=${CHART_H - hs - hf} width=${bar} height=${hf}></rect>`;
    })}`;
  }

  protected override render() {
    const w = this.words;
    const totals = agentSummaryTotals(this.days);
    const summary = w.chartSummary
      .replace("{runs}", String(totals.runs))
      .replace("{days}", String(this.days.length))
      .replace("{succeeded}", String(totals.succeeded))
      .replace("{failed}", String(totals.failed));
    const canPause = this.actions && (this.status === "live" || this.status === "failing");
    const canResume = this.actions && this.status === "paused";
    const first = this.days[0];
    const last = this.days[this.days.length - 1];
    return html`${cardHead({
        icon: ICON,
        title: this.name,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: html`<span class="ui-agsm__status" data-status=${this.status}><span class="ui-agsm__mark" aria-hidden="true"></span>${w[this.status]}</span>`,
      })}
      <div class="ui-agsm__card">
        <dl class="ui-agsm__facts">
          ${this.model ? html`<div class="ui-agsm__fact"><dt>${w.model}</dt><dd class="ui-agsm__model">${this.model}</dd></div>` : nothing}
          ${this.owner ? html`<div class="ui-agsm__fact"><dt>${w.owner}</dt><dd class="ui-agsm__owner">${this.owner}</dd></div>` : nothing}
          ${this.liveVersion || this.draftVersion
            ? html`<div class="ui-agsm__fact">
                <dt>${w.version}</dt>
                <dd class="ui-agsm__versions">
                  ${this.liveVersion ? html`<span class="ui-agsm__version" data-kind="live">${w.liveVersion.replace("{v}", this.liveVersion)}</span>` : nothing}
                  ${this.draftVersion ? html`<span class="ui-agsm__version" data-kind="draft">${w.draftVersion.replace("{v}", this.draftVersion)}</span>` : nothing}
                </dd>
              </div>`
            : nothing}
          <div class="ui-agsm__fact ui-agsm__fact--wide">
            <dt>${w.tools}</dt>
            <dd>
              ${this.tools.length ? html`<ul class="ui-agsm__tools">${this.tools.map((t) => html`<li class="ui-agsm__tool">${t}</li>`)}</ul>` : html`<span class="ui-agsm__none">${w.noTools}</span>`}
            </dd>
          </div>
        </dl>
        <section class="ui-agsm__runs" aria-labelledby=${`${this.uid}-runs`}>
          <div class="ui-agsm__runs-head">
            <h4 class="ui-agsm__label" id=${`${this.uid}-runs`}>${w.runs}</h4>
            ${this.days.length
              ? html`<button type="button" class="tc-btn-sm ui-agsm__toggle" aria-pressed=${this.table ? "true" : "false"} aria-controls=${`${this.uid}-table`} @click=${() => (this.table = !this.table)}>${w.showTable}</button>`
              : nothing}
          </div>
          <dl class="ui-agsm__figures">
            <div><dt class="ui-agsm__label">${w.successRate}</dt><dd class="ui-agsm__figure ui-agsm__rate">${totals.rate === null ? "–" : this.percent(totals.rate)}</dd></div>
            ${this.medianDuration !== undefined ? html`<div><dt class="ui-agsm__label">${w.median}</dt><dd class="ui-agsm__figure ui-agsm__median">${duration(this.medianDuration)}</dd></div>` : nothing}
            ${this.cost !== undefined ? html`<div><dt class="ui-agsm__label">${w.cost}</dt><dd class="ui-agsm__figure ui-agsm__cost">${this.money(this.cost)}</dd></div>` : nothing}
          </dl>
          ${this.days.length
            ? html`<figure class="ui-agsm__chart">
                  <svg class="ui-agsm__svg" viewBox=${`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" aria-hidden="true">${this.renderChart()}</svg>
                  <div class="ui-agsm__axis" aria-hidden="true"><span>${first ? this.day(first.date) : ""}</span><span>${last ? this.day(last.date) : ""}</span></div>
                  <figcaption class="ui-agsm__caption">
                    <span class="ui-agsm__key" data-kind="succeeded"><span class="ui-agsm__swatch" aria-hidden="true"></span>${w.succeeded}</span>
                    <span class="ui-agsm__key" data-kind="failed"><span class="ui-agsm__swatch" aria-hidden="true"></span>${w.failed}</span>
                    <span class="ui-agsm__summary">${summary}</span>
                  </figcaption>
                </figure>
                <div class="ui-agsm__table-wrap" id=${`${this.uid}-table`} ?hidden=${!this.table}>
                  <table class="ui-agsm__table">
                    <caption class="tc-sr-only">${w.chart}</caption>
                    <thead><tr><th scope="col">${w.day}</th><th scope="col">${w.succeeded}</th><th scope="col">${w.failed}</th></tr></thead>
                    <tbody>
                      ${this.days.map((d) => html`<tr><th scope="row">${this.day(d.date, true)}</th><td>${d.succeeded}</td><td data-failed=${d.failed ? "true" : "false"}>${d.failed}</td></tr>`)}
                    </tbody>
                  </table>
                </div>`
            : html`<p class="ui-agsm__none">${w.noRuns}</p>`}
        </section>
        <section class="ui-agsm__failures" aria-labelledby=${`${this.uid}-failures`}>
          <h4 class="ui-agsm__label" id=${`${this.uid}-failures`}>${w.failures}</h4>
          ${this.failures.length
            ? html`<ul class="ui-agsm__failure-list">
                ${this.failures.map(
                  (f) => html`<li class="ui-agsm__failure" data-failure=${f.id}>
                    <span class="ui-agsm__failure-when"><time datetime=${new Date(f.at).toISOString()}>${this.stamp(f.at)}</time>${f.step ? html` · ${w.at} ${f.step}` : nothing}</span>
                    <span class="ui-agsm__error">${f.error}</span>
                  </li>`,
                )}
              </ul>`
            : html`<p class="ui-agsm__none">${w.noFailures}</p>`}
        </section>
        ${this.actions
          ? html`<div class="ui-agsm__actions">
              <button type="button" class="tc-btn-sm ui-agsm__action" data-action="edit" @click=${() => this.act("edit")}>${w.edit}</button>
              <button type="button" class="tc-btn-sm ui-agsm__action" data-action="test" @click=${() => this.act("test")}>${w.test}</button>
              ${canPause ? html`<button type="button" class="tc-btn-sm ui-agsm__action" data-action="pause" @click=${() => this.act("pause")}>${w.pause}</button>` : nothing}
              ${canResume ? html`<button type="button" class="tc-btn-sm ui-agsm__action" data-action="resume" @click=${() => this.act("resume")}>${w.resume}</button>` : nothing}
            </div>`
          : nothing}
      </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agsm"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agsm"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The chart's height and the status mark's size – override them on the element */
[data-ui="agsm"] { --tc-agsm-chart-h: var(--tc-space-16); --tc-agsm-mark: var(--tc-space-2); }
[data-ui="agsm"] *, [data-ui="agsm"] *::before, [data-ui="agsm"] *::after { box-sizing: border-box; }
[data-ui="agsm"] :where(p, h4, ul, dl, dd, figure) { margin: 0; }
[data-ui="agsm"] :where(ul) { padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agsm"] .ui-agsm__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-agsm__card { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
.ui-agsm__status { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-agsm__mark { width: var(--tc-agsm-mark); height: var(--tc-agsm-mark); border-radius: var(--tc-radius-full); background: var(--tc-text-muted); }
.ui-agsm__status[data-status="live"] .ui-agsm__mark { background: var(--tc-status-success-solid); }
.ui-agsm__status[data-status="failing"] { color: var(--tc-status-danger-fg); }
.ui-agsm__status[data-status="failing"] .ui-agsm__mark { background: var(--tc-status-danger-solid); }
.ui-agsm__status[data-status="paused"] .ui-agsm__mark { background: var(--tc-status-warning-solid); }
.ui-agsm__status[data-status="draft"] .ui-agsm__mark { background: transparent; box-shadow: inset 0 0 0 1px var(--tc-text-muted); }
.ui-agsm__facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(9em, 1fr)); gap: var(--tc-space-3); }
.ui-agsm__fact { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-agsm__fact--wide { grid-column: 1 / -1; }
.ui-agsm__fact dt, .ui-agsm__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); }
.ui-agsm__fact dd { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-agsm__versions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-agsm__version { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); }
.ui-agsm__version[data-kind="draft"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-agsm__tools { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-agsm__tool { padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); }
.ui-agsm__runs, .ui-agsm__failures { display: grid; gap: var(--tc-space-2); }
.ui-agsm__runs-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-agsm__figures { display: flex; flex-wrap: wrap; gap: var(--tc-space-2) var(--tc-space-5); }
.ui-agsm__figure { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-agsm__chart { display: grid; gap: var(--tc-space-1); }
.ui-agsm__svg { display: block; width: 100%; height: var(--tc-agsm-chart-h); overflow: visible; }
.ui-agsm__bar[data-kind="succeeded"] { fill: var(--tc-meter-fill); }
.ui-agsm__bar[data-kind="failed"] { fill: var(--tc-status-danger-solid); }
.ui-agsm__axis { display: flex; justify-content: space-between; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-agsm__caption { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agsm__key { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-agsm__swatch { width: var(--tc-space-2-5); height: var(--tc-space-2-5); border-radius: var(--tc-radius-2xs); background: var(--tc-meter-fill); }
.ui-agsm__key[data-kind="failed"] .ui-agsm__swatch { background: var(--tc-status-danger-solid); }
.ui-agsm__summary { flex: 1 1 14em; }
.ui-agsm__table-wrap { max-height: calc(var(--tc-space-16) * 3); overflow: auto; border-radius: var(--tc-control-radius-md); box-shadow: inset 0 0 0 1px var(--tc-border-subtle); }
.ui-agsm__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-agsm__table :where(th, td) { padding: var(--tc-space-1) var(--tc-space-2); border-bottom: 1px solid var(--tc-border-subtle); text-align: right; }
.ui-agsm__table :where(th[scope="row"], thead th:first-child) { text-align: left; font-weight: var(--tc-font-weight-regular); }
.ui-agsm__table thead th { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-agsm__table td[data-failed="true"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-agsm__failure-list { display: grid; gap: var(--tc-space-1); }
.ui-agsm__failure { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-control-radius-md); background: var(--tc-status-danger-bg); }
.ui-agsm__failure-when { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agsm__error { color: var(--tc-status-danger-fg); overflow-wrap: anywhere; }
.ui-agsm__none { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agsm__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); }
.ui-agsm__toggle[aria-pressed="true"] { box-shadow: var(--tc-action-secondary-shadow), inset 0 0 0 1px var(--tc-border-selected); }
@media (forced-colors: active) {
  .ui-agsm__bar[data-kind="succeeded"], .ui-agsm__swatch { fill: CanvasText; background: CanvasText; forced-color-adjust: none; }
  .ui-agsm__bar[data-kind="failed"], .ui-agsm__key[data-kind="failed"] .ui-agsm__swatch { fill: Highlight; background: Highlight; forced-color-adjust: none; }
  .ui-agsm__mark { background: CanvasText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-agent-summary")) customElements.define("tc-agent-summary", TcAgentSummary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-summary": TcAgentSummary;
  }
}
