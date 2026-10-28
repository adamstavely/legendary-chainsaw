import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { factBand, gradeWords, type FactBand } from "./fact-sheet";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-travel-itinerary> – trips as legs, for a travel audit or an expense review: each leg's date, its route as codes
 * (FROM → TO, the places' names on hover and for screen readers), the mode with its carrier or road, the document it
 * was booked on, how confident the record is (a meter, the % and a word), where the record came from with its
 * reliability grade, and flags such as "No record", "Cash ticket" or "Identity mismatch" in words with a mark.
 * Grouped, consecutive legs become journeys headed by their route – LYS → IST → DXB → GVA → LYS – and their dates.
 *   · the legs are one tab stop: ↑ / ↓ move between them, Home / End to the first and last; Enter opens a leg (tc-open)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-travel-itinerary .legs=${[{ id: "l1", date: Date.parse("2026-05-28"), from: "LYS", to: "IST", mode: "air",
 *     carrier: "TK1814", confidence: 0.99 }]}></tc-travel-itinerary>
 */

/** A route: Lucide (ISC, lucide.dev) */
const routeIcon = svg`<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>`;

export type TravelMode = "air" | "rail" | "road" | "sea" | "other";
export type TravelFlagTone = "warning" | "danger" | "info";
/** A place: its short code ("LYS") and, optionally, its name ("Lyon Saint-Exupéry") */
export type TravelPlace = { code: string; name?: string };
/** Where a record came from: any label, with an optional Admiralty grade */
export type TravelSource = { label: string; grade?: string; note?: string };
export type TravelLeg = {
  id: string;
  /** When it departed, as epoch ms */
  date: number;
  from: TravelPlace | string;
  to: TravelPlace | string;
  mode: TravelMode;
  /** The flight, train or road: "TK1814", "TGV 6612", "A40" */
  carrier?: string;
  /** The document it was booked or crossed on: "Passport ••4471" */
  document?: string;
  /** How sure the record is, 0–1 */
  confidence?: number;
  source?: TravelSource;
  /** Keys of `flags`, e.g. "no-record", "cash", "mismatch" – or the page's own */
  flags?: string[];
  /** Legs with the same journey id are grouped together; without ids, consecutive connecting legs are */
  journey?: string;
};

/** Details of the events */
export type TravelOpen = { id: string; leg: TravelLeg };

/** The flags' words and tones used when the page gives none */
export const defaultTravelFlags: Record<string, { label: string; tone: TravelFlagTone }> = {
  "no-record": { label: "No record", tone: "warning" },
  cash: { label: "Cash ticket", tone: "warning" },
  mismatch: { label: "Identity mismatch", tone: "danger" },
};

const BAND_LABEL: Record<FactBand, string> = { high: "High confidence", medium: "Medium confidence", low: "Low confidence", unknown: "Confidence unknown" };
const BARS: Record<FactBand, number> = { high: 3, medium: 2, low: 1, unknown: 0 };
const DAY = 86_400_000;
let uidCount = 0;

/* Plane, train, car, ship, map pin, alert, octagon-x and arrow: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MODE_ICON: Record<TravelMode, () => ReturnType<typeof lucide>> = {
  air: () => lucide(15, svg`<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path>`),
  rail: () => lucide(15, svg`<rect width="16" height="16" x="4" y="3" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="m8 19-2 3"></path><path d="m18 22-2-3"></path><path d="M8 15h.01"></path><path d="M16 15h.01"></path>`),
  road: () => lucide(15, svg`<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle>`),
  sea: () => lucide(15, svg`<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"></path><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"></path><path d="M12 10v4"></path><path d="M12 2v3"></path>`),
  other: () => lucide(15, svg`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`),
};
const MODE_LABEL: Record<TravelMode, string> = { air: "Air", rail: "Rail", road: "Road", sea: "Sea", other: "Other" };
const FLAG_MARK: Record<TravelFlagTone, () => ReturnType<typeof lucide>> = {
  warning: () => lucide(11, svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`),
  danger: () => lucide(11, svg`<path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"></path><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`),
  info: () => lucide(11, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>`),
};
const arrowIcon = () => lucide(14, svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`);

const place = (p: TravelPlace | string): TravelPlace => (typeof p === "string" ? { code: p } : p);

/**
 * Trips as legs – route, mode and carrier, document, confidence, source and grade, and flags – grouped into
 * journeys headed by their route.
 * @tag tc-travel-itinerary
 * @fires tc-open - A leg was opened ({ id, leg }: TravelOpen)
 */
export class TcTravelItinerary extends TcElement {
  static override ui = "trit";

  /** The heading, and the list's name */
  @property() accessor heading = "Travel";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The legs, in any order – the element sorts them by date */
  @property({ attribute: false }) accessor legs: TravelLeg[] = [];
  /** Flags' words and tones, merged over the defaults (no-record, cash, mismatch) */
  @property({ attribute: false }) accessor flags: Record<string, { label: string; tone: TravelFlagTone }> = {};
  /** Groups legs into journeys: by their `journey` id, else consecutive legs that connect within `gap-days` */
  @property({ type: Boolean }) accessor grouped = false;
  /** How many days may pass between two connecting legs of one journey, when they have no journey id */
  @property({ type: Number, attribute: "gap-days" }) accessor gapDays = 14;
  /** "oldest" first (the default) or "newest" first */
  @property() accessor order: "oldest" | "newest" = "oldest";
  /** Confidence below this reads as low and is drawn in warning; at or above 0.9 it reads as high */
  @property({ type: Number, attribute: "low-confidence" }) accessor lowConfidence = 0.75;
  /** The language for dates and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active: string | null = null;

  private uid = `tc-trit-${++uidCount}`;

  /* ---------- The model ---------- */

  private flagOf(key: string) {
    return this.flags[key] ?? defaultTravelFlags[key] ?? { label: key, tone: "warning" as TravelFlagTone };
  }
  private get sorted() {
    const dir = this.order === "newest" ? -1 : 1;
    return [...this.legs].sort((a, b) => (a.date - b.date) * dir);
  }
  /** The legs in display order, split into journeys when grouped */
  private get journeys(): TravelLeg[][] {
    const legs = this.sorted;
    if (!this.grouped) return legs.length ? [legs] : [];
    // Chronological to decide what connects, then back to the display order
    const asc = [...legs].sort((a, b) => a.date - b.date);
    const out: TravelLeg[][] = [];
    for (const leg of asc) {
      const cur = out[out.length - 1];
      const prev = cur?.[cur.length - 1];
      const joins = prev && (leg.journey !== undefined || prev.journey !== undefined ? leg.journey === prev.journey : place(prev.to).code === place(leg.from).code && leg.date - prev.date <= this.gapDays * DAY);
      if (joins) cur.push(leg);
      else out.push([leg]);
    }
    return this.order === "newest" ? out.reverse().map((j) => j.reverse()) : out;
  }
  private confidenceWord(c: number) {
    return c >= 0.9 ? "High" : c >= this.lowConfidence ? "Medium" : "Low";
  }
  private dateText(ms: number, withYear = false) {
    return new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(ms);
  }
  /** "LYS → IST → DXB" for a journey in travel order */
  private routeOf(legs: TravelLeg[]) {
    const asc = [...legs].sort((a, b) => a.date - b.date);
    const codes = [place(asc[0].from).code];
    for (const l of asc) {
      if (codes[codes.length - 1] !== place(l.from).code) codes.push(place(l.from).code);
      codes.push(place(l.to).code);
    }
    return codes;
  }

  /* ---------- Keyboard: one tab stop for the legs ---------- */

  private get legOrder() {
    return this.journeys.flat().map((l) => l.id);
  }
  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-leg]");
    if (!btn || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const ids = this.legOrder;
    const i = ids.indexOf(btn.dataset.leg!);
    const to: Record<string, number> = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: ids.length - 1 };
    if (!(e.key in to)) return;
    e.preventDefault();
    const id = ids[Math.max(0, Math.min(ids.length - 1, to[e.key]))];
    this.active = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-leg="${CSS.escape(id)}"]`)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.active && !this.legs.some((l) => l.id === this.active)) this.active = null;
  }

  /* ---------- Rendering ---------- */

  private renderSource(source: TravelSource) {
    const band = factBand(source.grade);
    const words = gradeWords(source.grade);
    const grade = source.grade?.toUpperCase();
    return html`<span class="ui-trit__src" data-band=${band} title=${`${BAND_LABEL[band]}${words ? ` – ${words}` : ""}${source.note ? `\n${source.note}` : ""}`}>
      <span class="ui-trit__bars" aria-hidden="true">${[1, 2, 3].map((b) => html`<span class="ui-trit__bar" ?data-on=${b <= BARS[band]}></span>`)}</span>
      <span aria-hidden="true">${source.label}${grade ? html` · ${grade}` : nothing}</span>
      <span class="ui-trit__sr">Source: ${source.label}${grade ? `, grade ${grade}` : ""}${words ? ` (${words})` : ""}</span>
    </span>`;
  }

  private renderLeg(leg: TravelLeg, stop: string | null) {
    const from = place(leg.from);
    const to = place(leg.to);
    const c = leg.confidence;
    const low = c !== undefined && c < this.lowConfidence;
    const name = `${from.name ?? from.code} to ${to.name ?? to.code}, ${this.dateText(leg.date, true)}`;
    return html`<li class="ui-trit__leg" ?data-flagged=${!!leg.flags?.length}>
      <button
        type="button"
        class="ui-trit__open"
        data-leg=${leg.id}
        tabindex=${stop === leg.id ? 0 : -1}
        aria-label=${`Open ${name}`}
        @focus=${() => (this.active = leg.id)}
        @click=${() => {
          this.active = leg.id;
          this.emit<TravelOpen>("tc-open", { id: leg.id, leg });
        }}
      ></button>
      <time class="ui-trit__date" datetime=${new Date(leg.date).toISOString()}>${this.dateText(leg.date)}</time>
      <span class="ui-trit__route">
        <span class="ui-trit__code" title=${from.name ?? from.code}>${from.code}</span>
        <span class="ui-trit__arrow" aria-hidden="true">${arrowIcon()}</span>
        <span class="ui-trit__sr"> to </span>
        <span class="ui-trit__code" title=${to.name ?? to.code}>${to.code}</span>
        ${from.name || to.name ? html`<span class="ui-trit__sr"> (${from.name ?? from.code} to ${to.name ?? to.code})</span>` : nothing}
      </span>
      <span class="ui-trit__mode" data-mode=${leg.mode}>
        ${MODE_ICON[leg.mode]()}<span class="ui-trit__sr">${MODE_LABEL[leg.mode]}</span>${leg.carrier ? html`<span class="ui-trit__carrier">${leg.carrier}</span>` : html`<span aria-hidden="true">${MODE_LABEL[leg.mode]}</span>`}
      </span>
      <span class="ui-trit__doc">${leg.document ? html`<span class="ui-trit__sr">Document </span>${leg.document}` : html`<span class="ui-trit__none">No document</span>`}</span>
      <span class="ui-trit__conf" ?data-low=${low}>
        ${c === undefined
          ? html`<span class="ui-trit__none">–</span>`
          : html`<span class="ui-trit__meter" aria-hidden="true"><span class="ui-trit__meter-fill" style=${`inline-size: ${Math.round(Math.max(0, Math.min(1, c)) * 100)}%`}></span></span>
              <span class="ui-trit__pct">${Math.round(c * 100)}%</span><span class="ui-trit__sr"> confidence, ${this.confidenceWord(c).toLowerCase()}</span>`}
      </span>
      <span class="ui-trit__meta">
        ${leg.source ? this.renderSource(leg.source) : nothing}
        ${(leg.flags ?? []).map((k) => {
          const f = this.flagOf(k);
          return html`<span class="ui-trit__flag" data-tone=${f.tone}>${FLAG_MARK[f.tone]()}${f.label}</span>`;
        })}
      </span>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const journeys = this.journeys;
    const ids = journeys.flat().map((l) => l.id);
    const stop = this.active && ids.includes(this.active) ? this.active : (ids[0] ?? null);
    const n = this.legs.length;
    const flagged = this.legs.filter((l) => l.flags?.length).length;
    return html`
      <span class="ui-trit__sr" id=${`${id}-keys`}>Up and down arrows move between legs; Enter opens one</span>
      ${cardHead({
        icon: routeIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: n
          ? html`<span class="ui-trit__count">${n} ${n === 1 ? "leg" : "legs"}${flagged ? html` · <span class="ui-trit__count-flagged">${flagged} flagged</span>` : nothing}</span>`
          : nothing,
      })}
      <div class="ui-trit__card">
        ${n
          ? html`<div class="ui-trit__list" role="group" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey}>
              ${journeys.map((legs, j) => {
                const route = this.routeOf(legs);
                const asc = [...legs].sort((a, b) => a.date - b.date);
                const span = asc.length > 1 ? `${this.dateText(asc[0].date)} – ${this.dateText(asc[asc.length - 1].date, true)}` : this.dateText(asc[0].date, true);
                return html`<section class="ui-trit__journey" aria-label=${this.grouped ? `Journey ${j + 1}: ${route.join(" to ")}` : "Legs"}>
                  ${this.grouped
                    ? html`<div class="ui-trit__journey-head">
                        <span class="ui-trit__journey-route" aria-hidden="true">${route.map((c, i) => html`${i ? html`<span class="ui-trit__journey-sep">→</span>` : nothing}<span>${c}</span>`)}</span>
                        <span class="ui-trit__journey-meta">${span} · ${legs.length} ${legs.length === 1 ? "leg" : "legs"}</span>
                      </div>`
                    : nothing}
                  <ol class="ui-trit__legs">${legs.map((l) => this.renderLeg(l, stop))}</ol>
                </section>`;
              })}
            </div>`
          : html`<p class="ui-trit__empty">No travel on record.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="trit"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="trit"] {
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
[data-ui="trit"] *, [data-ui="trit"] *::before, [data-ui="trit"] *::after { box-sizing: border-box; }
:where([data-ui="trit"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="trit"] ul, [data-ui="trit"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="trit"] p { margin: 0; }
[data-ui="trit"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="trit"] svg[stroke-width] { stroke-width: 1.6; }
.ui-trit__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-trit__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-trit__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-trit__count-flagged { color: var(--tc-status-warning-fg); }
/* ----- Journeys ----- */
.ui-trit__journey + .ui-trit__journey { border-top: var(--tc-hairline) solid var(--tc-border-default); }
.ui-trit__journey-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); }
.ui-trit__journey-route { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-trit__journey-sep { color: var(--tc-text-muted); }
.ui-trit__journey-meta { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* ----- A leg: one row, the whole row its open button ----- */
.ui-trit__leg { position: relative; display: grid; grid-template-columns: 52px minmax(96px, auto) minmax(84px, auto) minmax(0, 1fr) 112px; grid-template-areas: "date route mode doc conf" ". meta meta meta meta"; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-4); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-trit__leg + .ui-trit__leg { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-trit__leg:hover { background: var(--tc-fill-subtle); }
.ui-trit__open { position: absolute; inset: 0; z-index: 0; border-radius: var(--tc-radius-sm); }
.ui-trit__open:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-trit__leg > :not(.ui-trit__open) { position: relative; pointer-events: none; }
.ui-trit__leg .ui-trit__src { pointer-events: auto; }
.ui-trit__date { grid-area: date; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-transform: uppercase; white-space: nowrap; }
.ui-trit__route { grid-area: route; display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-trit__code { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); pointer-events: auto; }
.ui-trit__arrow { color: var(--tc-icon-muted); }
.ui-trit__mode { grid-area: mode; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-trit__mode > svg { color: var(--tc-icon-muted); }
.ui-trit__carrier { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-trit__doc { grid-area: doc; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.ui-trit__none { color: var(--tc-text-muted); }
.ui-trit__conf { grid-area: conf; display: inline-flex; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); }
.ui-trit__meter { display: block; flex: 1; max-width: 56px; height: 4px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-trit__meter-fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); }
.ui-trit__conf[data-low] .ui-trit__meter-fill { background: var(--tc-status-warning-solid); }
.ui-trit__pct { min-width: 3ch; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); text-align: right; font-variant-numeric: tabular-nums; }
.ui-trit__conf[data-low] .ui-trit__pct { color: var(--tc-status-warning-fg); }
.ui-trit__meta { grid-area: meta; display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); }
.ui-trit__meta:empty { display: none; }
/* Source and grade, as in tc-fact-sheet */
.ui-trit__src { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-radius-badge); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; white-space: nowrap; cursor: help; }
.ui-trit__src[data-band="high"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-trit__src[data-band="medium"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-trit__src[data-band="low"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-trit__src[data-band="unknown"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-trit__bars { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); height: 9px; }
.ui-trit__bar { width: 2px; border-radius: var(--tc-radius-2xs); background: currentColor; opacity: 0.25; }
.ui-trit__bar:nth-child(1) { height: 4px; }
.ui-trit__bar:nth-child(2) { height: 6.5px; }
.ui-trit__bar:nth-child(3) { height: 9px; }
.ui-trit__bar[data-on] { opacity: 1; }
/* A flag: a tint, a mark and a word */
.ui-trit__flag { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-trit__flag[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-trit__flag[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-trit__flag[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-trit__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 600px) {
  .ui-trit__leg { grid-template-columns: 52px minmax(0, 1fr) auto; grid-template-areas: "date route conf" ". mode mode" ". doc doc" ". meta meta"; }
  .ui-trit__doc { white-space: normal; }
}
@media (forced-colors: active) { .ui-trit__src, .ui-trit__flag { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="trit"] *, [data-ui="trit"] *::before, [data-ui="trit"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-travel-itinerary")) customElements.define("tc-travel-itinerary", TcTravelItinerary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-travel-itinerary": TcTravelItinerary;
  }
}
