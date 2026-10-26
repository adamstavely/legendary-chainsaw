import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-region-dach> – the Lit port of illustrations/region-dach.tsx: a map of Germany, Austria and Switzerland. The
 * countries sit filled in the middle; the outlines of the neighbouring countries fade out towards the edges, and a
 * pastel band travels along the outer border (twice, then it rests). A small menu in the top-left corner switches to
 * the United States, China, India, Brazil or Japan; the old map fades out while the new one fades in. Natural Earth
 * country shapes (public domain). The band pauses off screen or in a hidden tab; reduced motion keeps it still.
 *
 *   <tc-region-dach region="jp"></tc-region-dach>
 *
 * A pick in the menu fires a cancelable tc-region-change first; call preventDefault() to control `region`.
 */

export type Region = "dach" | "us" | "cn" | "in" | "br" | "jp";

/** Detail of tc-region-change */
export type RegionDachRegionChange = { region: Region };

const OPTIONS: { value: Region; name: string; label: string }[] = [
  { value: "dach", name: "DACH", label: "Map of the DACH region: Germany, Austria and Switzerland" },
  { value: "us", name: "United States", label: "Map of the United States" },
  { value: "cn", name: "China", label: "Map of China" },
  { value: "in", name: "India", label: "Map of India" },
  { value: "br", name: "Brazil", label: "Map of Brazil" },
  { value: "jp", name: "Japan", label: "Map of Japan" },
];

type Phase = "idle" | "enter" | "exit";
type Layer = { key: number; region: Region; phase: Phase };

let serial = 0;

/* chevron-down and check: Lucide (ISC, lucide.dev) */
const chevronIcon = html`<svg class="ui-rd-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">${svg`<path d="m6 9 6 6 6-6" class="ui-rd-chevron-ink" stroke="#737373" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const tickIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M20 6 9 17l-5-5"></path>`}</svg>`;

/**
 * A map of the DACH region (or another country) with a band along its border and a menu to switch it.
 * @tag tc-region-dach
 * @fires tc-region-change - Cancelable, when the viewer picks a region; detail: RegionDachRegionChange ({ region })
 */
export class TcRegionDach extends TcElement {
  static override ui = "rd";
  static override looks = false;

  /** Shown region */
  @property() accessor region: Region = "dach";
  /** Show the region menu in the top-left corner */
  @property({ attribute: "show-switcher", type: Boolean, converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor showSwitcher = true;
  /** Accessible description of the map; a function receives the current region */
  @property({ attribute: false }) accessor label: string | ((region: Region) => string) | undefined = undefined;

  /** @internal The shown map plus any map still fading out */
  @state() accessor layers: Layer[] = [];
  /** @internal The menu is open */
  @state() accessor open = false;
  /** @internal The row the pointer or keyboard is on */
  @state() accessor active = 0;
  /** @internal The fill shows: the pointer is over a row, or the keyboard moves through the list */
  @state() accessor shown = false;

  private readonly svgId = `ui-rd${++serial}`;
  private readonly menuId = `ui-rd-menu${serial}`;
  private readonly screen = new OnScreenController(this);
  private resize?: ResizeObserver;
  private fadeTimer = 0;
  private fadeKey = -1;
  private wasShown = false;

  override connectedCallback() {
    super.connectedCallback();
    // The menu scales with the illustration, so it still fits in small previews – written to the host directly
    const fit = () => this.style.setProperty("--tc-region-dach-s", String(Math.min(1, Math.max(0.62, this.clientWidth / 540))));
    if (typeof ResizeObserver === "function") {
      this.resize = new ResizeObserver(fit);
      this.resize.observe(this);
    }
    fit();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resize?.disconnect();
    window.clearTimeout(this.fadeTimer);
    this.fadeKey = -1;
    document.removeEventListener("pointerdown", this.away);
  }

  private get selected() {
    return Math.max(
      0,
      OPTIONS.findIndex((o) => o.value === this.region),
    );
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.toggleAttribute("data-paused", !this.screen.onScreen);
    // A new region adds a layer in the same render; the old ones fade out
    const top = this.layers[this.layers.length - 1];
    if (!top) this.layers = [{ key: 0, region: this.region, phase: "idle" }];
    else if (top.region !== this.region)
      this.layers = [...this.layers.map((l) => ({ ...l, phase: "exit" as Phase })), { key: top.key + 1, region: this.region, phase: "enter" }];
  }

  protected override updated(changed: PropertyValues<this>) {
    const top = this.layers[this.layers.length - 1];
    const exiting = this.layers.some((l) => l.phase === "exit");
    if (!exiting) {
      window.clearTimeout(this.fadeTimer);
      this.fadeKey = -1;
    } else if (this.fadeKey !== top.key) {
      window.clearTimeout(this.fadeTimer);
      this.fadeKey = top.key;
      this.fadeTimer = window.setTimeout(() => {
        this.fadeKey = -1;
        this.layers = this.layers.filter((l) => l.phase !== "exit");
      }, 480);
    }
    if (!this.showSwitcher) return;
    const trigger = this.querySelector<HTMLElement>(".ui-rd-trigger");
    const menu = this.querySelector<HTMLElement>(".ui-rd-menu");
    // The closed menu is a trigger-sized pill in its top-left corner; opening morphs it to the full panel
    if (trigger && menu && (changed.has("region") || changed.has("open") || changed.has("showSwitcher"))) {
      menu.style.setProperty("--from-w", `${trigger.offsetWidth}px`);
      menu.style.setProperty("--from-h", `${trigger.offsetHeight}px`);
    }
    if (changed.has("open") && this.open) this.querySelector<HTMLElement>(".ui-rd-panel")?.focus({ preventScroll: true });
    // One fill glides between rows; when it first appears it fades in on the spot
    if (changed.has("active") || changed.has("open") || changed.has("shown")) {
      const row = this.querySelectorAll<HTMLElement>(".ui-rd-option")[this.active];
      const fill = this.querySelector<HTMLElement>(".ui-rd-fill");
      if (row && fill) {
        fill.dataset.glide = String(this.wasShown && this.shown);
        fill.style.transform = `translateY(${row.offsetTop}px)`;
        fill.style.height = `${row.offsetHeight}px`;
      }
      this.wasShown = this.shown;
    }
    if (changed.has("open")) {
      if (this.open) document.addEventListener("pointerdown", this.away);
      else document.removeEventListener("pointerdown", this.away);
    }
  }

  /** Click outside closes */
  private away = (event: PointerEvent) => {
    const target = event.target as Node;
    if (this.querySelector(".ui-rd-panel")?.contains(target) || this.querySelector(".ui-rd-trigger")?.contains(target)) return;
    this.close(false);
  };

  /** Opened from the keyboard, the active row shows its fill (and focus ring) right away; from the pointer it waits */
  private show(keyboard: boolean) {
    this.active = this.selected;
    this.shown = keyboard;
    this.open = true;
  }

  private close(refocus: boolean) {
    this.open = false;
    if (refocus) this.querySelector<HTMLElement>(".ui-rd-trigger")?.focus();
  }

  private pick(i: number) {
    const next = OPTIONS[i].value;
    if (next !== this.region && this.emit<RegionDachRegionChange>("tc-region-change", { region: next }, { cancelable: true })) this.region = next;
    this.close(true);
  }

  private onTriggerKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      this.show(true);
    }
  };

  private onPanelKey = (event: KeyboardEvent) => {
    const last = OPTIONS.length - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(last, this.active + 1), ArrowUp: Math.max(0, this.active - 1), Home: 0, End: last };
    if (event.key in moves) {
      event.preventDefault();
      this.active = moves[event.key];
      this.shown = true;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.pick(this.active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    } else if (event.key === "Tab") {
      this.close(false);
    }
  };

  /** One map: neighbours, filled countries and the travelling band */
  private mapLayer(l: Layer) {
    const shared = this.svgId;
    const id = `${shared}-${l.key}`;
    const map = MAPS[l.region];
    const [cx, cy, r] = map.fade;
    return svg`<g class="ui-rd-layer" data-phase=${l.phase}>
      <defs>
        <mask id=${`${id}-outside`} maskUnits="userSpaceOnUse" x="0" y="0" width="540" height="440">
          <rect x="0" y="0" width="540" height="440" fill="#FFFFFF"></rect>
          ${map.land.map((d) => svg`<path d=${d} fill="#000000"></path>`)}
        </mask>
        <radialGradient id=${`${id}-fade`} cx=${cx} cy=${cy} r=${r} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"></stop>
          <stop offset="65%" stop-color="#FFFFFF" stop-opacity="0.6"></stop>
          <stop offset="90%" stop-color="#FFFFFF" stop-opacity="0.18"></stop>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"></stop>
        </radialGradient>
        <mask id=${`${id}-neighbors`} maskUnits="userSpaceOnUse" x="0" y="0" width="540" height="440">
          <rect x="0" y="0" width="540" height="440" fill=${`url(#${id}-fade)`}></rect>
        </mask>
      </defs>
      <g mask=${`url(#${id}-neighbors)`} class="ui-rd-neighbors" fill="none" stroke="#A6ABB3" stroke-width="0.7" stroke-linejoin="round" stroke-linecap="round">
        ${map.neighbors.map((d) => svg`<path d=${d}></path>`)}
      </g>
      <g class="ui-rd-land" filter=${`url(#${shared}-shadow)`} fill="#F8F8F8" stroke="#D6D9DE" stroke-width="0.9" stroke-linejoin="round">
        ${map.land.map((d) => svg`<path d=${d}></path>`)}
      </g>
      <g fill="none" stroke=${`url(#${shared}-shine)`} stroke-linecap="round" stroke-linejoin="round">
        <path class="ui-rd-band" d=${map.perimeter} pathLength="1000" stroke-width="6" stroke-dasharray="180 820" filter=${`url(#${shared}-blur)`} mask=${`url(#${id}-outside)`} opacity="0.45"></path>
        <path class="ui-rd-band" d=${map.perimeter} pathLength="1000" stroke-width="1.4" stroke-dasharray="200 800" opacity="0.32"></path>
        <path class="ui-rd-band ui-rd-band--1" d=${map.perimeter} pathLength="1000" stroke-width="1.4" stroke-dasharray="140 860" stroke-dashoffset="-30" opacity="0.55"></path>
        <path class="ui-rd-band ui-rd-band--2" d=${map.perimeter} pathLength="1000" stroke-width="1.4" stroke-dasharray="80 920" stroke-dashoffset="-60"></path>
      </g>
    </g>`;
  }

  private switcher() {
    const id = this.menuId;
    const selected = this.selected;
    return html`<div class="ui-rd-switch">
      <button
        type="button"
        class="ui-rd-trigger"
        aria-haspopup="listbox"
        aria-expanded=${this.open ? "true" : "false"}
        aria-controls=${`${id}-list`}
        aria-label=${`Region: ${OPTIONS[selected].name}`}
        @click=${(event: MouseEvent) => (this.open ? this.close(false) : this.show(event.detail === 0))}
        @keydown=${this.onTriggerKey}
      >
        <span>${OPTIONS[selected].name}</span>${chevronIcon}
      </button>
      <div class="ui-rd-menu" data-open=${this.open ? "true" : "false"} .inert=${!this.open}>
        <div
          id=${`${id}-list`}
          class="ui-rd-panel"
          role="listbox"
          tabindex="-1"
          aria-label="Select a region"
          aria-activedescendant=${`${id}-${this.active}`}
          @keydown=${this.onPanelKey}
          @pointerleave=${() => (this.shown = false)}
        >
          <span class="ui-rd-fill" aria-hidden="true" data-glide="false" style=${`opacity: ${this.shown ? 1 : 0};`}></span>
          ${OPTIONS.map(
            (o, i) => html`<div
              id=${`${id}-${i}`}
              role="option"
              aria-selected=${i === selected ? "true" : "false"}
              class="ui-rd-option"
              @pointerenter=${() => {
                this.active = i;
                this.shown = true;
              }}
              @click=${() => this.pick(i)}
            >
              <span class="ui-rd-option-name">${o.name}</span>
              <span class="ui-rd-check" aria-hidden="true">${tickIcon}</span>
            </div>`,
          )}
        </div>
      </div>
    </div>`;
  }

  protected override render() {
    const id = this.svgId;
    const option = OPTIONS[this.selected] ?? OPTIONS[0];
    const label = typeof this.label === "function" ? this.label(this.region) : (this.label ?? option.label);
    return html`<div class="ui-rd-map" role="img" aria-label=${label}>
        <svg class="ui-rd-art" viewBox="0 0 540 440" aria-hidden="true">
          ${svg`<defs>
            <filter id=${`${id}-shadow`} x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow class="ui-rd-drop" dx="0" dy="3" stdDeviation="3.5" flood-color="#1F2128" flood-opacity="0.07"></feDropShadow>
            </filter>
            <linearGradient id=${`${id}-shine`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="540" y2="220">
              <stop offset="0%" stop-color="#FFA0AB"></stop>
              <stop offset="33%" stop-color="#FFB89E"></stop>
              <stop offset="66%" stop-color="#C8A8E5"></stop>
              <stop offset="100%" stop-color="#A8B5FF"></stop>
            </linearGradient>
            <filter id=${`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4"></feGaussianBlur>
            </filter>
          </defs>
          ${repeat(
            this.layers,
            (l) => l.key,
            (l) => this.mapLayer(l),
          )}`}
        </svg>
      </div>
      ${this.showSwitcher ? this.switcher() : nothing}`;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="rd"] {
  /* One loop of the band around the border; it runs twice and then rests (WCAG 2.2.2) */
  --tc-region-dach-travel: 14s;
  --tc-region-dach-loops: 2;
  --tc-region-dach-chevron: light-dark(#737373, #8f8f8f);
  --tc-region-dach-menu-shadow: light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.4));
  --tc-region-dach-menu-shadow-near: light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.35));
  --tc-region-dach-drop: light-dark(rgba(31, 33, 40, 0.07), rgba(0, 0, 0, 0.45));
  --tc-region-dach-neighbors: light-dark(#a6abb3, #5c5c63);
  --tc-region-dach-land: light-dark(#f8f8f8, #2c2c30);
  --tc-region-dach-land-edge: light-dark(#d6d9de, #4a4a50);
  position: relative;
  width: 100%;
  aspect-ratio: 540 / 440;
}
.ui-rd-map,
.ui-rd-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* One full loop around the border every 14 seconds; the offsets keep the layers slightly staggered */
.ui-rd-band {
  animation: ui-rd-travel var(--tc-region-dach-travel) linear var(--tc-region-dach-loops) forwards;
}
.ui-rd-band--1 {
  animation-delay: -0.42s;
}
.ui-rd-band--2 {
  animation-delay: -0.84s;
}
/* Off screen or in a hidden tab the band holds where it is */
[data-ui="rd"][data-paused] .ui-rd-band { animation-play-state: paused; }
@keyframes ui-rd-travel {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -1000;
  }
}

/* Switching: the old map fades and grows away, the new one settles in from slightly smaller */
.ui-rd-layer {
  transform-box: view-box;
  transform-origin: 270px 220px;
}
.ui-rd-layer[data-phase="enter"] {
  animation: ui-rd-in var(--tc-duration-slowest, 560ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
}
.ui-rd-layer[data-phase="exit"] {
  animation: ui-rd-out var(--tc-duration-slow, 320ms) var(--tc-ease-in, cubic-bezier(0.4, 0, 1, 1)) both;
}
@keyframes ui-rd-in {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
}
@keyframes ui-rd-out {
  to {
    opacity: 0;
    transform: scale(1.04);
  }
}

/* ---------- Region menu ---------- */
.ui-rd-switch {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  padding: var(--tc-space-3, 12px);
  transform: scale(var(--tc-region-dach-s, 1));
  transform-origin: 0 0;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
}
.ui-rd-trigger {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1, 4px);
  height: var(--tc-control-h-sm, 28px);
  margin: 0;
  padding: 0 8px 0 var(--tc-control-px-md, 12px);
  border: 1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-surface-overlay, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font: inherit;
  font-size: var(--tc-control-font-size, 13px);
  font-weight: var(--tc-control-font-weight, 500);
  line-height: var(--tc-line-height-none, 1);
  white-space: nowrap;
  cursor: pointer;
  transition: transform var(--tc-duration-fast, 150ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-rd-trigger:active {
  transform: scale(0.96);
}
.ui-rd-trigger:focus-visible {
  outline: var(--tc-focus-ring-width, 2px) solid var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff));
  outline-offset: var(--tc-focus-ring-offset, 2px);
}
.ui-rd-chevron {
  width: 14px;
  height: 14px;
  transition: transform var(--tc-duration-base, 200ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-rd-trigger[aria-expanded="true"] .ui-rd-chevron {
  transform: rotate(180deg);
}

/* Opening morphs the panel out of a trigger-sized pill in its top-left corner */
.ui-rd-menu {
  --tc-region-dach-morph: var(--tc-duration-slower, 420ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1));
  position: absolute;
  top: calc(12px + 28px + 6px);
  left: 12px;
  width: 172px;
  /* the shadow sits on the wrapper, so it follows the morphing shape */
  filter: drop-shadow(0 6px 12px var(--tc-region-dach-menu-shadow)) drop-shadow(0 1px 2.5px var(--tc-region-dach-menu-shadow-near));
  transition: visibility 0s linear 0s;
}
.ui-rd-menu[data-open="false"] {
  visibility: hidden;
  pointer-events: none;
  transition: visibility 0s linear var(--tc-duration-slow, 320ms);
}
.ui-rd-panel {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: var(--tc-menu-padding, 4px);
  background: var(--tc-menu-bg, light-dark(#ffffff, #232326));
  border: 1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  border-radius: var(--tc-menu-radius, 12px);
  /* No outline: focus shows as a ring on the active row instead (the panel keeps focus, rows are activedescendants) */
  outline: none;
  clip-path: inset(0 0 0 0 round var(--tc-menu-radius, 12px));
  transition: clip-path var(--tc-region-dach-morph);
}
.ui-rd-menu[data-open="false"] .ui-rd-panel {
  clip-path: inset(0 calc(100% - var(--from-w)) calc(100% - var(--from-h)) 0 round calc(var(--from-h) / 2));
  transition: clip-path var(--tc-duration-slow, 320ms) cubic-bezier(0.4, 0, 0.2, 1);
}
/* The rows fade in once the shape has opened up, and out first when closing */
.ui-rd-panel > * {
  transition:
    opacity var(--tc-duration-base, 200ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1)) var(--tc-duration-quick, 120ms),
    transform var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) 60ms;
}
.ui-rd-menu[data-open="false"] .ui-rd-panel > * {
  opacity: 0;
  transition: opacity var(--tc-duration-quick, 120ms) var(--tc-ease-in, cubic-bezier(0.4, 0, 1, 1));
}
.ui-rd-menu[data-open="false"] .ui-rd-option {
  transform: translateY(-4px);
}
.ui-rd-fill {
  position: absolute;
  top: 0;
  left: var(--tc-menu-padding, 4px);
  right: var(--tc-menu-padding, 4px);
  border-radius: var(--tc-menu-item-radius, 8px);
  background: var(--tc-menu-item-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05)));
  pointer-events: none;
  transition:
    transform var(--tc-duration-base, 200ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    height var(--tc-duration-base, 200ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    opacity var(--tc-duration-fast, 150ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1));
}
/* Keyboard: the active row carries the focus ring (≥ 3 : 1), not only the faint fill (WCAG 2.4.7 / 1.4.11) */
.ui-rd-panel:focus-visible .ui-rd-fill {
  box-shadow: inset 0 0 0 var(--tc-focus-ring-width, 2px) var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff));
}
.ui-rd-fill[data-glide="false"] {
  transition: opacity var(--tc-duration-fast, 150ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1));
}
.ui-rd-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, 8px);
  padding: 7px 8px 7px var(--tc-menu-item-px, 10px);
  border-radius: var(--tc-menu-item-radius, 8px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font-size: var(--tc-menu-item-font-size, 13px);
  font-weight: var(--tc-font-weight-medium, 500);
  line-height: var(--tc-line-height-snug, 18px);
  cursor: pointer;
}
.ui-rd-option-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}
.ui-rd-check {
  flex: none;
  width: 15px;
  height: 15px;
  opacity: 0;
  transform: scale(0.6);
  transition:
    opacity var(--tc-duration-fast, 150ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1)),
    transform var(--tc-duration-moderate, 260ms) var(--tc-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
}
.ui-rd-check svg {
  display: block;
  width: 100%;
  height: 100%;
}
.ui-rd-option[aria-selected="true"] .ui-rd-check {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .ui-rd-band,
  .ui-rd-layer[data-phase] {
    animation: none;
  }
  .ui-rd-layer[data-phase="exit"] {
    display: none;
  }
  [data-ui="rd"] .ui-rd-menu :is(.ui-rd-panel, .ui-rd-panel > *, .ui-rd-fill, .ui-rd-check),
  [data-ui="rd"] .ui-rd-chevron {
    transition: none;
  }
}

/* Theme colours: light-dark() follows the page theme, wherever it comes from */
.ui-rd-neighbors { stroke: var(--tc-region-dach-neighbors); }
.ui-rd-land { fill: var(--tc-region-dach-land); stroke: var(--tc-region-dach-land-edge); }
.ui-rd-drop { flood-color: var(--tc-region-dach-drop); flood-opacity: 1; }
.ui-rd-chevron-ink { stroke: var(--tc-region-dach-chevron); }
`;
}

/* ---------- Map data (Natural Earth, public domain), projected onto the 540 × 440 viewBox ---------- */

/** First subpath of a path: the main landmass, where the band travels */
const firstShape = (d: string) => d.slice(0, d.indexOf("z") + 1);

type MapData = {
  /** Filled countries */
  land: string[];
  /** Neighbouring countries, drawn as fading outlines */
  neighbors: string[];
  /** Outer border, where the band travels */
  perimeter: string;
  /** Centre and radius of the neighbours' fade */
  fade: [number, number, number];
};

/** Germany, Switzerland, Austria */
const DACH_LAND = [
  "M224.98 12.00L225.49 29.46L254.61 39.99L254.30 56.03L283.60 47.55L299.80 35.17L332.34 53.01L345.94 67.40L352.68 90.40L344.64 102.46L355.10 118.56L362.23 142.73L359.99 158.31L371.80 187.16L358.94 191.88L351.34 186.69L344.12 195.29L323.42 204.04L312.72 215.30L291.78 225.14L296.83 238.57L299.88 257.62L314.58 268.48L330.85 287.91L320.69 308.74L310.34 314.48L314.42 343.92L311.74 351.60L302.75 342.35L288.94 340.96L268.34 349.07L242.92 347.14L238.82 359.07L224.24 346.52L215.54 349.01L184.66 335.19L178.75 345.01L154.24 344.69L157.89 312.50L172.46 281.56L130.94 273.23L117.34 261.40L118.97 241.59L113.21 231.39L116.49 200.85L111.64 153.50L128.95 153.48L136.26 136.48L143.44 95.10L138.05 79.82L143.68 70.25L167.76 67.80L173.11 77.76L192.68 55.48L186.09 38.55L184.77 12.92L206.54 18.88L224.98 12.00Z",
  "M215.54 349.01L216.66 357.03L212.25 368.09L225.29 376.32L239.99 377.54L237.70 396.07L225.01 403.69L203.69 398.03L197.45 416.25L183.72 417.69L178.73 410.53L162.57 425.85L148.68 428.00L136.28 418.32L126.38 398.51L112.62 405.59L113.05 385.13L134.12 359.73L133.20 348.25L146.32 352.41L154.24 344.69L178.75 345.01L184.66 335.19L215.54 349.01Z",
  "M428.36 321.97L426.17 340.43L409.94 340.52L415.52 350.31L405.96 379.40L400.46 387.03L375.26 388.16L360.72 398.41L336.92 394.91L295.71 383.24L289.28 367.52L260.80 375.37L257.45 383.97L239.99 377.54L225.29 376.32L212.25 368.09L216.66 357.03L215.54 349.01L224.24 346.52L238.82 359.07L242.92 347.14L268.34 349.07L288.94 340.96L302.75 342.35L311.74 351.60L314.42 343.92L310.34 314.48L320.69 308.74L330.85 287.91L352.26 302.45L368.47 283.97L378.61 280.59L400.98 294.38L414.51 292.04L427.80 300.57L425.48 306.31L428.36 321.97Z",
];

/** France, Netherlands, Belgium, Poland, Czechia, Slovakia, Hungary, Slovenia, Italy, Denmark … */
const DACH_NEIGHBORS = [
  "M42.47 220.05L62.58 241.35L77.37 237.83L102.58 258.43L109.02 262.36L117.34 261.40L130.94 273.23L172.46 281.56L157.89 312.50L154.24 344.69L146.32 352.41L133.20 348.25L134.12 359.73L113.05 385.13L112.62 405.59L126.38 398.51L136.28 418.32L135.09 431.09L143.57 448.06L133.58 461.82L141.00 496.78L156.62 502.52L153.33 522.13L127.22 547.66L70.39 535.42L28.42 550.08L25.12 577.30L-8.28 583.15L-40.71 562.71L-51.18 572.48L-104.23 551.95L-115.71 534.38L-100.81 507.27L-95.32 417.25L-125.06 369.83L-146.31 346.96L-190.35 329.58L-193.25 296.63L-155.89 286.80L-107.50 298.43L-116.64 247.28L-89.43 266.66L-22.34 231.43L-13.69 194.40L11.51 185.27L15.68 201.16L29.08 201.91L42.47 220.05Z",
  "M114.11 78.55L138.05 79.82L143.44 95.10L136.26 136.48L128.95 153.48L111.64 153.50L116.49 200.85L100.65 190.30L82.41 170.52L55.70 179.91L34.60 176.36L49.45 163.94L74.68 97.46L114.11 78.55Z",
  "M34.60 176.36L55.70 179.91L82.41 170.52L100.65 190.30L116.49 200.85L113.21 231.39L105.70 233.09L102.58 258.43L77.37 237.83L62.58 241.35L42.47 220.05L29.08 201.91L15.68 201.16L11.51 185.27L34.60 176.36Z",
  "M371.80 187.16L359.99 158.31L362.23 142.73L355.10 118.56L344.64 102.46L352.68 90.40L345.94 67.40L365.63 54.13L410.60 33.24L446.89 17.95L475.65 25.58L477.82 36.60L505.61 37.17L541.10 42.30L594.09 41.62L608.87 46.46L615.79 60.38L617.04 80.37L625.03 97.56L624.86 115.57L607.58 124.79L616.47 145.73L617.02 165.85L631.51 205.30L628.42 217.97L614.12 223.23L587.96 260.82L595.39 281.12L589.10 278.49L561.72 261.12L540.98 267.50L527.37 262.86L510.35 272.55L495.81 256.53L483.97 262.66L482.34 259.94L469.08 237.69L447.66 234.96L444.92 220.81L425.16 215.75L420.86 227.42L405.20 218.08L407.00 205.64L385.46 201.71L371.80 187.16Z",
  "M427.80 300.57L414.51 292.04L400.98 294.38L378.61 280.59L368.47 283.97L352.26 302.45L330.85 287.91L314.58 268.48L299.88 257.62L296.83 238.57L291.78 225.14L312.72 215.30L323.42 204.04L344.12 195.29L351.34 186.69L358.94 191.88L371.80 187.16L385.46 201.71L407.00 205.64L405.20 218.08L420.86 227.42L425.16 215.75L444.92 220.81L447.66 234.96L469.08 237.69L482.34 259.94L473.75 259.99L469.28 268.13L462.67 270.09L460.78 280.37L455.27 282.52L454.49 286.72L444.65 291.40L431.88 290.63L427.80 300.57Z",
  "M482.34 259.94L483.97 262.66L495.81 256.53L510.35 272.55L527.37 262.86L540.98 267.50L561.72 261.12L589.10 278.49L581.11 290.25L575.49 308.47L569.34 313.09L538.48 299.36L529.03 302.11L522.28 312.74L508.75 318.39L505.63 315.50L491.60 322.51L480.15 323.85L477.83 332.93L453.64 338.46L443.02 333.54L428.36 321.97L425.48 306.31L427.80 300.57L431.88 290.63L444.65 291.40L454.49 286.72L455.27 282.52L460.78 280.37L462.67 270.09L469.28 268.13L473.75 259.99L482.34 259.94Z",
  "M405.96 379.40L415.52 350.31L409.94 340.52L426.17 340.43L428.36 321.97L443.02 333.54L453.64 338.46L477.83 332.93L480.15 323.85L491.60 322.51L505.63 315.50L508.75 318.39L522.28 312.74L529.03 302.11L538.48 299.36L569.34 313.09L575.49 308.47L591.48 320.76L593.49 332.87L575.89 342.35L562.26 372.99L544.84 403.64L521.73 412.16L503.75 410.16L481.67 422.04L470.90 428.79L447.10 420.10L425.56 400.72L416.40 395.16L410.80 379.90L405.96 379.40Z",
  "M336.92 394.91L360.72 398.41L375.26 388.16L400.46 387.03L405.96 379.40L410.80 379.90L416.40 395.16L393.46 407.16L390.66 425.42L380.65 430.04L380.75 442.67L369.44 441.79L359.64 434.42L354.37 442.04L334.28 440.50L340.70 436.40L333.80 417.16L336.92 394.91Z",
  "M295.71 383.24L336.92 394.91L333.80 417.16L340.70 436.40L317.76 429.82L294.33 445.86L295.93 468.29L292.40 481.16L301.84 504.17L328.86 526.92L343.35 564.28L375.42 600.70L398.00 600.42L405.02 610.40L396.94 619.41L422.75 635.74L443.90 649.41L468.61 672.97L471.60 681.41L466.21 697.59L450.22 676.50L425.18 669.06L413.06 698.29L433.88 715.04L430.46 738.62L418.43 741.30L403.04 780.06L391.02 783.54L391.13 769.72L397.01 745.49L403.28 735.83L392.02 709.65L383.23 686.86L371.27 681.23L362.76 661.73L344.24 653.51L331.78 635.35L310.45 632.42L287.94 612.02L261.58 582.61L241.99 556.58L233.00 511.91L218.66 506.66L195.22 491.74L181.95 497.85L165.30 518.82L153.33 522.13L156.62 502.52L141.00 496.78L133.58 461.82L143.57 448.06L135.09 431.09L136.28 418.32L148.68 428.00L162.57 425.85L178.73 410.53L183.72 417.69L197.45 416.25L203.69 398.03L225.01 403.69L237.70 396.07L239.99 377.54L257.45 383.97L260.80 375.37L289.28 367.52L295.71 383.24Z",
  "M253.52 -54.67L246.48 -37.63L237.89 -42.54L217.15 -10.00L224.98 12.00L206.54 18.88L184.77 12.92L173.07 -12.16L172.19 -58.35L177.00 -70.55L185.26 -84.11L210.65 -86.91L220.77 -99.38L243.95 -112.13L242.97 -88.89L234.44 -74.17L237.89 -61.51L253.52 -54.67Z",
];

/** Outer DACH border only, without the borders between the three countries */
const DACH_PERIMETER =
  "M224.98 12.00L225.49 29.46L254.61 39.99L254.30 56.03L283.60 47.55L299.80 35.17L332.34 53.01L345.94 67.40L352.68 90.40L344.64 102.46L355.10 118.56L362.23 142.73L359.99 158.31L371.80 187.16L358.94 191.88L351.34 186.69L344.12 195.29L323.42 204.04L312.72 215.30L291.78 225.14L296.83 238.57L299.88 257.62L314.58 268.48L330.85 287.91L352.26 302.45L368.47 283.97L378.61 280.59L400.98 294.38L414.51 292.04L427.80 300.57L425.48 306.31L428.36 321.97L426.17 340.43L409.94 340.52L415.52 350.31L405.96 379.40L400.46 387.03L375.26 388.16L360.72 398.41L336.92 394.91L295.71 383.24L289.28 367.52L260.80 375.37L257.45 383.97L239.99 377.54L237.70 396.07L225.01 403.69L203.69 398.03L197.45 416.25L183.72 417.69L178.73 410.53L162.57 425.85L148.68 428.00L136.28 418.32L126.38 398.51L112.62 405.59L113.05 385.13L134.12 359.73L133.20 348.25L146.32 352.41L154.24 344.69L157.89 312.50L172.46 281.56L130.94 273.23L117.34 261.40L118.97 241.59L113.21 231.39L116.49 200.85L111.64 153.50L128.95 153.48L136.26 136.48L143.44 95.10L138.05 79.82L143.68 70.25L167.76 67.80L173.11 77.76L192.68 55.48L186.09 38.55L184.77 12.92L206.54 18.88Z";

/* The five large countries: Natural Earth 1:50m, azimuthal equal-area projection centred on each country */

/** United States (fitted to the contiguous states), main landmass first */
const US_LAND =
  "M463.3 109.2l26.7-8.4 .4-3.9 1.2 0 1.7-1.6 .8 .7 .2-2 .8-.6 -.5-.8 .3-2.1 .8-1.1 .5-3.3 -1.1-3.9 .7-2.8 -.8-3.4 2.7-11.2 1.6-.1 .8 1.8 1.1 .4 .9-.2 4-3.5 4.6 1.8 6.5 16.2 3.9 .7 0 1.6 .8 1.6 1.9 1.4 .6-.8 .9 0 1.5 3.4 .8-.1 -.5 2.8 -1.6 .3 -1.3 1.3 0 .9 -1.9 .8 0 1.7 -.7 .9 -2.4-.6 -1.2 1.1 -.5 1.4 .4 .9 -1.9 .2 -.3-1.3 -.8 .1 -.2-1.5 -1 2.3 .6 4.4 -.3 .9 -.6 .9 -1 .2 -1 1.7 -.5-.7 -.1 1.1 -.6-.6 -.4 1.4 -.8-.5 .5 1.3 -1.1 .5 -.6-.6 -.7 .5 -1.1 2.6 .8 .4 -1.5 4.2 -.7 4 .2 3.3 .8 1.1 1.8 .4 -2.5 5.1 3.1 .4 3.7 4.5 2.2 .2 2.2-2.1 -2.5-2.3 2.1 .6 1.5 2.9 -5.7 4.3 -.8-2.1 -3.5 4.2 -.9-1.7 .1-1.5 -.8 1.2 -.9-.8 -.3 1.8 .5 2.3 -.4 1.1 -1.9 1.3 -9.4 3.8 -5.7 5 -2.3 3.9 -.4-3.6 -1.5-2.1 1.5 4 -1.6 5.6 .4 .9 2.7-.1 1.1 7.8 -.6-2.5 -.3 .8 -.1 4.3 -.4 1.2 -.8 0 .4 2.1 -1.3 1.6 -.8 4.1 -1 1.1 -.5-2.6 -2.4-.2 -4.5-2.5 -.4-1.3 .4-2.6 2.2-1.7 .2-.9 -2.4 2 -1.1 2.8 .7 2 2.1 2 .8 2.3 2.8 2.8 1.1 .3 -.3 2.6 .7-.4 1.2 2 -.1 .8 -.4-.7 -1.3 5.2 -.9 5.9 .3 .9 -1.5 1.5 -.6 4.4 -1.1-2.9 .1-3 1.1-4.7 -1.8 .3 .1-1.6 -1.5-.7 .1-2.5 -1.3 1.2 -2-.3 -.8-.8 -.5-2.1 2.5-.6 -3.2-1.4 -.3 .9 0-1.4 1.1-.8 -.4-.7 -1.3 .4 -.1-1.3 1.2-.1 .2-1.2 -.7 .4 -.6-1.5 .4-1.8 .6-.8 1.8-.6 -1.3-.1 .7-.9 -.8-1.3 -.9 .5 -.3 2.2 -.8-.1 -.1 1 -.8-.5 -.2 2 -1.6 .2 2 2.1 -1.2 .4 .9 1.4 .2 2.6 1 2.5 1.5 1.7 -1.2-.1 -2.2-2.2 .3 .9 .5 1 2.8 1.7 1.2 2.1 -2.8-1.2 -1.8 0 -1.4-1.3 .1 1.3 -1.5-1.6 -2.1 1 -.3-1.1 1.3-4 -.5-1.4 .2 1.5 -1.5 2.6 .1 2.7 .9 .5 1.1-.7 2.5 1.7 3.7 .4 3.3 1.8 .1 2.2 -1.1 .9 -7.5-4.6 6.5 4.9 2.6 .6 -.5 .7 1.1 .2 .3 .8 .1 .9 -1.4 0 .4 1 -1.4 .3 -2.7-1.9 1.9 1.9 3.3 1.4 .7 1.1 -1 1 -2.4-1.3 -.5-.9 -3.9-.3 -2.4 .4 6.1 .6 .7 1.4 1.9 1.5 .9-.1 1.3-1.2 2.4-.1 4.5 7.8 3.4 4.5 -2.8-3 -3.4-6 -.3 2.1 2.8 4 -3.7-1.2 .4 1.7 -1.7 .5 -1.9 2.1 -1.3-.4 -1-1.8 .8 3.3 6.4-1.8 .7 3.5 .7-.6 -.3-2.2 1-1.1 1 .5 .7 1.6 .1 1.6 -2.5 4.1 -3.8 .7 -.7-1.2 -.9-.1 0 1 -1 .6 -3.2-.5 .8 .7 5.1 1.2 -.5 2.7 -1.3 1.4 -3.4-1.3 1.4 1.4 2.5 .4 2.7-1.3 1.1 .4 -.5 1.4 -.6 1 -2.6 1.6 -3.3 .8 -.9 1.4 -1.1 .2 -.5-.9 .5 2.1 -3 3.9 -.8 1.9 -.1 2.8 -.9-2.8 .1 3.4 -4 .8 -1.6 .9 -2.3 2.5 -2.2 4.6 -.2 2.2 -.7-2 -.3 1.2 .8 1.6 -1.6 2.1 -1.6 .9 -.1 1.2 -1.6 2 -1.4 0 .6 .9 -.3 .8 -4 3 -2.9 .4 1.9 .8 .1 .9 -.8 1 -1-1.2 -.5 .9 -1.2-1.2 1.4 2.3 -.3 1.4 -.9 .5 -.4 2.3 -1.6 1.6 .2 1.1 -.9 .9 .5 1.1 -.7 .5 .8 .5 -.9 2.2 -.9 .4 1.2 .9 -.7 1.3 -.8-.2 0 5.1 2.5 6.4 4.7 9.5 3.1 4.7 5.2 6.2 -.4 1.6 .5 2.3 1.9 3.2 -2.3-3.1 -.7-4.3 -.3 1.9 -.9-.9 .2-1.5 -.9-.5 -.3-1.3 -.3 1.3 1.3 3 10.1 15.9 1.4 5.1 .6 9.3 -1.5 3.1 -.2 3.7 -1.1 1.5 -2.7 1.5 -4.2 1 -.8-1 .2-1.1 2.1 .7 -.3-1 -.9-.2 -4-4.3 -.4-1.2 -2.4-.3 -1.8-.9 -1.4-1.8 -1.1-3.5 -.8-.2 .7-3 -1.3 2 -.8 .1 -.7-1.8 .2-3.3 -1.7 .6 .2 .8 -.8 .4 -1.4-.8 -5-6.3 .8-.5 2.1-4.3 -.7-.8 -.8 .5 -.7-.9 -1.1 .1 1 2.2 -.4 .8 -.9 .3 -1.3-1.5 .8-8.3 -.7-5 -1.5-1.9 -6.4-4 -5.2-5.2 -4.1-1.6 -2.8 .9 -.5 2.1 -1.8 .4 -2.5 2 -5.4 2 -1.2-1 -.1-.9 1.2 .9 -.6-1.4 -3.9-2.6 .7-.4 -.7-.4 .5-1.3 -1.4 .7 0 1 -7.9-1.9 2.3-.7 1.2 .2 -1.5-.9 -2.1 .2 -2.3 1.5 -5.6 1.5 2.2-1.4 .2-1 -.5-.8 -.7 1 -1.1-.3 -.7 1.9 -2.3 1.5 .3-.9 -.8 0 -1 1.5 -4.1 .9 2.3-1 -1.7-1.8 -.1-1.4 -1.2-1.6 -.7 3.6 -1.4 .8 -4.8 .7 -2.3-.5 -3.4 1.4 -1.1-.1 -1.2 1.7 -1.5 .9 -4.1-1 -1-.9 -2-.2 -1 1.4 -.8 1.8 2.7 1.2 4.6-2.3 .8 .3 -1.1 1.4 .5 1.4 1.3 .2 1.3-2.1 1 .1 .7 2.5 -1.8 1 -1.9 2.1 2.5 2.3 5.7 2.1 0 .8 -1 .7 -.4 1.1 -.9-.8 -1 1.2 -2.3-3 -3.1-.7 -.4-1 -3.8-1.2 1.4 2.4 -.4 2 -1.1 1.1 -2.1-2.3 -2.2 .6 -.9 1.6 -.8 .3 -2.8-.6 -3.3-.9 .6-.6 .9 .1 -1.1-1.7 -.1-1.3 -.9 .7 -2.1-.4 -1.8-2.2 -1.7 .1 -.8-1.1 -1.4 .6 -1.1 1.3 .8 1 -2.1 .9 -4.5-.2 -6.9-2 -4.5 .5 -1.4 .7 -.7-1.1 1.2-1.3 -.3-.8 -1.5 2.1 .7 1.1 -9.4 4.7 2.4-2.1 -.8-.3 -1.4 .5 -.2-2.7 -1 .1 -.6 .9 -1-.4 -.1 2.3 1.3 2 -2.7 2.6 -.1 1.1 -1.3 1.5 -6.3 4.3 -3.6 1.8 1.8-1.7 -4-.1 -.8 .8 -1.5-1.5 .7 2.8 1.1 .4 -2.8 1.5 -1.1-1 -.3 2.5 -.9 .8 -.5-.8 -2.5 1.6 1.4 .1 -1.5 2.7 -2.3 .1 1 2.5 -1.6 4.3 -.9 .2 -2.8-1.8 .9 2.2 2.3 .6 -.8 3.3 1.5 6.1 2.6 5.1 .8 .5 0 .9 -3.4 .9 -1.7-1.2 -7.8-1.5 -1.2-.9 -3.6-1.1 -.8-.8 -3.9-1.4 -1.4-3.9 -2.3-3.5 0-1.6 -.7-1.5 0-3.2 -2.8-2.3 -2.7-4.1 -2.4-2.4 -4.7-10.4 -7.8-8.7 -2.1-.9 -4.6 0 -3.8-1 -.5 .8 -2.5 .5 -1.4 1.3 -1.9 5.3 -2.3 2.1 -1.9 .4 -1.8-.9 -2.5-1.9 -3.5-1.6 -4.4-3.4 -2.2-3.7 -.6-1.7 .1-1.8 -2.2-5.8 -12.6-11.8 -2.8-4.2 -18.9-1.9 -.6 5.6 -30.1-3.4 -38-21 1.6-2.3 -25.3-2.5 .1-1.4 -1-.4 .2-5.6 -1.1-2.8 -5.2-6.6 -3.3-1 .5-1.4 -.8-2.2 -3.3-.8 -2.9-1.8 -.8-.9 -.1-1.2 -2.9-2.8 -1.2 0 -3.2-1.7 -4.2-1 -1.4-1.8 1.6-6.1 -1.9-2.2 .2-2.8 -3-4 -2.3-6.9 -1.6-2.7 .4-3.1 1.1-.8 .8-1.7 -.4-1.9 -2.6-1.4 -1.5-3.3 .4-2 -.3-2.4 .6-2.8 1.2 .1 -.3 1.7 2.3 2.9 -1.4-6.7 .8-.4 2.3 0 5.3 1.4 -3.3-1.1 -.9-.9 -1.7 .3 -1.5-1.3 -1.5-.1 -.7 3.4 -1.8-1.4 -1.4-2 -1.3 .1 1-2.8 .6 1.5 -.1-1 -1.1-3.7 -1.3-1.5 -2.6-5.6 .5-6 .9-1.7 .4-3.3 -1.4-4.7 -1.4-2.5 .1-1.6 .3-1.5 3.9-5.2 .6-2.3 1.5-2.6 .4-4.3 -.5-1.1 1-2.3 -.7-2.1 .2-2.3 1-3.4 -.3-3.2 3.7-5.9 1.6-.6 -.9-.1 1.8-2.7 4.1-9.1 1.3-4.3 4.1-9.4 2-7.9 2.4 1.2 1.4-.1 .7 1.1 1.6 .5 -1.6-2.1 -5-1.6 1.5-3.9 .1 2.4 1.4-2.6 -1.2-1.5 .2-1.6 2.5-.5 -1.9-1.6 -.5 1 .9-9.2 -1-4.5 1.3-5 4.9 4.4 5.2 2.2 1.2-.1 .8 1.2 2.2-.1 0 2.7 -1.5 2.1 -2.9 1.7 -1.4 2.1 1.9-.1 -.8-.1 -.2-.8 5.1-3.5 .4-1 .3 1.4 -1.2 1 -1.3 5.2 -.9-.6 -.9 1.1 .1-1.5 -1 .3 -1 1.2 2.1 1.5 1.9-1.7 1.9-.7 1.3-5.6 1.9-1.9 -.6-2.3 -.2 1 -.8-.8 1-2.9 -.9-1.8 .9 .3 1-3.3 -.8-.3 -.2-3.1 34.5 9.2 27.4 5.9 31.1 5.3 31.5 3.9 21.1 1.8 24.7 1.3 42.3 .2 12.6-.5 -.2-4.7 2.5 .7 .6 3.8 1.2 2.8 7 1.7 1.3 1 2-.6 .6-.8 2.7-.2 4.1 1.7 1.6 2.2 1.9-.9 1.5 .4 4.3 2.7 1.1-.1 3.8-2.3 1.1 .9 5.9-.4 1.8 1.4 3.7-.4 8.5-4.9 32.1 13.2 1.3 3.2 2.3 1.9 2.9-1.7 .7 .5 .9 3.4 1.3 1.6 2.6-1 1.3 .6 .7 .7 -.6 2.4 10 4.2 8.1 21.3 -1.2 6.7 -.2 5.8 -2.3 3.5 -1.2 .9 -.8 2.6 .4 2.1 1.4 1.5 3.4 1.4 2.3-.4 9.3-8.7 8.9-3.9 9.7-7.8 .6-1.9 -1.3-1.4 -.9-2.6 -1.6-2.1 3.5-2.9 16.7-4.2 1.6-6 1.9-3.8 2-2 4.2-7.6 1.3-1.3zM31.7 -30l-3.9 2.3 -1.6-1.2 .2-1.1zM497.3 152.5l-.4 1 1-.5 1.2-1.6 .9-.6 .8 .2 1.6-1.2 -4.9 4.8 -5.1 3.8 -6.1 3 .7-.9 -.8-.2 -1 1.2 -.2-1.3 .7-1.6 2-2.1 8.5-3.8 2.6-2.9zM520.5 99.1l-.9 .5 .2 .9 -1-.2 -.1-1.9 .9-.4zM483.9 162.7l-.4-1.1 .7-.8 .4 .8zM513.5 141.9l-2.3 1.4 .5-1.7zM506.6 142.7l-.9 .6 0-2.1zM518.6 141.7l-2.3 .5 1.1-.8 .2-.9zM488.3 231.3l-1.3 .7 1.2-1.2 -.3-3.8 -.8-1.9 1.3 3.4zM441.4 355.2l-1.1 .3 -.9-1.1 .8 .8zM462.4 368.1l-1.9 2.7 2-3.9 -.1-.8 .8-.7zM329.6 330.9l-2.4-.8 .8-.9 1.4 .4zM272.5 353.6l1.3-2.8 .7 .4zM268.9 361.2l-.4 .7 .1-1.1 .9-2.4 1.8-3.3 .8-.5 -2.1 3.5zM294.1 337.3l2.2-2.5 -.4 1.1zM271.1 375.4l-1.1-2.1 -1.6-6.1 .1-4.8 .5 5zM30.8 250.8l-1.4-.4 .9-.3zM37.4 262.9l-1.1-.3 -.1-.8 .9 .3zM47.6 270.2l-1.3-.4 -.8-2.4zM33.1 252.8l-1.2-.3 -.6-1.4 1.9 .3 .6 .7zM35.2 251.2l1.9 1.1 1.2-.1 -2.7 .5 -.7-.5 -.1-1zM48.9 263.3l.4 1 -1.5-.4 -.9-2.1zM56.3 64.9l-.8-.1 -.4 .8 -.6-.6 .9-.9zM53.8 66.4l-1-.4 .1-1 1 .9zM56 71.6l-.1 1.7 1.1 .9 -.6 .7 -1-1.8 .2-1.2 -.7-1.7 1.1-1.2 .8 .2 0 .8 -1.4 .3zM452.6 376.2l-1.1-.8 1.2 .4zM455.8 374.8l-1 .2 2.2-1zM439.2 297.8l0 3.1 -.5-2zM450.1 377.3l-.1-1.1 .5 .9zM357 321.1l-1.3 .4 1.6-1.5zM361.6 324.1l-.7-3.1 .7 1.5zM404.4 320.7l-1.1 .6 -1.2-.1 4-1.9zM54.6 81.3l-1.1 .2 .7-1.5zM55.1 67.7l-.7-.5 .4-1z";
/** Neighbouring countries around United States */
const US_NEIGHBORS =
  "M316 470l19-5 5 3 4-2 -1-4 -1 1 8-7 2-7 0-10 3-5 24-9 14 1 1 7 -8 16 3 2 -2 1 -2 14 -2-5 -2 0 -6 9zM195 470l-4-5 -12-7 -6-8 -2-5 5-3 -3-2 3-7 -4-8 -1-8 -13-17 -9-8 3 1 0-1 -5-2 -2-5 -6-8 -3 1 2-3 -4 1 -2-2 0-4 4-2 -2-4 -12-11 -1-6 -5-3 -10-15 -7-21 1-7 -19-12 0 24 13 17 3 13 4 5 4 11 1 1 0-3 3 2 2 12 5 12 0 7 7 3 6 9 -1 3 -5 4 -4-8 -16-16 -3-3 2-8 -3-10 -7-6 -1-4 -5 2 -14-16 7 0 4 3 -2-4 3-5 -8-14 -7-6 -9-37 24 2 4 5 33 18 30 4 1-6 19 2 15 15 4 13 4 4 9 5 8-9 13 0 21 28 4 14 19 7 4-1 -7 25 -1 17 1 6 5 8 -1 2 -4-9 1 5 21 34 14 4zM71 336l-2-1 1-3zM105 330l-1 2 -3-1 1-4 3-1zM512 443l11 2 2 1 -11 6 -6 0 -9-5zM570 432l-17 6 -8-1 2-5 17-1 4-3 0-2 -6-3 0-5 -9-1 6-4 11-1zM450 396l23-1 6 4 22 3 4 2 -1 1 2 1 1-2 3 3 14-1 2 3 -2 1 10 0 10 3 -12 7 -29 7 6-8 -1-2 -11 0 -10-9 -6 2 -10-1 -4-3 -5 2 -3-3 -2 3 -6 0 -3-2 4-2 -2-2 -10 1 -8 8 -5 1 -5 6 -1-2 -3 2 4-4 0-4 2-3 10-6zM444 417l-3 2 -4-1 1 0 0-5 3 0zM11 -26l2 3 -4 2 2 1 2-3 4-1 -6 9 -4 1 -1-2 0-7 2-5zM11 -13l-2 4 0 10 -3-14zM31 30l10 8 3 12 5 5 3 11 -6 0 -6-6 -2-2 5-4 -7 1 -2-3 2 0 -1-4 -4-3 3 0 -6-5 0-4 -5-2 2-3 3 1 0-2 -4-1 -1-3 5 1zM282 -30l0 2 1-2 8 0 5 13 -2 5 15-5 12 3 11 9 15 4 3 2 0 3 2-2 6-2 13 1 7 26 6 7 10 6 2 3 -2 4 3-4 9 6 -4-7 2-4 4 4 1-3 -3-3 2-7 -9-18 -7-9 12-15 3-8 -2-8 161-1 -3 7 -9 8 -4 17 -10 8 -8 1 -24 10 -5 7 0 9 -6 4 -5 15 -13 2 12 1 -3 14 -15 17 -2 7 -6 5 3 0 -1 2 -9 10 -8 17 -17 4 -3 3 4 7 -2 2 -29 20 -5-5 4-7 1-11 -8-23 -10-4 1-3 -4 0 -3-5 -5 0 -2-4 -30-12 -4 0 -7 4 -13-1 -3 2 -14-6 -6 1 -8-2 -2-6 -2-2 0 5 -69 0 -56-6 -52-9 -51-13 0-3 3-1 -2 0 0-3 -2 1 -4-3 1-2 3 2 -2-2 1-5 -4 4 -2-3 -1-6 3-5 -3 3 -3-1 0-2 -1 2 -4-1 -2-1 3-1 -2-1 1-4 -7-3 0-5 8-1 -8-2 3-7 5-1 2 5 -2-6 3-3 -12 9 0-5 3-1 0-2 -2 1 3-5 -3-11 2-2 5 8 -3-5 2-3 -6 0 -4 4 -3-7 4-5 3 0 -3-1 -1-3 7-7zM570 55l0 5 -2 0 -3-4 0-11 2-4 3 4 -2 11zM570 66l-14 14 1 1 -6 3 1 3 -4 12 -4 1 -6-4 -1-7 7-11 2-2 4 1 -1-1 5-5 -12 5 2-6 -2-1 -7 12 -2-2 0 3 -4 3 -7 1 -2-5 -3 0 -6-16 -6-2 -3 4 -4-2 -3 11 1 12 -6 13 -26 8 7-8 1-8 7-9 10-10 5-15 6-11 17-16 11 0 1 1 -2 1 2 1 1 3 -5 8 -5 0 -5 4 7-1 2 2 4-4 3 0 -1 10 4-1 6 8 6-1 -1 2 4 1 11-2 2-4 8 2zM570 17l-3 2 1-4zM570 6l-1-1 1-2zM570 2l-4-15 0-9 3-6zM545 22l-10 2 -13-2 1-2 9-2 12 2zM545 59l12-6 1 2 -2 6 -4-3 -4 4 -9-3 1-6 1 4zM390 27l-11-2 6-3zM391 -19l0 5 -1-3 -2 4 0-3 -3 3 2-10zM26 -17l-3-1 2-1zM24 -7l-1-7 2 4zM32 -1l-3 7 1-5 -2 1 0-5 2-3zM471 101l-3 1 3-4zM375 470l2-5 5 1 0 4zM495 373l2 6 -2 0 -4-5zM496 351l-2-8 -4-3 -4 1 4-1 6 3zM554 398l-1 2 -5 3 1-4 5-3zM493 367l0 3 -3 3 -5-3 2-1 -1-7zM480 344l6-2 -7 5 -4-1 2 1zM503 355l6 2 1 6 -1-1 1-4 -8-2zM530 382l-4-2 -3-5zM521 367l-1 1 0-2 -5-3z";

/** China, main landmass first */
const CN_LAND =
  "M330.8 391.7l-1.9-1.5 -4.8 .6 -.9-1.1 -1 0 -1.2-.9 -.7-1.1 -3.3-.9 -.5-2.9 -1.3-1.7 .4-2 1.3-.8 .7-1.6 -1.6-1.1 -4 .2 -.7-.9 -1.2-.2 -1.8 .6 -3.8-1.6 -.6-1.2 -2.3-1.8 -4.7 2.8 -.3 2.2 -1.1 1 -1.2 0 -2.2 1.4 -2.4-1.1 -1 .5 -.6 1.9 -.8 .6 -3-2.6 -.7 .4 -.5 1.4 -1.8-1.7 -3.7 3.5 -3-2.3 -3.1-1 -2.7 3.6 -2.5-.3 -1.1 .6 -.8-1.2 -1 .3 -1.2 3.4 .4 2 1.5 2.4 -.3 5.2 .9 .9 -.9 .9 -2-.9 -2.8 .5 -.7-1.1 -.8-4.8 -1.2-.4 -4.5 2.9 -4.9-.3 -.6-.9 .2-1.1 -1.7-1.2 .2-2.6 -3.8-1.3 -4.2-.5 .1-1.8 1.5-2.4 .6-3.7 1.3-2 -1.6-1.1 -5-1.3 .3-2.1 -.7-1.2 .2-1.6 -1.5-2.5 .3-1.4 1.4-1.4 -6.5-.5 -5.6 2.1 -1.3-.2 1.7-3.5 -.8-2.3 -.9-.8 .1-1.6 .6-1.6 1.7-1 -.2-1.9 1.2-2.4 1 .3 1-.6 1.5-3.1 1.6 .1 1.9-2.4 2-.8 -.9-2.4 1.1-.7 .9-5 -.4-11.3 -1.4-1 -1 .1 -.7 1.1 -.7-.7 -1.5-6.3 -2.2-2.6 -1 0 -1.6-1.9 -2.6 2.8 -2.8-1.5 -2.4 0 -1.8-1.2 -2.9 .8 -.8-.6 1.3-2.1 1.9-1.7 -1.2-3.3 -2.8 1.4 -.3-2 2.2-1.3 -1-.5 -1.8-2.4 -5.4 2.3 -1 1.7 -6.4-2 -1.4-1.7 -3.4 1.7 -1.9 1.7 -1 .1 -.5 1.1 -2.3 1.3 -5.1 .6 -2.5 3.3 -3.5 1.7 -.7 .9 .3 .8 -1.5 1.1 -5.9 1.1 -3.4-.7 .3-1.9 -3.5-2.2 -2.1 .9 -3.5-1.5 -3.6-.6 .1-1.8 -2.3-1 -2.1-.2 -3.8 1.6 -6.8 6.5 -.8 1.6 -1.1-1.5 0-1.1 1.5-3.8 -.3-1.6 -1.7-1.2 -5 .9 -.4 .8 -1.7-.5 -2.6 .4 -3.9-.6 -1.5-.4 -4-3.7 -.8-.2 -1.2 1.4 -1.1 .2 -2-2.2 -1-.1 -.2 1 -.9 .8 -2.5-4.7 -5.4-1.4 .8-2.9 -.8-.6 -2.2 .3 -1.6-1.1 -3.8-4.2 -.7-3.7 -1.4-1 -3.7 .4 -3.2-5.7 -1.4-.3 -1.4-1.1 -5.2-5.6 -1.1-3.4 -3.7-1.5 -2.3 .1 -3 2.8 -1-.9 -.3-1.7 -2.5-2.7 -4.2-3.3 .4-1.7 -1-.5 -2.2-2.8 -2.2-.3 -.6-.7 -2.5-5.5 -.9-.4 -.6 .9 -2.1-.2 1.3-3.5 -.7-1.6 1-2.4 -1.5-3.4 -.1-4 3.2 .7 .1 1.1 1.1 1.6 1.4 0 1.7-.9 1.1-5.1 -.4-.7 .3-2.6 -2.1-3.8 .8-6 .4-.8 2.5-1.4 -.1-1.1 -1.9-2.5 -2.8-1.8 -1-8 .9-2.2 -5.2-1.7 -4.6-3 -2.2-2.6 .2-1.3 -2.9 .1 -.8-.5 0-1.5 -1.3-1.6 1.6-3.5 .1-1.7 -.8-2.3 -1.5-1.3 -1.1 .1 -.2-2 -1.7-1.6 -2.5-.9 -2.7-1.8 -.8-1.2 3-.7 1.7 1 2-.7 .5-1.2 -1.1-1.8 .9-2.2 -.1-4.1 .4-1.9 1-1.3 -.4-1.4 -3.3-2.9 -2 0 -.6 .6 -1.2-.7 -.2-4 1-.4 -.5-3.7 .9-1.7 2.8-1.3 .3-2.7 2.2-2.2 3.7 .1 3.6-1.2 1.4-1.6 .9 .9 2.1 .3 2.8-.9 0 3.6 1.7 .9 3.6-.5 .2 1 1.7-.6 2.2-2.9 3.2-2.5 5.4 2 4.6 .3 2.5-1.7 .5-1 3.6-1.2 5.2-1.3 4.2-.3 .9-.9 3.2 .4 1-2.6 .3-4.1 .7-1.1 3.1-.9 -1-1.7 2.4-1 .9 .6 .4-1.2 -.2-11.6 1.1-4.2 1.2-1.3 -1.1-1.8 -2.1-.3 -.7-1 .8-.8 1.1-.5 8 .2 5.6-.7 .9 2.2 3.2 .3 1.7 1.5 1.5-2.6 -.1-.8 -1.8-1.4 .1-.8 9.8-16 .8-.6 4.9 3.6 6.3 1.7 .3 1.3 .8 .4 3.3-1.5 2 0 1.8-1.8 .7-7.6 2.2-4.2 .6-.7 5.7-.3 2.3-1.8 .9-3.5 1.2-.7 1.3 0 2.6 .9 3.1-.5 .1 1.9 -1.3 1.2 2 2.4 -.9 1.6 3.6 2.6 .1 1.9 3.6 3.3 2.8-.1 1.5 2.3 .8 .5 1.1-.6 1.4 2.3 .9 .5 1.4 6.8 .4 1.2 1.1 .7 .6 4.6 -1.3 2.6 .2 3.4 -2 1.8 -1.4 2.8 .9 4.7 1.5 0 1.9 1.4 2.1 .7 6.6 1.6 3 .1 5.7 1.7 2.5 2.8 2.6 1.1 3.8 3.8 2.6 1.3 2.5 0 -.4 2.7 1.8 1.8 2.1 8.1 3 3.4 .3 2.1 7.1 0 18.8 3.6 4.4-1.1 12.7 2 1.4 .4 2.6 3.3 1.5 .7 7.8 1.8 5.4 2.9 6.7-1.5 0 2.5 4.2 .6 1.8-1.6 12.5-6.4 12.4-2.6 4.4 .1 6.3-.8 7.7-4.2 4.6-6.9 4.3-2.1 2.5-2.4 .4-.8 -.6-1.4 -2.6-2.4 -1.9-2.8 1.3-5.4 1.9-2.9 4.2-.3 2.6 1.7 7.2 .8 3.3-2.6 2.7-3.3 .6-2 .9-.6 2.3 .1 5.9-1.7 3.6-3.8 .6-4.2 1.3-2.4 1.5-1.3 3.8-.3 .6-2.2 1.1-.8 1.7 .6 1.1-1.4 2.9-1.6 3.2-.2 .4-.7 1.3-.1 3.2 .8 2.2-.3 1.7-1.1 -.2-2.1 -1.6-2.4 -5.8-4.4 -.6-1 -2.6-.8 -1.9-1.8 -3.3-.4 -2.3 .7 -2.8 4.2 -5.1-1.5 -3.9 .8 -2.3 2.3 -3-2.6 -.6-2.1 1.8-1.6 -.3-3.7 1.1-2.5 2.9-12.5 4.5 1.6 4.4 .6 3.9-4.5 5.4-3.5 .1-2.5 -.5-.8 -.8-.1 .2-2.2 2-6.7 1-5.9 2.5-3.4 1-3.1 -1.9-5.1 -2.1-.3 -1.3 .6 -.8-.2 -.3-.9 3.3-6 1.5-1.6 8.5-4.2 2.8-.4 3.4-1.8 3-.2 8.3 2.4 .8-1 1.8-.1 3.6 1 .2 .8 3.1 1.5 .5 1.8 .9 .1 1.5 1.3 3 4.8 2 2.1 .2 1.1 .9 .5 1.5 3 2.1 2.7 2.9 2.5 1.5 3.9 2.2 1 .2 2.8 1 1.8 1.6 1.1 2.4 .5 4.8-1.8 1.3 1.3 2.1 .4 1.8-.3 .7-.7 3.2 1.4 2.6 1.9 1.5 .5 2.6-.4 .8 .8 .2 2 2.8 2.3 .1 2.5 .6 1.2 3.2 2.9 2.1-1.2 3.6-.5 4.8-2.1 .6-3.1 1.8-2.1 3-1.5 1.9-2.8 3-2.3 2.8 .3 .5 1.1 -.2 1.7 2.7 2.8 -.7 3.6 -.7 .4 -1 2.1 .7 1.1 .8 5.6 -.2 2.8 1 2.7 -.9 5.8 .5 2.3 -1.4 1.9 .9 4.2 -.9 1.6 -7.3 0 -2-.6 -1.5 4.4 -2.7 2.1 -.5 1 5 7.9 1.2 5.7 1.2 1.3 .4 3.4 -.4 3.3 -3.1 1.8 -.9 1.7 .9 0 .9 1 -2-.1 -1.7-2.4 -1.7-.8 -1.7 .7 .6 5.7 -1.3 1.5 -.9-.3 -.8 .5 -.3 2.4 -1.4 2.2 -7.1 3 .2 1 3.2 3.2 -.9 2.4 -1.1-.5 -2.6 .8 -4.4 .1 -2-2 -1-.2 -2 2.3 0 2.9 -2.9 6.6 -2.3 1.3 -1.7 2.6 -1.8 1.2 -1.2 1.8 -.9 .3 -2.7 3.9 -.6 1.1 .1 1.2 -1.7 2.3 -2.9 .9 -1.1-.5 -.3 1.2 -1.9 .7 -.9 1.1 -3.1 1.7 -3.7 3.5 -1.9 3.6 -1.8 1.6 -1.2 .1 .2 1.2 -1.2 1 -2.2 1.2 -1.1-.4 -.4-1.1 4.5-3.1 -.7-1.2 .9-1.7 -3.6 .4 -1.1-1.8 1.9-1.4 -.6-1.3 .2-1.1 2.1-1.7 2.7-6.9 -1.5-1.9 -2.8-1.3 -.5-1.4 -.3 1.2 -1.3 .6 -3.7 .1 -.7 .8 -2 3.4 -1.7 4.5 -6.9 5.1 -1.5 2 -.7 4.1 -1.2 2.4 -1.1 .8 -2.4 .3 -2.7 1.7 -2.5-1.5 -1.5 .7 -1.6 4.2 -.2 1.9 1.3 2.9 1.2 1.1 2.4 1.1 4.9 .3 2.1-.8 1.4 .8 2 3.6 -.7 .9 .2 3.5 1.7 1.3 1.7 .4 4.1-.9 1-1.3 -.3-1.1 3.3-3.8 -.4-.7 3.8-2.4 2.9 .8 1.7 1.1 1.6-.1 2.5 .9 2.9-.3 .6-1.2 2.7 .9 2.3-.7 .5 2.8 -1 1.5 .8 .7 -1.2 2.2 -1 0 -.5-.8 -2.5 .1 -7 5.5 -2.3 .4 1.2 1.7 -1.1 .1 -.6 1.4 .4 2 -2.4 1.8 -.7-.6 0-.9 -1.5 .1 -.5 .7 .9 1.4 1 .2 -1.9 1.8 -.4 1.5 -2.1 2.1 -2.1 3.7 -.3 2.3 -1.1 1.3 -.2 1.9 .5 1.1 1.4-.2 2.5 1.5 3.7 .9 3.1 1.5 3.5 6.8 4.6 6.5 .6 1.9 -.1 2.1 5.7 2.3 .4 1.9 4.7 2.7 .7 2.2 -1 .2 -4.2-1.1 -3.6 .6 -2.1-1.5 -2.7-.4 -4.3 2.7 1.6 .1 2.7-1.8 2.1 0 1 1.8 4.3 1.4 1.7 1.4 3.3 1.3 1.5 1.5 1.3 2.7 -4.1 2.2 -3.6 3.4 -1.3 2.6 -3.7 .3 -1.8 1.5 1.1 .2 1.3-.8 1.6 1.7 2.6-.8 2.2-2.1 1-.2 1.8 .6 2.9 2.3 4.1 .5 -4.9 5.5 1.8-.7 1.1-1.3 1.1-.2 .5 1.3 .2 4.1 -2.2-1 -1.7 .5 -.7 1.4 2.4 .9 -.1 1.2 -1 0 1.3 .7 -.1 1 -1.3 1.7 2 3.7 -1.1-.2 -2.1 1.6 -.8-1.3 -1.1 .8 -.9 3.1 -1.4 .6 .3 .8 -1.1 2.4 0 1.3 -.7 .8 .5 1.8 -2.7 4.2 -1.1 2.6 -.2 2.5 -1 1.2 -.9-.2 -1-2 -.9 1 -1.4-.5 3.6 4.3 -3.7 4.2 -3.4-.2 1.5 1.5 .8 .1 2.8-1.1 .4 1 -.6 3.9 1.1 1.6 -.2 .8 -1.9-.8 -2.4 .5 0 1.1 1.4 1.2 -2.7 .5 -1 1.3 .6 1.3 -.3 1 -2 1.2 -.2 2.7 -3.6 1.1 -2.2-.4 -.7 .9 .1 .9 -1.7 .3 .4 .9 1.6-.1 .5 1.5 -2 3 -1 .1 -.9 2.2 -1.7 .1 -.2 2.6 -.8-.1 -.2-.8 -1.8 1.6 -2.5-.3 -.3 2.3 -2.3 1.4 .8 .8 -1.1 .8 -.9 3.3 -2.3-.2 -.4 .8 -3.6 1.8 -2.2-.3 -.9 .4 -.5 1.3 -1.2 .1 -2.1-.9 -3.4 2.7 -1.1 0 -.5-1.2 -1.2 .6 -.2 1.9 -2.4-.4 -3.3 1.2 -2.1-.8 -1.9-2.1 -1-3 -.8-.2 -.7 .6 .1 1.3 -1.2 .4 2.6 3.4 .3 4.2 -4.1 2.1 -.7-1.5 -.8 1.1 -.1 2.1 -.8 .7 -1.1-.6 -2.2 2.1 -1.9-1 .1-.9 -.8-.2 .5 2 -.9 .8 -3.9-.9 -.7 1.5 -1 .1 -1.7 1.9 -3 1.1 -2.8-.1 -.6 1 -2.4 .7 -2.1 2 -1.1 0 -.4-1.1 -.5 1.8 -1.9 1.6 -.3 1.1 .3 .9 2 .2 -.5 1.9 2.3 1.6 -.6 1.8 -1.1 .8 -2.4 .5 -2-.2 -.6-.8 1-.5 -2.2-2.3 .2-1 -1.4-1.8 -.2-2.9 .9-2.4 1.5-.5 .1-1.2 -1.1 0 -.8-.8 -.8 .4 -1-1.6 -.8-.2 .3 1.8 -4.2 1.5 -.6-.7 0-1.2 -3.5-.2 -2-2 0-1 -1.3 .1 .6 2.6 -.8 .7 -.7-.8 -1.4 1.5zM435.6 347.8l-.9 .7 -.1-1.1zM460.3 262.4l-.8 .4 -2.6-.5 -3.2-1.8 1-.6 1.2 .2 .4 .7zM467.4 278.9l-2.7-.1 -.7-1.3 1.3-.3 1.8 .5zM450.9 334.3l-.7 .7 -.6-.9 -.2-1.1 .8-.8 .7 .6zM356.9 395l1.4 0 -.1 1.3 -2.6-.5zM460.8 302.1l-.8 .4 -.5-.8 .6-.9zM382.2 387.2l-.7-.7 1.1-1.2zM380.6 386.9l-1 .3 1-1.1zM363 407l.9 1.2 .6 2.5 -2 1.3 -1.8 3.1 -2.3 6.9 -3.7 2.4 -.3 1 -2.2 .4 -1.2 1.6 -2 .6 -5.4-1.4 -3.7-1.7 -.8-3.7 -.1-4.5 6.6-6 -1.1 0 1.4-1.6 2.2-.1 1.5-1 2.7 .1 2.8-1.2 1.9 0 .6 .7 0-1 2.1 .8 -.1-1.1 .7-.7z";
/** Neighbouring countries around China */
const CN_NEIGHBORS =
  "M328 470l2-8 -6-6 2-3 -6-5 -2 1 -2-5 -16-17 1-2 -14-7 3-5 4 1 4-5 -5-4 2-3 -6-3 -4 3 -5-2 -4-4 1-5 -3 0 -5-7 2-5 6 3 4-3 6 2 15-9 6 4 10 2 -3 4 2 5 7 4 6 0 -8 7 -4 0 -2 7 -6 5 -4 11 10 12 3 6 16 13 9 11 2 7zM-30 72l7 3 2 11 2-1 -4 10 3 2 -2 10 9 4 2 8 9-7 17-3 2 0 -2 2 -9 3 7 8 4-3 3 7 7 4 -15 4 -8-4 -1-3 4-2 -1-4 -7 1 -3-2 -3 6 -5-2 2 2 -1 2 -5 3 -5-4 -3 1 -2 2 5 6 -2 5 0 4 -7 6zM226 470l-3-7 9-13 -3 0 -13-25 3-1 4-13 10 0 1-3 10-4 7 4 -1 6 7 0 2 6 -5 17 5-1 9-6 5 4 8-6 7 1 9 11 1 10 9 8 -2 12zM-30 151l7-6 0-4 2-4 -5-6 2-3 3-1 6 3 5-4 -2-1 5 1 3-6 6 2 4-2 1 5 -4 2 1 3 2 1 -3 1 -3-3 -5-1 -3 2 -1 3 10 4 3 3 5 0 0 3 4 2 12 2 -1 11 7 2 0 13 -2 2 -6-4 -5 1 -1-3 -19 2 5-13 -4-8 -7 4 -2 4 -7-2 -2 4 -3-4 -8 2zM468 364l-1 8 -2 0 -8-11 0-5 7-19 4-4 5 3 -2 21zM488 182l2-6 10-4 0-2 13 11 6 18 0 6 -6 3 -1 2 -7 1 -1 6 -1-2 -6 5 -3-2 2-3 -3-2 2-10 -5-9 -2 1 -1-2 7-3zM516 210l-2 1 0-3zM498 234l-2-1 1-2 5-2 1 2zM0 -30l-8 1 5 12 -5 4 -4-1 -3-4 -5 2 -3-10 -7-1 0-3zM488 -30l-1 6 11-2 3 8 3-8 1 8 3 0 2-6 2 1 -1 4 2-4 -2-5 4-2 5 0 12 5 0 3 -2 0 9 11 1 14 6 13 4 12 -4 35 -9 34 -6 9 -6 5 -7 0 -1-4 -2 2 -2 0 -2 7 -4 2 1 3 -4-3 4-3 0-7 -7-16 4-6 10 0 1-1 1-15 -3-13 3-5 -3-4 -3-2 -11 12 -11 3 -6-10 -11-4 -10 1 -5-3 0-3 -16-21 -8-7 -17-1 -16 7 -3 6 5 2 1 4 -6 18 1 6 -9 9 -14-4 -5 2 -8-3 -10 9 -15 6 -16 0 -5-3 -1-4 -6-1 -3-3 -11-1 -8 3 -5 0 -8-4 -1-9 -23-9 -8 8 2 10 -1 4 -6 4 -9-4 -7 0 -5-3 -1-4 -13-6 -18 7 -6 4 -16 4 -3-8 -6 1 -5-2 -1-6 -3-2 -2-7 -4-4 -5 2 -9-2 -3-7 -6 4 -6-32 -5-9 -1-3 4-1 -10 0 -9 4 -3-3 -3 1 -1-2 5-4 -4 0 -2-3 -1 1 -1-4 -7-2 3-10zM543 -30l7 13 19 20 1 5 -5 3 5 18 0 9 -21-42 -8-8 -7-15 0-2zM513 470l1-2 -7 0 -10-8 2 7 -11-6 -6 4 -4-2 -2 1 -1-4 3-6 -3-1 -1 4 -6-3 -5-16 4 2 3-2 -2-16 1-10 5-2 9 2 5-2 0 9 4 5 -3 11 -5 4 -1 8 6 12 4 1 0-3 4-2 4 1 2 4 2-2 6 0 -2 4 7 7zM475 470l-2-1 1-1 5-1 6 3zM490 465l3 0 -1 3 -2 0zM517 459l-3 1 1-6zM490 448l-1 4 -2-3zM-30 206l4-1 -1-8 2-1 9 3 1-5 8-6 0-10 11-5 21 4 6 3 4 6 -2 5 1 3 4 0 2 10 -5 3 -9 1 -11-7 -5 1 -1 2 2 6 -2 1 -2 6 5 11 4 4 -9 3 -3 9 -33 25zM501 168l-2 5 -8 2 -2 6 -9 0 -2 4 -3-1 0-2 -3 0 0-5 4-3 -3-1 0-7 -6-1 -4-3 3-7 9-8 3-10 12 1 -2-7 6-2 5-6 1-7 7 6 -2 2 -3 8 3 7 -14 18 0 6zM128 309l-3 16 -13-2 -9-3 -2-4 -3 1 -11-11 -13-3 -20-17 -3-5 7-10 12-3 3 2 13 16 5 1 2 5 3 3 3 0 0 4 5 1 2 4 5 1 2-1 5 4zM166 68l4-3 6 0 7-5 18-6 14 5 2 6 20 5 6-4 1-4 -2-6 1-4 6-8 23 9 2 8 7 5 6 0 8-3 10 1 5 4 5 0 1 4 5 3 15 1 16-7 9-9 11 3 7-1 -4 20 1 5 2 1 6-3 5 2 2-5 6-1 11 8 2 5 -8 1 -14 6 -5 9 -4 4 -8 1 -7 8 -10-2 -5 1 -2 7 5 8 -7 4 -5 7 -8 5 -22 3 -14 7 -5 0 0-2 -7 1 -14-5 -4-4 -43-4 -7-18 -4-1 -10-9 -21-5 -1-4 3-5 1-10 -5-12 -7-3 -7-8zM326 470l-20 0 1-11 -9-9 0-10 -10-11 -7-1 -7 6 -6-4 -11 8 -2-1 4-16 -1-6 -9-2 2-5 -2-3 -2 1 0-3 10-10 1 3 6 1 -1-15 5 0 7 9 1-2 1 2 -1 5 3 4 5 2 5-3 6 3 -3 3 6 4 -3 5 -6-1 -1 4 13 8 0 3 13 13 4 7 8 5 -1 5 4 4zM7 131l5 3 14-3 -7-8 -1-5 -4 4 -7-7 10-5 -1-3 4-3 7 2 8 8 3-6 5-1 11 8 11 2 12 5 11 11 0 1 -14 3 -6 3 -11-2 -6 6 -12-5 -8 2 -5 6 -13-1 -3-2 -1-4 -7 0 -1-3 -9-3 0-4 3-2 4 0 4 5zM-30 -28l7 2 3 10 5-2 3 4 4 1 5-4 -4-8 -1-3 2-1 80-1 -3 10 6 2 1 3 7 3 -4 6 4-1 3 3 19-5 -4 4 6 10 5 32 7-4 4 7 15 2 8 16 6 3 5-2 -1 2 4 6 -4 0 -3 6 -7 1 -4 13 -6 2 -12-6 -2 1 -9 14 1 6 -6-3 -15 0 3 4 -3 7 1 11 -7 4 0 5 -12-10 -25-8 -10-7 -4 1 -2 6 -8-7 -8-3 -6 5 -17 4 -8 6 -1-7 -10-6 2-7 -3-3 5-11 -3-1 -2-9 -6-2zM541 218l5-2 -1 4 3-1 3 5 -2 18 -2 0 -3 6 -1-8 -1 2 1 3 -5 0 1-3 -2-5 2-7 -5-5 2 5 -4 2 -3-5 3 2 -4-5 2 0 5-9zM570 207l-1 5 -5-1 -4 3 -2 8 -3 0 -2-5 -3 1 4-10 6-1 0-3 4-3 5 0zM570 195l-4 0 -13 11 -4 0 0 6 -4-1 -8 3 0-5 3-2 12-17 6-1 10-7zM498 336l0 2 -2 0zM533 303l-4 8 0-7 3-2zM540 283l-1 0 0-2 2-2zM-30 270l7-7 6-2 8-9 4 0 11-9 2-9 8-2 -5-4 -4-10 2-7 2-1 -2-6 2-3 5 1 10 6 10-1 12-5 2 1 0 10 5 6 -3 1 -1 7 1 11 -2 2 -2-3 -3 0 0 14 3 0 3 6 12 12 -7 4 -5 9 23 21 13 3 10 10 5 1 0 2 22 6 3-3 -1-8 4-6 5 0 -2 9 3 5 6 2 24 2 1-5 -5-4 1-2 10-1 7-7 7-2 7-5 7 4 8-4 2 2 -2 3 4 2 -2 4 8 2 2 5 -5 4 2 5 -11-2 -10 7 0 6 -7 8 1 4 -6 10 -8-1 -1 10 -5 13 -4-1 -2-19 -4 0 -4 7 -3-2 -1-5 1-4 10-4 3-7 -25-6 0-11 -5 1 -2-4 -3 1 -3-4 -4 7 8 8 -6 1 -4 4 6 7 -3 6 3 6 -1 18 -1-2 -1 2 -1-6 -1 5 -5 0 1-5 -2-4 2 3 -4 4 -10 3 -1 7 -8 8 -11 0 -1 1 2 0 -14 12 -22 11 -2 6 -10 0 -5 5 -7-1 -4 8 0 18 -1-3 -2 1 3 2 -2 9 -4 5 -47 0zM394 376l2-1 1 3 -4-1zM220 470l-3-17 2-6 -5-1 -5-9 1 4 -4 5 -2 1 -2-3 1 3 -6 3 -5 5 0-4 -1 2 -4 0 0-3 -3 2 1-5 -5 4 4-19 -4-19 -3 4 -3-5 4 1 2-1 -4-4 1-2 -5-2 -1 2 -2-2 1-4 -2 3 -1-5 0 3 -5-11 1-3 3 3 2-10 1 1 4-2 -1-5 4-7 0-8 9 2 6-11 -1-4 7-8 0-6 10-7 6-1 4 3 -1-5 4-4 3-6 5 3 2 8 3-1 1 11 -1 9 -9 7 -3 5 1 6 -1 3 12-1 1 9 7 5 -4 8 8 3 2 5 4 1 5-3 2 2 -5 3 -1 5 -3 0 -3 5 -7 0 1 2 -6 1 -1 3 -10 1 -3 12 -4 1 13 25 2-1 -3 4 0 7 -5 2 3 8zM176 420l-2-2 2 0zM177 410l2 2 -1 1zM163 315l0 3 4 2 -1 5 -1 0 -22-1 -6-2 -4-4 13-11 5 1 -1 1 9 2 4 2zM129 376l0-13 -3-6 3-6 -7-6 5-5 5 0 -7-8 3-8 5 4 1-1 4 5 2-2 2 3 -1 7 2 1 21 4 5 3 -3 0 -4 7 -6 1 -3 6 1 5 1-1 3 3 3-8 4 3 2 25 -5-1 1 7 -3-5 -1-13 -3-7 -6 3 -3-6 1-6 -1 2 -3-1 3 4 -2 4 1 6 -4 4 -2-1 2-2 -3 0 1-4 -5 7 -1-6 -3 6zM148 378l-2 0 0-9 3 5zM-30 158l8-2 3 4 2-4 7 1 1-3 8-4 3 3 0 6 -3 7 0 6 17-4 12 7 -4-1 0 2 -4 1 -13-4 -10 2 -5 3 1 10 -8 6 -1 5 -9-3 -2 1 1 8 -4 1zM40 204l-1-5 8 3z";

/** India, main landmass first */
const IN_LAND =
  "M77.4 178l1.7-.9 2.8-.4 3.2 .3 .3-4.5 .8-.6 .6 .8 1-.4 8.8 .9 2 1.7 1.2 .2 3-.2 1.1-1.4 5.4-1.5 .9 .5 .1 1.6 1.1 .5 1.4 .1 1.7-1.4 2.2-.7 -.9-1.3 0-1.3 1.2-1.6 -2.8-7.9 -1.8-3.3 -.2-4 -4.7-.6 -1.9-3.1 -.2-2.4 .9-2.1 .6-3.8 -1.2-1.6 -4.2-1 -2.9-2 -.4-.9 1.2-4.7 5.1-4.8 3.7-5.4 3.6-2.3 1 .1 1.8 1.3 .7 2.6 1.3 1 6.5-1.8 3.3 0 4.4-1.2 1.2-3.1 2.5-2.3 3.1-5.9 7.5-3.7 .7-.9 4.4-7.5 1.8-4.7 5.6-2.1 1.6-1.9 -.5-1.9 .3-1.2 5.9-6.6 3.8-1.9 -.2-1.2 -.9-.3 -.2-.8 1.1-4.1 -.9-3.7 .6-1.5 2.4-1.9 6.6-2.6 1.1-2 -1.2-1.4 -1.6-.8 -5.2-1.2 -.5-1.7 .4-2.2 -3.9-.4 -.5-3.3 -2.1-1.3 -1.4-1.7 -.1-.8 2-3.1 -.1-1.3 -1.5-1.3 -.3-1.4 .4-.9 2.7-1.4 .5-.8 -.5-.9 -3.2-.4 -.5-.8 1-1.7 -.6-1.5 -1.4-.5 -.1-.8 2.2-4 4.2-1.5 7.9 2.1 2.9 .2 3.2 1.6 3.1 .6 4.2-2.4 1.6 .1 3.5-1.2 1.7 .3 1.2-.7 1.1-1.6 2.7-1.3 .4-1.1 1.7-1.5 7.8-4.7 1.1 .7 1.4-.6 0 3.6 3.7 9.5 4.2 1.3 3.7 3.2 0 1.1 -2.7 2.1 -.3 1 .7 3.1 .1 4.5 4.1 4.9 -.4 1.7 1.3 1.6 .2 6.5 -1.2 .4 -.8 1.3 -1.8 .5 -1.9-1.7 -.4-1.3 -4 0 .8 4.7 3 3.8 -.4 3.6 1.4 1.8 -1 2.1 .2 2.2 1.3 .4 1.6-.4 .5-1.3 1.2 .2 2.9 4.3 2.9 2.4 2.9-.3 3.7 2.7 .8-.1 .8 1.6 -.3 1.1 1 .7 4.5 1.6 4.8 3.1 .3 1.1 -2.1 .4 -3.8 3.5 -1.8 2.5 -1.9 4.6 -.3 3.4 -1.9 2.9 -.4 1.9 4.8 3.8 .8 .1 .5-.9 .9 .2 7.6 4.6 1.9 2.3 7.1 4.5 2.4-.6 5.5 3.3 2.4-.3 1.4 2.5 7.4 2 2-1.5 5.1 1.2 .8-.9 2.6-.9 6.9 2.6 1.1 3.8 6.2 2.7 .4 .9 .9 .4 4.3-1.5 1 .1 .8 .7 .5 2.1 .8 .5 2.8-.8 4.8 .9 4.5 1.8 4.1-2 1.1 1.8 2.7 .9 1.6-1 2.9 .2 2.8-.7 2 .7 .7-.8 1.2-4.4 -.9-3 -1.9-3 .7-6.4 .9-2.8 -.1-1.4 -.7-.8 .5-.7 3.6-1.2 1.9-1.3 2.4 .6 1.1 1.9 -.4 7.1 1.8 1.6 -1.6 1.6 .2 1.2 .7 .5 .7 2 4 1.9 2.3-.7 5.2 1.7 5.3-1 1-1.5 1.8-.7 3.7 1.3 1.6 0 7.2-.9 1.7-1.3 1.3 .8 2-.1 4.2-1.1 .7-.4 0-1.5 -1.1-1.7 .9-3 -1.5-2.2 -3.2 .4 -2.1-1.6 .2-2.6 1.1-.5 3.5 .2 1.5-1.3 4-.7 1.7-.9 1.3-1.2 .3-1.2 -.7-.4 .7-1.4 2.2-1.4 2.8-2.9 .8-2.9 6.9-2.8 2.5-2.2 .3-1.5 1.2-.4 2.1-2.7 3.8-3 2 1.5 7.9 1.6 1.9-2 -.2-.8 6.2-4.3 2.4 2.3 1.8 0 -.7 1.5 -1.7 1.4 .9 2.5 3.2-2.5 2.4 4 -2 2.6 -1.2 2.9 1.3 .7 2.8-1.7 2.4 1.1 4.8-.2 2 1.3 1.3 3.7 -.3 1.1 -1.1 .4 -3 3.3 -.9 1.8 .7 2.1 3.1 3.8 -.7 1 -2.2-.9 -2.2-2 -6.9 1.9 -1.6 .8 -1.6 2.8 -5.3 5 -4.1 2.8 -.6 3.8 1.6 4.4 -1 1.6 -.8 3.8 -1.8 2.9 -2 1.8 -.7 2.6 1.8 1.4 .6 1.2 -1.2 4.4 -3.1 7 -1.6 6.8 -6.1-1.3 -2.5 .7 -2-1.3 -.6 .9 2 4.9 .1 8.2 -.7 1.6 -1.4 0 -.6 .6 .3 1.4 -.9 2.9 1.6 5.2 0 1.9 -1.1 .4 -1.1 3.2 -.8 .3 -2-1.6 -1.1-.2 -1.4 2.4 -2-10.4 -2.5-5.6 -.5-3.7 -1.6-5.2 -1.7-.5 -1 .8 -.9-.1 -.6 1.4 .3 1.4 -2.2 3.4 .2 3.5 -1.7 1.2 -1.5-.7 -1.2-2.4 -.9 .1 .1 1.9 -.7-.4 -2.6-6.9 .4-5.1 1.7-2.7 2.1-.1 1.8-1.7 1.4-.4 1 .5 .9-2.4 1.7-.9 1.7-6 -.2-1.7 3 .3 .5-.9 -1.7-1.5 -4.5-1.9 -21.4 1.9 -7.8-1.4 -.9-.6 -.4-9 -2.3-3.9 -1.1 .5 .2 1.7 -.5 1 -2.4 .2 -2.5-1.4 -1.1-1.3 -.8-2.6 -1.1-.5 -.8 .7 .9 1.3 -1.1 .4 -2.9-.3 0-.9 -.9-1.1 -2.8-1.9 -.9 1.1 1.3 .9 .1 1 -3.6 4.4 -.7 3 .9 1.1 1.5 .2 3.5 3.6 1.3 .5 2.3-.1 .8 1.8 1.7 1 -.1 1.1 -2.4 .9 -3.9 0 -1.6 4.6 -1.7-.5 -1.9 4 1.7 2.5 1.9 0 1.6 1.2 4.5 1.5 -.1 4 -1.5 5 2.6 3.4 -.4 2.1 2.7 1.1 -.1 4 1 4.6 2.3 6.4 -.2 3.7 -1.1 .1 1.1 1.5 .6 2.6 -2 .1 -.7-1.3 -.3 1.3 -1.1 1.2 -.9-2.2 .4-4 -1.4-1.7 -.8 4.4 .4 2.5 -1.8 .8 -2.1-1.5 -.6 1.5 -1.8-.1 -1-.7 1.6-6.8 -2.9-1.7 -.8-1.5 .4 1.7 2.8 1.8 -2.7 4.6 -1.6 1.5 -1.9 1.2 -6.5 2 -3.3 2.8 -1.2 2 -.1 1.9 1.6 5.3 -.1 1.9 -1.2 1.3 -.9 1.8 .1 .9 -3.6 2.9 -1.6 2.5 -1.2-.6 -.1 2 -9.7 3.7 -1.1 0 .9-.9 -.1-1.6 -.8-.3 -3.5 2 -1.1 2.1 1 .3 1.9-1.2 .9 .2 -9 8.2 -1.1 2.5 -7.9 10.2 -6.2 3.4 -6.3 7 -3.1 2.3 -5.4 2.8 -3.2 2.7 -1 1.8 .9 2.2 -.1 1.8 -1.1 2.2 -7 3.5 -5.2-.5 -1.6 .5 -2.2 5.5 -1.4 1.2 -.7 1.9 -2.2-.1 -.6-1.5 -2-.4 -3.7 1.5 -1.3 1.2 -2.7 5.8 -.7 3.6 1.8 8.8 -.9 4 2.8 10.7 -2.2-3.4 -1.3 1.6 4 3.6 -1.6 9.9 -1.2 3.5 -2.4 3.2 -1.7 3.7 -1.6 6.1 .6 1.9 -1.5 1.9 1.6-.3 .6 1 0 13.9 -2.5 .3 -2-.4 -3.2 1.1 -.9 1.2 .1 2 -4.7 6.9 -.3 1.7 1.5 1.7 3.7 .8 2 1.3 -2.9-.9 -3.4-.2 -8.2 2.4 -3.4 3.1 -1 5.6 -1 1.8 -4.3 2.8 -3.8 1.6 -3.1-1 -3.5-2.6 -7.5-8.7 -1.1-3.8 -.8-.7 -1.3-3.6 -1.1-7 1.4 1.4 .4 4.3 1.3 .1 -1.6-5.7 -2.2-2.5 0-1.1 -6.6-17.8 -2.8-5.1 -4.2-4.9 -4-8 -2.3-7.7 -1.3-8.7 -2.4-5.7 -1.4-6.7 -6-8.7 -.8-3.5 -1.2-1.4 1.9 .1 -1.6-2.2 .3-1.8 -1.4 0 -.8-.8 -2.7-5.2 -1.8-6 -2-17.3 -2-7.2 -1.3-8.1 2-5.5 -.4-2 -1.1 2 -.9 .5 -.4-1.5 .3-3.3 2.4 .5 -2.7-1.4 -.3-.8 .5-1.6 -.9-.8 -.7-3.8 .7-3.7 3-8.7 -.7-6.1 -1.8-1.5 -.8-2.9 1.6-1.4 -1.7 .1 2.8-2.2 4.2-1.8 -3.7 .8 -4.1-.4 .8-2.6 1.6-1.3 -2.5-.2 .6-2.7 3.5-.9 -3-.8 -1.8 .3 -3.7-.5 1.6 1.3 -1 2.4 -1.1 .5 -1.3 1.8 .3 1 1 .4 1.1 1.7 -.2 1.9 -3.5 5.4 -8.7 3.8 -5.3 1.7 -4.2-.3 -3.2-1.7 -5.9-5.4 -3.6-5.1 -7.1-7.7 -2.3-3.2 -.4-1.4 .2-1.4 1-.7 1.1 .4 1.9 2 3.8-1.5 1.4 .1 1.1-.8 1.2 .3 2.6-1.3 2.4-.2 3.9-5.7 1-.4 -.2-1.3 -.8 .1 -.9 1.5 -3.4 .2 -6.4 2.4 -5.7-1.7 -5.5-3.5 -2.2-2.2 -2.6-5.9 .5-.8 4.7-3 -5 1.8 -1.1 1.3 -1.5 .2zM443.3 426.7l-.8 1.3 -1.9-3.6 -.8-.1 .3-2.6 1.9-.9 1.8 3.8zM440.6 419.2l-1.3 1.5 -.7-.8 .8-1zM431.3 406.7l-1.2-.3 .2-.8zM436 411.8l-1.1 .1 -.9-1.2 .9-.9zM437.3 409l-.7 .7 -.4-.8 -.2-1.4 .5-.9zM425.5 394l-1.1-.4 .3-.9 1.1 .7zM420.2 373.4l-1.9 .2 -.4-3 2.2-2.3 1 2.8zM422.3 360.9l-.7 .4 -.1-2.2 .7 .6zM422.6 358.6l-.8 0 -1.5-2.5 -.3-3.1 .9-1.3 .5-2.7 1.3-.5 0-1.3 -.8-.7 -.2-2.8 .5-1.9 -.5-1.6 1.2-3.4 0-5.3 .9-2 1.4-.9 .6 1.5 -.6 1.5 .9 1.2 -.3 1.5 -1.8 2.8 .9 1.8 .7 4.6 -.8 1.3 -.9 .3 .4 3.1 -1.8 3.6 .9 1.7zM426.4 350.9l.8 1.9 -1.2-.8zM421.4 339l-.5 1 -.1-2.1z";
/** Neighbouring countries around India */
const IN_NEIGHBORS =
  "M570 225l-2 0 1-6zM570 200l-4 0 -4 4 -8-2 -4-4 0-7 -5-1 -8-8 4-6 7 3 4-4 3 1 1-2 5 2 2-4 2 1 5-3zM98 -30l-5 5 -1 5 -15-3 1-6zM79 -30l-2 7 -8-4 -3 4 -9 1 -7 13 -16 3 -2 6 -10 3 -3-4 -8-4 2-14 -10-3 -6-8zM508 405l-1 1 0-5 2 1zM570 299l-4 3 -6 10 -3 2 4 12 3 3 4 10 -4-5 -1 1 -13-7 -11 2 -1-12 -10 0 -3 5 1 2 0 13 -9 30 2 15 9-1 2 9 5 5 5 15 -4-7 -2 0 0 2 4 6 9 4 7-1 10 8 -3 6 -7 1 -4 3 -2-8 -11-5 -2 3 -7-5 -2-7 -2 0 -12-12 -2-1 -2 2 -2-3 4-34 11-17 -8-19 -1-10 -15-17 0-4 4-2 0-11 4-4 -1-2 -2 2 -4-8 -11-11 -3-8 -4-3 4-1 1-14 2-5 12-1 1-5 7-3 -2-2 6-2 7 0 2 2 -1 7 2 3 7-2 3 1 2 8 -3 21 2 1 14-12 8 4 4-3 3-7 8 0zM175 -30l1 11 3 1 -3 3 -6-2 -8 2 -3-4 -20 11 -3-3 2-15 -3 0 0-4zM124 -30l-3 3 1 3 -2 2 -7-1 -3 6 -5-3 -10 5 -3-4 6-11zM238 392l2 0 8 6 10 13 8 17 -4 13 -13 7 -10-3 -3-10 -2-19 5-16 0-5 5 1zM198 9l3 9 -5 4 -12 4 -17-4 -6 4 1 5 4 2 -4 4 2 3 -2 5 4 5 4 1 0 4 8 4 -10 7 1 11 -6 4 -4 4 0 4 -8 6 -5 10 -8 4 -9 12 -11 3 -5-5 -2 0 -12 12 -1 5 9 5 -1 9 1 3 6 1 4 18 -4 2 -4-2 -9 3 -14-3 -1 5 -14 1 -5-6 -1-8 -6-2 1-6 -4-5 -4 0 5 2 -23-1 -2 2 -7-4 -7 0 -1 2 -25-3 5-14 9-5 8 0 4-7 -1-2 -6 0 2-14 -10-7 -11-21 19 9 15 1 7 2 27-4 4-15 6-5 8 1 4-1 -2-3 7-3 6 0 3 3 6-4 0-8 4-8 10-3 -4-11 15 0 -1-6 9-10 -4-14 13-9 34-2 9 6 0 8 3 4 4-1zM343 121l1 22 -10 1 -4-2 -3 1 -14-2 -2-3 -6 1 -6-3 -1-4 -7-3 -11 2 -7-2 -1-2 -11-3 -16-11 -4 0 -3-3 0-2 4-11 5-6 2-1 3 2 3-4 6 0 17 10 5 6 7 0 2 4 7 5 4-1 0 4 8 1 3 4 2 1 0-3 6 2 2-2 6 3zM556 470l-10-11 -8-29 -3-7 2-4 12 7 -1 5 2 2 6-4 4 1 4-7 6 4 0 43zM531 424l1 1 -3 1zM570 218l-2 5 2 16 -7 0 -4 6 -5 4 -8-5 -13 13 -2-1 2-21 -2-8 -3-1 -7 2 -2-3 2-6 -3-3 -3 0 1-5 4-3 -1-1 2-5 5-5 3 5 7-2 -6-14 1-4 4 0 12 10 1-2 2 2 0 6 4 5 7 1 5-4 4 1zM-2 -30l5 8 9 2 0 6 -1 10 -4 10 -5 4 2 3 -3 0 -3 3 -1 5 5 4 -5 5 1 14 -2 11 10 3 1 7 -15 14 11 21 10 6 -2 15 7 2 -3 7 -9 0 -8 4 -5 14 -4 2 -10-6 -9 0 0-174zM490 470l-6-2 -16-13 -4-7 0-4 4-2 9 5 22-1 10 10 1 5 18 9zM570 170l-8 3 0 2 -9-1 -4 5 -8-3 -4 6 -5-1 -2 6 4 5 1 9 -6 1 -4-8 -11 6 -4-3 -1-5 -10 0 1-14 -8-1 -3-10 1-4 -8 1 -8 4 1-3 -3-7 2-10 10-10 -1-13 -3-13 -5 0 -3-7 -6-5 -2 0 -2 4 -14 0 3-6 -3-4 -2 2 -1-2 2-3 -4-2 -8 7 -9-3 -3 1 -8 8 -7 3 -7 12 -7 3 -10-5 -2 2 -10-1 0-2 -5-1 -5 3 -8 13 -2-2 1-6 -3-3 -12 4 -8 0 -7-3 -2 3 -4-3 -1 3 -4-4 -9-2 1-4 -4 1 -5-3 -6-7 -5 1 -2-1 -16-11 -3-4 -8 0 -4 4 -11-7 -1-4 -10-4 -3-5 -4 2 -1-10 -4-8 4-1 3 3 3-3 -1-9 -4-5 -1-7 3-4 -8-5 -3-12 -14-3 -4-4 -4 1 -3-3 -1-9 -17-8 9-4 -4-13 395 0zM570 341l-5-7 -1-6 -3-2 -4-12 3-1 4-9 6-5zM515 217l-4-1 -4 2 -2 4 -5 1 -1 4 -11 2 -3 5 0 13 -4 2 6 11 10 10 4 9 3-2 1 2 -4 4 0 10 -5 4 1 3 15 17 0 9 9 19 -10 17 -3 11 -2-10 5-16 -4-1 -2-20 -7-11 0 5 -5-15 2 0 -3-3 -3-15 -2-2 1-8 -5 1 -3-7 -6-5 2 6 -3 7 -4 1 -2-4 1 5 -7 5 -5 7 -1-5 -1 3 -4 1 -1-5 -3 4 0-9 -5 8 -1-7 3-16 -10-25 -1 5 -2 0 -5-5 6 1 1-3 -8-8 -3 0 0 2 -3-2 0-5 -2 4 -1-1 0-3 -2-2 1 4 -6-6 -3-8 1-2 4 2 0-10 1-3 4 1 1-3 0-12 3-2 -3-13 12 1 6-18 -3-4 6-11 -1-9 13-11 6-2 5 3 -3-7 5-6 3-9 6 4 5 9 3-1 4 13 1 12 -10 11 -2 7 3 10 -2 2 1 1 8-4 7-1 -1 4 4 10 8 1 -2 13 11 1 1 5 4 3 4-1 7-5 0 4 -6 8 1 2 -4 3zM506 347l0 3 -2-3zM503 335l0 4 -1-4zM443 291l-1 2 0-3 3-3zM486 282l-1-3 1-1zM429 252l-3-3 3 0zM428 238l4 2 -2 2zM389 120l1 3 5 2 1 7 -24 2 -6 3 -8-1 -6-5 9-14 6-4 14 4 3-2 5 2zM361 206l-2-16 -4-1 -2-6 2-8 -10-6 5-8 7-2 -11-7 2-12 4 4 4 1 -1-2 2 0 3 4 3 1 3-3 3 13 8 1 21-2 6 3 -3 1 -4 11 -6 2 -3 7 3 8 1-2 3 3 4-11 4 0 8 34 -6 1 2 8 -4-5 -4-17 -6-8 -7 5 -4-6 -1-9 -5 3 5 3 -2 6 3 8 -4 6 -3 0 2-4 -3 2 0-6 -2 7 -3 3 -2-7 -1 8 -4-2zM390 203l-2 1 0-6zM385 204l-3 1 0-12 4 5zM135 -30l-1 4 3 1 -2 10 3 7 20-10 4 1 -1 1 9-1 5 2 -5 1 1 2 -5 3 -22 0 -12 8 -1 2 3 5 1 7 -8 10 0 6 -5 2 -10-1 4 10 -9 3 -5 9 0 8 -3 2 -3 2 -8-4 -8 4 2 3 -2 1 -8-2 -8 6 -3 14 -14 4 -14 1 -21-3 -20-9 14-13 1-3 -1-5 -10-3 1-23 4-6 -4-3 1-7 3-3 3 0 -2-3 5-4 4-11 9 4 2 4 6-1 3-1 3-6 16-4 7-13 9-1 3-4 23 8 2 3 12-4 4 3 3-6 7 1 4-8zM201 18l-3-7 11 1z";

/** Brazil, main landmass first */
const BR_LAND =
  "M135.3 56.8l5.7 4.7 3.1-.3 3.7-2.1 1.6 .5 .4 .9 -.4 1 1 .6 1.2-2 2.7-2.6 2.1-1.3 1.9-.4 2.2-2 2.4-.3 1-.8 1-1 .8-3.1 6.2-2.6 .7-1 .1-2 -6.9-.6 -.1-3.4 -2-4.3 0-4.1 -3.7-3.2 -2.7-3.5 1-.5 1.2 1.2 3.9 .1 1 .4 .9 1.4 1.7 .4 2.8-.2 1.4 .5 2.5-.4 3.5 3.5 1.2-.1 1-.8 .6-3.7 2.5-1.4 3.5 .4 6.4-2.1 .8-1.3 2.2-1.2 2.9-.3 1.1-1.6 3-2.3 0-2 -1.2-1.2 3 .1 2.4-.8 1.1 .2 1.6 1.6 -.5 3.7 -1 1.5 .2 .9 3 .4 .9 .6 .5 .7 -.4 1.3 1.9 2.8 -1.8 3.2 -1.4 .9 .3 2.5 -1.3 2.8 -.5 4.3 1.2 3.4 1.4 1 .2 4.2 .8 .4 0 1 1.4 .5 3.3 3.4 2.8 .7 1.6 1.1 3.3-1 .1-1.6 1.2-.5 .4-.8 3.7 .2 .3-1.2 4.2-.6 2-2.2 3.1-1.2 .9 .8 2.2 .6 2.4-.5 6.4 .8 1-.4 -.4-2.3 -1.8-2.1 1-.7 .5-1.4 2.8 .9 3.8-.4 4-1.6 1.7 1.6 .9-.2 1.2 1.4 3.9 1.8 2.3 .1 3.1-2.1 2.5 .9 2.2-.7 2 1.2 2.9 0 2.8-2.3 3.2-7.4 6.3-9.3 2.3-2.5 .1-.8 .9-.1 2.6 2.4 1.6 4.5 .2 4.1 4.1 11.5 -.4 .8 1.1 .3 1.6 3 3 .5 2.5 1.3 .8 2.6 -.2 2.7 -4.3 3.5 -5.6 7.1 -1 .1 -2.1 2 -2 .6 -1.3 3.3 -3.2 3.9 -.2 2.8 -2.2 1.7 -.1 1.5 -.9 .8 -2.3-.4 -4.7 2 3.8 .1 1.3 .9 2.6-.6 7-3.8 4.4-3.1 .6 .7 -.9 1.2 .8 1.2 .6 2.9 1.2 1.6 -.1 1.3 3.1 2.7 4.3-1.9 3 1 4.4-2 -2.6 8.4 -.9 1.4 1.9-1.6 2.7-6.3 2.3-.9 3.1-3.6 1.2 0 1.5 1.4 .1-1 1.1-.4 -1.1-.5 -.3-1.2 .8-1 -.5-.9 1.6-1.1 -.2-.9 2.7-2.6 1.2 .6 1.7-1.1 1.6 .6 1-.5 1 .9 .3-1.1 1.8 0 1.6 1.1 3.4 .4 4.1 2.8 2.2 0 .1 .8 1.8 0 4.3 2.7 2 .2 1.3 3.9 1.6-2.3 1.1-.4 3.8 3 -.6 .7 1.4-.6 1.2 3.3 -1.4 1.9 -1 .4 .6 .6 2.8-1.6 .6 2.1 -1.5 .4 -2.2 7.9 1 0 2-2.1 1.5-4.3 .8-.7 1.4 .3 -1 3.4 2.8-2.4 2.2-.7 2.9 0 .2-1 .7-.4 4.7 1.1 7.3 3.7 2.7 .2 1.3-.6 2.5 1.5 3.4 .8 9.1-1.2 5.4 .9 10 6 3.4 3 2.3 .8 4.3 5.6 4.4 4.2 3.4 1.5 1.3 2.2 3.3 .7 2.9 1.6 6.4-.2 4.6 1.1 1.5 1.4 1.6 3.5 1.2 6.8 1.1 2.3 1.4 9.8 -1 5 .4 2.4 -1.6 4.7 -2.3 5.5 -4.9 6.4 -1.9 1.6 -1.3-.2 .4 1 -.4 .7 -3.8 3.9 -1.9 2.8 -2.6 1 -3.3 2.3 -1.7 2.4 -1 .1 0 1.3 -1.5 2 0-1.2 -1.3 1.3 .2 1.1 -3.2 6.4 -6.2 7.8 -1.8 1.2 -1-.2 -.1-2.1 -1.3-1.3 -2.1 1.5 .6 .6 -.7 3.2 -2.1 2.3 -.8 2.4 .9-.1 -.5 4.4 .2 1.2 .5-1 -1.4 7 1 12.9 -4.1 14.2 0 5.1 -1.3 2.1 -2.2 1.4 -1.8 2.8 -1.2 4.1 -.1 6.9 -1.1 3.1 -2.3 1.7 -4.6 8.7 -2.1 2.2 -2.1 1.2 -1.9 3.5 -1.1 2.8 .1 5.3 -7.2 3 -3 2.8 -.2 2.8 -.6 1.1 -9.1-.2 -1.1-.7 .2-1.5 -.9-.5 -.9 .7 .1 2.1 -6.8 1 -.7-.6 3-.3 -1.8-1.2 -2.9 1 -4.9 .3 -.4 1.6 1 .7 -1 .7 -2.9 .4 -2.7 2 -1.1 .2 -1.4 2.1 -2-.5 -3 .2 -9.1 4.5 -2.7 2.7 -8.6 5.6 .8 .3 -.2 1.1 -2.8 2.6 .2-1.2 -2.1-.4 -.3 1.4 -1.3 .4 -1.7-.8 .4 1.3 1.8 .3 1 .9 -1.5 2.3 -1.2 .2 .9 1 -.5 2.6 -1 .5 .5 3.1 -.3 2 1 5.2 -.9 3.9 0 5.5 -1.8 3.8 -.1 1.4 -4.6 3.1 -4.6 5.1 -2.9 4.6 -2.6 6.6 -6 8.7 -2.2 2.4 -6.1 4.3 -2.2 2.3 -.2-3 1.6 .4 5.8-4.1 .9-1.4 .2-2.4 1.7-.2 .4-2 2.4-2.1 -.2-2.9 .9 .3 .7-1.5 -.9-.8 -2.7 1.4 -.9-.1 -.1-1.1 -1.3-.6 -1.1-1.8 .1 2.2 1.1 1.3 -1.2 2.3 0 1.7 -.7-.8 -.2 1.8 -.8 .7 0 1.5 -4.4 3 -2.5 5.8 .6 2.9 -2.1 2.9 -2.9 7.3 -6.5 6.4 -1.5-.9 0-5.1 .4-1.1 3.3-3.5 -4.4-3.5 -1.9-3.8 -3.9-2 -2.9-3.2 -3.4-1.6 -1.3-1.2 -2-.5 -2.9-3.7 -.9 .2 -2.1 1.9 -1.2 .1 0-2.6 -1.7-2.2 -6.3-5.4 -2.7 .5 -.6 1.3 -3.4 0 -.6-.8 1.9-1.6 1.6-2.7 4.2-4 5-7.3 3-3.1 .1-.8 2 .1 -.5-1.9 2.4-1.2 2.2-2.1 1.4-.3 .3-.8 1.1-.5 1.1-2.1 4.9-1.4 1.2-1.4 3.5-1.8 1.1-2.6 -.2-2.3 .7-4 -2.2-6.6 -2.2-1.3 -3.2 .9 -1.7-.5 0-1.5 1.7-3.4 1.5-8.7 -.4-1.9 .7-.8 -3.8-2.5 -4.5 2 -2.8-.1 -1.8-4.9 .3-1.2 -1.5-6.4 .1-2 -2.1-3.4 -3.4-.2 -1.7-1.1 -.4-.9 -1.3 .1 -.5 .9 -2 .9 -1.6 .1 -3-.8 -3.3-.1 -1.6-.8 -.9 .4 -1.4-.3 -.3-1.1 .6-3.3 -.4-2.2 1.1-5.3 -1.9-5.7 -1.7-3.1 3-2.1 -2.8-2.4 3.1-7.2 .9-.4 -.2-3.4 1.5-4.8 .7-.5 -3.1-7.1 -2.1-.6 -3.7-2.4 -1.5-6.2 1.3-2.3 0-2.2 -1.6 .5 -17.3-.3 -.9-8.4 -3.1-3.6 2.6-.6 -.4-5.1 -1.8-3.7 -.2-.9 .7-1.8 -1.1-2.4 -6-3.1 -7.5 .6 -3.2-2.9 -.3-.9 -2.5-.2 -4.3-1.4 -2.1-1.5 -1.2-1.9 -1.9 .5 -4.7-2.3 -2.5 .6 -5.1-.8 -1.1-2 -5.1-2.7 -1.1-2.5 -.8 .3 -2.6-6.2 .5-3.2 -1.4-4.1 1.4-3.9 -.5-3.8 -.7-.9 -2.5 1.2 -.7-.4 -2.3 .2 -6.8 1.6 -5.4 4.2 -3.2 1.4 -3 3.4 -3.7 .4 -1.9 2.5 -3.6 2.1 -1.1 .2 -.6-.8 -4.7-.7 -7.7 .1 -3.9 1.7 -2-1.1 -1.1 .7 -.7-12.9 .7-1.3 -.4-.9 .5-2 -7 6.1 -9.4 1 -2.1-4.7 -5.2-1.3 -4.1 .3 2.3-3.3 -.2-1.4 -3.6-3.5 -.7-1.9 -2.1-1.3 -1.1-2.9 -1.5-1.8 .6-.8 -2.9-2.5 .1-1.8 2.5-1.4 -1.1-2.4 1.1-2.7 1.9-1.9 3.4-1.8 .4-1.4 -1-4 2.2-4.4 .7-5.7 2-.7 3.6-3.2 5.2-3.4 9.2-2.1 1.7-2 4.2-.5 1.8 1.6 2.9-.2 5.1-34.3 -2.3-4.6 .1-1.8 -4.7-3.7 -.2-8.3 2.6-.4 3.6-1.5 .8 .7 2 .3 .4-1.9 -1-2.3 -1.1-.5 -.8 .4 -3.9-.3 -.5-6.8 2.8-.8 2.8 .5 11.6-.5 .2-2.5 .9 0 1.1 1.7 1 .4 1.3-.5 2.2-2.7 2.2-.9 3.4 5.3 0 4.3zM321.1 70.1l4.4-.7 8.3 1.3 .7 .9 -2.1 5.8 -2.9 3.5 .4 1.1 -1.4 1.6 -1.1 .4 -1.5-1.1 -.3 1.5 -1.5 .4 -1.8-.9 -.9 2.1 -1.7 .5 -2.8-.5 -4.7 .9 -1.7-1.1 -1.7-4.9 .4-1.2 1.4 .2 0-.8 -1.2 0 -.8-.7 -.1-1.1 .1-2.3 1.5-4.5 2-1.2 2.3-.4zM372.5 317.3l-1.9 .7 .5-1zM327.3 350.8l-.7-1.2 1.2-1.3 .1 1.6zM360.9 324.9l-1.5 .4 1.2-2.2 .6 1.1zM376 100.1l-1.1 1 .2-2 .9-1.3zM433.3 211.7l.9-2.3 .7 1.1zM431.4 215.7l-.7 .5 -.5-.8 1.2-.5zM372 82.6l-.7 .5 -.3-1.1 1 .1zM319.9 64.8l-1.1 2.8 -.8 .3 -4-.6 -.7-1.1 .8-1 4.3-.8zM313.9 46.9l-1.1 .5 -1.2-1.5 .2-1 1.6-.1zM310 69l-3 2.1 -.9-.7 .2-1.7 2.5-.7 1 .2zM323 68.9l-2.8 .3 -1.3-.5 1.3-1.2 2.2-.7 1.1 .3 .2 1.2zM312.5 66.1l-.2 1.6 -2-.7 .2-1.6 1.7-1.3 .3-2.4 .8-.3 .2 3.5zM315.4 63.4l-1.2 .4 -.1-1.7 1.7-.9 .9 .1 0 .8zM297.3 82.9l-1.2 .2 1.5-2.7 1.3-1.2 .1-2.5 1.4-2.2 1.3-.9 1.8-.2 1 1.3 -1.2 3.8 -3.9 3.4zM327.8 365.3l-.7 .5 .3-2.5 1.2-1.9 0 1.8z";
/** Neighbouring countries around Brazil */
const BR_NEIGHBORS =
  "M82 -30l3 4 6-3 108-1 -2 5 -5 2 3 2 13-3 3 4 -9 8 1 3 3 1 -1 2 -8 3 0 5 -3 3 8 11 -10 7 -12 3 -1 3 -2 1 -3-3 -17-3 6 6 3 11 7 2 0 2 -23 17 -1-3 -7 3 -7-5 -4-13 -5-4 4-6 -5-14 4-16 -21 1 -7-8 -20-1 -5-4 1-9 -4-9 -6 0 1-3zM281 428l-7 10 -7 3 -7-2 -4 1 -9-4 -6 0 -6-8 3-8 -1-10 4-19 8 0 7 8 4-1 17 12 6 7 -3 5zM272 10l-3 6 5 15 -4 10 -16 0 -3 2 2 5 -8-2 -7-14 -3 0 -5-7 2-9 7-4 -1-1 4-7 11 2 3-2 14 1 4 2zM103 117l-8 0 -11 4 -11 7 -3 11 1 3 -6 5 0 5 -2 2 11 16 -2 5 8 1 3 5 3 0 6-1 8-6 -1 17 10-1 12 16 -3 5 2 12 -5 8 2 4 -2 5 3 6 4 1 -8 10 2 3 -3 3 0 4 -4 3 -23-16 -29-12 -9-8 -4-5 0-8 -11-14 -2-6 -4-2 -16-33 -13-16 -11-7 2-3 -4-10 0-4 9-12 2 6 -3 1 0 4 9 1 3 5 3 0 4-6 3-12 1 1 3-5 13-6 10-11 3-8 1 0 0-4 -4-4 5-2 7 4 3 5 6 4 8 12 21-3 10 4 -7 13 5 0zM232 284l4 9 -1 12 11 1 5-1 5 2 2 4 3 13 7-1 4 2 -4 27 -10 9 -4-1 -3 3 -20-2 8-22 -22-12 -12-4 -17-15 3-18 5-10 27-5 9 6zM-30 -26l4 4 -1 1 4 1 0-2 5 3 19-9 11 1 12 8 -1 2 3 5 -4 5 -2-1 -2 5 -5-9 3-3 4 2 -3-4 -4 2 -2-4 -8-3 -11 10 4 7 -9 3 -2-7 -3 3 -5-6 -7 0zM-21 -2l-2-2 1-2zM201 13l-7-8 3-8 9-5 -4-1 0-3 9-8 -2-3 9 5 7 7 -1 10 2-4 5 0 8 7 0 10 -2 2 -5 1 -2 10 4 6 4 1 1 5 8 10 -7-1 -18 9 -4-2 -6-5 -3-9 5-13 -2-4 -3-2 -1-7zM267 43l4-4 3-9 -4-6 -1-9 5-8 2-1 10 4 9 7 1 4 1-3 2 5 -12 20 -11 0 -3 2zM46 75l-4 0 4 5 0 4 -1 0 -2 7 -11 12 -12 5 -4 6 -1-1 -3 13 -4 5 -3 0 -3-5 -6-2 -3 2 1-2 -1-3 3-1 -1-5 5-10 -1-4 -2 4 0-2 -3 3 -7-4 2-2 -2-10 6-6 -2-2 5-7 -1-7 12-5 1-3 12 7 5 4 13 0zM-4 110l-2 0 1-2 2-2zM69 -30l-2 4 6 0 4 10 -1 8 4 3 21 1 7 9 18-2 3 1 -3 8 -1 10 5 12 -5 5 6 5 4 12 -2 1 0-4 -4-6 -6 4 -1-2 -1 3 -17 1 0 7 5 0 2 3 -10 2 0 8 5 4 3 6 -5 34 -4-4 -5 0 7-12 -3-2 -6-3 -4 1 -4-1 -7 2 -9-1 -1-5 -5-5 -6-3 -4-6 -18-8 -2 2 -9-1 -1-3 -17-10 3-2 2 1 0-8 5-1 4-4 7-12 -3 0 -2-3 2-4 -2-10 2-2 0-9 -5-10 1-2 4-1 2-3 -2-7 6 7 -1-6 11-10zM108 470l5-20 2-15 -1-6 2-5 -6-20 2-12 -3-7 4-15 1-26 -1-17 -2-3 3-22 -6-31 4-3 1-4 3-4 5 6 2 10 4 4 -1 12 6 9 5 15 9 2 -2 10 -11 8 2 16 -1 4 3 5 -5 4 -8 22 2 10 -2 2 -2 13 3 3 3 13 3 1 1 10 -4 12 2 9 -5 5 1 5zM116 260l-2-3 7-9 -5-7 1-5 -2-4 5-8 -2-13 2-5 -10-16 12 0 19-13 12-3 1 16 5 8 6 5 14 2 14 9 7-1 6 3 3 14 -3 0 4 4 0 7 19 2 0 10 6 3 4 7 -6 15 2 4 -3 2 0-3 -9-6 -27 5 -5 10 -3 17 -12-1 -4 8 -3-6 -11 0 -6-3 -8 11 -6 1 -6-17 -5-8 -1-8 2-4 -5-4zM126 470l-1-6 5-4 -2-9 4-11 -1-11 -3-1 -6-18 2-11 2-2 -2-9 8-23 5-5 -3-3 1-4 -2-7 1-4 -2-4 11-9 3-11 -2-2 8-11 6 3 11 0 3 6 3-8 11-1 11 12 10 7 10 3 20 10 3 4 -10 18 15 3 13-1 9-8 2-11 6 0 3 6 -2 10 -18 12 -19 24 -2 26 -3 8 1 8 11 8 0 10 5 2 0 6 -5 8z";

/** Japan, main landmass first */
const JP_LAND =
  "M394.2 96.6l3.4-.8 -.5 6.3 .7 7.6 .6 2.2 3 2.7 2.5 3.6 2.5 6.7 1 3.4 .1 7.4 -.9 6.5 -.9 .4 -1.5 2 -.8 .1 -2 4.8 -1 7.4 -5.7 1.5 -2.2 4 -.4 4 2.1 9.8 -.3 7.2 -.5 2.3 -2.7 3.3 -.9 2.3 -1.6 4.8 -.7 5.5 .9 3.5 2.4 4.3 2 2.4 -3.8 1.4 -3 3.2 -.6 2.4 .1 2.5 -1 1.8 -4.9 3.1 -2.2 2.9 -1.3-.3 -.8-.9 .7-1.1 -.3-5.8 1.3-1 .5-1.6 2.3-2.5 .2-.9 -1.8-1.6 -2.6 .2 -.7 1 -.3 2.4 -1.9 1.8 .3 1.8 1.3 1.3 -1.1 2.2 -3.4-3 -3.7 .5 -2 2.5 -.6 6.5 -1.7 2.9 -1.4 1.4 -1 .2 -1.3-1.6 .6-5.6 1.6-1.1 -1.4-1.4 -1.6-.6 -2.4 .8 -1.1 2.1 -2.7 2.8 -2.6 5.2 -3.5-.9 -7.3-.5 -8.1 1.6 .2-.8 3.6-1.6 -.2-1.4 -4.1 .1 -1.2-1.4 -.3 2.3 -1.2-.3 .3-1.4 -.5-3.6 .7-1.1 -.7-.5 -.9 .2 -1.9 1.3 -2.7 6.2 1.4 1.8 4.4 3.2 -.5 2.3 -5.2 1.3 -3.6 1.6 -7.2 12.4 -3.8 1.4 -4.1-1.4 -1.7-3.5 -2.8-3.6 -.7-2.3 .2-3.5 -.6-2.2 3.6-2.5 1.8-2.7 .1-1.4 -1-.8 -5.3 .4 -5-2.9 -2.5-.2 -5.7 1 -4.8 3.6 -1.6 .6 -5.1 .4 -7.4 3 -2-.7 -6.2 1.4 -3.9-2.4 -1.8 .5 -1.4 1.9 -2 7.8 -6.2-4.6 -4.9 .3 -4.1 1.2 -2.7-1.7 -2.6 .7 -.1-5.8 2.1-2.6 5.9 0 4.5-3.8 4.3-2 7.1-5.7 6.3-5.4 1.4-2.2 3.8-1.7 3.9-.8 1.8 .2 1.7 2 4.1-.9 4 .5 5.9-.7 4.1-1.6 7-.5 4.9-1.6 1.5 .5 -.6 2.7 1.5 1.4 5.9 .6 1.9-.9 3.7-2.7 1.3-1.7 -1.1-2.2 -.2-2.3 1-2.6 1.5-2.2 3.4-2.7 5.6-7.7 .9-4.3 -.4-5 2-3.7 7.7-2.8 .3 1.7 -3 3.1 -3.7 2.3 -.4 1.1 1.5 1.8 .3 3.9 1.8 1.3 2 .4 .8 0 3-3.5 13.6-6 5-5.2 4-7.6 5.8-3.5 1.8-1.8 2.4-8.3 4.3-7.8 1.6-7.1 1.8-3.8 .4-4.4 -1.2-4.6 -.8-.6 -2.2 .2 -1.1-.8 .2-.8 1.9-.6 1.4-3.1 .6-3.7 -1.5-5.7 1.5-2.8 2.6-.9 1.2-1.5 .9-3.3 -.5-3.1 .4-.9 .6-.6 3.7 .6 1 6.1 1.1 1.3 .8-.1 1.1-2 .9-.3 2.9 1.1 1-.9 1.1-3.6 -.4-2.2 -.8-.7 -6 2.4 0-2.4 .7-3.5 1.1-1.7 2.6 .9zM269.1 201.3l-.8 .8 -1.4-.4 -.7-1.1 .3-1.2 1.5-.9 1.3 2zM350.6 169.9l-1.5 .1 1.2-3.1 -1.3-.5 .1-1.7 3.4-4.4 .7 .7 -.9 3.7 2 .2 -1.3 3.3zM293.7 241.3l-1.9 1.7 -1.6-.2 -1-1.7 2.9-3.6 2.2-1.4 -1 3zM215.7 319.4l-2.1 .3 -1-.5 -.9-2.6 2-1.4 2.5 1.7zM221.8 317.1l-1.6 .2 .1-1.2 1.3-2.6 .3-1.9 2.2-3.1 .3 .8 -.6 3 -1.3 2.2zM209.1 278.8l-1.5 .6 -.6-1.1 1-.9 -.6-1.1 1-2.5 -.1-1.1 2.7-.2 .3 4.2zM198.4 239.1l-1.1 .8 -.4-1.3 .8-3.6 2 .9zM200.7 234.6l-.5 1 -1.5-1.5 1.3-3 0-1.2 2.3-1.9 .4 .7 -.2 2.3 -1.9 2.3zM185.8 265.4l2.3 .4 1.3 2.7 -1.2 0 -1.4 1.1 -.9-.5 -.7-1.2zM214.5 275.2l-1.5 0 -.9-.9 2.3-1.2 1.6 .3zM388.6 16.1l-.5 1.4 -1.1-4 1.3 .3zM392 20.3l-1 .2 -1.2-.8 -.2-1 .8-.9 1.7 1.3zM367.2 82.9l-1.1-1.5 .3-.9 1.9-.7zM284 237l-1.7 1.2 -1-1.5 2.4-.7zM369.7 232.8l-.2 .9 -.9-.2 -.4-1.7 1-.1zM192.8 264.9l-.8-1.7 1.9-4.2 .4 3.9zM200.5 257.8l-1.2 .8 -.9-.1 1.8-3 1.3-.4zM206.6 247.5l-1.3 .8 -.8-.8 .5-1.8 1.3 .2zM253.9 243.2l-.5 .8 -1.5-.3 1.1-1.5zM248.5 246.4l.7 .8 2-.2 -1.2 1.5 -2.6-.7 0-1.1zM201.9 289.9l-.1-1.2 1.5-1.3 .1 .9zM422.4 396.1l-1.5-2.1 .9 .2 .9 1.2zM429.8 38.7l4.1 0 5.8 2.7 3.5 .2 2.1-1.3 6.3-7.7 .3 2.1 -2.6 7.6 -.2 2.1 .8 2.1 3.6 7.1 2.2 .2 2.5-2.4 2.4-.2 -2.9 2.2 -1.1 2.1 -2.8 .6 -6 4.1 -4.3 1.4 -6.4-.1 -3.3 2.2 -5.4 6.1 -2.8 5.8 -.5 4.9 -1.1 1.8 -1.9-.3 -9.3-4.3 -10.3-6.1 -6.6 1 -6.2 4.4 -4.3-4.2 -3.4 0 -1.9 2.6 -.2 2.9 3.1 3.2 3.1 .2 6.6 6.1 -2.3 1.5 -5.2-1.4 -2.5 3 -1.5 3.1 -1.7 1.4 -1.9 .7 -.9-.2 -1.5-2.9 1.6-6.9 -.9-3.1 -2.5-2.4 -1-1.8 .2-6.2 .5-1.4 3.3-1.7 4.6-4.7 .7-2 -1.4-2.3 -.1-2.8 1.3-.7 4.5 2.3 5.3 .5 2.4-.4 1.1-1.7 .4-2.1 -.4-5.3 3.3-7.8 0-5 1.2-4.5 .1-4.8 -1.1-4.5 -2.2-4.3 1-5 2.2-.9 1.5-1.5 7.3 7.5 4.5 6 2.8 2.8 6.2 5.2zM229.6 252.2l3.2 .9 3.8-1.5 1.8 1.2 .1 2 -3.2 4.5 6.1 .8 -.9 2.7 1.6 1.5 -.7 1.5 1.5 1.2 -.1 .8 -5 5.6 -1.4 2.5 -4.1 11.6 -.2 4.3 -2.5 5.3 -4.5-1 -.8 1.2 1 2.5 -3.6 2.7 -3.9 1.8 0-1 2.2-4.1 -1.1-6.4 1.3-.4 .1-2.1 -2.1-.4 -1.9 3 -.5 3.3 1.6 2.8 -1.1 1.8 -6.6-2.8 -.7-2.5 2-.4 .8-1 .5-2.2 -2.1-3.6 .5-1.6 .1-5 2.2-.8 1.4-1.5 4.8-7.8 -2.4-1 1.3-1.5 -.2-2 -1.6-2.5 -.9-3 -2.3-1.9 -2 1.3 .7 2 -.2 3.3 2.6 .1 .4 2 -.4 1.1 -1.7 .4 -1.5-1.6 -1.6-.6 -5.2 3.7 1.2-3.1 -2.1-3.2 -.3-2.5 .4-1.3 1.6 1.7 .8 1.9 1.1 1 1.6 .1 -1.4-3.6 -5-4.8 .6-2.1 .9-.4 3.1 1.2 .3-1.1 -.5-1.3 4.3-1.4 1.1-1.1 4.1-.8 2.3-4 4-1.5 2 .3 1.9 1.1 1.5 4.2zM284 241.6l2.3 1 2.4-.2 -.1 3.7 .9 2.4 -.4 1.6 1.1 .6 -6.3 4.2 -2.4 3.3 -1.2 3.9 -3.6-4.2 -1.8-1 -3.7-.5 -6 2.8 -2.7 5.5 -2.3 1.9 -.8 2.9 -1.9 1.7 -1.1-.1 -2.8-.3 1.3-2.8 -3.7-.5 .1-1.8 -1-1.1 1.7-3.9 -.1-.8 -1.8-.9 .3-2 -2.2 .1 -4.3 1.4 10.6-6.6 2.8-6 2.6-2 .9 .2 2.3 3.4 3.7-.9 2.1 .2 1.8-.8 1.2-2.3 -.6-2.3 1.7 .2 4.2-2.1 2.1-.1zM91.2 424.1l-1.4 3.1 -1.9-.1 -.7-1.9 .8-.6 1.6 .5 1.9-2.4zM83.3 427.9l-3.9-.7 1.5-1 .1-.9 3.3 1.1zM113 422.2l-1.7 .4 -1.6-.5 .5-2.8 .8 1.4zM168 389.2l-1.8 .7 -.8 1.1 -1.6 .2 -1.7 1.4 -1.6 .2 -.1 1.2 .6 1.1 -1 .1 -1.2 1.2 .2 1.7 -1.5 1.4 -1.5-.1 .3-2.1 1.5-2.1 .2-2.6 1.2-.1 3-2.7 -.9-.8 .1-.9 1.8 .1 .6 .7 1.3-.3 2.4-2.4 .9-1.7 1.2 1.6 -.5 1.8zM183.1 368.7l-.8 .3 -.9-.6 -.2-2.3 .6-1.1 .8-.2 .9 3zM192 359.5l-1.7 1.6 -3.4-2.9 1-.1 2-1.8 3.4-.5 3.4-2.2 .3 1.8 -1.3 .3 -3.5 2.5zM189.5 361.4l-1.6 0 -.6-1.9 1.2 .4zM376.9 266.6l-1.1-.4 0-1 1.6 .6z";
/** Neighbouring countries around Japan */
const JP_NEIGHBORS =
  "M26 453l-5 14 -2-1 -9-25 2-11 21-25 11-3 5 7 -15 34zM-16 406l0 2 -3 0zM163 160l8-9 15 1 6-5 13 28 1 11 -2 14 2 2 -7 15 -12 1 -2 4 -6-3 -5 1 -2 5 -1-3 -2 0 0 4 -3 3 -2-2 2-4 -12 8 -5-8 5-2 -3-8 5-7 -1-2 5-5 -3-6 1-11 -5-2 5-4 6 4 2-1 -3-7zM191 225l-2 1 -2-2 3-4zM179 223l0 2 -3-2 1-2zM148 229l-2-1 4-2zM161 161l-1 3 -1-1 -1-3zM148 221l-3-3 2 0zM147 252l-2-1 3-3 9 0 -1 3zM360 -30l-20 37 -26 29 -12 17 -17 11 -13 5 -6-4 -6 0 0-9 -7 4 3-4 -3 0 -11 13 -6-2 1 3 -2 4 -1-1 -3-7 9-3 5-11 -2-29 7-2 6-6 16 6 2-1 2-8 3-2 7-14 7-21 6-5zM409 -30l8 14 4 1 2 7 -1 6 -3-8 -10-3 -3 3 -4 14 -4-11 2-14 -1-8zM511 -1l-2 2 1-6 8-8 3-1zM496 8l-9 8 -3 0 -10 13 4-10 8-8 0-3 3 2 3-1 7-5 0 3zM464 28l5 1 0 1 -9 6 -4 6 0 4 -2-3zM192 146l-5 6 -17 0 -7 8 -4-2 -5 2 -5-5 -5 4 -7-5 3-2 -6-2 6-8 8-2 -6-3 5-10 0-4 -8-6 -3 2 -3-5 1-5 8-6 18-7 16-16 4 5 15 5 2-4 -3-8 14 0 6-7 6-1 3-10 4 0 7 14 -9 5 -7 9 -1 15 -6 2 -14 11 -15 6 -2 8 -2 1zM39 -30l-10 6 -16-2 -16 9 -8-4 -7-7 -4-1zM-26 -30l-4 3 0-3zM66 277l-5-3 -5-5 4 1zM69 309l-4-2 -1-3 6 3zM12 392l-2-1 2-3zM46 344l-2-2 1-1zM-30 -27l8-3 19 13 7-3 9-6 16 2 10-6 260 0 -7 5 -6 22 -7 13 -3 2 -2 8 -3 1 -16-6 -4 6 -8 2 3 16 -1 15 -5 9 -8 2 2 4 -4-1 -3-8 -4 0 -3 10 -6 1 -6 6 -14 1 3 8 -3 4 -14-5 -3-5 -5 2 -2 5 -10 9 -18 7 -11 9 -2 1 -7-1 -14 3 -23 12 -4 1 -2-4 10-2 2-4 -6-2 -1-4 4-1 1-4 5-2 8-9 -4-11 -4 2 -6-2 -13 11 -19 6 -7 10 -13 1 -3-4 -3 0 -5 6 -2 3 2 8 3 4 14 6 1 7 -4 7 5 5 7 1 11-9 8-2 12 10 5 2 2-2 4 3 4 1 -2 8 -4 3 -6-4 -15 5 -3-1 0 4 -4 1 0 4 -6 1 0-3 -2 0 -2 0 2 4 -16 11 -6 9 0 2 16 13 6 27 -2 7 7 6 1 5 6 7 0 4 -2 0 -12-6 -7-6 -8 2 11 1 0 4 14 13 2 5 0 3 -8 2 -12 7 -6-2 -4 1 4 1 2 4 11-2 7 8 6 3 -11 6 8-1 0 2 -2 8 -4-3 -4 1 4 3 -3 2 1 3 -3 2 2 8 -9-2 -4 5 -2 0 -6 11 -7 6 -4 8 -4 0 -1-5 -3 2 3 8 -9 5 -5-2 2 3 6 1 -2 12 -8-3 2 5 -7 1 0 3 -5 2 -2 4 -10-2 -4 2 2 6 -5 4 -1-1z";

const MAPS: Record<Region, MapData> = {
  // Germany, Switzerland, Austria – the band runs on the outer DACH border only, without the borders between them
  dach: { land: DACH_LAND, neighbors: DACH_NEIGHBORS, perimeter: DACH_PERIMETER, fade: [260, 220, 220] },
  us: { land: [US_LAND], neighbors: [US_NEIGHBORS], perimeter: firstShape(US_LAND), fade: [270, 220, 240] },
  cn: { land: [CN_LAND], neighbors: [CN_NEIGHBORS], perimeter: firstShape(CN_LAND), fade: [270, 220, 240] },
  in: { land: [IN_LAND], neighbors: [IN_NEIGHBORS], perimeter: firstShape(IN_LAND), fade: [270, 220, 240] },
  br: { land: [BR_LAND], neighbors: [BR_NEIGHBORS], perimeter: firstShape(BR_LAND), fade: [270, 220, 240] },
  jp: { land: [JP_LAND], neighbors: [JP_NEIGHBORS], perimeter: firstShape(JP_LAND), fade: [270, 220, 240] },
};

if (!customElements.get("tc-region-dach")) customElements.define("tc-region-dach", TcRegionDach);

declare global {
  interface HTMLElementTagNameMap {
    "tc-region-dach": TcRegionDach;
  }
}
