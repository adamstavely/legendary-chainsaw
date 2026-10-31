import { html, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-chat-minimap> – a slim rail beside a long chat with a tick for each thing the person asked, longer for longer
 * messages, and the one in view lit. Pointing at a tick shows the message; a click scrolls the chat to it. It follows
 * the chat's scrolling by itself – give it the scroller (`scrollRoot`, else the page) and each message's element id
 * (`target`, else `id`) – or set `manual` and drive `current` yourself.
 *   · a `listbox` named by `label` with one tab stop: ↑ / ↓ move (showing the message), Home / End go to the ends,
 *     Enter or Space jumps; the message in view is the selected option
 *   · the jump is smooth, or instant with reduced motion; while it runs, the rail doesn't follow the scrolling
 * Both looks are the bare rail; ticks are muted and the one in view is the accent colour.
 *
 *   <tc-chat-minimap .items=${[{ id: "m1", text: "Summarise the audit findings" }, …]} .scrollRoot=${chat}></tc-chat-minimap>
 */

export type ChatMarker = {
  /** Unique within the rail */
  id: string;
  /** The message as the person wrote it; shown on hover, and its length sets the tick's */
  text: string;
  /** The id of the message's element in the chat, when it isn't `id` */
  target?: string;
};

/** Details of the events */
export type ChatMinimapJump = { id: string; item: ChatMarker };
export type ChatMinimapCurrentChange = {
  /** The message in view; null when there are none */
  current: string | null;
};

let uidCount = 0;
/** How far down the scroller a message's top must reach to count as the one in view */
const READ_LINE = 0.5;
/** How long a jump may scroll before the rail follows the scrolling again, without a scrollend event */
const JUMP_MS = 900;
/** The most of a message shown on hover */
const TIP_CHARS = 140;

const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A rail of ticks beside a long chat, one per message the person sent – the one in view lit, the message on hover, a
 * click to jump – that follows the chat's scrolling.
 * @tag tc-chat-minimap
 * @fires tc-jump - A tick was chosen ({ id, item }: ChatMinimapJump); cancelable – prevented, the chat doesn't scroll
 * @fires tc-current-change - The message in view changed ({ current }: ChatMinimapCurrentChange); cancelable – prevented, `current` stays as it was
 */
export class TcChatMinimap extends TcElement {
  static override ui = "cmm";

  /** What the rail is – its accessible name */
  @property() accessor label = "Your messages";
  /** The person's messages, oldest first */
  @property({ attribute: false }) accessor items: ChatMarker[] = [];
  /** The id of the message in view. Followed from the scrolling unless `manual`, and set by a jump */
  @property() accessor current: string | null = null;
  /** The element the chat scrolls in; by default the page */
  @property({ attribute: false }) accessor scrollRoot: Element | null = null;
  /** Leaves `current` to the page: the rail neither follows the scrolling nor scrolls on a jump */
  @property({ type: Boolean }) accessor manual = false;
  /** Which side of the rail a message shows on */
  @property({ attribute: "tip-side" }) accessor tipSide: "left" | "right" = "left";

  /** The tick moved to with the keys; shows its message */
  @state() private accessor active: string | null = null;
  private uid = `tc-cmm-${++uidCount}`;
  private watched: EventTarget | null = null;
  private frame = 0;
  private jumping: ReturnType<typeof setTimeout> | undefined;

  /* ---------- Following the chat ---------- */

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.unwatch();
    clearTimeout(this.jumping);
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has("scrollRoot") || changed.has("manual") || changed.has("items")) this.watch();
  }

  private watch() {
    const want: EventTarget | null = this.manual || !this.items.length ? null : (this.scrollRoot ?? window);
    if (want === this.watched) {
      if (want) this.queueFollow();
      return;
    }
    this.unwatch();
    if (!want) return;
    this.watched = want;
    want.addEventListener("scroll", this.onScroll, { passive: true });
    want.addEventListener("scrollend", this.onScrollEnd);
    this.queueFollow();
  }
  private unwatch() {
    this.watched?.removeEventListener("scroll", this.onScroll);
    this.watched?.removeEventListener("scrollend", this.onScrollEnd);
    this.watched = null;
    cancelAnimationFrame(this.frame);
  }
  private onScroll = () => this.queueFollow();
  private onScrollEnd = () => {
    if (this.jumping === undefined) return;
    clearTimeout(this.jumping);
    this.jumping = undefined;
    this.queueFollow();
  };
  private queueFollow() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.follow());
  }

  private targetOf(item: ChatMarker): HTMLElement | null {
    const root = this.getRootNode() as Document | ShadowRoot;
    const id = item.target ?? item.id;
    return root.getElementById?.(id) ?? document.getElementById(id);
  }

  /** The last message whose top has passed the reading line, else the first */
  private follow() {
    if (this.manual || this.jumping !== undefined || !this.items.length) return;
    const box = this.scrollRoot?.getBoundingClientRect() ?? { top: 0, height: window.innerHeight };
    const line = box.top + box.height * READ_LINE;
    let found: string | null = null;
    for (const item of this.items) {
      const el = this.targetOf(item);
      if (!el) continue;
      if (found === null || el.getBoundingClientRect().top <= line) found = item.id;
      if (el.getBoundingClientRect().top > line) break;
    }
    this.setCurrent(found);
  }

  private setCurrent(id: string | null) {
    if (id === this.current) return;
    if (!this.emit<ChatMinimapCurrentChange>("tc-current-change", { current: id }, { cancelable: true })) return;
    this.current = id;
  }

  /* ---------- Jumping ---------- */

  private jump(item: ChatMarker) {
    if (!this.emit<ChatMinimapJump>("tc-jump", { id: item.id, item }, { cancelable: true })) return;
    this.setCurrent(item.id);
    if (this.manual) return;
    const el = this.targetOf(item);
    if (!el) return;
    // Hold the rail on the chosen message until the scroll settles, rather than lighting each one it passes
    clearTimeout(this.jumping);
    this.jumping = setTimeout(() => {
      this.jumping = undefined;
      this.queueFollow();
    }, JUMP_MS);
    el.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
  }

  /* ---------- Keys and pointer ---------- */

  private get stop() {
    const ids = this.items.map((i) => i.id);
    if (this.active && ids.includes(this.active)) return this.active;
    if (this.current && ids.includes(this.current)) return this.current;
    return ids[0] ?? null;
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const at = this.items.findIndex((i) => i.id === this.stop);
    if (at < 0) return;
    let next: number | undefined;
    if (e.key === "ArrowDown") next = Math.min(this.items.length - 1, at + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = this.items.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.jump(this.items[at]);
      return;
    } else if (e.key === "Escape" && this.active) {
      this.active = null;
      return;
    }
    if (next === undefined) return;
    e.preventDefault();
    this.active = this.items[next].id;
  };

  private onFocus = () => {
    this.active = this.stop;
  };
  private onBlur = () => {
    this.active = null;
  };

  private onClick = (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement>("[data-id]");
    const item = el && this.items.find((i) => i.id === el.dataset.id);
    if (!item) return;
    this.active = null;
    this.jump(item);
  };

  /* ---------- Rendering ---------- */

  /** A tick's length, from the message's: short, medium or long */
  private size(text: string) {
    const n = text.trim().length;
    return n < 60 ? "sm" : n < 240 ? "md" : "lg";
  }
  private clip(text: string) {
    const t = text.trim().replace(/\s+/g, " ");
    return t.length > TIP_CHARS ? `${t.slice(0, TIP_CHARS - 1).trimEnd()}…` : t;
  }

  protected override render() {
    const items = this.items;
    return html`<div
      class="ui-cmm__rail"
      role="listbox"
      tabindex=${items.length ? 0 : -1}
      aria-label=${this.label}
      aria-activedescendant=${this.stop ? `${this.uid}-${this.stop}` : ""}
      data-tip-side=${this.tipSide}
      @keydown=${this.onKey}
      @focus=${this.onFocus}
      @blur=${this.onBlur}
      @click=${this.onClick}
    >
      ${items.map((item, i) => {
        const here = item.id === this.current;
        return html`<div
          class="ui-cmm__mark"
          role="option"
          id=${`${this.uid}-${item.id}`}
          data-id=${item.id}
          aria-selected=${here ? "true" : "false"}
          ?data-active=${item.id === this.active}
        >
          <span class="ui-cmm__tick" data-size=${this.size(item.text)} aria-hidden="true"></span>
          <span class="tc-sr-only">${this.clip(item.text)}, ${i + 1} of ${items.length}${here ? ", in view" : ""}</span>
          <span class="ui-cmm__tip" aria-hidden="true"
            ><span class="ui-cmm__tip-text">${this.clip(item.text)}</span><span class="ui-cmm__tip-meta">${i + 1} of ${items.length}</span></span
          >
        </div>`;
      })}
    </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cmm"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cmm"] {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  -webkit-font-smoothing: antialiased;
}
/* A tick's pitch, the three lengths, and the colours – override any of them on the element */
[data-ui="cmm"] { --tc-cmm-pitch: 16px; --tc-cmm-sm: 14px; --tc-cmm-md: 20px; --tc-cmm-lg: 28px; --tc-cmm-thick: 3px; --tc-cmm-thick-here: 4px; --tc-cmm-tip-width: 280px; --tc-cmm-tick: var(--tc-text-muted); --tc-cmm-here: var(--tc-accent-solid); }
[data-ui="cmm"] *, [data-ui="cmm"] *::before, [data-ui="cmm"] *::after { box-sizing: border-box; }
.ui-cmm__rail { display: grid; padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-md); outline: none; }
.ui-cmm__rail:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-cmm__mark { position: relative; display: flex; align-items: center; width: var(--tc-cmm-lg); height: var(--tc-cmm-pitch); cursor: pointer; }
.ui-cmm__tick { flex: none; width: var(--tc-cmm-md); height: var(--tc-cmm-thick); border-radius: var(--tc-radius-full); background: var(--tc-cmm-tick); transition: width var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cmm__tick[data-size="sm"] { width: var(--tc-cmm-sm); }
.ui-cmm__tick[data-size="lg"] { width: var(--tc-cmm-lg); }
.ui-cmm__mark:hover .ui-cmm__tick, .ui-cmm__mark[data-active] .ui-cmm__tick { background: var(--tc-text-primary); }
.ui-cmm__mark[aria-selected="true"] .ui-cmm__tick { width: var(--tc-cmm-lg); height: var(--tc-cmm-thick-here); background: var(--tc-cmm-here); }
/* The message, beside the rail */
.ui-cmm__tip { position: absolute; top: 50%; right: calc(100% + var(--tc-space-3)); z-index: 2; display: none; width: max-content; max-width: var(--tc-cmm-tip-width); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); box-shadow: var(--tc-card-shadow); transform: translateY(-50%); pointer-events: none; }
.ui-cmm__rail[data-tip-side="right"] .ui-cmm__tip { right: auto; left: calc(100% + var(--tc-space-3)); }
.ui-cmm__mark:hover .ui-cmm__tip, .ui-cmm__mark[data-active] .ui-cmm__tip { display: grid; gap: var(--tc-space-0-5); }
.ui-cmm__tip-text { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow-wrap: anywhere; }
.ui-cmm__tip-meta { font-size: var(--tc-font-size-xs); color: var(--tc-text-on-inverse); font-variant-numeric: tabular-nums; }
@media (forced-colors: active) {
  .ui-cmm__tick { background: GrayText; }
  .ui-cmm__mark[aria-selected="true"] .ui-cmm__tick { background: Highlight; }
  .ui-cmm__tip { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cmm"] *, [data-ui="cmm"] *::before, [data-ui="cmm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-chat-minimap")) customElements.define("tc-chat-minimap", TcChatMinimap);

declare global {
  interface HTMLElementTagNameMap {
    "tc-chat-minimap": TcChatMinimap;
  }
}
