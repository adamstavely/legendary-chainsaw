/*
 * <tc-facet-sidebar> in real browsers: checkboxes, radios, range sliders and fields, dates, chips with Clear all,
 * folding, Show more and a facet's search, zero counts, controlled use, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/facet-sidebar";
import { facetActive, type Facet, type FacetValueChange, type FacetValues, type TcFacetSidebar } from "../../src/elements/facet-sidebar";
import { FacetSidebar } from "../../src/elements/react/facet-sidebar";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PROGRAMMES = ["Coral", "Kelp", "Seagrass", "Plankton", "Mangrove", "Sensors", "Plastics", "Tidal", "Fisheries"];
const FACETS: Facet[] = [
  { id: "kind", label: "Kind", type: "checkbox", options: [{ value: "doc", label: "Documents", count: 12 }, { value: "note", label: "Lab notes", count: 4 }, { value: "image", label: "Images", count: 0 }] },
  { id: "prog", label: "Programme", type: "checkbox", options: PROGRAMMES.map((p, i) => ({ value: p.toLowerCase(), label: p, count: i + 1 })) },
  { id: "access", label: "Access", type: "radio", options: [{ value: "open", label: "Open", count: 9 }, { value: "staff", label: "Staff", count: 3 }] },
  { id: "pages", label: "Length", type: "range", min: 0, max: 100, step: 5, unit: "pages" },
  { id: "when", label: "Updated", type: "date" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const facet = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-facet="${id}"]`)!;
const option = (el: Element, id: string, label: string) => [...facet(el, id).querySelectorAll<HTMLLabelElement>(".ui-fct__option-label")].find((l) => text(l.querySelector(".ui-fct__option-text")) === label)!;
const chips = (el: Element) => [...el.querySelectorAll(".ui-fct__chip > span")].map(text);
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (look = "standard", value: FacetValues = {}) => fixture<TcFacetSidebar>(html`<tc-facet-sidebar look=${look} .facets=${FACETS} .value=${value}></tc-facet-sidebar>`);

describe("tc-facet-sidebar", () => {
  test("facetActive: what narrows", () => {
    expect(facetActive(FACETS[0], ["doc"])).toBe(true);
    expect(facetActive(FACETS[0], [])).toBe(false);
    expect(facetActive(FACETS[3], [0, 100])).toBe(false);
    expect(facetActive(FACETS[3], [5, 100])).toBe(true);
    expect(facetActive(FACETS[4], { to: "2026-01-01" })).toBe(true);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: facets with counts, a group per facet, zero counts dimmed`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("fct");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll(".ui-fct__toggle")].map((b) => [text(b), b.getAttribute("aria-expanded")])).toEqual([
        ["Kind", "true"],
        ["Programme", "true"],
        ["Access", "true"],
        ["Length", "true"],
        ["Updated", "true"],
      ]);
      expect(facet(el, "kind").querySelector('[role="group"]')!.getAttribute("aria-label")).toBe("Kind");
      expect(facet(el, "access").querySelector('[role="radiogroup"]')).not.toBeNull();
      const img = option(el, "kind", "Images");
      expect(img.closest(".ui-fct__option")!.hasAttribute("data-empty")).toBe(true);
      expect(img.querySelector("input")!.disabled).toBe(false);
      expect(el.querySelector(".ui-fct__chips")).toBeNull();
    });
  }

  test("checkbox and radio: chips appear, Clear all; a picked radio clicked again goes back to any", async () => {
    const el = await make();
    const seen: FacetValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<FacetValueChange>).detail));
    option(el, "kind", "Documents").querySelector("input")!.click();
    option(el, "access", "Staff").querySelector("input")!.click();
    await settle();
    expect(el.value).toEqual({ kind: ["doc"], access: ["staff"] });
    expect(chips(el)).toEqual(["Documents", "Staff"]);
    expect(text(facet(el, "kind").querySelector(".ui-fct__badge"))).toBe("1 in use");
    option(el, "access", "Staff").querySelector("input")!.click();
    await settle();
    expect(el.value).toEqual({ kind: ["doc"] });
    el.querySelector<HTMLButtonElement>(".ui-fct__clear")!.click();
    await settle();
    expect(el.value).toEqual({});
    expect(seen.map((s) => s.facet)).toEqual(["kind", "access", "access", ""]);
  });

  test("a chip's × removes it and focus moves on; prevented, the value stays", async () => {
    const el = await make("standard", { kind: ["doc", "note"] });
    el.querySelectorAll<HTMLButtonElement>(".ui-fct__chip-x")[0].click();
    await settle();
    expect(el.value).toEqual({ kind: ["note"] });
    expect(document.activeElement).toBe(el.querySelector(".ui-fct__chip-x"));
    el.addEventListener("tc-value-change", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>(".ui-fct__chip-x")!.click();
    await settle();
    expect(el.value).toEqual({ kind: ["note"] });
  });

  test("long facets: five shown, Show more, and a search box past eight", async () => {
    const el = await make();
    const prog = facet(el, "prog");
    expect(prog.querySelectorAll(".ui-fct__option")).toHaveLength(5);
    expect(prog.querySelector(".ui-fct__search-input")).not.toBeNull();
    const more = prog.querySelector<HTMLButtonElement>(".ui-fct__more")!;
    expect(text(more)).toBe("Show 4 more");
    more.click();
    await settle();
    expect(prog.querySelectorAll(".ui-fct__option")).toHaveLength(9);
    expect(text(prog.querySelector(".ui-fct__more"))).toBe("Show less");
    const search = prog.querySelector<HTMLInputElement>(".ui-fct__search-input")!;
    search.value = "tid";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect([...prog.querySelectorAll(".ui-fct__option-text")].map(text)).toEqual(["Tidal"]);
  });

  test("range: sliders step with the keys and the fields commit; dates set from and to", async () => {
    const el = await make();
    const [lo, hi] = facet(el, "pages").querySelectorAll<HTMLElement>('[role="slider"]');
    expect(lo.getAttribute("aria-valuetext")).toBe("0 pages");
    key(lo, "ArrowRight");
    await settle();
    expect(el.value.pages).toEqual([5, 100]);
    key(lo, "ArrowRight", { shiftKey: true });
    await settle();
    expect(el.value.pages).toEqual([55, 100]);
    key(hi, "Home");
    await settle();
    expect(el.value.pages).toEqual([55, 55]);
    const fields = facet(el, "pages").querySelectorAll<HTMLInputElement>('input[type="number"]');
    fields[1].value = "80";
    fields[1].dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.pages).toEqual([55, 80]);
    expect(chips(el)).toEqual(["Length: 55–80 pages"]);
    const [from] = facet(el, "when").querySelectorAll<HTMLInputElement>('input[type="date"]');
    from.value = "2026-01-01";
    from.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.when).toEqual({ from: "2026-01-01" });
    expect(chips(el)).toContain("Updated: from 2026-01-01");
  });

  test("range fields: emptied goes back to its end; a value that changes nothing is put back; dates past each other swap", async () => {
    const el = await make("standard", { pages: [20, 80] });
    const fields = facet(el, "pages").querySelectorAll<HTMLInputElement>('input[type="number"]');
    const commit = async (f: HTMLInputElement, v: string) => {
      f.value = v;
      f.dispatchEvent(new Event("change", { bubbles: true }));
      await settle();
    };
    // Emptying To goes back to the top of the range, not to 0
    await commit(fields[1], "");
    expect(el.value.pages).toEqual([20, 100]);
    expect(fields[1].value).toBe("100");
    // 150 clamps to 100, which is where it already is: the field shows 100 again
    await commit(fields[1], "150");
    expect(el.value.pages).toEqual([20, 100]);
    expect(fields[1].value).toBe("100");
    await commit(fields[0], "");
    expect(el.value.pages).toBeUndefined();
    const [from, to] = facet(el, "when").querySelectorAll<HTMLInputElement>('input[type="date"]');
    await commit(to, "2026-04-01");
    await commit(from, "2026-05-01");
    expect(el.value.when).toEqual({ from: "2026-04-01", to: "2026-05-01" });
  });

  test("a range without min / max is in use only off 0–100, as it's drawn", () => {
    const f: Facet = { id: "size", label: "Size", type: "range" };
    expect(facetActive(f, [0, 100])).toBe(false);
    expect(facetActive(f, [10, 100])).toBe(true);
  });

  test("controlled: after a chip's × or Clear all, focus moves on once the page applies the change", async () => {
    const el = await make("standard", { kind: ["doc", "note"] });
    el.addEventListener("tc-value-change", (e) => {
      e.preventDefault();
      el.value = (e as CustomEvent<FacetValueChange>).detail.value;
    });
    el.querySelectorAll<HTMLButtonElement>(".ui-fct__chip-x")[0].focus();
    el.querySelectorAll<HTMLButtonElement>(".ui-fct__chip-x")[0].click();
    await settle();
    expect(chips(el)).toEqual(["Lab notes"]);
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-fct__chip-x"));
    el.querySelector<HTMLButtonElement>(".ui-fct__clear")!.click();
    await settle();
    expect(chips(el)).toEqual([]);
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-fct__toggle"));
  });

  test("fold: tc-collapsed-change; prevented, it stays open", async () => {
    const el = await make();
    facet(el, "kind").querySelector<HTMLButtonElement>(".ui-fct__toggle")!.click();
    await settle();
    expect(el.collapsed).toEqual(["kind"]);
    expect(facet(el, "kind").querySelector(".ui-fct__body")).toBeNull();
    el.addEventListener("tc-collapsed-change", (e) => e.preventDefault(), { once: true });
    facet(el, "prog").querySelector<HTMLButtonElement>(".ui-fct__toggle")!.click();
    await settle();
    expect(el.collapsed).toEqual(["kind"]);
  });

  test("React wrapper: uncontrolled value survives re-renders; controlled value stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const values: FacetValues[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(FacetSidebar, { facets: FACETS, onValueChange: (v) => void values.push(v), "data-n": n } as React.ComponentProps<typeof FacetSidebar>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-facet-sidebar")!;
    option(el, "kind", "Documents").querySelector("input")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.value).toEqual({ kind: ["doc"] });
    expect(values).toEqual([{ kind: ["doc"] }]);
    await act(async () => root.render(React.createElement(FacetSidebar, { facets: FACETS, value: {} })));
    await settle();
    const held = host.querySelector("tc-facet-sidebar")!;
    option(held, "kind", "Documents").querySelector("input")!.click();
    await settle();
    expect(held.value).toEqual({});
    expect(option(held, "kind", "Documents").querySelector("input")!.checked).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); width: 300px">
        <tc-facet-sidebar .facets=${FACETS} .value=${{ kind: ["doc"], pages: [10, 60] }}></tc-facet-sidebar>
        <tc-facet-sidebar look="clean" .facets=${FACETS} .collapsed=${["prog"]}></tc-facet-sidebar>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
