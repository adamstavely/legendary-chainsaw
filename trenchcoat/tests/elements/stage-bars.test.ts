/*
 * <tc-stage-bars> in real browsers: the looks and the listbox, the shares and widths, the headline following the
 * pointer and the keys, picking a stage (and preventing it), the period switch, the table view, empty and narrow, the
 * entrance, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/stage-bars";
import type { StageBarsRange, StageBarsStage, TcStageBars } from "../../src/elements/stage-bars";
import { StageBars } from "../../src/elements/react/stage-bars";
import { cleanup, finish, fixture, parkPointer, settle } from "./helpers";

afterEach(cleanup);

const STAGES: StageBarsStage[] = [
  { label: "Flagged", value: 1000, icon: "M4 15V3" },
  { label: "Triaged", value: 600 },
  { label: "Investigated", value: 250 },
  { label: "Closed", value: 40 },
];
const RANGES: StageBarsRange[] = [
  { id: "7d", label: "7 days", delta: 2.4, stages: STAGES },
  { id: "30d", label: "30 days", delta: -3.1, stages: STAGES.map((s) => ({ ...s, value: s.value * 4 })) },
];

const make = (o: { look?: "standard" | "clean"; width?: number; ranges?: StageBarsRange[]; stages?: StageBarsStage[]; still?: boolean } = {}) =>
  fixture<HTMLElement>(
    html`<div style=${`width: ${o.width ?? 520}px`}><tc-stage-bars look=${o.look ?? "standard"} heading="Case pipeline" delta="2.4" ?still=${o.still ?? true} .stages=${o.stages ?? STAGES} .ranges=${o.ranges}></tc-stage-bars></div>`,
  ).then((w) => w.querySelector<TcStageBars>("tc-stage-bars")!);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-stgb__row")];
const pillWidth = (el: Element, i: number) => rows(el)[i].querySelector<HTMLElement>(".ui-stgb__pill")!.getBoundingClientRect().width;
const trackWidth = (el: Element, i: number) => rows(el)[i].querySelector<HTMLElement>(".ui-stgb__track")!.getBoundingClientRect().width;
const big = (el: Element) => el.querySelector(".ui-stgb__big")!.textContent!.replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-stage-bars", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, a listbox named by the heading, one tab stop`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("stgb");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Case pipeline");
      expect(rows(el).map((r) => r.getAttribute("role"))).toEqual(["option", "option", "option", "option"]);
      expect(rows(el).map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
      expect(el.querySelector(".ui-stgb__tiles")!.getAttribute("aria-hidden")).toBe("true");
    });
  }

  test("shares of the first stage, pill widths in proportion, counts and the change chip", async () => {
    const el = await make();
    expect([...el.querySelectorAll(".ui-stgb__share")].map((s) => s.textContent!.replace(/\s+/g, " ").trim())).toEqual([
      ", 100% of first stage",
      ", 60% of first stage",
      ", 25% of first stage",
      ", 4% of first stage",
    ]);
    expect(pillWidth(el, 0)).toBeCloseTo(trackWidth(el, 0), 0);
    expect(pillWidth(el, 1) / trackWidth(el, 1)).toBeCloseTo(0.6, 2);
    expect(big(el)).toBe("Flagged: 1,000");
    expect(el.querySelector(".ui-stgb__delta")!.textContent!.replace(/\s+/g, " ").trim()).toBe("up 2.4%");
    expect(el.querySelectorAll(".ui-stgb__icon")).toHaveLength(1);
    expect([...el.querySelectorAll(".ui-stgb__tile-value")].map((t) => t.textContent)).toEqual(["1,000", "600", "250", "40"]);
    el.showIcons = false;
    el.mono = true;
    await settle();
    expect(el.querySelectorAll(".ui-stgb__icon")).toHaveLength(0);
    expect(rows(el)[2].style.getPropertyValue("--tc-stgb-ink")).toBe("var(--tc-stgb-mono)");
  });

  test("pointing at a stage brings it forward and rolls the headline to it; leaving goes back", async () => {
    const el = await make();
    await userEvent.hover(rows(el)[2]);
    await expect.poll(() => big(el)).toBe("Investigated: 250");
    expect(rows(el)[2].hasAttribute("data-on")).toBe(true);
    expect(el.querySelector(".ui-stgb__list")!.hasAttribute("data-active")).toBe(true);
    expect(el.querySelector(".ui-stgb__delta")).toBeNull();
    expect(el.querySelector(".ui-stgb__caption")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Investigated · 25%");
    await parkPointer();
    await expect.poll(() => big(el)).toBe("Flagged: 1,000");
  });

  test("keys move the tab stop, Enter picks a stage and Escape lets it go; prevented, it stays", async () => {
    const el = await make();
    const list = el.querySelector(".ui-stgb__list")!;
    rows(el)[0].focus();
    key(list, "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(rows(el)[1]);
    expect(rows(el).map((r) => r.tabIndex)).toEqual([-1, 0, -1, -1]);
    key(list, "End");
    await settle();
    expect(document.activeElement).toBe(rows(el)[3]);
    const seen: (number | null)[] = [];
    el.addEventListener("tc-stage-change", (e) => seen.push((e as CustomEvent).detail.stage));
    key(list, "Enter");
    await settle();
    expect(el.stage).toBe(3);
    expect(rows(el)[3].getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Selected Closed");
    key(list, "Escape");
    await settle();
    expect(el.stage).toBeNull();
    expect(seen).toEqual([3, null]);
    el.addEventListener("tc-stage-change", (e) => e.preventDefault());
    rows(el)[1].click();
    await settle();
    expect(el.stage).toBeNull();
  });

  test("the period switch swaps the stages and the change; prevented, the range stays", async () => {
    const el = await make({ ranges: RANGES });
    const radios = () => [...el.querySelectorAll<HTMLButtonElement>('.ui-stgb__range [role="radio"]')];
    expect(el.querySelector('.ui-stgb__range')!.getAttribute("aria-label")).toBe("Period");
    expect(radios().map((r) => r.getAttribute("aria-checked"))).toEqual(["true", "false"]);
    const picked: string[] = [];
    el.addEventListener("tc-range-change", (e) => picked.push((e as CustomEvent).detail.range));
    radios()[1].click();
    await settle();
    expect(picked).toEqual(["30d"]);
    expect(el.range).toBe("30d");
    expect(big(el)).toBe("Flagged: 4,000");
    expect(el.querySelector(".ui-stgb__delta")!.textContent!.replace(/\s+/g, " ").trim()).toBe("down 3.1%");
    radios()[1].focus();
    key(el.querySelector(".ui-stgb__range")!, "ArrowLeft");
    await settle();
    expect(el.range).toBe("7d");
    expect(document.activeElement).toBe(radios()[0]);
    el.addEventListener("tc-range-change", (e) => e.preventDefault());
    radios()[1].click();
    await settle();
    expect(el.range).toBe("7d");
  });

  test("the Table button shows a table of every stage; prevented, the view stays", async () => {
    const el = await make();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-stgb__toggle")!;
    toggle.click();
    await settle();
    expect(el.view).toBe("table");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect([...el.querySelectorAll(".ui-stgb__table tbody tr")].map((r) => r.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Flagged1,000100%", "Triaged60060%", "Investigated25025%", "Closed404%"].map((s) => s));
    expect(el.querySelector(".ui-stgb__list")).toBeNull();
    el.addEventListener("tc-view-change", (e) => e.preventDefault());
    toggle.click();
    await settle();
    expect(el.view).toBe("table");
  });

  test("empty data, a stage that disappears while picked, and the narrow layout", async () => {
    const el = await make({ stages: [] });
    expect(el.querySelector(".ui-stgb__empty")!.textContent).toBe("No stages yet");
    expect(el.querySelector(".ui-stgb__toggle")).toBeNull();
    el.stages = STAGES;
    el.stage = 3;
    await settle();
    expect(big(el)).toBe("Closed: 40");
    el.stages = STAGES.slice(0, 2);
    await settle();
    expect(big(el)).toBe("Flagged: 1,000");
    const narrow = await make({ width: 300 });
    expect(getComputedStyle(narrow.querySelector(".ui-stgb__share")!).display).toBe("none");
    expect(getComputedStyle(narrow.querySelector(".ui-stgb__value")!).display).not.toBe("none");
    expect(getComputedStyle(narrow.querySelector(".ui-stgb__tiles")!).gridTemplateColumns.split(" ")).toHaveLength(2);
  });

  test("the pills grow in once on screen", async () => {
    const el = await make({ still: false });
    await expect.poll(() => pillWidth(el, 1) / trackWidth(el, 1), { timeout: 4000 }).toBeGreaterThan(0.58);
    await expect.poll(() => big(el), { timeout: 4000 }).toBe("Flagged: 1,000");
  });

  test("React: an uncontrolled pick survives re-renders; a controlled range stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "520px";
    const root = createRoot(host);
    const picks: (string | undefined)[] = [];
    const render = (extra: Record<string, unknown> = {}) =>
      act(async () => root.render(React.createElement(StageBars, { title: "Cases", ranges: RANGES, still: true, onStageChange: (_s, item) => picks.push(item?.label), ...extra })));
    await render();
    const el = host.querySelector<TcStageBars>("tc-stage-bars")!;
    await settle();
    expect(el.heading).toBe("Cases");
    expect(el.range).toBe("7d");
    await act(async () => rows(el)[1].click());
    expect(el.stage).toBe(1);
    expect(picks).toEqual(["Triaged"]);
    await render({ description: "re-rendered" });
    expect(el.stage).toBe(1);
    // Controlled: the click asks, the parent doesn't change it, so it stays
    const asked: string[] = [];
    await render({ range: "7d", onRangeChange: (r: string) => asked.push(r) });
    await act(async () => el.querySelectorAll<HTMLButtonElement>('.ui-stgb__range [role="radio"]')[1].click());
    expect(asked).toEqual(["30d"]);
    expect(el.range).toBe("7d");
    await render({ range: "30d" });
    expect(el.range).toBe("30d");
    await act(async () => root.unmount());
    host.remove();
  });

  for (const look of ["standard", "clean"] as const) {
    for (const scheme of ["light", "dark"] as const) {
      test(`axe: ${look}, ${scheme}`, async () => {
        document.documentElement.style.colorScheme = scheme;
        const wrap = await fixture<HTMLElement>(html`<div style="width: 520px; background: var(--tc-surface-raised)">
          <tc-stage-bars look=${look} heading="Case pipeline" delta="2.4" .ranges=${RANGES} .stage=${1}></tc-stage-bars>
        </div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        document.documentElement.style.colorScheme = "";
        expect(violations.map((v) => v.id)).toEqual([]);
      });
    }
  }
});
