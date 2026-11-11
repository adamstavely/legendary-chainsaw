import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-like-burst> – a toggle for liking, saving or starring. Pressing it on fills the icon with a spring, and a small
 * ring and eight particles burst from it; pressing it off just empties the icon. An optional count beside it rolls up
 * or down by one. Nothing bursts on first render or when the page sets `pressed` itself – only a press does.
 *
 *   <tc-like-burst label="Save finding" count="12"></tc-like-burst>
 *   <tc-like-burst label="Star"><svg slot="icon" …></svg></tc-like-burst>      any icon in place of the heart
 *
 * The host is the visual control; inside it a native <button> with aria-pressed takes the keyboard, so Enter and Space
 * work as they do on any button. Its name is `label` (visible with `show-label`) and the count. A page icon
 * (slot="icon") stays where the page put it and sits over the heart's place; it's filled by turning its fill on, so
 * give outline icons a fill of none and stroke of currentColor. With reduced motion it fills without the spring or the
 * burst.
 */

/** The `tc-pressed-change` detail */
export type LikeBurstPressedChange = { pressed: boolean; count: number | undefined };

/** Burst particles: angles fixed so it looks the same every time */
const PARTICLES = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * A like or save toggle whose icon fills with a spring and a small burst.
 * @tag tc-like-burst
 * @slot icon - An icon in place of the heart
 * @fires tc-pressed-change - The press turned on or off ({ pressed, count }: LikeBurstPressedChange); cancelable – prevented, it stays as it was
 */
export class TcLikeBurst extends TcElement {
  static override ui = "lkb";
  static override looks = false;

  /** On (liked) or off */
  @property({ type: Boolean, reflect: true }) accessor pressed = false;
  /** The button's name: "Like", "Save finding" */
  @property() accessor label = "Like";
  /** Shows the label beside the icon; otherwise it's only the name */
  @property({ type: Boolean, attribute: "show-label" }) accessor showLabel = false;
  /** A count beside the icon; a press moves it by one */
  @property({ type: Number }) accessor count: number | undefined = undefined;
  /** Can't be pressed */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** The locale for writing the count */
  @property() accessor locale: string | undefined = undefined;

  /** The count rolling out, while it does */
  @state() private accessor previous: string | null = null;
  private roll: "up" | "down" | null = null;
  /** A press asked to turn it on: it bursts when `pressed` turns on, now or once a controlling page agrees */
  private intent = false;

  private format(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }

  private onClick = () => {
    if (this.disabled) return;
    const pressed = !this.pressed;
    const count = this.count === undefined ? undefined : Math.max(0, this.count + (pressed ? 1 : -1));
    this.intent = pressed;
    if (!this.emit<LikeBurstPressedChange>("tc-pressed-change", { pressed, count }, { cancelable: true })) return;
    this.pressed = pressed;
    this.count = count;
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const old = changed.get("count") as number | undefined;
    if (this.hasUpdated && changed.has("count") && old !== undefined && this.count !== undefined && old !== this.count) {
      this.previous = this.format(old);
      this.roll = this.count > old ? "up" : "down";
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!changed.has("pressed") || changed.get("pressed") === undefined) return this.rollCount();
    const burst = this.intent && this.pressed;
    this.intent = false;
    if (burst) {
      this.removeAttribute("data-burst");
      // Reading a size restarts the burst on a quick second press
      void this.offsetWidth;
      this.setAttribute("data-burst", "");
    }
    this.rollCount();
  }

  private rollCount() {
    const count = this.querySelector<HTMLElement>(".ui-lkb__count");
    if (count) {
      if (this.roll && this.previous !== null) count.setAttribute("data-roll", this.roll);
      else count.removeAttribute("data-roll");
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("animationend", this.onEnd);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("animationend", this.onEnd);
  }

  private onEnd = (e: AnimationEvent) => {
    if (e.animationName === "ui-lkb-ring") this.removeAttribute("data-burst");
    else if (e.animationName === "ui-lkb-roll-in") {
      this.roll = null;
      this.previous = null;
    }
  };

  protected override render() {
    // Lucide heart (ISC)
    const heart = svg`<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>`;
    return html`<button class="ui-lkb__button" type="button" aria-pressed=${this.pressed ? "true" : "false"} ?disabled=${this.disabled} @click=${this.onClick}>
      <span class="ui-lkb__spot" aria-hidden="true">
        <svg class="ui-lkb__heart" viewBox="0 0 24 24">${heart}</svg>
        <span class="ui-lkb__burst">
          <span class="ui-lkb__ring"></span>
          ${PARTICLES.map((a, i) => html`<span class="ui-lkb__particle ui-lkb__particle--${(i % 4) + 1}" style="--a: ${a}deg"></span>`)}
        </span>
      </span>
      <span class=${this.showLabel ? "ui-lkb__label" : "tc-sr-only"}>${this.label}</span>
      ${this.count === undefined
        ? nothing
        : html`<span class="ui-lkb__count"
            >${this.previous !== null ? html`<span class="ui-lkb__out" aria-hidden="true">${this.previous}</span>` : nothing}<span class="ui-lkb__in">${this.format(this.count)}</span></span
          >`}
    </button>`;
  }

  static override css = /* css */ `
[data-ui="lkb"] {
  --tc-like-burst-color: var(--tc-status-danger-solid);
  --tc-like-burst-idle: var(--tc-text-secondary);
  --tc-like-burst-size: 20px;
  --tc-like-burst-reach: 18px;
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}
.ui-lkb__button {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-block-size: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: transparent;
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  cursor: pointer;
}
.ui-lkb__button:hover:not(:disabled) { background: var(--tc-surface-sunken); color: var(--tc-text-primary); }
.ui-lkb__button:focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring); outline-offset: var(--tc-focus-ring-offset); }
.ui-lkb__button:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-lkb__spot { position: relative; display: inline-grid; place-items: center; inline-size: var(--tc-like-burst-size); block-size: var(--tc-like-burst-size); flex: none; }
.ui-lkb__heart, [data-ui="lkb"] > [slot="icon"] { inline-size: var(--tc-like-burst-size); block-size: var(--tc-like-burst-size); color: var(--tc-like-burst-idle); fill: transparent; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: fill var(--tc-duration-fast) var(--tc-ease-out), color var(--tc-duration-fast) var(--tc-ease-out); }
[data-ui="lkb"]:has(> [slot="icon"]) .ui-lkb__heart { visibility: hidden; }
[data-ui="lkb"] > [slot="icon"] { position: absolute; inset-block-start: 50%; inset-inline-start: var(--tc-space-2); translate: 0 -50%; pointer-events: none; }
[data-ui="lkb"][pressed] :is(.ui-lkb__heart, [slot="icon"]) { color: var(--tc-like-burst-color); fill: var(--tc-like-burst-color); }
[data-ui="lkb"][data-burst] :is(.ui-lkb__heart, [slot="icon"]) { animation: ui-lkb-fill var(--tc-duration-slowest) var(--tc-ease-spring) 1; }
@keyframes ui-lkb-fill { 0% { scale: 0.6; } 50% { scale: 1.2; } 100% { scale: 1; } }
.ui-lkb__burst { position: absolute; inset: 0; pointer-events: none; }
.ui-lkb__ring, .ui-lkb__particle { position: absolute; inset-block-start: 50%; inset-inline-start: 50%; opacity: 0; }
.ui-lkb__ring { inline-size: 100%; block-size: 100%; translate: -50% -50%; border: 2px solid var(--tc-like-burst-color); border-radius: 50%; box-sizing: border-box; }
.ui-lkb__particle { inline-size: 4px; block-size: 4px; translate: -50% -50%; border-radius: 50%; background: var(--tc-chart-1); }
.ui-lkb__particle--2 { background: var(--tc-chart-2); }
.ui-lkb__particle--3 { background: var(--tc-like-burst-color); }
.ui-lkb__particle--4 { background: var(--tc-chart-4); }
[data-ui="lkb"][data-burst] .ui-lkb__ring { animation: ui-lkb-ring var(--tc-duration-slower) var(--tc-ease-out) 1; }
[data-ui="lkb"][data-burst] .ui-lkb__particle { animation: ui-lkb-particle var(--tc-duration-slowest) var(--tc-ease-out) 1; }
@keyframes ui-lkb-ring { from { opacity: 1; scale: 0.4; } to { opacity: 0; scale: 2; border-width: 0; } }
@keyframes ui-lkb-particle {
  0% { opacity: 1; transform: rotate(var(--a)) translateX(0) scale(1); }
  100% { opacity: 0; transform: rotate(var(--a)) translateX(var(--tc-like-burst-reach)) scale(0.3); }
}
.ui-lkb__label { white-space: nowrap; }
.ui-lkb__count { display: inline-grid; overflow: hidden; font-variant-numeric: tabular-nums; }
.ui-lkb__count > * { grid-area: 1 / 1; }
.ui-lkb__count[data-roll="up"] .ui-lkb__in { animation: ui-lkb-roll-in var(--tc-duration-slow) var(--tc-ease-out) 1; --tc-lkb-from: 100%; }
.ui-lkb__count[data-roll="up"] .ui-lkb__out { animation: ui-lkb-roll-out var(--tc-duration-slow) var(--tc-ease-out) 1 forwards; --tc-lkb-to: -100%; }
.ui-lkb__count[data-roll="down"] .ui-lkb__in { animation: ui-lkb-roll-in var(--tc-duration-slow) var(--tc-ease-out) 1; --tc-lkb-from: -100%; }
.ui-lkb__count[data-roll="down"] .ui-lkb__out { animation: ui-lkb-roll-out var(--tc-duration-slow) var(--tc-ease-out) 1 forwards; --tc-lkb-to: 100%; }
.ui-lkb__count:not([data-roll]) .ui-lkb__out { display: none; }
@keyframes ui-lkb-roll-in { from { translate: 0 var(--tc-lkb-from); } }
@keyframes ui-lkb-roll-out { to { translate: 0 var(--tc-lkb-to); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="lkb"][data-burst] :is(.ui-lkb__heart, [slot="icon"]) { animation: none; }
  [data-ui="lkb"][data-burst] .ui-lkb__particle { animation: none; }
  [data-ui="lkb"][data-burst] .ui-lkb__ring { animation: ui-lkb-ring var(--tc-duration-instant) steps(1, jump-start) 1; }
  .ui-lkb__count[data-roll] .ui-lkb__in { animation: ui-lkb-roll-in var(--tc-duration-instant) steps(1, jump-start) 1; --tc-lkb-from: 0; }
  .ui-lkb__count[data-roll] .ui-lkb__out { display: none; }
}
@media (forced-colors: active) {
  [data-ui="lkb"][pressed] :is(.ui-lkb__heart, [slot="icon"]) { color: Highlight; fill: Highlight; }
  .ui-lkb__burst { display: none; }
}
`;
}

if (!customElements.get("tc-like-burst")) customElements.define("tc-like-burst", TcLikeBurst);

declare global {
  interface HTMLElementTagNameMap {
    "tc-like-burst": TcLikeBurst;
  }
}
