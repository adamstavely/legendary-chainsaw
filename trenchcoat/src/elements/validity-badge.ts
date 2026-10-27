import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import type { Look } from "./internal/look";

/*
 * <tc-validity-badge> – how fresh a piece of evidence is. Evidence ages: from the moment it was observed it moves
 * through four bands – high, good, aging, stale – at the pace of its decay profile (a price goes stale in a month, a
 * reference work in years). It can also be contested (other evidence disputes it) or superseded (something newer
 * replaces it), whatever its age – and it can have changed since someone used it (the app knows; the badge says so
 * in blue, with a sentence on what to do).
 *   · badge (the default): change-summary's tone mark – a small tinted square holding four signal bars, as many
 *     filled as the band is fresh – then the band and the age in words ("Aging · 8 mo. ago")
 *   · strip: a margin strip for a document – one bar per paragraph, aligned with the paragraphs of the element
 *     `for` names (or stacked on its own), each saying its band on hover and focus
 *
 *   <tc-validity-badge observed="2026-03-02" profile="fast" contested></tc-validity-badge>
 *   <tc-validity-badge mode="strip" for="report" .items=${[{ observed: "2026-09-01" }, { observed: "2025-01-10" }]}>
 *   </tc-validity-badge>
 *
 * The band is worked out from `observed`, the profile and `now` – read once when the element connects, never while
 * it renders; set `now` to look at the evidence as of another day. `band` sets it outright instead.
 */

export type ValidityBand = "high" | "good" | "aging" | "stale";
/** The band boundaries, as an age in days: younger than `high` is high, than `good` good, than `aging` aging; older is stale */
export type ValidityProfile = { high: number; good: number; aging: number };
/** Built-in decay profiles – fast: hours and days (prices, status, news) · standard: weeks and months · slow: years
 *  (reference material) · lasting: never decays */
export type ValidityProfileName = "fast" | "standard" | "slow" | "lasting";
/** A moment: epoch ms, an ISO date string or a Date */
export type ValidityTime = number | string | Date;
/** What a piece of evidence says about its freshness – one paragraph of a strip, or a source in tc-claim-answer */
export type ValidityInfo = {
  /** When the evidence was observed or published */
  observed?: ValidityTime;
  /** How fast it decays (default "standard") */
  profile?: ValidityProfileName | ValidityProfile;
  /** The band, set outright – `observed` and the profile are then ignored */
  band?: ValidityBand;
  /** Other evidence disputes it */
  contested?: boolean;
  /** Something newer replaces it */
  superseded?: boolean;
  /** The source has changed since it was used – the app compares what was relied on with what is there now */
  changed?: boolean;
  /** Strip: what the paragraph is called in its tooltip and to screen readers (default "Paragraph 2") */
  label?: string;
};
/** Detail of tc-locate: the strip segment that was activated */
export type ValidityLocateDetail = { index: number; item: ValidityInfo; target: Element | null };

export const VALIDITY_PROFILES: Record<ValidityProfileName, ValidityProfile> = {
  fast: { high: 1, good: 7, aging: 30 },
  standard: { high: 30, good: 90, aging: 365 },
  slow: { high: 365, good: 3 * 365, aging: 5 * 365 },
  lasting: { high: Infinity, good: Infinity, aging: Infinity },
};
export const VALIDITY_BANDS: readonly ValidityBand[] = ["high", "good", "aging", "stale"];
const DEFAULT_BAND_LABELS: Record<ValidityBand, string> = { high: "High", good: "Good", aging: "Aging", stale: "Stale" };
const DAY = 86_400_000;

/** A moment as epoch ms; NaN when it can't be read */
export function validityTime(t: ValidityTime | undefined): number {
  if (t === undefined || t === null || t === "") return NaN;
  return t instanceof Date ? t.getTime() : typeof t === "number" ? t : Date.parse(t);
}

/** The band of evidence observed at `observed`, as of `now` (both epoch ms), under a decay profile */
export function validityBand(observed: number, now: number, profile: ValidityProfileName | ValidityProfile = "standard"): ValidityBand {
  const p = typeof profile === "string" ? (VALIDITY_PROFILES[profile] ?? VALIDITY_PROFILES.standard) : profile;
  if (!Number.isFinite(observed)) return "stale";
  const days = Math.max(0, now - observed) / DAY;
  return days < p.high ? "high" : days < p.good ? "good" : days < p.aging ? "aging" : "stale";
}

/** An age as words in the page's language: short ("8 mo. ago") for the badge, long ("8 months ago") for screen readers */
export function validityAge(ms: number, style: "short" | "long" = "short", locale?: string) {
  const days = Math.max(0, ms) / DAY;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style });
  if (days < 1) return rtf.format(0, "day");
  if (days < 14) return rtf.format(-Math.floor(days), "day");
  if (days < 60) return rtf.format(-Math.floor(days / 7), "week");
  if (days < 730) return rtf.format(-Math.floor(days / 30.44), "month");
  return rtf.format(-Math.floor(days / 365.25), "year");
}

/** Four signal bars, as many filled as the band is fresh. Clean: thinner, rounder */
const FILLED: Record<ValidityBand, number> = { high: 4, good: 3, aging: 2, stale: 1 };
const barsIcon = (band: ValidityBand, look: Look, size = 12) => {
  const clean = look === "clean";
  const w = clean ? 1.6 : 2;
  const xs = [2.5, 5, 7.5, 10];
  const n = FILLED[band];
  return html`<svg viewBox="0 0 12 12" width=${size} height=${size} fill="none" aria-hidden="true">${xs.map(
    (x, i) => svg`<line x1=${x} x2=${x} y1="10" y2=${8.5 - i * 2.2} stroke="currentColor" stroke-width=${w} stroke-linecap="round" opacity=${i < n ? 1 : 0.28}></line>`,
  )}</svg>`;
};

/** The wall clock – read once, when the element connects (the default `now`), never while rendering */
const wallClock = (): number => Date.now();

type Segment = { index: number; item: ValidityInfo; band: ValidityBand; top?: number; height?: number };

/**
 * Evidence freshness as a band that decays with age, plus contested and superseded marks – a badge, or a margin
 * strip for a document's paragraphs.
 * @tag tc-validity-badge
 * @fires tc-locate - Strip: a segment was clicked, or Enter / Space was pressed on it; detail `{ index, item, target }` (ValidityLocateDetail) – the paragraph it stands for, when `for` names a document
 */
export class TcValidityBadge extends TcElement {
  static override ui = "vb";

  /** "badge" – the mark and the band in words; "strip" – one bar per paragraph down a document's margin */
  @property({ reflect: true }) accessor mode: "badge" | "strip" = "badge";
  /** When the evidence was observed or published: epoch ms, an ISO date string or a Date */
  @property() accessor observed: ValidityTime | undefined = undefined;
  /** How fast it decays: "fast", "standard", "slow", "lasting", or your own band boundaries in days */
  @property() accessor profile: ValidityProfileName | ValidityProfile = "standard";
  /** The band, set outright – `observed` and the profile are then ignored */
  @property() accessor band: ValidityBand | undefined = undefined;
  /** Other evidence disputes it: a dashed ring round the mark and the word "Contested" */
  @property({ type: Boolean }) accessor contested = false;
  /** Something newer replaces it: the mark turns gray and the badge says "Superseded" first */
  @property({ type: Boolean }) accessor superseded = false;
  /** The source has changed since it was used (the app compares what was relied on with what is there now): a blue dot on the mark and the words "Changed since used" */
  @property({ type: Boolean }) accessor changed = false;
  /** The moment the age is counted to, in epoch ms – defaults to when the element connected */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Badge: only the mark, with its words in a tooltip and for screen readers */
  @property({ type: Boolean, reflect: true }) accessor compact = false;
  /** Badge: leave out the age ("8 mo. ago") */
  @property({ type: Boolean, attribute: "hide-age" }) accessor hideAge = false;
  /** The words for the bands – your own vocabulary in place of High, Good, Aging and Stale */
  @property({ attribute: false }) accessor bandLabels: Partial<Record<ValidityBand, string>> = {};
  /** The word for a contested piece of evidence */
  @property({ attribute: "contested-label" }) accessor contestedLabel = "Contested";
  /** The word for a superseded piece of evidence */
  @property({ attribute: "superseded-label" }) accessor supersededLabel = "Superseded";
  /** The words for a source that has changed since it was used */
  @property({ attribute: "changed-label" }) accessor changedLabel = "Changed since used";
  /** What a changed source means and what to do – said after the band, and in the tooltip; empty leaves it out */
  @property({ attribute: "changed-note" }) accessor changedNote = "It has changed since you used it – check it still says what you relied on.";
  /** What screen readers call the evidence: "Aging evidence, observed 8 months ago" */
  @property({ attribute: "subject-label" }) accessor subjectLabel = "evidence";
  /** Strip: one entry per paragraph, in document order */
  @property({ attribute: false }) accessor items: ValidityInfo[] = [];
  /** Strip: the id of the document whose paragraphs the bars line up with; unset stacks the bars on their own */
  @property() accessor for = "";
  /** Strip: which children of the `for` document count as paragraphs (a selector, default every child element) */
  @property() accessor selector = ":scope > *";
  /** Strip: the name of the list of bars */
  @property({ attribute: "strip-label" }) accessor stripLabel = "Evidence freshness";
  /** Strip: what an item without a `label` is called, before its number */
  @property({ attribute: "paragraph-label" }) accessor paragraphLabel = "Paragraph";

  /** @internal Where each paragraph sits, relative to the strip */
  @state() accessor boxes: { top: number; height: number }[] | null = null;
  /** @internal The strip segment with the roving tab stop */
  @state() accessor active = 0;
  /** @internal The segment whose tooltip shows (pointer or focus) */
  @state() accessor tip: number | null = null;

  private connectedAt = 0;
  private ro?: ResizeObserver;
  private mo?: MutationObserver;
  private watched: Element | null = null;
  private frame = 0;

  /** The band as shown: `band`, else worked out from `observed`, the profile and `now` */
  get currentBand(): ValidityBand {
    return this.bandOf({ band: this.band, observed: this.observed, profile: this.profile });
  }

  private get nowMs() {
    return this.now ?? this.connectedAt;
  }

  private bandOf(item: ValidityInfo): ValidityBand {
    return item.band ?? validityBand(validityTime(item.observed), this.nowMs, item.profile ?? this.profile);
  }

  private label(band: ValidityBand) {
    return this.bandLabels[band] ?? DEFAULT_BAND_LABELS[band];
  }

  private get locale() {
    return this.closest("[lang]")?.getAttribute("lang") || undefined;
  }

  /** The words for one piece of evidence: short for the badge, long for screen readers and tooltips */
  private words(item: ValidityInfo, band: ValidityBand) {
    const at = validityTime(item.observed);
    const known = !item.band && Number.isFinite(at);
    const age = known ? this.nowMs - at : NaN;
    const short = known ? validityAge(age, "short", this.locale) : "";
    const long = known ? validityAge(age, "long", this.locale) : "";
    const marks = [item.superseded ? this.supersededLabel : "", item.contested ? this.contestedLabel : "", item.changed ? this.changedLabel : ""].filter(Boolean);
    const sentence = [`${this.label(band)} ${this.subjectLabel}`, long ? `observed ${long}` : "", ...marks.map((m) => m.toLowerCase())].filter(Boolean).join(", ");
    // A changed source says what to do about it, as a second sentence
    const full = item.changed && this.changedNote ? `${sentence}. ${this.changedNote}` : sentence;
    return { short, long, marks, full };
  }

  override connectedCallback() {
    super.connectedCallback();
    this.connectedAt = wallClock();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.unwatch();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.mode === "strip" && this.active >= this.items.length) this.active = Math.max(0, this.items.length - 1);
    // The badge's text is shown short and said long: the host carries the long form as its tooltip
    if (this.mode === "badge") {
      const band = this.currentBand;
      const w = this.words({ observed: this.observed, band: this.band, contested: this.contested, superseded: this.superseded, changed: this.changed }, band);
      const tip = w.full.charAt(0).toUpperCase() + w.full.slice(1);
      if (this.getAttribute("title") !== tip) this.setAttribute("title", tip);
    } else if (changed.get("mode") === "badge") this.removeAttribute("title");
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("mode") || changed.has("for") || changed.has("selector") || changed.has("items")) this.watch();
  }

  /* ---------- Strip: following the document's paragraphs ---------- */

  private target(): Element | null {
    if (this.mode !== "strip" || !this.for) return null;
    return (this.getRootNode() as Document | ShadowRoot).getElementById?.(this.for) ?? null;
  }

  private paragraphs(target: Element) {
    try {
      return [...target.querySelectorAll(this.selector)];
    } catch {
      return [...target.children];
    }
  }

  private unwatch() {
    this.ro?.disconnect();
    this.mo?.disconnect();
    this.ro = undefined;
    this.mo = undefined;
    this.watched = null;
  }

  private watch() {
    const target = this.target();
    if (target !== this.watched) {
      this.unwatch();
      this.watched = target;
      if (!target) {
        this.boxes = null;
        return;
      }
      if (typeof ResizeObserver === "function") this.ro = new ResizeObserver(this.schedule);
      this.mo = new MutationObserver(() => {
        this.observeParagraphs();
        this.schedule();
      });
      this.mo.observe(target, { childList: true, subtree: true, characterData: true });
    }
    if (target) {
      this.observeParagraphs();
      this.schedule();
    }
  }

  private observeParagraphs() {
    const target = this.watched;
    if (!target || !this.ro) return;
    this.ro.disconnect();
    this.ro.observe(target);
    this.ro.observe(this);
    for (const p of this.paragraphs(target)) this.ro.observe(p);
  }

  private schedule = () => {
    if (!this.frame) this.frame = requestAnimationFrame(this.measure);
  };

  private measure = () => {
    this.frame = 0;
    const target = this.watched;
    if (!target || !this.isConnected) return;
    const origin = this.getBoundingClientRect().top;
    const boxes = this.paragraphs(target).map((p) => {
      const r = p.getBoundingClientRect();
      return { top: Math.round(r.top - origin), height: Math.round(r.height) };
    });
    const same = this.boxes && this.boxes.length === boxes.length && this.boxes.every((b, i) => b.top === boxes[i].top && b.height === boxes[i].height);
    if (!same) this.boxes = boxes;
  };

  /* ---------- Strip: keyboard ---------- */

  private segmentEls() {
    return [...this.querySelectorAll<HTMLElement>(".ui-vb__seg")];
  }

  private onStripKey = (e: KeyboardEvent) => {
    const n = this.items.length;
    if (!n) return;
    const at = this.active;
    const to = e.key === "ArrowDown" || e.key === "ArrowRight" ? Math.min(n - 1, at + 1)
      : e.key === "ArrowUp" || e.key === "ArrowLeft" ? Math.max(0, at - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : null;
    if (to !== null) {
      e.preventDefault();
      this.active = to;
      this.tip = to;
      void this.updateComplete.then(() => this.segmentEls()[to]?.focus());
    } else if (e.key === "Escape" && this.tip !== null) {
      e.stopPropagation();
      this.tip = null;
    }
  };

  private locate(index: number) {
    const target = this.watched;
    const el = target ? (this.paragraphs(target)[index] ?? null) : null;
    this.active = index;
    this.emit<ValidityLocateDetail>("tc-locate", { index, item: this.items[index], target: el });
  }

  /* ---------- Render ---------- */

  private mark(band: ValidityBand, look: Look, item: ValidityInfo) {
    return html`<span class="ui-vb__mark" data-band=${band} ?data-contested=${!!item.contested} ?data-superseded=${!!item.superseded} ?data-changed=${!!item.changed} aria-hidden="true">${barsIcon(band, look)}</span>`;
  }

  private renderBadge(look: Look) {
    const band = this.currentBand;
    const item: ValidityInfo = { observed: this.observed, band: this.band, contested: this.contested, superseded: this.superseded, changed: this.changed };
    const w = this.words(item, band);
    const label = this.label(band);
    return html`${this.mark(band, look, item)}<span class="ui-vb__sr">${w.full}</span>${this.compact
      ? nothing
      : html`<span class="ui-vb__text" aria-hidden="true">${this.superseded ? html`<span class="ui-vb__flag" data-kind="superseded">${this.supersededLabel}</span><span class="ui-vb__dot">·</span>` : nothing}<span class="ui-vb__band" ?data-struck=${this.superseded}>${label}</span>${w.short && !this.hideAge ? html`<span class="ui-vb__dot">·</span><span class="ui-vb__age">${w.short}</span>` : nothing}${this.contested ? html`<span class="ui-vb__dot">·</span><span class="ui-vb__flag" data-kind="contested">${this.contestedLabel}</span>` : nothing}${this.changed ? html`<span class="ui-vb__dot">·</span><span class="ui-vb__flag" data-kind="changed">${this.changedLabel}</span>` : nothing}</span>`}`;
  }

  private renderStrip(look: Look) {
    const boxes = this.boxes;
    const aligned = !!boxes;
    const segments: Segment[] = this.items.map((item, index) => ({ index, item, band: this.bandOf(item), ...(boxes?.[index] ?? {}) }));
    const height = aligned && boxes.length ? Math.max(...boxes.map((b) => b.top + b.height)) : undefined;
    return html`<div
      class="ui-vb__strip"
      role="list"
      aria-label=${this.stripLabel}
      ?data-aligned=${aligned}
      style=${styleMap({ minHeight: height !== undefined ? `${height}px` : undefined })}
      @keydown=${this.onStripKey}
      @pointerleave=${() => (this.tip = null)}
    >${segments.map((s) => {
      if (aligned && s.top === undefined) return nothing;
      const w = this.words(s.item, s.band);
      const name = s.item.label || `${this.paragraphLabel} ${s.index + 1}`;
      const tipShown = this.tip === s.index;
      return html`<span
        role="listitem"
        class="ui-vb__item"
        style=${styleMap(aligned ? { top: `${s.top}px`, height: `${Math.max(8, s.height ?? 0)}px` } : {})}
      ><button
        type="button"
        class="ui-vb__seg"
        data-band=${s.band}
        ?data-contested=${!!s.item.contested}
        ?data-superseded=${!!s.item.superseded}
        ?data-changed=${!!s.item.changed}
        tabindex=${this.active === s.index ? 0 : -1}
        aria-label=${`${name}: ${w.full}`}
        @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.tip = s.index)}
        @focus=${() => {
          this.active = s.index;
          this.tip = s.index;
        }}
        @blur=${() => this.tip === s.index && (this.tip = null)}
        @click=${() => this.locate(s.index)}
      ><span class="ui-vb__bar" aria-hidden="true"></span></button>${tipShown
        ? html`<span class="ui-vb__tip" aria-hidden="true"><span class="ui-vb__tip-head">${this.mark(s.band, look, s.item)}<b>${name}</b></span><span class="ui-vb__tip-text">${[s.item.superseded ? this.supersededLabel : "", this.label(s.band), w.short, s.item.contested ? this.contestedLabel : "", s.item.changed ? this.changedLabel : ""].filter(Boolean).join(" · ")}</span></span>`
        : nothing}</span>`;
    })}</div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    return this.mode === "strip" ? this.renderStrip(look) : this.renderBadge(look);
  }

  static override css = /* css */ `
[data-ui="vb"] { font-family: var(--tc-font-sans); -webkit-font-smoothing: antialiased; }
[data-ui="vb"] *, [data-ui="vb"] *::before, [data-ui="vb"] *::after { box-sizing: border-box; }
[data-ui="vb"] svg { display: block; flex: none; }
.ui-vb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The band colours – one pair per band; superseded evidence is gray whatever its age */
[data-ui="vb"] [data-band="high"] { --tc-validity-badge-fg: var(--tc-validity-high-fg); --tc-validity-badge-bg: var(--tc-validity-high-bg); }
[data-ui="vb"] [data-band="good"] { --tc-validity-badge-fg: var(--tc-validity-good-fg); --tc-validity-badge-bg: var(--tc-validity-good-bg); }
[data-ui="vb"] [data-band="aging"] { --tc-validity-badge-fg: var(--tc-validity-aging-fg); --tc-validity-badge-bg: var(--tc-validity-aging-bg); }
[data-ui="vb"] [data-band="stale"] { --tc-validity-badge-fg: var(--tc-validity-stale-fg); --tc-validity-badge-bg: var(--tc-validity-stale-bg); }
[data-ui="vb"] [data-superseded] { --tc-validity-badge-fg: var(--tc-text-muted); --tc-validity-badge-bg: var(--tc-fill-default); }

/* ----- Badge: the tone mark, then the band in words ----- */
[data-ui="vb"]:not([mode="strip"]) {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  max-width: 100%;
  min-width: 0;
  vertical-align: middle;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
}
/* The mark: change-summary's tone mark – a tinted square, the bars in the band's colour */
.ui-vb__mark {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 20px;
  height: 20px;
  background: var(--tc-validity-badge-bg);
  color: var(--tc-validity-badge-fg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-vb__mark { border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-vb__mark { width: 18px; height: 18px; border-radius: var(--tc-radius-badge); }
/* Stale is more than a colour (WCAG 1.4.1): one bar, and an outline like change-summary's bad mark */
.ui-vb__mark[data-band="stale"]:not([data-superseded]) { box-shadow: inset 0 0 0 1px currentColor; }
/* Contested: a dashed ring outside the mark */
.ui-vb__mark[data-contested] { outline: 1px dashed var(--tc-validity-badge-fg); outline-offset: 1px; }
:where([data-ui="vb"][compact]) .ui-vb__mark { cursor: help; }
/* Changed since used: a blue dot on the mark's corner, cut out of the surface – and the words, in blue */
.ui-vb__mark[data-changed]::after, .ui-vb__seg[data-changed]::after { content: ""; position: absolute; top: -3px; right: -3px; width: 8px; height: 8px; border-radius: var(--tc-radius-full); background: var(--tc-status-info-solid); box-shadow: 0 0 0 1.5px var(--tc-surface-raised); }
.ui-vb__seg[data-changed]::after { top: -2px; right: auto; left: 50%; transform: translateX(-50%); }
.ui-vb__text { display: inline-flex; align-items: baseline; gap: var(--tc-space-1); min-width: 0; overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-vb__band { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-vb__band { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-vb__band[data-struck] { color: var(--tc-text-muted); text-decoration: line-through; text-decoration-thickness: 1px; }
.ui-vb__age { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-vb__dot { color: var(--tc-text-disabled); }
.ui-vb__flag { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-vb__flag[data-kind="changed"] { color: var(--tc-status-info-fg); }

/* ----- Strip: one bar per paragraph, down the margin ----- */
[data-ui="vb"][mode="strip"] { position: relative; display: block; flex: none; width: 16px; align-self: stretch; }
.ui-vb__strip { position: relative; display: flex; flex-direction: column; gap: var(--tc-space-1); width: 100%; height: 100%; }
.ui-vb__strip[data-aligned] { display: block; }
.ui-vb__item { position: relative; display: flex; justify-content: center; min-height: 24px; flex: 1 0 24px; }
.ui-vb__strip[data-aligned] .ui-vb__item { position: absolute; left: 0; right: 0; min-height: 0; }
.ui-vb__seg {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: var(--tc-space-0-5) 0;
  border: 0;
  border-radius: var(--tc-radius-xs);
  background: none;
  color: var(--tc-validity-badge-fg);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ui-vb__seg:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-vb__seg:hover { background: var(--tc-fill-subtle); }
.ui-vb__bar { display: block; height: 100%; border-radius: var(--tc-radius-full); background: linear-gradient(currentColor, currentColor); transition: width var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-vb__bar { width: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-vb__bar { width: 3px; }
.ui-vb__seg:hover .ui-vb__bar, .ui-vb__seg:focus-visible .ui-vb__bar { width: 6px; }
/* Not only colour (WCAG 1.4.1): aging bars are dashed, stale ones dotted, superseded ones hatched */
.ui-vb__seg[data-band="aging"] .ui-vb__bar { background: repeating-linear-gradient(to bottom, currentColor 0 6px, transparent 6px 9px); }
.ui-vb__seg[data-band="stale"] .ui-vb__bar { background: repeating-linear-gradient(to bottom, currentColor 0 3px, transparent 3px 6px); }
.ui-vb__seg[data-superseded] .ui-vb__bar { background: repeating-linear-gradient(135deg, currentColor 0 2px, transparent 2px 4px); box-shadow: inset 0 0 0 1px currentColor; }
/* Contested: a ring round the bar */
.ui-vb__seg[data-contested] .ui-vb__bar { outline: 1px dashed currentColor; outline-offset: 1px; }
/* The tooltip: beside the bar, on the document side */
.ui-vb__tip {
  position: absolute;
  top: 0;
  left: calc(100% + 6px);
  z-index: var(--tc-z-popover);
  display: grid;
  gap: var(--tc-space-1);
  width: max-content;
  max-width: 240px;
  padding: var(--tc-space-1-5) var(--tc-tooltip-px);
  border-radius: var(--tc-tooltip-radius);
  background: var(--tc-tooltip-bg);
  box-shadow: var(--tc-shadow-overlay);
  font-size: var(--tc-tooltip-font-size);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-tooltip-fg);
  white-space: normal;
  pointer-events: none;
  animation: ui-vb-in var(--tc-duration-fast) var(--tc-ease-standard) both;
}
.ui-vb__tip-head { display: flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-vb__tip b { font-weight: var(--tc-font-weight-medium); }
.ui-vb__tip .ui-vb__mark { width: 16px; height: 16px; border-radius: var(--tc-radius-xs); outline-color: currentColor; }
.ui-vb__tip-text { opacity: 0.8; }
@keyframes ui-vb-in { from { opacity: 0; transform: translateX(-2px); } }
@media (pointer: coarse) {
  .ui-vb__item { min-height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="vb"] *, [data-ui="vb"] *::before, [data-ui="vb"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-vb__mark { forced-color-adjust: auto; border: 1px solid CanvasText; }
  .ui-vb__mark[data-changed]::after, .ui-vb__seg[data-changed]::after { background: Highlight; }
}
`;
}

if (!customElements.get("tc-validity-badge")) customElements.define("tc-validity-badge", TcValidityBadge);

declare global {
  interface HTMLElementTagNameMap {
    "tc-validity-badge": TcValidityBadge;
  }
}
