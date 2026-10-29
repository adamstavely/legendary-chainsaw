import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeMediaUrl } from "./internal/safe-media";
import { safeUrl } from "./internal/safe-url";
import { initials } from "./internal/util";

/*
 * <tc-team-roster> – a team directory that knows what time it is for everyone: each member's picture or initials with
 * a status dot (Available, Busy, Away, Offline – said in words too), name, role and team, their local time with how
 * far ahead or behind you they are ("4:12 PM · 6 h ahead"), whether they're in their working hours, and their skills.
 * A strip across the top shows the 24 hours of your day, darker where more of the team is working, and names the best
 * hour to meet ("Best time to meet: 15:00–16:00 your time").
 *   · group by team, role or time zone (or not at all), filter by name, role, team or skill, and show a list or a
 *     grid – each a property with a cancelable tc-…-change, so the page can own it
 *   · a member's buttons are one tab stop: ↑ / ↓ move between members (in the grid, by a row of cards), ← / → between
 *     a member's buttons, Home / End to the first and last. The name selects (tc-selected-change), Email opens a
 *     mailto: link, Message fires tc-action
 *   · times come from `now`, or the element's own clock, read again every minute; "your time" is `viewer-timezone`,
 *     by default the browser's
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-team-roster .members=${[{ id: "a", name: "Ana Lima", role: "Data engineer", timezone: "America/Sao_Paulo" }]}></tc-team-roster>
 */

export type RosterStatus = "available" | "busy" | "away" | "offline";
export type RosterMember = {
  id: string;
  name: string;
  role?: string;
  team?: string;
  /** A picture URL; without one the member shows their initials */
  avatar?: string;
  email?: string;
  /** An IANA time zone: "Europe/Lisbon" */
  timezone?: string;
  /** Their working day in their own time, "09:00" to "17:30"; 09:00–17:30 when they have a time zone but no hours */
  workingHours?: { start: string; end: string };
  status?: RosterStatus;
  skills?: string[];
};
export type RosterGroup = "team" | "role" | "timezone" | "none";
export type RosterView = "list" | "grid";

/** Details of the events */
export type RosterGroupChange = { groupBy: RosterGroup };
export type RosterFilterChange = { filter: string };
export type RosterViewChange = { view: RosterView };
export type RosterSelectedChange = { selected: string | null; member: RosterMember | null };
export type RosterAction = { action: "message"; member: RosterMember };

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const DEFAULT_HOURS = { start: "09:00", end: "17:30" };
const STATUS_WORDS: Record<RosterStatus, string> = { available: "Available", busy: "Busy", away: "Away", offline: "Offline" };
const HUES = ["teal", "violet", "amber", "pink", "rose"];
const hue = (name: string) => HUES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length];

let uidCount = 0;

/* users, mail, message-square, sun, moon, search, list, layout-grid: Lucide (ISC, lucide.dev) */
const usersIcon = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const mailIcon = () => lucide(15, svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`);
const messageIcon = () => lucide(15, svg`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`);
const sunIcon = () => lucide(12, svg`<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>`);
const moonIcon = () => lucide(12, svg`<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`);
const searchIcon = () => lucide(14, svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`);
const listIcon = () => lucide(14, svg`<path d="M3 12h.01"></path><path d="M3 18h.01"></path><path d="M3 6h.01"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M8 6h13"></path>`);
const gridIcon = () => lucide(14, svg`<rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect>`);

/* ---------- Time zone helpers, exported for pages ---------- */

const offsetCache = new Map<string, Intl.DateTimeFormat>();
/** A time zone's offset from UTC at an instant, in minutes (Lisbon in summer: 60); null for a zone the browser doesn't know */
export function zoneOffset(timeZone: string, at: number): number | null {
  let f = offsetCache.get(timeZone);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    } catch {
      return null;
    }
    offsetCache.set(timeZone, f);
  }
  const p = Object.fromEntries(f.formatToParts(new Date(at)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24, Number(p.minute), Number(p.second));
  return Math.round((asUtc - Math.floor(at / 1000) * 1000) / MIN);
}
/** "+6 h ahead", "2.5 h behind", "same time" – how a zone's clock compares with the viewer's */
export function relativeOffset(minutes: number) {
  if (minutes === 0) return "same time";
  const h = Math.abs(minutes) / 60;
  const n = Number.isInteger(h) ? String(h) : h.toFixed(1).replace(/\.0$/, "");
  return `${n} h ${minutes > 0 ? "ahead" : "behind"}`;
}
const toMinutes = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};
/** Whether a minute of the day falls in working hours (which may run past midnight) */
const inHours = (minute: number, start: number, end: number) => (start <= end ? minute >= start && minute < end : minute >= start || minute < end);
const browserZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/**
 * A team directory with everyone's local time – status, role and team, how far ahead or behind you they are, whether
 * they're working, skills – grouped and filtered, as a list or a grid, with the team's best hour to meet.
 * @tag tc-team-roster
 * @fires tc-group-change - The grouping changed ({ groupBy }: RosterGroupChange); cancelable – prevented, `groupBy` stays as it was
 * @fires tc-filter-change - The filter text changed ({ filter }: RosterFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-view-change - List or grid ({ view }: RosterViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-selected-change - A member was selected, or unselected ({ selected, member }: RosterSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-action - Message was pressed on a member ({ action: "message", member }: RosterAction)
 */
export class TcTeamRoster extends TcElement {
  static override ui = "ros";

  /** The heading, and the roster's name */
  @property() accessor heading = "Team";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The members, in order */
  @property({ attribute: false }) accessor members: RosterMember[] = [];
  /** The time now, epoch ms; by default the element's own clock, read every minute */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** "Your time": the viewer's IANA time zone; by default the browser's */
  @property({ attribute: "viewer-timezone" }) accessor viewerTimezone: string | undefined = undefined;
  /** How members are grouped. Changed by the user unless a tc-group-change listener calls preventDefault() */
  @property({ attribute: "group-by" }) accessor groupBy: RosterGroup = "team";
  /** What the filter box holds. Changed by the user unless tc-filter-change is prevented */
  @property() accessor filter = "";
  /** A list or a grid of cards. Changed by the user unless tc-view-change is prevented */
  @property({ reflect: true }) accessor view: RosterView = "list";
  /** The selected member's id. Changed by the user unless tc-selected-change is prevented */
  @property() accessor selected: string | null = null;
  /** The language for times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor clock = 0;
  @state() private accessor active = { r: 0, c: 0 };
  @state() private accessor announce = "";

  private uid = `tc-ros-${++uidCount}`;
  private timer = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.tick();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.timer);
    this.timer = 0;
  }
  private tick() {
    clearInterval(this.timer);
    this.timer = 0;
    if (this.now !== undefined) return;
    this.readClock();
    this.timer = window.setInterval(this.readClock, MIN);
  }
  private readClock = () => (this.clock = Date.now());

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("now") && this.isConnected) this.tick();
    const n = this.shown.length;
    if (n && this.active.r > n - 1) this.active = { r: n - 1, c: 0 };
  }

  /* ---------- The model ---------- */

  private get time() {
    return this.now ?? this.clock;
  }
  private get zone() {
    // A zone the browser doesn't know: the browser's own, rather than a broken chart
    const z = this.viewerTimezone;
    return z && zoneOffset(z, this.time) !== null ? z : browserZone();
  }
  private get viewerOffset() {
    return zoneOffset(this.zone, this.time) ?? 0;
  }

  private passes(m: RosterMember) {
    const q = this.filter.trim().toLowerCase();
    if (!q) return true;
    return [m.name, m.role, m.team, m.timezone, ...(m.skills ?? [])].some((v) => v?.toLowerCase().includes(q));
  }

  private groupKey(m: RosterMember) {
    if (this.groupBy === "team") return m.team ?? "No team";
    if (this.groupBy === "role") return m.role ?? "No role";
    if (this.groupBy === "timezone") return m.timezone ? this.zoneName(m.timezone) : "No time zone";
    return "";
  }

  /** The groups shown, in the members' order of first appearance, each with its members */
  private get groups(): { name: string; members: RosterMember[] }[] {
    const out: { name: string; members: RosterMember[] }[] = [];
    let list = this.members.filter((m) => this.passes(m));
    if (this.groupBy === "timezone") list = [...list].sort((a, b) => (this.offsetOf(a) ?? 9999) - (this.offsetOf(b) ?? 9999));
    for (const m of list) {
      const k = this.groupKey(m);
      const g = out.find((x) => x.name === k);
      if (g) g.members.push(m);
      else out.push({ name: k, members: [m] });
    }
    return out;
  }
  /** Members in the order they're shown – the keyboard's order */
  private get shown() {
    return this.groups.flatMap((g) => g.members);
  }

  private offsetOf(m: RosterMember) {
    return m.timezone ? zoneOffset(m.timezone, this.time) : null;
  }
  /** "Lisbon · UTC+1" */
  private zoneName(tz: string) {
    const city = tz.split("/").pop()!.replace(/_/g, " ");
    const off = zoneOffset(tz, this.time);
    if (off === null) return city;
    const h = Math.trunc(Math.abs(off) / 60);
    const mm = Math.abs(off) % 60;
    return `${city} · UTC${off < 0 ? "−" : "+"}${h}${mm ? `:${String(mm).padStart(2, "0")}` : ""}`;
  }
  private hoursOf(m: RosterMember) {
    const w = m.workingHours ?? DEFAULT_HOURS;
    return { start: toMinutes(w.start), end: toMinutes(w.end) };
  }
  private localTime(m: RosterMember) {
    if (!m.timezone || this.offsetOf(m) === null) return null;
    return new Intl.DateTimeFormat(this.locale, { hour: "numeric", minute: "2-digit", timeZone: m.timezone }).format(new Date(this.time));
  }
  private working(m: RosterMember) {
    const off = this.offsetOf(m);
    if (off === null) return null;
    const minute = (((Math.floor((this.time + off * MIN) / MIN) % 1440) + 1440) % 1440);
    const h = this.hoursOf(m);
    return inHours(minute, h.start, h.end);
  }

  /** For each hour of the viewer's day: how many members are in their working hours then */
  private get overlap() {
    const people = this.members.filter((m) => m.timezone && this.offsetOf(m) !== null);
    const vo = this.viewerOffset;
    const dayStart = Math.floor((this.time + vo * MIN) / DAY) * DAY - vo * MIN;
    const counts = Array.from({ length: 24 }, (_, h) => {
      const at = dayStart + h * HOUR + 30 * MIN;
      return people.filter((m) => {
        const off = zoneOffset(m.timezone!, at)!;
        const minute = (((Math.floor((at + off * MIN) / MIN) % 1440) + 1440) % 1440);
        const w = this.hoursOf(m);
        return inHours(minute, w.start, w.end);
      }).length;
    });
    const max = Math.max(0, ...counts);
    // The best run: the longest stretch of hours at the most people
    let best = { from: -1, to: -1 };
    if (max > 0) {
      for (let h = 0; h < 24; h++) {
        if (counts[h] !== max) continue;
        let e = h;
        while (e + 1 < 24 && counts[e + 1] === max) e++;
        if (best.from < 0 || e - h > best.to - best.from) best = { from: h, to: e + 1 };
        h = e;
      }
    }
    const nowHour = Math.floor((this.time - dayStart) / HOUR);
    return { counts, max, people: people.length, best, dayStart, nowHour };
  }

  private hourLabel(dayStart: number, h: number) {
    return new Intl.DateTimeFormat(this.locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: this.zone }).format(new Date(dayStart + h * HOUR));
  }

  /* ---------- Actions ---------- */

  private setGroup(groupBy: RosterGroup) {
    if (groupBy === this.groupBy) return;
    if (!this.emit<RosterGroupChange>("tc-group-change", { groupBy }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.groupBy = groupBy;
  }
  private setFilter(filter: string) {
    if (!this.emit<RosterFilterChange>("tc-filter-change", { filter }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.filter = filter;
    this.active = { r: 0, c: 0 };
    const n = this.shown.length;
    this.announce = filter.trim() ? `${n} ${n === 1 ? "member" : "members"}` : "";
  }
  private setView(view: RosterView) {
    if (view === this.view) return;
    if (!this.emit<RosterViewChange>("tc-view-change", { view }, { cancelable: true })) return;
    this.view = view;
  }
  private select(m: RosterMember) {
    const next = this.selected === m.id ? null : m.id;
    if (!this.emit<RosterSelectedChange>("tc-selected-change", { selected: next, member: next ? m : null }, { cancelable: true })) return;
    this.selected = next;
    this.announce = next ? `${m.name} selected` : `${m.name} unselected`;
  }

  /* ---------- Keyboard: one tab stop for the members' buttons ---------- */

  /** A member's buttons, left to right: 0 the name, 1 Email (with an address), 2 Message */
  private cols(r: number) {
    const m = this.shown[r];
    return m?.email && safeUrl(`mailto:${m.email}`) ? [0, 1, 2] : [0, 2];
  }
  private focusAt(r: number, c: number) {
    const n = this.shown.length;
    if (!n) return;
    r = Math.max(0, Math.min(n - 1, r));
    const cols = this.cols(r);
    if (!cols.includes(c)) c = cols.reduce((a, b) => (Math.abs(b - c) < Math.abs(a - c) ? b : a), cols[0]);
    this.active = { r, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${c}"]`)?.focus());
  }
  /** ↑ / ↓: a row up or down within the member's own group's grid, then on into the next group at the same column */
  private vertical(r: number, dir: 1 | -1, cols: number) {
    const spans: [number, number][] = [];
    let at = 0;
    for (const g of this.groups) {
      spans.push([at, at + g.members.length]);
      at += g.members.length;
    }
    const gi = spans.findIndex(([s, e]) => r >= s && r < e);
    if (gi < 0) return -1;
    const [s, e] = spans[gi];
    const next = r + dir * cols;
    if (next >= s && next < e) return next;
    // Down from a full row onto a shorter last one: its last card
    if (dir > 0 && Math.floor((e - 1 - s) / cols) > Math.floor((r - s) / cols)) return e - 1;
    const to = spans[gi + dir];
    if (!to) return -1;
    const [ts, te] = to;
    const row = dir > 0 ? 0 : Math.floor((te - 1 - ts) / cols);
    return Math.min(ts + row * cols + ((r - s) % cols), te - 1);
  }
  /** How many cards sit in a row of the grid (read when a key is pressed) */
  private gridColumns() {
    const grid = this.querySelector<HTMLElement>(".ui-ros__members[data-view='grid']");
    if (!grid) return 1;
    return getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
  }
  private onKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const [r, c] = el.dataset.at!.split(":").map(Number);
    const cols = this.cols(r);
    const i = cols.indexOf(c);
    const step = this.view === "grid" ? this.gridColumns() : 1;
    const n = this.shown.length;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [this.vertical(r, -1, step), c],
      ArrowDown: [this.vertical(r, 1, step), c],
      ArrowLeft: i > 0 ? [r, cols[i - 1]] : [r - 1, 2],
      ArrowRight: i < cols.length - 1 ? [r, cols[i + 1]] : [r + 1, 0],
      Home: [0, 0],
      End: [n - 1, 0],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    // Past either end the focus stays where it is
    if (move[0] < 0 || move[0] > n - 1) return;
    this.focusAt(move[0], move[1]);
  };

  /* ---------- Rendering ---------- */

  private renderOverlap() {
    const o = this.overlap;
    if (o.people < 2) return nothing;
    const best = o.best.from >= 0 ? `${this.hourLabel(o.dayStart, o.best.from)}–${this.hourLabel(o.dayStart, o.best.to)}` : "";
    const summary = best ? `Best time to meet: ${best} your time, when ${o.max} of ${o.people} are working` : "No hour when most of the team is working";
    return html`<div class="ui-ros__overlap">
      <div class="ui-ros__overlap-head">
        <span class="ui-ros__overlap-label">Overlap</span>
        <span class="ui-ros__best">${best ? html`Best time to meet: <strong>${best}</strong> your time` : "No shared working hour"}</span>
      </div>
      <div class="ui-ros__bar" role="img" aria-label=${summary}>
        ${o.counts.map((n, h) => {
          const level = o.max ? Math.round((n / o.people) * 4) : 0;
          return html`<span class="ui-ros__hour" data-level=${level} ?data-best=${h >= o.best.from && h < o.best.to} ?data-now=${h === o.nowHour} title=${`${this.hourLabel(o.dayStart, h)} · ${n} of ${o.people} working`}></span>`;
        })}
      </div>
      <div class="ui-ros__ticks" aria-hidden="true">
        ${[0, 6, 12, 18].map((h) => html`<span style=${`left:${(h / 24) * 100}%`}>${this.hourLabel(o.dayStart, h)}</span>`)}
      </div>
    </div>`;
  }

  private avatar(m: RosterMember) {
    const src = safeMediaUrl(m.avatar);
    const st = m.status;
    return html`<span class="ui-ros__avatar" data-hue=${hue(m.name)} aria-hidden="true"
      >${src ? html`<img src=${src} alt="" />` : initials(m.name)}${st ? html`<span class="ui-ros__dot" data-status=${st}></span>` : nothing}</span
    >`;
  }

  private renderMember(m: RosterMember, r: number) {
    const tab = (c: number) => (this.active.r === r && this.active.c === c ? 0 : -1);
    const focus = (c: number) => () => (this.active = { r, c });
    const time = this.localTime(m);
    const off = this.offsetOf(m);
    const rel = off === null ? "" : relativeOffset(off - this.viewerOffset);
    const working = this.working(m);
    const mail = m.email ? safeUrl(`mailto:${m.email}`) : undefined;
    const sel = this.selected === m.id;
    return html`<li class="ui-ros__member" data-id=${m.id} ?data-selected=${sel}>
      ${this.avatar(m)}
      <div class="ui-ros__who">
        <button type="button" class="ui-ros__name" data-at=${`${r}:0`} tabindex=${tab(0)} aria-pressed=${sel ? "true" : "false"} @focus=${focus(0)} @click=${() => this.select(m)}>
          ${m.name}${m.status ? html`<span class="tc-sr-only">, ${STATUS_WORDS[m.status]}</span>` : nothing}
        </button>
        <span class="ui-ros__role">${m.role ?? ""}${m.team && this.groupBy !== "team" ? html`<span class="ui-ros__team">${m.team}</span>` : nothing}</span>
        ${m.skills?.length ? html`<span class="ui-ros__skills">${m.skills.map((s) => html`<span class="ui-ros__skill">${s}</span>`)}</span>` : nothing}
      </div>
      <div class="ui-ros__when">
        ${time
          ? html`<span class="ui-ros__time">${time}</span>
              <span class="ui-ros__rel">${rel}</span>
              ${working === null
                ? nothing
                : html`<span class="ui-ros__hours" ?data-working=${working}>${working ? sunIcon() : moonIcon()}${working ? "Working hours" : "Outside hours"}</span>`}`
          : html`<span class="ui-ros__rel">No time zone</span>`}
      </div>
      <span class="ui-ros__actions">
        ${mail
          ? html`<a class="ui-ros__btn" href=${mail} data-at=${`${r}:1`} tabindex=${tab(1)} title="Email" @focus=${focus(1)}>${mailIcon()}<span class="tc-sr-only">Email ${m.name}</span></a>`
          : nothing}
        <button type="button" class="ui-ros__btn" data-at=${`${r}:2`} tabindex=${tab(2)} title="Message" @focus=${focus(2)} @click=${() => this.emit<RosterAction>("tc-action", { action: "message", member: m })}>
          ${messageIcon()}<span class="tc-sr-only">Message ${m.name}</span>
        </button>
      </span>
    </li>`;
  }

  private renderControls() {
    const id = this.uid;
    const groups: [RosterGroup, string][] = [
      ["team", "Team"],
      ["role", "Role"],
      ["timezone", "Time zone"],
      ["none", "None"],
    ];
    return html`<div class="ui-ros__controls">
      <label class="ui-ros__filter">
        <span class="ui-ros__filter-icon" aria-hidden="true">${searchIcon()}</span>
        <span class="tc-sr-only">Filter members</span>
        <input
          type="search"
          class="ui-ros__filter-input"
          placeholder="Filter by name, role or skill"
          .value=${live(this.filter)}
          @input=${(e: Event) => this.setFilter((e.target as HTMLInputElement).value)}
        />
      </label>
      <label class="ui-ros__group">
        <span class="ui-ros__group-label" id=${`${id}-group`}>Group by</span>
        <span class="ui-ros__select"
          ><select aria-labelledby=${`${id}-group`} .value=${live(this.groupBy)} @change=${(e: Event) => this.setGroup((e.target as HTMLSelectElement).value as RosterGroup)}>
            ${groups.map(([v, l]) => html`<option value=${v} ?selected=${v === this.groupBy}>${l}</option>`)}
          </select></span
        >
      </label>
      <div class="ui-ros__views" role="radiogroup" aria-label="Show as">
        ${(["list", "grid"] as const).map(
          (v) => html`<button
            type="button"
            role="radio"
            class="ui-ros__view"
            aria-checked=${this.view === v ? "true" : "false"}
            tabindex=${this.view === v ? 0 : -1}
            title=${v === "list" ? "List" : "Grid"}
            @click=${() => this.setView(v)}
            @keydown=${(e: KeyboardEvent) => {
              if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
              e.preventDefault();
              this.setView(this.view === "list" ? "grid" : "list");
              void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ros__view[aria-checked='true']")?.focus());
            }}
          >${v === "list" ? listIcon() : gridIcon()}<span class="tc-sr-only">${v === "list" ? "List" : "Grid"}</span></button>`,
        )}
      </div>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const groups = this.groups;
    const n = this.members.length;
    let r = 0;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <span class="tc-sr-only" id=${`${id}-keys`}>Up and down arrows move between members, left and right between a member's buttons</span>
      ${cardHead({
        icon: usersIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: n ? html`<span class="ui-ros__count"><span class="ui-ros__count-n">${n}</span> ${n === 1 ? "member" : "members"}</span>` : nothing,
      })}
      <div class="ui-ros__card">
        ${this.renderOverlap()} ${n ? this.renderControls() : nothing}
        ${!n
          ? html`<p class="ui-ros__empty">No one on this team yet.</p>`
          : !groups.length
            ? html`<p class="ui-ros__empty">No one matches “${this.filter.trim()}”.</p>`
            : html`<div class="ui-ros__groups" @keydown=${this.onKey}>
                ${groups.map((g) => {
                  const list = html`<ul class="ui-ros__members" data-view=${this.view} aria-labelledby=${ifDefined(g.name ? undefined : `${id}-title`)} aria-label=${ifDefined(g.name ? `${g.name}, ${g.members.length}` : undefined)} aria-describedby=${`${id}-keys`}>
                    ${g.members.map((m) => this.renderMember(m, r++))}
                  </ul>`;
                  return g.name
                    ? html`<section class="ui-ros__section">
                        <h4 class="ui-ros__section-name">${g.name} <span class="ui-ros__section-count">${g.members.length}</span></h4>
                        ${list}
                      </section>`
                    : list;
                })}
              </div>`}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="ros"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a gray tray holding a white card. Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ros"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-ros__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ros"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-ros__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="ros"] *, [data-ui="ros"] *::before, [data-ui="ros"] *::after { box-sizing: border-box; }
:where([data-ui="ros"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ros"] :is(button, a, select, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="ros"]) :is(h4, p, ul) { margin: 0; padding: 0; }
[data-ui="ros"] ul { list-style: none; }
[data-ui="ros"] svg { display: block; flex: none; }
.ui-ros__count { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-ros__count-n { color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* ----- The overlap strip ----- */
.ui-ros__overlap { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-ros__overlap-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); }
.ui-ros__overlap-label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-ros__best { color: var(--tc-text-secondary); }
.ui-ros__best strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-ros__bar { display: grid; grid-template-columns: repeat(24, minmax(0, 1fr)); gap: var(--tc-space-0-5); height: var(--tc-space-5); }
.ui-ros__hour { position: relative; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-subtle); }
.ui-ros__hour[data-level="1"] { background: color-mix(in srgb, var(--tc-status-success-solid) 22%, transparent); }
.ui-ros__hour[data-level="2"] { background: color-mix(in srgb, var(--tc-status-success-solid) 42%, transparent); }
.ui-ros__hour[data-level="3"] { background: color-mix(in srgb, var(--tc-status-success-solid) 65%, transparent); }
.ui-ros__hour[data-level="4"] { background: var(--tc-status-success-solid); }
.ui-ros__hour[data-best] { box-shadow: 0 0 0 var(--tc-hairline) var(--tc-text-primary); }
.ui-ros__hour[data-now]::after { content: ""; position: absolute; left: 50%; top: calc(-1 * var(--tc-space-1)); bottom: calc(-1 * var(--tc-space-1)); width: 2px; border-radius: var(--tc-radius-full); background: var(--tc-text-primary); transform: translateX(-50%); }
.ui-ros__ticks { position: relative; height: var(--tc-space-4); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-ros__ticks span { position: absolute; top: 0; }
/* ----- Controls ----- */
.ui-ros__controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); }
.ui-ros__filter { position: relative; display: block; flex: 1 1 12rem; min-width: 0; }
.ui-ros__filter-icon { position: absolute; top: 50%; left: var(--tc-space-2-5); color: var(--tc-icon-muted); transform: translateY(-50%); pointer-events: none; }
.ui-ros__filter-input { width: 100%; height: var(--tc-control-h-md); padding: 0 var(--tc-field-px) 0 calc(var(--tc-space-2-5) + var(--tc-space-5)); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-fill-subtle); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; }
.ui-ros__filter-input::placeholder { color: var(--tc-text-placeholder); }
.ui-ros__filter-input::-webkit-search-cancel-button { display: none; }
.ui-ros__filter-input:hover { background: var(--tc-fill-hover); }
.ui-ros__filter-input:focus-visible { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); outline: none; }
.ui-ros__group { display: inline-flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-ros__select { position: relative; display: inline-block; }
.ui-ros__select::after { content: ""; position: absolute; top: 50%; right: var(--tc-space-2-5); width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-right: 1.5px solid var(--tc-icon-muted); border-bottom: 1.5px solid var(--tc-icon-muted); transform: translateY(-70%) rotate(45deg); pointer-events: none; }
.ui-ros__select select { appearance: none; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-7) 0 var(--tc-space-2-5); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-ros__views { display: inline-flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-ros__view { display: grid; place-items: center; width: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); color: var(--tc-text-muted); }
.ui-ros__view[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
/* ----- Groups and members ----- */
.ui-ros__groups { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-3); }
.ui-ros__section { display: grid; gap: var(--tc-space-1); }
.ui-ros__section-name { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-2) var(--tc-space-2) 0; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-ros__section-count { font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-ros__members[data-view="list"] { display: grid; }
.ui-ros__members[data-view="grid"] { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--tc-space-2); padding: var(--tc-space-1); }
.ui-ros__member { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ros__members[data-view="list"] .ui-ros__member + .ui-ros__member::before { content: ""; position: absolute; top: 0; left: var(--tc-space-2); right: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ros__member:hover { background: var(--tc-menu-item-hover); }
.ui-ros__member[data-selected] { background: var(--tc-fill-selected); }
.ui-ros__member[data-selected] :is(.ui-ros__rel, .ui-ros__hours:not([data-working])) { color: var(--tc-text-secondary); }
.ui-ros__members[data-view="grid"] .ui-ros__member { grid-template-columns: auto minmax(0, 1fr); align-items: start; padding: var(--tc-space-3); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-ros__members[data-view="grid"] .ui-ros__when { grid-column: 1 / -1; justify-items: start; }
.ui-ros__members[data-view="grid"] .ui-ros__actions { position: absolute; top: var(--tc-space-2); right: var(--tc-space-2); }
/* The avatar: a picture or initials on a tone, with the status dot */
.ui-ros__avatar { position: relative; display: grid; flex: none; place-items: center; width: var(--tc-space-8); height: var(--tc-space-8); border-radius: var(--tc-radius-full); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); }
.ui-ros__avatar img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.ui-ros__avatar[data-hue="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-ros__avatar[data-hue="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-ros__avatar[data-hue="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-ros__avatar[data-hue="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-ros__avatar[data-hue="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
.ui-ros__dot { position: absolute; right: calc(-1 * var(--tc-space-0-5)); bottom: calc(-1 * var(--tc-space-0-5)); width: var(--tc-space-2-5); height: var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-icon-muted); box-shadow: 0 0 0 2px var(--tc-surface-raised); }
.ui-ros__dot[data-status="available"] { background: var(--tc-status-success-solid); }
.ui-ros__dot[data-status="busy"] { background: var(--tc-status-danger-solid); }
.ui-ros__dot[data-status="away"] { background: var(--tc-status-warning-solid); }
.ui-ros__dot[data-status="offline"] { background: var(--tc-surface-raised); box-shadow: 0 0 0 2px var(--tc-surface-raised), inset 0 0 0 2px var(--tc-icon-muted); }
.ui-ros__who { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-ros__name { justify-self: start; max-width: 100%; overflow: hidden; border-radius: var(--tc-radius-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); text-align: left; text-overflow: ellipsis; white-space: nowrap; }
.ui-ros__name:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-ros__role { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-ros__team { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); }
.ui-ros__skills { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-ros__skill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-pill-font-size); color: var(--tc-text-secondary); }
.ui-ros__when { display: grid; justify-items: end; gap: 0; font-size: var(--tc-font-size-sm); }
.ui-ros__time { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-ros__rel { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; }
.ui-ros__hours { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; }
.ui-ros__hours[data-working] { color: var(--tc-status-success-fg); }
.ui-ros__actions { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); }
.ui-ros__btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); text-decoration: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ros__btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-ros__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
@container (max-width: 520px) {
  .ui-ros__members[data-view="list"] .ui-ros__member { grid-template-columns: auto minmax(0, 1fr) auto; }
  .ui-ros__members[data-view="list"] .ui-ros__when { grid-column: 2; grid-row: 2; justify-items: start; }
  .ui-ros__members[data-view="list"] .ui-ros__actions { grid-column: 3; grid-row: 1 / span 2; }
  .ui-ros__ticks span:nth-child(even) { display: none; }
}
@media (forced-colors: active) {
  .ui-ros__hour { border: 1px solid CanvasText; }
  .ui-ros__view[aria-checked="true"], .ui-ros__member[data-selected] { outline: 2px solid Highlight; }
  .ui-ros__dot { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ros"] *, [data-ui="ros"] *::before, [data-ui="ros"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-team-roster")) customElements.define("tc-team-roster", TcTeamRoster);

declare global {
  interface HTMLElementTagNameMap {
    "tc-team-roster": TcTeamRoster;
  }
}
