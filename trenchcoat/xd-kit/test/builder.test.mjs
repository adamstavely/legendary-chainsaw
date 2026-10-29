// The plugin's builder against a stand-in for XD (test/mock-xd.cjs): every extracted layer of every component lands
// where the browser drew it, groups and masks are made the only way XD allows, and the assets go in.
//   node --test xd-kit/test/*.test.mjs      (after node xd-kit/extract.mjs)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = join(HERE, "..", "plugin", "kit");
const { create } = require("./mock-xd.cjs");
const { layoutKit, makeBuilder, addAssets, fontFor } = require("../plugin/builder.js");

const have = existsSync(join(KIT, "index.json"));
const index = have ? JSON.parse(readFileSync(join(KIT, "index.json"), "utf8")) : { components: [], categories: [] };
const load = (c) => JSON.parse(readFileSync(join(KIT, c.file), "utf8"));

/** Every leaf layer of a tree, in paint order */
const leaves = (layers) => layers.flatMap((l) => (l.t === "group" ? leaves(l.layers) : [l]));
/** Every leaf node under an XD node, in z order (masks left out) */
const nodes = (n) => (n._children.length ? n._children.filter((c) => c !== n.mask).flatMap(nodes) : [n]);
const near = (a, b, what) => assert.ok(Math.abs(a - b) < 0.01, `${what}: ${a} ≠ ${b}`);

test("fonts: weights map to the style names XD lists", () => {
  assert.deepEqual(fontFor({ family: "sans", weight: 500 }), { fontFamily: "Inter", fontStyle: "Medium" });
  assert.deepEqual(fontFor({ family: "sans", weight: 600, italic: true }), { fontFamily: "Inter", fontStyle: "SemiBold Italic" });
  assert.deepEqual(fontFor({ family: "mono", weight: 500 }, { sans: "Inter", mono: "Menlo" }), { fontFamily: "Menlo", fontStyle: "Regular" });
  assert.deepEqual(fontFor({ family: "sans", weight: 400, italic: true }, { sans: "Inter Display" }), { fontFamily: "Inter Display", fontStyle: "Italic" });
});

test("every component builds, layer for layer, in every variant", { skip: !have && "run xd-kit/extract.mjs first" }, () => {
  let total = 0;
  for (const c of index.components) {
    const data = load(c);
    for (const [variant, tree] of Object.entries(data.variants)) {
      if (!tree) continue;
      const xd = create();
      const build = makeBuilder(xd);
      const board = { category: c.category, variant, w: 2000, h: 2000, x: 0, y: 0, items: [] };
      const ab = build.artboard(board, xd.root);
      const item = { slug: c.slug, name: c.name, tree, x: 100, y: 200 };
      const top = build.component(item, ab, variant, variant.split("-")[1]);
      const want = leaves(tree.layers);
      assert.ok(top, `${c.slug} ${variant}: nothing built`);
      assert.ok(top.name.startsWith(`${c.name} / `), `${c.slug} ${variant}: named ${top.name}`);
      const got = nodes(top);
      assert.equal(got.length, want.length, `${c.slug} ${variant}: ${got.length} nodes for ${want.length} layers`);
      // The artboard holds the title, subtitle and the label, then the component: nothing left loose
      assert.equal(ab._children.length, 4, `${c.slug} ${variant}: loose nodes on the artboard`);
      const ox = item.x - tree.x;
      const oy = item.y + 36 - tree.y;
      want.forEach((l, i) => {
        const n = got[i];
        const where = `${c.slug} ${variant} layer ${i} (${l.t} ${l.name})`;
        const g = n.global;
        if (l.t === "rect" || l.t === "image") {
          near(g.x, ox + l.x, `${where} x`);
          near(g.y, oy + l.y, `${where} y`);
          near(n.width, Math.max(0.5, l.w), `${where} width`);
        } else if (l.t === "text") {
          near(g.x, ox + l.x, `${where} x`);
          near(g.y, oy + l.y + (l.area ? l.baseline : 0), `${where} baseline`);
          assert.equal(n.text, l.text, where);
          assert.equal(n.styleRanges[0].length, l.text.length, where);
          if (l.area) assert.equal(n.layoutBox.width, l.w, where);
        } else if (l.t === "path") {
          assert.equal(n.pathData, l.d, where);
          near(g.x, ox, `${where} x`);
          near(g.y, oy, `${where} y`);
        }
      });
      total += want.length;
    }
  }
  assert.ok(total > 0);
  console.log(`  ${index.components.length} components, ${total} layers checked`);
});

test("layout: categories down, variants across, nothing overlapping", { skip: !have && "run xd-kit/extract.mjs first" }, () => {
  const data = new Map(index.components.map((c) => [c.slug, load(c)]));
  const variants = ["standard-light", "standard-dark", "clean-light", "clean-dark"];
  const boards = layoutKit(index.categories, variants, (cat, v) =>
    index.components.filter((c) => c.category === cat && data.get(c.slug).variants[v]).map((c) => ({ slug: c.slug, name: c.name, tree: data.get(c.slug).variants[v] })),
  );
  assert.ok(boards.length >= index.categories.length);
  for (const a of boards)
    for (const b of boards) {
      if (a === b) continue;
      const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      assert.ok(apart, `${a.category} ${a.variant} overlaps ${b.category} ${b.variant}`);
    }
  for (const b of boards)
    for (const i of b.items) {
      assert.ok(i.x + i.tree.w <= b.w, `${i.slug} spills off the right of ${b.category}`);
      assert.ok(i.y + 36 + i.tree.h <= b.h, `${i.slug} spills off the bottom of ${b.category}`);
    }
});

test("assets: both themes' colours and the type scale, once", { skip: !have && "run xd-kit/extract.mjs first" }, () => {
  const tokens = JSON.parse(readFileSync(join(KIT, "tokens.json"), "utf8"));
  const xd = create();
  const first = addAssets(xd, tokens);
  assert.ok(first.colours > 50, `${first.colours} colours`);
  assert.ok(first.styles > 5, `${first.styles} styles`);
  assert.ok(xd.store.colors.some((c) => c.name === "Light / text-primary"));
  assert.ok(xd.store.colors.some((c) => c.name === "Dark / text-primary"));
  const again = addAssets(xd, tokens);
  assert.deepEqual(again, { colours: 0, styles: 0 });
});
