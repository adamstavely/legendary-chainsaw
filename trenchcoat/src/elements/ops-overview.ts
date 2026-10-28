import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { pick } from "./internal/util";

/*
 * <tc-ops-overview> – an operations overview in one dense strip: a title, a one-line status ("All operations active ·
 * 3 analysts on watch"), a health pill for the feeds or systems – Nominal, Degraded, Down – and a row of count tiles.
 * Each tile has its label and value, the change since the last period as a +/- badge, an optional sparkline and an
 * optional tone (danger for "Critical risk"). Whether a rise is good is the tile's call (`goodWhen`), so a badge is
 * green when things went the right way and red when they didn't, and says so in words. With `actionable` the tiles
 * are buttons that fire tc-action with their id.
 *   · actionable tiles are one tab stop: ← / → (and ↑ / ↓) move between them, Home / End to the ends
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-ops-overview heading="Command overview" status="All operations active" health="nominal"
 *     .tiles=${[{ id: "subjects", label: "Active cases", value: 12, change: 2 }]}></tc-ops-overview>
 */

/** A gauge: Lucide (ISC, lucide.dev) */
const gaugeIcon = svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`;

export type OpsHealth = "nominal" | "degraded" | "down";
export type OpsTone = "neutral" | "success" | "warning" | "danger";
export type OpsTile = {
  id: string;
  label: string;
  /** The count, or any short value ("94%") */
  value: number | string;
  /** One quiet line under the value: "tracked", "projects active" */
  sub?: string;
  /** The change since the last period, e.g. 2 or -1; 0 shows "no change" */
  change?: number;
  /** Which way is good: "up" (default), "down" (alerts, risks) or "none" (neither – the badge stays neutral) */
  goodWhen?: "up" | "down" | "none";
  /** Recent values, oldest first, drawn as a sparkline */
  trend?: number[];
  /** Tints the value: danger for "Critical risk" */
  tone?: OpsTone;
};

/** Details of the events */
export type OpsAction = { id: string; tile: OpsTile };

/** The health states' names used when the page gives none */
export const defaultOpsHealthLabels: Record<OpsHealth, string> = { nominal: "Feeds nominal", degraded: "Feeds degraded", down: "Feeds down" };

let uidCount = 0;

/* Health marks: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const HEALTH_MARK: Record<OpsHealth, () => ReturnType<typeof lucide>> = {
  nominal: () => lucide(11, svg`<circle cx="12" cy="12" r="5" fill="currentColor"></circle>`),
  degraded: () => lucide(11, svg`<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path>`),
  down: () => lucide(11, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`),
};
const upIcon = () => lucide(10, svg`<path d="m18 15-6-6-6 6"></path>`);
const downIcon = () => lucide(10, svg`<path d="m6 9 6 6 6-6"></path>`);

/** A sparkline path in a 64 × 20 box */
function sparkPath(values: number[]) {
  if (values.length < 2) return "";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  return values.map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * 62 + 1).toFixed(1)} ${(19 - ((v - lo) / span) * 18).toFixed(1)}`).join("");
}

/**
 * An operations overview strip – a status line, a health pill and count tiles, each with its change since the last
 * period in words and colour, an optional sparkline and tone, optionally actionable.
 * @tag tc-ops-overview
 * @fires tc-action - An actionable tile was pressed ({ id, tile }: OpsAction)
 */
export class TcOpsOverview extends TcElement {
  static override ui = "opo";

  /** The heading */
  @property() accessor heading = "Overview";
  /** The one-line status under the heading: "All operations active · 3 analysts on watch" */
  @property() accessor status: string | undefined = undefined;
  /** The feeds' or systems' health; unset hides the pill */
  @property() accessor health: OpsHealth | undefined = undefined;
  /** The health states' names, merged over the defaults (Feeds nominal, Feeds degraded, Feeds down) */
  @property({ attribute: false }) accessor healthLabels: Partial<Record<OpsHealth, string>> = {};
  /** The count tiles, in order */
  @property({ attribute: false }) accessor tiles: OpsTile[] = [];
  /** What a change is measured against, for screen readers and titles: "since last week" */
  @property({ attribute: "change-label" }) accessor changeLabel = "since last period";
  /** Makes the tiles buttons that fire tc-action */
  @property({ type: Boolean }) accessor actionable = false;
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active = 0;

  private uid = `tc-opo-${++uidCount}`;

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.active >= this.tiles.length) this.active = Math.max(0, this.tiles.length - 1);
  }

  private fmt(v: number | string) {
    return typeof v === "number" ? new Intl.NumberFormat(this.locale).format(v) : v;
  }
  /** The badge's tone and words for a change */
  private changeOf(t: OpsTile) {
    const c = t.change;
    if (c === undefined) return null;
    const n = new Intl.NumberFormat(this.locale).format(Math.abs(c));
    if (c === 0) return { tone: "neutral" as OpsTone, text: "0", words: `no change ${this.changeLabel}`, dir: 0 };
    const good = t.goodWhen ?? "up";
    const better = good === "none" ? null : (c > 0) === (good === "up");
    return {
      tone: (better === null ? "neutral" : better ? "success" : "danger") as OpsTone,
      text: `${c > 0 ? "+" : "−"}${n}`,
      words: `${c > 0 ? "up" : "down"} ${n} ${this.changeLabel}`,
      dir: Math.sign(c),
    };
  }

  private focusTile(i: number) {
    if (!this.tiles.length) return;
    this.active = Math.max(0, Math.min(this.tiles.length - 1, i));
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-tile-index="${this.active}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    if (!this.actionable || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const tile = (e.target as HTMLElement).closest<HTMLElement>("[data-tile-index]");
    if (!tile) return;
    const i = Number(tile.dataset.tileIndex);
    const moves: Record<string, number> = { ArrowLeft: i - 1, ArrowUp: i - 1, ArrowRight: i + 1, ArrowDown: i + 1, Home: 0, End: this.tiles.length - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    this.focusTile(moves[e.key]);
  };

  private renderTile(t: OpsTile, i: number) {
    const ch = this.changeOf(t);
    const path = t.trend ? sparkPath(t.trend) : "";
    const body = html`<span class="ui-opo__label">${t.label}</span>
      <span class="ui-opo__value-row">
        <span class="ui-opo__value" data-tone=${t.tone ?? "neutral"}>${this.fmt(t.value)}</span>
        ${ch
          ? html`<span class="ui-opo__change" data-tone=${ch.tone} title=${ch.words}
              >${ch.dir > 0 ? upIcon() : ch.dir < 0 ? downIcon() : nothing}<span aria-hidden="true">${ch.text}</span><span class="ui-opo__sr">${ch.words}</span></span
            >`
          : nothing}
      </span>
      ${t.sub ? html`<span class="ui-opo__sub">${t.sub}</span>` : nothing}
      ${path ? html`<svg class="ui-opo__spark" viewBox="0 0 64 20" preserveAspectRatio="none" aria-hidden="true"><path d=${path}></path></svg>` : nothing}`;
    return this.actionable
      ? html`<li class="ui-opo__item">
          <button
            type="button"
            class="ui-opo__tile"
            data-id=${t.id}
            data-tile-index=${i}
            data-tone=${t.tone ?? "neutral"}
            tabindex=${this.active === i ? 0 : -1}
            @focus=${() => (this.active = i)}
            @click=${() => this.emit<OpsAction>("tc-action", { id: t.id, tile: t })}
          >${body}</button>
        </li>`
      : html`<li class="ui-opo__item"><div class="ui-opo__tile" data-id=${t.id} data-tone=${t.tone ?? "neutral"}>${body}</div></li>`;
  }

  protected override render() {
    const id = this.uid;
    const label = this.health ? (this.healthLabels[this.health] ?? defaultOpsHealthLabels[this.health]) : "";
    return html`
      ${cardHead({
        icon: gaugeIcon,
        title: this.heading,
        subtitle: this.status,
        id: `${id}-title`,
        aside: this.health ? html`<span class="ui-opo__health" data-health=${this.health}>${pick(HEALTH_MARK, this.health, "degraded")()}${label}</span>` : nothing,
      })}
      <div class="ui-opo__card">
        ${this.tiles.length
          ? html`<ul class="ui-opo__tiles" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
              ${repeat(this.tiles, (t) => t.id, (t, i) => this.renderTile(t, i))}
            </ul>`
          : html`<p class="ui-opo__empty">Nothing to show yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="opo"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="opo"] {
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
[data-ui="opo"] *, [data-ui="opo"] *::before, [data-ui="opo"] *::after { box-sizing: border-box; }
:where([data-ui="opo"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="opo"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="opo"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="opo"] p { margin: 0; }
[data-ui="opo"] svg { display: block; flex: none; }
.ui-opo__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-opo__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The health pill ----- */
.ui-opo__health { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-opo__health[data-health="nominal"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-opo__health[data-health="degraded"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-opo__health[data-health="down"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* ----- The tiles: as many across as fit ----- */
.ui-opo__tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); }
.ui-opo__item { display: flex; min-width: 0; border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-opo__item:first-child { border-left: 0; }
.ui-opo__tile { position: relative; display: grid; align-content: start; gap: var(--tc-space-1); width: 100%; min-width: 0; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5) !important; }
button.ui-opo__tile { transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
button.ui-opo__tile:hover { background: var(--tc-fill-subtle); }
button.ui-opo__tile:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-opo__label { overflow: hidden; font-size: var(--tc-eyebrow-font-size); font-weight: var(--tc-eyebrow-font-weight); line-height: var(--tc-eyebrow-line-height); letter-spacing: var(--tc-eyebrow-tracking); text-transform: var(--tc-eyebrow-transform); color: var(--tc-eyebrow-color); text-overflow: ellipsis; white-space: nowrap; }
.ui-opo__value-row { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; }
.ui-opo__value { font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-opo__value[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-opo__value[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-opo__value[data-tone="success"] { color: var(--tc-status-success-fg); }
.ui-opo__change { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-opo__change[data-tone="success"] { color: var(--tc-status-success-fg); }
.ui-opo__change[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-opo__change[data-tone="neutral"] { color: var(--tc-text-muted); }
.ui-opo__sub { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-opo__spark { width: 100%; max-width: 96px; height: 20px; margin-top: var(--tc-space-0-5); overflow: visible; }
.ui-opo__spark path { fill: none; stroke: var(--tc-chart-1); stroke-width: 1.5px; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ui-opo__tile[data-tone="danger"] .ui-opo__spark path { stroke: var(--tc-status-danger-fg); }
.ui-opo__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* Narrow: two across, with lines between rows too */
@container (max-width: 420px) {
  .ui-opo__tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-opo__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
  .ui-opo__item:nth-child(-n + 2) { border-top: 0; }
  .ui-opo__item:nth-child(2n + 1) { border-left: 0; }
  .ui-opo__value { font-size: var(--tc-font-size-xl); }
}
@media (forced-colors: active) { .ui-opo__health { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="opo"] *, [data-ui="opo"] *::before, [data-ui="opo"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-ops-overview")) customElements.define("tc-ops-overview", TcOpsOverview);

declare global {
  interface HTMLElementTagNameMap {
    "tc-ops-overview": TcOpsOverview;
  }
}
