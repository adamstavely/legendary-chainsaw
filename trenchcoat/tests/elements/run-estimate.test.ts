/*
 * <tc-run-estimate> in real browsers: the host and both looks, the sums (estimateRun), the words, the breakdown, the
 * budget states, the sample and the cap (and their controlled use), Start, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/run-estimate";
import { estimateRun, runTime, type RunEstimateColumn, type RunEstimateModel, type TcRunEstimate } from "../../src/elements/run-estimate";
import { RunEstimate } from "../../src/elements/react/run-estimate";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const MODEL: RunEstimateModel = { name: "Analyst model", inputPrice: 3, outputPrice: 15 };
const COLUMNS: RunEstimateColumn[] = [
  { id: "tier", name: "Risk tier" },
  { id: "site", name: "Website", lookups: 2 },
];
const plain = (s: string | null | undefined) => (s ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const text = (el: Element, sel: string) => plain(el.querySelector(sel)?.textContent);
const estimate = (opts: { look?: string; budget?: number; rows?: number; sample?: boolean; cap?: number | null } = {}) =>
  fixture<TcRunEstimate>(
    html`<tc-run-estimate
      look=${opts.look ?? "standard"}
      rows=${opts.rows ?? 100}
      lookup-price="0.005"
      .columns=${COLUMNS}
      .model=${MODEL}
      .budget=${opts.budget ?? null}
      .sample=${opts.sample ?? false}
      .cap=${opts.cap ?? null}
    ></tc-run-estimate>`,
  );

describe("estimateRun", () => {
  test("cells, tokens, lookups, cost, the range and the time", () => {
    const e = estimateRun({ rows: 100, columns: COLUMNS, model: MODEL, lookupPrice: 0.005 });
    expect(e.cells).toBe(200);
    expect(e.tokensIn).toBe(120_000);
    expect(e.tokensOut).toBe(30_000);
    expect(e.tokens).toBe(150_000);
    expect(e.lookups).toBe(200);
    expect(e.inputCost).toBeCloseTo(0.36);
    expect(e.outputCost).toBeCloseTo(0.45);
    expect(e.lookupCost).toBeCloseTo(1);
    expect(e.cost).toBeCloseTo(1.81);
    expect(e.low).toBeCloseTo(1.3575);
    expect(e.high).toBeCloseTo(2.2625);
    expect(e.seconds).toBe(100);
    // A column's own averages win; nothing to run is nothing
    expect(estimateRun({ rows: 10, columns: [{ id: "a", name: "A", tokensIn: 1000, tokensOut: 0 }], model: MODEL }).inputCost).toBeCloseTo(0.03);
    expect(estimateRun({ rows: 0, columns: COLUMNS, model: MODEL }).cost).toBe(0);
  });

  test("time in words", () => {
    expect(runTime(0)).toBe("no time");
    expect(runTime(40)).toBe("under a minute");
    expect(runTime(100)).toBe("about 2 min");
    expect(runTime(3600)).toBe("about 1 h");
    expect(runTime(7800)).toBe("about 2 h 10 min");
  });
});

describe("tc-run-estimate", () => {
  for (const look of looks) {
    test(`${look}: a region named by its heading; the range, the sentence, the figures and the breakdown`, async () => {
      const el = await estimate({ look });
      expect(el.dataset.ui).toBe("rest");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Run estimate");
      expect(text(el, ".ui-rest__pill")).toBe("Analyst model");
      expect(text(el, ".ui-rest__big")).toBe("$1.36 – $2.26");
      expect(text(el, ".ui-rest__sentence")).toBe("200 cells (100 rows × 2 AI columns), about 150K tokens and 200 web lookups. At 8 at a time it should take about 2 min.");
      expect([...el.querySelectorAll(".ui-rest__stats dd")].map((d) => plain(d.textContent))).toEqual(["200", "150K", "200", "about 2 min"]);
      const rows = [...el.querySelectorAll(".ui-rest__table tbody tr")].map((r) => [...r.children].map((c) => plain(c.textContent)));
      expect(rows).toEqual([
        ["Input tokens", "120K", "$3.00 per 1M", "$0.36"],
        ["Output tokens", "30K", "$15.00 per 1M", "$0.45"],
        ["Web lookups", "200", "$0.005 each", "$1.00"],
      ]);
      expect([...el.querySelectorAll(".ui-rest__table tfoot :is(th, td)")].map((c) => plain(c.textContent))).toEqual(["Expected", "", "", "$1.81"]);
      expect(el.querySelector(".ui-rest__table caption")!.textContent).toBe("Where the cost goes");
      expect(text(el, ".ui-rest__start")).toBe("Start run");
    });
  }

  test("without a model it asks for one; with no rows Start is unavailable and says why", async () => {
    const none = await fixture<TcRunEstimate>(html`<tc-run-estimate rows="10" .columns=${COLUMNS}></tc-run-estimate>`);
    expect(text(none, ".ui-rest__empty")).toBe("Choose a model to see what the run will cost");
    expect(none.estimate).toBeNull();
    const empty = await estimate({ rows: 0 });
    const start = empty.querySelector<HTMLButtonElement>(".ui-rest__start")!;
    expect(start.getAttribute("aria-disabled")).toBe("true");
    expect(document.getElementById(start.getAttribute("aria-describedby")!)!.textContent).toContain("nothing to run");
    let fired = 0;
    empty.addEventListener("tc-start", () => fired++);
    start.click();
    expect(fired).toBe(0);
    expect(empty.querySelector(".ui-rest__table")).toBeNull();
  });

  test("the sample: its own estimate, the checkbox, Start runs only the sample; prevented, it stays off", async () => {
    const el = await estimate();
    expect(text(el, ".ui-rest__check")).toBe("Run on 50 rows first");
    expect(text(el, ".ui-rest__note")).toBe("$0.68 – $1.13, under a minute – check the answers before the rest");
    const box = el.querySelector<HTMLInputElement>(".ui-rest__sample")!;
    const seen: boolean[] = [];
    el.addEventListener("tc-sample-change", (e) => seen.push((e as CustomEvent<{ sample: boolean }>).detail.sample));
    box.click();
    await settle();
    expect(seen).toEqual([true]);
    expect(el.sample).toBe(true);
    expect(el.hasAttribute("sample")).toBe(true);
    expect(text(el, ".ui-rest__start")).toBe("Run on 50 rows");
    expect(text(el, ".ui-rest__foot-text")).toBe("First run: $0.68 – $1.13");
    const starts: { sample: boolean; rows: number; cost: number }[] = [];
    el.addEventListener("tc-start", (e) => {
      const d = (e as CustomEvent).detail;
      starts.push({ sample: d.sample, rows: d.rows, cost: Math.round(d.estimate.cost * 1000) / 1000 });
    });
    el.querySelector<HTMLButtonElement>(".ui-rest__start")!.click();
    await settle();
    expect(starts).toEqual([{ sample: true, rows: 50, cost: 0.905 }]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Starting on the first 50 rows.");
    // Prevented: the page keeps it
    el.addEventListener("tc-sample-change", (e) => e.preventDefault(), { once: true });
    box.click();
    await settle();
    expect(el.sample).toBe(true);
    expect(box.checked).toBe(true);
  });

  test("the sample choice hides when the run is no bigger than the sample", async () => {
    const el = await estimate({ rows: 40 });
    expect(el.querySelector(".ui-rest__sample")).toBeNull();
    expect(text(el, ".ui-rest__start")).toBe("Start run");
  });

  test("the cap: a bad amount is refused in words; a good one is set and said; prevented, it stays", async () => {
    const el = await estimate();
    const field = el.querySelector<HTMLInputElement>(".ui-rest__cap-input")!;
    expect(el.querySelector(`label[for="${field.id}"]`)!.textContent).toBe("Stop if spend reaches");
    expect(document.getElementById(field.getAttribute("aria-describedby")!)!.textContent!.trim()).toBe("Leave it empty to run to the end.");
    const seen: (number | null)[] = [];
    el.addEventListener("tc-cap-change", (e) => seen.push((e as CustomEvent<{ cap: number | null }>).detail.cap));
    field.value = "-2";
    field.dispatchEvent(new Event("change"));
    await settle();
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(text(el, ".ui-rest__cap .ui-rest__note")).toBe("Enter an amount above zero, or leave it empty for no cap.");
    expect(seen).toEqual([]);
    // Start with a bad cap focuses the field instead
    el.querySelector<HTMLButtonElement>(".ui-rest__start")!.click();
    expect(document.activeElement).toBe(field);
    field.value = "1.5";
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();
    expect(seen).toEqual([1.5]);
    expect(el.cap).toBe(1.5);
    expect(field.getAttribute("aria-invalid")).toBe("false");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("The run stops at $1.50.");
    // Below the high estimate: it may stop early, said as a share
    expect(text(el, ".ui-rest__cap .ui-rest__note")).toBe("The run may stop before it finishes – about 17% of the cells left.");
    el.addEventListener("tc-cap-change", (e) => e.preventDefault(), { once: true });
    field.value = "";
    field.dispatchEvent(new Event("change"));
    await settle();
    expect(seen).toEqual([1.5, null]);
    expect(el.cap).toBe(1.5);
    expect(field.value).toBe("1.5");
  });

  test("the budget: room, could go over, over – the meter, the words, the note, said once", async () => {
    const el = await estimate({ budget: 10 });
    expect(el.dataset.budget).toBe("ok");
    const meter = el.querySelector<HTMLElement>('.ui-rest__track[role="meter"]')!;
    expect(meter.getAttribute("aria-valuetext")).toBe("$1.36 – $2.26 of $10.00 left");
    expect(text(el, ".ui-rest__budget-line")).toBe("Budget left $10.00 This run uses up to 23% of it");
    expect(el.querySelector(".ui-rest__notice")).toBeNull();
    el.budget = 2;
    await settle();
    expect(el.dataset.budget).toBe("warn");
    expect(text(el, ".ui-rest__budget-state")).toBe("Could go over – the high estimate is $0.26 more than what's left");
    expect(el.querySelector(".ui-rest__notice")!.getAttribute("data-tone")).toBe("warn");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("This run could go over your remaining budget.");
    el.budget = 1;
    await settle();
    expect(el.dataset.budget).toBe("over");
    expect(text(el, ".ui-rest__notice")).toContain("Even the low estimate is more than your remaining budget");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("This run is over your remaining budget.");
    // The sample only could go over, where the whole run is over
    el.sample = true;
    await settle();
    expect(el.dataset.budget).toBe("warn");
    expect(text(el, ".ui-rest__budget-state")).toBe("Could go over – the high estimate is $0.13 more than what's left");
  });

  test("currencies and locales", async () => {
    const el = await fixture<TcRunEstimate>(
      html`<tc-run-estimate rows="100" locale="de-DE" currency="EUR" lookup-price="0.005" .columns=${COLUMNS} .model=${MODEL}></tc-run-estimate>`,
    );
    expect(text(el, ".ui-rest__big")).toBe("1,36 € – 2,26 €");
    expect(text(el, ".ui-rest__unit")).toBe("EUR");
  });

  test("the wrapper: an uncontrolled sample survives a parent re-render; a controlled cap only reports; onStart", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const caps: (number | null)[] = [];
    const starts: boolean[] = [];
    let rerender!: (n: number) => void;
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(RunEstimate, {
        title: `Estimate ${n}`,
        rows: 100,
        columns: COLUMNS,
        model: MODEL,
        cap: 5,
        onCapChange: (c) => caps.push(c),
        onStart: (s) => {
          starts.push(s.sample);
          return false;
        },
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-run-estimate")!;
    el.querySelector<HTMLInputElement>(".ui-rest__sample")!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector("h3")!.textContent).toBe("Estimate 1");
    expect(el.sample).toBe(true);
    const field = el.querySelector<HTMLInputElement>(".ui-rest__cap-input")!;
    field.value = "9";
    field.dispatchEvent(new Event("change"));
    await act(async () => settle());
    expect(caps).toEqual([9]);
    expect(el.cap).toBe(5);
    el.querySelector<HTMLButtonElement>(".ui-rest__start")!.click();
    await settle();
    expect(starts).toEqual([true]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-run-estimate rows="2000" lookup-price="0.005" .columns=${COLUMNS} .model=${MODEL} .budget=${60}></tc-run-estimate>
        <tc-run-estimate look="clean" rows="2000" lookup-price="0.005" .columns=${COLUMNS} .model=${MODEL} .budget=${5} .sample=${true} .cap=${3}></tc-run-estimate>
        <tc-run-estimate look="clean" rows="0" .columns=${COLUMNS} .model=${MODEL} .budget=${1}></tc-run-estimate>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
