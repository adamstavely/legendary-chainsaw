// Builds the package, installs the packed tarball into every app in examples/, builds and serves each app, and
// checks the shared contract in Chromium (examples/README.md; audit/lit-port-plan.md acceptance checks 2, 5, 6, 9).
// The html app also mounts every element (all.html) and checks that importing one element tree-shakes the rest;
// Next builds with webpack, the others with Vite (Angular with esbuild).
//   node scripts/examples.mjs [name…]        all apps, or the named ones (react next vue nuxt angular svelte html)
//   node scripts/examples.mjs --no-pack …    reuse examples/.packed/trenchcoat.tgz
import { chromium } from "@playwright/test";
import { execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const EX = join(ROOT, "examples");
const PACKED = join(EX, ".packed");
const ALL = ["react", "next", "vue", "nuxt", "angular", "svelte", "html"];
const args = process.argv.slice(2);
const names = args.filter((a) => !a.startsWith("--"));
const apps = names.length ? names : ALL;
const sh = (cmd, cwd = ROOT) => execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", maxBuffer: 64 << 20 });

if (!args.includes("--no-pack")) {
  console.log("package: build and pack");
  sh("npm run -s build:package");
  rmSync(PACKED, { recursive: true, force: true });
  mkdirSync(PACKED, { recursive: true });
  sh(`npm pack --pack-destination ${PACKED}`);
  const tgz = readdirSync(PACKED).find((f) => f.endsWith(".tgz"));
  renameSync(join(PACKED, tgz), join(PACKED, "trenchcoat.tgz"));
}

const wait = async (port, ms = 60_000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const res = await fetch(`http://localhost:${port}/`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`nothing on port ${port}`);
};

/** html: every tag in custom-elements.json, created with no props, upgrades without errors */
async function everyElement(page, port) {
  await page.goto(`http://localhost:${port}/all.html`);
  await page.waitForSelector("body[data-tags]");
  await page.waitForTimeout(500);
  const { tags, missing } = await page.evaluate(() => ({
    tags: Number(document.body.dataset.tags),
    // Upgraded: defined, and rendered (every element but the look provider marks its root with data-ui)
    missing: [...document.querySelectorAll("#all > *")].filter((el) => !el.matches(":defined") || (el.localName !== "tc-look-provider" && !el.hasAttribute("data-ui"))).map((el) => el.localName),
  }));
  return [tags < 100 && `all elements: only ${tags} tags in the manifest`, ...missing.map((t) => `all elements: ${t} didn't upgrade`)].filter(Boolean);
}

/** html: a build that imports trenchcoat/button holds the button and none of the other elements */
function treeShaking(dir) {
  const js = readFileSync(join(dir, "dist-shake", "shake.js"), "utf8");
  const others = ["tc-combobox", "tc-data-table", "tc-agent-plan", "tc-world-map"].filter((t) => js.includes(`"${t}"`));
  return [!js.includes('"tc-button"') && "tree-shaking: tc-button missing", ...others.map((t) => `tree-shaking: trenchcoat/button pulled in ${t}`)].filter(Boolean);
}

/** The shared contract, on a served app */
async function check(page) {
  const problems = [];
  const expect = (ok, what) => ok || problems.push(what);
  // Frameworks render on their own schedule (Angular zoneless, Vue's next tick): wait for the text, briefly
  const textIs = async (sel, want) => {
    try {
      await page.waitForFunction(([s, w]) => document.querySelector(s)?.textContent?.trim() === w, [sel, want], { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  };
  await page.waitForSelector("tc-button#save[data-ui=button] > button", { timeout: 20_000 });
  // Button
  await page.click("#save > button");
  await page.click("#save > button");
  expect(await textIs("#clicks", "2"), `button: two clicks counted (got ${await page.textContent("#clicks")})`);
  // Combobox, controlled by the app; a page <label for> names its input
  const input = page.locator("#who input[role=combobox]");
  const named = await input.evaluate((el) => (el.getAttribute("aria-labelledby") ?? "").split(" ").map((id) => document.getElementById(id)?.textContent).join(" "));
  expect(named === "Reviewers", `combobox: named by its <label for> (got "${named}")`);
  await input.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  expect(await textIs("#value", '["ana"]'), `combobox: app state follows (got ${await page.textContent("#value")})`);
  expect((await page.locator("#who .ui-cbx__chips .ui-cbx__chip-label").allTextContents()).includes("Ana Lima"), "combobox: chip shows the picked value");
  // Form: submits the value under its name
  await page.keyboard.press("Escape");
  await page.click("#f tc-button[type=submit] > button");
  expect(await textIs("#submitted", '["ana"]'), `form: submitted the value (got ${await page.textContent("#submitted")})`);
  // Data table: renderCell from the app
  const arr = (await page.textContent('#table [data-cell="0-2"]'))?.trim();
  expect(arr === "€1200", `data-table: renderCell drew the cell (got ${arr})`);
  // Look provider
  expect((await page.getAttribute("#clean", "data-look")) === "clean", "look-provider: Clean below it");
  return problems;
}

const browser = await chromium.launch();
let failed = 0;
let port = 4800;
for (const app of apps) {
  const dir = join(EX, app);
  const out = (s) => console.log(`${app}: ${s}`);
  let server;
  try {
    // A new tarball has a new checksum: drop the old install and its lockfile entry
    rmSync(join(dir, "node_modules", "trenchcoat"), { recursive: true, force: true });
    rmSync(join(dir, "package-lock.json"), { force: true });
    out("install");
    sh("npm install --no-audit --no-fund --loglevel=error", dir);
    out("build");
    sh("npm run -s build", dir);
    port += 1;
    server = spawn("npm", ["run", "-s", "serve", "--", String(port)], { cwd: dir, stdio: "ignore", detached: true });
    await wait(port);
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(`http://localhost:${port}/`);
    const problems = await check(page);
    if (app === "html") problems.push(...(await everyElement(page, port)), ...treeShaking(dir));
    // Hydration and runtime errors (a missing favicon is not one)
    problems.push(...errors.filter((e) => !/favicon|404/.test(e)).map((e) => `console: ${e.slice(0, 200)}`));
    await page.close();
    if (problems.length) {
      failed++;
      out(`FAIL\n  ${problems.join("\n  ")}`);
    } else out("ok");
  } catch (e) {
    failed++;
    out(`FAIL ${String(e.stdout ?? "").slice(-1500)}${String(e.stderr ?? e.message ?? e).slice(-1500)}`);
  } finally {
    if (server) {
      try {
        process.kill(-server.pid);
      } catch {}
    }
  }
}
await browser.close();
if (!existsSync(PACKED)) failed++;
console.log(failed ? `examples: ${failed} of ${apps.length} failed` : `examples: all ${apps.length} pass`);
process.exit(failed ? 1 : 0);
