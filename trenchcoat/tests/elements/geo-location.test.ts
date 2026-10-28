/*
 * <tc-geo-location> in real browsers: decimal and DMS, Copy, the mapping links and their templates, the map behind
 * Show map, bad coordinates, several points, tc-open, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/geo-location";
import { defaultGeoProviders, fillGeoTemplate, geoProblem, toDms } from "../../src/elements/geo-location";
import type { GeoCopy, GeoNotationChange, GeoOpen, GeoPoint, GeoSelectedChange, TcGeoLocation } from "../../src/elements/geo-location";
import { GeoLocation } from "../../src/elements/react/geo-location";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SITES: GeoPoint[] = [
  { id: "mast", label: "North weather mast", latitude: 57.04121, longitude: -3.61274 },
  { id: "buoy", label: "Lochside sensor buoy", latitude: 57.11853, longitude: -3.82406, zoom: 16 },
  { id: "bad", label: "Imported record", latitude: 157, longitude: 2 },
];
const one = (look: "standard" | "clean" = "standard") =>
  fixture<TcGeoLocation>(html`<tc-geo-location look=${look} label="North weather mast" latitude="57.04121" longitude="-3.61274" zoom="13"></tc-geo-location>`);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const links = (el: Element) => [...el.querySelectorAll<HTMLAnchorElement>(".ui-geo__link")];
/** Clicks a link without leaving the page: a listener on the host stops the navigation after the element has seen it */
const clickLink = (el: Element, a: HTMLAnchorElement) => {
  const stop = (e: Event) => e.preventDefault();
  el.addEventListener("click", stop);
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
  a.dispatchEvent(ev);
  el.removeEventListener("click", stop);
};

describe("tc-geo-location", () => {
  test("helpers: DMS, range checks and templates", () => {
    expect(toDms(57.04121, "lat")).toBe("57°2′28.4″N");
    expect(toDms(-3.61274, "lng")).toBe("3°36′45.9″W");
    expect(toDms(-33.999999, "lat")).toBe("34°0′0.0″S");
    expect(geoProblem(91, 0)).toMatch(/Latitude 91 is out of range/);
    expect(geoProblem(0, -181)).toMatch(/Longitude -181 is out of range/);
    expect(geoProblem(Number.NaN, 0)).toMatch(/missing/);
    expect(geoProblem(-90, 180)).toBeNull();
    expect(fillGeoTemplate("https://x.test/?q={label}&z={zoom}", { id: "a", label: "A & B", latitude: 1, longitude: 2 }, 12.4)).toBe("https://x.test/?q=A%20%26%20B&z=12");
    const embed = fillGeoTemplate("{bbox}", { id: "a", latitude: 10, longitude: 20 }, 10, 3);
    expect(decodeURIComponent(embed).split(",").map(Number)).toEqual([19.648, 9.824, 20.352, 10.176]);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the label, coordinates, notation, Copy, four links and a waiting map`, async () => {
      const el = await one(look);
      expect(el.dataset.ui).toBe("geo");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-geo__label")!.textContent).toBe("North weather mast");
      expect(el.querySelector(".ui-geo__coords")!.textContent).toBe("Latitude, longitude: 57.04121, -3.61274");
      const radios = el.querySelectorAll('[role="radiogroup"] [role="radio"]');
      expect([...radios].map((r) => [r.textContent, r.getAttribute("aria-checked"), r.getAttribute("tabindex")])).toEqual([
        ["Decimal", "true", "0"],
        ["DMS", "false", "-1"],
      ]);
      const ls = links(el);
      expect(ls.map((a) => a.dataset.provider)).toEqual(["google", "apple", "osm", "bing"]);
      for (const a of ls) {
        expect(a.target).toBe("_blank");
        expect(a.rel).toBe("noopener noreferrer");
        expect(a.textContent).toContain("(opens in a new tab)");
      }
      expect(ls[0].href).toBe("https://www.google.com/maps/search/?api=1&query=57.041210,-3.612740");
      expect(ls[1].href).toBe("https://maps.apple.com/?ll=57.041210,-3.612740&q=North%20weather%20mast&z=13");
      expect(ls[2].href).toBe("https://www.openstreetmap.org/?mlat=57.041210&mlon=-3.612740#map=13/57.041210/-3.612740");
      expect(el.querySelector("iframe")).toBeNull();
      expect(el.querySelector(".ui-geo__map-note")!.textContent).toBe("The map loads from openstreetmap.org");
      expect(el.querySelector(".ui-geo__show")!.textContent).toBe("Show map of North weather mast");
      expect(el.querySelector('[role="listbox"]')).toBeNull();
    });
  }

  test("Show map loads the sandboxed embed; auto shows it at once; off has none; a custom embed-src is used", async () => {
    const el = await one();
    el.querySelector<HTMLButtonElement>(".ui-geo__show")!.click();
    await settle();
    const frame = el.querySelector("iframe")!;
    expect(frame.title).toBe("Map of North weather mast");
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox");
    expect(frame.referrerPolicy).toBe("no-referrer");
    expect(frame.getAttribute("loading")).toBe("lazy");
    expect(frame.src).toMatch(/^https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?bbox=[-\d.%C]+&layer=mapnik&marker=57\.041210,-3\.612740$/);
    // The same address keeps the same iframe across renders
    el.heading = "Site";
    await settle();
    expect(el.querySelector("iframe")).toBe(frame);
    const auto = await fixture<TcGeoLocation>(html`<tc-geo-location embed="auto" latitude="1" longitude="2" embed-src="https://maps.example.org/embed?c={lat},{lng}"></tc-geo-location>`);
    expect(auto.querySelector("iframe")!.src).toBe("https://maps.example.org/embed?c=1.000000,2.000000");
    expect(auto.querySelector("iframe")!.title).toBe("Map of the point");
    auto.embed = "off";
    await settle();
    expect(auto.querySelector(".ui-geo__map")).toBeNull();
    // An embed that isn't http(s) is left out
    const bad = await fixture<TcGeoLocation>(html`<tc-geo-location embed="auto" latitude="1" longitude="2" embed-src="javascript:alert(1)"></tc-geo-location>`);
    expect(bad.querySelector(".ui-geo__map")).toBeNull();
  });

  test("notation: DMS by click or arrow key, tc-notation-change, cancelable", async () => {
    const el = await one();
    const seen: string[] = [];
    el.addEventListener("tc-notation-change", (e) => seen.push((e as CustomEvent<GeoNotationChange>).detail.notation));
    el.querySelector<HTMLElement>('[data-notation="dms"]')!.click();
    await settle();
    expect(el.notation).toBe("dms");
    expect(el.querySelector(".ui-geo__coords")!.textContent).toBe("Coordinates, degrees minutes seconds: 57°2′28.4″N 3°36′45.9″W");
    el.querySelector<HTMLElement>('[data-notation="dms"]')!.focus();
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(el.notation).toBe("decimal");
    await expect.poll(() => document.activeElement?.getAttribute("data-notation")).toBe("decimal");
    el.addEventListener("tc-notation-change", (e) => e.preventDefault(), { once: true });
    key(document.activeElement!, "End");
    await settle();
    expect(el.notation).toBe("decimal");
    expect(seen).toEqual(["dms", "decimal", "dms"]);
    el.precision = 2;
    await settle();
    expect(el.querySelector(".ui-geo__coords")!.textContent).toBe("Latitude, longitude: 57.04, -3.61");
  });

  test("Copy fires tc-copy with what's shown, then says Copied; prevented, nothing happens", async () => {
    const el = await one();
    const seen: string[] = [];
    el.addEventListener("tc-copy", (e) => seen.push((e as CustomEvent<GeoCopy>).detail.text));
    el.addEventListener("tc-copy", (e) => e.preventDefault(), { once: true });
    const copy = el.querySelector<HTMLButtonElement>(".ui-geo__copy")!;
    copy.click();
    await settle();
    expect(copy.textContent!.trim()).toBe("Copy");
    copy.click();
    await expect.poll(() => el.querySelector(".ui-geo__copy")!.textContent!.trim()).toBe("Copied");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Coordinates copied");
    expect(seen).toEqual(["57.04121, -3.61274", "57.04121, -3.61274"]);
  });

  test("tc-open carries the provider and URL; preventDefault stops the link", async () => {
    const el = await one();
    const seen: GeoOpen[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent<GeoOpen>).detail));
    const osm = links(el)[2];
    clickLink(el, osm);
    expect(seen[0].provider.id).toBe("osm");
    expect(seen[0].url).toBe(osm.href);
    expect(seen[0].point.label).toBe("North weather mast");
    // Prevented by the page: the element cancels the click itself
    el.addEventListener("tc-open", (e) => e.preventDefault(), { once: true });
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    links(el)[0].dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  test("providers replace the defaults; only http(s) templates are kept; labels are encoded", async () => {
    const el = await fixture<TcGeoLocation>(html`<tc-geo-location
      label="Mast #2 / north"
      latitude="57"
      longitude="-3"
      .providers=${[
        ...defaultGeoProviders.slice(0, 1),
        { id: "gis", name: "Institute GIS", url: "https://gis.example.org/map?lat={lat}&lon={lng}&name={label}" },
        { id: "evil", name: "Evil", url: "javascript:alert('{lat}')" },
        { id: "mail", name: "Mail", url: "mailto:a@b.test?body={lat}" },
      ]}
    ></tc-geo-location>`);
    expect(links(el).map((a) => a.textContent!.replace(" (opens in a new tab)", ""))).toEqual(["Google Maps", "Institute GIS"]);
    expect(links(el)[1].href).toBe("https://gis.example.org/map?lat=57.000000&lon=-3.000000&name=Mast%20%232%20%2F%20north");
    el.providers = [];
    await settle();
    expect(el.querySelector(".ui-geo__open")).toBeNull();
  });

  test("bad coordinates: an alert in words, no links, no map; nothing given says so", async () => {
    const el = await fixture<TcGeoLocation>(html`<tc-geo-location latitude="91" longitude="10"></tc-geo-location>`);
    const alert = el.querySelector('[role="alert"]')!;
    expect(alert.textContent).toBe("Can't show this location. Latitude 91 is out of range – it must be between −90 and 90.");
    expect(links(el)).toHaveLength(0);
    expect(el.querySelector(".ui-geo__map")).toBeNull();
    const none = await fixture<TcGeoLocation>(html`<tc-geo-location></tc-geo-location>`);
    expect(none.querySelector(".ui-geo__empty")!.textContent).toBe("No location given.");
  });

  test("points: a listbox, the first shown by default; keys move and pick; tc-selected-change cancelable; gone points clear", async () => {
    const el = await fixture<TcGeoLocation>(html`<tc-geo-location .points=${SITES}></tc-geo-location>`);
    const box = el.querySelector('[role="listbox"]')!;
    expect(box.getAttribute("aria-label")).toBe("Places");
    expect(el.querySelector(".ui-geo__count")!.textContent).toBe("3 places");
    const opts = () => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(opts().map((o) => o.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    expect(opts()[2].querySelector(".ui-geo__point-coords")!.textContent).toBe("Invalid coordinates");
    expect(box.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<GeoSelectedChange>).detail.point?.label ?? null));
    opts()[0].focus();
    key(document.activeElement!, "ArrowDown");
    await expect.poll(() => document.activeElement?.getAttribute("data-point")).toBe("buoy");
    key(document.activeElement!, "Enter");
    await settle();
    expect(el.selected).toBe("buoy");
    expect(el.querySelector(".ui-geo__label")!.textContent).toBe("Lochside sensor buoy");
    expect(links(el)[1].href).toContain("&z=16");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Lochside sensor buoy selected");
    el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
    opts()[2].click();
    await settle();
    expect(el.selected).toBe("buoy");
    opts()[2].click();
    await settle();
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(seen).toEqual(["Lochside sensor buoy", "Imported record", "Imported record"]);
    el.points = SITES.slice(0, 2);
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector(".ui-geo__label")!.textContent).toBe("North weather mast");
  });

  test("React wrapper: uncontrolled notation survives re-renders; controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(GeoLocation, { title: "Sites", points: SITES, onNotationChange: (v) => void seen.push(v), "data-n": n } as React.ComponentProps<typeof GeoLocation>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-geo-location")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Sites");
    el.querySelector<HTMLElement>('[data-notation="dms"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.notation).toBe("dms");
    expect(seen).toEqual(["dms"]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    const picked: unknown[] = [];
    const opened: string[] = [];
    await act(async () =>
      root2.render(
        React.createElement(GeoLocation, {
          points: SITES,
          selected: "mast",
          onSelectedChange: (s, p) => void picked.push([s, p?.label]),
          onOpenMap: (d) => {
            opened.push(d.provider.id);
            return false;
          },
        }),
      ),
    );
    await settle();
    const el2 = host2.querySelector("tc-geo-location")!;
    el2.querySelectorAll<HTMLElement>('[role="option"]')[1].click();
    await settle();
    expect(el2.selected).toBe("mast");
    expect(picked).toEqual([["buoy", "Lochside sensor buoy"]]);
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    links(el2)[3].dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(opened).toEqual(["bing"]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-geo-location description="Upland monitoring" .points=${SITES} selected="buoy"></tc-geo-location>
        <tc-geo-location look="clean" label="North weather mast" latitude="57.04121" longitude="-3.61274" notation="dms"></tc-geo-location>
        <tc-geo-location look="clean" latitude="91" longitude="0"></tc-geo-location>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
