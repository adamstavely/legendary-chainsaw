import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";
import { formatDate, pick } from "./internal/util";

/*
 * <tc-map-itinerary> – a trip planned day by day, with each day's stops on a map. Beside the map, the days as tabs and
 * the chosen day's stops in order – numbered, with the time, what kind of stop it is, how long to stay and how long it
 * takes to get there from the stop before. The map is drawn here, from the stops' coordinates (Web Mercator, fitted to
 * the day or the whole trip): the chosen day's route and numbered markers stand out, the other days stay muted. No
 * map tiles load by default – a quiet grid stands in; give `tileUrl` and the tiles wait behind "Show map tiles", which
 * says which site they load from.
 *   · the days are a tablist: ← / → choose a day (tc-day-change); the stops are a listbox: ↑ / ↓ move, Home / End go to
 *     the ends, Enter or Space picks (tc-stop-select)
 *   · the map's markers are one tab stop too: arrow keys move between the day's stops, Enter or Space picks; picking
 *     on either side lights the stop up on the other
 *   · "Show all days" / "Zoom to day" fits the map to the trip or the chosen day
 * Narrow: the map above, the list below. Standard: the header on a gray tray above a white card. Clean: one white card.
 *
 *   <tc-map-itinerary .days=${[{ id: "d1", label: "Day 1", stops: [{ id: "s1", name: "Belém Tower", lat: 38.6916,
 *     lng: -9.216, time: "10:00", kind: "sight" }] }]}></tc-map-itinerary>
 */

export type ItineraryKindIcon = "sight" | "food" | "stay" | "transport" | "venue" | "pin";
export type ItineraryStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** When, in the trip's own words: "10:00", "Afternoon" */
  time?: string;
  /** A key of `kinds`: sight, food, stay, transport, venue, other – or the page's own */
  kind?: string;
  /** How long to stay, in words: "1 h 30 min" */
  duration?: string;
  /** Getting here from the stop before, in words: "12 min walk" */
  travel?: string;
  /** One quiet line, e.g. "Booked under the institute's name" */
  note?: string;
};
export type ItineraryDay = {
  id: string;
  /** "Day 1", "Arrival" */
  label: string;
  /** The day's date, epoch ms */
  date?: number;
  stops: ItineraryStop[];
};

/** Details of the events */
export type ItineraryDayChange = { day: string; item: ItineraryDay };
export type ItineraryStopSelect = { stop: string | null; item?: ItineraryStop; day?: string };

/** The kinds' names and icons used when the page gives none */
export const defaultItineraryKinds: Record<string, { label: string; icon: ItineraryKindIcon }> = {
  sight: { label: "Sight", icon: "sight" },
  food: { label: "Food", icon: "food" },
  stay: { label: "Stay", icon: "stay" },
  transport: { label: "Transport", icon: "transport" },
  venue: { label: "Venue", icon: "venue" },
  other: { label: "Stop", icon: "pin" },
};

/** Web Mercator: longitude and latitude as 0–1 across the world, x to the east and y to the south */
export function mercator(lat: number, lng: number): [number, number] {
  const phi = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  return [(lng + 180) / 360, (1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2];
}
const latOf = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
const valid = (s: ItineraryStop) => Number.isFinite(s.lat) && Number.isFinite(s.lng) && Math.abs(s.lat) <= 90 && Math.abs(s.lng) <= 180;
const STEPS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 30];

/* Map, camera, utensils, bed, bus, building and map pin: Lucide (ISC, lucide.dev) */
const mapIcon = svg`<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"></path><path d="M15 5.764v15"></path><path d="M9 3.236v15"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON: Record<ItineraryKindIcon, () => ReturnType<typeof lucide>> = {
  sight: () => lucide(13, svg`<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle>`),
  food: () => lucide(13, svg`<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>`),
  stay: () => lucide(13, svg`<path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path>`),
  transport: () =>
    lucide(
      13,
      svg`<path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path><circle cx="7" cy="18" r="2"></circle><path d="M9 18h5"></path><circle cx="16" cy="18" r="2"></circle>`,
    ),
  venue: () =>
    lucide(
      13,
      svg`<rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path>`,
    ),
  pin: () => lucide(13, svg`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`),
};

let uidCount = 0;
const PAD = 36;
const MAX_TILES = 36;

/**
 * A trip planned day by day – the days as tabs, each day's stops in order with times and travel, and the stops on a
 * map drawn from their coordinates, the chosen day's route standing out.
 * @tag tc-map-itinerary
 * @fires tc-day-change - A day was chosen ({ day, item }: ItineraryDayChange); cancelable – prevented, `day` stays as it was
 * @fires tc-stop-select - A stop was picked or cleared, in the list or on the map ({ stop, item, day }: ItineraryStopSelect); cancelable – prevented, `stop` stays as it was. Also fired, not cancelable, with `stop: null` when choosing another day clears the pick
 */
export class TcMapItinerary extends TcElement {
  static override ui = "mit";

  /** The heading, and the map's name */
  @property() accessor heading = "Itinerary";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The days, in order, each with its stops in order */
  @property({ attribute: false }) accessor days: ItineraryDay[] = [];
  /** The chosen day's id; by default the first. Changed by the user unless a tc-day-change listener calls preventDefault() */
  @property() accessor day: string | null = null;
  /** The picked stop's id. Changed by the user unless a tc-stop-select listener calls preventDefault() */
  @property() accessor stop: string | null = null;
  /** What the map fits: the chosen "day", or "all" days */
  @property() accessor fit: "day" | "all" = "day";
  /** Kinds' names and icons, merged over the defaults (sight, food, stay, transport, venue, other) */
  @property({ attribute: false }) accessor kinds: Record<string, { label: string; icon?: ItineraryKindIcon }> = {};
  /** A map tile URL template with {z}, {x} and {y} (and optionally {s}); nothing loads until "Show map tiles" */
  @property({ attribute: "tile-url" }) accessor tileUrl: string | undefined = undefined;
  /** The tiles' credit, shown on the map once they load, e.g. "© OpenStreetMap contributors" */
  @property({ attribute: "tile-attribution" }) accessor tileAttribution: string | undefined = undefined;
  /** Says where the tiles load from beside Show map tiles; by default the template's host */
  @property({ attribute: "tile-note" }) accessor tileNote: string | undefined = undefined;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor tilesShown = false;
  @state() private accessor activeStop: string | null = null;
  @state() private accessor activeMarker: string | null = null;
  @state() private accessor announce = "";
  @state() private accessor size: [number, number] = [560, 400];

  private uid = `tc-mit-${++uidCount}`;
  private observer: ResizeObserver | undefined;
  private observed: Element | null = null;

  /* ----- Data ----- */
  private get current(): ItineraryDay | undefined {
    return this.days.find((d) => d.id === this.day) ?? this.days[0];
  }
  private kindOf(key: string | undefined) {
    const k = key ? (this.kinds[key] ?? defaultItineraryKinds[key]) : defaultItineraryKinds.other;
    return { label: k?.label ?? (key ? key[0].toUpperCase() + key.slice(1) : "Stop"), icon: k?.icon ?? ("pin" as ItineraryKindIcon) };
  }
  private dayOfStop(id: string) {
    return this.days.find((d) => d.stops.some((s) => s.id === id));
  }

  /* ----- Changes ----- */
  private setDay(next: string, focus = false) {
    const item = this.days.find((d) => d.id === next);
    if (!item || next === this.current?.id) return;
    if (!this.emit<ItineraryDayChange>("tc-day-change", { day: next, item }, { cancelable: true })) return;
    this.day = next;
    if (this.stop && !item.stops.some((s) => s.id === this.stop)) {
      // The picked stop was on the day left behind: cleared, and said so, so a page holding it stays in step
      this.emit<ItineraryStopSelect>("tc-stop-select", { stop: null });
      this.stop = null;
    }
    this.activeStop = null;
    this.activeMarker = null;
    this.announce = `${item.label}, ${item.stops.length} ${item.stops.length === 1 ? "stop" : "stops"}`;
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-day="${CSS.escape(next)}"]`)?.focus());
  }
  private setStop(next: string | null) {
    if (next === this.stop) return;
    const owner = next ? this.dayOfStop(next) : undefined;
    const item = owner?.stops.find((s) => s.id === next);
    // A stop on another day: that day comes forward first, and either change can be prevented
    const moves = owner && owner.id !== this.current?.id;
    if (moves && !this.emit<ItineraryDayChange>("tc-day-change", { day: owner.id, item: owner }, { cancelable: true })) return;
    if (!this.emit<ItineraryStopSelect>("tc-stop-select", { stop: next, item, day: owner?.id }, { cancelable: true })) return;
    if (moves) this.day = owner.id;
    this.stop = next;
    if (item && owner) {
      const n = owner.stops.findIndex((s) => s.id === item.id) + 1;
      this.announce = `${item.name} selected, stop ${n} of ${owner.stops.length}, ${owner.label}`;
    } else this.announce = "Selection cleared";
  }
  private setFit(next: "day" | "all") {
    this.fit = next;
    this.announce = next === "all" ? "Showing all days" : `Zoomed to ${this.current?.label ?? "the day"}`;
  }

  /* ----- Layout ----- */
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    this.observer = undefined;
    this.observed = null;
  }
  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("days")) {
      if (this.day && !this.days.some((d) => d.id === this.day)) this.day = null;
      if (this.stop && !this.dayOfStop(this.stop)) this.stop = null;
    }
    if (changed.has("tileUrl")) this.tilesShown = false;
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const box = this.querySelector(".ui-mit__map");
    if (box !== this.observed) {
      this.observer?.disconnect();
      this.observed = box;
      if (box) {
        this.observer ??= new ResizeObserver(([entry]) => {
          const w = Math.round(entry.contentRect.width);
          if (w > 0 && w !== this.size[0]) this.size = [w, Math.round(Math.max(240, Math.min(460, w * 0.72)))];
        });
        this.observer.observe(box);
      }
    }
  }

  /** The view: the centre in world units and pixels per world unit, fitted to the stops in view */
  private view(points: [number, number][]) {
    const [W, H] = this.size;
    if (!points.length) return { cx: 0.5, cy: 0.5, s: Math.min(W, H) };
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    // A city block at least, so one stop or stops on top of each other don't zoom in forever
    const dx = Math.max(maxX - minX, 0.00002);
    const dy = Math.max(maxY - minY, 0.00002);
    const s = Math.min((W - 2 * PAD) / dx, (H - 2 * PAD) / dy);
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, s };
  }

  private tileHost() {
    try {
      return new URL(this.tileUrl ?? "").hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  /* ----- Keyboard ----- */
  private onTabKey = (e: KeyboardEvent) => {
    const tab = (e.target as HTMLElement).closest<HTMLElement>("[data-day]");
    if (!tab || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const ids = this.days.map((d) => d.id);
    const i = ids.indexOf(tab.dataset.day!);
    const to: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: ids.length - 1 };
    if (!(e.key in to)) return;
    e.preventDefault();
    const next = ids[Math.max(0, Math.min(ids.length - 1, to[e.key]))];
    this.setDay(next, true);
  };
  private onListKey = (e: KeyboardEvent) => {
    const opt = (e.target as HTMLElement).closest<HTMLElement>("[data-stop]");
    if (!opt || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const ids = (this.current?.stops ?? []).map((s) => s.id);
    const id = opt.dataset.stop!;
    const i = ids.indexOf(id);
    const to: Record<string, number> = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: ids.length - 1 };
    if (e.key in to) {
      e.preventDefault();
      const next = ids[Math.max(0, Math.min(ids.length - 1, to[e.key]))];
      this.activeStop = next;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-mit__stops [data-stop="${CSS.escape(next)}"]`)?.focus());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setStop(this.stop === id ? null : id);
    } else if (e.key === "Escape" && this.stop) {
      e.preventDefault();
      this.setStop(null);
    }
  };
  private onMarkerKey = (e: KeyboardEvent) => {
    const mark = (e.target as Element).closest<SVGGElement>("[data-marker]");
    if (!mark || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const ids = (this.current?.stops ?? []).filter(valid).map((s) => s.id);
    const id = mark.dataset.marker!;
    const i = ids.indexOf(id);
    const to: Record<string, number> = { ArrowLeft: i - 1, ArrowUp: i - 1, ArrowRight: i + 1, ArrowDown: i + 1, Home: 0, End: ids.length - 1 };
    if (e.key in to) {
      e.preventDefault();
      const next = ids[Math.max(0, Math.min(ids.length - 1, to[e.key]))];
      this.activeMarker = next;
      void this.updateComplete.then(() => this.querySelector<SVGGElement>(`[data-marker="${CSS.escape(next)}"]`)?.focus());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setStop(this.stop === id ? null : id);
    } else if (e.key === "Escape" && this.stop) {
      e.preventDefault();
      this.setStop(null);
    }
  };

  /* ----- Render ----- */
  private renderTabs(id: string, cur: ItineraryDay) {
    if (this.days.length < 2) return nothing;
    return html`<div class="ui-mit__tabs" role="tablist" aria-label="Days" @keydown=${this.onTabKey}>
      ${repeat(
        this.days,
        (d) => d.id,
        (d) => {
          const on = d.id === cur.id;
          return html`<button
            type="button"
            role="tab"
            class="ui-mit__tab"
            id=${`${id}-tab-${d.id}`}
            data-day=${d.id}
            aria-selected=${on ? "true" : "false"}
            aria-controls=${`${id}-panel`}
            tabindex=${on ? 0 : -1}
            @click=${() => this.setDay(d.id)}
          >
            <span class="ui-mit__tab-label">${d.label}</span>
            ${d.date != null ? html`<span class="ui-mit__tab-date">${formatDate(d.date, this.locale, { weekday: "short", day: "numeric", month: "short" })}</span>` : nothing}
          </button>`;
        },
      )}
    </div>`;
  }

  private renderStops(id: string, cur: ItineraryDay) {
    const stops = cur.stops;
    if (!stops.length) return html`<p class="ui-mit__empty">Nothing planned for ${cur.label}.</p>`;
    const stop = this.activeStop && stops.some((s) => s.id === this.activeStop) ? this.activeStop : this.stop && stops.some((s) => s.id === this.stop) ? this.stop : stops[0].id;
    return html`<ol class="ui-mit__stops" role="listbox" aria-labelledby=${`${id}-day`} @keydown=${this.onListKey}>
      ${repeat(
        stops,
        (s) => s.id,
        (s, i) => {
          const k = this.kindOf(s.kind);
          const sel = this.stop === s.id;
          return html`<li
            class="ui-mit__stop"
            role="option"
            data-stop=${s.id}
            aria-selected=${sel ? "true" : "false"}
            tabindex=${stop === s.id ? 0 : -1}
            @focus=${() => (this.activeStop = s.id)}
            @click=${() => {
              this.activeStop = s.id;
              this.setStop(sel ? null : s.id);
            }}
          >
            ${s.travel && i > 0 ? html`<span class="ui-mit__travel"><span class="tc-sr-only">Getting there: </span>${s.travel}</span>` : nothing}
            <span class="ui-mit__stop-row">
              <span class="ui-mit__num" aria-hidden="true">${i + 1}</span>
              <span class="ui-mit__stop-main">
                <span class="ui-mit__stop-head">
                  <span class="ui-mit__stop-name"><span class="tc-sr-only">${i + 1}. </span>${s.name}</span>
                  ${s.time ? html`<span class="ui-mit__time">${s.time}</span>` : nothing}
                </span>
                <span class="ui-mit__meta">
                  <span class="ui-mit__kind">${pick(ICON, k.icon, "pin")()}${k.label}</span>
                  ${s.duration ? html`<span class="ui-mit__duration">${s.duration}</span>` : nothing}
                  ${valid(s) ? nothing : html`<span class="ui-mit__nowhere">Not on the map – no location</span>`}
                </span>
                ${s.note ? html`<span class="ui-mit__note">${s.note}</span>` : nothing}
              </span>
            </span>
          </li>`;
        },
      )}
    </ol>`;
  }

  private renderMap(id: string, cur: ItineraryDay) {
    const [W, H] = this.size;
    const inView = (this.fit === "all" ? this.days.flatMap((d) => d.stops) : cur.stops).filter(valid);
    const v = this.view(inView.map((s) => mercator(s.lat, s.lng)));
    const px = (lat: number, lng: number): [number, number] => {
      const [x, y] = mercator(lat, lng);
      return [W / 2 + (x - v.cx) * v.s, H / 2 + (y - v.cy) * v.s];
    };
    const route = (d: ItineraryDay) => {
      const pts = d.stops.filter(valid).map((s) => px(s.lat, s.lng));
      return pts.length > 1 ? pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") : "";
    };
    const others = this.days.filter((d) => d.id !== cur.id);
    const curStops = cur.stops.filter(valid);
    const markerStop = this.activeMarker && curStops.some((s) => s.id === this.activeMarker) ? this.activeMarker : this.stop && curStops.some((s) => s.id === this.stop) ? this.stop : curStops[0]?.id;
    const tiles = this.tileUrl && this.tilesShown ? this.renderTiles(v, W, H) : nothing;
    const host = this.tileHost();
    return html`<div class="ui-mit__map" data-tiles=${this.tilesShown ? "true" : "false"}>
      <svg class="ui-mit__svg" width=${W} height=${H} viewBox=${`0 0 ${W} ${H}`} role="group" aria-label=${`Map of ${cur.label}`} aria-describedby=${`${id}-map-keys`} @keydown=${this.onMarkerKey}>
        ${tiles === nothing ? this.renderGrid(v, W, H) : tiles}
        ${others.map((d) => {
          const path = route(d);
          return svg`<g class="ui-mit__day ui-mit__day--muted" aria-hidden="true">
            ${path ? svg`<path class="ui-mit__route" d=${path}></path>` : nothing}
            ${d.stops.filter(valid).map((s) => {
              const [x, y] = px(s.lat, s.lng);
              return svg`<circle class="ui-mit__dot" cx=${x} cy=${y} r="4" @click=${() => this.setStop(s.id)}></circle>`;
            })}
          </g>`;
        })}
        <g class="ui-mit__day">
          ${route(cur) ? svg`<path class="ui-mit__route ui-mit__route--current" d=${route(cur)}></path>` : nothing}
          ${cur.stops.map((s, i) => {
            if (!valid(s)) return nothing;
            const [x, y] = px(s.lat, s.lng);
            const sel = this.stop === s.id;
            return svg`<g
              class="ui-mit__marker"
              data-marker=${s.id}
              transform=${`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
              role="button"
              tabindex=${markerStop === s.id ? 0 : -1}
              aria-pressed=${sel ? "true" : "false"}
              aria-label=${`${i + 1}. ${s.name}${s.time ? `, ${s.time}` : ""}`}
              @focus=${() => (this.activeMarker = s.id)}
              @click=${() => {
                this.activeMarker = s.id;
                this.setStop(sel ? null : s.id);
              }}
            >
              <circle class="ui-mit__ring" r="17"></circle>
              <circle class="ui-mit__pin" r=${sel ? 13 : 11}></circle>
              <text class="ui-mit__pin-num" text-anchor="middle" dominant-baseline="central">${i + 1}</text>
            </g>`;
          })}
        </g>
      </svg>
      <span class="tc-sr-only" id=${`${id}-map-keys`}>Arrow keys move between the day's stops; Enter picks one.</span>
      <div class="ui-mit__map-tools">
        <button type="button" class="tc-btn-sm ui-mit__fit" @click=${() => this.setFit(this.fit === "all" ? "day" : "all")}>
          ${this.fit === "all" ? `Zoom to ${cur.label}` : "Show all days"}
        </button>
      </div>
      ${this.tileUrl && !this.tilesShown
        ? html`<div class="ui-mit__tiles-ask">
            <span class="ui-mit__tiles-note">${this.tileNote ?? (host ? `Map tiles load from ${host}` : "Map tiles load from another site")}</span>
            <button type="button" class="tc-btn-sm ui-mit__show-tiles" @click=${() => (this.tilesShown = true)}>Show map tiles</button>
          </div>`
        : nothing}
      ${this.tilesShown && this.tileAttribution ? html`<span class="ui-mit__credit">${this.tileAttribution}</span>` : nothing}
    </div>`;
  }

  /** A quiet grid of meridians and parallels, at a step that gives a handful of lines */
  private renderGrid(v: { cx: number; cy: number; s: number }, W: number, H: number) {
    const x0 = v.cx - W / 2 / v.s;
    const x1 = v.cx + W / 2 / v.s;
    const y0 = v.cy - H / 2 / v.s;
    const y1 = v.cy + H / 2 / v.s;
    const lng0 = x0 * 360 - 180;
    const lng1 = x1 * 360 - 180;
    const lat0 = latOf(y1);
    const lat1 = latOf(y0);
    const step = STEPS.find((s) => (lng1 - lng0) / s <= 8) ?? 30;
    const lines: ReturnType<typeof svg>[] = [];
    for (let g = Math.ceil(lng0 / step) * step; g <= lng1 && lines.length < 40; g += step) {
      const x = W / 2 + ((g + 180) / 360 - v.cx) * v.s;
      lines.push(svg`<line x1=${x.toFixed(1)} x2=${x.toFixed(1)} y1="0" y2=${H}></line>`);
    }
    for (let g = Math.ceil(lat0 / step) * step; g <= lat1 && lines.length < 80; g += step) {
      const y = H / 2 + (mercator(g, 0)[1] - v.cy) * v.s;
      lines.push(svg`<line x1="0" x2=${W} y1=${y.toFixed(1)} y2=${y.toFixed(1)}></line>`);
    }
    return svg`<rect class="ui-mit__sea" width=${W} height=${H}></rect><g class="ui-mit__grid" aria-hidden="true">${lines}</g>`;
  }

  /** The tiles under the view, at the zoom closest to its scale – at most MAX_TILES of them */
  private renderTiles(v: { cx: number; cy: number; s: number }, W: number, H: number) {
    const z = Math.max(0, Math.min(19, Math.round(Math.log2(v.s / 256))));
    const n = 2 ** z;
    const size = v.s / n;
    const tx0 = Math.floor((v.cx - W / 2 / v.s) * n);
    const tx1 = Math.floor((v.cx + W / 2 / v.s) * n);
    const ty0 = Math.max(0, Math.floor((v.cy - H / 2 / v.s) * n));
    const ty1 = Math.min(n - 1, Math.floor((v.cy + H / 2 / v.s) * n));
    const out: ReturnType<typeof svg>[] = [];
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1 && out.length < MAX_TILES; tx++) {
        const wx = ((tx % n) + n) % n;
        const raw = (this.tileUrl ?? "").replaceAll("{z}", String(z)).replaceAll("{x}", String(wx)).replaceAll("{y}", String(ty)).replaceAll("{s}", "a");
        const url = safeUrl(raw);
        if (!url || !/^https?:/i.test(url)) continue;
        const x = W / 2 + (tx / n - v.cx) * v.s;
        const y = H / 2 + (ty / n - v.cy) * v.s;
        out.push(svg`<image class="ui-mit__tile" href=${url} x=${x.toFixed(1)} y=${y.toFixed(1)} width=${(size + 0.5).toFixed(1)} height=${(size + 0.5).toFixed(1)}></image>`);
      }
    }
    return svg`<rect class="ui-mit__sea" width=${W} height=${H}></rect><g aria-hidden="true">${out}</g>`;
  }

  protected override render() {
    const id = this.uid;
    const cur = this.current;
    const total = this.days.reduce((n, d) => n + d.stops.length, 0);
    const days = this.days.length;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: mapIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: days ? html`<span class="ui-mit__count">${days} ${days === 1 ? "day" : "days"} · ${total} ${total === 1 ? "stop" : "stops"}</span>` : nothing,
      })}
      <div class="ui-mit__card">
        ${cur
          ? html`<div class="ui-mit__body">
              <div class="ui-mit__side">
                ${this.renderTabs(id, cur)}
                <div class="ui-mit__panel" id=${`${id}-panel`} role=${ifDefined(this.days.length > 1 ? "tabpanel" : undefined)} aria-labelledby=${ifDefined(this.days.length > 1 ? `${id}-tab-${cur.id}` : undefined)}>
                  <p class="ui-mit__day-head" id=${`${id}-day`}>
                    <span class="ui-mit__day-label">${cur.label}</span>
                    ${cur.date != null ? html`<span class="ui-mit__day-date">${formatDate(cur.date, this.locale, { weekday: "long", day: "numeric", month: "long" })}</span>` : nothing}
                  </p>
                  ${this.renderStops(id, cur)}
                </div>
              </div>
              ${this.renderMap(id, cur)}
            </div>`
          : html`<p class="ui-mit__empty">No itinerary yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mit"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mit"] {
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
[data-ui="mit"] {
  --tc-mit-side: 300px;
  --tc-mit-num: 22px;
}
[data-ui="mit"] *, [data-ui="mit"] *::before, [data-ui="mit"] *::after { box-sizing: border-box; }
[data-ui="mit"] :is(ol, ul) { margin: 0; padding: 0; list-style: none; }
[data-ui="mit"] p { margin: 0; }
[data-ui="mit"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mit"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-mit__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-mit__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-mit__body { display: grid; grid-template-columns: minmax(0, var(--tc-mit-side)) minmax(0, 1fr); }
.ui-mit__side { display: flex; flex-direction: column; min-width: 0; border-right: var(--tc-hairline) solid var(--tc-divider); }
/* ----- Day tabs ----- */
.ui-mit__tabs { display: flex; gap: var(--tc-space-1); padding: var(--tc-space-2); overflow-x: auto; border-bottom: var(--tc-hairline) solid var(--tc-divider); scrollbar-width: thin; }
.ui-mit__tab { display: grid; flex: none; gap: 0; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-2-5); border: 0; border-radius: var(--tc-radius-md); background: transparent; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-align: left; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mit__tab:hover { background: var(--tc-fill-subtle); }
.ui-mit__tab[aria-selected="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); box-shadow: inset 0 -2px 0 var(--tc-border-selected); }
.ui-mit__tab:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-mit__tab-label { font-weight: var(--tc-font-weight-medium); }
.ui-mit__tab-date { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mit__tab[aria-selected="true"] .ui-mit__tab-date { color: var(--tc-text-secondary); }
/* ----- The day's stops ----- */
.ui-mit__panel { display: flex; flex-direction: column; min-height: 0; }
.ui-mit__day-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); }
.ui-mit__day-label { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-mit__day-date { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-mit__stops { padding: var(--tc-space-1) 0 var(--tc-space-2); }
.ui-mit__stop { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-4); cursor: pointer; outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mit__stop:hover { background: var(--tc-fill-subtle); }
.ui-mit__stop[aria-selected="true"] { background: var(--tc-fill-selected); box-shadow: inset 2px 0 0 var(--tc-border-selected); }
.ui-mit__stop[aria-selected="true"] :is(.ui-mit__kind, .ui-mit__duration, .ui-mit__note, .ui-mit__travel, .ui-mit__time) { color: var(--tc-text-secondary); }
.ui-mit__stop:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-mit__travel { display: flex; align-items: center; gap: var(--tc-space-1-5); padding-left: calc(var(--tc-mit-num) + var(--tc-space-3)); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mit__travel::before { content: ""; width: 0; height: var(--tc-space-3); margin-left: calc(-1 * (var(--tc-mit-num) / 2 + var(--tc-space-3))); margin-right: calc(var(--tc-mit-num) / 2 + var(--tc-space-1)); border-left: 2px dotted var(--tc-border-strong); }
.ui-mit__stop-row { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--tc-space-3); align-items: start; }
.ui-mit__num { display: grid; place-items: center; width: var(--tc-mit-num); height: var(--tc-mit-num); border-radius: var(--tc-radius-full); background: var(--tc-accent-solid); color: var(--tc-text-on-accent); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-mit__stop-main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-mit__stop-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); }
.ui-mit__stop-name { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-mit__stop-name { font-weight: var(--tc-font-weight-medium); }
.ui-mit__time { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-mit__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mit__kind { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-mit__nowhere { color: var(--tc-status-warning-fg); }
.ui-mit__note { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mit__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- The map ----- */
.ui-mit__map { position: relative; min-width: 0; overflow: hidden; background: var(--tc-surface-sunken); }
.ui-mit__svg { width: 100%; height: auto; }
.ui-mit__sea { fill: var(--tc-surface-sunken); }
.ui-mit__grid line { stroke: var(--tc-border-subtle); stroke-width: 1; }
.ui-mit__route { fill: none; stroke: var(--tc-border-strong); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 4 5; }
.ui-mit__route--current { stroke: var(--tc-accent); stroke-width: 3; stroke-dasharray: none; }
.ui-mit__dot { fill: var(--tc-surface-raised); stroke: var(--tc-border-strong); stroke-width: 2; cursor: pointer; }
.ui-mit__marker { cursor: pointer; outline: none; }
.ui-mit__pin { fill: var(--tc-accent-solid); stroke: var(--tc-surface-raised); stroke-width: 2; transition: r var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mit__marker[aria-pressed="true"] .ui-mit__pin { fill: var(--tc-text-primary); }
.ui-mit__pin-num { fill: var(--tc-text-on-accent); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); pointer-events: none; }
.ui-mit__marker[aria-pressed="true"] .ui-mit__pin-num { fill: var(--tc-surface-raised); }
.ui-mit__ring { fill: none; stroke: var(--tc-focus-ring); stroke-width: var(--tc-focus-ring-width); opacity: 0; }
.ui-mit__marker:focus-visible .ui-mit__ring { opacity: 1; }
.ui-mit__tile { image-rendering: auto; }
.ui-mit__map[data-tiles="true"] .ui-mit__route--current { stroke-width: 4; }
.ui-mit__map-tools { position: absolute; top: var(--tc-space-2); right: var(--tc-space-2); display: flex; gap: var(--tc-space-1); }
.ui-mit__tiles-ask { position: absolute; left: var(--tc-space-2); bottom: var(--tc-space-2); display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); max-width: calc(100% - 2 * var(--tc-space-2)); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-mit__tiles-note { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-mit__credit { position: absolute; right: 0; bottom: 0; padding: var(--tc-space-0-5) var(--tc-space-1-5); border-top-left-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); color: var(--tc-text-secondary); font-size: var(--tc-font-size-2xs); }
@container (max-width: 640px) {
  .ui-mit__body { grid-template-columns: minmax(0, 1fr); }
  .ui-mit__map { order: -1; }
  .ui-mit__side { border-right: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
}
@media (forced-colors: active) {
  .ui-mit__pin { fill: Highlight; stroke: Canvas; }
  .ui-mit__pin-num { fill: HighlightText; }
  .ui-mit__route--current { stroke: Highlight; }
  .ui-mit__route, .ui-mit__dot { stroke: CanvasText; }
  .ui-mit__ring { stroke: CanvasText; }
  .ui-mit__stop[aria-selected="true"], .ui-mit__tab[aria-selected="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mit"] *, [data-ui="mit"] *::before, [data-ui="mit"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-map-itinerary")) customElements.define("tc-map-itinerary", TcMapItinerary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-map-itinerary": TcMapItinerary;
  }
}
