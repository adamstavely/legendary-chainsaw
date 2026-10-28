import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-fingerprint-card> – a ten-print card: a row of five fingers for each hand, thumb to little finger, in the
 * ANSI/NIST finger positions (1 right thumb … 5 right little, 6 left thumb … 10 left little). Each finger is a tile
 * with a print – the page's image, or a stylised whorl, loop or arch the element draws – and its status: captured
 * with an NFIQ quality from 1 (best) to 5, poor quality, not captured, unable to print, or bandaged. Each status has
 * its own mark and words, never colour alone. The header counts the prints on file; a finger's detail – status,
 * quality, pattern, when and on what it was captured – opens below the card on Enter or click.
 *   · the tiles are a WAI-ARIA grid, a row per hand: arrows move between fingers, Home / End to the hand's thumb and
 *     little finger; Enter or Space opens a finger's detail, Escape closes it; Tab leaves the grid
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-fingerprint-card .prints=${[{ position: 1, status: "captured", quality: 2, pattern: "whorl" }, …]}></tc-fingerprint-card>
 */

/** A fingerprint: Lucide-style (ISC, lucide.dev) */
const printIcon = svg`<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"></path><path d="M14 13.12c0 2.38 0 6.38-1 8.88"></path><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"></path><path d="M2 12a10 10 0 0 1 18-6"></path><path d="M2 16h.01"></path><path d="M21.8 16c.2-2 .131-5.354 0-6"></path><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"></path><path d="M8.65 22c.21-.66.45-1.32.57-2"></path><path d="M9 6.8a6 6 0 0 1 9 5.2v2"></path>`;

/** ANSI/NIST finger positions: 1–5 right thumb to little, 6–10 left thumb to little */
export type FingerPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
/** captured: a usable print · poor: on file but low quality · missing: not captured yet · unable: can't be printed
 *  (amputated, scarred) · bandaged: temporarily can't be printed */
export type FingerStatus = "captured" | "poor" | "missing" | "unable" | "bandaged";
export type FingerPattern = "whorl" | "loop" | "arch";
export type FingerPrint = {
  position: FingerPosition;
  status: FingerStatus;
  /** NFIQ quality, 1 (excellent) to 5 (poor) */
  quality?: number;
  /** The ridge pattern, drawn on the tile and named in the detail; whorl when not given */
  pattern?: FingerPattern;
  /** When it was captured, epoch ms */
  captured?: number;
  /** What captured it, e.g. "Live-scan kiosk 3" */
  device?: string;
  /** The print's image URL, shown instead of the drawn pattern */
  image?: string;
  /** One line about the finger, e.g. "Bandaged on 12 May – recapture booked" */
  note?: string;
};

/** Details of the events */
export type FingerprintSelectedChange = { selected: FingerPosition | null; print?: FingerPrint };

const STATUSES: FingerStatus[] = ["captured", "poor", "missing", "unable", "bandaged"];
/** The statuses' names used when the page gives none */
export const defaultFingerStatusLabels: Record<FingerStatus, string> = {
  captured: "Captured",
  poor: "Poor quality",
  missing: "Not captured",
  unable: "Unable to print",
  bandaged: "Bandaged",
};
const FINGERS = ["thumb", "index", "middle", "ring", "little"];
const QUALITY = ["Excellent", "Very good", "Good", "Fair", "Poor"];
const fingerName = (p: number) => `${p <= 5 ? "Right" : "Left"} ${FINGERS[(p - 1) % 5]}`;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
let uidCount = 0;

/* ---------- The drawn prints: original stylised ridges inside a fingertip ---------- */

const TIP = "M7 22C7 10.5 13 4 20 4s13 6.5 13 18v17c0 5-4.5 7-13 7S7 44 7 39Z";
const RIDGES: Record<FingerPattern, string> = {
  // Rings around a core a little below the middle
  whorl: Array.from({ length: 8 }, (_, i) => {
    const rx = 2.4 + i * 2.6;
    const ry = 3 + i * 3.1;
    return `M${20 - rx} 25a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
  }).join(""),
  // Ridges that come in from the left, turn round a core and go back out the same side
  loop: Array.from({ length: 8 }, (_, i) => {
    const r = 2 + i * 2.5;
    return `M2 ${27 - r + 6}C10 ${27 - r} ${17 + r} ${27 - r * 1.15} ${17 + r} 27S10 ${27 + r * 0.9 + 4} 2 ${27 + r * 0.4 + 6}`;
  }).join(""),
  // Ridges that rise across the finger and fall away, highest in the middle
  arch: Array.from({ length: 12 }, (_, i) => {
    const y = 8 + i * 3.4;
    const lift = Math.max(0, 7 - Math.abs(i - 5) * 1.1);
    return `M0 ${y + 4}C12 ${y + 3} 14 ${y - lift} 20 ${y - lift}S28 ${y + 3} 40 ${y + 4}`;
  }).join(""),
};

/**
 * A ten-print card: each finger's print and status – captured with its NFIQ quality, poor, not captured, unable to
 * print or bandaged – the count on file, and a finger's detail on Enter or click.
 * @tag tc-fingerprint-card
 * @fires tc-selected-change - A finger's detail opened or closed ({ selected, print }: FingerprintSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcFingerprintCard extends TcElement {
  static override ui = "fpc";

  /** The heading, and the grid's name */
  @property() accessor heading = "Fingerprints";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The prints by finger position; a finger not listed is not captured */
  @property({ attribute: false }) accessor prints: FingerPrint[] = [];
  /** Which hand's row comes first */
  @property() accessor order: "right-first" | "left-first" = "right-first";
  /** The finger whose detail is open. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ type: Number }) accessor selected: FingerPosition | null = null;
  /** The statuses' names, merged over the defaults (Captured, Poor quality, Not captured, Unable to print, Bandaged) */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<FingerStatus, string>> = {};
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active: FingerPosition = 1;
  @state() private accessor announce = "";

  private uid = `tc-fpc-${++uidCount}`;

  constructor() {
    super();
    // Focus never drops to <body> when the detail's Close button it was on goes away
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]'));
  }

  /* ---------- The model ---------- */

  private label(s: FingerStatus) {
    return this.statusLabels[s] ?? defaultFingerStatusLabels[s];
  }
  private printOf(p: number): FingerPrint {
    return this.prints.find((x) => x.position === p) ?? { position: p as FingerPosition, status: "missing" };
  }
  /** The two rows of positions, in the order shown */
  private get rows(): FingerPosition[][] {
    const right: FingerPosition[] = [1, 2, 3, 4, 5];
    const left: FingerPosition[] = [6, 7, 8, 9, 10];
    return this.order === "left-first" ? [left, right] : [right, left];
  }
  /** A print on file: captured, or captured at poor quality */
  private onFile(p: FingerPrint) {
    return p.status === "captured" || p.status === "poor";
  }
  private quality(p: FingerPrint) {
    const q = p.quality === undefined ? undefined : Math.round(p.quality);
    return q !== undefined && q >= 1 && q <= 5 ? q : undefined;
  }
  private say(p: FingerPrint) {
    const q = this.quality(p);
    return `${this.label(p.status)}${q !== undefined && this.onFile(p) ? `, NFIQ ${q}` : ""}`;
  }

  private setSelected(next: FingerPosition | null) {
    if (next === this.selected) return;
    const print = next === null ? undefined : this.printOf(next);
    if (!this.emit<FingerprintSelectedChange>("tc-selected-change", { selected: next, print }, { cancelable: true })) return;
    this.selected = next;
    this.announce = next === null ? "Detail closed" : `${fingerName(next)}: ${this.say(print!)}`;
  }

  /* ---------- Keyboard: the grid ---------- */

  private focusFinger(p: FingerPosition) {
    this.active = p;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-finger="${p}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>("[data-finger]");
    if (!tile || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const p = Number(tile.dataset.finger) as FingerPosition;
    const rows = this.rows;
    const r = rows.findIndex((row) => row.includes(p));
    const c = rows[r].indexOf(p);
    const at = (rr: number, cc: number) => rows[Math.max(0, Math.min(1, rr))][Math.max(0, Math.min(4, cc))];
    const moves: Record<string, FingerPosition> = {
      ArrowLeft: at(r, c - 1),
      ArrowRight: at(r, c + 1),
      ArrowUp: at(r - 1, c),
      ArrowDown: at(r + 1, c),
      Home: at(r, 0),
      End: at(r, 4),
    };
    if (moves[e.key] !== undefined) {
      e.preventDefault();
      this.focusFinger(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(this.selected === p ? null : p);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.selected !== null && !(this.selected >= 1 && this.selected <= 10)) this.selected = null;
  }

  /* ---------- Rendering ---------- */

  private renderGlyph(p: FingerPrint) {
    const clip = `${this.uid}-clip-${p.position}`;
    const ridges = p.status === "missing" || p.status === "unable" ? nothing : svg`<path class="ui-fpc__ridges" d=${RIDGES[p.pattern ?? "whorl"]}></path>`;
    return html`<svg class="ui-fpc__glyph" viewBox="0 0 40 50" aria-hidden="true">
      <defs><clipPath id=${clip}><path d=${TIP}></path></clipPath></defs>
      ${p.image && this.onFile(p)
        ? svg`<image href=${p.image} x="7" y="4" width="26" height="42" preserveAspectRatio="xMidYMid slice" clip-path=${`url(#${clip})`}></image>`
        : svg`<g clip-path=${`url(#${clip})`}>${ridges}</g>`}
      <path class="ui-fpc__tip" d=${TIP}></path>
      ${p.status === "unable" ? svg`<path class="ui-fpc__slash" d="M9 44 31 6"></path>` : nothing}
      ${p.status === "bandaged" ? svg`<rect class="ui-fpc__band" x="5" y="22" width="30" height="9" rx="2"></rect><path class="ui-fpc__band-dots" d="M11 26.5h.01M16 26.5h.01M21 26.5h.01M26 26.5h.01M31 26.5h.01"></path>` : nothing}
    </svg>`;
  }

  /** A status's small mark: check, warning, dash, slash and band – Lucide-style (ISC, lucide.dev) */
  private mark(s: FingerStatus) {
    const body = {
      captured: svg`<path d="M20 6 9 17l-5-5"></path>`,
      poor: svg`<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"></path>`,
      missing: svg`<path d="M7 12h10"></path>`,
      unable: svg`<circle cx="12" cy="12" r="9"></circle><path d="m5.7 5.7 12.6 12.6"></path>`,
      bandaged: svg`<rect x="3" y="8" width="18" height="8" rx="2"></rect><path d="M10 12h.01M14 12h.01"></path>`,
    }[s];
    return html`<svg class="ui-fpc__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  private renderTile(pos: FingerPosition) {
    const p = this.printOf(pos);
    const q = this.quality(p);
    const isActive = this.active === pos;
    const isSel = this.selected === pos;
    return html`<div
      class="ui-fpc__tile"
      role="gridcell"
      data-finger=${pos}
      data-status=${p.status}
      tabindex=${isActive ? 0 : -1}
      aria-selected=${isSel ? "true" : "false"}
      aria-controls=${ifDefined(isSel ? `${this.uid}-detail` : undefined)}
      ?data-selected=${isSel}
      @focus=${() => {
        if (!isActive) this.active = pos;
      }}
      @pointerdown=${(e: PointerEvent) => {
        this.active = pos;
        if (e.pointerType === "mouse") e.preventDefault();
        (e.currentTarget as HTMLElement).focus({ preventScroll: true });
      }}
      @click=${() => {
        this.active = pos;
        this.setSelected(isSel ? null : pos);
      }}
    >
      <span class="ui-fpc__sr">${fingerName(pos)}, position ${pos}: ${this.say(p)}</span>
      <span class="ui-fpc__pos" aria-hidden="true">${pos}</span>
      ${this.renderGlyph(p)}
      <span class="ui-fpc__finger" aria-hidden="true">${cap(FINGERS[(pos - 1) % 5])}</span>
      <span class="ui-fpc__status" aria-hidden="true">
        ${this.mark(p.status)}
        ${p.status === "captured" && q !== undefined
          ? html`<span class="ui-fpc__nfiq">NFIQ ${q}</span><span class="ui-fpc__bars">${[1, 2, 3, 4, 5].map((b) => html`<span class="ui-fpc__bar" ?data-on=${b <= 6 - q}></span>`)}</span>`
          : html`<span class="ui-fpc__status-text">${this.label(p.status)}</span>`}
      </span>
    </div>`;
  }

  private renderDetail() {
    const pos = this.selected;
    if (pos === null) return nothing;
    const p = this.printOf(pos);
    const q = this.quality(p);
    const rows: [string, string][] = [];
    if (q !== undefined && this.onFile(p)) rows.push(["Quality", `NFIQ ${q} · ${QUALITY[q - 1]}`]);
    if (this.onFile(p) || p.status === "bandaged") rows.push(["Pattern", cap(p.pattern ?? "whorl")]);
    if (p.captured !== undefined) rows.push(["Captured", new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", year: "numeric" }).format(p.captured)]);
    if (p.device) rows.push(["Device", p.device]);
    const id = this.uid;
    return html`<section class="ui-fpc__detail" id=${`${id}-detail`} data-status=${p.status} aria-labelledby=${`${id}-detail-title`}>
      <div class="ui-fpc__detail-head">
        <span class="ui-fpc__detail-glyph" data-status=${p.status}>${this.renderGlyph(p)}</span>
        <div class="ui-fpc__detail-titles">
          <h4 class="ui-fpc__detail-title" id=${`${id}-detail-title`}>${fingerName(pos)}</h4>
          <span class="ui-fpc__detail-sub">Position ${pos}</span>
        </div>
        <span class="ui-fpc__pill" data-status=${p.status}>${this.mark(p.status)}${this.label(p.status)}</span>
        <button
          type="button"
          class="ui-fpc__close"
          aria-label="Close detail"
          @click=${() => {
            this.setSelected(null);
            this.focusFinger(pos);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
        </button>
      </div>
      ${rows.length ? html`<dl class="ui-fpc__facts">${rows.map(([k, v]) => html`<div class="ui-fpc__fact"><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>` : nothing}
      ${p.note ? html`<p class="ui-fpc__note">${p.note}</p>` : nothing}
    </section>`;
  }

  protected override render() {
    const id = this.uid;
    const prints = ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as FingerPosition[]).map((p) => this.printOf(p));
    const onFile = prints.filter((p) => this.onFile(p)).length;
    const used = STATUSES.filter((s) => s !== "captured" && prints.some((p) => p.status === s));
    return html`
      <span class="ui-fpc__sr" role="status">${this.announce}</span>
      <span class="ui-fpc__sr" id=${`${id}-keys`}>Arrow keys move between fingers; Enter opens a finger's detail</span>
      ${cardHead({
        icon: printIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: html`<span class="ui-fpc__count"><span class="ui-fpc__count-num">${onFile}/10</span><span class="ui-fpc__count-label">on file</span></span>`,
      })}
      <div class="ui-fpc__card">
        <div class="ui-fpc__grid" role="grid" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey}>
          ${this.rows.map(
            (row) => html`<div class="ui-fpc__row" role="row">
              <span class="ui-fpc__hand" role="rowheader">${row[0] <= 5 ? "Right hand" : "Left hand"}</span>
              ${row.map((p) => this.renderTile(p))}
            </div>`,
          )}
        </div>
        ${used.length
          ? html`<ul class="ui-fpc__legend" aria-label="Legend">
              ${used.map((s) => html`<li class="ui-fpc__legend-item" data-status=${s}>${this.mark(s)}${this.label(s)}<span class="ui-fpc__legend-count">${prints.filter((p) => p.status === s).length}</span></li>`)}
            </ul>`
          : nothing}
        ${this.renderDetail()}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fpc"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fpc"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="fpc"] *, [data-ui="fpc"] *::before, [data-ui="fpc"] *::after { box-sizing: border-box; }
:where([data-ui="fpc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="fpc"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="fpc"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="fpc"] h4, [data-ui="fpc"] p, [data-ui="fpc"] dl, [data-ui="fpc"] dd { margin: 0; }
[data-ui="fpc"] svg { display: block; flex: none; }
.ui-fpc__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fpc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's count ----- */
.ui-fpc__count { display: grid; flex: none; justify-items: end; }
.ui-fpc__count-num { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-fpc__count-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* ----- The hands: a caption, then five tiles ----- */
.ui-fpc__grid { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-fpc__grid { padding-top: var(--tc-space-2); }
.ui-fpc__row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--tc-space-2); }
.ui-fpc__hand { grid-column: 1 / -1; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
/* A finger: its position, the print, its name and status */
.ui-fpc__tile { position: relative; display: grid; justify-items: center; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-2) var(--tc-space-1) var(--tc-space-1-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); cursor: pointer; outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fpc__tile:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-fpc__tile:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-fpc__tile[data-selected] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1.5px var(--tc-border-selected); }
.ui-fpc__pos { position: absolute; top: var(--tc-space-1); left: var(--tc-space-1-5); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-fpc__glyph { width: 100%; max-width: 56px; height: auto; aspect-ratio: 4 / 5; }
.ui-fpc__tip { fill: none; stroke: var(--tc-border-strong); stroke-width: 1.2; }
.ui-fpc__ridges { fill: none; stroke: var(--tc-text-secondary); stroke-width: 1.05; stroke-linecap: round; }
[data-status="poor"] .ui-fpc__ridges { stroke: var(--tc-icon-muted); stroke-dasharray: 3 2.2; }
[data-status="missing"] .ui-fpc__tip, [data-status="unable"] .ui-fpc__tip { stroke-dasharray: 2.5 2.5; }
.ui-fpc__slash { stroke: var(--tc-status-danger-fg); stroke-width: 1.6; stroke-linecap: round; }
.ui-fpc__band { fill: var(--tc-status-warning-bg); stroke: var(--tc-status-warning-fg); stroke-width: 1; }
.ui-fpc__band-dots { stroke: var(--tc-status-warning-fg); stroke-width: 1.6; stroke-linecap: round; }
.ui-fpc__finger { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-fpc__finger { font-weight: var(--tc-font-weight-medium); }
.ui-fpc__status { display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--tc-space-0-5) var(--tc-space-1); min-height: 14px; font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: center; }
.ui-fpc__mark { width: 11px; height: 11px; }
[data-status="captured"] > .ui-fpc__status .ui-fpc__mark, .ui-fpc__legend-item[data-status="captured"] .ui-fpc__mark { color: var(--tc-status-success-fg); }
[data-status="poor"] > .ui-fpc__status, .ui-fpc__legend-item[data-status="poor"] .ui-fpc__mark { color: var(--tc-status-warning-fg); }
[data-status="unable"] > .ui-fpc__status, .ui-fpc__legend-item[data-status="unable"] .ui-fpc__mark { color: var(--tc-status-danger-fg); }
[data-status="bandaged"] > .ui-fpc__status, .ui-fpc__legend-item[data-status="bandaged"] .ui-fpc__mark { color: var(--tc-status-warning-fg); }
.ui-fpc__nfiq { font-variant-numeric: tabular-nums; }
/* NFIQ as five bars: 1 lights all five, 5 lights one */
.ui-fpc__bars { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); }
.ui-fpc__bar { display: block; width: 3px; height: 8px; border-radius: var(--tc-radius-2xs); background: var(--tc-meter-track); }
.ui-fpc__bar[data-on] { background: var(--tc-meter-fill); }
/* ----- The legend: statuses other than captured, with counts ----- */
.ui-fpc__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5) var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-4) !important; border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-fpc__legend-item { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-fpc__legend-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- A finger's detail ----- */
.ui-fpc__detail { display: grid; gap: var(--tc-space-2); margin: 0 var(--tc-space-3) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); animation: ui-fpc-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-fpc__detail-head { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; }
.ui-fpc__detail-glyph .ui-fpc__glyph { width: 28px; }
.ui-fpc__detail-titles { display: grid; flex: 1; min-width: 0; }
.ui-fpc__detail-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-fpc__detail-sub { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-fpc__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
.ui-fpc__pill[data-status="captured"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-fpc__pill[data-status="poor"], .ui-fpc__pill[data-status="bandaged"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-fpc__pill[data-status="unable"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-fpc__pill[data-status="missing"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-fpc__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin-right: calc(-1 * var(--tc-space-1-5)) !important; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fpc__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-fpc__facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--tc-space-2) var(--tc-space-4); }
.ui-fpc__fact { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-fpc__fact dt { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-fpc__fact dd { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-fpc__note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
@keyframes ui-fpc-in { from { opacity: 0; transform: translateY(3px); } }
@container (max-width: 420px) {
  .ui-fpc__grid { padding: var(--tc-space-3); }
  .ui-fpc__row { gap: var(--tc-space-1-5); }
  .ui-fpc__status-text, .ui-fpc__nfiq { display: none; }
  .ui-fpc__count-num { font-size: var(--tc-font-size-lg); }
}
@media (forced-colors: active) {
  .ui-fpc__tile { border: 1px solid CanvasText; }
  .ui-fpc__tile[data-selected] { outline: 2px solid Highlight; }
  .ui-fpc__bar[data-on] { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="fpc"] *, [data-ui="fpc"] *::before, [data-ui="fpc"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-fingerprint-card")) customElements.define("tc-fingerprint-card", TcFingerprintCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-fingerprint-card": TcFingerprintCard;
  }
}
