/*
 * <tc-parallel-attempts> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/parallel-attempts";
import type { ParallelAttempt, ParallelAttemptPick, TcParallelAttempts } from "../../src/elements/parallel-attempts";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const run = (status: ParallelAttempt["status"], prefix = ""): ParallelAttempt[] => [
  { id: `${prefix}a`, name: "Attempt A", approach: "Mock the API", status, score: 80 },
  { id: `${prefix}b`, name: "Attempt B", approach: "Retry the call", status, score: 60 },
];
const inUse = (el: Element) => [...(el.querySelector(".ui-pa__row[data-picked] .ui-pa__name")?.childNodes ?? [])].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim())?.textContent ?? null;
const radio = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((r) => name.test(r.getAttribute("aria-label")!))!;
const picks = (el: Element) => {
  const fn = vi.fn<(d: ParallelAttemptPick) => void>();
  el.addEventListener("tc-picked-change", (e) => fn((e as CustomEvent<ParallelAttemptPick>).detail));
  return fn;
};
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-parallel-attempts", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root`, async () => {
      const el = await fixture<TcParallelAttempts>(html`<tc-parallel-attempts look=${look} .attempts=${run("done")}></tc-parallel-attempts>`);
      expect(el.dataset.ui).toBe("pa");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Best of 2");
      // The header first, above the attempts' cards; the counts at its right
      expect(el.querySelector(":scope > .tc-head:first-child .tc-head__aside > .ui-pa__sum")).toBeTruthy();
      expect(getComputedStyle(el).display).toBe("block");
    });

    test(`${look}: the auto pick is reported once all are through; a pick by hand says so`, async () => {
      const el = await fixture<TcParallelAttempts>(html`<tc-parallel-attempts look=${look} .attempts=${run("running")}></tc-parallel-attempts>`);
      const onPick = picks(el);
      el.attempts = run("running");
      await settle();
      expect(onPick).not.toHaveBeenCalled();
      el.attempts = run("done");
      await settle();
      expect(onPick).toHaveBeenCalledTimes(1);
      expect(onPick).toHaveBeenLastCalledWith(expect.objectContaining({ picked: "a", auto: true }));
      expect(inUse(el)).toBe("Attempt A");
      radio(el, /Use this one: Attempt B/).click();
      await settle();
      expect(onPick).toHaveBeenLastCalledWith(expect.objectContaining({ picked: "b", auto: false }));
      expect(onPick).toHaveBeenCalledTimes(2);
      expect(inUse(el)).toBe("Attempt B");
    });

    test(`${look}: a pick from an earlier run doesn't stick to a new one`, async () => {
      const el = await fixture<TcParallelAttempts>(html`<tc-parallel-attempts look=${look} .attempts=${run("done")}></tc-parallel-attempts>`);
      radio(el, /Use this one: Attempt B/).click();
      await settle();
      expect(inUse(el)).toBe("Attempt B");
      el.attempts = run("done", "r2-");
      await settle();
      expect(inUse(el)).toBe("Attempt A");
    });

    test(`${look}: controlled – a click reports, preventDefault keeps the pick`, async () => {
      const el = await fixture<TcParallelAttempts>(html`<tc-parallel-attempts look=${look} .attempts=${run("done")} .picked=${"a"}></tc-parallel-attempts>`);
      const onPick = picks(el);
      el.addEventListener("tc-picked-change", (e) => e.preventDefault());
      radio(el, /Use this one: Attempt B/).click();
      await settle();
      expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ picked: "b", auto: false }));
      expect(el.picked).toBe("a");
      expect(inUse(el)).toBe("Attempt A");
      // The app passes the value back
      el.picked = "b";
      await settle();
      expect(inUse(el)).toBe("Attempt B");
    });

    test(`${look}: radio group – one tab stop on the one in use, arrow keys move and pick (APG)`, async () => {
      const el = await fixture<TcParallelAttempts>(html`<tc-parallel-attempts look=${look} .attempts=${run("done")}></tc-parallel-attempts>`);
      const onPick = picks(el);
      const [a, b] = el.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      expect([a.tabIndex, b.tabIndex]).toEqual([0, -1]);
      expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      a.focus();
      key(a, "ArrowDown");
      await settle();
      expect(document.activeElement).toBe(radio(el, /In use: Attempt B/));
      expect(onPick).toHaveBeenLastCalledWith(expect.objectContaining({ picked: "b", auto: false }));
      expect([...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')].map((r) => r.tabIndex)).toEqual([-1, 0]);
      expect(b.getAttribute("aria-checked")).toBe("true");
      key(b, "ArrowUp");
      await settle();
      expect(document.activeElement).toBe(radio(el, /In use: Attempt A/));
    });

    test(`${look}: a persistent status says the result and the pick, not the running progress (4.1.3)`, async () => {
      const el = await fixture<TcParallelAttempts>(html`<tc-parallel-attempts look=${look} .attempts=${run("running")}></tc-parallel-attempts>`);
      const status = el.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      el.attempts = run("done");
      await settle();
      expect(el.querySelector('[role="status"]')).toBe(status);
      expect(status.textContent).toBe("2 of 2 done, best: Attempt A. Using Attempt A.");
    });
  }

  test("styles: quiet rows never fade their text; the running sweep stops and pauses off-screen", async () => {
    await fixture(html`<tc-parallel-attempts .attempts=${run("running")}></tc-parallel-attempts>`);
    const css = (customElements.get("tc-parallel-attempts") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.ui-pa__row\[data-quiet\] { opacity/);
    expect(css).not.toMatch(/ui-pa-(sweep|glow)[^;]*infinite/);
    expect(css).toMatch(/\[data-ui="pa"\]\[data-offscreen\] \.ui-pa__fill::before/);
  });

  test("a custom icon is cloned; a failed run says Failed; costs use formatCost", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const attempts: ParallelAttempt[] = [
      { id: "a", name: "Attempt A", approach: "x", status: "done", score: 90, icon, cost: 1, took: 1500 },
      { id: "b", name: "Attempt B", approach: "y", status: "failed", note: "Type error", cost: 2 },
    ];
    const el = await fixture<TcParallelAttempts>(html`<tc-parallel-attempts heading="Race" .attempts=${attempts} .formatCost=${(n: number) => `€${n}`}></tc-parallel-attempts>`);
    expect(el.querySelector(".ui-pa__icon svg[data-mine]")).toBeTruthy();
    expect(icon.isConnected).toBe(false);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Race");
    expect(el.querySelector(".ui-pa__sum")!.textContent!.replace(/\s+/g, " ")).toContain("€3");
    expect(el.querySelector('[data-status="failed"] .ui-pa__failed')!.textContent).toBe("Failed");
    expect(el.querySelector('[data-status="done"] .ui-pa__meta')!.textContent).toBe("1.5s · €1");
    expect(el.querySelector('[data-status="done"]')!.hasAttribute("data-best")).toBe(true);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-parallel-attempts task="Fix the test" .attempts=${run("done")}></tc-parallel-attempts>
      <tc-parallel-attempts look="clean" heading="Clean" .attempts=${run("running", "c-")}></tc-parallel-attempts>
    </div>`);
    // The rows fade in: axe reads contrast once they're through
    wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
