import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-agent-inbox> – the Lit port of src/components/agent-inbox.tsx: every background task your agents are working
 * on, as a calm board. Tasks sit in three columns – Needs you, Running, Done – as cards with a status glyph, the
 * title, two lines on what the agent is doing and a footer with the state and how many tools and sources it used.
 *   · click a card and it unfolds in place: the last steps and what you can do now – Approve / Reject when it waits,
 *     Retry when it failed, Open when it runs or is done (`openable`)
 *   · a card that changes state shows it in place first, then glides over to its new column
 *   · Board / List switches the layout; narrow containers always get the list
 * Clean drops the gray tray, and its bar has no action button.
 *
 *   <tc-agent-inbox heading="Agent tasks" .tasks=${tasks} .onApprove=${(t) => api.approve(t.id)}></tc-agent-inbox>
 *
 * `view` and `expanded` change on their own; a listener that calls preventDefault() on tc-view-change /
 * tc-expanded-change keeps control. Approve, Reject and Retry call `onApprove` / `onReject` / `onRetry`, which may
 * return a promise: the card's buttons wait while it runs, and a rejection leaves the card as it was and says so.
 * Elapsed times tick in place once a second (no re-render), and stop while the inbox is off-screen or the tab hidden.
 */

export type AgentTaskStatus = "running" | "waiting" | "done" | "failed";

export type AgentTaskStep = {
  label: string;
  /** Ready-to-show time, e.g. "2m ago" or "14:02" */
  time?: string;
};

export type AgentTask = {
  id: string;
  title: string;
  /** One or two sentences on what the task is about or where it stands */
  description?: string;
  /** Name of the agent or model, e.g. "Opus 5.5" */
  agent: string;
  status: AgentTaskStatus;
  /** When the task started – the clock ticks from here while it runs or waits */
  startedAt?: number | Date;
  /** How long it took in ms – shown for done and failed tasks */
  elapsed?: number;
  /** Tool calls so far – shown with a small wrench */
  tools?: number;
  /** Sources or files read – shown with a small magnifier */
  sources?: number;
  /** What the agent did so far, oldest first – the last four are shown when the card is open */
  steps?: AgentTaskStep[];
};

export type AgentInboxView = "board" | "list";

/** A decision's handler. It may return a promise: the card's buttons wait while it runs, and if it rejects the card
 *  stays as it was and says so, so you can try again */
export type AgentTaskHandler = (task: AgentTask) => void | Promise<unknown>;

export type AgentInboxViewChange = { view: AgentInboxView };
export type AgentInboxExpandedChange = { expanded: string | null };

type Lane = "needs" | "running" | "done";
const LANES: { id: Lane; label: string }[] = [
  { id: "needs", label: "Needs you" },
  { id: "running", label: "Running" },
  { id: "done", label: "Done" },
];
const laneOf = (s: AgentTaskStatus): Lane => (s === "waiting" || s === "failed" ? "needs" : s === "running" ? "running" : "done");
const STATE: Record<AgentTaskStatus, string> = { waiting: "Waiting for you", running: "Running", done: "Done", failed: "Failed" };
const live = (s: AgentTaskStatus) => s === "running" || s === "waiting";
const ms = (d: number | Date) => (typeof d === "number" ? d : d.getTime());
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (time: number) => {
  const s = Math.max(0, Math.floor(time / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${pad(s % 60)}s`;
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
};
const EASE = "cubic-bezier(0.32, 0.72, 0.24, 1)";
/** What a decision is made against: when the task you pass no longer matches it, your version wins */
const versionOf = (t: AgentTask) => `${t.status}|${t.startedAt !== undefined ? ms(t.startedAt) : ""}|${t.elapsed ?? ""}|${t.steps?.length ?? 0}`;
type Override = { version: string; status: AgentTaskStatus; startedAt?: number; steps?: AgentTaskStep[] };
/** Wall time – read in updates, timers and handlers only, never during render */
const wall = () => Date.now();

/* ---------- Icons ---------- */

/** The agent's mark – a small four-point spark, colored by state */
const spark = () =>
  html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${svg`<path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor"></path><circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55"></circle>`}</svg>`;
const stateIcon = (status: AgentTaskStatus) => html`<span class="ui-ai__state-icon" data-status=${status} aria-hidden="true">${
  status === "running"
    ? html`<svg width="12" height="12" viewBox="0 0 12 12">${svg`<circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.6"></circle><path d="M6 1.4a4.6 4.6 0 0 1 4.6 4.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>`}</svg>`
    : status === "waiting"
      ? html`<svg width="12" height="12" viewBox="0 0 12 12">${svg`<path d="M6 1.6 11 10.2H1L6 1.6Z" fill="currentColor"></path>`}</svg>`
      : status === "done"
        ? html`<svg width="12" height="12" viewBox="0 0 12 12">${svg`<circle cx="6" cy="6" r="3.4" fill="currentColor"></circle>`}</svg>`
        : html`<svg width="12" height="12" viewBox="0 0 12 12">${svg`<circle cx="6" cy="6" r="4.8" fill="currentColor"></circle><path d="M6 3.6v2.8M6 8.3v.1" stroke="var(--tc-surface-raised)" stroke-width="1.5" stroke-linecap="round"></path>`}</svg>`
}</span>`;
const lineIcon = (w: number, box: string, sw: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${w} height=${w} viewBox=${box} aria-hidden="true" fill="none" stroke="currentColor" stroke-width=${sw} stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const wrenchIcon = () => lineIcon(12, "0 0 12 12", 1.2, svg`<path d="M7.6 1.6a2.6 2.6 0 0 0-2.4 3.5L1.7 8.6a1.1 1.1 0 0 0 1.6 1.6l3.5-3.5a2.6 2.6 0 0 0 3.5-2.4l-1.5 1.1-1.5-.4-.4-1.5 1.1-1.5c-.1 0-.3-.4-.4-.4Z"></path>`);
const searchIcon = () => lineIcon(12, "0 0 12 12", 1.2, svg`<circle cx="5.2" cy="5.2" r="3.3"></circle><path d="m7.7 7.7 2.6 2.6"></path>`);
const boardIcon = () => lineIcon(13, "0 0 14 14", 1.2, svg`<rect x="1.8" y="2.2" width="3.2" height="9.6" rx="1"></rect><rect x="8.9" y="2.2" width="3.2" height="6.4" rx="1"></rect>`);
const listIcon = () => lineIcon(13, "0 0 14 14", 1.2, svg`<path d="M2.2 3.6h9.6M2.2 7h9.6M2.2 10.4h9.6"></path>`);
const plusIcon = () => lineIcon(12, "0 0 12 12", 1.5, svg`<path d="M6 2.2v7.6M2.2 6h7.6"></path>`);

let instances = 0;

/**
 * Background agent tasks as a board (or list): Needs you, Running, Done.
 * @tag tc-agent-inbox
 * @fires tc-view-change - The user switched Board / List ({ view }: AgentInboxViewChange); cancelable
 * @fires tc-expanded-change - A card was unfolded or folded ({ expanded }: AgentInboxExpandedChange, null = none); cancelable
 * @fires tc-open - Open was pressed on a running or done task; `detail` is the `AgentTask`
 */
export class TcAgentInbox extends TcElement {
  static override ui = "ai";

  /** The tasks – always the source of truth. After Approve, Reject or Retry the card shows the result right away;
   *  as soon as you pass that task with a new status (or steps, start or elapsed time), your version wins */
  @property({ attribute: false }) accessor tasks: AgentTask[] = [];
  /** Heading on the left of the bar */
  @property() accessor heading = "Agent inbox";
  /** A button in the bar, e.g. { label: "New task", onClick } – Standard look only; the Clean bar has no button */
  @property({ attribute: false }) accessor action: { label: string; onClick: () => void } | undefined = undefined;
  /** The layout: "board" or "list" */
  @property({ reflect: false }) accessor view: AgentInboxView = "board";
  /** The id of the unfolded card, or null */
  @property({ attribute: false }) accessor expanded: string | null = null;
  /** Shows an Open button on running and done tasks (fires tc-open) */
  @property({ type: Boolean }) accessor openable = false;
  /** Called on Approve; may return a promise */
  @property({ attribute: false }) accessor onApprove: AgentTaskHandler | undefined = undefined;
  /** Called on Reject; may return a promise */
  @property({ attribute: false }) accessor onReject: AgentTaskHandler | undefined = undefined;
  /** Called on Retry; may return a promise */
  @property({ attribute: false }) accessor onRetry: AgentTaskHandler | undefined = undefined;

  /** @internal Decisions shown until the task passed in changes */
  @state() accessor local: Record<string, Override> = {};
  /** @internal Decisions on their way, and the ones that failed */
  @state() accessor busy: Record<string, "pending" | "error"> = {};
  /** @internal The column each card sits in – a changed card moves there after a moment */
  @state() accessor placed: Record<string, Lane> | undefined = undefined;

  private readonly uid = `tc-ai${++instances}`;
  private seen: Record<string, number> = {};
  private laneKey = "";
  private laneTimer = 0;
  private tick = 0;
  private inView = true;
  private io?: IntersectionObserver;
  private places = new Map<string, { left: number; top: number }>();
  private moveKey = "";
  private alive = false;

  constructor() {
    super();
    // Safety net: a focused card that remounts in another column is found by its data-focus-key; else the switch
    new FocusRescueController(this, () => this.querySelector('.ui-ai__view[tabindex="0"]'));
    this.addEventListener("keydown", this.onKeyDown);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((entries) => {
        this.inView = entries[entries.length - 1].isIntersecting;
        this.syncTick();
      });
      this.io.observe(this);
    }
    document.addEventListener("visibilitychange", this.syncTick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.alive = false;
    this.io?.disconnect();
    this.io = undefined;
    document.removeEventListener("visibilitychange", this.syncTick);
    window.clearInterval(this.tick);
    this.tick = 0;
    window.clearTimeout(this.laneTimer);
    this.laneTimer = 0;
    this.laneKey = "";
  }

  /** The tasks with the user's decisions applied */
  private get list() {
    return this.tasks.map((t) => {
      const o = this.local[t.id];
      return o && o.version === versionOf(t) ? { ...t, status: o.status, startedAt: o.startedAt ?? t.startedAt, steps: o.steps ?? t.steps } : t;
    });
  }

  private laneFor(t: AgentTask) {
    return this.placed?.[t.id] ?? laneOf(t.status);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.dataset.view = this.view;
    if (!this.placed) this.placed = Object.fromEntries(this.list.map((t) => [t.id, laneOf(t.status)]));
  }

  /* ---------- Elapsed times: painted in place, no render ---------- */

  private timeOf(t: AgentTask, at: number) {
    if (!live(t.status)) return t.elapsed ?? 0;
    const base = t.startedAt !== undefined ? ms(t.startedAt) : (this.seen[t.id] ?? at) - (t.elapsed ?? 0);
    return at - base;
  }

  private paint = () => {
    const at = wall();
    const byId = new Map(this.list.map((t) => [t.id, t]));
    for (const el of this.querySelectorAll<HTMLElement>(".ui-ai__card")) {
      const t = byId.get(el.dataset.id!);
      const label = el.querySelector<HTMLElement>(".ui-ai__time");
      if (!t || !label) continue;
      const text = t.status === "failed" ? "" : clock(this.timeOf(t, at));
      if (label.textContent !== text) label.textContent = text;
    }
  };

  private syncTick = () => {
    const on = this.alive && this.inView && !document.hidden && this.list.some((t) => live(t.status));
    if (on && !this.tick) {
      this.paint();
      this.tick = window.setInterval(this.paint, 1000);
    } else if (!on && this.tick) {
      window.clearInterval(this.tick);
      this.tick = 0;
    }
  };

  protected override updated() {
    const list = this.list;
    const at = wall();
    for (const t of list) this.seen[t.id] ??= at;
    this.paint();
    this.syncTick();

    // A changed card shows its new state in place, then moves to its new column
    const laneKey = list.map((t) => `${t.id}:${laneOf(t.status)}`).join("|");
    if (laneKey !== this.laneKey) {
      this.laneKey = laneKey;
      window.clearTimeout(this.laneTimer);
      this.laneTimer = 0;
      if (list.some((t) => this.placed?.[t.id] !== laneOf(t.status)))
        this.laneTimer = window.setTimeout(() => {
          this.laneTimer = 0;
          this.placed = Object.fromEntries(this.list.map((t) => [t.id, laneOf(t.status)]));
        }, reducedMotion() ? 0 : 900);
    }

    // FLIP: cards glide from where they sat when they change lanes or the layout changes
    const moveKey = JSON.stringify(this.placed) + this.view;
    const origin = this.getBoundingClientRect();
    const cards = [...this.querySelectorAll<HTMLElement>(".ui-ai__card")];
    const next = new Map<string, { left: number; top: number }>();
    for (const el of cards) {
      const r = el.getBoundingClientRect();
      next.set(el.dataset.id!, { left: r.left - origin.left, top: r.top - origin.top });
    }
    if (this.moveKey && this.moveKey !== moveKey && !reducedMotion()) {
      for (const el of cards) {
        if (typeof el.animate !== "function") continue;
        const from = this.places.get(el.dataset.id!);
        if (!from) {
          el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: EASE });
          continue;
        }
        const to = next.get(el.dataset.id!)!;
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        el.animate([{ transform: `translate(${dx}px, ${dy}px)`, zIndex: 2 }, { transform: "none", zIndex: 2 }], { duration: 560, easing: EASE });
      }
    }
    this.moveKey = moveKey;
    this.places = next;
  }

  /* ---------- Interaction ---------- */

  private setView(view: AgentInboxView) {
    if (view === this.view) return;
    if (this.emit<AgentInboxViewChange>("tc-view-change", { view }, { cancelable: true })) this.view = view;
  }

  private setExpanded(expanded: string | null) {
    if (expanded === this.expanded) return;
    if (this.emit<AgentInboxExpandedChange>("tc-expanded-change", { expanded }, { cancelable: true })) this.expanded = expanded;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.expanded) {
      e.stopPropagation();
      this.querySelector<HTMLElement>(`[data-id="${CSS.escape(this.expanded)}"] .ui-ai__card-main`)?.focus({ preventScroll: true });
      this.setExpanded(null);
    }
  };

  /** A radiogroup with its keyboard pattern: one tab stop, arrows (and Home / End) move and pick */
  private onViewsKey(e: KeyboardEvent) {
    const order = ["board", "list"] as const;
    const at = order.indexOf(this.view);
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp" ? (at + 1) % 2 : e.key === "Home" ? 0 : e.key === "End" ? 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.setView(order[to]);
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(".ui-ai__view")[to]?.focus();
  }

  /** Every decision is reported; the card shows its result until the task you pass changes. A handler that returns a
   *  promise holds the card until it settles, and a rejection leaves the card as it was, with a note */
  private decide(task: AgentTask, next: AgentTaskStatus, note: string, handler?: AgentTaskHandler) {
    // A decision swaps the card's buttons and later moves it to another column: focus goes to the card first
    const card = this.querySelector(`[data-id="${CSS.escape(task.id)}"]`);
    rescueFocus(card?.querySelector(".ui-ai__fold"), [card?.querySelector(".ui-ai__card-main")]);
    if (this.busy[task.id] === "pending") return;
    const original = this.tasks.find((t) => t.id === task.id) ?? task;
    const settle = () => {
      const { [task.id]: _settled, ...others } = this.busy;
      this.busy = others;
    };
    const apply = () => (this.local = { ...this.local, [task.id]: { version: versionOf(original), status: next, startedAt: wall(), steps: [...(task.steps ?? []), { label: note, time: "now" }] } });
    const done = handler?.(task);
    if (done && typeof (done as Promise<unknown>).then === "function") {
      this.busy = { ...this.busy, [task.id]: "pending" };
      (done as Promise<unknown>).then(
        () => {
          if (!this.alive) return;
          settle();
          apply();
        },
        () => {
          if (this.alive) this.busy = { ...this.busy, [task.id]: "error" };
        },
      );
      return;
    }
    settle();
    apply();
  }

  /* ---------- Render ---------- */

  private card(t: AgentTask, index: number) {
    const open = this.expanded === t.id;
    const state = this.busy[t.id];
    const pending = state === "pending" ? "true" : undefined;
    const steps = (t.steps ?? []).slice(-4);
    // DOM ids come from the inbox and the task's place, never from the task's own id
    const foldId = `${this.uid}-${index}`;
    // The word goes first when a card is slim – the glyph already says it – so the time always fits
    const word = t.status === "done" ? "Done in " : t.status === "failed" ? STATE.failed : `${STATE[t.status]} · `;
    return html`<li data-id=${t.id} class="ui-ai__card" data-status=${t.status} ?data-open=${open}>
      <button type="button" class="ui-ai__card-main" data-focus-key=${t.id} aria-expanded=${open ? "true" : "false"} aria-controls=${foldId} @click=${() => this.setExpanded(open ? null : t.id)}>
        <span class="ui-ai__title-row"><span class="ui-ai__spark">${spark()}</span><span class="ui-ai__title">${t.title}</span></span>
        ${t.description ? html`<span class="ui-ai__desc">${t.description}</span>` : nothing}
        <span class="ui-ai__foot">
          <span class="ui-ai__state" data-status=${t.status}>
            ${stateIcon(t.status)}
            <span><span class="ui-ai__state-word">${word}</span><span class="ui-ai__time"></span></span>
          </span>
          <span class="ui-ai__meta">
            ${t.sources !== undefined ? html`<span title="Sources read">${searchIcon()}${t.sources}<span class="ui-ai__sr"> sources read</span></span>` : nothing}
            ${t.tools !== undefined ? html`<span title="Tool calls">${wrenchIcon()}${t.tools}<span class="ui-ai__sr"> tool calls</span></span>` : nothing}
          </span>
        </span>
      </button>
      <div id=${foldId} class="ui-ai__fold" ?data-open=${open} .inert=${!open}>
        <div class="ui-ai__clip">
          <div class="ui-ai__more">
            <div class="ui-ai__agent">${t.agent}</div>
            ${steps.length
              ? html`<ol class="ui-ai__steps">
                  ${steps.map((s, i) => html`<li ?data-last=${i === steps.length - 1}><span>${s.label}</span>${s.time ? html`<time>${s.time}</time>` : nothing}</li>`)}
                </ol>`
              : nothing}
            <div class="ui-ai__actions" aria-busy=${ifDefined(pending)}>
              ${state === "error" && (t.status === "waiting" || t.status === "failed") ? html`<span class="ui-ai__error" role="alert">Didn't go through – try again</span>` : nothing}
              ${t.status === "waiting"
                ? html`<button type="button" class="ui-ai__btn" aria-disabled=${ifDefined(pending)} @click=${() => this.decide(t, "failed", "You rejected the request", this.onReject)}>Reject</button>
                    <button type="button" class="ui-ai__btn ui-ai__btn--primary" aria-disabled=${ifDefined(pending)} @click=${() => this.decide(t, "running", "You approved – continuing", this.onApprove)}>Approve</button>`
                : nothing}
              ${t.status === "failed"
                ? html`<button type="button" class="ui-ai__btn ui-ai__btn--primary" aria-disabled=${ifDefined(pending)} @click=${() => this.decide(t, "running", "Retrying", this.onRetry)}>Retry</button>`
                : nothing}
              ${(t.status === "running" || t.status === "done") && this.openable ? html`<button type="button" class="ui-ai__btn" @click=${() => this.emit("tc-open", t)}>Open</button>` : nothing}
            </div>
          </div>
        </div>
      </div>
    </li>`;
  }

  protected override render() {
    const list = this.list;
    const look = this.resolvedLook;
    const counts = Object.fromEntries(LANES.map((l) => [l.id, list.filter((t) => this.laneFor(t) === l.id).length])) as Record<Lane, number>;
    const summary = `${list.filter((t) => t.status === "waiting" || t.status === "failed").length} need you, ${list.filter((t) => t.status === "running").length} running`;
    const views = html`<div class="ui-ai__views" role="radiogroup" aria-label="Layout" @keydown=${this.onViewsKey}>
      ${(["board", "list"] as const).map(
        (v) =>
          html`<button type="button" role="radio" aria-checked=${this.view === v ? "true" : "false"} tabindex=${this.view === v ? 0 : -1} class="ui-ai__view" @click=${() => this.setView(v)}>
            ${v === "board" ? boardIcon() : listIcon()}${v === "board" ? "Board" : "List"}
          </button>`,
      )}
    </div>`;
    return html`
      <div class="ui-ai__bar">
        <span class="ui-ai__heading"><span class="ui-ai__crumb">Agents</span><span class="ui-ai__slash" aria-hidden="true">/</span><span>${this.heading}</span></span>
        ${look === "standard"
          ? html`<div class="ui-ai__tools">
              ${this.action ? html`<button type="button" class="ui-ai__action" @click=${() => this.action?.onClick()}>${plusIcon()}${this.action.label}</button>` : nothing}
              ${views}
            </div>`
          : views}
      </div>
      <div class="ui-ai__lanes">
        ${LANES.map(
          (lane) => html`<section class="ui-ai__lane" aria-label=${lane.label}>
            <header class="ui-ai__lane-head">
              <span class="ui-ai__lane-spark" aria-hidden="true">${spark()}</span>
              <span class="ui-ai__lane-name">${lane.label}</span>
              <span class="ui-ai__count">${counts[lane.id]}</span>
            </header>
            <ul class="ui-ai__cards">
              ${repeat(
                list.filter((t) => this.laneFor(t) === lane.id),
                (t) => t.id,
                (t) => this.card(t, list.indexOf(t)),
              )}
              ${counts[lane.id] === 0 ? html`<li class="ui-ai__empty">Nothing here</li>` : nothing}
            </ul>
          </section>`,
        )}
      </div>
      <span class="ui-ai__sr" aria-live="polite">${summary}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="ai"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ai"] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  /* The tray recipe */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ai"] {
  /* The quiet lane behind the cards, also the view switch track */
  --tc-agent-inbox-lane-bg: light-dark(#f4f4f5, #161618);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="ai"] *, [data-ui="ai"] *::before, [data-ui="ai"] *::after { box-sizing: border-box; }
:where([data-ui="ai"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ai"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="ai"] ul, [data-ui="ai"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="ai"] svg { display: block; flex: none; }
.ui-ai__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- Bar on the tray: where you are, an optional action and the layout ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__heading { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__crumb { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__slash { color: var(--tc-text-disabled); font-weight: var(--tc-font-weight-regular); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-2); }
/* The bar's action: a ghost button */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__action { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md) 0 calc(var(--tc-control-px-md) - 2px); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-primary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__action:hover { background: var(--tc-action-ghost-bg-hover); }
/* Board / List: the segmented pattern – a track, the chosen layout on the raised thumb */
.ui-ai__views { display: flex; flex: none; gap: var(--tc-space-0-5); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-ai__view[aria-checked="true"] { background: var(--tc-seg-thumb-bg); color: var(--tc-text-primary); box-shadow: var(--tc-seg-thumb-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__view[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__view { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: 28px; padding: 0 var(--tc-space-3); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
/* ----- Bar: where you are, and the layout ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); margin-bottom: var(--tc-space-3); padding: 0 var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__heading { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__crumb { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__slash { color: var(--tc-text-disabled); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__view { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: 26px; padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ai__view:hover { color: var(--tc-text-primary); }
/* ----- Columns: headings on the tray, white cards below ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-1); align-items: start; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane { min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane-head { display: flex; align-items: center; gap: var(--tc-space-2); height: 32px; padding: 0 var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane-spark { display: grid; color: var(--tc-status-info-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane[aria-label="Needs you"] .ui-ai__lane-spark { color: var(--tc-status-warning-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane[aria-label="Done"] .ui-ai__lane-spark { color: var(--tc-status-success-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane-name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__count { display: grid; place-items: center; min-width: var(--tc-pill-h); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__cards { display: grid; gap: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__empty { padding: var(--tc-space-4-5) 0 var(--tc-space-5); border-radius: var(--tc-card-radius); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-md); text-align: center; color: var(--tc-text-muted); }
/* ----- A card ----- */
/* A card: the card pattern, its hover from the tokens (dark included) */
.ui-ai__card { position: relative; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ai__card:hover,
.ui-ai__card[data-open] { box-shadow: var(--tc-card-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__card-main { display: grid; gap: var(--tc-space-1-5); width: 100%; padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-3); border-radius: var(--tc-card-radius); container: ai-card / inline-size; }
/* ----- Columns ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-2); align-items: start; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lane { min-width: 0; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-agent-inbox-lane-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lane-head { display: grid; grid-template-columns: 20px 1fr 20px; align-items: center; height: 34px; padding: 0 var(--tc-space-2) 0 var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lane-spark { color: var(--tc-status-info-solid); opacity: 0.7; }
/* The lane name is a group label: the Clean caption spec */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lane-name { overflow: hidden; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-align: center; text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__count { display: grid; place-items: center; min-width: 20px; height: var(--tc-pill-h); padding: 0 var(--tc-space-1); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__cards { display: grid; gap: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__empty { padding: var(--tc-space-4-5) 0 var(--tc-space-5); font-size: var(--tc-font-size-sm); text-align: center; color: var(--tc-text-muted); }
/* ----- A card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__card-main { display: grid; gap: var(--tc-space-1-5); width: 100%; padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-3); border-radius: var(--tc-card-radius); container: aic-card / inline-size; }
.ui-ai__title-row { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; }
.ui-ai__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-status-info-solid); transition: color var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-ai__card[data-status="waiting"] .ui-ai__spark { color: var(--tc-status-warning-solid); }
.ui-ai__card[data-status="failed"] .ui-ai__spark { color: var(--tc-status-danger-solid); }
.ui-ai__card[data-status="done"] .ui-ai__spark { color: var(--tc-status-success-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__title { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__desc { display: -webkit-box; padding-left: 26px; overflow: hidden; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2-5); min-width: 0; margin-top: var(--tc-space-1-5); padding-left: 26px; }
/* The state: a pill on a soft tone, with its glyph */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: 24px; padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-accent-subtle); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state[data-status="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state[data-status="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state[data-status="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__title { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__desc { display: -webkit-box; padding-left: 26px; overflow: hidden; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2-5); min-width: 0; margin-top: var(--tc-space-1); padding-left: 26px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-ai__state > span:last-child { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state-icon { display: grid; flex: none; place-items: center; width: 12px; height: 12px; color: currentColor; animation: ui-ai-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state-icon { display: grid; flex: none; place-items: center; width: 12px; height: 12px; color: var(--tc-status-info-solid); animation: ui-ai-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
/* The spinner turns a few times and rests – an endless loop would move for more than 5 s (2.2.2) */
.ui-ai__state-icon[data-status="running"] svg { animation: ui-ai-spin var(--tc-duration-reveal-slow) linear 5; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__meta { display: inline-flex; flex: none; align-items: center; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state-icon[data-status="waiting"] { color: var(--tc-status-warning-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state-icon[data-status="done"] { color: var(--tc-status-success-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state-icon[data-status="failed"] { color: var(--tc-status-danger-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__meta { display: inline-flex; flex: none; align-items: center; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-ai__meta > span { display: inline-flex; align-items: center; gap: var(--tc-space-1); padding: 0 var(--tc-space-2); }
.ui-ai__meta > span + span { border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-ai__meta > span:last-child { padding-right: 0; }
/* Open: steps and decisions unfold under the card's text */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-ai__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-instant); }
/* Open: steps and decisions unfold under the card's text */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-ai__clip { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__more { margin: 0 var(--tc-space-3-5); padding: var(--tc-space-3) 0 var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__agent { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__steps { position: relative; display: grid; gap: var(--tc-space-1-5); margin-top: var(--tc-space-2) !important; padding-left: var(--tc-space-3-5) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__steps li { position: relative; display: flex; justify-content: space-between; gap: var(--tc-space-2-5); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__steps li::before { content: ""; position: absolute; top: 6px; left: -14px; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-text-disabled); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__steps li:not(:last-child)::after { content: ""; position: absolute; top: 15px; bottom: -9px; left: -11.5px; width: 1px; background: var(--tc-border-default); }
/* Starts at the card's left edge, like the spark – the full width for reading */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__more { margin: 0 var(--tc-space-3-5) 0 var(--tc-space-3); padding: var(--tc-space-2-5) 0 var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__agent { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__steps { position: relative; display: grid; gap: var(--tc-space-1); margin-top: var(--tc-space-1-5) !important; padding-left: var(--tc-space-3) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__steps li { position: relative; display: flex; justify-content: space-between; gap: var(--tc-space-2-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__steps li::before { content: ""; position: absolute; top: 7px; left: -12px; width: 4px; height: 4px; border-radius: 50%; background: var(--tc-text-disabled); }
/* Short line segments between the dots, with a little air on both ends */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__steps li:not(:last-child)::after { content: ""; position: absolute; top: 15px; bottom: -8px; left: -10.5px; width: 1px; background: var(--tc-border-default); }
.ui-ai__steps li[data-last]::before { background: var(--tc-text-primary); }
.ui-ai__steps li > span { min-width: 0; }
.ui-ai__steps time { flex: none; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5); margin-top: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5); margin-top: var(--tc-space-2-5); }
.ui-ai__actions:empty { display: none; }
.ui-ai__actions[aria-busy] .ui-ai__btn, .ui-ai__btn[aria-disabled="true"] { opacity: 0.6; cursor: progress; }
.ui-ai__error { align-self: center; margin-right: auto; font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
/* Reject / Open and Approve / Retry: secondary and primary actions, exactly like Button (both looks) */
.ui-ai__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ai__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ai__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-ai__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-ai__btn--primary:active { background: var(--tc-action-primary-bg-active); }
/* ----- List layout: the columns stack, one after another ----- */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ai"][data-view="list"] .ui-ai__lanes { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2); }
/* ----- List layout: the columns stack, one after another ----- */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ai"][data-view="list"] .ui-ai__lanes { grid-template-columns: minmax(0, 1fr); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ai"][data-view="list"] .ui-ai__lane-head { grid-template-columns: 20px auto 1fr; gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ai"][data-view="list"] .ui-ai__lane-name { text-align: left; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ai"][data-view="list"] .ui-ai__count { justify-self: start; }
.ui-ai__lanes { animation: ui-ai-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
@keyframes ui-ai-spin { to { transform: rotate(360deg); } }
@keyframes ui-ai-pop { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-ai-in { from { opacity: 0.4; } }
/* Narrow containers: always the list, without the switch */
/* Narrow containers: the columns stack in both layouts. The switch stays visible (1.4.10) – it was display:none here */
@container (max-width: 620px) {
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ai"] .ui-ai__lanes { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ai"] .ui-ai__lanes { grid-template-columns: minmax(0, 1fr); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ai"] .ui-ai__lane-head { grid-template-columns: 20px auto 1fr; gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ai"] .ui-ai__lane-name { text-align: left; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ai"] .ui-ai__count { justify-self: start; }
}
/* Slim cards (three columns in a narrow board): the text starts under the spark, so the footer keeps its words */
@container ai-card (max-width: 300px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ai__desc,
:where([data-look="standard"], [data-look="standard"] *).ui-ai__foot { padding-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state:not([data-status="failed"]) .ui-ai__state-word { display: none; }
}
/* Narrow containers: always the list, without the switch */
/* Slim cards (three columns in a narrow board): the text starts under the spark, so the footer keeps its words */
@container aic-card (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ai__desc,
:where([data-look="clean"], [data-look="clean"] *).ui-ai__foot { padding-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state:is([data-status="running"], [data-status="done"]) .ui-ai__state-word { display: none; }
}
@container (max-width: 360px) {
  .ui-ai__desc, .ui-ai__foot { padding-left: 0; }
  .ui-ai__title { white-space: normal; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-ai__view { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__btn { height: 40px; padding: 0 var(--tc-space-4-5); }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ai__view { height: 32px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__btn { height: 36px; padding: 0 var(--tc-space-4); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ai"] *, [data-ui="ai"] *::before, [data-ui="ai"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-agent-inbox")) customElements.define("tc-agent-inbox", TcAgentInbox);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-inbox": TcAgentInbox;
  }
}
