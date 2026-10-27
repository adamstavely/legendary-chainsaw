/*
 * <tc-change-summary> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/change-summary";
import type { MetricChange, TcChangeSummary } from "../../src/elements/change-summary";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const changes: MetricChange[] = [
  { label: "Active users", change: "Up 6.1% to 18.2K", tone: "good" },
  { label: "Churn", change: "Up 0.4 points", tone: "bad", direction: "up" },
  { label: "Sessions", change: "No change" },
];

describe("tc-change-summary", () => {
  test("the host is the root and the region, named by the heading", async () => {
    const el = await fixture<TcChangeSummary>(html`<tc-change-summary period="This week" .changes=${changes}></tc-change-summary>`);
    expect(el.dataset.ui).toBe("cs");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("What's changed");
    el.heading = "Since Monday";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Since Monday");
    expect(el.querySelector(".ui-cs__period")!.textContent).toBe("This week");
  });

  test("a name the page gives stays", async () => {
    const el = await fixture<TcChangeSummary>(html`<tc-change-summary aria-label="Weekly metrics" .changes=${changes}></tc-change-summary>`);
    expect(el.getAttribute("aria-label")).toBe("Weekly metrics");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the tone is said in words, not only by colour`, async () => {
      const el = await fixture<TcChangeSummary>(html`<tc-change-summary look=${look} .changes=${changes}></tc-change-summary>`);
      const dds = [...el.querySelectorAll("dd")].map((d) => d.textContent!.replace(/\s+/g, " ").trim());
      expect(dds).toEqual(["Good change: Up 6.1% to 18.2K", "Bad change: Up 0.4 points", "No change"]);
      // Bad is outlined as well as red (WCAG 1.4.1)
      const bad = el.querySelector<HTMLElement>('.ui-cs__trend[data-tone="bad"]')!;
      expect(getComputedStyle(bad).boxShadow).toMatch(/inset/);
    });

    test(`${look}: text that may be cut off keeps its full value in a title`, async () => {
      const el = await fixture<TcChangeSummary>(html`<tc-change-summary look=${look} .changes=${changes}></tc-change-summary>`);
      expect(el.querySelector(".ui-cs__label")!.getAttribute("title")).toBe("Active users");
      expect(el.querySelector(".ui-cs__text")!.getAttribute("title")).toBe("Up 6.1% to 18.2K");
    });
  }

  test("a custom icon is cloned in place of the default", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const el = await fixture<TcChangeSummary>(html`<tc-change-summary .icon=${icon} .changes=${changes}></tc-change-summary>`);
    expect(el.querySelector(".tc-head__icon svg[data-mine]")).toBeTruthy();
    expect(icon.isConnected).toBe(false);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-change-summary period="This week" .changes=${changes}></tc-change-summary>
      <tc-change-summary look="clean" heading="Clean" .changes=${changes}></tc-change-summary>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
