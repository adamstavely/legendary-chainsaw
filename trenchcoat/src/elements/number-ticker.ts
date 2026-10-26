import { html, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";

/*
 * <tc-number-ticker> – the Lit port of motion/number-ticker.tsx: animated numbers like an odometer. Every digit is a
 * small vertical column that rolls to its new value: up when the number grows, down when it shrinks. On first view it
 * counts in from zero. Formatting comes from Intl.NumberFormat, so currency signs, separators and percent signs stay
 * put while only the digits move.
 *
 *   <tc-number-ticker value="48240" locale="en-US"></tc-number-ticker>
 *
 * The roll writes transforms straight to the DOM: the element renders once per new value, never per frame. Off
 * screen or in a hidden tab a roll jumps to its end; reduced motion (read at every roll) jumps too. Screen readers
 * read the formatted number; each new value is announced once (a polite live region on the host – set
 * aria-live="off" for numbers that change on their own every few seconds).
 */

type TickerPart = { key: string; digit: number } | { key: string; char: string };

/** "$48,240" → parts keyed from the right, so the ones column keeps its identity when the number grows */
function split(text: string): TickerPart[] {
  const chars = Array.from(text);
  const parts: TickerPart[] = [];
  let d = 0;
  let s = 0;
  for (let i = chars.length - 1; i >= 0; i--) {
    const c = chars[i];
    if (c >= "0" && c <= "9") parts.unshift({ key: `d${d++}`, digit: c.charCodeAt(0) - 48 });
    else parts.unshift({ key: `s${s++}`, char: c });
  }
  return parts;
}

const mod10 = (n: number) => ((n % 10) + 10) % 10;
const ease = (t: number) => 1 - Math.pow(1 - t, 4);
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
/** Position → transform; the stack holds 0–9 plus a trailing 0, so 9 → 0 rolls seamlessly */
const place = (col: HTMLElement, pos: number) => {
  const stack = col.firstElementChild as HTMLElement | null;
  if (stack) stack.style.transform = `translateY(${(-mod10(pos) / 11) * 100}%)`;
};
const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

type Roll = { pos: number; from: number; to: number };

/**
 * A number whose digits roll like an odometer when it changes.
 * @tag tc-number-ticker
 */
export class TcNumberTicker extends TcElement {
  static override ui = "nt";
  static override looks = false;

  /** The number to show */
  @property({ type: Number }) accessor value = 0;
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" } */
  @property({ attribute: false }) accessor format: Intl.NumberFormatOptions | undefined = undefined;
  /** Locale for formatting, e.g. "en-US" – defaults to the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Length of a roll in ms */
  @property({ type: Number }) accessor duration = 900;
  /** Wait before the first count-in, in ms */
  @property({ type: Number }) accessor delay = 0;

  private text = "";
  private parts: TickerPart[] = [];
  private fmtKey = "";
  private rolls = new Map<string, Roll>();
  private frame = 0;
  private prev = 0;
  private up = true;
  private started = false;
  private visible = true;
  private inView = false;
  private timer = 0;
  private io?: IntersectionObserver;
  private seen: Set<string> | null = null;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
    document.addEventListener("visibilitychange", this.sync);
    // Start once the number scrolls into view; afterwards, rolls off screen or in a hidden tab jump to their end
    if (typeof IntersectionObserver === "undefined") {
      this.visible = true;
      this.begin();
      return;
    }
    this.io = new IntersectionObserver(
      ([e]) => {
        this.inView = e.isIntersecting;
        this.sync();
        if (this.inView && !this.started && !this.timer) this.timer = window.setTimeout(() => this.begin(), this.delay);
      },
      { threshold: 0.3 },
    );
    this.io.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
    this.io = undefined;
    document.removeEventListener("visibilitychange", this.sync);
    clearTimeout(this.timer);
    this.timer = 0;
    this.finish();
  }

  private sync = () => {
    if (!this.io) return;
    this.visible = this.inView && document.visibilityState !== "hidden";
    if (!this.visible) this.finish();
  };

  private begin() {
    this.started = true;
    if (this.hasUpdated) this.roll();
  }

  private cols() {
    const map = new Map<string, HTMLElement>();
    this.querySelectorAll<HTMLElement>(".ui-nt__col").forEach((c) => map.set(c.dataset.col!, c));
    return map;
  }

  private apply() {
    const cols = this.cols();
    for (const [k, r] of this.rolls) {
      const el = cols.get(k);
      if (el) place(el, r.pos);
    }
  }

  /** Jump the running roll to its end */
  private finish() {
    if (!this.frame) return;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    for (const r of this.rolls.values()) r.pos = r.from = r.to;
    this.apply();
  }

  /** Rolls every digit column to the current value */
  private roll() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    const { parts, value, duration } = this;
    // Same value again (e.g. a format change) keeps the last direction
    if (value !== this.prev) this.up = value > this.prev;
    this.prev = value;
    const instant = reducedMotion() || !this.visible || duration <= 0;
    const keys = new Set<string>();
    for (const p of parts) {
      if (!("digit" in p)) continue;
      keys.add(p.key);
      const r = this.rolls.get(p.key) ?? { pos: 0, from: 0, to: 0 };
      const delta = this.up ? mod10(p.digit - r.pos) : -mod10(r.pos - p.digit);
      r.from = r.pos;
      r.to = r.pos + delta;
      if (instant) r.pos = r.from = r.to;
      this.rolls.set(p.key, r);
    }
    for (const k of this.rolls.keys()) if (!keys.has(k)) this.rolls.delete(k);
    if (instant) return this.apply();

    // The clock starts on the first frame, from the frame's own timestamp
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / duration);
      const e = ease(t);
      for (const r of this.rolls.values()) r.pos = r.from + (r.to - r.from) * e;
      this.apply();
      this.frame = t < 1 ? requestAnimationFrame(tick) : 0;
    };
    this.frame = requestAnimationFrame(tick);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // Options compared by content, so a fresh object with the same options doesn't re-format
    const fmtKey = JSON.stringify(this.format ?? {});
    if (changed.has("value") || changed.has("locale") || fmtKey !== this.fmtKey || !this.text) {
      this.fmtKey = fmtKey;
      this.text = new Intl.NumberFormat(this.locale, this.format).format(this.value);
      this.parts = split(this.text);
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    const cols = this.cols();
    // Columns that show up after the first render slide in (e.g. 9,999 → 10,000)
    const keys = new Set(cols.keys());
    if (this.seen) for (const k of keys) if (!this.seen.has(k)) cols.get(k)!.setAttribute("data-enter", "");
    this.seen = keys;
    // New columns start where their roll is (0 before the count-in)
    for (const [k, c] of cols) if (!c.firstElementChild!.getAttribute("style")) place(c, this.rolls.get(k)?.pos ?? 0);
    if (this.started && (changed.has("value") || changed.has("locale") || changed.has("format") || changed.has("duration"))) this.roll();
  }

  protected override render() {
    return html`<span class="ui-nt__sr">${this.text}</span><span class="ui-nt__track" aria-hidden="true">${repeat(
      this.parts,
      (p) => p.key,
      (p) =>
        "digit" in p
          ? html`<span class="ui-nt__col" data-col=${p.key}><span class="ui-nt__stack">${CELLS.map((n) => html`<span class="ui-nt__cell">${n}</span>`)}</span></span>`
          : html`<span class="ui-nt__static">${p.char}</span>`,
    )}</span>`;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="nt"] {
  --tc-number-ticker-lh: 1.15em;
  position: relative;
  display: inline-flex;
  line-height: var(--tc-number-ticker-lh);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ui-nt__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.ui-nt__track {
  display: inline-flex;
  align-items: flex-start;
  height: var(--tc-number-ticker-lh);
  line-height: var(--tc-number-ticker-lh);
}
.ui-nt__col {
  display: inline-block;
  height: var(--tc-number-ticker-lh);
  overflow: hidden;
  /* Soft top and bottom edges while digits pass through */
  -webkit-mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
}
.ui-nt__col[data-enter] { animation: ui-nt-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-nt__stack {
  display: flex;
  flex-direction: column;
  will-change: transform;
}
.ui-nt__cell,
.ui-nt__static {
  display: block;
  height: var(--tc-number-ticker-lh);
  text-align: center;
}
.ui-nt__static { white-space: pre; }

@keyframes ui-nt-in {
  from { opacity: 0; transform: translateY(-35%); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-nt__col[data-enter] { animation: none; }
}

`;
}

if (!customElements.get("tc-number-ticker")) customElements.define("tc-number-ticker", TcNumberTicker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-number-ticker": TcNumberTicker;
  }
}
