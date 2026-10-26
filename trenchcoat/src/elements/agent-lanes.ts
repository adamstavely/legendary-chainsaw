import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-agent-lanes> – the Lit port of src/components/agent-lanes.tsx: where every agent is right now, as a live
 * timeline. A lane per agent (avatar, name, model), its tasks as blocks along the time they took, and a "now" line on
 * the right edge; the window slides with the clock.
 *   · done tasks are quiet gray blocks, the running one grows into "now" and shimmers; tool logos lead the title
 *   · a task that waits for a person pulses amber and ends in "Needs you" – click it to Approve or Reject in place
 *   · a failed task is red; a hand-off draws a thin curve from the end of one task to the next agent's task
 *   · click any other block for a small details popover; blocks slide out of the window and fade
 * Clean is one white card with the summary bar inside it.
 *
 *   <tc-agent-lanes heading="Release crew" .agents=${agents} .tasks=${tasks} .now=${t0} rate="20"></tc-agent-lanes>
 *
 * The clock moves pixels without rendering: the timeline slides by a CSS variable every few frames, and the element
 * renders only when a label changes or a block leaves the window. It holds still while paused, hovered or focused.
 */

export type LaneAgent = {
  id: string;
  name: string;
  /** Model or role, shown under the name, e.g. "Opus 5.5" */
  model?: string;
  /** A small mark (cloned) – defaults to the initials on a soft tile */
  avatar?: Element;
};

export type LaneTaskStatus = "done" | "running" | "waiting" | "failed";

export type LaneTask = {
  id: string;
  agentId: string;
  title: string;
  status: LaneTaskStatus;
  start: number | Date;
  /** Leave it out while the task runs or waits – it then reaches "now" */
  end?: number | Date;
  /** Id of the task another agent picked up from this one – drawn as a hand-off curve */
  handoffTo?: string;
  /** What exactly needs a decision, shown above Approve / Reject */
  ask?: string;
  /** What got done so far, a few words each – shown in the details popover */
  summary?: string[];
  /** Small logos of the tools it works in (cloned), shown before the title – up to three */
  tools?: Element[];
};

/** A decision's handler. It may return a promise: the decision waits while it runs, and if it rejects the block stays
 *  as it was and the decision says so, so you can try again */
export type LaneTaskHandler = (task: LaneTask) => void | Promise<unknown>;
export type LanesExpandedChange = { expanded: string | null };
export type LanesPausedChange = { paused: boolean };
export type LanesOpen = { task: LaneTask };

/* ---------- Helpers ---------- */

const ms = (d: number | Date) => (typeof d === "number" ? d : d.getTime());
const MIN = 60_000;
const mins = (t: number) => {
  const m = Math.max(0, Math.round(t / MIN));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const STATE: Record<LaneTaskStatus, string> = { done: "Done", running: "Running", waiting: "Needs you", failed: "Failed" };
const ROW = 48;
/** What a decision is made against: when the task you pass no longer matches it, your version wins */
const versionOf = (t: LaneTask) => `${t.status}|${ms(t.start)}|${t.end !== undefined ? ms(t.end) : ""}`;
/** Wall time – read only in lifecycle callbacks, timers and handlers, never during render */
const wall = () => Date.now();

const curvePath = (x1: number, y1: number, x2: number, y2: number) => {
  const bend = Math.max(24, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
};
/** Where a moment sits in the window, 0–100, as CSS: `left` is its place on the fixed timeline, and --t is how far that
 *  timeline has slid – "now" is always 100 */
const xCss = (left: number | "now") => (left === "now" ? "100" : `min(100, ${left} - var(--t, 0))`);

/* ---------- Icons ---------- */

const sparkIcon = html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${svg`<path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor"></path><circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55"></circle>`}</svg>`;
const failIcon = html`<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">${svg`<path d="M2.5 2.5l5 5M7.5 2.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>`}</svg>`;
const pauseIcon = (paused: boolean) =>
  html`<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${paused ? svg`<path d="M3.5 2.2v7.6L9.8 6 3.5 2.2Z" fill="currentColor"></path>` : svg`<path d="M3.5 2.5v7M8.5 2.5v7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>`}</svg>`;
const handIcon = html`<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${svg`<path d="M6 1.8 10.8 10H1.2L6 1.8Z" fill="currentColor"></path>`}</svg>`;

type Curve = { id: string; d: string; live: boolean; fromNow: boolean; y1: number; x2: number; y2: number };
type Busy = { id: string; state: "pending" | "error" } | null;

let instances = 0;

/**
 * Every agent as a lane on a live timeline, with decisions in place.
 * @tag tc-agent-lanes
 * @fires tc-expanded-change - A block's decision or details open or close ({ expanded: string | null }); cancelable
 * @fires tc-paused-change - The Pause button holds or resumes the timeline ({ paused: boolean }); cancelable
 * @fires tc-open - "Open" in a block's details was pressed ({ task: LaneTask }); shown when `openable` is set
 */
export class TcAgentLanes extends TcElement {
  static override ui = "al";

  @property({ attribute: false }) accessor agents: LaneAgent[] = [];
  /** The tasks – always the source of truth. After Approve or Reject the block shows the result right away; as soon as
   *  you pass that task with a new status, start or end, your version wins */
  @property({ attribute: false }) accessor tasks: LaneTask[] = [];
  /** How much time the lanes show, in ms (default 30 minutes) */
  @property({ type: Number }) accessor span = 30 * MIN;
  /** A clock you control, in epoch ms. Without it the lanes follow real time */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** How fast the clock runs, in clock ms per real ms: on from `now` when set (default 0), from real time otherwise
   *  (default 1) */
  @property({ type: Number }) accessor rate: number | undefined = undefined;
  /** Called on Approve – may return a promise the decision waits for */
  @property({ attribute: false }) accessor onApprove: LaneTaskHandler | undefined = undefined;
  /** Called on Reject – may return a promise the decision waits for */
  @property({ attribute: false }) accessor onReject: LaneTaskHandler | undefined = undefined;
  /** Shows "Open" in a block's details; pressing it fires tc-open */
  @property({ type: Boolean }) accessor openable = false;
  /** Whether the timeline is held still. Changed by the Pause button unless a tc-paused-change listener calls
   *  preventDefault(). The lanes also hold still while the pointer or focus is on them (WCAG 2.2.2) */
  @property({ type: Boolean, reflect: true }) accessor paused = false;
  /** The id of the block whose decision or details are open (null: none). Changed by the user unless a
   *  tc-expanded-change listener calls preventDefault() */
  @property({ attribute: false }) accessor expanded: string | null = null;
  /** The title on the summary bar */
  @property() accessor heading = "Agents";

  @state() private accessor reading: { for: number | undefined; at: number } = { for: undefined, at: 0 };
  @state() private accessor fixedOrigin: number | undefined = undefined;
  @state() private accessor local: Record<string, { version: string; status: LaneTaskStatus; end?: number }> = {};
  @state() private accessor busy: Busy = null;
  @state() private accessor hovered = false;
  @state() private accessor focused = false;
  @state() private accessor onScreen = true;

  private readonly uid = `tc-al${++instances}`;
  /** `at` clock ms at wall ms `wall`, moving at `speed` */
  private anchor = { at: 0, wall: 0, speed: 0 };
  private lastProp: number | undefined = undefined;
  private originSet = false;
  /** What the last render drew, for the frame loop */
  private drawn: { origin: number; curves: Curve[]; nextAt: number; ready: boolean } = { origin: 0, curves: [], nextAt: Infinity, ready: false };
  private lastState: Record<string, string> = {};
  private raf = 0;
  private lastPaint = 0;
  private loopSpeed = 0;
  private visible = true;
  private io?: IntersectionObserver;
  private nextTimer: number | undefined;
  private nextKey = "";
  private wasHeld = false;
  private awayOn: string | null = null;
  private askShown: Element | null = null;

  constructor() {
    super();
    // A block that leaves while focused (or a decision that closes) hands focus to a stable place
    new FocusRescueController(this, () => this.querySelector(".ui-al__block") ?? this.querySelector(".ui-al__pause"));
    this.addEventListener("keydown", (e) => {
      const opened = this.expanded;
      if (e.key === "Escape" && opened) {
        e.stopPropagation();
        this.blockOf(opened)?.focus();
        this.setExpanded(null);
      }
    });
  }

  /* ---------- The clock: yours (`now`, run on at `rate`) or real time ---------- */

  private get speed() {
    return Math.max(0, this.rate ?? (this.now === undefined ? 1 : 0));
  }
  private read = () => {
    const a = this.anchor;
    return a.at + (wall() - a.wall) * a.speed;
  };
  /** Renders again with a fresh reading */
  private take = () => {
    this.reading = { for: this.lastProp, at: this.read() };
  };
  private get clockNow() {
    const nowProp = this.now;
    return nowProp !== undefined && (this.speed === 0 || this.reading.for !== nowProp) ? nowProp : this.reading.at;
  }
  private get ready() {
    return this.now !== undefined || this.reading.at > 0;
  }
  private get held() {
    return this.paused || this.hovered || this.focused;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((entries) => {
        this.visible = entries[entries.length - 1].isIntersecting;
        this.wake();
      });
      this.io.observe(this);
    }
    document.addEventListener("visibilitychange", this.wake);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
    this.io = undefined;
    document.removeEventListener("visibilitychange", this.wake);
    this.stopLoop();
    window.clearTimeout(this.nextTimer);
    this.nextTimer = undefined;
    this.nextKey = "";
    if (this.awayOn) document.removeEventListener("pointerdown", this.away);
    this.awayOn = null;
  }

  private wake = () => {
    const show = this.visible && !document.hidden;
    if (show === this.onScreen) return;
    this.onScreen = show;
    // Back on screen: catch up on whatever changed meanwhile
    if (show && !this.held && this.speed > 0) this.take();
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const speed = this.speed;
    if (this.anchor.wall === 0 || changed.has("now") || speed !== this.anchor.speed) {
      const w = wall();
      // A new `now` restarts the clock from it; a new rate carries on from where the clock is
      const at = this.now !== this.lastProp || this.anchor.wall === 0 ? (this.now ?? w) : this.read();
      this.lastProp = this.now;
      this.anchor = { at, wall: w, speed };
      if (this.now === undefined && !(this.reading.at > 0)) this.reading = { for: undefined, at };
    }
    // Blocks and curves sit on a fixed timeline that starts at the first reading
    if (!this.originSet && (this.fixedOrigin !== undefined || this.ready)) {
      this.originSet = true;
      if (this.fixedOrigin === undefined) this.fixedOrigin = this.now ?? this.clockNow;
    }
    // Loops stop with the timeline: paused, hovered, focused or off screen
    this.toggleAttribute("data-still", this.held || !this.onScreen || speed === 0);
  }

  protected override updated() {
    const list = this.list();
    // The tag keeps its last word while it fades out
    for (const a of this.agents) {
      const b = list.find((t) => t.agentId === a.id && (t.status === "running" || t.status === "waiting"));
      if (b?.status === "waiting") this.lastState[a.id] = "Needs you";
      else if (!b) this.lastState[a.id] = "Idle";
    }
    // Held: the picture stays where it is; letting go catches up with the clock
    const held = this.held;
    const speed = held ? 0 : this.speed;
    if (this.wasHeld && !held && this.speed > 0) queueMicrotask(() => this.isConnected && this.take());
    this.wasHeld = held;
    // Pixels every frame (or every quarter second at real time) while the clock runs and the lanes are on screen
    if (speed > 0 && this.onScreen) this.startLoop(speed);
    else this.stopLoop();
    // The next render: when a duration label changes or a block leaves the window
    const nextAt = this.drawn.nextAt;
    const key = speed === 0 || !this.onScreen || !Number.isFinite(nextAt) ? "" : `${nextAt}|${speed}`;
    if (key !== this.nextKey) {
      this.nextKey = key;
      window.clearTimeout(this.nextTimer);
      this.nextTimer = key ? window.setTimeout(this.take, Math.max(0, (nextAt - this.read()) / speed) + 1) : undefined;
    }
    // A click anywhere else closes the details or decision
    if (this.expanded !== this.awayOn) {
      if (this.awayOn) document.removeEventListener("pointerdown", this.away);
      this.awayOn = this.expanded;
      if (this.awayOn) document.addEventListener("pointerdown", this.away);
    }
    // A decision that opens takes the focus on Approve
    const ask = this.querySelector(".ui-al__ask");
    if (ask && ask !== this.askShown) this.querySelector<HTMLElement>(".ui-al__btn--primary")?.focus();
    this.askShown = ask;
  }

  private startLoop(speed: number) {
    if (this.raf && this.loopSpeed === speed) return;
    this.stopLoop();
    this.loopSpeed = speed;
    // Real time moves a 30-minute window by a pixel every few seconds: a quarter second is plenty; faster clocks every frame
    const gap = Math.min(250, 250 / speed);
    this.lastPaint = 0;
    const frame = () => {
      this.raf = 0;
      if (!this.visible || document.hidden) return;
      const w = wall();
      if (w - this.lastPaint >= gap) {
        this.lastPaint = w;
        this.paint(this.read());
      }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
  private stopLoop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.loopSpeed = 0;
  }

  /** Pixels between renders: slide the timeline, stretch the curves that start at "now" */
  private paint(clockNow: number) {
    const track = this.querySelector<HTMLElement>(".ui-al__track");
    const { origin, curves, ready } = this.drawn;
    if (!track || !ready) return;
    const shift = ((clockNow - origin) / this.span) * 100;
    track.style.setProperty("--t", String(shift));
    for (const c of curves) {
      if (!c.fromNow) continue;
      track.querySelector(`path[data-curve="${CSS.escape(c.id)}"]`)?.setAttribute("d", curvePath((shift + 100) * 10, c.y1, c.x2, c.y2));
    }
  }

  /* ---------- Changes ---------- */

  private setExpanded(next: string | null) {
    if (next === this.expanded) return;
    if (this.emit<LanesExpandedChange>("tc-expanded-change", { expanded: next }, { cancelable: true })) this.expanded = next;
  }
  private setPaused(next: boolean) {
    if (this.emit<LanesPausedChange>("tc-paused-change", { paused: next }, { cancelable: true })) this.paused = next;
  }
  private away = (e: PointerEvent) => {
    const opened = this.expanded;
    if (opened && !(e.target as HTMLElement).closest?.(`[data-task="${CSS.escape(opened)}"], .ui-al__pop`)) this.setExpanded(null);
  };
  private blockOf(id: string) {
    return this.querySelector<HTMLElement>(`[data-task="${CSS.escape(id)}"]`);
  }
  /** Closes the decision: focus goes back to its block first, never to <body> (2.4.3) */
  private closeDecision(id: string) {
    rescueFocus(this.querySelector(".ui-al__pop"), [this.blockOf(id)]);
    this.setExpanded(null);
  }

  /** The tasks with decisions applied: a decision shows its result until the task you pass changes */
  private list() {
    const local = this.local;
    return this.tasks.map((t) => {
      const o = local[t.id];
      return o && o.version === versionOf(t) ? { ...t, status: o.status, end: o.end ?? t.end } : t;
    });
  }

  // Every decision is reported. A handler that returns a promise keeps the decision open (its buttons wait) until it
  // settles; a rejection leaves the block as it was, with a note
  private decide(t: LaneTask, ok: boolean) {
    if (this.busy?.state === "pending") return;
    const original = this.tasks.find((x) => x.id === t.id) ?? t;
    const apply = (at: number) => {
      this.closeDecision(t.id);
      this.local = { ...this.local, [t.id]: ok ? { version: versionOf(original), status: "running" } : { version: versionOf(original), status: "failed", end: at } };
    };
    const handler = ok ? this.onApprove : this.onReject;
    const done = handler?.(t);
    if (done && typeof (done as Promise<unknown>).then === "function") {
      this.busy = { id: t.id, state: "pending" };
      (done as Promise<unknown>).then(
        () => {
          if (!this.isConnected) return;
          this.busy = null;
          apply(this.read());
        },
        () => {
          if (this.isConnected) this.busy = { id: t.id, state: "error" };
        },
      );
      return;
    }
    this.busy = null;
    apply(this.read());
  }

  /* ---------- Render ---------- */

  private bar(running: number, needs: number) {
    const paused = this.paused;
    return html`<header class="ui-al__bar">
      <span class="ui-al__spark">${sparkIcon}</span>
      <span class="ui-al__title">${this.heading}</span>
      <span class="ui-al__summary"><span data-kind="running">${running} running</span>${needs > 0 ? html`<span data-kind="needs">${needs} need you</span>` : nothing}</span>
      <span class="ui-al__window">Last ${mins(this.span)}</span>
      ${this.speed > 0
        ? // One button for both states, so focus stays on it (2.2.2)
          html`<button type="button" class="ui-al__pause" aria-pressed=${paused ? "true" : "false"} aria-label="Pause timeline" title=${paused ? "Resume timeline" : "Pause timeline"} @click=${() => this.setPaused(!this.paused)}>${pauseIcon(paused)}</button>`
        : nothing}
    </header>`;
  }

  private agentColumn(list: LaneTask[]) {
    return html`<ul class="ui-al__agents">
      ${repeat(
        this.agents,
        (a) => a.id,
        (a) => {
          const busy = list.find((t) => t.agentId === a.id && (t.status === "running" || t.status === "waiting"));
          return html`<li class="ui-al__agent" title=${a.name}>
            <span class="ui-al__avatar" ?data-logo=${!!a.avatar}>${a.avatar ? a.avatar.cloneNode(true) : initials(a.name)}</span>
            <span class="ui-al__who" data-state=${busy?.status ?? "idle"}>
              <span class="ui-al__name-line">
                <span class="ui-al__name">${a.name}</span>
                <span class="ui-al__state" ?data-show=${busy?.status !== "running"} aria-hidden=${busy?.status === "running" ? "true" : "false"}><span>${busy?.status === "waiting" ? "Needs you" : busy ? (this.lastState[a.id] ?? "Idle") : "Idle"}</span></span>
              </span>
              <span class="ui-al__model">${a.model ? html`<span class="ui-al__model-name">${a.model}</span>` : nothing}</span>
            </span>
          </li>`;
        },
      )}
    </ul>`;
  }

  private block(agent: LaneAgent, t: LaneTask, now: number, left: number, open: boolean, popId: string | undefined) {
    const live = t.end === undefined;
    const end = live ? now : ms(t.end!);
    const took = mins(end - ms(t.start));
    // A block that reaches "now" grows with the sliding timeline: its right edge is drawn from --t, not from a render
    const width = live ? `calc((var(--t, 0) + ${100 - left}) * 1%)` : `${((end - ms(t.start)) / this.span) * 100}%`;
    return html`<li class="ui-al__slot" data-status=${t.status} style=${styleMap({ left: `${left}%`, width })}>
      <button
        type="button"
        data-task=${t.id}
        class="ui-al__block"
        data-status=${t.status}
        ?data-open=${open}
        data-focus-key=${t.id}
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${ifDefined(open ? popId : undefined)}
        title=${t.title}
        aria-label=${`${agent.name}: ${t.title} – ${STATE[t.status]}${t.status === "done" ? `, took ${took}` : `, ${took}`}`}
        @click=${() => this.setExpanded(open ? null : t.id)}
      >${t.tools && t.tools.length > 0 ? html`<span class="ui-al__tools" aria-hidden="true">${t.tools.slice(0, 3).map((tool) => html`<span class="ui-al__tool">${tool.cloneNode(true)}</span>`)}</span>` : nothing}${
        /* Failed is also a mark, not only red (1.4.1); running has its edge, waiting its flag */
        t.status === "failed" ? html`<span class="ui-al__mark" aria-hidden="true">${failIcon}</span>` : nothing
      }<span class="ui-al__label">${t.title}</span></button>
      ${t.status === "waiting" ? html`<span class="ui-al__flag" aria-hidden="true">${handIcon}Needs you</span>` : nothing}
    </li>`;
  }

  /** The open block's decision (waiting) or a small details popover under (or over) the visible part of the block */
  private popFor(task: LaneTask, agent: LaneAgent | undefined, lane: number, up: boolean, id: string | undefined, now: number, at: (t: number) => number) {
    const end = task.end === undefined ? now : ms(task.end);
    const endX = xCss(task.end === undefined ? "now" : at(end));
    const top = `${up ? lane * ROW + 6 : (lane + 1) * ROW - 6}px`;
    const busy = this.busy;
    if (task.status === "waiting") {
      const pending = busy?.id === task.id && busy.state === "pending";
      return html`<div class="ui-al__pop ui-al__ask" id=${ifDefined(id)} role="dialog" aria-label=${`Decide: ${task.title}`} ?data-up=${up} style=${styleMap({ top, right: `calc((100 - ${endX}) * 1%)` })}>
        <span class="ui-al__ask-title">${task.title}</span>
        ${task.ask ? html`<span class="ui-al__ask-text">${task.ask}</span>` : nothing}
        ${busy?.id === task.id && busy.state === "error" ? html`<span class="ui-al__error" role="alert">Didn't go through – try again</span>` : nothing}
        <span class="ui-al__ask-actions" aria-busy=${ifDefined(pending ? "true" : undefined)}>
          <button type="button" class="ui-al__btn" ?disabled=${pending} @click=${() => this.decide(task, false)}>Reject</button>
          <button type="button" class="ui-al__btn ui-al__btn--primary" ?disabled=${pending} @click=${() => this.decide(task, true)}>Approve</button>
        </span>
      </div>`;
    }
    const mid = `calc((max(0, ${xCss(at(ms(task.start)))}) + ${endX}) * 0.5%)`;
    // Not a role=tooltip: it can hold the Open button. The block's aria-expanded / aria-controls point here
    return html`<div class="ui-al__pop ui-al__tip" id=${ifDefined(id)} role="group" aria-label=${`${task.title} – details`} ?data-up=${up} style=${styleMap({ top, left: `clamp(14%, ${mid}, 86%)` })}>
      <span class="ui-al__tip-head">${agent?.name} · ${STATE[task.status]} · ${mins(end - ms(task.start))}</span>
      ${task.summary?.length ? html`<ul class="ui-al__tip-list">${task.summary.map((line) => html`<li>${line}</li>`)}</ul>` : html`<span class="ui-al__tip-title">${task.title}</span>`}
      ${this.openable ? html`<button type="button" class="ui-al__tip-open" @click=${() => this.emit<LanesOpen>("tc-open", { task })}>Open</button>` : nothing}
    </div>`;
  }

  protected override render() {
    const agents = this.agents;
    const span = this.span;
    const list = this.list();
    const ready = this.ready;
    const now = this.clockNow;
    const from = now - span;
    const origin = this.fixedOrigin ?? now;
    const at = (t: number) => ((t - origin) / span) * 100 + 100;
    const shiftAt = (t: number) => ((t - origin) / span) * 100;
    // Nothing is placed until the clock is known
    const visible = ready ? list.filter((t) => (t.end === undefined ? now : ms(t.end)) > from) : [];

    // Ticks every 5 minutes (every 15 past an hour's window), labelled relative to now
    const step = span > 60 * MIN ? 15 * MIN : span > 20 * MIN ? 5 * MIN : MIN;
    const ago: number[] = [];
    for (let t = span - step; t > 0; t -= step) ago.push(t);

    // Hand-offs: from the end of one block to the start of the next agent's block. One that leaves a running block
    // starts at "now", so the frame loop redraws it
    const row = (agentId: string) => agents.findIndex((a) => a.id === agentId);
    const curves: Curve[] = visible.flatMap((t) => {
      const next = t.handoffTo ? list.find((n) => n.id === t.handoffTo) : undefined;
      if (!next) return [];
      const x1 = at(t.end === undefined ? now : ms(t.end)) * 10;
      const x2 = at(ms(next.start)) * 10;
      const y1 = row(t.agentId) * ROW + ROW / 2;
      const y2 = row(next.agentId) * ROW + ROW / 2;
      if (y1 < 0 || y2 < 0) return [];
      return [{ id: `${t.id}>${next.id}`, d: curvePath(x1, y1, x2, y2), live: next.status === "running", fromNow: t.end === undefined, y1, x2, y2 }];
    });
    // The next moment render has something new to say: a duration label rounds to the next minute, or a block leaves
    let nextAt = Infinity;
    for (const t of visible) {
      if (t.end !== undefined) nextAt = Math.min(nextAt, ms(t.end) + span);
      else nextAt = Math.min(nextAt, ms(t.start) + (Math.max(0, Math.floor((now - ms(t.start)) / MIN + 0.5)) + 0.5) * MIN);
    }
    this.drawn = { origin, curves, nextAt, ready };

    const opened = this.expanded;
    const openTask = visible.find((t) => t.id === opened);
    // DOM ids come from the element and the block's place, never from the task's own id
    const popId = openTask ? `${this.uid}-${visible.indexOf(openTask)}` : undefined;
    const needs = list.filter((t) => t.status === "waiting").length;
    const running = list.filter((t) => t.status === "running").length;
    const look = this.resolvedLook;
    // The summary bar: on the tray above the card (Standard) or inside the card, on top (Clean)
    const bar = this.bar(running, needs);
    const openLane = openTask ? row(openTask.agentId) : -1;

    return html`
      ${look === "standard" ? bar : nothing}
      <div class="ui-al__card">
        ${look === "clean" ? bar : nothing}
        <div
          class="ui-al__body"
          style=${styleMap({ "--rows": String(agents.length) })}
          @focusin=${() => (this.focused = true)}
          @focusout=${(e: FocusEvent) => !(e.currentTarget as Element).contains(e.relatedTarget as Node | null) && (this.focused = false)}
        >
          ${this.agentColumn(list)}
          <div
            class="ui-al__track"
            style=${styleMap({ "--t": String(shiftAt(now)) })}
            @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hovered = true)}
            @pointerleave=${() => (this.hovered = false)}
          >
            <div class="ui-al__grid" aria-hidden="true">
              ${ago.map((a) => html`<span class="ui-al__tick" style=${styleMap({ left: `${100 - (a / span) * 100}%` })}><span>−${mins(a)}</span></span>`)}
            </div>
            <div class="ui-al__clip">
              <div class="ui-al__layer">
                <svg class="ui-al__curves" viewBox=${`0 0 1000 ${agents.length * ROW}`} preserveAspectRatio="none" aria-hidden="true">
                  ${repeat(
                    curves,
                    (c) => c.id,
                    (c) => svg`<path d=${c.d} data-curve=${ifDefined(c.fromNow ? c.id : undefined)} ?data-live=${c.live} vector-effect="non-scaling-stroke"></path>`,
                  )}
                </svg>
                ${repeat(
                  agents,
                  (a) => a.id,
                  (a, i) => html`<ul class="ui-al__lane" style=${styleMap({ top: `${i * ROW}px` })} aria-label=${`${a.name}'s tasks`}>
                    ${repeat(
                      visible.filter((t) => t.agentId === a.id),
                      (t) => t.id,
                      (t) => this.block(a, t, now, at(ms(t.start)), opened === t.id, popId),
                    )}
                  </ul>`,
                )}
              </div>
            </div>
            ${openTask ? this.popFor(openTask, agents[openLane], openLane, openLane >= agents.length / 2, popId, now, at) : nothing}
            <span class="ui-al__now" aria-hidden="true"><span>now</span></span>
          </div>
        </div>
      </div>
      <span class="ui-al__sr" aria-live="polite">${needs > 0 ? `${needs} task${needs === 1 ? "" : "s"} need you` : `${running} running`}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="al"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="al"] {
  /* The running block: a blue tint, its text and its leading edge */
  --tc-agent-lanes-run-bg: light-dark(rgba(47, 107, 255, 0.1), #0077ff3a);
  --tc-agent-lanes-run-fg: light-dark(#2f6bff, #70b8ff);
  --tc-agent-lanes-run-edge: light-dark(rgba(47, 107, 255, 0.55), rgba(112, 184, 255, 0.6));
  /* The curves that link a hand-off to the lane it starts */
  --tc-agent-lanes-rail: light-dark(#c4c4c8, rgba(255, 255, 255, 0.2));
  --tc-agent-lanes-row: ${ROW}px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  /* The tray recipe: the summary on the tray, the lanes on the card */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="al"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="al"] {
  /* The running block: a blue tint, its text and its leading edge (after the Radix scales) */
  --tc-agent-lanes-run-bg: light-dark(#008ff519, #0077ff3a);
  --tc-agent-lanes-run-fg: light-dark(#006dcbf2, #70b8ff);
  --tc-agent-lanes-run-edge: light-dark(rgba(0, 96, 226, 0.5), rgba(112, 184, 255, 0.6));
  /* The curves that link a hand-off to the lane it starts */
  --tc-agent-lanes-rail: light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.2));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-agent-lanes-row: ${ROW}px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="al"] *, [data-ui="al"] *::before, [data-ui="al"] *::after { box-sizing: border-box; }
:where([data-ui="al"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="al"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: 1px; }
[data-ui="al"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="al"] svg { display: block; flex: none; }
.ui-al__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card holds the lanes */
.ui-al__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
/* ----- Bar ----- */
/* ----- On the tray: what is going on ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-al__bar { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3-5); }
/* One white card – the edge is a shadow, not a border */
/* ----- Bar ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-al__bar { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-3-5) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-al__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent); }
:where([data-look="standard"], [data-look="standard"] *).ui-al__title { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-al__title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); white-space: nowrap; }
.ui-al__summary { display: flex; flex: 1; gap: var(--tc-space-3); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-al__summary span { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-al__summary span::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-agent-lanes-run-fg); }
.ui-al__summary [data-kind="needs"] { color: var(--tc-status-warning-fg); }
.ui-al__summary [data-kind="needs"]::before { background: var(--tc-status-warning-fg); animation: ui-al-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-al__window { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__window { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
/* Pause: a square ghost icon button at the end of the bar */
.ui-al__pause { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: -2px 0; border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-al__pause:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-al__pause[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }
/* ----- Lanes ----- */
.ui-al__body { display: grid; grid-template-columns: 168px minmax(0, 1fr); padding: 26px var(--tc-space-4) var(--tc-space-3) 0; }
.ui-al__agents { display: grid; grid-auto-rows: var(--tc-agent-lanes-row); }
.ui-al__agent { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; padding: 0 var(--tc-space-3) 0 var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-al__avatar { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__avatar { color: var(--tc-text-secondary); }
/* Agents are rounded squares (people would be circles) – the avatar pattern */
.ui-al__avatar { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); overflow: hidden; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-fill-default); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); letter-spacing: 0.3px; }
/* A logo sits on a small white tile */
.ui-al__avatar[data-logo] { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-al__avatar > svg { width: 14px; height: 14px; }
.ui-al__who { display: grid; min-width: 0; }
.ui-al__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-al__name-line { display: flex; align-items: center; min-width: 0; }
.ui-al__model { display: flex; align-items: center; min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-al__model-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
/* The state tag: collapses to nothing while the agent works, fades in when it is free or waits */
.ui-al__state { display: inline-grid; flex: none; grid-template-columns: 0fr; margin-left: 0; opacity: 0; transition: grid-template-columns var(--tc-duration-slow) var(--tc-ease-standard), margin-left var(--tc-duration-slow) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-al__state[data-show] { grid-template-columns: 1fr; margin-left: var(--tc-space-1-5); opacity: 1; transition: grid-template-columns var(--tc-duration-slow) var(--tc-ease-standard), margin-left var(--tc-duration-slow) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard) var(--tc-duration-instant); }
:where([data-look="standard"], [data-look="standard"] *).ui-al__state > span { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__state > span { color: var(--tc-text-secondary); }
.ui-al__state > span { min-width: 0; overflow: hidden; padding: 0 var(--tc-space-1); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-al__who[data-state="waiting"] .ui-al__state > span { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-al__track { position: relative; height: calc(var(--rows) * var(--tc-agent-lanes-row)); }
/* Quiet lane separators and time ticks */
.ui-al__track::before { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(to bottom, transparent 0, transparent calc(var(--tc-agent-lanes-row) - 0.5px), var(--tc-border-default) calc(var(--tc-agent-lanes-row) - 0.5px), var(--tc-border-default) var(--tc-agent-lanes-row)); pointer-events: none; }
.ui-al__grid { position: absolute; inset: 0; pointer-events: none; }
.ui-al__tick { position: absolute; top: 0; bottom: 0; width: 0; border-left: 0.5px dashed var(--tc-border-default); }
.ui-al__tick > span { position: absolute; bottom: 100%; left: 0; margin-bottom: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: 14px; color: var(--tc-text-muted); white-space: nowrap; transform: translateX(-50%); font-variant-numeric: tabular-nums; }
.ui-al__clip { position: absolute; inset: 0; overflow: hidden; -webkit-mask-image: linear-gradient(to right, transparent 0, #000 40px); mask-image: linear-gradient(to right, transparent 0, #000 40px); }
.ui-al__layer { position: absolute; inset: 0; transform: translateX(calc(var(--t, 0) * -1%)); will-change: transform; }
.ui-al__curves { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.ui-al__curves path { fill: none; stroke: var(--tc-agent-lanes-rail); stroke-width: 1; stroke-dasharray: 3 3; }
.ui-al__curves path[data-live] { stroke: var(--tc-agent-lanes-run-edge); animation: ui-al-flow var(--tc-duration-reveal-slow) linear infinite; }
.ui-al__lane { position: absolute; left: 0; right: 0; height: var(--tc-agent-lanes-row); }
/* At least 24px wide, so even a short task is a usable target (2.5.8) */
.ui-al__slot { position: absolute; top: 10px; bottom: 10px; min-width: 24px; }
/* Running and waiting blocks grow out of "now" from nothing, so they never poke past it */
.ui-al__slot:is([data-status="running"], [data-status="waiting"]), .ui-al__slot:is([data-status="running"], [data-status="waiting"]) .ui-al__block { min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-al__block { display: flex; align-items: center; width: 100%; height: 100%; min-width: 24px; padding: 0 var(--tc-space-2-5); overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__block { display: flex; align-items: center; width: 100%; height: 100%; min-width: 24px; padding: 0 var(--tc-space-2); overflow: hidden; border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), color var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-al__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-al__mark { display: grid; flex: none; place-items: center; margin-right: var(--tc-space-1); }
/* Tools: the plain logos side by side, before the title */
.ui-al__tools { display: flex; flex: none; gap: var(--tc-space-1); margin-right: var(--tc-space-1-5); }
.ui-al__tool { display: grid; place-items: center; width: 12px; height: 12px; }
.ui-al__tool > svg { width: 12px; height: 12px; }
.ui-al__block:hover { background: var(--tc-fill-default); }
.ui-al__block[data-status="running"] { position: relative; background: var(--tc-agent-lanes-run-bg); color: var(--tc-agent-lanes-run-fg); box-shadow: inset -2px 0 0 var(--tc-agent-lanes-run-edge); }
/* The running sheen: a band that moves on transform, a few passes and then rests (2.2.2); it pauses with the timeline */
.ui-al__block[data-status="running"]::after { content: ""; position: absolute; inset: 0 auto 0 0; width: 50%; background: linear-gradient(90deg, transparent 0%, var(--tc-shimmer) 50%, transparent 100%); opacity: 0.7; transform: translateX(-100%); animation: ui-al-shimmer var(--tc-duration-shimmer) var(--tc-ease-in-out) 3; }
.ui-al__block[data-status="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-al__block[data-status="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-al__block[data-open] { filter: brightness(0.97); }
/* Needs you: a small flag inside the block's end, where it meets "now" */
.ui-al__flag { position: absolute; top: 50%; right: 4px; display: inline-flex; align-items: center; gap: var(--tc-space-1); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-status-warning-fg); white-space: nowrap; transform: translateY(-50%); pointer-events: none; animation: ui-al-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-al__slot:has(.ui-al__block[data-status="waiting"]) { z-index: 2; }
.ui-al__pop { position: absolute; z-index: 5; animation: ui-al-in var(--tc-duration-base) var(--tc-ease-standard) both; }
.ui-al__pop[data-up] { transform: translateY(-100%); animation-name: ui-al-in-up; }
/* Decide in place */
:where([data-look="standard"], [data-look="standard"] *).ui-al__ask { display: grid; gap: var(--tc-space-0-5); width: 290px; padding: var(--tc-space-3-5); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); }
/* Decide in place */
:where([data-look="clean"], [data-look="clean"] *).ui-al__ask { display: grid; gap: var(--tc-space-0-5); width: 280px; padding: var(--tc-space-3); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); }
/* What got done: the tooltip pattern – ink in light, light in dark, from the tokens */
.ui-al__tip { --tc-agent-lanes-tip-soft: color-mix(in srgb, var(--tc-tooltip-fg) 68%, transparent); display: grid; gap: var(--tc-space-1); width: max-content; max-width: 230px; padding: calc(var(--tc-tooltip-py) * 2) calc(var(--tc-tooltip-px) + 2px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-tooltip-font-size); line-height: var(--tc-line-height-tight); color: var(--tc-tooltip-fg); translate: -50% 0; }
.ui-al__tip-head { font-size: var(--tc-font-size-xs); color: var(--tc-agent-lanes-tip-soft); white-space: nowrap; }
.ui-al__tip-title { color: var(--tc-tooltip-fg); }
.ui-al__tip-list { display: grid; gap: var(--tc-space-0-5); }
.ui-al__tip-list li { position: relative; padding-left: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-al__tip-list li::before { content: ""; position: absolute; top: 7px; left: 1px; width: 3px; height: 3px; border-radius: 50%; background: var(--tc-agent-lanes-tip-soft); }
.ui-al__tip-open { justify-self: start; min-height: 24px; margin-top: var(--tc-space-0-5); font-size: var(--tc-tooltip-font-size); font-weight: var(--tc-font-weight-medium); color: var(--tc-tooltip-fg); text-decoration: underline; text-decoration-color: var(--tc-agent-lanes-tip-soft); text-underline-offset: 2px; }
.ui-al__ask-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-al__ask-text { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__ask-text { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-al__ask-actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5); margin-top: var(--tc-space-2); }
.ui-al__ask-actions[aria-busy] .ui-al__btn { opacity: 0.6; cursor: progress; }
.ui-al__error { display: block; margin-top: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *)/* Reject / Approve: secondary and primary actions, exactly like Button */
.ui-al__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-al__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-al__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-al__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-al__btn--primary:active { background: var(--tc-action-primary-bg-active); }
/* Now: a small label over the right edge, where running work meets the clock */
.ui-al__now { position: absolute; top: -6px; right: 0; width: 0; pointer-events: none; }
.ui-al__now > span { position: absolute; bottom: 100%; right: 0; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-agent-lanes-run-bg); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: 14px; color: var(--tc-agent-lanes-run-fg); }
@keyframes ui-al-pulse { 50% { opacity: 0.55; } }
@keyframes ui-al-shimmer { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
/* Held still (paused, hovered, focused, off screen): every loop rests too */
[data-ui="al"][data-still] *, [data-ui="al"][data-still] *::before, [data-ui="al"][data-still] *::after { animation-play-state: paused !important; }
@keyframes ui-al-flow { to { stroke-dashoffset: -6; } }
@keyframes ui-al-in { from { opacity: 0; transform: translateY(-3px); } }
@keyframes ui-al-in-up { from { opacity: 0; transform: translateY(calc(-100% + 3px)); } to { transform: translateY(-100%); } }
/* Narrow containers: the names column shrinks to the avatars */
@container (max-width: 520px) {
  .ui-al__body { grid-template-columns: 48px minmax(0, 1fr); }
  /* The names stay for screen readers (and as the row's title); the initials show who it is */
  .ui-al__who { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-al__summary [data-kind="running"] { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="al"] *, [data-ui="al"] *::before, [data-ui="al"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-agent-lanes")) customElements.define("tc-agent-lanes", TcAgentLanes);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-lanes": TcAgentLanes;
  }
}
