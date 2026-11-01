import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./segmented-control";
import type { SegmentValueChange } from "./segmented-control";

/*
 * <tc-scheduled-runs> – agent tasks placed into a week's sessions under usage limits. planRuns() fills the sessions:
 * pinned tasks first, then the rest, most important and biggest first, so small tasks fill the gaps. A task too big for
 * any one session splits across several as linked parts, and what can't fit waits in an Unscheduled list. Each session
 * has a meter with what's used in numbers and words, and each task a Move to select, so nothing depends on dragging. A
 * session without room isn't offered, so a move can't push a session over its limit.
 *   · `layout`: "calendar" (the default) lays sessions out by `day` and `time`, beside a To schedule column; "cards" lets them
 *     wrap. Sessions without either still show, and a narrow page stacks them
 *   · `mode`: Manual moves by list or by dragging a card, and a drop without room is refused with a reason. Auto plans
 *     with planRuns(), and moving is off, with a line saying why
 *   · `now` draws a line in the session whose `start` and `end` span it. The element never reads the clock
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-scheduled-runs .sessions=${sessions} .tasks=${tasks}></tc-scheduled-runs>
 */

export type ScheduledSession = {
  id: string;
  label: string;
  /** When it is, in words: "Monday" */
  day?: string;
  /** When in the day, in words: "07:00" */
  time?: string;
  /** When it starts, epoch ms, for the Now line */
  start?: number;
  /** When it ends, epoch ms, for the Now line */
  end?: number;
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
  /** Which agent runs it */
  agent?: string;
  /** One line on what it does */
  detail?: string;
  /** Small facts about it: { label: "Files", value: 48 } */
  stats?: { label: string; value: string | number }[];
  /** An icon element from the page (cloned) */
  icon?: Element;
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
/** `task` is null when the whole plan was redone, on switching to Auto */
export type ScheduledPlacementsChange = { placements: ScheduledPlacement[]; task: ScheduledTask | null };
export type ScheduledRunsLayout = "calendar" | "cards";
export type ScheduledRunsMode = "auto" | "manual";
export type ScheduledModeChange = { mode: ScheduledRunsMode };

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
  toSchedule: string;
  nothingWaiting: string;
  anyDay: string;
  mode: string;
  auto: string;
  manual: string;
  autoNote: string;
  replanned: string;
  now: string;
  /** {pct} */
  share: string;
  /** {n} */
  tasks: string;
  tasksOne: string;
  /** {session}, {left}, {unit}, {task}, {cost} */
  refused: string;
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
  toSchedule: "To schedule",
  nothingWaiting: "Nothing waiting",
  anyDay: "Any day",
  mode: "How tasks are placed",
  auto: "Auto",
  manual: "Manual",
  autoNote: "Auto is planning this week. Switch to Manual to move tasks.",
  replanned: "Planned automatically",
  now: "Now",
  share: "{pct}% of limit",
  tasks: "{n} tasks",
  tasksOne: "1 task",
  refused: "{session} has {left} {unit} left, and {task} needs {cost}.",
};

type DragState = { key: string; placement: ScheduledPlacement; startX: number; startY: number; x: number; y: number; moved: boolean; target: string | null | undefined; refused: boolean };
const DRAG_START = 4;
const placementKey = (p: ScheduledPlacement) => `${p.task}-${p.part ?? 0}`;
const GRIP = svg`<circle cx="9" cy="6" r="1.5"></circle><circle cx="15" cy="6" r="1.5"></circle><circle cx="9" cy="12" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="9" cy="18" r="1.5"></circle><circle cx="15" cy="18" r="1.5"></circle>`;
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
 * @fires tc-placements-change - A task was moved, or Auto redid the plan ({ placements, task }: ScheduledPlacementsChange); cancelable – prevented, `placements` stays as it was
 * @fires tc-mode-change - Auto or Manual was picked ({ mode }: ScheduledModeChange); cancelable – prevented, `mode` stays as it was
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
  /** "calendar" lays sessions out by day and time beside To schedule; "cards" lets them wrap */
  @property({ reflect: true }) accessor layout: ScheduledRunsLayout = "calendar";
  /** "manual" lets tasks move; "auto" plans them. Changed by the user unless a tc-mode-change listener calls preventDefault() */
  @property({ reflect: true }) accessor mode: ScheduledRunsMode = "manual";
  /** The current time, epoch ms, for the Now line. Unset, there's no line */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** What the numbers count */
  @property() accessor unit = "credits";
  /** The locale for numbers */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ScheduledRunsLabels> = {};

  @state() private accessor announce = "";
  @state() private accessor refusal = "";
  @state() private accessor drag: DragState | null = null;
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

  /** Why this can't go there, or "" when it can: the same rule that disables a session in the list */
  private refusalFor(placement: ScheduledPlacement, session: string | null, plan: ScheduledPlacement[]) {
    if (session === null || session === placement.session) return "";
    const target = this.sessions.find((s) => s.id === session);
    const task = this.tasks.find((t) => t.id === placement.task);
    if (!target || !task || plan.some((o) => o.task === placement.task && o.session === session)) return "";
    const room = target.limit - this.usedIn(session, plan);
    if (room >= placement.cost) return "";
    return this.words.refused
      .replace("{session}", target.label)
      .replace("{left}", this.num(Math.max(0, room)))
      .replace("{unit}", target.unit ?? this.unit)
      .replace("{task}", task.name)
      .replace("{cost}", this.num(placement.cost));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopDrag();
  }

  private onDragStart(e: PointerEvent, placement: ScheduledPlacement) {
    if (this.mode !== "manual" || e.button !== 0 || this.drag) return;
    const from = e.target as Element;
    if (from.closest("select")) return;
    // A finger on the card scrolls the page, so touch drags from the grip only
    if (e.pointerType === "touch" && !from.closest(".ui-sdr__grip")) return;
    this.drag = { key: placementKey(placement), placement, startX: e.clientX, startY: e.clientY, x: 0, y: 0, moved: false, target: undefined, refused: false };
    window.addEventListener("selectstart", this.onDragSelect);
    window.addEventListener("pointermove", this.onDragMove);
    window.addEventListener("pointerup", this.onDragEnd);
    window.addEventListener("pointercancel", this.stopDrag);
    window.addEventListener("keydown", this.onDragKey);
  }

  /** A drag mustn't select the text it passes over */
  private onDragSelect = (e: Event) => e.preventDefault();

  private onDragMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d) return;
    const x = e.clientX - d.startX;
    const y = e.clientY - d.startY;
    if (!d.moved && Math.hypot(x, y) < DRAG_START) return;
    e.preventDefault();
    const zone = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-drop]");
    const inside = zone && this.contains(zone);
    const target = inside ? zone.dataset.drop || null : undefined;
    this.drag = { ...d, x, y, moved: true, target, refused: target !== undefined && !!this.refusalFor(d.placement, target, this.plan) };
  };

  private onDragEnd = () => {
    const d = this.drag;
    this.stopDrag();
    if (!d?.moved || d.target === undefined) return;
    const why = this.refusalFor(d.placement, d.target, this.plan);
    if (why) {
      this.refusal = why;
      this.announce = why;
    } else this.move(d.placement, d.target);
  };

  private onDragKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.stopDrag();
  };

  private stopDrag = () => {
    this.drag = null;
    window.removeEventListener("selectstart", this.onDragSelect);
    window.removeEventListener("pointermove", this.onDragMove);
    window.removeEventListener("pointerup", this.onDragEnd);
    window.removeEventListener("pointercancel", this.stopDrag);
    window.removeEventListener("keydown", this.onDragKey);
  };

  private onMode(e: CustomEvent<SegmentValueChange>) {
    // The inner control's event stops here: the page hears tc-mode-change
    e.stopPropagation();
    const mode = e.detail.value as ScheduledRunsMode;
    if (mode === this.mode) return;
    if (!this.emit<ScheduledModeChange>("tc-mode-change", { mode }, { cancelable: true })) {
      e.preventDefault();
      return;
    }
    this.mode = mode;
    this.refusal = "";
    if (mode !== "auto") return;
    const placements = planRuns(this.sessions, this.tasks);
    if (this.emit<ScheduledPlacementsChange>("tc-placements-change", { placements, task: null }, { cancelable: true })) {
      this.placements = placements;
      this.announce = this.words.replanned;
    }
  }

  private move(placement: ScheduledPlacement, session: string | null) {
    const task = this.tasks.find((t) => t.id === placement.task);
    if (!task || placement.session === session) return;
    this.refusal = "";
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
    const manual = this.mode === "manual";
    const limit = this.sessions.find((s) => s.id === p.session)?.limit;
    const share = limit ? w.share.replace("{pct}", this.num(Math.round((p.cost / limit) * 100))) : "";
    const dragging = this.drag?.moved && this.drag.key === placementKey(p);
    return html`<li
      class="ui-sdr__task"
      data-task=${task.id}
      data-session=${p.session ?? ""}
      ?data-split=${!!p.parts}
      ?data-movable=${manual}
      ?data-dragging=${dragging}
      style=${styleMap(dragging ? { transform: `translate(${this.drag!.x}px, ${this.drag!.y}px)` } : {})}
      @pointerdown=${(e: PointerEvent) => this.onDragStart(e, p)}
    >
      <div class="ui-sdr__task-top">
        ${manual ? html`<span class="ui-sdr__grip" aria-hidden="true"><svg viewBox="0 0 24 24">${GRIP}</svg></span>` : nothing}
        ${task.icon ? html`<span class="ui-sdr__task-icon" aria-hidden="true">${task.icon.cloneNode(true)}</span>` : nothing}
        <div class="ui-sdr__task-text">
          <span class="ui-sdr__task-name">${task.name}</span>
          ${task.agent ? html`<span class="ui-sdr__task-agent">${task.agent}</span>` : nothing}
          ${task.detail ? html`<span class="ui-sdr__task-detail">${task.detail}</span>` : nothing}
          <span class="ui-sdr__task-meta">${this.num(p.cost)} ${this.unit}${part ? html` · <span class="ui-sdr__part">${part}</span>` : nothing}${task.pinned === p.session && task.pinned ? html` · ${w.pinned}` : nothing}</span>
          ${share ? html`<span class="ui-sdr__share">${share}</span>` : nothing}
          ${task.stats?.length ? html`<ul class="ui-sdr__stats">${task.stats.map((st) => html`<li class="ui-sdr__stat">${st.label} <b>${typeof st.value === "number" ? this.num(st.value) : st.value}</b></li>`)}</ul>` : nothing}
        </div>
      </div>
      <select class="ui-sdr__move" aria-label=${label} ?disabled=${!manual} @change=${(e: Event) => this.move(p, (e.target as HTMLSelectElement).value || null)}>
        ${this.sessions.map((s) => {
          const room = s.limit - this.usedIn(s.id, plan);
          const here = s.id === p.session;
          const joins = plan.some((o) => o.task === p.task && o.session === s.id);
          return html`<option value=${s.id} .selected=${live(here)} ?disabled=${!here && !joins && room < p.cost}>${s.day ? `${s.day}, ${s.label}` : s.label}</option>`;
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
    const when = [s.day, s.time].filter(Boolean).join(", ");
    const nowAt = this.now !== undefined && s.start !== undefined && s.end !== undefined && s.end > s.start && this.now >= s.start && this.now <= s.end ? ((this.now - s.start) / (s.end - s.start)) * 100 : null;
    const drag = this.drag?.moved && this.drag.target === s.id ? (this.drag.refused ? "refused" : "ok") : nothing;
    return html`<section class="ui-sdr__session" data-session=${s.id} data-drop=${s.id} data-over=${drag} data-full=${left === 0 ? "true" : "false"} aria-labelledby=${id}>
      ${nowAt !== null ? html`<div class="ui-sdr__now" style=${styleMap({ top: `${nowAt}%` })}><span class="ui-sdr__now-word">${w.now}</span></div>` : nothing}
      <div class="ui-sdr__session-head">
        <h4 class="ui-sdr__session-name" id=${id}>${s.label}${when ? html`<span class="tc-sr-only">, ${when}</span>` : nothing}</h4>
        ${when ? html`<span class="ui-sdr__day" aria-hidden="true">${when}</span>` : nothing}
      </div>
      <div class="ui-sdr__meter" role="progressbar" aria-label=${s.day ? `${s.day}, ${s.label}` : s.label} aria-valuemin="0" aria-valuemax=${s.limit} aria-valuenow=${Math.min(used, s.limit)} aria-valuetext=${words}><span class="ui-sdr__fill" style=${`width: ${pct}%`}></span></div>
      <p class="ui-sdr__usage">${words} · ${left === 0 ? w.full : w.left.replace("{left}", this.num(left)).replace("{unit}", unit)}</p>
      ${here.length ? html`<ul class="ui-sdr__tasks">${repeat(here, (p) => `${p.task}-${p.part ?? 0}`, (p) => this.renderTask(p, plan))}</ul>` : html`<p class="ui-sdr__none">${w.empty}</p>`}
    </section>`;
  }

  /** Days as columns and times as rows. Sessions without a day or a time still get a place */
  private renderCalendar(plan: ScheduledPlacement[]) {
    const w = this.words;
    const days = [...new Set(this.sessions.map((s) => s.day ?? ""))];
    const times = [...new Set(this.sessions.map((s) => s.time ?? ""))];
    const place = (column: number, row: number) => styleMap({ "--tc-sdr-column": String(column), "--tc-sdr-row": String(row) });
    return html`<div class="ui-sdr__sessions" data-layout="calendar" style=${styleMap({ "--tc-sdr-columns": `auto repeat(${days.length}, minmax(0, 1fr))` })}>
      ${days.map((d, c) => html`<div class="ui-sdr__column-head" aria-hidden="true" style=${place(c + 2, 1)}>${d || w.anyDay}</div>`)}
      ${times.map((t, r) => html`<div class="ui-sdr__row-head" aria-hidden="true" style=${place(1, r + 2)}>${t}</div>`)}
      ${days.flatMap((d, c) =>
        times.map((t, r) => {
          const here = this.sessions.filter((s) => (s.day ?? "") === d && (s.time ?? "") === t);
          return here.length ? html`<div class="ui-sdr__slot" style=${place(c + 2, r + 2)}>${repeat(here, (s) => s.id, (s) => this.renderSession(s, plan))}</div>` : nothing;
        }),
      )}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const plan = this.plan;
    const waiting = plan.filter((p) => p.session === null || !this.sessions.some((s) => s.id === p.session));
    const summary = waiting.length ? w.summary.replace("{n}", String(waiting.length)) : w.summaryAll;
    const has = this.tasks.length > 0 || this.sessions.length > 0;
    // Without any day or time there's nothing to lay out as a calendar
    const calendar = this.layout === "calendar" && this.sessions.some((s) => s.day || s.time);
    const dropOver = this.drag?.moved && this.drag.target === null ? "ok" : nothing;
    const taskCount = this.tasks.length === 1 ? w.tasksOne : w.tasks.replace("{n}", String(this.tasks.length));
    const queue = waiting.length || calendar
      ? html`<section class="ui-sdr__waiting" data-drop="" data-over=${dropOver} aria-labelledby=${`${this.uid}-waiting`}>
          <h4 class="ui-sdr__session-name" id=${`${this.uid}-waiting`}>${calendar ? w.toSchedule : w.unscheduled}</h4>
          ${waiting.length ? html`<p class="ui-sdr__usage">${w.unscheduledHelp}</p>` : html`<p class="ui-sdr__none">${w.nothingWaiting}</p>`}
          ${waiting.length ? html`<ul class="ui-sdr__tasks">${repeat(waiting, (p) => placementKey(p), (p) => this.renderTask({ ...p, session: null }, plan))}</ul>` : nothing}
        </section>`
      : nothing;
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-sdr__count">${taskCount}</span><span class="ui-sdr__summary" data-any=${waiting.length ? "true" : "false"}>${summary}</span>` })}
      <div class="ui-sdr__card">
        ${has
          ? html`<div class="ui-sdr__bar">
              <tc-segmented-control class="ui-sdr__mode" aria-label=${w.mode} size="sm" .options=${[{ value: "auto", label: w.auto }, { value: "manual", label: w.manual }]} .value=${this.mode} @tc-value-change=${this.onMode}></tc-segmented-control>
              ${this.mode === "auto" ? html`<p class="ui-sdr__auto-note">${w.autoNote}</p>` : nothing}
              ${this.refusal ? html`<p class="ui-sdr__refusal">${this.refusal}</p>` : nothing}
            </div>`
          : nothing}
        ${has
          ? html`<div class="ui-sdr__board" data-layout=${calendar ? "calendar" : "cards"}>
              ${calendar ? this.renderCalendar(plan) : html`<div class="ui-sdr__sessions">${repeat(this.sessions, (s) => s.id, (s) => this.renderSession(s, plan))}</div>`}
              ${queue}
            </div>`
          : html`<p class="ui-sdr__empty">${w.noTasks}</p>`}
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
.ui-sdr__count { margin-inline-end: var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-sdr__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) 0; }
.ui-sdr__auto-note { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-sdr__refusal { color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-sdr__board { display: grid; }
.ui-sdr__board[data-layout="calendar"] { align-items: start; }
.ui-sdr__board[data-layout="calendar"] .ui-sdr__waiting { order: -1; margin: var(--tc-space-4) 0 var(--tc-space-4) var(--tc-space-4); padding: var(--tc-space-3); border-radius: var(--tc-control-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-sdr__board[data-layout="calendar"] { grid-template-columns: minmax(10rem, 1fr) minmax(0, 4fr); }
.ui-sdr__sessions[data-layout="calendar"] { grid-template-columns: var(--tc-sdr-columns); }
.ui-sdr__column-head, .ui-sdr__row-head, .ui-sdr__slot { grid-column: var(--tc-sdr-column); grid-row: var(--tc-sdr-row); min-width: 0; }
.ui-sdr__column-head { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-sdr__row-head { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-sdr__slot { display: grid; align-content: start; gap: var(--tc-space-2); }
.ui-sdr__sessions[data-layout="calendar"] .ui-sdr__day { display: none; }
[data-drop][data-over="ok"] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); background: var(--tc-fill-hover); }
[data-drop][data-over="refused"] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-status-warning-fg); background: var(--tc-status-warning-bg); cursor: not-allowed; }
.ui-sdr__now { position: absolute; right: 0; left: 0; z-index: 1; height: 0; box-shadow: 0 0 0 var(--tc-hairline) var(--tc-status-danger-fg); pointer-events: none; }
.ui-sdr__now-word { position: absolute; top: 0; right: var(--tc-space-2); transform: translateY(-50%); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-sdr__summary { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-sdr__summary[data-any="true"] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-sdr__sessions { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-sdr__session { position: relative; display: grid; align-content: start; gap: var(--tc-space-1-5); min-width: 0; padding: var(--tc-space-3); border-radius: var(--tc-control-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-sdr__session-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); }
.ui-sdr__session-name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-sdr__day, .ui-sdr__usage, .ui-sdr__task-meta, .ui-sdr__none { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-sdr__meter { height: var(--tc-meter-h-sm, var(--tc-space-1-5)); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-meter-track); }
.ui-sdr__fill { display: block; height: 100%; max-width: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-sdr__session[data-full="true"] .ui-sdr__fill { background: var(--tc-status-warning-solid); }
.ui-sdr__usage { font-variant-numeric: tabular-nums; }
.ui-sdr__tasks { display: grid; gap: var(--tc-space-1-5); margin-block-start: var(--tc-space-1); list-style: none; }
.ui-sdr__task { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-hover); }
.ui-sdr__task[data-movable] { cursor: grab; }
.ui-sdr__task[data-dragging] { position: relative; z-index: var(--tc-z-popover); box-shadow: var(--tc-menu-shadow); background: var(--tc-menu-bg); cursor: grabbing; pointer-events: none; user-select: none; }
.ui-sdr__task-top { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); min-width: 0; }
.ui-sdr__grip { flex: none; width: var(--tc-space-3); height: var(--tc-space-4); color: var(--tc-text-muted); touch-action: none; }
.ui-sdr__grip svg { display: block; width: 100%; height: 100%; fill: currentColor; }
.ui-sdr__task-icon { display: inline-flex; flex: none; width: var(--tc-space-4); height: var(--tc-space-4); color: var(--tc-text-secondary); }
.ui-sdr__task-agent, .ui-sdr__task-detail, .ui-sdr__share { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-sdr__share { font-variant-numeric: tabular-nums; }
[data-ui="sdr"] .ui-sdr__stats { display: flex; flex-wrap: wrap; gap: 0 var(--tc-space-2); margin-block-start: var(--tc-space-0-5); list-style: none; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-sdr__stat b { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-sdr__task[data-split] { box-shadow: inset var(--tc-space-0-5) 0 0 var(--tc-meter-fill); }
.ui-sdr__task-text { display: grid; min-width: 0; }
.ui-sdr__task-name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-sdr__move { width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-xs); }
.ui-sdr__move:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-sdr__waiting { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-sdr__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
@container (max-width: 44rem) {
  .ui-sdr__board[data-layout="calendar"] { grid-template-columns: minmax(0, 1fr); }
  .ui-sdr__board[data-layout="calendar"] .ui-sdr__waiting { order: 0; margin: 0 var(--tc-space-4) var(--tc-space-4); }
  .ui-sdr__sessions[data-layout="calendar"] { grid-template-columns: minmax(0, 1fr); }
  .ui-sdr__column-head, .ui-sdr__row-head { display: none; }
  .ui-sdr__slot { grid-column: auto; grid-row: auto; }
  .ui-sdr__sessions[data-layout="calendar"] .ui-sdr__day { display: inline; }
}
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
