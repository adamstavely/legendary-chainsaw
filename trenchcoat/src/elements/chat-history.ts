import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, RowWindowController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-chat-history> – your conversations, grouped by date: Pinned, then your folders, then Today, Yesterday,
 * Previous 7 days, Previous 30 days and one group per month – relative to `now` (default: when the element was
 * connected; nothing reads the clock while rendering).
 *   · search filters by title and marks the match; the groups stay, with their counts
 *   · pin, rename in place, move to a folder, delete – Undo stays on the tray (Clean: the card's last row) for a while
 *   · a tree (WAI-ARIA tree pattern): the groups are the parents, the chats their children, rows in a flat list with
 *     aria-level / -posinset / -setsize so it can be windowed. ↑ ↓ Home End move, → ← open and fold, Enter opens a
 *     chat, F2 renames, Delete / Backspace deletes, Shift+F10 or the context-menu key opens the actions menu, and
 *     typing jumps to a title
 *   · long lists render only the rows near the viewport (RowWindowController); 10,000 chats stay smooth
 *
 *   <tc-chat-history .conversations=${chats} .folders=${[{ id: "work", label: "Work" }]} value="c-12"></tc-chat-history>
 *
 * Standard: heading and keyboard hints on the gray tray, search and list on the white card. Clean: one white card.
 * The open chat is `value` (cancelable `tc-value-change`); every list change fires a cancelable
 * `tc-conversations-change` with the whole list, and a granular action event (tc-rename, tc-pin, tc-move, tc-delete,
 * tc-restore) for apps that call an API per action.
 */

export type ChatConversation = {
  id: string;
  title: string;
  /** Last activity: epoch ms, an ISO string or a Date */
  updatedAt: number | string | Date;
  pinned?: boolean;
  /** The id of the folder it's in */
  folder?: string | null;
};

export type ChatFolder = { id: string; label: string };

/** Details of the events */
export type ChatValueChange = { value: string | null };
export type ChatConversationsChange = { conversations: ChatConversation[] };
export type ChatRenameDetail = { id: string; title: string };
export type ChatPinDetail = { id: string; pinned: boolean };
export type ChatMoveDetail = { id: string; folder: string | null };
export type ChatDeleteDetail = { id: string; conversation: ChatConversation };

type GroupKind = "pinned" | "folder" | "date";
type Group = { key: string; label: string; kind: GroupKind; items: ChatConversation[]; total: number };
type Row = { kind: "head"; key: string; group: Group; pos: number } | { kind: "chat"; key: string; group: Group; chat: ChatConversation; pos: number };

/** More rows than this render only the ones near the viewport */
const WINDOW_FROM = 60;
const OVERSCAN = 20;
let instances = 0;

/** The wall clock, read when the element connects – never while it renders */
const readClock = (): number => Date.now();
const msOf = (v: number | string | Date) => (typeof v === "number" ? v : v instanceof Date ? v.getTime() : Date.parse(v));
const typeahead = /^\S$/u;

/* ---------- Icons: Standard 24-unit outlines at 16px, Clean thin 16px glyphs ---------- */

type IconName = "search" | "close" | "compose" | "pin" | "more" | "chevron" | "folder" | "undo";
const outline = (d: string) => html`<svg viewBox="0 0 24 24" class="ui-chh__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const thin = (d: string, solid = false) => html`<svg viewBox="0 0 16 16" class="ui-chh__glyph" ?data-solid=${solid} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const ICONS: Record<Look, Record<IconName, TemplateResult>> = {
  standard: {
    search: outline("M10.8 17.6a6.8 6.8 0 1 0 0-13.6 6.8 6.8 0 0 0 0 13.6ZM15.8 15.8 20 20"),
    close: outline("m7.5 7.5 9 9m0-9-9 9"),
    compose: outline("M11 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V13M17.6 4.4a1.9 1.9 0 0 1 2.7 2.7L12.5 15l-3.5.8.8-3.5 7.8-7.9Z"),
    pin: outline("M9.5 4.5h5M10.5 4.5v5.2L7.5 13v1.5h9V13l-3-3.3V4.5M12 14.5v5"),
    more: outline("M6 12h.01M12 12h.01M18 12h.01"),
    chevron: outline("M6.5 9.5 12 15l5.5-5.5"),
    folder: outline("M4 7.5A1.5 1.5 0 0 1 5.5 6h3.8l2 2h7.2A1.5 1.5 0 0 1 20 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-10Z"),
    undo: outline("M8 6 4.5 9.5 8 13M5 9.5h9a4.5 4.5 0 0 1 0 9h-3"),
  },
  clean: {
    search: thin("M7.2 11.9a4.7 4.7 0 1 0 0-9.4 4.7 4.7 0 0 0 0 9.4ZM10.6 10.6l2.9 2.9"),
    close: thin("m4.5 4.5 7 7m0-7-7 7"),
    compose: thin("M7.5 2.5h-4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-4M11.8 2.2a1.3 1.3 0 0 1 1.9 1.9L8.2 9.6l-2.4.6.6-2.4 5.4-5.6Z"),
    pin: thin("M6 2.5h4M6.8 2.5v3.6L4.8 8.5v1h6.4v-1l-2-2.4V2.5M8 9.5v4"),
    more: thin("M3.5 9.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm4.5 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm4.5 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z", true),
    chevron: thin("M4.5 6.25 8 9.75l3.5-3.5"),
    folder: thin("M2 4.5a1 1 0 0 1 1-1h3l1.5 1.5H13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7.5Z"),
    undo: thin("M5.5 3.5 3 6l2.5 2.5M3.2 6h6.3a3.5 3.5 0 0 1 0 7H7"),
  },
};

/** The title with every match of `query` marked */
const marked = (text: string, query: string) => {
  if (!query) return text;
  const lower = text.toLowerCase();
  const parts: (string | TemplateResult)[] = [];
  let at = 0;
  for (let i = lower.indexOf(query); i >= 0; i = lower.indexOf(query, i + query.length)) {
    if (i > at) parts.push(text.slice(at, i));
    parts.push(html`<mark class="ui-chh__mark">${text.slice(i, i + query.length)}</mark>`);
    at = i + query.length;
  }
  parts.push(text.slice(at));
  return parts;
};

// The header icon: a clock with a back-turning arrow (past chats)
const historyIcon = svg`<path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l3 2"></path>`;

/**
 * The conversation list: search, pinning, folders, rename and delete with Undo, grouped by date; windowed.
 * @tag tc-chat-history
 * @fires tc-value-change - A chat was opened (click, Enter); detail `{ value: string | null }`. Cancelable: prevent it to control `value`
 * @fires tc-conversations-change - The list changed (renamed, pinned, moved, deleted, restored); detail `{ conversations }`. Cancelable: prevent it to control `conversations`
 * @fires tc-rename - A chat was renamed; detail `{ id, title }`
 * @fires tc-pin - A chat was pinned or unpinned; detail `{ id, pinned }`
 * @fires tc-move - A chat was moved to a folder, or out of one (`folder: null`); detail `{ id, folder }`
 * @fires tc-delete - A chat was deleted (Undo may still bring it back); detail `{ id, conversation }`
 * @fires tc-restore - Undo brought a deleted chat back; detail `{ id, conversation }`
 * @fires tc-new-chat - New chat was pressed
 */
export class TcChatHistory extends TcElement {
  static override ui = "chh";

  /** Every conversation */
  @property({ attribute: false }) accessor conversations: ChatConversation[] = [];
  /** Folders, in the order they show; chats name theirs with `folder` */
  @property({ attribute: false }) accessor folders: ChatFolder[] = [];
  /** The open chat's id */
  @property() accessor value: string | null = null;
  /** "Now" for the date groups (epoch ms or a Date). Unset: the time the element was connected */
  @property({ attribute: false }) accessor now: number | Date | undefined = undefined;
  /** The heading, and the tree's name */
  @property() accessor heading = "Chats";
  /** Height of the list before it scrolls, in px */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 420;
  /**
   * How long Undo stays after a delete, in ms. It waits while the pointer or focus is on it and starts over after;
   * `Infinity` keeps it until the next delete (WCAG 2.2.1)
   */
  @property({ type: Number, attribute: "undo-for" }) accessor undoFor = 6000;
  /** Show the keyboard hints (hints="false" hides them) */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor hints = true;
  /** Locale for the month names; unset uses the page's */
  @property() accessor locale: string | undefined = undefined;

  /** @internal */ @state() accessor query = "";
  /** @internal Folded groups */
  @state() accessor folded: ReadonlySet<string> = new Set();
  /** @internal The row with tabindex 0 */
  @state() accessor active: string | null = null;
  /** @internal The chat being renamed */
  @state() accessor renaming: string | null = null;
  /** @internal */ @state() accessor draft = "";
  /** @internal The open actions menu: which chat, and the corner it hangs from (viewport px) */
  @state() accessor menu: { id: string; x: number; y: number; from: "start" | "end" } | null = null;
  /** @internal The last delete, while Undo is offered */
  @state() accessor deleted: { chat: ChatConversation; index: number; key: number } | null = null;
  /** @internal Undo waits while the pointer or focus is on it */
  @state() accessor holdUndo = { hover: false, focus: false };
  /** @internal */ @state() accessor status = "";

  private readonly uid = `tc-chh-${++instances}`;
  private clock = 0;
  private groups: Group[] = [];
  private rows: Row[] = [];
  private rowIndex = new Map<string, number>();
  private builtFrom: unknown[] = [];
  private months?: { locale: string | undefined; sameYear: Intl.DateTimeFormat; otherYear: Intl.DateTimeFormat };
  /** A row to focus once it's rendered */
  private focusKey: string | null = null;
  private undoTimer = 0;
  private typed = "";
  private typedTimer = 0;
  private deletes = 0;
  private readonly win: RowWindowController;

  constructor() {
    super();
    this.win = new RowWindowController(this, {
      count: () => this.rows.length,
      body: () => this.querySelector(".ui-chh__rows"),
      rowSelector: ".ui-chh__row",
      from: WINDOW_FROM,
      overscan: OVERSCAN,
      rowHeight: 34,
    });
    // Focus never drops to <body>: the menu, Undo and a renamed row hand it to the active row, else the search field
    new FocusRescueController(this, () => this.rowEl(this.active) ?? this.querySelector<HTMLElement>(".ui-chh__input"));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.clock = readClock();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.undoTimer);
    this.undoTimer = 0;
    clearTimeout(this.typedTimer);
    document.removeEventListener("pointerdown", this.onOutside, true);
    window.removeEventListener("resize", this.closeMenu);
    this.menu = null;
  }

  /** @internal "Now" in use, epoch ms */
  get nowMs() {
    return this.now === undefined ? this.clock : msOf(this.now);
  }

  /* ---------- Grouping ---------- */

  private monthLabel(ms: number, now: number) {
    if (!this.months || this.months.locale !== this.locale)
      this.months = {
        locale: this.locale,
        sameYear: new Intl.DateTimeFormat(this.locale, { month: "long" }),
        otherYear: new Intl.DateTimeFormat(this.locale, { month: "long", year: "numeric" }),
      };
    const d = new Date(ms);
    return (d.getFullYear() === new Date(now).getFullYear() ? this.months.sameYear : this.months.otherYear).format(d);
  }

  /** @internal The groups, in order: Pinned, the folders, then by date */
  buildGroups(): Group[] {
    const now = this.nowMs;
    const n = new Date(now);
    const day = (back: number) => new Date(n.getFullYear(), n.getMonth(), n.getDate() - back).getTime();
    const [today, yesterday, week, month] = [day(0), day(1), day(7), day(30)];
    const q = this.query.trim().toLowerCase();
    const folderIds = new Set(this.folders.map((f) => f.id));
    const sorted = this.conversations.map((c) => ({ c, t: msOf(c.updatedAt) || 0 })).sort((a, b) => b.t - a.t);
    const pinned: ChatConversation[] = [];
    const inFolder = new Map<string, ChatConversation[]>();
    const totals = new Map<string, number>();
    const dated = new Map<string, Group>();
    const add = (key: string, label: string, kind: GroupKind, c: ChatConversation, match: boolean) => {
      totals.set(key, (totals.get(key) ?? 0) + 1);
      if (!match) return;
      if (kind === "pinned") pinned.push(c);
      else if (kind === "folder") inFolder.set(key, [...(inFolder.get(key) ?? []), c]);
      else {
        const g = dated.get(key) ?? { key, label, kind, items: [], total: 0 };
        g.items.push(c);
        dated.set(key, g);
      }
    };
    for (const { c, t } of sorted) {
      const match = !q || c.title.toLowerCase().includes(q);
      if (c.pinned) add("pinned", "Pinned", "pinned", c, match);
      else if (c.folder && folderIds.has(c.folder)) add(`folder:${c.folder}`, "", "folder", c, match);
      else if (t >= today) add("today", "Today", "date", c, match);
      else if (t >= yesterday) add("yesterday", "Yesterday", "date", c, match);
      else if (t >= week) add("week", "Previous 7 days", "date", c, match);
      else if (t >= month) add("month", "Previous 30 days", "date", c, match);
      else {
        const d = new Date(t);
        // Keys sort newest first: month groups follow the dated ones in the order they're met
        add(`m:${d.getFullYear()}-${d.getMonth()}`, this.monthLabel(t, now), "date", c, match);
      }
    }
    const groups: Group[] = [];
    if (pinned.length) groups.push({ key: "pinned", label: "Pinned", kind: "pinned", items: pinned, total: totals.get("pinned") ?? 0 });
    for (const f of this.folders) {
      const key = `folder:${f.id}`;
      const items = inFolder.get(key) ?? [];
      // Searching hides folders without a match; otherwise an empty folder still shows
      if (!q || items.length) groups.push({ key, label: f.label, kind: "folder", items, total: totals.get(key) ?? 0 });
    }
    for (const g of dated.values()) groups.push({ ...g, total: totals.get(g.key) ?? 0 });
    return groups;
  }

  private build() {
    const from = [this.conversations, this.folders, this.nowMs, this.query, this.folded, this.locale];
    if (from.length === this.builtFrom.length && from.every((v, i) => v === this.builtFrom[i])) return;
    this.builtFrom = from;
    const searching = !!this.query.trim();
    this.groups = this.buildGroups();
    const rows: Row[] = [];
    this.groups.forEach((group, g) => {
      rows.push({ kind: "head", key: `g:${group.key}`, group, pos: g + 1 });
      if (searching || !this.folded.has(group.key)) group.items.forEach((chat, i) => rows.push({ kind: "chat", key: `c:${chat.id}`, group, chat, pos: i + 1 }));
    });
    this.rows = rows;
    this.rowIndex = new Map(rows.map((r, i) => [r.key, i]));
  }

  /** @internal The rows in order, as the tree lists them */
  get visibleRows() {
    this.build();
    return this.rows;
  }

  /* ---------- Changes ---------- */

  private announce(text: string) {
    this.status = this.status === text ? `${text} ` : text;
  }

  private commit(next: ChatConversation[]) {
    if (this.emit<ChatConversationsChange>("tc-conversations-change", { conversations: next }, { cancelable: true })) this.conversations = next;
  }

  private change(id: string, patch: Partial<ChatConversation>) {
    this.commit(this.conversations.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  private open(chat: ChatConversation) {
    if (chat.id === this.value) return;
    if (this.emit<ChatValueChange>("tc-value-change", { value: chat.id }, { cancelable: true })) this.value = chat.id;
  }

  private find(id: string) {
    return this.conversations.find((c) => c.id === id);
  }

  /** Focus follows a row only when it was on the list or its menu – a pointer click elsewhere keeps its focus */
  private follow(key: string) {
    const active = document.activeElement;
    if (active && (this.querySelector(".ui-chh__rows")?.contains(active) || this.querySelector(".ui-chh__menu")?.contains(active))) this.focusKey = key;
  }

  private togglePin(id: string) {
    const chat = this.find(id);
    if (!chat) return;
    const pinned = !chat.pinned;
    this.change(id, { pinned });
    this.emit<ChatPinDetail>("tc-pin", { id, pinned });
    this.announce(`${pinned ? "Pinned" : "Unpinned"} “${chat.title}”`);
    this.follow(`c:${id}`);
  }

  private move(id: string, folder: string | null) {
    const chat = this.find(id);
    if (!chat || (chat.folder ?? null) === folder) return;
    // A chat moved into a folder leaves Pinned, so it shows where it went
    this.change(id, folder ? { folder, pinned: false } : { folder: null });
    this.emit<ChatMoveDetail>("tc-move", { id, folder });
    const label = this.folders.find((f) => f.id === folder)?.label;
    this.announce(label ? `Moved “${chat.title}” to ${label}` : `Took “${chat.title}” out of its folder`);
    if (folder) this.folded = new Set([...this.folded].filter((k) => k !== `folder:${folder}`));
    this.follow(`c:${id}`);
  }

  private startRename(id: string) {
    const chat = this.find(id);
    if (!chat) return;
    this.renaming = id;
    this.draft = chat.title;
    this.active = `c:${id}`;
  }

  private endRename(save: boolean, refocus = true) {
    const id = this.renaming;
    if (!id) return;
    this.renaming = null;
    if (refocus) this.focusKey = `c:${id}`;
    const chat = this.find(id);
    const title = this.draft.trim();
    if (!save || !chat || !title || title === chat.title) return;
    this.change(id, { title });
    this.emit<ChatRenameDetail>("tc-rename", { id, title });
    this.announce(`Renamed to “${title}”`);
  }

  private deleteChat(id: string) {
    const index = this.conversations.findIndex((c) => c.id === id);
    if (index < 0) return;
    const chat = this.conversations[index];
    // Focus goes to the row that takes its place, else the one before
    const at = this.rowIndex.get(`c:${id}`) ?? 0;
    const rows = this.rows;
    const next = rows.slice(at + 1).find((r) => r.kind === "chat") ?? rows.slice(0, at).reverse().find((r) => r.kind === "chat") ?? rows[Math.max(0, at - 1)];
    clearTimeout(this.undoTimer);
    this.undoTimer = 0;
    this.deleted = { chat, index, key: ++this.deletes };
    this.commit(this.conversations.filter((c) => c.id !== id));
    this.emit<ChatDeleteDetail>("tc-delete", { id, conversation: chat });
    this.announce(`Deleted “${chat.title}”. Undo is below the list`);
    if (next && next.key !== `c:${id}`) {
      this.follow(next.key);
      if (this.focusKey) this.active = next.key;
    }
  }

  private undo() {
    const d = this.deleted;
    if (!d) return;
    clearTimeout(this.undoTimer);
    this.undoTimer = 0;
    this.deleted = null;
    if (!this.find(d.chat.id)) {
      const list = [...this.conversations];
      list.splice(Math.min(d.index, list.length), 0, d.chat);
      this.commit(list);
    }
    this.emit<ChatDeleteDetail>("tc-restore", { id: d.chat.id, conversation: d.chat });
    this.announce(`Restored “${d.chat.title}”`);
    this.focusKey = `c:${d.chat.id}`;
    this.active = this.focusKey;
    // Expand its group, so the restored row can take focus
    this.build();
  }

  private toggleGroup(key: string) {
    const folded = this.folded.has(key);
    const next = new Set(this.folded);
    if (folded) next.delete(key);
    else next.add(key);
    this.folded = next;
  }

  /* ---------- Menu ---------- */

  /** Opens the menu below `anchor` (its right edge), or at a pointer position */
  private openMenu(id: string, anchor: Element | { x: number; y: number } | null) {
    if (anchor && !(anchor instanceof Element)) this.menu = { id, x: anchor.x, y: anchor.y, from: "start" };
    else {
      const box = (anchor ?? this.rowEl(`c:${id}`)?.querySelector(".ui-chh__title") ?? this.rowEl(`c:${id}`))?.getBoundingClientRect();
      if (!box) return;
      this.menu = { id, x: box.right, y: box.bottom, from: "end" };
    }
    this.active = `c:${id}`;
    document.addEventListener("pointerdown", this.onOutside, true);
    window.addEventListener("resize", this.closeMenu);
  }

  private closeMenu = (refocus: boolean | Event = false) => {
    if (!this.menu) return;
    const id = this.menu.id;
    this.menu = null;
    document.removeEventListener("pointerdown", this.onOutside, true);
    window.removeEventListener("resize", this.closeMenu);
    if (refocus === true) this.focusKey = `c:${id}`;
  };

  private onOutside = (e: Event) => {
    if (!this.querySelector(".ui-chh__menu")?.contains(e.target as Node)) this.closeMenu();
  };

  /** Runs a menu item: focus goes back to the row first, so the item's own focus moves follow from there */
  private menuAction(fn: () => void) {
    const id = this.menu?.id;
    if (!id) return;
    this.rowEl(`c:${id}`)?.focus();
    this.closeMenu();
    fn();
  }

  private onMenuKey = (e: KeyboardEvent) => {
    const items = [...this.querySelectorAll<HTMLElement>(".ui-chh__menu-item")];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu(true);
    } else if (e.key === "Tab") {
      e.preventDefault();
      this.closeMenu(true);
    }
  };

  /* ---------- Keyboard ---------- */

  private rowEl(key: string | null) {
    return key ? this.querySelector<HTMLElement>(`.ui-chh__row[data-key="${CSS.escape(key)}"]`) : null;
  }

  private moveTo(key: string | undefined) {
    if (!key) return;
    this.active = key;
    const el = this.rowEl(key);
    if (el) el.focus();
    else this.focusKey = key;
  }

  private onTreeKey = (e: KeyboardEvent) => {
    if (e.isComposing || (e.target as HTMLElement).closest(".ui-chh__rename")) return;
    const rows = this.rows;
    const key = (e.target as HTMLElement).closest<HTMLElement>(".ui-chh__row")?.dataset.key;
    if (!key) return;
    const i = this.rowIndex.get(key) ?? 0;
    const row = rows[i];
    const go = (j: number) => this.moveTo(rows[Math.max(0, Math.min(rows.length - 1, j))]?.key);
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      handled();
      go(e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : rows.length - 1);
    } else if (e.key === "ArrowRight") {
      handled();
      if (row.kind !== "head") return;
      if (this.folded.has(row.group.key) && !this.query.trim()) this.toggleGroup(row.group.key);
      else if (rows[i + 1]?.kind === "chat") go(i + 1);
    } else if (e.key === "ArrowLeft") {
      handled();
      if (row.kind === "chat") this.moveTo(`g:${row.group.key}`);
      else if (!this.folded.has(row.group.key) && !this.query.trim()) this.toggleGroup(row.group.key);
    } else if (e.key === "Enter" || e.key === " ") {
      handled();
      if (row.kind === "chat") this.open(row.chat);
      else if (!this.query.trim()) this.toggleGroup(row.group.key);
    } else if (row.kind === "chat" && e.key === "F2") {
      handled();
      this.startRename(row.chat.id);
    } else if (row.kind === "chat" && (e.key === "Delete" || e.key === "Backspace")) {
      handled();
      this.deleteChat(row.chat.id);
    } else if (row.kind === "chat" && (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey))) {
      handled();
      this.openMenu(row.chat.id, null);
    } else if (typeahead.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Type-ahead: the next row whose title starts with what was typed
      handled();
      clearTimeout(this.typedTimer);
      this.typed += e.key.toLowerCase();
      this.typedTimer = window.setTimeout(() => (this.typed = ""), 600);
      const label = (r: Row) => (r.kind === "chat" ? r.chat.title : r.group.label).toLowerCase();
      const start = this.typed.length > 1 ? i : i + 1;
      const order = [...rows.slice(start), ...rows.slice(0, start)];
      const hit = order.find((r) => label(r).startsWith(this.typed));
      if (hit) this.moveTo(hit.key);
    }
  };

  private onSearchKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.query) {
      e.stopPropagation();
      this.query = "";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const first = this.rows.find((r) => r.kind === "chat") ?? this.rows[0];
      this.moveTo(first?.key);
    }
  };

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.build();
    // The roving tab stop: the open chat, else the first row; a row that went away gives it to the first
    if (!this.active || !this.rowIndex.has(this.active)) this.active = (this.value && this.rowIndex.has(`c:${this.value}`) ? `c:${this.value}` : this.rows[0]?.key) ?? null;
    if (changed.has("query") && changed.get("query") !== undefined) {
      const q = this.query.trim();
      const n = this.groups.reduce((s, g) => s + g.items.length, 0);
      this.announce(q ? (n ? `${n} chat${n === 1 ? "" : "s"} match` : "No chats match") : "");
    }
    if (this.renaming && !this.find(this.renaming)) this.renaming = null;
    if (this.menu && !this.find(this.menu.id)) this.closeMenu();
    this.win.compute();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.style.setProperty("--tc-chat-history-max", `${this.maxHeight}px`);
    // A row to focus: once it's rendered, else bring it into the window first
    if (this.focusKey) {
      const el = this.rowEl(this.focusKey);
      const i = this.rowIndex.get(this.focusKey);
      if (el) {
        this.focusKey = null;
        el.focus();
      } else if (i !== undefined) this.win.reveal(i);
      else this.focusKey = null;
    }
    if (changed.has("renaming") && this.renaming) {
      const input = this.querySelector<HTMLInputElement>(".ui-chh__rename");
      input?.focus();
      input?.select();
    }
    if (changed.has("menu") && this.menu) {
      const menu = this.querySelector<HTMLElement>(".ui-chh__menu");
      if (menu) {
        // Hang it from the anchor's bottom-right corner, inside the viewport; above the anchor if it doesn't fit below
        const { offsetWidth: w, offsetHeight: h } = menu;
        const left = Math.max(8, Math.min(this.menu.from === "end" ? this.menu.x - w : this.menu.x, window.innerWidth - w - 8));
        const below = this.menu.y + 4;
        const top = below + h > window.innerHeight - 8 ? Math.max(8, this.menu.y - h - (this.menu.from === "end" ? 36 : 0)) : below;
        // The menu is placed in the host (fixed positioning would break inside a transformed ancestor)
        const host = this.getBoundingClientRect();
        menu.style.left = `${left - host.left}px`;
        menu.style.top = `${top - host.top}px`;
        menu.querySelector<HTMLElement>(".ui-chh__menu-item")?.focus();
      }
    }
    // Undo goes after `undoFor` – not while the pointer or focus is on it
    const held = this.holdUndo.hover || this.holdUndo.focus;
    if (!this.deleted || held || !Number.isFinite(this.undoFor)) {
      clearTimeout(this.undoTimer);
      this.undoTimer = 0;
    } else if (!this.undoTimer)
      this.undoTimer = window.setTimeout(() => {
        this.undoTimer = 0;
        this.deleted = null;
      }, this.undoFor);
  }

  /* ---------- Parts ---------- */

  private headRow(row: Extract<Row, { kind: "head" }>, icons: Record<IconName, TemplateResult>, top?: number) {
    const { group } = row;
    const searching = !!this.query.trim();
    const open = searching || !this.folded.has(group.key);
    return html`<div
      role="treeitem"
      class="ui-chh__row ui-chh__head-row"
      data-key=${row.key}
      data-kind=${group.kind}
      aria-level="1"
      aria-posinset=${row.pos}
      aria-setsize=${this.groups.length}
      aria-expanded=${open ? "true" : "false"}
      aria-label=${`${group.label}, ${searching ? `${group.items.length} of ${group.total}` : group.total} chat${group.total === 1 ? "" : "s"}`}
      tabindex=${this.active === row.key ? 0 : -1}
      ?data-float=${top !== undefined}
      style=${styleMap({ top: top === undefined ? undefined : `${top}px` })}
      @click=${() => !searching && this.toggleGroup(group.key)}
    >
      <span class="ui-chh__chevron" aria-hidden="true">${icons.chevron}</span>
      ${group.kind === "folder" ? html`<span class="ui-chh__folder" aria-hidden="true">${icons.folder}</span>` : nothing}
      <span class="ui-chh__group-label">${group.label}</span>
      <span class="ui-chh__group-count" aria-hidden="true">${searching ? group.items.length : group.total}</span>
    </div>`;
  }

  private chatRow(row: Extract<Row, { kind: "chat" }>, icons: Record<IconName, TemplateResult>, top?: number) {
    const { chat } = row;
    const renaming = this.renaming === chat.id;
    const selected = this.value === chat.id;
    return html`<div
      role="treeitem"
      class="ui-chh__row ui-chh__item"
      data-key=${row.key}
      aria-level="2"
      aria-posinset=${row.pos}
      aria-setsize=${row.group.items.length}
      aria-selected=${selected ? "true" : "false"}
      aria-label=${chat.title}
      ?data-renaming=${renaming}
      ?data-menu=${this.menu?.id === chat.id}
      tabindex=${this.active === row.key ? 0 : -1}
      ?data-float=${top !== undefined}
      style=${styleMap({ top: top === undefined ? undefined : `${top}px` })}
      @click=${(e: MouseEvent) => !renaming && !(e.target as Element).closest(".ui-chh__acts") && this.open(chat)}
      @contextmenu=${(e: MouseEvent) => {
        if (renaming) return;
        e.preventDefault();
        this.openMenu(chat.id, { x: e.clientX, y: e.clientY });
      }}
    >
      ${chat.pinned && row.group.kind !== "pinned" ? html`<span class="ui-chh__pin-mark" aria-hidden="true">${icons.pin}</span>` : nothing}
      ${renaming
        ? html`<input
            class="ui-chh__rename"
            aria-label="Rename chat"
            .value=${this.draft}
            @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              e.stopPropagation();
              if (e.isComposing) return;
              if (e.key !== "Enter" && e.key !== "Escape") return;
              e.preventDefault();
              this.endRename(e.key === "Enter");
            }}
            @blur=${() => this.renaming === chat.id && this.endRename(true, false)}
          />`
        : html`<span class="ui-chh__title">${marked(chat.title, this.query.trim().toLowerCase())}</span>
            <span class="ui-chh__acts" aria-hidden="true">
              <button
                type="button"
                tabindex="-1"
                class="ui-chh__act"
                title=${chat.pinned ? "Unpin" : "Pin"}
                ?data-on=${!!chat.pinned}
                @mousedown=${(e: Event) => e.preventDefault()}
                @click=${() => this.togglePin(chat.id)}
              >${icons.pin}</button>
              <button
                type="button"
                tabindex="-1"
                class="ui-chh__act"
                title="More"
                @mousedown=${(e: Event) => e.preventDefault()}
                @click=${(e: MouseEvent) => (this.menu?.id === chat.id ? this.closeMenu(true) : this.openMenu(chat.id, e.currentTarget as Element))}
              >${icons.more}</button>
            </span>`}
    </div>`;
  }

  private rowsPart(icons: Record<IconName, TemplateResult>) {
    const rows = this.rows;
    const win = this.win;
    if (!win.virtual) return repeat(rows, (r) => r.key, (r) => this.drawRow(r, icons));
    // The window between two spacers that stay in place (WebKit loses the scroll position when a spacer is swapped
    // for another mid-scroll). The active row, a row being renamed or with its menu open, stays rendered while it's
    // out of the window: out of the flow, placed where it would be
    const kept = [...new Set([this.active, this.focusKey, this.renaming && `c:${this.renaming}`, this.menu && `c:${this.menu.id}`])]
      .map((k) => (k ? (this.rowIndex.get(k) ?? -1) : -1))
      .filter((n) => n >= 0 && (n < win.start || n >= win.end));
    const h = win.rowHeight;
    // One keyed list, in order, so a row keeps its element (and focus) as it leaves or enters the window
    const shown = [...kept, ...Array.from({ length: win.end - win.start }, (_, k) => win.start + k)].sort((x, y) => x - y);
    return html`<div class="ui-chh__spacer" aria-hidden="true" style=${styleMap({ height: `${win.start * h}px` })}></div>
      ${repeat(shown, (n) => rows[n].key, (n) => this.drawRow(rows[n], icons, n < win.start || n >= win.end ? n * h : undefined))}
      <div class="ui-chh__spacer" aria-hidden="true" style=${styleMap({ height: `${(rows.length - win.end) * h}px` })}></div>`;
  }

  private drawRow(r: Row, icons: Record<IconName, TemplateResult>, top?: number) {
    return r.kind === "head" ? this.headRow(r, icons, top) : this.chatRow(r, icons, top);
  }

  private menuPart() {
    const m = this.menu;
    const chat = m ? this.find(m.id) : undefined;
    if (!m || !chat) return nothing;
    const folder = chat.folder ?? null;
    const item = (label: string, run: () => void, extra: { kbd?: string; danger?: boolean } = {}) =>
      html`<button type="button" role="menuitem" tabindex="-1" class="ui-chh__menu-item" ?data-danger=${!!extra.danger} @click=${() => this.menuAction(run)}>
        <span>${label}</span>${extra.kbd ? html`<kbd class="ui-chh__kbd" aria-hidden="true">${extra.kbd}</kbd>` : nothing}
      </button>`;
    return html`<div class="ui-chh__menu" role="menu" aria-label=${`Actions for “${chat.title}”`} @keydown=${this.onMenuKey}>
      ${item("Rename", () => this.startRename(chat.id), { kbd: "F2" })}
      ${item(chat.pinned ? "Unpin" : "Pin", () => this.togglePin(chat.id))}
      ${this.folders.length
        ? html`<div class="ui-chh__menu-sep" role="separator"></div>
            <div role="group" aria-label="Move to folder">
              <div class="ui-chh__menu-label" aria-hidden="true">Move to</div>
              ${[...this.folders.map((f) => ({ id: f.id as string | null, label: f.label })), { id: null, label: "No folder" }].map(
                (f) => html`<button
                  type="button"
                  role="menuitemradio"
                  tabindex="-1"
                  class="ui-chh__menu-item"
                  aria-checked=${folder === f.id ? "true" : "false"}
                  @click=${() => this.menuAction(() => this.move(chat.id, f.id))}
                ><span>${f.label}</span><span class="ui-chh__menu-check" aria-hidden="true">${folder === f.id ? "✓" : ""}</span></button>`,
              )}
            </div>`
        : nothing}
      <div class="ui-chh__menu-sep" role="separator"></div>
      ${item("Delete", () => this.deleteChat(chat.id), { kbd: "⌫", danger: true })}
    </div>`;
  }

  private foot(icons: Record<IconName, TemplateResult>, clean: boolean) {
    const d = this.deleted;
    const setHold = (h: { hover?: boolean; focus?: boolean }) => (this.holdUndo = { ...this.holdUndo, ...h });
    if (!d && !this.hints) return nothing;
    return html`<div
      class="ui-chh__foot"
      @pointerenter=${() => setHold({ hover: true })}
      @pointerleave=${() => setHold({ hover: false })}
      @focusin=${() => setHold({ focus: true })}
      @focusout=${(e: FocusEvent) => !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null) && setHold({ focus: false })}
    >
      ${d
        ? keyed(
            `undo-${d.key}`,
            html`<span class="ui-chh__deleted"><span class="ui-chh__deleted-text">Deleted “${d.chat.title}”</span></span>
              <button type="button" class="ui-chh__undo" @click=${() => this.undo()}>${icons.undo}Undo</button>`,
          )
        : html`<span class="ui-chh__hints" aria-hidden="true">
            <span class="ui-chh__hint"><kbd>↑</kbd><kbd>↓</kbd>${clean ? "to move" : "Move"}</span>
            <span class="ui-chh__hint"><kbd>F2</kbd>${clean ? "to rename" : "Rename"}</span>
            <span class="ui-chh__hint ui-chh__hint--more"><kbd>⇧F10</kbd>${clean ? "for more" : "More"}</span>
          </span>`}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const icons = ICONS[look];
    this.build();
    const q = this.query.trim();
    const total = this.conversations.length;
    const head = cardHead({
      icon: historyIcon,
      title: this.heading,
      id: `${this.uid}-title`,
      aside: html`<span class="ui-chh__count" aria-hidden="true">${total.toLocaleString(this.locale)}</span>
        <button type="button" class="ui-chh__icon" aria-label="New chat" title="New chat" @click=${() => this.emit("tc-new-chat", null)}>${icons.compose}</button>`,
    });
    const empty = !this.rows.length || (q && !this.groups.some((g) => g.items.length));
    const body = html`
      <div class="ui-chh__search">
        ${icons.search}
        <input
          class="ui-chh__input"
          type="text"
          role="searchbox"
          placeholder="Search chats"
          aria-label="Search chats"
          aria-controls="${this.uid}-tree"
          .value=${this.query}
          @input=${(e: Event) => (this.query = (e.target as HTMLInputElement).value)}
          @keydown=${this.onSearchKey}
        />
        ${this.query
          ? html`<button
              type="button"
              class="ui-chh__icon ui-chh__clear"
              aria-label="Clear search"
              @click=${() => {
                this.query = "";
                this.querySelector<HTMLInputElement>(".ui-chh__input")?.focus();
              }}
            >${icons.close}</button>`
          : nothing}
      </div>
      <div class="ui-chh__list" @scroll=${() => this.menu && this.closeMenu()}>
        <div class="ui-chh__rows" id="${this.uid}-tree" role="tree" aria-labelledby="${this.uid}-title" @keydown=${this.onTreeKey} @focusin=${(e: FocusEvent) => {
          const key = (e.target as HTMLElement).closest<HTMLElement>(".ui-chh__row")?.dataset.key;
          if (key && key !== this.active) this.active = key;
        }}>${this.rowsPart(icons)}</div>
        ${empty ? html`<p class="ui-chh__empty">${q ? `No chats match “${q}”` : "No chats yet"}</p>` : nothing}
      </div>
    `;
    return html`
      ${clean ? html`${head}${body}${this.foot(icons, clean)}` : html`${head}<div class="ui-chh__card">${body}</div>${this.foot(icons, clean)}`}
      ${this.menuPart()}
      <span class="ui-chh__sr" role="status">${this.status}</span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="chh"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 340px;
  min-width: 0;
  container-type: inline-size;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="chh"] {
  /* One white card – the edge is a shadow, not a border */
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  min-width: 0;
  container-type: inline-size;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="chh"] *, [data-ui="chh"] *::before, [data-ui="chh"] *::after { box-sizing: border-box; }
:where([data-ui="chh"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="chh"]) p { margin: 0; }
[data-ui="chh"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="chh"] svg { display: block; flex: none; }
.ui-chh__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__glyph[data-solid] { fill: currentColor; stroke: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__count { flex: none; min-width: 20px; height: 20px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); text-align: center; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__count { flex: none; min-width: 20px; height: 18px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-align: center; color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
/* Ghost icon buttons */
.ui-chh__icon { display: grid; flex: none; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-chh__icon:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- Search: the field pattern ----- */
.ui-chh__search { display: flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-field-h); padding: 0 var(--tc-space-0-5) 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg-sunken); box-shadow: var(--tc-field-shadow); color: var(--tc-icon-muted); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-chh__search:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-chh__search:focus-within { box-shadow: var(--tc-field-shadow-focus); }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__search { margin: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__search { margin: var(--tc-space-2) var(--tc-space-3) var(--tc-space-1); }
.ui-chh__input { flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); caret-color: var(--tc-accent); outline: none; }
.ui-chh__input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
.ui-chh__search .ui-chh__clear { width: 26px; height: 26px; }
/* ----- The list: a scroller with the tree inside ----- */
.ui-chh__list { position: relative; max-height: var(--tc-chat-history-max, 420px); overflow-y: auto; overflow-anchor: none; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong) transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__list { padding: 0 var(--tc-space-1-5) var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__list { padding: 0 var(--tc-space-1-5) var(--tc-space-1-5); }
.ui-chh__rows { position: relative; display: grid; }
/* A row kept rendered outside the window, placed where it would be */
.ui-chh__row[data-float] { position: absolute; left: 0; right: 0; }
.ui-chh__spacer { flex: none; }
/* Every row is the same height, so the window can place rows it hasn't rendered */
.ui-chh__row { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; }
.ui-chh__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__row { height: 34px; padding: 0 var(--tc-space-1) 0 var(--tc-space-2-5); border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__row { height: 32px; padding: 0 var(--tc-space-1) 0 var(--tc-space-2-5); border-radius: var(--tc-radius-sm); }
/* Group rows: the label sits low, so it reads as the head of what follows */
.ui-chh__head-row { align-items: flex-end; padding-bottom: var(--tc-space-1-5) !important; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__group-label { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__group-label { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; white-space: nowrap; text-overflow: ellipsis; }
.ui-chh__head-row[data-kind="folder"] .ui-chh__group-label { color: var(--tc-text-secondary); text-transform: none; letter-spacing: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__head-row[data-kind="folder"] .ui-chh__group-label { font-size: var(--tc-font-size-sm); }
.ui-chh__group-count { margin-left: auto; padding-right: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-chh__head-row:is(:hover, :focus-visible) .ui-chh__group-count, .ui-chh__head-row[data-kind="folder"] .ui-chh__group-count, .ui-chh__head-row[aria-expanded="false"] .ui-chh__group-count { opacity: 1; }
.ui-chh__chevron { display: grid; place-items: center; width: 12px; height: 16px; margin-left: calc(-1 * var(--tc-space-1)); color: var(--tc-icon-muted); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-chh__chevron .ui-chh__glyph { width: 12px; height: 12px; }
.ui-chh__head-row[aria-expanded="false"] .ui-chh__chevron { transform: rotate(-90deg); }
.ui-chh__folder { display: grid; place-items: center; color: var(--tc-icon-muted); }
.ui-chh__folder .ui-chh__glyph { width: 14px; height: 14px; }
/* Chat rows */
:where([data-look="standard"], [data-look="standard"] *).ui-chh__item { font-size: var(--tc-font-size-md); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__item:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-chh__item[data-menu] { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__item[aria-selected="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__item { font-size: var(--tc-font-size-md); color: var(--tc-text-primary); transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate); }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__item:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-chh__item[data-menu] { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__item[aria-selected="true"] { background: var(--tc-fill-default); color: var(--tc-text-strong); font-weight: var(--tc-font-weight-medium); }
.ui-chh__title { flex: 1 1 auto; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-chh__mark { border-radius: var(--tc-radius-2xs); background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-chh__pin-mark { display: grid; place-items: center; color: var(--tc-icon-muted); }
.ui-chh__pin-mark .ui-chh__glyph { width: 12px; height: 12px; }
/* The row's actions: shown on hover, while its menu is open, and on touch screens */
.ui-chh__acts { display: none; flex: none; align-items: center; gap: var(--tc-space-0-5); }
.ui-chh__item:is(:hover, [data-menu]) .ui-chh__acts { display: inline-flex; }
.ui-chh__act { display: grid; place-items: center; width: 26px; height: 26px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard); }
.ui-chh__act:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-chh__act[data-on] { color: var(--tc-text-primary); }
/* Rename in place: the field pattern inside the row */
.ui-chh__rename { flex: 1; min-width: 0; height: 26px; margin: 0 0 0 calc(-1 * var(--tc-space-1-5)); padding: 0 var(--tc-space-1-5); border: 0; border-radius: var(--tc-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); font: inherit; color: var(--tc-text-primary); caret-color: var(--tc-accent); outline: none; }
.ui-chh__empty { padding: var(--tc-space-6) var(--tc-space-2) var(--tc-space-5); font-size: var(--tc-font-size-md); text-align: center; color: var(--tc-text-muted); overflow-wrap: anywhere; }
/* ----- Foot: the keyboard hints, or Undo after a delete ----- */
.ui-chh__foot { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-chh__foot { min-height: 38px; padding: var(--tc-space-1) var(--tc-space-1) 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__foot { min-height: 40px; padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-chh__hints { display: flex; flex: 1; align-items: center; gap: var(--tc-space-3); min-width: 0; overflow: hidden; white-space: nowrap; }
.ui-chh__hint { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-chh__hint kbd, .ui-chh__kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); line-height: var(--tc-kbd-h); font-weight: var(--tc-kbd-font-weight); color: var(--tc-kbd-fg); }
.ui-chh__hint kbd + kbd { margin-left: calc(-1 * var(--tc-space-0-5)); }
.ui-chh__deleted { display: flex; flex: 1; min-width: 0; animation: ui-chh-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-chh__deleted-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* Undo: Button's secondary (small in Standard, the default size in Clean) */
.ui-chh__undo { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-normal); color: var(--tc-action-secondary-fg); white-space: nowrap; animation: ui-chh-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-chh__undo { gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md) 0 var(--tc-space-2); border-radius: var(--tc-control-radius-md); }
.ui-chh__undo:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-chh__undo .ui-chh__glyph { width: 14px; height: 14px; }
/* ----- The actions menu: the menu pattern, hung from the row ----- */
[data-ui="chh"] { position: relative; }
.ui-chh__menu { position: absolute; z-index: var(--tc-z-dropdown); display: grid; gap: var(--tc-space-0-5); width: 200px; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-chh-drop var(--tc-duration-fast) var(--tc-ease-move) both; }
.ui-chh__menu [role="group"] { display: grid; gap: var(--tc-space-0-5); }
.ui-chh__menu-item { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); width: 100%; height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px) !important; border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard); }
.ui-chh__menu-item:hover, .ui-chh__menu-item:focus-visible { background: var(--tc-menu-item-hover); }
[data-ui="chh"] .ui-chh__menu-item:focus-visible { outline: none; }
.ui-chh__menu-item[aria-checked="true"] { color: var(--tc-menu-item-selected-fg); }
.ui-chh__menu-item[data-danger] { color: var(--tc-status-danger-fg); }
.ui-chh__menu-item[data-danger]:hover, .ui-chh__menu-item[data-danger]:focus-visible { background: var(--tc-status-danger-bg); }
.ui-chh__menu-label { padding: var(--tc-space-1) var(--tc-menu-item-px) var(--tc-space-0-5); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-chh__menu-sep { height: 1px; margin: var(--tc-space-0-5) var(--tc-space-1); background: var(--tc-divider); }
.ui-chh__menu-check { color: var(--tc-menu-item-selected-fg); }
@keyframes ui-chh-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-chh-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
/* Narrow: the third hint goes */
@container (max-width: 300px) {
  .ui-chh__hint--more { display: none; }
}
/* Touch screens: taller rows, actions always there */
@media (hover: none) and (pointer: coarse) {
  .ui-chh__acts { display: inline-flex; }
  .ui-chh__act { width: 36px; height: 36px; }
  .ui-chh__hints { display: none; }
  .ui-chh__search { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="chh"] *, [data-ui="chh"] *::before, [data-ui="chh"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-chat-history")) customElements.define("tc-chat-history", TcChatHistory);

declare global {
  interface HTMLElementTagNameMap {
    "tc-chat-history": TcChatHistory;
  }
}
