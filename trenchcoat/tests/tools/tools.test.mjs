// The CLI and the MCP server, run as a person or an agent runs them. Needs dist/registry.json: npm run test:tools makes it.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CLI = join(ROOT, "bin/trenchcoat.mjs");
const MCP = join(ROOT, "bin/trenchcoat-mcp.mjs");
let dir;
const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: "utf8" });

before(() => {
  dir = mkdtempSync(join(tmpdir(), "tc-tools-"));
});
after(() => rmSync(dir, { recursive: true, force: true }));

describe("trenchcoat lint", () => {
  const lint = (name, code, ...args) => {
    const project = mkdtempSync(join(tmpdir(), "tc-lint-"));
    writeFileSync(join(project, name), code);
    const out = spawnSync(process.execPath, [CLI, "lint", "--json", ...args], { cwd: project, encoding: "utf8" });
    rmSync(project, { recursive: true, force: true });
    return { status: out.status, stderr: out.stderr, problems: JSON.parse(out.stdout || "[]") };
  };
  const rules = (found) => found.problems.map((p) => p.rule);
  const SETUP = `<script type="module">import "trenchcoat/tokens.css"; import "trenchcoat/button"; import "trenchcoat/share-panel";</script>`;

  test("correct use across frameworks is quiet", () => {
    const pages = {
      "a.html": `${SETUP}<tc-button variant="primary" label="Go" id="a" class="b" aria-label="Go" data-x="1" slot="s" onclick="f()"></tc-button>`,
      "b.vue": `<script setup>import "trenchcoat/tokens.css"; import "trenchcoat/share-panel";</script><template><tc-share-panel :directory="d" :resource-name="n" v-if="x" @tc-share="f" /></template>`,
      "c.svelte": `<script>import "trenchcoat/tokens.css"; import "trenchcoat/share-panel";</script><tc-share-panel directory={d} {...rest} on:tc-share={f}></tc-share-panel>`,
      "d.ts": `import "trenchcoat/tokens.css"; import "trenchcoat/share-panel"; const t = html\`<tc-share-panel .directory=\${d} ?sending=\${s} @tc-share=\${f}></tc-share-panel>\`; const a = \`<tc-share-panel [directory]="d" [(ngModel)]="v" *ngIf="x" (tc-share)="f()"></tc-share-panel>\`;`,
      "e.tsx": `import "trenchcoat/tokens.css"; import { SharePanel as P } from "trenchcoat/react"; const x = <P directory={d} onTcShare={f} />;`,
    };
    for (const [name, code] of Object.entries(pages)) assert.deepEqual(lint(name, code).problems, [], name);
  });

  test("finds each kind of mistake, where it is, and suggests the fix", () => {
    const found = lint(
      "a.html",
      `${SETUP}
<tc-share-pannel></tc-share-pannel>
<tc-share-panel resouce-name="x" directory="[]" sending="false" resourceName="y" @tc-shar="f"></tc-share-panel>
<tc-button variant="nope" style="color:#fff"></tc-button>
<style>tc-button { background: #123; color: var(--tc-nope, #fff); --tc-hal-swatchh: 1px; }</style>
<script type="module">import "trenchcoat/share-pannel"; el.addEventListener("tc-nothing", f);</script>`,
    );
    assert.equal(found.status, 1);
    assert.deepEqual(rules(found).sort(), [
      "boolean-attribute", "hard-coded-color", "hard-coded-color", "invalid-value", "property-as-attribute", "property-as-attribute",
      "unknown-attribute", "unknown-element", "unknown-event", "unknown-event", "unknown-import", "unknown-token", "unknown-token",
    ]);
    const first = found.problems.find((p) => p.rule === "unknown-element");
    assert.equal(first.line, 2);
    assert.match(first.message, /Did you mean tc-share-panel\?/);
    assert.match(found.problems.find((p) => p.rule === "unknown-attribute").message, /resource-name/);
    assert.match(found.problems.find((p) => p.rule === "invalid-value").message, /"primary"/);
  });

  test("a value in an expression and a fixed colour in a var() fallback are left alone", () => {
    const code = `import "trenchcoat/tokens.css"; import "trenchcoat/button"; const a = <tc-button variant={v} />; const b = html\`<tc-button variant="\${v}"></tc-button>\`;`;
    assert.deepEqual(lint("a.tsx", code).problems, []);
    assert.deepEqual(lint("a.css", `@import "trenchcoat/tokens.css"; tc-button { color: var(--tc-hal-swatch, #fff); }`).problems, []);
  });

  test("comments, own elements and disable lines are respected", () => {
    const code = `${SETUP}
<!-- <tc-nope></tc-nope> -->
<!-- trenchcoat-lint-disable-next-line unknown-element -->
<tc-quiet></tc-quiet>
<script>customElements.define("tc-mine", class extends HTMLElement {});</script><tc-mine></tc-mine>`;
    assert.deepEqual(lint("a.html", code).problems, []);
    const other = lint("a.html", `${SETUP}\n<!-- trenchcoat-lint-disable-next-line invalid-value -->\n<tc-quiet></tc-quiet>`);
    assert.deepEqual(rules(other), ["unknown-element"]);
  });

  test("a missing import or tokens is a warning, which only --strict fails on", () => {
    const code = "<tc-button></tc-button>";
    const found = lint("a.html", code);
    assert.equal(found.status, 0);
    assert.deepEqual(rules(found).sort(), ["missing-import", "missing-tokens"]);
    assert.equal(lint("a.html", code, "--strict").status, 1);
  });

  test("skips node_modules and says when a path is missing", () => {
    const project = mkdtempSync(join(tmpdir(), "tc-lint-"));
    mkdirSync(join(project, "node_modules/x"), { recursive: true });
    writeFileSync(join(project, "node_modules/x/a.html"), "<tc-nope></tc-nope>");
    const clean = spawnSync(process.execPath, [CLI, "lint"], { cwd: project, encoding: "utf8" });
    assert.equal(clean.status, 0, clean.stdout);
    assert.match(clean.stdout, /0 checked/);
    const missing = spawnSync(process.execPath, [CLI, "lint", "nowhere"], { cwd: project, encoding: "utf8" });
    rmSync(project, { recursive: true, force: true });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /no such path/);
  });

  test("the example apps pass", () => {
    const out = spawnSync(process.execPath, [CLI, "lint", join(ROOT, "examples")], { encoding: "utf8" });
    assert.equal(out.status, 0, out.stdout);
  });
});

describe("trenchcoat CLI", () => {
  test("list finds by words and type", () => {
    const out = JSON.parse(run("list", "share", "--json").stdout);
    assert.ok(out.some((e) => e.slug === "share-panel"));
    const blocks = JSON.parse(run("list", "--type", "block", "--json").stdout);
    assert.ok(blocks.length >= 20 && blocks.every((e) => e.type === "block"));
  });

  test("info accepts a slug, name or tag, and shows usage per framework", () => {
    for (const name of ["share-panel", "Share Panel", "tc-share-panel"]) {
      const out = JSON.parse(run("info", name, "--json").stdout);
      assert.equal(out.tag, "tc-share-panel");
      assert.match(out.usage.react, /SharePanel/);
      assert.match(out.usage.angular, /trenchcoat\/angular/);
      assert.match(out.usage.html, /trenchcoat\/share-panel/);
    }
    const missing = run("info", "nope");
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /no entry/);
  });

  test("add copies a screen with what it needs, and refuses to overwrite", () => {
    const first = run("add", "case-file", "--dir", "ui");
    assert.equal(first.status, 0, first.stderr);
    assert.ok(existsSync(join(dir, "ui/case-file.tsx")));
    assert.ok(existsSync(join(dir, "ui/app-shell.tsx")));
    assert.match(first.stdout, /npm install lucide-react\n/);
    assert.match(first.stdout, /alias/);
    writeFileSync(join(dir, "ui/case-file.tsx"), "mine");
    const again = run("add", "case-file", "--dir", "ui");
    assert.equal(again.status, 1);
    assert.match(again.stderr, /nothing copied/);
    assert.equal(readFileSync(join(dir, "ui/case-file.tsx"), "utf8"), "mine");
    assert.equal(run("add", "case-file", "--dir", "ui", "--overwrite").status, 0);
    assert.notEqual(readFileSync(join(dir, "ui/case-file.tsx"), "utf8"), "mine");
  });

  test("add stays inside the project, and dry run writes nothing", () => {
    const out = run("add", "case-file", "--dir", "../escape");
    assert.equal(out.status, 1);
    assert.match(out.stderr, /inside this project/);
    const dry = run("add", "file-details", "--dir", "dry", "--dry-run");
    assert.match(dry.stdout, /would copy/);
    assert.equal(existsSync(join(dir, "dry")), false);
  });

  test("add on an element says there's nothing to copy", () => {
    const out = run("add", "share-panel", "--dir", "el");
    assert.equal(out.status, 0);
    assert.match(out.stdout, /nothing to copy/);
    assert.equal(existsSync(join(dir, "el")), false);
  });

  test("init names the framework", () => {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { vue: "3" } }));
    assert.match(run("init").stdout, /Detected: vue/);
  });

  test("unknown commands and help", () => {
    assert.equal(run("nope").status, 1);
    assert.match(run().stdout, /trenchcoat <command>/);
  });
});

describe("trenchcoat-mcp", () => {
  let server;
  let lines;
  let next = 1;
  before(() => {
    server = spawn(process.execPath, [MCP], { cwd: dir, stdio: ["pipe", "pipe", "inherit"] });
    let buffer = "";
    lines = [];
    server.stdout.on("data", (chunk) => {
      buffer += chunk;
      let i;
      while ((i = buffer.indexOf("\n")) >= 0) {
        lines.push(JSON.parse(buffer.slice(0, i)));
        buffer = buffer.slice(i + 1);
      }
    });
  });
  after(() => server.kill());

  async function call(method, params) {
    const id = next++;
    server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    for (let i = 0; i < 300; i++) {
      const found = lines.find((l) => l.id === id);
      if (found) return found;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error(`No answer to ${method}`);
  }
  const tool = async (name, args) => (await call("tools/call", { name, arguments: args })).result;

  test("initializes, echoing the protocol version, and ignores notifications", async () => {
    const { result } = await call("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } });
    assert.equal(result.protocolVersion, "2025-03-26");
    assert.equal(result.serverInfo.name, "trenchcoat");
    server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
    assert.deepEqual((await call("ping")).result, {});
  });

  test("lists read-only tools", async () => {
    const { result } = await call("tools/list");
    assert.deepEqual(result.tools.map((t) => t.name), ["search_components", "get_component", "get_usage", "lint_code"]);
    assert.ok(result.tools.every((t) => t.annotations.readOnlyHint && t.inputSchema.type === "object"));
  });

  test("searches, then gets the real API and docs", async () => {
    const found = JSON.parse((await tool("search_components", { query: "share people", type: "component" })).content[0].text);
    assert.ok(found.results.some((r) => r.slug === "share-panel"));
    const full = JSON.parse((await tool("get_component", { name: "tc-share-panel" })).content[0].text);
    assert.ok(full.api[0].properties.some((p) => p.name === "checkEntitlement"));
    assert.match(full.docs, /## Overview/);
  });

  test("lints code it's given, without judging imports", async () => {
    const result = await tool("lint_code", { code: '<tc-button variant="nope"></tc-button>' });
    assert.deepEqual(JSON.parse(result.content[0].text).problems.map((p) => p.rule), ["invalid-value"]);
    assert.equal((await tool("lint_code", {})).isError, true);
  });

  test("gives usage for a framework", async () => {
    assert.match((await tool("get_usage", { name: "share-panel", framework: "react" })).content[0].text, /SharePanel/);
  });

  test("errors are reported properly, and the server keeps going", async () => {
    const missing = await tool("get_component", { name: "nope" });
    assert.equal(missing.isError, true);
    assert.equal((await call("tools/call", { name: "nope" })).error.code, -32602);
    assert.equal((await call("nope")).error.code, -32601);
    server.stdin.write("not json\n");
    assert.deepEqual((await call("ping")).result, {});
  });
});
