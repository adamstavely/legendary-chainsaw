import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, categoricalInk, defaultChartLabels, TcChartElement, type ChartFrame, type ChartLabels, type ChartModel } from "./internal/chart/element";
import { formatNumber } from "./internal/chart/format";
import { getter, numGetter } from "./internal/chart/accessor";
import { textWidth } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-venn-diagram> – how two or three sets overlap, as circles whose areas are the sets' sizes, placed so each pair's
 * overlap is as close to its size as circles allow. Rows are venn.js's: `{ sets: ["Genomics"], size: 120 }` gives a
 * set, `{ sets: ["Genomics", "Imaging"], size: 30 }` the pair they share (all of it, including any third set), and so
 * on. Each region – a set alone, two only, all three – carries its own count on a chip of the card's colour; the sets'
 * names sit outside their circles. With more than three sets the three largest are drawn, and a note under the
 * drawing says so. The circles grow from their centres when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move region to region, each read with its count and share of everyone
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-venn-diagram heading="Researchers by lab" .data=${[{ sets: ["Genomics"], size: 48 }, …]}></tc-venn-diagram>
 */

/** Overlapping circles, in the Lucide style (24 × 24, 2px strokes) */
const vennIcon = svg`<circle cx="9" cy="9" r="6"></circle><circle cx="15" cy="9" r="6"></circle><circle cx="12" cy="15" r="6"></circle>`;

/** The words a Venn diagram adds to the shared ones */
export type VennLabels = {
  /** "Count" – a region's size, in the tooltip and the table */
  count: string;
  /** "{set} only" – a region in one set alone */
  only: string;
  /** "{sets} only" – a region in some of the sets but not the rest */
  someOnly: string;
  /** " and " – between the last two names in a list */
  and: string;
  /** "Showing the 3 largest of {count} sets" – the note under the drawing, and in the summary */
  largest: string;
  /** "Share of everyone" – a region's share of the union, in the tooltip */
  ofAll: string;
  /** "{count} in {sets} sets" – the summary's start */
  summary: string;
};
export const defaultVennLabels: VennLabels = {
  count: "Count",
  only: "{set} only",
  someOnly: "{sets} only",
  and: " and ",
  largest: "Showing the 3 largest of {count} sets",
  ofAll: "Share of everyone",
  summary: "{count} in {sets} sets",
};

/** A circle, in plot px */
type Circle = { k: number; name: string; cx: number; cy: number; r: number; ink: string };
/** A region: in the `in` sets and none of the others */
type Region = { in: number[]; out: number[]; count: number; label: string; spot: [number, number] | null };

let idCount = 0;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
const keyOf = (names: readonly string[]) => [...names].sort().join("\u0001");

/** The area two circles share, radii r1 and r2 with centres d apart */
export function lensArea(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a = r1 * r1 * Math.acos(Math.min(1, Math.max(-1, (d * d + r1 * r1 - r2 * r2) / (2 * d * r1))));
  const b = r2 * r2 * Math.acos(Math.min(1, Math.max(-1, (d * d + r2 * r2 - r1 * r1) / (2 * d * r2))));
  const c = 0.5 * Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
  return a + b - c;
}

/** How far apart two circles' centres are for them to share `overlap`: bisection, as the lens shrinks with distance */
export function distanceFor(r1: number, r2: number, overlap: number): number {
  const lo0 = Math.abs(r1 - r2);
  const hi0 = r1 + r2;
  // Nothing shared: apart, with a small gap so they plainly don't touch
  if (overlap <= 0) return hi0 + Math.min(r1, r2) * 0.12;
  if (overlap >= Math.PI * Math.min(r1, r2) ** 2) return lo0;
  let lo = lo0;
  let hi = hi0;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (lensArea(r1, r2, mid) > overlap) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Circles for up to three sets, in data units (area = size): the first two side by side, the third placed from its
 * distances to both, or at the nearest point it can go when they can't both be met
 */
export function vennLayout(sizes: readonly number[], pair: (a: number, b: number) => number): { x: number; y: number; r: number }[] {
  const r = sizes.map((s) => Math.sqrt(Math.max(0, s) / Math.PI));
  const out = r.map((rr) => ({ x: 0, y: 0, r: rr }));
  if (r.length < 2) return out;
  const dAB = distanceFor(r[0], r[1], pair(0, 1));
  out[1].x = dAB;
  if (r.length < 3) return out;
  const dAC = distanceFor(r[0], r[2], pair(0, 2));
  const dBC = distanceFor(r[1], r[2], pair(1, 2));
  if (dAB < 1e-9) {
    out[2].x = dAC;
    return out;
  }
  const x = (dAC * dAC - dBC * dBC + dAB * dAB) / (2 * dAB);
  const y2 = dAC * dAC - x * x;
  out[2].x = x;
  out[2].y = y2 > 0 ? Math.sqrt(y2) : 0;
  return out;
}

/**
 * How two or three sets overlap, as circles sized by the sets with each region's count on a chip, and a table view.
 * @tag tc-venn-diagram
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a region, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A region was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcVennDiagram<T = Row> extends TcChartElement<Circle, T> {
  static override ui = "vnn";

  /** The field naming the sets a row is about – one set, or the two or three it overlaps; by default "sets" */
  @property({ attribute: false }) accessor sets: Accessor<T, string[]> | undefined = undefined;
  /** The size field: a set's size, or all that a pair or triple shares; by default "size" */
  @property({ attribute: false }) accessor size: Accessor<T, number> | undefined = undefined;
  /** The Venn diagram's own words, merged over defaultVennLabels */
  @property({ attribute: false }) accessor vennLabels: Partial<VennLabels> = {};

  protected override readonly kind = "Venn diagram";
  protected override readonly icon = vennIcon;
  protected override defaultDuration = 800;
  protected override stagger = 120;
  protected override modelKeys = ["sets", "size", "vennLabels"];

  private uidV = `tc-vnn-${++idCount}`;
  private circles: Circle[] = [];
  private regions: Region[] = [];
  private names: { k: number; x: number; y: number; anchor: "start" | "middle" | "end"; text: string }[] = [];
  private note = "";

  /** A region's value is its count, so the shared "Value" reads "Count" unless the page renames it */
  protected override get words(): ChartLabels {
    return { ...defaultChartLabels, value: this.vennWords.count, ...this.labels };
  }

  private get vennWords(): VennLabels {
    return { ...defaultVennLabels, ...this.vennLabels };
  }

  protected override defaultHeight(w: number) {
    // Two sets side by side are wide and low; three make a triangle
    const sets = new Set<string>();
    const gs = getter(this.sets, "sets");
    this.data.forEach((d, i) => {
      const raw = gs(d, i);
      if (Array.isArray(raw) && raw.length === 1) sets.add(String(raw[0]));
    });
    return sets.size === 2 ? Math.max(180, Math.min(260, w * 0.45)) : Math.max(220, Math.min(340, w * 0.62));
  }

  protected override tableHeader() {
    return "Region";
  }

  private list(names: string[]) {
    const and = this.vennWords.and;
    return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")}${and}${names[names.length - 1]}`;
  }

  protected override buildModel(f: ChartFrame): ChartModel<Circle, T> {
    const { width: W, height: H } = f;
    const vw = this.vennWords;
    const gs = getter(this.sets, "sets");
    const gz = numGetter(this.size, "size");
    // The sizes by their sets, whatever order a row names them in
    const sizes = new Map<string, number>();
    const rows: { names: string[]; size: number; datum: T }[] = [];
    this.data.forEach((d, i) => {
      const raw = gs(d, i);
      const names = (Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : []).map(String).filter(Boolean);
      const size = gz(d, i);
      if (!names.length || !Number.isFinite(size)) return;
      rows.push({ names, size, datum: d });
      sizes.set(keyOf(names), size);
    });
    const singles = rows.filter((r) => r.names.length === 1).sort((a, b) => b.size - a.size);
    const drawn = singles.slice(0, 3).map((r) => r.names[0]);
    const n = drawn.length;
    const size = (names: string[]) => sizes.get(keyOf(names)) ?? 0;
    this.note = singles.length > 3 ? fill(vw.largest, { count: singles.length }) : "";

    // Each region's own count: what its sets share, less what it shares with the sets left out
    const all = n === 3 ? size(drawn) : 0;
    const pairOf = (a: number, b: number) => Math.min(size([drawn[a], drawn[b]]), size([drawn[a]]), size([drawn[b]]));
    const regionsAll: Region[] = [];
    const nameOnly = (ks: number[]) => (ks.length === n ? this.list(ks.map((k) => drawn[k])) : ks.length === 1 ? fill(vw.only, { set: drawn[ks[0]] }) : fill(vw.someOnly, { sets: this.list(ks.map((k) => drawn[k])) }));
    const add = (ks: number[], count: number) => regionsAll.push({ in: ks, out: drawn.map((_, k) => k).filter((k) => !ks.includes(k)), count: Math.max(0, count), label: nameOnly(ks), spot: null });
    for (let k = 0; k < n; k++) {
      let own = size([drawn[k]]);
      for (let j = 0; j < n; j++) if (j !== k) own -= pairOf(k, j);
      add([k], own + all);
    }
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) add([a, b], pairOf(a, b) - all);
    if (n === 3) add([0, 1, 2], all);
    const union = regionsAll.reduce((s, r) => s + r.count, 0);

    // Circles in data units, then fitted into the plot with room for the names round them
    const lay = vennLayout(
      drawn.map((d) => size([d])),
      (a, b) => pairOf(a, b),
    );
    const nameW = Math.max(0, ...drawn.map((d) => textWidth(d, AXIS_FONT, 700)));
    // Names beside the circles when they fit there with half the width left for the drawing; else above and below them
    const beside = nameW + 12 <= W * 0.25;
    const padX = beside ? nameW + 12 : 6;
    const padY = beside ? 22 : 26;
    const minX = Math.min(...lay.map((c) => c.x - c.r));
    const maxX = Math.max(...lay.map((c) => c.x + c.r));
    const minY = Math.min(...lay.map((c) => c.y - c.r));
    const maxY = Math.max(...lay.map((c) => c.y + c.r));
    const bw = Math.max(1e-9, maxX - minX);
    const bh = Math.max(1e-9, maxY - minY);
    const s = Math.max(0.0001, Math.min((W - padX * 2) / bw, (H - padY * 2) / bh));
    const ox = (W - bw * s) / 2 - minX * s;
    const oy = (H - bh * s) / 2 - minY * s;
    const circles: Circle[] = lay.map((c, k) => ({ k, name: drawn[k], cx: ox + c.x * s, cy: oy + c.y * s, r: c.r * s, ink: categoricalInk(k) }));
    this.circles = circles;

    // Each region's chip: the point inside it furthest from every edge, found on a grid
    for (const rg of regionsAll) {
      const home = circles[rg.in[0]];
      if (!home || home.r <= 0) continue;
      const step = Math.max(1.5, home.r / 16);
      let best = -Infinity;
      for (let x = home.cx - home.r; x <= home.cx + home.r; x += step)
        for (let y = home.cy - home.r; y <= home.cy + home.r; y += step) {
          let m = Infinity;
          for (const k of rg.in) m = Math.min(m, circles[k].r - Math.hypot(x - circles[k].cx, y - circles[k].cy));
          for (const k of rg.out) m = Math.min(m, Math.hypot(x - circles[k].cx, y - circles[k].cy) - circles[k].r);
          if (m > 0 && m > best) {
            best = m;
            rg.spot = [x, y];
          }
        }
    }
    // The names outside their circles, away from the middle of them all, kept inside the plot
    const mx = circles.reduce((a, c) => a + c.cx, 0) / Math.max(1, n);
    const my = circles.reduce((a, c) => a + c.cy, 0) / Math.max(1, n);
    this.names = circles.map((c) => {
      let dx = c.cx - mx;
      let dy = c.cy - my;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) [dx, dy] = [0, -1];
      else [dx, dy] = [dx / len, dy / len];
      const tw = textWidth(c.name, AXIS_FONT, 700);
      let x = c.cx + dx * (c.r + 8);
      let y = c.cy + dy * (c.r + 10);
      let anchor: "start" | "middle" | "end" = !beside || Math.abs(dx) < 0.35 ? "middle" : dx > 0 ? "start" : "end";
      if (anchor === "middle") {
        // Above or below the circle, centred on it; two circles level with each other take one each
        const up = beside ? dy < 0 : Math.abs(dy) < 0.35 ? c.k === 0 : dy < 0;
        x = c.cx;
        y = c.cy + (up ? -1 : 1) * (c.r + 12);
      }
      const left = anchor === "start" ? x : anchor === "end" ? x - tw : x - tw / 2;
      if (left < 2) {
        x = 2;
        anchor = "start";
      } else if (left + tw > W - 2) {
        x = W - 2;
        anchor = "end";
      }
      y = Math.max(8, Math.min(H - 8, y));
      return { k: c.k, x, y, anchor, text: c.name };
    });

    const shown = regionsAll.filter((r) => r.count > 0);
    // Rows for sets beyond the three drawn: in the table and the keyboard order, though not drawn
    const extra: Region[] = rows
      .filter((r) => r.names.some((nm) => !drawn.includes(nm)))
      .map((r) => ({ in: [], out: [], count: r.size, label: r.names.length === 1 ? r.names[0] : this.list(r.names), spot: null }));
    this.regions = [...shown, ...extra];

    const marks = circles.map((c, k) => ({ key: `c:${c.name}`, to: [c.cx, c.cy, c.r], from: [c.cx, c.cy, c.r], enter: [c.cx, c.cy, 0], delay: k * this.stagger, data: c }));
    const events = this.regions.map((rg, i) => ({
      datum: null,
      index: i,
      key: rg.in.length ? `r:${rg.in.join("")}` : `x:${rg.label}`,
      label: rg.label,
      value: rg.count,
      formatted: rg.in.length ? `${this.count(rg.count, f)} (${f.pct(union ? (rg.count / union) * 100 : 0)})` : this.count(rg.count, f),
    }));
    const parts = [fill(vw.summary, { count: this.count(union, f), sets: n })];
    parts.push(shown.map((r) => `${r.label} ${this.count(r.count, f)}`).join(", "));
    if (this.note) parts.push(this.note);
    return { marks, events, summary: parts.join(". ") };
  }

  private count(v: number, f: ChartFrame) {
    return `${formatNumber(v, { locale: f.locale, maximumFractionDigits: 2 })}${this.unit}`;
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const rg = this.regions[i];
    if (!rg || !rg.in.length) return null;
    const union = this.regions.filter((r) => r.in.length).reduce((s, r) => s + r.count, 0);
    const c = this.circles[rg.in[0]];
    const [x, y] = rg.spot ?? [c.cx, c.cy];
    return {
      x,
      y: y - 10,
      title: rg.label,
      rows: [
        { label: this.words.value, value: this.count(rg.count, f), color: rg.in.length === 1 ? c.ink : undefined },
        { label: this.vennWords.ofAll, value: f.pct(union ? (rg.count / union) * 100 : 0), strong: false },
      ],
    };
  }

  protected override overlay() {
    return this.note ? html`<p class="ui-vnn__note">${this.note}</p>` : nothing;
  }

  /** A path round the whole plot with circle c cut out: clipped to it, a drawing keeps only what's outside c */
  private outside(c: { cx: number; cy: number; r: number }, f: ChartFrame) {
    const { cx, cy, r } = c;
    return `M-10,-10H${f.width + 10}V${f.height + 10}H-10Z M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;
  }

  protected override draw(f: ChartFrame) {
    const id = this.uidV;
    const m = this.motion;
    // The circles as they are now (mid-entrance or mid-glide), for the regions' clips
    const now = new Map<number, { cx: number; cy: number; r: number }>();
    for (const it of m.items) if (!it.exiting) now.set(it.data.k, { cx: it.v[0], cy: it.v[1], r: Math.max(0, it.v[2]) });
    const settled = !m.animating;
    const chipFade = m.fade(this.circles.length * this.stagger + 300, 300);
    const active = this.active;
    const defs = svg`<defs>${[...now].map(
      ([k, c]) => svg`<clipPath id=${`${id}-in-${k}`}><circle cx=${c.cx} cy=${c.cy} r=${c.r}></circle></clipPath>
        <clipPath id=${`${id}-out-${k}`}><path clip-rule="evenodd" d=${this.outside(c, f)}></path></clipPath>`,
    )}</defs>`;
    // A region: the plot clipped to each of its circles and to outside each of the others, nested
    const region = (rg: Region, i: number) => {
      if (!rg.in.length || !rg.in.every((k) => now.has(k))) return nothing;
      const clips = [...rg.in.map((k) => `${id}-in-${k}`), ...rg.out.filter((k) => now.has(k)).map((k) => `${id}-out-${k}`)];
      let inner = svg`<rect class="ui-vnn__region" x="0" y="0" width=${f.width} height=${f.height} ?data-active=${active === i}></rect>`;
      for (const c of clips.reverse()) inner = svg`<g clip-path=${`url(#${c})`}>${inner}</g>`;
      const hv = this.hover(i);
      return svg`<g class="tc-chart__mark" @pointerenter=${hv.enter} @click=${hv.click}>${inner}</g>`;
    };
    const chip = (rg: Region, i: number) => {
      if (!rg.spot || this.hideLabels || !settled) return nothing;
      const text = formatNumber(rg.count, { locale: f.locale, maximumFractionDigits: 2 });
      const tw = textWidth(text, AXIS_FONT, 700);
      const [x, y] = rg.spot;
      const focus = active === i && this.via === "keyboard";
      return svg`<g class="ui-vnn__chip" opacity=${chipFade}>
        <rect class="ui-vnn__chip-back" ?data-focus=${focus} x=${x - tw / 2 - 5} y=${y - 9} width=${tw + 10} height="18" rx="4"></rect>
        ${txt(x, y, text, { anchor: "middle", cls: "value", strong: true })}
      </g>`;
    };
    return svg`${defs}
      <g>${m.items.map((it) => {
        const [cx, cy, r] = it.v;
        return svg`<circle class="ui-vnn__circle" cx=${cx} cy=${cy} r=${Math.max(0, r)} style=${`--tc-vnn-ink: ${it.data.ink}`} opacity=${it.exiting ? 0.3 : active === null ? 1 : 0.55}></circle>`;
      })}</g>
      <g>${this.regions.map(region)}</g>
      <g>${m.items.map((it) => {
        const [cx, cy, r] = it.v;
        return svg`<circle class="ui-vnn__edge" cx=${cx} cy=${cy} r=${Math.max(0, r)} style=${`--tc-vnn-ink: ${it.data.ink}`}></circle>`;
      })}</g>
      <g>${this.regions.map(chip)}</g>
      <g opacity=${chipFade}>${this.names.map((nm) => txt(nm.x, nm.y, nm.text, { anchor: nm.anchor, strong: true }))}</g>`;
  }

  static override css = /* css */ `
[data-ui="vnn"] {
  --tc-vnn-fill-opacity: 0.22;
  --tc-vnn-active-opacity: 0.4;
}
.ui-vnn__circle { fill: var(--tc-vnn-ink); fill-opacity: var(--tc-vnn-fill-opacity); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-vnn__edge { fill: none; stroke: var(--tc-vnn-ink); stroke-width: 1.5; pointer-events: none; }
/* A region is invisible until it's the active one, then lit in the accent over the circles */
.ui-vnn__region { fill: var(--tc-plot-accent); fill-opacity: 0; }
.ui-vnn__region[data-active] { fill-opacity: var(--tc-vnn-active-opacity); }
/* A region's count on a chip of the card's colour, legible over any ink */
.ui-vnn__chip { pointer-events: none; }
.ui-vnn__chip-back { fill: var(--tc-plot-bg); }
.ui-vnn__chip-back[data-focus] { stroke: var(--tc-plot-focus); stroke-width: 2; }
.ui-vnn__note { margin: var(--tc-space-2) 0 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
@media (forced-colors: active) {
  .ui-vnn__circle, .ui-vnn__edge, .ui-vnn__region { forced-color-adjust: none; }
  .ui-vnn__chip-back { fill: Canvas; }
}
`;
}

if (!customElements.get("tc-venn-diagram")) customElements.define("tc-venn-diagram", TcVennDiagram);

declare global {
  interface HTMLElementTagNameMap {
    "tc-venn-diagram": TcVennDiagram;
  }
}
