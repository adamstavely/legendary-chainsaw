import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-badge-pop> – a count badge on a corner of what it wraps (an icon button, an avatar, a tab). When `count` rises
 * the badge pops – it swells past its size and springs back – and the digits roll up; when it falls they roll down;
 * at 0 the badge shrinks away, and it pops back in from nothing. Above `max` it reads "99+". `dot` shows a plain dot
 * instead of a number. Nothing moves on first render, so a page that loads with 4 unread doesn't pop.
 *
 *   <tc-badge-pop count="3" label="unread"><button aria-label="Inbox">…</button></tc-badge-pop>
 *
 * Screen readers hear the count from a polite status ("3 unread"), updated once a burst of changes settles rather
 * than on every one. With reduced motion the number changes in place and the badge appears and goes without scaling.
 */

export type BadgePopPosition = "top-end" | "top-start" | "bottom-end" | "bottom-start";

/**
 * A count badge that pops when the count rises and rolls its digits.
 * @tag tc-badge-pop
 */
export class TcBadgePop extends TcElement {
  static override ui = "bdp";
  static override looks = false;

  /** The count; 0 hides the badge */
  @property({ type: Number }) accessor count = 0;
  /** Above this it reads "<max>+" */
  @property({ type: Number }) accessor max = 99;
  /** A plain dot instead of the number */
  @property({ type: Boolean, reflect: true }) accessor dot = false;
  /** Which corner it sits on */
  @property({ reflect: true }) accessor position: BadgePopPosition = "top-end";
  /** The word after the count for screen readers: "3 unread" */
  @property() accessor label = "new";
  /** How long the count must hold before it's announced, in ms */
  @property({ type: Number, attribute: "announce-delay" }) accessor announceDelay = 800;
  /** The locale for writing the number */
  @property() accessor locale: string | undefined = undefined;

  /** The text rolling out, while it does */
  @state() private accessor previous: string | null = null;
  @state() private accessor announced = "";
  /** The last text shown, while the badge shrinks away after the count reached 0 */
  @state() private accessor leaving: string | null = null;
  /** "up" or "down" while the digits roll */
  private roll: "up" | "down" | null = null;
  private motion: "pop" | "in" | "out" | null = null;
  private timer = 0;

  private text(n = this.count) {
    const fmt = (v: number) => new Intl.NumberFormat(this.locale).format(v);
    return n > this.max ? `${fmt(this.max)}+` : fmt(n);
  }

  /** "3 unread" – the count in words, not capped */
  private get words() {
    return `${new Intl.NumberFormat(this.locale).format(Math.max(0, this.count))} ${this.label}`.trim();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!this.hasUpdated) {
      this.announced = this.count > 0 ? this.words : "";
      return;
    }
    if (!changed.has("count")) return;
    const old = (changed.get("count") as number | undefined) ?? 0;
    if (old === this.count) return;
    if (this.count <= 0) {
      this.motion = old > 0 ? "out" : null;
      if (old > 0) this.leaving = this.dot ? "" : this.text(old);
    } else if (old <= 0) {
      this.motion = "in";
      this.leaving = null;
    }
    else if (this.count > old) this.motion = "pop";
    else this.motion = null;
    if (!this.dot && old > 0 && this.count > 0 && this.text(old) !== this.text()) {
      this.previous = this.text(old);
      this.roll = this.count > old ? "up" : "down";
    } else {
      this.previous = null;
      this.roll = null;
    }
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => (this.announced = this.count > 0 ? this.words : `0 ${this.label}`.trim()), this.announceDelay);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const badge = this.querySelector<HTMLElement>(".ui-bdp__badge");
    if (badge && this.motion) {
      badge.removeAttribute("data-motion");
      // Reading a size restarts the pop when the count rises again mid-way
      void badge.offsetWidth;
      badge.setAttribute("data-motion", this.motion);
      this.motion = null;
    }
    const digits = this.querySelector<HTMLElement>(".ui-bdp__digits");
    if (digits) {
      if (this.roll) digits.setAttribute("data-roll", this.roll);
      else digits.removeAttribute("data-roll");
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("animationend", this.onEnd);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("animationend", this.onEnd);
    clearTimeout(this.timer);
  }

  private onEnd = (e: AnimationEvent) => {
    const target = e.target as HTMLElement;
    if (e.animationName === "ui-bdp-roll-in") {
      this.roll = null;
      this.previous = null;
    } else if (target.classList.contains("ui-bdp__badge")) {
      target.removeAttribute("data-motion");
      if (e.animationName === "ui-bdp-out" || e.animationName === "ui-bdp-gone") this.leaving = null;
    }
  };

  protected override render() {
    const shown = this.count > 0 ? this.text() : this.leaving;
    return html`${shown !== null
        ? html`<span class="ui-bdp__badge" aria-hidden="true">${this.dot
            ? nothing
            : html`<span class="ui-bdp__digits">${this.previous !== null ? html`<span class="ui-bdp__out">${this.previous}</span>` : nothing}<span class="ui-bdp__in">${shown}</span></span>`}</span>`
        : nothing}<span class="tc-sr-only" role="status">${this.announced}</span>`;
  }

  static override css = /* css */ `
[data-ui="bdp"] {
  /* The status text red as a fill: a small number on it keeps 4.5:1 in both themes, which the solid red doesn't */
  --tc-badge-pop-bg: var(--tc-status-danger-fg);
  --tc-badge-pop-fg: var(--tc-surface-raised);
  --tc-badge-pop-ring: var(--tc-surface-raised);
  --tc-badge-pop-size: 18px;
  --tc-badge-pop-dot: 10px;
  --tc-badge-pop-offset: calc(var(--tc-badge-pop-size) / -3);
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}
.ui-bdp__badge {
  position: absolute;
  z-index: 1;
  display: inline-grid;
  place-items: center;
  min-inline-size: var(--tc-badge-pop-size);
  block-size: var(--tc-badge-pop-size);
  padding-inline: var(--tc-space-1);
  border-radius: var(--tc-radius-full);
  background: var(--tc-badge-pop-bg);
  color: var(--tc-badge-pop-fg);
  box-shadow: 0 0 0 2px var(--tc-badge-pop-ring);
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  box-sizing: border-box;
}
[data-ui="bdp"][dot] .ui-bdp__badge { min-inline-size: var(--tc-badge-pop-dot); block-size: var(--tc-badge-pop-dot); padding: 0; --tc-badge-pop-offset: 0px; }
[data-ui="bdp"][position="top-end"] .ui-bdp__badge, [data-ui="bdp"]:not([position]) .ui-bdp__badge { inset-block-start: var(--tc-badge-pop-offset); inset-inline-end: var(--tc-badge-pop-offset); }
[data-ui="bdp"][position="top-start"] .ui-bdp__badge { inset-block-start: var(--tc-badge-pop-offset); inset-inline-start: var(--tc-badge-pop-offset); }
[data-ui="bdp"][position="bottom-end"] .ui-bdp__badge { inset-block-end: var(--tc-badge-pop-offset); inset-inline-end: var(--tc-badge-pop-offset); }
[data-ui="bdp"][position="bottom-start"] .ui-bdp__badge { inset-block-end: var(--tc-badge-pop-offset); inset-inline-start: var(--tc-badge-pop-offset); }
.ui-bdp__badge[data-motion="pop"] { animation: ui-bdp-pop var(--tc-duration-slower) var(--tc-ease-spring) 1; }
.ui-bdp__badge[data-motion="in"] { animation: ui-bdp-in var(--tc-duration-slower) var(--tc-ease-spring) 1; }
.ui-bdp__badge[data-motion="out"] { animation: ui-bdp-out var(--tc-duration-moderate) var(--tc-ease-in) 1 forwards; }
@keyframes ui-bdp-pop { 40% { scale: 1.3; } }
@keyframes ui-bdp-in { from { scale: 0; } }
@keyframes ui-bdp-out { to { scale: 0; opacity: 0; } }
.ui-bdp__digits { display: inline-grid; overflow: hidden; }
.ui-bdp__digits > * { grid-area: 1 / 1; }
.ui-bdp__digits[data-roll="up"] .ui-bdp__in { animation: ui-bdp-roll-in var(--tc-duration-slow) var(--tc-ease-out) 1; --tc-bdp-from: 100%; }
.ui-bdp__digits[data-roll="up"] .ui-bdp__out { animation: ui-bdp-roll-out var(--tc-duration-slow) var(--tc-ease-out) 1 forwards; --tc-bdp-to: -100%; }
.ui-bdp__digits[data-roll="down"] .ui-bdp__in { animation: ui-bdp-roll-in var(--tc-duration-slow) var(--tc-ease-out) 1; --tc-bdp-from: -100%; }
.ui-bdp__digits[data-roll="down"] .ui-bdp__out { animation: ui-bdp-roll-out var(--tc-duration-slow) var(--tc-ease-out) 1 forwards; --tc-bdp-to: 100%; }
.ui-bdp__digits:not([data-roll]) .ui-bdp__out { display: none; }
@keyframes ui-bdp-roll-in { from { translate: 0 var(--tc-bdp-from); } }
@keyframes ui-bdp-roll-out { to { translate: 0 var(--tc-bdp-to); } }
@media (prefers-reduced-motion: reduce) {
  .ui-bdp__badge[data-motion="pop"], .ui-bdp__badge[data-motion="in"] { animation: none; }
  .ui-bdp__badge[data-motion="out"] { animation: ui-bdp-gone var(--tc-duration-instant) steps(1) 1 forwards; }
  .ui-bdp__digits[data-roll] .ui-bdp__in { animation: ui-bdp-roll-in var(--tc-duration-instant) steps(1, jump-start) 1; --tc-bdp-from: 0; }
  .ui-bdp__digits[data-roll] .ui-bdp__out { display: none; }
}
@keyframes ui-bdp-gone { to { opacity: 0; } }
@media (forced-colors: active) {
  .ui-bdp__badge { background: Mark; color: MarkText; outline: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-badge-pop")) customElements.define("tc-badge-pop", TcBadgePop);

declare global {
  interface HTMLElementTagNameMap {
    "tc-badge-pop": TcBadgePop;
  }
}
