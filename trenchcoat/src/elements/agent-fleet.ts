import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { reducedMotion } from "../internal/reduced-motion";
import "./agent-tree";
import type { AgentTreeResolution, TreeAgent, TreeAgentStatus } from "./agent-tree";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OnScreenController, rescueFocus } from "./internal/controllers";
import { dollars } from "./internal/format";
import { initials } from "./internal/util";

/*
 * <tc-agent-fleet> – several top-level agents side by side, each with the sub-agents it started. Every agent is a
 * card that sums up its branch in words – "2/4 running", "1 failed", "All 3 done", "1 needs you" – with its status,
 * what the whole branch cost and how long it has run. The header sums up the fleet: "4 agents / 14 sub-agents ·
 * 7 running · 1 needs you · $3.81".
 *   · click a card and its tree (tc-agent-tree) opens to the right; the cards line up in a column beside it, and the
 *     one that was open folds back into its card
 *   · a branch where someone waits for you has an Answer button – it opens the tree, where the "needs you" window is
 *   · narrow containers open the tree under its card instead
 * The cards are one tab stop: arrows move between them, Enter or Space opens, Escape closes.
 * Standard: the header on a gray tray, the cards white on it. Clean: one white card, the agents on hairline cards.
 *
 *   <tc-agent-fleet .agents=${[lead, support, release]} .resolver=${(agent, action) => api.answer(agent.id, action)}></tc-agent-fleet>
 *
 * Running times tick once a second while any agent runs and the fleet is on screen (unless `now` is given).
 */

/** An agent and its sub-agents – the same shape as tc-agent-tree's `root` */
export type FleetAgent = TreeAgent;
export type AgentFleetOpenChange = { open: string | null };
/** Answer was pressed on a card: the agent, and the agents in its branch that wait for you */
export type AgentFleetAnswer = { agent: FleetAgent; waiting: FleetAgent[] };

const STATUS: Record<TreeAgentStatus, string> = { queued: "Queued", running: "Running", waiting: "Needs you", done: "Done", failed: "Failed", stopped: "Stopped" };
const walk = (a: TreeAgent): TreeAgent[] => [a, ...(a.children ?? []).flatMap(walk)];
const costOf = (a: TreeAgent): number => (a.cost ?? 0) + (a.children ?? []).reduce((sum, c) => sum + costOf(c), 0);
const took = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${Math.floor(s / 3600)}h ${String(Math.floor(s / 60) % 60).padStart(2, "0")}m`;
};
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/** Wall time – read in the clock's timer only, never during render */
const wall = () => Date.now();
const live = (a: TreeAgent) => a.status === "running" || a.status === "waiting";

/** The branch in words, the most pressing first: someone waiting, then failures, then what runs, then done */
export function fleetBranchSummary(agent: FleetAgent) {
  const subs = walk(agent).slice(1);
  if (!subs.length) return { text: "No sub-agents", tone: "quiet" as const };
  const count = (s: TreeAgentStatus) => subs.filter((a) => a.status === s).length;
  const waiting = count("waiting");
  const failed = count("failed");
  const running = count("running");
  const done = count("done");
  if (waiting) return { text: `${waiting} needs you`, tone: "warning" as const };
  if (failed) return { text: `${failed} failed`, tone: "danger" as const };
  if (running) return { text: `${running}/${subs.length} running`, tone: "accent" as const };
  if (done === subs.length) return { text: subs.length === 1 ? "Done" : `All ${subs.length} done`, tone: "success" as const };
  return { text: plural(subs.length, "sub-agent", "sub-agents"), tone: "quiet" as const };
}

/* ---------- Icons: Lucide (ISC, lucide.dev) – layout-grid, x, check, triangle-alert, clock; the loader is a plain arc ---------- */

const fleetIcon = svg`<rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect>`;
const glyph = (body: TemplateResult, width = 2) =>
  html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${width} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const STATUS_ICONS: Record<TreeAgentStatus, () => TemplateResult> = {
  running: () =>
    html`<svg class="ui-flt__spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">${svg`<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-opacity="0.25" stroke-width="2.5"></circle><path d="M12 3.5A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" stroke-linecap="round" stroke-width="2.5"></path>`}</svg>`,
  done: () => glyph(svg`<path d="M20 6 9 17l-5-5"></path>`, 2.4),
  failed: () => glyph(svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`),
  waiting: () => glyph(svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`),
  stopped: () => glyph(svg`<rect x="6" y="6" width="12" height="12" rx="2.5"></rect>`, 2.2),
  queued: () => html`<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">${svg`<circle cx="12" cy="12" r="3.5" fill="currentColor"></circle>`}</svg>`,
};
const closeIcon = () => glyph(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);

/** Below this width (px) the tree opens under its card */
const WIDE = 640;

let instances = 0;

/**
 * Several top-level agents side by side – each card sums up its sub-agents; a click opens its tree beside it.
 * @tag tc-agent-fleet
 * @fires tc-open-change - A card was opened or closed ({ open }: AgentFleetOpenChange, null = none); cancelable – prevented, `open` stays as it was
 * @fires tc-answer - Answer was pressed on a card ({ agent, waiting }: AgentFleetAnswer); cancelable – prevented, the card's tree doesn't open
 * @fires tc-resolve - An answer from an open tree's "needs you" or "failed" window, bubbled from tc-agent-tree (detail: { agent: TreeAgent, action: "approve" | "reject" | "retry" | "dismiss" })
 */
export class TcAgentFleet extends TcElement {
  static override ui = "flt";

  /** The heading */
  @property() accessor heading = "Fleet";
  /** The top-level agents, each with its sub-agents nested in `children` */
  @property({ attribute: false }) accessor agents: FleetAgent[] = [];
  /** The id of the agent whose tree is open, or null. Changed by the cards unless tc-open-change is prevented */
  @property({ attribute: false }) accessor open: string | null = null;
  /** The clock for running times, in epoch ms – unset uses an internal clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Formats every cost – defaults to dollars, e.g. "$0.42" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** Passed to the open tree: called with each answer from its "needs you" or "failed" window; may return a promise */
  @property({ attribute: false }) accessor resolver: ((agent: TreeAgent, action: AgentTreeResolution) => void | Promise<unknown>) | undefined = undefined;
  /** Called when Answer is pressed (as well as tc-answer) */
  @property({ attribute: false }) accessor onAnswer: ((answer: AgentFleetAnswer) => void) | undefined = undefined;

  /** @internal The card that holds the keyboard's tab stop */
  @state() accessor active = 0;
  /** @internal Room for the tree beside the cards */
  @state() accessor wide = true;
  /** @internal The internal clock, set by its timer */
  @state() accessor tick = 0;

  private readonly uid = `tc-flt${++instances}`;
  private onScreenCtl = new OnScreenController(this);
  private ro?: ResizeObserver;
  private timer = 0;
  private wasOpen: string | null = null;

  constructor() {
    super();
    // An agent that leaves the fleet while focused hands focus to the first card
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-flt__main[tabindex="0"]'));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.ro = new ResizeObserver((entries) => {
      const w = entries[entries.length - 1].contentRect.width;
      if (w > 0 && w >= WIDE !== this.wide) this.wide = w >= WIDE;
    });
    this.ro.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  /** The open agent, if it's still in the fleet */
  private get shownOpen() {
    return this.agents.find((a) => a.id === this.open) ?? null;
  }

  private setOpen(open: string | null) {
    if (open === (this.shownOpen?.id ?? null)) return;
    if (this.emit<AgentFleetOpenChange>("tc-open-change", { open }, { cancelable: true })) this.open = open;
  }

  private answer(agent: FleetAgent) {
    const waiting = walk(agent).filter((a) => a.status === "waiting");
    const detail = { agent, waiting };
    const go = this.emit<AgentFleetAnswer>("tc-answer", detail, { cancelable: true });
    this.onAnswer?.(detail);
    if (go) this.setOpen(agent.id);
  }

  private onCardsKey(e: KeyboardEvent) {
    const cards = [...this.querySelectorAll<HTMLElement>(".ui-flt__main")];
    const at = cards.indexOf(e.target as HTMLElement);
    if (at < 0) return;
    const prev = e.key === "ArrowUp" || e.key === "ArrowLeft";
    const next = e.key === "ArrowDown" || e.key === "ArrowRight";
    const to = next ? Math.min(cards.length - 1, at + 1) : prev ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? cards.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.active = to;
    void this.updateComplete.then(() => this.querySelectorAll<HTMLElement>(".ui-flt__main")[to]?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !this.shownOpen || e.defaultPrevented) return;
    // The tree's own window takes Escape first
    if ((e.target as Element).closest?.(".ui-agt__pop")) return;
    e.stopPropagation();
    const id = this.shownOpen.id;
    rescueFocus(e.target as Element, [this.querySelector(`.ui-flt__main[data-id="${CSS.escape(id)}"]`)]);
    this.querySelector<HTMLElement>(`.ui-flt__main[data-id="${CSS.escape(id)}"]`)?.focus();
    this.setOpen(null);
  };

  private closePanel(e: Event) {
    const id = this.shownOpen?.id;
    if (!id) return;
    rescueFocus(e.currentTarget as Element, [this.querySelector(`.ui-flt__main[data-id="${CSS.escape(id)}"]`)]);
    this.setOpen(null);
  }

  /* ---------- The clock ---------- */

  private syncClock() {
    const run = this.isConnected && this.now === undefined && this.onScreenCtl.onScreen && this.agents.some((a) => walk(a).some(live));
    if (run && !this.timer) {
      this.tick = wall();
      this.timer = window.setInterval(() => (this.tick = wall()), 1000);
    } else if (!run && this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.toggleAttribute("data-wide", this.wide);
    if (this.active >= this.agents.length) this.active = Math.max(0, this.agents.length - 1);
    // The open card holds the tab stop, so Tab lands where you were
    if (changed.has("open")) {
      const i = this.agents.findIndex((a) => a.id === this.open);
      if (i >= 0) this.active = i;
    }
  }

  protected override updated() {
    this.syncClock();
    const open = this.shownOpen?.id ?? null;
    if (open !== this.wasOpen) {
      // The card that was open folds back: a small settle as the tree leaves it
      const before = this.wasOpen;
      this.wasOpen = open;
      const card = before ? this.querySelector<HTMLElement>(`.ui-flt__card[data-id="${CSS.escape(before)}"]`) : null;
      if (card && typeof card.animate === "function" && !reducedMotion())
        card.animate([{ transform: "scale(1.015)" }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(0.32, 0.72, 0.24, 1)" });
    }
  }

  /* ---------- Render ---------- */

  private card(a: FleetAgent, index: number) {
    const open = this.shownOpen?.id === a.id;
    const branch = fleetBranchSummary(a);
    const waiting = walk(a).some((x) => x.status === "waiting");
    const now = this.now ?? this.tick;
    const time = a.started ? took((a.ended ?? (live(a) && now ? now : a.started)) - a.started) : "";
    const panel = `${this.uid}-tree`;
    const subs = walk(a).length - 1;
    return html`<li class="ui-flt__item" data-id=${a.id}>
      <div class="ui-flt__card" data-id=${a.id} data-status=${a.status} ?data-open=${open}>
        <button
          type="button"
          class="ui-flt__main"
          data-id=${a.id}
          data-focus-key=${`card:${a.id}`}
          tabindex=${index === this.active ? 0 : -1}
          aria-expanded=${open ? "true" : "false"}
          aria-controls=${ifDefined(open ? panel : undefined)}
          @click=${() => {
            this.active = index;
            this.setOpen(open ? null : a.id);
          }}
          @focus=${() => (this.active = index)}
        >
          <span class="ui-flt__name tc-sr-only">${a.name}</span>
          <span class="tc-sr-only">, ${STATUS[a.status]}, ${branch.text}${subs ? `, ${plural(subs, "sub-agent", "sub-agents")}` : ""}</span>
        </button>
        <span class="ui-flt__top" aria-hidden="true">
          <span class="ui-flt__avatar">${a.avatar ? a.avatar.cloneNode(true) : initials(a.name)}</span>
          <span class="ui-flt__who"><span class="ui-flt__name-shown">${a.name}</span>${a.model ? html`<span class="ui-flt__model">${a.model}</span>` : nothing}</span>
          <span class="ui-flt__status" data-status=${a.status}>${STATUS_ICONS[a.status]()}${STATUS[a.status]}</span>
        </span>
        <span class="ui-flt__task">${a.task}</span>
        <span class="ui-flt__foot">
          <span class="ui-flt__branch" data-tone=${branch.tone}>${branch.text}</span>
          ${waiting
            ? html`<button type="button" class="ui-flt__answer" @click=${() => this.answer(a)}>Answer<span class="tc-sr-only"> for ${a.name}</span></button>`
            : nothing}
          <span class="ui-flt__cost" aria-hidden="true">${this.formatCost(costOf(a))}${time ? html`<span class="ui-flt__time"> · ${time}</span>` : nothing}</span>
          <span class="tc-sr-only">${this.formatCost(costOf(a))}${time ? `, ${time}` : ""}</span>
        </span>
      </div>
      ${open && !this.wide ? this.panel(a) : nothing}
    </li>`;
  }

  private panel(a: FleetAgent) {
    return keyed(
      a.id,
      html`<section class="ui-flt__panel" id=${`${this.uid}-tree`} aria-label=${`${a.name} and its sub-agents`}>
        <button type="button" class="ui-flt__close" @click=${(e: Event) => this.closePanel(e)}>${closeIcon()}<span class="tc-sr-only">Close ${a.name}'s tree</span></button>
        <tc-agent-tree look=${this.resolvedLook} heading=${a.name} .root=${a} .now=${this.now} .formatCost=${this.formatCost} .resolver=${this.resolver}></tc-agent-tree>
      </section>`,
    );
  }

  protected override render() {
    const all = this.agents.flatMap(walk);
    const subs = all.length - this.agents.length;
    const running = all.filter((a) => a.status === "running").length;
    const waiting = all.filter((a) => a.status === "waiting").length;
    const failed = all.filter((a) => a.status === "failed").length;
    const total = this.agents.reduce((s, a) => s + costOf(a), 0);
    const open = this.shownOpen;
    return html`
      ${cardHead({
        icon: fleetIcon,
        title: this.heading,
        aside: html`<span class="ui-flt__sum">
          <span>${plural(this.agents.length, "agent", "agents")} / ${plural(subs, "sub-agent", "sub-agents")}</span>
          ${running ? html`<span class="ui-flt__sum-run">${running} running</span>` : nothing}
          ${waiting ? html`<span class="ui-flt__sum-tag" data-tone="warning">${waiting} needs you</span>` : nothing}
          ${failed ? html`<span class="ui-flt__sum-tag" data-tone="danger">${failed} failed</span>` : nothing}
          <span class="ui-flt__sum-cost">${this.formatCost(total)}</span>
        </span>`,
      })}
      <div class="ui-flt__body" ?data-open=${!!open && this.wide} @keydown=${this.onKey}>
        <ul class="ui-flt__cards" aria-label=${this.heading} @keydown=${this.onCardsKey}>
          ${repeat(
            this.agents,
            (a) => a.id,
            (a, i) => this.card(a, i),
          )}
          ${this.agents.length === 0 ? html`<li class="ui-flt__empty">No agents running</li>` : nothing}
        </ul>
        ${open && this.wide ? this.panel(open) : nothing}
      </div>
      <span class="tc-sr-only" role="status">${waiting ? `${plural(waiting, "agent needs", "agents need")} you` : ""}${failed ? `${waiting ? ", " : ""}${failed} failed` : ""}</span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="flt"] {
  --tc-agent-fleet-card-min: 220px;
  --tc-agent-fleet-column: 260px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  letter-spacing: var(--tc-tracking-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="flt"] {
  --tc-agent-fleet-card-min: 220px;
  --tc-agent-fleet-column: 250px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding-bottom: var(--tc-space-3);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="flt"] *, [data-ui="flt"] *::before, [data-ui="flt"] *::after { box-sizing: border-box; }
:where([data-ui="flt"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="flt"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="flt"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="flt"] svg { display: block; flex: none; }
/* ----- The header's sums ----- */
.ui-flt__sum { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-flt__sum-run { color: var(--tc-accent-text); }
.ui-flt__sum-tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); }
.ui-flt__sum-tag[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-flt__sum-tag[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-flt__sum-cost { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); }
:where([data-look="clean"], [data-look="clean"] *).ui-flt__sum-cost { font-weight: var(--tc-font-weight-medium); }
/* ----- Cards: a grid, or a column beside the open tree ----- */
.ui-flt__body { display: grid; gap: var(--tc-space-3); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-flt__body { padding: 0 var(--tc-space-3); }
.ui-flt__body[data-open] { grid-template-columns: var(--tc-agent-fleet-column) minmax(0, 1fr); align-items: start; }
.ui-flt__cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--tc-agent-fleet-card-min), 1fr)); gap: var(--tc-space-2); min-width: 0; }
.ui-flt__body[data-open] .ui-flt__cards { grid-template-columns: minmax(0, 1fr); }
.ui-flt__item { display: grid; gap: var(--tc-space-2); min-width: 0; }
.ui-flt__empty { padding: var(--tc-space-6) 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
.ui-flt__card { position: relative; display: grid; gap: var(--tc-space-1-5); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-card-radius); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard); animation: ui-flt-rise var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-flt__card { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-flt__card { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-flt__card:hover { box-shadow: var(--tc-card-shadow-hover); }
.ui-flt__card[data-open] { box-shadow: 0 0 0 1.5px var(--tc-accent-solid), var(--tc-card-shadow); }
/* The card's main button covers the card; Answer sits above it */
.ui-flt__main { position: absolute; inset: 0; z-index: 1; border-radius: inherit; }
[data-ui="flt"] .ui-flt__main:focus-visible { outline-offset: 0; }
.ui-flt__top { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-flt__avatar { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); overflow: hidden; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-muted); }
.ui-flt__avatar > svg { width: 14px; height: 14px; }
.ui-flt__who { display: grid; flex: 1; min-width: 0; }
.ui-flt__name-shown { overflow: hidden; font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-flt__name-shown { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
.ui-flt__model { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-flt__status { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-flt__status[data-status="running"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-flt__status[data-status="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-flt__status[data-status="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-flt__status[data-status="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-flt__spin { animation: ui-flt-spin var(--tc-duration-reveal-slow) linear infinite; }
.ui-flt__task { display: -webkit-box; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.ui-flt__foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-xs); }
.ui-flt__branch { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-flt__branch[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-flt__branch[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-flt__branch[data-tone="accent"] { color: var(--tc-accent-text); }
.ui-flt__branch[data-tone="success"] { color: var(--tc-status-success-fg); }
.ui-flt__answer { position: relative; z-index: 2; display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); }
.ui-flt__answer:hover { background: var(--tc-action-primary-bg-hover); }
.ui-flt__cost { margin-left: auto; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-flt__time { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
/* ----- The open tree ----- */
.ui-flt__panel { position: relative; min-width: 0; animation: ui-flt-open var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-flt__panel { padding: var(--tc-space-3); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-flt__close { position: absolute; top: var(--tc-space-1); right: var(--tc-space-1); z-index: 4; display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-muted); }
.ui-flt__close:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-flt__panel > tc-agent-tree { padding-right: var(--tc-space-8); }
[data-ui="flt"]:not([data-wide]) :where([data-look="clean"], [data-look="clean"] *).ui-flt__panel { padding-left: var(--tc-space-3); border-left: 2px solid var(--tc-accent-solid); }
@keyframes ui-flt-rise { from { opacity: 0; transform: translateY(6px) scale(0.98); } }
@keyframes ui-flt-open { from { opacity: 0; transform: translateX(-12px); } }
@keyframes ui-flt-spin { to { transform: rotate(360deg); } }
[data-ui="flt"]:not([data-wide]) .ui-flt__panel { animation-name: ui-flt-drop; }
@keyframes ui-flt-drop { from { opacity: 0; transform: translateY(-6px); } }
@media (pointer: coarse) {
  .ui-flt__answer { height: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="flt"] *, [data-ui="flt"] *::before, [data-ui="flt"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-flt__card { border: 1px solid CanvasText; }
  .ui-flt__card[data-open] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-agent-fleet")) customElements.define("tc-agent-fleet", TcAgentFleet);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-fleet": TcAgentFleet;
  }
}
