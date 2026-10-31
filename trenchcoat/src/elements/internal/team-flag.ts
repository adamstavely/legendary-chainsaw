import { html, svg } from "lit";
import { styleMap } from "lit/directives/style-map.js";

/** A flag a team has defined: its colour and what it means */
export type TeamFlag = {
  id: string;
  /** The flag's name, shown beside it wherever it's used */
  label: string;
  /** What the flag means, so everyone uses it the same way */
  meaning?: string;
  /** A hex colour, "#rrggbb" */
  color: string;
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** The flag's shape, after Lucide's "flag" (ISC). Without a colour it's only an outline: no flag, or one that's gone */
export function flagGlyph(color?: string) {
  const fill = color && HEX.test(color) ? color : undefined;
  return html`<svg class="tc-flag-glyph" viewBox="0 0 24 24" aria-hidden="true" style=${styleMap(fill ? { "--tc-flag-color": fill } : {})} data-filled=${fill ? "true" : "false"}>${svg`<path d="M4 22V15"></path><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>`}</svg>`;
}

export const flagGlyphCss = /* css */ `
.tc-flag-glyph { flex: none; width: var(--tc-icon-size-md, 16px); height: var(--tc-icon-size-md, 16px); fill: none; stroke: var(--tc-text-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.tc-flag-glyph[data-filled="true"] { fill: var(--tc-flag-color); stroke: var(--tc-text-primary); }
@media (forced-colors: active) {
  .tc-flag-glyph, .tc-flag-glyph[data-filled="true"] { stroke: CanvasText; }
}
`;
