/*
 * Which charts suit some data (ported from ztd-charts' suggest, MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts):
 * a profile of each column – number, date, category or text, with its spread – then a ranked list of chart types, each
 * with its reason and a spec that draws it. Used by the CLI and the MCP server, and by any page that wants to propose
 * a chart for a table.
 */
import { isYear, toDate } from "./format";
import { toNumber, uniq } from "./accessor";
import { chartType, type ChartSpec } from "./spec";

export type ColumnKind = "number" | "date" | "category" | "text";

export type ColumnProfile = {
  name: string;
  kind: ColumnKind;
  distinct: number;
  nulls: number;
  min?: number;
  max?: number;
  negatives?: boolean;
  integer?: boolean;
  /** Dates about a day apart */
  daily?: boolean;
};

export type DataProfile = { rows: number; columns: ColumnProfile[] };

export type Suggestion = { type: string; name: string; score: number; reason: string; spec: ChartSpec };

const SOURCE_RE = /^(source|from|src|origin)/i;
const TARGET_RE = /^(target|to|dst|dest)/i;
const DATE_NAME = /(date|day|month|week|year|time|period)/i;
const YEAR_NAME = /(year)/i;
/** YYYYMMDD as a number or text (20240315) */
const YMD = /^\d{8}$/;
const RANK_RE = /(rank)/i;
const STAGE_RE = /(stage|step|funnel)/i;
const BEFORE_RE = /(before|prev|start|old)/i;
const AFTER_RE = /(after|next|end|new)/i;
const TARGET_KPI = /(target|goal)/i;

export function profileData(rows: readonly Record<string, unknown>[]): DataProfile {
  const sample = rows.slice(0, 5000);
  const names = uniq(sample.slice(0, 200).flatMap((r) => Object.keys(r ?? {})));
  const columns = names.map((name): ColumnProfile => {
    const vals = sample.map((r) => r?.[name]);
    const present = vals.filter((v) => v !== null && v !== undefined && v !== "");
    const nulls = vals.length - present.length;
    const nums = present.map((v) => toNumber(v));
    const numOk = present.length ? nums.filter(Number.isFinite).length / present.length : 0;
    const distinct = new Set(present.map((v) => String(v))).size;
    // A year column (2019), or YYYYMMDD numbers in a date-named column (20240315), is time too
    const years = YEAR_NAME.test(name) && nums.every(isYear);
    const compact = years || (DATE_NAME.test(name) && present.every((v) => YMD.test(String(v).trim()) && toDate(v)));
    const looksDate = present.length > 0 && (compact || (present.every((v) => (typeof v === "string" && /^\d{4}[-./]\d{1,2}([-./]\d{1,2})?/.test(v)) || v instanceof Date) && present.filter((v) => toDate(v)).length / present.length > 0.9));
    if (looksDate) {
      const ts = present.map((v) => toDate(v)!.getTime()).sort((a, b) => a - b);
      const gaps = ts.slice(1).map((t, i) => t - ts[i]).filter((g) => g > 0);
      const med = gaps.length ? gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 0;
      return { name, kind: "date", distinct, nulls, min: ts[0], max: ts[ts.length - 1], daily: med > 0 && med <= 86400000 * 1.5 };
    }
    if (numOk >= 0.9 && !(typeof present[0] === "string" && /^0\d/.test(String(present[0])))) {
      const f = nums.filter(Number.isFinite);
      return { name, kind: "number", distinct, nulls, min: Math.min(...f), max: Math.max(...f), negatives: f.some((v) => v < 0), integer: f.every((v) => Number.isInteger(v)) };
    }
    const avgLen = present.reduce<number>((a, v) => a + String(v).length, 0) / Math.max(1, present.length);
    return { name, kind: distinct <= Math.max(60, present.length * 0.6) && avgLen < 40 ? "category" : "text", distinct, nulls };
  });
  return { rows: rows.length, columns };
}

function mk(type: string, score: number, reason: string, rows: readonly Record<string, unknown>[], encoding: Record<string, string | string[]>, options?: Record<string, unknown>): Suggestion | null {
  // Charts this library draws outside the spec (gauge, heatmap, radar, sparkline) aren't suggested
  const def = chartType(type);
  if (!def) return null;
  return { type, name: def.name, score: Math.round(score * 100) / 100, reason, spec: { type, title: def.name, description: def.summary, data: rows.slice(0, 5000) as Record<string, unknown>[], encoding, ...(options ? { options } : {}) } };
}

/**
 * Charts that suit the data, best first, each with its reason and a spec ready to draw. Reads the columns – numbers,
 * dates, categories – and their names (source and target, before and after, rank, target, stage)
 */
export function suggestCharts(rows: readonly Record<string, unknown>[], opts: { limit?: number } = {}): { profile: DataProfile; suggestions: Suggestion[] } {
  const profile = profileData(rows);
  const cols = profile.columns;
  const n = profile.rows;
  const nums = cols.filter((c) => c.kind === "number" && !RANK_RE.test(c.name));
  const ranksC = cols.filter((c) => c.kind === "number" && RANK_RE.test(c.name));
  const dates = cols.filter((c) => c.kind === "date");
  const cats = cols.filter((c) => c.kind === "category");
  const out: (Suggestion | null)[] = [];
  const v0 = nums[0];
  if (!n || !cols.length) return { profile, suggestions: [] };

  // Flow: source and target
  const src = cats.find((c) => SOURCE_RE.test(c.name));
  const dst = cats.find((c) => TARGET_RE.test(c.name));
  if (src && dst && v0) {
    const pairs = new Set(rows.map((r) => `${r[src.name]}>${r[dst.name]}`));
    const reciprocal = rows.some((r) => pairs.has(`${r[dst.name]}>${r[src.name]}`));
    const srcVals = new Set(rows.map((r) => String(r[src.name])));
    const chained = rows.some((r) => srcVals.has(String(r[dst.name])));
    // Links that close loops among many nodes read as a network rather than a flow
    const nodes = new Set(rows.flatMap((r) => [String(r[src.name]), String(r[dst.name])]));
    if (nodes.size >= 8 && (reciprocal || chained)) out.push(mk("network", 0.83, `${nodes.size} nodes linked in loops and chains, so a network graph shows the clusters`, rows, { source: src.name, target: dst.name, value: v0.name }));
    if (reciprocal) out.push(mk("chord", 0.92, `${src.name}→${dst.name} goes both ways, so a chord diagram fits`, rows, { source: src.name, target: dst.name, value: v0.name }));
    out.push(mk("sankey", reciprocal ? 0.8 : 0.95, chained ? "The flow runs through several stages, which a Sankey diagram shows well" : "A Sankey diagram shows the amount between source and target as band width", rows, { source: src.name, target: dst.name, value: v0.name }));
  }

  // Time
  const t0 = dates[0];
  if (t0 && v0) {
    const seriesCat = cats.find((c) => c.distinct >= 2 && c.distinct <= 12);
    const span = (t0.max ?? 0) - (t0.min ?? 0);
    // YYYYMMDD numbers (20240315) would make a number axis: read them as dates (line and area take xType)
    const xt = rows.slice(0, 50).some((r) => YMD.test(String(r[t0.name] ?? "").trim())) ? { xType: "date" } : undefined;
    if (t0.daily && span > 86400000 * 60 && !seriesCat) out.push(mk("calendar", 0.9, "Daily values over more than two months show weekday and seasonal patterns in a calendar heatmap", rows, { date: t0.name, value: v0.name }));
    if (seriesCat) {
      out.push(mk("line", 0.93, `Compares the ${t0.name} trend by ${seriesCat.name} (one highlighted line, the rest gray)`, rows, { x: t0.name, y: v0.name, series: seriesCat.name }, xt));
      out.push(mk("area", 0.8, "If the series add up to something meaningful, stacked areas show how the mix changes", rows, { x: t0.name, y: v0.name, series: seriesCat.name }, xt));
      if (seriesCat.distinct >= 5) out.push(mk("stream", 0.72, "With many series, a streamgraph can show the rhythm of the flow", rows, { x: t0.name, y: v0.name, series: seriesCat.name }));
    } else {
      out.push(mk("line", 0.9, `A line chart shows ${v0.name} over ${t0.name}`, rows, { x: t0.name, y: nums.length > 1 && nums.length <= 6 ? nums.map((c) => c.name) : v0.name }, nums.length <= 1 ? { ...xt, area: true } : xt));
      out.push(mk("sparkline", 0.6, "A sparkline fits the trend next to a KPI", rows, { x: t0.name, y: v0.name }));
    }
  }

  // Ranks over time
  const rk = ranksC[0];
  const timeCat = dates[0] ?? cats.find((c) => DATE_NAME.test(c.name));
  const item = cats.find((c) => c !== timeCat && c.distinct >= 3 && c.distinct <= 12);
  if (rk && timeCat && item) out.push(mk("bump", 0.94, `There is a ${rk.name} field, so a bump chart shows the rank changes`, rows, { x: timeCat.name, series: item.name, rank: rk.name }));

  // Categories and a value
  const cat = cats.find((c) => c !== src && c !== dst && !STAGE_RE.test(c.name)) ?? cats[0];
  const stage = cats.find((c) => STAGE_RE.test(c.name));
  if (stage && v0 && !src) {
    const vals = rows.map((r) => toNumber(r[v0.name]));
    const decreasing = vals.every((v, i) => i === 0 || v <= vals[i - 1]);
    if (decreasing) out.push(mk("funnel", 0.96, "Values shrink at every stage, so a funnel shows the drop-off", rows, { label: stage.name, value: v0.name }));
  }
  if (cat && v0 && !t0 && !src) {
    const perCat = n / Math.max(1, cat.distinct);
    const second = cats.find((c) => c !== cat && c !== src && c !== dst);
    if (perCat >= 6 && !second) {
      out.push(mk("box", 0.86, `Each ${cat.name} has many values, so a box plot summarises the distribution`, rows, { group: cat.name, value: v0.name }));
      out.push(mk("beeswarm", n <= 1500 ? 0.84 : 0.6, "A beeswarm shows every single dot", rows, { group: cat.name, value: v0.name }));
      if (cat.distinct >= 4) out.push(mk("ridgeline", 0.8, "With several groups, a ridgeline compares the shape of each distribution", rows, { group: cat.name, value: v0.name }));
    } else if (second && cat.distinct <= 40) {
      const pairs = new Set(rows.map((r) => `${r[cat.name]}|${r[second.name]}`)).size;
      const parent = cat.distinct < second.distinct ? cat : second;
      const child = parent === cat ? second : cat;
      const childToParent = new Map<string, Set<string>>();
      rows.forEach((r) => {
        const k = String(r[child.name]);
        if (!childToParent.has(k)) childToParent.set(k, new Set());
        childToParent.get(k)!.add(String(r[parent.name]));
      });
      const hierarchical = [...childToParent.values()].every((s) => s.size === 1) && child.distinct > parent.distinct;
      const full = pairs >= cat.distinct * second.distinct * 0.8;
      if (hierarchical) {
        out.push(mk("treemap", 0.92, `${child.name} sits under ${parent.name}, so a treemap fits the hierarchy`, rows, { group: parent.name, label: child.name, value: v0.name }));
        out.push(mk("sunburst", 0.82, "A sunburst shows the same hierarchy in rings", rows, { group: parent.name, label: child.name, value: v0.name }));
      } else if (full) {
        const rowsCat = cat.distinct <= second.distinct ? cat : second;
        const colsCat = rowsCat === cat ? second : cat;
        out.push(mk("heatmap", 0.88, `The ${rowsCat.name} × ${colsCat.name} grid is full, so a heatmap shows the pattern`, rows, { x: colsCat.name, y: rowsCat.name, value: v0.name }));
        if (colsCat.distinct <= 6 && rowsCat.distinct <= 5) out.push(mk("marimekko", 0.74, "A marimekko shows the column share and the share within each column together", rows, { x: colsCat.name, series: rowsCat.name, value: v0.name }));
        if (rowsCat.distinct <= 4) out.push(mk("bar", 0.8, "Grouped bars compare each series by category", rows, { x: colsCat.name, y: v0.name, series: rowsCat.name }));
        const periodsC = [cat, second].find((c) => c.distinct === 2);
        const other = periodsC === cat ? second : cat;
        if (periodsC) out.push(mk("slope", 0.86, `${periodsC.name} has only two values, so a slope chart shows the change`, rows, { label: other.name, x: periodsC.name, value: v0.name }));
        if (colsCat.distinct >= 4 && colsCat.distinct <= 10 && rowsCat.distinct <= 3) out.push(mk("radar", 0.7, "A radar chart compares several metrics by series", rows, { axis: colsCat.name, series: rowsCat.name, value: v0.name }));
      }
    } else {
      const k = cat.distinct;
      const vals = rows.map((r) => toNumber(r[v0.name])).filter(Number.isFinite);
      const allPos = vals.every((v) => v >= 0);
      const hasNeg = vals.some((v) => v < 0);
      const sorted = [...vals].sort((a, b) => b - a);
      const tot = sorted.reduce((a, b) => a + b, 0) || 1;
      const top20 = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.2))).reduce((a, b) => a + b, 0) / tot;
      if (hasNeg && n >= 3) out.push(mk("waterfall", 0.9, "Positive and negative values are mixed, so a waterfall separates the ups and downs", rows, { label: cat.name, value: v0.name }));
      if (allPos && k >= 2 && k <= 4) {
        out.push(mk("pie", 0.88, `With ${k} items, a pie chart shows the shares at a glance`, rows, { label: cat.name, value: v0.name }));
        out.push(mk("donut", 0.86, "A donut chart adds the total in the centre", rows, { label: cat.name, value: v0.name }));
        if (k <= 3) out.push(mk("waffle", 0.75, "A waffle chart shows it in 100 cells, like a head count", rows, { label: cat.name, value: v0.name }));
      }
      if (allPos && k >= 5 && k <= 7) out.push(mk("donut", 0.7, "A few more items, but a donut chart can still show the shares", rows, { label: cat.name, value: v0.name }));
      out.push(mk("bar", k <= 12 ? 0.85 : 0.7, "A bar chart compares sizes across categories most accurately", rows, { x: cat.name, y: v0.name }, k > 8 ? { orientation: "horizontal", sort: true } : undefined));
      if (k >= 6) out.push(mk("lollipop", 0.82, "Many items, so a lollipop chart stays light", rows, { label: cat.name, value: v0.name }));
      if (allPos && k >= 6 && top20 >= 0.5) out.push(mk("pareto", 0.86, `The top 20% make up ${Math.round(top20 * 100)}%, so a Pareto chart shows the concentration`, rows, { label: cat.name, value: v0.name }));
      if (allPos && k >= 6) out.push(mk("treemap", 0.66, "A treemap shows the shares as area", rows, { label: cat.name, value: v0.name }));
      if (vals.length >= 3 && vals.every((v, i) => i === 0 || v <= vals[i - 1]) && k <= 8) out.push(mk("funnel", 0.78, "Values keep shrinking, so it reads like a funnel", rows, { label: cat.name, value: v0.name }));
      if (allPos && (k === 7 || k === 12 || k === 24) && /month|hour|day|weekday/i.test(cat.name)) out.push(mk("rose", 0.78, `${k} steps of a cycle, so a rose chart shows the rhythm round the clock`, rows, { label: cat.name, value: v0.name }));
      if (allPos && vals.every((v) => v <= 100) && k <= 6) out.push(mk("radialBar", 0.66, "Values from 0 to 100 read as progress rings", rows, { label: cat.name, value: v0.name }));
    }
  }

  // Two numbers: before and after, or actual and target
  if (cat && nums.length >= 2 && !t0) {
    const a = nums.find((c) => BEFORE_RE.test(c.name));
    const b = nums.find((c) => AFTER_RE.test(c.name) && c !== a);
    const tg = nums.find((c) => TARGET_KPI.test(c.name));
    if (a && b) {
      out.push(mk("dumbbell", 0.9, `A dumbbell chart shows the gap between ${a.name} and ${b.name}`, rows, { label: cat.name, start: a.name, end: b.name }));
      out.push(mk("slope", 0.82, "A slope chart shows the change between two points in time", rows, { label: cat.name }, { start: a.name, end: b.name }));
    }
    if (tg) {
      const actual = nums.find((c) => c !== tg && !/(poor|ok|good)/i.test(c.name));
      if (actual) out.push(mk("bullet", 0.88, "There is a target field, so a bullet chart shows attainment", rows, { label: cat.name, value: actual.name, target: tg.name }));
    }
  }
  if (nums.length >= 1 && n === 1) {
    const tg = nums.find((c) => TARGET_KPI.test(c.name));
    const val = nums.find((c) => c !== tg) ?? nums[0];
    out.push(mk("gauge", 0.95, "A single value works best as a large gauge", rows, { value: val.name, ...(tg ? { target: tg.name } : {}) }));
  }

  // One measure and no groups: its distribution
  if (v0 && !t0 && !cat && n >= 20) out.push(mk("histogram", 0.88, `${n} values of ${v0.name}, so a histogram shows how they spread`, rows, { value: v0.name }));

  // Two measures on one x whose ranges are far apart: bars for the larger, a line on its own axis for the other
  const along = t0 ?? cat;
  if (along && nums.length === 2 && !src) {
    const [a, b] = nums;
    const span = (c: typeof a) => Math.max(Math.abs(c.min ?? 0), Math.abs(c.max ?? 0)) || 1;
    const ratio = span(a) / span(b);
    if ((ratio > 3 || ratio < 1 / 3) && along.distinct <= 24) {
      const [big, small] = ratio > 1 ? [a, b] : [b, a];
      out.push(mk("combo", 0.84, `${big.name} and ${small.name} differ in scale, so bars and a line on a second axis show both`, rows, { x: along.name, bars: [big.name], lines: [small.name] }));
    }
  }

  // Relationships
  if (nums.length >= 2 && !src) {
    const label = cats[0] ?? cols.find((c) => c.kind === "text");
    if (nums.length >= 4 && n <= 20000) out.push(mk("parallel", nums.length >= 5 ? 0.84 : 0.7, `${nums.length} numeric metrics, so parallel coordinates compare them one line per row`, rows, label ? { label: label.name } : {}, { dimensions: nums.slice(0, 8).map((c) => c.name) }));
    const enc: Record<string, string> = { x: nums[0].name, y: nums[1].name };
    if (nums[2]) enc.size = nums[2].name;
    if (label) enc.label = label.name;
    if (n > 3000) out.push(mk("hexbin", 0.88, `${n} points would overlap in a scatter plot, so hexagons shaded by count show where they gather`, rows, { x: nums[0].name, y: nums[1].name }));
    out.push(mk("bubble", nums[2] ? 0.86 : 0.8, nums[2] ? `A bubble chart shows ${nums[0].name}, ${nums[1].name} and ${nums[2].name} together` : `A scatter plot shows how ${nums[0].name} relates to ${nums[1].name}`, rows, enc));
  }

  // Each type once, at its best score
  const best = new Map<string, Suggestion>();
  for (const s of out) {
    if (!s) continue;
    const prev = best.get(s.type);
    if (!prev || s.score > prev.score) best.set(s.type, s);
  }
  const suggestions = [...best.values()].sort((a, b) => b.score - a.score).slice(0, opts.limit ?? 5);
  return { profile, suggestions };
}
