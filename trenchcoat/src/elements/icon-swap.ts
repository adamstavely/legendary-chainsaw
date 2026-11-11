import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-icon-swap> – one icon turning into the next: copy into a check, play into pause, menu into close. Put the icons
 * inside it, each with a `data-state` (and a `data-label` for its word), and set `state`: the old icon turns away,
 * shrinks and blurs out as the new one turns in. With `revert-after` it goes back to its resting state on its own –
 * a copy button's check that turns back into the copy icon. With reduced motion the two simply crossfade.
 *
 *   <button><tc-icon-swap state="copy" revert-after="1600" announce>
 *     <svg data-state="copy" data-label="Copy">…</svg><svg data-state="done" data-label="Copied">…</svg>
 *   </tc-icon-swap> Copy link</button>
 *
 * The icons stay where the framework put them; the element only marks which one is showing. They share one cell, so
 * the box keeps the size of the largest and nothing beside it moves. It adds no role and takes no focus: the control
 * around it is what people operate. `announce` reads each change's word politely.
 */

/** An icon: any HTML or SVG child with a data-state */
export type IconSwapIcon = HTMLElement | SVGElement;

/** tc-state-change: the element is going back to its resting state on its own */
export type IconSwapStateChange = { state: string };

/**
 * One icon turning into the next – rotate, scale and blur – by `state`, optionally turning back after a while.
 * @tag tc-icon-swap
 * @fires tc-state-change - Going back to the resting state after `revert-after` ({ state }: IconSwapStateChange); cancelable – prevented, the icon stays
 */
export class TcIconSwap extends TcElement {
  static override ui = "iswp";
  static override looks = false;

  /** The icon to show: the `data-state` of one of its icons; unset, or unknown, shows the first */
  @property({ reflect: true }) accessor state: string | undefined = undefined;
  /** The resting state `revert-after` goes back to; by default the first icon's */
  @property() accessor rest: string | undefined = undefined;
  /** Go back to the resting state this many ms after a change away from it; 0 never does */
  @property({ type: Number, attribute: "revert-after" }) accessor revertAfter = 0;
  /** Read each change's word out politely – the icon's `data-label`, else its state */
  @property({ type: Boolean }) accessor announce = false;

  @state() private accessor spoken = "";

  /** The icon showing, so a change knows which one leaves */
  private shown: IconSwapIcon | null = null;
  private timer = 0;
  /** Past the first render: from here a change of state moves */
  private ready = false;
  private mutations?: MutationObserver;

  private onAnimationEnd = (e: AnimationEvent) => {
    const el = e.target as Element;
    if (el.parentElement !== this) return;
    el.removeAttribute("data-leaving");
    el.removeAttribute("data-enter");
  };

  /** Its icons: the children with a data-state */
  get icons(): IconSwapIcon[] {
    return [...this.children].filter((c): c is IconSwapIcon => (c instanceof HTMLElement || c instanceof SVGElement) && c.hasAttribute("data-state"));
  }

  /** The state showing – `state` when one of the icons has it, else the first icon's */
  get current(): string | undefined {
    const icons = this.icons;
    return icons.find((i) => i.dataset.state === this.state)?.dataset.state ?? icons[0]?.dataset.state;
  }

  private get resting() {
    return this.rest ?? this.icons[0]?.dataset.state;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("animationend", this.onAnimationEnd);
    // Icons a framework adds or replaces later are marked as they arrive, without moving
    this.mutations = new MutationObserver(() => this.mark(false));
    this.mutations.observe(this, { childList: true });
    this.mark(false);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("animationend", this.onAnimationEnd);
    this.mutations?.disconnect();
    window.clearTimeout(this.timer);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this.mark(changed.has("state") && this.ready);
    this.ready = true;
    if (changed.has("state") || changed.has("revertAfter")) this.schedule();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.announce && changed.has("state") && this.hasUpdated) {
      const icon = this.icons.find((i) => i.dataset.state === this.current);
      this.spoken = icon?.dataset.label ?? this.current ?? "";
    }
  }

  /** Marks the icon showing; on a change the old one leaves as the new one enters */
  private mark(animate: boolean) {
    const icons = this.icons;
    const next = icons.find((i) => i.dataset.state === this.current) ?? null;
    const prev = this.shown && icons.includes(this.shown) ? this.shown : null;
    // Reduced motion still moves: its CSS makes the swap a plain crossfade
    const moving = animate && prev !== null && prev !== next && next !== null;
    for (const icon of icons) {
      if (icon !== next && icon !== prev) icon.removeAttribute("data-leaving");
      if (icon !== next) {
        icon.removeAttribute("data-active");
        icon.removeAttribute("data-enter");
      }
      icon.setAttribute("aria-hidden", "true");
    }
    if (prev && prev !== next) {
      if (moving) {
        // Restart its leaving if it was mid-way
        prev.removeAttribute("data-leaving");
        void prev.getBoundingClientRect();
        prev.setAttribute("data-leaving", "");
      } else prev.removeAttribute("data-leaving");
    }
    if (next) {
      next.removeAttribute("data-leaving");
      next.setAttribute("data-active", "");
      if (moving) {
        next.removeAttribute("data-enter");
        void next.getBoundingClientRect();
        next.setAttribute("data-enter", "");
      }
    }
    this.shown = next;
  }

  /** Away from rest with revert-after set: go back after the wait */
  private schedule() {
    window.clearTimeout(this.timer);
    const rest = this.resting;
    if (this.revertAfter <= 0 || rest === undefined || this.current === rest) return;
    this.timer = window.setTimeout(() => {
      if (this.emit<IconSwapStateChange>("tc-state-change", { state: rest }, { cancelable: true })) this.state = rest;
    }, this.revertAfter);
  }

  protected override render() {
    return this.announce ? html`<span class="tc-sr-only" role="status">${this.spoken}</span>` : nothing;
  }

  static override css = /* css */ `
[data-ui="iswp"] {
  --tc-iswp-turn: 90deg;
  --tc-iswp-shrink: 0.5;
  --tc-iswp-blur: 4px;
  display: inline-grid;
  place-items: center;
  vertical-align: middle;
  position: relative;
}
/* Every icon shares one cell, so the box keeps the largest one's size */
[data-ui="iswp"] > [data-state] { grid-area: 1 / 1; display: block; }
[data-ui="iswp"] > [data-state]:not([data-active], [data-leaving]) { visibility: hidden; }
[data-ui="iswp"] > [data-leaving] { pointer-events: none; animation: ui-iswp-out var(--tc-duration-moderate) var(--tc-ease-move) both; }
[data-ui="iswp"] > [data-enter] { animation: ui-iswp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
@keyframes ui-iswp-in {
  from { opacity: 0; transform: rotate(calc(var(--tc-iswp-turn) * -1)) scale(var(--tc-iswp-shrink)); filter: blur(var(--tc-iswp-blur)); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-iswp-out {
  from { opacity: 1; transform: none; filter: none; }
  to { opacity: 0; transform: rotate(var(--tc-iswp-turn)) scale(var(--tc-iswp-shrink)); filter: blur(var(--tc-iswp-blur)); }
}
@keyframes ui-iswp-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ui-iswp-fade-out { from { opacity: 1; } to { opacity: 0; } }
/* Reduced motion: a plain crossfade, nothing turns or shrinks */
@media (prefers-reduced-motion: reduce) {
  [data-ui="iswp"] > [data-enter] { animation-name: ui-iswp-fade-in; }
  [data-ui="iswp"] > [data-leaving] { animation-name: ui-iswp-fade-out; }
}
`;
}

if (!customElements.get("tc-icon-swap")) customElements.define("tc-icon-swap", TcIconSwap);

declare global {
  interface HTMLElementTagNameMap {
    "tc-icon-swap": TcIconSwap;
  }
}
