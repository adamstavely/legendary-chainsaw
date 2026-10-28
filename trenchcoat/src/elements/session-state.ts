import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-session-state> – "where are we?" for a long LLM session, in one compact header. A health pill sits beside the
 * title (Healthy, Drifting, At risk, Stalled), then a row of tiles – by default the primary goal, the open loops, the
 * artifacts still to come and how full the context is – and a row of status chips beneath ("Intent stable",
 * "2 files in context", "1 inferred assumption").
 *   · tiles come from `goal`, `loops`, `artifacts` and `pressure`, or the page gives its own `tiles`
 *   · a tile with a meter turns warning at `warn-at` (75%) and danger at `danger-at` (90%), said in words too
 *   · with `actionable`, tiles are buttons (← → Home End between them, one tab stop) that fire tc-action; a chip
 *     with `action` is a button too
 * It sits beside tc-session-context-bar (the session's declared terms) and tc-context-map / tc-context-window (what
 * fills the context): this one says where the work stands.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-session-state goal="Ship the onboarding flow" .loops=${["copy", "empty state"]} pressure="0.68"></tc-session-state>
 */

/** A compass: Lucide (ISC, lucide.dev) */
const compassIcon = svg`<circle cx="12" cy="12" r="10"></circle><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"></path>`;

export type SessionHealth = "healthy" | "drifting" | "at-risk" | "stalled";
export type SessionTone = "neutral" | "info" | "success" | "warning" | "danger" | "violet" | "teal";

export type SessionTile = {
  id: string;
  /** What the tile counts: "Open loops" */
  label: string;
  /** The big figure: a count, or text such as "68%" */
  value: number | string;
  /** One quiet line under the label: the goal, or the loops' names */
  detail?: string;
  /** A share from 0 to 1, drawn as a meter; its tone follows `warn-at` and `danger-at` unless `tone` is given */
  meter?: number;
  tone?: SessionTone;
};
export type SessionChip = {
  id: string;
  label: string;
  tone?: SessionTone;
  /** A button that fires tc-action, e.g. to list the files in context */
  action?: boolean;
};

/** Details of the events */
export type SessionAction = { id: string; kind: "tile" | "chip" };

/** The health names used when the page gives none */
export const defaultSessionHealthLabels: Record<SessionHealth, string> = { healthy: "Healthy", drifting: "Drifting", "at-risk": "At risk", stalled: "Stalled" };
const HEALTH_TONE: Record<SessionHealth, SessionTone> = { healthy: "success", drifting: "warning", "at-risk": "danger", stalled: "neutral" };

let uidCount = 0;

/* Health marks: check, wave, triangle, pause – colour is never the only cue */
const mark = (h: SessionHealth) => {
  const body = {
    healthy: svg`<path d="m4.5 8.5 2.5 2.5 4.5-5.5"></path>`,
    drifting: svg`<path d="M2.5 9c1.5-2 2.75-2 4 0s2.75 2 4 0 2.5-2 3 0"></path>`,
    "at-risk": svg`<path d="M8 3 14 13H2z"></path><path d="M8 7v2.5"></path>`,
    stalled: svg`<path d="M6 4.5v7"></path><path d="M10 4.5v7"></path>`,
  }[h];
  return html`<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
};

/**
 * Where a long LLM session stands: a health pill, tiles for the goal, open loops, pending artifacts and context
 * pressure, and status chips.
 * @tag tc-session-state
 * @fires tc-action - A tile or chip was pressed ({ id, kind }: SessionAction)
 */
export class TcSessionState extends TcElement {
  static override ui = "sst";

  /** The heading */
  @property() accessor heading = "Session state";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** How the session is going: healthy, drifting, at-risk or stalled; unset hides the pill */
  @property({ reflect: true }) accessor health: SessionHealth | undefined = undefined;
  /** The health names, merged over the defaults (Healthy, Drifting, At risk, Stalled) */
  @property({ attribute: false }) accessor healthLabels: Partial<Record<SessionHealth, string>> = {};
  /** The primary goal, for the default tiles */
  @property() accessor goal: string | undefined = undefined;
  /** The open loops' names, for the default tiles */
  @property({ attribute: false }) accessor loops: string[] = [];
  /** The artifacts still to come, for the default tiles */
  @property({ attribute: false }) accessor artifacts: string[] = [];
  /** How full the context is, from 0 to 1, for the default tiles; unset leaves the tile out */
  @property({ type: Number }) accessor pressure: number | undefined = undefined;
  /** The page's own tiles, in place of the defaults */
  @property({ attribute: false }) accessor tiles: SessionTile[] | undefined = undefined;
  /** The status chips under the tiles */
  @property({ attribute: false }) accessor chips: SessionChip[] = [];
  /** A meter at or above this share turns warning */
  @property({ type: Number, attribute: "warn-at" }) accessor warnAt = 0.75;
  /** A meter at or above this share turns danger */
  @property({ type: Number, attribute: "danger-at" }) accessor dangerAt = 0.9;
  /** Makes the tiles buttons that fire tc-action */
  @property({ type: Boolean }) accessor actionable = false;
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active = 0;

  private uid = `tc-sst-${++uidCount}`;

  /* ---------- The model ---------- */

  private get shownTiles(): SessionTile[] {
    if (this.tiles) return this.tiles;
    const out: SessionTile[] = [];
    out.push({ id: "goal", label: "Primary goal", value: this.goal ? 1 : 0, detail: this.goal });
    out.push({ id: "loops", label: "Open loops", value: this.loops.length, detail: this.loops.join(" · ") || undefined });
    out.push({ id: "artifacts", label: "Pending artifacts", value: this.artifacts.length, detail: this.artifacts.join(" + ") || undefined });
    if (this.pressure !== undefined && Number.isFinite(this.pressure)) {
      const p = Math.max(0, Math.min(1, this.pressure));
      out.push({ id: "pressure", label: "Context pressure", value: new Intl.NumberFormat(this.locale, { style: "percent" }).format(p), meter: p });
    }
    return out;
  }
  private meterTone(t: SessionTile): SessionTone {
    if (t.tone) return t.tone;
    const m = t.meter ?? 0;
    return m >= this.dangerAt ? "danger" : m >= this.warnAt ? "warning" : "info";
  }
  /** The meter's level in words, for screen readers and the title */
  private level(t: SessionTile) {
    const tone = this.meterTone(t);
    return tone === "danger" ? "critical" : tone === "warning" ? "high" : "comfortable";
  }
  private healthLabel(h: SessionHealth) {
    return this.healthLabels[h] ?? defaultSessionHealthLabels[h];
  }

  /* ---------- Actions ---------- */

  private fire(id: string, kind: SessionAction["kind"]) {
    this.emit<SessionAction>("tc-action", { id, kind });
  }

  private onTileKey = (e: KeyboardEvent) => {
    const n = this.shownTiles.length;
    if (!n || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const at = this.active;
    const to = { ArrowLeft: at - 1, ArrowUp: at - 1, ArrowRight: at + 1, ArrowDown: at + 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    this.active = Math.max(0, Math.min(n - 1, to));
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-tile="${this.active}"]`)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const n = this.shownTiles.length;
    if (this.active >= n) this.active = Math.max(0, n - 1);
  }

  /* ---------- Rendering ---------- */

  private renderTile(t: SessionTile, i: number) {
    const hasMeter = t.meter !== undefined;
    const tone = this.meterTone(t);
    const body = html`<span class="ui-sst__value">${t.value}</span>
      <span class="ui-sst__label">${t.label}</span>
      ${t.detail ? html`<span class="ui-sst__detail">${t.detail}</span>` : nothing}
      ${hasMeter
        ? html`<span class="ui-sst__meter" data-tone=${tone} aria-hidden="true"><span class="ui-sst__fill" style=${`inline-size: ${Math.round((t.meter ?? 0) * 100)}%`}></span></span>
            <span class="ui-sst__sr">, ${this.level(t)}</span>`
        : nothing}`;
    return this.actionable
      ? html`<li class="ui-sst__item"><button
          type="button"
          class="ui-sst__tile"
          data-tile=${i}
          data-id=${t.id}
          tabindex=${i === this.active ? 0 : -1}
          @focus=${() => (this.active = i)}
          @click=${() => {
            this.active = i;
            this.fire(t.id, "tile");
          }}
        >${body}</button></li>`
      : html`<li class="ui-sst__item"><div class="ui-sst__tile" data-id=${t.id}>${body}</div></li>`;
  }

  private renderChip(c: SessionChip) {
    const tone = c.tone ?? "neutral";
    return html`<li class="ui-sst__chip-item">${c.action
      ? html`<button type="button" class="ui-sst__chip" data-tone=${tone} data-id=${c.id} @click=${() => this.fire(c.id, "chip")}>${c.label}</button>`
      : html`<span class="ui-sst__chip" data-tone=${tone} data-id=${c.id}>${c.label}</span>`}</li>`;
  }

  protected override render() {
    const tiles = this.shownTiles;
    const h = this.health;
    return html`
      ${cardHead({
        icon: compassIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: h ? html`<span class="ui-sst__health" data-tone=${HEALTH_TONE[h]} data-health=${h}>${mark(h)}${this.healthLabel(h)}</span>` : nothing,
      })}
      <div class="ui-sst__card">
        ${tiles.length
          ? html`<ul class="ui-sst__tiles" aria-labelledby=${`${this.uid}-title`} @keydown=${this.actionable ? this.onTileKey : undefined}>
              ${tiles.map((t, i) => this.renderTile(t, i))}
            </ul>`
          : nothing}
        ${this.chips.length ? html`<ul class="ui-sst__chips" aria-label="Status">${this.chips.map((c) => this.renderChip(c))}</ul>` : nothing}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sst"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sst"] {
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
[data-ui="sst"] *, [data-ui="sst"] *::before, [data-ui="sst"] *::after { box-sizing: border-box; }
:where([data-ui="sst"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="sst"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="sst"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="sst"] svg { display: block; flex: none; }
.ui-sst__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sst__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The health pill: a tint, a mark and a word ----- */
.ui-sst__health { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
/* ----- The tiles ----- */
.ui-sst__tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-sst__tiles { padding-top: var(--tc-space-2); }
.ui-sst__item { display: grid; min-width: 0; }
.ui-sst__tile { display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-sst__tile { border-radius: var(--tc-radius-md); background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
button.ui-sst__tile { transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
button.ui-sst__tile:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-sst__value { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-sst__label { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-sst__detail { display: -webkit-box; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow-wrap: anywhere; }
.ui-sst__meter { display: block; height: var(--tc-meter-h); margin-top: var(--tc-space-1-5); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-sst__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-sst__meter[data-tone="warning"] .ui-sst__fill { background: var(--tc-status-warning-solid); }
.ui-sst__meter[data-tone="danger"] .ui-sst__fill { background: var(--tc-status-danger-solid); }
/* ----- The chips ----- */
.ui-sst__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); margin: 0 var(--tc-space-4) !important; padding: var(--tc-space-3) 0 var(--tc-space-4) !important; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-sst__tiles + .ui-sst__chips { padding-top: var(--tc-space-3) !important; }
.ui-sst__chip { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
button.ui-sst__chip { box-shadow: inset 0 0 0 var(--tc-hairline) currentColor; }
/* Tones shared by the pill and the chips */
:is(.ui-sst__health, .ui-sst__chip)[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
:is(.ui-sst__health, .ui-sst__chip)[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
:is(.ui-sst__health, .ui-sst__chip)[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:is(.ui-sst__health, .ui-sst__chip)[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
:is(.ui-sst__health, .ui-sst__chip)[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:is(.ui-sst__health, .ui-sst__chip)[data-tone="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
:is(.ui-sst__health, .ui-sst__chip)[data-tone="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
/* Narrow: two by two, then one column */
@container (max-width: 640px) {
  .ui-sst__tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container (max-width: 360px) {
  .ui-sst__tiles { grid-template-columns: minmax(0, 1fr); padding: var(--tc-space-3); }
  .ui-sst__chips { margin: 0 var(--tc-space-3) !important; }
}
@media (forced-colors: active) {
  .ui-sst__tile, .ui-sst__chip, .ui-sst__health { border: 1px solid CanvasText; }
  .ui-sst__fill { background: CanvasText !important; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="sst"] *, [data-ui="sst"] *::before, [data-ui="sst"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-session-state")) customElements.define("tc-session-state", TcSessionState);

declare global {
  interface HTMLElementTagNameMap {
    "tc-session-state": TcSessionState;
  }
}
