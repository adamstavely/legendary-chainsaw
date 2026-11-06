import { html, nothing, svg, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-atomic-design> – atomic design, one stage at a time: the five stages from abstract to concrete, then atoms (a
 * label, an input, a button), a molecule (those three as a search form), an organism (a site header holding it), a
 * template (the page's layout in placeholders) and a page (the same layout with its content). The same parts carry from
 * stage to stage, so a talk or a guide can step through them. Each stage's parts rise in one after another, then rest.
 * Drawn like the other illustrations (all-done, accessibility-principles): soft tiles, one pastel mark (amber) with a
 * darker edge and ink, and a soft glow beneath – on a 320 × 240 viewBox in a 4 : 3 frame.
 *
 *   <tc-atomic-design stage="molecule"></tc-atomic-design>
 *
 * The words are drawn in, from `labels`, so the host is an image named by `label`, or else by a sentence for the stage.
 * `caption` adds words under the drawing. It holds still off screen or in a hidden tab (data-paused) and with reduced
 * motion. Colours follow the page theme through light-dark().
 */

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="atd"] {
  --tc-atomic-design-tile: light-dark(#ffffff, #2a2a2e);
  --tc-atomic-design-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-atomic-design-line: light-dark(#e6e9ee, #44464d);
  --tc-atomic-design-faint: light-dark(#c9ced6, #5f636c);
  --tc-atomic-design-mark: light-dark(#fbe7cf, #5a4426);
  --tc-atomic-design-mark-edge: light-dark(#e9b872, #c79a57);
  --tc-atomic-design-ink: light-dark(#8a5a17, #f3d6a6);
  --tc-atomic-design-sky: light-dark(#dce8fb, #263a5c);
  --tc-atomic-design-hill: light-dark(#a6dcdc, #3f7f80);
  --tc-atomic-design-hill-far: light-dark(#d9f2f2, #1d3c3d);
  --tc-atomic-design-glow: light-dark(rgba(250, 176, 130, 0.22), rgba(250, 176, 130, 0.1));
  --tc-atomic-design-soft: 12px;
  --tc-atomic-design-beat: 3s;
  display: block;
  width: 100%;
  font-family: var(--tc-font-sans);
}
.ui-atd-art { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; overflow: hidden; }
.ui-atd-tile { fill: var(--tc-atomic-design-tile); stroke: var(--tc-atomic-design-edge); stroke-width: 2; }
.ui-atd-field { fill: var(--tc-atomic-design-tile); stroke: var(--tc-atomic-design-faint); stroke-width: 1.5; }
.ui-atd-dash { fill: none; stroke: var(--tc-atomic-design-faint); stroke-width: 1.5; stroke-dasharray: 4 3; }
.ui-atd-rule { fill: none; stroke: var(--tc-atomic-design-edge); stroke-width: 2; }
.ui-atd-line { fill: var(--tc-atomic-design-line); }
.ui-atd-faint { fill: none; stroke: var(--tc-atomic-design-faint); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-atd-faint-fill { fill: var(--tc-atomic-design-faint); }
.ui-atd-mark { fill: var(--tc-atomic-design-mark); stroke: var(--tc-atomic-design-mark-edge); stroke-width: 2; }
.ui-atd-ring { fill: var(--tc-atomic-design-tile); stroke: var(--tc-atomic-design-mark-edge); stroke-width: 2.5; }
.ui-atd-bond { fill: none; stroke: var(--tc-atomic-design-mark-edge); stroke-width: 2; stroke-linecap: round; }
.ui-atd-ink { fill: none; stroke: var(--tc-atomic-design-ink); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-atd-ink-fill { fill: var(--tc-atomic-design-ink); }
.ui-atd-sky { fill: var(--tc-atomic-design-sky); }
.ui-atd-hill { fill: var(--tc-atomic-design-hill); }
.ui-atd-hill-far { fill: var(--tc-atomic-design-hill-far); }
.ui-atd-sun { fill: var(--tc-atomic-design-mark); stroke: var(--tc-atomic-design-mark-edge); stroke-width: 1.5; }
.ui-atd-text { fill: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); }
.ui-atd-quiet { fill: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-atd-hint { fill: var(--tc-text-muted); }
.ui-atd-on-mark { fill: var(--tc-atomic-design-ink); font-weight: var(--tc-font-weight-semibold); }
.ui-atd-tag { fill: var(--tc-atomic-design-tile); stroke: var(--tc-atomic-design-edge); stroke-width: 1.5; }
.ui-atd-in { animation: ui-atd-rise calc(var(--tc-atomic-design-beat) / 6) var(--tc-ease-move) calc(var(--tc-duration-fast) + var(--i, 0) * var(--tc-atomic-design-beat) / 12) 1 backwards; }
.ui-atd-glow { fill: var(--tc-atomic-design-glow); filter: blur(var(--tc-atomic-design-soft)); animation: ui-atd-breathe var(--tc-atomic-design-beat) var(--tc-ease-standard) 3; }
.ui-atd-caption { margin: var(--tc-space-8) 0 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
@keyframes ui-atd-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ui-atd-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the loops hold still */
[data-ui="atd"][data-paused] :is(.ui-atd-in, .ui-atd-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-atd-in, .ui-atd-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-atd-art { forced-color-adjust: auto; }
}
`;

export type AtomicDesignStage = "overview" | "atoms" | "molecule" | "organism" | "template" | "page";

export interface AtomicDesignLabels {
  atoms: string;
  molecules: string;
  organisms: string;
  templates: string;
  pages: string;
  abstract: string;
  concrete: string;
  /** Tags naming the parts: the atoms, then the molecules in the organism */
  label: string;
  input: string;
  button: string;
  logo: string;
  navigation: string;
  search: string;
  /** The content drawn into the parts */
  searchLabel: string;
  placeholder: string;
  searchButton: string;
  nav: string[];
  headline: string;
}

export const defaultAtomicDesignLabels: AtomicDesignLabels = {
  atoms: "Atoms",
  molecules: "Molecules",
  organisms: "Organisms",
  templates: "Templates",
  pages: "Pages",
  abstract: "Abstract",
  concrete: "Concrete",
  label: "Label",
  input: "Input",
  button: "Button",
  logo: "Logo",
  navigation: "Navigation",
  search: "Search",
  searchLabel: "Search the archive",
  placeholder: "Enter a keyword",
  searchButton: "Search",
  nav: ["Home", "About", "Research", "Contact"],
  headline: "Field notes",
};

const STAGES: AtomicDesignStage[] = ["overview", "atoms", "molecule", "organism", "template", "page"];

const text = (x: number, y: number, size: number, cls: string, words: string, anchor = "start") =>
  svg`<text class=${cls} x=${x} y=${y} font-size=${size} text-anchor=${anchor}>${words}</text>`;

/* Rises in as the stage appears: the i-th part, a beat after the one before */
const rise = (i: number, body: SVGTemplateResult) => svg`<g class="ui-atd-in" style=${`--i: ${i}`}>${body}</g>`;

/* A tag naming a part, with a dashed lead down to it */
const tag = (x: number, y: number, words: string, toY: number, toX = x) => {
  const w = words.length * 4.6 + 14;
  return svg`
    <path class="ui-atd-dash" d=${`M${x} ${y + 9}C${x} ${y + 9 + (toY - y) / 2} ${toX} ${y + 9 + (toY - y) / 2} ${toX} ${toY}`}></path>
    <rect class="ui-atd-tag" x=${x - w / 2} y=${y - 9} width=${w} height="18" rx="9"></rect>
    ${text(x, y + 3, 8.5, "ui-atd-quiet", words, "middle")}`;
};

/* The icons for the overview, each drawn round its tile's centre within about 18 units */
const atom = (r = 15, nucleus = 7.5, electron = true) => svg`
  <circle class="ui-atd-ring" r=${r}></circle>
  <circle class="ui-atd-mark" r=${nucleus}></circle>
  ${electron ? svg`<circle class="ui-atd-ink-fill" cx=${r * 0.707} cy=${-r * 0.707} r="3.5"></circle>` : nothing}`;
const MINI = (cx: number, cy: number, r: number) => svg`<g transform=${`translate(${cx} ${cy})`}>${atom(r, r * 0.5, false)}</g>`;
const ICONS = {
  atoms: () => atom(),
  molecules: () => svg`
    <path class="ui-atd-bond" d="M0-9-9 7 9 7Z"></path>
    ${MINI(0, -9, 7)}${MINI(-9, 7, 7)}${MINI(9, 7, 7)}`,
  organisms: () => {
    const at = [-12, 0, 12];
    return svg`
      <path class="ui-atd-bond" d="M-12-12H12M-12 0H12M-12 12H12M-12-12V12M0-12V12M12-12V12"></path>
      ${at.flatMap((y) => at.map((x) => MINI(x, y, 4.8)))}`;
  },
  templates: () => svg`
    <rect class="ui-atd-dash" x="-13" y="-17" width="26" height="34" rx="3"></rect>
    <rect class="ui-atd-faint-fill" x="-8" y="-11" width="16" height="6" rx="1.5"></rect>
    <path class="ui-atd-faint" d="M-8 0H8M-8 6H4M-8 12H6"></path>`,
  pages: () => svg`
    <rect class="ui-atd-tile" x="-9" y="-19" width="26" height="34" rx="3"></rect>
    <rect class="ui-atd-tile" x="-15" y="-15" width="26" height="34" rx="3"></rect>
    <rect class="ui-atd-mark" x="-10" y="-10" width="16" height="8" rx="1.5"></rect>
    <path class="ui-atd-ink" d="M-10 4H6M-10 9H2M-10 14H4"></path>`,
};

/* The institute's mark, for the logo: a small sun over a line */
const logoMark = (x: number, y: number, s: number) => svg`
  <g transform=${`translate(${x} ${y}) scale(${s})`}>
    <circle class="ui-atd-ink" cx="0" cy="-2" r="4"></circle>
    <path class="ui-atd-ink" d="M-8 5H8"></path>
  </g>`;

/* A soft landscape, for the page's pictures: sky, sun and two hills, clipped to a rounded frame */
const scene = (id: string, x: number, y: number, w: number, h: number, sun = 0.72) => svg`
  <clipPath id=${id}><rect x=${x} y=${y} width=${w} height=${h} rx="6"></rect></clipPath>
  <g clip-path=${`url(#${id})`}>
    <rect class="ui-atd-sky" x=${x} y=${y} width=${w} height=${h}></rect>
    <circle class="ui-atd-sun" cx=${x + w * sun} cy=${y + h * 0.32} r=${Math.min(w, h) * 0.13}></circle>
    <path class="ui-atd-hill-far" d=${`M${x} ${y + h * 0.7}Q${x + w * 0.3} ${y + h * 0.38} ${x + w * 0.6} ${y + h * 0.66}T${x + w} ${y + h * 0.55}V${y + h}H${x}Z`}></path>
    <path class="ui-atd-hill" d=${`M${x} ${y + h * 0.86}Q${x + w * 0.45} ${y + h * 0.56} ${x + w} ${y + h * 0.84}V${y + h}H${x}Z`}></path>
  </g>`;

/* A placeholder for a picture: a dashed frame with a faint landscape glyph */
const placeholder = (x: number, y: number, w: number, h: number) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return svg`
    <rect class="ui-atd-dash" x=${x} y=${y} width=${w} height=${h} rx="6"></rect>
    <circle class="ui-atd-faint" cx=${cx + 4} cy=${cy - 4} r="2.5"></circle>
    <path class="ui-atd-faint" d=${`M${cx - 9} ${cy + 6}l6-7 4 4 3-3 5 6`}></path>`;
};

let clips = 0;

/**
 * Atomic design, one stage at a time – from the five stages in a row to atoms, a molecule, an organism, a template and a page.
 * @tag tc-atomic-design
 */
export class TcAtomicDesign extends TcElement {
  static override ui = "atd";
  static override looks = false;
  static override css = css;

  /** Which stage to draw: "overview" (the five stages in a row), "atoms", "molecule", "organism", "template" or "page" */
  @property({ reflect: true }) accessor stage: AtomicDesignStage = "overview";
  /** On the overview, the line from abstract to concrete above the stages */
  @property({ type: Boolean }) accessor scale = true;
  /** The words drawn in: stage names, tags and the content drawn into the parts */
  @property({ attribute: false }) accessor labels: AtomicDesignLabels = defaultAtomicDesignLabels;
  /** Words under the drawing; "" (the default) leaves them out */
  @property() accessor caption = "";
  /** Accessible description; by default a sentence for the stage */
  @property() accessor label = "";
  /** Leave the drawing out of the accessibility tree, for when the text beside it says the same */
  @property({ type: Boolean }) accessor decorative = false;

  /** @internal */
  private readonly screen = new OnScreenController(this);
  /** @internal */
  private readonly uid = `ui-atd-${++clips}`;

  /** The sentence the host is named by when `label` is empty */
  describe(): string {
    const l = this.words();
    switch (this.stageOrDefault()) {
      case "atoms":
        return `${l.atoms}: a ${l.label.toLowerCase()}, an ${l.input.toLowerCase()} and a ${l.button.toLowerCase()}.`;
      case "molecule":
        return `A molecule: the ${l.label.toLowerCase()}, ${l.input.toLowerCase()} and ${l.button.toLowerCase()} joined into a search form.`;
      case "organism":
        return `An organism: a site header with a ${l.logo.toLowerCase()}, ${l.navigation.toLowerCase()} and the search form.`;
      case "template":
        return "A template: the page's layout, with placeholders where its content will go.";
      case "page":
        return "A page: the template filled with real content.";
      default:
        return `Atomic design: ${[l.atoms, l.molecules, l.organisms, l.templates, l.pages].map((s) => s.toLowerCase()).join(", ")}${this.scale ? `, from ${l.abstract.toLowerCase()} to ${l.concrete.toLowerCase()}` : ""}.`;
    }
  }

  private words(): AtomicDesignLabels {
    return { ...defaultAtomicDesignLabels, ...this.labels };
  }

  private stageOrDefault(): AtomicDesignStage {
    return STAGES.includes(this.stage) ? this.stage : "overview";
  }

  protected override updated() {
    if (this.decorative) {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    } else {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label || this.describe());
      this.removeAttribute("aria-hidden");
    }
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  private overview(l: AtomicDesignLabels) {
    const names = [l.atoms, l.molecules, l.organisms, l.templates, l.pages];
    const icons = [ICONS.atoms, ICONS.molecules, ICONS.organisms, ICONS.templates, ICONS.pages];
    const xs = [40, 100, 160, 220, 280];
    return svg`
      <ellipse class="ui-atd-glow" cx="160" cy="166" rx="140" ry="12"></ellipse>
      ${this.scale
        ? rise(0, svg`
          ${text(20, 74, 10, "ui-atd-quiet", l.abstract)}
          ${text(300, 74, 10, "ui-atd-quiet", l.concrete, "end")}
          <path class="ui-atd-faint" d=${`M${28 + l.abstract.length * 5.4} 70.5H${292 - l.concrete.length * 5.4}m-5-4 5 4-5 4`}></path>`)
        : nothing}
      ${xs.slice(0, 4).map((x) => svg`<path class="ui-atd-faint" d=${`M${x + 28.5} 134l3 4-3 4`}></path>`)}
      ${xs.map((x, i) =>
        rise(i + 1, svg`
          <g transform=${`translate(${x} 138)`}>
            <rect class="ui-atd-tile" x="-23" y="-23" width="46" height="46" rx="12"></rect>
            <g transform="scale(0.94)">${icons[i]()}</g>
          </g>
          ${text(x, 184, 9.5, "ui-atd-text", names[i], "middle")}`),
      )}`;
  }

  private atoms(l: AtomicDesignLabels) {
    return svg`
      <ellipse class="ui-atd-glow" cx="160" cy="210" rx="120" ry="10"></ellipse>
      <rect class="ui-atd-tile" x="20" y="28" width="280" height="186" rx="16"></rect>
      <path class="ui-atd-rule" d="M20 90H300M20 152H300"></path>
      ${rise(0, svg`
        ${text(40, 64, 13, "ui-atd-text", l.searchLabel)}
        ${this.tagPill(252, 59, l.label)}`)}
      ${rise(1, svg`
        <rect class="ui-atd-field" x="40" y="107" width="150" height="28" rx="8"></rect>
        ${text(52, 124.5, 10, "ui-atd-hint", l.placeholder)}
        ${this.tagPill(252, 121, l.input)}`)}
      ${rise(2, svg`
        <rect class="ui-atd-mark" x="40" y="169" width="76" height="28" rx="8"></rect>
        ${text(78, 186.5, 10.5, "ui-atd-on-mark", l.searchButton, "middle")}
        ${this.tagPill(252, 183, l.button)}`)}`;
  }

  private tagPill(x: number, y: number, words: string) {
    const w = words.length * 5 + 20;
    return svg`<rect class="ui-atd-tag" x=${x - w / 2} y=${y - 10} width=${w} height="20" rx="10"></rect>
      ${text(x, y + 3.5, 9, "ui-atd-quiet", words, "middle")}`;
  }

  private molecule(l: AtomicDesignLabels) {
    return svg`
      <ellipse class="ui-atd-glow" cx="160" cy="176" rx="120" ry="12"></ellipse>
      ${rise(3, svg`<rect class="ui-atd-tile" x="40" y="86" width="240" height="86" rx="16"></rect>`)}
      ${rise(0, svg`${tag(84, 44, l.label, 98)}${text(60, 108, 11, "ui-atd-text", l.searchLabel)}`)}
      ${rise(1, svg`${tag(150, 44, l.input, 120, 125)}
        <rect class="ui-atd-field" x="60" y="120" width="132" height="32" rx="8"></rect>
        ${text(72, 139.5, 10, "ui-atd-hint", l.placeholder)}`)}
      ${rise(2, svg`${tag(229, 44, l.button, 120)}
        <rect class="ui-atd-mark" x="200" y="120" width="60" height="32" rx="8"></rect>
        ${text(230, 139.5, 10.5, "ui-atd-on-mark", l.searchButton, "middle")}`)}`;
  }

  /* The header: logo, links and the search form, scaled to fit where it sits */
  private header(l: AtomicDesignLabels, filled: boolean) {
    /* The links share the room between the logo and the search form, each in proportion to its length */
    const links = l.nav.slice(0, 4);
    const room = links.reduce((sum, n) => sum + n.length + 3, 0);
    let at = 72;
    const xs = links.map((n) => {
      const w = ((n.length + 3) / room) * 158;
      at += w;
      return at - w / 2;
    });
    return svg`
      <rect class=${filled ? "ui-atd-mark" : "ui-atd-dash"} x="22" y="106" width="42" height="28" rx="7"></rect>
      ${filled ? logoMark(43, 120, 1) : svg`<path class="ui-atd-faint" d="M29 112 57 128M57 112 29 128"></path>`}
      ${links.map((n, i) => text(xs[i], 124, 9, "ui-atd-text", n, "middle"))}
      <rect class="ui-atd-field" x="236" y="109" width="40" height="22" rx="6"></rect>
      ${text(241, 123, 7, "ui-atd-hint", l.placeholder.split(" ").pop() ?? "")}
      <rect class="ui-atd-mark" x="279" y="109" width="25" height="22" rx="6"></rect>
      <circle class="ui-atd-ink" cx="290" cy="118.5" r="3.6" stroke-width="2"></circle>
      <path class="ui-atd-ink" d="M292.8 121.3 296 124.5" stroke-width="2"></path>`;
  }

  private organism(l: AtomicDesignLabels) {
    return svg`
      <ellipse class="ui-atd-glow" cx="160" cy="156" rx="140" ry="12"></ellipse>
      ${rise(3, svg`
        <rect class="ui-atd-tile" x="10" y="94" width="300" height="52" rx="14"></rect>
        <rect class="ui-atd-line" x="22" y="164" width="276" height="5" rx="2.5"></rect>
        <rect class="ui-atd-line" x="22" y="176" width="200" height="5" rx="2.5"></rect>`)}
      ${rise(0, tag(43, 56, l.logo, 106))}
      ${rise(1, tag(150, 56, l.navigation, 112))}
      ${rise(2, tag(267, 56, l.search, 109))}
      ${rise(4, this.header(l, true))}`;
  }

  /* The page's layout, as placeholders or filled with content */
  private layout(l: AtomicDesignLabels, filled: boolean) {
    const id = this.uid;
    const lines = (x: number, y: number, w: number, n: number) =>
      Array.from({ length: n }, (_, i) => svg`<rect class="ui-atd-line" x=${x} y=${y + i * 9} width=${i === n - 1 ? w * 0.7 : w} height="4" rx="2"></rect>`);
    return svg`
      <ellipse class="ui-atd-glow" cx="160" cy="222" rx="120" ry="10"></ellipse>
      <rect class="ui-atd-tile" x="34" y="14" width="252" height="214" rx="14"></rect>
      ${rise(0, svg`
        <g transform="translate(28.2 -60.5) scale(0.8085)">${this.header(l, filled)}</g>
        <path class="ui-atd-rule" d="M34 60H286"></path>`)}
      ${rise(1, filled
        ? svg`${scene(`${id}-hero`, 46, 70, 228, 66, 0.22)}
            ${text(186, 110, 11, "ui-atd-text", l.headline)}
            <rect class="ui-atd-ink-fill" x="186" y="116" width="58" height="3" rx="1.5"></rect>`
        : svg`${placeholder(46, 70, 228, 66)}
            <rect class="ui-atd-faint-fill" x="186" y="102" width="62" height="7" rx="2"></rect>
            <rect class="ui-atd-line" x="186" y="114" width="50" height="3" rx="1.5"></rect>`)}
      ${rise(2, svg`
        ${lines(46, 146, 98, 4)}
        ${filled ? scene(`${id}-side`, 152, 144, 40, 34, 0.3) : placeholder(152, 144, 40, 34)}
        ${lines(200, 148, 74, 3)}`)}
      ${rise(3, svg`
        ${filled
          ? svg`${scene(`${id}-video`, 46, 186, 98, 32, 0.2)}
              <circle class="ui-atd-mark" cx="95" cy="202" r="9"></circle>
              <path class="ui-atd-ink-fill" d="M92 197.5v9l7.5-4.5Z"></path>`
          : svg`<rect class="ui-atd-dash" x="46" y="186" width="98" height="32" rx="6"></rect>
              <path class="ui-atd-faint-fill" d="M92 197v10l8-5Z"></path>`}
        ${[152, 193, 234].map((x, i) =>
          filled ? scene(`${id}-thumb-${i}`, x, 186, 40, 32, [0.25, 0.5, 0.78][i]) : placeholder(x, 186, 40, 32),
        )}`)}`;
  }

  protected override render() {
    const l = this.words();
    const stage = this.stageOrDefault();
    const body =
      stage === "atoms" ? this.atoms(l)
      : stage === "molecule" ? this.molecule(l)
      : stage === "organism" ? this.organism(l)
      : stage === "template" ? this.layout(l, false)
      : stage === "page" ? this.layout(l, true)
      : this.overview(l);
    return html`<svg class="ui-atd-art" viewBox="0 0 320 240" aria-hidden="true" data-stage=${stage}>${body}</svg>
      ${this.caption ? html`<p class="ui-atd-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-atomic-design")) customElements.define("tc-atomic-design", TcAtomicDesign);

declare global {
  interface HTMLElementTagNameMap {
    "tc-atomic-design": TcAtomicDesign;
  }
}
