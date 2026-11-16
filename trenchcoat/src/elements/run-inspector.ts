import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { compact, dollars, duration } from "./internal/format";
import type { TraceSpan, TraceSpanStatus } from "./trace-waterfall";
import type { ToolCallStatus } from "./tool-call-card";
import "./tool-call-card";

/*
 * <tc-run-inspector> – one multi-agent run on one screen. On top, the run's numbers: its status in a mark and a word,
 * how long it took, what it cost, the tokens, the calls and the errors. Below, who started whom as a tree of agent
 * cards, each with its own calls – LLM and tool calls – as rows with a small bar on the agent's own time span. A click
 * on a call (or Enter) opens it right under its row in the library's Tool Call Card, its error first when it failed;
 * Escape closes it and focus goes back to the row. Each card shows its first `call-limit` calls and "Show N more".
 * The data is a Trace Waterfall span tree: agents and sub-agents are cards, their llm and tool children are calls.
 * For a live run, pass the spans as they grow and `elapsed`, and running calls reach it.
 * Standard: the numbers on a gray tray, the cards white on it. Clean: white cards on the page.
 *
 *   <tc-run-inspector .root=${run} .elapsed=${msSinceStart} @tc-selected-change=${(e) => …}></tc-run-inspector>
 *
 * Keyboard. Each card's calls are one tab stop: ↑ ↓ Home End move between them, Enter or Space opens one, Escape closes.
 */

/** A span of the run – Trace Waterfall's TraceSpan, with an element icon */
export type InspectorSpan = TraceSpan;

export type RunInspectorSelectedChange = { selected: string | null; span: TraceSpan | null };

export type RunInspectorLabels = {
  status: string;
  duration: string;
  cost: string;
  tokens: string;
  calls: string;
  errors: string;
  running: string;
  done: string;
  failed: string;
  more: string;
  less: string;
  noCalls: string;
  llm: string;
  tool: string;
  subagent: string;
  lead: string;
  numbers: string;
  agents: string;
};

export const defaultRunInspectorLabels: RunInspectorLabels = {
  status: "Status",
  duration: "Duration",
  cost: "Cost",
  tokens: "Tokens",
  calls: "Calls",
  errors: "Errors",
  running: "Running",
  done: "Done",
  failed: "Failed",
  more: "Show {count} more",
  less: "Show fewer",
  noCalls: "No calls yet",
  llm: "LLM",
  tool: "Tool",
  subagent: "Sub-agent",
  lead: "Lead",
  numbers: "Run numbers",
  agents: "Agents in this run",
};

const isAgent = (s: TraceSpan) => s.kind === "agent" || s.kind === "subagent";
const isCall = (s: TraceSpan) => s.kind === "llm" || s.kind === "tool";
const CALL_STATUS: Record<TraceSpanStatus, ToolCallStatus> = { running: "running", done: "success", failed: "error" };

/* Icons: Lucide (ISC, lucide.dev), 24×24 strokes */
const ICON_RUN = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M7 16h8M7 11h12M7 6h3"></path>`;
const MARK: Record<TraceSpanStatus, string> = {
  running: "M12 6v6l4 2",
  done: "M20 6 9 17l-5-5",
  failed: "M18 6 6 18M6 6l12 12",
};
const mark = (status: TraceSpanStatus, cls: string) =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${MARK[status]}></path>`}</svg>`;

/** Every span of the tree, depth first */
function flatten(root: TraceSpan): TraceSpan[] {
  const out: TraceSpan[] = [];
  const walk = (s: TraceSpan) => {
    out.push(s);
    (s.children ?? []).forEach(walk);
  };
  walk(root);
  return out;
}

/** The run's numbers, from every span */
export function runNumbers(root: TraceSpan, elapsed?: number) {
  const all = flatten(root);
  const calls = all.filter(isCall);
  const ends = all.map((s) => s.end ?? elapsed ?? s.start);
  const end = root.end ?? elapsed ?? Math.max(root.start, ...ends);
  return {
    status: root.status,
    duration: Math.max(0, end - root.start),
    cost: all.reduce((n, s) => n + (s.cost ?? 0), 0),
    tokens: all.reduce((n, s) => n + (s.tokensIn ?? 0) + (s.tokensOut ?? 0), 0),
    calls: calls.length,
    errors: all.filter((s) => s.status === "failed" && s !== root).length,
  };
}

let instances = 0;

/**
 * One multi-agent run on one screen – its numbers, who started whom as agent cards, each agent's calls as small bars,
 * and any call opened right under its row.
 * @tag tc-run-inspector
 * @fires tc-selected-change - A call was opened or closed ({ selected, span }: RunInspectorSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcRunInspector extends TcElement {
  static override ui = "rins";

  /** The heading */
  @property() accessor heading = "Run inspector";
  /** The run as a span tree: agents and sub-agents are cards, their llm and tool children are calls */
  @property({ attribute: false }) accessor root: TraceSpan = { id: "run", name: "Run", kind: "agent", status: "done", start: 0, end: 0 };
  /** For a live run, ms since it started – running spans reach it. The block reads no clock of its own */
  @property({ type: Number }) accessor elapsed: number | undefined = undefined;
  /** Id of the open call. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** How many calls each card shows before "Show N more" */
  @property({ type: Number, attribute: "call-limit" }) accessor callLimit = 6;
  /** Formats every cost – dollars by default, e.g. "$0.42" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<RunInspectorLabels> = {};

  /** Cards showing all their calls */
  @state() private accessor expanded: string[] = [];
  /** Each card's call that holds its tab stop */
  @state() private accessor active: Record<string, string> = {};

  private readonly uid = `tc-rins-${++instances}`;

  private get l(): RunInspectorLabels {
    return { ...defaultRunInspectorLabels, ...this.labels };
  }

  private get spans() {
    return this.root ? flatten(this.root) : [];
  }

  private statusWord(s: TraceSpanStatus) {
    return this.l[s] ?? s;
  }

  private select(id: string | null) {
    if (id === this.selected) return;
    const span = id ? (this.spans.find((s) => s.id === id) ?? null) : null;
    if (!this.emit<RunInspectorSelectedChange>("tc-selected-change", { selected: id, span }, { cancelable: true })) return;
    this.selected = id;
  }

  private focusCall(id: string) {
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-call="${CSS.escape(id)}"]`)?.focus());
  }

  private onKey(agent: TraceSpan, calls: TraceSpan[], e: KeyboardEvent) {
    const i = calls.findIndex((c) => c.id === (e.target as HTMLElement).dataset.call);
    if (i < 0) return;
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(calls.length - 1, i + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, i - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = calls.length - 1;
    else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      const open = this.selected;
      this.select(null);
      this.focusCall(open);
      return;
    } else return;
    e.preventDefault();
    this.active = { ...this.active, [agent.id]: calls[next].id };
    this.focusCall(calls[next].id);
  }

  private onDetailKey(e: KeyboardEvent, id: string) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    this.select(null);
    this.focusCall(id);
  }

  private toggleMore(id: string) {
    this.expanded = this.expanded.includes(id) ? this.expanded.filter((x) => x !== id) : [...this.expanded, id];
  }

  private renderNumbers() {
    const l = this.l;
    const n = runNumbers(this.root, this.elapsed);
    const cell = (label: string, value: unknown, cls = "") => html`<div class=${`ui-rins__stat ${cls}`}><dt>${label}</dt><dd>${value}</dd></div>`;
    return html`<dl class="ui-rins__numbers" aria-label=${l.numbers}>
      ${cell(l.status, html`<span class="ui-rins__status" data-status=${n.status}>${mark(n.status, "ui-rins__mark")}${this.statusWord(n.status)}</span>`)}
      ${cell(l.duration, duration(n.duration))} ${cell(l.cost, this.formatCost(n.cost))} ${cell(l.tokens, compact(n.tokens))}
      ${cell(l.calls, String(n.calls))} ${cell(l.errors, String(n.errors), n.errors ? "ui-rins__stat--bad" : "")}
    </dl>`;
  }

  private renderCall(agent: TraceSpan, call: TraceSpan, range: [number, number], tabStop: string) {
    const l = this.l;
    const open = this.selected === call.id;
    const end = call.end ?? this.elapsed ?? call.start;
    const [a, b] = range;
    const span = Math.max(1, b - a);
    const left = ((call.start - a) / span) * 100;
    const width = Math.max(1.5, ((end - call.start) / span) * 100);
    const detailId = `${this.uid}-${call.id}`;
    return html`<li class="ui-rins__call-item" data-status=${call.status}>
      <button
        type="button"
        class="ui-rins__call"
        data-call=${call.id}
        data-status=${call.status}
        tabindex=${call.id === tabStop ? 0 : -1}
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${detailId}
        @click=${() => this.select(open ? null : call.id)}
        @focus=${() => {
          if (this.active[agent.id] !== call.id) this.active = { ...this.active, [agent.id]: call.id };
        }}
      >
        <span class="ui-rins__kind" data-kind=${call.kind}>${call.kind === "llm" ? l.llm : l.tool}</span>
        <span class="ui-rins__call-name">${call.name}${call.detail ? html` <span class="ui-rins__call-detail">${call.detail}</span>` : nothing}</span>
        <span class="ui-rins__track" aria-hidden="true"><span class="ui-rins__bar" data-status=${call.status} style=${styleMap({ left: `${Math.min(98.5, Math.max(0, left))}%`, width: `${Math.min(100, width)}%` })}></span></span>
        <span class="ui-rins__call-time">${duration(end - call.start)}</span>
        ${call.status === "done" ? nothing : html`<span class="ui-rins__call-status" data-status=${call.status}>${mark(call.status, "ui-rins__mark")}${this.statusWord(call.status)}</span>`}
      </button>
      <div id=${detailId} class="ui-rins__detail" ?hidden=${!open} @keydown=${(e: KeyboardEvent) => this.onDetailKey(e, call.id)}>
        ${open
          ? html`<tc-tool-call-card
              look=${this.resolvedLook}
              name=${call.name}
              .summary=${call.detail}
              status=${CALL_STATUS[call.status]}
              .args=${call.input}
              .result=${call.output}
              .error=${call.error}
              .duration=${end - call.start}
              open
            ></tc-tool-call-card>`
          : nothing}
      </div>
    </li>`;
  }

  private renderAgent(agent: TraceSpan, depth: number): TemplateResult {
    const l = this.l;
    const children = agent.children ?? [];
    const calls = children.filter(isCall);
    const subs = children.filter(isAgent);
    const showAll = this.expanded.includes(agent.id);
    const limit = Math.max(1, this.callLimit);
    let shown = showAll ? calls : calls.slice(0, limit);
    // The open call is always on show
    const open = calls.find((c) => c.id === this.selected);
    if (open && !shown.includes(open)) shown = [...shown, open];
    const hidden = calls.length - shown.length;
    const end = agent.end ?? this.elapsed ?? Math.max(agent.start, ...calls.map((c) => c.end ?? c.start));
    const own = (agent.cost ?? 0) + calls.reduce((n, c) => n + (c.cost ?? 0), 0);
    const tabStop = shown.some((c) => c.id === this.active[agent.id]) ? this.active[agent.id] : (open?.id ?? shown[0]?.id ?? "");
    const titleId = `${this.uid}-${agent.id}-title`;
    return html`<li class="ui-rins__node" data-depth=${depth}>
      <article class="ui-rins__card" data-agent=${agent.id} data-status=${agent.status} aria-labelledby=${titleId}>
        <div class="ui-rins__card-head">
          <div class="ui-rins__card-title">
            <h4 id=${titleId} class="ui-rins__name">${agent.name}</h4>
            <span class="ui-rins__role">${depth === 0 ? l.lead : l.subagent}${agent.model ? html` · ${agent.model}` : nothing}</span>
          </div>
          <span class="ui-rins__status" data-status=${agent.status}>${mark(agent.status, "ui-rins__mark")}${this.statusWord(agent.status)}</span>
          <span class="ui-rins__card-meta">${this.formatCost(own)} · ${duration(end - agent.start)}</span>
        </div>
        ${agent.detail ? html`<p class="ui-rins__task">${agent.detail}</p>` : nothing}
        ${calls.length
          ? html`<ul class="ui-rins__calls" aria-label=${`${l.calls}: ${agent.name}`} @keydown=${(e: KeyboardEvent) => this.onKey(agent, shown, e)}>
              ${repeat(
                shown,
                (c) => c.id,
                (c) => this.renderCall(agent, c, [agent.start, Math.max(end, agent.start + 1)], tabStop),
              )}
            </ul>`
          : html`<p class="ui-rins__empty">${l.noCalls}</p>`}
        ${hidden > 0 || (showAll && calls.length > limit)
          ? html`<button type="button" class="ui-rins__more" aria-expanded=${showAll ? "true" : "false"} @click=${() => this.toggleMore(agent.id)}>
              ${showAll ? l.less : l.more.replace("{count}", String(hidden))}
            </button>`
          : nothing}
      </article>
      ${subs.length
        ? html`<ul class="ui-rins__tree" role="list">
            ${repeat(
              subs,
              (s) => s.id,
              (s) => this.renderAgent(s, depth + 1),
            )}
          </ul>`
        : nothing}
    </li>`;
  }

  protected override render() {
    const l = this.l;
    const root = this.root;
    if (!root) return nothing;
    const head = cardHead({ icon: ICON_RUN, title: this.heading, subtitle: root.name, id: `${this.uid}-title`, level: 2 });
    return html`<section class="ui-rins__root" aria-labelledby=${`${this.uid}-title`}>
      <div class="ui-rins__top">${head}${this.renderNumbers()}</div>
      <ul class="ui-rins__tree ui-rins__tree--root" role="list" aria-label=${l.agents}>
        ${this.renderAgent(root, 0)}
      </ul>
    </section>`;
  }

  static override css = /* css */ `
[data-ui="rins"] {
  container-type: inline-size;
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  /* How far each level of sub-agents steps in */
  --tc-rins-indent: var(--tc-space-6);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rins"] *, [data-ui="rins"] *::before, [data-ui="rins"] *::after { box-sizing: border-box; }
.ui-rins__root { display: grid; gap: var(--tc-space-4); min-width: 0; }

/* The numbers: the header and a row of stats on the tray (Standard) or a card (Clean) */
.ui-rins__top { display: grid; gap: var(--tc-space-2); border-radius: var(--tc-tray-radius); }
:where([data-look="standard"], [data-look="standard"] *) .ui-rins__top { padding: var(--tc-tray-inset); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *) .ui-rins__top { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); padding-bottom: var(--tc-space-3); }
.ui-rins__numbers { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 7.5rem), 1fr)); gap: var(--tc-space-2); margin: 0; padding: 0 var(--tc-space-3); }
.ui-rins__stat { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-rins__stat { background: var(--tc-surface-sunken); box-shadow: none; }
.ui-rins__stat dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-rins__stat dd { margin: 0; color: var(--tc-text-strong); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); font-variant-numeric: tabular-nums; }
.ui-rins__stat--bad dd { color: var(--tc-status-danger-fg); }

/* Status: a mark and a word, tinted */
.ui-rins__status, .ui-rins__call-status { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-weight: var(--tc-font-weight-medium); }
.ui-rins__mark { flex: none; width: var(--tc-space-3-5); height: var(--tc-space-3-5); stroke-width: var(--tc-head-glyph-stroke); }
[data-status="running"].ui-rins__status, [data-status="running"].ui-rins__call-status { color: var(--tc-status-info-fg); }
[data-status="done"].ui-rins__status { color: var(--tc-status-success-fg); }
[data-status="failed"].ui-rins__status, [data-status="failed"].ui-rins__call-status { color: var(--tc-status-danger-fg); }
.ui-rins__stat dd .ui-rins__status { font-size: var(--tc-font-size-md); }

/* The tree: cards, sub-agents stepped in under a line */
.ui-rins__tree { display: grid; gap: var(--tc-space-3); margin: 0; padding: 0; list-style: none; min-width: 0; }
.ui-rins__node { display: grid; gap: var(--tc-space-3); min-width: 0; }
.ui-rins__node > .ui-rins__tree { margin-left: var(--tc-rins-indent); padding-left: var(--tc-space-3); border-left: var(--tc-hairline) solid var(--tc-border-default); }
.ui-rins__card { display: grid; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-rins__card[data-status="failed"] { box-shadow: var(--tc-card-shadow), inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); }
.ui-rins__card-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); }
.ui-rins__card-title { flex: 1 1 12rem; display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2); min-width: 0; }
.ui-rins__name { margin: 0; color: var(--tc-title-color); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); }
[data-ui="rins"][data-look="clean"] .ui-rins__name { font-weight: var(--tc-font-weight-medium); }
.ui-rins__role, .ui-rins__card-meta, .ui-rins__task, .ui-rins__empty { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-rins__card-meta { font-variant-numeric: tabular-nums; }
.ui-rins__task, .ui-rins__empty { margin: 0; }

/* Calls: a row each, with a bar on the agent's own time span */
.ui-rins__calls { display: grid; gap: var(--tc-space-0-5); margin: 0; padding: 0; list-style: none; }
.ui-rins__call { display: grid; grid-template-columns: auto minmax(0, 1.4fr) minmax(4rem, 1fr) auto auto; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-2); border: 0; border-radius: var(--tc-radius-md); background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.ui-rins__call:hover { background: var(--tc-fill-hover); }
.ui-rins__call[aria-expanded="true"] { background: var(--tc-fill-selected); }
.ui-rins__call:focus-visible, .ui-rins__more:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rins__kind { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); }
.ui-rins__call-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--tc-text-primary); }
.ui-rins__call-detail { color: var(--tc-text-muted); }
.ui-rins__track { position: relative; height: var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); }
.ui-rins__bar { position: absolute; top: 0; bottom: 0; border-radius: var(--tc-radius-full); background: var(--tc-chart-1); }
.ui-rins__bar[data-status="failed"] { background: var(--tc-status-danger-solid); }
.ui-rins__bar[data-status="running"] { background: var(--tc-status-info-solid); }
.ui-rins__call-time { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-rins__call-status { font-size: var(--tc-font-size-xs); }
.ui-rins__detail { padding: var(--tc-space-1) 0 var(--tc-space-2) var(--tc-space-2); }
.ui-rins__detail[hidden] { display: none; }
.ui-rins__more { justify-self: start; min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-radius-md); background: transparent; color: var(--tc-accent-text); font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); cursor: pointer; }
.ui-rins__more:hover { background: var(--tc-fill-hover); }

@container (max-width: 560px) {
  [data-ui="rins"] { --tc-rins-indent: var(--tc-space-2); }
  .ui-rins__call { grid-template-columns: auto minmax(0, 1fr) auto; }
  .ui-rins__track { grid-column: 1 / -1; grid-row: 2; }
  .ui-rins__call-status { grid-column: 1 / -1; }
}
@media (forced-colors: active) {
  .ui-rins__bar { background: CanvasText; }
  .ui-rins__call[aria-expanded="true"] { outline: 1px solid Highlight; }
}
`;
}

if (!customElements.get("tc-run-inspector")) customElements.define("tc-run-inspector", TcRunInspector);

declare global {
  interface HTMLElementTagNameMap {
    "tc-run-inspector": TcRunInspector;
  }
}
