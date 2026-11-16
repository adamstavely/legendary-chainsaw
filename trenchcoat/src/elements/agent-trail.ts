import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { OnScreenController } from "./internal/controllers";
import { duration } from "./internal/format";

/*
 * <tc-agent-trail> – the steps an agent works through, as one quiet trail for a chat answer or a side panel. The header
 * has the task and how far it is ("3/5"). Done steps carry a check and how long they took; the step it's on says what
 * it's doing and branches into its sub-steps, the one under way with a live timer; a step that needs a person waits
 * behind a dashed ring with "Needs your OK" and Approve / Decline; what's still to come is quiet.
 *   · a short light runs down the trail into the sub-step it's on (none with reduced motion)
 *   · Hide steps folds the trail to its header; `collapsed` is the page's to own (tc-collapsed-change)
 *   · Approve and Decline fire tc-decision; unless prevented the step moves on – approved, it runs; declined, it fails
 *   · the timer ticks once a second while something runs, not off screen, and not when the page passes `now`
 *   · when the step it's on changes, a polite status line says so
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-agent-trail heading="Fix the date parser" .steps=${steps}></tc-agent-trail>
 */

export type AgentTrailStatus = "done" | "running" | "waiting" | "pending" | "failed";
export type AgentTrailSubstep = {
  id: string;
  title: string;
  status: AgentTrailStatus;
  /** When it started, epoch ms */
  started?: number;
  /** When it ended, epoch ms */
  ended?: number;
};
export type AgentTrailStep = {
  id: string;
  title: string;
  status: AgentTrailStatus;
  /** When it started, epoch ms */
  started?: number;
  /** When it ended, epoch ms */
  ended?: number;
  /** What it's doing now, or why it waits or failed */
  detail?: string;
  /** The smaller steps it branches into while it's the current one */
  substeps?: AgentTrailSubstep[];
};
export type AgentTrailDecision = "approve" | "decline";
export type AgentTrailDecisionDetail = { decision: AgentTrailDecision; step: AgentTrailStep };
export type AgentTrailCollapsedChange = { collapsed: boolean };

/** The element's words, every one renameable through `labels` */
export type AgentTrailLabels = {
  progress: string;
  done: string;
  running: string;
  waiting: string;
  pending: string;
  failed: string;
  approve: string;
  decline: string;
  declined: string;
  hide: string;
  show: string;
  now: string;
  empty: string;
};
export const defaultAgentTrailLabels: AgentTrailLabels = {
  progress: "steps done",
  done: "Done",
  running: "Working",
  waiting: "Needs your OK",
  pending: "Up next",
  failed: "Failed",
  approve: "Approve",
  decline: "Decline",
  declined: "Declined",
  hide: "Hide steps",
  show: "Show steps",
  now: "Now",
  empty: "No steps yet.",
};

/* route: Lucide (ISC, lucide.dev) */
const ICON = svg`<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>`;
const CHECK = svg`<path d="M20 6 9 17l-5-5"></path>`;
const CROSS = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const wall = () => Date.now();
const LIVE = new Set<AgentTrailStatus>(["running"]);
let instances = 0;

/** m:ss, or h:mm:ss past an hour */
export function agentTrailClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/**
 * The steps an agent works through as one quiet trail: done, the one it's on with its sub-steps, one waiting for a person, and what's next.
 * @tag tc-agent-trail
 * @fires tc-decision - Approve or Decline was pressed on a waiting step ({ decision, step }: AgentTrailDecisionDetail); cancelable – prevented, the step stays as it was
 * @fires tc-collapsed-change - The trail was folded or opened ({ collapsed }: AgentTrailCollapsedChange); cancelable – prevented, `collapsed` stays as it was
 */
export class TcAgentTrail extends TcElement {
  static override ui = "atr";

  /** The task, as the header's title */
  @property() accessor heading = "Task";
  /** A line under the task */
  @property() accessor description: string | undefined = undefined;
  /** The steps, in order */
  @property({ attribute: false }) accessor steps: AgentTrailStep[] = [];
  /** "Now", epoch ms; unset, the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Folded to the header. Changed by the user unless a tc-collapsed-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor collapsed = false;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AgentTrailLabels> = {};

  @state() private accessor clock = 0;
  @state() private accessor announcement = "";
  private readonly uid = `tc-atr-${++instances}`;
  private readonly screen = new OnScreenController(this);
  private timer = 0;
  private currentId: string | null = null;

  private get words(): AgentTrailLabels {
    return { ...defaultAgentTrailLabels, ...this.labels };
  }

  override connectedCallback() {
    super.connectedCallback();
    this.clock = wall();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  /** The step it's on: the first running or waiting one, else the first not done */
  get current(): AgentTrailStep | undefined {
    return this.steps.find((s) => s.status === "running" || s.status === "waiting") ?? this.steps.find((s) => s.status === "pending");
  }

  private get live() {
    return this.steps.some((s) => LIVE.has(s.status) || s.substeps?.some((x) => LIVE.has(x.status)));
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const ticking = this.live && this.now === undefined && this.screen.onScreen && !this.collapsed;
    if (ticking && !this.timer) {
      this.clock = wall();
      this.timer = window.setInterval(() => (this.clock = wall()), 1000);
    } else if (!ticking && this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
    if (changed.has("steps")) {
      const cur = this.current;
      const id = cur?.status === "running" || cur?.status === "waiting" ? cur.id : null;
      if (id !== this.currentId) {
        // The first render sets the baseline quietly; later moves are announced
        if (this.currentId !== null || changed.get("steps") !== undefined) {
          if (cur && id) this.announcement = `${this.words.now}: ${cur.title}, ${cur.status === "waiting" ? this.words.waiting : this.words.running}`;
        }
        this.currentId = id;
      }
    }
  }

  /** Whether the timer is ticking, for the page and for tests */
  get ticking() {
    return this.timer !== 0;
  }

  private get latest() {
    return this.now ?? this.clock;
  }

  private took(started?: number, ended?: number) {
    if (started === undefined) return null;
    return Math.max(0, (ended ?? this.latest) - started);
  }

  private statusWord(status: AgentTrailStatus) {
    return this.words[status];
  }

  private decide(step: AgentTrailStep, decision: AgentTrailDecision) {
    if (!this.emit<AgentTrailDecisionDetail>("tc-decision", { decision, step }, { cancelable: true })) return;
    const at = this.latest;
    this.steps = this.steps.map((s) =>
      s.id !== step.id
        ? s
        : decision === "approve"
          ? { ...s, status: "running" as const, started: s.started ?? at }
          : { ...s, status: "failed" as const, ended: at, detail: this.words.declined },
    );
  }

  private toggle() {
    const collapsed = !this.collapsed;
    if (this.emit<AgentTrailCollapsedChange>("tc-collapsed-change", { collapsed }, { cancelable: true })) this.collapsed = collapsed;
  }

  private mark(status: AgentTrailStatus) {
    const glyph = status === "done" ? CHECK : status === "failed" ? CROSS : null;
    return html`<span class="ui-atr__mark" data-status=${status} aria-hidden="true">${glyph ? html`<svg viewBox="0 0 24 24">${glyph}</svg>` : nothing}</span>`;
  }

  private renderSubsteps(step: AgentTrailStep) {
    const subs = step.substeps ?? [];
    if (!subs.length || (step.status !== "running" && step.status !== "waiting")) return nothing;
    return html`<ol class="ui-atr__subs" aria-label=${step.title}>
      ${subs.map((x) => {
        const t = this.took(x.started, x.ended);
        return html`<li class="ui-atr__sub" data-status=${x.status}>
          ${this.mark(x.status)}
          <span class="ui-atr__sub-title">${x.title}</span>
          ${x.status === "running" && t !== null
            ? html`<span class="ui-atr__timer">${agentTrailClock(t)}</span>`
            : x.status === "done" && t !== null
              ? html`<span class="ui-atr__time">${duration(t)}</span>`
              : nothing}
          <span class="tc-sr-only">, ${this.statusWord(x.status)}</span>
        </li>`;
      })}
    </ol>`;
  }

  private renderStep(step: AgentTrailStep) {
    const w = this.words;
    const t = this.took(step.started, step.ended);
    const current = step.status === "running" || step.status === "waiting";
    return html`<li class="ui-atr__step" data-status=${step.status} data-step=${step.id} ?data-current=${current}>
      <span class="ui-atr__rail" aria-hidden="true">${this.mark(step.status)}<span class="ui-atr__line">${step.status === "running" ? html`<span class="ui-atr__light"></span>` : nothing}</span></span>
      <div class="ui-atr__body">
        <div class="ui-atr__row">
          <span class="ui-atr__title">${step.title}</span>
          ${step.status === "done" && t !== null
            ? html`<span class="ui-atr__time">${duration(t)}</span>`
            : step.status === "running" && t !== null && !step.substeps?.length
              ? html`<span class="ui-atr__timer">${agentTrailClock(t)}</span>`
              : nothing}
          <span class="ui-atr__word" data-status=${step.status} ?hidden=${step.status === "pending" || step.status === "done"}>${this.statusWord(step.status)}</span>
          ${step.status === "pending" || step.status === "done" ? html`<span class="tc-sr-only">, ${this.statusWord(step.status)}</span>` : nothing}
        </div>
        ${step.detail && (current || step.status === "failed") ? html`<p class="ui-atr__detail">${step.detail}</p>` : nothing}
        ${this.renderSubsteps(step)}
        ${step.status === "waiting"
          ? html`<div class="ui-atr__decide">
              <button type="button" class="tc-btn-sm ui-atr__approve" data-decision="approve" @click=${() => this.decide(step, "approve")}>${w.approve}<span class="tc-sr-only">: ${step.title}</span></button>
              <button type="button" class="tc-btn-sm ui-atr__decline" data-decision="decline" @click=${() => this.decide(step, "decline")}>${w.decline}<span class="tc-sr-only">: ${step.title}</span></button>
            </div>`
          : nothing}
      </div>
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const done = this.steps.filter((s) => s.status === "done").length;
    const total = this.steps.length;
    const listId = `${this.uid}-trail`;
    return html`${cardHead({
        icon: ICON,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: html`<span class="ui-atr__aside">
          <span class="ui-atr__count">${done}/${total}<span class="tc-sr-only"> ${w.progress}</span></span>
          ${total
            ? html`<button type="button" class="tc-btn-sm ui-atr__toggle" aria-expanded=${this.collapsed ? "false" : "true"} aria-controls=${listId} @click=${this.toggle}>${this.collapsed ? w.show : w.hide}</button>`
            : nothing}
        </span>`,
      })}
      <div class="ui-atr__card" ?hidden=${this.collapsed && total > 0} id=${listId}>
        ${total
          ? html`<ol class="ui-atr__trail" aria-labelledby=${`${this.uid}-title`}>${this.steps.map((s) => this.renderStep(s))}</ol>`
          : html`<p class="ui-atr__none">${w.empty}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${this.announcement}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="atr"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="atr"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The mark's size, and how long the light takes down the trail – override them on the element */
[data-ui="atr"] { --tc-atr-mark: var(--tc-space-4); --tc-atr-sub-mark: var(--tc-space-2-5); --tc-atr-light: calc(var(--tc-duration-slow) * 4); }
[data-ui="atr"] *, [data-ui="atr"] *::before, [data-ui="atr"] *::after { box-sizing: border-box; }
[data-ui="atr"] :where(p, ol) { margin: 0; }
[data-ui="atr"] :where(ol) { padding: 0; list-style: none; }
[data-ui="atr"] [hidden] { display: none !important; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="atr"] .ui-atr__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-atr__card { padding: var(--tc-space-3) var(--tc-space-4); }
.ui-atr__aside { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
.ui-atr__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-atr__trail { display: grid; }
.ui-atr__step { display: grid; grid-template-columns: var(--tc-atr-mark) minmax(0, 1fr); gap: var(--tc-space-2-5); }
.ui-atr__rail { display: flex; flex-direction: column; align-items: center; padding-top: var(--tc-space-0-5); }
.ui-atr__line { position: relative; flex: 1 1 auto; width: 1px; min-height: var(--tc-space-2); margin-top: var(--tc-space-1); overflow: hidden; background: var(--tc-border-default); }
.ui-atr__step:last-child .ui-atr__line { background: none; }
.ui-atr__step[data-status="done"] .ui-atr__line { background: var(--tc-text-muted); }
.ui-atr__light { position: absolute; left: 0; top: 0; width: 100%; height: var(--tc-space-6); background: linear-gradient(to bottom, transparent, var(--tc-status-info-fg), transparent); animation: tc-atr-light var(--tc-atr-light) var(--tc-ease-standard) infinite; }
@keyframes tc-atr-light { from { transform: translateY(-100%); } to { transform: translateY(400%); } }
.ui-atr__mark { display: inline-grid; place-items: center; flex: none; width: var(--tc-atr-mark); height: var(--tc-atr-mark); border: 1px solid var(--tc-border-strong); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); color: var(--tc-text-on-accent); }
.ui-atr__mark svg { width: 70%; height: 70%; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-atr__mark[data-status="done"] { border-color: var(--tc-text-primary); background: var(--tc-text-primary); color: var(--tc-surface-raised); }
.ui-atr__mark[data-status="failed"] { border-color: var(--tc-status-danger-fg); background: var(--tc-status-danger-fg); color: var(--tc-surface-raised); }
.ui-atr__mark[data-status="running"] { border-color: var(--tc-status-info-fg); box-shadow: inset 0 0 0 var(--tc-space-0-5) var(--tc-surface-raised), inset 0 0 0 var(--tc-space-2) var(--tc-status-info-fg); }
.ui-atr__mark[data-status="waiting"] { border-style: dashed; border-color: var(--tc-status-warning-fg); }
.ui-atr__body { display: grid; gap: var(--tc-space-1); min-width: 0; padding-bottom: var(--tc-space-3); }
.ui-atr__row { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2); min-height: var(--tc-atr-mark); }
.ui-atr__title { flex: 1 1 10em; min-width: 0; overflow-wrap: anywhere; }
.ui-atr__step[data-current] .ui-atr__title { font-weight: var(--tc-font-weight-medium); }
.ui-atr__step[data-status="pending"] .ui-atr__title { color: var(--tc-text-secondary); }
.ui-atr__time, .ui-atr__timer { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-atr__timer { color: var(--tc-status-info-fg); font-weight: var(--tc-font-weight-medium); }
.ui-atr__word { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; color: var(--tc-text-secondary); }
.ui-atr__word[data-status="running"] { color: var(--tc-status-info-fg); }
.ui-atr__word[data-status="waiting"] { color: var(--tc-status-warning-fg); }
.ui-atr__word[data-status="failed"] { color: var(--tc-status-danger-fg); }
.ui-atr__detail { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-atr__subs { display: grid; gap: var(--tc-space-1); margin-top: var(--tc-space-1); padding-left: var(--tc-space-2) !important; border-left: 1px solid var(--tc-border-default); }
.ui-atr__sub { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-font-size-xs); }
.ui-atr__sub .ui-atr__mark { width: var(--tc-atr-sub-mark); height: var(--tc-atr-sub-mark); }
.ui-atr__sub[data-status="running"] .ui-atr__mark { box-shadow: inset 0 0 0 var(--tc-space-0-5) var(--tc-status-info-fg); }
.ui-atr__sub-title { flex: 1 1 8em; min-width: 0; overflow-wrap: anywhere; }
.ui-atr__sub[data-status="pending"] .ui-atr__sub-title { color: var(--tc-text-secondary); }
.ui-atr__decide { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); margin-top: var(--tc-space-1); }
.ui-atr__none { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
@media (prefers-reduced-motion: reduce) { .ui-atr__light { display: none; } }
@media (forced-colors: active) {
  .ui-atr__mark { border-color: CanvasText; }
  .ui-atr__mark[data-status="done"], .ui-atr__mark[data-status="failed"] { background: CanvasText; color: Canvas; forced-color-adjust: none; }
  .ui-atr__line, .ui-atr__light { background: CanvasText; }
}
`;
}

if (!customElements.get("tc-agent-trail")) customElements.define("tc-agent-trail", TcAgentTrail);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-trail": TcAgentTrail;
  }
}
