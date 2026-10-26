import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-blur-crossfade> – the Lit port of motion/blur-crossfade.tsx: swaps content with a soft blur while the box
 * glides to the new size. Change `swapKey` and the old content blurs out as the new one blurs in; height (and
 * optionally width) morphs from old to new.
 *
 *   <tc-blur-crossfade swap-key="saved"><div>Saved</div></tc-blur-crossfade>
 *   … replace the child, then set swap-key="uploading"
 *
 * The content is the caller's children, and they stay where the framework put them: each child element is a layer
 * (the React file's .ui-bx__layer). On a swap the framework has already put the new layer in; the element shows a
 * copy of the layer that was there before (inert, hidden from assistive tech) fading out above it. The React wrapper
 * renders the children in one layer keyed by `id`, exactly as the React component did. So the CSS differs from the
 * React file's in its selectors: `.ui-bx__layer` is every child, `.ui-bx--<morph>` is the `morph` attribute, and the
 * incoming layer is every child but the copy while data-busy is set.
 * If keyboard focus was on something in the old content, it moves to the first control of the new content (or the
 * new content itself), so it never drops to the page. React's `id` is `swapKey` here (`id` is the element's id).
 */

export type BlurCrossfadeMorph = "height" | "both" | "none";

// Read at the moment of each swap, so a change of the setting applies to the next one
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Swaps its content with a soft blur while the box glides to the new size. Change `swapKey` to swap.
 * @tag tc-blur-crossfade
 */
export class TcBlurCrossfade extends TcElement {
  static override ui = "bx";
  static override looks = false;

  /** Change this to swap – the content that was there fades out, the new content fades in */
  @property({ attribute: "swap-key" }) accessor swapKey: string | number | undefined = undefined;
  /** Length of the swap in ms */
  @property({ type: Number }) accessor duration = 420;
  /** Blur in px at the start and end of the fade (the React prop `blur`; `blur` is the element's blur() method) */
  @property({ type: Number, attribute: "blur" }) accessor blurAmount = 10;
  /** Which sides glide to the new size; "both" sizes the box to its content */
  @property({ reflect: true }) accessor morph: BlurCrossfadeMorph = "height";

  /** @internal The copy of the content that is leaving */
  @state() accessor exit: { node: Element; n: number } | null = null;

  /** The content layer on screen, kept for the moment it has to leave */
  private layer: Element | null = null;
  private size = { w: 0, h: 0 };
  private busy = false;
  private timer = 0;
  private counter = 0;
  private ro?: ResizeObserver;
  /** The element that last had focus inside the box – if a swap removes it, focus moves to the new content */
  private lastFocus: HTMLElement | null = null;

  private onFocusIn = (e: FocusEvent) => {
    this.lastFocus = e.target instanceof HTMLElement ? e.target : null;
  };

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("focusin", this.onFocusIn);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("focusin", this.onFocusIn);
    window.clearTimeout(this.timer);
    this.ro?.disconnect();
    this.ro = undefined;
    this.busy = false;
    this.removeAttribute("data-busy");
    this.style.height = this.style.width = this.style.transition = "";
    this.exit = null;
  }

  /** The caller's content: the last child element that isn't the leaving copy */
  private currentLayer(): HTMLElement | null {
    const kids = [...this.children].filter((c) => !c.classList.contains("ui-bx__layer--out"));
    return (kids[kids.length - 1] as HTMLElement | undefined) ?? null;
  }

  /** Keep the resting size current when the content changes on its own */
  private watch(layer: HTMLElement | null) {
    this.ro?.disconnect();
    this.ro = undefined;
    this.layer = layer;
    if (!layer) return;
    this.size = { w: layer.offsetWidth, h: layer.offsetHeight };
    if (typeof ResizeObserver === "undefined") return;
    this.ro = new ResizeObserver(() => {
      if (!this.busy) this.size = { w: layer.offsetWidth, h: layer.offsetHeight };
    });
    this.ro.observe(layer);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.style.setProperty("--tc-blur-crossfade-duration", `${this.duration}ms`);
    this.style.setProperty("--tc-blur-crossfade-blur", `${this.blurAmount}px`);
    if (changed.has("swapKey") && this.hasUpdated) this.swap();
  }

  protected override firstUpdated() {
    this.watch(this.currentLayer());
  }

  /** The new content is in: the old one leaves as a copy, the box glides from the old size to the new */
  private swap() {
    const layer = this.currentLayer();
    const leaving = this.layer;
    window.clearTimeout(this.timer);
    if (!layer) return;

    // Focus was on the old content, which is gone now: give it to the new content before paint
    const prev = this.lastFocus;
    const active = document.activeElement;
    if (prev && !prev.isConnected && (!active || active === document.body)) {
      this.lastFocus = null;
      const target = layer.querySelector<HTMLElement>(FOCUSABLE);
      if (target) target.focus({ preventScroll: true });
      else {
        layer.setAttribute("tabindex", "-1");
        layer.focus({ preventScroll: true });
      }
    }

    const to = { w: layer.offsetWidth, h: layer.offsetHeight };
    const from0 = this.size;
    this.watch(layer);
    if (reduced() || this.duration <= 0) {
      this.exit = null;
      this.style.height = this.style.width = this.style.transition = "";
      this.removeAttribute("data-busy");
      this.busy = false;
      this.size = to;
      return;
    }

    // Mid-swap the box is already animating – start from where it is right now
    const r = this.getBoundingClientRect();
    const from = this.busy ? { w: r.width, h: r.height } : from0;
    // The leaving content: a copy of the layer the framework took out (one still on the page wasn't swapped out)
    let node: Element | null = null;
    if (leaving && leaving !== layer && !leaving.isConnected) {
      node = leaving.cloneNode(true) as Element;
      node.classList.add("ui-bx__layer", "ui-bx__layer--out");
      node.setAttribute("aria-hidden", "true");
      node.setAttribute("inert", "");
      node.removeAttribute("id");
      if (from0.w) (node as HTMLElement).style.width = `${from0.w}px`;
    }
    this.exit = node ? { node, n: ++this.counter } : null;
    this.size = to;
    this.busy = true;
    this.setAttribute("data-busy", "");

    if (this.morph !== "none") {
      const both = this.morph === "both";
      this.style.transition = "none";
      this.style.height = `${from.h}px`;
      if (both) this.style.width = `${from.w}px`;
      void this.offsetHeight;
      const t = `${this.duration}ms var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1))`;
      this.style.transition = both ? `height ${t}, width ${t}` : `height ${t}`;
      this.style.height = `${to.h}px`;
      if (both) this.style.width = `${to.w}px`;
    }

    this.timer = window.setTimeout(() => {
      this.style.height = this.style.width = this.style.transition = "";
      this.removeAttribute("data-busy");
      this.busy = false;
      this.exit = null;
    }, this.duration + 30);
  }

  protected override render() {
    // Always the same template, its part closed by a comment: Lit's own range then never reaches the layers a
    // framework appends after it (switching the top-level value would clear everything after Lit's marker)
    return html`${this.exit ? this.exit.node : nothing}<!---->`;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="bx"] {
  --tc-blur-crossfade-duration: 420ms;
  --tc-blur-crossfade-blur: 10px;
  position: relative;
  display: block;
}
[data-ui="bx"][morph="both"] {
  display: inline-block;
  vertical-align: top;
}
/* Clip only while swapping, so shadows and focus rings show the rest of the time */
[data-ui="bx"][data-busy] { overflow: hidden; }

/* Every child is a layer */
[data-ui="bx"] > * { display: block; }
/* The new content takes focus only when focus had to move there (its old control is gone) */
[data-ui="bx"] > :focus-visible {
  outline: var(--tc-focus-ring-width, 2px) solid var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff));
  outline-offset: var(--tc-focus-ring-offset, 2px);
}
[data-ui="bx"][morph="both"] > * { width: max-content; }
[data-ui="bx"] > .ui-bx__layer--out {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
[data-ui="bx"][morph="height"] > .ui-bx__layer--out,
[data-ui="bx"][morph="none"] > .ui-bx__layer--out { right: 0; }
/* With width morph both layers stay centered in the gliding box */
[data-ui="bx"][morph="both"] > .ui-bx__layer--out { left: 50%; translate: -50% 0; }
[data-ui="bx"][morph="both"][data-busy] > :not(.ui-bx__layer--out) { margin-left: 50%; translate: -50% 0; }

[data-ui="bx"][data-busy] > :not(.ui-bx__layer--out) {
  animation: ui-bx-in var(--tc-blur-crossfade-duration) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
}
[data-ui="bx"] > .ui-bx__layer--out {
  animation: ui-bx-out calc(var(--tc-blur-crossfade-duration) * 0.8) var(--tc-ease-in, cubic-bezier(0.4, 0, 1, 1)) both;
}
@keyframes ui-bx-in {
  from { opacity: 0; filter: blur(var(--tc-blur-crossfade-blur)); transform: scale(0.98); }
  to { opacity: 1; filter: blur(0); transform: scale(1); }
}
@keyframes ui-bx-out {
  from { opacity: 1; filter: blur(0); transform: scale(1); }
  to { opacity: 0; filter: blur(var(--tc-blur-crossfade-blur)); transform: scale(1.02); }
}

@media (prefers-reduced-motion: reduce) {
  [data-ui="bx"] > * { animation: none !important; }
  [data-ui="bx"] > .ui-bx__layer--out { display: none; }
}
`;
}

if (!customElements.get("tc-blur-crossfade")) customElements.define("tc-blur-crossfade", TcBlurCrossfade);

declare global {
  interface HTMLElementTagNameMap {
    "tc-blur-crossfade": TcBlurCrossfade;
  }
}
