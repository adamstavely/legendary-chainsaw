/*
 * Charts as JSON (ported from ztd-charts' spec, MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts): a spec
 * names a chart type, gives its data (rows, { values }, { csv } or { url }), maps the chart's channels to fields
 * (`encoding`) and sets its options. specToElement() turns one into a chart's tag and properties; validateSpec() says
 * what's wrong with one without drawing it. ztd's own option names are accepted where ours differ (showRates: false is
 * hide-rates, animate: false is still), so its specs draw here as they are.
 *
 * Every chart's properties are also checked by its generative-UI schema (trenchcoat/generative) before they're set.
 */
import { toNumber, uniq } from "./accessor";
import { normalizeData, parseCSV } from "./parse";

export type SpecData = Record<string, unknown>[] | { values: Record<string, unknown>[] } | { csv: string } | { url: string; format?: "json" | "csv" | "auto"; select?: string };

/** A chart as JSON – no functions, so it can be written by a person, a model or a tool */
export type ChartSpec = {
  $schema?: string;
  /** The chart type: "bar", "line", "sankey"… – chartTypes lists them – or a chart's tag, "tc-bar-chart" */
  type: string;
  /** Rows, { values }, { csv } or { url } (fetched first with resolveSpecData) */
  data: SpecData;
  /** Channel → field: { "label": "lab", "value": "samples" }; a list of fields for wide tables where the chart takes one */
  encoding?: Record<string, string | string[]>;
  /** The chart's other properties: highlight, format, unit, height, layout… */
  options?: Record<string, unknown>;
  /** The heading */
  title?: string;
  /** One line under the heading */
  description?: string;
};

export type ChartGroup = "proportion" | "trend" | "comparison" | "distribution" | "relationship" | "flow" | "hierarchy" | "kpi";
export type ChartLevel = "basic" | "intermediate" | "advanced";
export type FieldType = "string" | "number" | "date" | "any";
export type ChannelDef = { name: string; type: FieldType; required: boolean; multi?: boolean; description: string };
export type ChartTypeDef = {
  type: string;
  tag: string;
  name: string;
  level: ChartLevel;
  group: ChartGroup;
  summary: string;
  useWhen: string;
  avoidWhen: string;
  channels: ChannelDef[];
  /** The chart's properties from the rows, for a chart that doesn't read fields itself (a gauge, a heatmap's matrix) */
  adapt?: (rows: Record<string, unknown>[], encoding: Record<string, string | string[]>) => Record<string, unknown>;
  /** Drawn only in a page – renderChartToSVG can't draw it */
  pageOnly?: boolean;
};

const ch = (name: string, type: FieldType, required: boolean, description: string, multi = false): ChannelDef => ({ name, type, required, description, ...(multi ? { multi } : {}) });
const LABEL = ch("label", "string", true, "Item name field");
const VALUE = ch("value", "number", true, "Value field");
const def = (type: string, tag: string, name: string, level: ChartLevel, group: ChartGroup, summary: string, useWhen: string, avoidWhen: string, channels: ChannelDef[], extra: Partial<ChartTypeDef> = {}): ChartTypeDef => ({ type, tag, name, level, group, summary, useWhen, avoidWhen, channels, ...extra });

/* ---------- Adapters: rows into the properties of the charts that don't read fields ---------- */

const field = (enc: Record<string, string | string[]>, name: string) => {
  const f = enc[name];
  return Array.isArray(f) ? f[0] : (f ?? name);
};
const num = (v: unknown) => {
  const n = toNumber(v);
  return Number.isFinite(n) ? n : null;
};
/** Distinct values of a field, in the order they first appear */
const distinct = (rows: Record<string, unknown>[], f: string) => uniq(rows.map((r) => String(r[f] ?? "")));

/** One value (and a target) from the first row */
const adaptGauge = (rows: Record<string, unknown>[], enc: Record<string, string | string[]>) => {
  const r = rows[0] ?? {};
  const target = num(r[field(enc, "target")]);
  return { value: num(r[field(enc, "value")]) ?? 0, ...(target !== null ? { target } : {}) };
};
/** Long rows (x, y, value) as a matrix: a row per y, a column per x */
const adaptHeatmap = (rows: Record<string, unknown>[], enc: Record<string, string | string[]>) => {
  const fx = field(enc, "x");
  const fy = field(enc, "y");
  const fv = field(enc, "value");
  const columns = distinct(rows, fx);
  const rowNames = distinct(rows, fy);
  const values: (number | null)[][] = rowNames.map(() => columns.map(() => null));
  for (const r of rows) values[rowNames.indexOf(String(r[fy] ?? ""))][columns.indexOf(String(r[fx] ?? ""))] = num(r[fv]);
  return { rows: rowNames, columns, values };
};
/** Axes and series: long rows (axis, value, series), or a value field per series (wide) */
const adaptRadar = (rows: Record<string, unknown>[], enc: Record<string, string | string[]>) => {
  const fa = field(enc, "axis");
  const axes = distinct(rows, fa);
  const v = enc.value;
  if (Array.isArray(v) && v.length > 1)
    return { axes, series: v.map((f) => ({ name: f, values: axes.map((a) => num(rows.find((r) => String(r[fa]) === a)?.[f])) })) };
  const fv = field(enc, "value");
  const fs = enc.series === undefined ? null : field(enc, "series");
  const names = fs ? distinct(rows, fs) : ["Value"];
  return { axes, series: names.map((name) => ({ name, values: axes.map((a) => num(rows.find((r) => String(r[fa]) === a && (!fs || String(r[fs]) === name))?.[fv])) })) };
};
/** The y values in order, with x as their labels */
const adaptSparkline = (rows: Record<string, unknown>[], enc: Record<string, string | string[]>) => {
  const fy = field(enc, "y");
  const fx = enc.x === undefined && !rows.some((r) => "x" in r) ? null : field(enc, "x");
  return { values: rows.map((r) => num(r[fy])), ...(fx ? { labels: rows.map((r) => String(r[fx] ?? "")) } : {}) };
};

/** Every chart a spec can draw */
export const chartTypes: readonly ChartTypeDef[] = [
  def("bar", "tc-bar-chart", "Bar chart", "basic", "comparison", "Grouped, stacked, 100% and horizontal bars", "Comparing sizes across categories precisely", "The flow over time is the point (a line works better)", [ch("x", "string", true, "Category field"), ch("y", "number", true, "Value field; a list for a wide table", true), ch("series", "string", false, "Series field (long table)")]),
  def("line", "tc-line-chart", "Line chart", "basic", "trend", "Change over time", "A measure over time, alone or against other series", "x is a category with no order", [ch("x", "any", true, "x field – dates, numbers or categories"), ch("y", "number", true, "y field; a list for a wide table", true), ch("series", "string", false, "Series field (long table)")]),
  def("area", "tc-area-chart", "Area chart", "basic", "trend", "Running totals and a changing mix (stacked, 100% stacked)", "How each part's share changes within the total", "The exact value of each series matters", [ch("x", "any", true, "x field"), ch("y", "number", true, "y field; a list for a wide table", true), ch("series", "string", false, "Series field")]),
  def("pie", "tc-pie-chart", "Pie chart", "basic", "proportion", "Each item's share of the whole", "2 to 4 items that add up to 100%", "More than 4 items, or values close to each other", [LABEL, VALUE]),
  def("donut", "tc-donut-chart", "Donut chart", "basic", "proportion", "A share chart with the total in the centre", "The total matters as much as the shares", "More than 6 items", [LABEL, VALUE]),
  def("lollipop", "tc-lollipop-chart", "Lollipop chart", "basic", "comparison", "A stem and dot per item; stays light with many items", "Rankings of 7 to 20 items", "The differences between values are very small", [LABEL, VALUE]),
  def("dumbbell", "tc-dumbbell-chart", "Dumbbell chart", "intermediate", "comparison", "The gap between two values per item", "Before and after, or target and actual, by item", "There is only one value", [LABEL, ch("start", "number", true, "Before value"), ch("end", "number", true, "After value")]),
  def("slope", "tc-slope-chart", "Slope chart", "intermediate", "comparison", "Change in size and rank between two moments", "Comparing just two points in time", "3 or more points in time (use a line or bump chart)", [LABEL, ch("x", "string", false, "Period field (long table)"), ch("value", "number", false, "Value field (long table)")]),
  def("bump", "tc-bump-chart", "Bump chart", "intermediate", "trend", "Rank changes over time", "What matters is the rank", "The value gaps between ranks matter", [ch("x", "any", true, "Period field"), ch("series", "string", true, "Item field"), ch("rank", "number", false, "Rank field (1 is first)"), ch("value", "number", false, "Value field, instead of rank – the largest first")]),
  def("bullet", "tc-bullet-chart", "Bullet chart", "intermediate", "kpi", "Each measure against a target and poor, fair and good ranges", "Several measures with their targets in a small space", "There is no target or range", [LABEL, ch("value", "number", true, "Actual value field"), ch("target", "number", false, "Target field")]),
  def("segmented", "tc-segmented-bar", "Segmented bar", "basic", "proportion", "One whole split into a bar by share, with a list", "The mix in one line inside a card (2 to 6 items)", "Comparing similar values, or many items", [LABEL, VALUE]),
  def("waterfall", "tc-waterfall-chart", "Waterfall chart", "intermediate", "comparison", "The change from a start to an end, broken into its steps", "Explaining why one figure became another", "More than 12 steps", [LABEL, ch("value", "number", true, "Change (total rows may leave it out)"), ch("type", "string", false, '"total" makes a total bar')]),
  def("pareto", "tc-pareto-chart", "Pareto chart", "intermediate", "comparison", "Bars from the largest with a running share", "How few items make most of the total", "The items' order means something", [LABEL, VALUE]),
  def("waffle", "tc-waffle-chart", "Waffle chart", "intermediate", "proportion", "A share on a 100-cell grid", "A share reads better as a count, like 38 out of 100", "More than 4 items, or differences under 1% matter", [LABEL, VALUE]),
  def("funnel", "tc-funnel-chart", "Funnel chart", "basic", "flow", "How much is left at each step, with its rate", "Ordered steps of a process", "The steps have no order, or values grow step to step", [ch("label", "string", true, "Step name"), ch("value", "number", true, "Count at the step")]),
  def("marimekko", "tc-marimekko-chart", "Marimekko chart", "advanced", "proportion", "Two shares at once: column width and share within the column", "Size by one category and mix by another in one chart", "More than 6 columns or 4 series", [ch("x", "string", true, "Column field"), ch("series", "string", true, "Stacked series field"), VALUE]),
  def("treemap", "tc-treemap", "Treemap", "intermediate", "hierarchy", "Shares of a hierarchy as area", "Two levels of share at once", "Exact size comparison matters", [ch("label", "string", true, "Leaf name"), VALUE, ch("group", "string", false, "Parent group field")]),
  def("sunburst", "tc-sunburst-chart", "Sunburst chart", "intermediate", "hierarchy", "A hierarchy drawn in rings", "A breakdown of 2 to 3 levels", "4 or more levels, or more than 20 leaves", [ch("label", "string", true, "Leaf name"), VALUE, ch("group", "string", false, "Parent group field")]),
  def("sankey", "tc-sankey-chart", "Sankey chart", "advanced", "flow", "How much flows between stages", "An amount moving from sources through steps to outcomes", "The flow loops back, or there are more than 30 nodes", [ch("source", "string", true, "Source node"), ch("target", "string", true, "Target node"), VALUE]),
  def("chord", "tc-chord-chart", "Chord chart", "advanced", "flow", "How much groups send to and receive from each other", "Two-way exchanges, such as requests between teams", "More than 10 groups", [ch("source", "string", true, "Sending group"), ch("target", "string", true, "Receiving group"), VALUE]),
  def("beeswarm", "tc-beeswarm-chart", "Beeswarm chart", "advanced", "distribution", "A distribution with every point laid out without overlap", "Each item's value, group by group", "Thousands of points that overlap (use a ridgeline or box plot)", [ch("value", "number", true, "Value field"), ch("group", "string", false, "Group (row) field"), ch("label", "string", false, "Point name")]),
  def("bubble", "tc-bubble-chart", "Bubble chart", "intermediate", "relationship", "Three values at once – x, y and size; without size, a scatter plot", "How three measures relate", "Points overlap and sizes get hard to compare", [ch("x", "number", true, "x value"), ch("y", "number", true, "y value"), ch("size", "number", false, "Circle size"), ch("label", "string", false, "Name")]),
  def("calendar", "tc-calendar-heatmap", "Calendar heatmap", "intermediate", "trend", "Daily amounts on a grid of weeks", "The rhythm of daily activity", "A period shorter than a month", [ch("date", "date", true, "Date field"), VALUE]),
  def("parallel", "tc-parallel-chart", "Parallel chart", "advanced", "relationship", "Several measures, each on its own axis, a line per row", "Comparing 4 to 8 measures at once", "The audience sees it for the first time", [ch("label", "string", false, "Row name field")]),
  def("box", "tc-box-plot", "Box plot", "advanced", "distribution", "A distribution summary by group – quartiles, median, outliers", "Spread and outliers together, by group", "The audience isn't used to quartiles (a beeswarm is easier)", [ch("group", "string", true, "Group field"), VALUE]),
  def("ridgeline", "tc-ridgeline-chart", "Ridgeline chart", "advanced", "distribution", "Group distributions as overlapping curves", "Comparing distributions across 5 to 12 groups", "3 or fewer groups (a box plot is simpler)", [ch("group", "string", true, "Group field"), VALUE]),
  def("candlestick", "tc-candlestick-chart", "Candlestick chart", "advanced", "trend", "Open, high, low and close for each period", "Readings where the swing within each period matters", "A trend with one value per period (a line is cleaner)", [ch("x", "date", true, "Period field"), ch("open", "number", true, "Open field"), ch("high", "number", true, "High field"), ch("low", "number", true, "Low field"), ch("close", "number", true, "Close field"), ch("volume", "number", false, "Volume field")]),
  def("stream", "tc-stream-graph", "Stream graph", "advanced", "trend", "Many series as flowing bands round a moving centre", "5 or more series where the rhythm of the flow matters", "You need to read exact values", [ch("x", "any", true, "x field"), ch("y", "number", true, "y field; a list for a wide table", true), ch("series", "string", false, "Series field")]),
  def("radialBar", "tc-radial-bar-chart", "Radial bar chart", "intermediate", "kpi", "Ratios such as progress towards goals, as rings", "Progress on 3 to 6 goals in one view", "Comparing values precisely (outer rings look longer)", [LABEL, VALUE]),
  // Not in ztd-charts: the library's own Histogram, Combo Chart and Venn Diagram
  def("histogram", "tc-histogram", "Histogram", "basic", "distribution", "Raw values binned into touching bars", "The shape of one measure from many raw values", "Comparing several groups (a box plot or ridgeline is clearer)", [VALUE]),
  def("combo", "tc-combo-chart", "Combo chart", "intermediate", "comparison", "Bars and lines over one x, with a second axis when their ranges differ", "A volume against a rate, like samples against turnaround", "More than 3 series, or two measures with no real link", [ch("x", "any", true, "Category or date field"), ch("bars", "number", true, "Fields drawn as bars", true), ch("lines", "number", false, "Fields drawn as lines", true)]),
  def("venn", "tc-venn-diagram", "Venn diagram", "intermediate", "relationship", "How 2 or 3 sets overlap, circles sized by the sets", "Members shared between two or three groups", "Four or more sets", [ch("sets", "any", true, "The set or sets a row is about, as a list"), ch("size", "number", true, "Size, or the size shared")]),
  def("rose", "tc-rose-chart", "Rose chart", "intermediate", "comparison", "Equal-angle wedges whose area shows each value – a polar area chart", "A value for each step of a cycle, like months or hours", "Comparing values precisely (bars are clearer)", [LABEL, VALUE, ch("series", "string", false, "Series field, stacked in each wedge")]),
  def("hexbin", "tc-hexbin-chart", "Hexbin chart", "intermediate", "relationship", "Many x–y points gathered into hexagons shaded by count", "Thousands of points where a scatter plot would be a blot", "A few hundred points or fewer (a scatter plot shows each)", [ch("x", "number", true, "X field"), ch("y", "number", true, "Y field"), ch("value", "number", false, "Value field for aggregate sum or mean")]),
  def("network", "tc-network-graph", "Network graph", "advanced", "relationship", "Nodes and the links between them, laid out by force", "Clusters and the nodes that bridge them, in up to a few thousand nodes", "One node at the centre of everything (a relationship graph), or one-way flows (a sankey)", [ch("source", "string", true, "One end of a link"), ch("target", "string", true, "The other end"), ch("value", "number", false, "Link strength")]),
  // The library's own Gauge, Heatmap, Radar Chart and Sparkline, drawn in pages; their rows are reshaped to their properties
  def("gauge", "tc-gauge", "Gauge", "basic", "kpi", "One value against its range and target", "One measure, large, against a target", "Comparing several values", [ch("value", "number", true, "Value field (the first row's)"), ch("target", "number", false, "Target field")], { adapt: adaptGauge, pageOnly: true }),
  def("heatmap", "tc-heatmap", "Heatmap", "intermediate", "relationship", "Values where two categories meet, as shades", "Patterns such as runs by weekday and hour", "Exact values matter", [ch("x", "string", true, "Column field"), ch("y", "string", true, "Row field"), VALUE], { adapt: adaptHeatmap, pageOnly: true }),
  def("radar", "tc-radar-chart", "Radar chart", "intermediate", "comparison", "Several measures at once round a centre", "Up to three items on 5 to 8 measures", "More than 3 series", [ch("axis", "string", true, "Measure (axis) field"), ch("value", "number", true, "Value field; a list for a wide table", true), ch("series", "string", false, "Series field")], { adapt: adaptRadar, pageOnly: true }),
  def("sparkline", "tc-sparkline", "Sparkline", "basic", "trend", "A small trend line in text or a table cell", "The trend matters more than exact values", "You need to read axis values", [ch("x", "any", false, "x field (labels)"), ch("y", "number", true, "y field")], { adapt: adaptSparkline, pageOnly: true }),
];

const byType = new Map<string, ChartTypeDef>();
for (const d of chartTypes) {
  byType.set(d.type.toLowerCase(), d);
  byType.set(d.tag, d);
}
/** ztd's names for the same charts */
for (const [alias, type] of [["radial-bar", "radialBar"], ["streamgraph", "stream"], ["violin", "box"], ["scatter", "bubble"], ["column", "bar"], ["polar", "rose"], ["nightingale", "rose"], ["graph", "network"]] as const) byType.set(alias, byType.get(type.toLowerCase())!);


/** A chart type by name or tag; undefined when a spec can't draw it */
export function chartType(type: string): ChartTypeDef | undefined {
  return byType.get(type) ?? byType.get(type.toLowerCase());
}

/* ---------- Options: ztd's names onto ours ---------- */

type Rename = (v: unknown, out: Record<string, unknown>) => void;
const flip = (name: string): Rename => (v, out) => (out[name] = v === false);
const OPTION_ALIASES: Record<string, Rename> = {
  animate: flip("still"),
  showLabels: flip("hideLabels"),
  tooltip: (v, out) => (out.hideTooltip = v === false),
  showRates: flip("hideRates"),
  summary: flip("hideSummary"),
  showMedian: flip("hideMedian"),
  outliers: flip("hideOutliers"),
  connectors: flip("hideConnectors"),
  startTotal: (v, out) => (out.deltaStart = v === false),
  brush: (v, out) => (out.brush = v === true ? "select" : v === false ? "none" : v),
  children: (v, out) => (out.childrenField = v),
  labels: (v, out) => {
    // ztd's dumbbell and slope take [start, end] words; ours renames the shared words
    if (Array.isArray(v)) [out.startLabel, out.endLabel] = v;
    else out.labels = v;
  },
  periodLabels: (v, out) => Array.isArray(v) && ([out.startLabel, out.endLabel] = v),
  ariaLabel: (v, out) => (out.heading ??= v),
};
/** Options that only shaped ztd's React output, with nothing to set here */
const IGNORED = new Set(["width", "reducedMotion", "animateOnView", "stagger", "replayKey", "className", "style", "theme"]);

/* ---------- Data ---------- */

/** The rows of an inline spec ({ values }, { csv } or rows); null for { url }, which resolveSpecData fetches */
export function inlineRows(data: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(data)) return normalizeData(data);
  if (data && typeof data === "object") {
    const d = data as { values?: unknown; csv?: unknown };
    if (Array.isArray(d.values)) return normalizeData(d.values);
    if (typeof d.csv === "string") return parseCSV(d.csv) as Record<string, unknown>[];
  }
  return null;
}

/** A dotted path into fetched JSON: "data.items" */
const pick = (o: unknown, path: string | undefined) => (path ? path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Record<string, unknown>)[k] : undefined), o) : o);

/**
 * The spec with { url } data fetched and turned into rows (JSON, or CSV by `format` or the response's type). Other data
 * is returned as rows too. `fetcher` replaces fetch – a tool can pass one with a time and size limit
 */
export async function resolveSpecData(spec: ChartSpec, fetcher: (url: string) => Promise<Response> = (u) => fetch(u)): Promise<ChartSpec & { data: Record<string, unknown>[] }> {
  const inline = inlineRows(spec.data);
  if (inline) return { ...spec, data: inline };
  const d = spec.data as { url?: unknown; format?: string; select?: string };
  if (!d || typeof d.url !== "string") throw new Error("data must be rows, { values }, { csv } or { url }");
  const res = await fetcher(d.url);
  if (!res.ok) throw new Error(`data.url answered ${res.status}`);
  const text = await res.text();
  const csv = d.format === "csv" || (d.format !== "json" && !/json/i.test(res.headers.get("content-type") ?? "") && !/^\s*[[{]/.test(text));
  const rows = csv ? parseCSV(text) : normalizeData(pick(JSON.parse(text), d.select));
  return { ...spec, data: rows as Record<string, unknown>[] };
}

/* ---------- Spec → element ---------- */

/** A chart's tag and the properties a spec sets on it (data included) */
export type SpecElement = { tag: string; props: Record<string, unknown> };

/** The tag and properties for a spec with inline data; throws when the type is unknown or the data isn't inline */
export function specToElement(spec: ChartSpec): SpecElement {
  const def = chartType(spec.type);
  if (!def) throw new Error(`Unknown chart type "${spec.type}"`);
  const rows = inlineRows(spec.data);
  if (!rows) throw new Error("data.url must be fetched first – resolveSpecData(spec)");
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(spec.options ?? {})) {
    if (IGNORED.has(k)) continue;
    if (OPTION_ALIASES[k]) OPTION_ALIASES[k](v, props);
    else props[k] = v;
  }
  if (def.adapt) Object.assign(props, def.adapt(rows, spec.encoding ?? {}));
  else for (const [k, v] of Object.entries(spec.encoding ?? {})) props[k] = v;
  if (spec.title !== undefined) props.heading = spec.title;
  if (spec.description !== undefined) props.description = spec.description;
  if (!def.adapt) props.data = rows;
  return { tag: def.tag, props };
}

/* ---------- Checking ---------- */

export type SpecIssue = { path: string; code: string; message: string };
export type SpecCheck = { valid: boolean; errors: SpecIssue[]; warnings: SpecIssue[] };

const kindOf = (v: unknown): FieldType | "empty" => {
  if (v === null || v === undefined || v === "") return "empty";
  if (typeof v === "number" || (typeof v === "string" && Number.isFinite(toNumber(v)))) return "number";
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) return "date";
  return "string";
};

/**
 * What's wrong with a spec, without drawing it: the type, the data, each required channel and the fields it names (in
 * the rows given, or the inline ones). Options are checked against the chart's schema when it's drawn
 */
export function validateSpec(spec: unknown, rows?: Record<string, unknown>[]): SpecCheck {
  const errors: SpecIssue[] = [];
  const warnings: SpecIssue[] = [];
  const err = (path: string, code: string, message: string) => errors.push({ path, code, message });
  if (!spec || typeof spec !== "object") {
    err("", "type", "A spec is an object");
    return { valid: false, errors, warnings };
  }
  const s = spec as ChartSpec;
  const def = typeof s.type === "string" ? chartType(s.type) : undefined;
  if (typeof s.type !== "string") err("type", "required", "type is required");
  else if (!def) err("type", "unknown", `Unknown chart type "${s.type}". Known: ${chartTypes.map((t) => t.type).join(", ")}`);
  const data = rows ?? inlineRows(s.data);
  const remote = !rows && s.data && typeof s.data === "object" && typeof (s.data as { url?: unknown }).url === "string";
  if (!data && !remote) err("data", "invalid", "data must be rows, { values }, { csv } or { url }");
  if (data && !data.length) warnings.push({ path: "data", code: "empty", message: "data has no rows – the chart will say there's nothing to show" });
  if (def && data?.length) {
    const fields = new Set(uniq(data.slice(0, 200).flatMap((r) => Object.keys(r ?? {}))));
    const enc = s.encoding ?? {};
    for (const c of def.channels) {
      const given = enc[c.name];
      // No encoding: the chart reads its default field, named like the channel
      const names = given === undefined ? [c.name] : Array.isArray(given) ? given : [given];
      if (Array.isArray(given) && !c.multi) err(`encoding.${c.name}`, "multi", `${c.name} takes one field`);
      for (const f of names) {
        if (typeof f !== "string") {
          err(`encoding.${c.name}`, "type", `${c.name} names a field`);
          continue;
        }
        if (!fields.has(f)) {
          if (c.required && !(def.type === "slope" && (enc.start || enc.end))) err(`encoding.${c.name}`, "missing-field", `No field "${f}" in the data${given === undefined ? ` – set encoding.${c.name}` : ""}. Fields: ${[...fields].join(", ")}`);
          continue;
        }
        // A number channel whose first values aren't numbers draws nothing
        if (c.type === "number") {
          const kinds = data.slice(0, 50).map((r) => kindOf(r[f])).filter((k) => k !== "empty");
          if (kinds.length && !kinds.some((k) => k === "number")) err(`encoding.${c.name}`, "not-numeric", `"${f}" has no numbers`);
        }
      }
    }
    for (const k of Object.keys(enc)) if (!def.channels.some((c) => c.name === k)) warnings.push({ path: `encoding.${k}`, code: "unknown-channel", message: `${def.name} has no "${k}" channel – channels: ${def.channels.map((c) => c.name).join(", ")}` });
  }
  if (s.options !== undefined && (typeof s.options !== "object" || Array.isArray(s.options))) err("options", "type", "options is an object");
  return { valid: errors.length === 0, errors, warnings };
}
