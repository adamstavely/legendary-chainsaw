import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-revision-loop> – an agent improving its own work against a stated bar, with a visible end. The bar and "Round 3 of 5"
 * head it; a small step chart plots the score of each round against the bar's line, with a slot for every round up to the
 * cap, so the end is always in view. The latest critique sits beside it as the remaining issues, and the rounds below open
 * one at a time to show what each changed and what the critic said. When the loop ends, a line says how, in words: "Met the
 * bar in round 3", or "Stopped at the cap (5 rounds) – 2 issues remain", with those issues kept beside the result.
 *   · Stop while it runs (cancelable `tc-stop`), Accept as is once it ends (`tc-accept`), Run another round at the cap
 *     (`tc-extend`)
 *   · the rounds are one tab stop: ↑ ↓ move, Home / End go to the ends, Enter or Space opens, Escape closes
 * A running round pulses quietly (still with reduced motion). Standard: the header on a gray tray above a white card. Clean:
 * one white card, the header its first row. When narrow, the chart sits above the issues.
 *
 *   <tc-revision-loop .bar=${{ label: "Rubric score ≥ 8/10", target: 8, max: 10 }} cap="5" .rounds=${rounds}></tc-revision-loop>
 */

export type RevisionLoopOutcome = "running" | "met" | "capped" | "stopped";
export type RevisionLoopRoundStatus = "running" | "done";
export type RevisionLoopBar = {
  /** The bar in words, e.g. "Rubric score ≥ 8/10" */
  label: string;
  /** The score that meets it */
  target: number;
  /** After each score, e.g. "/10" or "%" */
  unit?: string;
  /** The top of the chart; by default a little above the highest score or the target */
  max?: number;
  /** The bottom of the chart; 0 by default */
  min?: number;
};
export type RevisionLoopRound = {
  /** The round's number, from 1 */
  n: number;
  /** Its score, once it's done */
  score?: number;
  /** The critic's remaining issues after this round */
  critique?: string[];
  /** What this round changed, in a line */
  changed?: string;
  status: RevisionLoopRoundStatus;
};
export type RevisionLoopExpandedChange = { expanded: number | null; round: RevisionLoopRound | null };
export type RevisionLoopStop = { round: number | null };
export type RevisionLoopAccept = { round: number | null; score: number | null };
export type RevisionLoopExtend = { cap: number };

/** The element's words, every one renameable through `labels` */
export type RevisionLoopLabels = {
  /** {n} and {cap} */
  roundOf: string;
  /** {label} */
  bar: string;
  /** {n} */
  running: string;
  /** {n} */
  met: string;
  /** {cap} */
  capped: string;
  /** {n} */
  stopped: string;
  /** {n} */
  issues: string;
  issuesOne: string;
  noIssues: string;
  remaining: string;
  working: string;
  rounds: string;
  /** {n} */
  round: string;
  changed: string;
  critique: string;
  revising: string;
  halted: string;
  stop: string;
  accept: string;
  extend: string;
  accepted: string;
  /** {scores} and {target} */
  chart: string;
  noScores: string;
  /** Announced: {n} and {score} */
  scored: string;
  /** Names the change against the round before: {delta} */
  delta: string;
};
export const defaultRevisionLoopLabels: RevisionLoopLabels = {
  roundOf: "Round {n} of {cap}",
  bar: "Bar: {label}",
  running: "Revising – round {n}",
  met: "Met the bar in round {n}",
  capped: "Stopped at the cap ({cap} rounds)",
  stopped: "Stopped in round {n}",
  issues: "{n} issues remain",
  issuesOne: "1 issue remains",
  noIssues: "No issues left",
  remaining: "Remaining issues",
  working: "Working on these",
  rounds: "Rounds",
  round: "Round {n}",
  changed: "What changed",
  critique: "The critic's notes",
  revising: "Revising…",
  halted: "Stopped",
  stop: "Stop",
  accept: "Accept as is",
  extend: "Run another round",
  accepted: "Accepted",
  chart: "Score by round: {scores}. The bar is {target}.",
  noScores: "no scores yet",
  scored: "Round {n} scored {score}",
  delta: "{delta} on the round before",
};

/* repeat: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="m17 2 4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path>`;
/* The outcome's shape, so colour is never the only cue */
const MARKS: Record<RevisionLoopOutcome, ReturnType<typeof svg>> = {
  running: svg`<path d="M21 12a9 9 0 1 1-6.2-8.6"></path>`,
  met: svg`<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>`,
  capped: svg`<path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9Z"></path><path d="M8 12h8"></path>`,
  stopped: svg`<circle cx="12" cy="12" r="9"></circle><rect x="9" y="9" width="6" height="6" rx="1"></rect>`,
};
/* The chart's drawing box */
const W = 300;
const H = 128;
const PAD = { l: 30, r: 10, t: 12, b: 22 };
let instances = 0;

/**
 * An agent improving its own work against a stated bar, round by round, with a visible end.
 * @tag tc-revision-loop
 * @fires tc-expanded-change - A round was opened or closed ({ expanded, round }: RevisionLoopExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-stop - Stop was pressed while it runs ({ round }: RevisionLoopStop); cancelable – prevented, the outcome stays "running"
 * @fires tc-accept - The result was accepted as it is ({ round, score }: RevisionLoopAccept); cancelable – prevented, it isn't marked accepted
 * @fires tc-extend - Run another round was pressed at the cap ({ cap }: RevisionLoopExtend); cancelable – prevented, the cap and outcome stay
 */
export class TcRevisionLoop extends TcElement {
  static override ui = "rvl";

  /** The heading */
  @property() accessor heading = "Revision loop";
  /** A line under the heading – what's being revised */
  @property() accessor description: string | undefined = undefined;
  /** The bar the work must meet */
  @property({ attribute: false }) accessor bar: RevisionLoopBar = { label: "", target: 0 };
  /** The most rounds it may run */
  @property({ type: Number }) accessor cap = 5;
  /** The rounds so far, in order; append one as it starts and update it as it ends */
  @property({ attribute: false }) accessor rounds: RevisionLoopRound[] = [];
  /** How the loop stands: "running", "met", "capped" or "stopped". Set to "stopped" by Stop and "running" by Run another round, unless their listener calls preventDefault() */
  @property({ reflect: true }) accessor outcome: RevisionLoopOutcome = "running";
  /** The open round's number, or null. Changed by the user unless a tc-expanded-change listener calls preventDefault() */
  @property({ type: Number }) accessor expanded: number | null = null;
  /** Whether the result has been accepted; set by Accept unless a tc-accept listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor accepted = false;
  /** The locale for numbers */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<RevisionLoopLabels> = {};

  @state() private accessor active: number | null = null;
  @state() private accessor announce = "";
  private readonly uid = `tc-rvl-${++instances}`;
  /** The latest scored round already seen, so only new ones are announced; undefined until the first set has arrived */
  private seenScored: number | null | undefined = undefined;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-rvl__round") ?? this.querySelector<HTMLElement>(".ui-rvl__action"));
  }

  private get words(): RevisionLoopLabels {
    return { ...defaultRevisionLoopLabels, ...this.labels };
  }

  private get ordered() {
    return [...this.rounds].sort((a, b) => a.n - b.n);
  }

  /** The latest round with a score */
  private get latestDone() {
    return [...this.ordered].reverse().find((r) => r.status === "done" && typeof r.score === "number") ?? null;
  }

  /** The round the loop is on: the running one, or else the last */
  private get current() {
    const all = this.ordered;
    return all.find((r) => r.status === "running") ?? all[all.length - 1] ?? null;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const w = this.words;
    if (changed.has("outcome") && changed.get("outcome") !== undefined && this.outcome !== "running") this.announce = this.outcomeText();
    else if (changed.has("rounds")) {
      const latest = this.latestDone;
      if (this.seenScored !== undefined && latest && latest.n !== this.seenScored) this.announce = w.scored.replace("{n}", String(latest.n)).replace("{score}", this.score(latest.score!));
      this.seenScored = latest?.n ?? null;
    }
    const open = this.ordered.filter((r) => r.status === "done").map((r) => r.n);
    if (this.expanded !== null && !open.includes(this.expanded)) this.expanded = null;
    if (this.active !== null && !open.includes(this.active)) this.active = null;
  }

  private number(n: number) {
    try {
      return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(n);
    } catch {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
    }
  }

  private score(n: number) {
    return `${this.number(n)}${this.bar.unit ?? ""}`;
  }

  private delta(r: RevisionLoopRound) {
    const all = this.ordered;
    const before = [...all.slice(0, all.indexOf(r))].reverse().find((p) => typeof p.score === "number");
    if (typeof r.score !== "number" || !before) return null;
    const d = Math.round((r.score - before.score!) * 10) / 10;
    return d === 0 ? "±0" : `${d > 0 ? "+" : "−"}${this.number(Math.abs(d))}`;
  }

  private issuesText(n: number) {
    const w = this.words;
    return n === 0 ? w.noIssues : n === 1 ? w.issuesOne : w.issues.replace("{n}", String(n));
  }

  private outcomeText() {
    const w = this.words;
    const n = this.current?.n ?? 0;
    const left = this.latestDone?.critique?.length ?? 0;
    if (this.outcome === "met") return w.met.replace("{n}", String(this.latestDone?.n ?? n));
    if (this.outcome === "capped") return `${w.capped.replace("{cap}", String(this.cap))} – ${this.issuesText(left)}`;
    if (this.outcome === "stopped") return `${w.stopped.replace("{n}", String(n))} – ${this.issuesText(left)}`;
    return w.running.replace("{n}", String(n));
  }

  private toggle(r: RevisionLoopRound) {
    this.active = r.n;
    const expanded = this.expanded === r.n ? null : r.n;
    if (this.emit<RevisionLoopExpandedChange>("tc-expanded-change", { expanded, round: expanded === null ? null : r }, { cancelable: true })) this.expanded = expanded;
  }

  private stop() {
    if (this.emit<RevisionLoopStop>("tc-stop", { round: this.current?.n ?? null }, { cancelable: true })) this.outcome = "stopped";
  }

  private accept() {
    const latest = this.latestDone;
    if (this.emit<RevisionLoopAccept>("tc-accept", { round: latest?.n ?? null, score: latest?.score ?? null }, { cancelable: true })) this.accepted = true;
  }

  private extend() {
    const cap = this.cap + 1;
    if (this.emit<RevisionLoopExtend>("tc-extend", { cap }, { cancelable: true })) {
      this.cap = cap;
      this.outcome = "running";
    }
  }

  private onKey(e: KeyboardEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>(".ui-rvl__round");
    if (!target) return;
    // In the order they're shown: newest first
    const all = this.ordered.filter((r) => r.status === "done").reverse();
    const at = all.findIndex((r) => String(r.n) === target.dataset.round);
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(all.length - 1, at + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = all.length - 1;
    else if (e.key === "Escape" && this.expanded !== null) {
      e.preventDefault();
      const open = all.find((r) => r.n === this.expanded);
      if (open) this.toggle(open);
      return;
    }
    if (next < 0) return;
    e.preventDefault();
    const n = all[next]!.n;
    this.active = n;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-rvl__round[data-round="${n}"]`)?.focus());
  }

  private renderChart() {
    const w = this.words;
    const all = this.ordered;
    const scored = all.filter((r) => typeof r.score === "number");
    const slots = Math.max(this.cap, all.length, 1);
    const top = this.bar.max ?? Math.max(this.bar.target, ...scored.map((r) => r.score!)) * 1.1;
    const bottom = this.bar.min ?? 0;
    const span = top - bottom || 1;
    const slotW = (W - PAD.l - PAD.r) / slots;
    const x = (n: number) => PAD.l + (n - 0.5) * slotW;
    const y = (v: number) => PAD.t + (1 - (Math.min(top, Math.max(bottom, v)) - bottom) / span) * (H - PAD.t - PAD.b);
    let d = "";
    scored.forEach((r, i) => {
      d += i === 0 ? `M${x(r.n)} ${y(r.score!)}` : `H${x(r.n)} V${y(r.score!)}`;
    });
    const running = all.find((r) => r.status === "running" && this.outcome === "running");
    const last = scored[scored.length - 1];
    const runY = last ? y(last.score!) : H - PAD.b;
    const label = w.chart.replace("{scores}", scored.length ? scored.map((r) => this.score(r.score!)).join(", ") : w.noScores).replace("{target}", this.score(this.bar.target));
    return html`<figure class="ui-rvl__chart">
      <svg class="ui-rvl__plot" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${label}>
        <line class="ui-rvl__axis" x1=${PAD.l} x2=${W - PAD.r} y1=${H - PAD.b} y2=${H - PAD.b}></line>
        <text class="ui-rvl__tick" x=${PAD.l - 6} y=${y(top) + 3} text-anchor="end">${this.number(top)}</text>
        <text class="ui-rvl__tick" x=${PAD.l - 6} y=${H - PAD.b + 3} text-anchor="end">${this.number(bottom)}</text>
        ${Array.from({ length: slots }, (_, i) => i + 1).map(
          (n) => svg`<text class="ui-rvl__tick" x=${x(n)} y=${H - 6} text-anchor="middle" ?data-cap=${n === this.cap}>${n}</text>`,
        )}
        <line class="ui-rvl__target" x1=${PAD.l} x2=${W - PAD.r} y1=${y(this.bar.target)} y2=${y(this.bar.target)}></line>
        <text class="ui-rvl__target-label" x=${W - PAD.r} y=${y(this.bar.target) - 4} text-anchor="end">${this.score(this.bar.target)}</text>
        ${d ? svg`<path class="ui-rvl__line" d=${d}></path>` : nothing}
        ${scored.map((r) => svg`<circle class="ui-rvl__dot" cx=${x(r.n)} cy=${y(r.score!)} r="3.5" ?data-met=${r.score! >= this.bar.target}></circle>`)}
        ${running ? svg`<circle class="ui-rvl__pending" cx=${x(running.n)} cy=${runY} r="4"></circle>` : nothing}
      </svg>
    </figure>`;
  }

  private renderIssues() {
    const w = this.words;
    const latest = this.latestDone;
    const issues = latest?.critique ?? [];
    const title = this.outcome === "running" ? w.working : w.remaining;
    if (!latest) return html`<div class="ui-rvl__issues"><h4 class="ui-rvl__section">${w.remaining}</h4><p class="ui-rvl__empty">${w.revising}</p></div>`;
    return html`<div class="ui-rvl__issues">
      <h4 class="ui-rvl__section" id=${`${this.uid}-issues`}>${title}${issues.length ? html` <span class="ui-rvl__n">(${issues.length})</span>` : nothing}</h4>
      ${issues.length ? html`<ul class="ui-rvl__list" aria-labelledby=${`${this.uid}-issues`}>${issues.map((i) => html`<li class="ui-rvl__issue">${i}</li>`)}</ul>` : html`<p class="ui-rvl__empty">${w.noIssues}</p>`}
    </div>`;
  }

  private renderRound(r: RevisionLoopRound, tabStop: number | null) {
    const w = this.words;
    const name = w.round.replace("{n}", String(r.n));
    if (r.status === "running")
      return html`<li class="ui-rvl__row" data-status="running">
        <div class="ui-rvl__round-static"><span class="ui-rvl__round-name">${name}</span><span class="ui-rvl__working">${this.outcome === "running" ? w.revising : w.halted}</span></div>
      </li>`;
    const open = this.expanded === r.n;
    const panel = `${this.uid}-r${r.n}`;
    const delta = this.delta(r);
    return html`<li class="ui-rvl__row" data-status="done">
      <button type="button" class="ui-rvl__round" data-round=${r.n} tabindex=${tabStop === r.n ? 0 : -1} aria-expanded=${open ? "true" : "false"} aria-controls=${open ? panel : nothing} @click=${() => this.toggle(r)}>
        <svg class="ui-rvl__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
        <span class="ui-rvl__round-name">${name}</span>
        ${typeof r.score === "number" ? html`<span class="ui-rvl__score">${this.score(r.score)}</span>` : nothing}
        ${delta ? html`<span class="ui-rvl__delta" ?data-down=${delta.startsWith("−")}><span aria-hidden="true">${delta}</span><span class="tc-sr-only">${w.delta.replace("{delta}", delta)}</span></span>` : nothing}
        ${r.changed && !open ? html`<span class="ui-rvl__changed-line">${r.changed}</span>` : nothing}
      </button>
      ${open
        ? html`<div class="ui-rvl__detail" id=${panel}>
            ${r.changed ? html`<p class="ui-rvl__detail-label">${w.changed}</p><p class="ui-rvl__detail-row">${r.changed}</p>` : nothing}
            <p class="ui-rvl__detail-label">${w.critique}</p>
            ${r.critique?.length ? html`<ul class="ui-rvl__list">${r.critique.map((i) => html`<li class="ui-rvl__issue">${i}</li>`)}</ul>` : html`<p class="ui-rvl__empty">${w.noIssues}</p>`}
          </div>`
        : nothing}
    </li>`;
  }

  private renderActions() {
    const w = this.words;
    if (this.accepted) return html`<div class="ui-rvl__actions"><span class="ui-rvl__accepted"><svg class="ui-rvl__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS.met}</svg>${w.accepted}</span></div>`;
    if (this.outcome === "running") return html`<div class="ui-rvl__actions"><button type="button" class="tc-btn-sm ui-rvl__action" data-action="stop" @click=${this.stop}>${w.stop}</button></div>`;
    return html`<div class="ui-rvl__actions">
      ${this.outcome === "capped" ? html`<button type="button" class="tc-btn-sm ui-rvl__action" data-action="extend" @click=${this.extend}>${w.extend}</button>` : nothing}
      ${this.latestDone ? html`<button type="button" class="tc-btn-sm ui-rvl__action ui-rvl__primary" data-action="accept" @click=${this.accept}>${w.accept}</button>` : nothing}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const all = this.ordered;
    const done = all.filter((r) => r.status === "done");
    const tabStop = this.active ?? this.expanded ?? done[done.length - 1]?.n ?? null;
    const n = this.current?.n ?? 0;
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-rvl__count">${w.roundOf.replace("{n}", String(n)).replace("{cap}", String(this.cap))}</span>` })}
      <div class="ui-rvl__card">
        <div class="ui-rvl__top">
          ${this.bar.label ? html`<p class="ui-rvl__bar">${w.bar.replace("{label}", this.bar.label)}</p>` : nothing}
          <p class="ui-rvl__outcome" data-outcome=${this.outcome}><svg class="ui-rvl__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[this.outcome]}</svg>${this.outcomeText()}</p>
        </div>
        <div class="ui-rvl__grid">
          ${this.renderChart()}
          ${this.renderIssues()}
        </div>
        ${all.length
          ? html`<div class="ui-rvl__rounds">
              <h4 class="ui-rvl__section" id=${`${this.uid}-rounds`}>${w.rounds}</h4>
              <ol class="ui-rvl__round-list" aria-labelledby=${`${this.uid}-rounds`} @keydown=${this.onKey}>${[...all].reverse().map((r) => this.renderRound(r, tabStop))}</ol>
            </div>`
          : nothing}
        ${this.renderActions()}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rvl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rvl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The score line's colour, and the chart's text in its own units (it scales with the chart) – override them on the element */
[data-ui="rvl"] { --tc-rvl-line: var(--tc-chart-1); --tc-rvl-tick: 10px; }
[data-ui="rvl"] *, [data-ui="rvl"] *::before, [data-ui="rvl"] *::after { box-sizing: border-box; }
[data-ui="rvl"] :where(p, h4, ul, ol, figure) { margin: 0; }
[data-ui="rvl"] :where(ul, ol) { padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rvl"] .ui-rvl__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-rvl__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rvl__top { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 calc(-1 * var(--tc-hairline)) var(--tc-border-subtle); }
.ui-rvl__bar { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-rvl__outcome { display: flex; align-items: center; gap: var(--tc-space-1-5); font-weight: var(--tc-font-weight-medium); }
.ui-rvl__outcome[data-outcome="met"] .ui-rvl__mark { color: var(--tc-status-success-fg); }
.ui-rvl__outcome[data-outcome="capped"] .ui-rvl__mark, .ui-rvl__outcome[data-outcome="stopped"] .ui-rvl__mark { color: var(--tc-status-warning-fg); }
.ui-rvl__outcome[data-outcome="running"] .ui-rvl__mark { color: var(--tc-status-info-fg); }
.ui-rvl__mark { flex: none; width: var(--tc-space-4); height: var(--tc-space-4); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-rvl__grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); }
.ui-rvl__chart { min-width: 0; padding: var(--tc-space-3) var(--tc-space-4); }
.ui-rvl__plot { display: block; width: 100%; height: auto; overflow: visible; }
.ui-rvl__axis { stroke: var(--tc-border-subtle); stroke-width: 1; }
.ui-rvl__tick { fill: var(--tc-text-secondary); font-size: var(--tc-rvl-tick); font-variant-numeric: tabular-nums; }
.ui-rvl__tick[data-cap] { font-weight: var(--tc-font-weight-medium); fill: var(--tc-text-primary); }
.ui-rvl__target { stroke: var(--tc-status-success-fg); stroke-width: 1.5; stroke-dasharray: 4 3; }
.ui-rvl__target-label { fill: var(--tc-status-success-fg); font-size: var(--tc-rvl-tick); font-weight: var(--tc-font-weight-medium); }
.ui-rvl__line { fill: none; stroke: var(--tc-rvl-line); stroke-width: 2; stroke-linejoin: round; }
.ui-rvl__dot { fill: var(--tc-surface-raised); stroke: var(--tc-rvl-line); stroke-width: 2; }
.ui-rvl__dot[data-met] { fill: var(--tc-status-success-fg); stroke: var(--tc-status-success-fg); }
.ui-rvl__pending { fill: none; stroke: var(--tc-rvl-line); stroke-width: 1.5; stroke-dasharray: 2 2; animation: ui-rvl-pulse var(--tc-duration-slowest) var(--tc-ease-in-out) infinite alternate; }
@keyframes ui-rvl-pulse { from { opacity: 1; } to { opacity: 0.3; } }
.ui-rvl__issues { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset var(--tc-hairline) 0 var(--tc-border-subtle); }
.ui-rvl__section { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-rvl__n { font-variant-numeric: tabular-nums; }
.ui-rvl__list { display: grid; gap: var(--tc-space-1); }
.ui-rvl__issue { position: relative; padding-left: var(--tc-space-3); overflow-wrap: anywhere; }
.ui-rvl__issue::before { content: ""; position: absolute; top: 0.6em; left: 0; width: var(--tc-space-1); height: var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-text-muted); }
.ui-rvl__empty { color: var(--tc-text-secondary); }
.ui-rvl__rounds { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-rvl__round-list { display: grid; gap: var(--tc-space-0-5); }
.ui-rvl__row { min-width: 0; }
.ui-rvl__round, .ui-rvl__round-static { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1-5) var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-primary); font: inherit; text-align: left; }
.ui-rvl__round { cursor: pointer; }
.ui-rvl__round:hover { background: var(--tc-fill-hover); }
.ui-rvl__round[aria-expanded="true"] { background: var(--tc-fill-selected); }
.ui-rvl__round:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rvl__chevron { flex: none; align-self: center; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: var(--tc-text-secondary); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rvl__round[aria-expanded="true"] .ui-rvl__chevron { transform: rotate(90deg); }
.ui-rvl__round-name { font-weight: var(--tc-font-weight-medium); }
.ui-rvl__score { font-variant-numeric: tabular-nums; }
.ui-rvl__delta { color: var(--tc-status-success-fg); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-rvl__delta[data-down] { color: var(--tc-status-danger-fg); }
.ui-rvl__changed-line { flex: 1 1 14em; min-width: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-rvl__working { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-rvl__row[data-status="running"] .ui-rvl__working { animation: ui-rvl-pulse var(--tc-duration-slowest) var(--tc-ease-in-out) infinite alternate; }
.ui-rvl__detail { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-2) var(--tc-space-6); font-size: var(--tc-font-size-xs); }
.ui-rvl__detail-row { color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-rvl__detail-label { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-rvl__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-rvl__primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-rvl__primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-rvl__accepted { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-status-success-fg); font-weight: var(--tc-font-weight-medium); }
@container (max-width: 560px) {
  .ui-rvl__grid { grid-template-columns: minmax(0, 1fr); }
  .ui-rvl__issues { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
  .ui-rvl__changed-line { flex-basis: 100%; white-space: normal; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-rvl__pending, .ui-rvl__row[data-status="running"] .ui-rvl__working { animation: none; }
  .ui-rvl__chevron { transition: none; }
}
@media (forced-colors: active) {
  .ui-rvl__line, .ui-rvl__target, .ui-rvl__pending { stroke: CanvasText; }
  .ui-rvl__dot { stroke: CanvasText; }
  .ui-rvl__dot[data-met] { fill: CanvasText; }
  .ui-rvl__tick, .ui-rvl__target-label { fill: CanvasText; }
  .ui-rvl__round[aria-expanded="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-revision-loop")) customElements.define("tc-revision-loop", TcRevisionLoop);

declare global {
  interface HTMLElementTagNameMap {
    "tc-revision-loop": TcRevisionLoop;
  }
}
