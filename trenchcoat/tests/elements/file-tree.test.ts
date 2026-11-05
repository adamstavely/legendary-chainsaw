/*
 * <tc-file-tree> in real browsers: order, folding, choosing, the filter, the keyboard, lazy folders, long trees, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/file-tree";
import { fileTreeFromPaths, type FileTreeNode, type TcFileTree } from "../../src/elements/file-tree";
import { FileTree } from "../../src/elements/react/file-tree";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NODES = fileTreeFromPaths(["b.ts", "a10.md", "a2.md", "src/alerts/gaps.ts", "src/index.ts", "docs/map.png"]);
const make = (look: "standard" | "clean" = "standard", nodes: FileTreeNode[] = NODES, expanded: string[] = []) => fixture<TcFileTree>(html`<tc-file-tree look=${look} .nodes=${nodes} .expanded=${expanded}></tc-file-tree>`);
const paths = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-ftr__row")].map((r) => r.dataset.path);
const row = (el: Element, path: string) => el.querySelector<HTMLElement>(`.ui-ftr__row[data-path="${path}"]`)!;
const key = async (el: TcFileTree, k: string) => {
  (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await el.updateComplete;
  await settle(el.parentElement!);
};
async function filter(el: TcFileTree, text: string) {
  const input = el.querySelector<HTMLInputElement>(".ui-ftr__input")!;
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle(el.parentElement!);
}

describe("tc-file-tree", () => {
  test("fileTreeFromPaths nests paths and keeps empty folders", () => {
    expect(fileTreeFromPaths(["a/b/c.ts", "a/d.ts", "e/"])).toEqual([{ name: "a", children: [{ name: "b", children: [{ name: "c.ts" }] }, { name: "d.ts" }] }, { name: "e", children: [] }]);
  });

  test("fileTreeFromPaths reads backslashes, drops . and resolves ..", () => {
    expect(fileTreeFromPaths(["./lib/b.ts", "lib\\a.ts", "x/../y.ts", "lib/./c/../d.ts"])).toEqual([{ name: "lib", children: [{ name: "b.ts" }, { name: "a.ts" }, { name: "d.ts" }] }, { name: "y.ts" }]);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: folders first, numbers in order, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("ftr");
      expect(el.dataset.look).toBe(look);
      expect(paths(el)).toEqual(["docs", "src", "a2.md", "a10.md", "b.ts"]);
      expect(el.querySelectorAll('.ui-ftr__row[tabindex="0"]')).toHaveLength(1);
      expect(el.querySelector('[role="tree"]')!.getAttribute("aria-label")).toBe("Files");
      expect(row(el, "src").getAttribute("aria-expanded")).toBe("false");
      expect(row(el, "b.ts").hasAttribute("aria-expanded")).toBe(false);
      expect(row(el, "b.ts").getAttribute("aria-posinset")).toBe("5");
    });
  }

  test("sort off keeps the order given", async () => {
    const el = await make();
    el.sort = false;
    await el.updateComplete;
    expect(paths(el)).toEqual(["b.ts", "a10.md", "a2.md", "src", "docs"]);
  });

  test("a folder folds, with levels; a prevented change stays", async () => {
    const el = await make();
    row(el, "src").click();
    await el.updateComplete;
    expect(el.expanded).toEqual(["src"]);
    expect(row(el, "src/index.ts").getAttribute("aria-level")).toBe("2");
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    row(el, "src").click();
    await el.updateComplete;
    expect(el.expanded).toEqual(["src"]);
  });

  test("a file selects and opens; opening again only opens; prevented keeps the selection", async () => {
    const el = await make();
    const opened: string[] = [];
    let changes = 0;
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent).detail.path));
    el.addEventListener("tc-selected-change", () => changes++);
    row(el, "b.ts").click();
    await el.updateComplete;
    row(el, "b.ts").click();
    expect(el.selected).toBe("b.ts");
    expect(row(el, "b.ts").getAttribute("aria-selected")).toBe("true");
    expect(opened).toEqual(["b.ts", "b.ts"]);
    expect(changes).toBe(1);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    row(el, "a2.md").click();
    await el.updateComplete;
    expect(el.selected).toBe("b.ts");
  });

  test("the filter keeps matches and their folders, marks them, says how many; Esc clears", async () => {
    const el = await make();
    await filter(el, "GAP");
    expect(paths(el)).toEqual(["src", "src/alerts", "src/alerts/gaps.ts"]);
    expect(el.querySelector(".ui-ftr__hit")!.textContent).toBe("gap");
    await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("1 file matches");
    await filter(el, "nothing-here");
    expect(el.querySelector(".ui-ftr__empty")!.textContent).toBe("No matching files");
    el.querySelector<HTMLInputElement>(".ui-ftr__input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle(el.parentElement!);
    expect(el.query).toBe("");
    expect(paths(el)).toHaveLength(5);
  });

  test("a folder whose own name matches shows what's in it, and opens and closes while filtering", async () => {
    const el = await make("standard", fileTreeFromPaths(["src/components/Button.tsx", "src/components/Card.tsx", "src/index.ts"]));
    const changes: unknown[] = [];
    el.addEventListener("tc-expanded-change", (e) => changes.push((e as CustomEvent).detail));
    await filter(el, "components");
    expect(paths(el)).toEqual(["src", "src/components"]);
    expect(row(el, "src/components").getAttribute("aria-expanded")).toBe("false");
    row(el, "src/components").click();
    await settle(el.parentElement!);
    expect(paths(el)).toEqual(["src", "src/components", "src/components/Button.tsx", "src/components/Card.tsx"]);
    row(el, "src").click();
    await settle(el.parentElement!);
    expect(paths(el)).toEqual(["src"]);
    // The filter's own view: `expanded` isn't touched, and a new filter starts afresh
    expect(changes).toEqual([]);
    expect(el.expanded).toEqual([]);
    await filter(el, "card");
    expect(paths(el)).toEqual(["src", "src/components", "src/components/Card.tsx"]);
  });

  test("searchable: ? text and Enter fires tc-search, and doesn't filter", async () => {
    const el = await make();
    el.searchable = true;
    await el.updateComplete;
    const got: string[] = [];
    el.addEventListener("tc-search", (e) => got.push((e as CustomEvent).detail.query));
    await filter(el, "?freezer log");
    expect(paths(el)).toHaveLength(5);
    el.querySelector<HTMLInputElement>(".ui-ftr__input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(got).toEqual(["freezer log"]);
  });

  test("keyboard: arrows, folding, parent, Home, End, typeahead, Enter", async () => {
    const el = await make();
    row(el, "docs").focus();
    await key(el, "ArrowDown");
    expect(document.activeElement).toBe(row(el, "src"));
    await key(el, "ArrowRight");
    expect(el.expanded).toEqual(["src"]);
    await key(el, "ArrowRight");
    expect(document.activeElement).toBe(row(el, "src/alerts"));
    await key(el, "ArrowLeft");
    expect(document.activeElement).toBe(row(el, "src"));
    await key(el, "ArrowLeft");
    expect(el.expanded).toEqual([]);
    await key(el, "End");
    expect(document.activeElement).toBe(row(el, "b.ts"));
    await key(el, "Enter");
    expect(el.selected).toBe("b.ts");
    await key(el, "Home");
    expect(document.activeElement).toBe(row(el, "docs"));
    await key(el, "a");
    expect(document.activeElement).toBe(row(el, "a2.md"));
  });

  test("a lazy folder asks for its children once opened", async () => {
    const nodes: FileTreeNode[] = [{ name: "remote", lazy: true }];
    const el = await make("standard", nodes);
    const asked: string[] = [];
    el.addEventListener("tc-load", (e) => asked.push((e as CustomEvent).detail.path));
    row(el, "remote").click();
    await el.updateComplete;
    expect(asked).toEqual(["remote"]);
    expect(row(el, "remote").getAttribute("aria-busy")).toBe("true");
    el.nodes = [{ name: "remote", children: [{ name: "x.ts" }] }];
    await el.updateComplete;
    expect(paths(el)).toEqual(["remote", "remote/x.ts"]);
  });

  test("a long tree draws only the rows near the view, and End reaches the last", async () => {
    const el = await make("standard", fileTreeFromPaths(Array.from({ length: 5000 }, (_, i) => `f${i}.ts`)));
    expect(el.querySelectorAll(".ui-ftr__row").length).toBeLessThan(300);
    el.querySelector<HTMLElement>('.ui-ftr__row[tabindex="0"]')!.focus();
    await key(el, "End");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.path).toBe("f4999.ts");
  });

  test("scrolled far from the active row, a long tree still has one tab stop", async () => {
    const el = await make("standard", fileTreeFromPaths(Array.from({ length: 600 }, (_, i) => `f${String(i).padStart(3, "0")}.ts`)));
    el.querySelector<HTMLElement>(".ui-ftr__scroll")!.scrollTop = 10_000;
    await expect.poll(() => el.querySelector<HTMLElement>(".ui-ftr__row")!.dataset.path).not.toBe("f000.ts");
    expect(el.querySelectorAll('.ui-ftr__row[tabindex="0"]')).toHaveLength(1);
    const stop = el.querySelector<HTMLElement>('.ui-ftr__row[tabindex="0"]')!;
    stop.focus();
    const next = (stop.nextElementSibling as HTMLElement).dataset.path;
    await key(el, "ArrowDown");
    expect((document.activeElement as HTMLElement).dataset.path).toBe(next);
  });

  test("a status is a letter with a word; no files says so", async () => {
    const el = await make("standard", [{ name: "a.ts", status: "modified" }]);
    expect(el.querySelector(".ui-ftr__status")!.textContent).toContain("Modified");
    expect(el.querySelector('.ui-ftr__status [aria-hidden="true"]')!.textContent).toBe("M");
    const empty = await make("standard", []);
    expect(empty.querySelector(".ui-ftr__empty")!.textContent).toBe("No files");
  });

  test("actions fire tc-action", async () => {
    const el = await make();
    el.actions = [{ id: "refresh", label: "Refresh", icon: "M3 12h18", pressed: true }];
    await el.updateComplete;
    let id = "";
    el.addEventListener("tc-action", (e) => (id = (e as CustomEvent).detail.id));
    const b = el.querySelector<HTMLButtonElement>(".ui-ftr__action")!;
    expect(b.getAttribute("aria-pressed")).toBe("true");
    b.click();
    expect(id).toBe("refresh");
  });

  test("React: uncontrolled survives re-renders; controlled stays until changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(FileTree, { nodes: NODES })));
    const el = host.querySelector("tc-file-tree") as TcFileTree;
    await act(async () => row(el, "b.ts").click());
    await act(async () => root.render(React.createElement(FileTree, { nodes: NODES, title: "Project" })));
    expect(el.selected).toBe("b.ts");
    await act(async () => root.render(React.createElement(FileTree, { nodes: NODES, selected: "a2.md" })));
    await act(async () => row(el, "b.ts").click());
    await settle(host);
    expect(el.selected).toBe("a2.md");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const nodes: FileTreeNode[] = [{ name: "src", children: [{ name: "a.ts", status: "added" }, { name: "b.md", status: "deleted" }, { name: "c.json", status: "modified" }, { name: "d.png" }] }];
        const el = await make(look, nodes, ["src"]);
        await filter(el, "a");
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.map((v) => v.id)).toEqual([]);
      });
});
