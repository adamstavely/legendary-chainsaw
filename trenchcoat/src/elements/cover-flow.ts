import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";

/*
 * <tc-cover-flow> – the Lit port of illustrations/cover-flow.tsx: browse covers in 3D. The cover in front faces you;
 * the others turn away and stack up on both sides, with a soft reflection on the floor. Drag, flick, scrub with the
 * trackpad, use the arrow keys or click a cover – a spring carries the row along and settles on the nearest cover. The
 * caption below rolls to the new title. Everything moves with transforms; the element renders only when the front
 * cover changes. Colours follow the page theme through light-dark().
 *
 *   <tc-cover-flow .items=${[{ id: 1, title: "One", image: "/one.jpg" }]} label="Albums"></tc-cover-flow>
 *
 * A drag, flick, key or click asks for a cover with a cancelable tc-index-change; call preventDefault() to control
 * `index` (the row settles back on it, and moves when you set it). tc-front-change reports each cover that reaches the
 * front on the way; tc-select a click (or Enter) on the cover in front, when `selectable`.
 */

export type CoverFlowItem = {
  id: string | number;
  title?: string;
  subtitle?: string;
  /** Image URL – or pass your own cover with `cover` */
  image?: string;
  alt?: string;
  /** Any content instead of an image (cloned): artwork, a video, a product card */
  cover?: Element;
};

/** Detail of tc-index-change, tc-front-change */
export type CoverFlowIndexChange = { index: number };
/** Detail of tc-select */
export type CoverFlowSelect = { item: CoverFlowItem; index: number };

const VISIBLE = 7; // covers drawn on each side
const DRAG_PX = 110; // drag distance per cover, before scaling
/** Boolean attributes that default to true: only "false" turns them off */
const onUnlessFalse = { fromAttribute: (v: string | null) => v !== "false" };

/** "3 of 7: Static Hearts" – a slide's name, also what the status region announces */
const slideLabel = (item: CoverFlowItem, i: number, count: number) => `${i + 1} of ${count}${item.title ? `: ${item.title}` : ""}`;

/** Places every cover for a (fractional) position: the front one faces you, the others turn away and stack up */
function placeCards(cards: HTMLElement[], pos: number, { angle: a, scale: s, itemWidth: w }: { angle: number; scale: number; itemWidth: number }) {
  const gap = w * 0.78 * s; // center cover to the first side cover
  const step = w * 0.27 * s; // between side covers
  const depth = w * 0.7 * s;
  cards.forEach((el, i) => {
    const d = i - pos;
    const ad = Math.abs(d);
    if (ad > VISIBLE + 1) {
      el.style.visibility = "hidden";
      return;
    }
    const t = Math.min(ad, 1); // 0 in front, 1 once fully turned
    const dir = Math.sign(d);
    const x = dir * (t * gap + Math.max(ad - 1, 0) * step);
    el.style.visibility = "";
    const k = 1 - t * 0.08 - Math.min(Math.max(ad - 1, 0), 4) * 0.015; // recede a little more with distance
    el.style.transform = `translate3d(${x}px, 0, ${-t * depth}px) rotateY(${-dir * t * a}deg) scale(${k.toFixed(4)})`;
    el.style.zIndex = String(1000 - Math.round(ad * 10));
    el.style.setProperty("--tc-cover-flow-t", t.toFixed(3));
    el.style.setProperty("--tc-cover-flow-d", Math.min(Math.max(d, -1.5), 1.5).toFixed(3)); // drives the image drift
    el.dataset.side = d < 0 ? "left" : "right";
  });
}

type Drag = { id: number; x: number; from: number; moved: boolean; hit: number | null; samples: { x: number; t: number }[] };

/**
 * Browse covers in 3D: the front one faces you, the others stack up on both sides.
 * @tag tc-cover-flow
 * @fires tc-index-change - Cancelable, when a drag, flick, key or click asks for a cover; detail: CoverFlowIndexChange ({ index })
 * @fires tc-front-change - Each time a new cover reaches the front while the row moves; detail: CoverFlowIndexChange ({ index })
 * @fires tc-select - A click (or Enter) on the cover in front, when `selectable`; detail: CoverFlowSelect ({ item, index })
 */
export class TcCoverFlow extends TcElement {
  static override ui = "cf";
  static override looks = false;

  /** The covers, in order: an image or your own content each, with a title and subtitle for the caption */
  @property({ attribute: false }) accessor items: CoverFlowItem[] = [];
  /** The front cover; unset starts on the middle one */
  @property({ type: Number }) accessor index: number | undefined = undefined;
  /** Cover size in px – scales down on narrow containers */
  @property({ type: Number, attribute: "item-width" }) accessor itemWidth = 280;
  /** Cover height in px – scales down with the width */
  @property({ type: Number, attribute: "item-height" }) accessor itemHeight = 280;
  /** How far the side covers turn away, in degrees */
  @property({ type: Number }) accessor angle = 50;
  /** Mirror the covers on the floor */
  @property({ type: Boolean, converter: onUnlessFalse }) accessor reflection = true;
  /** Title and subtitle of the front cover */
  @property({ type: Boolean, converter: onUnlessFalse }) accessor caption = true;
  /** Replaces the default caption: returns a node (cloned) or text */
  @property({ attribute: false }) accessor renderCaption: ((item: CoverFlowItem, index: number) => Node | string | null | undefined) | undefined = undefined;
  /** Previous / next buttons next to the caption */
  @property({ type: Boolean, converter: onUnlessFalse }) accessor controls = true;
  /** A row of small position ticks under the caption */
  @property({ type: Boolean, converter: onUnlessFalse }) accessor ticks = true;
  /** A soft click each time a new cover reaches the front */
  @property({ type: Boolean }) accessor sound = false;
  /** A click or Enter on the cover in front fires tc-select */
  @property({ type: Boolean }) accessor selectable = false;
  /** Names the carousel region */
  @property() accessor label = "Cover flow";

  /** @internal The cover in front */
  @state() accessor active = 0;
  /** @internal Direction of travel, for the caption */
  @state() accessor travel = 1;
  /** @internal What the status region says: the cover a move settles on (WCAG 4.1.3) */
  @state() accessor settled = "";
  /** @internal Covers scale down when the container is narrow */
  @state() accessor scale = 1;

  /** Motion state: pos follows target on a spring, painted every frame */
  private m = { pos: 0, target: 0, vel: 0, raf: 0, last: 0, active: 0 };
  private started = false;
  private cards: HTMLElement[] = [];
  private reduced = false;
  private media?: MediaQueryList;
  private resize?: ResizeObserver;
  private wheelOn?: HTMLElement;
  private snapTimer = 0;
  private drag: Drag | null = null;
  private audio: AudioContext | null = null;
  /** Clones of each custom cover: [front, reflection] */
  private clones = new WeakMap<Element, [Node, Node]>();

  private get last() {
    return Math.max(this.items.length - 1, 0);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    this.reduced = !!this.media?.matches;
    this.media?.addEventListener("change", this.onMedia);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.media?.removeEventListener("change", this.onMedia);
    cancelAnimationFrame(this.m.raf);
    this.m.raf = 0;
    window.clearTimeout(this.snapTimer);
    this.resize?.disconnect();
    this.resize = undefined;
    this.wheelOn?.removeEventListener("wheel", this.onWheel);
    this.wheelOn = undefined;
    void this.audio?.close();
    this.audio = null;
  }

  private onMedia = () => (this.reduced = !!this.media?.matches);

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (!this.started) {
      this.started = true;
      const start = Math.min(Math.max(this.index ?? Math.floor(this.last / 2), 0), this.last);
      this.m = { pos: start, target: start, vel: 0, raf: 0, last: 0, active: start };
      this.active = start;
    }
    this.toggleAttribute("data-reflection", this.reflection);
    this.style.setProperty("--tc-cover-flow-w", `${Math.round(this.itemWidth * this.scale)}px`);
    this.style.setProperty("--tc-cover-flow-h", `${Math.round(this.itemHeight * this.scale)}px`);
  }

  protected override updated(changed: PropertyValues<this>) {
    const viewport = this.querySelector<HTMLElement>(":scope > .ui-cf__viewport");
    if (viewport && this.wheelOn !== viewport) {
      // Trackpad / horizontal wheel scrubs; vertical scrolling stays with the page
      this.wheelOn?.removeEventListener("wheel", this.onWheel);
      viewport.addEventListener("wheel", this.onWheel, { passive: false });
      this.wheelOn = viewport;
      this.resize?.disconnect();
      if (typeof ResizeObserver === "function") {
        this.resize = new ResizeObserver(this.fit);
        this.resize.observe(viewport);
      }
    }
    if (changed.has("itemWidth")) this.fit();
    this.cards = [...this.querySelectorAll<HTMLElement>(":scope > .ui-cf__viewport > .ui-cf__stage > .ui-cf__item")];
    // Controlled index: move to a new one
    if (changed.has("index") && this.index !== undefined && this.index !== Math.round(this.m.target)) this.goTo(this.index);
    // Keep the position valid when items are added or removed
    if (changed.has("items") && this.m.target > this.last) this.goTo(this.last);
    // After every render: items may have been reordered or resized
    this.paint();
  }

  /** Scale for covers of `itemWidth` in the element's width: 1 when three fit, down to 0.5 */
  private fit = () => {
    const el = this.wheelOn;
    if (el) this.scale = Math.min(1, Math.max(0.5, el.clientWidth / (this.itemWidth * 3.2)));
  };

  /** Place every cover for the current (fractional) position */
  private paint() {
    const { pos } = this.m;
    placeCards(this.cards, pos, this);
    const now = Math.round(Math.min(Math.max(pos, 0), this.items.length - 1));
    if (now !== this.m.active && now >= 0) {
      this.travel = now > this.m.active ? 1 : -1;
      this.m.active = now;
      this.active = now;
      this.emit<CoverFlowIndexChange>("tc-front-change", { index: now });
      this.tick();
    }
  }

  /** Once the row comes to rest, name the cover in front */
  private announce() {
    const i = this.m.active;
    const item = this.items[i];
    if (item) this.settled = slideLabel(item, i, this.items.length) + (item.subtitle ? `, ${item.subtitle}` : "");
  }

  /** Spring toward the target; stops itself once settled */
  private run() {
    const s = this.m;
    if (s.raf) return;
    s.last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(now - s.last, 32) / 1000;
      s.last = now;
      const k = 190;
      const c = 2 * Math.sqrt(k) * 0.92; // a hair under critical: settles with the faintest give
      s.vel += (k * (s.target - s.pos) - c * s.vel) * dt;
      s.pos += s.vel * dt;
      if (Math.abs(s.target - s.pos) < 0.0006 && Math.abs(s.vel) < 0.002) {
        s.pos = s.target;
        s.vel = 0;
        s.raf = 0;
        this.paint();
        this.announce();
        return;
      }
      this.paint();
      s.raf = requestAnimationFrame(frame);
    };
    s.raf = requestAnimationFrame(frame);
  }

  private goTo(i: number) {
    const s = this.m;
    s.target = Math.min(Math.max(Math.round(i), 0), this.items.length - 1);
    if (this.reduced) {
      s.pos = s.target;
      s.vel = 0;
      this.paint();
      this.announce();
    } else this.run();
  }

  /** A gesture, key or click asks for a cover; unless a listener prevents it, the row moves there */
  private request(i: number) {
    const to = Math.min(Math.max(Math.round(i), 0), this.items.length - 1);
    const held = this.index ?? this.m.active;
    if (to !== held && this.emit<CoverFlowIndexChange>("tc-index-change", { index: to }, { cancelable: true })) {
      this.index = to;
      return this.goTo(to);
    }
    // Prevented: settle on the held cover; if the parent accepts, setting `index` moves on to the new one
    this.goTo(this.index ?? held);
  }

  private onWheel = (e: WheelEvent) => {
    const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
    if (Math.abs(dx) <= Math.abs(e.deltaY) && !e.shiftKey) return;
    e.preventDefault();
    this.wakeAudio();
    const s = this.m;
    const unit = DRAG_PX * this.scale * 1.4;
    s.target = Math.min(Math.max(s.target + dx / unit, -0.35), this.items.length - 1 + 0.35);
    this.run();
    window.clearTimeout(this.snapTimer);
    // Settle with the swipe's momentum: lean toward the direction it was going
    this.snapTimer = window.setTimeout(() => this.request(s.target + Math.sign(dx) * 0.3), 110);
  };

  /* Drag and flick: the row follows the finger 1:1, a flick carries on, then it settles on a cover */
  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.wakeAudio();
    const hit = (e.target as HTMLElement).closest<HTMLElement>("[data-cf-index]");
    this.drag = { id: e.pointerId, x: e.clientX, from: this.m.pos, moved: false, hit: hit ? Number(hit.dataset.cfIndex) : null, samples: [{ x: e.clientX, t: performance.now() }] };
  };

  private onPointerMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const viewport = e.currentTarget as HTMLElement;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      viewport.setPointerCapture(e.pointerId);
      viewport.dataset.dragging = "";
    }
    const s = this.m;
    cancelAnimationFrame(s.raf);
    s.raf = 0;
    let p = d.from - dx / (DRAG_PX * this.scale);
    const max = this.items.length - 1;
    if (p < 0) p = p * 0.3; // rubber band past the ends
    if (p > max) p = max + (p - max) * 0.3;
    s.pos = s.target = p;
    s.vel = 0;
    d.samples.push({ x: e.clientX, t: performance.now() });
    if (d.samples.length > 6) d.samples.shift();
    this.paint();
  };

  private onPointerUp = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    this.drag = null;
    delete (e.currentTarget as HTMLElement).dataset.dragging;
    if (!d.moved) {
      // A click: bring that cover to the front, or select it if it is already there
      if (d.hit === null) return;
      if (d.hit === Math.round(this.m.target)) {
        if (this.selectable) this.emit<CoverFlowSelect>("tc-select", { item: this.items[d.hit], index: d.hit });
      } else this.request(d.hit);
      return;
    }
    const first = d.samples[0];
    const lastS = d.samples[d.samples.length - 1];
    const dt = Math.max(lastS.t - first.t, 1);
    const v = (-((lastS.x - first.x) / dt) * 1000) / (DRAG_PX * this.scale); // covers per second
    const s = this.m;
    s.vel = this.reduced ? 0 : v;
    let to = Math.round(s.pos + v * 0.18);
    // A quick flick always moves at least one cover
    if (Math.abs(v) > 0.8 && to === Math.round(d.from)) to += Math.sign(v);
    this.request(to);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const cur = Math.round(this.m.target);
    const keys: Record<string, number> = { ArrowLeft: cur - 1, ArrowRight: cur + 1, Home: 0, End: this.last };
    if (e.key in keys) {
      e.preventDefault();
      this.wakeAudio();
      this.request(keys[e.key]);
    } else if ((e.key === "Enter" || e.key === " ") && this.selectable && e.target === e.currentTarget) {
      e.preventDefault();
      this.emit<CoverFlowSelect>("tc-select", { item: this.items[cur], index: cur });
    }
  };

  /* A short, soft tick each time a cover reaches the front – made with Web Audio, no sound file */
  private tick() {
    const ctx = this.audio;
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.03);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /** Browsers only start audio from a user gesture, so the context is created (or resumed) on the first one */
  private wakeAudio() {
    if (!this.sound) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!this.audio && Ctx) this.audio = new Ctx();
    if (this.audio?.state === "suspended") void this.audio.resume();
  }

  /** The cover's image (or custom content); the reflection's copy has an empty alt */
  private face(item: CoverFlowItem, decorative: boolean) {
    let content: unknown = nothing;
    if (item.cover) {
      let pair = this.clones.get(item.cover);
      if (!pair) this.clones.set(item.cover, (pair = [item.cover.cloneNode(true), item.cover.cloneNode(true)]));
      content = pair[decorative ? 1 : 0];
    } else if (item.image)
      content = html`<img src=${item.image} alt=${decorative ? "" : (item.alt ?? item.title ?? "")} draggable="false" loading="lazy" decoding="async" />`;
    return html`<div class="ui-cf__media">${content}</div>`;
  }

  private captionContent(current: CoverFlowItem) {
    if (this.renderCaption) {
      const out = this.renderCaption(current, this.active);
      return out instanceof Node ? out.cloneNode(true) : (out ?? nothing);
    }
    return html`${current.title ? html`<div class="ui-cf__title">${current.title}</div>` : nothing}${current.subtitle ? html`<div class="ui-cf__subtitle">${current.subtitle}</div>` : nothing}`;
  }

  private footer() {
    const items = this.items;
    const active = this.active;
    const current = items[active];
    // aria-disabled rather than disabled at the ends, so a press that reaches the end keeps focus on the button
    return html`<div class="ui-cf__footer">
      <div class="ui-cf__row">
        ${this.controls
          ? html`<button type="button" class="ui-cf__nav" aria-label="Previous" aria-disabled=${active === 0 ? "true" : "false"} @click=${() => this.request(Math.round(this.m.target) - 1)}>
              <svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M10 3.5 5.5 8l4.5 4.5"></path>`}</svg>
            </button>`
          : nothing}
        ${this.caption
          ? html`<div class="ui-cf__caption">
              ${keyed(current?.id, html`<div class="ui-cf__caption-in" data-dir=${this.travel > 0 ? "next" : "prev"}>${current ? this.captionContent(current) : nothing}</div>`)}
            </div>`
          : nothing}
        ${this.controls
          ? html`<button type="button" class="ui-cf__nav" aria-label="Next" aria-disabled=${active === items.length - 1 ? "true" : "false"} @click=${() => this.request(Math.round(this.m.target) + 1)}>
              <svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M6 3.5 10.5 8 6 12.5"></path>`}</svg>
            </button>`
          : nothing}
      </div>
      ${this.ticks && items.length > 1
        ? html`<div class="ui-cf__ticks">
            ${repeat(
              items,
              (item) => item.id,
              (item, i) =>
                html`<button
                  type="button"
                  tabindex="-1"
                  class="ui-cf__tick"
                  aria-label=${`Show ${item.title ?? `cover ${i + 1}`}`}
                  aria-current=${ifDefined(i === active ? "true" : undefined)}
                  @click=${() => this.request(i)}
                ></button>`,
            )}
          </div>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const count = this.items.length;
    const active = this.active;
    return html`<div
        class="ui-cf__viewport"
        role="region"
        aria-roledescription="carousel"
        aria-label=${this.label}
        tabindex="0"
        ?data-selectable=${this.selectable}
        @keydown=${this.onKeyDown}
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
      >
        <div class="ui-cf__stage" style=${`perspective: ${Math.round(1000 * this.scale)}px;`}>
          ${repeat(
            this.items,
            (item) => item.id,
            (item, i) => html`<div
              class="ui-cf__item"
              data-cf-index=${i}
              ?data-active=${i === active}
              role="group"
              aria-roledescription="slide"
              aria-label=${slideLabel(item, i, count)}
              aria-hidden=${ifDefined(i !== active ? "true" : undefined)}
            >
              <div class="ui-cf__ground" aria-hidden="true"></div>
              <div class="ui-cf__card">${this.face(item, false)}</div>
              ${this.reflection ? html`<div class="ui-cf__reflection" aria-hidden="true" .inert=${true}><div class="ui-cf__card">${this.face(item, true)}</div></div>` : nothing}
            </div>`,
          )}
        </div>
      </div>
      <div class="ui-cf__status" role="status">${this.settled}</div>
      ${this.caption || this.controls || this.ticks ? this.footer() : nothing}`;
  }

  static override css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="cf"] {
  --tc-cover-flow-card: light-dark(#f1f1f1, #1d1d20);
  --tc-cover-flow-dim: light-dark(rgba(255, 255, 255, 0.24), rgba(0, 0, 0, 0.5));
  /* The drop is a little longer in dark, so each theme has its own (the other one's is transparent) */
  --tc-cover-flow-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.3)), 0 10px 20px -12px light-dark(rgba(0, 0, 0, 0.18), transparent), 0 12px 24px -14px light-dark(transparent, rgba(0, 0, 0, 0.6));
  /* How strong the reflection starts (--tc-cover-flow-reflect overrides both themes) */
  --tc-cover-flow-reflect-mask: light-dark(rgba(0, 0, 0, var(--tc-cover-flow-reflect, 0.22)), rgba(0, 0, 0, var(--tc-cover-flow-reflect, 0.3)));
  --tc-cover-flow-ground: light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.45));
  --tc-cover-flow-edge: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
  --tc-cover-flow-tick: light-dark(rgba(0, 0, 0, 0.16), rgba(255, 255, 255, 0.2));
  display: grid;
  gap: var(--tc-space-1, 4px);
  width: 100%;
  min-width: 0;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Soft fade on both sides, so the stacks run out instead of being cut off */
.ui-cf__viewport {
  position: relative;
  overflow: hidden;
  padding: calc(var(--tc-cover-flow-h) * 0.08) 0 0;
  height: calc(var(--tc-cover-flow-h) * 1.08);
  border-radius: var(--tc-radius-xl, 12px);
  outline: none;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
}
[data-ui="cf"][data-reflection] .ui-cf__viewport { height: calc(var(--tc-cover-flow-h) * 1.4); }
.ui-cf__viewport[data-dragging] { cursor: grabbing; }
.ui-cf__viewport:focus-visible .ui-cf__item[data-active] .ui-cf__card {
  box-shadow: var(--tc-cover-flow-shadow), 0 0 0 3px var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff));
}

.ui-cf__stage {
  position: relative;
  height: var(--tc-cover-flow-h);
  transform-style: preserve-3d;
}
.ui-cf__item {
  position: absolute;
  top: 0;
  left: 50%;
  width: var(--tc-cover-flow-w);
  height: var(--tc-cover-flow-h);
  margin-left: calc(var(--tc-cover-flow-w) / -2);
  transform-style: preserve-3d;
  will-change: transform;
}
.ui-cf__viewport[data-selectable] .ui-cf__item[data-active] { cursor: pointer; }
.ui-cf__card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-cover-flow-card);
  box-shadow: var(--tc-cover-flow-shadow);
}
.ui-cf__media {
  position: absolute;
  inset: 0 -8%;
  transform: translateX(calc(var(--tc-cover-flow-d, 0) * -5%));
}
.ui-cf__media > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
/* A soft shadow on the floor that fades as a cover turns away */
.ui-cf__ground {
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: -3px;
  height: 8px;
  border-radius: 50%;
  background: var(--tc-cover-flow-ground);
  filter: blur(5px);
  opacity: calc(1 - var(--tc-cover-flow-t, 0) * 0.7);
  pointer-events: none;
}
/* Hairline edge, a dim that grows as a cover turns away, and a sheen on the side facing the light */
.ui-cf__card::before,
.ui-cf__card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
.ui-cf__card::before {
  z-index: 2;
  box-shadow: inset 0 0 0 1px var(--tc-cover-flow-edge);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.22), transparent 45%);
  opacity: calc(var(--tc-cover-flow-t, 0) * 0.9);
}
.ui-cf__item[data-side="right"] .ui-cf__card::before {
  background: linear-gradient(270deg, rgba(255, 255, 255, 0.22), transparent 45%);
}
.ui-cf__card::after {
  z-index: 1;
  background: var(--tc-cover-flow-dim);
  opacity: var(--tc-cover-flow-t, 0);
}

/* The floor: a flipped copy that fades out – a mask, so it works on any background */
.ui-cf__reflection {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 32%;
  margin-top: var(--tc-space-0-5, 2px);
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, var(--tc-cover-flow-reflect-mask), transparent 85%);
  mask-image: linear-gradient(to bottom, var(--tc-cover-flow-reflect-mask), transparent 85%);
}
.ui-cf__reflection > .ui-cf__card {
  height: var(--tc-cover-flow-h);
  transform: scaleY(-1);
  transform-origin: 50% calc(var(--tc-cover-flow-h) / 2);
  box-shadow: none;
}
.ui-cf__reflection > .ui-cf__card {
  position: absolute;
  bottom: auto;
  top: 0;
}

/* Caption with previous / next on either side, position ticks below */
.ui-cf__footer {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: var(--tc-space-3-5, 14px);
  margin-top: calc(var(--tc-cover-flow-h) * -0.04);
}
[data-ui="cf"]:not([data-reflection]) .ui-cf__footer { margin-top: var(--tc-space-3, 12px); }
.ui-cf__row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-5, 20px);
  min-height: 44px;
}
.ui-cf__ticks {
  display: flex;
  align-items: center;
  gap: var(--tc-space-0-5, 2px);
}
.ui-cf__tick {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
.ui-cf__tick::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-cover-flow-tick);
  transition: width var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-cf__tick[aria-current]::before {
  width: 14px;
  background: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-cf__tick:hover::before { background: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-cf__tick[aria-current]:hover::before { background: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-cf__caption {
  display: grid;
  min-width: min(220px, 50vw);
  text-align: center;
}
.ui-cf__caption-in { animation: ui-cf-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-cf__caption-in[data-dir="prev"] { animation-name: ui-cf-in-prev; }
.ui-cf__title {
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font-size: var(--tc-font-size-lg-plus, 15px);
  font-weight: var(--tc-font-weight-semibold, 600);
  letter-spacing: -0.01em;
  line-height: 1.35;
}
.ui-cf__subtitle {
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  font-size: var(--tc-font-size-md, 13px);
  line-height: 1.4;
}
.ui-cf__nav {
  display: grid;
  place-items: center;
  flex: none;
  /* A round secondary button: the secondary action colours and the control height */
  width: var(--tc-control-h-md, 32px);
  height: var(--tc-control-h-md, 32px);
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-action-secondary-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-action-secondary-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-action-secondary-fg, light-dark(#171717, #ededed));
  cursor: pointer;
  transition: transform var(--tc-duration-fast, 150ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), opacity var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-cf__nav:hover:not([aria-disabled="true"]) { box-shadow: var(--tc-action-secondary-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-cf__nav:active { transform: scale(0.92); }
/* At an end: the arrow dims, the button (and its focus ring) stays at full strength */
.ui-cf__nav[aria-disabled="true"] { cursor: default; transform: none; }
.ui-cf__nav[aria-disabled="true"] svg { opacity: 0.35; }
/* Visually hidden, still read */
.ui-cf__status {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.ui-cf__nav:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-cf__nav svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
@media (pointer: coarse) {
  .ui-cf__nav { width: var(--tc-control-h-lg, 40px); height: var(--tc-control-h-lg, 40px); }
}

/* The caption rises in from the direction of travel */
@keyframes ui-cf-in {
  from { opacity: 0; transform: translate(14px, 4px); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-cf-in-prev {
  from { opacity: 0; transform: translate(-14px, 4px); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-cf__caption-in { animation: none; }
  .ui-cf__media { transform: none; }
  .ui-cf__tick::before { transition: none; }
  .ui-cf__nav { transition: none; }
}
`;
}

if (!customElements.get("tc-cover-flow")) customElements.define("tc-cover-flow", TcCoverFlow);

declare global {
  interface HTMLElementTagNameMap {
    "tc-cover-flow": TcCoverFlow;
  }
}
