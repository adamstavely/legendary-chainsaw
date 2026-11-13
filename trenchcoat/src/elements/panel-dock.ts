import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";

/*
 * <tc-panel-dock> – one side panel beside a chat, with a tab for each item open in it: an artifact, a file, a source, a
 * preview. The page puts each item's content in the element as a child with `slot` set to the item's id (or renders only
 * the active one); the dock shows the active item's child as its tab panel and hides the rest.
 *   · the tabs are one tab stop: ← / → move, Home / End to the ends, Enter or Space shows one, Delete closes it
 *   · drag the edge to resize, or focus it and use ← / → (16 px a step), Home and End for the narrowest and widest
 *   · Collapse folds it to a rail of the items' icons; Close hides it. Escape from inside closes it, and focus goes back
 *     to where it was before it came into the panel
 *   · when the space it docks in (its parent) is narrower than `breakpoint`, it becomes a full-width sheet over the page
 * `active`, `width`, `open` and `collapsed` are the element's own unless the matching tc-…-change listener calls
 * preventDefault(). tc-close is a request: the page takes the item out of `items`.
 * Standard: the header on the gray tray above a white card. Clean: one white panel, the tabs its first row.
 *
 *   <tc-panel-dock active="draft" .items=${[{ id: "draft", title: "Report draft", kind: "Artifact" }]}>
 *     <article slot="draft">…</article>
 *   </tc-panel-dock>
 */

export type PanelDockItem = {
  id: string;
  title: string;
  /** What it is, in a word: "Artifact", "File", "Source", "Preview" – read with the title */
  kind?: string;
  /** Lucide-style path data for its icon; a file icon when left out */
  icon?: string | string[];
  /** false hides its close button */
  closable?: boolean;
};
export type PanelDockSide = "right" | "left";
export type PanelDockLabels = {
  /** The panel's name, as a landmark */
  panel: string;
  tabs: string;
  close: string;
  closePanel: string;
  collapse: string;
  expand: string;
  resize: string;
  empty: string;
  /** How the tabs' keys work, read with each tab */
  keys: string;
  /** The splitter's value in words; {width} is filled in */
  widthText: string;
  /** Said after an item closes; {title} is filled in */
  closed: string;
};

/** Details of the events */
export type PanelDockActiveChange = { active: string | null; item?: PanelDockItem };
export type PanelDockClose = { id: string; item: PanelDockItem };
export type PanelDockWidthChange = { width: number };
export type PanelDockOpenChange = { open: boolean };
export type PanelDockCollapsedChange = { collapsed: boolean };

/** The words used when the page gives none */
export const defaultPanelDockLabels: PanelDockLabels = {
  panel: "Side panel",
  tabs: "Open items",
  close: "Close",
  closePanel: "Close panel",
  collapse: "Collapse panel",
  expand: "Expand panel",
  resize: "Resize panel",
  empty: "Nothing open. Open an artifact, a file or a source and it appears here.",
  keys: "Arrow keys move between items, Enter shows one, Delete closes it, Escape closes the panel",
  widthText: "{width} pixels wide",
  closed: "Closed {title}",
};

/* Icons: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const paths = (d: string | string[]) => (Array.isArray(d) ? d : [d]).map((p) => svg`<path d=${p}></path>`);
const fileIcon = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`;
const xIcon = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const collapseIcon = svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M15 3v18"></path><path d="m8 9 3 3-3 3"></path>`;
const expandIcon = svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M15 3v18"></path><path d="m10 15-3-3 3-3"></path>`;

/** A keyboard step on the splitter, px */
const STEP = 16;
let uidCount = 0;

/**
 * One side panel beside a chat with a tab per open item – resizable, collapsible to a rail, a full-width sheet when narrow.
 * @tag tc-panel-dock
 * @slot <item id> - Each item's content: a child with `slot` set to the item's id
 * @fires tc-active-change - Another item was shown ({ active, item }: PanelDockActiveChange); cancelable – prevented, `active` stays as it was
 * @fires tc-close - An item's close button or Delete was pressed ({ id, item }: PanelDockClose); cancelable – the page removes the item
 * @fires tc-width-change - The panel was resized – once a drag ends, and on every key step ({ width }: PanelDockWidthChange); cancelable – prevented, `width` stays
 * @fires tc-open-change - The panel was closed ({ open }: PanelDockOpenChange); cancelable – prevented, it stays open
 * @fires tc-collapsed-change - The panel was folded to a rail or opened out ({ collapsed }: PanelDockCollapsedChange); cancelable – prevented, it stays as it was
 */
export class TcPanelDock extends TcElement {
  static override ui = "pdk";

  /** The items open in the panel, in tab order */
  @property({ attribute: false }) accessor items: PanelDockItem[] = [];
  /** The shown item's id. Changed by the tabs unless a tc-active-change listener calls preventDefault() */
  @property() accessor active: string | null = null;
  /** Whether the panel shows at all. Closed by its Close button or Escape unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor open = true;
  /** Folded to a rail of icons. Changed by Collapse and Expand unless a tc-collapsed-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor collapsed = false;
  /** The panel's width, px. Changed by the splitter unless a tc-width-change listener calls preventDefault() */
  @property({ type: Number }) accessor width = 420;
  /** The narrowest the splitter goes, px */
  @property({ type: Number, attribute: "min-width" }) accessor minWidth = 280;
  /** The widest the splitter goes, px */
  @property({ type: Number, attribute: "max-width" }) accessor maxWidth = 760;
  /** Below this width of its parent, px, the panel becomes a full-width sheet over the page; 0 never */
  @property({ type: Number }) accessor breakpoint = 640;
  /** Which side of the chat the panel docks on – the splitter is on the other edge */
  @property({ reflect: true }) accessor side: PanelDockSide = "right";
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<PanelDockLabels> = {};

  @state() private accessor focusId = "";
  @state() private accessor announce = "";
  @state() private accessor resizing = false;
  /** The parent is narrower than `breakpoint` */
  @state() private accessor sheet = false;
  private parentRo?: ResizeObserver;
  private watched: Element | null = null;
  private drag: { x: number; width: number; pointer: number } | null = null;
  private returnTo: HTMLElement | null = null;
  private uid = `tc-pdk-${++uidCount}`;

  /** A framework adding or removing a panel child re-wires them */
  private children$ = new MutationObserver(() => this.wirePanels());

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("focusin", this.onFocusIn);
    this.addEventListener("keydown", this.onHostKey);
    this.children$.observe(this, { childList: true });
    this.parentRo = new ResizeObserver(() => this.measure());
    this.watchParent();
  }
  /** Reads the parent's width after layout – never in render */
  private measure() {
    const w = this.parentElement?.getBoundingClientRect().width ?? 0;
    const sheet = this.breakpoint > 0 && w > 0 && w < this.breakpoint;
    if (sheet !== this.sheet) this.sheet = sheet;
  }
  private watchParent() {
    const parent = this.parentElement;
    if (parent === this.watched) return;
    if (this.watched) this.parentRo?.unobserve(this.watched);
    this.watched = parent;
    if (parent) this.parentRo?.observe(parent);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("focusin", this.onFocusIn);
    this.removeEventListener("keydown", this.onHostKey);
    this.children$.disconnect();
    this.parentRo?.disconnect();
    this.parentRo = undefined;
    this.watched = null;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!this.items.some((i) => i.id === this.focusId)) this.focusId = this.items.find((i) => i.id === this.active)?.id ?? this.items[0]?.id ?? "";
    if (changed.has("active") && this.active && this.items.some((i) => i.id === this.active)) this.focusId = this.active;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.style.setProperty("--tc-pdk-w", `${this.clamp(this.width)}px`);
    this.toggleAttribute("data-sheet", this.sheet);
    if (changed.has("breakpoint")) this.measure();
    this.wirePanels();
  }

  /** The page's children become the tab panels: the active item's shows, the rest hide */
  private wirePanels() {
    const shown = this.shownId;
    for (const child of [...this.children]) {
      const slot = child.getAttribute("slot");
      if (!slot || !(child instanceof HTMLElement)) continue;
      const item = this.items.find((i) => i.id === slot);
      if (!item) {
        child.hidden = true;
        continue;
      }
      child.classList.add("ui-pdk__content");
      child.id ||= `${this.uid}-panel-${slot}`;
      child.setAttribute("role", "tabpanel");
      child.setAttribute("aria-labelledby", `${this.uid}-tab-${slot}`);
      if (!child.hasAttribute("tabindex")) child.tabIndex = 0;
      child.hidden = this.collapsed || !this.open || slot !== shown;
    }
  }

  /* ---------- The model ---------- */

  private word<K extends keyof PanelDockLabels>(key: K) {
    return this.labels[key] ?? defaultPanelDockLabels[key];
  }
  private clamp(w: number) {
    const min = Math.min(this.minWidth, this.maxWidth);
    return Math.round(Math.max(min, Math.min(this.maxWidth, Number.isFinite(w) ? w : min)));
  }
  /** The item on show: `active` when it's open, else the first */
  private get shownId() {
    return this.items.find((i) => i.id === this.active)?.id ?? this.items[0]?.id ?? null;
  }
  private panelFor(id: string) {
    return [...this.children].find((c) => c.getAttribute("slot") === id) as HTMLElement | undefined;
  }

  /* ---------- Acting ---------- */

  private show(item: PanelDockItem) {
    this.focusId = item.id;
    if (item.id === this.active) return true;
    if (!this.emit<PanelDockActiveChange>("tc-active-change", { active: item.id, item }, { cancelable: true })) return false;
    this.active = item.id;
    return true;
  }
  private close(item: PanelDockItem) {
    if (item.closable === false) return;
    const i = this.items.findIndex((x) => x.id === item.id);
    const hadFocus = this.contains(document.activeElement);
    if (!this.emit<PanelDockClose>("tc-close", { id: item.id, item }, { cancelable: true })) return;
    this.announce = this.word("closed").replace("{title}", () => item.title);
    const next = this.items[i + 1] ?? this.items[i - 1];
    if (next) {
      if (item.id === this.shownId) this.show(next);
      this.focusId = next.id;
      if (hadFocus) this.focusTab(next.id);
    }
  }
  private setOpen(open: boolean) {
    if (open === this.open) return true;
    if (!this.emit<PanelDockOpenChange>("tc-open-change", { open }, { cancelable: true })) return false;
    this.open = open;
    return true;
  }
  private closePanel() {
    const inside = this.contains(document.activeElement);
    if (!this.setOpen(false)) return;
    const back = this.returnTo;
    this.returnTo = null;
    if (inside && back?.isConnected && !this.contains(back)) back.focus();
  }
  private setCollapsed(collapsed: boolean) {
    if (collapsed === this.collapsed) return true;
    if (!this.emit<PanelDockCollapsedChange>("tc-collapsed-change", { collapsed }, { cancelable: true })) return false;
    this.collapsed = collapsed;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(collapsed ? ".ui-pdk__expand" : ".ui-pdk__collapse")?.focus());
    return true;
  }
  private setWidth(width: number) {
    const w = this.clamp(width);
    if (w !== this.clamp(this.width) && this.emit<PanelDockWidthChange>("tc-width-change", { width: w }, { cancelable: true })) this.width = w;
    this.paint(this.clamp(this.width));
  }
  /** Draws a width without a render – during a drag, and back to the property after one */
  private paint(w: number) {
    this.style.setProperty("--tc-pdk-w", `${w}px`);
    const handle = this.querySelector(".ui-pdk__handle");
    handle?.setAttribute("aria-valuenow", String(w));
    handle?.setAttribute("aria-valuetext", this.word("widthText").replace("{width}", String(w)));
  }
  private focusTab(id: string) {
    this.focusId = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${CSS.escape(`${this.uid}-tab-${id}`)}`)?.focus());
  }

  /* ---------- Keys and pointers ---------- */

  /** Where focus came from, the first time it enters – Escape sends it back there */
  private onFocusIn = (e: FocusEvent) => {
    const from = e.relatedTarget as HTMLElement | null;
    if (from && !this.contains(from)) this.returnTo = from;
  };
  private onHostKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented || !this.open) return;
    e.preventDefault();
    this.closePanel();
  };
  private onTabKey = (e: KeyboardEvent) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-item]")?.dataset.item;
    if (!id || e.altKey || e.ctrlKey || e.metaKey) return;
    const i = this.items.findIndex((x) => x.id === id);
    const to: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: this.items.length - 1 };
    if (e.key in to) {
      e.preventDefault();
      const next = this.items[(to[e.key] + this.items.length) % this.items.length];
      if (next) this.focusTab(next.id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.show(this.items[i]);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this.close(this.items[i]);
    }
  };
  private onHandleKey = (e: KeyboardEvent) => {
    // On the right the panel grows to the left, so ← widens it; on the left, → does
    const grow = this.side === "right" ? "ArrowLeft" : "ArrowRight";
    const shrink = this.side === "right" ? "ArrowRight" : "ArrowLeft";
    const w = this.clamp(this.width);
    const next = e.key === grow ? w + STEP : e.key === shrink ? w - STEP : e.key === "Home" ? this.minWidth : e.key === "End" ? this.maxWidth : null;
    if (next === null) return;
    e.preventDefault();
    this.setWidth(next);
  };
  private onDragStart = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    // Capture keeps the moves coming when the pointer leaves the element; a synthetic pointer can't be captured
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* not capturable */
    }
    this.drag = { x: e.clientX, width: this.clamp(this.width), pointer: e.pointerId };
    this.resizing = true;
  };
  private onDragMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.pointer !== e.pointerId) return;
    const dx = e.clientX - d.x;
    this.paint(this.clamp(d.width + (this.side === "right" ? -dx : dx)));
  };
  private onDragEnd = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.pointer !== e.pointerId) return;
    this.drag = null;
    this.resizing = false;
    const dx = e.clientX - d.x;
    this.setWidth(d.width + (this.side === "right" ? -dx : dx));
  };

  /* ---------- Rendering ---------- */

  private icon(item: PanelDockItem, size = 14) {
    return lucide(size, item.icon ? svg`${paths(item.icon)}` : fileIcon);
  }

  private renderRail() {
    return html`<div class="ui-pdk__rail">
      <button type="button" class="ui-pdk__tool ui-pdk__expand" title=${this.word("expand")} @click=${() => this.setCollapsed(false)}>
        ${lucide(16, expandIcon)}<span class="tc-sr-only">${this.word("expand")}</span>
      </button>
      <ul class="ui-pdk__rail-list" aria-label=${this.word("tabs")}>
        ${this.items.map(
          (item) => html`<li>
            <button
              type="button"
              class="ui-pdk__tool ui-pdk__rail-item"
              aria-current=${ifDefined(item.id === this.shownId ? "true" : undefined)}
              title=${item.title}
              @click=${() => {
                if (this.show(item)) this.setCollapsed(false);
              }}
            >
              ${this.icon(item, 16)}<span class="tc-sr-only">${item.kind ? `${item.kind}: ` : ""}${item.title}</span>
            </button>
          </li>`,
        )}
      </ul>
    </div>`;
  }

  protected override render() {
    if (!this.open) return html`<span class="tc-sr-only" role="status">${this.announce}</span>`;
    const width = this.clamp(this.width);
    const shown = this.shownId;
    const headId = `${this.uid}-head`;
    const tabs = html`<div class="ui-pdk__tabs" role="tablist" aria-label=${this.word("tabs")} @keydown=${this.onTabKey}>
      ${repeat(
        this.items,
        (i) => i.id,
        (item) => {
          const selected = item.id === shown;
          const panel = this.panelFor(item.id);
          return html`<div class="ui-pdk__tab" role="presentation" data-item=${item.id} ?data-selected=${selected}>
            <button
              type="button"
              role="tab"
              class="ui-pdk__tab-btn"
              id=${`${this.uid}-tab-${item.id}`}
              tabindex=${item.id === this.focusId ? 0 : -1}
              aria-selected=${selected ? "true" : "false"}
              aria-controls=${ifDefined(panel ? panel.id || `${this.uid}-panel-${item.id}` : undefined)}
              aria-describedby=${`${this.uid}-keys`}
              title=${item.title}
              @click=${() => this.show(item)}
            >
              ${this.icon(item)}<span class="ui-pdk__tab-title">${item.title}</span>${item.kind ? html`<span class="tc-sr-only">, ${item.kind}</span>` : nothing}
            </button>
            ${item.closable === false
              ? nothing
              : html`<button type="button" class="ui-pdk__tab-close" tabindex="-1" aria-hidden="true" title=${`${this.word("close")} ${item.title}`} @click=${() => this.close(item)}>
                  ${lucide(12, xIcon)}
                </button>`}
          </div>`;
        },
      )}
    </div>`;
    const tools = html`<div class="ui-pdk__tools">
      <button type="button" class="ui-pdk__tool ui-pdk__collapse" title=${this.word("collapse")} @click=${() => this.setCollapsed(true)}>
        ${lucide(16, collapseIcon)}<span class="tc-sr-only">${this.word("collapse")}</span>
      </button>
      <button type="button" class="ui-pdk__tool ui-pdk__close" title=${this.word("closePanel")} @click=${() => this.closePanel()}>
        ${lucide(16, xIcon)}<span class="tc-sr-only">${this.word("closePanel")}</span>
      </button>
    </div>`;
    return html`${this.collapsed || this.sheet
        ? nothing
        : html`<div
            class="ui-pdk__handle"
            role="separator"
            tabindex="0"
            aria-orientation="vertical"
            aria-label=${this.word("resize")}
            aria-valuenow=${width}
            aria-valuemin=${Math.min(this.minWidth, this.maxWidth)}
            aria-valuemax=${this.maxWidth}
            aria-valuetext=${this.word("widthText").replace("{width}", String(width))}
            ?data-active=${this.resizing}
            @pointerdown=${this.onDragStart}
            @pointermove=${this.onDragMove}
            @pointerup=${this.onDragEnd}
            @pointercancel=${this.onDragEnd}
            @keydown=${this.onHandleKey}
          ></div>`}
      <section class="ui-pdk__panel" aria-labelledby=${headId}>
        <h2 class="tc-sr-only" id=${headId}>${this.word("panel")}</h2>
        ${this.collapsed
          ? this.renderRail()
          : html`<div class="ui-pdk__head">${this.items.length ? tabs : html`<span class="ui-pdk__head-title">${this.word("panel")}</span>`}${tools}</div>
              <div class="ui-pdk__body">${this.items.length ? nothing : html`<p class="ui-pdk__empty">${this.word("empty")}</p>`}</div>`}
      </section>
      <span class="tc-sr-only" id=${`${this.uid}-keys`}>${this.word("keys")}</span>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
[data-ui="pdk"] { --tc-pdk-w: 420px; --tc-pdk-rail: 48px; --tc-pdk-handle: 8px; --tc-pdk-tab-max: 200px; }
/* Standard: the tabs on the gray tray above a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pdk"] {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  box-sizing: border-box;
  flex: none;
  width: var(--tc-pdk-w);
  min-width: 0;
  max-width: 100%;
  height: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white panel, the tabs its first row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pdk"] {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  box-sizing: border-box;
  flex: none;
  width: var(--tc-pdk-w);
  min-width: 0;
  max-width: 100%;
  height: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="pdk"]:not([open]) { display: none; }
[data-ui="pdk"][collapsed] { width: var(--tc-pdk-rail); }
[data-ui="pdk"] *, [data-ui="pdk"] *::before, [data-ui="pdk"] *::after { box-sizing: border-box; }
:where([data-ui="pdk"] button) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="pdk"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="pdk"] svg { display: block; flex: none; }
[data-ui="pdk"] ul { margin: 0; padding: 0; list-style: none; }
/* The panel sits in the first row; the page's children, the tab panels, fill the second */
.ui-pdk__panel { grid-row: 1; display: grid; grid-template-rows: auto auto; min-width: 0; }
[data-ui="pdk"][collapsed] .ui-pdk__panel { grid-row: 1 / -1; }
[data-ui="pdk"] > .ui-pdk__content { grid-row: 2; min-height: 0; overflow: auto; padding: var(--tc-space-4); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *) > .ui-pdk__content { border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="pdk"] > .ui-pdk__content:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="pdk"] > .ui-pdk__content[hidden] { display: none; }
.ui-pdk__head { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *) .ui-pdk__head { padding: 0 0 var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *) .ui-pdk__head { border-bottom: 1px solid var(--tc-divider); }
.ui-pdk__head-title { flex: 1 1 0; padding: 0 var(--tc-space-2); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-pdk__body:empty { display: none; }
:where([data-look="standard"], [data-look="standard"] *) .ui-pdk__body { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-pdk__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
.ui-pdk__tabs { display: flex; flex: 1 1 0; gap: var(--tc-space-0-5); min-width: 0; overflow-x: auto; scrollbar-width: none; }
.ui-pdk__tabs::-webkit-scrollbar { display: none; }
.ui-pdk__tab { display: flex; flex: 0 1 auto; align-items: center; min-width: 0; max-width: var(--tc-pdk-tab-max); border-radius: var(--tc-radius-md); }
.ui-pdk__tab:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *) .ui-pdk__tab[data-selected] { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-pdk__tab[data-selected] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-pdk__tab-btn { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1) 0 var(--tc-space-2); border-radius: var(--tc-radius-md); }
.ui-pdk__tab-btn svg { color: var(--tc-icon-muted); }
.ui-pdk__tab-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-pdk__tab[data-selected] .ui-pdk__tab-title { font-weight: var(--tc-font-weight-medium); }
.ui-pdk__tab-close { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); flex: none; border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
.ui-pdk__tab-close:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-pdk__tools { display: flex; flex: none; gap: var(--tc-space-0-5); margin-left: auto; }
.ui-pdk__tool { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
.ui-pdk__tool:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-pdk__rail { display: grid; justify-items: center; align-content: start; gap: var(--tc-space-1); padding: var(--tc-space-1) 0; }
.ui-pdk__rail-list { display: grid; gap: var(--tc-space-0-5); }
.ui-pdk__rail-item[aria-current="true"] { background: var(--tc-fill-selected); color: var(--tc-accent-text); }
/* The splitter, on the edge toward the chat */
.ui-pdk__handle { position: absolute; top: 0; bottom: 0; left: calc(var(--tc-pdk-handle) / -2); z-index: 1; width: var(--tc-pdk-handle); cursor: col-resize; touch-action: none; }
[data-ui="pdk"][side="left"] .ui-pdk__handle { left: auto; right: calc(var(--tc-pdk-handle) / -2); }
.ui-pdk__handle::after { content: ""; position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; transform: translateX(-50%); border-radius: var(--tc-radius-full); background: transparent; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pdk__handle:hover::after, .ui-pdk__handle[data-active]::after, .ui-pdk__handle:focus-visible::after { background: var(--tc-accent); }
.ui-pdk__handle:focus-visible { outline: none; }
/* Narrow space: a full-width sheet over the page */
[data-ui="pdk"][data-sheet][open]:not([collapsed]) { position: fixed; inset: 0; z-index: var(--tc-z-drawer); width: auto; max-width: none; height: auto; border-radius: 0; }
@media (prefers-reduced-motion: reduce) { .ui-pdk__handle::after { transition: none; } }
@media (forced-colors: active) {
  .ui-pdk__tab[data-selected], .ui-pdk__rail-item[aria-current="true"] { outline: 2px solid Highlight; }
  .ui-pdk__handle:hover::after, .ui-pdk__handle[data-active]::after, .ui-pdk__handle:focus-visible::after { background: Highlight; }
}
`;
}

if (!customElements.get("tc-panel-dock")) customElements.define("tc-panel-dock", TcPanelDock);
declare global {
  interface HTMLElementTagNameMap {
    "tc-panel-dock": TcPanelDock;
  }
}
