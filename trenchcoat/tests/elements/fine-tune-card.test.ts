/*
 * <tc-fine-tune-card> in real browsers: fields and the preview, the person's edits by typing, keys, scrubbing and
 * swatches, the agent's changes with their markers and the revert, controlled use, Adjust, narrow width, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/fine-tune-card";
import type { FineTuneSection, FineTuneValues, FineTuneValuesChange, TcFineTuneCard } from "../../src/elements/fine-tune-card";
import { FineTuneCard } from "../../src/elements/react/fine-tune-card";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SECTIONS: FineTuneSection[] = [
  {
    label: "Layout",
    fields: [
      { id: "w", label: "W", name: "Width", kind: "number", unit: "px", min: 120, max: 640 },
      { id: "h", label: "H", name: "Height", kind: "number", unit: "px", min: 80, max: 480 },
      { id: "radius", label: "R", name: "Radius", kind: "number", unit: "px", min: 0, max: 32 },
      { id: "opacity", label: "O", name: "Opacity", kind: "percent" },
    ],
  },
  {
    label: "Type",
    fields: [
      { id: "type", label: "Aa", name: "Text style", kind: "select", options: [{ value: "Heading", label: "Heading" }, { value: "Body", label: "Body" }] },
      { id: "fill", label: "Fill", kind: "color", options: [{ value: "#ffffff", label: "Surface" }, { value: "#eef4ff", label: "Blue tint" }, { value: "#eefaf2", label: "Green tint" }] },
    ],
  },
];
const START: FineTuneValues = { w: 320, h: 180, radius: 8, opacity: 100, type: "Body", fill: "#ffffff" };

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcFineTuneCard>(html`<tc-fine-tune-card look=${look} heading="Findings summary" .sections=${SECTIONS} .values=${{ ...START }}></tc-fine-tune-card>`);
const field = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-field="${id}"]`)!;
const input = (el: Element, id: string) => field(el, id).querySelector<HTMLInputElement>("input")!;
const scrub = (el: Element, id: string) => field(el, id).querySelector<HTMLElement>(".ui-ftc__scrub")!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const changes = (el: Element) => {
  const seen: FineTuneValuesChange[] = [];
  el.addEventListener("tc-values-change", (e) => seen.push((e as CustomEvent<FineTuneValuesChange>).detail));
  return seen;
};

describe("tc-fine-tune-card", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: sections of named fields, a preview that follows them, and Adjust`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("ftc");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll("legend")].map((l) => l.textContent)).toEqual(["Layout", "Type"]);
      expect(input(el, "w").value).toBe("320");
      expect(input(el, "w").getAttribute("aria-label")).toBe("Width (px)");
      expect(scrub(el, "w").getAttribute("role")).toBe("slider");
      expect(scrub(el, "w").getAttribute("aria-valuetext")).toBe("320 px");
      expect(scrub(el, "opacity").getAttribute("aria-valuetext")).toBe("100%");
      expect(scrub(el, "opacity").getAttribute("aria-valuemax")).toBe("100");
      expect(field(el, "type").querySelector("select")!.value).toBe("Body");
      expect(field(el, "fill").querySelector('[role="radiogroup"]')).not.toBeNull();
      const shape = el.querySelector<HTMLElement>(".ui-ftc__shape")!;
      expect(shape.style.width).toBe("171px"); // 320 × 180 drawn into 220 × 96
      expect(shape.style.height).toBe("96px");
      expect(el.querySelector(".ui-ftc__preview")!.getAttribute("aria-hidden")).toBe("true");
      expect(el.querySelector(".ui-ftc__adjust")!.textContent!.trim()).toBe("Adjust");
    });
  }

  test("typing commits on Enter or leaving, clamped to the range; Escape puts it back", async () => {
    const el = await make();
    const seen = changes(el);
    const w = input(el, "w");
    w.value = "400";
    key(w, "Enter");
    await el.updateComplete;
    expect(el.values.w).toBe(400);
    expect(seen[0]).toMatchObject({ field: "w", source: "person" });
    w.value = "9999";
    w.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el.values.w).toBe(640);
    expect(w.value).toBe("640");
    w.value = "200";
    key(w, "Escape");
    expect(w.value).toBe("640");
    expect(el.values.w).toBe(640);
  });

  test("arrows step the box and the scrub handle, Shift ×10; Home and End go to the ends", async () => {
    const el = await make();
    key(input(el, "radius"), "ArrowUp");
    await el.updateComplete;
    expect(el.values.radius).toBe(9);
    key(scrub(el, "radius"), "ArrowRight", { shiftKey: true });
    await el.updateComplete;
    expect(el.values.radius).toBe(19);
    key(scrub(el, "radius"), "ArrowDown");
    await el.updateComplete;
    expect(el.values.radius).toBe(18);
    key(scrub(el, "radius"), "End");
    await el.updateComplete;
    expect(el.values.radius).toBe(32);
    expect(scrub(el, "radius").getAttribute("aria-valuenow")).toBe("32");
    key(scrub(el, "radius"), "Home");
    await el.updateComplete;
    expect(el.values.radius).toBe(0);
  });

  test("dragging the scrub handle changes the number, two pixels a step", async () => {
    const el = await make();
    const handle = scrub(el, "h");
    const at = handle.getBoundingClientRect();
    const p = (type: string, x: number) => handle.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: at.top + 4, pointerId: 1, button: 0 }));
    p("pointerdown", at.left);
    p("pointermove", at.left + 20);
    await el.updateComplete;
    expect(el.values.h).toBe(190);
    p("pointermove", at.left - 10);
    await el.updateComplete;
    expect(el.values.h).toBe(175);
    p("pointerup", at.left - 10);
    p("pointermove", at.left + 100);
    await el.updateComplete;
    expect(el.values.h).toBe(175);
  });

  test("the select and the swatches change their fields; the swatches are one tab stop with arrows", async () => {
    const el = await make();
    const select = field(el, "type").querySelector("select")!;
    select.value = "Heading";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el.values.type).toBe("Heading");
    expect(el.querySelector(".ui-ftc__shape")!.getAttribute("data-type")).toBe("Heading");
    const swatches = [...field(el, "fill").querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(swatches.map((s) => s.tabIndex)).toEqual([0, -1, -1]);
    swatches[0].focus();
    key(swatches[0], "ArrowRight");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.value).toBe("#eef4ff");
    expect(el.values.fill).toBe("#eef4ff");
    expect(swatches[1].getAttribute("aria-checked")).toBe("true");
    key(document.activeElement!, "ArrowLeft");
    key(document.activeElement!, "ArrowLeft");
    await expect.poll(() => el.values.fill).toBe("#eefaf2");
    swatches[1].click();
    await el.updateComplete;
    expect(el.values.fill).toBe("#eef4ff");
  });

  test("the agent's changes count in, flash and stay marked until the person edits; Revert puts them back", async () => {
    const el = await make();
    const seen = changes(el);
    el.agentChanges = [
      { field: "w", to: 360 },
      { field: "type", to: "Heading" },
      { field: "radius", to: 8 }, // already 8: nothing to change
    ];
    await expect.poll(() => el.values.w).toBe(360);
    expect(seen).toEqual([{ values: { ...START, w: 360, type: "Heading" }, field: null, source: "agent" }]);
    await settle();
    expect(field(el, "w").hasAttribute("data-agent")).toBe(true);
    expect(field(el, "w").querySelector(".ui-ftc__agent")!.textContent).toBe("Agent");
    expect(field(el, "type").hasAttribute("data-agent")).toBe(true);
    expect(field(el, "radius").hasAttribute("data-agent")).toBe(false);
    await expect.poll(() => input(el, "w").value).toBe("360");
    expect(el.querySelector(".ui-ftc__revert")!.textContent).toBe("Revert agent changes (2)");
    // The person takes over the width
    key(input(el, "w"), "ArrowUp");
    await el.updateComplete;
    expect(field(el, "w").hasAttribute("data-agent")).toBe(false);
    expect(el.querySelector(".ui-ftc__revert")!.textContent).toBe("Revert agent changes (1)");
    el.querySelector<HTMLElement>(".ui-ftc__revert")!.click();
    await el.updateComplete;
    expect(el.values.type).toBe("Body");
    expect(el.values.w).toBe(361);
    expect(seen[seen.length - 1]).toMatchObject({ field: null, source: "revert" });
    expect(el.querySelector(".ui-ftc__revert")).toBeNull();
  });

  test("applyAgentChange marks one field; preventDefault keeps the values and leaves no marker", async () => {
    const el = await make();
    el.addEventListener("tc-values-change", (e) => e.preventDefault(), { once: true });
    el.applyAgentChange("opacity", 80);
    await el.updateComplete;
    expect(el.values.opacity).toBe(100);
    expect(field(el, "opacity").hasAttribute("data-agent")).toBe(false);
    el.applyAgentChange("opacity", 80);
    await el.updateComplete;
    expect(el.values.opacity).toBe(80);
    expect(field(el, "opacity").hasAttribute("data-agent")).toBe(true);
    await expect.poll(() => el.querySelector<HTMLElement>(".ui-ftc__shape")!.style.opacity).toBe("0.8");
  });

  test("Adjust asks the agent, and waits while adjusting", async () => {
    const el = await make();
    const asked: unknown[] = [];
    el.addEventListener("tc-adjust-request", (e) => asked.push((e as CustomEvent).detail));
    el.querySelector<HTMLElement>(".ui-ftc__adjust")!.click();
    expect(asked).toEqual([{ heading: "Findings summary" }]);
    el.adjusting = true;
    await el.updateComplete;
    const btn = el.querySelector<HTMLElement>(".ui-ftc__adjust")!;
    expect(btn.textContent!.trim()).toBe("Adjusting…");
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    expect(el.querySelector('.ui-ftc__card > [role="status"]')!.textContent).toBe("Adjusting…");
    btn.click();
    expect(asked).toHaveLength(1);
  });

  test("narrow: one field to a row, and nothing overflows", async () => {
    const el = await make();
    el.style.width = "280px";
    await settle();
    const w = field(el, "w").getBoundingClientRect();
    const h = field(el, "h").getBoundingClientRect();
    expect(h.top).toBeGreaterThanOrEqual(w.bottom);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
  });

  test("React: uncontrolled keeps edits across re-renders, controlled waits for the parent; agent changes arrive whole", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof FineTuneCard>>) =>
      act(async () => root.render(React.createElement(FineTuneCard, { sections: SECTIONS, ...props })));
    await render({ defaultValues: START });
    // Switching between the card and a parent component remounts it, so look it up each time
    let el = wrap.querySelector<TcFineTuneCard>("tc-fine-tune-card")!;
    await settle(wrap);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Fine-tune");
    await act(async () => void key(input(el, "w"), "ArrowUp"));
    await render({ defaultValues: START, description: "Again" });
    await settle(wrap);
    expect(el.values.w).toBe(321);

    function Parent() {
      const [values, setValues] = React.useState<FineTuneValues>(START);
      return React.createElement(FineTuneCard, { sections: SECTIONS, values, agentChanges: [{ field: "w", to: 360 }, { field: "h", to: 200 }], onValuesChange: setValues });
    }
    await act(async () => root.render(React.createElement(Parent)));
    el = wrap.querySelector<TcFineTuneCard>("tc-fine-tune-card")!;
    await settle(wrap);
    await expect.poll(() => [el.values.w, el.values.h]).toEqual([360, 200]);
    await settle(wrap);
    expect(field(el, "w").hasAttribute("data-agent")).toBe(true);
    expect(field(el, "h").hasAttribute("data-agent")).toBe(true);

    const seen: FineTuneValues[] = [];
    await render({ values: START, onValuesChange: (v) => void seen.push(v) });
    el = wrap.querySelector<TcFineTuneCard>("tc-fine-tune-card")!;
    await settle(wrap);
    await act(async () => void key(input(el, "w"), "ArrowUp"));
    await settle(wrap);
    expect(seen.map((v) => v.w)).toEqual([321]);
    expect(el.values.w).toBe(320);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with agent markers and the revert`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `<tc-fine-tune-card look="standard" heading="Findings summary"></tc-fine-tune-card><tc-fine-tune-card look="clean" heading="Findings summary" adjusting></tc-fine-tune-card>`;
      const els = [...wrap.querySelectorAll<TcFineTuneCard>("tc-fine-tune-card")];
      els.forEach((el) => {
        el.sections = SECTIONS;
        el.values = { ...START };
      });
      await settle(wrap);
      els.forEach((el) => (el.agentChanges = [{ field: "w", to: 360 }, { field: "fill", to: "#eef4ff" }]));
      await expect.poll(() => els.every((el) => el.querySelector(".ui-ftc__revert"))).toBe(true);
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
