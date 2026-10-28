import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import "./button";

/*
 * <tc-kpi-board> – the top of a dashboard: one date range for everything, three small trend cards, one large overview
 * chart that compares this period with the last, and a focus card for one product or plan. The Lit port of
 * blocks/kpi-board.tsx. All charts share one look: thin angular lines, a quiet fill, dates under the plot.
 *   · hover a small card and the day under the pointer gets a dot, its value in a small tag and its date on the axis
 *   · hover the overview and a dark tooltip compares this period with the last at that day
 *   · switch the range and every number rolls while the lines draw themselves in again; the segment filter inside the
 *     overview does the same for that one card only
 *   · on first view the cards rise in and the lines are drawn from the left (not with reduced motion)
 * Numbers roll by writing the rendered text node each frame – never a render per frame.
 * One look for both looks, as the block had: cards on the page, no tray. The pickers follow the select-only combobox
 * pattern (arrows open and move, Enter or Space picks, Escape closes and keeps focus on the trigger).
 *
 *   <tc-kpi-board .data=${{ "30d": {…} }} .ranges=${[{ id: "30d", label: "Last 30 days" }]}></tc-kpi-board>
 */

export type KpiStat = {
  id: string;
  label: string;
  /** "money" runs the value through formatMoney, "count" shows a whole number */
  kind?: "money" | "count";
  /** One label per point, e.g. "17 Aug" */
  labels: string[];
  values: number[];
  /** Total of the period before – shown as the change on the right */
  previous?: number;
  /** Set when a smaller number is the good news, e.g. refunds */
  lowerIsBetter?: boolean;
};

export type KpiBoardData = {
  /** The small cards in the first row – three fit best */
  stats: KpiStat[];
  overview: {
    title: string;
    labels: string[];
    current: number[];
    previous: number[];
    /** The same two lines per segment id – picked with the filter inside this card, which changes nothing else */
    segments?: Record<string, { current: number[]; previous: number[] }>;
  };
  focus: {
    title: string;
    note?: string;
    /** What is counted, e.g. "Product sales rate" */
    metric: string;
    /** Word after the number, e.g. "items" */
    unit?: string;
    labels: string[];
    values: number[];
    /** Total of the period before */
    previous: number;
  };
};

/** A choice in a picker */
export type KpiOption = { id: string; label: string };

/** A button in the focus card; `onClick` runs as well as the element's event */
export type KpiButton = { label: string; onClick?: () => void };

/** Detail of tc-range-change */
export type KpiRangeChange = { range: string };
/** Detail of tc-segment-change */
export type KpiSegmentChange = { segment: string };

/* ---------- Helpers ---------- */

const sum = (a: number[] | undefined) => (a ?? []).reduce((x, y) => x + (Number.isFinite(y) ? y : 0), 0);
const whole = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
/** "$1,234.50" under ten thousand, "$12,345" above */
export const kpiMoney = (n: number) => `$${new Intl.NumberFormat("en-US", { minimumFractionDigits: Math.abs(n) < 10000 ? 2 : 0, maximumFractionDigits: Math.abs(n) < 10000 ? 2 : 0 }).format(n)}`;
const ease = (t: number) => 1 - Math.pow(1 - t, 4);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Highest and lowest without spreading a long series into arguments */
const extent = (...lists: number[][]) => {
  let hi = -Infinity;
  let lo = Infinity;
  for (const list of lists)
    for (const v of list) {
      if (!Number.isFinite(v)) continue;
      hi = Math.max(hi, v);
      lo = Math.min(lo, v);
    }
  return { hi: hi === -Infinity ? 0 : hi, lo: lo === Infinity ? 0 : lo };
};

/** A series stretched or squeezed to a fixed number of points, so lines of different lengths can glide into each other */
export function kpiResample(values: number[] | undefined, n: number): number[] {
  if (!values || values.length === 0) return new Array(n).fill(0);
  if (values.length === 1) return new Array(n).fill(values[0]);
  return Array.from({ length: n }, (_, i) => {
    const at = (i / (n - 1)) * (values.length - 1);
    const lo = Math.floor(at);
    const hi = Math.min(values.length - 1, lo + 1);
    return mix(values[lo], values[hi], at - lo);
  });
}

/** Straight segments through evenly spaced points in a 0–100 box: the line, and the same shape closed to the floor */
export function kpiTrace(values: number[], lo: number, hi: number, top = 6, bottom = 94) {
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * 100, bottom - ((v - lo) / span) * (bottom - top)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("");
  return { pts, line, area: `${line}L100,100L0,100Z` };
}

/** Where a point of the real data sits on a traced (resampled) line, in percent */
const spot = (pts: readonly (readonly [number, number])[], index: number, length: number) => pts[Math.round((index / Math.max(1, length - 1)) * (pts.length - 1))];

/** Every point keeps its kink; only very long series are thinned out */
const glide = (values: number[] | undefined, n: number) => {
  const v = values ?? [];
  return v.length >= 2 && v.length <= n ? v : kpiResample(v, n);
};

let uid = 0;

/**
 * A dashboard's top: a date range, three trend cards, an overview that compares two periods, and a focus card.
 * @tag tc-kpi-board
 * @fires tc-range-change - Another date range was picked (`{ range }`: KpiRangeChange); cancelable – prevented, `range` stays as it was
 * @fires tc-segment-change - Another overview segment was picked (`{ segment }`: KpiSegmentChange); cancelable – prevented, `segment` stays as it was
 * @fires tc-setup - The focus card's setup button was pressed; detail: null
 * @fires tc-action - The focus card's action button was pressed; detail: null
 */
export class TcKpiBoard extends TcElement {
  static override ui = "kb";

  /** Heading on the left of the bar above the cards – none by default */
  @property() accessor heading = "";
  /** One data set per range id */
  @property({ attribute: false }) accessor data: Record<string, KpiBoardData> = {};
  /** The date ranges, e.g. Last 7 / 30 / 90 days */
  @property({ attribute: false }) accessor ranges: KpiOption[] = [];
  /** The range shown – unset, the first one */
  @property() accessor range: string | undefined = undefined;
  /** A filter inside the overview card, e.g. All plans / Pro / Team – it only switches the overview's lines */
  @property({ attribute: false }) accessor segments: KpiOption[] | undefined = undefined;
  /** The segment shown – unset, the first one */
  @property() accessor segment: string | undefined = undefined;
  /** Words after every change, e.g. "vs. last month" */
  @property({ attribute: "compare-label" }) accessor compareLabel = "vs. last period";
  /** Name of this period's line */
  @property({ attribute: "current-label" }) accessor currentLabel = "This period";
  /** Name of the last period's line */
  @property({ attribute: "previous-label" }) accessor previousLabel = "Last period";
  /** Formats money amounts – "$1,234.50" by default */
  @property({ attribute: false }) accessor formatMoney: (value: number) => string = kpiMoney;
  /** Icon in the focus card: a DOM node (cloned) or a Lit template – a box by default */
  @property({ attribute: false }) accessor icon: Element | TemplateResult | undefined = undefined;
  /** The small button at the top right of the focus card, e.g. Set up */
  @property({ attribute: false }) accessor setup: KpiButton | undefined = undefined;
  /** The button at the bottom of the focus card */
  @property({ attribute: false }) accessor action: KpiButton | undefined = undefined;

  /** The small card under the pointer and where – one at a time */
  @state() private accessor day: { id: string; at: number } | null = null;
  @state() private accessor overviewAt: number | null = null;
  @state() private accessor focusAt: number | null = null;
  /** The open picker, the active row in it, and whether the keyboard drives it (the active row gets a ring) */
  @state() private accessor open: "range" | "segment" | null = null;
  @state() private accessor active = 0;
  @state() private accessor keys = false;

  readonly #uid = `tc-kb-${++uid}`;
  /** What each rolling number shows now, and where the next roll starts */
  #shown: Record<string, number> = {};
  #formats: Record<string, (n: number) => string> = {};
  #signature = "";
  #frame = 0;
  #iconClone: { from: Element; node: Node } | null = null;

  /** The range in effect: `range`, else the first */
  get rangeId() {
    return this.range ?? this.ranges[0]?.id ?? "";
  }
  /** The segment in effect: `segment`, else the first ("" when there is no filter) */
  get segmentId() {
    return this.segment ?? this.segments?.[0]?.id ?? "";
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    document.removeEventListener("pointerdown", this.#away);
    // Back in the page, numbers show their targets; a roll that was cut short doesn't resume
    this.#shown = this.#view().targets;
    this.#signature = "";
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A new range: the marks leave; a new segment: the overview's mark leaves
    if (changed.has("range") || changed.has("ranges")) {
      this.day = null;
      this.overviewAt = null;
      this.focusAt = null;
    }
    if (changed.has("segment") || changed.has("segments")) this.overviewAt = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("open")) {
      if (this.open) document.addEventListener("pointerdown", this.#away);
      else document.removeEventListener("pointerdown", this.#away);
    }
    this.#roll();
  }

  /* ---------- Rolling numbers ---------- */

  #write(values: Record<string, number>) {
    for (const el of this.querySelectorAll<HTMLElement>("[data-roll]")) {
      const key = el.dataset.roll!;
      const format = this.#formats[key];
      const text = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.nodeValue);
      if (values[key] === undefined || !format || !text) continue;
      const next = format(values[key]);
      if (text.nodeValue !== next) text.nodeValue = next;
    }
  }

  /** Every number rolls from what was shown to the new data (from zero on first view) */
  #roll() {
    const { targets: to, formats } = this.#view();
    this.#formats = formats;
    const signature = JSON.stringify(to);
    if (signature === this.#signature) return;
    this.#signature = signature;
    cancelAnimationFrame(this.#frame);
    const from: Record<string, number> = {};
    for (const k in to) from[k] = this.#shown[k] ?? 0;
    if (reducedMotion() || Object.keys(to).every((k) => from[k] === to[k])) {
      this.#shown = to;
      this.#write(to);
      return;
    }
    // Back to where the roll starts before this render is painted (it has just written the targets)
    this.#write(from);
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const p = Math.min(1, (now - start) / 760);
      const e = ease(p);
      const next: Record<string, number> = {};
      for (const k in to) next[k] = mix(from[k], to[k], e);
      this.#shown = next;
      this.#write(next);
      this.#frame = p < 1 ? requestAnimationFrame(step) : 0;
    };
    this.#frame = requestAnimationFrame(step);
  }

  /* ---------- Pickers ---------- */

  #away = (e: PointerEvent) => {
    if (!(e.target instanceof Node) || !this.querySelector(".ui-kb__pick[data-open]")?.contains(e.target)) this.open = null;
  };

  #show(which: "range" | "segment", fromKeyboard: boolean) {
    const options = which === "range" ? this.ranges : (this.segments ?? []);
    const value = which === "range" ? this.rangeId : this.segmentId;
    this.active = Math.max(0, options.findIndex((o) => o.id === value));
    this.keys = fromKeyboard;
    this.open = which;
  }

  #choose(which: "range" | "segment", index: number) {
    const options = which === "range" ? this.ranges : (this.segments ?? []);
    const value = which === "range" ? this.rangeId : this.segmentId;
    this.open = null;
    const picked = options[index];
    if (picked && picked.id !== value) {
      if (which === "range") {
        if (this.emit<KpiRangeChange>("tc-range-change", { range: picked.id }, { cancelable: true })) this.range = picked.id;
      } else if (this.emit<KpiSegmentChange>("tc-segment-change", { segment: picked.id }, { cancelable: true })) this.segment = picked.id;
    }
    this.querySelector<HTMLElement>(`.ui-kb__pick[data-which="${which}"] .ui-kb__pick-button`)?.focus({ preventScroll: true });
  }

  #onPickKey(which: "range" | "segment", e: KeyboardEvent) {
    const options = which === "range" ? this.ranges : (this.segments ?? []);
    if (this.open !== which) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        this.#show(which, true);
      }
      return;
    }
    if (e.key !== "Tab") this.keys = true;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.open = null;
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.active = (this.active + (e.key === "ArrowDown" ? 1 : -1) + options.length) % Math.max(1, options.length);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      this.active = e.key === "Home" ? 0 : options.length - 1;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.#choose(which, this.active);
    } else if (e.key === "Tab") this.open = null;
  }

  #pick(which: "range" | "segment", label: string, value: string, options: KpiOption[]) {
    const open = this.open === which;
    const selected = Math.max(0, options.findIndex((o) => o.id === value));
    const id = `${this.#uid}-${which}`;
    return html`<div class="ui-kb__pick" data-which=${which} ?data-open=${open} ?data-keys=${open && this.keys} @keydown=${(e: KeyboardEvent) => this.#onPickKey(which, e)}>
      <button
        type="button"
        class="ui-kb__pick-button"
        role="combobox"
        aria-label=${label}
        aria-haspopup="listbox"
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${`${id}-list`}
        aria-activedescendant=${open ? `${id}-${this.active}` : nothing}
        @click=${(e: MouseEvent) => (open ? (this.open = null) : this.#show(which, e.detail === 0))}
      >
        <span>${options[selected]?.label}</span>${chevronIcon()}
      </button>
      ${open
        ? html`<ul id=${`${id}-list`} class="ui-kb__menu" role="listbox" aria-label=${label}>
            ${options.map(
              (o, i) => html`<li
                id=${`${id}-${i}`}
                role="option"
                aria-selected=${i === selected ? "true" : "false"}
                class="ui-kb__option"
                ?data-active=${i === this.active}
                @pointerenter=${() => {
                  this.active = i;
                  this.keys = false;
                }}
                @click=${() => this.#choose(which, i)}
              >
                <span>${o.label}</span>${i === selected ? checkIcon() : nothing}
              </li>`,
            )}
          </ul>`
        : nothing}
    </div>`;
  }

  /* ---------- Charts ---------- */

  /** Mouse: follow the pointer. Touch: press or drag sideways on a chart, let go and the mark leaves */
  #scrub(set: (v: number | null) => void) {
    const move = (e: PointerEvent) => {
      const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
      set(Math.min(1, Math.max(0, (e.clientX - box.left) / (box.width || 1))));
    };
    const end = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") set(null);
    };
    return { move, end, leave: () => set(null) };
  }

  #show2(kind: KpiStat["kind"], n: number) {
    return kind === "count" ? whole(n) : this.formatMoney(n);
  }

  #stat(s: KpiStat, i: number) {
    const line = glide(s.values, 48);
    const { hi: max, lo: min } = extent(line);
    const tr = kpiTrace(line, min * 0.75, Math.max(max, 1) * 1.08, 10, 92);
    const diff = s.previous === undefined ? null : sum(s.values) - s.previous;
    const at = this.day?.id === s.id ? this.day.at : null;
    const count = s.values?.length ?? 0;
    const index = at === null || !count ? null : Math.round(at * (count - 1));
    const dot = index === null ? null : spot(tr.pts, index, count);
    const labels = s.labels ?? [];
    const scrub = this.#scrub((v) => (this.day = v === null ? null : { id: s.id, at: v }));
    return html`<section class="ui-kb__card ui-kb__stat" aria-label=${s.label} style=${`--n: ${i}`}>
      <header class="ui-kb__row">
        <span class="ui-kb__pair">
          <b data-roll=${`stat${i}`}>${this.#show2(s.kind, sum(s.values))}</b>
          <span>${s.label}</span>
        </span>
        ${diff !== null
          ? html`<span class="ui-kb__pair ui-kb__pair--end">
              ${diff === 0 ? html`<b>0</b>` : change(diff > 0, s.lowerIsBetter ? diff < 0 : diff > 0, this.#show2(s.kind, Math.abs(diff)))}
              <span>${this.compareLabel}</span>
            </span>`
          : nothing}
      </header>
      <div class="ui-kb__plot ui-kb__plot--small" @pointerdown=${scrub.move} @pointermove=${scrub.move} @pointerup=${scrub.end} @pointercancel=${scrub.end} @pointerleave=${scrub.leave}>
        ${keyed(this.rangeId, svg`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="ui-kb__fill" d=${tr.area} /><path class="ui-kb__line" d=${tr.line} /></svg>`)}
        ${dot && index !== null
          ? html`<span class="ui-kb__rule" style=${`left: ${dot[0]}%; top: ${dot[1]}%`}></span>
              <span class="ui-kb__dot" style=${`left: ${dot[0]}%; top: ${dot[1]}%`}></span>
              <span class="ui-kb__tag" data-side=${dot[0] > 62 ? "left" : "right"} style=${`left: ${dot[0]}%; top: ${dot[1]}%`}
                ><span>${labels[index]}</span><b>${this.#show2(s.kind, s.values[index])}</b></span
              >`
          : nothing}
      </div>
      <div class="ui-kb__axis" aria-hidden="true">
        <span>${labels[0]}</span>
        <span>${labels[labels.length - 1]}</span>
        ${dot && index !== null ? html`<span class="ui-kb__axis-tag" style=${`left: ${Math.min(88, Math.max(12, dot[0]))}%`}>${labels[index]}</span>` : nothing}
      </div>
    </section>`;
  }

  #overview(d: KpiBoardData, ov: { current: number[]; previous: number[] }) {
    const overview = d.overview;
    const current = ov.current ?? [];
    const previous = ov.previous ?? [];
    const now = glide(current, 72);
    const before = glide(previous, 72);
    const { hi, lo } = extent(now, before);
    const ovHi = Math.max(hi, 1) * 1.06;
    const ovLo = lo * 0.82;
    const ovNow = kpiTrace(now, ovLo, ovHi);
    const ovBefore = kpiTrace(before, ovLo, ovHi);
    const ovChange = sum(previous) ? ((sum(current) - sum(previous)) / sum(previous)) * 100 : 0;
    const at = this.overviewAt;
    const ovIndex = at === null || !current.length ? null : Math.round(at * (current.length - 1));
    const ovDot = ovIndex === null ? null : spot(ovNow.pts, ovIndex, current.length);
    const ovDotBefore = ovIndex === null ? null : spot(ovBefore.pts, ovIndex, current.length);
    const labels = overview.labels ?? [];
    const fade = `${this.#uid}-fade`;
    const scrub = this.#scrub((v) => (this.overviewAt = v));
    return html`<section class="ui-kb__card ui-kb__overview" aria-label=${overview.title} style="--n: 3">
      <header class="ui-kb__row ui-kb__row--top">
        <div>
          <div class="ui-kb__label">${overview.title}</div>
          <div class="ui-kb__figure">
            <b data-roll="overview">${this.formatMoney(sum(current))}</b>
            <span class="ui-kb__vs"><i ?data-good=${ovChange >= 0}>${ovChange >= 0 ? "+" : "−"}${Math.abs(ovChange).toFixed(1)}%</i> ${this.compareLabel}</span>
          </div>
        </div>
        ${this.segments?.length && this.segmentId ? this.#pick("segment", "Segment", this.segmentId, this.segments) : nothing}
      </header>
      <div class="ui-kb__plot ui-kb__plot--large" @pointerdown=${scrub.move} @pointermove=${scrub.move} @pointerup=${scrub.end} @pointercancel=${scrub.end} @pointerleave=${scrub.leave}>
        ${keyed(
          `${this.rangeId}/${this.segmentId}`,
          svg`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id=${fade} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tc-chart-1)" stop-opacity="0.14" /><stop offset="1" stop-color="var(--tc-chart-1)" stop-opacity="0" /></linearGradient></defs>
            ${Array.from({ length: 19 }, (_, i) => svg`<path class="ui-kb__grid" d=${`M${((i / 18) * 100).toFixed(2)},0V100`} />`)}
            <path d=${ovNow.area} fill=${`url(#${fade})`} />
            <path class="ui-kb__line ui-kb__line--soft" d=${ovBefore.line} />
            <path class="ui-kb__line" d=${ovNow.line} />
          </svg>`,
        )}
        ${ovDot && ovDotBefore && ovIndex !== null
          ? html`<span class="ui-kb__rule" style=${`left: ${ovDot[0]}%; top: 0`}></span>
              <span class="ui-kb__dot ui-kb__dot--soft" style=${`left: ${ovDotBefore[0]}%; top: ${ovDotBefore[1]}%`}></span>
              <span class="ui-kb__dot" style=${`left: ${ovDot[0]}%; top: ${ovDot[1]}%`}></span>
              <div class="ui-kb__tip" data-side=${ovDot[0] > 58 ? "left" : "right"} style=${`left: ${ovDot[0]}%; top: ${Math.min(ovDot[1], ovDotBefore[1])}%`}>
                <div class="ui-kb__tip-head"><span>${labels[ovIndex]}</span><b>${this.formatMoney(current[ovIndex] + (previous[ovIndex] ?? 0))}</b></div>
                <div class="ui-kb__tip-row"><i></i><span>${this.currentLabel}</span><b>${this.formatMoney(current[ovIndex])}</b></div>
                <div class="ui-kb__tip-row" data-soft=""><i></i><span>${this.previousLabel}</span><b>${this.formatMoney(previous[ovIndex] ?? 0)}</b></div>
              </div>`
          : nothing}
      </div>
      <div class="ui-kb__axis" aria-hidden="true">
        <span>${labels[0]}</span>
        <span>${labels[labels.length - 1]}</span>
      </div>
    </section>`;
  }

  #iconNode() {
    const icon = this.icon;
    if (!icon) return boxIcon();
    if (typeof Element !== "undefined" && icon instanceof Element) {
      if (this.#iconClone?.from !== icon) this.#iconClone = { from: icon, node: icon.cloneNode(true) };
      return this.#iconClone.node;
    }
    return icon;
  }

  #focus(focus: KpiBoardData["focus"]) {
    const values = focus.values ?? [];
    const focusLine = glide(values, 48);
    const { hi, lo } = extent(focusLine);
    const fTrace = kpiTrace(focusLine, lo * 0.8, Math.max(hi, 1) * 1.05, 8, 92);
    const fTotal = sum(values);
    const fChange = focus.previous ? ((fTotal - focus.previous) / focus.previous) * 100 : 0;
    const at = this.focusAt;
    const fIndex = at === null || !values.length ? null : Math.round(at * (values.length - 1));
    const fDot = fIndex === null ? null : spot(fTrace.pts, fIndex, values.length);
    const scrub = this.#scrub((v) => (this.focusAt = v));
    const unit = focus.unit ? ` ${focus.unit}` : "";
    return html`<section class="ui-kb__card ui-kb__focus" aria-label=${focus.title} style="--n: 4">
      <header class="ui-kb__row ui-kb__row--top">
        <div class="ui-kb__product">
          <span class="ui-kb__icon">${this.#iconNode()}</span>
          <span class="ui-kb__pair"><b>${focus.title}</b>${focus.note ? html`<span>${focus.note}</span>` : nothing}</span>
        </div>
        ${this.setup
          ? html`<tc-button variant="secondary" size="sm" class="ui-kb__setup" label=${this.setup.label} @click=${this.#onSetup}>${gearIcon()}</tc-button>`
          : nothing}
      </header>
      <div class="ui-kb__label">${focus.metric}</div>
      <div class="ui-kb__figure ui-kb__figure--small">
        ${
          // The total rolls; the day under the pointer doesn't
          fIndex === null ? html`<b data-roll="focus">${whole(fTotal)}${unit}</b>` : html`<b>${whole(values[fIndex])}${unit}</b>`
        }
        <span class="ui-kb__vs"
          >${fIndex === null ? html`${change(fChange >= 0, fChange >= 0, `${Math.abs(fChange).toFixed(0)}%`)} ${this.compareLabel}` : (focus.labels ?? [])[fIndex]}</span
        >
      </div>
      <div class="ui-kb__plot ui-kb__plot--small" @pointerdown=${scrub.move} @pointermove=${scrub.move} @pointerup=${scrub.end} @pointercancel=${scrub.end} @pointerleave=${scrub.leave}>
        ${keyed(this.rangeId, svg`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="ui-kb__fill" d=${fTrace.area} /><path class="ui-kb__line" d=${fTrace.line} /></svg>`)}
        ${fDot
          ? html`<span class="ui-kb__rule" style=${`left: ${fDot[0]}%; top: ${fDot[1]}%`}></span><span class="ui-kb__dot" style=${`left: ${fDot[0]}%; top: ${fDot[1]}%`}></span>`
          : nothing}
      </div>
      <div class="ui-kb__legend">
        <span data-soft="">${this.previousLabel}</span>
        <b data-soft="" data-roll="focusPrevious">${whole(focus.previous ?? 0)}</b>
        <span>${this.currentLabel}</span>
        <b data-roll="focusLegend">${whole(fTotal)}</b>
      </div>
      ${this.action ? html`<tc-button variant="secondary" class="ui-kb__action" label=${this.action.label} @click=${this.#onAction}></tc-button>` : nothing}
    </section>`;
  }

  #onSetup = () => {
    this.setup?.onClick?.();
    this.emit("tc-setup", null);
  };

  #onAction = () => {
    this.action?.onClick?.();
    this.emit("tc-action", null);
  };

  /** The data set in effect, its overview lines, and the numbers that roll with their formats */
  #view() {
    const d = this.data?.[this.rangeId] ?? Object.values(this.data ?? {})[0];
    const targets: Record<string, number> = {};
    const formats: Record<string, (n: number) => string> = {};
    if (!d) return { d, ov: undefined, targets, formats };
    // The overview follows the range and its own filter; nothing else reacts to that filter
    const ov = (this.segmentId && d.overview?.segments?.[this.segmentId]) || d.overview;
    targets.overview = sum(ov?.current);
    formats.overview = this.formatMoney;
    if (d.focus) {
      targets.focus = targets.focusLegend = sum(d.focus.values);
      targets.focusPrevious = d.focus.previous ?? 0;
      formats.focus = formats.focusLegend = formats.focusPrevious = whole;
    }
    (d.stats ?? []).forEach((s, i) => {
      targets[`stat${i}`] = sum(s.values);
      formats[`stat${i}`] = (n) => this.#show2(s.kind, n);
    });
    return { d, ov, targets, formats };
  }

  protected override render() {
    const { d, ov } = this.#view();
    return html`
      <div class="ui-kb__bar">
        ${this.heading ? html`<h2 class="ui-kb__heading">${this.heading}</h2>` : nothing}
        ${this.ranges.length ? this.#pick("range", "Date range", this.rangeId, this.ranges) : nothing}
      </div>
      ${d
        ? html`${repeat(
            d.stats ?? [],
            (s) => s.id,
            (s, i) => this.#stat(s, i),
          )}${ov ? this.#overview(d, ov) : nothing}${d.focus ? this.#focus(d.focus) : nothing}`
        : nothing}
    `;
  }

  static override css = /* css */ `
[data-ui="kb"] {
  --tc-kb-space-5px: 5px;
  --tc-kb-space-0_5px: 0.5px;
  --tc-kb-space-7px: 7px;
  --tc-kb-space-9px: 9px;
  --tc-kb-space-11px: 11px;
  --tc-kb-space-3px: 3px;
  /* Wells: chart fill */
  --tc-kpi-board-well: light-dark(#f6f6f8, #202024);
  /* Cards rise and lines draw in one after another */
  --tc-kpi-board-stagger: 60ms;
  --tc-kpi-board-series-soft: light-dark(#a9c4ff, #37508f);
  /* The overview tooltip stays dark in both themes, so its series colours are tuned for it */
  --tc-kpi-board-tip-bg: light-dark(#1c1c20, #2c2c32);
  --tc-kpi-board-tip-fg: rgba(255, 255, 255, 0.72);
  --tc-kpi-board-tip-strong: #ffffff;
  --tc-kpi-board-tip-total: #4ade9b;
  --tc-kpi-board-tip-series: #7ea2ff;
  --tc-kpi-board-tip-series-soft: #8c9bc4;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--tc-space-2);
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  font-family:  var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="kb"] *, [data-ui="kb"] *::before, [data-ui="kb"] *::after { box-sizing: border-box; }
[data-ui="kb"] svg { display: block; }
[data-ui="kb"] b { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
[data-ui="kb"] i { font-style: normal; }

/* ----- The bar above the cards: a heading, and the date range for all of them ----- */
.ui-kb__bar { grid-column: 1 / -1; display: flex; align-items: center; justify-content: flex-end; gap: var(--tc-space-3); min-height: 30px; }
.ui-kb__heading { flex: 1; min-width: 0; margin: 0; overflow: hidden; font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-loose); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }

/* ----- Cards: the library card ----- */
.ui-kb__card { grid-column: span 2; display: flex; flex-direction: column; min-width: 0; padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); animation: ui-kb-rise var(--tc-duration-slowest) var(--tc-ease-emphasized) both; animation-delay: calc(var(--n) * var(--tc-kpi-board-stagger)); }
.ui-kb__overview { grid-column: span 4; }
.ui-kb__focus { padding-bottom: var(--tc-space-4); }
.ui-kb__row { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-3); min-width: 0; }
.ui-kb__pair { display: grid; min-width: 0; font-variant-numeric: tabular-nums; }
.ui-kb__pair > * { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-kb__pair b { font-size: var(--tc-font-size-lg); }
.ui-kb__pair span { color: var(--tc-text-muted); }
.ui-kb__pair--end { justify-items: end; flex: none; text-align: right; }
.ui-kb__change { display: inline-flex; align-items: center; gap: var(--tc-kb-space-5px); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); color: var(--tc-status-danger-fg); font-variant-numeric: tabular-nums; }
.ui-kb__change[data-good] { color: var(--tc-status-success-fg); }

/* ----- One look for every chart: thin angular line, quiet fill, a floor line ----- */
.ui-kb__plot { position: relative; margin-top: var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); cursor: crosshair; touch-action: pan-y; }
.ui-kb__plot--small { height: 64px; }
.ui-kb__plot--large { flex: 1; min-height: 190px; margin-top: var(--tc-space-4); border-bottom: 0; }
.ui-kb__plot svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; animation: ui-kb-draw var(--tc-duration-reveal-slow) var(--tc-ease-emphasized) both; animation-delay: calc((var(--n) + 2) * var(--tc-kpi-board-stagger)); }
.ui-kb__line { fill: none; stroke: var(--tc-chart-1); stroke-width: 1.5; stroke-linejoin: miter; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.ui-kb__line--soft { stroke: var(--tc-kpi-board-series-soft); }
.ui-kb__fill { fill: var(--tc-kpi-board-well); }
.ui-kb__grid { fill: none; stroke: var(--tc-border-default); stroke-width: 1; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; }
.ui-kb__axis { position: relative; display: flex; justify-content: space-between; height: 16px; margin-top: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }

/* Pointing at a day */
.ui-kb__rule { position: absolute; bottom: 0; width: 0; margin-left: calc(var(--tc-kb-space-0_5px) * -1); border-left: 1px dashed var(--tc-chart-neutral); pointer-events: none; }
.ui-kb__dot { position: absolute; z-index: 1; width: 8px; height: 8px; margin: calc(var(--tc-space-1) * -1) 0 0 calc(var(--tc-space-1) * -1); border: 1.5px solid var(--tc-chart-1); border-radius: 50%; background: var(--tc-surface-raised); pointer-events: none; }
.ui-kb__dot--soft { border-color: var(--tc-kpi-board-series-soft); }
.ui-kb__tag { position: absolute; z-index: 2; display: inline-flex; gap: var(--tc-space-3); height: 24px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-loose); color: var(--tc-text-secondary); white-space: nowrap; pointer-events: none; transform: translate(10px, -130%); font-variant-numeric: tabular-nums; animation: ui-kb-in var(--tc-duration-fast) var(--tc-ease-standard) both; }
.ui-kb__tag[data-side="left"] { transform: translate(calc(-100% - 10px), -130%); }
.ui-kb__tag b { font-weight: var(--tc-font-weight-medium); color: var(--tc-chart-1); }
.ui-kb__axis-tag { position: absolute; top: -4px; height: 22px; padding: 0 var(--tc-kb-space-7px); border: 1px solid var(--tc-border-default); border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); transform: translateX(-50%); }

/* ----- Overview ----- */
.ui-kb__row--top { padding-bottom: var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-kb__label { font-size: var(--tc-font-size-md); color: var(--tc-text-secondary); }
.ui-kb__figure { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2-5); margin-top: var(--tc-space-1); font-variant-numeric: tabular-nums; }
.ui-kb__figure b { font-size: var(--tc-font-size-3xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); }
.ui-kb__figure--small b { font-size: var(--tc-font-size-2xl); line-height: var(--tc-line-height-display-sm); }
.ui-kb__vs { display: inline-flex; align-items: baseline; gap: var(--tc-kb-space-5px); font-size: var(--tc-font-size-md); color: var(--tc-text-muted); white-space: nowrap; }
.ui-kb__vs i { font-weight: var(--tc-font-weight-semibold); color: var(--tc-status-danger-fg); }
.ui-kb__vs i[data-good] { color: var(--tc-status-success-fg); }
.ui-kb__vs .ui-kb__change { font-size: var(--tc-font-size-md); }

/* Pickers: a select field (field tokens) with a menu (menu tokens) */
.ui-kb__pick { position: relative; flex: none; }
.ui-kb__pick-button { display: inline-flex; align-items: center; gap: var(--tc-space-2); height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-space-2-5) 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-kb__pick-button:hover, .ui-kb__pick[data-open] .ui-kb__pick-button { box-shadow: var(--tc-field-shadow-hover); }
.ui-kb__pick-button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-kb__pick-button svg { color: var(--tc-text-muted); transition: transform var(--tc-duration-moderate) var(--tc-ease-emphasized); }
.ui-kb__pick[data-open] .ui-kb__pick-button svg { transform: rotate(180deg); }
.ui-kb__menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: var(--tc-z-dropdown); min-width: max(100%, 148px); margin: 0; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); list-style: none; transform-origin: 100% 0; animation: ui-kb-menu var(--tc-duration-base) var(--tc-ease-emphasized) both; }
.ui-kb__option { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3-5); height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); color: var(--tc-text-secondary); white-space: nowrap; cursor: pointer; }
.ui-kb__option[data-active] { background: var(--tc-menu-item-hover); color: var(--tc-text-primary); }
.ui-kb__pick[data-keys] .ui-kb__option[data-active] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-kb__option[aria-selected="true"] { font-weight: var(--tc-font-weight-medium); color: var(--tc-menu-item-selected-fg); }
.ui-kb__option svg { color: var(--tc-menu-item-selected-fg); }

.ui-kb__tip { position: absolute; z-index: 3; min-width: 168px; padding: var(--tc-kb-space-9px) var(--tc-kb-space-11px) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-kpi-board-tip-bg); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-kpi-board-tip-fg); pointer-events: none; transform: translate(14px, calc(-100% - 12px)); font-variant-numeric: tabular-nums; animation: ui-kb-in var(--tc-duration-fast) var(--tc-ease-standard) both; }
.ui-kb__tip[data-side="left"] { transform: translate(calc(-100% - 14px), calc(-100% - 12px)); }
.ui-kb__tip b { font-weight: var(--tc-font-weight-medium); color: var(--tc-kpi-board-tip-strong); }
.ui-kb__tip-head { display: flex; justify-content: space-between; gap: var(--tc-space-4); margin-bottom: var(--tc-space-1-5); color: var(--tc-kpi-board-tip-strong); }
.ui-kb__tip-head b { color: var(--tc-kpi-board-tip-total); }
.ui-kb__tip-row { display: flex; align-items: center; gap: var(--tc-kb-space-7px); }
.ui-kb__tip-row span { flex: 1; }
.ui-kb__tip-row i { width: 7px; height: 7px; border: 1.5px solid var(--tc-kpi-board-tip-series); border-radius: 50%; }
.ui-kb__tip-row[data-soft] i { border-color: var(--tc-kpi-board-tip-series-soft); border-style: dashed; }

/* ----- Focus card ----- */
.ui-kb__focus .ui-kb__row--top { align-items: center; min-height: 69px; margin-bottom: var(--tc-space-4); }
.ui-kb__focus .ui-kb__plot--small { flex: 1; min-height: 64px; margin-top: var(--tc-space-4); }
.ui-kb__product { display: flex; align-items: center; gap: var(--tc-space-3); min-width: 0; }
.ui-kb__product b { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); }
.ui-kb__icon { display: grid; flex: none; place-items: center; width: 36px; height: 36px; border-radius: var(--tc-radius-lg); box-shadow: var(--tc-card-shadow); color: var(--tc-text-secondary); }
.ui-kb__focus .ui-kb__label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-kb__legend { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2); margin-top: var(--tc-space-3); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-kb__legend b { margin-right: var(--tc-space-1-5); font-weight: var(--tc-font-weight-medium); color: var(--tc-chart-1); }
/* Clean's chart blue is translucent – numbers written in it use the accent text colour instead */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="kb"] :is(.ui-kb__legend b, .ui-kb__tag b) { color: var(--tc-accent-text); }
/* The last period's line is pale, so its number is plain text with a pale swatch beside the label */
.ui-kb__legend b[data-soft] { color: var(--tc-text-secondary); }
.ui-kb__legend span::before { content: ""; display: inline-block; width: 10px; height: 0; margin: 0 var(--tc-space-1-5) var(--tc-kb-space-3px) 0; border-top: 2px solid var(--tc-chart-1); vertical-align: middle; }
.ui-kb__legend span[data-soft]::before { border-top-color: var(--tc-kpi-board-series-soft); }
/* Two classes, so these win over Button's own margin wherever the styles land */
[data-ui="kb"] .ui-kb__setup { flex: none; }
[data-ui="kb"] .ui-kb__action { width: 100%; margin-top: auto; }
[data-ui="kb"] .ui-kb__legend + .ui-kb__action { margin-top: var(--tc-space-4); }

@keyframes ui-kb-rise { from { opacity: 0; transform: translateY(8px); } }
@keyframes ui-kb-draw { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(-8px -8px -8px -8px); } }
@keyframes ui-kb-in { from { opacity: 0; } }
@keyframes ui-kb-menu { from { opacity: 0; transform: translateY(-4px) scale(0.97); } }

/* Narrower containers: the overview and the focus card take a full row, then everything stacks */
@container (max-width: 820px) {
  .ui-kb__overview, .ui-kb__focus { grid-column: span 6; }
  /* Three small cards still share a row – the change moves under the label, and its words give way */
  .ui-kb__stat .ui-kb__row { flex-direction: column; gap: var(--tc-space-0-5); }
  .ui-kb__stat .ui-kb__pair--end { justify-items: start; text-align: left; }
  .ui-kb__stat .ui-kb__change { font-size: var(--tc-font-size-sm); }
  .ui-kb__stat .ui-kb__pair--end > span:last-child { display: none; }
}
@container (max-width: 600px) {
  [data-ui="kb"] { gap: var(--tc-space-2); }
  .ui-kb__card { grid-column: span 6; }
  .ui-kb__stat .ui-kb__row { flex-direction: row; gap: var(--tc-space-3); }
  .ui-kb__stat .ui-kb__pair--end { justify-items: end; text-align: right; }
  .ui-kb__stat .ui-kb__change { font-size: var(--tc-font-size-lg); }
  .ui-kb__stat .ui-kb__pair--end > span:last-child { display: block; }
  .ui-kb__row--top { flex-wrap: wrap; }
  .ui-kb__plot--large { min-height: 160px; }
}

@media (pointer: coarse) {
  .ui-kb__option { height: 38px; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-kb__card, .ui-kb__plot svg, .ui-kb__tag, .ui-kb__tip, .ui-kb__menu, .ui-kb__pick-button, .ui-kb__pick-button svg { animation: none; transition: none; }
}
`;
}

/* ---------- Small parts ---------- */

/** "▲ 12%" in green or red; `good` decides the colour, `up` the direction of the arrow */
const change = (up: boolean, good: boolean, text: string) =>
  html`<span class="ui-kb__change" ?data-good=${good}
    ><svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" style=${up ? nothing : "transform: scaleY(-1)"}><path d="M4 1.2 7.2 6.4H.8L4 1.2Z" fill="currentColor" /></svg>${text}</span
  >`;

const chevronIcon = () =>
  svg`<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="m2.5 3.8 2.5 2.5 2.5-2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
const checkIcon = () =>
  svg`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m2.6 6.3 2.2 2.2 4.6-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
const gearIcon = () =>
  svg`<svg slot="icon" width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 4.2h5.2M10.2 4.2H12M2 9.8h1.8M6.8 9.8H12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" /><circle cx="8.7" cy="4.2" r="1.5" stroke="currentColor" stroke-width="1.3" /><circle cx="5.3" cy="9.8" r="1.5" stroke="currentColor" stroke-width="1.3" /></svg>`;
const boxIcon = () =>
  svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.9 13.3 4.8v6.4L8 14.1 2.7 11.2V4.8L8 1.9Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" /><path d="M2.9 4.9 8 7.7l5.1-2.8M8 7.7V14" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" /></svg>`;

if (!customElements.get("tc-kpi-board")) customElements.define("tc-kpi-board", TcKpiBoard);
declare global {
  interface HTMLElementTagNameMap {
    "tc-kpi-board": TcKpiBoard;
  }
}
