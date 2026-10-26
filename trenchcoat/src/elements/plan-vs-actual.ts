import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { OffScreenController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-plan-vs-actual> – the Lit port of src/components/plan-vs-actual.tsx (Clean only: it always renders the Clean
 * look, whatever `look` or the provider say). An agent's plan as a live Gantt chart, the plan as a dashed ghost under
 * every step.
 *   · every step's real bar grows over its ghost; the part that runs past the plan turns amber
 *   · steps that haven't started show where they will now run – they glide right when a step before them runs over
 *   · the planned finish is a dashed line, the expected finish (ETA) a solid one that moves
 *   · time and cost so far sit in the bar on top, each against the plan
 *   · point at (or focus) a step to see what it waits for, what waits for it, and what it cost
 *
 *   <tc-plan-vs-actual task="Ship the pricing page" .steps=${steps} .elapsed=${42000}></tc-plan-vs-actual>
 */

export type PlanVsActualStep = {
  id: string;
  /** What the step does, in a few words – e.g. "Build the layout" */
  title: string;
  /** How long it was planned to take, in ms */
  plan: number;
  /** Steps that have to finish first */
  deps?: string[];
  /** When it really started – epoch ms, on the same clock as `now` (or ms from the start of the run with `elapsed`).
   *  Leave out while it waits */
  start?: number;
  /** When it really finished – leave out while it runs */
  end?: number;
  /** A small mark before the title – e.g. the tool's logo (cloned) */
  icon?: Element;
  /** What it has cost so far – shown when you point at the step, and added up in the bar on top */
  cost?: number;
  /** What it was planned to cost – the plan's total shows next to the spend */
  planCost?: number;
};

type Status = "waiting" | "running" | "done";
type Placed = { step: PlanVsActualStep; index: number; status: Status; ps: number; pe: number; as: number; ae: number };

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
/** A difference: "+12s", "−1:05" */
const delta = (ms: number) => {
  const s = Math.round(Math.abs(ms) / 1000);
  const t = s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return `${ms < 0 ? "−" : "+"}${t}`;
};
const dollars = (n: number) => `$${n.toFixed(2)}`;
/** Less than this counts as on plan */
const SLACK = 1500;

/** Plan and real or expected times for every step – each step starts once all it waits for has finished */
function place(steps: PlanVsActualStep[], now: number): Placed[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const memo = new Map<string, Placed>();
  // The steps being placed right now: a dep that's one of them closes a cycle, and is left out instead of recursing forever
  const visiting = new Set<string>();
  const visit = (s: PlanVsActualStep, index: number): Placed => {
    const hit = memo.get(s.id);
    if (hit) return hit;
    visiting.add(s.id);
    const deps = (s.deps ?? []).map((id) => byId.get(id)).filter((d): d is PlanVsActualStep => !!d && !visiting.has(d.id));
    const before = deps.map((d) => visit(d, steps.indexOf(d)));
    visiting.delete(s.id);
    const ps = Math.max(0, ...before.map((b) => b.pe));
    const pe = ps + s.plan;
    const status: Status = s.end !== undefined ? "done" : s.start !== undefined ? "running" : "waiting";
    let as: number;
    let ae: number;
    if (status === "done") {
      as = s.start ?? s.end! - s.plan;
      ae = s.end!;
    } else if (status === "running") {
      as = s.start!;
      ae = Math.max(now, as + s.plan);
    } else {
      // Can't start in the past – nor before everything it waits for is expected to be done
      as = Math.max(now, ...before.map((b) => b.ae));
      ae = as + s.plan;
    }
    const placed = { step: s, index, status, ps, pe, as, ae };
    memo.set(s.id, placed);
    return placed;
  };
  return steps.map((s, i) => visit(s, i));
}

/* The chart mark and the step states: drawn for Trenchcoat */
const chartMark = html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${svg`<rect x="1.5" y="2.5" width="7" height="3" rx="1.5" fill="currentColor"></rect><rect x="5" y="6.5" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.6"></rect><rect x="8.5" y="10.5" width="6" height="3" rx="1.5" fill="currentColor" opacity="0.32"></rect>`}</svg>`;
const stateIcon = (status: Status) =>
  status === "done"
    ? html`<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">${svg`<path d="M3 7.4 5.7 10 11 4.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`
    : status === "running"
      ? html`<svg class="ui-pvac__spin" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">${svg`<circle cx="7" cy="7" r="5" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.5"></circle><path d="M7 2a5 5 0 0 1 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>`}</svg>`
      : html`<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">${svg`<circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2"></circle>`}</svg>`;

/** The dependency lines are drawn for the pointer only – this says the same in the row's name: what it waits for */
const dependsText = (step: PlanVsActualStep, byId: Map<string, Placed>) => {
  const names = (step.deps ?? []).flatMap((id) => (id !== step.id && byId.get(id) ? [byId.get(id)!.step.title] : []));
  return names.length ? `. Waits for ${names.join(", ")}` : "";
};

/** Position and width on the time axis as CSS variables */
const at = (start: number, end: number) => styleMap({ "--s": String(start), "--d": String(Math.max(0, end - start)) });
const v = (value: number) => styleMap({ "--v": String(value) });

let uid = 0;

/**
 * An agent's plan against what really happens, as a live Gantt chart. Clean look only.
 * @tag tc-plan-vs-actual
 */
export class TcPlanVsActual extends TcElement {
  static override ui = "pvac";

  /** One look only: always Clean */
  override get resolvedLook(): Look {
    return "clean";
  }

  @property({ attribute: false }) accessor steps: PlanVsActualStep[] = [];
  /** The clock, in epoch ms – without it (and without `elapsed`) the chart reads the clock after it connects and ticks
   *  while the run goes on */
  @property({ attribute: false }) accessor now: number | undefined = undefined;
  /** When the run started, in epoch ms – defaults to the earliest step start */
  @property({ attribute: false }) accessor startedAt: number | undefined = undefined;
  /** Where the run is now as ms from its start; step start/end are then run-relative too. Takes precedence over `now` */
  @property({ attribute: false }) accessor elapsed: number | undefined = undefined;
  /** What the run is for – e.g. "Ship the pricing page" */
  @property() accessor task = "";
  /** The heading, and the list's name */
  @property() accessor heading = "Plan vs actual";
  /** Formats a time – defaults to 0:42 / 1:05 */
  @property({ attribute: false }) accessor formatTime: (ms: number) => string = clock;
  /** Formats a cost – defaults to dollars */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;

  /** @internal The step under the pointer or focus */
  @state() private accessor focusId: string | null = null;
  /** @internal The element's own clock, read after it connects */
  @state() private accessor tick: number | null = null;
  /** @internal Values on their way to a target after a jump */
  @state() private accessor gliding: Record<string, number> | null = null;
  /** @internal prefers-reduced-motion */
  @state() private accessor reduced = false;

  /** @internal */
  private labelId = `tc-pvac-${++uid}`;
  /** @internal The own clock's interval and what it was set up for */
  private interval = 0;
  private clockKey = "";
  /** @internal The glide (port of useGlide): what the last update showed, the targets, the keys that were gliding */
  private lastShown: Record<string, number> = {};
  private wasGliding = new Set<string>();
  private targets: Record<string, number> = {};
  private values: Record<string, number> = {};
  private frame = 0;
  private shown: { out: Record<string, number>; target: Record<string, number>; jumps: string[] } = { out: {}, target: {}, jumps: [] };
  private mq?: MediaQueryList;
  private onMotion = () => (this.reduced = !!this.mq?.matches);

  constructor() {
    super();
    // Off-screen, the running sheen stops (it also stops by itself after a few sweeps)
    new OffScreenController(this);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.mq = typeof window !== "undefined" ? window.matchMedia?.("(prefers-reduced-motion: reduce)") : undefined;
    if (this.mq) {
      this.reduced = this.mq.matches;
      this.mq.addEventListener?.("change", this.onMotion);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mq?.removeEventListener?.("change", this.onMotion);
    window.clearInterval(this.interval);
    this.interval = 0;
    this.clockKey = "";
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  /** @internal The glide: small moves are followed exactly, a jump glides there. Reads no clock */
  private glide(target: Record<string, number>, snap: number) {
    const out: Record<string, number> = {};
    const jumps: string[] = [];
    const gliding = this.gliding;
    for (const key in target) {
      const to = target[key];
      const from = this.lastShown[key];
      if (!this.reduced && gliding && key in gliding) out[key] = gliding[key];
      else if (!this.reduced && from !== undefined && !this.wasGliding.has(key) && Math.abs(to - from) > snap) {
        // A jump: hold where it was for this frame, the motion takes it from here
        out[key] = from;
        jumps.push(key);
      } else out[key] = to;
    }
    this.shown = { out, target, jumps };
    this.snap = snap;
    return out;
  }
  private snap = 1;
  /** @internal The axis range and the row count, set on the host as CSS variables after the update */
  private axis = { range: 0, rows: 0 };

  protected override updated() {
    this.style.setProperty("--tc-plan-vs-actual-range", String(this.axis.range));
    this.style.setProperty("--tc-plan-vs-actual-rows", String(this.axis.rows));

    // The own clock: read after connecting, and every second while the run goes on
    const own = this.elapsed === undefined && this.now === undefined;
    const allDone = this.steps.length > 0 && this.steps.every((s) => s.end !== undefined);
    const key = `${own}:${allDone}`;
    if (key !== this.clockKey) {
      this.clockKey = key;
      window.clearInterval(this.interval);
      this.interval = 0;
      if (own) {
        const read = () => (this.tick = Date.now());
        read();
        if (!allDone) this.interval = window.setInterval(read, 1000);
      }
    }

    // The glide, after the update: what was shown, and any jump to start
    const { out, target, jumps } = this.shown;
    this.lastShown = out;
    this.wasGliding = new Set(this.gliding ? Object.keys(this.gliding) : []);
    this.targets = target;
    if (jumps.length) {
      for (const k of jumps) this.values[k] = this.lastShown[k];
      if (!this.frame) {
        let last: number | null = null;
        const step = (t: number) => {
          const dt = last === null ? 16 : Math.min(64, t - last);
          last = t;
          const k = 1 - Math.exp(-dt / 110);
          const next: Record<string, number> = {};
          for (const name in this.values) {
            const to = this.targets[name];
            if (to === undefined) continue;
            const val = this.values[name] + (to - this.values[name]) * k;
            // A glide runs until it's practically there
            if (Math.abs(to - val) >= this.snap * 0.04) next[name] = val;
          }
          this.values = next;
          const still = Object.keys(next).length > 0;
          this.gliding = still ? next : null;
          this.frame = still ? requestAnimationFrame(step) : 0;
        };
        this.frame = requestAnimationFrame(step);
      }
    }
  }

  protected override render() {
    const given = this.steps;
    const { elapsed, formatTime, formatCost } = this;
    const nowProp = this.now;
    const focus = this.focusId;

    // The clock: `elapsed` (run-relative), else `now` (epoch ms), else our own, read after connecting
    const clockNow = elapsed ?? nowProp ?? this.tick;
    // The chart counts from the start of the run: epoch times are moved onto that axis
    const starts = given.flatMap((s) => (s.start === undefined ? [] : [s.start]));
    const origin = elapsed !== undefined ? 0 : (this.startedAt ?? (starts.length ? Math.min(...starts) : (clockNow ?? 0)));
    const steps = origin === 0 ? given : given.map((s) => ({ ...s, start: s.start === undefined ? undefined : s.start - origin, end: s.end === undefined ? undefined : s.end - origin }));
    // Before the clock is read: the latest moment the steps tell of
    const known = Math.max(0, ...steps.flatMap((s) => [s.start ?? 0, s.end ?? 0]));
    const now = clockNow === null ? known : Math.max(0, clockNow - origin);

    const raw = place(steps, now);
    const planEnd = Math.max(0, ...raw.map((p) => p.pe));
    const rawEta = Math.max(0, ...raw.map((p) => p.ae));
    const done = raw.filter((p) => p.status === "done").length;
    const finished = done === raw.length;

    // The axis: room after the later finish, in whole steps, so it only grows now and then – and glides when it does
    const tickStep = Math.max(planEnd, rawEta) > 240000 ? 60000 : 30000;
    const range = Math.ceil((Math.max(planEnd, rawEta, now) * 1.22) / tickStep) * tickStep || tickStep;
    const ticks = Array.from({ length: Math.floor(range / tickStep) }, (_, i) => (i + 1) * tickStep).filter((x) => x < range);
    this.axis = { range, rows: raw.length };

    // Real or expected starts and ends, and the expected finish – as shown
    const target: Record<string, number> = { eta: rawEta };
    for (const p of raw) {
      target[`${p.step.id}:s`] = p.as;
      target[`${p.step.id}:e`] = p.ae;
    }
    const g = this.glide(target, range * 0.012);
    const placed = raw.map((p) => (p.status === "waiting" ? { ...p, as: g[`${p.step.id}:s`], ae: g[`${p.step.id}:e`] } : p));
    const byId = new Map(placed.map((p) => [p.step.id, p]));
    const eta = g.eta;
    const late = rawEta - planEnd;

    // Time and money: where the run is against its plan
    const hasCost = steps.some((s) => s.cost !== undefined || s.planCost !== undefined);
    const spent = steps.reduce((n, s) => n + (s.cost ?? 0), 0);
    const budget = steps.reduce((n, s) => n + (s.planCost ?? 0), 0);

    // The step under the pointer: what it waits for and what waits for it
    const focused = focus ? byId.get(focus) : undefined;
    const links = focused
      ? [
          ...(focused.step.deps ?? []).flatMap((id) => (byId.get(id) ? [[byId.get(id)!, focused] as const] : [])),
          ...placed.filter((p) => p.step.deps?.includes(focused.step.id)).map((p) => [focused, p] as const),
        ]
      : [];
    const linked = new Set(links.flatMap(([a, b]) => [a.step.id, b.step.id]));

    const stateName = Math.abs(late) < SLACK ? "on" : late > 0 ? "late" : "early";
    // Once it's through: how late or early it finished
    const verdict = Math.abs(late) < SLACK ? "On plan" : late > 0 ? `${delta(late)} ${finished ? "late" : "behind"}` : `${delta(late).slice(1)} ${finished ? "early" : "ahead"}`;

    return html`
      <header class="ui-pvac__head">
        <span class="ui-pvac__mark">${chartMark}</span>
        <span class="ui-pvac__title" id=${this.labelId}>${this.heading}</span>
        ${this.task ? html`<span class="ui-pvac__task">${this.task}</span>` : nothing}
        <dl class="ui-pvac__stats">
          <div class="ui-pvac__stat" ?data-over=${!finished && now > planEnd}>
            <dt>Time</dt>
            <dd><b class="ui-pvac__live" ?data-live=${!finished}>${formatTime(finished ? rawEta : now)}</b><span> / ${formatTime(planEnd)}</span></dd>
          </div>
          ${hasCost
            ? html`<div class="ui-pvac__stat" ?data-over=${budget > 0 && spent > budget}>
                <dt>Cost</dt>
                <dd><b class="ui-pvac__live" ?data-live=${!finished}>${formatCost(spent)}</b>${budget > 0 ? html`<span> / ${formatCost(budget)}</span>` : nothing}</dd>
              </div>`
            : nothing}
        </dl>
        <span class="ui-pvac__verdict" data-state=${stateName}>${verdict}</span>
      </header>

      <div class="ui-pvac__body" role="list" aria-labelledby=${this.labelId} ?data-focus=${!!focus}>
        <div class="ui-pvac__layer" aria-hidden="true">
          ${repeat(
            ticks,
            (x) => x,
            (x) => html`<span class="ui-pvac__tick" style=${v(x)}><span>${formatTime(x)}</span></span>`,
          )}
          ${Math.abs(late) >= SLACK ? html`<span class="ui-pvac__gap" data-state=${late > 0 ? "late" : "early"} style=${at(Math.min(planEnd, eta), Math.max(planEnd, eta))}></span>` : nothing}
          <span class="ui-pvac__finish" data-kind="plan" data-side=${late < 0 ? "right" : "left"} style=${v(planEnd)}><span>Plan ${formatTime(planEnd)}</span></span>
          <span class="ui-pvac__finish" data-kind="eta" data-side=${late < 0 ? "left" : "right"} data-state=${stateName} ?data-hidden=${Math.abs(late) < SLACK} style=${v(eta)}
            ><span>${finished ? "Done" : "ETA"} ${formatTime(rawEta)}</span></span
          >
          ${!finished ? html`<span class="ui-pvac__now" style=${v(now)}></span>` : nothing}
        </div>

        <div class="ui-pvac__axis" aria-hidden="true">Step</div>

        ${repeat(
          placed,
          (p) => p.step.id,
          (p) => {
            const { step, status } = p;
            const planned = step.plan;
            const took = status === "done" ? p.ae - p.as : status === "running" ? now - p.as : 0;
            const over = status !== "waiting" && took - planned >= SLACK;
            const diff = status === "done" ? took - planned : over ? took - planned : 0;
            const end = status === "running" ? now : p.ae;
            // Near the right edge the numbers sit before the bar instead of after it
            const side = Math.max(p.ae, p.pe) / range > 0.8 ? "before" : "after";
            const label = `${step.title}: ${status === "done" ? `took ${formatTime(took)}, planned ${formatTime(planned)}` : status === "running" ? `running for ${formatTime(took)} of ${formatTime(planned)} planned` : `starts in about ${formatTime(Math.max(0, p.as - now))}, planned ${formatTime(planned)}`}${step.cost !== undefined ? `, ${formatCost(step.cost)}` : ""}${dependsText(step, byId)}`;
            return html`<div
              class="ui-pvac__row"
              role="listitem"
              tabindex="0"
              data-status=${status}
              ?data-dim=${!!focus && !linked.has(step.id) && focus !== step.id}
              ?data-focus=${focus === step.id}
              aria-label=${label}
              @pointerenter=${() => (this.focusId = step.id)}
              @pointerleave=${() => this.focusId === step.id && (this.focusId = null)}
              @focus=${() => (this.focusId = step.id)}
              @blur=${() => this.focusId === step.id && (this.focusId = null)}
            >
              <span class="ui-pvac__name">
                <span class="ui-pvac__state" data-status=${status}>${stateIcon(status)}</span>
                ${step.icon ? html`<span class="ui-pvac__icon">${step.icon.cloneNode(true)}</span>` : nothing}
                <span class="ui-pvac__label">${step.title}</span>
              </span>
              <span class="ui-pvac__track">
                ${status === "waiting"
                  ? html`<span class="ui-pvac__bar" data-kind="forecast" style=${at(p.as, p.ae)}></span>`
                  : html`${status === "running" && !over ? html`<span class="ui-pvac__bar" data-kind="forecast" data-rest="" style=${at(now, p.ae)}></span>` : nothing}<span
                        class="ui-pvac__bar"
                        data-kind="actual"
                        data-status=${status}
                        ?data-over=${over}
                        style=${at(p.as, end)}
                      ></span
                      >${over ? html`<span class="ui-pvac__bar" data-kind="over" data-status=${status} style=${at(p.as + planned, end)}></span>` : nothing}`}
                <span class="ui-pvac__ghost" style=${at(p.ps, p.pe)}></span>
                <span class="ui-pvac__tag" data-side=${side} data-status=${status} style=${styleMap({ "--s": String(side === "after" ? Math.max(p.ae, p.pe) : Math.min(p.as, p.ps)) })}
                  >${status === "waiting"
                    ? formatTime(planned)
                    : html`<span class="ui-pvac__took">${formatTime(took)}</span>${(status === "done" || over) && Math.abs(diff) >= SLACK
                          ? html`<span class="ui-pvac__diff" ?data-late=${diff > 0}>${delta(diff)}</span>`
                          : nothing}`}${step.cost !== undefined && focus === step.id ? html`<span class="ui-pvac__cost">${formatCost(step.cost)}</span>` : nothing}</span
                >
              </span>
            </div>`;
          },
        )}

        <div class="ui-pvac__links" aria-hidden="true">
          ${repeat(
            links,
            ([a, b]) => `${a.step.id}-${b.step.id}`,
            ([a, b]) =>
              html`<span
                class="ui-pvac__link"
                style=${styleMap({ "--a0": String(a.as), "--a1": String(a.ae), "--b0": String(Math.max(a.ae, b.as)), "--from": String(a.index), "--to": String(b.index) })}
              ></span>`,
          )}
        </div>

        <div class="ui-pvac__foot" aria-hidden="true">
          <span class="ui-pvac__key" data-kind="plan">Plan</span>
          <span class="ui-pvac__key" data-kind="actual">Actual</span>
          <span class="ui-pvac__key" data-kind="over">Over plan</span>
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* The axis glides when it grows */
@property --tc-plan-vs-actual-range { syntax: "<number>"; inherits: true; initial-value: 60000; }

/* Colors, sizes and motion as variables – override them on [data-ui="pvac"] */
[data-ui="pvac"] {
  --tc-plan-vs-actual-ghost: light-dark(rgba(0, 0, 0, 0.26), rgba(255, 255, 255, 0.3));
  --tc-plan-vs-actual-link: light-dark(rgba(0, 0, 0, 0.5), rgba(255, 255, 255, 0.55));
  /* The real bar */
  --tc-plan-vs-actual-actual-bg: light-dark(rgba(91, 91, 214, 0.1), rgba(130, 130, 255, 0.16));
  --tc-plan-vs-actual-actual-edge: light-dark(rgba(91, 91, 214, 0.3), rgba(130, 130, 255, 0.38));
  --tc-plan-vs-actual-actual-mark: light-dark(rgba(91, 91, 214, 0.72), rgba(140, 140, 255, 0.8));
  /* Where a waiting step will run */
  --tc-plan-vs-actual-forecast-bg: light-dark(rgba(0, 0, 0, 0.035), rgba(255, 255, 255, 0.05));
  --tc-plan-vs-actual-forecast-edge: light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.09));
  /* The slip between plan and actual: late in amber, early in green */
  --tc-plan-vs-actual-gap-late-bg: light-dark(rgba(255, 140, 0, 0.07), rgba(255, 140, 30, 0.07));
  --tc-plan-vs-actual-gap-early-bg: light-dark(rgba(0, 164, 51, 0.06), rgba(40, 200, 110, 0.06));
  /* The now line */
  --tc-plan-vs-actual-now: light-dark(rgba(0, 96, 226, 0.4), rgba(91, 154, 255, 0.55));
  /* The quiet chip behind the verdict and the plan's finish label */
  --tc-plan-vs-actual-chip: light-dark(rgba(0, 0, 0, 0.045), rgba(255, 255, 255, 0.07));
  --tc-plan-vs-actual-spin: 900ms;
  --tc-plan-vs-actual-glow: 1100ms;
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-plan-vs-actual-row: 32px;
  --tc-plan-vs-actual-bar: 14px;
  --tc-plan-vs-actual-axis: 30px;
  --tc-plan-vs-actual-foot: 40px;
  --tc-plan-vs-actual-name: 188px;
  --tc-plan-vs-actual-pad: 16px;
  --tc-plan-vs-actual-gap: 14px;
  --tc-plan-vs-actual-end: 16px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--tc-card-radius, 10px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #1c1c1e));
  box-shadow: var(--tc-card-shadow, 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  container: ui-pvac / inline-size;
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--tc-font-size-md, 13px);
  font-weight: var(--tc-font-weight-regular, 400);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-secondary, light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66)));
  text-align: left;
  -webkit-font-smoothing: antialiased;
  transition: --tc-plan-vs-actual-range var(--tc-duration-reveal, 700ms) var(--tc-ease-move, cubic-bezier(0.32, 0.72, 0.24, 1));
}
[data-ui="pvac"] *, [data-ui="pvac"] *::before, [data-ui="pvac"] *::after { box-sizing: border-box; }
[data-ui="pvac"] svg { display: block; flex: none; }

/* ----- The bar on top: what the run is for, how far it is, and how late ----- */
.ui-pvac__head { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 12px 14px 12px 16px; border-bottom: var(--tc-hairline, 0.5px) solid var(--tc-divider, light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08))); }
.ui-pvac__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text, light-dark(#0058cf, #70b8ff)); }
.ui-pvac__title { flex: none; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-strong, light-dark(#000000, #ffffff)); }
.ui-pvac__task { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted, light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52))); white-space: nowrap; text-overflow: ellipsis; }
/* Time and cost so far against the plan – the numbers turn amber once they pass it */
.ui-pvac__stats { display: flex; flex: none; align-items: center; gap: 14px; margin: 0 4px 0 0; font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-pvac__stat { display: flex; align-items: baseline; gap: 6px; }
.ui-pvac__stat dt { color: var(--tc-text-muted, light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52))); }
.ui-pvac__stat dd { margin: 0; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9))); transition: color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease); }
.ui-pvac__stat dd > span { font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52))); }
.ui-pvac__stat[data-over] dd { color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-pvac__live { font-weight: inherit; }
.ui-pvac__verdict { flex: none; min-width: 92px; height: var(--tc-pill-h-lg, 20px); padding: 0 var(--tc-pill-px-lg, 8px); border-radius: var(--tc-pill-radius, 5px); background: var(--tc-plan-vs-actual-chip); font-size: var(--tc-pill-font-size-lg, 12px); font-weight: var(--tc-pill-font-weight, 500); line-height: var(--tc-pill-h-lg, 20px); color: var(--tc-text-secondary, light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66))); text-align: center; font-variant-numeric: tabular-nums; white-space: nowrap; transition: background-color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease); }
.ui-pvac__verdict[data-state="late"] { background: var(--tc-status-warning-bg, light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15))); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-pvac__verdict[data-state="early"] { background: var(--tc-status-success-bg, light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12))); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }

/* ----- The chart ----- */
.ui-pvac__body { position: relative; padding-bottom: 0; }
/* Everything on the time axis is placed in calc() against the gliding range */
.ui-pvac__layer { position: absolute; top: 0; bottom: 0; left: calc(var(--tc-plan-vs-actual-pad) + var(--tc-plan-vs-actual-name) + var(--tc-plan-vs-actual-gap)); right: var(--tc-plan-vs-actual-end); pointer-events: none; }
.ui-pvac__tick { position: absolute; top: 0; bottom: var(--tc-plan-vs-actual-foot); left: calc(var(--v) * 100% / var(--tc-plan-vs-actual-range)); width: var(--tc-hairline, 0.5px); background: var(--tc-border-subtle, light-dark(rgba(0, 0, 0, 0.045), rgba(255, 255, 255, 0.05))); animation: ui-pvac-fade var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease) both; }
.ui-pvac__tick > span { position: absolute; top: 7px; left: 6px; font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52))); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-pvac__now { position: absolute; top: var(--tc-plan-vs-actual-axis); bottom: var(--tc-plan-vs-actual-foot); left: calc(var(--v) * 100% / var(--tc-plan-vs-actual-range)); width: 1px; background: var(--tc-plan-vs-actual-now); }
.ui-pvac__now::before { content: ""; position: absolute; top: -2.5px; left: -2px; width: 5px; height: 5px; border-radius: 50%; background: var(--tc-accent-text, light-dark(#0058cf, #70b8ff)); box-shadow: 0 0 0 3px var(--tc-surface-raised, light-dark(#ffffff, #1c1c1e)); }

/* The planned finish (dashed) and the expected one (solid, it moves), with the gap between them tinted */
.ui-pvac__gap { position: absolute; top: var(--tc-plan-vs-actual-axis); bottom: calc(var(--tc-plan-vs-actual-foot) - 1px); left: calc(var(--s) * 100% / var(--tc-plan-vs-actual-range)); width: calc(var(--d) * 100% / var(--tc-plan-vs-actual-range)); background: var(--tc-plan-vs-actual-gap-late-bg); animation: ui-pvac-fade var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease) both; }
.ui-pvac__gap[data-state="early"] { background: var(--tc-plan-vs-actual-gap-early-bg); }
.ui-pvac__finish { position: absolute; top: var(--tc-plan-vs-actual-axis); bottom: calc(var(--tc-plan-vs-actual-foot) - 6px); left: calc(var(--v) * 100% / var(--tc-plan-vs-actual-range)); width: 0; border-left: 1px dashed var(--tc-plan-vs-actual-ghost); }
.ui-pvac__finish[data-kind="eta"] { border-left: 1px solid var(--tc-status-warning-border, color-mix(in srgb, light-dark(#c2710c, #f5a524) 40%, transparent)); }
.ui-pvac__finish[data-kind="eta"][data-state="early"] { border-left-color: rgba(0, 140, 50, 0.45); }
.ui-pvac__finish[data-kind="eta"][data-hidden] { opacity: 0; }
.ui-pvac__finish > span { position: absolute; top: calc(100% + 2px); height: 20px; padding: 0 6px; border-radius: var(--tc-radius-badge, 5px); font-size: var(--tc-font-size-sm, 12px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-normal, 20px); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* The earlier line's label ends at it, the later one's starts at it – they never overlap */
.ui-pvac__finish[data-side="left"] > span { right: -1px; border-top-right-radius: 0; }
.ui-pvac__finish[data-side="right"] > span { left: -1px; border-top-left-radius: 0; }
.ui-pvac__finish[data-kind="plan"] > span { background: var(--tc-plan-vs-actual-chip); color: var(--tc-text-secondary, light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66))); }
.ui-pvac__finish[data-kind="eta"] > span { background: var(--tc-status-warning-bg, light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15))); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-pvac__finish[data-kind="eta"][data-state="early"] > span { background: var(--tc-status-success-bg, light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12))); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-pvac__finish[data-kind="plan"]:has(~ .ui-pvac__finish[data-hidden]) > span { right: auto; left: 50%; transform: translateX(-50%); border-radius: var(--tc-radius-badge, 5px); }

/* What a step waits for: an elbow down from the end of one bar to the start of the other – over the rows, so no number hides it */
.ui-pvac__links { position: absolute; top: 0; bottom: 0; z-index: 1; left: calc(var(--tc-plan-vs-actual-pad) + var(--tc-plan-vs-actual-name) + var(--tc-plan-vs-actual-gap)); right: var(--tc-plan-vs-actual-end); pointer-events: none; }
.ui-pvac__link {
  position: absolute;
  top: calc(var(--tc-plan-vs-actual-axis) + var(--from) * var(--tc-plan-vs-actual-row) + var(--tc-plan-vs-actual-row) / 2 + var(--tc-plan-vs-actual-bar) / 2);
  /* It leaves at the end of the bar above – or, when the step below starts right there, a little further left along
     its bottom edge, so there's always a turn – and ends exactly at the start of the step's bar */
  --tc-plan-vs-actual-x0: max(calc(var(--a0) * 100% / var(--tc-plan-vs-actual-range) + 3px), min(calc(var(--a1) * 100% / var(--tc-plan-vs-actual-range)), calc(var(--b0) * 100% / var(--tc-plan-vs-actual-range) - 12px)));
  left: calc(var(--tc-plan-vs-actual-x0) - 0.5px);
  width: calc(var(--b0) * 100% / var(--tc-plan-vs-actual-range) - var(--tc-plan-vs-actual-x0) + 0.5px);
  height: calc((var(--to) - var(--from)) * var(--tc-plan-vs-actual-row) - var(--tc-plan-vs-actual-bar) / 2);
  border-bottom-left-radius: var(--tc-radius-xs, 4px);
  border-left: 1px solid var(--tc-plan-vs-actual-link);
  border-bottom: 1px solid var(--tc-plan-vs-actual-link);
  animation: ui-pvac-draw var(--tc-duration-moderate, 260ms) var(--tc-ease-move, cubic-bezier(0.32, 0.72, 0.24, 1)) both;
}
/* Where it leaves: a small open square; where it arrives: the same square, filled – both centred on the line */
.ui-pvac__link::before, .ui-pvac__link::after { content: ""; position: absolute; width: 5px; height: 5px; border: 1px solid var(--tc-plan-vs-actual-link); border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-surface-raised, light-dark(#ffffff, #1c1c1e)); }
.ui-pvac__link::before { top: -2.5px; left: -3px; }
.ui-pvac__link::after { right: -2.5px; bottom: -3px; background: var(--tc-plan-vs-actual-link); }

.ui-pvac__axis { display: flex; align-items: center; height: var(--tc-plan-vs-actual-axis); padding-left: var(--tc-plan-vs-actual-pad); border-bottom: var(--tc-hairline, 0.5px) solid var(--tc-divider, light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08))); font-size: var(--tc-caption-font-size, 10px); font-weight: var(--tc-caption-font-weight, 500); line-height: var(--tc-caption-line-height, 16px); letter-spacing: var(--tc-caption-tracking, 0.05em); text-transform: var(--tc-caption-transform, uppercase); color: var(--tc-caption-color, light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52))); }

/* ----- One row: the step on the left, its bars on the right ----- */
.ui-pvac__row {
  position: relative;
  display: grid;
  grid-template-columns: var(--tc-plan-vs-actual-name) minmax(0, 1fr);
  column-gap: var(--tc-plan-vs-actual-gap);
  height: var(--tc-plan-vs-actual-row);
  padding: 0 var(--tc-plan-vs-actual-end) 0 var(--tc-plan-vs-actual-pad);
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-pvac__row:hover, .ui-pvac__row[data-focus] { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))); }
.ui-pvac__row:focus { outline: none; }
.ui-pvac__row:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#0060e2, #5b9aff)); outline-offset: calc(-1 * var(--tc-focus-ring-width, 2px)); }
/* Another row is pointed at or focused: this row's bars step back – its text stays readable */
.ui-pvac__row[data-dim] :is(.ui-pvac__bar, .ui-pvac__ghost, .ui-pvac__state, .ui-pvac__icon) { opacity: 0.45; }
.ui-pvac__row :is(.ui-pvac__bar, .ui-pvac__ghost, .ui-pvac__state, .ui-pvac__icon) { transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease); }
.ui-pvac__name { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ui-pvac__state { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-icon-muted, light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46))); transition: color var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease); }
.ui-pvac__state[data-status="running"] { color: var(--tc-accent-text, light-dark(#0058cf, #70b8ff)); }
.ui-pvac__state[data-status="done"] { color: var(--tc-text-muted, light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52))); }
.ui-pvac__state > svg { animation: ui-pvac-pop var(--tc-duration-moderate, 260ms) var(--tc-ease-move, cubic-bezier(0.32, 0.72, 0.24, 1)) both; }
.ui-pvac__spin { animation: ui-pvac-spin var(--tc-plan-vs-actual-spin) linear infinite !important; }
.ui-pvac__icon { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-avatar-radius-agent, 6px); background: var(--tc-surface-raised, light-dark(#ffffff, #1c1c1e)); box-shadow: var(--tc-shadow-raised, 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-pvac__icon > svg { width: 12px; height: 12px; }
.ui-pvac__label { min-width: 0; overflow: hidden; color: var(--tc-text-primary, light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9))); white-space: nowrap; text-overflow: ellipsis; transition: color var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease); }
.ui-pvac__row[data-status="waiting"] .ui-pvac__label { color: var(--tc-text-secondary, light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66))); }

.ui-pvac__track { position: relative; min-width: 0; height: var(--tc-plan-vs-actual-row); }
.ui-pvac__bar, .ui-pvac__ghost {
  position: absolute;
  top: calc(50% - var(--tc-plan-vs-actual-bar) / 2);
  left: calc(var(--s) * 100% / var(--tc-plan-vs-actual-range));
  width: max(2px, calc(var(--d) * 100% / var(--tc-plan-vs-actual-range)));
  height: var(--tc-plan-vs-actual-bar);
  border-radius: var(--tc-radius-xs, 4px);
}
/* The real bar: a light tint with a hairline edge */
.ui-pvac__bar { overflow: hidden; background: var(--tc-plan-vs-actual-kind-bg); box-shadow: inset 0 0 0 var(--tc-hairline, 0.5px) var(--tc-plan-vs-actual-kind-edge); }
.ui-pvac__bar[data-kind="actual"] { --tc-plan-vs-actual-kind-bg: var(--tc-plan-vs-actual-actual-bg); --tc-plan-vs-actual-kind-edge: var(--tc-plan-vs-actual-actual-edge); }
.ui-pvac__row:is(:hover, [data-focus]) .ui-pvac__bar[data-kind="actual"] { box-shadow: inset 0 0 0 1px var(--tc-plan-vs-actual-actual-mark); }
/* The part past the plan, on top of the real bar */
.ui-pvac__bar[data-kind="over"] { --tc-plan-vs-actual-kind-bg: var(--tc-status-warning-bg, light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15))); --tc-plan-vs-actual-kind-edge: var(--tc-status-warning-border, color-mix(in srgb, light-dark(#c2710c, #f5a524) 40%, transparent)); border-top-left-radius: 0; border-bottom-left-radius: 0; background: linear-gradient(var(--tc-plan-vs-actual-kind-bg), var(--tc-plan-vs-actual-kind-bg)), var(--tc-surface-raised, light-dark(#ffffff, #1c1c1e)); animation: ui-pvac-fade var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease) both; }
/* Where a waiting step will run – it slides when the steps before it run over */
.ui-pvac__bar[data-kind="forecast"] { --tc-plan-vs-actual-kind-bg: var(--tc-plan-vs-actual-forecast-bg); --tc-plan-vs-actual-kind-edge: var(--tc-plan-vs-actual-forecast-edge); animation: ui-pvac-fade var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease) both; }
/* What's left of a running step, right after its real bar */
.ui-pvac__bar[data-rest] { border-top-left-radius: 0; border-bottom-left-radius: 0; animation: none; }
/* Running: a sheen sweeps along and the leading edge glows – on the amber part once it runs over. The sheen moves
   with transform (composited), runs three times and stops; off-screen it pauses */
.ui-pvac__bar[data-status="running"]:not([data-over])::before,
.ui-pvac__bar[data-kind="over"][data-status="running"]::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--tc-surface-raised, light-dark(#ffffff, #1c1c1e)), transparent) right center / 60px 100% no-repeat; opacity: 0.7; transform: translateX(-100%); animation: ui-pvac-sweep var(--tc-duration-shimmer, 1600ms) linear 3; will-change: transform; }
.ui-pvac__bar[data-status="running"]:not([data-over])::after,
.ui-pvac__bar[data-kind="over"][data-status="running"]::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: min(28px, 100%); background: linear-gradient(90deg, transparent, var(--tc-plan-vs-actual-kind-edge)); animation: ui-pvac-glow var(--tc-plan-vs-actual-glow) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 4 alternate; }
[data-ui="pvac"][data-offscreen] .ui-pvac__bar::before, [data-ui="pvac"][data-offscreen] .ui-pvac__bar::after { animation-play-state: paused; }
/* The plan: a dashed ghost on top of everything */
.ui-pvac__ghost { border: 1px dashed var(--tc-plan-vs-actual-ghost); pointer-events: none; }

/* The numbers: how long it took and how far off the plan – on the card's color, so lines pass behind them */
.ui-pvac__tag { position: absolute; top: calc(50% - 9px); display: flex; align-items: center; gap: 5px; height: 18px; padding: 0 4px; border-radius: var(--tc-radius-xs, 4px); background: var(--tc-surface-raised, light-dark(#ffffff, #1c1c1e)); font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-secondary, light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66))); white-space: nowrap; font-variant-numeric: tabular-nums; pointer-events: none; }
.ui-pvac__tag[data-side="after"] { left: calc(var(--s) * 100% / var(--tc-plan-vs-actual-range) + 3px); }
.ui-pvac__tag[data-side="before"] { right: calc(100% - var(--s) * 100% / var(--tc-plan-vs-actual-range) + 3px); }
.ui-pvac__tag[data-status="waiting"] { color: var(--tc-text-muted, light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52))); }
.ui-pvac__cost { color: var(--tc-text-secondary, light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66))); animation: ui-pvac-pop var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.32, 0.72, 0.24, 1)) both; }
.ui-pvac__cost::before { content: "·"; margin-right: 5px; color: var(--tc-text-disabled, light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3))); }
.ui-pvac__row:is(:hover, [data-focus]) .ui-pvac__tag { background: none; }
.ui-pvac__took { color: var(--tc-text-primary, light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9))); }
/* Off the plan: a small pill tinted in its color – green when quicker, amber when slower */
.ui-pvac__diff { height: 16px; padding: 0 4px; border-radius: var(--tc-radius-xs, 4px); background: var(--tc-status-success-bg, light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12))); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); animation: ui-pvac-pop var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.32, 0.72, 0.24, 1)) both; }
.ui-pvac__diff[data-late] { background: var(--tc-status-warning-bg, light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15))); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }

/* ----- The key ----- */
.ui-pvac__foot { display: flex; align-items: center; gap: 14px; height: var(--tc-plan-vs-actual-foot); margin-top: 4px; padding-left: var(--tc-plan-vs-actual-pad); border-top: var(--tc-hairline, 0.5px) solid var(--tc-divider, light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08))); font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52))); }
.ui-pvac__key { display: flex; align-items: center; gap: 6px; }
.ui-pvac__key::before { content: ""; width: 14px; height: 8px; border-radius: var(--tc-radius-2xs, 2px); }
.ui-pvac__key[data-kind="plan"]::before { border: 1px dashed var(--tc-plan-vs-actual-ghost); }
.ui-pvac__key[data-kind="actual"]::before { background: var(--tc-plan-vs-actual-actual-bg); box-shadow: inset 0 0 0 0.5px var(--tc-plan-vs-actual-actual-edge); }
.ui-pvac__key[data-kind="over"]::before { background: var(--tc-status-warning-bg, light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15))); box-shadow: inset 0 0 0 0.5px var(--tc-status-warning-border, color-mix(in srgb, light-dark(#c2710c, #f5a524) 40%, transparent)); }

/* ----- Narrow: a shorter name column; the task, the key and the finish labels make room (the bar on top says how late) ----- */
@container ui-pvac (max-width: 560px) {
  .ui-pvac__body { --tc-plan-vs-actual-name: 120px; --tc-plan-vs-actual-pad: 12px; --tc-plan-vs-actual-gap: 10px; --tc-plan-vs-actual-end: 12px; --tc-plan-vs-actual-foot: 14px; }
  .ui-pvac__finish > span, .ui-pvac__foot { visibility: hidden; }
  .ui-pvac__head { padding: 10px 12px; }
  .ui-pvac__task { display: none; }
  .ui-pvac__head { flex-wrap: wrap; row-gap: 6px; }
  .ui-pvac__verdict { margin-left: auto; }
  .ui-pvac__stats { order: 3; flex-basis: 100%; gap: 16px; margin: 0; }
  .ui-pvac__icon { display: none; }
  .ui-pvac__foot .ui-pvac__key { display: none; }
  .ui-pvac__tick:nth-child(even) > span { display: none; }
}

@keyframes ui-pvac-fade { from { opacity: 0; } }
@keyframes ui-pvac-pop { from { opacity: 0; transform: scale(0.85); } }
@keyframes ui-pvac-draw { from { opacity: 0; clip-path: inset(0 100% 0 0); } to { opacity: 1; clip-path: inset(-4px -4px -4px -4px); } }
@keyframes ui-pvac-sweep { from { transform: translateX(-100%); } to { transform: translateX(60px); } }
@keyframes ui-pvac-glow { from { opacity: 0.45; } to { opacity: 1; } }
@keyframes ui-pvac-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  [data-ui="pvac"] { transition: none; }
  [data-ui="pvac"] *, [data-ui="pvac"] *::before, [data-ui="pvac"] *::after { animation: none !important; transition: none !important; }
}

`;
}

if (!customElements.get("tc-plan-vs-actual")) customElements.define("tc-plan-vs-actual", TcPlanVsActual);

declare global {
  interface HTMLElementTagNameMap {
    "tc-plan-vs-actual": TcPlanVsActual;
  }
}
