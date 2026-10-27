import { html, nothing, svg, type PropertyValues, type SVGTemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-layer-stack> – the Lit port of illustrations/layer-stack.tsx: an isometric stack of five layers next to a list of
 * five entries. The chosen entry lifts its layer out of the stack in blue, with a soft glow underneath.
 * It steps through the entries on its own – `rounds` times round (default 2), then it rests – and pauses while hovered
 * or focused, off screen and with reduced motion. Click or focus an entry to pick it (arrow keys, Home and End).
 *
 *   <tc-layer-stack .items=${[{ title: "Triggered by events", hint: "Webhooks", icon: "bolt" }]}></tc-layer-stack>
 *
 * Every change of `index` – picked or stepped to on its own – fires a cancelable tc-index-change first. To control the
 * index, call preventDefault() and set `index` yourself; `rounds = 0` stops the automatic steps.
 */

export type LayerIcon = "bolt" | "database" | "plug" | "spark" | "pulse";

export type LayerStackItem = {
  /** Main line of the entry */
  title: string;
  /** Short muted hint on the right */
  hint?: string;
  /** Icon drawn onto the layer: one of the built-in names */
  icon?: LayerIcon;
};

/** Detail of tc-index-change */
export type LayerStackIndexChange = {
  index: number;
  /** true when the user picked it, false for an automatic step */
  user: boolean;
};

const defaultItems: LayerStackItem[] = [
  { title: "Triggered by events", hint: "Webhooks", icon: "bolt" },
  { title: "Grounded in your data", hint: "Context", icon: "database" },
  { title: "Connected to your apps", hint: "APIs", icon: "plug" },
  { title: "Works with any model", hint: "Routing", icon: "spark" },
  { title: "Traced at every step", hint: "Logs", icon: "pulse" },
];

/* Layer geometry on the 600 × 400 grid */
const SIZE = 104; // side of a layer before the isometric projection (rhombus 208 × 104)
const STEP = 26; // vertical distance between resting layers
const GAP = 34; // the chosen layer lifts off the ones below it
const ABOVE = 24; // and the layers above it lift a little further, so it shows
const THICK = 9; // layer thickness
const CX = 168; // stack centre
const TOP = 109; // y of the top layer's back corner when nothing is lifted

/* Icons, drawn on a 24 grid and laid onto the layer */
const icons: Record<LayerIcon, SVGTemplateResult> = {
  bolt: svg`<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z"></path>`,
  database: svg`<ellipse cx="12" cy="6" rx="7" ry="3"></ellipse><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"></path>`,
  plug: svg`<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0V8ZM12 16.5V21"></path>`,
  spark: svg`<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7ZM18.5 15.5c.2 1.5.8 2.1 2.3 2.3-1.5.2-2.1.8-2.3 2.3-.2-1.5-.8-2.1-2.3-2.3 1.5-.2 2.1-.8 2.3-2.3Z"></path>`,
  pulse: svg`<path d="M3 12h4l2.5-6 5 12 2.5-6h4"></path>`,
};

/** Whether the user asked for reduced motion */
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

let serial = 0;

/**
 * An isometric stack of layers beside a list; the chosen entry lifts its layer. Steps through them on its own.
 * @tag tc-layer-stack
 * @fires tc-index-change - Cancelable, before the chosen entry changes; detail: LayerStackIndexChange ({ index, user })
 */
export class TcLayerStack extends TcElement {
  static override ui = "lyr";
  static override looks = false;

  /** Up to five entries, top layer first */
  @property({ attribute: false }) accessor items: LayerStackItem[] = defaultItems;
  /** The chosen entry */
  @property({ type: Number }) accessor index = 0;
  /** Time per entry while it plays on its own, in ms */
  @property({ type: Number }) accessor interval = 2600;
  /** How many times it steps through all entries on its own before it rests (default 2; Infinity keeps going, 0 never steps) */
  @property({ type: Number }) accessor rounds = 2;

  /** @internal Hovered or focused */
  @state() accessor paused = false;

  private readonly svgId = `ui-lyr${++serial}`;
  private readonly screen = new OnScreenController(this);
  /** Someone picked an entry: no more automatic steps */
  private touched = false;
  /** Automatic steps so far: it rests after `rounds` times through the list (WCAG 2.2.2) */
  private steps = 0;
  private timer = 0;
  private timerKey = "";

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("mouseenter", this.pause);
    this.addEventListener("mouseleave", this.resume);
    this.addEventListener("focusin", this.pause);
    this.addEventListener("focusout", this.resume);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("mouseenter", this.pause);
    this.removeEventListener("mouseleave", this.resume);
    this.removeEventListener("focusin", this.pause);
    this.removeEventListener("focusout", this.resume);
    window.clearInterval(this.timer);
    this.timer = 0;
    this.timerKey = "";
  }

  private pause = () => (this.paused = true);
  private resume = () => (this.paused = false);

  private get list() {
    return this.items.slice(0, 5);
  }

  /** Asks to change the chosen entry; applied unless a listener prevents it */
  private choose(next: number, user: boolean) {
    if (Object.is(next, this.index)) return;
    if (this.emit<LayerStackIndexChange>("tc-index-change", { index: next, user }, { cancelable: true })) this.index = next;
  }

  private pick(i: number) {
    this.touched = true;
    this.choose(i, true);
  }

  protected override updated(_changed: PropertyValues<this>) {
    // Step through the entries on its own until someone interacts – on screen and without reduced motion. Like the
    // React effect, the timer restarts only when one of these changes
    const n = this.list.length;
    const key = `${this.paused}|${this.screen.onScreen}|${this.interval}|${this.rounds}|${n}`;
    if (key === this.timerKey) return;
    this.timerKey = key;
    window.clearInterval(this.timer);
    this.timer = 0;
    const limit = this.rounds * n;
    if (this.paused || !this.screen.onScreen || this.touched || n < 2 || this.steps >= limit || reducedMotion()) return;
    const timer = window.setInterval(() => {
      if (this.steps >= limit) return window.clearInterval(timer);
      this.steps++;
      this.choose((Math.min(this.index, n - 1) + 1) % n, false);
    }, this.interval);
    this.timer = timer;
  }

  private onKey(e: KeyboardEvent, i: number) {
    const n = this.list.length;
    const moves: Record<string, number> = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: n - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = (moves[e.key] + n) % n;
    this.pick(next);
    this.querySelectorAll<HTMLButtonElement>(".ui-lyr-row")[next]?.focus();
  }

  protected override render() {
    const id = this.svgId;
    const list = this.list;
    // Fewer items than the chosen entry: show the last one
    const active = Math.max(0, Math.min(this.index, list.length - 1));
    // Resting y of each layer: gaps open below and above the chosen one. The bottom layer has nothing below it, so when
    // it's chosen it stays put and only the layers above it rise
    const last = list.length - 1;
    const yOf = (i: number) => TOP + i * STEP - (i < active ? GAP + ABOVE : i === active && active < last ? GAP : 0);

    return html`<svg class="ui-lyr-stack" viewBox="0 0 600 400" aria-hidden="true">
        ${svg`<defs>
          <filter id=${`${id}-glow`} x="-60%" y="-120%" width="220%" height="340%">
            <feGaussianBlur stdDeviation="14"></feGaussianBlur>
          </filter>
        </defs>`}
        ${list
          .map(
            (item, i) => svg`<g class="ui-lyr-layer" ?data-active=${i === active} ?data-above=${i < active} style=${`transform: translate(${CX}px, ${yOf(i)}px);`}>
              <ellipse class="ui-lyr-glow" cx="0" cy=${SIZE / 2 + THICK + 18} rx="70" ry="24" filter=${`url(#${id}-glow)`}></ellipse>
              <g transform=${`translate(0 ${THICK}) matrix(1 0.5 -1 0.5 0 0)`}>
                <rect class="ui-lyr-side" width=${SIZE} height=${SIZE} rx="9"></rect>
                <rect class="ui-lyr-side-on" width=${SIZE} height=${SIZE} rx="9"></rect>
              </g>
              <g transform="matrix(1 0.5 -1 0.5 0 0)">
                <rect class="ui-lyr-face" width=${SIZE} height=${SIZE} rx="9"></rect>
                <rect class="ui-lyr-face-on" width=${SIZE} height=${SIZE} rx="9"></rect>
                <g class="ui-lyr-icon" transform=${`translate(${SIZE / 2 - 18} ${SIZE / 2 - 18}) scale(1.5)`}>${icons[item.icon ?? "bolt"]}</g>
              </g>
            </g>`,
          )
          .reverse()}
      </svg>
      <div class="ui-lyr-menu" role="tablist" aria-label="Layers" aria-orientation="vertical">
        <span class="ui-lyr-pill" aria-hidden="true" style=${`transform: translateY(calc(${active} * var(--tc-layer-stack-row)));`}></span>
        ${list.map(
          (item, i) => html`<button
            type="button"
            role="tab"
            aria-selected=${i === active ? "true" : "false"}
            tabindex=${i === active ? 0 : -1}
            class="ui-lyr-row"
            @click=${() => this.pick(i)}
            @keydown=${(e: KeyboardEvent) => this.onKey(e, i)}
          >
            <span class="ui-lyr-title">${item.title}</span>
            ${item.hint ? html`<span class="ui-lyr-hint">${item.hint}</span>` : nothing}
          </button>`,
        )}
      </div>`;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="lyr"] {
  /* 1 unit of the 600 × 400 layout grid */
  --tc-layer-stack-u: calc(100cqw / 600);
  --tc-layer-stack-row: calc(52 * var(--tc-layer-stack-u));
  /* The accent blue used across the library */
  --tc-layer-stack-accent: light-dark(#2f6bff, #6b95ff);
  --tc-layer-stack-accent-deep: light-dark(#2557d9, #2f6bff);
  --tc-layer-stack-tint: light-dark(#e9f0ff, #1f2c4d);
  --tc-layer-stack-glow: light-dark(rgba(47, 107, 255, 0.28), rgba(47, 107, 255, 0.3));
  --tc-layer-stack-face: light-dark(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.04));
  --tc-layer-stack-edge: light-dark(rgba(10, 10, 10, 0.11), rgba(255, 255, 255, 0.13));
  --tc-layer-stack-side: light-dark(#ececef, #26262a);
  --tc-layer-stack-face-above: light-dark(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.025));
  --tc-layer-stack-side-above: light-dark(rgba(236, 236, 239, 0.55), rgba(38, 38, 42, 0.5));
  --tc-layer-stack-panel: light-dark(#f5f5f5, #161618);
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  -webkit-font-smoothing: antialiased;
}
[data-ui="lyr"] *, [data-ui="lyr"] *::before, [data-ui="lyr"] *::after { box-sizing: border-box; }

/* ---------- Stack ---------- */

.ui-lyr-stack { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ui-lyr-layer { transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)); }
.ui-lyr-glow {
  fill: var(--tc-layer-stack-glow);
  opacity: 0;
  transition: opacity var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease);
}
.ui-lyr-layer[data-active] .ui-lyr-glow { opacity: 1; }
.ui-lyr-side-on {
  fill: var(--tc-layer-stack-accent-deep);
  opacity: 0;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-side {
  fill: var(--tc-layer-stack-side);
  stroke: var(--tc-layer-stack-edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  transition: fill var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), stroke var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-face {
  fill: var(--tc-layer-stack-face);
  stroke: var(--tc-layer-stack-edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  transition: fill var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), stroke var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-face-on {
  fill: var(--tc-layer-stack-tint);
  stroke: var(--tc-layer-stack-accent);
  opacity: 0;
  stroke-width: 1.6;
  vector-effect: non-scaling-stroke;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-icon {
  fill: none;
  stroke: var(--tc-layer-stack-accent);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
/* Layers above the chosen one turn more glassy, so its color shows through */
.ui-lyr-layer[data-above] .ui-lyr-face { fill: var(--tc-layer-stack-face-above); }
.ui-lyr-layer[data-above] .ui-lyr-side { fill: var(--tc-layer-stack-side-above); }
.ui-lyr-layer[data-active] .ui-lyr-side-on { opacity: 1; }
.ui-lyr-layer[data-active] .ui-lyr-face-on { opacity: 1; }
.ui-lyr-layer[data-active] .ui-lyr-icon { opacity: 1; transition-delay: var(--tc-duration-quick, 120ms); }

/* ---------- Menu ---------- */

.ui-lyr-menu {
  position: absolute;
  left: calc(326 * var(--tc-layer-stack-u));
  top: 50%;
  width: calc(248 * var(--tc-layer-stack-u));
  padding: calc(8 * var(--tc-layer-stack-u));
  transform: translateY(-50%);
  border-radius: calc(18 * var(--tc-layer-stack-u));
  background: var(--tc-layer-stack-panel);
}
/* White card that glides behind the chosen row */
.ui-lyr-pill {
  position: absolute;
  left: calc(8 * var(--tc-layer-stack-u));
  right: calc(8 * var(--tc-layer-stack-u));
  top: calc(8 * var(--tc-layer-stack-u));
  height: var(--tc-layer-stack-row);
  border-radius: calc(12 * var(--tc-layer-stack-u));
  background: var(--tc-surface-overlay, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: transform var(--tc-duration-slower, 420ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1));
}
.ui-lyr-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(10 * var(--tc-layer-stack-u));
  width: 100%;
  height: var(--tc-layer-stack-row);
  margin: 0;
  padding: 0 calc(14 * var(--tc-layer-stack-u));
  border: 0;
  border-radius: calc(12 * var(--tc-layer-stack-u));
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ui-lyr-row:focus-visible { outline: 2px solid var(--tc-layer-stack-accent); outline-offset: -2px; }
.ui-lyr-title {
  min-width: 0;
  overflow: hidden;
  font-size: calc(14 * var(--tc-layer-stack-u));
  font-weight: var(--tc-font-weight-medium, 500);
  line-height: 1.3;
  letter-spacing: var(--tc-tracking-snug);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  transition: color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-hint {
  flex: none;
  font-size: calc(12 * var(--tc-layer-stack-u));
  line-height: 1.3;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
/* The chosen title uses the accent text colour: the plain accent is 4.49 : 1 on the white pill (WCAG 1.4.3) */
.ui-lyr-row[aria-selected="true"] .ui-lyr-title { color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }

@media (prefers-reduced-motion: reduce) {
  .ui-lyr-layer, .ui-lyr-glow, .ui-lyr-pill, .ui-lyr-side, .ui-lyr-side-on, .ui-lyr-face, .ui-lyr-face-on, .ui-lyr-icon, .ui-lyr-title { transition: none; }
}
`;
}

if (!customElements.get("tc-layer-stack")) customElements.define("tc-layer-stack", TcLayerStack);

declare global {
  interface HTMLElementTagNameMap {
    "tc-layer-stack": TcLayerStack;
  }
}
