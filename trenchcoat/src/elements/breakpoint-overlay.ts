import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { HotkeyController } from "./internal/controllers";
import { isMac } from "./internal/util";
import { breakpointApplies, breakpointQuery, breakpointRange, breakpointTone, currentBreakpoint, defaultBreakpoints, type ViewBreakpoint } from "./internal/breakpoints";

/*
 * <tc-breakpoint-overlay> – which breakpoint the page is at, for the people building it. A small badge sits in a
 * corner of the window with the breakpoint in force and the width; open it (click, ⌥⇧O / Alt Shift O, or `open`) for
 * a panel with the size, a scale of every breakpoint with the width marked on it, and each breakpoint's range, media
 * query and whether it applies – and a ruler across the top of the window. Escape closes it.
 *
 * It follows the window by default; give it a `target` and it follows that element's width instead – a preview frame,
 * a resizable container. It's Loupe's breakpoint ruler on its own: Loupe adds components and flex and grid layouts.
 *
 * Floating (the default) the badge and panel sit at the window's `corner`. With `floating` off it's an ordinary card
 * in the page, always open. Standard: the header on a gray tray above a white card. Clean: one white card.
 *
 *   <tc-breakpoint-overlay></tc-breakpoint-overlay>
 *   <tc-breakpoint-overlay .breakpoints=${[{ id: "compact", max: 599 }, { id: "wide", min: 600 }]}></tc-breakpoint-overlay>
 */

export type BreakpointOverlayBreakpoint = ViewBreakpoint;
export type BreakpointOverlayCorner = "bottom-left" | "bottom-right" | "top-left" | "top-right";

/** Details of the events */
export type BreakpointOverlayOpenChange = { open: boolean };
export type BreakpointOverlayBreakpointChange = { breakpoint: BreakpointOverlayBreakpoint | null; width: number };

let uidCount = 0;

/* ruler-dimension-line, x: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const rulerIcon = svg`<path d="M12 15v-3.014"></path><path d="M16 15v-3.014"></path><path d="M20 6H4"></path><path d="M20 8V4"></path><path d="M4 8V4"></path><path d="M8 15v-3.014"></path><rect x="3" y="12" width="18" height="7" rx="1"></rect>`;
const xIcon = () => lucide(16, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);

/** "alt+shift+o" → "⌥⇧O" on a Mac, "Alt Shift O" elsewhere */
const comboLabel = (combo: string) => {
  const mac = isMac();
  const names: Record<string, [string, string]> = { mod: ["⌘", "Ctrl"], meta: ["⌘", "Meta"], cmd: ["⌘", "Meta"], ctrl: ["⌃", "Ctrl"], control: ["⌃", "Ctrl"], alt: ["⌥", "Alt"], option: ["⌥", "Alt"], shift: ["⇧", "Shift"] };
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const words = parts.map((p) => names[p]?.[mac ? 0 : 1] ?? p.replace(/^(key|digit)/, "").toUpperCase());
  return mac ? words.join("") : words.join(" ");
};

/**
 * Which breakpoint the page is at – a badge in the window's corner that opens a panel of every breakpoint, with a
 * ruler across the top of the window; ⌥⇧O to open it.
 * @tag tc-breakpoint-overlay
 * @fires tc-open-change - Opened or closed ({ open }: BreakpointOverlayOpenChange), by the badge, the hotkey, Escape or Close; cancelable – prevented, `open` stays as it was
 * @fires tc-breakpoint-change - The breakpoint in force changed as the width changed ({ breakpoint, width }: BreakpointOverlayBreakpointChange)
 */
export class TcBreakpointOverlay extends TcElement {
  static override ui = "bpo";

  /** The panel's heading */
  @property() accessor heading = "Breakpoints";
  /** Whether the panel is open. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** The breakpoints, in px: min only, max only, or a range. Tailwind's by default */
  @property({ attribute: false }) accessor breakpoints: BreakpointOverlayBreakpoint[] = defaultBreakpoints;
  /** Opens and closes it from anywhere ("alt+shift+o" is ⌥⇧O on Apple keyboards, Alt Shift O elsewhere); false turns it off */
  @property({ attribute: false }) accessor hotkey: string | false = "alt+shift+o";
  /** While open, a ruler across the top of the window with each breakpoint and the width. Only when it follows the window */
  @property({ type: Boolean, attribute: "show-ruler" }) accessor showRuler = true;
  /** The badge and panel float at the window's corner; off, it's a card in the page, always open */
  @property({ type: Boolean, reflect: true }) accessor floating = true;
  /** Which corner of the window it floats in */
  @property({ reflect: true }) accessor corner: BreakpointOverlayCorner = "bottom-left";
  /** Follow this element's width instead of the window's */
  @property({ attribute: false }) accessor target: Element | null = null;

  @state() private accessor size = { w: 0, h: 0 };
  @state() private accessor announce = "";

  private uid = `tc-bpo-${++uidCount}`;
  private frame = 0;
  private resizer: ResizeObserver | null = null;
  private watched: Element | null = null;
  private lastId: string | null | undefined = undefined;

  constructor() {
    super();
    new HotkeyController(
      this,
      () => this.isConnected && this.floating && this.hotkey,
      () => {
        this.setOpen(!this.open);
        return true;
      },
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this.onResize);
    this.ownerDocument.addEventListener("keydown", this.onKey);
    this.watch();
    this.measure();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this.onResize);
    this.ownerDocument.removeEventListener("keydown", this.onKey);
    this.resizer?.disconnect();
    this.resizer = null;
    this.watched = null;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // Set before the first update too (a framework's props): watch whatever it is now
    if (this.isConnected && this.target !== this.watched) {
      this.watch();
      this.measure();
    } else if (changed.has("breakpoints")) this.measure();
    // The ruler goes in the top layer, so no transformed or contained ancestor can become its containing block
    const layer = this.querySelector<HTMLElement>(".ui-bpo__layer");
    if (this.isConnected && layer?.isConnected && !layer.matches(":popover-open") && typeof layer.showPopover === "function") layer.showPopover();
  }

  /* ---------- Measuring ---------- */

  private watch() {
    this.resizer?.disconnect();
    this.resizer = null;
    this.watched = this.target;
    // Measuring something else isn't crossing a breakpoint: start again without an event
    this.lastId = undefined;
    if (this.target && typeof ResizeObserver !== "undefined") {
      this.resizer = new ResizeObserver(() => this.onResize());
      this.resizer.observe(this.target);
    }
  }

  /** One measurement a frame, however fast the window is dragged */
  private onResize = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.measure();
    });
  };

  private measure() {
    const box = this.target?.getBoundingClientRect();
    const w = Math.round(box ? box.width : window.innerWidth);
    const h = Math.round(box ? box.height : window.innerHeight);
    if (w !== this.size.w || h !== this.size.h) this.size = { w, h };
    const bp = currentBreakpoint(this.breakpoints, w);
    const id = bp?.id ?? null;
    if (this.lastId !== undefined && id !== this.lastId) {
      this.emit<BreakpointOverlayBreakpointChange>("tc-breakpoint-change", { breakpoint: bp, width: w });
      if (this.open || !this.floating) this.announce = `Breakpoint ${bp ? (bp.label ?? bp.id) : "base"}`;
    }
    this.lastId = id;
  }

  /* ---------- Opening ---------- */

  private setOpen(open: boolean) {
    if (open === this.open) return;
    if (!this.emit<BreakpointOverlayOpenChange>("tc-open-change", { open }, { cancelable: true })) return;
    this.open = open;
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented || !this.open || !this.floating) return;
    const t = e.target as Element | null;
    // Escape belongs to an open dialog, menu or popover on the page first
    if (t && !this.contains(t) && t.closest("dialog[open], [role='menu'], [role='listbox'], [aria-expanded='true']")) return;
    const inside = !!t && this.contains(t);
    // Decided once the event is done: a page handler that runs after this one may still prevent it
    setTimeout(() => {
      if (e.defaultPrevented || !this.open) return;
      this.setOpen(false);
      if (inside) void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-bpo__badge")?.focus());
    }, 0);
  };

  private close() {
    this.setOpen(false);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-bpo__badge")?.focus());
  }

  /* ---------- Rendering ---------- */

  private get followsWindow() {
    return !this.target;
  }

  private name(bp: BreakpointOverlayBreakpoint | null) {
    return bp ? (bp.label ?? bp.id) : "Base";
  }

  /** The scale's right end: past the widest breakpoint, and never short of the width itself */
  private get scaleMax() {
    const top = Math.max(0, ...this.breakpoints.map((b) => b.max ?? b.min ?? 0));
    return Math.max(this.size.w, Math.ceil(top * 1.25), 1);
  }

  /** Each breakpoint's stretch of the scale: its range, or from its min to the next one's */
  private get segments() {
    const sorted = [...this.breakpoints].sort((a, b) => (a.min ?? a.max ?? 0) - (b.min ?? b.max ?? 0));
    const max = this.scaleMax;
    return sorted.map((b, i) => {
      const from = b.min ?? 0;
      const next = sorted.slice(i + 1).find((n) => n.min !== undefined && n.min > from);
      const to = b.max ?? (next?.min !== undefined ? next.min - 1 : max);
      return { b, from, to };
    });
  }

  private renderScale() {
    const max = this.scaleMax;
    const at = (px: number) => `${(Math.min(px, max) / max) * 100}%`;
    const w = this.size.w;
    return html`<div class="ui-bpo__scale" aria-hidden="true">
      <div class="ui-bpo__scale-bar">
        ${this.segments.map(
          ({ b, from, to }) =>
            html`<span class="ui-bpo__seg" ?data-on=${breakpointApplies(b, w)} style=${`left:${at(from)};width:calc(${at(to)} - ${at(from)});--tone:${breakpointTone(this.breakpoints, b.id)}`}></span>`,
        )}
        <span class="ui-bpo__mark" style=${`left:${at(w)}`}></span>
      </div>
      <div class="ui-bpo__scale-labels">
        <span>0</span>
        <span class="ui-bpo__scale-now" style=${`left:${at(w)}`}>${w}px</span>
        <span>${max}</span>
      </div>
    </div>`;
  }

  private renderRuler() {
    if (!this.showRuler || !this.followsWindow || !this.floating || !this.open) return nothing;
    const w = this.size.w || 1;
    const max = Math.max(w, ...this.breakpoints.map((b) => b.max ?? b.min ?? 0), 1);
    const at = (px: number) => `${(Math.min(px, max) / max) * 100}%`;
    return html`<div class="ui-bpo__layer" .popover=${"manual"}>
      <div class="ui-bpo__ruler" aria-hidden="true">
        <div class="ui-bpo__ruler-track">
          ${this.segments.map(({ b, from, to }) => {
            const tone = breakpointTone(this.breakpoints, b.id);
            return html`<span class="ui-bpo__band" ?data-on=${breakpointApplies(b, w)} style=${`left:${at(from)};width:calc(${at(to)} - ${at(from)});--tone:${tone}`}></span>
              ${b.min !== undefined ? html`<span class="ui-bpo__tick" style=${`left:${at(from)};--tone:${tone}`}><span class="ui-bpo__tick-label">${b.label ?? b.id} ${from}</span></span>` : nothing}`;
          })}
          <span class="ui-bpo__now" style=${`left:${at(w)}`}><span class="ui-bpo__now-label">${w}px</span></span>
        </div>
      </div>
    </div>`;
  }

  private renderPanel() {
    const id = this.uid;
    const w = this.size.w;
    const bp = currentBreakpoint(this.breakpoints, w);
    const what = this.followsWindow ? "Window" : "Width";
    const head = cardHead({
      icon: rulerIcon,
      title: this.heading,
      subtitle: `${what} ${w} × ${this.size.h} · ${this.name(bp)}`,
      id: `${id}-title`,
      keepAside: true,
      aside: this.floating ? html`<button type="button" class="ui-bpo__close" @click=${() => this.close()}>${xIcon()}<span class="tc-sr-only">Close ${this.heading}</span></button>` : nothing,
    });
    return html`<div class="ui-bpo__panel" id=${`${id}-panel`} role="region" aria-labelledby=${`${id}-title`}>
      ${head}
      <div class="ui-bpo__body">
        ${this.renderScale()}
        <ul class="ui-bpo__bps" aria-label=${this.heading}>
          ${this.breakpoints.map((b) => {
            const on = breakpointApplies(b, w);
            const current = b === bp;
            return html`<li class="ui-bpo__bp" ?data-on=${on} ?data-current=${current} style=${`--tone:${breakpointTone(this.breakpoints, b.id)}`}>
              <span class="ui-bpo__dot" aria-hidden="true"></span>
              <span class="ui-bpo__bp-main">
                <span class="ui-bpo__bp-name">${b.label ?? b.id}${b.label && b.label.toLowerCase() !== b.id.toLowerCase() ? html` <span class="ui-bpo__bp-id">${b.id}</span>` : nothing}</span>
                <code class="ui-bpo__query">${breakpointQuery(b)}</code>
              </span>
              <span class="ui-bpo__bp-range">${breakpointRange(b)}</span>
              <span class="ui-bpo__bp-state">${current ? "Current" : on ? "Applies" : html`<span class="tc-sr-only">Doesn't apply</span>`}</span>
            </li>`;
          })}
        </ul>
        ${this.floating
          ? html`<p class="ui-bpo__keys">${this.hotkey ? html`<kbd>${comboLabel(this.hotkey)}</kbd> open and close · ` : nothing}<kbd>Esc</kbd> close</p>`
          : nothing}
      </div>
    </div>`;
  }

  protected override render() {
    const status = html`<span class="tc-sr-only" role="status">${this.announce}</span>`;
    if (!this.floating) return html`${status}${this.renderPanel()}`;
    const w = this.size.w;
    const bp = currentBreakpoint(this.breakpoints, w);
    const tone = bp ? breakpointTone(this.breakpoints, bp.id) : "var(--tc-text-muted)";
    return html`${status}
      <button type="button" class="ui-bpo__badge" style=${`--tone:${tone}`} aria-expanded=${this.open ? "true" : "false"} aria-controls=${`${this.uid}-panel`} @click=${() => this.setOpen(!this.open)}>
        <span class="ui-bpo__dot" aria-hidden="true"></span>
        <span class="ui-bpo__badge-name">${this.name(bp)}</span>
        <span class="ui-bpo__badge-w">${w}px</span>
        <span class="tc-sr-only">${this.open ? "Hide" : "Show"} ${this.heading.toLowerCase()}</span>
      </button>
      ${this.open ? this.renderPanel() : nothing}${this.renderRuler()}`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="bpo"] {
  --tc-bpo-w: 340px;
  --tc-bpo-ruler-h: 28px;
  position: relative;
  box-sizing: border-box;
  display: block;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="bpo"] *, [data-ui="bpo"] *::before, [data-ui="bpo"] *::after { box-sizing: border-box; }
:where([data-ui="bpo"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="bpo"] :is(button, a, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="bpo"]) :is(h4, p, ul) { margin: 0; padding: 0; }
[data-ui="bpo"] ul { list-style: none; }
[data-ui="bpo"] svg { display: block; flex: none; }
[data-ui="bpo"] kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); color: var(--tc-kbd-fg); }
/* ----- Floating: the badge in a corner of the window, the panel beside it ----- */
[data-ui="bpo"][floating] { position: fixed; z-index: var(--tc-z-toast); display: flex; flex-direction: column-reverse; align-items: flex-start; gap: var(--tc-space-2); width: min(var(--tc-bpo-w), calc(100vw - 2 * var(--tc-space-4))); pointer-events: none; }
[data-ui="bpo"][floating] > * { pointer-events: auto; }
[data-ui="bpo"][floating]:is([corner="bottom-left"], :not([corner])) { left: var(--tc-space-4); bottom: var(--tc-space-4); }
[data-ui="bpo"][floating][corner="bottom-right"] { right: var(--tc-space-4); bottom: var(--tc-space-4); align-items: flex-end; }
[data-ui="bpo"][floating][corner="top-left"] { top: calc(var(--tc-bpo-ruler-h) + var(--tc-space-4)); left: var(--tc-space-4); flex-direction: column; }
[data-ui="bpo"][floating][corner="top-right"] { top: calc(var(--tc-bpo-ruler-h) + var(--tc-space-4)); right: var(--tc-space-4); flex-direction: column; align-items: flex-end; }
[data-ui="bpo"]:not([floating]) { width: 100%; max-width: var(--tc-bpo-w); }
.ui-bpo__badge { display: inline-flex; align-items: center; gap: var(--tc-space-2); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; }
.ui-bpo__badge:hover { background: var(--tc-surface-overlay); }
.ui-bpo__badge-w { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-bpo__dot { width: var(--tc-space-2); height: var(--tc-space-2); flex: none; border-radius: var(--tc-radius-full); background: var(--tone); }
/* ----- The panel ----- */
[data-ui="bpo"][floating] .ui-bpo__panel { width: 100%; box-shadow: var(--tc-shadow-overlay); }
:where([data-look="standard"], [data-look="standard"] *).ui-bpo__panel { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-bpo__body { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-bpo__panel { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-bpo__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-bpo__body { display: grid; gap: var(--tc-space-3); max-height: min(70vh, 560px); overflow-y: auto; padding: var(--tc-space-3); scrollbar-width: thin; }
[data-ui="bpo"]:not([floating]) .ui-bpo__body { max-height: none; }
.ui-bpo__close { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-bpo__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Scale */
.ui-bpo__scale { display: grid; gap: var(--tc-space-1); }
.ui-bpo__scale-bar { position: relative; height: var(--tc-space-3); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); overflow: hidden; }
.ui-bpo__seg { position: absolute; top: 0; bottom: 0; background: color-mix(in srgb, var(--tone) 22%, transparent); box-shadow: inset 1px 0 0 var(--tc-surface-raised); }
.ui-bpo__seg[data-on] { background: color-mix(in srgb, var(--tone) 55%, transparent); }
.ui-bpo__mark { position: absolute; top: 0; bottom: 0; width: 2px; transform: translateX(-50%); background: var(--tc-text-primary); }
.ui-bpo__scale-labels { position: relative; display: flex; justify-content: space-between; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-bpo__scale-now { position: absolute; top: 0; transform: translateX(-50%); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-inverse); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-on-inverse); white-space: nowrap; }
/* Breakpoints */
.ui-bpo__bps { display: grid; gap: var(--tc-space-0-5); }
.ui-bpo__bp { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-md); padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-bpo__bp .ui-bpo__dot { background: none; box-shadow: inset 0 0 0 1.5px var(--tone); }
.ui-bpo__bp[data-on] { color: var(--tc-text-secondary); }
.ui-bpo__bp[data-on] .ui-bpo__dot { background: var(--tone); }
.ui-bpo__bp[data-current] { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-bpo__bp-main { display: grid; min-width: 0; }
.ui-bpo__bp-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-bpo__bp-id { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-bpo__query { overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-bpo__bp-range { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-bpo__bp-state { min-width: 3.5rem; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); text-align: right; }
.ui-bpo__keys { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* ----- The ruler across the top of the window ----- */
.ui-bpo__layer { position: fixed; z-index: calc(var(--tc-z-toast) - 1); inset: 0 0 auto; width: auto; height: var(--tc-bpo-ruler-h); margin: 0; padding: 0; overflow: visible; border: 0; background: transparent; color: inherit; font: inherit; pointer-events: none; }
.ui-bpo__layer:not(:popover-open) { display: block; }
.ui-bpo__ruler { position: absolute; inset: 0; background: color-mix(in srgb, var(--tc-surface-raised) 92%, transparent); box-shadow: 0 1px 0 var(--tc-border-default); backdrop-filter: blur(6px); }
.ui-bpo__ruler-track { position: absolute; inset: 0 var(--tc-space-2); }
.ui-bpo__band { position: absolute; bottom: 0; height: 3px; background: color-mix(in srgb, var(--tone) 25%, transparent); }
.ui-bpo__band[data-on] { background: color-mix(in srgb, var(--tone) 60%, transparent); }
.ui-bpo__tick { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px solid var(--tone); }
.ui-bpo__tick-label { position: absolute; top: var(--tc-space-1); left: var(--tc-space-1); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-bpo__now { position: absolute; top: 0; bottom: 0; width: 0; border-left: 2px solid var(--tc-text-primary); }
.ui-bpo__now-label { position: absolute; top: calc(var(--tc-bpo-ruler-h) + var(--tc-space-1)); left: 0; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-surface-inverse); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-on-inverse); transform: translateX(-100%); white-space: nowrap; font-variant-numeric: tabular-nums; }
@media (forced-colors: active) {
  .ui-bpo__badge { border: 1px solid ButtonText; }
  .ui-bpo__bp[data-current] { outline: 2px solid Highlight; }
  .ui-bpo__dot, .ui-bpo__seg[data-on] { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-breakpoint-overlay")) customElements.define("tc-breakpoint-overlay", TcBreakpointOverlay);

declare global {
  interface HTMLElementTagNameMap {
    "tc-breakpoint-overlay": TcBreakpointOverlay;
  }
}
