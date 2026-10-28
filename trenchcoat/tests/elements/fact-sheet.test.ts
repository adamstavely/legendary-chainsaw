/*
 * <tc-fact-sheet> in real browsers: sections and facts, source tags with grades and bands, conflicting and missing
 * values, the grade scale, copying, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/fact-sheet";
import { factBand, gradeWords, type FactCopy, type FactSection, type TcFactSheet } from "../../src/elements/fact-sheet";
import { FactSheet } from "../../src/elements/react/fact-sheet";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SECTIONS: FactSection[] = [
  {
    id: "id",
    title: "Identity",
    facts: [
      { id: "name", label: "Full name", value: "Elena Ruiz", source: { label: "Passport", grade: "a1" }, copyable: true },
      { id: "nat", label: "Nationality", value: ["Spanish", "Portuguese"], source: { label: "Customer", grade: "C3" } },
      { id: "tax", label: "Tax residence", source: { label: "Customer", grade: "E4" } },
    ],
  },
  {
    id: "biz",
    title: "Business",
    facts: [
      {
        id: "addr",
        label: "Address",
        value: "Calle de la Loza 14",
        source: { label: "Registry", grade: "A2" },
        alternatives: [{ value: "Avenida del Puerto 210", source: { label: "Customer", grade: "F6", note: "Onboarding form" } }],
      },
      { id: "ind", label: "Industry", value: "Ceramics", source: { label: "News", grade: "B2", band: "low" } },
      { id: "none", label: "No source", value: "Something" },
    ],
  },
];

const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-fact="${id}"]`)!;
const make = (look: "standard" | "clean" = "standard") => fixture<TcFactSheet>(html`<tc-fact-sheet look=${look} description="Due diligence." .sections=${SECTIONS}></tc-fact-sheet>`);

describe("tc-fact-sheet", () => {
  test("factBand and gradeWords: the Admiralty scale", () => {
    expect(["A1", "B2", "b1", "A3", "C2", "C3", "D1", "A4", "E5", "F1", "A6", "", undefined, "G7"].map((g) => factBand(g))).toEqual([
      "high", "high", "high", "medium", "medium", "medium", "low", "low", "low", "unknown", "unknown", "unknown", "unknown", "unknown",
    ]);
    expect(gradeWords("a1")).toBe("completely reliable source, confirmed");
    expect(gradeWords("E5")).toBe("unreliable source, improbable");
    expect(gradeWords("nope")).toBe("");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: sections as regions holding description lists; values, lists and "Not known"`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("fsh");
      expect(el.dataset.look).toBe(look);
      const sections = el.querySelectorAll("section");
      expect(sections).toHaveLength(2);
      expect(document.getElementById(sections[0].getAttribute("aria-labelledby")!)!.textContent).toBe("Identity");
      expect(sections[0].querySelectorAll("dt")).toHaveLength(3);
      expect(row(el, "name").querySelector(".ui-fsh__text")!.textContent).toBe("Elena Ruiz");
      expect([...row(el, "nat").querySelectorAll(".ui-fsh__items li")].map((l) => l.textContent)).toEqual(["Spanish", "Portuguese"]);
      expect(row(el, "tax").querySelector(".ui-fsh__missing")!.textContent).toBe("Not known");
      el.missingLabel = "Unknown";
      await settle();
      expect(row(el, "tax").querySelector(".ui-fsh__missing")!.textContent).toBe("Unknown");
    });
  }

  test("source tags: label and grade, a band from the grade (or set), bars as well as tint, and a full spoken text", async () => {
    const el = await make();
    const tag = (id: string, i = 0) => row(el, id).querySelectorAll<HTMLElement>(".ui-fsh__tag")[i];
    expect(tag("name").querySelector("[aria-hidden='true']:not(.ui-fsh__bars)")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Passport · A1");
    expect([tag("name").dataset.band, tag("nat").dataset.band, tag("tax").dataset.band, tag("ind").dataset.band, tag("addr", 1).dataset.band]).toEqual(["high", "medium", "low", "low", "unknown"]);
    const bars = (t: HTMLElement) => t.querySelectorAll(".ui-fsh__bar[data-on]").length;
    expect([bars(tag("name")), bars(tag("nat")), bars(tag("tax")), bars(tag("addr", 1))]).toEqual([3, 2, 1, 0]);
    expect(getComputedStyle(tag("name")).backgroundColor).not.toBe(getComputedStyle(tag("tax")).backgroundColor);
    expect(tag("name").querySelector(".ui-fsh__sr")!.textContent).toBe("Source: Passport, grade A1 (completely reliable source, confirmed). High confidence");
    expect(tag("addr", 1).querySelector(".ui-fsh__sr")!.textContent).toBe("Source: Customer, grade F6 (reliability can't be judged source, truth can't be judged). Confidence unknown. Onboarding form");
    expect(row(el, "none").querySelector(".ui-fsh__tag")).toBeNull();
  });

  test("conflicting facts show every reading with its source under a Conflicting pill", async () => {
    const el = await make();
    const r = row(el, "addr");
    expect(r.hasAttribute("data-conflict")).toBe(true);
    expect(r.querySelector(".ui-fsh__conflict")!.textContent).toContain("Conflicting");
    const readings = r.querySelectorAll(".ui-fsh__reading");
    expect(readings).toHaveLength(2);
    expect(readings[1].querySelector(".ui-fsh__text")!.textContent).toBe("Avenida del Puerto 210");
    expect(readings[1].querySelector(".ui-fsh__sr")!.textContent).toBe("Another source says");
    expect(row(el, "name").hasAttribute("data-conflict")).toBe(false);
  });

  test("How grades work opens and closes the scale; no-legend hides it", async () => {
    const el = await make();
    const btn = el.querySelector<HTMLButtonElement>(".ui-fsh__legend-btn")!;
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(el.querySelector(".ui-fsh__legend")).toBeNull();
    btn.click();
    await settle();
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    const legend = el.querySelector(".ui-fsh__legend")!;
    expect(legend.id).toBe(btn.getAttribute("aria-controls"));
    expect(legend.querySelectorAll(".ui-fsh__scale")[0].querySelectorAll("dt")).toHaveLength(6);
    expect(legend.querySelectorAll(".ui-fsh__scale")[1].querySelectorAll("dt")).toHaveLength(6);
    expect(legend.querySelectorAll(".ui-fsh__bands li")).toHaveLength(4);
    btn.click();
    await settle();
    expect(el.querySelector(".ui-fsh__legend")).toBeNull();
    el.noLegend = true;
    await settle();
    expect(el.querySelector(".ui-fsh__legend-btn")).toBeNull();
  });

  test("copy: per fact or for all; tc-copy fires and preventDefault() stops the element copying", async () => {
    const el = await make();
    expect(row(el, "name").querySelector(".ui-fsh__copy")).toBeTruthy();
    expect(row(el, "nat").querySelector(".ui-fsh__copy")).toBeNull();
    const seen: FactCopy[] = [];
    el.addEventListener("tc-copy", (e) => {
      seen.push((e as CustomEvent<FactCopy>).detail);
      e.preventDefault();
    });
    row(el, "name").querySelector<HTMLButtonElement>(".ui-fsh__copy")!.click();
    await settle();
    expect(seen).toEqual([{ fact: "name", text: "Elena Ruiz" }]);
    expect(row(el, "name").querySelector(".ui-fsh__copy")!.hasAttribute("data-done")).toBe(false);
    el.copyable = true;
    await settle();
    expect(row(el, "nat").querySelector(".ui-fsh__copy")!.getAttribute("aria-label")).toBe("Copy Nationality");
    // A fact with no value has nothing to copy
    expect(row(el, "tax").querySelector(".ui-fsh__copy")).toBeNull();
    row(el, "nat").querySelector<HTMLButtonElement>(".ui-fsh__copy")!.click();
    await settle();
    expect(seen[1]).toEqual({ fact: "nat", text: "Spanish, Portuguese" });
  });

  test("columns: sections side by side when wide, stacked with columns=1 or when narrow", async () => {
    const wrap = await fixture(html`<div style="width: 900px"><tc-fact-sheet .sections=${SECTIONS}></tc-fact-sheet></div>`);
    const el = wrap.querySelector("tc-fact-sheet")!;
    await settle();
    const tops = () => [...el.querySelectorAll("section")].map((s) => Math.round(s.getBoundingClientRect().top));
    expect(tops()[0]).toBe(tops()[1]);
    el.columns = 1;
    await settle();
    expect(tops()[1]).toBeGreaterThan(tops()[0]);
    el.columns = 2;
    (wrap as HTMLElement).style.width = "400px";
    await settle();
    expect(tops()[1]).toBeGreaterThan(tops()[0]);
  });

  test("an empty element renders without errors; the heading can be renamed", async () => {
    const el = await fixture<TcFactSheet>(html`<tc-fact-sheet heading="Supplier"></tc-fact-sheet>`);
    expect(el.querySelector(".ui-fsh__empty")).toBeTruthy();
    expect(el.querySelector(".ui-fsh__legend-btn")).toBeNull();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Supplier");
  });

  test("React wrapper: title, sections and onCopy returning false stops the copy", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    await act(async () => root.render(React.createElement(FactSheet, { title: "Customer profile", sections: SECTIONS, onCopy: (f, t) => (seen.push([f, t]), false) })));
    await settle();
    const el = host.querySelector("tc-fact-sheet")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Customer profile");
    el.querySelector<HTMLButtonElement>(".ui-fsh__copy")!.click();
    await settle();
    expect(seen).toEqual([["name", "Elena Ruiz"]]);
    expect(el.querySelector(".ui-fsh__copy")!.hasAttribute("data-done")).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-fact-sheet description="Due diligence." copyable .sections=${SECTIONS}></tc-fact-sheet>
        <tc-fact-sheet look="clean" .sections=${SECTIONS}></tc-fact-sheet>
      </div>`);
      wrap.querySelector<HTMLButtonElement>(".ui-fsh__legend-btn")!.click();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
