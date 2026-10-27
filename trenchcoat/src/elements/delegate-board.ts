import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-delegate-board> – the Lit port of src/components/delegate-board.tsx: hand work to your agents by dragging it
 * onto them. New tasks on the left ("Unassigned"), the agents on the right – their mark, name and model, a "Free" or
 * "Busy until 14:32" tag and their queue as small chips, the running task first.
 *   · drag a task onto an agent: it lifts and follows the pointer, the agent under it lights up and previews what
 *     changes ("+12m · until 14:44"); on drop the card glides into that agent's queue
 *   · drag a queued chip to another agent to hand it over, or back to the left to unassign it
 *   · the Auto switch: on, every new task goes to the least busy agent on its own, one after another
 * Without dragging: click a task (or press Enter) to pick it up, then click an agent – or choose with ↑ ↓ and press
 * Enter; a queued chip can go back to "Unassigned" the same way, or with Delete. 1–9 sends it to that agent at once.
 *
 *   <tc-delegate-board .agents=${agents} .tasks=${tasks}></tc-delegate-board>
 *
 * Every hand-off fires `tc-assign` ({ taskId, agentId }); the board moves the task at once and keeps it there until
 * `tasks` gives that task another agent. The Auto switch fires a cancelable `tc-mode-change` ({ mode }).
 */

export type DelegateAgent = {
  id: string;
  name: string;
  /** Model or role, shown under the name */
  model?: string;
  /** A small mark, e.g. the model maker's logo (an element, cloned, or text) – defaults to the initials */
  avatar?: Element | string;
  /** Minutes left on the task it is running now (the first task in its queue), for the "Busy until" time */
  current?: number;
  /** What a minute of its work costs (e.g. 0.05 for $0.05) – shows the price per task when you hand one over */
  rate?: number;
};

export type DelegateTask = {
  id: string;
  title: string;
  /** Rough minutes it takes */
  estimate: number;
  /** Small logos of the tools it works in (elements, cloned) – up to three */
  tools?: Element[];
  /** Who it is with – leave it out for unassigned. In each queue, the first task is the running one */
  agentId?: string | null;
};

export type DelegateMode = "auto" | "manual";
export type DelegateAssign = { taskId: string; agentId: string | null };
export type DelegateModeChange = { mode: DelegateMode };

/* ---------- Helpers ---------- */

const MIN = 60_000;
const dollars = (n: number) => `$${n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString("en-US")}`;
const EASE = "cubic-bezier(0.32, 0.72, 0.24, 1)";
const hhmm = (t: number) => {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Pointer and card in screen pixels while dragging; left/top place the lifted card in the board's own pixels */
type Drag = { id: string; x: number; y: number; dx: number; dy: number; w: number; z: number; left: number; top: number; from: "pile" | "queue" };
/** Where a card sat, relative to the board, in screen pixels */
type Box = { left: number; top: number; width: number; height: number };
/** A move made here: the task's agent, and the agent `tasks` gave it then – the move holds while that's unchanged */
type Move = { to: string | null; base: string | null };

/** How much the board is scaled on screen (CSS zoom or transforms on a parent) – screen pixels per CSS pixel */
const scaleOf = (el: HTMLElement) => (el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1);
/** Placed in the board's own pixels, from a pointer position and where on the card it was grabbed */
const placeIn = (root: HTMLElement, x: number, y: number, dx: number, dy: number) => {
  const z = scaleOf(root);
  const origin = root.getBoundingClientRect();
  return { z, left: (x - dx - origin.left) / z, top: (y - dy - origin.top) / z };
};
const relative = (r: DOMRect, origin: DOMRect): Box => ({ left: r.left - origin.left, top: r.top - origin.top, width: r.width, height: r.height });

/* ---------- Icons ---------- */

/** People: the agents you hand work to (Lucide users, ISC) */
const agentsIcon = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;
const grip = html`<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${[3, 6, 9].map((y) => [4.3, 7.7].map((x) => svg`<circle cx=${x} cy=${y} r="0.95" fill="currentColor"></circle>`))}</svg>`;
const spinner = html`<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" class="ui-db__spin">${svg`<circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.6"></circle><path d="M6 1.4a4.6 4.6 0 0 1 4.6 4.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>`}</svg>`;

const tools = (t: DelegateTask) =>
  t.tools?.length ? html`<span class="ui-db__tools" aria-hidden="true">${t.tools.slice(0, 3).map((tool) => html`<span class="ui-db__tool">${tool.cloneNode(true)}</span>`)}</span>` : nothing;

let instances = 0;

/**
 * Hand work to agents by dragging it onto them – or by click and keyboard.
 * @tag tc-delegate-board
 * @fires tc-assign - A task was handed over or unassigned ({ taskId, agentId }: DelegateAssign, agentId null for unassigned)
 * @fires tc-mode-change - The Auto switch was flipped ({ mode }: DelegateModeChange); cancelable
 */
export class TcDelegateBoard extends TcElement {
  static override ui = "db";

  /** The agents work can go to, in the order they're listed (number keys 1–9 pick them) */
  @property({ attribute: false }) accessor agents: DelegateAgent[] = [];
  /** Every task – without an `agentId` it waits under "Unassigned"; the first in each agent's queue is the running one */
  @property({ attribute: false }) accessor tasks: DelegateTask[] = [];
  /** The clock for the "Busy until" times, in epoch ms – without it the board reads the clock while connected */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Auto hands every unassigned task to the least busy agent on its own; Manual waits for a drag. Changed by the
   *  user unless a tc-mode-change listener calls preventDefault() */
  @property({ reflect: true }) accessor mode: DelegateMode = "manual";
  /** A suggested hand-off, e.g. from your router: the agent lights up and previews the new time, the task is marked */
  @property({ attribute: false }) accessor suggestion: { taskId: string; agentId: string } | null | undefined = undefined;
  /** Formats a cost from rate × minutes – defaults to dollars, e.g. "$0.60" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** The heading in the bar */
  @property() accessor heading = "Delegate";

  @state() private accessor local: Record<string, Move> = {};
  @state() private accessor picked: string | null = null;
  @state() private accessor pickAt = 0;
  @state() private accessor announce = "";
  /** Queues showing every task, not just the first three */
  @state() private accessor expanded: Record<string, boolean> = {};
  /** The "+N" tooltip: which agent's is under the pointer, and which one Esc closed */
  @state() private accessor tipHover: string | null = null;
  @state() private accessor tipOff: string | null = null;
  @state() private accessor tick: number | null = null;
  @state() private accessor drag: Drag | null = null;
  @state() private accessor over: string | null = null;

  private readonly uid = `tc-db${++instances}`;
  /** Moves made here show at once; a task joins the end of its new queue */
  private order: string[] = [];
  /** Focus to move after the next render (a moved task, a chip revealed by "+N") */
  private focusKey: string | null = null;
  private clock = 0;
  private autoTimer = 0;
  private autoKey = "";
  private start: { id: string; x: number; y: number; el: HTMLElement; from: Drag["from"] } | null = null;
  /** A drag ends in a click on the card it started on – that click isn't a pick */
  private dragged = false;
  private lastShape: string | null = null;
  private beforeBoxes: Map<string, Box> | null = null;
  private glide = false;
  private dropped: { id: string; rect: Box } | null = null;
  private tipListening = false;

  constructor() {
    super();
    // Focus never falls to <body>: a moved task keeps it (same data-focus-key in its new place); a task now hidden
    // behind "+N" hands it to that chip; otherwise the first task left
    new FocusRescueController(this, (key) => {
      const t = key ? this.list.find((x) => x.id === key) : undefined;
      if (t?.agentId) return this.querySelector(`[data-focus-key="${CSS.escape(`more-${t.agentId}`)}"]`);
      return this.querySelector(".ui-db__task, .ui-db__chip");
    });
  }

  /* ---------- Lifecycle: the clock, Auto, the Esc listener ---------- */

  override connectedCallback() {
    super.connectedCallback();
    this.syncClock();
    if (this.hasUpdated) {
      this.autoKey = "";
      this.requestUpdate();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.clock);
    this.clock = 0;
    clearTimeout(this.autoTimer);
    this.autoTimer = 0;
    window.removeEventListener("keydown", this.onTipKey);
    this.tipListening = false;
  }

  /** Without `now`, the clock is read on connect and every 30 s */
  private syncClock() {
    if (this.now !== undefined || !this.isConnected) {
      clearInterval(this.clock);
      this.clock = 0;
      return;
    }
    if (this.clock) return;
    const read = () => (this.tick = Date.now());
    read();
    this.clock = window.setInterval(read, 30_000);
  }

  private onTipKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.tipHover) this.tipOff = this.tipHover;
  };

  /* ---------- The board's view of the tasks ---------- */

  private get clockNow() {
    return this.now ?? this.tick;
  }

  /** `tasks` with the moves made here */
  private get list(): DelegateTask[] {
    return this.tasks.map((t) => {
      const move = this.local[t.id];
      return move && move.base === (t.agentId ?? null) ? { ...t, agentId: move.to } : t;
    });
  }

  private view() {
    const list = this.list;
    const sorted = [...list].sort((a, b) => {
      const ia = this.order.indexOf(a.id);
      const ib = this.order.indexOf(b.id);
      return (ia < 0 ? -1 : ia) - (ib < 0 ? -1 : ib);
    });
    const pile = sorted.filter((t) => !t.agentId);
    const queues = new Map<string, DelegateTask[]>();
    for (const t of sorted) if (t.agentId) queues.set(t.agentId, [...(queues.get(t.agentId) ?? []), t]);
    return { list, sorted, pile, queues };
  }

  /** When an agent is done with everything in its queue – optionally with one more task */
  private busyUntil(a: DelegateAgent, queues: Map<string, DelegateTask[]>, extra?: DelegateTask) {
    const q = (queues.get(a.id) ?? []).filter((t) => t.id !== extra?.id);
    if (!q.length && !extra) return null;
    const first = q.length ? (a.current ?? q[0].estimate) : 0;
    const later = q.slice(1).reduce((sum, t) => sum + t.estimate, 0);
    return (this.clockNow ?? 0) + (first + later + (extra?.estimate ?? 0)) * MIN;
  }

  private costOf(a: DelegateAgent, minutes: number) {
    return a.rate != null ? a.rate * minutes : null;
  }

  /* ---------- Moves ---------- */

  private assign(taskId: string, agentId: string | null) {
    const task = this.list.find((t) => t.id === taskId);
    if (!task || (task.agentId ?? null) === agentId) return;
    this.order = [...this.order.filter((id) => id !== taskId), taskId];
    const who = agentId ? this.agents.find((a) => a.id === agentId)?.name : null;
    this.announce = who ? `${task.title} → ${who}` : `${task.title} is unassigned again`;
    const base = this.tasks.find((t) => t.id === taskId)?.agentId ?? null;
    this.local = { ...this.local, [taskId]: { to: agentId, base } };
    this.emit<DelegateAssign>("tc-assign", { taskId, agentId });
  }

  private setMode(mode: DelegateMode) {
    if (this.emit<DelegateModeChange>("tc-mode-change", { mode }, { cancelable: true })) this.mode = mode;
  }

  /** The agent that is free soonest */
  private leastBusy() {
    const { queues } = this.view();
    const now = this.clockNow ?? 0;
    return [...this.agents].sort((a, b) => (this.busyUntil(a, queues) ?? now) - (this.busyUntil(b, queues) ?? now))[0];
  }

  /* ---------- Pick up, choose, drop – by keyboard or by clicks ---------- */

  private get pickedTask() {
    return this.picked ? this.list.find((t) => t.id === this.picked) : undefined;
  }
  /** The choices while a task is picked: every agent, then "Unassigned" for a task that has one */
  private get choices(): Array<string | null> {
    return [...this.agents.map((a) => a.id), ...(this.pickedTask?.agentId ? [null] : [])];
  }
  private get choice() {
    const choices = this.choices;
    return this.picked ? choices[Math.min(this.pickAt, choices.length - 1)] : undefined;
  }

  private describe(to: string | null | undefined, task?: DelegateTask) {
    if (to === null) return "Unassigned";
    const a = to ? this.agents.find((x) => x.id === to) : undefined;
    if (!a || !task) return "";
    if (task.agentId === a.id) return `${a.name}, already there`;
    const until = this.busyUntil(a, this.view().queues, task);
    return `${a.name}: +${task.estimate} min${this.clockNow !== null && until ? `, until ${hhmm(until)}` : ""}`;
  }

  private pick(id: string) {
    this.picked = id;
    this.pickAt = 0;
    const t = this.list.find((x) => x.id === id);
    this.announce = `Picked up ${t?.title}. Choose an agent with the arrow keys and press Enter, or click an agent. ${this.describe(this.agents[0]?.id, t)}`;
  }

  private drop(to: string | null) {
    if (!this.picked) return;
    const pickedTask = this.pickedTask;
    if (pickedTask && (pickedTask.agentId ?? null) === to) this.announce = `${pickedTask.title} stays with ${this.describe(to, pickedTask).split(",")[0]}`;
    else {
      this.assign(this.picked, to);
      this.focusKey = this.picked;
    }
    this.picked = null;
  }

  private cancel() {
    this.picked = null;
    this.announce = "Put back";
  }

  private onTaskKey(e: KeyboardEvent, id: string) {
    if (e.isComposing) return;
    const n = Number(e.key);
    if (e.key.length === 1 && n >= 1 && n <= this.agents.length) {
      e.preventDefault();
      this.assign(id, this.agents[n - 1].id);
      this.focusKey = id;
      this.picked = null;
      return;
    }
    if (this.picked === id) {
      const choices = this.choices;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = (Math.min(this.pickAt, choices.length - 1) + (e.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length;
        this.pickAt = next;
        this.announce = this.describe(choices[next], this.pickedTask);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.drop(this.choice ?? null);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.cancel();
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.pick(id);
    } else if ((e.key === "Delete" || e.key === "Backspace") && this.list.find((t) => t.id === id)?.agentId) {
      e.preventDefault();
      this.assign(id, null);
      this.focusKey = id;
    }
  }

  /** A click: a pointer picks up or puts back; a click without a pointer (assistive tech) acts like Enter */
  private onTaskClick(e: MouseEvent, id: string) {
    e.stopPropagation();
    const wasDrag = this.dragged;
    this.dragged = false;
    if (wasDrag) return;
    if (this.picked !== id) this.pick(id);
    else if (e.detail === 0) this.drop(this.choice ?? null);
    else this.cancel();
  }

  /* ---------- Dragging: the lifted card follows the pointer on its own ---------- */

  private targetAt(x: number, y: number) {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const agent = el?.closest<HTMLElement>("[data-agent]");
    if (agent && this.contains(agent)) return agent.dataset.agent ?? null;
    const pileEl = el?.closest<HTMLElement>("[data-pile]");
    if (pileEl && this.contains(pileEl)) return "pile";
    return null;
  }

  private onDown(e: PointerEvent, id: string, from: Drag["from"]) {
    if (e.button !== 0) return;
    this.dragged = false;
    const el = e.currentTarget as HTMLElement;
    this.start = { id, x: e.clientX, y: e.clientY, el, from };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* capture is a nicety */
    }
  }

  private onMove = (e: PointerEvent) => {
    const s = this.start;
    if (!s) return;
    const drag = this.drag;
    if (!drag) {
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 4) return;
      const r = s.el.getBoundingClientRect();
      const dx = s.x - r.left;
      const dy = s.y - r.top;
      this.drag = { id: s.id, x: e.clientX, y: e.clientY, dx, dy, w: Math.max(r.width, 200), from: s.from, ...placeIn(this, e.clientX, e.clientY, dx, dy) };
      this.picked = null;
    } else {
      // Following the pointer only moves pixels: written straight to the lifted card
      const ghost = this.querySelector<HTMLElement>(":scope > .ui-db__ghost");
      if (ghost) {
        const p = placeIn(this, e.clientX, e.clientY, drag.dx, drag.dy);
        ghost.style.left = `${p.left.toFixed(1)}px`;
        ghost.style.top = `${p.top.toFixed(1)}px`;
      }
    }
    this.over = this.targetAt(e.clientX, e.clientY);
  };

  private onUp = (e: PointerEvent) => {
    const s = this.start;
    this.start = null;
    const drag = this.drag;
    if (!s || !drag) return;
    this.dragged = true;
    const target = this.targetAt(e.clientX, e.clientY);
    const ghost = target ? (this.querySelector<HTMLElement>(":scope > .ui-db__ghost")?.getBoundingClientRect() ?? null) : null;
    this.drag = null;
    this.over = null;
    if (!target) return;
    if (ghost) this.dropped = { id: drag.id, rect: relative(ghost, this.getBoundingClientRect()) };
    this.assign(drag.id, target === "pile" ? null : target);
  };

  private onCancel = () => {
    this.start = null;
    this.drag = null;
    this.over = null;
  };

  /* ---------- Motion: every card glides from where it was; a dropped card from where it was let go ---------- */

  private measureCards() {
    const origin = this.getBoundingClientRect();
    return new Map([...this.querySelectorAll<HTMLElement>("[data-glide]")].map((el) => [el.dataset.glide!, relative(el.getBoundingClientRect(), origin)]));
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const shape = JSON.stringify(this.view().sorted.map((t) => [t.id, t.agentId ?? null]));
    if (shape !== this.lastShape) {
      // Where the cards are now, before this render moves them
      this.glide = this.lastShape !== null;
      this.beforeBoxes = this.glide && this.hasUpdated ? this.measureCards() : null;
      this.lastShape = shape;
    }
    this.toggleAttribute("data-dragging", !!this.drag);
  }

  protected override updated(changed: PropertyValues) {
    if (changed.has("now")) this.syncClock();
    if (this.glide) this.runGlide();

    // Auto: the next unassigned task goes to the least busy agent, one about every second
    const nextId = this.view().pile[0]?.id;
    const autoKey = `${this.mode}|${nextId}|${!!this.drag}`;
    if (autoKey !== this.autoKey) {
      this.autoKey = autoKey;
      clearTimeout(this.autoTimer);
      this.autoTimer = 0;
      if (this.mode === "auto" && nextId && !this.drag && this.isConnected) {
        this.autoTimer = window.setTimeout(
          () => {
            this.autoTimer = 0;
            const who = this.leastBusy();
            if (who) this.assign(nextId, who.id);
          },
          reducedMotion() ? 0 : 900,
        );
      }
    }

    // Esc closes the "+N" tooltip under the pointer, wherever focus is (1.4.13)
    if (!!this.tipHover !== this.tipListening && this.isConnected) {
      this.tipListening = !!this.tipHover;
      if (this.tipListening) window.addEventListener("keydown", this.onTipKey);
      else window.removeEventListener("keydown", this.onTipKey);
    }

    // Focus follows a task moved from the keyboard (or a chip "+N" revealed) – only while focus is still on the board
    // or fell to <body> with the old card
    if (this.focusKey) {
      const key = this.focusKey;
      this.focusKey = null;
      const active = document.activeElement;
      if (!active || active === document.body || this.contains(active)) this.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(key)}"]`)?.focus();
    }
  }

  private runGlide() {
    this.glide = false;
    const drop = this.dropped;
    this.dropped = null;
    const from0 = this.beforeBoxes;
    this.beforeBoxes = null;
    if (reducedMotion() || !from0) return;
    const now0 = this.measureCards();
    const z = scaleOf(this);
    for (const el of this.querySelectorAll<HTMLElement>("[data-glide]")) {
      const id = el.dataset.glide!;
      const from = drop?.id === id ? drop.rect : from0.get(id);
      const to = now0.get(id);
      if (!from || !to) continue;
      const dx = (from.left - to.left) / z;
      const dy = (from.top - to.top) / z;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      // A card that turned into a chip (or back) glides from where it was and fades in – no stretched text
      const resized = Math.abs(from.width - to.width) > 8 || Math.abs(from.height - to.height) > 4;
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)`, opacity: resized ? 0.4 : 1, zIndex: 3 },
          { transform: "none", opacity: 1, zIndex: 3 },
        ],
        { duration: 480, easing: EASE },
      );
    }
  }

  /* ---------- Render ---------- */

  private card(t: DelegateTask) {
    return html`<li class="ui-db__task-slot" data-glide=${t.id}>
      <button
        type="button"
        class="ui-db__task"
        data-task-id=${t.id}
        data-focus-key=${t.id}
        ?data-dragging=${this.drag?.id === t.id}
        ?data-picked=${this.picked === t.id || this.suggestion?.taskId === t.id}
        aria-describedby=${`${this.uid}-how`}
        @pointerdown=${(e: PointerEvent) => this.onDown(e, t.id, "pile")}
        @pointermove=${this.onMove}
        @pointerup=${this.onUp}
        @pointercancel=${this.onCancel}
        @keydown=${(e: KeyboardEvent) => this.onTaskKey(e, t.id)}
        @click=${(e: MouseEvent) => this.onTaskClick(e, t.id)}
      >
        <span class="ui-db__grip">${grip}</span>
        <span class="ui-db__task-main">
          <span class="ui-db__task-title" title=${t.title}>${t.title}</span>
          <span class="ui-db__task-meta">${tools(t)}~${t.estimate} min</span>
        </span>
      </button>
    </li>`;
  }

  /** One agent: who it is, how busy (or what a task on its way would add), and its queue as chips */
  private agentRow(a: DelegateAgent, i: number, queues: Map<string, DelegateTask[]>, target: string | null, moving: DelegateTask | undefined) {
    const q = queues.get(a.id) ?? [];
    const now = this.clockNow;
    const isTarget = target === a.id;
    const preview = isTarget && moving && moving.agentId !== a.id ? this.busyUntil(a, queues, moving) : null;
    const price = preview && moving ? this.costOf(a, moving.estimate) : null;
    const until = this.busyUntil(a, queues);
    const expanded = !!this.expanded[a.id];
    const tipOff = this.tipOff === a.id;
    const shown = expanded ? q : q.slice(0, 3);
    const pickedId = this.picked;
    const choosable = pickedId !== null && !q.some((t) => t.id === pickedId);
    const fmt = this.formatCost;
    const onExpand = (open: boolean) => {
      // Folding the queue back: focus on a chip that goes away moves to the "+N" chip first
      if (!open) rescueFocus(this.querySelector(`[data-agent="${CSS.escape(a.id)}"] .ui-db__queue`), [this.querySelector(`[data-focus-key="${CSS.escape(`more-${a.id}`)}"]`)]);
      this.expanded = { ...this.expanded, [a.id]: open };
      const first = q[3];
      if (open && first) this.focusKey = first.id;
    };
    return html`<li
      class="ui-db__agent"
      data-agent=${a.id}
      ?data-target=${isTarget}
      ?data-choosable=${choosable}
      @click=${() => {
        if (choosable) this.drop(a.id);
      }}
      @pointerenter=${() => {
        if (choosable) this.pickAt = i;
      }}
    >
      <span class="ui-db__avatar" ?data-logo=${!!a.avatar}>${a.avatar ? (typeof a.avatar === "string" ? a.avatar : a.avatar.cloneNode(true)) : initials(a.name)}</span>
      <span class="ui-db__who">
        <span class="ui-db__name-line">
          <span class="ui-db__name" title=${a.name}>${a.name}</span>
          <span class="ui-db__key" aria-hidden="true">${i + 1}</span>
        </span>
        <span class="ui-db__model">${a.model}${a.rate != null ? html`<span class="ui-db__rate">${fmt(a.rate)}/min</span>` : nothing}</span>
      </span>
      <span class="ui-db__load">
        ${price != null ? html`<span class="ui-db__price">+${fmt(price)}</span>` : nothing}
        ${preview
          ? keyed("preview", html`<span class="ui-db__tag" data-kind="preview">+${moving?.estimate}m${now !== null ? html` until ${hhmm(preview)}` : nothing}</span>`)
          : until
            ? keyed(until, html`<span class="ui-db__tag" data-kind="busy">${now !== null ? `Busy until ${hhmm(until)}` : "Busy"}</span>`)
            : keyed("free", html`<span class="ui-db__tag" data-kind="free">Free</span>`)}
      </span>
      <ul class="ui-db__queue" aria-label=${`${a.name}'s queue`}>
        ${repeat(
          shown,
          (t) => t.id,
          (t, k) => html`<li class="ui-db__chip-slot" data-glide=${t.id}>
            <button
              type="button"
              class="ui-db__chip"
              data-chip-id=${t.id}
              data-focus-key=${t.id}
              ?data-running=${k === 0}
              ?data-dragging=${this.drag?.id === t.id}
              ?data-picked=${pickedId === t.id}
              title=${`${t.title} · ~${t.estimate} min`}
              aria-describedby=${`${this.uid}-how`}
              @pointerdown=${(e: PointerEvent) => this.onDown(e, t.id, "queue")}
              @pointermove=${this.onMove}
              @pointerup=${this.onUp}
              @pointercancel=${this.onCancel}
              @keydown=${(e: KeyboardEvent) => this.onTaskKey(e, t.id)}
              @click=${(e: MouseEvent) => this.onTaskClick(e, t.id)}
            >
              ${k === 0 ? spinner : tools(t)}${k === 0 ? html`<span class="ui-db__sr">Running: </span>` : nothing}
              <span class="ui-db__chip-title">${t.title}</span>
            </button>
          </li>`,
        )}
        ${q.length > 3
          ? html`<li
              class="ui-db__more"
              ?data-tip-off=${tipOff || expanded}
              @pointerenter=${() => (this.tipHover = a.id)}
              @pointerleave=${() => {
                this.tipHover = null;
                this.tipOff = null;
              }}
            >
              <button
                type="button"
                class="ui-db__chip ui-db__chip--more"
                data-focus-key=${`more-${a.id}`}
                aria-label=${expanded ? "Show fewer tasks" : `+${q.length - 3} more tasks`}
                aria-expanded=${expanded ? "true" : "false"}
                aria-describedby=${ifDefined(expanded ? undefined : `${this.uid}-more-${i}`)}
                @click=${(e: MouseEvent) => {
                  e.stopPropagation();
                  onExpand(!expanded);
                }}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === "Escape" && !tipOff && !expanded) {
                    e.stopPropagation();
                    this.tipOff = a.id;
                  }
                }}
                @blur=${() => (this.tipOff = null)}
              >${expanded ? "Fewer" : `+${q.length - 3}`}</button>
              ${!expanded
                ? html`<span class="ui-db__tip" id=${`${this.uid}-more-${i}`} role="tooltip">
                    <ul class="ui-db__tip-list">
                      ${q.slice(3).map((t) => html`<li>${tools(t)}<span>${t.title}</span><span class="ui-db__tip-min">~${t.estimate} min</span></li>`)}
                    </ul>
                  </span>`
                : nothing}
            </li>`
          : nothing}
      </ul>
    </li>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const { pile, queues } = this.view();
    const pickedTask = this.pickedTask;
    const choice = this.choice;
    const drag = this.drag;
    const target = drag ? this.over : this.picked ? (choice === null ? "pile" : (choice ?? null)) : (this.suggestion?.agentId ?? null);
    const moving = this.list.find((t) => t.id === (drag?.id ?? this.picked ?? this.suggestion?.taskId));
    const workLeft = (a: DelegateAgent) => {
      const q = queues.get(a.id) ?? [];
      return q.length ? (a.current ?? q[0].estimate) + q.slice(1).reduce((sum, t) => sum + t.estimate, 0) : 0;
    };
    const queued = this.agents.reduce<number | null>((sum, a) => {
      const c = this.costOf(a, workLeft(a));
      return c == null ? sum : (sum ?? 0) + c;
    }, null);
    const auto = this.mode === "auto";

    // The header: on the tray above the card (Standard), or the card's first row (Clean); the hint is its quiet line
    const bar = cardHead({
      icon: agentsIcon,
      title: this.heading,
      subtitle: html`<span class="ui-db__hint">${this.picked ? "Click an agent to hand it over" : auto ? "New tasks go to whoever is free first" : "Drag a task onto an agent"}</span>`,
      aside: html`<button type="button" role="switch" aria-checked=${auto ? "true" : "false"} class="ui-db__auto" @click=${() => this.setMode(auto ? "manual" : "auto")}>
        <span class="ui-db__auto-label">Auto</span>
        <span class="ui-db__switch" aria-hidden="true"><span></span></span>
      </button>`,
    });

    return html`
      ${clean ? nothing : bar}
      <div class="ui-db__card">
        ${clean ? bar : nothing}
        <div class="ui-db__body">
          <section
            class="ui-db__pile"
            data-pile=""
            ?data-over=${(this.over === "pile" && drag?.from === "queue") || target === "pile"}
            ?data-choosable=${!!pickedTask?.agentId}
            aria-labelledby=${`${this.uid}-pile`}
            @click=${() => {
              if (this.pickedTask?.agentId) this.drop(null);
            }}
            @pointerenter=${() => {
              if (this.pickedTask?.agentId) this.pickAt = this.choices.length - 1;
            }}
          >
            <h4 class="ui-db__head" id=${`${this.uid}-pile`}>Unassigned <span class="ui-db__count">${pile.length}</span></h4>
            <ul class="ui-db__tasks">
              ${repeat(pile, (t) => t.id, (t) => this.card(t))}
              ${pile.length === 0 ? html`<li class="ui-db__empty">Everything is handed out</li>` : nothing}
            </ul>
          </section>
          <section class="ui-db__agents" aria-labelledby=${`${this.uid}-agents`}>
            <h4 class="ui-db__head" id=${`${this.uid}-agents`}>Agents${queued != null && queued > 0 ? keyed(Math.round(queued * 100), html`<span class="ui-db__spend">${this.formatCost(queued)} in queues</span>`) : nothing}</h4>
            <ul class="ui-db__roster">
              ${repeat(this.agents, (a) => a.id, (a, i) => this.agentRow(a, i, queues, target, moving))}
            </ul>
          </section>
        </div>
      </div>
      ${drag && moving
        ? html`<div class="ui-db__ghost" style=${styleMap({ left: `${drag.left.toFixed(1)}px`, top: `${drag.top.toFixed(1)}px`, width: `${drag.w / drag.z}px` })} aria-hidden="true">
            <span class="ui-db__grip">${grip}</span>
            <span class="ui-db__task-main">
              <span class="ui-db__task-title">${moving.title}</span>
              <span class="ui-db__task-meta">${tools(moving)}~${moving.estimate} min</span>
            </span>
          </div>`
        : nothing}
      <span class="ui-db__sr" id=${`${this.uid}-how`}>Drag onto an agent, or click it and then click an agent. With the keyboard: Enter picks it up, the arrow keys choose, Enter hands it over, Escape puts it back. Number keys hand it over at once; Delete unassigns a queued task.</span>
      <span class="ui-db__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="db"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="db"] {
  --tc-delegate-board-target-bg: light-dark(rgba(47, 107, 255, 0.045), rgba(91, 154, 255, 0.08));
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 720px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="db"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="db"] {
  --tc-delegate-board-target-bg: light-dark(rgba(0, 120, 245, 0.045), rgba(91, 154, 255, 0.08));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 720px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="db"][data-dragging] { cursor: grabbing; user-select: none; -webkit-user-select: none; }
[data-ui="db"] *, [data-ui="db"] *::before, [data-ui="db"] *::after { box-sizing: border-box; }
:where([data-ui="db"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="db"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="db"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="db"] h4 { margin: 0; }
[data-ui="db"] svg { display: block; flex: none; }
.ui-db__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card holds the pile and the agents */
.ui-db__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
/* ----- The header (cardHead): on the tray in Standard, the card's first row in Clean (a hairline under it) ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-db__card > .tc-head + .ui-db__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
/* Auto: a label and a switch – on, the word is strong and the track filled; off, the word is muted */
.ui-db__auto { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); min-height: 28px; padding: 0 var(--tc-space-0-5) 0 var(--tc-space-1-5); border-radius: var(--tc-control-radius-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-db__auto-label { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__auto-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); transition: color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-db__auto[aria-checked="false"] .ui-db__auto-label { color: var(--tc-text-muted); }
.ui-db__switch { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-db__switch > span { position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: calc(var(--tc-switch-radius) - (var(--tc-switch-h) - var(--tc-switch-knob)) / 2); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-emphasized); }
.ui-db__auto[aria-checked="true"] .ui-db__switch { background: var(--tc-switch-on); }
.ui-db__auto[aria-checked="true"] .ui-db__switch > span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-db__body { display: grid; grid-template-columns: 236px minmax(0, 1fr); }
.ui-db__head { display: flex; align-items: center; gap: var(--tc-space-1-5); margin: 0 var(--tc-space-1) var(--tc-space-2) !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-db__count { display: grid; place-items: center; min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-db__count { color: var(--tc-text-secondary); }
/* ----- The pile ----- */
/* New work sits in a soft gray area, like the columns of Agent Inbox */
:where([data-look="standard"], [data-look="standard"] *).ui-db__pile { margin: var(--tc-space-3) 0 var(--tc-space-3) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-1-5) var(--tc-space-1-5); border-radius: var(--tc-radius-xl); background: var(--tc-surface-sunken); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__pile { margin: var(--tc-space-3) 0 var(--tc-space-3) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-1-5) var(--tc-space-1-5); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-db__pile .ui-db__head { margin-left: var(--tc-space-1-5) !important; }
.ui-db__pile[data-over] { box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
.ui-db__pile[data-choosable], .ui-db__agent[data-choosable] { cursor: pointer; }
.ui-db__tasks { display: grid; gap: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-db__task,
:where([data-look="standard"], [data-look="standard"] *).ui-db__ghost { display: flex; align-items: flex-start; gap: var(--tc-space-2); width: 100%; padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-radius-xl); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); cursor: grab; touch-action: none; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__task,
:where([data-look="clean"], [data-look="clean"] *).ui-db__ghost { display: flex; align-items: flex-start; gap: var(--tc-space-2); width: 100%; padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-1-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); cursor: grab; touch-action: none; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-db__task:hover { box-shadow: var(--tc-card-shadow-hover); }
.ui-db__task[data-dragging], .ui-db__chip[data-dragging] { opacity: 0.35; }
/* Picked up (click or Enter): a 1px selected edge, not only a tint */
.ui-db__task[data-picked], .ui-db__chip[data-picked] { background: var(--tc-delegate-board-target-bg); box-shadow: inset 0 0 0 1px var(--tc-border-selected), var(--tc-shadow-raised); }
.ui-db__grip { display: grid; flex: none; place-items: center; width: 12px; height: 20px; color: var(--tc-text-disabled); }
.ui-db__task-main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-db__task-title { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-db__task-meta { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-db__tools { display: flex; gap: var(--tc-space-1); }
.ui-db__tool, .ui-db__tool > svg { display: grid; width: 12px; height: 12px; }
/* Empty: just a quiet line on the gray area */
.ui-db__empty { display: grid; place-items: center; min-height: 52px; padding: var(--tc-space-2) var(--tc-space-2-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: center; }
/* The lifted card: tilted a touch, a deeper shadow, under the pointer */
.ui-db__ghost { position: absolute; z-index: var(--tc-z-drag); box-shadow: var(--tc-shadow-raised); cursor: grabbing; pointer-events: none; transform: rotate(1.5deg) scale(1.02); }
/* ----- The agents ----- */
.ui-db__agents { padding: var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-3); }
.ui-db__roster { display: grid; gap: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-db__agent { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; grid-template-areas: "avatar who load" "avatar queue queue"; column-gap: var(--tc-space-3); row-gap: var(--tc-space-2); padding: var(--tc-space-2-5); border-radius: var(--tc-radius-xl); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__agent { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; grid-template-areas: "avatar who load" "avatar queue queue"; column-gap: var(--tc-space-2-5); row-gap: var(--tc-space-1-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-2); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
[data-ui="db"][data-dragging] .ui-db__agent { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
/* The agent under a dragged or picked task: a light blue wash and the selected edge */
[data-ui="db"] .ui-db__agent[data-target] { background: var(--tc-delegate-board-target-bg); box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
/* Agents are rounded squares in both looks (people are circles) */
:where([data-look="standard"], [data-look="standard"] *).ui-db__avatar { grid-area: avatar; display: grid; place-items: center; width: 30px; height: 30px; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__avatar { grid-area: avatar; display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-db__avatar[data-logo] { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-db__avatar > svg { width: 15px; height: 15px; }
.ui-db__who { grid-area: who; display: grid; min-width: 0; }
.ui-db__name-line { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-db__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-db__key { display: none; place-items: center; flex: none; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-kbd-fg); }
[data-ui="db"]:focus-within .ui-db__key { display: grid; }
.ui-db__model { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-db__load { grid-area: load; align-self: start; display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-db__spend { margin-left: auto; font-variant-numeric: tabular-nums; animation: ui-db-in var(--tc-duration-moderate) var(--tc-ease-emphasized) both; }
/* The price per minute sits after the model in a lighter grey, the hand-off price as quiet text next to the tag – no extra pills */
.ui-db__rate { margin-left: var(--tc-space-1-5); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-db__price { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-accent-text); white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-db-in var(--tc-duration-moderate) var(--tc-ease-emphasized) both; }
/* Free / Busy / the preview: status pills */
.ui-db__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-db-in var(--tc-duration-moderate) var(--tc-ease-emphasized) both; }
.ui-db__tag[data-kind="free"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-db__tag[data-kind="busy"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__tag[data-kind="busy"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-db__tag[data-kind="preview"] { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); color: var(--tc-accent-text); }
.ui-db__queue { grid-area: queue; display: flex; flex-wrap: wrap; gap: var(--tc-space-1); min-width: 0; }
.ui-db__queue:empty { display: none; }
.ui-db__chip-slot { min-width: 0; max-width: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-db__chip { display: flex; align-items: center; gap: var(--tc-space-1); max-width: 100%; height: 26px; padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); cursor: grab; touch-action: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-db__chip { display: flex; align-items: center; gap: var(--tc-space-1); max-width: 100%; height: 24px; padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); cursor: grab; touch-action: none; }
/* The running task: accent tint, accent text, medium weight – and the spinner, which is the non-colour cue */
.ui-db__chip[data-running] { background: var(--tc-accent-subtle); box-shadow: none; color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
.ui-db__chip-title { min-width: 0; max-width: 150px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-db__more { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-db__chip--more { padding: 0 var(--tc-space-2); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *).ui-db__chip--more { padding: 0 var(--tc-space-2); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); cursor: pointer; }
/* The tooltip: the tooltip spec – ink with its own text colour, light in dark mode. Hoverable: a bridge covers the gap */
.ui-db__tip { position: absolute; bottom: calc(100% + 6px); left: 50%; z-index: var(--tc-z-dropdown); display: grid; width: max-content; max-width: min(320px, 80vw); padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-tooltip-font-size); line-height: var(--tc-line-height-tight); color: var(--tc-tooltip-fg); text-align: left; opacity: 0; visibility: hidden; transform: translate(-50%, 3px); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard), visibility 0s linear var(--tc-duration-fast); }
.ui-db__tip::after { content: ""; position: absolute; top: 100%; right: 0; left: 0; height: 8px; }
.ui-db__more:hover .ui-db__tip, .ui-db__more:focus-within .ui-db__tip { opacity: 1; visibility: visible; transform: translate(-50%, 0); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard), visibility 0s; }
.ui-db__more[data-tip-off] .ui-db__tip { opacity: 0; visibility: hidden; }
.ui-db__tip-list { display: grid; gap: var(--tc-space-0-5); }
.ui-db__tip-list li { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-0-5) 0; }
/* The tooltip inverts the theme. Black marks (Notion, GitHub …) turn white on the dark tooltip – logos drawn in
   currentColor or the ink tokens follow */
.ui-db__tip { --tc-text-strong: var(--tc-tooltip-fg); --tc-text-primary: var(--tc-tooltip-fg); }
.ui-db__tip-min { margin-left: auto; padding-left: var(--tc-space-1-5); color: color-mix(in srgb, var(--tc-tooltip-fg) 72%, transparent); white-space: nowrap; }
/* The running spinner turns a few times, then rests as an arc (2.2.2) */
.ui-db__spin { animation: ui-db-spin var(--tc-duration-reveal-slow) linear 6; }
@keyframes ui-db-spin { to { transform: rotate(360deg); } }
@keyframes ui-db-in { from { opacity: 0; transform: translateY(2px); } }
/* Narrow containers: the pile above the agents */
@container (max-width: 560px) {
  .ui-db__body { grid-template-columns: minmax(0, 1fr); }
  .ui-db__pile { margin: var(--tc-space-3) var(--tc-space-3) 0; }
  .ui-db__hint { display: none; }
}
/* Very narrow: the tag moves under the name, so the name keeps its width */
@container (max-width: 340px) {
  [data-ui="db"] .ui-db__agent { grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "avatar who" "avatar load" "avatar queue"; }
}
@media (pointer: coarse) {
  .ui-db__auto { min-height: 34px; }
  .ui-db__chip { height: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="db"] *, [data-ui="db"] *::before, [data-ui="db"] *::after { animation: none !important; transition: none !important; }
  .ui-db__ghost { transform: none; }
}
`;
}

if (!customElements.get("tc-delegate-board")) customElements.define("tc-delegate-board", TcDelegateBoard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-delegate-board": TcDelegateBoard;
  }
}
