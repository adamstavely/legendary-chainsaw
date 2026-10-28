/*
 * <tc-work-item> in real browsers: the title as its button or link, status in words, progress, due and overdue,
 * people, outcome, money against budget, the source badge, opening (and cancelling it), the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/work-item";
import type { TcWorkItem, WorkOpen } from "../../src/elements/work-item";
import { WorkItem } from "../../src/elements/react/work-item";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = new Date(2026, 6, 20, 12).getTime();
const at = (m: number, d: number, h = 12) => new Date(2026, m - 1, d, h).getTime();
const text = (el: Element, sel: string) => el.querySelector(sel)?.textContent?.replace(/\s+/g, " ").trim();
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcWorkItem>(html`<tc-work-item
    look=${look}
    heading="NeuroBench-E harness"
    status="active"
    note="Energy-normalised benchmark."
    .progress=${0.6}
    .due=${at(8, 15)}
    .now=${NOW}
    .people=${[{ name: "Jonah Tran" }, { name: "Elena Castellanos" }]}
    outcome="fills 1 gap"
    .spent=${360_000}
    .budget=${600_000}
    effort="1.5 FTE"
    source="Synced · read-only"
  ></tc-work-item>`);

describe("tc-work-item", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the title is a button in a heading; status, progress, due, people, outcome, money, effort and source`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("wki");
      expect(el.dataset.look).toBe(look);
      const title = el.querySelector("h4 > button.ui-wki__title")!;
      expect(title.textContent).toBe("NeuroBench-E harness");
      expect(text(el, ".ui-wki__status")).toBe("Status: Active");
      expect(el.querySelector(".ui-wki__status svg")!.getAttribute("aria-hidden")).toBe("true");
      expect(text(el, ".ui-wki__note")).toBe("Energy-normalised benchmark.");
      const bar = el.querySelector('[role="progressbar"]')!;
      expect([bar.getAttribute("aria-label"), bar.getAttribute("aria-valuenow")]).toEqual(["Progress", "60"]);
      expect(text(el, ".ui-wki__progress-n")).toBe("60%");
      expect(text(el, ".ui-wki__due")).toBe(`Due ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(at(8, 15))}`);
      expect(el.querySelector(".ui-wki__due")!.hasAttribute("data-overdue")).toBe(false);
      expect(el.querySelector(".ui-wki__people")!.getAttribute("aria-label")).toBe("People: Jonah Tran, Elena Castellanos");
      expect([...el.querySelectorAll(".ui-wki__avatar")].map((a) => a.textContent)).toEqual(["JT", "EC"]);
      expect(text(el, ".ui-wki__outcome")).toBe("fills 1 gap");
      expect(text(el, ".ui-wki__money-n")).toBe("$360K / $600K spent");
      expect(el.querySelector<HTMLElement>(".ui-wki__money-bar > span")!.style.inlineSize).toBe("60%");
      expect(text(el, ".ui-wki__effort")).toBe("1.5 FTE");
      expect(text(el, ".ui-wki__source")).toBe("Synced · read-only");
    });
  }

  test("overdue once the due day has passed – not on the day itself, not when done; over budget says so", async () => {
    const el = await make();
    el.due = at(7, 20, 9);
    await settle();
    expect(el.querySelector(".ui-wki__due")!.hasAttribute("data-overdue")).toBe(false);
    el.due = at(6, 30);
    await settle();
    expect(el.querySelector(".ui-wki__due")!.hasAttribute("data-overdue")).toBe(true);
    expect(text(el, ".ui-wki__due")).toBe(`Overdue${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(at(6, 30))}`);
    el.status = "done";
    await settle();
    expect(el.querySelector(".ui-wki__due")!.hasAttribute("data-overdue")).toBe(false);
    el.spent = 650_000;
    await settle();
    expect(text(el, ".ui-wki__money-n")).toBe("$650K / $600K · over budget");
    expect(el.querySelector(".ui-wki__money")!.hasAttribute("data-over")).toBe(true);
    expect(el.querySelector<HTMLElement>(".ui-wki__money-bar > span")!.style.inlineSize).toBe("100%");
  });

  test("without `now`, overdue is judged against today", async () => {
    const el = await fixture<TcWorkItem>(html`<tc-work-item heading="Old work" .due=${Date.UTC(2001, 0, 1)}></tc-work-item>`);
    expect(el.querySelector(".ui-wki__due")!.hasAttribute("data-overdue")).toBe(true);
  });

  test("statuses can be renamed; blocked and paused read their words; parts left unset aren't shown", async () => {
    const el = await fixture<TcWorkItem>(html`<tc-work-item heading="Rule" status="blocked" .statusLabels=${{ blocked: "Stuck" }}></tc-work-item>`);
    expect(text(el, ".ui-wki__status")).toBe("Status: Stuck");
    el.status = "paused";
    await settle();
    expect(text(el, ".ui-wki__status")).toBe("Status: Paused");
    expect(el.querySelector('[role="progressbar"]')).toBeNull();
    expect(el.querySelector(".ui-wki__foot")).toBeNull();
    expect(el.querySelector(".ui-wki__meta")!.children).toHaveLength(0);
  });

  test("opening: a button fires tc-open; with href it's a link, and preventing tc-open stops it following", async () => {
    const el = await make();
    const seen: WorkOpen[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent<WorkOpen>).detail));
    el.querySelector<HTMLElement>(".ui-wki__title")!.click();
    expect(seen).toEqual([{ href: undefined }]);
    el.href = "#work-42";
    await settle();
    const link = el.querySelector<HTMLAnchorElement>("a.ui-wki__title")!;
    expect(link.getAttribute("href")).toBe("#work-42");
    el.addEventListener("tc-open", (e) => e.preventDefault());
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(seen).toEqual([{ href: undefined }, { href: "#work-42" }]);
  });

  test("the whole card is the title's target, and focusing the title rings the card", async () => {
    const el = await make();
    const title = el.querySelector<HTMLElement>(".ui-wki__title")!;
    const card = el.getBoundingClientRect();
    const target = getComputedStyle(title, "::after");
    expect(target.position).toBe("absolute");
    // A click near the card's corner lands on the title's stretched target
    const hit = document.elementFromPoint(card.right - 4, card.bottom - 4);
    expect(hit === title || title.contains(hit)).toBe(true);
    title.focus({ focusVisible: true } as FocusOptions);
    await settle();
    expect(document.activeElement).toBe(title);
  });

  test("React wrapper: title and onOpen; returning false prevents the link", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (string | undefined)[] = [];
    await act(async () =>
      root.render(
        React.createElement(WorkItem, {
          title: "Compiler",
          status: "review",
          href: "#compiler",
          onOpen: (href) => {
            seen.push(href);
            return false;
          },
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-work-item")!;
    expect(el.querySelector(".ui-wki__title")!.textContent).toBe("Compiler");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    el.querySelector("a.ui-wki__title")!.dispatchEvent(click);
    expect(seen).toEqual(["#compiler"]);
    expect(click.defaultPrevented).toBe(true);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 12px; grid-template-columns: 1fr 1fr">
        <tc-work-item heading="Harness" status="active" note="On track." .progress=${0.6} .due=${at(8, 15)} .now=${NOW} .people=${[{ name: "Jonah Tran" }]} outcome="fills 1 gap" .spent=${360_000} .budget=${600_000} effort="1.5 FTE" source="Synced · read-only"></tc-work-item>
        <tc-work-item look="clean" heading="Rule" status="blocked" note="Waiting on chips." .progress=${0.35} .due=${at(6, 1)} .now=${NOW} .spent=${950_000} .budget=${900_000} href="#rule"></tc-work-item>
        <tc-work-item heading="Compiler" status="review" .progress=${0.9}></tc-work-item>
        <tc-work-item look="clean" heading="Mapping" status="done" .progress=${1}></tc-work-item>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
