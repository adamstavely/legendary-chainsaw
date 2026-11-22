import { svg } from "lit";
import { docStageCss, DocStage } from "./internal/doc-stage";

/*
 * <tc-added-to-readbook> – a book with a bookmark and a check on it, for something that was saved to a reading list. On the badge, the check draws itself once, then it rests.
 * One of the document-status illustrations beside released, processing, awaiting-review and upload-failed, drawn the
 * same way (internal/doc-stage.ts): a soft book tile, one pastel badge with a darker edge and ink, and a soft
 * glow beneath, on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-added-to-readbook caption="Added to Readbook"></tc-added-to-readbook>
 *
 * It says where something stands, so the host is an image named by `label`, or else by `caption`. Set caption="" and
 * leave `label` empty when the words beside it already say so: it's then decorative. The motion is finite, holds still
 * off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the page theme
 * through light-dark().
 */

/**
 * A book with a bookmark and a check on it, for something that was saved to a reading list.
 * @tag tc-added-to-readbook
 */
export class TcAddedToReadbook extends DocStage {
  static override ui = "rdb";
  static override css = docStageCss({
    ui: "rdb",
    name: "added-to-readbook",
    palette: { mark: ["#dcf3e2", "#1f4a2c"], markEdge: ["#86cf9c", "#64bf80"], ink: ["#22743b", "#c9f0d4"], glow: ["rgba(90, 190, 120, 0.24)", "rgba(90, 190, 120, 0.12)"] },
    motion: ["tick"],
    css: /* css */ `
.ui-rdb-tick { stroke-dasharray: 40; animation: ui-rdb-draw calc(var(--tc-added-to-readbook-beat) * 0.3) var(--tc-ease-move) calc(var(--tc-added-to-readbook-beat) / 16) backwards; }
@keyframes ui-rdb-draw { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
`,
  });

  protected override tile = "book" as const;

  protected override get defaultCaption() {
    return "Added to Readbook";
  }

  protected override motif() {
    return svg`<path class="ui-rdb-ink ui-rdb-tick" d="M146 127l9 9 19-19"></path>`;
  }
}

if (!customElements.get("tc-added-to-readbook")) customElements.define("tc-added-to-readbook", TcAddedToReadbook);

declare global {
  interface HTMLElementTagNameMap {
    "tc-added-to-readbook": TcAddedToReadbook;
  }
}
