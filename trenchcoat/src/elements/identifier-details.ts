import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { InlineLookups, firstOfOverlaps, isWordChar, trimTrailing, type LookupEntry, type LookupHooks } from "./internal/inline-details";
import { PopoverController } from "./internal/popover";
import { marks } from "./internal/selection";
import { copyText } from "./internal/util";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-identifier-details> – identifiers in a passage of text, found, checked and marked: DOIs, IPv4 and IPv6
 * addresses (with an optional /prefix), file hashes (MD5, SHA-1, SHA-256, SHA-512), CVE ids and parcel tracking
 * numbers. Hovering one (after a short pause), focusing it or right-clicking it opens a card: what kind it is, its
 * normalised value with Copy, the facts that follow from the value itself – a DOI's prefix and its doi.org link, an
 * address's version and range (private, loopback, documentation…), a hash's likely algorithm, a CVE's year and NVD
 * link, a parcel's carrier – and whatever the app knows: a title, a CVE's severity, an address's owner and network,
 * a parcel's status, more fields and links.
 *
 *   <tc-identifier-details .text=${report} .resolve=${(kind, value, signal) => intel.lookup(kind, value, { signal })}></tc-identifier-details>
 *
 * What stays plain: version numbers ("v1.2.3.4"), times ("10:30:00"), numbers with octets past 255 or leading zeros,
 * hex runs of other lengths or in mixed case, and tracking numbers with no carrier named before them (only UPS's
 * "1Z…" numbers are recognised on their own) – a run of digits is too often something else.
 *
 * The component never calls a network by itself. What the app knows comes from `resolve(kind, value, signal)` (the
 * details, null for none, or a promise of either), or a cancelable tc-identifier-lookup event whose detail has
 * `respondWith(details | promise)`. The event fires first; preventing it without responding means there's nothing
 * more to show. Answers are cached by kind and value for the element's life (`clearCache()` forgets them); failures
 * aren't cached – the card offers Retry.
 *
 * `kinds` limits what's found; `trigger` picks what opens a card: "both" (the default) – hover, focus and right-click;
 * "hover" – hover and focus; "contextmenu" – right-click (or the Menu key / Shift + F10) and Enter.
 *
 * Also exported: `findIdentifiers(text, kinds?)` → the ranges the element marks, and `ipRange(value)` → the range an
 * address falls in.
 *
 * Keyboard. Each mark is a button in the tab order. Focus opens its card (unless `trigger` is "contextmenu"); Tab or
 * Enter moves into the card, Shift + Tab from its first control goes back to the mark, Tab from its last moves on to
 * the next mark; the Menu key or Shift + F10 opens the card and moves into it; Esc closes the card and returns focus
 * to the mark. Results are announced in a polite status region.
 *
 * Standard tints each mark with a soft accent fill and a solid underline; Clean marks with a dotted underline only.
 * Identifiers are set in the monospace face in both.
 */

/** What can be found: DOIs, IP addresses, file hashes, CVE ids and parcel tracking numbers */
export type IdentifierKind = "doi" | "ip" | "hash" | "cve" | "tracking";
/** An identifier found in text: where it is (UTF-16 offsets, `end` exclusive), as written, its kind and normalised value */
export type IdentifierMatch = {
  start: number;
  end: number;
  text: string;
  kind: IdentifierKind;
  /** The DOI as written, the address (IPv6 compressed, lower case; "/prefix" kept), the hash in lower case, the CVE id in upper case, the tracking number */
  value: string;
  /** For a tracking number: the carrier named before it, or UPS for a "1Z…" number */
  carrier?: string;
};
/** How serious a CVE is, as the app reports it */
export type IdentifierSeverity = "critical" | "high" | "medium" | "low" | "none";
/** What the app knows about an identifier, as it supplies it */
export type IdentifierInfo = {
  /** What it is – a paper's title, a CVE's headline, a file's name */
  title?: string;
  /** A sentence about it */
  summary?: string;
  /** For a CVE: its severity, shown as a chip with the word */
  severity?: IdentifierSeverity;
  /** For a CVE: its CVSS base score, 0–10 */
  score?: number;
  /** For a parcel (or anything with a state): where it stands – "Out for delivery" */
  status?: string;
  /** For an address: who it's registered to */
  owner?: string;
  /** For an address: its network – "AS64500" */
  asn?: string;
  /** More facts, as label and value */
  fields?: { label: string; value: string }[];
  /** Links to open – an advisory, a ticket; http(s), mailto: and tel: only */
  links?: { label: string; url: string }[];
};
/** Supplies details: the details, null or undefined for none, or a promise of either. Throw (or reject) when the lookup failed */
export type IdentifierResolver = (kind: IdentifierKind, value: string, signal: AbortSignal) => IdentifierInfo | null | undefined | Promise<IdentifierInfo | null | undefined>;
/** tc-identifier-lookup: what to look up, a signal that aborts when the element leaves the page, and `respondWith()` for the answer */
export type IdentifierLookupDetail = { kind: IdentifierKind; value: string; text: string; carrier?: string } & LookupHooks<IdentifierInfo>;
/** tc-copy: the value being copied and its kind */
export type IdentifierCopyDetail = { text: string; kind: IdentifierKind };
/** tc-open: a link in the card is about to open – doi.org, NVD or one of the app's links */
export type IdentifierOpenDetail = { kind: IdentifierKind; value: string; url: string };
/** tc-open-change: what the open card is for, or null when it closed */
export type IdentifierOpenChange = { open: IdentifierMatch | null };
/** What opens a card: hover and focus, right-click, or both */
export type IdentifierTrigger = "both" | "hover" | "contextmenu";
/** The range an IP address falls in, and the block that defines it */
export type IpRange = { version: 4 | 6; scope: "public" | "private" | "loopback" | "link-local" | "documentation" | "shared" | "multicast" | "reserved" | "unspecified" | "broadcast" | "mapped"; block?: string };

/** Every kind, in the order overlapping matches are settled */
export const identifierKinds: readonly IdentifierKind[] = ["doi", "cve", "tracking", "ip", "hash"];
/** What each kind is called on its card */
export const defaultIdentifierKindLabels: Record<IdentifierKind, string> = { doi: "DOI", ip: "IP address", hash: "File hash", cve: "CVE", tracking: "Tracking number" };

/* ---------- IP addresses ---------- */

/** An IPv4 address's four numbers, or null: each 0–255 with no leading zeros */
function octets(s: string): number[] | null {
  const parts = s.split(".");
  if (parts.length !== 4) return null;
  const out: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || (p.length > 1 && p.startsWith("0"))) return null;
    const n = Number(p);
    if (n > 255) return null;
    out.push(n);
  }
  return out;
}

/** An IPv6 address's eight groups, or null. "::" stands for one run of zero groups */
function groups6(s: string): number[] | null {
  if (!/^[0-9a-f:]+$/i.test(s) || s.includes(":::")) return null;
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const part = (h: string) => (h === "" ? [] : h.split(":"));
  const head = part(halves[0]);
  const tail = halves.length === 2 ? part(halves[1]) : [];
  if ([...head, ...tail].some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null;
  const known = head.length + tail.length;
  if (halves.length === 1 ? known !== 8 : known > 7) return null;
  return [...head, ...Array<string>(8 - known).fill("0"), ...tail].map((g) => parseInt(g, 16));
}

/** The shortest way to write an IPv6 address (RFC 5952): lower case, no leading zeros, the longest zero run as "::" */
function compress6(g: number[]) {
  let best = -1;
  let bestLen = 1;
  for (let i = 0; i < 8; ) {
    if (g[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && g[j] === 0) j++;
    if (j - i > bestLen) [best, bestLen] = [i, j - i];
    i = j;
  }
  const hex = g.map((n) => n.toString(16));
  if (best < 0) return hex.join(":");
  return `${hex.slice(0, best).join(":")}::${hex.slice(best + bestLen).join(":")}`;
}

/** The range an IP address (with or without a /prefix) falls in, or null when it isn't one */
export function ipRange(value: string): IpRange | null {
  const addr = value.split("/")[0];
  const v4 = octets(addr);
  if (v4) {
    const [a, b, c] = v4;
    if (v4.every((n) => n === 255)) return { version: 4, scope: "broadcast", block: "255.255.255.255/32" };
    if (a === 0) return { version: 4, scope: "unspecified", block: "0.0.0.0/8" };
    if (a === 10) return { version: 4, scope: "private", block: "10.0.0.0/8" };
    if (a === 172 && b >= 16 && b <= 31) return { version: 4, scope: "private", block: "172.16.0.0/12" };
    if (a === 192 && b === 168) return { version: 4, scope: "private", block: "192.168.0.0/16" };
    if (a === 127) return { version: 4, scope: "loopback", block: "127.0.0.0/8" };
    if (a === 169 && b === 254) return { version: 4, scope: "link-local", block: "169.254.0.0/16" };
    if (a === 100 && b >= 64 && b <= 127) return { version: 4, scope: "shared", block: "100.64.0.0/10" };
    if (a === 192 && b === 0 && c === 2) return { version: 4, scope: "documentation", block: "192.0.2.0/24" };
    if (a === 198 && b === 51 && c === 100) return { version: 4, scope: "documentation", block: "198.51.100.0/24" };
    if (a === 203 && b === 0 && c === 113) return { version: 4, scope: "documentation", block: "203.0.113.0/24" };
    if (a >= 224 && a <= 239) return { version: 4, scope: "multicast", block: "224.0.0.0/4" };
    if (a >= 240) return { version: 4, scope: "reserved", block: "240.0.0.0/4" };
    return { version: 4, scope: "public" };
  }
  const g = groups6(addr);
  if (!g) return null;
  if (g.every((n) => n === 0)) return { version: 6, scope: "unspecified", block: "::/128" };
  if (g.slice(0, 7).every((n) => n === 0) && g[7] === 1) return { version: 6, scope: "loopback", block: "::1/128" };
  if (g.slice(0, 5).every((n) => n === 0) && g[5] === 0xffff) return { version: 6, scope: "mapped", block: "::ffff:0:0/96" };
  if ((g[0] & 0xffc0) === 0xfe80) return { version: 6, scope: "link-local", block: "fe80::/10" };
  if ((g[0] & 0xfe00) === 0xfc00) return { version: 6, scope: "private", block: "fc00::/7" };
  if (g[0] === 0x2001 && g[1] === 0x0db8) return { version: 6, scope: "documentation", block: "2001:db8::/32" };
  if ((g[0] & 0xff00) === 0xff00) return { version: 6, scope: "multicast", block: "ff00::/8" };
  return { version: 6, scope: "public" };
}

const SCOPE_WORDS: Record<IpRange["scope"], string> = {
  public: "Public",
  private: "Private",
  loopback: "Loopback – this machine",
  "link-local": "Link-local",
  documentation: "Reserved for documentation",
  shared: "Shared (carrier-grade NAT)",
  multicast: "Multicast",
  reserved: "Reserved",
  unspecified: "Unspecified",
  broadcast: "Broadcast",
  mapped: "IPv4-mapped",
};

/* ---------- Finding them ---------- */

const DOI_RE = /10\.\d{4,9}\/[^\s"<>]+/g;
const CVE_RE = /CVE-(\d{4})-(\d{4,7})/gi;
const UPS_RE = /1Z[0-9A-Z]{16}/g;
const CARRIER_RE = /\b(UPS|FedEx|USPS|DHL|Royal Mail|Parcelforce|DPD|PostNL|Canada Post|Australia Post)\b[\s:]*(?:tracking\b)?[\s:]*(?:(?:no\.?|number|#|id)[\s:]*)?#?([A-Za-z0-9]{8,30})/gi;
const V4_RE = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\/\d{1,2})?/g;
const V6_RE = /[0-9A-Fa-f:]*:[0-9A-Fa-f]*:[0-9A-Fa-f:]*(?:\/\d{1,3})?/g;
const HASH_RE = /[0-9A-Fa-f]{32,128}/g;
const CARRIERS: Record<string, string> = { ups: "UPS", fedex: "FedEx", usps: "USPS", dhl: "DHL", "royal mail": "Royal Mail", parcelforce: "Parcelforce", dpd: "DPD", postnl: "PostNL", "canada post": "Canada Post", "australia post": "Australia Post" };
const HASHES: Record<number, string> = { 32: "MD5", 40: "SHA-1", 64: "SHA-256", 128: "SHA-512" };

/** Not inside a word, and (for numbers) not after a "." or a digit */
const clearBefore = (s: string, i: number, also = "") => {
  const p = s[i - 1];
  return !isWordChar(p) && !(p !== undefined && also.includes(p));
};
const clearAfter = (s: string, i: number, also = "") => {
  const n = s[i];
  if (isWordChar(n)) return false;
  if (n !== undefined && also.includes(n) && /[\dA-Za-z]/.test(s[i + 1] ?? "")) return false;
  return true;
};

function findAll(s: string): IdentifierMatch[] {
  const out: IdentifierMatch[] = [];
  for (const m of s.matchAll(DOI_RE)) {
    if (!clearBefore(s, m.index, ".")) continue;
    const raw = trimTrailing(m[0]);
    if (raw.length <= raw.indexOf("/") + 1) continue;
    out.push({ start: m.index, end: m.index + raw.length, text: raw, kind: "doi", value: raw });
  }
  for (const m of s.matchAll(CVE_RE)) {
    const end = m.index + m[0].length;
    if (!clearBefore(s, m.index, "-") || isWordChar(s[end]) || Number(m[1]) < 1999) continue;
    out.push({ start: m.index, end, text: m[0], kind: "cve", value: m[0].toUpperCase() });
  }
  for (const m of s.matchAll(CARRIER_RE)) {
    const num = m[2];
    const end = m.index + m[0].length;
    // Upper case and digits only, eight digits at least – "DHL depot closes" isn't a number
    if (num !== num.toUpperCase() || (num.match(/\d/g) ?? []).length < 8 || isWordChar(s[end])) continue;
    const start = end - num.length;
    out.push({ start, end, text: num, kind: "tracking", value: num, carrier: CARRIERS[m[1].toLowerCase().replace(/\s+/g, " ")] ?? m[1] });
  }
  for (const m of s.matchAll(UPS_RE)) {
    const end = m.index + m[0].length;
    if (!clearBefore(s, m.index) || isWordChar(s[end])) continue;
    out.push({ start: m.index, end, text: m[0], kind: "tracking", value: m[0], carrier: "UPS" });
  }
  for (const m of s.matchAll(V4_RE)) {
    const end = m.index + m[0].length;
    if (!clearBefore(s, m.index, ".") || !clearAfter(s, end, ".")) continue;
    const [addr, prefix] = m[0].split("/");
    if (!octets(addr) || (prefix !== undefined && (Number(prefix) > 32 || (prefix.length > 1 && prefix.startsWith("0"))))) continue;
    out.push({ start: m.index, end, text: m[0], kind: "ip", value: m[0] });
  }
  for (const m of s.matchAll(V6_RE)) {
    let raw = m[0];
    // A sentence's colon after an address ("… 2001:db8::1: blocked") isn't part of it
    while (raw.endsWith(":") && !raw.endsWith("::")) raw = raw.slice(0, -1);
    const end = m.index + raw.length;
    if (!clearBefore(s, m.index, ":") || !clearAfter(s, end, ":")) continue;
    const [addr, prefix] = raw.split("/");
    const g = groups6(addr);
    if (!g || (prefix !== undefined && Number(prefix) > 128)) continue;
    // Real addresses, not "a::b" in code: all eight groups; "::" with three groups or more, or two led by a full
    // one ("fe80::1"); or ::1
    const written = addr.split(":").filter(Boolean);
    const shortened = addr.includes("::") && (written.length >= 3 || (written.length === 2 && written[0].length >= 3));
    if (!(written.length === 8 || shortened || compress6(g) === "::1")) continue;
    out.push({ start: m.index, end, text: raw, kind: "ip", value: compress6(g) + (prefix !== undefined ? `/${prefix}` : "") });
  }
  for (const m of s.matchAll(HASH_RE)) {
    const end = m.index + m[0].length;
    const h = m[0];
    if (!HASHES[h.length] || !clearBefore(s, m.index) || isWordChar(s[end])) continue;
    // A digit and a letter, in one case: an all-digit run is an id, and Mixed-Case hex is prose or a key
    if (!/\d/.test(h) || !/[a-f]/i.test(h) || (h !== h.toLowerCase() && h !== h.toUpperCase())) continue;
    out.push({ start: m.index, end, text: h, kind: "hash", value: h.toLowerCase() });
  }
  return out;
}

/**
 * Every DOI, IP address, file hash, CVE id and tracking number in `text`, in order. `kinds` limits which are looked
 * for. Where two overlap, the earlier kind in `identifierKinds` wins.
 */
export function findIdentifiers(text: string, kinds: readonly IdentifierKind[] = identifierKinds): IdentifierMatch[] {
  const want = new Set(kinds);
  const all = findAll(String(text ?? ""));
  const rank = (k: IdentifierKind) => identifierKinds.indexOf(k);
  return firstOfOverlaps(all.sort((a, b) => rank(a.kind) - rank(b.kind) || a.start - b.start)).filter((m) => want.has(m.kind));
}

/* ---------- Facts ---------- */

type Fact = { label: string; value: string };

/** doi.org's address for a DOI: "#" and "?" escaped, the rest as the DOI is written */
const doiUrl = (doi: string) => `https://doi.org/${encodeURI(doi).replace(/#/g, "%23").replace(/\?/g, "%3F")}`;

/** How many addresses a block of `bits` host bits holds, in words: exact up to 2^52, then as a power of two */
const addresses = (bits: number) => (bits === 0 ? "1 address" : bits <= 52 ? `${(2 ** bits).toLocaleString("en")} addresses` : `2^${bits} addresses`);

function factsFor(m: IdentifierMatch): Fact[] {
  if (m.kind === "doi") {
    const slash = m.value.indexOf("/");
    return [
      { label: "Prefix", value: m.value.slice(0, slash) },
      { label: "Suffix", value: m.value.slice(slash + 1) },
    ];
  }
  if (m.kind === "ip") {
    const r = ipRange(m.value);
    const prefix = m.value.split("/")[1];
    return [
      { label: "Version", value: r?.version === 6 ? "IPv6" : "IPv4" },
      { label: "Range", value: r ? `${SCOPE_WORDS[r.scope]}${r.block ? ` (${r.block})` : ""}` : "" },
      ...(prefix !== undefined ? [{ label: "Prefix", value: `/${prefix} – ${addresses((r?.version === 6 ? 128 : 32) - Number(prefix))}` }] : []),
    ];
  }
  if (m.kind === "hash")
    return [
      { label: "Algorithm", value: `${HASHES[m.value.length]} (by length)` },
      { label: "Length", value: `${m.value.length} hex characters, ${m.value.length * 4} bits` },
    ];
  if (m.kind === "cve") {
    const [, year, seq] = m.value.split("-");
    return [
      { label: "Year", value: year },
      { label: "Number", value: seq },
    ];
  }
  return [{ label: "Carrier", value: m.carrier ?? "" }];
}

/** The links the value itself gives: doi.org for a DOI; NVD and CVE.org for a CVE */
function linksFor(m: IdentifierMatch): { label: string; url: string }[] {
  if (m.kind === "doi") return [{ label: "Open at doi.org", url: doiUrl(m.value) }];
  if (m.kind === "cve")
    return [
      { label: "NVD", url: `https://nvd.nist.gov/vuln/detail/${m.value}` },
      { label: "CVE.org", url: `https://www.cve.org/CVERecord?id=${m.value}` },
    ];
  return [];
}

const SEVERITY: Record<IdentifierSeverity, { word: string; tone: string }> = {
  critical: { word: "Critical", tone: "danger" },
  high: { word: "High", tone: "danger" },
  medium: { word: "Medium", tone: "warning" },
  low: { word: "Low", tone: "info" },
  none: { word: "None", tone: "neutral" },
};

const isInfo = (d: unknown): d is IdentifierInfo => {
  if (!d || typeof d !== "object") return false;
  const i = d as IdentifierInfo;
  const text = (v: unknown) => typeof v === "string" && v.trim() !== "";
  return text(i.title) || text(i.summary) || text(i.status) || text(i.owner) || text(i.asn) || (typeof i.severity === "string" && i.severity in SEVERITY) || (Array.isArray(i.fields) && i.fields.length > 0) || (Array.isArray(i.links) && i.links.length > 0);
};

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-idd__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICONS: Record<IdentifierKind, TemplateResult> = {
  doi: svg`<path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>`,
  ip: svg`<rect x="16" y="16" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="9" y="2" width="6" height="6" rx="1"></rect><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path><path d="M12 12V8"></path>`,
  hash: svg`<line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line>`,
  cve: svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path>`,
  tracking: svg`<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path>`,
};
const copyIcon = svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`;
const checkIcon = svg`<path d="M20 6 9 17l-5-5"></path>`;
const retryIcon = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`;
const externalIcon = svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`;

const keyOf = (m: { kind: IdentifierKind; value: string }) => `${m.kind}:${m.value.toLowerCase()}`;
let instances = 0;

/**
 * DOIs, IP addresses, file hashes, CVE ids and tracking numbers in text, marked: hover, focus or right-click one for what it is, Copy and what the app knows.
 * @tag tc-identifier-details
 * @fires tc-identifier-lookup - A card needs details ({ kind, value, text, carrier, signal, respondWith }: IdentifierLookupDetail); cancelable – call respondWith() with the details (or a promise), or prevent it without responding for "nothing more known"
 * @fires tc-copy - Copy was pressed ({ text, kind }: IdentifierCopyDetail); cancelable – prevent it to copy your own way
 * @fires tc-open - A link in the card is about to open ({ kind, value, url }: IdentifierOpenDetail); cancelable – prevented, the link doesn't open
 * @fires tc-open-change - A card opened or closed ({ open }: IdentifierOpenChange; null when closed)
 */
export class TcIdentifierDetails extends TcElement {
  static override ui = "idd";

  /** The text to find identifiers in: plain text, shown as written (line breaks kept) */
  @property() accessor text = "";
  /** Which kinds to find: "doi", "ip", "hash", "cve", "tracking" */
  @property({ attribute: false }) accessor kinds: IdentifierKind[] = [...identifierKinds];
  /** Supplies details for an identifier – details, null for none, or a promise; used when no tc-identifier-lookup listener responds */
  @property({ attribute: false }) accessor resolve: IdentifierResolver | undefined = undefined;
  /** What opens a card: "both" (hover, focus and right-click), "hover" (hover and focus) or "contextmenu" (right-click, Menu key, Enter) */
  @property() accessor trigger: IdentifierTrigger = "both";
  /** How long the pointer rests on a mark before its card opens, ms */
  @property({ type: Number, attribute: "hover-delay" }) accessor hoverDelay = 300;
  /** What each kind is called on its card, merged over the defaults */
  @property({ attribute: false }) accessor kindLabels: Partial<Record<IdentifierKind, string>> = {};
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

  private readonly uid = `tc-idd${++instances}`;
  private found: IdentifierMatch[] = [];
  private foundFor: string | null = null;
  private readonly lookups = new InlineLookups<IdentifierInfo>(() => this.version++, isInfo);
  private copiedTimer = 0;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-idd__pop"),
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
    const m = this.openAt >= 0 ? this.identifiers[this.openAt] : undefined;
    if (m) void this.lookup(m);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.lookups.abortAll();
    clearTimeout(this.copiedTimer);
  }

  /** The identifiers found in `text`, in order */
  get identifiers(): IdentifierMatch[] {
    const sig = `${this.kinds.join(",")}\n${this.text}`;
    if (this.foundFor !== sig) {
      this.found = findIdentifiers(this.text, this.kinds);
      this.foundFor = sig;
    }
    return this.found;
  }

  /** Forgets cached details – one identifier's, or all of them – so the next card asks again */
  clearCache(identifier?: { kind: IdentifierKind; value: string }) {
    this.lookups.forget(identifier ? keyOf(identifier) : undefined);
  }

  /** Opens the card for the identifier at `index` in `identifiers`, pinned open; focus stays where it is */
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
    return i < 0 ? null : this.querySelector<HTMLElement>(`.ui-idd__mark[data-i="${i}"]`);
  }

  private label(kind: IdentifierKind) {
    return this.kindLabels[kind] ?? defaultIdentifierKindLabels[kind];
  }

  private open(i: number, how: { pin?: boolean; focus?: boolean } = {}) {
    const m = this.identifiers[i];
    if (!m) return;
    if (this.openAt !== i) {
      if (this.openAt >= 0) this.pop.pinned = false;
      this.openAt = i;
      this.copied = false;
      this.emit<IdentifierOpenChange>("tc-open-change", { open: m });
      void this.lookup(m);
    }
    this.pop.show({ focus: !!how.focus, pin: !!how.pin });
  }

  /** After the controller closed it (Escape, outside, focus gone, anchor gone) or closeCard() */
  private closed() {
    if (this.openAt < 0) return;
    this.openAt = -1;
    this.copied = false;
    this.emit<IdentifierOpenChange>("tc-open-change", { open: null });
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

  private async lookup(m: IdentifierMatch) {
    const key = keyOf(m);
    const entry = await this.lookups.run(
      key,
      (hooks) => this.emit<IdentifierLookupDetail>("tc-identifier-lookup", { kind: m.kind, value: m.value, text: m.text, ...(m.carrier ? { carrier: m.carrier } : {}), ...hooks }, { cancelable: true }),
      (signal) => this.resolve?.(m.kind, m.value, signal) ?? null,
    );
    const now = this.identifiers[this.openAt];
    if (!entry || !now || keyOf(now) !== key) return;
    if (entry.status === "error") this.say(this.errorText);
    else if (entry.status === "done") {
      const d = entry.data;
      this.say(d ? [d.title, d.severity ? `${SEVERITY[d.severity].word} severity` : "", d.status].filter(Boolean).join(", ") || "Details loaded" : this.notFoundText);
    }
  }

  private retry(m: IdentifierMatch) {
    this.lookups.forget(keyOf(m));
    this.say("Trying again…");
    void this.lookup(m);
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  private async copy(m: IdentifierMatch) {
    const text = m.value;
    if (!this.emit<IdentifierCopyDetail>("tc-copy", { text, kind: m.kind }, { cancelable: true })) return;
    const ok = await copyText(text);
    this.say(ok ? `Copied ${this.label(m.kind)}` : `Couldn't copy – select ${text} and press Ctrl+C`);
    if (!ok) return;
    this.copied = true;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = false), 1600);
  }

  private onOpen(e: MouseEvent, m: IdentifierMatch, url: string) {
    if (!this.emit<IdentifierOpenDetail>("tc-open", { kind: m.kind, value: m.value, url }, { cancelable: true })) e.preventDefault();
  }

  /* ---------- Render ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The text or kinds changed under an open card: close it if what it was for went away
    if ((changed.has("text") || changed.has("kinds")) && this.openAt >= 0) {
      const was = this.found[this.openAt];
      const now = this.identifiers[this.openAt];
      if (!was || !now || keyOf(was) !== keyOf(now)) {
        if (this.pop.open) this.pop.close("anchor-gone");
        this.closed();
      }
    }
  }

  private renderCard() {
    const m = this.identifiers[this.openAt];
    if (!this.pop.open || !m) return nothing;
    const entry: LookupEntry<IdentifierInfo> = this.lookups.get(keyOf(m)) ?? { status: "loading" };
    const info = entry.status === "done" ? entry.data : null;
    const kindId = `${this.uid}-kind`;
    const valueId = `${this.uid}-value`;
    const facts = factsFor(m).filter((f) => f.value);
    const own = linksFor(m);
    return html`<div
      class="tc-pop ui-idd__pop"
      role="dialog"
      aria-labelledby=${`${kindId} ${valueId}`}
      aria-busy=${entry.status === "loading" ? "true" : "false"}
      data-kind=${m.kind}
      data-status=${entry.status === "done" && !info ? "empty" : entry.status}
    >
      <div class="ui-idd__head">
        <div class="ui-idd__badge" data-kind=${m.kind}>${glyph(ICONS[m.kind], "ui-idd__icon")}</div>
        <div class="ui-idd__id">
          <p class="ui-idd__kind" id=${kindId}>${this.label(m.kind)}</p>
          <div class="ui-idd__row">
            <code class="ui-idd__value" id=${valueId}>${m.value}</code>
            <button type="button" class="ui-idd__copy" title=${this.copied ? "Copied" : "Copy"} ?data-done=${this.copied} @click=${() => void this.copy(m)}>
              ${glyph(this.copied ? checkIcon : copyIcon)}<span class="tc-sr-only">${this.copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
      ${facts.length
        ? html`<dl class="ui-idd__facts">
            ${facts.map((f) => html`<div class="ui-idd__fact"><dt>${f.label}</dt> <dd>${f.value}</dd></div>`)}
          </dl>`
        : nothing}
      <div class="ui-idd__more">${this.renderMore(entry, info, m)}</div>
      ${this.renderLinks(m, [...own, ...(info?.links ?? [])])}
    </div>`;
  }

  private renderMore(entry: LookupEntry<IdentifierInfo>, info: IdentifierInfo | null, m: IdentifierMatch) {
    if (entry.status === "loading")
      return html`<span class="tc-sr-only">Looking up details…</span>
        <span class="ui-idd__line" data-w="title" aria-hidden="true"></span>
        <span class="ui-idd__line" data-w="text" aria-hidden="true"></span>`;
    if (entry.status === "error")
      return html`<p class="ui-idd__msg" data-kind="error">${this.errorText}</p>
        <button type="button" class="tc-btn-sm ui-idd__retry" @click=${() => this.retry(m)}>${glyph(retryIcon)}<span>Retry</span></button>`;
    if (!info) return html`<p class="ui-idd__msg">${this.notFoundText}</p>`;
    const sev = info.severity && SEVERITY[info.severity];
    const score = typeof info.score === "number" && Number.isFinite(info.score) ? info.score.toFixed(1) : "";
    const fields = [
      ...(info.owner ? [{ label: "Owner", value: info.owner }] : []),
      ...(info.asn ? [{ label: "Network", value: info.asn }] : []),
      ...(info.fields ?? []).filter((f) => f && f.label && f.value !== undefined && f.value !== ""),
    ];
    return html`${sev || info.status
        ? html`<p class="ui-idd__chips">
            ${sev ? html`<span class="ui-idd__chip" data-tone=${sev.tone}><span class="ui-idd__dot" aria-hidden="true"></span>${sev.word}${score ? html` <span class="ui-idd__score">${score}</span>` : nothing}<span class="tc-sr-only"> severity</span></span>` : nothing}
            ${info.status ? html`<span class="ui-idd__chip" data-tone="neutral">${info.status}</span>` : nothing}
          </p>`
        : nothing}
      ${info.title ? html`<p class="ui-idd__title">${info.title}</p>` : nothing}
      ${info.summary ? html`<p class="ui-idd__summary">${info.summary}</p>` : nothing}
      ${fields.length
        ? html`<dl class="ui-idd__fields">
            ${fields.map((f) => html`<div class="ui-idd__field"><dt>${f.label}</dt> <dd>${f.value}</dd></div>`)}
          </dl>`
        : nothing}`;
  }

  private renderLinks(m: IdentifierMatch, links: { label: string; url: string }[]) {
    const safe = links.map((l) => ({ label: l.label, url: safeUrl(l.url) })).filter((l): l is { label: string; url: string } => !!l.url && !!l.label);
    if (!safe.length) return nothing;
    return html`<ul class="ui-idd__links" aria-label="Links">
      ${safe.map((l) => {
        const web = /^https?:/i.test(l.url);
        return html`<li>
          <a class="ui-idd__link" href=${l.url} target=${ifDefined(web ? "_blank" : undefined)} rel=${ifDefined(web ? "noopener noreferrer" : undefined)} @click=${(e: MouseEvent) => this.onOpen(e, m, l.url)}
            >${l.label}${web ? html`<span class="tc-sr-only"> (opens in a new tab)</span>${glyph(externalIcon, "ui-idd__ext")}` : nothing}</a
          >
        </li>`;
      })}
    </ul>`;
  }

  protected override render() {
    void this.version;
    const list = this.identifiers;
    const kinds = [...new Set(list.map((m) => m.kind))];
    const body = marks(this.text, list, (seg) => {
      const i = list.indexOf(seg.ranges[0]);
      const m = list[i];
      const open = this.openAt === i && this.pop.open;
      return html`<button
        type="button"
        class="ui-idd__mark"
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
    return html`<div class="ui-idd__text">${body}</div>
      ${this.renderCard()}
      ${kinds.map((k) => html`<span class="tc-sr-only" id=${`${this.uid}-hint-${k}`}>${this.label(k)} details. ${how}</span>`)}
      <span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="idd"] {
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
[data-ui="idd"] *, .ui-idd__pop *, .ui-idd__pop *::before, .ui-idd__pop *::after { box-sizing: border-box; }
:where([data-ui="idd"]) button:not(.tc-btn-sm) { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="idd"]) :is(p, dl, dd, ul) { margin: 0; padding: 0; }
:where([data-ui="idd"]) ul { list-style: none; }
[data-ui="idd"] :is(button, a, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-idd__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-idd__glyph { stroke-width: 1.4; }
.ui-idd__text { white-space: pre-wrap; overflow-wrap: break-word; }
/* ----- The marks ----- */
.ui-idd__mark { display: inline; padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); color: var(--tc-accent-text); font-family: var(--tc-font-mono); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; overflow-wrap: anywhere; word-break: break-all; box-decoration-break: clone; -webkit-box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-idd__mark { background: var(--tc-accent-subtle); text-decoration-color: color-mix(in srgb, var(--tc-accent-text) 45%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-idd__mark:is(:hover, [data-open]) { background: var(--tc-accent-highlight); text-decoration-color: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-idd__mark { padding: 0; text-decoration-style: dotted; text-decoration-thickness: 1.5px; text-decoration-color: color-mix(in srgb, var(--tc-accent-text) 60%, transparent); }
:where([data-look="clean"], [data-look="clean"] *).ui-idd__mark:is(:hover, [data-open]) { background: var(--tc-accent-subtle); text-decoration-color: currentColor; }
.ui-idd__mark:focus-visible { outline-offset: 1px; }
/* ----- The card (internal/popover.ts places it) ----- */
.tc-pop.ui-idd__pop { display: grid; gap: var(--tc-space-3); width: 340px; padding: var(--tc-space-3); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); text-align: left; -webkit-font-smoothing: antialiased; }
.ui-idd__head { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: var(--tc-space-3); align-items: center; }
.ui-idd__badge { display: grid; place-items: center; width: 40px; aspect-ratio: 1; border-radius: var(--tc-radius-md); background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *) .ui-idd__badge { background: var(--tc-fill-subtle); color: var(--tc-icon-muted); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-idd__icon { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.ui-idd__id { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-idd__kind { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-idd__row { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-idd__value { flex: 1; min-width: 0; color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); overflow-wrap: anywhere; word-break: break-all; user-select: all; -webkit-user-select: all; }
.ui-idd__copy { display: grid; place-items: center; flex: none; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-idd__copy:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-idd__copy[data-done] { color: var(--tc-status-success-fg); }
.ui-idd__facts, .ui-idd__fields { display: grid; gap: var(--tc-space-1); }
.ui-idd__facts { padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-idd__fact, .ui-idd__field { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: var(--tc-space-2); align-items: baseline; }
.ui-idd__fact dt, .ui-idd__field dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-idd__fact dd, .ui-idd__field dd { min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
/* What the app knows */
.ui-idd__more { display: grid; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); align-content: start; }
.ui-idd__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-idd__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: 22px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-idd__chip[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-idd__chip[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-idd__chip[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-idd__dot { width: 6px; height: 6px; border-radius: var(--tc-radius-full); background: currentColor; }
.ui-idd__score { font-variant-numeric: tabular-nums; }
.ui-idd__title { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); overflow-wrap: anywhere; }
.ui-idd__summary { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }
.ui-idd__fields { margin-top: var(--tc-space-1); }
.ui-idd__msg { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-idd__msg[data-kind="error"] { color: var(--tc-status-danger-fg); }
.ui-idd__retry { justify-self: start; }
.ui-idd__links { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-idd__link { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); text-decoration: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-idd__link:hover { background: var(--tc-fill-strong); }
.ui-idd__ext { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.9; color: var(--tc-text-muted); }
/* Loading: the shapes of what's coming */
.ui-idd__line { display: block; height: 10px; margin: var(--tc-space-1) 0; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); animation: ui-idd-pulse var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
.ui-idd__line[data-w="title"] { width: 60%; height: 12px; }
.ui-idd__line[data-w="text"] { width: 85%; }
@keyframes ui-idd-pulse { 50% { opacity: 0.5; } }
@media (forced-colors: active) {
  .ui-idd__mark { forced-color-adjust: none; color: LinkText; background: none; text-decoration-color: LinkText; }
  .ui-idd__mark:is(:hover, [data-open]) { outline: 2px solid Highlight; }
  .ui-idd__badge, .ui-idd__link, .ui-idd__chip { border: 1px solid CanvasText; }
}
@media (pointer: coarse) {
  .ui-idd__copy, .ui-idd__link { min-height: var(--tc-control-h-md); min-width: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="idd"] *, .ui-idd__pop, .ui-idd__pop * { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-identifier-details")) customElements.define("tc-identifier-details", TcIdentifierDetails);

declare global {
  interface HTMLElementTagNameMap {
    "tc-identifier-details": TcIdentifierDetails;
  }
}
