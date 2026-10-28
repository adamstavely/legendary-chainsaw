import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";
import { ifDefined } from "lit/directives/if-defined.js";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-thinking-state> – the Lit port of src/components/thinking-state.tsx: the "working…" panel of an AI chat. A
 * header with a live timer, then searches with their sources and the thinking steps appear one after another; at
 * the end a check, and the header turns into "Worked for …". Clean is one white card with hairline shadows: a 3×3
 * pixel mark that twinkles while it thinks, and only the steps fold away.
 *
 *   <tc-thinking-state .steps=${[{ kind: "step", label: "Reading the brief" }]} done-label="Ready"></tc-thinking-state>
 *
 * Unset, `progress` and `done` follow the element's own timeline (a step every `step-ms`); set, they come from the
 * page (e.g. stream events). The timer is painted into the header's text – the element doesn't re-render per tick.
 */

export type ThinkingSource = {
  label: string;
  /** A favicon element (cloned) */
  icon?: Element;
  /** Opens in a new tab */
  href?: string;
  /** Tooltip on hover – defaults to the link */
  tooltip?: string;
};

export type ThinkingStep =
  | {
      kind: "search";
      label: string;
      activeLabel?: string;
      sources: ThinkingSource[];
      /** Hidden behind a "+N more" chip until it is clicked */
      moreSources?: ThinkingSource[];
    }
  | { kind: "step"; label: string };

/** How many times `loop` starts over before it stays finished */
const MAX_RUNS = 3;
/** Standard reveals the first step after this pause; Clean shows it from the start */
const START_MS = 700;
const CHIP_MS = 160;
/** Twinkle order of Clean's 3×3 pixel mark – a diagonal wave */
const PIXEL_DELAYS = [0, 120, 240, 120, 240, 360, 240, 360, 480];

/** What identifies a step for the timeline: its kind, label and how many sources pop in */
const stepKey = (s: ThinkingStep) => (s.kind === "search" ? `search\u0001${s.label}\u0001${s.sources.length}` : `step\u0001${s.label}`);
/** 9s, 1m 05s */
const format = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);
let uidSeq = 0;

const globe = html`<svg viewBox="0 0 24 24" class="ui-think__globe">${svg`<path d="M22 12A10 10 0 1 0 12 22"></path><path d="M20 5.7c-.93.07-2.13.43-2.96 1.5-1.5 1.94-3 2.1-4 1.46-1.5-.97-.24-2.54-2-3.4-1.15-.56-1.31-2.07-.67-3.26"></path><path d="M2 11c.76.66 1.83 1.27 3.09 1.27 2.6 0 3.12.5 3.12 2.48s0 1.99.52 3.48c.34.97.46 1.94-.22 2.77"></path><path d="m19.9 19.93 2.1 2.07m-.89-4.95a4.05 4.05 0 1 1-8.11 0 4.05 4.05 0 0 1 8.11 0Z"></path>`}</svg>`;
const checkClean = html`<svg viewBox="0 0 16 16" class="ui-think__check">${svg`<circle cx="8" cy="8" r="6.5"></circle><path d="M5.4 8.3l1.75 1.75L10.7 6.4"></path>`}</svg>`;
const checkStandard = html`<svg viewBox="0 0 24 24" class="ui-think__check">${svg`<circle cx="12" cy="12" r="10"></circle><path d="M8 12.5l2.5 2.5L16 9"></path>`}</svg>`;
const chevronStandard = html`<svg viewBox="0 0 24 24">${svg`<path d="M18 9s-4.419 6-6 6c-1.581 0-6-6-6-6"></path>`}</svg>`;
const chevronClean = html`<svg viewBox="0 0 16 16">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;

/**
 * The "working…" panel of an AI chat: steps and searches appear one by one, then "Worked for …".
 * @tag tc-thinking-state
 * @fires tc-progress-change - The timeline revealed a step; detail `{ progress: number }`, how many steps show
 * @fires tc-done - It finished (by the timeline or by `done`); detail `{ seconds: number }`, how long it worked
 * @fires tc-open-change - The header was clicked, or a new run unfolded the steps; detail `{ open: boolean }`. Cancelable: preventDefault() keeps `open` as it is (controlled use)
 */
export class TcThinkingState extends TcElement {
  static override ui = "think";

  /** The steps and searches to show, in order – `progress` (or the timeline) decides how many have appeared */
  @property({ attribute: false }) accessor steps: ThinkingStep[] = [];
  /** Label of the final row */
  @property({ attribute: "done-label" }) accessor doneLabel = "Finished thinking";
  /** Pause between two steps, in ms (the timeline that runs when `progress` and `done` are unset) */
  @property({ type: Number, attribute: "step-ms" }) accessor stepMs = 1300;
  /** How many steps have appeared; unset, the timeline reveals them */
  @property({ type: Number }) accessor progress: number | undefined = undefined;
  /** Finished; unset, the timeline decides (when `progress` is unset too) */
  @property({ attribute: false }) accessor done: boolean | undefined = undefined;
  /** Start over after a pause once finished – only while the timeline runs everything. Stops after a few runs, and
   *  as soon as the pointer or focus is inside (WCAG 2.2.2) */
  @property({ type: Boolean }) accessor loop = false;
  /** Whether the steps are unfolded */
  @property({ type: Boolean }) accessor open = true;
  /** When the work started, in epoch ms – the header's timer counts from here. Defaults to when the run started */
  @property({ type: Number, attribute: "started-at" }) accessor startedAt: number | undefined = undefined;

  /** @internal */
  @state() accessor run = 0;
  /** @internal What the timeline has revealed */
  @state() accessor timedShown = 0;
  /** @internal Whether the timeline has finished */
  @state() accessor timedDone = false;
  /** @internal The seconds it worked, once done */
  @state() accessor seconds = 0;
  /** @internal Searches whose "+N more" is open */
  @state() accessor expanded = new Set<number>();

  private uid = `tc-think-${++uidSeq}`;
  private screen = new OnScreenController(this);
  private started = 0;
  /** Once someone points or focuses inside, a looping preview stays put */
  private touched = false;
  private tl = { run: -1, signature: "", stepMs: 0, shown: 0, done: false };
  private effectKey = "";
  private timers: number[] = [];
  private reported = false;
  private pendingDone: number | null = null;
  private ticker = 0;
  private hotChip: HTMLElement | null = null;

  constructor() {
    super();
    const touch = () => (this.touched = true);
    this.addEventListener("pointerenter", touch);
    this.addEventListener("focusin", touch);
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.onDocKey);
    if (this.hasUpdated) this.requestUpdate();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.onDocKey);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.effectKey = "";
    clearInterval(this.ticker);
    this.ticker = 0;
  }

  private get clean() {
    return this.resolvedLook === "clean";
  }
  private get stepsControlled() {
    return this.progress !== undefined;
  }
  private get timed() {
    return this.progress === undefined && this.done === undefined;
  }
  private get shown() {
    return Math.max(0, Math.min(this.steps.length, this.progress ?? this.timedShown));
  }
  private get isDone() {
    return this.done ?? (this.stepsControlled ? false : this.timedDone);
  }
  private startOf(now: number) {
    return this.startedAt ?? (this.started || now);
  }

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  /* ---------- The timeline ---------- */

  /** Reveal the steps one by one; a search waits until all of its sources have popped in. It keys on the steps'
   *  content, so steps appended while it runs (or after it finished) continue it */
  private timeline() {
    const steps = this.steps;
    const signature = steps.map(stepKey).join("\u0000");
    const { run, stepMs, loop, clean, stepsControlled, timed } = this;
    const key = JSON.stringify([run, signature, stepMs, loop, clean, stepsControlled, timed]);
    if (key === this.effectKey) return;
    this.effectKey = key;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    const firstShown = clean ? Math.min(1, steps.length) : 0;
    const tl = this.tl;
    const now = Date.now();
    const first = tl.run === -1;
    const continues = tl.run === run && tl.stepMs === stepMs && (signature === tl.signature || signature.startsWith(tl.signature + "\u0000"));
    if (!continues) {
      this.started = now;
      tl.shown = firstShown;
      tl.done = false;
      this.timedShown = firstShown;
      this.timedDone = false;
      this.seconds = 0;
      if (!first) this.setOpen(true);
      this.expanded = new Set();
    } else if (tl.done && steps.length > tl.shown) {
      tl.done = false;
      this.timedDone = false;
    }
    Object.assign(tl, { run, signature, stepMs });
    // When each step appears on this run's clock, and finally when it's done
    const at: number[] = [];
    let t = clean ? 0 : START_MS;
    for (const step of steps) {
      at.push(t);
      t += stepMs + (step.kind === "search" ? (step.sources.length + 1) * CHIP_MS : 0);
    }
    at.push(t);
    const elapsed = now - this.started;
    // Steps appended after the end show from now rather than all at once
    const shift = Math.max(0, elapsed - at[Math.min(tl.shown, steps.length)]);
    for (let i = tl.shown; !stepsControlled && i < steps.length; i++) {
      this.timers.push(
        window.setTimeout(() => {
          tl.shown = i + 1;
          this.timedShown = i + 1;
          this.emit("tc-progress-change", { progress: i + 1 });
        }, at[i] + shift - elapsed),
      );
    }
    if (!tl.done && timed) {
      this.timers.push(
        window.setTimeout(() => {
          tl.done = true;
          this.timedDone = true;
        }, at[steps.length] + shift - elapsed),
      );
    }
    if (loop && timed && run < MAX_RUNS - 1) {
      this.timers.push(window.setTimeout(() => !this.touched && this.run++, at[steps.length] + shift + 4000 - elapsed));
    }
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.isConnected) this.timeline();
    // Finished: count the seconds before the browser paints (reported after the update)
    const done = this.isDone;
    if (!done) this.reported = false;
    else if (!this.reported) {
      this.reported = true;
      const now = Date.now();
      this.seconds = Math.max(1, Math.round((now - this.startOf(now)) / 1000));
      this.pendingDone = this.seconds;
    }
    this.toggleAttribute("data-done", done);
  }

  protected override updated() {
    if (this.pendingDone !== null) {
      const seconds = this.pendingDone;
      this.pendingDone = null;
      this.emit("tc-done", { seconds });
    }
    // The live timer while thinking: painted into the header's text, paused off screen and in hidden tabs
    const live = !this.isDone && this.isConnected;
    if (live) {
      this.paintTime();
      if (!this.ticker) this.ticker = window.setInterval(() => this.screen.onScreen && document.visibilityState !== "hidden" && this.paintTime(), 250);
    } else if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = 0;
    }
  }

  private paintTime() {
    const el = this.querySelector(".ui-think__time");
    const node = el ? [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE) : undefined;
    if (!node || this.isDone) return;
    const now = Date.now();
    const value = format(Math.max(0, Math.floor((now - this.startOf(now)) / 1000)));
    if (node.nodeValue !== value) node.nodeValue = value;
  }

  /* ---------- Source tooltips: Escape hides one until the pointer or focus leaves the chip (WCAG 1.4.13) ---------- */

  private onDocKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.hotChip?.querySelector(".ui-think__tip")) this.hotChip.setAttribute("data-tip-off", "");
  };
  private chipIn = (e: Event) => (this.hotChip = e.currentTarget as HTMLElement);
  private chipOut = (e: Event) => {
    const chip = e.currentTarget as HTMLElement;
    chip.removeAttribute("data-tip-off");
    if (this.hotChip === chip) this.hotChip = null;
  };

  private renderSource(source: ThinkingSource, delay: number) {
    const tip = source.tooltip ?? source.href?.replace(/^https?:\/\//, "");
    const inner = html`${source.icon ? html`<span class="ui-think__favicon">${source.icon.cloneNode(true)}</span>` : nothing}<span class="ui-think__source-label">${source.label}</span>${tip ? html`<span class="ui-think__tip" aria-hidden="true">${tip}</span>` : nothing}`;
    const style = styleMap({ animationDelay: `${delay}ms` });
    return safeUrl(source.href)
      ? html`<a class="ui-think__source" ?data-count=${!source.icon} style=${style} href=${ifDefined(safeUrl(source.href))} target="_blank" rel="noreferrer" @pointerenter=${this.chipIn} @pointerleave=${this.chipOut} @focus=${this.chipIn} @blur=${this.chipOut}>${inner}</a>`
      : html`<span class="ui-think__source" ?data-count=${!source.icon} style=${style} @pointerenter=${this.chipIn} @pointerleave=${this.chipOut} @focus=${this.chipIn} @blur=${this.chipOut}>${inner}</span>`;
  }

  /* ---------- Render ---------- */

  private renderList() {
    const clean = this.clean;
    const done = this.isDone;
    const shown = this.shown;
    const active = done ? -1 : shown - 1;
    return html`<ol class="ui-think__list">
      ${this.steps.slice(0, shown).map((step, i) => {
        const isActive = i === active;
        const label = step.kind === "search" && isActive ? (step.activeLabel ?? "Searching") : step.label;
        const open = this.expanded.has(i);
        return html`<li class="ui-think__item" data-kind=${step.kind} ?data-active=${isActive}>
          <span class="ui-think__node" aria-hidden="true">${step.kind === "search" ? globe : html`<span class="ui-think__dot"></span>`}</span>
          <div class="ui-think__content">
            <span class=${isActive ? "ui-think__label ui-think__shimmer" : "ui-think__label"} data-text=${label}>${label}</span>
            ${step.kind === "search"
              ? html`<div class="ui-think__sources">
                  ${[...step.sources, ...(open ? (step.moreSources ?? []) : [])].map((source, j) =>
                    // Extra sources pop in quickly after a click, the first ones follow the search
                    this.renderSource(source, j < step.sources.length ? 120 + j * CHIP_MS : (j - step.sources.length) * 70),
                  )}
                  ${step.moreSources?.length
                    ? html`<button
                        type="button"
                        class="ui-think__source ui-think__more"
                        aria-expanded=${open ? "true" : "false"}
                        style=${styleMap({ animationDelay: `${120 + step.sources.length * CHIP_MS}ms` })}
                        @click=${() => {
                          this.touched = true;
                          const next = new Set(this.expanded);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          this.expanded = next;
                        }}
                      >${open ? "Show less" : `+${step.moreSources.length} more`}</button>`
                    : nothing}
                </div>`
              : nothing}
          </div>
        </li>`;
      })}
      ${done
        ? html`<li class="ui-think__item" data-kind="done">
            <span class="ui-think__node" aria-hidden="true">${clean ? checkClean : checkStandard}</span>
            <div class="ui-think__content"><span class="ui-think__label">${this.doneLabel}</span></div>
          </li>`
        : nothing}
    </ol>`;
  }

  protected override render() {
    const clean = this.clean;
    const done = this.isDone;
    const open = this.open;
    const bodyId = `${this.uid}-steps`;
    const list = this.renderList();
    // A new run starts from scratch, like the React component's key
    return keyed(
      this.run,
      html`
        <span class="ui-think__sr" role="status">${done ? `${this.doneLabel}. Worked for ${format(this.seconds)}` : ""}</span>
        <button type="button" class="ui-think__head" aria-expanded=${open ? "true" : "false"} aria-controls=${bodyId} @click=${() => this.setOpen(!this.open)}>
          ${clean
            ? html`<span class="ui-think__mark" aria-hidden="true">${PIXEL_DELAYS.map((d) => html`<i style=${styleMap({ animationDelay: `${d}ms` })}></i>`)}</span>`
            : html`<span class="ui-think__chevron" aria-hidden="true">${chevronStandard}</span>`}
          ${keyed(
            done ? "done" : "busy",
            html`<span class="ui-think__title">${done
              ? `Worked for ${format(this.seconds)}`
              : html`<span class="ui-think__shimmer" data-text="Thinking">Thinking</span><span class="ui-think__time" aria-hidden="true">${format(this.seconds)}</span>`}</span>`,
          )}
          ${clean ? html`<span class="ui-think__chevron" aria-hidden="true">${chevronClean}</span>` : nothing}
        </button>
        <div class="ui-think__body" id=${bodyId} data-open=${open ? "true" : "false"} .inert=${!open}>${clean ? html`<div class="ui-think__clip">${list}</div>` : list}</div>
      `,
    );
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="think"] (see Theming in the docs) */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="think"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-thinking-state-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.95));

  width: 100%;
  max-width: 440px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="think"] (see Theming in the docs) */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="think"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-thinking-state-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */

  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 440px;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="think"] *,
[data-ui="think"] *::before,
[data-ui="think"] *::after {
  box-sizing: border-box;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="think"] svg {
  display: block;
  width: 100%;
  height: 100%;
}
/* Header: chevron + "Thinking 4s" / "Worked for 18s" */
:where([data-look="standard"], [data-look="standard"] *).ui-think__head {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  margin: 0 0 0 -4px;
  padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1) var(--tc-space-1);
  border: 0;
  border-radius: var(--tc-radius-md);
  background: none;
  font: inherit;
  font-size: var(--tc-font-size-lg-plus);
  color: var(--tc-text-muted);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__head:hover {
  background: var(--tc-fill-default);
  color: var(--tc-text-secondary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__chevron {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-90deg);
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__head[aria-expanded="true"] .ui-think__chevron {
  transform: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__title {
  display: inline-flex;
  gap: var(--tc-space-2);
  animation: ui-think-in var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__time {
  font-variant-numeric: tabular-nums;
}
/* Body collapses smoothly */
:where([data-look="standard"], [data-look="standard"] *).ui-think__body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__body[data-open="false"] {
  grid-template-rows: 0fr;
  opacity: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__body[data-open="false"] .ui-think__list {
  overflow: hidden;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__list {
  min-height: 0;
  /* clips only while collapsed, so tooltips can reach out when open */
  overflow: visible;
  margin: 0;
  padding: var(--tc-space-2-5) 0 0;
  list-style: none;
}
/* Timeline: icon column with a line growing down to the next node */
:where([data-look="standard"], [data-look="standard"] *).ui-think__item {
  position: relative;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: var(--tc-space-3);
  padding-bottom: var(--tc-space-3);
  animation: ui-think-in var(--tc-duration-slowest) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__item:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 9.5px;
  top: 24px;
  bottom: 2px;
  width: 1px;
  background: var(--tc-border-default);
  transform-origin: top;
  animation: ui-think-line var(--tc-duration-slowest) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__node {
  display: grid;
  place-items: center;
  width: 20px;
  height: 21px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__globe {
  width: 18px !important;
  height: 18px !important;
  fill: none;
  stroke: var(--tc-text-muted);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tc-text-disabled);
  transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__item[data-active] .ui-think__dot {
  background: var(--tc-text-primary);
  animation: ui-think-pulse 1.2s ease-in-out 4;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__check {
  width: 18px !important;
  height: 18px !important;
  animation: ui-think-pop var(--tc-duration-slower) var(--tc-ease-spring) both;
}
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="think"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="think"]) svg { display: block; flex: none; }
[data-ui="think"] button:focus-visible,
[data-ui="think"] a:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
.ui-think__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* Header row: pixel mark + "Thinking 4s" / "Worked for 18s" + chevron */
:where([data-look="clean"], [data-look="clean"] *).ui-think__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  width: 100%;
  height: 44px;
  padding: 0 var(--tc-space-3) 0 var(--tc-space-4);
  border-radius: var(--tc-radius-lg);
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), border-radius 0ms linear var(--tc-duration-slow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__head[aria-expanded="true"] {
  border-radius: var(--tc-radius-lg) var(--tc-radius-lg) 0 0;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__head:hover {
  background: var(--tc-fill-subtle);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__mark {
  display: grid;
  grid-template-columns: repeat(3, 3px);
  grid-auto-rows: 3px;
  gap: 1.5px;
  place-content: center;
  width: 16px;
  height: 16px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__mark i {
  border-radius: 0.75px;
  background: var(--tc-accent);
  animation: ui-think-pixel 1.2s ease-in-out 4 both;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="think"][data-done] .ui-think__mark i {
  animation: ui-think-settle var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__title {
  display: inline-flex;
  flex: 1;
  min-width: 0;
  gap: var(--tc-space-2);
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  color: var(--tc-text-primary);
  animation: ui-think-in var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__title .ui-think__shimmer {
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__time {
  font-weight: var(--tc-font-weight-regular);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__chevron {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-right: -6px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__chevron svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-90deg);
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__head[aria-expanded="true"] .ui-think__chevron svg {
  transform: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__head:hover .ui-think__chevron {
  color: var(--tc-text-primary);
}
/* Body: folds away under a hairline – only this part animates and clips */
:where([data-look="clean"], [data-look="clean"] *).ui-think__body {
  display: grid;
  grid-template-rows: 1fr;
  border-top: 0.5px solid var(--tc-border-default);
  transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard), border-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__body[data-open="false"] {
  grid-template-rows: 0fr;
  opacity: 0;
  border-top-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__clip {
  min-height: 0;
  /* clips only while folded, so tooltips can reach out when open */
  overflow: visible;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__body[data-open="false"] .ui-think__clip {
  overflow: hidden;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__list {
  margin: 0;
  padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-1);
  list-style: none;
}
/* Timeline: icon column with a thin rail growing down to the next node */
:where([data-look="clean"], [data-look="clean"] *).ui-think__item {
  position: relative;
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: var(--tc-space-2-5);
  padding-bottom: var(--tc-space-3);
  animation: ui-think-in var(--tc-duration-slowest) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__item:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 7.5px;
  top: 22px;
  bottom: 2px;
  width: 1px;
  background: var(--tc-border-default);
  transform-origin: top;
  animation: ui-think-line var(--tc-duration-slowest) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__node {
  display: grid;
  place-items: center;
  width: 16px;
  height: 20px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__globe {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--tc-icon-muted);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* A finished step is a small gray dot, the running one a blue pixel that pulses */
:where([data-look="clean"], [data-look="clean"] *).ui-think__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--tc-text-disabled);
  transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), border-radius var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__item[data-active] .ui-think__dot {
  width: 6px;
  height: 6px;
  border-radius: 1.5px;
  background: var(--tc-accent);
  animation: ui-think-pulse-clean 1s ease-in-out 4;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__check {
  width: 16px;
  height: 16px;
  animation: ui-think-pop var(--tc-duration-slower) var(--tc-ease-spring) both;
}
.ui-think__check circle {
  fill: var(--tc-accent);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__check path {
  fill: none;
  stroke: #fff;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 14;
  stroke-dashoffset: 14;
  animation: ui-think-draw var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-base) forwards;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__content {
  min-width: 0;
  padding-top: 0.5px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__label {
  display: inline-block;
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__item[data-active] .ui-think__label,
:where([data-look="standard"], [data-look="standard"] *).ui-think__item[data-kind="done"] .ui-think__label {
  color: var(--tc-text-secondary);
}
/* Sources: chips pop in one after another */
:where([data-look="standard"], [data-look="standard"] *).ui-think__sources {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tc-space-1-5);
  margin-top: var(--tc-space-2);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__source {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  max-width: 100%;
  height: 28px;
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-md);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-primary);
  animation: ui-think-chip var(--tc-duration-slower) var(--tc-ease-move) both;
}
a.ui-think__source:where([data-look="standard"], [data-look="standard"] *),
:where([data-look="standard"], [data-look="standard"] *).ui-think__more {
  position: relative;
  border: 0;
  font: inherit;
  font-size: var(--tc-font-size-md);
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
a.ui-think__source:where([data-look="standard"], [data-look="standard"] *):hover {
  background: var(--tc-fill-hover);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__more {
  padding: 0 var(--tc-space-2-5);
  background: none;
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__more:hover {
  background: var(--tc-fill-default);
  color: var(--tc-text-primary);
}
/* Tooltip above the chip: the tooltip recipe in both looks. It can be hovered (a bridge spans the gap), shows on
   focus too, and Escape hides it */
.ui-think__tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  z-index: 2;
  padding: var(--tc-tooltip-py) var(--tc-tooltip-px);
  border-radius: var(--tc-tooltip-radius);
  background: var(--tc-tooltip-bg);
  box-shadow: var(--tc-shadow-overlay);
  color: var(--tc-tooltip-fg);
  font-size: var(--tc-tooltip-font-size);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, 4px);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move);
}
.ui-think__tip::before { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-think__check path {
  fill: none;
  stroke: #fff;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 9;
  stroke-dashoffset: 9;
  animation: ui-think-draw var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-base) forwards;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__content {
  min-width: 0;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__label {
  position: relative;
  display: inline-block;
  max-width: 100%;
  color: var(--tc-text-secondary);
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
/* The running step: gray with a darker band sweeping through */
:where([data-look="clean"], [data-look="clean"] *).ui-think__item[data-active] .ui-think__label {
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__item[data-kind="done"] .ui-think__label {
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-primary);
}
/* Sources: small white chips that pop in one after another */
:where([data-look="clean"], [data-look="clean"] *).ui-think__sources {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tc-space-1-5);
  margin-top: var(--tc-space-2);
  padding: 1px 0 var(--tc-space-0-5);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__source {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  max-width: 100%;
  height: 26px;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-primary);
  text-decoration: none;
  animation: ui-think-chip var(--tc-duration-slower) var(--tc-ease-move) both;
}
a.ui-think__source:where([data-look="clean"], [data-look="clean"] *),
:where([data-look="clean"], [data-look="clean"] *).ui-think__more {
  position: relative;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
a.ui-think__source:where([data-look="clean"], [data-look="clean"] *):hover {
  background: var(--tc-fill-subtle);
}
/* "+3 more" – the quiet chip with an inner hairline */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="think"] .ui-think__more {
  padding: 0 var(--tc-space-2);
  background: none;
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-secondary);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="think"] .ui-think__more:hover {
  background: var(--tc-fill-subtle);
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="think"] .ui-think__more[aria-expanded="true"] {
  background: var(--tc-fill-default);
  color: var(--tc-text-primary);
}
.ui-think__source:hover .ui-think__tip,
.ui-think__source:focus-visible .ui-think__tip {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, 0);
  transition-delay: var(--tc-duration-moderate);
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__source[data-count] {
  padding: 0 var(--tc-space-2-5);
  background: none;
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__source[data-count] {
  padding: 0 var(--tc-space-2);
  background: none;
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  color: var(--tc-text-secondary);
}
.ui-think__source-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__favicon {
  display: grid;
  place-items: center;
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: var(--tc-radius-xs);
  overflow: hidden;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__favicon {
  display: grid;
  place-items: center;
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: var(--tc-radius-xs);
  overflow: hidden;
  box-shadow: 0 0 0 0.5px var(--tc-border-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__favicon svg {
  width: 100%;
  height: 100%;
}
/* Shimmer over the active label, like the loading states elsewhere */
.ui-think__shimmer {
  position: relative;
}
.ui-think__shimmer::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-thinking-state-shimmer) 50%, transparent 62%) 100% 0 / 300% 100%
    no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-think-sweep var(--tc-duration-shimmer) linear 3;
  pointer-events: none;
}
@keyframes ui-think-in {
  from { opacity: 0; transform: translateY(6px); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-think-line {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
@keyframes ui-think-chip {
  from { opacity: 0; transform: translateY(4px) scale(0.92); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-think-pulse {
  50% { transform: scale(0.7); opacity: 0.5; }
}
@keyframes ui-think-pulse-clean {
  50% { transform: scale(0.7); opacity: 0.45; }
}
@keyframes ui-think-pixel {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
@keyframes ui-think-settle {
  from { opacity: 0.2; transform: scale(0.6); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-think-pop {
  0% { transform: scale(0.5); }
  60% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
@keyframes ui-think-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes ui-think-sweep {
  from { background-position: 100% 0; }
  to { background-position: 0% 0; }
}
.ui-think__source[data-tip-off] .ui-think__tip { opacity: 0; pointer-events: none; }
/* Narrow (phones) */
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-think__head { padding: 0 var(--tc-space-2-5) 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-think__list { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-0-5); }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-think__head { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-think__source { height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="think"] *,
  [data-ui="think"] *::before,
  [data-ui="think"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
  .ui-think__shimmer::after {
    display: none;
  }
  .ui-think__check path {
    stroke-dashoffset: 0;
  }
}
`;
}

if (!customElements.get("tc-thinking-state")) customElements.define("tc-thinking-state", TcThinkingState);

declare global {
  interface HTMLElementTagNameMap {
    "tc-thinking-state": TcThinkingState;
  }
}
