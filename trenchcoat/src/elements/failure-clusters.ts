import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-failure-clusters> – a production agent's failing chats grouped by topic, the biggest first. Each cluster is a
 * row with its rank, its name, a bar for its share of the failures, the count and share in words, its trend over the
 * period ("Up 12%" with an arrow, never colour alone) and the criteria it fails. A row opens to a summary, a few
 * quotes from the chats, and Open chats, Add to dataset and Mark as known. Known clusters drop to the bottom, quiet.
 * A criterion filter (radio chips) narrows the clusters to those failing one criterion; the header says how many
 * failing chats there are in words. A bubble view shows the clusters as circles sized by count, for a glance.
 *   · the rows are one tab stop: ↑ / ↓ move, Home / End go to the ends, Enter or Space opens and closes a row
 *   · opening is a controllable `open` (one cluster at a time), known ones a controllable `known`
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-failure-clusters .clusters=${[{ id: "c1", label: "Expense limits abroad", count: 142, trend: { direction: "up", change: 12 } }]}></tc-failure-clusters>
 */

/** Two overlapping circles: Lucide "blend" (ISC, lucide.dev) */
const clustersIcon = svg`<circle cx="9" cy="9" r="7"></circle><circle cx="15" cy="15" r="7"></circle>`;
/** Chevron: Lucide (ISC) */
const chevron = svg`<path d="m6 9 6 6 6-6"></path>`;
const ARROW = {
  up: svg`<path d="M7 17 17 7"></path><path d="M7 7h10v10"></path>`,
  down: svg`<path d="M7 7l10 10"></path><path d="M17 7v10H7"></path>`,
  flat: svg`<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>`,
};

export type ClusterTrend = {
  /** Which way the cluster moved over the period */
  direction: "up" | "down" | "flat";
  /** By how much, in percent (12 for 12%) */
  change?: number;
};
export type ClusterExample = { id: string; quote: string };
export type FailureCluster = {
  id: string;
  /** The topic, in a few words: "Expense limits abroad" */
  label: string;
  /** What goes wrong in these chats, in a sentence or two */
  summary?: string;
  /** How many failing chats are in it */
  count: number;
  /** Its share of all failing chats, 0–1; by default count / total */
  share?: number;
  trend?: ClusterTrend;
  /** The criteria these chats fail, by name: ["Cites policy"] */
  criteria?: string[];
  /** A few quotes from the chats */
  examples?: ClusterExample[];
};
export type FailureClustersView = "list" | "bubbles";

/** Details of the events */
export type FailureClusterOpenChange = { open: string | null };
export type FailureClusterKnownChange = { known: string[]; id: string; isKnown: boolean };
export type FailureClusterCriterionChange = { criterion: string | null };
export type FailureClusterViewChange = { view: FailureClustersView };
export type FailureClusterAction = { id: string; cluster: FailureCluster };

export type FailureClustersLabels = {
  all: string;
  filter: string;
  openChats: string;
  addToDataset: string;
  added: string;
  markKnown: string;
  markNew: string;
  known: string;
  examples: string;
  list: string;
  bubbles: string;
  empty: string;
  noMatch: string;
};
export const defaultFailureClustersLabels: FailureClustersLabels = {
  all: "All criteria",
  filter: "Failed criterion",
  openChats: "Open chats",
  addToDataset: "Add to dataset",
  added: "Added to dataset",
  markKnown: "Mark as known",
  markNew: "Mark as new",
  known: "Known",
  examples: "From the chats",
  list: "List",
  bubbles: "Bubbles",
  empty: "No failing chats in this period.",
  noMatch: "No clusters fail this criterion.",
};

let uidCount = 0;

/** "Up 12%", "Down 4%", "Flat" */
export function clusterTrendWords(trend: ClusterTrend | undefined) {
  if (!trend) return "";
  if (trend.direction === "flat") return "Flat";
  const by = trend.change !== undefined && Number.isFinite(trend.change) ? ` ${Math.round(Math.abs(trend.change))}%` : "";
  return `${trend.direction === "up" ? "Up" : "Down"}${by}`;
}

/**
 * Failing chats grouped by topic, biggest first – a size bar, count and share, trend in words and the criteria each
 * fails; open a cluster for its summary, quotes, Open chats, Add to dataset and Mark as known.
 * @tag tc-failure-clusters
 * @fires tc-open-change - A cluster was opened or closed ({ open }: FailureClusterOpenChange); cancelable – prevented, `open` stays as it was
 * @fires tc-known-change - Mark as known or Mark as new ({ known, id, isKnown }: FailureClusterKnownChange); cancelable – prevented, `known` stays as it was
 * @fires tc-criterion-change - The criterion filter changed ({ criterion }: FailureClusterCriterionChange); cancelable – prevented, `criterion` stays as it was
 * @fires tc-view-change - List or Bubbles was chosen ({ view }: FailureClusterViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-cluster-open - Open chats was pressed ({ id, cluster }: FailureClusterAction)
 * @fires tc-add-to-dataset - Add to dataset was pressed ({ id, cluster }: FailureClusterAction); cancelable – prevented, the cluster isn't marked as added
 */
export class TcFailureClusters extends TcElement {
  static override ui = "fcl";

  /** The heading */
  @property() accessor heading = "Failure clusters";
  /** One line under the heading – the agent and the period */
  @property() accessor description: string | undefined = undefined;
  /** The clusters, in any order – shown biggest first, known ones last */
  @property({ attribute: false }) accessor clusters: FailureCluster[] = [];
  /** All failing chats in the period; by default the clusters' counts added up */
  @property({ type: Number }) accessor total: number | undefined = undefined;
  /** The open cluster's id. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property() accessor open: string | null = null;
  /** The clusters marked as known (ids). Changed by the user unless a tc-known-change listener calls preventDefault() */
  @property({ attribute: false }) accessor known: string[] = [];
  /** Only clusters failing this criterion; null for all. Changed by the user unless a tc-criterion-change listener calls preventDefault() */
  @property() accessor criterion: string | null = null;
  /** "list" or "bubbles". Changed by the user unless a tc-view-change listener calls preventDefault() */
  @property({ reflect: true }) accessor view: FailureClustersView = "list";
  /** Hides the List / Bubbles switch */
  @property({ type: Boolean, attribute: "hide-view" }) accessor hideView = false;
  /** The words used, merged over the defaults */
  @property({ attribute: false }) accessor labels: Partial<FailureClustersLabels> = {};
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor activeId = "";
  @state() private accessor status = "";
  @state() private accessor added: ReadonlySet<string> = new Set();

  private uid = `tc-fcl-${++uidCount}`;

  private get l(): FailureClustersLabels {
    return { ...defaultFailureClustersLabels, ...this.labels };
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  private pct(share: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: share < 0.1 ? 1 : 0 }).format(share);
  }

  /* ---------- The model ---------- */

  private get all() {
    return this.total ?? this.clusters.reduce((s, c) => s + (Number.isFinite(c.count) ? c.count : 0), 0);
  }
  private shareOf(c: FailureCluster) {
    const total = this.all;
    return c.share ?? (total > 0 ? c.count / total : 0);
  }
  private isKnown(c: FailureCluster) {
    return this.known.includes(c.id);
  }
  /** Every criterion any cluster fails, in first-seen order */
  private get criteria() {
    const seen: string[] = [];
    for (const c of this.clusters) for (const k of c.criteria ?? []) if (!seen.includes(k)) seen.push(k);
    return seen;
  }
  /** Shown: filtered, biggest first, known ones last */
  private get shown() {
    const crit = this.criterion;
    return this.clusters
      .filter((c) => !crit || (c.criteria ?? []).includes(crit))
      .sort((a, b) => Number(this.isKnown(a)) - Number(this.isKnown(b)) || b.count - a.count);
  }

  /* ---------- Changes ---------- */

  private setOpen(next: string | null, focusRow = false) {
    if (next !== this.open) {
      if (!this.emit<FailureClusterOpenChange>("tc-open-change", { open: next }, { cancelable: true })) return;
      this.open = next;
    }
    if (focusRow && next) void this.updateComplete.then(() => this.row(next)?.focus());
  }
  private toggleKnown(c: FailureCluster) {
    const isKnown = !this.isKnown(c);
    const known = isKnown ? [...this.known, c.id] : this.known.filter((k) => k !== c.id);
    if (!this.emit<FailureClusterKnownChange>("tc-known-change", { known, id: c.id, isKnown }, { cancelable: true })) return;
    this.known = known;
    this.status = isKnown ? `${c.label} marked as known` : `${c.label} marked as new`;
  }
  private setCriterion(next: string | null) {
    if (next === this.criterion) return;
    // Prevented, the radio the user pressed goes back to the one that's still chosen
    if (!this.emit<FailureClusterCriterionChange>("tc-criterion-change", { criterion: next }, { cancelable: true })) return this.requestUpdate();
    this.criterion = next;
  }
  private setView(next: FailureClustersView) {
    if (next === this.view) return;
    if (!this.emit<FailureClusterViewChange>("tc-view-change", { view: next }, { cancelable: true })) return;
    this.view = next;
  }
  private addToDataset(c: FailureCluster) {
    if (!this.emit<FailureClusterAction>("tc-add-to-dataset", { id: c.id, cluster: c }, { cancelable: true })) return;
    const next = new Set(this.added);
    next.add(c.id);
    this.added = next;
    this.status = `${c.label}: ${this.l.added.toLowerCase()}`;
  }

  /* ---------- Keyboard ---------- */

  private row(id: string) {
    return this.querySelector<HTMLElement>(`[data-cluster="${CSS.escape(id)}"]`);
  }
  private onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!target.matches?.("[data-cluster]") || e.altKey || e.metaKey || e.ctrlKey) return;
    const list = this.shown;
    const i = list.findIndex((c) => c.id === target.dataset.cluster);
    const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = list[Math.max(0, Math.min(list.length - 1, to))];
    if (!next) return;
    this.activeId = next.id;
    void this.updateComplete.then(() => this.row(next.id)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A cluster that's gone can't stay open
    if ((changed.has("clusters") || changed.has("open")) && this.open && !this.clusters.some((c) => c.id === this.open)) this.open = null;
  }

  /* ---------- Rendering ---------- */

  private renderDetail(c: FailureCluster, id: string) {
    const l = this.l;
    const added = this.added.has(c.id);
    return html`<div class="ui-fcl__detail" id=${id} role="region" aria-labelledby=${`${id}-name`}>
      ${c.summary ? html`<p class="ui-fcl__summary">${c.summary}</p>` : nothing}
      ${c.examples?.length
        ? html`<p class="ui-fcl__examples-title" id=${`${id}-ex`}>${l.examples}</p>
            <ul class="ui-fcl__examples" aria-labelledby=${`${id}-ex`}>
              ${c.examples.map((x) => html`<li><blockquote class="ui-fcl__quote">${x.quote}</blockquote></li>`)}
            </ul>`
        : nothing}
      <div class="ui-fcl__actions">
        <button type="button" class="ui-fcl__btn" data-tone="primary" data-action="open" aria-describedby=${`${id}-name`} @click=${() => this.emit<FailureClusterAction>("tc-cluster-open", { id: c.id, cluster: c })}>${l.openChats}</button>
        ${added
          ? html`<span class="ui-fcl__done" data-action="added">${l.added}</span>`
          : html`<button type="button" class="ui-fcl__btn" data-action="dataset" aria-describedby=${`${id}-name`} @click=${() => this.addToDataset(c)}>${l.addToDataset}</button>`}
        <button type="button" class="ui-fcl__btn" data-action="known" aria-pressed=${this.isKnown(c) ? "true" : "false"} aria-describedby=${`${id}-name`} @click=${() => this.toggleKnown(c)}>
          ${this.isKnown(c) ? l.markNew : l.markKnown}
        </button>
      </div>
    </div>`;
  }

  private renderRow(c: FailureCluster, rank: number, stop: string, max: number) {
    const id = `${this.uid}-${c.id}`;
    const open = this.open === c.id;
    const share = this.shareOf(c);
    const known = this.isKnown(c);
    const trend = clusterTrendWords(c.trend);
    const facts = [`${this.num(c.count)} ${c.count === 1 ? "chat" : "chats"}`, this.pct(share), trend, known ? this.l.known : "", ...(c.criteria ?? []).map((k) => `fails ${k}`)].filter(Boolean).join(", ");
    return html`<li class="ui-fcl__item" ?data-open=${open} ?data-known=${known}>
      <button
        type="button"
        class="ui-fcl__row"
        data-cluster=${c.id}
        tabindex=${c.id === stop ? 0 : -1}
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${id}
        aria-describedby=${`${id}-facts`}
        @focus=${() => (this.activeId = c.id)}
        @click=${() => this.setOpen(open ? null : c.id)}
      >
        <span class="ui-fcl__rank" aria-hidden="true">${rank}</span>
        <span class="ui-fcl__main">
          <span class="ui-fcl__top">
            <span class="ui-fcl__name" id=${`${id}-name`}>${c.label}</span>
            ${known ? html`<span class="ui-fcl__known" aria-hidden="true">${this.l.known}</span>` : nothing}
          </span>
          <span class="ui-fcl__bar" aria-hidden="true"><span class="ui-fcl__fill" style=${styleMap({ width: `${max > 0 ? Math.max(2, (c.count / max) * 100) : 0}%` })}></span></span>
          <span class="ui-fcl__meta" aria-hidden="true">
            <span class="ui-fcl__count">${this.num(c.count)} · ${this.pct(share)}</span>
            ${c.trend
              ? html`<span class="ui-fcl__trend" data-direction=${c.trend.direction}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ARROW[c.trend.direction]}</svg>${trend}</span>`
              : nothing}
            ${(c.criteria ?? []).map((k) => html`<span class="ui-fcl__chip">${k}</span>`)}
          </span>
        </span>
        <span class="ui-fcl__sr" id=${`${id}-facts`}>${facts}</span>
        <svg class="ui-fcl__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${chevron}</svg>
      </button>
      ${open ? this.renderDetail(c, id) : html`<div id=${id} hidden></div>`}
    </li>`;
  }

  private renderBubbles(list: FailureCluster[], stop: string, max: number) {
    const open = list.find((c) => c.id === this.open);
    return html`<div class="ui-fcl__bubbles" role="list" aria-labelledby=${`${this.uid}-title`} @keydown=${this.onKey}>
        ${repeat(
          list,
          (c) => c.id,
          (c) => {
            const size = max > 0 ? Math.sqrt(c.count / max) : 0;
            return html`<div role="listitem" class="ui-fcl__bubble-cell">
              <button
                type="button"
                class="ui-fcl__bubble"
                data-cluster=${c.id}
                ?data-known=${this.isKnown(c)}
                tabindex=${c.id === stop ? 0 : -1}
                aria-pressed=${this.open === c.id ? "true" : "false"}
                aria-describedby=${`${this.uid}-${c.id}-bfacts`}
                style=${styleMap({ "--tc-fcl-bubble-scale": String(0.45 + 0.55 * size) })}
                @focus=${() => (this.activeId = c.id)}
                @click=${() => this.setOpen(this.open === c.id ? null : c.id)}
              >
                <span class="ui-fcl__bubble-count" aria-hidden="true">${this.num(c.count)}</span>
                <span class="ui-fcl__bubble-label">${c.label}</span>
              </button>
              <span class="ui-fcl__sr" id=${`${this.uid}-${c.id}-bfacts`}>${this.num(c.count)} chats, ${this.pct(this.shareOf(c))}${c.trend ? `, ${clusterTrendWords(c.trend)}` : ""}</span>
            </div>`;
          },
        )}
      </div>
      ${open ? html`<div class="ui-fcl__bubble-detail"><p class="ui-fcl__bubble-title" id=${`${this.uid}-${open.id}-name`}>${open.label}</p>${this.renderDetail(open, `${this.uid}-${open.id}`)}</div>` : nothing}`;
  }

  protected override render() {
    const l = this.l;
    const id = this.uid;
    const list = this.shown;
    const stop = list.some((c) => c.id === this.activeId) ? this.activeId : (list[0]?.id ?? "");
    const max = Math.max(0, ...list.map((c) => c.count));
    const all = this.all;
    const topics = this.clusters.length;
    const filtered = this.criterion ? list.reduce((s, c) => s + c.count, 0) : 0;
    const summary = !topics
      ? ""
      : this.criterion
        ? `${this.num(filtered)} of ${this.num(all)} failing chats fail ${this.criterion}`
        : `${this.num(all)} failing ${all === 1 ? "chat" : "chats"} in ${topics} ${topics === 1 ? "topic" : "topics"}`;
    const criteria = this.criteria;
    return html`
      <span class="ui-fcl__sr" role="status">${this.status}</span>
      ${cardHead({
        icon: clustersIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: html`<span class="ui-fcl__total">${summary}</span>`,
      })}
      <div class="ui-fcl__card">
        ${criteria.length || !this.hideView
          ? html`<div class="ui-fcl__tools">
              ${criteria.length
                ? html`<fieldset class="ui-fcl__filter">
                    <legend class="ui-fcl__sr">${l.filter}</legend>
                    ${[null, ...criteria].map(
                      (k) => html`<label class="ui-fcl__pill">
                        <input type="radio" name=${`${id}-crit`} .checked=${live(this.criterion === k)} @change=${() => this.setCriterion(k)} />
                        <span>${k ?? l.all}</span>
                      </label>`,
                    )}
                  </fieldset>`
                : html`<span></span>`}
              ${this.hideView
                ? nothing
                : html`<div class="ui-fcl__views" role="group" aria-label="View">
                    ${(["list", "bubbles"] as const).map(
                      (v) => html`<button type="button" class="ui-fcl__view" data-view=${v} aria-pressed=${this.view === v ? "true" : "false"} @click=${() => this.setView(v)}>${v === "list" ? l.list : l.bubbles}</button>`,
                    )}
                  </div>`}
            </div>`
          : nothing}
        ${!topics
          ? html`<p class="ui-fcl__empty">${l.empty}</p>`
          : !list.length
            ? html`<p class="ui-fcl__empty">${l.noMatch}</p>`
            : this.view === "bubbles"
              ? this.renderBubbles(list, stop, max)
              : html`<ol class="ui-fcl__list" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
                  ${repeat(list, (c) => c.id, (c, i) => this.renderRow(c, i + 1, stop, max))}
                </ol>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fcl"] {
  position: relative; box-sizing: border-box; width: 100%; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); text-align: left; -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fcl"] {
  position: relative; box-sizing: border-box; width: 100%; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="fcl"] { --tc-fcl-bar-h: 6px; --tc-fcl-bubble: 116px; }
[data-ui="fcl"] *, [data-ui="fcl"] *::before, [data-ui="fcl"] *::after { box-sizing: border-box; }
[data-ui="fcl"] p, [data-ui="fcl"] blockquote, [data-ui="fcl"] fieldset { margin: 0; }
[data-ui="fcl"] fieldset { padding: 0; border: 0; min-width: 0; }
[data-ui="fcl"] :is(ol, ul) { margin: 0; padding: 0; list-style: none; }
[data-ui="fcl"] svg { display: block; flex: none; }
:where([data-ui="fcl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="fcl"] :is(button, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-fcl__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fcl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-fcl__total { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- Filter and view ----- */
.ui-fcl__tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-3) 0; }
.ui-fcl__filter { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-fcl__pill { position: relative; display: inline-flex; }
.ui-fcl__pill input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.ui-fcl__pill span { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fcl__pill input:hover + span { background: var(--tc-fill-hover); }
.ui-fcl__pill input:checked + span { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
.ui-fcl__pill input:focus-visible + span { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-fcl__views { display: inline-flex; padding: var(--tc-space-0-5); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-fcl__view { height: calc(var(--tc-control-h-sm) - 2 * var(--tc-space-0-5)); padding: 0 var(--tc-space-2-5) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-fcl__view[aria-pressed="true"] { background: var(--tc-surface-raised) !important; box-shadow: var(--tc-shadow-control); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
/* ----- The ranked list ----- */
.ui-fcl__list { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3) !important; }
.ui-fcl__item { border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-fcl__item[data-open] { background: var(--tc-fill-subtle); }
.ui-fcl__row { display: flex; align-items: center; gap: var(--tc-space-3); width: 100%; min-height: var(--tc-control-h-lg); padding: var(--tc-space-2-5) var(--tc-space-3) !important; border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fcl__row:hover { background: var(--tc-fill-hover); }
.ui-fcl__rank { flex: none; width: var(--tc-space-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; text-align: right; }
.ui-fcl__main { display: grid; flex: 1; gap: var(--tc-space-1-5); min-width: 0; }
.ui-fcl__top { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-fcl__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-fcl__known { flex: none; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); color: var(--tc-text-secondary); }
.ui-fcl__bar { display: block; height: var(--tc-fcl-bar-h); border-radius: var(--tc-radius-full); background: var(--tc-meter-track); overflow: hidden; }
.ui-fcl__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-status-danger-solid); transition: width var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-fcl__item[data-known] .ui-fcl__fill { background: var(--tc-border-strong); }
.ui-fcl__item[data-known] .ui-fcl__name { color: var(--tc-text-secondary); }
.ui-fcl__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-fcl__count { font-variant-numeric: tabular-nums; }
.ui-fcl__trend { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); font-weight: var(--tc-font-weight-medium); }
.ui-fcl__trend svg { width: var(--tc-space-3); height: var(--tc-space-3); }
.ui-fcl__trend[data-direction="up"] { color: var(--tc-status-danger-fg); }
.ui-fcl__trend[data-direction="down"] { color: var(--tc-status-success-fg); }
.ui-fcl__chip { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-fcl__chevron { width: var(--tc-space-4); height: var(--tc-space-4); color: var(--tc-icon-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fcl__row[aria-expanded="true"] .ui-fcl__chevron { transform: rotate(180deg); }
/* ----- A cluster opened ----- */
.ui-fcl__detail { display: grid; gap: var(--tc-space-2-5); padding: 0 var(--tc-space-3) var(--tc-space-3) calc(var(--tc-space-5) + var(--tc-space-6)); }
.ui-fcl__summary { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-fcl__examples-title { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-fcl__examples { display: grid; gap: var(--tc-space-1-5); }
.ui-fcl__quote { padding: var(--tc-space-1-5) var(--tc-space-2-5); border-left: var(--tc-space-0-5) solid var(--tc-border-strong); border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-fcl__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-fcl__btn { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg) !important; box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; }
.ui-fcl__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-fcl__btn[data-tone="primary"] { background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-fcl__done { font-size: var(--tc-font-size-sm); color: var(--tc-status-success-fg); }
/* ----- Bubbles ----- */
.ui-fcl__bubbles { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--tc-space-2); padding: var(--tc-space-4) var(--tc-space-3); }
.ui-fcl__bubble { display: grid; place-content: center; gap: var(--tc-space-0-5); width: calc(var(--tc-fcl-bubble) * var(--tc-fcl-bubble-scale, 1)); aspect-ratio: 1; padding: var(--tc-space-2) !important; border-radius: 50%; background: var(--tc-status-danger-bg) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); color: var(--tc-status-danger-fg); text-align: center; }
.ui-fcl__bubble[data-known] { background: var(--tc-fill-default) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); }
.ui-fcl__bubble[aria-pressed="true"] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-border-selected); }
.ui-fcl__bubble-count { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-fcl__bubble-label { font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); overflow-wrap: anywhere; }
.ui-fcl__bubble-detail { display: grid; gap: var(--tc-space-2); margin: 0 var(--tc-space-3) var(--tc-space-3); padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-fcl__bubble-detail .ui-fcl__detail { padding: 0; }
.ui-fcl__bubble-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-fcl__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 480px) {
  .ui-fcl__detail { padding-left: var(--tc-space-3); }
  .ui-fcl__rank { display: none; }
  [data-ui="fcl"] { --tc-fcl-bubble: 88px; }
}
@media (forced-colors: active) {
  .ui-fcl__fill { background: CanvasText; }
  .ui-fcl__item, .ui-fcl__bubble { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="fcl"] *, [data-ui="fcl"] *::before, [data-ui="fcl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-failure-clusters")) customElements.define("tc-failure-clusters", TcFailureClusters);

declare global {
  interface HTMLElementTagNameMap {
    "tc-failure-clusters": TcFailureClusters;
  }
}
