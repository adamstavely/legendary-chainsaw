/*
 * <tc-run-receipt> in real browsers: the facts, line-item tables, totals with cache savings, the costliest step,
 * copying the run id, Open trace, the CSV, empty and narrow states, the React wrapper and axe in both looks and both
 * themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/run-receipt";
import { receiptCsv, receiptTotals, type RunReceiptModel, type TcRunReceipt } from "../../src/elements/run-receipt";
import { RunReceipt } from "../../src/elements/react/run-receipt";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const MODELS: RunReceiptModel[] = [
  { model: "large-1", calls: 6, inputTokens: 48_200, outputTokens: 3_140, cachedTokens: 31_600, cost: 0.3124, cacheSavings: 0.0853 },
  { model: "small-2", calls: 14, inputTokens: 22_900, outputTokens: 1_820, cost: 0.0211 },
];
const TOOLS = [{ tool: "ledger.lookup", calls: 9, cost: 0.0045 }];
const STEPS = [
  { name: "Read the invoice", cost: 0.04 },
  { name: "Match purchase order lines", cost: 0.2 },
];
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcRunReceipt>(
    html`<tc-run-receipt look=${look} agent="Invoice matcher" locale="en-US" .runId=${"run_8f2c"} .at=${Date.UTC(2026, 10, 3, 9, 14)} .duration=${48_600} .models=${MODELS} .tools=${TOOLS} .lookups=${{ count: 2, cost: 0.01 }} .steps=${STEPS}></tc-run-receipt>`,
  );
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();

describe("tc-run-receipt", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: facts, line-item tables with captions, and totals`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rrc");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".ui-rrc__id"))).toBe("run_8f2c");
      expect(text(el.querySelector(".ui-rrc__status"))).toBe("Succeeded");
      expect([...el.querySelectorAll("caption")].map(text)).toEqual(["Models", "Tools", "Other"]);
      const first = el.querySelector(".ui-rrc__models tbody tr")!;
      expect(text(first.querySelector("th"))).toBe("large-1");
      expect([...first.querySelectorAll("td")].map(text)).toEqual(["6", "48,200", "3,140", "31,600", "$0.31"]);
      expect([...el.querySelectorAll(".ui-rrc__sum")].map((d) => `${text(d.querySelector("dt"))} ${text(d.querySelector("dd"))}`)).toEqual(["Subtotal $0.35", "Cache savings -$0.09", "Total $0.26"]);
      expect(text(el.querySelector(".ui-rrc__head-total"))).toBe("$0.26");
      expect(text(el.querySelector(".ui-rrc__costliest"))).toBe("Costliest step Match purchase order lines $0.20 · 57% of the total");
    });
  }

  test("receiptTotals and a sub-cent amount keep their precision", async () => {
    expect(receiptTotals({ models: MODELS, tools: TOOLS, lookups: { count: 2, cost: 0.01 } })).toEqual({ subtotal: 0.3124 + 0.0211 + 0.0045 + 0.01, savings: 0.0853, total: 0.3124 + 0.0211 + 0.0045 + 0.01 - 0.0853 });
    const el = await make();
    expect([...el.querySelectorAll(".ui-rrc__line")].map(text)).toContain("ledger.lookup 9 $0.0045");
  });

  test("the status says itself in a word for each state", async () => {
    const el = await make();
    for (const [status, word] of [["failed", "Failed"], ["cancelled", "Cancelled"], ["running", "Still running"]] as const) {
      el.status = status;
      await el.updateComplete;
      expect(text(el.querySelector(".ui-rrc__status"))).toBe(word);
    }
  });

  test("copy fires tc-copy, shows a check and says so; prevented, the page copies", async () => {
    const el = await make();
    let detail: unknown = null;
    el.addEventListener("tc-copy", (e) => {
      detail = (e as CustomEvent).detail;
      e.preventDefault();
    });
    el.querySelector<HTMLButtonElement>(".ui-rrc__copy")!.click();
    await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("Run ID copied.");
    expect(detail).toEqual({ field: "run", text: "run_8f2c" });
    expect(el.querySelector(".ui-rrc__copy path")!.getAttribute("d")).toBe("M20 6 9 17l-5-5");
  });

  test("Open trace and Download CSV fire with their details", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-trace-open", (e) => seen.push((e as CustomEvent).detail));
    el.addEventListener("tc-download", (e) => {
      seen.push((e as CustomEvent).detail.filename);
      seen.push((e as CustomEvent).detail.csv.split("\n")[1]);
      e.preventDefault();
    });
    el.querySelector<HTMLButtonElement>(".ui-rrc__trace")!.click();
    el.querySelector<HTMLButtonElement>(".ui-rrc__download")!.click();
    expect(seen).toEqual([{ runId: "run_8f2c" }, "run_8f2c-receipt.csv", "run_8f2c,Invoice matcher,model,large-1,6,48200,3140,31600,0.3124"]);
    el.hideTrace = true;
    await el.updateComplete;
    expect(el.querySelector(".ui-rrc__trace")).toBeNull();
  });

  test("receiptCsv quotes cells with commas and adds the totals", () => {
    const csv = receiptCsv({ runId: "r", agent: "Matcher, invoices", tools: [{ tool: 'say "hi"', calls: 1, cost: 1 }] });
    const lines = csv.trim().split("\n");
    expect(lines[1]).toBe(`r,"Matcher, invoices",tool,"say ""hi""",1,,,,1`);
    expect(lines.slice(-3)).toEqual([`r,"Matcher, invoices",total,subtotal,,,,,1`, `r,"Matcher, invoices",total,cache savings,,,,,0`, `r,"Matcher, invoices",total,total,,,,,1`]);
  });

  test("no lines say nothing was charged; no steps leave the callout out", async () => {
    const el = await fixture<TcRunReceipt>(html`<tc-run-receipt locale="en-US"></tc-run-receipt>`);
    expect(text(el.querySelector(".ui-rrc__empty"))).toBe("Nothing was charged for this run");
    expect(el.querySelector(".ui-rrc__costliest")).toBeNull();
    expect(el.querySelector(".ui-rrc__sum--savings")).toBeNull();
  });

  test("narrow: the cached column is left out", async () => {
    const el = await make();
    el.style.width = "360px";
    await settle(el.parentElement!);
    await expect.poll(() => getComputedStyle(el.querySelector("th.ui-rrc__cached")!).display).toBe("none");
  });

  test("React: title, onTraceOpen and onDownload returning false", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    await act(async () =>
      root.render(React.createElement(RunReceipt, { title: "Cost", runId: "run_1", models: MODELS, onTraceOpen: (id) => seen.push(id), onDownload: (_csv, name) => (seen.push(name), false) })),
    );
    const el = host.querySelector("tc-run-receipt") as TcRunReceipt;
    await settle(host);
    expect(text(el.querySelector("h3"))).toBe("Cost");
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-rrc__trace")!.click());
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-rrc__download")!.click());
    expect(seen).toEqual(["run_1", "run_1-receipt.csv"]);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        el.status = "failed";
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.flatMap((v) => [v.id, ...v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary)])).toEqual([]);
      });
});
