import { html, nothing, svg, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./base";
import { OnScreenController } from "./controllers";

/*
 * What the document-status illustrations share – Success, Failed, In Progress, Metadata Cleansing Required, Malware
 * Scan In Progress and Added to Readbook: a soft tile (a page with its corner folded, or a closed book), a few lines of
 * text on it, one pastel badge with a darker edge and ink, a soft glow beneath, and the words as real text under it.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, the same as Released and its siblings, so they sit together.
 *
 * A stage gives its palette, its tile, the drawing on its badge (`motif()`, in the badge's ink, centred on 160, 126 with
 * a radius of 30) and the CSS for its motion. The base does the rest:
 *   · the host is an image named by `label`, or else by `caption`; with neither it's decorative (aria-hidden)
 *   · the motion is finite, holds still off screen or in a hidden tab (data-paused) and stays still with reduced motion
 *   · colours follow the page theme through light-dark()
 */

/** A stage's colours: the badge, its edge, its ink and the glow beneath, each [light, dark] */
export type DocStagePalette = {
  mark: [string, string];
  markEdge: [string, string];
  ink: [string, string];
  glow: [string, string];
};

/**
 * The CSS for one stage: its custom properties (`--tc-<name>-…`), the shared tile, badge, glow and caption rules under
 * its own prefix (`ui-<ui>-…`), and its own motion rules. `motion` names the classes that animate, so they pause off
 * screen and stay still with reduced motion.
 */
export function docStageCss(o: { ui: string; name: string; palette: DocStagePalette; motion: string[]; css: string }) {
  const { ui, name, palette: p } = o;
  const v = (k: string) => `--tc-${name}-${k}`;
  const moving = [`.ui-${ui}-glow`, ...o.motion.map((c) => `.ui-${ui}-${c}`)].join(", ");
  return /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="${ui}"] {
  ${v("page")}: light-dark(#ffffff, #2a2a2e);
  ${v("edge")}: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  ${v("fold")}: light-dark(#eef1f5, #35373d);
  ${v("line")}: light-dark(#e6e9ee, #44464d);
  ${v("mark")}: light-dark(${p.mark[0]}, ${p.mark[1]});
  ${v("mark-edge")}: light-dark(${p.markEdge[0]}, ${p.markEdge[1]});
  ${v("ink")}: light-dark(${p.ink[0]}, ${p.ink[1]});
  ${v("glow")}: light-dark(${p.glow[0]}, ${p.glow[1]});
  ${v("soft")}: 12px;
  ${v("beat")}: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-${ui}-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-${ui}-page { fill: var(${v("page")}); stroke: var(${v("edge")}); }
.ui-${ui}-fold { fill: var(${v("fold")}); }
.ui-${ui}-line { fill: var(${v("line")}); }
.ui-${ui}-ribbon { fill: var(${v("mark-edge")}); }
.ui-${ui}-badge { fill: var(${v("mark")}); stroke: var(${v("mark-edge")}); stroke-width: 4; stroke-linejoin: round; }
.ui-${ui}-ink { fill: none; stroke: var(${v("ink")}); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-${ui}-dot { fill: var(${v("ink")}); }
.ui-${ui}-glow { fill: var(${v("glow")}); filter: blur(var(${v("soft")})); animation: ui-${ui}-breathe var(${v("beat")}) var(--tc-ease-standard) 3; }
.ui-${ui}-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
@keyframes ui-${ui}-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
${o.css}

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="${ui}"][data-paused] :is(${moving}) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  ${moving} { animation: none; }
}
@media (forced-colors: active) {
  .ui-${ui}-art { forced-color-adjust: auto; }
}
`;
}

/**
 * The base of a document-status illustration: a tile with a badge and its words.
 */
export abstract class DocStage extends TcElement {
  static override looks = false;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "";
  /** Accessible description, when it should say more than `caption` */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);

  /** "page" – a document with its corner folded – or "book" */
  protected tile: "page" | "book" = "page";
  /** The drawing on the badge, in its ink */
  protected abstract motif(): SVGTemplateResult;
  /** Anything drawn beside the badge, outside it (sparks, specks) */
  protected beside(): SVGTemplateResult | typeof nothing {
    return nothing;
  }

  private get stage() {
    return `ui-${(this.constructor as typeof TcElement).ui}`;
  }

  protected override updated() {
    const name = this.label || this.caption;
    if (name) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", name);
      this.removeAttribute("aria-hidden");
    } else {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  private renderTile() {
    const c = this.stage;
    if (this.tile === "book")
      return svg`
        <path class=${`${c}-page`} d="M128 26h58a12 12 0 0 1 12 12v106a12 12 0 0 1-12 12h-58a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8Z" stroke-width="2"></path>
        <rect class=${`${c}-fold`} x="121" y="27" width="11" height="128" rx="5"></rect>
        <path class=${`${c}-ribbon`} d="M172 26h12v30l-6-5-6 5Z"></path>
        <rect class=${`${c}-line`} x="140" y="50" width="26" height="6" rx="3"></rect>
        <rect class=${`${c}-line`} x="140" y="64" width="38" height="6" rx="3"></rect>`;
    return svg`
      <path class=${`${c}-page`} d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class=${`${c}-fold`} d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class=${`${c}-line`} x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class=${`${c}-line`} x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class=${`${c}-line`} x="126" y="76" width="44" height="6" rx="3"></rect>`;
  }

  protected override render() {
    const c = this.stage;
    return html`<svg class=${`${c}-art`} viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class=${`${c}-glow`} cx="160" cy="168" rx="92" ry="14"></ellipse>
      ${this.renderTile()}
      <g class=${`${c}-mark`}>
        <circle class=${`${c}-badge`} cx="160" cy="126" r="30"></circle>
        ${this.motif()}
      </g>
      ${this.beside()}`}</svg>
      ${this.caption ? html`<p class=${`${c}-caption`}>${this.caption}</p>` : nothing}`;
  }
}
