import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OffScreenController, RowWindowController } from "./internal/controllers";
import { PopoverController } from "./internal/popover";

/*
 * <tc-background-tasks> – the person's own long-running jobs (an export, an upload, an agent run, a reindex) at a
 * glance. Two parts:
 *   · the indicator, an icon button for the app's header: a count badge, a ring showing overall progress (spinning
 *     when the app doesn't know it), and – once nothing is running – a check when everything finished or an alert
 *     when something failed, until the person opens the panel;
 *   · the panel, a non-modal dialog that opens from it (internal/popover.ts), listing Running, Queued, Done and
 *     Failed tasks. `layout="panel"` renders the panel inline as a card, without the indicator.
 * Each task shows an icon for its kind, its label and detail, a progress bar (or "Working…"), the time left and the
 * elapsed time as the app reports them (the element reads no clock), and its actions: Cancel while running or
 * queued, Retry when failed, Open when done with a result. Clear finished removes done and failed tasks.
 *
 *   <tc-background-tasks .tasks=${[{ id: "e1", label: "Export Q3 revenue", kind: "export", status: "running", progress: 0.4 }]}>
 *   </tc-background-tasks>
 *
 * The app owns the tasks. Every action is a cancelable event (tc-task-cancel, tc-task-retry, tc-task-open,
 * tc-clear-finished) whose detail carries the list as it would be afterwards; unless a listener calls
 * preventDefault(), the element applies it to `tasks` itself (Cancel removes the task, Retry queues it again, Open
 * follows `result.href`). Finished and failed tasks are announced politely ("Export Q3 revenue ready"); progress
 * ticks aren't. More than 60 tasks are windowed (RowWindowController).
 *
 * Keyboard. The indicator is a button (aria-expanded, named with the counts); Enter or Space opens the panel and
 * focus goes to the first task. In the list, ↑ ↓ Home End move between tasks (one tab stop); Tab reaches the focused
 * task's actions, then Clear finished. Escape closes the panel and returns focus to the indicator.
 *
 * Standard sets the header on the gray tray and the list on a white card, with Clear finished on the tray below;
 * Clean is one white card with the header as its first row, quieter rows and thinner icons. In the popover both
 * use the menu surface with a plain title row (popovers carry no card header). Reduced motion stops the ring's spin
 * and the indeterminate bars.
 */

export type BackgroundTaskKind = "export" | "import" | "upload" | "download" | "agent" | "index" | "sync" | "task";
export type BackgroundTaskStatus = "queued" | "running" | "done" | "failed";

export type BackgroundTask = {
  id: string;
  /** What the job is, in a few words: "Export Q3 revenue" */
  label: string;
  status: BackgroundTaskStatus;
  /** Picks the icon (default "task") */
  kind?: BackgroundTaskKind;
  /** A quiet second line: the file, the size, the source */
  detail?: string;
  /** 0–1 while running; leave it out when the app can't tell, and the task shows "Working…" */
  progress?: number;
  /** Time left as the app estimates it, in ms */
  remaining?: number;
  /** Time spent so far (or in total, once finished), in ms */
  elapsed?: number;
  /** Why it failed – shown in place of the status */
  error?: string;
  /** What a done task produced: Open shows when it's set. With `href`, Open is a link */
  result?: { label?: string; href?: string };
  /** An icon of the app's own, cloned in place of the kind's */
  icon?: Element;
  /** false hides Cancel (some jobs can't be stopped) */
  cancelable?: boolean;
  /** false hides Retry */
  retryable?: boolean;
};

/** tc-task-cancel / tc-task-retry / tc-task-open: the task, and the whole list as it will be if the event isn't prevented */
export type BackgroundTaskActionDetail = { task: BackgroundTask; tasks: BackgroundTask[] };
/** tc-clear-finished: the tasks it removes, and the list without them */
export type BackgroundTasksClearDetail = { cleared: BackgroundTask[]; tasks: BackgroundTask[] };
/** tc-open-change: whether the panel is opening or closing */
export type BackgroundTasksOpenChange = { open: boolean };
export type BackgroundTasksLayout = "indicator" | "panel";

const SECTIONS: { status: BackgroundTaskStatus; title: string }[] = [
  { status: "running", title: "Running" },
  { status: "queued", title: "Queued" },
  { status: "done", title: "Done" },
  { status: "failed", title: "Failed" },
];
/** Above this many tasks the list renders only the rows near the viewport */
const WINDOW_FROM = 60;

let instances = 0;
const finished = (t: BackgroundTask) => t.status === "done" || t.status === "failed";
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
/** The badge's text: the active count, up to 99+ */
const badge = (n: number) => (n > 99 ? "99+" : String(n));
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** A time as the app reported it: 45s · 2m 05s · 1h 05m */
export function taskTime(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
}

/* Icons: Lucide (ISC, lucide.dev), 24×24 strokes */
const KIND_ICONS: Record<BackgroundTaskKind, TemplateResult> = {
  export: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/>`,
  import: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 12v6"/><path d="m15 15-3 3-3-3"/>`,
  upload: svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>`,
  download: svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>`,
  agent: svg`<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`,
  index: svg`<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>`,
  sync: svg`<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`,
  task: svg`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
};
/** The indicator's and the card header's icon: stacked layers – work underneath what you're doing */
const LAYERS = svg`<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>`;
const CHECK = svg`<path d="M20 6 9 17l-5-5"/>`;
const ALERT = svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>`;
const icon = (paths: TemplateResult, cls = "") =>
  html`<svg class=${`ui-bgt__svg ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

type Counts = { running: number; queued: number; done: number; failed: number; active: number; finished: number };

/**
 * The person's long-running jobs: a header indicator with overall progress, and a panel of running, queued, done
 * and failed tasks with Cancel, Retry and Open.
 * @tag tc-background-tasks
 * @fires tc-task-cancel - Cancel was chosen; detail `{ task, tasks }` (`tasks` without it). Cancelable: preventDefault() and the app cancels it
 * @fires tc-task-retry - Retry was chosen on a failed task; detail `{ task, tasks }` (`tasks` with it queued again). Cancelable: preventDefault() and the app retries it
 * @fires tc-task-open - Open was chosen on a done task; detail `{ task, tasks }`. Cancelable: preventDefault() stops a `result.href` link being followed
 * @fires tc-clear-finished - Clear finished was chosen; detail `{ cleared, tasks }` (`tasks` without the done and failed ones). Cancelable: preventDefault() and the app clears them
 * @fires tc-open-change - The panel is opening or closing; detail `{ open }`. Cancelable: preventDefault() keeps it as it is
 */
export class TcBackgroundTasks extends TcElement {
  static override ui = "bgt";

  /** The tasks, in any order – the panel groups them by status and keeps their order within a group */
  @property({ attribute: false }) accessor tasks: BackgroundTask[] = [];
  /** "indicator" (default): the header button that opens the panel; "panel": the panel inline, as a card */
  @property({ reflect: true }) accessor layout: BackgroundTasksLayout = "indicator";
  /** Whether the indicator's panel is open */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** The panel's title, and the start of the indicator's name */
  @property() accessor heading = "Background tasks";
  /** Shown in the panel when there are no tasks */
  @property({ attribute: "empty-text" }) accessor emptyText = "Nothing running in the background";
  /** What's announced when a task finishes or fails; default “<label> ready” and “<label> failed” */
  @property({ attribute: false }) accessor announce: ((task: BackgroundTask) => string) | undefined = undefined;

  /** @internal Finished tasks the person has seen in the open panel – they no longer turn the indicator to a check or an alert */
  @state() accessor seen: ReadonlySet<string> = new Set();
  /** @internal The task row that holds the list's tab stop */
  @state() accessor activeId = "";
  /** @internal The polite status line */
  @state() accessor status = "";

  private readonly uid = `tc-bgt${++instances}`;
  /** Statuses at the last update, to tell what just finished */
  private known = new Map<string, BackgroundTaskStatus>();
  private flip = false;
  private focusAfter: string | null = null;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-bgt__pop"),
    anchor: () => this.trigger,
    side: "bottom",
    align: "end",
    kind: "dialog",
    returnFocus: () => this.trigger,
    // Focus goes to the active task; Tab from the indicator reaches the open panel, and moves on past it
    initialFocus: () => this.row(this.activeId) ?? this.querySelector<HTMLElement>(".ui-bgt__row"),
    tabBridge: true,
    onClose: (reason) => {
      if (reason === "api" || !this.open) return;
      if (this.emit<BackgroundTasksOpenChange>("tc-open-change", { open: false }, { cancelable: true })) this.open = false;
      else this.pop.show();
    },
  });
  private readonly win = new RowWindowController(this, {
    count: () => this.ordered.length,
    body: () => this.querySelector<HTMLElement>(".ui-bgt__list"),
    rowSelector: ".ui-bgt__row",
    from: WINDOW_FROM,
    overscan: 10,
    rowHeight: 60,
  });

  constructor() {
    super();
    // A task that goes away (cancelled, cleared, retried into another group) never drops focus to <body>
    new FocusRescueController(this, () => this.row(this.activeId) ?? this.querySelector(".ui-bgt__row") ?? this.querySelector(".ui-bgt__pop") ?? this.trigger);
    new OffScreenController(this, () => this.counts.active > 0);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.layout === "panel" && !this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  private get trigger() {
    return this.querySelector<HTMLButtonElement>(".ui-bgt__trigger");
  }
  private row(id: string) {
    return id ? this.querySelector<HTMLElement>(`.ui-bgt__row[data-id="${CSS.escape(id)}"]`) : null;
  }

  /** The tasks grouped by section, in section order */
  private get ordered() {
    return SECTIONS.flatMap((s) => this.tasks.filter((t) => t.status === s.status));
  }

  private get counts(): Counts {
    const c = { running: 0, queued: 0, done: 0, failed: 0 };
    for (const t of this.tasks) if (t.status in c) c[t.status]++;
    return { ...c, active: c.running + c.queued, finished: c.done + c.failed };
  }

  /** Overall progress of the active tasks, 0–1: the running tasks that report progress and the queued ones (at 0).
   *  null – unknown – when tasks are running and none of them reports progress */
  private get overall(): number | null {
    const running = this.tasks.filter((t) => t.status === "running");
    const known = [...running.filter((t) => t.progress != null), ...this.tasks.filter((t) => t.status === "queued")];
    if (running.length && !running.some((t) => t.progress != null)) return null;
    if (!known.length) return 1;
    return known.reduce((sum, t) => sum + (t.status === "running" ? clamp01(t.progress ?? 0) : 0), 0) / known.length;
  }

  /** "Background tasks, 3 active (2 running, 1 queued), 1 failed" – it starts with the badge's number */
  private get indicatorName() {
    const c = this.counts;
    const active = c.active ? `${badge(c.active)} active (${[c.running && `${c.running} running`, c.queued && `${c.queued} queued`].filter(Boolean).join(", ")})` : "";
    const parts = [active, c.failed && `${c.failed} failed`, c.done && `${c.done} done`].filter(Boolean);
    return `${this.heading}, ${parts.length ? parts.join(", ") : "none"}`;
  }

  private say(text: string) {
    // The same message twice in a row is still announced: the trailing space flips
    this.flip = !this.flip;
    this.status = `${text}${this.flip ? "" : " "}`;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("tasks")) {
      // Announce the tasks that finished or failed since the last list – only ones seen before in another state, so
      // a list that arrives already finished isn't read out – and never each progress tick
      const before = this.known;
      const news = this.tasks.filter((t) => finished(t) && before.has(t.id) && before.get(t.id) !== t.status);
      if (news.length) this.say(news.map((t) => this.announce?.(t) ?? `${t.label} ${t.status === "done" ? "ready" : "failed"}`).join(". "));
      this.known = new Map(this.tasks.map((t) => [t.id, t.status]));
    }
    if (changed.has("layout") && this.layout === "panel" && !this.hasAttribute("role")) this.setAttribute("role", "region");
    // The panel follows `open` (indicator only)
    const wantOpen = this.open && this.layout === "indicator";
    if (wantOpen && !this.pop.open) this.pop.show({ focus: true });
    else if (!wantOpen && this.pop.open) this.pop.close("api");
    // While the panel is open, whatever has finished counts as seen
    if (this.pop.open || this.layout === "panel") {
      const done = this.tasks.filter(finished).map((t) => t.id);
      if (done.some((id) => !this.seen.has(id))) this.seen = new Set([...this.seen, ...done]);
    }
    if (!this.tasks.some((t) => t.id === this.activeId)) this.activeId = this.ordered[0]?.id ?? "";
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.layout === "panel" && !this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (this.focusAfter !== null) {
      const id = this.focusAfter;
      this.focusAfter = null;
      this.row(id)?.focus({ preventScroll: false });
    }
  }

  /* ---------- Actions ---------- */

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit<BackgroundTasksOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  /** The row to move to when `id` leaves the list: the next one, else the previous */
  private neighbour(id: string) {
    const list = this.ordered;
    const at = list.findIndex((t) => t.id === id);
    return list[at + 1]?.id ?? list[at - 1]?.id ?? "";
  }

  private cancel(task: BackgroundTask) {
    const tasks = this.tasks.filter((t) => t.id !== task.id);
    if (!this.emit<BackgroundTaskActionDetail>("tc-task-cancel", { task, tasks }, { cancelable: true })) return;
    if (this.contains(document.activeElement)) {
      this.activeId = this.neighbour(task.id);
      this.focusAfter = this.activeId;
    }
    this.tasks = tasks;
    this.say(`${task.label} cancelled`);
  }

  private retry(task: BackgroundTask) {
    const again: BackgroundTask = { ...task, status: "queued", progress: undefined, remaining: undefined, elapsed: undefined, error: undefined };
    const tasks = this.tasks.map((t) => (t.id === task.id ? again : t));
    if (!this.emit<BackgroundTaskActionDetail>("tc-task-retry", { task, tasks }, { cancelable: true })) return;
    if (this.contains(document.activeElement)) this.focusAfter = task.id;
    this.tasks = tasks;
    this.say(`${task.label} queued again`);
  }

  private openResult(task: BackgroundTask, e: Event) {
    if (!this.emit<BackgroundTaskActionDetail>("tc-task-open", { task, tasks: this.tasks }, { cancelable: true })) e.preventDefault();
  }

  private clearFinished() {
    const cleared = this.tasks.filter(finished);
    const tasks = this.tasks.filter((t) => !finished(t));
    if (!cleared.length || !this.emit<BackgroundTasksClearDetail>("tc-clear-finished", { cleared, tasks }, { cancelable: true })) return;
    const inside = this.contains(document.activeElement);
    this.tasks = tasks;
    this.say(`Cleared ${plural(cleared.length, "finished task")}`);
    if (inside && tasks.length) {
      this.activeId = tasks.find((t) => t.id === this.activeId)?.id ?? this.ordered[0]?.id ?? "";
      this.focusAfter = this.activeId;
    }
  }

  /* ---------- Keyboard ---------- */

  private onListKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const from = (e.target as Element).closest<HTMLElement>(".ui-bgt__row");
    if (!from) return;
    const list = this.ordered;
    const at = list.findIndex((t) => t.id === from.dataset.id);
    const last = list.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : last;
    e.preventDefault();
    const id = list[to]?.id;
    if (!id) return;
    this.activeId = id;
    const el = this.row(id);
    if (el) el.focus();
    else {
      // Outside the rendered window: bring it in, then focus it
      this.win.reveal(to);
      this.focusAfter = id;
      this.requestUpdate();
    }
  };

  private onListFocus = (e: FocusEvent) => {
    const id = (e.target as Element).closest<HTMLElement>(".ui-bgt__row")?.dataset.id;
    if (id && id !== this.activeId) this.activeId = id;
  };

  /* ---------- Render ---------- */

  protected override render() {
    const c = this.counts;
    const live = html`<span class="ui-bgt__sr" role="status">${this.status}</span>`;
    if (this.layout === "panel") {
      const head = cardHead({
        icon: LAYERS,
        title: this.heading,
        id: `${this.uid}-title`,
        aside: this.pill(c),
      });
      return html`${head}<div class="ui-bgt__card">${this.renderList(4)}</div>${this.renderFoot(c)}${live}`;
    }
    return html`${this.renderIndicator(c)}${this.pop.open ? this.renderPopover(c) : nothing}${live}`;
  }

  /** "3 active", or "2 finished" once nothing is running */
  private pill(c: Counts) {
    if (!this.tasks.length) return nothing;
    return html`<span class="ui-bgt__pill" ?data-quiet=${!c.active}>${c.active ? `${c.active} active` : `${c.finished} finished`}</span>`;
  }

  private renderIndicator(c: Counts) {
    const failedNew = this.tasks.some((t) => t.status === "failed" && !this.seen.has(t.id));
    const doneNew = this.tasks.some((t) => t.status === "done" && !this.seen.has(t.id));
    const state = c.active ? "busy" : failedNew ? "failed" : doneNew ? "done" : "idle";
    const overall = this.overall;
    const glyph = state === "failed" ? ALERT : state === "done" ? CHECK : LAYERS;
    return html`<button
      type="button"
      class="ui-bgt__trigger"
      data-state=${state}
      ?data-alert=${failedNew}
      aria-haspopup="dialog"
      aria-expanded=${this.open ? "true" : "false"}
      aria-controls=${ifDefined(this.pop.open ? `${this.uid}-panel` : undefined)}
      aria-label=${this.indicatorName}
      @click=${() => this.setOpen(!this.open)}
    >
      <svg class="ui-bgt__ring" viewBox="0 0 32 32" aria-hidden="true" ?data-spin=${state === "busy" && overall === null}>
        ${state === "busy"
          ? svg`<circle class="ui-bgt__track" cx="16" cy="16" r="14"></circle><circle class="ui-bgt__arc" cx="16" cy="16" r="14" pathLength="100" style=${`stroke-dashoffset: ${overall === null ? 72 : 100 - Math.round(overall * 100)}`}></circle>`
          : nothing}
      </svg>
      ${icon(glyph, "ui-bgt__glyph")}
      ${c.active ? html`<span class="ui-bgt__badge" aria-hidden="true">${badge(c.active)}</span>` : nothing}
    </button>`;
  }

  private renderPopover(c: Counts) {
    return html`<div class="tc-pop ui-bgt__pop" id=${`${this.uid}-panel`} role="dialog" tabindex="-1" aria-labelledby=${`${this.uid}-title`}>
      <div class="ui-bgt__phead">
        <h2 class="ui-bgt__ptitle" id=${`${this.uid}-title`}>${this.heading}</h2>
        ${this.pill(c)}
      </div>
      ${this.renderList(3)}${this.renderFoot(c)}
    </div>`;
  }

  private renderFoot(c: Counts) {
    if (!c.finished) return nothing;
    return html`<div class="ui-bgt__foot">
      <button type="button" class="ui-bgt__act ui-bgt__act--ghost ui-bgt__clear" @click=${() => this.clearFinished()}>Clear finished</button>
    </div>`;
  }

  private renderList(level: number) {
    const list = this.ordered;
    if (!list.length) return html`<p class="ui-bgt__empty">${this.emptyText}</p>`;
    const { start, end } = this.win.compute();
    const h = this.win.rowHeight;
    const shown = new Set(list.slice(start, end).map((t) => t.id));
    const c = this.counts;
    // The scroller holds the list: the window controller reads the list's top as it scrolls
    return html`<div class="ui-bgt__scroll"><div class="ui-bgt__list" @keydown=${this.onListKey} @focusin=${this.onListFocus}>
      <div class="ui-bgt__spacer" style=${styleMap({ height: `${start * h}px` })}></div>
      ${SECTIONS.map((s) => {
        const rows = list.filter((t) => t.status === s.status && shown.has(t.id));
        if (!rows.length) return nothing;
        const hid = `${this.uid}-${s.status}`;
        return html`<div class="ui-bgt__section" role="group" data-status=${s.status} aria-labelledby=${hid}>
          <div class="ui-bgt__label" role="heading" aria-level=${level} id=${hid}>${s.title} <span class="ui-bgt__n">${c[s.status]}</span></div>
          <ul class="ui-bgt__rows" role="list">
            ${repeat(rows, (t) => t.id, (t) => this.renderRow(t))}
          </ul>
        </div>`;
      })}
      <div class="ui-bgt__spacer" style=${styleMap({ height: `${(list.length - end) * h}px` })}></div>
    </div></div>`;
  }

  /** The status line: progress or Working…, time left and elapsed; Done and how long it took; the error */
  private meta(t: BackgroundTask) {
    const time = (ms: number | undefined, f: (s: string) => string) => (ms == null ? "" : f(taskTime(ms)));
    const parts =
      t.status === "running"
        ? [t.progress == null ? "Working…" : `${Math.round(clamp01(t.progress) * 100)}%`, time(t.remaining, (s) => `${s} left`), time(t.elapsed, (s) => `${s} elapsed`)]
        : t.status === "queued"
          ? ["Waiting to start"]
          : t.status === "done"
            ? ["Done", time(t.elapsed, (s) => `took ${s}`)]
            : [t.error?.trim() || "Failed", time(t.elapsed, (s) => `after ${s}`)];
    return parts.filter(Boolean).join(" · ");
  }

  private renderRow(t: BackgroundTask) {
    const rid = `${this.uid}-t-${t.id}`;
    const active = t.id === this.activeId;
    const tab = active ? 0 : -1;
    const running = t.status === "running";
    const pct = t.progress == null ? null : Math.round(clamp01(t.progress) * 100);
    const acts: TemplateResult[] = [];
    if ((t.status === "running" || t.status === "queued") && t.cancelable !== false)
      acts.push(html`<button type="button" class="ui-bgt__act ui-bgt__act--ghost" data-act="cancel" data-focus-key=${t.id} tabindex=${tab} aria-label=${`Cancel ${t.label}`} @click=${() => this.cancel(t)}>Cancel</button>`);
    if (t.status === "failed" && t.retryable !== false)
      acts.push(html`<button type="button" class="ui-bgt__act ui-bgt__act--secondary" data-act="retry" data-focus-key=${t.id} tabindex=${tab} aria-label=${`Retry ${t.label}`} @click=${() => this.retry(t)}>Retry</button>`);
    if (t.status === "done" && t.result) {
      const name = `Open ${t.result.label ?? t.label}`;
      acts.push(
        t.result.href
          ? html`<a class="ui-bgt__act ui-bgt__act--secondary" data-act="open" data-focus-key=${t.id} tabindex=${tab} href=${t.result.href} aria-label=${name} @click=${(e: Event) => this.openResult(t, e)}>Open</a>`
          : html`<button type="button" class="ui-bgt__act ui-bgt__act--secondary" data-act="open" data-focus-key=${t.id} tabindex=${tab} aria-label=${name} @click=${(e: Event) => this.openResult(t, e)}>Open</button>`,
      );
    }
    return html`<li class="ui-bgt__row" data-id=${t.id} data-status=${t.status} data-focus-key=${t.id} tabindex=${tab} aria-labelledby=${`${rid}-l`} aria-describedby=${t.detail ? `${rid}-d ${rid}-m` : `${rid}-m`}>
      <span class="ui-bgt__icon" aria-hidden="true">${t.icon ? t.icon.cloneNode(true) : icon(KIND_ICONS[t.kind ?? "task"] ?? KIND_ICONS.task)}</span>
      <div class="ui-bgt__main">
        <span class="ui-bgt__name" id=${`${rid}-l`}>${t.label}</span>
        ${t.detail ? html`<span class="ui-bgt__detail" id=${`${rid}-d`}>${t.detail}</span>` : nothing}
        ${running
          ? html`<div class="ui-bgt__bar" role="progressbar" aria-labelledby=${`${rid}-l`} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${ifDefined(pct ?? undefined)} aria-valuetext=${pct == null ? "Working" : `${pct}%`}>
              <span class="ui-bgt__fill" style=${styleMap(pct == null ? {} : { transform: `scaleX(${pct / 100})` })}></span>
            </div>`
          : nothing}
        <span class="ui-bgt__meta" id=${`${rid}-m`}>${this.meta(t)}</span>
      </div>
      ${acts.length ? html`<div class="ui-bgt__acts">${acts}</div>` : nothing}
    </li>`;
  }

  static override css = /* css */ `
[data-ui="bgt"] {
  box-sizing: border-box;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="bgt"] *, [data-ui="bgt"] *::before, [data-ui="bgt"] *::after { box-sizing: border-box; }
:where([data-ui="bgt"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; }
[data-ui="bgt"] :is(button, a, .ui-bgt__row):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-bgt__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* ---- The indicator: a ghost icon button with a ring, a glyph and a badge ---- */
[data-ui="bgt"]:not([layout="panel"]) { display: inline-flex; vertical-align: middle; }
.ui-bgt__trigger {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-radius-full);
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-bgt__trigger:hover, .ui-bgt__trigger[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-bgt__trigger[data-state="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-bgt__trigger[data-state="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-bgt__trigger > * { grid-area: 1 / 1; }
.ui-bgt__ring { width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible; }
.ui-bgt__track, .ui-bgt__arc { fill: none; stroke-width: 2; }
.ui-bgt__track { stroke: var(--tc-meter-track); }
.ui-bgt__arc {
  stroke: var(--tc-meter-fill);
  stroke-linecap: round;
  stroke-dasharray: 100;
  transition: stroke-dashoffset var(--tc-duration-slowest) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *) .ui-bgt__arc { stroke: var(--tc-surface-inverse); }
.ui-bgt__trigger[data-alert] .ui-bgt__arc { stroke: var(--tc-status-danger-solid); }
/* Progress unknown: a quarter arc goes round – it stops for reduced motion and while off screen */
.ui-bgt__ring[data-spin] { animation: ui-bgt-spin var(--tc-duration-shimmer) linear infinite; }
[data-offscreen] .ui-bgt__ring[data-spin] { animation-play-state: paused; }
.ui-bgt__glyph { width: 16px; height: 16px; }
.ui-bgt__badge {
  position: absolute;
  top: -2px;
  right: -4px;
  display: inline-grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-full);
  background: var(--tc-accent-solid);
  box-shadow: 0 0 0 2px var(--tc-surface-raised);
  color: var(--tc-text-on-accent);
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
}
.ui-bgt__trigger[data-alert] .ui-bgt__badge { background: var(--tc-status-danger-solid); }

/* ---- Icons ---- */
.ui-bgt__svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *) .ui-bgt__svg { stroke-width: 1.75; }
:where([data-look="clean"], [data-look="clean"] *) .ui-bgt__svg { stroke-width: 1.5; }

/* ---- The panel inline: Standard's tray, Clean's card ---- */
[data-ui="bgt"][layout="panel"] { display: block; width: 100%; max-width: 440px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bgt"][layout="panel"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bgt"][layout="panel"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *).ui-bgt__card {
  padding: var(--tc-space-1-5);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-bgt__card { padding: 0 var(--tc-space-1-5) var(--tc-space-1-5); }
.ui-bgt__card > .ui-bgt__scroll { max-height: var(--tc-background-tasks-max-height, none); overflow-y: auto; }

/* ---- The panel in the popover: the menu surface, a plain title row ---- */
.ui-bgt__pop { width: min(330px, calc(100vw - var(--tc-space-4))); padding: var(--tc-space-1); }
.ui-bgt__pop:focus { outline: none; }
.ui-bgt__phead { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-1); }
.ui-bgt__ptitle {
  margin: 0;
  font-size: var(--tc-title-font-size);
  font-weight: var(--tc-title-font-weight);
  line-height: var(--tc-title-line-height);
  letter-spacing: var(--tc-title-tracking);
  color: var(--tc-title-color);
}
.ui-bgt__pop > .ui-bgt__scroll { max-height: min(60vh, 420px); overflow-y: auto; overscroll-behavior: contain; }
.ui-bgt__pill {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  color: var(--tc-accent-text);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ui-bgt__pill[data-quiet] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }

/* ---- The list ---- */
.ui-bgt__scroll, .ui-bgt__list { overflow-anchor: none; }
.ui-bgt__spacer { overflow-anchor: none; }
.ui-bgt__section + .ui-bgt__section { margin-top: var(--tc-space-1-5); }
.ui-bgt__label {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-1-5);
  margin: 0;
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-1);
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-bgt__n { font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-bgt__rows { display: grid; gap: var(--tc-space-0-5); margin: 0; padding: 0; list-style: none; }
.ui-bgt__row {
  display: grid;
  /* The label and detail share the top rows with the actions; the bar and the status line run the full width */
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: "icon name acts" "icon detail acts" "icon bar bar" "icon meta meta";
  grid-template-rows: auto auto auto auto;
  align-items: start;
  column-gap: var(--tc-space-3);
  padding: var(--tc-space-2) var(--tc-space-2-5);
  border-radius: var(--tc-menu-item-radius);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-bgt__row:hover { background: var(--tc-menu-item-hover); }
[data-ui="bgt"] .ui-bgt__row:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-bgt__icon {
  grid-area: icon;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-well);
  color: var(--tc-icon-muted);
}
.ui-bgt__icon > * { width: 16px; height: 16px; }
.ui-bgt__row[data-status="running"] .ui-bgt__icon { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-bgt__row[data-status="done"] .ui-bgt__icon { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-bgt__row[data-status="failed"] .ui-bgt__icon { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *) .ui-bgt__row:not([data-status="running"], [data-status="done"], [data-status="failed"]) .ui-bgt__icon { background: transparent; box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-bgt__main { display: contents; }
.ui-bgt__name { grid-area: name; }
.ui-bgt__detail { grid-area: detail; margin-top: var(--tc-space-0-5); }
.ui-bgt__meta { grid-area: meta; margin-top: var(--tc-space-0-5); }
.ui-bgt__name, .ui-bgt__detail { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-bgt__name { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-bgt__name { font-weight: var(--tc-font-weight-regular); }
.ui-bgt__detail { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-bgt__meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.ui-bgt__row[data-status="failed"] .ui-bgt__meta { color: var(--tc-status-danger-fg); }
/* The bar: the meter recipe – ink in Standard, the accent in Clean (as progress-tracker) */
.ui-bgt__bar { grid-area: bar; position: relative; height: var(--tc-meter-h); margin: var(--tc-space-2) 0 var(--tc-space-0-5); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); overflow: hidden; }
.ui-bgt__fill {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-meter-fill);
  transform-origin: 0 50%;
  transition: transform var(--tc-duration-slowest) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *) .ui-bgt__fill { background: var(--tc-surface-inverse); }
/* Working…: a short segment slides along the track */
.ui-bgt__bar:not([aria-valuenow]) .ui-bgt__fill { right: auto; width: 40%; animation: ui-bgt-slide var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
[data-offscreen] .ui-bgt__bar .ui-bgt__fill { animation-play-state: paused; }
.ui-bgt__acts { grid-area: acts; display: flex; align-items: center; gap: var(--tc-space-1); align-self: center; margin-left: var(--tc-space-2); }

/* ---- Actions: Button's sm ghost and secondary recipes ---- */
.ui-bgt__act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-bgt__act--ghost { color: var(--tc-action-ghost-fg); }
.ui-bgt__act--ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-bgt__act--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-bgt__act--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-bgt__foot { display: flex; justify-content: flex-end; }
:where([data-look="standard"], [data-look="standard"] *)[layout="panel"] > .ui-bgt__foot { padding: var(--tc-space-1-5) 0 0; }
:where([data-look="clean"], [data-look="clean"] *)[layout="panel"] > .ui-bgt__foot { padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-bgt__pop > .ui-bgt__foot { margin-top: var(--tc-space-1); padding: var(--tc-space-1) 0 0; border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-bgt__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-md); text-align: center; }

/* Narrow: the actions drop under the text */
@container (max-width: 260px) {
  .ui-bgt__row { grid-template-areas: "icon name name" "icon detail detail" "icon bar bar" "icon meta meta" "icon acts acts"; }
  .ui-bgt__acts { justify-self: start; margin: var(--tc-space-1-5) 0 0; }
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bgt"][layout="panel"], .ui-bgt__card, .ui-bgt__pop { container-type: inline-size; }

@keyframes ui-bgt-spin { to { transform: rotate(270deg); } }
@keyframes ui-bgt-slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="bgt"] .ui-bgt__ring[data-spin], [data-ui="bgt"] .ui-bgt__fill { animation: none; }
  [data-ui="bgt"] *, [data-ui="bgt"] .ui-bgt__arc { transition: none; }
}
@media (forced-colors: active) {
  .ui-bgt__arc, .ui-bgt__fill { stroke: Highlight; background: Highlight; }
  .ui-bgt__badge { border: 1px solid CanvasText; }
  .ui-bgt__bar { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-background-tasks")) customElements.define("tc-background-tasks", TcBackgroundTasks);

declare global {
  interface HTMLElementTagNameMap {
    "tc-background-tasks": TcBackgroundTasks;
  }
}
