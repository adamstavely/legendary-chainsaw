// Charts as data for the CLI and the MCP server: the package's trenchcoat/charts entry (dist/charts.js), loaded on
// first use with Lit's minimal DOM, and tokens.css to resolve the design tokens in SVG output.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DIST } from "./registry.mjs";

let loaded;
/** The trenchcoat/charts module */
export async function charts() {
  if (loaded) return loaded;
  const file = join(DIST, "charts.js");
  if (!existsSync(file)) throw new Error("dist/charts.js is missing: run npm run build:package");
  const m = await import(file);
  await m.installDomShim();
  loaded = m;
  return m;
}

let tokens;
/** tokens.css as text, to resolve the tokens in an SVG */
export function tokensCss() {
  tokens ??= readFileSync(join(DIST, "../tokens/tokens.css"), "utf8");
  return tokens;
}

/** Rows from a data file's text: JSON (an array, or { rows | data | values }), else CSV */
export async function rowsFrom(text) {
  const t = text.replace(/^﻿/, "").trim();
  if (t.startsWith("[") || t.startsWith("{")) {
    const v = JSON.parse(t);
    const rows = Array.isArray(v) ? v : (v.rows ?? v.data ?? v.values);
    if (!Array.isArray(rows)) throw new Error("JSON data must be an array of rows, or { rows }, { data } or { values }");
    return rows;
  }
  return (await charts()).inlineRows({ csv: t }) ?? [];
}

const MAX_BYTES = 5 * 1024 * 1024;
/** fetch with a 10 second limit and a 5 MB cap, for a spec's { url } data */
export async function limitedFetch(url) {
  if (!/^https?:\/\//i.test(url)) throw new Error("data.url must be http(s)");
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: "follow" });
  const size = Number(res.headers.get("content-length") ?? 0);
  if (size > MAX_BYTES) throw new Error(`data.url is larger than ${MAX_BYTES / 1024 / 1024} MB`);
  const body = await res.arrayBuffer();
  if (body.byteLength > MAX_BYTES) throw new Error(`data.url is larger than ${MAX_BYTES / 1024 / 1024} MB`);
  return new Response(body, { status: res.status, headers: res.headers });
}
