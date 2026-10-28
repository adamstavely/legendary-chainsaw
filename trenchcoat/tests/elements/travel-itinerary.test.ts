/*
 * <tc-travel-itinerary> in real browsers: legs sorted by date, routes, modes, documents, confidence in words, source
 * grades, flags, grouping into journeys, the keyboard, tc-open, the React wrapper and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/travel-itinerary";
import type { TcTravelItinerary, TravelLeg, TravelOpen } from "../../src/elements/travel-itinerary";
import { TravelItinerary } from "../../src/elements/react/travel-itinerary";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const at = (m: number, d: number) => new Date(2026, m - 1, d, 9).getTime();
/** One journey LYS → IST → LYS, then an unconnected leg months later */
const LEGS: TravelLeg[] = [
  { id: "back", date: at(5, 31), from: "IST", to: "LYS", mode: "air", carrier: "TK1815", confidence: 0.6, flags: ["cash", "custom"] },
  { id: "out", date: at(5, 28), from: { code: "LYS", name: "Lyon Saint-Exupéry" }, to: { code: "IST", name: "Istanbul" }, mode: "air", carrier: "TK1814", document: "Passport ••471K", confidence: 0.99, source: { label: "Booking tool", grade: "A1" } },
  { id: "rail", date: at(9, 2), from: "LYS", to: "PAR", mode: "rail", confidence: 0.8 },
];

const leg = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-leg="${id}"]`)!;
const row = (el: Element, id: string) => leg(el, id).closest("li")!;
const order = (el: Element) => [...el.querySelectorAll<HTMLElement>("[data-leg]")].map((b) => b.dataset.leg);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", grouped = false) =>
  fixture<TcTravelItinerary>(html`<tc-travel-itinerary look=${look} description="An audit." ?grouped=${grouped} .legs=${LEGS}></tc-travel-itinerary>`);

describe("tc-travel-itinerary", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: legs by date, with route, mode, document, confidence, source and flags`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("trit");
      expect(el.dataset.look).toBe(look);
      expect(order(el)).toEqual(["out", "back", "rail"]);
      const out = row(el, "out");
      expect([...out.querySelectorAll(".ui-trit__code")].map((c) => [c.textContent, c.getAttribute("title")])).toEqual([
        ["LYS", "Lyon Saint-Exupéry"],
        ["IST", "Istanbul"],
      ]);
      expect(leg(el, "out").getAttribute("aria-label")).toBe(`Open Lyon Saint-Exupéry to Istanbul, ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(at(5, 28))}`);
      expect(out.querySelector(".ui-trit__carrier")!.textContent).toBe("TK1814");
      expect(out.querySelector(".ui-trit__doc")!.textContent).toContain("Passport ••471K");
      expect(out.querySelector(".ui-trit__conf")!.textContent!.replace(/\s+/g, " ").trim()).toBe("99% confidence, high");
      expect(out.querySelector<HTMLElement>(".ui-trit__src")!.dataset.band).toBe("high");
      const back = row(el, "back");
      expect(back.querySelector(".ui-trit__conf")!.hasAttribute("data-low")).toBe(true);
      expect(back.querySelector(".ui-trit__conf")!.textContent).toContain("confidence, low");
      expect(back.querySelector(".ui-trit__doc")!.textContent).toBe("No document");
      expect([...back.querySelectorAll(".ui-trit__flag")].map((f) => [f.textContent, (f as HTMLElement).dataset.tone])).toEqual([
        ["Cash ticket", "warning"],
        ["custom", "warning"],
      ]);
      expect(el.querySelector(".ui-trit__count")!.textContent!.replace(/\s+/g, " ").trim()).toBe("3 legs · 1 flagged");
      expect(el.querySelectorAll('[data-leg][tabindex="0"]')).toHaveLength(1);
    });
  }

  test("grouped: connecting legs become a journey headed by its route; journey ids win; newest first reverses", async () => {
    const el = await make("standard", true);
    const heads = () => [...el.querySelectorAll(".ui-trit__journey-route")].map((h) => h.textContent!.replace(/\s+/g, ""));
    expect(heads()).toEqual(["LYS→IST→LYS", "LYS→PAR"]);
    expect(el.querySelectorAll(".ui-trit__journey")[0].getAttribute("aria-label")).toBe("Journey 1: LYS to IST to LYS");
    el.gapDays = 1;
    await settle();
    expect(heads()).toEqual(["LYS→IST", "IST→LYS", "LYS→PAR"]);
    el.legs = LEGS.map((l) => ({ ...l, journey: l.id === "rail" ? "b" : "a" }));
    await settle();
    expect(heads()).toEqual(["LYS→IST→LYS", "LYS→PAR"]);
    el.order = "newest";
    await settle();
    expect(order(el)).toEqual(["rail", "back", "out"]);
    expect(el.flags).toEqual({});
    el.flags = { custom: { label: "Manual check", tone: "info" } };
    await settle();
    expect(row(el, "back").querySelectorAll(".ui-trit__flag")[1].textContent).toBe("Manual check");
  });

  test("keyboard: ↑ ↓ Home End move one tab stop; Enter or a click fires tc-open", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent<TravelOpen>).detail.id));
    leg(el, "out").focus();
    const at = () => document.activeElement?.getAttribute("data-leg");
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('[data-leg][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowDown");
    expect(at()).toBe("back");
    await press("End");
    expect(at()).toBe("rail");
    await press("Home");
    expect(at()).toBe("out");
    leg(el, "back").click();
    expect(seen).toEqual(["back"]);
    const empty = await fixture<TcTravelItinerary>(html`<tc-travel-itinerary></tc-travel-itinerary>`);
    expect(empty.querySelector(".ui-trit__empty")!.textContent).toBe("No travel on record.");
  });

  test("React wrapper: the title and onOpen with the leg", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    await act(async () => root.render(React.createElement(TravelItinerary, { title: "Trips", legs: LEGS, grouped: true, onOpen: (id, l) => void seen.push([id, l.carrier]) })));
    await settle();
    const el = host.querySelector("tc-travel-itinerary")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Trips");
    expect(el.grouped).toBe(true);
    leg(el, "out").click();
    expect(seen).toEqual([["out", "TK1814"]]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-travel-itinerary description="An audit." grouped .legs=${LEGS}></tc-travel-itinerary>
        <tc-travel-itinerary look="clean" .legs=${LEGS}></tc-travel-itinerary>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
