/*
 * <tc-map-itinerary> in real browsers: the days as tabs, each day's stops in order, the map drawn from coordinates,
 * picking a stop on either side, the tabs', list's and markers' keyboards, fitting to the day or the trip, map tiles
 * only on request, the narrow layout, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/map-itinerary";
import { mercator, type ItineraryDay, type ItineraryDayChange, type ItineraryStopSelect, type TcMapItinerary } from "../../src/elements/map-itinerary";
import { MapItinerary } from "../../src/elements/react/map-itinerary";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAYS: ItineraryDay[] = [
  {
    id: "d1",
    label: "Day 1",
    date: new Date(2027, 2, 9).getTime(),
    stops: [
      { id: "hotel", name: "Hotel Avenida", lat: 38.7189, lng: -9.1437, time: "11:00", kind: "stay" },
      { id: "market", name: "Time Out Market", lat: 38.7069, lng: -9.1459, time: "13:00", kind: "food", travel: "15 min walk", duration: "1 h" },
      { id: "square", name: "Praça do Comércio", lat: 38.7075, lng: -9.1364, time: "15:00", kind: "sight", travel: "10 min walk", note: "Meet at the arch" },
    ],
  },
  {
    id: "d2",
    label: "Day 2",
    stops: [
      { id: "tower", name: "Belém Tower", lat: 38.6916, lng: -9.216, time: "10:00", kind: "sight" },
      { id: "abbey", name: "Jerónimos Monastery", lat: 38.6979, lng: -9.2068, kind: "venue-x", travel: "10 min walk" },
      { id: "nowhere", name: "Dinner – to be decided", lat: Number.NaN, lng: Number.NaN, kind: "food" },
    ],
  },
];

const tab = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-day="${id}"]`)!;
const opt = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-mit__stops [data-stop="${id}"]`)!;
const marker = (el: Element, id: string) => el.querySelector<SVGGElement>(`[data-marker="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") => fixture<TcMapItinerary>(html`<tc-map-itinerary look=${look} heading="Lisbon visit" .days=${DAYS}></tc-map-itinerary>`);

describe("tc-map-itinerary", () => {
  test("mercator: the world as 0–1, x east and y south", () => {
    expect(mercator(0, 0)).toEqual([0.5, 0.5]);
    expect(mercator(0, 180)[0]).toBe(1);
    expect(mercator(60, 0)[1]).toBeLessThan(0.5);
    expect(mercator(-60, 0)[1]).toBeGreaterThan(0.5);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: day tabs, the first day's stops in order, and its markers on the map`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("mit");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-mit__count")!.textContent).toBe("2 days · 6 stops");
      const tabs = el.querySelectorAll('[role="tab"]');
      expect(tabs).toHaveLength(2);
      expect(tab(el, "d1").getAttribute("aria-selected")).toBe("true");
      const panel = el.querySelector('[role="tabpanel"]')!;
      expect(panel.getAttribute("aria-labelledby")).toBe(tab(el, "d1").id);
      expect(tab(el, "d1").getAttribute("aria-controls")).toBe(panel.id);
      const box = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(box.getAttribute("aria-labelledby")!)!.textContent).toContain("Day 1");
      expect(box.querySelectorAll('[role="option"]')).toHaveLength(3);
      expect(opt(el, "hotel").querySelector(".ui-mit__stop-name")!.textContent).toBe("1. Hotel Avenida");
      expect(opt(el, "hotel").querySelector(".ui-mit__kind")!.textContent).toBe("Stay");
      expect(opt(el, "hotel").querySelector(".ui-mit__travel")).toBeNull();
      expect(opt(el, "market").querySelector(".ui-mit__travel")!.textContent).toBe("Getting there: 15 min walk");
      expect(opt(el, "market").querySelector(".ui-mit__duration")!.textContent).toBe("1 h");
      expect(opt(el, "square").querySelector(".ui-mit__note")!.textContent).toBe("Meet at the arch");
      // The map: the day's three markers, the other day muted and hidden from screen readers
      const map = el.querySelector('svg[role="group"]')!;
      expect(map.getAttribute("aria-label")).toBe("Map of Day 1");
      expect(map.querySelectorAll(".ui-mit__marker")).toHaveLength(3);
      expect(marker(el, "market").getAttribute("aria-label")).toBe("2. Time Out Market, 13:00");
      expect(map.querySelectorAll(".ui-mit__day--muted .ui-mit__dot")).toHaveLength(2);
      expect(map.querySelector(".ui-mit__day--muted")!.getAttribute("aria-hidden")).toBe("true");
      expect(map.querySelectorAll(".ui-mit__route--current")).toHaveLength(1);
      // One tab stop each: tabs, stops, markers
      expect(el.querySelectorAll('[role="tab"][tabindex="0"]')).toHaveLength(1);
      expect(box.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(map.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      // No tiles and no prompt without tileUrl
      expect(el.querySelector(".ui-mit__tile, .ui-mit__tiles-ask")).toBeNull();
      expect(el.querySelectorAll(".ui-mit__grid line").length).toBeGreaterThan(0);
    });
  }

  test("markers sit where the coordinates say: west is left, north is up", async () => {
    const el = await make();
    const at = (id: string) => {
      const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(marker(el, id).getAttribute("transform")!)!;
      return [+m[1], +m[2]];
    };
    const [hx, hy] = at("hotel");
    const [mx, my] = at("market");
    const [sx] = at("square");
    expect(mx).toBeLessThan(sx); // the market is west of the square
    expect(hy).toBeLessThan(my); // the hotel is north of the market
    expect(hx).toBeGreaterThan(0);
  });

  test("days: a click or ← → chooses one; cancelable; a stop on the day left behind is cleared", async () => {
    const el = await make();
    const days: string[] = [];
    const stops: (string | null)[] = [];
    el.addEventListener("tc-day-change", (e) => days.push((e as CustomEvent<ItineraryDayChange>).detail.day));
    el.addEventListener("tc-stop-select", (e) => stops.push((e as CustomEvent<ItineraryStopSelect>).detail.stop));
    opt(el, "market").click();
    await settle();
    expect(el.stop).toBe("market");
    tab(el, "d2").click();
    await settle();
    expect(el.day).toBe("d2");
    expect(el.stop).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Day 2, 3 stops");
    expect(el.querySelector('svg[role="group"]')!.getAttribute("aria-label")).toBe("Map of Day 2");
    tab(el, "d2").focus();
    key(tab(el, "d2"), "ArrowLeft");
    await expect.poll(() => (document.activeElement as HTMLElement | null)?.dataset.day).toBe("d1");
    expect(el.day).toBe("d1");
    el.addEventListener("tc-day-change", (e) => e.preventDefault(), { once: true });
    key(tab(el, "d1"), "End");
    await settle();
    expect(el.day).toBe("d1");
    expect(days).toEqual(["d2", "d1", "d2"]);
    expect(stops).toEqual(["market", null]);
  });

  test("stops: list and map stay in step; ↑ ↓ Home End, Enter, Escape; the unknown kind and the stop with no location", async () => {
    const el = await make();
    opt(el, "hotel").focus();
    const at = () => (document.activeElement as HTMLElement | null)?.dataset.stop;
    key(opt(el, "hotel"), "ArrowDown");
    await expect.poll(at).toBe("market");
    key(opt(el, "market"), "End");
    await expect.poll(at).toBe("square");
    key(opt(el, "square"), "Enter");
    await settle();
    expect(el.stop).toBe("square");
    expect(opt(el, "square").getAttribute("aria-selected")).toBe("true");
    expect(marker(el, "square").getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Praça do Comércio selected, stop 3 of 3, Day 1");
    // The map's tab stop follows the pick
    expect(marker(el, "square").getAttribute("tabindex")).toBe("0");
    key(opt(el, "square"), "Escape");
    await settle();
    expect(el.stop).toBeNull();
    // A click on a marker picks it in the list too; again clears it
    marker(el, "market").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(opt(el, "market").getAttribute("aria-selected")).toBe("true");
    marker(el, "market").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.stop).toBeNull();
    // Cancelable
    el.addEventListener("tc-stop-select", (e) => e.preventDefault(), { once: true });
    opt(el, "hotel").click();
    await settle();
    expect(el.stop).toBeNull();
    // Day 2: an unknown kind reads as its key; no location is said in words and has no marker
    el.day = "d2";
    await settle();
    expect(opt(el, "abbey").querySelector(".ui-mit__kind")!.textContent).toBe("Venue-x");
    expect(opt(el, "nowhere").querySelector(".ui-mit__nowhere")!.textContent).toBe("Not on the map – no location");
    expect(marker(el, "nowhere")).toBeNull();
    expect(el.querySelectorAll(".ui-mit__marker")).toHaveLength(2);
  });

  test("markers: arrow keys move between the day's stops, Enter picks; a muted stop on another day brings its day forward", async () => {
    const el = await make();
    marker(el, "hotel").focus();
    const at = () => (document.activeElement as Element | null)?.getAttribute("data-marker");
    key(marker(el, "hotel"), "ArrowRight");
    await expect.poll(at).toBe("market");
    key(marker(el, "market"), "ArrowDown");
    await expect.poll(at).toBe("square");
    key(marker(el, "square"), "Home");
    await expect.poll(at).toBe("hotel");
    key(marker(el, "hotel"), " ");
    await settle();
    expect(el.stop).toBe("hotel");
    const seen: string[] = [];
    el.addEventListener("tc-day-change", (e) => seen.push(`day ${(e as CustomEvent<ItineraryDayChange>).detail.day}`));
    el.addEventListener("tc-stop-select", (e) => seen.push(`stop ${(e as CustomEvent<ItineraryStopSelect>).detail.stop}`));
    el.querySelector(".ui-mit__day--muted .ui-mit__dot")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.day).toBe("d2");
    expect(el.stop).toBe("tower");
    expect(seen).toEqual(["day d2", "stop tower"]);
    expect(opt(el, "tower").getAttribute("aria-selected")).toBe("true");
  });

  test("fit: Show all days widens the view; Zoom to the day narrows it again", async () => {
    const el = await make();
    const spread = () => {
      const xs = [...el.querySelectorAll(".ui-mit__marker")].map((m) => +/translate\(([-\d.]+)/.exec(m.getAttribute("transform")!)![1]);
      return Math.max(...xs) - Math.min(...xs);
    };
    const day = spread();
    const fit = el.querySelector<HTMLButtonElement>(".ui-mit__fit")!;
    expect(fit.textContent!.trim()).toBe("Show all days");
    fit.click();
    await settle();
    expect(el.fit).toBe("all");
    expect(spread()).toBeLessThan(day);
    expect(fit.textContent!.trim()).toBe("Zoom to Day 1");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Showing all days");
    fit.click();
    await settle();
    expect(Math.round(spread())).toBe(Math.round(day));
  });

  test("tiles: nothing loads until Show map tiles; the note names the site; unsafe templates load nothing", async () => {
    const el = await fixture<TcMapItinerary>(
      html`<tc-map-itinerary .days=${DAYS} tile-url="https://tile.example.org/{z}/{x}/{y}.png" tile-attribution="© Example contributors"></tc-map-itinerary>`,
    );
    expect(el.querySelector(".ui-mit__tile")).toBeNull();
    expect(el.querySelector(".ui-mit__tiles-note")!.textContent).toBe("Map tiles load from tile.example.org");
    el.querySelector<HTMLButtonElement>(".ui-mit__show-tiles")!.click();
    await settle();
    const tiles = [...el.querySelectorAll(".ui-mit__tile")];
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.length).toBeLessThanOrEqual(36);
    expect(tiles[0].getAttribute("href")).toMatch(/^https:\/\/tile\.example\.org\/\d+\/\d+\/\d+\.png$/);
    expect(el.querySelector(".ui-mit__credit")!.textContent).toBe("© Example contributors");
    expect(el.querySelector(".ui-mit__tiles-ask")).toBeNull();
    // A new template asks again; a javascript: one never loads
    el.tileUrl = "javascript:alert(1)//{z}/{x}/{y}";
    await settle();
    expect(el.querySelector(".ui-mit__tile")).toBeNull();
    el.querySelector<HTMLButtonElement>(".ui-mit__show-tiles")!.click();
    await settle();
    expect(el.querySelector(".ui-mit__tile")).toBeNull();
  });

  test("one day has no tabs; no days says so; narrow puts the map above the list", async () => {
    const one = await fixture<TcMapItinerary>(html`<tc-map-itinerary .days=${[DAYS[0]]}></tc-map-itinerary>`);
    expect(one.querySelector('[role="tablist"]')).toBeNull();
    expect(one.querySelector('[role="tabpanel"]')).toBeNull();
    expect(one.querySelector('[role="listbox"]')).not.toBeNull();
    const none = await fixture<TcMapItinerary>(html`<tc-map-itinerary></tc-map-itinerary>`);
    expect(none.querySelector(".ui-mit__empty")!.textContent).toBe("No itinerary yet.");
    const narrow = await fixture<HTMLElement>(html`<div style="width: 420px"><tc-map-itinerary .days=${DAYS}></tc-map-itinerary></div>`);
    const map = narrow.querySelector<HTMLElement>(".ui-mit__map")!;
    expect(getComputedStyle(map).order).toBe("-1");
    await expect.poll(() => +map.querySelector("svg")!.getAttribute("width")!).toBeLessThanOrEqual(420);
  });

  test("React wrapper: uncontrolled picks survive re-renders; controlled ones stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(MapItinerary, {
        title: "Trip",
        days: DAYS,
        onDayChange: (d, item) => void seen.push(["day", d, item?.label]),
        onStopSelect: (s, item) => void seen.push(["stop", s, item?.name]),
        "data-n": n,
      } as React.ComponentProps<typeof MapItinerary>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-map-itinerary")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Trip");
    opt(el, "market").click();
    await settle();
    tab(el, "d2").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.day).toBe("d2");
    expect(el.stop).toBeNull();
    expect(seen).toEqual([
      ["stop", "market", "Time Out Market"],
      ["day", "d2", "Day 2"],
      ["stop", null, undefined],
    ]);
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(MapItinerary, { days: DAYS, day: "d1", stop: null, onDayChange: (d) => void seen.push(d), onStopSelect: (s) => void seen.push(s) })));
    await settle();
    const el2 = host2.querySelector("tc-map-itinerary")!;
    tab(el2, "d2").click();
    opt(el2, "hotel").click();
    await settle();
    expect(el2.day).toBe("d1");
    expect(el2.stop).toBeNull();
    expect(seen.slice(-2)).toEqual(["d2", "hotel"]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-map-itinerary description="Field visit" .days=${DAYS} stop="market" tile-url="https://tile.example.org/{z}/{x}/{y}.png"></tc-map-itinerary>
        <tc-map-itinerary look="clean" .days=${[DAYS[1]]}></tc-map-itinerary>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
