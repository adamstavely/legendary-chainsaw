import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";
import { marks } from "./internal/selection";
import { copyText } from "./internal/util";
import { safeMediaUrl } from "./internal/safe-media";
import { safeUrl } from "./internal/safe-url";
import { defaultGeoEmbedSrc, defaultGeoProviders, fillGeoTemplate, toDms, type GeoProvider } from "./geo-location";

/*
 * <tc-coordinate-details> – coordinates in a passage of text, found, checked and marked. Decimal pairs
 * ("38.8977, -77.0365"), decimals with hemispheres ("38.8977° N, 77.0365° W", "N 38.8977 W 77.0365") and degrees,
 * minutes and seconds ("38°53′51.6″N 77°02′11.6″W", or with ASCII ' " and d) each become a mark. Hovering one (after
 * a short pause), focusing it or right-clicking it opens a card: the place, when the app knows it (name, kind,
 * address, elevation, time zone, a picture), the coordinates in decimal and DMS with Copy, "Open in" links to mapping
 * tools, and a map that loads only when someone presses Show map. Pairs out of range, plain number pairs ("3, 4",
 * prices, version numbers) and numbers inside words stay plain text: a plain decimal pair needs three decimal places
 * on each side and a comma between them.
 *
 *   <tc-coordinate-details .text=${note} .resolve=${(lat, lng, signal) => geocoder.reverse(lat, lng, { signal })}></tc-coordinate-details>
 *
 * The component never calls a network by itself. Place details come from the app: `resolve(latitude, longitude,
 * signal)` (a place, null for none, or a promise of either), or a cancelable tc-coordinate-lookup event whose detail
 * has `respondWith(place | promise)`. The event fires first; preventing it without responding means there are no
 * details. Answers are cached by position for the element's life (`clearCache()` forgets them); failures aren't
 * cached – the card offers Retry. The map is an embed from another site, so it waits behind Show map: a card that
 * opens on hover never loads anything on its own.
 *
 * `trigger` picks what opens a card: "both" (the default) – hover, focus and right-click; "hover" – hover and focus,
 * leaving the browser's own menu on right-click; "contextmenu" – right-click (or the Menu key / Shift + F10) and
 * Enter, so hovering and tabbing through the text stay quiet.
 *
 * Also exported: `parseCoordinate()` → { latitude, longitude } or null, and `findCoordinates(text)` → the ranges the
 * element marks.
 *
 * Keyboard. Each mark is a button in the tab order. Focus opens its card (unless `trigger` is "contextmenu"); Tab or
 * Enter moves into the card, Shift + Tab from its first control goes back to the mark, Tab from its last moves on to
 * the next mark; the Menu key or Shift + F10 opens the card and moves into it; Esc closes the card and returns focus
 * to the mark. Results are announced in a polite status region.
 *
 * Standard tints each mark with a soft accent fill and a solid underline; Clean marks with a dotted underline only.
 */

/** A pair of coordinates in decimal degrees: north and east positive */
export type Coordinate = { latitude: number; longitude: number };
/** Coordinates found in text: where they are (UTF-16 offsets, `end` exclusive), as written, and the position */
export type CoordinateMatch = Coordinate & { start: number; end: number; text: string };
/** What the app knows about a place, as it supplies it */
export type CoordinatePlace = {
  /** What the place is called – "North weather mast" */
  name: string;
  /** What kind of place it is – "Weather station", "Harbour" */
  kind?: string;
  /** A postal address or a line of locality */
  address?: string;
  /** A sentence about it */
  description?: string;
  /** Height above sea level, metres */
  elevation?: number;
  /** The IANA time zone, "Europe/London" */
  timezone?: string;
  /** A picture of the place (a data: URL works); decorative */
  image?: string;
};
/** Supplies a place for a position: the place, null or undefined for none, or a promise of either. Throw (or reject) when the lookup failed */
export type CoordinateResolver = (latitude: number, longitude: number, signal: AbortSignal) => CoordinatePlace | null | undefined | Promise<CoordinatePlace | null | undefined>;
/** tc-coordinate-lookup: the position to look up, a signal that aborts when the element leaves the page, and `respondWith()` for the answer */
export type CoordinateLookupDetail = Coordinate & {
  signal: AbortSignal;
  respondWith: (place: CoordinatePlace | null | undefined | Promise<CoordinatePlace | null | undefined>) => void;
};
/** How the coordinates are written: decimal degrees or degrees, minutes and seconds */
export type CoordinateNotation = "decimal" | "dms";
/** tc-copy: the text being copied and which notation it is in */
export type CoordinateCopyDetail = { text: string; notation: CoordinateNotation };
/** tc-open: a mapping link is about to open */
export type CoordinateOpenDetail = Coordinate & { provider: GeoProvider; url: string };
/** tc-open-change: the position whose card opened, or nulls when it closed */
export type CoordinateOpenChange = { latitude: number | null; longitude: number | null };
/** What opens a card: hover and focus, right-click, or both */
export type CoordinateTrigger = "both" | "hover" | "contextmenu";
/** The map: behind a Show map button, or none. Never "auto" – a card that opens on hover mustn't load a third party */
export type CoordinateEmbed = "click" | "off";

/* ---------- Reading coordinates ---------- */

const isWord = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}_]/u.test(c);
const isDigit = (c: string | undefined) => c !== undefined && c >= "0" && c <= "9";

type Token = { t: "hemi" | "sign" | "num" | "deg" | "min" | "sec" | "sep"; v: string };

/** Splits a candidate into tokens; null when it holds anything else */
function tokenize(input: string): Token[] | null {
  const out: Token[] = [];
  const re = /\s+|([NSEW])(?![A-Za-z])|([-+−])|(\d+(?:\.\d+)?)|([°º˚]|deg\b|d(?=\s?\d))|(''|′′|["″”])|(['′’])|([,;/])/y;
  let i = 0;
  while (i < input.length) {
    re.lastIndex = i;
    const m = re.exec(input);
    if (!m || m[0] === "") return null;
    i = re.lastIndex;
    if (m[1]) out.push({ t: "hemi", v: m[1] });
    else if (m[2]) out.push({ t: "sign", v: m[2] });
    else if (m[3]) out.push({ t: "num", v: m[3] });
    else if (m[4]) out.push({ t: "deg", v: m[4] });
    else if (m[5]) out.push({ t: "sec", v: m[5] });
    else if (m[6]) out.push({ t: "min", v: m[6] });
    else if (m[7]) out.push({ t: "sep", v: m[7] });
  }
  return out;
}

type Part = { hemi?: string; negative: boolean; signed: boolean; value: number; marked: boolean; decimals: number };

/** One half of a pair: [hemisphere] [sign] degrees [°] [minutes ′ [seconds ″]] [hemisphere] */
function readPart(tokens: Token[], at: number): { part: Part; next: number } | null {
  let i = at;
  const tok = (k = 0) => tokens[i + k];
  let hemi: string | undefined;
  if (tok()?.t === "hemi") hemi = tokens[i++].v;
  let negative = false;
  let signed = false;
  if (tok()?.t === "sign") {
    signed = true;
    negative = tokens[i++].v !== "+";
  }
  if (tok()?.t !== "num") return null;
  const degText = tokens[i++].v;
  let value = Number(degText);
  let marked = false;
  let decimals = degText.includes(".") ? degText.length - degText.indexOf(".") - 1 : 0;
  if (tok()?.t === "deg") {
    i++;
    marked = true;
  }
  if (tok()?.t === "num" && tok(1)?.t === "min") {
    // Minutes need whole degrees, and seconds whole minutes
    if (degText.includes(".")) return null;
    const minText = tokens[i].v;
    const min = Number(minText);
    if (min >= 60) return null;
    value += min / 60;
    i += 2;
    marked = true;
    decimals = 0;
    if (tok()?.t === "num" && tok(1)?.t === "sec") {
      if (minText.includes(".")) return null;
      const sec = Number(tokens[i].v);
      if (sec >= 60) return null;
      value += sec / 3600;
      i += 2;
    }
  }
  if (!hemi && tok()?.t === "hemi") hemi = tokens[i++].v;
  // A hemisphere already says which way – a sign as well is contradictory
  if (hemi && signed) return null;
  if (hemi === "S" || hemi === "W") negative = true;
  if (hemi) marked = true;
  return { part: { hemi, negative, signed, value: negative ? -value : value, marked, decimals }, next: i };
}

/**
 * Reads one pair of coordinates written as decimal degrees ("38.8977, -77.0365"), decimals with hemispheres
 * ("38.8977° N, 77.0365° W", "N 38.8977 W 77.0365") or degrees, minutes and seconds ("38°53′51.6″N 77°02′11.6″W").
 * Hemisphere letters say which number is the latitude; without them the latitude comes first. Gives null for anything
 * else, and for positions out of range. A plain decimal pair needs a comma between its halves and three decimal places
 * on each, so prices, scores and version numbers aren't read as places.
 */
export function parseCoordinate(input: string): Coordinate | null {
  const tokens = tokenize(String(input ?? "").trim());
  if (!tokens?.length) return null;
  const a = readPart(tokens, 0);
  if (!a) return null;
  let i = a.next;
  let sep = false;
  if (tokens[i]?.t === "sep") {
    sep = tokens[i].v === ",";
    i++;
  }
  const b = readPart(tokens, i);
  if (!b || b.next !== tokens.length) return null;
  const [p, q] = [a.part, b.part];
  if (p.marked !== q.marked) {
    // One side has a hemisphere or a degree sign and the other none: fine only if both are decimals precise enough
    if (!(p.decimals >= 3 && q.decimals >= 3 && sep)) return null;
  } else if (!p.marked && !(p.decimals >= 3 && q.decimals >= 3 && sep)) return null;
  const axis = (h?: string) => (h === "N" || h === "S" ? "lat" : h === "E" || h === "W" ? "lng" : undefined);
  let [ax, bx] = [axis(p.hemi), axis(q.hemi)];
  if (ax && ax === bx) return null;
  ax ??= bx === "lat" ? "lng" : "lat";
  bx ??= ax === "lat" ? "lng" : "lat";
  if (ax === bx) return null;
  const latitude = ax === "lat" ? p.value : q.value;
  const longitude = ax === "lat" ? q.value : p.value;
  if (!(Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180)) return null;
  return { latitude, longitude };
}

/** A candidate: two halves, each [hemisphere] [sign] number [°] [minutes′ [seconds″]] [hemisphere], with a separator */
const HALF = String.raw`(?:[NSEW]\s?)?[-+−]?\d{1,3}(?:\.\d+)?(?:\s?(?:[°º˚]|deg\b|d(?=\s?\d)))?(?:\s?\d{1,2}(?:\.\d+)?\s?['′’](?!'))?(?:\s?\d{1,2}(?:\.\d+)?\s?(?:''|′′|["″”]))?(?:\s?[NSEW](?![A-Za-z]))?`;
const CANDIDATE = new RegExp(String.raw`${HALF}\s?(?:[,;/]\s?)?${HALF}`, "y");

/** May coordinates start at `i`? Not inside a word, a longer number or a decimal ("v2.10", "1.5", "ID-38.9") */
function startsHere(text: string, i: number) {
  const prev = text[i - 1];
  if (prev === undefined) return true;
  if (isWord(prev) || prev === ".") return false;
  if (prev === "-" || prev === "+" || prev === "−") return !isWord(text[i - 2]);
  return true;
}

/** Do they end at `end`? Not running on into a word or more digits */
function endsHere(text: string, end: number) {
  const next = text[end];
  if (isWord(next)) return false;
  if ((next === "." || next === ",") && isDigit(text[end + 1])) return false;
  return true;
}

/**
 * Every pair of coordinates in `text` that parseCoordinate() reads, in order. Pairs inside words or longer numbers,
 * out of range, or too vague to be a place (see parseCoordinate) aren't returned.
 */
export function findCoordinates(text: string): CoordinateMatch[] {
  const out: CoordinateMatch[] = [];
  const s = String(text ?? "");
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if ((isDigit(c) || "NSEW+-−".includes(c)) && startsHere(s, i)) {
      CANDIDATE.lastIndex = i;
      const m = CANDIDATE.exec(s);
      if (m) {
        // Trailing space the pattern took belongs to the text, not the mark
        const raw = m[0].replace(/\s+$/, "");
        const end = i + raw.length;
        const pos = endsHere(s, end) ? parseCoordinate(raw) : null;
        if (pos) {
          out.push({ start: i, end, text: raw, ...pos });
          i = end;
          continue;
        }
      }
    }
    i++;
  }
  return out;
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-crd__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const pinIcon = svg`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`;
const copyIcon = svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`;
const checkIcon = svg`<path d="M20 6 9 17l-5-5"></path>`;
const retryIcon = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`;
const externalIcon = svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`;
const mapIcon = svg`<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"></path><path d="M15 5.764v15"></path><path d="M9 3.236v15"></path>`;

/** The embed may run its own scripts and open links in a new tab, nothing more: no top navigation, forms or modals */
const FRAME_SANDBOX = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox";
/** A link from a template when it's http(s) – mailto:, tel: and relative links aren't mapping tools */
const webUrl = (url: string) => {
  const safe = safeUrl(url);
  return safe && /^https?:\/\//i.test(safe) ? safe : undefined;
};

type Entry = { status: "loading" } | { status: "done"; place: CoordinatePlace | null } | { status: "error"; message: string };

const NO_ANSWER = Symbol("no answer");
const keyOf = (c: Coordinate) => `${c.latitude.toFixed(6)},${c.longitude.toFixed(6)}`;
let instances = 0;

/**
 * Coordinates in text, checked and marked: hover, focus or right-click one for the place, both notations, mapping links and a map.
 * @tag tc-coordinate-details
 * @fires tc-coordinate-lookup - A card needs a place's details ({ latitude, longitude, signal, respondWith }: CoordinateLookupDetail); cancelable – call respondWith() with the place (or a promise), or prevent it without responding for "no details"
 * @fires tc-copy - Copy was pressed ({ text, notation }: CoordinateCopyDetail); cancelable – prevent it to copy your own way
 * @fires tc-open - A mapping link is about to open ({ provider, url, latitude, longitude }: CoordinateOpenDetail); cancelable – prevented, the link doesn't open
 * @fires tc-open-change - A card opened or closed ({ latitude, longitude }: CoordinateOpenChange; nulls when closed)
 */
export class TcCoordinateDetails extends TcElement {
  static override ui = "crd";

  /** The text to find coordinates in: plain text, shown as written (line breaks kept) */
  @property() accessor text = "";
  /** Supplies a place for a position – a place, null for none, or a promise; used when no tc-coordinate-lookup listener responds */
  @property({ attribute: false }) accessor resolve: CoordinateResolver | undefined = undefined;
  /** What opens a card: "both" (hover, focus and right-click), "hover" (hover and focus) or "contextmenu" (right-click, Menu key, Enter) */
  @property() accessor trigger: CoordinateTrigger = "both";
  /** How long the pointer rests on a mark before its card opens, ms */
  @property({ type: Number, attribute: "hover-delay" }) accessor hoverDelay = 300;
  /** Decimal places shown in decimal notation */
  @property({ type: Number }) accessor precision = 5;
  /** The zoom for mapping links and the map, 1–19 */
  @property({ type: Number }) accessor zoom = 14;
  /** Mapping tools for "Open in": URL templates with {lat} {lng} {zoom} {label}; empty hides the links */
  @property({ attribute: false }) accessor providers: GeoProvider[] = defaultGeoProviders;
  /** The map: "click" waits behind Show map; "off" shows none */
  @property() accessor embed: CoordinateEmbed = "click";
  /** The map's address template – {lat} {lng} {zoom} {bbox} – OpenStreetMap's embed by default */
  @property({ attribute: "embed-src" }) accessor embedSrc = defaultGeoEmbedSrc;
  /** What the card says when there are no details for a place */
  @property({ attribute: "not-found-text" }) accessor notFoundText = "No details for this place";
  /** What the card says when the lookup failed */
  @property({ attribute: "error-text" }) accessor errorText = "Couldn't load the details.";

  /** @internal The open card's mark (index into the matches), or -1 */
  @state() accessor openAt = -1;
  /** @internal Bumped when the cache changes */
  @state() accessor version = 0;
  /** @internal The notation just copied, for the check mark */
  @state() accessor copied: "" | CoordinateNotation = "";
  /** @internal The map was asked for in the open card */
  @state() accessor mapShown = false;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-crd${++instances}`;
  private found: CoordinateMatch[] = [];
  private foundFor: string | null = null;
  private readonly cache = new Map<string, Entry>();
  private readonly aborts = new Set<AbortController>();
  private copiedTimer = 0;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-crd__pop"),
    anchor: () => {
      const m = this.markAt(this.openAt);
      if (!m?.isConnected) return null;
      // The mark's first line, when it wraps
      return m.getClientRects()[0] ?? m.getBoundingClientRect();
    },
    side: "bottom",
    align: "start",
    kind: "dialog",
    trigger: () => this.markAt(this.openAt),
    returnFocus: () => this.markAt(this.openAt),
    hover: { delay: () => this.hoverDelay },
    tabBridge: true,
    closeOnFocusOut: true,
    onClose: () => this.closed(),
  });

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const a of this.aborts) a.abort();
    this.aborts.clear();
    // Lookups in flight were aborted: forget them, so the card asks again if the element comes back
    for (const [k, e] of this.cache) if (e.status === "loading") this.cache.delete(k);
    clearTimeout(this.copiedTimer);
  }

  /** The coordinates found in `text`, in order */
  get coordinates(): CoordinateMatch[] {
    if (this.foundFor !== this.text) {
      this.found = findCoordinates(this.text);
      this.foundFor = this.text;
    }
    return this.found;
  }

  /** Forgets cached places – one position's, or all of them – so the next card asks again */
  clearCache(position?: Coordinate) {
    if (position) this.cache.delete(keyOf(position));
    else this.cache.clear();
    this.version++;
  }

  /** Opens the card for the coordinates at `index` in `coordinates`, pinned open; focus stays where it is */
  openCard(index = 0) {
    this.open(index, { pin: true });
  }

  /** Closes the open card, if any */
  closeCard() {
    this.close();
  }

  /* ---------- Opening and closing ---------- */

  private markAt(i: number) {
    return i < 0 ? null : this.querySelector<HTMLElement>(`.ui-crd__mark[data-i="${i}"]`);
  }

  private get onHover() {
    return this.trigger !== "contextmenu";
  }

  private get onMenu() {
    return this.trigger !== "hover";
  }

  private open(i: number, how: { pin?: boolean; focus?: boolean } = {}) {
    const m = this.coordinates[i];
    if (!m) return;
    if (this.openAt !== i) {
      if (this.openAt >= 0) this.pop.pinned = false;
      this.openAt = i;
      this.copied = "";
      this.mapShown = false;
      this.emit<CoordinateOpenChange>("tc-open-change", { latitude: m.latitude, longitude: m.longitude });
      void this.lookup(m);
    }
    this.pop.show({ focus: !!how.focus, pin: !!how.pin });
  }

  private close() {
    if (this.pop.open) this.pop.close();
    else this.closed();
  }

  /** After the controller closed it (Escape, outside, focus gone, anchor gone) or close() */
  private closed() {
    if (this.openAt < 0) return;
    this.openAt = -1;
    this.copied = "";
    this.mapShown = false;
    this.emit<CoordinateOpenChange>("tc-open-change", { latitude: null, longitude: null });
  }

  private onMarkClick(e: MouseEvent, i: number) {
    // Enter or Space (detail 0): into the card. A click: pin it open, or close a pinned one
    if (e.detail === 0) this.open(i, { pin: true, focus: true });
    else if (this.openAt === i && this.pop.pinned) this.close();
    else this.open(i, { pin: true });
  }

  private onMarkMenu(e: MouseEvent, i: number) {
    if (!this.onMenu) return;
    // The card takes the place of the browser's menu, on the marks only
    e.preventDefault();
    if (this.openAt !== i || !this.pop.open || !this.pop.pinned) this.open(i, { pin: true });
  }

  private onMarkKey(e: KeyboardEvent, i: number) {
    if (!this.onMenu) return;
    if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
      e.preventDefault();
      this.open(i, { pin: true, focus: true });
    }
  }

  /* ---------- Looking up ---------- */

  private async lookup(m: CoordinateMatch) {
    const key = keyOf(m);
    if (this.cache.has(key)) return;
    this.cache.set(key, { status: "loading" });
    this.version++;
    const abort = new AbortController();
    this.aborts.add(abort);
    let answer: unknown = NO_ANSWER;
    const detail: CoordinateLookupDetail = { latitude: m.latitude, longitude: m.longitude, signal: abort.signal, respondWith: (place) => (answer = place) };
    const go = this.emit<CoordinateLookupDetail>("tc-coordinate-lookup", detail, { cancelable: true });
    const current = () => {
      const o = this.coordinates[this.openAt];
      return !!o && keyOf(o) === key;
    };
    try {
      let result: unknown = null;
      if (answer !== NO_ANSWER) result = answer;
      else if (go && this.resolve) result = this.resolve(m.latitude, m.longitude, abort.signal);
      const place = (await result) as CoordinatePlace | null | undefined;
      if (abort.signal.aborted) return;
      const ok = !!place && typeof place === "object" && typeof place.name === "string" && place.name.trim() !== "";
      this.cache.set(key, { status: "done", place: ok ? place : null });
      if (current()) this.say(ok ? `${place.name}${place.kind ? `, ${place.kind}` : ""}` : this.notFoundText);
    } catch (err) {
      if (abort.signal.aborted) return;
      this.cache.set(key, { status: "error", message: err instanceof Error ? err.message : String(err ?? "") });
      if (current()) this.say(this.errorText);
    } finally {
      this.aborts.delete(abort);
      this.version++;
    }
  }

  private retry(m: CoordinateMatch) {
    this.cache.delete(keyOf(m));
    this.say("Trying again…");
    void this.lookup(m);
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  private decimal(c: Coordinate) {
    const p = Math.max(0, Math.min(8, Math.round(this.precision)));
    return `${c.latitude.toFixed(p)}, ${c.longitude.toFixed(p)}`;
  }

  private dms(c: Coordinate) {
    return `${toDms(c.latitude, "lat")} ${toDms(c.longitude, "lng")}`;
  }

  private async copy(notation: CoordinateNotation, text: string) {
    if (!this.emit<CoordinateCopyDetail>("tc-copy", { text, notation }, { cancelable: true })) return;
    const ok = await copyText(text);
    const name = notation === "decimal" ? "decimal coordinates" : "DMS coordinates";
    this.say(ok ? `Copied ${name}` : `Couldn't copy – select ${text} and press Ctrl+C`);
    if (!ok) return;
    this.copied = notation;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = ""), 1600);
  }

  private onOpen(e: MouseEvent, provider: GeoProvider, url: string, m: CoordinateMatch) {
    if (!this.emit<CoordinateOpenDetail>("tc-open", { provider, url, latitude: m.latitude, longitude: m.longitude }, { cancelable: true })) e.preventDefault();
  }

  /* ---------- Render ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The text changed under an open card: close it if its coordinates went away
    if (changed.has("text") && this.openAt >= 0) {
      const was = this.found[this.openAt];
      const now = this.coordinates[this.openAt];
      if (!was || !now || keyOf(was) !== keyOf(now)) {
        this.openAt = -1;
        this.mapShown = false;
        if (this.pop.open) this.pop.close("anchor-gone");
      }
    }
  }

  /** The map's iframe, made once per address: its sandbox has to be set before it loads */
  private frame: HTMLIFrameElement | undefined;
  private frameFor(src: string, title: string) {
    if (!this.frame || this.frame.dataset.src !== src) {
      const f = document.createElement("iframe");
      f.className = "ui-crd__frame";
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

  private renderCard() {
    const m = this.coordinates[this.openAt];
    if (!this.pop.open || !m) return nothing;
    const entry = this.cache.get(keyOf(m)) ?? { status: "loading" };
    const titleId = `${this.uid}-title`;
    const place = entry.status === "done" ? entry.place : null;
    const label = place ? undefined : `Place details for ${this.decimal(m)}`;
    const point = { id: "p", latitude: m.latitude, longitude: m.longitude, label: place?.name };
    return html`<div
      class="tc-pop ui-crd__pop"
      role="dialog"
      aria-label=${ifDefined(label)}
      aria-labelledby=${ifDefined(place ? titleId : undefined)}
      aria-busy=${entry.status === "loading" ? "true" : "false"}
      data-status=${entry.status === "done" && !place ? "empty" : entry.status}
    >
      <div class="ui-crd__place">
        ${this.renderBadge(entry, place)}
        <div class="ui-crd__info">${this.renderInfo(entry, place, m, titleId)}</div>
      </div>
      <dl class="ui-crd__forms">${this.renderForm("decimal", "Decimal", this.decimal(m))} ${this.renderForm("dms", "DMS", this.dms(m))}</dl>
      ${this.renderLinks(point, m)} ${this.renderMap(point)}
    </div>`;
  }

  private renderBadge(entry: Entry, place: CoordinatePlace | null) {
    if (entry.status === "loading") return html`<div class="ui-crd__badge" data-loading aria-hidden="true"></div>`;
    const img = place?.image ? safeMediaUrl(place.image) : undefined;
    if (img) return html`<div class="ui-crd__badge" data-image><img class="ui-crd__img" src=${img} alt="" loading="lazy" decoding="async" @error=${(e: Event) => ((e.target as HTMLElement).hidden = true)} />${glyph(pinIcon, "ui-crd__pin")}</div>`;
    return html`<div class="ui-crd__badge">${glyph(pinIcon, "ui-crd__pin")}</div>`;
  }

  private renderInfo(entry: Entry, place: CoordinatePlace | null, m: CoordinateMatch, titleId: string) {
    if (entry.status === "loading")
      return html`<span class="tc-sr-only">Looking up this place…</span>
        <span class="ui-crd__line" data-w="name" aria-hidden="true"></span>
        <span class="ui-crd__line" data-w="kind" aria-hidden="true"></span>`;
    if (entry.status === "error")
      return html`<p class="ui-crd__msg" data-kind="error">${this.errorText}</p>
        <button type="button" class="tc-btn-sm ui-crd__retry" @click=${() => this.retry(m)}>${glyph(retryIcon)}<span>Retry</span></button>`;
    if (!place) return html`<p class="ui-crd__msg">${this.notFoundText}</p>`;
    const meta = [
      typeof place.elevation === "number" && Number.isFinite(place.elevation) ? `${Math.round(place.elevation).toLocaleString()} m above sea level` : "",
      place.timezone ?? "",
    ].filter(Boolean);
    return html`<p class="ui-crd__name" id=${titleId}>${place.name}</p>
      ${place.kind || place.address ? html`<p class="ui-crd__where">${[place.kind, place.address].filter(Boolean).join(" · ")}</p>` : nothing}
      ${place.description ? html`<p class="ui-crd__desc">${place.description}</p>` : nothing}
      ${meta.length ? html`<p class="ui-crd__meta">${meta.map((x, k) => html`${k ? html`<span aria-hidden="true"> · </span><span class="tc-sr-only">, </span>` : nothing}${x}`)}</p>` : nothing}`;
  }

  private renderForm(notation: CoordinateNotation, name: string, value: string) {
    const done = this.copied === notation;
    const what = notation === "decimal" ? "decimal" : "DMS";
    return html`<div class="ui-crd__form" data-notation=${notation}>
      <dt>${name}</dt>
      <dd>
        <code class="ui-crd__num">${value}</code>
        <button type="button" class="ui-crd__copy" aria-label=${`Copy ${what}`} title=${done ? "Copied" : `Copy ${what}`} ?data-done=${done} @click=${() => void this.copy(notation, value)}>${glyph(done ? checkIcon : copyIcon)}</button>
      </dd>
    </div>`;
  }

  private renderLinks(point: { id: string; latitude: number; longitude: number; label?: string }, m: CoordinateMatch) {
    const links = this.providers
      .map((pr) => ({ pr, url: webUrl(fillGeoTemplate(pr.url, point, this.zoom)) }))
      .filter((l): l is { pr: GeoProvider; url: string } => !!l.url);
    if (!links.length) return nothing;
    const id = `${this.uid}-open`;
    return html`<div class="ui-crd__open">
      <span class="ui-crd__open-label" id=${id}>Open in</span>
      <ul class="ui-crd__links" aria-labelledby=${id}>
        ${links.map(
          ({ pr, url }) => html`<li>
            <a class="ui-crd__link" data-provider=${pr.id} href=${url} target="_blank" rel="noopener noreferrer" @click=${(e: MouseEvent) => this.onOpen(e, pr, url, m)}
              >${pr.name}<span class="tc-sr-only"> (opens in a new tab)</span>${glyph(externalIcon, "ui-crd__ext")}</a
            >
          </li>`,
        )}
      </ul>
    </div>`;
  }

  private renderMap(point: { id: string; latitude: number; longitude: number; label?: string }) {
    if (this.embed === "off") return nothing;
    const src = webUrl(fillGeoTemplate(this.embedSrc, point, this.zoom));
    if (!src) return nothing;
    const name = point.label ?? "this place";
    if (!this.mapShown) {
      let host = "";
      try {
        host = new URL(src).hostname.replace(/^www\./, "");
      } catch {
        host = "";
      }
      return html`<div class="ui-crd__map" data-waiting>
        <button type="button" class="tc-btn-sm ui-crd__show" @click=${() => (this.mapShown = true)}>${glyph(mapIcon)}<span>Show map</span><span class="tc-sr-only"> of ${name}</span></button>
        <span class="ui-crd__map-note">${host ? `Loads from ${host}` : "Loads from another site"}</span>
      </div>`;
    }
    return html`<div class="ui-crd__map">${this.frameFor(src, `Map of ${name}`)}</div>`;
  }

  protected override render() {
    void this.version;
    const list = this.coordinates;
    const hint = `${this.uid}-hint`;
    const body = marks(this.text, list, (seg) => {
      const i = list.indexOf(seg.ranges[0]);
      const open = this.openAt === i && this.pop.open;
      return html`<button
        type="button"
        class="ui-crd__mark"
        data-i=${i}
        aria-haspopup="dialog"
        aria-expanded=${open ? "true" : "false"}
        aria-describedby=${hint}
        ?data-open=${open}
        @pointerenter=${(e: PointerEvent) => this.onHover && this.pop.hoverEnter(e, () => this.open(i))}
        @pointerleave=${this.pop.hoverLeave}
        @click=${(e: MouseEvent) => this.onMarkClick(e, i)}
        @contextmenu=${(e: MouseEvent) => this.onMarkMenu(e, i)}
        @keydown=${(e: KeyboardEvent) => this.onMarkKey(e, i)}
        @focus=${() => this.onHover && (this.openAt !== i || !this.pop.open) && this.open(i)}
      >${seg.text}</button>`;
    });
    const hintText = this.trigger === "contextmenu" ? "Place details. Enter or the Menu key opens them" : "Place details. Tab moves into them";
    return html`<div class="ui-crd__text">${body}</div>${this.renderCard()}<span class="tc-sr-only" id=${hint}>${hintText}</span><span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="crd"] {
  --tc-crd-map-h: 160px;
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-relaxed);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="crd"] *, .ui-crd__pop *, .ui-crd__pop *::before, .ui-crd__pop *::after { box-sizing: border-box; }
:where([data-ui="crd"]) button:not(.tc-btn-sm) { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="crd"]) :is(p, dl, dd, ul) { margin: 0; padding: 0; }
:where([data-ui="crd"]) ul { list-style: none; }
[data-ui="crd"] :is(button, a, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-crd__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-crd__glyph { stroke-width: 1.4; }
.ui-crd__text { white-space: pre-wrap; overflow-wrap: break-word; }
/* ----- The marks ----- */
.ui-crd__mark { display: inline; padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); color: var(--tc-accent-text); font-variant-numeric: tabular-nums; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; box-decoration-break: clone; -webkit-box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-crd__mark { background: var(--tc-accent-subtle); text-decoration-color: color-mix(in srgb, var(--tc-accent-text) 45%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-crd__mark:is(:hover, [data-open]) { background: var(--tc-accent-highlight); text-decoration-color: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-crd__mark { padding: 0; text-decoration-style: dotted; text-decoration-thickness: 1.5px; text-decoration-color: color-mix(in srgb, var(--tc-accent-text) 60%, transparent); }
:where([data-look="clean"], [data-look="clean"] *).ui-crd__mark:is(:hover, [data-open]) { background: var(--tc-accent-subtle); text-decoration-color: currentColor; }
.ui-crd__mark:focus-visible { outline-offset: 1px; }
/* ----- The card (internal/popover.ts places it) ----- */
.tc-pop.ui-crd__pop { display: grid; gap: var(--tc-space-3); width: 320px; padding: var(--tc-space-3); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); text-align: left; -webkit-font-smoothing: antialiased; }
.ui-crd__place { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: var(--tc-space-3); align-items: start; }
.ui-crd__pop:has(.ui-crd__badge[data-image]) .ui-crd__place { grid-template-columns: 56px minmax(0, 1fr); }
.ui-crd__badge { position: relative; display: grid; place-items: center; width: 40px; aspect-ratio: 1; overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-crd__badge[data-image] { width: 56px; background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
:where([data-look="standard"], [data-look="standard"] *) .ui-crd__badge[data-image] { box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *) .ui-crd__badge { background: var(--tc-fill-subtle); color: var(--tc-icon-muted); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-crd__pop:is([data-status="empty"], [data-status="error"]) .ui-crd__badge { background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
.ui-crd__img { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; }
.ui-crd__img[hidden] { display: none; }
.ui-crd__pin { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.ui-crd__info { display: grid; gap: var(--tc-space-1); align-content: start; min-width: 0; min-height: 40px; }
.ui-crd__name { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-crd__where { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-crd__desc { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }
.ui-crd__meta { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-crd__msg { align-self: center; color: var(--tc-text-secondary); }
.ui-crd__msg[data-kind="error"] { color: var(--tc-status-danger-fg); }
.ui-crd__retry { justify-self: start; margin-top: var(--tc-space-1); }
/* Loading: the shapes of what's coming */
.ui-crd__badge[data-loading], .ui-crd__line { background: var(--tc-fill-default); animation: ui-crd-pulse var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
.ui-crd__line { display: block; height: 10px; margin: var(--tc-space-1) 0; border-radius: var(--tc-radius-2xs); }
.ui-crd__line[data-w="name"] { width: 70%; height: 12px; }
.ui-crd__line[data-w="kind"] { width: 45%; }
@keyframes ui-crd-pulse { 50% { opacity: 0.5; } }
/* Both notations, each with Copy */
.ui-crd__forms { display: grid; gap: var(--tc-space-0-5); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-crd__form { display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); }
.ui-crd__form dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-crd__form dd { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-crd__num { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; user-select: all; -webkit-user-select: all; }
.ui-crd__copy { display: grid; place-items: center; flex: none; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-crd__copy:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-crd__copy[data-done] { color: var(--tc-status-success-fg); }
/* Open in */
.ui-crd__open { display: grid; gap: var(--tc-space-1-5); }
.ui-crd__open-label { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-crd__links { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-crd__link { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); text-decoration: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-crd__link:hover { background: var(--tc-fill-strong); }
.ui-crd__ext { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.9; color: var(--tc-text-muted); }
/* The map: behind Show map until asked for */
.ui-crd__map { position: relative; height: var(--tc-crd-map-h); overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-crd__map[data-waiting] { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); height: auto; padding: var(--tc-space-2); }
.ui-crd__show .ui-crd__glyph { width: 14px; height: 14px; }
.ui-crd__map-note { min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: right; overflow-wrap: anywhere; }
.ui-crd__frame { display: block; width: 100%; height: 100%; border: 0; }
@media (forced-colors: active) {
  .ui-crd__mark { forced-color-adjust: none; color: LinkText; background: none; text-decoration-color: LinkText; }
  .ui-crd__mark:is(:hover, [data-open]) { outline: 2px solid Highlight; }
  .ui-crd__badge, .ui-crd__map, .ui-crd__link { border: 1px solid CanvasText; }
}
@media (pointer: coarse) {
  .ui-crd__copy, .ui-crd__link { min-height: var(--tc-control-h-md); min-width: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="crd"] *, .ui-crd__pop, .ui-crd__pop * { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-coordinate-details")) customElements.define("tc-coordinate-details", TcCoordinateDetails);

declare global {
  interface HTMLElementTagNameMap {
    "tc-coordinate-details": TcCoordinateDetails;
  }
}
