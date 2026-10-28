import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OffScreenController } from "./internal/controllers";
import { PopoverController } from "./internal/popover";
import { initials } from "./internal/util";
import { safeUrl } from "./internal/safe-url";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-notifications> – the notification center at the top right of an app (remediation 7.4). Two parts:
 *   · the bell, an icon button for the app's header with the unread count as a badge – capped at `max` ("9+"), or a
 *     dot with `dot`. Its name carries the exact count: "Notifications, 12 unread";
 *   · the panel, a non-modal dialog that opens from it (internal/popover.ts): a title row with Mark all as read and
 *     an optional settings link, tabs – All, Unread and the app's own `categories` – and the notifications grouped by
 *     day (Today, Yesterday, the weekday, then dates), newest first. `inline` renders the panel on its own, as a card,
 *     for a full notifications page or a side drawer.
 * Each notification has an avatar or icon, a title with an optional bold actor, a body clamped to two lines, a
 * relative time ("5m", "3h", "2d") with the full time as its title, an unread dot that toggles read and unread, and
 * optionally a link (the whole row opens it), inline actions (Approve, View) and a dismiss button. The panel shows a
 * skeleton while `loading`, the error with Try again, "You’re all caught up" when empty, and Load more (or, with
 * `infinite`, loads as the end scrolls into view) while `hasMore`.
 *
 *   <tc-notifications .items=${[{ id: "n1", actor: "Maya Chen", title: "commented on Q3 plan", time: Date.parse(…) }]}>
 *   </tc-notifications>
 *
 * The app owns the data. Every change is a cancelable event whose detail carries what changes (and, where the list
 * changes, the list as it would be): tc-read-change, tc-mark-all-read, tc-dismiss, tc-action, tc-filter-change,
 * tc-open-change, tc-load-more, tc-retry, tc-item-open, tc-settings. Unless a listener calls preventDefault(), the
 * element applies it itself. Opening a notification marks it read (prevent tc-read-change to keep it unread); one
 * read while the Unread tab is showing stays in view until the tab changes or the panel closes, so the list doesn't
 * jump under the pointer. New arrivals – ids not seen before, unread, and no older than the newest one known – are
 * announced politely once per update ("New notification: Maya Chen commented on Q3 plan", or "3 new
 * notifications"), never one message per item; older pages from Load more aren't announced. With `pulse` the badge
 * pulses briefly as they arrive (not with reduced motion). The element reads the clock once, when it connects, for
 * `now` – never while rendering; set `now` to move it on.
 *
 * Keyboard. The bell is a button (aria-haspopup="dialog", aria-expanded); Enter or Space opens the panel with focus
 * on the first notification. The tabs follow the WAI-ARIA tab pattern: one tab stop, ← → Home End move and select.
 * The list is one tab stop with a roving tabindex (as background-tasks): ↑ ↓ Home End move between notifications,
 * crossing day groups; Tab moves on through the focused notification's own controls (its actions, read toggle and
 * dismiss), then Load more. The rows stay a plain list of links and buttons – not a listbox or menu, which would hide
 * the links and the inner controls from screen readers. Escape closes the panel and returns focus to the bell.
 *
 * Standard puts the inline panel's header on the gray tray above a white card; Clean is one white card with the
 * header as its first row, accent tab underline, small-capital day labels and thinner icons. In the popover both
 * use the menu surface with a plain title row (popovers carry no card header).
 */

export type NotificationTone = "neutral" | "accent" | "success" | "warning" | "danger";

/** An inline action on a notification: a small button that fires tc-action */
export type NotificationItemAction = {
  /** What tc-action carries as `action` */
  id: string;
  label: string;
  /** Drawn as the primary (dark) button – one per notification at most */
  primary?: boolean;
};

export type NotificationItem = {
  id: string;
  /** What happened, after the actor: "commented on Q3 plan" – or the whole line when there's no actor */
  title: string;
  /** Who did it, shown bold before the title: "Maya Chen" */
  actor?: string;
  /** More detail, clamped to two lines */
  body?: string;
  /** When it happened: epoch ms, a Date or an ISO string */
  time: number | Date | string;
  read?: boolean;
  /** The id of one of `categories` – the tab it shows under */
  category?: string;
  /** Where it happened, before the time: "Q3 roadmap" */
  context?: string;
  /** Opening it follows this link – the whole row is the link */
  href?: string;
  /** An avatar image URL (decorative – the actor is in the text) */
  avatar?: string;
  /** An icon of the app's own, cloned in place of the avatar */
  icon?: Element;
  /** Tints the icon's box (default neutral) */
  tone?: NotificationTone;
  /** Inline actions, e.g. Approve and View */
  actions?: NotificationItemAction[];
  /** Shows a dismiss button (or set `dismissible` on the element for all) */
  dismissible?: boolean;
};

/** An app-defined tab after All and Unread: Mentions, Assigned, System */
export type NotificationCategory = { id: string; label: string };

/** The panel's texts; any of them can be replaced through `labels` */
export type NotificationsLabels = {
  all: string;
  unread: string;
  filters: string;
  markAllRead: string;
  settings: string;
  today: string;
  yesterday: string;
  empty: string;
  emptyHint: string;
  emptyUnread: string;
  emptyCategory: string;
  loading: string;
  error: string;
  retry: string;
  loadMore: string;
  loadingMore: string;
  dismiss: string;
  markRead: string;
  markUnread: string;
  unreadStatus: string;
  allRead: string;
  dismissed: string;
  justNow: string;
};

/** tc-read-change: the notifications whose read state changes, the new state, and the list as it will be */
export type NotificationsReadChange = { ids: string[]; read: boolean; items: NotificationItem[] };
/** tc-mark-all-read: the notifications it marks read, and the list as it will be */
export type NotificationsMarkAllRead = { ids: string[]; items: NotificationItem[] };
/** tc-dismiss: the notification, and the list without it */
export type NotificationsDismiss = { id: string; item: NotificationItem; items: NotificationItem[] };
/** tc-action: which action on which notification */
export type NotificationsAction = { id: string; action: string; item: NotificationItem };
/** tc-item-open: the notification being opened */
export type NotificationsItemOpen = { id: string; item: NotificationItem };
/** tc-filter-change: the tab being picked – "all", "unread" or a category's id */
export type NotificationsFilterChange = { filter: string };
/** tc-open-change: whether the panel is opening or closing */
export type NotificationsOpenChange = { open: boolean };
/** tc-load-more: the oldest notification loaded (a cursor for the next page) and how many are loaded */
export type NotificationsLoadMore = { after: string | null; count: number };

const LABELS: NotificationsLabels = {
  all: "All",
  unread: "Unread",
  filters: "Filter notifications",
  markAllRead: "Mark all as read",
  settings: "Notification settings",
  today: "Today",
  yesterday: "Yesterday",
  empty: "You’re all caught up",
  emptyHint: "New notifications will show up here.",
  emptyUnread: "No unread notifications",
  emptyCategory: "Nothing here yet",
  loading: "Loading notifications",
  error: "Couldn’t load notifications",
  retry: "Try again",
  loadMore: "Load more",
  loadingMore: "Loading more…",
  dismiss: "Dismiss",
  markRead: "Mark as read",
  markUnread: "Mark as unread",
  unreadStatus: "Unread",
  allRead: "All notifications marked as read",
  dismissed: "Notification dismissed",
  justNow: "now",
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
let instances = 0;

/** A notification's time in epoch ms (NaN when it can't be read) */
export const notificationMs = (t: NotificationItem["time"]) => (t instanceof Date ? t.getTime() : typeof t === "number" ? t : Date.parse(t));
const dayStart = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
/** Whole calendar days from `ms` to `now` (0 today, 1 yesterday) – rounded, so a DST change doesn't skew it */
const daysAgo = (ms: number, now: number) => Math.round((dayStart(now) - dayStart(ms)) / DAY);

/** The compact relative time: "now", "5m", "3h", "2d", then the date ("12 Oct") */
export function notificationTime(ms: number, now: number, locale?: string, justNow = LABELS.justNow): string {
  const diff = Math.max(0, now - ms);
  if (diff < MINUTE) return justNow;
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;
  const sameYear = new Date(ms).getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat(locale, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" }).format(ms);
}

/* Icons: Lucide (ISC, lucide.dev), 24×24 strokes */
const BELL = svg`<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>`;
const GEAR = svg`<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`;
const CLOSE = svg`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`;
const CHECKS = svg`<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>`;
const INBOX = svg`<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>`;
const ALERT = svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>`;
const icon = (paths: TemplateResult, cls = "") =>
  html`<svg class=${`ui-ntc__svg ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

/** A name's avatar colour: one of the tone families, the same for the same name */
const TONES = ["teal", "violet", "amber", "pink", "rose"];
const hue = (name: string) => TONES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TONES.length];

type Group = { key: number; label: string; items: NotificationItem[] };

/**
 * The notification center: a bell with an unread badge that opens a panel of notifications grouped by day, with
 * tabs, read state, inline actions, dismiss, Mark all as read and Load more.
 * @tag tc-notifications
 * @fires tc-read-change - A notification was opened (marking it read) or its read toggle was used; detail `{ ids, read, items }`. Cancelable: preventDefault() and the app changes it
 * @fires tc-mark-all-read - Mark all as read was chosen; detail `{ ids, items }`. Cancelable: preventDefault() and the app marks them
 * @fires tc-dismiss - A notification's dismiss button was used; detail `{ id, item, items }` (`items` without it). Cancelable: preventDefault() and the app removes it
 * @fires tc-action - An inline action was chosen; detail `{ id, action, item }`. Cancelable: preventDefault() keeps the notification unread
 * @fires tc-item-open - A notification was opened (clicked, or Enter on it); detail `{ id, item }`. Cancelable: preventDefault() stops its link being followed (route it yourself)
 * @fires tc-filter-change - A tab was picked; detail `{ filter }` – "all", "unread" or a category's id. Cancelable: preventDefault() and the app sets `filter`
 * @fires tc-open-change - The panel is opening or closing; detail `{ open }`. Cancelable: preventDefault() keeps it as it is
 * @fires tc-load-more - Load more was chosen, or the end of the list scrolled into view with `infinite`; detail `{ after, count }`. Cancelable: preventDefault() and the element doesn't set `loadingMore` itself
 * @fires tc-retry - Try again was chosen after an error; detail `{}`. Cancelable: preventDefault() and the element doesn't clear `error` and show loading itself
 * @fires tc-settings - The settings link or button was chosen; detail `{}`. Cancelable: preventDefault() stops `settingsHref` being followed
 */
export class TcNotifications extends TcElement {
  static override ui = "ntc";

  /** The notifications, in any order – the panel sorts them newest first and groups them by day */
  @property({ attribute: false }) accessor items: NotificationItem[] = [];
  /** App-defined tabs after All and Unread; a notification shows under the one its `category` names */
  @property({ attribute: false }) accessor categories: NotificationCategory[] = [];
  /** The tab showing: "all", "unread" or a category's id */
  @property() accessor filter = "all";
  /** Whether the bell's panel is open */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Renders the panel on its own, as a card, without the bell – for a notifications page or a side drawer */
  @property({ type: Boolean, reflect: true }) accessor inline = false;
  /** The panel's title, and the start of the bell's name */
  @property() accessor heading = "Notifications";
  /** The badge's count when the app knows more unread than it has loaded; unset counts the unread `items` */
  @property({ type: Number, attribute: "unread-count" }) accessor unreadCount: number | undefined = undefined;
  /** The badge shows "<max>+" above this (default 9) */
  @property({ type: Number }) accessor max = 9;
  /** The badge is a dot, without the count (the bell's name still says how many) */
  @property({ type: Boolean }) accessor dot = false;
  /** The badge pulses briefly when new notifications arrive (not with reduced motion) */
  @property({ type: Boolean }) accessor pulse = false;
  /** Every notification gets a dismiss button, not only those with `dismissible` */
  @property({ type: Boolean }) accessor dismissible = false;
  /** Shows the skeleton in place of the list – the first page is loading */
  @property({ type: Boolean }) accessor loading = false;
  /** Shows "Loading more…" at the end of the list – a further page is loading */
  @property({ type: Boolean, attribute: "loading-more" }) accessor loadingMore = false;
  /** There are older notifications to load: shows Load more (or, with `infinite`, loads as the end scrolls into view) */
  @property({ type: Boolean, attribute: "has-more" }) accessor hasMore = false;
  /** Fires tc-load-more when the end of the list scrolls into view, instead of showing Load more */
  @property({ type: Boolean }) accessor infinite = false;
  /** An error to show with Try again – in place of the list when nothing is loaded, else at its end */
  @property() accessor error = "";
  /** A settings link in the header (an icon button named “Notification settings”) */
  @property({ attribute: "settings-href" }) accessor settingsHref = "";
  /** A settings button in the header that fires tc-settings, when there's no `settingsHref` */
  @property({ type: Boolean }) accessor settings = false;
  /** "Now" for the day groups and relative times (epoch ms or a Date). Unset: the time the element connected */
  @property({ attribute: false }) accessor now: number | Date | undefined = undefined;
  /** The locale for dates and weekdays; unset uses the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Any of the panel's texts, to change the wording or the language */
  @property({ attribute: false }) accessor labels: Partial<NotificationsLabels> = {};
  /** What's announced when notifications arrive; default “New notification: <actor> <title>” or “3 new notifications” */
  @property({ attribute: false }) accessor announce: ((items: NotificationItem[]) => string) | undefined = undefined;

  /** @internal The notification that holds the list's tab stop */
  @state() accessor activeId = "";
  /** @internal The polite status line */
  @state() accessor status = "";
  /** @internal Read while the Unread tab shows – kept in view until the tab changes or the panel closes */
  @state() accessor kept: ReadonlySet<string> = new Set();
  /** @internal Bumped to replay the badge pulse */
  @state() accessor pulses = 0;

  private readonly uid = `tc-ntc${++instances}`;
  private clock = 0;
  private known = new Set<string>();
  private newest = -Infinity;
  private primed = false;
  private flip = false;
  private focusAfter: string | null = null;
  private requested = false;
  private autoLoading = false;
  private io?: IntersectionObserver;
  private observed: Element | null = null;
  private rowIds = new Map<string, string>();

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-ntc__pop"),
    anchor: () => this.trigger,
    side: "bottom",
    align: "end",
    kind: "dialog",
    returnFocus: () => this.trigger,
    // Focus goes to the active notification (else the selected tab); Tab from the bell reaches the open panel
    initialFocus: () => this.main(this.activeId) ?? this.querySelector<HTMLElement>('.ui-ntc__tab[aria-selected="true"]'),
    tabBridge: true,
    onClose: (reason) => {
      if (reason === "api" || !this.open) return;
      if (this.emit<NotificationsOpenChange>("tc-open-change", { open: false }, { cancelable: true })) this.open = false;
      else this.pop.show();
    },
  });

  constructor() {
    super();
    // A notification that goes away (dismissed, or filtered out once read) never drops focus to <body>
    new FocusRescueController(this, () => this.main(this.activeId) ?? this.querySelector(".ui-ntc__main") ?? this.querySelector('.ui-ntc__tab[aria-selected="true"]') ?? this.trigger);
    new OffScreenController(this, () => this.loading || this.loadingMore);
  }

  override connectedCallback() {
    super.connectedCallback();
    // The one clock read: "now" for the day groups when the app doesn't give one – never while rendering
    if (!this.clock) this.clock = Date.now();
    if (this.inline && !this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
    this.io = undefined;
    this.observed = null;
  }

  /* ---------- Derived ---------- */

  private get text(): NotificationsLabels {
    return { ...LABELS, ...this.labels };
  }
  private get nowMs() {
    return this.now === undefined ? this.clock : this.now instanceof Date ? this.now.getTime() : this.now;
  }
  private get trigger() {
    return this.querySelector<HTMLButtonElement>(".ui-ntc__trigger");
  }
  private main(id: string) {
    return id ? this.querySelector<HTMLElement>(`.ui-ntc__main[data-id="${CSS.escape(id)}"]`) : null;
  }
  private rid(id: string) {
    let r = this.rowIds.get(id);
    if (!r) this.rowIds.set(id, (r = `${this.uid}-n${this.rowIds.size}`));
    return r;
  }

  /** Unread among the loaded notifications */
  private get unreadItems() {
    return this.items.filter((n) => !n.read);
  }
  /** The badge's count */
  private get unreadTotal() {
    return Math.max(0, this.unreadCount ?? this.unreadItems.length);
  }

  /** The notifications the selected tab shows, newest first */
  private get visible(): NotificationItem[] {
    const f = this.filter;
    const shown = this.items.filter((n) => (f === "unread" ? !n.read || this.kept.has(n.id) : f === "all" || !this.categories.some((c) => c.id === f) ? true : n.category === f));
    return shown.map((n, i) => ({ n, i, t: notificationMs(n.time) })).sort((a, b) => (b.t || 0) - (a.t || 0) || a.i - b.i).map((x) => x.n);
  }

  private dayLabel(ms: number, now: number) {
    const L = this.text;
    const d = daysAgo(ms, now);
    if (d <= 0) return L.today;
    if (d === 1) return L.yesterday;
    if (d < 7) return new Intl.DateTimeFormat(this.locale, { weekday: "long" }).format(ms);
    const sameYear = new Date(ms).getFullYear() === new Date(now).getFullYear();
    return new Intl.DateTimeFormat(this.locale, sameYear ? { weekday: "short", day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" }).format(ms);
  }

  /** The visible notifications in day groups, newest group first */
  private groups(list: NotificationItem[]): Group[] {
    const now = this.nowMs;
    const out: Group[] = [];
    for (const n of list) {
      const ms = notificationMs(n.time);
      const key = Number.isFinite(ms) ? Math.max(0, daysAgo(ms, now)) : -1;
      let g = out[out.length - 1];
      if (!g || g.key !== key) out.push((g = { key, label: Number.isFinite(ms) ? this.dayLabel(ms, now) : this.text.today, items: [] }));
      g.items.push(n);
    }
    return out;
  }

  private say(text: string) {
    // The same message twice in a row is still announced: the trailing space flips
    this.flip = !this.flip;
    this.status = `${text}${this.flip ? "" : " "}`;
  }

  private line(n: NotificationItem) {
    return [n.actor, n.title].filter(Boolean).join(" ");
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("items")) {
      // New arrivals: ids not seen before, unread, and no older than the newest known – so an older page from Load
      // more isn't read out, and neither is the first list (or anything that arrives while `loading`)
      const fresh = this.items.filter((n) => !this.known.has(n.id) && !n.read && notificationMs(n.time) >= this.newest);
      if (this.primed && !this.loading && fresh.length) {
        const first = fresh[0];
        this.say(this.announce?.(fresh) ?? (fresh.length === 1 && first ? `New notification: ${this.line(first)}` : `${fresh.length} new notifications`));
        if (this.pulse) this.pulses++;
      }
      this.known = new Set(this.items.map((n) => n.id));
      for (const n of this.items) this.newest = Math.max(this.newest, notificationMs(n.time) || -Infinity);
      // A page arrived: the element's own "Loading more…" ends, and the end of the list may ask again
      if (this.autoLoading && !changed.has("loadingMore")) this.loadingMore = false;
      this.autoLoading = false;
      this.requested = false;
    }
    if (!this.loading) this.primed = true;
    if ((changed.has("loadingMore") && !this.loadingMore) || changed.has("hasMore") || changed.has("error")) this.requested = false;
    if (changed.has("filter") && changed.get("filter") !== undefined) this.kept = new Set();
    if (changed.has("inline") && this.inline && !this.hasAttribute("role")) this.setAttribute("role", "region");
    // The panel follows `open` (not inline)
    const wantOpen = this.open && !this.inline;
    if (wantOpen && !this.pop.open) this.pop.show({ focus: true });
    else if (!wantOpen && this.pop.open) {
      this.pop.close("api");
      this.kept = new Set();
    }
    const list = this.visible;
    if (!list.some((n) => n.id === this.activeId)) this.activeId = list[0]?.id ?? "";
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.inline && !this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (this.focusAfter !== null) {
      const id = this.focusAfter;
      this.focusAfter = null;
      (this.main(id) ?? this.querySelector<HTMLElement>('.ui-ntc__tab[aria-selected="true"]'))?.focus();
    }
    this.watchEnd();
  }

  /** With `infinite`: asks for more when the end of the list scrolls into view (inside the panel's scroller, too) */
  private watchEnd() {
    const end = this.infinite ? this.querySelector(".ui-ntc__end") : null;
    if (end === this.observed) return;
    this.io?.disconnect();
    this.observed = end;
    if (!end || typeof IntersectionObserver !== "function") return;
    this.io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) this.loadMore();
    });
    this.io.observe(end);
  }

  /* ---------- Changes ---------- */

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit<NotificationsOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  private pick(filter: string) {
    if (filter === this.filter) return;
    if (this.emit<NotificationsFilterChange>("tc-filter-change", { filter }, { cancelable: true })) this.filter = filter;
  }

  private setRead(ids: string[], read: boolean) {
    const items = this.items.map((n) => (ids.includes(n.id) ? { ...n, read } : n));
    // Read in the Unread tab: stays in view (also when the app applies it)
    if (read && this.filter === "unread") this.kept = new Set([...this.kept, ...ids]);
    if (!this.emit<NotificationsReadChange>("tc-read-change", { ids, read, items }, { cancelable: true })) return;
    this.items = items;
  }

  private markAllRead() {
    const ids = this.unreadItems.map((n) => n.id);
    if (!ids.length) return;
    const items = this.items.map((n) => (n.read ? n : { ...n, read: true }));
    if (!this.emit<NotificationsMarkAllRead>("tc-mark-all-read", { ids, items }, { cancelable: true })) return;
    this.items = items;
    this.say(this.text.allRead);
  }

  /** The notification to move to when `id` leaves the list: the next one, else the previous */
  private neighbour(id: string) {
    const list = this.visible;
    const at = list.findIndex((n) => n.id === id);
    return list[at + 1]?.id ?? list[at - 1]?.id ?? "";
  }

  private dismiss(item: NotificationItem) {
    const items = this.items.filter((n) => n.id !== item.id);
    if (!this.emit<NotificationsDismiss>("tc-dismiss", { id: item.id, item, items }, { cancelable: true })) return;
    if (this.contains(document.activeElement)) {
      this.activeId = this.neighbour(item.id);
      this.focusAfter = this.activeId;
    }
    this.items = items;
    this.say(this.text.dismissed);
  }

  private act(item: NotificationItem, action: string) {
    this.activeId = item.id;
    if (!this.emit<NotificationsAction>("tc-action", { id: item.id, action, item }, { cancelable: true })) return;
    if (!item.read) this.setRead([item.id], true);
  }

  private openItem(item: NotificationItem, e: Event) {
    this.activeId = item.id;
    if (!this.emit<NotificationsItemOpen>("tc-item-open", { id: item.id, item }, { cancelable: true })) e.preventDefault();
    if (!item.read) this.setRead([item.id], true);
  }

  /** Asks for the next page – once, until it arrives (or the state changes) */
  private loadMore(force = false) {
    if (this.loadingMore || this.loading || (!force && (this.requested || this.error)) || !this.hasMore) return;
    this.requested = true;
    const last = this.visible[this.visible.length - 1];
    if (!this.emit<NotificationsLoadMore>("tc-load-more", { after: last?.id ?? null, count: this.items.length }, { cancelable: true })) return;
    this.loadingMore = true;
    this.autoLoading = true;
  }

  private retry() {
    if (!this.emit("tc-retry", {}, { cancelable: true })) return;
    const more = this.items.length > 0;
    this.error = "";
    if (more) {
      this.loadingMore = true;
      this.autoLoading = true;
    } else this.loading = true;
  }

  private openSettings(e: Event) {
    if (!this.emit("tc-settings", {}, { cancelable: true })) e.preventDefault();
  }

  /* ---------- Keyboard ---------- */

  private onTabKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tabs = [...this.querySelectorAll<HTMLElement>(".ui-ntc__tab")];
    const at = tabs.indexOf(e.target as HTMLElement);
    if (at < 0) return;
    const last = tabs.length - 1;
    const to = e.key === "ArrowRight" ? (at === last ? 0 : at + 1) : e.key === "ArrowLeft" ? (at === 0 ? last : at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to < 0) return;
    e.preventDefault();
    tabs[to].focus();
    const f = tabs[to].dataset.filter;
    if (f !== undefined) this.pick(f);
  };

  private onListKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const from = (e.target as Element).closest<HTMLElement>(".ui-ntc__row");
    if (!from) return;
    const list = this.visible;
    const at = list.findIndex((n) => n.id === from.dataset.id);
    const last = list.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : last;
    e.preventDefault();
    const id = list[to]?.id;
    if (!id) return;
    this.activeId = id;
    this.main(id)?.focus();
  };

  private onListFocus = (e: FocusEvent) => {
    const id = (e.target as Element).closest<HTMLElement>(".ui-ntc__row")?.dataset.id;
    if (id && id !== this.activeId) this.activeId = id;
  };

  /* ---------- Render ---------- */

  protected override render() {
    const live = html`<span class="ui-ntc__sr" role="status">${this.status}</span>`;
    if (this.inline) return html`${this.renderPanel(true)}${live}`;
    return html`${this.renderBell()}${this.pop.open
        ? html`<div class="tc-pop ui-ntc__pop" id=${`${this.uid}-panel`} role="dialog" tabindex="-1" aria-labelledby=${`${this.uid}-title`}>${this.renderPanel(false)}</div>`
        : nothing}${live}`;
  }

  private renderBell() {
    const n = this.unreadTotal;
    const badge = !n ? nothing : this.dot ? html`<span class="ui-ntc__badge" data-dot aria-hidden="true"></span>` : html`<span class="ui-ntc__badge" aria-hidden="true">${n > this.max ? `${this.max}+` : n}</span>`;
    return html`<button
      type="button"
      class="ui-ntc__trigger"
      aria-haspopup="dialog"
      aria-expanded=${this.open ? "true" : "false"}
      aria-controls=${ifDefined(this.pop.open ? `${this.uid}-panel` : undefined)}
      aria-label=${n ? `${this.heading}, ${n} unread` : this.heading}
      @click=${() => this.setOpen(!this.open)}
    >
      ${icon(BELL, "ui-ntc__bell")}${keyed(this.pulses, badge === nothing ? nothing : html`<span class="ui-ntc__badge-wrap" ?data-pulse=${this.pulses > 0}>${badge}</span>`)}
    </button>`;
  }

  private renderPanel(inline: boolean) {
    const L = this.text;
    const titleId = `${this.uid}-title`;
    const settings = safeUrl(this.settingsHref)
      ? html`<a class="ui-ntc__iconbtn ui-ntc__settings" href=${ifDefined(safeUrl(this.settingsHref))} aria-label=${L.settings} title=${L.settings} @click=${this.openSettings}>${icon(GEAR)}</a>`
      : this.settings
        ? html`<button type="button" class="ui-ntc__iconbtn ui-ntc__settings" aria-label=${L.settings} title=${L.settings} @click=${this.openSettings}>${icon(GEAR)}</button>`
        : nothing;
    const tools = html`<div class="ui-ntc__tools">
      <button type="button" class="ui-ntc__btn ui-ntc__btn--ghost ui-ntc__mark" ?disabled=${!this.unreadItems.length} @click=${() => this.markAllRead()}>
        ${icon(CHECKS)}<span>${L.markAllRead}</span>
      </button>
      ${settings}
    </div>`;
    const body = html`${this.renderTabs()}${this.renderList()}`;
    if (inline) return html`${cardHead({ icon: BELL, title: this.heading, id: titleId, level: 2, aside: tools })}<div class="ui-ntc__card">${body}</div>`;
    return html`<div class="ui-ntc__phead"><h2 class="ui-ntc__ptitle" id=${titleId}>${this.heading}</h2>${tools}</div>${body}`;
  }

  private renderTabs() {
    const L = this.text;
    const unread = this.unreadItems.length;
    const tabs: { id: string; label: string; count?: number }[] = [{ id: "all", label: L.all }, { id: "unread", label: L.unread, count: unread }, ...this.categories.map((c) => ({ id: c.id, label: c.label }))];
    const selected = tabs.some((t) => t.id === this.filter) ? this.filter : "all";
    return html`<div class="ui-ntc__tabs" role="tablist" aria-label=${L.filters} @keydown=${this.onTabKey}>
      ${tabs.map(
        (t, i) => html`<button
          type="button"
          role="tab"
          class="ui-ntc__tab"
          id=${`${this.uid}-tab${i}`}
          data-filter=${t.id}
          aria-selected=${t.id === selected ? "true" : "false"}
          aria-controls=${`${this.uid}-list`}
          tabindex=${t.id === selected ? 0 : -1}
          @click=${() => this.pick(t.id)}
        >
          ${t.label}${t.count ? html` <span class="ui-ntc__tcount">${t.count}</span>` : nothing}
        </button>`,
      )}
    </div>`;
  }

  private renderList() {
    const L = this.text;
    const tabs = ["all", "unread", ...this.categories.map((c) => c.id)];
    const at = Math.max(0, tabs.indexOf(this.filter));
    const list = this.visible;
    const failed = !!this.error && !this.loading;
    const content = this.loading
      ? this.renderSkeleton(3)
      : failed && !this.items.length
        ? this.renderError()
        : !list.length
          ? this.renderEmpty()
          : html`${this.groups(list).map((g) => {
                const gid = `${this.uid}-g${g.key}`;
                return html`<div class="ui-ntc__group" role="group" aria-labelledby=${gid}>
                  <h3 class="ui-ntc__day" id=${gid}>${g.label}</h3>
                  <ul class="ui-ntc__rows" role="list">
                    ${repeat(g.items, (n) => n.id, (n) => this.renderRow(n))}
                  </ul>
                </div>`;
              })}${this.renderEnd(failed)}`;
    // An empty, loading or failed panel has nothing to focus: the tab panel itself takes the tab stop
    const focusable = !this.loading && (list.length > 0 || failed);
    return html`<div
      class="ui-ntc__scroll"
      id=${`${this.uid}-list`}
      role="tabpanel"
      aria-labelledby=${`${this.uid}-tab${at}`}
      aria-busy=${this.loading || this.loadingMore ? "true" : "false"}
      tabindex=${ifDefined(focusable ? undefined : 0)}
      @keydown=${this.onListKey}
      @focusin=${this.onListFocus}
    >
      ${content}
      ${this.loading ? html`<span class="ui-ntc__sr">${L.loading}</span>` : nothing}
    </div>`;
  }

  private renderEnd(failed: boolean) {
    const L = this.text;
    if (failed) return this.renderError(true);
    if (this.loadingMore) return html`<div class="ui-ntc__more" data-busy>${this.renderSkeleton(1)}<span class="ui-ntc__sr">${L.loadingMore}</span></div>`;
    if (!this.hasMore) return nothing;
    if (this.infinite) return html`<div class="ui-ntc__end" aria-hidden="true"></div>`;
    return html`<div class="ui-ntc__more"><button type="button" class="ui-ntc__btn ui-ntc__btn--ghost ui-ntc__loadmore" @click=${() => this.loadMore(true)}>${L.loadMore}</button></div>`;
  }

  private renderSkeleton(rows: number) {
    return html`<div class="ui-ntc__skeleton" aria-hidden="true">
      ${Array.from({ length: rows }, () => html`<div class="ui-ntc__skel-row"><span class="ui-ntc__skel ui-ntc__skel--avatar"></span><span class="ui-ntc__skel-lines"><span class="ui-ntc__skel"></span><span class="ui-ntc__skel"></span><span class="ui-ntc__skel ui-ntc__skel--short"></span></span></div>`)}
    </div>`;
  }

  private renderEmpty() {
    const L = this.text;
    const f = this.filter;
    const title = f === "unread" && this.items.length ? L.emptyUnread : f !== "all" && f !== "unread" && this.categories.some((c) => c.id === f) ? L.emptyCategory : L.empty;
    return html`<div class="ui-ntc__state" data-state="empty">
      <span class="ui-ntc__state-icon">${icon(INBOX)}</span>
      <p class="ui-ntc__state-title">${title}</p>
      <p class="ui-ntc__state-text">${L.emptyHint}</p>
    </div>`;
  }

  private renderError(inline = false) {
    const L = this.text;
    return html`<div class="ui-ntc__state" data-state="error" ?data-inline=${inline}>
      <span class="ui-ntc__state-icon">${icon(ALERT)}</span>
      <p class="ui-ntc__state-title">${L.error}</p>
      ${this.error.trim() && this.error !== L.error ? html`<p class="ui-ntc__state-text">${this.error}</p>` : nothing}
      <button type="button" class="ui-ntc__btn ui-ntc__btn--secondary ui-ntc__retry" @click=${() => this.retry()}>${L.retry}</button>
    </div>`;
  }

  private renderAvatar(n: NotificationItem) {
    if (n.avatar) return html`<span class="ui-ntc__avatar" data-kind="image"><img src=${ifDefined(safeMediaUrl(n.avatar))} alt="" /></span>`;
    if (n.icon) return html`<span class="ui-ntc__avatar" data-kind="icon" data-tone=${n.tone ?? "neutral"}>${n.icon.cloneNode(true)}</span>`;
    if (n.actor) return html`<span class="ui-ntc__avatar" data-kind="initials" data-hue=${hue(n.actor)}>${initials(n.actor)}</span>`;
    return html`<span class="ui-ntc__avatar" data-kind="icon" data-tone=${n.tone ?? "neutral"}>${icon(BELL)}</span>`;
  }

  private renderRow(n: NotificationItem) {
    const L = this.text;
    const rid = this.rid(n.id);
    const tab = n.id === this.activeId ? 0 : -1;
    const unread = !n.read;
    const ms = notificationMs(n.time);
    const now = this.nowMs;
    const valid = Number.isFinite(ms);
    const full = valid ? new Intl.DateTimeFormat(this.locale, { dateStyle: "full", timeStyle: "short" }).format(ms) : "";
    const rel = valid ? notificationTime(ms, now, this.locale, L.justNow) : "";
    const described = [n.body ? `${rid}-b` : "", `${rid}-m`].filter(Boolean).join(" ");
    // The link (or button) holds the title only – its name is what it shows, with "Unread" before it for screen
    // readers; the body and the time are its description. Its box stretches over the row, so the whole row opens it
    const title = html`${unread ? html`<span class="ui-ntc__sr">${L.unreadStatus}, </span>` : nothing}<span class="ui-ntc__title" id=${`${rid}-t`}
        >${n.actor ? html`<strong class="ui-ntc__actor">${n.actor}</strong> ` : nothing}${n.title}</span
      >`;
    const main = safeUrl(n.href)
      ? html`<a class="ui-ntc__main" href=${ifDefined(safeUrl(n.href))} data-id=${n.id} data-focus-key=${n.id} tabindex=${tab} aria-describedby=${described} @click=${(e: Event) => this.openItem(n, e)}>${title}</a>`
      : html`<button type="button" class="ui-ntc__main" data-id=${n.id} data-focus-key=${n.id} tabindex=${tab} aria-describedby=${described} @click=${(e: Event) => this.openItem(n, e)}>${title}</button>`;
    const rest = html`${n.body ? html`<span class="ui-ntc__body" id=${`${rid}-b`}>${n.body}</span>` : nothing}
      <span class="ui-ntc__meta" id=${`${rid}-m`}
        >${n.context ? html`<span class="ui-ntc__ctx">${n.context}</span><span class="ui-ntc__sep" aria-hidden="true">·</span>` : nothing}${valid
          ? html`<time class="ui-ntc__time" datetime=${new Date(ms).toISOString()} title=${full} aria-hidden="true">${rel}</time><span class="ui-ntc__sr">${full}</span>`
          : nothing}</span
      >`;
    const dismissible = this.dismissible || n.dismissible;
    return html`<li class="ui-ntc__row" data-id=${n.id} ?data-unread=${unread} ?data-link=${!!n.href}>
      ${this.renderAvatar(n)}${main}${rest}
      ${n.actions?.length
        ? html`<div class="ui-ntc__acts">
            ${n.actions.map(
              (a) => html`<button type="button" class="ui-ntc__btn ${a.primary ? "ui-ntc__btn--primary" : "ui-ntc__btn--secondary"}" data-action=${a.id} tabindex=${tab} aria-describedby=${`${rid}-t`} @click=${() => this.act(n, a.id)}>${a.label}</button>`,
            )}
          </div>`
        : nothing}
      <div class="ui-ntc__side">
        <button type="button" class="ui-ntc__dot" tabindex=${tab} aria-label=${unread ? L.markRead : L.markUnread} title=${unread ? L.markRead : L.markUnread} aria-describedby=${`${rid}-t`} @click=${() => this.setRead([n.id], unread)}>
          <span class="ui-ntc__dot-mark"></span>
        </button>
        ${dismissible
          ? html`<button type="button" class="ui-ntc__dismiss" tabindex=${tab} aria-label=${L.dismiss} title=${L.dismiss} aria-describedby=${`${rid}-t`} @click=${() => this.dismiss(n)}>${icon(CLOSE)}</button>`
          : nothing}
      </div>
    </li>`;
  }

  static override css = /* css */ `
[data-ui="ntc"] {
  box-sizing: border-box;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="ntc"] *, [data-ui="ntc"] *::before, [data-ui="ntc"] *::after { box-sizing: border-box; }
:where([data-ui="ntc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; }
:where([data-ui="ntc"]) p { margin: 0; }
[data-ui="ntc"] :is(button, a, .ui-ntc__scroll):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ntc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-ntc__svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *) .ui-ntc__svg { stroke-width: 1.75; }
:where([data-look="clean"], [data-look="clean"] *) .ui-ntc__svg { stroke-width: 1.5; }

/* ---- The bell: a ghost icon button with the badge on its corner ---- */
[data-ui="ntc"]:not([inline]) { display: inline-flex; vertical-align: middle; }
.ui-ntc__trigger {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-radius-full);
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ntc__trigger:hover, .ui-ntc__trigger[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-ntc__bell { width: 18px; height: 18px; }
.ui-ntc__badge-wrap { position: absolute; top: -2px; right: -4px; display: inline-flex; }
.ui-ntc__badge {
  display: inline-grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-full);
  background: var(--tc-status-danger-solid);
  box-shadow: 0 0 0 2px var(--tc-surface-raised);
  color: var(--tc-text-on-accent);
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
}
.ui-ntc__badge[data-dot] { min-width: 0; width: 8px; height: 8px; padding: 0; margin: var(--tc-space-1) var(--tc-space-1) 0 0; }
/* New arrivals: one short pulse – a ring that grows and fades */
.ui-ntc__badge-wrap[data-pulse] .ui-ntc__badge { animation: ui-ntc-pulse var(--tc-duration-slowest) var(--tc-ease-out); }
@keyframes ui-ntc-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 2px var(--tc-surface-raised), 0 0 0 2px var(--tc-status-danger-solid); }
  40% { transform: scale(1.18); }
  100% { transform: scale(1); box-shadow: 0 0 0 2px var(--tc-surface-raised), 0 0 0 8px transparent; }
}

/* ---- The panel in the popover: the menu surface, a plain title row ---- */
.ui-ntc__pop { width: min(400px, calc(100vw - var(--tc-space-4))); padding: 0; overflow: hidden; container-type: inline-size; }
.ui-ntc__pop:focus { outline: none; }
.ui-ntc__phead { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-1) var(--tc-space-4); }
.ui-ntc__ptitle {
  margin: 0;
  font-size: var(--tc-title-font-size);
  font-weight: var(--tc-title-font-weight);
  line-height: var(--tc-title-line-height);
  letter-spacing: var(--tc-title-tracking);
  color: var(--tc-title-color);
}
.ui-ntc__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-0-5); }
.ui-ntc__pop > .ui-ntc__scroll { max-height: min(70vh, 480px); overflow-y: auto; overscroll-behavior: contain; }

/* ---- The panel inline: Standard's tray and white card, Clean's one card ---- */
[data-ui="ntc"][inline] { display: block; width: 100%; max-width: 480px; container-type: inline-size; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ntc"][inline] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ntc"][inline] {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ntc__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
.ui-ntc__card > .ui-ntc__scroll { max-height: var(--tc-notifications-max-height, none); overflow-y: auto; }

/* ---- Buttons: Button's sm recipes ---- */
.ui-ntc__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
  text-decoration: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ntc__btn .ui-ntc__svg { width: 16px; height: 16px; }
.ui-ntc__btn--ghost { color: var(--tc-action-ghost-fg); }
.ui-ntc__btn--ghost:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-ntc__btn:disabled { color: var(--tc-text-disabled); cursor: default; }
.ui-ntc__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-ntc__btn--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ntc__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-ntc__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-ntc__iconbtn {
  display: inline-grid;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ntc__iconbtn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-ntc__iconbtn .ui-ntc__svg { width: 16px; height: 16px; }

/* ---- Tabs: an underline row that scrolls sideways when the categories don't fit ---- */
.ui-ntc__tabs {
  display: flex;
  gap: var(--tc-space-1);
  padding: 0 var(--tc-space-2-5);
  border-bottom: var(--tc-hairline) solid var(--tc-border-subtle);
  overflow-x: auto;
  scrollbar-width: none;
}
.ui-ntc__tabs::-webkit-scrollbar { display: none; }
.ui-ntc__tab {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-space-1-5);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-text-muted);
  white-space: nowrap;
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ntc__tab:hover { color: var(--tc-text-primary); }
.ui-ntc__tab[aria-selected="true"] { color: var(--tc-text-primary); }
.ui-ntc__tab::after { content: ""; position: absolute; left: var(--tc-space-1-5); right: var(--tc-space-1-5); bottom: -1px; height: 2px; border-radius: var(--tc-radius-full); background: transparent; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ntc__tab[aria-selected="true"]::after { background: var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-ntc__tab[aria-selected="true"]::after { background: var(--tc-accent); }
[data-ui="ntc"] .ui-ntc__tab:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-ntc__tcount {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-full);
  background: var(--tc-fill-default);
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
}
.ui-ntc__tab[aria-selected="true"] .ui-ntc__tcount { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }

/* ---- The list ---- */
.ui-ntc__scroll { position: relative; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1-5); }
[data-ui="ntc"] .ui-ntc__scroll:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-ntc__group + .ui-ntc__group { margin-top: var(--tc-space-1); }
.ui-ntc__day {
  margin: 0;
  padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-1);
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-ntc__rows { display: grid; gap: var(--tc-space-0-5); margin: 0; padding: 0; list-style: none; }
.ui-ntc__row {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: "avatar main side" "avatar body side" "avatar meta side" "avatar acts side";
  grid-template-rows: auto auto auto 1fr;
  column-gap: var(--tc-space-3);
  padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-3);
  border-radius: var(--tc-menu-item-radius);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ntc__row:hover { background: var(--tc-menu-item-hover); }
/* The whole row is the link (or button): its box stretches over the row; the inner controls sit above it */
.ui-ntc__main { grid-area: main; display: block; min-width: 0; color: inherit; text-align: left; text-decoration: none; }
.ui-ntc__main::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
[data-ui="ntc"] .ui-ntc__main:focus-visible { outline: none; }
.ui-ntc__row:has(> .ui-ntc__main:focus-visible) { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-ntc__acts, .ui-ntc__side { position: relative; z-index: 1; }
.ui-ntc__avatar {
  grid-area: avatar;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  overflow: hidden;
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-well);
  color: var(--tc-icon-muted);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-none);
}
.ui-ntc__avatar[data-kind="icon"] { border-radius: var(--tc-radius-md); }
.ui-ntc__avatar > :is(svg, img) { width: 16px; height: 16px; }
.ui-ntc__avatar > img { width: 100%; height: 100%; object-fit: cover; }
.ui-ntc__avatar[data-tone="accent"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-ntc__avatar[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-ntc__avatar[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-ntc__avatar[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-ntc__avatar[data-hue="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-ntc__avatar[data-hue="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-ntc__avatar[data-hue="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-ntc__avatar[data-hue="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-ntc__avatar[data-hue="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
:where([data-look="clean"], [data-look="clean"] *) .ui-ntc__avatar[data-kind="icon"][data-tone="neutral"] { background: transparent; box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-ntc__title { display: block; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-ntc__row[data-unread] .ui-ntc__title { color: var(--tc-text-primary); }
.ui-ntc__actor { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-ntc__actor { font-weight: var(--tc-font-weight-medium); }
.ui-ntc__body {
  grid-area: body;
  margin-top: var(--tc-space-0-5);
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-muted);
  overflow-wrap: anywhere;
}
.ui-ntc__meta { grid-area: meta; display: flex; align-items: baseline; gap: var(--tc-space-1); min-width: 0; margin-top: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-ntc__ctx { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-ntc__time { flex: none; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-ntc__acts { grid-area: acts; display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); margin-top: var(--tc-space-2); }
/* The read toggle (the unread dot) and dismiss, in a narrow column on the right */
.ui-ntc__side { grid-area: side; display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-0-5); margin: calc(var(--tc-space-1) * -1) calc(var(--tc-space-1) * -1) 0 0; }
.ui-ntc__dot, .ui-ntc__dismiss {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--tc-radius-full);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ntc__dot:hover, .ui-ntc__dismiss:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-ntc__dismiss .ui-ntc__svg { width: 14px; height: 14px; }
.ui-ntc__dot-mark { width: 8px; height: 8px; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1.5px var(--tc-border-strong); }
.ui-ntc__row[data-unread] .ui-ntc__dot-mark { background: var(--tc-accent-solid); box-shadow: none; }
/* Read: the toggle's ring and dismiss show on hover and focus (always on touch screens) */
.ui-ntc__row:not([data-unread]) .ui-ntc__dot, .ui-ntc__dismiss { opacity: 0; }
.ui-ntc__row:is(:hover, :focus-within) :is(.ui-ntc__dot, .ui-ntc__dismiss) { opacity: 1; }
@media (hover: none) { .ui-ntc__row .ui-ntc__dismiss, .ui-ntc__row:not([data-unread]) .ui-ntc__dot { opacity: 1; } }

/* ---- Load more, skeletons, empty and error ---- */
.ui-ntc__more { display: flex; justify-content: center; padding: var(--tc-space-1) 0 0; }
.ui-ntc__more[data-busy] { display: block; }
.ui-ntc__end { height: 1px; }
.ui-ntc__skel-row { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3); }
.ui-ntc__skel-lines { display: grid; gap: var(--tc-space-2); padding-top: var(--tc-space-0-5); }
.ui-ntc__skel { position: relative; display: block; height: 10px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-ntc__skel-lines > .ui-ntc__skel:first-child { width: 72%; }
.ui-ntc__skel-lines > .ui-ntc__skel:nth-child(2) { width: 92%; }
.ui-ntc__skel--short { width: 24%; }
.ui-ntc__skel--avatar { width: 32px; height: 32px; }
.ui-ntc__skel::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, var(--tc-shimmer), transparent);
  transform: translateX(-100%);
  animation: ui-ntc-shimmer var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite;
}
[data-offscreen] .ui-ntc__skel::after { animation-play-state: paused; }
@keyframes ui-ntc-shimmer { to { transform: translateX(100%); } }
.ui-ntc__state { display: grid; justify-items: center; gap: var(--tc-space-1); padding: var(--tc-space-8) var(--tc-space-6); text-align: center; }
.ui-ntc__state[data-inline] { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3); }
.ui-ntc__state-icon { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-surface-well); color: var(--tc-icon-muted); }
.ui-ntc__state-icon .ui-ntc__svg { width: 20px; height: 20px; }
.ui-ntc__state[data-state="error"] .ui-ntc__state-icon { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-ntc__state[data-inline] .ui-ntc__state-icon { display: none; }
.ui-ntc__state-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-ntc__state-text { max-width: 32ch; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-ntc__retry { margin-top: var(--tc-space-3); }

/* Narrow: Mark all as read keeps its icon and drops its words */
@container (max-width: 340px) {
  .ui-ntc__mark { width: var(--tc-control-h-sm); padding: 0; }
  .ui-ntc__mark > span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-ntc__row { column-gap: var(--tc-space-2-5); padding-left: var(--tc-space-2-5); }
  /* The tabs scroll sideways: the last one fades out at the edge, so it reads as more rather than cut off */
  .ui-ntc__tabs { -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); }
}

@media (prefers-reduced-motion: reduce) {
  [data-ui="ntc"] *, [data-ui="ntc"] *::after { transition: none; }
  [data-ui="ntc"] .ui-ntc__badge, [data-ui="ntc"] .ui-ntc__skel::after { animation: none; }
}
@media (forced-colors: active) {
  .ui-ntc__badge { border: 1px solid CanvasText; }
  .ui-ntc__row[data-unread] .ui-ntc__dot-mark { background: Highlight; }
  .ui-ntc__tab[aria-selected="true"]::after { background: Highlight; }
  .ui-ntc__skel { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-notifications")) customElements.define("tc-notifications", TcNotifications);

declare global {
  interface HTMLElementTagNameMap {
    "tc-notifications": TcNotifications;
  }
}
