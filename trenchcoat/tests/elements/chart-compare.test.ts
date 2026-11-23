/*
 * What Line, Area and Bar Chart gained for dashboards: this period against the last (`compare`), today's bar still
 * filling (`live`), and charts that follow one pointer (`sync`, on every chart) – in real browsers, with axe.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/area-chart";
import "../../src/elements/bar-chart";
import "../../src/elements/line-chart";
import type { TcAreaChart } from "../../src/elements/area-chart";
import type { TcBarChart } from "../../src/elements/bar-chart";
import type { TcLineChart } from "../../src/elements/line-chart";
import { drawn, key, plot } from "./chart-kit";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SPEND = DAYS.map((x, k) => ({ x, y: [320, 410, 380, 435, 470][k], prev: [300, 350, 400, 378, 420][k] }));
const tipRows = (el: Element) =>
  [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => `${r.querySelector(".tc-chart__tip-label")!.textContent!.trim()}: ${r.querySelector(".tc-chart__tip-value")!.textContent}`);
const legend = (el: Element) => [...el.querySelectorAll(".tc-chart__legend .tc-chart__key")].map((k) => k.textContent!.trim());
const describedBy = (el: Element) => document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent!;

describe("compare: this period against the last", () => {
  test("a line chart draws last period dashed behind, names both, and reads the change", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 640px"><tc-line-chart still heading="AI spend" .format=${"integer"} .data=${SPEND} .compare=${"prev"}></tc-line-chart></div>`);
    const el = await drawn(wrap.querySelector<TcLineChart>("tc-line-chart")!);
    const cmp = el.querySelector<SVGPathElement>(".tc-xy__compare")!;
    expect(cmp).not.toBeNull();
    expect(getComputedStyle(cmp).strokeDasharray).not.toBe("none");
    // Drawn before (under) the line
    const group = cmp.parentElement!;
    expect([...group.children].indexOf(cmp)).toBeLessThan([...group.children].indexOf(group.querySelector(".tc-xy__line")!));
    expect(legend(el)).toEqual(["This period", "Last period"]);
    expect(describedBy(el)).toMatch(/compared with last period$/);
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    await settle();
    expect(tipRows(el)).toEqual(["This period: 410 · +17.1%", "Last period: 350"]);
    expect(el.querySelectorAll(".tc-xy__point")).toHaveLength(2);
  });

  test("an area chart takes it too; renamed words show; without `compare` nothing changes", async () => {
    const wrap = await fixture<HTMLElement>(
      html`<div style="width: 640px"><tc-area-chart still heading="Tokens" .data=${SPEND} .compare=${"prev"} compare-label="Previous week" current-label="This week"></tc-area-chart><tc-area-chart still heading="Plain" .data=${SPEND}></tc-area-chart></div>`,
    );
    const [withCmp, plain] = [...wrap.querySelectorAll<TcAreaChart>("tc-area-chart")];
    await drawn(withCmp!);
    await drawn(plain!);
    expect(withCmp!.querySelector(".tc-xy__compare")).not.toBeNull();
    expect(legend(withCmp!)).toEqual(["This week", "Previous week"]);
    expect(plain!.querySelector(".tc-xy__compare")).toBeNull();
    expect(plain!.querySelector(".tc-chart__legend")).toBeNull();
  });

  test("a bar chart marks last period above or across each bar, with the change in the tooltip", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 640px"><tc-bar-chart still heading="Requests" .data=${SPEND} .compare=${"prev"}></tc-bar-chart></div>`);
    const el = await drawn(wrap.querySelector<TcBarChart>("tc-bar-chart")!);
    const marks = [...el.querySelectorAll<SVGElement>(".tc-chart__mark")];
    // Last period higher (only Wednesday, 400 against 380): an open dashed box above the bar, behind it, with the value
    // written above the box. Lower: a dashed line across the bar, over it
    expect(marks.map((m) => (m.querySelector(".ui-brc__prev")!.tagName === "line" ? "across" : "above"))).toEqual(["across", "across", "above", "across", "across"]);
    const wed = marks[2]!;
    const box = wed.querySelector(".ui-brc__prev")!.getBoundingClientRect();
    const label = wed.querySelector(".tc-chart__value")!.getBoundingClientRect();
    expect(label.top + label.height / 2).toBeLessThan(box.top);
    expect([...wed.children].indexOf(wed.querySelector(".ui-brc__prev")!)).toBeLessThan([...wed.children].indexOf(wed.querySelector(".ui-brc__bar")!));
    key(plot(el), "ArrowRight");
    await settle();
    expect(tipRows(el)).toEqual(["Value: 320 · +6.7%", "Last period: 300"]);
  });
});

describe("live: today's bar still filling", () => {
  test("the last bar breathes and reads 'so far', and grows as the page raises it", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 640px"><tc-bar-chart still live heading="API calls" .data=${SPEND}></tc-bar-chart></div>`);
    const el = await drawn(wrap.querySelector<TcBarChart>("tc-bar-chart")!);
    const bars = [...el.querySelectorAll<SVGPathElement>(".ui-brc__bar")];
    expect(bars.map((b) => b.hasAttribute("data-live"))).toEqual([false, false, false, false, true]);
    expect(getComputedStyle(bars[4]!).animationName).not.toBe("none");
    expect(describedBy(el)).toMatch(/Fri 470 so far$/);
    key(plot(el), "End");
    await settle();
    expect(tipRows(el)[0]).toBe("Value: 470 so far");
    const h0 = bars[4]!.getBBox().height;
    el.data = SPEND.map((d, k) => (k === 4 ? { ...d, y: 600 } : d));
    await finish(el);
    expect(el.querySelectorAll<SVGPathElement>(".ui-brc__bar")[4]!.getBBox().height).toBeGreaterThan(h0);
  });
});

describe("sync: charts that follow one pointer", () => {
  test("pointing at a day in one shows that day, with its tooltip, in every chart of the group – and only that group", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 640px">
      <tc-line-chart still sync="usage" heading="Spend" .data=${SPEND}></tc-line-chart>
      <tc-bar-chart still sync="usage" heading="Requests" .data=${SPEND}></tc-bar-chart>
      <tc-line-chart still sync="other" heading="Elsewhere" .data=${SPEND}></tc-line-chart>
    </div>`);
    const [line, bar, other] = [wrap.children[0] as TcLineChart, wrap.children[1] as TcBarChart, wrap.children[2] as TcLineChart];
    await drawn(line);
    await drawn(bar);
    await drawn(other);
    const svg = line.querySelector(".tc-chart__svg")!.getBoundingClientRect();
    plot(line).dispatchEvent(new PointerEvent("pointermove", { clientX: svg.left + svg.width * 0.5, clientY: svg.top + 40, bubbles: true, pointerType: "mouse" }));
    await settle();
    expect(line.querySelector(".tc-chart__tip-title")!.textContent).toBe("Wed");
    expect(bar.querySelector(".tc-chart__tip-title")!.textContent).toBe("Wed");
    expect(other.querySelector(".tc-chart__tip")).toBeNull();
    // The bar chart shows the day without firing events of its own
    let hovered = 0;
    bar.addEventListener("tc-mark-hover", () => hovered++);
    plot(line).dispatchEvent(new PointerEvent("pointermove", { clientX: svg.left + svg.width * 0.98, clientY: svg.top + 40, bubbles: true, pointerType: "mouse" }));
    await settle();
    expect(bar.querySelector(".tc-chart__tip-title")!.textContent).toBe("Fri");
    expect(hovered).toBe(0);
    plot(line).dispatchEvent(new PointerEvent("pointerleave", { bubbles: false, pointerType: "mouse" }));
    await settle();
    expect(line.querySelector(".tc-chart__tip")).toBeNull();
    expect(bar.querySelector(".tc-chart__tip")).toBeNull();
  });

  test("a chart's own keyboard wins over the group", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 640px">
      <tc-line-chart still sync="g" heading="A" .data=${SPEND}></tc-line-chart>
      <tc-line-chart still sync="g" heading="B" .data=${SPEND}></tc-line-chart>
    </div>`);
    const [a, b] = [wrap.children[0] as TcLineChart, wrap.children[1] as TcLineChart];
    await drawn(a);
    await drawn(b);
    key(plot(b), "End");
    await settle();
    key(plot(a), "Home");
    await settle();
    expect(a.querySelector(".tc-chart__tip-title")!.textContent).toBe("Mon");
    expect(b.querySelector(".tc-chart__tip-title")!.textContent).toBe("Fri");
  });
});

describe("accessibility", () => {
  for (const scheme of ["light", "dark"]) {
    test(`no axe violations with a comparison and a live bar, ${scheme}`, async () => {
      const wrap = await fixture<HTMLElement>(
        html`<div style=${`width: 640px; color-scheme: ${scheme}; background: Canvas; color: CanvasText`}>
          <tc-line-chart still heading="AI spend" .data=${SPEND} .compare=${"prev"}></tc-line-chart>
          <tc-bar-chart still live heading="API calls" .data=${SPEND} .compare=${"prev"}></tc-bar-chart>
        </div>`,
      );
      for (const c of wrap.children) await drawn(c);
      await finish(wrap);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
    });
  }
});
