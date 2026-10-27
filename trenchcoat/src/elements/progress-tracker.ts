import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-progress-tracker> – the Lit port of src/components/progress-tracker.tsx: a checklist with a progress bar.
 * Standard puts the header on a gray tray above the white card with the bar and the steps. Clean is one white card
 * with hairline shadows (the header is its first row), quiet gray type, a thin blue bar and blue checks.
 *
 *   <tc-progress-tracker heading="Getting started" .steps=${[{ id: "a", label: "Create your account", done: true }]}>
 *   </tc-progress-tracker>
 *
 * `done` unset: the tracker keeps its own ticks, starting from `defaultDone` (else the steps' `done` flags); when the
 * flags change, the new flags win. `auto-play` ticks the open steps one after another, then starts over – it stops on
 * the first interaction, shows a Pause / Play button (WCAG 2.2.2), waits while off screen and doesn't run when the
 * user asked for reduced motion.
 */

export type ProgressStep = {
  id: string;
  label: string;
  done?: boolean;
  /** Small icon on the right, e.g. the app the step belongs to (cloned) */
  icon?: Element;
};

export type ProgressDoneChange = { done: string[]; steps: ProgressStep[] };

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const isPlayButton = (target: EventTarget | null) => target instanceof Element && !!target.closest(".ui-progress__play");

/* pause / play: Lucide (ISC, lucide.dev) */
const pauseIcon = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<rect x="14" y="4" width="4" height="16" rx="1"></rect><rect x="6" y="4" width="4" height="16" rx="1"></rect>`}</svg>`;
const playIcon = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`}</svg>`;

/**
 * A checklist with a progress bar.
 * @tag tc-progress-tracker
 * @fires tc-done-change - A step was ticked or cleared (by a click or auto play); detail `{ done: string[], steps }` – the ticked ids and every step with its new `done` flag. Cancelable: preventDefault() leaves the ticks as they are (controlled use)
 */
export class TcProgressTracker extends TcElement {
  static override ui = "progress";

  /** The heading, and the progress bar's name */
  @property() accessor heading = "Getting started";
  /** The checklist. Each step's `done` flag is where it starts; when the flags change, the tracker follows them */
  @property({ attribute: false }) accessor steps: ProgressStep[] = [];
  /** Ids of the ticked steps; unset, the tracker keeps its own */
  @property({ attribute: false }) accessor done: string[] | undefined = undefined;
  /** Ids ticked at first when `done` is unset – defaults to the steps marked `done` */
  @property({ attribute: false }) accessor defaultDone: string[] | undefined = undefined;
  /** Ticks the open steps one after another, then starts over */
  @property({ type: Boolean, attribute: "auto-play" }) accessor autoPlay = false;
  /** Pause between two automatic steps, in ms */
  @property({ type: Number }) accessor interval = 2200;

  /** @internal Own ticks, with the steps' flags they were made on */
  @state() accessor own: { base: string; ids: string[] } | undefined = undefined;
  /** @internal Auto play stopped by an interaction */
  @state() accessor interrupted = false;
  /** @internal Reduced motion: no auto play (read after connecting) */
  @state() accessor still = false;

  private screen = new OnScreenController(this);
  private timer = 0;
  private timerKey = "";

  constructor() {
    super();
    const interrupt = (e: Event) => {
      if (!isPlayButton(e.target)) this.interrupted = true;
    };
    this.addEventListener("pointerdown", interrupt);
    this.addEventListener("keydown", interrupt);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.still = reducedMotion();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.timer);
    this.timerKey = "";
  }

  private get flagged() {
    return this.steps.filter((s) => s.done).map((s) => s.id);
  }

  private get doneIds(): string[] {
    if (this.done) return this.done;
    const flagged = this.flagged;
    const key = flagged.join("\u0000");
    if (!this.own) return this.defaultDone ?? flagged;
    return this.own.base === key ? this.own.ids : flagged;
  }

  private get playing() {
    return this.autoPlay && !this.interrupted && !this.still;
  }

  private commit(next: Set<string>) {
    const ids = this.steps.filter((s) => next.has(s.id)).map((s) => s.id);
    const steps = this.steps.map((s) => ({ ...s, done: next.has(s.id) }));
    if (!this.emit<ProgressDoneChange>("tc-done-change", { done: ids, steps }, { cancelable: true })) return;
    if (this.done) this.done = ids;
    else this.own = { base: this.flagged.join("\u0000"), ids };
  }

  private toggle(id: string) {
    const next = new Set(this.doneIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.commit(next);
  }

  /** Tick the next open step; when all are done, start over from the steps' own flags */
  private autoStep = () => {
    this.timerKey = "";
    const done = new Set(this.doneIds);
    const open = this.steps.find((s) => !done.has(s.id));
    if (open) this.toggle(open.id);
    else this.commit(new Set(this.flagged));
    this.requestUpdate();
  };

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // Own ticks start from defaultDone, else the flags, remembered with the flags of the first render
    if (!this.hasUpdated && !this.own) this.own = { base: this.flagged.join("\u0000"), ids: this.defaultDone ?? this.flagged };
    // Auto play starts again when it's switched back on
    if (changed.has("autoPlay") && this.autoPlay) this.interrupted = false;
  }

  protected override updated() {
    const done = new Set(this.doneIds);
    const count = this.steps.filter((s) => done.has(s.id)).length;
    this.toggleAttribute("data-complete", count === this.steps.length);
    // The timer restarts whenever what it depends on changes, like the React effect
    const allDone = count === this.steps.length;
    const run = this.playing && this.screen.onScreen && this.isConnected;
    const key = run ? `${[...done].join("\u0000")}|${allDone}|${this.interval}|${this.steps.length}` : "";
    if (key === this.timerKey) return;
    clearTimeout(this.timer);
    this.timerKey = key;
    if (run) this.timer = window.setTimeout(this.autoStep, allDone ? this.interval * 2 : this.interval);
  }

  protected override render() {
    const done = new Set(this.doneIds);
    const total = this.steps.length;
    const count = this.steps.filter((s) => done.has(s.id)).length;
    const progress = total ? count / total : 0;
    const playing = this.playing;
    // The header (.tc-head): on the tray above the card in Standard, the card's first row in Clean
    const head = cardHead({
      icon: svg`<path d="m3 7 2 2 4-4"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>`,
      title: this.heading,
      aside: html`
        <span class="ui-progress__count" aria-hidden="true">${keyed(count, html`<span class="ui-progress__digit">${count}</span>`)}/${total}</span>
        ${this.autoPlay
          ? html`<button
              type="button"
              class="ui-progress__play"
              aria-label=${playing ? "Pause auto-play" : "Play auto-play"}
              title=${playing ? "Pause" : "Play"}
              @click=${() => {
                if (playing) this.interrupted = true;
                else {
                  this.interrupted = false;
                  this.still = false;
                }
              }}
            >${playing ? pauseIcon : playIcon}</button>`
          : nothing}
      `,
    });
    return html`${head}<div class="ui-progress__body">
      <div
        class="ui-progress__bar"
        role="progressbar"
        aria-label=${this.heading}
        aria-valuemin="0"
        aria-valuemax=${total}
        aria-valuenow=${count}
        aria-valuetext=${`${count} of ${total} done`}
      >
        <span class="ui-progress__fill" style=${styleMap({ transform: `scaleX(${progress})` })}>${keyed(count, html`<span class="ui-progress__shine"></span>`)}</span>
      </div>
      <ul class="ui-progress__list">
        ${this.steps.map((step, index) => {
          const checked = done.has(step.id);
          return html`<li style=${styleMap({ animationDelay: `${180 + index * 90}ms` })}>
            <button type="button" role="checkbox" aria-checked=${checked ? "true" : "false"} class="ui-progress__step" @click=${() => this.toggle(step.id)}>
              <span class="ui-progress__check" aria-hidden="true"><svg viewBox="0 0 24 24">${svg`<path d="M6.5 12.5l3.5 3.5 7.5-8" pathLength="1"></path>`}</svg></span>
              <span class="ui-progress__label"><span>${step.label}</span></span>
              ${step.icon ? html`<span class="ui-progress__icon" aria-hidden="true">${step.icon.cloneNode(true)}</span>` : nothing}
            </button>
          </li>`;
        })}
      </ul>
    </div>`;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="progress"] (see Theming in the docs) */
[data-ui="progress"] {
  box-sizing: border-box;
  width: 100%;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
  animation: ui-progress-in var(--tc-duration-slowest) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="progress"] {
  /* The sweep of light over the dark (light, in the dark theme) bar */
  --tc-progress-tracker-shine: light-dark(rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.7));
  max-width: 360px;
  /* A gray tray: the header on it, the white card below */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="progress"] {
  /* The light band over the blue bar is pure white in the dark theme */
  --tc-progress-tracker-shine: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  container-type: inline-size;
  max-width: 340px;
  /* One white card – the header is its first row */
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
}
[data-ui="progress"] *,
[data-ui="progress"] *::before,
[data-ui="progress"] *::after {
  box-sizing: border-box;
}
:where([data-ui="progress"]) button {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  cursor: pointer;
}
/* The body: the white card on the tray in Standard; in Clean the rows under the header */
:where([data-look="standard"], [data-look="standard"] *).ui-progress__body {
  padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__body { padding: 0 var(--tc-space-1-5) var(--tc-space-1-5); }
/* In the header's aside: a quiet counter and – with autoPlay – Pause / Play */
.ui-progress__count {
  color: var(--tc-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__count { font-size: var(--tc-font-size-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__count { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* The number rolls in from below whenever it changes */
.ui-progress__digit {
  display: inline-block;
  animation: ui-progress-roll var(--tc-duration-slowest) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__digit { color: var(--tc-text-primary); }
/* Pause / Play: a ghost icon button, like Button's */
.ui-progress__play {
  flex: none;
  display: inline-grid;
  place-items: center;
  align-self: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  margin: calc(var(--tc-control-h-sm) / -4) calc(var(--tc-control-h-sm) / -4) calc(var(--tc-control-h-sm) / -4) 0;
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-progress__play:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-progress__play:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-progress__play svg { display: block; }
/* The bar: the meter recipe – ink in Standard (like its checks), the accent in Clean */
.ui-progress__bar {
  position: relative;
  border-radius: var(--tc-meter-radius);
  background: var(--tc-meter-track);
  overflow: hidden;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__bar { height: var(--tc-meter-h-hero); margin: var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__bar { height: var(--tc-meter-h); margin: 0 var(--tc-space-2-5) var(--tc-space-2); }
.ui-progress__fill {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transform-origin: 0 50%;
  overflow: hidden;
  transition: transform calc(2 * var(--tc-duration-slowest)) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__fill { background: var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__fill { background: var(--tc-meter-fill); }
/* A shine runs once each time progress grows – it moves with transform (composited) */
.ui-progress__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 30%, var(--tc-progress-tracker-shine) 50%, transparent 70%);
  transform: translateX(100%);
  animation: ui-progress-shine calc(2 * var(--tc-duration-reveal)) var(--tc-ease-decelerate) both;
}
.ui-progress__list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__list { gap: var(--tc-space-0-5); }
/* On mount the card settles in, then the rows fade up one after another */
.ui-progress__list > li {
  position: relative;
  animation: ui-progress-row-in var(--tc-duration-reveal) var(--tc-ease-move) both;
}
.ui-progress__step {
  display: flex;
  align-items: center;
  width: 100%;
  background: transparent;
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__step {
  gap: var(--tc-space-3);
  padding: var(--tc-space-2) var(--tc-space-1-5);
  border-radius: var(--tc-radius-xl);
  font-size: var(--tc-font-size-lg-plus);
  line-height: var(--tc-line-height-relaxed);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step {
  gap: var(--tc-space-2-5);
  padding: var(--tc-space-1-5) var(--tc-space-2-5);
  border-radius: var(--tc-radius-sm);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate);
}
.ui-progress__step:hover {
  background: var(--tc-fill-hover);
}
/* Rows sit edge to edge: the ring is drawn inside the row so it never overlaps its neighbour */
.ui-progress__step:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: calc(-1 * var(--tc-focus-ring-width));
}
/* Checkbox: the ring fills and pops, then the tick draws itself. The unchecked ring is a control edge (≥ 3:1) */
.ui-progress__check {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: transparent;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__check {
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--tc-border-control);
  transition:
    background-color var(--tc-duration-base) var(--tc-ease-move),
    border-color var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__check {
  width: 16px;
  height: 16px;
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  transition:
    background-color var(--tc-duration-base) var(--tc-ease-move),
    box-shadow var(--tc-duration-base) var(--tc-ease-move);
}
.ui-progress__check svg {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset var(--tc-duration-quick) var(--tc-ease-in);
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__check svg { width: 14px; height: 14px; stroke: var(--tc-text-on-inverse); stroke-width: 2.4; }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__check svg { width: 12px; height: 12px; stroke: var(--tc-text-on-accent); stroke-width: 2.2; }
:where([data-look="standard"], [data-look="standard"] *).ui-progress__step[aria-checked="true"] .ui-progress__check {
  background: var(--tc-surface-inverse);
  border-color: var(--tc-surface-inverse);
  animation: ui-progress-pop var(--tc-duration-slowest) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step[aria-checked="true"] .ui-progress__check {
  background: var(--tc-accent);
  box-shadow: inset 0 0 0 1px transparent;
  animation: ui-progress-pop-clean var(--tc-duration-slowest) var(--tc-ease-move);
}
.ui-progress__step[aria-checked="true"] .ui-progress__check svg {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-fast);
}
/* Label: wraps instead of clipping (nothing is lost at narrow widths), grays out while a line strikes through it */
.ui-progress__label {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
.ui-progress__label > span {
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  transition: background-size var(--tc-duration-slower) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__label > span { background: linear-gradient(currentColor, currentColor) 0 58% / 0% 1.5px no-repeat; }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__label > span { background: linear-gradient(var(--tc-text-disabled), var(--tc-text-disabled)) 0 60% / 0% 1px no-repeat; }
.ui-progress__step[aria-checked="true"] .ui-progress__label {
  color: var(--tc-text-muted);
}
.ui-progress__step[aria-checked="true"] .ui-progress__label > span { transition: background-size var(--tc-duration-slowest) var(--tc-ease-move) var(--tc-duration-base); }
:where([data-look="standard"], [data-look="standard"] *).ui-progress__step[aria-checked="true"] .ui-progress__label > span { background-size: 100% 1.5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step[aria-checked="true"] .ui-progress__label > span { background-size: 100% 1px; }
.ui-progress__icon {
  flex: none;
  display: grid;
  place-items: center;
  transition: opacity var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__icon { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__icon { width: 16px; height: 16px; color: var(--tc-icon-muted); }
.ui-progress__icon > svg {
  width: 100%;
  height: 100%;
}
.ui-progress__step[aria-checked="true"] .ui-progress__icon {
  opacity: 0.45;
}
@keyframes ui-progress-pop {
  0% { transform: scale(0.9); }
  60% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
/* Touch screens: taller rows */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step {
    padding-top: var(--tc-space-2-5);
    padding-bottom: var(--tc-space-2-5);
}
}
/* Narrow cards: a little less inset */
@container (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-progress__bar { margin-left: var(--tc-space-2); margin-right: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step { padding-left: var(--tc-space-2); padding-right: var(--tc-space-2); }
}
@keyframes ui-progress-pop-clean {
  0% { transform: scale(0.9); }
  60% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes ui-progress-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
@keyframes ui-progress-row-in {
  from {
    opacity: 0;
    filter: blur(3px);
    transform: translateY(8px);
  }
}
@keyframes ui-progress-roll {
  from { opacity: 0; transform: translateY(60%); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-progress-shine {
  from { transform: translateX(100%); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="progress"],
  [data-ui="progress"] *,
  [data-ui="progress"] *::before,
  [data-ui="progress"] *::after {
    animation: none !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
}
`;
}

if (!customElements.get("tc-progress-tracker")) customElements.define("tc-progress-tracker", TcProgressTracker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-progress-tracker": TcProgressTracker;
  }
}
