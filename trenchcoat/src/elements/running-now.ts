import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, OffScreenController } from "./internal/controllers";
import { PopoverController } from "./internal/popover";

/*
 * <tc-running-now> – a live status of the agents' background tasks for a header or a sidebar. Closed it's one quiet
 * pill: a small ring with how far the running tasks are, and "3 running · 2 need you" – the "need you" part in the
 * attention tone, left out when nothing waits on the person; "All done" for a moment when the last one finishes, then
 * "Nothing running". Opened, a panel lists the tasks under Needs you, Running and Recently done, each with a ring that
 * fills as it goes (or turns while the agent can't tell), the task, the agent, how long it has been going, and one
 * action: Review for a task that needs the person, Stop for a running one, Open for a finished one.
 *
 *   <tc-running-now .tasks=${[{ id: "v1", title: "Check vendor records", agent: "Records agent", status: "running", progress: 0.4, started }]}>
 *   </tc-running-now>
 *
 * Unlike Background Tasks – the person's own exports and uploads, with Cancel, Retry and Clear – this is about the
 * agents: what they're doing and above all which of them is waiting on the person. The page owns the tasks; actions
 * are a cancelable tc-task-action. Elapsed times come from `started` and `now`, or the element's own clock, which
 * ticks only while the panel is open. Changes are announced politely once they settle – a task that needs the person,
 * one that finished – never a progress tick.
 *
 * Notify when done. With `notifiable`, each task still going (running or needing the person) gets a bell: pressed, the
 * person is told when it finishes – the element fires tc-notify once the page moves it to done or failed, and the
 * announcement says so. `notify` lists the watched tasks (a cancelable tc-notify-change). With `notifyChannels` –
 * "In app", "Email", "Push" – the bell opens a short list of checkboxes under the task instead, and `notifyVia` keeps
 * the channels chosen for each.
 *
 * Keyboard. The pill is a button; Enter or Space opens the panel and focus goes to the first task. ↑ ↓ Home End move
 * between tasks (one tab stop); Tab reaches the focused task's action. Escape closes the panel back to the pill.
 * Standard: a filled pill and filled rings; Clean: a hairline pill, thinner rings. The panel uses the menu surface.
 */

export type RunningTaskStatus = "running" | "needs-you" | "done" | "failed";

export type RunningTask = {
  id: string;
  /** What the task is, in a few words: "Check vendor records" */
  title: string;
  /** The agent doing it */
  agent?: string;
  status: RunningTaskStatus;
  /** 0–1 while it runs; left out, its ring turns */
  progress?: number;
  /** When it started, epoch ms – for the elapsed time */
  started?: number;
  /** When it finished, epoch ms – stops its clock */
  ended?: number;
};

export type RunningNowAction = "open" | "review" | "stop";
/** tc-notify-change: the watched tasks as they'll be, the task that changed, and its channels when there are any */
export type RunningNowNotifyChange = { notify: string[]; id: string; on: boolean; channels?: string[]; notifyVia: Record<string, string[]> };
/** tc-notify: a watched task finished */
export type RunningNowNotify = { id: string; status: "done" | "failed"; task: RunningTask; channels?: string[] };
/** tc-task-action: an action on a task. Prevented, the panel stays open */
export type RunningTaskAction = { id: string; action: RunningNowAction; task: RunningTask };
/** tc-open-change: the panel is opening or closing */
export type RunningNowOpenChange = { open: boolean };

export type RunningNowLabels = {
  needsYou: string;
  running: string;
  done: string;
  allDone: string;
  idle: string;
  empty: string;
  review: string;
  stop: string;
  open: string;
  failed: string;
  working: string;
  /** The bell's name – {task} is the task's title */
  notify: string;
  /** Above a watched task's channels – {task} is the task's title */
  notifyBy: string;
};

export const defaultRunningNowLabels: RunningNowLabels = {
  needsYou: "Needs you",
  running: "Running",
  done: "Recently done",
  allDone: "All done",
  idle: "Nothing running",
  empty: "No agent tasks right now",
  review: "Review",
  stop: "Stop",
  open: "Open",
  failed: "Failed",
  working: "Working",
  notify: "Notify me when {task} finishes",
  notifyBy: "Tell me about {task} by",
};

type Group = { key: "needs-you" | "running" | "done"; statuses: RunningTaskStatus[] };
const GROUPS: Group[] = [
  { key: "needs-you", statuses: ["needs-you"] },
  { key: "running", statuses: ["running"] },
  { key: "done", statuses: ["done", "failed"] },
];
const ACTION: Record<RunningTaskStatus, RunningNowAction> = { "needs-you": "review", running: "stop", done: "open", failed: "open" };
/** How long "All done" shows once the last task finishes, ms */
const ALL_DONE_MS = 4000;
/** How long a change must hold before it's announced, ms */
const ANNOUNCE_MS = 800;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** An elapsed time: 45s · 2m 05s · 1h 05m */
export function runningTime(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
}

/* check, x, bell, bell-ring: Lucide (ISC, lucide.dev) */
const CHECK = svg`<path d="M20 6 9 17l-5-5"/>`;
const BELL = svg`<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>`;
const BELL_ON = svg`${BELL}<path d="M22 8c0-2.3-.8-4.3-2-6"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/>`;
const CROSS = svg`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`;
const bell = (on: boolean) =>
  html`<svg class="ui-rnw__bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${on ? BELL_ON : BELL}</svg>`;
const glyph = (paths: TemplateResult) =>
  html`<svg class="ui-rnw__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

/** A small ring: filled to `p`, turning when `p` is null */
const ring = (p: number | null, cls: string) =>
  html`<svg class=${cls} viewBox="0 0 20 20" aria-hidden="true" ?data-spin=${p === null}>
    <circle class="ui-rnw__track" cx="10" cy="10" r="8"></circle>
    <circle class="ui-rnw__arc" cx="10" cy="10" r="8" pathLength="100" style=${styleMap({ strokeDashoffset: String(p === null ? 72 : 100 - Math.round(clamp01(p) * 100)) })}></circle>
  </svg>`;

let instances = 0;

/**
 * A live status of agents' background tasks for a header or sidebar – a quiet pill with how many are running and how
 * many need you, opening a panel of the tasks grouped by Needs you, Running and Recently done.
 * @tag tc-running-now
 * @fires tc-task-action - Review, Stop or Open was chosen on a task ({ id, action, task }: RunningTaskAction); cancelable – prevented, the panel stays open
 * @fires tc-open-change - The panel is opening or closing ({ open }: RunningNowOpenChange); cancelable – prevented, it stays as it is
 * @fires tc-notify-change - The bell or a channel was switched on a task ({ notify, id, on, channels, notifyVia }: RunningNowNotifyChange); cancelable – prevented, nothing changes
 * @fires tc-notify - A watched task finished ({ id, status, task, channels }: RunningNowNotify)
 */
export class TcRunningNow extends TcElement {
  static override ui = "rnw";

  /** The tasks, in any order – the panel groups them and keeps their order within a group */
  @property({ attribute: false }) accessor tasks: RunningTask[] = [];
  /** The panel's title, and the start of the pill's description */
  @property() accessor heading = "Running now";
  /** Whether the panel is open */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** The time now, epoch ms; leave it unset and the element keeps its own clock while the panel is open */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Words the page can rename, merged over defaultRunningNowLabels */
  @property({ attribute: false }) accessor labels: Partial<RunningNowLabels> = {};
  /** Offer "notify me when it's done" on the tasks still going */
  @property({ type: Boolean }) accessor notifiable = false;
  /** The tasks the person will be told about when they finish */
  @property({ attribute: false }) accessor notify: string[] = [];
  /** Ways to be told – "In app", "Email", "Push"; given, the bell opens a choice of them */
  @property({ attribute: false }) accessor notifyChannels: string[] = [];
  /** The channels chosen for each watched task, with `notifyChannels` */
  @property({ attribute: false }) accessor notifyVia: Record<string, string[]> = {};

  /** @internal The task row that holds the list's tab stop */
  @state() accessor activeId = "";
  /** @internal The polite status line */
  @state() accessor status = "";
  /** @internal "All done" is showing */
  @state() accessor allDone = false;
  /** @internal The element's own clock, while the panel is open */
  @state() accessor clock = 0;
  /** @internal The task whose channel list is open */
  @state() accessor channelsFor = "";

  private readonly uid = `tc-rnw${++instances}`;
  private known: Map<string, RunningTaskStatus> | null = null;
  private pending: string[] = [];
  private announceTimer = 0;
  private doneTimer = 0;
  private tickTimer = 0;
  private flip = false;
  private finishedWatched: RunningNowNotify[] = [];

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-rnw__pop"),
    anchor: () => this.trigger,
    side: "bottom",
    align: "end",
    kind: "dialog",
    returnFocus: () => this.trigger,
    initialFocus: () => this.row(this.activeId) ?? this.querySelector<HTMLElement>(".ui-rnw__row") ?? this.querySelector<HTMLElement>(".ui-rnw__pop"),
    tabBridge: true,
    onClose: (reason) => {
      if (reason === "api" || !this.open) return;
      if (this.emit<RunningNowOpenChange>("tc-open-change", { open: false }, { cancelable: true })) this.open = false;
      else this.pop.show();
    },
  });

  constructor() {
    super();
    new FocusRescueController(this, () => this.row(this.activeId) ?? this.querySelector(".ui-rnw__row") ?? this.querySelector(".ui-rnw__pop") ?? this.trigger);
    new OffScreenController(this, () => this.tasks.some((t) => t.status === "running"));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.announceTimer);
    clearTimeout(this.doneTimer);
    clearInterval(this.tickTimer);
    this.tickTimer = 0;
  }

  private get words(): RunningNowLabels {
    return { ...defaultRunningNowLabels, ...this.labels };
  }
  private get trigger() {
    return this.querySelector<HTMLButtonElement>(".ui-rnw__pill");
  }
  private row(id: string) {
    return id ? this.querySelector<HTMLElement>(`.ui-rnw__row[data-id="${CSS.escape(id)}"]`) : null;
  }
  /** The tasks in panel order */
  private get ordered() {
    return GROUPS.flatMap((g) => this.tasks.filter((t) => g.statuses.includes(t.status)));
  }
  private get counts() {
    const c = { running: 0, needsYou: 0, done: 0, failed: 0 };
    for (const t of this.tasks) {
      if (t.status === "running") c.running++;
      else if (t.status === "needs-you") c.needsYou++;
      else if (t.status === "done") c.done++;
      else if (t.status === "failed") c.failed++;
    }
    return c;
  }
  /** The running tasks' progress together, 0–1; null when none of them can tell */
  private get overall(): number | null {
    const running = this.tasks.filter((t) => t.status === "running");
    const known = running.filter((t) => t.progress != null);
    if (!running.length) return 1;
    if (!known.length) return null;
    return known.reduce((s, t) => s + clamp01(t.progress ?? 0), 0) / known.length;
  }

  private say(text: string) {
    // The same message twice in a row is still announced: the trailing space flips
    this.flip = !this.flip;
    this.status = `${text}${this.flip ? "" : " "}`;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("tasks")) {
      const before = this.known;
      const c = this.counts;
      if (before) {
        // What changed state since the last list: queued for one announcement once things settle
        for (const t of this.tasks) {
          const was = before.get(t.id);
          if (!was || was === t.status) continue;
          if (t.status === "needs-you") this.pending.push(`${t.title} needs you`);
          else if (t.status === "done") this.pending.push(`${t.title} done`);
          else if (t.status === "failed") this.pending.push(`${t.title} failed`);
          if ((t.status === "done" || t.status === "failed") && this.notifiable && this.notify.includes(t.id)) {
            const channels = this.notifyChannels.length ? (this.notifyVia[t.id] ?? []) : undefined;
            this.finishedWatched.push({ id: t.id, status: t.status, task: t, channels });
          }
        }
        const wasActive = [...before.values()].some((s) => s === "running" || s === "needs-you");
        if (wasActive && !c.running && !c.needsYou && this.tasks.length) {
          this.allDone = true;
          clearTimeout(this.doneTimer);
          this.doneTimer = window.setTimeout(() => (this.allDone = false), ALL_DONE_MS);
        } else if (c.running || c.needsYou) this.allDone = false;
        if (this.pending.length) {
          clearTimeout(this.announceTimer);
          this.announceTimer = window.setTimeout(() => {
            this.say(this.pending.join(". "));
            this.pending = [];
          }, ANNOUNCE_MS);
        }
      }
      this.known = new Map(this.tasks.map((t) => [t.id, t.status]));
    }
    const wantOpen = this.open;
    if (wantOpen && !this.pop.open) this.pop.show({ focus: true });
    else if (!wantOpen && this.pop.open) this.pop.close("api");
    if (!this.tasks.some((t) => t.id === this.activeId)) this.activeId = this.ordered[0]?.id ?? "";
    if (this.channelsFor && !this.tasks.some((t) => t.id === this.channelsFor && this.canNotify(t))) this.channelsFor = "";
    this.syncClock();
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    // A watched task finished: tell the page, after the update that shows it
    const done = this.finishedWatched;
    this.finishedWatched = [];
    for (const d of done) this.emit<RunningNowNotify>("tc-notify", d);
  }

  /** The own clock ticks once a second, only while the panel is open, `now` isn't given and something has a start */
  private syncClock() {
    const want = this.open && this.now === undefined && this.tasks.some((t) => t.started != null && !t.ended && (t.status === "running" || t.status === "needs-you"));
    if (want && !this.tickTimer) {
      this.clock = Date.now();
      this.tickTimer = window.setInterval(() => (this.clock = this.clock + 1000), 1000);
    } else if (!want && this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = 0;
    }
  }

  /* ---------- Actions ---------- */

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit<RunningNowOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  private act(task: RunningTask) {
    const action = ACTION[task.status];
    if (!this.emit<RunningTaskAction>("tc-task-action", { id: task.id, action, task }, { cancelable: true })) return;
    // Review and Open take the person somewhere: the panel gets out of the way
    if (action !== "stop") this.setOpen(false);
  }

  /** Tasks still going can be watched */
  private canNotify(t: RunningTask) {
    return this.notifiable && (t.status === "running" || t.status === "needs-you");
  }

  /** Switches watching a task, or one of its channels */
  private setNotify(task: RunningTask, on: boolean, channels?: string[]) {
    const notify = on ? [...this.notify.filter((id) => id !== task.id), task.id] : this.notify.filter((id) => id !== task.id);
    const notifyVia = { ...this.notifyVia };
    if (channels && channels.length) notifyVia[task.id] = channels;
    else delete notifyVia[task.id];
    const detail: RunningNowNotifyChange = { notify, id: task.id, on, notifyVia, ...(channels ? { channels } : {}) };
    if (!this.emit<RunningNowNotifyChange>("tc-notify-change", detail, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.notify = notify;
    this.notifyVia = notifyVia;
    this.say(on ? `${channels?.length ? `You'll be told by ${channels.join(", ")}` : "You'll be told"} when ${task.title} finishes` : `No longer watching ${task.title}`);
  }

  private onBell(task: RunningTask) {
    if (this.notifyChannels.length) {
      this.channelsFor = this.channelsFor === task.id ? "" : task.id;
      if (this.channelsFor) this.updateComplete.then(() => this.querySelector<HTMLInputElement>(`.ui-rnw__channels[data-id="${CSS.escape(task.id)}"] input`)?.focus());
      return;
    }
    this.setNotify(task, !this.notify.includes(task.id));
  }

  private onChannel(task: RunningTask, channel: string, checked: boolean) {
    const now = this.notifyVia[task.id] ?? [];
    const channels = this.notifyChannels.filter((c) => (c === channel ? checked : now.includes(c)));
    this.setNotify(task, channels.length > 0, channels);
  }

  private onChannelsKey(e: KeyboardEvent, task: RunningTask) {
    if (e.key !== "Escape") return;
    // The channel list closes first; the panel stays open
    e.preventDefault();
    e.stopPropagation();
    this.channelsFor = "";
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-rnw__bell[data-id="${CSS.escape(task.id)}"]`)?.focus());
  }

  /* ---------- Keyboard ---------- */

  private onListKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    if ((e.target as Element).closest(".ui-rnw__channels")) return;
    const from = (e.target as Element).closest<HTMLElement>(".ui-rnw__row");
    if (!from) return;
    const list = this.ordered;
    const at = list.findIndex((t) => t.id === from.dataset.id);
    const last = list.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : last;
    e.preventDefault();
    const id = list[to]?.id;
    if (!id) return;
    this.activeId = id;
    this.row(id)?.focus();
  };

  private onListFocus = (e: FocusEvent) => {
    const id = (e.target as Element).closest<HTMLElement>(".ui-rnw__row")?.dataset.id;
    if (id && id !== this.activeId) this.activeId = id;
  };

  /* ---------- Render ---------- */

  protected override render() {
    return html`${this.renderPill()}${this.pop.open ? this.renderPanel() : nothing}<span class="ui-rnw__sr" role="status">${this.status}</span>`;
  }

  private renderPill() {
    const w = this.words;
    const c = this.counts;
    const active = c.running + c.needsYou > 0;
    const state = c.needsYou ? "attention" : c.running ? "busy" : this.allDone ? "done" : "idle";
    const running = c.running ? html`<span class="ui-rnw__part">${c.running} running</span>` : nothing;
    const needs = c.needsYou ? html`<span class="ui-rnw__part ui-rnw__need">${c.needsYou} ${c.needsYou === 1 ? "needs" : "need"} you</span>` : nothing;
    const text = active
      ? html`${running}${c.running && c.needsYou ? html` <span class="ui-rnw__dot" aria-hidden="true">·</span><span class="ui-rnw__sr">,</span> ` : nothing}${needs}`
      : html`<span class="ui-rnw__part">${this.allDone ? w.allDone : w.idle}</span>`;
    return html`<button
      type="button"
      class="ui-rnw__pill"
      data-state=${state}
      aria-haspopup="dialog"
      aria-expanded=${this.open ? "true" : "false"}
      aria-controls=${ifDefined(this.pop.open ? `${this.uid}-panel` : undefined)}
      aria-describedby=${`${this.uid}-what`}
      @click=${() => this.setOpen(!this.open)}
    >
      ${state === "done" ? html`<span class="ui-rnw__ring ui-rnw__ring--done">${glyph(CHECK)}</span>` : ring(c.running ? this.overall : active ? 1 : 0, "ui-rnw__ring")}
      <span class="ui-rnw__text">${text}</span>
    </button><span class="ui-rnw__sr" id=${`${this.uid}-what`}>${this.heading}</span>`;
  }

  private renderPanel() {
    const w = this.words;
    const list = this.ordered;
    return html`<div class="tc-pop ui-rnw__pop" id=${`${this.uid}-panel`} role="dialog" tabindex="-1" aria-labelledby=${`${this.uid}-title`}>
      <h2 class="ui-rnw__title" id=${`${this.uid}-title`}>${this.heading}</h2>
      ${list.length
        ? html`<div class="ui-rnw__list" @keydown=${this.onListKey} @focusin=${this.onListFocus}>
            ${GROUPS.map((g) => {
              const rows = list.filter((t) => g.statuses.includes(t.status));
              if (!rows.length) return nothing;
              const hid = `${this.uid}-${g.key}`;
              const name = g.key === "needs-you" ? w.needsYou : g.key === "running" ? w.running : w.done;
              return html`<div class="ui-rnw__group" role="group" data-group=${g.key} aria-labelledby=${hid}>
                <div class="ui-rnw__label" role="heading" aria-level="3" id=${hid}>${name} <span class="ui-rnw__n">${rows.length}</span></div>
                <ul class="ui-rnw__rows" role="list">${repeat(rows, (t) => t.id, (t) => this.renderRow(t))}</ul>
              </div>`;
            })}
          </div>`
        : html`<p class="ui-rnw__empty">${w.empty}</p>`}
    </div>`;
  }

  private renderRow(t: RunningTask) {
    const w = this.words;
    const rid = `${this.uid}-t-${t.id}`;
    const tab = t.id === this.activeId ? 0 : -1;
    const now = this.now ?? this.clock;
    const elapsed = t.started != null && (t.ended != null || now) ? runningTime((t.ended ?? now) - t.started) : "";
    const pct = t.status === "running" && t.progress != null ? Math.round(clamp01(t.progress) * 100) : null;
    const meta = [t.agent, t.status === "failed" ? w.failed : t.status === "running" ? (pct == null ? w.working : `${pct}%`) : "", elapsed].filter(Boolean).join(" · ");
    const action = ACTION[t.status];
    const actionText = action === "review" ? w.review : action === "stop" ? w.stop : w.open;
    const mark =
      t.status === "done"
        ? html`<span class="ui-rnw__ring ui-rnw__ring--done">${glyph(CHECK)}</span>`
        : t.status === "failed"
          ? html`<span class="ui-rnw__ring ui-rnw__ring--failed">${glyph(CROSS)}</span>`
          : ring(t.status === "running" ? (t.progress == null ? null : t.progress) : clamp01(t.progress ?? 1), "ui-rnw__ring");
    const watchable = this.canNotify(t);
    const watched = watchable && this.notify.includes(t.id);
    const menu = watchable && this.notifyChannels.length > 0;
    const open = menu && this.channelsFor === t.id;
    const via = this.notifyVia[t.id] ?? [];
    const bellName = w.notify.replace("{task}", t.title);
    const bellBtn = watchable
      ? html`<button
          type="button"
          class="ui-rnw__bell"
          data-id=${t.id}
          data-focus-key=${t.id}
          tabindex=${tab}
          ?data-on=${watched}
          aria-pressed=${ifDefined(menu ? undefined : watched ? "true" : "false")}
          aria-expanded=${ifDefined(menu ? (open ? "true" : "false") : undefined)}
          aria-controls=${ifDefined(open ? `${rid}-ch` : undefined)}
          @click=${() => this.onBell(t)}
        >
          ${bell(watched)}<span class="ui-rnw__sr">${bellName}${menu && watched && via.length ? `: ${via.join(", ")}` : ""}</span>
        </button>`
      : nothing;
    return html`<li class="ui-rnw__row" data-id=${t.id} data-status=${t.status} ?data-bell=${watchable} data-focus-key=${t.id} tabindex=${tab} aria-labelledby=${`${rid}-l`} aria-describedby=${`${rid}-m`}>
      ${mark}
      <span class="ui-rnw__main">
        <span class="ui-rnw__name" id=${`${rid}-l`}>${t.title}</span>
        <span class="ui-rnw__meta" id=${`${rid}-m`}>${meta}</span>
      </span>
      ${bellBtn}
      <button type="button" class="ui-rnw__act" data-act=${action} ?data-primary=${action === "review"} tabindex=${tab} data-focus-key=${t.id} @click=${() => this.act(t)}>
        ${actionText}<span class="ui-rnw__sr"> ${t.title}</span>
      </button>
      ${open
        ? html`<fieldset class="ui-rnw__channels" id=${`${rid}-ch`} data-id=${t.id} @keydown=${(e: KeyboardEvent) => this.onChannelsKey(e, t)}>
            <legend class="ui-rnw__channels-title">${w.notifyBy.replace("{task}", t.title)}</legend>
            ${this.notifyChannels.map(
              (c) => html`<label class="ui-rnw__channel"
                ><input type="checkbox" tabindex=${tab} .checked=${live(via.includes(c))} @change=${(e: Event) => this.onChannel(t, c, (e.target as HTMLInputElement).checked)} />${c}</label
              >`,
            )}
          </fieldset>`
        : nothing}
    </li>`;
  }

  static override css = /* css */ `
[data-ui="rnw"] {
  --tc-rnw-ring: 16px;
  display: inline-flex;
  vertical-align: middle;
  box-sizing: border-box;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rnw"] *, [data-ui="rnw"] *::before, [data-ui="rnw"] *::after { box-sizing: border-box; }
:where([data-ui="rnw"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; }
[data-ui="rnw"] :is(button, .ui-rnw__row):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rnw__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* ---- The pill ---- */
.ui-rnw__pill {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-3) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-full);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-secondary);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *) .ui-rnw__pill { background: var(--tc-fill-default); }
:where([data-look="standard"], [data-look="standard"] *) .ui-rnw__pill:hover, :where([data-look="standard"], [data-look="standard"] *) .ui-rnw__pill[aria-expanded="true"] { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-rnw__pill { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-weight: var(--tc-font-weight-regular); }
:where([data-look="clean"], [data-look="clean"] *) .ui-rnw__pill:hover, :where([data-look="clean"], [data-look="clean"] *) .ui-rnw__pill[aria-expanded="true"] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); color: var(--tc-text-primary); }
.ui-rnw__text { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-variant-numeric: tabular-nums; }
.ui-rnw__need { color: var(--tc-status-warning-fg); }
.ui-rnw__dot { color: var(--tc-text-muted); }
.ui-rnw__pill[data-state="done"] { color: var(--tc-status-success-fg); }

/* ---- Rings ---- */
.ui-rnw__ring { display: inline-grid; flex: none; place-items: center; width: var(--tc-rnw-ring); height: var(--tc-rnw-ring); transform: rotate(-90deg); overflow: visible; }
.ui-rnw__track, .ui-rnw__arc { fill: none; stroke-width: 3; }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-rnw__track, .ui-rnw__arc) { stroke-width: 2.25; }
.ui-rnw__track { stroke: var(--tc-meter-track); }
.ui-rnw__arc { stroke: var(--tc-meter-fill); stroke-linecap: round; stroke-dasharray: 100; transition: stroke-dashoffset var(--tc-duration-slowest) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *) .ui-rnw__arc { stroke: var(--tc-surface-inverse); }
.ui-rnw__pill[data-state="attention"] .ui-rnw__arc, .ui-rnw__row[data-status="needs-you"] .ui-rnw__arc { stroke: var(--tc-status-warning-solid); }
.ui-rnw__ring[data-spin] { animation: ui-rnw-spin var(--tc-duration-shimmer) linear infinite; }
[data-offscreen] .ui-rnw__ring[data-spin] { animation-play-state: paused; }
.ui-rnw__ring--done, .ui-rnw__ring--failed { transform: none; border-radius: var(--tc-radius-full); }
.ui-rnw__ring--done { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rnw__ring--failed { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rnw__mark { width: 70%; height: 70%; }

/* ---- The panel ---- */
.ui-rnw__pop { width: min(340px, calc(100vw - var(--tc-space-4))); padding: var(--tc-space-1); }
.ui-rnw__pop:focus { outline: none; }
.ui-rnw__title { margin: 0; padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-1); font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); color: var(--tc-title-color); }
.ui-rnw__list { max-height: min(60vh, 420px); overflow-y: auto; overscroll-behavior: contain; }
.ui-rnw__group + .ui-rnw__group { margin-top: var(--tc-space-1-5); }
.ui-rnw__label {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-1-5);
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-1);
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-rnw__group[data-group="needs-you"] .ui-rnw__label { color: var(--tc-status-warning-fg); }
.ui-rnw__n { font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-rnw__rows { display: grid; gap: var(--tc-space-0-5); margin: 0; padding: 0; list-style: none; }
.ui-rnw__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: var(--tc-space-3);
  min-height: var(--tc-control-h-lg);
  padding: var(--tc-space-2) var(--tc-space-2-5);
  border-radius: var(--tc-menu-item-radius);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-rnw__row:hover { background: var(--tc-menu-item-hover); }
[data-ui="rnw"] .ui-rnw__row:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-rnw__row .ui-rnw__ring { --tc-rnw-ring: 20px; }
.ui-rnw__main { display: grid; min-width: 0; }
.ui-rnw__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *) .ui-rnw__name { font-weight: var(--tc-font-weight-regular); }
.ui-rnw__meta { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-rnw__row[data-status="failed"] .ui-rnw__meta { color: var(--tc-status-danger-fg); }
.ui-rnw__act {
  display: inline-flex;
  align-items: center;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-action-ghost-fg);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
}
.ui-rnw__act:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rnw__act[data-primary] { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-rnw__act[data-primary]:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-rnw__row[data-bell] { grid-template-columns: auto minmax(0, 1fr) auto auto; column-gap: var(--tc-space-2); }
.ui-rnw__row[data-bell] > .ui-rnw__ring { margin-right: var(--tc-space-1); }
.ui-rnw__bell { display: inline-grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-rnw__bell:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rnw__bell[data-on] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-rnw__bell-icon { width: 16px; height: 16px; }
.ui-rnw__channels { grid-column: 2 / -1; display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); min-width: 0; margin: var(--tc-space-1-5) 0 0; padding: var(--tc-space-2) var(--tc-space-2-5); border: 0; border-radius: var(--tc-radius-md); background: var(--tc-surface-well); }
.ui-rnw__channels-title { float: left; width: 100%; padding: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-rnw__channel { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-rnw__channel > input { margin: 0; accent-color: var(--tc-accent-solid); }
.ui-rnw__channel > input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rnw__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }

@keyframes ui-rnw-spin { to { transform: rotate(270deg); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="rnw"] .ui-rnw__ring[data-spin] { animation: none; }
  [data-ui="rnw"] *, .ui-rnw__pop * { transition: none; }
}
@media (forced-colors: active) {
  .ui-rnw__arc { stroke: Highlight; }
  .ui-rnw__pill { border: 1px solid CanvasText; }
  .ui-rnw__bell[data-on] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-running-now")) customElements.define("tc-running-now", TcRunningNow);

declare global {
  interface HTMLElementTagNameMap {
    "tc-running-now": TcRunningNow;
  }
}
