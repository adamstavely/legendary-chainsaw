// The canvas reads Trenchcoat from its source in ../trenchcoat, the way the gallery does, so it always shows the
// elements as they are on this branch – never a stale build.
//
//   · "@adamstavely/trenchcoat/<slug>" resolves to src/elements/<slug>.ts (and the package root, tokens.css and the
//     look provider to their sources)
//   · "virtual:tc-examples" maps each piece's slug to a loader for its live example, made from the ```html block on
//     its docs page (app/src/docs/<slug>.md). Each example becomes a module: the markup, plus a setup function that
//     runs the snippet's script against the card it renders in (see src/data/examples.ts)
//   · "virtual:tc-tokens" maps each element's slug to a loader for "virtual:tc-tokens/<slug>": its tokens that sit on
//     a scale, with the steps to choose from, for the Tune dials
//   · "virtual:tc-graph" lists which elements are built from which, for the Graph layout: an element that renders
//     <tc-other> or imports "./other" uses it
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { tunableTokens } from "./tokens";

const EXAMPLES = "virtual:tc-examples";
const EXAMPLE = "virtual:tc-example/";
const GRAPH = "virtual:tc-graph";
const TOKENS = "virtual:tc-tokens/";
const TOKENS_INDEX = "virtual:tc-tokens";

/**
 * Which elements use which: [user, used] pairs of element slugs, sorted. An element uses another when its source
 * renders <tc-other> or imports "./other"; only elements in `sources` count, and never itself
 */
export function compositionEdges(sources: Readonly<Record<string, string>>): [string, string][] {
  const edges: [string, string][] = [];
  for (const [slug, source] of Object.entries(sources)) {
    const used = new Set([...source.matchAll(/<tc-([a-z0-9-]+)/g), ...source.matchAll(/^import\s+["']\.\/([a-z0-9-]+)(?:\.js)?["'];?$/gm)].map((m) => m[1]));
    for (const other of used) if (other !== slug && Object.hasOwn(sources, other)) edges.push([slug, other]);
  }
  return edges.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
}

export type Example = { markup: string; imports: string[]; script: string };

/** Splits a docs snippet into its markup, its imports (tokens.css dropped – the app loads it once) and its script */
export function parseSnippet(snippet: string): Example {
  const scripts: string[] = [];
  const markup = snippet
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (_, body: string) => {
      scripts.push(body);
      return "";
    })
    .trim();
  const imports: string[] = [];
  const script = scripts
    .join("\n")
    // One import statement at a time: the bindings ({ a, b }, possibly over several lines) hold no quotes or semicolons
    .replace(/^[ \t]*import\s+(?:[^;"']*?\sfrom\s+)?["'][^"']+["'];?[ \t]*$/gm, (line) => {
      if (!/tokens\.css["']/.test(line)) imports.push(line.trim());
      return "";
    })
    .trim();
  return { markup, imports, script };
}

/**
 * Imports for every Trenchcoat element the example uses but doesn't import itself – some snippets leave the import
 * out, as the page around them has it. `exists` says whether a tag has an element module
 */
export function elementImports({ markup, imports, script }: Example, exists: (slug: string) => boolean): string[] {
  const used = new Set([...`${markup}\n${script}`.matchAll(/(?:<|["'`])tc-([a-z0-9-]+)/g)].map((m) => m[1]));
  const have = imports.join("\n");
  return [...used]
    .sort()
    .filter((slug) => exists(slug) && !have.includes(`@adamstavely/trenchcoat/${slug}"`))
    .map((slug) => `import "@adamstavely/trenchcoat/${slug}";`);
}

/** The first ```html block of a docs page, or null */
export function htmlSnippet(markdown: string): string | null {
  return markdown.match(/^```html\n([\s\S]*?)^```/m)?.[1] ?? null;
}

/**
 * The example as a module. The script runs inside setup(), where `document`, `console` and `fetch` are the card's own:
 * the snippet finds its elements in the card, logs nowhere, and its requests get an empty reply
 */
export function exampleModule({ markup, imports, script }: Example): string {
  return `${imports.join("\n")}
export const markup = ${JSON.stringify(markup)};
export default async function setup(document, console, fetch) {
${script}
}
`;
}

export function trenchcoat(root: string): Plugin {
  const elements = join(root, "src/elements");
  const docs = join(root, "app/src/docs");
  const examples = () =>
    readdirSync(docs)
      .filter((f) => f.endsWith(".md") && !/ \d+\.md$/.test(f))
      .map((f) => f.slice(0, -3))
      .filter((slug) => htmlSnippet(readFileSync(join(docs, `${slug}.md`), "utf8")) !== null)
      .sort();

  return {
    name: "trenchcoat-source",
    enforce: "pre",
    resolveId(id) {
      if (id === EXAMPLES) return `\0${EXAMPLES}`;
      if (id === GRAPH) return `\0${GRAPH}`;
      if (id === TOKENS_INDEX) return `\0${TOKENS_INDEX}`;
      if (id.startsWith(TOKENS) && /^[a-z0-9-]+$/.test(id.slice(TOKENS.length))) return `\0${id}`;
      if (id.startsWith(EXAMPLE)) return `\0${id}`;
      if (id === "@adamstavely/trenchcoat") return join(elements, "index.ts");
      if (id === "@adamstavely/trenchcoat/tokens.css") return join(root, "tokens/tokens.css");
      if (id === "@adamstavely/trenchcoat/look-provider") return join(elements, "internal/look.ts");
      const m = id.match(/^@adamstavely\/trenchcoat\/([a-z0-9-]+)$/);
      if (m && existsSync(join(elements, `${m[1]}.ts`))) return join(elements, `${m[1]}.ts`);
    },
    load(id) {
      if (id === `\0${TOKENS_INDEX}`)
        return `export default {\n${readdirSync(elements)
          .filter((f) => /^[a-z0-9-]+\.ts$/.test(f) && f !== "index.ts")
          .map((f) => `  ${JSON.stringify(f.slice(0, -3))}: () => import(${JSON.stringify(TOKENS + f.slice(0, -3))}),`)
          .join("\n")}\n};`;
      if (id.startsWith(`\0${TOKENS}`)) {
        const slug = id.slice(TOKENS.length + 1);
        const file = join(elements, `${slug}.ts`);
        const css = join(root, "tokens/tokens.css");
        if (!existsSync(file)) return "export default [];";
        this.addWatchFile(file);
        this.addWatchFile(css);
        return `export default ${JSON.stringify(tunableTokens(readFileSync(file, "utf8"), slug, readFileSync(css, "utf8")))};`;
      }
      if (id === `\0${GRAPH}`) {
        const files = readdirSync(elements).filter((f) => f.endsWith(".ts") && !/ \d+\.ts$/.test(f) && f !== "index.ts");
        for (const f of files) this.addWatchFile(join(elements, f));
        const sources = Object.fromEntries(files.map((f) => [f.slice(0, -3), readFileSync(join(elements, f), "utf8")]));
        return `export default ${JSON.stringify(compositionEdges(sources))};`;
      }
      if (id === `\0${EXAMPLES}`)
        return `export default {\n${examples()
          .map((s) => `  ${JSON.stringify(s)}: () => import(${JSON.stringify(EXAMPLE + s)}),`)
          .join("\n")}\n};`;
      if (id.startsWith(`\0${EXAMPLE}`)) {
        const slug = id.slice(EXAMPLE.length + 1);
        const file = join(docs, `${slug}.md`);
        this.addWatchFile(file);
        const snippet = htmlSnippet(readFileSync(file, "utf8"));
        if (snippet === null) throw new Error(`${slug}.md has no html example`);
        const example = parseSnippet(snippet);
        const exists = (tag: string) => tag === "look-provider" || existsSync(join(elements, `${tag}.ts`));
        return exampleModule({ ...example, imports: [...example.imports, ...elementImports(example, exists)] });
      }
    },
  };
}
