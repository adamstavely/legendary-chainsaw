import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-agent-handoff> – a task passed along a chain of agents. The agents are listed in order and, between them, each
 * handoff says how much carried over and, in words, how much got lost. The header totals what was lost. Picking a handoff
 * opens the two lists below it. An agent running now says so in words.
 *   · the handoffs are one tab stop: ↑ ↓ move, Home / End go to the ends, Enter or Space opens, Escape closes
 *   · for a person taking over from an agent, use tc-handoff
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-agent-handoff .steps=${steps} .handoffs=${handoffs}></tc-agent-handoff>
 */

export type AgentHandoffStatus = "waiting" | "running" | "done" | "failed";
export type AgentHandoffStep = {
  id: string;
  agent: string;
  /** What this agent is for */
  role?: string;
  status: AgentHandoffStatus;
  /** What it did, in a line */
  summary?: string;
};
export type AgentHandoffLink = {
  /** The id of the step handing over */
  from: string;
  /** The id of the step taking over */
  to: string;
  /** What went along */
  carried: string[];
  /** What didn't make it */
  lost: string[];
};
export type AgentHandoffSelectedChange = { selected: string | null; handoff: AgentHandoffLink | null };

/** The element's words, every one renameable through `labels` */
export type AgentHandoffLabels = {
  waiting: string;
  running: string;
  done: string;
  failed: string;
  /** {n} */
  carriedCount: string;
  lostCount: string;
  nothingLost: string;
  /** {n}, in the header */
  totalLost: string;
  totalNothingLost: string;
  carried: string;
  lost: string;
  noneCarried: string;
  noneLost: string;
  /** {from} and {to} */
  handoffName: string;
  empty: string;
};
export const defaultAgentHandoffLabels: AgentHandoffLabels = {
  waiting: "Waiting",
  running: "Running now",
  done: "Done",
  failed: "Failed",
  carriedCount: "{n} carried over",
  lostCount: "{n} lost",
  nothingLost: "Nothing lost",
  totalLost: "{n} lost along the way",
  totalNothingLost: "Nothing lost",
  carried: "Carried over",
  lost: "Lost",
  noneCarried: "Nothing carried over.",
  noneLost: "Nothing lost.",
  handoffName: "Handoff from {from} to {to}",
  empty: "No agents in this chain yet.",
};

/** A handoff's id: `from` and `to` joined, which is what `selected` holds */
export const agentHandoffId = (h: Pick<AgentHandoffLink, "from" | "to">) => `${h.from}>${h.to}`;

/* arrow-right-left: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"></path>`;
let instances = 0;

/**
 * A task passed along a chain of agents, with what carried over and what got lost at each handoff.
 * @tag tc-agent-handoff
 * @fires tc-selected-change - A handoff was opened or closed ({ selected, handoff }: AgentHandoffSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcAgentHandoff extends TcElement {
  static override ui = "agh";

  /** The heading */
  @property() accessor heading = "Agent handoffs";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The agents, in the order the task reached them */
  @property({ attribute: false }) accessor steps: AgentHandoffStep[] = [];
  /** What passed between them */
  @property({ attribute: false }) accessor handoffs: AgentHandoffLink[] = [];
  /** The open handoff's id (see agentHandoffId), or null. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AgentHandoffLabels> = {};

  /** The handoff that holds the one tab stop */
  @state() private accessor active: string | null = null;
  private readonly uid = `tc-agh-${++instances}`;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-agh__link"));
  }

  private get words(): AgentHandoffLabels {
    return { ...defaultAgentHandoffLabels, ...this.labels };
  }

  /** In the chain's order, so the arrow keys follow what's on screen */
  private get ordered() {
    return this.steps.flatMap((s) => this.handoffs.filter((h) => h.from === s.id));
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("handoffs") || changed.has("steps")) {
      const ids = this.ordered.map(agentHandoffId);
      if (this.selected !== null && !ids.includes(this.selected)) this.selected = null;
      if (this.active !== null && !ids.includes(this.active)) this.active = null;
    }
  }

  private agentName(id: string) {
    return this.steps.find((s) => s.id === id)?.agent ?? id;
  }

  private setSelected(selected: string | null, handoff: AgentHandoffLink | null) {
    if (this.emit<AgentHandoffSelectedChange>("tc-selected-change", { selected, handoff }, { cancelable: true })) this.selected = selected;
  }

  private toggle(h: AgentHandoffLink) {
    const id = agentHandoffId(h);
    this.active = id;
    if (this.selected === id) this.setSelected(null, null);
    else this.setSelected(id, h);
  }

  private onKey(e: KeyboardEvent) {
    const all = this.ordered;
    const target = (e.target as HTMLElement).closest<HTMLElement>(".ui-agh__link");
    if (!target || !all.length) return;
    const at = all.findIndex((h) => agentHandoffId(h) === target.dataset.handoff);
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(all.length - 1, at + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = all.length - 1;
    else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null, null);
      return;
    }
    if (next < 0) return;
    e.preventDefault();
    const id = agentHandoffId(all[next]!);
    this.active = id;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-handoff="${CSS.escape(id)}"]`)?.focus());
  }

  private renderLink(h: AgentHandoffLink, tabStop: string | null) {
    const w = this.words;
    const id = agentHandoffId(h);
    const open = this.selected === id;
    const panel = `${this.uid}-${id}`;
    const lost = h.lost.length;
    const name = w.handoffName.replace("{from}", this.agentName(h.from)).replace("{to}", this.agentName(h.to));
    return html`<li class="ui-agh__handoff" data-lost=${lost ? "true" : "false"}>
      <button type="button" class="ui-agh__link" data-handoff=${id} tabindex=${tabStop === id ? 0 : -1} aria-expanded=${open ? "true" : "false"} aria-controls=${open ? panel : nothing} @click=${() => this.toggle(h)}>
        <span class="tc-sr-only">${name}: </span>
        <span class="ui-agh__carried">${w.carriedCount.replace("{n}", String(h.carried.length))}</span>
        <span class="ui-agh__lost">${lost ? w.lostCount.replace("{n}", String(lost)) : w.nothingLost}</span>
      </button>
      ${open
        ? html`<div class="ui-agh__detail" id=${panel}>
            <div class="ui-agh__group">
              <h4 class="ui-agh__group-title">${w.carried}</h4>
              ${h.carried.length ? html`<ul class="ui-agh__items">${h.carried.map((c) => html`<li>${c}</li>`)}</ul>` : html`<p class="ui-agh__none">${w.noneCarried}</p>`}
            </div>
            <div class="ui-agh__group" data-kind="lost">
              <h4 class="ui-agh__group-title">${w.lost}</h4>
              ${lost ? html`<ul class="ui-agh__items">${h.lost.map((c) => html`<li>${c}</li>`)}</ul>` : html`<p class="ui-agh__none">${w.noneLost}</p>`}
            </div>
          </div>`
        : nothing}
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const total = this.handoffs.reduce((n, h) => n + h.lost.length, 0);
    const all = this.ordered.map(agentHandoffId);
    const tabStop = this.active ?? this.selected ?? all[0] ?? null;
    return html`${cardHead({
        icon: ICON,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: html`<span class="ui-agh__total" data-lost=${total ? "true" : "false"}>${total ? w.totalLost.replace("{n}", String(total)) : w.totalNothingLost}</span>`,
      })}
      <div class="ui-agh__card">
        ${this.steps.length
          ? html`<ol class="ui-agh__chain" aria-labelledby=${`${this.uid}-title`} @keydown=${this.onKey}>
              ${this.steps.map(
                (s) => html`<li class="ui-agh__step" data-status=${s.status}>
                    <span class="ui-agh__dot" aria-hidden="true"></span>
                    <div class="ui-agh__who">
                      <span class="ui-agh__agent">${s.agent}</span>
                      ${s.role ? html`<span class="ui-agh__role">${s.role}</span>` : nothing}
                      ${s.summary ? html`<p class="ui-agh__summary">${s.summary}</p>` : nothing}
                    </div>
                    <span class="ui-agh__status" data-status=${s.status}>${w[s.status]}</span>
                  </li>
                  ${this.handoffs.filter((h) => h.from === s.id).map((h) => this.renderLink(h, tabStop))}`,
              )}
            </ol>`
          : html`<p class="ui-agh__empty">${w.empty}</p>`}
      </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agh"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agh"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The dot's size, and how far the line sits from the card's edge – override them on the element */
[data-ui="agh"] { --tc-agh-dot: var(--tc-space-2-5); --tc-agh-rail: var(--tc-space-4); }
[data-ui="agh"] *, [data-ui="agh"] *::before, [data-ui="agh"] *::after { box-sizing: border-box; }
[data-ui="agh"] :where(p, h4, ol, ul) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agh"] .ui-agh__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-agh__total { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-agh__total[data-lost="true"] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-agh__chain { display: grid; padding: var(--tc-space-2) 0; list-style: none; }
.ui-agh__step { display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-2) var(--tc-agh-rail); }
.ui-agh__dot { flex: none; width: var(--tc-agh-dot); height: var(--tc-agh-dot); margin-top: var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-text-muted); }
.ui-agh__step[data-status="running"] .ui-agh__dot { background: var(--tc-status-info-fg); }
.ui-agh__step[data-status="done"] .ui-agh__dot { background: var(--tc-status-success-fg); }
.ui-agh__step[data-status="failed"] .ui-agh__dot { background: var(--tc-status-danger-fg); }
.ui-agh__who { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-agh__agent { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-agh__role, .ui-agh__summary { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-agh__status { flex: none; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-agh__status[data-status="running"] { color: var(--tc-status-info-fg); font-weight: var(--tc-font-weight-medium); }
.ui-agh__status[data-status="failed"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-agh__handoff { margin-inline-start: calc(var(--tc-agh-rail) + var(--tc-agh-dot) / 2); padding-inline-start: var(--tc-space-4); border-inline-start: var(--tc-hairline) solid var(--tc-border-subtle); margin-inline-end: var(--tc-agh-rail); }
.ui-agh__link { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); text-align: left; cursor: pointer; }
.ui-agh__link:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-agh__link[aria-expanded="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-agh__link:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-agh__handoff[data-lost="true"] .ui-agh__lost { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-agh__detail { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12em), 1fr)); gap: var(--tc-space-3); padding: var(--tc-space-2); }
.ui-agh__group { display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; }
.ui-agh__group-title { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-agh__group[data-kind="lost"] .ui-agh__group-title { color: var(--tc-status-warning-fg); }
.ui-agh__items { display: grid; gap: var(--tc-space-0-5); padding-inline-start: var(--tc-space-4); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-agh__none { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agh__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
@media (forced-colors: active) {
  .ui-agh__dot { background: CanvasText; }
  .ui-agh__link[aria-expanded="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-agent-handoff")) customElements.define("tc-agent-handoff", TcAgentHandoff);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-handoff": TcAgentHandoff;
  }
}
