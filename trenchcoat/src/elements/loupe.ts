import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { HotkeyController } from "./internal/controllers";
import { safeUrl } from "./internal/safe-url";
import { isMac } from "./internal/util";

/*
 * <tc-loupe> – a design-system inspector laid over a live page, for the people building it. Turn it on (⌘⇧L / Ctrl
 * Shift L, or `active`) and:
 *   · Components – every element that's one of the system's components (`selector`: [data-ds-component] and the
 *     library's own [data-ui]) gets an outline; point at one for a card with its name, where it lives, its size and
 *     look, and links to its docs, source and design file. The panel lists them all: pick one to scroll to it and keep
 *     its card up
 *   · Breakpoints – a ruler across the top of the window with each breakpoint marked and the window's width on it;
 *     the panel says which ones apply now
 *   · Layouts – flex and grid containers outlined, listed with their direction, gap and alignment; pick one to see it
 * The page underneath keeps working: the outlines don't take the pointer, nothing stops it scrolling, and they follow
 * scrolling, resizing and changes to the page. Escape turns it off.
 *
 * What a component is called comes from the page: `describe(element)` returns its card, or `components` maps a name
 * (data-ds-component's value, or the library's element name) to its description and links. By default the name is
 * data-ds-component, else the tc-* element's name, and the path data-ds-path.
 *
 * Floating (the default) the panel sits at the window's bottom right while it's on, and nothing shows while it's off
 * (unless `launcher`). With `floating` off it's an ordinary card in the page, with a button to start.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-loupe .components=${{ Button: { docs: "/docs/button", source: "https://github.com/…/button.ts" } }}></tc-loupe>
 */

export type LoupeLink = { label: string; href: string; kind?: "docs" | "source" | "design" | "other" };
/** What the card says about a component */
export type LoupeComponentInfo = {
  name: string;
  /** Where its code lives, e.g. "src/components/Button.vue" */
  path?: string;
  description?: string;
  links?: LoupeLink[];
};
/** A component's description and links, by name, for `components` */
export type LoupeComponentMeta = Omit<LoupeComponentInfo, "name" | "links"> & {
  name?: string;
  docs?: string;
  source?: string;
  design?: string;
  links?: LoupeLink[];
};
export type LoupeBreakpoint = { id: string; label?: string; min?: number; max?: number };
export type LoupeFeature = "components" | "ruler" | "layouts";

/** Details of the events */
export type LoupeActiveChange = { active: boolean };
export type LoupeFeatureChange = { feature: LoupeFeature; on: boolean };
export type LoupeSelect = { element: Element; info: LoupeComponentInfo };

export const defaultLoupeBreakpoints: LoupeBreakpoint[] = [
  { id: "sm", label: "Small", min: 640 },
  { id: "md", label: "Medium", min: 768 },
  { id: "lg", label: "Large", min: 1024 },
  { id: "xl", label: "Extra large", min: 1280 },
  { id: "2xl", label: "2× large", min: 1536 },
];

let uidCount = 0;
const MAX_SCAN = 4000;
const TONES = ["violet", "info", "pink", "amber", "teal", "success", "rose"];

/* scan-eye, x, book-open, code, pen-tool, external-link, layout-grid, columns, rows: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const scanEye = svg`<path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><circle cx="12" cy="12" r="1"></circle><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"></path>`;
const xIcon = () => lucide(16, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const linkIcons: Record<string, ReturnType<typeof svg>> = {
  docs: svg`<path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>`,
  source: svg`<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>`,
  design: svg`<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"></path><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"></path><path d="m2.3 2.3 7.286 7.286"></path><circle cx="11" cy="11" r="2"></circle>`,
  other: svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`,
};
const externalIcon = () => lucide(12, linkIcons.other);
const gridIcon = () => lucide(14, svg`<rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect>`);
const rowIcon = () => lucide(14, svg`<rect width="6" height="16" x="2" y="4" rx="1"></rect><rect width="6" height="16" x="9" y="4" rx="1"></rect><rect width="6" height="16" x="16" y="4" rx="1"></rect>`);
const colIcon = () => lucide(14, svg`<rect width="16" height="6" x="4" y="2" rx="1"></rect><rect width="16" height="6" x="4" y="9" rx="1"></rect><rect width="16" height="6" x="4" y="16" rx="1"></rect>`);

/** "tc-agent-inbox" → "Agent inbox" */
const tagWords = (tag: string) => {
  const w = tag.replace(/^tc-/, "").replace(/-/g, " ");
  return w.charAt(0).toUpperCase() + w.slice(1);
};

/** Whether a breakpoint applies at this width */
export const breakpointApplies = (bp: LoupeBreakpoint, width: number) =>
  (bp.min === undefined || width >= bp.min) && (bp.max === undefined || width <= bp.max) && (bp.min !== undefined || bp.max !== undefined);
/** A breakpoint's range in words: "≥ 640 px", "≤ 767 px", "640–1023 px" */
export const breakpointRange = (bp: LoupeBreakpoint) =>
  bp.min !== undefined && bp.max !== undefined ? `${bp.min}–${bp.max} px` : bp.min !== undefined ? `≥ ${bp.min} px` : bp.max !== undefined ? `≤ ${bp.max} px` : "All widths";

type Box = { x: number; y: number; w: number; h: number };
type Found = { el: Element; info: LoupeComponentInfo; box: Box | null };
type Layout = { el: Element; kind: "flex" | "grid"; label: string; direction: string; gap: string; align: string; justify: string; box: Box | null };

/**
 * A design-system inspector over a live page – components outlined with a card of their name, path and links, a
 * breakpoint ruler, and flex and grid containers outlined and listed; ⌘⇧L to turn it on.
 * @tag tc-loupe
 * @fires tc-active-change - Turned on or off ({ active }: LoupeActiveChange), by the hotkey, Escape, Close or the start button; cancelable – prevented, `active` stays as it was
 * @fires tc-feature-change - Components, the ruler or layouts were switched ({ feature, on }: LoupeFeatureChange); cancelable – prevented, the switch stays
 * @fires tc-select - A component was picked in the panel ({ element, info }: LoupeSelect)
 */
export class TcLoupe extends TcElement {
  static override ui = "lpe";

  /** The panel's heading */
  @property() accessor heading = "Loupe";
  /** Whether it's on. Changed by the user unless a tc-active-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor active = false;
  /** Turns it on and off from anywhere ("mod+shift+l" is ⌘⇧L on Apple keyboards, Ctrl Shift L elsewhere); false turns it off */
  @property({ attribute: false }) accessor hotkey: string | false = "mod+shift+l";
  /** What counts as a component */
  @property() accessor selector = "[data-ds-component], [data-ui]";
  /** Where to look; the whole page by default */
  @property({ attribute: false }) accessor root: Element | null = null;
  /** Descriptions and links by component name: the data-ds-component value, or the element's name in words */
  @property({ attribute: false }) accessor components: Record<string, LoupeComponentMeta> = {};
  /** Describes an element itself; return null to leave it to the defaults */
  @property({ attribute: false }) accessor describe: ((element: Element) => LoupeComponentInfo | null | undefined) | undefined = undefined;
  /** The breakpoints the ruler and the panel show */
  @property({ attribute: false }) accessor breakpoints: LoupeBreakpoint[] = defaultLoupeBreakpoints;
  /** Outline components. Switched by the user unless tc-feature-change is prevented */
  @property({ type: Boolean, attribute: "show-components" }) accessor showComponents = true;
  /** Show the breakpoint ruler. Switched by the user unless tc-feature-change is prevented */
  @property({ type: Boolean, attribute: "show-ruler" }) accessor showRuler = true;
  /** Outline and list flex and grid containers. Switched by the user unless tc-feature-change is prevented */
  @property({ type: Boolean, attribute: "show-layouts" }) accessor showLayouts = false;
  /** The panel floats at the window's corner while on; off, it's a card in the page */
  @property({ type: Boolean, reflect: true }) accessor floating = true;
  /** Floating and off: show a small button that turns it on */
  @property({ type: Boolean }) accessor launcher = false;

  @state() private accessor found: Found[] = [];
  @state() private accessor layouts: Layout[] = [];
  @state() private accessor viewport = { w: 0, h: 0 };
  @state() private accessor hovered: Element | null = null;
  @state() private accessor selected: Element | null = null;
  @state() private accessor layoutAt = -1;
  @state() private accessor compAt = 0;
  @state() private accessor scanning = false;
  @state() private accessor card: { x: number; y: number } | null = null;
  @state() private accessor announce = "";

  private uid = `tc-lpe-${++uidCount}`;
  private frame = 0;
  private observer: MutationObserver | null = null;
  private scanToken = { cancelled: false };

  constructor() {
    super();
    new HotkeyController(
      this,
      () => this.isConnected && this.hotkey,
      () => {
        this.setActive(!this.active);
        return true;
      },
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stop();
  }

  /* ---------- On and off ---------- */

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("active")) {
      if (this.active) this.start();
      else if (changed.get("active") !== undefined) this.stop();
    }
    if (this.active && (changed.has("selector") || changed.has("root") || changed.has("components") || changed.has("describe"))) this.schedule(true);
    if (this.active && changed.has("showLayouts")) {
      if (this.showLayouts) void this.scanLayouts();
      else {
        this.scanToken.cancelled = true;
        this.layouts = [];
        this.layoutAt = -1;
      }
    }
    // The card goes beside its component once both are drawn
    if (changed.has("hovered") || changed.has("selected") || changed.has("found")) this.placeCard();
    // Only while it's on the page: a last render after it left (stop() clears state) mustn't try to show it
    const layer = this.querySelector<HTMLElement>(".ui-lpe__layer");
    if (this.isConnected && layer?.isConnected && !layer.matches(":popover-open") && typeof layer.showPopover === "function") layer.showPopover();
  }

  private setActive(active: boolean) {
    if (active === this.active) return;
    if (!this.emit<LoupeActiveChange>("tc-active-change", { active }, { cancelable: true })) return;
    this.active = active;
    this.announce = active ? "Loupe on" : "Loupe off";
  }

  private setFeature(feature: LoupeFeature, on: boolean) {
    if (!this.emit<LoupeFeatureChange>("tc-feature-change", { feature, on }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    if (feature === "components") this.showComponents = on;
    else if (feature === "ruler") this.showRuler = on;
    else this.showLayouts = on;
  }

  private start() {
    const doc = this.ownerDocument;
    doc.addEventListener("pointermove", this.onPointer, { passive: true });
    doc.addEventListener("pointerleave", this.onLeave);
    doc.addEventListener("keydown", this.onKey, true);
    window.addEventListener("scroll", this.onMove, { capture: true, passive: true });
    window.addEventListener("resize", this.onMove);
    this.observer = new MutationObserver((records) => {
      // Our own outlines change nothing worth rescanning for
      if (records.every((r) => this.contains(r.target))) return;
      this.schedule(true);
    });
    this.observer.observe(this.scope, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-ds-component", "data-ui", "class", "style", "hidden"] });
    this.schedule(true);
    if (this.showLayouts) void this.scanLayouts();
  }

  private stop() {
    const doc = this.ownerDocument;
    doc.removeEventListener("pointermove", this.onPointer);
    doc.removeEventListener("pointerleave", this.onLeave);
    doc.removeEventListener("keydown", this.onKey, true);
    window.removeEventListener("scroll", this.onMove, { capture: true });
    window.removeEventListener("resize", this.onMove);
    this.observer?.disconnect();
    this.observer = null;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.scanToken.cancelled = true;
    this.found = [];
    this.layouts = [];
    this.hovered = null;
    this.selected = null;
    this.layoutAt = -1;
    this.card = null;
  }

  private get scope(): Element {
    return this.root ?? this.ownerDocument.body;
  }

  /* ---------- Finding and measuring ---------- */

  private rescanNeeded = false;
  /** One frame later: find the components again (when asked) and measure everything */
  private schedule(rescan = false) {
    this.rescanNeeded ||= rescan;
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      if (!this.active) return;
      if (this.rescanNeeded) this.find();
      this.rescanNeeded = false;
      this.measure();
    });
  }
  private onMove = () => this.schedule();

  private infoFor(el: Element): LoupeComponentInfo {
    const own = this.describe?.(el);
    if (own) return own;
    const tag = el.tagName.toLowerCase();
    const named = el.getAttribute("data-ds-component");
    const name = named ?? (tag.startsWith("tc-") ? tagWords(tag) : el.getAttribute("data-ui") ?? tag);
    const meta = this.components[name] ?? (tag.startsWith("tc-") ? this.components[tag] : undefined) ?? {};
    const links: LoupeLink[] = [...(meta.links ?? [])];
    if (meta.docs) links.push({ label: "Docs", href: meta.docs, kind: "docs" });
    if (meta.source) links.push({ label: "Source", href: meta.source, kind: "source" });
    if (meta.design) links.push({ label: "Design", href: meta.design, kind: "design" });
    return {
      name: meta.name ?? name,
      path: el.getAttribute("data-ds-path") ?? meta.path ?? (tag.startsWith("tc-") ? `<${tag}>` : undefined),
      description: meta.description,
      links,
    };
  }

  private find() {
    const scope = this.scope;
    const all = [...scope.querySelectorAll(this.selector)];
    if (scope.matches(this.selector)) all.unshift(scope);
    // The outermost of each component (a tc-* element's own parts carry data-ui too), never the Loupe itself
    const els = all.filter((el) => !this.contains(el) && el !== this && !(el.parentElement && all.some((o) => o !== el && o.contains(el) && o.tagName === el.tagName && o.getAttribute("data-ui") === el.getAttribute("data-ui"))));
    this.found = els.filter((el) => !this.isHidden(el)).map((el) => ({ el, info: this.infoFor(el), box: null }));
    if (this.selected && !this.found.some((f) => f.el === this.selected)) this.selected = null;
    if (this.compAt > this.found.length - 1) this.compAt = Math.max(0, this.found.length - 1);
  }

  private isHidden(el: Element) {
    const r = el.getBoundingClientRect();
    return r.width === 0 && r.height === 0;
  }

  private measure() {
    const box = (el: Element): Box | null => {
      if (!el.isConnected) return null;
      const r = el.getBoundingClientRect();
      return r.width || r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
    };
    this.viewport = { w: window.innerWidth, h: window.innerHeight };
    this.found = this.found.map((f) => ({ ...f, box: box(f.el) }));
    if (this.layouts.length) this.layouts = this.layouts.map((l) => ({ ...l, box: box(l.el) }));
    this.placeCard();
  }

  /** Flex and grid containers in the scope, read in slices so a big page doesn't stall; cancelled by turning it off */
  private async scanLayouts() {
    this.scanToken.cancelled = true;
    const token = { cancelled: false };
    this.scanToken = token;
    this.scanning = true;
    this.layouts = [];
    this.layoutAt = -1;
    const els = [...this.scope.querySelectorAll("*")].slice(0, MAX_SCAN);
    const out: Layout[] = [];
    for (let i = 0; i < els.length; i += 200) {
      if (token.cancelled) return;
      for (const el of els.slice(i, i + 200)) {
        if (this.contains(el) || el instanceof SVGElement) continue;
        const cs = getComputedStyle(el);
        const kind = /flex/.test(cs.display) ? "flex" : /grid/.test(cs.display) ? "grid" : null;
        if (!kind) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cls = [...el.classList].slice(0, 2).join(".");
        out.push({
          el,
          kind,
          label: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : cls ? `.${cls}` : ""}`,
          direction: kind === "flex" ? cs.flexDirection : cs.gridAutoFlow,
          gap: cs.gap === "normal" ? "0" : cs.gap,
          align: cs.alignItems,
          justify: cs.justifyContent,
          box: null,
        });
      }
      await new Promise((r) => setTimeout(r, 0));
    }
    if (token.cancelled) return;
    this.layouts = out;
    this.scanning = false;
    this.measure();
    this.announce = `${out.length} layout ${out.length === 1 ? "container" : "containers"}`;
  }

  /* ---------- Pointer and keys ---------- */

  private onPointer = (e: PointerEvent) => {
    if (!this.showComponents) return;
    const t = e.target as Element | null;
    if (!t || this.contains(t)) return;
    let hit: Element | null = null;
    for (let n: Element | null = t; n && n !== this.scope.parentElement; n = n.parentElement) {
      if (this.found.some((f) => f.el === n)) {
        hit = n;
        break;
      }
    }
    if (hit !== this.hovered) this.hovered = hit;
  };
  private onLeave = () => (this.hovered = null);

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    const t = e.target as Element | null;
    // Escape belongs to an open dialog or menu on the page first
    if (t && !this.contains(t) && t.closest("dialog[open], [role='menu'], [role='listbox'], [aria-expanded='true']")) return;
    if (this.selected && this.contains(t)) {
      this.selected = null;
      e.preventDefault();
      return;
    }
    e.preventDefault();
    this.setActive(false);
  };

  private select(i: number, scroll = true) {
    const f = this.found[i];
    if (!f) return;
    this.compAt = i;
    this.selected = f.el;
    this.emit<LoupeSelect>("tc-select", { element: f.el, info: f.info });
    this.announce = `${f.info.name}${f.info.path ? `, ${f.info.path}` : ""}`;
    if (scroll) f.el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    this.schedule();
  }

  private onListKey(e: KeyboardEvent, count: number, at: number, go: (i: number) => void, act?: (i: number) => void) {
    const next = e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? count - 1 : null;
    if (next !== null) {
      e.preventDefault();
      go(Math.max(0, Math.min(count - 1, next)));
    } else if ((e.key === "Enter" || e.key === " ") && act) {
      e.preventDefault();
      act(at);
    }
  }

  /** Beside the component it describes, on whichever side has room, kept in the window */
  private placeCard() {
    const el = this.hovered ?? this.selected;
    const f = el && this.found.find((x) => x.el === el);
    if (!f?.box) {
      if (this.card) this.card = null;
      return;
    }
    const w = 300;
    const h = 190;
    const pad = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = f.box.x + f.box.w + pad;
    if (x + w > vw - pad) x = f.box.x - w - pad;
    if (x < pad) x = Math.min(vw - w - pad, Math.max(pad, f.box.x));
    let y = f.box.y;
    if (x === f.box.x || (x > f.box.x && x < f.box.x + f.box.w)) y = f.box.y + f.box.h + pad;
    y = Math.max(pad + (this.showRuler ? 32 : 0), Math.min(vh - h - pad, y));
    if (!this.card || this.card.x !== x || this.card.y !== y) this.card = { x, y };
  }

  /* ---------- Rendering ---------- */

  private get currentBreakpoint() {
    const w = this.viewport.w;
    const on = this.breakpoints.filter((b) => breakpointApplies(b, w));
    if (!on.length) return null;
    return on.reduce((a, b) => ((b.min ?? 0) > (a.min ?? 0) ? b : a));
  }

  private tone(id: string) {
    const i = this.breakpoints.findIndex((b) => b.id === id);
    const t = TONES[(i < 0 ? 0 : i) % TONES.length];
    return t === "info" || t === "success" ? `var(--tc-status-${t}-solid)` : `var(--tc-tone-${t}-solid)`;
  }

  private renderRuler() {
    if (!this.showRuler) return nothing;
    const w = this.viewport.w || 1;
    const sorted = [...this.breakpoints].sort((a, b) => (a.min ?? a.max ?? 0) - (b.min ?? b.max ?? 0));
    const max = Math.max(w, ...this.breakpoints.map((b) => b.max ?? b.min ?? 0), 1920);
    const at = (px: number) => `${(px / max) * 100}%`;
    return html`<div class="ui-lpe__ruler" aria-hidden="true">
      <div class="ui-lpe__ruler-track">
        ${sorted.map((b) => {
          const from = b.min ?? 0;
          const to = b.max ?? max;
          const on = breakpointApplies(b, w);
          return html`<span class="ui-lpe__band" ?data-on=${on} style=${`left:${at(from)};width:calc(${at(to)} - ${at(from)});--tone:${this.tone(b.id)}`}></span>
            <span class="ui-lpe__tick" style=${`left:${at(from)};--tone:${this.tone(b.id)}`}><span class="ui-lpe__tick-label">${b.label ?? b.id} ${from}</span></span>`;
        })}
        <span class="ui-lpe__now" style=${`left:${at(Math.min(w, max))}`}><span class="ui-lpe__now-label">${w}px</span></span>
      </div>
    </div>`;
  }

  private renderLayer() {
    const showCard = this.card && (this.hovered ?? this.selected);
    const f = showCard ? this.found.find((x) => x.el === (this.hovered ?? this.selected)) : undefined;
    const target = this.hovered ?? this.selected;
    // A manual popover: the top layer, so no transformed or contained ancestor can become its containing block
    return html`<div class="ui-lpe__layer" .popover=${"manual"}>
      ${this.renderRuler()}
      ${this.showLayouts
        ? this.layouts.map((l, i) =>
            l.box
              ? html`<span class="ui-lpe__layout" data-kind=${l.kind} ?data-on=${i === this.layoutAt} style=${`left:${l.box.x}px;top:${l.box.y}px;width:${l.box.w}px;height:${l.box.h}px`}
                  >${i === this.layoutAt ? html`<span class="ui-lpe__layout-label">${l.kind} · ${l.direction} · gap ${l.gap}</span>` : nothing}</span
                >`
              : nothing,
          )
        : nothing}
      ${this.showComponents
        ? this.found.map((x) =>
            x.box
              ? html`<span class="ui-lpe__outline" ?data-on=${x.el === target} style=${`left:${x.box.x}px;top:${x.box.y}px;width:${x.box.w}px;height:${x.box.h}px`}
                  >${x.el === target ? html`<span class="ui-lpe__tag">${x.info.name}</span>` : nothing}</span
                >`
              : nothing,
          )
        : nothing}
      ${f && this.card ? this.renderCard(f) : nothing}
    </div>`;
  }

  private renderCard(f: Found) {
    const look = f.el.getAttribute("data-look");
    const size = f.box ? `${Math.round(f.box.w)} × ${Math.round(f.box.h)}` : "";
    return html`<div class="ui-lpe__card" role="note" aria-label=${`${f.info.name} details`} style=${`left:${this.card!.x}px;top:${this.card!.y}px`}>
      <p class="ui-lpe__card-name">${f.info.name}</p>
      ${f.info.path ? html`<p class="ui-lpe__card-path">${f.info.path}</p>` : nothing}
      ${f.info.description ? html`<p class="ui-lpe__card-desc">${f.info.description}</p>` : nothing}
      <p class="ui-lpe__card-meta">${size}${look ? html` · ${look === "clean" ? "Clean" : "Standard"} look` : nothing}</p>
      ${f.info.links?.length
        ? html`<div class="ui-lpe__links">
            ${f.info.links.map((l) => {
              const href = safeUrl(l.href);
              return href
                ? html`<a class="ui-lpe__link" href=${href} target="_blank" rel="noopener noreferrer">${lucide(14, linkIcons[l.kind ?? "other"] ?? linkIcons.other)}<span>${l.label}</span>${externalIcon()}</a>`
                : nothing;
            })}
          </div>`
        : nothing}
    </div>`;
  }

  private renderSwitch(feature: LoupeFeature, label: string, on: boolean, count?: number) {
    return html`<button type="button" role="switch" class="ui-lpe__switch" aria-checked=${on ? "true" : "false"} @click=${() => this.setFeature(feature, !on)}>
      <span class="ui-lpe__track" aria-hidden="true"><span class="ui-lpe__knob"></span></span>
      ${label}${count !== undefined && on ? html` <span class="ui-lpe__count">${count}</span>` : nothing}
    </button>`;
  }

  private renderPanel() {
    const id = this.uid;
    const bp = this.currentBreakpoint;
    const key = isMac() ? "⌘⇧L" : "Ctrl Shift L";
    const sub = this.active ? `${this.viewport.w} × ${this.viewport.h} · ${bp ? (bp.label ?? bp.id) : "Base"}` : "Components, breakpoints and layouts on the live page";
    const head = cardHead({
      icon: scanEye,
      title: this.heading,
      subtitle: sub,
      id: `${id}-title`,
      keepAside: true,
      aside: this.active ? html`<button type="button" class="ui-lpe__close" @click=${() => this.setActive(false)}>${xIcon()}<span class="tc-sr-only">Turn off ${this.heading}</span></button>` : nothing,
    });
    if (!this.active) {
      return html`${head}
        <div class="ui-lpe__body ui-lpe__intro">
          <p>Outline the page's components, see its breakpoints and inspect flex and grid layouts – the page keeps working underneath.</p>
          <button type="button" class="ui-lpe__start" @click=${() => this.setActive(true)}>${lucide(16, scanEye)}Inspect this page</button>
          ${this.hotkey ? html`<p class="ui-lpe__keys">or press <kbd>${key}</kbd></p>` : nothing}
        </div>`;
    }
    const comps = this.found;
    const activeComp = comps[this.compAt];
    return html`${head}
      <div class="ui-lpe__body">
        <div class="ui-lpe__switches" role="group" aria-label="Show">
          ${this.renderSwitch("components", "Components", this.showComponents, comps.length)}
          ${this.renderSwitch("ruler", "Breakpoints", this.showRuler)}
          ${this.renderSwitch("layouts", "Layouts", this.showLayouts, this.layouts.length)}
        </div>
        <section class="ui-lpe__section" aria-labelledby=${`${id}-bp`}>
          <h4 class="ui-lpe__label" id=${`${id}-bp`}>Breakpoints</h4>
          <ul class="ui-lpe__bps">
            ${this.breakpoints.map((b) => {
              const on = breakpointApplies(b, this.viewport.w);
              return html`<li class="ui-lpe__bp" ?data-on=${on} ?data-current=${b === bp} style=${`--tone:${this.tone(b.id)}`}>
                <span class="ui-lpe__bp-dot" aria-hidden="true"></span>
                <span class="ui-lpe__bp-name">${b.label ?? b.id}</span>
                <span class="ui-lpe__bp-range">${breakpointRange(b)}</span>
                <span class="ui-lpe__bp-state">${b === bp ? "Current" : on ? "Applies" : ""}</span>
              </li>`;
            })}
          </ul>
        </section>
        ${this.showComponents
          ? html`<section class="ui-lpe__section" aria-labelledby=${`${id}-comps`}>
              <h4 class="ui-lpe__label" id=${`${id}-comps`}>Components <span class="ui-lpe__count">${comps.length}</span></h4>
              ${comps.length
                ? html`<ul
                    class="ui-lpe__list"
                    role="listbox"
                    tabindex="0"
                    aria-labelledby=${`${id}-comps`}
                    aria-activedescendant=${ifDefined(activeComp ? `${id}-c-${this.compAt}` : undefined)}
                    @keydown=${(e: KeyboardEvent) =>
                      this.onListKey(
                        e,
                        comps.length,
                        this.compAt,
                        (i) => {
                          this.compAt = i;
                          this.select(i);
                          void this.updateComplete.then(() => this.querySelector(`#${id}-c-${i}`)?.scrollIntoView({ block: "nearest" }));
                        },
                        (i) => this.select(i),
                      )}
                  >
                    ${comps.map(
                      (c, i) => html`<li
                        class="ui-lpe__item"
                        role="option"
                        id=${`${id}-c-${i}`}
                        aria-selected=${c.el === this.selected ? "true" : "false"}
                        ?data-active=${i === this.compAt}
                        @click=${() => this.select(i)}
                        @pointerenter=${() => (this.hovered = c.el)}
                        @pointerleave=${() => (this.hovered = null)}
                      >
                        <span class="ui-lpe__item-name">${c.info.name}</span>
                        ${c.info.path ? html`<span class="ui-lpe__item-path">${c.info.path}</span>` : nothing}
                      </li>`,
                    )}
                  </ul>`
                : html`<p class="ui-lpe__empty">No components found here.</p>`}
            </section>`
          : nothing}
        ${this.showLayouts
          ? html`<section class="ui-lpe__section" aria-labelledby=${`${id}-lay`}>
              <h4 class="ui-lpe__label" id=${`${id}-lay`}>
                Layouts <span class="ui-lpe__count">${this.layouts.length}</span>
                <span class="ui-lpe__spacer"></span>
                <button type="button" class="ui-lpe__text-btn" @click=${() => (this.scanning ? ((this.scanToken.cancelled = true), (this.scanning = false)) : void this.scanLayouts())}>${this.scanning ? "Stop" : "Scan again"}</button>
              </h4>
              ${this.scanning
                ? html`<p class="ui-lpe__empty">Looking for flex and grid containers…</p>`
                : this.layouts.length
                  ? html`<ul
                      class="ui-lpe__list"
                      role="listbox"
                      tabindex="0"
                      aria-labelledby=${`${id}-lay`}
                      aria-activedescendant=${ifDefined(this.layoutAt >= 0 ? `${id}-l-${this.layoutAt}` : undefined)}
                      @keydown=${(e: KeyboardEvent) =>
                        this.onListKey(e, this.layouts.length, Math.max(0, this.layoutAt), (i) => {
                          this.layoutAt = i;
                          this.layouts[i].el.scrollIntoView({ block: "nearest", behavior: "smooth" });
                          void this.updateComplete.then(() => this.querySelector(`#${id}-l-${i}`)?.scrollIntoView({ block: "nearest" }));
                        })}
                    >
                      ${this.layouts.map(
                        (l, i) => html`<li
                          class="ui-lpe__item"
                          role="option"
                          id=${`${id}-l-${i}`}
                          aria-selected=${i === this.layoutAt ? "true" : "false"}
                          ?data-active=${i === this.layoutAt}
                          @click=${() => {
                            this.layoutAt = i === this.layoutAt ? -1 : i;
                            if (this.layoutAt >= 0) l.el.scrollIntoView({ block: "nearest", behavior: "smooth" });
                          }}
                        >
                          <span class="ui-lpe__item-name"
                            ><span class="ui-lpe__kind" data-kind=${l.kind}>${l.kind === "grid" ? gridIcon() : /column/.test(l.direction) ? colIcon() : rowIcon()}${l.kind === "grid" ? "Grid" : "Flex"}</span
                            ><code class="ui-lpe__sel">${l.label}</code></span
                          >
                          <span class="ui-lpe__item-path">${l.direction} · gap ${l.gap} · align ${l.align} · justify ${l.justify}</span>
                        </li>`,
                      )}
                    </ul>`
                  : html`<p class="ui-lpe__empty">No flex or grid containers here.</p>`}
            </section>`
          : nothing}
        <p class="ui-lpe__keys">${this.hotkey ? html`<kbd>${key}</kbd> on and off · ` : nothing}<kbd>Esc</kbd> off · point at a component for its card</p>
      </div>`;
  }

  protected override render() {
    const status = html`<span class="tc-sr-only" role="status">${this.announce}</span>`;
    if (this.floating && !this.active) {
      return html`${status}${this.launcher
        ? html`<button type="button" class="ui-lpe__launcher" @click=${() => this.setActive(true)}>${lucide(18, scanEye)}<span class="tc-sr-only">Turn on ${this.heading}</span></button>`
        : nothing}`;
    }
    return html`${status}<div class="ui-lpe__panel" role="region" aria-labelledby=${`${this.uid}-title`}>${this.renderPanel()}</div>${this.active ? this.renderLayer() : nothing}`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="lpe"] {
  --tc-lpe-w: 340px;
  --tc-lpe-outline: var(--tc-status-info-solid);
  --tc-lpe-layout: var(--tc-tone-pink-solid);
  --tc-lpe-ruler-h: 28px;
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
[data-ui="lpe"] *, [data-ui="lpe"] *::before, [data-ui="lpe"] *::after { box-sizing: border-box; }
:where([data-ui="lpe"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="lpe"] :is(button, a, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="lpe"]) :is(h4, p, ul) { margin: 0; padding: 0; }
[data-ui="lpe"] ul { list-style: none; }
[data-ui="lpe"] svg { display: block; flex: none; }
[data-ui="lpe"] kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); color: var(--tc-kbd-fg); }
/* ----- The panel: floating at the window's corner, or a card in the page ----- */
[data-ui="lpe"][floating] { position: fixed; z-index: var(--tc-z-toast); right: var(--tc-space-4); bottom: var(--tc-space-4); width: min(var(--tc-lpe-w), calc(100vw - 2 * var(--tc-space-4))); }
[data-ui="lpe"]:not([floating]) { width: 100%; max-width: var(--tc-lpe-w); }
:where([data-look="standard"], [data-look="standard"] *).ui-lpe__panel { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-lpe__body { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-lpe__panel { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-lpe__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="lpe"][floating] .ui-lpe__panel { box-shadow: var(--tc-shadow-overlay); }
.ui-lpe__body { display: grid; gap: var(--tc-space-3); max-height: min(70vh, 640px); overflow-y: auto; padding: var(--tc-space-3); scrollbar-width: thin; }
[data-ui="lpe"]:not([floating]) .ui-lpe__body { max-height: none; }
.ui-lpe__close { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-lpe__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-lpe__intro { justify-items: start; }
.ui-lpe__intro > p:first-child { color: var(--tc-text-secondary); }
.ui-lpe__start { display: inline-flex; align-items: center; gap: var(--tc-space-2); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); }
.ui-lpe__start:hover { background: var(--tc-action-primary-bg-hover); }
.ui-lpe__keys { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-lpe__launcher { position: fixed; z-index: var(--tc-z-toast); right: var(--tc-space-4); bottom: var(--tc-space-4); display: grid; place-items: center; width: var(--tc-control-h-lg); height: var(--tc-control-h-lg); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-primary); }
/* Switches */
.ui-lpe__switches { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); }
.ui-lpe__switch { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-lpe__switch[aria-checked="true"] { color: var(--tc-text-primary); }
.ui-lpe__track { position: relative; display: block; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-lpe__knob { position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: var(--tc-radius-full); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-lpe__switch[aria-checked="true"] .ui-lpe__track { background: var(--tc-switch-on); }
.ui-lpe__switch[aria-checked="true"] .ui-lpe__knob { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-lpe__count { display: inline-grid; place-items: center; min-width: var(--tc-space-5); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
/* Sections */
.ui-lpe__section { display: grid; gap: var(--tc-space-1-5); }
.ui-lpe__label { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-lpe__label .ui-lpe__count { text-transform: none; letter-spacing: normal; }
.ui-lpe__spacer { flex: 1; }
.ui-lpe__text-btn { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); letter-spacing: normal; text-transform: none; color: var(--tc-accent-text); }
.ui-lpe__text-btn:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-lpe__empty { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* Breakpoints */
.ui-lpe__bps { display: grid; gap: var(--tc-space-0-5); }
.ui-lpe__bp { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-lpe__bp[data-on] { color: var(--tc-text-secondary); }
.ui-lpe__bp[data-current] { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-lpe__bp-dot { width: var(--tc-space-2); height: var(--tc-space-2); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1.5px var(--tone); }
.ui-lpe__bp[data-on] .ui-lpe__bp-dot { background: var(--tone); }
.ui-lpe__bp-range { font-variant-numeric: tabular-nums; }
.ui-lpe__bp-state { min-width: 3.5rem; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); text-align: right; }
/* Lists of components and layouts */
.ui-lpe__list { display: grid; gap: var(--tc-space-0-5); max-height: 220px; overflow-y: auto; padding: var(--tc-space-0-5); border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); scrollbar-width: thin; }
[data-ui="lpe"]:not([floating]) .ui-lpe__list { max-height: 260px; }
.ui-lpe__item { display: grid; gap: 0; padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); cursor: pointer; }
.ui-lpe__item:hover { background: var(--tc-menu-item-hover); }
.ui-lpe__list:focus-visible .ui-lpe__item[data-active] { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-lpe__item[aria-selected="true"] { background: var(--tc-fill-selected); }
.ui-lpe__item-name { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-lpe__item-path { overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-lpe__kind { display: inline-flex; align-items: center; gap: var(--tc-space-1); flex: none; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-tone-pink-fg); }
.ui-lpe__kind[data-kind="grid"] { color: var(--tc-tone-violet-fg); }
.ui-lpe__sel { overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
/* ----- The layer over the page: outlines, the ruler and the card ----- */
.ui-lpe__layer { position: fixed; z-index: calc(var(--tc-z-toast) - 1); inset: 0; width: auto; height: auto; margin: 0; padding: 0; overflow: visible; border: 0; background: transparent; color: inherit; font: inherit; pointer-events: none; }
.ui-lpe__layer:not(:popover-open) { display: block; }
.ui-lpe__outline { position: fixed; border-radius: var(--tc-radius-xs); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-lpe-outline) 55%, transparent); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-lpe__outline[data-on] { background: color-mix(in srgb, var(--tc-lpe-outline) 10%, transparent); box-shadow: inset 0 0 0 2px var(--tc-lpe-outline); }
.ui-lpe__tag { position: absolute; left: 0; bottom: 100%; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs) var(--tc-radius-xs) 0 0; background: var(--tc-lpe-outline); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-on-accent); white-space: nowrap; }
.ui-lpe__layout { position: fixed; outline: 1px dashed color-mix(in srgb, var(--tc-lpe-layout) 45%, transparent); outline-offset: -1px; }
.ui-lpe__layout[data-on] { background: color-mix(in srgb, var(--tc-lpe-layout) 8%, transparent); outline: 2px solid var(--tc-lpe-layout); }
.ui-lpe__layout-label { position: absolute; top: 0; right: 0; padding: 0 var(--tc-space-1-5); border-radius: 0 0 0 var(--tc-radius-xs); background: var(--tc-lpe-layout); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-normal); color: var(--tc-text-on-accent); white-space: nowrap; }
.ui-lpe__ruler { position: fixed; top: 0; left: 0; right: 0; height: var(--tc-lpe-ruler-h); background: color-mix(in srgb, var(--tc-surface-raised) 92%, transparent); box-shadow: 0 1px 0 var(--tc-border-default); backdrop-filter: blur(6px); }
.ui-lpe__ruler-track { position: absolute; inset: 0 var(--tc-space-2); }
.ui-lpe__band { position: absolute; bottom: 0; height: 3px; background: color-mix(in srgb, var(--tone) 25%, transparent); }
.ui-lpe__band[data-on] { background: color-mix(in srgb, var(--tone) 60%, transparent); }
.ui-lpe__tick { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px solid var(--tone); }
.ui-lpe__tick-label { position: absolute; top: var(--tc-space-1); left: var(--tc-space-1); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-lpe__now { position: absolute; top: 0; bottom: 0; width: 0; border-left: 2px solid var(--tc-text-primary); }
.ui-lpe__now-label { position: absolute; top: calc(var(--tc-lpe-ruler-h) + var(--tc-space-1)); left: 0; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-surface-inverse); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-on-inverse); transform: translateX(-100%); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-lpe__card { position: fixed; display: grid; gap: var(--tc-space-1); width: 300px; padding: var(--tc-space-3); border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); pointer-events: auto; animation: ui-lpe-in var(--tc-duration-fast) var(--tc-ease-move) both; }
.ui-lpe__card-name { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-lpe__card-path { overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-lpe__card-desc { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-lpe__card-meta { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-lpe__links { display: grid; gap: var(--tc-space-0-5); margin-top: var(--tc-space-1); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-lpe__link { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); text-decoration: none; }
.ui-lpe__link:hover { background: var(--tc-menu-item-hover); }
.ui-lpe__link > span { flex: 1; }
.ui-lpe__link svg { color: var(--tc-icon-muted); }
@keyframes ui-lpe-in { from { opacity: 0; transform: translateY(2px); } }
@media (forced-colors: active) {
  .ui-lpe__outline, .ui-lpe__layout { outline: 1px solid Highlight; }
  .ui-lpe__item[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-lpe__track { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="lpe"] *, [data-ui="lpe"] *::before, [data-ui="lpe"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-loupe")) customElements.define("tc-loupe", TcLoupe);

declare global {
  interface HTMLElementTagNameMap {
    "tc-loupe": TcLoupe;
  }
}
