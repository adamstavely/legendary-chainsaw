import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, OffScreenController } from "./internal/controllers";

/*
 * <tc-image-grid> – generated images as a grid of variations. Every tile is pending (a shimmer sweeps over it while it
 * generates, with its progress when the app knows it), done or failed (with Try again). A done tile has a floating
 * row of actions – Regenerate, Upscale, Compare, Download – and an alt-text line under it that is required and
 * editable. Compare puts two tiles on top of each other with a divider you drag (or move with the arrow keys) to wipe
 * from one to the other. Clean drops the gray tray: one white card whose last row holds the summary.
 *
 *   <tc-image-grid heading="Lighthouse at dusk" .tiles=${tiles} @tc-regenerate=${(e) => regenerate(e.detail.tile)}></tc-image-grid>
 *
 * Regenerate and upscale are requests: the app answers by updating the tile (pending, then done with the new `src`).
 * Download fires a cancelable tc-download and, unless a listener prevents it, saves the image. Alt-text edits fire a
 * cancelable tc-tiles-change ({ tiles }); the compared pair and the divider fire tc-compare-change and
 * tc-split-change – preventDefault() and pass the value back to own it.
 *
 * Keyboard (the WAI-ARIA grid pattern): arrows move between tiles, Home/End to the row's ends, Ctrl+Home/End to the
 * first and last tile. Enter moves into the tile's actions (Tab cycles them, Escape goes back to the tile); F2 edits
 * the alt text; R, U, C and D regenerate, upscale, compare and download the focused tile. The compare divider is a
 * slider: arrows (Shift for 10), Page Up/Down, Home/End; Escape closes the comparison.
 */

export type ImageGridTileStatus = "pending" | "done" | "failed";

export type ImageGridTile = {
  id: string;
  /** The image URL – a data: URL works too. Shown when the tile is done */
  src?: string;
  /** What the image shows, for people who can't see it. Required – an empty string shows "Add alt text" */
  alt: string;
  /** "done" when left out */
  status?: ImageGridTileStatus;
  /** 0 to 1 while pending; left out, the tile just shimmers */
  progress?: number;
  /** What a pending tile says it is doing – "Generating" by default ("Upscaling", "Varying"…) */
  activity?: string;
  /** Why a failed tile failed */
  error?: string;
  /** Marks an upscaled image: a badge, and Upscale is off */
  upscaled?: boolean;
  /** The tile's name – "Variation 2" by default */
  label?: string;
  /** File name for downloads – from the heading and the tile number by default */
  filename?: string;
};

export type ImageGridAction = "regenerate" | "upscale" | "compare" | "download";

/** Detail of tc-regenerate, tc-upscale and tc-download */
export type ImageGridTileEvent = { tile: ImageGridTile; index: number };
/** Detail of tc-tiles-change */
export type ImageGridTilesChange = { tiles: ImageGridTile[] };
/** Detail of tc-compare-change: the two tile ids side by side, or null when the comparison closes */
export type ImageGridCompareChange = { compare: [string, string] | null };
/** Detail of tc-split-change: where the divider is, 0–100 (percent from the left) */
export type ImageGridSplitChange = { split: number };

const ALL_ACTIONS: ImageGridAction[] = ["regenerate", "upscale", "compare", "download"];

/* ---------- Helpers ---------- */

const statusOf = (t: ImageGridTile): ImageGridTileStatus => t.status ?? "done";
const labelOf = (t: ImageGridTile, i: number) => t.label ?? `Variation ${i + 1}`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const percent = (p: number) => `${Math.round(clamp(p, 0, 1) * 100)}%`;

/** The file extension of an image URL: from a data: URL's type or the path, else png */
const extOf = (src: string) => {
  const data = src.match(/^data:image\/([\w.+-]+)/i);
  if (data) return data[1].toLowerCase().replace("svg+xml", "svg").replace("jpeg", "jpg");
  const path = src.split(/[?#]/)[0].match(/\.(png|jpe?g|webp|gif|avif|svg)$/i);
  return path ? path[1].toLowerCase().replace("jpeg", "jpg") : "png";
};
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "image";

/** Saves an image: data: and blob: URLs directly, others through fetch (a cross-origin image without CORS opens in a new tab instead) */
async function saveImage(src: string, filename: string, keep: (url: string) => void) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = src;
  if (!/^(data|blob):/i.test(src)) {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(String(res.status));
      a.href = URL.createObjectURL(await res.blob());
      keep(a.href);
    } catch {
      a.target = "_blank";
      a.rel = "noopener";
    }
  }
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
}

/* ---------- Icons: 24px line glyphs – thinner in Clean ---------- */

const glyph = (d: string, className = "") =>
  html`<svg viewBox="0 0 24 24" class=${["ui-igrid__glyph", className].filter(Boolean).join(" ")} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const icons = {
  regenerate: "M20 12a8 8 0 1 1-2.34-5.66L20 8.5M20 4v4.5h-4.5",
  upscale: "M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5",
  compare: "M12 3v18M8.5 8 5 12l3.5 4M15.5 8l3.5 4-3.5 4",
  download: "M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14",
  edit: "M4.5 19.5h3.75L18.6 9.15a2.12 2.12 0 0 0-3-3L5.25 16.5v3zM14.25 7.5l2.25 2.25",
  alert: "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  sparkle: "M12 3.5l1.9 5.1a1 1 0 0 0 .6.6l5 1.8-5 1.8a1 1 0 0 0-.6.6L12 18.5l-1.9-5.1a1 1 0 0 0-.6-.6l-5-1.8 5-1.8a1 1 0 0 0 .6-.6zM18.5 3v3M17 4.5h3",
  grip: "M9.5 8 5.5 12l4 4M14.5 8l4 4-4 4",
  check: "M5.5 12.5l4 4L18.5 8",
  hd: "M4 6.5h16v11H4zM8 9.5v5M11 9.5v5M8 12h3M14 9.5v5h1.5a2.5 2.5 0 0 0 0-5z",
};

let instances = 0;

/**
 * Generated images as a grid of variations: regenerate one, upscale, compare two, download, alt text for each.
 * @tag tc-image-grid
 * @fires tc-regenerate - Regenerate (or Try again) on a tile; the app answers by updating it. Detail: ImageGridTileEvent ({ tile, index })
 * @fires tc-upscale - Upscale on a done tile; the app answers by updating it. Detail: ImageGridTileEvent ({ tile, index })
 * @fires tc-download - Download on a done tile. Cancelable: unless prevented, the image is saved. Detail: ImageGridTileEvent ({ tile, index })
 * @fires tc-tiles-change - An alt text was edited. Cancelable. Detail: ImageGridTilesChange ({ tiles })
 * @fires tc-compare-change - Two tiles go side by side, or the comparison closes. Cancelable. Detail: ImageGridCompareChange ({ compare })
 * @fires tc-split-change - The compare divider moved. Cancelable. Detail: ImageGridSplitChange ({ split })
 */
export class TcImageGrid extends TcElement {
  static override ui = "igrid";

  /** The images, in order */
  @property({ attribute: false }) accessor tiles: ImageGridTile[] = [];
  /** Names the grid */
  @property() accessor heading = "Variations";
  /** The prompt the images came from, shown under the heading */
  @property() accessor prompt: string | undefined = undefined;
  /** Tiles per row (fewer when there are fewer tiles) */
  @property({ type: Number }) accessor columns = 2;
  /** Width / height of every tile */
  @property({ type: Number }) accessor ratio = 1;
  /** Which actions a done tile offers */
  @property({ attribute: false }) accessor actions: ImageGridAction[] = ALL_ACTIONS;
  /** The two tile ids side by side, or null for the grid */
  @property({ attribute: false }) accessor compare: [string, string] | null = null;
  /** Where the compare divider is: 0–100, percent from the left */
  @property({ type: Number }) accessor split = 50;

  /** @internal The tile that holds the grid's tab stop */
  @state() accessor active = 0;
  /** @internal The first tile picked for a comparison */
  @state() accessor picking: string | null = null;
  /** @internal The tile whose alt text is being edited */
  @state() accessor editing: string | null = null;
  /** @internal The alt text being typed */
  @state() accessor draft = "";
  /** @internal Saving an empty alt text was tried */
  @state() accessor invalid = false;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-igrid${++instances}`;
  private statuses = new Map<string, ImageGridTileStatus>();
  /** Where focus goes after the next update */
  private focusNext: string | null = null;
  /** Whether alt editing started on the tile (F2) or its edit button – Escape goes back there */
  private editFrom: "cell" | "button" = "button";
  private drag: number | null = null;
  private urls = new Set<string>();
  private timers = new Set<number>();
  /** The pair shown in the last update ("a\u0001b"), or null */
  private wasComparing: string | null = null;

  constructor() {
    super();
    // A control that goes away (a tile starts generating, a tile is removed): focus moves to its tile, else the first
    new FocusRescueController(this, (key) => {
      const id = key?.split(":").slice(1).join(":");
      const cells = this.cells();
      return (id && cells.find((c) => c.dataset.id === id)) || cells[clamp(this.active, 0, cells.length - 1)] || this.querySelector(".ui-igrid__close");
    });
    // The shimmer of pending tiles pauses while the grid is scrolled away
    new OffScreenController(this, () => this.tiles.some((t) => statusOf(t) === "pending"));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.urls.forEach((u) => URL.revokeObjectURL(u));
    this.urls.clear();
    this.drag = null;
  }

  private cells() {
    return [...this.querySelectorAll<HTMLElement>(".ui-igrid__tile")];
  }
  private cellAt(i: number) {
    return this.querySelector<HTMLElement>(`.ui-igrid__tile[data-index="${i}"]`);
  }
  private get cols() {
    return Math.max(1, Math.min(Math.floor(this.columns) || 1, this.tiles.length || 1));
  }
  private get enabled() {
    return new Set(this.actions);
  }
  /** The compared pair, when both tiles are there and done */
  private get pair(): [ImageGridTile, ImageGridTile] | null {
    if (!this.compare) return null;
    const [a, b] = this.compare.map((id) => this.tiles.find((t) => t.id === id));
    return a && b && a !== b && statusOf(a) === "done" && statusOf(b) === "done" && a.src && b.src ? [a, b] : null;
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("tiles")) {
      // Say when a tile finishes or fails (not on the first render)
      const first = this.statuses.size === 0;
      const next = new Map<string, ImageGridTileStatus>();
      const notes: string[] = [];
      this.tiles.forEach((t, i) => {
        const now = statusOf(t);
        const before = this.statuses.get(t.id);
        next.set(t.id, now);
        if (first || before === now || before !== "pending") return;
        if (now === "done") notes.push(`${labelOf(t, i)} is ready`);
        if (now === "failed") notes.push(`${labelOf(t, i)} failed${t.error ? `: ${t.error}` : ""}`);
      });
      this.statuses = next;
      if (notes.length) this.said = notes.join(". ");
      if (this.picking && !this.tiles.some((t) => t.id === this.picking && statusOf(t) === "done")) this.picking = null;
      if (this.editing && !this.tiles.some((t) => t.id === this.editing && statusOf(t) === "done")) this.editing = null;
    }
    // Opening a comparison moves focus to the divider; closing it, back to the first compared tile – when focus was
    // in the element (the control that did it goes away with the view)
    const pair = this.pair;
    const comparing = pair ? pair.map((t) => t.id).join("\u0001") : null;
    if (!!comparing !== !!this.wasComparing) {
      const closed = this.wasComparing?.split("\u0001")[0];
      if (!pair) {
        const i = this.tiles.findIndex((t) => t.id === closed);
        if (i >= 0) this.active = i;
      }
      if (this.contains(document.activeElement)) this.focusNext = pair ? ".ui-igrid__handle" : `.ui-igrid__tile[data-index="${clamp(this.active, 0, Math.max(0, this.tiles.length - 1))}"]`;
    }
    this.wasComparing = comparing;
    this.active = clamp(this.active, 0, Math.max(0, this.tiles.length - 1));
  }

  protected override updated() {
    if (this.focusNext) {
      const target = this.querySelector<HTMLElement>(this.focusNext);
      this.focusNext = null;
      if (target) {
        target.focus({ preventScroll: true });
        if (target instanceof HTMLInputElement) target.select();
      }
    }
  }

  private later(run: () => void, ms: number) {
    const t = window.setTimeout(() => {
      this.timers.delete(t);
      run();
    }, ms);
    this.timers.add(t);
  }

  /* ---------- Actions ---------- */

  private regenerate(i: number) {
    const tile = this.tiles[i];
    if (!tile || statusOf(tile) === "pending" || !this.enabled.has("regenerate")) return;
    this.said = `Regenerating ${labelOf(tile, i)}`;
    this.emit<ImageGridTileEvent>("tc-regenerate", { tile, index: i });
  }

  private upscale(i: number) {
    const tile = this.tiles[i];
    if (!tile || statusOf(tile) !== "done" || tile.upscaled || !this.enabled.has("upscale")) return;
    this.said = `Upscaling ${labelOf(tile, i)}`;
    this.emit<ImageGridTileEvent>("tc-upscale", { tile, index: i });
  }

  private download(i: number) {
    const tile = this.tiles[i];
    if (!tile?.src || statusOf(tile) !== "done" || !this.enabled.has("download")) return;
    if (!this.emit<ImageGridTileEvent>("tc-download", { tile, index: i }, { cancelable: true })) return;
    const name = tile.filename ?? `${slugify(this.heading)}-${i + 1}.${extOf(tile.src)}`;
    this.said = `Downloading ${labelOf(tile, i)}`;
    void saveImage(tile.src, name, (url) => {
      // Revoked once the download has started, or when the grid goes away
      this.urls.add(url);
      this.later(() => {
        URL.revokeObjectURL(url);
        this.urls.delete(url);
      }, 4000);
    });
  }

  /** Compare on a tile: picks it, or – with one picked – puts the two side by side */
  private toggleCompare(i: number) {
    const tile = this.tiles[i];
    if (!tile || statusOf(tile) !== "done" || !this.enabled.has("compare")) return;
    if (!this.picking || this.picking === tile.id) {
      this.picking = this.picking === tile.id ? null : tile.id;
      this.said = this.picking ? `${labelOf(tile, i)} picked. Pick a second image to compare` : "Comparison cancelled";
      return;
    }
    const first = this.picking;
    this.picking = null;
    this.requestCompare([first, tile.id]);
  }

  private requestCompare(next: [string, string] | null) {
    if (!this.emit<ImageGridCompareChange>("tc-compare-change", { compare: next }, { cancelable: true })) return;
    this.compare = next;
    if (next) {
      const [a, b] = next.map((id) => this.tiles.findIndex((t) => t.id === id));
      this.said = `Comparing ${labelOf(this.tiles[a], a)} and ${labelOf(this.tiles[b], b)}`;
    } else this.said = "Back to the grid";
  }

  private requestSplit(value: number) {
    const next = Math.round(clamp(value, 0, 100) * 10) / 10;
    if (next === this.split) return;
    if (this.emit<ImageGridSplitChange>("tc-split-change", { split: next }, { cancelable: true })) this.split = next;
  }

  /* ---------- Alt text ---------- */

  private startEdit(i: number, from: "cell" | "button") {
    const tile = this.tiles[i];
    if (!tile) return;
    this.active = i;
    this.editing = tile.id;
    this.draft = tile.alt;
    this.invalid = false;
    this.editFrom = from;
    this.focusNext = `#${this.uid}-alt`;
  }

  private endEdit(save: boolean, refocus = true) {
    const id = this.editing;
    if (!id) return;
    const i = this.tiles.findIndex((t) => t.id === id);
    const text = this.draft.trim();
    if (save && !text) {
      this.invalid = true;
      this.said = "Alt text can't be empty";
      return;
    }
    this.editing = null;
    this.invalid = false;
    if (refocus) this.focusNext = this.editFrom === "cell" ? `.ui-igrid__tile[data-index="${i}"]` : `[data-focus-key="alt:${CSS.escape(id)}"]`;
    if (!save || i < 0 || text === this.tiles[i].alt) return;
    const tiles = this.tiles.map((t) => (t.id === id ? { ...t, alt: text } : t));
    this.said = `Alt text saved for ${labelOf(this.tiles[i], i)}`;
    if (this.emit<ImageGridTilesChange>("tc-tiles-change", { tiles }, { cancelable: true })) this.tiles = tiles;
  }

  private onAltKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      this.endEdit(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.endEdit(false);
    }
  }

  /* ---------- Grid keyboard ---------- */

  /** The controls inside a tile, in order */
  private widgets(cell: HTMLElement) {
    return [...cell.querySelectorAll<HTMLElement>("button, input")].filter((w) => !w.closest("[hidden]"));
  }

  private onGridFocusIn = (e: FocusEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>(".ui-igrid__tile");
    if (cell) this.active = Number(cell.dataset.index);
  };

  private onGridKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const cell = target.closest<HTMLElement>(".ui-igrid__tile");
    if (!cell) return;
    const i = Number(cell.dataset.index);
    if (target !== cell) {
      // Inside a tile: Tab cycles its controls, Escape goes back to the tile
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        cell.focus();
      } else if (e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const list = this.widgets(cell);
        const at = list.indexOf(target);
        if (list.length > 1 || at < 0) {
          e.preventDefault();
          list[(at + (e.shiftKey ? -1 : 1) + list.length) % list.length]?.focus();
        }
      }
      return;
    }
    const n = this.tiles.length;
    const cols = this.cols;
    const col = i % cols;
    const mod = e.ctrlKey || e.metaKey;
    let to: number | null = null;
    switch (e.key) {
      case "ArrowRight":
        to = col < cols - 1 && i + 1 < n ? i + 1 : i;
        break;
      case "ArrowLeft":
        to = col > 0 ? i - 1 : i;
        break;
      case "ArrowDown":
        to = i + cols < n ? i + cols : i;
        break;
      case "ArrowUp":
        to = i - cols >= 0 ? i - cols : i;
        break;
      case "Home":
        to = mod ? 0 : i - col;
        break;
      case "End":
        to = mod ? n - 1 : Math.min(n - 1, i - col + cols - 1);
        break;
      case "Enter":
        e.preventDefault();
        this.widgets(cell)[0]?.focus();
        return;
      case "F2":
        e.preventDefault();
        this.startEdit(i, "cell");
        return;
    }
    if (to !== null) {
      e.preventDefault();
      this.active = to;
      this.cellAt(to)?.focus();
      return;
    }
    if (e.altKey || mod || e.shiftKey) return;
    const shortcut: Record<string, (i: number) => void> = { r: (x) => this.regenerate(x), u: (x) => this.upscale(x), c: (x) => this.toggleCompare(x), d: (x) => this.download(x) };
    const run = shortcut[e.key.toLowerCase()];
    if (run) {
      e.preventDefault();
      run(i);
    }
  };

  /* ---------- Compare divider ---------- */

  private splitFrom(e: PointerEvent, stage: HTMLElement) {
    const box = stage.getBoundingClientRect();
    if (box.width > 0) this.requestSplit(((e.clientX - box.left) / box.width) * 100);
  }

  private onStageDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const stage = e.currentTarget as HTMLElement;
    e.preventDefault();
    this.drag = e.pointerId;
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {
      // A synthetic or already-released pointer: the drag still follows moves over the stage
    }
    stage.dataset.dragging = "";
    this.splitFrom(e, stage);
    this.querySelector<HTMLElement>(".ui-igrid__handle")?.focus({ preventScroll: true });
  };
  private onStageMove = (e: PointerEvent) => {
    if (this.drag !== e.pointerId) return;
    this.splitFrom(e, e.currentTarget as HTMLElement);
  };
  private onStageUp = (e: PointerEvent) => {
    if (this.drag !== e.pointerId) return;
    this.drag = null;
    delete (e.currentTarget as HTMLElement).dataset.dragging;
  };

  private onHandleKey = (e: KeyboardEvent) => {
    const big = e.shiftKey ? 10 : 1;
    const steps: Record<string, number> = { ArrowLeft: -big, ArrowDown: -big, ArrowRight: big, ArrowUp: big, PageDown: -10, PageUp: 10 };
    if (e.key in steps) {
      e.preventDefault();
      this.requestSplit(Math.round(this.split) + steps[e.key]);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      this.requestSplit(e.key === "Home" ? 0 : 100);
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.requestCompare(null);
    }
  };

  /* ---------- Render ---------- */

  private button(opts: { cls?: string; label: string; icon: string; key: string; disabled?: boolean; pressed?: boolean; shortcut?: string; run: () => void }) {
    return html`<button
      type="button"
      class=${["ui-igrid__btn", opts.cls].filter(Boolean).join(" ")}
      tabindex="-1"
      aria-label=${opts.label}
      title=${opts.label}
      aria-disabled=${ifDefined(opts.disabled ? "true" : undefined)}
      aria-pressed=${ifDefined(opts.pressed === undefined ? undefined : opts.pressed ? "true" : "false")}
      aria-keyshortcuts=${ifDefined(opts.shortcut)}
      data-focus-key=${opts.key}
      @click=${() => !opts.disabled && opts.run()}
    >${glyph(opts.icon)}</button>`;
  }

  private renderMedia(t: ImageGridTile, i: number, label: string): TemplateResult {
    const status = statusOf(t);
    if (status === "pending") {
      const known = typeof t.progress === "number";
      return html`<div class="ui-igrid__media ui-igrid__pending">
        <div class="ui-igrid__state">
          ${glyph(icons.sparkle, "ui-igrid__spark")}
          <span class="ui-igrid__state-text">${t.activity ?? "Generating"}${known ? html` <span class="ui-igrid__pct">${percent(t.progress!)}</span>` : nothing}</span>
        </div>
        <div
          class="ui-igrid__bar"
          role="progressbar"
          aria-label=${`${label} ${(t.activity ?? "Generating").toLowerCase()}`}
          aria-valuemin=${ifDefined(known ? "0" : undefined)}
          aria-valuemax=${ifDefined(known ? "100" : undefined)}
          aria-valuenow=${ifDefined(known ? Math.round(clamp(t.progress!, 0, 1) * 100) : undefined)}
          ?data-indeterminate=${!known}
        ><span style=${styleMap({ transform: `scaleX(${known ? clamp(t.progress!, 0, 1) : 0.3})` })}></span></div>
      </div>`;
    }
    if (status === "failed") {
      return html`<div class="ui-igrid__media ui-igrid__failed">
        <div class="ui-igrid__state">
          ${glyph(icons.alert, "ui-igrid__warn")}
          <span class="ui-igrid__state-text">${t.error ?? "Couldn't generate this one"}</span>
          ${this.enabled.has("regenerate")
            ? html`<button type="button" class="ui-igrid__retry" tabindex="-1" data-focus-key=${`retry:${t.id}`} @click=${() => this.regenerate(i)}>${glyph(icons.regenerate)}Try again</button>`
            : nothing}
        </div>
      </div>`;
    }
    return html`<div class="ui-igrid__media">
      ${t.src ? keyed(t.src, html`<img class="ui-igrid__img" src=${t.src} alt=${t.alt} draggable="false" decoding="async" />`) : nothing}
      <span class="ui-igrid__chips" aria-hidden="true"
        ><span class="ui-igrid__chip" data-text=${i + 1}></span>${t.upscaled ? html`<span class="ui-igrid__chip ui-igrid__chip-hd" data-text="Upscaled">${glyph(icons.hd)}</span>` : nothing}</span
      >
    </div>`;
  }

  private renderTools(t: ImageGridTile, i: number, label: string) {
    if (statusOf(t) !== "done") return nothing;
    const on = this.enabled;
    const picked = this.picking === t.id;
    const other = this.picking && !picked ? this.tiles.findIndex((x) => x.id === this.picking) : -1;
    return html`<div class="ui-igrid__tools">
      ${on.has("regenerate") ? this.button({ label: `Regenerate ${label}`, icon: icons.regenerate, key: `regen:${t.id}`, shortcut: "R", run: () => this.regenerate(i) }) : nothing}
      ${on.has("upscale") ? this.button({ label: t.upscaled ? `${label} is upscaled` : `Upscale ${label}`, icon: icons.upscale, key: `up:${t.id}`, disabled: !!t.upscaled, shortcut: "U", run: () => this.upscale(i) }) : nothing}
      ${on.has("compare")
        ? this.button({
            label: other >= 0 ? `Compare ${label} with ${labelOf(this.tiles[other], other)}` : `Compare ${label}`,
            icon: icons.compare,
            key: `cmp:${t.id}`,
            pressed: picked,
            shortcut: "C",
            run: () => this.toggleCompare(i),
          })
        : nothing}
      ${on.has("download") ? this.button({ label: `Download ${label}`, icon: icons.download, key: `dl:${t.id}`, shortcut: "D", run: () => this.download(i) }) : nothing}
    </div>`;
  }

  private renderAlt(t: ImageGridTile, i: number, label: string) {
    // No image yet, nothing to describe: the line keeps its place so the row stays even
    if (statusOf(t) !== "done") return html`<div class="ui-igrid__alt" aria-hidden="true"><span class="ui-igrid__alt-wait"></span></div>`;
    if (this.editing === t.id) {
      return html`<div class="ui-igrid__alt" data-editing>
        <input
          id=${`${this.uid}-alt`}
          class="ui-igrid__alt-input"
          tabindex="-1"
          .value=${live(this.draft)}
          aria-label=${`Alt text for ${label}`}
          aria-invalid=${this.invalid ? "true" : "false"}
          aria-describedby=${`${this.uid}-alt-help`}
          placeholder=${this.invalid ? "Alt text is required" : "Describe the image"}
          maxlength="250"
          @input=${(e: Event) => {
            this.draft = (e.target as HTMLInputElement).value;
            if (this.draft.trim()) this.invalid = false;
          }}
          @keydown=${this.onAltKey}
          @blur=${() => {
            // Leaving the field keeps what was typed; an empty field goes back to the old text
            if (this.editing === t.id) this.endEdit(!!this.draft.trim(), false);
          }}
        /><span id=${`${this.uid}-alt-help`} class="ui-igrid__sr">${this.invalid ? "Alt text is required. " : ""}Enter saves, Escape cancels</span>
      </div>`;
    }
    const missing = !t.alt.trim();
    return html`<div class="ui-igrid__alt">
      <span class="ui-igrid__alt-tag" aria-hidden="true" data-text="Alt"></span>
      <span class="ui-igrid__alt-text" ?data-missing=${missing} title=${ifDefined(missing ? undefined : t.alt)}
        >${missing ? html`${glyph(icons.alert)}No alt text` : t.alt}</span
      >
      ${this.button({ cls: "ui-igrid__edit", label: missing ? `Add alt text for ${label}` : `Edit alt text for ${label}`, icon: icons.edit, key: `alt:${t.id}`, shortcut: "F2", run: () => this.startEdit(i, "button") })}
    </div>`;
  }

  private renderTile(t: ImageGridTile, i: number) {
    const label = labelOf(t, i);
    const status = statusOf(t);
    const what =
      status === "pending"
        ? `${t.activity ?? "Generating"}${typeof t.progress === "number" ? ` ${percent(t.progress)}` : ""}`
        : status === "failed"
          ? `${t.error ?? "Couldn't generate this one"}${this.enabled.has("regenerate") ? ", Try again" : ""}`
          : t.alt.trim()
            ? `${t.alt}${t.upscaled ? ", upscaled" : ""}`
            : "No alt text";
    return html`<div
      class="ui-igrid__tile"
      role="gridcell"
      tabindex=${i === this.active ? 0 : -1}
      data-index=${i}
      data-id=${t.id}
      data-status=${status}
      ?data-picked=${this.picking === t.id}
      aria-label=${`${label}: ${what}`}
      aria-describedby=${`${this.uid}-keys`}
    >
      ${this.renderMedia(t, i, label)} ${this.renderTools(t, i, label)} ${this.renderAlt(t, i, label)}
    </div>`;
  }

  private renderGrid(): TemplateResult {
    const tiles = this.tiles;
    if (!tiles.length) return html`<div class="ui-igrid__empty">${glyph(icons.sparkle)}<span>No images yet</span></div>`;
    const cols = this.cols;
    const rows: number[][] = [];
    tiles.forEach((_, i) => (i % cols ? rows[rows.length - 1].push(i) : rows.push([i])));
    return html`<div
      class="ui-igrid__grid"
      role="grid"
      aria-labelledby=${`${this.uid}-title`}
      aria-describedby=${ifDefined(this.prompt ? `${this.uid}-prompt` : undefined)}
      aria-rowcount=${rows.length}
      aria-colcount=${cols}
      style=${styleMap({ "--tc-image-grid-cols": String(cols), "--tc-image-grid-ratio": String(this.ratio > 0 ? this.ratio : 1) })}
      @keydown=${this.onGridKey}
      @focusin=${this.onGridFocusIn}
    >
      ${rows.map(
        (row) => html`<div class="ui-igrid__row" role="row">
          ${repeat(
            row,
            (i) => tiles[i].id,
            (i) => this.renderTile(tiles[i], i),
          )}
        </div>`,
      )}
    </div>`;
  }

  private renderCompare([a, b]: [ImageGridTile, ImageGridTile]): TemplateResult {
    const ia = this.tiles.indexOf(a);
    const ib = this.tiles.indexOf(b);
    const la = labelOf(a, ia);
    const lb = labelOf(b, ib);
    const split = clamp(this.split, 0, 100);
    const shown = Math.round(split);
    return html`<div class="ui-igrid__compare" role="group" aria-label=${`Compare ${la} and ${lb}`}>
      <div
        class="ui-igrid__stage"
        style=${styleMap({ "--tc-image-grid-split": `${split}%`, "--tc-image-grid-ratio": String(this.ratio > 0 ? this.ratio : 1) })}
        @pointerdown=${this.onStageDown}
        @pointermove=${this.onStageMove}
        @pointerup=${this.onStageUp}
        @pointercancel=${this.onStageUp}
      >
        <img class="ui-igrid__cmp-img" src=${a.src!} alt=${a.alt} draggable="false" />
        <div class="ui-igrid__cmp-after"><img class="ui-igrid__cmp-img" src=${b.src!} alt=${b.alt} draggable="false" /></div>
        <span class="ui-igrid__cmp-tag" data-side="left" aria-hidden="true">${la}</span>
        <span class="ui-igrid__cmp-tag" data-side="right" aria-hidden="true">${lb}</span>
        <div class="ui-igrid__divider">
          <div
            class="ui-igrid__handle"
            role="slider"
            tabindex="0"
            aria-label="Compare divider"
            aria-orientation="horizontal"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow=${shown}
            aria-valuetext=${`${shown}% ${la}, ${100 - shown}% ${lb}`}
            @keydown=${this.onHandleKey}
          >${glyph(icons.grip)}</div>
        </div>
      </div>
    </div>`;
  }

  private renderFoot(pair: [ImageGridTile, ImageGridTile] | null): TemplateResult {
    const tiles = this.tiles;
    let text: TemplateResult;
    let actions: TemplateResult | typeof nothing = nothing;
    if (pair) {
      const [a, b] = pair;
      text = html`<span class="ui-igrid__summary">${glyph(icons.compare, "ui-igrid__muted")}<span class="ui-igrid__clip">Comparing ${labelOf(a, tiles.indexOf(a))} and ${labelOf(b, tiles.indexOf(b))}</span></span>`;
      actions = html`<button type="button" class="ui-igrid__foot-btn" data-ghost @click=${() => this.requestCompare([b.id, a.id])}>Swap</button
        ><button type="button" class="ui-igrid__foot-btn ui-igrid__close" @click=${() => this.requestCompare(null)}>Done</button>`;
    } else if (this.picking) {
      const i = tiles.findIndex((t) => t.id === this.picking);
      text = html`<span class="ui-igrid__summary">${glyph(icons.compare, "ui-igrid__muted")}<span class="ui-igrid__clip">Pick a second image to compare with ${labelOf(tiles[i], i)}</span></span>`;
      actions = html`<button type="button" class="ui-igrid__foot-btn" data-ghost @click=${() => this.toggleCompare(i)}>Cancel</button>`;
    } else {
      const pending = tiles.filter((t) => statusOf(t) === "pending").length;
      const failed = tiles.filter((t) => statusOf(t) === "failed").length;
      const missing = tiles.filter((t) => statusOf(t) === "done" && !t.alt.trim()).length;
      const count = tiles.length === 1 ? "1 image" : `${tiles.length} images`;
      const main = pending
        ? html`<span class="ui-igrid__working">${glyph(icons.sparkle, "ui-igrid__spark")}Generating ${pending} of ${tiles.length}</span>`
        : tiles.length
          ? html`<span>${glyph(icons.check, "ui-igrid__ok")}${count}${failed ? ` · ${failed} failed` : ""}</span>`
          : html`<span>No images yet</span>`;
      text = html`<span class="ui-igrid__summary">${main}${missing
        ? html`<span class="ui-igrid__dot" aria-hidden="true">·</span><span class="ui-igrid__needs">${missing === 1 ? "1 needs alt text" : `${missing} need alt text`}</span>`
        : nothing}</span>`;
    }
    return html`<div class="ui-igrid__foot">${keyed(pair ? "compare" : this.picking ? "pick" : "grid", text)}<span class="ui-igrid__foot-actions">${actions}</span></div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const pair = this.pair;
    const head = html`<div class="ui-igrid__head">
      <div class="ui-igrid__title" id=${`${this.uid}-title`}>${this.heading}</div>
      ${this.prompt ? html`<div class="ui-igrid__prompt" id=${`${this.uid}-prompt`}>${this.prompt}</div>` : nothing}
    </div>`;
    const body = html`<div class="ui-igrid__body">${pair ? this.renderCompare(pair) : this.renderGrid()}</div>`;
    const foot = this.renderFoot(pair);
    return html`
      ${clean ? html`<div class="ui-igrid__card">${head}${body}${foot}</div>` : html`<div class="ui-igrid__card">${head}${body}</div>${foot}`}
      <span class="ui-igrid__sr" id=${`${this.uid}-keys`}>Enter for actions, F2 to edit alt text, R regenerate, U upscale, C compare, D download</span>
      <span class="ui-igrid__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="igrid"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="igrid"] {
  /* The empty and pending tiles: a faint well */
  --tc-image-grid-well: light-dark(#f4f4f5, #222225);
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 560px;
  min-width: 0;
  padding: var(--tc-space-1);
  border-radius: var(--tc-radius-3xl);
  background: var(--tc-surface-sunken);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="igrid"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="igrid"] {
  --tc-image-grid-well: var(--tc-fill-subtle);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 560px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="igrid"] *, [data-ui="igrid"] *::before, [data-ui="igrid"] *::after { box-sizing: border-box; }
:where([data-ui="igrid"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="igrid"]) svg { display: block; flex: none; }
[data-ui="igrid"] button:focus-visible, .ui-igrid__handle:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-igrid__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* Icons: 24px line glyphs drawn at 16px – thinner in Clean */
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
/* The white card */
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__card { min-width: 0; border-radius: var(--tc-radius-2xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* One white card – the edge is a shadow, not a border; the last row sits inside it */
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__card { min-width: 0; overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* ----- Heading and prompt ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__head { padding: var(--tc-space-3) var(--tc-space-3-5) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__head { padding: var(--tc-space-3) var(--tc-space-3) 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__title { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__title { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
.ui-igrid__prompt { display: -webkit-box; margin-top: var(--tc-space-0-5); overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
/* ----- The grid ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__body { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__body { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__grid { display: grid; gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__grid { display: grid; gap: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__row { display: grid; grid-template-columns: repeat(var(--tc-image-grid-cols, 2), minmax(0, 1fr)); gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__row { display: grid; grid-template-columns: repeat(var(--tc-image-grid-cols, 2), minmax(0, 1fr)); gap: var(--tc-space-2-5); }
.ui-igrid__tile { position: relative; min-width: 0; border-radius: var(--tc-radius-lg); outline: none; animation: ui-igrid-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-igrid__tile:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__tile { border-radius: var(--tc-radius-md); }
/* The image: the tile's ratio, rounded, with a hairline that keeps light images off the white card */
.ui-igrid__media { position: relative; display: grid; place-items: center; aspect-ratio: var(--tc-image-grid-ratio, 1); overflow: hidden; border-radius: inherit; background: var(--tc-image-grid-well); }
.ui-igrid__media::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px var(--tc-border-subtle); pointer-events: none; }
.ui-igrid__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; user-select: none; -webkit-user-drag: none; animation: ui-igrid-reveal var(--tc-duration-reveal) var(--tc-ease-decelerate) both; }
/* Picked for a comparison: a selected ring */
.ui-igrid__tile[data-picked] .ui-igrid__media { box-shadow: 0 0 0 2px var(--tc-border-selected); }
/* Number and Upscaled, bottom left */
.ui-igrid__chips { position: absolute; left: var(--tc-space-2); bottom: var(--tc-space-2); display: flex; gap: var(--tc-space-1); pointer-events: none; }
.ui-igrid__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: var(--tc-pill-h); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: color-mix(in srgb, var(--tc-surface-raised) 90%, transparent); box-shadow: var(--tc-shadow-control); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; color: var(--tc-text-primary); justify-content: center; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
.ui-igrid__chip::after, .ui-igrid__alt-tag::after { content: attr(data-text); content: attr(data-text) / ""; }
.ui-igrid__chip .ui-igrid__glyph { width: 12px; height: 12px; }
/* ----- Pending: a shimmer sweeps across while it generates ----- */
.ui-igrid__pending::before { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 25%, var(--tc-shimmer) 50%, transparent 75%); transform: translateX(-100%); animation: ui-igrid-sweep var(--tc-duration-shimmer) linear infinite; pointer-events: none; }
[data-ui="igrid"][data-offscreen] .ui-igrid__pending::before,
[data-ui="igrid"][data-offscreen] .ui-igrid__spark { animation-play-state: paused; }
.ui-igrid__state { position: relative; display: grid; justify-items: center; gap: var(--tc-space-1-5); max-width: 100%; padding: 0 var(--tc-space-3); text-align: center; }
.ui-igrid__state-text { display: flex; gap: var(--tc-space-1); justify-content: center; flex-wrap: wrap; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-igrid__pct { font-variant-numeric: tabular-nums; color: var(--tc-text-secondary); }
.ui-igrid__spark { color: var(--tc-icon-muted); animation: ui-igrid-twinkle var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__spark { color: var(--tc-text-secondary); }
/* The progress bar along the bottom edge */
.ui-igrid__bar { position: absolute; left: var(--tc-space-3); right: var(--tc-space-3); bottom: var(--tc-space-3); height: 3px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__bar { height: 2px; }
.ui-igrid__bar > span { position: absolute; inset: 0; border-radius: inherit; background: var(--tc-text-primary); transform-origin: left; transition: transform var(--tc-duration-base) linear; }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__bar > span { background: var(--tc-accent); }
.ui-igrid__bar[data-indeterminate] > span { animation: ui-igrid-slide var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
[data-ui="igrid"][data-offscreen] .ui-igrid__bar > span { animation-play-state: paused; }
/* ----- Failed ----- */
.ui-igrid__failed { background: color-mix(in srgb, var(--tc-status-danger-bg) 55%, var(--tc-image-grid-well)); }
.ui-igrid__failed .ui-igrid__state-text { color: var(--tc-status-danger-fg); }
.ui-igrid__warn { color: var(--tc-status-danger-fg); }
.ui-igrid__failed .ui-igrid__state { animation: ui-igrid-shake var(--tc-duration-slower) var(--tc-ease-standard) both; }
.ui-igrid__retry { display: inline-flex; align-items: center; white-space: nowrap; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); margin-top: var(--tc-space-1); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-igrid__retry:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-igrid__retry .ui-igrid__glyph { width: 14px; height: 14px; }
/* ----- The floating actions, top right: shown on hover and focus ----- */
.ui-igrid__tools { position: absolute; top: var(--tc-space-2); right: var(--tc-space-2); display: flex; max-width: calc(100% - var(--tc-space-2) * 2); gap: var(--tc-space-0-5); padding: var(--tc-space-0-5); border-radius: var(--tc-control-radius-md); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-raised); opacity: 0; transform: translateY(-2px); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-igrid__tile:hover .ui-igrid__tools,
.ui-igrid__tile:focus-within .ui-igrid__tools,
.ui-igrid__tile[data-picked] .ui-igrid__tools { opacity: 1; transform: none; }
.ui-igrid__btn { display: grid; place-items: center; flex: 0 1 auto; min-width: 0; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-igrid__btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-igrid__btn[aria-disabled="true"] { color: var(--tc-text-disabled); cursor: default; }
.ui-igrid__btn[aria-disabled="true"]:hover { background: none; }
.ui-igrid__btn[aria-pressed="true"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
/* ----- Alt text, under the image ----- */
.ui-igrid__alt { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: var(--tc-control-h-sm); margin-top: var(--tc-space-1-5); }
.ui-igrid__alt-tag { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-pill-h); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-igrid__alt-text { display: block; align-items: center; gap: var(--tc-space-1); flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__alt-text { color: var(--tc-text-muted); }
.ui-igrid__alt-text[data-missing] { display: flex; color: var(--tc-status-warning-fg); }
.ui-igrid__alt-text[data-missing] .ui-igrid__glyph { width: 14px; height: 14px; }
.ui-igrid__edit { flex: none; }
/* Pending and failed: a quiet placeholder where the alt text will be */
.ui-igrid__alt-wait { width: 55%; height: 8px; border-radius: var(--tc-radius-full); background: var(--tc-image-grid-well); }
.ui-igrid__alt-input { flex: 1; min-width: 0; height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); caret-color: var(--tc-accent); outline: none; animation: ui-igrid-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-igrid__alt-input::placeholder { color: var(--tc-text-placeholder); }
.ui-igrid__alt-input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-igrid__alt-input[aria-invalid="true"]::placeholder { color: var(--tc-status-danger-fg); }
/* ----- Empty ----- */
.ui-igrid__empty { display: grid; justify-items: center; gap: var(--tc-space-2); padding: var(--tc-space-8) var(--tc-space-4); border-radius: var(--tc-radius-lg); background: var(--tc-image-grid-well); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* ----- Compare: the second image wipes over the first up to the divider ----- */
.ui-igrid__compare { animation: ui-igrid-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-igrid__stage { position: relative; aspect-ratio: var(--tc-image-grid-ratio, 1); overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-image-grid-well); cursor: ew-resize; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__stage { border-radius: var(--tc-radius-md); }
.ui-igrid__cmp-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; -webkit-user-drag: none; }
.ui-igrid__cmp-after { position: absolute; inset: 0; clip-path: inset(0 0 0 var(--tc-image-grid-split, 50%)); }
.ui-igrid__cmp-tag { position: absolute; top: var(--tc-space-2); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: color-mix(in srgb, var(--tc-surface-raised) 90%, transparent); box-shadow: var(--tc-shadow-control); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-text-primary); white-space: nowrap; pointer-events: none; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
.ui-igrid__cmp-tag[data-side="left"] { left: var(--tc-space-2); }
.ui-igrid__cmp-tag[data-side="right"] { right: var(--tc-space-2); }
/* The divider sits on the images, not the page: white with a dark hairline in both themes */
.ui-igrid__divider { position: absolute; top: 0; bottom: 0; left: var(--tc-image-grid-split, 50%); width: 2px; transform: translateX(-50%); background: var(--tc-gray-0); box-shadow: 0 0 0 0.5px var(--tc-shadow-color-strong); }
.ui-igrid__handle { position: absolute; top: 50%; left: 50%; display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid transparent; border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-primary); cursor: ew-resize; transform: translate(-50%, -50%); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-igrid__stage[data-dragging] .ui-igrid__handle { transform: translate(-50%, -50%) scale(1.08); }
/* ----- The tray below the card (Standard) / the card's last row (Clean) ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 40px; padding: 0 var(--tc-space-2) 0 var(--tc-space-3); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; margin-top: var(--tc-space-1); padding: 0 var(--tc-space-2) 0 var(--tc-space-3); border-top: 0.5px solid var(--tc-border-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-igrid__summary { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; animation: ui-igrid-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-igrid__summary > span { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-igrid__summary > .ui-igrid__clip { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-igrid__dot { color: var(--tc-text-disabled); }
.ui-igrid__needs { color: var(--tc-status-warning-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__ok { width: 14px; height: 14px; stroke-width: 2.2; }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__ok { color: var(--tc-status-success-fg); }
.ui-igrid__muted { color: var(--tc-icon-muted); }
.ui-igrid__working .ui-igrid__glyph { width: 14px; height: 14px; }
.ui-igrid__foot-actions { display: flex; flex: none; gap: var(--tc-space-1); }
.ui-igrid__foot-actions:empty { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__foot-btn { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); animation: ui-igrid-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__foot-btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__foot-btn[data-ghost] { background: none; box-shadow: none; color: var(--tc-action-ghost-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-igrid__foot-btn[data-ghost]:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__foot-btn { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); line-height: var(--tc-line-height-normal); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard); animation: ui-igrid-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__foot-btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__foot-btn[data-ghost] { background: none; box-shadow: none; color: var(--tc-action-ghost-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-igrid__foot-btn[data-ghost]:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
@keyframes ui-igrid-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-igrid-reveal { from { opacity: 0; filter: blur(12px); transform: scale(1.04); } to { opacity: 1; filter: none; transform: none; } }
@keyframes ui-igrid-sweep { to { transform: translateX(100%); } }
@keyframes ui-igrid-slide { from { transform: translateX(-100%) scaleX(0.3); } to { transform: translateX(340%) scaleX(0.3); } }
@keyframes ui-igrid-twinkle { 50% { opacity: 0.45; transform: scale(0.88) rotate(12deg); } }
@keyframes ui-igrid-shake { 20%, 60% { transform: translateX(-3px); } 40%, 80% { transform: translateX(3px); } }
/* Narrow (phones): the tile's actions stay small, the alt tag goes */
@container (max-width: 400px) {
  .ui-igrid__alt-tag { display: none; }
  /* The actions share the tile's width instead of running past its edge */
  .ui-igrid__tools { top: var(--tc-space-1-5); right: var(--tc-space-1-5); max-width: calc(100% - var(--tc-space-1-5) * 2); }
  .ui-igrid__state { padding: 0 var(--tc-space-2); }
  :where([data-look="standard"], [data-look="standard"] *).ui-igrid__head { padding: var(--tc-space-3) var(--tc-space-3) 0; }
  /* The summary wraps rather than clipping next to the buttons */
  .ui-igrid__foot { padding-top: var(--tc-space-1-5); padding-bottom: var(--tc-space-1-5); }
  .ui-igrid__summary, .ui-igrid__summary > span { white-space: normal; }
  .ui-igrid__summary > .ui-igrid__muted { display: none; }
}
/* Touch screens: the actions are always there */
@media (hover: none) and (pointer: coarse) {
  .ui-igrid__tools { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="igrid"] *, [data-ui="igrid"] *::before, [data-ui="igrid"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-image-grid")) customElements.define("tc-image-grid", TcImageGrid);

declare global {
  interface HTMLElementTagNameMap {
    "tc-image-grid": TcImageGrid;
  }
}
