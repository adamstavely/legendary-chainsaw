import { html, svg } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import type { ClaimSourceType } from "../claim-answer";

/** Each claim source type's line, as tc-claim-answer underlines a claim; the key, pills and queue rows repeat it */
export const SOURCE_LINE: Record<ClaimSourceType, "solid" | "dashed" | "dotted" | "double" | "wavy"> = {
  grounded: "solid",
  model: "dashed",
  inferred: "dotted",
  transcript: "double",
  video: "double",
  audio: "double",
  image: "double",
  ocr: "double",
  session: "wavy",
  team: "wavy",
  agent: "wavy",
};

/** A short stretch of a source type's line (14×6), decorative; `cls` sizes and colours it */
export const sourceSwatch = (type: ClaimSourceType, cls: string) => {
  const line = SOURCE_LINE[type] ?? "solid";
  const d =
    line === "double" ? "M0 1.4h14M0 4.6h14"
    : line === "wavy" ? "M.75 3q1.6-2.6 3.25 0t3.25 0 3.25 0 3.25 0"
    : "M0 3h14";
  const dash = line === "dashed" ? "3.5 2" : line === "dotted" ? "0 3.5" : undefined;
  return html`<svg class=${cls} viewBox="0 0 14 6" aria-hidden="true">${svg`<path d=${d} data-line=${line} stroke-dasharray=${ifDefined(dash)}></path>`}</svg>`;
};
