import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-region-overlay> – what a vision model read, drawn on the image it read. Every region the model found (a line of
 * text, a table, a figure, a face it blurred, an object) is an outlined box on the image with its number; the same
 * regions are a list beside it with the label, the kind, the confidence in a word and a percentage, and the text the
 * model read. The two are linked: pointing at a box lights up its row, and moving through the list lights up its box.
 * Chips filter by kind, a slider hides regions under a confidence, and Show boxes takes the outlines off to see the
 * image plainly. Standard puts the header on the gray tray above the white card; Clean is one white card.
 *
 *   <tc-region-overlay src="/scans/form-12.png" alt="Scanned audit form" .regions=${regions}></tc-region-overlay>
 *
 * Boxes are fractions of the image (0–1), so the image can be any size. Selecting a region (click, Enter or Space)
 * fires a cancelable tc-selected-change ({ selected, region }); moving the slider fires tc-threshold-change
 * ({ threshold }), the chips tc-kinds-change ({ kinds }) and the switch tc-show-boxes-change ({ showBoxes }), all
 * cancelable. Low-confidence boxes are dashed, so the cue isn't colour alone.
 *
 * Keyboard: the list is a listbox with one tab stop – ↑ ↓ move (the box follows), Home / End, Enter or Space selects,
 * Escape clears the selection.
 */

/** A scan frame with a box in it: regions read off an image (Lucide scan, ISC – with a square for the region) */
const scanIcon = svg`<path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10" rx="1"></rect>`;

/** What kind of region the model found; any other string works too and is shown as given */
export type RegionKind = "text" | "table" | "figure" | "face-blurred" | "object" | (string & {});

/** Where a region sits, as fractions (0–1) of the image's width and height */
export type RegionBox = { x: number; y: number; width: number; height: number };

export type OverlayRegion = {
  id: string;
  /** What it is, e.g. "Auditor's signature" */
  label: string;
  kind: RegionKind;
  box: RegionBox;
  /** How sure the model is, 0 to 1 */
  confidence: number;
  /** What the model read there, if it read text */
  text?: string;
};

/** Words for confidence: at or above `high` is High, at or above `medium` is Medium, below is Low */
export type RegionConfidenceWords = { high: string; medium: string; low: string };

/** Names the page can change */
export type RegionOverlayLabels = {
  showBoxes: string;
  threshold: string;
  kinds: string;
  list: string;
  empty: string;
  noText: string;
  confidence: RegionConfidenceWords;
  /** The kind names; kinds not listed show as given */
  kindNames: Record<string, string>;
};

/** The labels a page passes: any of them, and any of the confidence words */
export type RegionOverlayLabelsInput = Partial<Omit<RegionOverlayLabels, "confidence">> & { confidence?: Partial<RegionConfidenceWords> };

export const defaultRegionOverlayLabels: RegionOverlayLabels = {
  showBoxes: "Show boxes",
  threshold: "Minimum confidence",
  kinds: "Kinds",
  list: "Regions",
  empty: "No regions at this confidence",
  noText: "No text read",
  confidence: { high: "High", medium: "Medium", low: "Low" },
  kindNames: { text: "Text", table: "Table", figure: "Figure", "face-blurred": "Face (blurred)", object: "Object" },
};

/** Detail of tc-selected-change */
export type RegionSelectedChange = { selected: string | null; region?: OverlayRegion };
/** Detail of tc-threshold-change: the threshold, 0–1 */
export type RegionThresholdChange = { threshold: number };
/** Detail of tc-kinds-change: the kinds shown – null for all of them */
export type RegionKindsChange = { kinds: string[] | null };
/** Detail of tc-show-boxes-change */
export type RegionShowBoxesChange = { showBoxes: boolean };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pct = (c: number) => `${Math.round(clamp(c, 0, 1) * 100)}%`;
/** Confidence at or above these is High / Medium */
const HIGH = 0.85;
const MEDIUM = 0.6;

let instances = 0;

/**
 * What a vision model read, drawn on the image: numbered boxes linked to a list with each region's kind, confidence and
 * read text, filtered by kind and a confidence threshold.
 * @tag tc-region-overlay
 * @fires tc-selected-change - A region was selected or the selection cleared. Cancelable. Detail: RegionSelectedChange ({ selected, region })
 * @fires tc-threshold-change - The confidence slider moved. Cancelable. Detail: RegionThresholdChange ({ threshold })
 * @fires tc-kinds-change - A kind chip was turned on or off. Cancelable. Detail: RegionKindsChange ({ kinds })
 * @fires tc-show-boxes-change - Show boxes was switched. Cancelable. Detail: RegionShowBoxesChange ({ showBoxes })
 */
export class TcRegionOverlay extends TcElement {
  static override ui = "rgo";

  /** The heading */
  @property() accessor heading = "What the model read";
  /** A quiet line under the heading – the file or the model */
  @property() accessor description: string | undefined = undefined;
  /** The image the model read – a data: URL works too */
  @property() accessor src = "";
  /** What the image is, for people who can't see it */
  @property() accessor alt = "";
  /** The regions the model found */
  @property({ attribute: false }) accessor regions: OverlayRegion[] = [];
  /** The selected region's id, or null */
  @property() accessor selected: string | null = null;
  /** Regions under this confidence (0–1) are hidden */
  @property({ type: Number }) accessor threshold = 0;
  /** The kinds shown; null shows every kind */
  @property({ attribute: false }) accessor kinds: string[] | null = null;
  /** Whether the boxes are drawn on the image */
  @property({ type: Boolean, attribute: "show-boxes" }) accessor showBoxes = true;
  /** Names the page can change, merged over defaultRegionOverlayLabels */
  @property({ attribute: false }) accessor labels: RegionOverlayLabelsInput = {};

  /** @internal The region holding the list's tab stop */
  @state() accessor active: string | null = null;
  /** @internal The region under the pointer */
  @state() accessor hovered: string | null = null;

  private readonly uid = `tc-rgo${++instances}`;
  private focusActive = false;

  private get l(): RegionOverlayLabels {
    const p = this.labels ?? {};
    return {
      ...defaultRegionOverlayLabels,
      ...p,
      confidence: { ...defaultRegionOverlayLabels.confidence, ...p.confidence },
      kindNames: { ...defaultRegionOverlayLabels.kindNames, ...p.kindNames },
    };
  }

  /** Every kind present, in the order they first appear */
  private get allKinds(): string[] {
    return [...new Set(this.regions.map((r) => r.kind))];
  }

  private get visible(): OverlayRegion[] {
    const kinds = this.kinds;
    return this.regions.filter((r) => r.confidence >= this.threshold && (!kinds || kinds.includes(r.kind)));
  }

  private kindName(kind: string) {
    return this.l.kindNames[kind] ?? kind;
  }

  private word(c: number) {
    const w = this.l.confidence;
    return c >= HIGH ? w.high : c >= MEDIUM ? w.medium : w.low;
  }

  private level(c: number) {
    return c >= HIGH ? "high" : c >= MEDIUM ? "medium" : "low";
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const vis = this.visible;
    if (!vis.some((r) => r.id === this.active)) this.active = vis.find((r) => r.id === this.selected)?.id ?? vis[0]?.id ?? null;
    if (this.hovered && !vis.some((r) => r.id === this.hovered)) this.hovered = null;
  }

  protected override updated() {
    if (!this.focusActive) return;
    this.focusActive = false;
    const opt = this.optionOf(this.active);
    opt?.focus();
    opt?.scrollIntoView?.({ block: "nearest" });
  }

  private optionOf(id: string | null) {
    return id ? this.querySelector<HTMLElement>(`.ui-rgo__option[data-id="${CSS.escape(id)}"]`) : null;
  }

  /* ---------- Changes ---------- */

  private select(id: string | null) {
    const next = id === this.selected ? null : id;
    const region = this.regions.find((r) => r.id === next);
    if (this.emit<RegionSelectedChange>("tc-selected-change", { selected: next, region }, { cancelable: true })) this.selected = next;
  }

  private setThreshold(value: number) {
    const threshold = clamp(Math.round(value * 100) / 100, 0, 1);
    if (threshold === this.threshold) return;
    if (this.emit<RegionThresholdChange>("tc-threshold-change", { threshold }, { cancelable: true })) this.threshold = threshold;
    else this.requestUpdate();
  }

  private toggleKind(kind: string) {
    const all = this.allKinds;
    const shown = this.kinds ?? all;
    let next: string[] | null = shown.includes(kind) ? shown.filter((k) => k !== kind) : [...shown, kind];
    // Every kind on again is the same as no filter
    if (all.every((k) => next!.includes(k))) next = null;
    if (this.emit<RegionKindsChange>("tc-kinds-change", { kinds: next }, { cancelable: true })) this.kinds = next;
  }

  private toggleBoxes() {
    const showBoxes = !this.showBoxes;
    if (this.emit<RegionShowBoxesChange>("tc-show-boxes-change", { showBoxes }, { cancelable: true })) this.showBoxes = showBoxes;
  }

  /* ---------- Keyboard: the listbox ---------- */

  private onListKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const vis = this.visible;
    if (!vis.length) return;
    const i = Math.max(0, vis.findIndex((r) => r.id === this.active));
    let to = -1;
    switch (e.key) {
      case "ArrowDown":
        to = Math.min(vis.length - 1, i + 1);
        break;
      case "ArrowUp":
        to = Math.max(0, i - 1);
        break;
      case "Home":
        to = 0;
        break;
      case "End":
        to = vis.length - 1;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        this.select(vis[i].id);
        return;
      case "Escape":
        if (this.selected !== null) {
          e.preventDefault();
          this.select(null);
        }
        return;
    }
    if (to < 0) return;
    e.preventDefault();
    this.active = vis[to].id;
    this.focusActive = true;
  };

  private onListFocusIn = (e: FocusEvent) => {
    const opt = (e.target as HTMLElement).closest<HTMLElement>(".ui-rgo__option");
    if (opt?.dataset.id && opt.dataset.id !== this.active) this.active = opt.dataset.id;
  };

  /* ---------- Render ---------- */

  private renderImage(vis: OverlayRegion[]): TemplateResult {
    const lit = this.hovered ?? this.active;
    const numbers = new Map(this.regions.map((r, i) => [r.id, i + 1]));
    return html`<div class="ui-rgo__stage">
      <div class="ui-rgo__frame">
        ${this.src
          ? html`<img class="ui-rgo__img" src=${ifDefined(safeMediaUrl(this.src))} alt=${this.alt} draggable="false" decoding="async" />`
          : html`<div class="ui-rgo__noimg">No image</div>`}
        ${this.showBoxes
          ? repeat(
              vis,
              (r) => r.id,
              (r) => html`<div
                class="ui-rgo__box"
                aria-hidden="true"
                data-kind=${r.kind}
                data-level=${this.level(r.confidence)}
                ?data-lit=${r.id === lit}
                ?data-selected=${r.id === this.selected}
                style=${styleMap({
                  left: `${clamp(r.box.x, 0, 1) * 100}%`,
                  top: `${clamp(r.box.y, 0, 1) * 100}%`,
                  width: `${clamp(r.box.width, 0, 1) * 100}%`,
                  height: `${clamp(r.box.height, 0, 1) * 100}%`,
                })}
                @pointerenter=${() => (this.hovered = r.id)}
                @pointerleave=${() => this.hovered === r.id && (this.hovered = null)}
                @click=${() => {
                  this.active = r.id;
                  this.select(r.id);
                }}
              ><span class="ui-rgo__num">${numbers.get(r.id)}</span>${r.id === lit || r.id === this.selected ? html`<span class="ui-rgo__tag">${r.label}</span>` : nothing}</div>`,
            )
          : nothing}
      </div>
    </div>`;
  }

  private renderOption(r: OverlayRegion, n: number) {
    const lit = r.id === (this.hovered ?? this.active);
    const sel = r.id === this.selected;
    const level = this.level(r.confidence);
    return html`<li
      class="ui-rgo__option"
      role="option"
      data-id=${r.id}
      data-level=${level}
      aria-selected=${sel ? "true" : "false"}
      tabindex=${r.id === this.active ? 0 : -1}
      ?data-lit=${lit}
      @click=${() => {
        this.active = r.id;
        this.select(r.id);
      }}
      @pointerenter=${() => (this.hovered = r.id)}
      @pointerleave=${() => this.hovered === r.id && (this.hovered = null)}
    >
      <span class="ui-rgo__row">
        <span class="ui-rgo__n" aria-hidden="true">${n}</span>
        <span class="ui-rgo__label">${r.label}</span>
        <span class="ui-rgo__conf" data-level=${level}
          ><span class="ui-rgo__meter" aria-hidden="true"><span style=${styleMap({ transform: `scaleX(${clamp(r.confidence, 0, 1)})` })}></span></span
          ><span class="ui-rgo__word">${this.word(r.confidence)}</span> ${pct(r.confidence)}<span class="ui-rgo__sr"> confidence</span></span
        >
      </span>
      <span class="ui-rgo__kind">${this.kindName(r.kind)}</span>
      ${sel
        ? html`<span class="ui-rgo__text" ?data-empty=${!r.text}>${r.text || this.l.noText}</span>`
        : r.text
          ? html`<span class="ui-rgo__snippet">${r.text}</span>`
          : nothing}
    </li>`;
  }

  private renderList(vis: OverlayRegion[]): TemplateResult {
    const numbers = new Map(this.regions.map((r, i) => [r.id, i + 1]));
    return html`<div class="ui-rgo__side">
      <span class="ui-rgo__sr" id=${`${this.uid}-list`}>${this.l.list}</span>
      ${vis.length
        ? html`<ul
            class="ui-rgo__list"
            role="listbox"
            aria-labelledby=${`${this.uid}-list`}
            aria-describedby=${`${this.uid}-keys`}
            @keydown=${this.onListKey}
            @focusin=${this.onListFocusIn}
          >
            ${repeat(
              vis,
              (r) => r.id,
              (r) => this.renderOption(r, numbers.get(r.id)!),
            )}
          </ul>`
        : html`<p class="ui-rgo__empty">${this.l.empty}</p>`}
    </div>`;
  }

  private renderTools(): TemplateResult {
    const l = this.l;
    const all = this.allKinds;
    const shown = this.kinds ?? all;
    const value = Math.round(this.threshold * 100);
    return html`<div class="ui-rgo__tools">
      ${all.length > 1
        ? html`<div class="ui-rgo__chips" role="group" aria-label=${l.kinds}>
            ${all.map((k) => {
              const on = shown.includes(k);
              const count = this.regions.filter((r) => r.kind === k).length;
              return html`<button type="button" class="ui-rgo__chip" aria-pressed=${on ? "true" : "false"} @click=${() => this.toggleKind(k)}>
                <svg class="ui-rgo__check" viewBox="0 0 24 24" aria-hidden="true">${on ? svg`<path d="M5.5 12.5l4 4L18.5 8"></path>` : svg`<path d="M12 5v14M5 12h14"></path>`}</svg>${this.kindName(k)}<span class="ui-rgo__count">${count}</span>
              </button>`;
            })}
          </div>`
        : nothing}
      <label class="ui-rgo__slider">
        <span>${l.threshold}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          .value=${live(String(value))}
          aria-valuetext=${`${value}%`}
          @input=${(e: Event) => this.setThreshold((e.target as HTMLInputElement).valueAsNumber / 100)}
        />
        <output class="ui-rgo__value" aria-hidden="true">${value}%</output>
      </label>
      <button type="button" class="ui-rgo__switch" role="switch" aria-checked=${this.showBoxes ? "true" : "false"} @click=${this.toggleBoxes}>
        <span class="ui-rgo__track" aria-hidden="true"><span></span></span>${l.showBoxes}
      </button>
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const vis = this.visible;
    const n = this.regions.length;
    const head = cardHead({
      icon: scanIcon,
      title: this.heading,
      id: `${this.uid}-title`,
      subtitle: this.description,
      aside: n ? html`<span class="ui-rgo__total">${vis.length === n ? `${n} ${n === 1 ? "region" : "regions"}` : `${vis.length} of ${n} regions`}</span>` : nothing,
    });
    const body = html`${this.renderTools()}<div class="ui-rgo__body">${this.renderImage(vis)}${this.renderList(vis)}</div>`;
    return html`
      ${clean ? html`<div class="ui-rgo__card">${head}${body}</div>` : html`${head}<div class="ui-rgo__card">${body}</div>`}
      <span class="ui-rgo__sr" id=${`${this.uid}-keys`}>Arrows move between regions, Enter selects, Escape clears</span>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rgo"] {
  /* The side list's width, and the most the image grows to */
  --tc-region-overlay-side: 300px;
  --tc-region-overlay-image-max: 520px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 900px;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rgo"] {
  --tc-region-overlay-side: 300px;
  --tc-region-overlay-image-max: 520px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 880px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rgo"] *, [data-ui="rgo"] *::before, [data-ui="rgo"] *::after { box-sizing: border-box; }
:where([data-ui="rgo"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="rgo"]) svg { display: block; flex: none; }
[data-ui="rgo"] button:focus-visible, .ui-rgo__option:focus-visible, .ui-rgo__slider input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rgo__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-rgo__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rgo__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-rgo__card > .tc-head + .ui-rgo__tools { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rgo__total { font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); white-space: nowrap; }
/* ----- Tools: kind chips, the threshold, Show boxes ----- */
.ui-rgo__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-4); padding: var(--tc-space-2-5) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); }
.ui-rgo__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-rgo__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rgo__chip:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-rgo__chip[aria-pressed="true"] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-primary); }
.ui-rgo__check { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-rgo__count { font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-rgo__slider { display: inline-flex; align-items: center; gap: var(--tc-space-2); color: var(--tc-text-muted); }
.ui-rgo__slider input { width: 120px; margin: 0; accent-color: var(--tc-accent); }
.ui-rgo__value { min-width: 4ch; font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
.ui-rgo__switch { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); margin-left: auto; color: var(--tc-text-primary); }
.ui-rgo__track { position: relative; width: 28px; height: 16px; border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rgo__track > span { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--tc-gray-0); box-shadow: var(--tc-shadow-raised); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rgo__switch[aria-checked="true"] .ui-rgo__track { background: var(--tc-accent-solid); }
.ui-rgo__switch[aria-checked="true"] .ui-rgo__track > span { transform: translateX(12px); }
/* ----- The image with its boxes, and the list ----- */
.ui-rgo__body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, var(--tc-region-overlay-side)); }
.ui-rgo__stage { display: grid; place-items: center; min-width: 0; padding: var(--tc-space-4); border-right: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-surface-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-rgo__stage { background: var(--tc-fill-subtle); }
.ui-rgo__frame { position: relative; width: 100%; max-width: var(--tc-region-overlay-image-max); border-radius: var(--tc-radius-xs); background: var(--tc-gray-0); box-shadow: var(--tc-shadow-raised); }
.ui-rgo__img { display: block; width: 100%; height: auto; border-radius: inherit; user-select: none; -webkit-user-drag: none; }
.ui-rgo__noimg { display: grid; place-items: center; aspect-ratio: 4 / 3; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* A box: a thin outline with its number; Low is dashed, the lit one gets a ring and its label (on the inverse surface,
   which stays solid over any image) */
.ui-rgo__box { position: absolute; border: 1.5px solid var(--tc-accent); border-radius: var(--tc-radius-2xs); background: color-mix(in srgb, var(--tc-accent) 6%, transparent); cursor: pointer; transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rgo__box[data-level="medium"] { border-color: var(--tc-status-info-fg); background: color-mix(in srgb, var(--tc-status-info-fg) 6%, transparent); }
.ui-rgo__box[data-level="low"] { border-style: dashed; border-color: var(--tc-status-warning-fg); background: color-mix(in srgb, var(--tc-status-warning-fg) 8%, transparent); }
.ui-rgo__box[data-kind="face-blurred"] { background: color-mix(in srgb, var(--tc-text-muted) 20%, transparent); }
.ui-rgo__box:hover, .ui-rgo__box[data-lit] { z-index: 2; box-shadow: 0 0 0 3px var(--tc-accent-subtle); background: color-mix(in srgb, var(--tc-accent) 14%, transparent); }
.ui-rgo__box[data-selected] { z-index: 3; border-width: 2px; box-shadow: 0 0 0 4px var(--tc-accent-subtle); }
.ui-rgo__num { position: absolute; top: -1px; left: -1px; display: grid; place-items: center; min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-2xs); background: var(--tc-accent-solid); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; color: var(--tc-text-on-accent); transform: translate(-50%, -50%); }
.ui-rgo__box[data-level="medium"] .ui-rgo__num { background: var(--tc-status-info-fg); color: var(--tc-surface-raised); }
.ui-rgo__box[data-level="low"] .ui-rgo__num { background: var(--tc-status-warning-fg); color: var(--tc-surface-raised); }
.ui-rgo__tag { position: absolute; left: -2px; bottom: calc(100% + 6px); max-width: 220px; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); overflow: hidden; border-radius: var(--tc-pill-radius); background: var(--tc-surface-inverse); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-text-on-inverse); white-space: nowrap; text-overflow: ellipsis; pointer-events: none; }
.ui-rgo__side { min-width: 0; max-height: 520px; overflow: auto; overscroll-behavior: contain; }
.ui-rgo__list { display: grid; gap: var(--tc-space-0-5); margin: 0; padding: var(--tc-space-1-5); list-style: none; }
.ui-rgo__option { display: grid; gap: var(--tc-space-0-5); min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); outline: none; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rgo__option:hover, .ui-rgo__option[data-lit] { background: var(--tc-fill-subtle); }
.ui-rgo__option[aria-selected="true"] { background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-rgo__option[aria-selected="true"] { background: var(--tc-accent-subtle); }
.ui-rgo__row { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-rgo__n { display: grid; place-items: center; flex: none; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; color: var(--tc-text-secondary); }
.ui-rgo__label { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-rgo__label { font-weight: var(--tc-font-weight-medium); }
.ui-rgo__conf { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-rgo__conf[data-level="low"] { color: var(--tc-status-warning-fg); }
.ui-rgo__word { font-weight: var(--tc-font-weight-medium); }
.ui-rgo__meter { position: relative; width: 24px; height: 4px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-rgo__meter > span { position: absolute; inset: 0; border-radius: inherit; background: var(--tc-text-muted); transform-origin: left; }
.ui-rgo__conf[data-level="low"] .ui-rgo__meter > span { background: var(--tc-status-warning-fg); }
.ui-rgo__kind { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-rgo__snippet { overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
.ui-rgo__text { padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-rgo__text[data-empty] { font-style: italic; color: var(--tc-text-muted); }
.ui-rgo__empty { margin: 0; padding: var(--tc-space-8) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
/* Narrow: the list goes below the image */
@container (max-width: 640px) {
  .ui-rgo__body { grid-template-columns: minmax(0, 1fr); }
  .ui-rgo__stage { border-right: 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); padding: var(--tc-space-3); }
  .ui-rgo__side { max-height: none; }
  .ui-rgo__switch { margin-left: 0; }
}
@media (pointer: coarse) {
  .ui-rgo__chip, .ui-rgo__switch { min-height: 36px; }
}
@media (forced-colors: active) {
  .ui-rgo__box { border-color: CanvasText; }
  .ui-rgo__box[data-lit], .ui-rgo__box[data-selected] { border-color: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rgo"] *, [data-ui="rgo"] *::before, [data-ui="rgo"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-region-overlay")) customElements.define("tc-region-overlay", TcRegionOverlay);

declare global {
  interface HTMLElementTagNameMap {
    "tc-region-overlay": TcRegionOverlay;
  }
}
