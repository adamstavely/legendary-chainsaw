import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-before-after> – an original and its edit in one frame, with a divider to drag between them: the original on one
 * side of the line, the edit on the other. For checking what an AI edit changed – a retouched photo, a cleaned-up
 * chart, an upscale. The divider is a slider: drag it (or press anywhere in the frame and drag), or focus it and use
 * the arrow keys. `orientation="vertical"` stacks them – the original above, the edit below. Side by side puts the two
 * in columns instead, labelled. Standard puts the header on the gray tray above the white card; Clean is one card.
 *
 *   <tc-before-after .beforeImage=${{ src: "chart.png", alt: "Bar chart, original" }}
 *                    .afterImage=${{ src: "chart-edit.png", alt: "Bar chart, edited" }}></tc-before-after>
 *
 * (beforeImage / afterImage, since before() and after() are DOM methods every element has.)
 *
 * Moving the divider fires a cancelable tc-position-change ({ position }, 0–100 – how much of the original shows);
 * switching to side by side fires a cancelable tc-mode-change ({ mode }).
 *
 * Keyboard (the divider is a WAI-ARIA slider): the arrows move it 1% the way they point (↑ / → grow the original when
 * horizontal; ↓ / → when vertical), with Shift 10%; Page Up / Page Down 10%; Home / End all the way.
 */

/** Two halves of a square: a comparison (Lucide square-split-horizontal, ISC) */
const splitIcon = svg`<path d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3"></path><path d="M16 5h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3"></path><line x1="12" x2="12" y1="4" y2="20"></line>`;

/** One of the two images */
export type BeforeAfterImage = {
  /** The image's URL – a data: URL works too */
  src: string;
  /** What it shows, for people who can't see it */
  alt: string;
  /** Its label on the image, "Before" / "After" by default */
  label?: string;
};

export type BeforeAfterMode = "slider" | "side-by-side";
export type BeforeAfterOrientation = "horizontal" | "vertical";

/** Detail of tc-position-change: how much of the original shows, 0–100 */
export type BeforeAfterPositionChange = { position: number };
/** Detail of tc-mode-change */
export type BeforeAfterModeChange = { mode: BeforeAfterMode };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Captures or releases a pointer; a pointer that's already gone (or a synthetic one) has nothing to capture */
const capture = (el: HTMLElement, id: number, on: boolean) => {
  try {
    if (on) el.setPointerCapture?.(id);
    else el.releasePointerCapture?.(id);
  } catch {
    // NotFoundError: the drag still works without capture while the pointer stays over the frame
  }
};
/** Below this, a side's label is hidden – there isn't room for it */
const LABEL_ROOM = 12;

let instances = 0;

/**
 * An original and its edit in one frame, with a divider to drag between them – or side by side.
 * @tag tc-before-after
 * @fires tc-position-change - The divider moved. Cancelable. Detail: BeforeAfterPositionChange ({ position })
 * @fires tc-mode-change - Switched between the slider and side by side. Cancelable. Detail: BeforeAfterModeChange ({ mode })
 */
export class TcBeforeAfter extends TcElement {
  static override ui = "bfa";

  /** The heading */
  @property() accessor heading = "Before and after";
  /** A quiet line under the heading – what was edited */
  @property() accessor description: string | undefined = undefined;
  /** The original */
  @property({ attribute: false }) accessor beforeImage: BeforeAfterImage | null = null;
  /** The edit */
  @property({ attribute: false }) accessor afterImage: BeforeAfterImage | null = null;
  /** How much of the original shows, 0–100 */
  @property({ type: Number }) accessor position = 50;
  /** "horizontal": the divider moves left and right; "vertical": up and down, the original above */
  @property() accessor orientation: BeforeAfterOrientation = "horizontal";
  /** "slider", or "side-by-side" for two columns */
  @property() accessor mode: BeforeAfterMode = "slider";
  /** Hides the Side by side switch */
  @property({ type: Boolean, attribute: "hide-mode" }) accessor hideMode = false;

  /** @internal While the divider is dragged */
  @state() accessor dragging = false;

  private readonly uid = `tc-bfa${++instances}`;

  private get vertical() {
    return this.orientation === "vertical";
  }
  private get pos() {
    return clamp(Number.isFinite(this.position) ? this.position : 50, 0, 100);
  }
  private get beforeLabel() {
    return this.beforeImage?.label ?? "Before";
  }
  private get afterLabel() {
    return this.afterImage?.label ?? "After";
  }

  /* ---------- Changes ---------- */

  private move(to: number) {
    const position = Math.round(clamp(to, 0, 100) * 10) / 10;
    if (position === this.pos) return;
    if (this.emit<BeforeAfterPositionChange>("tc-position-change", { position }, { cancelable: true })) this.position = position;
  }

  private setMode(mode: BeforeAfterMode) {
    if (mode === this.mode) return;
    if (this.emit<BeforeAfterModeChange>("tc-mode-change", { mode }, { cancelable: true })) this.mode = mode;
  }

  /* ---------- Pointer ---------- */

  private fromPointer(e: PointerEvent) {
    const frame = this.querySelector<HTMLElement>(".ui-bfa__frame");
    if (!frame) return;
    const r = frame.getBoundingClientRect();
    const at = this.vertical ? (e.clientY - r.top) / (r.height || 1) : (e.clientX - r.left) / (r.width || 1);
    this.move(at * 100);
  }

  private onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const frame = e.currentTarget as HTMLElement;
    capture(frame, e.pointerId, true);
    this.dragging = true;
    this.fromPointer(e);
    this.querySelector<HTMLElement>(".ui-bfa__handle")?.focus({ preventScroll: true });
  };
  private onMove = (e: PointerEvent) => {
    if (this.dragging) this.fromPointer(e);
  };
  private onUp = (e: PointerEvent) => {
    if (!this.dragging) return;
    this.dragging = false;
    capture(e.currentTarget as HTMLElement, e.pointerId, false);
  };

  /* ---------- Keyboard: the slider ---------- */

  private onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const big = e.shiftKey ? 10 : 1;
    const p = this.pos;
    let to: number | null = null;
    // The value grows rightwards, or downwards when vertical: the arrows follow the divider on screen
    const down = this.vertical ? 1 : -1;
    switch (e.key) {
      case "ArrowRight":
        to = p + big;
        break;
      case "ArrowLeft":
        to = p - big;
        break;
      case "ArrowDown":
        to = p + down * big;
        break;
      case "ArrowUp":
        to = p - down * big;
        break;
      case "PageUp":
        to = p - down * 10;
        break;
      case "PageDown":
        to = p + down * 10;
        break;
      case "Home":
        to = 0;
        break;
      case "End":
        to = 100;
        break;
    }
    if (to === null) return;
    e.preventDefault();
    this.move(to);
  };

  /* ---------- Render ---------- */

  private img(image: BeforeAfterImage | null, cls: string) {
    return image
      ? html`<img class=${cls} src=${ifDefined(safeMediaUrl(image.src))} alt=${image.alt} draggable="false" decoding="async" />`
      : html`<div class="${cls} ui-bfa__missing"></div>`;
  }

  private renderSlider(): TemplateResult {
    const p = this.pos;
    const v = this.vertical;
    const clip = v ? `inset(${p}% 0 0 0)` : `inset(0 0 0 ${p}%)`;
    const line = v ? { top: `${p}%` } : { left: `${p}%` };
    const valueText = `${Math.round(p)}% ${this.beforeLabel.toLowerCase()}, ${Math.round(100 - p)}% ${this.afterLabel.toLowerCase()}`;
    return html`<div
      class="ui-bfa__frame"
      data-orientation=${this.orientation}
      ?data-dragging=${this.dragging}
      @pointerdown=${this.onDown}
      @pointermove=${this.onMove}
      @pointerup=${this.onUp}
      @pointercancel=${this.onUp}
    >
      ${this.img(this.beforeImage, "ui-bfa__img ui-bfa__img--before")}
      <div class="ui-bfa__after" style=${styleMap({ clipPath: clip })}>${this.img(this.afterImage, "ui-bfa__img")}</div>
      <span class="ui-bfa__label ui-bfa__label--before" aria-hidden="true" ?hidden=${p < LABEL_ROOM}>${this.beforeLabel}</span>
      <span class="ui-bfa__label ui-bfa__label--after" aria-hidden="true" ?hidden=${p > 100 - LABEL_ROOM}>${this.afterLabel}</span>
      <div class="ui-bfa__line" style=${styleMap(line)}>
        <span
          class="ui-bfa__handle"
          role="slider"
          tabindex="0"
          aria-labelledby=${`${this.uid}-divider`}
          aria-describedby=${`${this.uid}-keys`}
          aria-orientation=${v ? "vertical" : "horizontal"}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${Math.round(p)}
          aria-valuetext=${valueText}
          @keydown=${this.onKey}
          ><svg viewBox="0 0 24 24" aria-hidden="true"
            >${v ? svg`<path d="M8 9l4-4 4 4M8 15l4 4 4-4"></path>` : svg`<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"></path>`}</svg
          ></span
        >
      </div>
    </div>`;
  }

  private renderSideBySide(): TemplateResult {
    return html`<div class="ui-bfa__pair" data-orientation=${this.orientation}>
      <figure class="ui-bfa__fig">${this.img(this.beforeImage, "ui-bfa__img")}<figcaption class="ui-bfa__cap">${this.beforeLabel}</figcaption></figure>
      <figure class="ui-bfa__fig">${this.img(this.afterImage, "ui-bfa__img")}<figcaption class="ui-bfa__cap">${this.afterLabel}</figcaption></figure>
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const side = this.mode === "side-by-side";
    const toggle = this.hideMode
      ? nothing
      : html`<button type="button" class="ui-bfa__mode" aria-pressed=${side ? "true" : "false"} @click=${() => this.setMode(side ? "slider" : "side-by-side")}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="7.5" height="14" rx="1.5"></rect><rect x="13.5" y="5" width="7.5" height="14" rx="1.5"></rect></svg>Side by side
        </button>`;
    const head = cardHead({ icon: splitIcon, title: this.heading, id: `${this.uid}-title`, subtitle: this.description, aside: toggle });
    const body = html`<div class="ui-bfa__body">${side ? this.renderSideBySide() : this.renderSlider()}</div>`;
    return html`
      ${clean ? html`<div class="ui-bfa__card">${head}${body}</div>` : html`${head}<div class="ui-bfa__card">${body}</div>`}
      <span class="ui-bfa__sr" id=${`${this.uid}-divider`}>Divider between ${this.beforeLabel.toLowerCase()} and ${this.afterLabel.toLowerCase()}</span>
      <span class="ui-bfa__sr" id=${`${this.uid}-keys`}>Arrow keys move it, with Shift by 10%; Home and End go all the way</span>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bfa"] {
  /* The divider's handle */
  --tc-before-after-handle: 32px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 760px;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bfa"] {
  --tc-before-after-handle: 30px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 740px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="bfa"] *, [data-ui="bfa"] *::before, [data-ui="bfa"] *::after { box-sizing: border-box; }
:where([data-ui="bfa"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="bfa"]) svg { display: block; flex: none; }
[data-ui="bfa"] button:focus-visible, .ui-bfa__handle:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-bfa__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bfa__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-bfa__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-bfa__card > .tc-head + .ui-bfa__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
/* Side by side: a toggle in the header */
.ui-bfa__mode { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-bfa__mode svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; }
.ui-bfa__mode:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-bfa__mode[aria-pressed="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-bfa__body { padding: var(--tc-space-3); }
/* The frame: the original in flow, the edit on top of it clipped to its side of the divider */
.ui-bfa__frame { position: relative; overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-surface-well); cursor: ew-resize; touch-action: pan-y; user-select: none; }
.ui-bfa__frame[data-orientation="vertical"] { cursor: ns-resize; touch-action: pan-x; }
.ui-bfa__img { display: block; width: 100%; height: auto; user-select: none; -webkit-user-drag: none; pointer-events: none; }
.ui-bfa__missing { aspect-ratio: 16 / 9; background: var(--tc-fill-subtle); }
.ui-bfa__after { position: absolute; inset: 0; transition: clip-path var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-bfa__after .ui-bfa__img { width: 100%; height: 100%; object-fit: cover; }
.ui-bfa__frame[data-dragging] .ui-bfa__after, .ui-bfa__frame[data-dragging] .ui-bfa__line { transition: none; }
/* Labels in the top corners – Before on the original's side, After on the edit's */
.ui-bfa__label { position: absolute; top: var(--tc-space-2); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: color-mix(in srgb, var(--tc-gray-950) 64%, transparent); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-gray-0); pointer-events: none; }
.ui-bfa__label[hidden] { display: none; }
.ui-bfa__label--before { left: var(--tc-space-2); }
.ui-bfa__label--after { right: var(--tc-space-2); }
.ui-bfa__frame[data-orientation="vertical"] .ui-bfa__label--after { top: auto; bottom: var(--tc-space-2); left: var(--tc-space-2); right: auto; }
/* The divider: a line with a round handle in the middle */
.ui-bfa__line { position: absolute; top: 0; bottom: 0; width: 2px; transform: translateX(-50%); background: var(--tc-gray-0); box-shadow: 0 0 0 1px color-mix(in srgb, var(--tc-gray-950) 24%, transparent); transition: left var(--tc-duration-fast) var(--tc-ease-standard), top var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-bfa__frame[data-orientation="vertical"] .ui-bfa__line { top: auto; left: 0; right: 0; bottom: auto; width: auto; height: 2px; transform: translateY(-50%); }
.ui-bfa__handle { position: absolute; top: 50%; left: 50%; display: grid; place-items: center; width: var(--tc-before-after-handle); height: var(--tc-before-after-handle); border-radius: 50%; background: var(--tc-gray-0); box-shadow: var(--tc-shadow-raised); color: var(--tc-gray-900); transform: translate(-50%, -50%); cursor: inherit; touch-action: none; }
.ui-bfa__handle svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
/* Side by side: two labelled columns (or rows when vertical) */
.ui-bfa__pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-3); }
.ui-bfa__pair[data-orientation="vertical"] { grid-template-columns: minmax(0, 1fr); }
.ui-bfa__fig { display: grid; gap: var(--tc-space-1-5); min-width: 0; margin: 0; }
.ui-bfa__fig .ui-bfa__img { border-radius: var(--tc-radius-md); background: var(--tc-surface-well); }
.ui-bfa__cap { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
@container (max-width: 420px) {
  .ui-bfa__pair { grid-template-columns: minmax(0, 1fr); }
  .ui-bfa__body { padding: var(--tc-space-2); }
}
@media (pointer: coarse) {
  [data-ui="bfa"] { --tc-before-after-handle: 40px; }
}
@media (forced-colors: active) {
  .ui-bfa__line { background: CanvasText; }
  .ui-bfa__handle { border: 2px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="bfa"] *, [data-ui="bfa"] *::before, [data-ui="bfa"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-before-after")) customElements.define("tc-before-after", TcBeforeAfter);

declare global {
  interface HTMLElementTagNameMap {
    "tc-before-after": TcBeforeAfter;
  }
}
