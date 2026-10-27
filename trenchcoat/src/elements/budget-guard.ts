import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { easeOutQuart } from "../internal/ease";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-budget-guard> – spend and token limits for a live agent run. The first limit is the big meter (usually the
 * spend), the others thin meters below it, as in usage-meter. Each meter has a notch where the warning starts; from
 * `warnAt` the card warns – an amber note with the pace ("about 2 min to the cap") and buttons that raise the cap
 * right there; at the cap it's a hard stop – the card says the run stopped, fires `tc-cap-reach` so the app halts it,
 * and offers the same raise to pick up where it left off.
 *
 *   <tc-budget-guard heading="Run budget" task="Research agent · competitor pricing" status="running"
 *     .limits=${[{ id: "spend", label: "Spend", kind: "currency", used: 3.42, cap: 5, rate: 0.6 },
 *                { id: "tokens", label: "Tokens", kind: "tokens", used: 182_400, cap: 250_000 }]}></tc-budget-guard>
 *
 * Raising a cap fires a cancelable `tc-limits-change` ({ limits, id, cap, previous }): prevent it to keep `limits`
 * yourself. "Stop run" / "End run" fire `tc-stop`. Numbers roll to their new values; the element reads no clock.
 */

export type BudgetLimitKind = "currency" | "tokens" | "number";

export type BudgetLimit = {
  id: string;
  /** "Spend", "Tokens", "Tool calls" */
  label: string;
  used: number;
  /** The hard limit: the run stops when `used` reaches it */
  cap: number;
  /** How the numbers read: money in `currency`, tokens (182.4k), or plain numbers with `unit` */
  kind?: BudgetLimitKind;
  /** For plain numbers, e.g. "calls" */
  unit?: string;
  /** How much the run uses per minute right now – shown as the pace to the cap */
  rate?: number;
  /** Amounts the warning offers to add to the cap – defaults to half, all and twice the cap, rounded */
  raiseBy?: number[];
};

export type BudgetGuardState = "ok" | "warn" | "stop";
export type BudgetGuardStatus = "running" | "paused" | "done";

/** Details of the events */
export type BudgetLimitsChange = { limits: BudgetLimit[]; id: string; cap: number; previous: number };
export type BudgetCapReach = { id: string; limit: BudgetLimit };
export type BudgetStop = { state: BudgetGuardState };

let instances = 0;

/* ---------- Helpers ---------- */

const formats = new Map<string, Intl.NumberFormat>();
const numberFormat = (locale: string, options: Intl.NumberFormatOptions) => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.NumberFormat(locale, options)));
  return f;
};

/** The next round amount at or above `x`: 1, 2, 2.5, 5 × 10ⁿ */
const nice = (x: number) => {
  if (!(x > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= x - 1e-9) ?? 10) * p;
};

const stateOf = (l: BudgetLimit, warnAt: number): BudgetGuardState => {
  const r = l.cap > 0 ? l.used / l.cap : 1;
  return r >= 1 ? "stop" : r >= warnAt ? "warn" : "ok";
};

/* ---------- Icons ---------- */

// The header icon: a shield
const shieldIcon = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>`;
const warnIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 2.6 1.9 13.1h12.2z"></path><path d="M8 6.6v3M8 11.4h.01"></path>`}</svg>`;
const stopIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="5.8"></circle><path d="M6.2 6.2h3.6v3.6H6.2z"></path>`}</svg>`;
const upIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7"></path>`}</svg>`;

/**
 * Spend and token limits for a live run: progress against the cap, a warning near it, a hard stop at it, and raising
 * the cap from the warning.
 * @tag tc-budget-guard
 * @fires tc-limits-change - A cap was raised (detail: { limits: BudgetLimit[], id: string, cap: number, previous: number }); cancelable
 * @fires tc-cap-reach - A limit reached its cap – halt the run (detail: { id: string, limit: BudgetLimit })
 * @fires tc-stop - "Stop run" or "End run" pressed (detail: { state: "ok" | "warn" | "stop" })
 */
export class TcBudgetGuard extends TcElement {
  static override ui = "bgd";

  /** The limits – the first one is the big meter. Raises apply unless a tc-limits-change listener calls preventDefault() */
  @property({ attribute: false }) accessor limits: BudgetLimit[] = [];
  /** The run: "running", "paused" or "done" – always set by the app */
  @property() accessor status: BudgetGuardStatus = "running";
  /** The heading, and the region's name */
  @property() accessor heading = "Run budget";
  /** What runs, a quiet line under the heading */
  @property() accessor task = "";
  /** Share of a cap from which the card warns (0–1) */
  @property({ type: Number, attribute: "warn-at" }) accessor warnAt = 0.8;
  /** Currency of "currency" limits, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** Locale for numbers and money */
  @property() accessor locale = "en-US";

  /** @internal Shown numbers, rolling to their targets */
  @state() accessor shown: Record<string, number> = {};
  /** @internal */
  @state() accessor message = "";
  /** @internal */
  @state() accessor alert = "";

  private readonly uid = `tc-bgd${++instances}`;
  private seen = new Map<string, BudgetGuardState>();
  private frame = 0;
  private to: Record<string, number> = {};
  /** The note keeps its content while it folds away */
  private noticeFor: string | null = null;

  constructor() {
    super();
    // A raise closes the note with its buttons: focus goes to the status line instead of <body>
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-bgd__status"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // A roll cut short ends on its target
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.shown = { ...this.to };
    }
  }

  /* ---------- State ---------- */

  /** @internal The card's state: the worst of its limits */
  private get guardState(): BudgetGuardState {
    const states = this.limits.map((l) => stateOf(l, this.warnAt));
    return states.includes("stop") ? "stop" : states.includes("warn") ? "warn" : "ok";
  }

  /** @internal The limit the note is about: stopped first, then the fullest */
  private get pressing(): BudgetLimit | undefined {
    const ranked = this.limits.filter((l) => stateOf(l, this.warnAt) !== "ok").sort((a, b) => b.used / b.cap - a.used / a.cap);
    return ranked.find((l) => stateOf(l, this.warnAt) === "stop") ?? ranked[0];
  }

  /** @internal */
  private fmt(l: BudgetLimit, n: number, compact = false) {
    const kind = l.kind ?? "number";
    if (kind === "currency") {
      const whole = compact && Number.isInteger(n);
      return numberFormat(this.locale, { style: "currency", currency: this.currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
    }
    if (kind === "tokens") {
      if (Math.abs(n) < 1000) return numberFormat(this.locale, { maximumFractionDigits: 0 }).format(n);
      const k = n / 1000;
      return `${numberFormat(this.locale, { maximumFractionDigits: k < 100 && !Number.isInteger(k) ? 1 : 0 }).format(k)}k`;
    }
    const text = numberFormat(this.locale, { maximumFractionDigits: Number.isInteger(n) ? 0 : 1 }).format(n);
    return l.unit ? `${text} ${l.unit}` : text;
  }

  /** @internal "of $5.00", "of 250k tokens" */
  private capText(l: BudgetLimit) {
    return (l.kind ?? "number") === "tokens" ? `${this.fmt(l, l.cap)} tokens` : this.fmt(l, l.cap);
  }

  /** @internal "About 3 min to the cap" at the current rate */
  private paceText(l: BudgetLimit) {
    if (this.status !== "running" || !l.rate || l.rate <= 0 || l.used >= l.cap) return "";
    const min = (l.cap - l.used) / l.rate;
    const rate = `${(l.kind ?? "number") === "tokens" ? `${this.fmt(l, l.rate)} tokens` : this.fmt(l, l.rate)}/min`;
    if (min < 1) return `Under a minute to the cap at ${rate}`;
    if (min > 120) return `Hours from the cap at ${rate}`;
    return `About ${Math.round(min)} min to the cap at ${rate}`;
  }

  /** @internal New caps the note offers */
  private raises(l: BudgetLimit) {
    const by = l.raiseBy?.length ? l.raiseBy : [nice(l.cap / 2), nice(l.cap), nice(l.cap * 2)];
    const caps = [...new Set(by.filter((x) => x > 0).map((x) => Math.round((l.cap + x) * 1e6) / 1e6))];
    return caps.filter((c) => c > l.used).slice(0, 3);
  }

  /* ---------- Actions ---------- */

  private raise(l: BudgetLimit, cap: number) {
    const limits = this.limits.map((x) => (x.id === l.id ? { ...x, cap } : x));
    const from = stateOf(l, this.warnAt);
    if (!this.emit<BudgetLimitsChange>("tc-limits-change", { limits, id: l.id, cap, previous: l.cap }, { cancelable: true })) return;
    this.limits = limits;
    this.announce(`${l.label} cap raised to ${this.fmt(l, cap)}${from === "stop" ? " – the run can go on" : ""}.`);
  }

  private stop = () => this.emit<BudgetStop>("tc-stop", { state: this.guardState });

  /** A trailing no-break space makes repeated messages count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const st = this.guardState;
    this.dataset.state = st;
    this.dataset.status = this.status;
    const p = this.pressing;
    if (p) this.noticeFor = p.id;
    if (changed.has("limits")) this.roll();
  }

  /** Numbers roll from where they are to their new values; the first values show as they are */
  private roll() {
    const target: Record<string, number> = {};
    for (const l of this.limits) target[l.id] = l.used;
    const from = { ...this.shown };
    this.to = target;
    const fresh = Object.keys(from).length === 0;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    if (fresh || reducedMotion() || Object.keys(target).every((k) => (from[k] ?? target[k]) === target[k])) {
      this.shown = target;
      return;
    }
    // The first frame's timestamp is the start, so no clock is read
    let start = -1;
    const step = (now: number) => {
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / 650);
      const e = easeOutQuart(t);
      const next: Record<string, number> = {};
      for (const k in target) next[k] = (from[k] ?? target[k]) + (target[k] - (from[k] ?? target[k])) * e;
      this.shown = next;
      this.frame = t < 1 ? requestAnimationFrame(step) : 0;
    };
    this.frame = requestAnimationFrame(step);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (!changed.has("limits") && !changed.has("warnAt")) return;
    // Crossing into the warning or the stop: said once, and the stop is an event the app halts the run on
    for (const l of this.limits) {
      const st = stateOf(l, this.warnAt);
      const was = this.seen.get(l.id);
      if (st !== was) {
        if (st === "stop") {
          this.alert = `Run stopped: ${l.label.toLowerCase()} reached the ${this.capText(l)} cap.`;
          this.emit<BudgetCapReach>("tc-cap-reach", { id: l.id, limit: l });
        } else if (st === "warn" && was !== "stop") this.announce(`${l.label} at ${Math.floor((l.used / l.cap) * 100)}% of the ${this.capText(l)} cap.`);
      }
      this.seen.set(l.id, st);
    }
    for (const id of [...this.seen.keys()]) if (!this.limits.some((l) => l.id === id)) this.seen.delete(id);
  }

  /* ---------- Render ---------- */

  private renderMeter(l: BudgetLimit, hero: boolean) {
    const st = stateOf(l, this.warnAt);
    const used = this.shown[l.id] ?? l.used;
    const pct = l.cap > 0 ? Math.min(100, (used / l.cap) * 100) : 100;
    const track = html`<span
      class=${hero ? "ui-bgd__track" : "ui-bgd__thin"}
      .role=${"meter"}
      aria-label=${l.label}
      aria-valuemin="0"
      aria-valuemax=${l.cap}
      aria-valuenow=${Math.min(l.used, l.cap)}
      aria-valuetext=${`${this.fmt(l, l.used)} of ${this.capText(l)}${st === "stop" ? ", at the cap" : st === "warn" ? ", close to the cap" : ""}`}
      ><span class="ui-bgd__fill" style=${styleMap({ width: `${pct}%` })}></span><span class="ui-bgd__notch" style=${styleMap({ left: `${this.warnAt * 100}%` })}></span
    ></span>`;
    if (hero) {
      // Near the cap the note carries the pace
      const pace = st === "ok" ? this.paceText(l) : "";
      return html`<div class="ui-bgd__figure">
          <p class="ui-bgd__amount"><span class="ui-bgd__big">${this.fmt(l, used)}</span><span class="ui-bgd__of">of ${this.capText(l)} ${l.label.toLowerCase()} cap</span></p>
          <span class="ui-bgd__pct" data-state=${st}>${st !== "ok" ? html`<span class="ui-bgd__dot" aria-hidden="true"></span>` : nothing}${Math.floor(l.cap > 0 ? (l.used / l.cap) * 100 : 100)}%</span>
        </div>
        <div class="ui-bgd__bar" data-state=${st}>${track}</div>
        ${keyed(pace ? "pace" : "none", pace ? html`<p class="ui-bgd__pace">${pace}</p>` : nothing)}`;
    }
    return html`<li class="ui-bgd__limit" data-state=${st}>
      <span class="ui-bgd__limit-label">${l.label}${st !== "ok"
        ? html`<span class="ui-bgd__dot" aria-hidden="true"></span><span class="ui-bgd__sr">${st === "stop" ? ", at the cap" : ", close to the cap"}</span>`
        : nothing}</span>
      <span class="ui-bgd__limit-value">${this.fmt(l, used)}<span class="ui-bgd__muted"> of ${this.capText(l)}</span></span>
      ${track}
    </li>`;
  }

  private renderNotice() {
    const st = this.guardState;
    const open = st !== "ok";
    const l = this.limits.find((x) => x.id === this.noticeFor);
    let body: unknown = nothing;
    if (l) {
      const lst = stateOf(l, this.warnAt);
      const stop = lst === "stop";
      const name = l.label.toLowerCase();
      const pace = this.paceText(l);
      const title = stop ? `Stopped at the ${name} cap` : `Nearing the ${name} cap`;
      const text = stop
        ? `The run used ${this.fmt(l, l.used)} of ${this.capText(l)}. Raise the cap to pick up where it left off.`
        : `${this.fmt(l, Math.max(0, l.cap - l.used))} left${pace ? ` – ${pace.charAt(0).toLowerCase()}${pace.slice(1)}` : ""}. The run stops at ${this.capText(l)}.`;
      const options = this.raises(l);
      body = keyed(
        `${l.id}:${lst}`,
        html`<div class="ui-bgd__notice" data-tone=${lst} role="group" aria-labelledby=${`${this.uid}-notice`}>
          <span class="ui-bgd__notice-icon">${stop ? stopIcon : warnIcon}</span>
          <div class="ui-bgd__notice-body">
            <p class="ui-bgd__notice-title" id=${`${this.uid}-notice`}>${title}</p>
            <p class="ui-bgd__notice-text">${text}</p>
            ${options.length
              ? html`<div class="ui-bgd__raise" role="group" aria-label=${`Raise the ${name} cap`}>
                  <span class="ui-bgd__raise-label" aria-hidden="true">Raise to</span>
                  ${options.map(
                    (cap, i) => html`<button
                      type="button"
                      class=${i === 0 ? "ui-bgd__chip ui-bgd__chip--first" : "ui-bgd__chip"}
                      data-focus-key=${`raise-${i}`}
                      aria-label=${`Raise the ${name} cap to ${this.capText({ ...l, cap })}`}
                      @click=${() => this.raise(l, cap)}
                    >${i === 0 ? upIcon : nothing}${this.fmt(l, cap, true)}</button>`,
                  )}
                </div>`
              : nothing}
          </div>
        </div>`,
      );
    }
    return html`<div class="ui-bgd__fold" ?data-open=${open} .inert=${!open}><div class="ui-bgd__fold-inner">${body}</div></div>`;
  }

  private renderFoot() {
    const st = this.guardState;
    const hero = this.limits[0];
    const p = this.pressing ?? hero;
    const dot = html`<span class="ui-bgd__dot" aria-hidden="true"></span>`;
    let status: unknown = html`<span>No limits set</span>`;
    if (p) {
      const left = html`<span class=${ifDefined(st === "ok" ? undefined : "ui-bgd__muted")}>${this.fmt(p, Math.max(0, p.cap - p.used))} ${(p.kind ?? "number") === "tokens" ? "tokens " : ""}left</span>`;
      status =
        st === "stop"
          ? html`${dot}<b>Stopped at the cap</b>`
          : st === "warn"
            ? html`${dot}<b>Running low</b>${left}`
            : this.status === "done"
              ? html`<b>Finished under budget</b><span class="ui-bgd__muted">${this.fmt(p, Math.max(0, p.cap - p.used))} left</span>`
              : left;
    }
    const live = this.status === "running";
    return html`<div class="ui-bgd__foot">
      ${keyed(`${st}:${this.status}`, html`<span class="ui-bgd__status" tabindex="-1">${status}</span>`)}
      ${live || st === "stop"
        ? html`<button type="button" class=${st === "stop" ? "ui-bgd__btn ui-bgd__btn--secondary" : "ui-bgd__btn ui-bgd__btn--quiet"} @click=${this.stop}>${st === "stop" ? "End run" : "Stop run"}</button>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const [hero, ...rest] = this.limits;
    const st = this.guardState;
    const pill = st === "stop" ? "Stopped" : this.status === "done" ? "Done" : this.status === "paused" ? "Paused" : st === "warn" ? "Near cap" : "Live";
    const head = cardHead({
      icon: shieldIcon,
      title: this.heading,
      subtitle: this.task,
      id: `${this.uid}-title`,
      aside: html`<span class="ui-bgd__pill" data-pill=${st === "ok" ? this.status : st}>${pill === "Live" ? html`<span class="ui-bgd__pulse" aria-hidden="true"></span>` : nothing}${pill}</span>`,
    });
    // Standard: the header sits on the tray above the card; Clean: the host is the card, the header its first row
    return html`
      ${head}
      <div class="ui-bgd__card">
        <div class="ui-bgd__inner">
          ${hero ? this.renderMeter(hero, true) : html`<p class="ui-bgd__empty">No limits set for this run</p>`}
          ${rest.length
            ? html`<ul class="ui-bgd__limits" aria-label="Other limits">
                ${repeat(
                  rest,
                  (l) => l.id,
                  (l) => this.renderMeter(l, false),
                )}
              </ul>`
            : nothing}
          ${this.renderNotice()}
        </div>
      </div>
      ${this.renderFoot()}
      <p class="ui-bgd__sr" role="status">${this.message}</p>
      <p class="ui-bgd__sr" role="alert">${this.alert}</p>
    `;
  }

  static override css = /* css */ `
/* Colours as variables – override them on [data-ui="bgd"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bgd"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 460px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bgd"] {
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
[data-ui="bgd"] *, [data-ui="bgd"] *::before, [data-ui="bgd"] *::after { box-sizing: border-box; }
[data-ui="bgd"] { grid-template-columns: minmax(0, 1fr); }
[data-ui="bgd"] svg:where(:not(.tc-head__icon > svg)) { display: block; width: 100%; height: 100%; overflow: visible; }
:where([data-ui="bgd"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="bgd"]) :is(h3, p, ul) { margin: 0; padding: 0; }
:where([data-ui="bgd"]) ul { list-style: none; }
[data-ui="bgd"] button:focus-visible, .ui-bgd__status:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-bgd__status:focus:not(:focus-visible) { outline: none; }
[data-ui="bgd"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-bgd__muted { color: var(--tc-text-muted); }
.ui-bgd__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card (Clean: the body of the one card) */
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__inner { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__inner { padding: 0 var(--tc-space-4) var(--tc-space-4); }
/* The run's pill, beside the title – trace-waterfall's */
.ui-bgd__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-bgd__pill[data-pill="running"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-bgd__pill[data-pill="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-bgd__pill[data-pill="warn"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-bgd__pill[data-pill="stop"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-bgd__pulse { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: ui-bgd-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) 3; }
/* The big number and its share – usage-meter's figure */
.ui-bgd__figure { display: flex; justify-content: space-between; gap: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__figure { align-items: baseline; margin-top: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__figure { align-items: center; margin-top: var(--tc-space-3-5); }
.ui-bgd__amount { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: var(--tc-space-2); min-width: 0; }
.ui-bgd__big { font-weight: var(--tc-font-weight-strong); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__big { font-size: var(--tc-font-size-4xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__big { font-size: var(--tc-font-size-3xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-strong); }
.ui-bgd__of { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__of { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-bgd__pct { display: inline-flex; flex: none; align-items: center; font-variant-numeric: tabular-nums; transition: color var(--tc-duration-moderate) var(--tc-ease-standard), background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__pct { gap: var(--tc-space-1-5); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__pct[data-state="warn"] { color: var(--tc-status-warning-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__pct[data-state="stop"] { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__pct { gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__pct[data-state="warn"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__pct[data-state="stop"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The small status dot: amber near the cap, red at it */
.ui-bgd__dot { display: inline-block; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-status-warning-solid); animation: ui-bgd-pop var(--tc-duration-slower) var(--tc-ease-spring) both; }
[data-ui="bgd"][data-state="stop"] :is(.ui-bgd__pct, .ui-bgd__status) .ui-bgd__dot, .ui-bgd__limit[data-state="stop"] .ui-bgd__dot { background: var(--tc-status-danger-solid); }
/* Meters: the hero track, thin ones for the other limits; a notch where the warning starts */
.ui-bgd__bar { margin-top: var(--tc-space-2-5); }
.ui-bgd__track, .ui-bgd__thin { position: relative; display: block; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-bgd__track { height: var(--tc-meter-h-hero); }
.ui-bgd__thin { height: var(--tc-meter-h); }
.ui-bgd__fill { position: absolute; top: 0; bottom: 0; left: 0; border-radius: inherit; background: var(--tc-meter-fill); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
[data-state="warn"] > * > .ui-bgd__fill, .ui-bgd__limit[data-state="warn"] .ui-bgd__fill { background: var(--tc-status-warning-solid); }
[data-state="stop"] > * > .ui-bgd__fill, .ui-bgd__limit[data-state="stop"] .ui-bgd__fill { background: var(--tc-status-danger-solid); }
.ui-bgd__notch { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--tc-surface-raised); transform: translateX(-50%); }
.ui-bgd__pace { margin-top: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; animation: ui-bgd-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__pace { line-height: var(--tc-line-height-tight); }
.ui-bgd__limits { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--tc-space-3) var(--tc-space-4-5); margin-top: var(--tc-space-4); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-bgd__limit { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; min-width: 0; }
.ui-bgd__limit-label { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__limit-label { line-height: var(--tc-line-height-tight); }
.ui-bgd__limit-value { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; white-space: nowrap; text-overflow: ellipsis; }
.ui-bgd__limit-value .ui-bgd__muted { font-weight: var(--tc-font-weight-regular); }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__thin { margin-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__thin { margin-top: var(--tc-space-1-5); }
.ui-bgd__empty { margin-top: var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
/* The note: folds open near the cap and at it */
.ui-bgd__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-bgd__fold[data-open] { grid-template-rows: 1fr; opacity: 1; }
.ui-bgd__fold-inner { min-height: 0; overflow: hidden; }
.ui-bgd__notice { display: flex; gap: var(--tc-space-2-5); margin-top: var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-3); background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); animation: ui-bgd-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__notice { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__notice { border-radius: var(--tc-radius-md); }
.ui-bgd__notice[data-tone="stop"] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); }
.ui-bgd__notice-icon { flex: none; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); color: var(--tc-status-warning-fg); fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__notice-icon { stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__notice-icon { stroke-width: 1.2; }
.ui-bgd__notice[data-tone="stop"] .ui-bgd__notice-icon { color: var(--tc-status-danger-fg); }
.ui-bgd__notice-body { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-bgd__notice-title { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-bgd__notice[data-tone="stop"] .ui-bgd__notice-title { color: var(--tc-status-danger-fg); }
.ui-bgd__notice-text { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
/* Raise to: small buttons like Button's secondary sm */
.ui-bgd__raise { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); margin-top: var(--tc-space-2); }
.ui-bgd__raise-label { margin-right: var(--tc-space-0-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-bgd__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); font-variant-numeric: tabular-nums; white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-bgd__chip:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-bgd__chip:active { transform: scale(0.97); }
/* The first raise is the suggested one: the ink button */
.ui-bgd__chip--first { padding-left: calc(var(--tc-control-px-sm) - var(--tc-space-0-5)); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-bgd__chip--first:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-bgd__chip svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__chip svg { stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__chip svg { stroke-width: 1.3; }
/* Standard: the tray below the card · Clean: the last row of the card, under a hairline */
.ui-bgd__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-bgd__foot { padding: var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-bgd__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); line-height: var(--tc-line-height-tight); }
.ui-bgd__status { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; overflow: hidden; white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-bgd-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-bgd__status > :last-child { overflow: hidden; text-overflow: ellipsis; }
.ui-bgd__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-bgd__btn:active { transform: scale(0.97); }
.ui-bgd__btn--quiet { color: var(--tc-action-ghost-fg); }
.ui-bgd__btn--quiet:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-bgd__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-bgd__btn--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
@keyframes ui-bgd-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-bgd-pop { 0% { transform: scale(0.3); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes ui-bgd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
/* Narrow: the limits stack, tighter gutters */
@container (max-width: 400px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-bgd__inner { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-bgd__inner { padding: 0 var(--tc-space-3-5) var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-bgd__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-3-5); }
  :where([data-look="standard"], [data-look="standard"] *).ui-bgd__big { font-size: var(--tc-font-size-3xl); }
  .ui-bgd__raise-label { flex-basis: 100%; }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
  .ui-bgd__chip { height: var(--tc-control-h-md); }
  .ui-bgd__btn { height: var(--tc-control-h-lg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="bgd"] *, [data-ui="bgd"] *::before, [data-ui="bgd"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-budget-guard")) customElements.define("tc-budget-guard", TcBudgetGuard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-budget-guard": TcBudgetGuard;
  }
}
