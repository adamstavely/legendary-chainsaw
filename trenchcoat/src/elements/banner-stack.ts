import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-banner-stack> – notices that pile up instead of pushing the page down. Put the banners inside it, newest first:
 * the newest sits on top and up to `limit` older ones peek out below it, each a little smaller and dimmed. Hovering
 * the stack, or moving focus into it, spreads them into a full list; leaving, or Escape, gathers them again.
 * Dismissing one – a button inside it with `data-dismiss`, or `dismiss(id)` – slides it away and the rest close the
 * gap. A banner's id is its `data-id`, else its `id`.
 *
 *   <tc-banner-stack label="System notices" limit="3">
 *     <div data-id='export'>Nightly export finished <button data-dismiss>Dismiss</button></div>
 *     <div data-id='sync'>Vendor sync resumed <button data-dismiss>Dismiss</button></div>
 *   </tc-banner-stack>
 *
 * The banners stay where the framework put them and keep their own look; the element only places them. It fires
 * tc-dismiss and, when the banner is still there afterwards, hides it itself – a page that removes it on tc-dismiss
 * gets the same slide, played by a copy. A banner added after the first render drops in and is read out politely
 * (`quiet` turns that off). The stack is a labelled region; banners are read newest first, in the page's order.
 * With reduced motion everything moves at once.
 */

/** tc-dismiss: a banner is being dismissed */
export type BannerStackDismiss = { id: string };
/** tc-expanded-change: the stack is spreading out or gathering */
export type BannerStackExpandedChange = { expanded: boolean };

const GHOST = "data-bst-ghost";
const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Stacked notices – the newest on top, older ones peeking behind – that spread into a list on hover or focus.
 * @tag tc-banner-stack
 * @fires tc-dismiss - A banner is being dismissed ({ id }: BannerStackDismiss); cancelable – prevented, it stays
 * @fires tc-expanded-change - The stack is spreading out or gathering ({ expanded }: BannerStackExpandedChange); cancelable – prevented, it stays as it was
 */
export class TcBannerStack extends TcElement {
  static override ui = "bst";
  static override looks = false;

  /** How many banners show while gathered – the newest and the ones peeking behind it */
  @property({ type: Number }) accessor limit = 3;
  /** Spread into a full list; hover and focus set it, and a page can too */
  @property({ type: Boolean, reflect: true }) accessor expanded = false;
  /** The region's name */
  @property() accessor label = "Notices";
  /** Don't read out banners that arrive */
  @property({ type: Boolean }) accessor quiet = false;

  @state() private accessor spoken = "";

  private mutations?: MutationObserver;
  private resizes?: ResizeObserver;
  private hovered = false;
  /** Escape gathered the stack: it stays gathered until the pointer or focus leaves */
  private held = false;
  private ready = false;

  /** The banners still in the stack, newest first: children that aren't leaving, dismissed or a leaving copy */
  get banners(): HTMLElement[] {
    return this.all().filter((c) => !c.hasAttribute("data-leaving") && !c.hasAttribute("data-dismissed"));
  }

  private all(): HTMLElement[] {
    return [...this.children].filter((c): c is HTMLElement => c instanceof HTMLElement && !c.hasAttribute(GHOST) && !c.classList.contains("ui-bst__status"));
  }

  private idOf(banner: HTMLElement) {
    return banner.dataset.id ?? (banner.id || String(this.all().indexOf(banner)));
  }

  /** Dismisses the banner with this id (its data-id, else its id) */
  dismiss(id: string) {
    const banner = this.banners.find((b) => this.idOf(b) === id);
    if (banner) this.remove1(banner);
  }

  private remove1(banner: HTMLElement) {
    if (!this.emit<BannerStackDismiss>("tc-dismiss", { id: this.idOf(banner) }, { cancelable: true })) return;
    const live = this.banners;
    const at = live.indexOf(banner);
    const hadFocus = banner.contains(document.activeElement);
    banner.setAttribute("data-leaving", "");
    banner.setAttribute("inert", "");
    this.layout();
    if (hadFocus) {
      // Focus goes to the banner that takes its place, so it never drops to the page
      const next = live[at + 1] ?? live[at - 1];
      const target = next?.querySelector<HTMLElement>("[data-dismiss]") ?? next;
      if (target) {
        if (target === next && !next.hasAttribute("tabindex")) next.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      } else this.focusOut();
    }
    this.afterLeaving(banner, () => {
      banner.removeAttribute("data-leaving");
      banner.setAttribute("data-dismissed", "");
    });
  }

  /** Nothing left to focus: the stack gathers and focus is let go */
  private focusOut() {
    (document.activeElement as HTMLElement | null)?.blur?.();
    this.setExpanded(false);
  }

  /** Runs `done` once the banner has slid away – at once with reduced motion */
  private afterLeaving(el: HTMLElement, done: () => void) {
    if (reduced() || !this.ready) return done();
    let over = false;
    const end = () => {
      if (over) return;
      over = true;
      el.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timer);
      done();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === "opacity") end();
    };
    el.addEventListener("transitionend", onEnd);
    const ms = Number.parseFloat(getComputedStyle(el).transitionDuration) * 1000 || 0;
    const timer = window.setTimeout(end, ms + 80);
  }

  /** A banner the page took out leaves as a copy, sliding away from where it was */
  private ghost(banner: HTMLElement) {
    if (banner.hasAttribute("data-dismissed") || reduced() || !this.ready) return;
    const copy = banner.cloneNode(true) as HTMLElement;
    copy.setAttribute(GHOST, "");
    copy.setAttribute("aria-hidden", "true");
    copy.setAttribute("inert", "");
    copy.removeAttribute("id");
    // Queries for the banner by its id find the page's own, never the copy
    copy.removeAttribute("data-id");
    copy.removeAttribute("data-leaving");
    for (const el of copy.querySelectorAll("[id]")) el.removeAttribute("id");
    this.append(copy);
    void copy.offsetWidth;
    copy.setAttribute("data-leaving", "");
    this.afterLeaving(copy, () => copy.remove());
  }

  private setExpanded(expanded: boolean) {
    if (expanded === this.expanded) return;
    if (this.emit<BannerStackExpandedChange>("tc-expanded-change", { expanded }, { cancelable: true })) this.expanded = expanded;
  }

  private onEnter = () => {
    this.hovered = true;
    if (!this.held) this.setExpanded(true);
  };
  private onLeave = () => {
    this.hovered = false;
    this.held = false;
    if (!this.contains(document.activeElement)) this.setExpanded(false);
  };
  private onFocusIn = () => {
    if (!this.held) this.setExpanded(true);
  };
  private onFocusOut = (e: FocusEvent) => {
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
    this.held = false;
    if (!this.hovered) this.setExpanded(false);
  };
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !this.expanded) return;
    this.held = true;
    this.setExpanded(false);
  };
  private onClick = (e: MouseEvent) => {
    const trigger = (e.target as Element).closest?.("[data-dismiss]");
    if (!trigger) return;
    const banner = this.banners.find((b) => b.contains(trigger));
    if (banner) this.remove1(banner);
  };

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerenter", this.onEnter);
    this.addEventListener("pointerleave", this.onLeave);
    this.addEventListener("focusin", this.onFocusIn);
    this.addEventListener("focusout", this.onFocusOut);
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("click", this.onClick);
    this.mutations = new MutationObserver((records) => {
      let changed = false;
      for (const r of records) {
        for (const n of r.removedNodes) {
          if (!(n instanceof HTMLElement) || n.hasAttribute(GHOST) || n.classList.contains("ui-bst__status")) continue;
          changed = true;
          this.ghost(n);
        }
        for (const n of r.addedNodes) {
          if (!(n instanceof HTMLElement) || n.hasAttribute(GHOST) || n.classList.contains("ui-bst__status")) continue;
          changed = true;
          if (this.ready) this.arrive(n);
        }
      }
      if (changed) this.layout();
    });
    this.mutations.observe(this, { childList: true });
    if (typeof ResizeObserver !== "undefined") this.resizes = new ResizeObserver(() => this.layout());
    this.layout();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("pointerenter", this.onEnter);
    this.removeEventListener("pointerleave", this.onLeave);
    this.removeEventListener("focusin", this.onFocusIn);
    this.removeEventListener("focusout", this.onFocusOut);
    this.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("click", this.onClick);
    this.mutations?.disconnect();
    this.resizes?.disconnect();
  }

  /** A new banner drops in, and is read out unless the stack is quiet */
  private arrive(banner: HTMLElement) {
    if (!reduced()) {
      banner.setAttribute("data-arriving", "");
      banner.addEventListener("animationend", () => banner.removeAttribute("data-arriving"), { once: true });
    }
    if (!this.quiet) this.spoken = (banner.dataset.label ?? banner.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (changed.has("label")) this.setAttribute("aria-label", this.label);
    this.layout();
    if (!this.ready) {
      // The first places are set without moving; from the next frame on, changes glide
      requestAnimationFrame(() => {
        this.ready = true;
        this.setAttribute("data-ready", "");
      });
    }
  }

  /** Places every banner: its depth and the heights above it, which the CSS turns into where it sits */
  private layout() {
    const banners = this.banners;
    const limit = Math.max(1, Math.floor(this.limit) || 1);
    let top = 0;
    banners.forEach((b, i) => {
      this.resizes?.observe(b);
      const h = b.offsetHeight;
      const d = Math.min(i, limit - 1);
      b.setAttribute("data-bst-item", "");
      b.style.setProperty("--tc-bst-i", String(i));
      b.style.setProperty("--tc-bst-d", String(d));
      b.style.setProperty("--tc-bst-h", `${h}px`);
      b.style.setProperty("--tc-bst-top", `${top}px`);
      b.style.setProperty("--tc-bst-z", String(banners.length - i));
      b.toggleAttribute("data-bst-behind", i > 0);
      b.toggleAttribute("data-bst-over", i >= limit);
      top += h;
    });
    this.style.setProperty("--tc-bst-front", `${banners[0]?.offsetHeight ?? 0}px`);
    this.style.setProperty("--tc-bst-total", `${top}px`);
    this.style.setProperty("--tc-bst-n", String(banners.length));
    this.style.setProperty("--tc-bst-shown", String(Math.min(banners.length, limit)));
  }

  protected override render() {
    return this.quiet ? nothing : html`<span class="ui-bst__status tc-sr-only" role="status">${this.spoken}</span>`;
  }

  static override css = /* css */ `
[data-ui="bst"] {
  --tc-bst-peek: var(--tc-space-2);
  --tc-bst-gap: var(--tc-space-2);
  --tc-bst-shrink: 0.05;
  --tc-bst-dim: color-mix(in srgb, var(--tc-surface-tray) 55%, transparent);
  --tc-bst-front: 0px;
  --tc-bst-total: 0px;
  --tc-bst-n: 0;
  --tc-bst-shown: 0;
  position: relative;
  display: block;
  height: max(0px, calc(var(--tc-bst-front) + (var(--tc-bst-shown) - 1) * var(--tc-bst-peek)));
}
[data-ui="bst"][expanded] {
  height: max(0px, calc(var(--tc-bst-total) + (var(--tc-bst-n) - 1) * var(--tc-bst-gap)));
}
[data-ui="bst"] > [data-bst-item], [data-ui="bst"] > [data-bst-ghost] {
  --tc-bst-x: 0px;
  /* Gathered: each one's bottom edge sits a peek below the one in front, and nothing shows above the front one */
  --tc-bst-y: calc(var(--tc-bst-front) + var(--tc-bst-d) * var(--tc-bst-peek) - var(--tc-bst-h));
  --tc-bst-s: calc(1 - var(--tc-bst-d) * var(--tc-bst-shrink));
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--tc-bst-z);
  box-sizing: border-box;
  transform-origin: 50% 100%;
  transform: translate(var(--tc-bst-x), var(--tc-bst-y)) scale(var(--tc-bst-s));
  clip-path: inset(max(0px, calc(var(--tc-bst-y) * -1)) 0 0 0);
}
[data-ui="bst"][expanded] > [data-bst-item], [data-ui="bst"][expanded] > [data-bst-ghost] {
  --tc-bst-y: calc(var(--tc-bst-top) + var(--tc-bst-i) * var(--tc-bst-gap));
  --tc-bst-s: 1;
}
[data-ui="bst"][data-ready] > [data-bst-item], [data-ui="bst"][data-ready] > [data-bst-ghost] {
  transition: transform var(--tc-duration-slow) var(--tc-ease-move), clip-path var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
[data-ui="bst"][data-ready] { transition: height var(--tc-duration-slow) var(--tc-ease-move); }
/* Older ones behind the front are dimmed with the tray colour, not faded */
[data-ui="bst"] > [data-bst-item]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-bst-dim);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
[data-ui="bst"]:not([expanded]) > [data-bst-behind]::after { opacity: 1; }
[data-ui="bst"]:not([expanded]) > [data-bst-behind] { pointer-events: none; }
[data-ui="bst"]:not([expanded]) > [data-bst-over] { opacity: 0; }
[data-ui="bst"] > [data-leaving] { --tc-bst-x: calc(100% + var(--tc-space-4)); opacity: 0; pointer-events: none; }
/* A banner's own inline display mustn't bring a dismissed one back */
[data-ui="bst"] > [data-dismissed] { display: none !important; }
[data-ui="bst"] > [data-arriving] { animation: ui-bst-in var(--tc-duration-slow) var(--tc-ease-move) both; }
@keyframes ui-bst-in { from { opacity: 0; translate: 0 calc(var(--tc-space-4) * -1); } to { opacity: 1; translate: none; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="bst"][data-ready], [data-ui="bst"][data-ready] > *, [data-ui="bst"] > [data-bst-item]::after { transition: none; }
  [data-ui="bst"] > [data-arriving] { animation: none; }
}
`;
}

if (!customElements.get("tc-banner-stack")) customElements.define("tc-banner-stack", TcBannerStack);

declare global {
  interface HTMLElementTagNameMap {
    "tc-banner-stack": TcBannerStack;
  }
}
