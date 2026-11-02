#!/usr/bin/env node
// An MCP server over stdio, so coding agents can look Trenchcoat up. Read-only: it answers from the package's own files,
// writes nothing and calls nothing outside the process. Messages are one JSON-RPC object per line, as MCP's stdio transport
// defines. Logs go to stderr, because stdout carries the protocol.
import { createInterface } from "node:readline";
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
];

const text = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 1) }] });
const refused = (message) => ({ content: [{ type: "text", text: message }], isError: true });

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
      if (!Object.keys(usage).length) return text(`${entry.name} is a React file to copy: npx trenchcoat add ${entry.slug}`);
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
    const result = callTool(params?.name, params?.arguments);
    return result ? reply(id, result) : replyError(id, -32602, `Unknown tool: ${params?.name}`);
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
