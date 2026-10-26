import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { RollingController } from "./internal/controllers";

/*
 * <tc-reliance-gauge> – whether people's trust in an AI matches how well it performs. A dial shows the
 * reliance–accuracy index (0–1: 1 is trust that matches the AI's accuracy exactly) with its trend over recent windows;
 * behaviour signals sit as thin meters against two thresholds – spot-check and mandatory; overtrust episodes (relied
 * on, then found wrong) and undertrust episodes (overridden, then found right) are counted; and the card recommends a
 * review level with one sentence saying why.
 *
 *   <tc-reliance-gauge scope="Last 30 days · 412 answers" reliance="0.91" accuracy="0.74" review-level="routine"
 *     .trend=${[{ label: "Week 1", index: 0.88 }]} .signals=${[{ id: "accept", label: "Accepted unedited", value: 0.72 }]}>
 *   </tc-reliance-gauge>
 *
 * The recommendation comes from the signals (the worst threshold any of them passes) and the index band; `recommended`
 * and `reason` override it. With `review-level` set to something else, the footer offers to switch: a cancelable
 * `tc-review-level-change` ({ level, previous }). With `browsable`, the episode counts are buttons that fire
 * `tc-episodes-open` ({ kind }). Numbers roll to new values; the element reads no clock.
 */

export type RelianceSignal = {
  id: string;
  /** "Accepted unedited", "Time to accept" */
  label: string;
  /** 0–1 – higher means more reason to review */
  value: number;
  /** What the value measures, a quiet line under the label */
  hint?: string;
  /** This signal's own spot-check threshold (0–1) – defaults to the element's */
  spotCheckAt?: number;
  /** This signal's own mandatory threshold (0–1) – defaults to the element's */
  mandatoryAt?: number;
};

/** One recent window of the index – a week, a batch, a release */
export type RelianceWindow = { label: string; index: number };

export type RelianceReviewLevel = "routine" | "spot-check" | "mandatory";
export type RelianceBand = "calibrated" | "drifting" | "miscalibrated";
export type RelianceDirection = "overtrust" | "undertrust" | "matched";
export type RelianceEpisodeKind = "overtrust" | "undertrust";
export type RelianceSignalState = "ok" | "spot-check" | "mandatory";

/** Details of the events */
export type RelianceReviewLevelChange = { level: RelianceReviewLevel; previous: RelianceReviewLevel };
export type RelianceEpisodesOpen = { kind: RelianceEpisodeKind };

const RANK: Record<RelianceReviewLevel, number> = { routine: 0, "spot-check": 1, mandatory: 2 };
const DEFAULT_LEVELS: Record<RelianceReviewLevel, string> = { routine: "Routine review", "spot-check": "Spot-check", mandatory: "Mandatory review" };
const BANDS: Record<RelianceBand, string> = { calibrated: "Calibrated", drifting: "Drifting", miscalibrated: "Miscalibrated" };
/** Reliance and accuracy closer than this read as matched */
const MATCHED = 0.05;

let instances = 0;

/* ---------- Helpers ---------- */

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const formats = new Map<string, Intl.NumberFormat>();
const numberFormat = (locale: string, options: Intl.NumberFormatOptions) => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.NumberFormat(locale, options)));
  return f;
};

/** A point on the dial's half circle: t = 0 left, 1 right; r from the centre (60, 60) */
const arcPoint = (t: number, r: number) => {
  const a = Math.PI * (1 - t);
  return [60 + r * Math.cos(a), 60 - r * Math.sin(a)] as const;
};

/* ---------- Icons ---------- */

const eyeIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M1.8 8s2.3-4.3 6.2-4.3S14.2 8 14.2 8 11.9 12.3 8 12.3 1.8 8 1.8 8z"></path><circle cx="8" cy="8" r="1.9"></circle>`}</svg>`;
const checkIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="5.8"></circle><path d="m5.6 8.1 1.7 1.7 3.2-3.4"></path>`}</svg>`;
const warnIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 2.6 1.9 13.1h12.2z"></path><path d="M8 6.6v3M8 11.4h.01"></path>`}</svg>`;
const shieldIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 2.2 3.2 4v3.6c0 3 2 5 4.8 6.2 2.8-1.2 4.8-3.2 4.8-6.2V4z"></path><path d="M8 5.6v3M8 10.6h.01"></path>`}</svg>`;
const upIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7"></path>`}</svg>`;
const downIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 3.5v9M4.5 9 8 12.5 11.5 9"></path>`}</svg>`;

/**
 * Whether trust in an AI matches its performance: a reliance–accuracy dial with its trend, signals against review
 * thresholds, overtrust and undertrust episodes, and the recommended review level.
 * @tag tc-reliance-gauge
 * @fires tc-review-level-change - The footer's switch was pressed (detail: { level: "routine" | "spot-check" | "mandatory", previous: same }); cancelable – prevent it to keep `reviewLevel` yourself
 * @fires tc-episodes-open - An episode count was pressed, with `browsable` set (detail: { kind: "overtrust" | "undertrust" })
 */
export class TcRelianceGauge extends TcElement {
  static override ui = "rlg";

  /** The heading, and the region's name */
  @property() accessor heading = "Reliance";
  /** What the numbers cover, a quiet line under the heading – e.g. "Last 30 days · 412 answers" */
  @property() accessor scope = "";
  /** The reliance–accuracy index, 0–1 (1: trust matches accuracy). Unset, it is 1 − |reliance − accuracy| */
  @property({ type: Number }) accessor index: number | undefined = undefined;
  /** How often people relied on the AI's output, 0–1 – compared with `accuracy` to say which way trust leans */
  @property({ type: Number }) accessor reliance: number | undefined = undefined;
  /** How often the AI's output was right, 0–1 */
  @property({ type: Number }) accessor accuracy: number | undefined = undefined;
  /** The index over recent windows, oldest first – drawn as the trend line */
  @property({ attribute: false }) accessor trend: RelianceWindow[] = [];
  /** Index from which the dial reads "Calibrated" (0–1) */
  @property({ type: Number, attribute: "calibrated-at" }) accessor calibratedAt = 0.9;
  /** Index from which the dial reads "Drifting"; below it, "Miscalibrated" (0–1) */
  @property({ type: Number, attribute: "drift-at" }) accessor driftAt = 0.8;
  /** Behaviour signals, each a 0–1 value where higher means more reason to review */
  @property({ attribute: false }) accessor signals: RelianceSignal[] = [];
  /** Signal value from which a spot-check is recommended (0–1) */
  @property({ type: Number, attribute: "spot-check-at" }) accessor spotCheckAt = 0.6;
  /** Signal value from which review of every output is recommended (0–1) */
  @property({ type: Number, attribute: "mandatory-at" }) accessor mandatoryAt = 0.8;
  /** Overtrust episodes: output relied on, then found wrong */
  @property({ type: Number }) accessor overtrust = 0;
  /** Undertrust episodes: output overridden, then found right */
  @property({ type: Number }) accessor undertrust = 0;
  /** The episode counts are buttons that fire tc-episodes-open */
  @property({ type: Boolean }) accessor browsable = false;
  /** The review level in force – when it differs from the recommendation, the footer offers to switch */
  @property({ attribute: "review-level" }) accessor reviewLevel: RelianceReviewLevel | undefined = undefined;
  /** Overrides the recommended level worked out from the signals and the index */
  @property() accessor recommended: RelianceReviewLevel | undefined = undefined;
  /** Overrides the sentence that explains the recommendation */
  @property() accessor reason = "";
  /** Names of the review levels */
  @property({ attribute: false }) accessor levelLabels: Partial<Record<RelianceReviewLevel, string>> = {};
  /** Locale for numbers */
  @property() accessor locale = "en-US";

  /** @internal The trend window being read */
  @state() private accessor point: number | null = null;
  /** @internal */
  @state() private accessor message = "";

  private readonly uid = `tc-rlg${++instances}`;
  private lastLevel: RelianceReviewLevel | null = null;
  private roll = new RollingController(this, () => this.targets(), 650);

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  /* ---------- State ---------- */

  /** @internal The index shown: given, or worked out from reliance and accuracy */
  private get value(): number | undefined {
    if (this.index !== undefined && Number.isFinite(this.index)) return clamp01(this.index);
    if (this.reliance !== undefined && this.accuracy !== undefined) return clamp01(1 - Math.abs(this.reliance - this.accuracy));
    return undefined;
  }

  /** @internal */
  private bandOf(v: number): RelianceBand {
    return v >= this.calibratedAt ? "calibrated" : v >= this.driftAt ? "drifting" : "miscalibrated";
  }

  /** @internal Which way trust leans, when reliance and accuracy are known */
  private get direction(): RelianceDirection | undefined {
    if (this.reliance === undefined || this.accuracy === undefined) return undefined;
    const d = this.reliance - this.accuracy;
    return d > MATCHED ? "overtrust" : d < -MATCHED ? "undertrust" : "matched";
  }

  /** @internal */
  private limits(s: RelianceSignal) {
    return { spot: s.spotCheckAt ?? this.spotCheckAt, mandatory: s.mandatoryAt ?? this.mandatoryAt };
  }

  /** @internal */
  private stateOf(s: RelianceSignal): RelianceSignalState {
    const { spot, mandatory } = this.limits(s);
    return s.value >= mandatory ? "mandatory" : s.value >= spot ? "spot-check" : "ok";
  }

  /** @internal The recommendation and the sentence behind it */
  private get advice(): { level: RelianceReviewLevel; text: string } {
    const pct = this.pct;
    const past = (st: RelianceSignalState) => this.signals.filter((s) => this.stateOf(s) === st).sort((a, b) => b.value - a.value);
    const mandatory = past("mandatory");
    const spot = past("spot-check");
    const v = this.value;
    const band = v === undefined ? undefined : this.bandOf(v);
    let level: RelianceReviewLevel;
    let text: string;
    if (mandatory.length) {
      const s = mandatory[0];
      level = "mandatory";
      text =
        mandatory.length > 1
          ? `${mandatory.length} signals are past the mandatory threshold, led by ${s.label.toLowerCase()} at ${pct(s.value)} – check every output before relying on it.`
          : `${s.label} is at ${pct(s.value)}, past the ${pct(this.limits(s).mandatory)} mandatory threshold – check every output before relying on it.`;
    } else if (spot.length) {
      const s = spot[0];
      level = "spot-check";
      text =
        spot.length > 1
          ? `${spot.length} signals are past the spot-check threshold, led by ${s.label.toLowerCase()} at ${pct(s.value)} – check a sample of outputs.`
          : `${s.label} is at ${pct(s.value)}, past the ${pct(this.limits(s).spot)} spot-check threshold – check a sample of outputs.`;
    } else if (band === "miscalibrated") {
      level = "spot-check";
      text = `The index is ${this.idx(v!)}, below ${this.idx(this.driftAt)} – trust no longer matches performance, so check a sample of outputs.`;
    } else {
      level = "routine";
      text =
        band === "drifting"
          ? `Every signal is under its threshold, but the index is drifting – review as usual and watch the trend.`
          : `Every signal is under its threshold and trust matches performance – review as usual.`;
    }
    if (this.recommended) level = this.recommended;
    return { level, text: this.reason || text };
  }

  /** @internal */
  private label(level: RelianceReviewLevel) {
    return this.levelLabels[level] ?? DEFAULT_LEVELS[level];
  }

  /** @internal */
  private pct = (n: number) => numberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
  /** @internal */
  private idx = (n: number) => numberFormat(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  /** @internal What the numbers roll to */
  private targets() {
    const t: Record<string, number> = {};
    const v = this.value;
    if (v !== undefined) t.index = v;
    for (const s of this.signals ?? []) t[`s:${s.id}`] = clamp01(s.value);
    return t;
  }

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const v = this.value;
    if (v === undefined) delete this.dataset.band;
    else this.dataset.band = this.bandOf(v);
    if (changed.has("trend") && this.point !== null && this.point >= this.trend.length) this.point = null;
    // A new recommendation is said once
    const level = this.advice.level;
    if (this.lastLevel !== null && level !== this.lastLevel) this.announce(`Recommended review is now ${this.label(level).toLowerCase()}.`);
    this.lastLevel = level;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  /* ---------- Actions ---------- */

  private switchLevel(level: RelianceReviewLevel) {
    const previous = this.reviewLevel;
    if (!previous || previous === level) return;
    if (!this.emit<RelianceReviewLevelChange>("tc-review-level-change", { level, previous }, { cancelable: true })) return;
    this.reviewLevel = level;
    this.announce(`Review level set to ${this.label(level).toLowerCase()}.`);
  }

  private openEpisodes(kind: RelianceEpisodeKind) {
    this.emit<RelianceEpisodesOpen>("tc-episodes-open", { kind });
  }

  private onTrendKey = (e: KeyboardEvent) => {
    const n = this.trend.length;
    if (!n) return;
    const p = this.point;
    let next: number | null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = p === null ? n - 1 : Math.min(n - 1, p + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = p === null ? n - 1 : Math.max(0, p - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "Escape" && p !== null) next = null;
    else return;
    e.preventDefault();
    this.point = next;
    if (next !== null) {
      const w = this.trend[next];
      this.announce(`${w.label}: ${this.idx(w.index)}, ${BANDS[this.bandOf(w.index)].toLowerCase()}`);
    }
  };
  private onTrendPointer = (e: PointerEvent) => {
    const n = this.trend.length;
    if (n < 2) return;
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.point = Math.min(n - 1, Math.max(0, Math.round(((e.clientX - box.left) / box.width) * (n - 1))));
  };
  private onTrendLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") this.point = null;
  };
  private onTrendBlur = () => (this.point = null);

  /* ---------- Render ---------- */

  private renderDial(v: number | undefined) {
    const shown = v === undefined ? undefined : clamp01(this.roll.shown.index ?? v);
    const band = v === undefined ? undefined : this.bandOf(v);
    const dir = this.direction;
    const lean = dir === "overtrust" ? ", leaning to overtrust" : dir === "undertrust" ? ", leaning to undertrust" : "";
    const notch = (t: number) => {
      const [x1, y1] = arcPoint(t, 41);
      const [x2, y2] = arcPoint(t, 57);
      return svg`<line class="ui-rlg__notch" x1=${x1} y1=${y1} x2=${x2} y2=${y2}></line>`;
    };
    // role="meter" goes through the ARIA-reflecting `role` property: lit-analyzer's role list predates ARIA 1.2's meter
    return html`<div
      class="ui-rlg__dial"
      .role=${"meter"}
      aria-label="Reliance–accuracy index"
      aria-valuemin="0"
      aria-valuemax="1"
      aria-valuenow=${ifDefined(v)}
      aria-valuetext=${v === undefined ? "No data yet" : `${this.idx(v)} of 1, ${BANDS[band!].toLowerCase()}${lean}`}
      data-band=${ifDefined(band)}
    >
      <svg class="ui-rlg__arc" viewBox="0 0 120 66" aria-hidden="true">
        ${svg`<path class="ui-rlg__track" d="M11 60 A49 49 0 0 1 109 60" pathLength="100"></path>
        ${shown !== undefined && shown > 0 ? svg`<path class="ui-rlg__fill" d="M11 60 A49 49 0 0 1 109 60" pathLength="100" stroke-dasharray=${`${shown * 100} 100`}></path>` : nothing}
        ${notch(clamp01(this.driftAt))}${notch(clamp01(this.calibratedAt))}`}
      </svg>
      <span class="ui-rlg__reading" aria-hidden="true">
        <span class="ui-rlg__index">${shown === undefined ? "–" : this.idx(shown)}</span>
        <span class="ui-rlg__band">${band ? BANDS[band] : "No data"}</span>
      </span>
    </div>`;
  }

  private renderLean() {
    const { reliance, accuracy, pct } = this;
    const dir = this.direction;
    if (reliance === undefined || accuracy === undefined || !dir) return nothing;
    const text =
      dir === "overtrust" ? "People rely on it more often than it is right" : dir === "undertrust" ? "People override it more often than it is wrong" : "People rely on it about as often as it is right";
    return html`<div class="ui-rlg__lean" data-dir=${dir}>
      <p class="ui-rlg__lean-title">${dir === "overtrust" ? "Leaning to overtrust" : dir === "undertrust" ? "Leaning to undertrust" : "Trust matches accuracy"}</p>
      <p class="ui-rlg__lean-text">${text}</p>
      <dl class="ui-rlg__pair">
        <div><dt>Reliance</dt><dd>${pct(reliance)}</dd></div>
        <div><dt>Accuracy</dt><dd>${pct(accuracy)}</dd></div>
      </dl>
    </div>`;
  }

  private renderTrend() {
    const windows = this.trend;
    if (windows.length < 2) return nothing;
    const n = windows.length;
    const x = (i: number) => (i / (n - 1)) * 100;
    // The scale runs from just under the lowest window (or the drift line) to 1, so small moves show
    const lo = Math.max(0, Math.min(this.driftAt, ...windows.map((w) => w.index)) - 0.05);
    const y = (v: number) => 100 - ((clamp01(v) - lo) / (1 - lo || 1)) * 100;
    const first = windows[0].index;
    const last = windows[n - 1].index;
    const delta = last - first;
    const p = this.point;
    const read = p !== null ? windows[p] : null;
    const steady = Math.abs(delta) < 0.005;
    const summary = `Index over the last ${n} windows, from ${this.idx(first)} to ${this.idx(last)} – arrow keys read each window`;
    return html`<div class="ui-rlg__trend">
      <div class="ui-rlg__trend-head">
        <span>Trend</span>
        ${keyed(
          read ? `w${p}` : "delta",
          html`<span class="ui-rlg__trend-read" aria-hidden="true">${read
            ? html`${read.label} · <b>${this.idx(read.index)}</b>`
            : html`<span class="ui-rlg__delta" data-dir=${steady ? "flat" : delta > 0 ? "up" : "down"}>${steady ? nothing : delta > 0 ? upIcon : downIcon}${steady ? "Steady" : `${delta > 0 ? "+" : "−"}${this.idx(Math.abs(delta))}`}</span><span class="ui-rlg__muted">over ${n} windows</span>`}</span>`,
        )}
      </div>
      <div
        class="ui-rlg__plot"
        tabindex="0"
        role="group"
        aria-label=${summary}
        ?data-reading=${read !== null}
        @keydown=${this.onTrendKey}
        @pointermove=${this.onTrendPointer}
        @pointerdown=${this.onTrendPointer}
        @pointerleave=${this.onTrendLeave}
        @blur=${this.onTrendBlur}
      >
        <span class="ui-rlg__guide" style=${styleMap({ top: `${y(this.calibratedAt)}%` })}></span>
        <span class="ui-rlg__guide" style=${styleMap({ top: `${y(this.driftAt)}%` })}></span>
        <svg class="ui-rlg__line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          ${svg`<polyline points=${windows.map((w, i) => `${x(i)},${y(w.index)}`).join(" ")} vector-effect="non-scaling-stroke"></polyline>`}
        </svg>
        ${repeat(
          windows,
          (_w, i) => i,
          (w, i) =>
            html`<span
              class="ui-rlg__point"
              data-band=${this.bandOf(w.index)}
              ?data-active=${p === i}
              ?data-last=${i === n - 1}
              style=${styleMap({ left: `${x(i)}%`, top: `${y(w.index)}%` })}
            ></span>`,
        )}
      </div>
    </div>`;
  }

  private renderEpisodes() {
    const kinds: { kind: RelianceEpisodeKind; label: string; hint: string; count: number }[] = [
      { kind: "overtrust", label: "Overtrust", hint: "relied on, then found wrong", count: this.overtrust },
      { kind: "undertrust", label: "Undertrust", hint: "overridden, then found right", count: this.undertrust },
    ];
    const count = (n: number) => numberFormat(this.locale, { maximumFractionDigits: 0 }).format(n);
    return html`<ul class="ui-rlg__episodes" aria-label="Episodes">
      ${kinds.map((k) => {
        const body = html`<span class="ui-rlg__ep-count">${count(k.count)}</span> <span class="ui-rlg__ep-label">${k.label}</span> <span class="ui-rlg__ep-hint">${k.hint}</span>`;
        return html`<li class="ui-rlg__episode" data-kind=${k.kind} ?data-some=${k.count > 0}>
          ${this.browsable
            ? html`<button type="button" class="ui-rlg__ep" @click=${() => this.openEpisodes(k.kind)}>${body}</button>`
            : html`<span class="ui-rlg__ep">${body}</span>`}
        </li>`;
      })}
    </ul>`;
  }

  private renderSignals() {
    const signals = this.signals;
    if (!signals.length) return nothing;
    return html`<ul class="ui-rlg__signals" aria-label="Signals">
      ${repeat(
        signals,
        (s) => s.id,
        (s) => {
          const st = this.stateOf(s);
          const { spot, mandatory } = this.limits(s);
          const shown = clamp01(this.roll.shown[`s:${s.id}`] ?? s.value);
          const past = st === "mandatory" ? `, past the mandatory threshold (${this.pct(mandatory)})` : st === "spot-check" ? `, past the spot-check threshold (${this.pct(spot)})` : "";
          return html`<li class="ui-rlg__signal" data-state=${st}>
            <span class="ui-rlg__signal-label">${s.label}${st !== "ok" ? html`<span class="ui-rlg__dot" aria-hidden="true"></span>` : nothing}</span>
            <span class="ui-rlg__signal-value">${this.pct(shown)}</span>
            ${s.hint ? html`<span class="ui-rlg__signal-hint">${s.hint}</span>` : nothing}
            <span
              class="ui-rlg__thin"
              .role=${"meter"}
              aria-label=${s.label}
              aria-valuemin="0"
              aria-valuemax="1"
              aria-valuenow=${clamp01(s.value)}
              aria-valuetext=${`${this.pct(clamp01(s.value))}${past}`}
              ><span class="ui-rlg__thin-fill" style=${styleMap({ width: `${shown * 100}%` })}></span
              ><span class="ui-rlg__tick" data-tick="spot" style=${styleMap({ left: `${clamp01(spot) * 100}%` })}></span
              ><span class="ui-rlg__tick" data-tick="mandatory" style=${styleMap({ left: `${clamp01(mandatory) * 100}%` })}></span
            ></span>
          </li>`;
        },
      )}
    </ul>`;
  }

  private renderAdvice() {
    const { level, text } = this.advice;
    const icon = level === "mandatory" ? shieldIcon : level === "spot-check" ? warnIcon : checkIcon;
    return keyed(
      level,
      html`<div class="ui-rlg__advice" data-level=${level} role="group" aria-labelledby=${`${this.uid}-advice`}>
        <span class="ui-rlg__advice-icon">${icon}</span>
        <div class="ui-rlg__advice-body">
          <p class="ui-rlg__advice-title" id=${`${this.uid}-advice`}><span class="ui-rlg__muted">Recommended:</span> ${this.label(level)}</p>
          <p class="ui-rlg__advice-text">${text}</p>
        </div>
      </div>`,
    );
  }

  private renderFoot() {
    const current = this.reviewLevel;
    if (!current) return nothing;
    const { level } = this.advice;
    const differs = current !== level;
    const raise = RANK[level] > RANK[current];
    return html`<div class="ui-rlg__foot">
      <span class="ui-rlg__status">${eyeIcon}<span>In force: <b>${this.label(current)}</b></span></span>
      ${differs
        ? html`<button type="button" class=${raise ? "ui-rlg__btn ui-rlg__btn--primary" : "ui-rlg__btn ui-rlg__btn--secondary"} @click=${() => this.switchLevel(level)}>Switch to ${this.label(level).toLowerCase()}</button>`
        : html`<span class="ui-rlg__match">As recommended</span>`}
    </div>`;
  }

  protected override render() {
    const v = this.value;
    const band = v === undefined ? undefined : this.bandOf(v);
    return html`
      <div class="ui-rlg__card">
        <div class="ui-rlg__inner">
          <header class="ui-rlg__head">
            <div class="ui-rlg__heading">
              <h3 class="ui-rlg__title" id=${`${this.uid}-title`}>${this.heading}</h3>
              ${this.scope ? html`<p class="ui-rlg__sub">${this.scope}</p>` : nothing}
            </div>
            ${band ? html`<span class="ui-rlg__pill" data-band=${band}>${BANDS[band]}</span>` : nothing}
          </header>
          <div class="ui-rlg__figure">${this.renderDial(v)}${this.renderLean()}${this.renderTrend()}</div>
          ${this.renderEpisodes()}${this.renderSignals()}${this.renderAdvice()}
        </div>
      </div>
      ${this.renderFoot()}
      <p class="ui-rlg__sr" role="status">${this.message}</p>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rlg"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 480px;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rlg"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 480px;
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
[data-ui="rlg"] *, [data-ui="rlg"] *::before, [data-ui="rlg"] *::after { box-sizing: border-box; }
[data-ui="rlg"] { grid-template-columns: minmax(0, 1fr); }
[data-ui="rlg"] svg { display: block; overflow: visible; }
:where([data-ui="rlg"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="rlg"]) :is(h3, p, ul, dl, dd) { margin: 0; padding: 0; }
:where([data-ui="rlg"]) ul { list-style: none; }
[data-ui="rlg"] :is(button, [tabindex="0"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rlg"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rlg__muted { color: var(--tc-text-muted); }
.ui-rlg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card (Clean: the body of the one card) */
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__inner { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__inner { padding: var(--tc-space-4); }
/* Head: title and scope, the band's pill */
.ui-rlg__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-3); }
.ui-rlg__heading { min-width: 0; }
.ui-rlg__title { overflow: hidden; font-weight: var(--tc-font-weight-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__title { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__title { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); }
.ui-rlg__sub { overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__sub { line-height: var(--tc-line-height-tight); }
.ui-rlg__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-rlg__pill[data-band="calibrated"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rlg__pill[data-band="drifting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-rlg__pill[data-band="miscalibrated"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The figure: the dial, and beside it which way trust leans and the trend */
.ui-rlg__figure { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--tc-space-3-5) var(--tc-space-4); }
.ui-rlg__trend { grid-column: 1 / -1; }
/* Without reliance and accuracy, the trend sits beside the dial */
.ui-rlg__dial + .ui-rlg__trend { grid-column: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__figure { margin-top: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__figure { margin-top: var(--tc-space-3-5); }
.ui-rlg__dial { position: relative; width: 132px; }
.ui-rlg__arc { width: 100%; height: auto; }
.ui-rlg__arc path { fill: none; stroke-linecap: round; }
.ui-rlg__track { stroke: var(--tc-meter-track); }
.ui-rlg__fill { stroke: var(--tc-meter-fill); transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__arc path { stroke-width: 10; }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__arc path { stroke-width: 8; }
.ui-rlg__dial[data-band="calibrated"] .ui-rlg__fill { stroke: var(--tc-status-success-solid); }
.ui-rlg__dial[data-band="drifting"] .ui-rlg__fill { stroke: var(--tc-status-warning-solid); }
.ui-rlg__dial[data-band="miscalibrated"] .ui-rlg__fill { stroke: var(--tc-status-danger-solid); }
/* Where the bands start: a cut through the arc */
.ui-rlg__notch { stroke: var(--tc-surface-raised); stroke-width: 2; }
.ui-rlg__reading { position: absolute; right: 0; bottom: 0; left: 0; display: grid; justify-items: center; }
.ui-rlg__index { font-weight: var(--tc-font-weight-strong); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__index { font-size: var(--tc-font-size-3xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__index { font-size: var(--tc-font-size-2xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-strong); }
.ui-rlg__band { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* Which way trust leans */
.ui-rlg__lean { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-rlg__lean-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rlg__lean[data-dir="overtrust"] .ui-rlg__lean-title { color: var(--tc-status-warning-fg); }
.ui-rlg__lean[data-dir="undertrust"] .ui-rlg__lean-title { color: var(--tc-status-info-fg); }
.ui-rlg__lean-text { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__lean-text { line-height: var(--tc-line-height-snug); }
.ui-rlg__pair { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); margin-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); }
.ui-rlg__pair > div { display: flex; gap: var(--tc-space-1-5); }
.ui-rlg__pair dt { color: var(--tc-text-muted); }
.ui-rlg__pair dd { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
/* The trend: a small line over recent windows, with the band lines behind it */
.ui-rlg__trend-head { display: flex; justify-content: space-between; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__trend-head { line-height: var(--tc-line-height-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__trend-head > :first-child { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rlg__trend-read { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; font-variant-numeric: tabular-nums; animation: ui-rlg-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-rlg__delta { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-rlg__delta[data-dir="up"] { color: var(--tc-status-success-fg); }
.ui-rlg__delta[data-dir="down"] { color: var(--tc-status-danger-fg); }
.ui-rlg__delta svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.ui-rlg__plot { position: relative; height: 40px; margin-top: var(--tc-space-2); border-radius: var(--tc-radius-xs); touch-action: pan-y; cursor: crosshair; }
.ui-rlg__guide { position: absolute; right: 0; left: 0; height: 0; border-top: var(--tc-hairline) dashed var(--tc-divider); }
.ui-rlg__line { position: absolute; inset: 0; width: 100%; height: 100%; }
.ui-rlg__line polyline { fill: none; stroke: var(--tc-text-secondary); stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__line polyline { stroke-width: 1.75; }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__line polyline { stroke-width: 1.25; }
.ui-rlg__point { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-surface-raised); transform: translate(-50%, -50%); box-shadow: inset 0 0 0 1.5px var(--tc-text-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-rlg__point[data-last] { background: var(--tc-text-secondary); box-shadow: 0 0 0 2px var(--tc-surface-raised); }
.ui-rlg__point[data-active] { background: var(--tc-accent); box-shadow: 0 0 0 2px var(--tc-surface-raised); transform: translate(-50%, -50%) scale(1.4); }
/* Episodes: two counts side by side */
.ui-rlg__episodes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-2); margin-top: var(--tc-space-4); }
.ui-rlg__ep { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: baseline; column-gap: var(--tc-space-2); width: 100%; height: 100%; padding: var(--tc-space-2-5) var(--tc-space-3); background: var(--tc-surface-well); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__ep { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__ep { border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); }
button.ui-rlg__ep:hover { background: var(--tc-fill-hover); }
.ui-rlg__ep-count { grid-row: span 2; font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-rlg__episode[data-kind="overtrust"][data-some] .ui-rlg__ep-count { color: var(--tc-status-warning-fg); }
.ui-rlg__episode[data-kind="undertrust"][data-some] .ui-rlg__ep-count { color: var(--tc-status-info-fg); }
.ui-rlg__ep-label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rlg__ep-hint { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; }
/* Signals: thin meters with a tick at each threshold */
.ui-rlg__signals { display: grid; gap: var(--tc-space-3); margin-top: var(--tc-space-4); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rlg__signal { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--tc-space-3); min-width: 0; }
.ui-rlg__signal-label { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; }
.ui-rlg__signal-value { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-rlg__signal[data-state="spot-check"] .ui-rlg__signal-value { color: var(--tc-status-warning-fg); }
.ui-rlg__signal[data-state="mandatory"] .ui-rlg__signal-value { color: var(--tc-status-danger-fg); }
.ui-rlg__signal-hint { grid-column: 1 / -1; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__signal-hint { line-height: var(--tc-line-height-tight); }
.ui-rlg__thin { position: relative; grid-column: 1 / -1; display: block; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__thin { margin-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__thin { margin-top: var(--tc-space-1-5); }
.ui-rlg__thin-fill { position: absolute; top: 0; bottom: 0; left: 0; border-radius: inherit; background: var(--tc-meter-fill); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-rlg__signal[data-state="spot-check"] .ui-rlg__thin-fill { background: var(--tc-status-warning-solid); }
.ui-rlg__signal[data-state="mandatory"] .ui-rlg__thin-fill { background: var(--tc-status-danger-solid); }
.ui-rlg__tick { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--tc-surface-raised); transform: translateX(-50%); }
.ui-rlg__dot { display: inline-block; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-status-warning-solid); animation: ui-rlg-pop var(--tc-duration-slower) var(--tc-ease-spring) both; }
.ui-rlg__signal[data-state="mandatory"] .ui-rlg__dot { background: var(--tc-status-danger-solid); }
/* The recommendation – budget-guard's note, toned by the level */
.ui-rlg__advice { display: flex; gap: var(--tc-space-2-5); margin-top: var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-3); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); animation: ui-rlg-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__advice { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__advice { border-radius: var(--tc-radius-md); }
.ui-rlg__advice[data-level="spot-check"] { background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); }
.ui-rlg__advice[data-level="mandatory"] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); }
.ui-rlg__advice-icon { flex: none; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); color: var(--tc-status-success-fg); fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
.ui-rlg__advice-icon svg { width: 16px; height: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__advice-icon { stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__advice-icon { stroke-width: 1.2; }
.ui-rlg__advice[data-level="spot-check"] .ui-rlg__advice-icon { color: var(--tc-status-warning-fg); }
.ui-rlg__advice[data-level="mandatory"] .ui-rlg__advice-icon { color: var(--tc-status-danger-fg); }
.ui-rlg__advice-body { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-rlg__advice-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rlg__advice-title .ui-rlg__muted { font-weight: var(--tc-font-weight-regular); }
.ui-rlg__advice[data-level="spot-check"] .ui-rlg__advice-title { color: var(--tc-status-warning-fg); }
.ui-rlg__advice[data-level="mandatory"] .ui-rlg__advice-title { color: var(--tc-status-danger-fg); }
.ui-rlg__advice:not([data-level="routine"]) .ui-rlg__advice-title .ui-rlg__muted { color: inherit; }
.ui-rlg__advice-text { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
/* Standard: the tray below the card · Clean: the last row of the card, under a hairline */
.ui-rlg__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__foot { padding: var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); line-height: var(--tc-line-height-tight); }
.ui-rlg__status { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; overflow: hidden; white-space: nowrap; }
.ui-rlg__status > span { overflow: hidden; text-overflow: ellipsis; }
.ui-rlg__status svg { flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlg__status svg { stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-rlg__status svg { stroke-width: 1.2; }
.ui-rlg__match { flex: none; padding-right: var(--tc-space-2); white-space: nowrap; }
.ui-rlg__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; animation: ui-rlg-in var(--tc-duration-moderate) var(--tc-ease-move) both; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-rlg__btn:active { transform: scale(0.97); }
.ui-rlg__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-rlg__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-rlg__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-rlg__btn--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
@keyframes ui-rlg-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-rlg-pop { 0% { transform: scale(0.3); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
/* Narrow: the dial above its side column, tighter gutters */
@container (max-width: 400px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-rlg__inner { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rlg__inner { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rlg__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-3-5); }
  .ui-rlg__figure { column-gap: var(--tc-space-3); }
  .ui-rlg__dial { width: 116px; }
  .ui-rlg__status svg { display: none; }
  /* The level in force stays whole; the switch drops to its own line when they don't fit side by side */
  .ui-rlg__foot { flex-wrap: wrap; row-gap: 0; }
  .ui-rlg__status { flex: none; max-width: 100%; min-height: var(--tc-control-h-md); }
  .ui-rlg__foot > :last-child { margin-left: auto; }
  :where([data-look="clean"], [data-look="clean"] *).ui-rlg__foot:has(> .ui-rlg__btn) { padding-bottom: var(--tc-space-2); }
  :where([data-look="standard"], [data-look="standard"] *).ui-rlg__index { font-size: var(--tc-font-size-2xl); }
}
@container (max-width: 300px) {
  .ui-rlg__figure { grid-template-columns: minmax(0, 1fr); justify-items: center; }
  .ui-rlg__lean { width: 100%; }
  .ui-rlg__episodes { grid-template-columns: minmax(0, 1fr); }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
  .ui-rlg__btn { height: var(--tc-control-h-lg); }
  .ui-rlg__plot { height: 48px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rlg"] *, [data-ui="rlg"] *::before, [data-ui="rlg"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-reliance-gauge")) customElements.define("tc-reliance-gauge", TcRelianceGauge);

declare global {
  interface HTMLElementTagNameMap {
    "tc-reliance-gauge": TcRelianceGauge;
  }
}
