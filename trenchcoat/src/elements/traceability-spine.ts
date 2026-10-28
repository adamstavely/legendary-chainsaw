import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";

/*
 * <tc-traceability-spine> – the chain from open questions to outcomes: one column per stage (by default Question →
 * Gap → Work → Paper → Cited by), a card per item with its kind, status and details, and lines joining linked cards.
 * Picking a card traces its whole path – everything upstream it answers to and everything downstream that builds on
 * it – lighting that path and dimming the rest.
 *   · cards are one tab stop: ↑ / ↓ move within a column, ← / → to the nearest card in the next column, Home / End
 *     to a column's ends; Enter or Space traces the card (again clears), Escape clears
 *   · lines are an SVG layer measured from the cards, redrawn when the board resizes
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-traceability-spine .nodes=${[{ id: "q1", stage: "question", title: "…", links: ["g1"] }, …]}></tc-traceability-spine>
 */

/** A route: Lucide (ISC, lucide.dev) */
const spineIcon = svg`<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>`;

export type SpineTone = "neutral" | "info" | "success" | "warning" | "danger";
export type SpineStage = {
  id: string;
  label: string;
  /** What one and several items are called in the announcement, e.g. ["work item", "work items"] */
  noun?: [string, string];
  /** Items in the stage that aren't shown, as a "+N more" footer */
  more?: number;
};
export type SpineNode = {
  id: string;
  /** The stage's id */
  stage: string;
  title: string;
  /** The small label over the title; by default the stage's noun, e.g. "Gap" */
  kind?: string;
  /** A short status pill: "Open", "Critical", "Blocked" */
  status?: string;
  tone?: SpineTone;
  /** A second, warning pill, e.g. "Uncovered" */
  flag?: string;
  /** One quiet line: a venue, "IEEE TNNLS · 2026 · MIT Lincoln Lab", metrics */
  meta?: string;
  /** Progress from 0 to 1, drawn as a bar */
  progress?: number;
  /** People's names, shown as initials */
  people?: string[];
  /** Ids of the nodes this one leads to or answers to, in any stage */
  links?: string[];
};

/** Details of the events */
export type SpineSelectedChange = { selected: string | null; path: string[] };
export type SpineAction = { action: "more"; stage: string };

export const defaultSpineStages: SpineStage[] = [
  { id: "question", label: "Questions", noun: ["question", "questions"] },
  { id: "gap", label: "Gaps", noun: ["gap", "gaps"] },
  { id: "work", label: "Work in flight", noun: ["work item", "work items"] },
  { id: "paper", label: "Papers", noun: ["paper", "papers"] },
  { id: "cited", label: "Cited by", noun: ["citing work", "citing works"] },
];

let uidCount = 0;
const KIND: Record<string, string> = { question: "Question", gap: "Gap", work: "Work", paper: "Paper", cited: "Cited by" };

/**
 * The chain from questions to outcomes in stage columns, linked cards joined by lines, and a card's whole path traced
 * on click or Enter.
 * @tag tc-traceability-spine
 * @fires tc-selected-change - A card's path was traced or cleared ({ selected, path }: SpineSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-action - "+N more" was pressed under a stage ({ action: "more", stage }: SpineAction)
 */
export class TcTraceabilitySpine extends TcElement {
  static override ui = "tsp";

  /** The heading */
  @property() accessor heading = "Traceability";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The stages, a column each, left to right */
  @property({ attribute: false }) accessor stages: SpineStage[] = defaultSpineStages;
  /** The items, each in a stage, with the ids it links to */
  @property({ attribute: false }) accessor nodes: SpineNode[] = [];
  /** The card whose path is traced. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;

  @state() private accessor active: string | null = null;
  @state() private accessor lines: { a: string; b: string; d: string }[] = [];
  @state() private accessor box = { w: 0, h: 0 };
  @state() private accessor announce = "";

  private uid = `tc-tsp-${++uidCount}`;
  private observer: ResizeObserver | undefined;
  private frame = 0;

  /* ---------- The model ---------- */

  private stageIndex(id: string) {
    return this.stages.findIndex((s) => s.id === id);
  }
  private get shown() {
    return this.nodes.filter((n) => this.stageIndex(n.stage) >= 0);
  }
  private columns() {
    return this.stages.map((s) => this.shown.filter((n) => n.stage === s.id));
  }
  /** Both ends of every link between shown nodes in different stages, once each */
  private get edges() {
    const ids = new Set(this.shown.map((n) => n.id));
    const seen = new Set<string>();
    const out: [string, string][] = [];
    for (const n of this.shown)
      for (const to of n.links ?? []) {
        if (!ids.has(to) || to === n.id) continue;
        const m = this.shown.find((x) => x.id === to)!;
        if (this.stageIndex(m.stage) === this.stageIndex(n.stage)) continue;
        const [a, b] = this.stageIndex(n.stage) < this.stageIndex(m.stage) ? [n.id, to] : [to, n.id];
        const key = `${a}>${b}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push([a, b]);
        }
      }
    return out;
  }
  /** The node and everything upstream and downstream of it */
  private pathOf(id: string | null): Set<string> {
    const path = new Set<string>();
    if (!id || !this.shown.some((n) => n.id === id)) return path;
    const edges = this.edges;
    const walk = (from: string, down: boolean) => {
      for (const [a, b] of edges) {
        const next = down ? (a === from ? b : null) : b === from ? a : null;
        if (next && !path.has(next)) {
          path.add(next);
          walk(next, down);
        }
      }
    };
    path.add(id);
    walk(id, true);
    walk(id, false);
    return path;
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const path = [...this.pathOf(next)];
    if (!this.emit<SpineSelectedChange>("tc-selected-change", { selected: next, path }, { cancelable: true })) return;
    this.selected = next;
    this.announce = next ? this.describe(path) : "Trace cleared";
  }
  private describe(path: string[]) {
    const parts = this.stages
      .map((s) => {
        const n = path.filter((id) => this.shown.find((x) => x.id === id)?.stage === s.id).length;
        if (!n) return "";
        const [one, many] = s.noun ?? [s.label.toLowerCase(), s.label.toLowerCase()];
        return `${n} ${n === 1 ? one : many}`;
      })
      .filter(Boolean);
    return `Traced ${parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0]}`;
  }

  /* ---------- Keyboard ---------- */

  private card(id: string) {
    return this.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
  }
  private get stop() {
    const all = this.shown;
    if (this.active && all.some((n) => n.id === this.active)) return this.active;
    if (this.selected && all.some((n) => n.id === this.selected)) return this.selected;
    return this.columns().flat()[0]?.id ?? null;
  }
  private focusNode(id: string | undefined) {
    if (!id) return;
    this.active = id;
    void this.updateComplete.then(() => {
      const el = this.card(id);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }
  private onKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-node]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const id = el.dataset.node!;
    const cols = this.columns();
    const c = cols.findIndex((col) => col.some((n) => n.id === id));
    const r = cols[c].findIndex((n) => n.id === id);
    const across = (dir: 1 | -1) => {
      // The nearest card by height in the next column that has cards
      let k = c + dir;
      while (k >= 0 && k < cols.length && !cols[k].length) k += dir;
      if (k < 0 || k >= cols.length) return undefined;
      const mid = (b: DOMRect) => b.top + b.height / 2;
      const y = mid(el.getBoundingClientRect());
      let best = cols[k][0];
      let gap = Infinity;
      for (const n of cols[k]) {
        const box = this.card(n.id)?.getBoundingClientRect();
        const d = box ? Math.abs(mid(box) - y) : Infinity;
        if (d < gap) {
          gap = d;
          best = n;
        }
      }
      return best.id;
    };
    const moves: Record<string, () => string | undefined> = {
      ArrowUp: () => cols[c][Math.max(0, r - 1)].id,
      ArrowDown: () => cols[c][Math.min(cols[c].length - 1, r + 1)].id,
      ArrowLeft: () => across(-1),
      ArrowRight: () => across(1),
      Home: () => cols[c][0].id,
      End: () => cols[c].at(-1)!.id,
    };
    if (moves[e.key]) {
      e.preventDefault();
      this.focusNode(moves[e.key]() ?? id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(this.selected === id ? null : id);
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  /* ---------- The lines ---------- */

  override connectedCallback() {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.schedule());
      void this.updateComplete.then(() => {
        const board = this.querySelector(".ui-tsp__board");
        if (board) this.observer?.observe(board);
      });
    }
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    cancelAnimationFrame(this.frame);
  }
  private schedule() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.measure());
  }
  /** Each link as a curve from the right edge of the earlier card to the left edge of the later one */
  private measure() {
    const board = this.querySelector<HTMLElement>(".ui-tsp__board");
    if (!board) return;
    const origin = board.getBoundingClientRect();
    const lines: { a: string; b: string; d: string }[] = [];
    for (const [a, b] of this.edges) {
      const ra = this.card(a)?.getBoundingClientRect();
      const rb = this.card(b)?.getBoundingClientRect();
      if (!ra || !rb) continue;
      const x1 = ra.right - origin.left;
      const y1 = ra.top + ra.height / 2 - origin.top;
      const x2 = rb.left - origin.left;
      const y2 = rb.top + rb.height / 2 - origin.top;
      const bend = Math.max(12, (x2 - x1) / 2);
      lines.push({ a, b, d: `M${x1.toFixed(1)} ${y1.toFixed(1)}C${(x1 + bend).toFixed(1)} ${y1.toFixed(1)} ${(x2 - bend).toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}` });
    }
    const box = { w: board.scrollWidth, h: board.scrollHeight };
    const same = lines.length === this.lines.length && lines.every((l, i) => l.d === this.lines[i].d && l.a === this.lines[i].a && l.b === this.lines[i].b);
    if (!same) this.lines = lines;
    if (box.w !== this.box.w || box.h !== this.box.h) this.box = box;
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.selected && !this.shown.some((n) => n.id === this.selected)) this.selected = null;
    if (this.active && !this.shown.some((n) => n.id === this.active)) this.active = null;
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("nodes") || changed.has("stages") || changed.has("look")) {
      const board = this.querySelector(".ui-tsp__board");
      if (board && this.observer) {
        this.observer.disconnect();
        this.observer.observe(board);
      }
      this.schedule();
    }
  }

  /* ---------- Rendering ---------- */

  private renderCard(n: SpineNode, path: Set<string>, stop: string | null) {
    const on = path.has(n.id);
    const progress = n.progress === undefined ? undefined : Math.max(0, Math.min(1, n.progress));
    return html`<button
      type="button"
      class="ui-tsp__node"
      data-node=${n.id}
      data-stage=${n.stage}
      data-tone=${n.tone ?? "neutral"}
      ?data-on=${on}
      ?data-dim=${path.size > 0 && !on}
      ?data-selected=${this.selected === n.id}
      tabindex=${stop === n.id ? 0 : -1}
      aria-pressed=${this.selected === n.id ? "true" : "false"}
      aria-describedby=${`${this.uid}-keys`}
      @focus=${() => (this.active = n.id)}
      @click=${() => {
        this.active = n.id;
        this.setSelected(this.selected === n.id ? null : n.id);
      }}
    >
      <span class="ui-tsp__node-top">
        <span class="ui-tsp__kind">${n.kind ?? KIND[n.stage] ?? this.stages.find((s) => s.id === n.stage)?.label}</span>
        ${n.status ? html`<span class="ui-tsp__pill" data-tone=${n.tone ?? "neutral"}>${n.status}</span>` : nothing}
        ${n.flag ? html`<span class="ui-tsp__pill" data-tone="warning">${n.flag}</span>` : nothing}
      </span>
      <span class="ui-tsp__title">${n.title}</span>
      ${n.meta ? html`<span class="ui-tsp__meta">${n.meta}</span>` : nothing}
      ${progress !== undefined || n.people?.length
        ? html`<span class="ui-tsp__foot">
            ${progress !== undefined
              ? html`<span class="ui-tsp__progress"><span class="ui-tsp__pct">${Math.round(progress * 100)}%</span><span class="ui-tsp__bar" aria-hidden="true"><span class="ui-tsp__fill" style=${`inline-size: ${progress * 100}%`}></span></span></span>`
              : nothing}
            ${n.people?.length
              ? html`<span class="ui-tsp__people"><span class="ui-tsp__sr">${n.people.join(", ")}</span>${n.people.map((p) => html`<span class="ui-tsp__avatar" aria-hidden="true">${initials(p)}</span>`)}</span>`
              : nothing}
          </span>`
        : nothing}
    </button>`;
  }

  protected override render() {
    const id = this.uid;
    const cols = this.columns();
    const path = this.pathOf(this.selected);
    const stop = this.stop;
    const empty = !this.shown.length;
    return html`
      <span class="ui-tsp__sr" role="status">${this.announce}</span>
      <span class="ui-tsp__sr" id=${`${id}-keys`}>Enter traces this card's path; arrow keys move between cards</span>
      ${cardHead({ icon: spineIcon, title: this.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-tsp__card">
        ${empty
          ? html`<p class="ui-tsp__empty">Nothing to trace yet.</p>`
          : html`<ol class="ui-tsp__legend" aria-label="Stages">
                ${this.stages.map((s, i) => html`<li class="ui-tsp__legend-item" data-stage=${s.id}><span class="ui-tsp__swatch" aria-hidden="true"></span>${s.label}${i < this.stages.length - 1 ? html`<span class="ui-tsp__arrow" aria-hidden="true">→</span>` : nothing}</li>`)}
              </ol>
              <div class="ui-tsp__scroll">
                <div class="ui-tsp__board" role="group" aria-labelledby=${`${id}-title`} style=${`--tc-tsp-cols: ${this.stages.length}`} ?data-tracing=${path.size > 0} @keydown=${this.onKey}>
                  <svg class="ui-tsp__lines" aria-hidden="true" width=${this.box.w || 1} height=${this.box.h || 1} viewBox=${`0 0 ${this.box.w || 1} ${this.box.h || 1}`}>
                    ${repeat(
                      this.lines,
                      (l) => `${l.a}>${l.b}`,
                      (l) => svg`<path class="ui-tsp__line" d=${l.d} data-from=${l.a} data-to=${l.b} data-on=${ifDefined(path.has(l.a) && path.has(l.b) ? "" : undefined)}></path>`,
                    )}
                  </svg>
                  ${this.stages.map(
                    (s, c) => html`<section class="ui-tsp__col" data-stage=${s.id} aria-labelledby=${`${id}-stage-${c}`}>
                      <h4 class="ui-tsp__stage" id=${`${id}-stage-${c}`}><span>${s.label}</span><span class="ui-tsp__count">${cols[c].length + (s.more ?? 0)}</span></h4>
                      <div class="ui-tsp__list">${repeat(cols[c], (n) => n.id, (n) => this.renderCard(n, path, stop))}</div>
                      ${s.more
                        ? html`<button type="button" class="ui-tsp__more" @click=${() => this.emit<SpineAction>("tc-action", { action: "more", stage: s.id })}>+${s.more} more ${s.noun?.[s.more === 1 ? 0 : 1] ?? s.label.toLowerCase()}</button>`
                        : nothing}
                    </section>`,
                  )}
                </div>
              </div>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tsp"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tsp"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Each stage's colour, on its legend swatch and its cards' edge – override on the element */
[data-ui="tsp"] { --tc-tsp-question: var(--tc-icon-muted); --tc-tsp-gap: var(--tc-chart-1); --tc-tsp-work: var(--tc-tone-violet-solid); --tc-tsp-paper: var(--tc-status-success-solid); --tc-tsp-cited: var(--tc-tone-amber-solid); --tc-tsp-col: 200px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tsp"] { --tc-tsp-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tsp"] { --tc-tsp-bg: var(--tc-surface-raised); }
[data-ui="tsp"] *, [data-ui="tsp"] *::before, [data-ui="tsp"] *::after { box-sizing: border-box; }
:where([data-ui="tsp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="tsp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="tsp"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="tsp"] h4, [data-ui="tsp"] p { margin: 0; }
[data-ui="tsp"] svg { display: block; flex: none; }
.ui-tsp__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-tsp__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The legend of stages ----- */
.ui-tsp__legend { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) 0 !important; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-tsp__legend-item { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-tsp__swatch { display: inline-block; width: 12px; height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-tsp-edge); }
.ui-tsp__arrow { margin-left: var(--tc-space-1); color: var(--tc-text-disabled); }
[data-stage="question"] { --tc-tsp-edge: var(--tc-tsp-question); }
[data-stage="gap"] { --tc-tsp-edge: var(--tc-tsp-gap); }
[data-stage="work"] { --tc-tsp-edge: var(--tc-tsp-work); }
[data-stage="paper"] { --tc-tsp-edge: var(--tc-tsp-paper); }
[data-stage="cited"] { --tc-tsp-edge: var(--tc-tsp-cited); }
/* ----- The board: columns side by side, scrolling sideways when narrow, lines underneath ----- */
.ui-tsp__scroll { overflow-x: auto; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); scrollbar-width: thin; }
.ui-tsp__board { position: relative; display: grid; grid-template-columns: repeat(var(--tc-tsp-cols), minmax(var(--tc-tsp-col), 1fr)); gap: var(--tc-space-6); align-items: start; isolation: isolate; }
.ui-tsp__lines { position: absolute; inset: 0 auto auto 0; z-index: 0; overflow: visible; pointer-events: none; }
.ui-tsp__line { fill: none; stroke: var(--tc-border-default); stroke-width: 1.25px; transition: stroke var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
[data-tracing] .ui-tsp__line { opacity: 0.35; }
[data-tracing] .ui-tsp__line[data-on] { stroke: var(--tc-text-primary); stroke-width: 1.75px; opacity: 1; }
.ui-tsp__col { position: relative; z-index: 1; display: grid; gap: var(--tc-space-2); min-width: 0; }
/* The stage header stays in view while the page scrolls past a long column */
.ui-tsp__stage { position: sticky; top: 0; z-index: 2; display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-1) 0 var(--tc-space-1-5) !important; border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-tsp-bg); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-tsp__count { font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-tsp__list { display: grid; gap: var(--tc-space-2); }
/* A card: its stage's colour down the left edge */
.ui-tsp__node { position: relative; display: grid; gap: var(--tc-space-1); width: 100%; padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-3-5) !important; overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-tsp-bg) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tsp__node::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--tc-tsp-edge); }
.ui-tsp__node:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
/* Off the traced path: quieter, but the text keeps its contrast */
.ui-tsp__node[data-dim] { background: var(--tc-surface-sunken) !important; box-shadow: none; }
.ui-tsp__node[data-dim]::before { opacity: 0.3; }
.ui-tsp__node[data-dim] .ui-tsp__title { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-tsp__node[data-dim] .ui-tsp__pill { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-tsp__node[data-dim] .ui-tsp__avatar { box-shadow: 0 0 0 1.5px var(--tc-surface-sunken); }
.ui-tsp__node[data-on] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong), var(--tc-shadow-raised); }
.ui-tsp__node[data-selected] { box-shadow: inset 0 0 0 1.5px var(--tc-border-selected), var(--tc-shadow-raised); }
.ui-tsp__node-top { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-tsp__kind { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-tsp__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-tsp__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-tsp__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-tsp__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-tsp__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-tsp__title { display: block; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-tsp__meta { display: block; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-tsp__foot { display: flex; align-items: center; gap: var(--tc-space-2); margin-top: var(--tc-space-0-5); }
.ui-tsp__progress { display: flex; flex: 1; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-tsp__pct { font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-tsp__bar { display: block; flex: 1; height: 3px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-tsp__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); }
.ui-tsp__node[data-tone="danger"] .ui-tsp__fill { background: var(--tc-status-danger-solid); }
.ui-tsp__people { display: inline-flex; flex: none; margin-left: auto; }
.ui-tsp__avatar { display: grid; place-items: center; width: 20px; height: 20px; margin-left: calc(-1 * var(--tc-space-1)); border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); box-shadow: 0 0 0 1.5px var(--tc-tsp-bg); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-avatar-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); }
.ui-tsp__avatar:first-of-type { margin-left: 0; }
.ui-tsp__more { justify-self: start; padding: var(--tc-space-1) var(--tc-space-1-5) !important; margin-left: calc(-1 * var(--tc-space-1-5)) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-tsp__more:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-tsp__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 520px) {
  [data-ui="tsp"] { --tc-tsp-col: 176px; }
  .ui-tsp__scroll { padding-inline: var(--tc-space-3); }
}
@media (forced-colors: active) {
  .ui-tsp__line { stroke: CanvasText; }
  [data-tracing] .ui-tsp__line[data-on] { stroke: Highlight; }
  .ui-tsp__node { border: 1px solid CanvasText; }
  .ui-tsp__node[data-selected] { border: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tsp"] *, [data-ui="tsp"] *::before, [data-ui="tsp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-traceability-spine")) customElements.define("tc-traceability-spine", TcTraceabilitySpine);

declare global {
  interface HTMLElementTagNameMap {
    "tc-traceability-spine": TcTraceabilitySpine;
  }
}
