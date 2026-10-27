import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-context-map> – the Lit port of src/components/context-map.tsx: what fills an agent's context window, as a
 * treemap. A bar with the agent and how full it is, an area of a fixed height below: every part of the context – the
 * system prompt, tools, memory, each file, the chat, tool results – a tile as large as its share of the tokens, and
 * what's left as a dashed free space.
 *   · tiles keep their order and glide as the context grows – sizes ease toward their new value and the map is laid
 *     out again every frame (written to the tiles directly; a render only when a tile comes or goes or a line shows
 *     or hides), so tiles never overlap; nothing runs once everything has arrived, or while it's off-screen
 *   · point at a tile, focus it or click it (pins) for a card with its name, tokens, share and a line about it
 *   · with `agents`, the name in the bar is a menu – switch to another agent and its window
 *   · after a compaction, Before and After in the bar, and a line under the map that adds it up
 *   · `status` in the bar – e.g. "Compacting" – announced through a status region
 * Standard puts the header and the bar on a gray tray around the map. Clean drops the tray: one card, the header as
 * its first row, the bar and the map below. Behaviour is the same.
 *
 *   <tc-context-map limit="200000" model="Sonnet 5" .blocks=${blocks}></tc-context-map>
 *
 * `agent` and `view` change on their own; preventDefault() on tc-agent-change / tc-view-change keeps control. A new
 * compaction shows "after" again through a tc-view-change with `reset: true`.
 */

export type ContextKind = "system" | "tools" | "memory" | "file" | "chat" | "result" | "summary";

export type ContextBlock = {
  id: string;
  /** What it is – e.g. "checkout.spec.ts" */
  label: string;
  kind: ContextKind;
  tokens: number;
  /** One line about it, shown on hover – e.g. "Read at 0:42" */
  detail?: string;
  /** A small mark, e.g. a file type icon or a company's logo – before the label (cloned) */
  icon?: Element;
  /** What's inside, listed on hover – e.g. the tools, each with its logo */
  items?: { label: string; icon?: Element }[];
};

/** What a compaction did with a block */
export type ContextFate = "kept" | "summarized" | "dropped";

export type ContextCompaction = {
  /** The blocks just before it compacted */
  before: ContextBlock[];
  /** Ids folded into the summary */
  summarized?: string[];
  /** Ids left out altogether – every other block was kept */
  dropped?: string[];
  /** The id of the summary they went into (in blocks) */
  summary?: string;
};

export type ContextAgent = {
  id: string;
  /** e.g. "Checkout fixer" */
  name: string;
  /** The model it runs on – shown in the menu */
  model?: string;
  /** The model maker's logo (cloned) */
  icon?: Element;
  /** Its context window in tokens */
  limit: number;
};

export type ContextMapView = "before" | "after";
export type ContextAgentChange = { agent: string };
/** `reset`: a new compaction asks to show "after" again (not the user) */
export type ContextViewChange = { view: ContextMapView; reset?: boolean };

/* ---------- Helpers ---------- */

/** The nearest box around an element that cuts off what sticks out – e.g. a card – else the viewport */
const clipRect = (el: Element) => {
  let clip = el.parentElement;
  while (clip && clip !== document.body && getComputedStyle(clip).overflow === "visible") clip = clip.parentElement;
  return clip && clip !== document.body ? clip.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
};

/** The word on a tile, before a compaction */
const TILE_FATE: Record<ContextFate, string> = { kept: "· kept", summarized: "· summarized", dropped: "· dropped" };
const KIND: Record<ContextKind, string> = { system: "System prompt", tools: "Tools", memory: "Memory", file: "File", chat: "Chat", result: "Tool result", summary: "Summary" };
const FREE = "__free";
const tokens = (n: number) => (n >= 100_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(Math.round(n)));

type Rect = { x: number; y: number; w: number; h: number };
type Item = { id: string; value: number };

/**
 * An ordered treemap: split the list where its weight halves, along the longer side, and again in each half.
 * It keeps the order, so tiles stay where they are as they grow – a squarified layout would shuffle them.
 */
const layout = (items: Item[], r: Rect, out: Map<string, Rect>) => {
  if (!items.length) return;
  if (items.length === 1) {
    out.set(items[0].id, r);
    return;
  }
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let acc = 0;
  let cut = 1;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].value;
    cut = i + 1;
    if (acc >= total / 2) break;
  }
  const share = items.slice(0, cut).reduce((s, i) => s + i.value, 0) / total;
  if (r.w >= r.h) {
    const w = r.w * share;
    layout(items.slice(0, cut), { x: r.x, y: r.y, w, h: r.h }, out);
    layout(items.slice(cut), { x: r.x + w, y: r.y, w: r.w - w, h: r.h }, out);
  } else {
    const h = r.h * share;
    layout(items.slice(0, cut), { x: r.x, y: r.y, w: r.w, h }, out);
    layout(items.slice(cut), { x: r.x, y: r.y + h, w: r.w, h: r.h - h }, out);
  }
};

/** The tiles in their order, the free space last, and where each goes */
const arrange = (order: string[], shown: Map<string, number>, w: number, h: number) => {
  const items: Item[] = [...order, FREE].map((id) => ({ id, value: shown.get(id) ?? 0 })).filter((i) => i.value > 0.5);
  const rects = new Map<string, Rect>();
  // A small inset, so the tiles keep the same gap to the area's edge as to each other
  if (w && h) layout(items, { x: 3, y: 3, w: w - 6, h: h - 6 }, rects);
  return { items, rects };
};

/** Which lines of a tile show – each only while there's room for it, it fades out before the tile would cut it */
const lines = (r: Rect) => {
  const name = r.w >= 54 && r.h >= 28;
  const second = name && r.h >= 44;
  return { name, second, kind: second && r.w >= 120, badge: r.w >= 40 && r.h >= 28 };
};

/** What only a render can change: which tiles there are, and which of their lines and badges show */
const shape = (items: Item[], rects: Map<string, Rect>) =>
  items
    .map(({ id }) => {
      const r = rects.get(id);
      return r ? `${id}:${Object.values(lines(r)).map(Number).join("")}` : "";
    })
    .join(",");

/** The window over a tile: above it, else below it, else over the tile itself – never out of the nearest clipping box */
type TipRoom = { w: number; h: number; box: { l: number; t: number; r: number; b: number } };
/** The reads: the card's size and the room it has, in the area's coordinates – done before any write in a frame */
const measureTip = (tip: HTMLElement | null, area: HTMLElement | null): TipRoom | null => {
  if (!tip || !area) return null;
  const a = area.getBoundingClientRect();
  const c = clipRect(area);
  return { w: tip.offsetWidth, h: tip.offsetHeight, box: { l: c.left - a.left + 8, t: c.top - a.top + 8, r: c.right - a.left - 8, b: c.bottom - a.top - 8 } };
};
/** The writes: the card over its tile */
const moveTip = (tip: HTMLElement | null, room: TipRoom | null, r: Rect | undefined) => {
  if (!tip || !room || !r) return;
  const { w, h, box } = room;
  const x = Math.max(box.l, Math.min(r.x + r.w / 2 - w / 2, box.r - w));
  const above = r.y - h - 8;
  const below = r.y + r.h + 8;
  const top = above >= box.t ? above : below + h <= box.b ? below : Math.max(box.t, Math.min(r.y + 8, box.b - h));
  tip.style.left = `${x}px`;
  tip.style.top = `${top}px`;
};

/** The order tiles sit in: new ones join where the list puts them, removed ones keep their place until they're gone.
 *  Returns the same array when nothing joined */
const mergeOrder = (order: string[], ids: string[]) => {
  if (ids.every((id) => order.includes(id))) return order;
  const next = [...order];
  ids.forEach((id, i) => {
    if (next.includes(id)) return;
    // A new one goes right after the one before it in your list
    const before = ids
      .slice(0, i)
      .reverse()
      .find((x) => next.includes(x));
    next.splice(before ? next.indexOf(before) + 1 : 0, 0, id);
  });
  return next;
};

/** The first text node in an element – the part the motion rewrites */
const firstText = (el: Element | null | undefined) => [...(el?.childNodes ?? [])].find((n) => n.nodeType === Node.TEXT_NODE);

/* ---------- Icons ---------- */

const kept = () =>
  html`<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<path d="m2.5 6.3 2.3 2.2 4.7-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const dropped = () =>
  html`<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<path d="m3.2 3.2 5.6 5.6M8.8 3.2 3.2 8.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path>`}</svg>`;
/* Folded into the summary: two arrows pressing together */
const folded = () =>
  html`<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<path d="M6 1.5v3.2M4.4 3.3 6 4.9l1.6-1.6M6 10.5V7.3M4.4 8.7 6 7.1l1.6 1.6M2 6h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const FATE_ICON = { kept, summarized: folded, dropped } as const;
/* A spinner of eight spokes pointing to the center, each fainter than the one before */
const spinner = () =>
  html`<svg class="ui-cxm__spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">${Array.from(
    { length: 8 },
    (_, i) => svg`<line x1="8" y1="1.75" x2="8" y2="4.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=${1 - i * 0.11} transform=${`rotate(${-i * 45} 8 8)`}></line>`,
  )}</svg>`;
/** A treemap: one large tile and two smaller ones */
const mapIcon = svg`<rect x="3" y="3" width="10" height="18" rx="2"></rect><rect x="16" y="3" width="5" height="8" rx="1.5"></rect><rect x="16" y="14" width="5" height="7" rx="1.5"></rect>`;
const chevron = () =>
  html`<svg class="ui-cxm__chev" viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<path d="m3.5 4.75 2.5 2.5 2.5-2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const clone = (el: Element | undefined) => (el ? el.cloneNode(true) : nothing);

let instances = 0;

/**
 * What fills an agent's context window, as a treemap.
 * @tag tc-context-map
 * @fires tc-agent-change - The user picked another agent ({ agent }: ContextAgentChange); cancelable
 * @fires tc-view-change - Before / After switched ({ view, reset }: ContextViewChange – reset when a new compaction asks for "after"); cancelable
 * @fires tc-select - A tile was clicked; `detail` is the `ContextBlock`, or null for the free space
 */
export class TcContextMap extends TcElement {
  static override ui = "cxm";

  /** In the order they should sit – the free space always comes last */
  @property({ attribute: false }) accessor blocks: ContextBlock[] = [];
  /** The context window's size in tokens – e.g. 200000 */
  @property({ type: Number }) accessor limit = 200_000;
  /** The model, next to the title */
  @property() accessor model = "";
  /** The model maker's logo – on a small white tile before the model (cloned) */
  @property({ attribute: false }) accessor modelIcon: Element | undefined = undefined;
  /** Agents to switch between – the bar shows the current one's name as a menu */
  @property({ attribute: false }) accessor agents: ContextAgent[] | undefined = undefined;
  /** The current agent's id; unset is the first one */
  @property() accessor agent: string | undefined = undefined;
  /** The last compaction, to compare before and after – null shows the line for it while there's none yet */
  @property({ attribute: false }) accessor compaction: ContextCompaction | null | undefined = undefined;
  /** Which side of the compaction shows */
  @property() accessor view: ContextMapView = "after";
  /** A short status in the bar – e.g. "Compacting" */
  @property() accessor status = "";
  /** The title in the bar, and the map's name */
  @property() accessor heading = "Context";

  /** @internal */
  @state() accessor size = { w: 0, h: 0 };
  /** @internal */
  @state() accessor hover: string | null = null;
  /** @internal The tile with keyboard focus shows its card too; Escape hides it until focus moves */
  @state() accessor focused: string | null = null;
  /** @internal */
  @state() accessor dismissed = false;
  /** @internal The tile that takes Tab into the map – arrow keys move it */
  @state() accessor active: string | null = null;
  /** @internal A card pinned with a click */
  @state() accessor pinned: string | null = null;
  /** @internal The agent menu is open */
  @state() accessor menu = false;
  /** @internal The order tiles sit in */
  @state() accessor order: string[] = [];
  /** @internal Bumped when the motion needs a render (a tile came or went, a line shows or hides) */
  @state() accessor frame = 0;

  private readonly uid = `tc-cxm${++instances}`;
  private readonly screen = new OnScreenController(this);
  /** Every block seen so far – a removed one keeps its looks while it shrinks away */
  private seen = new Map<string, ContextBlock>();
  private shown = new Map<string, number>();
  private target = new Map<string, number>();
  private items: Item[] = [];
  private rects = new Map<string, Rect>();
  private drawn = "";
  private showing: string | null = null;
  private motionKey = "";
  private raf = 0;
  private ro?: ResizeObserver;
  private lastCompaction: ContextCompaction | null | undefined = undefined;
  private escapeOn = false;
  private menuOn = false;
  private openAt: "checked" | "first" | "last" = "checked";
  private placeKey = "";
  /** Rolling text: what each slot showed, and the old text while it rolls out */
  private rolls = new Map<string, { k: string; node: unknown; out?: { k: string; node: unknown }; timer?: number }>();

  override disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.motionKey = "";
    this.ro?.disconnect();
    this.ro = undefined;
    this.listenEscape(false);
    this.listenMenu(false);
    this.rolls.forEach((r) => window.clearTimeout(r.timer));
    this.rolls.clear();
  }

  /* ---------- Derived ---------- */

  private get current() {
    return this.agents?.find((a) => a.id === this.agent) ?? this.agents?.[0];
  }
  private get windowLimit() {
    return this.current?.limit ?? this.limit;
  }
  private get shownView(): ContextMapView {
    return this.compaction ? this.view : "after";
  }
  private get shownBlocks() {
    return this.shownView === "before" && this.compaction ? this.compaction.before : this.blocks;
  }
  private fateOf(id: string): ContextFate {
    const c = this.compaction;
    return c?.summarized?.includes(id) ? "summarized" : c?.dropped?.includes(id) ? "dropped" : "kept";
  }
  private blockOf(id: string) {
    return this.shownBlocks.find((b) => b.id === id) ?? this.seen.get(id);
  }
  private wasBefore(id: string) {
    return this.shownView === "before" && !!this.compaction?.before.some((x) => x.id === id);
  }
  private tokensOf(id: string, value: number) {
    return tokens(this.target.get(id) || value);
  }
  private ariaOf(id: string, value: number) {
    if (id === FREE) return `Free – ${tokens(value)} tokens`;
    const b = this.blockOf(id);
    // Before a compaction, what happened to the block is part of its name – not only the tile's styling
    const fate = this.wasBefore(id) ? `, ${this.fateOf(id)}` : "";
    return `${b?.label}, ${b ? KIND[b.kind] : ""} – ${tokens(value)} tokens${fate}`;
  }
  private get focusable() {
    return this.items.filter((it) => it.id !== FREE && this.rects.has(it.id)).map((it) => it.id);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // A new compaction (or none) shows what's there now – the app may keep its own view (preventDefault)
    if (changed.has("compaction")) {
      if (this.hasUpdated && this.lastCompaction !== this.compaction && this.view !== "after") {
        if (this.emit<ContextViewChange>("tc-view-change", { view: "after", reset: true }, { cancelable: true })) this.view = "after";
      }
      this.lastCompaction = this.compaction;
    }
    const blocks = this.shownBlocks;
    const ids = blocks.filter((b) => b.tokens > 0).map((b) => b.id);
    const order = mergeOrder(this.order, ids);
    if (order !== this.order) this.order = order;
    const used = blocks.reduce((s, b) => s + Math.max(0, b.tokens), 0);
    const free = Math.max(0, this.windowLimit - used);
    const byId = new Map(blocks.map((b) => [b.id, b]));
    this.target = new Map<string, number>([...order.map((id): [string, number] => [id, Math.max(0, byId.get(id)?.tokens ?? 0)]), [FREE, free]]);
    const { items, rects } = arrange(order, this.shown, this.size.w, this.size.h);
    this.items = items;
    this.rects = rects;
    // The pinned card goes once its block has left the map
    if (this.pinned && !order.includes(this.pinned)) this.pinned = null;
    // Pointing shows a card; then the focused tile's; without either, the pinned one shows
    this.showing = this.hover && this.hover !== FREE ? this.hover : this.focused && !this.dismissed ? this.focused : this.pinned;
  }

  protected override firstUpdated() {
    const area = this.area;
    if (area && typeof ResizeObserver === "function") {
      // A new size only when it really changed – the observer also reports the first one, and equal ones
      this.ro = new ResizeObserver(() => {
        const w = area.clientWidth;
        const h = area.clientHeight;
        if (this.size.w !== w || this.size.h !== h) this.size = { w, h };
      });
      this.ro.observe(area);
    }
  }

  protected override updated() {
    for (const b of this.shownBlocks) this.seen.set(b.id, b);
    this.drawn = shape(this.items, this.rects);
    this.writeTiles(this.items, this.rects);
    // The card goes over its tile when a render changed the tiles, the size or what's shown
    const r = this.showing ? this.rects.get(this.showing) : undefined;
    const block = this.showing ? this.blockOf(this.showing) : undefined;
    const placeKey = r ? `${this.showing}:${this.shownView}:${block?.tokens}:${r.x},${r.y},${r.w},${r.h}` : "";
    if (placeKey && placeKey !== this.placeKey) moveTip(this.tip, measureTip(this.tip, this.area), r);
    this.placeKey = placeKey;
    this.listenEscape(!!(this.pinned || (this.hover && this.hover !== FREE) || (this.focused && !this.dismissed)));
    this.listenMenu(this.menu);
    this.settleRolls();
    // The motion restarts only when a target, the size or being on screen changes
    const motionKey = `${[...this.target].map(([id, to]) => `${id}:${to}`).join(",")}|${this.size.w}x${this.size.h}|${this.screen.onScreen}`;
    if (motionKey !== this.motionKey) {
      this.motionKey = motionKey;
      this.startMotion();
    }
  }

  private get area() {
    return this.querySelector<HTMLElement>(".ui-cxm__area");
  }
  private get tip() {
    return this.querySelector<HTMLElement>(".ui-cxm__tip");
  }

  /* ---------- Motion ---------- */

  /** Same tiles, same lines: only sizes and numbers change – written to the tiles directly */
  private writeTiles(items: Item[], rects: Map<string, Rect>) {
    const tiles = new Map([...this.querySelectorAll<HTMLElement>(".ui-cxm__tile")].map((el) => [el.dataset.id!, el]));
    for (const it of items) {
      const el = tiles.get(it.id);
      const r = rects.get(it.id);
      if (!el || !r) continue;
      el.style.setProperty("--x", `${r.x}px`);
      el.style.setProperty("--y", `${r.y}px`);
      el.style.setProperty("--w", `${r.w}px`);
      el.style.setProperty("--h", `${r.h}px`);
      // The name says where it's going, not the number rolling there
      const name = this.ariaOf(it.id, this.target.get(it.id) ?? it.value);
      if (it.id === FREE) el.setAttribute("aria-label", name);
      else el.querySelector(".ui-cxm__hit")?.setAttribute("aria-label", name);
      // The count is the first text in its line
      const count = firstText(el.querySelector(".ui-cxm__tokens"));
      const text = this.tokensOf(it.id, it.value);
      if (count && count.nodeValue !== text) count.nodeValue = text;
    }
  }

  private startMotion() {
    cancelAnimationFrame(this.raf);
    const target = this.target;
    const { w, h } = this.size;
    // Off-screen (or in a hidden tab) the tiles jump to their sizes – no frames run where nobody sees them
    const onScreen = this.screen.onScreen;
    let last: number | null = null;
    const step = (now: number) => {
      this.raf = 0;
      const dt = last === null ? 16 : Math.min(64, now - last);
      last = now;
      const k = onScreen ? 1 - Math.exp(-dt / 110) : 1;
      let moving = false;
      let gone = false;
      let order = this.order;
      for (const [id, to] of target) {
        const from = this.shown.get(id) ?? 0;
        const v = Math.abs(to - from) < 1 ? to : from + (to - from) * k;
        if (v !== to) moving = true;
        this.shown.set(id, v);
      }
      // Gone and shrunk to nothing: out of the map
      for (const id of [...this.shown.keys()]) {
        if (!target.has(id)) this.shown.delete(id);
        else if (id !== FREE && (target.get(id) ?? 0) === 0 && (this.shown.get(id) ?? 0) === 0) {
          order = order.filter((x) => x !== id);
          gone = true;
        }
      }
      const { items, rects } = arrange(order, this.shown, w, h);
      if (gone) this.order = order;
      else if (shape(items, rects) !== this.drawn) this.frame++;
      else {
        // Reads first (the card's size and room), then only writes – no layout is forced in between
        const room = this.showing ? measureTip(this.tip, this.area) : null;
        this.writeTiles(items, rects);
        this.items = items;
        this.rects = rects;
        moveTip(this.tip, room, this.showing ? rects.get(this.showing) : undefined);
      }
      if (moving && onScreen) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  /* ---------- Listeners while something is open ---------- */

  // Escape hides the card without moving focus (WCAG 1.4.13)
  private onEscape = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    this.pinned = null;
    this.hover = null;
    this.dismissed = true;
  };
  private listenEscape(on: boolean) {
    if (on === this.escapeOn) return;
    this.escapeOn = on;
    if (on) document.addEventListener("keydown", this.onEscape);
    else document.removeEventListener("keydown", this.onEscape);
  }

  private onMenuDown = (e: PointerEvent) => {
    if (!this.querySelector(".ui-cxm__pick")?.contains(e.target as Node)) this.menu = false;
  };
  // Escape closes the menu and returns focus to its button
  private onMenuKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    this.closeMenu(!!this.querySelector(".ui-cxm__pick")?.contains(document.activeElement));
  };
  private listenMenu(on: boolean) {
    if (on === this.menuOn) return;
    this.menuOn = on;
    if (on) {
      document.addEventListener("pointerdown", this.onMenuDown);
      document.addEventListener("keydown", this.onMenuKey);
      // The menu opens under its button, moved left as far as it takes to stay inside the box around it
      const list = this.querySelector<HTMLElement>(".ui-cxm__menu");
      if (list) {
        const over = list.parentElement!.getBoundingClientRect().left + list.offsetWidth - (clipRect(list).right - 8);
        list.style.left = over > 0 ? `${-over}px` : "0px";
        // Focus moves into the menu (APG menu button)
        const all = this.menuItems();
        const at = this.openAt;
        (at === "first" ? all[0] : at === "last" ? all.at(-1) : (all.find((el) => el.getAttribute("aria-checked") === "true") ?? all[0]))?.focus();
      }
    } else {
      document.removeEventListener("pointerdown", this.onMenuDown);
      document.removeEventListener("keydown", this.onMenuKey);
    }
  }
  private menuItems() {
    return [...this.querySelectorAll<HTMLElement>('.ui-cxm__menu [role="menuitemradio"]')];
  }
  private closeMenu(refocus: boolean) {
    this.menu = false;
    if (refocus) this.querySelector<HTMLElement>(".ui-cxm__agent")?.focus();
  }

  /* ---------- Changes ---------- */

  private pickAgent(id: string) {
    if (this.emit<ContextAgentChange>("tc-agent-change", { agent: id }, { cancelable: true })) this.agent = id;
  }
  private pickView(view: ContextMapView) {
    if (this.emit<ContextViewChange>("tc-view-change", { view }, { cancelable: true })) this.view = view;
  }

  private moveFocus(from: string, key: string) {
    const focusable = this.focusable;
    const i = focusable.indexOf(from);
    const next = key === "Home" ? 0 : key === "End" ? focusable.length - 1 : key === "ArrowRight" || key === "ArrowDown" ? Math.min(focusable.length - 1, i + 1) : Math.max(0, i - 1);
    const id = focusable[next];
    if (id === undefined) return;
    this.active = id;
    this.querySelector<HTMLElement>(`.ui-cxm__tile[data-id="${CSS.escape(id)}"] .ui-cxm__hit`)?.focus();
  }

  /* ---------- Render ---------- */

  /** Text that rolls when it changes: the old one slides up and fades out, the new one comes in from below */
  private roll(slot: string, k: string, node: TemplateResult | string) {
    let r = this.rolls.get(slot);
    if (!r) this.rolls.set(slot, (r = { k, node }));
    else if (r.k !== k) {
      window.clearTimeout(r.timer);
      r.out = { k: r.k, node: r.node };
      r.timer = undefined;
      r.k = k;
    }
    r.node = node;
    return html`<span class="ui-cxm__roll">${r.out ? keyed(`out-${r.out.k}`, html`<span class="ui-cxm__roll-out" aria-hidden="true">${r.out.node}</span>`) : nothing}${keyed(
      k,
      html`<span class="ui-cxm__roll-in" ?data-rolling=${!!r.out}>${node}</span>`,
    )}</span>`;
  }
  /** Rolled-out text leaves after its animation */
  private settleRolls() {
    for (const r of this.rolls.values()) {
      if (!r.out || r.timer) continue;
      r.timer = window.setTimeout(() => {
        r.out = undefined;
        r.timer = undefined;
        this.requestUpdate();
      }, 360);
    }
  }

  private bar(used: number, share: number) {
    const current = this.current;
    const limit = this.windowLimit;
    const view = this.shownView;
    const level = share >= 0.95 ? "full" : share >= 0.8 ? "high" : undefined;
    return html`${cardHead({
        icon: mapIcon,
        title: this.heading,
        id: `${this.uid}-label`,
        aside: this.status ? keyed(this.status, html`<span class="ui-cxm__status" aria-hidden="true">${spinner()}${this.status}</span>`) : nothing,
      })}
      <div class="ui-cxm__bar">
      ${current
        ? html`<span class="ui-cxm__pick">
            <button
              type="button"
              class="ui-cxm__who ui-cxm__agent"
              aria-haspopup="menu"
              aria-expanded=${this.menu ? "true" : "false"}
              @click=${() => {
                this.openAt = "checked";
                this.menu = !this.menu;
              }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                e.preventDefault();
                this.openAt = e.key === "ArrowUp" ? "last" : "first";
                this.menu = true;
              }}
            >
              ${current.icon ? html`<span class="ui-cxm__logo" aria-hidden="true">${clone(current.icon)}</span>` : nothing}
              <span class="ui-cxm__model">${current.name}</span>
              <span class="ui-cxm__limit">${tokens(limit)}</span>
              ${chevron()}
            </button>
            ${this.menu
              ? html`<span
                  class="ui-cxm__menu"
                  role="menu"
                  aria-label="Agents"
                  @keydown=${(e: KeyboardEvent) => {
                    const all = this.menuItems();
                    const i = all.indexOf(document.activeElement as HTMLElement);
                    const go = (n: number) => {
                      e.preventDefault();
                      all[(n + all.length) % all.length]?.focus();
                    };
                    if (e.key === "ArrowDown") go(i + 1);
                    else if (e.key === "ArrowUp") go(i - 1);
                    else if (e.key === "Home") go(0);
                    else if (e.key === "End") go(all.length - 1);
                    // Tab leaves the menu and closes it
                    else if (e.key === "Tab") this.menu = false;
                  }}
                >
                  ${(this.agents ?? []).map(
                    (a) => html`<button
                      type="button"
                      role="menuitemradio"
                      aria-checked=${a.id === current.id ? "true" : "false"}
                      tabindex="-1"
                      class="ui-cxm__option"
                      @click=${() => {
                        // Picking closes the menu – focus goes back to its button, not to <body>
                        this.closeMenu(true);
                        if (a.id !== current.id) this.pickAgent(a.id);
                      }}
                    >
                      <span class="ui-cxm__logo" aria-hidden="true">${clone(a.icon)}</span>
                      <span class="ui-cxm__option-text"><span class="ui-cxm__option-name">${a.name}</span>${a.model ? html`<span class="ui-cxm__option-model">${a.model}</span>` : nothing}</span>
                      <span class="ui-cxm__limit">${tokens(a.limit)}</span>
                      <svg class="ui-cxm__check" viewBox="0 0 12 12" fill="none" aria-hidden="true">${a.id === current.id ? svg`<path d="m2.5 6.3 2.3 2.2 4.7-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>` : nothing}</svg>
                    </button>`,
                  )}
                </span>`
              : nothing}
          </span>`
        : this.model || this.modelIcon
          ? html`<span class="ui-cxm__who">
              ${this.modelIcon ? html`<span class="ui-cxm__logo" aria-hidden="true">${clone(this.modelIcon)}</span>` : nothing}
              ${this.model ? html`<span class="ui-cxm__model">${this.model}</span>` : nothing}
              <span class="ui-cxm__limit">${tokens(limit)}</span>
            </span>`
          : nothing}
      <span class="ui-cxm__sr" role="status">${this.status}</span>
      <span class="ui-cxm__sum">
        ${this.compaction
          ? html`<span class="ui-cxm__compare" role="group" aria-label="Compaction">
              ${(["before", "after"] as const).map(
                (v) => html`<button type="button" aria-pressed=${view === v ? "true" : "false"} @click=${() => this.pickView(v)}>${v === "before" ? "Before" : "After"}</button>`,
              )}
            </span>`
          : nothing}
        <span><b class="ui-cxm__used">${tokens(used)}</b> / ${tokens(limit)}</span>
        <span class="ui-cxm__pct" data-level=${ifDefined(level)}>${Math.round(share * 100)}%</span>
      </span>
    </div>`;
  }

  private tipCard(block: ContextBlock) {
    const c = this.compaction;
    const view = this.shownView;
    const fate = this.fateOf(block.id);
    return html`<div id=${`${this.uid}-tip`} class="ui-cxm__tip" role="tooltip">
      <span class="ui-cxm__tip-head">
        ${block.icon ? html`<span class="ui-cxm__logo" aria-hidden="true">${clone(block.icon)}</span>` : html`<span class="ui-cxm__swatch" data-kind=${block.kind} aria-hidden="true"></span>`}
        <span class="ui-cxm__tip-name">${block.label}</span>
      </span>
      <span class="ui-cxm__tip-meta">${KIND[block.kind]} · ${tokens(block.tokens)} tokens · ${Math.round((block.tokens / this.windowLimit) * 1000) / 10}%</span>
      ${block.detail ? html`<span class="ui-cxm__tip-detail">${block.detail}</span>` : nothing}
      ${c && view === "before" && c.before.some((x) => x.id === block.id)
        ? html`<span class="ui-cxm__tip-fate" data-fate=${fate}>${FATE_ICON[fate]()}${fate === "summarized" ? "Folded into the summary" : fate === "dropped" ? "Dropped when it compacted" : "Kept as it was"}</span>`
        : nothing}
      ${c && view === "after" && block.id === c.summary
        ? html`<span class="ui-cxm__tip-fate" data-fate="summary"
            >${folded()}From ${c.summarized?.length ?? 0} blocks, ${tokens(c.before.filter((b) => c.summarized?.includes(b.id)).reduce((t, b) => t + b.tokens, 0))} before</span
          >`
        : nothing}
      ${block.items?.length
        ? html`<ul class="ui-cxm__tip-items">
            ${block.items.map((item) => html`<li>${item.icon ? html`<span class="ui-cxm__logo" aria-hidden="true">${clone(item.icon)}</span>` : nothing}${item.label}</li>`)}
          </ul>`
        : nothing}
    </div>`;
  }

  /** "186k → 54k · 7 kept 112k · 3 summarized 66k into 8.6k · 1 dropped 15.6k" */
  private fates() {
    const c = this.compaction;
    if (!c)
      return html`<div class="ui-cxm__fates-row">${this.roll("fates", "none", html`<p class="ui-cxm__fates ui-cxm__fates--none">Not compacted yet – once it is, compare before and after here.</p>`)}</div>`;
    const sum = (list: ContextBlock[]) => list.reduce((t, b) => t + Math.max(0, b.tokens), 0);
    const of = (fate: ContextFate) => c.before.filter((b) => this.fateOf(b.id) === fate);
    const kept = of("kept");
    const summarized = of("summarized");
    const dropped = of("dropped");
    const summary = this.blocks.find((b) => b.id === c.summary);
    return html`<div class="ui-cxm__fates-row">
      ${this.roll(
        "fates",
        "done",
        html`<p class="ui-cxm__fates">
          <b>${tokens(sum(c.before))} → ${tokens(sum(this.blocks))}</b>
          <span class="ui-cxm__fate" data-fate="kept">${kept.length} kept · ${tokens(sum(kept))}</span>
          ${summarized.length > 0 ? html`<span class="ui-cxm__fate" data-fate="summarized">${summarized.length} summarized · ${tokens(sum(summarized))}${summary ? ` into ${tokens(summary.tokens)}` : ""}</span>` : nothing}
          ${dropped.length > 0 ? html`<span class="ui-cxm__fate" data-fate="dropped">${dropped.length} dropped · ${tokens(sum(dropped))}</span>` : nothing}
        </p>`,
      )}
    </div>`;
  }

  private tile(it: Item) {
    const r = this.rects.get(it.id)!;
    const b = this.blockOf(it.id);
    const isFree = it.id === FREE;
    const c = this.compaction;
    const view = this.shownView;
    const { name, second, kind, badge } = lines(r);
    const before = this.wasBefore(it.id);
    const fate = isFree || !c ? undefined : view === "before" ? (before ? this.fateOf(it.id) : undefined) : it.id === c.summary ? "summary" : undefined;
    const focusable = this.focusable;
    const tabStop = this.active && focusable.includes(this.active) ? this.active : focusable[0];
    return html`<div
      role="listitem"
      class="ui-cxm__tile"
      data-id=${it.id}
      data-kind=${ifDefined(isFree ? "free" : b?.kind)}
      data-fate=${ifDefined(fate)}
      ?data-dim=${!!this.hover && this.hover !== it.id}
      ?data-pinned=${this.pinned === it.id}
      aria-label=${ifDefined(isFree ? this.ariaOf(it.id, this.target.get(it.id) ?? it.value) : undefined)}
      @mouseenter=${() => {
        this.hover = it.id;
        this.dismissed = false;
      }}
      @click=${isFree ? () => this.emit("tc-select", null) : nothing}
    >
      ${isFree
        ? nothing
        : html`<button
            type="button"
            class="ui-cxm__hit"
            aria-label=${this.ariaOf(it.id, this.target.get(it.id) ?? it.value)}
            aria-pressed=${this.pinned === it.id ? "true" : "false"}
            aria-describedby=${ifDefined(this.showing === it.id ? `${this.uid}-tip` : undefined)}
            tabindex=${it.id === tabStop ? 0 : -1}
            @focus=${() => {
              this.focused = it.id;
              this.active = it.id;
              this.dismissed = false;
            }}
            @blur=${() => {
              if (this.focused === it.id) this.focused = null;
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                this.moveFocus(it.id, e.key);
              }
            }}
            @click=${() => {
              // A click pins its card – a second one lets it go
              this.pinned = this.pinned === it.id ? null : it.id;
              this.dismissed = false;
              this.emit("tc-select", b ?? null);
            }}
          ></button>`}
      ${before && this.fateOf(it.id) === "summarized" && badge ? html`<span class="ui-cxm__badge" title="Summarized – click for more" aria-hidden="true">${folded()}</span>` : nothing}
      <span class="ui-cxm__label" aria-hidden="true">
        <span class="ui-cxm__name" ?data-show=${name}>${b?.icon && !isFree ? html`<span class="ui-cxm__icon">${clone(b.icon)}</span>` : nothing}${isFree ? "Free" : b?.label}</span>
        <span class="ui-cxm__tokens" ?data-show=${second}>${this.tokensOf(it.id, it.value)}${!isFree && b
            ? html`<span class="ui-cxm__kind" ?data-show=${kind}>
                ${before
                  ? this.roll(`kind:${it.id}`, this.fateOf(it.id), html`<span data-fate=${this.fateOf(it.id)}>${TILE_FATE[this.fateOf(it.id)]}</span>`)
                  : this.roll(`kind:${it.id}`, "kind", `· ${KIND[b.kind]}`)}</span
              >`
            : nothing}</span
        >
      </span>
    </div>`;
  }

  protected override render() {
    const blocks = this.shownBlocks;
    const used = blocks.reduce((s, b) => s + Math.max(0, b.tokens), 0);
    const share = used / this.windowLimit;
    const hovered = this.showing ? (this.blockOf(this.showing) ?? null) : null;
    return html`
      ${this.bar(used, share)}
      <div class="ui-cxm__area" role="list" aria-labelledby=${`${this.uid}-label`} @mouseleave=${() => (this.hover = null)}>
        ${repeat(
          this.items.filter((it) => this.rects.has(it.id)),
          (it) => it.id,
          (it) => this.tile(it),
        )}
        ${hovered ? keyed(hovered.id, this.tipCard(hovered)) : nothing}
      </div>
      ${this.compaction !== undefined ? this.fates() : nothing}
    `;
  }

  static override css = /* css */ `
/* Colors, sizes and motion as variables – override them on [data-ui="cxm"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cxm"] {
  /* Tiles by kind: a tint, its edge and the ink on it */
  --tc-context-map-tools-bg: light-dark(#e2f2f9, #12303b);
  --tc-context-map-tools-edge: light-dark(#a6d6ea, #2a6a84);
  --tc-context-map-tools-ink: light-dark(#006a94, #6fd0f2);
  --tc-context-map-memory-bg: light-dark(#ececfc, #24244a);
  --tc-context-map-memory-edge: light-dark(#bdbdf0, #4a4aa0);
  --tc-context-map-memory-ink: light-dark(#4a4ac2, #b3b3ff);
  --tc-context-map-file-bg: light-dark(#e6effd, #1d2b4d);
  --tc-context-map-file-edge: light-dark(#a9c4f5, #3c5fb3);
  --tc-context-map-file-ink: light-dark(#2456d6, #8aaeff);
  --tc-context-map-chat-bg: light-dark(#f3eafa, #2f2140);
  --tc-context-map-chat-edge: light-dark(#d3b6ec, #6a4a94);
  --tc-context-map-chat-ink: light-dark(#7b3fb0, #d4a8ff);
  --tc-context-map-result-bg: light-dark(#ffefd6, #3a2a12);
  --tc-context-map-result-edge: light-dark(#f7c27a, #8a5a1c);
  --tc-context-map-result-ink: light-dark(#b35400, #ffc078);
  --tc-context-map-summary-bg: light-dark(#dcf3e4, #15321f);
  --tc-context-map-summary-edge: light-dark(#9fd9b4, #2f7a4b);
  --tc-context-map-summary-ink: light-dark(#1a7f45, #55d68c);
  --tc-context-map-shine: light-dark(#b8b8b8, #8a8a8a);
  --tc-context-map-height: 280px;
  --tc-context-map-gap: 3px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-space-1);
  border-radius: var(--tc-radius-3xl);
  background: var(--tc-surface-sunken);
  min-width: 0;
  container: ui-cxm / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  letter-spacing: var(--tc-tracking-normal);
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on [data-ui="cxm"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cxm"] {
  /* Tiles by kind: a tint, its hairline edge and the ink on it – the Trace Waterfall recipe */
  --tc-context-map-tools-bg: light-dark(rgba(0, 123, 172, 0.085), rgba(40, 170, 220, 0.16));
  --tc-context-map-tools-edge: light-dark(rgba(0, 123, 172, 0.28), rgba(70, 190, 235, 0.42));
  --tc-context-map-tools-ink: light-dark(#006a94, #6fd0f2);
  --tc-context-map-memory-bg: light-dark(rgba(91, 91, 214, 0.1), rgba(120, 120, 255, 0.18));
  --tc-context-map-memory-edge: light-dark(rgba(91, 91, 214, 0.3), rgba(150, 150, 255, 0.45));
  --tc-context-map-memory-ink: light-dark(#4a4ac2, #b3b3ff);
  --tc-context-map-file-bg: light-dark(rgba(0, 96, 226, 0.08), rgba(60, 130, 255, 0.18));
  --tc-context-map-file-edge: light-dark(rgba(0, 96, 226, 0.26), rgba(112, 170, 255, 0.45));
  --tc-context-map-file-ink: light-dark(#0058cf, #8ab8ff);
  --tc-context-map-chat-bg: light-dark(rgba(142, 78, 198, 0.09), rgba(180, 110, 240, 0.17));
  --tc-context-map-chat-edge: light-dark(rgba(142, 78, 198, 0.28), rgba(200, 140, 250, 0.42));
  --tc-context-map-chat-ink: light-dark(#7b3fb0, #d4a8ff);
  --tc-context-map-result-bg: light-dark(rgba(255, 156, 0, 0.13), rgba(255, 160, 40, 0.17));
  --tc-context-map-result-edge: light-dark(rgba(214, 120, 0, 0.36), rgba(255, 180, 70, 0.45));
  --tc-context-map-result-ink: light-dark(#b35400, #ffc078);
  --tc-context-map-summary-bg: light-dark(rgba(0, 164, 51, 0.13), rgba(40, 200, 110, 0.17));
  --tc-context-map-summary-edge: light-dark(rgba(0, 140, 50, 0.34), rgba(60, 220, 130, 0.42));
  --tc-context-map-summary-ink: light-dark(#007d2e, #6fe0a4);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-context-map-shine: light-dark(rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.35));
  --tc-context-map-height: 280px;
  --tc-context-map-gap: 3px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container: ui-cxm / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cxm"] *, [data-ui="cxm"] *::before, [data-ui="cxm"] *::after { box-sizing: border-box; }
/* ----- On the tray: the header (cardHead, with the status at its right), then the agent and how full it is ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); min-width: 0; padding: 0 var(--tc-space-2-5) var(--tc-space-3); }
/* ----- Clean: one card – the header is its first row, then the model and how full it is, the map and the line under it ----- */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cxm"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); padding-bottom: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; margin-bottom: var(--tc-space-3); padding: 0 var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__area, :where([data-look="clean"], [data-look="clean"] *).ui-cxm__fates-row { margin-inline: var(--tc-space-4); }
.ui-cxm__who { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
/* The model maker's logo on a small white tile */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__logo { display: grid; flex: none; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__logo > svg { width: 12px; height: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__model { min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* The model maker's logo on a small white tile */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__logo { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-badge); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__logo > svg { width: 11px; height: 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__model { min-width: 0; overflow: hidden; color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
/* The agent menu */
.ui-cxm__pick { position: relative; display: inline-flex; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__agent { min-width: 0; height: 32px; margin: -5px 0; padding: 0 var(--tc-space-2) 0 var(--tc-space-3); border: 0; border-radius: var(--tc-radius-full); letter-spacing: inherit; background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font: inherit; color: inherit; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__agent { min-width: 0; height: 28px; margin: -4px 0; padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2); border: 0; border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font: inherit; color: inherit; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cxm__agent:hover, .ui-cxm__agent[aria-expanded="true"] { box-shadow: var(--tc-shadow-raised-hover); }
.ui-cxm__agent .ui-cxm__logo { width: 14px; height: 14px; border-radius: 0; background: none; box-shadow: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__agent .ui-cxm__logo > svg { width: 15px; height: 15px; }
.ui-cxm__agent:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* Menu rows: the ring sits inside the row, so neighbours never cover it */
.ui-cxm__option:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__chev { flex: none; width: 13px; height: 13px; margin-left: -2px; color: var(--tc-text-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__agent .ui-cxm__logo > svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__chev { flex: none; width: 12px; height: 12px; margin-left: -2px; color: var(--tc-text-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-cxm__agent[aria-expanded="true"] .ui-cxm__chev { transform: rotate(180deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__menu { position: absolute; top: calc(100% + 8px); left: 0; z-index: var(--tc-z-dropdown); display: grid; gap: 1px; width: 268px; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-cxm-tip var(--tc-duration-fast) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option { display: flex; align-items: center; gap: var(--tc-space-2-5); width: 100%; min-height: var(--tc-menu-item-h); padding: 7px var(--tc-menu-item-px) 7px 7px; border: 0; border-radius: var(--tc-menu-item-radius); letter-spacing: inherit; background: none; font: inherit; text-align: left; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__menu { position: absolute; top: calc(100% + 6px); left: 0; z-index: var(--tc-z-dropdown); display: grid; gap: 1px; width: 250px; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-cxm-tip-clean var(--tc-duration-fast) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: var(--tc-menu-item-h); padding: 6px var(--tc-menu-item-px) 6px 6px; border: 0; border-radius: var(--tc-menu-item-radius); background: none; font: inherit; text-align: left; color: inherit; cursor: pointer; }
.ui-cxm__option:hover { background: var(--tc-menu-item-hover); }
/* The current agent: a tick in the selected colour */
.ui-cxm__check { flex: none; width: 12px; height: 12px; margin-left: -4px; color: var(--tc-menu-item-selected-fg); }
.ui-cxm__option-text { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option-name { overflow: hidden; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option-model { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option .ui-cxm__logo { width: 28px; height: 28px; border-radius: var(--tc-radius-md); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option .ui-cxm__logo > svg { width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__limit { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-hover); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__status { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg) 0 calc(var(--tc-pill-px-lg) - 2px); border-radius: var(--tc-pill-radius); background: var(--tc-context-map-summary-bg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); color: var(--tc-context-map-summary-ink); animation: ui-cxm-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__sum { display: flex; align-items: center; gap: var(--tc-space-2-5); margin-left: auto; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__sum b { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option-name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option-model { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option .ui-cxm__logo { width: 24px; height: 24px; border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option .ui-cxm__logo > svg { width: 13px; height: 13px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__limit { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-hover); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__status { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg) 0 calc(var(--tc-pill-px-lg) - 2px); border-radius: var(--tc-pill-radius); background: var(--tc-context-map-summary-bg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); color: var(--tc-context-map-summary-ink); animation: ui-cxm-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__sum { display: flex; align-items: center; gap: var(--tc-space-2-5); margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__sum b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* The used count: a shine sweeping over it, all the time */
.ui-cxm__used { background: linear-gradient(90deg, var(--tc-text-primary) 0%, var(--tc-text-primary) 38%, var(--tc-context-map-shine) 50%, var(--tc-text-primary) 62%, var(--tc-text-primary) 100%) 0 0 / 300% 100%; -webkit-background-clip: text; background-clip: text; color: transparent !important; animation: ui-cxm-shine 1100ms linear 3; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__pct { min-width: 44px; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-pill-h-lg); color: var(--tc-text-muted); text-align: center; transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__pct { min-width: 36px; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h-lg); color: var(--tc-text-secondary); text-align: center; transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), color var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-cxm__pct[data-level="high"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-cxm__pct[data-level="full"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* Before | After a compaction */
.ui-cxm__compare { display: inline-flex; flex: none; gap: 1px; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
/* Before | After a compaction */
.ui-cxm__compare { margin: -2px 0; animation: ui-cxm-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
/* Rolling text: both sit in one cell, the old one leaves upward as the new one rises in */
.ui-cxm__roll { display: inline-grid; vertical-align: top; overflow: hidden; }
.ui-cxm__roll > * { grid-area: 1 / 1; }
.ui-cxm__roll-in[data-rolling] { animation: ui-cxm-roll-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-cxm__roll-out { animation: ui-cxm-roll-out var(--tc-duration-slow) var(--tc-ease-move) both; pointer-events: none; }
.ui-cxm__fates-row { display: grid; }
.ui-cxm__fates-row > .ui-cxm__roll { display: grid; }
@keyframes ui-cxm-roll-in { from { opacity: 0; transform: translateY(80%); } }
@keyframes ui-cxm-roll-out { to { opacity: 0; transform: translateY(-80%); } }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__compare button { height: 24px; padding: 0 var(--tc-space-2); border: 0; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: none; font: inherit; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__compare button { height: 20px; padding: 0 var(--tc-space-2); border: 0; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: none; font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cxm__compare button:hover { color: var(--tc-text-primary); }
.ui-cxm__compare button[aria-pressed="true"] { background: var(--tc-seg-thumb-bg); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); box-shadow: var(--tc-seg-thumb-shadow); }
.ui-cxm__compare button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ----- The white card: one tile per part, placed by the layout, gliding when it changes ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__area { position: relative; height: var(--tc-context-map-height); padding: 0; border-radius: var(--tc-radius-2xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tile { position: absolute; left: 0; top: 0; width: max(0px, calc(var(--w) - var(--tc-context-map-gap))); height: max(0px, calc(var(--h) - var(--tc-context-map-gap))); border-radius: var(--tc-radius-md); background: var(--tc-context-map-tile-bg); box-shadow: inset 0 0 0 1px var(--tc-context-map-tile-edge); overflow: hidden; transform: translate(calc(var(--x) + var(--tc-context-map-gap) / 2), calc(var(--y) + var(--tc-context-map-gap) / 2)); transition: opacity var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-slow) var(--tc-ease-standard); cursor: default; }
/* The free space: dashed, with a faint hatch */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tile[data-kind="free"] { background: repeating-linear-gradient(135deg, transparent 0 6px, var(--tc-fill-subtle) 6px 7px); box-shadow: none; outline: 1.5px dashed var(--tc-border-strong); outline-offset: -2px; }
/* ----- The area: one tile per part, placed by the layout, gliding when it changes ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__area { position: relative; height: var(--tc-context-map-height); padding: 0; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tile { position: absolute; left: 0; top: 0; width: max(0px, calc(var(--w) - var(--tc-context-map-gap))); height: max(0px, calc(var(--h) - var(--tc-context-map-gap))); border-radius: var(--tc-radius-sm); background: var(--tc-context-map-tile-bg); box-shadow: inset 0 0 0 0.5px var(--tc-context-map-tile-edge); overflow: hidden; transform: translate(calc(var(--x) + var(--tc-context-map-gap) / 2), calc(var(--y) + var(--tc-context-map-gap) / 2)); transition: opacity var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-slow) var(--tc-ease-standard); cursor: default; }
/* The free space: dashed, with a faint hatch */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tile[data-kind="free"] { background: repeating-linear-gradient(135deg, transparent 0 6px, var(--tc-fill-subtle) 6px 7px); box-shadow: inset 0 0 0 0.5px var(--tc-border-strong); outline: 1px dashed var(--tc-border-strong); outline-offset: -3px; }
.ui-cxm__tile[data-dim] { opacity: 0.55; }
/* The label: no ellipsis – a line that runs into the edge fades out, and a line without room fades away before it's cut */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__label { position: absolute; top: 8px; right: 0; left: 10px; display: grid; min-width: 0; pointer-events: none; }
/* The label: no ellipsis – a line that runs into the edge fades out, and a line without room fades away before it's cut */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__label { position: absolute; top: 7px; right: 0; left: 9px; display: grid; min-width: 0; pointer-events: none; }
.ui-cxm__name, .ui-cxm__tokens { overflow: hidden; white-space: nowrap; -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 22px), transparent calc(100% - 4px)); mask-image: linear-gradient(90deg, #000 calc(100% - 22px), transparent calc(100% - 4px)); opacity: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__name { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-context-map-tile-ink); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tokens { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-context-map-tile-ink); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-context-map-tile-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tokens { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-context-map-tile-ink); font-variant-numeric: tabular-nums; }
.ui-cxm__name[data-show] { opacity: 1; }
/* The count is real text: full ink, no opacity (1.4.3) */
.ui-cxm__tokens[data-show] { opacity: 1; }
.ui-cxm__kind { opacity: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-cxm__kind[data-show] { opacity: 1; }
.ui-cxm__tile[data-kind="free"] :is(.ui-cxm__name, .ui-cxm__tokens) { color: var(--tc-text-muted); }
/* Every kind's colors in one place */
[data-ui="cxm"] [data-kind="system"] { --tc-context-map-tile-bg: var(--tc-fill-default); --tc-context-map-tile-edge: var(--tc-border-strong); --tc-context-map-tile-ink: var(--tc-text-secondary); }
[data-ui="cxm"] [data-kind="tools"] { --tc-context-map-tile-bg: var(--tc-context-map-tools-bg); --tc-context-map-tile-edge: var(--tc-context-map-tools-edge); --tc-context-map-tile-ink: var(--tc-context-map-tools-ink); }
[data-ui="cxm"] [data-kind="memory"] { --tc-context-map-tile-bg: var(--tc-context-map-memory-bg); --tc-context-map-tile-edge: var(--tc-context-map-memory-edge); --tc-context-map-tile-ink: var(--tc-context-map-memory-ink); }
[data-ui="cxm"] [data-kind="file"] { --tc-context-map-tile-bg: var(--tc-context-map-file-bg); --tc-context-map-tile-edge: var(--tc-context-map-file-edge); --tc-context-map-tile-ink: var(--tc-context-map-file-ink); }
[data-ui="cxm"] [data-kind="chat"] { --tc-context-map-tile-bg: var(--tc-context-map-chat-bg); --tc-context-map-tile-edge: var(--tc-context-map-chat-edge); --tc-context-map-tile-ink: var(--tc-context-map-chat-ink); }
[data-ui="cxm"] [data-kind="result"] { --tc-context-map-tile-bg: var(--tc-context-map-result-bg); --tc-context-map-tile-edge: var(--tc-context-map-result-edge); --tc-context-map-tile-ink: var(--tc-context-map-result-ink); }
[data-ui="cxm"] [data-kind="summary"] { --tc-context-map-tile-bg: var(--tc-context-map-summary-bg); --tc-context-map-tile-edge: var(--tc-context-map-summary-edge); --tc-context-map-tile-ink: var(--tc-context-map-summary-ink); }
/* ----- The window over a tile ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip { position: absolute; top: 0; left: 0; z-index: 5; display: grid; gap: var(--tc-space-0-5); width: max-content; max-width: 320px; padding: var(--tc-space-2-5) var(--tc-space-3-5) var(--tc-space-3); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-cxm-tip var(--tc-duration-fast) var(--tc-ease-move) both; }
/* ----- The window over a tile ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip { position: absolute; top: 0; left: 0; z-index: 5; display: grid; gap: var(--tc-space-0-5); width: max-content; max-width: 300px; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2-5); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-cxm-tip-clean var(--tc-duration-fast) var(--tc-ease-move) both; }
.ui-cxm__tip-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__swatch { flex: none; width: 10px; height: 10px; border-radius: var(--tc-radius-2xs); background: var(--tc-context-map-tile-bg); box-shadow: inset 0 0 0 1px var(--tc-context-map-tile-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-name { overflow: hidden; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* What's inside: each with its logo, in two columns */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-items { display: grid; grid-template-columns: repeat(2, max-content); gap: var(--tc-space-2) var(--tc-space-4-5); margin: var(--tc-space-2) 0 0; padding: var(--tc-space-2) 0 0; border-top: 1px solid var(--tc-border-default); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-items li { display: flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-items .ui-cxm__logo,
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-head .ui-cxm__logo { width: 20px; height: 20px; border-radius: var(--tc-radius-sm); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-items .ui-cxm__logo > svg,
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-head .ui-cxm__logo > svg { width: 11px; height: 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__swatch { flex: none; width: 9px; height: 9px; border-radius: 2.5px; background: var(--tc-context-map-tile-bg); box-shadow: inset 0 0 0 0.5px var(--tc-context-map-tile-edge); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-name { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* What's inside: each with its logo, in two columns */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-items { display: grid; grid-template-columns: repeat(2, max-content); gap: var(--tc-space-1-5) var(--tc-space-4); margin: var(--tc-space-2) 0 0; padding: var(--tc-space-2) 0 0; border-top: 0.5px solid var(--tc-border-default); list-style: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-items li { display: flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-items .ui-cxm__logo,
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-head .ui-cxm__logo { width: 18px; height: 18px; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-items .ui-cxm__logo > svg,
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-head .ui-cxm__logo > svg { width: 10px; height: 10px; }
.ui-cxm__icon { display: inline-flex; vertical-align: -2px; margin-right: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__icon > svg { width: 13px; height: 13px; border-radius: var(--tc-radius-2xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-detail { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* What the compaction did with the block, in the window */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-fate { display: flex; align-items: center; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__icon > svg { width: 12px; height: 12px; border-radius: var(--tc-radius-2xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-detail { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
/* What the compaction did with the block, in the window */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-fate { display: flex; align-items: center; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-cxm__tip-fate > svg { flex: none; width: 12px; height: 12px; }
.ui-cxm__tip-fate:is([data-fate="summarized"], [data-fate="summary"]) { color: var(--tc-context-map-summary-ink); }
.ui-cxm__tip-fate[data-fate="dropped"] { color: var(--tc-text-muted); }
/* ----- Before a compaction: each block marked by what happened to it ----- */
/* Summarized: its own tint, a dashed edge in its own color, and "→ summary" in green */
.ui-cxm__tile[data-fate="summarized"] { box-shadow: none; outline: 1.5px dashed color-mix(in srgb, var(--tc-context-map-tile-ink) 55%, transparent); outline-offset: -1.5px; }
/* Dropped: greyed out, its name struck through */
.ui-cxm__tile[data-fate="dropped"] { filter: grayscale(1); --tc-context-map-tile-bg: var(--tc-fill-subtle); --tc-context-map-tile-edge: var(--tc-border-default); --tc-context-map-tile-ink: var(--tc-text-muted); }
.ui-cxm__tile[data-fate="dropped"] .ui-cxm__name { text-decoration: line-through; }
/* After: the summary they went into carries a ring */
.ui-cxm__tile[data-fate="summary"] { box-shadow: inset 0 0 0 1px var(--tc-context-map-summary-edge); }
/* Summarized: a small grey mark in the top right corner */
.ui-cxm__badge { position: absolute; top: 6px; right: 6px; z-index: 1; display: grid; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs); background: var(--tc-fill-hover); color: var(--tc-text-muted); pointer-events: none; animation: ui-cxm-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
.ui-cxm__badge > svg { width: 11px; height: 11px; }
/* A pinned card's block: a quiet ring in its own color */
.ui-cxm__tile[data-pinned] { box-shadow: inset 0 0 0 1.5px var(--tc-context-map-tile-ink); }
.ui-cxm__tile[data-fate="summarized"][data-pinned] { outline-style: solid; }
.ui-cxm__tile { cursor: pointer; }
.ui-cxm__tile[data-kind="free"] { cursor: default; }
/* Each block's button covers its tile; the focus ring sits inside the tile, which clips what sticks out */
.ui-cxm__hit { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; border-radius: inherit; background: none; font: inherit; color: inherit; cursor: pointer; }
.ui-cxm__hit:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-cxm__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The line under the map: before → after, then how many blocks went which way */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__fates { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-4); min-height: 18px; margin: var(--tc-space-2-5) 0 0; padding: 0 var(--tc-space-2-5) var(--tc-space-2); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* The line under the map: before → after, then how many blocks went which way */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__fates { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-4); min-height: 16px; margin: var(--tc-space-2-5) 0 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-cxm__fates b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-cxm__fates--none { color: var(--tc-text-muted); }
.ui-cxm__fate { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__fate::before { content: ""; flex: none; width: 9px; height: 9px; border-radius: 2.5px; background: var(--tc-fill-default); box-shadow: inset 0 0 0 1.5px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__fate::before { content: ""; flex: none; width: 8px; height: 8px; border-radius: 2.5px; background: var(--tc-fill-default); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-cxm__fate[data-fate="summarized"]::before { background: none; box-shadow: none; outline: 1px dashed var(--tc-text-muted); outline-offset: -1px; }
.ui-cxm__fate[data-fate="dropped"]::before { opacity: 0.45; }
/* ----- Narrow: a shorter area, the numbers on their own line ----- */
@container ui-cxm (max-width: 480px) {
  /* The count on the left, Before | After and the share together on the right */
.ui-cxm__compare { order: 2; margin-left: auto; }
  /* As tall as the switch from the start, so the row doesn't grow when it appears */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__sum { min-height: 28px; }
  /* Room for the summary line's two rows, so it takes the placeholder's place without growing */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__fates { min-height: 40px; align-content: flex-start; }
.ui-cxm__pct { order: 3; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
.ui-cxm__area { --tc-context-map-height: 240px; }
  /* As tall as the switch from the start, so the row doesn't grow when it appears */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__sum { min-height: 24px; }
  /* Room for the summary line's two rows, so it takes the placeholder's place without growing */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__fates { min-height: 36px; align-content: flex-start; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
}
@keyframes ui-cxm-fade { from { opacity: 0; } }
@keyframes ui-cxm-shine { from { background-position: 100% 0; } to { background-position: 0 0; } }
.ui-cxm__spin { flex: none; width: 12px; height: 12px; animation: ui-cxm-spin 800ms steps(8) infinite; }
@keyframes ui-cxm-spin { to { transform: rotate(360deg); } }
@keyframes ui-cxm-tip { from { opacity: 0; transform: translateY(4px) scale(0.96); } }
@keyframes ui-cxm-tip-clean { from { opacity: 0; transform: translateY(3px) scale(0.97); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="cxm"] *, [data-ui="cxm"] *::before, [data-ui="cxm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-context-map")) customElements.define("tc-context-map", TcContextMap);

declare global {
  interface HTMLElementTagNameMap {
    "tc-context-map": TcContextMap;
  }
}
