import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-root-cause-tree> – how an agent finds out why something failed, drawn as a fault tree: the failure at the top,
 * the hypotheses that could explain it underneath, each with the evidence it was checked against. As the agent works
 * the page updates the hypotheses' status – not checked, checking, ruled out, confirmed. Ruled-out branches go quiet;
 * once a hypothesis is confirmed, the way from it up to the failure lights up, drawn from the cause upwards.
 *   · a branch whose children combine says how – OR (any one of them could cause it) or AND (only all of them together)
 *   · the header sums it up in words: "5 hypotheses · 2 ruled out", and "Cause found" once one is confirmed
 *   · the nodes are one tree (one tab stop): ↑ / ↓ walk it in reading order, → goes to the first child, ← to the
 *     parent, Home / End to the ends; Enter or Space opens a node's evidence and notes below, Escape closes them
 *   · the drawing keeps its size; in a narrow container it scrolls sideways rather than squeezing the nodes
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-root-cause-tree .failure=${{ title: "Nightly import failed", ref: "import.log" }} .hypotheses=${[…]}></tc-root-cause-tree>
 */

/** A branching search: Lucide's "git-fork" (ISC, lucide.dev) */
const treeIcon = svg`<circle cx="12" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"></path><path d="M12 12v3"></path>`;
/** Status marks: Lucide's circle, loader-circle, circle-x and circle-check (ISC, lucide.dev) */
const MARK: Record<RootCauseStatus | "failure", ReturnType<typeof svg>> = {
  unchecked: svg`<circle cx="12" cy="12" r="9"></circle>`,
  checking: svg`<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>`,
  "ruled-out": svg`<circle cx="12" cy="12" r="9"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`,
  confirmed: svg`<circle cx="12" cy="12" r="9"></circle><path d="m9 12 2 2 4-4"></path>`,
  failure: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
};

export type RootCauseStatus = "unchecked" | "checking" | "ruled-out" | "confirmed";
export type RootCauseGate = "and" | "or";

export type RootCauseFailure = {
  /** Its id for `selected` – "failure" by default */
  id?: string;
  /** What failed, e.g. "Nightly survey import failed" */
  title: string;
  /** Where it shows, e.g. "import.log" */
  ref?: string;
  /** One short line, e.g. "4 of 12 batches failed" */
  detail?: string;
  /** Its status word while no cause is confirmed – "Failed" by default */
  status?: string;
};

export type RootCauseHypothesis = {
  id: string;
  /** The suspected cause, short: "Station codes are stale" */
  title: string;
  /** The evidence it's checked against – a file, a log, a table */
  ref?: string;
  status?: RootCauseStatus;
  /** What the agent found, shown when the node is opened */
  note?: string;
  /** How the children combine: "or" – any one could cause it; "and" – only all of them together */
  gate?: RootCauseGate;
  /** Narrower hypotheses under this one */
  children?: RootCauseHypothesis[];
};

/** Details of the events */
export type RootCauseSelectedChange = { selected: string | null; node: RootCauseHypothesis | RootCauseFailure | null };

export const defaultRootCauseLabels: Record<RootCauseStatus, string> = {
  unchecked: "Not checked",
  checking: "Checking",
  "ruled-out": "Ruled out",
  confirmed: "Confirmed",
};

/* The drawing's grid – a node's box, the gaps between them and the margin, in px */
const NODE_W = 184;
const NODE_H = 96;
const GAP_X = 16;
const GAP_Y = 48;
const PAD = 4;

type Item = {
  id: string;
  title: string;
  ref?: string;
  status: RootCauseStatus | "failure";
  note?: string;
  gate?: RootCauseGate;
  parent: string | null;
  kids: string[];
  depth: number;
  /** Position among its siblings, from 1, and how many there are */
  pos: number;
  size: number;
  x: number;
  y: number;
  source: RootCauseHypothesis | RootCauseFailure;
};

let uidCount = 0;

/**
 * A fault tree of what an agent suspects caused a failure – hypotheses ruled out one by one, and the way from the
 * confirmed cause up to the failure lit.
 * @tag tc-root-cause-tree
 * @fires tc-selected-change - A node was opened or closed ({ selected, node }: RootCauseSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcRootCauseTree extends TcElement {
  static override ui = "rct";

  /** The heading */
  @property() accessor heading = "Root cause";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** What failed – the top of the tree */
  @property({ attribute: false }) accessor failure: RootCauseFailure | null = null;
  /** The hypotheses directly under the failure, with narrower ones nested in `children` */
  @property({ attribute: false }) accessor hypotheses: RootCauseHypothesis[] = [];
  /** How the top hypotheses combine – "or" by default */
  @property() accessor gate: RootCauseGate = "or";
  /** The node whose evidence is open. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;
  /** The status words, merged over defaultRootCauseLabels */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<RootCauseStatus, string>> = {};

  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-rct-${++uidCount}`;

  /* ---------- The model ---------- */

  private get rootId() {
    return this.failure?.id ?? "failure";
  }
  private label(s: RootCauseStatus) {
    return this.statusLabels[s] ?? defaultRootCauseLabels[s];
  }
  /** Every node in reading order, placed: leaves side by side, each parent centred over its children */
  private layout(): { items: Item[]; byId: Map<string, Item>; w: number; h: number } {
    const items: Item[] = [];
    const byId = new Map<string, Item>();
    if (!this.failure) return { items, byId, w: 0, h: 0 };
    let slot = 0;
    let depthMax = 0;
    const visit = (
      src: RootCauseHypothesis | RootCauseFailure,
      id: string,
      kids: RootCauseHypothesis[],
      parent: string | null,
      depth: number,
      pos: number,
      size: number,
      gate: RootCauseGate | undefined,
    ): Item => {
      const isRoot = parent === null;
      const h = src as RootCauseHypothesis;
      const item: Item = {
        id,
        title: src.title,
        ref: src.ref,
        status: isRoot ? "failure" : (h.status ?? "unchecked"),
        note: isRoot ? (src as RootCauseFailure).detail : h.note,
        gate: kids.length > 1 ? gate : undefined,
        parent,
        kids: [],
        depth,
        pos,
        size,
        x: 0,
        y: PAD + depth * (NODE_H + GAP_Y),
        source: src,
      };
      items.push(item);
      byId.set(id, item);
      depthMax = Math.max(depthMax, depth);
      const placed = kids.map((k, i) => visit(k, k.id, k.children ?? [], id, depth + 1, i + 1, kids.length, k.gate ?? "or"));
      item.kids = placed.map((k) => k.id);
      if (placed.length) item.x = (placed[0].x + placed.at(-1)!.x) / 2;
      else item.x = PAD + slot++ * (NODE_W + GAP_X);
      return item;
    };
    visit(this.failure, this.rootId, this.hypotheses, null, 0, 1, 1, this.gate);
    return { items, byId, w: PAD * 2 + Math.max(1, slot) * (NODE_W + GAP_X) - GAP_X, h: PAD * 2 + (depthMax + 1) * NODE_H + depthMax * GAP_Y };
  }
  /** The confirmed hypotheses and everything above them, up to the failure */
  private litSet(byId: Map<string, Item>) {
    const lit = new Set<string>();
    for (const it of byId.values()) {
      if (it.status !== "confirmed") continue;
      for (let at: Item | undefined = it; at && !lit.has(at.id); at = at.parent ? byId.get(at.parent) : undefined) lit.add(at.id);
    }
    return lit;
  }
  /** Ruled-out hypotheses and everything under them */
  private mutedSet(items: Item[]) {
    const muted = new Set<string>();
    for (const it of items) if (it.status === "ruled-out" || (it.parent && muted.has(it.parent))) muted.add(it.id);
    return muted;
  }
  private counts(items: Item[]) {
    const hyps = items.filter((i) => i.status !== "failure");
    return {
      total: hyps.length,
      ruledOut: hyps.filter((i) => i.status === "ruled-out").length,
      checking: hyps.filter((i) => i.status === "checking").length,
      confirmed: hyps.filter((i) => i.status === "confirmed"),
    };
  }
  private gateWords(it: Item) {
    if (!it.gate) return "";
    return it.gate === "and" ? `Only all ${it.kids.length} below together could cause this` : `Any one of the ${it.kids.length} below could cause this`;
  }

  private setSelected(next: string | null, byId: Map<string, Item>) {
    if (next === this.selected) return;
    const node = next ? (byId.get(next)?.source ?? null) : null;
    if (!this.emit<RootCauseSelectedChange>("tc-selected-change", { selected: next, node }, { cancelable: true })) return;
    this.selected = next;
    const it = next ? byId.get(next) : undefined;
    this.announce = it ? `Opened ${it.title}` : "Closed";
  }

  /* ---------- Keyboard ---------- */

  private node(id: string) {
    return this.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
  }
  private focusNode(id: string | undefined) {
    if (!id) return;
    this.active = id;
    void this.updateComplete.then(() => {
      const el = this.node(id);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }
  private onKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-node]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const { items, byId } = this.layout();
    const id = el.dataset.node!;
    const i = items.findIndex((it) => it.id === id);
    const it = items[i];
    const moves: Record<string, () => string | undefined> = {
      ArrowUp: () => items[Math.max(0, i - 1)].id,
      ArrowDown: () => items[Math.min(items.length - 1, i + 1)].id,
      ArrowRight: () => it.kids[0],
      ArrowLeft: () => it.parent ?? undefined,
      Home: () => items[0].id,
      End: () => items.at(-1)!.id,
    };
    if (moves[e.key]) {
      e.preventDefault();
      this.focusNode(moves[e.key]() ?? id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(this.selected === id ? null : id, byId);
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null, byId);
    }
  };

  /* ---------- Updates ---------- */

  private lastFound = "";
  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("failure") || changed.has("hypotheses")) {
      const { items, byId } = this.layout();
      if (this.selected && !byId.has(this.selected)) this.selected = null;
      if (this.active && !byId.has(this.active)) this.active = null;
      // Say so when a cause is newly confirmed
      const found = this.counts(items).confirmed.map((c) => c.title).join(", ");
      if (found && found !== this.lastFound && changed.get("hypotheses") !== undefined) this.announce = `Cause found: ${found}`;
      this.lastFound = found;
    }
  }

  // A board wider than the card starts scrolled to the failure, so the top of the tree is in view
  private centredOn = "";
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const scroll = this.querySelector<HTMLElement>(".ui-rct__scroll");
    const root = this.node(this.rootId);
    if (!scroll || !root || this.centredOn === this.rootId || !scroll.clientWidth) return;
    this.centredOn = this.rootId;
    if (scroll.scrollWidth <= scroll.clientWidth) return;
    const r = root.getBoundingClientRect();
    const s = scroll.getBoundingClientRect();
    scroll.scrollLeft += r.left + r.width / 2 - (s.left + s.width / 2);
  }

  /* ---------- Rendering ---------- */

  private renderNode(it: Item, stop: string | null, lit: Set<string>, muted: Set<string>) {
    const isRoot = it.status === "failure";
    const found = isRoot && lit.has(it.id);
    const word = isRoot ? (found ? "Cause found" : (this.failure?.status ?? "Failed")) : this.label(it.status as RootCauseStatus);
    const open = this.selected === it.id;
    return html`<div
      class="ui-rct__node"
      role="treeitem"
      data-node=${it.id}
      data-status=${it.status}
      ?data-lit=${lit.has(it.id)}
      ?data-muted=${muted.has(it.id)}
      ?data-selected=${open}
      aria-level=${it.depth + 1}
      aria-setsize=${it.size}
      aria-posinset=${it.pos}
      aria-selected=${open ? "true" : "false"}
      tabindex=${stop === it.id ? 0 : -1}
      style=${`left: ${it.x}px; top: ${it.y}px; width: ${NODE_W}px; height: ${NODE_H}px`}
      @focus=${() => (this.active = it.id)}
      @click=${() => {
        this.active = it.id;
        this.setSelected(open ? null : it.id, this.layout().byId);
      }}
    >
      <span class="ui-rct__status"
        ><svg class="ui-rct__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MARK[it.status]}</svg
        ><span class="ui-rct__word">${word}</span>${!isRoot && it.kids.length ? html`<span class="ui-rct__sr">, ${this.gateWords(it) || `${it.kids.length} narrower below`}</span>` : nothing}</span
      >
      <span class="ui-rct__title">${it.title}</span>
      ${it.ref || (isRoot && this.failure?.detail)
        ? html`<span class="ui-rct__foot">${it.ref ? html`<span class="ui-rct__ref">${it.ref}</span>` : nothing}${isRoot && this.failure?.detail ? html`<span class="ui-rct__detail">${this.failure.detail}</span>` : nothing}</span>`
        : nothing}
    </div>`;
  }

  private renderDetail(it: Item) {
    const isRoot = it.status === "failure";
    const word = isRoot ? (this.counts(this.layout().items).confirmed.length ? "Cause found" : (this.failure?.status ?? "Failed")) : this.label(it.status as RootCauseStatus);
    const id = `${this.uid}-detail`;
    const confirmed = isRoot ? this.counts(this.layout().items).confirmed : [];
    return html`<section class="ui-rct__panel" id=${id} aria-labelledby=${`${id}-title`}>
      <div class="ui-rct__panel-head">
        <span class="ui-rct__pill" data-status=${it.status}>${word}</span>
        <h4 class="ui-rct__panel-title" id=${`${id}-title`}>${it.title}</h4>
        <button
          type="button"
          class="ui-rct__close"
          @click=${() => {
            const back = it.id;
            this.setSelected(null, this.layout().byId);
            this.focusNode(back);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg><span class="ui-rct__sr">Close</span>
        </button>
      </div>
      <dl class="ui-rct__facts">
        ${it.ref ? html`<div><dt>${isRoot ? "Seen in" : "Evidence"}</dt><dd><code class="ui-rct__code">${it.ref}</code></dd></div>` : nothing}
        ${it.note ? html`<div><dt>${isRoot ? "Detail" : "Finding"}</dt><dd>${it.note}</dd></div>` : nothing}
        ${it.gate ? html`<div><dt>Below</dt><dd>${this.gateWords(it)}</dd></div>` : nothing}
        ${confirmed.length ? html`<div><dt>Cause</dt><dd>${confirmed.map((c) => c.title).join("; ")}</dd></div>` : nothing}
        ${!it.ref && !it.note && !it.gate && !confirmed.length ? html`<div><dt>Finding</dt><dd>Nothing recorded yet.</dd></div>` : nothing}
      </dl>
    </section>`;
  }

  protected override render() {
    const id = this.uid;
    const { items, byId, w, h } = this.layout();
    const lit = this.litSet(byId);
    const muted = this.mutedSet(items);
    const c = this.counts(items);
    const stop = this.active && byId.has(this.active) ? this.active : this.selected && byId.has(this.selected) ? this.selected : (items[0]?.id ?? null);
    const open = this.selected ? byId.get(this.selected) : undefined;
    const deepest = Math.max(0, ...items.map((i) => i.depth));
    const state = c.confirmed.length ? "found" : c.checking ? "checking" : "open";
    const aside = items.length
      ? html`<span class="ui-rct__summary"
          ><span class="ui-rct__count">${c.total} ${c.total === 1 ? "hypothesis" : "hypotheses"} · ${c.ruledOut} ruled out</span
          ><span class="ui-rct__pill" data-status=${state === "found" ? "confirmed" : state === "checking" ? "checking" : "unchecked"}>${state === "found" ? "Cause found" : state === "checking" ? "Investigating" : "Not started"}</span></span
        >`
      : nothing;
    return html`
      <span class="ui-rct__sr" role="status">${this.announce}</span>
      <span class="ui-rct__sr" id=${`${id}-keys`}>Arrow keys move through the tree; Enter opens a node's evidence</span>
      ${cardHead({ icon: treeIcon, title: this.heading, subtitle: this.description, id: `${id}-title`, aside })}
      <div class="ui-rct__card">
        ${!items.length
          ? html`<p class="ui-rct__empty">No failure to investigate.</p>`
          : html`<div class="ui-rct__scroll">
                <div
                  class="ui-rct__board"
                  role="tree"
                  aria-labelledby=${`${id}-title`}
                  aria-describedby=${`${id}-keys`}
                  style=${`width: ${w}px; height: ${h}px`}
                  @keydown=${this.onKey}
                >
                  <svg class="ui-rct__lines" aria-hidden="true" width=${w} height=${h} viewBox=${`0 0 ${w} ${h}`}>
                    ${repeat(
                      items.filter((it) => it.parent),
                      (it) => it.id,
                      (it) => {
                        const p = byId.get(it.parent!)!;
                        const px = p.x + NODE_W / 2;
                        const jy = p.y + NODE_H + GAP_Y / 2;
                        const cx = it.x + NODE_W / 2;
                        return svg`<path class="ui-rct__line" data-to=${it.id} ?data-muted=${muted.has(it.id)} d=${`M${px} ${p.y + NODE_H}V${jy}H${cx}V${it.y}`}></path>`;
                      },
                    )}
                    ${repeat(
                      items.filter((it) => it.parent && lit.has(it.id)),
                      (it) => `glow-${it.id}`,
                      (it) => {
                        const p = byId.get(it.parent!)!;
                        const px = p.x + NODE_W / 2;
                        const jy = p.y + NODE_H + GAP_Y / 2;
                        const cx = it.x + NODE_W / 2;
                        return svg`<path class="ui-rct__glow" data-to=${it.id} pathLength="1" style=${`--i: ${deepest - it.depth}`} d=${`M${cx} ${it.y}V${jy}H${px}V${p.y + NODE_H}`}></path>`;
                      },
                    )}
                  </svg>
                  ${items
                    .filter((it) => it.gate)
                    .map((it) => html`<span class="ui-rct__gate" data-gate=${it.gate!} aria-hidden="true" style=${`left: ${it.x + NODE_W / 2}px; top: ${it.y + NODE_H + GAP_Y / 2}px`}>${it.gate === "and" ? "AND" : "OR"}</span>`)}
                  ${repeat(items, (it) => it.id, (it) => this.renderNode(it, stop, lit, muted))}
                </div>
              </div>
              ${open ? this.renderDetail(open) : nothing}`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rct"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rct"] {
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
/* The colour of the way from the cause to the failure, and how long each link of it takes to draw – override on the element */
[data-ui="rct"] { --tc-rct-path: var(--tc-status-danger-solid); --tc-rct-draw: var(--tc-duration-slow); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rct"] { --tc-rct-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rct"] { --tc-rct-bg: var(--tc-surface-raised); }
[data-ui="rct"] *, [data-ui="rct"] *::before, [data-ui="rct"] *::after { box-sizing: border-box; }
:where([data-ui="rct"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rct"] :is(button, [role="treeitem"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rct"] :is(h4, p, dl, dd) { margin: 0; }
[data-ui="rct"] svg { display: block; flex: none; }
.ui-rct__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rct__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's summary ----- */
.ui-rct__summary { display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); }
.ui-rct__count { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rct__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-rct__pill[data-status="checking"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-rct__pill:is([data-status="confirmed"], [data-status="failure"]) { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* ----- The drawing: a fixed-size board that scrolls sideways when the card is narrower ----- */
.ui-rct__scroll { overflow-x: auto; padding: var(--tc-space-4); scrollbar-width: thin; }
.ui-rct__board { position: relative; margin-inline: auto; isolation: isolate; }
.ui-rct__lines { position: absolute; inset: 0 auto auto 0; z-index: 0; overflow: visible; pointer-events: none; }
.ui-rct__line { fill: none; stroke: var(--tc-border-strong); stroke-width: 1.25px; transition: stroke var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rct__line[data-muted] { stroke: var(--tc-border-subtle); stroke-dasharray: 3 3; }
/* The lit way up: drawn from the cause towards the failure, the deepest link first */
.ui-rct__glow { fill: none; stroke: var(--tc-rct-path); stroke-width: 2px; stroke-dasharray: 1; stroke-dashoffset: 0; animation: tc-rct-draw var(--tc-rct-draw) var(--tc-ease-out) both; animation-delay: calc(var(--i, 0) * var(--tc-rct-draw)); }
@keyframes tc-rct-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
/* AND / OR where a branch splits, on a chip of the card's colour */
.ui-rct__gate { position: absolute; z-index: 1; transform: translate(-50%, -50%); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-rct-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); letter-spacing: var(--tc-tracking-caps); color: var(--tc-text-muted); }
/* ----- A node ----- */
.ui-rct__node { position: absolute; z-index: 2; display: grid; grid-template-rows: auto 1fr auto; gap: var(--tc-space-1); padding: var(--tc-space-2-5) var(--tc-space-3); overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-rct-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); cursor: pointer; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rct__node:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-rct__status { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-rct__mark { width: 14px; height: 14px; color: var(--tc-icon-muted); }
.ui-rct__title { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-rct__foot { display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-rct__ref { overflow: hidden; font-family: var(--tc-font-mono); text-overflow: ellipsis; white-space: nowrap; }
.ui-rct__detail { margin-left: auto; white-space: nowrap; }
/* The failure */
.ui-rct__node[data-status="failure"] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); }
.ui-rct__node[data-status="failure"] :is(.ui-rct__status, .ui-rct__mark) { color: var(--tc-status-danger-fg); }
/* Checking: the mark turns */
.ui-rct__node[data-status="checking"] :is(.ui-rct__status, .ui-rct__mark) { color: var(--tc-status-info-fg); }
.ui-rct__node[data-status="checking"] .ui-rct__mark { animation: tc-rct-spin var(--tc-duration-shimmer) linear infinite; }
@keyframes tc-rct-spin { to { transform: rotate(1turn); } }
/* Ruled out, and everything under it: quieter, with colours that keep their contrast */
.ui-rct__node[data-muted] { background: var(--tc-surface-sunken); box-shadow: none; }
.ui-rct__node[data-muted] .ui-rct__title { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); text-decoration: line-through; text-decoration-color: var(--tc-border-strong); }
/* Confirmed, and the way up from it */
.ui-rct__node[data-status="confirmed"] { box-shadow: inset 0 0 0 1.5px var(--tc-rct-path), var(--tc-shadow-raised); }
.ui-rct__node[data-status="confirmed"] :is(.ui-rct__status, .ui-rct__mark) { color: var(--tc-status-danger-fg); }
.ui-rct__node[data-lit]:not([data-status="confirmed"]) { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-rct-path), var(--tc-shadow-raised); }
.ui-rct__node[data-selected] { box-shadow: inset 0 0 0 1.5px var(--tc-border-selected), var(--tc-shadow-raised); }
/* ----- The open node's evidence ----- */
.ui-rct__panel { display: grid; gap: var(--tc-space-2); margin: 0 var(--tc-space-4) var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-4); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
.ui-rct__panel-head { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-rct__panel-title { flex: 1; min-width: 0; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-rct__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rct__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rct__close svg { width: 16px; height: 16px; }
.ui-rct__facts { display: grid; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }
.ui-rct__facts > div { display: grid; grid-template-columns: 6rem 1fr; gap: var(--tc-space-3); }
.ui-rct__facts dt { color: var(--tc-text-muted); }
.ui-rct__facts dd { color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-rct__code { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-rct__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 520px) {
  .ui-rct__scroll { padding-inline: var(--tc-space-3); }
  .ui-rct__panel { margin-inline: var(--tc-space-3); }
  .ui-rct__facts > div { grid-template-columns: 1fr; gap: 0; }
}
@media (forced-colors: active) {
  .ui-rct__line { stroke: CanvasText; }
  .ui-rct__glow { stroke: Highlight; }
  .ui-rct__node { border: 1px solid CanvasText; }
  .ui-rct__node[data-lit] { border: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rct"] *, [data-ui="rct"] *::before, [data-ui="rct"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-root-cause-tree")) customElements.define("tc-root-cause-tree", TcRootCauseTree);

declare global {
  interface HTMLElementTagNameMap {
    "tc-root-cause-tree": TcRootCauseTree;
  }
}
