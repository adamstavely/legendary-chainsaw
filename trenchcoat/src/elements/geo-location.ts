import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";
import { copyText } from "./internal/util";

/*
 * <tc-geo-location> – a pair of coordinates made useful: the place's name, its latitude and longitude in decimal or
 * degrees-minutes-seconds (a toggle the page can own), Copy, and "Open in" links to Google Maps, Apple Maps,
 * OpenStreetMap and Bing Maps – or the page's own mapping tools, as URL templates with {lat} {lng} {zoom} {label}.
 * An OpenStreetMap embed shows the spot; by default it waits behind "Show map", so nothing loads from another site
 * until someone asks. Give `points` instead of one pair to switch between several places.
 *   · out-of-range coordinates show what's wrong in words, with no links and no map
 *   · the points are a single-select listbox (↑ / ↓ / Home / End move, Enter or Space picks); the notation is a
 *     radio group (← / → switch)
 *   · following a link fires a cancelable tc-open first, so a page can open its own map instead
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-geo-location label="North weather mast" latitude="57.0412" longitude="-3.6127"></tc-geo-location>
 */

/** A map pin – Lucide (ISC, lucide.dev) */
const pinIcon = svg`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`;

export type GeoNotation = "decimal" | "dms";
export type GeoEmbed = "click" | "auto" | "off";
export type GeoPoint = {
  id: string;
  /** What the place is, e.g. "North weather mast" */
  label?: string;
  latitude: number;
  longitude: number;
  /** The map zoom for this point, 1–19; by default the element's `zoom` */
  zoom?: number;
};
/**
 * A mapping tool. `url` is a template: {lat}, {lng}, {zoom} and {label} are replaced, encoded for a URL. Only http(s)
 * links are kept.
 */
export type GeoProvider = { id: string; name: string; url: string };

/** Details of the events */
export type GeoSelectedChange = { selected: string | null; point?: GeoPoint };
export type GeoNotationChange = { notation: GeoNotation };
export type GeoOpen = { provider: GeoProvider; url: string; point: GeoPoint };
export type GeoCopy = { text: string; point: GeoPoint };

/** The mapping tools offered when the page gives none – spread them to add your own */
export const defaultGeoProviders: GeoProvider[] = [
  { id: "google", name: "Google Maps", url: "https://www.google.com/maps/search/?api=1&query={lat},{lng}" },
  { id: "apple", name: "Apple Maps", url: "https://maps.apple.com/?ll={lat},{lng}&q={label}&z={zoom}" },
  { id: "osm", name: "OpenStreetMap", url: "https://www.openstreetmap.org/?mlat={lat}&mlon={lng}#map={zoom}/{lat}/{lng}" },
  { id: "bing", name: "Bing Maps", url: "https://www.bing.com/maps?cp={lat}~{lng}&lvl={zoom}&sp=point.{lat}_{lng}_{label}" },
];
/** The embedded map when the page gives no `embedSrc`: OpenStreetMap's embed, with {bbox} around the point */
export const defaultGeoEmbedSrc = "https://www.openstreetmap.org/export/embed.html?bbox={bbox}&layer=mapnik&marker={lat},{lng}";

/** Why a point can't be used, in words, or null when it can */
export function geoProblem(latitude: unknown, longitude: unknown): string | null {
  const ok = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
  if (!ok(latitude) || !ok(longitude)) return "Coordinates are missing or aren't numbers.";
  if (latitude < -90 || latitude > 90) return `Latitude ${latitude} is out of range – it must be between −90 and 90.`;
  if (longitude < -180 || longitude > 180) return `Longitude ${longitude} is out of range – it must be between −180 and 180.`;
  return null;
}

/** 57.0412 → 57°2′28.3″N */
export function toDms(value: number, axis: "lat" | "lng") {
  const hemi = axis === "lat" ? (value < 0 ? "S" : "N") : value < 0 ? "W" : "E";
  let abs = Math.abs(value);
  let deg = Math.floor(abs);
  abs = (abs - deg) * 60;
  let min = Math.floor(abs);
  let sec = Math.round((abs - min) * 600) / 10;
  if (sec >= 60) {
    sec = 0;
    min++;
  }
  if (min >= 60) {
    min = 0;
    deg++;
  }
  return `${deg}°${min}′${sec.toFixed(1)}″${hemi}`;
}

/** A template filled for a point: {lat} {lng} {zoom} {label} {bbox}, each encoded */
export function fillGeoTemplate(template: string, p: GeoPoint, zoom: number, precision = 6) {
  const lat = p.latitude.toFixed(precision);
  const lng = p.longitude.toFixed(precision);
  // About the width a map shows at this zoom, so the embed opens near it
  const d = 360 / 2 ** Math.max(1, Math.min(19, zoom));
  const clampLat = (v: number) => Math.max(-90, Math.min(90, v));
  const bbox = [p.longitude - d, clampLat(p.latitude - d / 2), p.longitude + d, clampLat(p.latitude + d / 2)].map((v) => v.toFixed(precision)).join(",");
  const values: Record<string, string> = { lat, lng, zoom: String(Math.round(zoom)), label: p.label ?? `${lat},${lng}`, bbox };
  return template.replace(/\{(lat|lng|zoom|label|bbox)\}/g, (_, k: string) => encodeURIComponent(values[k]));
}

/** The embed may run its own scripts and open links in a new tab, nothing more: no top navigation, forms or modals */
const FRAME_SANDBOX = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox";

/** A link from a template when it's http(s) – mailto:, tel: and relative links aren't mapping tools */
const webUrl = (url: string) => {
  const safe = safeUrl(url);
  return safe && /^https?:\/\//i.test(safe) ? safe : undefined;
};

let uidCount = 0;

/* External link, copy, check and map – Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const externalIcon = () => lucide(13, svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`);
const copyIcon = () => lucide(14, svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const checkIcon = () => lucide(14, svg`<path d="M20 6 9 17l-5-5"></path>`);
const mapIcon = () => lucide(20, svg`<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"></path><path d="M15 5.764v15"></path><path d="M9 3.236v15"></path>`);
const alertIcon = () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>`);

/**
 * Coordinates made useful – decimal or degrees-minutes-seconds, Copy, links to mapping tools and an embedded map that
 * loads only when asked.
 * @tag tc-geo-location
 * @fires tc-selected-change - Another of `points` was picked ({ selected, point }: GeoSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-notation-change - Decimal or DMS was picked ({ notation }: GeoNotationChange); cancelable – prevented, `notation` stays as it was
 * @fires tc-open - A mapping link is about to open ({ provider, url, point }: GeoOpen); cancelable – prevented, the link doesn't open
 * @fires tc-copy - The coordinates are about to be copied ({ text, point }: GeoCopy); cancelable – prevented, nothing is copied
 */
export class TcGeoLocation extends TcElement {
  static override ui = "geo";

  /** The heading */
  @property() accessor heading = "Location";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The latitude, −90 to 90 – used when `points` is empty */
  @property({ type: Number }) accessor latitude: number | undefined = undefined;
  /** The longitude, −180 to 180 – used when `points` is empty */
  @property({ type: Number }) accessor longitude: number | undefined = undefined;
  /** What the place is, e.g. "North weather mast" – used when `points` is empty */
  @property() accessor label: string | undefined = undefined;
  /** The map zoom, 1 (the world) to 19 (a building) */
  @property({ type: Number }) accessor zoom = 14;
  /** Several places to switch between, instead of latitude / longitude */
  @property({ attribute: false }) accessor points: GeoPoint[] = [];
  /** The shown point's id when `points` is given; null shows the first. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** Decimal (57.041200, −3.612700) or degrees-minutes-seconds. Changed by the user unless a tc-notation-change listener calls preventDefault() */
  @property() accessor notation: GeoNotation = "decimal";
  /** Decimal places shown in decimal notation */
  @property({ type: Number }) accessor precision = 5;
  /** The mapping tools, replacing the defaults – spread `defaultGeoProviders` to add to them. Only http(s) templates are kept */
  @property({ attribute: false }) accessor providers: GeoProvider[] = defaultGeoProviders;
  /** The embedded map: "click" waits for Show map (nothing loads until then), "auto" shows it at once, "off" has none */
  @property() accessor embed: GeoEmbed = "click";
  /** The embedded map's address as a template with {lat} {lng} {zoom} {label} {bbox}; by default OpenStreetMap's embed */
  @property({ attribute: "embed-src" }) accessor embedSrc = defaultGeoEmbedSrc;
  /** Says where the map loads from under Show map, e.g. "The map loads from openstreetmap.org" – by default the embed's host */
  @property({ attribute: "embed-note" }) accessor embedNote: string | undefined = undefined;

  @state() private accessor mapShown = false;
  @state() private accessor copied = false;
  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-geo-${++uidCount}`;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  /** The points, from `points` or the single latitude / longitude */
  private get all(): GeoPoint[] {
    if (this.points.length) return this.points;
    if (this.latitude === undefined && this.longitude === undefined) return [];
    return [{ id: "point", label: this.label, latitude: this.latitude as number, longitude: this.longitude as number }];
  }
  private get current(): GeoPoint | undefined {
    const all = this.all;
    return all.find((p) => p.id === this.selected) ?? all[0];
  }
  private zoomOf(p: GeoPoint) {
    return p.zoom ?? this.zoom;
  }
  private text(p: GeoPoint) {
    if (this.notation === "dms") return `${toDms(p.latitude, "lat")} ${toDms(p.longitude, "lng")}`;
    const n = Math.max(0, Math.min(8, Math.round(this.precision)));
    return `${p.latitude.toFixed(n)}, ${p.longitude.toFixed(n)}`;
  }

  private setSelected(next: string) {
    if (next === (this.current?.id ?? null)) return;
    const point = this.all.find((p) => p.id === next);
    if (!this.emit<GeoSelectedChange>("tc-selected-change", { selected: next, point }, { cancelable: true })) return;
    this.selected = next;
    this.announce = point ? `${point.label ?? "Point"} selected` : "";
  }
  private setNotation(next: GeoNotation) {
    if (next === this.notation) return;
    if (!this.emit<GeoNotationChange>("tc-notation-change", { notation: next }, { cancelable: true })) return;
    this.notation = next;
  }
  private async copy(p: GeoPoint) {
    const text = this.text(p);
    if (!this.emit<GeoCopy>("tc-copy", { text, point: p }, { cancelable: true })) return;
    await copyText(text);
    this.copied = true;
    this.announce = "Coordinates copied";
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copied = false), 1600);
  }
  private onOpen(e: MouseEvent, provider: GeoProvider, url: string, point: GeoPoint) {
    if (!this.emit<GeoOpen>("tc-open", { provider, url, point }, { cancelable: true })) e.preventDefault();
  }

  private get stop() {
    const ids = this.points.map((p) => p.id);
    if (this.active && ids.includes(this.active)) return this.active;
    return this.current?.id ?? ids[0] ?? null;
  }
  private onPointKey = (e: KeyboardEvent) => {
    const opt = (e.target as HTMLElement).closest<HTMLElement>("[data-point]");
    if (!opt || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const ids = this.points.map((p) => p.id);
    const i = ids.indexOf(opt.dataset.point!);
    const to: Record<string, number> = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: ids.length - 1 };
    if (e.key in to) {
      e.preventDefault();
      const next = ids[Math.max(0, Math.min(ids.length - 1, to[e.key]))];
      this.active = next;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-point="${CSS.escape(next)}"]`)?.focus());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(ids[i]);
    }
  };
  private onNotationKey = (e: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next: GeoNotation = e.key === "Home" ? "decimal" : e.key === "End" ? "dms" : this.notation === "decimal" ? "dms" : "decimal";
    this.setNotation(next);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-notation="${this.notation}"]`)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.selected !== null && this.points.length && !this.points.some((p) => p.id === this.selected)) this.selected = null;
    if (changed.has("embed") && this.embed !== "click") this.mapShown = false;
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  private renderPoints(stop: string | null) {
    const cur = this.current?.id;
    return html`<ul class="ui-geo__points" role="listbox" aria-label="Places" @keydown=${this.onPointKey}>
      ${repeat(
        this.points,
        (p) => p.id,
        (p) => {
          const bad = geoProblem(p.latitude, p.longitude);
          return html`<li
            class="ui-geo__point"
            role="option"
            data-point=${p.id}
            aria-selected=${p.id === cur ? "true" : "false"}
            tabindex=${stop === p.id ? 0 : -1}
            @focus=${() => (this.active = p.id)}
            @click=${() => {
              this.active = p.id;
              this.setSelected(p.id);
            }}
          >
            <span class="ui-geo__point-label">${p.label ?? "Unnamed point"}</span>
            <span class="ui-geo__point-coords">${bad ? "Invalid coordinates" : this.text(p)}</span>
          </li>`;
        },
      )}
    </ul>`;
  }

  /**
   * The map's iframe, made once per address: its sandbox has to be set before it loads, and a template can't bind a
   * multi-token sandbox (lit-analyzer types it as one token)
   */
  private frame: HTMLIFrameElement | undefined;
  private frameFor(src: string, title: string) {
    if (!this.frame || this.frame.dataset.src !== src) {
      const f = document.createElement("iframe");
      f.className = "ui-geo__frame";
      f.setAttribute("sandbox", FRAME_SANDBOX);
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer";
      f.dataset.src = src;
      f.src = src;
      this.frame = f;
    }
    this.frame.title = title;
    return this.frame;
  }

  private renderMap(p: GeoPoint) {
    if (this.embed === "off") return nothing;
    const src = webUrl(fillGeoTemplate(this.embedSrc, p, this.zoomOf(p)));
    if (!src) return nothing;
    const name = p.label ?? "the point";
    if (this.embed === "click" && !this.mapShown) {
      let host = "";
      try {
        host = new URL(src).hostname.replace(/^www\./, "");
      } catch {
        host = "";
      }
      return html`<div class="ui-geo__map ui-geo__map--waiting">
        <span class="ui-geo__map-icon">${mapIcon()}</span>
        <span class="ui-geo__map-note">${this.embedNote ?? (host ? `The map loads from ${host}` : "The map loads from another site")}</span>
        <button type="button" class="tc-btn-sm ui-geo__show" @click=${() => (this.mapShown = true)}>Show map<span class="tc-sr-only"> of ${name}</span></button>
      </div>`;
    }
    return html`<div class="ui-geo__map">
      ${this.frameFor(src, `Map of ${name}`)}
    </div>`;
  }

  private renderBody(p: GeoPoint) {
    const id = this.uid;
    const bad = geoProblem(p.latitude, p.longitude);
    if (bad)
      return html`<div class="ui-geo__error" role="alert"><span class="ui-geo__error-icon">${alertIcon()}</span><span><strong>Can't show this location.</strong> ${bad}</span></div>`;
    const zoom = this.zoomOf(p);
    const links = this.providers
      .map((pr) => ({ pr, url: webUrl(fillGeoTemplate(pr.url, p, zoom)) }))
      .filter((l): l is { pr: GeoProvider; url: string } => !!l.url);
    return html`
      <div class="ui-geo__main">
        ${p.label ? html`<p class="ui-geo__label">${p.label}</p>` : nothing}
        <p class="ui-geo__coords"><span class="tc-sr-only">${this.notation === "dms" ? "Coordinates, degrees minutes seconds: " : "Latitude, longitude: "}</span>${this.text(p)}</p>
        <div class="ui-geo__tools">
          <div class="ui-geo__notation" role="radiogroup" aria-label="Notation" @keydown=${this.onNotationKey}>
            ${(["decimal", "dms"] as const).map(
              (n) => html`<button
                type="button"
                role="radio"
                class="ui-geo__seg"
                data-notation=${n}
                aria-checked=${this.notation === n ? "true" : "false"}
                tabindex=${this.notation === n ? 0 : -1}
                @click=${() => this.setNotation(n)}
              >${n === "decimal" ? "Decimal" : "DMS"}</button>`,
            )}
          </div>
          <button type="button" class="tc-btn-sm ui-geo__copy" @click=${() => void this.copy(p)}>
            ${this.copied ? checkIcon() : copyIcon()}${this.copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      ${links.length
        ? html`<div class="ui-geo__open">
            <span class="ui-geo__open-label" id=${`${id}-open`}>Open in</span>
            <ul class="ui-geo__links" aria-labelledby=${`${id}-open`}>
              ${links.map(
                ({ pr, url }) => html`<li>
                  <a class="ui-geo__link" data-provider=${pr.id} href=${ifDefined(url)} target="_blank" rel="noopener noreferrer" @click=${(e: MouseEvent) => this.onOpen(e, pr, url, p)}
                    >${pr.name}<span class="tc-sr-only"> (opens in a new tab)</span>${externalIcon()}</a
                  >
                </li>`,
              )}
            </ul>
          </div>`
        : nothing}
      ${this.renderMap(p)}
    `;
  }

  protected override render() {
    const id = this.uid;
    const p = this.current;
    const n = this.points.length;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: pinIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: n > 1 ? html`<span class="ui-geo__count">${n} places</span>` : nothing,
      })}
      <div class="ui-geo__card">
        ${n > 1 ? this.renderPoints(this.stop) : nothing}
        <div class="ui-geo__body">${p ? this.renderBody(p) : html`<p class="ui-geo__empty">No location given.</p>`}</div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="geo"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="geo"] {
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
[data-ui="geo"] { --tc-geo-map-h: 220px; }
[data-ui="geo"] *, [data-ui="geo"] *::before, [data-ui="geo"] *::after { box-sizing: border-box; }
[data-ui="geo"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="geo"] p { margin: 0; }
[data-ui="geo"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="geo"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-geo__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-geo__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-geo__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* ----- Points ----- */
.ui-geo__points { display: grid; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-geo__point { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-0-5) var(--tc-space-3); min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-4); cursor: pointer; outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-geo__point + .ui-geo__point { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-geo__point:hover { background: var(--tc-fill-subtle); }
.ui-geo__point[aria-selected="true"] { background: var(--tc-fill-selected); box-shadow: inset 2px 0 0 var(--tc-border-selected); }
.ui-geo__point:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-geo__point-label { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); }
.ui-geo__point-coords { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-geo__point[aria-selected="true"] .ui-geo__point-coords { color: var(--tc-text-secondary); }
/* ----- The point ----- */
.ui-geo__body { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-geo__main { display: grid; gap: var(--tc-space-1); }
.ui-geo__label { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-geo__label { font-weight: var(--tc-font-weight-medium); }
.ui-geo__coords { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.ui-geo__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); margin-top: var(--tc-space-1); }
/* Decimal / DMS: a small segmented control */
.ui-geo__notation { display: inline-flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-geo__seg { height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); margin: 0; padding: 0 var(--tc-space-2-5); border: 0; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: transparent; font: inherit; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-geo__seg:hover { color: var(--tc-text-primary); }
.ui-geo__seg[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-geo__seg:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-geo__copy > svg { width: 14px; height: 14px; }
/* Open in */
.ui-geo__open { display: grid; gap: var(--tc-space-1-5); }
.ui-geo__open-label { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-geo__links { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-geo__link { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); text-decoration: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-geo__link:hover { background: var(--tc-fill-strong); }
.ui-geo__link:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-geo__link > svg { color: var(--tc-text-muted); }
/* The map */
.ui-geo__map { position: relative; height: var(--tc-geo-map-h); overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-geo__map--waiting { display: grid; place-content: center; justify-items: center; gap: var(--tc-space-2); padding: var(--tc-space-4); text-align: center; }
.ui-geo__map-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); color: var(--tc-text-secondary); }
.ui-geo__map-note { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-geo__frame { display: block; width: 100%; height: 100%; border: 0; }
/* Errors and empty */
.ui-geo__error { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-danger-bg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-danger-fg); }
.ui-geo__error strong { font-weight: var(--tc-font-weight-strong); }
.ui-geo__error-icon { margin-top: var(--tc-space-0-5); }
.ui-geo__empty { padding: var(--tc-space-4) 0; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 360px) {
  .ui-geo__body { padding: var(--tc-space-3); }
  .ui-geo__coords { font-size: var(--tc-font-size-md); }
}
@media (forced-colors: active) {
  .ui-geo__seg[aria-checked="true"], .ui-geo__link { border: 1px solid ButtonText; }
  .ui-geo__point[aria-selected="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="geo"] *, [data-ui="geo"] *::before, [data-ui="geo"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-geo-location")) customElements.define("tc-geo-location", TcGeoLocation);

declare global {
  interface HTMLElementTagNameMap {
    "tc-geo-location": TcGeoLocation;
  }
}
