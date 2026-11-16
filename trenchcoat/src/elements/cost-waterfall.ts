import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { duration as took } from "./internal/format";

/*
 * <tc-cost-waterfall> – where the money and the tokens of one agent run went. Every LLM call, tool call and sub-agent is
 * a step of a waterfall: its bar starts where the steps before it left off and the bars step across to the total, so
 * the long ones are where the money went. Each row says the step's kind, model, tokens, cost and time; the costliest
 * step is in the accent and the total sits under them all.
 *   · Cost / Tokens switches what the bars and the total measure (controllable `measure`)
 *   · By cost puts the most expensive step on top; In order keeps the run's order (controllable `order`)
 *   · a live run appends steps: the bars glide to their new places and the total rolls up to its new figure
 *   · a row (click, Enter or Space) unfolds its details below it – model, tokens in and out, time, what went in and out
 *   · one tab stop for the rows: ↑ ↓ move, Home / End go to the ends
 *   · narrow, the model and time columns are left out (still in the details)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-cost-waterfall .steps=${[{ id: "s1", name: "Draft the summary", kind: "llm", model: "large-1", cost: 0.18 }]}></tc-cost-waterfall>
 */

export type CostStepKind = "llm" | "tool" | "subagent";
export type CostWaterfallMeasure = "cost" | "tokens";
export type CostWaterfallOrder = "cost" | "run";
export type CostStep = {
  id: string;
  name: string;
  kind: CostStepKind;
  /** The model of an LLM call or a sub-agent */
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  /** What the step cost, in the element's currency */
  cost: number;
  /** How long it took, in ms */
  duration?: number;
  /** Still running – its numbers may still grow */
  running?: boolean;
  /** What went in and what came out – short previews for the details */
  input?: string;
  output?: string;
};
export type CostWaterfallMeasureChange = { measure: CostWaterfallMeasure };
export type CostWaterfallOrderChange = { order: CostWaterfallOrder };
export type CostWaterfallOpenChange = { openId: string | null; step?: CostStep };
export type CostWaterfallLabels = Record<CostStepKind, string> &
  Record<"cost" | "tokens" | "measure" | "byCost" | "inOrder" | "order" | "total" | "steps" | "costliest" | "running" | "model" | "tokensIn" | "tokensOut" | "time" | "input" | "output" | "share" | "empty" | "keys", string>;
export const defaultCostWaterfallLabels: CostWaterfallLabels = {
  llm: "LLM call",
  tool: "Tool call",
  subagent: "Sub-agent",
  cost: "Cost",
  tokens: "Tokens",
  measure: "Measure",
  byCost: "By cost",
  inOrder: "In order",
  order: "Order",
  total: "Total",
  steps: "Steps",
  costliest: "Costliest",
  running: "Running",
  model: "Model",
  tokensIn: "Tokens in",
  tokensOut: "Tokens out",
  time: "Time",
  input: "Input",
  output: "Output",
  share: "Share",
  empty: "No steps yet",
  keys: "Up and down arrows move between steps; Enter or Space shows a step's details.",
};

/** A step's tokens, in and out together */
export const stepTokens = (s: CostStep) => (s.tokensIn ?? 0) + (s.tokensOut ?? 0);
/** What a step measures: its cost or its tokens */
export const stepValue = (s: CostStep, measure: CostWaterfallMeasure) => (measure === "tokens" ? stepTokens(s) : Number.isFinite(s.cost) ? Math.max(0, s.cost) : 0);

/** The rows of the waterfall: the steps in the order shown, each with where its bar starts and ends */
export function costWaterfall(steps: CostStep[], measure: CostWaterfallMeasure, order: CostWaterfallOrder) {
  const indexed = steps.map((step, i) => ({ step, i, value: stepValue(step, measure) }));
  if (order === "cost") indexed.sort((a, b) => b.value - a.value || a.i - b.i);
  let at = 0;
  const rows = indexed.map(({ step, value }) => {
    const from = at;
    at += value;
    return { step, value, from, to: at };
  });
  const top = rows.reduce<(typeof rows)[number] | null>((best, r) => (r.value > 0 && (!best || r.value > best.value) ? r : best), null);
  return { rows, total: at, topId: top?.step.id ?? null };
}

/* After Lucide: chart-column-decreasing (ISC licence) */
const headIcon = svg`<path d="M13 17V9"></path><path d="M18 17v-3"></path><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M8 17V5"></path>`;
const chevron = html`<svg class="ui-cwf__chev" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m6 9 6 6 6-6"></path>`}</svg>`;
/* A mark per kind, so the swatch's colour isn't the only cue: a circle for LLM calls, a square for tools, a diamond for sub-agents */
const KIND_MARK: Record<CostStepKind, ReturnType<typeof svg>> = {
  llm: svg`<circle cx="6" cy="6" r="4.5"></circle>`,
  tool: svg`<rect x="1.5" y="1.5" width="9" height="9" rx="1.5"></rect>`,
  subagent: svg`<path d="M6 1 11 6 6 11 1 6Z"></path>`,
};
const ROLL_MS = 420;

let instances = 0;

/**
 * Where the money and tokens of one agent run went, as a waterfall of its steps stepping up to the total.
 * @tag tc-cost-waterfall
 * @fires tc-measure-change - Cost or Tokens was picked ({ measure }: CostWaterfallMeasureChange); cancelable – prevented, `measure` stays as it was
 * @fires tc-order-change - By cost or In order was picked ({ order }: CostWaterfallOrderChange); cancelable – prevented, `order` stays as it was
 * @fires tc-open-change - A step's details opened or closed ({ openId, step }: CostWaterfallOpenChange); cancelable – prevented, `openId` stays as it was
 */
export class TcCostWaterfall extends TcElement {
  static override ui = "cwf";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Cost waterfall";
  /** A line under the heading – the run or the agent */
  @property() accessor subtitle = "";
  /** The run's steps, in the order they ran */
  @property({ attribute: false }) accessor steps: CostStep[] = [];
  /** What the bars measure: "cost" or "tokens" */
  @property() accessor measure: CostWaterfallMeasure = "cost";
  /** "cost" puts the most expensive step on top; "run" keeps the run's order */
  @property() accessor order: CostWaterfallOrder = "cost";
  /** Id of the step whose details are open */
  @property({ attribute: "open-id" }) accessor openId: string | null = null;
  /** ISO 4217 currency code for every amount */
  @property() accessor currency = "USD";
  /** Locale for numbers and amounts */
  @property() accessor locale: string | undefined = undefined;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<CostWaterfallLabels> = {};

  /** @internal The row in the tab order */
  @state() private accessor active: string | null = null;

  private uid = `tc-cwf-${++instances}`;
  private shownTotal: number | null = null;
  private rollFrame = 0;

  private get words() {
    return { ...defaultCostWaterfallLabels, ...this.labels };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.rollFrame);
  }

  /** @internal An amount: a sub-cent one keeps more decimals so it doesn't read as zero */
  private money(n: number) {
    const small = n !== 0 && Math.abs(n) < 0.01;
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, minimumFractionDigits: small ? 4 : 2, maximumFractionDigits: small ? 4 : 2 }).format(n);
    } catch {
      return n.toFixed(small ? 4 : 2);
    }
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(Math.round(n));
  }
  private compact(n: number) {
    return new Intl.NumberFormat(this.locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
  }
  /** @internal A value in the current measure, for bars and totals */
  private fmt(n: number) {
    return this.measure === "tokens" ? `${this.compact(n)} ${this.words.tokens.toLowerCase()}` : this.money(n);
  }

  private setMeasure(measure: CostWaterfallMeasure) {
    if (measure === this.measure) return;
    if (this.emit<CostWaterfallMeasureChange>("tc-measure-change", { measure }, { cancelable: true })) this.measure = measure;
  }
  private setOrder(order: CostWaterfallOrder) {
    if (order === this.order) return;
    if (this.emit<CostWaterfallOrderChange>("tc-order-change", { order }, { cancelable: true })) this.order = order;
  }
  private toggle(step: CostStep) {
    this.active = step.id;
    const openId = this.openId === step.id ? null : step.id;
    if (this.emit<CostWaterfallOpenChange>("tc-open-change", { openId, step: openId ? step : undefined }, { cancelable: true })) this.openId = openId;
  }

  /** Arrow keys inside a two-option radio group pick the other option */
  private onSegKey(e: KeyboardEvent, options: string[], current: string, pick: (v: string) => void) {
    const i = options.indexOf(current);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[(i + step + options.length) % options.length];
    pick(next);
    const group = e.currentTarget as HTMLElement;
    void this.updateComplete.then(() => group.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  }

  private onRowKey(e: KeyboardEvent, ids: string[]) {
    const i = ids.indexOf(this.active ?? "");
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(ids.length - 1, i + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, i - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ids.length - 1;
    else return;
    e.preventDefault();
    this.active = ids[next];
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-cwf__row[data-id="${CSS.escape(ids[next])}"]`)?.focus());
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if ((changed.has("steps") || changed.has("openId")) && this.openId && !this.steps.some((s) => s.id === this.openId)) this.openId = null;
  }

  protected override updated(changed: PropertyValues<this>) {
    const { total } = costWaterfall(this.steps, this.measure, this.order);
    // Lit's own text node, written in place so Lit keeps it
    const host = this.querySelector<HTMLElement>(".ui-cwf__total-value");
    const node = host && [...host.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
    // A new figure in the same measure rolls up from the old one; a switch of measure just shows the new one
    const roll = changed.has("steps") && !changed.has("measure") && this.shownTotal !== null && this.shownTotal !== total && !reducedMotion();
    const from = this.shownTotal ?? total;
    this.shownTotal = total;
    cancelAnimationFrame(this.rollFrame);
    if (!node || !roll) return;
    // Frame times only – no clock read
    let start: number | null = null;
    const tick = (t: number) => {
      start ??= t;
      const p = Math.min(1, (t - start) / ROLL_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      node.nodeValue = this.fmt(from + (total - from) * eased);
      if (p < 1) this.rollFrame = requestAnimationFrame(tick);
    };
    node.nodeValue = this.fmt(from);
    this.rollFrame = requestAnimationFrame(tick);
  }

  private details(step: CostStep, value: number, total: number) {
    const words = this.words;
    const share = total > 0 ? Math.round((value / total) * 100) : 0;
    return html`<div class="ui-cwf__detail" id=${`${this.uid}-detail-${step.id}`} role="region" aria-label=${step.name}>
      <dl class="ui-cwf__facts">
        ${step.model ? html`<div><dt>${words.model}</dt><dd>${step.model}</dd></div>` : nothing}
        <div><dt>${words.cost}</dt><dd>${this.money(step.cost)}</dd></div>
        <div><dt>${words.tokensIn}</dt><dd>${this.num(step.tokensIn ?? 0)}</dd></div>
        <div><dt>${words.tokensOut}</dt><dd>${this.num(step.tokensOut ?? 0)}</dd></div>
        ${step.duration !== undefined ? html`<div><dt>${words.time}</dt><dd>${took(step.duration)}</dd></div>` : nothing}
        <div><dt>${words.share}</dt><dd>${share}%</dd></div>
      </dl>
      ${step.input ? html`<p class="ui-cwf__io"><span class="ui-cwf__io-label">${words.input}</span>${step.input}</p>` : nothing}
      ${step.output ? html`<p class="ui-cwf__io"><span class="ui-cwf__io-label">${words.output}</span>${step.output}</p>` : nothing}
    </div>`;
  }

  protected override render() {
    const words = this.words;
    const measure: CostWaterfallMeasure = this.measure === "tokens" ? "tokens" : "cost";
    const order: CostWaterfallOrder = this.order === "run" ? "run" : "cost";
    const { rows, total, topId } = costWaterfall(this.steps, measure, order);
    const ids = rows.map((r) => r.step.id);
    const active = this.active && ids.includes(this.active) ? this.active : (ids[0] ?? null);
    const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100_000) / 1000 : 0);
    const seg = (label: string, options: [string, string][], current: string, pick: (v: string) => void) =>
      html`<div class="ui-cwf__seg" role="radiogroup" aria-label=${label} @keydown=${(e: KeyboardEvent) => this.onSegKey(e, options.map(([v]) => v), current, pick)}>
        ${options.map(
          ([v, text]) =>
            html`<button type="button" role="radio" class="ui-cwf__seg-opt" aria-checked=${v === current ? "true" : "false"} tabindex=${v === current ? 0 : -1} @click=${() => pick(v)}>${text}</button>`,
        )}
      </div>`;
    const aside = html`<span class="ui-cwf__head-total">${this.fmt(total)}</span>`;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.subtitle, id: `${this.uid}-title`, aside }) : nothing}
      <div class="ui-cwf__card">
        <div class="ui-cwf__bar">
          ${seg(words.measure, [["cost", words.cost], ["tokens", words.tokens]], measure, (v) => this.setMeasure(v as CostWaterfallMeasure))}
          ${seg(words.order, [["cost", words.byCost], ["run", words.inOrder]], order, (v) => this.setOrder(v as CostWaterfallOrder))}
        </div>
        ${rows.length
          ? html`<ul class="ui-cwf__rows" aria-label=${words.steps} aria-describedby=${`${this.uid}-keys`} @keydown=${(e: KeyboardEvent) => this.onRowKey(e, ids)}>
              ${rows.map(({ step, value, from, to }) => {
                const open = this.openId === step.id;
                const kind = KIND_MARK[step.kind] ? step.kind : "llm";
                const top = step.id === topId;
                return html`<li class="ui-cwf__item" data-kind=${kind} ?data-top=${top} ?data-open=${open}>
                  <button
                    type="button"
                    class="ui-cwf__row"
                    data-id=${step.id}
                    tabindex=${step.id === active ? 0 : -1}
                    aria-expanded=${open ? "true" : "false"}
                    aria-controls=${`${this.uid}-detail-${step.id}`}
                    @click=${() => this.toggle(step)}
                    @focus=${() => (this.active = step.id)}
                  >
                    <span class="ui-cwf__name">
                      <svg class="ui-cwf__mark" viewBox="0 0 12 12" aria-hidden="true">${KIND_MARK[kind]}</svg>
                      <span class="ui-cwf__title">${step.name}</span>
                      <span class="ui-cwf__kind">${words[kind]}${step.running ? html` · <span class="ui-cwf__running">${words.running}</span>` : nothing}${top ? html` · <span class="ui-cwf__top-word">${words.costliest}</span>` : nothing}</span>
                    </span>
                    <span class="ui-cwf__model">${step.model ?? ""}</span>
                    <span class="ui-cwf__track" aria-hidden="true">
                      <span class="ui-cwf__step" style=${styleMap({ "--tc-cwf-from": `${pct(from)}%`, "--tc-cwf-to": `${pct(to)}%` })}></span>
                    </span>
                    <span class="ui-cwf__value">${measure === "tokens" ? this.compact(value) : this.money(value)}</span>
                    <span class="ui-cwf__time">${step.duration !== undefined ? took(step.duration) : ""}</span>
                    ${chevron}
                  </button>
                  ${open ? this.details(step, value, total) : html`<div id=${`${this.uid}-detail-${step.id}`} hidden></div>`}
                </li>`;
              })}
              <li class="ui-cwf__item ui-cwf__item--total">
                <div class="ui-cwf__row ui-cwf__row--total">
                  <span class="ui-cwf__name"><span class="ui-cwf__title">${words.total}</span><span class="ui-cwf__kind">${rows.length} ${words.steps.toLowerCase()}</span></span>
                  <span class="ui-cwf__model"></span>
                  <span class="ui-cwf__track" aria-hidden="true"><span class="ui-cwf__step ui-cwf__step--total" style=${styleMap({ "--tc-cwf-from": "0%", "--tc-cwf-to": total > 0 ? "100%" : "0%" })}></span></span>
                  <span class="ui-cwf__value ui-cwf__total-value">${this.fmt(total)}</span>
                  <span class="ui-cwf__time">${(() => {
                    const ms = this.steps.reduce((n, s) => n + (s.duration ?? 0), 0);
                    return ms ? took(ms) : "";
                  })()}</span>
                  <span class="ui-cwf__chev-space"></span>
                </div>
              </li>
            </ul>
            <span class="tc-sr-only" id=${`${this.uid}-keys`}>${words.keys}</span>`
          : html`<p class="ui-cwf__empty">${words.empty}</p>`}
      </div>`;
  }

  static override css = /* css */ `
[data-ui="cwf"] {
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
  --tc-cwf-bar-h: 10px;
  --tc-cwf-mark: 10px;
  --tc-cwf-llm: var(--tc-chart-1);
  --tc-cwf-tool: var(--tc-chart-2);
  --tc-cwf-subagent: var(--tc-chart-3);
  --tc-cwf-quiet: light-dark(color-mix(in oklab, var(--tc-text-muted) 38%, transparent), color-mix(in oklab, var(--tc-text-muted) 55%, transparent));
  --tc-cwf-columns: minmax(0, 1.5fr) minmax(0, 0.8fr) minmax(0, 2fr) 5.5rem 3.5rem 1rem;
}
[data-ui="cwf"] *, [data-ui="cwf"] *::before, [data-ui="cwf"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cwf"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cwf"] .ui-cwf__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cwf"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-cwf__card { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3); }
.ui-cwf__head-total { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-semibold); font-variant-numeric: tabular-nums; }
.ui-cwf__bar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--tc-space-2); padding: 0 var(--tc-space-1) var(--tc-space-2); }
.ui-cwf__seg { display: inline-flex; flex: none; gap: var(--tc-space-0-5); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-cwf__seg-opt {
  display: inline-flex;
  align-items: center;
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-space-2-5);
  border: 0;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  background: none;
  color: var(--tc-text-muted);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  cursor: pointer;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-cwf__seg-opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); color: var(--tc-text-primary); box-shadow: var(--tc-seg-thumb-shadow); }
.ui-cwf__seg-opt:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-cwf__rows { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-cwf__item { display: grid; min-width: 0; }
.ui-cwf__row {
  display: grid;
  grid-template-columns: var(--tc-cwf-columns);
  align-items: center;
  gap: var(--tc-space-2);
  width: 100%;
  min-height: var(--tc-control-h-md);
  margin: 0;
  padding: var(--tc-space-1) var(--tc-space-1);
  border: 0;
  border-radius: var(--tc-radius-md);
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--tc-font-size-sm);
  text-align: left;
  cursor: pointer;
}
button.ui-cwf__row:hover { background: var(--tc-fill-hover); }
.ui-cwf__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-cwf__row--total { cursor: default; margin-top: var(--tc-space-1); border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0; padding-top: var(--tc-space-2); }
.ui-cwf__name { display: grid; grid-template-columns: var(--tc-cwf-mark) minmax(0, 1fr); column-gap: var(--tc-space-1-5); align-items: center; min-width: 0; }
.ui-cwf__mark { width: var(--tc-cwf-mark); height: var(--tc-cwf-mark); fill: var(--tc-cwf-ink); }
.ui-cwf__title { overflow: hidden; color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-cwf__kind { grid-column: 2; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-cwf__row--total .ui-cwf__name { grid-template-columns: minmax(0, 1fr); }
.ui-cwf__row--total .ui-cwf__kind { grid-column: 1; }
.ui-cwf__row--total .ui-cwf__title { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-semibold); }
.ui-cwf__running { color: var(--tc-status-info-fg); }
.ui-cwf__top-word { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
.ui-cwf__model { overflow: hidden; color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-cwf__track { position: relative; height: var(--tc-cwf-bar-h); }
.ui-cwf__step {
  position: absolute;
  inset-block: 0;
  inset-inline-start: var(--tc-cwf-from);
  width: max(2px, calc(var(--tc-cwf-to) - var(--tc-cwf-from)));
  border-radius: var(--tc-radius-xs);
  background: var(--tc-cwf-quiet);
  transition: inset-inline-start var(--tc-duration-slow) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-standard);
}
/* A dashed riser from each bar's end down to where the next one starts */
.ui-cwf__item:not(.ui-cwf__item--total) .ui-cwf__step::after {
  content: "";
  position: absolute;
  top: 100%;
  right: 0;
  height: calc(var(--tc-control-h-md) - var(--tc-cwf-bar-h));
  border-right: var(--tc-hairline) dashed var(--tc-border-strong);
}
.ui-cwf__item[data-open] .ui-cwf__step::after { display: none; }
.ui-cwf__item[data-kind="llm"] { --tc-cwf-ink: var(--tc-cwf-llm); }
.ui-cwf__item[data-kind="tool"] { --tc-cwf-ink: var(--tc-cwf-tool); }
.ui-cwf__item[data-kind="subagent"] { --tc-cwf-ink: var(--tc-cwf-subagent); }
.ui-cwf__item[data-top] .ui-cwf__step { background: var(--tc-accent); }
.ui-cwf__step--total { background: var(--tc-text-strong); }
.ui-cwf__value { color: var(--tc-text-primary); font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.ui-cwf__item[data-top] .ui-cwf__value, .ui-cwf__row--total .ui-cwf__value { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-semibold); }
.ui-cwf__time { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.ui-cwf__chev { width: var(--tc-space-4); height: var(--tc-space-4); fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-base) var(--tc-ease-standard); }
.ui-cwf__item[data-open] .ui-cwf__chev { transform: rotate(180deg); }
.ui-cwf__detail { margin: 0 var(--tc-space-1) var(--tc-space-2) calc(var(--tc-cwf-mark) + var(--tc-space-2-5)); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); font-size: var(--tc-font-size-sm); }
.ui-cwf__facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr)); gap: var(--tc-space-1) var(--tc-space-3); margin: 0; }
.ui-cwf__facts div { display: grid; min-width: 0; }
.ui-cwf__facts dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-cwf__facts dd { margin: 0; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.ui-cwf__io { margin: var(--tc-space-2) 0 0; color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-cwf__io-label { display: block; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-cwf__empty { margin: 0; padding: var(--tc-space-4) var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
@container (max-width: 520px) {
  [data-ui="cwf"] { --tc-cwf-columns: minmax(0, 1.4fr) minmax(0, 1.4fr) 5rem 1rem; }
  .ui-cwf__model, .ui-cwf__time { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-cwf__step, .ui-cwf__seg-opt, .ui-cwf__chev { transition: none; }
}
@media (forced-colors: active) {
  .ui-cwf__step { background: GrayText; }
  .ui-cwf__item[data-top] .ui-cwf__step, .ui-cwf__step--total { background: Highlight; }
  .ui-cwf__mark { fill: CanvasText; }
}
`;
}

if (!customElements.get("tc-cost-waterfall")) customElements.define("tc-cost-waterfall", TcCostWaterfall);
declare global {
  interface HTMLElementTagNameMap {
    "tc-cost-waterfall": TcCostWaterfall;
  }
}
