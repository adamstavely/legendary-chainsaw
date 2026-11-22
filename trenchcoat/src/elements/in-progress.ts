import { svg } from "lit";
import { docStageCss, DocStage } from "./internal/doc-stage";

/*
 * <tc-in-progress> – a document with three dots on it, for work that has started and isn't finished yet. On the badge, the three dots pulse one after another a few times, then rest.
 * One of the document-status illustrations beside released, processing, awaiting-review and upload-failed, drawn the
 * same way (internal/doc-stage.ts): a soft page tile, one pastel badge with a darker edge and ink, and a soft
 * glow beneath, on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-in-progress caption="In progress"></tc-in-progress>
 *
 * It says where something stands, so the host is an image named by `label`, or else by `caption`. Set caption="" and
 * leave `label` empty when the words beside it already say so: it's then decorative. The motion is finite, holds still
 * off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the page theme
 * through light-dark().
 */

/**
 * A document with three dots on it, for work that has started and isn't finished yet.
 * @tag tc-in-progress
 */
export class TcInProgress extends DocStage {
  static override ui = "inp";
  static override css = docStageCss({
    ui: "inp",
    name: "in-progress",
    palette: { mark: ["#e0ecfd", "#1f3456"], markEdge: ["#93b8f0", "#5f88c9"], ink: ["#1f4f99", "#d3e3fb"], glow: ["rgba(100, 150, 230, 0.24)", "rgba(100, 150, 230, 0.12)"] },
    motion: ["pulse"],
    css: /* css */ `
.ui-inp-pulse { transform-box: fill-box; transform-origin: center; animation: ui-inp-pulse calc(var(--tc-in-progress-beat) / 2) var(--tc-ease-standard) 4 both; }
@keyframes ui-inp-pulse { 0%, 100% { opacity: 0.35; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.15); } }
`,
  });

  constructor() {
    super();
    this.caption = "In progress";
  }

  protected override motif() {
    return svg`<circle class="ui-inp-dot ui-inp-pulse" cx="147" cy="126" r="4"></circle><circle class="ui-inp-dot ui-inp-pulse" cx="160" cy="126" r="4" style="animation-delay: calc(var(--tc-in-progress-beat) / 8)"></circle><circle class="ui-inp-dot ui-inp-pulse" cx="173" cy="126" r="4" style="animation-delay: calc(var(--tc-in-progress-beat) / 4)"></circle>`;
  }
}

if (!customElements.get("tc-in-progress")) customElements.define("tc-in-progress", TcInProgress);

declare global {
  interface HTMLElementTagNameMap {
    "tc-in-progress": TcInProgress;
  }
}
