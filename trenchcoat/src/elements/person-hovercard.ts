import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";
import { safeMediaUrl } from "./internal/safe-media";
import { safeUrl } from "./internal/safe-url";
import { initials } from "./internal/util";

/*
 * <tc-person-hovercard> – the profile card behind any name. Wrap a name, an avatar or a link to a person:
 *
 *   <tc-person-hovercard .person=${mira}><a href="/people/mira">Mira Lindqvist</a></tc-person-hovercard>
 *
 * Point at it (after a short pause) or focus it, and a card opens beside it: picture or initials, name and pronouns,
 * title and team, whether they're available, busy or away (a dot and the word), their local time and how far ahead or
 * behind you they are, where they are and who they report to, then Email, Message and View profile, and their links.
 * The card stays while the pointer is over it; Escape closes it and focus goes back to the name.
 *   · the trigger is the first link or button inside; with plain text, the element adds a button over it
 *   · give `person`, or `person-id` with `resolve(id, signal)` – or answer the cancelable tc-person-lookup event with
 *     `respondWith()`. Answers are cached by id; a failure offers Retry. The element never calls a network
 *   · Message fires tc-action ({ id: "message" }), View profile tc-open; Email is a mailto link
 *   · touch: a tap opens the card (a link inside then follows on the second tap), a tap outside closes it
 *   · local time is worked out against `now`, or the element's own clock when the card opens
 * Standard: a raised card with a soft shadow. Clean: a flat card with a hairline.
 */

export type HovercardStatus = { state: "available" | "busy" | "away" | "offline"; text?: string };
export type HovercardPerson = {
  id: string;
  name: string;
  pronouns?: string;
  title?: string;
  team?: string;
  /** A picture URL; without one the card shows initials */
  avatar?: string;
  email?: string;
  phone?: string;
  location?: string;
  /** An IANA time zone ("Europe/Stockholm") – the card shows their local time */
  timezone?: string;
  status?: HovercardStatus;
  manager?: { name: string };
  links?: { label: string; href: string }[];
};
export type HovercardAction = "email" | "message" | "profile";
/** Supplies a person's details: the person, null for none, or a promise of either. Throw (or reject) when the lookup failed */
export type HovercardResolver = (id: string, signal: AbortSignal) => HovercardPerson | null | undefined | Promise<HovercardPerson | null | undefined>;

/** Details of the events */
export type HovercardLookupDetail = { id: string; signal: AbortSignal; respondWith: (person: HovercardPerson | null | undefined | Promise<HovercardPerson | null | undefined>) => void };
export type HovercardActionDetail = { id: "message"; person: HovercardPerson };
export type HovercardOpenDetail = { person: HovercardPerson };
export type HovercardOpenChange = { open: boolean };

type Entry = { status: "loading" } | { status: "done"; person: HovercardPerson | null } | { status: "error" };
const NO_ANSWER = Symbol("no answer");
const FOCUSABLE = "a[href], button, [tabindex]:not([tabindex='-1']), input, select, textarea";
let instances = 0;

/* mail, message-circle, user, clock, map-pin, rotate-ccw, external-link: Lucide (ISC, lucide.dev) */
const glyph = (body: ReturnType<typeof svg>) =>
  html`<svg class="ui-phc__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const mailIcon = svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`;
const chatIcon = svg`<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>`;
const userIcon = svg`<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`;
const clockIcon = svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`;
const pinIcon = svg`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`;
const retryIcon = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`;
const linkIcon = svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`;

const HUES = ["teal", "violet", "amber", "pink", "rose"];
const hue = (name: string) => HUES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length];
const STATUS_WORDS: Record<HovercardStatus["state"], string> = { available: "Available", busy: "Busy", away: "Away", offline: "Offline" };

/** A time zone's offset from UTC at `ms`, in minutes; null for a zone the browser doesn't know */
export function personZoneOffset(timeZone: string, ms: number): number | null {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
        .formatToParts(new Date(ms))
        .map((p) => [p.type, p.value]),
    );
    const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute), Number(parts.second));
    return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
  } catch {
    return null;
  }
}

/** How far a zone is from the viewer's: "same time as you", "2 h ahead", "5½ h behind" */
export function personZoneDifference(timeZone: string, ms: number): string | null {
  const theirs = personZoneOffset(timeZone, ms);
  if (theirs === null) return null;
  const mine = -new Date(ms).getTimezoneOffset();
  const diff = theirs - mine;
  if (!diff) return "same time as you";
  const h = Math.abs(diff) / 60;
  const words = Number.isInteger(h) ? `${h}` : h % 1 === 0.5 ? `${Math.floor(h) || ""}½` : h.toFixed(2).replace(/0+$/, "");
  return `${words} h ${diff > 0 ? "ahead" : "behind"}`;
}

/**
 * The profile card behind a name: picture, pronouns, title and team, status, local time, manager, Email, Message,
 * View profile and links – on hover, focus or tap.
 * @tag tc-person-hovercard
 * @fires tc-person-lookup - The card needs a person's details ({ id, signal, respondWith }: HovercardLookupDetail); cancelable – prevented without an answer, there are no details
 * @fires tc-action - Message was pressed ({ id: "message", person }: HovercardActionDetail)
 * @fires tc-open - View profile was pressed ({ person }: HovercardOpenDetail)
 * @fires tc-open-change - The card opened or closed ({ open }: HovercardOpenChange)
 */
export class TcPersonHovercard extends TcElement {
  static override ui = "phc";

  /** The person; when it's not given, `person-id` is looked up */
  @property({ attribute: false }) accessor person: HovercardPerson | undefined = undefined;
  /** The id to look up with `resolve` or tc-person-lookup when `person` isn't given */
  @property({ attribute: "person-id" }) accessor personId: string | undefined = undefined;
  /** Supplies details for `person-id` */
  @property({ attribute: false }) accessor resolve: HovercardResolver | undefined = undefined;
  /** How long the pointer rests on the name before the card opens, ms */
  @property({ type: Number, attribute: "hover-delay" }) accessor hoverDelay = 350;
  /** The time now, epoch ms, for local times; by default the element's own clock when the card opens */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Which actions the card offers */
  @property({ attribute: false }) accessor actions: HovercardAction[] = ["email", "message", "profile"];
  /** What the card says when there are no details */
  @property({ attribute: "not-found-text" }) accessor notFoundText = "No profile for this person";
  /** What the card says when the lookup failed */
  @property({ attribute: "error-text" }) accessor errorText = "Couldn't load the profile.";

  /** @internal Bumped when the cache changes, to render again */
  @state() accessor version = 0;
  /** @internal The clock the card's local time was read at */
  @state() accessor clock = 0;
  /** @internal The polite status line */
  @state() accessor said = "";
  /** @internal There's no link or button inside: the element draws its own trigger over the content */
  @state() accessor ownTrigger = false;

  private readonly uid = `tc-phc${++instances}`;
  private readonly cache = new Map<string, Entry>();
  private readonly aborts = new Set<AbortController>();
  private bound: HTMLElement | null = null;
  private touched = false;
  /** Whether the card was open when the touch went down – focus on that tap can open it before the click */
  private openAtDown = false;
  private returning = false;
  private mutations: MutationObserver | null = null;

  private readonly pop: PopoverController = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-phc__pop"),
    anchor: (): Element | DOMRect | null => {
      const t = this.trigger;
      if (!t?.isConnected) return null;
      return (this.ownTrigger ? this : t).getClientRects()[0] ?? t.getBoundingClientRect();
    },
    side: "bottom",
    align: "start",
    kind: "dialog",
    trigger: () => this.trigger,
    // Focus coming back to the name after the card closed mustn't open it again
    returnFocus: () => {
      this.returning = true;
      return this.trigger;
    },
    hover: { delay: () => this.hoverDelay },
    tabBridge: true,
    closeOnFocusOut: true,
    inside: () => [this],
    onClose: () => this.closed(),
  });

  override connectedCallback() {
    super.connectedCallback();
    // Content that changes (a framework re-rendering the name) can bring a link in or take it away
    this.mutations = new MutationObserver(() => this.requestUpdate());
    this.mutations.observe(this, { childList: true, subtree: false });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mutations?.disconnect();
    this.mutations = null;
    this.unbind();
    for (const a of this.aborts) a.abort();
    this.aborts.clear();
    for (const [k, e] of this.cache) if (e.status === "loading") this.cache.delete(k);
  }

  /** The element that opens the card: the first link or button inside, or the element's own */
  get trigger(): HTMLElement | null {
    if (this.ownTrigger) return this.querySelector<HTMLElement>(":scope > .ui-phc__hit");
    return this.userTrigger();
  }
  private userTrigger() {
    for (const el of this.querySelectorAll<HTMLElement>(FOCUSABLE)) if (!el.closest(".ui-phc__pop, .ui-phc__hit")) return el;
    return null;
  }

  /** Opens the card, pinned open; focus stays where it is */
  openCard() {
    this.show({ pin: true });
  }
  /** Closes the card */
  closeCard() {
    if (this.pop.open) this.pop.close();
  }
  /** Forgets cached details – one id's, or all – so the next card asks again */
  clearCache(id?: string) {
    if (id) this.cache.delete(id);
    else this.cache.clear();
    this.version++;
  }

  /* ---------- The trigger ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const own = !this.userTrigger();
    if (own !== this.ownTrigger) this.ownTrigger = own;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const t = this.trigger;
    if (t !== this.bound) {
      this.unbind();
      if (t) this.bind(t);
    }
    if (t) {
      t.setAttribute("aria-haspopup", "dialog");
      t.setAttribute("aria-expanded", this.pop.open ? "true" : "false");
    }
    // Open on someone not asked about yet (`person-id` changed, the cache cleared, or a lookup cut short when the element
    // left the page): ask now, rather than show the loading card for good
    if (this.pop.open && !this.person && this.personId && !this.cache.has(this.personId)) void this.lookup(this.personId);
  }

  private bind(t: HTMLElement) {
    this.bound = t;
    t.addEventListener("pointerenter", this.onEnter);
    t.addEventListener("pointerleave", this.onLeave);
    t.addEventListener("pointerdown", this.onDown);
    t.addEventListener("focus", this.onFocus);
    t.addEventListener("click", this.onClick);
  }
  private unbind() {
    const t = this.bound;
    if (!t) return;
    t.removeEventListener("pointerenter", this.onEnter);
    t.removeEventListener("pointerleave", this.onLeave);
    t.removeEventListener("pointerdown", this.onDown);
    t.removeEventListener("focus", this.onFocus);
    t.removeEventListener("click", this.onClick);
    if (t !== this.querySelector(".ui-phc__hit")) {
      t.removeAttribute("aria-haspopup");
      t.removeAttribute("aria-expanded");
    }
    this.bound = null;
  }
  private onEnter = (e: PointerEvent) => this.pop.hoverEnter(e, () => this.show());
  private onLeave = (e: PointerEvent) => this.pop.hoverLeave(e);
  private onDown = (e: PointerEvent) => {
    this.touched = e.pointerType === "touch" || e.pointerType === "pen";
    this.openAtDown = this.pop.open;
  };
  private onFocus = () => {
    if (this.returning) {
      this.returning = false;
      return;
    }
    if (!this.pop.open) this.show();
  };
  private onClick = (e: MouseEvent) => {
    const touch = this.touched;
    this.touched = false;
    if (this.ownTrigger) {
      // Enter or Space (detail 0): into the card. A click or tap: pin it open, or close a pinned one
      if (e.detail === 0) this.show({ pin: true, focus: true });
      else if (this.pop.open && this.pop.pinned) this.pop.close();
      else this.show({ pin: true });
      return;
    }
    // A link: the first tap opens the card instead of following it – even when the tap's focus has opened it already
    if (touch && !this.openAtDown) {
      e.preventDefault();
      this.show({ pin: true });
    }
  };

  /* ---------- Opening and looking up ---------- */

  private get key() {
    return this.person?.id ?? this.personId ?? "";
  }

  private show(how: { pin?: boolean; focus?: boolean } = {}) {
    const wasOpen = this.pop.open;
    this.clock = this.now ?? Date.now();
    if (!this.person && this.personId) void this.lookup(this.personId);
    this.pop.show({ pin: !!how.pin, focus: !!how.focus });
    if (!wasOpen) {
      this.emit<HovercardOpenChange>("tc-open-change", { open: true });
      this.requestUpdate();
    }
  }

  private closed() {
    this.returning = false;
    this.emit<HovercardOpenChange>("tc-open-change", { open: false });
    this.requestUpdate();
  }

  private async lookup(id: string) {
    if (this.cache.has(id)) return;
    this.cache.set(id, { status: "loading" });
    this.version++;
    const abort = new AbortController();
    this.aborts.add(abort);
    let answer: unknown = NO_ANSWER;
    const go = this.emit<HovercardLookupDetail>("tc-person-lookup", { id, signal: abort.signal, respondWith: (p) => (answer = p) }, { cancelable: true });
    try {
      let result: unknown = null;
      if (answer !== NO_ANSWER) result = answer;
      else if (go && this.resolve) result = this.resolve(id, abort.signal);
      const p = (await result) as HovercardPerson | null | undefined;
      if (abort.signal.aborted) return;
      const ok = !!p && typeof p === "object" && typeof p.name === "string" && p.name.trim() !== "";
      this.cache.set(id, { status: "done", person: ok ? p : null });
      if (this.key === id) this.say(ok ? p.name : this.notFoundText);
    } catch {
      if (abort.signal.aborted) return;
      this.cache.set(id, { status: "error" });
      if (this.key === id) this.say(this.errorText);
    } finally {
      this.aborts.delete(abort);
      this.version++;
    }
  }

  private retry() {
    const id = this.personId;
    if (!id) return;
    this.cache.delete(id);
    this.say("Trying again…");
    void this.lookup(id);
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  /* ---------- Rendering ---------- */

  private entry(): Entry {
    if (this.person) return { status: "done", person: this.person };
    if (!this.personId) return { status: "done", person: null };
    return this.cache.get(this.personId) ?? { status: "loading" };
  }

  private avatar(p: HovercardPerson) {
    const src = safeMediaUrl(p.avatar);
    if (src) return html`<span class="ui-phc__avatar" aria-hidden="true"><img src=${src} alt="" loading="lazy" decoding="async" /></span>`;
    return html`<span class="ui-phc__avatar" data-hue=${hue(p.name)} aria-hidden="true">${initials(p.name)}</span>`;
  }

  private localTime(p: HovercardPerson) {
    if (!p.timezone || !this.clock) return nothing;
    let time: string;
    try {
      time = new Intl.DateTimeFormat(this.locale, { hour: "numeric", minute: "2-digit", timeZone: p.timezone }).format(new Date(this.clock));
    } catch {
      return nothing;
    }
    const diff = personZoneDifference(p.timezone, this.clock);
    return html`<p class="ui-phc__row">${glyph(clockIcon)}<span>${time} local${diff ? html`<span class="ui-phc__muted"> · ${diff}</span>` : nothing}</span></p>`;
  }

  private renderCard() {
    if (!this.pop.open) return nothing;
    const entry = this.entry();
    const p = entry.status === "done" ? entry.person : null;
    const nameId = `${this.uid}-name`;
    const mail = p?.email ? safeUrl(`mailto:${p.email}`) : undefined;
    const has = (a: HovercardAction) => this.actions.includes(a);
    const links = (p?.links ?? []).map((l) => ({ ...l, href: safeUrl(l.href) })).filter((l) => l.href);
    return html`<div
      class="tc-pop ui-phc__pop"
      role="dialog"
      aria-labelledby=${ifDefined(p ? nameId : undefined)}
      aria-label=${ifDefined(p ? undefined : "Profile")}
      aria-busy=${entry.status === "loading" ? "true" : "false"}
      data-status=${entry.status === "done" && !p ? "empty" : entry.status}
    >
      ${entry.status === "loading"
        ? html`<div class="ui-phc__head">
            <span class="ui-phc__avatar" data-loading aria-hidden="true"></span>
            <span class="ui-phc__who"><span class="tc-sr-only">Loading the profile…</span><span class="ui-phc__line" data-w="name" aria-hidden="true"></span><span class="ui-phc__line" data-w="title" aria-hidden="true"></span></span>
          </div>`
        : entry.status === "error"
          ? html`<p class="ui-phc__msg" data-kind="error">${this.errorText}</p>
              <button type="button" class="ui-phc__btn" @click=${() => this.retry()}>${glyph(retryIcon)}<span>Retry</span></button>`
          : !p
            ? html`<p class="ui-phc__msg">${this.notFoundText}</p>`
            : html`<div class="ui-phc__head">
                  ${this.avatar(p)}
                  <span class="ui-phc__who">
                    <span class="ui-phc__name" id=${nameId}>${p.name}${p.pronouns ? html` <span class="ui-phc__pronouns">(${p.pronouns})</span>` : nothing}</span>
                    ${p.title || p.team ? html`<span class="ui-phc__title">${[p.title, p.team].filter(Boolean).join(" · ")}</span>` : nothing}
                  </span>
                </div>
                ${p.status
                  ? html`<p class="ui-phc__row ui-phc__status" data-state=${p.status.state}>
                      <span class="ui-phc__dot" aria-hidden="true"></span><span>${STATUS_WORDS[p.status.state] ?? p.status.state}${p.status.text ? html`<span class="ui-phc__muted"> – ${p.status.text}</span>` : nothing}</span>
                    </p>`
                  : nothing}
                ${this.localTime(p)}
                ${p.location ? html`<p class="ui-phc__row">${glyph(pinIcon)}<span>${p.location}</span></p>` : nothing}
                ${p.manager ? html`<p class="ui-phc__row">${glyph(userIcon)}<span><span class="ui-phc__muted">Reports to</span> ${p.manager.name}</span></p>` : nothing}
                ${(has("email") && mail) || has("message") || has("profile")
                  ? html`<div class="ui-phc__actions">
                      ${has("email") && mail ? html`<a class="ui-phc__btn" href=${mail}>${glyph(mailIcon)}<span>Email</span></a>` : nothing}
                      ${has("message") ? html`<button type="button" class="ui-phc__btn" @click=${() => this.emit<HovercardActionDetail>("tc-action", { id: "message", person: p })}>${glyph(chatIcon)}<span>Message</span></button>` : nothing}
                      ${has("profile") ? html`<button type="button" class="ui-phc__btn" data-primary @click=${() => this.emit<HovercardOpenDetail>("tc-open", { person: p })}>View profile</button>` : nothing}
                    </div>`
                  : nothing}
                ${links.length
                  ? html`<ul class="ui-phc__links">
                      ${links.map((l) => html`<li><a class="ui-phc__link" href=${l.href!} target="_blank" rel="noopener noreferrer">${l.label}${glyph(linkIcon)}</a></li>`)}
                    </ul>`
                  : nothing}`}
    </div>`;
  }

  /** The page's own content as words – the name the element's own trigger takes – leaving out the element's parts */
  private contentText() {
    let s = "";
    for (const n of this.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) s += n.textContent;
      else if (n instanceof Element && !n.matches(".ui-phc__hit, .ui-phc__pop, .tc-sr-only")) s += n.textContent;
    }
    return s.replace(/\s+/g, " ").trim();
  }

  protected override render() {
    return html`${this.ownTrigger ? html`<button type="button" class="ui-phc__hit" aria-label=${this.contentText() || "Profile"}></button>` : nothing}${this.renderCard()}<span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="phc"] { position: relative; display: inline; }
[data-ui="phc"] > .ui-phc__hit { position: absolute; inset: 0; z-index: 1; margin: 0; padding: 0; border: 0; border-radius: var(--tc-radius-2xs); background: transparent; color: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="phc"] > .ui-phc__hit:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ----- The card (internal/popover.ts places it, in the top layer) ----- */
.tc-pop.ui-phc__pop { display: grid; gap: var(--tc-space-2); width: 300px; padding: var(--tc-space-3) var(--tc-space-3-5); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased; }
:where([data-look="standard"], [data-look="standard"] *) .tc-pop.ui-phc__pop { border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); }
:where([data-look="clean"], [data-look="clean"] *) .tc-pop.ui-phc__pop { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default), var(--tc-shadow-raised); }
.ui-phc__pop *, .ui-phc__pop *::before, .ui-phc__pop *::after { box-sizing: border-box; }
.ui-phc__pop :is(p, ul) { margin: 0; padding: 0; }
.ui-phc__pop ul { list-style: none; }
:where(.ui-phc__pop) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
.ui-phc__pop :is(button, a):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-phc__glyph { display: block; flex: none; width: 14px; height: 14px; color: var(--tc-icon-muted); }
.ui-phc__head { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--tc-space-3); margin-bottom: var(--tc-space-1); }
.ui-phc__avatar { display: grid; place-items: center; width: var(--tc-space-12); height: var(--tc-space-12); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); }
.ui-phc__avatar > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-phc__avatar[data-hue="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-phc__avatar[data-hue="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-phc__avatar[data-hue="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-phc__avatar[data-hue="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-phc__avatar[data-hue="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
.ui-phc__who { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-phc__name { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-phc__pronouns { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-phc__title { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-phc__row { display: flex; align-items: flex-start; gap: var(--tc-space-2); }
.ui-phc__row .ui-phc__glyph { margin-top: var(--tc-space-0-5); }
.ui-phc__muted { color: var(--tc-text-muted); }
.ui-phc__status { align-items: center; color: var(--tc-text-primary); }
.ui-phc__dot { flex: none; width: var(--tc-space-2); height: var(--tc-space-2); margin: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-full); background: var(--tc-icon-muted); }
.ui-phc__status[data-state="available"] .ui-phc__dot { background: var(--tc-status-success-solid); }
.ui-phc__status[data-state="busy"] .ui-phc__dot { background: var(--tc-status-danger-solid); }
.ui-phc__status[data-state="away"] .ui-phc__dot { background: var(--tc-status-warning-solid); }
.ui-phc__status[data-state="offline"] .ui-phc__dot { background: transparent; box-shadow: inset 0 0 0 1.5px var(--tc-icon-muted); }
.ui-phc__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); padding-top: var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-phc__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); text-decoration: none; }
.ui-phc__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-phc__btn .ui-phc__glyph { color: currentColor; }
.ui-phc__btn[data-primary] { margin-left: auto; background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-phc__btn[data-primary]:hover { background: var(--tc-action-primary-bg-hover); }
.ui-phc__links { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); }
.ui-phc__link { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-accent-text); text-decoration: none; }
.ui-phc__link:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-phc__link .ui-phc__glyph { width: 12px; height: 12px; color: currentColor; }
.ui-phc__msg { color: var(--tc-text-secondary); }
.ui-phc__msg[data-kind="error"] { color: var(--tc-status-danger-fg); }
.ui-phc__pop[data-status="error"] .ui-phc__btn { justify-self: start; }
.ui-phc__avatar[data-loading], .ui-phc__line { background: var(--tc-fill-default); animation: ui-phc-pulse var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
.ui-phc__line { display: block; height: 10px; border-radius: var(--tc-radius-2xs); }
.ui-phc__line[data-w="name"] { width: 70%; height: 12px; }
.ui-phc__line[data-w="title"] { width: 50%; }
@keyframes ui-phc-pulse { 50% { opacity: 0.5; } }
@media (forced-colors: active) {
  .ui-phc__dot { forced-color-adjust: none; border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-phc__avatar[data-loading], .ui-phc__line { animation: none; }
}
`;
}

if (!customElements.get("tc-person-hovercard")) customElements.define("tc-person-hovercard", TcPersonHovercard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-person-hovercard": TcPersonHovercard;
  }
}
