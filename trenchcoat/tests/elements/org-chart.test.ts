/*
 * <tc-org-chart> in real browsers: the tree and its default branches, folding, the tree pattern's keys, search,
 * picking with the strip, zoom, the outline layout, odd data (a forest, a missing manager, a loop), controlled use, the
 * React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/org-chart";
import type { OrgChartExpandedChange, OrgChartPerson, OrgChartSelectedChange, TcOrgChart } from "../../src/elements/org-chart";
import { OrgChart } from "../../src/elements/react/org-chart";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PEOPLE: OrgChartPerson[] = [
  { id: "dir", name: "Ines Okafor", title: "Director", team: "Leadership" },
  { id: "res", name: "Tomás Reyes", title: "Head of Research", team: "Research", manager: "dir" },
  { id: "ops", name: "Mira Lindqvist", title: "Head of Operations", team: "Operations", manager: "dir" },
  { id: "r1", name: "Hana Sato", title: "Principal scientist", team: "Coastal ecology", manager: "res" },
  { id: "r2", name: "Elif Demir", title: "Senior scientist", team: "Coastal ecology", manager: "r1", status: "away" },
  { id: "r3", name: "Open role", title: "Postdoctoral fellow", team: "Coastal ecology", manager: "r1", status: "vacant" },
  { id: "o1", name: "Samuel Brooks", title: "Facilities lead", team: "Facilities", manager: "ops" },
];

const make = (look = "standard", people = PEOPLE) => fixture<TcOrgChart>(html`<tc-org-chart look=${look} heading="Institute" .people=${people}></tc-org-chart>`);
const items = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="treeitem"]')];
const ids = (el: Element) => items(el).map((i) => i.dataset.id);
const item = (el: Element, id: string) => el.querySelector<HTMLElement>(`[role="treeitem"][data-id="${id}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const search = async (el: Element, q: string) => {
  const input = el.querySelector<HTMLInputElement>(".ui-org__search-input")!;
  input.value = q;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  return input;
};

describe("tc-org-chart", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a tree named by the heading, the top and one level open, one tab stop, people counted`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("org");
      expect(el.dataset.look).toBe(look);
      const tree = el.querySelector('[role="tree"]')!;
      expect(tree.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect(ids(el)).toEqual(["dir", "res", "ops"]);
      expect(item(el, "dir").getAttribute("aria-expanded")).toBe("true");
      expect(item(el, "res").getAttribute("aria-expanded")).toBe("false");
      expect(item(el, "res").getAttribute("aria-level")).toBe("2");
      expect(item(el, "ops").getAttribute("aria-posinset")).toBe("2");
      expect(item(el, "ops").getAttribute("aria-setsize")).toBe("2");
      expect(items(el).filter((i) => i.tabIndex === 0)).toHaveLength(1);
      expect(text(el.querySelector(".tc-head__sub"))).toBe("6 people · 1 open role");
      expect(text(item(el, "res").querySelector(".ui-org__fold"))).toBe("1 report · 3 in all");
    });
  }

  test("fold and open: the reports button and a cancelable tc-expanded-change", async () => {
    const el = await make();
    const seen: OrgChartExpandedChange[] = [];
    el.addEventListener("tc-expanded-change", (e) => seen.push((e as CustomEvent<OrgChartExpandedChange>).detail));
    item(el, "res").querySelector<HTMLButtonElement>(".ui-org__fold")!.click();
    await settle();
    expect(ids(el)).toEqual(["dir", "res", "r1", "ops"]);
    expect(seen[0]).toEqual({ expanded: ["dir", "res"], id: "res", open: true });
    // Vacant and away read as such
    item(el, "r1").querySelector<HTMLButtonElement>(".ui-org__fold")!.click();
    await settle();
    expect(text(item(el, "r3").querySelector(".ui-org__who"))).toBe("Open role, vacant Postdoctoral fellow Coastal ecology");
    expect(item(el, "r3").hasAttribute("data-vacant")).toBe(true);
    expect(text(item(el, "r2").querySelector(".ui-org__away"))).toBe("Away");
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault(), { once: true });
    item(el, "dir").querySelector<HTMLButtonElement>(".ui-org__fold")!.click();
    await settle();
    expect(item(el, "dir").getAttribute("aria-expanded")).toBe("true");
  });

  test("keys: ↓ ↑, → opens then goes to the first report, ← folds then goes to the manager, Home / End, *", async () => {
    const el = await make();
    item(el, "dir").focus();
    key(item(el, "dir"), "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(item(el, "res"));
    key(item(el, "res"), "ArrowRight");
    await settle();
    expect(item(el, "res").getAttribute("aria-expanded")).toBe("true");
    key(item(el, "res"), "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(item(el, "r1"));
    key(item(el, "r1"), "ArrowLeft");
    await settle();
    expect(document.activeElement).toBe(item(el, "res"));
    key(item(el, "res"), "ArrowLeft");
    await settle();
    expect(item(el, "res").getAttribute("aria-expanded")).toBe("false");
    key(item(el, "res"), "End");
    await settle();
    expect(document.activeElement).toBe(item(el, "ops"));
    key(item(el, "ops"), "*");
    await settle();
    expect(item(el, "res").getAttribute("aria-expanded")).toBe("true");
    expect(item(el, "ops").getAttribute("aria-expanded")).toBe("true");
    key(item(el, "ops"), "Home");
    await settle();
    expect(document.activeElement).toBe(item(el, "dir"));
    expect(items(el).filter((i) => i.tabIndex === 0)).toEqual([item(el, "dir")]);
  });

  test("search: marks and counts matches, opens the way to them, Enter steps through, Escape clears", async () => {
    const el = await make();
    const input = await search(el, "coastal");
    expect(text(el.querySelector(".ui-org__count"))).toBe("3 matches");
    expect(ids(el)).toContain("r2");
    expect(items(el).filter((i) => i.hasAttribute("data-match")).map((i) => i.dataset.id)).toEqual(["r1", "r2", "r3"]);
    expect(el.querySelectorAll(".ui-org__mark").length).toBeGreaterThanOrEqual(3);
    key(input, "Enter");
    await settle();
    expect(text(el.querySelector(".ui-org__count"))).toBe("1 of 3 matches");
    expect(item(el, "r1").hasAttribute("data-current")).toBe(true);
    key(input, "Escape");
    await settle();
    expect(el.filter).toBe("");
    expect(ids(el)).toEqual(["dir", "res", "ops"]);
    await search(el, "zzz");
    expect(text(el.querySelector(".ui-org__count"))).toBe("No matches");
  });

  test("pick: Enter or a click, the strip with manager and reports, chips move there; prevented, it stays", async () => {
    const el = await make();
    const seen: OrgChartSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<OrgChartSelectedChange>).detail));
    item(el, "res").focus();
    key(item(el, "res"), "Enter");
    await settle();
    expect(el.selected).toBe("res");
    expect(item(el, "res").getAttribute("aria-selected")).toBe("true");
    expect(seen[0].person!.name).toBe("Tomás Reyes");
    const strip = el.querySelector(".ui-org__strip")!;
    expect(strip.getAttribute("aria-label")).toBe("Tomás Reyes's place");
    const chips = [...strip.querySelectorAll<HTMLButtonElement>(".ui-org__chip")];
    expect(chips.map((c) => text(c.querySelector(":scope > span:last-child")))).toEqual(["Ines Okafor", "Hana Sato"]);
    chips[1].click();
    await settle();
    expect(el.selected).toBe("r1");
    expect(document.activeElement).toBe(item(el, "r1"));
    el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
    item(el, "dir").click();
    await settle();
    expect(el.selected).toBe("r1");
  });

  test("zoom: − and + step and stop at the ends; Fit; list layout is an outline without zoom", async () => {
    const el = await make();
    const [out, inn, fit] = [...el.querySelectorAll<HTMLButtonElement>(".ui-org__tool")];
    expect(text(el.querySelector(".ui-org__pct"))).toBe("100%");
    inn.click();
    await settle();
    expect(text(el.querySelector(".ui-org__pct"))).toBe("125%");
    expect(inn.disabled).toBe(true);
    for (let i = 0; i < 6; i++) out.click();
    await settle();
    expect(text(el.querySelector(".ui-org__pct"))).toBe("50%");
    expect(out.disabled).toBe(true);
    fit.click();
    await settle();
    expect(Number(text(el.querySelector(".ui-org__pct")).replace("%", ""))).toBeGreaterThanOrEqual(50);
    el.layout = "list";
    await settle();
    expect(getComputedStyle(el.querySelector(".ui-org__tree")!).display).toBe("block");
    expect(getComputedStyle(el.querySelector(".ui-org__zoom")!).display).toBe("none");
  });

  test("odd data: several roots, a manager not in the list, someone managing themselves, a loop, nobody", async () => {
    const el = await make("standard", [
      { id: "a", name: "Ana" },
      { id: "b", name: "Ben", manager: "ghost" },
      { id: "c", name: "Cy", manager: "c" },
      { id: "d", name: "Di", manager: "e" },
      { id: "e", name: "Ed", manager: "d" },
    ]);
    expect(ids(el)).toEqual(["a", "b", "c"]);
    const empty = await make("standard", []);
    expect(text(empty.querySelector(".ui-org__empty"))).toBe("No one to show yet.");
  });

  test("React wrapper: uncontrolled picks survive re-renders; controlled expanded stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picks: (string | null)[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(OrgChart, { title: "Team", people: PEOPLE, onSelectedChange: (id) => void picks.push(id), "data-n": n } as React.ComponentProps<typeof OrgChart>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-org-chart")!;
    item(el, "ops").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(item(el, "ops").getAttribute("aria-selected")).toBe("true");
    expect(picks).toEqual(["ops"]);
    await act(async () => root.render(React.createElement(OrgChart, { people: PEOPLE, expanded: ["dir"] })));
    await settle();
    const held = host.querySelector("tc-org-chart")!;
    item(held, "res").querySelector<HTMLButtonElement>(".ui-org__fold")!.click();
    await settle();
    expect(item(held, "res").getAttribute("aria-expanded")).toBe("false");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, searching and with a pick`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-org-chart heading="Institute" selected="res" .people=${PEOPLE} .expanded=${["dir", "res", "r1"]}></tc-org-chart>
        <tc-org-chart look="clean" heading="Institute list" layout="list" filter="coastal" .people=${PEOPLE}></tc-org-chart>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
