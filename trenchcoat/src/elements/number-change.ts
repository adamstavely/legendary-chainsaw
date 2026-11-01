import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-number-change> – a number that briefly highlights when it changes, tinted by direction, with an arrow and a word
 * for screen readers while it does. It never highlights on first render, so nothing flashes because a page loaded. Up
 * is only a direction, so `direction="none"` turns the highlight off where up isn't good news, or set the colours.
 * With reduced motion the tint holds and then goes, without fading.
 *
 *   <tc-number-change value="1200" .format=${{ style: "currency", currency: "USD" }}></tc-number-change>
 */

export type NumberChangeDirection = "auto" | "up" | "down" | "none";
/** The words for screen readers */
export type NumberChangeLabels = { up: string; down: string };
export const defaultNumberChangeLabels: NumberChangeLabels = { up: "up", down: "down" };

const ARROW = { up: svg`<path d="M12 19V5M6 11l6-6 6 6"></path>`, down: svg`<path d="M12 5v14M6 13l6 6 6-6"></path>` };

/**
 * A number that briefly highlights when it changes.
 * @tag tc-number-change
 */
export class TcNumberChange extends TcElement {
  static override ui = "nch";
  static override looks = false;

  /** The number */
  @property({ type: Number }) accessor value: number | undefined = undefined;
  /** How it's written: Intl.NumberFormat options */
  @property({ attribute: false }) accessor format: Intl.NumberFormatOptions | undefined = undefined;
  /** The locale for writing it */
  @property() accessor locale: string | undefined = undefined;
  /** Which way to show a change: "auto" works it out, "none" doesn't highlight */
  @property() accessor direction: NumberChangeDirection = "auto";
  /** Rename the words */
  @property({ attribute: false }) accessor labels: Partial<NumberChangeLabels> = {};

  @state() private accessor change: "up" | "down" | null = null;
  private restart = false;

  private get text() {
    if (this.value === undefined || this.value === null) return "";
    try {
      return new Intl.NumberFormat(this.locale, this.format).format(this.value);
    } catch {
      return String(this.value);
    }
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const old = changed.get("value") as number | undefined;
    if (!changed.has("value") || old === undefined || old === null || this.value === undefined || this.value === null || old === this.value) return;
    if (this.direction === "none") return;
    this.change = this.direction === "auto" ? (this.value > old ? "up" : "down") : this.direction;
    this.restart = true;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.restart) {
      this.restart = false;
      this.removeAttribute("data-change");
      // Reading a size restarts the highlight when another change arrives mid-way
      void this.offsetWidth;
    }
    if (this.change) this.setAttribute("data-change", this.change);
    else this.removeAttribute("data-change");
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
    if (e.target === this) this.change = null;
  };

  protected override render() {
    const { change } = this;
    const words = { ...defaultNumberChangeLabels, ...this.labels };
    return html`<span class="ui-nch-value">${this.text}</span>${change
        ? html`<svg class="ui-nch-arrow" viewBox="0 0 24 24" aria-hidden="true">${ARROW[change]}</svg><span class="tc-sr-only">, ${words[change]}</span>`
        : nothing}`;
  }

  static override css = /* css */ `
[data-ui="nch"] {
  --tc-number-change-up: var(--tc-status-success-bg);
  --tc-number-change-down: var(--tc-status-danger-bg);
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  padding-inline: var(--tc-space-1);
  margin-inline: calc(-1 * var(--tc-space-1));
  border-radius: var(--tc-control-radius-sm);
  font-variant-numeric: tabular-nums;
}
.ui-nch-arrow { flex: none; width: 0.9em; height: 0.9em; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
[data-ui="nch"][data-change="up"] { --tc-nch-tint: var(--tc-number-change-up); animation: ui-nch-fade var(--tc-duration-reveal) var(--tc-ease-standard) 1; }
[data-ui="nch"][data-change="down"] { --tc-nch-tint: var(--tc-number-change-down); animation: ui-nch-fade var(--tc-duration-reveal) var(--tc-ease-standard) 1; }
@keyframes ui-nch-fade { from { background: var(--tc-nch-tint); } to { background: transparent; } }
@keyframes ui-nch-hold { from { background: var(--tc-nch-tint); } to { background: transparent; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="nch"][data-change="up"], [data-ui="nch"][data-change="down"] { animation: ui-nch-hold var(--tc-duration-reveal) steps(1) 1; }
}
@media (forced-colors: active) {
  [data-ui="nch"][data-change] { outline: 1px solid Highlight; }
}
`;
}

if (!customElements.get("tc-number-change")) customElements.define("tc-number-change", TcNumberChange);

declare global {
  interface HTMLElementTagNameMap {
    "tc-number-change": TcNumberChange;
  }
}
