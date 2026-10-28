import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-place-list> – the places on record for a person, an account or a business: each with its type (Residence, Work,
 * Frequent, Former, Other – or the page's own, each with an icon), whether it's confirmed (Confirmed, Unverified,
 * Vacated … in words with a mark), the address, optional coordinates in mono and when it applies ("Jun 2021 –",
 * "Until 2020", or the page's own words such as "Visits 2024 –"). Picking a place fires a cancelable
 * tc-selected-change, so a page can show it on a map such as tc-world-map.
 *   · the list is a single-select listbox: ↑ / ↓ move, Home / End to the ends, Enter or Space selects or clears,
 *     Escape clears
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-place-list .places=${[{ id: "p1", type: "residence", status: "confirmed",
 *     address: "14 Harbour Row, Leith, Edinburgh", since: Date.parse("2021-06-01") }]}></tc-place-list>
 */

/** A map pin: Lucide (ISC, lucide.dev) */
const pinIcon = svg`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`;

export type PlaceTone = "success" | "info" | "warning" | "danger" | "neutral";
export type PlaceIcon = "home" | "work" | "star" | "history" | "pin";
export type PlaceRecord = {
  id: string;
  /** A short name, e.g. "Primary residence"; by default the type's label */
  name?: string;
  /** A key of `types`: residence, work, frequent, former, other – or the page's own */
  type: string;
  /** A key of `statuses`: confirmed, unverified, vacated – or the page's own */
  status?: string;
  address: string;
  /** [latitude, longitude] */
  coords?: [number, number];
  /** When it started to apply, as epoch ms */
  since?: number;
  /** When it stopped, as epoch ms */
  until?: number;
  /** The period in your own words, replacing since / until: "Visits 2024 –" */
  span?: string;
  /** One quiet line, e.g. "Registered office" */
  note?: string;
};

/** Details of the events */
export type PlaceSelectedChange = { selected: string | null; place?: PlaceRecord };

/** The types' names, tones and icons used when the page gives none */
export const defaultPlaceTypes: Record<string, { label: string; tone: PlaceTone; icon: PlaceIcon }> = {
  residence: { label: "Residence", tone: "info", icon: "home" },
  work: { label: "Work", tone: "success", icon: "work" },
  frequent: { label: "Frequent", tone: "warning", icon: "star" },
  former: { label: "Former", tone: "neutral", icon: "history" },
  other: { label: "Other", tone: "neutral", icon: "pin" },
};
/** The statuses' names and tones used when the page gives none */
export const defaultPlaceStatuses: Record<string, { label: string; tone: PlaceTone }> = {
  confirmed: { label: "Confirmed", tone: "success" },
  unverified: { label: "Unverified", tone: "warning" },
  vacated: { label: "Vacated", tone: "neutral" },
};

let uidCount = 0;

/* House, briefcase, star, history, pin and the status marks: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON: Record<PlaceIcon, () => ReturnType<typeof lucide>> = {
  home: () => lucide(16, svg`<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>`),
  work: () => lucide(16, svg`<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path><rect width="20" height="14" x="2" y="6" rx="2"></rect>`),
  star: () => lucide(16, svg`<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>`),
  history: () => lucide(16, svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path>`),
  pin: () => lucide(16, svg`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`),
};
const MARK: Record<PlaceTone, () => ReturnType<typeof lucide>> = {
  success: () => lucide(11, svg`<path d="M20 6 9 17l-5-5"></path>`),
  info: () => lucide(11, svg`<circle cx="12" cy="12" r="4" fill="currentColor"></circle>`),
  warning: () => lucide(11, svg`<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>`),
  danger: () => lucide(11, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`),
  neutral: () => lucide(11, svg`<path d="M5 12h14"></path>`),
};

/**
 * Places on record – type with an icon, whether each is confirmed, the address, coordinates and when it applies –
 * with a place picked for a map.
 * @tag tc-place-list
 * @fires tc-selected-change - A place was picked or cleared ({ selected, place }: PlaceSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcPlaceList extends TcElement {
  static override ui = "plc";

  /** The heading, and the list's name */
  @property() accessor heading = "Places";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The places, in order */
  @property({ attribute: false }) accessor places: PlaceRecord[] = [];
  /** Types' names, tones and icons, merged over the defaults (residence, work, frequent, former, other) */
  @property({ attribute: false }) accessor types: Record<string, { label: string; tone: PlaceTone; icon?: PlaceIcon }> = {};
  /** Statuses' names and tones, merged over the defaults (confirmed, unverified, vacated) */
  @property({ attribute: false }) accessor statuses: Record<string, { label: string; tone: PlaceTone }> = {};
  /** Shows each place's coordinates under its address */
  @property({ type: Boolean }) accessor coordinates = true;
  /** The picked place. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-plc-${++uidCount}`;

  private typeOf(key: string) {
    const t = this.types[key] ?? defaultPlaceTypes[key];
    return { label: t?.label ?? (key ? key[0].toUpperCase() + key.slice(1) : "Place"), tone: t?.tone ?? ("neutral" as PlaceTone), icon: t?.icon ?? ("pin" as PlaceIcon) };
  }
  private statusOf(key: string | undefined) {
    if (!key) return null;
    return this.statuses[key] ?? defaultPlaceStatuses[key] ?? { label: key[0].toUpperCase() + key.slice(1), tone: "neutral" as PlaceTone };
  }
  private spanOf(p: PlaceRecord) {
    if (p.span) return p.span;
    const f = (ms: number) => new Intl.DateTimeFormat(this.locale, { month: "short", year: "numeric" }).format(ms);
    if (p.since !== undefined && p.until !== undefined) return `${f(p.since)} – ${f(p.until)}`;
    if (p.since !== undefined) return `${f(p.since)} –`;
    if (p.until !== undefined) return `Until ${f(p.until)}`;
    return "";
  }
  private coordsText([lat, lon]: [number, number]) {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const place = next ? this.places.find((p) => p.id === next) : undefined;
    if (!this.emit<PlaceSelectedChange>("tc-selected-change", { selected: next, place }, { cancelable: true })) return;
    this.selected = next;
    this.announce = place ? `${place.name ?? this.typeOf(place.type).label} selected` : "Selection cleared";
  }

  private get stop() {
    const ids = this.places.map((p) => p.id);
    if (this.active && ids.includes(this.active)) return this.active;
    if (this.selected && ids.includes(this.selected)) return this.selected;
    return ids[0] ?? null;
  }
  private onKey = (e: KeyboardEvent) => {
    const opt = (e.target as HTMLElement).closest<HTMLElement>("[data-place]");
    if (!opt || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const ids = this.places.map((p) => p.id);
    const id = opt.dataset.place!;
    const i = ids.indexOf(id);
    const to: Record<string, number> = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: ids.length - 1 };
    if (e.key in to) {
      e.preventDefault();
      const next = ids[Math.max(0, Math.min(ids.length - 1, to[e.key]))];
      this.active = next;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-place="${CSS.escape(next)}"]`)?.focus());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(this.selected === id ? null : id);
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.selected && !this.places.some((p) => p.id === this.selected)) this.selected = null;
  }

  private renderPlace(p: PlaceRecord, stop: string | null) {
    const t = this.typeOf(p.type);
    const st = this.statusOf(p.status);
    const span = this.spanOf(p);
    const sel = this.selected === p.id;
    return html`<li
      class="ui-plc__place"
      role="option"
      data-place=${p.id}
      data-tone=${t.tone}
      aria-selected=${sel ? "true" : "false"}
      tabindex=${stop === p.id ? 0 : -1}
      @focus=${() => (this.active = p.id)}
      @click=${() => {
        this.active = p.id;
        this.setSelected(sel ? null : p.id);
      }}
    >
      <span class="ui-plc__icon" aria-hidden="true">${ICON[t.icon]()}</span>
      <span class="ui-plc__main">
        <span class="ui-plc__head">
          <span class="ui-plc__name">${p.name ?? t.label}</span>
          ${p.name ? html`<span class="ui-plc__type">${t.label}</span>` : nothing}
          ${st ? html`<span class="ui-plc__status" data-tone=${st.tone}>${MARK[st.tone]()}${st.label}</span>` : nothing}
        </span>
        <span class="ui-plc__address">${p.address}</span>
        ${this.coordinates && p.coords ? html`<span class="ui-plc__coords"><span class="ui-plc__sr">Coordinates </span>${this.coordsText(p.coords)}</span>` : nothing}
        ${p.note ? html`<span class="ui-plc__note">${p.note}</span>` : nothing}
      </span>
      ${span ? html`<span class="ui-plc__span">${span}</span>` : nothing}
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const n = this.places.length;
    const stop = this.stop;
    return html`
      <span class="ui-plc__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: pinIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: n ? html`<span class="ui-plc__count">${n} ${n === 1 ? "place" : "places"}</span>` : nothing,
      })}
      <div class="ui-plc__card">
        ${n
          ? html`<ul class="ui-plc__list" role="listbox" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
              ${repeat(this.places, (p) => p.id, (p) => this.renderPlace(p, stop))}
            </ul>`
          : html`<p class="ui-plc__empty">No places on record.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="plc"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="plc"] {
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
[data-ui="plc"] *, [data-ui="plc"] *::before, [data-ui="plc"] *::after { box-sizing: border-box; }
[data-ui="plc"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="plc"] p { margin: 0; }
[data-ui="plc"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="plc"] svg[stroke-width] { stroke-width: 1.6; }
.ui-plc__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-plc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-plc__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* Tones */
[data-ui="plc"] [data-tone="success"] { --tc-plc-tone: var(--tc-status-success-fg); --tc-plc-tone-bg: var(--tc-status-success-bg); }
[data-ui="plc"] [data-tone="info"] { --tc-plc-tone: var(--tc-status-info-fg); --tc-plc-tone-bg: var(--tc-status-info-bg); }
[data-ui="plc"] [data-tone="warning"] { --tc-plc-tone: var(--tc-status-warning-fg); --tc-plc-tone-bg: var(--tc-status-warning-bg); }
[data-ui="plc"] [data-tone="danger"] { --tc-plc-tone: var(--tc-status-danger-fg); --tc-plc-tone-bg: var(--tc-status-danger-bg); }
[data-ui="plc"] [data-tone="neutral"] { --tc-plc-tone: var(--tc-text-muted); --tc-plc-tone-bg: var(--tc-fill-default); }
/* ----- A place ----- */
.ui-plc__place { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); cursor: pointer; outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-plc__place + .ui-plc__place { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-plc__place:hover { background: var(--tc-fill-subtle); }
.ui-plc__place[aria-selected="true"] { background: var(--tc-fill-selected); box-shadow: inset 2px 0 0 var(--tc-border-selected); }
/* Muted text keeps its contrast on the selected tint */
.ui-plc__place[aria-selected="true"] :is(.ui-plc__type, .ui-plc__span, .ui-plc__coords, .ui-plc__note) { color: var(--tc-text-secondary); }
.ui-plc__place:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-plc__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-md); background: var(--tc-plc-tone-bg); color: var(--tc-plc-tone); }
.ui-plc__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-plc__head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-plc__name { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-plc__name { font-weight: var(--tc-font-weight-medium); }
.ui-plc__type { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-plc__status { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; background: var(--tc-plc-tone-bg); color: var(--tc-plc-tone); }
.ui-plc__address { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-plc__coords { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-plc__note { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-plc__span { padding-top: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-plc__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 420px) {
  .ui-plc__place { grid-template-columns: auto minmax(0, 1fr); }
  .ui-plc__span { grid-column: 2; padding-top: 0; }
}
@media (forced-colors: active) { .ui-plc__status { border: 1px solid CanvasText; } .ui-plc__place[aria-selected="true"] { outline: 2px solid Highlight; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="plc"] *, [data-ui="plc"] *::before, [data-ui="plc"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-place-list")) customElements.define("tc-place-list", TcPlaceList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-place-list": TcPlaceList;
  }
}
