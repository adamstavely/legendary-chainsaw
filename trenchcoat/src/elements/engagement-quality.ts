import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-engagement-quality> – whether reviews are genuine engagement or going through the motions. An index (0–1: 1 is
 * fully genuine) with its band and trend leads the card, and a sentence says which signal holds it back. Below, the
 * signals it is built from – reused wording, time on the source before a verdict, batch dismissals, repeated
 * commitments, or the app's own – each with its value as a thin meter, what was observed, a plain explanation and,
 * folded away, an example. An optional note says who else sees it.
 *
 *   <tc-engagement-quality scope="Last 5 sessions · 38 reviews" shared-with="your team lead"
 *     .trend=${[{ label: "Session 1", index: 0.62 }]} .signals=${[{ id: "w", kind: "boilerplate", value: 0.58 }]}>
 *   </tc-engagement-quality>
 *
 * It is presented as quality, not a violation: the words are neutral, a low score is amber, never red, and nothing
 * on the card asks for an action. Higher always means more genuine, for the index and every signal. Unset, the index
 * is the weighted mean of the signals. Thresholds and band names are properties; the four built-in kinds supply a
 * label and an explanation the app can override.
 *
 * Keyboard: Tab reaches each signal's "Example" disclosure (Enter or Space opens it) and, with `browsable`, the
 * "Show these reviews" button inside, which fires tc-signal-open ({ id }). The element reads no clock and calls nothing.
 * Standard: the header on the gray tray above a white card, the shared note on the tray below. Clean: one white card,
 * the note as its last row under a hairline, thinner meters and strokes.
 */

export type EngagementSignalKind = "boilerplate" | "source-time" | "batch-dismissal" | "repeated-commitment";
export type EngagementBand = "strong" | "mixed" | "low";

export type EngagementSignal = {
  id: string;
  /** One of the built-in kinds – supplies the label and explanation when they aren't given */
  kind?: EngagementSignalKind;
  /** "Written reasoning", "Time on the source" */
  label?: string;
  /** 0–1 – higher means more genuine */
  value: number;
  /** What was observed, in a few words – "Median 9 s with the source open" */
  reading?: string;
  /** What the signal measures and why it matters, in plain words */
  explanation?: string;
  /** A concrete instance, shown when the person opens "Example" */
  example?: string;
  /** Share of the index when it is worked out from the signals (default 1) */
  weight?: number;
};

/** One recent window of the index – a session, a week */
export type EngagementWindow = { label: string; index: number };

/** Detail of tc-signal-open */
export type EngagementSignalOpen = { id: string };

/** The built-in signals' default label and explanation */
export const ENGAGEMENT_SIGNAL_KINDS: Record<EngagementSignalKind, { label: string; explanation: string }> = {
  boilerplate: {
    label: "Written reasoning",
    explanation: "Whether review notes are written for the item in front of the reviewer, or reuse wording from earlier reviews.",
  },
  "source-time": {
    label: "Time on the source",
    explanation: "How long the source was open before a verdict was given. A verdict seconds after opening is unlikely to rest on reading it.",
  },
  "batch-dismissal": {
    label: "Dismissals",
    explanation: "Whether flagged items are dismissed one at a time, each after a look, or cleared together in a batch.",
  },
  "repeated-commitment": {
    label: "Follow-up commitments",
    explanation: "Whether the follow-ups a reviewer commits to are specific to this work, or repeat earlier ones word for word.",
  },
};

const DEFAULT_BANDS: Record<EngagementBand, string> = { strong: "Strong", mixed: "Mixed", low: "Low" };
const TITLES: Record<EngagementBand, string> = { strong: "Reviews look genuine", mixed: "Mostly genuine", low: "Reviews look hurried" };

/* Icons: Lucide (ISC, lucide.dev) – eye (the header), chevron-down, users, arrow-up, arrow-down */
const headIcon = svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`;
const glyph = (body: ReturnType<typeof svg>, className = "ui-egq__glyph") => html`<svg class=${className} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const chevron = svg`<path d="m6 9 6 6 6-6"></path>`;
const usersIcon = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>`;
const upIcon = svg`<path d="M12 19V5M5 12l7-7 7 7"></path>`;
const downIcon = svg`<path d="M12 5v14M19 12l-7 7-7-7"></path>`;

let instances = 0;

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const formats = new Map<string, Intl.NumberFormat>();
const numberFormat = (locale: string, options: Intl.NumberFormatOptions) => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.NumberFormat(locale, options)));
  return f;
};

/** The index the signals make: their weighted mean, or undefined with no signals */
export function engagementIndex(signals: EngagementSignal[]): number | undefined {
  let sum = 0;
  let weights = 0;
  for (const s of signals) {
    const w = s.weight ?? 1;
    if (!(w > 0)) continue;
    sum += clamp01(s.value) * w;
    weights += w;
  }
  return weights ? sum / weights : undefined;
}

/**
 * Whether reviews are genuine: an index with its band and trend, the signals it is built from – each with its value,
 * what was observed, an explanation and an example – and an optional note on who else sees it.
 * @tag tc-engagement-quality
 * @fires tc-signal-open - "Show these reviews" was pressed inside a signal's example, with `browsable` set (detail: { id })
 */
export class TcEngagementQuality extends TcElement {
  static override ui = "egq";

  /** The heading, and the region's name */
  @property() accessor heading = "Engagement quality";
  /** What the numbers cover, a quiet line under the heading – e.g. "Last 5 sessions · 38 reviews" */
  @property() accessor scope = "";
  /** The index, 0–1 (1: fully genuine). Unset, it is the weighted mean of the signals */
  @property({ type: Number }) accessor index: number | undefined = undefined;
  /** The signals behind the index, each 0–1 where higher means more genuine */
  @property({ attribute: false }) accessor signals: EngagementSignal[] = [];
  /** The index over recent windows, oldest first – drawn as small columns with the change */
  @property({ attribute: false }) accessor trend: EngagementWindow[] = [];
  /** Index from which the band reads "Strong" (0–1) */
  @property({ type: Number, attribute: "strong-at" }) accessor strongAt = 0.75;
  /** Index from which the band reads "Mixed"; below it, "Low" (0–1) */
  @property({ type: Number, attribute: "mixed-at" }) accessor mixedAt = 0.5;
  /** Names of the bands */
  @property({ attribute: false }) accessor bandLabels: Partial<Record<EngagementBand, string>> = {};
  /** Overrides the sentence under the index that says which signals hold it back */
  @property() accessor summary = "";
  /** Who else sees the score – a role or a name, e.g. "your team lead". Unset: no note */
  @property({ attribute: "shared-with" }) accessor sharedWith = "";
  /** Overrides the whole shared note */
  @property({ attribute: "shared-note" }) accessor sharedNote = "";
  /** Each signal's example offers "Show these reviews", which fires tc-signal-open */
  @property({ type: Boolean }) accessor browsable = false;
  /** Locale for numbers */
  @property() accessor locale = "en-US";

  /** @internal The signals whose example is open */
  @state() private accessor open: ReadonlySet<string> = new Set();

  private readonly uid = `tc-egq${++instances}`;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  /* ---------- State ---------- */

  /** @internal The index shown: given, or worked out from the signals */
  private get value(): number | undefined {
    if (this.index !== undefined && Number.isFinite(this.index)) return clamp01(this.index);
    return engagementIndex(this.signals ?? []);
  }

  /** @internal */
  private bandOf(v: number): EngagementBand {
    return v >= this.strongAt ? "strong" : v >= this.mixedAt ? "mixed" : "low";
  }

  /** @internal */
  private bandName(b: EngagementBand) {
    return this.bandLabels[b] ?? DEFAULT_BANDS[b];
  }

  /** @internal A signal's label and explanation, from the kind when not given */
  private textOf(s: EngagementSignal) {
    const kind = s.kind ? ENGAGEMENT_SIGNAL_KINDS[s.kind] : undefined;
    return { label: s.label ?? kind?.label ?? s.id, explanation: s.explanation ?? kind?.explanation ?? "" };
  }

  /** @internal */
  private idx = (n: number) => numberFormat(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  /** @internal The sentence under the index: the signals below the strong band, lowest first */
  private get sentence(): string {
    if (this.summary) return this.summary;
    const v = this.value;
    if (v === undefined) return "No reviews to measure yet.";
    const weak = [...this.signals].filter((s) => this.bandOf(clamp01(s.value)) !== "strong").sort((a, b) => a.value - b.value);
    const name = (s: EngagementSignal) => `${this.textOf(s).label.toLowerCase()} (${this.idx(clamp01(s.value))})`;
    if (!weak.length) return this.signals.length ? "Every signal is in the strong band." : `The index is ${this.idx(v)}.`;
    const [first, second] = weak;
    const lead = name(first);
    if (!second) return `${lead[0].toUpperCase()}${lead.slice(1)} is the signal holding it back.`;
    return `${lead[0].toUpperCase()}${lead.slice(1)} and ${name(second)} are the signals holding it back.`;
  }

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const v = this.value;
    if (v === undefined) delete this.dataset.band;
    else this.dataset.band = this.bandOf(v);
    // Examples of signals that are gone close
    if (changed.has("signals") && this.open.size) {
      const ids = new Set(this.signals.map((s) => s.id));
      if ([...this.open].some((id) => !ids.has(id))) this.open = new Set([...this.open].filter((id) => ids.has(id)));
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  /* ---------- Actions ---------- */

  private toggle(id: string) {
    const next = new Set(this.open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.open = next;
  }

  /* ---------- Render ---------- */

  private renderFigure(v: number | undefined) {
    const band = v === undefined ? undefined : this.bandOf(v);
    return html`<div class="ui-egq__figure">
      <div class="ui-egq__score">
        <span class="ui-egq__index">${v === undefined ? "–" : this.idx(v)}</span>
        <span class="ui-egq__of">of 1</span>
      </div>
      <div class="ui-egq__read">
        <p class="ui-egq__title">${band ? TITLES[band] : "No data yet"}</p>
        <p class="ui-egq__sentence">${this.sentence}</p>
      </div>
      ${this.renderScale(v)}${this.renderTrend()}
    </div>`;
  }

  /** The index on a track split into the three bands */
  private renderScale(v: number | undefined) {
    const band = v === undefined ? undefined : this.bandOf(v);
    const lo = clamp01(this.mixedAt);
    const hi = Math.max(lo, clamp01(this.strongAt));
    // role="meter" goes through the ARIA-reflecting `role` property: lit-analyzer's role list predates ARIA 1.2's meter
    // With no value yet there is nothing to measure: the track is drawn but isn't a meter
    return html`<div
      class="ui-egq__scale"
      .role=${v === undefined ? null : "meter"}
      aria-label=${ifDefined(v === undefined ? undefined : "Engagement quality index")}
      aria-valuemin=${ifDefined(v === undefined ? undefined : "0")}
      aria-valuemax=${ifDefined(v === undefined ? undefined : "1")}
      aria-valuenow=${ifDefined(v)}
      aria-valuetext=${ifDefined(v === undefined ? undefined : `${this.idx(v)} of 1, ${this.bandName(band!).toLowerCase()}`)}
      aria-hidden=${ifDefined(v === undefined ? "true" : undefined)}
      data-band=${ifDefined(band)}
    >
      <span class="ui-egq__track">
        ${v !== undefined ? html`<span class="ui-egq__fill" style=${styleMap({ width: `${v * 100}%` })}></span>` : nothing}
        <span class="ui-egq__cut" style=${styleMap({ left: `${lo * 100}%` })}></span>
        <span class="ui-egq__cut" style=${styleMap({ left: `${hi * 100}%` })}></span>
      </span>
      <span class="ui-egq__bands" aria-hidden="true">
        <span style=${styleMap({ width: `${lo * 100}%` })} ?data-on=${band === "low"}>${this.bandName("low")}</span>
        <span style=${styleMap({ width: `${(hi - lo) * 100}%` })} ?data-on=${band === "mixed"}>${this.bandName("mixed")}</span>
        <span style=${styleMap({ width: `${(1 - hi) * 100}%` })} ?data-on=${band === "strong"}>${this.bandName("strong")}</span>
      </span>
    </div>`;
  }

  private renderTrend() {
    const windows = this.trend ?? [];
    if (windows.length < 2) return nothing;
    const n = windows.length;
    const first = windows[0].index;
    const last = windows[n - 1].index;
    const delta = last - first;
    const steady = Math.abs(delta) < 0.005;
    const dir = steady ? "flat" : delta > 0 ? "up" : "down";
    const change = steady ? "Steady" : `${delta > 0 ? "+" : "−"}${this.idx(Math.abs(delta))}`;
    return html`<div class="ui-egq__trend">
      <span class="ui-egq__bars" aria-hidden="true">
        ${windows.map(
          (w, i) =>
            html`<span class="ui-egq__bar" data-band=${this.bandOf(clamp01(w.index))} ?data-last=${i === n - 1} style=${styleMap({ height: `${Math.max(8, clamp01(w.index) * 100)}%` })} title=${`${w.label}: ${this.idx(clamp01(w.index))}`}></span>`,
        )}
      </span>
      <span class="ui-egq__delta" data-dir=${dir}>${dir === "up" ? glyph(upIcon) : dir === "down" ? glyph(downIcon) : nothing}<b>${change}</b> <span class="ui-egq__muted">over ${n} ${n === 1 ? "window" : "windows"}</span></span>
      <span class="ui-egq__sr">${`From ${this.idx(clamp01(first))} in ${windows[0].label} to ${this.idx(clamp01(last))} in ${windows[n - 1].label}.`}</span>
    </div>`;
  }

  private renderSignals() {
    const signals = this.signals ?? [];
    if (!signals.length) return nothing;
    return html`<div class="ui-egq__section">
      <p class="ui-egq__caption" id=${`${this.uid}-signals`}>What it's built from</p>
      <ul class="ui-egq__signals" aria-labelledby=${`${this.uid}-signals`}>
        ${repeat(
          signals,
          (s) => s.id,
          (s) => {
            const v = clamp01(s.value);
            const band = this.bandOf(v);
            const { label, explanation } = this.textOf(s);
            const open = this.open.has(s.id);
            const panel = `${this.uid}-ex-${s.id}`;
            return html`<li class="ui-egq__signal" data-band=${band} data-id=${s.id}>
              <span class="ui-egq__signal-label">${label}</span>
              <span class="ui-egq__signal-value">${this.idx(v)}</span>
              <span
                class="ui-egq__thin"
                .role=${"meter"}
                aria-label=${label}
                aria-valuemin="0"
                aria-valuemax="1"
                aria-valuenow=${v}
                aria-valuetext=${`${this.idx(v)} of 1, ${this.bandName(band).toLowerCase()}${s.reading ? ` – ${s.reading}` : ""}`}
                ><span class="ui-egq__thin-fill" style=${styleMap({ width: `${v * 100}%` })}></span
              ></span>
              ${s.reading ? html`<span class="ui-egq__reading">${s.reading}</span>` : nothing}
              ${explanation ? html`<span class="ui-egq__explain">${explanation}</span>` : nothing}
              ${s.example || this.browsable
                ? html`<button type="button" class="ui-egq__toggle" aria-expanded=${open ? "true" : "false"} aria-controls=${panel} @click=${() => this.toggle(s.id)}>
                      ${glyph(chevron, "ui-egq__glyph ui-egq__chev")}<span>Example</span><span class="ui-egq__sr"> – ${label}</span>
                    </button>
                    <div class="ui-egq__example" id=${panel} ?hidden=${!open}>
                      ${s.example ? html`<p class="ui-egq__quote">${s.example}</p>` : nothing}
                      ${this.browsable
                        ? html`<button type="button" class="ui-egq__btn" @click=${() => this.emit<EngagementSignalOpen>("tc-signal-open", { id: s.id })}>
                            Show these reviews<span class="ui-egq__sr"> – ${label}</span>
                          </button>`
                        : nothing}
                    </div>`
                : nothing}
            </li>`;
          },
        )}
      </ul>
    </div>`;
  }

  private renderNote() {
    const text = this.sharedNote || (this.sharedWith ? `Shared with ${this.sharedWith}. It shows how far the review record can be relied on – it isn't a performance rating.` : "");
    if (!text) return nothing;
    return html`<p class="ui-egq__note">${glyph(usersIcon)}<span>${text}</span></p>`;
  }

  protected override render() {
    const v = this.value;
    const band = v === undefined ? undefined : this.bandOf(v);
    // The header (.tc-head): on the tray in Standard, the card's first row in Clean
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: headIcon,
      title: this.heading,
      subtitle: this.scope || undefined,
      id: `${this.uid}-title`,
      aside: band ? html`<span class="ui-egq__pill" data-band=${band}>${this.bandName(band)}</span>` : undefined,
    });
    return html`
      ${clean ? nothing : head}
      <div class="ui-egq__card">
        ${clean ? head : nothing}
        <div class="ui-egq__inner">${this.renderFigure(v)}${this.renderSignals()}</div>
        ${clean ? this.renderNote() : nothing}
      </div>
      ${clean ? nothing : this.renderNote()}
    `;
  }

  static override css = /* css */ `
[data-ui="egq"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 480px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: the gray tray around a white card · Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="egq"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="egq"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); color: var(--tc-text-primary); }
[data-ui="egq"] *, [data-ui="egq"] *::before, [data-ui="egq"] *::after { box-sizing: border-box; }
:where([data-ui="egq"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="egq"]) :is(p, ul) { margin: 0; padding: 0; }
:where([data-ui="egq"]) ul { list-style: none; }
[data-ui="egq"] [hidden] { display: none !important; }
[data-ui="egq"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="egq"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-egq__muted { color: var(--tc-text-muted); }
.ui-egq__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-egq__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-egq__glyph { stroke-width: 1.6; }
/* The card */
.ui-egq__card { min-width: 0; border-radius: var(--tc-card-radius); }
:where([data-look="standard"], [data-look="standard"] *).ui-egq__card { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-egq__inner { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-egq__inner { padding-top: var(--tc-space-1); }
/* The band's pill, at the header's right – quality, so the low band is amber, never red */
.ui-egq__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-egq__pill[data-band="strong"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-egq__pill[data-band="low"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
/* The figure: the index and its sentence, the band scale, the trend */
.ui-egq__figure { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--tc-space-3) var(--tc-space-4); }
.ui-egq__score { display: flex; align-items: baseline; gap: var(--tc-space-1); }
/* A hero figure – display-sized on purpose: the index is what the card is for */
.ui-egq__index { font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display); font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-egq__index { font-size: var(--tc-font-size-3xl); letter-spacing: var(--tc-tracking-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-egq__index { font-size: var(--tc-font-size-2xl); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-strong); }
.ui-egq__of { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-egq__read { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-egq__title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-egq__sentence { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-egq__scale, .ui-egq__trend { grid-column: 1 / -1; }
.ui-egq__track { position: relative; display: block; height: var(--tc-meter-h-hero); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-egq__fill { position: absolute; top: 0; bottom: 0; left: 0; border-radius: inherit; background: var(--tc-chart-neutral); transition: width var(--tc-duration-moderate) var(--tc-ease-move), background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-egq__scale[data-band="strong"] .ui-egq__fill { background: var(--tc-status-success-solid); }
.ui-egq__scale[data-band="low"] .ui-egq__fill { background: var(--tc-tone-amber-solid); }
/* Where the bands start: a cut through the track */
.ui-egq__cut { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--tc-surface-raised); transform: translateX(-50%); }
:where([data-look="standard"], [data-look="standard"] *) .ui-egq__cut { background: var(--tc-surface-on-tray); }
.ui-egq__bands { display: flex; margin-top: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-egq__bands > span { min-width: 0; overflow: hidden; padding-right: var(--tc-space-1); text-overflow: ellipsis; white-space: nowrap; }
.ui-egq__bands > span:last-child { padding-right: 0; text-align: right; }
.ui-egq__bands > [data-on] { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* The trend: small columns, one per window, and the change */
.ui-egq__trend { display: flex; align-items: center; gap: var(--tc-space-3); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-egq__bars { display: flex; flex: none; align-items: flex-end; gap: var(--tc-space-0-5); height: 20px; }
.ui-egq__bar { width: 6px; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-strong); transition: height var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-egq__bar[data-last] { background: var(--tc-chart-neutral); }
.ui-egq__bar[data-last][data-band="strong"] { background: var(--tc-status-success-solid); }
.ui-egq__bar[data-last][data-band="low"] { background: var(--tc-tone-amber-solid); }
.ui-egq__delta { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; font-variant-numeric: tabular-nums; }
.ui-egq__delta .ui-egq__glyph { width: 12px; height: 12px; }
.ui-egq__delta[data-dir="up"] { color: var(--tc-status-success-fg); }
.ui-egq__delta[data-dir="down"] { color: var(--tc-tone-amber-fg); }
.ui-egq__delta[data-dir="up"] b, .ui-egq__delta[data-dir="down"] b { color: inherit; }
/* Signals */
.ui-egq__section { display: grid; gap: var(--tc-space-3); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-egq__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-egq__signals { display: grid; gap: var(--tc-space-4); }
.ui-egq__signal { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--tc-space-3); min-width: 0; }
.ui-egq__signal-label { min-width: 0; overflow-wrap: anywhere; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-egq__signal-value { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-egq__signal[data-band="low"] .ui-egq__signal-value { color: var(--tc-tone-amber-fg); }
.ui-egq__thin { position: relative; grid-column: 1 / -1; display: block; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
:where([data-look="standard"], [data-look="standard"] *).ui-egq__thin { margin-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-egq__thin { margin-top: var(--tc-space-1-5); }
.ui-egq__thin-fill { position: absolute; top: 0; bottom: 0; left: 0; border-radius: inherit; background: var(--tc-chart-neutral); transition: width var(--tc-duration-moderate) var(--tc-ease-move), background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-egq__signal[data-band="strong"] .ui-egq__thin-fill { background: var(--tc-status-success-solid); }
.ui-egq__signal[data-band="low"] .ui-egq__thin-fill { background: var(--tc-tone-amber-solid); }
.ui-egq__reading { grid-column: 1 / -1; margin-top: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-egq__explain { grid-column: 1 / -1; margin-top: var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* The example, folded away */
.ui-egq__toggle { grid-column: 1 / -1; justify-self: start; display: inline-flex; align-items: center; gap: var(--tc-space-1); margin-top: var(--tc-space-1-5); padding: var(--tc-space-0-5) var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-1); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-egq__toggle:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-egq__chev { width: 14px; height: 14px; transform: rotate(-90deg); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-egq__toggle[aria-expanded="true"] .ui-egq__chev { transform: none; }
.ui-egq__example { grid-column: 1 / -1; display: grid; gap: var(--tc-space-2); margin-top: var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-3); background: var(--tc-surface-well); animation: ui-egq-in var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-egq__example { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-egq__example { border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); }
.ui-egq__quote { padding-left: var(--tc-space-2-5); border-left: 2px solid var(--tc-border-strong); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-egq__btn { justify-self: start; display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-egq__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
/* Who else sees it – on the tray below the card (Standard), the card's last row (Clean) */
.ui-egq__note { display: flex; align-items: flex-start; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-egq__note .ui-egq__glyph { margin-top: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-egq__note { padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-egq__note { padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
@keyframes ui-egq-in { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: none; } }
/* Narrow: tighter gutters, the index above its sentence */
@container (max-width: 400px) {
  .ui-egq__inner { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-egq__note { padding: var(--tc-space-3) var(--tc-space-3-5); }
  :where([data-look="standard"], [data-look="standard"] *).ui-egq__index { font-size: var(--tc-font-size-2xl); }
}
@container (max-width: 300px) {
  .ui-egq__figure { grid-template-columns: minmax(0, 1fr); }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
  .ui-egq__toggle { min-height: var(--tc-control-h-md); }
  .ui-egq__btn { height: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="egq"] *, [data-ui="egq"] *::before, [data-ui="egq"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-engagement-quality")) customElements.define("tc-engagement-quality", TcEngagementQuality);

declare global {
  interface HTMLElementTagNameMap {
    "tc-engagement-quality": TcEngagementQuality;
  }
}
