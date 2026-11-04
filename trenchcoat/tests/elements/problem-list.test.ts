/*
 * <tc-problem-list> in real browsers: grouping and order, counts, the severity and text filters, folding, choosing, fixes,
 * the keyboard, a flat list, empty states, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/problem-list";
import { problemKey, type ProblemItem, type TcProblemList } from "../../src/elements/problem-list";
import { ProblemList } from "../../src/elements/react/problem-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PROBLEMS: ProblemItem[] = [
  { path: "tests/a.test.ts", line: 2, severity: "warning", message: "Unused variable 'x'.", source: "eslint", code: "no-unused-vars" },
  { path: "src/lib/freezer.ts", line: 4, column: 22, severity: "warning", message: "Prefer const.", source: "eslint", code: "prefer-const", fix: "Change to const" },
  { path: "src/lib/freezer.ts", line: 3, column: 50, severity: "error", message: "Cannot find name 'Reading'.", source: "ts", code: "TS2304", fix: "Import 'Reading'" },
  { path: "README.md", line: 1, severity: "info", message: "Heading is long.", id: "md-1" },
];
const make = (look: "standard" | "clean" = "standard", problems: ProblemItem[] = PROBLEMS) => fixture<TcProblemList>(html`<tc-problem-list look=${look} .problems=${problems}></tc-problem-list>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-prob__row")];
const file = (el: Element, path: string) => el.querySelector<HTMLElement>(`.ui-prob__file[title="${path}"]`)!;
const problem = (el: Element, i: number) => el.querySelectorAll<HTMLElement>(".ui-prob__problem")[i];
const messages = (el: Element) => [...el.querySelectorAll(".ui-prob__message")].map((m) => m.textContent);
const key = async (el: TcProblemList, k: string, target: Element = document.activeElement!) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await el.updateComplete;
  await settle(el.parentElement!);
};

describe("tc-problem-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: files worst first, problems by severity then line, counts, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("prob");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector('[role="tree"]')!.getAttribute("aria-label")).toBe("Problems");
      expect([...el.querySelectorAll<HTMLElement>(".ui-prob__file")].map((f) => f.title)).toEqual(["src/lib/freezer.ts", "tests/a.test.ts", "README.md"]);
      expect(messages(el)).toEqual(["Error: Cannot find name 'Reading'.", "Warning: Prefer const.", "Warning: Unused variable 'x'.", "Info: Heading is long."]);
      expect(el.querySelectorAll('.ui-prob__row[tabindex="0"]')).toHaveLength(1);
      expect([...el.querySelectorAll(".ui-prob__total")].map((t) => t.textContent!.trim())).toEqual(["1 Errors", "2 Warnings", "1 Info"]);
      expect(file(el, "src/lib/freezer.ts").dataset.severity).toBe("error");
      expect(file(el, "src/lib/freezer.ts").querySelector(".ui-prob__count")!.textContent).toBe("2 problems");
      expect(problem(el, 0).querySelector(".ui-prob__where")!.textContent).toBe("Line 3:50");
      expect(problem(el, 0).querySelector(".ui-prob__source")!.textContent).toBe("ts TS2304");
      await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("4 problems");
    });
  }

  test("the severity filter shows counts, narrows and moves with arrows; prevented stays", async () => {
    const el = await make();
    const segs = [...el.querySelectorAll<HTMLElement>(".ui-prob__seg")];
    expect(segs.map((s) => s.textContent!.replace(/\s+/g, " ").trim())).toEqual(["All 4", "Errors 1", "Warnings 2", "Info 1"]);
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("Severity");
    segs[2].click();
    await el.updateComplete;
    expect(el.filter).toBe("warning");
    expect(messages(el)).toEqual(["Warning: Prefer const.", "Warning: Unused variable 'x'."]);
    el.querySelector<HTMLElement>('.ui-prob__seg[aria-checked="true"]')!.focus();
    await key(el, "ArrowRight");
    expect(el.filter).toBe("info");
    expect(document.activeElement).toBe(el.querySelector('.ui-prob__seg[data-filter="info"]'));
    el.addEventListener("tc-filter-change", (e) => e.preventDefault());
    await key(el, "ArrowRight");
    expect(el.filter).toBe("info");
  });

  test("the text filter matches message, path, source and code; Esc clears; nothing matching says so", async () => {
    const el = await make();
    const input = el.querySelector<HTMLInputElement>(".ui-prob__input")!;
    const type = async (v: string) => {
      input.value = v;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await settle(el.parentElement!);
    };
    await type("ts2304");
    expect(messages(el)).toEqual(["Error: Cannot find name 'Reading'."]);
    await type("tests/");
    expect(messages(el)).toEqual(["Warning: Unused variable 'x'."]);
    await type("nowhere");
    expect(el.querySelector(".ui-prob__empty")!.textContent).toBe("No problems match");
    await key(el, "Escape", input);
    expect(el.query).toBe("");
    expect(messages(el)).toHaveLength(4);
  });

  test("a file folds; prevented stays", async () => {
    const el = await make();
    file(el, "src/lib/freezer.ts").click();
    await el.updateComplete;
    expect(el.expanded).toEqual(["tests/a.test.ts", "README.md"]);
    expect(rows(el)).toHaveLength(5);
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    file(el, "src/lib/freezer.ts").click();
    await el.updateComplete;
    expect(el.expanded).toEqual(["tests/a.test.ts", "README.md"]);
  });

  test("a problem selects and opens; prevented keeps the selection; the fix fires tc-fix only", async () => {
    const el = await make();
    const opened: unknown[] = [];
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent).detail));
    problem(el, 0).click();
    await el.updateComplete;
    expect(el.selected).toBe(problemKey(PROBLEMS[2]));
    expect(problem(el, 0).getAttribute("aria-selected")).toBe("true");
    expect(opened).toEqual([{ path: "src/lib/freezer.ts", line: 3, column: 50, problem: PROBLEMS[2] }]);
    let fixed: ProblemItem | null = null;
    el.addEventListener("tc-fix", (e) => (fixed = (e as CustomEvent).detail.problem));
    problem(el, 1).querySelector<HTMLButtonElement>(".ui-prob__fix")!.click();
    expect(fixed).toBe(PROBLEMS[1]);
    expect(opened).toHaveLength(1);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    problem(el, 3).click();
    await el.updateComplete;
    expect(el.selected).toBe(problemKey(PROBLEMS[2]));
    expect(problemKey(PROBLEMS[3])).toBe("md-1");
  });

  test("problems at the same place each get their own row: the arrows pass them and one click selects one", async () => {
    const twins: ProblemItem[] = [
      { path: "src/a.ts", line: 3, column: 5, severity: "error", message: "Cannot find name 'x'.", source: "ts" },
      { path: "src/a.ts", line: 3, column: 5, severity: "error", message: "Cannot find name 'x'.", source: "eslint" },
      { path: "src/a.ts", line: 3, column: 5, severity: "error", message: "Cannot find name 'x'.", source: "eslint" },
      { path: "src/a.ts", line: 9, column: 5, severity: "error", message: "Other." },
    ];
    const el = await make("standard", twins);
    const keys = rows(el).map((r) => r.dataset.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(problemKey(twins[0])).not.toBe(problemKey(twins[1]));
    problem(el, 0).click();
    await el.updateComplete;
    problem(el, 0).focus();
    await key(el, "ArrowDown");
    await key(el, "ArrowDown");
    await key(el, "ArrowDown");
    expect(document.activeElement).toBe(problem(el, 3));
    problem(el, 2).click();
    await el.updateComplete;
    expect(el.selected).toBe(`${problemKey(twins[2])}#2`);
    expect(rows(el).filter((r) => r.getAttribute("aria-selected") === "true")).toEqual([problem(el, 2)]);
  });

  test("tc-fix is a request: it isn't cancelable", async () => {
    const el = await make();
    let event: CustomEvent | null = null;
    el.addEventListener("tc-fix", (e) => (event = e as CustomEvent));
    problem(el, 1).querySelector<HTMLButtonElement>(".ui-prob__fix")!.click();
    expect(event!.cancelable).toBe(false);
  });

  test("keyboard: arrows, into a fix and back, folding, parent, End, Enter", async () => {
    const el = await make();
    file(el, "src/lib/freezer.ts").focus();
    await key(el, "ArrowRight");
    expect(document.activeElement).toBe(problem(el, 0));
    await key(el, "ArrowRight");
    expect(document.activeElement).toBe(problem(el, 0).querySelector(".ui-prob__fix"));
    await key(el, "ArrowLeft");
    expect(document.activeElement).toBe(problem(el, 0));
    await key(el, "ArrowLeft");
    expect(document.activeElement).toBe(file(el, "src/lib/freezer.ts"));
    await key(el, "ArrowLeft");
    expect(el.expanded).toEqual(["tests/a.test.ts", "README.md"]);
    await key(el, "End");
    expect(document.activeElement).toBe(problem(el, 1));
    await key(el, "Enter");
    expect(el.selected).toBe("md-1");
    await key(el, "ArrowUp");
    expect(document.activeElement).toBe(file(el, "README.md"));
  });

  test("group-by none lists problems with their path", async () => {
    const el = await make();
    el.groupBy = "none";
    await el.updateComplete;
    expect(el.querySelectorAll(".ui-prob__file")).toHaveLength(0);
    expect(problem(el, 0).getAttribute("aria-level")).toBe("1");
    expect(problem(el, 0).querySelector(".ui-prob__path")!.textContent).toBe("src/lib/freezer.ts");
  });

  test("no problems shows a check; running says so", async () => {
    const el = await make("standard", []);
    expect(el.querySelector(".ui-prob__empty")!.textContent).toBe("No problems");
    expect(el.querySelector(".ui-prob__empty-mark")).not.toBeNull();
    el.status = "running";
    await el.updateComplete;
    expect(el.querySelector(".ui-prob__empty")!.textContent).toBe("Checking");
    await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("Checking");
  });

  test("actions fire tc-action", async () => {
    const el = await make();
    el.actions = [{ id: "rerun", label: "Run again", icon: "M3 12h18" }];
    await el.updateComplete;
    let id = "";
    el.addEventListener("tc-action", (e) => (id = (e as CustomEvent).detail.id));
    el.querySelector<HTMLButtonElement>(".ui-prob__action")!.click();
    expect(id).toBe("rerun");
  });

  test("React: uncontrolled filter survives re-renders; controlled stays until changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(ProblemList, { problems: PROBLEMS })));
    const el = host.querySelector("tc-problem-list") as TcProblemList;
    await act(async () => el.querySelector<HTMLElement>('.ui-prob__seg[data-filter="error"]')!.click());
    await act(async () => root.render(React.createElement(ProblemList, { problems: PROBLEMS, title: "Checks" })));
    expect(el.filter).toBe("error");
    let told: unknown = null;
    await act(async () => root.render(React.createElement(ProblemList, { problems: PROBLEMS, filter: "info", onFilterChange: (f) => (told = f) })));
    await act(async () => el.querySelector<HTMLElement>('.ui-prob__seg[data-filter="warning"]')!.click());
    await settle(host);
    expect(el.filter).toBe("info");
    expect(told).toBe("warning");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        el.selected = problemKey(PROBLEMS[2]);
        el.actions = [{ id: "rerun", label: "Run again", icon: "M3 12h18" }];
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.map((v) => v.id)).toEqual([]);
      });
});
