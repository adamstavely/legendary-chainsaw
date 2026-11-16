import { html, nothing, svg, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { recapBins, type RecapEvent, type RecapKind } from "../agent-recap";
import type { DecisionAnswer, DecisionAnswersChange, InboxDecision } from "../decision-inbox";
import type { SegmentOption, SegmentValueChange } from "../segmented-control";
import { TcElement } from "./base";
import "../decision-inbox";
import "../segmented-control";

/*
 * The frame Mission Control and Mission Timeline share: a heading with one status filter, "Since you looked" on top –
 * a small chart of the period stacked by what happened and a line in words – the agents in the middle (each block
 * draws its own), and what needs you on the side, in the library's Decision Inbox. The filter applies to all three:
 * it keeps the agents with that status, and the events and decisions that belong to them. Narrow, it stacks with what
 * needs you first.
 *
 * Each block names its prefix (`ui`), draws the middle in renderAgents(), and says each agent's status in
 * agentStatuses(); everything else is here, styled by missionCss(prefix).
 */

export type MissionFilter = "all" | "running" | "waiting" | "failed";
/** Something that happened since you looked; `agentId` ties it to an agent, so the filter can keep or drop it */
export type MissionEvent = RecapEvent & { agentId?: string };
/** A decision waiting on you; `agentId` ties it to the agent that asks */
export type MissionDecision = InboxDecision & { agentId?: string };
/** Detail of tc-filter-change */
export type MissionFilterChange = { filter: MissionFilter };

export type MissionLabels = {
  all: string;
  running: string;
  waiting: string;
  failed: string;
  filter: string;
  since: string;
  sinceTitle: string;
  period: string;
  done: string;
  failedEvents: string;
  needsYou: string;
  needYou: string;
  nothing: string;
  needsYouTitle: string;
  chart: string;
  agents: string;
};

export const defaultMissionLabels: MissionLabels = {
  all: "All",
  running: "Running",
  waiting: "Waiting",
  failed: "Failed",
  filter: "Show agents",
  since: "Since",
  sinceTitle: "Since you looked",
  period: "In this period",
  done: "done",
  failedEvents: "failed",
  needsYou: "needs you",
  needYou: "need you",
  nothing: "Nothing happened that matches this filter.",
  needsYouTitle: "Needs you",
  chart: "What happened, over time",
  agents: "Agents",
};

const FILTERS: MissionFilter[] = ["all", "running", "waiting", "failed"];
const KINDS: RecapKind[] = ["done", "failed", "needs-you"];

export abstract class TcMissionBase extends TcElement {
  /** The block's heading – "Mission control" or "Mission timeline" by default */
  @property() accessor heading = "";
  /** Since when "Since you looked" counts, epoch ms – by default the first event */
  @property({ type: Number }) accessor since: number | undefined = undefined;
  /** The end of the period, epoch ms – by default the last event. The block reads no clock of its own */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** What happened in the period, for the chart and the line in words */
  @property({ attribute: false }) accessor events: MissionEvent[] = [];
  /** The decisions waiting on you, shown on the side */
  @property({ attribute: false }) accessor decisions: MissionDecision[] = [];
  /** The decisions answered so far, by id – the Decision Inbox's own state, passed through */
  @property({ attribute: false }) accessor answers: Record<string, DecisionAnswer> = {};
  /** Runs when a decision is answered; it may return a promise – the Decision Inbox's `decide` */
  @property({ attribute: false }) accessor decide: ((decision: InboxDecision, answer: DecisionAnswer) => void | Promise<unknown>) | undefined = undefined;
  /** Which agents show: all, or only running, waiting or failed ones. Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property() accessor filter: MissionFilter = "all";
  /** A locale for times, e.g. "en-GB" */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<MissionLabels> = {};

  protected readonly uid = `tc-mission-${++missionCount}`;

  /** Each agent's status, by id – what the filter matches against */
  protected abstract agentStatuses(): Map<string, string>;
  /** The middle: the agents, already filtered */
  protected abstract renderAgents(filter: MissionFilter): TemplateResult | typeof nothing;

  protected get l(): MissionLabels {
    return { ...defaultMissionLabels, ...this.labels };
  }

  protected get currentFilter(): MissionFilter {
    return FILTERS.includes(this.filter) ? this.filter : "all";
  }

  /** Keeps something tied to an agent when the filter is All, or the agent has the filter's status */
  protected keeps(agentId: string | undefined, filter: MissionFilter, statuses: Map<string, string>) {
    if (filter === "all") return true;
    return agentId !== undefined && statuses.get(agentId) === filter;
  }

  private pick(next: MissionFilter) {
    if (next === this.currentFilter) return;
    if (this.emit<MissionFilterChange>("tc-filter-change", { filter: next }, { cancelable: true })) this.filter = next;
  }

  private onAnswers(e: CustomEvent<DecisionAnswersChange>) {
    // The page hears tc-answers-change first, on the way up; unless it prevented it, the answers are kept here too
    queueMicrotask(() => {
      if (!e.defaultPrevented) this.answers = e.detail.answers;
    });
  }

  private timeOf(at: number) {
    return new Intl.DateTimeFormat(this.locale, { hour: "numeric", minute: "2-digit" }).format(at);
  }

  /** "Since 6:40 PM · 12 done · 2 failed · 3 need you" – the totals of what's kept */
  protected sinceLine(events: MissionEvent[], start: number | undefined) {
    const l = this.l;
    const n = (k: RecapKind) => events.filter((e) => e.kind === k).length;
    const parts = [
      `${n("done")} ${l.done}`,
      `${n("failed")} ${l.failedEvents}`,
      `${n("needs-you")} ${n("needs-you") === 1 ? l.needsYou : l.needYou}`,
    ];
    const when = start !== undefined ? `${l.since} ${this.timeOf(start)}` : l.period;
    return [when, ...parts].join(" · ");
  }

  private renderSince(events: MissionEvent[]) {
    const p = (this.constructor as typeof TcElement).ui;
    const l = this.l;
    const times = events.map((e) => e.at);
    const start = this.since ?? (times.length ? Math.min(...times) : undefined);
    const end = this.now ?? (times.length ? Math.max(...times) : start);
    const line = this.sinceLine(events, this.since ?? start);
    let chart: TemplateResult | typeof nothing = nothing;
    if (events.length && start !== undefined && end !== undefined && end > start) {
      const { bins } = recapBins(events, start, end);
      const max = Math.max(1, ...bins.map((b) => b.done + b.failed + b["needs-you"]));
      const w = 100 / bins.length;
      chart = html`<svg class=${`ui-${p}__chart`} viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label=${`${l.chart}: ${line}`}>
        ${bins.map((b, i) => {
          let y = 40;
          return KINDS.map((k) => {
            const h = (b[k] / max) * 38;
            if (!h) return nothing;
            y -= h;
            return svg`<rect class=${`ui-${p}__bar ui-${p}__bar--${k}`} x=${i * w + w * 0.15} y=${y} width=${w * 0.7} height=${h}></rect>`;
          });
        })}
      </svg>`;
    }
    return html`<section class=${`ui-${p}__since`} aria-labelledby=${`${this.uid}-since`}>
      <div class=${`ui-${p}__since-text`}>
        <h3 id=${`${this.uid}-since`} class=${`ui-${p}__section-title`}>${l.sinceTitle}</h3>
        <p class=${`ui-${p}__since-line`}>${events.length ? line : l.nothing}</p>
      </div>
      ${chart}
      <ul class=${`ui-${p}__legend`} aria-hidden="true">
        ${KINDS.map((k) => html`<li><span class=${`ui-${p}__swatch ui-${p}__bar--${k}`}></span>${k === "done" ? l.done : k === "failed" ? l.failedEvents : l.needsYou}</li>`)}
      </ul>
    </section>`;
  }

  protected override render() {
    const p = (this.constructor as typeof TcElement).ui;
    const l = this.l;
    const filter = this.currentFilter;
    const statuses = this.agentStatuses();
    const count = (f: MissionFilter) => [...statuses.values()].filter((s) => s === f).length;
    const options: SegmentOption[] = FILTERS.map((f) => ({ value: f, label: l[f], count: f === "all" ? undefined : count(f) }));
    const events = (this.events ?? []).filter((e) => this.keeps(e.agentId, filter, statuses));
    const decisions = (this.decisions ?? []).filter((d) => this.keeps(d.agentId, filter, statuses));
    return html`<header class=${`ui-${p}__intro`}>
        <h2 class=${`ui-${p}__headline`}>${this.heading}</h2>
        <tc-segmented-control
          look=${this.resolvedLook}
          size="sm"
          aria-label=${l.filter}
          .options=${options}
          .value=${filter}
          @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
            // The inner control's event stops here: the page hears tc-filter-change
            e.stopPropagation();
            e.preventDefault();
            this.pick(e.detail.value as MissionFilter);
          }}
        ></tc-segmented-control>
      </header>
      ${this.renderSince(events)}
      <div class=${`ui-${p}__body`}>
        <div class=${`ui-${p}__agents`}>${this.renderAgents(filter)}</div>
        <aside class=${`ui-${p}__side`} aria-label=${l.needsYouTitle}>
          <tc-decision-inbox
            look=${this.resolvedLook}
            heading=${l.needsYouTitle}
            .decisions=${decisions}
            .answers=${this.answers}
            .decide=${this.decide}
            @tc-answers-change=${this.onAnswers}
          ></tc-decision-inbox>
        </aside>
      </div>`;
  }
}

let missionCount = 0;

/** The frame's styles for a block's prefix */
export function missionCss(p: string) {
  return /* css */ `
[data-ui="${p}"] {
  container-type: inline-size;
  display: grid;
  gap: var(--tc-space-5);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="${p}"] *, [data-ui="${p}"] *::before, [data-ui="${p}"] *::after { box-sizing: border-box; }
.ui-${p}__intro { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-3); }
.ui-${p}__headline { margin: 0; color: var(--tc-text-strong); font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display-sm); letter-spacing: var(--tc-tracking-tight); }
[data-ui="${p}"][data-look="clean"] .ui-${p}__headline { font-weight: var(--tc-font-weight-medium); }
.ui-${p}__section-title { margin: 0; color: var(--tc-title-color); font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); }

/* Since you looked: the line in words beside a small chart of the period */
.ui-${p}__since { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); align-items: end; gap: var(--tc-space-2) var(--tc-space-5); padding: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *) .ui-${p}__since { border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *) .ui-${p}__since { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-${p}__since-text { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-${p}__since-line { margin: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-${p}__chart { display: block; width: 100%; height: var(--tc-space-14); }
.ui-${p}__bar--done { fill: var(--tc-fill-strong); background: var(--tc-fill-strong); }
.ui-${p}__bar--failed { fill: var(--tc-status-danger-solid); background: var(--tc-status-danger-solid); }
.ui-${p}__bar--needs-you { fill: var(--tc-status-warning-solid); background: var(--tc-status-warning-solid); }
.ui-${p}__legend { grid-column: 2; display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); margin: 0; padding: 0; list-style: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-${p}__legend li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-${p}__swatch { display: inline-block; width: var(--tc-space-2); height: var(--tc-space-2); border-radius: var(--tc-radius-2xs); }

/* The agents beside what needs you; narrow, what needs you comes first */
.ui-${p}__body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 20rem); align-items: start; gap: var(--tc-space-5); }
.ui-${p}__agents, .ui-${p}__side { min-width: 0; }
/* A tree or a timeline wider than the room scrolls inside the block, never the page */
.ui-${p}__agents { overflow-x: auto; }
@container (max-width: 760px) {
  .ui-${p}__since { grid-template-columns: minmax(0, 1fr); }
  .ui-${p}__legend { grid-column: 1; }
  .ui-${p}__body { grid-template-columns: minmax(0, 1fr); }
  .ui-${p}__side { order: -1; }
}
@media (forced-colors: active) {
  .ui-${p}__bar--done, .ui-${p}__bar--failed, .ui-${p}__bar--needs-you { fill: CanvasText; background: CanvasText; }
}
`;
}
