/*
 * <tc-skill-detail> in real browsers: facts and sections, permissions in words, the switch and the risk confirmation,
 * the file list by keyboard and the viewer, runs, Update / Export / Remove with its confirmation, React and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/skill-detail";
import { skillRisks, type SkillDetailFile, type SkillDetailRun, type SkillDetailTool, type TcSkillDetail } from "../../src/elements/skill-detail";
import { SkillDetail } from "../../src/elements/react/skill-detail";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 12, 15, 0);
const H = 3_600_000;
const TOOLS: SkillDetailTool[] = [
  { name: "read_file", permission: "read" },
  { name: "clause_check.py", permission: "run" },
  { name: "supplier_register", permission: "network" },
];
const SAFE: SkillDetailTool[] = [{ name: "read_file", permission: "read" }];
const FILES: SkillDetailFile[] = [
  { path: "SKILL.md", content: "# Contract reviewer" },
  { path: "scripts/clause_check.py", content: "print('ok')" },
  { path: "references/playbook.md", content: "- Liability: 12 months" },
  { path: "references/limits.json" },
];
const RUNS: SkillDetailRun[] = [
  { id: "r2", at: NOW - 3 * H, agent: "Procurement assistant", outcome: "succeeded", note: "2 clauses" },
  { id: "r1", at: NOW - 27 * H, agent: "Legal intake", outcome: "failed" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<any>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (look: "standard" | "clean" = "standard", tools = TOOLS) =>
  fixture<TcSkillDetail>(html`<tc-skill-detail
    look=${look}
    heading="Contract reviewer"
    description="Checks a contract"
    author="Your team"
    version="1.4.0"
    available="1.5.0"
    locale="en-US"
    .now=${NOW}
    .triggers=${["Asked to review a contract"]}
    .tools=${tools}
    .files=${FILES}
    .runs=${RUNS}
    .usedBy=${["Procurement assistant", "Legal intake"]}
  ></tc-skill-detail>`);
const $ = <T extends Element = HTMLElement>(el: Element, sel: string) => el.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(el: Element, sel: string) => [...el.querySelectorAll<T>(sel)];
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const sw = (el: Element) => $<HTMLButtonElement>(el, ".ui-skd__switch");

describe("tc-skill-detail", () => {
  for (const look of ["standard", "clean"] as const)
    test(`structure (${look}): a region named by the skill, sections labelled, the switch named Enabled`, async () => {
      const el = await mount(look);
      expect(el.dataset.ui).toBe("skd");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(el.getAttribute("aria-label")).toBe("Contract reviewer");
      expect($$(el, ".ui-skd__section .ui-skd__label").map((h) => h.textContent)).toEqual(["When it's used", "Tools it can use", "Files", "Recent runs"]);
      const label = document.getElementById(sw(el).getAttribute("aria-labelledby")!);
      expect(label?.textContent).toBe("Enabled");
      expect(sw(el).getAttribute("role")).toBe("switch");
    });

  test("facts, the update badge, permissions and run outcomes in words", async () => {
    const el = await mount();
    expect($$(el, ".ui-skd__facts > div").map((d) => [$(d, "dt").textContent, $(d, "dd").textContent?.replace(/\s+/g, " ").trim()])).toEqual([
      ["Made by", "Your team"],
      ["Version", "1.4.0 1.5.0 available"],
    ]);
    expect($$(el, ".ui-skd__tool").map((t) => t.textContent?.replace(/\s+/g, " ").trim())).toEqual(["read_file: Read-only", "clause_check.py: Runs commands", "supplier_register: Uses the network"]);
    expect($$(el, ".ui-skd__tool[data-risky]")).toHaveLength(2);
    expect(skillRisks(TOOLS)).toEqual(["run", "network"]);
    const runs = $$(el, ".ui-skd__run");
    expect($(runs[0], ".ui-skd__run-outcome").textContent).toBe("Succeeded");
    expect($(runs[0], ".ui-skd__run-at").textContent).toBe("3 hr. ago");
    expect($(runs[1], ".ui-skd__run-outcome").textContent).toBe("Failed");
    expect($(runs[1], ".ui-skd__run-at").textContent).toBe("yesterday");
  });

  test("a safe skill turns on straight away; turning off never asks", async () => {
    const el = await mount("standard", SAFE);
    const seen: boolean[] = [];
    on(el, "tc-enabled-change", (e) => seen.push(e.detail.enabled));
    sw(el).click();
    await settle();
    expect(el.querySelector(".ui-skd__confirm")).toBeNull();
    expect(el.enabled).toBe(true);
    sw(el).click();
    await settle();
    expect(seen).toEqual([true, false]);
    expect($(el, ':scope > [role="status"]').textContent).toBe("Contract reviewer is off.");
  });

  test("a risky skill asks first, naming what it can do; Turn on enables, Escape cancels", async () => {
    const el = await mount();
    const seen: boolean[] = [];
    on(el, "tc-enabled-change", (e) => seen.push(e.detail.enabled));
    sw(el).click();
    await settle();
    const confirm = $(el, '.ui-skd__confirm[data-kind="risk"]');
    expect(confirm.getAttribute("role")).toBe("group");
    expect(document.getElementById(confirm.getAttribute("aria-labelledby")!)?.textContent).toBe("Turn on Contract reviewer?");
    expect($$(confirm, ".ui-skd__risks li").map((l) => l.textContent)).toEqual(["run commands on the machine they work on", "send and fetch data over the network"]);
    expect(sw(el).getAttribute("aria-expanded")).toBe("true");
    expect(seen).toEqual([]);
    await expect.poll(() => document.activeElement).toBe($(el, ".ui-skd__confirm-ok"));
    key($(el, ".ui-skd__confirm-ok"), "Escape");
    await settle();
    expect(el.querySelector(".ui-skd__confirm")).toBeNull();
    expect(el.enabled).toBe(false);
    await expect.poll(() => document.activeElement).toBe(sw(el));
    sw(el).click();
    await settle();
    $<HTMLButtonElement>(el, ".ui-skd__confirm-ok").click();
    await settle();
    expect(seen).toEqual([true]);
    expect(el.enabled).toBe(true);
    expect(sw(el).getAttribute("aria-checked")).toBe("true");
    await expect.poll(() => document.activeElement).toBe(sw(el));
  });

  test("tc-enabled-change prevented: it stays off", async () => {
    const el = await mount("standard", SAFE);
    on(el, "tc-enabled-change", (e) => e.preventDefault());
    sw(el).click();
    await settle();
    expect(el.enabled).toBe(false);
  });

  test("files: a listbox with folders as groups; arrows pick, the viewer follows; no content says so", async () => {
    const el = await mount();
    const list = $(el, '[role="listbox"]');
    expect($$(list, '[role="group"]').map((g) => g.getAttribute("aria-label"))).toEqual(["scripts/", "references/"]);
    const opts = $$(el, '[role="option"]');
    expect(opts.map((o) => o.getAttribute("tabindex"))).toEqual(["0", "-1", "-1", "-1"]);
    expect(opts[0].getAttribute("aria-selected")).toBe("true");
    expect($<HTMLElement & { code: string }>(el, "tc-code-block").code).toBe("# Contract reviewer");
    const seen: string[] = [];
    on(el, "tc-file-change", (e) => seen.push(e.detail.file));
    opts[0].focus();
    key(opts[0], "ArrowDown");
    await settle();
    expect(seen).toEqual(["scripts/clause_check.py"]);
    expect(el.file).toBe("scripts/clause_check.py");
    await expect.poll(() => document.activeElement?.getAttribute("data-path")).toBe("scripts/clause_check.py");
    const block = $<HTMLElement & { code: string; language: string; filename: string }>(el, "tc-code-block");
    expect(block.code).toBe("print('ok')");
    expect(block.language).toBe("py");
    expect(block.filename).toBe("scripts/clause_check.py");
    key(document.activeElement!, "End");
    await settle();
    expect(el.file).toBe("references/limits.json");
    expect($(el, ".ui-skd__viewer").textContent).toContain("No preview for this file.");
    on(el, "tc-file-change", (e) => e.preventDefault());
    $$(el, '[role="option"]')[0].click();
    await settle();
    expect(el.file).toBe("references/limits.json");
  });

  test("Update and Export fire; Remove asks, naming the agents, then fires tc-remove", async () => {
    const el = await mount();
    const seen: unknown[] = [];
    on(el, "tc-update", (e) => seen.push(["update", e.detail.version]));
    on(el, "tc-export", () => seen.push(["export"]));
    on(el, "tc-remove", (e) => seen.push(["remove", e.detail.name, e.detail.usedBy]));
    $<HTMLButtonElement>(el, ".ui-skd__update").click();
    $<HTMLButtonElement>(el, ".ui-skd__export").click();
    const remove = $<HTMLButtonElement>(el, ".ui-skd__remove");
    remove.click();
    await settle();
    const confirm = $(el, '.ui-skd__confirm[data-kind="remove"]');
    expect(document.getElementById(confirm.getAttribute("aria-describedby")!)?.textContent).toBe("Procurement assistant and Legal intake will stop being able to use it. You can add it again later.");
    expect(remove.getAttribute("aria-expanded")).toBe("true");
    await expect.poll(() => document.activeElement).toBe($(el, ".ui-skd__confirm-cancel"));
    $<HTMLButtonElement>(el, ".ui-skd__confirm-cancel").click();
    await settle();
    expect(el.querySelector(".ui-skd__confirm")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(remove);
    remove.click();
    await settle();
    $<HTMLButtonElement>(el, '.ui-skd__confirm[data-kind="remove"] .ui-skd__confirm-ok').click();
    await settle();
    expect(seen).toEqual([["update", "1.5.0"], ["export"], ["remove", "Contract reviewer", ["Procurement assistant", "Legal intake"]]]);
    expect($(el, ':scope > [role="status"]').textContent).toBe("Contract reviewer removed.");
  });

  test("empty sections, no update, no-remove and renamed labels", async () => {
    const el = await fixture<TcSkillDetail>(html`<tc-skill-detail heading="Bare" no-remove .labels=${{ runs: "Letzte Läufe", permissions: { read: "Nur lesen" } }}></tc-skill-detail>`);
    expect($$(el, ".ui-skd__none").map((p) => p.textContent)).toEqual(["Only when someone asks for it by name.", "No tools – it only writes text.", "No files.", "Not used yet."]);
    expect(el.querySelector(".ui-skd__update")).toBeNull();
    expect(el.querySelector(".ui-skd__remove")).toBeNull();
    expect($$(el, ".ui-skd__label")[3].textContent).toBe("Letzte Läufe");
    el.tools = SAFE;
    await settle();
    expect($(el, ".ui-skd__perm").textContent?.trim()).toBe("Nur lesen");
  });

  test("narrow: the file list stacks above the viewer", async () => {
    const wrap = await fixture(html`<div style="width: 360px"><tc-skill-detail heading="Narrow" .files=${FILES}></tc-skill-detail></div>`);
    expect(getComputedStyle($(wrap, ".ui-skd__files")).gridTemplateColumns.split(" ")).toHaveLength(1);
  });

  test("React: uncontrolled enabled and file survive a re-render; controlled ones wait for the parent", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let rerender = () => {};
    const files: string[] = [];
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(React.Fragment, null, [
        React.createElement(SkillDetail, { key: "a", title: "Mine", tools: SAFE, files: FILES, onFileChange: (f) => files.push(f) }),
        React.createElement(SkillDetail, { key: "b", title: "Fixed", tools: SAFE, files: FILES, enabled: false, file: null }),
      ]);
    }
    await act(async () => root.render(React.createElement(App)));
    const [a, b] = host.querySelectorAll<TcSkillDetail>("tc-skill-detail");
    await act(async () => sw(a).click());
    await act(async () => $$(a, '[role="option"]')[1].click());
    await act(async () => rerender());
    expect(sw(a).getAttribute("aria-checked")).toBe("true");
    expect($$(a, '[role="option"]')[1].getAttribute("aria-selected")).toBe("true");
    expect(files).toEqual(["scripts/clause_check.py"]);
    await act(async () => sw(b).click());
    await act(async () => $$(b, '[role="option"]')[1].click());
    expect(sw(b).getAttribute("aria-checked")).toBe("false");
    expect($$(b, '[role="option"]')[0].getAttribute("aria-selected")).toBe("true");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-skill-detail heading="Standard" author="Your team" version="1.4.0" available="1.5.0" .now=${NOW} .triggers=${["Asked to review a contract"]} .tools=${TOOLS} .files=${FILES} .runs=${RUNS} .usedBy=${["Legal intake"]}></tc-skill-detail>
        <tc-skill-detail look="clean" heading="Clean" version="1.4.0" .tools=${TOOLS} .files=${FILES} .runs=${RUNS}></tc-skill-detail>
      </div>`);
      const [a, b] = wrap.querySelectorAll<TcSkillDetail>("tc-skill-detail");
      sw(a).click();
      $<HTMLButtonElement>(b, ".ui-skd__remove").click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns animation and transitions off", () => {
    const css = (customElements.get("tc-skill-detail") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{\s*\[data-ui="skd"\] \*[^{]*\{ animation: none !important; transition: none !important; \}/);
  });
});
