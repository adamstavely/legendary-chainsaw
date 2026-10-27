// Compiles the docs pages' generated framework snippets (app/src/docs/usage.ts – the Usage quick starts and the
// controlled examples) in each framework's examples/ app, with that app's own compiler and framework types, against
// type declarations emitted from the current sources (remediation 6.5):
//   · React – tsc with examples/react's React types (the Next.js tab shows the same wrapper code)
//   · Vue – vue-tsc with trenchcoat/vue, so templates are type-checked: props and @tc-* events
//   · Angular – ngc with strictTemplates (CUSTOM_ELEMENTS_SCHEMA leaves tc-* bindings unchecked, the class is checked)
//   · Svelte – the Svelte compiler (no svelte-check in the app), plus tsc on each <script lang="ts"> with Svelte's
//     rune types; the markup's bindings aren't type-checked
//   · HTML – each <script type="module"> parsed (syntax only: plain JS has no types to check against)
//   node scripts/check-snippets.mjs                every docs page
//   node scripts/check-snippets.mjs <slug>…        only those
import { execFileSync, execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const ROOT = resolve(new URL("..", import.meta.url).pathname);
const EX = join(ROOT, "examples");
const API = join(ROOT, "app/src/docs/api");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

// usage.ts, bundled for node
const built = await esbuild.build({ entryPoints: [join(ROOT, "app/src/docs/usage.ts")], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
const usage = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);

const slugs = readdirSync(API)
  .filter((f) => /^[a-z0-9-]+\.json$/.test(f))
  .map((f) => f.slice(0, -5))
  .filter((s) => !only.length || only.includes(s));
const problems = [];
const missingApps = ["react", "vue", "angular", "svelte"].filter((a) => !existsSync(join(EX, a, "node_modules")));
if (missingApps.length) {
  // Locally that's a skip; in CI (CI=1) the apps must be there
  console[process.env.CI ? "error" : "warn"](`check:snippets: examples/${missingApps.join(", ")} not installed – run npm run examples once (it installs every app)`);
  process.exit(process.env.CI ? 1 : 0);
}

// Declarations from the current sources, plus the Vue and Svelte typings the manifest analyzer generates
const work = join(ROOT, `.snippets-${process.pid}`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work);
const cleanup = () => {
  rmSync(work, { recursive: true, force: true });
  for (const a of ["react", "vue", "angular", "svelte"]) rmSync(join(EX, a, `.snippets-${process.pid}`), { recursive: true, force: true });
};
process.on("exit", cleanup);
const types = join(work, "types");
try {
  execSync(`npx tsc -p tsconfig.package.json --outDir ${types}`, { cwd: ROOT, stdio: "pipe" });
} catch (e) {
  // Type errors in the sources are typecheck's to report; the declarations are still emitted
  if (!existsSync(join(types, "elements/index.d.ts"))) throw e;
  console.warn(`check:snippets: the sources have type errors (npm run typecheck) – checking against what they declare\n  ${String(e.stdout).trim().split("\n")[0]}`);
}
execSync("npx cem analyze --config custom-elements-manifest.config.mjs", { cwd: ROOT, stdio: "ignore" });
for (const f of ["vue.d.ts", "svelte.d.ts"]) cpSync(join(ROOT, "dist/types", f), join(types, f));
writeFileSync(join(types, "tokens.css.d.ts"), "export {};\n");
const trenchcoatPaths = {
  trenchcoat: [join(types, "elements/index.d.ts")],
  "trenchcoat/react": [join(types, "elements/react.d.ts")],
  "trenchcoat/vue": [join(types, "vue.d.ts")],
  "trenchcoat/svelte": [join(types, "svelte.d.ts")],
  "trenchcoat/tokens.css": [join(types, "tokens.css.d.ts")],
  "trenchcoat/*": [join(types, "elements/*.d.ts")],
};

// Every page's snippets
const pages = slugs.map((slug) => {
  const page = JSON.parse(readFileSync(join(API, `${slug}.json`), "utf8"));
  const el = page.elements[0];
  const facts = page.frameworks?.[0];
  if (!facts) problems.push(`${slug}: no framework facts in its api JSON – run node scripts/gen-docs.mjs ${slug}`);
  const react = page.react.find((r) => r.exported);
  return { slug, quick: facts && usage.generated(slug, facts, react, el), controlled: facts && usage.controlledSnippets(slug, facts, react), react };
}).filter((p) => p.quick);
const id = (slug) => slug.replace(/-/g, "_");
const sh = (cmd, args, cwd) => {
  try {
    execFileSync(cmd, args, { cwd, stdio: "pipe", encoding: "utf8", maxBuffer: 64 << 20 });
    return "";
  } catch (e) {
    return `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
};
/** Compiler output lines naming a file → problems for its page */
const report = (fw, out, dir) => {
  for (const line of out.split("\n")) {
    const m = line.match(/([a-z0-9_]+)(?:\.controlled)?\.(?:tsx|vue|ts|svelte\.ts)[(:]\s*(\d+)?/);
    if (m && /error/i.test(line)) problems.push(`${m[1].replace(/_/g, "-")} (${fw}): ${line.replace(dir + "/", "").trim()}`);
  }
  if (out.trim() && !problems.some((p) => p.includes(`(${fw})`))) problems.push(`${fw}: ${out.trim().split("\n").slice(0, 5).join(" ")}`);
};
const project = (app) => {
  const dir = join(EX, app, `.snippets-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};
const t0 = Date.now();

// React – the quick start and the controlled example of every page with a wrapper
{
  const dir = project("react");
  const appTypes = join(EX, "react/node_modules/@types");
  for (const p of pages.filter((x) => x.react)) {
    writeFileSync(join(dir, `${id(p.slug)}.tsx`), p.quick.react);
    if (p.controlled?.react) writeFileSync(join(dir, `${id(p.slug)}.controlled.tsx`), p.controlled.react);
  }
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, skipLibCheck: true, noEmit: true, lib: ["ES2022", "DOM", "DOM.Iterable"], types: [], paths: { ...trenchcoatPaths, react: [join(appTypes, "react")], "react/*": [join(appTypes, "react/*")], "react-dom": [join(appTypes, "react-dom")] } },
      include: ["*.tsx"],
    }),
  );
  report("React", sh(join(EX, "react/node_modules/.bin/tsc"), ["-p", "tsconfig.json"], dir), dir);
}

// Vue – vue-tsc, with trenchcoat/vue's template types
{
  const dir = project("vue");
  for (const p of pages) {
    writeFileSync(join(dir, `${id(p.slug)}.vue`), p.quick.vue);
    if (p.controlled) writeFileSync(join(dir, `${id(p.slug)}.controlled.vue`), p.controlled.vue);
  }
  writeFileSync(join(dir, "env.d.ts"), 'import type {} from "trenchcoat/vue";\n');
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", strict: true, skipLibCheck: true, noEmit: true, jsx: "preserve", lib: ["ES2022", "DOM", "DOM.Iterable"], types: [], paths: { ...trenchcoatPaths, vue: [join(EX, "vue/node_modules/vue")] } },
      include: ["*.vue", "env.d.ts"],
    }),
  );
  report("Vue", sh(join(EX, "vue/node_modules/.bin/vue-tsc"), ["-p", "tsconfig.json", "--noEmit"], dir), dir);
}

// Angular – ngc with strict templates
{
  const dir = project("angular");
  const files = [];
  for (const p of pages) {
    writeFileSync(join(dir, `${id(p.slug)}.ts`), p.quick.angular);
    files.push(`${id(p.slug)}.ts`);
    if (p.controlled) {
      writeFileSync(join(dir, `${id(p.slug)}.controlled.ts`), p.controlled.angular);
      files.push(`${id(p.slug)}.controlled.ts`);
    }
  }
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { target: "ES2022", module: "ES2022", moduleResolution: "bundler", strict: true, skipLibCheck: true, lib: ["ES2022", "dom"], experimentalDecorators: true, useDefineForClassFields: false, outDir: "out", declaration: false, types: [], paths: trenchcoatPaths },
      angularCompilerOptions: { strictTemplates: true },
      files,
    }),
  );
  report("Angular", sh(join(EX, "angular/node_modules/.bin/ngc"), ["-p", "tsconfig.json"], dir), dir);
}

// Svelte – the compiler, then tsc on the scripts with Svelte's own types
{
  const dir = project("svelte");
  const { compile } = await import(join(EX, "svelte/node_modules/svelte/src/compiler/index.js"));
  const scripts = [];
  for (const p of pages)
    for (const [name, code] of [[id(p.slug), p.quick.svelte], ...(p.controlled ? [[`${id(p.slug)}.controlled`, p.controlled.svelte]] : [])]) {
      try {
        const { warnings } = compile(code, { filename: `${name}.svelte`, generate: "client" });
        for (const w of warnings.filter((w) => !["a11y_", "attribute_"].some((x) => w.code.startsWith(x)))) problems.push(`${name.replace(/_/g, "-").replace(".controlled", "")} (Svelte): warning ${w.code} – ${w.message.split("\n")[0]}`);
      } catch (e) {
        problems.push(`${name.replace(/_/g, "-")} (Svelte): ${String(e.message).split("\n")[0]}`);
      }
      // The script, typed. bind:this assigns el before any effect runs – svelte-check knows that from the markup;
      // plain tsc is told with a definite-assignment mark
      const script = (code.match(/<script lang="ts">([\s\S]*?)<\/script>/)?.[1] ?? "").replace(/\blet el: /, "let el!: ");
      writeFileSync(join(dir, `${name}.svelte.ts`), `/// <reference types="svelte" />\nimport type {} from "trenchcoat/svelte";\n${script}\nexport {};\n`);
      scripts.push(`${name}.svelte.ts`);
    }
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", strict: true, skipLibCheck: true, noEmit: true, noUnusedLocals: false, lib: ["ES2022", "DOM", "DOM.Iterable"], types: [], paths: { ...trenchcoatPaths, svelte: [join(EX, "svelte/node_modules/svelte")] } },
      files: scripts,
    }),
  );
  report("Svelte", sh(join(EX, "react/node_modules/.bin/tsc"), ["-p", "tsconfig.json"], dir), dir);
}

// HTML – the module scripts parse
for (const p of pages)
  for (const [name, code] of [["quick start", p.quick.html], ["controlled", p.controlled?.html]]) {
    if (!code) continue;
    for (const [, js] of code.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)) {
      try {
        esbuild.transformSync(js, { loader: "js", format: "esm" });
      } catch (e) {
        problems.push(`${p.slug} (HTML ${name}): ${String(e.message).split("\n")[1] ?? e.message}`);
      }
    }
  }

cleanup();
if (problems.length) {
  console.error(`snippets: ${problems.length} problems`);
  for (const p of problems.slice(0, process.env.DOCS_ALL ? Infinity : 60)) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`snippets ok: ${pages.length} pages × React, Vue, Angular, Svelte, HTML (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
