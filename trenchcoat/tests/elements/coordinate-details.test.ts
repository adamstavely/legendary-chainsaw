/*
 * <tc-coordinate-details> in real browsers: parseCoordinate / findCoordinates (decimal, hemispheres, DMS, and the
 * lookalikes that stay plain), the marks, the card by hover, focus, right-click and the Menu key, `trigger`, lookups
 * through the resolver and the event, the cache, loading / error / not found, Copy, the mapping links, the map behind
 * Show map, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/coordinate-details";
import {
  findCoordinates,
  parseCoordinate,
  type CoordinateCopyDetail,
  type CoordinateLookupDetail,
  type CoordinateOpenDetail,
  type CoordinatePlace,
  type CoordinateResolver,
  type TcCoordinateDetails,
} from "../../src/elements/coordinate-details";
import { CoordinateDetails } from "../../src/elements/react/coordinate-details";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const near = (c: { latitude: number; longitude: number } | null, lat: number, lng: number) => {
  expect(c).not.toBeNull();
  expect(c!.latitude).toBeCloseTo(lat, 4);
  expect(c!.longitude).toBeCloseTo(lng, 4);
};

describe("parseCoordinate", () => {
  test("decimal pairs, with or without a space after the comma; the latitude comes first", () => {
    near(parseCoordinate("38.8977, -77.0365"), 38.8977, -77.0365);
    near(parseCoordinate("38.8977,-77.0365"), 38.8977, -77.0365);
    near(parseCoordinate("-33.8568, 151.2153"), -33.8568, 151.2153);
    near(parseCoordinate("+51.501, −0.142"), 51.501, -0.142);
  });

  test("decimals with hemispheres, before or after the number, with or without degree signs", () => {
    near(parseCoordinate("38.8977° N, 77.0365° W"), 38.8977, -77.0365);
    near(parseCoordinate("N 38.8977 W 77.0365"), 38.8977, -77.0365);
    near(parseCoordinate("33.8568S 151.2153E"), -33.8568, 151.2153);
    // The letters say which is which, whatever the order
    near(parseCoordinate("77.0365° W, 38.8977° N"), 38.8977, -77.0365);
    // Degree signs alone are enough
    near(parseCoordinate("38.8977°, -77.0365°"), 38.8977, -77.0365);
  });

  test("degrees, minutes and seconds – typographic or ASCII marks, or d", () => {
    near(parseCoordinate("38°53′51.6″N 77°02′11.6″W"), 38.8977, -77.0366);
    near(parseCoordinate(`38°53'51.6"N, 77°02'11.6"W`), 38.8977, -77.0366);
    near(parseCoordinate("38d53'51.6''N 77d2'11.6''W"), 38.8977, -77.0366);
    near(parseCoordinate("57° 2′ N, 3° 36′ W"), 57.0333, -3.6);
  });

  test("out of range, contradictory or too vague: null", () => {
    for (const bad of [
      "95.1234, 10.5678", // latitude past 90
      "45.1234, 181.0000", // longitude past 180
      "38°61′N 77°02′W", // 61 minutes
      "38.5°30′N 77°W", // minutes after decimal degrees
      "-38.8977 S, 77.0365 E", // a sign and a hemisphere
      "38.8977 N, 12.3456 S", // two latitudes
      "3, 4",
      "12.50, 13.75", // prices: too few decimals
      "38.8977 -77.0365", // plain decimals need a comma
      "38.8977, -77.0365, 12",
      "",
      "N",
    ]) {
      expect(parseCoordinate(bad), bad).toBeNull();
    }
  });
});

describe("findCoordinates", () => {
  const found = (t: string) => findCoordinates(t).map((m) => m.text);

  test("each notation in running text; the range covers the coordinates only", () => {
    const t = "Mast at 57.0412, -3.6127. Buoy 50°49′12″N 1°05′24″W, then N 51.5007 W 0.1246 (the pier).";
    const m = findCoordinates(t);
    expect(m.map((x) => x.text)).toEqual(["57.0412, -3.6127", "50°49′12″N 1°05′24″W", "N 51.5007 W 0.1246"]);
    expect(m[0].start).toBe(t.indexOf("57.0412"));
    expect(m[0].end).toBe(t.indexOf("57.0412") + "57.0412, -3.6127".length);
    near(m[1], 50.82, -1.09);
    near(m[2], 51.5007, -0.1246);
  });

  test("lookalikes stay plain: versions, out-of-range pairs, prices, numbers inside words", () => {
    expect(found("Release v2.10, 3.40 shipped; budget 12.50, 13.75; ref AB38.8977, -77.0365x")).toEqual([]);
    expect(found("Reading 95.1234, 10.5678 is off the scale")).toEqual([]);
    expect(found("Scores 3, 4 and 1.5, 2.5")).toEqual([]);
    expect(found("ID-38.8977, 77.0365")).toEqual([]);
    expect(found("")).toEqual([]);
  });

  test("two pairs side by side are found separately", () => {
    expect(found("From 57.0412, -3.6127 to 57.1200, -3.7000.")).toEqual(["57.0412, -3.6127", "57.1200, -3.7000"]);
  });
});

/* ---------- The element ---------- */

const TEXT = "Mast at 57.0412, -3.6127 on the ridge.\nBuoy 50°49′12″N 1°05′24″W. Skip v2.10, 3.40 and 95.1234, 10.5678.\nPier: N 51.5007 W 0.1246.";
const key = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;
const PLACES: Record<string, CoordinatePlace> = {
  [key(57.0412, -3.6127)]: { name: "North weather mast", kind: "Weather station", address: "Cairn ridge, Highland", elevation: 812.4, timezone: "Europe/London", image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 2'%3E%3Crect width='2' height='2' fill='%23345'/%3E%3C/svg%3E" },
  [key(50.82, -1.09)]: { name: "Harbour buoy 7", kind: "Navigation buoy" },
};
type Calls = { lat: number; lng: number; signal: AbortSignal }[];
const resolver = (calls: Calls, places = PLACES, ms = 0): CoordinateResolver =>
  (lat, lng, signal) => {
    calls.push({ lat, lng, signal });
    return new Promise((res) => setTimeout(() => res(places[key(lat, lng)] ?? null), ms));
  };

const make = (o: { look?: string; resolve?: CoordinateResolver; text?: string; trigger?: string; embed?: string } = {}) =>
  fixture<TcCoordinateDetails>(
    html`<tc-coordinate-details style="width: 520px" look=${o.look ?? "standard"} hover-delay="60" trigger=${o.trigger ?? "both"} embed=${o.embed ?? "click"} .text=${o.text ?? TEXT} .resolve=${o.resolve}></tc-coordinate-details>`,
  );
const marksOf = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-crd__mark")];
const card = (el: Element) => el.querySelector<HTMLElement>(".ui-crd__pop");
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const enter = (t: Element) => t.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
const leave = (t: Element) => t.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
const rightClick = (t: Element) => {
  const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 });
  t.dispatchEvent(e);
  return e.defaultPrevented;
};
const title = (c: Element) => document.getElementById(c.getAttribute("aria-labelledby") ?? "")?.textContent;
/** Waits until a card is open and done looking up (and `check` holds on it, when given) */
const opened = async (el: TcCoordinateDetails, check: (c: HTMLElement) => boolean = () => true) => {
  await expect
    .poll(() => {
      const c = card(el);
      return !!c && c.dataset.status !== "loading" && check(c);
    }, { timeout: 3000 })
    .toBe(true);
  await settle(el.parentElement!);
};

describe("tc-coordinate-details", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: only real coordinates become marks; the text is unchanged`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("crd");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-crd__text")!.textContent).toBe(TEXT);
      expect(marksOf(el).map((m) => m.textContent)).toEqual(["57.0412, -3.6127", "50°49′12″N 1°05′24″W", "N 51.5007 W 0.1246"]);
      const m = marksOf(el)[0];
      expect(m.tagName).toBe("BUTTON");
      expect(m.getAttribute("aria-haspopup")).toBe("dialog");
      expect(m.getAttribute("aria-expanded")).toBe("false");
      expect(plain(document.getElementById(m.getAttribute("aria-describedby")!)!.textContent)).toBe("Place details. Tab moves into them");
      expect(card(el)).toBeNull();
    });
  }

  test("hover opens the card after the intent delay: the place, both notations, links and Show map", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls) });
    const opens: (number | null)[] = [];
    el.addEventListener("tc-open-change", (e) => opens.push((e as CustomEvent).detail.latitude));
    enter(marksOf(el)[0]);
    await wait(20);
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await opened(el);
    const c = card(el)!;
    expect(c.getAttribute("role")).toBe("dialog");
    expect(getComputedStyle(c).position).toBe("fixed");
    expect(calls).toHaveLength(1);
    expect(calls[0].lat).toBeCloseTo(57.0412, 6);
    expect(calls[0].lng).toBeCloseTo(-3.6127, 6);
    expect(calls[0].signal).toBeInstanceOf(AbortSignal);
    expect(title(c)).toBe("North weather mast");
    expect(plain(c.querySelector(".ui-crd__where")!.textContent)).toBe("Weather station · Cairn ridge, Highland");
    expect(plain(c.querySelector(".ui-crd__meta")!.textContent)).toBe("812 m above sea level · , Europe/London");
    expect(c.querySelector<HTMLImageElement>(".ui-crd__img")!.src).toContain("data:image/svg+xml");
    expect([...c.querySelectorAll(".ui-crd__form")].map((r) => plain(r.textContent))).toEqual(["Decimal 57.04120, -3.61270", "DMS 57°2′28.3″N 3°36′45.7″W"]);
    expect([...c.querySelectorAll<HTMLElement>(".ui-crd__link")].map((a) => a.dataset.provider)).toEqual(["google", "apple", "osm", "bing"]);
    expect(c.querySelector(".ui-crd__show")).not.toBeNull();
    expect(c.querySelector("iframe")).toBeNull();
    expect(marksOf(el)[0].getAttribute("aria-expanded")).toBe("true");
    expect(opens).toEqual([57.0412]);
    expect(status(el)).toBe("North weather mast, Weather station");
  });

  test("the default intent delay is 300 ms", async () => {
    const el = await fixture<TcCoordinateDetails>(html`<tc-coordinate-details .text=${TEXT}></tc-coordinate-details>`);
    expect(el.hoverDelay).toBe(300);
    enter(marksOf(el)[0]);
    await wait(150);
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await expect.poll(() => card(el), { timeout: 3000 }).not.toBeNull();
  });

  test("the card stays open while the pointer moves into it, and closes when it leaves both", async () => {
    const el = await make({ resolve: resolver([]) });
    const m = marksOf(el)[0];
    enter(m);
    await opened(el);
    leave(m);
    await wait(60);
    enter(card(el)!);
    await wait(300);
    await el.updateComplete;
    expect(card(el)).not.toBeNull();
    leave(card(el)!);
    await expect.poll(() => card(el), { timeout: 3000 }).toBeNull();
  });

  test("right-click opens the card pinned and stops the browser menu – on marks only", async () => {
    const el = await make({ resolve: resolver([]) });
    const m = marksOf(el)[1];
    expect(rightClick(m)).toBe(true);
    await opened(el, (c) => title(c) === "Harbour buoy 7");
    expect(m.getAttribute("aria-expanded")).toBe("true");
    // Pinned: leaving doesn't close it
    leave(m);
    await wait(300);
    await el.updateComplete;
    expect(card(el)).not.toBeNull();
    // A second right-click keeps it open
    expect(rightClick(m)).toBe(true);
    await el.updateComplete;
    expect(card(el)).not.toBeNull();
    // Plain text keeps the browser's menu
    expect(rightClick(el.querySelector(".ui-crd__text")!)).toBe(false);
  });

  test('the Menu key and Shift + F10 open the card and move into it; trigger "hover" leaves right-click alone', async () => {
    const el = await make({ resolve: resolver([]), trigger: "contextmenu" });
    const [a] = marksOf(el);
    expect(plain(document.getElementById(a.getAttribute("aria-describedby")!)!.textContent)).toBe("Place details. Enter or the Menu key opens them");
    // Contextmenu-only: focus and hover don't open it
    a.focus();
    enter(a);
    await wait(150);
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await userEvent.keyboard("{ContextMenu}");
    await opened(el, (c) => c.contains(document.activeElement));
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(a);
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    await opened(el, (c) => c.contains(document.activeElement));
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    // Enter still opens it
    await userEvent.keyboard("{Enter}");
    await opened(el, (c) => c.contains(document.activeElement));
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;

    const hover = await make({ resolve: resolver([]), trigger: "hover" });
    expect(rightClick(marksOf(hover)[0])).toBe(false);
    await hover.updateComplete;
    expect(card(hover)).toBeNull();
  });

  test("keyboard: focus opens it, Tab goes in, Shift+Tab back, Tab from the last control to the next mark, Esc closes", async () => {
    const el = await make({ resolve: resolver([]), embed: "off" });
    el.providers = [];
    await el.updateComplete;
    const [a, b] = marksOf(el);
    a.focus();
    await opened(el);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(card(el)!.querySelector('[aria-label="Copy decimal"]'));
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(a);
    await userEvent.keyboard("{Tab}{Tab}");
    expect(document.activeElement).toBe(card(el)!.querySelector('[aria-label="Copy DMS"]'));
    await userEvent.keyboard("{Tab}");
    await opened(el, (c) => title(c) === "Harbour buoy 7");
    expect(document.activeElement).toBe(b);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(b);
  });

  test("places are cached by position: the same coordinates twice, or reopened, are looked up once", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls), text: "57.0412, -3.6127 and again 57°2′28.32″N 3°36′45.72″W." });
    const [a, b] = marksOf(el);
    a.focus();
    await opened(el);
    b.focus();
    await opened(el);
    a.focus();
    await opened(el);
    expect(calls).toHaveLength(1);
    el.clearCache({ latitude: 57.0412, longitude: -3.6127 });
    b.focus();
    await expect.poll(() => calls.length, { timeout: 3000 }).toBe(2);
    await opened(el);
  });

  test("loading, then an error with Retry, then the place; results are announced", async () => {
    let fail = true;
    const el = await make({ resolve: (lat, lng) => new Promise<CoordinatePlace | null>((res, rej) => setTimeout(() => (fail ? rej(new Error("offline")) : res(PLACES[key(lat, lng)] ?? null)), 80)) });
    marksOf(el)[0].focus();
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("loading");
    const c = card(el)!;
    expect(c.getAttribute("aria-busy")).toBe("true");
    expect(plain(c.textContent)).toContain("Looking up this place…");
    expect(c.getAttribute("aria-label")).toBe("Place details for 57.04120, -3.61270");
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("error");
    expect(plain(card(el)!.querySelector(".ui-crd__msg")!.textContent)).toBe("Couldn't load the details.");
    expect(status(el)).toBe("Couldn't load the details.");
    fail = false;
    card(el)!.querySelector<HTMLButtonElement>(".ui-crd__retry")!.click();
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("done");
    expect(status(el)).toBe("North weather mast, Weather station");
  });

  test('no resolver and no listener, or no place: "No details for this place"; the coordinates still show', async () => {
    const el = await make();
    marksOf(el)[2].focus();
    await opened(el);
    const c = card(el)!;
    expect(c.dataset.status).toBe("empty");
    expect(plain(c.querySelector(".ui-crd__msg")!.textContent)).toBe("No details for this place");
    expect(plain(c.querySelector(".ui-crd__form")!.textContent)).toBe("Decimal 51.50070, -0.12460");
    el.notFoundText = "Not in the gazetteer";
    el.precision = 3;
    await el.updateComplete;
    expect(plain(card(el)!.querySelector(".ui-crd__msg")!.textContent)).toBe("Not in the gazetteer");
    expect(plain(card(el)!.querySelector(".ui-crd__form")!.textContent)).toBe("Decimal 51.501, -0.125");
  });

  test("tc-coordinate-lookup: respondWith() answers before the resolver; preventing without an answer means no details", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls) });
    const seen: CoordinateLookupDetail[] = [];
    el.addEventListener("tc-coordinate-lookup", (e) => {
      const d = (e as CustomEvent<CoordinateLookupDetail>).detail;
      seen.push(d);
      if (d.latitude > 55) d.respondWith(Promise.resolve({ name: "From the event" }));
      else e.preventDefault();
    });
    marksOf(el)[0].focus();
    await opened(el, (c) => title(c) === "From the event");
    marksOf(el)[1].focus();
    await opened(el, (c) => plain(c.querySelector(".ui-crd__msg")?.textContent) === "No details for this place");
    expect(calls).toHaveLength(0);
    expect(seen).toHaveLength(2);
    expect(seen[0].signal).toBeInstanceOf(AbortSignal);
  });

  test("Show map loads the embed only when pressed; it's sandboxed and resets for the next place", async () => {
    const el = await make({ resolve: resolver([]) });
    // OpenStreetMap by default; the test loads a stand-in, so a real map page doesn't tie up the browser for later tests
    expect(el.embedSrc).toContain("openstreetmap.org/export/embed.html");
    el.embedSrc = el.embedSrc.replace(/^https:\/\/[^/]+/, "https://maps.example.invalid");
    marksOf(el)[0].focus();
    await opened(el);
    expect(document.querySelector("iframe")).toBeNull();
    expect(plain(card(el)!.querySelector(".ui-crd__map-note")!.textContent)).toBe("Loads from maps.example.invalid");
    card(el)!.querySelector<HTMLButtonElement>(".ui-crd__show")!.click();
    await el.updateComplete;
    const f = card(el)!.querySelector("iframe")!;
    expect(f.src).toContain("maps.example.invalid/export/embed.html");
    expect(f.src).toContain("marker=57.041200,-3.612700");
    expect(f.getAttribute("sandbox")).toBe("allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox");
    expect(f.title).toBe("Map of North weather mast");
    marksOf(el)[1].focus();
    await opened(el);
    expect(card(el)!.querySelector("iframe")).toBeNull();
    el.embed = "off";
    await el.updateComplete;
    expect(card(el)!.querySelector(".ui-crd__show")).toBeNull();
  });

  test("Copy fires a cancelable tc-copy; Open in fires a cancelable tc-open", async () => {
    const el = await make({ resolve: resolver([]) });
    const copies: CoordinateCopyDetail[] = [];
    const opens: CoordinateOpenDetail[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent<CoordinateCopyDetail>).detail);
      e.preventDefault();
    });
    el.addEventListener("tc-open", (e) => {
      opens.push((e as CustomEvent<CoordinateOpenDetail>).detail);
      e.preventDefault();
    });
    marksOf(el)[1].focus();
    await opened(el);
    card(el)!.querySelector<HTMLButtonElement>('[aria-label="Copy DMS"]')!.click();
    card(el)!.querySelector<HTMLButtonElement>('[aria-label="Copy decimal"]')!.click();
    expect(copies).toEqual([{ text: "50°49′12.0″N 1°5′24.0″W", notation: "dms" }, { text: "50.82000, -1.09000", notation: "decimal" }]);
    await el.updateComplete;
    expect(card(el)!.querySelector(".ui-crd__copy[data-done]")).toBeNull();
    const link = card(el)!.querySelector<HTMLAnchorElement>('.ui-crd__link[data-provider="osm"]')!;
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(opens).toHaveLength(1);
    expect(opens[0].provider.id).toBe("osm");
    expect(opens[0].url).toBe(link.href);
    expect(opens[0].latitude).toBeCloseTo(50.82, 6);
  });

  test("leaving the page aborts lookups in flight; a text change closes a card whose coordinates went away", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls, PLACES, 500) });
    marksOf(el)[0].focus();
    await wait(30);
    await settle(el.parentElement!);
    const host = el.parentElement!;
    el.remove();
    expect(calls[0].signal.aborted).toBe(true);
    host.append(el);
    await el.updateComplete;
    el.text = "Nothing here any more: 3, 4.";
    await el.updateComplete;
    expect(marksOf(el)).toHaveLength(0);
    expect(card(el)).toBeNull();
  });

  test("the wrapper: resolve and onCopy (false stops the clipboard write); a parent re-render keeps the cache", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: Calls = [];
    const copies: string[] = [];
    const resolve = resolver(calls);
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(CoordinateDetails, { text: TEXT, className: `n${n}`, resolve, hoverDelay: 60, onCopy: (text: string) => (copies.push(text), false) });
    }
    await act(async () => rootEl.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcCoordinateDetails>("tc-coordinate-details")!;
    marksOf(el)[0].focus();
    await act(async () => opened(el));
    card(el)!.querySelector<HTMLButtonElement>('[aria-label="Copy decimal"]')!.click();
    expect(copies).toEqual(["57.04120, -3.61270"]);
    await act(async () => rerender(1));
    await settle();
    marksOf(el)[0].blur();
    marksOf(el)[0].focus();
    await act(async () => opened(el));
    expect(calls).toHaveLength(1);
    await act(async () => rootEl.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, with a place, an error and no details open (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-coordinate-details hover-delay="0" .text=${TEXT} .resolve=${resolver([])}></tc-coordinate-details>
        <tc-coordinate-details hover-delay="0" look="clean" .text=${TEXT} .resolve=${() => Promise.reject(new Error("down"))}></tc-coordinate-details>
        <tc-coordinate-details hover-delay="0" look="clean" .text=${TEXT}></tc-coordinate-details>
      </div>`);
      const els = [...wrap.querySelectorAll<TcCoordinateDetails>("tc-coordinate-details")];
      els.forEach((el, i) => marksOf(el)[i === 0 ? 0 : 2].dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })));
      await expect.poll(() => els.map((el) => card(el)?.dataset.status), { timeout: 3000 }).toEqual(["done", "error", "empty"]);
      await settle(wrap);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
