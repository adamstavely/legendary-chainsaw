import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { firstOfOverlaps, isWordChar } from "./internal/inline-details";
import { PopoverController } from "./internal/popover";
import { marks } from "./internal/selection";

/*
 * <tc-time-details> – times in a passage of text, found and underlined, each shown in the reader's own time zone.
 * Hovering one (after a short pause) or focusing it opens a small tooltip: "Your local time" and the time where the
 * reader is ("1:00 AM EST"), with the weekday and date when the day isn't the one written ("Saturday, 7 November ·
 * The day before").
 *
 *   <tc-time-details text="The release goes out around 06:00 UTC." date="2026-11-08"></tc-time-details>
 *
 * Only times written with a zone are marked, as only those can be converted: "06:00 UTC", "6 PM ET", "9:30am PST",
 * "18:00 CET", "14:00 GMT+1", "06:00Z", ISO stamps ("2026-11-08T06:00:00Z", "…+05:30"), an ISO date before a time
 * ("2026-11-08 06:00 UTC") and ranges ("14:00–16:00 UTC", the start taking the end's zone). A time without a date
 * falls on `date`, or on today in the zone it was written in. Times without a zone, dates alone and version numbers
 * stay plain text. Generic North American names (ET, CT, MT, PT) follow daylight saving on that date; EST, PDT and
 * the rest are fixed.
 *
 * The reader's zone is the browser's, or `time-zone` (an IANA name such as "America/New_York").
 *
 * Also exported: `findTimes(text, { date, now })` → the ranges the element marks, with the instant each one means.
 *
 * Keyboard. Each mark is in the tab order; focus opens its tooltip, Esc closes it. Each mark is described by the same
 * words the tooltip shows, so a screen reader hears the local time without opening anything.
 *
 * Standard underlines each mark with an accent dotted line and tints it on hover; Clean uses a muted dotted line only.
 */

/** Something found in text: where it is (UTF-16 offsets, `end` exclusive), as written, and the instant it means */
export type TimeMatch = {
  start: number;
  end: number;
  text: string;
  /** The instant, epoch ms */
  at: number;
  /** The zone as written – "UTC", "ET", "+05:30" */
  zone: string;
  /** The written zone's offset from UTC at that instant, minutes (east is positive) */
  offset: number;
  /** A date was written with it; otherwise it fell on `date`, or today in its zone */
  dated: boolean;
};
/** What findTimes needs for times written without a date */
export type FindTimesOptions = {
  /** The day bare times fall on, "YYYY-MM-DD" in the zone each is written in */
  date?: string;
  /** The time now, epoch ms – today is taken from it when `date` isn't given (default: the clock) */
  now?: number;
};
/** The words the tooltip uses, to translate or reword */
export type TimeDetailsLabels = {
  /** Above the converted time */
  yours: string;
  /** After the date when the reader's day is the one before */
  before: string;
  /** After the date when the reader's day is the one after */
  after: string;
  /** Under the time when the reader is in the zone it was written in */
  same: string;
};
/** tc-open-change: the time whose tooltip opened, or null when it closed */
export type TimeOpenChange = { open: TimeMatch | null };

export const defaultTimeDetailsLabels: TimeDetailsLabels = {
  yours: "Your local time",
  before: "The day before",
  after: "The next day",
  same: "Your time zone too",
};

/**
 * The zone names it reads: a fixed offset in minutes, or an IANA zone for names that follow daylight saving. IST,
 * AST and others that name several zones are left out, so they're never converted wrongly.
 */
export const timeZoneAbbreviations: Readonly<Record<string, number | string>> = {
  UTC: 0, GMT: 0, Z: 0, WET: 0, WEST: 60, BST: 60, CET: 60, CEST: 120, EET: 120, EEST: 180, MSK: 180,
  ET: "America/New_York", EST: -300, EDT: -240,
  CT: "America/Chicago", CST: -360, CDT: -300,
  MT: "America/Denver", MST: -420, MDT: -360,
  PT: "America/Los_Angeles", PST: -480, PDT: -420,
  AKST: -540, AKDT: -480, HST: -600,
  SGT: 480, HKT: 480, AWST: 480, JST: 540, KST: 540, ACST: 570, AEST: 600, AEDT: 660, NZST: 720, NZDT: 780,
};

/* ---------- Zones ---------- */

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
type Zone = number | string;
type Wall = { y: number; mo: number; d: number; h: number; mi: number; s: number };

const partsFormats = new Map<string, Intl.DateTimeFormat>();
function partsFormat(zone: string) {
  let f = partsFormats.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    partsFormats.set(zone, f);
  }
  return f;
}

/** The wall clock in `zone` (an IANA name, or a fixed offset in minutes) at instant `ms` */
function wallAt(ms: number, zone: Zone): Wall {
  if (typeof zone === "number") {
    const t = new Date(ms + zone * MIN);
    return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), s: t.getUTCSeconds() };
  }
  const p: Record<string, number> = {};
  for (const x of partsFormat(zone).formatToParts(ms)) if (x.type !== "literal") p[x.type] = Number(x.value);
  return { y: p.year, mo: p.month, d: p.day, h: p.hour % 24, mi: p.minute, s: p.second };
}

/** The zone's offset from UTC at instant `ms`, minutes */
function offsetAt(ms: number, zone: Zone): number {
  if (typeof zone === "number") return zone;
  const w = wallAt(ms, zone);
  return Math.round((Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s) - Math.floor(ms / 1000) * 1000) / MIN);
}

/** The instant a wall-clock time in `zone` means (the later reading when the clocks went back) */
function instantOf(w: Wall, zone: Zone): number {
  const guess = Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s);
  const first = guess - offsetAt(guess, zone) * MIN;
  const second = guess - offsetAt(first, zone) * MIN;
  return second;
}

/** "UTC+5:30" / "GMT-3" / "+05:30" → minutes; NaN when out of range */
function readOffset(sign: string, hh: string, mm = "0") {
  const h = Number(hh);
  const m = Number(mm);
  if (h > 14 || m > 59) return NaN;
  return (sign === "+" ? 1 : -1) * (h * 60 + m);
}

/* ---------- Finding them ---------- */

const ABBR = Object.keys(timeZoneAbbreviations)
  .filter((k) => k !== "Z")
  .sort((a, b) => b.length - a.length)
  .join("|");
/** An ISO stamp with its own offset */
const ISO_RE = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})/g;
/** [ISO date] a clock time [am/pm] and a zone */
const CLOCK_RE = new RegExp(
  String.raw`(?:(\d{4})-(\d{2})-(\d{2})[T ])?(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?(\s?(?:[ap]\.?m\.?))?(?:(Z)|\s?(?:(UTC|GMT)(?:\s?([+\-−])(\d{1,2})(?::?(\d{2}))?)?|(${ABBR})))`,
  "gi",
);
/** The start of a range just before a match: "14:00–", "9 am to " */
const RANGE_START_RE = /(\d{1,2})(?::(\d{2}))?(\s?(?:[ap]\.?m\.?))?\s?(?:–|—|-|to)\s?$/i;

/** Today's date in `zone` at `now` */
function today(now: number, zone: Zone) {
  const w = wallAt(now, zone);
  return { y: w.y, mo: w.mo, d: w.d };
}

function readDate(date: string | undefined) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? "");
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= 31 ? { y, mo, d } : null;
}

/** 24-hour clock from an hour and an optional am/pm; null when it isn't a time */
function hourOf(hh: string, ampm: string | undefined): number | null {
  const h = Number(hh);
  if (!ampm) return h <= 23 ? h : null;
  if (h < 1 || h > 12) return null;
  const pm = /p/i.test(ampm);
  return (h % 12) + (pm ? 12 : 0);
}

function findIso(s: string, out: TimeMatch[]) {
  for (const m of s.matchAll(ISO_RE)) {
    const start = m.index;
    const end = start + m[0].length;
    if (isWordChar(s[start - 1]) || isWordChar(s[end])) continue;
    const at = Date.parse(m[0]);
    if (Number.isNaN(at)) continue;
    const zone = m[7] === "Z" ? "Z" : m[7].replace(/^([+-]\d{2})(\d{2})$/, "$1:$2");
    const offset = m[7] === "Z" ? 0 : readOffset(m[7][0], m[7].slice(1, 3), m[7].slice(-2));
    out.push({ start, end, text: m[0], at, zone, offset, dated: true });
  }
}

function findClocks(s: string, out: TimeMatch[], opts: FindTimesOptions) {
  const fixedDate = readDate(opts.date);
  for (const m of s.matchAll(CLOCK_RE)) {
    const [whole, y, mo, d, hh, mi, sec, ampm, z, utc, sign, oh, om, abbr] = m;
    const start = m.index;
    const end = start + whole.length;
    const prev = s[start - 1];
    // Not inside a word, a number or a longer time; zone names are upper case ("6 pm et al." isn't a time)
    if (isWordChar(prev) || (prev !== undefined && ":.,".includes(prev) && /\d/.test(s[start - 2] ?? ""))) continue;
    if (isWordChar(s[end]) || (s[end] === ":" && /\d/.test(s[end + 1] ?? ""))) continue;
    if ((z && z !== "Z") || (utc && utc !== utc.toUpperCase()) || (abbr && abbr !== abbr.toUpperCase())) continue;
    // A bare hour needs am/pm ("at 6 UTC" could be anything); "Z" sits right against a 24-hour time
    if (mi === undefined && !ampm) continue;
    if (z && ampm) continue;
    const h = hourOf(hh, ampm);
    if (h === null || (mi !== undefined && Number(mi) > 59) || (sec !== undefined && Number(sec) > 59)) continue;
    let zone: Zone;
    let label: string;
    if (z) {
      zone = 0;
      label = "Z";
    } else if (utc) {
      zone = sign ? readOffset(sign === "−" ? "-" : sign, oh, om) : 0;
      label = sign ? `${utc}${sign === "−" ? "-" : sign}${oh}${om ? `:${om}` : ""}` : utc;
    } else {
      zone = timeZoneAbbreviations[abbr];
      label = abbr;
    }
    if (typeof zone === "number" && Number.isNaN(zone)) continue;
    const written = y ? readDate(`${y}-${mo}-${d}`) : null;
    if (y && !written) continue;
    const day = written ?? fixedDate ?? today(opts.now ?? Date.now(), zone);
    const wall: Wall = { ...day, h, mi: Number(mi ?? 0), s: Number(sec ?? 0) };
    const at = instantOf(wall, zone);
    const offset = offsetAt(at, zone);
    out.push({ start, end, text: whole, at, zone: label, offset, dated: !!written });

    // "14:00–16:00 UTC": the start is in the same zone, on the same day
    const before = RANGE_START_RE.exec(s.slice(Math.max(0, start - 16), start));
    if (!before) continue;
    const rs = start - before[0].length;
    if (isWordChar(s[rs - 1]) || (s[rs - 1] === ":" && /\d/.test(s[rs - 2] ?? ""))) continue;
    // "9–5 pm": the start borrows the end's am/pm only when it has none and the end has one
    const rh = hourOf(before[1], before[3] ?? (before[2] === undefined ? ampm : undefined));
    if (rh === null || (before[2] === undefined && !before[3] && !ampm) || (before[2] !== undefined && Number(before[2]) > 59)) continue;
    const rtext = before[0].replace(/\s?(?:–|—|-|to)\s?$/i, "");
    const rat = instantOf({ ...day, h: rh, mi: Number(before[2] ?? 0), s: 0 }, zone);
    out.push({ start: rs, end: rs + rtext.length, text: rtext, at: rat, zone: label, offset: offsetAt(rat, zone), dated: !!written });
  }
}

/**
 * Every time with a zone in `text`, in order, with the instant it means. Times without a date fall on `date`
 * ("YYYY-MM-DD"), or on today (from `now`) in the zone they're written in.
 */
export function findTimes(text: string, opts: FindTimesOptions = {}): TimeMatch[] {
  const s = String(text ?? "");
  const found: TimeMatch[] = [];
  findIso(s, found);
  findClocks(s, found, opts);
  return firstOfOverlaps(found);
}

let instances = 0;

/**
 * Times in text, underlined: hover or focus one to see it in your own time zone.
 * @tag tc-time-details
 * @fires tc-open-change - A tooltip opened or closed ({ open }: TimeOpenChange; null when closed)
 */
export class TcTimeDetails extends TcElement {
  static override ui = "tmd";

  /** The text to find times in: plain text, shown as written (line breaks kept) */
  @property() accessor text = "";
  /** The day times written without a date fall on, "YYYY-MM-DD"; by default today in the zone each is written in */
  @property() accessor date: string | undefined = undefined;
  /** The time now, epoch ms – today is taken from it when `date` isn't given; by default the element's own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The reader's time zone, an IANA name such as "Europe/Berlin"; by default the browser's */
  @property({ attribute: "time-zone" }) accessor timeZone: string | undefined = undefined;
  /** The language for times and dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** How long the pointer rests on a time before its tooltip opens, ms */
  @property({ type: Number, attribute: "hover-delay" }) accessor hoverDelay = 300;
  /** The words the tooltip uses, merged over the defaults */
  @property({ attribute: false }) accessor labels: Partial<TimeDetailsLabels> = {};

  /** @internal The open tooltip's mark (index into the matches), or -1 */
  @state() accessor openAt = -1;
  /** @internal The clock read when the element joined the page */
  @state() accessor clock = 0;

  private readonly uid = `tc-tmd${++instances}`;
  /** The browser's time zone, read when the element joins the page */
  private home = "UTC";
  private found: TimeMatch[] = [];
  private foundFor: string | null = null;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-tmd__pop"),
    anchor: () => {
      const m = this.markAt(this.openAt);
      if (!m?.isConnected) return null;
      return m.getClientRects()[0] ?? m.getBoundingClientRect();
    },
    side: "top",
    align: "center",
    kind: "tooltip",
    trigger: () => this.markAt(this.openAt),
    hover: { delay: () => this.hoverDelay },
    closeOnFocusOut: true,
    onClose: () => this.closed(),
  });

  override connectedCallback() {
    super.connectedCallback();
    if (this.now === undefined) this.clock = Date.now();
    this.home = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /** The times found in `text`, in order */
  get times(): TimeMatch[] {
    const now = this.now ?? this.clock;
    const sig = `${this.date ?? ""}\n${now}\n${this.text}`;
    if (this.foundFor !== sig) {
      this.found = findTimes(this.text, { date: this.date, now });
      this.foundFor = sig;
    }
    return this.found;
  }

  /** Opens the tooltip for the time at `index` in `times`, pinned open */
  openCard(index = 0) {
    this.open(index, true);
  }

  /** Closes the open tooltip, if any */
  closeCard() {
    if (this.pop.open) this.pop.close();
    else this.closed();
  }

  /* ---------- Opening and closing ---------- */

  private markAt(i: number) {
    return i < 0 ? null : this.querySelector<HTMLElement>(`.ui-tmd__mark[data-i="${i}"]`);
  }

  private open(i: number, pin = false) {
    const m = this.times[i];
    if (!m) return;
    if (this.openAt !== i) {
      if (this.openAt >= 0) this.pop.pinned = false;
      this.openAt = i;
      this.emit<TimeOpenChange>("tc-open-change", { open: m });
    }
    this.pop.show({ pin });
  }

  private closed() {
    if (this.openAt < 0) return;
    this.openAt = -1;
    this.emit<TimeOpenChange>("tc-open-change", { open: null });
  }

  private onMarkClick(i: number) {
    // A click or tap pins it open, or closes a pinned one
    if (this.openAt === i && this.pop.open && this.pop.pinned) this.closeCard();
    else this.open(i, true);
  }

  /* ---------- What the tooltip says ---------- */

  private label(key: keyof TimeDetailsLabels) {
    return this.labels[key] ?? defaultTimeDetailsLabels[key];
  }

  /** The reader's zone: `timeZone` when it's a zone the browser knows, else the browser's */
  private get zone(): string | undefined {
    if (!this.timeZone) return undefined;
    try {
      partsFormat(this.timeZone);
      return this.timeZone;
    } catch {
      return undefined;
    }
  }

  private local(m: TimeMatch) {
    const timeZone = this.zone;
    const reader = timeZone ?? this.home;
    const seconds = /:\d{2}:\d{2}/.test(m.text) && new Date(m.at).getUTCSeconds() !== 0;
    const time = new Intl.DateTimeFormat(this.locale, { hour: "numeric", minute: "2-digit", second: seconds ? "2-digit" : undefined, timeZone, timeZoneName: "short" }).format(m.at);
    const mine = wallAt(m.at, reader);
    const theirs = wallAt(m.at, m.offset);
    const shift = Math.round((Date.UTC(mine.y, mine.mo - 1, mine.d) - Date.UTC(theirs.y, theirs.mo - 1, theirs.d)) / DAY);
    const date = new Intl.DateTimeFormat(this.locale, { weekday: "long", day: "numeric", month: "long", timeZone }).format(m.at);
    const relation = shift < 0 ? this.label("before") : shift > 0 ? this.label("after") : "";
    const same = offsetAt(m.at, reader) === m.offset;
    return { time, date: m.dated || shift !== 0 ? date : "", relation, same };
  }

  /* ---------- Render ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The text changed under an open tooltip: close it if what it was for went away
    if ((changed.has("text") || changed.has("date") || changed.has("now")) && this.openAt >= 0) {
      const was = this.found[this.openAt];
      const now = this.times[this.openAt];
      if (!was || !now || was.start !== now.start || was.text !== now.text) {
        if (this.pop.open) this.pop.close("anchor-gone");
        this.closed();
      }
    }
  }

  private renderTooltip() {
    const m = this.times[this.openAt];
    if (!this.pop.open || !m) return nothing;
    const l = this.local(m);
    return html`<div class="tc-pop ui-tmd__pop" id=${`${this.uid}-tip`} aria-hidden="true">
      <p class="ui-tmd__label">${this.label("yours")}</p>
      <p class="ui-tmd__time">${l.time}</p>
      ${l.date ? html`<p class="ui-tmd__date">${l.date}${l.relation ? html` · <span class="ui-tmd__rel">${l.relation}</span>` : nothing}</p>` : nothing}
      ${l.same ? html`<p class="ui-tmd__same">${this.label("same")}</p>` : nothing}
    </div>`;
  }

  protected override render() {
    const list = this.times;
    const body = marks(this.text, list, (seg) => {
      const i = list.indexOf(seg.ranges[0]);
      const m = list[i];
      const open = this.openAt === i && this.pop.open;
      return html`<time
        class="ui-tmd__mark"
        tabindex="0"
        datetime=${new Date(m.at).toISOString()}
        data-i=${i}
        aria-describedby=${`${this.uid}-d${i}`}
        ?data-open=${open}
        @pointerenter=${(e: PointerEvent) => this.pop.hoverEnter(e, () => this.open(i))}
        @pointerleave=${this.pop.hoverLeave}
        @click=${() => this.onMarkClick(i)}
        @focus=${() => (this.openAt !== i || !this.pop.open) && this.open(i)}
      >${seg.text}</time>`;
    });
    return html`<div class="ui-tmd__text">${body}</div>
      ${this.renderTooltip()}
      ${list.map((m, i) => {
        const l = this.local(m);
        return html`<span class="tc-sr-only" id=${`${this.uid}-d${i}`}>${this.label("yours")}: ${l.time}${l.date ? `, ${l.date}` : ""}${l.relation ? `, ${l.relation.toLowerCase()}` : ""}</span>`;
      })}`;
  }

  static override css = /* css */ `
[data-ui="tmd"] {
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
[data-ui="tmd"] *, .ui-tmd__pop * { box-sizing: border-box; }
:where(.ui-tmd__pop) p { margin: 0; }
.ui-tmd__text { white-space: pre-wrap; overflow-wrap: break-word; }
/* ----- The marks ----- */
.ui-tmd__mark { border-radius: var(--tc-radius-2xs); color: inherit; font-variant-numeric: tabular-nums; text-decoration: underline dotted; text-decoration-thickness: 1.5px; text-underline-offset: 3px; cursor: help; box-decoration-break: clone; -webkit-box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tmd__mark:focus-visible { outline: var(--tc-focus-outline); outline-offset: 1px; }
:where([data-look="standard"], [data-look="standard"] *).ui-tmd__mark { text-decoration-color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-tmd__mark:is(:hover, [data-open]) { background: var(--tc-accent-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-tmd__mark { text-decoration-color: color-mix(in srgb, currentColor 45%, transparent); }
:where([data-look="clean"], [data-look="clean"] *).ui-tmd__mark:is(:hover, [data-open]) { text-decoration-color: currentColor; }
/* ----- The tooltip (internal/popover.ts places it) ----- */
.tc-pop.ui-tmd__pop { display: grid; gap: var(--tc-space-0-5); max-width: 280px; padding: var(--tc-space-2) var(--tc-space-3); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-align: left; -webkit-font-smoothing: antialiased; }
.ui-tmd__label { color: var(--tc-text-muted); }
.ui-tmd__time { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); font-variant-numeric: tabular-nums; }
.ui-tmd__date { color: var(--tc-text-secondary); }
.ui-tmd__rel { color: var(--tc-text-primary); }
.ui-tmd__same { color: var(--tc-text-muted); }
@media (forced-colors: active) {
  .ui-tmd__mark { forced-color-adjust: none; color: CanvasText; text-decoration-color: LinkText; background: none; }
  .ui-tmd__mark:is(:hover, [data-open]) { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-tmd__mark { transition: none; }
}
`;
}

if (!customElements.get("tc-time-details")) customElements.define("tc-time-details", TcTimeDetails);

declare global {
  interface HTMLElementTagNameMap {
    "tc-time-details": TcTimeDetails;
  }
}
