import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import type { AnswerClaim, ClaimSource, ClaimSourceType } from "./claim-answer";
import { TcElement } from "./internal/base";
import { sourceSwatch } from "./internal/source-line";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, RowWindowController, ToolbarController } from "./internal/controllers";
import type { Look } from "./internal/look";
import "./validity-badge";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-verification-queue> – every claim worth checking from a session, in one queue, before anything leaves it.
 * Claims arrive from tc-claim-answer ("Send to verification"); a person checks each one outside the model and marks
 * it verified externally, can't verify, incorrect or dismissed, with its source passage beside it. The export stays
 * blocked until the claims are reviewed – the export itself is an event the app handles.
 *   · the list is a listbox: ↑ ↓ Home End PageUp PageDown move, and V C X D mark the claim you're on (U puts it
 *     back), then move on – fast enough for a long session
 *   · the claim you're on shows below the list: its words, where it came from, its confidence and its passages with
 *     their freshness (tc-validity-badge), and the four marks as a toolbar
 *   · long queues render only the rows near the viewport (RowWindowController); 10,000 claims stay smooth
 *
 *   <tc-verification-queue .claims=${claims} .sources=${sources}></tc-verification-queue>
 *
 * Every mark fires a cancelable `tc-claims-change` with the whole list (preventDefault() to own `claims`), then
 * `tc-review`. Export fires `tc-export` only once the gate is open: no more than `allowUnreviewed` claims left to
 * review. Standard sits in a gray tray with a white card; Clean is one white card.
 *
 * A source type can have its own verdicts (`verdicts`): a transcript claim might be "Verified against recording",
 * "Transcript may be inaccurate" or "Dismiss". Each counts under one of the four statuses, so the progress, the
 * filters and the gate work the same; the claim keeps the verdict's id in `verdict`.
 */

/** Where a claim stands: not yet reviewed, or the reviewer's verdict */
export type VerificationStatus = "pending" | "verified" | "unverifiable" | "incorrect" | "dismissed";
/** A claim in the queue – tc-claim-answer's claim, plus where it stands and where in the session it came from */
export type VerificationClaim = AnswerClaim & {
  /** Where it stands (default "pending") */
  status?: VerificationStatus;
  /** Where in the session it came from, e.g. "Turn 3" or "Hub answer" */
  origin?: string;
  /** The id of the verdict given, when its source type has its own verdicts (`verdicts`) */
  verdict?: string;
};
/** A verdict for claims of one source type, in that type's own words – counted under one of the four statuses */
export type VerificationVerdict = {
  /** Kept on the claim as `verdict`, e.g. "misrepresents" */
  id: string;
  /** The button's words, e.g. "Misrepresents source" */
  label: string;
  /** The status it counts as */
  status: Exclude<VerificationStatus, "pending">;
  /** The single key that gives it on the list; unset, the first verdict of each status takes that status's key (V C X D) */
  key?: string;
};
export type VerificationClaimsChange = { claims: VerificationClaim[]; claim: VerificationClaim; status: VerificationStatus; verdict?: VerificationVerdict };
export type VerificationReviewDetail = { claim: VerificationClaim; status: VerificationStatus; previous: VerificationStatus; verdict?: VerificationVerdict };
export type VerificationCounts = Record<VerificationStatus, number>;
export type VerificationExportDetail = { claims: VerificationClaim[]; counts: VerificationCounts };
export type VerificationFilter = "open" | "reviewed" | "all";
export type VerificationFilterChange = { filter: VerificationFilter };

/* After Lucide: file-check – the header's icon */
const headIcon = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="m9 15 2 2 4-4"></path>`;
const VERDICTS: Exclude<VerificationStatus, "pending">[] = ["verified", "unverifiable", "incorrect", "dismissed"];
const STATUSES: VerificationStatus[] = ["pending", ...VERDICTS];
const DEFAULT_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: "To review",
  verified: "Verified externally",
  unverifiable: "Can't verify",
  incorrect: "Incorrect",
  dismissed: "Dismissed",
};
/** The short form on the toolbar buttons */
const DEFAULT_ACTION_LABELS: Record<Exclude<VerificationStatus, "pending">, string> = { verified: "Verified", unverifiable: "Can't verify", incorrect: "Incorrect", dismissed: "Dismiss" };
/** The key that puts a claim back to review */
const UNDO_KEY = "u";
const KEY_OF: Record<Exclude<VerificationStatus, "pending">, string> = { verified: "V", unverifiable: "C", incorrect: "X", dismissed: "D" };
const DEFAULT_SOURCE_LABELS: Record<ClaimSourceType, string> = {
  grounded: "Sourced",
  model: "Model knowledge",
  inferred: "Inferred",
  transcript: "Transcript",
  video: "Video",
  audio: "Audio",
  image: "Image",
  ocr: "OCR",
  session: "Earlier session",
  team: "Team knowledge",
  agent: "Agent finding",
};
const FILTERS: VerificationFilter[] = ["open", "reviewed", "all"];
const FILTER_LABELS: Record<VerificationFilter, string> = { open: "To review", reviewed: "Reviewed", all: "All" };

/** More rows than this render only the ones near the viewport */
const WINDOW_FROM = 60;
const OVERSCAN = 20;
const ROW_H = 40;
let instances = 0;

/* ---------- Status glyphs: a different shape for each, so they read without colour ---------- */

const glyph = (status: VerificationStatus, look: Look) => {
  const w = look === "clean" ? 1.2 : 1.5;
  const cut = (d: string) => svg`<path d=${d} class="ui-vq__cut" stroke-width=${w + 0.1} stroke-linecap="round" stroke-linejoin="round" fill="none"></path>`;
  const inner =
    status === "pending" ? svg`<circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width=${w} stroke-dasharray="2.2 2"></circle>`
    : status === "verified" ? svg`<circle cx="8" cy="8" r="6.5" fill="currentColor"></circle>${cut("m5.2 8.2 1.9 1.9 3.7-3.9")}`
    : status === "unverifiable" ? svg`<circle cx="8" cy="8" r="6.5" fill="currentColor"></circle>${cut("M6.4 6.4a1.7 1.7 0 1 1 2.3 1.6c-.5.2-.7.6-.7 1.1M8 11.2v.1")}`
    : status === "incorrect" ? svg`<circle cx="8" cy="8" r="6.5" fill="currentColor"></circle>${cut("m5.8 5.8 4.4 4.4m0-4.4-4.4 4.4")}`
    : svg`<circle cx="8" cy="8" r="5.8" fill="none" stroke="currentColor" stroke-width=${w}></circle><path d="M5.4 8h5.2" stroke="currentColor" stroke-width=${w} stroke-linecap="round"></path>`;
  return html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${inner}</svg>`;
};
const exportIcon = (look: Look) =>
  look === "clean"
    ? html`<svg viewBox="0 0 16 16" class="ui-vq__icon" aria-hidden="true">${svg`<path d="M8 2.75v7M5.25 5.5 8 2.75l2.75 2.75M3.25 9.5v2.25c0 .83.67 1.5 1.5 1.5h6.5c.83 0 1.5-.67 1.5-1.5V9.5"></path>`}</svg>`
    : html`<svg viewBox="0 0 12 12" width="12" height="12" fill="none" aria-hidden="true">${svg`<path d="M6 1.75v5.5M3.75 4 6 1.75 8.25 4M2 7.5v1.75c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const lockIcon = (look: Look) =>
  look === "clean"
    ? html`<svg viewBox="0 0 16 16" class="ui-vq__icon" aria-hidden="true">${svg`<path d="M4.75 7.25h6.5c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-6.5c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1ZM5.75 7.25V5.5a2.25 2.25 0 0 1 4.5 0v1.75"></path>`}</svg>`
    : html`<svg viewBox="0 0 12 12" width="12" height="12" fill="none" aria-hidden="true">${svg`<path d="M3 5.25h6c.41 0 .75.34.75.75v3.25c0 .41-.34.75-.75.75H3a.75.75 0 0 1-.75-.75V6c0-.41.34-.75.75-.75ZM4 5.25V3.75a2 2 0 1 1 4 0v1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;

const statusOf = (c: VerificationClaim): VerificationStatus => c.status ?? "pending";

/**
 * The claims collected across a session, each marked verified externally, can't verify, incorrect or dismissed
 * with its source passage beside it, and an export that stays blocked until they're reviewed.
 * @tag tc-verification-queue
 * @fires tc-claims-change - A claim was marked; detail `{ claims, claim, status }` (VerificationClaimsChange) – the whole list after the change. Cancelable.
 * @fires tc-review - A claim was marked (after tc-claims-change, whether or not that was prevented); detail `{ claim, status, previous }` (VerificationReviewDetail)
 * @fires tc-filter-change - A filter button was pressed; detail `{ filter }` (VerificationFilterChange). Cancelable.
 * @fires tc-export - Export was pressed with the gate open; detail `{ claims, counts }` (VerificationExportDetail)
 */
export class TcVerificationQueue extends TcElement {
  static override ui = "vq";

  /** The claims in the queue, in the order they arrived; each one's `status` says where it stands */
  @property({ attribute: false }) accessor claims: VerificationClaim[] = [];
  /** The passages the claims rest on, looked up by id */
  @property({ attribute: false }) accessor sources: ClaimSource[] = [];
  /** The heading, and the region's name */
  @property() accessor heading = "Verification queue";
  /** How many claims may be left to review with the export still allowed (default 0: every claim) */
  @property({ type: Number, attribute: "allow-unreviewed" }) accessor allowUnreviewed = 0;
  /** The export button */
  @property({ attribute: "export-label" }) accessor exportLabel = "Export";
  /** Single-key marks on the list (V C X D U); false turns them off */
  @property({ type: Boolean }) accessor shortcuts = true;
  /** The tallest the list grows, in px, before it scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 320;
  /** The moment source freshness is counted to (epoch ms), passed to every validity badge */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The names of the statuses – in place of To review, Verified externally, Can't verify, Incorrect and Dismissed */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<VerificationStatus, string>> = {};
  /** The short labels on the toolbar's buttons – in place of Verified, Can't verify, Incorrect and Dismiss */
  @property({ attribute: false }) accessor actionLabels: Partial<Record<Exclude<VerificationStatus, "pending">, string>> = {};
  /** The names of the source types, as tc-claim-answer's `sourceLabels` */
  @property({ attribute: false }) accessor sourceLabels: Partial<Record<ClaimSourceType, string>> = {};
  /** Verdicts for particular source types, in their own words – e.g. `{ ocr: [{ id: "confirmed", label: "Confirmed against original", status: "verified" }, { id: "misread", label: "OCR misread", status: "incorrect" }] }`. Types without an entry keep the four marks */
  @property({ attribute: false }) accessor verdicts: Partial<Record<ClaimSourceType, VerificationVerdict[]>> = {};
  /** What the list shows: the claims still to review, the reviewed ones, or all */
  @property() accessor filter: VerificationFilter = "open";

  /** @internal The claim the list's tab stop and the detail are on */
  @state() accessor active: string | null = null;
  /** @internal A polite message for screen readers */
  @state() accessor said = "";

  private readonly uid = `tc-vq${++instances}`;
  private readonly win: RowWindowController;
  private readonly tools: ToolbarController;
  private shown: VerificationClaim[] = [];
  private shownIndex = new Map<string, number>();
  private builtFrom: [VerificationClaim[], VerificationFilter] | null = null;
  private focusRow: string | null = null;
  private ownName = false;

  constructor() {
    super();
    this.win = new RowWindowController(this, {
      count: () => this.shown.length,
      body: () => this.querySelector(".ui-vq__rows"),
      rowSelector: ".ui-vq__row",
      from: WINDOW_FROM,
      overscan: OVERSCAN,
      rowHeight: ROW_H,
    });
    this.tools = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-vq__mark")] });
    // A row that leaves the list (marked while showing "To review") hands focus to the row now in its place
    new FocusRescueController(this, () => this.rowEl(this.active) ?? this.querySelector<HTMLElement>(".ui-vq__filter[aria-pressed='true']"));
  }

  /** How many claims there are in each status */
  get counts(): VerificationCounts {
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as VerificationCounts;
    for (const c of this.claims) counts[statusOf(c)]++;
    return counts;
  }

  /** The export is allowed: no more than `allowUnreviewed` claims are left to review */
  get exportReady() {
    return this.claims.length > 0 && this.counts.pending <= this.allowUnreviewed;
  }

  private label(s: VerificationStatus) {
    return this.statusLabels[s] ?? DEFAULT_STATUS_LABELS[s];
  }

  /** The marks a claim can be given: its source type's own verdicts, or the four, each with its key */
  private optionsFor(c: VerificationClaim): (VerificationVerdict & { own: boolean })[] {
    const own = c.source ? this.verdicts[c.source] : undefined;
    if (!own?.length) return VERDICTS.map((s) => ({ id: s, label: this.actionLabels[s] ?? DEFAULT_ACTION_LABELS[s], status: s, key: KEY_OF[s], own: false }));
    const taken = new Set(own.map((v) => v.key?.toUpperCase()).filter(Boolean));
    const seen = new Set<VerificationStatus>();
    return own.map((v) => {
      let key = v.key?.toUpperCase();
      if (!key && !seen.has(v.status) && !taken.has(KEY_OF[v.status])) key = KEY_OF[v.status];
      seen.add(v.status);
      return { ...v, key, own: true };
    });
  }

  /** The option a claim's mark shows as given: its verdict, or the first option of its status */
  private givenOf(c: VerificationClaim, options = this.optionsFor(c)) {
    const status = statusOf(c);
    if (status === "pending") return undefined;
    return options.find((o) => o.own && o.id === c.verdict) ?? options.find((o) => o.status === status);
  }

  /** What a claim's mark is called: its verdict's words, or its status's */
  private markLabel(c: VerificationClaim) {
    const given = this.givenOf(c);
    return given?.own ? given.label : this.label(statusOf(c));
  }

  private rowEl(id: string | null | undefined) {
    return id ? this.querySelector<HTMLElement>(`.ui-vq__row[data-id="${CSS.escape(id)}"]`) : null;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const [claims, filter] = this.builtFrom ?? [];
    if (claims !== this.claims || filter !== this.filter) {
      this.builtFrom = [this.claims, this.filter];
      const keep = (c: VerificationClaim) => (this.filter === "all" ? true : this.filter === "open" ? statusOf(c) === "pending" : statusOf(c) !== "pending");
      this.shown = this.claims.filter(keep);
      this.shownIndex = new Map(this.shown.map((c, i) => [c.id, i]));
    }
    if (!this.active || !this.shownIndex.has(this.active)) this.active = this.shown[0]?.id ?? null;
    this.win.compute();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    this.style.setProperty("--tc-verification-queue-max", `${this.maxHeight}px`);
    if (this.focusRow) {
      const el = this.rowEl(this.focusRow);
      const i = this.shownIndex.get(this.focusRow);
      if (el) {
        this.focusRow = null;
        el.focus({ preventScroll: true });
        el.scrollIntoView?.({ block: "nearest" });
      } else if (i !== undefined) this.win.reveal(i);
      else this.focusRow = null;
    }
  }

  /* ---------- Marking ---------- */

  /** Marks a claim – with one of its type's own verdicts when given; returns false when it was already so */
  private mark(id: string, status: VerificationStatus, from: "list" | "toolbar", verdict?: VerificationVerdict) {
    const claim = this.claims.find((c) => c.id === id);
    if (!claim) return false;
    const previous = statusOf(claim);
    const verdictId = status === "pending" ? undefined : verdict?.id;
    if (previous === status && claim.verdict === verdictId) return false;
    // In the list, the next claim takes the tab stop (in "To review" the marked one leaves, so it's the one after)
    const at = this.shownIndex.get(id) ?? -1;
    const next = this.shown[at + 1]?.id ?? this.shown[at - 1]?.id ?? null;
    const { verdict: _was, ...rest } = claim;
    const updated: VerificationClaim = verdictId ? { ...rest, status, verdict: verdictId } : { ...rest, status };
    const claims = this.claims.map((c) => (c.id === id ? updated : c));
    const given = verdictId ? verdict : undefined;
    if (this.emit<VerificationClaimsChange>("tc-claims-change", { claims, claim: updated, status, verdict: given }, { cancelable: true })) this.claims = claims;
    this.emit<VerificationReviewDetail>("tc-review", { claim: updated, status, previous, verdict: given });
    const counts = this.countsOf(this.claims);
    const reviewed = this.claims.length - counts.pending;
    this.said = `${given?.label ?? this.label(status)}: ${claim.text.trim()} – ${reviewed} of ${this.claims.length} reviewed`;
    if (from === "list") {
      const stays = this.filter === "all" || (this.filter === "open") === (status === "pending");
      const to = stays ? (next ?? id) : next;
      if (to) {
        this.active = to;
        this.focusRow = to;
      }
    }
    return true;
  }

  private setFilter(next: VerificationFilter) {
    if (next !== this.filter && this.emit<VerificationFilterChange>("tc-filter-change", { filter: next }, { cancelable: true })) this.filter = next;
  }

  private countsOf(claims: VerificationClaim[]) {
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as VerificationCounts;
    for (const c of claims) counts[statusOf(c)]++;
    return counts;
  }

  private exportNow() {
    if (!this.exportReady) {
      const left = this.counts.pending - this.allowUnreviewed;
      this.said = `Review ${left} more ${left === 1 ? "claim" : "claims"} before exporting.`;
      const first = this.claims.find((c) => statusOf(c) === "pending");
      if (first) {
        this.setFilter("open");
        this.active = first.id;
        this.focusRow = first.id;
      }
      return;
    }
    this.emit<VerificationExportDetail>("tc-export", { claims: this.claims, counts: this.counts });
    this.said = "Exported.";
  }

  /* ---------- Keyboard ---------- */

  private moveTo(i: number) {
    const c = this.shown[Math.max(0, Math.min(this.shown.length - 1, i))];
    if (!c) return;
    this.active = c.id;
    this.focusRow = c.id;
  }

  private onListKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const at = this.active ? (this.shownIndex.get(this.active) ?? 0) : 0;
    const page = Math.max(1, Math.floor(this.maxHeight / this.win.rowHeight) - 1);
    const to =
      e.key === "ArrowDown" ? at + 1
      : e.key === "ArrowUp" ? at - 1
      : e.key === "Home" ? 0
      : e.key === "End" ? this.shown.length - 1
      : e.key === "PageDown" ? at + page
      : e.key === "PageUp" ? at - page
      : null;
    if (to !== null) {
      e.preventDefault();
      this.moveTo(to);
      return;
    }
    if (!this.shortcuts || e.shiftKey || !this.active) return;
    const claim = this.claims.find((c) => c.id === this.active);
    if (!claim) return;
    const k = e.key.toUpperCase();
    const option = k.length === 1 ? this.optionsFor(claim).find((o) => o.key === k) : undefined;
    if (option) {
      e.preventDefault();
      this.mark(claim.id, option.status, "list", option.own ? option : undefined);
    } else if (e.key.toLowerCase() === UNDO_KEY) {
      e.preventDefault();
      this.mark(claim.id, "pending", "list");
    }
  };

  /* ---------- Parts ---------- */

  private head() {
    const total = this.claims.length;
    const counts = this.counts;
    const reviewed = total - counts.pending;
    const pct = total ? Math.round((reviewed / total) * 100) : 0;
    // The header (.tc-head): on the tray in Standard, the card's first row in Clean; under the title, how many are
    // reviewed, as a bar coloured by verdict and in words
    return cardHead({
      icon: headIcon,
      title: this.heading,
      subtitle: html`<span class="ui-vq__reviewed">
        <span class="ui-vq__progress" .role=${"progressbar"} aria-label="Reviewed" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct} aria-valuetext=${`${reviewed} of ${total} reviewed`}>
          ${VERDICTS.map((s) => (counts[s] ? html`<span class="ui-vq__progress-part" data-status=${s} style=${styleMap({ flexGrow: String(counts[s]) })}></span>` : nothing))}
          ${counts.pending ? html`<span class="ui-vq__progress-rest" style=${styleMap({ flexGrow: String(counts.pending) })}></span>` : nothing}
        </span>
        <span class="ui-vq__progress-text">${reviewed} of ${total} reviewed</span>
      </span>`,
    });
  }

  private filters() {
    const counts = this.counts;
    const n: Record<VerificationFilter, number> = { open: counts.pending, reviewed: this.claims.length - counts.pending, all: this.claims.length };
    return html`<div class="ui-vq__filters" role="group" aria-label="Show">${FILTERS.map(
      (f) => html`<button
        type="button"
        class="ui-vq__filter"
        aria-pressed=${this.filter === f ? "true" : "false"}
        @click=${() => this.setFilter(f)}
      >${FILTER_LABELS[f]}<span class="ui-vq__filter-n">${n[f]}</span></button>`,
    )}</div>`;
  }

  private row(c: VerificationClaim, i: number, look: Look, top?: number) {
    const status = statusOf(c);
    const selected = this.active === c.id;
    return html`<div
      role="option"
      id=${`${this.uid}-${i}`}
      class="ui-vq__row"
      data-id=${c.id}
      data-status=${status}
      aria-selected=${selected ? "true" : "false"}
      aria-posinset=${i + 1}
      aria-setsize=${this.shown.length}
      tabindex=${selected ? 0 : -1}
      ?data-float=${top !== undefined}
      style=${styleMap({ top: top === undefined ? undefined : `${top}px` })}
      @click=${() => {
        this.active = c.id;
        this.focusRow = c.id;
      }}
    >
      <span class="ui-vq__status" data-status=${status}>${glyph(status, look)}</span>
      <span class="ui-vq__text">${c.text.trim()}</span>
      ${c.origin ? html`<span class="ui-vq__origin">${c.origin}</span>` : nothing}
      ${c.source ? html`<span class="ui-vq__src" data-source=${c.source} title=${this.sourceLabels[c.source] ?? DEFAULT_SOURCE_LABELS[c.source]}>${sourceSwatch(c.source, "ui-vq__swatch")}</span>` : nothing}
      <span class="tc-sr-only">, ${this.markLabel(c)}${c.source ? `, ${this.sourceLabels[c.source] ?? DEFAULT_SOURCE_LABELS[c.source]}` : ""}</span>
    </div>`;
  }

  private rows(look: Look) {
    const win = this.win;
    const shown = this.shown;
    if (!win.virtual) return repeat(shown, (c) => c.id, (c, i) => this.row(c, i, look));
    // Two spacers that stay in place, the window between them; the active row stays rendered (out of the flow,
    // where it would be) while it's outside the window, so it keeps focus
    const a = this.active ? (this.shownIndex.get(this.active) ?? -1) : -1;
    const kept = a >= 0 && (a < win.start || a >= win.end) ? [a] : [];
    const h = win.rowHeight;
    const idx = [...kept, ...Array.from({ length: win.end - win.start }, (_, k) => win.start + k)].sort((x, y) => x - y);
    return html`<div class="ui-vq__spacer" aria-hidden="true" style=${styleMap({ height: `${win.start * h}px` })}></div>
      ${repeat(idx, (n) => shown[n].id, (n) => this.row(shown[n], n, look, n < win.start || n >= win.end ? n * h : undefined))}
      <div class="ui-vq__spacer" aria-hidden="true" style=${styleMap({ height: `${(shown.length - win.end) * h}px` })}></div>`;
  }

  private empty() {
    const text = !this.claims.length
      ? "Nothing to verify yet – claims sent from an answer show up here."
      : this.filter === "open"
        ? "Every claim is reviewed."
        : "No claims reviewed yet.";
    return html`<p class="ui-vq__empty">${text}</p>`;
  }

  private detail(look: Look): TemplateResult | typeof nothing {
    const c = this.active ? this.claims.find((x) => x.id === this.active) : null;
    if (!c) return nothing;
    const status = statusOf(c);
    const byId = new Map(this.sources.map((s) => [s.id, s]));
    const passages = (c.sources ?? []).map((id) => byId.get(id)).filter((s): s is ClaimSource => !!s);
    const typeLabel = c.source ? (this.sourceLabels[c.source] ?? DEFAULT_SOURCE_LABELS[c.source]) : "";
    const options = this.optionsFor(c);
    const given = this.givenOf(c, options);
    return html`<section class="ui-vq__detail" aria-label="Claim to review">
      <div class="ui-vq__dt-meta">
        ${c.source ? html`<span class="ui-vq__type" data-source=${c.source}>${sourceSwatch(c.source, "ui-vq__type-swatch")}${typeLabel}${c.recognition !== undefined ? html`<span class="ui-vq__recog">${Math.round(c.recognition * 100)}%</span>` : nothing}</span>` : nothing}
        ${c.confidence !== undefined ? html`<span class="ui-vq__meta-text">${Math.round(c.confidence * 100)}% confidence</span>` : nothing}
        ${c.origin ? html`<span class="ui-vq__meta-text"><span class="ui-vq__dot">·</span> ${c.origin}</span>` : nothing}
        <span class="ui-vq__now" data-status=${status}>${glyph(status, look)}${this.markLabel(c)}</span>
      </div>
      <p class="ui-vq__claim">${c.text.trim()}</p>
      ${c.note ? html`<p class="ui-vq__note">${c.note}</p>` : nothing}
      ${passages.length
        ? html`<ul class="ui-vq__passages" aria-label="Source passages">${passages.map(
            (s) => html`<li class="ui-vq__passage">
              <div class="ui-vq__ps-head">
                <span class="ui-vq__ps-name">${safeUrl(s.url) ? html`<a href=${ifDefined(safeUrl(s.url))} target="_blank" rel="noreferrer noopener">${s.site ?? s.title}</a>` : (s.site ?? s.title)}${s.date ? html`<span class="ui-vq__ps-date"> · ${s.date}</span>` : nothing}</span>
                ${s.validity
                  ? html`<tc-validity-badge
                      hide-age
                      .look=${look}
                      .observed=${s.validity.observed}
                      .profile=${s.validity.profile ?? "standard"}
                      .band=${s.validity.band}
                      .contested=${!!s.validity.contested}
                      .superseded=${!!s.validity.superseded}
                      .changed=${!!s.validity.changed}
                      .now=${this.now}
                      subject-label="source"
                    ></tc-validity-badge>`
                  : nothing}
              </div>
              ${s.quote ? html`<blockquote class="ui-vq__quote">${s.quote}</blockquote>` : html`<p class="ui-vq__note">${s.title}</p>`}
            </li>`,
          )}</ul>`
        : html`<p class="ui-vq__note">No source passage – check it against your own sources.</p>`}
      <div class="ui-vq__marks" role="toolbar" aria-label="Mark this claim" @keydown=${this.tools.onKeyDown} @focusin=${this.tools.onFocusIn}>
        ${options.map((o) => {
          const pressed = given?.id === o.id;
          const key = this.shortcuts ? o.key : undefined;
          return html`<button
            type="button"
            class="ui-vq__mark"
            data-status=${o.status}
            data-verdict=${ifDefined(o.own ? o.id : undefined)}
            aria-pressed=${pressed ? "true" : "false"}
            aria-keyshortcuts=${ifDefined(key)}
            @click=${() => (pressed ? this.mark(c.id, "pending", "toolbar") : this.mark(c.id, o.status, "toolbar", o.own ? o : undefined))}
          ><span class="ui-vq__mark-glyph" data-status=${o.status}>${glyph(o.status, look)}</span>${o.label}${key ? html`<kbd class="ui-vq__kbd" aria-hidden="true">${key}</kbd>` : nothing}</button>`;
        })}
      </div>
    </section>`;
  }

  private foot(look: Look) {
    const counts = this.counts;
    const ready = this.exportReady;
    const left = Math.max(0, counts.pending - this.allowUnreviewed);
    const gateId = `${this.uid}-gate`;
    const summary = VERDICTS.filter((s) => counts[s]).map((s) => `${counts[s]} ${this.label(s).toLowerCase()}`);
    const message = !this.claims.length
      ? "Nothing to export yet"
      : ready
        ? counts.pending
          ? `Ready – ${counts.pending} left unreviewed`
          : `All reviewed${summary.length ? ` – ${summary.join(", ")}` : ""}`
        : `Review ${left} more ${left === 1 ? "claim" : "claims"} to export`;
    return html`<div class="ui-vq__foot" ?data-ready=${ready}>
      <span class="ui-vq__gate" id=${gateId}>${ready ? nothing : html`<span class="ui-vq__lock">${lockIcon(look)}</span>`}<span class="ui-vq__gate-text">${message}</span></span>
      <button type="button" class="ui-vq__export" aria-disabled=${ready ? "false" : "true"} aria-describedby=${gateId} @click=${() => this.exportNow()}>${exportIcon(look)}${this.exportLabel}</button>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const shown = this.shown;
    return html`
      ${this.head()}
      <div class=${clean ? "ui-vq__body" : "ui-vq__card"}>
        ${this.filters()}
        ${shown.length
          ? html`<div
              class="ui-vq__rows"
              role="listbox"
              aria-label=${`Claims – ${FILTER_LABELS[this.filter].toLowerCase()}`}
              @keydown=${this.onListKey}
            >${this.rows(look)}</div>`
          : this.empty()}
        ${this.detail(look)}
      </div>
      ${this.foot(look)}
      <span class="tc-sr-only" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="vq"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="vq"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="vq"] { overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-weight: var(--tc-font-weight-regular); }
[data-ui="vq"] *, [data-ui="vq"] *::before, [data-ui="vq"] *::after { box-sizing: border-box; }
:where([data-ui="vq"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="vq"] :is(button, a, [role="option"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="vq"] svg { display: block; flex: none; }
.ui-vq__icon { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
.ui-vq__dot { color: var(--tc-text-disabled); }
/* Status colours; the glyph shapes carry the meaning too */
[data-ui="vq"] [data-status="pending"] { --tc-verification-queue-fg: var(--tc-text-muted); }
[data-ui="vq"] [data-status="verified"] { --tc-verification-queue-fg: var(--tc-status-success-fg); --tc-verification-queue-bg: var(--tc-status-success-bg); }
[data-ui="vq"] [data-status="unverifiable"] { --tc-verification-queue-fg: var(--tc-status-warning-fg); --tc-verification-queue-bg: var(--tc-status-warning-bg); }
[data-ui="vq"] [data-status="incorrect"] { --tc-verification-queue-fg: var(--tc-status-danger-fg); --tc-verification-queue-bg: var(--tc-status-danger-bg); }
[data-ui="vq"] [data-status="dismissed"] { --tc-verification-queue-fg: var(--tc-text-muted); --tc-verification-queue-bg: var(--tc-fill-default); }
[data-ui="vq"] [data-source="grounded"] { --tc-verification-queue-src: var(--tc-source-grounded-fg); --tc-verification-queue-src-bg: var(--tc-source-grounded-bg); }
[data-ui="vq"] [data-source="model"] { --tc-verification-queue-src: var(--tc-source-model-fg); --tc-verification-queue-src-bg: var(--tc-source-model-bg); }
[data-ui="vq"] [data-source="inferred"] { --tc-verification-queue-src: var(--tc-source-inferred-fg); --tc-verification-queue-src-bg: var(--tc-source-inferred-bg); }
/* Media types share teal, memory types blue – as in tc-claim-answer */
[data-ui="vq"] :is([data-source="transcript"], [data-source="video"], [data-source="audio"], [data-source="image"], [data-source="ocr"]) { --tc-verification-queue-src: var(--tc-source-media-fg); --tc-verification-queue-src-bg: var(--tc-source-media-bg); }
[data-ui="vq"] :is([data-source="session"], [data-source="team"], [data-source="agent"]) { --tc-verification-queue-src: var(--tc-source-memory-fg); --tc-verification-queue-src-bg: var(--tc-source-memory-bg); }
/* The type's line, drawn as tc-claim-answer draws it */
:is(.ui-vq__swatch, .ui-vq__type-swatch) { flex: none; width: 12px; height: 6px; overflow: visible; fill: none; stroke: var(--tc-verification-queue-src); stroke-width: 2; }
:is(.ui-vq__swatch, .ui-vq__type-swatch) [data-line="dotted"] { stroke-linecap: round; }
:is(.ui-vq__swatch, .ui-vq__type-swatch) [data-line="double"] { stroke-width: 1.2; }
:is(.ui-vq__swatch, .ui-vq__type-swatch) [data-line="wavy"] { stroke-width: 1.5; stroke-linecap: round; }
/* The glyphs' marks are cut out in the colour of the surface under them */
.ui-vq__cut { stroke: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="vq"] .ui-vq__cut { stroke: var(--tc-surface-on-tray); }

/* ----- The header's line under the title: the progress bar and how many are reviewed ----- */
.ui-vq__reviewed { display: flex; align-items: center; gap: var(--tc-space-2-5); }
.ui-vq__progress-text { flex: none; font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-vq__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-vq__progress { flex: 1; display: flex; gap: var(--tc-space-0-5); height: 4px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-vq__progress-part { flex: 0 1 0; min-width: 2px; background: var(--tc-verification-queue-fg); transition: flex-grow var(--tc-duration-slow) var(--tc-ease-move); }
.ui-vq__progress-rest { flex: 0 1 0; }

/* ----- The card ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-vq__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-vq__filters { display: flex; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-2-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-vq__filter { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-vq__filter:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-vq__filter[aria-pressed="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-vq__filter-n { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }

/* ----- The list: a scrolling listbox, windowed between two spacers that stay in place ----- */
.ui-vq__rows { position: relative; max-height: var(--tc-verification-queue-max, 320px); overflow-y: auto; overflow-anchor: none; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong) transparent; padding: var(--tc-space-1) 0; }
.ui-vq__rows:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width, 2px) * -1); }
.ui-vq__spacer { flex: none; }
.ui-vq__row { position: relative; display: flex; align-items: center; gap: var(--tc-space-2-5); height: ${ROW_H}px; margin: 0 var(--tc-space-1-5); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-md); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-vq__row[data-float] { position: absolute; left: 0; right: 0; }
.ui-vq__row:hover { background: var(--tc-fill-subtle); }
.ui-vq__row[aria-selected="true"] { background: var(--tc-fill-default); }
.ui-vq__row[aria-selected="true"]::before { content: ""; position: absolute; top: 10px; bottom: 10px; left: 0; width: 2px; border-radius: var(--tc-radius-full); background: var(--tc-accent); }
.ui-vq__status { display: grid; flex: none; place-items: center; color: var(--tc-verification-queue-fg); }
.ui-vq__text { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-primary); }
.ui-vq__row[data-status="dismissed"] .ui-vq__text { color: var(--tc-text-muted); text-decoration: line-through; text-decoration-color: var(--tc-border-default); }
.ui-vq__origin { flex: none; max-width: 30%; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-vq__src { display: grid; flex: none; place-items: center; }
.ui-vq__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }

/* ----- The claim you're on ----- */
.ui-vq__detail { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-vq__detail { background: var(--tc-surface-well); }
.ui-vq__dt-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-height: 22px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-vq__type { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-verification-queue-src-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-verification-queue-src); white-space: nowrap; }
.ui-vq__type .ui-vq__type-swatch { width: 11px; height: 5px; }
.ui-vq__recog { font-variant-numeric: tabular-nums; }
.ui-vq__meta-text { white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-vq__now { display: inline-flex; align-items: center; gap: var(--tc-space-1); margin-left: auto; font-weight: var(--tc-font-weight-medium); color: var(--tc-verification-queue-fg); white-space: nowrap; }
.ui-vq__claim { margin: var(--tc-space-2) 0 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-vq__claim { font-weight: var(--tc-font-weight-medium); }
.ui-vq__note { margin: var(--tc-space-1) 0 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-vq__passages { display: grid; gap: var(--tc-space-2-5); margin: var(--tc-space-2-5) 0 0; padding: 0; list-style: none; }
.ui-vq__passage { min-width: 0; }
.ui-vq__ps-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-vq__ps-name { flex: 1 1 120px; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-vq__ps-name a { color: inherit; text-decoration: underline; text-decoration-color: var(--tc-border-default); text-underline-offset: 2px; }
.ui-vq__ps-date { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-vq__quote { margin: var(--tc-space-1-5) 0 0; padding: 0 0 0 var(--tc-space-2-5); border-left: 2px solid var(--tc-border-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
/* The four marks: a toolbar of toggle buttons, the chosen one tinted in its status colour */
.ui-vq__marks { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); margin-top: var(--tc-space-3); }
.ui-vq__mark { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-vq__mark { height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); }
.ui-vq__mark:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-vq__mark[aria-pressed="true"] { background: var(--tc-verification-queue-bg); box-shadow: inset 0 0 0 1px var(--tc-verification-queue-fg); color: var(--tc-text-primary); }
.ui-vq__mark-glyph { display: grid; place-items: center; color: var(--tc-verification-queue-fg); }
.ui-vq__mark[aria-pressed="true"] .ui-vq__cut { stroke: var(--tc-verification-queue-bg); }
.ui-vq__kbd { display: inline-grid; place-items: center; min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-family: inherit; font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-text-muted); }

/* ----- The export gate ----- */
.ui-vq__foot { display: flex; align-items: center; gap: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-vq__foot { min-height: 44px; padding: var(--tc-space-1-5) var(--tc-space-1) 0 var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-vq__foot { min-height: 52px; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-vq__gate { display: flex; flex: 1; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-vq__gate-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-vq__lock { display: grid; flex: none; place-items: center; color: var(--tc-text-muted); }
.ui-vq__foot[data-ready] .ui-vq__gate { color: var(--tc-status-success-fg); }
/* Export: the library's primary button; blocked, it stays focusable and says why */
.ui-vq__export { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow, none); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-vq__export:hover { background: var(--tc-action-primary-bg-hover, var(--tc-action-primary-bg)); }
.ui-vq__export[aria-disabled="true"] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-muted); cursor: not-allowed; }
@container (max-width: 400px) {
  .ui-vq__origin { display: none; }
  .ui-vq__kbd { display: none; }
  .ui-vq__foot { flex-wrap: wrap; }
  .ui-vq__gate { flex-basis: 100%; }
  .ui-vq__gate-text { white-space: normal; }
  .ui-vq__export { margin-left: auto; }
}
@media (pointer: coarse) {
  .ui-vq__filter { height: 32px; }
  .ui-vq__mark { height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="vq"] *, [data-ui="vq"] *::before, [data-ui="vq"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-verification-queue")) customElements.define("tc-verification-queue", TcVerificationQueue);

declare global {
  interface HTMLElementTagNameMap {
    "tc-verification-queue": TcVerificationQueue;
  }
}
