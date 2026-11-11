import { html, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";

/*
 * <tc-dissolve-clear> – wraps a text input and adds a clear button that shows while the input has text. Clearing
 * empties the field at once – the page's state changes straight away – while a copy of the old text dissolves over it,
 * each letter drifting and blurring out from left to right. Focus stays in the input. Escape in the input clears it
 * too. With reduced motion the text simply goes.
 *
 *   <tc-dissolve-clear><input type="search" placeholder="Search findings" aria-label="Search findings" /></tc-dissolve-clear>
 *
 * The input stays the page's: the element finds the first text input inside, sets its value through the native
 * setter and sends an `input` event, so React, Vue and Angular see the change. `tc-clear` is sent first and is
 * cancelable. The button shows or hides with CSS from the input's own state, so a value the page sets is followed too
 * (an input without a placeholder gets a blank one, which is what that CSS reads).
 */

/** The `tc-clear` detail */
export type DissolveClearDetail = { value: string };

/** Only this many letters dissolve one by one; the rest go with the last of them */
const MAX_LETTERS = 60;
/** A small, fixed drift for letter i – the same every time */
const drift = (i: number) => [Math.round(Math.sin(i * 12.9898) * 6), Math.round(Math.cos(i * 78.233) * 6) - 4];

/**
 * A clear button for a text input whose text dissolves as it's cleared.
 * @tag tc-dissolve-clear
 * @fires tc-clear - The field is about to be cleared ({ value }: DissolveClearDetail); cancelable – prevented, the text stays
 */
export class TcDissolveClear extends TcElement {
  static override ui = "dclr";
  static override looks = false;

  /** The clear button's name */
  @property({ attribute: "clear-label" }) accessor clearLabel = "Clear";
  /** Announced after clearing */
  @property({ attribute: "cleared-label" }) accessor clearedLabel = "Cleared";

  @state() private accessor announced = "";

  private get input() {
    return this.querySelector<HTMLInputElement>("input:not([type='hidden']):not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit'])");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("keydown", this.onKey);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onKey);
  }

  protected override updated() {
    // :placeholder-shown is how the CSS knows the field is empty; it needs a placeholder to match
    const input = this.input;
    if (input && !input.hasAttribute("placeholder")) input.setAttribute("placeholder", " ");
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.target !== this.input || !this.input?.value) return;
    e.preventDefault();
    e.stopPropagation();
    this.clear();
  };

  /** Clears the input with the dissolve, as the button does */
  clear() {
    const input = this.input;
    if (!input || !input.value) return;
    const value = input.value;
    if (!this.emit<DissolveClearDetail>("tc-clear", { value }, { cancelable: true })) return;
    if (!reducedMotion()) this.dissolve(input, value);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
    this.announced = "";
    void this.updateComplete.then(() => (this.announced = this.clearedLabel));
  }

  /** A copy of the text laid over the input, letter by letter, that drifts and blurs away and then removes itself */
  private dissolve(input: HTMLInputElement, value: string) {
    this.querySelector(".ui-dclr__ghost")?.remove();
    const cs = getComputedStyle(input);
    const ghost = document.createElement("span");
    ghost.className = "ui-dclr__ghost";
    ghost.setAttribute("aria-hidden", "true");
    const left = input.offsetLeft + input.clientLeft + parseFloat(cs.paddingInlineStart || cs.paddingLeft);
    const width = input.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    Object.assign(ghost.style, { insetInlineStart: `${left}px`, top: `${input.offsetTop + input.clientTop}px`, width: `${Math.max(0, width)}px`, height: `${input.clientHeight}px`, font: cs.font, letterSpacing: cs.letterSpacing, color: cs.color });
    const line = document.createElement("span");
    line.className = "ui-dclr__line";
    line.style.translate = `${-input.scrollLeft}px 0`;
    const letters = Array.from(value);
    const n = Math.min(letters.length, MAX_LETTERS);
    letters.forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "ui-dclr__letter";
      span.textContent = ch;
      const [dx, dy] = drift(i);
      span.style.cssText = `--i: ${Math.min(i, n - 1)}; --n: ${n}; --dx: ${dx}px; --dy: ${dy}px`;
      line.append(span);
    });
    ghost.append(line);
    this.append(ghost);
    this.setAttribute("data-dissolving", "");
    const done = () => {
      ghost.remove();
      if (!this.querySelector(".ui-dclr__ghost")) this.removeAttribute("data-dissolving");
    };
    const animations = ghost.getAnimations({ subtree: true });
    if (!animations.length) return done();
    void Promise.all(animations.map((a) => a.finished)).then(done, done);
  }

  protected override render() {
    // Lucide x (ISC)
    return html`<button class="ui-dclr__clear" type="button" @pointerdown=${(e: PointerEvent) => e.preventDefault()} @click=${() => this.clear()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M18 6 6 18M6 6l12 12"></path>`}</svg><span class="tc-sr-only">${this.clearLabel}</span>
      </button><span class="tc-sr-only" role="status">${this.announced}</span>`;
  }

  static override css = /* css */ `
[data-ui="dclr"] {
  --tc-dissolve-clear-button: 22px;
  --tc-dissolve-clear-room: calc(var(--tc-dissolve-clear-button) + var(--tc-space-2));
  position: relative;
  display: block;
}
[data-ui="dclr"] input { padding-inline-end: var(--tc-dissolve-clear-room); }
[data-ui="dclr"] input::-webkit-search-cancel-button { display: none; }
[data-ui="dclr"][data-dissolving] input::placeholder { color: transparent; }
.ui-dclr__clear {
  position: absolute;
  inset-block: 0;
  inset-inline-end: var(--tc-space-1-5);
  display: grid;
  place-items: center;
  inline-size: var(--tc-dissolve-clear-button);
  block-size: var(--tc-dissolve-clear-button);
  margin-block: auto;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-full);
  background: transparent;
  color: var(--tc-text-muted);
  cursor: pointer;
  animation: ui-dclr-show var(--tc-duration-fast) var(--tc-ease-out) 1;
}
.ui-dclr__clear:hover { background: var(--tc-surface-sunken); color: var(--tc-text-primary); }
.ui-dclr__clear:focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring); outline-offset: 0; }
.ui-dclr__clear svg { inline-size: 14px; block-size: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
[data-ui="dclr"]:has(input:placeholder-shown) .ui-dclr__clear { display: none; }
@keyframes ui-dclr-show { from { opacity: 0; scale: 0.6; } }
.ui-dclr__ghost { position: absolute; display: flex; align-items: center; overflow: hidden; pointer-events: none; white-space: pre; }
.ui-dclr__line { display: inline-flex; }
.ui-dclr__letter {
  display: inline-block;
  white-space: pre;
  animation: ui-dclr-out var(--tc-duration-slow) var(--tc-ease-out) both;
  animation-delay: calc(var(--i) / var(--n) * var(--tc-duration-slow));
}
@keyframes ui-dclr-out { to { opacity: 0; filter: blur(4px); translate: var(--dx) var(--dy); } }
@media (prefers-reduced-motion: reduce) {
  .ui-dclr__clear { animation: none; }
  .ui-dclr__ghost { display: none; }
}
@media (forced-colors: active) {
  .ui-dclr__clear { color: ButtonText; }
}
`;
}

if (!customElements.get("tc-dissolve-clear")) customElements.define("tc-dissolve-clear", TcDissolveClear);

declare global {
  interface HTMLElementTagNameMap {
    "tc-dissolve-clear": TcDissolveClear;
  }
}
