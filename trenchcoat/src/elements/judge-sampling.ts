import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-judge-sampling> – how much of an agent's live traffic an LLM judge reads, and what that costs. Each traffic
 * segment (Web chat, Intranet widget …) has a sampling rate on a stepped slider from 0.1% to 100%, with how many chats
 * a day that judges. Rules that always include a chat – a thumbs-down, an escalation, a new prompt version – are
 * switches. The judge model is a select with its price per chat. Under them, live estimates: chats judged a day, the
 * monthly cost, and what the sample can see, in words ("Enough to see a 0.2 drop within a day"). A monthly budget
 * cap warns, in words and a mark, when the estimate goes over it.
 *   · `value` is controllable: every change fires a cancelable tc-value-change with the whole value and the field
 *   · the estimates are worked out by `judgeEstimate()`, exported for the page to reuse
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-judge-sampling .segments=${[{ id: "web", label: "Web chat", chatsPerDay: 12000 }]} .models=${[{ id: "small", label: "Small judge", costPerChat: 0.002 }]}
 *     .value=${{ rates: { web: 0.05 }, include: {}, model: "small", budget: 500 }}></tc-judge-sampling>
 */

/** A gavel: Lucide "gavel" (ISC, lucide.dev) */
const gavelIcon = svg`<path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8"></path><path d="m16 16 6-6"></path><path d="m8 8 6-6"></path><path d="m9 7 8 8"></path><path d="m21 11-8-8"></path>`;

export type JudgeSegment = {
  id: string;
  label: string;
  /** Chats a day in this segment */
  chatsPerDay: number;
};
export type JudgeIncludeRule = {
  id: string;
  label: string;
  /** One line on what it catches */
  description?: string;
  /** Chats a day it matches – added on top of the sample */
  chatsPerDay: number;
};
export type JudgeModel = {
  id: string;
  label: string;
  /** What judging one chat costs, in `currency` */
  costPerChat: number;
};
export type JudgeSamplingValue = {
  /** The share of each segment judged, 0–1, by segment id */
  rates: Record<string, number>;
  /** Which always-include rules are on, by rule id */
  include: Record<string, boolean>;
  /** The judge model's id */
  model: string;
  /** The monthly budget cap, in `currency`; unset or 0 for none */
  budget?: number;
};
export type JudgeSamplingChange = { value: JudgeSamplingValue; field: string };
export type JudgeEstimate = {
  /** Chats judged a day, sample and always-included together */
  perDay: number;
  /** The cost of 30 days, in the models' currency */
  monthlyCost: number;
  /** The smallest drop in the average score one day's sample can see */
  dailyDrop: number;
  /** How long until the sample can see a drop of `detect`: "day", "3 days", "week", "month", or "" when it can't */
  within: "day" | "3 days" | "week" | "month" | "";
  /** Over the budget cap */
  overBudget: boolean;
};

/** The slider's stops, from 0.1% to 100% – roughly even steps on a log scale */
export const JUDGE_RATES = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1] as const;

/** The stop nearest a rate */
export function judgeRateStop(rate: number) {
  let best = 0;
  for (let i = 1; i < JUDGE_RATES.length; i++) if (Math.abs(Math.log(JUDGE_RATES[i]) - Math.log(rate)) < Math.abs(Math.log(JUDGE_RATES[best]) - Math.log(rate))) best = i;
  return best;
}

/**
 * The estimates for a value. The sample's power to see a drop: with judge scores spread by `scoreSd`, n judged chats
 * see a drop in the average of about 2.8 × sd / √n (80% power, 5% significance, against a well-known baseline).
 */
export function judgeEstimate(
  value: JudgeSamplingValue,
  options: { segments: JudgeSegment[]; includeRules?: JudgeIncludeRule[]; models: JudgeModel[]; scoreSd?: number; detect?: number },
): JudgeEstimate {
  const sd = options.scoreSd ?? 1;
  const detect = options.detect ?? 0.2;
  const traffic = options.segments.reduce((s, g) => s + Math.max(0, g.chatsPerDay || 0), 0);
  const sampled = options.segments.reduce((s, g) => s + Math.max(0, g.chatsPerDay || 0) * clampRate(value.rates[g.id] ?? 0), 0);
  // Always-included chats that the sample didn't already catch
  const share = traffic > 0 ? sampled / traffic : 0;
  const extra = (options.includeRules ?? []).reduce((s, r) => s + (value.include[r.id] ? Math.max(0, r.chatsPerDay || 0) * (1 - share) : 0), 0);
  const perDay = sampled + extra;
  const model = options.models.find((m) => m.id === value.model);
  const monthlyCost = perDay * 30 * (model?.costPerChat ?? 0);
  const drop = (n: number) => (n > 0 ? (2.8 * sd) / Math.sqrt(n) : Infinity);
  const periods: [JudgeEstimate["within"], number][] = [
    ["day", 1],
    ["3 days", 3],
    ["week", 7],
    ["month", 30],
  ];
  const within = periods.find(([, days]) => drop(perDay * days) <= detect)?.[0] ?? "";
  const budget = value.budget ?? 0;
  return { perDay, monthlyCost, dailyDrop: drop(perDay), within, overBudget: budget > 0 && monthlyCost > budget };
}
function clampRate(r: number) {
  return Number.isFinite(r) ? Math.min(1, Math.max(0, r)) : 0;
}

let uidCount = 0;

/**
 * How much of an agent's traffic an LLM judge reads, and what it costs – a sampling rate per segment, rules that
 * always include a chat, the judge model, and live estimates of chats judged, monthly cost and what the sample can
 * see, with a budget cap that warns.
 * @tag tc-judge-sampling
 * @fires tc-value-change - A rate, rule, model or the budget changed ({ value, field }: JudgeSamplingChange); cancelable – prevented, `value` stays as it was
 */
export class TcJudgeSampling extends TcElement {
  static override ui = "jsm";

  /** The heading */
  @property() accessor heading = "Judge sampling";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The traffic segments, each with its chats a day */
  @property({ attribute: false }) accessor segments: JudgeSegment[] = [];
  /** Rules that always include a chat, whatever the rate */
  @property({ attribute: false }) accessor includeRules: JudgeIncludeRule[] = [];
  /** The judge models to choose from, with a price per chat */
  @property({ attribute: false }) accessor models: JudgeModel[] = [];
  /** The settings. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: JudgeSamplingValue = { rates: {}, include: {}, model: "" };
  /** The currency for prices and the budget, e.g. "USD" */
  @property() accessor currency = "USD";
  /** How spread out the judge's scores are (their standard deviation), for what the sample can see */
  @property({ type: Number, attribute: "score-sd" }) accessor scoreSd = 1;
  /** The drop in the average score worth seeing, e.g. 0.2 on a 1–5 scale */
  @property({ type: Number }) accessor detect = 0.2;
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor status = "";
  @state() private accessor budgetText: string | null = null;

  private uid = `tc-jsm-${++uidCount}`;
  private wasOver = false;

  private estimate(value = this.value) {
    return judgeEstimate(value, { segments: this.segments, includeRules: this.includeRules, models: this.models, scoreSd: this.scoreSd, detect: this.detect });
  }
  private num(n: number, digits = 0) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: digits }).format(n);
  }
  private money(n: number, small = false) {
    return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, maximumFractionDigits: small ? 4 : n < 100 ? 2 : 0, minimumFractionDigits: small ? 2 : 0 }).format(n);
  }
  private pct(rate: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: rate < 0.01 ? 1 : 0 }).format(rate);
  }

  private set(next: JudgeSamplingValue, field: string) {
    if (!this.emit<JudgeSamplingChange>("tc-value-change", { value: next, field }, { cancelable: true })) return false;
    this.value = next;
    return true;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // Going over the budget, or back under it, is said once
    const over = this.estimate().overBudget;
    if (this.hasUpdated && over !== this.wasOver) this.status = over ? `Over budget: ${this.money(this.estimate().monthlyCost)} a month` : "Back within budget";
    this.wasOver = over;
  }

  /* ---------- Rendering ---------- */

  private confidence(e: JudgeEstimate) {
    const d = this.num(this.detect, 2);
    if (!e.perDay) return "Nothing is judged, so drops won't be seen.";
    if (!e.within) return `Too few to see a ${d} drop within a month – raise a rate.`;
    return `Enough to see a ${d} drop within ${e.within === "day" ? "a day" : e.within === "week" ? "a week" : e.within === "month" ? "a month" : e.within}.`;
  }

  private renderSegment(seg: JudgeSegment) {
    const id = `${this.uid}-seg-${seg.id}`;
    const rate = clampRate(this.value.rates[seg.id] ?? 0);
    const stop = judgeRateStop(rate || JUDGE_RATES[0]);
    const judged = Math.max(0, seg.chatsPerDay || 0) * rate;
    return html`<li class="ui-jsm__seg" data-segment=${seg.id}>
      <div class="ui-jsm__seg-top">
        <label class="ui-jsm__seg-name" for=${id}>${seg.label}</label>
        <span class="ui-jsm__seg-rate" aria-hidden="true">${this.pct(rate)}</span>
      </div>
      <input
        id=${id}
        class="ui-jsm__range"
        type="range"
        min="0"
        max=${JUDGE_RATES.length - 1}
        step="1"
        .value=${live(String(stop))}
        aria-valuetext=${`${this.pct(JUDGE_RATES[stop])}, about ${this.num(judged)} chats a day`}
        aria-describedby=${`${id}-facts`}
        @input=${(e: Event) => {
          const next = JUDGE_RATES[Number((e.target as HTMLInputElement).value)] ?? rate;
          if (!this.set({ ...this.value, rates: { ...this.value.rates, [seg.id]: next } }, `rates.${seg.id}`)) (e.target as HTMLInputElement).value = String(stop);
        }}
      />
      <p class="ui-jsm__seg-facts" id=${`${id}-facts`}>${this.num(seg.chatsPerDay)} chats a day · about ${this.num(judged)} judged</p>
    </li>`;
  }

  private renderRule(rule: JudgeIncludeRule) {
    const id = `${this.uid}-rule-${rule.id}`;
    const on = !!this.value.include[rule.id];
    return html`<li class="ui-jsm__rule">
      <input
        id=${id}
        class="ui-jsm__switch"
        type="checkbox"
        role="switch"
        .checked=${live(on)}
        aria-describedby=${`${id}-desc`}
        @change=${(e: Event) => {
          const input = e.target as HTMLInputElement;
          if (!this.set({ ...this.value, include: { ...this.value.include, [rule.id]: input.checked } }, `include.${rule.id}`)) input.checked = on;
        }}
      />
      <span class="ui-jsm__rule-text">
        <label for=${id} class="ui-jsm__rule-name">${rule.label}</label>
        <span class="ui-jsm__rule-desc" id=${`${id}-desc`}>${[rule.description, `about ${this.num(rule.chatsPerDay)} a day`].filter(Boolean).join(" · ")}</span>
      </span>
    </li>`;
  }

  private onBudget(input: HTMLInputElement) {
    const text = input.value.trim();
    const n = text === "" ? 0 : input.valueAsNumber;
    if (!Number.isFinite(n) || n < 0) {
      this.budgetText = input.value;
      return;
    }
    this.budgetText = null;
    if (!this.set({ ...this.value, budget: n }, "budget")) input.value = String(this.value.budget ?? "");
  }

  protected override render() {
    const id = this.uid;
    const e = this.estimate();
    const budget = this.value.budget ?? 0;
    const model = this.models.find((m) => m.id === this.value.model);
    const badBudget = this.budgetText !== null;
    return html`
      <span class="ui-jsm__sr" role="status">${this.status}</span>
      ${cardHead({
        icon: gavelIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: html`<span class="ui-jsm__aside">${this.money(e.monthlyCost)} a month</span>`,
      })}
      <div class="ui-jsm__card">
        <div class="ui-jsm__body">
          <section class="ui-jsm__section" aria-labelledby=${`${id}-rates`}>
            <h4 class="ui-jsm__label" id=${`${id}-rates`}>Sampling rate</h4>
            ${this.segments.length ? html`<ul class="ui-jsm__segs">${this.segments.map((s) => this.renderSegment(s))}</ul>` : html`<p class="ui-jsm__none">No traffic segments.</p>`}
          </section>
          ${this.includeRules.length
            ? html`<section class="ui-jsm__section" aria-labelledby=${`${id}-always`}>
                <h4 class="ui-jsm__label" id=${`${id}-always`}>Always include</h4>
                <ul class="ui-jsm__rules">${this.includeRules.map((r) => this.renderRule(r))}</ul>
              </section>`
            : nothing}
          <div class="ui-jsm__row">
            <span class="ui-jsm__field">
              <label class="ui-jsm__label" for=${`${id}-model`}>Judge model</label>
              <span class="ui-jsm__select-wrap">
                <select
                  id=${`${id}-model`}
                  class="ui-jsm__select"
                  @change=${(ev: Event) => {
                    const sel = ev.target as HTMLSelectElement;
                    if (!this.set({ ...this.value, model: sel.value }, "model")) sel.value = this.value.model;
                  }}
                >
                  ${model ? nothing : html`<option value="" .selected=${true} disabled>Choose…</option>`}
                  ${this.models.map((m) => html`<option value=${m.id} .selected=${live(m.id === this.value.model)}>${m.label} · ${this.money(m.costPerChat, true)} a chat</option>`)}
                </select>
                <svg class="ui-jsm__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
              </span>
            </span>
            <span class="ui-jsm__field">
              <label class="ui-jsm__label" for=${`${id}-budget`}>Monthly budget (${this.currency})</label>
              <input
                id=${`${id}-budget`}
                class="ui-jsm__number"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                placeholder="No cap"
                .value=${live(badBudget ? this.budgetText! : budget ? String(budget) : "")}
                aria-invalid=${badBudget ? "true" : "false"}
                aria-describedby=${`${id}-budget-help`}
                @change=${(ev: Event) => this.onBudget(ev.target as HTMLInputElement)}
              />
              <span class="ui-jsm__help" id=${`${id}-budget-help`}>${badBudget ? "Enter an amount of 0 or more, or leave it empty for no cap." : "Leave empty for no cap."}</span>
            </span>
          </div>
        </div>
        <dl class="ui-jsm__estimates" aria-label="Estimates">
          <div class="ui-jsm__stat"><dt>Judged a day</dt><dd data-stat="per-day">${this.num(e.perDay)}</dd></div>
          <div class="ui-jsm__stat" ?data-over=${e.overBudget}><dt>A month</dt><dd data-stat="cost">${this.money(e.monthlyCost)}</dd></div>
          <div class="ui-jsm__stat ui-jsm__stat--wide"><dt>What it can see</dt><dd data-stat="confidence" ?data-weak=${!e.within}>${this.confidence(e)}</dd></div>
        </dl>
        ${e.overBudget
          ? html`<p class="ui-jsm__warning" data-warning>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
              <span><strong>Over budget.</strong> The estimate is ${this.money(e.monthlyCost)} a month, ${this.money(e.monthlyCost - budget)} over the ${this.money(budget)} cap. Lower a rate, turn off a rule or choose a cheaper judge.</span>
            </p>`
          : nothing}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="jsm"] {
  position: relative; box-sizing: border-box; width: 100%; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); text-align: left; -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="jsm"] {
  position: relative; box-sizing: border-box; width: 100%; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="jsm"] { --tc-jsm-number-w: 12ch; --tc-jsm-thumb: 16px; --tc-jsm-track-h: 4px; }
[data-ui="jsm"] *, [data-ui="jsm"] *::before, [data-ui="jsm"] *::after { box-sizing: border-box; }
[data-ui="jsm"] :is(p, h4, dl, dd) { margin: 0; }
[data-ui="jsm"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="jsm"] svg { display: block; flex: none; }
[data-ui="jsm"] :is(select, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-jsm__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-jsm__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-jsm__aside { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-jsm__body { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
.ui-jsm__section { display: grid; gap: var(--tc-space-2); }
.ui-jsm__label { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
/* ----- Segments ----- */
.ui-jsm__segs { display: grid; gap: var(--tc-space-3); }
.ui-jsm__seg { display: grid; gap: var(--tc-space-1); }
.ui-jsm__seg-top { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); }
.ui-jsm__seg-name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-jsm__seg-rate { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-jsm__seg-facts { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-jsm__range { width: 100%; height: var(--tc-control-h-sm); margin: 0; background: transparent; accent-color: var(--tc-accent-solid); cursor: pointer; appearance: none; -webkit-appearance: none; }
.ui-jsm__range::-webkit-slider-runnable-track { height: var(--tc-jsm-track-h); border-radius: var(--tc-radius-full); background: var(--tc-meter-track); }
.ui-jsm__range::-moz-range-track { height: var(--tc-jsm-track-h); border-radius: var(--tc-radius-full); background: var(--tc-meter-track); }
.ui-jsm__range::-webkit-slider-thumb { width: var(--tc-jsm-thumb); height: var(--tc-jsm-thumb); margin-top: calc((var(--tc-jsm-track-h) - var(--tc-jsm-thumb)) / 2); border: 0; border-radius: 50%; background: var(--tc-accent-solid); box-shadow: var(--tc-shadow-control); appearance: none; -webkit-appearance: none; }
.ui-jsm__range::-moz-range-thumb { width: var(--tc-jsm-thumb); height: var(--tc-jsm-thumb); border: 0; border-radius: 50%; background: var(--tc-accent-solid); box-shadow: var(--tc-shadow-control); }
/* ----- Always include ----- */
.ui-jsm__rules { display: grid; gap: var(--tc-space-2); }
.ui-jsm__rule { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); }
.ui-jsm__switch {
  position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); margin: var(--tc-space-0-5) 0 0; border-radius: var(--tc-switch-radius); background: var(--tc-switch-off);
  appearance: none; -webkit-appearance: none; cursor: pointer; transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
.ui-jsm__switch::after {
  content: ""; position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob);
  border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move);
}
.ui-jsm__switch:checked { background: var(--tc-switch-on); }
.ui-jsm__switch:checked::after { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-jsm__rule-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-jsm__rule-name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); cursor: pointer; }
.ui-jsm__rule-desc { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* ----- Model and budget ----- */
.ui-jsm__row { display: flex; flex-wrap: wrap; gap: var(--tc-space-3) var(--tc-space-4); }
.ui-jsm__field { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-jsm__select-wrap { position: relative; display: inline-flex; }
.ui-jsm__select, .ui-jsm__number {
  height: var(--tc-field-h-sm); margin: 0; border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow);
  font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary);
}
.ui-jsm__select { max-width: 100%; padding: 0 var(--tc-space-7) 0 var(--tc-space-2-5); appearance: none; cursor: pointer; }
.ui-jsm__number { width: var(--tc-jsm-number-w); padding: 0 var(--tc-space-2-5); font-variant-numeric: tabular-nums; }
.ui-jsm__select:focus, .ui-jsm__number:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-jsm__number[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-jsm__caret { position: absolute; top: 50%; right: var(--tc-space-2); width: var(--tc-space-3-5); height: var(--tc-space-3-5); color: var(--tc-icon-muted); transform: translateY(-50%); pointer-events: none; }
.ui-jsm__help { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-jsm__number[aria-invalid="true"] + .ui-jsm__help { color: var(--tc-status-danger-fg); }
.ui-jsm__none { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* ----- Estimates ----- */
.ui-jsm__estimates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(0, 2fr); gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-border-subtle); background: var(--tc-fill-subtle); }
.ui-jsm__stat { display: grid; align-content: start; gap: var(--tc-space-0-5); min-width: 0; }
.ui-jsm__stat dt { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-jsm__stat dd { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-jsm__stat[data-over] dd { color: var(--tc-status-warning-fg); }
.ui-jsm__stat--wide dd { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-jsm__stat--wide dd[data-weak] { color: var(--tc-status-warning-fg); }
.ui-jsm__warning { display: flex; align-items: flex-start; gap: var(--tc-space-2); margin: 0 var(--tc-space-4) var(--tc-space-4) !important; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-warning-fg); }
.ui-jsm__warning svg { width: var(--tc-space-4); height: var(--tc-space-4); margin-top: var(--tc-space-0-5); }
.ui-jsm__warning strong { font-weight: var(--tc-font-weight-semibold); }
@container (max-width: 480px) {
  .ui-jsm__estimates { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-jsm__stat--wide { grid-column: 1 / -1; }
}
@media (forced-colors: active) {
  .ui-jsm__switch { border: 1px solid CanvasText; }
  .ui-jsm__switch::after { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="jsm"] *, [data-ui="jsm"] *::before, [data-ui="jsm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-judge-sampling")) customElements.define("tc-judge-sampling", TcJudgeSampling);

declare global {
  interface HTMLElementTagNameMap {
    "tc-judge-sampling": TcJudgeSampling;
  }
}
