/*
 * <tc-failure-clusters> in real browsers: biggest first with known ones last, shares and trends in words, opening a
 * cluster, the actions and their events, the criterion filter, bubbles, the keyboard, controlled state, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/failure-clusters";
import type { FailureCluster, FailureClusterAction, FailureClusterKnownChange, FailureClusterOpenChange, TcFailureClusters } from "../../src/elements/failure-clusters";
import { clusterTrendWords } from "../../src/elements/failure-clusters";
import { FailureClusters } from "../../src/elements/react/failure-clusters";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const CLUSTERS: FailureCluster[] = [
  { id: "leave", label: "Carrying over leave", count: 96, trend: { direction: "flat" }, criteria: ["Correctness"] },
  {
    id: "abroad",
    label: "Expense limits abroad",
    summary: "Quotes the domestic limits for overseas trips.",
    count: 142,
    trend: { direction: "up", change: 18 },
    criteria: ["Correctness", "Cites policy"],
    examples: [{ id: "e1", quote: "What's the hotel limit in Lisbon? — 180 a night." }],
  },
  { id: "tone", label: "Short replies", count: 38, trend: { direction: "down", change: 9.4 }, criteria: ["Tone"] },
  { id: "data", label: "Data retention", count: 24, criteria: ["Correctness"] },
];

const row = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-fcl__row[data-cluster="${id}"]`)!;
const names = (el: Element) => [...el.querySelectorAll(".ui-fcl__row .ui-fcl__name")].map((n) => n.textContent);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcFailureClusters>(html`<tc-failure-clusters look=${look} description="Policy desk · last 7 days" locale="en-US" .clusters=${CLUSTERS} .known=${["data"]}></tc-failure-clusters>`);

describe("tc-failure-clusters", () => {
  test("clusterTrendWords: up and down with the change, flat, none", () => {
    expect(clusterTrendWords({ direction: "up", change: 18 })).toBe("Up 18%");
    expect(clusterTrendWords({ direction: "down", change: -9.4 })).toBe("Down 9%");
    expect(clusterTrendWords({ direction: "down" })).toBe("Down");
    expect(clusterTrendWords({ direction: "flat", change: 0 })).toBe("Flat");
    expect(clusterTrendWords(undefined)).toBe("");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: biggest first, known last, facts in words, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("fcl");
      expect(el.dataset.look).toBe(look);
      expect(names(el)).toEqual(["Expense limits abroad", "Carrying over leave", "Short replies", "Data retention"]);
      expect(el.querySelector(".ui-fcl__total")!.textContent).toBe("300 failing chats in 4 topics");
      const r = row(el, "abroad");
      expect(r.getAttribute("aria-expanded")).toBe("false");
      expect(document.getElementById(r.getAttribute("aria-describedby")!)!.textContent).toBe("142 chats, 47%, Up 18%, fails Correctness, fails Cites policy");
      expect(r.querySelector(".ui-fcl__trend")!.textContent).toBe("Up 18%");
      expect(row(el, "tone").querySelector(".ui-fcl__trend")!.textContent).toBe("Down 9%");
      expect(document.getElementById(row(el, "data").getAttribute("aria-describedby")!)!.textContent).toContain("Known");
      expect(el.querySelectorAll('.ui-fcl__row[tabindex="0"]')).toHaveLength(1);
      expect(r.getAttribute("tabindex")).toBe("0");
    });
  }

  test("total overrides the sum; shares follow it", async () => {
    const el = await make();
    el.total = 400;
    await settle();
    expect(el.querySelector(".ui-fcl__total")!.textContent).toBe("400 failing chats in 4 topics");
    expect(document.getElementById(row(el, "abroad").getAttribute("aria-describedby")!)!.textContent).toMatch(/^142 chats, 36%/);
  });

  test("opening a cluster shows its summary, quotes and actions; prevented, it stays closed", async () => {
    const el = await make();
    const seen: FailureClusterOpenChange[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent<FailureClusterOpenChange>).detail));
    row(el, "abroad").click();
    await settle();
    expect(el.open).toBe("abroad");
    expect(row(el, "abroad").getAttribute("aria-expanded")).toBe("true");
    const detail = document.getElementById(row(el, "abroad").getAttribute("aria-controls")!)!;
    expect(detail.querySelector(".ui-fcl__summary")!.textContent).toBe("Quotes the domestic limits for overseas trips.");
    expect(detail.querySelector(".ui-fcl__quote")!.textContent).toContain("Lisbon");
    expect([...detail.querySelectorAll(".ui-fcl__btn")].map((b) => b.textContent!.trim())).toEqual(["Open chats", "Add to dataset", "Mark as known"]);
    // Opening another closes the first – one at a time
    row(el, "leave").click();
    await settle();
    expect(el.open).toBe("leave");
    expect(row(el, "abroad").getAttribute("aria-expanded")).toBe("false");
    el.addEventListener("tc-open-change", (e) => e.preventDefault(), { once: true });
    row(el, "leave").click();
    await settle();
    expect(el.open).toBe("leave");
    expect(seen.map((s) => s.open)).toEqual(["abroad", "leave", null]);
  });

  test("actions: Open chats, Add to dataset (prevented keeps it), Mark as known moves it down", async () => {
    const el = await make();
    el.open = "abroad";
    await settle();
    const opened: FailureClusterAction[] = [];
    el.addEventListener("tc-cluster-open", (e) => opened.push((e as CustomEvent<FailureClusterAction>).detail));
    el.querySelector<HTMLButtonElement>('[data-action="open"]')!.click();
    expect(opened.map((o) => o.id)).toEqual(["abroad"]);
    el.addEventListener("tc-add-to-dataset", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>('[data-action="dataset"]')!.click();
    await settle();
    expect(el.querySelector('[data-action="dataset"]')).toBeTruthy();
    el.querySelector<HTMLButtonElement>('[data-action="dataset"]')!.click();
    await settle();
    expect(el.querySelector('[data-action="dataset"]')).toBeNull();
    expect(el.querySelector('[data-action="added"]')!.textContent).toBe("Added to dataset");
    expect(status(el)).toBe("Expense limits abroad: added to dataset");
    const known: FailureClusterKnownChange[] = [];
    el.addEventListener("tc-known-change", (e) => known.push((e as CustomEvent<FailureClusterKnownChange>).detail));
    el.querySelector<HTMLButtonElement>('[data-action="known"]')!.click();
    await settle();
    expect(known[0]).toEqual({ known: ["data", "abroad"], id: "abroad", isKnown: true });
    expect(names(el)).toEqual(["Carrying over leave", "Short replies", "Expense limits abroad", "Data retention"]);
    expect(el.querySelector('[data-action="known"]')!.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[data-action="known"]')!.textContent!.trim()).toBe("Mark as new");
    expect(status(el)).toBe("Expense limits abroad marked as known");
  });

  test("the criterion filter narrows the list and says so; prevented, it stays", async () => {
    const el = await make();
    const radios = [...el.querySelectorAll<HTMLInputElement>('.ui-fcl__filter input[type="radio"]')];
    expect(radios.map((r) => r.parentElement!.textContent!.trim())).toEqual(["All criteria", "Correctness", "Cites policy", "Tone"]);
    expect(radios[0].checked).toBe(true);
    radios[3].click();
    await settle();
    expect(el.criterion).toBe("Tone");
    expect(names(el)).toEqual(["Short replies"]);
    expect(el.querySelector(".ui-fcl__total")!.textContent).toBe("38 of 300 failing chats fail Tone");
    el.addEventListener("tc-criterion-change", (e) => e.preventDefault(), { once: true });
    radios[0].click();
    await settle();
    expect(el.criterion).toBe("Tone");
    expect(radios[3].checked).toBe(true);
  });

  test("keyboard: arrows, Home and End move between rows; Enter opens", async () => {
    const el = await make();
    row(el, "abroad").focus();
    key(row(el, "abroad"), "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(row(el, "leave"));
    expect(row(el, "leave").getAttribute("tabindex")).toBe("0");
    key(row(el, "leave"), "End");
    await expect.poll(() => document.activeElement).toBe(row(el, "data"));
    key(row(el, "data"), "Home");
    await expect.poll(() => document.activeElement).toBe(row(el, "abroad"));
    key(row(el, "abroad"), "ArrowUp");
    await settle();
    expect(document.activeElement).toBe(row(el, "abroad"));
  });

  test("bubbles: sized by count, pressing one shows its detail; empty and no-match states", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>('.ui-fcl__view[data-view="bubbles"]')!.click();
    await settle();
    expect(el.view).toBe("bubbles");
    const bubbles = [...el.querySelectorAll<HTMLButtonElement>(".ui-fcl__bubble")];
    expect(bubbles.map((b) => b.querySelector(".ui-fcl__bubble-label")!.textContent)).toEqual(["Expense limits abroad", "Carrying over leave", "Short replies", "Data retention"]);
    expect(bubbles[0].getBoundingClientRect().width).toBeGreaterThan(bubbles[2].getBoundingClientRect().width);
    bubbles[1].click();
    await settle();
    expect(bubbles[1].getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".ui-fcl__bubble-title")!.textContent).toBe("Carrying over leave");
    el.clusters = [];
    await settle();
    expect(el.querySelector(".ui-fcl__empty")!.textContent).toBe("No failing chats in this period.");
    expect(el.open).toBeNull();
  });

  test("React wrapper: uncontrolled open survives re-renders; controlled known waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    const render = (n: number) =>
      root.render(
        React.createElement(FailureClusters, {
          title: `Clusters ${n}`,
          clusters: CLUSTERS,
          known: [],
          onKnownChange: (known, id) => void seen.push([known, id]),
          onAddToDataset: (id) => {
            seen.push(`add ${id}`);
            return false;
          },
        }),
      );
    await act(async () => render(1));
    await settle();
    const el = host.querySelector("tc-failure-clusters")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Clusters 1");
    row(el, "abroad").click();
    await settle();
    await act(async () => render(2));
    await settle();
    expect(el.open).toBe("abroad");
    el.querySelector<HTMLButtonElement>('[data-action="known"]')!.click();
    await settle();
    expect(el.known).toEqual([]);
    el.querySelector<HTMLButtonElement>('[data-action="dataset"]')!.click();
    await settle();
    expect(el.querySelector('[data-action="dataset"]')).toBeTruthy();
    expect(seen).toEqual([[["abroad"], "abroad"], "add abroad"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, list and bubbles`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-failure-clusters description="Policy desk" .clusters=${CLUSTERS} .known=${["data"]} open="abroad"></tc-failure-clusters>
        <tc-failure-clusters look="clean" .clusters=${CLUSTERS} criterion="Correctness" open="leave"></tc-failure-clusters>
        <tc-failure-clusters look="clean" .clusters=${CLUSTERS} view="bubbles" open="tone"></tc-failure-clusters>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
