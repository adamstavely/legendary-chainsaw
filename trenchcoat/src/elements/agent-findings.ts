import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { ListMotionController } from "./internal/list-motion";
import { formatDate } from "./internal/util";

/*
 * <tc-agent-findings> – a group of agents checking something. One row per agent with its progress in numbers and a bar,
 * beside a feed of what they've found, newest first, each with its severity in words and a mark. The feed filters by agent
 * and severity. New findings glide in (not with reduced motion) and are announced politely, several at once as a count.
 * Picking a finding opens its detail below it. With numbers in `checked` and `total`, a line above totals the checks, and
 * each agent shows a fraction. It always totals what's been found, and with `layout="stacked"` the agents sit above the feed.
 *   · the findings are one tab stop: ↑ ↓ move, Home / End go to the ends, Enter or Space opens, Escape closes
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row. When narrow, the
 * agents sit above the feed.
 *
 *   <tc-agent-findings .agents=${agents} .findings=${findings}></tc-agent-findings>
 */

export type AgentFindingsStatus = "queued" | "running" | "done" | "failed";
export type AgentFindingSeverity = "info" | "low" | "medium" | "high" | "critical";
export type AgentFindingsLayout = "columns" | "stacked";
export type AgentFindingsAgent = {
  id: string;
  name: string;
  status: AgentFindingsStatus;
  /** How far along, 0 to 1 */
  progress?: number;
  /** What it's checked so far: a number, with `total`, or in words: "412 of 900 records" */
  checked?: number | string;
  /** How many checks it has to do */
  total?: number;
  /** What it's doing now */
  activity?: string;
};
export type AgentFinding = {
  id: string;
  /** The id of the agent that found it */
  agent: string;
  severity: AgentFindingSeverity;
  title: string;
  /** More about it, shown when it's opened */
  detail?: string;
  /** When it was found, epoch ms */
  at?: number;
  /** Where it is, such as a file and line */
  location?: string;
};
export type AgentFindingsSeverityFilter = AgentFindingSeverity | "all";
export type AgentFindingsSelectedChange = { selected: string | null; finding: AgentFinding | null };
export type AgentFindingsAgentFilterChange = { agentFilter: string };
export type AgentFindingsSeverityFilterChange = { severityFilter: AgentFindingsSeverityFilter };

/** The element's words, every one renameable through `labels` */
export type AgentFindingsLabels = {
  agents: string;
  findings: string;
  queued: string;
  running: string;
  done: string;
  failed: string;
  info: string;
  low: string;
  medium: string;
  high: string;
  critical: string;
  allAgents: string;
  allSeverities: string;
  filterAgent: string;
  filterSeverity: string;
  /** {n} */
  count: string;
  countOne: string;
  /** {agent}'s progress */
  progress: string;
  empty: string;
  noMatch: string;
  /** Announced: {title} and {severity} */
  newOne: string;
  /** {n} */
  newMany: string;
  /** {checked} and {total}, for all the agents */
  checks: string;
  /** {checked} and {total}, for one agent */
  fraction: string;
  /** {n} and {severity}, in the totals */
  severityCount: string;
  /** Names the totals */
  totals: string;
};
export const defaultAgentFindingsLabels: AgentFindingsLabels = {
  agents: "Agents",
  findings: "Findings",
  queued: "Queued",
  running: "Running",
  done: "Done",
  failed: "Failed",
  info: "Info",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  allAgents: "All agents",
  allSeverities: "All severities",
  filterAgent: "Filter by agent",
  filterSeverity: "Filter by severity",
  count: "{n} findings",
  countOne: "1 finding",
  progress: "{agent} progress",
  empty: "Nothing found yet.",
  noMatch: "No findings match.",
  newOne: "New finding: {title}, {severity}",
  newMany: "{n} new findings",
  checks: "{checked} of {total} checks",
  fraction: "{checked}/{total}",
  severityCount: "{n} {severity}",
  totals: "Found so far",
};

/* search-check: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="m8 11 2 2 4-4"></path><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`;
/* The severity's shape, so colour is never the only cue */
const MARKS: Record<AgentFindingSeverity, ReturnType<typeof svg>> = {
  info: svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 16v-4M12 8h.01"></path>`,
  low: svg`<circle cx="12" cy="12" r="9"></circle>`,
  medium: svg`<path d="M12 3 21 12 12 21 3 12Z"></path>`,
  critical: svg`<path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9Z"></path><path d="M12 8v4M12 16h.01"></path>`,
  high: svg`<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"></path><path d="M12 9v4M12 17h.01"></path>`,
};
const SEVERITIES: AgentFindingSeverity[] = ["critical", "high", "medium", "low", "info"];
let instances = 0;

/**
 * A group of agents checking something: one row per agent, beside a feed of what they've found.
 * @tag tc-agent-findings
 * @fires tc-selected-change - A finding was opened or closed ({ selected, finding }: AgentFindingsSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-agent-filter-change - The agent filter changed ({ agentFilter }: AgentFindingsAgentFilterChange); cancelable – prevented, `agentFilter` stays as it was
 * @fires tc-severity-filter-change - The severity filter changed ({ severityFilter }: AgentFindingsSeverityFilterChange); cancelable – prevented, `severityFilter` stays as it was
 */
export class TcAgentFindings extends TcElement {
  static override ui = "agf";

  /** The heading */
  @property() accessor heading = "Agent findings";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The agents doing the checking */
  @property({ attribute: false }) accessor agents: AgentFindingsAgent[] = [];
  /** What they've found, in any order: findings with `at` show newest first */
  @property({ attribute: false }) accessor findings: AgentFinding[] = [];
  /** The open finding's id, or null. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** The agent id the feed shows, or "all". Changed by the user unless a tc-agent-filter-change listener calls preventDefault() */
  @property({ attribute: "agent-filter" }) accessor agentFilter = "all";
  /** The severity the feed shows, or "all". Changed by the user unless a tc-severity-filter-change listener calls preventDefault() */
  @property({ attribute: "severity-filter" }) accessor severityFilter: AgentFindingsSeverityFilter = "all";
  /** The locale for times */
  @property() accessor locale: string | undefined = undefined;
  /** How the agents and feed sit: "columns", side by side, or "stacked", agents above the feed */
  @property({ reflect: true }) accessor layout: AgentFindingsLayout = "columns";
  /** "Now", epoch ms: when given, findings say how long ago, such as "5 sec. ago". The element doesn't read the clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AgentFindingsLabels> = {};

  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";
  private readonly uid = `tc-agf-${++instances}`;
  /** Findings already seen, so only new ones are announced; null until the first set has arrived */
  private seen: Set<string> | null = null;

  constructor() {
    super();
    new ListMotionController(this, () => this.querySelector(".ui-agf__feed"), { exits: false });
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-agf__finding") ?? this.querySelector<HTMLElement>(".ui-agf__filter"));
  }

  private get words(): AgentFindingsLabels {
    return { ...defaultAgentFindingsLabels, ...this.labels };
  }

  private get shown() {
    return this.findings
      .filter((f) => (this.agentFilter === "all" || f.agent === this.agentFilter) && (this.severityFilter === "all" || f.severity === this.severityFilter))
      .sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("findings")) {
      if (this.seen) {
        const fresh = this.findings.filter((f) => !this.seen!.has(f.id));
        const w = this.words;
        if (fresh.length === 1) this.announce = w.newOne.replace("{title}", fresh[0]!.title).replace("{severity}", w[fresh[0]!.severity]);
        else if (fresh.length > 1) this.announce = w.newMany.replace("{n}", String(fresh.length));
      }
      this.seen = new Set(this.findings.map((f) => f.id));
    }
    const ids = this.shown.map((f) => f.id);
    if (this.selected !== null && !ids.includes(this.selected)) this.selected = null;
    if (this.active !== null && !ids.includes(this.active)) this.active = null;
  }

  private toggle(f: AgentFinding) {
    this.active = f.id;
    const selected = this.selected === f.id ? null : f.id;
    if (this.emit<AgentFindingsSelectedChange>("tc-selected-change", { selected, finding: selected ? f : null }, { cancelable: true })) this.selected = selected;
  }

  private setAgentFilter(agentFilter: string) {
    if (this.emit<AgentFindingsAgentFilterChange>("tc-agent-filter-change", { agentFilter }, { cancelable: true })) this.agentFilter = agentFilter;
    else this.requestUpdate();
  }

  private setSeverityFilter(severityFilter: AgentFindingsSeverityFilter) {
    if (this.emit<AgentFindingsSeverityFilterChange>("tc-severity-filter-change", { severityFilter }, { cancelable: true })) this.severityFilter = severityFilter;
    else this.requestUpdate();
  }

  private onKey(e: KeyboardEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>(".ui-agf__finding");
    if (!target) return;
    const all = this.shown;
    const at = all.findIndex((f) => f.id === target.dataset.finding);
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(all.length - 1, at + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = all.length - 1;
    else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      const open = all.find((f) => f.id === this.selected);
      if (open) this.toggle(open);
      return;
    }
    if (next < 0) return;
    e.preventDefault();
    const id = all[next]!.id;
    this.active = id;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-finding="${CSS.escape(id)}"]`)?.focus());
  }

  /** The two severities an agent's row counts: the most severe in use, so a critical finding is never left out */
  private get counted(): [AgentFindingSeverity, AgentFindingSeverity] {
    return this.findings.some((f) => f.severity === "critical") ? ["critical", "high"] : ["high", "medium"];
  }

  private lower(word: string) {
    return word.toLocaleLowerCase(this.locale);
  }

  private when(at: number) {
    if (this.now === undefined) return formatDate(at, this.locale, { timeStyle: "short" });
    const seconds = Math.round((at - this.now) / 1000);
    const size = Math.abs(seconds);
    const [value, unit]: [number, Intl.RelativeTimeFormatUnit] = size < 60 ? [seconds, "second"] : size < 3600 ? [Math.round(seconds / 60), "minute"] : size < 86400 ? [Math.round(seconds / 3600), "hour"] : [Math.round(seconds / 86400), "day"];
    try {
      return new Intl.RelativeTimeFormat(this.locale, { numeric: "auto", style: "short" }).format(value, unit);
    } catch {
      return new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "short" }).format(value, unit);
    }
  }

  private renderAgent(a: AgentFindingsAgent) {
    const w = this.words;
    const numbers = typeof a.checked === "number" && typeof a.total === "number" && a.total > 0 ? { checked: a.checked, total: a.total } : null;
    const progress = typeof a.progress === "number" ? a.progress : numbers ? numbers.checked / numbers.total : undefined;
    const known = typeof progress === "number" && Number.isFinite(progress);
    const pct = known ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : null;
    const counts = this.counted.map((s) => ({ s, n: this.findings.filter((f) => f.agent === a.id && f.severity === s).length }));
    return html`<li class="ui-agf__agent" data-status=${a.status}>
      <div class="ui-agf__who">
        <div class="ui-agf__agent-head">
          <span class="ui-agf__name">${a.name}</span>
          <span class="ui-agf__status" data-status=${a.status}>${w[a.status]}</span>
        </div>
        ${a.activity ? html`<span class="ui-agf__activity">${a.activity}</span>` : nothing}
        ${typeof a.checked === "string" && a.checked ? html`<span class="ui-agf__checked">${a.checked}</span>` : nothing}
      </div>
      ${pct !== null
        ? html`<div class="ui-agf__progress">
            <span class="ui-agf__track" role="progressbar" aria-label=${w.progress.replace("{agent}", a.name)} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct}><span class="ui-agf__fill" style=${styleMap({ width: `${pct}%` })}></span></span>
            ${numbers ? html`<span class="ui-agf__fraction">${w.fraction.replace("{checked}", String(numbers.checked)).replace("{total}", String(numbers.total))}</span>` : html`<span class="ui-agf__pct">${pct}%</span>`}
          </div>`
        : nothing}
      ${this.findings.length
        ? html`<div class="ui-agf__counts">
            ${counts.map(
              ({ s, n }) =>
                html`<span class="ui-agf__tally" data-severity=${s} ?data-zero=${n === 0}><svg class="ui-agf__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[s]}</svg>${n}<span class="tc-sr-only"> ${this.lower(w[s])}</span></span>`,
            )}
          </div>`
        : nothing}
    </li>`;
  }

  private renderFinding(f: AgentFinding, tabStop: string | null) {
    const w = this.words;
    const open = this.selected === f.id;
    const agent = this.agents.find((a) => a.id === f.agent)?.name ?? f.agent;
    const panel = `${this.uid}-${f.id}`;
    return html`<li class="ui-agf__row" data-severity=${f.severity}>
      <button type="button" class="ui-agf__finding" data-finding=${f.id} tabindex=${tabStop === f.id ? 0 : -1} aria-expanded=${open ? "true" : "false"} aria-controls=${open ? panel : nothing} @click=${() => this.toggle(f)}>
        <span class="ui-agf__severity" data-severity=${f.severity}><svg class="ui-agf__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[f.severity]}</svg>${w[f.severity]}</span>
        <span class="ui-agf__title">${f.title}</span>
        <span class="ui-agf__meta">${agent}${f.location ? html` · <span class="ui-agf__location">${f.location}</span>` : nothing}${f.at !== undefined ? html` · <span class="ui-agf__when">${this.when(f.at)}</span>` : nothing}</span>
      </button>
      ${open ? html`<div class="ui-agf__detail" id=${panel}>${f.detail ?? f.title}</div>` : nothing}
    </li>`;
  }

  private renderSummary() {
    const w = this.words;
    const numeric = this.agents.filter((a) => typeof a.checked === "number" && typeof a.total === "number");
    const totals = SEVERITIES.map((s) => ({ s, n: this.findings.filter((f) => f.severity === s).length })).filter((t) => t.n > 0);
    if (!numeric.length && !totals.length) return nothing;
    const checked = numeric.reduce((n, a) => n + (a.checked as number), 0);
    const total = numeric.reduce((n, a) => n + a.total!, 0);
    return html`<div class="ui-agf__summary">
      ${numeric.length ? html`<span class="ui-agf__checks">${w.checks.replace("{checked}", String(checked)).replace("{total}", String(total))}</span>` : nothing}
      ${totals.length
        ? html`<ul class="ui-agf__totals" aria-label=${w.totals}>
            ${totals.map(({ s, n }) => html`<li class="ui-agf__total" data-severity=${s}><svg class="ui-agf__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[s]}</svg>${w.severityCount.replace("{n}", String(n)).replace("{severity}", this.lower(w[s]))}</li>`)}
          </ul>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const shown = this.shown;
    const tabStop = this.active ?? this.selected ?? shown[0]?.id ?? null;
    const count = shown.length === 1 ? w.countOne : w.count.replace("{n}", String(shown.length));
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-agf__count">${count}</span>` })}
      <div class="ui-agf__card">
        ${this.renderSummary()}
        <div class="ui-agf__grid">
          <section class="ui-agf__agents-panel" aria-labelledby=${`${this.uid}-agents`}>
            <h4 class="ui-agf__section" id=${`${this.uid}-agents`}>${w.agents}</h4>
            <ul class="ui-agf__agents">${this.agents.map((a) => this.renderAgent(a))}</ul>
          </section>
          <section class="ui-agf__feed-panel" aria-labelledby=${`${this.uid}-feed`}>
            <div class="ui-agf__feed-head">
              <h4 class="ui-agf__section" id=${`${this.uid}-feed`}>${w.findings}</h4>
              <div class="ui-agf__filters">
                <select class="ui-agf__filter" aria-label=${w.filterAgent} @change=${(e: Event) => this.setAgentFilter((e.target as HTMLSelectElement).value)}>
                  <option value="all" .selected=${live(this.agentFilter === "all")}>${w.allAgents}</option>
                  ${this.agents.map((a) => html`<option value=${a.id} .selected=${live(this.agentFilter === a.id)}>${a.name}</option>`)}
                </select>
                <select class="ui-agf__filter" aria-label=${w.filterSeverity} @change=${(e: Event) => this.setSeverityFilter((e.target as HTMLSelectElement).value as AgentFindingsSeverityFilter)}>
                  <option value="all" .selected=${live(this.severityFilter === "all")}>${w.allSeverities}</option>
                  ${SEVERITIES.map((s) => html`<option value=${s} .selected=${live(this.severityFilter === s)}>${w[s]}</option>`)}
                </select>
              </div>
            </div>
            ${shown.length
              ? html`<ul class="ui-agf__feed" @keydown=${this.onKey}>${repeat(shown, (f) => f.id, (f) => this.renderFinding(f, tabStop))}</ul>`
              : html`<p class="ui-agf__empty">${this.findings.length ? w.noMatch : w.empty}</p>`}
          </section>
        </div>
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agf"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agf"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The bar's height – override it on the element */
[data-ui="agf"] { --tc-agf-bar: var(--tc-space-1); }
[data-ui="agf"] *, [data-ui="agf"] *::before, [data-ui="agf"] *::after { box-sizing: border-box; }
[data-ui="agf"] :where(p, h4, ul) { margin: 0; }
[data-ui="agf"] :where(ul) { padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agf"] .ui-agf__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-agf__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-agf__grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); }
.ui-agf__agents-panel, .ui-agf__feed-panel { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3) var(--tc-space-4); }
.ui-agf__feed-panel { box-shadow: inset var(--tc-hairline) 0 var(--tc-border-subtle); }
.ui-agf__section { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-agf__agents { display: grid; gap: var(--tc-space-3); }
.ui-agf__agent { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-agf__who { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-agf__activity { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-agf__fraction { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-agf__counts { display: flex; gap: var(--tc-space-2); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-agf__tally { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-weight: var(--tc-font-weight-medium); }
.ui-agf__tally[data-severity="critical"], .ui-agf__total[data-severity="critical"] { color: var(--tc-status-danger-fg); }
.ui-agf__tally[data-severity="high"], .ui-agf__total[data-severity="high"] { color: var(--tc-status-danger-fg); }
.ui-agf__tally[data-severity="medium"], .ui-agf__total[data-severity="medium"] { color: var(--tc-status-warning-fg); }
.ui-agf__tally[data-zero] { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-agf__summary { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 calc(-1 * var(--tc-hairline)) var(--tc-border-subtle); }
.ui-agf__checks { font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-agf__totals { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-xs); }
.ui-agf__total { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-agf__location { font-family: var(--tc-font-mono); overflow-wrap: anywhere; }
.ui-agf__when { white-space: nowrap; }
[data-ui="agf"][layout="stacked"] .ui-agf__grid { grid-template-columns: minmax(0, 1fr); }
[data-ui="agf"][layout="stacked"] .ui-agf__feed-panel { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-agf__agent-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); }
.ui-agf__name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-agf__status { flex: none; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agf__status[data-status="running"] { color: var(--tc-status-info-fg); }
.ui-agf__status[data-status="failed"] { color: var(--tc-status-danger-fg); }
.ui-agf__progress { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-agf__track { flex: 1; height: var(--tc-agf-bar); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-meter-track); }
.ui-agf__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-agf__agent[data-status="failed"] .ui-agf__fill { background: var(--tc-status-danger-fg); }
.ui-agf__pct { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-agf__checked { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-agf__feed-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-agf__filters { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); min-width: 0; }
.ui-agf__filter { max-width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-xs); }
.ui-agf__filter:focus-visible, .ui-agf__finding:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-agf__feed { display: grid; gap: var(--tc-space-0-5); }
.ui-agf__row { min-width: 0; }
.ui-agf__finding { display: grid; gap: var(--tc-space-0-5); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1-5) var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-primary); font: inherit; text-align: left; cursor: pointer; }
.ui-agf__finding:hover { background: var(--tc-fill-hover); }
.ui-agf__finding[aria-expanded="true"] { background: var(--tc-fill-selected); }
.ui-agf__severity { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-agf__severity[data-severity="medium"] { color: var(--tc-status-warning-fg); }
.ui-agf__severity[data-severity="high"], .ui-agf__severity[data-severity="critical"] { color: var(--tc-status-danger-fg); }
.ui-agf__mark { flex: none; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-agf__title { overflow-wrap: anywhere; }
.ui-agf__meta { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agf__detail { padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-agf__empty { padding: var(--tc-space-4) 0; color: var(--tc-text-secondary); text-align: center; }
/* One line when there's room: severity, title, then who and where, wrapping as the width runs out */
@container (min-width: 640px) {
  [data-ui="agf"][layout="stacked"] .ui-agf__agent { grid-template-columns: minmax(0, 3fr) minmax(0, 3fr) minmax(0, 1fr); align-items: center; column-gap: var(--tc-space-4); }
  [data-ui="agf"][layout="stacked"] .ui-agf__counts { justify-content: flex-end; }
  [data-ui="agf"][layout="stacked"] .ui-agf__finding { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2); }
  [data-ui="agf"][layout="stacked"] .ui-agf__severity { flex: none; }
  [data-ui="agf"][layout="stacked"] .ui-agf__title { flex: 1 1 14em; min-width: 0; }
}
@container (min-width: 1040px) {
  .ui-agf__finding { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2); }
  .ui-agf__severity { flex: none; }
  .ui-agf__title { flex: 1 1 14em; min-width: 0; }
}
@container (max-width: 560px) {
  .ui-agf__grid { grid-template-columns: minmax(0, 1fr); }
  .ui-agf__feed-panel { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-agf__fill { transition: none; }
}
@media (forced-colors: active) {
  .ui-agf__fill { background: CanvasText; }
  .ui-agf__finding[aria-expanded="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-agent-findings")) customElements.define("tc-agent-findings", TcAgentFindings);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-findings": TcAgentFindings;
  }
}
