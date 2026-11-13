/*
 * <tc-skill-library> in real browsers: groups in order, the row's facts, the switches (cancelable, then the list), the
 * search and filters, Add skill's menu by keyboard, Update and open, empty states, narrow width, React and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/skill-library";
import { skillGroups, type LibrarySkill, type TcSkillLibrary } from "../../src/elements/skill-library";
import { SkillLibrary } from "../../src/elements/react/skill-library";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 12, 15, 0);
const H = 3_600_000;
const SKILLS: LibrarySkill[] = [
  { id: "contract", name: "Contract reviewer", description: "Checks a contract", group: "Your team", version: "1.4.0", update: "1.5.0", enabled: true, lastUsed: NOW - 3 * H, triggers: "Runs when asked to review a contract" },
  { id: "cite", name: "Citation formatter", group: "Community", enabled: false },
  { id: "chart", name: "Chart from spreadsheet", group: "Built-in", version: "3.1.0", enabled: true, lastUsed: NOW - 20 * 60_000 },
  { id: "minutes", name: "Meeting minutes", group: "Document tools", enabled: false, triggers: "Runs when a transcript is shared" },
  { id: "expense", name: "Expense checker", group: "Your team", enabled: false },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<any>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (look: "standard" | "clean" = "standard", skills = SKILLS) =>
  fixture<TcSkillLibrary>(html`<tc-skill-library look=${look} .skills=${skills} .now=${NOW} locale="en-US"></tc-skill-library>`);
const $ = <T extends Element = HTMLElement>(el: Element, sel: string) => el.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(el: Element, sel: string) => [...el.querySelectorAll<T>(sel)];
const groupTitles = (el: Element) => $$(el, ".ui-skl__group-title").map((g) => g.textContent?.replace(/\d+$/, "").trim());
const names = (el: Element) => $$(el, ".ui-skl__name").map((b) => b.textContent?.trim());
const sw = (el: Element, name: string) => $$<HTMLButtonElement>(el, ".ui-skl__switch").find((b) => b.getAttribute("aria-label") === name)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const typeIn = (field: HTMLInputElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
};
const choose = (select: HTMLSelectElement, value: string) => {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("tc-skill-library", () => {
  for (const look of ["standard", "clean"] as const)
    test(`structure (${look}): data-ui, look, a group named by the heading, a list per source`, async () => {
      const el = await mount(look);
      expect(el.dataset.ui).toBe("skl");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("group");
      expect(el.getAttribute("aria-label")).toBe("Skills");
      expect($$(el, "ul.ui-skl__list")).toHaveLength(4);
      expect($(el, ".ui-skl__count").textContent).toBe("5 skills · 2 on");
    });

  test("groups: Built-in, Your team, plugins, then Community; `groups` fixes the order", async () => {
    const el = await mount();
    expect(groupTitles(el)).toEqual(["Built-in", "Your team", "Document tools", "Community"]);
    expect(skillGroups(SKILLS, ["Community"])).toEqual(["Community", "Built-in", "Your team", "Document tools"]);
  });

  test("a row: version, update badge, trigger with hidden lead-in, relative last use or Not used yet", async () => {
    const el = await mount();
    const row = $$(el, ".ui-skl__row").find((r) => r.textContent?.includes("Contract reviewer"))!;
    expect($(row, ".ui-skl__version").textContent).toBe("1.4.0");
    expect($(row, ".ui-skl__badge").textContent).toBe("Update available");
    expect($(row, ".ui-skl__triggers").textContent).toBe("When it runs: Runs when asked to review a contract");
    expect($(row, ".ui-skl__used").textContent).toMatch(/Used 3 hr\. ago/);
    const cite = $$(el, ".ui-skl__row").find((r) => r.textContent?.includes("Citation"))!;
    expect($(cite, ".ui-skl__used").textContent).toBe("Not used yet");
  });

  test("without now, last use is a date", async () => {
    const el = await fixture<TcSkillLibrary>(html`<tc-skill-library .skills=${SKILLS} locale="en-US"></tc-skill-library>`);
    expect($(el, ".ui-skl__used").textContent).toBe("Used Nov 12");
  });

  test("switch: fires tc-enabled-change then tc-skills-change, updates and announces", async () => {
    const el = await mount();
    const seen: unknown[] = [];
    on(el, "tc-enabled-change", (e) => seen.push(["enabled", e.detail.id, e.detail.enabled]));
    on(el, "tc-skills-change", (e) => seen.push(["skills", e.detail.id, e.detail.skills.find((s: LibrarySkill) => s.id === "expense").enabled]));
    const s = sw(el, "Expense checker");
    expect(s.getAttribute("role")).toBe("switch");
    expect(s.getAttribute("aria-checked")).toBe("false");
    s.click();
    await settle();
    expect(seen).toEqual([
      ["enabled", "expense", true],
      ["skills", "expense", true],
    ]);
    expect(sw(el, "Expense checker").getAttribute("aria-checked")).toBe("true");
    expect($(el, '[role="status"]').textContent).toBe("Expense checker is on.");
    expect($(el, ".ui-skl__count").textContent).toBe("5 skills · 3 on");
  });

  test("switch: preventing either event keeps it as it was", async () => {
    const el = await mount();
    on(el, "tc-enabled-change", (e) => e.preventDefault());
    sw(el, "Chart from spreadsheet").click();
    await settle();
    expect(sw(el, "Chart from spreadsheet").getAttribute("aria-checked")).toBe("true");
    const el2 = await mount();
    on(el2, "tc-skills-change", (e) => e.preventDefault());
    sw(el2, "Chart from spreadsheet").click();
    await settle();
    expect(sw(el2, "Chart from spreadsheet").getAttribute("aria-checked")).toBe("true");
  });

  test("search covers names, descriptions and triggers; no match offers Clear filters", async () => {
    const el = await mount();
    const seen: string[] = [];
    on(el, "tc-query-change", (e) => seen.push(e.detail.query));
    typeIn($(el, ".ui-skl__search-input"), "transcript");
    await settle();
    expect(seen).toEqual(["transcript"]);
    expect(names(el)).toEqual(["Meeting minutes"]);
    typeIn($(el, ".ui-skl__search-input"), "zzz");
    await settle();
    expect($(el, ".ui-skl__empty").textContent).toContain("No skills match.");
    $<HTMLButtonElement>(el, ".ui-skl__clear").click();
    await settle();
    expect(el.query).toBe("");
    expect(names(el)).toHaveLength(5);
    await expect.poll(() => document.activeElement).toBe($(el, ".ui-skl__search-input"));
  });

  test("source and show filters, each cancelable", async () => {
    const el = await mount();
    const groups: unknown[] = [];
    on(el, "tc-group-change", (e) => groups.push(e.detail.group));
    choose($(el, ".ui-skl__group"), "Your team");
    await settle();
    expect(groups).toEqual(["Your team"]);
    expect(names(el)).toEqual(["Contract reviewer", "Expense checker"]);
    choose($(el, ".ui-skl__show"), "off");
    await settle();
    expect(el.show).toBe("off");
    expect(names(el)).toEqual(["Expense checker"]);
    on(el, "tc-show-change", (e) => e.preventDefault());
    choose($(el, ".ui-skl__show"), "on");
    await settle();
    expect(el.show).toBe("off");
    expect($<HTMLSelectElement>(el, ".ui-skl__show").value).toBe("off");
    choose($(el, ".ui-skl__group"), "");
    await settle();
    expect(el.group).toBeNull();
  });

  test("Update and the name fire their events", async () => {
    const el = await mount();
    const seen: unknown[] = [];
    on(el, "tc-update", (e) => seen.push(["update", e.detail.id, e.detail.version]));
    on(el, "tc-skill-open", (e) => seen.push(["open", e.detail.id]));
    const update = $<HTMLButtonElement>(el, ".ui-skl__update");
    expect(update.textContent?.replace(/\s+/g, " ").trim()).toBe("Update to 1.5.0 – Contract reviewer");
    update.click();
    $$<HTMLButtonElement>(el, ".ui-skl__name")[0].click();
    expect(seen).toEqual([
      ["update", "contract", "1.5.0"],
      ["open", "chart"],
    ]);
  });

  test("Add skill: a menu by keyboard – arrows move, Enter picks, Escape closes back to the button", async () => {
    const el = await mount();
    const picked: string[] = [];
    on(el, "tc-add", (e) => picked.push(e.detail.source));
    const add = $<HTMLButtonElement>(el, ".ui-skl__add");
    expect(add.getAttribute("aria-haspopup")).toBe("menu");
    add.focus();
    key(add, "ArrowDown");
    await settle();
    expect(add.getAttribute("aria-expanded")).toBe("true");
    const items = $$<HTMLButtonElement>(el, ".ui-skl__item");
    await expect.poll(() => document.activeElement).toBe(items[0]);
    key(items[0], "ArrowDown");
    await settle();
    await expect.poll(() => document.activeElement).toBe(items[1]);
    key(items[1], "End");
    await settle();
    await expect.poll(() => document.activeElement).toBe(items[2]);
    key(items[2], "Escape");
    await settle();
    expect($(el, ".ui-skl__menu").hidden).toBe(true);
    await expect.poll(() => document.activeElement).toBe(add);
    add.click();
    await settle();
    $$<HTMLButtonElement>(el, ".ui-skl__item")[1].click();
    await settle();
    expect(picked).toEqual(["url"]);
    expect($(el, ".ui-skl__menu").hidden).toBe(true);
  });

  test("empty, and hide-add", async () => {
    const el = await fixture<TcSkillLibrary>(html`<tc-skill-library hide-add></tc-skill-library>`);
    expect($(el, ".ui-skl__empty").textContent).toContain("No skills yet");
    expect(el.querySelector(".ui-skl__add")).toBeNull();
    expect(el.querySelector(".ui-skl__tools")).toBeNull();
  });

  test("labels rename the words", async () => {
    const el = await fixture<TcSkillLibrary>(html`<tc-skill-library .skills=${SKILLS} .labels=${{ heading: "Fähigkeiten", count: "{n} · {on} an" }}></tc-skill-library>`);
    expect($(el, ".tc-head__title").textContent).toBe("Fähigkeiten");
    expect($(el, ".ui-skl__count").textContent).toBe("5 · 2 an");
  });

  test("narrow: the row is one column", async () => {
    const wrap = await fixture(html`<div style="width: 340px"><tc-skill-library .skills=${SKILLS}></tc-skill-library></div>`);
    const row = $(wrap, ".ui-skl__row");
    expect(getComputedStyle(row).gridTemplateColumns.split(" ")).toHaveLength(1);
  });

  test("React: uncontrolled switches survive a re-render; controlled skills wait for the parent", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let rerender = () => {};
    const changes: string[] = [];
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(React.Fragment, null, [
        React.createElement(SkillLibrary, { key: "a", title: "Mine", defaultSkills: SKILLS, onSkillsChange: (_s, id) => changes.push(id) }),
        React.createElement(SkillLibrary, { key: "b", title: "Fixed", skills: SKILLS, onEnabledChange: (id) => id !== "cite" }),
      ]);
    }
    await act(async () => root.render(React.createElement(App)));
    const [a, b] = host.querySelectorAll<TcSkillLibrary>("tc-skill-library");
    await act(async () => sw(a, "Expense checker").click());
    await act(async () => rerender());
    expect(sw(a, "Expense checker").getAttribute("aria-checked")).toBe("true");
    expect(changes).toEqual(["expense"]);
    await act(async () => sw(b, "Expense checker").click());
    expect(sw(b, "Expense checker").getAttribute("aria-checked")).toBe("false");
    await act(async () => sw(b, "Citation formatter").click());
    expect(sw(b, "Citation formatter").getAttribute("aria-checked")).toBe("false");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-skill-library .skills=${SKILLS} .now=${NOW} description="Audit workspace"></tc-skill-library>
        <tc-skill-library look="clean" heading="Clean" .skills=${SKILLS} .now=${NOW}></tc-skill-library>
      </div>`);
      $<HTMLButtonElement>(wrap, ".ui-skl__add").click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns animation and transitions off", () => {
    const css = (customElements.get("tc-skill-library") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{\s*\[data-ui="skl"\] \*[^{]*\{ animation: none !important; transition: none !important; \}/);
  });
});
