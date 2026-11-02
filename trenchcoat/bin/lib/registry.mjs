// Reads what scripts/gen-registry.mjs wrote into the package. Shared by the CLI and the MCP server.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const DIST = join(dirname(fileURLToPath(import.meta.url)), "../../dist");

export function loadRegistry() {
  const file = join(DIST, "registry.json");
  if (!existsSync(file)) throw new Error("dist/registry.json is missing: run npm run build:package");
  return JSON.parse(readFileSync(file, "utf8"));
}

const normal = (s) => s.toLowerCase().replace(/^tc-/, "").replace(/[\s_]+/g, "-");

/** An entry by its slug, name or tag */
export function findEntry(registry, name) {
  const wanted = normal(name);
  return registry.entries.find((e) => e.slug === wanted || normal(e.name) === wanted);
}

/** Best matches first: name, then description, every word must match */
export function searchEntries(registry, query = "", type) {
  const words = normal(query).split("-").filter(Boolean);
  return registry.entries
    .filter((e) => e.type !== "support" && (!type || e.type === type))
    .map((e) => {
      const name = `${e.slug} ${e.name.toLowerCase()}`;
      const text = e.description.toLowerCase();
      if (!words.every((w) => name.includes(w) || text.includes(w))) return null;
      return { entry: e, score: words.filter((w) => name.includes(w)).length };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.entry.slug.localeCompare(b.entry.slug))
    .map((r) => r.entry);
}

/** The file an entry's docs live in, or undefined */
export function readDoc(slug) {
  const file = join(DIST, "docs", `${slug}.md`);
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

export function readApi(slug) {
  const file = join(DIST, "docs/api", `${slug}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : undefined;
}

/** How to import an entry in each framework */
export function usageFor(entry) {
  const usage = {};
  if (entry.tag) {
    const component = entry.className?.replace(/^Tc/, "");
    const tag = `<${entry.tag}></${entry.tag}>`;
    const plain = `import "trenchcoat/${entry.slug}";\nimport "trenchcoat/tokens.css";`;
    usage.html = `${tag}\n\n<script type="module">\n  ${plain.replace("\n", "\n  ")}\n</script>`;
    usage.vue = `<script setup>\n${plain}\n</script>\n\n<template>${tag}</template>`;
    usage.svelte = `<script>\n  ${plain.replace("\n", "\n  ")}\n</script>\n\n${tag}`;
    if (component) {
      usage.react = `import { ${component} } from "trenchcoat/react";\nimport "trenchcoat/tokens.css";\n\n<${component} />`;
      usage.angular = `import { ${component} } from "trenchcoat/angular";\n// add ${component} to the component's imports, then:\n// ${tag}`;
    }
  }
  return usage;
}
