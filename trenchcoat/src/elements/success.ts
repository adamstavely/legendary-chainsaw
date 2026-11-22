import { svg } from "lit";
import { docStageCss, DocStage } from "./internal/doc-stage";

/*
 * <tc-success> – a document with a check on it and a ring that pops out once, for something that finished without a problem. On the badge, the check draws itself once and a ring pops out from the badge, then it rests.
 * One of the document-status illustrations beside released, processing, awaiting-review and upload-failed, drawn the
 * same way (internal/doc-stage.ts): a soft page tile, one pastel badge with a darker edge and ink, and a soft
 * glow beneath, on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-success caption="Success"></tc-success>
 *
 * It says where something stands, so the host is an image named by `label`, or else by `caption`. Set caption="" and
 * leave `label` empty when the words beside it already say so: it's then decorative. The motion is finite, holds still
 * off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the page theme
 * through light-dark().
 */

/**
 * A document with a check on it and a ring that pops out once, for something that finished without a problem.
 * @tag tc-success
 */
export class TcSuccess extends DocStage {
  static override ui = "scs";
  static override css = docStageCss({
    ui: "scs",
    name: "success",
    palette: { mark: ["#dcf3e2", "#1f4a2c"], markEdge: ["#86cf9c", "#64bf80"], ink: ["#22743b", "#c9f0d4"], glow: ["rgba(90, 190, 120, 0.24)", "rgba(90, 190, 120, 0.12)"] },
    motion: ["tick", "pop"],
    css: /* css */ `
.ui-scs-tick { stroke-dasharray: 40; animation: ui-scs-draw calc(var(--tc-success-beat) * 0.3) var(--tc-ease-move) calc(var(--tc-success-beat) / 16) backwards; }
.ui-scs-pop { fill: none; stroke: var(--tc-success-mark-edge); stroke-width: 3; opacity: 0; transform-box: fill-box; transform-origin: center; animation: ui-scs-pop calc(var(--tc-success-beat) * 0.4) var(--tc-ease-move) calc(var(--tc-success-beat) * 0.25) 1 backwards; }
@keyframes ui-scs-draw { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
@keyframes ui-scs-pop { from { opacity: 0.9; transform: scale(1); } to { opacity: 0; transform: scale(1.45); } }
`,
  });

  protected override get defaultCaption() {
    return "Success";
  }

  protected override motif() {
    return svg`<path class="ui-scs-ink ui-scs-tick" d="M146 127l9 9 19-19"></path>`;
  }

  protected override beside() {
    return svg`<circle class="ui-scs-pop" cx="160" cy="126" r="30"></circle>`;
  }
}

if (!customElements.get("tc-success")) customElements.define("tc-success", TcSuccess);

declare global {
  interface HTMLElementTagNameMap {
    "tc-success": TcSuccess;
  }
}
