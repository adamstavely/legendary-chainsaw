import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";
import { OffScreenController } from "./internal/controllers";
import { formatElapsed, pixelGrid, pixelMarkCss, type PixelPattern } from "./internal/pixel-mark";

/** "0.2s", "12s", "1m 4s": how long the work has taken, as the pixel mark writes it */
export { formatElapsed } from "./internal/pixel-mark";

/*
 * <tc-thinking-loader> – the Lit port of src/components/thinking-loader.tsx: a small "the model is working" pill.
 * A mark and a label with a light sweeping over it. The label walks through phases (Thinking → Searching the web →
 * …): the old one rolls up and blurs out, the new one rolls in, and the pill glides to its new width. When done, the
 * mark turns into a check and the label settles on "Thought for 6s".
 *   · `mark` picks the mark: "rays" (eight rays fading round, the default) or "pixels" (a 5 × 5 grid of dots lit in a
 *     `pattern` – wave, drive, dots or orbit – that settles into a check, or a cross on error). With pixels the time
 *     since the work started ticks beside the label (0.2s, 12s, 1m 4s) unless `hide-time`
 *   · `label` gives one fixed label instead of `phases`: it stays when the work ends, and the status says how it
 *     ended ("Done: Exporting the register") – the words come from `labels`
 *   · how it stands: `state` – "working", "done" or "error" (preferred; error has no other way to say it). The older
 *     `done` boolean still works and means state="done"
 *   · when it started: `startedAt` (epoch ms; `started` is the same, kept from Pixel Loader); `now` drives the clock from
 *     the page – given, the loader keeps no clock of its own
 *
 *   <tc-thinking-loader .phases=${["Thinking", "Searching the web"]} interval="1400"></tc-thinking-loader>
 *   <tc-thinking-loader mark="pixels" pattern="orbit" label="Reading the audit log"></tc-thinking-loader>
 *
 * The host is the status (role="status", aria-live="polite"): it announces the first phase, then how it ended – not
 * every phase on its way, nor the ticking time (WCAG 4.1.3). Clean is one white chip with hairline shadows and a thin
 * accent mark.
 */

export type ThinkingLoaderPhaseChange = { phase: number };
export type ThinkingLoaderMark = "rays" | "pixels";
export type ThinkingLoaderPattern = PixelPattern;
export type ThinkingLoaderState = "working" | "done" | "error";
/** The words for how it ended, used with a fixed `label` (and "error" with phases too) */
export type ThinkingLoaderLabels = { done: string; error: string };
export const defaultThinkingLoaderLabels: ThinkingLoaderLabels = { done: "Done", error: "Failed" };

/** The class names an element renders – each loader keeps its own prefix */
export type LoaderParts = {
  icon: string;
  spinner: string;
  check: string;
  cross: string;
  grid: string;
  dot: string;
  sr: string;
  text: string;
  label: string;
  labelIn: string;
  labelOut: string;
  shine: string;
  time: string;
};
const PARTS: LoaderParts = {
  icon: "ui-tl__icon",
  spinner: "ui-tl__spinner",
  check: "ui-tl__check",
  cross: "ui-tl__cross",
  grid: "ui-tl__grid",
  dot: "ui-tl__dot",
  sr: "ui-tl__sr",
  text: "ui-tl__text",
  label: "ui-tl__label",
  labelIn: "ui-tl__label--in",
  labelOut: "ui-tl__label--out",
  shine: "ui-tl__shine",
  time: "ui-tl__time",
};

const DEFAULT_PHASES = ["Thinking", "Searching the web", "Reading sources", "Writing response"];
/** `loop` starts over this many times, then holds the last phase */
const MAX_LOOPS = 2;
const RAYS = Array.from({ length: 8 }, (_, i) => svg`<line x1="8" y1="1.75" x2="8" y2="4.75" transform=${`rotate(${i * 45} 8 8)`} style=${`animation-delay: ${(i - 8) * 100}ms`}></line>`);

/**
 * A "the model is working" pill: a mark (rays or a pixel grid) and a label that walks through phases, then a check and a done label – or a cross on error.
 * @tag tc-thinking-loader
 * @fires tc-phase-change - The timer moved to another phase (detail: { phase: number }); cancelable – the phase stays
 * if a listener calls preventDefault()
 */
export class TcThinkingLoader extends TcElement {
  static override ui = "tl";
  /** The class names this element renders */
  protected static parts: LoaderParts = PARTS;
  /** The host is the live region; Pixel Loader puts it on a hidden line instead */
  protected static statusOnHost = true;

  /** Labels to walk through, one after another */
  @property({ attribute: false }) accessor phases: string[] = DEFAULT_PHASES;
  /** One fixed label instead of `phases` – it stays when the work ends, and the status says how it ended */
  @property() accessor label: string | undefined = undefined;
  /** Time per phase, in ms */
  @property({ type: Number }) accessor interval = 2200;
  /** The phase shown. The timer moves it on unless a tc-phase-change listener calls preventDefault() */
  @property({ type: Number }) accessor phase = 0;
  /** The phase is set from outside (e.g. from stream events): no timer */
  @property({ type: Boolean }) accessor manual = false;
  /** When the work started, in epoch ms – the done label and the time count from here. Defaults to when the loader connected (or work restarted) */
  @property({ type: Number }) accessor startedAt: number | undefined = undefined;
  /** The same as `startedAt`, kept from Pixel Loader */
  @property({ type: Number }) accessor started: number | undefined = undefined;
  /** The current time, in epoch ms – given, the loader keeps no clock of its own and counts up to it */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Start over after the last phase instead of holding it – at most twice, then it holds the last phase (WCAG 2.2.2) */
  @property({ type: Boolean }) accessor loop = false;
  /** How the work stands: "working" animates and counts; "done" turns the mark into a check; "error" into a cross */
  @property({ reflect: true }) accessor state: ThinkingLoaderState = "working";
  /** Finished – the same as state="done", kept for existing pages */
  @property({ type: Boolean }) accessor done = false;
  /** Label once done (with `phases`) – a string, or a function that gets the seconds since the loader started */
  @property({ attribute: false }) accessor doneLabel: string | ((seconds: number) => string) = (s) => `Thought for ${s}s`;
  /** Rename the words for how it ended, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<ThinkingLoaderLabels> = {};
  /** The mark: "rays" (the default) or "pixels", a 5 × 5 grid lit in `pattern` */
  @property({ reflect: true }) accessor mark: ThinkingLoaderMark = "rays";
  /** How the pixels move: a diagonal "wave", a lit dot that "drive"s a snake path, a seeded "dots" twinkle, or an "orbit" round the edge */
  @property({ reflect: true }) accessor pattern: ThinkingLoaderPattern = "wave";
  /** Hides the time since the work started (shown with mark="pixels") */
  @property({ type: Boolean, attribute: "hide-time" }) accessor hideTime = false;
  /** "md" is the default pill; "sm" is smaller, e.g. inside a chat bubble */
  @property({ reflect: true }) accessor size: "sm" | "md" = "md";
  /** "pill" = bordered capsule, "plain" = just the mark and the label, e.g. inside a chat bubble */
  @property({ reflect: true }) accessor variant: "pill" | "plain" = "pill";

  /** @internal Seconds counted when the work ended */
  @state() accessor seconds: number | null = null;
  /** @internal The label on screen */
  @state() accessor shown = { key: 0, text: "" };
  /** @internal The label rolling out */
  @state() accessor leaving: { key: number; text: string } | null = null;

  /** When this loader started counting, if no start is given */
  private since = 0;
  /** When the work ended, frozen for done and error */
  private ended: number | null = null;
  private lastStatus: ThinkingLoaderState | null = null;
  private timer = 0;
  private timerKey = "";
  private ticker = 0;
  private measuredKey = -1;
  private ro?: ResizeObserver;

  constructor() {
    super();
    // The mark and the sweep pause while the loader is scrolled away
    new OffScreenController(this, () => this.isConnected && this.status === "working");
  }

  private get parts() {
    return (this.constructor as typeof TcThinkingLoader).parts;
  }

  /** The mark drawn – Pixel Loader always draws pixels */
  protected get markShown(): ThinkingLoaderMark {
    return this.mark;
  }

  /** How the work stands, from `state` or the older `done` */
  get status(): ThinkingLoaderState {
    return this.state !== "working" ? this.state : this.done ? "done" : "working";
  }

  /** The loader's one clock read */
  private clock() {
    return this.now ?? Date.now();
  }

  private get origin() {
    return this.startedAt ?? this.started ?? this.since;
  }

  private get elapsed() {
    const end = this.status === "working" ? this.clock() : (this.ended ?? this.clock());
    return end - this.origin;
  }

  private get showsTime() {
    return this.markShown === "pixels" && !this.hideTime;
  }

  override connectedCallback() {
    super.connectedCallback();
    if ((this.constructor as typeof TcThinkingLoader).statusOnHost) {
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
    }
    this.since = this.clock();
    if (this.status !== "working") this.ended = this.since;
    this.syncTimer();
    this.syncTicker();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    this.timer = 0;
    this.timerKey = "";
    window.clearInterval(this.ticker);
    this.ticker = 0;
    this.ro?.disconnect();
    this.ro = undefined;
    this.measuredKey = -1;
  }

  private word(key: keyof ThinkingLoaderLabels) {
    return this.labels[key] ?? defaultThinkingLoaderLabels[key];
  }

  /** The labels to walk through: the fixed one, or the phases */
  private get steps() {
    return this.label !== undefined ? [this.label] : this.phases;
  }

  private get index() {
    return Math.min(Math.max(this.phase, 0), Math.max(this.steps.length - 1, 0));
  }

  /** Until the seconds are counted (the same update the work ends) the phase label stays */
  private get finished() {
    return this.status !== "working" && this.seconds !== null;
  }

  private get text() {
    if (this.finished && this.label === undefined) {
      if (this.status === "error") return this.word("error");
      return typeof this.doneLabel === "function" ? this.doneLabel(this.seconds!) : this.doneLabel;
    }
    return this.steps[this.index] ?? "";
  }

  /** What the status says: the first label while working, then how it ended */
  private get spoken() {
    if (!this.finished) return this.steps[0] ?? "";
    if (this.label !== undefined) return `${this.word(this.status as "done" | "error")}: ${this.label}`;
    return this.text;
  }

  private setPhase(next: number) {
    if (next === this.phase) return;
    if (this.emit<ThinkingLoaderPhaseChange>("tc-phase-change", { phase: next }, { cancelable: true })) this.phase = next;
  }

  /** Advance through the phases on a timer – unless the phase is set from outside */
  private syncTimer() {
    const on = this.isConnected && this.status === "working" && !this.manual && this.steps.length >= 2;
    const key = on ? `${this.steps.length}|${this.interval}|${this.loop}` : "";
    if (key === this.timerKey) return;
    window.clearInterval(this.timer);
    this.timer = 0;
    this.timerKey = key;
    if (!on) return;
    let rounds = 0;
    this.timer = window.setInterval(() => {
      const s = this.phase;
      if (s + 1 < this.steps.length) this.setPhase(s + 1);
      else if (this.loop && rounds < MAX_LOOPS) {
        rounds++;
        this.setPhase(0);
      }
    }, this.interval);
  }

  /** Writes the time into its text directly – the tick changes nothing else, so it needn't re-render */
  private paintTime = () => {
    const t = this.querySelector<HTMLElement>(`.${this.parts.time}`);
    if (t) t.textContent = formatElapsed(this.elapsed);
  };

  /** The time ticks while working on the loader's own clock; a page that passes `now` drives it */
  private syncTicker() {
    const on = this.isConnected && this.status === "working" && this.now === undefined && this.showsTime;
    if (on === !!this.ticker) return;
    window.clearInterval(this.ticker);
    this.ticker = on ? window.setInterval(this.paintTime, 100) : 0;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const status = this.status;
    this.dataset.size = this.size;
    this.dataset.variant = this.variant;
    this.dataset.status = status;
    this.toggleAttribute("data-done", status === "done");
    // The clock is read when the work starts or ends, never while rendering: the start is noted when work (re)starts,
    // and the seconds are counted in the update that shows how it ended
    if (this.lastStatus !== null && status !== this.lastStatus) {
      if (status === "working") {
        this.since = this.clock();
        this.ended = null;
        this.seconds = null;
        if (!this.manual) this.setPhase(0);
      } else if (this.lastStatus === "working") this.ended = this.clock();
    }
    this.lastStatus = status;
    if (status !== "working" && this.seconds === null) this.seconds = Math.max(1, Math.round(((this.ended ?? this.clock()) - this.origin) / 1000));
    // The label on screen and the one rolling out swap in the same update, so both animate in the same frame
    const text = this.text;
    if (!this.hasUpdated) this.shown = { key: 0, text };
    else if (text !== this.shown.text) {
      this.leaving = this.shown;
      this.shown = { key: this.shown.key + 1, text };
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this.syncTimer();
    this.syncTicker();
    this.paintTime();
    // An update that lands after removal starts nothing
    if (!this.isConnected) return;
    if (this.measuredKey === this.shown.key) return;
    // The text box takes the width of the incoming label, so the pill glides to its new size
    const P = this.parts;
    const b = this.querySelector<HTMLElement>(`.${P.text}`);
    const c = this.querySelector<HTMLElement>(`.${P.label}:not(.${P.labelOut})`);
    if (!b || !c) return;
    const first = this.measuredKey < 0;
    if (first) b.style.transition = "none";
    // offsetWidth is in layout pixels, so it stays right inside a CSS zoom or transform (+1 covers rounding)
    b.style.width = `${c.offsetWidth + 1}px`;
    if (first) {
      b.getBoundingClientRect();
      b.style.transition = "";
    }
    this.measuredKey = this.shown.key;
    // The label can also grow without changing – a user's text spacing or font size (WCAG 1.4.12): follow it
    this.ro?.disconnect();
    if (typeof ResizeObserver === "undefined") return;
    this.ro = new ResizeObserver(() => (b.style.width = `${c.offsetWidth + 1}px`));
    this.ro.observe(c);
  }

  private onOutEnd = () => {
    this.leaving = null;
  };

  protected override render() {
    const { shown, leaving } = this;
    const P = this.parts;
    const status = this.status;
    const host = (this.constructor as typeof TcThinkingLoader).statusOnHost;
    return html`
      ${this.markShown === "pixels"
        ? pixelGrid(P, this.pattern, status === "working" ? null : status)
        : html`<span class=${P.icon} aria-hidden="true">
            <svg class=${P.spinner} viewBox="0 0 16 16">${RAYS}</svg>
            <svg class=${P.check} viewBox="0 0 16 16">${svg`<path d="M3.5 8.4 6.6 11.3 12.5 4.9" pathLength="1"></path>`}</svg>
            <svg class=${P.cross} viewBox="0 0 16 16">${svg`<path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" pathLength="1"></path>`}</svg>
          </span>`}
      <span class=${P.sr} role=${ifDefined(host ? undefined : "status")}>${this.spoken}</span>
      <span class=${P.text} aria-hidden="true">
        ${leaving ? keyed(leaving.key, html`<span class=${`${P.label} ${P.labelOut}`} aria-hidden="true" @animationend=${this.onOutEnd}>${leaving.text}</span>`) : nothing}
        ${keyed(shown.key, html`<span class=${shown.key > 0 ? `${P.label} ${P.labelIn}` : P.label}>${shown.text}</span>`)}
        ${status === "working" ? keyed(`shine-${shown.key}`, html`<span class=${P.shine}><span>${shown.text}</span></span>`) : nothing}
      </span>
      ${this.showsTime ? html`<span class=${P.time} aria-hidden="true"></span>` : nothing}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tl"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-thinking-loader-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.95));
  --tc-thinking-loader-h: 34px;
  --tc-thinking-loader-font: var(--tc-font-size-lg);
  --tc-thinking-loader-lh: var(--tc-line-height-snug);
  --tc-thinking-loader-icon: 15px;
  --tc-thinking-loader-pixel-ink: var(--tc-text-primary);
  --tc-thinking-loader-pixel-dot: 2px;
  --tc-thinking-loader-pixel-gap: 1.25px;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  box-sizing: border-box;
  height: var(--tc-thinking-loader-h);
  padding: 0 var(--tc-space-4) 0 var(--tc-space-3);
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 1px var(--tc-border-default), var(--tc-shadow-control);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-thinking-loader-font);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-none);
  letter-spacing: var(--tc-tracking-normal);
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tl"][data-size="sm"] {
  --tc-thinking-loader-h: 28px;
  --tc-thinking-loader-font: var(--tc-font-size-md);
  --tc-thinking-loader-lh: var(--tc-line-height-tight);
  --tc-thinking-loader-icon: 13px;
  gap: var(--tc-space-2);
  padding: 0 var(--tc-space-3) 0 var(--tc-space-2-5);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tl"][data-variant="plain"] {
  padding: 0;
  background: none;
  box-shadow: none;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tl"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-thinking-loader-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  --tc-thinking-loader-h: 32px;
  --tc-thinking-loader-font: var(--tc-font-size-md);
  --tc-thinking-loader-lh: var(--tc-line-height-normal);
  --tc-thinking-loader-icon: 16px;
  --tc-thinking-loader-pixel-ink: var(--tc-accent);
  --tc-thinking-loader-pixel-dot: 2px;
  --tc-thinking-loader-pixel-gap: 1.5px;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  box-sizing: border-box;
  height: var(--tc-thinking-loader-h);
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  color: var(--tc-text-secondary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-thinking-loader-font);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-thinking-loader-lh);
  letter-spacing: var(--tc-tracking-normal);
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tl"][data-size="sm"] {
  --tc-thinking-loader-h: 26px;
  --tc-thinking-loader-font: var(--tc-font-size-sm);
  --tc-thinking-loader-lh: var(--tc-line-height-tight);
  --tc-thinking-loader-icon: 14px;
  gap: var(--tc-space-1);
  padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tl"][data-variant="plain"] {
  height: auto;
  padding: 0;
  background: none;
  box-shadow: none;
}
/* Spinner and check share one square and swap with a little scale */
.ui-tl__icon {
  position: relative;
  flex: none;
  width: var(--tc-thinking-loader-icon);
  height: var(--tc-thinking-loader-icon);
}
.ui-tl__icon svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-slower) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tl__spinner line {
  stroke: var(--tc-text-primary);
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0.18;
  animation: ui-tl-ray var(--tc-duration-reveal) linear infinite;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tl__check {
  opacity: 0;
  transform: scale(0.6);
  fill: none;
  stroke: var(--tc-text-primary);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Thin rays in the accent blue – they fade one after another, so the spinner turns without rotating */
:where([data-look="clean"], [data-look="clean"] *).ui-tl__spinner line {
  stroke: var(--tc-accent);
  stroke-width: 1.1;
  stroke-linecap: round;
  opacity: 0.2;
  animation: ui-tl-ray-clean var(--tc-duration-reveal) linear infinite;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tl__check {
  opacity: 0;
  transform: scale(0.6);
  fill: none;
  stroke: var(--tc-accent);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* The cross for an error: the check's shape and motion, in the danger colour */
.ui-tl__cross {
  opacity: 0;
  transform: scale(0.6);
  fill: none;
  stroke: var(--tc-status-danger-solid);
  stroke-width: 1.6;
  stroke-linecap: round;
}
.ui-tl__check path, .ui-tl__cross path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
[data-ui="tl"]:not([data-status="working"]) .ui-tl__spinner {
  opacity: 0;
  transform: scale(0.6) rotate(-45deg);
}
[data-ui="tl"][data-done] .ui-tl__check, [data-ui="tl"][data-status="error"] .ui-tl__cross {
  opacity: 1;
  transform: none;
}
[data-ui="tl"][data-done] .ui-tl__check path, [data-ui="tl"][data-status="error"] .ui-tl__cross path {
  animation: ui-tl-draw var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-quick) forwards;
}
/* The text box glides to the width of the incoming label; labels roll through it */
/* The text box glides to the width of the incoming label; labels roll through it */
.ui-tl__text {
  position: relative;
  display: block;
  line-height: var(--tc-thinking-loader-lh);
  height: var(--tc-thinking-loader-lh);
  height: 1lh;
  overflow: hidden;
  transition: width var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-tl__label {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
}
[data-ui="tl"]:not([data-status="working"]) .ui-tl__label {
  color: var(--tc-text-primary);
}
/* With mark="pixels": the grid in the mark's place, and the time since the work started */
.ui-tl__grid { margin: 0 var(--tc-space-0-5); }
.ui-tl__time {
  flex: none;
  color: var(--tc-text-muted);
  font-variant-numeric: tabular-nums;
  font-weight: var(--tc-font-weight-regular);
}
.ui-tl__label--in {
  animation: ui-tl-in var(--tc-duration-slower) var(--tc-ease-move) both;
}
.ui-tl__label--out {
  animation: ui-tl-out var(--tc-duration-slow) var(--tc-ease-move) both;
}
/* A soft light sweeping over the label while it works */
/* A soft light sweeps over the label while it works – a few times, then it rests (WCAG 2.2.2). The window slides one
   way and the copy of the label inside it the other way, so only transform animates; paused off-screen */
.ui-tl__shine {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  animation: ui-tl-sweep var(--tc-duration-shimmer) linear var(--tc-duration-slower) 3 both;
}
.ui-tl__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-thinking-loader-shimmer);
  animation: ui-tl-sweep-text var(--tc-duration-shimmer) linear var(--tc-duration-slower) 3 both;
}
[data-ui="tl"]:not([data-status="working"]) .ui-tl__shine { display: none; }
[data-ui="tl"][data-offscreen] :is(.ui-tl__shine, .ui-tl__shine > span, .ui-tl__spinner line) { animation-play-state: paused; }
.ui-tl__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-tl-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
@keyframes ui-tl-sweep-text {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}
@keyframes ui-tl-ray {
  0% { opacity: 1; }
  100% { opacity: 0.18; }
}
/* A darker band sweeping through the gray label while it works */
@keyframes ui-tl-ray-clean {
  0% { opacity: 1; }
  100% { opacity: 0.2; }
}
@keyframes ui-tl-in {
  from { opacity: 0; transform: translateY(70%); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-tl-out {
  from { opacity: 1; transform: none; filter: none; }
  to { opacity: 0; transform: translateY(-70%); filter: blur(3px); }
}
@keyframes ui-tl-draw {
  to { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tl"] *,
  [data-ui="tl"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
  .ui-tl__spinner line { opacity: 0.6; }
  .ui-tl__shine { display: none; }
  .ui-tl__check path, .ui-tl__cross path { stroke-dashoffset: 0; }
}
` + pixelMarkCss("tl", PARTS);
}

if (!customElements.get("tc-thinking-loader")) customElements.define("tc-thinking-loader", TcThinkingLoader);

declare global {
  interface HTMLElementTagNameMap {
    "tc-thinking-loader": TcThinkingLoader;
  }
}
