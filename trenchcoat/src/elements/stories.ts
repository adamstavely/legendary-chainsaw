import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { ToolbarController } from "./internal/controllers";
import { initials } from "./internal/util";

/*
 * <tc-stories> – a row of story avatars, and the viewer they open. A gradient ring (--tc-story-ring) means a person
 * has something new, a quiet gray ring that everything has been seen; an optional "add" tile comes first. Activating
 * an avatar opens a modal viewer on that person's first unseen item: segmented progress bars across the top, the
 * person, the time and Pause / Close in the header, and the item itself – an image, a video (muted, with a mute
 * toggle) or a text card on a gradient. Items advance on their own (per-item duration; a video runs its own length),
 * pause while held or while focus is in the reply field, and move on to the next person at the end; after the last,
 * the viewer closes. The app owns what's been seen (`seen`, cancelable tc-seen-change) and may own what's open (`open`,
 * cancelable tc-open-change).
 *   · the row is a toolbar: one tab stop, ← → Home End move between avatars, Enter / Space opens
 *   · the viewer is a modal dialog named by the person: Tab stays inside, ← → step, Escape closes and focus returns to
 *     the avatar of the person last viewed; tap or click the left or right third to step; swipe down closes on touch
 *   · reduced motion: nothing advances on its own – the bars show where you are and move only when you step
 * Standard: 56 px avatars with a 3 px ring and secondary-ink names. Clean: a thinner ring and quieter names. The viewer
 * is the same dark stage in both; its corners follow the look's card radius.
 *
 *   <tc-stories .people=${people} .seen=${seen} @tc-seen-change=${…}></tc-stories>
 */

export type StoryKind = "image" | "video" | "text";
/** The gradient behind a text card: --tc-story-card-<tone> */
export type StoryTone = "violet" | "pink" | "amber" | "rose" | "teal" | "blue";
/** One story item */
export type StoryItem = {
  id: string;
  kind: StoryKind;
  /** Image or video URL */
  src?: string;
  /** The text card's text; for an image or video, its text alternative */
  text?: string;
  /** How long it shows, in milliseconds (default: the element's `duration`); a video runs its own length */
  duration?: number;
  /** When it was posted, shown as given ("2h", "09:41") */
  at?: string;
  /** A text card's background (default "violet") */
  tone?: StoryTone;
};
/** A person and their items, oldest first */
export type StoryPerson = { id: string; name: string; avatar?: string; items: StoryItem[] };
/** What the viewer shows: a person's id and an item's id, or null when it's closed */
export type StoryOpen = { person: string; item: string } | null;
/** The item ids that have been seen: a Set, or a record of id → true */
export type StorySeen = ReadonlySet<string> | Readonly<Record<string, boolean>>;
export type StoryOpenChangeEvent = { open: StoryOpen };
export type StorySeenChangeEvent = { seen: StorySeen; person: StoryPerson; item: StoryItem };
export type StoryReplyEvent = { text: string; person: StoryPerson; item: StoryItem };

const TONES: StoryTone[] = ["violet", "pink", "amber", "rose", "teal", "blue"];
const AVATAR_TONES = ["violet", "pink", "amber", "rose", "teal"];
/** A tap is a press shorter than this, that moved less than TAP_SLOP */
const TAP_MS = 250;
const TAP_SLOP = 10;
/** A downward drag this long closes the viewer on touch */
const SWIPE_CLOSE = 80;
let uidCount = 0;

const isSeenIn = (seen: StorySeen, id: string) => (seen instanceof Set ? seen.has(id) : !!(seen as Record<string, boolean>)[id]);
const withSeen = (seen: StorySeen, id: string): StorySeen => (seen instanceof Set ? new Set([...seen, id]) : { ...(seen as Record<string, boolean>), [id]: true });
const toneFor = (id: string) => AVATAR_TONES[[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATAR_TONES.length];

/* Plus, pause, play, x, volume-2, volume-x, chevron-left, chevron-right, send: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const plusIcon = (s: number) => lucide(s, svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const pauseIcon = () => lucide(18, svg`<rect x="14" y="4" width="4" height="16" rx="1"></rect><rect x="6" y="4" width="4" height="16" rx="1"></rect>`);
const playIcon = () => lucide(18, svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`);
const closeIcon = () => lucide(20, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const soundIcon = () => lucide(18, svg`<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path><path d="M16 9a5 5 0 0 1 0 6"></path><path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path>`);
const mutedIcon = () => lucide(18, svg`<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path><line x1="22" x2="16" y1="9" y2="15"></line><line x1="16" x2="22" y1="9" y2="15"></line>`);
const prevIcon = () => lucide(18, svg`<path d="m15 18-6-6 6-6"></path>`);
const nextIcon = () => lucide(18, svg`<path d="m9 18 6-6-6-6"></path>`);
const sendIcon = () => lucide(18, svg`<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path>`);

/**
 * A row of story avatars – a gradient ring for something new, a gray ring once seen – and the modal viewer they open,
 * with progress bars, auto-advance, tap and arrow-key stepping, and swipe down to close.
 * @tag tc-stories
 * @fires tc-open-change - The viewer is opening, stepping or closing ({ open }: StoryOpenChangeEvent – the next `open`, or null); cancelable – prevented, `open` stays as it was
 * @fires tc-seen-change - An unseen item was shown ({ seen, person, item }: StorySeenChangeEvent – `seen` with the item added, in the same shape); cancelable – prevented, `seen` stays as it was
 * @fires tc-reply - A reply was sent from the viewer ({ text, person, item }: StoryReplyEvent)
 * @fires tc-add - The "add" tile was activated (no detail)
 */
export class TcStories extends TcElement {
  static override ui = "sty";

  /** The people with stories, in the order the row shows them; people with no items are left out */
  @property({ attribute: false }) accessor people: StoryPerson[] = [];
  /** The item ids that have been seen, as a Set or a record of id → true; the app owns it */
  @property({ attribute: false }) accessor seen: StorySeen = new Set<string>();
  /** What the viewer shows ({ person, item } ids), or null when it's closed */
  @property({ attribute: false }) accessor open: StoryOpen = null;
  /** Show the "add" tile first in the row */
  @property({ type: Boolean, reflect: true }) accessor addable = false;
  /** The "add" tile's text */
  @property({ attribute: "add-label" }) accessor addLabel = "Add story";
  /** An image for the "add" tile (the person's own avatar); without one it shows a plus */
  @property({ attribute: "add-avatar" }) accessor addAvatar = "";
  /** Show a reply field at the foot of the viewer; sending fires tc-reply */
  @property({ type: Boolean, reflect: true }) accessor replyable = false;
  /** How long an image or text card shows, in milliseconds, unless the item sets its own */
  @property({ type: Number }) accessor duration = 5000;
  /** Advance on its own; off (or with reduced motion) items change only when the person steps */
  @property({ type: Boolean }) accessor autoplay = true;
  /** Whether videos start muted; the viewer's mute toggle changes it */
  @property({ type: Boolean }) accessor muted = true;
  /** The row's accessible name */
  @property() accessor label = "Stories";
  /** Said after a person's name when they have something new ("Maya Chen, 2 new") */
  @property({ attribute: "new-label" }) accessor newLabel = "new";
  /** Said after a person's name when everything's been seen ("Maya Chen, seen") */
  @property({ attribute: "seen-label" }) accessor seenLabel = "seen";
  /** Shown when there are no stories and no "add" tile */
  @property({ attribute: "empty-label" }) accessor emptyLabel = "No stories yet.";
  /** The reply field's placeholder and name, before the person's name ("Reply to Maya Chen") */
  @property({ attribute: "reply-label" }) accessor replyLabel = "Reply to";
  /** The send button's name */
  @property({ attribute: "send-label" }) accessor sendLabel = "Send";
  /** The close button's name */
  @property({ attribute: "close-label" }) accessor closeLabel = "Close";
  /** The pause button's name */
  @property({ attribute: "pause-label" }) accessor pauseLabel = "Pause";
  /** The play button's name */
  @property({ attribute: "play-label" }) accessor playLabel = "Play";
  /** The mute button's name */
  @property({ attribute: "mute-label" }) accessor muteLabel = "Mute";
  /** The unmute button's name */
  @property({ attribute: "unmute-label" }) accessor unmuteLabel = "Unmute";
  /** The previous-item button's name */
  @property({ attribute: "previous-label" }) accessor previousLabel = "Previous";
  /** The next-item button's name */
  @property({ attribute: "next-label" }) accessor nextLabel = "Next";

  /** @internal Playing (not paused with the Pause button) */
  @state() accessor playing = true;
  /** @internal Held: a pointer is down on the stage */
  @state() accessor held = false;
  /** @internal Focus is in the reply field */
  @state() accessor replying = false;
  /** @internal prefers-reduced-motion */
  @state() accessor reduced = false;
  /** @internal The polite announcement ("2 of 5") */
  @state() accessor announce = "";

  private readonly uid = `tc-stories-${++uidCount}`;
  private readonly toolbar = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-sty__row > .ui-sty__person")] });
  private mq?: MediaQueryList;
  private frame = 0;
  private lastFrame = 0;
  private elapsed = 0;
  /** An automatic step was asked for and hasn't landed (a controlled `open` the app hasn't changed yet) */
  private waiting = false;
  private shownKey = "";
  private lastPerson = "";
  private opener: HTMLElement | null = null;
  private press: { id: number; x: number; y: number; t: number; touch: boolean } | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    this.reduced = !!this.mq?.matches;
    this.mq?.addEventListener?.("change", this.onMotion);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mq?.removeEventListener?.("change", this.onMotion);
    this.stopLoop();
    const d = this.dialogEl;
    if (d?.open) d.close();
  }

  private onMotion = () => (this.reduced = !!this.mq?.matches);

  /* ---------- The model ---------- */

  private get list() {
    return (this.people ?? []).filter((p) => p.items?.length);
  }
  private isSeen(id: string) {
    return isSeenIn(this.seen ?? {}, id);
  }
  private unseen(p: StoryPerson) {
    return p.items.filter((i) => !this.isSeen(i.id)).length;
  }
  /** Where a person's stories start: their first unseen item, else the first */
  private startItem(p: StoryPerson) {
    return p.items.find((i) => !this.isSeen(i.id)) ?? p.items[0];
  }
  /** Advancing on its own: autoplay is on and reduced motion is off */
  private get auto() {
    return this.autoplay && !this.reduced;
  }
  private current() {
    const open = this.open;
    if (!open) return null;
    const people = this.list;
    const pi = people.findIndex((p) => p.id === open.person);
    if (pi < 0) return null;
    const person = people[pi];
    const found = person.items.findIndex((i) => i.id === open.item);
    const ii = found < 0 ? 0 : found;
    return { people, person, pi, item: person.items[ii], ii };
  }
  private get dialogEl() {
    return this.querySelector<HTMLDialogElement>(".ui-sty__viewer");
  }
  private get videoEl() {
    return this.querySelector<HTMLVideoElement>(".ui-sty__video");
  }

  /* ---------- Opening and stepping ---------- */

  private request(next: StoryOpen) {
    if (!this.emit<StoryOpenChangeEvent>("tc-open-change", { open: next }, { cancelable: true })) return false;
    this.open = next;
    return true;
  }

  private go(person: StoryPerson, item: StoryItem) {
    this.request({ person: person.id, item: item.id });
  }

  private openPerson(p: StoryPerson, opener: HTMLElement) {
    this.opener = opener;
    this.go(p, this.startItem(p));
  }

  private close() {
    if (this.open) this.request(null);
  }

  /** Steps one item forward or back, across people; forward from the very last item closes */
  private step(dir: 1 | -1) {
    const c = this.current();
    if (!c) return;
    const { people, person, pi, ii } = c;
    if (dir > 0) {
      if (ii < person.items.length - 1) this.go(person, person.items[ii + 1]);
      else if (pi < people.length - 1) this.go(people[pi + 1], this.startItem(people[pi + 1]));
      else this.close();
    } else if (ii > 0) this.go(person, person.items[ii - 1]);
    else if (pi > 0) this.go(people[pi - 1], people[pi - 1].items[people[pi - 1].items.length - 1]);
    else {
      // The very first item: start it again
      this.elapsed = 0;
      const v = this.videoEl;
      if (v) v.currentTime = 0;
      this.paint();
    }
  }

  /** An automatic step: once, until `open` changes */
  private advance() {
    if (this.waiting) return;
    this.waiting = true;
    this.stopLoop();
    this.step(1);
  }

  /* ---------- The clock: animation-frame timestamps, never a clock read ---------- */

  private get running() {
    return !!this.open && this.auto && this.playing && !this.held && !this.replying && !this.waiting && !!this.dialogEl?.open;
  }

  private syncLoop() {
    if (this.running && !this.frame) this.frame = requestAnimationFrame(this.tick);
    else if (!this.running) this.stopLoop();
  }

  private stopLoop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lastFrame = 0;
  }

  private tick = (t: number) => {
    this.frame = 0;
    if (!this.running) return;
    if (this.lastFrame) this.elapsed += t - this.lastFrame;
    this.lastFrame = t;
    const fraction = this.fraction();
    this.paint(fraction);
    const v = this.videoEl;
    // A video with a known length ends through its `ended` event; everything else when its time is up
    if (fraction >= 1 && !(v && Number.isFinite(v.duration))) {
      this.advance();
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private fraction() {
    const c = this.current();
    if (!c) return 0;
    const v = this.videoEl;
    if (v && Number.isFinite(v.duration) && v.duration > 0) return Math.min(1, v.currentTime / v.duration);
    return Math.min(1, this.elapsed / Math.max(1, c.item.duration ?? this.duration));
  }

  /** Sets the current bar's fill without a render */
  private paint(fraction = this.auto ? this.fraction() : 1) {
    this.querySelector<HTMLElement>(".ui-sty__bar[data-current] .ui-sty__fill")?.style.setProperty("--p", String(fraction));
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!changed.has("open") && !changed.has("people")) return;
    const c = this.current();
    const key = c ? `${c.person.id}\u0000${c.item.id}` : "";
    if (key === this.shownKey) return;
    const wasOpen = !!this.shownKey;
    const samePerson = c && this.shownKey.startsWith(`${c.person.id}\u0000`);
    this.shownKey = key;
    this.elapsed = 0;
    this.lastFrame = 0;
    this.waiting = false;
    if (!c) return;
    if (!wasOpen) {
      this.playing = this.auto;
      this.held = false;
      this.replying = false;
    }
    this.lastPerson = c.person.id;
    const where = `${c.ii + 1} of ${c.person.items.length}`;
    this.announce = samePerson ? where : `${c.person.name}, ${where}`;
    if (!this.isSeen(c.item.id)) {
      const seen = withSeen(this.seen ?? new Set<string>(), c.item.id);
      if (this.emit<StorySeenChangeEvent>("tc-seen-change", { seen, person: c.person, item: c.item }, { cancelable: true })) this.seen = seen;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const d = this.dialogEl;
    const c = this.current();
    if (d && this.isConnected) {
      if (c && !d.open) {
        if (!this.opener) this.opener = document.activeElement as HTMLElement | null;
        if (typeof d.showModal === "function") d.showModal();
        else d.setAttribute("open", "");
        this.querySelector<HTMLElement>(".ui-sty__play, .ui-sty__close")?.focus();
      } else if (!c && d.open) {
        if (typeof d.close === "function") d.close();
        else d.removeAttribute("open");
        this.restoreFocus();
      }
    }
    const v = this.videoEl;
    if (v) {
      v.muted = this.muted;
      if (c && this.playing && !this.held && !this.replying) void v.play?.()?.catch?.(() => {});
      else v.pause?.();
    }
    this.paint();
    this.syncLoop();
  }

  private restoreFocus() {
    const target =
      (this.lastPerson && this.querySelector<HTMLElement>(`.ui-sty__person[data-person="${CSS.escape(this.lastPerson)}"]`)) ||
      (this.opener?.isConnected ? this.opener : null) ||
      this.querySelector<HTMLElement>(".ui-sty__person");
    this.opener = null;
    target?.focus();
  }

  /* ---------- The viewer's input ---------- */

  private onDialogKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
    const inField = (e.target as HTMLElement).localName === "input";
    if (!inField && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      this.step(e.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (e.key !== "Tab") return;
    // Tab and Shift+Tab stay inside the viewer
    const items = [...(this.dialogEl?.querySelectorAll<HTMLElement>("button, input") ?? [])].filter((el) => !(el as HTMLButtonElement).disabled);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || !this.dialogEl?.contains(at))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && at === last) {
      e.preventDefault();
      first.focus();
    }
  };

  private onDown = (e: PointerEvent) => {
    if (e.button > 0) return;
    this.press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, touch: e.pointerType === "touch" };
    this.held = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* a synthetic pointer can't be captured */
    }
  };

  private onMove = (e: PointerEvent) => {
    const p = this.press;
    if (!p || !p.touch || p.id !== e.pointerId) return;
    const dy = Math.max(0, e.clientY - p.y);
    this.querySelector<HTMLElement>(".ui-sty__stage")?.style.setProperty("--dy", `${dy}px`);
  };

  private onUp = (e: PointerEvent) => {
    const p = this.press;
    this.press = null;
    this.held = false;
    this.querySelector<HTMLElement>(".ui-sty__stage")?.style.removeProperty("--dy");
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (p.touch && dy > SWIPE_CLOSE && dy > Math.abs(dx)) {
      this.close();
      return;
    }
    if (e.timeStamp - p.t > TAP_MS || Math.hypot(dx, dy) > TAP_SLOP) return;
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - box.left) / Math.max(1, box.width);
    if (x < 1 / 3) this.step(-1);
    else if (x > 2 / 3) this.step(1);
  };

  private onCancelPress = () => {
    this.press = null;
    this.held = false;
    this.querySelector<HTMLElement>(".ui-sty__stage")?.style.removeProperty("--dy");
  };

  private reply(e: SubmitEvent) {
    e.preventDefault();
    const c = this.current();
    const field = this.querySelector<HTMLInputElement>(".ui-sty__field");
    const text = field?.value.trim() ?? "";
    if (!c || !field || !text) return;
    this.emit<StoryReplyEvent>("tc-reply", { text, person: c.person, item: c.item });
    field.value = "";
  }

  /* ---------- Rendering ---------- */

  private face(name: string, avatar: string | undefined, id: string) {
    return avatar
      ? html`<img class="ui-sty__img" src=${avatar} alt="" draggable="false" />`
      : html`<span class="ui-sty__initials" data-tone=${toneFor(id)} aria-hidden="true">${initials(name)}</span>`;
  }

  private renderRow() {
    const people = this.list;
    if (!people.length && !this.addable) return html`<p class="ui-sty__empty">${this.emptyLabel}</p>`;
    return html`<div class="ui-sty__row" role="toolbar" aria-label=${this.label} @keydown=${this.toolbar.onKeyDown} @focusin=${this.toolbar.onFocusIn}>
      ${this.addable
        ? html`<button type="button" class="ui-sty__person ui-sty__add" @click=${() => this.emit("tc-add", undefined)}>
            <span class="ui-sty__ring"
              ><span class="ui-sty__face">${this.addAvatar ? html`<img class="ui-sty__img" src=${this.addAvatar} alt="" draggable="false" />` : html`<span class="ui-sty__plus-face">${plusIcon(22)}</span>`}</span
              ><span class="ui-sty__badge">${plusIcon(12)}</span></span
            >
            <span class="ui-sty__label">${this.addLabel}</span>
          </button>`
        : nothing}
      ${repeat(
        people,
        (p) => p.id,
        (p) => {
          const fresh = this.unseen(p);
          return html`<button
            type="button"
            class="ui-sty__person"
            data-person=${p.id}
            data-state=${fresh ? "new" : "seen"}
            aria-haspopup="dialog"
            aria-label=${`${p.name}, ${fresh ? `${fresh} ${this.newLabel}` : this.seenLabel}`}
            @click=${(e: Event) => this.openPerson(p, e.currentTarget as HTMLElement)}
          >
            <span class="ui-sty__ring"><span class="ui-sty__face">${this.face(p.name, p.avatar, p.id)}</span></span>
            <span class="ui-sty__label">${p.name}</span>
          </button>`;
        },
      )}
    </div>`;
  }

  private renderItem(item: StoryItem) {
    if (item.kind === "image")
      return html`<img class="ui-sty__photo" src=${ifDefined(item.src)} alt=${item.text ?? ""} draggable="false" />`;
    if (item.kind === "video")
      return html`<video
        class="ui-sty__video"
        src=${ifDefined(item.src)}
        aria-label=${ifDefined(item.text)}
        playsinline
        preload="auto"
        .muted=${this.muted}
        @ended=${() => {
          if (this.auto) this.advance();
        }}
        @loadedmetadata=${() => this.paint()}
      ></video>`;
    const tone = TONES.includes(item.tone as StoryTone) ? item.tone : "violet";
    return html`<div class="ui-sty__card" data-tone=${ifDefined(tone)}><p class="ui-sty__card-text">${item.text ?? ""}</p></div>`;
  }

  private renderViewer() {
    const c = this.current();
    const nameId = `${this.uid}-name`;
    return html`<dialog
      class="ui-sty__viewer"
      aria-labelledby=${nameId}
      @keydown=${this.onDialogKey}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.close();
      }}
      @close=${() => {
        if (this.open) this.close();
      }}
    >
      ${c ? this.renderStage(c.person, c.item, c.ii, nameId) : nothing}
    </dialog>`;
  }

  private renderStage(person: StoryPerson, item: StoryItem, ii: number, nameId: string) {
    const fill = this.auto ? 0 : 1;
    const isVideo = item.kind === "video";
    const pausable = this.auto || isVideo;
    return html`<div class="ui-sty__stage" data-kind=${item.kind} ?data-held=${this.held}>
      <div
        class="ui-sty__media"
        @pointerdown=${this.onDown}
        @pointermove=${this.onMove}
        @pointerup=${this.onUp}
        @pointercancel=${this.onCancelPress}
        @contextmenu=${(e: Event) => e.preventDefault()}
      >
        ${repeat(
          [item],
          (i) => i.id,
          (i) => this.renderItem(i),
        )}
      </div>
      <div class="ui-sty__top">
        <div class="ui-sty__bars" aria-hidden="true">
          ${person.items.map(
            (_, i) =>
              html`<span class="ui-sty__bar" ?data-current=${i === ii} ?data-done=${i < ii}><span class="ui-sty__fill" style=${`--p:${i < ii ? 1 : i > ii ? 0 : fill}`}></span></span>`,
          )}
        </div>
        <div class="ui-sty__head">
          <span class="ui-sty__who">${this.face(person.name, person.avatar, person.id)}</span>
          <h2 class="ui-sty__name" id=${nameId}>${person.name}</h2>
          ${item.at ? html`<span class="ui-sty__at">${item.at}</span>` : nothing}
          <span class="ui-sty__tools">
            ${pausable
              ? html`<button type="button" class="ui-sty__btn ui-sty__play" aria-label=${this.playing ? this.pauseLabel : this.playLabel} @click=${() => (this.playing = !this.playing)}>
                  ${this.playing ? pauseIcon() : playIcon()}
                </button>`
              : nothing}
            ${isVideo
              ? html`<button type="button" class="ui-sty__btn ui-sty__mute" aria-label=${this.muted ? this.unmuteLabel : this.muteLabel} @click=${() => (this.muted = !this.muted)}>
                  ${this.muted ? mutedIcon() : soundIcon()}
                </button>`
              : nothing}
            <button type="button" class="ui-sty__btn ui-sty__close" aria-label=${this.closeLabel} @click=${() => this.close()}>${closeIcon()}</button>
          </span>
        </div>
      </div>
      <button type="button" class="ui-sty__btn ui-sty__nav ui-sty__prev" aria-label=${this.previousLabel} @click=${() => this.step(-1)}>${prevIcon()}</button>
      <button type="button" class="ui-sty__btn ui-sty__nav ui-sty__next" aria-label=${this.nextLabel} @click=${() => this.step(1)}>${nextIcon()}</button>
      ${this.replyable
        ? html`<form
            class="ui-sty__reply"
            @submit=${this.reply}
            @focusin=${() => (this.replying = true)}
            @focusout=${(e: FocusEvent) => {
              if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) this.replying = false;
            }}
          >
            <input class="ui-sty__field" type="text" autocomplete="off" aria-label=${`${this.replyLabel} ${person.name}`} placeholder=${`${this.replyLabel} ${person.name}`} />
            <button type="submit" class="ui-sty__btn ui-sty__send" aria-label=${this.sendLabel}>${sendIcon()}</button>
          </form>`
        : nothing}
      <p class="ui-sty__sr" role="status">${this.announce}</p>
    </div>`;
  }

  protected override render() {
    return html`${this.renderRow()}${this.renderViewer()}`;
  }

  static override css = /* css */ `
[data-ui="sty"] {
  --tc-story-size: var(--tc-space-14);
  --tc-story-ring-width: calc(var(--tc-space-0-5) + var(--tc-hairline));
  --tc-story-stage-bg: var(--tc-gray-950);
  --tc-story-stage-fg: var(--tc-gray-0);
  min-width: 0;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
}
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

/* The viewer: a full-viewport modal holding a 9:16 stage */
.ui-sty__viewer { position: fixed; inset: 0; box-sizing: border-box; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: var(--tc-space-6); border: 0; background: transparent; color: var(--tc-story-stage-fg); overflow: hidden; }
.ui-sty__viewer[open] { display: grid; place-items: center; }
.ui-sty__viewer:not([open]) { display: none; }
.ui-sty__viewer::backdrop { background: var(--tc-story-scrim, color-mix(in srgb, var(--tc-gray-950) 90%, transparent)); }
.ui-sty__stage { position: relative; box-sizing: border-box; height: min(100%, calc((100vw - 2 * var(--tc-space-6)) * 16 / 9)); aspect-ratio: 9 / 16; max-width: 100%; border-radius: var(--tc-card-radius); background: var(--tc-story-stage-bg); color: var(--tc-story-stage-fg); overflow: hidden; transform: translateY(var(--dy, 0)); animation: ui-sty-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
@keyframes ui-sty-in { from { opacity: 0; transform: scale(0.96); } }
.ui-sty__media { position: absolute; inset: 0; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; cursor: pointer; }
.ui-sty__photo, .ui-sty__video { display: block; width: 100%; height: 100%; object-fit: cover; background: var(--tc-story-stage-bg); }
.ui-sty__card { display: grid; place-items: center; box-sizing: border-box; height: 100%; padding: var(--tc-space-16) var(--tc-space-8); background: var(--tc-story-card-violet, linear-gradient(160deg, var(--tc-violet-600), var(--tc-pink-600))); }
.ui-sty__card[data-tone="pink"] { background: var(--tc-story-card-pink, linear-gradient(160deg, var(--tc-pink-600), var(--tc-rose-600))); }
.ui-sty__card[data-tone="amber"] { background: var(--tc-story-card-amber, linear-gradient(160deg, var(--tc-amber-600), var(--tc-rose-600))); }
.ui-sty__card[data-tone="rose"] { background: var(--tc-story-card-rose, linear-gradient(160deg, var(--tc-rose-600), var(--tc-violet-600))); }
.ui-sty__card[data-tone="teal"] { background: var(--tc-story-card-teal, linear-gradient(160deg, var(--tc-teal-600), var(--tc-blue-600))); }
.ui-sty__card[data-tone="blue"] { background: var(--tc-story-card-blue, linear-gradient(160deg, var(--tc-blue-600), var(--tc-violet-600))); }
.ui-sty__card-text { margin: 0; font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-snug); text-align: center; text-wrap: balance; overflow-wrap: anywhere; }
.ui-sty__top { position: absolute; inset: 0 0 auto; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-8); background: linear-gradient(to bottom, color-mix(in srgb, var(--tc-story-stage-bg) 60%, transparent), transparent); pointer-events: none; }
.ui-sty__bars { display: flex; gap: var(--tc-space-0-5); padding: 0 var(--tc-space-1); }
.ui-sty__bar { flex: 1; height: var(--tc-space-0-5); border-radius: var(--tc-radius-full); background: color-mix(in srgb, var(--tc-story-stage-fg) 35%, transparent); overflow: hidden; }
.ui-sty__fill { display: block; height: 100%; background: var(--tc-story-stage-fg); transform: scaleX(var(--p, 0)); transform-origin: left center; }
.ui-sty__head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; margin-top: var(--tc-space-2); padding-left: var(--tc-space-1); }
.ui-sty__who { flex: none; width: var(--tc-space-8); height: var(--tc-space-8); }
.ui-sty__who .ui-sty__initials { font-size: var(--tc-font-size-xs); background: var(--tc-gray-0); color: var(--tc-gray-950); }
.ui-sty__name { min-width: 0; margin: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-normal); text-overflow: ellipsis; white-space: nowrap; }
.ui-sty__at { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: color-mix(in srgb, var(--tc-story-stage-fg) 78%, transparent); }
.ui-sty__tools { display: flex; gap: var(--tc-space-0-5); margin-left: auto; pointer-events: auto; }
.ui-sty__btn { display: grid; place-items: center; flex: none; width: var(--tc-control-h-md); height: var(--tc-control-h-md); margin: 0; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--tc-story-stage-fg); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sty__btn:hover { background: color-mix(in srgb, var(--tc-story-stage-fg) 16%, transparent); }
.ui-sty__btn:focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-story-stage-fg); outline-offset: calc(var(--tc-focus-ring-offset) * -1); }
.ui-sty__nav { position: absolute; top: 50%; margin-top: calc(var(--tc-control-h-md) / -2); background: color-mix(in srgb, var(--tc-story-stage-bg) 45%, transparent); }
.ui-sty__nav:hover { background: color-mix(in srgb, var(--tc-story-stage-bg) 65%, transparent); }
.ui-sty__prev { left: var(--tc-space-2); }
.ui-sty__next { right: var(--tc-space-2); }
.ui-sty__reply { position: absolute; inset: auto 0 0; display: flex; align-items: center; gap: var(--tc-space-2); margin: 0; padding: var(--tc-space-8) var(--tc-space-3) var(--tc-space-3); background: linear-gradient(to top, color-mix(in srgb, var(--tc-story-stage-bg) 60%, transparent), transparent); }
.ui-sty__field { flex: 1; min-width: 0; box-sizing: border-box; height: var(--tc-field-h); padding: 0 var(--tc-space-4); border: var(--tc-hairline) solid color-mix(in srgb, var(--tc-story-stage-fg) 70%, transparent); border-radius: var(--tc-radius-full); background: color-mix(in srgb, var(--tc-story-stage-bg) 35%, transparent); color: var(--tc-story-stage-fg); font: inherit; font-size: var(--tc-font-size-md); }
.ui-sty__field::placeholder { color: color-mix(in srgb, var(--tc-story-stage-fg) 80%, transparent); }
.ui-sty__field:focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-story-stage-fg); outline-offset: var(--tc-focus-ring-offset); }
.ui-sty__sr { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* A phone: the stage fills the screen */
@media (max-width: 480px) {
  .ui-sty__viewer { padding: 0; }
  .ui-sty__stage { width: 100%; height: 100%; aspect-ratio: auto; border-radius: 0; }
}
/* On a touch screen the thirds of the stage are the controls: Previous and Next stay for screen readers and keyboards,
   and show only when focused */
@media (max-width: 480px) and (pointer: coarse) {
  .ui-sty__nav:not(:focus-visible) { opacity: 0; }
}

/* Clean: a thinner ring and quieter names */
[data-ui="sty"][data-look="clean"] { --tc-story-ring-width: calc(var(--tc-space-0-5) + var(--tc-hairline) / 2); }
[data-ui="sty"][data-look="clean"] .ui-sty__label { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
[data-ui="sty"][data-look="clean"] svg[stroke-width] { stroke-width: 1.75; }

@media (prefers-reduced-motion: reduce) {
  .ui-sty__stage { animation: none; }
  .ui-sty__ring, .ui-sty__btn { transition: none; }
  .ui-sty__person:active .ui-sty__ring { transform: none; }
}

/* Forced colours drop the gradient: new is a thick Highlight ring, seen a thin GrayText one */
@media (forced-colors: active) {
  .ui-sty__ring { forced-color-adjust: none; background: Canvas; outline: calc(var(--tc-story-ring-width) - 1px) solid Highlight; outline-offset: -1px; }
  .ui-sty__person[data-state="seen"] .ui-sty__ring { outline: 1px solid GrayText; }
  .ui-sty__fill { forced-color-adjust: none; background: Highlight; }
  .ui-sty__bar { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-stories")) customElements.define("tc-stories", TcStories);
declare global {
  interface HTMLElementTagNameMap {
    "tc-stories": TcStories;
  }
}
