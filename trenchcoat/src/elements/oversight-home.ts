import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import type { DataColumn, DataRow, TagTone } from "./data-table";
import type { KpiSeries } from "./kpi-chart";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";
import "./button";
import "./data-table";
import "./kpi-chart";
import "./segmented-control";

/*
 * <tc-oversight-home> – the first screen for someone who oversees AI work (the Lit port of
 * blocks/oversight-home.tsx). Each role gets its own home; switch roles at the top right (tc-role-change). A home has:
 *   · the day and the role, a headline that says what needs doing, and a line on what this home covers
 *   · the one thing that needs this person first, with a way in (tc-open-focus)
 *   · the library's KPI Chart for each number the role watches – this week against the last
 *   · service posture: the library's Data Table, read only, with each service's state, availability and last event,
 *     and a filter by state – down and limited services sort to the top
 * A page section, not a card: the charts and the table carry the look (Standard trays, or Clean cards).
 *
 *   <tc-oversight-home .roleId=${"lead"} .roles=${[…]}></tc-oversight-home>
 */

export type ServiceState = "normal" | "limited" | "down" | "unknown";

export type OversightKpi = {
  id: string;
  /** What is counted, e.g. "Decisions awaiting review" */
  label: string;
  /** The headline number, already formatted */
  value: string;
  /** Change against the last period, in percent – positive is up */
  delta?: number;
  /** A drop is good news (pending work, latency, incidents): the change shows green when it falls */
  lowerIsBetter?: boolean;
  /** One label per point, e.g. weekdays */
  labels: string[];
  /** This period, one value per label */
  values: number[];
  /** The period before, drawn as a second, dashed line */
  previous?: number[];
  /** A line under the chart, e.g. "3 overdue" */
  footer?: string;
  /** Line colours – this period, then the last: any CSS colour, tokens included */
  colors?: [string, string?];
};

export type OversightService = {
  id: string;
  name: string;
  state: ServiceState;
  /** e.g. "99.95%" */
  availability?: string;
  /** What happened last, e.g. "Health check passed · 4m ago" */
  lastEvent?: string;
};

export type OversightRole = {
  id: string;
  /** The role's name in the switcher, e.g. "Reviewer" */
  label: string;
  /** The kicker above the headline, e.g. "Friday · 12 June · Review" */
  eyebrow?: string;
  /** What needs doing, as a sentence – e.g. "5 decisions are waiting for you." */
  headline: string;
  /** What this home covers */
  summary?: string;
  /** The one thing that needs this person first */
  focus?: { label: string; detail?: string; action?: string };
  kpis: OversightKpi[];
  services: OversightService[];
  /** A line above the services, e.g. who can see what */
  servicesNote?: string;
};

/** Details of the events */
export type OversightRoleChange = { roleId: string; role: OversightRole };
export type OversightOpenFocus = { role: OversightRole };

/** The words for the service states */
export const defaultServiceStateLabels: Record<ServiceState, string> = { normal: "Normal", limited: "Limited", down: "Down", unknown: "Unknown" };
const STATES: ServiceState[] = ["normal", "limited", "down", "unknown"];
const TONES: Record<ServiceState, TagTone> = { normal: "green", limited: "amber", down: "pink", unknown: "gray" };
const RANK: Record<ServiceState, number> = { down: 0, limited: 1, unknown: 2, normal: 3 };
/** The look's chart tokens: this period in the first series colour, the one before in the neutral */
const LINES: [string, string] = ["var(--tc-chart-1)", "var(--tc-chart-neutral)"];
/** The chart puts the sign in front; this adds the unit: "6%", "0.4%" */
const percent = (n: number) => `${n}%`;
const COLUMNS: DataColumn[] = [
  { key: "name", label: "Service", type: "text" },
  { key: "state", label: "State", type: "tag", width: "116px" },
  { key: "availability", label: "Availability", type: "text", width: "132px" },
  { key: "event", label: "Last event", type: "text", width: "38%" },
];
type Filter = "all" | ServiceState;

/* shield-alert: Lucide (ISC, lucide.dev) */
const shieldIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM12 8v4M12 16h.01"></path></svg>`;

let uidCount = 0;

/**
 * A role's home for overseeing AI work: what needs doing, the one thing first, the numbers the role watches against
 * last week, and the state of the services behind them – switch roles at the top.
 * @tag tc-oversight-home
 * @fires tc-role-change - Another role was picked ({ roleId, role }: OversightRoleChange – its id and the role); cancelable – prevented, `roleId` stays
 * @fires tc-open-focus - The focus card's action was pressed ({ role }: OversightOpenFocus – the role on show)
 */
export class TcOversightHome extends TcElement {
  static override ui = "ovh";

  /** The roles, each with its own home */
  @property({ attribute: false }) accessor roles: OversightRole[] = [];
  /** Id of the role on show – the first one when unset or unknown */
  @property({ attribute: "role-id" }) accessor roleId: string | undefined = undefined;
  /** Words for the service states, merged over defaultServiceStateLabels */
  @property({ attribute: false }) accessor stateLabels: Partial<Record<ServiceState, string>> = {};
  /** Name of this period's line in each chart */
  @property({ attribute: "current-label" }) accessor currentLabel = "This week";
  /** Name of the last period's line in each chart */
  @property({ attribute: "previous-label" }) accessor previousLabel = "Last week";
  /** Hide the focus card's action – nothing opens it */
  @property({ type: Boolean, attribute: "hide-focus-action" }) accessor hideFocusAction = false;

  /** The services filter – back to all when the role changes */
  @state() private accessor filter: Filter = "all";
  private readonly uid = `tc-ovh-${++uidCount}`;

  private get roleList() {
    return Array.isArray(this.roles) ? this.roles : [];
  }
  private get current() {
    const list = this.roleList;
    return list.find((r) => r.id === this.roleId) ?? list[0];
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("roleId") && changed.get("roleId") !== undefined) this.filter = "all";
  }

  private pickRole(id: string) {
    const current = this.current;
    const next = this.roleList.find((r) => r.id === id);
    if (!current || !next || id === current.id) return;
    if (this.emit<OversightRoleChange>("tc-role-change", { roleId: id, role: next }, { cancelable: true })) {
      this.roleId = id;
      this.filter = "all";
    }
  }

  private renderKpi(k: OversightKpi) {
    const series: KpiSeries[] = [{ label: this.currentLabel, color: k.colors?.[0] ?? LINES[0], values: k.values ?? [] }];
    if (k.previous) series.push({ label: this.previousLabel, color: k.colors?.[1] ?? LINES[1], values: k.previous });
    return html`<tc-kpi-chart
      look=${this.resolvedLook}
      fill
      heading=${k.label}
      value=${k.value}
      .delta=${Number.isFinite(k.delta) ? k.delta : undefined}
      .deltaFormat=${percent}
      ?lower-is-better=${!!k.lowerIsBetter}
      .labels=${k.labels ?? []}
      .series=${series}
      footer=${k.footer ?? ""}
    ></tc-kpi-chart>`;
  }

  protected override render() {
    const role = this.current;
    if (!role) return nothing;
    const look = this.resolvedLook;
    const labels = { ...defaultServiceStateLabels, ...this.stateLabels };
    const tagTones = Object.fromEntries(STATES.map((s) => [labels[s], TONES[s]]));
    const services = role.services ?? [];
    const filter = this.filter;
    const rows: DataRow[] = services
      .filter((s) => filter === "all" || s.state === filter)
      .sort((a, b) => (RANK[a.state] ?? 2) - (RANK[b.state] ?? 2))
      .map((s) => ({ id: s.id, name: s.name, state: labels[s.state] ?? labels.unknown, availability: s.availability ?? "–", event: s.lastEvent ?? "" }));
    const present = STATES.filter((s) => services.some((x) => x.state === s));
    const troubled = services.filter((s) => s.state === "down" || s.state === "limited").length;
    const roleOptions: SegmentOption[] = this.roleList.map((r) => ({ value: r.id, label: r.label }));
    const filterOptions: SegmentOption[] = [
      { value: "all", label: "All" },
      ...present.map((s) => ({ value: s, label: labels[s], badge: String(services.filter((x) => x.state === s).length) })),
    ];
    const focus = role.focus;
    const kpis = role.kpis ?? [];

    return html`<header class="ui-ovh__intro">
        <div class="ui-ovh__intro-text">
          ${role.eyebrow ? html`<p class="ui-ovh__eyebrow">${role.eyebrow}</p>` : nothing}
          <h2 class="ui-ovh__headline">${role.headline}</h2>
          ${role.summary ? html`<p class="ui-ovh__summary">${role.summary}</p>` : nothing}
        </div>
        ${roleOptions.length > 1
          ? html`<tc-segmented-control
              look=${look}
              aria-label="Role"
              .options=${roleOptions}
              .value=${role.id}
              @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
                // The inner control's event stops here: the page hears tc-role-change
                e.stopPropagation();
                e.preventDefault();
                this.pickRole(e.detail.value);
              }}
            ></tc-segmented-control>`
          : nothing}
      </header>
      ${focus
        ? html`<section class="ui-ovh__focus" aria-labelledby=${`${this.uid}-focus`}>
            <span class="ui-ovh__focus-icon" aria-hidden="true">${shieldIcon}</span>
            <div class="ui-ovh__focus-text">
              <p class="ui-ovh__caption">Needs you first</p>
              <h3 id=${`${this.uid}-focus`} class="ui-ovh__focus-title">${focus.label}</h3>
              ${focus.detail ? html`<p class="ui-ovh__focus-detail">${focus.detail}</p>` : nothing}
            </div>
            ${this.hideFocusAction
              ? nothing
              : html`<tc-button look=${look} variant="primary" label=${focus.action ?? "Open"} @click=${() => this.emit<OversightOpenFocus>("tc-open-focus", { role })}></tc-button>`}
          </section>`
        : nothing}
      ${kpis.length
        ? keyed(
            role.id,
            html`<div class="ui-ovh__kpis">
              ${repeat(
                kpis,
                (k) => k.id,
                (k) => this.renderKpi(k),
              )}
            </div>`,
          )
        : nothing}
      <section class="ui-ovh__posture" aria-labelledby=${`${this.uid}-posture`}>
        <div class="ui-ovh__section-head">
          <h3 id=${`${this.uid}-posture`} class="ui-ovh__section-title">Service posture</h3>
          <span class="ui-ovh__posture-note">${troubled ? `${troubled} of ${services.length} need attention` : `All ${services.length} running normally`}</span>
          ${present.length > 1
            ? html`<tc-segmented-control
                look=${look}
                size="sm"
                aria-label="Filter services by state"
                .options=${filterOptions}
                .value=${filter}
                @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
                  e.stopPropagation();
                  e.preventDefault();
                  this.filter = e.detail.value as Filter;
                }}
              ></tc-segmented-control>`
            : nothing}
        </div>
        ${role.servicesNote ? html`<p class="ui-ovh__note">${role.servicesNote}</p>` : nothing}
        <tc-data-table look=${look} heading="Services" readonly .columns=${COLUMNS} .rows=${rows} .tagTones=${tagTones}></tc-data-table>
      </section>`;
  }

  static override css = /* css */ `
[data-ui="ovh"] {
  container-type: inline-size;
  display: grid;
  gap: var(--tc-space-6);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="ovh"] *, [data-ui="ovh"] *::before, [data-ui="ovh"] *::after { box-sizing: border-box; }

.ui-ovh__intro { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--tc-space-4); }
.ui-ovh__intro-text { flex: 1 1 320px; display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-ovh__eyebrow { margin: 0; color: var(--tc-eyebrow-color); font-size: var(--tc-eyebrow-font-size); font-weight: var(--tc-eyebrow-font-weight); line-height: var(--tc-eyebrow-line-height); letter-spacing: var(--tc-eyebrow-tracking); text-transform: var(--tc-eyebrow-transform); }
/* Deliberately display-sized: the home's one sentence */
.ui-ovh__headline { margin: 0; color: var(--tc-text-strong); font-size: var(--tc-font-size-4xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); text-wrap: balance; }
[data-ui="ovh"][data-look="clean"] .ui-ovh__headline { font-weight: var(--tc-font-weight-medium); }
@container (max-width: 520px) { .ui-ovh__headline { font-size: var(--tc-font-size-3xl); line-height: var(--tc-line-height-display-sm); } }
.ui-ovh__summary { margin: 0; max-width: 60ch; color: var(--tc-text-secondary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); }

/* The one thing first: a tinted band with a boxed icon */
.ui-ovh__focus { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-3) var(--tc-space-4); padding: var(--tc-space-4); border-radius: var(--tc-tray-radius); background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); }
.ui-ovh__focus-icon { flex: none; display: grid; place-items: center; width: var(--tc-space-10); height: var(--tc-space-10); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); color: var(--tc-status-warning-fg); }
.ui-ovh__focus-icon svg { width: var(--tc-space-5); height: var(--tc-space-5); stroke-width: var(--tc-head-glyph-stroke); }
.ui-ovh__focus-text { flex: 1 1 220px; min-width: 0; }
.ui-ovh__focus-text p, .ui-ovh__focus-text h3 { margin: 0; }
.ui-ovh__caption { color: var(--tc-status-warning-fg); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-ovh__focus-title { color: var(--tc-title-color); font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); }
.ui-ovh__focus-detail { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }

.ui-ovh__kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); gap: var(--tc-space-4); animation: ui-ovh-in var(--tc-duration-moderate) var(--tc-ease-out) both; }

.ui-ovh__posture { display: grid; gap: var(--tc-space-3); min-width: 0; }
.ui-ovh__section-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-ovh__section-title { margin: 0; color: var(--tc-text-strong); font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-loose); letter-spacing: var(--tc-tracking-snug); }
[data-ui="ovh"][data-look="clean"] .ui-ovh__section-title { font-weight: var(--tc-font-weight-medium); }
.ui-ovh__posture-note { flex: 1 1 auto; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-ovh__note { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

@keyframes ui-ovh-in { from { opacity: 0; transform: translateY(4px); } }
@media (prefers-reduced-motion: reduce) { .ui-ovh__kpis { animation: none; } }
@media (forced-colors: active) { .ui-ovh__focus, .ui-ovh__focus-icon { border: 1px solid CanvasText; } }
`;
}

if (!customElements.get("tc-oversight-home")) customElements.define("tc-oversight-home", TcOversightHome);

declare global {
  interface HTMLElementTagNameMap {
    "tc-oversight-home": TcOversightHome;
  }
}
