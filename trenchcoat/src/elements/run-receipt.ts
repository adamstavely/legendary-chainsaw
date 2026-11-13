import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { copyText } from "./internal/util";

/*
 * <tc-run-receipt> – what one agent run cost and where the money went, set out like a receipt. The header names the
 * agent and the run (its id with a copy button), when it ran, how long it took and how it ended, in words. Line items
 * follow: each model with its calls and input, output and cached tokens, each tool with its calls, web lookups and
 * retries. Then the subtotal, the cache savings taken off it, and the total in the page's currency, with the costliest
 * step called out. Open trace and Download CSV close it; the CSV is built here, so nothing is fetched.
 *   · the line items are real tables, with captions and column headers
 *   · a model's `cost` is before cache savings; its `cacheSavings` comes off the subtotal as a discount
 *   · narrow, the cached-tokens column is left out (the discount line still says what caching saved)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-run-receipt agent="Invoice matcher" .runId=${"run_8f2c41"} .models=${[{ model: "large-1", calls: 6, inputTokens: 48200, outputTokens: 3100, cost: 0.31 }]}>
 *   </tc-run-receipt>
 */

export type RunReceiptStatus = "succeeded" | "failed" | "cancelled" | "running";
export type RunReceiptModel = {
  /** The model's name */
  model: string;
  /** How many calls the run made to it */
  calls: number;
  inputTokens: number;
  outputTokens: number;
  /** Input tokens read from the cache */
  cachedTokens?: number;
  /** What its calls cost before cache savings */
  cost: number;
  /** What reading from the cache saved, taken off the subtotal */
  cacheSavings?: number;
};
export type RunReceiptTool = { tool: string; calls: number; cost: number };
/** Web lookups or retries: how many, and what they cost */
export type RunReceiptCount = { count: number; cost: number };
/** One step of the run, for the costliest-step callout */
export type RunReceiptStep = { id?: string; name: string; cost: number };
export type RunReceiptTotals = { subtotal: number; savings: number; total: number };
export type RunReceiptCopy = { field: "run"; text: string };
export type RunReceiptTraceOpen = { runId: string };
export type RunReceiptDownload = { csv: string; filename: string };
export type RunReceiptLabels = Record<RunReceiptStatus, string> &
  Record<
    | "run"
    | "when"
    | "duration"
    | "status"
    | "copy"
    | "copied"
    | "copyFailed"
    | "models"
    | "model"
    | "calls"
    | "input"
    | "output"
    | "cached"
    | "cost"
    | "tools"
    | "tool"
    | "other"
    | "lookups"
    | "retries"
    | "subtotal"
    | "savings"
    | "total"
    | "costliest"
    | "ofTotal"
    | "openTrace"
    | "download"
    | "empty",
    string
  >;
export const defaultRunReceiptLabels: RunReceiptLabels = {
  succeeded: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
  running: "Still running",
  run: "Run",
  when: "When",
  duration: "Duration",
  status: "Status",
  copy: "Copy run ID",
  copied: "Run ID copied.",
  copyFailed: "Couldn't copy the run ID.",
  models: "Models",
  model: "Model",
  calls: "Calls",
  input: "Input",
  output: "Output",
  cached: "Cached",
  cost: "Cost",
  tools: "Tools",
  tool: "Tool",
  other: "Other",
  lookups: "Web lookups",
  retries: "Retries",
  subtotal: "Subtotal",
  savings: "Cache savings",
  total: "Total",
  costliest: "Costliest step",
  ofTotal: "of the total",
  openTrace: "Open trace",
  download: "Download CSV",
  empty: "Nothing was charged for this run",
};

/** The subtotal of every line, the cache savings and what's left */
export function receiptTotals(r: { models?: RunReceiptModel[]; tools?: RunReceiptTool[]; lookups?: RunReceiptCount | null; retries?: RunReceiptCount | null }): RunReceiptTotals {
  const sum = (xs: number[]) => xs.reduce((n, x) => n + (Number.isFinite(x) ? x : 0), 0);
  const subtotal = sum((r.models ?? []).map((m) => m.cost)) + sum((r.tools ?? []).map((t) => t.cost)) + (r.lookups?.cost ?? 0) + (r.retries?.cost ?? 0);
  const savings = sum((r.models ?? []).map((m) => m.cacheSavings ?? 0));
  return { subtotal, savings, total: Math.max(0, subtotal - savings) };
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The receipt as CSV: one row per line item, then the totals */
export function receiptCsv(r: { runId?: string; agent?: string; models?: RunReceiptModel[]; tools?: RunReceiptTool[]; lookups?: RunReceiptCount | null; retries?: RunReceiptCount | null }) {
  const rows: (string | number)[][] = [["run", "agent", "section", "item", "calls", "input_tokens", "output_tokens", "cached_tokens", "cost"]];
  const id = r.runId ?? "";
  const agent = r.agent ?? "";
  for (const m of r.models ?? []) rows.push([id, agent, "model", m.model, m.calls, m.inputTokens, m.outputTokens, m.cachedTokens ?? 0, m.cost]);
  for (const t of r.tools ?? []) rows.push([id, agent, "tool", t.tool, t.calls, "", "", "", t.cost]);
  if (r.lookups) rows.push([id, agent, "other", "web lookups", r.lookups.count, "", "", "", r.lookups.cost]);
  if (r.retries) rows.push([id, agent, "other", "retries", r.retries.count, "", "", "", r.retries.cost]);
  const t = receiptTotals(r);
  rows.push([id, agent, "total", "subtotal", "", "", "", "", t.subtotal]);
  rows.push([id, agent, "total", "cache savings", "", "", "", "", -t.savings]);
  rows.push([id, agent, "total", "total", "", "", "", "", t.total]);
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

/* After Lucide: receipt, copy, check, square-arrow-out-up-right, download (ISC licence) */
const headIcon = svg`<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5v-11"></path>`;
const icon = (paths: TemplateResult) => html`<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
const copyIcon = icon(svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const checkIcon = icon(svg`<path d="M20 6 9 17l-5-5"></path>`);
const traceIcon = icon(svg`<path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"></path><path d="m21 3-9 9"></path><path d="M15 3h6v6"></path>`);
const downloadIcon = icon(svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path><path d="M12 15V3"></path>`);
/* A mark per status, so the tone is never the only cue: check, cross, slash, dot */
const statusMarks: Record<RunReceiptStatus, TemplateResult> = {
  succeeded: svg`<path d="M5 12.5 10 17l9-10"></path>`,
  failed: svg`<path d="M7 7l10 10M17 7 7 17"></path>`,
  cancelled: svg`<path d="M7 17 17 7"></path>`,
  running: svg`<circle cx="12" cy="12" r="3"></circle>`,
};
const TONES: Record<RunReceiptStatus, string> = { succeeded: "success", failed: "danger", cancelled: "neutral", running: "info" };
const COPIED_MS = 1600;

let instances = 0;

/**
 * What one agent run cost and where it went, as a receipt: models, tools, lookups and retries, the subtotal, cache savings and the total, with the costliest step.
 * @tag tc-run-receipt
 * @fires tc-copy - The run ID's copy button was pressed ({ field, text }: RunReceiptCopy); cancelable – prevent it to write the clipboard yourself
 * @fires tc-trace-open - Open trace was pressed ({ runId }: RunReceiptTraceOpen)
 * @fires tc-download - Download CSV was pressed ({ csv, filename }: RunReceiptDownload); cancelable – prevented, the page saves the file itself
 */
export class TcRunReceipt extends TcElement {
  static override ui = "rrc";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Run receipt";
  /** The agent that ran – shown under the heading */
  @property() accessor agent = "";
  /** The run's id – shown with a copy button, and in the CSV */
  @property({ attribute: "run-id" }) accessor runId = "";
  /** When the run started, epoch ms */
  @property({ type: Number }) accessor at: number | null = null;
  /** How long it ran, in ms */
  @property({ type: Number }) accessor duration: number | null = null;
  /** How it ended */
  @property() accessor status: RunReceiptStatus = "succeeded";
  /** A line per model: calls, tokens and cost */
  @property({ attribute: false }) accessor models: RunReceiptModel[] = [];
  /** A line per tool: calls and cost */
  @property({ attribute: false }) accessor tools: RunReceiptTool[] = [];
  /** Web lookups: how many and what they cost; null leaves the line out */
  @property({ attribute: false }) accessor lookups: RunReceiptCount | null = null;
  /** Retries: how many and what they cost; null leaves the line out */
  @property({ attribute: false }) accessor retries: RunReceiptCount | null = null;
  /** The run's steps with their cost – the costliest is called out */
  @property({ attribute: false }) accessor steps: RunReceiptStep[] = [];
  /** ISO 4217 currency code for every amount */
  @property() accessor currency = "USD";
  /** Locale for dates, numbers and amounts */
  @property() accessor locale: string | undefined = undefined;
  /** Hides Open trace */
  @property({ type: Boolean, attribute: "hide-trace" }) accessor hideTrace = false;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<RunReceiptLabels> = {};

  /** @internal The copy button shows a check */
  @state() private accessor copied = false;
  /** @internal What the status region says */
  @state() private accessor message = "";

  private uid = `tc-rrc-${++instances}`;
  private copiedTimer = 0;

  private get words() {
    return { ...defaultRunReceiptLabels, ...this.labels };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  /** @internal An amount: a sub-cent one keeps four decimals so it doesn't read as zero */
  private money(n: number) {
    const small = n !== 0 && Math.abs(n) < 0.01;
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, minimumFractionDigits: small ? 4 : 2, maximumFractionDigits: small ? 4 : 2 }).format(n);
    } catch {
      return n.toFixed(small ? 4 : 2);
    }
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  private time(ms: number) {
    if (ms < 1000) return `${this.num(Math.round(ms))} ms`;
    const s = ms / 1000;
    if (s < 60) return `${new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(s)} s`;
    const m = Math.floor(s / 60);
    return `${m} min ${String(Math.round(s % 60)).padStart(2, "0")} s`;
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  private async copyId() {
    const words = this.words;
    if (!this.emit<RunReceiptCopy>("tc-copy", { field: "run", text: this.runId }, { cancelable: true }) || (await copyText(this.runId))) {
      clearTimeout(this.copiedTimer);
      this.copied = true;
      this.announce(words.copied);
      this.copiedTimer = window.setTimeout(() => (this.copied = false), COPIED_MS);
    } else this.announce(words.copyFailed);
  }

  private download() {
    const csv = receiptCsv(this);
    const filename = `${this.runId || "run"}-receipt.csv`;
    if (!this.emit<RunReceiptDownload>("tc-download", { csv, filename }, { cancelable: true })) return;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private modelsTable() {
    const words = this.words;
    if (!this.models.length) return nothing;
    return html`<table class="ui-rrc__table ui-rrc__models">
      <caption class="ui-rrc__caption">${words.models}</caption>
      <thead>
        <tr>
          <th scope="col" class="ui-rrc__item">${words.model}</th>
          <th scope="col" class="ui-rrc__n">${words.calls}</th>
          <th scope="col" class="ui-rrc__n">${words.input}</th>
          <th scope="col" class="ui-rrc__n">${words.output}</th>
          <th scope="col" class="ui-rrc__n ui-rrc__cached">${words.cached}</th>
          <th scope="col" class="ui-rrc__n ui-rrc__amount">${words.cost}</th>
        </tr>
      </thead>
      <tbody>
        ${this.models.map(
          (m) => html`<tr class="ui-rrc__line">
            <th scope="row" class="ui-rrc__item">${m.model}</th>
            <td class="ui-rrc__n">${this.num(m.calls)}</td>
            <td class="ui-rrc__n">${this.num(m.inputTokens)}</td>
            <td class="ui-rrc__n">${this.num(m.outputTokens)}</td>
            <td class="ui-rrc__n ui-rrc__cached">${this.num(m.cachedTokens ?? 0)}</td>
            <td class="ui-rrc__n ui-rrc__amount">${this.money(m.cost)}</td>
          </tr>`,
        )}
      </tbody>
    </table>`;
  }

  private simpleTable(caption: string, head: string, rows: { name: string; calls: number; cost: number }[]) {
    const words = this.words;
    if (!rows.length) return nothing;
    return html`<table class="ui-rrc__table">
      <caption class="ui-rrc__caption">${caption}</caption>
      <thead>
        <tr>
          <th scope="col" class="ui-rrc__item">${head}</th>
          <th scope="col" class="ui-rrc__n">${words.calls}</th>
          <th scope="col" class="ui-rrc__n ui-rrc__amount">${words.cost}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (r) => html`<tr class="ui-rrc__line">
            <th scope="row" class="ui-rrc__item">${r.name}</th>
            <td class="ui-rrc__n">${this.num(r.calls)}</td>
            <td class="ui-rrc__n ui-rrc__amount">${this.money(r.cost)}</td>
          </tr>`,
        )}
      </tbody>
    </table>`;
  }

  protected override render() {
    const words = this.words;
    const totals = receiptTotals(this);
    const status = TONES[this.status] ? this.status : "succeeded";
    const others = [
      ...(this.lookups ? [{ name: words.lookups, calls: this.lookups.count, cost: this.lookups.cost }] : []),
      ...(this.retries ? [{ name: words.retries, calls: this.retries.count, cost: this.retries.cost }] : []),
    ];
    const lines = this.models.length + this.tools.length + others.length;
    const costliest = this.steps.reduce<RunReceiptStep | null>((best, s) => (!best || s.cost > best.cost ? s : best), null);
    const share = costliest && totals.subtotal > 0 ? Math.round((costliest.cost / totals.subtotal) * 100) : null;
    const when = this.at === null ? null : new Intl.DateTimeFormat(this.locale, { dateStyle: "medium", timeStyle: "short" }).format(this.at);
    const aside = html`<span class="ui-rrc__head-total">${this.money(totals.total)}</span>`;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.agent, id: `${this.uid}-title`, aside }) : nothing}
      <div class="ui-rrc__card">
        <dl class="ui-rrc__meta">
          ${this.runId
            ? html`<div class="ui-rrc__fact ui-rrc__fact--run">
                <dt>${words.run}</dt>
                <dd>
                  <code class="ui-rrc__id">${this.runId}</code>
                  <button type="button" class="ui-rrc__copy" title=${words.copy} @click=${() => void this.copyId()}>${this.copied ? checkIcon : copyIcon}<span class="tc-sr-only">${words.copy}</span></button>
                </dd>
              </div>`
            : nothing}
          ${when ? html`<div class="ui-rrc__fact"><dt>${words.when}</dt><dd><time datetime=${new Date(this.at!).toISOString()}>${when}</time></dd></div>` : nothing}
          ${this.duration !== null ? html`<div class="ui-rrc__fact"><dt>${words.duration}</dt><dd>${this.time(this.duration)}</dd></div>` : nothing}
          <div class="ui-rrc__fact">
            <dt>${words.status}</dt>
            <dd class="ui-rrc__status" data-tone=${TONES[status]}><svg class="ui-rrc__mark" viewBox="0 0 24 24" aria-hidden="true">${statusMarks[status]}</svg>${words[status]}</dd>
          </div>
        </dl>
        <div class="ui-rrc__lines">
          ${lines
            ? html`${this.modelsTable()}${this.simpleTable(words.tools, words.tool, this.tools.map((t) => ({ name: t.tool, calls: t.calls, cost: t.cost })))}${this.simpleTable(words.other, words.other, others)}`
            : html`<p class="ui-rrc__empty">${words.empty}</p>`}
        </div>
        <dl class="ui-rrc__totals">
          <div class="ui-rrc__sum"><dt>${words.subtotal}</dt><dd>${this.money(totals.subtotal)}</dd></div>
          ${totals.savings > 0 ? html`<div class="ui-rrc__sum ui-rrc__sum--savings"><dt>${words.savings}</dt><dd>${this.money(-totals.savings)}</dd></div>` : nothing}
          <div class="ui-rrc__sum ui-rrc__sum--total"><dt>${words.total}</dt><dd>${this.money(totals.total)}</dd></div>
        </dl>
        ${costliest
          ? html`<p class="ui-rrc__costliest">
              <span class="ui-rrc__costliest-label">${words.costliest}</span>
              <span class="ui-rrc__costliest-name">${costliest.name}</span>
              <span class="ui-rrc__costliest-cost">${this.money(costliest.cost)}${share !== null ? html` · ${share}% ${words.ofTotal}` : nothing}</span>
            </p>`
          : nothing}
        <div class="ui-rrc__actions">
          ${this.hideTrace ? nothing : html`<button type="button" class="tc-btn-sm ui-rrc__trace" @click=${() => this.emit<RunReceiptTraceOpen>("tc-trace-open", { runId: this.runId })}>${traceIcon}${words.openTrace}</button>`}
          <button type="button" class="tc-btn-sm ui-rrc__download" @click=${() => this.download()}>${downloadIcon}${words.download}</button>
        </div>
      </div>
      <span class="tc-sr-only" role="status">${this.message}</span>`;
  }

  static override css = /* css */ `
[data-ui="rrc"] {
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
  --tc-rrc-rule: var(--tc-hairline) dashed var(--tc-border-default);
  --tc-rrc-icon: 14px;
}
[data-ui="rrc"] *, [data-ui="rrc"] *::before, [data-ui="rrc"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rrc"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rrc"] .ui-rrc__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rrc"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-rrc__card { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
.ui-rrc__head-total { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-semibold); font-variant-numeric: tabular-nums; }
.ui-rrc__meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: var(--tc-space-2) var(--tc-space-4); margin: 0; padding-bottom: var(--tc-space-3); border-bottom: var(--tc-rrc-rule); }
.ui-rrc__fact { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-rrc__fact dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-rrc__fact dd { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; margin: 0; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rrc__id { overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; }
.ui-rrc__copy {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  color: var(--tc-icon-muted);
  cursor: pointer;
}
.ui-rrc__copy:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-rrc__copy:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rrc"] svg:not(.ui-rrc__mark) { width: var(--tc-rrc-icon); height: var(--tc-rrc-icon); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-rrc__status { font-weight: var(--tc-font-weight-medium); }
.ui-rrc__mark { width: var(--tc-rrc-icon); height: var(--tc-rrc-icon); flex: none; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.ui-rrc__status[data-tone="success"] { color: var(--tc-status-success-fg); }
.ui-rrc__status[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-rrc__status[data-tone="info"] { color: var(--tc-status-info-fg); }
.ui-rrc__status[data-tone="neutral"] { color: var(--tc-text-secondary); }
.ui-rrc__status[data-tone="info"] .ui-rrc__mark { fill: currentColor; }
.ui-rrc__lines { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) 0; border-bottom: var(--tc-rrc-rule); }
.ui-rrc__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rrc__caption { padding-bottom: var(--tc-space-1); color: var(--tc-text-strong); font-weight: var(--tc-font-weight-medium); text-align: left; }
.ui-rrc__table th, .ui-rrc__table td { padding: var(--tc-space-1) 0; font-weight: var(--tc-font-weight-regular); text-align: left; }
.ui-rrc__table thead th { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-rrc__table .ui-rrc__n { padding-left: var(--tc-space-3); text-align: right; white-space: nowrap; }
.ui-rrc__table tbody .ui-rrc__item { overflow-wrap: anywhere; }
.ui-rrc__table tbody td { color: var(--tc-text-secondary); }
.ui-rrc__table tbody .ui-rrc__amount { color: var(--tc-text-primary); }
.ui-rrc__empty { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rrc__totals { display: grid; gap: var(--tc-space-1); margin: 0; padding-top: var(--tc-space-3); font-variant-numeric: tabular-nums; }
.ui-rrc__sum { display: flex; justify-content: space-between; gap: var(--tc-space-3); font-size: var(--tc-font-size-sm); }
.ui-rrc__sum dt { color: var(--tc-text-secondary); }
.ui-rrc__sum dd { margin: 0; }
.ui-rrc__sum--savings dd { color: var(--tc-status-success-fg); }
.ui-rrc__sum--total { margin-top: var(--tc-space-1); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-md); }
.ui-rrc__sum--total dt, .ui-rrc__sum--total dd { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-semibold); }
.ui-rrc__costliest { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); margin: var(--tc-space-3) 0 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-sm); }
.ui-rrc__costliest-label { font-weight: var(--tc-font-weight-medium); }
.ui-rrc__costliest-name { color: var(--tc-text-primary); }
.ui-rrc__costliest-cost { margin-left: auto; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-rrc__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); margin-top: var(--tc-space-3); }
@container (max-width: 420px) {
  .ui-rrc__cached { display: none; }
  .ui-rrc__card { padding: var(--tc-space-3); }
  .ui-rrc__actions { justify-content: stretch; }
  .ui-rrc__actions .tc-btn-sm { flex: 1; }
}
@media (forced-colors: active) {
  .ui-rrc__mark { stroke: CanvasText; }
  .ui-rrc__costliest { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-run-receipt")) customElements.define("tc-run-receipt", TcRunReceipt);
declare global {
  interface HTMLElementTagNameMap {
    "tc-run-receipt": TcRunReceipt;
  }
}
