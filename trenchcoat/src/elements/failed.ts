import { svg } from "lit";
import { docStageCss, DocStage } from "./internal/doc-stage";

/*
 * <tc-failed> – a document with a cross on it, for something that didn't work – a job, an import or a check. On the badge, the cross draws itself as the badge gives one small shake, then it rests.
 * One of the document-status illustrations beside released, processing, awaiting-review and upload-failed, drawn the
 * same way (internal/doc-stage.ts): a soft page tile, one pastel badge with a darker edge and ink, and a soft
 * glow beneath, on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-failed caption="Failed"></tc-failed>
 *
 * It says where something stands, so the host is an image named by `label`, or else by `caption`. Set caption="" and
 * leave `label` empty when the words beside it already say so: it's then decorative. The motion is finite, holds still
 * off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the page theme
 * through light-dark().
 */

/**
 * A document with a cross on it, for something that didn't work – a job, an import or a check.
 * @tag tc-failed
 */
export class TcFailed extends DocStage {
  static override ui = "fai";
  static override css = docStageCss({
    ui: "fai",
    name: "failed",
    palette: { mark: ["#fde2df", "#5a2724"], markEdge: ["#f0a197", "#c96a60"], ink: ["#a8231a", "#fbd2cd"], glow: ["rgba(240, 112, 102, 0.2)", "rgba(240, 112, 102, 0.1)"] },
    motion: ["cross", "mark"],
    css: /* css */ `
.ui-fai-cross { stroke-dasharray: 32; animation: ui-fai-draw calc(var(--tc-failed-beat) * 0.25) var(--tc-ease-move) calc(var(--tc-failed-beat) / 16) backwards; }
.ui-fai-mark { transform-box: fill-box; transform-origin: center; animation: ui-fai-shake calc(var(--tc-failed-beat) * 0.2) var(--tc-ease-standard) calc(var(--tc-failed-beat) * 0.3) 1; }
@keyframes ui-fai-draw { from { stroke-dashoffset: 32; } to { stroke-dashoffset: 0; } }
@keyframes ui-fai-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-2px); } }
`,
  });

  protected override get defaultCaption() {
    return "Failed";
  }

  protected override motif() {
    return svg`<path class="ui-fai-ink ui-fai-cross" d="M149 115l22 22M171 115l-22 22"></path>`;
  }
}

if (!customElements.get("tc-failed")) customElements.define("tc-failed", TcFailed);

declare global {
  interface HTMLElementTagNameMap {
    "tc-failed": TcFailed;
  }
}
