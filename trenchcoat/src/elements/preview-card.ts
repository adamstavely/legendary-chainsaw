import { html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-preview-card> – a gallery or index tile: a large preview on top, then a title and a line or two of description
 * below a hairline. The preview is a picture (`src`), or the page's own children – a live component or page – fitted
 * by `fit`: "cover" fills the frame, "contain" shows it whole, "scale" lays it out at `preview-width` and shrinks it to
 * the card, like a thumbnail of a live page. Live previews are inert and hidden from screen readers; the title names
 * the card. The title is a link (`href`) or a button (tc-open) whose hit area covers the whole card.
 * Standard: the preview on a gray tray, the words on a white card. Clean: one white card, the preview on a well.
 *
 *   <tc-preview-card heading="Agent Cursors" description="Agents working in a document like teammates" src="cursors.png" href="/agent-cursors"></tc-preview-card>
 */

export type PreviewCardFit = "cover" | "contain" | "scale";
export type PreviewCardOrientation = "vertical" | "horizontal";

/**
 * A gallery tile: a large preview above a title and a short description, which opens what it previews.
 * @tag tc-preview-card
 * @fires tc-open - The card was pressed (detail: { href }); cancelable – prevented, a link isn't followed
 */
export class TcPreviewCard extends TcElement {
  static override ui = "pvc";

  /** The title, on one line */
  @property() accessor heading = "";
  /** The heading's level, 2–6 */
  @property({ type: Number, attribute: "heading-level" }) accessor headingLevel = 3;
  /** A line or two under the title */
  @property() accessor description = "";
  /** The preview picture; without it the page's children are the preview */
  @property() accessor src = "";
  /** What the picture shows; "" when the title says it */
  @property() accessor alt = "";
  /** How the preview fills its frame: "cover", "contain", or "scale" – laid out at `preview-width` and shrunk to fit */
  @property({ reflect: true }) accessor fit: PreviewCardFit = "cover";
  /** The width a scaled preview is laid out at, in pixels */
  @property({ type: Number, attribute: "preview-width" }) accessor previewWidth = 1024;
  /** A short tag at the preview's top right, such as "New" */
  @property() accessor badge = "";
  /** Where the card goes; without it the card is a button that fires tc-open */
  @property() accessor href = "";
  /** "vertical" puts the preview above the words; "horizontal" beside them, for a list */
  @property({ reflect: true }) accessor orientation: PreviewCardOrientation = "vertical";
  /** Shows a placeholder while the card's content loads */
  @property({ type: Boolean, reflect: true }) accessor loading = false;

  /** @internal */
  private readonly screen = new OnScreenController(this);
  private resize: ResizeObserver | undefined;
  private kids: MutationObserver | undefined;

  override connectedCallback() {
    super.connectedCallback();
    this.kids = new MutationObserver(() => this.hideChildren());
    this.kids.observe(this, { childList: true });
    this.hideChildren();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resize?.disconnect();
    this.resize = undefined;
    this.kids?.disconnect();
    this.kids = undefined;
  }

  protected override firstUpdated() {
    const frame = this.querySelector<HTMLElement>(".ui-pvc__frame");
    if (!frame) return;
    this.resize = new ResizeObserver(() => this.measure());
    this.resize.observe(frame);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("previewWidth") || changed.has("fit")) this.measure();
    this.toggleAttribute("data-paused", !this.screen.onScreen);
    if (this.loading) this.setAttribute("aria-busy", "true");
    else this.removeAttribute("aria-busy");
  }

  /** The page's children are a picture of something, not part of the page: no focus, no clicks, not read */
  private hideChildren() {
    for (const kid of this.children) {
      if (kid.classList.contains("ui-pvc__part")) continue;
      kid.setAttribute("inert", "");
      kid.setAttribute("aria-hidden", "true");
    }
  }

  /** For "scale": how far the design width shrinks to the frame, and the frame's height at that width */
  private measure() {
    const frame = this.querySelector<HTMLElement>(".ui-pvc__frame");
    if (!frame || !frame.clientWidth) return;
    const k = frame.clientWidth / Math.max(1, this.previewWidth);
    this.style.setProperty("--tc-pvc-k", String(k));
    this.style.setProperty("--tc-pvc-h", `${frame.clientHeight / k}px`);
    this.style.setProperty("--tc-pvc-w", `${Math.max(1, this.previewWidth)}px`);
  }

  private open(e: Event) {
    const ok = this.emit("tc-open", { href: this.href || null }, { cancelable: true });
    if (!ok) e.preventDefault();
  }

  protected override render() {
    const level = Math.min(6, Math.max(2, Math.round(this.headingLevel) || 3));
    const title = this.loading
      ? html`<span class="ui-pvc__bar ui-pvc__bar--title"></span>`
      : this.href
        ? html`<a class="ui-pvc__link" href=${this.href} @click=${this.open}>${this.heading}</a>`
        : html`<button type="button" class="ui-pvc__link" @click=${this.open}>${this.heading}</button>`;
    return html`<div class="ui-pvc__part ui-pvc__stage" aria-hidden="true"></div>
      <div class="ui-pvc__part ui-pvc__frame">
        ${this.loading ? html`<span class="ui-pvc__shimmer" aria-hidden="true"></span>` : this.src ? html`<img class="ui-pvc__img" src=${this.src} alt=${this.alt} loading="lazy" decoding="async" />` : nothing}
      </div>
      ${this.badge && !this.loading ? html`<span class="ui-pvc__part ui-pvc__badge">${this.badge}</span>` : nothing}
      <div class="ui-pvc__part ui-pvc__body">
        ${this.loading ? html`<div class="ui-pvc__title">${title}</div>` : html`<div class="ui-pvc__title" role="heading" aria-level=${level}>${title}</div>`}
        ${this.loading
          ? html`<span class="ui-pvc__bar"></span><span class="ui-pvc__bar ui-pvc__bar--short"></span>`
          : this.description
            ? html`<p class="ui-pvc__description">${this.description}</p>`
            : nothing}
      </div>`;
  }

  static override css = /* css */ `
[data-ui="pvc"] {
  --tc-pvc-pad: var(--tc-space-4);
  --tc-pvc-ratio: 16 / 10;
  --tc-pvc-side: 40%;
  --tc-pvc-lift: calc(var(--tc-space-0-5) * -1);
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "preview" "body";
  box-sizing: border-box;
  width: 100%;
  overflow: clip;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  transition: transform var(--tc-duration-base) var(--tc-ease-move), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
[data-ui="pvc"][orientation="horizontal"] { grid-template-columns: var(--tc-pvc-side) minmax(0, 1fr); grid-template-areas: "preview body"; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pvc"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pvc"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="pvc"]:hover { transform: translateY(var(--tc-pvc-lift)); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pvc"]:hover { box-shadow: var(--tc-card-shadow-hover); }
[data-ui="pvc"]:has(.ui-pvc__link:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }

/* The preview: a background area, the frame on it, and the page's children laid over the frame */
.ui-pvc__stage { grid-area: preview; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pvc"] .ui-pvc__stage { background: var(--tc-surface-sunken); border-block-end: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pvc"][orientation="horizontal"] .ui-pvc__stage { border-block-end: 0; border-inline-end: var(--tc-hairline) solid var(--tc-divider); }
.ui-pvc__frame,
[data-ui="pvc"] > :not(.ui-pvc__part) {
  grid-area: preview;
  align-self: start;
  margin: var(--tc-pvc-pad) var(--tc-pvc-pad) 0;
  border-radius: var(--tc-radius-md);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pvc"] :is(.ui-pvc__frame, [data-ui="pvc"] > :not(.ui-pvc__part)) { margin: 0 0 var(--tc-tray-inset); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pvc"][orientation="horizontal"] :is(.ui-pvc__frame, [data-ui="pvc"] > :not(.ui-pvc__part)) { margin: 0 var(--tc-tray-inset) 0 0; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pvc"][orientation="horizontal"] :is(.ui-pvc__frame, [data-ui="pvc"] > :not(.ui-pvc__part)) { margin: var(--tc-pvc-pad); }
.ui-pvc__frame {
  position: relative;
  aspect-ratio: var(--tc-pvc-ratio);
  overflow: hidden;
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle);
}
.ui-pvc__img { display: block; width: 100%; height: 100%; object-fit: cover; }
[data-ui="pvc"][fit="contain"] .ui-pvc__img { object-fit: contain; }
[data-ui="pvc"] > :not(.ui-pvc__part) { z-index: 1; box-sizing: border-box; width: auto; height: auto; aspect-ratio: var(--tc-pvc-ratio); overflow: hidden; pointer-events: none; object-fit: cover; }
[data-ui="pvc"][fit="contain"] > :not(.ui-pvc__part) { object-fit: contain; }
[data-ui="pvc"][fit="scale"] > :not(.ui-pvc__part) {
  justify-self: start;
  width: var(--tc-pvc-w, 1024px);
  height: var(--tc-pvc-h, 640px);
  aspect-ratio: auto;
  border-radius: calc(var(--tc-radius-md) / var(--tc-pvc-k, 1));
  transform: scale(var(--tc-pvc-k, 1));
  transform-origin: top left;
}

.ui-pvc__badge {
  grid-area: preview;
  z-index: 2;
  align-self: start;
  justify-self: end;
  margin: calc(var(--tc-pvc-pad) + var(--tc-space-2));
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-surface-inverse);
  color: var(--tc-text-on-inverse);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pvc"] .ui-pvc__badge { margin: var(--tc-space-2); }

/* The words */
.ui-pvc__body { grid-area: body; display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-pvc-pad); }
[data-ui="pvc"][orientation="horizontal"] .ui-pvc__body { align-content: center; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pvc"] .ui-pvc__body { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-pvc__title { margin: 0; min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); }
.ui-pvc__link {
  display: block;
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
/* The title's hit area covers the whole card */
.ui-pvc__link::after { content: ""; position: absolute; inset: 0; z-index: 3; }
.ui-pvc__link:focus-visible { outline: none; }
.ui-pvc__description { display: -webkit-box; margin: 0; overflow: hidden; color: var(--tc-text-secondary); -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }

/* Loading: grey bars and a shimmer in the frame */
.ui-pvc__bar { display: block; height: var(--tc-space-3); width: 100%; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); }
.ui-pvc__bar--title { width: 55%; height: var(--tc-space-4); }
.ui-pvc__bar--short { width: 70%; }
.ui-pvc__shimmer { position: absolute; inset: 0; background: var(--tc-fill-subtle); overflow: hidden; }
.ui-pvc__shimmer::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--tc-shimmer), transparent); transform: translateX(-100%); animation: ui-pvc-shimmer var(--tc-duration-shimmer) linear infinite; }
[data-ui="pvc"][data-paused] .ui-pvc__shimmer::after { animation-play-state: paused; }
[data-ui="pvc"][loading] > :not(.ui-pvc__part) { visibility: hidden; }
@keyframes ui-pvc-shimmer { to { transform: translateX(100%); } }

@media (prefers-reduced-motion: reduce) {
  [data-ui="pvc"] { transition: none; }
  [data-ui="pvc"]:hover { transform: none; }
  .ui-pvc__shimmer::after { animation: none; }
}
@media (forced-colors: active) {
  [data-ui="pvc"] { border: 1px solid CanvasText; }
  .ui-pvc__frame { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-preview-card")) customElements.define("tc-preview-card", TcPreviewCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-preview-card": TcPreviewCard;
  }
}
