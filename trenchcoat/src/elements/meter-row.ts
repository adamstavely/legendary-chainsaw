import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";

/*
 * <tc-meter-row> – how full something is, on one line: a label, a percentage and a tiny bar. Past warnAt and dangerAt the
 * tone changes, with a mark and a word as well as the colour. It can be a button that opens the details, and `compact`
 * hides the label from sight, for sitting beside a panel card's value.
 * Standard: a white card on a gray tray. Clean: one white card.
 *
 *   <tc-meter-row label="Storage used" value="0.17"></tc-meter-row>
 *   <tc-meter-row label="Storage used" value="812" max="1000" interactive></tc-meter-row>
 */

export type MeterRowLabels = {
  /** Said and shown past warnAt */
  warning: string;
  /** Said and shown past dangerAt */
  danger: string;
};
export const defaultMeterRowLabels: MeterRowLabels = { warning: "Getting full", danger: "Nearly full" };

let nextId = 0;

/**
 * A label, a percentage and a tiny bar on one line, with a word and a mark when it's getting full.
 * @tag tc-meter-row
 * @fires tc-open - The row was pressed, when `interactive` (detail: null)
 */
export class TcMeterRow extends TcElement {
  static override ui = "mrw";

  /** What's being measured; it names the meter, even when `compact` hides it */
  @property() accessor label = "";
  /** How much is used, from 0 to `max` */
  @property({ type: Number }) accessor value = 0;
  /** What full is */
  @property({ type: Number }) accessor max = 1;
  /** Text to show in place of the percentage, such as "812 of 1,000" */
  @property({ attribute: "value-text" }) accessor valueText = "";
  /** The fraction of `max` where it starts to warn */
  @property({ type: Number, attribute: "warn-at" }) accessor warnAt = 0.8;
  /** The fraction of `max` where it turns to danger */
  @property({ type: Number, attribute: "danger-at" }) accessor dangerAt = 0.95;
  /** Makes the row a button that fires tc-open */
  @property({ type: Boolean, reflect: true }) accessor interactive = false;
  /** Hides the label from sight, leaving the percentage and bar */
  @property({ type: Boolean, reflect: true }) accessor compact = false;
  /** Drops the tray and shadow, for a row that sits in something else's surface */
  @property({ type: Boolean, reflect: true }) accessor bare = false;
  /** Rename the words */
  @property({ attribute: false }) accessor labels: Partial<MeterRowLabels> = {};

  private uid = `tc-meter-row-${++nextId}`;

  /** The safe maximum and value: anything that isn't a usable number counts as nothing */
  private get limits() {
    const max = Number.isFinite(this.max) && this.max > 0 ? this.max : 1;
    const value = Number.isFinite(this.value) ? Math.min(max, Math.max(0, this.value)) : 0;
    return { max, value, fraction: value / max };
  }

  private get tone(): "normal" | "warning" | "danger" {
    const { fraction } = this.limits;
    if (fraction >= this.dangerAt) return "danger";
    return fraction >= this.warnAt ? "warning" : "normal";
  }

  protected override render() {
    const { max, value, fraction } = this.limits;
    const tone = this.tone;
    const shown = this.valueText || `${Math.round(fraction * 100)}%`;
    const words = { ...defaultMeterRowLabels, ...this.labels };
    const word = tone === "normal" ? "" : words[tone];
    const labelId = `${this.uid}-label`;
    const name = html`<span class=${this.compact ? "tc-sr-only" : "ui-mrw__name"} id=${labelId}>${this.label}</span>`;
    // Lucide triangle-alert and circle-alert (ISC licence)
    const mark =
      tone === "normal"
        ? nothing
        : html`<svg class="ui-mrw__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            >${tone === "danger"
              ? svg`<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>`
              : svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>`}</svg
          >`;
    return html`<div class="ui-mrw__row" data-tone=${tone}>
      ${this.interactive ? html`<button type="button" class="ui-mrw__open" @click=${() => this.emit("tc-open", null)}>${name}</button>` : name}
      <div class="ui-mrw__meter" .role=${"meter"} aria-labelledby=${labelId} aria-valuemin="0" aria-valuemax=${max} aria-valuenow=${value} aria-valuetext=${word ? `${shown}, ${word}` : shown}>
        ${mark}<span class="ui-mrw__value">${shown}</span>${word ? html`<span class="tc-sr-only">${word}</span>` : nothing}
        <span class="ui-mrw__bar" aria-hidden="true"><span class="ui-mrw__fill" style=${styleMap({ "--tc-mrw-fill": String(fraction) })}></span></span>
      </div>
    </div>`;
  }

  static override css = /* css */ `
[data-ui="mrw"] {
  --tc-mrw-bar: var(--tc-space-10);
  --tc-mrw-bar-h: var(--tc-space-1);
  --tc-mrw-glyph: var(--tc-space-3-5);
  box-sizing: border-box;
  width: 100%;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mrw"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mrw"] .ui-mrw__row { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mrw"] .ui-mrw__row { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="mrw"][bare], [data-ui="mrw"][compact] { padding: 0; border-radius: 0; background: none; }
[data-ui="mrw"][compact] { width: auto; }
[data-ui="mrw"][bare] .ui-mrw__row, [data-ui="mrw"][compact] .ui-mrw__row { background: none; box-shadow: none; padding: 0; }

.ui-mrw__row { position: relative; display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-2) var(--tc-space-3); }
.ui-mrw__name { min-width: 0; font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-mrw__meter { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-mrw__mark { flex: none; width: var(--tc-mrw-glyph); height: var(--tc-mrw-glyph); }
.ui-mrw__bar { display: block; flex: none; width: var(--tc-mrw-bar); height: var(--tc-mrw-bar-h); margin-inline-start: var(--tc-space-1); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-border-default); }
.ui-mrw__fill { display: block; width: calc(var(--tc-mrw-fill) * 100%); height: 100%; border-radius: inherit; background: var(--tc-accent-solid); transition: width var(--tc-duration-base) var(--tc-ease-move); }
[data-tone="warning"] .ui-mrw__meter { color: var(--tc-status-warning-fg); }
[data-tone="danger"] .ui-mrw__meter { color: var(--tc-status-danger-fg); }
[data-tone="warning"] .ui-mrw__fill { background: var(--tc-status-warning-solid); }
[data-tone="danger"] .ui-mrw__fill { background: var(--tc-status-danger-solid); }

/* The button stretches over the whole row and the meter stays beside it, because a button's content isn't read as a meter */
.ui-mrw__open { min-height: var(--tc-control-h-sm); margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; text-align: start; cursor: pointer; }
.ui-mrw__open::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.ui-mrw__open:focus-visible { outline: none; }
.ui-mrw__open:focus-visible::after { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="mrw"][compact] .ui-mrw__open { min-width: var(--tc-control-h-sm); }

@media (prefers-reduced-motion: reduce) {
  .ui-mrw__fill { transition: none; }
}
@media (forced-colors: active) {
  .ui-mrw__bar { outline: 1px solid CanvasText; }
  .ui-mrw__fill { background: CanvasText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-meter-row")) customElements.define("tc-meter-row", TcMeterRow);

declare global {
  interface HTMLElementTagNameMap {
    "tc-meter-row": TcMeterRow;
  }
}
