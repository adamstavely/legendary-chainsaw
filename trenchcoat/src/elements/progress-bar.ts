import { html } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";

/*
 * <tc-progress-bar> – a thin bar for a page or panel. With `value` (0 to 1) it shows how far along things are; without
 * it, a sweep says work is happening but not how much is left. `done` fills it and fades it out, which also ends the
 * sweep. With reduced motion, an unknown wait is a still, partly filled bar with its word beside it.
 *
 *   <tc-progress-bar label="Loading results"></tc-progress-bar>
 */

/**
 * A thin bar for a wait, of known or unknown length.
 * @tag tc-progress-bar
 */
export class TcProgressBar extends TcElement {
  static override ui = "pgb";
  static override looks = false;

  /** How far along, 0 to 1. Unset, the length of the wait isn't known */
  @property({ type: Number }) accessor value: number | undefined = undefined;
  /** What's being waited for: names the bar */
  @property() accessor label = "Loading";
  /** The work has finished: fills the bar and fades it out */
  @property({ type: Boolean, reflect: true }) accessor done = false;

  private get known() {
    return typeof this.value === "number" && Number.isFinite(this.value);
  }

  protected override render() {
    const share = this.done ? 1 : this.known ? Math.min(1, Math.max(0, this.value!)) : null;
    const percent = share === null ? undefined : Math.round(share * 100);
    this.toggleAttribute("data-unknown", share === null);
    return html`${share === null
        ? html`<div class="ui-pgb-track" role="progressbar" aria-label=${this.label}><div class="ui-pgb-fill"></div></div>`
        : html`<div class="ui-pgb-track" role="progressbar" aria-label=${this.label} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${percent!}>
            <div class="ui-pgb-fill" style=${styleMap({ width: `${percent}%` })}></div>
          </div>`}
      <span class="ui-pgb-word" aria-hidden="true">${this.label}</span>`;
  }

  static override css = /* css */ `
[data-ui="pgb"] {
  --tc-progress-bar-height: 3px;
  --tc-progress-bar-track: var(--tc-meter-track);
  --tc-progress-bar-fill: var(--tc-meter-fill);
  display: block;
  width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-xs);
  color: var(--tc-text-secondary);
}
.ui-pgb-track { position: relative; height: var(--tc-progress-bar-height); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-progress-bar-track); }
.ui-pgb-fill { height: 100%; border-radius: inherit; background: var(--tc-progress-bar-fill); transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-pgb-word { display: none; }
[data-ui="pgb"][data-unknown] .ui-pgb-fill { width: 40%; animation: ui-pgb-sweep var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
@keyframes ui-pgb-sweep { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
[data-ui="pgb"][done] { animation: ui-pgb-gone var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-slow) both; }
@keyframes ui-pgb-gone { from { opacity: 1; } to { opacity: 0; visibility: hidden; } }
@media (prefers-reduced-motion: reduce) {
  .ui-pgb-fill { transition: none; }
  [data-ui="pgb"][data-unknown] .ui-pgb-fill { animation: none; }
  [data-ui="pgb"][data-unknown] .ui-pgb-word { display: block; margin-top: var(--tc-space-1); }
  [data-ui="pgb"][done] { animation: none; visibility: hidden; }
}
@media (forced-colors: active) {
  .ui-pgb-track { outline: 1px solid CanvasText; }
  .ui-pgb-fill { background: Highlight; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-progress-bar")) customElements.define("tc-progress-bar", TcProgressBar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-progress-bar": TcProgressBar;
  }
}
