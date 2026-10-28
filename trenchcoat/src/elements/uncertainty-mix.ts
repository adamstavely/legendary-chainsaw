import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import type { BreakdownDimension, BreakdownHiddenChange, BreakdownMeasure, BreakdownRecord } from "./breakdown-chart";
import "./breakdown-chart";

/*
 * <tc-uncertainty-mix> – where an answer's uncertainty comes from (the Lit port of blocks/uncertainty-mix.tsx). Not
 * all uncertainty is the same: some would shrink with more information, some can't be known yet, some is past what
 * the model knows – and each asks for something different. Two parts:
 *   · a reading card: the whole answer's mix as one bar, each kind with its share and what it means, and a short
 *     reading of what to do – led by the kind that weighs most, and the part that carries the most
 *   · the library's Breakdown Chart: the same mix per part of the answer (or per claim), with its linked table –
 *     hiding a kind in the chart's legend hides it from the reading too (tc-hidden-change, with the kinds' keys)
 * Standard: the card's header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-uncertainty-mix subtitle="Will the new checkout lift conversion?" .sources=${[…]}></tc-uncertainty-mix>
 */

export type UncertaintyKind = {
  key: string;
  /** e.g. "Missing information" */
  label: string;
  /** What it means, in a few words */
  meaning: string;
  /** What to do about it, as a sentence */
  advice: string;
  /** Segment colour, any CSS colour – keep it at 3:1 against the card in both themes */
  color?: string;
};

export type UncertaintySource = {
  /** The part of the answer it belongs to, e.g. "Timeline" */
  part: string;
  /** A kind's key */
  kind: string;
  /** How much uncertainty it adds, in any unit – shares are worked out from the sum */
  amount: number;
  /** The claim it comes from, if it's one claim */
  claim?: string;
};

/** Detail of tc-hidden-change: the keys of the hidden kinds */
export type UncertaintyHiddenChange = { hidden: string[]; hiddenKinds: string[] };

/** Missing information, inherent uncertainty and model limits */
export const defaultUncertaintyKinds: UncertaintyKind[] = [
  {
    key: "gap",
    label: "Missing information",
    meaning: "More information would narrow it",
    advice: "Find or request what's missing before relying on it.",
    color: "var(--tc-tone-violet-solid)",
  },
  {
    key: "chance",
    label: "Inherent uncertainty",
    meaning: "The outcome isn't decided yet",
    advice: "Watch for early signs and revisit as things change.",
    color: "var(--tc-status-info-solid)",
  },
  {
    key: "model",
    label: "Model limits",
    meaning: "At the edge of what the model knows",
    advice: "Check it with a person who knows the area, or a primary source.",
    color: "var(--tc-tone-amber-solid)",
  },
];

const MEASURES: BreakdownMeasure[] = [
  { key: "amount", label: "Uncertainty", unit: "points", field: "amount" },
  { key: "count", label: "Sources", unit: "sources" },
];
const NEUTRAL = "var(--tc-chart-neutral)";
/** A colour from data, only if it's a colour – `url(…)` and other values that could load something fall back */
const colour = (c: string | undefined) => (c && typeof CSS !== "undefined" && CSS.supports?.("color", c) ? c : NEUTRAL);
const amountOf = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/* chart-pie: Lucide (ISC, lucide.dev) */
const pieIcon = svg`<path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"></path>`;

let uidCount = 0;

/**
 * Where an answer's uncertainty comes from: the mix of kinds with their shares and meanings and a reading of what to
 * do, beside a breakdown chart of the same mix per part of the answer.
 * @tag tc-uncertainty-mix
 * @fires tc-hidden-change - Kinds were hidden or shown in the chart's legend ({ hidden, hiddenKinds }: UncertaintyHiddenChange – both the kinds' keys); cancelable – prevented, `hiddenKinds` stays
 */
export class TcUncertaintyMix extends TcElement {
  static override ui = "umix";

  /** Where the uncertainty comes from: a part, a kind's key and an amount each */
  @property({ attribute: false }) accessor sources: UncertaintySource[] = [];
  /** The kinds, in display order – defaultUncertaintyKinds by default */
  @property({ attribute: false }) accessor kinds: UncertaintyKind[] = defaultUncertaintyKinds;
  /** The parts in display order – by first appearance in `sources` by default */
  @property({ attribute: false }) accessor parts: string[] | undefined = undefined;
  /** What a part is called, e.g. "Section" or "Claim" */
  @property({ attribute: "part-label" }) accessor partLabel = "Part of the answer";
  /** Keys of the kinds hidden from the chart and the reading */
  @property({ attribute: false }) accessor hiddenKinds: string[] = [];
  /** The reading card's heading */
  @property() accessor heading = "Uncertainty mix";
  /** The line under the heading, e.g. the question the answer is to */
  @property() accessor subtitle: string | undefined = undefined;
  /** The chart's heading */
  @property({ attribute: "chart-title" }) accessor chartTitle = "By part of the answer";

  private readonly uid = `tc-umix-${++uidCount}`;

  private get kindList() {
    return Array.isArray(this.kinds) ? this.kinds : defaultUncertaintyKinds;
  }
  private get sourceList() {
    return Array.isArray(this.sources) ? this.sources : [];
  }
  private get partList() {
    return this.parts ?? [...new Set(this.sourceList.map((s) => s.part))];
  }

  private onHidden = (e: CustomEvent<BreakdownHiddenChange>) => {
    // The chart's event stops here: the page hears this element's tc-hidden-change, in kind keys
    e.stopPropagation();
    e.preventDefault();
    const labels = e.detail.hidden;
    const hidden = this.kindList.filter((k) => labels.includes(k.label)).map((k) => k.key);
    if (hidden.length === this.hiddenKinds.length && hidden.every((k) => this.hiddenKinds.includes(k))) return;
    if (this.emit<UncertaintyHiddenChange>("tc-hidden-change", { hidden, hiddenKinds: hidden }, { cancelable: true })) this.hiddenKinds = hidden;
  };

  private renderReading() {
    const kinds = this.kindList;
    const sources = this.sourceList;
    const hidden = this.hiddenKinds ?? [];
    const parts = this.partList;
    const shown = kinds.filter((k) => !hidden.includes(k.key));
    const totals = shown.map((k) => ({ kind: k, amount: sources.filter((s) => s.kind === k.key).reduce((n, s) => n + amountOf(s.amount), 0) }));
    const total = totals.reduce((n, t) => n + t.amount, 0);
    if (!(total > 0))
      return html`<p class="ui-umix__empty">${sources.length ? "Every kind is hidden – show one in the chart's legend." : "No uncertainty recorded for this answer."}</p>`;
    const shares = totals.map((t) => ({ ...t, share: t.amount / total }));
    const lead = [...shares].sort((a, b) => b.amount - a.amount)[0];
    // Only the kinds on show count – a source of an unknown kind is in neither total
    const on = new Set(shown.map((k) => k.key));
    const partTotals = parts.map((p) => ({ part: p, amount: sources.filter((s) => s.part === p && on.has(s.kind)).reduce((n, s) => n + amountOf(s.amount), 0) }));
    const heaviest = [...partTotals].sort((a, b) => b.amount - a.amount)[0];
    const pct = (n: number) => `${Math.round(n * 100)}%`;
    return html`<div class="ui-umix__bar" role="img" aria-label=${shares.map((s) => `${s.kind.label} ${pct(s.share)}`).join(", ")}>
        ${repeat(
          shares,
          (s) => s.kind.key,
          (s) => html`<span class="ui-umix__seg" style=${styleMap({ flexGrow: String(s.amount), background: colour(s.kind.color) })}></span>`,
        )}
      </div>
      <ul class="ui-umix__kinds">
        ${repeat(
          shares,
          (s) => s.kind.key,
          (s) => html`<li class="ui-umix__kind">
            <span class="ui-umix__swatch" style=${styleMap({ background: colour(s.kind.color) })} aria-hidden="true"></span>
            <span class="ui-umix__share">${pct(s.share)}</span>
            <span class="ui-umix__kind-text"><span class="ui-umix__kind-label">${s.kind.label}</span><span class="ui-umix__kind-meaning">${s.kind.meaning}</span></span>
          </li>`,
        )}
      </ul>
      <div class="ui-umix__reading" aria-live="polite">
        <p class="ui-umix__caption">Reading</p>
        <p>
          ${lead.share >= 0.5 ? "Most" : "The largest share"} of the uncertainty – ${pct(lead.share)} – is <b>${lead.kind.label.toLowerCase()}</b>.
          ${lead.kind.advice}
        </p>
        ${heaviest && parts.length > 1 && heaviest.amount > 0
          ? html`<p><b>${heaviest.part}</b> carries the most (${pct(heaviest.amount / total)}) – start there.</p>`
          : nothing}
      </div>`;
  }

  protected override render() {
    const kinds = this.kindList;
    const byKey = new Map(kinds.map((k) => [k.key, k]));
    // The chart speaks in labels (they're what it shows); this element's API in keys
    const records: BreakdownRecord[] = this.sourceList.filter((s) => byKey.has(s.kind)).map((s) => ({ part: s.part, kind: byKey.get(s.kind)!.label, amount: amountOf(s.amount) }));
    const dimensions: BreakdownDimension[] = [
      { key: "part", label: this.partLabel, values: this.partList },
      { key: "kind", label: "Kind", values: kinds.map((k) => k.label), colors: Object.fromEntries(kinds.filter((k) => k.color).map((k) => [k.label, colour(k.color)])) },
    ];
    const hiddenLabels = (this.hiddenKinds ?? []).map((k) => byKey.get(k)?.label).filter((l): l is string => !!l);
    return html`<div class="ui-umix__layout">
      <section class="ui-umix__card" aria-labelledby=${`${this.uid}-title`}>
        ${cardHead({ icon: pieIcon, title: this.heading, subtitle: this.subtitle, id: `${this.uid}-title` })}
        <div class="ui-umix__body">${this.renderReading()}</div>
      </section>
      <tc-breakdown-chart
        class="ui-umix__chart"
        look=${this.resolvedLook}
        fill
        heading=${this.chartTitle}
        .records=${records}
        .dimensions=${dimensions}
        .measures=${MEASURES}
        slice="part"
        segment="kind"
        .hiddenSegments=${hiddenLabels}
        @tc-hidden-change=${this.onHidden}
      ></tc-breakdown-chart>
    </div>`;
  }

  static override css = /* css */ `
[data-ui="umix"] {
  container-type: inline-size;
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="umix"] *, [data-ui="umix"] *::before, [data-ui="umix"] *::after { box-sizing: border-box; }
.ui-umix__layout { display: grid; grid-template-columns: minmax(260px, 360px) minmax(0, 1fr); align-items: start; gap: var(--tc-space-4); }
@container (max-width: 720px) { .ui-umix__layout { grid-template-columns: minmax(0, 1fr); } }

/* Standard: the header on the gray tray above a white card. Clean: one white card, the header its first row */
.ui-umix__card { min-width: 0; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-umix__body { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="umix"][data-look="clean"] .ui-umix__card { padding: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="umix"][data-look="clean"] .ui-umix__body { padding: 0 var(--tc-space-4) var(--tc-space-4); border-radius: 0; background: none; box-shadow: none; }

/* The whole answer's mix: one bar, a gap between kinds */
.ui-umix__bar { display: flex; gap: var(--tc-space-0-5); height: var(--tc-space-3); }
.ui-umix__seg { flex: 1 1 0; min-width: var(--tc-space-1); border-radius: var(--tc-radius-2xs); transition: flex-grow var(--tc-duration-slow) var(--tc-ease-out); }
.ui-umix__seg:first-child { border-radius: var(--tc-radius-full) var(--tc-radius-2xs) var(--tc-radius-2xs) var(--tc-radius-full); }
.ui-umix__seg:last-child { border-radius: var(--tc-radius-2xs) var(--tc-radius-full) var(--tc-radius-full) var(--tc-radius-2xs); }
.ui-umix__seg:only-child { border-radius: var(--tc-radius-full); }
.ui-umix__kinds { display: grid; gap: var(--tc-space-3); margin: 0; padding: 0; list-style: none; }
.ui-umix__kind { display: grid; grid-template-columns: auto 3.25em minmax(0, 1fr); align-items: baseline; gap: var(--tc-space-2); }
.ui-umix__swatch { width: var(--tc-space-2-5); height: var(--tc-space-2-5); border-radius: var(--tc-radius-2xs); transform: translateY(1px); }
.ui-umix__share { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); font-variant-numeric: tabular-nums; color: var(--tc-text-strong); line-height: var(--tc-line-height-normal); }
[data-ui="umix"][data-look="clean"] .ui-umix__share { font-weight: var(--tc-font-weight-medium); }
.ui-umix__kind-text { display: grid; }
.ui-umix__kind-label { font-weight: var(--tc-font-weight-medium); }
.ui-umix__kind-meaning { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-umix__reading { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); }
.ui-umix__reading p { margin: 0; }
.ui-umix__reading b { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-semibold); }
.ui-umix__caption { color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-umix__empty { margin: 0; color: var(--tc-text-muted); }

@media (prefers-reduced-motion: reduce) { .ui-umix__seg { transition: none; } }
@media (forced-colors: active) { .ui-umix__seg, .ui-umix__swatch { forced-color-adjust: none; outline: 1px solid CanvasText; } }
`;
}

if (!customElements.get("tc-uncertainty-mix")) customElements.define("tc-uncertainty-mix", TcUncertaintyMix);

declare global {
  interface HTMLElementTagNameMap {
    "tc-uncertainty-mix": TcUncertaintyMix;
  }
}
