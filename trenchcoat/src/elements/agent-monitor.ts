import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OnScreenController } from "./internal/controllers";
import { duration } from "./internal/format";

/*
 * <tc-agent-monitor> – one agent at work, as a compact card: its current step with a clock and the cost so far, a strip of
 * its steps sized by how long each took, and the finished steps as a list. Picking a step, in the strip or the list, shows
 * its detail. Pause and Stop fire tc-action: Pause and Resume change `status` unless prevented, and Stop is left to the
 * page, which knows how the run ended.
 *   · the clock ticks once a second while running; it stops off screen, in a hidden tab, and when the run isn't running
 *   · the strip and the list are one tab stop each: ← → or ↑ ↓ move, Home / End go to the ends, Enter or Space picks,
 *     Escape closes the detail
 *   · tools are words, with an icon only if the page passes one
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-agent-monitor name="Literature scout" status="running" .startedAt=${at} .steps=${steps} .cost=${0.42}></tc-agent-monitor>
 */

export type AgentMonitorStatus = "running" | "paused" | "done" | "failed";
export type AgentMonitorStepStatus = "running" | "done" | "failed";
export type AgentMonitorAction = "pause" | "resume" | "stop";
export type AgentMonitorStep = {
  id: string;
  label: string;
  /** The tool it used, as a word */
  tool?: string;
  /** A small icon for the tool, an element the page supplies (cloned) */
  toolIcon?: Element;
  startedAt: number;
  /** Unset while it's still running */
  endedAt?: number;
  status: AgentMonitorStepStatus;
  /** More about it, shown when it's picked */
  detail?: string;
};
export type AgentMonitorSelectedChange = { selected: string | null; step: AgentMonitorStep | null };
export type AgentMonitorActionDetail = { action: AgentMonitorAction };

/** The element's words, every one renameable through `labels` */
export type AgentMonitorLabels = {
  running: string;
  paused: string;
  done: string;
  failed: string;
  current: string;
  noCurrent: string;
  elapsed: string;
  cost: string;
  strip: string;
  finished: string;
  noFinished: string;
  pause: string;
  resume: string;
  stop: string;
  close: string;
  tool: string;
  took: string;
  stepRunning: string;
  stepDone: string;
  stepFailed: string;
};
export const defaultAgentMonitorLabels: AgentMonitorLabels = {
  running: "Running",
  paused: "Paused",
  done: "Done",
  failed: "Failed",
  current: "Current step",
  noCurrent: "No step running",
  elapsed: "Time",
  cost: "Cost so far",
  strip: "Steps over time",
  finished: "Finished steps",
  noFinished: "No steps finished yet.",
  pause: "Pause",
  resume: "Resume",
  stop: "Stop",
  close: "Close",
  tool: "Tool",
  took: "Took",
  stepRunning: "Running",
  stepDone: "Done",
  stepFailed: "Failed",
};

/* activity: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M22 12h-2.5a2 2 0 0 0-1.9 1.5l-2.3 8.2a.25.25 0 0 1-.5 0L9.2 2.3a.25.25 0 0 0-.5 0L6.4 10.5A2 2 0 0 1 4.5 12H2"></path>`;
const wall = () => Date.now();
const FINISHED = new Set<AgentMonitorStepStatus>(["done", "failed"]);
let instances = 0;

/** h:mm:ss past an hour, else m:ss */
export function agentMonitorClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/**
 * One agent at work: its current step, a clock, the cost so far, a strip of its steps and the finished ones.
 * @tag tc-agent-monitor
 * @fires tc-selected-change - A step was picked or closed ({ selected, step }: AgentMonitorSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-action - Pause, Resume or Stop was pressed ({ action }: AgentMonitorActionDetail); cancelable – prevented, Pause and Resume leave `status` as it was
 */
export class TcAgentMonitor extends TcElement {
  static override ui = "amn";

  /** The agent's name */
  @property() accessor name = "Agent";
  /** A line under the name */
  @property() accessor description: string | undefined = undefined;
  /** Where the run stands: "running", "paused", "done" or "failed" */
  @property({ reflect: true }) accessor status: AgentMonitorStatus = "running";
  /** What it's doing now; by default the label of the step still running */
  @property({ attribute: "current-step" }) accessor currentStep: string | undefined = undefined;
  /** When the run started, epoch ms */
  @property({ type: Number, attribute: "started-at" }) accessor startedAt: number | undefined = undefined;
  /** When it finished or paused, epoch ms; by default when its last step ended */
  @property({ type: Number, attribute: "ended-at" }) accessor endedAt: number | undefined = undefined;
  /** "Now", epoch ms; unset, the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The cost so far */
  @property({ type: Number }) accessor cost: number | undefined = undefined;
  /** The cost's currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The steps, in order */
  @property({ attribute: false }) accessor steps: AgentMonitorStep[] = [];
  /** The picked step's id, or null. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** Offer Pause, Resume and Stop; set actions="false" to only watch */
  @property({ attribute: "actions", converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor actions = true;
  /** The locale for the cost */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AgentMonitorLabels> = {};

  @state() private accessor clock = 0;
  @state() private accessor activeSegment: string | null = null;
  @state() private accessor activeRow: string | null = null;
  private readonly uid = `tc-amn-${++instances}`;
  private readonly screen = new OnScreenController(this);
  private timer = 0;
  private returnTo: { area: "segment" | "row"; id: string } | null = null;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-amn__segment"));
  }

  private get words(): AgentMonitorLabels {
    return { ...defaultAgentMonitorLabels, ...this.labels };
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

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("steps") && this.selected !== null && !this.steps.some((s) => s.id === this.selected)) this.selected = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const ticking = this.status === "running" && this.now === undefined && this.screen.onScreen;
    if (ticking && !this.timer) {
      this.clock = wall();
      this.timer = window.setInterval(() => (this.clock = wall()), 1000);
    } else if (!ticking && this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
  }

  /** Whether the clock is ticking, for the page and for tests */
  get ticking() {
    return this.timer !== 0;
  }

  private get latest() {
    return this.now ?? this.clock;
  }

  /** Where the clock stands: a run that isn't running stops at its end */
  private get elapsed() {
    if (this.startedAt === undefined) return null;
    if (this.status === "running") return this.latest - this.startedAt;
    const lastEnd = this.steps.reduce<number | undefined>((max, s) => (s.endedAt !== undefined && (max === undefined || s.endedAt > max) ? s.endedAt : max), undefined);
    return (this.endedAt ?? lastEnd ?? this.latest) - this.startedAt;
  }

  private stepTime(s: AgentMonitorStep) {
    return Math.max(0, (s.endedAt ?? this.latest) - s.startedAt);
  }

  private money(n: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, maximumFractionDigits: 2 }).format(n);
    } catch {
      return `${n.toFixed(2)} ${this.currency}`;
    }
  }

  private act(action: AgentMonitorAction) {
    if (!this.emit<AgentMonitorActionDetail>("tc-action", { action }, { cancelable: true })) return;
    if (action === "pause") this.status = "paused";
    else if (action === "resume") this.status = "running";
  }

  private pick(s: AgentMonitorStep, area: "segment" | "row") {
    const selected = this.selected === s.id ? null : s.id;
    this.returnTo = { area, id: s.id };
    if (area === "segment") this.activeSegment = s.id;
    else this.activeRow = s.id;
    if (this.emit<AgentMonitorSelectedChange>("tc-selected-change", { selected, step: selected ? s : null }, { cancelable: true })) this.selected = selected;
  }

  private closeDetail() {
    const step = this.steps.find((s) => s.id === this.selected);
    if (!step) return;
    if (!this.emit<AgentMonitorSelectedChange>("tc-selected-change", { selected: null, step: null }, { cancelable: true })) return;
    this.selected = null;
    const back = this.returnTo;
    this.updateComplete.then(() => {
      const row = back?.area === "row" ? this.querySelector<HTMLElement>(`.ui-amn__step-row[data-step="${CSS.escape(back.id)}"]`) : null;
      const segment = this.querySelector<HTMLElement>(`.ui-amn__segment[data-step="${CSS.escape(back?.id ?? step.id)}"]`);
      (row ?? segment)?.focus();
    });
  }

  private onRovingKey(e: KeyboardEvent, area: "segment" | "row") {
    if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.closeDetail();
      return;
    }
    const selector = area === "segment" ? ".ui-amn__segment" : ".ui-amn__step-row";
    const target = (e.target as HTMLElement).closest<HTMLElement>(selector);
    if (!target) return;
    const list = area === "segment" ? this.steps : this.steps.filter((s) => FINISHED.has(s.status));
    const at = list.findIndex((s) => s.id === target.dataset.step);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(list.length - 1, at + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = list[next]!.id;
    if (area === "segment") this.activeSegment = id;
    else this.activeRow = id;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`${selector}[data-step="${CSS.escape(id)}"]`)?.focus());
  }

  private stepStatusWord(s: AgentMonitorStep) {
    const w = this.words;
    return s.status === "running" ? w.stepRunning : s.status === "failed" ? w.stepFailed : w.stepDone;
  }

  private renderTool(s: AgentMonitorStep) {
    if (!s.tool) return nothing;
    return html`<span class="ui-amn__tool">${s.toolIcon ? html`<span class="ui-amn__tool-icon" aria-hidden="true">${s.toolIcon.cloneNode(true)}</span>` : nothing}${s.tool}</span>`;
  }

  private renderDetail() {
    const s = this.steps.find((x) => x.id === this.selected);
    if (!s) return nothing;
    const w = this.words;
    return html`<div class="ui-amn__detail" id=${`${this.uid}-detail`} role="group" aria-label=${s.label}>
      <div class="ui-amn__detail-head">
        <span class="ui-amn__detail-title">${s.label}</span>
        <button type="button" class="tc-btn-sm ui-amn__close" @click=${this.closeDetail}>${w.close}<span class="tc-sr-only">, ${s.label}</span></button>
      </div>
      <p class="ui-amn__detail-meta">${this.stepStatusWord(s)} · ${w.took} ${duration(this.stepTime(s))}${s.tool ? html` · ${w.tool}: ${this.renderTool(s)}` : nothing}</p>
      ${s.detail ? html`<p class="ui-amn__detail-body">${s.detail}</p>` : nothing}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const running = this.steps.find((s) => s.status === "running");
    const current = this.currentStep ?? running?.label;
    const finished = this.steps.filter((s) => FINISHED.has(s.status));
    const elapsed = this.elapsed;
    const segmentStop = this.activeSegment ?? this.selected ?? this.steps[0]?.id ?? null;
    const rowStop = this.activeRow ?? (finished.some((s) => s.id === this.selected) ? this.selected : null) ?? finished[0]?.id ?? null;
    const canPause = this.actions && this.status === "running";
    const canResume = this.actions && this.status === "paused";
    const canStop = this.actions && (this.status === "running" || this.status === "paused");
    return html`${cardHead({
        icon: ICON,
        title: this.name,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: html`<span class="ui-amn__state" data-status=${this.status}>${w[this.status]}</span>`,
      })}
      <div class="ui-amn__card">
        <div class="ui-amn__now">
          <div class="ui-amn__current">
            <span class="ui-amn__label">${w.current}</span>
            <span class="ui-amn__current-step">${current ?? w.noCurrent}</span>
          </div>
          <dl class="ui-amn__figures">
            ${elapsed !== null ? html`<div><dt class="ui-amn__label">${w.elapsed}</dt><dd class="ui-amn__figure ui-amn__clock">${agentMonitorClock(elapsed)}</dd></div>` : nothing}
            ${this.cost !== undefined ? html`<div><dt class="ui-amn__label">${w.cost}</dt><dd class="ui-amn__figure ui-amn__cost">${this.money(this.cost)}</dd></div>` : nothing}
          </dl>
        </div>
        ${this.steps.length
          ? html`<div class="ui-amn__strip" role="group" aria-label=${w.strip} @keydown=${(e: KeyboardEvent) => this.onRovingKey(e, "segment")}>
              ${this.steps.map(
                (s) => html`<button
                  type="button"
                  class="ui-amn__segment"
                  data-step=${s.id}
                  data-status=${s.status}
                  tabindex=${segmentStop === s.id ? 0 : -1}
                  aria-pressed=${this.selected === s.id ? "true" : "false"}
                  title=${s.label}
                  style=${styleMap({ flexGrow: String(Math.max(1, this.stepTime(s))) })}
                  @click=${() => this.pick(s, "segment")}
                >
                  <span class="tc-sr-only">${s.label}, ${this.stepStatusWord(s)}, ${duration(this.stepTime(s))}</span>
                </button>`,
              )}
            </div>`
          : nothing}
        ${this.renderDetail()}
        <div class="ui-amn__finished">
          <h4 class="ui-amn__label" id=${`${this.uid}-finished`}>${w.finished}</h4>
          ${finished.length
            ? html`<ul class="ui-amn__steps" aria-labelledby=${`${this.uid}-finished`} @keydown=${(e: KeyboardEvent) => this.onRovingKey(e, "row")}>
                ${finished.map(
                  (s) => html`<li>
                    <button type="button" class="ui-amn__step-row" data-step=${s.id} data-status=${s.status} tabindex=${rowStop === s.id ? 0 : -1} aria-pressed=${this.selected === s.id ? "true" : "false"} @click=${() => this.pick(s, "row")}>
                      <span class="ui-amn__step-label">${s.label}</span>
                      ${this.renderTool(s)}
                      <span class="ui-amn__step-state" data-status=${s.status}>${this.stepStatusWord(s)}</span>
                      <span class="ui-amn__step-time">${duration(this.stepTime(s))}</span>
                    </button>
                  </li>`,
                )}
              </ul>`
            : html`<p class="ui-amn__none">${w.noFinished}</p>`}
        </div>
        ${canPause || canResume || canStop
          ? html`<div class="ui-amn__actions">
              ${canPause ? html`<button type="button" class="tc-btn-sm ui-amn__action" data-action="pause" @click=${() => this.act("pause")}>${w.pause}</button>` : nothing}
              ${canResume ? html`<button type="button" class="tc-btn-sm ui-amn__action" data-action="resume" @click=${() => this.act("resume")}>${w.resume}</button>` : nothing}
              ${canStop ? html`<button type="button" class="tc-btn-sm ui-amn__action" data-action="stop" @click=${() => this.act("stop")}>${w.stop}</button>` : nothing}
            </div>`
          : nothing}
      </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="amn"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="amn"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The strip's height, and the narrowest a segment gets – override them on the element */
[data-ui="amn"] { --tc-amn-strip: var(--tc-space-4); --tc-amn-segment-min: var(--tc-space-2); }
[data-ui="amn"] *, [data-ui="amn"] *::before, [data-ui="amn"] *::after { box-sizing: border-box; }
[data-ui="amn"] :where(p, h4, ul, dl, dd) { margin: 0; }
[data-ui="amn"] :where(ul) { padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="amn"] .ui-amn__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-amn__card { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-amn__state { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-amn__state[data-status="running"] { color: var(--tc-status-info-fg); }
.ui-amn__state[data-status="done"] { color: var(--tc-status-success-fg); }
.ui-amn__state[data-status="failed"] { color: var(--tc-status-danger-fg); }
.ui-amn__now { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-4); }
.ui-amn__current { display: grid; flex: 1 1 12em; gap: var(--tc-space-0-5); min-width: 0; }
.ui-amn__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); }
.ui-amn__current-step { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-amn__figures { display: flex; gap: var(--tc-space-4); }
.ui-amn__figure { font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-amn__strip { display: flex; gap: var(--tc-space-0-5); width: 100%; }
.ui-amn__segment { flex: 1 1 0; min-width: var(--tc-amn-segment-min); height: var(--tc-amn-strip); padding: 0; border: 0; border-radius: var(--tc-radius-2xs); background: var(--tc-meter-fill); cursor: pointer; }
.ui-amn__segment[data-status="running"] { background: var(--tc-status-info-fg); }
.ui-amn__segment[data-status="failed"] { background: var(--tc-status-danger-fg); }
.ui-amn__segment[aria-pressed="true"] { box-shadow: 0 0 0 var(--tc-focus-ring-width) var(--tc-text-primary); }
.ui-amn__segment:focus-visible, .ui-amn__step-row:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-amn__detail { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); }
.ui-amn__detail-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-amn__detail-title { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-amn__detail-meta, .ui-amn__detail-body { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-amn__finished { display: grid; gap: var(--tc-space-1); }
.ui-amn__steps { display: grid; gap: var(--tc-space-0-5); }
.ui-amn__step-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-xs); text-align: left; cursor: pointer; }
.ui-amn__step-row:hover { background: var(--tc-fill-hover); }
.ui-amn__step-row[aria-pressed="true"] { background: var(--tc-fill-selected); }
.ui-amn__step-label { flex: 1 1 8em; min-width: 0; overflow-wrap: anywhere; }
.ui-amn__tool { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-secondary); }
.ui-amn__tool-icon { display: inline-flex; width: var(--tc-space-3); height: var(--tc-space-3); }
.ui-amn__step-state { color: var(--tc-text-secondary); }
.ui-amn__step-state[data-status="failed"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-amn__step-time { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-amn__none { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-amn__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); }
@media (forced-colors: active) {
  .ui-amn__segment { background: CanvasText; }
  .ui-amn__segment[aria-pressed="true"], .ui-amn__step-row[aria-pressed="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-agent-monitor")) customElements.define("tc-agent-monitor", TcAgentMonitor);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-monitor": TcAgentMonitor;
  }
}
