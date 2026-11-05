/*
 * <tc-diff-viewer> in real browsers: statuses and counts, opening, the keyboard, controlled use, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/diff-viewer";
import { diffFileCounts, diffFileStatus, type DiffFile, type TcDiffViewer } from "../../src/elements/diff-viewer";
import { DiffViewer } from "../../src/elements/react/diff-viewer";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const FILES: DiffFile[] = [
  { path: "src/a.ts", before: "one\ntwo\nthree\n", after: "one\n2\nthree\nfour\n" },
  { path: "src/new.ts", after: "a\nb\n" },
  { path: "src/old.ts", before: "gone\n" },
  { path: "src/moved.ts", previousPath: "lib/moved.ts", before: "x\n", after: "x\n" },
  { path: "map.png", binary: true },
];
const make = (look: "standard" | "clean" = "standard", files = FILES) => fixture<TcDiffViewer>(html`<tc-diff-viewer look=${look} .files=${files}></tc-diff-viewer>`);
const row = (el: Element, path: string) => el.querySelector<HTMLButtonElement>(`[data-path="${path}"] .ui-dfv__toggle`)!;

describe("tc-diff-viewer", () => {
  test("helpers work out the status and counts", () => {
    expect(FILES.map(diffFileStatus)).toEqual(["modified", "added", "deleted", "renamed", "modified"]);
    expect(diffFileCounts(FILES[0])).toEqual({ additions: 2, deletions: 1 });
    expect(diffFileCounts(FILES[1]).additions).toBe(2);
    expect(diffFileCounts(FILES[2]).deletions).toBe(1);
    expect(diffFileCounts(FILES[4])).toEqual({ additions: 0, deletions: 0 });
  });

  test("counts include blank lines, and a long file with scattered edits counts only those lines", () => {
    expect(diffFileCounts({ path: "n", after: "a\n\nb\n" })).toEqual({ additions: 3, deletions: 0 });
    expect(diffFileCounts({ path: "d", before: "a\n\n\nb\n" })).toEqual({ additions: 0, deletions: 4 });
    const before = Array.from({ length: 20000 }, (_, i) => `line ${i}`);
    const after = before.map((l, i) => (i % 100 === 0 ? `${l} changed` : l));
    expect(diffFileCounts({ path: "big", before: before.join("\n"), after: after.join("\n") })).toEqual({ additions: 200, deletions: 200 });
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: totals, a row per file, the first ones open`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("dfv");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelectorAll(".ui-dfv__file")).toHaveLength(5);
      expect(el.querySelector(".ui-dfv__totals")!.textContent).toContain("5 files");
      expect(el.querySelectorAll("tc-code-block")).toHaveLength(3);
      expect(row(el, "src/new.ts").textContent).toContain("Added");
      expect(row(el, "src/moved.ts").textContent).toContain("lib/moved.ts →");
    });
  }

  test("an open file draws a diff with its changes", async () => {
    const el = await make();
    const block = el.querySelector("tc-code-block")!;
    await expect.poll(() => block.querySelector('[data-view="diff"]')).not.toBeNull();
    expect(block.textContent).toContain("four");
  });

  test("a row opens and closes; a prevented change stays", async () => {
    const el = await make();
    const toggle = row(el, "src/a.ts");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    toggle.click();
    await el.updateComplete;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-expanded-change", stop);
    toggle.click();
    await el.updateComplete;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    // Nothing happened, so nothing is said
    expect(el.querySelector('[role="status"]')!.textContent).not.toContain("open");
  });

  test("a binary file says so and doesn't open", async () => {
    const el = await make();
    const toggle = row(el, "map.png");
    expect(toggle.disabled).toBe(true);
    expect(toggle.hasAttribute("aria-expanded")).toBe(false);
    expect(toggle.textContent).toContain("Binary file");
  });

  test("Expand all and Collapse all", async () => {
    const el = await make();
    const all = () => el.querySelector<HTMLButtonElement>(".ui-dfv__all")!;
    expect(all().textContent).toBe("Expand all");
    all().click();
    await settle(el.parentElement!);
    expect(el.querySelectorAll("tc-code-block")).toHaveLength(4);
    expect(all().textContent).toBe("Collapse all");
    all().click();
    await settle(el.parentElement!);
    expect(el.querySelectorAll("tc-code-block")).toHaveLength(0);
  });

  test("arrows, Home and End move between rows, skipping binary files", async () => {
    const el = await make();
    row(el, "src/a.ts").focus();
    const key = (k: string) => (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    key("ArrowDown");
    expect(document.activeElement).toBe(row(el, "src/new.ts"));
    key("End");
    expect(document.activeElement).toBe(row(el, "src/moved.ts"));
    key("ArrowDown");
    expect(document.activeElement).toBe(row(el, "src/a.ts"));
    key("ArrowUp");
    expect(document.activeElement).toBe(row(el, "src/moved.ts"));
    key("Home");
    expect(document.activeElement).toBe(row(el, "src/a.ts"));
  });

  test("no files says so", async () => {
    const el = await make("standard", []);
    expect(el.querySelector(".ui-dfv__empty")!.textContent).toBe("No changes");
    expect(el.querySelector(".ui-dfv__totals")).toBeNull();
  });

  test("narrow: nothing overflows, and the file's name stays", async () => {
    const el = await make();
    el.style.width = "260px";
    await finish(el);
    const toggle = row(el, "src/a.ts");
    expect(toggle.scrollWidth).toBeLessThanOrEqual(toggle.clientWidth + 1);
    expect(el.querySelector<HTMLElement>('[data-path="src/a.ts"] .ui-dfv__base')!.offsetWidth).toBeGreaterThan(0);
  });

  test("React: uncontrolled survives re-renders; controlled stays until changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(DiffViewer, { files: FILES, defaultExpanded: [] })));
    const el = host.querySelector("tc-diff-viewer") as TcDiffViewer;
    await act(async () => row(el, "src/new.ts").click());
    await act(async () => root.render(React.createElement(DiffViewer, { files: FILES, defaultExpanded: [], title: "Edits" })));
    expect(row(el, "src/new.ts").getAttribute("aria-expanded")).toBe("true");
    await act(async () => root.render(React.createElement(DiffViewer, { files: FILES, expanded: ["src/a.ts"] })));
    await act(async () => row(el, "src/new.ts").click());
    await settle(host);
    expect(row(el, "src/new.ts").getAttribute("aria-expanded")).toBe("false");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.map((v) => v.id)).toEqual([]);
      });
});
