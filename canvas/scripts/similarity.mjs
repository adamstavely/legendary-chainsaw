// Sorts the canvas's pieces by how they look, for the Similar layout. Run it after thumbnails change:
//
//   npm run similarity
//
// 1. Embeds each piece's light thumbnail with CLIP, run locally. The model (~100 MB) downloads once into
//    node_modules/.cache/clip; embeddings are cached there too, by thumbnail hash, so a rerun only embeds what changed
// 2. Lays the embeddings out in 2-D with UMAP, and groups neighbouring pieces on that map with k-means. Each group is
//    named after its most typical piece – the one closest to the group's average look ("Like Sankey Chart")
// 3. Places each group as a block of cards near the groups it resembles (src/canvas/similarity.ts)
// 4. Writes src/data/similarity.json – the map, each piece's closest look-alikes, and near-duplicate pairs – and
//    reports/near-duplicates.md
//
// The output is committed, so the canvas itself needs no model; a unit test fails when it no longer matches the
// thumbnails.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { env, pipeline } from "@huggingface/transformers";
import { UMAP } from "umap-js";
import { createServer } from "vite";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const MODEL = "Xenova/clip-vit-base-patch32";
const SEED = 20261111;
/** Pairs at least this similar are reported as near-duplicates */
const DUPLICATE = 0.92;
const NEIGHBOURS = 6;
/** About this many pieces to a group */
const GROUP_SIZE = 22;
const CACHE = here("../node_modules/.cache/similarity-embeddings.json");

// The piece list and the layout helpers are TypeScript that reads Trenchcoat through Vite: load them the same way
const vite = await createServer({
  configFile: here("../vite.config.ts"),
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  logLevel: "warn",
});
const { PIECES } = await vite.ssrLoadModule("/src/data/pieces.ts");
const { blockSize, dot, kmeans, normalise, orderWithin, placeBlocks, seeded } = await vite.ssrLoadModule("/src/canvas/similarity.ts");
await vite.close();

const thumbFile = (p) => here(`../../trenchcoat/app/src/thumbs/${p.library}/${p.slug}.light.webp`);
const pieces = PIECES.filter((p) => existsSync(thumbFile(p)));
const hashOf = (p) =>
  createHash("sha1")
    .update(readFileSync(thumbFile(p)))
    .digest("hex")
    .slice(0, 12);
console.log(`${pieces.length} of ${PIECES.length} pieces have a thumbnail`);

// 1. Embeddings ------------------------------------------------------------------------------------------------------
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
if (cache.model !== MODEL) Object.assign(cache, { model: MODEL, vectors: {} });
const hashes = Object.fromEntries(pieces.map((p) => [p.id, hashOf(p)]));
const missing = pieces.filter((p) => !cache.vectors[hashes[p.id]]);
if (missing.length) {
  env.cacheDir = here("../node_modules/.cache/clip");
  const embed = await pipeline("image-feature-extraction", MODEL, { dtype: "q8" });
  for (const [i, p] of missing.entries()) {
    const out = await embed(thumbFile(p));
    cache.vectors[hashes[p.id]] = normalise(out.data).map((x) => +x.toFixed(5));
    if ((i + 1) % 50 === 0 || i + 1 === missing.length) console.log(`embedded ${i + 1} of ${missing.length}`);
  }
  mkdirSync(here("../node_modules/.cache"), { recursive: true });
  writeFileSync(CACHE, JSON.stringify(cache));
}
const vectors = pieces.map((p) => normalise(cache.vectors[hashes[p.id]]));

// 2. Map and groups --------------------------------------------------------------------------------------------------
const random = seeded(SEED);
const coords = new UMAP({ nComponents: 2, nNeighbors: 15, minDist: 0.25, random }).fit(vectors);
const k = Math.max(1, Math.round(pieces.length / GROUP_SIZE));
const groupOf = kmeans(coords, k, random);
const groups = Array.from({ length: Math.max(...groupOf) + 1 }, (_, g) => pieces.map((_, i) => i).filter((i) => groupOf[i] === g));
const labels = groups.map((members) => {
  const centre = normalise(vectors[0].map((_, d) => members.reduce((s, i) => s + vectors[i][d], 0)));
  const typical = members.reduce((best, i) => (dot(vectors[i], centre) > dot(vectors[best], centre) ? i : best));
  return `Like ${pieces[typical].name}`;
});

// 3. Blocks ------------------------------------------------------------------------------------------------------------
const at = (i) => coords[i];
const blocks = groups.map((members) => {
  const { columns, width, height } = blockSize(members.length);
  const centre = [0, 1].map((d) => members.reduce((s, i) => s + coords[i][d], 0) / members.length);
  return { columns, width, height, centre, members: orderWithin(members, at, columns) };
});
const corners = placeBlocks(blocks);
const clusters = blocks
  .map((b, g) => ({ label: labels[g], columns: b.columns, ...corners[g], ids: b.members.map((i) => pieces[i].id) }))
  // In reading order, which is also the canvas's Tab and screen-reader order
  .sort((a, b) => a.y - b.y || a.x - b.x);

// 4. Look-alikes -------------------------------------------------------------------------------------------------------
const round = (x) => Math.round(x * 1000) / 1000;
const neighbours = {};
const duplicates = [];
for (const [i, p] of pieces.entries()) {
  const scored = pieces.map((q, j) => [q.id, j === i ? -Infinity : dot(vectors[i], vectors[j])]).sort((a, b) => b[1] - a[1]);
  neighbours[p.id] = scored.slice(0, NEIGHBOURS).map(([id, s]) => [id, round(s)]);
  for (const [j, q] of pieces.entries())
    if (j > i && dot(vectors[i], vectors[j]) >= DUPLICATE) duplicates.push([p.id, q.id, round(dot(vectors[i], vectors[j]))]);
}
duplicates.sort((a, b) => b[2] - a[2] || a[0].localeCompare(b[0]));

// Write ------------------------------------------------------------------------------------------------------------------
// One line per entry, so a rerun's diff shows which pieces moved
const lines = (entries) => entries.map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(",\n");
const json = `{
  "model": ${JSON.stringify(`${MODEL} (q8)`)},
  "thumbs": {
${lines(Object.entries(hashes))}
  },
  "clusters": [
${clusters.map((c) => `    ${JSON.stringify(c)}`).join(",\n")}
  ],
  "neighbours": {
${lines(Object.entries(neighbours))}
  },
  "duplicates": [
${duplicates.map((d) => `    ${JSON.stringify(d)}`).join(",\n")}
  ]
}
`;
writeFileSync(here("../src/data/similarity.json"), json);

const byId = new Map(pieces.map((p) => [p.id, p]));
const name = (id) => `${byId.get(id).name} (${byId.get(id).libraryLabel})`;
mkdirSync(here("../reports"), { recursive: true });
writeFileSync(
  here("../reports/near-duplicates.md"),
  `# Near-duplicate pieces

Pairs of pieces whose light thumbnails look almost the same: a cosine similarity of ${DUPLICATE} or more between their
CLIP embeddings. Each is a candidate to merge, or to make look more distinct. Some are expected, such as a component
and the block built around it.

Written by \`npm run similarity\`; don't edit by hand.

| Piece | Looks like | Similarity |
| --- | --- | --- |
${duplicates.map(([a, b, s]) => `| ${name(a)} | ${name(b)} | ${s.toFixed(3)} |`).join("\n")}
${duplicates.length ? "" : "\nNone at this threshold.\n"}`,
);
console.log(`${clusters.length} groups, ${duplicates.length} near-duplicate pairs`);
