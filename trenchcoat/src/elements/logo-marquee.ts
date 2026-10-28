import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import "./button";
import { TcElement } from "./internal/base";
import { safeMediaUrl } from "./internal/safe-media";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-logo-marquee> – the endless "Trusted by" strip for landing pages (the Lit port of blocks/logo-marquee). Every row
 * repeats its logos as often as the width needs and slides by a measured set width, so the wrap has no gap and no
 * jump. Speed is in px per second, the same on a phone and on a wide screen. One requestAnimationFrame loop owns a
 * velocity per row: hovering or keyboard-focusing the strip eases it to a stop, leaving speeds it back up, and dragging
 * or swiping scrubs it with inertia before it settles back into its own pace. Logos sit muted and monochrome; the one
 * under the pointer lifts to its brand colour. A Pause / Play button (first in the tab order) stops it for good
 * (WCAG 2.2.2) – the cancelable tc-paused-change; prevented, `paused` stays. It only runs while on screen, and
 * prefers-reduced-motion shows a static, wrapping row instead. A second row runs the other way.
 *
 *   <tc-logo-marquee label="Customers" .logos=${[{ name: "Northwind", svg: markEl, color: "#2f6bff", href: "/n" }]}></tc-logo-marquee>
 */

export type MarqueeLogo = {
  /** Brand name – the accessible name, and the visible label when `labels` is on */
  name: string;
  /** The mark as an element (cloned), ideally an <svg> with fill="currentColor" so it follows the muted colour */
  svg?: Element;
  /** An image instead of `svg` (shown grayscale until hovered when `grayscale` is on) */
  src?: string;
  /** Brand colour the mark lifts to on hover, e.g. "#635BFF" – leave out for black marks */
  color?: string;
  /** Optical size correction, e.g. 0.9 for a heavy round mark – 1 by default */
  scale?: number;
  /** Turns the logo into a link */
  href?: string;
};

export type MarqueeLabels = "none" | "below" | "beside";
export type MarqueePausedChange = { paused: boolean };

/** Motion state of one row, outside Lit so the loop never re-renders */
type RowState = {
  x: number;
  v: number;
  /** Width of one set, including its trailing gap – the wrap distance */
  w: number;
  drag: null | { id: number; lastX: number; lastT: number; moved: number; captured: boolean };
  /** Pending nudge (px) to bring a focused logo into view */
  seek: number;
};
type Row = { logos: MarqueeLogo[]; dir: 1 | -1 };

const mod = (n: number, m: number) => (m > 0 ? ((n % m) + m) % m : 0);
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** The logos split into rows: two rows take alternate logos, so each shows different brands */
export function marqueeRows(logos: MarqueeLogo[], rows: 1 | 2, direction: "left" | "right"): Row[] {
  const first: 1 | -1 = direction === "left" ? 1 : -1;
  if (rows === 2 && logos.length > 1)
    return [
      { logos: logos.filter((_, i) => i % 2 === 0), dir: first },
      { logos: logos.filter((_, i) => i % 2 === 1), dir: first === 1 ? -1 : 1 },
    ];
  return [{ logos, dir: first }];
}

/**
 * The endless "Trusted by" strip: rows of logos that loop, ease to a stop on hover, scrub with inertia and pause for good.
 * @tag tc-logo-marquee
 * @fires tc-paused-change - The Pause / Play button was pressed ({ paused }: MarqueePausedChange); cancelable – prevented, `paused` stays as it is (controlled use)
 */
export class TcLogoMarquee extends TcElement {
  static override ui = "lm";
  static override looks = false;

  /** The logos */
  @property({ attribute: false }) accessor logos: MarqueeLogo[] = [];
  /** Pixels per second, independent of the strip's width */
  @property({ type: Number }) accessor speed = 40;
  /** Which way the first row runs; a second row runs the other way */
  @property() accessor direction: "left" | "right" = "left";
  /** 1, or 2 for a second row in the opposite direction (the logos are split between the rows) */
  @property({ type: Number }) accessor rows: 1 | 2 = 1;
  /** Space between logos in px (smaller on narrow containers) */
  @property({ type: Number }) accessor gap = 56;
  /** Ease to a stop while the pointer is over the strip or it has keyboard focus */
  @property({ type: Boolean, attribute: "pause-on-hover", converter: { fromAttribute: (v) => v !== "false" } }) accessor pauseOnHover = true;
  /** Stopped for good (the Pause / Play button's state) */
  @property({ type: Boolean, reflect: true }) accessor paused = false;
  /** Show the Pause / Play button (on by default – moving content needs a way to stop it, WCAG 2.2.2) */
  @property({ type: Boolean, attribute: "pause-button", converter: { fromAttribute: (v) => v !== "false" } }) accessor pauseButton = true;
  /** Muted, colourless logos that lift to full colour on hover */
  @property({ type: Boolean, converter: { fromAttribute: (v) => v !== "false" } }) accessor grayscale = true;
  /** Show the brand name under each mark or beside it, like a wordmark */
  @property() accessor labels: MarqueeLabels = "none";
  /** Accessible name of the strip */
  @property() accessor label = "Logos of companies using the product";
  /** The Pause button's name, and the Play button's */
  @property({ attribute: false }) accessor buttonLabels: { pause: string; play: string } = { pause: "Pause logos", play: "Play logos" };

  @state() private accessor copies: number[] = [];
  @state() private accessor reduced = false;

  private state: RowState[] = [];
  private hover = false;
  private focused = false;
  private raf = 0;
  private last = 0;
  private visible = false;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private mq?: MediaQueryList;
  private split: Row[] = [];

  private get rowsEls() {
    return [...this.querySelectorAll<HTMLElement>(":scope > .ui-lm__row")];
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "region");
    this.mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.mq.matches;
    this.mq.addEventListener("change", this.onMotion);
    this.addEventListener("pointerenter", this.onEnter);
    this.addEventListener("pointerleave", this.onLeave);
    this.addEventListener("focusin", this.onFocusIn);
    this.addEventListener("focusout", this.onFocusOut);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = !!e?.isIntersecting;
      if (this.visible && !this.raf && !this.reduced) {
        this.last = 0;
        this.raf = requestAnimationFrame(this.frame);
      }
    });
    this.io.observe(this);
    this.ro = new ResizeObserver(() => this.measure());
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mq?.removeEventListener("change", this.onMotion);
    this.removeEventListener("pointerenter", this.onEnter);
    this.removeEventListener("pointerleave", this.onLeave);
    this.removeEventListener("focusin", this.onFocusIn);
    this.removeEventListener("focusout", this.onFocusOut);
    this.io?.disconnect();
    this.ro?.disconnect();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.visible = false;
  }

  private onMotion = () => (this.reduced = !!this.mq?.matches);
  private onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "touch") this.hover = true;
  };
  private onLeave = () => (this.hover = false);
  // Keyboard focus stops the strip; a mouse click that focuses a link does not
  private onFocusIn = (e: FocusEvent) => (this.focused = (e.target as Element).matches(":focus-visible"));
  private onFocusOut = (e: FocusEvent) => {
    if (!this.contains(e.relatedTarget as Node | null)) this.focused = false;
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.split = marqueeRows(this.logos ?? [], this.rows === 2 ? 2 : 1, this.direction);
    if (changed.has("label")) this.setAttribute("aria-label", this.label);
    this.style.setProperty("--tc-lm-gap", `${Number.isFinite(this.gap) ? this.gap : 56}px`);
    this.dataset.labels = this.labels;
    this.toggleAttribute("data-grayscale", this.grayscale);
    this.toggleAttribute("data-static", this.reduced);
    this.toggleAttribute("data-paused", this.paused);
    if (changed.has("reduced") && !this.reduced && this.visible && !this.raf) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.reduced) return;
    // Observe the current sets and rows (they're new nodes when the rows change), then measure
    this.ro?.disconnect();
    for (const row of this.rowsEls) {
      this.ro?.observe(row);
      const set = row.querySelector(".ui-lm__set");
      if (set) this.ro?.observe(set);
    }
    if (changed.has("logos") || changed.has("rows") || changed.has("gap") || changed.has("labels") || changed.has("reduced")) this.measure();
  }

  /** One set's width per row, and how many copies cover the row plus one wrap */
  private measure() {
    if (this.reduced) return;
    const rows = this.rowsEls;
    const next = this.split.map((_, i) => {
      const view = rows[i];
      const set = view?.querySelector<HTMLElement>(".ui-lm__set");
      if (!set || !view) return 2;
      const w = set.getBoundingClientRect().width;
      const s = (this.state[i] ??= { x: i * w * 0.5, v: 0, w, drag: null, seek: 0 });
      // Keep the same spot within the set when the width changes (container query, font load)
      if (s.w > 0 && w > 0 && s.w !== w) s.x = (s.x / s.w) * w;
      s.w = w;
      return w > 0 ? Math.ceil(view.clientWidth / w) + 1 : 2;
    });
    this.state.length = this.split.length;
    if (next.length !== this.copies.length || next.some((c, i) => c !== this.copies[i])) this.copies = next;
  }

  /** The loop: one velocity per row that eases toward its target, so stops and starts are never abrupt */
  private frame = (now: number) => {
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
    this.last = now;
    const stopped = this.paused || (this.pauseOnHover && (this.hover || this.focused));
    const tracks = this.rowsEls.map((r) => r.querySelector<HTMLElement>(".ui-lm__track"));
    this.split.forEach((row, i) => {
      const s = this.state[i];
      const track = tracks[i];
      if (!s || !track || s.w <= 0) return;
      if (!s.drag) {
        const target = stopped ? 0 : this.speed * row.dir;
        // A fling coasts out; slowing down for hover is a little quicker than winding back up
        const fling = Math.abs(s.v - target) > Math.max(120, this.speed * 2);
        const tau = fling ? 0.55 : stopped ? 0.32 : 0.7;
        s.v += (target - s.v) * (1 - Math.exp(-dt / tau));
        // Settled: a stop is a real stop, not an endless sub-pixel creep
        if (target === 0 && Math.abs(s.v) < 0.5) s.v = 0;
        s.x += s.v * dt;
        if (s.seek) {
          const step = s.seek * (1 - Math.exp(-dt / 0.12));
          s.x += step;
          s.seek = Math.abs(s.seek - step) < 0.5 ? 0 : s.seek - step;
        }
      }
      s.x = mod(s.x, s.w);
      track.style.transform = `translate3d(${-s.x}px, 0, 0)`;
    });
    this.raf = this.visible && !this.reduced ? requestAnimationFrame(this.frame) : 0;
  };

  /* ---------- Drag / swipe: scrubs the row, letting go flings it with inertia ---------- */

  private down(i: number, e: PointerEvent) {
    const s = this.state[i];
    if (!s || (e.pointerType === "mouse" && e.button !== 0)) return;
    s.drag = { id: e.pointerId, lastX: e.clientX, lastT: e.timeStamp, moved: 0, captured: false };
    s.v = 0;
  }
  private move(i: number, e: PointerEvent) {
    const s = this.state[i];
    const d = s?.drag;
    if (!s || !d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.lastX;
    const dt = Math.max(1, e.timeStamp - d.lastT) / 1000;
    d.moved += Math.abs(dx);
    const row = e.currentTarget as HTMLElement;
    // Capture only once it is clearly a drag, so plain clicks on links still work
    if (!d.captured && d.moved > 4) {
      d.captured = true;
      row.setPointerCapture?.(e.pointerId);
      row.setAttribute("data-dragging", "");
    }
    s.x -= dx;
    // Smoothed release velocity in px/s
    s.v = s.v * 0.6 + (-dx / dt) * 0.4;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
  }
  private up(i: number, e: PointerEvent) {
    const s = this.state[i];
    const d = s?.drag;
    if (!s || !d || d.id !== e.pointerId) return;
    // A pause before letting go means no fling
    if (e.timeStamp - d.lastT > 80) s.v = 0;
    s.v = clamp(s.v, -2400, 2400);
    s.drag = null;
    const row = e.currentTarget as HTMLElement;
    row.removeAttribute("data-dragging");
    if (d.captured) {
      // Swallow the click that ends a drag, so a link under the pointer doesn't open
      const stop = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      row.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => row.removeEventListener("click", stop, { capture: true }), 0);
    }
  }

  /** A focused logo is nudged into view */
  private focusItem(i: number, e: FocusEvent) {
    const s = this.state[i];
    const view = this.rowsEls[i];
    if (this.reduced || !s || !view) return;
    const v = view.getBoundingClientRect();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pad = Math.min(96, v.width * 0.15);
    if (r.left < v.left + pad) s.seek = r.left - (v.left + pad);
    else if (r.right > v.right - pad) s.seek = r.right - (v.right - pad);
  }

  private togglePaused() {
    const next = !this.paused;
    if (this.emit<MarqueePausedChange>("tc-paused-change", { paused: next }, { cancelable: true })) this.paused = next;
  }

  private item(logo: MarqueeLogo, i: number, interactive: boolean) {
    const src = safeMediaUrl(logo.src);
    const mark = logo.svg instanceof Element ? logo.svg.cloneNode(true) : src ? html`<img src=${src} alt="" draggable="false" />` : nothing;
    const body = html`<span class="ui-lm__mark" aria-hidden="true">${mark}</span>${this.labels !== "none"
        ? html`<span class="ui-lm__name">${logo.name}</span>`
        : html`<span class="ui-lm__sr">${logo.name}</span>`}`;
    const href = safeUrl(logo.href);
    const vars = styleMap({ "--tc-lm-brand": logo.color, "--tc-lm-scale": logo.scale != null && Number.isFinite(logo.scale) ? String(logo.scale) : undefined });
    return html`<li class="ui-lm__item" style=${vars}>
      ${href
        ? html`<a class="ui-lm__link" href=${href} draggable="false" tabindex=${ifDefined(interactive ? undefined : "-1")} @focus=${interactive ? (e: FocusEvent) => this.focusItem(i, e) : null}>${body}</a>`
        : html`<span class="ui-lm__link">${body}</span>`}
    </li>`;
  }

  override render() {
    const logos = this.logos ?? [];
    const labels = this.buttonLabels ?? { pause: "Pause logos", play: "Play logos" };
    // First in the tab order, so the strip can be stopped before reaching its links
    const pause =
      !this.reduced && this.pauseButton
        ? html`<tc-button class="ui-lm__pause" variant="secondary" size="sm" hide-label .label=${this.paused ? labels.play : labels.pause} @click=${() => this.togglePaused()}
            ><svg slot="icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">${this.paused
              ? svg`<path d="M5 3.4v9.2a.6.6 0 0 0 .92.5l7.2-4.6a.6.6 0 0 0 0-1L5.92 2.9A.6.6 0 0 0 5 3.4Z"></path>`
              : svg`<rect x="4" y="3" width="2.75" height="10" rx="0.8"></rect><rect x="9.25" y="3" width="2.75" height="10" rx="0.8"></rect>`}</svg></tc-button
          >`
        : nothing;
    if (this.reduced)
      // Reduced motion: one calm, wrapping row – nothing moves
      return html`${pause}<ul class="ui-lm__wrap">${logos.map((l) => this.item(l, 0, true))}</ul>`;
    return html`${pause}${this.split.map(
      (row, i) => html`<div
        class="ui-lm__row"
        @pointerdown=${(e: PointerEvent) => this.down(i, e)}
        @pointermove=${(e: PointerEvent) => this.move(i, e)}
        @pointerup=${(e: PointerEvent) => this.up(i, e)}
        @pointercancel=${(e: PointerEvent) => this.up(i, e)}
      >
        <div class="ui-lm__track">
          ${Array.from(
            { length: Math.max(2, this.copies[i] ?? 2) },
            // Only the first set is read out and reachable by Tab; the copies are decoration
            (_, c) => html`<ul class="ui-lm__set" aria-hidden=${ifDefined(c > 0 ? "true" : undefined)} .inert=${c > 0}>${row.logos.map((l) => this.item(l, i, c === 0))}</ul>`,
          )}
        </div>
      </div>`,
    )}`;
  }

  static override css = /* css */ `
[data-ui="lm"] {
  --tc-lm-h: 28px;
  --tc-lm-g: var(--tc-lm-gap, 56px);
  --tc-lm-row-gap: 20px;
  --tc-lm-fade: min(14%, 120px);
  --tc-lm-dim: 0.75;
  --tc-lm-touch: 40px;
  container-type: inline-size;
  position: relative;
  display: grid;
  gap: var(--tc-lm-row-gap);
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  -webkit-font-smoothing: antialiased;
}
/* Narrow containers (phones): smaller logos, tighter gaps */
@container (max-width: 520px) {
  .ui-lm__row, .ui-lm__wrap { --tc-lm-h: 22px; --tc-lm-g: calc(var(--tc-lm-gap, 56px) * 0.62); }
}

/* Pause / Play: sits in the faded right edge, over the middle of the strip */
[data-ui="lm"] > tc-button.ui-lm__pause { position: absolute; inset-inline-end: 0; top: 50%; z-index: 1; transform: translateY(-50%); }
[data-ui="lm"] > tc-button.ui-lm__pause:active { transform: translateY(-50%) scale(0.97); }

.ui-lm__row {
  overflow: hidden;
  /* Vertical page scroll stays native; horizontal swipes scrub the strip */
  touch-action: pan-y;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 var(--tc-lm-fade), #000 calc(100% - var(--tc-lm-fade)), transparent);
  mask-image: linear-gradient(90deg, transparent, #000 var(--tc-lm-fade), #000 calc(100% - var(--tc-lm-fade)), transparent);
  /* Room for focus rings so they aren't clipped */
  padding-block: var(--tc-space-1-5);
}
.ui-lm__row[data-dragging] { cursor: grabbing; }
.ui-lm__track { display: flex; width: max-content; will-change: transform; }
.ui-lm__set, .ui-lm__wrap { display: flex; align-items: center; margin: 0; padding: 0; list-style: none; }
.ui-lm__set { flex: none; }
/* Every logo carries its gap on the right, so one set's width is exactly the wrap distance */
.ui-lm__item { flex: none; margin-inline-end: var(--tc-lm-g); }

.ui-lm__link {
  display: flex;
  align-items: center;
  gap: calc(var(--tc-lm-h) * 0.32);
  border-radius: var(--tc-radius-md);
  color: var(--tc-icon-muted);
  text-decoration: none;
  transition: color var(--tc-duration-moderate) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard), filter var(--tc-duration-moderate) var(--tc-ease-standard);
  -webkit-user-drag: none;
}
[data-ui="lm"][data-labels="below"] .ui-lm__link { flex-direction: column; gap: var(--tc-space-2); }
.ui-lm__link:focus-visible { outline: var(--tc-focus-outline); outline-offset: 4px; }

/* Consistent optical height: every mark fills the same box, nudged by its own scale */
.ui-lm__mark { display: grid; place-items: center; height: var(--tc-lm-h); transition: color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-lm__mark > svg, .ui-lm__mark > img {
  display: block;
  height: calc(var(--tc-lm-h) * var(--tc-lm-scale, 1));
  width: auto;
  max-width: calc(var(--tc-lm-h) * 5);
  pointer-events: none;
}
/* A name is text, so it stays at text contrast (≥ 4.5:1) while the marks beside it are muted icons */
.ui-lm__name {
  font-size: calc(var(--tc-lm-h) * 0.68);
  font-weight: var(--tc-font-weight-semibold);
  letter-spacing: var(--tc-tracking-tight);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-moderate) var(--tc-ease-standard);
}
[data-ui="lm"]:not([data-grayscale]) .ui-lm__name { color: inherit; }
[data-ui="lm"][data-labels="below"] .ui-lm__name {
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: 0;
  color: var(--tc-text-muted);
}
.ui-lm__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* Grayscale: muted marks, images without colour – the hovered logo lifts to its brand colour */
[data-ui="lm"][data-grayscale] .ui-lm__mark > img { filter: grayscale(1); opacity: 0.6; transition: filter var(--tc-duration-moderate) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
[data-ui="lm"]:not([data-grayscale]) .ui-lm__mark { color: var(--tc-lm-brand, var(--tc-text-primary)); }
[data-ui="lm"]:not([data-grayscale]) .ui-lm__link { color: var(--tc-text-primary); }
@media (hover: hover) {
  .ui-lm__link:hover, .ui-lm__link:focus-visible, .ui-lm__link:hover .ui-lm__name, .ui-lm__link:focus-visible .ui-lm__name { color: var(--tc-text-primary); }
  [data-ui="lm"][data-grayscale] .ui-lm__link:hover .ui-lm__mark, [data-ui="lm"][data-grayscale] .ui-lm__link:focus-visible .ui-lm__mark { color: var(--tc-lm-brand, var(--tc-text-primary)); }
  [data-ui="lm"][data-grayscale] .ui-lm__link:hover img { filter: none; opacity: 1; }
  /* Full colour: the others step back a little while one is hovered */
  [data-ui="lm"]:not([data-grayscale]) .ui-lm__set:has(.ui-lm__link:hover) .ui-lm__link:not(:hover) { opacity: var(--tc-lm-dim); }
  /* No colour flicker under the pointer while scrubbing */
  [data-ui="lm"][data-grayscale] .ui-lm__row[data-dragging] .ui-lm__link { color: var(--tc-icon-muted); }
  [data-ui="lm"][data-grayscale] .ui-lm__row[data-dragging] .ui-lm__mark { color: inherit; }
  [data-ui="lm"][data-grayscale] .ui-lm__row[data-dragging] .ui-lm__name { color: var(--tc-text-muted); }
}

/* Reduced motion: a static, centred, wrapping row */
.ui-lm__wrap { flex-wrap: wrap; justify-content: center; row-gap: calc(var(--tc-lm-g) * 0.5); padding-inline: var(--tc-space-2); }
.ui-lm__wrap .ui-lm__item { margin-inline: calc(var(--tc-lm-g) * 0.5); }

@media (hover: none) and (pointer: coarse) {
  /* Bigger touch targets for linked logos */
  a.ui-lm__link { min-height: var(--tc-lm-touch); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-lm__link, .ui-lm__mark, .ui-lm__mark > img, .ui-lm__name { transition: none; }
}
@media (forced-colors: active) {
  .ui-lm__link { color: CanvasText; }
}
`;
}

if (!customElements.get("tc-logo-marquee")) customElements.define("tc-logo-marquee", TcLogoMarquee);
declare global {
  interface HTMLElementTagNameMap {
    "tc-logo-marquee": TcLogoMarquee;
  }
}
