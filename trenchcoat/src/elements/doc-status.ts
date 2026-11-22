import { svg, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { docStageCss, DocStage, type DocStagePalette } from "./internal/doc-stage";

/*
 * <tc-doc-status> – where a document stands, as one illustration: a soft page (or book) tile, one pastel badge with a
 * darker edge and ink, a soft glow beneath, and the words as real text under it. `status` picks the badge's drawing,
 * its colours, its short motion and the words:
 *   · workflow: draft, awaiting-review, in-translation, in-quality-control, in-coordination, pending-release, scheduled,
 *     released, added-to-readbook (a book with a bookmark)
 *   · work: queued, processing, in-progress, success, failed, uploading, downloading, working-offline (a cloud with a
 *     line through it), locked, sync-conflict
 *   · files: malware-scan, malware-blocked (a warning shield in front of the file, not a badge), preview-unavailable
 *     (the contents faded to a dashed outline, with a question mark), converting (its text read by a scan bracket)
 *   · access and signing: restricted, redacted (bars over the page's text), password-protected (a password field
 *     over it), encrypted, shared, awaiting-signature, signed, comment-needed
 *   · keeping: archived, in-trash, expired, duplicate, update-available
 *   · metadata: metadata-cleansing-required, -in-progress, -failed, -success (a tag, with the state on its corner)
 * The words follow the status unless `caption` sets its own ("" leaves them out). Drawn on a 320 × 240 viewBox inside
 * a 3 : 2 frame; the shared drawing is internal/doc-stage.ts.
 *
 *   <tc-doc-status status="in-quality-control"></tc-doc-status>
 *
 * It replaces the separate document illustrations (tc-released, tc-processing, tc-uploading, tc-malware-blocked and
 * the rest), which are gone: use this element with their status instead.
 *
 * It says where something stands, so the host is an image named by `label`, or else by its words. Set caption="" and
 * leave `label` empty when the words beside it already say so: it's then decorative. The motion is finite, holds still
 * off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the page theme
 * through light-dark().
 */

export type DocStatus =
  | "released"
  | "pending-release"
  | "awaiting-review"
  | "in-translation"
  | "in-quality-control"
  | "in-coordination"
  | "processing"
  | "in-progress"
  | "success"
  | "failed"
  | "uploading"
  | "downloading"
  | "malware-scan"
  | "malware-blocked"
  | "metadata-cleansing-required"
  | "metadata-cleansing-in-progress"
  | "metadata-cleansing-failed"
  | "metadata-cleansing-success"
  | "added-to-readbook"
  | "working-offline"
  | "preview-unavailable"
  | "draft"
  | "archived"
  | "in-trash"
  | "locked"
  | "sync-conflict"
  | "expired"
  | "awaiting-signature"
  | "signed"
  | "redacted"
  | "restricted"
  | "duplicate"
  | "scheduled"
  | "queued"
  | "shared"
  | "encrypted"
  | "password-protected"
  | "update-available"
  | "converting"
  | "comment-needed";

/** What a status draws, given the class prefix (`ui-dst`) and the custom-property namer */
type Draw = (c: string, v: (k: string) => string) => SVGTemplateResult;
/** A status's own rules: `c` the class prefix, `v` the custom-property namer, `kf` the keyframe prefix, `sc` the selector that scopes them to their status */
type Rules = (c: string, v: (k: string) => string, kf: string, sc: string) => string;

type Entry = {
  words: string;
  palette: DocStagePalette;
  tile?: "page" | "book";
  motif?: Draw;
  beside?: Draw;
  /** Drawn on the tile, over its lines (Redacted's bars) */
  overTile?: Draw;
  /** A scene in place of the badge (Malware Blocked) */
  scene?: Draw;
  lines?: number;
  glowY?: number;
  beat?: string;
  /** Classes that animate, for pausing and reduced motion */
  motion: string[];
  css: Rules;
};

const P = (mark: [string, string], markEdge: [string, string], ink: [string, string], glow: [string, string]): DocStagePalette => ({ mark, markEdge, ink, glow });
const GREEN = P(["#dcf3e2", "#1f4a2c"], ["#86cf9c", "#64bf80"], ["#22743b", "#c9f0d4"], ["rgba(90, 190, 120, 0.24)", "rgba(90, 190, 120, 0.12)"]);
const RED = P(["#fde2df", "#5a2724"], ["#f0a197", "#c96a60"], ["#a8231a", "#fbd2cd"], ["rgba(240, 112, 102, 0.2)", "rgba(240, 112, 102, 0.1)"]);
const BLUE = P(["#e0ecfd", "#1f3456"], ["#93b8f0", "#5f88c9"], ["#1f4f99", "#d3e3fb"], ["rgba(100, 150, 230, 0.24)", "rgba(100, 150, 230, 0.12)"]);
const AMBER = P(["#fdf0d5", "#4a3a14"], ["#ecc06a", "#c9a24a"], ["#7f5300", "#f7e2b5"], ["rgba(230, 170, 70, 0.24)", "rgba(230, 170, 70, 0.12)"]);
const SLATE = P(["#e8ebf0", "#2c3038"], ["#b4bcc8", "#6b7380"], ["#4a5361", "#d5dbe4"], ["rgba(120, 135, 155, 0.22)", "rgba(120, 135, 155, 0.1)"]);
const PURPLE = P(["#ece4fb", "#3b2d5a"], ["#b9a1ea", "#9a83d6"], ["#5b3aa6", "#ddd0fb"], ["rgba(170, 140, 230, 0.24)", "rgba(170, 140, 230, 0.12)"]);
const TEAL = P(["#d9f2f2", "#1d3c3d"], ["#a6dcdc", "#3f7f80"], ["#1d6b6b", "#c4ecec"], ["rgba(110, 200, 200, 0.26)", "rgba(110, 200, 200, 0.12)"]);

/* Shared pieces of the drawings and their motion */
const CHECK_PATH = "M146 127l9 9 19-19";
const drawKf = (kf: string, n = 40) => `@keyframes ${kf}-draw { from { stroke-dashoffset: ${n}; } to { stroke-dashoffset: 0; } }`;
const twinkleKf = (kf: string, low = "0.25") => `@keyframes ${kf}-twinkle { 0%, 100% { opacity: 1; } 50% { opacity: ${low}; } }`;
const shakeKf = (kf: string) => `@keyframes ${kf}-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-2px); } }`;
const pulseKf = (kf: string) => `@keyframes ${kf}-pulse { 0%, 100% { opacity: 0.35; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.15); } }`;
/** The tray on Uploading's and Downloading's badge */
const TRAY = "M143 132v5a6 6 0 0 0 6 6h22a6 6 0 0 0 6-6v-5";
/** Something that happens once: a small settle into place (from a nudge `from`) */
const settleOnce = (c: string, cls: string, v: (k: string) => string, kf: string, sc: string, from: string) => `
${sc}.${c}-${cls} { transform-box: fill-box; transform-origin: center; animation: ${kf}-${cls} calc(var(${v("beat")}) * 0.35) var(--tc-ease-move) calc(var(${v("beat")}) / 16) 1 backwards; }
@keyframes ${kf}-${cls} { from { transform: ${from}; } to { transform: none; } }`;
/** A padlock on the badge */
const padlock = (c: string) => svg`<path class=${`${c}-ink ${c}-shackle`} d="M152 121v-6a8 8 0 0 1 16 0v6"></path><path class=${`${c}-ink`} d="M147 121h26v16a3 3 0 0 1-3 3h-20a3 3 0 0 1-3-3Z"></path><circle class=${`${c}-dot`} cx="160" cy="130" r="2.5"></circle>`;
/** A pen nib, centred on x */
const nib = (c: string, x: number) => svg`<path class=${`${c}-ink`} d=${`M${x} 108l9 12-9 18-9-18Z`}></path><path class=${`${c}-ink`} d=${`M${x} 121v9`}></path>`;
/** A second page behind the first, the front one filled with the badge colour */
const twoPages = (c: string) => svg`<path class=${`${c}-ink`} d="M145 110h17v23h-17Z"></path><path class=${`${c}-sheet ${c}-front`} d="M153 117h17v23h-17Z"></path>`;
const sheetCss: Rules = (c, v, _kf, sc) => `${sc}.${c}-sheet { fill: var(${v("mark")}); stroke: var(${v("ink")}); stroke-width: 3.5; stroke-linejoin: round; }`;

/** Metadata's tag, nudged left so the corner mark has room */
const tag: Draw = (c) => svg`<path class=${`${c}-ink`} d="M142 117a3 3 0 0 1 3-3h16l11 12-11 12h-16a3 3 0 0 1-3-3Z"></path><circle class=${`${c}-dot`} cx="150" cy="126" r="2.5"></circle>`;
const chip = (c: string) => svg`<circle class=${`${c}-chip`} cx="184" cy="148" r="15"></circle>`;
const chipCss: Rules = (c, v, _kf, sc) => `
${sc}.${c}-chip { fill: var(${v("page")}); stroke: var(${v("mark-edge")}); stroke-width: 3; }
${sc}.${c}-chip-ink { fill: none; stroke: var(${v("ink")}); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }`;
const pulseDots = (c: string, v: (k: string) => string, xs: number[], y: number, r: number) =>
  xs.map((x, i) => svg`<circle class=${`${c}-dot ${c}-pulse`} cx=${x} cy=${y} r=${r} style=${i ? `animation-delay: calc(var(${v("beat")}) / ${i === 1 ? 8 : 4})` : ""}></circle>`);

/** Every status: its words, colours, drawing and motion */
export const DOC_STATUSES: Record<DocStatus, Entry> = {
  released: {
    words: "Released",
    palette: GREEN,
    motif: (c) => svg`<path class=${`${c}-ink ${c}-motif`} d=${CHECK_PATH}></path>`,
    beside: (c) => svg`<path class=${`${c}-ink ${c}-spark`} d="M196 92l5-5M204 106h7M190 84v-7"></path>`,
    motion: ["spark", "motif"],
    css: (c, v, kf, sc) => `
${sc}.${c}-motif { stroke-dasharray: 40; animation: ${kf}-draw calc(var(${v("beat")}) * 0.3) var(--tc-ease-move) calc(var(${v("beat")}) / 16) backwards; }
${sc}.${c}-spark { animation: ${kf}-twinkle calc(var(${v("beat")}) / 2) var(--tc-ease-standard) calc(var(${v("beat")}) * 0.3) 2 both; }
${drawKf(kf)}
${twinkleKf(kf)}`,
  },
  "pending-release": {
    words: "Pending release",
    palette: P(["#fbe3ee", "#4f2238"], ["#e7a1c2", "#d983ab"], ["#9c2f63", "#f9d3e4"], ["rgba(225, 130, 175, 0.24)", "rgba(225, 130, 175, 0.12)"]),
    motif: (c) => svg`<path class=${`${c}-ink ${c}-dash`} d="M146 146h28"></path><path class=${`${c}-ink ${c}-motif`} d="M160 138v-30M148 120l12-12 12 12"></path>`,
    motion: ["motif"],
    css: (c, v, kf, sc) => `
${sc}.${c}-dash { stroke-dasharray: 2 6; }
${sc}.${c}-motif { animation: ${kf}-lift var(${v("beat")}) var(--tc-ease-move) 3; }
@keyframes ${kf}-lift { 0%, 50%, 100% { transform: translateY(0); } 25% { transform: translateY(-5px); } }`,
  },
  "awaiting-review": {
    words: "Awaiting review",
    palette: P(["#ece4fb", "#3b2d5a"], ["#b9a1ea", "#9a83d6"], ["#5b3aa6", "#ddd0fb"], ["rgba(170, 140, 230, 0.24)", "rgba(170, 140, 230, 0.12)"]),
    motif: (c) => svg`<g class=${`${c}-glass`}>
        <path class=${`${c}-ink`} d="M148 110h24M148 142h24M152 110c0 10 8 12 8 16s-8 6-8 16M168 110c0 10-8 12-8 16s8 6 8 16"></path>
        <path class=${`${c}-sand`} d="M155 139c0-4 5-6 5-8 0 2 5 4 5 8Z"></path>
      </g>`,
    motion: ["glass"],
    css: (c, v, kf, sc) => `
${sc}.${c}-sand { fill: var(${v("ink")}); }
${sc}.${c}-glass { transform-box: fill-box; transform-origin: center; animation: ${kf}-turn var(${v("beat")}) var(--tc-ease-move) 3; }
@keyframes ${kf}-turn { 0%, 60% { transform: rotate(0deg); } 85%, 100% { transform: rotate(180deg); } }`,
  },
  "in-translation": {
    words: "In translation",
    palette: P(["#d9f3ef", "#1e4842"], ["#7fcfc2", "#5fbfb1"], ["#1f7a6d", "#c8f1ea"], ["rgba(80, 190, 170, 0.24)", "rgba(80, 190, 170, 0.12)"]),
    motif: (c) => svg`<g class=${`${c}-motif`}>
        <path class=${`${c}-bubble`} d="M140 104h22a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5h-12l-7 6v-6h-3a5 5 0 0 1-5-5v-13a5 5 0 0 1 5-5Z"></path>
        <path class=${`${c}-ink`} d="M145 122l6-13 6 13M147.5 117h7"></path>
      </g>
      <g class=${`${c}-motif ${c}-second`}>
        <path class=${`${c}-bubble`} d="M159 121h22a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5h-3v6l-7-6h-12a5 5 0 0 1-5-5v-13a5 5 0 0 1 5-5Z"></path>
        <path class=${`${c}-ink`} d="M165 128h10M170 128v3M166 133c3 4 7 5 10 5M175 133c-2 3-5 5-8 6"></path>
      </g>`,
    motion: ["motif"],
    css: (c, v, kf, sc) => `
${sc}.${c}-bubble { fill: var(${v("page")}); stroke: var(${v("ink")}); stroke-width: 3.5; stroke-linejoin: round; }
${sc}.${c}-motif { transform-box: fill-box; transform-origin: center bottom; animation: ${kf}-nod var(${v("beat")}) var(--tc-ease-move) 3; }
${sc}.${c}-second { animation-delay: calc(var(${v("beat")}) / 2); }
@keyframes ${kf}-nod { 0%, 30%, 100% { transform: translateY(0); } 15% { transform: translateY(-4px); } }`,
  },
  "in-quality-control": {
    words: "In quality control",
    palette: P(["#dce8fb", "#263a5c"], ["#8fb0e8", "#6f93d1"], ["#2f5ea8", "#cfdffb"], ["rgba(120, 160, 230, 0.24)", "rgba(120, 160, 230, 0.12)"]),
    motif: (c) => svg`<g class=${`${c}-motif`}>
        <circle class=${`${c}-lens`} cx="156" cy="121" r="12"></circle>
        <path class=${`${c}-ink`} d="M150 121l4 4 8-8M165 130l10 10"></path>
      </g>`,
    motion: ["motif"],
    css: (c, v, kf, sc) => `
${sc}.${c}-lens { fill: var(${v("page")}); stroke: var(${v("ink")}); stroke-width: 4; }
${sc}.${c}-motif { animation: ${kf}-sweep var(${v("beat")}) var(--tc-ease-move) 3; }
@keyframes ${kf}-sweep { 0%, 100% { transform: translateX(0); } 30% { transform: translateX(-5px); } 65% { transform: translateX(5px); } }`,
  },
  "in-coordination": {
    words: "In coordination",
    palette: P(["#fbecd6", "#4a3518"], ["#e8b878", "#d9a35c"], ["#94560f", "#f8e1bf"], ["rgba(230, 170, 90, 0.24)", "rgba(230, 170, 90, 0.12)"]),
    motif: (c) => svg`<path class=${`${c}-ink`} d="M160 110L145 138H175Z"></path>
      <circle class=${`${c}-node`} cx="160" cy="110" r="7"></circle>
      <circle class=${`${c}-node`} cx="145" cy="138" r="7"></circle>
      <circle class=${`${c}-node`} cx="175" cy="138" r="7"></circle>`,
    motion: ["node"],
    css: (c, v, kf, sc) => `
${sc}.${c}-node { fill: var(${v("page")}); stroke: var(${v("ink")}); stroke-width: 4; transform-box: fill-box; transform-origin: center; animation: ${kf}-ping var(${v("beat")}) var(--tc-ease-standard) 3; }
${sc}.${c}-node:nth-of-type(3) { animation-delay: calc(var(${v("beat")}) / 6); }
${sc}.${c}-node:nth-of-type(4) { animation-delay: calc(var(${v("beat")}) / 3); }
@keyframes ${kf}-ping { 0%, 40%, 100% { transform: scale(1); fill: var(${v("page")}); } 20% { transform: scale(1.25); fill: var(${v("ink")}); } }`,
  },
  processing: {
    words: "Processing",
    palette: TEAL,
    motif: (c) => svg`<circle class=${`${c}-track`} cx="160" cy="126" r="15"></circle>
      <path class=${`${c}-ring ${c}-ink`} d="M160 111a15 15 0 1 1-15 15"></path>`,
    motion: ["ring"],
    css: (c, v, kf, sc) => `
${sc}.${c}-track { fill: none; stroke: var(${v("mark-edge")}); stroke-width: 5; }
${sc}.${c}-ink { stroke-width: 5; stroke-linejoin: miter; }
${sc}.${c}-ring { transform-origin: 160px 126px; animation: ${kf}-turn var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ${kf}-turn { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`,
  },
  "in-progress": {
    words: "In progress",
    palette: BLUE,
    motif: (c, v) => svg`${pulseDots(c, v, [147, 160, 173], 126, 4)}`,
    motion: ["pulse"],
    css: (c, v, kf, sc) => `
${sc}.${c}-pulse { transform-box: fill-box; transform-origin: center; animation: ${kf}-pulse calc(var(${v("beat")}) / 2) var(--tc-ease-standard) 4 both; }
${pulseKf(kf)}`,
  },
  success: {
    words: "Success",
    palette: GREEN,
    motif: (c) => svg`<path class=${`${c}-ink ${c}-tick`} d=${CHECK_PATH}></path>`,
    beside: (c) => svg`<circle class=${`${c}-pop`} cx="160" cy="126" r="30"></circle>`,
    motion: ["tick", "pop"],
    css: (c, v, kf, sc) => `
${sc}.${c}-tick { stroke-dasharray: 40; animation: ${kf}-draw calc(var(${v("beat")}) * 0.3) var(--tc-ease-move) calc(var(${v("beat")}) / 16) backwards; }
${sc}.${c}-pop { fill: none; stroke: var(${v("mark-edge")}); stroke-width: 3; opacity: 0; transform-box: fill-box; transform-origin: center; animation: ${kf}-pop calc(var(${v("beat")}) * 0.4) var(--tc-ease-move) calc(var(${v("beat")}) * 0.25) 1 backwards; }
${drawKf(kf)}
@keyframes ${kf}-pop { from { opacity: 0.9; transform: scale(1); } to { opacity: 0; transform: scale(1.45); } }`,
  },
  failed: {
    words: "Failed",
    palette: RED,
    motif: (c) => svg`<path class=${`${c}-ink ${c}-cross`} d="M149 115l22 22M171 115l-22 22"></path>`,
    motion: ["cross", "mark"],
    css: (c, v, kf, sc) => `
${sc}.${c}-cross { stroke-dasharray: 32; animation: ${kf}-draw calc(var(${v("beat")}) * 0.25) var(--tc-ease-move) calc(var(${v("beat")}) / 16) backwards; }
${sc}.${c}-mark { transform-box: fill-box; transform-origin: center; animation: ${kf}-shake calc(var(${v("beat")}) * 0.2) var(--tc-ease-standard) calc(var(${v("beat")}) * 0.3) 1; }
${drawKf(kf, 32)}
${shakeKf(kf)}`,
  },
  uploading: {
    words: "Uploading",
    palette: P(["#eaf3d2", "#34421a"], ["#b2cd6a", "#9fbf52"], ["#4e6a10", "#e3f1c4"], ["rgba(160, 200, 80, 0.24)", "rgba(160, 200, 80, 0.12)"]),
    motif: (c) => svg`<path class=${`${c}-ink`} d=${TRAY}></path>
      <path class=${`${c}-ink ${c}-arrow`} d="M160 130v-24M149 117l11-11 11 11"></path>`,
    motion: ["arrow"],
    css: (c, v, kf, sc) => `
${sc}.${c}-arrow { transform-box: view-box; animation: ${kf}-rise var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ${kf}-rise { 0%, 100% { transform: translateY(0); } 15% { transform: translateY(6px); } 45% { transform: translateY(-4px); } 65% { transform: translateY(0); } }`,
  },
  downloading: {
    words: "Downloading",
    palette: P(["#d6eef8", "#1c3f52"], ["#7cc1e0", "#5aaed4"], ["#1b6a8c", "#cdeaf7"], ["rgba(90, 170, 215, 0.24)", "rgba(90, 170, 215, 0.12)"]),
    motif: (c) => svg`<path class=${`${c}-ink`} d=${TRAY}></path>
      <path class=${`${c}-ink ${c}-arrow`} d="M160 106v24M149 119l11 11 11-11"></path>`,
    motion: ["arrow"],
    css: (c, v, kf, sc) => `
${sc}.${c}-arrow { transform-box: view-box; animation: ${kf}-drop var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ${kf}-drop { 0%, 100% { transform: translateY(0); } 15% { transform: translateY(-6px); } 45% { transform: translateY(3px); } 65% { transform: translateY(0); } }`,
  },
  "malware-scan": {
    words: "Scanning for malware",
    palette: TEAL,
    motif: (c) => svg`<path class=${`${c}-ink`} d="M160 110l12 4v9c0 8-5 14-12 17-7-3-12-9-12-17v-9Z"></path>`,
    beside: (c) => svg`<rect class=${`${c}-scan`} x="116" y="34" width="88" height="3" rx="1.5"></rect>`,
    motion: ["scan"],
    css: (c, v, kf, sc) => `
${sc}.${c}-scan { fill: var(${v("mark-edge")}); opacity: 0; animation: ${kf}-scan calc(var(${v("beat")}) * 0.6) var(--tc-ease-standard) 3; }
@keyframes ${kf}-scan { 0% { opacity: 0; transform: translateY(0); } 15% { opacity: 0.9; } 85% { opacity: 0.9; } 100% { opacity: 0; transform: translateY(110px); } }`,
  },
  "malware-blocked": {
    words: "Potential malware",
    palette: RED,
    lines: 2,
    glowY: 166,
    beat: "3s",
    scene: (c) => svg`<g class=${`${c}-shield`}>
        <path class=${`${c}-shield-body`} d="M160 80l32 11v26c0 22-16 34-32 42-16-8-32-20-32-42V91Z"></path>
        <g class=${`${c}-bug`}>
          <path d="M152 115a8 8 0 0 1 16 0v9a8 8 0 0 1-16 0Z"></path>
          <path d="M155 107a5 5 0 0 1 10 0"></path>
          <path d="M160 109v22M152 117h-6M168 117h6M152 126l-5 3M168 126l5 3M156 104l-3-4M164 104l3-4"></path>
        </g>
      </g>`,
    motion: ["shield"],
    css: (c, v, kf, sc) => `
${sc}.${c}-shield-body { fill: var(${v("mark")}); stroke: var(${v("mark-edge")}); stroke-width: 4; stroke-linejoin: round; }
${sc}.${c}-bug { fill: none; stroke: var(${v("ink")}); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
${sc}.${c}-shield { transform-box: fill-box; transform-origin: center; animation: ${kf}-settle var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ${kf}-settle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }`,
  },
  "metadata-cleansing-required": {
    words: "Metadata cleansing required",
    palette: AMBER,
    motif: tag,
    beside: (c) => svg`<path class=${`${c}-ink ${c}-speck`} d="M195 94l5-5M203 108h7M189 86v-7"></path><circle class=${`${c}-dot ${c}-speck`} cx="210" cy="92" r="2.5"></circle>`,
    motion: ["speck"],
    css: (c, v, kf, sc) => `
${sc}.${c}-speck { animation: ${kf}-twinkle calc(var(${v("beat")}) / 2) var(--tc-ease-standard) calc(var(${v("beat")}) * 0.2) 2 both; }
${twinkleKf(kf, "0.2")}`,
  },
  "metadata-cleansing-in-progress": {
    words: "Cleansing metadata",
    palette: BLUE,
    motif: (c, v) => svg`${tag(c, v)}${chip(c)}${pulseDots(c, v, [177, 184, 191], 148, 2.6)}`,
    motion: ["pulse"],
    css: (c, v, kf, sc) => `${chipCss(c, v, kf, sc)}
${sc}.${c}-pulse { transform-box: fill-box; transform-origin: center; animation: ${kf}-pulse calc(var(${v("beat")}) / 2) var(--tc-ease-standard) 4 both; }
${pulseKf(kf)}`,
  },
  "metadata-cleansing-failed": {
    words: "Metadata cleansing failed",
    palette: RED,
    motif: (c, v) => svg`${tag(c, v)}${chip(c)}<path class=${`${c}-chip-ink ${c}-cross`} d="M179 143l10 10M189 143l-10 10"></path>`,
    motion: ["cross", "mark"],
    css: (c, v, kf, sc) => `${chipCss(c, v, kf, sc)}
${sc}.${c}-cross { stroke-dasharray: 24; animation: ${kf}-draw calc(var(${v("beat")}) * 0.25) var(--tc-ease-move) calc(var(${v("beat")}) / 16) backwards; }
${sc}.${c}-mark { transform-box: fill-box; transform-origin: center; animation: ${kf}-shake calc(var(${v("beat")}) * 0.2) var(--tc-ease-standard) calc(var(${v("beat")}) * 0.3) 1; }
${drawKf(kf, 24)}
${shakeKf(kf)}`,
  },
  "metadata-cleansing-success": {
    words: "Metadata cleansed",
    palette: GREEN,
    motif: (c, v) => svg`${tag(c, v)}${chip(c)}<path class=${`${c}-chip-ink ${c}-tick`} d="M178 149l5 5 10-10"></path>`,
    motion: ["tick"],
    css: (c, v, kf, sc) => `${chipCss(c, v, kf, sc)}
${sc}.${c}-tick { stroke-dasharray: 24; animation: ${kf}-draw calc(var(${v("beat")}) * 0.3) var(--tc-ease-move) calc(var(${v("beat")}) / 16) backwards; }
${drawKf(kf, 24)}`,
  },
  "added-to-readbook": {
    words: "Added to Readbook",
    palette: GREEN,
    tile: "book",
    motif: (c) => svg`<path class=${`${c}-ink ${c}-tick`} d=${CHECK_PATH}></path>`,
    motion: ["tick"],
    css: (c, v, kf, sc) => `
${sc}.${c}-tick { stroke-dasharray: 40; animation: ${kf}-draw calc(var(${v("beat")}) * 0.3) var(--tc-ease-move) calc(var(${v("beat")}) / 16) backwards; }
${drawKf(kf)}`,
  },
  "preview-unavailable": {
    words: "Preview not available",
    palette: P(["#e6eaf0", "#3a3f48"], ["#b5bfcc", "#7d8796"], ["#4d5866", "#dfe4ec"], ["rgba(140, 155, 175, 0.24)", "rgba(140, 155, 175, 0.12)"]),
    lines: 0,
    glowY: 166,
    beat: "3s",
    scene: (c) => svg`<rect class=${`${c}-line`} x="126" y="44" width="36" height="6" rx="3"></rect>
      <rect class=${`${c}-ghost`} x="126" y="62" width="62" height="34" rx="6"></rect>
      <g class=${`${c}-mark`}>
        <circle class=${`${c}-badge`} cx="160" cy="128" r="24"></circle>
        <path class=${`${c}-ink`} d="M152 121a8 8 0 1 1 11 7.4c-2 .9-3 2.4-3 4.6M160 140v.5"></path>
      </g>`,
    motion: ["mark"],
    css: (c, v, kf, sc) => `
${sc}.${c}-ghost { fill: none; stroke: var(${v("line")}); stroke-width: 3; stroke-dasharray: 6 6; stroke-linecap: round; }
${sc}.${c}-badge { stroke-linejoin: miter; }
${sc}.${c}-ink { stroke-width: 4.5; }
${sc}.${c}-mark { transform-box: fill-box; transform-origin: center; animation: ${kf}-settle var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ${kf}-settle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`,
  },
  draft: {
    words: "Draft",
    palette: SLATE,
    motif: (c) => svg`<g class=${`${c}-pencil`}><path class=${`${c}-ink`} d="M148 138l3-9 15-15a3.5 3.5 0 0 1 5 5l-15 15Z"></path><path class=${`${c}-ink`} d="M163 117l5 5"></path></g>`,
    motion: ["pencil"],
    css: (c, v, kf, sc) => `
${sc}.${c}-page { stroke: var(${v("mark-edge")}); stroke-dasharray: 6 5; }
${sc}.${c}-pencil { animation: ${kf}-write calc(var(${v("beat")}) / 2) var(--tc-ease-standard) 2; }
@keyframes ${kf}-write { 0%, 100% { transform: translate(0, 0); } 30% { transform: translate(-3px, 2px); } 60% { transform: translate(2px, -1px); } }`,
  },
  scheduled: {
    words: "Scheduled",
    palette: BLUE,
    motif: (c) => svg`<path class=${`${c}-ink`} d="M146 117a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3h-22a3 3 0 0 1-3-3ZM146 123h28M153 110v7M167 110v7"></path><circle class=${`${c}-dot ${c}-day`} cx="165" cy="131" r="3"></circle>`,
    motion: ["day"],
    css: (c, v, kf, sc) => `
${sc}.${c}-day { transform-box: fill-box; transform-origin: center; animation: ${kf}-pulse calc(var(${v("beat")}) / 2) var(--tc-ease-standard) calc(var(${v("beat")}) / 8) 2 both; }
${pulseKf(kf)}`,
  },
  queued: {
    words: "Queued",
    palette: SLATE,
    motif: (c, v) => svg`${[116, 126, 136].map((y, i) => svg`<path class=${`${c}-ink ${c}-wait`} d=${`M149 ${y}h22`} style=${i ? `animation-delay: calc(var(${v("beat")}) / ${i === 1 ? 6 : 3})` : ""}></path>`)}`,
    motion: ["wait"],
    css: (c, v, kf, sc) => `
${sc}.${c}-wait { animation: ${kf}-wait calc(var(${v("beat")}) / 2) var(--tc-ease-standard) 3 both; }
@keyframes ${kf}-wait { 0%, 100% { opacity: 0.35; } 40% { opacity: 1; } }`,
  },
  archived: {
    words: "Archived",
    palette: SLATE,
    motif: (c) => svg`<path class=${`${c}-ink ${c}-lid`} d="M145 111h30v8h-30Z"></path><path class=${`${c}-ink`} d="M147 119v17a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3v-17M155 126h10"></path>`,
    motion: ["lid"],
    css: (c, v, kf, sc) => settleOnce(c, "lid", v, kf, sc, "translateY(-5px)"),
  },
  "in-trash": {
    words: "In trash",
    palette: SLATE,
    motif: (c) => svg`<path class=${`${c}-ink ${c}-lid`} d="M145 114h30M155 114v-4h10v4"></path><path class=${`${c}-ink`} d="M149 114l2 23a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3l2-23M157 121v12M163 121v12"></path>`,
    motion: ["lid"],
    css: (c, v, kf, sc) => settleOnce(c, "lid", v, kf, sc, "rotate(-14deg) translateY(-3px)"),
  },
  expired: {
    words: "Expired",
    palette: AMBER,
    motif: (c) => svg`<circle class=${`${c}-ink`} cx="160" cy="126" r="14"></circle><path class=${`${c}-ink ${c}-hands`} d="M160 117v9l6 4"></path>`,
    motion: ["hands"],
    css: (c, v, kf, sc) => `
${sc}.${c}-hands { transform-origin: 160px 126px; animation: ${kf}-sweep calc(var(${v("beat")}) * 0.5) var(--tc-ease-move) 1 backwards; }
@keyframes ${kf}-sweep { from { transform: rotate(-300deg); } to { transform: rotate(0deg); } }`,
  },
  duplicate: {
    words: "Duplicate",
    palette: AMBER,
    motif: (c) => svg`${twoPages(c)}<path class=${`${c}-ink`} d="M157 126h9M157 131h9"></path>`,
    motion: ["front"],
    css: (c, v, kf, sc) => `${sheetCss(c, v, kf, sc)}${settleOnce(c, "front", v, kf, sc, "translate(-6px, -5px)")}`,
  },
  "sync-conflict": {
    words: "Sync conflict",
    palette: AMBER,
    motif: (c) => svg`${twoPages(c)}${chip(c)}<path class=${`${c}-chip-ink`} d="M184 141v7M184 154v.5"></path>`,
    motion: ["front"],
    css: (c, v, kf, sc) => `${sheetCss(c, v, kf, sc)}${chipCss(c, v, kf, sc)}${settleOnce(c, "front", v, kf, sc, "translate(-6px, -5px)")}`,
  },
  locked: {
    words: "Locked",
    palette: AMBER,
    motif: (c) => padlock(c),
    motion: ["shackle"],
    css: (c, v, kf, sc) => settleOnce(c, "shackle", v, kf, sc, "translateY(-5px)"),
  },
  restricted: {
    words: "Restricted",
    palette: RED,
    motif: (c) => svg`<g class=${`${c}-crest`}><path class=${`${c}-ink`} d="M160 109l13 4v10c0 9-6 15-13 18-7-3-13-9-13-18v-10Z"></path><path class=${`${c}-ink`} d="M154 125h12"></path></g>`,
    motion: ["crest"],
    css: (c, v, kf, sc) => settleOnce(c, "crest", v, kf, sc, "scale(0.85)"),
  },
  redacted: {
    words: "Redacted",
    palette: SLATE,
    overTile: (c) => svg`${[
      [46, 36],
      [60, 52],
      [74, 44],
    ].map(([y, w], i) => svg`<rect class=${`${c}-bar`} x="125" y=${y} width=${w + 2} height="10" rx="2" style=${`animation-delay: ${i * 120}ms`}></rect>`)}`,
    motif: (c) => svg`<path class=${`${c}-ink`} d="M146 126s5-8 14-8c3 0 5.5 1 7.5 2.3M174 126s-5 8-14 8c-3 0-5.5-1-7.5-2.3M156.5 123.5a4 4 0 0 0 6 5M147 113l26 26"></path>`,
    motion: ["bar"],
    css: (c, v, kf, sc) => `
${sc}.${c}-bar { fill: light-dark(#1f2329, #0d0f12); transform-box: fill-box; transform-origin: left center; animation: ${kf}-wipe calc(var(${v("beat")}) * 0.25) var(--tc-ease-move) backwards; }
@keyframes ${kf}-wipe { from { transform: scaleX(0); } to { transform: scaleX(1); } }`,
  },
  "awaiting-signature": {
    words: "Awaiting signature",
    palette: PURPLE,
    motif: (c) => svg`<g class=${`${c}-nib`}>${nib(c, 160)}</g>`,
    motion: ["nib"],
    css: (c, v, kf, sc) => `
${sc}.${c}-nib { animation: ${kf}-bob var(${v("beat")}) var(--tc-ease-move) 3; }
@keyframes ${kf}-bob { 0%, 50%, 100% { transform: translateY(0); } 25% { transform: translateY(-4px); } }`,
  },
  signed: {
    words: "Signed",
    palette: GREEN,
    motif: (c) => svg`${nib(c, 156)}${chip(c)}<path class=${`${c}-chip-ink ${c}-tick`} d="M178 149l5 5 10-10"></path>`,
    motion: ["tick"],
    css: (c, v, kf, sc) => `${chipCss(c, v, kf, sc)}
${sc}.${c}-tick { stroke-dasharray: 24; animation: ${kf}-draw calc(var(${v("beat")}) * 0.3) var(--tc-ease-move) calc(var(${v("beat")}) / 16) backwards; }
${drawKf(kf, 24)}`,
  },
  shared: {
    words: "Shared",
    palette: BLUE,
    motif: (c) => svg`<circle class=${`${c}-ink`} cx="153" cy="117" r="5"></circle><path class=${`${c}-ink`} d="M143 137a10 10 0 0 1 20 0"></path>
      <g class=${`${c}-friend`}><circle class=${`${c}-ink`} cx="169" cy="119" r="4.5"></circle><path class=${`${c}-ink`} d="M163 128a9 9 0 0 1 15 7"></path></g>`,
    motion: ["friend"],
    css: (c, v, kf, sc) => settleOnce(c, "friend", v, kf, sc, "translateX(6px)"),
  },
  encrypted: {
    words: "Encrypted",
    palette: SLATE,
    motif: (c) => svg`<g class=${`${c}-key`}><circle class=${`${c}-ink`} cx="151" cy="120" r="7"></circle><path class=${`${c}-ink`} d="M156 125l15 15M165 134l4-4M169 138l4-4"></path></g>`,
    motion: ["key"],
    css: (c, v, kf, sc) => settleOnce(c, "key", v, kf, sc, "rotate(-25deg)"),
  },
  "password-protected": {
    words: "Password protected",
    palette: AMBER,
    overTile: (c, v) => svg`<rect class=${`${c}-field`} x="126" y="60" width="58" height="22" rx="5"></rect>
      ${[135, 145, 155, 165].map((x, i) => svg`<circle class=${`${c}-dot ${c}-key-dot`} cx=${x} cy="71" r="2.6" style=${`animation-delay: calc(var(${v("beat")}) / 10 * ${i})`}></circle>`)}`,
    motif: (c) => padlock(c),
    motion: ["key-dot"],
    css: (c, v, kf, sc) => `
${sc}.${c}-field { fill: var(${v("page")}); stroke: var(${v("mark-edge")}); stroke-width: 2; }
${sc}.${c}-key-dot { animation: ${kf}-type calc(var(${v("beat")}) / 8) var(--tc-ease-standard) backwards; }
@keyframes ${kf}-type { from { opacity: 0; } to { opacity: 1; } }`,
  },
  "update-available": {
    words: "Update available",
    palette: BLUE,
    motif: (c) => svg`<path class=${`${c}-ink ${c}-up`} d="M160 140v-25M149 125l11-11 11 11"></path><circle class=${`${c}-dot`} cx="174" cy="111" r="4"></circle>`,
    motion: ["up"],
    css: (c, v, kf, sc) => `
${sc}.${c}-up { transform-box: view-box; animation: ${kf}-lift calc(var(${v("beat")}) / 2) var(--tc-ease-move) 2; }
@keyframes ${kf}-lift { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-4px); } }`,
  },
  converting: {
    words: "Converting to text",
    palette: TEAL,
    overTile: (c) => svg`<path class=${`${c}-bracket`} d="M121 50v-8h7M184 42h7v8M121 80v8h7M184 88h7v-8"></path><rect class=${`${c}-read`} x="124" y="45" width="64" height="2.5" rx="1.25"></rect>`,
    motif: (c) => svg`<path class=${`${c}-ink`} d="M154 112h3a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3h-3M166 112h-3a3 3 0 0 0-3 3v22a3 3 0 0 0 3 3h3M155 126h10"></path>`,
    motion: ["read"],
    css: (c, v, kf, sc) => `
${sc}.${c}-bracket { fill: none; stroke: var(${v("mark-edge")}); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
${sc}.${c}-read { fill: var(${v("mark-edge")}); opacity: 0; animation: ${kf}-read calc(var(${v("beat")}) * 0.5) var(--tc-ease-standard) 3; }
@keyframes ${kf}-read { 0% { opacity: 0; transform: translateY(0); } 15%, 85% { opacity: 0.9; } 100% { opacity: 0; transform: translateY(38px); } }`,
  },
  "comment-needed": {
    words: "Comments waiting",
    palette: PURPLE,
    motif: (c) => svg`<g class=${`${c}-bubble-mark`}><path class=${`${c}-ink`} d="M146 116a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-11l-7 6v-6h-2a4 4 0 0 1-4-4Z"></path>
      <circle class=${`${c}-dot`} cx="153" cy="123" r="2.2"></circle><circle class=${`${c}-dot`} cx="160" cy="123" r="2.2"></circle><circle class=${`${c}-dot`} cx="167" cy="123" r="2.2"></circle></g>`,
    motion: ["bubble-mark"],
    css: (c, v, kf, sc) => `
${sc}.${c}-bubble-mark { animation: ${kf}-nod calc(var(${v("beat")}) / 2) var(--tc-ease-move) 2; }
@keyframes ${kf}-nod { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-3px); } }`,
  },
  "working-offline": {
    words: "Working offline",
    palette: SLATE,
    motif: (c) => svg`<path class=${`${c}-ink`} d="M150 136h20a8 8 0 0 0 1.4-15.9 11 11 0 0 0-21.3-2.4A8 8 0 0 0 150 136Z"></path>
      <path class=${`${c}-ink ${c}-cut`} d="M146 110l28 30"></path>`,
    motion: ["cut"],
    css: (c, v, kf, sc) => `
${sc}.${c}-cut { stroke-dasharray: 42; animation: ${kf}-draw calc(var(${v("beat")}) * 0.3) var(--tc-ease-move) calc(var(${v("beat")}) / 8) backwards; }
${drawKf(kf, 42)}`,
  },
};

/** The words for each status, when `caption` isn't set */
export const docStatusWords = Object.fromEntries(Object.entries(DOC_STATUSES).map(([k, e]) => [k, e.words])) as Record<DocStatus, string>;

const DEFAULT: DocStatus = "in-progress";

/** The CSS for every status, each status's rules scoped to it */
function docStatusCss() {
  const ui = "dst";
  const c = `ui-${ui}`;
  const v = (k: string) => `--tc-doc-status-${k}`;
  const statuses = Object.entries(DOC_STATUSES) as [DocStatus, Entry][];
  const tones = statuses
    .map(
      ([s, e]) => `[data-ui="dst"][status="${s}"] {
  ${v("mark")}: light-dark(${e.palette.mark[0]}, ${e.palette.mark[1]});
  ${v("mark-edge")}: light-dark(${e.palette.markEdge[0]}, ${e.palette.markEdge[1]});
  ${v("ink")}: light-dark(${e.palette.ink[0]}, ${e.palette.ink[1]});
  ${v("glow")}: light-dark(${e.palette.glow[0]}, ${e.palette.glow[1]});${e.beat ? `\n  ${v("beat")}: ${e.beat};` : ""}
}`,
    )
    .join("\n");
  // Each status's rules apply only to that status; :where keeps them no more specific than the shared ones
  const rules = statuses.map(([s, e]) => e.css(c, v, `${c}-${s}`, `:where([data-ui="dst"][status="${s}"]) `)).join("\n");
  const motion = [...new Set(statuses.flatMap(([, e]) => e.motion))];
  return docStageCss({ ui, name: "doc-status", palette: DOC_STATUSES[DEFAULT].palette, motion, css: `${tones}\n${rules}` });
}

/**
 * Where a document stands – released, in review, processing, done, failed, uploading, scanned for malware, metadata being cleansed, saved to a reading list – as one illustration whose `status` picks the drawing, colours and words.
 * @tag tc-doc-status
 */
export class TcDocStatus extends DocStage {
  static override ui = "dst";
  static override css = docStatusCss();

  /** Where the document stands; picks the drawing, its colours and its words */
  @property({ reflect: true }) accessor status: DocStatus = DEFAULT;

  /** The status drawn: `status`, or the default when it isn't one this element knows */
  protected get kind(): DocStatus {
    return this.status in DOC_STATUSES ? this.status : DEFAULT;
  }
  private get entry(): Entry {
    return DOC_STATUSES[this.kind];
  }
  private readonly v = (k: string) => `--tc-doc-status-${k}`;

  protected override get defaultCaption() {
    return this.entry.words;
  }
  protected override get tile() {
    return this.entry.tile ?? "page";
  }
  protected override get lines() {
    return this.entry.lines ?? 3;
  }
  protected override get glowY() {
    return this.entry.glowY ?? 168;
  }
  protected override motif() {
    return this.entry.motif?.(this.stage, this.v) ?? svg``;
  }
  protected override beside() {
    return this.entry.beside?.(this.stage, this.v) ?? svg``;
  }
  protected override overTile() {
    return this.entry.overTile?.(this.stage, this.v) ?? svg``;
  }
  protected override scene() {
    return this.entry.scene?.(this.stage, this.v) ?? null;
  }
}

if (!customElements.get("tc-doc-status")) customElements.define("tc-doc-status", TcDocStatus);

declare global {
  interface HTMLElementTagNameMap {
    "tc-doc-status": TcDocStatus;
  }
}
