/*
 * <tc-test-run-result> in real browsers: the summary in words and the bar, failures first and open, the diff and the
 * trimmed stack, the file link, the folds, Re-run failed, running, the keyboard, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/test-run-result";
import { countTests, firstUserFrame, isLibraryFrame, type TcTestRunResult, type TestCase } from "../../src/elements/test-run-result";
import { TestRunResult } from "../../src/elements/react/test-run-result";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const STACK = `AssertionError: expected 1240 to be 1214.5
    at Object.<anonymous> (src/ledger.test.ts:42:18)
    at node_modules/vitest/dist/runner.js:120:9
    at node:internal/process/task_queues:95:5`;
const TESTS: TestCase[] = [
  { id: "p1", name: "opens a period", suite: "periods", status: "passed", durationMs: 4 },
  { id: "f1", name: "sums postings", suite: "ledger › totals", status: "failed", durationMs: 18, message: "expected 1240 to be 1214.5", expected: "1214.5", received: "1240", stack: STACK },
  { id: "s1", name: "imports a CSV", status: "skipped" },
  { id: "f2", name: "rounds half-cents", status: "failed", message: "Objects differ", expected: "a\nb\nc", received: "a\nB\nc", file: "src/rounding.test.ts", line: 17 },
];
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcTestRunResult>(html`<tc-test-run-result look=${look} command="npx vitest run" duration="12400" .tests=${TESTS}></tc-test-run-result>`);
const fails = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-trr__fail")].map((f) => f.dataset.id);
const toggle = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-trr__toggle[data-id="${id}"]`)!;
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;

describe("tc-test-run-result", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: counts in words, failures first with the first open, one tab stop among them`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("trr");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-trr__words")!.textContent!.trim()).toBe("2 failed, 1 passed, 1 skipped");
      expect(el.querySelector(".ui-trr__cmd")!.textContent).toBe("npx vitest run");
      expect(el.querySelector(".ui-trr__meta")!.textContent).toBe("12 s");
      expect(fails(el)).toEqual(["f1", "f2"]);
      expect(toggle(el, "f1").getAttribute("aria-expanded")).toBe("true");
      expect(toggle(el, "f2").getAttribute("aria-expanded")).toBe("false");
      expect(el.querySelectorAll('.ui-trr__toggle[tabindex="0"]')).toHaveLength(1);
      expect(el.querySelector(".ui-trr__fails")!.getAttribute("aria-label")).toBe("Failed tests");
      expect(el.querySelector(".ui-trr__bar")!.getAttribute("aria-hidden")).toBe("true");
      expect(toggle(el, "f1").textContent).toContain("ledger › totals › sums postings");
    });
  }

  test("helpers: counts with totals filled in, library frames, the first user frame", () => {
    expect(countTests(TESTS)).toEqual({ passed: 1, failed: 2, skipped: 1 });
    expect(countTests(TESTS, { passed: 212 })).toEqual({ passed: 212, failed: 2, skipped: 1 });
    expect(isLibraryFrame("    at node_modules/vitest/dist/runner.js:120:9")).toBe(true);
    expect(isLibraryFrame("    at post (src/ledger.ts:88:11)")).toBe(false);
    expect(firstUserFrame(STACK)).toEqual({ file: "src/ledger.test.ts", line: 42 });
    expect(firstUserFrame("    at node:internal/x:1:1")).toBeNull();
    expect(firstUserFrame(undefined)).toBeNull();
  });

  test("an open failure: the message, a line diff marked in words, the trimmed stack and the file link", async () => {
    const el = await make();
    const panel = el.querySelector<HTMLElement>(`#${toggle(el, "f1").getAttribute("aria-controls")}`)!;
    expect(panel.hidden).toBe(false);
    expect(panel.querySelector(".ui-trr__message")!.textContent).toBe("expected 1240 to be 1214.5");
    const stack = panel.querySelector(".ui-trr__stack")!.textContent!;
    expect(stack).toContain("src/ledger.test.ts:42:18");
    expect(stack).not.toContain("node_modules");
    expect(stack).not.toContain("node:internal");
    const changed = panel.querySelectorAll(".ui-trr__line[data-changed]");
    expect(changed).toHaveLength(2);
    expect(changed[0].textContent).toContain("expected: 1214.5");
    expect(changed[1].textContent).toContain("received: 1240");
    const opened: unknown[] = [];
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent).detail));
    panel.querySelector<HTMLElement>(".ui-trr__file")!.click();
    expect(opened).toEqual([{ id: "f1", file: "src/ledger.test.ts", line: 42 }]);
  });

  test("a multi-line diff marks only the lines that differ; a given file wins over the stack", async () => {
    const el = await make();
    toggle(el, "f2").click();
    await settle();
    const panel = el.querySelector<HTMLElement>(`#${toggle(el, "f2").getAttribute("aria-controls")}`)!;
    expect(panel.querySelectorAll(".ui-trr__side[data-kind='received'] .ui-trr__line[data-changed]")).toHaveLength(1);
    expect(panel.querySelector(".ui-trr__file")!.textContent).toBe("src/rounding.test.ts:17");
  });

  test("toggling fires a cancelable tc-open-change; prevented, it stays", async () => {
    const el = await make();
    const seen: string[][] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent).detail.open));
    toggle(el, "f2").click();
    await settle();
    expect(seen).toEqual([["f1", "f2"]]);
    expect(toggle(el, "f2").getAttribute("aria-expanded")).toBe("true");
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    toggle(el, "f1").click();
    await settle();
    expect(toggle(el, "f1").getAttribute("aria-expanded")).toBe("true");
  });

  test("passed and skipped fold into a line each that opens to the list; counts alone are plain text", async () => {
    const el = await make();
    const folds = [...el.querySelectorAll<HTMLElement>(".ui-trr__fold")];
    expect(folds.map((f) => f.textContent!.trim())).toEqual(["1 passed", "1 skipped"]);
    const list = el.querySelector<HTMLElement>(`#${folds[0].getAttribute("aria-controls")}`)!;
    expect(list.hidden).toBe(true);
    folds[0].click();
    await settle();
    expect(list.hidden).toBe(false);
    expect(list.textContent).toContain("opens a period");
    el.counts = { passed: 212 };
    el.tests = TESTS.filter((t) => t.status !== "passed");
    await settle();
    const fold = el.querySelector<HTMLElement>(".ui-trr__fold")!;
    expect(fold.textContent!.trim()).toBe("212 passed");
    expect(fold.tagName).toBe("SPAN");
  });

  test("Re-run failed fires a cancelable tc-rerun with the failing ids and is announced", async () => {
    const el = await make();
    const seen: string[][] = [];
    el.addEventListener("tc-rerun", (e) => seen.push((e as CustomEvent).detail.ids), { once: true });
    el.querySelector<HTMLElement>(".ui-trr__rerun")!.click();
    await settle();
    expect(seen).toEqual([["f1", "f2"]]);
    expect(status(el)).toBe("Re-running 2 failed tests");
    el.noRerun = true;
    await settle();
    expect(el.querySelector(".ui-trr__rerun")).toBeNull();
  });

  test("running: live counts of the total, Re-run waits, the end is announced", async () => {
    const el = await make();
    el.running = true;
    el.total = 10;
    await settle();
    expect(el.querySelector(".ui-trr__words")!.textContent).toContain("Running · 2 failed, 1 passed, 1 skipped of 10");
    expect(el.querySelector(".ui-trr__meta")!.textContent).toBe("Running");
    const rerun = el.querySelector<HTMLElement>(".ui-trr__rerun")!;
    expect(rerun.getAttribute("aria-disabled")).toBe("true");
    let fired = 0;
    el.addEventListener("tc-rerun", () => fired++);
    rerun.click();
    await settle();
    expect(fired).toBe(0);
    el.running = false;
    await settle();
    expect(status(el)).toBe("Run finished: 2 failed, 1 passed, 1 skipped");
  });

  test("keyboard: ↑ ↓, j k, Home and End move between failures", async () => {
    const el = await make();
    el.tests = [...TESTS, { id: "f3", name: "third", status: "failed" }];
    await settle();
    toggle(el, "f1").focus();
    const key = (k: string) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    const at = () => (document.activeElement as HTMLElement).dataset.id;
    key("ArrowDown");
    await expect.poll(at).toBe("f2");
    key("j");
    await expect.poll(at).toBe("f3");
    key("k");
    await expect.poll(at).toBe("f2");
    key("Home");
    await expect.poll(at).toBe("f1");
    key("End");
    await expect.poll(at).toBe("f3");
    expect(el.querySelectorAll('.ui-trr__toggle[tabindex="0"]')).toHaveLength(1);
  });

  test("no tests says so; all passed has no failures list", async () => {
    const el = await fixture<TcTestRunResult>(html`<tc-test-run-result></tc-test-run-result>`);
    expect(el.querySelector(".ui-trr__words")!.textContent!.trim()).toBe("No tests");
    el.tests = [TESTS[0]];
    await settle();
    expect(el.querySelector(".ui-trr__fails")).toBeNull();
    expect(el.querySelector<HTMLElement>(".ui-trr__summary")!.dataset.state).toBe("passed");
  });

  test("React: an uncontrolled open survives re-renders; a controlled one stays until the parent changes it", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const files: string[] = [];
    const render = (props: Partial<React.ComponentProps<typeof TestRunResult>>) =>
      act(async () => root.render(React.createElement(TestRunResult, { title: "audit-ledger", tests: TESTS, onOpenFile: (f, l) => void files.push(`${f}:${l}`), ...props })));
    await render({});
    const el = wrap.querySelector<TcTestRunResult>("tc-test-run-result")!;
    await settle(wrap);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("audit-ledger");
    toggle(el, "f2").click();
    await settle(wrap);
    await render({});
    await settle(wrap);
    expect(toggle(el, "f2").getAttribute("aria-expanded")).toBe("true");
    el.querySelector<HTMLElement>(".ui-trr__panel:not([hidden]) .ui-trr__file")!.click();
    expect(files).toEqual(["src/ledger.test.ts:42"]);
    await render({ open: [] });
    await settle(wrap);
    toggle(el, "f1").click();
    await settle(wrap);
    expect(toggle(el, "f1").getAttribute("aria-expanded")).toBe("false");
    let reran: string[] = [];
    await render({ open: [], onRerun: (ids) => void (reran = ids) });
    el.querySelector<HTMLElement>(".ui-trr__rerun")!.click();
    expect(reran).toEqual(["f1", "f2"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}`;
      wrap.innerHTML = `<tc-test-run-result look="standard" command="npm test"></tc-test-run-result><tc-test-run-result look="clean" running total="9"></tc-test-run-result>`;
      wrap.querySelectorAll<TcTestRunResult>("tc-test-run-result").forEach((el) => {
        el.tests = TESTS;
        el.open = ["f1", "f2"];
      });
      await settle(wrap);
      wrap.querySelectorAll<HTMLElement>(".ui-trr__fold").forEach((f) => f.click());
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
