import { html, nothing, render as litRender, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";
import { adoptStyles } from "./internal/styles";

/*
 * <tc-stepper-form> – the Lit port of src/components/stepper-form.tsx: a multi-step flow for onboarding, checkout or
 * setup wizards. Numbered steps on top; finished steps swap their number for a check that draws in. Each step slides
 * in from the side you're heading to, and the card glides to the new step's height. Continue checks the step: invalid
 * fields shake once and say what's wrong; Enter continues, Back keeps everything. The last step runs `onComplete`,
 * then a small success state takes over. On narrow screens the steps collapse to "Step 2 of 4 · Team".
 * Clean is one white card with hairline shadows: a thin progress bar per step on top, Back and Continue in the
 * card's last row.
 *
 *   <tc-stepper-form .steps=${steps} .values=${{ name: "" }}></tc-stepper-form>
 *
 * A step's `render(ctx)` returns its content (anything Lit renders). A step without `render` leaves its body empty
 * for the app to fill (the React wrapper renders its React content there): `panes` lists the bodies shown, and
 * `tc-panes-change` fires whenever they or the errors change.
 *
 * The building blocks come along as elements, light DOM, styled by the form's CSS: <tc-stepper-field> (a label, the
 * control and a message that folds in), <tc-stepper-input> (wraps a native <input> child), <tc-stepper-tags> (emails
 * as chips) and <tc-stepper-choices> (selectable cards) – both form-associated, submitting under `name` –,
 * <tc-stepper-review> (a summary with Edit links) and <tc-stepper-success>. They find their form and field with
 * closest(), so they work from any framework.
 *
 * `values` and `step` change with cancelable `tc-values-change` and `tc-step-change` events: preventDefault() keeps
 * control yourself.
 */

export type StepperErrors = Partial<Record<string, string>>;

export type StepperContext<V = Record<string, unknown>> = {
  values: V;
  /** Merges a patch into the values – shared by every step, so Back keeps what was entered */
  setValues: (patch: Partial<V>) => void;
  /** Messages of this step – only filled after a Continue that didn't pass */
  errors: StepperErrors;
  /** Jumps to a step by id – from a later step, Continue then returns to where you came from */
  goTo: (id: string) => void;
  /** Same as pressing Continue */
  next: () => void;
};

export type StepperFormStep<V = Record<string, unknown>> = {
  id: string;
  /** Short label for the step list, e.g. "Team" */
  title: string;
  /** Heading inside the card – defaults to the title */
  heading?: string;
  /** A line under the heading */
  description?: string;
  /** The step's content; unset leaves the body empty for the app to fill */
  render?: (ctx: StepperContext<V>) => unknown;
  /** Returns messages by field name; nothing (or an empty object) means the step is fine */
  validate?: (values: V) => StepperErrors | null | undefined;
};

export type StepperComplete<V = Record<string, unknown>> = (values: V, options: { signal: AbortSignal }) => void | Promise<void>;

/** A pane shown: a step's body (or, for the success pane, the pane itself) and whether it's the current one */
export type StepperPane = { index: number; element: HTMLElement; current: boolean };

type Values = Record<string, unknown>;

/* ---------- Helpers ---------- */

const hasErrors = (e: StepperErrors | null | undefined) => !!e && Object.values(e).some(Boolean);

/** A short, calm shake – Web Animations, so it can run again on the same element */
function shake(el: Element | null | undefined) {
  if (!el || reducedMotion() || !(el as HTMLElement).animate) return;
  (el as HTMLElement).animate(
    [{ transform: "none" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "none" }],
    { duration: 340, easing: "ease-out" },
  );
}

/** Moves a ring or pill onto the active child of a list – no transition on the first placement, so it doesn't fly in */
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

/** Every Lit element under `root` finished updating (twice: a block updates after its field) */
async function settleBlocks(root: Element) {
  for (let i = 0; i < 3; i++) {
    const pending = [...root.querySelectorAll("*")].filter((el) => "updateComplete" in el) as unknown as { updateComplete: Promise<unknown> }[];
    await Promise.all(pending.map((el) => el.updateComplete));
  }
}

/* ---------- Icons ---------- */

const icons = {
  check: "M5.5 12.5l4 4L18.5 8",
  close: "M7 7l10 10M17 7 7 17",
  back: "M14.5 6l-6 6 6 6",
};
const glyph = (d: string) => html`<svg viewBox="0 0 24 24" class="ui-sf__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
/** A check that draws itself in – pathLength 1 makes the dash math independent of the path */
const drawCheck = () => html`<svg viewBox="0 0 24 24" class="ui-sf__draw" aria-hidden="true">${svg`<path d=${icons.check} pathLength="1"></path>`}</svg>`;

let instances = 0;
const nextUid = (kind: string) => `tc-sf-${kind}${++instances}`;

/** The look of the form a building block sits in */
const formLook = (el: Element): Look | undefined => (el.closest("tc-stepper-form") as TcStepperForm | null)?.resolvedLook;

/* ---------- The form ---------- */

/**
 * A multi-step flow: numbered steps, sliding panes, checks on Continue and a success state.
 * @tag tc-stepper-form
 * @fires tc-values-change - A step changed the values; detail `{ values }`. Cancelable.
 * @fires tc-step-change - Another step opens; detail `{ step: number }`. Cancelable.
 * @fires tc-panes-change - The panes shown or the current step's errors changed (for apps that render the step content themselves); detail `{ panes: StepperPane[] }`.
 */
export class TcStepperForm extends TcElement {
  static override ui = "sf";

  /** The steps in order: id, title, content and the check Continue runs */
  @property({ attribute: false }) accessor steps: StepperFormStep[] = [];
  /** The values of every step */
  @property({ attribute: false }) accessor values: Values = {};
  /** The open step's index */
  @property({ type: Number }) accessor step = 0;
  /** Runs with all values on the last step; return a promise to show "Creating…" until it settles (throw to show an error that can be retried). The signal aborts when the form is removed mid-way */
  @property({ attribute: false }) accessor onComplete: StepperComplete | undefined = undefined;
  /** Label of the last button */
  @property({ attribute: "submit-label" }) accessor submitLabel = "Finish";
  /** Label while onComplete runs */
  @property({ attribute: "submitting-label" }) accessor submittingLabel = "Creating…";
  /** What shows once onComplete is done: a render function, unset for a short "All set", or null to leave the pane empty for the app */
  @property({ attribute: false }) accessor success: ((values: Values, reset: () => void) => unknown) | null | undefined = undefined;

  @state() private accessor reached = 0;
  @state() private accessor attemptedSteps: Record<number, boolean> = {};
  @state() private accessor shakeCount = 0;
  @state() private accessor returnTo: number | null = null;
  @state() private accessor submitting = false;
  @state() private accessor submitError = "";
  @state() private accessor done = false;
  @state() private accessor announce = "";
  /** Which pane shows, and the one sliding out */
  @state() private accessor view: { index: number; from: number | null; dir: 1 | -1 } = { index: 0, from: null, dir: 1 };

  private readonly uid = nextUid("form");
  /** Set on every move, so focus follows it (never on the first render) */
  private moved = false;
  /** Nothing slides in on the first render */
  private navigated = false;
  /** Problems a building block found on its own, e.g. a typed email that isn't one yet */
  private local: StepperErrors = {};
  /** The newest values, also between a change and the update that shows it */
  private latestValues: Values = {};
  private start: { values: Values; step: number } | null = null;
  private completing: AbortController | null = null;
  private viewTimer = 0;
  private paneRo?: ResizeObserver;
  private paneObserved: HTMLElement | null = null;
  private btnRo?: ResizeObserver;
  private lastShakes = 0;
  private panesSignature = "";

  constructor() {
    super();
    // Safety net: Back disabled, a jump button gone, the footer folding away – focus goes to Continue, else the open
    // step's heading, never <body>
    new FocusRescueController(this, () => {
      const btn = this.querySelector<HTMLElement>(".ui-sf__btn-primary");
      return (btn?.closest("[inert]") ? null : btn) ?? this.querySelector<HTMLElement>('[data-pane="current"] .ui-sf__heading');
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // onComplete may still be running: its signal aborts, and nothing is set afterwards
    this.completing?.abort();
    this.completing = null;
    clearTimeout(this.viewTimer);
    this.paneRo?.disconnect();
    this.paneRo = undefined;
    this.paneObserved = null;
    this.btnRo?.disconnect();
    this.btnRo = undefined;
  }

  /* ---------- State ---------- */

  private get n() {
    return this.steps.length;
  }
  /** @internal The open step's index, within the steps */
  get index() {
    return Math.max(0, Math.min(this.n - 1, this.step));
  }
  private get verdict() {
    return this.steps[this.index]?.validate?.(this.values);
  }
  /** @internal The current step's messages – only after a Continue that didn't pass */
  get errorsShown(): StepperErrors {
    return this.attemptedSteps[this.index] ? this.verdict ?? {} : {};
  }
  /** @internal How many times a Continue failed – fields shake when it goes up */
  get shakes() {
    return this.shakeCount;
  }

  /** The panes shown: the current one, and one sliding out */
  get panes(): StepperPane[] {
    return [...this.querySelectorAll<HTMLElement>(".ui-sf__viewport > .ui-sf__pane")].map((pane) => {
      const index = Number(pane.dataset.index);
      return { index, element: index < this.n ? pane.querySelector<HTMLElement>(".ui-sf__body") ?? pane : pane, current: pane.dataset.pane === "current" };
    });
  }

  /** Merges a patch into the values */
  setValues(patch: Partial<Values>) {
    const next = { ...this.latestValues, ...patch };
    this.latestValues = next;
    if (this.emit("tc-values-change", { values: next }, { cancelable: true })) this.values = next;
  }

  private setStep(next: number) {
    if (this.emit("tc-step-change", { step: next }, { cancelable: true })) this.step = next;
  }

  /** @internal A building block's own finding for a field (null clears it) */
  report(name: string, message: string | null) {
    this.local = { ...this.local, [name]: message ?? undefined };
  }
  /** @internal Says a message through the form's status region */
  say(message: string) {
    this.announce = message;
  }

  private go(to: number) {
    const n = this.n;
    const next = Math.max(0, Math.min(n - 1, to));
    if (next === this.index) return;
    this.moved = true;
    this.navigated = true;
    this.local = {};
    this.setStep(next);
    this.reached = Math.max(this.reached, next);
    this.submitError = "";
    this.announce = `Step ${next + 1} of ${n}: ${this.steps[next].title}`;
  }

  /** Checks the current step; shakes and announces the first problem when it doesn't pass */
  private check() {
    const index = this.index;
    const errs = { ...this.local, ...this.steps[index]?.validate?.(this.latestValues) };
    if (!hasErrors(errs)) {
      this.attemptedSteps = { ...this.attemptedSteps, [index]: false };
      return true;
    }
    this.attemptedSteps = { ...this.attemptedSteps, [index]: true };
    this.shakeCount++;
    this.announce = Object.values(errs).find(Boolean) ?? "Check this step";
    return false;
  }

  private async submit(e?: Event) {
    e?.preventDefault();
    if (this.submitting || this.done || !this.check()) return;
    const index = this.index;
    if (index < this.n - 1) {
      if (this.returnTo !== null && this.returnTo > index) {
        const to = this.returnTo;
        this.returnTo = null;
        this.go(to);
      } else this.go(index + 1);
      return;
    }
    this.submitting = true;
    this.submitError = "";
    const controller = new AbortController();
    this.completing = controller;
    try {
      await this.onComplete?.(this.latestValues, { signal: controller.signal });
      if (controller.signal.aborted) return;
      this.moved = true;
      this.navigated = true;
      this.done = true;
      this.announce = "All done";
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error && err.message ? err.message : "Something went wrong – try again";
      this.submitError = message;
      this.announce = message;
    } finally {
      if (this.completing === controller) this.completing = null;
      if (!controller.signal.aborted) this.submitting = false;
    }
  }

  private back() {
    this.returnTo = null;
    this.go(this.index - 1);
  }

  /** Jumps to a step by id – forward jumps need the current step to pass first */
  goTo(id: string) {
    const index = this.index;
    const to = this.steps.findIndex((s) => s.id === id);
    if (to < 0 || to === index) return;
    if (to > index && !this.check()) return;
    this.returnTo = to < index ? index : null;
    this.go(to);
  }

  /** Same as pressing Continue */
  next() {
    this.querySelector<HTMLFormElement>("form.ui-sf__card")?.requestSubmit();
  }

  /** Back to the start: the first values and step, nothing checked, not done */
  reset() {
    const start = this.start ?? { values: {}, step: 0 };
    this.latestValues = start.values;
    if (this.emit("tc-values-change", { values: start.values }, { cancelable: true })) this.values = start.values;
    this.attemptedSteps = {};
    this.returnTo = null;
    this.reached = start.step;
    this.done = false;
    this.submitError = "";
    this.moved = true;
    this.navigated = true;
    this.local = {};
    this.setStep(start.step);
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.latestValues = this.values;
    if (!this.start) {
      this.start = { values: this.values, step: this.step };
      this.reached = this.index;
      this.view = { index: this.index, from: null, dir: 1 };
    }
    // Which pane shows, and the one sliding out – both there in the same frame; the leaving pane goes once its slide
    // is over
    const viewIndex = this.done ? this.n : this.index;
    if (this.view.index !== viewIndex) {
      this.view = { index: viewIndex, from: this.view.index, dir: viewIndex > this.view.index ? 1 : -1 };
      clearTimeout(this.viewTimer);
      this.viewTimer = window.setTimeout(() => (this.view = { ...this.view, from: null }), 420);
    }
  }

  protected override updated() {
    this.style.setProperty("--tc-stepper-form-n", String(this.n));
    // Apps rendering the step content themselves hear about the panes first, so it's there for the focus below
    const panes = this.panes;
    const signature = JSON.stringify([panes.map((p) => [p.index, p.current]), this.errorsShown, this.resolvedLook]);
    if (signature !== this.panesSignature) {
      this.panesSignature = signature;
      this.emit("tc-panes-change", { panes });
    }
    // The building blocks read the form (errors, shakes, look)
    this.querySelectorAll<TcElement>("tc-stepper-field, tc-stepper-input, tc-stepper-tags, tc-stepper-choices, tc-stepper-review, tc-stepper-success").forEach((el) => el.requestUpdate());
    this.cardMotion();
  }

  /**
   * Focus follows the new step, a failed Continue focuses the first problem, the card glides to the height of the
   * step coming in, and the primary button glides to the width of its label.
   */
  private cardMotion() {
    const viewport = this.querySelector<HTMLElement>(".ui-sf__viewport");
    const pane = viewport?.querySelector<HTMLElement>('[data-pane="current"]');
    if (this.moved) {
      // Its first field, else its heading (never on the first render)
      this.moved = false;
      if (pane)
        void settleBlocks(pane).then(() => {
          const field = pane.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled), textarea, select');
          (field ?? pane.querySelector<HTMLElement>(".ui-sf__heading"))?.focus({ preventScroll: true });
        });
    }
    if (this.shakeCount !== this.lastShakes) {
      // After a failed Continue the first field with a problem gets the focus – in view above the sticky footer
      this.lastShakes = this.shakeCount;
      if (pane)
        void settleBlocks(pane).then(() => {
          const field = pane.querySelector<HTMLElement>('[aria-invalid="true"]');
          field?.focus({ preventScroll: true });
          field?.scrollIntoView?.({ block: "nearest" });
        });
    }
    // The card glides to the height of the step that's coming in
    if (viewport && pane && pane !== this.paneObserved) {
      this.paneRo?.disconnect();
      this.paneObserved = pane;
      const first = !viewport.dataset.ready;
      const set = () => (viewport.style.height = `${pane.offsetHeight}px`);
      if (first) viewport.style.transition = "none";
      set();
      if (first) {
        viewport.dataset.ready = "1";
        void viewport.offsetWidth;
        viewport.style.transition = "";
      }
      if (typeof ResizeObserver === "function") {
        this.paneRo = new ResizeObserver(set);
        this.paneRo.observe(pane);
      }
    }
    // The primary button glides to the width of its new label
    if (!this.btnRo && typeof ResizeObserver === "function") {
      const box = this.querySelector<HTMLElement>(".ui-sf__btn-primary");
      const inner = box?.querySelector<HTMLElement>(".ui-sf__btn-inner");
      if (box && inner) {
        const set = () => (box.style.width = `${inner.offsetWidth}px`);
        set();
        this.btnRo = new ResizeObserver(set);
        this.btnRo.observe(inner);
      }
    }
  }

  /* ---------- Render ---------- */

  private renderHead(look: Look): TemplateResult {
    const { steps, n, index, done, submitting } = this;
    const furthest = Math.max(this.reached, index);
    return html`<div class="ui-sf__head">
      <div class="ui-sf__steps">
        <ol class="ui-sf__list" aria-label="Progress">
          ${repeat(
            steps,
            (s) => s.id,
            (s, i) => {
              const st = done || (i < furthest && i !== index) ? "done" : i === index ? "current" : "upcoming";
              const canJump = !done && !submitting && i !== index && i <= furthest;
              const inner = html`${look === "clean" ? html`<span class="ui-sf__bar" aria-hidden="true"></span>` : nothing}<span class="ui-sf__mark"
                  >${st === "done" ? keyed("check", drawCheck()) : keyed("num", html`<span>${look === "clean" ? i + 1 : `${i + 1}.`}</span>`)}</span
                ><span class="ui-sf__step-label">${s.title}</span><span class="ui-sf__sr">${st === "done" ? " (done)" : st === "current" ? " (current)" : ""}</span>`;
              return html`<li class="ui-sf__step" data-state=${st} aria-current=${ifDefined(!done && i === index ? "step" : undefined)}>
                ${canJump ? html`<button type="button" class="ui-sf__step-btn" @click=${() => this.goTo(s.id)}>${inner}</button>` : html`<span class="ui-sf__step-btn">${inner}</span>`}
              </li>`;
            },
          )}
        </ol>
      </div>
      <div class="ui-sf__compact" aria-hidden="true">
        ${keyed(
          done ? "done" : index,
          html`<span class="ui-sf__compact-text"
            >${done
              ? `All ${n} steps done`
              : html`Step ${index + 1} of ${n}<span class="ui-sf__compact-dot">·</span><span class="ui-sf__compact-title">${steps[index]?.title}</span>`}</span
          >`,
        )}
      </div>
    </div>`;
  }

  private renderPane(i: number, current: boolean): TemplateResult {
    const n = this.n;
    const attrs = { current, dir: this.view.dir, first: !this.navigated };
    const pane = (content: unknown) =>
      html`<div
        class="ui-sf__pane"
        data-index=${i}
        data-pane=${attrs.current ? "current" : "leaving"}
        data-dir=${attrs.dir}
        ?data-first=${attrs.first}
        .inert=${!attrs.current}
        aria-hidden=${ifDefined(attrs.current ? undefined : "true")}
      >${content}</div>`;
    const empty = () =>
      html`<div
        class="ui-sf__pane"
        data-index=${i}
        data-pane=${attrs.current ? "current" : "leaving"}
        data-dir=${attrs.dir}
        ?data-first=${attrs.first}
        .inert=${!attrs.current}
        aria-hidden=${ifDefined(attrs.current ? undefined : "true")}
      ></div>`;
    if (i >= n) {
      if (this.success === null) return empty();
      if (this.success) return pane(this.success(this.values, () => this.reset()));
      return pane(html`<tc-stepper-success heading="All set" description="Everything is saved. You can change it any time."></tc-stepper-success>`);
    }
    const s = this.steps[i];
    const ctx: StepperContext = {
      values: this.values,
      setValues: (patch) => this.setValues(patch),
      errors: current && i === this.index ? this.errorsShown : {},
      goTo: (id) => this.goTo(id),
      next: () => this.next(),
    };
    const render = s.render;
    return pane(html`<h2 class="ui-sf__heading" tabindex="-1" id=${`${this.uid}-h${i}`}>${s.heading ?? s.title}</h2>${s.description
        ? html`<p class="ui-sf__desc">${s.description}</p>`
        : nothing}${render ? html`<div class="ui-sf__body">${render(ctx)}</div>` : html`<div class="ui-sf__body"></div>`}`);
  }

  private renderFoot(): TemplateResult {
    const { index, done, submitting, submitError, returnTo, steps } = this;
    const last = index === this.n - 1;
    const valid = !hasErrors(this.verdict);
    const label = submitting ? this.submittingLabel : last ? this.submitLabel : returnTo !== null && returnTo > index ? `Back to ${steps[returnTo].title.toLowerCase()}` : "Continue";
    return html`<div class="ui-sf__foot-fold" ?data-hidden=${done}>
      <div class="ui-sf__foot" .inert=${done}>
        <button type="button" class="ui-sf__btn ui-sf__btn-ghost" ?data-hidden=${index === 0} ?disabled=${index === 0 || submitting} @click=${this.back}>${glyph(icons.back)}Back</button>
        ${submitError ? html`<span class="ui-sf__submit-error" role="alert">${submitError}</span>` : nothing}
        <button type="submit" class="ui-sf__btn ui-sf__btn-primary" aria-disabled=${ifDefined(!valid || submitting ? "true" : undefined)} ?data-busy=${submitting}>
          <span class="ui-sf__btn-inner">${submitting ? html`<span class="ui-sf__spinner" aria-hidden="true"></span>` : nothing}${keyed(label, html`<span class="ui-sf__btn-label">${label}</span>`)}</span>
        </button>
      </div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const view = this.view;
    const panes = view.from !== null && view.from !== view.index ? [view.from, view.index] : [view.index];
    return html`
      ${this.renderHead(look)}
      <form class="ui-sf__card" novalidate @submit=${this.submit} aria-labelledby=${ifDefined(this.done ? undefined : `${this.uid}-h${this.index}`)}>
        <div class="ui-sf__viewport">
          ${repeat(
            panes,
            (i) => i,
            (i) => this.renderPane(i, i === view.index),
          )}
        </div>
        ${this.renderFoot()}
      </form>
      <span class="ui-sf__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="sf"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sf"] {
  /* A soft gray halo (hovered step, the success check) and the hairline of a hovered field */
  --tc-stepper-form-halo: light-dark(rgba(23, 23, 23, 0.08), rgba(255, 255, 255, 0.08));
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 520px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="sf"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sf"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 520px;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="sf"] *, [data-ui="sf"] *::before, [data-ui="sf"] *::after { box-sizing: border-box; }
:where([data-ui="sf"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="sf"]) svg { display: block; flex: none; }
:where([data-ui="sf"]) :is(h2, p, dl, dd, ul, ol) { margin: 0; }
[data-ui="sf"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
/* 16px icons with thin ~1.1px lines */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
.ui-sf__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* A check that draws in */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__draw { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
/* A check that draws in */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__draw { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.ui-sf__draw path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ui-sf-draw var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-instant) forwards; }
/* ---- The steps on the tray: "1. Account" in a row, the current one in ink ---- */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__head { padding: var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-1); }
/* ---- The steps on top: a thin bar per step, a small uppercase label under it ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__head { padding: var(--tc-space-4) var(--tc-space-5) 0; }
.ui-sf__steps { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__list { display: grid; grid-template-columns: repeat(var(--tc-stepper-form-n), minmax(0, 1fr)); padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step { position: relative; display: grid; justify-items: center; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  min-width: 0;
  max-width: 100%;
  height: 26px;
  padding: 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-md);
  line-height: var(--tc-line-height-none);
  cursor: default;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__list { display: grid; grid-template-columns: repeat(var(--tc-stepper-form-n), minmax(0, 1fr)); gap: var(--tc-space-2); padding: 0; list-style: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step { position: relative; display: grid; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-btn {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: var(--tc-space-1-5);
  row-gap: var(--tc-space-1-5);
  min-width: 0;
  margin: -4px;
  padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-0-5);
  border-radius: var(--tc-radius-sm);
  text-align: left;
  cursor: default;
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
button.ui-sf__step-btn { cursor: pointer; }
button:where([data-look="standard"], [data-look="standard"] *).ui-sf__step-btn:hover { background: var(--tc-stepper-form-halo); }
/* The number, or the check once the step is done – same small slot, so the label never moves */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__mark > span { line-height: var(--tc-line-height-none); animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__mark .ui-sf__draw { width: 13px; height: 13px; stroke-width: 2.4; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step[data-state="current"] .ui-sf__mark { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step[data-state="done"] .ui-sf__mark { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step-label {
  overflow: hidden;
  max-width: 100%;
  font-size: var(--tc-font-size-sm);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-moderate) var(--tc-ease-standard);
}
button:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-btn:hover { background: var(--tc-fill-subtle); }
/* The bar fills from the left once the step is reached */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__bar { position: relative; grid-column: 1 / -1; height: 2px; overflow: hidden; border-radius: var(--tc-radius-2xs); background: var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__bar::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-accent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step:not([data-state="upcoming"]) .ui-sf__bar::after { transform: none; }
/* The number, or the check once the step is done – same small slot, so the label never moves */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: flex-start;
  min-width: 12px;
  height: 16px;
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__mark > span { animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__mark .ui-sf__draw { width: 12px; height: 12px; stroke-width: 2.4; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step[data-state="current"] .ui-sf__mark { color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step[data-state="done"] .ui-sf__mark { color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-label {
  overflow: hidden;
  min-width: 0;
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-caption-color);
  transition: color var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-sf__step[data-state="done"] .ui-sf__step-label { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step[data-state="current"] .ui-sf__step-label { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step[data-state="current"] .ui-sf__step-label { color: var(--tc-text-strong); }
button.ui-sf__step-btn:hover .ui-sf__step-label { color: var(--tc-text-primary); }
/* Compact header for narrow screens */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__compact { display: none; gap: var(--tc-space-2); padding: 0 var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__compact-text { display: flex; align-items: baseline; min-width: 0; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); white-space: nowrap; animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* Compact line for narrow screens: "STEP 2 OF 4 · TEAM" above the bars */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__compact { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__compact-text {
  display: flex;
  min-width: 0;
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  font-variant-numeric: tabular-nums;
  color: var(--tc-caption-color);
  white-space: nowrap;
  animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-sf__compact-dot { margin: 0 var(--tc-space-1-5); color: var(--tc-text-disabled); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__compact-title { overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
/* ---- The white card ---- */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__card { display: grid; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clips the sliding panes; the panes carry a little padding so focus rings aren't cut */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__viewport { position: relative; overflow: hidden; transition: height var(--tc-duration-slower) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane { padding: var(--tc-space-5) var(--tc-space-5) var(--tc-space-2); animation: ui-sf-enter var(--tc-duration-slower) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane[data-dir="-1"] { animation-name: ui-sf-enter-back; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__compact-title { overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-strong); }
/* ---- The step content: only this part clips and glides to each step's height ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__card { display: grid; min-width: 0; }
/* The panes carry a little padding so focus rings aren't cut */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__viewport { position: relative; overflow: hidden; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane { padding: var(--tc-space-5) var(--tc-space-5) var(--tc-space-5); animation: ui-sf-enter-clean var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane[data-dir="-1"] { animation-name: ui-sf-enter-back-clean; }
.ui-sf__pane[data-first] { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane[data-pane="leaving"] { position: absolute; top: 0; left: 0; right: 0; pointer-events: none; animation: ui-sf-leave var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane[data-pane="leaving"][data-dir="-1"] { animation-name: ui-sf-leave-back; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__heading { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); letter-spacing: -0.01em; color: var(--tc-text-primary); outline: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__desc { margin-top: var(--tc-space-1); color: var(--tc-text-muted); text-wrap: pretty; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__body { display: grid; gap: var(--tc-space-3-5); margin-top: var(--tc-space-4-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane[data-pane="leaving"] { position: absolute; top: 0; left: 0; right: 0; pointer-events: none; animation: ui-sf-leave-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane[data-pane="leaving"][data-dir="-1"] { animation-name: ui-sf-leave-back-clean; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__heading { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); outline: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__desc { color: var(--tc-text-secondary); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__body { display: grid; gap: var(--tc-space-4); margin-top: var(--tc-space-4); }
/* Fields */
.ui-sf__field { display: grid; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__label { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); margin-bottom: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__label { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); margin: 0 0 var(--tc-space-1-5) var(--tc-space-0-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-sf__optional { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-sf__control { min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: var(--tc-field-h);
  border-radius: var(--tc-field-radius);
}
/* The field recipe: a control border (≥ 3:1) at rest, the focus ring + halo on the wrapper while typing */
.ui-sf__input, .ui-sf__tags {
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard);
  cursor: text;
}
.ui-sf__input:hover, .ui-sf__tags:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-sf__input:focus-within, .ui-sf__tags:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-sf__input[data-invalid], .ui-sf__tags[data-invalid] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-sf__input[data-invalid]:focus-within, .ui-sf__tags[data-invalid]:focus-within { box-shadow: var(--tc-field-shadow-invalid), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
/* Focus never lands under the sticky footer (2.4.11) */
.ui-sf__card :is(input, textarea, select, button) { scroll-margin: 16px 0 88px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags-input {
  flex: 1;
  min-width: 0;
  height: var(--tc-field-h);
  padding: 0 var(--tc-field-px);
  border: 0;
  /* The wrapper shows focus (:focus-within) */
  outline: none;
  background: none;
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags {
  display: flex;
  align-items: center;
  min-width: 0;
  height: var(--tc-field-h);
  border-radius: var(--tc-field-radius);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input {
  flex: 1;
  min-width: 0;
  height: var(--tc-field-h);
  margin: 0;
  padding: 0 var(--tc-field-px);
  border: 0;
  /* The wrapper shows focus (:focus-within) */
  outline: none;
  background: none;
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
}
.ui-sf__input input::placeholder, .ui-sf__tags-input::placeholder { color: var(--tc-text-placeholder); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__prefix { flex: none; padding-left: var(--tc-field-px); font-size: var(--tc-field-font-size); color: var(--tc-text-muted); white-space: nowrap; user-select: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__prefix + input { padding-left: 1px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__prefix { flex: none; padding-left: var(--tc-field-px); color: var(--tc-text-muted); white-space: nowrap; user-select: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__prefix + input { padding-left: 0; }
/* Message and hint fold open and closed */
.ui-sf__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-sf__fold[data-open] { grid-template-rows: 1fr; opacity: 1; }
.ui-sf__fold > div { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__msg,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__hint { padding-top: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); text-wrap: pretty; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__msg { color: var(--tc-status-danger-solid); animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__msg,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__hint { padding: var(--tc-space-1-5) 0 0 var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__msg { color: var(--tc-status-danger-solid); animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-sf__hint { color: var(--tc-text-muted); }
/* Email chips */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags { flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-1); }
/* Email chips: one line – the chips scroll sideways, the text field stays at the end */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags { gap: var(--tc-space-1); padding: 0 var(--tc-space-1); overflow-x: auto; overflow-y: hidden; scrollbar-width: none; overscroll-behavior-x: contain; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags::-webkit-scrollbar { display: none; }
.ui-sf__chips { display: contents; padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  min-width: 0;
  max-width: 100%;
  height: 28px;
  padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2-5);
  overflow: hidden;
  border-radius: var(--tc-radius-md);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-primary);
  white-space: nowrap;
  animation: ui-sf-chip var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-0-5);
  max-width: 220px;
  height: 24px;
  padding: 0 var(--tc-space-1) 0 var(--tc-space-2);
  overflow: hidden;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-primary);
  white-space: nowrap;
  animation: ui-sf-chip var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-sf__chip[data-leaving] { pointer-events: none; }
.ui-sf__chip-text { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip-x { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip-x .ui-sf__glyph { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip-x:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
/* A 24px target drawn as an 18px square: the hover fill is inset, the margins keep the chip's size */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x { position: relative; display: grid; place-items: center; flex: none; width: 24px; height: 24px; margin: 0 -3px; color: var(--tc-icon-muted); transition: color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x::before { content: ""; position: absolute; inset: 3px; border-radius: var(--tc-radius-xs); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x .ui-sf__glyph { position: relative; width: 12px; height: 12px; stroke-width: 1.9; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x:hover { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x:hover::before { background: var(--tc-fill-default); }
.ui-sf__chip[data-leaving] .ui-sf__chip-x, .ui-sf__chip[data-leaving] .ui-sf__chip-x::before { background: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags-input { flex: 1 1 140px; height: 28px; padding: 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input { flex: 1 0 140px; height: 24px; padding: 0 var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input:first-child { padding-left: var(--tc-space-1-5); }
/* Selectable cards with a ring that glides */
.ui-sf__choices { position: relative; display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__ring {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  border-radius: var(--tc-radius-xl);
  box-shadow: inset 0 0 0 1.5px var(--tc-accent), 0 0 0 3px var(--tc-accent-subtle);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-slower) var(--tc-ease-move), width var(--tc-duration-slower) var(--tc-ease-move), height var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice {
  position: relative;
  display: grid;
  align-content: start;
  gap: var(--tc-space-0-5);
  min-width: 0;
  padding: var(--tc-space-3);
  border-radius: var(--tc-radius-xl);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  text-align: left;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice:hover { box-shadow: inset 0 0 0 1px var(--tc-border-control-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice[aria-checked="true"] { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 1px transparent; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__ring {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  border-radius: var(--tc-radius-md);
  box-shadow: 0 0 0 0.5px var(--tc-border-selected);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move), width var(--tc-duration-moderate) var(--tc-ease-move), height var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice {
  position: relative;
  display: grid;
  align-content: start;
  gap: var(--tc-space-0-5);
  min-width: 0;
  padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  text-align: left;
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice[aria-checked="true"] { background: var(--tc-accent-subtle); }
.ui-sf__choice:focus-visible { outline-offset: 3px; }
.ui-sf__choice-top { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-title { overflow: hidden; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
/* Badge: the pill recipe */
.ui-sf__badge { display: inline-flex; align-items: center; flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__badge { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__radio { position: relative; flex: none; width: 16px; height: 16px; margin-left: auto; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1.5px var(--tc-border-control); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__radio::after { content: ""; position: absolute; inset: 4px; border-radius: var(--tc-radius-full); background: var(--tc-accent); transform: scale(0); transition: transform var(--tc-duration-slow) var(--tc-ease-spring); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice[aria-checked="true"] .ui-sf__radio { box-shadow: inset 0 0 0 1.5px var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-title { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__badge { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__radio { position: relative; flex: none; width: 14px; height: 14px; margin-left: auto; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1px var(--tc-border-control); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__radio::after { content: ""; position: absolute; inset: 3.5px; border-radius: var(--tc-radius-full); background: var(--tc-accent); transform: scale(0); transition: transform var(--tc-duration-moderate) var(--tc-ease-spring); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice[aria-checked="true"] .ui-sf__radio { box-shadow: inset 0 0 0 1px var(--tc-accent); }
.ui-sf__choice[aria-checked="true"] .ui-sf__radio::after { transform: scale(1); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-aside { font-size: var(--tc-font-size-md); font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-desc { margin-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-wrap: pretty; }
/* Review */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review { display: grid; border-radius: var(--tc-radius-xl); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review-row { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; align-items: baseline; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-3) var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review-row + .ui-sf__review-row { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review dt { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-aside { font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-desc { margin-top: var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); text-wrap: pretty; }
/* Review: rows under hairlines */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review { display: grid; border-radius: var(--tc-radius-md); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review-row { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; align-items: baseline; gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review-row + .ui-sf__review-row { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review dt { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
.ui-sf__review dd { min-width: 0; color: var(--tc-text-primary); overflow-wrap: break-word; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__edit { height: var(--tc-control-h-sm); margin: -5px 0; padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__edit:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Success */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success { display: grid; justify-items: center; padding: var(--tc-space-5) 0 var(--tc-space-3-5); text-align: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success-check {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: var(--tc-space-3-5);
  border-radius: var(--tc-radius-full);
  background: var(--tc-text-primary);
  color: var(--tc-text-on-inverse);
  box-shadow: 0 0 0 6px var(--tc-stepper-form-halo);
  animation: ui-sf-pop var(--tc-duration-slowest) var(--tc-ease-spring) var(--tc-duration-quick) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success-check .ui-sf__draw { width: 20px; height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__edit { height: var(--tc-control-h-sm); margin: -2px 0; padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__edit:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Success */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success { display: grid; justify-items: center; padding: var(--tc-space-4) 0 var(--tc-space-2); text-align: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success-check {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: var(--tc-space-3);
  border-radius: var(--tc-radius-full);
  background: var(--tc-status-success-bg);
  color: var(--tc-status-success-fg);
  animation: ui-sf-pop var(--tc-duration-slowest) var(--tc-ease-spring) var(--tc-duration-quick) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success-check .ui-sf__draw { width: 18px; height: 18px; stroke-width: 2; }
.ui-sf__success-check .ui-sf__draw path { animation-delay: var(--tc-duration-slow); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success .ui-sf__heading { animation: ui-sf-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-base) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success .ui-sf__desc { max-width: 40ch; text-wrap: balance; animation: ui-sf-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-moderate) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--tc-space-2); margin-top: var(--tc-space-4); animation: ui-sf-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-slow) both; }
/* ---- Footer: sticks to the bottom of the screen in long pages ---- */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__foot-fold { position: sticky; bottom: 0; z-index: 3; display: grid; grid-template-rows: 1fr; border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: var(--tc-surface-on-tray); transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success .ui-sf__heading { animation: ui-sf-in-clean var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-base) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success .ui-sf__desc { max-width: 40ch; text-wrap: balance; animation: ui-sf-in-clean var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-moderate) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--tc-space-2); margin-top: var(--tc-space-4); animation: ui-sf-in-clean var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-slow) both; }
/* ---- The last row of the card: Back and Continue under a hairline; sticks to the bottom in long pages ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot-fold { position: sticky; bottom: 0; z-index: 3; display: grid; grid-template-rows: 1fr; border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: var(--tc-surface-raised); transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-sf__foot-fold[data-hidden] { grid-template-rows: 0fr; opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__foot { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: 0; overflow: hidden; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
/* Back and Continue: Button's recipe (control + action pattern tokens) */
.ui-sf__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn {
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-move), visibility var(--tc-duration-base);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-ghost { gap: var(--tc-space-1); padding: 0 var(--tc-control-px-md) 0 8px; color: var(--tc-action-ghost-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot { display: flex; align-items: center; gap: var(--tc-space-3); min-height: 0; overflow: hidden; padding: 0 var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
/* The row's height lives on a pseudo spacer so the fold can still close it to 0 */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot::before { content: ""; flex: none; width: 0; height: 48px; margin-right: -12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn {
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-move), visibility var(--tc-duration-base);
}
/* Back: Button's secondary recipe */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-ghost { gap: var(--tc-space-1-5); padding: 0 var(--tc-control-px-md) 0 8px; background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-ghost .ui-sf__glyph { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-ghost:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-sf__btn-ghost[data-hidden] { opacity: 0; visibility: hidden; }
/* Continue: Button's primary recipe – flat ink in both looks */
.ui-sf__btn-primary { margin-left: auto; overflow: hidden; background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-sf__btn-primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-sf__btn-primary:active { background: var(--tc-action-primary-bg-active); }
.ui-sf__btn:active { transform: scale(0.97); }
/* Not ready yet: dimmed, but still answers a press with the messages */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-primary[aria-disabled="true"] { opacity: 0.4; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-primary[data-busy] { opacity: 0.75; cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-inner { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); padding: 0 var(--tc-control-px-md); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-label { animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__spinner { width: 13px; height: 13px; border-radius: var(--tc-radius-full); border: 1.8px solid currentColor; border-right-color: transparent; animation: ui-sf-spin var(--tc-duration-reveal) linear infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__submit-error { min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-solid); animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
@keyframes ui-sf-in { from { opacity: 0; transform: translateY(4px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-sf-enter { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-enter-back { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-leave { to { opacity: 0; transform: translateX(-28px); } }
@keyframes ui-sf-leave-back { to { opacity: 0; transform: translateX(28px); } }
/* Not ready yet: dimmed, but still answers a press with the messages */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-primary[aria-disabled="true"] { opacity: 0.35; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-primary[data-busy] { opacity: 0.7; cursor: progress; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-inner { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); padding: 0 var(--tc-control-px-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-label { animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__spinner { width: 12px; height: 12px; border-radius: var(--tc-radius-full); border: 1.5px solid currentColor; border-right-color: transparent; animation: ui-sf-spin var(--tc-duration-reveal) linear infinite; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__submit-error { min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-solid); animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
@keyframes ui-sf-in-clean { from { opacity: 0; transform: translateY(3px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-sf-enter-clean { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-enter-back-clean { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-leave-clean { to { opacity: 0; transform: translateX(-24px); } }
@keyframes ui-sf-leave-back-clean { to { opacity: 0; transform: translateX(24px); } }
@keyframes ui-sf-draw { to { stroke-dashoffset: 0; } }
@keyframes ui-sf-pop { 0% { opacity: 0; transform: scale(0.4); } 60% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes ui-sf-chip { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-spin { to { transform: rotate(360deg); } }
/* Narrow (phones): the compact header, cards as rows, stacked review rows, bigger buttons */
@container (max-width: 420px) {
:where([data-look="standard"], [data-look="standard"] *).ui-sf__head { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__steps:not(:focus-within) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__compact { display: grid; }
/* A jump button has keyboard focus: the list comes back into view in place of the compact line */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__head:has(.ui-sf__steps:focus-within) .ui-sf__compact { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane { padding: var(--tc-space-4-5) var(--tc-space-4) var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__foot { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn { height: var(--tc-control-h-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choices { grid-template-columns: minmax(0, 1fr); grid-auto-flow: row; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice { grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-top { grid-column: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-aside { grid-column: 2; grid-row: 1; align-self: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-desc { grid-column: 1 / -1; margin-top: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__radio { order: -1; margin-left: 0; margin-right: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review-row { grid-template-columns: minmax(0, 1fr) auto; row-gap: var(--tc-space-0-5); padding-left: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review dt { grid-column: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review dd { grid-column: 1; grid-row: 2; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__edit { grid-column: 2; grid-row: 1 / span 2; align-self: center; margin: 0; }
}
/* Touch screens: 16px fields (no zoom on iOS) and 40px targets */
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags-input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__prefix { font-size: var(--tc-font-size-xl); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags { min-height: 44px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input input { height: 42px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip { height: 32px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip-x { width: 30px; height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn { height: var(--tc-control-h-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__edit { height: 36px; padding: 0 var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step-btn { padding: var(--tc-space-1); margin: -4px 0; }
}
/* Narrow (phones): the compact line over the bars, cards as rows, stacked review rows */
@container (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-sf__head { padding: var(--tc-space-3-5) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__compact { display: flex; margin-bottom: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-btn { row-gap: 0; padding-bottom: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__mark,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot { padding: 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choices { grid-template-columns: minmax(0, 1fr); grid-auto-flow: row; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice { grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-top { grid-column: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-aside { grid-column: 2; grid-row: 1; align-self: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-desc { grid-column: 1 / -1; margin-top: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__radio { order: -1; margin-left: 0; margin-right: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review-row { grid-template-columns: minmax(0, 1fr) auto; row-gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review dt { grid-column: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review dd { grid-column: 1; grid-row: 2; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__edit { grid-column: 2; grid-row: 1 / span 2; align-self: center; margin: 0; }
}
/* Touch screens: 16px fields (no zoom on iOS) and taller targets */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__prefix { font-size: var(--tc-font-size-xl); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input input { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip { height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x { width: 30px; height: 30px; margin: 0 -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input { height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot::before { height: 56px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__edit { height: 34px; padding: 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-btn { padding-top: var(--tc-space-2-5); padding-bottom: var(--tc-space-2); margin: -10px -4px -8px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="sf"] *, [data-ui="sf"] *::before, [data-ui="sf"] *::after { animation-duration: 1ms !important; animation-delay: 0ms !important; transition: none !important; }
}
`;
}

/* ---------- Building blocks ---------- */

/** What every building block shares: the form's CSS, and the look of the form it sits in */
abstract class TcStepperBlock extends TcElement {
  override connectedCallback() {
    adoptStyles("ui-sf", TcStepperForm.css, this.ownerDocument);
    super.connectedCallback();
  }
  /** @internal The look: `look`, else the form's, else the provider's */
  override get resolvedLook(): Look {
    return this.look ?? formLook(this) ?? this.contextLook ?? "standard";
  }
  /** @internal The form this block sits in */
  get form(): TcStepperForm | null {
    return this.closest("tc-stepper-form");
  }
  /** @internal The field this block sits in */
  get field(): TcStepperField | null {
    return this.closest("tc-stepper-field");
  }
}

/** How a field wires its control: the id its label points at, whether it's invalid, and what describes it */
type FieldWiring = { id: string; invalid: boolean; describedBy?: string };

/**
 * A label, the control and an inline message that folds in – the control shakes when Continue finds a problem.
 * Put the control (a tc-stepper-input, tc-stepper-tags …) inside; it stays where you put it, between the label and
 * the messages.
 * @tag tc-stepper-field
 */
export class TcStepperField extends TcStepperBlock {
  static override ui = "sf-field";

  /** Matches the key in the step's validate result */
  @property() accessor name = "";
  /** The field's label, tied to its control */
  @property() accessor label = "";
  /** A hint under the control: text, or an element (cloned) */
  @property() accessor hint: string | Element | undefined = undefined;
  /** Shows “Optional” after the label */
  @property({ type: Boolean }) accessor optional = false;

  @state() private accessor local: string | null = null;
  private lastMessage = "";
  private readonly uid = nextUid("field");
  private labelEl?: HTMLLabelElement;
  private lastShakes = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add("ui-sf__field");
    // The label goes first, before the control the page put inside; the messages render after it
    this.labelEl ??= Object.assign(document.createElement("label"), { className: "ui-sf__label" });
    if (this.firstChild !== this.labelEl) this.insertBefore(this.labelEl, this.firstChild);
  }

  private get message() {
    const form = this.form;
    const current = this.closest("[data-pane]")?.getAttribute("data-pane") === "current";
    return (current ? form?.errorsShown[this.name] : undefined) ?? this.local ?? "";
  }

  /** @internal The id, state and description for the control */
  get wiring(): FieldWiring {
    const invalid = !!this.message;
    return { id: this.uid, invalid, describedBy: invalid ? `${this.uid}-msg` : this.hint ? `${this.uid}-hint` : undefined };
  }

  /** @internal A building block's own finding (an entry that isn't an email yet); null clears it */
  flag(message: string | null) {
    this.local = message;
    this.form?.report(this.name, message);
    if (message) {
      this.shakeControl();
      this.form?.say(message);
    }
  }

  private shakeControl() {
    [...this.children].filter((c) => c !== this.labelEl && !c.classList.contains("ui-sf__fold")).forEach(shake);
  }

  protected override updated() {
    const message = this.message;
    const invalid = !!message;
    this.toggleAttribute("data-invalid", invalid);
    // A failed Continue shakes the control of every field with a problem
    const current = this.closest("[data-pane]")?.getAttribute("data-pane") === "current";
    const shakes = current ? this.form?.shakes ?? 0 : 0;
    if (shakes !== this.lastShakes) {
      this.lastShakes = shakes;
      if (shakes && message) this.shakeControl();
    }
    if (this.labelEl) {
      this.labelEl.htmlFor = this.uid;
      litRender(html`${this.label}${this.optional ? html`<span class="ui-sf__optional">Optional</span>` : nothing}`, this.labelEl);
    }
    this.querySelectorAll<TcElement>("tc-stepper-input, tc-stepper-tags").forEach((el) => el.requestUpdate());
  }

  protected override render() {
    const message = this.message;
    if (message && message !== this.lastMessage) this.lastMessage = message;
    const invalid = !!message;
    // Keeps the last text while the message folds away
    const shown = message || this.lastMessage;
    const hint = this.hint;
    return html`<div class="ui-sf__fold" ?data-open=${invalid}>
        <div>${keyed(shown, html`<p class="ui-sf__msg" id=${`${this.uid}-msg`}>${shown}</p>`)}</div>
      </div>
      ${hint
        ? html`<div class="ui-sf__fold" ?data-open=${!invalid}>
            <div><p class="ui-sf__hint" id=${`${this.uid}-hint`}>${typeof hint === "string" ? hint : hint.cloneNode(true)}</p></div>
          </div>`
        : nothing}`;
  }
}

/**
 * A text field wired to its tc-stepper-field – label, message and aria come from there. Put a native <input> inside;
 * every attribute you give it stays yours.
 * @tag tc-stepper-input
 */
export class TcStepperInput extends TcStepperBlock {
  static override ui = "sf-input";

  /** Fixed text before the value, e.g. "acme.com/" */
  @property({ attribute: "prefix" }) accessor prefixText = "";
  /** More ids that describe the input, after the field's message or hint */
  @property() accessor describedby = "";
  /** The input's id when it isn't in a field */
  @property({ attribute: "control-id" }) accessor controlId = "";
  /** Marks the input invalid on its own (the field's verdict wins) */
  @property({ type: Boolean, attribute: "control-invalid" }) accessor controlInvalid = false;

  private prefixEl?: HTMLSpanElement;

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add("ui-sf__input");
  }

  protected override updated() {
    const field = this.field?.wiring;
    this.toggleAttribute("data-invalid", !!field?.invalid);
    // The prefix goes before the input the page put inside
    if (this.prefixText) {
      this.prefixEl ??= Object.assign(document.createElement("span"), { className: "ui-sf__prefix" });
      this.prefixEl.setAttribute("aria-hidden", "true");
      this.prefixEl.textContent = this.prefixText;
      if (this.firstChild !== this.prefixEl) this.insertBefore(this.prefixEl, this.firstChild);
    } else this.prefixEl?.remove();
    // The field's wiring wins, so its label and message stay attached; your own description is kept too
    const input = this.querySelector("input");
    if (!input) return;
    const id = field?.id ?? this.controlId;
    if (id) input.id = id;
    const invalid = !!field?.invalid || this.controlInvalid;
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    const described = [field?.describedBy, this.describedby].filter(Boolean).join(" ");
    if (described) input.setAttribute("aria-describedby", described);
    else input.removeAttribute("aria-describedby");
  }

  protected override render() {
    return nothing;
  }
}

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
const emailCheck = (entry: string, list: string[]) => (!EMAIL.test(entry) ? "That doesn't look like an email address" : list.includes(entry) ? "Already on the list" : null);

/**
 * Entries as chips – add with Enter, comma or by pasting a list, remove with × or Backspace. Defaults to email checks.
 * Form-associated: the entries are submitted comma-separated under `name`.
 * @tag tc-stepper-tags
 * @fires tc-value-change - Entries were added or removed; detail `{ value: string[] }`. Cancelable.
 */
export class TcStepperTags extends TcStepperBlock {
  static override ui = "sf-tags";
  static formAssociated = true;

  /** The entries added so far */
  @property({ attribute: false }) accessor value: string[] = [];
  /** Placeholder while there are no entries – then it reads “Add another” */
  @property() accessor placeholder = "name@company.com";
  /** Returns a message when an entry can't be added */
  @property({ attribute: false }) accessor validate: (entry: string, list: string[]) => string | null = emailCheck;
  /** Largest number of entries */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** Name for form submission: the entries, comma-separated */
  @property({ reflect: true }) accessor name = "";
  /** Turns off typing and removing entries */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Marks the field as required for assistive tech – checking it is up to the step's validate */
  @property({ type: Boolean }) accessor required = false;
  /** The input's autocomplete – "off" by default, since the entries are usually other people's addresses */
  @property() accessor autocomplete = "off";

  @state() private accessor draft = "";
  @state() private accessor leaving: string[] = [];
  @state() private accessor formDisabled = false;

  private readonly internals: ElementInternals;
  private latest: string[] = [];
  private count = 0;
  private initialValue: string[] | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.addEventListener("click", (e) => e.target === this && this.input?.focus());
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add("ui-sf__tags");
  }

  formResetCallback() {
    this.setValue([...(this.initialValue ?? [])]);
    this.draft = "";
  }
  formDisabledCallback(disabled: boolean) {
    // Called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get input() {
    return this.querySelector<HTMLInputElement>(".ui-sf__tags-input");
  }
  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  private setValue(next: string[]) {
    this.latest = next;
    if (this.emit("tc-value-change", { value: next }, { cancelable: true })) this.value = next;
  }

  /** Adds every entry in the text; keeps the ones that fail in the field and says why */
  private commit(text: string) {
    const parts = text
      .split(/[\s,;]+/)
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    if (!parts.length) return true;
    const next = [...this.latest];
    const rest: string[] = [];
    let problem: string | null = null;
    for (const p of parts) {
      const m = this.max !== undefined && next.length >= this.max ? `Up to ${this.max}` : this.validate(p, next);
      if (m) {
        problem ??= m;
        rest.push(p);
      } else next.push(p);
    }
    if (next.length !== this.latest.length) this.setValue(next);
    this.draft = rest.join(", ");
    this.field?.flag(problem);
    return !problem;
  }

  private removeEntry(entry: string) {
    if (this.leaving.includes(entry)) return;
    this.leaving = [...this.leaving, entry];
    const el = this.querySelector<HTMLElement>(`[data-entry="${CSS.escape(entry)}"]`);
    // Focus on this chip's × moves at once to the next chip's ×, else the previous one, else the text field
    const sibling = (dir: "next" | "prev") => {
      let li = el?.[dir === "next" ? "nextElementSibling" : "previousElementSibling"];
      while (li && this.leaving.includes((li as HTMLElement).dataset.entry ?? "")) li = li[dir === "next" ? "nextElementSibling" : "previousElementSibling"];
      return li?.querySelector("button");
    };
    rescueFocus(el, [sibling("next"), sibling("prev"), this.input]);
    const finish = () => {
      this.leaving = this.leaving.filter((x) => x !== entry);
      this.setValue(this.latest.filter((x) => x !== entry));
    };
    // A short flash, then the chip folds away and the others close the gap
    if (el && el.animate && !reducedMotion()) {
      el.animate(
        [
          { width: `${el.offsetWidth}px`, marginRight: "0px", opacity: 1, transform: "none" },
          { width: "0px", marginRight: "-6px", opacity: 0, transform: "scale(0.85)" },
        ],
        { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
      ).onfinish = finish;
    } else finish();
  }

  private onKeyDown(e: KeyboardEvent) {
    // Keys that confirm an IME composition aren't ours
    if (e.isComposing) return;
    if ((e.key === "Enter" && this.draft.trim()) || e.key === "," || e.key === ";") {
      e.preventDefault();
      this.commit(this.draft);
    } else if (e.key === "Backspace" && !this.draft && this.value.length) {
      e.preventDefault();
      this.removeEntry(this.value[this.value.length - 1]);
    }
    // Enter in an empty field falls through to the form: Continue
  }

  private onPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData("text") ?? "";
    if (/[\s,;]/.test(text.trim())) {
      e.preventDefault();
      this.commit(`${this.draft} ${text}`);
    }
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.latest = this.value;
    if (this.initialValue === null) this.initialValue = [...this.value];
  }

  protected override updated() {
    this.toggleAttribute("data-invalid", !!this.field?.wiring.invalid);
    this.toggleAttribute("data-disabled", this.isDisabled);
    // Clean: the field stays one line – chips scroll sideways, and a new one scrolls into view next to the text
    if (this.resolvedLook === "clean" && this.value.length > this.count) this.scrollTo?.({ left: this.scrollWidth, behavior: reducedMotion() ? "auto" : "smooth" });
    this.count = this.value.length;
    if (typeof this.internals.setFormValue === "function") this.internals.setFormValue(this.name && !this.isDisabled ? this.value.join(",") : null);
  }

  protected override render() {
    const field = this.field?.wiring;
    const disabled = this.isDisabled;
    return html`${this.value.length > 0
        ? html`<ul class="ui-sf__chips" aria-label="Added">
            ${repeat(
              this.value,
              (entry) => entry,
              (entry) => html`<li class="ui-sf__chip" data-entry=${entry} ?data-leaving=${this.leaving.includes(entry)}>
                <span class="ui-sf__chip-text" title=${entry}>${entry}</span>
                <button type="button" class="ui-sf__chip-x" aria-label=${`Remove ${entry}`} ?disabled=${disabled} @click=${() => this.removeEntry(entry)}>${glyph(icons.close)}</button>
              </li>`,
            )}
          </ul>`
        : nothing}<input
        id=${ifDefined(field?.id)}
        type="email"
        inputmode="email"
        autocomplete=${this.autocomplete as "off"}
        spellcheck="false"
        class="ui-sf__tags-input"
        placeholder=${this.value.length ? "Add another" : this.placeholder}
        .value=${live(this.draft)}
        aria-invalid=${ifDefined(field?.invalid ? "true" : undefined)}
        aria-describedby=${ifDefined(field?.describedBy)}
        aria-required=${ifDefined(this.required ? "true" : undefined)}
        ?disabled=${disabled}
        @input=${(e: InputEvent) => {
          this.draft = (e.target as HTMLInputElement).value;
          this.field?.flag(null);
        }}
        @keydown=${this.onKeyDown}
        @paste=${this.onPaste}
        @blur=${() => this.draft.trim() && this.commit(this.draft)}
      />`;
  }
}

export type StepperChoice = {
  value: string;
  title: string;
  /** Shown on the right of the title, e.g. a price: text, or an element (cloned) */
  aside?: string | Element;
  description?: string | Element;
  /** A small label, e.g. "Popular" */
  badge?: string;
};

const content = (v: string | Element) => (typeof v === "string" ? v : v.cloneNode(true));

/**
 * Selectable cards – a ring glides to the chosen one. Arrow keys move, Enter picks and continues. Form-associated: the
 * chosen value is submitted under `name`.
 * @tag tc-stepper-choices
 * @fires tc-value-change - Another card was chosen; detail `{ value: string }`. Cancelable.
 */
export class TcStepperChoices extends TcStepperBlock {
  static override ui = "sf-choices";
  static formAssociated = true;

  /** The chosen option's value; empty when none is chosen */
  @property() accessor value = "";
  /** The cards to choose from */
  @property({ attribute: false }) accessor options: StepperChoice[] = [];
  /** Name of the group for screen readers */
  @property() accessor label = "";
  /** Name for form submission */
  @property({ reflect: true }) accessor name = "";
  /** Turns off choosing */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Marks the group as required for assistive tech – checking it is up to the step's validate */
  @property({ type: Boolean }) accessor required = false;

  @state() private accessor formDisabled = false;
  private readonly internals: ElementInternals;
  private ro?: ResizeObserver;
  private initialValue: string | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.addEventListener("keydown", (e) => this.onKeyDown(e));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add("ui-sf__choices");
    this.setAttribute("role", "radiogroup");
    // Columns turn into rows on narrow screens – the ring follows
    if (typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(() => glide(this, this.ring, '[aria-checked="true"]'));
      this.ro.observe(this);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
  }

  formResetCallback() {
    this.pick(this.initialValue ?? "");
  }
  formDisabledCallback(disabled: boolean) {
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get ring() {
    return this.querySelector<HTMLElement>(".ui-sf__ring");
  }
  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  private pick(value: string) {
    if (value === this.value) return;
    if (this.emit("tc-value-change", { value }, { cancelable: true })) this.value = value;
  }

  private onKeyDown(e: KeyboardEvent) {
    if (this.isDisabled || e.isComposing) return;
    const options = this.options;
    const at = options.findIndex((o) => o.value === this.value);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (step) {
      e.preventDefault();
      const next = options[(at + step + options.length) % options.length];
      this.pick(next.value);
      this.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.closest("form")?.requestSubmit();
    }
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.initialValue === null) this.initialValue = this.value;
  }

  protected override updated(changed: PropertyValues<this>) {
    this.setAttribute("aria-label", this.label);
    if (this.required) this.setAttribute("aria-required", "true");
    else this.removeAttribute("aria-required");
    if (this.isDisabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    // The ring moves when the choice or the options change – not on every update
    if (changed.has("value") || changed.has("options")) glide(this, this.ring, '[aria-checked="true"]');
    if (typeof this.internals.setFormValue === "function") this.internals.setFormValue(this.name && !this.isDisabled ? this.value : null);
  }

  protected override render() {
    const disabled = this.isDisabled;
    return html`<span class="ui-sf__ring" aria-hidden="true"></span>${repeat(
        this.options,
        (o) => o.value,
        (o) => {
          const on = o.value === this.value;
          return html`<button
            type="button"
            role="radio"
            aria-checked=${on ? "true" : "false"}
            tabindex=${on ? 0 : -1}
            data-value=${o.value}
            class="ui-sf__choice"
            ?disabled=${disabled}
            @click=${() => this.pick(o.value)}
          >
            <span class="ui-sf__choice-top"
              ><span class="ui-sf__choice-title">${o.title}</span>${o.badge ? html`<span class="ui-sf__badge">${o.badge}</span>` : nothing}<span
                class="ui-sf__radio"
                aria-hidden="true"
              ></span></span
            >${o.aside ? html`<span class="ui-sf__choice-aside">${content(o.aside)}</span>` : nothing}${o.description
              ? html`<span class="ui-sf__choice-desc">${content(o.description)}</span>`
              : nothing}
          </button>`;
        },
      )}`;
  }
}

export type StepperReviewRow = {
  label: string;
  /** Text, or an element (cloned) */
  value: string | Element;
  /** Id of the step that sets it – shows an Edit link (with `editable`) */
  step?: string;
};

/**
 * A summary of what was entered, each row with an Edit link back to its step.
 * @tag tc-stepper-review
 * @fires tc-edit - An Edit link was pressed; detail `{ step: string }` – pass it to the step context's goTo.
 */
export class TcStepperReview extends TcStepperBlock {
  static override ui = "sf-review";

  /** The rows: a label, the value entered and the step that sets it */
  @property({ attribute: false }) accessor rows: StepperReviewRow[] = [];
  /** Shows the Edit links */
  @property({ type: Boolean }) accessor editable = false;

  private edit(step: string) {
    this.emit("tc-edit", { step });
  }

  protected override render() {
    return html`<dl class="ui-sf__review">
      ${repeat(
        this.rows,
        (r) => r.label,
        (r) => html`<div class="ui-sf__review-row">
          <dt>${r.label}</dt>
          <dd>${content(r.value)}</dd>
          ${r.step && this.editable ? html`<button type="button" class="ui-sf__edit" aria-label=${`Edit ${r.label.toLowerCase()}`} @click=${() => this.edit(r.step!)}>Edit</button>` : nothing}
        </div>`,
      )}
    </dl>`;
  }
}

/**
 * The success state: a check pops in, a heading and a short line; anything you put inside follows them (actions).
 * @tag tc-stepper-success
 */
export class TcStepperSuccess extends TcStepperBlock {
  static override ui = "sf-success";

  /** The success heading, e.g. “All set” */
  @property() accessor heading = "";
  /** Text, or an element (cloned) */
  @property() accessor description: string | Element | undefined = undefined;

  protected override createRenderRoot() {
    // Its own parts go before what the page put inside
    this.renderOptions.renderBefore ??= this.firstChild;
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add("ui-sf__success");
  }

  protected override render() {
    return html`<span class="ui-sf__success-check">${drawCheck()}</span>
      <h2 class="ui-sf__heading" tabindex="-1">${this.heading}</h2>
      ${this.description ? html`<p class="ui-sf__desc">${content(this.description)}</p>` : nothing}`;
  }
}

for (const [tag, cls] of [
  ["tc-stepper-form", TcStepperForm],
  ["tc-stepper-field", TcStepperField],
  ["tc-stepper-input", TcStepperInput],
  ["tc-stepper-tags", TcStepperTags],
  ["tc-stepper-choices", TcStepperChoices],
  ["tc-stepper-review", TcStepperReview],
  ["tc-stepper-success", TcStepperSuccess],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
}

declare global {
  interface HTMLElementTagNameMap {
    "tc-stepper-form": TcStepperForm;
    "tc-stepper-field": TcStepperField;
    "tc-stepper-input": TcStepperInput;
    "tc-stepper-tags": TcStepperTags;
    "tc-stepper-choices": TcStepperChoices;
    "tc-stepper-review": TcStepperReview;
    "tc-stepper-success": TcStepperSuccess;
  }
}
