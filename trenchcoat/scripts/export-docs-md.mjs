// The gallery's text as Markdown: one file per page in docs/ – the overview, each library, every component, block,
// screen, illustration and motion piece, and the foundations. The pages are written by app/src/docs/markdown.ts from
// the same data the gallery renders, loaded through Vite so its import.meta.glob and ?raw imports work as they do there.
//   node scripts/export-docs-md.mjs           rewrite docs/ (npm run export:docs-md)
//   node scripts/export-docs-md.mjs --check   fail when docs/ is out of date
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServer } from "vite";

const OUT = "docs";
const check = process.argv.includes("--check");

const server = await createServer({ configFile: "vite.config.ts", server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
let pages;
try {
  const { exportPages } = await server.ssrLoadModule("/src/docs/markdown.ts");
  pages = exportPages();
} finally {
  await server.close();
}

const existing = existsSync(OUT) ? readdirSync(OUT, { recursive: true }).filter((f) => f.endsWith(".md")).map((f) => f.split("\\").join("/")) : [];
const wanted = new Map(pages);

if (check) {
  const stale = [...wanted].filter(([path, md]) => !existsSync(join(OUT, path)) || readFileSync(join(OUT, path), "utf8") !== md).map(([path]) => path);
  const extra = existing.filter((path) => !wanted.has(path));
  if (stale.length || extra.length) {
    console.error(`docs/ is out of date – run npm run export:docs-md\n${[...stale, ...extra.map((p) => `${p} (no page)`)].map((p) => `  ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`docs ok: ${wanted.size} pages`);
} else {
  for (const path of existing) if (!wanted.has(path)) rmSync(join(OUT, path));
  for (const [path, md] of wanted) {
    mkdirSync(dirname(join(OUT, path)), { recursive: true });
    writeFileSync(join(OUT, path), md);
  }
  console.log(`wrote ${wanted.size} pages to ${OUT}/`);
}
