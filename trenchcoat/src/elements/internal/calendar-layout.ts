/*
 * The maths behind <tc-multi-calendar>, kept pure so it can be tested on its own and run outside render:
 *   · wall-clock time in a time zone – `wall()` reads a moment's date and time there, `zoned()` turns a date and time
 *     there back into epoch ms. Without a zone they use the browser's own; days are counted in wall days, so a day
 *     that loses or gains an hour to daylight saving is still one day
 *   · `layoutDay()` places a day's timed events in side-by-side columns where they overlap
 *   · `findConflicts()` finds one person's events that overlap across their different calendars
 *   · `monthWeeks()` / `daysFrom()` – the days a month or a strip of days shows
 */

export const MINUTE = 60_000;
export const DAY_MINUTES = 1440;

/** A moment's date and time on the wall clock: month 1–12, weekday 0 (Sunday) – 6 */
export type Wall = { y: number; m: number; d: number; h: number; min: number; wd: number };

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const formats = new Map<string, Intl.DateTimeFormat | null>();

/** A formatter that reads parts in `timeZone`; null when the zone isn't one the browser knows (the browser's own is used) */
function partsFormat(timeZone: string) {
  if (!formats.has(timeZone)) {
    try {
      formats.set(timeZone, new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", weekday: "short", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }));
    } catch {
      formats.set(timeZone, null);
    }
  }
  return formats.get(timeZone)!;
}

/** True when `timeZone` is a zone the browser knows */
export const knownZone = (timeZone: string | undefined) => !timeZone || partsFormat(timeZone) !== null;

/** The date and time `ms` shows on a wall clock in `timeZone` (default: the browser's) */
export function wall(ms: number, timeZone?: string): Wall {
  const f = timeZone ? partsFormat(timeZone) : null;
  if (!f) {
    const d = new Date(ms);
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), min: d.getMinutes(), wd: d.getDay() };
  }
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(ms)) p[part.type] = part.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute, wd: WEEKDAYS[p.weekday] ?? 0 };
}

/** Epoch ms of a wall date and time in `timeZone`. Fields may overflow (day 32, minute 1500) the way Date's do; a time
 *  a clock skips (spring forward) lands just after the gap */
export function zoned(y: number, m: number, d: number, h = 0, min = 0, timeZone?: string): number {
  if (!timeZone || !partsFormat(timeZone)) return new Date(y, m - 1, d, h, min).getTime();
  const guess = Date.UTC(y, m - 1, d, h, min);
  const offset = (t: number) => {
    const w = wall(t, timeZone);
    return Date.UTC(w.y, w.m - 1, w.d, w.h, w.min) - Math.floor(t / MINUTE) * MINUTE;
  };
  const first = guess - offset(guess);
  const second = guess - offset(first);
  return second;
}

/** Midnight (wall) of the day `ms` falls in */
export function dayStart(ms: number, timeZone?: string) {
  const w = wall(ms, timeZone);
  return zoned(w.y, w.m, w.d, 0, 0, timeZone);
}

/** Midnight of the day `n` wall days after the day of `ms` */
export function addDays(ms: number, n: number, timeZone?: string) {
  const w = wall(ms, timeZone);
  return zoned(w.y, w.m, w.d + n, 0, 0, timeZone);
}

/** The same day of the month `n` months on (the last day when that month is shorter), at midnight */
export function addMonths(ms: number, n: number, timeZone?: string) {
  const w = wall(ms, timeZone);
  const last = wall(zoned(w.y, w.m + n + 1, 0, 12, 0, timeZone), timeZone).d;
  return zoned(w.y, w.m + n, Math.min(w.d, last), 0, 0, timeZone);
}

/** Minutes past midnight on the wall clock */
export function wallMinutes(ms: number, timeZone?: string) {
  const w = wall(ms, timeZone);
  return w.h * 60 + w.min;
}

/** True when both moments fall on the same wall day */
export const sameDay = (a: number, b: number, timeZone?: string) => dayStart(a, timeZone) === dayStart(b, timeZone);

/** `count` days from the day of `ms`, each as its midnight */
export function daysFrom(ms: number, count: number, timeZone?: string) {
  const w = wall(ms, timeZone);
  return Array.from({ length: count }, (_, i) => zoned(w.y, w.m, w.d + i, 0, 0, timeZone));
}

/** The first day of the week holding `ms`, with weeks starting on `weekStart` (0 Sunday … 6 Saturday) */
export function weekStartOf(ms: number, weekStart: number, timeZone?: string) {
  const w = wall(ms, timeZone);
  const ws = ((Math.round(weekStart) % 7) + 7) % 7;
  return zoned(w.y, w.m, w.d - ((w.wd - ws + 7) % 7), 0, 0, timeZone);
}

/** The six weeks a month view shows for the month of `ms`: 42 midnights, from the week holding the 1st */
export function monthWeeks(ms: number, weekStart: number, timeZone?: string) {
  const w = wall(ms, timeZone);
  return daysFrom(weekStartOf(zoned(w.y, w.m, 1, 12, 0, timeZone), weekStart, timeZone), 42, timeZone);
}

/** Anything with a start and an end in epoch ms */
export type Span = { start: number; end: number };

/** A timed event placed in a day: wall minutes from midnight (clipped to the day), its column, the columns its
 *  overlapping group shares, and how many columns it spans – it widens into free columns to its right */
export type Placed<T> = { item: T; top: number; bottom: number; col: number; cols: number; span: number; startsBefore: boolean; endsAfter: boolean };

/** The shortest an event is drawn, in minutes, so a zero-length or 5-minute event can still be seen and clicked */
export const MIN_MINUTES = 15;

/**
 * Places the timed spans that touch the day starting at `day` (a wall midnight): each gets its wall minutes within
 * the day and, where spans overlap, a column of its own – side by side, as few columns as the group needs. A span
 * that runs past midnight is clipped to this day (it's placed again on the next).
 */
export function layoutDay<T extends Span>(items: readonly T[], day: number, timeZone?: string): Placed<T>[] {
  const next = addDays(day, 1, timeZone);
  const placed: Placed<T>[] = [];
  for (const item of items) {
    const end = Math.max(item.end, item.start + MIN_MINUTES * MINUTE);
    if (!(item.start < next && end > day)) continue;
    const startsBefore = item.start < day;
    const endsAfter = end > next;
    const top = startsBefore ? 0 : wallMinutes(item.start, timeZone);
    let bottom = endsAfter ? DAY_MINUTES : wallMinutes(end, timeZone);
    // Ends at the next midnight (wall 0:00), or a clock change made the end read earlier than the start
    if (bottom <= top) bottom = endsAfter || end >= next ? DAY_MINUTES : Math.min(DAY_MINUTES, top + MIN_MINUTES);
    bottom = Math.min(DAY_MINUTES, Math.max(bottom, top + MIN_MINUTES));
    placed.push({ item, top, bottom, col: 0, cols: 1, span: 1, startsBefore, endsAfter });
  }
  // Earliest first, longer first among equal starts, so a long event takes the left column
  placed.sort((a, b) => a.top - b.top || b.bottom - a.bottom);
  let group: Placed<T>[] = [];
  let columns: number[] = [];
  let groupEnd = -1;
  const close = () => {
    for (const p of group) {
      p.cols = columns.length;
      // Widen into the columns to the right that nothing in the group uses while this event runs
      let span = 1;
      while (p.col + span < p.cols && !group.some((q) => q.col === p.col + span && q.top < p.bottom && q.bottom > p.top)) span++;
      p.span = span;
    }
    group = [];
    columns = [];
  };
  for (const p of placed) {
    if (p.top >= groupEnd) close();
    let col = columns.findIndex((end) => end <= p.top);
    if (col < 0) {
      col = columns.length;
      columns.push(p.bottom);
    } else columns[col] = p.bottom;
    p.col = col;
    group.push(p);
    groupEnd = Math.max(groupEnd, p.bottom);
  }
  close();
  return placed;
}

/** An event as findConflicts reads it */
export type ConflictItem = Span & { id: string; calendarId: string; allDay?: boolean; status?: string };

/**
 * One person's events that overlap across their different calendars – the double bookings a single calendar can't
 * see. `ownerOf` maps a calendar to its person. Returns, for every event in a conflict, the events it clashes with.
 * All-day and cancelled events never conflict; two events on the same calendar don't count (that calendar shows it).
 */
export function findConflicts<T extends ConflictItem>(items: readonly T[], ownerOf: (calendarId: string) => string | undefined): Map<string, T[]> {
  const byOwner = new Map<string, T[]>();
  for (const it of items) {
    if (it.allDay || it.status === "cancelled" || !(it.end > it.start)) continue;
    const owner = ownerOf(it.calendarId);
    if (owner === undefined) continue;
    let list = byOwner.get(owner);
    if (!list) byOwner.set(owner, (list = []));
    list.push(it);
  }
  const out = new Map<string, T[]>();
  const add = (a: T, b: T) => {
    let list = out.get(a.id);
    if (!list) out.set(a.id, (list = []));
    if (!list.includes(b)) list.push(b);
  };
  for (const list of byOwner.values()) {
    list.sort((a, b) => a.start - b.start);
    let active: T[] = [];
    for (const it of list) {
      active = active.filter((a) => a.end > it.start);
      for (const a of active)
        if (a.calendarId !== it.calendarId) {
          add(a, it);
          add(it, a);
        }
      active.push(it);
    }
  }
  return out;
}

/** Rounds wall minutes down to a step (15 by default) and keeps them within the day */
export const snapMinutes = (minutes: number, step = 15) => Math.max(0, Math.min(DAY_MINUTES, Math.floor(minutes / step) * step));
