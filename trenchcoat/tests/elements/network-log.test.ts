/*
 * <tc-network-log> in real browsers: columns and formatting, status tones, the waterfall, type chips, choosing a
 * request and its details (headers, a JSON body, a text body), the keyboard, the footer, empty states, narrow width,
 * the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/network-log";
import { requestName, type NetworkRequest, type TcNetworkLog } from "../../src/elements/network-log";
import { NetworkLog } from "../../src/elements/react/network-log";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const H = "https://staging.halden.example";
const REQUESTS: NetworkRequest[] = [
  { id: "doc", method: "GET", url: `${H}/grants/`, status: 200, type: "document", size: 14_820, start: 0, duration: 200, body: "<!doctype html>" },
  { id: "js", method: "GET", url: `${H}/static/app.js?v=4`, status: 200, type: "script", size: 212_600, start: 200, duration: 300 },
  { id: "font", method: "GET", url: `${H}/static/inter.woff2`, status: 304, type: "font", size: 310, start: 250, duration: 20 },
  { id: "logo", method: "GET", url: `${H}/static/logo.svg`, status: 404, type: "image", size: 412, start: 400, duration: 40 },
  { id: "api", method: "GET", url: `${H}/api/grants`, status: 200, type: "fetch", size: 9_310, start: 500, duration: 500, requestHeaders: { accept: "application/json" }, responseHeaders: { "content-type": "application/json" }, body: { total: 24 } },
  { id: "save", method: "POST", url: `${H}/api/drafts`, status: 0, type: "fetch", start: 900, duration: 100 },
];
const make = (look: "standard" | "clean" = "standard", requests: NetworkRequest[] = REQUESTS) => fixture<TcNetworkLog>(html`<tc-network-log look=${look} .requests=${requests}></tc-network-log>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-netl__row")];
const names = (el: Element) => [...el.querySelectorAll(".ui-netl__row .ui-netl__file")].map((n) => n.textContent);
const chip = (el: Element, t: string) => el.querySelector<HTMLElement>(`.ui-netl__chip[data-type="${t}"]`)!;
const key = async (el: TcNetworkLog, k: string, target: Element = document.activeElement!) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await el.updateComplete;
  await settle(el.parentElement!);
};

describe("tc-network-log", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid of requests with formatted cells, tones and one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("netl");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(grid.getAttribute("aria-label")).toBe("Network");
      expect([...grid.querySelectorAll('[role="columnheader"]')].map((c) => c.textContent)).toEqual(["Status", "Method", "Name", "Type", "Size", "Time", "Waterfall"]);
      expect(names(el)).toEqual(["grants", "app.js", "inter.woff2", "logo.svg", "grants", "drafts"]);
      const cells = (i: number) => [...rows(el)[i].querySelectorAll('[role="gridcell"]')].map((c) => c.textContent!.trim());
      expect(cells(1).slice(0, 6)).toEqual(["200", "GET", `app.js${H}/static/app.js?v=4`, "JS", "213 kB", "300 ms"]);
      expect(cells(5)[0]).toBe("failed");
      expect(cells(5)[4]).toBe("–");
      expect(rows(el).map((r) => r.dataset.tone)).toEqual(["success", "success", "neutral", "danger", "success", "danger"]);
      expect(el.querySelectorAll('.ui-netl__row[tabindex="0"]')).toHaveLength(1);
      expect(el.querySelector(".ui-netl__failed")!.textContent).toBe("2 failed");
      expect([...el.querySelector(".ui-netl__foot")!.children].map((s) => s.textContent!.replace(/\s+/g, " ").trim()).join(" ")).toBe("6 requests · 237 kB · Finished 1 s");
      await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("6 requests");
    });
  }

  test("the waterfall places each bar by start and duration across the whole span", async () => {
    const el = await make();
    const bar = (i: number) => rows(el)[i].querySelector<HTMLElement>(".ui-netl__bar")!.style;
    expect([bar(1).left, bar(1).width]).toEqual(["20%", "30%"]);
    expect([bar(4).left, bar(4).width]).toEqual(["50%", "50%"]);
  });

  test("requestName takes the last path part", () => {
    expect(requestName("https://a.example/static/app.js?v=1#x")).toBe("app.js");
    expect(requestName("https://a.example/grants/")).toBe("grants");
    expect(requestName("https://a.example/")).toBe("a.example");
  });

  test("type chips count, narrow, toggle back to all, and move with arrows; prevented stays", async () => {
    const el = await make();
    expect([...el.querySelectorAll(".ui-netl__chip")].map((c) => c.textContent!.replace(/\s+/g, " ").trim())).toEqual(["All", "Doc 1", "JS 1", "CSS 0", "Fetch 2", "Img 1", "Font 1", "Other 0"]);
    let detail: unknown = null;
    el.addEventListener("tc-types-change", (e) => (detail = (e as CustomEvent).detail), { once: true });
    chip(el, "fetch").click();
    await el.updateComplete;
    expect(detail).toEqual({ types: ["fetch"] });
    expect(names(el)).toEqual(["grants", "drafts"]);
    expect(chip(el, "all").getAttribute("aria-pressed")).toBe("false");
    expect(el.querySelector(".ui-netl__foot")!.textContent).toContain("2 / 6 requests");
    chip(el, "image").click();
    await el.updateComplete;
    expect(el.types).toEqual(["fetch", "image"]);
    chip(el, "all").click();
    await el.updateComplete;
    expect(el.types).toEqual([]);
    chip(el, "all").focus();
    await key(el, "ArrowLeft");
    expect(document.activeElement).toBe(chip(el, "other"));
    el.addEventListener("tc-types-change", (e) => e.preventDefault());
    chip(el, "style").click();
    await el.updateComplete;
    expect(el.types).toEqual([]);
    expect(names(el)).toHaveLength(6);
  });

  test("choosing a request opens its headers; Response shows a JSON Viewer or text; Close returns focus", async () => {
    const el = await make();
    let detail: unknown = null;
    el.addEventListener("tc-selected-change", (e) => (detail = (e as CustomEvent).detail), { once: true });
    rows(el)[4].click();
    await el.updateComplete;
    expect(detail).toEqual({ selected: "api", request: REQUESTS[4] });
    expect(rows(el)[4].getAttribute("aria-selected")).toBe("true");
    const panel = el.querySelector(".ui-netl__detail")!;
    expect(rows(el)[4].getAttribute("aria-controls")).toBe(panel.id);
    expect([...panel.querySelectorAll(".ui-netl__group-title")].map((t) => t.textContent)).toEqual(["General", "Response headers", "Request headers"]);
    expect([...panel.querySelectorAll(".ui-netl__pair")].map((p) => p.textContent)).toContain("acceptapplication/json");
    panel.querySelector<HTMLElement>('.ui-netl__tab[data-tab="response"]')!.click();
    await el.updateComplete;
    expect(panel.querySelector("tc-json-viewer")!.value).toEqual({ total: 24 });
    rows(el)[0].click();
    await el.updateComplete;
    expect(el.querySelector(".ui-netl__text")!.textContent).toBe("<!doctype html>");
    rows(el)[1].click();
    await el.updateComplete;
    expect(el.querySelector(".ui-netl__none")!.textContent).toBe("No response body");
    el.querySelector<HTMLElement>(".ui-netl__close")!.click();
    await el.updateComplete;
    await settle(el.parentElement!);
    expect(el.selected).toBe(null);
    expect(el.querySelector(".ui-netl__detail")).toBeNull();
    expect(document.activeElement).toBe(rows(el)[1]);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    rows(el)[2].click();
    await el.updateComplete;
    expect(el.selected).toBe(null);
  });

  test("keyboard: arrows, Home / End, Enter opens, Esc closes; tabs move with arrows", async () => {
    const el = await make();
    rows(el)[0].focus();
    await key(el, "ArrowDown");
    expect(document.activeElement).toBe(rows(el)[1]);
    await key(el, "End");
    expect(document.activeElement).toBe(rows(el)[5]);
    await key(el, "ArrowUp");
    await key(el, "Enter");
    expect(el.selected).toBe("api");
    await key(el, "Escape");
    expect(el.selected).toBe(null);
    await key(el, "Home");
    await key(el, " ");
    expect(el.selected).toBe("doc");
    el.querySelector<HTMLElement>('.ui-netl__tab[aria-selected="true"]')!.focus();
    await key(el, "ArrowRight");
    expect(document.activeElement).toBe(el.querySelector('.ui-netl__tab[data-tab="response"]'));
    expect(el.querySelector('[role="tabpanel"]')!.getAttribute("aria-labelledby")).toBe(document.activeElement!.id);
  });

  test("details close with a request the type chips hide, and come back with it", async () => {
    const el = await make();
    el.selected = "api";
    await el.updateComplete;
    expect(el.querySelector(".ui-netl__detail")).not.toBeNull();
    el.types = ["script"];
    await el.updateComplete;
    expect(rows(el).map((r) => r.dataset.id)).toEqual(["js"]);
    expect(el.querySelector(".ui-netl__detail")).toBeNull();
    el.types = [];
    await el.updateComplete;
    expect(el.querySelector(".ui-netl__detail")).not.toBeNull();
  });

  test("a type the log doesn't know shows as Other, never a built-in's text", async () => {
    const el = await make("standard", [{ ...REQUESTS[0], type: "toString" as NetworkRequest["type"] }]);
    expect(el.querySelector(".ui-netl__row .ui-netl__type")!.textContent).toBe("Other");
  });

  test("no requests and nothing matching say so", async () => {
    const el = await make("standard", []);
    expect(el.querySelector(".ui-netl__empty")!.textContent).toBe("No requests");
    el.requests = REQUESTS;
    el.types = ["style"];
    await el.updateComplete;
    expect(el.querySelector(".ui-netl__empty")!.textContent).toBe("No requests match");
  });

  test("narrow: type, size and waterfall are left out", async () => {
    const el = await make();
    el.style.width = "360px";
    await settle(el.parentElement!);
    await expect.poll(() => getComputedStyle(rows(el)[0].querySelector(".ui-netl__fall")!).display).toBe("none");
    expect(getComputedStyle(rows(el)[0].querySelector(".ui-netl__size")!).display).toBe("none");
    expect(getComputedStyle(rows(el)[0].querySelector(".ui-netl__time")!).display).not.toBe("none");
  });

  test("React: uncontrolled types survive re-renders; controlled selection stays until changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(NetworkLog, { requests: REQUESTS })));
    const el = host.querySelector("tc-network-log") as TcNetworkLog;
    await act(async () => chip(el, "fetch").click());
    await act(async () => root.render(React.createElement(NetworkLog, { requests: REQUESTS, title: "Requests" })));
    expect(el.types).toEqual(["fetch"]);
    let told: unknown = undefined;
    await act(async () => root.render(React.createElement(NetworkLog, { requests: REQUESTS, selected: "api", onSelectedChange: (s) => (told = s) })));
    await act(async () => rows(el)[1].click());
    await settle(host);
    expect(el.selected).toBe("api");
    expect(told).toBe("save");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        el.selected = "api";
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.flatMap((v) => [v.id, ...v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary)])).toEqual([]);
      });
});
