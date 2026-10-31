import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-scheduled-runs> – agent tasks placed into a week's sessions under usage limits. planRuns() fills the sessions:
 * pinned tasks first, then the rest, most important and biggest first, so small tasks fill the gaps. A task too big for
 * any one session splits across several as linked parts, and what can't fit waits in an Unscheduled list. Each session
 * has a meter with what's used in numbers and words, and each task a Move to select, so nothing depends on dragging. A
 * session without room isn't offered, so a move can't push a session over its limit.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-scheduled-runs .sessions=${sessions} .tasks=${tasks}></tc-scheduled-runs>
 */

export type ScheduledSession = {
  id: string;
  label: string;
  /** When it is, in words: "Monday" */
  day?: string;
  /** How much it can use */
  limit: number;
  /** What the numbers count; by default the element's `unit` */
  unit?: string;
};
export type ScheduledTask = {
  id: string;
  name: string;
  /** How much it uses */
  cost: number;
  /** Higher goes first */
  priority?: number;
  /** A session's id it must run in, whole */
  pinned?: string;
};
export type ScheduledPlacement = {
  /** The task's id */
  task: string;
  /** The session's id, or null when it's unscheduled */
  session: string | null;
  /** How much of the task's cost this part uses */
  cost: number;
  /** Which part this is, when the task is split */
  part?: number;
  /** How many parts the task has, when it's split */
  parts?: number;
};
export type ScheduledPlacementsChange = { placements: ScheduledPlacement[]; task: ScheduledTask };

/** The element's words, every one renameable through `labels` */
export type ScheduledRunsLabels = {
  moveTo: string;
  unscheduled: string;
  unscheduledHelp: string;
  /** {part} of {parts} */
  part: string;
  pinned: string;
  /** {used} of {limit} {unit} used */
  used: string;
  /** {left} {unit} left */
  left: string;
  full: string;
  empty: string;
  noTasks: string;
  /** {n} */
  summary: string;
  summaryAll: string;
  /** {task}, {session} */
  moved: string;
};
export const defaultScheduledRunsLabels: ScheduledRunsLabels = {
  moveTo: "Move to",
  unscheduled: "Unscheduled",
  unscheduledHelp: "These don't fit this week.",
  part: "part {part} of {parts}",
  pinned: "Pinned",
  used: "{used} of {limit} {unit} used",
  left: "{left} {unit} left",
  full: "Full",
  empty: "Nothing planned",
  noTasks: "No tasks to schedule.",
  summary: "{n} unscheduled",
  summaryAll: "All scheduled",
  moved: "Moved {task} to {session}",
};

const ICON = svg`<path d="M8 2v4M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>`;
let instances = 0;

/** Places tasks in sessions: pinned first, then by priority and size. Splits what no one session can hold; never overfills */
export function planRuns(sessions: ScheduledSession[], tasks: ScheduledTask[]): ScheduledPlacement[] {
  const left = new Map(sessions.map((s) => [s.id, s.limit]));
  const out: ScheduledPlacement[] = [];
  const whole = (task: ScheduledTask, session: string | null) => out.push({ task: task.id, session, cost: task.cost });
  const free = [...tasks].filter((t) => !t.pinned || !left.has(t.pinned));
  for (const task of tasks) {
    if (!task.pinned || !left.has(task.pinned)) continue;
    const room = left.get(task.pinned)!;
    if (room >= task.cost) {
      left.set(task.pinned, room - task.cost);
      whole(task, task.pinned);
    } else whole(task, null);
  }
  free.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || b.cost - a.cost);
  for (const task of free) {
    const fits = sessions.find((s) => left.get(s.id)! >= task.cost);
    if (fits) {
      left.set(fits.id, left.get(fits.id)! - task.cost);
      whole(task, fits.id);
      continue;
    }
    const total = sessions.reduce((sum, s) => sum + left.get(s.id)!, 0);
    if (total < task.cost || task.cost <= 0) {
      whole(task, null);
      continue;
    }
    const pieces: { session: string; cost: number }[] = [];
    let need = task.cost;
    for (const s of sessions) {
      const take = Math.min(need, left.get(s.id)!);
      if (take <= 0) continue;
      left.set(s.id, left.get(s.id)! - take);
      pieces.push({ session: s.id, cost: take });
      need -= take;
      if (need <= 0) break;
    }
    pieces.forEach((p, i) => out.push({ task: task.id, session: p.session, cost: p.cost, part: i + 1, parts: pieces.length }));
  }
  return out;
}

/** Moves one placement to a session (or null); a part joining another part of its task merges with it, and parts renumber */
export function movePlacement(placements: ScheduledPlacement[], placement: ScheduledPlacement, session: string | null): ScheduledPlacement[] {
  const moved = { ...placement, session };
  const isIt = (p: ScheduledPlacement) => p.session === placement.session && p.part === placement.part;
  const same = placements.filter((p) => p.task === placement.task && !isIt(p));
  const merged = same.find((p) => p.session === session);
  const group = merged ? same.map((p) => (p === merged ? { ...p, cost: p.cost + placement.cost } : p)) : [...same, moved];
  const numbered = group.map((p, i) => {
    const { part: _part, parts: _parts, ...rest } = p;
    return group.length > 1 ? { ...rest, part: i + 1, parts: group.length } : rest;
  });
  const first = placements.findIndex((p) => p.task === placement.task);
  const others = placements.filter((p) => p.task !== placement.task);
  return [...others.slice(0, first), ...numbered, ...others.slice(first)];
}

/**
 * Agent tasks placed into a week's sessions under usage limits.
 * @tag tc-scheduled-runs
 * @fires tc-placements-change - A task was moved ({ placements, task }: ScheduledPlacementsChange); cancelable – prevented, `placements` stays as it was
 */
export class TcScheduledRuns extends TcElement {
  static override ui = "sdr";

  /** The heading */
  @property() accessor heading = "Scheduled runs";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The week's sessions, in order */
  @property({ attribute: false }) accessor sessions: ScheduledSession[] = [];
  /** The tasks to place */
  @property({ attribute: false }) accessor tasks: ScheduledTask[] = [];
  /** Where each task goes; unset, planRuns() decides. Changed by the user unless a tc-placements-change listener calls preventDefault() */
  @property({ attribute: false }) accessor placements: ScheduledPlacement[] | undefined = undefined;
  /** What the numbers count */
  @property() accessor unit = "credits";
  /** The locale for numbers */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ScheduledRunsLabels> = {};

  @state() private accessor announce = "";
  private readonly uid = `tc-sdr-${++instances}`;

  private get words(): ScheduledRunsLabels {
    return { ...defaultScheduledRunsLabels, ...this.labels };
  }
  private get plan() {
    return this.placements ?? planRuns(this.sessions, this.tasks);
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  private usedIn(id: string, plan: ScheduledPlacement[]) {
    return plan.reduce((sum, p) => (p.session === id ? sum + p.cost : sum), 0);
  }

  private move(placement: ScheduledPlacement, session: string | null) {
    const task = this.tasks.find((t) => t.id === placement.task);
    if (!task || placement.session === session) return;
    const placements = movePlacement(this.plan, placement, session);
    if (!this.emit<ScheduledPlacementsChange>("tc-placements-change", { placements, task }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.placements = placements;
    const name = this.sessions.find((s) => s.id === session)?.label ?? this.words.unscheduled;
    this.announce = this.words.moved.replace("{task}", task.name).replace("{session}", name);
  }

  private renderTask(p: ScheduledPlacement, plan: ScheduledPlacement[]) {
    const w = this.words;
    const task = this.tasks.find((t) => t.id === p.task);
    if (!task) return nothing;
    const part = p.parts ? w.part.replace("{part}", String(p.part)).replace("{parts}", String(p.parts)) : "";
    const label = `${w.moveTo}, ${task.name}${part ? `, ${part}` : ""}`;
    return html`<li class="ui-sdr__task" data-task=${task.id} data-session=${p.session ?? ""} ?data-split=${!!p.parts}>
      <div class="ui-sdr__task-text">
        <span class="ui-sdr__task-name">${task.name}</span>
        <span class="ui-sdr__task-meta">${this.num(p.cost)} ${this.unit}${part ? html` · <span class="ui-sdr__part">${part}</span>` : nothing}${task.pinned === p.session && task.pinned ? html` · ${w.pinned}` : nothing}</span>
      </div>
      <select class="ui-sdr__move" aria-label=${label} @change=${(e: Event) => this.move(p, (e.target as HTMLSelectElement).value || null)}>
        ${this.sessions.map((s) => {
          const room = s.limit - this.usedIn(s.id, plan);
          const here = s.id === p.session;
          const joins = plan.some((o) => o.task === p.task && o.session === s.id);
          return html`<option value=${s.id} .selected=${live(here)} ?disabled=${!here && !joins && room < p.cost}>${s.label}</option>`;
        })}
        <option value="" .selected=${live(p.session === null)}>${w.unscheduled}</option>
      </select>
    </li>`;
  }

  private renderSession(s: ScheduledSession, plan: ScheduledPlacement[]) {
    const w = this.words;
    const unit = s.unit ?? this.unit;
    const used = this.usedIn(s.id, plan);
    const left = Math.max(0, s.limit - used);
    const pct = s.limit > 0 ? Math.min(100, (used / s.limit) * 100) : 0;
    const words = w.used.replace("{used}", this.num(used)).replace("{limit}", this.num(s.limit)).replace("{unit}", unit);
    const here = plan.filter((p) => p.session === s.id);
    const id = `${this.uid}-${s.id}`;
    return html`<section class="ui-sdr__session" data-session=${s.id} data-full=${left === 0 ? "true" : "false"} aria-labelledby=${id}>
      <div class="ui-sdr__session-head">
        <h4 class="ui-sdr__session-name" id=${id}>${s.label}</h4>
        ${s.day ? html`<span class="ui-sdr__day">${s.day}</span>` : nothing}
      </div>
      <div class="ui-sdr__meter" role="progressbar" aria-label=${s.label} aria-valuemin="0" aria-valuemax=${s.limit} aria-valuenow=${Math.min(used, s.limit)} aria-valuetext=${words}><span class="ui-sdr__fill" style=${`width: ${pct}%`}></span></div>
      <p class="ui-sdr__usage">${words} · ${left === 0 ? w.full : w.left.replace("{left}", this.num(left)).replace("{unit}", unit)}</p>
      ${here.length ? html`<ul class="ui-sdr__tasks">${repeat(here, (p) => `${p.task}-${p.part ?? 0}`, (p) => this.renderTask(p, plan))}</ul>` : html`<p class="ui-sdr__none">${w.empty}</p>`}
    </section>`;
  }

  protected override render() {
    const w = this.words;
    const plan = this.plan;
    const waiting = plan.filter((p) => p.session === null || !this.sessions.some((s) => s.id === p.session));
    const summary = waiting.length ? w.summary.replace("{n}", String(waiting.length)) : w.summaryAll;
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-sdr__summary" data-any=${waiting.length ? "true" : "false"}>${summary}</span>` })}
      <div class="ui-sdr__card">
        ${this.tasks.length || this.sessions.length ? html`<div class="ui-sdr__sessions">${repeat(this.sessions, (s) => s.id, (s) => this.renderSession(s, plan))}</div>` : html`<p class="ui-sdr__empty">${w.noTasks}</p>`}
        ${waiting.length
          ? html`<section class="ui-sdr__waiting" aria-labelledby=${`${this.uid}-waiting`}>
              <h4 class="ui-sdr__session-name" id=${`${this.uid}-waiting`}>${w.unscheduled}</h4>
              <p class="ui-sdr__usage">${w.unscheduledHelp}</p>
              <ul class="ui-sdr__tasks">${repeat(waiting, (p) => `${p.task}-${p.part ?? 0}`, (p) => this.renderTask({ ...p, session: null }, plan))}</ul>
            </section>`
          : nothing}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sdr"] { position: relative; display: block; box-sizing: border-box; width: 100%; container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sdr"] { position: relative; display: block; box-sizing: border-box; width: 100%; container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="sdr"] *, [data-ui="sdr"] *::before, [data-ui="sdr"] *::after { box-sizing: border-box; }
[data-ui="sdr"] :where(p, ul, ol, h4) { margin: 0; padding: 0; }
[data-ui="sdr"] { --tc-sdr-bg: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sdr"] { --tc-sdr-bg: var(--tc-surface-on-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sdr"] .ui-sdr__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-sdr__summary { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-sdr__summary[data-any="true"] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-sdr__sessions { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-sdr__session { display: grid; align-content: start; gap: var(--tc-space-1-5); min-width: 0; padding: var(--tc-space-3); border-radius: var(--tc-control-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-sdr__session-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); }
.ui-sdr__session-name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-sdr__day, .ui-sdr__usage, .ui-sdr__task-meta, .ui-sdr__none { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-sdr__meter { height: var(--tc-meter-h-sm, var(--tc-space-1-5)); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-meter-track); }
.ui-sdr__fill { display: block; height: 100%; max-width: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-sdr__session[data-full="true"] .ui-sdr__fill { background: var(--tc-status-warning-solid); }
.ui-sdr__usage { font-variant-numeric: tabular-nums; }
.ui-sdr__tasks { display: grid; gap: var(--tc-space-1-5); margin-block-start: var(--tc-space-1); list-style: none; }
.ui-sdr__task { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-hover); }
.ui-sdr__task[data-split] { box-shadow: inset var(--tc-space-0-5) 0 0 var(--tc-meter-fill); }
.ui-sdr__task-text { display: grid; min-width: 0; }
.ui-sdr__task-name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-sdr__move { width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-xs); }
.ui-sdr__move:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-sdr__waiting { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-sdr__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
@media (prefers-reduced-motion: reduce) {
  .ui-sdr__fill { transition: none; }
}
@media (forced-colors: active) {
  .ui-sdr__meter { border: 1px solid CanvasText; }
  .ui-sdr__fill { background: Highlight; }
}
`;
}

if (!customElements.get("tc-scheduled-runs")) customElements.define("tc-scheduled-runs", TcScheduledRuns);

declare global {
  interface HTMLElementTagNameMap {
    "tc-scheduled-runs": TcScheduledRuns;
  }
}
