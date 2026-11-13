import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-recipe-card> – a recipe an assistant wrote, ready to cook from: the title, a line about it, prep and cook time,
 * then the ingredients as a checklist and the method as numbered steps.
 *   · the servings stepper scales every quantity, shown as cooks write them (½, 1⅓, 250 g), not 0.333
 *   · Metric / Imperial converts weights, volumes and oven temperatures in the steps (g ↔ oz, ml ↔ cups, °C ↔ °F);
 *     teaspoons, tablespoons and counts stay as they are
 *   · a step that names a time ("Simmer for 20 minutes") gets a timer: Start, Pause, Resume and Reset, a live
 *     countdown, and a polite announcement when it's done. Timers count whole seconds with setInterval – no clock
 *     reads – and `tick-ms` speeds them up for tests and demos
 *   · the current step is marked (aria-current="step"); pick one by its number, or with Previous and Next
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row. Wide, the
 * ingredients sit beside the method; narrow, above it.
 *
 *   <tc-recipe-card heading="Vegetable curry" base-servings="4" .ingredients=${[…]} .steps=${[…]}></tc-recipe-card>
 */

export type RecipeUnits = "metric" | "imperial";
/** Units a quantity can carry. Spoons and counts ("" or a word like "clove") don't convert */
export type RecipeUnit = "g" | "kg" | "ml" | "l" | "oz" | "lb" | "fl oz" | "cup" | "tsp" | "tbsp" | (string & {});
export type RecipeIngredient = {
  /** Stable id; defaults to the ingredient's position */
  id?: string;
  /** How much, for `baseServings`; leave out for "to taste" */
  quantity?: number;
  unit?: RecipeUnit;
  name: string;
  /** A short note after the name: "finely chopped" */
  note?: string;
};
export type RecipeStep = string | { text: string; /** The timer's length in seconds, when the text names none or another */ timer?: number };

/** Details of the events */
export type RecipeServingsChange = { servings: number };
export type RecipeUnitsChange = { units: RecipeUnits };
export type RecipeStepChange = { step: number };
export type RecipeTimerDone = { step: number; text: string };

export type RecipeLabels = {
  prep: string;
  cook: string;
  servings: string;
  fewer: string;
  more: string;
  metric: string;
  imperial: string;
  units: string;
  ingredients: string;
  method: string;
  previous: string;
  next: string;
  start: string;
  pause: string;
  resume: string;
  reset: string;
  timerDone: string;
  toTaste: string;
};
export const defaultRecipeLabels: RecipeLabels = {
  prep: "Prep",
  cook: "Cook",
  servings: "Servings",
  fewer: "Fewer servings",
  more: "More servings",
  metric: "Metric",
  imperial: "Imperial",
  units: "Units",
  ingredients: "Ingredients",
  method: "Method",
  previous: "Previous step",
  next: "Next step",
  start: "Start timer",
  pause: "Pause",
  resume: "Resume",
  reset: "Reset",
  timerDone: "Timer done",
  toTaste: "to taste",
};

/* ---------- Quantities ---------- */

const FRACTIONS: [number, string, string][] = [
  [0, "", ""],
  [1 / 8, "⅛", "1/8"],
  [1 / 4, "¼", "1/4"],
  [1 / 3, "⅓", "1/3"],
  [3 / 8, "⅜", "3/8"],
  [1 / 2, "½", "1/2"],
  [5 / 8, "⅝", "5/8"],
  [2 / 3, "⅔", "2/3"],
  [3 / 4, "¾", "3/4"],
  [7 / 8, "⅞", "7/8"],
  [1, "", ""],
];

/** A quantity as cooks write it – "1⅓", "½" – and as words for screen readers: "1 and 1/3" */
export function formatQuantity(n: number): { text: string; spoken: string } {
  if (!Number.isFinite(n) || n <= 0) return { text: "0", spoken: "0" };
  if (n >= 10) {
    const r = String(Math.round(n));
    return { text: r, spoken: r };
  }
  let whole = Math.floor(n);
  const rest = n - whole;
  let best = FRACTIONS[0];
  for (const f of FRACTIONS) if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f;
  if (best[0] === 1) {
    whole += 1;
    best = FRACTIONS[0];
  }
  // Too small to round to an eighth: keep one decimal rather than showing nothing
  if (!whole && !best[1]) {
    const r = String(Math.round(n * 10) / 10 || 0.1);
    return { text: r, spoken: r };
  }
  const text = `${whole || ""}${best[1]}`;
  const spoken = whole && best[2] ? `${whole} and ${best[2]}` : best[2] || String(whole);
  return { text, spoken };
}

const METRIC_TO_IMPERIAL: Record<string, (q: number) => [number, RecipeUnit]> = {
  g: (q) => (q >= 454 ? [q / 453.592, "lb"] : [q / 28.3495, "oz"]),
  kg: (q) => [q / 0.453592, "lb"],
  ml: (q) => (q >= 60 ? [q / 240, "cup"] : [q / 29.5735, "fl oz"]),
  l: (q) => [(q * 1000) / 240, "cup"],
};
const IMPERIAL_TO_METRIC: Record<string, (q: number) => [number, RecipeUnit]> = {
  oz: (q) => [q * 28.3495, "g"],
  lb: (q) => [q * 453.592, "g"],
  "fl oz": (q) => [q * 29.5735, "ml"],
  cup: (q) => [q * 240, "ml"],
};

/** Grams and millilitres round to what a scale shows: whole units, or fives above 100 */
const roundMetric = (q: number, unit: RecipeUnit) => {
  if (unit === "g" && q >= 1000) return [Math.round(q / 50) * 50, unit] as const;
  if (unit === "ml" && q >= 1000) return [Math.round(q / 50) * 50, unit] as const;
  return [q >= 100 ? Math.round(q / 5) * 5 : Math.max(1, Math.round(q)), unit] as const;
};

/** A quantity converted to `units`; units that don't convert stay as they are */
export function convertQuantity(quantity: number, unit: RecipeUnit | undefined, units: RecipeUnits): [number, RecipeUnit | undefined] {
  if (!unit) return [quantity, unit];
  const to = units === "imperial" ? METRIC_TO_IMPERIAL[unit] : IMPERIAL_TO_METRIC[unit];
  if (to) {
    const [q, u] = to(quantity);
    return units === "metric" ? [...roundMetric(q, u)] : [q, u];
  }
  return units === "metric" && (unit === "g" || unit === "ml") ? [...roundMetric(quantity, unit)] : [quantity, unit];
}

const unitWord = (unit: RecipeUnit | undefined, q: number) => (!unit ? "" : unit === "cup" && q > 1 ? "cups" : unit);

/* ---------- Steps ---------- */

const DURATION = /(\d+(?:\.\d+)?)(?:\s*(?:–|-|to)\s*\d+(?:\.\d+)?)?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/i;
const TEMPERATURE = /(\d+)\s*°\s*([CF])\b/g;

/** The timer a step names, in seconds: "Simmer for 20 minutes" → 1200; a range takes its lower end */
export function stepTimer(step: RecipeStep): number | null {
  if (typeof step !== "string" && step.timer) return step.timer;
  const m = DURATION.exec(typeof step === "string" ? step : step.text);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  return Math.round(unit.startsWith("h") ? n * 3600 : unit.startsWith("m") ? n * 60 : n);
}

/** A step's words with oven temperatures in `units` */
function stepText(step: RecipeStep, units: RecipeUnits) {
  const text = typeof step === "string" ? step : step.text;
  return text.replace(TEMPERATURE, (all, n: string, scale: string) => {
    const t = Number(n);
    if (units === "imperial" && scale.toUpperCase() === "C") return `${Math.round((t * 9) / 5 + 32)}°F`;
    if (units === "metric" && scale.toUpperCase() === "F") return `${Math.round((((t - 32) * 5) / 9) / 5) * 5}°C`;
    return all;
  });
}

const clock = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
};
const spokenDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h && `${h} h`, m && `${m} min`, s && `${s} s`].filter(Boolean).join(" ") || "0 s";
};
const minutes = (n: number) => (n >= 60 ? `${Math.floor(n / 60)} h${n % 60 ? ` ${n % 60} min` : ""}` : `${n} min`);

type Timer = { total: number; left: number; running: boolean; started: boolean; done: boolean };

let uidCount = 0;

/* chef-hat, clock, minus, plus, timer, play, pause, rotate-ccw, chevron-left, chevron-right: Lucide (ISC, lucide.dev) */
const hatIcon = svg`<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"></path><path d="M6 17h12"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const clockIcon = () => lucide(14, svg`<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`);
const minusIcon = () => lucide(16, svg`<path d="M5 12h14"></path>`);
const plusIcon = () => lucide(16, svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const timerIcon = () => lucide(14, svg`<line x1="10" x2="14" y1="2" y2="2"></line><line x1="12" x2="15" y1="14" y2="11"></line><circle cx="12" cy="14" r="8"></circle>`);
const playIcon = () => lucide(14, svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`);
const pauseIcon = () => lucide(14, svg`<rect x="14" y="4" width="4" height="16" rx="1"></rect><rect x="6" y="4" width="4" height="16" rx="1"></rect>`);
const resetIcon = () => lucide(14, svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`);
const prevIcon = () => lucide(16, svg`<path d="m15 18-6-6 6-6"></path>`);
const nextIcon = () => lucide(16, svg`<path d="m9 18 6-6-6-6"></path>`);
const tick = () => html`<svg class="ui-rcpe__tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>`;

/**
 * A recipe ready to cook from – servings that scale every quantity, metric or imperial, ingredients to tick off, and
 * numbered steps with timers.
 * @tag tc-recipe-card
 * @fires tc-servings-change - The servings changed ({ servings }: RecipeServingsChange); cancelable – prevented, `servings` stays as it was
 * @fires tc-units-change - Metric or imperial changed ({ units }: RecipeUnitsChange); cancelable – prevented, `units` stays as it was
 * @fires tc-step-change - The current step changed ({ step }: RecipeStepChange, its index); cancelable – prevented, `step` stays as it was
 * @fires tc-timer-done - A step's timer reached zero ({ step, text }: RecipeTimerDone)
 */
export class TcRecipeCard extends TcElement {
  static override ui = "rcpe";

  /** The recipe's name */
  @property() accessor heading = "Recipe";
  /** One line about it, under the name */
  @property() accessor description: string | undefined = undefined;
  /** Preparation time in minutes */
  @property({ type: Number, attribute: "prep-minutes" }) accessor prepMinutes: number | undefined = undefined;
  /** Cooking time in minutes */
  @property({ type: Number, attribute: "cook-minutes" }) accessor cookMinutes: number | undefined = undefined;
  /** How many the quantities in `ingredients` serve */
  @property({ type: Number, attribute: "base-servings" }) accessor baseServings = 4;
  /** How many to cook for – quantities scale to it. Changed by the user unless tc-servings-change is prevented */
  @property({ type: Number }) accessor servings: number | undefined = undefined;
  /** The fewest servings the stepper allows */
  @property({ type: Number, attribute: "min-servings" }) accessor minServings = 1;
  /** The most servings the stepper allows */
  @property({ type: Number, attribute: "max-servings" }) accessor maxServings = 24;
  /** Metric or imperial. Changed by the user unless tc-units-change is prevented */
  @property({ reflect: true }) accessor units: RecipeUnits = "metric";
  /** The ingredients, with quantities for `baseServings` */
  @property({ attribute: false }) accessor ingredients: RecipeIngredient[] = [];
  /** The method, in order. A step that names a time gets a timer */
  @property({ attribute: false }) accessor steps: RecipeStep[] = [];
  /** The current step's index. Changed by the user unless tc-step-change is prevented */
  @property({ type: Number }) accessor step = 0;
  /** Ingredient ids ticked off */
  @property({ attribute: false }) accessor checked: string[] = [];
  /** How long one second of a timer lasts, in ms – 1000; shorter for tests and demos */
  @property({ type: Number, attribute: "tick-ms" }) accessor tickMs = 1000;
  /** Words to use instead of the defaults */
  @property({ attribute: false }) accessor labels: Partial<RecipeLabels> = {};

  @state() private accessor timers: Record<number, Timer> = {};
  @state() private accessor announce = "";

  private uid = `tc-rcpe-${++uidCount}`;
  private interval: ReturnType<typeof setInterval> | undefined;

  private get l(): RecipeLabels {
    return { ...defaultRecipeLabels, ...this.labels };
  }
  private get serves() {
    return this.servings ?? this.baseServings;
  }
  private idOf(item: RecipeIngredient, i: number) {
    return item.id ?? String(i);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // New steps: timers belong to the old ones
    if (changed.has("steps") && changed.get("steps") !== undefined) this.stopAll();
    if (this.steps.length && (this.step < 0 || this.step >= this.steps.length)) this.step = Math.min(Math.max(0, this.step), this.steps.length - 1);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.interval);
    this.interval = undefined;
  }

  /* ---------- Servings, units, steps ---------- */

  private setServings(servings: number) {
    const next = Math.min(this.maxServings, Math.max(this.minServings, Math.round(servings)));
    if (next === this.serves) return;
    if (!this.emit<RecipeServingsChange>("tc-servings-change", { servings: next }, { cancelable: true })) return;
    this.servings = next;
    this.announce = `${next} ${next === 1 ? "serving" : "servings"}`;
  }

  private setUnits(units: RecipeUnits) {
    if (units === this.units) return;
    if (!this.emit<RecipeUnitsChange>("tc-units-change", { units }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.units = units;
  }

  private setStep(step: number) {
    if (step < 0 || step >= this.steps.length || step === this.step) return;
    if (!this.emit<RecipeStepChange>("tc-step-change", { step }, { cancelable: true })) return;
    this.step = step;
    this.announce = `Step ${step + 1} of ${this.steps.length}`;
  }

  private toggle(id: string) {
    this.checked = this.checked.includes(id) ? this.checked.filter((c) => c !== id) : [...this.checked, id];
  }

  /* ---------- Timers ---------- */

  private timerFor(index: number): Timer | null {
    const total = stepTimer(this.steps[index]);
    if (!total) return null;
    return this.timers[index] ?? { total, left: total, running: false, started: false, done: false };
  }

  private setTimer(index: number, timer: Timer) {
    this.timers = { ...this.timers, [index]: timer };
    this.ensureTicking();
  }

  private ensureTicking() {
    const running = Object.values(this.timers).some((t) => t.running);
    if (running && !this.interval) this.interval = setInterval(() => this.tickAll(), this.tickMs);
    if (!running && this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private tickAll() {
    const next: Record<number, Timer> = { ...this.timers };
    for (const [key, t] of Object.entries(next)) {
      if (!t.running) continue;
      const index = Number(key);
      const left = t.left - 1;
      if (left > 0) {
        next[index] = { ...t, left };
        continue;
      }
      next[index] = { ...t, left: 0, running: false, done: true };
      const text = stepText(this.steps[index], this.units);
      this.announce = `${this.l.timerDone}: step ${index + 1}, ${text}`;
      this.emit<RecipeTimerDone>("tc-timer-done", { step: index, text });
    }
    this.timers = next;
    this.ensureTicking();
  }

  private stopAll() {
    clearInterval(this.interval);
    this.interval = undefined;
    this.timers = {};
  }

  /** Starts, pauses or resumes a step's timer */
  private startPause(index: number) {
    const t = this.timerFor(index);
    if (!t) return;
    if (t.done) {
      this.setTimer(index, { ...t, left: t.total, done: false, running: true, started: true });
      this.announce = `Timer started: ${spokenDuration(t.total)}`;
      return;
    }
    this.setTimer(index, { ...t, running: !t.running, started: true });
    this.announce = t.running ? `Timer paused at ${spokenDuration(t.left)}` : `Timer started: ${spokenDuration(t.left)}`;
  }

  private reset(index: number) {
    const t = this.timerFor(index);
    if (!t) return;
    this.setTimer(index, { ...t, left: t.total, running: false, started: false, done: false });
    this.announce = `Timer reset to ${spokenDuration(t.total)}`;
  }

  /* ---------- Rendering ---------- */

  private renderQuantity(item: RecipeIngredient) {
    if (item.quantity === undefined) return html`<span class="ui-rcpe__qty ui-rcpe__qty--none">${this.l.toTaste}</span>`;
    const scaled = (item.quantity * this.serves) / (this.baseServings || 1);
    const [q, unit] = convertQuantity(scaled, item.unit, this.units);
    const { text, spoken } = formatQuantity(q);
    const word = unitWord(unit, q);
    return html`<span class="ui-rcpe__qty"><span aria-hidden="true">${text}${word ? ` ${word}` : ""}</span><span class="tc-sr-only">${spoken}${word ? ` ${word}` : ""}</span></span>`;
  }

  private renderIngredient(item: RecipeIngredient, i: number) {
    const id = this.idOf(item, i);
    const done = this.checked.includes(id);
    const box = `${this.uid}-ing-${i}`;
    return html`<li class="ui-rcpe__ingredient" ?data-done=${done}>
      <span class="ui-rcpe__box">
        <input id=${box} type="checkbox" .checked=${live(done)} @change=${() => this.toggle(id)} />
        ${tick()}
      </span>
      <label class="ui-rcpe__ing-text" for=${box}
        >${this.renderQuantity(item)} <span class="ui-rcpe__name">${item.name}</span>${item.note ? html`<span class="ui-rcpe__note">, ${item.note}</span>` : nothing}</label
      >
    </li>`;
  }

  private renderTimer(index: number) {
    const t = this.timerFor(index);
    if (!t) return nothing;
    const l = this.l;
    const started = t.started;
    const state = t.done ? "done" : t.running ? "running" : started ? "paused" : "idle";
    const label = t.done ? l.start : t.running ? l.pause : started ? l.resume : l.start;
    return html`<div class="ui-rcpe__timer" data-state=${state}>
      <button type="button" class="ui-rcpe__timer-btn" @click=${() => this.startPause(index)}>
        ${t.running ? pauseIcon() : started && !t.done ? playIcon() : timerIcon()}${label}${started ? nothing : html` <span class="ui-rcpe__timer-len">(${clock(t.total)})</span>`}
      </button>
      ${started
        ? html`<span class="ui-rcpe__clock" role="timer" aria-label=${`Time left for step ${index + 1}`}>${t.done ? l.timerDone : clock(t.left)}</span>
            <button type="button" class="ui-rcpe__icon-btn" title=${l.reset} @click=${() => this.reset(index)}>${resetIcon()}<span class="tc-sr-only">${l.reset} step ${index + 1} timer</span></button>`
        : nothing}
    </div>`;
  }

  private renderStep(step: RecipeStep, i: number) {
    const current = i === this.step;
    return html`<li class="ui-rcpe__step" ?data-current=${current} aria-current=${current ? "step" : "false"}>
      <button type="button" class="ui-rcpe__num" aria-pressed=${current ? "true" : "false"} @click=${() => this.setStep(i)}>
        <span aria-hidden="true">${i + 1}</span><span class="tc-sr-only">Step ${i + 1}</span>
      </button>
      <div class="ui-rcpe__step-body">
        <p class="ui-rcpe__step-text">${stepText(step, this.units)}</p>
        ${this.renderTimer(i)}
      </div>
    </li>`;
  }

  private renderTimes() {
    const l = this.l;
    const parts = [
      this.prepMinutes !== undefined ? `${l.prep} ${minutes(this.prepMinutes)}` : "",
      this.cookMinutes !== undefined ? `${l.cook} ${minutes(this.cookMinutes)}` : "",
    ].filter(Boolean);
    return parts.length ? html`<span class="ui-rcpe__times">${clockIcon()}${parts.join(" · ")}</span>` : nothing;
  }

  protected override render() {
    const l = this.l;
    const id = this.uid;
    const serves = this.serves;
    const ready = this.ingredients.filter((it, i) => this.checked.includes(this.idOf(it, i))).length;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: hatIcon, title: this.heading, subtitle: this.description, id: `${id}-title`, aside: this.renderTimes() })}
      <div class="ui-rcpe__card">
        <div class="ui-rcpe__bar">
          <div class="ui-rcpe__servings" role="group" aria-labelledby=${`${id}-serv`}>
            <span class="ui-rcpe__label" id=${`${id}-serv`}>${l.servings}</span>
            <button type="button" class="ui-rcpe__step-btn" ?disabled=${serves <= this.minServings} @click=${() => this.setServings(this.serves - 1)}>
              ${minusIcon()}<span class="tc-sr-only">${l.fewer}</span>
            </button>
            <output class="ui-rcpe__count" aria-live="off">${serves}</output>
            <button type="button" class="ui-rcpe__step-btn" ?disabled=${serves >= this.maxServings} @click=${() => this.setServings(this.serves + 1)}>
              ${plusIcon()}<span class="tc-sr-only">${l.more}</span>
            </button>
          </div>
          <fieldset class="ui-rcpe__units">
            <legend class="tc-sr-only">${l.units}</legend>
            ${(["metric", "imperial"] as const).map(
              (u) => html`<label class="ui-rcpe__unit" ?data-on=${this.units === u}
                ><input type="radio" class="tc-sr-only" name=${`${id}-units`} .checked=${live(this.units === u)} @change=${() => this.setUnits(u)} />${u === "metric" ? l.metric : l.imperial}</label
              >`,
            )}
          </fieldset>
        </div>
        <div class="ui-rcpe__body">
          <section class="ui-rcpe__col ui-rcpe__col--ingredients" aria-labelledby=${`${id}-ing`}>
            <h4 class="ui-rcpe__title" id=${`${id}-ing`}>${l.ingredients} <span class="ui-rcpe__aside">${ready} of ${this.ingredients.length}</span></h4>
            <ul class="ui-rcpe__ingredients">
              ${repeat(
                this.ingredients,
                (it, i) => this.idOf(it, i),
                (it, i) => this.renderIngredient(it, i),
              )}
            </ul>
          </section>
          <section class="ui-rcpe__col ui-rcpe__col--method" aria-labelledby=${`${id}-method`}>
            <div class="ui-rcpe__method-head">
              <h4 class="ui-rcpe__title" id=${`${id}-method`}>${l.method}</h4>
              ${this.steps.length > 1
                ? html`<span class="ui-rcpe__nav">
                    <button type="button" class="ui-rcpe__icon-btn" ?disabled=${this.step <= 0} @click=${() => this.setStep(this.step - 1)}>${prevIcon()}<span class="tc-sr-only">${l.previous}</span></button>
                    <span class="ui-rcpe__aside">${this.step + 1} / ${this.steps.length}</span>
                    <button type="button" class="ui-rcpe__icon-btn" ?disabled=${this.step >= this.steps.length - 1} @click=${() => this.setStep(this.step + 1)}>${nextIcon()}<span class="tc-sr-only">${l.next}</span></button>
                  </span>`
                : nothing}
            </div>
            <ol class="ui-rcpe__steps">
              ${this.steps.map((s, i) => this.renderStep(s, i))}
            </ol>
          </section>
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="rcpe"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rcpe"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-rcpe__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rcpe"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcpe__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="rcpe"] *, [data-ui="rcpe"] *::before, [data-ui="rcpe"] *::after { box-sizing: border-box; }
:where([data-ui="rcpe"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="rcpe"]) button:disabled { color: var(--tc-text-disabled); cursor: default; }
[data-ui="rcpe"] :is(button, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rcpe"] .ui-rcpe__unit:has(input:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="rcpe"]) :is(p, ul, ol, h4, fieldset) { margin: 0; padding: 0; border: 0; }
[data-ui="rcpe"] :is(ul, ol) { list-style: none; }
[data-ui="rcpe"] svg { display: block; flex: none; }
.ui-rcpe__times { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* ----- Servings and units ----- */
.ui-rcpe__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rcpe__servings { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-rcpe__label { margin-right: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-rcpe__step-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-rcpe__step-btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-rcpe__step-btn:disabled { background: var(--tc-fill-subtle); box-shadow: none; }
.ui-rcpe__count { min-width: var(--tc-space-7); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); text-align: center; font-variant-numeric: tabular-nums; }
.ui-rcpe__units { display: inline-flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-rcpe__unit { display: inline-flex; align-items: center; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rcpe__unit[data-on] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
/* ----- Ingredients and method ----- */
.ui-rcpe__body { display: grid; gap: var(--tc-space-5); padding: var(--tc-space-4); }
@container (min-width: 640px) {
  .ui-rcpe__body { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); }
}
.ui-rcpe__col { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; }
.ui-rcpe__title { display: flex; align-items: baseline; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-rcpe__aside { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rcpe__ingredient { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) 0; }
.ui-rcpe__ing-text { flex: 1; min-width: 0; padding-top: var(--tc-space-0-5); color: var(--tc-text-primary); overflow-wrap: anywhere; cursor: pointer; }
.ui-rcpe__qty { font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-rcpe__qty--none { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-rcpe__note { color: var(--tc-text-muted); }
.ui-rcpe__ingredient[data-done] .ui-rcpe__ing-text { color: var(--tc-text-muted); text-decoration: line-through; text-decoration-color: var(--tc-text-muted); }
.ui-rcpe__box { display: grid; flex: none; padding-top: var(--tc-space-0-5); }
.ui-rcpe__box > * { grid-area: 1 / 1; }
.ui-rcpe__box input { width: var(--tc-space-5); height: var(--tc-space-5); margin: 0; border-radius: var(--tc-radius-sm); background: var(--tc-surface-control); box-shadow: inset 0 0 0 1.5px var(--tc-border-control); appearance: none; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rcpe__box input:hover { box-shadow: inset 0 0 0 1.5px var(--tc-border-control-hover); }
.ui-rcpe__box input:checked { background: var(--tc-status-success-solid); box-shadow: inset 0 0 0 1.5px var(--tc-status-success-solid); }
.ui-rcpe__tick { place-self: center; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: var(--tc-text-on-accent); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 24; stroke-dashoffset: 24; pointer-events: none; transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-rcpe__box input:checked + .ui-rcpe__tick { stroke-dashoffset: 0; }
.ui-rcpe__method-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-rcpe__nav { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-rcpe__steps { display: grid; gap: var(--tc-space-1); }
.ui-rcpe__step { display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-2); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rcpe__step[data-current] { background: var(--tc-accent-subtle); box-shadow: inset 2px 0 0 var(--tc-accent-solid); }
.ui-rcpe__num { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-rcpe__num:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-rcpe__step[data-current] .ui-rcpe__num { background: var(--tc-accent-solid); color: var(--tc-text-on-accent); }
.ui-rcpe__step-body { display: grid; flex: 1; gap: var(--tc-space-2); min-width: 0; padding-top: var(--tc-space-1); }
.ui-rcpe__step-text { color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-rcpe__step:not([data-current]) .ui-rcpe__step-text { color: var(--tc-text-secondary); }
/* ----- Timers ----- */
.ui-rcpe__timer { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-rcpe__timer-btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); }
.ui-rcpe__timer-btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-rcpe__timer-len { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rcpe__clock { min-width: var(--tc-space-12); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-rcpe__timer[data-state="done"] .ui-rcpe__clock { font-family: var(--tc-font-sans); color: var(--tc-status-success-fg); }
.ui-rcpe__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-rcpe__icon-btn:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
@media (forced-colors: active) {
  .ui-rcpe__unit[data-on] { outline: 2px solid Highlight; }
  .ui-rcpe__box input { border: 1px solid ButtonText; }
  .ui-rcpe__box input:checked { background: Highlight; }
  .ui-rcpe__tick { stroke: HighlightText; }
  .ui-rcpe__step[data-current] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rcpe"] *, [data-ui="rcpe"] *::before, [data-ui="rcpe"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-recipe-card")) customElements.define("tc-recipe-card", TcRecipeCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-recipe-card": TcRecipeCard;
  }
}
