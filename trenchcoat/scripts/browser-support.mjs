// Which browsers each element works in (remediation 6.5): scans the code that reaches an element (its module, the
// elements it imports and the parts of internal/* it uses – scripts/docs-data.mjs) and tokens.css for the platform
// features in scripts/browser-features.json, and works out the first Chrome / Edge, Firefox, Safari and iOS Safari
// versions where it renders and works fully. Progressive features (with a fallback) don't raise that floor; the page
// lists them with what changes without them. gen-docs.mjs writes the result into each page's api JSON.
//   node scripts/browser-support.mjs [slug…]     the floor and features of each element (all by default)
//   node scripts/browser-support.mjs --floor     the library-wide floor and what sets it
//   node scripts/browser-support.mjs --bcd       compare the table's versions with MDN's browser-compat-data (network)
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { reach, stripComments } from "./docs-data.mjs";

const ROOT = import.meta.url.startsWith("file:") ? resolve(dirname(fileURLToPath(import.meta.url)), "..") : process.cwd();
export const TABLE = JSON.parse(readFileSync(join(ROOT, "scripts/browser-features.json"), "utf8"));
export const BROWSERS = ["chrome", "edge", "firefox", "safari", "safari_ios"];
export const BROWSER_NAMES = { chrome: "Chrome", edge: "Edge", firefox: "Firefox", safari: "Safari", safari_ios: "Safari on iOS" };
const TOKENS = stripComments(readFileSync(join(ROOT, "tokens/tokens.css"), "utf8"));

const regex = (f, key = "pattern") => new RegExp(key === "pattern" ? f.pattern : f.alt.pattern, "m");
/** -1, 0 or 1; null (no support) is above every version */
export function compare(a, b) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) < (y[i] ?? 0) ? -1 : 1;
  return 0;
}
const max = (a, b) => (compare(a, b) >= 0 ? a : b);
const min = (a, b) => (compare(a, b) <= 0 ? a : b);

/** Every feature found in a chunk list, with where it was found */
function detect(chunks) {
  const found = new Map();
  for (const f of TABLE.features) {
    const re = regex(f);
    const via = [...new Set(chunks.filter((c) => re.test(c.code)).map((c) => c.label))];
    if (!via.length) continue;
    const alt = f.alt && chunks.some((c) => regex(f, "alt").test(c.code));
    found.set(f.id, { feature: f, via, alt });
  }
  return found;
}

const chunksOf = (slug) => [...reach(slug).map((c) => ({ label: c.label.replace(/ › .*$/, ""), code: stripComments(c.text) })), { label: "tokens.css", code: TOKENS }];

/** The features one element uses, its floor per browser and the features that set it */
export function scan(slug) {
  const found = detect(chunksOf(slug));
  const features = [];
  const floor = Object.fromEntries(BROWSERS.map((b) => [b, "1"]));
  const setBy = Object.fromEntries(BROWSERS.map((b) => [b, []]));
  for (const { feature: f, via, alt } of found.values()) {
    const versions = Object.fromEntries(BROWSERS.map((b) => [b, alt ? min(f.versions[b], f.alt.versions[b]) : f.versions[b]]));
    const progressive = !!f.progressive;
    features.push({
      id: f.id,
      name: f.name,
      bcd: f.bcd,
      versions,
      progressive,
      ...(progressive ? { without: f.progressive } : f.why ? { why: f.why } : {}),
      ...(alt ? { note: f.alt.note } : {}),
      // Where it's used: the element itself, an element it renders, a shared module, or the tokens
      via: via.map((v) => (v === via[0] && v === slug ? "itself" : v)),
    });
    if (progressive) continue;
    for (const b of BROWSERS) {
      const c = compare(versions[b], floor[b]);
      if (c > 0) {
        floor[b] = versions[b];
        setBy[b] = [f.id];
      } else if (c === 0 && floor[b] !== "1") setBy[b].push(f.id);
    }
  }
  // Required first, newest first
  features.sort((a, b) => Number(a.progressive) - Number(b.progressive) || compare(b.versions.safari, a.versions.safari) || a.name.localeCompare(b.name));
  return { floor, setBy, features };
}

/** The library-wide floor: the highest floor of any element, and the elements and features that set it */
export function libraryFloor(scans) {
  const floor = Object.fromEntries(BROWSERS.map((b) => [b, "1"]));
  const setBy = Object.fromEntries(BROWSERS.map((b) => [b, { features: [], elements: [] }]));
  for (const [slug, s] of Object.entries(scans))
    for (const b of BROWSERS) {
      const c = compare(s.floor[b], floor[b]);
      if (c > 0) {
        floor[b] = s.floor[b];
        setBy[b] = { features: [...s.setBy[b]], elements: [slug] };
      } else if (c === 0) {
        setBy[b].elements.push(slug);
        for (const f of s.setBy[b]) if (!setBy[b].features.includes(f)) setBy[b].features.push(f);
      }
    }
  // Every feature any element uses, with how many use it – the foundations page lists them
  const usage = new Map();
  for (const s of Object.values(scans)) for (const f of s.features) usage.set(f.id, { ...(usage.get(f.id) ?? { ...f, via: undefined, count: 0 }), count: (usage.get(f.id)?.count ?? 0) + 1 });
  for (const v of usage.values()) delete v.via;
  return { floor, setBy, features: [...usage.values()].sort((a, b) => Number(a.progressive) - Number(b.progressive) || b.count - a.count), engines: engines() };
}

/** The engines the element tests run in (vitest browser mode through Playwright) */
export function engines() {
  const pw = JSON.parse(readFileSync(join(ROOT, "node_modules/playwright-core/browsers.json"), "utf8")).browsers;
  const v = (n) => pw.find((b) => b.name === n)?.browserVersion ?? null;
  const pkg = JSON.parse(readFileSync(join(ROOT, "node_modules/playwright-core/package.json"), "utf8"));
  return { playwright: pkg.version, chromium: v("chromium"), firefox: v("firefox"), webkit: v("webkit") };
}

/** Which elements use a feature – for the feature-table test */
export function usersOf(slugs) {
  const users = new Map(TABLE.features.map((f) => [f.id, []]));
  for (const slug of slugs) for (const id of detect(chunksOf(slug)).keys()) users.get(id).push(slug);
  return users;
}

/** The pages' slugs: every element module in src/elements, and the look provider */
export const allSlugs = () => [
  ...readdirSync(join(ROOT, "src/elements"))
    .filter((f) => f.endsWith(".ts") && !["index.ts", "react.ts"].includes(f) && !f.endsWith(".d.ts") && / /.test(f) === false)
    .map((f) => f.slice(0, -3)),
  "look-provider",
];

async function bcdCheck() {
  const cache = new Map();
  const problems = [];
  for (const f of TABLE.features) {
    const parts = f.bcd.split(".");
    let node;
    for (let n = parts.length; n >= 2 && !node; n--) {
      const files = [parts.slice(0, n).join("/") + ".json", parts[0] === "api" && n === 2 ? `api/_globals/${parts[1]}.json` : null].filter(Boolean);
      for (const file of files) {
        if (!cache.has(file)) {
          const r = await fetch(`https://raw.githubusercontent.com/mdn/browser-compat-data/main/${file}`);
          cache.set(file, r.ok ? await r.json() : null);
        }
        const data = cache.get(file);
        if (data) node = parts.reduce((o, p) => o?.[p], data);
        if (node) break;
      }
    }
    const support = node?.__compat?.support;
    if (!support) {
      problems.push(`${f.id}: ${f.bcd} not found`);
      continue;
    }
    const first = (b) => {
      const e = [support[b]].flat().find((x) => x && !x.prefix && !x.flags && !x.partial_implementation && !x.alternative_name);
      return e ? (e.version_added === false ? null : String(e.version_added).replace(/^≤/, "")) : undefined;
    };
    for (const [b, mirrorOf] of [["chrome"], ["firefox"], ["safari"], ["edge", "chrome"], ["safari_ios", "safari"]]) {
      const v = support[b] === "mirror" ? first(mirrorOf) : first(b);
      if (v !== undefined && v !== f.versions[b]) problems.push(`${f.id}: ${b} ${f.versions[b]} in the table, ${v}${support[b] === "mirror" ? ` (mirrors ${mirrorOf})` : ""} in BCD`);
    }
  }
  console.log(problems.length ? problems.join("\n") : "the table matches browser-compat-data");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const name = (b) => BROWSER_NAMES[b];
  if (args.includes("--bcd")) await bcdCheck();
  else if (args.includes("--floor")) {
    const lib = libraryFloor(Object.fromEntries(allSlugs().map((s) => [s, scan(s)])));
    for (const b of BROWSERS) console.log(`${name(b).padEnd(14)} ${String(lib.floor[b]).padEnd(6)} set by ${lib.setBy[b].features.join(", ")} (${lib.setBy[b].elements.length} elements)`);
  } else {
    for (const slug of args.length ? args : allSlugs()) {
      const s = scan(slug);
      console.log(`${slug}: ${BROWSERS.map((b) => `${name(b)} ${s.floor[b] ?? "no"}`).join(" · ")}`);
      for (const f of s.features) console.log(`  ${f.progressive ? "~" : "·"} ${f.name} (${f.via.join(", ")})`);
    }
  }
}
