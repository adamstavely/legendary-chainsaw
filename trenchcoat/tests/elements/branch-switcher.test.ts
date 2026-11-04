/*
 * <tc-branch-switcher> in real browsers: the trigger's counts, the popup and its sections, the filter as a combobox,
 * picking and creating with their cancelable events, Escape returning focus, inline, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/branch-switcher";
import { toBranchName, type BranchItem, type TcBranchSwitcher } from "../../src/elements/branch-switcher";
import { BranchSwitcher } from "../../src/elements/react/branch-switcher";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 2, 15, 0);
const H = 3_600_000;
const BRANCHES: BranchItem[] = [
  { name: "feature/booking-calendar", kind: "worktree", path: "~/work/booking", ahead: 2, behind: 5, dirty: true, updated: NOW - 2 * H },
  { name: "main", kind: "local", updated: NOW - 30 * 60_000 },
  { name: "fix/sample-export", kind: "local", ahead: 1 },
  { name: "origin/main", kind: "remote" },
];
const make = (look: "standard" | "clean" = "standard", inline = false) =>
  fixture<TcBranchSwitcher>(html`<tc-branch-switcher look=${look} ?inline=${inline} current="feature/booking-calendar" base="main" .branches=${BRANCHES} .now=${NOW}></tc-branch-switcher>`);
const trigger = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-brsw__trigger")!;
const filter = (el: Element) => el.querySelector<HTMLInputElement>(".ui-brsw__filter")!;
const names = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-brsw__option")].map((o) => o.dataset.name ?? "create");
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("tc-branch-switcher", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the trigger names the branch with its counts`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("brsw");
      expect(el.dataset.look).toBe(look);
      const t = trigger(el);
      expect(t.querySelector(".ui-brsw__current")!.textContent).toBe("feature/booking-calendar");
      expect(t.querySelector(".ui-brsw__counts")!.textContent).toBe("↑2↓5");
      expect(t.textContent).toContain("2 ahead, 5 behind of main, uncommitted changes, Change branch");
      expect(t.getAttribute("aria-expanded")).toBe("false");
      expect(el.querySelector(".ui-brsw__pop")).toBeNull();
    });
  }

  test("times and counts follow locale and labels; a date from another year shows its year", async () => {
    const branches: BranchItem[] = [
      { name: "feature/booking-calendar", kind: "local", ahead: 2, behind: 5, updated: NOW - 10_000 },
      { name: "old", kind: "local", updated: Date.UTC(2025, 3, 9) },
    ];
    const el = await fixture<TcBranchSwitcher>(
      html`<tc-branch-switcher inline locale="de" current="feature/booking-calendar" base="main" .branches=${branches} .now=${NOW}
        .labels=${{ ahead: "{count} voraus", behind: "{count} zurück", aheadOf: "{counts} gegenüber {base}" }}></tc-branch-switcher>`,
    );
    const metas = [...el.querySelectorAll(".ui-brsw__meta")].map((m) => m.textContent);
    expect(metas[0]).toBe(new Intl.RelativeTimeFormat("de", { numeric: "auto", style: "short" }).format(0, "second"));
    expect(metas[0]).not.toContain("just now");
    expect(metas[1]).toContain("2025");
    expect(el.textContent).toContain("2 voraus, 5 zurück gegenüber main");
  });

  test("opens a popup with sections, the current one selected, focus in the filter", async () => {
    const el = await make();
    trigger(el).click();
    await expect.poll(() => document.activeElement === filter(el)).toBe(true);
    expect(el.open).toBe(true);
    expect(trigger(el).getAttribute("aria-expanded")).toBe("true");
    expect([...el.querySelectorAll(".ui-brsw__group-head")].map((g) => g.textContent)).toEqual(["Worktrees", "Local", "Remote"]);
    expect(names(el)).toEqual(["feature/booking-calendar", "main", "fix/sample-export", "origin/main"]);
    const current = el.querySelector('[aria-selected="true"]') as HTMLElement;
    expect(current.dataset.name).toBe("feature/booking-calendar");
    expect(filter(el).getAttribute("aria-activedescendant")).toBe(current.id);
    expect(el.querySelector('[data-name="main"] .ui-brsw__meta')!.textContent).toBe("30 min. ago");
    expect(el.querySelector('[data-name="feature/booking-calendar"] .ui-brsw__meta')!.textContent).toBe("~/work/booking · 2 hr. ago");
  });

  test("arrows move the active row, Enter picks it, and the list closes back to the trigger", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-current-change", (e) => seen.push((e as CustomEvent).detail.current));
    trigger(el).click();
    await expect.poll(() => document.activeElement === filter(el)).toBe(true);
    key(filter(el), "ArrowDown");
    await settle();
    expect(el.querySelector("[data-active]")!.getAttribute("data-name")).toBe("main");
    key(filter(el), "ArrowUp");
    key(filter(el), "ArrowUp");
    key(filter(el), "ArrowDown");
    await settle();
    key(filter(el), "Enter");
    await settle();
    expect(seen).toEqual(["main"]);
    expect(el.current).toBe("main");
    expect(el.open).toBe(false);
    await expect.poll(() => document.activeElement === trigger(el)).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("On main");
  });

  test("a prevented tc-current-change keeps the branch", async () => {
    const el = await make("standard", true);
    el.addEventListener("tc-current-change", (e) => e.preventDefault());
    (el.querySelector('[data-name="main"]') as HTMLElement).click();
    await settle();
    expect(el.current).toBe("feature/booking-calendar");
  });

  test("Escape closes and returns focus to the trigger", async () => {
    const el = await make();
    trigger(el).click();
    await expect.poll(() => document.activeElement === filter(el)).toBe(true);
    key(filter(el), "Escape");
    await expect.poll(() => el.open).toBe(false);
    await expect.poll(() => document.activeElement === trigger(el)).toBe(true);
  });

  test("the filter narrows the list and offers to create a new name from the base", async () => {
    const el = await make("standard", true);
    const queries: string[] = [];
    el.addEventListener("tc-query-change", (e) => queries.push((e as CustomEvent).detail.query));
    type(filter(el), "main");
    await settle();
    expect(names(el)).toEqual(["main", "origin/main"]);
    type(filter(el), "feature/new map");
    await settle();
    expect(names(el)).toEqual(["create"]);
    expect(el.querySelector(".ui-brsw__create")!.textContent!.trim()).toBe("Create branch “feature/new-map” from main");
    const created: unknown[] = [];
    el.addEventListener("tc-create", (e) => created.push((e as CustomEvent).detail));
    key(filter(el), "Enter");
    await settle();
    expect(created).toEqual([{ name: "feature/new-map", from: "main" }]);
    expect(queries).toEqual(["main", "feature/new map", ""]);
    expect(el.query).toBe("");
    type(filter(el), "zzz-none");
    el.branches = [];
    await settle();
    expect(names(el)).toEqual(["create"]);
  });

  test("a prevented tc-query-change keeps the text; nothing matching says so", async () => {
    const el = await make("standard", true);
    el.addEventListener("tc-query-change", (e) => e.preventDefault(), { once: true });
    type(filter(el), "ma");
    await settle();
    expect(el.query).toBe("");
    expect(filter(el).value).toBe("");
    el.query = "~~";
    await settle();
    expect(names(el)).toEqual([]);
    expect(el.querySelector(".ui-brsw__empty")!.textContent).toBe("No branches match");
  });

  test("toBranchName cleans a typed name", () => {
    expect(toBranchName("  fix sample  export ")).toBe("fix-sample-export");
    expect(toBranchName("feature/a..b~c")).toBe("feature/abc");
    expect(toBranchName("/lead/")).toBe("lead");
  });

  test("toBranchName never leaves something git refuses, even once a character is dropped", () => {
    // Each of these came out of the old one as a name `git check-ref-format --branch` rejects
    expect(toBranchName("a.~.b")).toBe("ab");
    expect(toBranchName("a/../b")).toBe("a/b");
    expect(toBranchName("feature//x")).toBe("feature/x");
    expect(toBranchName("x.lock")).toBe("x");
    expect(toBranchName("feat/.hidden")).toBe("feat/hidden");
    expect(toBranchName("a.lock/b")).toBe("a/b");
    expect(toBranchName("-x")).toBe("x");
    expect(toBranchName("@")).toBe("");
    expect(toBranchName("a\u0007b")).toBe("ab");
  });

  test("a local branch with a prefix doesn't hide Create; a remote one under its local name does", async () => {
    const el = await make("standard", true);
    el.branches = [{ name: "feature/login", kind: "local" }, { name: "origin/fix", kind: "remote" }];
    type(filter(el), "login");
    await settle();
    expect(names(el)).toEqual(["feature/login", "create"]);
    type(filter(el), "fix");
    await settle();
    expect(names(el)).toEqual(["origin/fix"]);
  });

  test("typed text with {base} or $ stays as typed in the Create label", async () => {
    const el = await make("standard", true);
    type(filter(el), "{base}$&");
    await settle();
    expect(el.querySelector(".ui-brsw__create")!.textContent!.trim()).toBe("Create branch “{base}$&” from main");
  });

  test("option ids stay unique when branches come and go", async () => {
    const el = await make("standard", true);
    el.branches = [{ name: "a", kind: "local" }, { name: "b", kind: "local" }];
    await settle();
    el.branches = [{ name: "b", kind: "local" }, { name: "c", kind: "local" }, { name: "d", kind: "local" }];
    await settle();
    const ids = [...el.querySelectorAll(".ui-brsw__option")].map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("Sync sends the counts; opening can be prevented", async () => {
    const el = await make();
    const synced: unknown[] = [];
    el.addEventListener("tc-sync", (e) => synced.push((e as CustomEvent).detail));
    el.querySelector<HTMLElement>(".ui-brsw__sync")!.click();
    expect(synced).toEqual([{ branch: "feature/booking-calendar", ahead: 2, behind: 5 }]);
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    trigger(el).click();
    await settle();
    expect(el.open).toBe(false);
    el.busy = true;
    await settle();
    expect(el.querySelector<HTMLButtonElement>(".ui-brsw__sync")!.disabled).toBe(true);
  });

  test("inline draws the list in place without a trigger", async () => {
    const el = await make("clean", true);
    expect(el.querySelector(".ui-brsw__trigger")).toBeNull();
    expect(el.querySelector(".ui-brsw__pop")).toBeNull();
    expect(names(el)).toHaveLength(4);
    type(filter(el), "fix");
    await settle();
    key(filter(el), "Escape");
    await settle();
    expect(el.query).toBe("");
  });

  test("React: current is controlled; the branch comes with the change", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const seen: string[] = [];
    await act(async () => root.render(React.createElement(BranchSwitcher, { title: "Branch", inline: true, branches: BRANCHES, current: "main", now: NOW, onCurrentChange: (c, b) => void seen.push(`${c} ${b?.kind}`) })));
    const el = wrap.querySelector<TcBranchSwitcher>("tc-branch-switcher")!;
    await settle();
    (el.querySelector('[data-name="fix/sample-export"]') as HTMLElement).click();
    await settle();
    expect(seen).toEqual(["fix/sample-export local"]);
    expect(el.current).toBe("main");
    await act(async () => root.unmount());
    const root2 = createRoot(wrap);
    await act(async () => root2.render(React.createElement(BranchSwitcher, { inline: true, branches: BRANCHES, defaultCurrent: "main", now: NOW })));
    const el2 = wrap.querySelector<TcBranchSwitcher>("tc-branch-switcher")!;
    await settle();
    (el2.querySelector('[data-name="fix/sample-export"]') as HTMLElement).click();
    await act(async () => root2.render(React.createElement(BranchSwitcher, { inline: true, branches: [...BRANCHES], defaultCurrent: "main", now: NOW })));
    expect(el2.current).toBe("fix/sample-export");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, open or inline`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}; width: 380px`;
      wrap.innerHTML = `<tc-branch-switcher look="standard"></tc-branch-switcher><tc-branch-switcher look="clean" inline heading="Pick"></tc-branch-switcher>`;
      const els = [...wrap.querySelectorAll<TcBranchSwitcher>("tc-branch-switcher")];
      for (const el of els) Object.assign(el, { branches: BRANCHES, current: "feature/booking-calendar", now: NOW });
      els[1].query = "ma";
      await settle(wrap);
      els[0].open = true;
      await expect.poll(() => !!els[0].querySelector(".ui-brsw__pop")).toBe(true);
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

test("punctuation in valid branch names never collides in option IDs", async () => {
  const el = await fixture<TcBranchSwitcher>(html`<tc-branch-switcher inline current="feature/a" .branches=${[{name:"feature/a",kind:"local"},{name:"feature_a",kind:"local"}]}></tc-branch-switcher>`);
  const options = [...el.querySelectorAll<HTMLElement>(".ui-brsw__option")];
  expect(new Set(options.map(o=>o.id)).size).toBe(2);
  key(filter(el),"ArrowDown"); await settle();
  const active = document.getElementById(filter(el).getAttribute("aria-activedescendant")!);
  expect(active?.dataset.name).toBe("feature_a");
  const id = active!.id;
  type(filter(el),"feature_a"); await settle();
  expect(el.querySelector<HTMLElement>(".ui-brsw__option")!.id).toBe(id);
});
