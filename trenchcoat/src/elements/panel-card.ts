import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { tokenMs } from "./internal/util";

/*
 * <tc-panel-card> – one section of a side panel: a heading, a short value at the right and the page's own content,
 * which folds away. As a link it has no content: the whole row opens something else, such as a details view.
 * Children stay where the page put them, so they keep their state through every toggle; shut, they aren't drawn, so
 * they can't be reached. A child with slot="aside" sits beside the value.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-panel-card heading="Outputs" value="51" expanded><ul>…</ul></tc-panel-card>
 *   <tc-panel-card heading="Connectors" value="14 to reconnect" mode="link"></tc-panel-card>
 */

export type PanelCardMode = "fold" | "link";
export type PanelCardExpandedChange = { expanded: boolean };

let nextId = 0;

/**
 * A compact card for one section of a side panel, which folds or opens something else.
 * @tag tc-panel-card
 * @fires tc-expanded-change - The section was opened or shut ({ expanded }: PanelCardExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-open - The row was pressed in "link" mode (detail: null)
 */
export class TcPanelCard extends TcElement {
  static override ui = "pnc";

  /** The section's name */
  @property() accessor heading = "";
  /** Short text at the right, such as a count */
  @property() accessor value = "";
  /** "fold" opens and shuts the content; "link" makes the whole row a button that fires tc-open */
  @property({ reflect: true }) accessor mode: PanelCardMode = "fold";
  /** Whether the content shows, in "fold" mode */
  @property({ type: Boolean, reflect: true }) accessor expanded = false;
  /** Drops the tray and shadow, for a card that sits in something else's surface */
  @property({ type: Boolean, reflect: true }) accessor bare = false;

  private uid = `tc-panel-card-${++nextId}`;
  private heightBefore: number | undefined;
  private motion: Animation | undefined;

  override connectedCallback() {
    super.connectedCallback();
    // aria-controls needs a target, and the content is the page's own children: the card itself holds them
    if (!this.id) this.id = this.uid;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.hasUpdated && changed.has("expanded") && this.isFold) this.heightBefore = this.offsetHeight;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const from = this.heightBefore;
    this.heightBefore = undefined;
    if (from === undefined || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.motion?.cancel();
    const to = this.offsetHeight;
    if (from === to || !this.animate) return;
    const easing = getComputedStyle(this).getPropertyValue("--tc-ease-move").trim() || "ease";
    this.motion = this.animate({ height: [`${from}px`, `${to}px`], overflow: ["hidden", "hidden"] }, { duration: tokenMs(this, "--tc-duration-slow", 0), easing });
  }

  private get isFold() {
    return this.mode !== "link";
  }

  private press() {
    if (!this.isFold) {
      this.emit("tc-open", null);
      return;
    }
    const expanded = !this.expanded;
    if (this.emit<PanelCardExpandedChange>("tc-expanded-change", { expanded }, { cancelable: true })) this.expanded = expanded;
  }

  protected override render() {
    const fold = this.isFold;
    // Lucide chevron-right (ISC licence); it turns to point down when the section is open
    const chevron = html`<svg class="ui-pnc__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m9 18 6-6-6-6"/>`}</svg>`;
    const inner = html`<span class="ui-pnc__title">${this.heading}</span>${chevron}${this.value ? html`<span class="ui-pnc__value">${this.value}</span>` : nothing}`;
    return html`<h3 class="ui-pnc__head">
        ${fold
          ? html`<button type="button" class="ui-pnc__button" aria-expanded=${this.expanded ? "true" : "false"} aria-controls=${this.id || this.uid} @click=${this.press}>${inner}</button>`
          : html`<button type="button" class="ui-pnc__button" @click=${this.press}>${inner}</button>`}
      </h3>
      <div class="ui-pnc__card" aria-hidden="true"></div>
      <div class="ui-pnc__top" aria-hidden="true"></div>`;
  }

  static override css = /* css */ `
[data-ui="pnc"] {
  --tc-pnc-pad: var(--tc-space-3);
  --tc-pnc-glyph: var(--tc-space-3-5);
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pnc"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pnc"] { padding-bottom: var(--tc-space-0-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="pnc"][bare] { padding: 0; border-radius: 0; background: none; box-shadow: none; }

.ui-pnc__head { grid-row: 1; grid-column: 1; min-width: 0; margin: 0; font: inherit; }
.ui-pnc__button {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  box-sizing: border-box;
  width: 100%;
  min-height: var(--tc-control-h-sm);
  padding: var(--tc-space-2) var(--tc-pnc-pad);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: none;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  text-align: start;
  cursor: pointer;
}
.ui-pnc__button:hover .ui-pnc__chevron { color: var(--tc-text-primary); }
.ui-pnc__button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-pnc__title { min-width: 0; font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-pnc__chevron { flex: none; width: var(--tc-pnc-glyph); height: var(--tc-pnc-glyph); color: var(--tc-text-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
[data-ui="pnc"][expanded]:not([mode="link"]) .ui-pnc__chevron { transform: rotate(90deg); }
.ui-pnc__value { margin-inline-start: auto; padding-inline-start: var(--tc-space-2); color: var(--tc-text-muted); text-align: end; font-variant-numeric: tabular-nums; }

/* The aside sits beside the value, outside the button, so it can hold a control of its own */
[data-ui="pnc"] > [slot="aside"] { grid-row: 1; grid-column: 2; margin-inline-end: var(--tc-pnc-pad); }

/* The page's children */
[data-ui="pnc"] > :not(.ui-pnc__head, .ui-pnc__card, .ui-pnc__top, [slot="aside"]) { position: relative; z-index: 1; grid-column: 1 / -1; width: auto; margin-inline: var(--tc-pnc-pad); min-width: 0; }
[data-ui="pnc"]::after { content: ""; grid-column: 1 / -1; height: var(--tc-pnc-pad); }
.ui-pnc__top { order: -1; grid-column: 1 / -1; height: var(--tc-space-1); }
/* Behind the children, from the second row to the tray's inset. The children stay the host's own, so no box can hold them */
.ui-pnc__card { display: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pnc"]:not([bare]) .ui-pnc__card {
  display: block;
  position: absolute;
  z-index: 0;
  grid-column: 1 / -1;
  grid-row: 2 / auto;
  inset: 0 0 var(--tc-tray-inset);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pnc"]:not([bare]) .ui-pnc__top { height: var(--tc-pnc-pad); }

/* Shut, or a link: only the header */
[data-ui="pnc"]:not([expanded]) > :not(.ui-pnc__head, [slot="aside"]),
[data-ui="pnc"][mode="link"] > :not(.ui-pnc__head, [slot="aside"]) { display: none !important; }
[data-ui="pnc"]:not([expanded])::after, [data-ui="pnc"][mode="link"]::after { display: none; }

@media (prefers-reduced-motion: reduce) {
  .ui-pnc__chevron { transition: none; }
}
@media (forced-colors: active) {
  .ui-pnc__chevron { color: CanvasText; }
}
`;
}

if (!customElements.get("tc-panel-card")) customElements.define("tc-panel-card", TcPanelCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-panel-card": TcPanelCard;
  }
}
