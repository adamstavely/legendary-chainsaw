import { svg } from "lit";
import { property } from "lit/decorators.js";
import { docStageCss, DocStage } from "./internal/doc-stage";

/*
 * <tc-metadata-cleansing> – where a record's metadata cleansing stands, as a document with a tag on its badge and, on
 * the badge's corner, a small mark for the state. `status` picks it:
 *   · "required" (amber) – the metadata needs tidying before the record can move on; specks twinkle beside it
 *   · "in-progress" (blue) – it's being cleansed; three small dots pulse in turn a few times
 *   · "failed" (red) – cleansing didn't work; a cross, and the badge gives one small shake
 *   · "success" (green) – it's clean; a check draws itself
 * Its words follow the status ("Metadata cleansing required", "Cleansing metadata", "Metadata cleansing failed",
 * "Metadata cleansed") unless `caption` sets its own. One of the document-status illustrations beside released,
 * success, failed and in-progress, drawn the same way (internal/doc-stage.ts) on a 320 × 240 viewBox in a 3 : 2 frame.
 *
 *   <tc-metadata-cleansing status="in-progress"></tc-metadata-cleansing>
 *
 * It says where something stands, so the host is an image named by `label`, or else by its words. Set caption="" and
 * leave `label` empty when the words beside it already say so: it's then decorative. The motion is finite, holds still
 * off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the page theme
 * through light-dark().
 */

export type MetadataCleansingStatus = "required" | "in-progress" | "failed" | "success";

/** The words for each status, when `caption` isn't set */
export const metadataCleansingWords: Record<MetadataCleansingStatus, string> = {
  required: "Metadata cleansing required",
  "in-progress": "Cleansing metadata",
  failed: "Metadata cleansing failed",
  success: "Metadata cleansed",
};

const v = (k: string) => `--tc-metadata-cleansing-${k}`;
/** A status's badge colours, over the amber of "required" */
const tone = (status: string, mark: [string, string], edge: [string, string], ink: [string, string], glow: [string, string]) => /* css */ `
[data-ui="mcl"][status="${status}"] {
  ${v("mark")}: light-dark(${mark[0]}, ${mark[1]});
  ${v("mark-edge")}: light-dark(${edge[0]}, ${edge[1]});
  ${v("ink")}: light-dark(${ink[0]}, ${ink[1]});
  ${v("glow")}: light-dark(${glow[0]}, ${glow[1]});
}`;

/**
 * Where a record's metadata cleansing stands – required, in progress, failed or done – as a document with a tag on its badge and a small mark for the state.
 * @tag tc-metadata-cleansing
 */
export class TcMetadataCleansing extends DocStage {
  static override ui = "mcl";
  static override css = docStageCss({
    ui: "mcl",
    name: "metadata-cleansing",
    palette: { mark: ["#fdf0d5", "#4a3a14"], markEdge: ["#ecc06a", "#c9a24a"], ink: ["#7f5300", "#f7e2b5"], glow: ["rgba(230, 170, 70, 0.24)", "rgba(230, 170, 70, 0.12)"] },
    motion: ["speck", "pulse", "tick", "cross", "mark"],
    css: /* css */ `
${tone("in-progress", ["#e0ecfd", "#1f3456"], ["#93b8f0", "#5f88c9"], ["#1f4f99", "#d3e3fb"], ["rgba(100, 150, 230, 0.24)", "rgba(100, 150, 230, 0.12)"])}
${tone("failed", ["#fde2df", "#5a2724"], ["#f0a197", "#c96a60"], ["#a8231a", "#fbd2cd"], ["rgba(240, 112, 102, 0.2)", "rgba(240, 112, 102, 0.1)"])}
${tone("success", ["#dcf3e2", "#1f4a2c"], ["#86cf9c", "#64bf80"], ["#22743b", "#c9f0d4"], ["rgba(90, 190, 120, 0.24)", "rgba(90, 190, 120, 0.12)"])}
/* The small state mark on the badge's corner: the page colour behind it, the status's edge and ink */
.ui-mcl-chip { fill: var(${v("page")}); stroke: var(${v("mark-edge")}); stroke-width: 3; }
.ui-mcl-chip-ink { fill: none; stroke: var(${v("ink")}); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.ui-mcl-speck { animation: ui-mcl-twinkle calc(var(${v("beat")}) / 2) var(--tc-ease-standard) calc(var(${v("beat")}) * 0.2) 2 both; }
.ui-mcl-pulse { transform-box: fill-box; transform-origin: center; animation: ui-mcl-pulse calc(var(${v("beat")}) / 2) var(--tc-ease-standard) 4 both; }
.ui-mcl-tick { stroke-dasharray: 24; animation: ui-mcl-draw calc(var(${v("beat")}) * 0.3) var(--tc-ease-move) calc(var(${v("beat")}) / 16) backwards; }
.ui-mcl-cross { stroke-dasharray: 20; animation: ui-mcl-draw calc(var(${v("beat")}) * 0.25) var(--tc-ease-move) calc(var(${v("beat")}) / 16) backwards; }
[status="failed"] .ui-mcl-mark { transform-box: fill-box; transform-origin: center; animation: ui-mcl-shake calc(var(${v("beat")}) * 0.2) var(--tc-ease-standard) calc(var(${v("beat")}) * 0.3) 1; }
@keyframes ui-mcl-twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
@keyframes ui-mcl-pulse { 0%, 100% { opacity: 0.35; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.15); } }
@keyframes ui-mcl-draw { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
@keyframes ui-mcl-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-2px); } }
`,
  });

  /** Where the cleansing stands: "required", "in-progress", "failed" or "success" */
  @property({ reflect: true }) accessor status: MetadataCleansingStatus = "required";

  protected override get defaultCaption() {
    return metadataCleansingWords[this.status] ?? metadataCleansingWords.required;
  }

  protected override motif() {
    const s = this.status;
    // The tag, nudged left so the corner mark has room
    const tag = svg`<path class="ui-mcl-ink" d="M142 117a3 3 0 0 1 3-3h16l11 12-11 12h-16a3 3 0 0 1-3-3Z"></path><circle class="ui-mcl-dot" cx="150" cy="126" r="2.5"></circle>`;
    if (s === "required") return tag;
    const glyph =
      s === "success"
        ? svg`<path class="ui-mcl-chip-ink ui-mcl-tick" d="M178 149l5 5 10-10"></path>`
        : s === "failed"
          ? svg`<path class="ui-mcl-chip-ink ui-mcl-cross" d="M179 143l10 10M189 143l-10 10"></path>`
          : svg`<circle class="ui-mcl-dot ui-mcl-pulse" cx="177" cy="148" r="2.6"></circle><circle class="ui-mcl-dot ui-mcl-pulse" cx="184" cy="148" r="2.6" style="animation-delay: calc(var(--tc-metadata-cleansing-beat) / 8)"></circle><circle class="ui-mcl-dot ui-mcl-pulse" cx="191" cy="148" r="2.6" style="animation-delay: calc(var(--tc-metadata-cleansing-beat) / 4)"></circle>`;
    return svg`${tag}<circle class="ui-mcl-chip" cx="184" cy="148" r="15"></circle>${glyph}`;
  }

  protected override beside() {
    return this.status === "required"
      ? svg`<path class="ui-mcl-ink ui-mcl-speck" d="M195 94l5-5M203 108h7M189 86v-7"></path><circle class="ui-mcl-dot ui-mcl-speck" cx="210" cy="92" r="2.5"></circle>`
      : svg``;
  }
}

if (!customElements.get("tc-metadata-cleansing")) customElements.define("tc-metadata-cleansing", TcMetadataCleansing);

declare global {
  interface HTMLElementTagNameMap {
    "tc-metadata-cleansing": TcMetadataCleansing;
  }
}
