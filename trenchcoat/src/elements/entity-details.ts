import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { InlineLookups, firstOfOverlaps, isWordChar, trimTrailing, type LookupEntry, type LookupHooks } from "./internal/inline-details";
import { PopoverController } from "./internal/popover";
import { marks } from "./internal/selection";
import { copyText } from "./internal/util";
import { safeMediaUrl } from "./internal/safe-media";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-entity-details> – contact details in a passage of text, found and marked: email addresses, phone numbers,
 * links (http, https and bare www.) and @handles (including @name@server). Hovering one (after a short pause),
 * focusing it or right-clicking it opens a card for its kind – an address's domain and Write email, a number's
 * country and Call, a link's host and path (and a warning when it isn't encrypted) and Open, a handle's server – with
 * Copy, and whatever the app knows about it: a name, a picture, a summary, more fields and links. Dates, version
 * numbers, card numbers, long ids and the @ inside an email address stay plain text.
 *
 *   <tc-entity-details .text=${message} .resolve=${(kind, value, signal) => directory.find(kind, value, { signal })}></tc-entity-details>
 *
 * The component never calls a network by itself. What the app knows comes from `resolve(kind, value, signal)` (the
 * details, null for none, or a promise of either), or a cancelable tc-entity-lookup event whose detail has
 * `respondWith(details | promise)`. The event fires first; preventing it without responding means there's nothing
 * more to show. Answers are cached by kind and value for the element's life (`clearCache()` forgets them); failures
 * aren't cached – the card offers Retry.
 *
 * `kinds` limits what's found; `trigger` picks what opens a card: "both" (the default) – hover, focus and right-click;
 * "hover" – hover and focus; "contextmenu" – right-click (or the Menu key / Shift + F10) and Enter.
 *
 * Also exported: `findEntities(text, kinds?)` → the ranges the element marks.
 *
 * Keyboard. Each mark is a button in the tab order. Focus opens its card (unless `trigger` is "contextmenu"); Tab or
 * Enter moves into the card, Shift + Tab from its first control goes back to the mark, Tab from its last moves on to
 * the next mark; the Menu key or Shift + F10 opens the card and moves into it; Esc closes the card and returns focus
 * to the mark. Results are announced in a polite status region.
 *
 * Standard tints each mark with a soft accent fill and a solid underline; Clean marks with a dotted underline only.
 */

/** What can be found: email addresses, phone numbers, links and @handles */
export type EntityKind = "email" | "phone" | "url" | "handle";
/** Something found in text: where it is (UTF-16 offsets, `end` exclusive), as written, its kind and its value */
export type EntityMatch = {
  start: number;
  end: number;
  text: string;
  kind: EntityKind;
  /** The address (domain in lower case), the number ("+" and digits, or the digits), the full link, or the handle */
  value: string;
};
/** What the app knows about an address, number, link or handle, as it supplies it */
export type EntityInfo = {
  /** Who or what it belongs to – "Priya Natarajan", "Facilities help desk" */
  name?: string;
  /** A sentence about it */
  summary?: string;
  /** A picture or logo (a data: URL works); decorative */
  avatar?: string;
  /** More facts, as label and value */
  fields?: { label: string; value: string }[];
  /** Links to open – the directory entry, a ticket; http(s), mailto: and tel: only */
  links?: { label: string; url: string }[];
};
/** Supplies details: the details, null or undefined for none, or a promise of either. Throw (or reject) when the lookup failed */
export type EntityResolver = (kind: EntityKind, value: string, signal: AbortSignal) => EntityInfo | null | undefined | Promise<EntityInfo | null | undefined>;
/** tc-entity-lookup: what to look up, a signal that aborts when the element leaves the page, and `respondWith()` for the answer */
export type EntityLookupDetail = { kind: EntityKind; value: string; text: string } & LookupHooks<EntityInfo>;
/** tc-copy: the text being copied and the kind it is */
export type EntityCopyDetail = { text: string; kind: EntityKind };
/** tc-open: a link in the card is about to open – Write email, Call, Open or one of the app's links */
export type EntityOpenDetail = { kind: EntityKind; value: string; url: string };
/** tc-open-change: what the open card is for, or null when it closed */
export type EntityOpenChange = { open: EntityMatch | null };
/** What opens a card: hover and focus, right-click, or both */
export type EntityTrigger = "both" | "hover" | "contextmenu";

/** Every kind, in the order overlapping matches are settled: a link beats the address inside it */
export const entityKinds: readonly EntityKind[] = ["url", "email", "handle", "phone"];
/** What each kind is called on its card */
export const defaultEntityKindLabels: Record<EntityKind, string> = { email: "Email address", phone: "Phone number", url: "Link", handle: "Handle" };

/* ---------- Finding them ---------- */

const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"'`]+/giu;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}/g;
const HANDLE_RE = /@([A-Za-z0-9_](?:[A-Za-z0-9_.]*[A-Za-z0-9_])?)(?:@([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+))?/g;
/** A phone candidate: [+cc] [(area)] digit groups split by spaces, dots or hyphens – checked by readPhone() */
const PHONE_RE = /(?:\+[  ]?)?(?:\(\d{1,4}\)[  .-]?)?\d[\d  ().-]{4,24}\d/g;

function findUrls(s: string, out: EntityMatch[]) {
  for (const m of s.matchAll(URL_RE)) {
    const start = m.index;
    const prev = s[start - 1];
    if (isWordChar(prev) || (prev !== undefined && "@./-".includes(prev))) continue;
    const raw = trimTrailing(m[0]);
    if (/^www\./i.test(raw) && !/^www\.[^\s/?#]+\.[a-z]{2,}/i.test(raw)) continue;
    let href: string;
    try {
      const u = new URL(/^www\./i.test(raw) ? `https://${raw}` : raw);
      if (!u.hostname.includes(".") && u.hostname !== "localhost") continue;
      href = u.href;
    } catch {
      continue;
    }
    // Written without a path, the link is shown and copied without the "/" URL adds
    if (!/^[a-z]+:\/\/[^/]+\//i.test(/^www\./i.test(raw) ? `https://${raw}` : raw) && href.endsWith("/")) href = href.slice(0, -1);
    out.push({ start, end: start + raw.length, text: raw, kind: "url", value: href });
  }
}

function findEmails(s: string, out: EntityMatch[]) {
  for (const m of s.matchAll(EMAIL_RE)) {
    const start = m.index;
    const end = start + m[0].length;
    const prev = s[start - 1];
    // "@name@server" is a handle; an address doesn't start inside a word or another address
    if (isWordChar(prev) || (prev !== undefined && "@.+-".includes(prev))) continue;
    if (isWordChar(s[end]) || s[end] === "@" || s[end] === "-") continue;
    const [local, domain] = m[0].split("@");
    if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) continue;
    out.push({ start, end, text: m[0], kind: "email", value: `${local}@${domain.toLowerCase()}` });
  }
}

function findHandles(s: string, out: EntityMatch[]) {
  for (const m of s.matchAll(HANDLE_RE)) {
    const start = m.index;
    const end = start + m[0].length;
    const prev = s[start - 1];
    if (isWordChar(prev) || (prev !== undefined && "@./+-".includes(prev))) continue;
    if (isWordChar(s[end]) || s[end] === "@") continue;
    // A name needs a letter ("@3" isn't anyone) and stays within the length services allow
    if (!/[A-Za-z]/.test(m[1]) || m[1].length > 39) continue;
    out.push({ start, end, text: m[0], kind: "handle", value: m[2] ? `@${m[1]}@${m[2].toLowerCase()}` : `@${m[1]}` });
  }
}

/**
 * Is this a phone number? International numbers ("+" and 8–15 digits, the country code first) and national ones with
 * 10 or 11 digits ("(555) 010-4477", "020 7946 0958", "1-555-010-4477"). Separators are needed unless it starts with
 * "+", so long digit runs (ids, card numbers) stay plain; dates and version numbers have the wrong shape.
 */
function readPhone(raw: string): string | null {
  const plus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  const parens = raw.match(/[()]/g) ?? [];
  if (parens.length && !(parens.length === 2 && /^[^()]*\(\d{1,4}\)[^()]*$/.test(raw))) return null;
  if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/.test(raw) || /^\d{1,2}[-./]\d{1,2}[-./]\d{2,4}$/.test(raw)) return null;
  const groups = raw
    .replace(/[()+]/g, " ")
    .trim()
    .split(/[  .-]+/)
    .filter(Boolean);
  if (plus) {
    if (digits.length < 8 || digits.length > 15) return null;
    if (groups.length === 1) return `+${digits}`;
    if (groups[0].length > 3) return null;
    if (groups.slice(2).some((g) => g.length < 2) || groups.some((g) => g.length > 6)) return null;
    return `+${digits}`;
  }
  if (groups.length < 2 || digits.length < 10 || digits.length > 11) return null;
  if (groups[0].length < 2 && groups[0] !== "1") return null;
  if (groups.slice(1).some((g) => g.length < 2 || g.length > 6)) return null;
  // Dots only and four short groups: an IP address or a version
  if (/^[\d.]+$/.test(raw) && groups.length === 4 && groups.every((g) => g.length <= 3)) return null;
  return digits;
}

function findPhones(s: string, out: EntityMatch[]) {
  for (const m of s.matchAll(PHONE_RE)) {
    const start = m.index;
    const prev = s[start - 1];
    if (isWordChar(prev) || (prev !== undefined && "+./-#$€£,".includes(prev))) continue;
    // Too long a run ("… 4477 12 times") – take groups off the end until it reads as a number
    let raw = m[0];
    while (raw.length >= 7) {
      const end = start + raw.length;
      const next = s[end];
      const after = s[end + 1];
      const clean = !isWordChar(next) && !((next === "." || next === "-" || next === "/" || next === ",") && /\d/.test(after ?? ""));
      const value = clean ? readPhone(raw) : null;
      if (value) {
        out.push({ start, end, text: raw, kind: "phone", value });
        break;
      }
      const cut = raw.search(/[  .-]+\d+\)?$/);
      if (cut <= 0) break;
      raw = raw.slice(0, cut);
    }
  }
}

/**
 * Every email address, phone number, link and @handle in `text`, in order. `kinds` limits which are looked for. Where
 * two overlap the link wins, then the address, then the handle, then the number.
 */
export function findEntities(text: string, kinds: readonly EntityKind[] = entityKinds): EntityMatch[] {
  const s = String(text ?? "");
  const want = new Set(kinds);
  const found: EntityMatch[] = [];
  for (const k of entityKinds) {
    const list: EntityMatch[] = [];
    if (k === "url") findUrls(s, list);
    else if (k === "email") findEmails(s, list);
    else if (k === "handle") findHandles(s, list);
    else findPhones(s, list);
    found.push(...list);
  }
  // Overlaps are settled with every kind in play, so "a@b.org" inside a link isn't marked when links are off
  return firstOfOverlaps(found).filter((m) => want.has(m.kind));
}

/* ---------- Facts ---------- */

/** Country calling codes the card names (longest prefix wins) */
const COUNTRIES: Record<string, string> = {
  "1": "United States or Canada", "7": "Russia or Kazakhstan", "20": "Egypt", "27": "South Africa", "30": "Greece", "31": "Netherlands",
  "32": "Belgium", "33": "France", "34": "Spain", "36": "Hungary", "39": "Italy", "40": "Romania", "41": "Switzerland", "43": "Austria",
  "44": "United Kingdom", "45": "Denmark", "46": "Sweden", "47": "Norway", "48": "Poland", "49": "Germany", "51": "Peru", "52": "Mexico",
  "54": "Argentina", "55": "Brazil", "56": "Chile", "57": "Colombia", "60": "Malaysia", "61": "Australia", "62": "Indonesia",
  "63": "Philippines", "64": "New Zealand", "65": "Singapore", "66": "Thailand", "81": "Japan", "82": "South Korea", "84": "Vietnam",
  "86": "China", "90": "Türkiye", "91": "India", "92": "Pakistan", "234": "Nigeria", "254": "Kenya", "351": "Portugal", "352": "Luxembourg",
  "353": "Ireland", "354": "Iceland", "358": "Finland", "420": "Czechia", "852": "Hong Kong", "886": "Taiwan", "971": "United Arab Emirates",
  "972": "Israel", "966": "Saudi Arabia",
};

/** The country for an international number, from its calling code */
export function phoneCountry(value: string): string | undefined {
  if (!value.startsWith("+")) return undefined;
  const d = value.slice(1);
  for (const n of [3, 2, 1]) {
    const c = COUNTRIES[d.slice(0, n)];
    if (c) return c;
  }
  return undefined;
}

type Fact = { label: string; value: string; warn?: boolean };

function factsFor(m: EntityMatch): Fact[] {
  if (m.kind === "email") {
    const [local, domain] = m.value.split("@");
    return [
      { label: "Mailbox", value: local },
      { label: "Domain", value: domain },
    ];
  }
  if (m.kind === "phone") {
    const country = phoneCountry(m.value);
    return [
      { label: "Number", value: m.value.startsWith("+") ? m.value : m.text.replace(/\s+/g, " ") },
      ...(country ? [{ label: "Country", value: country }] : []),
      { label: "Type", value: m.value.startsWith("+") ? "International" : "National – no country code" },
    ];
  }
  if (m.kind === "url") {
    let u: URL | null = null;
    try {
      u = new URL(m.value);
    } catch {
      u = null;
    }
    if (!u) return [];
    const path = `${u.pathname}${u.search}${u.hash}`;
    const secure = u.protocol === "https:";
    return [
      { label: "Site", value: u.hostname.replace(/^www\./, "") },
      ...(path && path !== "/" ? [{ label: "Path", value: path }] : []),
      secure
        ? { label: "Security", value: /^www\./i.test(m.text) ? "Opens with https (no scheme written)" : "Encrypted (https)" }
        : { label: "Security", value: "Not encrypted (http)", warn: true },
    ];
  }
  const at = m.value.indexOf("@", 1);
  return at > 0
    ? [
        { label: "Name", value: m.value.slice(0, at) },
        { label: "Server", value: m.value.slice(at + 1) },
      ]
    : [{ label: "Name", value: m.value }];
}

/** The card's own action: Write email, Call or Open */
function actionFor(m: EntityMatch): { label: string; url: string } | null {
  if (m.kind === "email") return { label: "Write email", url: `mailto:${m.value}` };
  if (m.kind === "phone") return { label: "Call", url: `tel:${m.value}` };
  if (m.kind === "url") return /^https?:\/\//i.test(m.value) ? { label: "Open", url: m.value } : null;
  return null;
}

/** What Copy copies: the address, the number as written, the full link, the handle */
const copyOf = (m: EntityMatch) => (m.kind === "phone" ? m.text.replace(/\s+/g, " ") : m.value);

const isInfo = (d: unknown): d is EntityInfo => {
  if (!d || typeof d !== "object") return false;
  const i = d as EntityInfo;
  return (typeof i.name === "string" && i.name.trim() !== "") || (typeof i.summary === "string" && i.summary.trim() !== "") || (Array.isArray(i.fields) && i.fields.length > 0) || (Array.isArray(i.links) && i.links.length > 0);
};

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-ent__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICONS: Record<EntityKind, TemplateResult> = {
  email: svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`,
  phone: svg`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>`,
  url: svg`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`,
  handle: svg`<circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"></path>`,
};
const copyIcon = svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`;
const checkIcon = svg`<path d="M20 6 9 17l-5-5"></path>`;
const retryIcon = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`;
const externalIcon = svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`;
const alertIcon = svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`;

const keyOf = (m: { kind: EntityKind; value: string }) => `${m.kind}:${m.value.toLowerCase()}`;
let instances = 0;

/**
 * Email addresses, phone numbers, links and @handles in text, marked: hover, focus or right-click one for its details, Copy and its action.
 * @tag tc-entity-details
 * @fires tc-entity-lookup - A card needs details ({ kind, value, text, signal, respondWith }: EntityLookupDetail); cancelable – call respondWith() with the details (or a promise), or prevent it without responding for "nothing more known"
 * @fires tc-copy - Copy was pressed ({ text, kind }: EntityCopyDetail); cancelable – prevent it to copy your own way
 * @fires tc-open - A link in the card is about to open ({ kind, value, url }: EntityOpenDetail); cancelable – prevented, the link doesn't open
 * @fires tc-open-change - A card opened or closed ({ open }: EntityOpenChange; null when closed)
 */
export class TcEntityDetails extends TcElement {
  static override ui = "ent";

  /** The text to find contact details in: plain text, shown as written (line breaks kept) */
  @property() accessor text = "";
  /** Which kinds to find: "email", "phone", "url", "handle" */
  @property({ attribute: false }) accessor kinds: EntityKind[] = [...entityKinds];
  /** Supplies details for an address, number, link or handle – details, null for none, or a promise; used when no tc-entity-lookup listener responds */
  @property({ attribute: false }) accessor resolve: EntityResolver | undefined = undefined;
  /** What opens a card: "both" (hover, focus and right-click), "hover" (hover and focus) or "contextmenu" (right-click, Menu key, Enter) */
  @property() accessor trigger: EntityTrigger = "both";
  /** How long the pointer rests on a mark before its card opens, ms */
  @property({ type: Number, attribute: "hover-delay" }) accessor hoverDelay = 300;
  /** What each kind is called on its card, merged over the defaults */
  @property({ attribute: false }) accessor kindLabels: Partial<Record<EntityKind, string>> = {};
  /** What the card says when the app knows nothing more */
  @property({ attribute: "not-found-text" }) accessor notFoundText = "Nothing more known.";
  /** What the card says when the lookup failed */
  @property({ attribute: "error-text" }) accessor errorText = "Couldn't load the details.";

  /** @internal The open card's mark (index into the matches), or -1 */
  @state() accessor openAt = -1;
  /** @internal Bumped when the cache changes */
  @state() accessor version = 0;
  /** @internal Copy was just pressed, for the check mark */
  @state() accessor copied = false;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-ent${++instances}`;
  private found: EntityMatch[] = [];
  private foundFor: string | null = null;
  private readonly lookups = new InlineLookups<EntityInfo>(() => this.version++, isInfo);
  private copiedTimer = 0;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-ent__pop"),
    anchor: () => {
      const m = this.markAt(this.openAt);
      if (!m?.isConnected) return null;
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

  override connectedCallback() {
    super.connectedCallback();
    // Back on the page with a card open: the lookup that leaving aborted is asked again
    const m = this.openAt >= 0 ? this.entities[this.openAt] : undefined;
    if (m) void this.lookup(m);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.lookups.abortAll();
    clearTimeout(this.copiedTimer);
  }

  /** The addresses, numbers, links and handles found in `text`, in order */
  get entities(): EntityMatch[] {
    const sig = `${this.kinds.join(",")}\n${this.text}`;
    if (this.foundFor !== sig) {
      this.found = findEntities(this.text, this.kinds);
      this.foundFor = sig;
    }
    return this.found;
  }

  /** Forgets cached details – one entity's, or all of them – so the next card asks again */
  clearCache(entity?: { kind: EntityKind; value: string }) {
    this.lookups.forget(entity ? keyOf(entity) : undefined);
  }

  /** Opens the card for the entity at `index` in `entities`, pinned open; focus stays where it is */
  openCard(index = 0) {
    this.open(index, { pin: true });
  }

  /** Closes the open card, if any */
  closeCard() {
    if (this.pop.open) this.pop.close();
    else this.closed();
  }

  /* ---------- Opening and closing ---------- */

  private markAt(i: number) {
    return i < 0 ? null : this.querySelector<HTMLElement>(`.ui-ent__mark[data-i="${i}"]`);
  }

  private label(kind: EntityKind) {
    return this.kindLabels[kind] ?? defaultEntityKindLabels[kind];
  }

  private open(i: number, how: { pin?: boolean; focus?: boolean } = {}) {
    const m = this.entities[i];
    if (!m) return;
    if (this.openAt !== i) {
      if (this.openAt >= 0) this.pop.pinned = false;
      this.openAt = i;
      this.copied = false;
      this.emit<EntityOpenChange>("tc-open-change", { open: m });
      void this.lookup(m);
    }
    this.pop.show({ focus: !!how.focus, pin: !!how.pin });
  }

  /** After the controller closed it (Escape, outside, focus gone, anchor gone) or closeCard() */
  private closed() {
    if (this.openAt < 0) return;
    this.openAt = -1;
    this.copied = false;
    this.emit<EntityOpenChange>("tc-open-change", { open: null });
  }

  private onMarkClick(e: MouseEvent, i: number) {
    // Enter or Space (detail 0): into the card. A click: pin it open, or close a pinned one
    if (e.detail === 0) this.open(i, { pin: true, focus: true });
    else if (this.openAt === i && this.pop.pinned) this.closeCard();
    else this.open(i, { pin: true });
  }

  private onMarkMenu(e: MouseEvent, i: number) {
    if (this.trigger === "hover") return;
    e.preventDefault();
    if (this.openAt !== i || !this.pop.open || !this.pop.pinned) this.open(i, { pin: true });
  }

  private onMarkKey(e: KeyboardEvent, i: number) {
    if (this.trigger === "hover") return;
    if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
      e.preventDefault();
      this.open(i, { pin: true, focus: true });
    }
  }

  /* ---------- Looking up ---------- */

  private async lookup(m: EntityMatch) {
    const key = keyOf(m);
    const entry = await this.lookups.run(
      key,
      (hooks) => this.emit<EntityLookupDetail>("tc-entity-lookup", { kind: m.kind, value: m.value, text: m.text, ...hooks }, { cancelable: true }),
      (signal) => this.resolve?.(m.kind, m.value, signal) ?? null,
    );
    const now = this.entities[this.openAt];
    if (!entry || !now || keyOf(now) !== key) return;
    if (entry.status === "error") this.say(this.errorText);
    else if (entry.status === "done") this.say(entry.data?.name ? entry.data.name : this.notFoundText);
  }

  private retry(m: EntityMatch) {
    this.lookups.forget(keyOf(m));
    this.say("Trying again…");
    void this.lookup(m);
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  private async copy(m: EntityMatch) {
    const text = copyOf(m);
    if (!this.emit<EntityCopyDetail>("tc-copy", { text, kind: m.kind }, { cancelable: true })) return;
    const ok = await copyText(text);
    this.say(ok ? `Copied ${text}` : `Couldn't copy – select ${text} and press Ctrl+C`);
    if (!ok) return;
    this.copied = true;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = false), 1600);
  }

  private onOpen(e: MouseEvent, m: EntityMatch, url: string) {
    if (!this.emit<EntityOpenDetail>("tc-open", { kind: m.kind, value: m.value, url }, { cancelable: true })) e.preventDefault();
  }

  /* ---------- Render ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The text or kinds changed under an open card: close it if what it was for went away
    if ((changed.has("text") || changed.has("kinds")) && this.openAt >= 0) {
      const was = this.found[this.openAt];
      const now = this.entities[this.openAt];
      if (!was || !now || keyOf(was) !== keyOf(now)) {
        if (this.pop.open) this.pop.close("anchor-gone");
        this.closed();
      }
    }
  }

  private renderCard() {
    const m = this.entities[this.openAt];
    if (!this.pop.open || !m) return nothing;
    const entry: LookupEntry<EntityInfo> = this.lookups.get(keyOf(m)) ?? { status: "loading" };
    const info = entry.status === "done" ? entry.data : null;
    const kindId = `${this.uid}-kind`;
    const valueId = `${this.uid}-value`;
    const action = actionFor(m);
    const actionUrl = action ? safeUrl(action.url) : undefined;
    return html`<div
      class="tc-pop ui-ent__pop"
      role="dialog"
      aria-labelledby=${`${kindId} ${valueId}`}
      aria-busy=${entry.status === "loading" ? "true" : "false"}
      data-kind=${m.kind}
      data-status=${entry.status === "done" && !info ? "empty" : entry.status}
    >
      <div class="ui-ent__head">
        ${this.renderBadge(m, info)}
        <div class="ui-ent__id">
          <p class="ui-ent__kind" id=${kindId}>${this.label(m.kind)}</p>
          <p class="ui-ent__value" id=${valueId}>${m.kind === "phone" ? m.text.replace(/\s+/g, " ") : m.kind === "url" ? m.text : m.value}</p>
        </div>
      </div>
      <dl class="ui-ent__facts">
        ${factsFor(m).map(
          (f) => html`<div class="ui-ent__fact" ?data-warn=${f.warn}>
            <dt>${f.label}</dt>
            <dd>${f.warn ? glyph(alertIcon, "ui-ent__warn") : nothing}${f.value}</dd>
          </div>`,
        )}
      </dl>
      <div class="ui-ent__more">${this.renderMore(entry, info, m)}</div>
      <div class="ui-ent__actions">
        <button type="button" class="tc-btn-sm ui-ent__copy" ?data-done=${this.copied} @click=${() => void this.copy(m)}>
          ${glyph(this.copied ? checkIcon : copyIcon)}<span>${this.copied ? "Copied" : "Copy"}</span>
        </button>
        ${action && actionUrl
          ? html`<a
              class="tc-btn-sm ui-ent__action"
              href=${actionUrl}
              target=${ifDefined(m.kind === "url" ? "_blank" : undefined)}
              rel=${ifDefined(m.kind === "url" ? "noopener noreferrer" : undefined)}
              @click=${(e: MouseEvent) => this.onOpen(e, m, actionUrl)}
              >${glyph(m.kind === "url" ? externalIcon : ICONS[m.kind])}<span>${action.label}</span>${m.kind === "url" ? html`<span class="tc-sr-only"> (opens in a new tab)</span>` : nothing}</a
            >`
          : nothing}
      </div>
    </div>`;
  }

  private renderBadge(m: EntityMatch, info: EntityInfo | null) {
    const img = info?.avatar ? safeMediaUrl(info.avatar) : undefined;
    if (img) return html`<div class="ui-ent__badge" data-image><img class="ui-ent__img" src=${img} alt="" loading="lazy" decoding="async" @error=${(e: Event) => ((e.target as HTMLElement).hidden = true)} />${glyph(ICONS[m.kind], "ui-ent__icon")}</div>`;
    return html`<div class="ui-ent__badge" data-kind=${m.kind}>${glyph(ICONS[m.kind], "ui-ent__icon")}</div>`;
  }

  private renderMore(entry: LookupEntry<EntityInfo>, info: EntityInfo | null, m: EntityMatch) {
    if (entry.status === "loading")
      return html`<span class="tc-sr-only">Looking up details…</span>
        <span class="ui-ent__line" data-w="name" aria-hidden="true"></span>
        <span class="ui-ent__line" data-w="text" aria-hidden="true"></span>`;
    if (entry.status === "error")
      return html`<p class="ui-ent__msg" data-kind="error">${this.errorText}</p>
        <button type="button" class="tc-btn-sm ui-ent__retry" @click=${() => this.retry(m)}>${glyph(retryIcon)}<span>Retry</span></button>`;
    if (!info) return html`<p class="ui-ent__msg">${this.notFoundText}</p>`;
    const links = (info.links ?? []).map((l) => ({ label: l.label, url: safeUrl(l.url) })).filter((l): l is { label: string; url: string } => !!l.url && !!l.label);
    const fields = (info.fields ?? []).filter((f) => f && f.label && f.value !== undefined && f.value !== "");
    return html`${info.name ? html`<p class="ui-ent__name">${info.name}</p>` : nothing}
      ${info.summary ? html`<p class="ui-ent__summary">${info.summary}</p>` : nothing}
      ${fields.length
        ? html`<dl class="ui-ent__fields">
            ${fields.map((f) => html`<div class="ui-ent__field"><dt>${f.label}</dt> <dd>${f.value}</dd></div>`)}
          </dl>`
        : nothing}
      ${links.length
        ? html`<ul class="ui-ent__links">
            ${links.map((l) => {
              const web = /^https?:/i.test(l.url);
              return html`<li>
                <a class="ui-ent__link" href=${l.url} target=${ifDefined(web ? "_blank" : undefined)} rel=${ifDefined(web ? "noopener noreferrer" : undefined)} @click=${(e: MouseEvent) => this.onOpen(e, m, l.url)}
                  >${l.label}${web ? html`<span class="tc-sr-only"> (opens in a new tab)</span>${glyph(externalIcon, "ui-ent__ext")}` : nothing}</a
                >
              </li>`;
            })}
          </ul>`
        : nothing}`;
  }

  protected override render() {
    void this.version;
    const list = this.entities;
    const kinds = [...new Set(list.map((m) => m.kind))];
    const body = marks(this.text, list, (seg) => {
      const i = list.indexOf(seg.ranges[0]);
      const m = list[i];
      const open = this.openAt === i && this.pop.open;
      return html`<button
        type="button"
        class="ui-ent__mark"
        data-i=${i}
        data-kind=${m.kind}
        aria-haspopup="dialog"
        aria-expanded=${open ? "true" : "false"}
        aria-describedby=${`${this.uid}-hint-${m.kind}`}
        ?data-open=${open}
        @pointerenter=${(e: PointerEvent) => this.trigger !== "contextmenu" && this.pop.hoverEnter(e, () => this.open(i))}
        @pointerleave=${this.pop.hoverLeave}
        @click=${(e: MouseEvent) => this.onMarkClick(e, i)}
        @contextmenu=${(e: MouseEvent) => this.onMarkMenu(e, i)}
        @keydown=${(e: KeyboardEvent) => this.onMarkKey(e, i)}
        @focus=${() => this.trigger !== "contextmenu" && (this.openAt !== i || !this.pop.open) && this.open(i)}
      >${seg.text}</button>`;
    });
    const how = this.trigger === "contextmenu" ? "Enter or the Menu key opens them" : "Tab moves into them";
    return html`<div class="ui-ent__text">${body}</div>
      ${this.renderCard()}
      ${kinds.map((k) => html`<span class="tc-sr-only" id=${`${this.uid}-hint-${k}`}>${this.label(k)} details. ${how}</span>`)}
      <span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="ent"] {
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
[data-ui="ent"] *, .ui-ent__pop *, .ui-ent__pop *::before, .ui-ent__pop *::after { box-sizing: border-box; }
:where([data-ui="ent"]) button:not(.tc-btn-sm) { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="ent"]) :is(p, dl, dd, ul) { margin: 0; padding: 0; }
:where([data-ui="ent"]) ul { list-style: none; }
[data-ui="ent"] :is(button, a, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ent__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-ent__glyph { stroke-width: 1.4; }
.ui-ent__text { white-space: pre-wrap; overflow-wrap: break-word; }
/* ----- The marks ----- */
.ui-ent__mark { display: inline; padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); color: var(--tc-accent-text); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; overflow-wrap: anywhere; box-decoration-break: clone; -webkit-box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ent__mark[data-kind="phone"] { font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ent__mark { background: var(--tc-accent-subtle); text-decoration-color: color-mix(in srgb, var(--tc-accent-text) 45%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-ent__mark:is(:hover, [data-open]) { background: var(--tc-accent-highlight); text-decoration-color: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-ent__mark { padding: 0; text-decoration-style: dotted; text-decoration-thickness: 1.5px; text-decoration-color: color-mix(in srgb, var(--tc-accent-text) 60%, transparent); }
:where([data-look="clean"], [data-look="clean"] *).ui-ent__mark:is(:hover, [data-open]) { background: var(--tc-accent-subtle); text-decoration-color: currentColor; }
.ui-ent__mark:focus-visible { outline-offset: 1px; }
/* ----- The card (internal/popover.ts places it) ----- */
.tc-pop.ui-ent__pop { display: grid; gap: var(--tc-space-3); width: 320px; padding: var(--tc-space-3); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); text-align: left; -webkit-font-smoothing: antialiased; }
.ui-ent__head { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: var(--tc-space-3); align-items: center; }
.ui-ent__badge { position: relative; display: grid; place-items: center; width: 40px; aspect-ratio: 1; overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-ent__badge[data-image] { border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *) .ui-ent__badge { background: var(--tc-fill-subtle); color: var(--tc-icon-muted); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-ent__img { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; }
.ui-ent__img[hidden] { display: none; }
.ui-ent__icon { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.ui-ent__id { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-ent__kind { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-ent__value { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); overflow-wrap: anywhere; }
.ui-ent__pop[data-kind="phone"] .ui-ent__value { font-variant-numeric: tabular-nums; }
.ui-ent__facts, .ui-ent__fields { display: grid; gap: var(--tc-space-1); }
.ui-ent__facts { padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ent__fact, .ui-ent__field { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: var(--tc-space-2); align-items: baseline; }
.ui-ent__fact dt, .ui-ent__field dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-ent__fact dd, .ui-ent__field dd { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-ent__fact[data-warn] dd { color: var(--tc-status-warning-fg); }
.ui-ent__warn { width: 14px; height: 14px; flex: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
/* What the app knows */
.ui-ent__more { display: grid; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); align-content: start; }
.ui-ent__name { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); overflow-wrap: anywhere; }
.ui-ent__summary { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }
.ui-ent__fields { margin-top: var(--tc-space-1); }
.ui-ent__msg { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-ent__msg[data-kind="error"] { color: var(--tc-status-danger-fg); }
.ui-ent__retry { justify-self: start; }
.ui-ent__links { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); margin-top: var(--tc-space-1); }
.ui-ent__link { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); text-decoration: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ent__link:hover { background: var(--tc-fill-strong); }
.ui-ent__ext { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.9; color: var(--tc-text-muted); }
/* Loading: the shapes of what's coming */
.ui-ent__line { display: block; height: 10px; margin: var(--tc-space-1) 0; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); animation: ui-ent-pulse var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
.ui-ent__line[data-w="name"] { width: 60%; height: 12px; }
.ui-ent__line[data-w="text"] { width: 85%; }
@keyframes ui-ent-pulse { 50% { opacity: 0.5; } }
/* Copy and the kind's own action */
.ui-ent__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ent__action { text-decoration: none; }
.ui-ent__copy[data-done] { color: var(--tc-status-success-fg); }
@media (forced-colors: active) {
  .ui-ent__mark { forced-color-adjust: none; color: LinkText; background: none; text-decoration-color: LinkText; }
  .ui-ent__mark:is(:hover, [data-open]) { outline: 2px solid Highlight; }
  .ui-ent__badge, .ui-ent__link { border: 1px solid CanvasText; }
}
@media (pointer: coarse) {
  .ui-ent__link { min-height: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ent"] *, .ui-ent__pop, .ui-ent__pop * { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-entity-details")) customElements.define("tc-entity-details", TcEntityDetails);

declare global {
  interface HTMLElementTagNameMap {
    "tc-entity-details": TcEntityDetails;
  }
}
