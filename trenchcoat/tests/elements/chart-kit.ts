/*
 * What every chart built on internal/chart shares, tested once per chart: the shell in both looks, one tab stop and
 * how the plot is named, the keyboard and what it announces, the tooltip, the table view and its switch, the mark
 * events, empty data, `bare`, `still`, and axe in both looks and both themes.
 */
import axe from "axe-core";
import { expect, test } from "vitest";
import type { TcChartElement } from "../../src/elements/internal/chart/element";
import { finish, settle } from "./helpers";

type Chart = TcChartElement<unknown, Record<string, unknown>>;
export type MakeChart = (opts?: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] }) => Promise<Chart>;

/** Waits until the chart has measured its plot and drawn */
export async function drawn<T extends Element>(el: T) {
  await expect.poll(() => (el as unknown as Chart).measured !== null).toBe(true);
  await settle();
  return el;
}

export const plot = (el: Element) => el.querySelector<HTMLElement>(".tc-chart__plot")!;
export const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();

export function chartBasics(o: { tag: string; ui: string; kind: string; make: MakeChart; marks: number; firstRead: RegExp }) {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the shell, a plot named by the heading and described in words, one tab stop`, async () => {
      const el = await drawn(await o.make({ look }));
      expect(el.tagName.toLowerCase()).toBe(o.tag);
      expect(el.dataset.ui).toBe(o.ui);
      expect(el.dataset.look).toBe(look);
      expect(el.hasAttribute("data-chart")).toBe(true);
      const p = plot(el);
      expect(p.getAttribute("role")).toBe("group");
      expect(p.getAttribute("aria-roledescription")).toBe("Chart");
      expect(document.getElementById(p.getAttribute("aria-labelledby")!)!.textContent).toBe(el.heading);
      expect(document.getElementById(p.getAttribute("aria-describedby")!)!.textContent!.length).toBeGreaterThan(10);
      expect(el.querySelector(".tc-chart__svg")!.getAttribute("aria-hidden")).toBe("true");
      // The plot and the Table button
      expect([...el.querySelectorAll("button, [tabindex]")].map((b) => (b.tagName === "BUTTON" ? b.textContent!.trim() : b.className))).toEqual(["Table", "tc-chart__plot"]);
    });
  }

  test("the keyboard moves through the marks, announcing each; Escape lets go; Enter fires tc-mark-click", async () => {
    const el = await drawn(await o.make({ still: true }));
    const p = plot(el);
    const hovers: unknown[] = [];
    const clicks: string[] = [];
    el.addEventListener("tc-mark-hover", (e) => hovers.push((e as CustomEvent).detail.event?.label ?? null));
    el.addEventListener("tc-mark-click", (e) => clicks.push((e as CustomEvent).detail.event.label));
    p.focus();
    key(p, "ArrowRight");
    await settle();
    expect(status(el)).toMatch(o.firstRead);
    expect(status(el)).toContain(`1 of ${o.marks}`);
    expect(el.querySelector(".tc-chart__tip")).not.toBeNull();
    key(p, "End");
    await settle();
    expect(status(el)).toContain(`${o.marks} of ${o.marks}`);
    key(p, "ArrowRight");
    await settle();
    expect(status(el)).toContain(`1 of ${o.marks}`);
    key(p, "Enter");
    expect(clicks).toHaveLength(1);
    key(p, "Escape");
    await settle();
    expect(el.querySelector(".tc-chart__tip")).toBeNull();
    expect(hovers.at(-1)).toBeNull();
    // Nothing active: Escape is left to the page
    expect(key(p, "Escape")).toBe(true);
  });

  test("the Table button swaps the drawing for the numbers; a prevented tc-view-change keeps the chart", async () => {
    const el = await drawn(await o.make({ still: true }));
    // A screen reader always has the table
    expect(el.querySelectorAll(".tc-sr-only table tbody tr").length).toBe(o.marks);
    const btn = el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!;
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-view-change", stop);
    btn.click();
    await settle();
    expect(el.view).toBe("chart");
    el.removeEventListener("tc-view-change", stop);
    btn.click();
    await settle();
    expect(el.view).toBe("table");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".tc-chart__svg")).toBeNull();
    expect(el.querySelectorAll(".tc-chart__scroll tbody tr").length).toBe(o.marks);
  });

  test("empty data: a sentence, no tab stop on the plot, no Table button", async () => {
    const el = await o.make({ data: [] });
    await settle();
    expect(el.querySelector(".tc-chart__empty")!.textContent).toBe("No data to show.");
    expect(plot(el).hasAttribute("tabindex")).toBe(false);
    expect(el.querySelector(".tc-chart__toggle")).toBeNull();
  });

  test("bare: no card, the plot named directly", async () => {
    const el = await drawn(await o.make({ bare: true }));
    expect(el.querySelector(".tc-head")).toBeNull();
    expect(plot(el).getAttribute("aria-label")).toBe(el.heading);
  });

  for (const look of ["standard", "clean"] as const)
    test(`axe: ${look}, light and dark, with a mark active`, async () => {
      for (const scheme of ["light", "dark"]) {
        const el = await drawn(await o.make({ look, still: true }));
        const wrap = el.parentElement!;
        wrap.style.colorScheme = scheme;
        key(plot(el), "ArrowRight");
        await finish(wrap);
        const r = await axe.run(wrap);
        expect(r.violations.flatMap((v) => v.nodes.map((n) => `${scheme} ${v.id} ${n.html.slice(0, 90)}`))).toEqual([]);
        wrap.remove();
      }
    });
}
