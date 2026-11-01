import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-agent-handoff> – a task passed along a chain of agents. The agents are listed in order and, between them, each
 * handoff says how much carried over and, in words, how much got lost. The header totals what was lost. Picking a handoff
 * opens the two lists below it. An agent running now says so in words.
 *   · the handoffs are one tab stop: ↑ ↓ move, Home / End go to the ends, Enter or Space opens, Escape closes
 *   · for a person taking over from an agent, use tc-handoff
 * With view="pipeline" the agents run across the top and, between each pair, a queue shows the work waiting, joined to them
 * by lines drawn from each column's own edges, so they hold at any width. Its header opens that handoff's carried and lost
 * lists. The queues' items are one tab stop of their own, and when narrow it all stacks in order, without the lines.
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
  /** The model it runs on */
  model?: string;
  /** What it has cost so far, in the element's `currency` */
  cost?: number;
  /** What it's doing now */
  activity?: string;
  /** An icon element from the page (cloned), decorative */
  icon?: Element;
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
export type AgentHandoffQueueItem = {
  id: string;
  title: string;
  /** More about it, in a line */
  detail?: string;
  /** Where it stands, in words */
  status?: string;
  /** What needs care, in words: "2 claims unchecked" */
  warning?: string;
  /** An icon element from the page (cloned), decorative */
  icon?: Element;
};
export type AgentHandoffQueue = {
  /** The id of the step handing over */
  from: string;
  /** The id of the step taking over */
  to: string;
  /** The work waiting, next first. Ids are unique across all the queues */
  items: AgentHandoffQueueItem[];
};
export type AgentHandoffView = "chain" | "pipeline";
export type AgentHandoffItemSelectedChange = { itemSelected: string | null; item: AgentHandoffQueueItem | null };
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
  /** {n} */
  queueCount: string;
  queueEmpty: string;
  warning: string;
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
  queueCount: "{n} waiting",
  queueEmpty: "Nothing waiting.",
  warning: "Warning:",
};

/** A handoff's id: `from` and `to` joined, which is what `selected` holds */
export const agentHandoffId = (h: Pick<AgentHandoffLink, "from" | "to">) => `${h.from}>${h.to}`;

/* arrow-right-left: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"></path>`;
const WARN = svg`<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"></path><path d="M12 9v4M12 17h.01"></path>`;
let instances = 0;

/**
 * A task passed along a chain of agents, with what carried over and what got lost at each handoff.
 * @tag tc-agent-handoff
 * @fires tc-selected-change - A handoff was opened or closed ({ selected, handoff }: AgentHandoffSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-item-selected-change - A queue's item was picked or cleared ({ itemSelected, item }: AgentHandoffItemSelectedChange); cancelable – prevented, `itemSelected` stays as it was
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
  /** How it's drawn: "chain", a list of one task's journey, or "pipeline", agents across the top with queues between them */
  @property({ reflect: true }) accessor view: AgentHandoffView = "chain";
  /** The work waiting between agents, shown in the pipeline view */
  @property({ attribute: false }) accessor queues: AgentHandoffQueue[] = [];
  /** The picked queue item's id, or null. Changed by the user unless a tc-item-selected-change listener calls preventDefault() */
  @property({ attribute: "item-selected" }) accessor itemSelected: string | null = null;
  /** The currency for `cost` */
  @property() accessor currency = "USD";
  /** The locale for costs */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AgentHandoffLabels> = {};

  /** The handoff that holds the one tab stop */
  @state() private accessor active: string | null = null;
  /** The queue item that holds the items' one tab stop */
  @state() private accessor activeItem: string | null = null;
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
    if (this.view === "pipeline") return this.pairs.flatMap((p) => (p.handoff ? [p.handoff] : []));
    return this.steps.flatMap((s) => this.handoffs.filter((h) => h.from === s.id));
  }

  /** The pipeline's columns: each pair of agents in a row, with what's between them */
  private get pairs() {
    return this.steps.slice(0, -1).map((s, i) => {
      const to = this.steps[i + 1]!;
      return { from: s, to, handoff: this.handoffs.find((h) => h.from === s.id && h.to === to.id), items: this.queues.find((q) => q.from === s.id && q.to === to.id)?.items ?? [] };
    });
  }

  private get allItems() {
    return this.pairs.flatMap((p) => p.items);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("queues") || changed.has("steps") || changed.has("view")) {
      const items = this.view === "pipeline" ? this.allItems.map((i) => i.id) : null;
      if (items && this.itemSelected !== null && !items.includes(this.itemSelected)) this.itemSelected = null;
      if (items && this.activeItem !== null && !items.includes(this.activeItem)) this.activeItem = null;
    }
    if (changed.has("handoffs") || changed.has("steps") || changed.has("view")) {
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
    const across = this.view === "pipeline";
    if (e.key === "ArrowDown" || (across && e.key === "ArrowRight")) next = Math.min(all.length - 1, at + 1);
    else if (e.key === "ArrowUp" || (across && e.key === "ArrowLeft")) next = Math.max(0, at - 1);
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

  private pickItem(item: AgentHandoffQueueItem) {
    this.activeItem = item.id;
    const itemSelected = this.itemSelected === item.id ? null : item.id;
    this.setItemSelected(itemSelected, itemSelected ? item : null);
  }

  private setItemSelected(itemSelected: string | null, item: AgentHandoffQueueItem | null) {
    if (this.emit<AgentHandoffItemSelectedChange>("tc-item-selected-change", { itemSelected, item }, { cancelable: true })) this.itemSelected = itemSelected;
  }

  private onItemKey(e: KeyboardEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>(".ui-agh__item");
    if (!target) return;
    const all = this.allItems;
    const at = all.findIndex((i) => i.id === target.dataset.item);
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = Math.min(all.length - 1, at + 1);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = all.length - 1;
    else if (e.key === "Escape" && this.itemSelected !== null) {
      e.preventDefault();
      e.stopPropagation();
      this.setItemSelected(null, null);
      return;
    }
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation();
    const id = all[next]!.id;
    this.activeItem = id;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-item="${CSS.escape(id)}"]`)?.focus());
  }

  private cost(value: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency }).format(value);
    } catch {
      return String(value);
    }
  }

  /** The agent's own details, the same in both views */
  private renderWho(s: AgentHandoffStep) {
    const meta = [s.model, s.cost !== undefined ? this.cost(s.cost) : undefined].filter(Boolean).join(" · ");
    return html`<div class="ui-agh__who">
      <div class="ui-agh__name">${s.icon ? html`<span class="ui-agh__icon" aria-hidden="true">${s.icon.cloneNode(true)}</span>` : nothing}<span class="ui-agh__agent">${s.agent}</span></div>
      ${meta ? html`<span class="ui-agh__meta">${meta}</span>` : nothing}
      ${s.role ? html`<span class="ui-agh__role">${s.role}</span>` : nothing}
      ${s.summary ? html`<p class="ui-agh__summary">${s.summary}</p>` : nothing}
      ${s.activity ? html`<p class="ui-agh__activity">${s.activity}</p>` : nothing}
    </div>`;
  }

  private renderDetail(h: AgentHandoffLink, panel: string) {
    const w = this.words;
    return html`<div class="ui-agh__detail" id=${panel}>
      <div class="ui-agh__group">
        <h4 class="ui-agh__group-title">${w.carried}</h4>
        ${h.carried.length ? html`<ul class="ui-agh__items">${h.carried.map((c) => html`<li>${c}</li>`)}</ul>` : html`<p class="ui-agh__none">${w.noneCarried}</p>`}
      </div>
      <div class="ui-agh__group" data-kind="lost">
        <h4 class="ui-agh__group-title">${w.lost}</h4>
        ${h.lost.length ? html`<ul class="ui-agh__items">${h.lost.map((c) => html`<li>${c}</li>`)}</ul>` : html`<p class="ui-agh__none">${w.noneLost}</p>`}
      </div>
    </div>`;
  }

  private renderItem(item: AgentHandoffQueueItem, tabStop: string | null) {
    const w = this.words;
    return html`<li class="ui-agh__queue-row">
      <button type="button" class="ui-agh__item" data-item=${item.id} tabindex=${tabStop === item.id ? 0 : -1} aria-pressed=${this.itemSelected === item.id ? "true" : "false"} @click=${() => this.pickItem(item)}>
        <span class="ui-agh__item-title">${item.icon ? html`<span class="ui-agh__icon" aria-hidden="true">${item.icon.cloneNode(true)}</span>` : nothing}${item.title}</span>
        ${item.detail ? html`<span class="ui-agh__item-detail">${item.detail}</span>` : nothing}
        ${item.status ? html`<span class="ui-agh__item-status">${item.status}</span>` : nothing}
        ${item.warning ? html`<span class="ui-agh__warning"><svg class="ui-agh__mark" viewBox="0 0 24 24" aria-hidden="true">${WARN}</svg><span class="tc-sr-only">${w.warning} </span>${item.warning}</span>` : nothing}
      </button>
    </li>`;
  }

  private renderPipeline(tabStop: string | null) {
    const w = this.words;
    const pairs = this.pairs;
    const firstItem = this.allItems[0]?.id ?? null;
    const itemStop = this.activeItem ?? (this.allItems.some((i) => i.id === this.itemSelected) ? this.itemSelected : firstItem);
    const columns = { "--tc-agh-columns": `repeat(${Math.max(1, this.steps.length) * 2}, minmax(0, 1fr))` };
    return html`<ol class="ui-agh__pipeline" aria-labelledby=${`${this.uid}-title`} style=${styleMap(columns)} @keydown=${this.onKey}>
      ${this.steps.map((s, i) => {
        const pair = pairs[i];
        const h = pair?.handoff;
        const id = h ? agentHandoffId(h) : "";
        const open = h !== undefined && this.selected === id;
        const panel = `${this.uid}-${id}`;
        const name = pair ? w.handoffName.replace("{from}", pair.from.agent).replace("{to}", pair.to.agent) : "";
        const count = pair ? w.queueCount.replace("{n}", String(pair.items.length)) : "";
        return html`<li class="ui-agh__stage" data-status=${s.status} style=${styleMap({ "--tc-agh-column": `${i * 2 + 1} / span 2` })}>
            <div class="ui-agh__stage-head">
              <span class="ui-agh__dot" aria-hidden="true"></span>
              ${this.renderWho(s)}
              <span class="ui-agh__status" data-status=${s.status}>${w[s.status]}</span>
            </div>
          </li>
          ${pair
            ? html`<li class="ui-agh__queue" data-lost=${h?.lost.length ? "true" : "false"} ?data-open=${open} style=${styleMap({ "--tc-agh-column": `${i * 2 + 2} / span 2` })}>
                <div class="ui-agh__wire" aria-hidden="true" @click=${() => h && this.toggle(h)}></div>
                <div class="ui-agh__queue-card">
                  ${h
                    ? html`<button type="button" class="ui-agh__link" data-handoff=${id} tabindex=${tabStop === id ? 0 : -1} aria-expanded=${open ? "true" : "false"} aria-controls=${open ? panel : nothing} @click=${() => this.toggle(h)}>
                        <span class="tc-sr-only">${name}: </span>
                        <span class="ui-agh__queue-count">${count}</span>
                        <span class="ui-agh__carried">${w.carriedCount.replace("{n}", String(h.carried.length))}</span>
                        <span class="ui-agh__lost">${h.lost.length ? w.lostCount.replace("{n}", String(h.lost.length)) : w.nothingLost}</span>
                      </button>`
                    : html`<p class="ui-agh__queue-plain"><span class="tc-sr-only">${name}: </span><span class="ui-agh__queue-count">${count}</span></p>`}
                  ${open ? this.renderDetail(h, panel) : nothing}
                  ${pair.items.length ? html`<ul class="ui-agh__queue-items" @keydown=${this.onItemKey}>${pair.items.map((item) => this.renderItem(item, itemStop))}</ul>` : html`<p class="ui-agh__none ui-agh__queue-empty">${w.queueEmpty}</p>`}
                </div>
              </li>`
            : nothing}`;
      })}
    </ol>`;
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
      ${open ? this.renderDetail(h, panel) : nothing}
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
        ${this.steps.length && this.view === "pipeline"
          ? this.renderPipeline(tabStop)
          : this.steps.length
          ? html`<ol class="ui-agh__chain" aria-labelledby=${`${this.uid}-title`} @keydown=${this.onKey}>
              ${this.steps.map(
                (s) => html`<li class="ui-agh__step" data-status=${s.status}>
                    <span class="ui-agh__dot" aria-hidden="true"></span>
                    ${this.renderWho(s)}
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
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agh"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The dot's size, how far the line sits from the card's edge, and the height of the pipeline's lines – override them on the element */
[data-ui="agh"] { --tc-agh-dot: var(--tc-space-2-5); --tc-agh-rail: var(--tc-space-4); --tc-agh-wire: var(--tc-space-6); }
[data-ui="agh"] *, [data-ui="agh"] *::before, [data-ui="agh"] *::after { box-sizing: border-box; }
[data-ui="agh"] :where(p, h4, ol, ul) { margin: 0; }
[data-ui="agh"] :where(.ui-agh__pipeline, .ui-agh__queue-items) { padding: 0; list-style: none; }
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
.ui-agh__name { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-agh__icon { display: inline-flex; flex: none; width: var(--tc-space-4); height: var(--tc-space-4); }
.ui-agh__icon > * { width: 100%; height: 100%; }
.ui-agh__meta, .ui-agh__activity { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-agh__activity { color: var(--tc-status-info-fg); }
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
/* Pipeline. Each agent spans two columns and each queue the two around the gap, so a queue's edges fall on its agents' centres */
.ui-agh__pipeline { display: grid; grid-template-columns: var(--tc-agh-columns); padding: var(--tc-space-4) var(--tc-space-2); overflow-x: auto; }
.ui-agh__stage { grid-row: 1; grid-column: var(--tc-agh-column); display: grid; min-width: 0; padding-inline: var(--tc-space-1); }
.ui-agh__stage-head { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3); border-radius: var(--tc-card-radius); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-agh__stage-head .ui-agh__who { flex: 1 1 8em; }
.ui-agh__queue { grid-row: 2; grid-column: var(--tc-agh-column); min-width: 0; }
.ui-agh__wire { position: relative; height: var(--tc-agh-wire); border: var(--tc-hairline) solid var(--tc-agh-line, var(--tc-border-strong)); border-top: 0; border-radius: 0 0 var(--tc-control-radius-md) var(--tc-control-radius-md); cursor: pointer; }
.ui-agh__wire::after { content: ""; position: absolute; top: 100%; left: 50%; height: var(--tc-space-3); border-inline-start: var(--tc-hairline) solid var(--tc-agh-line, var(--tc-border-strong)); }
.ui-agh__queue[data-lost="true"] { --tc-agh-line: var(--tc-status-warning-fg); }
.ui-agh__queue[data-open] { --tc-agh-line: var(--tc-text-primary); }
.ui-agh__queue-card { display: grid; gap: var(--tc-space-1); margin: var(--tc-space-3) var(--tc-space-1) 0; padding: var(--tc-space-1); border-radius: var(--tc-card-radius); background: var(--tc-fill-hover); }
.ui-agh__queue[data-lost="true"] .ui-agh__lost { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-agh__queue-count { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-agh__queue-plain { padding: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-font-size-xs); }
.ui-agh__queue-items { display: grid; gap: var(--tc-space-1); }
.ui-agh__queue-empty { padding: var(--tc-space-1) var(--tc-space-2); }
.ui-agh__queue-row { min-width: 0; }
.ui-agh__item { display: grid; gap: var(--tc-space-0-5); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-primary); font: inherit; text-align: left; cursor: pointer; }
.ui-agh__item:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-text-muted); }
.ui-agh__item[aria-pressed="true"] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-text-primary); }
.ui-agh__item:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-agh__item-title { display: flex; align-items: center; gap: var(--tc-space-1-5); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-agh__item-detail, .ui-agh__item-status { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-agh__warning { display: flex; align-items: flex-start; gap: var(--tc-space-1); color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-agh__mark { flex: none; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
@container (max-width: 640px) {
  .ui-agh__pipeline { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2); overflow-x: visible; }
  .ui-agh__stage, .ui-agh__queue { grid-row: auto; grid-column: auto; }
  .ui-agh__wire { display: none; }
  .ui-agh__queue-card { margin-top: 0; }
}
@media (forced-colors: active) {
  .ui-agh__item[aria-pressed="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
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
