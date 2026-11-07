#!/usr/bin/env node
// An MCP server over stdio, so coding agents can look Trenchcoat up and draw its charts. Read-only: it answers from the
// package's own files, writes nothing and calls nothing outside the process – a chart's data must be given inline. Messages are one JSON-RPC object per line, as MCP's stdio transport
// defines. Logs go to stderr, because stdout carries the protocol.
import { createInterface } from "node:readline";
import { charts, rowsFrom, tokensCss } from "./lib/charts.mjs";
import { lintSources, loadLintData } from "./lib/lint.mjs";
import { findEntry, loadRegistry, readApi, readDoc, searchEntries, usageFor } from "./lib/registry.mjs";

const registry = loadRegistry();
const PROTOCOL = "2025-06-18";
const TYPES = ["component", "block", "screen", "illustration", "motion"];

const TOOLS = [
  {
    name: "search_components",
    description: "Find Trenchcoat components, blocks, screens, illustrations and motion by what they do. Returns names to pass to get_component.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words describing what's needed, such as 'share with people' or 'file flag'" },
        type: { type: "string", enum: TYPES, description: "Only this kind" },
        limit: { type: "number", description: "The most to return; by default 20" },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_component",
    description: "A component's full API (properties, events, slots) and its docs: when to use it, keyboard, accessibility and examples.",
    inputSchema: { type: "object", properties: { name: { type: "string", description: "A slug, name or tag: share-panel, Share Panel or tc-share-panel" } }, required: ["name"] },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_usage",
    description: "How to import and place a component in a framework.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" }, framework: { type: "string", enum: ["html", "react", "vue", "svelte", "angular"] } },
      required: ["name"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "lint_code",
    description: "Check code that uses Trenchcoat for unknown elements, attributes, events and tokens, invalid values and fixed colours. Use it on UI you've just written. Doesn't check whether things are imported elsewhere.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The file's contents" },
        filename: { type: "string", description: "Its name, whose extension says how to read it, such as page.vue; by default page.html" },
      },
      required: ["code"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "list_chart_types",
    description: "The chart types a Trenchcoat chart spec can draw, with what each is for, when to avoid it, and its channels (the fields it reads).",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "validate_chart_spec",
    description: "Check a chart spec { type, data, encoding?, options?, title?, description? } without drawing it: the type, the data, and the fields each channel names.",
    inputSchema: { type: "object", properties: { spec: { type: "object", description: "The chart spec" } }, required: ["spec"] },
    annotations: { readOnlyHint: true },
  },
  {
    name: "render_chart",
    description: "Draw a chart spec as a standalone SVG (the tokens resolved for a look and theme). Data must be inline: rows, { values } or { csv }. Use it to show a chart, or check one looks right before placing <tc-chart> in a page.",
    inputSchema: {
      type: "object",
      properties: {
        spec: { type: "object", description: "The chart spec" },
        width: { type: "number", description: "Width in px; by default 720" },
        height: { type: "number", description: "The plot's height in px; by default the chart's own" },
        theme: { type: "string", enum: ["light", "dark"] },
        look: { type: "string", enum: ["standard", "clean"] },
      },
      required: ["spec"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "suggest_charts",
    description: "Charts that suit some data, best first, each with its reason and a spec ready to render or place in <tc-chart>.",
    inputSchema: {
      type: "object",
      properties: {
        rows: { type: "array", items: { type: "object" }, description: "The data as rows" },
        csv: { type: "string", description: "Or the data as CSV" },
        limit: { type: "number", description: "The most to return; by default 5" },
      },
    },
    annotations: { readOnlyHint: true },
  },
];

const text = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 1) }] });
const refused = (message) => ({ content: [{ type: "text", text: message }], isError: true });

async function chartTool(name, args) {
  const c = await charts();
  if (name === "list_chart_types") return text(c.chartTypes);
  if (name === "validate_chart_spec") return text(c.validateSpec(args.spec));
  if (name === "render_chart") {
    const spec = args.spec;
    if (spec?.data && !Array.isArray(spec.data) && typeof spec.data.url === "string") return refused("render_chart doesn't fetch: give the data inline as rows, { values } or { csv }.");
    const check = c.validateSpec(spec);
    if (check.valid && c.chartType(spec.type)?.pageOnly) return refused(`A ${spec.type} is drawn in pages only: place <tc-chart> with this spec.`);
    if (!check.valid) return refused(`The spec isn't valid: ${check.errors.map((e) => `${e.path || "spec"} ${e.message}`).join("; ")}`);
    const width = Number.isFinite(args.width) ? Math.min(2400, Math.max(120, args.width)) : 720;
    const height = Number.isFinite(args.height) ? Math.min(2400, Math.max(60, args.height)) : undefined;
    const svg = await c.renderChartToSVG(spec, { width, height, theme: args.theme === "dark" ? "dark" : "light", look: args.look === "clean" ? "clean" : "standard", tokensCss: tokensCss() });
    return text(svg);
  }
  if (name === "suggest_charts") {
    const rows = Array.isArray(args.rows) ? args.rows : typeof args.csv === "string" ? await rowsFrom(args.csv) : null;
    if (!rows) return refused("suggest_charts needs rows or csv.");
    return text(c.suggestCharts(rows, { limit: Number.isFinite(args.limit) && args.limit > 0 ? args.limit : 5 }));
  }
  return null;
}

function callTool(name, args = {}) {
  if (name === "search_components") {
    const found = searchEntries(registry, String(args.query ?? ""), TYPES.includes(args.type) ? args.type : undefined);
    const limit = Number.isFinite(args.limit) && args.limit > 0 ? args.limit : 20;
    return text({ total: found.length, results: found.slice(0, limit).map(({ slug, name: title, type, tag, description }) => ({ slug, name: title, type, tag, description })) });
  }
  if (name === "get_component" || name === "get_usage") {
    const entry = typeof args.name === "string" ? findEntry(registry, args.name) : undefined;
    if (!entry) return refused(`No entry called "${args.name}". Use search_components to find one.`);
    if (name === "get_usage") {
      const usage = usageFor(entry);
      if (!Object.keys(usage).length) return text(`${entry.name} is a React file to copy: npx -p @adamstavely/trenchcoat trenchcoat add ${entry.slug}`);
      return text(args.framework ? (usage[args.framework] ?? `No ${args.framework} usage for ${entry.name}.`) : usage);
    }
    return text({ ...entry, api: readApi(entry.slug)?.elements ?? null, docs: readDoc(entry.slug) ?? null });
  }
  if (name === "lint_code") {
    if (typeof args.code !== "string") return refused("lint_code needs the code as text.");
    const file = typeof args.filename === "string" ? args.filename : "page.html";
    return text({ problems: lintSources([{ file, text: args.code }], loadLintData(registry), { project: false }) });
  }
  return null;
}

function reply(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}
function replyError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })}\n`);
}

function handle(message) {
  const { id, method, params } = message;
  // A notification has no id, and never gets an answer
  if (id === undefined) return;
  if (method === "initialize") {
    return reply(id, {
      protocolVersion: params?.protocolVersion ?? PROTOCOL,
      capabilities: { tools: {} },
      serverInfo: { name: "trenchcoat", version: registry.version },
      instructions: "Look components up here before writing UI with Trenchcoat, and use their real properties and events.",
    });
  }
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") return reply(id, { tools: TOOLS });
  if (method === "tools/call") {
    const name = params?.name;
    if (typeof name === "string" && /chart/.test(name) && name !== "search_components")
      return chartTool(name, params?.arguments ?? {}).then(
        (result) => (result ? reply(id, result) : replyError(id, -32602, `Unknown tool: ${name}`)),
        (error) => reply(id, refused(error.message)),
      );
    const result = callTool(name, params?.arguments);
    return result ? reply(id, result) : replyError(id, -32602, `Unknown tool: ${name}`);
  }
  replyError(id, -32601, `Method not found: ${method}`);
}

createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return replyError(null, -32700, "Parse error");
  }
  try {
    handle(message);
  } catch (error) {
    console.error(error);
    if (message?.id !== undefined) replyError(message.id, -32603, "Internal error");
  }
});
