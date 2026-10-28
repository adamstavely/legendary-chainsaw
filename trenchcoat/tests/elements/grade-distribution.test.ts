/*
 * <tc-grade-distribution> in real browsers: counts over grade names, how many were assessed, zero grades muted, the
 * bar in proportion, picking a grade as a filter with the keyboard, controlled use, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/grade-distribution";
import type { Grade, GradeSelectedChange, TcGradeDistribution } from "../../src/elements/grade-distribution";
import { GradeDistribution } from "../../src/elements/react/grade-distribution";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const GRADES: Grade[] = [
  { id: "outstanding", label: "Outstanding", count: 1, tone: "success" },
  { id: "excellent", label: "Excellent", count: 0, tone: "info" },
  { id: "satisfactory", label: "Satisfactory", count: 3 },
  { id: "dissatisfactory", label: "Dissatisfactory", count: 0, tone: "danger" },
];

const pick = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-grade="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", extra = { selectable: true, bar: true }) =>
  fixture<TcGradeDistribution>(html`<tc-grade-distribution look=${look} heading="Paper grades" .grades=${GRADES} ?selectable=${extra.selectable} ?bar=${extra.bar}></tc-grade-distribution>`);

describe("tc-grade-distribution", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a count over each grade, the number assessed, zero grades muted and the bar in proportion`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("grd");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-grd__head")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Paper grades · 4 assessed");
      const list = el.querySelector('[role="toolbar"]')!;
      expect(list.getAttribute("aria-label")).toBe("Paper grades, 4 assessed");
      expect([...el.querySelectorAll(".ui-grd__grade")].map((g) => `${g.querySelector(".ui-grd__count")!.textContent} ${g.querySelector(".ui-grd__label")!.textContent}`)).toEqual(["1 Outstanding", "0 Excellent", "3 Satisfactory", "0 Dissatisfactory"]);
      expect([...el.querySelectorAll<HTMLElement>(".ui-grd__grade")].map((g) => g.hasAttribute("data-zero"))).toEqual([false, true, false, true]);
      const segs = [...el.querySelectorAll<HTMLElement>(".ui-grd__seg")];
      expect(segs.map((s) => s.title)).toEqual(["Outstanding: 1", "Satisfactory: 3"]);
      expect(segs[1].getBoundingClientRect().width).toBeGreaterThan(segs[0].getBoundingClientRect().width * 2);
      expect(list.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    });
  }

  test("not selectable: a plain list with no buttons and no bar unless asked", async () => {
    const el = await make("standard", { selectable: false, bar: false });
    expect(el.querySelector('[role="list"]')).toBeTruthy();
    expect(el.querySelector("button")).toBeNull();
    expect(el.querySelector(".ui-grd__bar")).toBeNull();
  });

  test("click or Enter picks a grade; again or Escape clears it; arrows, Home and End move; tc-selected-change fires", async () => {
    const el = await make();
    const seen: GradeSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<GradeSelectedChange>).detail));
    pick(el, "satisfactory").click();
    await settle();
    expect(el.selected).toBe("satisfactory");
    expect(pick(el, "satisfactory").getAttribute("aria-pressed")).toBe("true");
    pick(el, "satisfactory").click();
    await settle();
    expect(el.selected).toBeNull();
    pick(el, "outstanding").focus();
    const at = () => document.activeElement?.getAttribute("data-grade");
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('[data-grade][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowRight");
    expect(at()).toBe("excellent");
    await press("End");
    expect(at()).toBe("dissatisfactory");
    await press("Home");
    expect(at()).toBe("outstanding");
    await press("ArrowLeft");
    expect(at()).toBe("outstanding");
    // Enter and Space reach the button's own click
    pick(el, "excellent").click();
    await settle();
    key(pick(el, "excellent"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(seen.map((s) => s.selected)).toEqual(["satisfactory", null, "excellent", null]);
    expect(seen[0].grade?.count).toBe(3);
  });

  test("controlled: preventDefault() keeps the pick; a grade going away clears it", async () => {
    const el = await make();
    el.selected = "outstanding";
    await settle();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    pick(el, "excellent").click();
    await settle();
    expect(el.selected).toBe("outstanding");
    el.grades = GRADES.slice(1);
    await settle();
    expect(el.selected).toBeNull();
  });

  test("React wrapper: uncontrolled picks survive re-renders; a controlled pick waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(GradeDistribution, { title: "Paper grades", grades: GRADES, selectable: true, onSelectedChange: (s, g) => void seen.push([s, g?.count]), "data-n": n } as React.ComponentProps<typeof GradeDistribution>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-grade-distribution")!;
    expect(el.querySelector(".ui-grd__heading")!.textContent).toBe("Paper grades");
    pick(el, "satisfactory").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("satisfactory");
    expect(seen).toEqual([["satisfactory", 3]]);
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(GradeDistribution, { grades: GRADES, selectable: true, selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    // A different component at the root: the element is a new one
    const controlled = host.querySelector("tc-grade-distribution")!;
    pick(controlled, "outstanding").click();
    await settle();
    expect(asked).toEqual(["outstanding"]);
    expect(controlled.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-grade-distribution heading="Paper grades" .grades=${GRADES} bar selectable .selected=${"satisfactory"}></tc-grade-distribution>
        <tc-grade-distribution look="clean" heading="Paper grades" .grades=${GRADES} bar></tc-grade-distribution>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
