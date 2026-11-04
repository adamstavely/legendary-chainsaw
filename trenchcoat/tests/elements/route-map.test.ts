/*
 * <tc-route-map> in real browsers: rows with paths, params, statuses, load times and last visits, the status chips and
 * filtering, choosing and opening, keys, the clock, empty and narrow states, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/route-map";
import type { RouteItem, TcRouteMap } from "../../src/elements/route-map";
import { RouteMap } from "../../src/elements/react/route-map";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 9, 12, 9, 30);
const min = 60_000;
const ROUTES: RouteItem[] = [
  { id: "home", path: "/", name: "Home", status: "ok", loadMs: 420, lastVisited: NOW - 3 * min },
  {
    id: "grants",
    path: "/grants",
    status: "ok",
    loadMs: 610,
    lastVisited: new Date(NOW - 2 * 60 * min).toISOString(),
    children: [
      { id: "grant", path: "/grants/:id", status: "slow", loadMs: 2380, children: [{ id: "apply", path: "/grants/:id/apply", status: "error", loadMs: 940, lastVisited: NOW - 12 * min }] },
    ],
  },
  { id: "admin", path: "/admin", status: "unvisited", children: [{ id: "reports", path: "/admin/reports", status: "unvisited" }] },
];
const make = (look: "standard" | "clean" = "standard") => fixture<TcRouteMap>(html`<tc-route-map look=${look} .routes=${ROUTES} .now=${NOW} locale="en-US"></tc-route-map>`);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-rmap__row[data-id="${id}"]`)!;
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-rmap__row")].map((r) => r.dataset.id);
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const chip = (el: Element, s: string) => el.querySelector<HTMLElement>(`.ui-rmap__chip[data-status="${s}"]`)!;

describe("tc-route-map", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a named list of route buttons with one tab stop, in path order`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rmap");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("ul")!.getAttribute("aria-label")).toBe("Routes");
      expect(ids(el)).toEqual(["home", "grants", "grant", "apply", "admin", "reports"]);
      expect([...el.querySelectorAll<HTMLElement>(".ui-rmap__row")].filter((b) => b.tabIndex === 0)).toHaveLength(1);
      expect(row(el, "apply").style.getPropertyValue("--tc-rmap-level")).toBe("2");
    });
  }

  test("each row: path with the parent's part quieter and params picked out, status word, load, last visit", async () => {
    const el = await make();
    expect(row(el, "apply").querySelector(".ui-rmap__lead")!.textContent).toBe("/grants/:id");
    expect([...row(el, "apply").querySelectorAll(".ui-rmap__param")].map((p) => p.textContent)).toEqual([]);
    expect([...row(el, "grant").querySelectorAll(".ui-rmap__param")].map((p) => p.textContent)).toEqual([":id"]);
    expect(text(row(el, "grant").querySelector(".ui-rmap__path"))).toBe("/grants/:id");
    expect(text(row(el, "home").querySelector(".ui-rmap__status"))).toBe("OK");
    expect(text(row(el, "grant").querySelector(".ui-rmap__status"))).toBe("Slow");
    expect(text(row(el, "apply").querySelector(".ui-rmap__status"))).toBe("Error");
    expect(text(row(el, "admin").querySelector(".ui-rmap__status"))).toBe("Not visited");
    expect(text(row(el, "home").querySelector(".ui-rmap__load"))).toBe("420 ms");
    expect(text(row(el, "grant").querySelector(".ui-rmap__load"))).toBe("2.4 s");
    expect(text(row(el, "home").querySelector(".ui-rmap__visited"))).toBe("3 min. ago");
    expect(text(row(el, "grants").querySelector(".ui-rmap__visited"))).toBe("2 hr. ago");
    expect(text(row(el, "admin").querySelector(".ui-rmap__visited"))).toBe("– Never");
    expect(getComputedStyle(row(el, "apply").querySelector(".ui-rmap__status")!).color).not.toBe(getComputedStyle(row(el, "home").querySelector(".ui-rmap__status")!).color);
  });

  test("chips count each status and filter; the routes above a match stay, marked as context", async () => {
    const el = await make();
    expect([...el.querySelectorAll(".ui-rmap__chip")].map((c) => text(c))).toEqual(["OK 2", "Slow 1", "Error 1", "Not visited 2"]);
    expect(el.querySelector(".ui-rmap__chips")!.getAttribute("role")).toBe("group");
    const seen: unknown[] = [];
    el.addEventListener("tc-statuses-change", (e) => seen.push((e as CustomEvent).detail.statuses));
    chip(el, "error").click();
    await settle();
    expect(chip(el, "error").getAttribute("aria-pressed")).toBe("true");
    expect(ids(el)).toEqual(["grants", "grant", "apply"]);
    expect(row(el, "grants").hasAttribute("data-context")).toBe(true);
    expect(row(el, "apply").hasAttribute("data-context")).toBe(false);
    chip(el, "ok").click();
    await settle();
    expect(seen).toEqual([["error"], ["ok", "error"]]);
    expect(ids(el)).toEqual(["home", "grants", "grant", "apply"]);
    expect(row(el, "grants").hasAttribute("data-context")).toBe(false);
    el.addEventListener("tc-statuses-change", (e) => e.preventDefault());
    chip(el, "ok").click();
    await settle();
    expect(el.statuses).toEqual(["ok", "error"]);
  });

  test("pressing chooses and opens; preventing the choice keeps it, preventing open says nothing", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push(`select:${(e as CustomEvent).detail.selected}`));
    el.addEventListener("tc-open", (e) => seen.push(`open:${(e as CustomEvent).detail.route.path}`));
    row(el, "grant").click();
    await settle();
    expect(seen).toEqual(["select:grant", "open:/grants/:id"]);
    expect(el.selected).toBe("grant");
    expect(row(el, "grant").getAttribute("aria-current")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Opening /grants/:id");
    // Pressing it again opens it again without another choice
    row(el, "grant").click();
    expect(seen).toEqual(["select:grant", "open:/grants/:id", "open:/grants/:id"]);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    el.addEventListener("tc-open", (e) => e.preventDefault());
    row(el, "home").click();
    await settle();
    expect(el.selected).toBe("grant");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Opening /grants/:id");
  });

  test("keyboard: ↓ ↑ Home End move one tab stop", async () => {
    const el = await make();
    row(el, "home").focus();
    const key = (k: string) => (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
    key("ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("grants");
    key("End");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("reports");
    key("ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("reports");
    key("Home");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("home");
    key("ArrowUp");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("home");
    expect([...el.querySelectorAll<HTMLElement>(".ui-rmap__row")].filter((b) => b.tabIndex === 0).map((b) => b.dataset.id)).toEqual(["home"]);
  });

  test("its own clock runs when there's no now", async () => {
    const el = await fixture<TcRouteMap>(html`<tc-route-map locale="en-US" .routes=${[{ id: "a", path: "/", status: "ok", lastVisited: Date.now() - 5 * 60_000 } satisfies RouteItem]}></tc-route-map>`);
    await expect.poll(() => text(el.querySelector(".ui-rmap__visited"))).toBe("5 min. ago");
    el.remove();
  });

  test("empty, no matches, and narrow hides the last-visited column without overflowing", async () => {
    const empty = await fixture<TcRouteMap>(html`<tc-route-map></tc-route-map>`);
    expect(text(empty.querySelector(".ui-rmap__empty"))).toBe("No routes");
    expect(empty.querySelector(".ui-rmap__chips")).toBeNull();
    const el = await make();
    el.statuses = ["error"];
    el.routes = [ROUTES[0]];
    await settle();
    expect(text(el.querySelector(".ui-rmap__empty"))).toBe("No routes with this status");
    // A pressed chip stays, so it can be released
    expect(chip(el, "error").getAttribute("aria-pressed")).toBe("true");
    el.statuses = [];
    el.routes = ROUTES;
    el.style.width = "300px";
    await settle();
    await expect.poll(() => getComputedStyle(row(el, "home").querySelector(".ui-rmap__visited")!).display).toBe("none");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React: uncontrolled survives a re-render, controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof RouteMap>>) => act(async () => root.render(React.createElement(RouteMap, { routes: ROUTES, now: NOW, ...props })));
    await render({ defaultSelected: "home" });
    const el = wrap.querySelector<TcRouteMap>("tc-route-map")!;
    await settle();
    expect(el.selected).toBe("home");
    await act(async () => row(el, "apply").click());
    await act(async () => chip(el, "slow").click());
    await render({ defaultSelected: "home", description: "Again" });
    await settle();
    expect(el.selected).toBe("apply");
    expect(el.statuses).toEqual(["slow"]);
    const seen: unknown[] = [];
    await render({ selected: "home", statuses: [], onSelectedChange: (s, r) => void seen.push([s, r?.path]), onStatusesChange: (s) => void seen.push(s) });
    await settle();
    await act(async () => row(el, "grant").click());
    await act(async () => chip(el, "error").click());
    await settle();
    expect(seen).toEqual([["grant", "/grants/:id"], ["error"]]);
    await expect.poll(() => el.selected).toBe("home");
    expect(el.statuses).toEqual([]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `<tc-route-map look="standard" heading="A"></tc-route-map><tc-route-map look="clean" heading="B"></tc-route-map><tc-route-map look="clean"></tc-route-map>`;
      wrap.querySelectorAll<TcRouteMap>("tc-route-map").forEach((el, i) => {
        if (i < 2) {
          el.routes = ROUTES;
          el.now = NOW;
          el.selected = "grant";
          el.statuses = i === 1 ? ["error"] : [];
        }
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
