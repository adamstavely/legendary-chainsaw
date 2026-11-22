import { svg } from "lit";
import { docStageCss, DocStage } from "./internal/doc-stage";

/*
 * <tc-metadata-cleansing-required> – a document with a tag on it and a few specks beside it, for records whose metadata needs tidying before they can move on. On the badge, the specks twinkle twice, then rest.
 * One of the document-status illustrations beside released, processing, awaiting-review and upload-failed, drawn the
 * same way (internal/doc-stage.ts): a soft page tile, one pastel badge with a darker edge and ink, and a soft
 * glow beneath, on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-metadata-cleansing-required caption="Metadata cleansing required"></tc-metadata-cleansing-required>
 *
 * It says where something stands, so the host is an image named by `label`, or else by `caption`. Set caption="" and
 * leave `label` empty when the words beside it already say so: it's then decorative. The motion is finite, holds still
 * off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the page theme
 * through light-dark().
 */

/**
 * A document with a tag on it and a few specks beside it, for records whose metadata needs tidying before they can move on.
 * @tag tc-metadata-cleansing-required
 */
export class TcMetadataCleansingRequired extends DocStage {
  static override ui = "mcr";
  static override css = docStageCss({
    ui: "mcr",
    name: "metadata-cleansing-required",
    palette: { mark: ["#fdf0d5", "#4a3a14"], markEdge: ["#ecc06a", "#c9a24a"], ink: ["#7f5300", "#f7e2b5"], glow: ["rgba(230, 170, 70, 0.24)", "rgba(230, 170, 70, 0.12)"] },
    motion: ["speck"],
    css: /* css */ `
.ui-mcr-speck { animation: ui-mcr-twinkle calc(var(--tc-metadata-cleansing-required-beat) / 2) var(--tc-ease-standard) calc(var(--tc-metadata-cleansing-required-beat) * 0.2) 2 both; }
@keyframes ui-mcr-twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
`,
  });

  constructor() {
    super();
    this.caption = "Metadata cleansing required";
  }

  protected override motif() {
    return svg`<path class="ui-mcr-ink" d="M144 117a3 3 0 0 1 3-3h16l11 12-11 12h-16a3 3 0 0 1-3-3Z"></path><circle class="ui-mcr-dot" cx="152" cy="126" r="2.5"></circle>`;
  }

  protected override beside() {
    return svg`<path class="ui-mcr-ink ui-mcr-speck" d="M195 94l5-5M203 108h7M189 86v-7"></path><circle class="ui-mcr-dot ui-mcr-speck" cx="210" cy="92" r="2.5"></circle>`;
  }
}

if (!customElements.get("tc-metadata-cleansing-required")) customElements.define("tc-metadata-cleansing-required", TcMetadataCleansingRequired);

declare global {
  interface HTMLElementTagNameMap {
    "tc-metadata-cleansing-required": TcMetadataCleansingRequired;
  }
}
