import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, OnScreenController, rescueFocus } from "./internal/controllers";

/*
 * <tc-agent-plan> – the Lit port of src/components/agent-plan.tsx: an AI agent proposes a step-by-step plan, the user
 * adjusts it, then watches it run. In review (status "draft") steps can be renamed inline, removed, reordered by
 * dragging the grip, with Alt+↑/↓ or the move buttons, and new ones added at the end. Once running, each step shows a
 * spinner and a live timer, done steps draw a check and show their duration, failed ones offer "Retry from here", and
 * a thin line on the left fills as the plan moves along.
 *
 *   <tc-agent-plan heading="Find out why customers churned" estimate="~2 min" .steps=${steps} status="draft"
 *     cancellable retryable rerunnable></tc-agent-plan>
 *
 * The phase (`status`) is always the app's: the plan never moves itself from one phase to the next. Live timers are
 * written into the DOM while the plan is on screen – no re-render per tick.
 */

export type AgentPlanStepStatus = "pending" | "active" | "done" | "failed" | "skipped";

export type AgentPlanStep = {
  id: string;
  title: string;
  /** A second, quieter line under the title */
  detail?: string;
  /** Tool the agent will call, shown as a small mono chip, e.g. "search_web" */
  tool?: string;
  status?: AgentPlanStepStatus;
  /** How long the step took, in ms – shown next to done steps (measured live if left out) */
  duration?: number;
  /** Shown under a failed step */
  error?: string;
};

export type AgentPlanStatus = "draft" | "running" | "done";

let uid = 0;
const makeId = () => `step-${Date.now().toString(36)}-${(uid++).toString(36)}`;
let instances = 0;

const move = <T>(list: T[], from: number, to: number) => {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/** The current translateY of an element, including one mid-transition */
const translateOf = (el: HTMLElement) => {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  try {
    return new DOMMatrixReadOnly(t).m42;
  } catch {
    return 0;
  }
};
const reducedMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** 0.8s, 12s, 1m 05s */
const fmt = (ms: number) => {
  const s = Math.max(0, ms) / 1000;
  if (s < 10) return `${s.toFixed(1)}s`;
  if (s < 60) return `${Math.round(s)}s`;
  const r = Math.round(s);
  return `${Math.floor(r / 60)}m ${String(r % 60).padStart(2, "0")}s`;
};
/** 14s, 1m 05s – for totals */
const fmtWhole = (ms: number) => {
  const r = Math.max(1, Math.round(ms / 1000));
  return r < 60 ? `${r}s` : `${Math.floor(r / 60)}m ${String(r % 60).padStart(2, "0")}s`;
};

const STATUS_TEXT: Record<AgentPlanStepStatus, string> = {
  pending: "Pending",
  active: "In progress",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
};

type Drag = { id: string; pointer: number; ids: string[]; from: number; to: number; startY: number; scale: number; dy: number; tops: number[]; heights: number[] };
type Work = { kind: "run" | "retry"; id?: string; state: "pending" | "error" } | null;
type Editing = { id: string; value: string } | null;

/* ---------- Icons ---------- */

/** Eight rays that fade one after another – the spinner turns without rotating */
const spinner = html`<svg class="ui-pl__spinner" viewBox="0 0 16 16">${Array.from(
  { length: 8 },
  (_, i) => svg`<line x1="8" y1="1.75" x2="8" y2="4.75" transform=${`rotate(${i * 45} 8 8)`} style=${`animation-delay: ${(i - 8) * 100}ms`}></line>`,
)}</svg>`;
const listIcon = html`<svg viewBox="0 0 16 16">${svg`<path d="M6.5 4.5h7M6.5 8h7M6.5 11.5h7"></path><circle cx="3.25" cy="4.5" r=".6"></circle><circle cx="3.25" cy="8" r=".6"></circle><circle cx="3.25" cy="11.5" r=".6"></circle>`}</svg>`;
const clockIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="6"></circle><path d="M8 5v3.2l2 1.3"></path>`}</svg>`;
const gripIcon = html`<svg viewBox="0 0 16 16">${svg`<circle cx="6" cy="4" r="1.1"></circle><circle cx="10" cy="4" r="1.1"></circle><circle cx="6" cy="8" r="1.1"></circle><circle cx="10" cy="8" r="1.1"></circle><circle cx="6" cy="12" r="1.1"></circle><circle cx="10" cy="12" r="1.1"></circle>`}</svg>`;
const doneMark = html`<svg viewBox="0 0 16 16" class="ui-pl__mark">${svg`<path d="M4.2 8.4 6.8 11l5-5.6" pathLength="1" class="ui-pl__draw"></path>`}</svg>`;
const failedMark = html`<svg viewBox="0 0 16 16" class="ui-pl__mark">${svg`<path d="M8 4.2v4.4M8 11.6h.01"></path>`}</svg>`;
const skippedMark = html`<svg viewBox="0 0 16 16" class="ui-pl__mark">${svg`<path d="M5 8h6"></path>`}</svg>`;
const retryIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M13 8a5 5 0 1 1-1.6-3.7"></path><path d="M13 3v2.6h-2.6"></path>`}</svg>`;
const upIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 12V4M4.5 7.5 8 4l3.5 3.5"></path>`}</svg>`;
const downIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 4v8M4.5 8.5 8 12l3.5-3.5"></path>`}</svg>`;
const removeIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"></path>`}</svg>`;
const addIcon = html`<svg viewBox="0 0 16 16">${svg`<path d="M8 4.5v7M4.5 8h7"></path>`}</svg>`;
const runIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M5.5 3.8v8.4L12 8z"></path>`}</svg>`;

/**
 * A step-by-step plan from an agent: reviewed and edited as a draft, then shown while it runs.
 * @tag tc-agent-plan
 * @fires tc-steps-change - An edit in review: rename, remove, reorder, add (detail: { steps: AgentPlanStep[] }); cancelable
 * @fires tc-run - "Run plan" or "Run again" pressed (detail: { steps: AgentPlanStep[] }, in their final order)
 * @fires tc-retry - "Retry from here" pressed on a failed step (detail: { stepId: string })
 * @fires tc-cancel - "Cancel" pressed (shown with `cancellable`)
 */
export class TcAgentPlan extends TcElement {
  static override ui = "pl";

  /** The steps. Edits apply unless a tc-steps-change listener calls preventDefault() */
  @property({ attribute: false }) accessor steps: AgentPlanStep[] = [];
  /** "draft" = review and edit, "running" = executing, "done" = finished – always set by the app */
  @property() accessor status: AgentPlanStatus = "draft";
  /** The goal of the plan, shown as the heading */
  @property() accessor heading = "";
  /** Estimated run time shown in review, e.g. "~2 min" */
  @property() accessor estimate = "";
  /** Shows a "Cancel" button next to "Run plan" (fires tc-cancel) */
  @property({ type: Boolean }) accessor cancellable = false;
  /** Shows "Retry from here" on failed steps (fires tc-retry) */
  @property({ type: Boolean }) accessor retryable = false;
  /** Shows "Run again" once the plan is done (fires tc-run) */
  @property({ type: Boolean }) accessor rerunnable = false;
  /** Called on run (as well as tc-run). May return a promise: the button waits, and if it rejects the plan stays in
   *  review and says so */
  @property({ attribute: false }) accessor runner: ((steps: AgentPlanStep[]) => void | Promise<unknown>) | undefined = undefined;
  /** Called on retry (as well as tc-retry). May return a promise: the button waits, and says so if it rejects */
  @property({ attribute: false }) accessor retrier: ((stepId: string) => void | Promise<unknown>) | undefined = undefined;

  /** @internal */ @state() accessor editing: Editing = null;
  /** @internal */ @state() accessor adding = "";
  /** @internal */ @state() accessor removing: string[] = [];
  /** @internal */ @state() accessor message = "";
  /** @internal */ @state() accessor work: Work = null;
  /** @internal */ @state() accessor dragId: string | null = null;
  /** @internal */ @state() accessor total: number | null = null;

  private readonly hintId = `tc-pl${++instances}-hint`;
  private onScreenCtl = new OnScreenController(this);
  private rows = new Map<string, HTMLLIElement>();
  private tops = new Map<string, number>();
  private prevOrder = "";
  private ro?: ResizeObserver;
  private refocus: string | null = null;
  private born = new Set<string>();
  private seen = new Map<string, AgentPlanStepStatus>();
  private timers = new Set<number>();
  private drag: Drag | null = null;
  private runStart: number | null = null;
  private starts = new Map<string, number>();
  private measured = new Map<string, number>();
  private statusKey = "";
  private editFocus: string | null = null;
  private ticker = 0;
  private live: { el: HTMLElement; since: () => number | undefined; format: (ms: number) => string }[] = [];

  constructor() {
    super();
    // Run / Run again / Cancel swap the footer: focus moves to the run's status line instead of <body> (WCAG 2.4.3)
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-pl__foot .ui-pl__status, .ui-pl__foot button:not(:disabled)"));
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this.syncTicker);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this.syncTicker);
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers.clear();
    window.clearInterval(this.ticker);
    this.ticker = 0;
    this.ro?.disconnect();
    this.ro = undefined;
  }

  private get draft() {
    return this.status === "draft";
  }

  /** setTimeout that no timer outlives the element */
  private later(fn: () => void, ms: number) {
    const t = window.setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  /** A trailing no-break space makes repeated messages count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  private commit(next: AgentPlanStep[]) {
    if (this.emit("tc-steps-change", { steps: next }, { cancelable: true })) this.steps = next;
  }

  /** Run and Retry may return a promise: the button waits, a rejection is shown until the next try */
  private perform(kind: "run" | "retry", id: string | undefined, done: void | Promise<unknown> | undefined) {
    if (!done || typeof (done as Promise<unknown>).then !== "function") {
      this.work = null;
      return;
    }
    this.work = { kind, id, state: "pending" };
    (done as Promise<unknown>).then(
      () => this.isConnected && (this.work = null),
      () => this.isConnected && (this.work = { kind, id, state: "error" }),
    );
  }

  private run = () => {
    const steps = this.steps;
    this.emit("tc-run", { steps });
    this.perform("run", undefined, this.runner?.(steps));
  };

  private retry(id: string) {
    this.emit("tc-retry", { stepId: id });
    this.perform("retry", id, this.retrier?.(id));
  }

  /* ---------- Edits ---------- */

  private focusRow(id: string | undefined) {
    if (id) this.rows.get(id)?.focus();
    else this.addInput?.focus();
  }

  private get addInput() {
    return this.querySelector<HTMLInputElement>(".ui-pl__add input");
  }

  private moveBy(id: string, delta: number) {
    const list = this.steps;
    const from = list.findIndex((s) => s.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return;
    this.refocus = id;
    this.commit(move(list, from, to));
    this.announce(`Moved “${list[from].title}” to position ${to + 1} of ${list.length}`);
  }

  private removeStep(id: string) {
    if (!this.draft || this.removing.includes(id)) return;
    const list = this.steps;
    const i = list.findIndex((s) => s.id === id);
    if (i < 0) return;
    const el = this.rows.get(id);
    const near = list[i + 1] ?? list[i - 1];
    rescueFocus(el, [near && this.rows.get(near.id), this.addInput]);
    this.announce(`Removed “${list[i].title}”`);
    if (!el || reducedMotion()) {
      this.commit(list.filter((s) => s.id !== id));
      return;
    }
    // Collapse the row first, then drop it – the rows below close the gap with it
    el.style.height = `${el.offsetHeight}px`;
    el.getBoundingClientRect();
    this.removing = [...this.removing, id];
    this.later(() => {
      el.style.height = "";
      this.removing = this.removing.filter((x) => x !== id);
      this.commit(this.steps.filter((s) => s.id !== id));
    }, 260);
  }

  private startEdit(id: string) {
    if (!this.draft) return;
    const s = this.steps.find((x) => x.id === id);
    if (s) {
      this.editing = { id, value: s.title };
      this.editFocus = id;
    }
  }

  private finishEdit(save: boolean, keyboard = false) {
    const e = this.editing;
    if (!e) return;
    this.editing = null;
    // Back to the row after Enter or Escape; a click elsewhere keeps its own focus
    if (keyboard) this.refocus = e.id;
    const value = e.value.trim();
    const s = this.steps.find((x) => x.id === e.id);
    if (save && s && value && value !== s.title) {
      this.commit(this.steps.map((x) => (x.id === e.id ? { ...x, title: value } : x)));
      this.announce(`Renamed to “${value}”`);
    }
  }

  private add() {
    const value = this.adding.trim();
    if (!value) return;
    const id = makeId();
    this.born.add(id);
    const count = this.steps.length;
    this.commit([...this.steps, { id, title: value }]);
    this.adding = "";
    this.announce(`Added “${value}” as step ${count + 1}`);
  }

  private onRowKey(e: KeyboardEvent, id: string) {
    if (!this.draft || e.target !== e.currentTarget) return;
    const list = this.steps;
    const i = list.findIndex((s) => s.id === id);
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      this.moveBy(id, e.key === "ArrowUp" ? -1 : 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = list[i + (e.key === "ArrowUp" ? -1 : 1)];
      if (next) this.focusRow(next.id);
      else if (e.key === "ArrowDown") this.addInput?.focus();
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      this.startEdit(id);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this.removeStep(id);
    }
  }

  private onAddKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      this.add();
    } else if (e.key === "Escape") {
      this.adding = "";
    } else if (e.key === "ArrowUp" && !this.adding) {
      // ↑ in the empty field: back to the last row
      const last = this.steps[this.steps.length - 1];
      if (last) {
        this.focusRow(last.id);
        e.preventDefault();
      }
    }
  };

  /* ---------- Drag the grip to reorder: the dragged row follows the pointer and the others make room ---------- */

  private onGripDown(e: PointerEvent, id: string) {
    if (!this.draft || e.button !== 0 || this.editing || this.removing.length) return;
    const ids = this.steps.map((s) => s.id);
    const els = ids.map((x) => this.rows.get(x));
    if (els.some((x) => !x)) return;
    const list = els as HTMLLIElement[];
    const from = ids.indexOf(id);
    const el = list[from];
    // Pointer moves are in screen pixels; offsets are in layout pixels (they differ inside CSS zoom)
    const scale = el.offsetHeight ? el.getBoundingClientRect().height / el.offsetHeight : 1;
    e.preventDefault();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* capture is a nicety */
    }
    this.drag = { id, pointer: e.pointerId, ids, from, to: from, startY: e.clientY, scale: scale || 1, dy: 0, tops: list.map((x) => x.offsetTop), heights: list.map((x) => x.offsetHeight) };
    this.dragId = id;
  }

  private onGripMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.pointer !== e.pointerId) return;
    const last = d.ids.length - 1;
    const min = d.tops[0] - d.tops[d.from];
    const max = d.tops[last] + d.heights[last] - (d.tops[d.from] + d.heights[d.from]);
    d.dy = Math.min(max, Math.max(min, (e.clientY - d.startY) / d.scale));
    this.rows.get(d.id)?.style.setProperty("transform", `translateY(${d.dy}px)`);
    const center = d.tops[d.from] + d.dy + d.heights[d.from] / 2;
    let to = 0;
    d.ids.forEach((_, i) => {
      if (i !== d.from && d.tops[i] + d.heights[i] / 2 < center) to++;
    });
    if (to === d.to) return;
    d.to = to;
    // The others make room for the dragged row
    const h = d.heights[d.from];
    d.ids.forEach((id, i) => {
      if (i === d.from) return;
      const shift = d.from < to && i > d.from && i <= to ? -h : to < d.from && i >= to && i < d.from ? h : 0;
      const el = this.rows.get(id);
      if (el) el.style.transform = shift ? `translateY(${shift}px)` : "";
    });
  };

  private onGripUp = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.pointer !== e.pointerId) return;
    this.drag = null;
    this.dragId = null;
    if (d.to === d.from) {
      // Glides back into its slot
      const el = this.rows.get(d.id);
      if (el) el.style.transform = "";
      return;
    }
    // Start the FLIP from where everything is on screen right now
    this.rows.forEach((el, id) => {
      this.tops.set(id, el.offsetTop + translateOf(el));
      el.style.transition = "none";
      el.style.transform = "";
    });
    const list = this.steps;
    const moved = list.find((s) => s.id === d.id);
    this.commit(move(list, d.from, d.to));
    // If the order didn't change after all (the app said no), hand the transitions back – and note where the rows are
    requestAnimationFrame(() => {
      this.rows.forEach((el) => (el.style.transition = ""));
      this.measureRows();
    });
    if (moved) this.announce(`Moved “${moved.title}” to position ${d.to + 1} of ${list.length}`);
  };

  /* ---------- Rows glide to their new place (FLIP) ---------- */

  private measureRows = () => {
    const next = new Map<string, number>();
    this.rows.forEach((el, id) => next.set(id, el.offsetTop));
    this.tops = next;
  };

  /* ---------- Live clock: text written straight into the DOM ---------- */

  private tick = () => {
    const now = Date.now();
    for (const { el, since, format } of this.live) {
      const start = since();
      const text = format(start !== undefined ? Math.max(0, now - start) : 0);
      if (el.textContent !== text) el.textContent = text;
    }
  };
  private syncTicker = () => {
    const run = this.isConnected && this.live.length > 0 && this.onScreenCtl.onScreen && document.visibilityState !== "hidden";
    if (run && !this.ticker) this.ticker = window.setInterval(this.tick, 100);
    else if (!run && this.ticker) {
      window.clearInterval(this.ticker);
      this.ticker = 0;
    }
    if (run) this.tick();
  };

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.dataset.status = this.status;
    this.toggleAttribute("data-dragging", !!this.dragId);
    // When the run started and when each step did, so the live timers and the durations need no extra properties
    if (changed.has("status")) {
      const was = changed.get("status");
      if (this.status === "running" && (this.runStart === null || was === "done")) this.runStart = Date.now();
      if (this.status === "draft") {
        this.runStart = null;
        this.total = null;
      }
      if (this.status === "done") {
        const sum = this.steps.reduce((acc, s) => acc + (s.duration ?? this.measured.get(s.id) ?? 0), 0);
        this.total = this.runStart !== null ? Date.now() - this.runStart : sum;
      }
      // Leaving review cancels any half-finished edit
      if (!this.draft) {
        this.editing = null;
        this.adding = "";
      }
    }
    const statusKey = this.steps.map((s) => `${s.id}:${s.status ?? "pending"}`).join("\n");
    if (statusKey !== this.statusKey) {
      this.statusKey = statusKey;
      const now = Date.now();
      this.steps.forEach((s) => {
        const st = s.status ?? "pending";
        if (st === "active") {
          if (!this.starts.has(s.id)) this.starts.set(s.id, now);
        } else if (this.starts.has(s.id)) {
          if (st === "done") this.measured.set(s.id, now - this.starts.get(s.id)!);
          this.starts.delete(s.id);
        }
        if (st === "pending") this.measured.delete(s.id);
      });
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!this.isConnected) return;
    const lis = [...this.querySelectorAll<HTMLLIElement>(".ui-pl__list > .ui-pl__step")];
    this.rows = new Map(this.steps.map((s, i) => [s.id, lis[i]] as const).filter(([, el]) => !!el));

    // Rows glide from where they were to where they are when the order changes
    const order = this.steps.map((s) => s.id).join("\n");
    if (order !== this.prevOrder) {
      const first = !this.hasUpdatedOrder;
      this.prevOrder = order;
      this.hasUpdatedOrder = true;
      const old = this.tops;
      this.measureRows();
      if (!first && !reducedMotion()) {
        // All reads above; now the writes, with a single reflow to apply every start position
        let moved: HTMLLIElement | null = null;
        this.rows.forEach((el, id) => {
          const from = old.get(id);
          const top = this.tops.get(id);
          if (from !== undefined && top !== undefined && from !== top) {
            el.style.transition = "none";
            el.style.transform = `translateY(${from - top}px)`;
            moved = el;
          }
        });
        if (moved) (moved as HTMLLIElement).getBoundingClientRect();
        this.rows.forEach((el) => {
          el.style.transition = "";
          el.style.transform = "";
        });
      }
      // Where the rows are is kept current by a ResizeObserver (a row only moves when one above it changes size)
      this.ro?.disconnect();
      if (typeof ResizeObserver !== "undefined") {
        this.ro = new ResizeObserver(this.measureRows);
        this.rows.forEach((el) => this.ro!.observe(el));
      }
    } else this.measureRows();

    // A rename's field takes focus and selects its text
    if (this.editFocus && this.editing?.id === this.editFocus) {
      this.editFocus = null;
      this.querySelector<HTMLInputElement>(".ui-pl__edit")?.focus();
    }
    // After a move or an edit, focus goes back to the row
    if (this.refocus && !this.editing) {
      const el = this.rows.get(this.refocus);
      this.refocus = null;
      if (el && document.activeElement !== el) el.focus();
    }

    // Announce step results and the end of the run
    const said: string[] = [];
    this.steps.forEach((s, i) => {
      const st = s.status ?? "pending";
      const was = this.seen.get(s.id);
      if (!this.draft && was !== undefined && was !== st) {
        if (st === "done") said.push(`Step ${i + 1} done: ${s.title}`);
        if (st === "failed") said.push(`Step ${i + 1} failed: ${s.title}${s.error ? `. ${s.error}` : ""}`);
        if (st === "skipped") said.push(`Step ${i + 1} skipped`);
      }
      this.seen.set(s.id, st);
    });
    if (said.length) this.announce(said.join(". "));
    if (changed.has("status") || changed.has("total")) {
      if (this.status === "running" && changed.has("status")) this.announce("Running plan");
      if (this.status === "done" && this.total !== null) this.announce(`Plan done in ${fmtWhole(this.total)}`);
    }

    // The live timers: active steps and the run's elapsed time
    this.live = [];
    this.steps.forEach((s) => {
      if (this.draft || (s.status ?? "pending") !== "active") return;
      const el = this.rows.get(s.id)?.querySelector<HTMLElement>(".ui-pl__aside > .ui-pl__time");
      if (el) this.live.push({ el, since: () => this.starts.get(s.id), format: fmt });
    });
    const elapsed = this.querySelector<HTMLElement>(".ui-pl__elapsed");
    if (elapsed) this.live.push({ el: elapsed, since: () => this.runStart ?? undefined, format: fmtWhole });
    this.syncTicker();
  }

  private hasUpdatedOrder = false;

  /* ---------- Render ---------- */

  private renderStep(s: AgentPlanStep, i: number, n: number) {
    const draft = this.draft;
    const st: AgentPlanStepStatus = s.status ?? "pending";
    const editing = draft && this.editing?.id === s.id ? this.editing : null;
    const work = this.work;
    const ran = s.duration ?? this.measured.get(s.id);
    return html`<li
      class="ui-pl__step"
      data-step=${ifDefined(draft ? undefined : st)}
      data-dragging=${ifDefined(this.dragId === s.id ? "" : undefined)}
      data-removing=${ifDefined(this.removing.includes(s.id) ? "" : undefined)}
      data-enter=${ifDefined(this.born.has(s.id) ? "" : undefined)}
      @animationend=${(e: AnimationEvent) => {
        if (e.target === e.currentTarget) this.born.delete(s.id);
      }}
      tabindex=${ifDefined(draft && !editing ? "0" : undefined)}
      aria-describedby=${ifDefined(draft ? this.hintId : undefined)}
      aria-current=${ifDefined(st === "active" && !draft ? "step" : undefined)}
      @keydown=${(e: KeyboardEvent) => this.onRowKey(e, s.id)}
    >
      ${draft
        ? html`<span
            class="ui-pl__grip"
            aria-hidden="true"
            title="Drag to reorder"
            @pointerdown=${(e: PointerEvent) => this.onGripDown(e, s.id)}
            @pointermove=${this.onGripMove}
            @pointerup=${this.onGripUp}
            @pointercancel=${this.onGripUp}
            >${gripIcon}</span
          >`
        : nothing}
      <span class="ui-pl__marker" aria-hidden="true">${draft || st === "pending" ? html`<span class="ui-pl__num">${i + 1}</span>` : st === "active" ? spinner : st === "done" ? doneMark : st === "failed" ? failedMark : skippedMark}</span>
      <div class="ui-pl__main">
        ${editing
          ? html`<input
              class="ui-pl__edit"
              .value=${editing.value}
              aria-label=${`Rename step ${i + 1}`}
              @focus=${(e: FocusEvent) => (e.currentTarget as HTMLInputElement).select()}
              @input=${(e: InputEvent) => (this.editing = { id: s.id, value: (e.currentTarget as HTMLInputElement).value })}
              @blur=${() => this.finishEdit(true)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.isComposing) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  this.finishEdit(true, true);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  this.finishEdit(false, true);
                }
              }}
            />`
          : html`<span class="ui-pl__name" @dblclick=${() => this.startEdit(s.id)}>${s.title}</span>`}
        ${s.detail || s.tool
          ? html`<span class="ui-pl__sub">${s.detail ? html`<span class="ui-pl__detail">${s.detail}</span>` : nothing}${s.tool ? html`<code class="ui-pl__tool">${s.tool}</code>` : nothing}</span>`
          : nothing}
        ${!draft ? html`<span class="ui-pl__sr">, ${STATUS_TEXT[st]}</span>` : nothing}
        ${!draft && st === "failed"
          ? html`<span class="ui-pl__fail">
              <span class="ui-pl__error">${work?.kind === "retry" && work.id === s.id && work.state === "error" ? "Couldn't retry – try again" : (s.error ?? "This step failed")}</span>
              ${this.retryable
                ? html`<button
                    type="button"
                    class="ui-pl__retry"
                    ?disabled=${work?.kind === "retry" && work.state === "pending"}
                    aria-busy=${ifDefined(work?.kind === "retry" && work.id === s.id && work.state === "pending" ? "true" : undefined)}
                    @click=${() => this.retry(s.id)}
                  >${retryIcon}Retry from here</button>`
                : nothing}
            </span>`
          : nothing}
      </div>
      <span class="ui-pl__aside">
        ${draft
          ? html`<span class="ui-pl__moves">
                ${i > 0 ? html`<button type="button" class="ui-pl__remove ui-pl__move" aria-label=${`Move step ${i + 1} up: ${s.title}`} @click=${() => this.moveBy(s.id, -1)}>${upIcon}</button>` : nothing}
                ${i < n - 1 ? html`<button type="button" class="ui-pl__remove ui-pl__move" aria-label=${`Move step ${i + 1} down: ${s.title}`} @click=${() => this.moveBy(s.id, 1)}>${downIcon}</button>` : nothing}
              </span>
              <button type="button" class="ui-pl__remove" aria-label=${`Remove step ${i + 1}: ${s.title}`} @click=${() => this.removeStep(s.id)}>${removeIcon}</button>`
          : st === "active"
            ? keyed(`live-${s.id}`, html`<span class="ui-pl__time" aria-hidden="true"></span>`)
            : st === "done" && ran !== undefined
              ? html`<span class="ui-pl__time ui-pl__time--done"><span class="ui-pl__sr">took </span>${fmt(ran)}</span>`
              : st === "skipped"
                ? html`<span class="ui-pl__time" aria-hidden="true">Skipped</span>`
                : nothing}
      </span>
      ${i < n - 1 ? html`<span class="ui-pl__rail" aria-hidden="true"></span>` : nothing}
    </li>`;
  }

  private renderFoot(clean: boolean) {
    const steps = this.steps;
    const n = steps.length;
    const statusOf = (s: AgentPlanStep): AgentPlanStepStatus => s.status ?? "pending";
    const activeAt = steps.findIndex((s) => statusOf(s) === "active");
    const failedAt = steps.findIndex((s) => statusOf(s) === "failed");
    const finished = steps.filter((s) => statusOf(s) === "done" || statusOf(s) === "skipped").length;
    const runPending = this.work?.kind === "run" && this.work.state === "pending";
    const runError = this.work?.kind === "run" && this.work.state === "error";

    let phase: "draft" | "running" | "failed" | "done" = "draft";
    let label = "";
    if (this.status === "done") {
      phase = "done";
      label = `Done in ${fmtWhole(this.total ?? 0)}`;
    } else if (this.status === "running") {
      if (failedAt >= 0 && activeAt < 0) {
        phase = "failed";
        label = `Stopped · step ${failedAt + 1} failed`;
      } else {
        phase = "running";
        label = `Running · ${activeAt >= 0 ? activeAt + 1 : Math.min(finished + 1, n)} of ${n}`;
      }
    }
    const quiet = clean ? "ui-pl__btn--secondary" : "ui-pl__btn--quiet";

    const body =
      phase === "draft"
        ? html`${runError ? html`<span class="ui-pl__hint ui-pl__hint--error" role="alert">Couldn't start the run – try again</span>` : html`<span class="ui-pl__hint" aria-hidden="true">Drag to reorder · double-click to rename</span>`}
            <span class="ui-pl__actions">
              ${this.cancellable ? html`<button type="button" class=${`ui-pl__btn ${quiet}`} @click=${() => this.emit("tc-cancel", null)}>Cancel</button>` : nothing}
              <button type="button" class="ui-pl__btn ui-pl__btn--primary ui-pl__run" ?disabled=${!n || runPending} aria-busy=${ifDefined(runPending ? "true" : undefined)} @click=${this.run}>Run plan${runIcon}</button>
            </span>`
        : html`<span class="ui-pl__status" tabindex="-1">
              <span class="ui-pl__status-icon" aria-hidden="true"
                >${phase === "running"
                  ? spinner
                  : phase === "done"
                    ? html`<svg viewBox="0 0 16 16" class=${ifDefined(clean ? "ui-pl__badge" : undefined)}>${svg`<circle cx="8" cy="8" r=${clean ? 7 : 6.5}></circle><path d=${clean ? "M5.2 8.2 7.1 10l3.7-4" : "M5.4 8.2 7.2 10l3.4-3.8"} pathLength="1" class="ui-pl__draw"></path>`}</svg>`
                    : html`<svg viewBox="0 0 16 16" class=${ifDefined(clean ? "ui-pl__badge" : undefined)}>${svg`<circle cx="8" cy="8" r=${clean ? 7 : 6.5}></circle><path d=${clean ? "M8 4.8v3.8M8 11.2h.01" : "M8 4.9v3.6M8 11h.01"}></path>`}</svg>`}</span
              >
              <span class=${clean && phase === "running" ? "ui-pl__status-label ui-pl__shimmer" : "ui-pl__status-label"}
                >${label}${clean && phase === "running" ? keyed(label, html`<span class="ui-pl__shine" aria-hidden="true"><span>${label}</span></span>`) : nothing}</span
              >
            </span>
            ${phase === "running"
              ? html`<span class="ui-pl__elapsed" aria-hidden="true"></span>`
              : phase === "done" && this.rerunnable
                ? html`<span class="ui-pl__actions">
                    <button type="button" class=${`ui-pl__btn ${quiet} ui-pl__again`} ?disabled=${runPending} aria-busy=${ifDefined(runPending ? "true" : undefined)} @click=${this.run}>${retryIcon}Run again</button>
                  </span>`
                : nothing}`;
    return keyed(phase, html`<div class="ui-pl__foot" data-phase=${phase}>${body}</div>`);
  }

  protected override render() {
    const steps = this.steps;
    const n = steps.length;
    const draft = this.draft;
    const clean = this.resolvedLook === "clean";
    const foot = this.renderFoot(clean);
    const estimate = draft ? this.estimate : "";
    return html`
      <div class="ui-pl__card">
        <div class="ui-pl__head">
          <div class="ui-pl__meta">
            <span class="ui-pl__state">
              <span class="ui-pl__state-icon" aria-hidden="true">${listIcon}</span>
              <span class="ui-pl__state-label">Plan · ${n} ${n === 1 ? "step" : "steps"}</span>
            </span>
            ${estimate ? html`<span class="ui-pl__estimate">${clockIcon}<span><span class="ui-pl__sr">Estimated time </span>${estimate}</span></span>` : nothing}
          </div>
          ${this.heading ? html`<h3 class="ui-pl__title">${this.heading}</h3>` : nothing}
        </div>
        <p id=${this.hintId} class="ui-pl__sr">Press Enter to rename, Alt plus arrow keys to move, Delete to remove.</p>
        <ol class="ui-pl__list" aria-label=${this.heading ? `Plan: ${this.heading}` : "Plan"}>
          ${repeat(
            steps,
            (s) => s.id,
            (s, i) => this.renderStep(s, i, n),
          )}
        </ol>
        <div class="ui-pl__tail" .inert=${!draft}>
          <div class="ui-pl__tail-inner">
            <label class="ui-pl__add">
              <span class="ui-pl__add-icon" aria-hidden="true">${addIcon}</span>
              <input
                .value=${this.adding}
                placeholder="Add step"
                aria-label="Add a step at the end"
                .enterKeyHint=${"done"}
                @input=${(e: InputEvent) => (this.adding = (e.currentTarget as HTMLInputElement).value)}
                @keydown=${this.onAddKey}
              />
            </label>
          </div>
        </div>
        ${clean ? foot : nothing}
      </div>
      ${clean ? nothing : foot}
      <p class="ui-pl__sr" role="status" aria-live="polite">${this.message}</p>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="pl"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pl"] {
  /* Lifted rows and fields: white on the gray tray, a step lighter in dark */
  --tc-agent-plan-raise-bg: light-dark(#ffffff, #1f1f22);
  /* The rail that links the steps */
  --tc-agent-plan-rail: light-dark(#c4c4c8, #4a4a50);
  --tc-agent-plan-lift: 0 1px 2px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.7));
  --tc-agent-plan-inset: 30px;

  container-type: inline-size;
  position: relative;
  box-sizing: border-box;
  display: grid;
  width: 100%;
  max-width: 460px;
  padding: var(--tc-space-1);
  border-radius: var(--tc-radius-3xl);
  background: var(--tc-surface-sunken);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The white card holds the goal and the steps */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__card {
  position: relative;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pl"]:not([data-status="draft"]) {
  --tc-agent-plan-inset: 14px;
}
/* Colors and motion as variables – override them on [data-ui="pl"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pl"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-agent-plan-rail: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
  --tc-agent-plan-shine: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  --tc-agent-plan-accent: var(--tc-accent-solid);
  --tc-agent-plan-edit-glow: light-dark(rgba(0, 96, 226, 0.1), rgba(77, 141, 255, 0.14));
  --tc-agent-plan-inset: 30px;

  container-type: inline-size;
  position: relative;
  box-sizing: border-box;
  display: grid;
  width: 100%;
  max-width: 440px;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__card {
  position: relative;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pl"]:not([data-status="draft"]) {
  --tc-agent-plan-inset: 10px;
}
[data-ui="pl"][data-dragging] {
  cursor: grabbing;
  user-select: none;
  -webkit-user-select: none;
}
[data-ui="pl"] *,
[data-ui="pl"] *::before,
[data-ui="pl"] *::after {
  box-sizing: border-box;
}
[data-ui="pl"] svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
:where([data-ui="pl"]) button {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  cursor: pointer;
}
.ui-pl__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
/* Header: a quiet status line, then the goal */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__head {
  display: grid;
  gap: var(--tc-space-1);
  padding: var(--tc-space-4) var(--tc-space-4-5) var(--tc-space-2);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__meta {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-height: 18px;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__state {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
}
/* Header: a quiet meta line, then the goal */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__head {
  display: grid;
  gap: var(--tc-space-1);
  padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-2-5);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__meta {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-height: 16px;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__state {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
}
.ui-pl__state-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__state-icon,
:where([data-look="standard"], [data-look="standard"] *).ui-pl__status-icon {
  flex: none;
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__state-icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-pl__state-icon circle[r=".6"] {
  fill: currentColor;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__estimate {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  margin-left: auto;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__estimate svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__title {
  margin: 0;
  color: var(--tc-text-primary);
  font-size: 15px;
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-relaxed);
  letter-spacing: -0.012em;
  text-wrap: balance;
}
/* Steps */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__list {
  position: relative;
  margin: 0;
  padding: var(--tc-space-0-5) var(--tc-space-1-5) var(--tc-space-1-5);
  list-style: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  column-gap: var(--tc-space-3);
  align-items: start;
  padding: 10px 10px 10px var(--tc-agent-plan-inset);
  border-radius: var(--tc-radius-lg);
  outline: none;
  transition:
    transform var(--tc-duration-slower) var(--tc-ease-move),
    padding var(--tc-duration-slower) var(--tc-ease-move),
    height var(--tc-duration-moderate) var(--tc-ease-move),
    opacity var(--tc-duration-base) var(--tc-ease-standard),
    background-color var(--tc-duration-fast) var(--tc-ease-standard),
    box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pl"][data-status="draft"] .ui-pl__step:hover {
  background: var(--tc-fill-hover);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__estimate {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  margin-left: auto;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__estimate svg {
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__title {
  margin: 0;
  color: var(--tc-text-strong);
  font-size: 15px;
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-loose);
  text-wrap: balance;
}
/* Steps */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__list {
  position: relative;
  margin: 0;
  padding: 0 var(--tc-space-1-5) var(--tc-space-1-5);
  list-style: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step {
  position: relative;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  column-gap: var(--tc-space-2-5);
  align-items: start;
  padding: 8px 10px 8px var(--tc-agent-plan-inset);
  border-radius: var(--tc-radius-sm);
  outline: none;
  transition:
    transform var(--tc-duration-slower) var(--tc-ease-move),
    padding var(--tc-duration-slower) var(--tc-ease-move),
    height var(--tc-duration-moderate) var(--tc-ease-move),
    opacity var(--tc-duration-base) var(--tc-ease-standard),
    background-color var(--tc-duration-fast) var(--tc-ease-standard),
    box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pl"][data-status="draft"] .ui-pl__step:hover {
  background: var(--tc-fill-subtle);
}
.ui-pl__step:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-dragging] {
  z-index: 2;
  background: var(--tc-agent-plan-raise-bg) !important;
  box-shadow: inset 0 0 0 1px var(--tc-border-default), var(--tc-agent-plan-lift);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-dragging] {
  z-index: 2;
  background: var(--tc-surface-raised) !important;
  box-shadow: var(--tc-shadow-overlay);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-pl__step[data-removing] {
  height: 0 !important;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}
.ui-pl__step[data-enter] {
  animation: ui-pl-enter var(--tc-duration-slower) var(--tc-ease-move) both;
}
/* Grip: in the left gutter, shows on hover and focus */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__grip {
  position: absolute;
  top: 10px;
  left: 6px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 22px;
  margin-top: -1px;
  border-radius: var(--tc-radius-xs);
  color: var(--tc-icon-muted);
  fill: currentColor;
  cursor: grab;
  touch-action: none;
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__grip svg {
  width: 14px;
  height: 14px;
}
/* Grip: in the left gutter, shows on hover and focus */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__grip {
  position: absolute;
  top: 8px;
  left: 6px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 20px;
  border-radius: var(--tc-radius-xs);
  color: var(--tc-icon-muted);
  fill: currentColor;
  cursor: grab;
  touch-action: none;
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__grip svg {
  width: 16px;
  height: 16px;
}
.ui-pl__step:hover .ui-pl__grip,
.ui-pl__step:focus-visible .ui-pl__grip,
.ui-pl__step[data-dragging] .ui-pl__grip {
  opacity: 1;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__grip:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-dragging] .ui-pl__grip {
  color: var(--tc-text-muted);
  background: var(--tc-fill-hover);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__grip:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-dragging] .ui-pl__grip {
  color: var(--tc-icon-muted);
  background: var(--tc-fill-default);
}
.ui-pl__step[data-dragging] .ui-pl__grip {
  cursor: grabbing;
}
/* Marker: a quiet ring with the number → spinner → check */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__marker {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  justify-self: center;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
  transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard);
}
/* Marker: a number in a hairline ring → spinner → a blue check */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__marker {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
  transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard);
}
.ui-pl__marker > * {
  grid-area: 1 / 1;
  animation: ui-pl-pop var(--tc-duration-slow) var(--tc-ease-move) both;
}
.ui-pl__num {
  animation: none !important;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__marker .ui-pl__spinner {
  width: 13px;
  height: 13px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__mark {
  width: 11px !important;
  height: 11px !important;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-step="active"] .ui-pl__marker {
  box-shadow: none;
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-step="done"] .ui-pl__marker {
  background: var(--tc-fill-default);
  box-shadow: none;
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-step="failed"] .ui-pl__marker {
  background: var(--tc-status-danger-bg);
  box-shadow: inset 0 0 0 1px var(--tc-status-danger-border);
  color: var(--tc-status-danger-fg);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__marker .ui-pl__spinner {
  width: 14px;
  height: 14px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__mark {
  width: 12px !important;
  height: 12px !important;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-step="active"] .ui-pl__marker {
  box-shadow: none;
  color: var(--tc-agent-plan-accent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-step="done"] .ui-pl__marker {
  background: var(--tc-agent-plan-accent);
  box-shadow: none;
  color: var(--tc-text-on-accent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-step="failed"] .ui-pl__marker {
  background: var(--tc-status-danger-bg);
  box-shadow: none;
  color: var(--tc-status-danger-fg);
}
.ui-pl__step[data-step="skipped"] .ui-pl__marker {
  box-shadow: none;
  outline: 1px dashed var(--tc-text-disabled);
  outline-offset: -1px;
}
/* The check draws itself */
.ui-pl__draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ui-pl-draw var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-instant) forwards;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__spinner line {
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  opacity: 0.18;
  animation: ui-pl-ray var(--tc-duration-reveal) linear infinite;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__spinner line {
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.18;
  animation: ui-pl-ray var(--tc-duration-reveal) linear infinite;
}
/* Text */
.ui-pl__main {
  display: grid;
  gap: var(--tc-space-0-5);
  min-width: 0;
}
.ui-pl__name {
  color: var(--tc-text-primary);
  font-weight: var(--tc-font-weight-medium);
  overflow-wrap: anywhere;
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
[data-ui="pl"][data-status="draft"] .ui-pl__name {
  cursor: text;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-step="pending"] .ui-pl__name {
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-step="pending"] .ui-pl__name {
  color: var(--tc-text-secondary);
}
.ui-pl__step[data-step="skipped"] .ui-pl__name {
  color: var(--tc-text-muted);
  text-decoration: line-through;
  text-decoration-color: var(--tc-text-disabled);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1) var(--tc-space-2);
  min-width: 0;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1) var(--tc-space-2);
  min-width: 0;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
.ui-pl__detail {
  min-width: 0;
  overflow-wrap: anywhere;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__tool {
  padding: 1px var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-default);
  color: var(--tc-text-secondary);
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: var(--tc-font-size-xs);
  line-height: var(--tc-line-height-tight);
  letter-spacing: 0;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__edit {
  width: calc(100% + 14px);
  height: 26px;
  margin: -3px -7px;
  padding: 0 var(--tc-space-1-5);
  border: 0;
  border-radius: var(--tc-radius-md);
  background: var(--tc-agent-plan-raise-bg);
  box-shadow: var(--tc-field-shadow-focus);
  color: var(--tc-text-primary);
  font: inherit;
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: inherit;
  outline: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__tool {
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-badge);
  background: var(--tc-fill-default);
  color: var(--tc-text-secondary);
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: var(--tc-font-size-xs);
  line-height: var(--tc-line-height-tight);
  letter-spacing: 0;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__edit {
  width: calc(100% + 14px);
  height: 28px;
  margin: -4px -7px;
  padding: 0 var(--tc-space-1-5);
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-raised);
  box-shadow: 0 0 0 0.5px var(--tc-focus-ring), 0 0 0 3px var(--tc-agent-plan-edit-glow);
  color: var(--tc-text-primary);
  font: inherit;
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: inherit;
  outline: none;
}
/* Failed: an error line and a way back in */
.ui-pl__fail {
  display: grid;
  justify-items: start;
  gap: var(--tc-space-2);
  margin-top: var(--tc-space-1);
  animation: ui-pl-fade var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__error {
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  overflow-wrap: anywhere;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__retry {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: 28px;
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-md);
  background: var(--tc-agent-plan-raise-bg);
  box-shadow: inset 0 0 0 1px var(--tc-border-default), var(--tc-shadow-control);
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__retry svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__retry:hover {
  background: var(--tc-fill-hover);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__retry:active {
  transform: scale(0.97);
}
/* Right column: remove, live timer, duration */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__aside {
  display: flex;
  align-items: center;
  min-height: 20px;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__error {
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  overflow-wrap: anywhere;
}
/* Secondary: white with the card's hairline shadow */
/* Actions look exactly like Button: control geometry, flat ink primary, secondary and ghost */
.ui-pl__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-pl__btn--primary {
  padding-right: calc(var(--tc-control-px-md) - 2px);
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow);
  color: var(--tc-action-primary-fg);
}
.ui-pl__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-pl__btn--primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active); }
.ui-pl__btn--quiet { color: var(--tc-action-ghost-fg); }
.ui-pl__btn--quiet:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn--secondary {
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__again {
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry svg,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn--secondary svg {
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn--secondary:hover {
  box-shadow: var(--tc-action-secondary-shadow-hover);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry:active,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn:active {
  transform: scale(0.97);
}
/* Right column: remove, live timer, duration */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__aside {
  display: flex;
  align-items: center;
  min-height: 20px;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ui-pl__time {
  animation: ui-pl-fade var(--tc-duration-slow) var(--tc-ease-standard) both;
}
.ui-pl__step[data-step="active"] .ui-pl__time {
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__remove {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: -2px -4px 0 0;
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-icon-muted);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__remove svg {
  width: 14px;
  height: 14px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__remove {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: -4px -6px -4px 0;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__remove svg {
  width: 16px;
  height: 16px;
}
.ui-pl__step:hover .ui-pl__remove,
.ui-pl__step:focus-visible .ui-pl__remove,
.ui-pl__remove:focus-visible {
  opacity: 1;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__remove:hover {
  color: var(--tc-text-primary);
  background: var(--tc-fill-hover);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__remove:hover {
  color: var(--tc-text-primary);
  background: var(--tc-fill-subtle);
}
.ui-pl__remove:focus-visible,
.ui-pl__retry:focus-visible,
.ui-pl__btn:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
/* Progress line: a segment under each marker that fills when the step finishes */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__rail {
  position: absolute;
  top: 35px;
  bottom: -5px;
  left: calc(var(--tc-agent-plan-inset) + 10.5px);
  width: 1px;
  overflow: hidden;
  background: var(--tc-border-default);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--tc-duration-slow) var(--tc-ease-standard);
}
/* Progress line: a segment under each marker that fills blue when the step finishes */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__rail {
  position: absolute;
  top: 31px;
  bottom: -5px;
  left: calc(var(--tc-agent-plan-inset) + 9.5px);
  width: 1px;
  overflow: hidden;
  background: var(--tc-agent-plan-rail);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--tc-duration-slow) var(--tc-ease-standard);
}
[data-ui="pl"]:not([data-status="draft"]) .ui-pl__rail {
  opacity: 1;
  transition-delay: var(--tc-duration-moderate);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__rail::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--tc-agent-plan-rail);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform var(--tc-duration-slowest) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__rail::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--tc-agent-plan-accent);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform var(--tc-duration-slowest) var(--tc-ease-move);
}
.ui-pl__step[data-step="done"] .ui-pl__rail::after,
.ui-pl__step[data-step="skipped"] .ui-pl__rail::after {
  transform: scaleY(1);
}
/* Add step folds away once running */
.ui-pl__tail {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
[data-ui="pl"]:not([data-status="draft"]) .ui-pl__tail {
  grid-template-rows: 0fr;
  opacity: 0;
}
.ui-pl__tail-inner {
  min-height: 0;
  overflow: hidden;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  column-gap: var(--tc-space-3);
  align-items: center;
  margin: 0 var(--tc-space-1-5) var(--tc-space-2);
  padding: 7px 10px 7px var(--tc-agent-plan-inset);
  border-radius: var(--tc-radius-lg);
  cursor: text;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add:focus-within {
  background: var(--tc-fill-hover);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add-icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: var(--tc-radius-full);
  outline: 1px dashed var(--tc-text-disabled);
  outline-offset: -1px;
  color: var(--tc-text-muted);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add-icon svg {
  width: 12px;
  height: 12px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add input {
  width: 100%;
  min-width: 0;
  height: 22px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--tc-text-primary);
  font: inherit;
  letter-spacing: inherit;
  outline: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  column-gap: var(--tc-space-2-5);
  align-items: center;
  margin: -4px var(--tc-space-1-5) var(--tc-space-2);
  padding: 6px 10px 6px var(--tc-agent-plan-inset);
  border-radius: var(--tc-radius-sm);
  cursor: text;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add:focus-within {
  background: var(--tc-fill-subtle);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add-icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: var(--tc-icon-muted);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add-icon svg {
  width: 16px;
  height: 16px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add input {
  width: 100%;
  min-width: 0;
  height: 20px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--tc-text-primary);
  font: inherit;
  letter-spacing: inherit;
  outline: none;
}
.ui-pl__add:focus-within {
  outline: var(--tc-focus-outline);
  outline-offset: calc(-1 * var(--tc-focus-ring-width));
}
.ui-pl__status:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
.ui-pl__status:focus:not(:focus-visible) {
  outline: none;
}
/* Move up / down: shown with remove on hover or focus, laid over the row's end so they take no room */
.ui-pl__aside {
  position: relative;
}
.ui-pl__moves {
  position: absolute;
  top: 0;
  right: 100%;
  display: flex;
  gap: var(--tc-space-0-5);
  padding: 0 var(--tc-space-0-5) 0 var(--tc-space-1);
  border-radius: var(--tc-control-radius-sm);
  pointer-events: none;
}
.ui-pl__move {
  margin-right: 0;
}
.ui-pl__step:hover .ui-pl__moves,
.ui-pl__moves:focus-within {
  background: var(--tc-surface-raised);
  pointer-events: auto;
}
.ui-pl__moves:focus-within .ui-pl__move,
.ui-pl__step:focus-within .ui-pl__remove {
  opacity: 1;
}
@media (hover: none) {
  .ui-pl__moves {
    position: static;
    pointer-events: auto;
  }
}
.ui-pl__add input::placeholder {
  color: var(--tc-text-muted);
  opacity: 1;
}
/* The tray below the card */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__foot {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3);
  min-height: 46px;
  padding: 0 var(--tc-space-1-5) 0 var(--tc-space-3);
  font-size: var(--tc-font-size-sm);
  color: var(--tc-text-muted);
  animation: ui-pl-fade var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__hint {
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* The card's last row: hint and actions, then the run's status */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3);
  min-height: 48px;
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-4);
  border-top: 0.5px solid var(--tc-border-default);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot > * {
  animation: ui-pl-fade var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__hint {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ui-pl__hint.ui-pl__hint--error {
  display: block;
  color: var(--tc-status-danger-fg);
}
.ui-pl__actions {
  display: flex;
  flex: none;
  gap: var(--tc-space-2);
  margin-left: auto;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__btn:active {
  transform: scale(0.97);
}
/* Primary: the dark chip */
.ui-pl__btn--primary:disabled {
  opacity: 0.4;
  cursor: default;
  transform: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__btn--primary svg {
  width: 12px;
  height: 12px;
  fill: currentColor;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__btn--quiet svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Status on the tray while running and after */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__status {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn--primary svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
/* Status in the last row while running and after */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__status {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__status-icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-agent-plan-accent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__status-icon .ui-pl__spinner {
  width: 14px;
  height: 14px;
  margin: 1px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__badge circle {
  fill: currentColor;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__badge path {
  fill: none;
  stroke: var(--tc-text-on-accent);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot[data-phase="failed"] .ui-pl__status-icon {
  color: var(--tc-status-danger-bg);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot[data-phase="failed"] .ui-pl__badge path {
  stroke: var(--tc-status-danger-fg);
  stroke-width: 1.6;
}
.ui-pl__foot[data-phase="failed"] .ui-pl__status {
  color: var(--tc-status-danger-fg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__status-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__elapsed {
  margin-left: auto;
  padding-right: var(--tc-space-1-5);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__status-label {
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot[data-phase="done"] .ui-pl__status-label {
  font-weight: var(--tc-font-weight-medium);
}
/* Running: gray text with a light band sweeping through */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__shimmer {
  position: relative;
  color: var(--tc-text-muted);
}
.ui-pl__shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  animation: ui-pl-sweep var(--tc-duration-shimmer) linear 3 both;
}
.ui-pl__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-agent-plan-shine);
  animation: ui-pl-sweep-text var(--tc-duration-shimmer) linear 3 both;
}
@keyframes ui-pl-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
@keyframes ui-pl-sweep-text {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__elapsed {
  margin-left: auto;
  padding-right: var(--tc-space-1-5);
  color: var(--tc-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
/* Touch screens have no hover: keep the grip and remove button visible */
@media (hover: none) {
  .ui-pl__grip,
  .ui-pl__remove {
    opacity: 1;
  }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot { min-height: 56px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__remove { width: 36px; height: 36px; margin: -8px -10px -8px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__grip::after { content: ""; position: absolute; inset: -8px -6px; }
}
/* Narrow: drop the hint, tighten the gutters */
@container (max-width: 400px) {
  .ui-pl__hint {
    display: none;
  }
}
@container (max-width: 340px) {
:where([data-look="standard"], [data-look="standard"] *).ui-pl__head {
    padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-2);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__list {
    padding-inline: var(--tc-space-1);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step,
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add {
    column-gap: var(--tc-space-2-5);
    padding-right: var(--tc-space-2);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add {
    margin-inline: var(--tc-space-1);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__foot {
    padding-left: var(--tc-space-2-5);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__btn {
    padding: 0 var(--tc-space-3);
}
}
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-pl__head {
    padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-2-5);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__list {
    padding-inline: var(--tc-space-1);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add {
    column-gap: var(--tc-space-2);
    padding-right: var(--tc-space-2);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add {
    margin-inline: var(--tc-space-1);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot {
    padding-left: var(--tc-space-3-5);
}
}
@keyframes ui-pl-fade {
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-pl-enter {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-pl-pop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-pl-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes ui-pl-ray {
  0% { opacity: 1; }
  100% { opacity: 0.18; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pl"] *,
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pl"] *::before,
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pl"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__spinner line { opacity: 0.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-pl__draw { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pl"] *,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pl"] *::before,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pl"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__spinner line { opacity: 0.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__draw { stroke-dashoffset: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__shimmer::after { display: none; }
}
`;
}

if (!customElements.get("tc-agent-plan")) customElements.define("tc-agent-plan", TcAgentPlan);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-plan": TcAgentPlan;
  }
}
