import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";

/*
 * <tc-gap-exposure> – the gaps or risks across a portfolio and whether anyone is working on them. Each gap has a
 * severity (Critical, High, Medium or Low – in words and a mark, never colour alone), what's missing, the item it
 * belongs to with its priority, its coverage ("No work" or "2 in work"), the owner's initials and what's invested
 * ("$900K · 1.2 FTE invested"). The header counts what's open, what's uncovered and the exposure: the severe gaps with
 * nothing in work, which also get a panel of their own at the top. The list groups by priority or by severity and can
 * show only the uncovered gaps.
 *   · each list is one tab stop: ↑ / ↓ move between rows, Home / End to the ends; Enter or a click fires tc-open
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-gap-exposure .gaps=${[{ id: "g1", text: "No benchmark suite.", severity: "high", item: "Neuromorphic Computing", priority: 1, work: 0 }]}></tc-gap-exposure>
 */

/** A shield with an alert mark: Lucide (ISC, lucide.dev) */
const shieldIcon = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path>`;
const chevron = html`<svg class="ui-gexp__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>`;

export type GapSeverity = "critical" | "high" | "medium" | "low";
export type ExposureGap = {
  id: string;
  /** What's missing, in a sentence */
  text: string;
  severity: GapSeverity;
  /** The topic or project it belongs to */
  item?: string;
  /** That item's priority tier, from 1 (the top); named by `tiers` */
  priority?: number;
  /** How many pieces of work are on it; 0 or unset means none – uncovered */
  work?: number;
  /** Who owns it, as a name (shown as initials) */
  owner?: string;
  /** Money invested so far, in `currency` */
  budget?: number;
  /** People invested, in full-time equivalents */
  fte?: number;
};
export type GapGroupBy = "priority" | "severity";

/** Details of the events */
export type GapOpen = { id: string; gap: ExposureGap };
export type GapGroupChange = { groupBy: GapGroupBy };
export type GapFilterChange = { uncoveredOnly: boolean };

export const GAP_SEVERITIES: GapSeverity[] = ["critical", "high", "medium", "low"];
/** The severities' names used when the page gives none */
export const defaultGapSeverityLabels: Record<GapSeverity, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
/** The priority tiers' names used when the page gives none */
export const defaultGapTiers: Record<number, string> = { 1: "Top priority", 2: "High", 3: "Medium", 4: "Watching" };
let uidCount = 0;

/* A mark per severity, so it never rests on colour: a filled diamond, a triangle, a circle, a dash */
const MARK: Record<GapSeverity, ReturnType<typeof svg>> = {
  critical: svg`<path d="M6 1 11 6 6 11 1 6Z" fill="currentColor"></path>`,
  high: svg`<path d="M6 1.5 11 10.5H1Z" fill="currentColor"></path>`,
  medium: svg`<circle cx="6" cy="6" r="4" fill="currentColor"></circle>`,
  low: svg`<path d="M2 6h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>`,
};

/**
 * Gaps or risks and whether anyone is working on them – severity, the item and its priority, coverage, owner and
 * what's invested – with the severe uncovered ones called out, groups by priority or severity, and an uncovered-only
 * filter.
 * @tag tc-gap-exposure
 * @fires tc-open - A gap was opened with Enter or a click ({ id, gap }: GapOpen)
 * @fires tc-group-change - Grouping by priority or severity was chosen ({ groupBy }: GapGroupChange); cancelable – prevented, `group-by` stays as it was
 * @fires tc-filter-change - "Uncovered only" was turned on or off ({ uncoveredOnly }: GapFilterChange); cancelable – prevented, `uncovered-only` stays as it was
 */
export class TcGapExposure extends TcElement {
  static override ui = "gexp";

  /** The heading, and the list's name */
  @property() accessor heading = "Gaps & coverage";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The gaps, in the order to show them within a group */
  @property({ attribute: false }) accessor gaps: ExposureGap[] = [];
  /** Groups the list by the item's priority or by severity. Changed by the user unless a tc-group-change listener calls preventDefault() */
  @property({ attribute: "group-by" }) accessor groupBy: GapGroupBy = "priority";
  /** Shows only gaps with no work on them. Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property({ type: Boolean, attribute: "uncovered-only", reflect: true }) accessor uncoveredOnly = false;
  /** The severities that count as exposure when nothing is in work */
  @property({ attribute: false }) accessor exposureSeverities: GapSeverity[] = ["critical", "high"];
  /** The severities' names, merged over the defaults (Critical, High, Medium, Low) */
  @property({ attribute: false }) accessor severityLabels: Partial<Record<GapSeverity, string>> = {};
  /** The priority tiers' names by number, merged over the defaults (Top priority, High, Medium, Watching) */
  @property({ attribute: false }) accessor tiers: Record<number, string> = {};
  /** The currency of `budget`, as an ISO code */
  @property() accessor currency = "USD";
  /** The language for numbers and money, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Shown when nothing matches */
  @property() accessor empty = "No gaps to show.";

  @state() private accessor activeId = "";
  @state() private accessor activeExposure = "";

  private uid = `tc-gexp-${++uidCount}`;

  /* ---------- The model ---------- */

  private sev(s: GapSeverity) {
    return this.severityLabels[s] ?? defaultGapSeverityLabels[s];
  }
  private tier(n: number) {
    return this.tiers[n] ?? defaultGapTiers[n] ?? `Priority ${n}`;
  }
  private covered(g: ExposureGap) {
    return (g.work ?? 0) > 0;
  }
  private exposed(g: ExposureGap) {
    return !this.covered(g) && this.exposureSeverities.includes(g.severity);
  }
  private invested(g: ExposureGap) {
    const parts: string[] = [];
    if (g.budget !== undefined) parts.push(new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, notation: "compact", maximumFractionDigits: 1 }).format(g.budget));
    if (g.fte !== undefined) parts.push(`${new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(g.fte)} FTE`);
    return parts.length ? `${parts.join(" · ")} invested` : "";
  }
  private bySeverity = (a: ExposureGap, b: ExposureGap) => GAP_SEVERITIES.indexOf(a.severity) - GAP_SEVERITIES.indexOf(b.severity);
  /** The list's rows by group, in display order */
  private get groups() {
    const shown = this.gaps.filter((g) => !this.uncoveredOnly || !this.covered(g));
    if (this.groupBy === "severity") {
      return GAP_SEVERITIES.map((s) => ({ key: s, gaps: shown.filter((g) => g.severity === s) })).filter((x) => x.gaps.length);
    }
    const tiers = [...new Set(shown.map((g) => g.priority ?? Infinity))].sort((a, b) => a - b);
    return tiers.map((t) => ({ key: t, gaps: shown.filter((g) => (g.priority ?? Infinity) === t).sort(this.bySeverity) }));
  }
  private get exposure() {
    return [...this.gaps.filter((g) => this.exposed(g))].sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity) || this.bySeverity(a, b));
  }

  private setGroup(next: GapGroupBy) {
    if (next === this.groupBy) return;
    if (!this.emit<GapGroupChange>("tc-group-change", { groupBy: next }, { cancelable: true })) return;
    this.groupBy = next;
  }
  private setUncovered(next: boolean) {
    if (!this.emit<GapFilterChange>("tc-filter-change", { uncoveredOnly: next }, { cancelable: true })) return;
    this.uncoveredOnly = next;
  }
  private open(g: ExposureGap) {
    this.emit<GapOpen>("tc-open", { id: g.id, gap: g });
  }

  /* ---------- Keyboard: each list is one tab stop ---------- */

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-row]");
    const nav = row?.closest<HTMLElement>("[data-nav]");
    if (!row || !nav || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const rows = [...nav.querySelectorAll<HTMLElement>("[data-row]")];
    const i = rows.indexOf(row);
    const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = rows[Math.max(0, Math.min(rows.length - 1, to))];
    if (nav.dataset.nav === "exposure") this.activeExposure = next.dataset.row!;
    else this.activeId = next.dataset.row!;
    void this.updateComplete.then(() => next.focus());
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.groupBy !== "priority" && this.groupBy !== "severity") this.groupBy = "priority";
  }

  /* ---------- Rendering ---------- */

  private renderSeverity(s: GapSeverity) {
    return html`<span class="ui-gexp__sev" data-severity=${s}><svg class="ui-gexp__mark" viewBox="0 0 12 12" aria-hidden="true">${MARK[s]}</svg>${this.sev(s)}</span>`;
  }

  private renderCoverage(g: ExposureGap) {
    return this.covered(g)
      ? html`<span class="ui-gexp__cov" data-covered>${g.work} in work</span>`
      : html`<span class="ui-gexp__cov">No work</span>`;
  }

  private renderRow(g: ExposureGap, stop: string) {
    const money = this.invested(g);
    return html`<li class="ui-gexp__item">
      <button type="button" class="ui-gexp__row" data-row=${g.id} data-severity=${g.severity} ?data-uncovered=${!this.covered(g)} tabindex=${g.id === stop ? 0 : -1} @focus=${() => (this.activeId = g.id)} @click=${() => this.open(g)}>
        <span class="ui-gexp__c-sev">${this.renderSeverity(g.severity)}</span>
        <span class="ui-gexp__what">
          <span class="ui-gexp__text">${g.text}</span>
          ${g.item
            ? html`<span class="ui-gexp__item-line">${g.priority !== undefined ? html`<span class="ui-gexp__badge" data-priority=${g.priority} aria-hidden="true">${g.priority}</span><span class="ui-gexp__sr">Priority ${g.priority}: </span>` : nothing}${g.item}</span>`
            : nothing}
        </span>
        <span class="ui-gexp__c-cov">${this.renderCoverage(g)}</span>
        <span class="ui-gexp__c-owner">${g.owner ? html`<span class="ui-gexp__owner" title=${g.owner}><span aria-hidden="true">${initials(g.owner)}</span><span class="ui-gexp__sr">Owner ${g.owner}</span></span>` : nothing}</span>
        <span class="ui-gexp__c-money">${money ? html`<span class="ui-gexp__money">${money}</span>` : nothing}</span>
        ${chevron}
      </button>
    </li>`;
  }

  private renderGroupHead(key: number | GapSeverity, gaps: ExposureGap[]) {
    const uncovered = gaps.filter((g) => !this.covered(g)).length;
    return html`<div class="ui-gexp__group-head">
      ${typeof key === "number"
        ? key === Infinity
          ? html`<span class="ui-gexp__group-name">No priority</span>`
          : html`<span class="ui-gexp__badge" data-priority=${key} aria-hidden="true">${key}</span><span class="ui-gexp__group-name">${this.tier(key)}</span>`
        : this.renderSeverity(key)}
      <span class="ui-gexp__group-count">${gaps.length}</span>
      ${uncovered ? html`<span class="ui-gexp__group-uncovered">${uncovered} uncovered</span>` : nothing}
    </div>`;
  }

  private renderExposure(list: ExposureGap[]) {
    const stop = list.some((g) => g.id === this.activeExposure) ? this.activeExposure : (list[0]?.id ?? "");
    const id = this.uid;
    return html`<section class="ui-gexp__exposure" aria-labelledby=${`${id}-exp`}>
      <h4 class="ui-gexp__exp-title" id=${`${id}-exp`}>Exposure <span class="ui-gexp__exp-sub">${this.exposureSeverities.map((s) => this.sev(s).toLowerCase()).join(" / ")} gaps with nothing in work</span></h4>
      <ul class="ui-gexp__exp-list" data-nav="exposure" @keydown=${this.onKey}>
        ${repeat(
          list,
          (g) => g.id,
          (g) => html`<li>
            <button type="button" class="ui-gexp__exp-row" data-row=${g.id} tabindex=${g.id === stop ? 0 : -1} @focus=${() => (this.activeExposure = g.id)} @click=${() => this.open(g)}>
              ${g.priority !== undefined ? html`<span class="ui-gexp__badge" data-priority=${g.priority} aria-hidden="true">${g.priority}</span><span class="ui-gexp__sr">Priority ${g.priority}. </span>` : nothing}
              ${this.renderSeverity(g.severity)}
              <span class="ui-gexp__exp-what">${g.item ? html`<span class="ui-gexp__exp-item">${g.item}</span>` : nothing}<span class="ui-gexp__exp-text">${g.text}</span></span>
            </button>
          </li>`,
        )}
      </ul>
    </section>`;
  }

  protected override render() {
    const id = this.uid;
    const groups = this.groups;
    const flat = groups.flatMap((g) => g.gaps);
    const stop = flat.some((g) => g.id === this.activeId) ? this.activeId : (flat[0]?.id ?? "");
    const exposure = this.exposure;
    const uncovered = this.gaps.filter((g) => !this.covered(g)).length;
    return html`
      ${cardHead({ icon: shieldIcon, title: this.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-gexp__card">
        ${this.gaps.length
          ? html`<dl class="ui-gexp__stats">
                <div class="ui-gexp__stat"><dt>Open</dt><dd>${this.gaps.length}</dd></div>
                <div class="ui-gexp__stat"><dt>Uncovered</dt><dd>${uncovered}</dd></div>
                <div class="ui-gexp__stat" ?data-alert=${exposure.length > 0}><dt>Exposure</dt><dd>${exposure.length}</dd></div>
              </dl>
              ${exposure.length ? this.renderExposure(exposure) : nothing}
              <div class="ui-gexp__controls">
                <div class="ui-gexp__seg" role="group" aria-label="Group by">
                  <span class="ui-gexp__seg-label" aria-hidden="true">Group by</span>
                  ${(["priority", "severity"] as const).map(
                    (k) => html`<button type="button" class="ui-gexp__seg-btn" data-group=${k} aria-pressed=${this.groupBy === k ? "true" : "false"} @click=${() => this.setGroup(k)}>${k === "priority" ? "Priority" : "Severity"}</button>`,
                  )}
                </div>
                <button type="button" class="ui-gexp__toggle" role="switch" aria-checked=${this.uncoveredOnly ? "true" : "false"} @click=${() => this.setUncovered(!this.uncoveredOnly)}>
                  <span class="ui-gexp__switch" aria-hidden="true"></span>Uncovered only
                </button>
              </div>
              ${flat.length
                ? html`<div class="ui-gexp__groups" data-nav="list" aria-labelledby=${`${id}-title`} role="group" @keydown=${this.onKey}>
                    ${groups.map(
                      (gr) => html`<section class="ui-gexp__group" aria-label=${typeof gr.key === "number" ? (gr.key === Infinity ? "No priority" : this.tier(gr.key)) : this.sev(gr.key)}>
                        ${this.renderGroupHead(gr.key, gr.gaps)}
                        <ul class="ui-gexp__list">${repeat(gr.gaps, (g) => g.id, (g) => this.renderRow(g, stop))}</ul>
                      </section>`,
                    )}
                  </div>`
                : html`<p class="ui-gexp__empty">${this.empty}</p>`}`
          : html`<p class="ui-gexp__empty">${this.empty}</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="gexp"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="gexp"] {
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
/* A row's columns – the investment and owner fold away as it narrows */
[data-ui="gexp"] { --tc-gexp-cols: 92px minmax(0, 1fr) 84px 28px 168px 16px; }
[data-ui="gexp"] *, [data-ui="gexp"] *::before, [data-ui="gexp"] *::after { box-sizing: border-box; }
[data-ui="gexp"] p, [data-ui="gexp"] h4, [data-ui="gexp"] dl, [data-ui="gexp"] dd { margin: 0; }
[data-ui="gexp"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="gexp"] svg { display: block; flex: none; }
:where([data-ui="gexp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="gexp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-gexp__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-gexp__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The stats ----- */
.ui-gexp__stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-gexp__stat { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-gexp__stat + .ui-gexp__stat { border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-gexp__stat dt { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-gexp__stat dd { font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display-sm); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-gexp__stat[data-alert] dd { color: var(--tc-status-danger-fg); }
/* ----- The exposure panel ----- */
.ui-gexp__exposure { display: grid; gap: var(--tc-space-2); margin: var(--tc-space-3) var(--tc-space-3) 0; padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); }
.ui-gexp__exp-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); }
.ui-gexp__exp-sub { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-secondary); }
.ui-gexp__exp-list { display: grid; gap: var(--tc-space-1); }
.ui-gexp__exp-row { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; padding: var(--tc-space-2) !important; border-radius: var(--tc-radius-md); background: var(--tc-surface-raised) !important; text-align: left; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-gexp__exp-row:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-gexp__exp-what { display: grid; flex: 1; min-width: 0; }
.ui-gexp__exp-item { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-gexp__exp-text { line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
/* ----- The controls ----- */
.ui-gexp__controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); }
.ui-gexp__seg { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-gexp__seg-label { padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-gexp__seg-btn { height: calc(var(--tc-control-h-sm) - var(--tc-space-1)); padding: 0 var(--tc-space-2-5) !important; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-space-0-5)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-gexp__seg-btn[aria-pressed="true"] { background: var(--tc-seg-thumb-bg) !important; box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-gexp__seg-btn[aria-pressed="true"] { font-weight: var(--tc-font-weight-strong); }
.ui-gexp__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-gexp__switch { position: relative; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-gexp__switch::after { content: ""; position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-gexp__toggle[aria-checked="true"] .ui-gexp__switch { background: var(--tc-switch-on); }
.ui-gexp__toggle[aria-checked="true"] .ui-gexp__switch::after { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
/* ----- The groups and rows ----- */
.ui-gexp__group-head { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-gexp__group + .ui-gexp__group { border-top: var(--tc-hairline) solid var(--tc-border-default); }
.ui-gexp__group-name { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-gexp__group-count { font-variant-numeric: tabular-nums; }
.ui-gexp__group-count::before, .ui-gexp__group-uncovered::before { content: "·"; margin-right: var(--tc-space-2); }
.ui-gexp__group-uncovered { color: var(--tc-status-danger-fg); }
.ui-gexp__list { padding: 0 var(--tc-space-1-5) var(--tc-space-1-5) !important; }
.ui-gexp__item + .ui-gexp__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-gexp__row { display: grid; grid-template-columns: var(--tc-gexp-cols); align-items: center; gap: var(--tc-space-3); width: 100%; min-height: 52px; padding: var(--tc-space-2) var(--tc-space-2-5) !important; border-radius: var(--tc-radius-md); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-gexp__row:hover { background: var(--tc-fill-subtle); }
[data-ui="gexp"] .ui-gexp__row:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-gexp__row > span { min-width: 0; }
.ui-gexp__what { display: grid; gap: var(--tc-space-0-5); }
.ui-gexp__text { line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-gexp__item-line { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* Severity: a mark and a word in its status colour */
.ui-gexp__sev { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; white-space: nowrap; }
.ui-gexp__mark { width: 9px; height: 9px; }
.ui-gexp__sev[data-severity="critical"] { color: var(--tc-status-danger-fg); }
.ui-gexp__sev[data-severity="high"] { color: var(--tc-status-warning-fg); }
.ui-gexp__sev[data-severity="medium"] { color: var(--tc-status-info-fg); }
.ui-gexp__sev[data-severity="low"] { color: var(--tc-text-muted); }
/* The priority badge: the top tier in ink, the rest outlined */
.ui-gexp__badge { display: inline-grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); }
.ui-gexp__badge[data-priority="1"] { background: var(--tc-surface-inverse); box-shadow: none; color: var(--tc-text-on-inverse); }
/* Coverage: "No work" outlined in the warning colour, work in flight quiet */
.ui-gexp__cov { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); white-space: nowrap; }
.ui-gexp__cov[data-covered] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-secondary); }
.ui-gexp__owner { display: grid; place-items: center; width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); border-radius: 50%; background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-avatar-font-weight); color: var(--tc-text-secondary); }
.ui-gexp__money { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-gexp__chev { width: 16px; height: 16px; color: var(--tc-icon-muted); }
.ui-gexp__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 640px) {
  [data-ui="gexp"] { --tc-gexp-cols: 84px minmax(0, 1fr) 80px 28px 16px; }
  .ui-gexp__c-money { display: none; }
}
@container (max-width: 460px) {
  [data-ui="gexp"] { --tc-gexp-cols: minmax(0, 1fr) auto; }
  .ui-gexp__row { gap: var(--tc-space-1) var(--tc-space-2); }
  .ui-gexp__c-sev { grid-column: 1; }
  .ui-gexp__what { grid-column: 1 / -1; }
  .ui-gexp__c-cov { grid-column: 2; grid-row: 1; justify-self: end; }
  .ui-gexp__c-owner, .ui-gexp__chev { display: none; }
  .ui-gexp__stat { padding: var(--tc-space-2-5) var(--tc-space-3); }
  .ui-gexp__stat dd { font-size: var(--tc-font-size-xl); }
}
@media (forced-colors: active) {
  .ui-gexp__toggle[aria-checked="true"] .ui-gexp__switch { background: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="gexp"] *, [data-ui="gexp"] *::before, [data-ui="gexp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-gap-exposure")) customElements.define("tc-gap-exposure", TcGapExposure);

declare global {
  interface HTMLElementTagNameMap {
    "tc-gap-exposure": TcGapExposure;
  }
}
