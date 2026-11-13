import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-run-estimate> – what a bulk run will cost before it starts: so many rows times so many AI columns is so many
 * cells, each with its tokens in and out and, for columns that search the web, its lookups. The card says it in words
 * and numbers – the cost as a range (low–high, since replies vary in length), the tokens, the lookups and how long
 * it should take at the run's concurrency – with a table of where the money goes, the budget left with a warning
 * when the run could go over it, and two ways to be careful: run on a sample of rows first, and cap the spend.
 * Start fires a cancelable `tc-start` with what was chosen; the app starts the run.
 * Standard: the header on a gray tray above a white card, Start on the tray below. Clean: one white card.
 *
 *   <tc-run-estimate rows="2000" .columns=${[{ id: "tier", name: "Risk tier" }, { id: "site", name: "Website", lookups: 2 }]}
 *     .model=${{ name: "Analyst model", inputPrice: 3, outputPrice: 15 }} lookup-price="0.005" budget="40"></tc-run-estimate>
 *
 * `sample` and `cap` change on their own; preventDefault() on tc-sample-change or tc-cap-change keeps them. The sums
 * are `estimateRun()`, exported for the page to use too. The element reads no clock.
 */

export type RunEstimateModel = {
  /** What the card calls it: "Analyst model" */
  name: string;
  /** Price per million input tokens, in `currency` */
  inputPrice: number;
  /** Price per million output tokens, in `currency` */
  outputPrice: number;
};

/** One AI column of the run; its averages override the run's */
export type RunEstimateColumn = {
  id: string;
  name: string;
  /** Average input tokens per cell – the prompt with the row filled in, plus anything looked up */
  tokensIn?: number;
  /** Average output tokens per cell */
  tokensOut?: number;
  /** Web lookups per cell */
  lookups?: number;
};

export type RunEstimateInput = {
  rows: number;
  columns: RunEstimateColumn[];
  model: RunEstimateModel;
  /** Average input tokens per cell, for columns that don't give their own (default 600) */
  tokensIn?: number;
  /** Average output tokens per cell (default 150) */
  tokensOut?: number;
  /** Web lookups per cell (default 0) */
  lookups?: number;
  /** Price of one web lookup (default 0) */
  lookupPrice?: number;
  /** Cells worked on at once (default 8) */
  concurrency?: number;
  /** Average seconds one cell takes (default 4) */
  secondsPerCell?: number;
  /** How far the cost may land either side of the estimate, as a share (default 0.25: ±25%) */
  spread?: number;
};

export type RunEstimateResult = {
  rows: number;
  cells: number;
  tokensIn: number;
  tokensOut: number;
  tokens: number;
  lookups: number;
  inputCost: number;
  outputCost: number;
  modelCost: number;
  lookupCost: number;
  /** The expected cost */
  cost: number;
  /** The range the cost should land in */
  low: number;
  high: number;
  /** How long it should take */
  seconds: number;
};

/** The sums behind the card: cells, tokens, lookups, cost and time for a run */
export function estimateRun(input: RunEstimateInput): RunEstimateResult {
  const rows = Math.max(0, Math.floor(input.rows || 0));
  const per = (n: number | undefined, fallback: number) => (Number.isFinite(n) && (n as number) >= 0 ? (n as number) : fallback);
  let tokensIn = 0;
  let tokensOut = 0;
  let lookups = 0;
  for (const c of input.columns) {
    tokensIn += rows * per(c.tokensIn, per(input.tokensIn, 600));
    tokensOut += rows * per(c.tokensOut, per(input.tokensOut, 150));
    lookups += rows * per(c.lookups, per(input.lookups, 0));
  }
  const cells = rows * input.columns.length;
  const inputCost = (tokensIn / 1e6) * per(input.model.inputPrice, 0);
  const outputCost = (tokensOut / 1e6) * per(input.model.outputPrice, 0);
  const lookupCost = lookups * per(input.lookupPrice, 0);
  const modelCost = inputCost + outputCost;
  const cost = modelCost + lookupCost;
  const spread = Math.min(0.95, per(input.spread, 0.25));
  const concurrency = Math.max(1, per(input.concurrency, 8));
  return {
    rows,
    cells,
    tokensIn,
    tokensOut,
    tokens: tokensIn + tokensOut,
    lookups,
    inputCost,
    outputCost,
    modelCost,
    lookupCost,
    cost,
    low: cost * (1 - spread),
    high: cost * (1 + spread),
    seconds: (cells / concurrency) * per(input.secondsPerCell, 4),
  };
}

/** Where the run stands against the budget: room, could go over (the high estimate), or over (even the low one) */
export type RunEstimateBudgetState = "ok" | "warn" | "over";

/** Details of the events */
export type RunEstimateSampleChange = { sample: boolean };
export type RunEstimateCapChange = { cap: number | null };
export type RunEstimateStart = { sample: boolean; cap: number | null; rows: number; estimate: RunEstimateResult };

let instances = 0;

const formats = new Map<string, Intl.NumberFormat>();
const numberFormat = (locale: string, options: Intl.NumberFormatOptions) => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.NumberFormat(locale, options)));
  return f;
};

/** "under a minute", "about 25 min", "about 2 h 10 min" */
export function runTime(seconds: number) {
  if (!(seconds > 0)) return "no time";
  if (seconds < 60) return "under a minute";
  const min = Math.round(seconds / 60);
  if (min < 60) return `about ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `about ${h} h ${m} min` : `about ${h} h`;
}

/* ---------- Icons (Lucide, ISC) ---------- */

// calculator
const calculatorIcon = svg`<rect width="16" height="20" x="4" y="2" rx="2"></rect><line x1="8" x2="16" y1="6" y2="6"></line><line x1="16" x2="16" y1="14" y2="18"></line><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"></path>`;
// triangle-alert
const warnIcon = html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4M12 17h.01"></path>`}</svg>`;
// play
const playIcon = html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`}</svg>`;

/**
 * What a bulk run will cost before it starts – cells, tokens, web lookups, a cost range and the time, where the money
 * goes, the budget left, a sample run and a spend cap.
 * @tag tc-run-estimate
 * @fires tc-sample-change - "Run on a sample first" was switched ({ sample }: RunEstimateSampleChange); cancelable – prevented, `sample` stays as it was
 * @fires tc-cap-change - The spend cap was set or cleared ({ cap }: RunEstimateCapChange); cancelable – prevented, `cap` stays as it was
 * @fires tc-start - Start was pressed ({ sample, cap, rows, estimate }: RunEstimateStart); cancelable – prevented, nothing is announced
 */
export class TcRunEstimate extends TcElement {
  static override ui = "rest";

  /** The heading, and the region's name */
  @property() accessor heading = "Run estimate";
  /** A quiet line under the heading – what the run is */
  @property() accessor description = "";
  /** How many rows the run fills */
  @property({ type: Number }) accessor rows = 0;
  /** The AI columns it fills, each with its own averages if they differ from the run's */
  @property({ attribute: false }) accessor columns: RunEstimateColumn[] = [];
  /** The model and its prices per million tokens */
  @property({ attribute: false }) accessor model: RunEstimateModel | null = null;
  /** Average input tokens per cell */
  @property({ type: Number, attribute: "tokens-in" }) accessor tokensIn = 600;
  /** Average output tokens per cell */
  @property({ type: Number, attribute: "tokens-out" }) accessor tokensOut = 150;
  /** Web lookups per cell, for columns that don't say */
  @property({ type: Number }) accessor lookups = 0;
  /** Price of one web lookup */
  @property({ type: Number, attribute: "lookup-price" }) accessor lookupPrice = 0;
  /** Cells worked on at once */
  @property({ type: Number }) accessor concurrency = 8;
  /** Average seconds one cell takes */
  @property({ type: Number, attribute: "seconds-per-cell" }) accessor secondsPerCell = 4;
  /** How far the cost may land either side of the estimate, as a share (0.25 is ±25%) */
  @property({ type: Number }) accessor spread = 0.25;
  /** The budget left, in `currency`; unset hides the budget */
  @property({ type: Number }) accessor budget: number | null = null;
  /** Run on the first `sampleRows` rows first. Changed by its checkbox unless a tc-sample-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor sample = false;
  /** How many rows the sample run takes */
  @property({ type: Number, attribute: "sample-rows" }) accessor sampleRows = 50;
  /** The spend cap – the run stops when it reaches it; null for none. Changed by its field unless a tc-cap-change listener calls preventDefault() */
  @property({ type: Number }) accessor cap: number | null = null;
  /** Start can't be pressed – while the app is starting the run, say */
  @property({ type: Boolean }) accessor disabled = false;
  /** ISO 4217 currency of every price and amount */
  @property() accessor currency = "USD";
  /** Locale for numbers and money */
  @property() accessor locale = "en-US";

  /** @internal What's typed in the cap field when it can't be used */
  @state() accessor capError = "";
  /** @internal */
  @state() accessor message = "";

  private readonly uid = `tc-rest${++instances}`;
  private lastState: RunEstimateBudgetState | null = null;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  /* ---------- Sums ---------- */

  private input(rows = this.rows): RunEstimateInput | null {
    if (!this.model) return null;
    return {
      rows,
      columns: this.columns,
      model: this.model,
      tokensIn: this.tokensIn,
      tokensOut: this.tokensOut,
      lookups: this.lookups,
      lookupPrice: this.lookupPrice,
      concurrency: this.concurrency,
      secondsPerCell: this.secondsPerCell,
      spread: this.spread,
    };
  }

  /** The whole run's estimate, or null without a model (read-only) */
  get estimate(): RunEstimateResult | null {
    const i = this.input();
    return i ? estimateRun(i) : null;
  }

  /** @internal The rows that run first when `sample` is on */
  private get sampleSize() {
    return Math.max(0, Math.min(Math.floor(this.sampleRows), Math.floor(this.rows)));
  }

  /** @internal What Start runs: the sample when it's on, else the whole run */
  private get toRun(): RunEstimateResult | null {
    const i = this.input(this.sample ? this.sampleSize : this.rows);
    return i ? estimateRun(i) : null;
  }

  /** @internal */
  private budgetState(e: RunEstimateResult | null): RunEstimateBudgetState {
    if (!e || this.budget == null || !Number.isFinite(this.budget)) return "ok";
    return e.low > this.budget ? "over" : e.high > this.budget ? "warn" : "ok";
  }

  /* ---------- Formatting ---------- */

  private money(n: number, rate = false) {
    const digits = rate ? (n < 0.01 ? 4 : n < 1 ? 3 : 2) : 2;
    return numberFormat(this.locale, { style: "currency", currency: this.currency, minimumFractionDigits: 2, maximumFractionDigits: digits }).format(n);
  }

  private count(n: number) {
    return numberFormat(this.locale, { maximumFractionDigits: 0 }).format(n);
  }

  private tokens(n: number) {
    return n < 10_000 ? this.count(n) : numberFormat(this.locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
  }

  private range(e: RunEstimateResult) {
    return e.cost === 0 ? this.money(0) : `${this.money(e.low)} – ${this.money(e.high)}`;
  }

  /** "6,000 cells (2,000 rows × 3 AI columns), about 6.8M tokens and 4,000 web lookups. At 8 at a time it should take about 50 min." */
  private sentence(e: RunEstimateResult) {
    const n = this.columns.length;
    const cells = `${this.count(e.cells)} ${e.cells === 1 ? "cell" : "cells"} (${this.count(e.rows)} ${e.rows === 1 ? "row" : "rows"} × ${n} AI ${n === 1 ? "column" : "columns"})`;
    const lookups = e.lookups ? ` and ${this.count(e.lookups)} web ${e.lookups === 1 ? "lookup" : "lookups"}` : "";
    const at = Math.max(1, this.concurrency);
    return `${cells}, about ${this.tokens(e.tokens)} tokens${lookups}. At ${this.count(at)} at a time it should take ${runTime(e.seconds)}.`;
  }

  /* ---------- Actions ---------- */

  private toggleSample(e: Event) {
    const box = e.currentTarget as HTMLInputElement;
    const sample = box.checked;
    if (!this.emit<RunEstimateSampleChange>("tc-sample-change", { sample }, { cancelable: true })) {
      box.checked = this.sample;
      return;
    }
    this.sample = sample;
  }

  private setCap(e: Event) {
    const field = e.currentTarget as HTMLInputElement;
    const text = field.value.trim();
    if (text === "") {
      this.capError = "";
      this.commitCap(null, field);
      return;
    }
    const cap = Number(text);
    if (!Number.isFinite(cap) || cap <= 0) {
      this.capError = "Enter an amount above zero, or leave it empty for no cap.";
      return;
    }
    this.capError = "";
    this.commitCap(Math.round(cap * 100) / 100, field);
  }

  private commitCap(cap: number | null, field: HTMLInputElement) {
    if (cap === this.cap) return;
    if (!this.emit<RunEstimateCapChange>("tc-cap-change", { cap }, { cancelable: true })) {
      field.value = this.cap == null ? "" : String(this.cap);
      return;
    }
    this.cap = cap;
    this.announce(cap == null ? "No spend cap." : `The run stops at ${this.money(cap)}.`);
  }

  private start() {
    const e = this.toRun;
    if (!e || this.disabled || e.cells === 0 || this.capError) {
      if (this.capError) this.querySelector<HTMLInputElement>(".ui-rest__cap-input")?.focus();
      return;
    }
    const detail: RunEstimateStart = { sample: this.sample, cap: this.cap, rows: e.rows, estimate: e };
    if (!this.emit<RunEstimateStart>("tc-start", detail, { cancelable: true })) return;
    this.announce(this.sample ? `Starting on the first ${this.count(e.rows)} rows.` : "Starting the run.");
  }

  /** A trailing no-break space makes a repeated message count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.dataset.budget = this.budgetState(this.toRun);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    // Going over the budget, or back under it, is said once
    const st = this.budgetState(this.toRun);
    if (this.lastState !== null && st !== this.lastState) {
      this.announce(st === "over" ? "This run is over your remaining budget." : st === "warn" ? "This run could go over your remaining budget." : "This run fits your remaining budget.");
    }
    this.lastState = st;
  }

  /* ---------- Render ---------- */

  private renderBreakdown(e: RunEstimateResult) {
    const m = this.model!;
    const rows: [string, string, string, number][] = [
      ["Input tokens", this.tokens(e.tokensIn), `${this.money(m.inputPrice, true)} per 1M`, e.inputCost],
      ["Output tokens", this.tokens(e.tokensOut), `${this.money(m.outputPrice, true)} per 1M`, e.outputCost],
    ];
    if (e.lookups) rows.push(["Web lookups", this.count(e.lookups), `${this.money(this.lookupPrice, true)} each`, e.lookupCost]);
    return html`<table class="ui-rest__table">
      <caption class="tc-sr-only">Where the cost goes</caption>
      <thead>
        <tr><th scope="col">Item</th><th scope="col">Amount</th><th scope="col">Rate</th><th scope="col">Cost</th></tr>
      </thead>
      <tbody>
        ${rows.map(([label, amount, rate, cost]) => html`<tr><th scope="row">${label}</th><td>${amount}</td><td>${rate}</td><td>${this.money(cost)}</td></tr>`)}
      </tbody>
      <tfoot>
        <tr><th scope="row">Expected</th><td></td><td></td><td>${this.money(e.cost)}</td></tr>
      </tfoot>
    </table>`;
  }

  private renderBudget(run: RunEstimateResult) {
    if (this.budget == null || !Number.isFinite(this.budget)) return nothing;
    const budget = Math.max(0, this.budget);
    const st = this.budgetState(run);
    const pct = (n: number) => (budget > 0 ? Math.min(100, (n / budget) * 100) : 100);
    const what = this.sample ? "The sample" : "This run";
    const status =
      st === "over"
        ? `Over budget – even the low estimate is ${this.money(run.low - budget)} more than what's left`
        : st === "warn"
          ? `Could go over – the high estimate is ${this.money(run.high - budget)} more than what's left`
          : `${what} uses up to ${Math.round(pct(run.high))}% of it`;
    return html`<div class="ui-rest__budget" data-state=${st}>
      <p class="ui-rest__budget-line">
        <span>Budget left <b>${this.money(budget)}</b></span>
        <span class="ui-rest__budget-state">${st !== "ok" ? html`<span class="ui-rest__dot" aria-hidden="true"></span>` : nothing}${status}</span>
      </p>
      <span
        class="ui-rest__track"
        .role=${"meter"}
        aria-label="Budget used by this run"
        aria-valuemin="0"
        aria-valuemax=${budget}
        aria-valuenow=${Math.min(run.high, budget)}
        aria-valuetext=${`${this.range(run)} of ${this.money(budget)} left`}
        ><span class="ui-rest__range" style=${styleMap({ left: `${pct(run.low)}%`, width: `${Math.max(0, pct(run.high) - pct(run.low))}%` })}></span
        ><span class="ui-rest__fill" style=${styleMap({ width: `${pct(run.low)}%` })}></span
      ></span>
    </div>`;
  }

  private renderChoices(run: RunEstimateResult) {
    const sampleSize = this.sampleSize;
    const sample = this.input(sampleSize);
    const s = sample ? estimateRun(sample) : null;
    const capId = `${this.uid}-cap`;
    const capHint = `${this.uid}-cap-hint`;
    const short = this.cap != null && run.high > this.cap;
    const cut = this.cap != null && run.cost > 0 ? Math.max(0, Math.min(100, Math.round((1 - this.cap / run.cost) * 100))) : 0;
    return html`<div class="ui-rest__options">
      ${sampleSize > 0 && sampleSize < this.rows
        ? html`<label class="ui-rest__check">
            <input type="checkbox" class="ui-rest__sample" .checked=${live(this.sample)} @change=${this.toggleSample} aria-describedby=${`${this.uid}-sample-note`} />
            <span>Run on ${this.count(sampleSize)} rows first</span>
          </label>
          <p class="ui-rest__note" id=${`${this.uid}-sample-note`}>${s ? `${this.range(s)}, ${runTime(s.seconds)} – check the answers before the rest` : ""}</p>`
        : nothing}
      <div class="ui-rest__cap">
        <label class="ui-rest__cap-label" for=${capId}>Stop if spend reaches</label>
        <span class="ui-rest__field" ?data-invalid=${!!this.capError}>
          <span class="ui-rest__unit" aria-hidden="true">${this.currency}</span>
          <input
            id=${capId}
            class="ui-rest__cap-input"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            placeholder="No cap"
            .value=${live(this.cap == null ? "" : String(this.cap))}
            aria-invalid=${this.capError ? "true" : "false"}
            aria-describedby=${capHint}
            @change=${this.setCap}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") this.setCap(e);
            }}
          />
        </span>
        <p class="ui-rest__note" id=${capHint} data-tone=${ifDefined(this.capError ? "error" : short ? "warn" : undefined)}>
          ${this.capError ||
          (this.cap == null
            ? "Leave it empty to run to the end."
            : short
              ? `The run may stop before it finishes${cut > 0 ? ` – about ${cut}% of the cells left` : ""}.`
              : "The run should finish well under it.")}
        </p>
      </div>
    </div>`;
  }

  protected override render() {
    const e = this.estimate;
    const run = this.toRun;
    const st = this.budgetState(run);
    const head = cardHead({
      icon: calculatorIcon,
      title: this.heading,
      subtitle: this.description,
      id: `${this.uid}-title`,
      aside: this.model ? html`<span class="ui-rest__pill">${this.model.name}</span>` : nothing,
    });
    if (!e || !run) {
      return html`${head}
        <div class="ui-rest__card"><div class="ui-rest__inner"><p class="ui-rest__empty">Choose a model to see what the run will cost</p></div></div>`;
    }
    const empty = e.cells === 0;
    const blocked = this.disabled || empty;
    const why = this.disabled ? "" : empty ? "There's nothing to run – add rows and an AI column." : "";
    return html`
      ${head}
      <div class="ui-rest__card">
        <div class="ui-rest__inner">
          <div class="ui-rest__figure">
            <p class="ui-rest__amount"><span class="ui-rest__big">${this.range(e)}</span><span class="ui-rest__of">estimated for the whole run</span></p>
          </div>
          <p class="ui-rest__sentence">${empty ? "There's nothing to run yet – no rows or no AI columns." : this.sentence(e)}</p>
          <dl class="ui-rest__stats">
            <div><dt>Cells</dt><dd>${this.count(e.cells)}</dd></div>
            <div><dt>Tokens</dt><dd>${this.tokens(e.tokens)}</dd></div>
            <div><dt>Web lookups</dt><dd>${this.count(e.lookups)}</dd></div>
            <div><dt>Time</dt><dd>${runTime(e.seconds)}</dd></div>
          </dl>
          ${empty ? nothing : this.renderBreakdown(e)} ${this.renderBudget(run)}
          ${st !== "ok"
            ? html`<div class="ui-rest__notice" data-tone=${st}>
                <span class="ui-rest__notice-icon">${warnIcon}</span>
                <p>
                  ${st === "over"
                    ? "Even the low estimate is more than your remaining budget. Run on a sample, set a cap, or fill fewer rows."
                    : "The high estimate is more than your remaining budget. A spend cap stops the run before it goes over."}
                </p>
              </div>`
            : nothing}
          ${this.renderChoices(e)}
        </div>
      </div>
      <div class="ui-rest__foot">
        <span class="ui-rest__foot-text">${this.sample && !empty ? html`First run: <b>${this.range(run)}</b>` : html`Expected <b>${this.money(e.cost)}</b>`}</span>
        <button
          type="button"
          class="ui-rest__start"
          aria-disabled=${blocked ? "true" : "false"}
          aria-describedby=${ifDefined(why ? `${this.uid}-why` : undefined)}
          @click=${this.start}
        >
          ${playIcon}${this.sample && this.sampleSize > 0 && this.sampleSize < this.rows ? `Run on ${this.count(this.sampleSize)} rows` : "Start run"}
        </button>
        ${why ? html`<span class="tc-sr-only" id=${`${this.uid}-why`}>${why}</span>` : nothing}
      </div>
      <p class="tc-sr-only" role="status">${this.message}</p>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rest"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 520px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rest"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 520px;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rest"] *, [data-ui="rest"] *::before, [data-ui="rest"] *::after { box-sizing: border-box; }
[data-ui="rest"] { grid-template-columns: minmax(0, 1fr); }
:where([data-ui="rest"]) :is(p, dl, dd) { margin: 0; padding: 0; }
:where([data-ui="rest"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rest"] :is(button, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rest"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-rest__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-rest__inner { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-rest__inner { display: grid; gap: var(--tc-space-4); padding: 0 var(--tc-space-4) var(--tc-space-4); }
.ui-rest__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-rest__empty { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
/* The cost range, big */
.ui-rest__amount { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: var(--tc-space-2); }
.ui-rest__big { font-weight: var(--tc-font-weight-strong); font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-rest__big { font-size: var(--tc-font-size-3xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-rest__big { font-size: var(--tc-font-size-2xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-strong); }
.ui-rest__of { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rest__sentence { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
/* Four figures in a row */
.ui-rest__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--tc-space-3); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rest__stats dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rest__stats dd { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; white-space: nowrap; text-overflow: ellipsis; }
/* Where the money goes */
.ui-rest__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rest__table th, .ui-rest__table td { padding: var(--tc-space-1-5) 0; text-align: right; white-space: nowrap; }
.ui-rest__table :is(th, td) + :is(th, td) { padding-left: var(--tc-space-3); }
.ui-rest__table th:first-child { text-align: left; }
.ui-rest__table thead th { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rest__table tbody th { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-primary); }
.ui-rest__table td { color: var(--tc-text-secondary); }
.ui-rest__table tfoot :is(th, td) { border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
/* The budget left */
.ui-rest__budget { display: grid; gap: var(--tc-space-2); }
.ui-rest__budget-line { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rest__budget-state { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); }
.ui-rest__budget[data-state="warn"] .ui-rest__budget-state { color: var(--tc-status-warning-fg); }
.ui-rest__budget[data-state="over"] .ui-rest__budget-state { color: var(--tc-status-danger-fg); }
.ui-rest__dot { display: inline-block; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-status-warning-solid); }
.ui-rest__budget[data-state="over"] .ui-rest__dot { background: var(--tc-status-danger-solid); }
.ui-rest__track { position: relative; display: block; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-rest__fill, .ui-rest__range { position: absolute; top: 0; bottom: 0; border-radius: inherit; }
.ui-rest__fill { left: 0; background: var(--tc-meter-fill); }
.ui-rest__range { background: var(--tc-accent-subtle); }
.ui-rest__budget[data-state="warn"] .ui-rest__fill { background: var(--tc-status-warning-solid); }
.ui-rest__budget[data-state="over"] .ui-rest__fill { background: var(--tc-status-danger-solid); }
/* The note when the run could go over */
.ui-rest__notice { display: flex; gap: var(--tc-space-2-5); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rest__notice[data-tone="over"] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); }
.ui-rest__notice-icon { flex: none; width: 16px; height: 16px; color: var(--tc-status-warning-fg); }
.ui-rest__notice[data-tone="over"] .ui-rest__notice-icon { color: var(--tc-status-danger-fg); }
[data-ui="rest"] svg { display: block; width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
/* Sample and cap */
.ui-rest__options { display: grid; gap: var(--tc-space-3); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rest__check { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-rest__check input { flex: none; width: 16px; height: 16px; margin: 0; accent-color: var(--tc-accent); }
.ui-rest__check + .ui-rest__note { margin-top: calc(var(--tc-space-2) * -1); padding-left: var(--tc-space-6); }
.ui-rest__note { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
.ui-rest__note[data-tone="warn"] { color: var(--tc-status-warning-fg); }
.ui-rest__note[data-tone="error"] { color: var(--tc-status-danger-fg); }
.ui-rest__cap { display: grid; grid-template-columns: auto minmax(0, 160px); align-items: center; gap: var(--tc-space-1-5) var(--tc-space-3); }
.ui-rest__cap .ui-rest__note { grid-column: 1 / -1; }
.ui-rest__cap-label { color: var(--tc-text-primary); }
.ui-rest__field { display: flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-field-h-sm); padding: 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); }
.ui-rest__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-rest__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-rest__field[data-invalid] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-rest__unit { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rest__cap-input { flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-field-font-size); font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
.ui-rest__cap-input:focus-visible { outline: none; }
.ui-rest__cap-input::placeholder { color: var(--tc-text-muted); }
/* Standard: the tray below the card · Clean: the last row of the card */
.ui-rest__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-rest__foot { padding: var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-rest__foot { padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rest__start { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-rest__start:hover { background: var(--tc-action-primary-bg-hover); }
.ui-rest__start:active { transform: scale(0.97); }
.ui-rest__start[aria-disabled="true"] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-muted); cursor: not-allowed; transform: none; }
.ui-rest__start svg { width: 14px; height: 14px; }
/* Narrow: two figures a row, the cap field full width */
@container (max-width: 420px) {
  .ui-rest__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-rest__cap { grid-template-columns: minmax(0, 1fr); }
  :where([data-look="standard"], [data-look="standard"] *).ui-rest__inner { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rest__inner { padding: 0 var(--tc-space-3-5) var(--tc-space-3-5); }
}
@media (hover: none) and (pointer: coarse) {
  .ui-rest__start { height: var(--tc-control-h-lg); }
}
@media (forced-colors: active) {
  .ui-rest__fill, .ui-rest__dot { background: CanvasText; }
  .ui-rest__range { background: GrayText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rest"] *, [data-ui="rest"] *::before, [data-ui="rest"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-run-estimate")) customElements.define("tc-run-estimate", TcRunEstimate);

declare global {
  interface HTMLElementTagNameMap {
    "tc-run-estimate": TcRunEstimate;
  }
}
