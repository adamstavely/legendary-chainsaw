import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { factBand, gradeWords, type FactBand } from "./fact-sheet";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-entity-timeline> – what happened to a person, an account or a case, in order: each event with its date, a title,
 * one quiet line of detail, a category tag, where it came from with a reliability grade ("Bank records · B1" – any
 * source label and an Admiralty grade, tinted by confidence like tc-fact-sheet), and an optional flag such as
 * "Auto-flag". Events are grouped under month headers, newest first by default. Category chips with counts filter the
 * list; picking an event opens its detail – a longer note and links – inline.
 *   · the events are one tab stop: ↑ / ↓ move between them, Home / End to the first and last; Enter or Space opens or
 *     closes an event's detail, Escape closes it
 *   · filtering and opening each fire a cancelable event (tc-filter-change, tc-selected-change), so a page can own them
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-entity-timeline .events=${[{ id: "e1", date: Date.parse("2026-06-09"), title: "Account reopened",
 *     category: "account", source: { label: "Core banking", grade: "A1" } }]}></tc-entity-timeline>
 */

/** A clock with a history arrow: Lucide (ISC, lucide.dev) */
const historyIcon = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path>`;

/** The tone a category is drawn in */
export type TimelineTone = "success" | "info" | "warning" | "danger" | "neutral" | "violet";
export type TimelineCategory = { id: string; label: string; tone?: TimelineTone };
/** Where an event came from: any label, with an optional Admiralty grade (A–F reliability, 1–6 credibility) */
export type TimelineSource = { label: string; grade?: string; note?: string };
export type TimelineLink = { label: string; href?: string };
export type TimelineEvent = {
  id: string;
  /** When it happened, as epoch ms */
  date: number;
  title: string;
  /** One quiet line under the title */
  detail?: string;
  /** A category id from `categories` */
  category?: string;
  source?: TimelineSource;
  /** A short flag shown beside the tags, e.g. "Auto-flag" */
  flag?: string;
  /** The longer note shown when the event is opened */
  body?: string;
  /** Attachments or records to open from the detail */
  links?: TimelineLink[];
};

/** Details of the events */
export type TimelineFilterChange = { filter: string };
export type TimelineSelectedChange = { selected: string | null; event?: TimelineEvent };

const BAND_LABEL: Record<FactBand, string> = { high: "High confidence", medium: "Medium confidence", low: "Low confidence", unknown: "Confidence unknown" };
const BARS: Record<FactBand, number> = { high: 3, medium: 2, low: 1, unknown: 0 };
let uidCount = 0;

/* Chevron, flag and paperclip: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const chevronIcon = () => lucide(14, svg`<path d="m6 9 6 6 6-6"></path>`);
const flagIcon = () => lucide(11, svg`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><path d="M4 22v-7"></path>`);
const clipIcon = () => lucide(13, svg`<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>`);

/**
 * A dated record of events grouped by month – each with a category, its source and grade, an optional flag and an
 * inline detail – filtered by category.
 * @tag tc-entity-timeline
 * @fires tc-filter-change - A category chip was picked ({ filter }: TimelineFilterChange; "all" for every category); cancelable – prevented, `filter` stays as it was
 * @fires tc-selected-change - An event's detail opened or closed ({ selected, event }: TimelineSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcEntityTimeline extends TcElement {
  static override ui = "etl";

  /** The heading, and the list's name */
  @property() accessor heading = "Timeline";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The events, in any order – the element sorts them */
  @property({ attribute: false }) accessor events: TimelineEvent[] = [];
  /** The categories events can have, in the order their chips show */
  @property({ attribute: false }) accessor categories: TimelineCategory[] = [];
  /** "newest" first (the default) or "oldest" first */
  @property() accessor order: "newest" | "oldest" = "newest";
  /** The category shown, or "all". Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property() accessor filter = "all";
  /** The event whose detail is open. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-etl-${++uidCount}`;

  /* ---------- The model ---------- */

  private categoryOf(id: string | undefined) {
    return id ? this.categories.find((c) => c.id === id) : undefined;
  }
  private get sorted() {
    const dir = this.order === "oldest" ? 1 : -1;
    return [...this.events].sort((a, b) => (a.date - b.date) * dir);
  }
  private get shown() {
    return this.filter === "all" ? this.sorted : this.sorted.filter((e) => e.category === this.filter);
  }
  private dateText(ms: number) {
    return new Intl.DateTimeFormat(this.locale, { day: "2-digit", month: "short" }).format(ms);
  }
  private fullDate(ms: number) {
    return new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "long", year: "numeric" }).format(ms);
  }

  private setFilter(next: string) {
    if (next === this.filter) return;
    if (!this.emit<TimelineFilterChange>("tc-filter-change", { filter: next }, { cancelable: true })) return;
    this.filter = next;
    const n = next === "all" ? this.events.length : this.events.filter((e) => e.category === next).length;
    this.announce = `${n} ${n === 1 ? "event" : "events"}${next === "all" ? "" : `, ${this.categoryOf(next)?.label ?? next}`}`;
  }
  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const event = next ? this.events.find((e) => e.id === next) : undefined;
    if (!this.emit<TimelineSelectedChange>("tc-selected-change", { selected: next, event }, { cancelable: true })) return;
    this.selected = next;
  }

  /* ---------- Keyboard: one tab stop for the events ---------- */

  private get stop() {
    const ids = this.shown.map((e) => e.id);
    return this.active && ids.includes(this.active) ? this.active : (ids[0] ?? null);
  }
  private focusEvent(id: string) {
    this.active = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-event="${CSS.escape(id)}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-event]");
    if (!btn || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const ids = this.shown.map((x) => x.id);
    const i = ids.indexOf(btn.dataset.event!);
    const to: Record<string, number> = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: ids.length - 1 };
    if (e.key in to) {
      e.preventDefault();
      this.focusEvent(ids[Math.max(0, Math.min(ids.length - 1, to[e.key]))]);
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // An open event that went away, or that the filter hides, closes
    if (this.selected && !this.shown.some((e) => e.id === this.selected)) this.selected = null;
  }

  /* ---------- Rendering ---------- */

  private renderSource(source: TimelineSource) {
    const band = factBand(source.grade);
    const words = gradeWords(source.grade);
    const grade = source.grade?.toUpperCase();
    return html`<span class="ui-etl__src" data-band=${band} title=${`${BAND_LABEL[band]}${words ? ` – ${words}` : ""}${source.note ? `\n${source.note}` : ""}`}>
      <span class="ui-etl__bars" aria-hidden="true">${[1, 2, 3].map((b) => html`<span class="ui-etl__bar" ?data-on=${b <= BARS[band]}></span>`)}</span>
      <span aria-hidden="true">${source.label}${grade ? html` · <span class="ui-etl__grade">${grade}</span>` : nothing}</span>
      <span class="ui-etl__sr">Source: ${source.label}${grade ? `, grade ${grade}` : ""}${words ? ` (${words})` : ""}. ${BAND_LABEL[band]}.</span>
    </span>`;
  }

  private renderEvent(ev: TimelineEvent, stop: string | null) {
    const cat = this.categoryOf(ev.category);
    const open = this.selected === ev.id;
    const hasDetail = !!(ev.body || ev.links?.length);
    const detailId = `${this.uid}-${ev.id}-detail`;
    return html`<li class="ui-etl__event" data-tone=${cat?.tone ?? "neutral"} ?data-open=${open}>
      <span class="ui-etl__dot" aria-hidden="true"></span>
      <time class="ui-etl__date" datetime=${new Date(ev.date).toISOString()}>${this.dateText(ev.date)}</time>
      <div class="ui-etl__main">
        <button
          type="button"
          class="ui-etl__title"
          data-event=${ev.id}
          tabindex=${stop === ev.id ? 0 : -1}
          aria-expanded=${ifDefined(hasDetail ? (open ? "true" : "false") : undefined)}
          aria-controls=${ifDefined(open && hasDetail ? detailId : undefined)}
          @focus=${() => (this.active = ev.id)}
          @click=${() => {
            this.active = ev.id;
            this.setSelected(open ? null : ev.id);
          }}
        >
          <span class="ui-etl__title-text">${ev.title}</span>
          <span class="ui-etl__sr">, ${this.fullDate(ev.date)}</span>
          ${hasDetail ? html`<span class="ui-etl__chevron">${chevronIcon()}</span>` : nothing}
        </button>
        <span class="ui-etl__tags">
          ${cat ? html`<span class="ui-etl__cat" data-tone=${cat.tone ?? "neutral"}>${cat.label}</span>` : nothing}
          ${ev.source ? this.renderSource(ev.source) : nothing}
          ${ev.flag ? html`<span class="ui-etl__flag">${flagIcon()}${ev.flag}</span>` : nothing}
        </span>
        ${ev.detail ? html`<p class="ui-etl__detail">${ev.detail}</p>` : nothing}
        ${open && hasDetail
          ? html`<div class="ui-etl__more" id=${detailId}>
              ${ev.body ? html`<p class="ui-etl__body">${ev.body}</p>` : nothing}
              ${ev.links?.length
                ? html`<ul class="ui-etl__links" aria-label="Attachments">
                    ${ev.links.map((l) => html`<li>${l.href ? html`<a class="ui-etl__link" href=${l.href}>${clipIcon()}${l.label}</a>` : html`<span class="ui-etl__link">${clipIcon()}${l.label}</span>`}</li>`)}
                  </ul>`
                : nothing}
            </div>`
          : nothing}
      </div>
    </li>`;
  }

  private renderFilters() {
    const counts = new Map<string, number>();
    for (const e of this.events) if (e.category) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    const used = this.categories.filter((c) => counts.has(c.id));
    if (used.length < 2) return nothing;
    const chip = (id: string, label: string, n: number, tone?: TimelineTone) =>
      html`<button type="button" class="ui-etl__chip" data-tone=${tone ?? "neutral"} aria-pressed=${this.filter === id ? "true" : "false"} @click=${() => this.setFilter(id)}>
        ${id === "all" ? nothing : html`<span class="ui-etl__chip-dot" aria-hidden="true"></span>`}${label} <span class="ui-etl__chip-n">${n}</span>
      </button>`;
    return html`<div class="ui-etl__filters" role="group" aria-label="Filter by category">
      ${chip("all", "All", this.events.length)} ${used.map((c) => chip(c.id, c.label, counts.get(c.id)!, c.tone))}
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const shown = this.shown;
    const stop = this.stop;
    const month = new Intl.DateTimeFormat(this.locale, { month: "long", year: "numeric" });
    const groups: { key: string; label: string; events: TimelineEvent[] }[] = [];
    for (const ev of shown) {
      const d = new Date(ev.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const last = groups[groups.length - 1];
      if (last?.key === key) last.events.push(ev);
      else groups.push({ key, label: month.format(ev.date), events: [ev] });
    }
    const n = this.events.length;
    return html`
      <span class="ui-etl__sr" role="status">${this.announce}</span>
      <span class="ui-etl__sr" id=${`${id}-keys`}>Up and down arrows move between events; Enter opens an event's detail</span>
      ${cardHead({
        icon: historyIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: n ? html`<span class="ui-etl__count">${n} ${n === 1 ? "event" : "events"}</span>` : nothing,
      })}
      <div class="ui-etl__card">
        ${n
          ? html`${this.renderFilters()}
              <div class="ui-etl__list" role="group" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey}>
                ${shown.length
                  ? groups.map(
                      (g) => html`<section class="ui-etl__group" aria-label=${g.label}>
                        <h4 class="ui-etl__month">${g.label}</h4>
                        <ol class="ui-etl__events">${repeat(g.events, (e) => e.id, (e) => this.renderEvent(e, stop))}</ol>
                      </section>`,
                    )
                  : html`<p class="ui-etl__empty">No events in this category.</p>`}
              </div>`
          : html`<p class="ui-etl__empty">No events yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="etl"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="etl"] {
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
[data-ui="etl"] *, [data-ui="etl"] *::before, [data-ui="etl"] *::after { box-sizing: border-box; }
:where([data-ui="etl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="etl"] button:focus-visible, [data-ui="etl"] a:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="etl"] ul, [data-ui="etl"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="etl"] p, [data-ui="etl"] h4 { margin: 0; }
[data-ui="etl"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="etl"] svg[stroke-width] { stroke-width: 1.6; }
.ui-etl__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-etl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-etl__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* ----- Filter chips ----- */
.ui-etl__filters { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); }
.ui-etl__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-etl__chip:hover { background: var(--tc-fill-default); }
.ui-etl__chip[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-etl__chip-n { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-etl__chip-dot { width: 7px; height: 7px; border-radius: var(--tc-radius-full); background: var(--tc-etl-tone, var(--tc-icon-muted)); }
/* Tones, shared by chips, categories and the rail dot */
[data-ui="etl"] [data-tone="success"] { --tc-etl-tone: var(--tc-status-success-fg); --tc-etl-tone-bg: var(--tc-status-success-bg); }
[data-ui="etl"] [data-tone="info"] { --tc-etl-tone: var(--tc-status-info-fg); --tc-etl-tone-bg: var(--tc-status-info-bg); }
[data-ui="etl"] [data-tone="warning"] { --tc-etl-tone: var(--tc-status-warning-fg); --tc-etl-tone-bg: var(--tc-status-warning-bg); }
[data-ui="etl"] [data-tone="danger"] { --tc-etl-tone: var(--tc-status-danger-fg); --tc-etl-tone-bg: var(--tc-status-danger-bg); }
[data-ui="etl"] [data-tone="neutral"] { --tc-etl-tone: var(--tc-text-muted); --tc-etl-tone-bg: var(--tc-fill-default); }
[data-ui="etl"] [data-tone="violet"] { --tc-etl-tone: var(--tc-tone-violet-fg); --tc-etl-tone-bg: var(--tc-tone-violet-bg); }
/* ----- Month groups and events on a rail ----- */
.ui-etl__list { padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-4); }
.ui-etl__group + .ui-etl__group { margin-top: var(--tc-space-3); }
.ui-etl__month { padding: var(--tc-space-2) 0 var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-etl__event { position: relative; display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: var(--tc-space-3); padding: var(--tc-space-2-5) 0 var(--tc-space-2-5) var(--tc-space-5); }
.ui-etl__event::before { content: ""; position: absolute; top: 0; bottom: 0; left: 5px; width: var(--tc-hairline); background: var(--tc-border-default); }
.ui-etl__events > .ui-etl__event:first-child::before { top: var(--tc-space-4); }
.ui-etl__events > .ui-etl__event:last-child::before { bottom: calc(100% - var(--tc-space-4)); }
.ui-etl__dot { position: absolute; top: var(--tc-space-3-5); left: 1px; width: 9px; height: 9px; border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--tc-etl-tone); }
.ui-etl__event[data-open] .ui-etl__dot { background: var(--tc-etl-tone); }
.ui-etl__date { padding-top: var(--tc-space-0-5); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-transform: uppercase; white-space: nowrap; }
.ui-etl__main { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-etl__title { display: inline-flex; align-items: center; gap: var(--tc-space-1); justify-self: start; max-width: 100%; border-radius: var(--tc-radius-sm); color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-etl__title { font-weight: var(--tc-font-weight-medium); }
.ui-etl__title:hover .ui-etl__title-text { text-decoration: underline; text-underline-offset: 2px; }
.ui-etl__chevron { color: var(--tc-icon-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-etl__event[data-open] .ui-etl__chevron { transform: rotate(180deg); }
.ui-etl__tags { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); }
.ui-etl__cat, .ui-etl__flag { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-etl__cat { background: var(--tc-etl-tone-bg); color: var(--tc-etl-tone); }
.ui-etl__flag { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
/* The source and its grade: a mono tag tinted by confidence, with bars – as in tc-fact-sheet */
.ui-etl__src { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-radius-badge); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; white-space: nowrap; cursor: help; }
.ui-etl__src[data-band="high"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-etl__src[data-band="medium"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-etl__src[data-band="low"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-etl__src[data-band="unknown"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-etl__bars { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); height: 9px; }
.ui-etl__bar { width: 2px; border-radius: var(--tc-radius-2xs); background: currentColor; opacity: 0.25; }
.ui-etl__bar:nth-child(1) { height: 4px; }
.ui-etl__bar:nth-child(2) { height: 6.5px; }
.ui-etl__bar:nth-child(3) { height: 9px; }
.ui-etl__bar[data-on] { opacity: 1; }
.ui-etl__detail { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
/* ----- An event's detail ----- */
.ui-etl__more { display: grid; gap: var(--tc-space-2); margin-top: var(--tc-space-1); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); animation: ui-etl-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-etl__body { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-etl__links { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5) var(--tc-space-3); }
.ui-etl__link { display: inline-flex; align-items: center; gap: var(--tc-space-1); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-accent-text); text-decoration: none; }
a.ui-etl__link:hover { text-decoration: underline; text-underline-offset: 2px; }
span.ui-etl__link { color: var(--tc-text-secondary); }
.ui-etl__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@keyframes ui-etl-in { from { opacity: 0; transform: translateY(3px); } }
@container (max-width: 440px) {
  .ui-etl__event { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-0-5); }
}
@media (forced-colors: active) { .ui-etl__src, .ui-etl__cat, .ui-etl__flag { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="etl"] *, [data-ui="etl"] *::before, [data-ui="etl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-entity-timeline")) customElements.define("tc-entity-timeline", TcEntityTimeline);

declare global {
  interface HTMLElementTagNameMap {
    "tc-entity-timeline": TcEntityTimeline;
  }
}
