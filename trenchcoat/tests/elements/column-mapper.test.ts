/*
 * <tc-column-mapper> in real browsers: suggestions prefilled with their confidence in words, a cancelable change per
 * column with every column in the mapping, Use suggestion and Accept all, required and duplicate problems in words
 * holding Continue, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/column-mapper";
import { confidenceLevel, mappingProblems, resolveMapping, type ColumnMapperColumn, type ColumnMapperField, type ColumnMapperSuggestion, type ColumnMappingChange, type TcColumnMapper } from "../../src/elements/column-mapper";
import { ColumnMapper } from "../../src/elements/react/column-mapper";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const COLUMNS: ColumnMapperColumn[] = [
  { id: "supplier", name: "Supplier", samples: ["Kestrel Lab Supplies", "Harbour Analytics"] },
  { id: "mail", name: "E-mail address", samples: ["orders@kestrel-lab.example"] },
  { id: "ctry", name: "Ctry", samples: ["UK", "NL"] },
  { id: "notes", name: "Notes" },
];
const FIELDS: ColumnMapperField[] = [
  { id: "name", label: "Vendor name", required: true },
  { id: "email", label: "Contact email", required: true },
  { id: "country", label: "Country" },
];
const SUGGESTIONS: ColumnMapperSuggestion[] = [
  { column: "supplier", field: "name", confidence: 0.97 },
  { column: "mail", field: "email", confidence: 0.7 },
  { column: "ctry", field: "country", confidence: 0.4 },
  { column: "notes", field: null, confidence: 0.9 },
];

const make = (mapping = {}) =>
  fixture<TcColumnMapper>(html`<tc-column-mapper heading="Match columns" .columns=${COLUMNS} .fields=${FIELDS} .suggestions=${SUGGESTIONS} .mapping=${mapping}></tc-column-mapper>`);
const select = (el: Element, name: string) => {
  const label = [...el.querySelectorAll("label")].find((l) => l.textContent === name)!;
  return el.querySelector<HTMLSelectElement>(`#${label.htmlFor}`)!;
};
const choose = async (s: HTMLSelectElement, value: string) => {
  s.value = value;
  s.dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
};
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const describedBy = (el: Element) => document.getElementById(el.getAttribute("aria-describedby")!)!.textContent!.replace(/\s+/g, " ").trim();
const problems = (el: Element) => [...el.querySelectorAll(".ui-cmap__problems li")].map((li) => li.textContent!.trim());

describe("tc-column-mapper", () => {
  test("helpers: confidence in words, the resolved mapping, problems", () => {
    expect([0.9, 0.85, 0.6, 0.59].map(confidenceLevel)).toEqual(["high", "high", "medium", "low"]);
    const m = resolveMapping(COLUMNS, { ctry: null }, SUGGESTIONS);
    expect(m).toEqual({ supplier: "name", mail: "email", ctry: null, notes: null });
    expect(mappingProblems(COLUMNS, FIELDS, { supplier: "email", mail: "email", ctry: null, notes: null })).toEqual({ missing: ["name"], duplicates: [{ field: "email", columns: ["supplier", "mail"] }] });
  });

  test("the host is the root, in both looks; a labelled select per column, prefilled from its suggestion", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("cmap");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelectorAll("li.ui-cmap__row")).toHaveLength(4);
    expect(select(el, "Supplier").value).toBe("name");
    expect(select(el, "Notes").value).toBe("");
    expect([...select(el, "Supplier").options].map((o) => o.textContent)).toEqual(["Don't import", "Vendor name (required)", "Contact email (required)", "Country"]);
    expect(el.querySelector(".ui-cmap__samples")!.textContent).toBe("Sample values: Kestrel Lab Supplies, Harbour Analytics");
    expect(describedBy(select(el, "Supplier"))).toBe("Suggested · High confidence");
    expect(describedBy(select(el, "E-mail address"))).toBe("Suggested · Medium confidence");
    expect(describedBy(select(el, "Ctry"))).toBe("Suggested · Low confidence");
    expect(el.querySelector(".ui-cmap__summary")!.textContent).toBe("3 of 4 columns matched · 1 not imported");
    el.look = "clean";
    await settle();
    expect(el.querySelector(":scope > .ui-cmap__card > .ui-cmap__foot")).not.toBeNull();
  });

  test("changing a column: a cancelable tc-mapping-change with every column; the suggestion stays with Use suggestion", async () => {
    const el = await make();
    const stop = listen<ColumnMappingChange>(el, "tc-mapping-change", true);
    await choose(select(el, "Ctry"), "");
    expect(stop).toHaveLength(1);
    expect(select(el, "Ctry").value).toBe("country");
    cleanup();
    const el2 = await make();
    const seen = listen<ColumnMappingChange>(el2, "tc-mapping-change");
    await choose(select(el2, "Ctry"), "");
    expect(seen).toEqual([{ mapping: { supplier: "name", mail: "email", ctry: null, notes: null }, column: "ctry", field: null }]);
    expect(el2.mapping.ctry).toBeNull();
    expect(status(el2)).toBe("Ctry goes to Don't import");
    const use = el2.querySelector<HTMLButtonElement>(".ui-cmap__use")!;
    expect(use.textContent).toBe("Use suggestion for Ctry");
    expect(el2.querySelector(".ui-cmap__note[data-off]")!.textContent).toContain("Suggested: Country · Low confidence");
    use.click();
    await settle();
    expect(select(el2, "Ctry").value).toBe("country");
    expect(el2.querySelector(".ui-cmap__use")).toBeNull();
  });

  test("Accept all suggestions puts every one back; held, and says so, when they're all in use", async () => {
    const el = await make({ supplier: null, mail: "country" });
    const accept = el.querySelector<HTMLButtonElement>(".ui-cmap__accept")!;
    expect(accept.getAttribute("aria-disabled")).toBeNull();
    const seen = listen<ColumnMappingChange>(el, "tc-mapping-change");
    accept.click();
    await settle();
    expect(seen[0]).toEqual({ mapping: { supplier: "name", mail: "email", ctry: "country", notes: null }, column: null, field: null });
    expect(status(el)).toBe("2 suggestions accepted");
    expect(accept.getAttribute("aria-disabled")).toBe("true");
    expect(describedBy(accept)).toBe("Every suggestion is in use");
    accept.click();
    await settle();
    expect(seen).toHaveLength(1);
    expect(status(el)).toBe("Every suggestion is in use");
  });

  test("problems in words: a required field left out, two columns to one field – Continue held until they're fixed", async () => {
    const el = await make({ supplier: "email" });
    expect(problems(el)).toEqual(["Required field not matched: Vendor name", "Two columns go to Contact email: “Supplier” and “E-mail address”"]);
    const sup = select(el, "Supplier");
    expect(sup.getAttribute("aria-invalid")).toBe("true");
    expect(describedBy(sup)).toBe("Another column also goes to Contact email");
    const go = el.querySelector<HTMLButtonElement>(".ui-cmap__continue")!;
    expect(go.getAttribute("aria-disabled")).toBe("true");
    expect(describedBy(go)).toContain("Required field not matched: Vendor name");
    const cont = listen<{ mapping: object }>(el, "tc-continue");
    go.click();
    await settle();
    expect(cont).toHaveLength(0);
    await choose(sup, "name");
    expect(problems(el)).toEqual([]);
    expect(sup.getAttribute("aria-invalid")).toBeNull();
    go.click();
    expect(cont).toEqual([{ mapping: { supplier: "name", mail: "email", ctry: "country", notes: null } }]);
  });

  test("no columns: says so; hide-continue drops Continue", async () => {
    const el = await fixture<TcColumnMapper>(html`<tc-column-mapper hide-continue .fields=${FIELDS}></tc-column-mapper>`);
    expect(el.querySelector(".ui-cmap__empty")!.textContent).toBe("No columns to match");
    expect(el.querySelector(".ui-cmap__continue")).toBeNull();
  });

  test("narrow: each column sits above its field", async () => {
    const wrap = await fixture(html`<div style="width: 360px"><tc-column-mapper .columns=${COLUMNS} .fields=${FIELDS} .suggestions=${SUGGESTIONS}></tc-column-mapper></div>`);
    const row = wrap.querySelector<HTMLElement>(".ui-cmap__row")!;
    const name = row.querySelector(".ui-cmap__source")!.getBoundingClientRect();
    const field = row.querySelector(".ui-cmap__target")!.getBoundingClientRect();
    expect(field.top).toBeGreaterThanOrEqual(name.bottom - 1);
  });

  test("React wrapper: uncontrolled survives a parent re-render; controlled stays with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onMappingChange = vi.fn();
    const draw = (n: number) => root.render(React.createElement(ColumnMapper, { title: `Match ${n}`, columns: COLUMNS, fields: FIELDS, suggestions: SUGGESTIONS, onMappingChange }));
    await act(async () => draw(1));
    await settle();
    const el = host.querySelector("tc-column-mapper")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Match 1");
    await act(async () => choose(select(el, "Ctry"), ""));
    expect(onMappingChange).toHaveBeenCalledWith({ supplier: "name", mail: "email", ctry: null, notes: null }, "ctry", null);
    await act(async () => draw(2));
    await settle();
    expect(select(el, "Ctry").value).toBe("");
    const onControlled = vi.fn();
    await act(async () => root.render(React.createElement(ColumnMapper, { columns: COLUMNS, fields: FIELDS, suggestions: SUGGESTIONS, mapping: {}, onMappingChange: onControlled })));
    await settle();
    await act(async () => choose(select(el, "Supplier"), ""));
    expect(onControlled).toHaveBeenCalledWith(expect.objectContaining({ supplier: null }), "supplier", null);
    expect(select(el, "Supplier").value).toBe("name");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-column-mapper look=${look} description="vendors.csv → Purchasing ledger" .columns=${COLUMNS} .fields=${FIELDS} .suggestions=${SUGGESTIONS} .mapping=${{ supplier: "email", ctry: null }}></tc-column-mapper>
            <div style="width: 340px"><tc-column-mapper look=${look} .columns=${COLUMNS} .fields=${FIELDS} .suggestions=${SUGGESTIONS}></tc-column-mapper></div>
          </div>`,
        );
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
