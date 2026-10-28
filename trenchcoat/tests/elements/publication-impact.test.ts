import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/publication-impact";
import type { PublicationFeedback, PublicationFeedbackFilter, PublicationFilterChange, TcPublicationImpact } from "../../src/elements/publication-impact";
import { PublicationImpact } from "../../src/elements/react/publication-impact";
import { cleanup, finish, fixture, settle } from "./helpers";

/*
 * <tc-publication-impact> in real browsers: the header, reach figures and sparkline, mentions, the embedded audience
 * mix, feedback with its summary and the radio-group filter (cancelable), the React wrapper and axe in both looks and
 * both themes.
 */

afterEach(cleanup);

const FEEDBACK: PublicationFeedback[] = [
  { id: "a", kind: "peer", who: "Reviewer 2", where: "Journal of Applied Sensing", date: Date.UTC(2025, 8, 2, 12), quote: "Baseline under-tuned.", sentiment: "mixed" },
  { id: "b", kind: "reader", who: "Dr. Ines Marlow", where: "Northfield Lab", quote: "Reproduced it.", sentiment: "positive" },
  { id: "c", kind: "sponsor", who: "Programme manager", quote: "Brief the board.", sentiment: "positive" },
];
const filterOpts = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-pubi__filter-opt")];
const quotes = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-pubi__quote")].map((q) => q.dataset.kind);
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcPublicationImpact>(html`<tc-publication-impact
    look=${look}
    heading="Self-Calibrating Coastal Sensors"
    venue="Journal of Applied Sensing"
    .date=${Date.UTC(2025, 10, 4, 12)}
    .topic=${{ label: "Ocean Sensing", href: "#topic" }}
    .grade=${{ label: "Outstanding", tone: "success" }}
    .authors=${[{ name: "Ada Okafor" }, { name: "Tomas Lindqvist" }]}
    outcome="resolves gap"
    .metrics=${{ downloads: 18000, views: 46000, citations: 73, attention: 284 }}
    .reads=${[400, 2600, 9100, 18000]}
    .mentions=${[{ label: "News", value: 11 }, { label: "Policy", value: 3 }]}
    .audience=${{ sectors: [{ label: "Academic", value: 54 }, { label: "Industry", value: 46 }], split: { internal: 6, external: 94 } }}
    .feedback=${FEEDBACK}
  ></tc-publication-impact>`);
const runAxe = async (wrap: Element) => {
  await finish(wrap);
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const react = async (node: React.ReactElement) => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(node));
  await settle();
  return { host, root };
};

describe("tc-publication-impact", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: an article named by the title, with the header, reach, mentions, audience and feedback`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("pubi");
      expect(el.dataset.look).toBe(look);
      const card = el.querySelector("article")!;
      expect(document.getElementById(card.getAttribute("aria-labelledby")!)!.textContent).toBe("Self-Calibrating Coastal Sensors");
      expect(el.querySelector(".ui-pubi__venue")!.textContent).toBe("Journal of Applied Sensing");
      expect(el.querySelector<HTMLAnchorElement>("a.ui-pubi__topic")!.getAttribute("href")).toBe("#topic");
      expect(el.querySelector(".ui-pubi__grade-label")!.textContent).toBe("Assessment");
      expect(el.querySelector(".ui-pubi__grade-value")!.textContent!.trim()).toBe("Outstanding");
      expect(el.querySelector(".ui-pubi__names")!.textContent).toBe("Okafor, Lindqvist");
      expect(el.querySelector(".ui-pubi__outcome")!.textContent).toBe("resolves gap");
      expect([...el.querySelectorAll(".ui-pubi__stat-label")].map((d) => d.textContent!.trim())).toEqual(["Downloads", "Views", "Citations", "Attention score"]);
      expect(el.querySelector(".ui-pubi__spark")!.getAttribute("aria-label")).toBe(`Cumulative reads, rising to ${new Intl.NumberFormat().format(18000)}`);
      expect(el.querySelectorAll(".ui-pubi__mention")).toHaveLength(2);
      const mix = el.querySelector("tc-audience-mix")!;
      expect(mix.hasAttribute("embedded")).toBe(true);
      expect(mix.dataset.look).toBe(look);
      expect(el.querySelector(".ui-pubi__summary")!.textContent).toBe("2 positive · 1 mixed");
      expect(quotes(el)).toEqual(["peer", "reader", "sponsor"]);
    });
  }

  test("sections without data are left out", async () => {
    const el = await fixture<TcPublicationImpact>(html`<tc-publication-impact heading="A paper"></tc-publication-impact>`);
    expect(el.querySelector(".ui-pubi__reach")).toBeNull();
    expect(el.querySelector(".ui-pubi__mentions")).toBeNull();
    expect(el.querySelector("tc-audience-mix")).toBeNull();
    expect(el.querySelector(".ui-pubi__filter")).toBeNull();
    expect(el.querySelector(".ui-pubi__grade")).toBeNull();
  });

  test("the filter is a radio group: click or arrows pick a kind, firing a cancelable tc-filter-change", async () => {
    const el = await make();
    const group = el.querySelector(".ui-pubi__filter")!;
    expect(group.getAttribute("role")).toBe("radiogroup");
    expect(filterOpts(el).map((o) => o.textContent)).toEqual(["All", "Peer", "Reader", "Sponsor"]);
    const seen: PublicationFeedbackFilter[] = [];
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent<PublicationFilterChange>).detail.filter));
    filterOpts(el)[2].click();
    await settle();
    expect(el.filter).toBe("reader");
    expect(quotes(el)).toEqual(["reader"]);
    expect(filterOpts(el)[2].getAttribute("aria-checked")).toBe("true");
    filterOpts(el)[2].focus();
    key(filterOpts(el)[2], "ArrowRight");
    await expect.poll(() => el.filter).toBe("sponsor");
    await expect.poll(() => document.activeElement?.getAttribute("data-filter")).toBe("sponsor");
    key(document.activeElement!, "ArrowRight");
    await expect.poll(() => el.filter).toBe("all");
    key(document.activeElement!, "End");
    await expect.poll(() => el.filter).toBe("sponsor");
    expect(seen).toEqual(["reader", "sponsor", "all", "sponsor"]);
    el.addEventListener("tc-filter-change", (e) => e.preventDefault());
    filterOpts(el)[1].click();
    await settle();
    expect(el.filter).toBe("sponsor");
  });

  test("a filter whose kind has no quotes falls back to All", async () => {
    const el = await make();
    el.filter = "peer";
    await settle();
    expect(quotes(el)).toEqual(["peer"]);
    el.feedback = FEEDBACK.filter((f) => f.kind !== "peer");
    await settle();
    expect(el.filter).toBe("all");
    expect(filterOpts(el).map((o) => o.textContent)).toEqual(["All", "Reader", "Sponsor"]);
  });

  test("React wrapper: a controlled filter stays until the parent changes it", async () => {
    const asked: PublicationFeedbackFilter[] = [];
    const { host, root } = await react(React.createElement(PublicationImpact, { title: "A paper", feedback: FEEDBACK, filter: "all", onFilterChange: (f) => void asked.push(f) }));
    const el = host.querySelector("tc-publication-impact")!;
    expect(el.querySelector(".ui-pubi__title")!.textContent).toBe("A paper");
    filterOpts(el)[1].click();
    await settle();
    expect(asked).toEqual(["peer"]);
    expect(el.filter).toBe("all");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-publication-impact heading="Self-Calibrating Coastal Sensors" venue="JAS" .grade=${{ label: "Outstanding" }} .authors=${[{ name: "Ada Okafor" }]} outcome="resolves gap" .metrics=${{ downloads: 18000, citations: 73 }} .reads=${[1, 4, 9]} .mentions=${[{ label: "News", value: 11 }]} .audience=${{ sectors: [{ label: "Academic", value: 54 }], split: { internal: 6, external: 94 } }} .feedback=${FEEDBACK}></tc-publication-impact>
        <tc-publication-impact look="clean" heading="Second" .feedback=${FEEDBACK} .grade=${{ label: "Satisfactory", tone: "neutral" }}></tc-publication-impact>
      </div>`);
      expect(await runAxe(wrap)).toEqual([]);
    });
  }
});
