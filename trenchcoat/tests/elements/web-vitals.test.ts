/*
 * <tc-web-vitals> in real browsers: tiles with names, values, ratings from the default and given limits, the track and
 * trend, the device switch and its keys, empty and narrow states, the React wrapper and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/web-vitals";
import { rateWebVital, type TcWebVitals, type WebVital } from "../../src/elements/web-vitals";
import { WebVitals } from "../../src/elements/react/web-vitals";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const METRICS: WebVital[] = [
  { id: "lcp", value: 3120, history: [2650, 2900, 3120] },
  { id: "inp", value: 184 },
  { id: "cls", value: 0.28 },
  { id: "fcp", value: 1640 },
  { id: "ttfb", value: 690 },
  { id: "tbt", label: "TBT", name: "Total Blocking Time", value: 450, good: 200, poor: 600 },
];
const make = (look: "standard" | "clean" = "standard", device: string | null = "mobile") =>
  fixture<TcWebVitals>(html`<tc-web-vitals look=${look} device=${device ?? ""} .metrics=${METRICS} locale="en-US"></tc-web-vitals>`);
const tile = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-wvit__tile[data-id="${id}"]`)!;
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();

describe("tc-web-vitals", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a named list of tiles; the switch is one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("wvit");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("ul")!.getAttribute("aria-label")).toBe("Web vitals");
      expect(el.querySelectorAll(".ui-wvit__tile")).toHaveLength(6);
      const radios = [...el.querySelectorAll<HTMLElement>('[role="radio"]')];
      expect(radios.map((r) => r.textContent)).toEqual(["Mobile", "Desktop"]);
      expect(radios.filter((r) => r.tabIndex === 0).map((r) => r.dataset.device)).toEqual(["mobile"]);
      expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("Device");
    });
  }

  test("names, formatted values and rating words from the usual limits", async () => {
    const el = await make();
    expect(text(tile(el, "lcp").querySelector(".ui-wvit__names"))).toBe("LCP Largest Contentful Paint");
    expect(text(tile(el, "lcp").querySelector(".ui-wvit__value"))).toBe("3.1 s");
    expect(text(tile(el, "lcp").querySelector(".ui-wvit__rating"))).toBe("Needs improvement");
    expect(text(tile(el, "inp").querySelector(".ui-wvit__value"))).toBe("184 ms");
    expect(tile(el, "inp").dataset.rating).toBe("good");
    expect(text(tile(el, "cls").querySelector(".ui-wvit__value"))).toBe("0.28");
    expect(text(tile(el, "cls").querySelector(".ui-wvit__rating"))).toBe("Poor");
    expect(tile(el, "fcp").dataset.rating).toBe("good");
    expect(tile(el, "ttfb").dataset.rating).toBe("good");
    // A measure of the page's own, with its own limits
    expect(text(tile(el, "tbt").querySelector(".ui-wvit__names"))).toBe("TBT Total Blocking Time");
    expect(tile(el, "tbt").dataset.rating).toBe("needs");
    expect(text(el.querySelector(".ui-wvit__count"))).toBe("3/6 good");
    // The words differ by rating, and so do the colours
    expect(getComputedStyle(tile(el, "cls").querySelector(".ui-wvit__rating")!).color).not.toBe(getComputedStyle(tile(el, "inp").querySelector(".ui-wvit__rating")!).color);
    expect(rateWebVital(2500, 2500, 4000)).toBe("good");
    expect(rateWebVital(4000, 2500, 4000)).toBe("needs");
    expect(rateWebVital(4001, 2500, 4000)).toBe("poor");
    el.labels = { needs: "Could be better" };
    await settle();
    expect(text(tile(el, "lcp").querySelector(".ui-wvit__rating"))).toBe("Could be better");
  });

  test("the track puts the marker in its zone; the trend reads its values; no trend without history", async () => {
    const el = await make();
    const pos = (id: string) => {
      const track = tile(el, id).querySelector(".ui-wvit__track")!.getBoundingClientRect();
      const marker = tile(el, id).querySelector(".ui-wvit__marker")!.getBoundingClientRect();
      return (marker.left + marker.width / 2 - track.left) / track.width;
    };
    const zone = (id: string, z: string) => {
      const track = tile(el, id).querySelector(".ui-wvit__track")!.getBoundingClientRect();
      const r = tile(el, id).querySelector(`[data-zone="${z}"]`)!.getBoundingClientRect();
      return [(r.left - track.left) / track.width, (r.right - track.left) / track.width];
    };
    const [gl, gr] = zone("inp", "good");
    expect(pos("inp")).toBeGreaterThanOrEqual(gl);
    expect(pos("inp")).toBeLessThanOrEqual(gr);
    const [pl] = zone("cls", "poor");
    expect(pos("cls")).toBeGreaterThan(pl);
    expect(tile(el, "lcp").querySelector(".ui-wvit__track")!.getAttribute("aria-hidden")).toBe("true");
    expect(tile(el, "lcp").querySelector(".ui-wvit__spark polyline")).not.toBeNull();
    expect(text(tile(el, "lcp").querySelector(".ui-wvit__trend .ui-wvit__sr"))).toBe("Earlier readings: 2.7 s, 2.9 s, 3.1 s");
    expect(tile(el, "inp").querySelector(".ui-wvit__spark")).toBeNull();
  });

  test("the device switch: click and keys fire tc-device-change; preventing keeps it; no device, no switch", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-device-change", (e) => seen.push((e as CustomEvent).detail.device));
    el.querySelector<HTMLElement>('[data-device="desktop"]')!.click();
    await settle();
    expect(el.device).toBe("desktop");
    const mobile = el.querySelector<HTMLElement>('[data-device="mobile"]')!;
    el.querySelector<HTMLElement>('[data-device="desktop"]')!.focus();
    (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await expect.poll(() => document.activeElement).toBe(mobile);
    expect(el.device).toBe("mobile");
    (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => el.device).toBe("desktop");
    expect(seen).toEqual(["desktop", "mobile", "desktop"]);
    el.addEventListener("tc-device-change", (e) => e.preventDefault());
    mobile.click();
    await settle();
    expect(el.device).toBe("desktop");
    const plain = await make("standard", null);
    expect(plain.querySelector('[role="radiogroup"]')).toBeNull();
  });

  test("empty says so; narrow puts the tiles in one column without overflowing", async () => {
    const empty = await fixture<TcWebVitals>(html`<tc-web-vitals></tc-web-vitals>`);
    expect(text(empty.querySelector(".ui-wvit__empty"))).toBe("No measurements yet");
    expect(empty.querySelector(".ui-wvit__count")).toBeNull();
    const el = await make();
    el.style.width = "300px";
    await settle();
    await expect.poll(() => new Set([...el.querySelectorAll(".ui-wvit__tile")].map((t) => Math.round(t.getBoundingClientRect().left))).size).toBe(1);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React: uncontrolled survives a re-render, controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof WebVitals>>) => act(async () => root.render(React.createElement(WebVitals, { metrics: METRICS, ...props })));
    await render({ defaultDevice: "mobile" });
    const el = wrap.querySelector<TcWebVitals>("tc-web-vitals")!;
    await settle();
    expect(el.device).toBe("mobile");
    await act(async () => el.querySelector<HTMLElement>('[data-device="desktop"]')!.click());
    await render({ defaultDevice: "mobile", description: "Again" });
    await settle();
    expect(el.device).toBe("desktop");
    const seen: string[] = [];
    await render({ device: "mobile", onDeviceChange: (d) => void seen.push(d) });
    await settle();
    await act(async () => el.querySelector<HTMLElement>('[data-device="desktop"]')!.click());
    await settle();
    expect(seen).toEqual(["desktop"]);
    await expect.poll(() => el.device).toBe("mobile");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `<tc-web-vitals look="standard" heading="A" device="mobile"></tc-web-vitals><tc-web-vitals look="clean" heading="B"></tc-web-vitals><tc-web-vitals look="clean"></tc-web-vitals>`;
      wrap.querySelectorAll<TcWebVitals>("tc-web-vitals").forEach((el, i) => {
        if (i < 2) el.metrics = METRICS;
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
