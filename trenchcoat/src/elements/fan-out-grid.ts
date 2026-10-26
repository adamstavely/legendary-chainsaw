import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, OnScreenController } from "./internal/controllers";

/*
 * <tc-fan-out-grid> – the Lit port of src/components/fan-out-grid.tsx: one agent hands a big job to many workers, and
 * every task is a cell on a grid. Cells are tinted by state (queued, running with a sweeping shine, retrying, done,
 * failed); done, cost and the time left are counted on top; the counts under the card double as a filter. Point at a
 * cell (or move with the arrow keys) for a small window with the task's details – click or Enter keeps it open.
 * Failed tasks can be sent again with "Retry failed" (shown when `onRetry` is set). Clean drops the tray: a bar on
 * top, one white panel with the grid and the counts as a quiet line inside it.
 *
 *   <tc-fan-out-grid heading="Lead enrichment" job="Enrich 140 leads" .tasks=${tasks} .elapsed=${4200}></tc-fan-out-grid>
 *
 * The clock: `elapsed` (ms from the start of the job), else `now` (epoch ms), else the element reads the clock after
 * it connects and ticks every second while tasks run and it's on screen.
 */

export type FanoutStatus = "queued" | "running" | "retrying" | "done" | "failed";

export type FanoutTask = {
  id: string;
  /** What this task is about, in a few words – e.g. "northwind.io" */
  label: string;
  status: FanoutStatus;
  /** Who works on it, e.g. "Researcher 3" */
  worker?: string;
  /** When it started and ended – epoch ms, on the same clock as `now` (or ms from the start of the job with `elapsed`) */
  start?: number;
  end?: number;
  cost?: number;
  /** How often it was tried – 2 and more show as retries */
  attempts?: number;
  /** What came out, one line – shown in the window of a finished task */
  result?: string;
  /** What went wrong – shown in the window of a failed or retrying task */
  error?: string;
};

export type FanoutSelectedChange = { selected: string | null };
export type FanoutFilterChange = { filter: FanoutStatus | null };
export type FanoutSelect = { task: FanoutTask | null };

const ORDER: FanoutStatus[] = ["done", "running", "retrying", "failed", "queued"];
/** The states the line under the grid counts – queued is simply what's left */
const SHOWN: FanoutStatus[] = ["done", "running", "retrying", "failed"];
const LABEL: Record<FanoutStatus, string> = { queued: "Queued", running: "Running", retrying: "Retrying", done: "Done", failed: "Failed" };
const SEC = 1000;
const dollars = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(3)}` : n < 100 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString("en-US")}`);
const took = (ms: number) => {
  if (ms < SEC) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 10 * SEC) return `${(ms / SEC).toFixed(1)}s`;
  const s = Math.round(ms / SEC);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};

/* A small fan-out mark for the title (drawn for Trenchcoat) */
const fanMark = html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${svg`
  <circle cx="3" cy="8" r="1.9" fill="currentColor"></circle>
  <rect x="10.2" y="1.6" width="3.6" height="3.6" rx="1" fill="currentColor" opacity="0.9"></rect>
  <rect x="10.2" y="6.2" width="3.6" height="3.6" rx="1" fill="currentColor" opacity="0.6"></rect>
  <rect x="10.2" y="10.8" width="3.6" height="3.6" rx="1" fill="currentColor" opacity="0.3"></rect>
  <path d="M4.9 8H7c.6 0 .9-.3 1-.9l.4-2.4c.1-.6.4-.9 1-.9h.6M4.9 8h5.1M4.9 8H7c.6 0 .9.3 1 .9l.4 2.4c.1.6.4.9 1 .9h.6" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"></path>`}</svg>`;
/* rotate-cw: Lucide (ISC, lucide.dev) */
const retryIcon = html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>`}</svg>`;

let instances = 0;

/**
 * A big job fanned out to many workers: one cell per task, live.
 * @tag tc-fan-out-grid
 * @fires tc-selected-change - The task kept open changes ({ selected: string | null }); cancelable
 * @fires tc-filter-change - The state filter changes ({ filter: FanoutStatus | null }); cancelable
 * @fires tc-select - A task was picked with a click or Enter, or let go ({ task: FanoutTask | null })
 */
export class TcFanOutGrid extends TcElement {
  static override ui = "fog";

  /** Every task in the job, one cell each, in order – its label, state, worker, times, cost, result or error */
  @property({ attribute: false }) accessor tasks: FanoutTask[] = [];
  /** What the whole job does – e.g. "Enrich 240 leads" */
  @property() accessor job = "";
  /** How many workers run at once – used for the time left (defaults to the tasks running now) */
  @property({ type: Number }) accessor workers: number | undefined = undefined;
  /** The clock, in epoch ms – without it (and without `elapsed`) the element reads the clock and ticks while tasks run */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** When the job started, in epoch ms – defaults to the earliest task start */
  @property({ type: Number, attribute: "started-at" }) accessor startedAt: number | undefined = undefined;
  /** The clock as ms from the start of the job; task start/end are then job-relative too. Wins over `now` */
  @property({ type: Number }) accessor elapsed: number | undefined = undefined;
  /** "Retry failed" sends the failed tasks' ids here – unset, the button doesn't show. A promise holds the button
   *  while it runs; a rejection says so and the button stays to try again */
  @property({ attribute: false }) accessor onRetry: ((ids: string[]) => void | Promise<unknown>) | undefined = undefined;
  /** The id of the task whose window is kept open (null: none). Changed by the user unless a tc-selected-change
   *  listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;
  /** The state every other cell steps back from (null: none). Changed by the user unless a tc-filter-change listener
   *  calls preventDefault() */
  @property({ attribute: false }) accessor filter: FanoutStatus | null = null;
  /** Formats every cost – defaults to dollars, e.g. "$0.014" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** The title on the bar */
  @property() accessor heading = "Fan-out";
  /** A small mark before the title (cloned); unset shows the default */
  @property({ attribute: false }) accessor icon: Element | undefined = undefined;

  @state() private accessor hover: number | null = null;
  @state() private accessor active: number | null = null;
  @state() private accessor retrying = false;
  @state() private accessor retryFailed = false;
  @state() private accessor tick: number | null = null;

  private readonly uid = `tc-fog${++instances}`;
  private readonly screen = new OnScreenController(this);
  private leaveTimer: number | undefined;
  private clockTimer: number | undefined;
  private clockKey = "";
  private placedKey = "";
  private ro?: ResizeObserver;
  private iconSource: Element | undefined;
  private iconClone: Node | undefined;
  private onDocKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.hover = null;
  };
  private docKeyOn = false;
  private readClock = () => {
    this.tick = Date.now();
  };

  constructor() {
    super();
    // Retry goes away once nothing has failed – focus moves to the grid instead of <body> (WCAG 2.4.3)
    new FocusRescueController(this, () => this.grid);
  }

  private get grid() {
    return this.querySelector<HTMLElement>(".ui-fog__grid");
  }
  private get cells() {
    return [...this.querySelectorAll<HTMLElement>(".ui-fog__cell")];
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.leaveTimer);
    window.clearInterval(this.clockTimer);
    this.clockTimer = undefined;
    this.clockKey = "";
    this.ro?.disconnect();
    this.ro = undefined;
    this.placedKey = "";
    if (this.docKeyOn) document.removeEventListener("keydown", this.onDocKey);
    this.docKeyOn = false;
  }

  /* ---------- Changes ---------- */

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    if (this.emit<FanoutSelectedChange>("tc-selected-change", { selected: next }, { cancelable: true })) this.selected = next;
  }
  private setFilter(next: FanoutStatus | null) {
    if (next === this.filter) return;
    if (this.emit<FanoutFilterChange>("tc-filter-change", { filter: next }, { cancelable: true })) this.filter = next;
  }
  private setHover(i: number | null) {
    window.clearTimeout(this.leaveTimer);
    this.hover = i;
  }
  // The window can be hovered (WCAG 1.4.13): leaving the grid for it doesn't close it – a short grace covers the gap
  private leaveSoon = () => {
    window.clearTimeout(this.leaveTimer);
    this.leaveTimer = window.setTimeout(() => (this.hover = null), 150);
  };
  private pick(i: number | null) {
    const t = i === null ? undefined : this.tasks[i];
    const next = t && t.id !== this.selected ? t.id : null;
    this.setSelected(next);
    this.emit<FanoutSelect>("tc-select", { task: next ? t! : null });
  }
  // Cells are 12px squares 24px apart (WCAG 2.5.8): a click in the gap picks the cell within 12px, so each square
  // takes clicks across a 24px box
  private pickNearest = (e: MouseEvent) => {
    if ((e.target as Element).closest(".ui-fog__cell")) return;
    const i = this.cells.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return Math.abs(e.clientX - (r.left + r.width / 2)) <= 12 && Math.abs(e.clientY - (r.top + r.height / 2)) <= 12;
    });
    if (i >= 0) this.pick(i);
  };
  private async retry() {
    if (!this.onRetry || this.retrying) return;
    this.retryFailed = false;
    let result: void | Promise<unknown>;
    try {
      result = this.onRetry(this.tasks.filter((t) => t.status === "failed").map((t) => t.id));
    } catch {
      this.retryFailed = true;
      return;
    }
    if (!result || typeof (result as Promise<unknown>).then !== "function") return;
    this.retrying = true;
    try {
      await result;
    } catch {
      if (this.isConnected) this.retryFailed = true;
    }
    if (this.isConnected) this.retrying = false;
  }

  /* ---------- Keyboard: arrows walk the grid, Enter keeps the window, Escape lets go ---------- */

  private columns() {
    const cells = this.cells;
    if (!cells.length) return 1;
    const top = cells[0].offsetTop;
    let n = 0;
    for (const el of cells) {
      if (el.offsetTop !== top) break;
      n++;
    }
    return Math.max(1, n);
  }
  private onKeyDown = (e: KeyboardEvent) => {
    const total = this.tasks.length;
    if (!total) return;
    const cols = this.columns();
    const at = this.active ?? 0;
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, Home: -at, End: total - 1 - at };
    if (e.key in moves) {
      e.preventDefault();
      this.setSelected(null);
      this.active = Math.max(0, Math.min(total - 1, this.active === null ? 0 : at + moves[e.key]));
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      if (e.isComposing) return;
      e.preventDefault();
      this.pick(at);
    } else if (e.key === "Escape") {
      this.setHover(null);
      this.setSelected(null);
      this.active = null;
      this.emit<FanoutSelect>("tc-select", { task: null });
    }
  };
  private onGridFocus = (e: FocusEvent) => {
    // Focus moves in on the kept task, else the first one, so the details show on focus as on hover
    const pinnedIndex = this.selected ? this.tasks.findIndex((t) => t.id === this.selected) : -1;
    if (e.target === e.currentTarget && this.active === null && this.tasks.length) this.active = pinnedIndex >= 0 ? pinnedIndex : 0;
  };

  /* ---------- The numbers ---------- */

  private numbers() {
    const tasks = this.tasks;
    const count = Object.fromEntries(ORDER.map((s) => [s, 0])) as Record<FanoutStatus, number>;
    for (const t of tasks) count[t.status]++;
    const total = tasks.length;
    const settled = count.done + count.failed;
    const cost = tasks.reduce((sum, t) => sum + (t.cost ?? 0), 0);
    const finished = total > 0 && settled === total;
    const durations = tasks.filter((t) => t.status === "done" && t.start !== undefined && t.end !== undefined).map((t) => t.end! - t.start!);
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const busy = count.running + count.retrying;
    const left = total - settled;
    const lanes = Math.max(1, this.workers ?? busy);
    const eta = durations.length >= 3 && left > 0 ? (avg * left) / lanes : null;
    return { count, total, settled, cost, finished, busy, eta };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-offscreen", !this.screen.onScreen);
  }

  protected override updated() {
    // The own clock: read after the element connects, then every second while tasks run and someone can see it – off
    // screen or in a hidden tab it waits, and reads again on return
    const own = this.now === undefined && this.elapsed === undefined;
    const { finished, busy } = this.numbers();
    const ticking = own && !finished && busy > 0 && this.screen.onScreen;
    const key = own ? (ticking ? "tick" : "own") : "";
    if (key !== this.clockKey) {
      this.clockKey = key;
      window.clearInterval(this.clockTimer);
      this.clockTimer = undefined;
      if (own) queueMicrotask(() => this.isConnected && this.clockKey === key && this.readClock());
      if (ticking) this.clockTimer = window.setInterval(this.readClock, SEC);
    }
    // Escape closes a window opened by pointing, wherever focus is, without moving focus (WCAG 1.4.13)
    if ((this.hover !== null) !== this.docKeyOn) {
      this.docKeyOn = this.hover !== null;
      if (this.docKeyOn) document.addEventListener("keydown", this.onDocKey);
      else document.removeEventListener("keydown", this.onDocKey);
    }
    this.placeTip();
  }

  // The window sits over its cell: placed when it opens, and again when it or the panel changes size (reads, then writes)
  private placeTip() {
    const tip = this.querySelector<HTMLElement>(".ui-fog__tip");
    const panel = this.querySelector<HTMLElement>(".ui-fog__panel");
    const shown = this.shownIndex();
    const cell = shown !== null ? this.cells[shown] : null;
    const key = tip && panel && cell ? `${shown}|${tip.id}|${this.tasks[shown!]?.id}` : "";
    if (key === this.placedKey && (!tip || this.ro)) return;
    this.placedKey = key;
    this.ro?.disconnect();
    this.ro = undefined;
    if (!tip || !panel || !cell) return;
    const place = () => {
      const p = panel.getBoundingClientRect();
      const scale = panel.offsetWidth ? p.width / panel.offsetWidth : 1;
      const c = cell.getBoundingClientRect();
      const cx = (c.left + c.width / 2 - p.left) / scale;
      const top = (c.top - p.top) / scale;
      const bottom = (c.bottom - p.top) / scale;
      const w = tip.offsetWidth;
      const h = tip.offsetHeight;
      // Above the cell; below it only when there's no room above
      const below = top - h - 10 < 4;
      const x = Math.max(8, Math.min(cx - w / 2, panel.offsetWidth - w - 8));
      tip.style.left = `${x}px`;
      tip.style.top = `${below ? bottom + 10 : top - h - 10}px`;
      tip.style.setProperty("--x", `${cx - x}px`);
      tip.dataset.side = below ? "below" : "above";
    };
    place();
    if (typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(place);
      this.ro.observe(tip);
      this.ro.observe(panel);
    }
  }

  private shownIndex() {
    const pinnedIndex = this.selected ? this.tasks.findIndex((t) => t.id === this.selected) : -1;
    const shown = pinnedIndex >= 0 ? pinnedIndex : (this.hover ?? this.active);
    return shown !== null && shown >= 0 && shown < this.tasks.length ? shown : null;
  }

  private headIcon() {
    if (!this.icon) return fanMark;
    if (this.iconSource !== this.icon) {
      this.iconSource = this.icon;
      this.iconClone = this.icon.cloneNode(true);
    }
    return this.iconClone;
  }

  protected override render() {
    const look = this.resolvedLook;
    const tasks = this.tasks;
    const { count, total, settled, cost, finished, eta } = this.numbers();
    const formatCost = this.formatCost;

    /* The clock: `elapsed` (job-relative), else `now` (epoch ms), else our own */
    const starts = tasks.flatMap((t) => (t.start === undefined ? [] : [t.start]));
    // Where the job's time counts from: 0 for job-relative times, else when it started
    const origin = this.elapsed !== undefined ? 0 : (this.startedAt ?? (starts.length ? Math.min(...starts) : null));
    const now = this.elapsed ?? this.now ?? this.tick;
    const elapsed = finished ? Math.max(0, Math.max(0, ...tasks.map((t) => t.end ?? 0)) - (origin ?? 0)) : now !== null && origin !== null ? Math.max(0, now - origin) : 0;

    const pinned = this.selected;
    const shown = this.shownIndex();
    const task = shown !== null ? tasks[shown] : undefined;
    const active = this.active;
    const filter = this.filter;
    const tipId = `${this.uid}-tip`;
    const cellId = (i: number) => `${this.uid}-c${i}`;

    /* What a screen reader hears: the run in steps of ten percent, then the result (WCAG 4.1.3) */
    const step = total ? Math.floor((settled / total) * 10) : 0;
    const said = finished ? `Finished: ${count.done} done, ${count.failed} failed, ${formatCost(cost)}.` : `${step * 10}% of ${total} tasks done.`;

    // The states – each one a filter – and, while some failed, Retry: on the tray under the card (Standard), or as a
    // quiet line inside the panel, under the grid (Clean)
    const foot = html`<div class="ui-fog__foot">
      <div class="ui-fog__legend" role="group" aria-label="Show only">
        ${SHOWN.map(
          (st) => html`<button
            type="button"
            class="ui-fog__key"
            data-status=${st}
            aria-pressed=${filter === st ? "true" : "false"}
            ?data-off=${!!filter && filter !== st}
            ?data-zero=${count[st] === 0 && st !== "done"}
            @click=${() => this.setFilter(this.filter === st ? null : st)}
          ><span class="ui-fog__swatch" aria-hidden="true"></span><span class="ui-fog__n">${count[st]}</span> ${LABEL[st].toLowerCase()}</button>`,
        )}
      </div>
      ${this.onRetry && count.failed > 0
        ? html`<button
            type="button"
            class="ui-fog__retry"
            aria-disabled=${ifDefined(this.retrying ? "true" : undefined)}
            aria-busy=${ifDefined(this.retrying ? "true" : undefined)}
            ?data-error=${this.retryFailed}
            @click=${() => void this.retry()}
          >${retryIcon}${this.retrying ? "Retrying…" : this.retryFailed ? "Couldn't retry – try again" : "Retry failed"}</button>`
        : nothing}
      ${this.retryFailed ? html`<span class="ui-fog__sr" role="alert">Couldn't retry the failed tasks.</span>` : nothing}
    </div>`;

    const tip = task
      ? keyed(
          task.id,
          html`<div
            id=${tipId}
            role="tooltip"
            class="ui-fog__tip"
            data-status=${task.status}
            @mouseenter=${() => window.clearTimeout(this.leaveTimer)}
            @mouseleave=${() => this.setHover(null)}
          >
            <span class="ui-fog__tip-head">
              <span class="ui-fog__tip-label" title=${task.label}>${task.label}</span>
              <span class="ui-fog__pill" data-status=${task.status}>${LABEL[task.status]}</span>
            </span>
            <span class="ui-fog__tip-meta">${[
              task.worker,
              task.start !== undefined ? took((task.end ?? Math.max(now ?? task.start, task.start)) - task.start) : undefined,
              task.cost ? formatCost(task.cost) : undefined,
              (task.attempts ?? 1) > 1 ? `${task.attempts} attempts` : undefined,
            ]
              .filter(Boolean)
              .join(" · ") || "Waiting for a worker"}</span>
            ${task.error && (task.status === "failed" || task.status === "retrying") ? html`<span class="ui-fog__tip-error">${task.error}</span>` : nothing}
            ${task.result && task.status === "done" ? html`<span class="ui-fog__tip-result">${task.result}</span>` : nothing}
          </div>`,
        )
      : nothing;

    return html`
      <header class="ui-fog__bar">
        <span class="ui-fog__mark">${this.headIcon()}</span>
        <span class="ui-fog__title">${this.heading}</span>
        ${this.job ? html`<span class="ui-fog__job" title=${this.job}>${this.job}</span>` : nothing}
        <span class="ui-fog__sum">
          <span><b>${count.done}</b> / ${total}</span>
          <span><b>${formatCost(cost)}</b></span>
          <span class="ui-fog__time" ?data-done=${finished}>${finished ? `Finished in ${took(elapsed)}` : eta !== null ? `~${took(eta)} left` : `${took(elapsed)} so far`}</span>
        </span>
      </header>

      <div class="ui-fog__panel">
        <div
          class="ui-fog__grid"
          role="listbox"
          aria-label=${`${total} tasks – arrow keys move, Enter keeps the details`}
          aria-activedescendant=${ifDefined(active !== null && active < total ? cellId(active) : undefined)}
          aria-describedby=${ifDefined(task ? tipId : undefined)}
          tabindex="0"
          @keydown=${this.onKeyDown}
          @mouseleave=${this.leaveSoon}
          @click=${this.pickNearest}
          @focus=${this.onGridFocus}
          @blur=${() => (this.active = null)}
        >
          ${repeat(
            tasks,
            (t) => t.id,
            (t, i) => html`<span
              id=${cellId(i)}
              role="option"
              aria-label=${`${t.label}, ${LABEL[t.status].toLowerCase()}`}
              aria-selected=${ifDefined(pinned === t.id ? "true" : undefined)}
              class="ui-fog__cell"
              data-status=${t.status}
              ?data-dim=${!!filter && filter !== t.status}
              ?data-on=${shown === i}
              ?data-pinned=${pinned === t.id}
              style=${styleMap({ "--i": String(i), "--d": String(i % 13) })}
              @mouseenter=${() => this.setHover(i)}
              @click=${() => this.pick(i)}
            ></span>`,
          )}
        </div>

        ${look === "clean" ? foot : nothing}
        ${tip}
      </div>

      ${look === "standard" ? foot : nothing}

      <div class="ui-fog__sr" aria-live="polite" aria-atomic="true" data-step=${step}>${said}</div>
    `;
  }

  static override css = /* css */ `
/* Colors, sizes and motion as variables – override them on [data-ui="fog"] */
[data-ui="fog"] {
  --tc-fan-out-grid-cell: 12px;
  /* 12px squares 24px apart: the spacing that WCAG 2.5.8 asks of targets under 24px */
  --tc-fan-out-grid-gap: 12px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container: ui-fog / inline-size;
  font-family: var(--tc-font-sans);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a tray with the bar and the counts, the card with the grid on it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fog"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-size: var(--tc-font-size-lg);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fog"] { font-size: var(--tc-font-size-md); color: var(--tc-text-secondary); }
[data-ui="fog"] *, [data-ui="fog"] *::before, [data-ui="fog"] *::after { box-sizing: border-box; }
:where([data-ui="fog"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="fog"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="fog"] svg { display: block; flex: none; }
.ui-fog__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-fog__n { font-variant-numeric: tabular-nums; }
/* ----- The bar: what runs, and how far it is ----- */
.ui-fog__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__bar { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__bar { margin-bottom: var(--tc-space-4); }
.ui-fog__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
.ui-fog__mark > svg { width: 16px; height: 16px; }
.ui-fog__title { flex: none; font-weight: var(--tc-font-weight-strong); color: var(--tc-text-strong); }
.ui-fog__job { min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__job { font-size: var(--tc-font-size-md); }
.ui-fog__sum { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-3-5); margin-left: auto; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__sum { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__sum { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-fog__sum b { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-fog__time[data-done] { color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__time[data-done] { font-weight: var(--tc-font-weight-medium); }
/* ----- The card with the grid ----- */
.ui-fog__panel { position: relative; display: grid; border-radius: var(--tc-card-radius); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__panel { padding: var(--tc-space-4-5); background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__panel { gap: var(--tc-space-3-5); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5); background: var(--tc-surface-raised); }
/* ----- A swatch and a count per state – each one a filter – and Retry: on the tray (Standard), in the panel (Clean) ----- */
.ui-fog__foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__foot { padding: var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-2); }
.ui-fog__legend { display: flex; flex-wrap: wrap; gap: 0 var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__legend { margin: -3px -6px; }
.ui-fog__key { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__key { gap: var(--tc-space-2); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-full); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__key { gap: var(--tc-space-1-5); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__key:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__key:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
/* The picked state: a lifted chip with a ≥3:1 edge, not a fill alone (WCAG 1.4.11) */
.ui-fog__key[aria-pressed="true"] { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__key[aria-pressed="true"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected), var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__key[aria-pressed="true"] { background: var(--tc-fill-default); box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
/* States that don't occur yet stay out of the line – on narrow containers they hold their place */
.ui-fog__key[data-zero] { display: none; }
/* Stepped back while another state is picked: the swatch fades, the text stays readable (WCAG 1.4.3) */
.ui-fog__key:is([data-off], [data-zero]) .ui-fog__swatch { opacity: 0.4; }
.ui-fog__key[data-off] .ui-fog__n { color: inherit; }
.ui-fog__key .ui-fog__n { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__key .ui-fog__n { font-weight: var(--tc-font-weight-semibold); }
.ui-fog__swatch { position: relative; overflow: hidden; border-radius: var(--tc-radius-2xs); background: var(--tc-fan-out-grid-status-fill); box-shadow: inset 0 0 0 1px var(--tc-fan-out-grid-status-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__swatch { width: 9px; height: 9px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__swatch { width: 8px; height: 8px; }
/* Retry looks like Button: secondary in Standard, ghost in Clean – in the danger colour */
.ui-fog__retry { display: inline-flex; align-items: center; margin-left: auto; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-status-danger-fg); animation: ui-fog-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__retry { gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md) 0 10px; border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__retry:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__retry { gap: var(--tc-space-1); height: var(--tc-control-h-sm); margin: -3px -6px -3px auto; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__retry:hover { background: var(--tc-status-danger-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__retry > svg { width: 13px; height: 13px; }
/*
 * Every state's colours in one place. State never rests on hue alone (WCAG 1.4.1 / 1.4.11): done is a solid cell,
 * running, retrying and failed are outlined in their solid colour (≥ 3:1) – retrying with a dot, failed with a cross –
 * and queued is a faint empty cell
 */
[data-ui="fog"] [data-status="queued"] { --tc-fan-out-grid-status-bg: var(--tc-fill-default); --tc-fan-out-grid-status-fill: var(--tc-fill-default); --tc-fan-out-grid-status-edge: var(--tc-border-default); --tc-fan-out-grid-status-ink: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fog"] [data-status="queued"] { --tc-fan-out-grid-status-bg: var(--tc-fill-subtle); --tc-fan-out-grid-status-fill: var(--tc-fill-subtle); }
[data-ui="fog"] [data-status="running"] { --tc-fan-out-grid-status-bg: var(--tc-status-info-bg); --tc-fan-out-grid-status-fill: var(--tc-status-info-bg); --tc-fan-out-grid-status-edge: var(--tc-status-info-solid); --tc-fan-out-grid-status-ink: var(--tc-status-info-fg); }
[data-ui="fog"] [data-status="retrying"] { --tc-fan-out-grid-status-bg: var(--tc-status-warning-bg); --tc-fan-out-grid-status-fill: var(--tc-status-warning-bg); --tc-fan-out-grid-status-edge: var(--tc-status-warning-solid); --tc-fan-out-grid-status-ink: var(--tc-status-warning-fg); }
[data-ui="fog"] [data-status="done"] { --tc-fan-out-grid-status-bg: var(--tc-status-success-bg); --tc-fan-out-grid-status-fill: var(--tc-status-success-solid); --tc-fan-out-grid-status-edge: var(--tc-status-success-solid); --tc-fan-out-grid-status-ink: var(--tc-status-success-fg); }
[data-ui="fog"] [data-status="failed"] { --tc-fan-out-grid-status-bg: var(--tc-status-danger-bg); --tc-fan-out-grid-status-fill: var(--tc-status-danger-bg); --tc-fan-out-grid-status-edge: var(--tc-status-danger-solid); --tc-fan-out-grid-status-ink: var(--tc-status-danger-fg); }
/* The marks: a dot for retrying, a cross for failed – on cells and their swatches */
:is(.ui-fog__cell, .ui-fog__swatch):is([data-status="retrying"], [data-status="failed"])::after { content: ""; position: absolute; inset: 0; pointer-events: none; }
:is(.ui-fog__cell, .ui-fog__swatch)[data-status="retrying"]::after { background: radial-gradient(circle, var(--tc-fan-out-grid-status-edge) 0 22%, transparent 26%); }
:is(.ui-fog__cell, .ui-fog__swatch)[data-status="failed"]::after {
  background:
    linear-gradient(45deg, transparent calc(50% - 0.75px), var(--tc-fan-out-grid-status-edge) calc(50% - 0.75px) calc(50% + 0.75px), transparent calc(50% + 0.75px)),
    linear-gradient(-45deg, transparent calc(50% - 0.75px), var(--tc-fan-out-grid-status-edge) calc(50% - 0.75px) calc(50% + 0.75px), transparent calc(50% + 0.75px));
  inset: 22%;
}
/* ----- The grid: one cell per task ----- */
.ui-fog__grid { display: grid; grid-template-columns: repeat(auto-fill, var(--tc-fan-out-grid-cell)); gap: var(--tc-fan-out-grid-gap); justify-content: space-between; padding: var(--tc-space-0-5); margin: -2px; border-radius: var(--tc-radius-sm); }
.ui-fog__grid:focus { outline: none; }
.ui-fog__grid:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-fog__cell { position: relative; width: var(--tc-fan-out-grid-cell); height: var(--tc-fan-out-grid-cell); background: var(--tc-fan-out-grid-status-fill); box-shadow: inset 0 0 0 1px var(--tc-fan-out-grid-status-edge); overflow: hidden; cursor: pointer; transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); animation: ui-fog-cell-in var(--tc-duration-slower) var(--tc-ease-move) calc(var(--i, 0) * 0.01 * var(--tc-duration-base)) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__cell { border-radius: var(--tc-radius-xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__cell { border-radius: var(--tc-radius-2xs); }
/*
 * Running: a shine sweeps across, each cell a little out of step with the next. It moves with transform (composited),
 * runs three times and stops (WCAG 2.2.2), and pauses off-screen
 */
.ui-fog__cell[data-status="running"]::before { content: ""; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 25%, var(--tc-shimmer) 50%, transparent 75%); opacity: 0.8; transform: translateX(-100%); animation: ui-fog-cell-sweep var(--tc-duration-shimmer) linear calc(var(--d, 0) * -0.06 * var(--tc-duration-shimmer)) 3; }
.ui-fog__cell[data-status="retrying"] { animation: ui-fog-breathe calc(2 * var(--tc-duration-slowest)) var(--tc-ease-in-out) 4 alternate; }
.ui-fog__cell:is([data-status="done"], [data-status="failed"]) { animation: ui-fog-pop var(--tc-duration-slower) var(--tc-ease-move); }
[data-ui="fog"][data-offscreen] .ui-fog__cell, [data-ui="fog"][data-offscreen] .ui-fog__cell::before { animation-play-state: paused; }
.ui-fog__cell:hover, .ui-fog__cell[data-on] { transform: scale(1.3); z-index: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__cell:is(:hover, [data-on]) { box-shadow: inset 0 0 0 1.5px var(--tc-fan-out-grid-status-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__cell:is(:hover, [data-on]) { box-shadow: inset 0 0 0 1px var(--tc-fan-out-grid-status-ink); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__cell[data-pinned] { box-shadow: inset 0 0 0 1.5px var(--tc-fan-out-grid-status-ink), 0 0 0 2px var(--tc-focus-ring); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__cell[data-pinned] { box-shadow: inset 0 0 0 1px var(--tc-fan-out-grid-status-ink), 0 0 0 2px var(--tc-focus-ring); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__cell[data-dim] { opacity: 0.2; }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__cell[data-dim] { opacity: 0.18; }
/* ----- The window over a cell: can be hovered, closes with Escape ----- */
.ui-fog__tip { position: absolute; top: 0; left: 0; z-index: 5; display: grid; gap: var(--tc-space-1); width: max-content; border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); transform-origin: var(--x, 50%) bottom; animation: ui-fog-tip var(--tc-duration-fast) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__tip { max-width: min(290px, calc(100% - 16px)); padding: var(--tc-space-2-5) var(--tc-space-3-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__tip { max-width: min(280px, calc(100% - 16px)); padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2-5); }
.ui-fog__tip[data-side="below"] { transform-origin: var(--x, 50%) top; }
.ui-fog__tip-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-fog__tip-label { min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-fog__pill { flex: none; height: var(--tc-pill-h); margin-left: auto; padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fan-out-grid-status-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-fan-out-grid-status-ink); }
.ui-fog__tip-meta { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__tip-meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__tip-meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *) :is(.ui-fog__tip-result, .ui-fog__tip-error) { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-fog__tip-result, .ui-fog__tip-error) { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__tip-result { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__tip-result { color: var(--tc-text-secondary); }
.ui-fog__tip-error { color: var(--tc-status-danger-fg); }
/* ----- Narrow: smaller cells, the numbers on a line of their own ----- */
@container ui-fog (max-width: 520px) {
  /* Set on the card – a container query can't style the container itself */
  .ui-fog__panel { --tc-fan-out-grid-cell: 10px; --tc-fan-out-grid-gap: 14px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-fog__panel { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-fog__panel { padding: var(--tc-space-3); }
  .ui-fog__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
  /* The counts in a fixed two-by-two grid, Retry beside it – nothing moves when a state shows up or Retry appears */
  .ui-fog__foot { flex-wrap: nowrap; align-items: center; }
  .ui-fog__legend { display: grid; grid-template-columns: repeat(2, max-content); }
  .ui-fog__key[data-zero] { display: inline-flex; }
  .ui-fog__retry { flex: none; margin-left: auto; }
}
/* Too narrow for the counts and Retry side by side: Retry goes on a line of its own instead of sticking out */
@container ui-fog (max-width: 360px) {
  .ui-fog__foot { flex-wrap: wrap; }
  .ui-fog__retry { margin-left: 0; }
}
@keyframes ui-fog-cell-in { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-fog-pop { 0% { transform: scale(0.7); } 55% { transform: scale(1.18); } 100% { transform: scale(1); } }
@keyframes ui-fog-cell-sweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes ui-fog-breathe { from { opacity: 0.55; } to { opacity: 1; } }
@keyframes ui-fog-tip { from { opacity: 0; transform: translateY(3px) scale(0.97); } }
@keyframes ui-fog-in { from { opacity: 0; transform: translateY(2px); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="fog"] *, [data-ui="fog"] *::before, [data-ui="fog"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-fan-out-grid")) customElements.define("tc-fan-out-grid", TcFanOutGrid);

declare global {
  interface HTMLElementTagNameMap {
    "tc-fan-out-grid": TcFanOutGrid;
  }
}
