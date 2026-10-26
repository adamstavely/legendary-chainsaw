import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { easeOutQuart } from "../internal/ease";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";

/*
 * <tc-usage-meter> – the Lit port of src/components/usage-meter.tsx: the "Usage" card of a SaaS or AI product.
 * One big credits meter split into categories (Chat, Search, Image …) with a legend, an optional daily sparkline,
 * thin meters for plan limits (seats, storage, projects) and a button that grows more prominent near the limit.
 * Hovering a part highlights it everywhere; switching the period rolls every number to its new value while the bars
 * glide to their new widths. From `warnAt` a small amber dot warns, at 100% it says "Limit reached". Clean is one
 * white card with hairline shadows; what's left and the button sit in its last row.
 *
 *   <tc-usage-meter heading="Usage" total="10000" .used=${[{ label: "Chat", value: 4200 }]} .periods=${periods}>
 *   </tc-usage-meter>
 *
 * The host is the region, named by the heading. A period change fires a cancelable `tc-period-change`
 * ({ period }): call preventDefault() to control `period` yourself, and pass the matching `used`, `limits` and
 * `daily` back in. The button fires `tc-upgrade` ({ state }).
 */

export type UsageItem = {
  label: string;
  value: number;
  /** Any CSS color – defaults to shades of the accent, then grays */
  color?: string;
};

export type UsageLimit = {
  label: string;
  used: number;
  /** Leave out (or pass null / Infinity) for unlimited */
  total?: number | null;
  /** Shown after the numbers, e.g. "GB" */
  unit?: string;
  /** Decimal places – defaults to 1 for fractional values, else 0 */
  decimals?: number;
};

export type UsageDay = {
  /** Shown on hover, e.g. "Oct 3" */
  label: string;
  /** null for days still to come in the period */
  value: number | null;
};

export type UsagePeriod = { id: string; label: string };

export type UsageState = "ok" | "warn" | "limit";
export type UsagePeriodChange = { period: string };
export type UsageUpgrade = { state: UsageState };

/* ---------- Helpers ---------- */

// One formatter per locale and number of digits – made once, not on every call (the tween formats every frame)
const formats = new Map<string, Intl.NumberFormat>();
const numberFormat = (locale: string, digits: number) => {
  const key = `${locale}|${digits}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })));
  return f;
};
const dates = new Map<string, Intl.DateTimeFormat>();
const dateFormat = (locale: string) => {
  let f = dates.get(locale);
  if (!f) dates.set(locale, (f = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" })));
  return f;
};
/** Number and unit with a no-break space, so "3.2 GB" never splits */
const withUnit = (text: string, unit?: string) => (unit ? `${text} ${unit}` : text);

/** "Resets in 9 days" – before the clock is known (server render, first client render) the date itself */
function resetText(at: Date, now: number | null, date: string) {
  if (now === null) return `Resets ${date}`;
  const days = Math.ceil((at.getTime() - now) / 864e5);
  if (days <= 0) return "Resets today";
  if (days === 1) return "Resets tomorrow";
  return `Resets in ${days} days`;
}

const PALETTE = ["var(--tc-usage-meter-series-1)", "var(--tc-usage-meter-series-2)", "var(--tc-usage-meter-series-3)", "var(--tc-usage-meter-series-4)", "var(--tc-usage-meter-series-5)"];

type Row = UsageItem & { color: string; leaving?: boolean };
type Get = (key: string) => number;

/** Moves a pill under the active child of a list – no transition on the first placement, so it doesn't fly in */
function glide(list: HTMLElement | null, pill: HTMLElement | null, selector: string) {
  if (!list || !pill) return;
  const active = list.querySelector<HTMLElement>(selector);
  if (!active || !active.offsetWidth) {
    pill.style.opacity = "0";
    return;
  }
  const first = !pill.dataset.ready;
  if (first) pill.style.transition = "none";
  pill.style.opacity = "1";
  pill.style.width = `${active.offsetWidth}px`;
  pill.style.height = `${active.offsetHeight}px`;
  pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
  if (first) {
    pill.dataset.ready = "1";
    void pill.offsetWidth;
    pill.style.transition = "";
  }
}

/** Gives each new label (without its own color) the next palette shade; known labels keep theirs */
function assignColors(known: Record<string, string>, items: UsageItem[]) {
  const out = { ...known };
  for (const item of items) if (!item.color && !(item.label in out)) out[item.label] = PALETTE[Object.keys(out).length % PALETTE.length];
  return out;
}

/** The new rows in their order; rows that disappeared stay at their old place (at zero) while they fold away */
function merge(prev: Row[], next: Row[]) {
  const out = [...next];
  prev.forEach((p, i) => {
    if (next.some((n) => n.label === p.label)) return;
    out.splice(Math.min(i, out.length), 0, { ...p, value: 0, leaving: true });
  });
  return out;
}

let instances = 0;

/**
 * A usage card: a credits meter split into categories, a daily sparkline, plan limits and an upgrade button.
 * @tag tc-usage-meter
 * @fires tc-period-change - A period is picked in the switch; detail `{ period: string }`. Cancelable: prevent it to control `period`
 * @fires tc-upgrade - The button is pressed; detail `{ state: "ok" | "warn" | "limit" }`
 */
export class TcUsageMeter extends TcElement {
  static override ui = "um";

  /** "stacked" (default): one column at most 460px wide · "wide": full width, two columns from 640px */
  @property() accessor layout: "stacked" | "wide" = "stacked";
  /** Credits included in the plan */
  @property({ type: Number }) accessor total = 0;
  /** What the credits were spent on in the shown period */
  @property({ attribute: false }) accessor used: UsageItem[] = [];
  /** Thin meters below, e.g. seats, storage, projects */
  @property({ attribute: false }) accessor limits: UsageLimit[] = [];
  /** Options of the period switch – no switch when left out */
  @property({ attribute: false }) accessor periods: UsagePeriod[] | undefined = undefined;
  /** The chosen period id – unset is the first of `periods` */
  @property() accessor period: string | undefined = undefined;
  /** When the credits reset – shown as "Resets in 9 days" */
  @property({ attribute: "reset-at" }) accessor resetAt: Date | string | number | undefined = undefined;
  /** The current time in epoch ms, for "Resets in …" – unset reads the clock after the element connects */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Locale for numbers and dates */
  @property() accessor locale = "en-US";
  /** Usage per day for the sparkline under the meter */
  @property({ attribute: false }) accessor daily: UsageDay[] | undefined = undefined;
  /** The heading, and the region's name */
  @property() accessor heading = "Usage";
  /** Plan name next to the reset date, e.g. "Pro plan" */
  @property() accessor plan = "";
  /** Unit of the credits */
  @property() accessor unit = "credits";
  /** Share from which the meter warns (0–1) */
  @property({ type: Number, attribute: "warn-at" }) accessor warnAt = 0.8;
  /** Button text while there is room left */
  @property({ attribute: "upgrade-label" }) accessor upgradeLabel = "Upgrade";
  /** Button text near and at the limit */
  @property({ attribute: "top-up-label" }) accessor topUpLabel = "Add credits";

  /** @internal Counted in once it scrolls into view */
  @state() private accessor visible = false;
  /** @internal The highlighted category */
  @state() private accessor active: string | null = null;
  /** @internal The tooltip keeps its text while fading out */
  @state() private accessor tipLabel: string | null = null;
  /** @internal The day pointed at in the sparkline */
  @state() private accessor day: number | null = null;
  /** @internal */
  @state() private accessor announce = "";
  /** @internal The clock read after connecting, when `now` isn't given */
  @state() private accessor clock: number | null = null;
  /** @internal Rows that fold away, while they do */
  @state() private accessor folding: Row[] | null = null;
  /** @internal A new number of days grows in fresh */
  @state() private accessor regrow = false;

  private readonly uid = `tc-um${++instances}`;
  /** The page named the region itself */
  private ownName = false;
  private palette: Record<string, string> = {};
  private usedKey: string | null = null;
  private shownRows: Row[] = [];
  private foldTimer = 0;
  private lastState: UsageState | null = null;
  private lastDays: number | null = null;
  private io?: IntersectionObserver;
  private clockTimer = 0;
  private sizers: ResizeObserver[] = [];
  private switchRo?: ResizeObserver;
  private switchEl: HTMLElement | null = null;
  private glideKey = "";
  /* The tween: every number rolls from where it is to its target, new ones from zero */
  private cur: Record<string, number> = {};
  private signature = "";
  private started = false;
  private frame = 0;
  private to: Record<string, number> = {};

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= this.hasAttribute("aria-label") || (this.hasAttribute("aria-labelledby") && this.getAttribute("aria-labelledby") !== `${this.uid}-title`);
    // Count in once the card scrolls into view
    if (!this.visible) {
      if (typeof IntersectionObserver === "undefined") this.visible = true;
      else {
        this.io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              this.visible = true;
              this.io?.disconnect();
              this.io = undefined;
            }
          },
          { threshold: 0.2 },
        );
        this.io.observe(this);
      }
    }
    if (this.hasUpdated) this.observeSizes();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
    this.io = undefined;
    clearInterval(this.clockTimer);
    this.clockTimer = 0;
    clearTimeout(this.foldTimer);
    this.foldTimer = 0;
    if (this.folding) this.folding = null;
    // A tween cut short ends on its target
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.cur = { ...this.to };
    }
    this.sizers.forEach((ro) => ro.disconnect());
    this.sizers = [];
    this.switchRo?.disconnect();
    this.switchRo = undefined;
    this.switchEl = null;
    document.removeEventListener("keydown", this.onDocKey);
  }

  /** @internal */
  private get activePeriod() {
    return this.period ?? this.periods?.[0]?.id;
  }
  /** @internal */
  private fmt = (n: number, digits = 0) => numberFormat(this.locale, digits).format(n);
  /** @internal */
  private get sum() {
    return this.used.reduce((s, u) => s + Math.max(0, u.value), 0);
  }
  /** @internal */
  private get share() {
    return this.total > 0 ? this.sum / this.total : 0;
  }
  /** @internal */
  private get meterState(): UsageState {
    const share = this.share;
    return share >= 1 ? "limit" : share >= this.warnAt ? "warn" : "ok";
  }
  /** @internal The rows of the legend and the bar */
  private get rows(): Row[] {
    return this.folding ?? this.incoming;
  }
  /** @internal */
  private get incoming(): Row[] {
    return this.used.map((u) => ({ ...u, color: u.color ?? this.palette[u.label] }));
  }
  /** @internal */
  private get: Get = (key) => this.cur[key] ?? 0;

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.dataset.state = this.meterState;
    if (this.layout === "wide") this.dataset.layout = "wide";
    else delete this.dataset.layout;

    // Stable default colors per label, so "API" keeps its shade when "Image" drops out
    if (this.used.some((u) => !u.color && !(u.label in this.palette))) this.palette = assignColors(this.palette, this.used);
    // Rows that leave fold away at their old place; the timer drops them afterwards
    const usedKey = this.used.map((u) => `${u.label}:${u.value}:${u.color ?? ""}`).join("|");
    if (this.usedKey !== null && usedKey !== this.usedKey) {
      clearTimeout(this.foldTimer);
      const prev = this.shownRows;
      const next = merge(
        prev.filter((p) => !p.leaving),
        this.incoming,
      );
      if (!next.some((r) => r.leaving)) this.folding = null;
      else {
        this.folding = next;
        this.foldTimer = window.setTimeout(() => {
          this.foldTimer = 0;
          this.folding = null;
        }, 460);
      }
    }
    this.usedKey = usedKey;
    this.shownRows = this.rows;

    // A new number of days (30 → 7) grows in fresh; the first fill comes from the count-in
    const days = this.daily?.length ?? 0;
    if (this.lastDays !== null && days !== this.lastDays) this.regrow = true;
    this.lastDays = days;

    // Screen readers hear when the state changes
    const st = this.meterState;
    if (this.lastState !== null && st !== this.lastState) {
      const { heading: title, unit, fmt, sum, total } = this;
      this.announce =
        st === "limit"
          ? `${title}: limit reached, ${fmt(sum)} of ${fmt(total)} ${unit} used`
          : st === "warn"
            ? `${title}: running low, ${Math.round(this.share * 100)}% of ${unit} used`
            : `${title}: ${fmt(sum)} of ${fmt(total)} ${unit} used`;
    }
    this.lastState = st;

    this.tween();
  }

  /** @internal Starts rolling the numbers when their targets change */
  private tween() {
    const target: Record<string, number> = { used: this.sum, left: Math.max(0, this.total - this.sum), pct: this.share * 100 };
    this.rows.forEach((r) => (target[`r:${r.label}`] = r.leaving ? 0 : Math.max(0, r.value)));
    this.limits.forEach((l) => (target[`l:${l.label}`] = l.used));
    this.daily?.forEach((d, i) => (target[`d:${i}`] = d.value ?? 0));
    if (!this.visible) for (const k in target) target[k] = 0;
    const signature = JSON.stringify(target);
    if (!this.signature) for (const k in target) this.cur[k] = 0;
    if (signature === this.signature) return;
    this.signature = signature;
    this.to = target;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    const from = { ...this.cur };
    // Nothing moves (empty, or already there): no frame loop
    if (reducedMotion() || Object.keys(target).every((k) => (from[k] ?? 0) === target[k])) {
      this.cur = { ...target };
      return;
    }
    // The count-in from zero takes a little longer than later changes
    const live = Object.values(target).some((v) => v !== 0);
    const duration = live && !this.started ? 1200 : 650;
    if (live) this.started = true;
    // The first frame's timestamp is the start, so no clock is read
    let start = -1;
    const step = (now: number) => {
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutQuart(t);
      const next: Record<string, number> = {};
      for (const k in target) next[k] = (from[k] ?? 0) + (target[k] - (from[k] ?? 0)) * e;
      this.cur = next;
      this.frame = t < 1 ? requestAnimationFrame(step) : 0;
      this.requestUpdate();
    };
    this.frame = requestAnimationFrame(step);
  }

  protected override firstUpdated() {
    this.observeSizes();
  }

  /** @internal The card glides to its new height when rows come or go; the button to the width of its new label */
  private observeSizes() {
    if (this.sizers.length || typeof ResizeObserver !== "function") return;
    const follow = (box: HTMLElement | null, inner: HTMLElement | null, side: "height" | "width") => {
      if (!box || !inner) return;
      const set = () => (box.style[side] = `${side === "height" ? inner.offsetHeight : inner.offsetWidth}px`);
      set();
      const ro = new ResizeObserver(set);
      ro.observe(inner);
      this.sizers.push(ro);
    };
    follow(this.querySelector(".ui-um__card"), this.querySelector(".ui-um__inner"), "height");
    follow(this.querySelector(".ui-um__action"), this.querySelector(".ui-um__action-inner"), "width");
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // The heading names the region unless the page gave it a name of its own
    if (!this.ownName) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    // "Resets in …": the clock is read after connecting and once a minute, only when `now` isn't given
    const ownClock = this.now === undefined && this.resetAt !== undefined;
    if (ownClock && !this.clockTimer) {
      const tick = () => (this.clock = Date.now());
      tick();
      this.clockTimer = window.setInterval(tick, 60_000);
    } else if (!ownClock && this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = 0;
    }
    // A tooltip shown by hover closes with Escape, wherever focus is, and focus stays where it was (1.4.13)
    if (this.active) document.addEventListener("keydown", this.onDocKey);
    else document.removeEventListener("keydown", this.onDocKey);
    // The selection pill glides to the chosen period – also when a narrow layout changes the option widths
    const sw = this.querySelector<HTMLElement>(".ui-um__switch");
    if (sw !== this.switchEl) {
      this.switchRo?.disconnect();
      this.switchRo = undefined;
      this.switchEl = sw;
      this.glideKey = "";
      if (sw && typeof ResizeObserver === "function") {
        this.switchRo = new ResizeObserver(() => glide(sw, sw.querySelector(".ui-um__pill"), '[aria-checked="true"]'));
        this.switchRo.observe(sw);
      }
    }
    const glideKey = `${this.activePeriod}|${(this.periods ?? []).map((p) => `${p.id}:${p.label}`).join("|")}`;
    if (sw && glideKey !== this.glideKey) {
      this.glideKey = glideKey;
      glide(sw, sw.querySelector(".ui-um__pill"), '[aria-checked="true"]');
    }
  }

  private onDocKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.highlight(null);
  };

  /** @internal */
  private highlight(label: string | null) {
    this.active = label;
    if (label) this.tipLabel = label;
  }

  /** @internal */
  private choose(id: string) {
    if (id === this.activePeriod) return;
    if (this.emit<UsagePeriodChange>("tc-period-change", { period: id }, { cancelable: true })) this.period = id;
    this.active = null;
    this.day = null;
  }

  private onSwitchKey = (e: KeyboardEvent) => {
    const periods = this.periods ?? [];
    const i = periods.findIndex((p) => p.id === this.activePeriod);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % periods.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + periods.length) % periods.length;
    if (next < 0) return;
    e.preventDefault();
    this.choose(periods[next].id);
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  };

  /** @internal Where each part starts and ends on the bar */
  private segments() {
    const scale = Math.max(this.total, this.sum) || 1;
    let cursor = 0;
    return this.rows.map((r) => {
      const width = (this.get(`r:${r.label}`) / scale) * 100;
      const seg = { ...r, left: cursor, width };
      cursor += width;
      return seg;
    });
  }

  /** @internal Mouse hover shows and hides; a tap toggles, since touch has no hover to leave */
  private segmentAt(e: PointerEvent) {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100;
    return this.segments().find((s) => !s.leaving && s.width > 0 && x >= s.left && x <= s.left + s.width)?.label ?? null;
  }

  private onBarMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && !this.querySelector(".ui-um__tip")?.contains(e.target as Node)) this.highlight(this.segmentAt(e));
  };
  private onBarLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") this.highlight(null);
  };
  private onBarUp = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    const label = this.segmentAt(e);
    this.highlight(label === this.active ? null : label);
  };
  private onBlurClear = () => this.highlight(null);

  private onBarKey = (e: KeyboardEvent) => {
    const list = this.rows.filter((r) => !r.leaving && r.value > 0);
    if (!list.length) return;
    const active = this.active;
    const i = list.findIndex((r) => r.label === active);
    let next: Row | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = list[(i + 1) % list.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = list[(i - 1 + list.length) % list.length];
    else if (e.key === "Home") next = list[0];
    else if (e.key === "End") next = list[list.length - 1];
    else if (e.key === "Escape" && active) this.highlight(null);
    else return;
    e.preventDefault();
    if (!next) return;
    this.highlight(next.label);
    const sum = this.sum;
    this.announce = `${next.label}: ${withUnit(this.fmt(next.value), this.unit)}, ${this.fmt(sum ? (next.value / sum) * 100 : 0)}%`;
  };

  /** @internal */
  private dayAt(e: PointerEvent) {
    const days = this.daily ?? [];
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const i = Math.floor(((e.clientX - box.left) / box.width) * days.length);
    return Math.min(days.length - 1, Math.max(0, i));
  }
  private onSparkPointer = (e: PointerEvent) => (this.day = this.dayAt(e));
  private onSparkLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") this.day = null;
  };
  private onSparkBlur = () => (this.day = null);
  private onSparkKey = (e: KeyboardEvent) => {
    const n = this.daily?.length ?? 0;
    const d = this.day;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") this.day = Math.min(n - 1, d === null ? 0 : d + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") this.day = Math.max(0, d === null ? n - 1 : d - 1);
    else if (e.key === "Home") this.day = 0;
    else if (e.key === "End") this.day = n - 1;
    else if (e.key === "Escape" && d !== null) this.day = null;
    else return;
    e.preventDefault();
  };

  /** @internal The credits bar, split into its parts, with the tooltip of the part pointed at – and the legend */
  private renderBreakdown() {
    const { rows, total, sum, unit, fmt, active, tipLabel, get } = this;
    const segments = this.segments();
    const activeRow = rows.find((r) => r.label === active && !r.leaving);
    const tipRow = rows.find((r) => r.label === tipLabel);
    const tipSeg = segments.find((s) => s.label === tipLabel);
    const tipCenter = tipSeg ? Math.min(100, Math.max(0, tipSeg.left + tipSeg.width / 2)) : 50;
    // role="meter" goes through the ARIA-reflecting `role` property: lit-analyzer's role list predates ARIA 1.2's meter
    const shareText = (label: string) => fmt(get("used") ? (get(`r:${label}`) / get("used")) * 100 : 0);
    return html`<div
        class="ui-um__bar"
        tabindex="0"
        role="group"
        aria-label=${`${fmt(sum)} of ${fmt(total)} ${unit} used – arrow keys read each category`}
        ?data-active=${!!activeRow}
        @pointermove=${this.onBarMove}
        @pointerleave=${this.onBarLeave}
        @pointerup=${this.onBarUp}
        @keydown=${this.onBarKey}
        @blur=${this.onBlurClear}
      >
        <div
          class="ui-um__track"
          .role=${"meter"}
          aria-label=${`${unit[0]?.toUpperCase() ?? ""}${unit.slice(1)} used`}
          aria-valuemin="0"
          aria-valuemax=${total}
          aria-valuenow=${Math.min(sum, total)}
          aria-valuetext=${`${fmt(sum)} of ${fmt(total)} ${unit}`}
        >${repeat(
          segments,
          (s) => s.label,
          (s) => html`<span class="ui-um__seg" ?data-active=${s.label === active} style=${styleMap({ width: `${s.width}%`, background: s.color })}></span>`,
        )}</div>
        <div class="ui-um__tip" ?data-open=${!!activeRow} style=${styleMap({ left: `${tipCenter}%`, "--tc-usage-meter-tip-x": `${-tipCenter}%` })} aria-hidden="true">${tipRow
          ? html`<span class="ui-um__tip-label"><span class="ui-um__swatch" style=${styleMap({ background: tipRow.color })}></span>${tipRow.label}</span><span class="ui-um__tip-value">${withUnit(fmt(tipRow.value), unit)}<span class="ui-um__muted"> · ${fmt(sum ? (tipRow.value / sum) * 100 : 0)}%</span></span>`
          : nothing}</div>
      </div>
      <ul class="ui-um__legend" aria-label="By category" ?data-active=${!!activeRow}>
        ${repeat(
          rows,
          (r) => r.label,
          (r) => html`<li class="ui-um__row" ?data-leaving=${!!r.leaving}>
            <div
              class="ui-um__item"
              ?data-active=${r.label === active}
              @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && !r.leaving && this.highlight(r.label)}
              @pointerleave=${(e: PointerEvent) => e.pointerType === "mouse" && this.highlight(null)}
              @pointerup=${(e: PointerEvent) => e.pointerType !== "mouse" && !r.leaving && this.highlight(r.label === this.active ? null : r.label)}
            >
              <span class="ui-um__swatch" style=${styleMap({ background: r.color })}></span>
              <span class="ui-um__label">${r.label}</span>
              <span class="ui-um__value">${fmt(get(`r:${r.label}`))}</span>
              <span class="ui-um__share">${shareText(r.label)}%</span>
            </div>
          </li>`,
        )}
      </ul>`;
  }

  /** @internal The daily sparkline */
  private renderDaily(days: UsageDay[]) {
    const { day, fmt, unit, get } = this;
    const dayMax = Math.max(1, ...days.map((d) => d.value ?? 0));
    const past = days.filter((d) => d.value !== null);
    const average = past.length ? past.reduce((s, d) => s + (d.value ?? 0), 0) / past.length : 0;
    const hoveredDay = day !== null ? days[day] : undefined;
    // A slider over the days: screen readers read the day's value as the arrow keys move (the readout above is visual)
    const lastPast = Math.max(0, days.reduce((last, d, i) => (d.value !== null ? i : last), -1));
    const dayText = (d: UsageDay) => `${d.label}: ${d.value === null ? "no data yet" : withUnit(fmt(d.value), unit)}`;
    return html`<div class="ui-um__daily">
      <div class="ui-um__daily-head">
        <span>Per day</span>
        ${keyed(
          hoveredDay ? `d${day}` : "avg",
          html`<span class="ui-um__daily-read" aria-hidden="true">${hoveredDay
            ? html`${hoveredDay.label} · <b>${hoveredDay.value === null ? "–" : withUnit(fmt(hoveredDay.value), unit)}</b>`
            : html`Avg <b>${fmt(average)}</b> / day`}</span>`,
        )}
      </div>
      ${keyed(
        days.length,
        html`<div
          class="ui-um__spark"
          tabindex="0"
          role="slider"
          aria-label=${`${this.heading} per day`}
          aria-valuemin="1"
          aria-valuemax=${days.length}
          aria-valuenow=${(day ?? lastPast) + 1}
          aria-valuetext=${hoveredDay ? dayText(hoveredDay) : `Average ${fmt(average)} ${unit} per day`}
          ?data-hover=${day !== null}
          ?data-regrow=${this.regrow}
          ?data-few=${days.length <= 14}
          @pointermove=${this.onSparkPointer}
          @pointerdown=${this.onSparkPointer}
          @pointerleave=${this.onSparkLeave}
          @keydown=${this.onSparkKey}
          @blur=${this.onSparkBlur}
        >${days.map(
          (d, i) =>
            html`<span class="ui-um__day" ?data-future=${d.value === null} ?data-active=${i === day} style=${styleMap({ "--i": String(i) })}><span style=${styleMap({ height: d.value === null ? undefined : `${Math.max(4, (get(`d:${i}`) / dayMax) * 100)}%` })}></span></span>`,
        )}</div>`,
      )}
    </div>`;
  }

  /** @internal Thin meters for the plan limits */
  private renderLimits(limits: UsageLimit[]) {
    const { fmt, get, warnAt } = this;
    return html`<ul class="ui-um__limits" aria-label="Plan limits" style=${styleMap({ "--n": String(Math.min(3, limits.length)) })}>
      ${repeat(
        limits,
        (l) => l.label,
        (l) => {
          const unlimited = l.total == null || !isFinite(l.total);
          const digits = l.decimals ?? (Number.isInteger(l.used) && (unlimited || Number.isInteger(l.total)) ? 0 : 1);
          const ratio = unlimited ? 0 : l.used / Math.max(l.total!, 1e-9);
          const lstate: UsageState = unlimited ? "ok" : ratio >= 1 ? "limit" : ratio >= warnAt ? "warn" : "ok";
          const totalText = unlimited ? "∞" : fmt(l.total!, Number.isInteger(l.total) ? 0 : digits);
          const width = `${Math.min(100, (get(`l:${l.label}`) / Math.max(l.total ?? 0, 1e-9)) * 100)}%`;
          return html`<li class="ui-um__limit" data-state=${lstate}>
            <span class="ui-um__limit-label">${l.label}${lstate !== "ok"
              ? html`<span class="ui-um__dot" aria-hidden="true"></span><span class="ui-um__sr">${lstate === "limit" ? ", at the limit" : ", close to the limit"}</span>`
              : nothing}</span>
            <span class="ui-um__limit-value">${fmt(get(`l:${l.label}`), digits)}<span class="ui-um__muted"> of ${withUnit(totalText, unlimited ? undefined : l.unit)}</span></span>
            ${unlimited
              ? html`<span class="ui-um__thin" data-unlimited="" aria-label=${`${l.label}: ${fmt(l.used, digits)}, unlimited`} role="img"></span>`
              : html`<span
                  class="ui-um__thin"
                  .role=${"meter"}
                  aria-label=${l.label}
                  aria-valuemin="0"
                  aria-valuemax=${l.total!}
                  aria-valuenow=${Math.min(l.used, l.total!)}
                  aria-valuetext=${`${fmt(l.used, digits)} of ${withUnit(totalText, l.unit)}`}
                ><span style=${styleMap({ width })}></span></span>`}
          </li>`;
        },
      )}
    </ul>`;
  }

  protected override render() {
    const { fmt, unit, total, sum, get } = this;
    const st = this.meterState;
    const strong = st !== "ok";
    const reset = this.resetAt !== undefined ? new Date(this.resetAt) : null;
    const current = this.now ?? this.clock;
    const periods = this.periods;
    const active = this.activePeriod;
    const days = this.daily ?? [];
    const dot = html`<span class="ui-um__dot" aria-hidden="true"></span>`;

    return html`
      <div class="ui-um__card">
        <div class="ui-um__inner">
          <header class="ui-um__head">
            <div class="ui-um__heading">
              <h3 id=${`${this.uid}-title`} class="ui-um__title">${this.heading}</h3>
              ${this.plan || reset
                ? html`<p class="ui-um__sub">${this.plan}${this.plan && reset ? html`<span class="ui-um__sep" aria-hidden="true">·</span>` : nothing}${reset
                    ? html`<time datetime=${reset.toISOString()} title=${`Resets on ${dateFormat(this.locale).format(reset)}`}>${resetText(reset, current, dateFormat(this.locale).format(reset))}</time>`
                    : nothing}</p>`
                : nothing}
            </div>
            ${periods && periods.length > 1
              ? html`<div class="ui-um__switch" role="radiogroup" aria-label="Period" @keydown=${this.onSwitchKey}>
                  <span class="ui-um__pill" aria-hidden="true"></span>
                  ${repeat(
                    periods,
                    (p) => p.id,
                    (p) =>
                      html`<button type="button" role="radio" aria-checked=${p.id === active ? "true" : "false"} tabindex=${p.id === active ? 0 : -1} class="ui-um__option" @click=${() => this.choose(p.id)}>${p.label}</button>`,
                  )}
                </div>`
              : nothing}
          </header>

          <div class="ui-um__figure">
            <p class="ui-um__amount"><span class="ui-um__big">${fmt(get("used"))}</span><span class="ui-um__of">of ${withUnit(fmt(total), unit)}</span></p>
            <span class="ui-um__pct" data-state=${st}>${strong ? dot : nothing}${fmt(Math.min(get("pct"), 999))}%</span>
          </div>

          ${this.renderBreakdown()}${days.length > 0 ? this.renderDaily(days) : nothing}${this.limits.length > 0 ? this.renderLimits(this.limits) : nothing}
        </div>
      </div>

      <div class="ui-um__foot">
        ${keyed(
          st,
          html`<span class="ui-um__status">${strong ? dot : nothing}${st === "limit"
            ? html`<b>Limit reached</b>${sum > total ? html`<span class="ui-um__muted">${withUnit(fmt(sum - total), "over")}</span>` : nothing}`
            : html`${st === "warn" ? html`<b>Running low</b>` : nothing}<span class=${ifDefined(st === "warn" ? "ui-um__muted" : undefined)}>${withUnit(fmt(get("left")), unit)} left</span>`}</span>`,
        )}
        <button type="button" class="ui-um__action" ?data-strong=${strong} @click=${() => this.emit<UsageUpgrade>("tc-upgrade", { state: this.meterState })}>
          <span class="ui-um__action-inner">${keyed(strong ? "top-up" : "upgrade", html`<span class="ui-um__action-text">${strong ? this.topUpLabel : this.upgradeLabel}</span>`)}</span>
        </button>
      </div>

      <span class="ui-um__live ui-um__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="um"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="um"] {
  /* Series colours of the breakdown, largest first */
  --tc-usage-meter-series-1: light-dark(#2f6bff, #6d8bff);
  --tc-usage-meter-series-2: light-dark(#74a0ff, #4c66c9);
  --tc-usage-meter-series-3: light-dark(#b4cbff, #34468a);
  --tc-usage-meter-series-4: light-dark(#a8a8ae, #6b6b72);
  --tc-usage-meter-series-5: light-dark(#d4d4d8, #45454b);
  /* The daily bars */
  --tc-usage-meter-spark: light-dark(#dcdce0, #3a3a40);
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 460px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="um"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="um"] {
  /* The parts: the accent blue, then lighter tints of it, then a gray */
  --tc-usage-meter-series-1: light-dark(rgba(0, 96, 226, 0.765), #4d8dff);
  --tc-usage-meter-series-2: light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.62));
  --tc-usage-meter-series-3: light-dark(rgba(0, 96, 226, 0.3), rgba(77, 141, 255, 0.4));
  --tc-usage-meter-series-4: light-dark(rgba(0, 96, 226, 0.16), rgba(77, 141, 255, 0.22));
  --tc-usage-meter-series-5: light-dark(rgba(0, 0, 0, 0.14), rgba(255, 255, 255, 0.16));
  --tc-usage-meter-spark: var(--tc-fill-strong);
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 460px;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="um"] *, [data-ui="um"] *::before, [data-ui="um"] *::after { box-sizing: border-box; }
:where([data-ui="um"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="um"]) :is(h3, p, ul) { margin: 0; padding: 0; }
:where([data-ui="um"]) ul { list-style: none; }
[data-ui="um"] :is(button, [tabindex="0"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="um"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-um__muted { color: var(--tc-text-muted); }
.ui-um__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card (Clean: the body of the one card) – glides to its new height when rows come or go */
.ui-um__card { overflow: hidden; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
.ui-um__inner { display: flow-root; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__inner { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__card { border-radius: var(--tc-card-radius) var(--tc-card-radius) 0 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__inner { padding: var(--tc-space-4); }
/* Head: title and reset date, the period switch on the right */
.ui-um__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-3); }
.ui-um__heading { min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__heading { padding-top: var(--tc-space-0-5); }
.ui-um__title { overflow: hidden; font-weight: var(--tc-font-weight-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__title { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__title { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); }
.ui-um__sub { overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__sub { font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__sub { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-um__sep { margin: 0 var(--tc-space-1-5); color: var(--tc-text-disabled); }
/* The period switch: a segmented control – the thumb glides to the chosen period */
.ui-um__switch { position: relative; display: grid; grid-auto-columns: auto; grid-auto-flow: column; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-um__pill {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  background: var(--tc-seg-thumb-bg);
  box-shadow: var(--tc-seg-thumb-shadow);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move), width var(--tc-duration-slow) var(--tc-ease-move), height var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-um__option { position: relative; z-index: 1; min-width: 0; overflow: hidden; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__option { height: 26px; padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__option { height: 24px; padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-um__option:hover, .ui-um__option[aria-checked="true"] { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__option[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
/* The big number and its share */
.ui-um__figure { display: flex; justify-content: space-between; gap: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__figure { align-items: baseline; margin-top: var(--tc-space-4-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__figure { align-items: center; margin-top: var(--tc-space-3-5); }
.ui-um__amount { display: flex; flex-wrap: wrap; align-items: baseline; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__amount { column-gap: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__amount { column-gap: var(--tc-space-2); }
.ui-um__big { font-weight: var(--tc-font-weight-strong); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__big { font-size: var(--tc-font-size-4xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__big { font-size: var(--tc-font-size-3xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-strong); }
.ui-um__of { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__of { font-size: var(--tc-font-size-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__of { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__pct { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; transition: color var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__pct[data-state="warn"] { color: var(--tc-status-warning-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__pct[data-state="limit"] { color: var(--tc-text-primary); }
/* The share as a status pill – tinted amber, then red, near and at the limit */
:where([data-look="clean"], [data-look="clean"] *).ui-um__pct {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px-lg);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-secondary);
  font-variant-numeric: tabular-nums;
  transition: color var(--tc-duration-moderate) var(--tc-ease-standard), background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-um__pct[data-state="warn"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__pct[data-state="limit"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The only place amber shows up: a small dot (the words next to it say the same) */
.ui-um__dot { display: inline-block; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-status-warning-solid); animation: ui-um-pop var(--tc-duration-slower) var(--tc-ease-spring) both; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="um"][data-state="limit"] :is(.ui-um__pct, .ui-um__status) .ui-um__dot,
:where([data-look="standard"], [data-look="standard"] *).ui-um__limit[data-state="limit"] .ui-um__dot { box-shadow: 0 0 0 3px color-mix(in srgb, var(--tc-status-warning-solid) 22%, transparent); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="um"][data-state="limit"] :is(.ui-um__pct, .ui-um__status) .ui-um__dot,
:where([data-look="clean"], [data-look="clean"] *).ui-um__limit[data-state="limit"] .ui-um__dot { background: var(--tc-status-danger-solid); }
/* The stacked bar – the hero meter */
.ui-um__bar { position: relative; margin-top: var(--tc-space-2-5); padding: var(--tc-space-1) 0; border-radius: var(--tc-radius-xs); cursor: default; }
.ui-um__track { display: flex; height: var(--tc-meter-h-hero); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-um__seg { position: relative; flex: none; height: 100%; overflow: hidden; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
/* A thin cut between the parts */
.ui-um__seg::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: 2px; background: var(--tc-surface-raised); }
.ui-um__bar[data-active] .ui-um__seg:not([data-active]) { opacity: 0.3; }
/* Tooltip: a small card anchored to the middle of the part, shifted so it never leaves the card. It can be hovered
   (it sits inside the bar) and closes with Escape */
.ui-um__tip {
  position: absolute;
  bottom: calc(100% + 6px);
  z-index: 2;
  display: grid;
  background: var(--tc-surface-overlay);
  box-shadow: var(--tc-shadow-overlay);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(var(--tc-usage-meter-tip-x), 4px) scale(0.97);
  transition: left var(--tc-duration-moderate) var(--tc-ease-move), transform var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-um__tip { gap: 1px; padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__tip { gap: var(--tc-space-0-5); padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-radius-md); }
.ui-um__tip[data-open] { opacity: 1; transform: translate(var(--tc-usage-meter-tip-x), 0); pointer-events: auto; }
.ui-um__tip-label { display: flex; align-items: center; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__tip-label { gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__tip-label { gap: var(--tc-space-1-5); line-height: var(--tc-line-height-tight); }
.ui-um__tip-value { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__tip-value { line-height: var(--tc-line-height-normal); }
.ui-um__tip-value .ui-um__muted { font-weight: var(--tc-font-weight-regular); }
/* Legend: one row per category, highlighted with the bar */
.ui-um__legend { display: grid; margin-top: var(--tc-space-2-5); }
.ui-um__row { display: grid; grid-template-rows: 1fr; animation: ui-um-grow var(--tc-duration-slower) var(--tc-ease-move) both; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-instant), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-um__row[data-leaving] { grid-template-rows: 0fr; opacity: 0; pointer-events: none; }
.ui-um__item { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: 0; margin: 0 -8px; padding: 0 var(--tc-space-2); overflow: hidden; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__item { height: 30px; border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__item { height: 32px; border-radius: var(--tc-radius-sm); }
.ui-um__row[data-leaving] .ui-um__item { background: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__item[data-active] { background: var(--tc-fill-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__item[data-active] { background: var(--tc-fill-subtle); }
/* The other rows step back – the swatch fades, the text stays readable */
.ui-um__legend[data-active] .ui-um__item:not([data-active]) .ui-um__swatch { opacity: 0.35; }
.ui-um__legend[data-active] .ui-um__item:not([data-active]) :is(.ui-um__label, .ui-um__value) { color: var(--tc-text-muted); }
.ui-um__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-um__label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__label { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__label { color: var(--tc-text-primary); }
.ui-um__value { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-um__share { width: 40px; text-align: right; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__share { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* Daily sparkline */
.ui-um__daily-head { display: flex; justify-content: space-between; gap: var(--tc-space-3); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__daily { margin-top: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__daily { margin-top: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__daily-head { align-items: center; line-height: var(--tc-line-height-tight); }
/* Clean: the caption on the left, the readout on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-um__daily-head > :first-child { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-um__daily-read { font-variant-numeric: tabular-nums; animation: ui-um-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-um__spark { display: flex; align-items: stretch; gap: var(--tc-space-0-5); margin-top: var(--tc-space-2); border-radius: var(--tc-radius-xs); cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__spark { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__spark { height: 32px; }
/* A week gets wider gaps, so seven bars don't read as one block */
.ui-um__spark[data-few] { gap: var(--tc-space-1); }
.ui-um__day { display: flex; flex: 1 1 0; align-items: flex-end; min-width: 0; }
.ui-um__day > span { width: 100%; border-radius: var(--tc-radius-2xs); background: var(--tc-usage-meter-spark); transform-origin: bottom; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-um__spark[data-regrow] .ui-um__day > span { animation: ui-um-rise var(--tc-duration-slowest) var(--tc-ease-move) both; animation-delay: calc(var(--i) * var(--tc-duration-instant) / 5); }
.ui-um__day[data-future] > span { height: 2px; background: var(--tc-meter-track); }
.ui-um__spark[data-hover] .ui-um__day:not([data-active]) > span { opacity: 0.6; }
.ui-um__day[data-active] > span { background: var(--tc-accent); }
/* Plan limits: thin meters, side by side on wide cards */
.ui-um__limits { display: grid; grid-template-columns: repeat(var(--n, 3), minmax(0, 1fr)); gap: var(--tc-space-3) var(--tc-space-4-5); margin-top: var(--tc-space-4); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-um__limit { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; min-width: 0; }
.ui-um__limit-label { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__limit-label { line-height: var(--tc-line-height-tight); }
.ui-um__limit-value { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; white-space: nowrap; text-overflow: ellipsis; }
.ui-um__limit-value .ui-um__muted { font-weight: var(--tc-font-weight-regular); }
.ui-um__thin { position: relative; display: block; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__thin { margin-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__thin { margin-top: var(--tc-space-1-5); }
.ui-um__thin > span { position: absolute; top: 0; bottom: 0; left: 0; border-radius: inherit; background: var(--tc-meter-fill); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-um__limit[data-state="warn"] .ui-um__thin > span { background: var(--tc-status-warning-solid); }
.ui-um__limit[data-state="limit"] .ui-um__thin > span { background: var(--tc-status-danger-solid); }
/* Unlimited: a quiet striped track instead of a fill */
.ui-um__thin[data-unlimited] { background: repeating-linear-gradient(-45deg, var(--tc-meter-track) 0 3px, transparent 3px 6px); }
/* Standard: the tray below the card · Clean: the last row of the card, under a hairline */
.ui-um__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__foot { padding: var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-3); font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-um__status { display: flex; align-items: center; min-width: 0; overflow: hidden; white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-um-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__status { gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__status { gap: var(--tc-space-1-5); }
.ui-um__status > :last-child { overflow: hidden; text-overflow: ellipsis; }
/* The button: a secondary action, the primary (ink) one near the limit – the same recipe as Button */
.ui-um__action {
  display: inline-flex;
  flex: none;
  justify-content: center;
  height: var(--tc-control-h-md);
  overflow: hidden;
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-action-secondary-fg);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), color var(--tc-duration-moderate) var(--tc-ease-standard), box-shadow var(--tc-duration-moderate) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-move), transform var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-um__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-um__action:active { transform: scale(0.97); }
.ui-um__action[data-strong] { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); animation: ui-um-nudge var(--tc-duration-slowest) var(--tc-ease-spring); }
.ui-um__action[data-strong]:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-um__action[data-strong]:active { background: var(--tc-action-primary-bg-active); }
.ui-um__action-inner { display: inline-flex; align-items: center; flex: none; height: 100%; padding: 0 var(--tc-control-px-md); white-space: nowrap; }
.ui-um__action-text { animation: ui-um-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
@keyframes ui-um-in { from { opacity: 0; transform: translateY(3px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-um-grow { from { grid-template-rows: 0fr; opacity: 0; } to { grid-template-rows: 1fr; opacity: 1; } }
@keyframes ui-um-rise { from { transform: scaleY(0); } to { transform: none; } }
@keyframes ui-um-pop { 0% { transform: scale(0.3); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes ui-um-nudge { 0% { transform: scale(0.94); } 60% { transform: scale(1.04); } 100% { transform: scale(1); } }
/* layout="wide": the full width of the container, and two columns once there's room – the figure, bar and categories
   on the left; the daily bars (bottom-aligned with the bar) and the limits on the right */
[data-ui="um"][data-layout="wide"] { max-width: none; }
@container (min-width: 640px) {
  [data-ui="um"][data-layout="wide"] .ui-um__inner { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--tc-space-10); }
  :where([data-look="standard"], [data-look="standard"] *)[data-ui="um"][data-layout="wide"] .ui-um__inner { padding: var(--tc-space-4) var(--tc-space-5) var(--tc-space-4-5); }
  :where([data-look="clean"], [data-look="clean"] *)[data-ui="um"][data-layout="wide"] .ui-um__inner { padding: var(--tc-space-4) var(--tc-space-5); }
  [data-ui="um"][data-layout="wide"] .ui-um__head { grid-column: 1; grid-row: 1; }
  [data-ui="um"][data-layout="wide"] .ui-um__figure { grid-column: 1; grid-row: 2; }
  [data-ui="um"][data-layout="wide"] .ui-um__bar { grid-column: 1; grid-row: 3; }
  [data-ui="um"][data-layout="wide"] .ui-um__legend { grid-column: 1; grid-row: 4; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--tc-space-6); }
  [data-ui="um"][data-layout="wide"] .ui-um__daily { grid-column: 2; grid-row: 1 / span 3; align-self: end; margin-top: 0; }
  [data-ui="um"][data-layout="wide"] .ui-um__spark { height: 64px; }
  [data-ui="um"][data-layout="wide"] .ui-um__limits { grid-column: 2; grid-row: 4; align-self: start; margin-top: var(--tc-space-2-5); }
}
/* Narrow (phones): the switch gets its own full-width row, limits stack as rows */
@container (max-width: 400px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-um__inner { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-4); }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__inner { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-3-5); }
  .ui-um__head { flex-direction: column; align-items: stretch; gap: var(--tc-space-3); }
  .ui-um__switch { grid-auto-columns: minmax(0, auto); }
  .ui-um__option { padding: 0 var(--tc-space-1-5); }
  :where([data-look="standard"], [data-look="standard"] *).ui-um__big { font-size: var(--tc-font-size-3xl); }
  .ui-um__limits { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-3); }
  .ui-um__limit { grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--tc-space-3); }
  :where([data-look="standard"], [data-look="standard"] *).ui-um__limit-value { font-size: var(--tc-font-size-sm); }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__limit-value { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
  .ui-um__thin { grid-column: 1 / -1; margin-top: var(--tc-space-1-5); }
}
@container (max-width: 300px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-um__of { font-size: var(--tc-font-size-sm); }
  .ui-um__share { width: 34px; }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
  :where([data-look="standard"], [data-look="standard"] *).ui-um__option { height: 34px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__option { height: 32px; }
  .ui-um__item { height: 36px; }
  .ui-um__action { height: var(--tc-control-h-lg); border-radius: var(--tc-control-radius-lg); }
  :where([data-look="standard"], [data-look="standard"] *).ui-um__foot { min-height: 50px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__foot { min-height: 52px; }
  .ui-um__bar { padding: var(--tc-space-2-5) 0; margin-top: var(--tc-space-1); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="um"] *, [data-ui="um"] *::before, [data-ui="um"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-usage-meter")) customElements.define("tc-usage-meter", TcUsageMeter);

declare global {
  interface HTMLElementTagNameMap {
    "tc-usage-meter": TcUsageMeter;
  }
}
