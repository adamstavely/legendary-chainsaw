import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { hasField, numGetter, strGetter, uniq } from "./internal/chart/accessor";
import { txt } from "./internal/chart/axis";
import { chordLayout, ribbonPath, type Chord, type ChordGroup } from "./internal/chart/chord";
import { emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { arcPath, polar, TAU } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { plural } from "./internal/chart/i18n";
import type { Mark } from "./internal/chart/motion";
import { textWidth } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-chord-chart> – what groups exchange with each other: each group an arc round a circle sized by everything it
 * sends and receives, each pair joined by a ribbon whose two ends are what each side sent. Ported from ztd-charts'
 * ChordChart (MIT, © 2026 Junhan2). The largest group is emphasised and every ribbon touching it takes the accent
 * while the rest stay quiet (`highlight` picks others). Pointing at a group lights its ribbons and fades the rest;
 * pointing at a ribbon lights just that one. Names sit outside the arcs. The arcs sweep round from twelve o'clock and
 * the ribbons fade in after them; when the data changes, arcs and ribbons glide to their new angles.
 *   · one tab stop: arrows move through the groups, then the ribbons, each read with its values
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-chord-chart heading="Shared instruments" .data=${[{ source: "Genomics", target: "Imaging", value: 42 }]}></tc-chord-chart>
 */

/** A chord diagram: a circle crossed by curves – Lucide-style (ISC, lucide.dev) */
const chordIcon = svg`<circle cx="12" cy="12" r="9"></circle><path d="M5.6 5.6Q12 12 18.4 5.6"></path><path d="M3 12q9 0 12.4 8"></path>`;

type GroupItem = { kind: "group"; g: ChordGroup; name: string };
type RibbonItem = { kind: "ribbon"; ch: Chord; k: number };
type Item = GroupItem | RibbonItem | null;

const NAME_FONT = 11.5;

/**
 * Exchanges between groups as ribbons round a circle – each group an arc sized by what it sends and receives, one group
 * and its ribbons emphasised, names outside the arcs, and a table view.
 * @tag tc-chord-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a group or ribbon, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A group or ribbon was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcChordChart<T = Row> extends TcChartElement<Item, T> {
  static override ui = "cdc";

  /** The field naming who sends; by default "source", or "from" when the rows have no "source" */
  @property({ attribute: false }) accessor source: Accessor<T, string> | undefined = undefined;
  /** The field naming who receives; by default "target", or "to" when the rows have no "target" */
  @property({ attribute: false }) accessor target: Accessor<T, string> | undefined = undefined;
  /** The amount sent field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The gap between groups, in radians */
  @property({ type: Number, attribute: "pad-angle" }) accessor padAngle = 0.05;

  protected override readonly kind = "Chord diagram";
  protected override readonly icon = chordIcon;
  protected override defaultDuration = 1000;
  protected override modelKeys = ["source", "target", "value", "padAngle"];

  private names: string[] = [];
  private matrix: number[][] = [];
  private groups: ChordGroup[] = [];
  private chords: Chord[] = [];
  private hi: ReadonlySet<number> = new Set();
  private g = { cx: 0, cy: 0, R: 0, rr: 0, thick: 0 };

  protected override defaultHeight(w: number) {
    return Math.max(240, Math.min(340, w * 0.7));
  }

  protected override tableHeader() {
    return "Group or pair";
  }

  protected override buildModel(f: ChartFrame): ChartModel<Item, T> {
    const { width: W, height: H } = f;
    const has = (k: string) => this.data.some((d) => !!d && typeof d === "object" && hasField(d as object, k));
    const gs = strGetter(this.source ?? (has("source") ? "source" : "from"), "source");
    const gt = strGetter(this.target ?? (has("target") ? "target" : "to"), "target");
    const gv = numGetter(this.value, "value");
    const names = uniq(this.data.flatMap((d, i) => [gs(d, i), gt(d, i)]));
    const idx = new Map(names.map((n, i) => [n, i]));
    const matrix = names.map(() => names.map(() => 0));
    this.data.forEach((d, i) => {
      const a = idx.get(gs(d, i));
      const b = idx.get(gt(d, i));
      if (a === undefined || b === undefined) return;
      matrix[a][b] += Math.max(0, gv(d, i) || 0);
    });
    const lay = chordLayout(matrix, this.padAngle);
    const totals = lay.groups.map((g) => g.value);
    // A test is handed each group's name
    this.hi = resolveHighlight(this.highlight as never, names as never[], names, totals, "max");
    this.names = names;
    this.matrix = matrix;
    this.groups = lay.groups;
    this.chords = lay.chords;
    const grand = totals.reduce((a, b) => a + b, 0) || 1;

    const labelW = Math.max(...names.map((n) => textWidth(n, NAME_FONT, 700)), 20) + 14;
    const R = Math.max(40, Math.min(H / 2 - 16, W / 2 - labelW));
    const thick = Math.max(8, Math.min(14, R * 0.09));
    this.g = { cx: W / 2, cy: H / 2, R, rr: R - thick - 3, thick };

    const D = this.duration ?? this.defaultDuration;
    // The arcs sweep round and the ribbons fade in once, on entrance; the groups' and ribbons' own angles glide on a change
    const marks: Mark<Item>[] = [
      { key: "__sweep", to: [TAU], from: [0], data: null },
      { key: "__rib", to: [1], from: [0], delay: D * 0.45, data: null },
    ];
    lay.groups.forEach((g) => {
      const mid = (g.a0 + g.a1) / 2;
      marks.push({ key: `g:${names[g.index]}`, to: [g.a0, g.a1], enter: [mid, mid], data: { kind: "group", g, name: names[g.index] } });
    });
    lay.chords.forEach((ch, k) => {
      const sm = (ch.source.a0 + ch.source.a1) / 2;
      const tm = (ch.target.a0 + ch.target.a1) / 2;
      const a = names[ch.source.index];
      const b = names[ch.target.index];
      marks.push({ key: `c:${a < b ? `${a}|${b}` : `${b}|${a}`}`, to: [ch.source.a0, ch.source.a1, ch.target.a0, ch.target.a1], enter: [sm, sm, tm, tm], data: { kind: "ribbon", ch, k } });
    });

    const n = names.length;
    const events = [
      ...lay.groups.map((g) => ({ datum: null, index: g.index, key: names[g.index], label: names[g.index], value: g.value, formatted: `${f.fv(g.value)} (${f.pct((g.value / grand) * 100)})` })),
      ...lay.chords.map((ch, k) => {
        const a = names[ch.source.index];
        const b = names[ch.target.index];
        const self = ch.source.index === ch.target.index;
        return { datum: null, index: n + k, key: `${ch.source.index}-${ch.target.index}`, label: self ? a : `${a} ↔ ${b}`, value: ch.source.value + (self ? 0 : ch.target.value), formatted: self ? `${a} → ${a} ${f.fv(ch.source.value)}` : `${a} → ${b} ${f.fv(ch.source.value)}, ${b} → ${a} ${f.fv(ch.target.value)}` };
      }),
    ];
    const summary = `${plural(n, "group")}: ${lay.groups.map((g) => `${names[g.index]} ${f.fv(g.value)}`).join(", ")}`;
    return { marks, events, summary };
  }

  private hot(ch: Chord) {
    return this.hi.has(ch.source.index) || this.hi.has(ch.target.index);
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const { cx, cy, R, rr } = this.g;
    const n = this.names.length;
    if (i < n) {
      const g = this.groups[i];
      if (!g) return null;
      const [x, y] = polar(cx, cy, R, (g.a0 + g.a1) / 2);
      const sent = this.matrix[i].reduce((a, b) => a + b, 0);
      const received = this.matrix.reduce((a, row) => a + row[i], 0);
      return { x, y, title: this.names[i], rows: [{ label: "Sent", value: f.fv(sent), color: this.hi.has(i) ? emphasisInk(true) : "var(--tc-plot-line-rest)" }, { label: "Received", value: f.fv(received) }] };
    }
    const ch = this.chords[i - n];
    if (!ch) return null;
    const [x, y] = polar(cx, cy, rr * 0.6, (ch.source.a0 + ch.source.a1) / 2);
    const a = this.names[ch.source.index];
    const b = this.names[ch.target.index];
    return { x, y, title: ch.source.index === ch.target.index ? a : `${a} ↔ ${b}`, rows: [{ label: `${a} →`, value: f.fv(ch.source.value), color: emphasisInk(this.hot(ch)) }, ...(ch.source.index === ch.target.index ? [] : [{ label: `${b} →`, value: f.fv(ch.target.value) }])] };
  }

  protected override draw() {
    const { cx, cy, R, rr, thick } = this.g;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const sweep = m.get("__sweep")?.[0] ?? TAU;
    const rib = m.get("__rib")?.[0] ?? 1;
    const n = this.names.length;
    const act = this.active;
    const actGroup = act !== null && act < n ? act : null;
    const actChord = act !== null && act >= n ? this.chords[act - n] : null;
    const kb = this.via === "keyboard";
    const items = m.items.filter((it) => it.data) as { key: string; v: number[]; data: GroupItem | RibbonItem; exiting: boolean }[];

    const ribOpacity = (ch: Chord) => {
      if (actGroup !== null) return ch.source.index === actGroup || ch.target.index === actGroup ? 0.82 : 0.08;
      if (actChord) return ch === actChord ? 0.88 : 0.08;
      return this.hot(ch) ? 0.68 : 0.4;
    };

    const ribbons = items.map((it) => {
      if (it.data.kind !== "ribbon") return nothing;
      const { ch, k } = it.data;
      const [s0, s1, t0, t1] = it.v;
      if (s1 - s0 <= 1e-4 && t1 - t0 <= 1e-4) return nothing;
      const live = !it.exiting;
      const h = live ? this.hover(n + k) : null;
      return svg`<path class="tc-chart__mark ui-cdc__ribbon" ?data-focus=${live && kb && act === n + k} d=${ribbonPath(cx, cy, rr, s0, s1, t0, t1)}
        style=${`fill: ${emphasisInk(this.hot(ch))}`} opacity=${live ? ribOpacity(ch) : 0.08}
        @pointerenter=${h ? h.enter : nothing} @click=${h ? h.click : nothing}></path>`;
    });

    const arcs = items.map((it) => {
      if (it.data.kind !== "group") return nothing;
      const { g, name } = it.data;
      const live = !it.exiting;
      const a0 = Math.min(it.v[0], sweep);
      const a1 = Math.min(it.v[1], sweep);
      const isHi = this.hi.has(g.index);
      const d = arcPath(cx, cy, R - thick, R, a0, a1);
      const mid = (it.v[0] + it.v[1]) / 2;
      const [lx, ly] = polar(cx, cy, R + 10, mid);
      const s = Math.sin(mid);
      const c = Math.cos(mid);
      const isA = live && actGroup === g.index;
      const h = live ? this.hover(g.index) : null;
      return svg`<g @pointerenter=${h ? h.enter : nothing} @click=${h ? h.click : nothing}>
        ${d ? svg`<path class="tc-chart__mark ui-cdc__arc" d=${d} style=${`fill: ${isHi ? emphasisInk(true) : "var(--tc-plot-line-rest)"}`} opacity=${!live ? 0.4 : actGroup === null || isA ? 1 : 0.4}></path>` : nothing}
        ${isA && kb ? svg`<path class="tc-chart__focus" d=${arcPath(cx, cy, R - thick - 2, R + 2, it.v[0], it.v[1])}></path>` : nothing}
        ${this.hideLabels || !live ? nothing : txt(lx, ly + (c > 0.9 ? -3 : c < -0.9 ? 4 : 0), name, { cls: "value", anchor: s > 0.12 ? "start" : s < -0.12 ? "end" : "middle", strong: isHi || isA, opacity: m.fade(D * 0.4, 300) })}
      </g>`;
    });

    return svg`<g opacity=${Math.min(1, rib * 1.2)}>${ribbons}</g><g>${arcs}</g>`;
  }

  static override css = /* css */ `
/* Ribbons are parted by a hairline of the card's colour; the keyboard's ribbon is outlined */
[data-ui="cdc"] { --tc-cdc-part: 0.6; }
.ui-cdc__ribbon { stroke: var(--tc-plot-bg); stroke-width: var(--tc-cdc-part); }
.ui-cdc__ribbon[data-focus] { stroke: var(--tc-plot-focus); stroke-width: 1.5; }
@media (forced-colors: active) {
  .ui-cdc__arc, .ui-cdc__ribbon { forced-color-adjust: none; }
}
`;
}

export type { Chord, ChordGroup } from "./internal/chart/chord";

if (!customElements.get("tc-chord-chart")) customElements.define("tc-chord-chart", TcChordChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-chord-chart": TcChordChart;
  }
}
