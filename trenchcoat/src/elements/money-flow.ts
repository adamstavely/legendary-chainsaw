import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate, pick } from "./internal/util";

/*
 * <tc-money-flow> – how money moved between entities: a left-to-right flow with the entities as cards in columns
 * (by `column`, or worked out from who paid whom) and every transfer as a band whose width follows its amount (compared
 * within its currency – amounts in different currencies are never added or compared),
 * labelled with the amount and an optional flag chip ("Layering", "Cash-in", "Courier fee"). Pointing at or focusing
 * an entity lights up the transfers in and out of it; pointing at a transfer lights up it and its two ends, and a
 * readout says it in full: "Meridian SARL → Helios Holdings (CY) · €240,000 · 15 May · Layering". Click or Enter
 * selects an entity or a transfer (cancelable tc-selected-change); Escape clears it.
 *   · the entities are one tab stop: ← / → move to the nearest entity in the column before or after, ↑ / ↓ within a
 *     column, Home / End to the first and last; the transfers are a second tab stop – a list under the flow, ↑ / ↓
 *   · "Show as table" swaps the drawing for a table of every transfer, the same facts in rows
 *   · the layout is recomputed when the element's width changes (ResizeObserver, batched to a frame)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-money-flow .nodes=${[{ id: "a", label: "Meridian SARL", kind: "company" }, { id: "b", label: "Helios", kind: "shell" }]}
 *     .transfers=${[{ id: "t1", from: "a", to: "b", amount: 240000, flag: "Layering" }]}></tc-money-flow>
 */

/** Arrows between boxes: Lucide workflow (ISC, lucide.dev) */
const flowIcon = svg`<rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect>`;

export type FlowNodeKind = "person" | "company" | "shell" | "bank" | "unknown";
export type FlowNode = {
  id: string;
  /** The entity's name: "Meridian Logistics SARL" */
  label: string;
  /** What it is – shown as an icon and a word */
  kind?: FlowNodeKind;
  /** One quiet line under the kind, e.g. a country: "Cyprus" */
  detail?: string;
  /** Its column, from 0 at the left; worked out from the transfers when not given */
  column?: number;
};
export type FlowTransfer = {
  id: string;
  /** The paying entity's id */
  from: string;
  /** The receiving entity's id */
  to: string;
  amount: number;
  /** Its currency; by default the element's `currency` */
  currency?: string;
  /** When it was made, as epoch ms */
  date?: number;
  /** A short flag shown as a chip: "Layering", "Cash-in" */
  flag?: string;
};
/** An entity or a transfer */
export type FlowRef = { kind: "node" | "transfer"; id: string };

/** Details of the events */
export type FlowSelectedChange = { selected: FlowRef | null; node?: FlowNode; transfer?: FlowTransfer };

/** The kinds' names used when the page gives none */
export const defaultFlowKindLabels: Record<FlowNodeKind, string> = { person: "Person", company: "Company", shell: "Shell entity", bank: "Bank", unknown: "Unknown" };

let uidCount = 0;

/* user, building-2, package, landmark, circle-help: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const KIND_ICON: Record<FlowNodeKind, () => ReturnType<typeof lucide>> = {
  person: () => lucide(14, svg`<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`),
  company: () => lucide(14, svg`<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path>`),
  shell: () => lucide(14, svg`<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 8.7 5 8.7-5"></path>`),
  bank: () => lucide(14, svg`<path d="M3 22h18"></path><path d="M6 18v-7"></path><path d="M10 18v-7"></path><path d="M14 18v-7"></path><path d="M18 18v-7"></path><path d="M12 2 20 7H4z"></path>`),
  unknown: () => lucide(14, svg`<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>`),
};

/* The drawing's geometry, in px */
const NODE_H = 52;
const ROW_GAP = 36;
const PAD_Y = 14;
const MIN_W = 360;
/** The narrowest an entity card gets, and the narrowest gap between columns – wide enough for "€240K Layering" */
const NODE_MIN = 140;
const GAP_MIN = 132;
/** A label's height, for keeping labels in one gap apart */
const LABEL_H = 24;

/**
 * How money moved between entities – a left-to-right flow of entities in columns and transfers as bands sized by
 * amount, each labelled with its amount and an optional flag, an entity's or a transfer's flows lit on hover or focus,
 * a readout in words, and a table of every transfer.
 * @tag tc-money-flow
 * @fires tc-selected-change - An entity or a transfer was selected or cleared ({ selected, node, transfer }: FlowSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcMoneyFlow extends TcElement {
  static override ui = "mfl";

  /** The heading */
  @property() accessor heading = "Money flow";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The entities */
  @property({ attribute: false }) accessor nodes: FlowNode[] = [];
  /** The transfers between them */
  @property({ attribute: false }) accessor transfers: FlowTransfer[] = [];
  /** The currency for transfers that don't name their own, e.g. "EUR" */
  @property() accessor currency = "EUR";
  /** The kinds' names, merged over the defaults (Person, Company, Shell entity, Bank, Unknown) */
  @property({ attribute: false }) accessor kindLabels: Partial<Record<FlowNodeKind, string>> = {};
  /** The selected entity or transfer. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: FlowRef | null = null;
  /** Shows a table of every transfer in place of the drawing */
  @property({ type: Boolean, reflect: true }) accessor table = false;
  /** The language for amounts and dates, e.g. "fr-FR"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The drawing's width, measured; a sensible width until the first measure */
  @state() private accessor width = 640;
  @state() private accessor hot: FlowRef | null = null;
  @state() private accessor activeNode = 0;
  @state() private accessor activeTransfer = 0;
  @state() private accessor announce = "";

  private uid = `tc-mfl-${++uidCount}`;
  private observer: ResizeObserver | undefined;
  private observed: HTMLElement | null = null;
  private frame = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.observer = new ResizeObserver(() => {
      if (this.frame) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        // The room the drawing has – its scrolling box, not the drawing, which can be wider and scroll
        const body = this.querySelector<HTMLElement>(".ui-mfl__body");
        const w = body?.clientWidth ?? 0;
        if (w > 0 && Math.abs(w - this.width) > 0.5) this.width = w;
      });
    });
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    // A new observer watches the body when the element is put back in the page
    this.observed = null;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const body = this.querySelector<HTMLElement>(".ui-mfl__body");
    if (body && this.observer && body !== this.observed) {
      if (this.observed) this.observer.unobserve(this.observed);
      this.observer.observe(body);
      this.observed = body;
    }
  }

  /* ---------- The model ---------- */

  private kindLabel(k: FlowNodeKind) {
    return this.kindLabels[k] ?? defaultFlowKindLabels[k] ?? k;
  }
  private nodeOf(id: string) {
    return this.nodes.find((n) => n.id === id);
  }
  private get liveTransfers() {
    const ids = new Set(this.nodes.map((n) => n.id));
    return this.transfers.filter((t) => ids.has(t.from) && ids.has(t.to) && t.from !== t.to);
  }
  private money(t: { amount: number; currency?: string }, compact = false) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: t.currency ?? this.currency, maximumFractionDigits: compact ? 1 : 0, notation: compact ? "compact" : "standard" }).format(t.amount);
    } catch {
      return new Intl.NumberFormat(this.locale, { notation: compact ? "compact" : "standard" }).format(t.amount);
    }
  }
  private day(ms: number) {
    return formatDate(ms, this.locale, { day: "numeric", month: "short" });
  }
  private sayTransfer(t: FlowTransfer) {
    const from = this.nodeOf(t.from)?.label ?? t.from;
    const to = this.nodeOf(t.to)?.label ?? t.to;
    return [`${from} → ${to}`, this.money(t), t.date !== undefined ? this.day(t.date) : "", t.flag ?? ""].filter(Boolean).join(" · ");
  }
  /** An entity's flows in words: "in €58,000 · out €298,000 · 3 transfers" */
  private flowsOf(n: FlowNode) {
    const ts = this.liveTransfers;
    const outs = ts.filter((t) => t.from === n.id);
    const ins = ts.filter((t) => t.to === n.id);
    const parts: string[] = [];
    if (ins.length) parts.push(`in ${this.total(ins)}`);
    if (outs.length) parts.push(`out ${this.total(outs)}`);
    parts.push(`${ins.length + outs.length} ${ins.length + outs.length === 1 ? "transfer" : "transfers"}`);
    return parts.join(" · ");
  }
  /** Transfers added up per currency – amounts in different currencies are never added: "$100 + ¥10,000" */
  private total(list: FlowTransfer[]) {
    const by = new Map<string, number>();
    for (const t of list) {
      const cur = this.currencyOf(t);
      by.set(cur, (by.get(cur) ?? 0) + t.amount);
    }
    return [...by].map(([currency, amount]) => this.money({ amount, currency })).join(" + ");
  }
  private currencyOf(t: { currency?: string }) {
    return (t.currency ?? this.currency).toUpperCase();
  }
  private sayNode(n: FlowNode) {
    return [n.label, this.kindLabel(n.kind ?? "unknown"), this.flowsOf(n)].join(" · ");
  }

  /** Each entity's column: given, or the longest chain of payers before it */
  private get columns() {
    const col = new Map<string, number>();
    for (const n of this.nodes) col.set(n.id, n.column ?? 0);
    const free = new Set(this.nodes.filter((n) => n.column === undefined).map((n) => n.id));
    const ts = this.liveTransfers;
    // Relax at most once per entity – a cycle can't push columns on for ever
    for (let pass = 0; pass < this.nodes.length; pass++) {
      let moved = false;
      for (const t of ts) {
        if (!free.has(t.to)) continue;
        const want = (col.get(t.from) ?? 0) + 1;
        if (want > (col.get(t.to) ?? 0) && want < this.nodes.length) {
          col.set(t.to, want);
          moved = true;
        }
      }
      if (!moved) break;
    }
    return col;
  }

  /** Where everything sits, for the current width */
  private layout() {
    const col = this.columns;
    const count = Math.max(1, ...[...col.values()].map((c) => c + 1));
    const byCol: FlowNode[][] = Array.from({ length: count }, () => []);
    for (const n of this.nodes) byCol[col.get(n.id) ?? 0].push(n);
    const rows = Math.max(1, ...byCol.map((c) => c.length));
    let height = PAD_Y * 2 + rows * NODE_H + (rows - 1) * ROW_GAP;
    // Too narrow for every column and its labels, the drawing keeps its size and scrolls sideways
    const width = Math.max(MIN_W, this.width, count * NODE_MIN + (count - 1) * GAP_MIN);
    const nodeW = Math.min(184, Math.max(NODE_MIN, (width - (count - 1) * GAP_MIN) / count));
    const span = count > 1 ? (width - nodeW) / (count - 1) : 0;
    const pos = new Map<string, { x: number; y: number; c: number; r: number }>();
    byCol.forEach((list, c) => {
      const block = list.length * NODE_H + (list.length - 1) * ROW_GAP;
      const top = PAD_Y + (height - PAD_Y * 2 - block) / 2;
      list.forEach((n, r) => pos.set(n.id, { x: count > 1 ? c * span : (width - nodeW) / 2, y: top + r * (NODE_H + ROW_GAP), c, r }));
    });
    // Bands leave and arrive spread over the card's height, ordered by where they go, so they don't cross at the card
    const ts = this.liveTransfers;
    // A band's width compares it with the largest transfer in the same currency – never across currencies
    const max = new Map<string, number>();
    for (const t of ts) if (Number.isFinite(t.amount)) max.set(this.currencyOf(t), Math.max(max.get(this.currencyOf(t)) ?? 1, Math.abs(t.amount)));
    const thick = (t: FlowTransfer) => 2 + (Number.isFinite(t.amount) ? Math.abs(t.amount) / (max.get(this.currencyOf(t)) ?? 1) : 0) * 12;
    const ends = new Map<string, { y0: number; y1: number }>();
    const spread = (list: FlowTransfer[], key: "from" | "to", other: "from" | "to") => {
      const sorted = [...list].sort((a, b) => (pos.get(a[other])?.y ?? 0) - (pos.get(b[other])?.y ?? 0));
      const n = sorted.length;
      sorted.forEach((t, i) => {
        const p = pos.get(t[key])!;
        const y = p.y + NODE_H / 2 + (i - (n - 1) / 2) * Math.min(10, (NODE_H - 16) / Math.max(1, n));
        const e = ends.get(t.id) ?? { y0: 0, y1: 0 };
        if (key === "from") e.y0 = y;
        else e.y1 = y;
        ends.set(t.id, e);
      });
    };
    for (const n of this.nodes) {
      spread(ts.filter((t) => t.from === n.id), "from", "to");
      spread(ts.filter((t) => t.to === n.id), "to", "from");
    }
    const bands = ts.map((t) => {
      const a = pos.get(t.from)!;
      const b = pos.get(t.to)!;
      const e = ends.get(t.id)!;
      const forward = b.x > a.x;
      const x0 = forward ? a.x + nodeW : a.x;
      const x1 = forward ? b.x : b.x + nodeW;
      const bend = Math.max(36, Math.abs(x1 - x0) / 2);
      const c0 = forward ? x0 + bend : x0 - bend;
      const c1 = forward ? x1 - bend : x1 + bend;
      const d = `M${x0.toFixed(1)} ${e.y0.toFixed(1)} C${c0.toFixed(1)} ${e.y0.toFixed(1)} ${c1.toFixed(1)} ${e.y1.toFixed(1)} ${x1.toFixed(1)} ${e.y1.toFixed(1)}`;
      // The label sits in the first gap the band crosses: the curve's midpoint between neighbouring columns, or the
      // middle of the first gap when it skips a column, so it never lands on a card
      const skip = Math.abs(b.c - a.c) > 1;
      const mx = skip ? (forward ? x0 + GAP_MIN / 2 : x0 - GAP_MIN / 2) : (x0 + 3 * c0 + 3 * c1 + x1) / 8;
      const my = skip ? e.y0 + (e.y1 - e.y0) * 0.12 : (e.y0 + 3 * e.y0 + 3 * e.y1 + e.y1) / 8;
      return { t, d, mx, my, w: thick(t), gap: forward ? a.c : a.c - 1 };
    });
    // Labels in one gap are kept apart, top to bottom; the drawing grows if the last one needs room
    const byGap = new Map<number, typeof bands>();
    for (const b of bands) byGap.set(b.gap, [...(byGap.get(b.gap) ?? []), b]);
    for (const list of byGap.values()) {
      list.sort((p, q) => p.my - q.my);
      for (let i = 1; i < list.length; i++) if (list[i].my - list[i - 1].my < LABEL_H) list[i].my = list[i - 1].my + LABEL_H;
      height = Math.max(height, list[list.length - 1].my + LABEL_H / 2 + PAD_Y);
    }
    return { width, height, nodeW, pos, bands, count, byCol };
  }

  /* ---------- Highlighting and selection ---------- */

  /** What's lit: the pointer's or focus's entity or transfer, else the selected one */
  private get lit() {
    return this.hot ?? this.selected;
  }
  private linked(ref: FlowRef | null) {
    const nodes = new Set<string>();
    const transfers = new Set<string>();
    if (!ref) return null;
    const ts = this.liveTransfers;
    if (ref.kind === "node") {
      nodes.add(ref.id);
      for (const t of ts)
        if (t.from === ref.id || t.to === ref.id) {
          transfers.add(t.id);
          nodes.add(t.from);
          nodes.add(t.to);
        }
    } else {
      const t = ts.find((x) => x.id === ref.id);
      if (!t) return null;
      transfers.add(t.id);
      nodes.add(t.from);
      nodes.add(t.to);
    }
    return { nodes, transfers };
  }
  private same(a: FlowRef | null, b: FlowRef | null) {
    return a?.kind === b?.kind && a?.id === b?.id;
  }
  private setSelected(next: FlowRef | null) {
    if (this.same(next, this.selected)) return;
    const node = next?.kind === "node" ? this.nodeOf(next.id) : undefined;
    const transfer = next?.kind === "transfer" ? this.liveTransfers.find((t) => t.id === next.id) : undefined;
    if (!this.emit<FlowSelectedChange>("tc-selected-change", { selected: next, node, transfer }, { cancelable: true })) return;
    this.selected = next;
    this.announce = node ? `Selected ${this.sayNode(node)}` : transfer ? `Selected ${this.sayTransfer(transfer)}` : "Selection cleared";
  }
  private toggle(ref: FlowRef) {
    this.setSelected(this.same(ref, this.selected) ? null : ref);
  }

  /* ---------- Keyboard ---------- */

  private focusNode(i: number) {
    if (!this.nodes.length) return;
    this.activeNode = Math.max(0, Math.min(this.nodes.length - 1, i));
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-node="${CSS.escape(this.nodes[this.activeNode].id)}"]`)?.focus());
  }
  private onNodeKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-node]");
    if (!btn || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const id = btn.dataset.node!;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.toggle({ kind: "node", id });
      return;
    }
    if (e.key === "Escape") {
      if (this.selected) {
        e.preventDefault();
        this.setSelected(null);
      }
      return;
    }
    const { pos, byCol } = this.layout();
    const here = pos.get(id);
    if (!here) return;
    const index = (n: FlowNode) => this.nodes.indexOf(n);
    const nearestIn = (c: number) => {
      const list = byCol[c] ?? [];
      if (!list.length) return null;
      return list.reduce((best, n) => (Math.abs(pos.get(n.id)!.y - here.y) < Math.abs(pos.get(best.id)!.y - here.y) ? n : best));
    };
    const step = (dir: 1 | -1) => {
      for (let c = here.c + dir; c >= 0 && c < byCol.length; c += dir) {
        const n = nearestIn(c);
        if (n) return n;
      }
      return null;
    };
    const column = byCol[here.c];
    const moves: Record<string, () => FlowNode | null | undefined> = {
      ArrowRight: () => step(1),
      ArrowLeft: () => step(-1),
      ArrowDown: () => column[here.r + 1],
      ArrowUp: () => column[here.r - 1],
      Home: () => byCol.find((c) => c.length)?.[0],
      End: () => {
        const last = [...byCol].reverse().find((c) => c.length);
        return last?.[last.length - 1];
      },
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const n = move();
    if (n) this.focusNode(index(n));
  };
  private onTransferKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-transfer]");
    if (!btn || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const ts = this.liveTransfers;
    const i = ts.findIndex((t) => t.id === btn.dataset.transfer);
    const moves: Record<string, number> = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: ts.length - 1 };
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (ts[i]) this.toggle({ kind: "transfer", id: ts[i].id });
      return;
    }
    if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
      return;
    }
    if (!(e.key in moves)) return;
    e.preventDefault();
    this.activeTransfer = Math.max(0, Math.min(ts.length - 1, moves[e.key]));
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-transfer="${CSS.escape(ts[this.activeTransfer].id)}"]`)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.activeNode >= this.nodes.length) this.activeNode = Math.max(0, this.nodes.length - 1);
    const ts = this.liveTransfers;
    if (this.activeTransfer >= ts.length) this.activeTransfer = Math.max(0, ts.length - 1);
    // A selection whose entity or transfer went away clears
    const sel = this.selected;
    if (sel && (sel.kind === "node" ? !this.nodeOf(sel.id) : !ts.some((t) => t.id === sel.id))) this.selected = null;
    if (this.hot && (this.hot.kind === "node" ? !this.nodeOf(this.hot.id) : !ts.some((t) => t.id === this.hot!.id))) this.hot = null;
  }

  /* ---------- Rendering ---------- */

  private renderDiagram() {
    const { width, height, nodeW, pos, bands } = this.layout();
    const lit = this.linked(this.lit);
    const sel = this.selected;
    return html`<div class="ui-mfl__stage" style=${`width: ${width}px; height: ${height}px`} @pointerleave=${() => (this.hot = null)}>
      <svg class="ui-mfl__bands" width=${width} height=${height} viewBox=${`0 0 ${width} ${height}`} aria-hidden="true">
        ${repeat(
          bands,
          (b) => b.t.id,
          (b) => svg`<g class="ui-mfl__band" data-band=${b.t.id} ?data-flag=${!!b.t.flag} ?data-on=${!!lit?.transfers.has(b.t.id)} ?data-dim=${!!lit && !lit.transfers.has(b.t.id)} ?data-selected=${sel?.kind === "transfer" && sel.id === b.t.id}>
            <path class="ui-mfl__band-line" d=${b.d} style=${`stroke-width: ${b.w.toFixed(1)}px`}></path>
            <path class="ui-mfl__band-hit" d=${b.d} style=${`stroke-width: ${Math.max(14, b.w + 8).toFixed(1)}px`}
              @pointerenter=${() => (this.hot = { kind: "transfer", id: b.t.id })}
              @click=${() => this.toggle({ kind: "transfer", id: b.t.id })}></path>
          </g>`,
        )}
      </svg>
      ${repeat(
        bands,
        (b) => b.t.id,
        (b) => html`<span class="ui-mfl__label" aria-hidden="true" data-label=${b.t.id} ?data-dim=${!!lit && !lit.transfers.has(b.t.id)} style=${`left: ${b.mx.toFixed(1)}px; top: ${b.my.toFixed(1)}px`}
          ><span class="ui-mfl__label-amount">${this.money(b.t, true)}</span>${b.t.flag ? html`<span class="ui-mfl__flag">${b.t.flag}</span>` : nothing}</span
        >`,
      )}
      <ul class="ui-mfl__nodes" aria-label="Entities" @keydown=${this.onNodeKey}>
        ${repeat(
          this.nodes,
          (n) => n.id,
          (n, i) => {
            const p = pos.get(n.id)!;
            const kind = n.kind ?? "unknown";
            const isSel = sel?.kind === "node" && sel.id === n.id;
            return html`<li class="ui-mfl__node-item" style=${`left: ${p.x.toFixed(1)}px; top: ${p.y.toFixed(1)}px; width: ${nodeW.toFixed(1)}px`}>
              <button
                type="button"
                class="ui-mfl__node"
                data-node=${n.id}
                data-kind=${kind}
                tabindex=${i === this.activeNode ? 0 : -1}
                aria-pressed=${isSel ? "true" : "false"}
                ?data-on=${!!lit?.nodes.has(n.id)}
                ?data-dim=${!!lit && !lit.nodes.has(n.id)}
                @focus=${() => {
                  this.activeNode = i;
                  this.hot = { kind: "node", id: n.id };
                }}
                @blur=${() => {
                  if (this.hot?.kind === "node" && this.hot.id === n.id) this.hot = null;
                }}
                @pointerenter=${() => (this.hot = { kind: "node", id: n.id })}
                @click=${() => this.toggle({ kind: "node", id: n.id })}
              >
                <span class="ui-mfl__node-name">${n.label}</span>
                <span class="ui-mfl__node-kind">${pick(KIND_ICON, kind, "unknown")()}<span>${this.kindLabel(kind)}${n.detail ? ` · ${n.detail}` : ""}</span></span>
                <span class="ui-mfl__sr">, ${this.flowsOf(n)}</span>
              </button>
            </li>`;
          },
        )}
      </ul>
    </div>`;
  }

  private renderTable() {
    const ts = this.liveTransfers;
    return html`<div class="ui-mfl__table-wrap">
      <table class="ui-mfl__table">
        <caption class="ui-mfl__sr">Transfers</caption>
        <thead>
          <tr><th scope="col">From</th><th scope="col">To</th><th scope="col" class="ui-mfl__num">Amount</th><th scope="col">Date</th><th scope="col">Flag</th></tr>
        </thead>
        <tbody>
          ${repeat(
            ts,
            (t) => t.id,
            (t) => html`<tr data-row=${t.id}>
              <td>${this.nodeOf(t.from)?.label}</td>
              <td>${this.nodeOf(t.to)?.label}</td>
              <td class="ui-mfl__num">${this.money(t)}</td>
              <td>${t.date !== undefined ? this.day(t.date) : "–"}</td>
              <td>${t.flag ? html`<span class="ui-mfl__flag">${t.flag}</span>` : "–"}</td>
            </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }

  private renderTransfers() {
    const ts = this.liveTransfers;
    const lit = this.linked(this.lit);
    const sel = this.selected;
    return html`<ul class="ui-mfl__transfers" aria-label="Transfers" @keydown=${this.onTransferKey}>
      ${repeat(
        ts,
        (t) => t.id,
        (t, i) => {
          const isSel = sel?.kind === "transfer" && sel.id === t.id;
          return html`<li>
            <button
              type="button"
              class="ui-mfl__transfer"
              data-transfer=${t.id}
              tabindex=${i === this.activeTransfer ? 0 : -1}
              aria-pressed=${isSel ? "true" : "false"}
              ?data-on=${!!lit?.transfers.has(t.id)}
              @focus=${() => {
                this.activeTransfer = i;
                this.hot = { kind: "transfer", id: t.id };
              }}
              @blur=${() => {
                if (this.hot?.kind === "transfer" && this.hot.id === t.id) this.hot = null;
              }}
              @pointerenter=${() => (this.hot = { kind: "transfer", id: t.id })}
              @pointerleave=${() => {
                if (this.hot?.kind === "transfer" && this.hot.id === t.id) this.hot = null;
              }}
              @click=${() => this.toggle({ kind: "transfer", id: t.id })}
            >
              <span class="ui-mfl__transfer-route">${this.nodeOf(t.from)?.label}<span class="ui-mfl__arrow" aria-hidden="true"> → </span><span class="ui-mfl__sr"> to </span>${this.nodeOf(t.to)?.label}</span>
              <span class="ui-mfl__transfer-amount">${this.money(t)}</span>
              ${t.date !== undefined ? html`<span class="ui-mfl__transfer-date">${this.day(t.date)}</span>` : nothing}
              ${t.flag ? html`<span class="ui-mfl__flag">${t.flag}</span>` : nothing}
            </button>
          </li>`;
        },
      )}
    </ul>`;
  }

  protected override render() {
    const id = this.uid;
    const ts = this.liveTransfers;
    const empty = !this.nodes.length;
    const lit = this.lit;
    const readout = lit
      ? lit.kind === "node"
        ? (() => {
            const n = this.nodeOf(lit.id);
            return n ? this.sayNode(n) : "";
          })()
        : (() => {
            const t = ts.find((x) => x.id === lit.id);
            return t ? this.sayTransfer(t) : "";
          })()
      : "";
    return html`
      <span class="ui-mfl__sr" role="status">${this.announce}</span>
      <span class="ui-mfl__sr" id=${`${id}-keys`}>Arrow keys move between entities; Enter selects one and lights its transfers</span>
      ${cardHead({
        icon: flowIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: empty
          ? nothing
          : html`<span class="ui-mfl__total"><span class="ui-mfl__total-label">${ts.length} ${ts.length === 1 ? "transfer" : "transfers"}</span><span class="ui-mfl__total-value">${this.total(ts)}</span></span>`,
      })}
      <div class="ui-mfl__card">
        ${empty
          ? html`<p class="ui-mfl__empty">No transfers to show yet.</p>`
          : html`<div class="ui-mfl__bar">
                <p class="ui-mfl__readout" aria-hidden="true">${readout || html`<span class="ui-mfl__hint">Point at an entity or a transfer to trace it</span>`}</p>
                <button type="button" class="ui-mfl__toggle" aria-pressed=${this.table ? "true" : "false"} @click=${() => (this.table = !this.table)}>Show as table</button>
              </div>
              <div class="ui-mfl__body" role="group" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`}>${this.table ? this.renderTable() : this.renderDiagram()}</div>
              ${this.table ? nothing : this.renderTransfers()}`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mfl"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mfl"] {
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
/* The bands' ink and the flagged bands' ink – override either on the element */
[data-ui="mfl"] { --tc-mfl-band: var(--tc-chart-1); --tc-mfl-flagged: var(--tc-status-danger-fg); }
[data-ui="mfl"] *, [data-ui="mfl"] *::before, [data-ui="mfl"] *::after { box-sizing: border-box; }
:where([data-ui="mfl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; text-align: inherit; }
[data-ui="mfl"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="mfl"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="mfl"] p { margin: 0; }
[data-ui="mfl"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mfl"] svg[stroke-width] { stroke-width: 1.6; }
.ui-mfl__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-mfl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's total ----- */
.ui-mfl__total { display: grid; flex: none; justify-items: end; }
.ui-mfl__total-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-mfl__total-value { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
/* ----- The readout and the table switch ----- */
.ui-mfl__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-mfl__bar { padding-top: var(--tc-space-1); }
.ui-mfl__readout { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-mfl__hint { color: var(--tc-text-muted); }
.ui-mfl__toggle { flex: none; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); }
.ui-mfl__toggle[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); }
/* ----- The drawing: bands under absolutely placed entity cards ----- */
.ui-mfl__body { padding: var(--tc-space-3) var(--tc-space-4); }
.ui-mfl__stage { position: relative; min-width: 360px; }
.ui-mfl__body:has(.ui-mfl__stage) { overflow-x: auto; scrollbar-width: thin; }
.ui-mfl__bands { position: absolute; inset: 0; overflow: visible; }
.ui-mfl__band-line { fill: none; stroke: var(--tc-mfl-band); stroke-opacity: 0.38; stroke-linecap: round; transition: stroke-opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mfl__band[data-flag] .ui-mfl__band-line { stroke: var(--tc-mfl-flagged); }
.ui-mfl__band[data-on] .ui-mfl__band-line { stroke-opacity: 0.75; }
.ui-mfl__band[data-selected] .ui-mfl__band-line { stroke-opacity: 0.9; }
.ui-mfl__band[data-dim] .ui-mfl__band-line { stroke-opacity: 0.12; }
.ui-mfl__band-hit { fill: none; stroke: transparent; pointer-events: stroke; cursor: pointer; }
.ui-mfl__label { position: absolute; display: inline-flex; align-items: center; gap: var(--tc-space-1); padding: var(--tc-space-0-5) var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; pointer-events: none; transform: translate(-50%, -50%); font-variant-numeric: tabular-nums; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mfl__label[data-dim] { opacity: 0.35; }
.ui-mfl__flag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-mfl__label .ui-mfl__flag { height: auto; padding: 0 var(--tc-space-1); }
.ui-mfl__node-item { position: absolute; }
.ui-mfl__node { display: grid; align-content: center; gap: var(--tc-space-0-5); width: 100%; height: 52px; padding: var(--tc-space-1-5) var(--tc-space-2-5) !important; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default), var(--tc-shadow-control); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mfl__node[data-kind="shell"] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-fg), var(--tc-shadow-control); }
.ui-mfl__node[data-on] { box-shadow: inset 0 0 0 1.5px var(--tc-border-strong), var(--tc-shadow-control); }
.ui-mfl__node[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px var(--tc-text-primary), var(--tc-shadow-control); }
.ui-mfl__node[data-dim] .ui-mfl__node-name, .ui-mfl__node[data-dim] .ui-mfl__node-kind { color: var(--tc-text-muted); }
.ui-mfl__node-name { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-mfl__node-name { font-weight: var(--tc-font-weight-medium); }
.ui-mfl__node-kind { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-mfl__node-kind > span { overflow: hidden; text-overflow: ellipsis; }
.ui-mfl__node[data-kind="shell"] .ui-mfl__node-kind { color: var(--tc-status-warning-fg); }
/* ----- The transfers list ----- */
.ui-mfl__transfers { display: grid; padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mfl__transfer { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1-5) var(--tc-space-2) !important; border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mfl__transfer:hover, .ui-mfl__transfer[data-on] { background: var(--tc-fill-subtle); }
.ui-mfl__transfer[aria-pressed="true"] { background: var(--tc-fill-selected); }
.ui-mfl__transfer-route { flex: 1 1 14rem; min-width: 0; color: var(--tc-text-primary); }
.ui-mfl__arrow { color: var(--tc-text-muted); }
.ui-mfl__transfer-amount { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-mfl__transfer-date { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- The table ----- */
.ui-mfl__table-wrap { overflow-x: auto; scrollbar-width: thin; }
.ui-mfl__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mfl__table th { padding: var(--tc-space-1-5) var(--tc-space-2); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-align: left; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-mfl__table td { padding: var(--tc-space-2); color: var(--tc-text-primary); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-mfl__num { text-align: right !important; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-mfl__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@media (forced-colors: active) {
  .ui-mfl__band-line { stroke: CanvasText; }
  .ui-mfl__node { border: 1px solid CanvasText; }
  .ui-mfl__node[aria-pressed="true"] { border-color: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mfl"] *, [data-ui="mfl"] *::before, [data-ui="mfl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-money-flow")) customElements.define("tc-money-flow", TcMoneyFlow);

declare global {
  interface HTMLElementTagNameMap {
    "tc-money-flow": TcMoneyFlow;
  }
}
