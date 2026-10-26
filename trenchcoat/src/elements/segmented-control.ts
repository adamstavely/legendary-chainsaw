import { html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { AriaForwardController } from "./internal/controllers";

/*
 * <tc-segmented-control> – the Lit port of src/components/segmented-control.tsx: switch between two to six options.
 * "tray": a gray track with a white raised pill; "underline": text tabs with a sliding line; "buttons" (Clean only,
 * its default): separate quiet chips, the active one filled. The indicator glides to the picked option – its leading
 * edge runs ahead, so it stretches a little and settles. Arrow keys, Home and End move and select; press the pill and
 * drag it across the options to pick as you go. If it doesn't fit, it scrolls sideways with soft edges.
 *
 *   <tc-segmented-control aria-label="View" .options=${[{ value: "list", label: "List" }, { value: "grid", label: "Grid" }]}>
 *   </tc-segmented-control>
 *
 * aria-label / aria-labelledby on the host name the radiogroup (or tablist) inside. Every pick fires a cancelable
 * `tc-value-change` ({ value }): call preventDefault() to keep control of `value` yourself. With `name`, a hidden input
 * submits the value with the surrounding form.
 */

export type SegmentOption = {
  value: string;
  /** Text, or an element (cloned) */
  label?: string | Element;
  /** An icon element (cloned) */
  icon?: Element;
  /** A small gray number after the label, e.g. unread items */
  count?: number | string;
  /** A small tinted tag after the label, e.g. "Save 20%" – text, or an element (cloned) */
  badge?: string | Element;
  disabled?: boolean;
  /** Accessible name – needed when the option only shows an icon */
  ariaLabel?: string;
  /** With kind="tabs": the id of the panel this tab shows */
  controls?: string;
};

export type SegmentValueChange = { value: string };
export type SegmentValueChangeEvent = CustomEvent<SegmentValueChange>;

type Press = { id: number; touch: boolean; drag: boolean; x: number; moved: boolean };

const show = (v: string | Element) => (typeof v === "string" ? v : v.cloneNode(true));

/**
 * Switch between two to six options, with a sliding indicator.
 * @tag tc-segmented-control
 * @fires tc-value-change - The user picked an option ({ value }: SegmentValueChange); cancelable
 */
export class TcSegmentedControl extends TcElement {
  static override ui = "seg";

  @property({ attribute: false }) accessor options: SegmentOption[] = [];
  /** The picked value; unset picks the first enabled option. Changed by the user unless a tc-value-change listener
   *  calls preventDefault() */
  @property() accessor value: string | undefined = undefined;
  @property() accessor size: "sm" | "md" | "lg" = "md";
  /** "tray", "underline" or "buttons" (Clean only – Standard shows it as "tray"). Unset: "tray" in Standard, "buttons" in Clean */
  @property() accessor variant: "buttons" | "tray" | "underline" | undefined = undefined;
  /** Fill the container with equal segments */
  @property({ type: Boolean, attribute: "full-width" }) accessor fullWidth = false;
  /** "radio" (a radiogroup, the default) or "tabs" (a tablist that switches panels) */
  @property() accessor kind: "radio" | "tabs" = "radio";
  @property({ type: Boolean }) accessor disabled = false;
  /** Submits the picked value with a native form, through a hidden input */
  @property() accessor name: string | undefined = undefined;
  /** The id of the form the hidden input belongs to, when the control sits outside it */
  @property() accessor form: string | undefined = undefined;

  /** Latest value without waiting for a render – dragging picks several options in one frame */
  private latest: string | undefined = undefined;
  private press: Press | null = null;
  private gliding = false;
  private glideTimer = 0;
  private placed: string | undefined | null = null;
  private layoutKey = "";
  private ro?: ResizeObserver;
  private roFrame = 0;
  private readyFrame = 0;

  constructor() {
    super();
    new AriaForwardController(this, () => this.track);
  }

  private get track() {
    return this.querySelector<HTMLElement>(":scope > .ui-seg__scroller > .ui-seg__track");
  }
  private get scroller() {
    return this.querySelector<HTMLElement>(":scope > .ui-seg__scroller");
  }
  private get pill() {
    return this.track?.querySelector<HTMLElement>(":scope > .ui-seg__pill") ?? null;
  }
  private buttons() {
    return Array.from(this.track?.querySelectorAll<HTMLElement>(":scope > .ui-seg__opt") ?? []);
  }

  /** @internal The variant in use */
  get resolvedVariant() {
    const clean = this.resolvedLook === "clean";
    return this.variant === "buttons" && !clean ? "tray" : (this.variant ?? (clean ? "buttons" : "tray"));
  }

  /** @internal The value in use: `value`, else the first enabled option */
  get current() {
    return this.value ?? this.options.find((o) => !o.disabled)?.value;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Observers cleared on disconnect are set up again
    if (this.hasUpdated) this.requestUpdate();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    this.layoutKey = "";
    cancelAnimationFrame(this.roFrame);
    cancelAnimationFrame(this.readyFrame);
    clearTimeout(this.glideTimer);
    this.gliding = false;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.latest = this.current;
    this.dataset.size = this.size;
    this.dataset.variant = this.resolvedVariant;
    this.toggleAttribute("data-full", this.fullWidth);
    this.toggleAttribute("data-disabled", this.disabled);
  }

  protected override updated() {
    // Sizes: measured on first render and whenever an option, a label, the container or the font changes
    const key = [this.options.map((o) => o.value).join("\u0000"), this.fullWidth, this.resolvedVariant, this.size].join("|");
    if (key !== this.layoutKey) {
      this.layoutKey = key;
      this.observe();
    }
    // A new value: the pill glides there, focus follows if it was inside, and a scrolling control brings it into view
    const current = this.current;
    if (this.placed !== current) {
      const first = this.placed === null;
      this.placed = current;
      if (!first) {
        this.gliding = true;
        clearTimeout(this.glideTimer);
        this.glideTimer = window.setTimeout(() => (this.gliding = false), this.resolvedLook === "clean" ? 240 : 440);
      }
      this.place(!first);
      this.reveal(!first);
      const t = this.track;
      const at = this.options.findIndex((o) => o.value === current);
      if (!first && t && t.contains(document.activeElement)) this.buttons()[at]?.focus({ preventScroll: true });
    }
  }

  private observe() {
    const t = this.track;
    const s = this.scroller;
    this.ro?.disconnect();
    cancelAnimationFrame(this.roFrame);
    cancelAnimationFrame(this.readyFrame);
    if (!t || !s) return;
    const sync = () => {
      this.measure();
      this.place(false);
      this.fades();
    };
    sync();
    // Width transitions only after the first measure, so nothing grows in on load
    this.readyFrame = requestAnimationFrame(() => this.setAttribute("data-ready", ""));
    if (typeof ResizeObserver !== "function") return;
    // One frame later, so setting widths inside the observer never loops
    this.ro = new ResizeObserver(() => {
      cancelAnimationFrame(this.roFrame);
      this.roFrame = requestAnimationFrame(sync);
    });
    this.ro.observe(s);
    this.ro.observe(t);
    t.querySelectorAll(".ui-seg__opt, .ui-seg__content").forEach((el) => this.ro!.observe(el));
  }

  /** Buttons get the width of their content, so a changed label or count makes them – and the control – glide to the new size */
  private measure() {
    const els = this.buttons();
    const t = this.track;
    if (!els.length || !t) return;
    const cs = getComputedStyle(els[0]);
    const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const widths = els.map((b) => (b.firstElementChild as HTMLElement).offsetWidth + pad);
    if (this.fullWidth) {
      t.style.setProperty("--tc-segmented-control-min", `${Math.max(...widths)}px`);
      els.forEach((b) => (b.style.width = ""));
    } else els.forEach((b, i) => (b.style.width = `${widths[i]}px`));
  }

  /** Moves the pill (or line) under the active option. Without `animate` it follows at once – unless a glide is still running */
  private place(animate: boolean) {
    const t = this.track;
    const p = this.pill;
    if (!t || !p) return;
    const btn = t.querySelector<HTMLElement>(":scope > .ui-seg__opt[data-active]");
    if (!btn || !btn.offsetWidth) {
      p.style.opacity = "0";
      return;
    }
    // Every read first (the track's width too), then the writes – one layout, not one per write
    const trackW = t.clientWidth;
    let x = btn.offsetLeft;
    let w = btn.offsetWidth;
    // The line sits under the text only, not under the whole button
    if (this.resolvedVariant === "underline") {
      const content = btn.firstElementChild as HTMLElement;
      x += content.offsetLeft;
      w = content.offsetWidth;
    }
    const instant = !p.dataset.ready || (!animate && !this.gliding);
    const prev = parseFloat(p.style.left) || 0;
    // The edge facing the target leads, the other one trails – the stretch
    if (!instant && x !== prev) p.dataset.dir = x > prev ? "right" : "left";
    if (instant) p.style.transition = "none";
    p.style.opacity = "1";
    p.style.left = `${x}px`;
    p.style.right = `${trackW - x - w}px`;
    if (instant) {
      p.dataset.ready = "1";
      void p.offsetWidth;
      p.style.transition = "";
    }
  }

  /** Soft edges only on the sides that can scroll – reads first, then writes */
  private fades() {
    const s = this.scroller;
    if (!s) return;
    const max = s.scrollWidth - s.clientWidth;
    const left = s.scrollLeft;
    this.toggleAttribute("data-overflow", max > 1);
    s.style.setProperty("--tc-segmented-control-fade-l", left > 1 ? "24px" : "0px");
    s.style.setProperty("--tc-segmented-control-fade-r", left < max - 1 ? "24px" : "0px");
  }

  /** Keeps the active option in view when the control scrolls */
  private reveal(smooth: boolean) {
    const s = this.scroller;
    const t = this.track;
    const btn = t?.querySelector<HTMLElement>(":scope > .ui-seg__opt[data-active]");
    if (!s || !t || !btn || s.scrollWidth <= s.clientWidth + 1) return;
    const left = t.offsetLeft + btn.offsetLeft - (s.clientWidth - btn.offsetWidth) / 2;
    s.scrollTo({ left: Math.max(0, left), behavior: smooth ? "smooth" : "auto" });
  }

  private select(v: string) {
    const opt = this.options.find((o) => o.value === v);
    if (!opt || opt.disabled || this.disabled || v === this.latest) return;
    this.latest = v;
    if (this.emit<SegmentValueChange>("tc-value-change", { value: v }, { cancelable: true })) this.value = v;
  }

  /* ---------- Keyboard ---------- */

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    const enabled = this.options.filter((o) => !o.disabled);
    if (!enabled.length || this.disabled) return;
    const radio = this.kind === "radio";
    const prevKeys = radio ? ["ArrowLeft", "ArrowUp"] : ["ArrowLeft"];
    const nextKeys = radio ? ["ArrowRight", "ArrowDown"] : ["ArrowRight"];
    const at = enabled.findIndex((o) => o.value === this.latest);
    let target: SegmentOption | undefined;
    if (prevKeys.includes(e.key)) target = enabled[(at - 1 + enabled.length) % enabled.length];
    else if (nextKeys.includes(e.key)) target = enabled[(at + 1) % enabled.length];
    else if (e.key === "Home") target = enabled[0];
    else if (e.key === "End") target = enabled[enabled.length - 1];
    if (!target) return;
    e.preventDefault();
    this.select(target.value);
    this.buttons()[this.options.indexOf(target)]?.focus();
  };

  /* ---------- Pointer: press feedback and dragging across options ----------
   * A plain press picks on release (2.5.2 – pressing and sliding off picks nothing); dragging picks as it goes and is
   * undone by dragging back. Touch only drags the pill itself, so swiping to scroll doesn't pick */

  /** The option under (or nearest to) a horizontal pointer position */
  private optionAt(clientX: number) {
    let best = -1;
    let dist = Infinity;
    this.buttons().forEach((b, i) => {
      const r = b.getBoundingClientRect();
      const d = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0;
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return this.options[best];
  }

  private endPress = () => {
    this.press = null;
    this.removeAttribute("data-pressed");
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.disabled || e.button !== 0) return;
    const opt = this.optionAt(e.clientX);
    if (!opt || opt.disabled) return;
    const touch = e.pointerType === "touch";
    // Touch: the pill itself can be dragged right away; a mouse can drag from anywhere
    const drag = !touch || opt.value === this.latest;
    this.press = { id: e.pointerId, touch, drag, x: e.clientX, moved: false };
    if (drag) this.setAttribute("data-pressed", "");
    if (!touch) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* capture is a nicety */
      }
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = this.press;
    if (!p || p.id !== e.pointerId) return;
    if (!p.moved && Math.abs(e.clientX - p.x) < (p.touch ? 8 : 3)) return;
    p.moved = true;
    if (!p.drag) return;
    const opt = this.optionAt(e.clientX);
    if (opt && !opt.disabled) this.select(opt.value);
  };

  private onPointerUp = (e: PointerEvent) => {
    const p = this.press;
    if (!p || p.id !== e.pointerId) return;
    if (!p.moved) {
      // Released over the control (not dragged off it): pick the option under the pointer
      const box = this.getBoundingClientRect();
      const inside = !box.width || (e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom);
      const opt = this.optionAt(e.clientX);
      if (opt && inside) this.select(opt.value);
    }
    this.endPress();
  };

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const isTabs = this.kind === "tabs";
    const current = this.current;
    const activeIndex = this.options.findIndex((o) => o.value === current);
    const tabbable = activeIndex >= 0 ? activeIndex : this.options.findIndex((o) => !o.disabled);
    return html`
      <div class="ui-seg__scroller" @scroll=${() => this.fades()}>
        <div
          class="ui-seg__track"
          role=${isTabs ? "tablist" : "radiogroup"}
          aria-disabled=${ifDefined(this.disabled ? "true" : undefined)}
          aria-orientation=${ifDefined(isTabs ? "horizontal" : undefined)}
          @keydown=${this.onKeyDown}
          @pointerdown=${this.onPointerDown}
          @pointermove=${this.onPointerMove}
          @pointerup=${this.onPointerUp}
          @pointercancel=${this.endPress}
          @lostpointercapture=${this.endPress}
        >
          <span class="ui-seg__pill" aria-hidden="true"></span>
          ${repeat(
            this.options,
            (o) => o.value,
            (o, i) => {
              const active = i === activeIndex;
              return html`<button
                type="button"
                class="ui-seg__opt"
                role=${isTabs ? "tab" : "radio"}
                aria-checked=${ifDefined(isTabs ? undefined : (active ? "true" : "false"))}
                aria-selected=${ifDefined(isTabs ? (active ? "true" : "false") : undefined)}
                aria-controls=${ifDefined(isTabs ? o.controls : undefined)}
                aria-label=${ifDefined(o.ariaLabel)}
                ?data-active=${active}
                ?disabled=${!!o.disabled || this.disabled}
                tabindex=${i === tabbable ? 0 : -1}
                @click=${() => this.select(o.value)}
              ><span class="ui-seg__content">${o.icon ? html`<span class="ui-seg__icon">${o.icon.cloneNode(true)}</span>` : nothing}${o.label != null
                ? clean
                  ? html`<span class="ui-seg__label">${show(o.label)}</span>`
                  : html`<span class="ui-seg__label"><span class="ui-seg__text">${show(o.label)}</span><span class="ui-seg__text ui-seg__text-bold" aria-hidden="true">${show(o.label)}</span></span>`
                : nothing}${o.count != null ? keyed(String(o.count), html`<span class="ui-seg__count">${o.count}</span>`) : nothing}${o.badge != null
                ? html`<span class="ui-seg__badge">${show(o.badge)}</span>`
                : nothing}</span></button>`;
            },
          )}
        </div>
      </div>
      ${this.name !== undefined ? html`<input type="hidden" name=${this.name} form=${ifDefined(this.form)} .value=${current ?? ""} ?disabled=${this.disabled} />` : nothing}
    `;
  }

  static override css = /* css */ `
/* Animatable custom properties: the equal segment width and the soft edges glide too */
@property --tc-segmented-control-min { syntax: "<length>"; inherits: true; initial-value: 0px; }
@property --tc-segmented-control-fade-l { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --tc-segmented-control-fade-r { syntax: "<length>"; inherits: false; initial-value: 0px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"] {
  /* Size: md – the segmented pattern: track --tc-seg-*, options as tall as a control */
  --tc-segmented-control-h: var(--tc-control-h-md);
  --tc-segmented-control-px: var(--tc-control-px-md);
  --tc-segmented-control-fs: var(--tc-font-size-md);
  --tc-segmented-control-radius: var(--tc-seg-track-radius);
  --tc-segmented-control-pad: var(--tc-seg-pad);
  --tc-segmented-control-icon: 15px;
  --tc-segmented-control-gap: 20px;
  box-sizing: border-box;
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  vertical-align: middle;
  border-radius: var(--tc-segmented-control-radius);
  background: var(--tc-seg-track-bg);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-segmented-control-fs);
  line-height: var(--tc-line-height-none);
  color: var(--tc-text-muted);
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-size="sm"] { --tc-segmented-control-h: 26px; --tc-segmented-control-px: var(--tc-control-px-sm); --tc-segmented-control-fs: var(--tc-font-size-sm); --tc-segmented-control-icon: 14px; --tc-segmented-control-gap: 16px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-size="lg"] { --tc-segmented-control-h: var(--tc-control-h-lg); --tc-segmented-control-px: var(--tc-control-px-lg); --tc-segmented-control-fs: var(--tc-font-size-lg); --tc-segmented-control-icon: 16px; --tc-segmented-control-gap: 24px; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"] {
  /* Size: md – control-height chips */
  --tc-segmented-control-h: var(--tc-control-h-md);
  --tc-segmented-control-px: var(--tc-control-px-md);
  --tc-segmented-control-fs: var(--tc-font-size-md);
  --tc-segmented-control-lh: var(--tc-line-height-normal);
  --tc-segmented-control-icon: 16px;
  --tc-segmented-control-gap: 8px;
  --tc-segmented-control-pad: var(--tc-seg-pad);
  --tc-segmented-control-ring: 3px;
  box-sizing: border-box;
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  vertical-align: middle;
  border-radius: var(--tc-seg-track-radius);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-segmented-control-fs);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-segmented-control-lh);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-size="sm"] { --tc-segmented-control-h: var(--tc-control-h-sm); --tc-segmented-control-px: var(--tc-control-px-sm); --tc-segmented-control-fs: var(--tc-font-size-sm); --tc-segmented-control-lh: var(--tc-line-height-tight); --tc-segmented-control-icon: 14px; --tc-segmented-control-gap: 6px; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-size="lg"] { --tc-segmented-control-h: var(--tc-control-h-lg); --tc-segmented-control-px: var(--tc-control-px-lg); --tc-segmented-control-icon: 16px; --tc-segmented-control-gap: 8px; }
[data-ui="seg"][data-full] { display: flex; width: 100%; }
[data-ui="seg"][data-disabled] { opacity: 0.5; pointer-events: none; }
[data-ui="seg"] *, [data-ui="seg"] *::before, [data-ui="seg"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *):where([data-ui="seg"]) button { margin: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="seg"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="seg"]) svg { display: block; flex: none; }
/* Scrolls sideways only when it doesn't fit; the padding keeps focus rings from being cut off */
:where([data-look="standard"], [data-look="standard"] *).ui-seg__scroller {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: var(--tc-segmented-control-pad);
  border-radius: inherit;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--tc-segmented-control-fade-l), #000 calc(100% - var(--tc-segmented-control-fade-r)), transparent);
  mask-image: linear-gradient(to right, transparent, #000 var(--tc-segmented-control-fade-l), #000 calc(100% - var(--tc-segmented-control-fade-r)), transparent);
  transition: --tc-segmented-control-fade-l var(--tc-duration-base) var(--tc-ease-standard), --tc-segmented-control-fade-r var(--tc-duration-base) var(--tc-ease-standard);
}
/* Scrolls sideways only when it doesn't fit; the padding keeps focus rings from being cut off */
:where([data-look="clean"], [data-look="clean"] *).ui-seg__scroller {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: var(--tc-segmented-control-pad);
  border-radius: inherit;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--tc-segmented-control-fade-l), #000 calc(100% - var(--tc-segmented-control-fade-r)), transparent);
  mask-image: linear-gradient(to right, transparent, #000 var(--tc-segmented-control-fade-l), #000 calc(100% - var(--tc-segmented-control-fade-r)), transparent);
  transition: --tc-segmented-control-fade-l var(--tc-duration-fast) var(--tc-ease-standard), --tc-segmented-control-fade-r var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-seg__scroller::-webkit-scrollbar { display: none; }
.ui-seg__track {
  position: relative;
  display: flex;
  width: max-content;
  min-width: 100%;
  /* Horizontal drags move the pill; vertical ones still scroll the page */
  touch-action: pan-y;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
/* When it scrolls, swipes scroll it instead of dragging the pill */
[data-ui="seg"][data-overflow] .ui-seg__track { touch-action: pan-x pan-y; }
/* Equal segments, each as wide as the widest one needs */
[data-ui="seg"][data-full] .ui-seg__track { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(var(--tc-segmented-control-min), 1fr); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-ready] .ui-seg__track { transition: --tc-segmented-control-min var(--tc-duration-slow) var(--tc-ease-move); }
/* An option */
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt {
  position: relative;
  z-index: 1;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  height: var(--tc-segmented-control-h);
  padding: 0 var(--tc-segmented-control-px);
  overflow: clip;
  border-radius: calc(var(--tc-segmented-control-radius) - var(--tc-segmented-control-pad));
  white-space: nowrap;
  transition: color var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-ready]:not([data-full]) .ui-seg__opt { transition: color var(--tc-duration-base) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-ready] .ui-seg__track { transition: --tc-segmented-control-min var(--tc-duration-base) var(--tc-ease-move); }
/* An option */
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt {
  position: relative;
  z-index: 1;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  height: var(--tc-segmented-control-h);
  padding: 0 var(--tc-segmented-control-px);
  overflow: clip;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  white-space: nowrap;
  /* Hover washes are short and crisp, in and out */
  transition: color var(--tc-duration-instant) var(--tc-ease-standard), background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-ready]:not([data-full]) .ui-seg__opt { transition: color var(--tc-duration-instant) var(--tc-ease-standard), background-color var(--tc-duration-instant) var(--tc-ease-standard), width var(--tc-duration-base) var(--tc-ease-move); }
.ui-seg__opt[data-active] { color: var(--tc-text-primary); }
.ui-seg__opt:disabled { opacity: 0.4; cursor: not-allowed; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt:focus-visible { outline: var(--tc-focus-outline); outline-offset: 0; }
@media (hover: hover) {
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt:not([data-active]):not(:disabled):hover { color: var(--tc-text-secondary); }
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt:not([data-active]):not(:disabled):hover { background-color: var(--tc-fill-subtle); }
}
.ui-seg__content { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__icon { display: grid; place-items: center; width: var(--tc-segmented-control-icon); height: var(--tc-segmented-control-icon); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-size="sm"] .ui-seg__content { gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__icon { display: grid; place-items: center; width: var(--tc-segmented-control-icon); height: var(--tc-segmented-control-icon); color: var(--tc-icon-muted); transition: color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt[data-active] .ui-seg__icon { color: var(--tc-text-primary); }
.ui-seg__icon svg { width: 100%; height: 100%; }
/* Regular and semibold copies of the label crossfade */
:where([data-look="standard"], [data-look="standard"] *).ui-seg__label { display: grid; justify-items: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__text { grid-area: 1 / 1; font-weight: var(--tc-font-weight-medium); transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__text-bold { font-weight: var(--tc-font-weight-strong); opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt[data-active] .ui-seg__text { opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt[data-active] .ui-seg__text-bold { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__count {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary);
  animation: ui-seg-in var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-size="sm"] .ui-seg__count { min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-2xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 var(--tc-space-1-5);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  color: var(--tc-accent-text);
}
/* The indicator: left and right edges glide separately – the one facing the target leads, so it stretches and settles */
:where([data-look="standard"], [data-look="standard"] *).ui-seg__pill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 100%;
  z-index: 0;
  border-radius: calc(var(--tc-segmented-control-radius) - var(--tc-segmented-control-pad));
  background: var(--tc-seg-thumb-bg);
  box-shadow: var(--tc-seg-thumb-shadow);
  opacity: 0;
  pointer-events: none;
  transition: left var(--tc-duration-slower) var(--tc-ease-move), right var(--tc-duration-slower) var(--tc-ease-move), scale var(--tc-duration-base) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-seg__pill[data-dir="right"] { transition-duration: var(--tc-duration-slower), var(--tc-duration-moderate), var(--tc-duration-base), var(--tc-duration-fast); }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__pill[data-dir="left"] { transition-duration: var(--tc-duration-moderate), var(--tc-duration-slower), var(--tc-duration-base), var(--tc-duration-fast); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__label { display: block; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__count {
  display: inline-grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  font-size: var(--tc-pill-font-size);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary);
  animation: ui-seg-in-clean var(--tc-duration-base) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt[data-active] .ui-seg__count { background: var(--tc-surface-raised); box-shadow: 0 0 0 0.5px var(--tc-border-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-size="sm"] .ui-seg__count { min-width: 14px; height: 14px; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-2xs); line-height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 var(--tc-space-1-5);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  font-size: var(--tc-font-size-xs);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-accent-text);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-size="sm"] .ui-seg__badge { height: 16px; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-2xs); }
/* The indicator: left and right edges slide separately – the one facing the target leads a touch. Short and crisp */
:where([data-look="clean"], [data-look="clean"] *).ui-seg__pill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 100%;
  z-index: 0;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  background: var(--tc-fill-selected);
  box-shadow: inset 0 0 0 1px var(--tc-border-selected);
  opacity: 0;
  pointer-events: none;
  transition: left var(--tc-duration-base) var(--tc-ease-move), right var(--tc-duration-base) var(--tc-ease-move), scale var(--tc-duration-quick) var(--tc-ease-move), opacity var(--tc-duration-quick) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg__pill[data-dir="right"] { transition-duration: var(--tc-duration-base), var(--tc-duration-fast), var(--tc-duration-quick), var(--tc-duration-quick); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__pill[data-dir="left"] { transition-duration: var(--tc-duration-fast), var(--tc-duration-base), var(--tc-duration-quick), var(--tc-duration-quick); }
/* Press feedback: the pill gives a little while held or dragged */
[data-ui="seg"][data-pressed]:not([data-variant="underline"]) .ui-seg__pill { scale: 0.97; }
/* Underline variant: text tabs on a hairline */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-variant="underline"] { --tc-segmented-control-px: 2px; border-radius: 0; background: none; box-shadow: inset 0 -1px 0 var(--tc-border-default); }
/* Buttons (default): separate chips with a hairline; the light-gray fill slides to the active one.
   The control reaches a few px past its box so focus rings are never clipped, and still lines up with its neighbours */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="buttons"] { --tc-segmented-control-pad: var(--tc-segmented-control-ring); margin: calc(var(--tc-segmented-control-ring) * -1); max-width: calc(100% + var(--tc-segmented-control-ring) * 2); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="buttons"][data-full] { width: calc(100% + var(--tc-segmented-control-ring) * 2); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="buttons"] .ui-seg__track { gap: var(--tc-segmented-control-gap); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="buttons"] .ui-seg__opt { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
/* Selected = fill-selected + a 1px border-selected ring on the sliding chip (≥ 3:1, not a fill alone) */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="buttons"] .ui-seg__opt[data-active] { box-shadow: none; }
/* Tray: the segmented pattern – a light-gray track with a raised thumb; options stay at least 24px tall (2.5.8) */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="tray"] { background: var(--tc-seg-track-bg); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="tray"] .ui-seg__opt { height: max(24px, calc(var(--tc-segmented-control-h) - var(--tc-segmented-control-pad) * 2)); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="tray"] .ui-seg__pill { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); }
/* Underline: text tabs on a hairline */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="underline"] { --tc-segmented-control-px: 2px; --tc-segmented-control-gap: 20px; border-radius: 0; box-shadow: inset 0 calc(var(--tc-hairline) * -1) 0 var(--tc-border-default); }
[data-ui="seg"][data-variant="underline"] .ui-seg__scroller { padding: 0; }
[data-ui="seg"][data-variant="underline"]:not([data-full]) .ui-seg__track { gap: var(--tc-segmented-control-gap); }
[data-ui="seg"][data-variant="underline"][data-full] { --tc-segmented-control-px: 10px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-variant="underline"] .ui-seg__opt { height: calc(var(--tc-segmented-control-h) + 6px); border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="underline"] .ui-seg__opt { height: calc(var(--tc-segmented-control-h) + 6px); }
[data-ui="seg"][data-variant="underline"] .ui-seg__opt:focus-visible { outline-offset: -2px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-variant="underline"] .ui-seg__pill { top: auto; height: 2px; border-radius: var(--tc-radius-2xs) var(--tc-radius-2xs) 0 0; background: var(--tc-text-primary); box-shadow: none; }
@keyframes ui-seg-in { from { opacity: 0; transform: translateY(3px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
/* Touch screens: every option at least 40px tall */
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-size] { --tc-segmented-control-h: 40px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-size="lg"] { --tc-segmented-control-h: 44px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seg"][data-variant="underline"] .ui-seg__opt { height: var(--tc-segmented-control-h); }
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="underline"] .ui-seg__pill { top: auto; height: 1.5px; border-radius: var(--tc-radius-2xs) var(--tc-radius-2xs) 0 0; background: var(--tc-text-primary); box-shadow: none; }
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="underline"] .ui-seg__opt:not([data-active]):not(:disabled):hover { background-color: transparent; color: var(--tc-text-secondary); }
}
@keyframes ui-seg-in-clean { from { opacity: 0; transform: translateY(2px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
/* Touch screens: every option at least 40px tall */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-size] { --tc-segmented-control-h: 40px; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-size="lg"] { --tc-segmented-control-h: 44px; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="tray"][data-size] { --tc-segmented-control-h: 44px; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seg"][data-variant="underline"] .ui-seg__opt { height: var(--tc-segmented-control-h); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="seg"] *, [data-ui="seg"] *::before, [data-ui="seg"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-segmented-control")) customElements.define("tc-segmented-control", TcSegmentedControl);

declare global {
  interface HTMLElementTagNameMap {
    "tc-segmented-control": TcSegmentedControl;
  }
}
