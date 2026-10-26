import { html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { AriaForwardController, OffScreenController } from "./internal/controllers";

/*
 * <tc-button> – the Lit port of src/components/button.tsx (pilot component, audit/lit-port-plan.md).
 * Two looks, picked with `look` (Standard by default, or the nearest <tc-look-provider>):
 *   · Standard: a flat ink chip, a white button with the card ring, 28 · 32 · 40 high
 *   · Clean: a flat ink chip, a white button with hairline shadows, a quiet ghost and a minimal red fill, 24 · 28 · 32
 *
 *   <tc-button label="Save"></tc-button>
 *   <tc-button variant="secondary" label="Copy"><svg slot="icon" …></svg></tc-button>
 *   <tc-button label="Close" hide-label><svg slot="icon" …></svg></tc-button>     icon only; the label is its name
 *
 * The host is the visual button; inside it a native <button> holds the label, so keyboard activation, `disabled`
 * and form submission are the browser's own. Icons are the caller's children (slot="icon" before the label,
 * slot="icon-right" after it) and stay where the caller put them – CSS places them. The label is a property, not
 * text children: React and Vue set textContent on an element whose only child is text, which would erase what the
 * element renders. ARIA attributes set on the host (aria-label, aria-expanded …) move to the inner button.
 */
/**
 * A button: primary, secondary, ghost or destructive, in three sizes, with a loading state.
 * @tag tc-button
 * @slot icon - An icon before the label
 * @slot icon-right - An icon after the label
 */
export class TcButton extends TcElement {
  static override ui = "button";

  /** primary: dark and filled · secondary: white with an outline (Clean: a hairline shadow) · ghost: text only ·
   *  destructive: red, for deleting */
  @property({ reflect: true }) accessor variant: "primary" | "secondary" | "ghost" | "destructive" = "primary";
  @property({ reflect: true }) accessor size: "sm" | "md" | "lg" = "md";
  /** The button's text (and its accessible name) */
  @property() accessor label = "";
  /** Icon only: the label isn't shown, but stays the button's name */
  @property({ type: Boolean, attribute: "hide-label" }) accessor hideLabel = false;
  /** Shows a shimmer over the label, blocks clicks and adds "loading" to the accessible name */
  @property({ type: Boolean, reflect: true }) accessor loading = false;
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  @property({ reflect: true }) accessor type: "button" | "submit" | "reset" = "button";
  /** Submitted with the form when this is its submit button */
  @property() accessor name = "";
  @property() accessor value = "";

  private ready = false;
  /** The label changed after the first render: it blurs in (nothing animates on the first render) */
  private enter = false;
  private lastWidth = 0;
  private ro?: ResizeObserver;
  private children$?: MutationObserver;

  constructor() {
    super();
    new OffScreenController(this, () => this.loading);
    new AriaForwardController(this, () => this.querySelector(":scope > .ui-button__hit"));
    // While loading, clicks don't reach the page's listeners
    this.addEventListener("click", (e) => {
      if (this.loading) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, { capture: true });
  }

  private slotted(name: string) {
    return [...this.children].some((c) => c.getAttribute("slot") === name);
  }

  override connectedCallback() {
    super.connectedCallback();
    // Icons the caller adds or removes later change the button's shape
    this.children$ = new MutationObserver(() => this.requestUpdate());
    this.children$.observe(this, { childList: true });
    if (typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(([entry]) => {
        this.lastWidth = entry.borderBoxSize?.[0]?.inlineSize ?? this.getBoundingClientRect().width;
      });
      this.ro.observe(this);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.children$?.disconnect();
    this.ro?.disconnect();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.enter = this.ready && changed.has("label");
    const icon = this.slotted("icon");
    const iconRight = this.slotted("icon-right");
    const iconOnly = (this.hideLabel || !this.label) && (icon || iconRight);
    this.toggleAttribute("data-icon-only", Boolean(iconOnly));
    this.toggleAttribute("data-icon-left", !iconOnly && icon);
    this.toggleAttribute("data-icon-right", !iconOnly && iconRight);
    this.toggleAttribute("data-has-icon", icon);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // Morph: when the label or the loading state changes, the width glides from its old size to its new one
    if (this.ready && (changed.has("label") || changed.has("loading")) && !reducedMotion()) {
      const from = this.lastWidth;
      const width = this.getBoundingClientRect().width;
      if (from && Math.abs(from - width) >= 0.5)
        this.animate([{ width: `${from}px` }, { width: `${width}px` }], { duration: 480, easing: "cubic-bezier(0.25, 1, 0.5, 1)" });
    }
    if (!this.ready) {
      this.ready = true;
      this.setAttribute("data-ready", "");
    }
  }

  protected override render() {
    const hasIcon = this.slotted("icon");
    const showLabel = Boolean(this.label) && !this.hideLabel;
    return html`
      ${this.loading && hasIcon
        ? html`<span class="ui-button__icon ui-button__spinner-box" aria-hidden="true">${spinner}</span>`
        : nothing}
      <button
        class="ui-button__hit"
        type=${this.type}
        name=${ifDefined(this.name || undefined)}
        value=${ifDefined(this.value || undefined)}
        ?disabled=${this.disabled}
        aria-busy=${ifDefined(this.loading ? "true" : undefined)}
        aria-disabled=${ifDefined(this.loading ? "true" : undefined)}
      >${showLabel
        ? keyed(
            this.label,
            html`<span class="ui-button__label" ?data-enter=${this.enter}>${this.label}${this.loading
              ? html`<span class="ui-button__shine" aria-hidden="true"><span>${this.label}</span></span>`
              : nothing}</span>`,
          )
        : html`<span class="ui-button__status">${this.label}</span>`}${this.loading ? html`<span class="ui-button__status">, loading</span>` : nothing}</button>
    `;
  }

  static override css = /* css */ `
/* Geometry and colours come from the control and action pattern tokens (CONTRIBUTING.md). Override the
   --tc-button-* variables on a tc-button to theme one button. */
[data-ui="button"] {
  --tc-button-h: var(--tc-control-h-md);
  --tc-button-px: var(--tc-control-px-md);
  --tc-button-radius: var(--tc-control-radius-md);
  --tc-button-fs: var(--tc-control-font-size);
  --tc-button-gap: var(--tc-space-1-5);
  --tc-button-icon: 16px;
  --tc-button-load: 1040ms;

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-button-gap);
  box-sizing: border-box;
  height: var(--tc-button-h);
  min-width: var(--tc-button-h);
  padding: 0 var(--tc-button-px);
  margin: 0;
  border: 0;
  border-radius: var(--tc-button-radius);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-button-fs);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  vertical-align: middle;
  color: var(--tc-button-fg);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
  overflow: clip;
  transition:
    background-color var(--tc-duration-fast) var(--tc-ease-standard),
    color var(--tc-duration-fast) var(--tc-ease-standard),
    box-shadow var(--tc-duration-fast) var(--tc-ease-standard),
    transform var(--tc-duration-fast) var(--tc-ease-move),
    opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="button"] {
  letter-spacing: -0.01em;
}
/* The native button holds the label and takes every click on the chip (its ::after covers the host) */
[data-ui="button"] > .ui-button__hit {
  display: inline-flex;
  align-items: center;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  cursor: inherit;
  outline: none;
}
[data-ui="button"] > .ui-button__hit::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
/* Sizes follow --tc-control-h-sm/md/lg: Standard 28 · 32 · 40, Clean 24 · 28 · 32 */
[data-ui="button"][size="sm"] {
  --tc-button-h: var(--tc-control-h-sm);
  --tc-button-px: var(--tc-control-px-sm);
  --tc-button-radius: var(--tc-control-radius-sm);
  --tc-button-gap: var(--tc-space-1);
  --tc-button-icon: 14px;
}
[data-ui="button"][size="lg"] {
  --tc-button-h: var(--tc-control-h-lg);
  --tc-button-px: var(--tc-control-px-lg);
  --tc-button-radius: var(--tc-control-radius-lg);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="button"][size="lg"] {
  --tc-button-fs: var(--tc-font-size-lg);
  --tc-button-gap: var(--tc-space-2);
  --tc-button-icon: 18px;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="button"][size="sm"] {
  --tc-button-fs: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
/* An icon sits closer to the edge than the text, so both look evenly spaced */
[data-ui="button"][data-icon-left] {
  padding-left: calc(var(--tc-button-px) - var(--tc-button-icon-inset, 2px));
}
[data-ui="button"][data-icon-right] {
  padding-right: calc(var(--tc-button-px) - var(--tc-button-icon-inset, 2px));
}
[data-ui="button"][data-icon-only] {
  width: var(--tc-button-h);
  padding: 0;
}
/* primary: flat ink (design decision 1) */
[data-ui="button"][variant="primary"] {
  --tc-button-fg: var(--tc-action-primary-fg);
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow);
}
[data-ui="button"][variant="primary"]:hover:not([disabled]) {
  background: var(--tc-action-primary-bg-hover);
}
[data-ui="button"][variant="primary"]:active:not([disabled]):not([loading]) {
  background: var(--tc-action-primary-bg-active);
}
/* secondary: the control surface with the card ring */
[data-ui="button"][variant="secondary"] {
  --tc-button-fg: var(--tc-action-secondary-fg);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
}
[data-ui="button"][variant="secondary"]:hover:not([disabled]) {
  box-shadow: var(--tc-action-secondary-shadow-hover);
}
/* ghost: a quiet label, a wash appears on hover */
[data-ui="button"][variant="ghost"] {
  --tc-button-fg: var(--tc-action-ghost-fg);
  background: transparent;
}
[data-ui="button"][variant="ghost"]:hover:not([disabled]) {
  --tc-button-fg: var(--tc-text-primary);
  background: var(--tc-action-ghost-bg-hover);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="button"]:is([variant="secondary"], [variant="ghost"]) > :is(.ui-button__icon, [slot="icon"], [slot="icon-right"]) {
  color: var(--tc-icon-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="button"][variant="ghost"]:hover:not([disabled]) > :is(.ui-button__icon, [slot="icon"], [slot="icon-right"]) {
  color: var(--tc-text-primary);
}
/* destructive: red label on a light red fill */
[data-ui="button"][variant="destructive"] {
  --tc-button-fg: var(--tc-status-danger-fg);
  background: var(--tc-status-danger-bg);
}
[data-ui="button"][variant="destructive"]:hover:not([disabled]) {
  background: color-mix(in srgb, var(--tc-status-danger-bg) 88%, var(--tc-status-danger-solid));
}
[data-ui="button"]:active:not([disabled]):not([loading]) {
  transform: scale(0.97);
}
[data-ui="button"]:has(> .ui-button__hit:focus-visible) {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
[data-ui="button"][disabled] {
  opacity: 0.4;
  cursor: default;
}
[data-ui="button"][loading] {
  cursor: default;
}
/* Icons: the caller's (slot="icon" before the label, slot="icon-right" after it) and the loading spinner */
[data-ui="button"] > :is(.ui-button__icon, [slot="icon"], [slot="icon-right"]) {
  display: grid;
  place-items: center;
  flex: none;
  box-sizing: border-box;
  width: var(--tc-button-icon);
  height: var(--tc-button-icon);
}
[data-ui="button"] > :is([slot="icon"], .ui-button__spinner-box) { order: -1; }
[data-ui="button"] > [slot="icon-right"] { order: 1; }
[data-ui="button"][loading] > [slot="icon"] { display: none; }
[data-ui="button"] .ui-button__icon > svg {
  width: 100%;
  height: 100%;
}
/* Announced with the name while loading ("Save, loading"), and an icon-only button's name; visually hidden */
[data-ui="button"] .ui-button__status {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* Morph: changed parts blur in (the width glide runs from the element) */
[data-ui="button"] .ui-button__label[data-enter] {
  animation: ui-button-label-in var(--tc-duration-slower) var(--tc-ease-move) both;
}
[data-ui="button"][data-ready] > .ui-button__icon {
  animation: ui-button-icon-in var(--tc-duration-slowest) var(--tc-ease-move) both;
}
/* Loading: the label dims and a band of full-colour label sweeps across it. The window slides one way and the
   text inside it the other way, so only transform animates (composited); paused while off-screen. */
[data-ui="button"] .ui-button__label {
  position: relative;
}
[data-ui="button"][loading] .ui-button__label {
  color: color-mix(in srgb, var(--tc-button-fg) 55%, transparent);
}
[data-ui="button"] .ui-button__shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  animation: ui-button-sweep var(--tc-button-load) linear infinite;
}
[data-ui="button"] .ui-button__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-button-fg);
  animation: ui-button-sweep-text var(--tc-button-load) linear infinite;
}
[data-ui="button"] .ui-button__spinner {
  animation: ui-button-spin var(--tc-duration-reveal-slow) linear infinite;
}
[data-ui="button"][data-offscreen] :is(.ui-button__shine, .ui-button__shine > span, .ui-button__spinner) {
  animation-play-state: paused;
}
@keyframes ui-button-label-in {
  from {
    opacity: 0;
    filter: blur(3px);
    transform: translateY(25%);
  }
}
@keyframes ui-button-icon-in {
  from {
    opacity: 0;
    filter: blur(2px);
    transform: scale(0.7);
  }
}
@keyframes ui-button-spin {
  to {
    transform: rotate(1turn);
  }
}
@keyframes ui-button-sweep {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
@keyframes ui-button-sweep-text {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="button"] .ui-button__label[data-enter],
  [data-ui="button"][data-ready] > .ui-button__icon {
    animation: none;
  }
  [data-ui="button"] {
    transition-duration: 1ms;
  }
  [data-ui="button"] .ui-button__shine {
    display: none;
  }
}
`;
}

const spinner = html`<svg class="ui-button__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <circle cx="12" cy="12" r="8.5" opacity="0.2"></circle>
  <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5"></path>
</svg>`;

if (!customElements.get("tc-button")) customElements.define("tc-button", TcButton);

declare global {
  interface HTMLElementTagNameMap {
    "tc-button": TcButton;
  }
}
