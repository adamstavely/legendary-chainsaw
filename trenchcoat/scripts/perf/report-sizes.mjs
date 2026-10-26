import { readFileSync } from "node:fs";
const rows = JSON.parse(readFileSync(process.argv[2], "utf8"));
const k = (n) => (n / 1024).toFixed(1);
const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const sum = (a) => a.reduce((x, y) => x + y, 0);

console.log("## Top 20 by min (components only show standard to avoid pair dupes? no – all files)");
const top = [...rows].sort((a, b) => b.full.min - a.full.min).slice(0, 24);
console.log("| file | src | min | gz | br | CSS (min/gz) | of which fallbacks (min/gz) | internals (min/gz) | JS logic (min) | deps |");
for (const r of top) {
  const jsLogic = r.full.min - r.css.min - r.internals.min;
  console.log(`| ${r.lib}/${r.file} | ${k(r.src)} | ${k(r.full.min)} | ${k(r.full.gz)} | ${k(r.full.br)} | ${k(r.css.min)} / ${k(r.css.gz)} | ${k(r.fbAll.min)} / ${k(r.fbAll.gz)} | ${k(r.internals.min)} / ${k(r.internals.gz)} | ${k(jsLogic)} | ${r.deps.join(" ")} |`);
}
console.log("\n## Per library");
console.log("| lib | files | src | min | gz | br | median min | median gz | CSS share min | fallback min | fallback-block min | internals min | css-min save min/gz | one-look save min/gz | lean min/gz |");
for (const lib of ["components", "blocks", "screens", "illustrations", "motion", "ALL"]) {
  const R = lib === "ALL" ? rows : rows.filter((r) => r.lib === lib);
  const s = (f) => sum(R.map(f));
  console.log(`| ${lib} | ${R.length} | ${k(s((r) => r.src))} | ${k(s((r) => r.full.min))} | ${k(s((r) => r.full.gz))} | ${k(s((r) => r.full.br))} | ${k(med(R.map((r) => r.full.min)))} | ${k(med(R.map((r) => r.full.gz)))} | ${((100 * s((r) => r.css.min)) / s((r) => r.full.min)).toFixed(0)}% | ${k(s((r) => r.fbAll.min))} (${((100 * s((r) => r.fbAll.min)) / s((r) => r.full.min)).toFixed(0)}%) | ${k(s((r) => r.fbBlock.min))} | ${k(s((r) => r.internals.min))} | ${k(s((r) => r.cssMinSave.min))} / ${k(s((r) => r.cssMinSave.gz))} | ${k(s((r) => r.oneLookSave.min))} / ${k(s((r) => r.oneLookSave.gz))} | ${k(s((r) => r.lean.min))} / ${k(s((r) => r.lean.gz))} |`);
}
// Standard-only components (what one consumer of one look sees)
const std = rows.filter((r) => r.lib === "components" && !r.file.endsWith("-clean.tsx"));
const s = (f) => sum(std.map(f));
console.log(`\n## Components, standard files only (64): min ${k(s((r) => r.full.min))} gz ${k(s((r) => r.full.gz))} br ${k(s((r) => r.full.br))}; median min ${k(med(std.map((r) => r.full.min)))} gz ${k(med(std.map((r) => r.full.gz)))} br ${k(med(std.map((r) => r.full.br)))}`);
console.log(`css ${k(s((r) => r.css.min))} (${((100 * s((r) => r.css.min)) / s((r) => r.full.min)).toFixed(1)}%), css gz ${k(s((r) => r.css.gz))} (${((100 * s((r) => r.css.gz)) / s((r) => r.full.gz)).toFixed(1)}%)`);
console.log(`fallbacks all ${k(s((r) => r.fbAll.min))} gz ${k(s((r) => r.fbAll.gz))}; block ${k(s((r) => r.fbBlock.min))} gz ${k(s((r) => r.fbBlock.gz))}`);
console.log(`internals ${k(s((r) => r.internals.min))} gz ${k(s((r) => r.internals.gz))}`);
console.log(`cssMin save ${k(s((r) => r.cssMinSave.min))} gz ${k(s((r) => r.cssMinSave.gz))} br ${k(s((r) => r.cssMinSave.br))}`);
console.log(`oneLook save ${k(s((r) => r.oneLookSave.min))} gz ${k(s((r) => r.oneLookSave.gz))} br ${k(s((r) => r.oneLookSave.br))}`);
console.log(`lean ${k(s((r) => r.lean.min))} gz ${k(s((r) => r.lean.gz))} br ${k(s((r) => r.lean.br))}`);
console.log(`median lean min ${k(med(std.map((r) => r.lean.min)))} gz ${k(med(std.map((r) => r.lean.gz)))}`);
console.log(`files with internals: ${std.filter((r) => r.internals.min > 0).length}; devWarn total ${s((r) => r.devWarn)}; files with console.*: ${std.filter((r) => r.devWarn).map((r) => r.file + ":" + r.devWarn).join(" ")}`);
console.log("\n## lucide");
for (const r of rows.filter((r) => r.lucide.length)) console.log(r.lib + "/" + r.file, r.lucide.length, r.lucide.join(","));
console.log("\n## smallest 5 std comps");
for (const r of [...std].sort((a, b) => a.full.min - b.full.min).slice(0, 5)) console.log(r.file, k(r.full.min), k(r.full.gz), "css", k(r.css.min), "fb", k(r.fbAll.min));
console.log("\n## largest fallback share std comps");
for (const r of [...std].sort((a, b) => b.fbAll.gz / b.full.gz - a.fbAll.gz / a.full.gz).slice(0, 5)) console.log(r.file, k(r.full.gz), "fb gz", k(r.fbAll.gz));
console.log("\n## css share by std comp top");
for (const r of [...std].sort((a, b) => b.css.min / b.full.min - a.css.min / a.full.min).slice(0, 5)) console.log(r.file, (r.css.min / r.full.min * 100).toFixed(0) + "%");
console.log("\nall std:");
for (const r of [...std].sort((a, b) => b.full.gz - a.full.gz)) process.stdout.write(`${r.file.replace(".tsx","")} ${k(r.full.gz)}; `);
