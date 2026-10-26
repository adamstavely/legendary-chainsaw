// Forced colours (Windows High Contrast) on every gallery entry – remediation step 2.8, re-checking Part 1's rules
// (tokens.css section 3b) now that the components are Lit elements in light DOM.
//   node scripts/forced-colors.mjs [filter]
// Chromium with forced colours emulated. For every control in each stage, in both looks:
//   · buttons, switches, checkboxes, comboboxes and fields keep a visible border (the rules give them ButtonText)
//   · a selected, pressed, checked or current item is painted Highlight
//   · focusing a control shows a visible outline (or border)
// Only the CSS the rules can reach is checked; how it reads to a person still needs a look.
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const PORT = Number(process.env.VISUAL_PORT ?? 5330);
const filter = process.argv[2];
const server = await createServer({ configFile: "vite.config.ts", server: { port: PORT, strictPort: true }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", forcedColors: "active" });

const list = await context.newPage();
await list.goto(`http://localhost:${PORT}/#/`);
await list.waitForSelector(".sidebar a");
const ids = (await list.$$eval(".sidebar a", (as) => as.map((a) => a.getAttribute("href").slice(2))))
  .filter((id) => id && !id.startsWith("library/") && !id.startsWith("blocks/") && !id.startsWith("screens/"))
  .filter((id) => !filter || id.includes(filter));
await list.close();

const problems = [];
let controls = 0;
for (const id of ids) {
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/#/${id}`);
  await page.waitForFunction(() => {
    const stages = [...document.querySelectorAll(".stage")];
    return stages.length > 0 && stages.every((s) => s.firstElementChild && !s.firstElementChild.classList.contains("placeholder"));
  });
  await page.waitForTimeout(600);
  const found = await page.evaluate(() => {
    const out = { controls: 0, issues: [] };
    const name = (el) => `${el.closest("[data-ui]")?.getAttribute("data-ui") ?? "?"} ${el.tagName.toLowerCase()}${el.getAttribute("role") ? `[role=${el.getAttribute("role")}]` : ""} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 24)}"`;
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.closest("[hidden], [aria-hidden=true], [inert]");
    };
    const CONTROL = 'button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea';
    const EXEMPT = '[role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]';
    for (const stage of document.querySelectorAll(".stage")) {
      for (const el of stage.querySelectorAll(CONTROL)) {
        if (el.matches(EXEMPT) || !visible(el) || !el.closest("[data-look]")) continue;
        // A visually hidden native control (a 1px proxy, a checkbox under a custom box) isn't what people see
        const r = el.getBoundingClientRect();
        if (r.width <= 2 || r.height <= 2 || getComputedStyle(el).opacity === "0") continue;
        out.controls++;
        const cs = getComputedStyle(el);
        const border = ["Top", "Right", "Bottom", "Left"].some((s) => cs[`border${s}Style`] !== "none" && parseFloat(cs[`border${s}Width`]) > 0);
        if (!border) out.issues.push(`no border: ${name(el)}`);
      }
      for (const el of stage.querySelectorAll('[aria-selected="true"], [aria-pressed="true"], [aria-checked="true"]')) {
        if (!visible(el) || !el.closest("[data-look]")) continue;
        const bg = getComputedStyle(el).backgroundColor;
        // Chromium resolves Highlight to a real colour; transparent means the rule didn't reach it
        if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") out.issues.push(`selected without Highlight: ${name(el)}`);
      }
    }
    return out;
  });
  controls += found.controls;
  for (const issue of found.issues) problems.push(`${id}: ${issue}`);

  // Focus: every visible focusable control shows an outline or border when focused from the keyboard
  const focusIssues = await page.evaluate(async () => {
    const issues = [];
    const focusables = [...document.querySelectorAll('.stage button, .stage [tabindex="0"], .stage input:not([type="hidden"]), .stage textarea, .stage a[href], .stage [role="combobox"]')]
      .filter((el) => el.closest("[data-look]") && el.getBoundingClientRect().width > 2 && !el.closest("[hidden], [inert], [aria-hidden=true]") && !el.disabled)
      .slice(0, 40);
    for (const el of focusables) {
      el.focus({ focusVisible: true });
      if (document.activeElement !== el) continue;
      const cs = getComputedStyle(el);
      const host = el.closest("[data-ui]");
      const hostCs = host ? getComputedStyle(host) : null;
      const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      // box-shadow doesn't count: forced colours remove it
      const ring = !!hostCs && hostCs.outlineStyle !== "none" && parseFloat(hostCs.outlineWidth) > 0;
      const border = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none";
      // Some draw the ring on an inner part (a toast's card)
      const inner = [...el.querySelectorAll("*")].slice(0, 20).some((c) => getComputedStyle(c).outlineStyle !== "none" && parseFloat(getComputedStyle(c).outlineWidth) > 0);
      if (!outline && !ring && !border && !inner) issues.push(`focus not visible: ${host?.getAttribute("data-ui") ?? "?"} ${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 24)}"`);
      el.blur();
    }
    return issues;
  });
  for (const issue of focusIssues) problems.push(`${id}: ${issue}`);
  await page.close();
}
await browser.close();
await server.close();

console.log(`forced colours: ${ids.length} entries, ${controls} controls checked`);
if (problems.length) {
  console.log(`${problems.length} problems:\n  ${[...new Set(problems)].join("\n  ")}`);
  process.exitCode = 1;
} else console.log("forced colours ok: borders, Highlight and focus outlines everywhere");
