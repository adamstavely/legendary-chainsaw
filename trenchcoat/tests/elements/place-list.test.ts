/*
 * <tc-place-list> in real browsers: types with icons, statuses in words, addresses, coordinates and periods, picking
 * a place, the listbox keyboard, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/place-list";
import type { PlaceRecord, PlaceSelectedChange, TcPlaceList } from "../../src/elements/place-list";
import { PlaceList } from "../../src/elements/react/place-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PLACES: PlaceRecord[] = [
  { id: "hq", name: "Registered office", type: "work", status: "confirmed", address: "14 Harbour Row, Leith", coords: [55.97634, -3.17221], since: new Date(2021, 5, 1).getTime() },
  { id: "wh", name: "Warehouse 7", type: "frequent", status: "unverified", address: "Unit 7, Grangemouth", span: "Deliveries 2025 –" },
  { id: "old", type: "former", status: "vacated", address: "9 Marylebone Lane, London", since: new Date(2017, 1, 1).getTime(), until: new Date(2020, 10, 1).getTime() },
  { id: "x", type: "warehouse-b", address: "Somewhere" },
];

const opt = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-place="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") => fixture<TcPlaceList>(html`<tc-place-list look=${look} description="A review." .places=${PLACES}></tc-place-list>`);
const month = (y: number, m: number) => new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(y, m - 1, 1));

describe("tc-place-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a listbox of places with type, status, address, coordinates and period`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("plc");
      expect(el.dataset.look).toBe(look);
      const box = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(box.getAttribute("aria-labelledby")!)!.textContent).toBe("Places");
      expect(box.querySelectorAll('[role="option"]')).toHaveLength(4);
      const hq = opt(el, "hq");
      expect(hq.querySelector(".ui-plc__name")!.textContent).toBe("Registered office");
      expect(hq.querySelector(".ui-plc__type")!.textContent).toBe("Work");
      expect(hq.querySelector(".ui-plc__status")!.textContent).toBe("Confirmed");
      expect(hq.querySelector(".ui-plc__coords")!.textContent).toBe("Coordinates 55.9763, -3.1722");
      expect(hq.querySelector(".ui-plc__span")!.textContent).toBe(`${month(2021, 6)} –`);
      expect(opt(el, "wh").querySelector(".ui-plc__span")!.textContent).toBe("Deliveries 2025 –");
      expect(opt(el, "old").querySelector(".ui-plc__name")!.textContent).toBe("Former");
      expect(opt(el, "old").querySelector(".ui-plc__span")!.textContent).toBe(`${month(2017, 2)} – ${month(2020, 11)}`);
      // An unknown type reads as its key, with the pin icon and no status
      expect(opt(el, "x").querySelector(".ui-plc__name")!.textContent).toBe("Warehouse-b");
      expect(opt(el, "x").querySelector(".ui-plc__status")).toBeNull();
      expect(el.querySelector(".ui-plc__count")!.textContent).toBe("4 places");
      expect(box.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      el.coordinates = false;
      await settle();
      expect(el.querySelector(".ui-plc__coords")).toBeNull();
    });
  }

  test("picking: a click selects, again clears; tc-selected-change carries the place; cancelable", async () => {
    const el = await make();
    const seen: [string | null, string | undefined][] = [];
    el.addEventListener("tc-selected-change", (e) => {
      const d = (e as CustomEvent<PlaceSelectedChange>).detail;
      seen.push([d.selected, d.place?.address]);
    });
    opt(el, "wh").click();
    await settle();
    expect(opt(el, "wh").getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Warehouse 7 selected");
    opt(el, "wh").click();
    await settle();
    expect(el.selected).toBeNull();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
    opt(el, "hq").click();
    await settle();
    expect(el.selected).toBeNull();
    expect(seen).toEqual([
      ["wh", "Unit 7, Grangemouth"],
      [null, undefined],
      ["hq", "14 Harbour Row, Leith"],
    ]);
  });

  test("keyboard: ↑ ↓ Home End move; Enter or Space picks; Escape clears; the tab stop follows the pick", async () => {
    const el = await make();
    opt(el, "hq").focus();
    const at = () => document.activeElement?.getAttribute("data-place");
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('[role="option"][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowDown");
    expect(at()).toBe("wh");
    await press("End");
    expect(at()).toBe("x");
    await press("Home");
    expect(at()).toBe("hq");
    await press("ArrowDown");
    await press(" ");
    expect(el.selected).toBe("wh");
    await press("Escape");
    expect(el.selected).toBeNull();
    const picked = await fixture<TcPlaceList>(html`<tc-place-list .places=${PLACES} .selected=${"old"}></tc-place-list>`);
    expect(opt(picked, "old").getAttribute("tabindex")).toBe("0");
    picked.places = PLACES.slice(0, 2);
    await settle();
    expect(picked.selected).toBeNull();
  });

  test("React wrapper: uncontrolled survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(PlaceList, { title: "Sites", places: PLACES, onSelectedChange: (s, p) => void seen.push([s, p?.name]), "data-n": n } as React.ComponentProps<typeof PlaceList>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-place-list")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Sites");
    opt(el, "hq").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("hq");
    expect(seen).toEqual([["hq", "Registered office"]]);
    await act(async () => root.unmount());
    // Controlled: a pick is reported, not applied
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(PlaceList, { places: PLACES, selected: null, onSelectedChange: (s) => void seen.push(s) })));
    await settle();
    const el2 = host2.querySelector("tc-place-list")!;
    opt(el2, "wh").click();
    await settle();
    expect(el2.selected).toBeNull();
    expect(seen.at(-1)).toBe("wh");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-place-list description="A review." .places=${PLACES} .selected=${"wh"}></tc-place-list>
        <tc-place-list look="clean" .places=${PLACES}></tc-place-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
