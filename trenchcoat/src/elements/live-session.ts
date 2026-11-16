import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { AgentPlanStepStatus } from "./agent-plan";
import type { CollabFilterChange, CollabMessage, CollabParticipant, CollabSend } from "./collaboration-stream";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { dollars } from "./internal/format";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";
import "./collaboration-stream";
import "./meter-row";
import "./segmented-control";

/*
 * <tc-live-session> – work with a team of agents while they work. In the middle, what they say to each other and to
 * you, in the library's Collaboration Stream with its composer; beside it, the team's plan ticking off step by step,
 * each step with the agent it belongs to; under the plan, how full the shared context is, in the library's Meter Row.
 * Pick an agent at the top and its steps stand out in the plan while the others go quiet, and the stream shows that
 * agent's messages – picking an agent's tab in the stream picks it here too. Narrow, the plan goes under the stream.
 * A page section, not a card: the stream, the plan and the meter carry the look.
 *
 *   <tc-live-session .participants=${team} .messages=${messages} .steps=${plan} .context=${0.62}></tc-live-session>
 *
 * The stream's own events (tc-send, tc-filter-change) bubble from here; `onSend` is passed to it.
 */

/** You or an agent – the Collaboration Stream's participant, with an element avatar */
export type LiveSessionParticipant = CollabParticipant;
/** A message – the Collaboration Stream's message, with element file previews */
export type LiveSessionMessage = CollabMessage;
/** What you sent */
export type LiveSessionSend = CollabSend;

export type LiveSessionStep = {
  id: string;
  title: string;
  /** The agent the step belongs to – a participant's id */
  agentId?: string;
  status: AgentPlanStepStatus;
  /** A quieter line under the title */
  detail?: string;
};

/** Detail of tc-agent-change: the picked agent's id, or null for the whole team */
export type LiveSessionAgentChange = { agent: string | null; participant: CollabParticipant | null };

export type LiveSessionLabels = {
  team: string;
  pick: string;
  plan: string;
  progress: string;
  context: string;
  pending: string;
  active: string;
  done: string;
  failed: string;
  skipped: string;
  agentSteps: string;
};

export const defaultLiveSessionLabels: LiveSessionLabels = {
  team: "Whole team",
  pick: "Show agent",
  plan: "Plan",
  progress: "{done} of {total} done",
  context: "Shared context",
  pending: "Up next",
  active: "In progress",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
  agentSteps: "{name}: {count} steps",
};

/* Icons: Lucide (ISC, lucide.dev), 24×24 strokes */
const ICON_PLAN = svg`<path d="M9 6h11M9 12h11M9 18h11"></path><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"></path>`;
const MARK: Record<AgentPlanStepStatus, string> = {
  pending: "M12 12h.01",
  active: "M12 6v6l4 2",
  done: "M20 6 9 17l-5-5",
  failed: "M18 6 6 18M6 6l12 12",
  skipped: "M5 12h14",
};

let instances = 0;

/**
 * Work with a team of agents while they work – their conversation, the team's plan ticking off beside it, and the
 * shared context; picking an agent points at its steps.
 * @tag tc-live-session
 * @fires tc-agent-change - An agent was picked, or the whole team ({ agent, participant }: LiveSessionAgentChange); cancelable – prevented, `agent` stays as it was
 */
export class TcLiveSession extends TcElement {
  static override ui = "lses";

  /** The heading */
  @property() accessor heading = "Live session";
  /** You and the agents – the Collaboration Stream's `participants` */
  @property({ attribute: false }) accessor participants: CollabParticipant[] = [];
  /** What they said – the Collaboration Stream's `messages` */
  @property({ attribute: false }) accessor messages: CollabMessage[] = [];
  /** Your participant id */
  @property() accessor you = "you";
  /** Runs when you send a message or an answer; it may return a promise – the Collaboration Stream's `onSend` */
  @property({ attribute: false }) accessor onSend: ((message: CollabSend) => void | Promise<unknown>) | undefined = undefined;
  /** The team's plan, in order */
  @property({ attribute: false }) accessor steps: LiveSessionStep[] = [];
  /** How full the shared context is, from 0 to 1; without it, the meter is left out */
  @property({ type: Number }) accessor context: number | undefined = undefined;
  /** The meter's value in words, e.g. "124k of 200k tokens" – a percentage by default */
  @property({ attribute: "context-text" }) accessor contextText = "";
  /** The picked agent's id, or null for the whole team. Changed by the user unless a tc-agent-change listener calls preventDefault() */
  @property() accessor agent: string | null = null;
  /** Formats every cost in the stream – dollars by default */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** A locale for the stream's times */
  @property() accessor locale: string | undefined = undefined;
  /** A time zone for the stream's times, e.g. "Europe/Vienna" */
  @property({ attribute: "time-zone" }) accessor timeZone: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<LiveSessionLabels> = {};

  /** The stream's own filter – an agent's id follows `agent`; "everyone" and "you" are the stream's */
  @state() private accessor streamFilter = "everyone";

  private readonly uid = `tc-lses-${++instances}`;
  private lastAgent: string | null = null;

  private get l(): LiveSessionLabels {
    return { ...defaultLiveSessionLabels, ...this.labels };
  }

  private get agents() {
    return (this.participants ?? []).filter((p) => p.kind === "agent");
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>) {
    super.willUpdate(changed);
    // A new agent, from the picker or the page, points the stream at it
    if (changed.has("agent") && this.agent !== this.lastAgent) {
      this.lastAgent = this.agent;
      this.streamFilter = this.agent ?? "everyone";
    }
  }

  private pick(next: string | null) {
    if (next === this.agent) return true;
    const participant = next ? (this.agents.find((a) => a.id === next) ?? null) : null;
    if (!this.emit<LiveSessionAgentChange>("tc-agent-change", { agent: next, participant }, { cancelable: true })) return false;
    this.agent = next;
    return true;
  }

  private onStreamFilter(e: CustomEvent<CollabFilterChange>) {
    // The page hears tc-filter-change first, on the way up
    queueMicrotask(() => {
      if (e.defaultPrevented) return;
      const f = e.detail.filter;
      const isAgent = this.agents.some((a) => a.id === f);
      if (isAgent) this.pick(f);
      else if (this.agent !== null) this.pick(null);
      this.streamFilter = f;
    });
  }

  private renderPlan() {
    const l = this.l;
    const steps = this.steps ?? [];
    const done = steps.filter((s) => s.status === "done").length;
    const names = new Map((this.participants ?? []).map((p) => [p.id, p.name]));
    const picked = this.agent;
    const mine = picked ? steps.filter((s) => s.agentId === picked).length : 0;
    const progress = l.progress.replace("{done}", String(done)).replace("{total}", String(steps.length));
    const aside = html`<span class="ui-lses__progress">${progress}</span>`;
    return html`<section class="ui-lses__plan" aria-labelledby=${`${this.uid}-plan`}>
      ${cardHead({ icon: ICON_PLAN, title: l.plan, id: `${this.uid}-plan`, aside })}
      <div class="ui-lses__card">
        ${picked ? html`<p class="ui-lses__focus">${l.agentSteps.replace("{name}", names.get(picked) ?? picked).replace("{count}", String(mine))}</p>` : nothing}
        <ol class="ui-lses__steps">
          ${repeat(
            steps,
            (s) => s.id,
            (s) => {
              const state = picked ? (s.agentId === picked ? "on" : "off") : undefined;
              return html`<li class="ui-lses__step" data-status=${s.status} data-agent=${s.agentId ?? ""} data-highlight=${state ?? "none"}>
                <span class="ui-lses__mark" aria-hidden="true"
                  ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${svg`<path d=${MARK[s.status] ?? MARK.pending}></path>`}</svg></span
                >
                <span class="ui-lses__step-text">
                  <span class="ui-lses__step-title">${s.title}<span class="ui-lses__sr">, ${l[s.status] ?? s.status}</span></span>
                  ${s.detail ? html`<span class="ui-lses__step-detail">${s.detail}</span>` : nothing}
                </span>
                ${s.agentId ? html`<span class="ui-lses__chip">${names.get(s.agentId) ?? s.agentId}</span>` : nothing}
              </li>`;
            },
          )}
        </ol>
      </div>
    </section>`;
  }

  protected override render() {
    const l = this.l;
    const agents = this.agents;
    const options: SegmentOption[] = [{ value: "*", label: l.team }, ...agents.map((a) => ({ value: a.id, label: a.name }))];
    const context = this.context;
    return html`<header class="ui-lses__intro">
        <h2 class="ui-lses__headline">${this.heading}</h2>
        ${agents.length
          ? html`<tc-segmented-control
              look=${this.resolvedLook}
              size="sm"
              aria-label=${l.pick}
              .options=${options}
              .value=${this.agent ?? "*"}
              @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
                // The inner control's event stops here: the page hears tc-agent-change
                e.stopPropagation();
                e.preventDefault();
                this.pick(e.detail.value === "*" ? null : e.detail.value);
              }}
            ></tc-segmented-control>`
          : nothing}
      </header>
      <div class="ui-lses__body">
        <tc-collaboration-stream
          class="ui-lses__stream"
          look=${this.resolvedLook}
          heading=${l.team}
          .participants=${this.participants ?? []}
          .messages=${this.messages ?? []}
          .filter=${this.streamFilter}
          you=${this.you}
          .onSend=${this.onSend}
          .formatCost=${this.formatCost}
          .locale=${this.locale}
          .timeZone=${this.timeZone}
          @tc-filter-change=${this.onStreamFilter}
        ></tc-collaboration-stream>
        <div class="ui-lses__side">
          ${this.renderPlan()}
          ${context !== undefined
            ? html`<tc-meter-row look=${this.resolvedLook} class="ui-lses__context" label=${l.context} .value=${context} value-text=${this.contextText}></tc-meter-row>`
            : nothing}
        </div>
      </div>`;
  }

  static override css = /* css */ `
[data-ui="lses"] {
  container-type: inline-size;
  display: grid;
  gap: var(--tc-space-4);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="lses"] *, [data-ui="lses"] *::before, [data-ui="lses"] *::after { box-sizing: border-box; }
.ui-lses__intro { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-width: 0; }
.ui-lses__headline { margin: 0; color: var(--tc-text-strong); font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display-sm); letter-spacing: var(--tc-tracking-tight); }
[data-ui="lses"][data-look="clean"] .ui-lses__headline { font-weight: var(--tc-font-weight-medium); }
.ui-lses__body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 20rem); align-items: start; gap: var(--tc-space-4); }
.ui-lses__stream, .ui-lses__side { min-width: 0; }
.ui-lses__side { display: grid; gap: var(--tc-space-3); }

/* The plan: Standard a gray tray with the steps on a white card; Clean one white card */
.ui-lses__plan { min-width: 0; border-radius: var(--tc-tray-radius); }
:where([data-look="standard"], [data-look="standard"] *) .ui-lses__plan { padding: var(--tc-tray-inset); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *) .ui-lses__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-lses__plan { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-lses__card { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); }
.ui-lses__progress { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-lses__focus { margin: 0 0 var(--tc-space-1); color: var(--tc-accent-text); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-lses__steps { display: grid; gap: var(--tc-space-0-5); margin: 0; padding: 0; list-style: none; }
.ui-lses__step { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-2); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-lses__step[data-highlight="on"] { background: var(--tc-accent-subtle); box-shadow: inset var(--tc-space-0-5) 0 0 var(--tc-accent-solid); }
/* The other agents' steps go quiet – by colour, so they stay readable */
.ui-lses__step[data-highlight="off"] .ui-lses__step-title { color: var(--tc-text-muted); }
.ui-lses__mark { display: grid; place-items: center; width: var(--tc-space-5); height: var(--tc-space-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-lses__mark svg { width: var(--tc-space-3); height: var(--tc-space-3); stroke-width: var(--tc-head-glyph-stroke); }
.ui-lses__step[data-status="done"] .ui-lses__mark { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-lses__step[data-status="active"] .ui-lses__mark { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-lses__step[data-status="failed"] .ui-lses__mark { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-lses__step-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-lses__step-title { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); }
.ui-lses__step[data-status="done"]:not([data-highlight="on"]) .ui-lses__step-title { color: var(--tc-text-secondary); }
.ui-lses__step-detail { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-lses__chip { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); white-space: nowrap; }
.ui-lses__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

@container (max-width: 760px) {
  .ui-lses__body { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) { .ui-lses__step { transition: none; } }
@media (forced-colors: active) {
  .ui-lses__step[data-highlight="on"] { outline: 1px solid Highlight; }
  .ui-lses__mark { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-live-session")) customElements.define("tc-live-session", TcLiveSession);

declare global {
  interface HTMLElementTagNameMap {
    "tc-live-session": TcLiveSession;
  }
}
