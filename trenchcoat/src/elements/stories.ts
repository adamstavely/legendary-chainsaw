import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { ToolbarController } from "./internal/controllers";
import { ModalController } from "./internal/modal";
import { initials } from "./internal/util";
import { safeUrl } from "./internal/safe-url";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-stories> – a row of avatars for people and accounts, and the "what changed" brief each one opens. A gradient
 * ring (--tc-story-ring) means an entry has updates the person hasn't seen, a quiet gray ring that everything has been
 * seen; an optional "add" tile comes first. People are round, accounts (a workspace, a project, a customer) square.
 * Activating an avatar opens a modal brief for that entry: the avatar, the name and "6 updates since you last looked ·
 * Tue 09:41" in the header, an optional one-sentence summary (marked when the app says it's generated), and a bento
 * grid of update tiles, each designed for its kind – a metric with its change and a sparkline, a status move, a note,
 * a list of new things, an image, a link or action. Unseen tiles come first with a "New" marker; seen ones stay,
 * quieter. Previous and Next at the foot (with the neighbour's name) move between entries; nothing moves on its own.
 * Opening an entry marks its unseen updates seen in one cancelable tc-seen-change; the app owns `seen` and may own
 * `open` (cancelable tc-open-change).
 *   · the row is a toolbar: one tab stop, ← → Home End move between avatars, Enter / Space opens
 *   · the brief is a native modal (internal/modal.ts) named by the entry: focus starts on its content, Tab runs
 *     through the tiles' links and actions (tiles themselves aren't tab stops) and the foot, ← → move between
 *     entries, Escape closes and focus returns to the avatar of the entry last viewed
 *   · the grid places tiles by their size hint (small, wide, tall) and fills gaps; it drops to two columns, then one
 * Standard: the header, the summary and the foot sit on the gray tray, each tile is a white card on it; seen tiles
 * lose their card and keep a hairline. Clean: one white surface with hairline-framed tiles, quieter text and
 * thinner icons. Both follow the light, dark and system themes through the tokens.
 *
 *   <tc-stories .entries=${entries} .seen=${seen} @tc-seen-change=${…}></tc-stories>
 */

/** A tile's size hint: the grid places it, filling gaps */
export type StoryTileSize = "small" | "wide" | "tall";
/** A status tone, from the status colours */
export type StoryTone = "neutral" | "info" | "success" | "warning" | "danger";
type UpdateBase = {
  /** Stable id – `seen` holds these */
  id: string;
  /** The tile's heading: what changed ("Weekly active users", "Plan", "New members") */
  title: string;
  /** When it happened, shown as given ("2h", "09:41", "Yesterday") */
  at?: string;
  /** The tile's size hint (defaults: metric, status and link small; note and image wide; list tall) */
  size?: StoryTileSize;
};
/** A number that moved: the value, its change and an optional trend line */
export type StoryMetricUpdate = UpdateBase & {
  kind: "metric";
  /** The value now, formatted as your product writes it ("12,480", "$4.2k", "182 ms") */
  value: string | number;
  /** The change since the last look; a rise is good (green) unless `lowerIsBetter` */
  delta?: number;
  /** Put after the change's number ("%", " pts", " ms") */
  deltaUnit?: string;
  /** A drop is the good direction (latency, cost, churn) */
  lowerIsBetter?: boolean;
  /** Neither direction is good or bad: the change shows in neutral ink */
  neutral?: boolean;
  /** A quiet line after the change ("vs last week") */
  context?: string;
  /** Recent values, oldest first, drawn as a sparkline */
  trend?: number[];
};
/** Something moved from one state to another */
export type StoryStatusUpdate = UpdateBase & {
  kind: "status";
  from?: string;
  to: string;
  fromTone?: StoryTone;
  toTone?: StoryTone;
  /** A line of context under the move */
  text?: string;
};
/** A short note, with who wrote it */
export type StoryNoteUpdate = UpdateBase & { kind: "note"; text: string; author?: string };
/** One new thing in a list: its label and an optional quiet detail */
export type StoryListItem = string | { label: string; meta?: string };
/** New things – added members, new files, closed tickets – with "+N more" */
export type StoryListUpdate = UpdateBase & {
  kind: "list";
  items: StoryListItem[];
  /** How many there are in all, when `items` is only the first few; the rest show as "+N more" */
  total?: number;
};
/** A picture with a caption */
export type StoryImageUpdate = UpdateBase & { kind: "image"; src: string; alt: string; caption?: string };
/** A link or an action: "Open report", "Review" */
export type StoryLinkUpdate = UpdateBase & {
  kind: "link";
  /** A line saying what's behind it */
  text?: string;
  /** The button's text */
  label: string;
  /** Where it goes; without one it's a button that only fires tc-action */
  href?: string;
};
/** One update in an entry's brief */
export type StoryUpdate = StoryMetricUpdate | StoryStatusUpdate | StoryNoteUpdate | StoryListUpdate | StoryImageUpdate | StoryLinkUpdate;
/** A person, or an account (a workspace, a project, a customer), and what changed for them */
export type StoryEntry = {
  id: string;
  name: string;
  /** "person" (a round avatar, the default) or "account" (a square one) */
  kind?: "person" | "account";
  avatar?: string;
  /** When the person last looked, as your product writes it ("Tue 09:41"); shown in the header */
  since?: string;
  /** One sentence above the tiles, written by the app (or a model) */
  summary?: string;
  /** The summary was generated: it's marked with `generatedLabel` */
  summaryGenerated?: boolean;
  /** The updates, in the order the app wants them read; unseen ones are shown first */
  updates: StoryUpdate[];
};
/** @deprecated The earlier name for StoryEntry */
export type StoryPerson = StoryEntry;
/** The entry whose brief is open, by id, or null when it's closed */
export type StoryOpen = string | null;
/** The update ids that have been seen: a Set, or a record of id → true */
export type StorySeen = ReadonlySet<string> | Readonly<Record<string, boolean>>;
export type StoryOpenChangeEvent = { open: StoryOpen };
export type StorySeenChangeEvent = { seen: StorySeen; entry: StoryEntry; updates: StoryUpdate[] };
export type StoryReplyEvent = { text: string; entry: StoryEntry };
export type StoryActionEvent = { entry: StoryEntry; update: StoryLinkUpdate };

const AVATAR_TONES = ["violet", "pink", "amber", "rose", "teal"];
const TONES: StoryTone[] = ["neutral", "info", "success", "warning", "danger"];
const SIZES: Record<StoryUpdate["kind"], StoryTileSize> = { metric: "small", status: "small", note: "wide", list: "tall", image: "wide", link: "small" };
/** A list tile shows this many items before "+N more" */
const LIST_SHOWN = 4;
let uidCount = 0;

const isSeenIn = (seen: StorySeen, id: string) => (seen instanceof Set ? seen.has(id) : !!(seen as Record<string, boolean>)[id]);
const withSeen = (seen: StorySeen, ids: string[]): StorySeen =>
  seen instanceof Set ? new Set([...seen, ...ids]) : { ...(seen as Record<string, boolean>), ...Object.fromEntries(ids.map((id) => [id, true])) };
const toneFor = (id: string) => AVATAR_TONES[[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATAR_TONES.length];
/** Where a tile sits: its first column and row, and how many it spans */
type Place = { c: number; r: number; w: number; h: number };
/**
 * Places tiles on a grid of `cols` columns in order, each in the first spot its size fits (wide: two columns, tall:
 * two rows), then grows each one right, and then down, into cells nothing took – so a short brief has no holes
 */
function packTiles(sizes: StoryTileSize[], cols: number): Place[] {
  const taken: boolean[][] = [];
  const free = (r: number, c: number) => c < cols && !taken[r]?.[c];
  const take = (p: Place) => {
    for (let r = p.r; r < p.r + p.h; r++) for (let c = p.c; c < p.c + p.w; c++) (taken[r] ??= [])[c] = true;
  };
  const fits = (r: number, c: number, w: number, h: number) => {
    for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) if (!free(rr, cc)) return false;
    return true;
  };
  const places = sizes.map((size) => {
    const w = Math.min(cols, size === "wide" ? 2 : 1);
    const h = size === "tall" && cols > 1 ? 2 : 1;
    for (let r = 0; ; r++)
      for (let c = 0; c + w <= cols; c++)
        if (fits(r, c, w, h)) {
          const p = { c, r, w, h };
          take(p);
          return p;
        }
  });
  const rows = Math.max(0, ...places.map((p) => p.r + p.h));
  for (const p of places) {
    while (fits(p.r, p.c + p.w, 1, p.h)) {
      take({ c: p.c + p.w, r: p.r, w: 1, h: p.h });
      p.w++;
    }
  }
  for (const p of places) {
    while (p.r + p.h < rows && fits(p.r + p.h, p.c, p.w, 1)) {
      take({ c: p.c, r: p.r + p.h, w: p.w, h: 1 });
      p.h++;
    }
  }
  return places;
}
const area = (p: Place) => `${p.c + 1} / span ${p.w}`;
const band = (p: Place) => `${p.r + 1} / span ${p.h}`;
const toneOf = (t: StoryTone | undefined) => (t && TONES.includes(t) ? t : "neutral");
/** The change's number, signed the way kpi-chart writes it: +12 · −3.5 */
const signed = (n: number, unit = "") => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 1 })}${unit}`;

/* Plus, x, chevron-left, chevron-right, send, sparkles, arrow-up-right, arrow-down-right, arrow-right: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: TemplateResult) =>
  html`<svg class="ui-sty__icon" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const plusIcon = (s: number) => lucide(s, svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const closeIcon = () => lucide(16, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const prevIcon = () => lucide(16, svg`<path d="m15 18-6-6 6-6"></path>`);
const nextIcon = () => lucide(16, svg`<path d="m9 18 6-6-6-6"></path>`);
const sendIcon = () => lucide(16, svg`<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path>`);
const sparkIcon = () =>
  lucide(
    14,
    svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path>`,
  );
const upIcon = () => lucide(14, svg`<path d="M7 7h10v10"></path><path d="M7 17 17 7"></path>`);
const downIcon = () => lucide(14, svg`<path d="m7 7 10 10"></path><path d="M17 7v10H7"></path>`);
const arrowIcon = (s = 14) => lucide(s, svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`);

/**
 * A row of avatars for people and accounts – a gradient ring when there's something new, a gray ring once seen – and
 * the modal "what changed" brief each one opens: a bento grid of update tiles, with Previous and Next between entries.
 * @tag tc-stories
 * @fires tc-open-change - A brief is opening, moving to another entry or closing ({ open }: StoryOpenChangeEvent – the entry id, or null); cancelable – prevented, `open` stays as it was
 * @fires tc-seen-change - A brief was opened on unseen updates, once per opening ({ seen, entry, updates }: StorySeenChangeEvent – `seen` with every one of them added, in the same shape); cancelable – prevented, `seen` stays as it was
 * @fires tc-action - A link or action tile was activated ({ entry, update }: StoryActionEvent); cancelable – prevented, a link doesn't navigate
 * @fires tc-reply - A reply was sent from the brief ({ text, entry }: StoryReplyEvent)
 * @fires tc-add - The "add" tile was activated; detail: undefined
 */
export class TcStories extends TcElement {
  static override ui = "sty";

  /** The people and accounts, in the order the row shows them; entries with no updates are left out */
  @property({ attribute: false }) accessor entries: StoryEntry[] = [];
  /** The update ids that have been seen, as a Set or a record of id → true; the app owns it */
  @property({ attribute: false }) accessor seen: StorySeen = new Set<string>();
  /** The id of the entry whose brief is open, or null when it's closed */
  @property({ attribute: false }) accessor open: StoryOpen = null;
  /** Show the "add" tile first in the row */
  @property({ type: Boolean, reflect: true }) accessor addable = false;
  /** The "add" tile's text */
  @property({ attribute: "add-label" }) accessor addLabel = "Add update";
  /** An image for the "add" tile (the person's own avatar); without one it shows a plus */
  @property({ attribute: "add-avatar" }) accessor addAvatar = "";
  /** Show a reply field at the foot of the brief; sending fires tc-reply */
  @property({ type: Boolean, reflect: true }) accessor replyable = false;
  /** The row's accessible name */
  @property() accessor label = "Updates";
  /** Said after a name when there's something new ("Maya Chen, 2 new") */
  @property({ attribute: "new-label" }) accessor newLabel = "new";
  /** Said after a name when everything's been seen ("Maya Chen, seen") */
  @property({ attribute: "seen-label" }) accessor seenLabel = "seen";
  /** The marker on a tile that's new since the last look */
  @property({ attribute: "marker-label" }) accessor markerLabel = "New";
  /** The header's count line, from the number of new updates and of all of them; `since` follows it after " · " */
  @property({ attribute: false }) accessor describeCount: (fresh: number, total: number) => string = (fresh, total) =>
    fresh ? `${fresh} ${fresh === 1 ? "update" : "updates"} since you last looked` : `${total} ${total === 1 ? "update" : "updates"}, nothing new since you last looked`;
  /** The mark on a summary the app says was generated */
  @property({ attribute: "generated-label" }) accessor generatedLabel = "AI summary";
  /** Said after a metric's change when it's the good direction */
  @property({ attribute: "better-label" }) accessor betterLabel = "better";
  /** Said after a metric's change when it's the bad direction */
  @property({ attribute: "worse-label" }) accessor worseLabel = "worse";
  /** Said between a status move's two states ("Draft to In review") */
  @property({ attribute: "to-label" }) accessor toLabel = "to";
  /** After the count of a list's hidden items ("+3 more") */
  @property({ attribute: "more-label" }) accessor moreLabel = "more";
  /** Shown when there are no entries and no "add" tile */
  @property({ attribute: "empty-label" }) accessor emptyLabel = "Nothing new yet.";
  /** The reply field's placeholder and name, before the entry's name ("Reply to Maya Chen") */
  @property({ attribute: "reply-label" }) accessor replyLabel = "Reply to";
  /** The send button's name */
  @property({ attribute: "send-label" }) accessor sendLabel = "Send";
  /** The close button's name */
  @property({ attribute: "close-label" }) accessor closeLabel = "Close";
  /** The word over the previous entry's name */
  @property({ attribute: "previous-label" }) accessor previousLabel = "Previous";
  /** The word over the next entry's name */
  @property({ attribute: "next-label" }) accessor nextLabel = "Next";

  /** The same list as `entries`, by its earlier name */
  get people(): StoryEntry[] {
    return this.entries;
  }
  set people(value: StoryEntry[]) {
    this.entries = value;
  }

  /** @internal The polite announcement when the brief moves to another entry */
  @state() accessor announce = "";

  private readonly uid = `tc-stories-${++uidCount}`;
  private readonly toolbar = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-sty__row > .ui-sty__person")] });
  private readonly modal = new ModalController(this, {
    dialog: () => this.dialogEl,
    focus: () => this.bodyEl,
    lockScroll: true,
  });
  /** The entry shown, and the ids that were new when it was opened (they keep their marker while it's open) */
  private shown = "";
  private fresh = new Set<string>();
  private lastEntry = "";
  private moved = false;

  /* ---------- The model ---------- */

  private get list() {
    return (this.entries ?? []).filter((e) => e.updates?.length);
  }
  private isSeen(id: string) {
    return isSeenIn(this.seen ?? {}, id);
  }
  private unseen(e: StoryEntry) {
    return e.updates.filter((u) => !this.isSeen(u.id)).length;
  }
  private current() {
    const id = this.open;
    if (id == null) return null;
    const list = this.list;
    const i = list.findIndex((e) => e.id === id);
    return i < 0 ? null : { list, entry: list[i], i };
  }
  private get dialogEl() {
    return this.querySelector<HTMLDialogElement>(".ui-sty__viewer");
  }
  private get bodyEl() {
    return this.querySelector<HTMLElement>(".ui-sty__body");
  }

  /* ---------- Opening and moving ---------- */

  private request(next: StoryOpen) {
    if (!this.emit<StoryOpenChangeEvent>("tc-open-change", { open: next }, { cancelable: true })) return false;
    this.open = next;
    return true;
  }

  private close() {
    if (this.open != null) this.request(null);
  }

  /** Moves to the previous or next entry; nothing past either end */
  private step(dir: 1 | -1) {
    const c = this.current();
    const to = c?.list[c.i + dir];
    if (to) this.request(to.id);
  }

  /** The browser closed the dialog on its own (a repeated Escape): ask, and show it again if it must stay */
  private onNativeClose = () => {
    if (this.modal.ownClose() || this.open == null || this.request(null)) return;
    requestAnimationFrame(() => {
      if (this.current()) this.modal.reopen();
    });
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!changed.has("open") && !changed.has("entries")) return;
    const c = this.current();
    const id = c?.entry.id ?? "";
    if (id === this.shown) {
      // Updates that arrive while the brief is open are new too: marked, and seen
      if (c && changed.has("entries")) this.markSeen(c.entry, c.entry.updates.filter((u) => !this.fresh.has(u.id) && !this.isSeen(u.id)));
      return;
    }
    const wasOpen = !!this.shown;
    this.shown = id;
    if (!c) {
      this.fresh = new Set();
      return;
    }
    this.moved = wasOpen;
    this.lastEntry = id;
    this.fresh = new Set();
    this.markSeen(c.entry, c.entry.updates.filter((u) => !this.isSeen(u.id)));
    this.announce = wasOpen ? `${c.entry.name}, ${this.countLine(c.entry)}` : "";
  }

  /** Keeps these updates' "New" marker while the brief is open, and asks once to add them all to `seen` */
  private markSeen(entry: StoryEntry, updates: StoryUpdate[]) {
    if (!updates.length) return;
    for (const u of updates) this.fresh.add(u.id);
    const seen = withSeen(this.seen ?? new Set<string>(), updates.map((u) => u.id));
    if (this.emit<StorySeenChangeEvent>("tc-seen-change", { seen, entry, updates }, { cancelable: true })) this.seen = seen;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const c = this.current();
    const wasShowing = this.modal.showing;
    this.modal.sync(!!c);
    if (wasShowing && !c) this.restoreFocus();
    if (c && this.moved) {
      this.moved = false;
      // A new entry starts at its top; focus that was on a tile that's gone goes to the content
      const body = this.bodyEl;
      if (body) body.scrollTop = 0;
      const at = document.activeElement;
      if (body && (!at || at === document.body || at === this.dialogEl || !this.dialogEl?.contains(at))) body.focus();
    }
  }

  /** Back to the avatar of the entry last viewed, which may not be the one that opened the brief */
  private restoreFocus() {
    if (!this.lastEntry) return;
    this.querySelector<HTMLElement>(`.ui-sty__person[data-entry="${CSS.escape(this.lastEntry)}"]`)?.focus();
  }

  /* ---------- Input ---------- */

  private onDialogKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
    const tag = (e.target as HTMLElement).localName;
    if (tag === "input" || tag === "textarea" || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      this.step(e.key === "ArrowRight" ? 1 : -1);
    }
  };

  private act(e: Event, entry: StoryEntry, update: StoryLinkUpdate) {
    if (!this.emit<StoryActionEvent>("tc-action", { entry, update }, { cancelable: true })) e.preventDefault();
  }

  private reply(e: SubmitEvent, entry: StoryEntry) {
    e.preventDefault();
    const field = this.querySelector<HTMLInputElement>(".ui-sty__field");
    const text = field?.value.trim() ?? "";
    if (!field || !text) return;
    this.emit<StoryReplyEvent>("tc-reply", { text, entry });
    field.value = "";
  }

  /* ---------- Rendering: the row ---------- */

  private face(entry: { name: string; avatar?: string; id: string }) {
    return entry.avatar
      ? html`<img class="ui-sty__img" src=${ifDefined(safeMediaUrl(entry.avatar))} alt="" draggable="false" />`
      : html`<span class="ui-sty__initials" data-tone=${toneFor(entry.id)} aria-hidden="true">${initials(entry.name)}</span>`;
  }

  private renderRow() {
    const list = this.list;
    if (!list.length && !this.addable) return html`<p class="ui-sty__empty">${this.emptyLabel}</p>`;
    return html`<div class="ui-sty__row" role="toolbar" aria-label=${this.label} @keydown=${this.toolbar.onKeyDown} @focusin=${this.toolbar.onFocusIn}>
      ${this.addable
        ? html`<button type="button" class="ui-sty__person ui-sty__add" @click=${() => this.emit("tc-add", undefined)}>
            <span class="ui-sty__ring"
              ><span class="ui-sty__face">${this.addAvatar ? html`<img class="ui-sty__img" src=${ifDefined(safeMediaUrl(this.addAvatar))} alt="" draggable="false" />` : html`<span class="ui-sty__plus-face">${plusIcon(22)}</span>`}</span
              ><span class="ui-sty__badge">${plusIcon(12)}</span></span
            >
            <span class="ui-sty__label">${this.addLabel}</span>
          </button>`
        : nothing}
      ${repeat(
        list,
        (e) => e.id,
        (e) => {
          const fresh = this.unseen(e);
          return html`<button
            type="button"
            class="ui-sty__person"
            data-entry=${e.id}
            data-kind=${e.kind === "account" ? "account" : "person"}
            data-state=${fresh ? "new" : "seen"}
            aria-haspopup="dialog"
            aria-label=${`${e.name}, ${fresh ? `${fresh} ${this.newLabel}` : this.seenLabel}`}
            @click=${() => this.request(e.id)}
          >
            <span class="ui-sty__ring"><span class="ui-sty__face">${this.face(e)}</span></span>
            <span class="ui-sty__label">${e.name}</span>
          </button>`;
        },
      )}
    </div>`;
  }

  /* ---------- Rendering: the brief ---------- */

  private countLine(entry: StoryEntry) {
    const fresh = entry.updates.filter((u) => this.fresh.has(u.id)).length;
    const line = this.describeCount(fresh, entry.updates.length);
    return entry.since ? `${line} · ${entry.since}` : line;
  }

  private renderViewer() {
    const c = this.current();
    const nameId = `${this.uid}-name`;
    return html`<dialog class="ui-sty__viewer" aria-labelledby=${nameId} @keydown=${this.onDialogKey} @cancel=${(e: Event) => {
        e.preventDefault();
        this.close();
      }} @close=${this.onNativeClose}>
      ${c ? this.renderBrief(c.entry, c.list, c.i, nameId) : nothing}
    </dialog>`;
  }

  private renderBrief(entry: StoryEntry, list: StoryEntry[], i: number, nameId: string) {
    const account = entry.kind === "account";
    // Unseen first, each group in the app's order
    const updates = [...entry.updates.filter((u) => this.fresh.has(u.id)), ...entry.updates.filter((u) => !this.fresh.has(u.id))];
    const sizes = updates.map((u) => (u.size && ["small", "wide", "tall"].includes(u.size) ? u.size : (SIZES[u.kind] ?? "small")));
    // Three columns, or two in a narrower brief (the CSS picks by the brief's width); one column needs no placing
    const wide = packTiles(sizes, 3);
    const narrow = packTiles(sizes, 2);
    const prev = list[i - 1];
    const next = list[i + 1];
    const close = html`<button type="button" class="ui-sty__tool ui-sty__close" aria-label=${this.closeLabel} title=${this.closeLabel} @click=${() => this.close()}>${closeIcon()}</button>`;
    return html`<div class="ui-sty__panel" data-kind=${account ? "account" : "person"}>
      ${cardHead({ picture: this.face(entry), pictureShape: account ? "square" : "round", title: entry.name, subtitle: this.countLine(entry), id: nameId, level: 2, aside: close, keepAside: true })}
      <div class="ui-sty__body" tabindex="-1">
        ${entry.summary
          ? html`<div class="ui-sty__summary">
              ${entry.summaryGenerated ? html`<span class="ui-sty__generated">${sparkIcon()}${this.generatedLabel}</span>` : nothing}
              <p class="ui-sty__summary-text">${entry.summary}</p>
            </div>`
          : nothing}
        <ul class="ui-sty__grid" role="list">
          ${repeat(
            updates,
            (u) => u.id,
            (u, n) => this.renderTile(entry, u, sizes[n], wide[n], narrow[n]),
          )}
        </ul>
      </div>
      <div class="ui-sty__foot">
        ${this.replyable
          ? html`<form class="ui-sty__reply" @submit=${(e: SubmitEvent) => this.reply(e, entry)}>
              <input class="ui-sty__field" type="text" autocomplete="off" aria-label=${`${this.replyLabel} ${entry.name}`} placeholder=${`${this.replyLabel} ${entry.name}`} />
              <button type="submit" class="ui-sty__tool ui-sty__send" aria-label=${this.sendLabel} title=${this.sendLabel}>${sendIcon()}</button>
            </form>`
          : nothing}
        <div class="ui-sty__nav">
          ${this.stepButton("prev", prev, this.previousLabel, prevIcon())}
          <span class="ui-sty__where" aria-hidden="true">${i + 1} / ${list.length}</span>
          ${this.stepButton("next", next, this.nextLabel, nextIcon())}
        </div>
      </div>
      <p class="ui-sty__sr" role="status">${this.announce}</p>
    </div>`;
  }

  /** Previous or Next, with the neighbour's name; at an end it stays in place, unavailable, so focus isn't lost */
  private stepButton(dir: "prev" | "next", to: StoryEntry | undefined, word: string, icon: TemplateResult) {
    return html`<button
      type="button"
      class=${dir === "prev" ? "ui-sty__step ui-sty__prev" : "ui-sty__step ui-sty__next"}
      aria-disabled=${ifDefined(to ? undefined : "true")}
      @click=${() => to && this.request(to.id)}
    >
      ${dir === "prev" ? icon : nothing}
      <span class="ui-sty__step-text"><span class="ui-sty__step-dir">${word}</span>${to ? html` <span class="ui-sty__step-name">${to.name}</span>` : nothing}</span>
      ${dir === "next" ? icon : nothing}
    </button>`;
  }

  private renderTile(entry: StoryEntry, u: StoryUpdate, size: StoryTileSize, wide: Place, narrow: Place) {
    const fresh = this.fresh.has(u.id);
    return html`<li
      class="ui-sty__tile"
      data-kind=${u.kind}
      data-size=${size}
      ?data-new=${fresh}
      style=${`--c3: ${area(wide)}; --r3: ${band(wide)}; --c2: ${area(narrow)}; --r2: ${band(narrow)}`}
    >
      <div class="ui-sty__tile-head">
        <h3 class="ui-sty__tile-title">${u.title}</h3>
        ${fresh ? html`<span class="ui-sty__new">${this.markerLabel}</span>` : nothing}
        ${u.at && u.kind !== "note" ? html`<span class="ui-sty__at">${u.at}</span>` : nothing}
      </div>
      ${this.renderContent(entry, u)}
    </li>`;
  }

  private renderContent(entry: StoryEntry, u: StoryUpdate) {
    switch (u.kind) {
      case "metric":
        return this.renderMetric(u);
      case "status":
        return html`<p class="ui-sty__move">
            ${u.from ? html`<span class="ui-sty__state" data-tone=${toneOf(u.fromTone)} data-from>${u.from}</span><span class="ui-sty__arrow">${arrowIcon(14)}</span><span class="ui-sty__sr"> ${this.toLabel} </span>` : nothing}<span class="ui-sty__state" data-tone=${toneOf(u.toTone)}>${u.to}</span>
          </p>
          ${u.text ? html`<p class="ui-sty__text">${u.text}</p>` : nothing}`;
      case "note":
        return html`<p class="ui-sty__note">${u.text}</p>
          ${u.author || u.at ? html`<p class="ui-sty__byline">${[u.author, u.at].filter(Boolean).join(" · ")}</p>` : nothing}`;
      case "list": {
        const items = u.items ?? [];
        const shown = items.slice(0, LIST_SHOWN);
        const more = Math.max(0, (u.total ?? items.length) - shown.length);
        return html`<ul class="ui-sty__items" role="list">
            ${shown.map((it) => {
              const item = typeof it === "string" ? { label: it } : it;
              return html`<li class="ui-sty__item"><span class="ui-sty__item-label">${item.label}</span>${item.meta ? html`<span class="ui-sty__item-meta">${item.meta}</span>` : nothing}</li>`;
            })}
          </ul>
          ${more ? html`<p class="ui-sty__more">+${more} ${this.moreLabel}</p>` : nothing}`;
      }
      case "image":
        return html`<figure class="ui-sty__figure">
          <img class="ui-sty__photo" src=${ifDefined(safeMediaUrl(u.src))} alt=${u.alt ?? ""} loading="lazy" draggable="false" />
          ${u.caption ? html`<figcaption class="ui-sty__caption">${u.caption}</figcaption>` : nothing}
        </figure>`;
      case "link":
        return html`${u.text ? html`<p class="ui-sty__text">${u.text}</p>` : nothing}
          ${safeUrl(u.href)
            ? html`<a class="ui-sty__action" href=${ifDefined(safeUrl(u.href))} @click=${(e: Event) => this.act(e, entry, u)}>${u.label}${arrowIcon(14)}</a>`
            : html`<button type="button" class="ui-sty__action" @click=${(e: Event) => this.act(e, entry, u)}>${u.label}${arrowIcon(14)}</button>`}`;
      default:
        return nothing;
    }
  }

  private renderMetric(u: StoryMetricUpdate) {
    const d = u.delta;
    const has = typeof d === "number" && !Number.isNaN(d);
    const tone = !has || d === 0 || u.neutral ? "neutral" : d > 0 !== !!u.lowerIsBetter ? "good" : "bad";
    const value = typeof u.value === "number" ? u.value.toLocaleString("en-US") : u.value;
    return html`<p class="ui-sty__value">${value}</p>
      ${has || u.context
        ? html`<p class="ui-sty__change">
            ${has
              ? html`<span class="ui-sty__delta" data-tone=${tone}>${d > 0 ? upIcon() : d < 0 ? downIcon() : nothing}${signed(d, u.deltaUnit)}${tone === "neutral"
                    ? nothing
                    : html`<span class="ui-sty__sr">, ${tone === "good" ? this.betterLabel : this.worseLabel}</span>`}</span>`
              : nothing}
            ${u.context ? html`<span class="ui-sty__context">${u.context}</span>` : nothing}
          </p>`
        : nothing}
      ${u.trend && u.trend.length > 1 ? this.sparkline(u.trend, tone) : nothing}`;
  }

  private sparkline(values: number[], tone: string) {
    const nums = values.filter((v) => Number.isFinite(v));
    if (nums.length < 2) return nothing;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const span = max - min || 1;
    const pts = nums.map((v, i) => `${((i / (nums.length - 1)) * 100).toFixed(2)},${(28 - ((v - min) / span) * 24).toFixed(2)}`);
    return html`<svg class="ui-sty__spark" data-tone=${tone} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      ${svg`<path class="ui-sty__spark-area" d=${`M0,32 L${pts.join(" L")} L100,32 Z`}></path><polyline class="ui-sty__spark-line" points=${pts.join(" ")}></polyline>`}
    </svg>`;
  }

  protected override render() {
    return html`${this.renderRow()}${this.renderViewer()}`;
  }

  static override css = /* css */ `
[data-ui="sty"] {
  --tc-story-size: var(--tc-space-14);
  --tc-story-ring-width: calc(var(--tc-space-0-5) + var(--tc-hairline));
  --tc-story-account-radius: var(--tc-radius-2xl);
  min-width: 0;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
}
[data-ui="sty"] .ui-sty__icon { display: block; flex: none; }
.ui-sty__row { display: flex; gap: var(--tc-space-3); margin: 0; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-2); overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x proximity; scroll-padding-inline: var(--tc-space-1); scrollbar-width: thin; }
.ui-sty__empty { margin: 0; padding: var(--tc-space-3) var(--tc-space-1); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
.ui-sty__person { position: relative; flex: none; display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-1-5); width: calc(var(--tc-story-size) + var(--tc-space-4)); margin: 0; padding: 0; border: 0; background: none; color: inherit; font: inherit; cursor: pointer; scroll-snap-align: start; -webkit-tap-highlight-color: transparent; }
.ui-sty__person:focus-visible { outline: none; }
.ui-sty__person:focus-visible .ui-sty__ring { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-sty__ring { position: relative; display: block; box-sizing: border-box; width: var(--tc-story-size); height: var(--tc-story-size); padding: var(--tc-story-ring-width); border-radius: 50%; background: var(--tc-story-ring, conic-gradient(from 210deg, var(--tc-tone-amber-solid), var(--tc-tone-rose-solid), var(--tc-tone-pink-solid), var(--tc-tone-violet-solid), var(--tc-tone-amber-solid))); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sty__person[data-state="seen"] .ui-sty__ring { padding: calc(var(--tc-story-ring-width) / 2); background: var(--tc-story-ring-seen, var(--tc-border-strong)); }
.ui-sty__person:active .ui-sty__ring { transform: scale(0.95); }
.ui-sty__face { display: block; box-sizing: border-box; width: 100%; height: 100%; padding: var(--tc-space-0-5); border-radius: 50%; background: var(--tc-story-gap, var(--tc-surface-base)); overflow: hidden; }
.ui-sty__person[data-state="seen"] .ui-sty__face { padding: calc(var(--tc-space-0-5) + var(--tc-story-ring-width) / 2); }
.ui-sty__img { display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.ui-sty__initials { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-none); }
/* An account is square: the ring, the gap and the picture follow one radius */
.ui-sty__person[data-kind="account"] .ui-sty__ring { border-radius: var(--tc-story-account-radius); }
.ui-sty__person[data-kind="account"] .ui-sty__face { border-radius: calc(var(--tc-story-account-radius) - var(--tc-story-ring-width)); }
.ui-sty__person[data-kind="account"] :is(.ui-sty__img, .ui-sty__initials) { border-radius: calc(var(--tc-story-account-radius) - var(--tc-story-ring-width) - var(--tc-space-0-5)); }
.ui-sty__initials[data-tone="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-sty__initials[data-tone="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-sty__initials[data-tone="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-sty__initials[data-tone="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
.ui-sty__initials[data-tone="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-sty__add .ui-sty__ring { padding: calc(var(--tc-story-ring-width) / 2); background: var(--tc-border-default); }
.ui-sty__plus-face { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-sty__badge { position: absolute; right: 0; bottom: 0; display: grid; place-items: center; width: var(--tc-space-5); height: var(--tc-space-5); border-radius: 50%; background: var(--tc-accent-solid); color: var(--tc-text-on-accent); box-shadow: 0 0 0 var(--tc-space-0-5) var(--tc-story-gap, var(--tc-surface-base)); }
.ui-sty__label { display: block; max-width: 100%; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.ui-sty__person[data-state="seen"] .ui-sty__label { color: var(--tc-text-muted); }

/* The brief: a modal panel – the header, the scrolling content, the foot */
.ui-sty__viewer { box-sizing: border-box; width: min(var(--tc-story-brief-width, 760px), calc(100vw - 2 * var(--tc-space-4))); max-width: none; max-height: calc(100dvh - 2 * var(--tc-space-4)); margin: auto; padding: 0; overflow: hidden; border: 0; color: var(--tc-text-primary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; -webkit-font-smoothing: antialiased; }
.ui-sty__viewer[open] { display: flex; flex-direction: column; animation: ui-sty-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-sty__viewer:not([open]) { display: none; }
.ui-sty__viewer::backdrop { background: var(--tc-scrim); }
@keyframes ui-sty-pop { from { opacity: 0; transform: translateY(var(--tc-space-2)) scale(0.985); } }
.ui-sty__viewer *, .ui-sty__viewer *::before, .ui-sty__viewer *::after { box-sizing: border-box; }
:where(.ui-sty__viewer) :is(h2, h3, p, ul, figure) { margin: 0; padding: 0; }
:where(.ui-sty__viewer) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-sty__viewer :is(button, a, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-sty__panel { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }
.ui-sty__tool { display: grid; place-items: center; flex: none; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sty__tool:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-sty__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; container-type: inline-size; scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong) transparent; }
/* The content takes focus on opening (so arrows scroll it) but isn't a tab stop: no ring around the whole brief */
.ui-sty__viewer .ui-sty__body:focus { outline: none; }

/* The summary: one sentence above the tiles */
.ui-sty__summary { display: grid; gap: var(--tc-space-1-5); max-width: 68ch; }
.ui-sty__summary-text { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); text-wrap: pretty; }
.ui-sty__generated { display: inline-flex; align-items: center; gap: var(--tc-space-1); justify-self: start; color: var(--tc-accent-text); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }

/* The bento: three columns, each tile where packTiles() put it (--c3 / --r3); two columns (--c2 / --r2) in a
   narrower brief, one on a phone */
.ui-sty__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-2); list-style: none; }
.ui-sty__tile { display: flex; flex-direction: column; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); border-radius: var(--tc-card-radius); grid-column: var(--c3); grid-row: var(--r3); }
@container (max-width: 540px) {
  .ui-sty__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-sty__tile { grid-column: var(--c2); grid-row: var(--r2); }
}
@container (max-width: 400px) {
  .ui-sty__grid { grid-template-columns: minmax(0, 1fr); }
  .ui-sty__tile { grid-column: auto; grid-row: auto; }
}
.ui-sty__tile-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: var(--tc-pill-h); }
.ui-sty__tile-title { flex: 1 1 auto; min-width: 0; color: var(--tc-caption-color); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); overflow-wrap: anywhere; }
.ui-sty__new { flex: none; display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); white-space: nowrap; }
.ui-sty__at { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-sty__text { color: var(--tc-text-secondary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); overflow-wrap: anywhere; }

/* Metric: the value, the change, the trend */
.ui-sty__value { color: var(--tc-text-strong); font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.ui-sty__change { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-sty__delta { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--tc-text-secondary); }
.ui-sty__delta[data-tone="good"] { color: var(--tc-status-success-fg); }
.ui-sty__delta[data-tone="bad"] { color: var(--tc-status-danger-fg); }
.ui-sty__context { color: var(--tc-text-muted); }
.ui-sty__spark { display: block; width: 100%; height: var(--tc-space-8); margin-top: auto; overflow: visible; }
.ui-sty__spark-line { fill: none; stroke: var(--tc-chart-neutral); stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ui-sty__spark-area { fill: var(--tc-chart-neutral); opacity: 0.1; }
.ui-sty__spark[data-tone="good"] .ui-sty__spark-line { stroke: var(--tc-status-success-solid); }
.ui-sty__spark[data-tone="good"] .ui-sty__spark-area { fill: var(--tc-status-success-solid); }
.ui-sty__spark[data-tone="bad"] .ui-sty__spark-line { stroke: var(--tc-status-danger-solid); }
.ui-sty__spark[data-tone="bad"] .ui-sty__spark-area { fill: var(--tc-status-danger-solid); }

/* Status: from → to */
.ui-sty__move { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-sty__state { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); white-space: nowrap; }
.ui-sty__state::before { content: ""; flex: none; width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-radius: 50%; background: currentColor; }
.ui-sty__state[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-sty__state[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-sty__state[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-sty__state[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The state it left is quieter than the one it's in */
.ui-sty__state[data-from] { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-muted); }
.ui-sty__arrow { color: var(--tc-icon-muted); }

/* Note: the text, then who wrote it */
.ui-sty__note { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); overflow-wrap: anywhere; text-wrap: pretty; }
.ui-sty__byline { margin-top: auto; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }

/* List: the first few, then +N more */
.ui-sty__items { display: grid; list-style: none; }
.ui-sty__item { display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-1-5) 0; border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-tight); }
.ui-sty__item:first-child { border-top: 0; padding-top: 0; }
.ui-sty__item-label { flex: 1 1 auto; min-width: 0; overflow: hidden; color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-sty__item-meta { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-sty__more { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }

/* Image: the picture fills the tile's width */
.ui-sty__figure { display: grid; gap: var(--tc-space-2); }
.ui-sty__photo { display: block; width: 100%; aspect-ratio: 16 / 9; max-height: calc(var(--tc-space-16) * 3.5); border-radius: var(--tc-radius-md); object-fit: cover; background: var(--tc-fill-subtle); }
.ui-sty__caption { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }

/* Link or action: a secondary button at the tile's foot */
.ui-sty__action { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); align-self: flex-start; height: var(--tc-control-h-md); margin-top: auto; padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-none); text-decoration: none; white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sty__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }

/* The foot: the reply field, then Previous, where you are, Next */
.ui-sty__foot { display: grid; gap: var(--tc-space-2); }
.ui-sty__reply { display: flex; align-items: center; gap: var(--tc-space-1); margin: 0; padding: 0 var(--tc-space-1) 0 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sty__reply:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-sty__reply:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-sty__field { flex: 1 1 auto; min-width: 0; height: var(--tc-field-h); padding: 0 var(--tc-field-px); border: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-sty__viewer .ui-sty__field:focus-visible { outline: none; }
.ui-sty__field::placeholder { color: var(--tc-text-placeholder); }
.ui-sty__nav { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-sty__where { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-sty__step { display: flex; flex: 1 1 0; align-items: center; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-control-radius-md); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sty__next { justify-content: flex-end; text-align: right; }
.ui-sty__step:not([aria-disabled]):hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-sty__step[aria-disabled] { color: var(--tc-text-disabled); cursor: default; }
.ui-sty__step-text { display: grid; min-width: 0; }
.ui-sty__step-dir { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
.ui-sty__step[aria-disabled] .ui-sty__step-dir { color: var(--tc-text-disabled); }
.ui-sty__step-name { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); text-overflow: ellipsis; white-space: nowrap; }
.ui-sty__sr { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }

/* Standard: the header, summary and foot on the gray tray; each new tile a white card on it, a seen tile a hairline */
:where([data-look="standard"], [data-look="standard"] *) .ui-sty__viewer { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); box-shadow: var(--tc-shadow-overlay); }
:where([data-look="standard"], [data-look="standard"] *) .ui-sty__body { display: grid; gap: var(--tc-space-3); padding: 0 0 var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *) .ui-sty__summary { padding: var(--tc-space-1) var(--tc-space-2-5) var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *) .ui-sty__tile[data-new] { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *) .ui-sty__tile:not([data-new]) { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *) .ui-sty__foot { padding: var(--tc-space-2) var(--tc-space-0-5) var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *) .ui-sty__value { font-weight: var(--tc-font-weight-semibold); }

/* A seen tile is quieter in both looks: its value and note in secondary ink */
.ui-sty__tile:not([data-new]) :is(.ui-sty__value, .ui-sty__note) { color: var(--tc-text-secondary); }

/* Clean: one white surface; hairline-framed tiles, a fainter frame once seen; a hairline over the foot */
:where([data-look="clean"], [data-look="clean"] *) .ui-sty__viewer { border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); font-weight: var(--tc-font-weight-regular); }
:where([data-look="clean"], [data-look="clean"] *) .ui-sty__body { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-1) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *) .ui-sty__tile { border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *) .ui-sty__tile:not([data-new]) { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
:where([data-look="clean"], [data-look="clean"] *) .ui-sty__foot { padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *) .ui-sty__tile-title { font-weight: var(--tc-font-weight-regular); }
:where([data-look="clean"], [data-look="clean"] *) .ui-sty__value { font-size: var(--tc-font-size-2xl); }

/* A narrow brief: tighter tiles */
@container (max-width: 400px) {
  .ui-sty__tile { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5); }
}

/* Clean: a thinner ring, quieter names and thinner icons */
[data-ui="sty"][data-look="clean"] { --tc-story-ring-width: calc(var(--tc-space-0-5) + var(--tc-hairline) / 2); }
[data-ui="sty"][data-look="clean"] .ui-sty__label { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
[data-ui="sty"][data-look="clean"] .ui-sty__icon { stroke-width: 1.75; }

@media (prefers-reduced-motion: reduce) {
  .ui-sty__viewer[open] { animation: none; }
  .ui-sty__ring, .ui-sty__tool, .ui-sty__step, .ui-sty__action, .ui-sty__reply { transition: none; }
  .ui-sty__person:active .ui-sty__ring { transform: none; }
}

/* Forced colours drop the gradient: new is a thick Highlight ring, seen a thin GrayText one; tiles keep a frame */
@media (forced-colors: active) {
  .ui-sty__ring { forced-color-adjust: none; background: Canvas; outline: calc(var(--tc-story-ring-width) - 1px) solid Highlight; outline-offset: -1px; }
  .ui-sty__person[data-state="seen"] .ui-sty__ring { outline: 1px solid GrayText; }
  .ui-sty__tile { border: 1px solid CanvasText; }
  .ui-sty__tile:not([data-new]) { border-color: GrayText; }
  .ui-sty__new, .ui-sty__state { border: 1px solid CanvasText; }
  .ui-sty__spark-line { stroke: CanvasText; }
}
`;
}

if (!customElements.get("tc-stories")) customElements.define("tc-stories", TcStories);
declare global {
  interface HTMLElementTagNameMap {
    "tc-stories": TcStories;
  }
}
