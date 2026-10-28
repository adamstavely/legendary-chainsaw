import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import "./button";
import { TcElement } from "./internal/base";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-testimonial-wall> – the landing-page wall of quotes (the Lit port of blocks/testimonial-wall). Quotes are dealt
 * into columns (up to 3 on wide containers, 2 under 740 px, 1 under 480 px – measured on the wall itself, not the
 * window) that scroll vertically and endlessly, alternating up and down at slightly different speeds. Every column
 * repeats a measured set of cards and wraps by exactly its height, so the loop has no gap and no jump; the top and
 * bottom edges fade out. One requestAnimationFrame loop owns a velocity per column: hovering or keyboard-focusing a
 * column eases it to a stop, leaving winds it back up, and dragging it with the mouse scrubs it with inertia. On touch
 * the page keeps scrolling natively – pressing and holding a column pauses it to read. A Pause / Play button stops the
 * whole wall for good (WCAG 2.2.2) – the cancelable tc-paused-change; prevented, `paused` stays. It only runs while on
 * screen, and prefers-reduced-motion shows a static grid instead. Set the height with --tc-testimonial-wall-height.
 *
 *   <tc-testimonial-wall label="Customer testimonials" .items=${[{ quote: "Fast.", name: "Leo Brandt", rating: 5 }]}></tc-testimonial-wall>
 */

export type Testimonial = {
  /** The quote itself – mix short and long ones, the masonry looks more natural */
  quote: string;
  name: string;
  /** e.g. "Design Engineer" */
  role?: string;
  /** e.g. "Fieldnote" – shown after the role */
  company?: string;
  /** Photo URL; without one the initials sit on a soft gray circle */
  avatar?: string;
  /** 1–5 – a small, calm gray star row above the quote */
  rating?: number;
  /** A small gray check beside the name */
  verified?: boolean;
};

export type TestimonialPausedChange = { paused: boolean };

/** Motion state of one column, outside Lit so the loop never re-renders */
type ColState = {
  /** Offset into the loop in px – the real set starts at -y */
  y: number;
  v: number;
  /** Height of one set, including its trailing gap – the wrap distance */
  h: number;
  drag: null | { id: number; lastY: number; lastT: number; moved: number; captured: boolean };
  /** Pending nudge (px) to bring a focused card into view */
  seek: number;
};

/** Run direction and pace of each column: up, down, up – never quite in step */
const PACE = [1, -0.84, 1.12];
/** Where each column starts in its loop, so the rows of cards don't line up */
const START = [0, 0.42, 0.18];

const mod = (n: number, m: number) => (m > 0 ? ((n % m) + m) % m : 0);
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/** Container width → column count, at most `max`: 3 from 740 px, 2 from 480 px, else 1 */
export const testimonialColumns = (width: number, max: number) => Math.max(1, Math.min(max, width >= 740 ? 3 : width >= 480 ? 2 : 1));
/** The quotes dealt into `count` columns: 1, 2, 3, 1, 2, 3 … so short and long ones mix in every column */
export const dealTestimonials = <T>(items: T[], count: number): T[][] => Array.from({ length: count }, (_, c) => items.filter((_, i) => i % count === c));

const STAR = svg`<path d="M8 1.6l1.9 3.95 4.35.6-3.17 3.03.78 4.32L8 11.43 4.14 13.5l.78-4.32L1.75 6.15l4.35-.6L8 1.6z"></path>`;

/**
 * The landing-page wall of quotes: columns that scroll endlessly in opposite directions, ease to a stop on hover and pause for good.
 * @tag tc-testimonial-wall
 * @fires tc-paused-change - The Pause / Play button was pressed ({ paused }: TestimonialPausedChange); cancelable – prevented, `paused` stays as it is (controlled use)
 */
export class TcTestimonialWall extends TcElement {
  static override ui = "twl";
  static override looks = false;

  /** The quotes */
  @property({ attribute: false }) accessor items: Testimonial[] = [];
  /** Most columns on a wide container – narrower containers use fewer (2 below 740 px, 1 below 480 px) */
  @property({ type: Number }) accessor columns: 1 | 2 | 3 = 3;
  /** Pixels per second of the first column; the others run a little slower and faster */
  @property({ type: Number }) accessor speed = 28;
  /** Ease a column to a stop while the pointer is over it or a card in it has keyboard focus */
  @property({ type: Boolean, attribute: "pause-on-hover", converter: { fromAttribute: (v) => v !== "false" } }) accessor pauseOnHover = true;
  /** Stopped for good (the Pause / Play button's state) */
  @property({ type: Boolean, reflect: true }) accessor paused = false;
  /** Show the Pause / Play button (on by default – moving content needs a way to stop it, WCAG 2.2.2) */
  @property({ type: Boolean, attribute: "pause-button", converter: { fromAttribute: (v) => v !== "false" } }) accessor pauseButton = true;
  /** Accessible name of the wall */
  @property() accessor label = "What customers say";
  /** The Pause button's name, and the Play button's */
  @property({ attribute: false }) accessor buttonLabels: { pause: string; play: string } = { pause: "Pause testimonials", play: "Play testimonials" };

  @state() private accessor count = 3;
  @state() private accessor copies: number[] = [];
  @state() private accessor reduced = false;

  private state: ColState[] = [];
  private hover: boolean[] = [];
  private hold: boolean[] = [];
  private focusCol: boolean[] = [];
  private raf = 0;
  private last = 0;
  private visible = false;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private sizeRo?: ResizeObserver;
  private mq?: MediaQueryList;
  private dealt: Testimonial[][] = [];

  private get cols() {
    return [...this.querySelectorAll<HTMLElement>(":scope > .ui-twl__col")];
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "region");
    this.mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.mq.matches;
    this.mq.addEventListener("change", this.onMotion);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = !!e?.isIntersecting;
      this.start();
    });
    this.io.observe(this);
    this.ro = new ResizeObserver(() => this.measure());
    // Column count follows the wall's own width
    this.sizeRo = new ResizeObserver(() => this.fit());
    this.sizeRo.observe(this);
    this.fit();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mq?.removeEventListener("change", this.onMotion);
    this.io?.disconnect();
    this.ro?.disconnect();
    this.sizeRo?.disconnect();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.visible = false;
  }

  private onMotion = () => (this.reduced = !!this.mq?.matches);
  private start() {
    if (this.visible && !this.raf && !this.reduced) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.frame);
    }
  }
  private fit() {
    const max = this.columns === 1 || this.columns === 2 ? this.columns : 3;
    const next = this.clientWidth > 0 ? testimonialColumns(this.clientWidth, max) : max;
    if (next !== this.count) this.count = next;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("columns")) this.fit();
    this.dealt = dealTestimonials(this.items ?? [], this.count);
    if (changed.has("label")) this.setAttribute("aria-label", this.label);
    this.dataset.cols = String(this.count);
    this.style.setProperty("--tc-twl-cols", String(this.count));
    this.toggleAttribute("data-static", this.reduced);
    this.toggleAttribute("data-paused", this.paused);
    if (changed.has("reduced")) this.start();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.reduced) return;
    this.ro?.disconnect();
    for (const col of this.cols) {
      this.ro?.observe(col);
      const set = col.querySelector(".ui-twl__set[data-real]");
      if (set) this.ro?.observe(set);
    }
    if (changed.has("items") || changed.has("count") || changed.has("reduced")) this.measure();
  }

  /** One set's height per column, and how many copies cover the column plus one wrap */
  private measure() {
    if (this.reduced) return;
    const cols = this.cols;
    const next = this.dealt.map((_, i) => {
      const col = cols[i];
      const set = col?.querySelector<HTMLElement>(".ui-twl__set[data-real]");
      if (!set || !col) return 2;
      // Layout px, not screen px – a CSS zoom or scale on an ancestor must not skew the wrap distance
      const scale = col.getBoundingClientRect().height / (col.offsetHeight || 1) || 1;
      const h = set.getBoundingClientRect().height / scale;
      const s = (this.state[i] ??= { y: h * (START[i] ?? 0), v: 0, h, drag: null, seek: 0 });
      // Keep the same spot within the set when its height changes (fewer columns, font load)
      if (s.h > 0 && h > 0 && s.h !== h) s.y = (s.y / s.h) * h;
      s.h = h;
      // Place the track before the loop's first frame (and for a column that just appeared)
      const track = col.querySelector<HTMLElement>(".ui-twl__track");
      if (track) track.style.transform = `translate3d(0, ${-(s.h + s.y)}px, 0)`;
      // Capped, as a guard against a column that isn't given a height
      return h > 0 ? Math.min(12, Math.ceil(col.clientHeight / h) + 1) : 2;
    });
    this.state.length = this.dealt.length;
    if (next.length !== this.copies.length || next.some((c, i) => c !== this.copies[i])) this.copies = next;
  }

  /** The loop: one velocity per column that eases toward its target, so stops and starts are never abrupt */
  private frame = (now: number) => {
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
    this.last = now;
    const cols = this.cols;
    for (let i = 0; i < this.count; i++) {
      const s = this.state[i];
      const track = cols[i]?.querySelector<HTMLElement>(".ui-twl__track");
      if (!s || !track || s.h <= 0) continue;
      const pace = this.count === 1 ? 1 : PACE[i % 3]!;
      const stopped = this.paused || this.hold[i] || this.focusCol[i] || (this.pauseOnHover && this.hover[i]);
      if (!s.drag) {
        const target = stopped ? 0 : this.speed * pace;
        // A fling coasts out; slowing down for hover is a little quicker than winding back up
        const fling = Math.abs(s.v - target) > Math.max(120, this.speed * 2);
        const tau = fling ? 0.55 : stopped ? 0.32 : 0.7;
        s.v += (target - s.v) * (1 - Math.exp(-dt / tau));
        // Settled: a stop is a real stop, not an endless sub-pixel creep
        if (target === 0 && Math.abs(s.v) < 0.5) s.v = 0;
        s.y += s.v * dt;
        if (s.seek) {
          const step = s.seek * (1 - Math.exp(-dt / 0.12));
          s.y += step;
          s.seek = Math.abs(s.seek - step) < 0.5 ? 0 : s.seek - step;
        }
      }
      // While a card has keyboard focus the column may sit just outside one wrap (see focusCard); otherwise the
      // offset stays inside one set, where every copy looks the same
      s.y = this.focusCol[i] ? clamp(s.y, -s.h, s.h * 2) : mod(s.y, s.h);
      track.style.transform = `translate3d(0, ${-(s.h + s.y)}px, 0)`;
    }
    this.raf = this.visible && !this.reduced ? requestAnimationFrame(this.frame) : 0;
  };

  /* ---------- Drag (mouse, pen) and press-and-hold (touch) ---------- */

  private down(i: number, e: PointerEvent) {
    const s = this.state[i];
    if (!s) return;
    // Touch: the page keeps scrolling natively, a finger resting on a column just holds it still
    if (e.pointerType === "touch") {
      this.hold[i] = true;
      return;
    }
    if (e.button !== 0) return;
    s.drag = { id: e.pointerId, lastY: e.clientY, lastT: e.timeStamp, moved: 0, captured: false };
    s.v = 0;
  }
  private move(i: number, e: PointerEvent) {
    const s = this.state[i];
    const d = s?.drag;
    if (!s || !d || d.id !== e.pointerId) return;
    const col = e.currentTarget as HTMLElement;
    const scale = col.getBoundingClientRect().height / (col.offsetHeight || 1) || 1;
    const dy = (e.clientY - d.lastY) / scale;
    const dt = Math.max(1, e.timeStamp - d.lastT) / 1000;
    d.moved += Math.abs(dy);
    // Capture only once it is clearly a drag, so a plain click still focuses a card or follows a link
    if (!d.captured && d.moved > 4) {
      d.captured = true;
      col.setPointerCapture?.(e.pointerId);
      col.setAttribute("data-dragging", "");
    }
    s.y -= dy;
    // Smoothed release velocity in px/s
    s.v = s.v * 0.6 + (-dy / dt) * 0.4;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
  }
  private up(i: number, e: PointerEvent) {
    this.hold[i] = false;
    const s = this.state[i];
    const d = s?.drag;
    if (!s || !d || d.id !== e.pointerId) return;
    // A pause before letting go means no fling
    if (e.timeStamp - d.lastT > 80) s.v = 0;
    s.v = clamp(s.v, -2400, 2400);
    s.drag = null;
    const col = e.currentTarget as HTMLElement;
    col.removeAttribute("data-dragging");
    if (d.captured) {
      // Swallow the click that ends a drag, so a link inside a quote doesn't open
      const stop = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      col.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => col.removeEventListener("click", stop, { capture: true }), 0);
    }
  }

  /** Keyboard: a focused card stops its column and is nudged into view */
  private focusCard(i: number, e: FocusEvent) {
    const s = this.state[i];
    const col = this.cols[i];
    const card = e.currentTarget as HTMLElement;
    if (this.reduced || !s || !col || s.h <= 0 || !card.matches(":focus-visible")) return;
    const li = card.parentElement as HTMLElement;
    const top = li.offsetTop;
    const h = card.offsetHeight;
    const viewH = col.clientHeight;
    const pad = Math.min(56, viewH * 0.12);
    // Only the real set is focusable; pick the wrap (one set up, here or one down) that is closest, so the nudge is
    // short – every copy looks the same, so the switch is invisible
    s.y = [s.y - s.h, s.y, s.y + s.h].reduce((best, y) => (Math.abs(top - y - viewH / 2) < Math.abs(top - best - viewH / 2) ? y : best));
    const at = top - s.y;
    if (h > viewH - pad * 2 || at < pad) s.seek = at - pad;
    else if (at + h > viewH - pad) s.seek = at + h - (viewH - pad);
    else s.seek = 0;
  }

  private togglePaused() {
    const next = !this.paused;
    if (this.emit<TestimonialPausedChange>("tc-paused-change", { paused: next }, { cancelable: true })) this.paused = next;
  }

  private card(t: Testimonial, i: number, interactive: boolean) {
    // The dot stays with the role, so a wrap starts cleanly with the company
    const meta = [t.role, t.company].filter(Boolean).join(" · ");
    const stars = t.rating && Number.isFinite(t.rating) ? clamp(Math.round(t.rating), 1, 5) : 0;
    const avatar = safeMediaUrl(t.avatar);
    return html`<li class="ui-twl__item">
      <figure class="ui-twl__card" tabindex=${ifDefined(interactive ? "0" : undefined)} @focus=${interactive ? (e: FocusEvent) => this.focusCard(i, e) : null}>
        ${stars
          ? html`<div class="ui-twl__stars" role="img" aria-label=${`Rated ${stars} out of 5`}>
              ${Array.from({ length: 5 }, (_, n) => html`<svg viewBox="0 0 16 16" aria-hidden="true" ?data-on=${n < stars}>${STAR}</svg>`)}
            </div>`
          : nothing}
        <blockquote class="ui-twl__quote"><p>${t.quote}</p></blockquote>
        <figcaption class="ui-twl__who">
          ${avatar
            ? html`<img class="ui-twl__avatar" src=${avatar} alt="" width="36" height="36" loading="lazy" decoding="async" draggable="false" />`
            : html`<span class="ui-twl__avatar ui-twl__avatar--initials" aria-hidden="true">${initials(t.name)}</span>`}
          <span class="ui-twl__id">
            <span class="ui-twl__name"
              ><span class="ui-twl__name-text">${t.name}</span>${t.verified
                ? html`<svg class="ui-twl__verified" viewBox="0 0 16 16" role="img" aria-label="Verified customer"><circle cx="8" cy="8" r="7"></circle><path d="M5.2 8.1l1.9 1.9 3.7-3.8" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
                : nothing}</span
            >
            ${meta ? html`<span class="ui-twl__meta">${meta}</span>` : nothing}
          </span>
        </figcaption>
      </figure>
    </li>`;
  }

  override render() {
    const labels = this.buttonLabels ?? { pause: "Pause testimonials", play: "Play testimonials" };
    // First in the tab order, so the wall can be stopped before reaching its quotes
    const pause =
      !this.reduced && this.pauseButton
        ? html`<tc-button class="ui-twl__pause" variant="secondary" size="sm" hide-label .label=${this.paused ? labels.play : labels.pause} @click=${() => this.togglePaused()}
            ><svg slot="icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">${this.paused
              ? svg`<path d="M5 3.4v9.2a.6.6 0 0 0 .92.5l7.2-4.6a.6.6 0 0 0 0-1L5.92 2.9A.6.6 0 0 0 5 3.4Z"></path>`
              : svg`<rect x="4" y="3" width="2.75" height="10" rx="0.8"></rect><rect x="9.25" y="3" width="2.75" height="10" rx="0.8"></rect>`}</svg></tc-button
          >`
        : nothing;
    return html`${pause}${this.dealt.map((list, i) =>
      this.reduced
        ? // Reduced motion: a calm, static masonry – every quote once, nothing moves
          html`<div class="ui-twl__col"><ul class="ui-twl__set" data-real>${list.map((t) => this.card(t, i, true))}</ul></div>`
        : html`<div
            class="ui-twl__col"
            @pointerenter=${(e: PointerEvent) => {
              if (e.pointerType !== "touch") this.hover[i] = true;
            }}
            @pointerleave=${() => (this.hover[i] = false)}
            @pointerdown=${(e: PointerEvent) => this.down(i, e)}
            @pointermove=${(e: PointerEvent) => this.move(i, e)}
            @pointerup=${(e: PointerEvent) => this.up(i, e)}
            @pointercancel=${(e: PointerEvent) => this.up(i, e)}
            @focusin=${(e: FocusEvent) => (this.focusCol[i] = (e.target as Element).matches(":focus-visible"))}
            @focusout=${(e: FocusEvent) => {
              if (!(e.currentTarget as Element).contains(e.relatedTarget as Node | null)) this.focusCol[i] = false;
            }}
          >
            <div class="ui-twl__track">
              ${
                /* One copy above the real set and enough below it, so a nudge or a wrap never shows a gap. Only the
                   real set is read out and reachable by Tab; the copies are decoration */
                Array.from({ length: 1 + Math.max(2, this.copies[i] ?? 2) }, (_, c) => {
                  const real = c === 1;
                  return html`<ul class="ui-twl__set" ?data-real=${real} aria-hidden=${ifDefined(real ? undefined : "true")} .inert=${!real}>${list.map((t) => this.card(t, i, real))}</ul>`;
                })
              }
            </div>
          </div>`,
    )}`;
  }

  static override css = /* css */ `
[data-ui="twl"] {
  --tc-twl-star: light-dark(#a3a3a8, #7a7a82);
  --tc-twl-star-off: light-dark(#e2e2e5, #2f2f34);
  --tc-twl-avatar-ring: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.06));
  --tc-twl-gap: 16px;
  --tc-twl-fade: 96px;
  --tc-twl-dim: 0.62;
  --tc-twl-avatar: 36px;
  --tc-twl-card-pad: 18px 20px;
  --tc-twl-card-gap: 14px;
  --tc-twl-name-gap: 5px;
  --tc-twl-id-gap: 1px;
  container-type: inline-size;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--tc-twl-cols, 3), minmax(0, 1fr));
  /* One row exactly as tall as the wall, so a column's height never follows its (repeated) content */
  grid-template-rows: minmax(0, 1fr);
  gap: var(--tc-twl-gap);
  width: 100%;
  min-width: 0;
  height: var(--tc-testimonial-wall-height, 600px);
  /* Room at the sides for the lifted card's shadow; the wall clips everything else */
  padding-inline: var(--tc-space-3);
  box-sizing: border-box;
  overflow: hidden;
  font-family: var(--tc-font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Pause / Play: top right, above the faded edge (the fade is on the columns, so the button stays crisp) */
[data-ui="twl"] > tc-button.ui-twl__pause { position: absolute; top: var(--tc-space-2); inset-inline-end: var(--tc-space-4); z-index: 2; }

.ui-twl__col {
  position: relative;
  min-width: 0;
  min-height: 0;
  height: 100%;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 var(--tc-twl-fade), #000 calc(100% - var(--tc-twl-fade)), transparent);
  mask-image: linear-gradient(180deg, transparent, #000 var(--tc-twl-fade), #000 calc(100% - var(--tc-twl-fade)), transparent);
}
.ui-twl__col[data-dragging] { cursor: grabbing; }
.ui-twl__track { will-change: transform; }
.ui-twl__set { position: relative; display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
/* Every card carries its gap below, so one set's height is exactly the wrap distance */
.ui-twl__item { margin-bottom: var(--tc-twl-gap); }

.ui-twl__card {
  display: flex;
  flex-direction: column;
  gap: var(--tc-twl-card-gap);
  margin: 0;
  padding: var(--tc-twl-card-pad);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  color: var(--tc-text-secondary);
  transition: transform var(--tc-duration-slow) var(--tc-ease-move), box-shadow var(--tc-duration-slow) var(--tc-ease-standard), opacity var(--tc-duration-slow) var(--tc-ease-standard);
}
.ui-twl__card:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }

.ui-twl__stars { display: flex; gap: var(--tc-space-0-5); margin-bottom: calc(var(--tc-space-1) * -1); }
.ui-twl__stars svg { width: 13px; height: 13px; fill: var(--tc-twl-star-off); }
.ui-twl__stars svg[data-on] { fill: var(--tc-twl-star); }

.ui-twl__quote { margin: 0; }
.ui-twl__quote p {
  margin: 0;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-relaxed);
  letter-spacing: var(--tc-tracking-snug);
  text-wrap: pretty;
  overflow-wrap: break-word;
}

.ui-twl__who { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; }
.ui-twl__avatar {
  flex: none;
  width: var(--tc-twl-avatar);
  height: var(--tc-twl-avatar);
  border-radius: 50%;
  object-fit: cover;
  background: var(--tc-fill-default);
  /* A hairline ring keeps light photos from melting into the card */
  box-shadow: 0 0 0 1px var(--tc-twl-avatar-ring);
  pointer-events: none;
}
.ui-twl__avatar--initials {
  display: grid;
  place-items: center;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-semibold);
  letter-spacing: 0;
  color: var(--tc-text-muted);
}
.ui-twl__id { display: grid; gap: var(--tc-twl-id-gap); min-width: 0; }
.ui-twl__name {
  display: flex;
  align-items: center;
  gap: var(--tc-twl-name-gap);
  min-width: 0;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-primary);
}
/* The name wins over the role: it shrinks last and only then truncates */
.ui-twl__name-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-twl__verified { flex: none; width: 14px; height: 14px; fill: var(--tc-icon-muted); }
.ui-twl__verified path { stroke: var(--tc-surface-raised); }
.ui-twl__meta {
  min-width: 0;
  overflow-wrap: break-word;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-muted);
}

/* Hover: the card under the pointer lifts a little, the rest of the wall steps back */
@media (hover: hover) {
  .ui-twl__col:not([data-dragging]) .ui-twl__card:hover { transform: translateY(-3px); box-shadow: var(--tc-card-shadow-hover); }
  [data-ui="twl"]:has(.ui-twl__col:not([data-dragging]) .ui-twl__card:hover) .ui-twl__card:not(:hover) { opacity: var(--tc-twl-dim); }
}
/* Keyboard focus gets the same lift */
.ui-twl__card:focus-visible { transform: translateY(-3px); box-shadow: var(--tc-card-shadow-hover); }

/* Narrow walls (one column on phones): roomier, more readable quotes */
@container (max-width: 479px) {
  .ui-twl__card { --tc-twl-card-pad: 18px; }
  .ui-twl__quote p { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); }
}
@container (max-width: 739px) {
  .ui-twl__col { --tc-twl-gap: 14px; }
}

/* Reduced motion: a static masonry that shows every quote – no fixed height, no fade */
[data-ui="twl"][data-static] { height: auto; grid-template-rows: auto; overflow: visible; }
[data-ui="twl"][data-static] .ui-twl__col { height: auto; cursor: auto; user-select: auto; -webkit-user-select: auto; -webkit-mask-image: none; mask-image: none; }

@media (prefers-reduced-motion: reduce) {
  .ui-twl__card { transition: none; }
}
@media (forced-colors: active) {
  .ui-twl__card { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-testimonial-wall")) customElements.define("tc-testimonial-wall", TcTestimonialWall);
declare global {
  interface HTMLElementTagNameMap {
    "tc-testimonial-wall": TcTestimonialWall;
  }
}
