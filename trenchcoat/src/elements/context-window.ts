import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OnScreenController, rescueFocus } from "./internal/controllers";

/*
 * <tc-context-window> – the Lit port of src/components/context-window.tsx: what fills an AI model's context right now,
 * and what you can do about it. The window is drawn as a field of small cells: every cell is a slice of the token
 * limit, colored by what sits in it – system prompt, tools, files, the conversation, memory. Empty cells are the room
 * that is left.
 *   · hover a part and its cells stay lit while the rest fades; the big number rolls to that part
 *   · open a part with items (files, tools) and remove single ones – the cells empty in a sweep and everything moves up
 *   · press Compact on the conversation: its cells shimmer while it works, then most of them clear
 *   · the percentage turns amber before the window is full, and the gray tray says how much is left
 *
 *   <tc-context-window limit="200000" .parts=${[{ id: "chat", label: "Conversation", tokens: 24000, compact: true }]}>
 *   </tc-context-window>
 *
 * Standard puts the header on a gray tray above a white card. Clean is one white card with hairline shadows: the header
 * is its first row, the caption and the action sit in its last row instead of on a gray tray, the percentage is a tag, the icons are 16px with finer strokes, and "Compacting…" shimmers.
 * The host is the group, named by the heading.
 */

/** A gauge: how full the window is */
const windowIcon = svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`;

export type ContextItem = { id: string; label: string; tokens: number };

export type ContextPart = {
  id: string;
  label: string;
  /** Tokens of this part – ignored when `items` are given (then it is their sum) */
  tokens?: number;
  /** Single things inside this part that can be removed, e.g. attached files */
  items?: ContextItem[];
  /** Nothing can be removed or compacted here, e.g. the system prompt */
  locked?: boolean;
  /** Shows a Compact button. A number is the share that stays after compacting (default 0.3) */
  compact?: boolean | number;
  /** Any CSS color – defaults to a fixed palette in the order of the parts */
  color?: string;
};

/** Compacts a part; the cells shimmer until the returned promise settles, a rejection says so */
export type ContextCompactAction = (partId: string, options: { signal: AbortSignal }) => void | Promise<void>;

/** Which items a part holds – a removal made here holds only while the part still has the same ones */
const itemsKey = (p: ContextPart) => p.items?.map((it) => it.id).join("\u0000") ?? "";

/* ---------- Helpers ---------- */

const PALETTE = [
  "var(--tc-context-window-series-1)",
  "var(--tc-context-window-series-2)",
  "var(--tc-context-window-series-3)",
  "var(--tc-context-window-series-4)",
  "var(--tc-context-window-series-5)",
  "var(--tc-context-window-series-6)",
];
const tokens = (n: number) => {
  const v = Math.max(0, n);
  if (v >= 999_950) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return `${Math.round(v)}`;
};
/** For numbers that stand still: 200K instead of 200.0K */
const plain = (n: number) => tokens(n).replace(/\.0(?=[KM]$)/, "");
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/* ---------- Icons: Standard draws 12px icons with 1.4px strokes, Clean 16px ones with 1.1px strokes ---------- */

const stroked = (clean: boolean, d: string, width?: number) => svg`<path d=${d} stroke="currentColor" stroke-width=${width ?? (clean ? 1.1 : 1.4)} stroke-linecap="round" stroke-linejoin="round"></path>`;
const chevronIcon = (clean: boolean) =>
  clean
    ? html`<svg class="ui-cw__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${stroked(clean, "m5 6.75 3 3 3-3")}</svg>`
    : html`<svg class="ui-cw__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroked(clean, "m3 4.5 3 3 3-3")}</svg>`;
const closeIcon = (clean: boolean) =>
  clean
    ? html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${stroked(clean, "m5 5 6 6m0-6-6 6")}</svg>`
    : html`<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">${stroked(clean, "m2.5 2.5 5 5m0-5-5 5")}</svg>`;
const doneIcon = (clean: boolean) => html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroked(clean, "m2.6 6.3 2.2 2.2 4.6-5", clean ? 1.3 : 1.6)}</svg>`;
const compactIcon = (clean: boolean) => html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroked(clean, "M6 1.5v3m0 0L4.6 3.1M6 4.5l1.4-1.4M6 10.5v-3m0 0L4.6 8.9M6 7.5l1.4 1.4M2 6h8")}</svg>`;
const arrowIcon = (clean: boolean) =>
  clean
    ? html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${stroked(clean, "M3.5 8h9M9 4.5 12.5 8 9 11.5")}</svg>`
    : html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroked(clean, "M2.5 6h7M6.5 3l3 3-3 3")}</svg>`;

type Part = Omit<ContextPart, "items" | "tokens" | "color"> & { items: ContextItem[] | undefined; raw: number; tokens: number; color: string };
/** Text that changes without a jump: the old line stays for a moment and fades out underneath while the new one fades in */
type SwapLine = { id: string; tone?: string; content: unknown };
type Swap = { last: SwapLine | null; out: SwapLine | null; timer: number };

let uid = 0;

/**
 * What fills a model's context window, as a field of cells per part, with removal and compaction.
 * @tag tc-context-window
 * @fires tc-remove-item - An item was removed (`{ partId: string; itemId: string }`); it stays hidden until `parts` brings a different list of items for that part
 * @fires tc-compact - Compact was pressed (`{ partId: string }`); `onCompact` may return a promise the cells wait for
 * @fires tc-action - The tray's action button was pressed (`{ label: string }`)
 */
export class TcContextWindow extends TcElement {
  static override ui = "cw";

  /** The heading, and the group's name */
  @property() accessor heading = "Context window";
  /** What fills the window, in order – each part takes the next run of cells */
  @property({ attribute: false }) accessor parts: ContextPart[] = [];
  /** Size of the context window in tokens */
  @property({ type: Number }) accessor limit = 0;
  /** Small tag in the head, e.g. the model name */
  @property() accessor model = "";
  /** Logo in front of the model name, an element that's cloned, sized to 12px */
  @property({ attribute: false }) accessor modelIcon: Element | undefined = undefined;
  /** Label of a button on the tray (Clean: in the card's last row), e.g. "New chat" – it fires tc-action */
  @property({ attribute: "action-label" }) accessor actionLabel = "";
  /** Share of the limit from which the card warns (0–1) */
  @property({ type: Number, attribute: "warn-at" }) accessor warnAt = 0.8;
  /** Number of cells and how many sit in one row */
  @property({ type: Number }) accessor cells = 216;
  /** How many cells sit in one row (two thirds of it, at least 8, in a narrow container) */
  @property({ type: Number }) accessor columns = 36;
  /**
   * Called when Compact is pressed; the cells shimmer until the returned promise settles, and a rejection says so and
   * leaves Compact to press again. The signal aborts when the element is removed. Once it settles the part shows its
   * `compact` share at once, until `parts` brings a new size for it
   */
  @property({ attribute: false }) accessor onCompact: ContextCompactAction | undefined = undefined;

  /** @internal Removals made here: a removal holds while the part has the same items (the value is that list) */
  @state() accessor removed: Record<string, string> = {};
  /** @internal Compactions made here: they hold while the part has the same size (raw is that size) */
  @state() accessor shrunk: Record<string, { raw: number; to: number }> = {};
  /** @internal Items that are folding away before they go */
  @state() accessor leaving: Record<string, true> = {};
  /** @internal */
  @state() accessor busy: string | null = null;
  /** @internal */
  @state() accessor opened: string | null = null;
  /** @internal */
  @state() accessor hot: string | null = null;
  /** @internal */
  @state() accessor saved: { id: number; amount: number } | null = null;
  /** @internal */
  @state() accessor notice: { id: number; text: string } | null = null;
  /** @internal */
  @state() accessor failed: { id: number; label: string } | null = null;
  /** @internal Size of each part right after it was compacted; the button comes back once the part has grown again */
  @state() accessor compacted: Record<string, number> = {};
  /** @internal After compacting, the button says "Compacted" for a moment, then folds away */
  @state() accessor farewell: { id: string; leaving: boolean } | null = null;

  private uid = `tc-cw-${++uid}`;
  /** The parts as shown – removals and compactions made here applied */
  private list: Part[] = [];
  /** A parent that passes the smaller part a moment later: say how much that saved */
  private watch: { id: string; before: number; raw: number } | null = null;
  private said = 0;
  private failures = 0;
  private aborter: AbortController | null = null;
  private timers = new Map<string, number>();
  private waits = new Set<number>();
  private swaps: Record<"of" | "caption", Swap> = { of: { last: null, out: null, timer: 0 }, caption: { last: null, out: null, timer: 0 } };
  private screen = new OnScreenController(this);
  /** The rolling numbers: what they show now, and the frame that moves them */
  private rollShown: Record<string, number> | null = null;
  private rollSignature = "";
  private rollFrame = 0;

  constructor() {
    super();
    // Focus never drops to <body>: a removed item's × hands it to the next item's, then to the part's button; a
    // Compact button that folds away to the next control in the card
    new FocusRescueController(this, (key) => {
      const id = key?.slice(key.indexOf(":") + 1);
      if (!id) return null;
      const usable = (el: Element) => !el.closest("[inert]") && el.getAttribute("aria-disabled") !== "true";
      const row = this.querySelector(`.ui-cw__main[data-part="${CSS.escape(id)}"]`);
      const own = row?.closest(".ui-cw__part")?.querySelector<HTMLElement>(`.ui-cw__remove, .ui-cw__toggle`);
      if (own && usable(own)) return own;
      const all = [...this.querySelectorAll<HTMLElement>("button")].filter(usable);
      return (row && all.find((b) => row.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)) ?? all[all.length - 1] ?? null;
    });
    this.addEventListener("pointerleave", () => (this.hot = null));
  }

  override connectedCallback() {
    super.connectedCallback();
    // Aborted on removal: a compaction still running is told it's no longer wanted
    this.aborter = new AbortController();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.aborter?.abort();
    for (const t of this.timers.values()) window.clearTimeout(t);
    this.timers.clear();
    for (const t of this.waits) window.clearTimeout(t);
    this.waits.clear();
    for (const s of Object.values(this.swaps)) {
      window.clearTimeout(s.timer);
      s.timer = 0;
      s.out = null;
    }
    cancelAnimationFrame(this.rollFrame);
  }

  /** One timer per name: a new one replaces the last; all go when the element is removed */
  private later(name: string, ms: number, run: () => void) {
    window.clearTimeout(this.timers.get(name));
    this.timers.set(
      name,
      window.setTimeout(() => {
        this.timers.delete(name);
        run();
      }, ms),
    );
  }
  /** Resolves after `ms` – never, if the element is removed first */
  private wait(ms: number) {
    return new Promise<void>((resolve) => {
      const t = window.setTimeout(() => {
        this.waits.delete(t);
        resolve();
      }, ms);
      this.waits.add(t);
    });
  }

  private say(amount: number) {
    this.saved = { id: ++this.said, amount };
    this.later("saved", 3200, () => (this.saved = null));
  }
  /** A removal, for the status region only (the tray shows the new total) */
  private note(text: string) {
    this.notice = { id: ++this.said, text };
    this.later("notice", 3200, () => (this.notice = null));
  }
  private bidFarewell(id: string) {
    this.farewell = { id, leaving: false };
    this.later("farewell", 1500, () => {
      this.farewell = { id, leaving: true };
      this.later("farewell", 420, () => (this.farewell = null));
    });
  }

  private isCompacted(p: { id: string; tokens: number }) {
    return this.compacted[p.id] !== undefined && p.tokens <= this.compacted[p.id];
  }

  /* ---------- Actions ---------- */

  private async removeItem(partId: string, itemId: string, from: HTMLElement) {
    const key = `${partId}/${itemId}`;
    // Before the item goes inert: focus to the next item's ×, else the one before, else the part's button
    const li = from.closest(".ui-cw__fold--item");
    const near = (dir: "next" | "prev") => {
      for (let el = dir === "next" ? li?.nextElementSibling : li?.previousElementSibling; el; el = dir === "next" ? el.nextElementSibling : el.previousElementSibling)
        if (el.hasAttribute("data-open")) return el.querySelector(".ui-cw__remove");
      return null;
    };
    rescueFocus(li, [near("next"), near("prev"), li?.closest(".ui-cw__part")?.querySelector(".ui-cw__toggle")]);
    const label = this.parts.find((p) => p.id === partId)?.items?.find((it) => it.id === itemId)?.label;
    if (label) this.note(`Removed ${label}`);
    this.leaving = { ...this.leaving, [key]: true };
    if (!reducedMotion()) await this.wait(240);
    if (!this.isConnected) return;
    const { [key]: _gone, ...others } = this.leaving;
    this.leaving = others;
    const part = this.parts.find((p) => p.id === partId);
    if (part) this.removed = { ...this.removed, [key]: itemsKey(part) };
    this.emit("tc-remove-item", { partId, itemId });
  }

  private async compact(part: Part) {
    if (this.busy) return;
    this.busy = part.id;
    this.watch = null;
    this.failed = null;
    const before = part.tokens;
    let ok = true;
    const signal = this.aborter?.signal ?? new AbortController().signal;
    this.emit("tc-compact", { partId: part.id });
    // The shimmer runs at least long enough to be seen
    await Promise.all([
      Promise.resolve()
        .then(() => this.onCompact?.(part.id, { signal }))
        .catch(() => {
          ok = false;
        }),
      this.wait(reducedMotion() ? 0 : 1300),
    ]);
    if (!this.isConnected) return;
    this.busy = null;
    // A failed compaction isn't marked as done – the tray says so and the button stays, to try again
    if (!ok) {
      this.failures += 1;
      this.failed = { id: this.failures, label: part.label };
      this.later("failed", 4000, () => (this.failed = null));
      return;
    }
    // Compacted parts can't be compacted again – until they have grown past this size
    this.bidFarewell(part.id);
    const raw = this.list.find((p) => p.id === part.id)?.raw ?? part.raw;
    if (raw < before) {
      // The parent already passed the smaller part
      this.compacted = { ...this.compacted, [part.id]: raw };
      this.say(before - raw);
      return;
    }
    // The part shrinks here at once; when the parent passes a new size for it, that one shows instead
    const keep = typeof part.compact === "number" ? part.compact : 0.3;
    const after = Math.round(before * keep);
    this.shrunk = { ...this.shrunk, [part.id]: { raw, to: after } };
    this.compacted = { ...this.compacted, [part.id]: after };
    this.say(before - after);
    this.watch = { id: part.id, before, raw };
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.list = this.parts.map((p, i) => {
      const key = itemsKey(p);
      const items = p.items?.filter((it) => this.removed[`${p.id}/${it.id}`] !== key);
      const raw = items ? items.reduce((sum, it) => sum + it.tokens, 0) : (p.tokens ?? 0);
      const own = this.shrunk[p.id];
      return { ...p, items, raw, tokens: own && own.raw === raw ? Math.min(raw, own.to) : raw, color: p.color ?? PALETTE[i % PALETTE.length] };
    });
    // A parent that passes the smaller part a moment later: say how much that saved
    const watch = this.watch;
    if (watch) {
      const watched = this.list.find((p) => p.id === watch.id)?.raw ?? 0;
      if (watched !== watch.raw) {
        this.watch = null;
        // It grew instead (or the part went): nothing more to say
        if (watched < watch.before) {
          this.compacted = { ...this.compacted, [watch.id]: watched };
          this.say(watch.before - watched);
        }
      }
    }
    const used = this.list.reduce((sum, p) => sum + p.tokens, 0);
    const share = this.limit > 0 ? used / this.limit : 0;
    this.dataset.level = share >= 0.95 ? "full" : share >= this.warnAt ? "warn" : "ok";
  }

  protected override updated() {
    this.roll();
    // A line that was swapped out fades for a moment, then goes
    for (const s of Object.values(this.swaps)) {
      if (s.out && !s.timer)
        s.timer = window.setTimeout(() => {
          s.timer = 0;
          s.out = null;
          this.requestUpdate();
        }, 260);
    }
  }

  /** What the rolling numbers aim for: the total, the big figure (total or hovered part) and every row */
  private rollTarget() {
    const used = this.list.reduce((sum, p) => sum + p.tokens, 0);
    const hotPart = this.list.find((p) => p.id === this.hot);
    const target: Record<string, number> = { "#used": used, "#figure": hotPart ? hotPart.tokens : used };
    for (const p of this.list) target[p.id] = p.tokens;
    return target;
  }
  private percent = (n: number) => `${Math.round((n / Math.max(this.limit, 1)) * 100)}%`;
  private formatOf(key: string) {
    return key === "#used" ? this.percent : tokens;
  }

  /**
   * The numbers roll to their targets, each frame written into the text of the elements bound to them – no render per
   * frame. Lit renders the target text; this puts the previous value back before the first paint and the frame loop
   * takes it from there. Only the existing text node is written, so Lit's later updates still land.
   */
  private roll() {
    const to = this.rollTarget();
    const signature = JSON.stringify(to);
    if (signature === this.rollSignature) return;
    this.rollSignature = signature;
    cancelAnimationFrame(this.rollFrame);
    const from = { ...(this.rollShown ?? to) };
    const write = (values: Record<string, number>) => {
      for (const el of this.querySelectorAll<HTMLElement>("[data-roll]")) {
        const key = el.dataset.roll!;
        const text = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
        if (values[key] === undefined || !text) continue;
        const next = this.formatOf(key)(values[key]);
        if (text.nodeValue !== next) text.nodeValue = next;
      }
    };
    // Off screen (or with reduced motion) the numbers jump – no frame loop nobody sees
    if (!this.screen.onScreen || reducedMotion() || Object.keys(to).every((k) => from[k] === to[k])) {
      this.rollShown = to;
      write(to);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 640);
      const e = easeOutQuart(t);
      const next: Record<string, number> = {};
      for (const k in to) next[k] = (from[k] ?? to[k]) + (to[k] - (from[k] ?? to[k])) * e;
      this.rollShown = next;
      write(next);
      if (t < 1) this.rollFrame = requestAnimationFrame(step);
    };
    write(from);
    this.rollFrame = requestAnimationFrame(step);
  }

  /* ---------- Rendering ---------- */

  private swap(slot: "of" | "caption", id: string, content: unknown, tone?: string) {
    const s = this.swaps[slot];
    if (s.last && s.last.id !== id) {
      s.out = s.last;
      window.clearTimeout(s.timer);
      s.timer = 0;
    }
    s.last = { id, tone, content };
    const out = s.out;
    return html`<span class="ui-cw__swap">${out ? keyed(`out-${out.id}`, html`<span class="ui-cw__swap-item" data-out="" data-tone=${ifDefined(out.tone)} aria-hidden="true">${out.content}</span>`) : nothing}${keyed(id, html`<span class="ui-cw__swap-item" data-tone=${ifDefined(tone)}>${content}</span>`)}</span>`;
  }

  /** What the tray says */
  private caption(clean: boolean, hotPart: Part | undefined, level: string, used: number): { key: string; content: unknown; tone?: string } {
    const free = Math.max(0, this.limit - used);
    if (this.busy) return { key: "busy", content: clean ? html`<span class="ui-cw__shimmer" data-text="Compacting…">Compacting…</span>` : "Compacting…" };
    if (this.failed) return { key: `failed-${this.failed.id}`, content: html`Couldn't compact <b>${this.failed.label}</b> – try again`, tone: "error" };
    if (hotPart) {
      const pct = this.limit > 0 ? ((hotPart.tokens / this.limit) * 100).toFixed(hotPart.tokens / this.limit < 0.1 ? 1 : 0) : 0;
      return { key: `hot-${hotPart.id}`, content: html`<b>${hotPart.label}</b> · ${pct}% of the window` };
    }
    if (this.saved) return { key: `saved-${this.saved.id}`, content: html`Saved <b>${plain(this.saved.amount)}</b> tokens`, tone: "ok" };
    // Clean tints the warning in the last row too
    if (level !== "ok") return { key: level, content: level === "full" ? "Window is full" : `${plain(free)} left`, tone: clean ? level : undefined };
    return { key: "rest", content: `${plain(free)} free` };
  }

  private compactButton(p: Part, clean: boolean) {
    const busy = this.busy;
    const done = this.isCompacted(p);
    const leaving = this.farewell?.id === p.id && this.farewell.leaving;
    const disabled = Boolean(busy) || p.tokens === 0 || done;
    return html`<button
      type="button"
      class="ui-cw__compact"
      aria-label=${done ? `${p.label} is compacted` : `Compact ${p.label}`}
      aria-disabled=${ifDefined(disabled ? "true" : undefined)}
      data-focus-key=${`compact:${p.id}`}
      ?data-busy=${busy === p.id}
      ?data-done=${done}
      ?data-leaving=${leaving}
      @click=${() => {
        if (!this.busy && p.tokens > 0 && !this.isCompacted(p)) void this.compact(p);
      }}
      @focus=${() => (this.hot = p.id)}
      @blur=${() => (this.hot = null)}
    >${keyed(busy === p.id ? "icon-busy" : done ? "icon-done" : "icon-idle", html`<span class="ui-cw__compact-icon">${busy === p.id ? html`<span class="ui-cw__spinner"></span>` : done ? doneIcon(clean) : compactIcon(clean)}</span>`)}${keyed(done ? "text-done" : "text-idle", html`<span class="ui-cw__compact-text">${done ? "Compacted" : "Compact"}</span>`)}</button>`;
  }

  private partRow(p: Part, clean: boolean) {
    const isOpen = this.opened === p.id;
    const hot = this.hot;
    const showCompact = p.compact && !p.locked && (!this.isCompacted(p) || this.farewell?.id === p.id);
    return html`<li
      class="ui-cw__part"
      ?data-hot=${hot === p.id}
      ?data-dim=${!!hot && hot !== p.id}
      @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hot = p.id)}
    >
      <div class="ui-cw__row">
        <div class="ui-cw__main" data-part=${p.id}>
          <span class="ui-cw__swatch" style=${styleMap({ background: p.color })}></span>
          ${p.items
            ? html`<button
                type="button"
                class="ui-cw__label ui-cw__toggle"
                aria-expanded=${isOpen ? "true" : "false"}
                aria-controls=${`${this.uid}-${p.id}`}
                data-focus-key=${`part:${p.id}`}
                @click=${() => (this.opened = this.opened === p.id ? null : p.id)}
                @focus=${() => (this.hot = p.id)}
                @blur=${() => (this.hot = null)}
              >${p.label}<span class="ui-cw__open" ?data-open=${isOpen}>${chevronIcon(clean)}</span></button>`
            : html`<span class="ui-cw__label">${p.label}</span>`}
          ${showCompact ? this.compactButton(p, clean) : nothing}
          <span class="ui-cw__value" data-roll=${p.id}>${tokens(p.tokens)}</span>
        </div>
      </div>
      ${p.items
        ? html`<div id=${`${this.uid}-${p.id}`} class="ui-cw__fold" ?data-open=${isOpen} .inert=${!isOpen}>
            <div class="ui-cw__clip">
              <ul class="ui-cw__items">
                ${p.items.length === 0 ? html`<li class="ui-cw__empty">Nothing attached</li>` : nothing}
                ${repeat(
                  p.items,
                  (it) => it.id,
                  (it) => {
                    const gone = !!this.leaving[`${p.id}/${it.id}`];
                    return html`<li class="ui-cw__fold ui-cw__fold--item" ?data-open=${!gone} .inert=${gone}>
                      <div class="ui-cw__clip">
                        <div class="ui-cw__item">
                          <span class="ui-cw__item-label">${it.label}</span>
                          <span class="ui-cw__item-value">${tokens(it.tokens)}</span>
                          <button type="button" class="ui-cw__remove" aria-label=${`Remove ${it.label}`} data-focus-key=${`remove:${p.id}`} @click=${(e: Event) => void this.removeItem(p.id, it.id, e.currentTarget as HTMLElement)}>${closeIcon(clean)}</button>
                        </div>
                      </div>
                    </li>`;
                  },
                )}
              </ul>
            </div>
          </div>`
        : nothing}
    </li>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const list = this.list;
    const limit = this.limit;
    const used = list.reduce((sum, p) => sum + p.tokens, 0);
    const share = limit > 0 ? used / limit : 0;
    const level = this.dataset.level ?? "ok";
    const hotPart = list.find((p) => p.id === this.hot);
    const target = this.rollTarget();

    // Which part each cell belongs to: the parts fill the field in order, the rest stays empty
    const cells = this.cells;
    const perCell = limit / cells;
    const owner: (number | null)[] = new Array(cells).fill(null);
    let sum = 0;
    let from = 0;
    list.forEach((p, index) => {
      sum += p.tokens;
      const to = Math.min(cells, Math.max(p.tokens > 0 ? from + 1 : from, Math.round(sum / perCell)));
      for (let i = from; i < to; i++) owner[i] = index;
      from = to;
    });

    const caption = this.caption(clean, hotPart, level, used);
    // What a screen reader hears: results and warnings – not the caption, which also follows the pointer
    const busyLabel = this.busy ? list.find((p) => p.id === this.busy)?.label : null;
    const announcement = this.busy
      ? `Compacting ${busyLabel ?? ""}…`
      : this.failed
        ? `Couldn't compact ${this.failed.label} – try again`
        : this.saved
          ? `Saved ${plain(this.saved.amount)} tokens`
          : this.notice
            ? this.notice.text
            : level === "full"
              ? "Context window is full"
              : level === "warn"
                ? "Context window is almost full"
                : "";

    return html`
      ${cardHead({
        icon: windowIcon,
        title: this.heading,
        id: `${this.uid}-title`,
        aside: this.model ? html`<span class="ui-cw__model">${this.modelIcon ? html`<span class="ui-cw__model-icon">${this.modelIcon.cloneNode(true)}</span>` : nothing}<span>${this.model}</span></span>` : nothing,
      })}
      <div class="ui-cw__card">

        <div class="ui-cw__figure">
          <span class="ui-cw__big" aria-hidden="true" data-roll="#figure">${tokens(target["#figure"])}</span>
          <span class="ui-cw__of" aria-hidden="true">${this.swap("of", hotPart ? hotPart.id : "total", hotPart ? hotPart.label : `of ${plain(limit)} tokens`)}</span>
          <span class="ui-cw__pill" aria-hidden="true" data-roll="#used">${this.percent(used)}</span>
          <span class="ui-cw__sr">${tokens(used)} of ${tokens(limit)} tokens used, ${Math.round(share * 100)} percent</span>
        </div>

        <div
          class="ui-cw__field"
          aria-hidden="true"
          ?data-hot=${this.hot !== null && list.some((p) => p.id === this.hot)}
          style=${styleMap({ "--tc-context-window-cols": String(this.columns), "--tc-context-window-cols-narrow": String(Math.max(8, Math.round((this.columns * 2) / 3))) })}
        >
          ${owner.map((index, i) => {
            const part = index === null ? null : list[index];
            return html`<span
              class="ui-cw__cell"
              ?data-on=${!!part && this.hot === part.id}
              ?data-busy=${!!part && this.busy === part.id}
              ?data-free=${!part}
              style=${styleMap(part ? { "--i": String(i), "--tc-context-window-color": part.color } : { "--i": String(i) })}
              @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hot = part ? part.id : null)}
            ></span>`;
          })}
        </div>

        <ul class="ui-cw__parts">
          ${repeat(
            list,
            (p) => p.id,
            (p) => this.partRow(p, clean),
          )}
        </ul>
      </div>

      <div class="ui-cw__foot">
        <span class="ui-cw__sr" role="status">${announcement}</span>
        <span class="ui-cw__caption">${this.swap("caption", caption.key, caption.content, caption.tone)}</span>
        ${this.actionLabel ? html`<button type="button" class="ui-cw__action" @click=${() => this.emit("tc-action", { label: this.actionLabel })}>${this.actionLabel}${arrowIcon(clean)}</button>` : nothing}
      </div>
    `;
  }

  static override css = /* css */ `

:where([data-look="standard"], [data-look="standard"] *)[data-ui="cw"] {
  --tc-context-window-series-1: light-dark(#26262b, #e4e4e7);
  --tc-context-window-series-2: light-dark(#8d8d95, #8a8a92);
  --tc-context-window-series-3: light-dark(#c4c4ca, #55555c);
  --tc-context-window-series-4: light-dark(#2f6bff, #4f82ff);
  --tc-context-window-series-5: light-dark(#a9c4ff, #8fb1ff);
  --tc-context-window-series-6: #5f5f66;
  box-sizing: border-box;
  width: 100%;
  max-width: 360px;
  min-width: 0;
  container-type: inline-size;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="cw"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cw"] {
  /* The parts: the accent blue and its lighter tints first, then indigo, green and amber */
  --tc-context-window-series-1: light-dark(rgba(0, 96, 226, 0.765), #4d8dff);
  --tc-context-window-series-2: light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.7));
  --tc-context-window-series-3: light-dark(rgba(0, 96, 226, 0.26), rgba(77, 141, 255, 0.46));
  --tc-context-window-series-4: light-dark(rgba(91, 91, 214, 0.8), #7b7bec);
  --tc-context-window-series-5: light-dark(rgba(26, 154, 82, 0.72), #3ec27a);
  --tc-context-window-series-6: light-dark(rgba(232, 162, 12, 0.8), #f0b43a);
  /* Shimmer bands are lighter than what they run over */
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 360px;
  min-width: 0;
  container-type: inline-size;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cw"] *, [data-ui="cw"] *::before, [data-ui="cw"] *::after { box-sizing: border-box; }
:where([data-ui="cw"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cw"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cw"] svg { display: block; flex: none; }
[data-ui="cw"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
[data-ui="cw"] ul { margin: 0; padding: 0; list-style: none; }
.ui-cw__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__card { position: relative; padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-2); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__model { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); max-width: 180px; height: 20px; padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__card { position: relative; padding: 0 var(--tc-space-4) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__model { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); max-width: 180px; height: 20px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-cw__model > span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-cw__model-icon { display: grid; flex: none; place-items: center; width: 12px; height: 12px; }
.ui-cw__model-icon > * { width: 12px; height: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__figure { display: flex; align-items: baseline; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__big { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__of { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__pill { align-self: baseline; flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; transition: color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cw"][data-level="warn"] .ui-cw__pill { color: var(--tc-status-warning-fg); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cw"][data-level="full"] .ui-cw__pill { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__figure { display: flex; align-items: center; gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__big { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-strong); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__of { flex: 1; min-width: 0; overflow: hidden; padding-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* The share as a small tag – tinted amber, then red, as the window fills up */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__pill { flex: none; height: 20px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; transition: color var(--tc-duration-slow) var(--tc-ease-standard), background-color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cw"][data-level="warn"] .ui-cw__pill { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cw"][data-level="full"] .ui-cw__pill { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The field: one cell per slice of the window. Changes sweep through it cell by cell */
.ui-cw__field { display: grid; grid-template-columns: repeat(var(--tc-context-window-cols), minmax(0, 1fr)); gap: var(--tc-space-0-5); margin-top: var(--tc-space-2-5); }
.ui-cw__cell { position: relative; aspect-ratio: 1; background: var(--tc-context-window-color); transition: background-color var(--tc-duration-slower) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move); transition-delay: calc(var(--i) * 2ms), 0ms, 0ms; }
/* Standard cells are rounded squares (a quarter of their size), Clean cells sharp */
:where([data-look="standard"], [data-look="standard"] *).ui-cw__cell { border-radius: 26%; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell { border-radius: var(--tc-radius-2xs); }
.ui-cw__cell[data-free] { background: var(--tc-fill-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__field[data-hot] .ui-cw__cell:not([data-on], [data-free]) { opacity: 0.22; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__cell[data-on] { transform: scale(1.12); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__cell[data-busy] { animation: ui-cw-wave var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite; animation-delay: calc(var(--i) * 15ms); }
/* ----- Parts ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cw__parts { margin-top: var(--tc-space-2) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__part { margin: 0 -8px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__part[data-hot] { background: var(--tc-fill-default); }
/* While another part is lit, the rest step back: their swatch fades and the text turns muted – still readable */
.ui-cw__part[data-dim] .ui-cw__swatch { opacity: 0.35; }
.ui-cw__part[data-dim] :is(.ui-cw__label, .ui-cw__value) { color: var(--tc-text-muted); }
.ui-cw__swatch { transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__row { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__main { position: relative; display: flex; flex: 1; align-items: center; gap: var(--tc-space-2); min-width: 0; height: 30px; border-radius: var(--tc-radius-md); }
/* A part's button stretches over its whole row; Compact sits above it */
.ui-cw__toggle::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.ui-cw__main > .ui-cw__toggle { border-radius: inherit; }
[data-ui="cw"] .ui-cw__toggle:focus-visible { outline: none; }
.ui-cw__main:has(> .ui-cw__toggle:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-cw__compact { position: relative; z-index: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__swatch { flex: none; width: 7px; height: 7px; border-radius: var(--tc-radius-2xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__label { display: flex; flex: 1; align-items: center; gap: var(--tc-space-1); min-width: 0; overflow: hidden; color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__value { flex: none; min-width: 52px; text-align: right; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__open { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-text-muted); }
.ui-cw__chevron { transition: transform var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__field[data-hot] .ui-cw__cell:not([data-on], [data-free]) { opacity: 0.25; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell[data-on] { transform: scale(1.1); }
/* Compacting: a lighter wave washes through the part's cells */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--tc-shimmer); opacity: 0; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell[data-busy] { animation: ui-cw-wave-clean var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite; animation-delay: calc(var(--i) * 15ms); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell[data-busy]::after { animation: ui-cw-shine var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite; animation-delay: calc(var(--i) * 15ms); }
/* ----- Parts ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__parts { margin-top: var(--tc-space-2-5) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__part { margin: 0 -8px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); transition: background-color var(--tc-duration-quick) var(--tc-ease-decelerate); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__part[data-hot] { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__row { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 32px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__main { position: relative; display: flex; flex: 1; align-items: center; gap: var(--tc-space-2-5); min-width: 0; height: 32px; border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__label { display: flex; flex: 1; align-items: center; gap: var(--tc-space-0-5); min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__value { flex: none; min-width: 52px; text-align: right; color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__part[data-hot] .ui-cw__value { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__open { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted); }
.ui-cw__open[data-open] .ui-cw__chevron { transform: rotate(180deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: 24px; margin-right: -10px; padding: 0 var(--tc-space-1-5) 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact:hover:not([aria-disabled="true"]) { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: 24px; margin-right: -8px; padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact:hover:not([aria-disabled="true"]) { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-cw__compact[aria-disabled="true"] { cursor: default; opacity: 0.5; }
.ui-cw__compact[data-busy] { opacity: 1; color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact[data-done] { opacity: 1; color: var(--tc-status-success-fg); }
.ui-cw__compact[data-leaving] { animation: ui-cw-leave var(--tc-duration-slower) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact[data-done] { opacity: 1; background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cw__compact-icon { display: grid; place-items: center; width: 12px; height: 12px; animation: ui-cw-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-cw__compact-text { animation: ui-cw-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__spinner { width: 12px; height: 12px; border: 1.5px solid var(--tc-border-default); border-top-color: var(--tc-text-primary); border-radius: var(--tc-radius-full); animation: ui-cw-spin var(--tc-duration-reveal) linear infinite; }
/* Items of a part unfold in place; a removed one folds away before it goes */
.ui-cw__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-cw__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-instant); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__spinner { width: 11px; height: 11px; border: 1.25px solid var(--tc-fill-default); border-top-color: var(--tc-accent); border-radius: var(--tc-radius-full); animation: ui-cw-spin var(--tc-duration-reveal) linear infinite; }
.ui-cw__fold--item { transition-duration: var(--tc-duration-moderate), var(--tc-duration-base); }
.ui-cw__clip { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__items { padding: 0 0 var(--tc-space-2) var(--tc-space-4) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__item { display: flex; align-items: center; gap: var(--tc-space-2); height: 28px; font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__item-label { flex: 1; min-width: 0; overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__items { padding: 0 0 var(--tc-space-1-5) var(--tc-space-4-5) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__item { display: flex; align-items: center; gap: var(--tc-space-2); height: 28px; margin-right: -4px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__item-label { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
.ui-cw__item-value { flex: none; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__remove { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__remove { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cw__remove:hover { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__empty { height: 28px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-display-sm); color: var(--tc-text-muted); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cw__foot { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 38px; padding: var(--tc-space-1) var(--tc-space-1) 0 var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__empty { height: 28px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-display-sm); color: var(--tc-text-muted); }
/* ----- The last row ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__foot { display: flex; align-items: center; gap: var(--tc-space-2); height: 44px; padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-cw__swap { display: grid; min-width: 0; }
.ui-cw__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-cw-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-cw__swap-item[data-out] { animation: ui-cw-swap-out var(--tc-duration-base) var(--tc-ease-standard) both; }
.ui-cw__swap-item[data-tone="ok"] { color: var(--tc-status-success-fg); }
.ui-cw__swap-item[data-tone="ok"] b { color: inherit; }
.ui-cw__swap-item[data-tone="error"], .ui-cw__swap-item[data-tone="error"] b { color: var(--tc-status-danger-fg); }
/* The tray's action: the library's ghost button */
:where([data-look="standard"], [data-look="standard"] *).ui-cw__action { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__action:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cw__action svg { transition: transform var(--tc-duration-base) var(--tc-ease-move), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cw__action:hover svg { transform: translateX(2px); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__swap-item[data-tone="warn"] { color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__swap-item[data-tone="full"] { color: var(--tc-status-danger-fg); }
/* The secondary button, as Button draws it */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 8px 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-normal); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action:hover svg { color: var(--tc-text-primary); }
/* Shimmer over the working caption – a lighter band runs through the gray text */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__shimmer { position: relative; display: inline-block; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__shimmer::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-shimmer) 50%, transparent 62%) 100% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-cw-sweep var(--tc-duration-shimmer) linear 3;
  pointer-events: none;
}
@keyframes ui-cw-leave { to { opacity: 0; filter: blur(3px); transform: scale(0.92); } }
@keyframes ui-cw-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-cw-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
@keyframes ui-cw-wave { 0%, 100% { opacity: 1; transform: none; } 50% { opacity: 0.28; transform: scale(0.72); } }
@keyframes ui-cw-wave-clean { 0%, 100% { transform: none; } 50% { transform: scale(0.82); } }
@keyframes ui-cw-shine { 0%, 100% { opacity: 0; } 50% { opacity: 0.75; } }
@keyframes ui-cw-spin { to { transform: rotate(360deg); } }
/* Narrow cards: fewer cells per row so they stay readable, the model tag gives way and Compact keeps only its icon */
@container (max-width: 310px) {
:where([data-look="standard"], [data-look="standard"] *).ui-cw__model { max-width: 120px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__field { grid-template-columns: repeat(var(--tc-context-window-cols-narrow), minmax(0, 1fr)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact { padding: 0 var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact-text { display: none; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-cw__row { min-height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__main { height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact { height: 30px; padding: 0 var(--tc-space-2) 0 var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__item { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__remove { width: 30px; height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__action { height: 30px; }
}
@keyframes ui-cw-sweep { from { background-position: 100% 0; } to { background-position: 0% 0; } }
/* Narrow cards: fewer cells per row so they stay readable, the model tag gives way and Compact keeps only its icon */
@container (max-width: 310px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cw__card { padding: 0 var(--tc-space-3-5) var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__model { max-width: 120px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__field { grid-template-columns: repeat(var(--tc-context-window-cols-narrow), minmax(0, 1fr)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact { padding: 0 var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact-text { display: none; }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-cw__row { min-height: 38px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__main { height: 38px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact { height: 30px; padding: 0 var(--tc-space-2) 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__item { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__remove { width: 30px; height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__foot { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action { height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cw"] *, [data-ui="cw"] *::before, [data-ui="cw"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-context-window")) customElements.define("tc-context-window", TcContextWindow);

declare global {
  interface HTMLElementTagNameMap {
    "tc-context-window": TcContextWindow;
  }
}
