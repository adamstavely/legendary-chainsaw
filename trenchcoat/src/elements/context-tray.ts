import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { FocusRescueController, RollingController, rescueFocus } from "./internal/controllers";

/*
 * <tc-context-tray> – what the model can see, as chips: files, @-mentions and sources, each with its token weight.
 * Pin one to keep it when the conversation is compacted, remove one with × (or Delete) and undo that from the tray;
 * the total runs against the window in a thin meter whose segments are the chips (hover a chip and its segment lights).
 *
 *   <tc-context-tray limit="200000" reserved="18400" .items=${[{ id: "spec", label: "billing-spec.md", tokens: 18600 }]}>
 *   </tc-context-tray>
 *
 * Every change – remove, restore (undo), pin, unpin – fires a cancelable `tc-items-change` ({ items, change }) and is
 * applied unless a listener calls preventDefault() (then the app owns `items`). A removed chip folds away; focus goes
 * to the next chip's same button, else the one before, else Undo. The chips are one toolbar: one Tab stop, ← → move
 * between their buttons, Home / End jump, Delete or Backspace removes the chip in focus, ⌘Z / Ctrl Z undoes the last
 * removal while focus is in the tray.
 *
 * Standard is a white card on a gray tray that holds the caption and Undo; Clean is one white card with hairline
 * shadows, the caption as its last row, quieter chips and thinner icons. The host is the group, named by the heading.
 */

export type ContextTrayItem = {
  id: string;
  label: string;
  /** Tokens this item takes in the window */
  tokens: number;
  /** "file", "mention", "source" – or your own (it picks the icon and the meter colour) */
  kind?: string;
  /** Kept in context when the conversation is compacted */
  pinned?: boolean;
  /** Shown as the chip's tooltip, e.g. a path or a URL */
  hint?: string;
  /** An icon element, cloned – in place of the kind's */
  icon?: Element;
};

export type ContextTrayChange = { type: "remove" | "restore" | "pin" | "unpin"; item: ContextTrayItem };
export type ContextTrayItemsChange = { items: ContextTrayItem[]; change: ContextTrayChange };
export type ContextTrayItemsChangeEvent = CustomEvent<ContextTrayItemsChange>;

/** How long a removed chip folds before it goes, in ms (--tc-duration-moderate) */
const FOLD = 260;

const tokens = (n: number) => {
  const v = Math.max(0, n);
  if (v >= 999_950) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return `${Math.round(v)}`;
};
/** For numbers that stand still: 200K instead of 200.0K */
const plain = (n: number) => tokens(n).replace(/\.0(?=[KM]$)/, "");

/* ---------- Icons: 24px paths; Standard strokes them at 1.8, Clean at 1.3 ---------- */

const PATHS: Record<string, string> = {
  file: "M7 3.5h6.5l4.5 4.5v12.5H7zM13.5 3.5V8H18",
  mention: "M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5zM5 20a7 7 0 0 1 14 0",
  source: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  other: "M5 7.5 12 4l7 3.5-7 3.5zM5 12l7 3.5 7-3.5M5 16.5 12 20l7-3.5",
};
const PIN = "M9.5 3.5h5l-.75 5.25L17 12v1.5H7V12l3.25-3.25zM12 13.5V20";
const glyph = (d: string, cls = "") => html`<svg viewBox="0 0 24 24" class=${`ui-ctt__glyph ${cls}`.trim()} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const KINDS = ["file", "mention", "source"];
const kindOf = (item: ContextTrayItem) => (KINDS.includes(item.kind ?? "file") ? (item.kind ?? "file") : "other");

type Shown = { item: ContextTrayItem; leaving: boolean };

let uid = 0;

/**
 * What the model can see, as chips with their token weight: remove (undoable), pin, and the total against the window.
 * @tag tc-context-tray
 * @fires tc-items-change - `items` is about to change (`ContextTrayItemsChange`: `{ items, change: { type, item } }`,
 *   type "remove" | "restore" | "pin" | "unpin"). Cancelable: preventDefault() keeps the current items (controlled use)
 */
export class TcContextTray extends TcElement {
  static override ui = "ctt";

  /** The heading, and the group's name */
  @property() accessor heading = "In context";
  /** The chips, in order */
  @property({ attribute: false }) accessor items: ContextTrayItem[] = [];
  /** Size of the context window in tokens (0: no meter, only the total) */
  @property({ type: Number }) accessor limit = 0;
  /** Tokens already in the window besides these items – system prompt, tools, the conversation */
  @property({ type: Number }) accessor reserved = 0;
  /** Share of the limit from which the tray warns (0–1) */
  @property({ type: Number, attribute: "warn-at" }) accessor warnAt = 0.8;
  /** How long Undo stays after a removal, in ms (0: no undo) */
  @property({ type: Number, attribute: "undo-timeout" }) accessor undoTimeout = 6000;
  /** What the tray says with no items */
  @property({ attribute: "empty-text" }) accessor emptyText = "Nothing in context yet – type @ to add files, people or sources";

  /** @internal Removed items folding away, at the index they had */
  @state() accessor ghosts: { item: ContextTrayItem; index: number }[] = [];
  /** @internal Removals Undo can put back, newest last */
  @state() accessor undoable: { item: ContextTrayItem; index: number }[] = [];
  /** @internal The chip the pointer is on – its meter segment lights */
  @state() accessor hot: string | null = null;
  /** @internal The toolbar's tab stop: "<id>:pin" or "<id>:remove" */
  @state() accessor stop: string | null = null;
  /** @internal What the status region says; repeats alternate a trailing no-break space, so they're read again */
  @state() accessor said: { text: string; n: number } = { text: "", n: 0 };

  private uid = `tc-ctt-${++uid}`;
  private last: ContextTrayItem[] = [];
  private level = "ok";
  private undoTimer = 0;
  private ghostTimers = new Map<string, number>();
  private clones = new WeakMap<Element, Element>();
  /** After Undo puts a chip back, focus goes to it */
  private focusAfter: string | null = null;
  /** The total rolls to new values; made at the first update, so the first value shows at once */
  private roll: RollingController | null = null;

  constructor() {
    super();
    // Focus never drops to <body>: a removed chip hands it to a neighbour (see removeItem), else Undo, else a chip
    new FocusRescueController(this, () => this.querySelector(".ui-ctt__undo") ?? this.buttons()[0] ?? null);
    this.addEventListener("keydown", this.onHostKey);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.undoTimer);
    for (const t of this.ghostTimers.values()) window.clearTimeout(t);
    this.ghostTimers.clear();
    this.ghosts = [];
    this.undoable = [];
  }

  /** Tokens in the window: the reserved part plus every item */
  get used() {
    return Math.max(0, this.reserved) + this.items.reduce((n, it) => n + Math.max(0, it.tokens), 0);
  }

  /** Puts the last removed item back (what Undo and ⌘Z do); false when there's nothing to undo */
  undo() {
    const last = this.undoable[this.undoable.length - 1];
    if (!last) return false;
    if (this.items.some((it) => it.id === last.item.id)) {
      this.undoable = this.undoable.slice(0, -1);
      return false;
    }
    const next = [...this.items];
    next.splice(Math.min(last.index, next.length), 0, last.item);
    this.undoable = this.undoable.slice(0, -1);
    if (!this.undoable.length) window.clearTimeout(this.undoTimer);
    const inside = this.contains(document.activeElement);
    if (this.change(next, { type: "restore", item: last.item })) {
      this.say(`Put back ${last.item.label}`);
      if (inside) this.focusAfter = last.item.id;
    }
    return true;
  }

  /* ---------- Changes ---------- */

  /** Fires the cancelable change; applies it unless prevented */
  private change(items: ContextTrayItem[], change: ContextTrayChange) {
    const go = this.emit<ContextTrayItemsChange>("tc-items-change", { items, change }, { cancelable: true });
    if (go) this.items = items;
    return go;
  }

  private removeItem(item: ContextTrayItem, from: "pin" | "remove") {
    const index = this.items.findIndex((it) => it.id === item.id);
    if (index < 0) return;
    // Before the chip goes inert: focus to the next chip's same button, else the one before's (Undo comes after)
    const chips = this.chipEls();
    const at = chips.findIndex((c) => c.dataset.id === item.id);
    const pick = (c: HTMLElement | undefined) => c?.querySelector<HTMLElement>(from === "pin" ? ".ui-ctt__pin" : ".ui-ctt__remove");
    const next = pick(chips[at + 1]) ?? pick(chips[at - 1]);
    const chip = chips[at];
    const moved = rescueFocus(chip, [next]);
    const lost = !moved && !!chip?.contains(document.activeElement);
    if (next) this.stop = `${next.closest<HTMLElement>(".ui-ctt__chip")!.dataset.id}:${from}`;
    const rest = this.items.filter((it) => it.id !== item.id);
    if (!this.change(rest, { type: "remove", item })) return;
    if (this.undoTimeout > 0) {
      this.undoable = [...this.undoable, { item, index }];
      window.clearTimeout(this.undoTimer);
      this.undoTimer = window.setTimeout(() => (this.undoable = []), this.undoTimeout);
      this.say(`Removed ${item.label}. Undo is in the tray`);
    } else this.say(`Removed ${item.label}`);
    // The last chip went: Undo takes focus once it's drawn
    if (lost) this.focusAfter = "#undo";
  }

  private togglePin(item: ContextTrayItem) {
    const pinned = !item.pinned;
    const next = this.items.map((it) => (it.id === item.id ? { ...it, pinned } : it));
    if (this.change(next, { type: pinned ? "pin" : "unpin", item: { ...item, pinned } })) this.say(`${pinned ? "Pinned" : "Unpinned"} ${item.label}`);
  }

  private say(text: string) {
    this.said = { text, n: this.said.n + 1 };
  }

  /* ---------- Keyboard: one toolbar ---------- */

  private chipEls() {
    return [...this.querySelectorAll<HTMLElement>(".ui-ctt__chip:not([data-leaving])")];
  }
  private buttons() {
    return this.chipEls().flatMap((c) => [...c.querySelectorAll<HTMLElement>(".ui-ctt__pin, .ui-ctt__remove")]);
  }
  private keyOf(button: HTMLElement) {
    return `${button.closest<HTMLElement>(".ui-ctt__chip")!.dataset.id}:${button.classList.contains("ui-ctt__pin") ? "pin" : "remove"}`;
  }

  private onToolbarKey = (e: KeyboardEvent) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>(".ui-ctt__pin, .ui-ctt__remove");
    if (!button) return;
    const all = this.buttons();
    const i = all.indexOf(button);
    const go = (j: number) => {
      const to = all[Math.max(0, Math.min(all.length - 1, j))];
      if (!to) return;
      e.preventDefault();
      this.stop = this.keyOf(to);
      to.focus();
    };
    if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
    else if (e.key === "Delete" || e.key === "Backspace") {
      const id = button.closest<HTMLElement>(".ui-ctt__chip")!.dataset.id;
      const item = this.items.find((it) => it.id === id);
      if (!item) return;
      e.preventDefault();
      this.removeItem(item, button.classList.contains("ui-ctt__pin") ? "pin" : "remove");
    }
  };

  /** ⌘Z / Ctrl Z inside the tray undoes the last removal */
  private onHostKey = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() !== "z" || e.shiftKey || e.altKey || !(e.metaKey || e.ctrlKey) || e.defaultPrevented) return;
    if (this.undoable.length && this.undo()) e.preventDefault();
  };

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.roll ??= new RollingController(this, () => ({ used: this.used }), 480);
    if (changed.has("items")) {
      const now = new Set(this.items.map((it) => it.id));
      // Items that left (here or from the app) fold away where they were
      const gone = this.last.map((item, index) => ({ item, index })).filter((g) => !now.has(g.item.id));
      const kept = this.ghosts.filter((g) => !now.has(g.item.id));
      if (gone.length && !reducedMotion() && this.hasUpdated) {
        for (const g of gone) {
          window.clearTimeout(this.ghostTimers.get(g.item.id));
          this.ghostTimers.set(
            g.item.id,
            window.setTimeout(() => {
              this.ghostTimers.delete(g.item.id);
              this.ghosts = this.ghosts.filter((x) => x.item.id !== g.item.id);
            }, FOLD),
          );
        }
        this.ghosts = [...kept.filter((k) => !gone.some((g) => g.item.id === k.item.id)), ...gone];
      } else if (kept.length !== this.ghosts.length) this.ghosts = kept;
      this.last = this.items;
      if (this.stop && !this.items.some((it) => this.stop!.startsWith(`${it.id}:`))) this.stop = null;
    }
    const used = this.used;
    const share = this.limit > 0 ? used / this.limit : 0;
    const level = share > 1 ? "over" : share >= this.warnAt && this.limit > 0 ? "warn" : "ok";
    if (level !== this.level && this.hasUpdated && level !== "ok") this.said = { text: level === "over" ? "Context is over the window" : "Context window is almost full", n: this.said.n + 1 };
    this.level = level;
    this.dataset.level = level;
  }

  protected override updated() {
    const target = this.focusAfter;
    if (!target) return;
    this.focusAfter = null;
    const el = target === "#undo" ? this.querySelector<HTMLElement>(".ui-ctt__undo") : this.querySelector<HTMLElement>(`.ui-ctt__chip[data-id="${CSS.escape(target)}"] .ui-ctt__remove`);
    if (el) {
      if (target !== "#undo") this.stop = `${target}:remove`;
      el.focus();
    }
  }

  /* ---------- Rendering ---------- */

  private shown(): Shown[] {
    const list: Shown[] = this.items.map((item) => ({ item, leaving: false }));
    for (const g of [...this.ghosts].sort((a, b) => a.index - b.index)) list.splice(Math.min(g.index, list.length), 0, { item: g.item, leaving: true });
    return list;
  }

  private icon(item: ContextTrayItem) {
    if (item.icon) {
      let copy = this.clones.get(item.icon);
      if (!copy) this.clones.set(item.icon, (copy = item.icon.cloneNode(true) as Element));
      return copy;
    }
    return glyph(PATHS[kindOf(item)]);
  }

  private chip(s: Shown, tabStop: string | null) {
    const { item, leaving } = s;
    const pinKey = `${item.id}:pin`;
    const removeKey = `${item.id}:remove`;
    const name = `${item.label}, ${plain(item.tokens)} tokens${item.pinned ? ", pinned" : ""}`;
    return html`<div
      class="ui-ctt__chip"
      role="group"
      aria-label=${name}
      title=${ifDefined(item.hint)}
      data-id=${item.id}
      data-kind=${kindOf(item)}
      ?data-pinned=${!!item.pinned}
      ?data-leaving=${leaving}
      ?data-hot=${this.hot === item.id}
      .inert=${leaving}
      @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hot = item.id)}
      @pointerleave=${() => this.hot === item.id && (this.hot = null)}
    >
      <div class="ui-ctt__chip-body">
        <button
          type="button"
          class="ui-ctt__pin"
          aria-label=${`Pin ${item.label}`}
          aria-pressed=${item.pinned ? "true" : "false"}
          tabindex=${tabStop === pinKey ? "0" : "-1"}
          data-focus-key=${`pin:${item.id}`}
          @click=${() => this.togglePin(item)}
          @focus=${() => {
            this.stop = pinKey;
            this.hot = item.id;
          }}
          @blur=${() => this.hot === item.id && (this.hot = null)}
        >
          <span class="ui-ctt__kind">${this.icon(item)}</span>${glyph(PIN, "ui-ctt__pin-glyph")}
        </button>
        <span class="ui-ctt__label">${item.label}</span>
        <span class="ui-ctt__weight">${plain(item.tokens)}</span>
        <button
          type="button"
          class="ui-ctt__remove"
          aria-label=${`Remove ${item.label}`}
          tabindex=${tabStop === removeKey ? "0" : "-1"}
          data-focus-key=${`remove:${item.id}`}
          @click=${() => this.removeItem(item, "remove")}
          @focus=${() => {
            this.stop = removeKey;
            this.hot = item.id;
          }}
          @blur=${() => this.hot === item.id && (this.hot = null)}
        >
          ${glyph("M7 7l10 10M17 7 7 17", "ui-ctt__x")}
        </button>
      </div>
    </div>`;
  }

  /** What the caption says: a removal to undo, then the level */
  private caption(used: number) {
    const last = this.undoable[this.undoable.length - 1];
    if (last)
      return keyed(
        `undo:${last.item.id}:${this.undoable.length}`,
        html`<span class="ui-ctt__line"><span class="ui-ctt__line-text">Removed <b>${last.item.label}</b></span></span>`,
      );
    const free = this.limit - used;
    if (this.limit <= 0) return keyed("total", html`<span class="ui-ctt__line"><span class="ui-ctt__line-text">${plain(used)} tokens in context</span></span>`);
    if (this.level === "over") return keyed("over", html`<span class="ui-ctt__line" data-tone="danger"><span class="ui-ctt__line-text"><b>${plain(-free)}</b> over the window – remove or unpin something</span></span>`);
    if (this.level === "warn") return keyed("warn", html`<span class="ui-ctt__line" data-tone="warn"><span class="ui-ctt__line-text">Only <b>${plain(free)}</b> left in the window</span></span>`);
    return keyed("ok", html`<span class="ui-ctt__line"><span class="ui-ctt__line-text">${plain(free)} free of ${plain(this.limit)}</span></span>`);
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const list = this.shown();
    const live = list.filter((s) => !s.leaving);
    const used = this.used;
    const scale = Math.max(this.limit, used, 1);
    const rolled = this.roll?.shown.used ?? used;
    // The tab stop: the remembered button, else the first chip's pin
    const stop = this.stop && live.some((s) => this.stop!.startsWith(`${s.item.id}:`)) ? this.stop : live[0] ? `${live[0].item.id}:pin` : null;
    const said = this.said;
    const foot = html`<div class="ui-ctt__foot">
      <span class="ui-ctt__sr" role="status">${said.text ? said.text + (said.n % 2 ? "" : " ") : ""}</span>
      <span class="ui-ctt__caption">${this.caption(used)}</span>
      ${this.undoable.length
        ? html`<button type="button" class="ui-ctt__undo" aria-keyshortcuts="Control+Z Meta+Z" @click=${() => this.undo()}>
            ${glyph("M9 7 5 11l4 4M5 11h9a5 5 0 0 1 0 10h-2", "ui-ctt__undo-glyph")}<span>Undo</span>
          </button>`
        : nothing}
    </div>`;

    return html`
      <div class="ui-ctt__card">
        <div class="ui-ctt__head">
          <span id=${`${this.uid}-title`} class="ui-ctt__title">${this.heading}</span>
          <span class="ui-ctt__count" aria-hidden="true">${live.length}</span>
          <span class="ui-ctt__total">
            <span class="ui-ctt__used" aria-hidden="true">${plain(rolled)}</span>${this.limit > 0 ? html`<span class="ui-ctt__of" aria-hidden="true">&nbsp;/ ${plain(this.limit)}</span>` : nothing}
            <span class="ui-ctt__sr">${plain(used)} ${this.limit > 0 ? `of ${plain(this.limit)} tokens used, ${Math.round((used / this.limit) * 100)} percent` : "tokens"}, ${live.length} ${live.length === 1 ? "item" : "items"}</span>
          </span>
        </div>
        ${this.limit > 0
          ? html`<div class="ui-ctt__meter" aria-hidden="true" ?data-hot=${!!this.hot}>
              ${this.reserved > 0 ? html`<span class="ui-ctt__seg" data-kind="reserved" style=${styleMap({ width: `${(this.reserved / scale) * 100}%` })}></span>` : nothing}
              ${repeat(
                list,
                (s) => s.item.id,
                (s) => html`<span
                  class="ui-ctt__seg"
                  data-kind=${kindOf(s.item)}
                  ?data-on=${this.hot === s.item.id}
                  style=${styleMap({ width: s.leaving ? "0%" : `${(Math.max(0, s.item.tokens) / scale) * 100}%` })}
                ></span>`,
              )}
            </div>`
          : nothing}
        ${list.length
          ? html`<div class="ui-ctt__chips" role="toolbar" aria-label=${`${this.heading}: ${live.length} ${live.length === 1 ? "item" : "items"}`} @keydown=${this.onToolbarKey}>
              ${repeat(
                list,
                (s) => s.item.id,
                (s) => this.chip(s, stop),
              )}
            </div>`
          : html`<p class="ui-ctt__empty">${this.emptyText}</p>`}
        ${clean ? foot : nothing}
      </div>
      ${clean ? nothing : foot}
    `;
  }

  static override css = /* css */ `
[data-ui="ctt"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 520px;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The meter's colours per kind – override them on [data-ui="ctt"]. Standard keeps to its blues, Clean to the accent's tints */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ctt"] {
  --tc-context-tray-file: var(--tc-chart-1);
  --tc-context-tray-source: var(--tc-chart-4);
  --tc-context-tray-mention: var(--tc-chart-5);
  --tc-context-tray-other: var(--tc-chart-2);
  --tc-context-tray-reserved: var(--tc-chart-neutral);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ctt"] {
  --tc-context-tray-file: var(--tc-chart-1);
  --tc-context-tray-source: var(--tc-chart-3);
  --tc-context-tray-mention: var(--tc-chart-2);
  --tc-context-tray-other: var(--tc-chart-4);
  --tc-context-tray-reserved: var(--tc-chart-neutral);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ctt"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); color: var(--tc-text-secondary); }
/* Strokes are shadows: a hairline plus a soft lift */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ctt"] { border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-primary); }
[data-ui="ctt"] *, [data-ui="ctt"] *::before, [data-ui="ctt"] *::after { box-sizing: border-box; }
:where([data-ui="ctt"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ctt"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="ctt"] svg { display: block; flex: none; }
[data-ui="ctt"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-ctt__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-ctt__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__glyph { stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-ctt__glyph { stroke-width: 1.4; }
/* The white card */
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__card { position: relative; padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-ctt__card { position: relative; padding: var(--tc-space-3-5) var(--tc-space-4) 0; }
/* Head: the title, how many, and the total against the window */
.ui-ctt__head { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 22px; }
.ui-ctt__title { overflow: hidden; font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__title { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ctt__title { color: var(--tc-text-strong); }
.ui-ctt__count { display: inline-grid; place-items: center; flex: none; min-width: var(--tc-pill-h); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-ctt__total { display: inline-flex; align-items: baseline; margin-left: auto; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-ctt__used { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-ctt__of { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
[data-ui="ctt"][data-level="warn"] .ui-ctt__used { color: var(--tc-status-warning-fg); }
[data-ui="ctt"][data-level="over"] .ui-ctt__used { color: var(--tc-status-danger-fg); }
/* The meter: the window, filled by the reserved part and then one segment per chip */
.ui-ctt__meter { display: flex; gap: var(--tc-hairline); height: 6px; margin-top: var(--tc-space-2-5); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
:where([data-look="clean"], [data-look="clean"] *).ui-ctt__meter { height: 4px; }
.ui-ctt__seg { flex: none; min-width: 0; height: 100%; background: var(--tc-context-tray-other); transition: width var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ctt__seg[data-kind="file"] { background: var(--tc-context-tray-file); }
.ui-ctt__seg[data-kind="mention"] { background: var(--tc-context-tray-mention); }
.ui-ctt__seg[data-kind="source"] { background: var(--tc-context-tray-source); }
.ui-ctt__seg[data-kind="reserved"] { background: var(--tc-context-tray-reserved); }
.ui-ctt__meter[data-hot] .ui-ctt__seg:not([data-on]) { opacity: 0.3; }
[data-ui="ctt"][data-level="over"] .ui-ctt__meter { box-shadow: inset 0 0 0 1px var(--tc-status-danger-solid); }
/* The chips */
.ui-ctt__chips { display: flex; flex-wrap: wrap; margin-top: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__chips { row-gap: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ctt__chips { row-gap: var(--tc-space-1-5); }
/* The outer grid folds the width when a chip leaves; the body fades and shrinks */
.ui-ctt__chip {
  display: grid;
  grid-template-columns: 1fr;
  min-width: 0;
  max-width: 100%;
  margin-right: var(--tc-space-1-5);
  transition: grid-template-columns var(--tc-duration-moderate) var(--tc-ease-move), margin-right var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard);
  animation: ui-ctt-in var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-ctt__chip[data-leaving] { grid-template-columns: 0fr; margin-right: 0; opacity: 0; pointer-events: none; }
.ui-ctt__chip-body {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  min-width: 0;
  height: 28px;
  overflow: hidden;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-fill-default);
  white-space: nowrap;
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__chip-body { padding: 0 var(--tc-space-0-5); box-shadow: inset 0 0 0 1px var(--tc-border-default); font-size: var(--tc-font-size-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-ctt__chip-body { height: 26px; padding: 0 var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-weight: var(--tc-font-weight-medium); }
.ui-ctt__chip[data-hot] .ui-ctt__chip-body { background: var(--tc-fill-strong); }
/* Pinned: the accent tint, and the pin in place of the kind icon */
.ui-ctt__chip[data-pinned] .ui-ctt__chip-body { background: var(--tc-accent-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__chip[data-pinned] .ui-ctt__chip-body { box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
.ui-ctt__label { min-width: 0; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
.ui-ctt__weight { flex: none; margin-left: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* The kind icon is the pin button: hovering the chip (or focusing the button) shows the pin it toggles */
.ui-ctt__pin, .ui-ctt__remove { position: relative; display: grid; place-items: center; flex: none; width: 22px; height: 22px; border-radius: var(--tc-radius-sm); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-ctt__pin, .ui-ctt__remove) { width: 20px; height: 20px; border-radius: var(--tc-radius-xs); }
/* Their targets are 24 × 24 (2.5.8) */
:is(.ui-ctt__pin, .ui-ctt__remove)::after { content: ""; position: absolute; top: 50%; left: 50%; width: 24px; height: 24px; transform: translate(-50%, -50%); }
.ui-ctt__pin > * { grid-area: 1 / 1; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-spring); }
.ui-ctt__kind { display: grid; place-items: center; width: 16px; height: 16px; }
.ui-ctt__kind > svg:not(.ui-ctt__glyph) { width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *) :is(.ui-ctt__pin, .ui-ctt__remove) { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-ctt__pin, .ui-ctt__remove) { color: var(--tc-icon-muted); }
.ui-ctt__pin-glyph { opacity: 0; transform: scale(0.6); }
.ui-ctt__chip:hover .ui-ctt__pin .ui-ctt__kind, .ui-ctt__pin:focus-visible .ui-ctt__kind, .ui-ctt__chip[data-pinned] .ui-ctt__kind { opacity: 0; transform: scale(0.6); }
.ui-ctt__chip:hover .ui-ctt__pin-glyph, .ui-ctt__pin:focus-visible .ui-ctt__pin-glyph, .ui-ctt__chip[data-pinned] .ui-ctt__pin-glyph { opacity: 1; transform: none; }
.ui-ctt__pin:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
.ui-ctt__chip[data-pinned] .ui-ctt__pin { color: var(--tc-accent-text); }
.ui-ctt__chip[data-pinned] .ui-ctt__pin-glyph { fill: currentColor; }
.ui-ctt__remove:hover { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-ctt__x { width: 12px; height: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__x { stroke-width: 2; }
.ui-ctt__empty { margin: var(--tc-space-3) 0 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* Standard: the tray below the card · Clean: the card's last row, under a hairline */
.ui-ctt__foot { display: flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__foot { min-height: 36px; padding: var(--tc-space-0-5) var(--tc-space-1) 0 var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ctt__foot { min-height: 40px; margin: var(--tc-space-3-5) calc(-1 * var(--tc-space-4)) 0; padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ctt__caption { display: grid; flex: 1; min-width: 0; }
.ui-ctt__line { grid-area: 1 / 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; animation: ui-ctt-swap var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-ctt__line-text { overflow: hidden; text-overflow: ellipsis; }
.ui-ctt__line[data-tone="warn"], .ui-ctt__line[data-tone="warn"] b { color: var(--tc-status-warning-fg); }
.ui-ctt__line[data-tone="danger"], .ui-ctt__line[data-tone="danger"] b { color: var(--tc-status-danger-fg); }
/* Undo: the ghost button (Standard), the secondary button (Clean) */
.ui-ctt__undo { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; animation: ui-ctt-swap var(--tc-duration-slow) var(--tc-ease-standard) both; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__undo { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ctt__undo:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ctt__undo { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-ctt__undo:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ctt__undo-glyph { width: 14px; height: 14px; }
@keyframes ui-ctt-in { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } }
@keyframes ui-ctt-swap { from { opacity: 0; filter: blur(2px); } }
/* Narrow: shorter labels */
@container (max-width: 360px) {
  .ui-ctt__label { max-width: 132px; }
  .ui-ctt__of { display: none; }
}
/* Touch screens: the pin always shows (there's no hover), bigger buttons */
@media (hover: none) and (pointer: coarse) {
  .ui-ctt__chip-body { height: 32px; }
  .ui-ctt__pin, .ui-ctt__remove { width: 28px; height: 28px; }
  .ui-ctt__pin .ui-ctt__kind { opacity: 0; }
  .ui-ctt__pin .ui-ctt__pin-glyph { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ctt"] *, [data-ui="ctt"] *::before, [data-ui="ctt"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-context-tray")) customElements.define("tc-context-tray", TcContextTray);

declare global {
  interface HTMLElementTagNameMap {
    "tc-context-tray": TcContextTray;
  }
}
