// The Markdown export (npm run export:docs-md): a page per gallery page, and links between them that land.
import assert from "node:assert/strict";
import { dirname, join, posix } from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
let server;
let mod;
let pages;

before(async () => {
  server = await createServer({ configFile: join(ROOT, "vite.config.ts"), server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
  mod = await server.ssrLoadModule("/src/docs/markdown.ts");
  pages = new Map(mod.exportPages());
});
after(() => server?.close());

/** The anchor GitHub gives each heading, outside code blocks */
const anchors = (md) =>
  new Set(
    md
      .replace(/```[\s\S]*?```/g, "")
      .split("\n")
      .flatMap((line) => line.match(/^#{1,6} (.*)$/)?.[1] ?? [])
      .map((t) => t.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")),
  );

describe("export:docs-md", () => {
  test("writes the overview, each library's index, every piece and the foundations", () => {
    assert.equal(pages.size, 1 + 5 + mod.PIECES.length + mod.FOUNDATION_PAGES.length);
    for (const p of mod.PIECES) assert.ok(pages.has(`${p.library}/${p.slug}.md`), p.id);
    assert.ok(mod.PIECES.length > 400);
  });

  test("leaves no gallery route behind, and every link lands on a page and a heading", () => {
    const broken = [];
    for (const [path, md] of pages) {
      const prose = md.replace(/```[\s\S]*?```/g, "");
      if (/\]\(#\//.test(prose)) broken.push(`${path}: a #/ route`);
      for (const [, url] of prose.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^[a-z]+:/.test(url) || url.startsWith("../../")) continue;
        const [file, frag] = url.split("#");
        const target = file ? posix.normalize(posix.join(posix.dirname(path), file)) : path;
        if (!pages.has(target)) broken.push(`${path}: ${url}`);
        else if (frag && !anchors(pages.get(target)).has(frag)) broken.push(`${path}: ${url} (no heading)`);
      }
    }
    assert.deepEqual(broken, []);
  });

  test("a component's page has the sections its gallery page has, in order", () => {
    const md = pages.get("components/subagent-list.md");
    const sections = [...md.matchAll(/^## (.*)$/gm)].map((m) => m[1]);
    assert.deepEqual(sections, ["Example", "Overview", "Anatomy", "Looks", "Usage", "API", "Frameworks", "Accessibility", "Browser support", "Performance", "Content", "Do and don't", "Related", "Changelog"]);
    // Every framework's quick start is written out, not just the first tab
    for (const fw of ["HTML", "React / Next.js", "Vue / Nuxt", "Angular", "Svelte"]) assert.match(md, new RegExp(`^### ${fw.replace("/", "\\/")}$`, "m"));
    assert.match(md, /^\| `tc-selected-change` \| Yes \|/m);
  });

  test("tag names in descriptions are text, not HTML", () => {
    const md = pages.get("components/subagent-list.md");
    assert.match(md, /follows &lt;tc-look-provider>/);
  });
});
