// Checks the Angular wrappers the way an app meets them: builds them (element types, then ngc in partial mode, as
// build:package does), then compiles small apps against the build with strictTemplates and no
// CUSTOM_ELEMENTS_SCHEMA:
//   · one that must compile – inputs of the right types, plain boolean and numeric attributes, typed $event, ngModel
//     and formControl on the elements
//   · several that must not – a misspelt input binding (a plain attribute is allowed on any element, as in HTML), a value of the wrong type, a misread $event, a non-numeric attribute for a number, an unknown tc-* tag –
//     each failing with the error Angular gives for it
//   node scripts/check-angular.mjs
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const TMP = join(ROOT, "node_modules/.cache/check-angular");
const run = (cmd, cwd = ROOT) => execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });

console.log("angular: build the element types and the wrappers");
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
      "trenchcoat/angular": ["dist/angular/index.d.ts"],
      "trenchcoat/angular/forms": ["dist/angular/forms.d.ts"],
      "trenchcoat/look-provider": ["dist/types/elements/internal/look.d.ts"],
      "trenchcoat/*": ["dist/types/elements/*"],
    },
    types: [],
  },
  angularCompilerOptions: { strictTemplates: true, strictInjectionParameters: true },
  files: ["app.ts"],
};

/** Compiles one component; returns the compiler's output when it fails, "" when it compiles */
function compile(name, imports, template, members = "") {
  const dir = join(TMP, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
  writeFileSync(
    join(dir, "app.ts"),
    `import { Component } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ${imports} } from "trenchcoat/angular";
import { TRENCHCOAT_FORMS } from "trenchcoat/angular/forms";
import type { ComboboxOption } from "trenchcoat/combobox";

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

rmSync(TMP, { recursive: true, force: true });
if (problems.length) {
  console.error(`angular: ${problems.length} problem${problems.length === 1 ? "" : "s"}\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`angular ok: strict templates check the wrappers' inputs and events, ngModel and formControl work, and ${bad.length} mistakes are caught`);
