// Checks the Angular wrappers the way an app meets them: builds them (element types, then ngc in partial mode, as
// build:package does), then compiles small apps against the build with strictTemplates and no
// CUSTOM_ELEMENTS_SCHEMA:
//   · one that must compile – inputs of the right types, plain boolean and numeric attributes, typed $event, ngModel
//     and formControl on the elements
//   · several that must not – a misspelt input binding (a plain attribute is allowed on any element, as in HTML), a value of the wrong type, a misread $event, a non-numeric attribute for a number, an unknown tc-* tag –
//     each failing with the error Angular gives for it
// then imports the built package in plain Node – no DOM, as a server-side render (SSR) meets it, and with Node's strict
// ESM resolution, as webpack and test runners do: every dist/*.js and dist/angular/*.js module, and each entry point;
// then bundles with esbuild, code splitting on as for lazy routes: a directive from its own entry point
// (angular/<name>) brings its element only, and elements a lazy chunk imports stay out of the initial chunks
//   node scripts/check-angular.mjs
import { execSync } from "node:child_process";
import { build } from "esbuild";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const TMP = join(ROOT, "node_modules/.cache/check-angular");
const run = (cmd, cwd = ROOT) => execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });

console.log("angular: build the elements, their types and the wrappers");
run("npx vite build -c vite.package.config.ts");
run("npx tsc -p tsconfig.package.json");
run("npx ngc -p tsconfig.angular.json");

const tsconfig = {
  compilerOptions: {
    target: "ES2022",
    module: "ES2022",
    moduleResolution: "bundler",
    lib: ["ES2022", "DOM"],
    strict: true,
    experimentalDecorators: true,
    useDefineForClassFields: false,
    skipLibCheck: true,
    outDir: "out",
    baseUrl: ROOT,
    paths: {
      "@adamstavely/trenchcoat/angular": ["dist/angular/index.d.ts"],
      "@adamstavely/trenchcoat/angular/forms": ["dist/angular/forms.d.ts"],
      "@adamstavely/trenchcoat/angular/*": ["dist/angular/*"],
      "@adamstavely/trenchcoat/look-provider": ["dist/types/elements/internal/look.d.ts"],
      "@adamstavely/trenchcoat/*": ["dist/types/elements/*"],
    },
    types: [],
  },
  angularCompilerOptions: { strictTemplates: true, strictInjectionParameters: true },
  files: ["app.ts"],
};

/** Compiles one component; returns the compiler's output when it fails, "" when it compiles */
function compile(name, imports, template, members = "", from = "@adamstavely/trenchcoat/angular") {
  const dir = join(TMP, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
  writeFileSync(
    join(dir, "app.ts"),
    `import { Component } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ${imports} } from "${from}";
import { TRENCHCOAT_FORMS } from "@adamstavely/trenchcoat/angular/forms";
import type { ComboboxOption } from "@adamstavely/trenchcoat/combobox";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [${imports}, FormsModule, ReactiveFormsModule, TRENCHCOAT_FORMS],
  template: \`${template}\`,
})
export class App {
  options: ComboboxOption[] = [{ value: "ana", label: "Ana Lima" }];
  picked: string[] = [];
  on = true;
  who = new FormControl<string[]>([], { nonNullable: true });
  ${members}
}
`,
  );
  try {
    execSync(`npx ngc -p ${join(dir, "tsconfig.json")}`, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
    return "";
  } catch (e) {
    return `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
}

const problems = [];

// Must compile: typed inputs, typed $event, the form accessors
const good = compile(
  "good",
  "Button, Checkbox, Combobox, Switch, StatusTracker, CoverageRing",
  `
    <tc-button label="Save" variant="primary" (click)="count = count + 1"></tc-button>
    <tc-combobox heading="Reviewers" [options]="options" [value]="picked" (tc-value-change)="picked = $event.detail.value"></tc-combobox>
    <tc-combobox [options]="options" [formControl]="who"></tc-combobox>
    <tc-switch label="Notify" [(ngModel)]="on"></tc-switch>
    <tc-status-tracker noun="Gate" [steps]="[]" (tc-selected-change)="last = $event.detail.selected"></tc-status-tracker>
    <tc-coverage-ring [value]="0.61" unit="topics" unitOne="topic"></tc-coverage-ring>
    <tc-coverage-ring value="0.61"></tc-coverage-ring>
    <tc-checkbox label="Agree" required disabled="false"></tc-checkbox>
  `,
  "count = 0; last: string | null = null;",
);
if (good) problems.push(`the good app didn't compile:\n${good.slice(0, 2000)}`);

// Must compile: a directive from its own entry point, typed the same way
const entry = compile(
  "entry",
  "SideNav",
  `<tc-side-nav brand="Halden" current="home" [items]="[]" [collapsed]="on" (tc-navigate)="last = $event.detail.id"></tc-side-nav>`,
  "count = 0; last: string | null = null;",
  "@adamstavely/trenchcoat/angular/side-nav",
);
if (entry) problems.push(`a directive from its own entry point (angular/side-nav) didn't compile:\n${entry.slice(0, 2000)}`);

// Must not compile, each with Angular's error for it
const bad = [
  ["misspelt input", "Button", `<tc-button [lable]="'Save'"></tc-button>`, /NG8002|Can't bind to 'lable'|not a known property/, ""],
  ["wrong input type", "CoverageRing", `<tc-coverage-ring [value]="'sixty'"></tc-coverage-ring>`, /TS2322|not assignable to type 'number'/, ""],
  ["misread $event", "Combobox", `<tc-combobox (tc-value-change)="n = $event.detail.value"></tc-combobox>`, /TS2322|not assignable to type 'number'/, "n = 0;"],
  ["non-numeric attribute for a number", "CoverageRing", `<tc-coverage-ring value="sixty"></tc-coverage-ring>`, /TS2322|not assignable/, ""],
  ["unknown element", "Button", `<tc-buton label="Save"></tc-buton>`, /NG8001|'tc-buton' is not a known element/, ""],
];
for (const [what, imports, template, want, members] of bad) {
  const out = compile(what.replace(/\W+/g, "-"), imports, template, members);
  if (!out) problems.push(`${what}: compiled, but should have failed`);
  else if (!want.test(out)) problems.push(`${what}: failed, but not as expected:\n${out.slice(0, 800)}`);
}

// Plain Node: no document or window, so a module that touches the DOM when it loads fails here as it would in SSR.
// The wrappers are partially compiled, so – as in an Angular server build – @angular/compiler links them
const imports = run(
  `node --input-type=module -e '
    import { readdirSync } from "node:fs";
    await import("@angular/compiler");
    if (typeof document !== "undefined" || typeof window !== "undefined") throw new Error("expected no DOM");
    const failed = [];
    const mods = [...readdirSync("dist").filter((f) => f.endsWith(".js")).map((f) => "./dist/" + f),
      ...readdirSync("dist/angular").filter((f) => f.endsWith(".js")).map((f) => "./dist/angular/" + f)].filter((f) => !/ [0-9]+[.]js$/.test(f));
    for (const m of [...mods, "@adamstavely/trenchcoat", "@adamstavely/trenchcoat/react", "@adamstavely/trenchcoat/angular", "@adamstavely/trenchcoat/angular/forms", "@adamstavely/trenchcoat/angular/side-nav", "@adamstavely/trenchcoat/generative"]) {
      try { await import(m); } catch (e) { failed.push(m + ": " + String(e.message).split("\\n")[0]); }
    }
    console.log(JSON.stringify({ count: mods.length, failed }));
  '`,
);
const { count, failed } = JSON.parse(imports.trim().split("\n").pop());
for (const f of failed) problems.push(`doesn't import in Node (SSR, strict ESM): ${f}`);

// Bundled as an app with lazy routes: the main chunk uses Side Nav, a lazy chunk Button and Combobox. Each directive's
// own entry point keeps the lazy chunk's elements out of what loads first – the index can't (esbuild, like Angular's
// builder, hoists everything reached through it into a shared chunk the main one loads)
const SHAKE = join(TMP, "shake");
mkdirSync(SHAKE, { recursive: true });
writeFileSync(join(SHAKE, "main.js"), `import { SideNav } from "@adamstavely/trenchcoat/angular/side-nav";\nconsole.log(SideNav);\nexport const lazy = () => import("./lazy.js");\n`);
writeFileSync(join(SHAKE, "lazy.js"), `import { Button } from "@adamstavely/trenchcoat/angular/button";\nimport { Combobox } from "@adamstavely/trenchcoat/angular/combobox";\nconsole.log(Button, Combobox);\n`);
const bundle = await build({ entryPoints: [join(SHAKE, "main.js")], bundle: true, splitting: true, format: "esm", platform: "browser", outdir: join(SHAKE, "out"), write: false, metafile: true, external: ["@angular/*"], logLevel: "silent" });
const outputs = bundle.metafile.outputs;
const text = Object.fromEntries(bundle.outputFiles.map((f) => [f.path, f.text]));
const abs = (p) => resolve(ROOT, p);
const defined = (paths) => new Set(paths.flatMap((p) => [...(text[abs(p)] ?? "").matchAll(/customElements\.define\(\s*"(tc-[a-z0-9-]+)"/g)].map((m) => m[1])));
const initial = new Set();
for (const queue = [Object.keys(outputs).find((k) => outputs[k].entryPoint?.endsWith("main.js"))]; queue.length; ) {
  const k = queue.pop();
  if (!k || initial.has(k) || !outputs[k]) continue;
  initial.add(k);
  for (const i of outputs[k].imports) if (i.kind === "import-statement" && !i.external) queue.push(i.path);
}
const upFront = defined([...initial]);
const everything = defined(Object.keys(outputs));
for (const tag of ["tc-button", "tc-combobox"]) if (upFront.has(tag)) problems.push(`bundling: ${tag}, used only by a lazy chunk, loads up front`);
if (!upFront.has("tc-side-nav")) problems.push("bundling: tc-side-nav isn't in the main chunk");
const extra = [...everything].filter((t) => !["tc-side-nav", "tc-button", "tc-combobox", "tc-look-provider"].includes(t));
if (extra.length) problems.push(`bundling: angular/<name> entry points pulled in other elements: ${extra.join(", ")}`);

rmSync(TMP, { recursive: true, force: true });
if (problems.length) {
  console.error(`angular: ${problems.length} problem${problems.length === 1 ? "" : "s"}\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`angular ok: strict templates check the wrappers' inputs and events, ngModel and formControl work, ${bad.length} mistakes are caught, all ${count} modules import in Node without a DOM, and a directive's own entry point bundles its element only`);
