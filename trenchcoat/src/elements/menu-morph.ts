import { nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { placePopover, type PopoverAlign, type PopoverSide } from "./internal/popover";

/*
 * <tc-menu-morph> – a button that grows into its menu. The menu's surface starts as the button's own box and stretches
 * into the panel, the items rise in a short stagger, and on closing it shrinks back into the button. The trigger and
 * the menu are the page's: mark the button data-menu-trigger and the panel data-menu (its items are buttons or links
 * with role="menuitem", menuitemcheckbox or menuitemradio).
 *
 *   <tc-menu-morph>
 *     <button type="button" data-menu-trigger>Actions</button>
 *     <div data-menu aria-label="Finding actions">
 *       <button type="button" role="menuitem">Assign reviewer</button>
 *       <button type="button" role="menuitem">Export</button>
 *     </div>
 *   </tc-menu-morph>
 *
 * The menu button pattern: the trigger gets aria-haspopup, aria-expanded and aria-controls; the panel role="menu".
 * Click, Enter, Space or ↓ opens on the first item, ↑ on the last. In the menu ↑ ↓ move and wrap, Home / End go to the
 * ends and a letter jumps to the next item starting with it; choosing an item closes the menu (unless the item has
 * data-keep-open) and Escape, Tab or a click outside close it too. Focus goes back to the trigger when it was in the
 * menu. The panel sits in the top layer where the Popover API exists, below the trigger (above when there's no room),
 * and follows it on scroll. With reduced motion it opens and closes without the morph.
 */

export type MenuMorphOpenChange = { open: boolean };
export type MenuMorphAlign = PopoverAlign;
export type MenuMorphSide = PopoverSide;

const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const FALLBACK_DURATION = 240;
const STAGGER = 24;
const MAX_STAGGER = 160;
const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
let next = 0;

/**
 * A button that grows into its menu and shrinks back into itself.
 * @tag tc-menu-morph
 * @fires tc-open-change - The menu is opening or closing ({ open }: MenuMorphOpenChange); cancelable – prevented, `open` stays as it was
 */
export class TcMenuMorph extends TcElement {
  static override ui = "mmo";
  static override looks = false;

  /** Whether the menu is open. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Where the menu lines up with the trigger */
  @property() accessor align: MenuMorphAlign = "start";
  /** The side the menu prefers – it flips when there's no room */
  @property() accessor side: MenuMorphSide = "bottom";
  /** Space between the trigger and the menu, px */
  @property({ type: Number }) accessor gap = 6;
  /** Length of the morph in ms; default the --tc-duration-base token */
  @property({ type: Number }) accessor duration: number | undefined = undefined;

  private running: Animation[] = [];
  /** Where focus goes once it has opened: the first item, the last, or nowhere (a pointer opened it) */
  private focusOnOpen: "first" | "last" | null = null;
  private returnFocus = false;
  private frame = 0;
  private parts?: MutationObserver;
  /** The panel is on screen – open, or still shrinking back after closing */
  private shown = false;

  /** The page's trigger */
  trigger(): HTMLElement | null {
    return this.querySelector<HTMLElement>(":scope > [data-menu-trigger], :scope > * > [data-menu-trigger]");
  }
  /** The page's menu panel */
  panel(): HTMLElement | null {
    return this.querySelector<HTMLElement>(":scope > [data-menu]");
  }
  private items(): HTMLElement[] {
    return [...(this.panel()?.querySelectorAll<HTMLElement>(ITEM) ?? [])].filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.onClick);
    this.addEventListener("keydown", this.onKey);
    this.addEventListener("focusout", this.onFocusOut);
    // A framework can add the parts after the element connects
    this.parts = new MutationObserver(() => this.wire());
    this.parts.observe(this, { childList: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.onClick);
    this.removeEventListener("keydown", this.onKey);
    this.removeEventListener("focusout", this.onFocusOut);
    this.parts?.disconnect();
    this.listen(false);
    this.stop();
    const panel = this.panel();
    if (panel) this.hidePanel(panel);
  }

  /** Opens or closes it, as the trigger would */
  toggle(next = !this.open, focus: "first" | "last" | null = null) {
    if (next === this.open) return;
    if (!this.emit<MenuMorphOpenChange>("tc-open-change", { open: next }, { cancelable: true })) return;
    this.focusOnOpen = next ? focus : null;
    if (!next) {
      const panel = this.panel();
      this.returnFocus = !!panel && panel.contains(document.activeElement);
    }
    this.open = next;
  }

  /** The trigger's and the panel's ARIA, ids and the closed panel's hidden state */
  private wire() {
    const trigger = this.trigger();
    const panel = this.panel();
    if (panel) {
      if (!panel.id) panel.id = `tc-menu-morph-${++next}`;
      if (!panel.hasAttribute("role")) panel.setAttribute("role", "menu");
      if (!panel.hasAttribute("aria-label") && !panel.hasAttribute("aria-labelledby") && trigger) {
        if (!trigger.id) trigger.id = `${panel.id}-trigger`;
        panel.setAttribute("aria-labelledby", trigger.id);
      }
      panel.tabIndex = -1;
      for (const item of panel.querySelectorAll<HTMLElement>(ITEM)) item.tabIndex = -1;
      if (!this.open && !this.shown) panel.hidden = true;
    }
    if (trigger) {
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-expanded", this.open ? "true" : "false");
      if (panel) trigger.setAttribute("aria-controls", panel.id);
    }
  }

  protected override firstUpdated() {
    this.wire();
    if (this.open) this.show(false);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!changed.has("open") || changed.get("open") === undefined) return;
    this.wire();
    if (this.open) this.show(true);
    else this.hide();
  }

  /* ---------- Open and close ---------- */

  private time() {
    return this.duration ?? (Number.parseFloat(getComputedStyle(this).getPropertyValue("--tc-duration-base")) || FALLBACK_DURATION);
  }

  private stop() {
    const running = this.running;
    this.running = [];
    for (const a of running) a.cancel();
  }

  private show(animate: boolean) {
    const panel = this.panel();
    const trigger = this.trigger();
    if (!panel || !trigger) return;
    this.stop();
    this.shown = true;
    panel.hidden = false;
    if (typeof panel.showPopover === "function") {
      if (!panel.hasAttribute("popover")) panel.setAttribute("popover", "manual");
      if (!panel.matches(":popover-open")) {
        try {
          panel.showPopover();
        } catch {
          /* not in the document yet – fixed positioning still works */
        }
      }
    }
    this.place();
    this.listen(true);
    if (animate && !reduced() && this.time() > 0) this.morph(panel, trigger, true);
    const focus = this.focusOnOpen;
    this.focusOnOpen = null;
    const items = this.items();
    const target = focus === "last" ? items[items.length - 1] : focus === "first" ? items[0] : null;
    if (target) this.focusItem(target);
    else if (focus) panel.focus({ preventScroll: true });
  }

  private hide() {
    const panel = this.panel();
    const trigger = this.trigger();
    this.listen(false);
    if (this.returnFocus) trigger?.focus({ preventScroll: true });
    this.returnFocus = false;
    if (!panel) return;
    this.stop();
    if (!trigger || reduced() || this.time() <= 0 || panel.hidden) {
      this.hidePanel(panel);
      return;
    }
    const anim = this.morph(panel, trigger, false);
    void anim?.finished.then(
      () => {
        if (!this.open) this.hidePanel(panel);
        this.stop();
      },
      () => undefined,
    );
    if (!anim) this.hidePanel(panel);
  }

  private hidePanel(panel: HTMLElement) {
    this.shown = false;
    panel.hidden = true;
    panel.removeAttribute("data-side");
    if (panel.hasAttribute("popover") && panel.matches(":popover-open")) panel.hidePopover();
  }

  /** The panel's surface grows out of the trigger's box (or shrinks back into it); its items rise in turn */
  private morph(panel: HTMLElement, trigger: HTMLElement, opening: boolean): Animation | null {
    const p = panel.getBoundingClientRect();
    const t = trigger.getBoundingClientRect();
    if (!p.width || !p.height) return null;
    const above = panel.dataset.side === "top";
    // The trigger-sized window the surface starts from: at the panel's edge nearest the trigger, under its x
    const w = Math.min(t.width, p.width);
    const h = Math.min(t.height, p.height);
    const left = Math.min(Math.max(t.left - p.left, 0), p.width - w);
    const right = p.width - w - left;
    const top = above ? p.height - h : 0;
    const bottom = p.height - h - top;
    const dx = t.left - (p.left + left);
    const dy = above ? t.bottom - p.bottom : t.top - p.top;
    const style = getComputedStyle(this);
    const tr = getComputedStyle(trigger).borderTopLeftRadius || "0px";
    const pr = getComputedStyle(panel).borderTopLeftRadius || "0px";
    const small = { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round ${tr})`, transform: `translate(${dx}px, ${dy}px)`, opacity: 0.85 };
    const full = { clipPath: `inset(0px 0px 0px 0px round ${pr})`, transform: "translate(0px, 0px)", opacity: 1 };
    const duration = opening ? this.time() : this.time() * 0.75;
    const easing = (opening ? style.getPropertyValue("--tc-ease-move") : style.getPropertyValue("--tc-ease-in")).trim() || "ease-out";
    const surface = panel.animate(opening ? [small, full] : [full, { ...small, opacity: 0 }], { duration, easing, fill: "both" });
    const items = [...panel.querySelectorAll<HTMLElement>(ITEM)];
    const step = items.length > 1 ? Math.min(STAGGER, MAX_STAGGER / (items.length - 1)) : 0;
    const rise = items.map((item, i) =>
      item.animate(
        opening
          ? [
              { opacity: 0, transform: `translateY(${above ? -4 : 4}px)` },
              { opacity: 1, transform: "none" },
            ]
          : [{ opacity: 1 }, { opacity: 0 }],
        opening ? { duration: duration * 0.8, delay: duration * 0.25 + i * step, easing, fill: "backwards" } : { duration: duration * 0.4, easing, fill: "forwards" },
      ),
    );
    this.running = [surface, ...rise];
    // Once everything has played, nothing is left holding the panel's styles
    const all = this.running;
    if (opening)
      void Promise.all(all.map((a) => a.finished)).then(
        () => {
          if (this.running === all && this.open) this.stop();
        },
        () => undefined,
      );
    return surface;
  }

  /** Below the trigger, or above when there's no room; lined up by `align` */
  private place = () => {
    this.frame = 0;
    const panel = this.panel();
    const trigger = this.trigger();
    if (!this.open || !panel || !trigger) return;
    const t = trigger.getBoundingClientRect();
    panel.style.minWidth = `${t.width}px`;
    const doc = document.documentElement;
    const at = placePopover(t, { width: panel.offsetWidth, height: panel.offsetHeight }, { width: doc.clientWidth, height: doc.clientHeight }, { side: this.side, align: this.align, gap: this.gap });
    panel.style.left = `${at.left}px`;
    panel.style.top = `${at.top}px`;
    panel.dataset.side = at.side;
  };

  private schedule = () => {
    if (!this.frame) this.frame = requestAnimationFrame(this.place);
  };

  private listen(on: boolean) {
    const m = on ? "addEventListener" : "removeEventListener";
    document[m]("pointerdown", this.onOutside as EventListener, true);
    document[m]("keydown", this.onDocKey as EventListener);
    window[m]("scroll", this.schedule, true);
    window[m]("resize", this.schedule);
    if (!on) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  /* ---------- Pointer and keys ---------- */

  private focusItem(item: HTMLElement) {
    for (const el of this.items()) el.tabIndex = el === item ? 0 : -1;
    item.focus({ preventScroll: true });
  }

  private onClick = (e: MouseEvent) => {
    const target = e.target as Element;
    const trigger = this.trigger();
    if (trigger?.contains(target)) {
      // Opened by a keyboard click (Enter or Space on a button) – put focus on the first item
      this.toggle(!this.open, e.detail === 0 ? "first" : null);
      return;
    }
    const item = target.closest<HTMLElement>(ITEM);
    if (item && this.panel()?.contains(item) && !item.hasAttribute("data-keep-open") && this.open) {
      this.returnFocus = true;
      this.toggle(false);
      // The page may refuse to close; focus stays where it was then
      if (this.open) this.returnFocus = false;
    }
  };

  private onKey = (e: KeyboardEvent) => {
    const trigger = this.trigger();
    const panel = this.panel();
    const target = e.target as Element;
    if (trigger && target === trigger && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      if (!this.open) this.toggle(true, e.key === "ArrowDown" ? "first" : "last");
      else {
        const items = this.items();
        const to = e.key === "ArrowDown" ? items[0] : items[items.length - 1];
        if (to) this.focusItem(to);
      }
      return;
    }
    if (!panel?.contains(target) || !this.open) return;
    const items = this.items();
    const at = items.indexOf(document.activeElement as HTMLElement);
    let to: HTMLElement | undefined;
    if (e.key === "ArrowDown") to = items[(at + 1) % items.length];
    else if (e.key === "ArrowUp") to = items[(at - 1 + items.length) % items.length];
    else if (e.key === "Home") to = items[0];
    else if (e.key === "End") to = items[items.length - 1];
    else if (e.key === "Tab") {
      this.toggle(false);
      return;
    } else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const k = e.key.toLowerCase();
      const order = [...items.slice(at + 1), ...items.slice(0, at + 1)];
      to = order.find((el) => (el.textContent ?? "").trim().toLowerCase().startsWith(k));
    }
    if (to) {
      e.preventDefault();
      this.focusItem(to);
    }
  };

  private onDocKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !this.open || e.defaultPrevented) return;
    const panel = this.panel();
    const trigger = this.trigger();
    const a = document.activeElement;
    // Only the menu that has focus, or the newest open one, answers Escape
    if (a && a !== document.body && !panel?.contains(a) && !trigger?.contains(a)) return;
    e.preventDefault();
    const inside = !!panel?.contains(a);
    this.toggle(false);
    if (!this.open && inside) trigger?.focus({ preventScroll: true });
  };

  private onOutside = (e: PointerEvent) => {
    const path = e.composedPath();
    const panel = this.panel();
    const trigger = this.trigger();
    if ((panel && path.includes(panel)) || (trigger && path.includes(trigger))) return;
    this.toggle(false);
  };

  private onFocusOut = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (!this.open || !to) return;
    const panel = this.panel();
    const trigger = this.trigger();
    if (panel?.contains(to) || trigger?.contains(to)) return;
    this.toggle(false);
  };

  protected override render() {
    return nothing;
  }

  static override css = /* css */ `
[data-ui="mmo"] { display: inline-block; position: relative; }
/* The page's panel: the menu surface, out of flow (the top layer where it exists), placed by the element */
[data-ui="mmo"] > [data-menu] {
  position: fixed;
  inset: auto;
  top: 0;
  left: 0;
  z-index: var(--tc-z-popover);
  box-sizing: border-box;
  max-width: calc(100vw - var(--tc-space-4));
  margin: 0;
  border: 0;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-0-5, 2px);
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  will-change: clip-path, transform;
}
[data-ui="mmo"] > [data-menu][hidden] { display: none; }
[data-ui="mmo"] > [data-menu]:focus { outline: none; }
[data-ui="mmo"] > [data-menu] :is([role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]) {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  box-sizing: border-box;
  width: 100%;
  min-height: var(--tc-menu-item-h);
  margin: 0;
  padding: 0 var(--tc-menu-item-px);
  border: 0;
  border-radius: var(--tc-menu-item-radius);
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--tc-menu-item-font-size);
  text-align: start;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}
[data-ui="mmo"] > [data-menu] :is([role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]):is(:hover, :focus-visible) { background: var(--tc-menu-item-hover); }
[data-ui="mmo"] > [data-menu] :is([role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]):focus-visible {
  outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring);
  outline-offset: calc(var(--tc-focus-ring-width) * -1);
}
[data-ui="mmo"] > [data-menu] [aria-disabled="true"],
[data-ui="mmo"] > [data-menu] [disabled] { color: var(--tc-text-disabled); cursor: default; }
@media (forced-colors: active) {
  [data-ui="mmo"] > [data-menu] { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-menu-morph")) customElements.define("tc-menu-morph", TcMenuMorph);

declare global {
  interface HTMLElementTagNameMap {
    "tc-menu-morph": TcMenuMorph;
  }
}
