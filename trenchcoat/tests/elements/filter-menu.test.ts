/*
 * <tc-filter-menu> in real browsers – the React component's contract and regression checks, ported, plus windowing
 * for long option lists.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/filter-menu";
import { FilterMenu } from "../../src/elements/react/filter-menu";
import type { FilterGroup, TcFilterMenu } from "../../src/elements/filter-menu";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const GROUPS: FilterGroup[] = [
  { id: "status", label: "Status", options: [{ id: "new", label: "New" }, { id: "won", label: "Won" }] },
  { id: "my region", label: "Region", options: [{ id: "eu", label: "Europe" }] },
];
const looks = ["standard", "clean"] as const;

const checkbox = (root: Element, name: string) => [...root.querySelectorAll<HTMLElement>('[role="checkbox"]')].find((b) => b.textContent!.trim() === name)!;
const head = (root: Element, name: string) => [...root.querySelectorAll<HTMLElement>(".ui-fm__group-head")].find((b) => b.querySelector(".ui-fm__group-label")!.textContent === name)!;
const byLabel = (root: Element, label: string) => root.querySelector<HTMLElement>(`[aria-label="${label}"]`);
const picked = (root: Element) => {
  const out: Record<string, string[]> = {};
  root.querySelectorAll<HTMLElement>('[role="checkbox"][aria-checked="true"]').forEach((b) => {
    const [, g, o] = b.dataset.key!.split(":");
    (out[g] ??= []).push(o);
  });
  return out;
};
const key = async (target: Element, k: string) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await settle();
};
/** Focus rescue runs from a MutationObserver: wait for it */
const until = async (check: () => boolean) => {
  for (let i = 0; i < 50 && !check(); i++) await new Promise((r) => setTimeout(r, 10));
  expect(check()).toBe(true);
};

describe("tc-filter-menu", () => {
  for (const look of looks) {
    test(`${look}: the host is the root; the heading, the card and the hints`, async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu look=${look} heading="Filter leads" .groups=${GROUPS}></tc-filter-menu>`);
      expect(el.dataset.ui).toBe("fm");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Filter leads");
      expect(!!el.querySelector(":scope > .ui-fm__card")).toBe(look === "standard");
      expect(el.querySelector(".ui-fm__hints")).toBeTruthy();
      el.hints = false;
      await settle();
      expect(el.querySelector(".ui-fm__hints")).toBeNull();
      // The first group starts open
      expect(head(el, "Status").getAttribute("aria-expanded")).toBe("true");
      expect(head(el, "Region").getAttribute("aria-expanded")).toBe("false");
    });

    test(`${look}: two menus with the same groups get distinct panel ids, none built from group ids`, async () => {
      const wrap = await fixture(html`<div>
        <tc-filter-menu look=${look} .groups=${GROUPS} .open=${["status", "my region"]}></tc-filter-menu>
        <tc-filter-menu look=${look} .groups=${GROUPS} .open=${["status", "my region"]}></tc-filter-menu>
      </div>`);
      const ids = [...wrap.querySelectorAll('[role="group"][id]')].map((p) => p.id);
      expect(ids).toHaveLength(4);
      expect(new Set(ids).size).toBe(4);
      expect(ids.some((id) => id.includes("status") || id.includes("region"))).toBe(false);
      wrap.querySelectorAll("[aria-controls]").forEach((b) => expect(wrap.querySelector(`#${CSS.escape(b.getAttribute("aria-controls")!)}`)).toBeTruthy());
    });

    test(`${look}: name submits one field per picked option; disabled leaves them out and blocks changes`, async () => {
      const form = await fixture<HTMLFormElement>(html`<form><tc-filter-menu look=${look} name="f" .groups=${GROUPS} .value=${{ status: ["new", "won"], "my region": ["eu"] }}></tc-filter-menu></form>`);
      const el = form.querySelector("tc-filter-menu")!;
      expect(new FormData(form).getAll("f[status]")).toEqual(["new", "won"]);
      expect(new FormData(form).getAll("f[my region]")).toEqual(["eu"]);
      const onChange = vi.fn();
      el.addEventListener("tc-value-change", onChange);
      el.value = { status: ["new"] };
      el.disabled = true;
      await settle();
      expect([...new FormData(form).keys()]).toEqual([]);
      expect(el.hasAttribute("data-disabled")).toBe(true);
      checkbox(el, "Won").click();
      await settle();
      expect(onChange).not.toHaveBeenCalled();
      expect(picked(el)).toEqual({ status: ["new"] });
      expect(el.querySelector<HTMLButtonElement>(".ui-fm__clear")!.disabled).toBe(true);
    });

    test(`${look}: uncontrolled – a click picks and reports; Clear all empties`, async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu look=${look} .groups=${GROUPS}></tc-filter-menu>`);
      const seen: unknown[] = [];
      el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent).detail.value));
      checkbox(el, "New").click();
      await settle();
      expect(seen).toEqual([{ status: ["new"] }]);
      expect(picked(el)).toEqual({ status: ["new"] });
      expect(head(el, "Status").querySelector(".ui-fm__group-picked")!.textContent!.trim()).toBe("1 filter");
      el.querySelector<HTMLButtonElement>(".ui-fm__clear")!.click();
      await settle();
      expect(picked(el)).toEqual({});
    });

    test(`${look}: controlled value and open groups only report`, async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu look=${look} .groups=${GROUPS} .value=${{}} .open=${["status"]}></tc-filter-menu>`);
      const values: unknown[] = [];
      const opens: unknown[] = [];
      el.addEventListener("tc-value-change", (e) => {
        e.preventDefault();
        values.push((e as CustomEvent).detail.value);
      });
      el.addEventListener("tc-open-change", (e) => {
        e.preventDefault();
        opens.push((e as CustomEvent).detail.open);
      });
      checkbox(el, "New").click();
      await settle();
      expect(values).toEqual([{ status: ["new"] }]);
      expect(checkbox(el, "New").getAttribute("aria-checked")).toBe("false");
      head(el, "Region").click();
      await settle();
      expect(opens).toEqual([["status", "my region"]]);
      expect(head(el, "Region").getAttribute("aria-expanded")).toBe("false");
      // …and follow the values given
      el.value = { status: ["won"], "my region": ["eu"] };
      el.open = ["my region"];
      await settle();
      expect(picked(el)).toEqual({ status: ["won"], "my region": ["eu"] });
      expect([...el.querySelectorAll<HTMLElement>('[aria-expanded="true"][data-key]')].map((b) => b.dataset.key!.slice(2))).toEqual(["my region"]);
    });

    test(`${look}: a folded group's options are inert; heads and visible options are all in the Tab order`, async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu look=${look} .groups=${GROUPS}></tc-filter-menu>`);
      const panels = el.querySelectorAll(".ui-fm__panel");
      expect(panels[0].hasAttribute("inert")).toBe(false);
      expect(panels[1].hasAttribute("inert")).toBe(true);
      el.querySelectorAll(".ui-fm__group-head, .ui-fm__option").forEach((b) => expect(b.getAttribute("tabindex")).toBeNull());
      head(el, "Status").click();
      await settle();
      expect(panels[0].hasAttribute("inert")).toBe(true);
    });

    test(`${look}: no live region inside buttons or around the chips; a status region is there from mount and reports the count`, async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu look=${look} .groups=${GROUPS}></tc-filter-menu>`);
      expect(el.querySelectorAll("[aria-live]")).toHaveLength(0);
      const status = el.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      checkbox(el, "New").click();
      await settle();
      expect(status.textContent).toBe("1 filter active");
      expect(el.querySelector('[role="status"]')).toBe(status);
      checkbox(el, "New").click();
      await settle();
      expect(status.textContent).toBe("No filters");
    });

    test(`${look}: keyboard – ↑ ↓ Home End move, → opens, ← folds (focus to the head first), Enter and Space pick`, async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu look=${look} .groups=${GROUPS}></tc-filter-menu>`);
      head(el, "Status").focus();
      await key(document.activeElement!, "ArrowDown");
      expect(document.activeElement).toBe(checkbox(el, "New"));
      await key(document.activeElement!, " ");
      expect(picked(el)).toEqual({ status: ["new"] });
      await key(document.activeElement!, "End");
      expect(document.activeElement).toBe(head(el, "Region"));
      await key(document.activeElement!, "ArrowRight");
      expect(head(el, "Region").getAttribute("aria-expanded")).toBe("true");
      await key(document.activeElement!, "ArrowDown");
      expect(document.activeElement).toBe(checkbox(el, "Europe"));
      await key(document.activeElement!, "Enter");
      expect(picked(el)).toEqual({ status: ["new"], "my region": ["eu"] });
      await key(document.activeElement!, "Home");
      expect(document.activeElement).toBe(head(el, "Status"));
      await key(document.activeElement!, "ArrowUp");
      expect(document.activeElement).toBe(head(el, "Status"));
      const won = checkbox(el, "Won");
      won.focus();
      await key(won, "ArrowLeft");
      expect(document.activeElement).toBe(head(el, "Status"));
      expect(head(el, "Status").getAttribute("aria-expanded")).toBe("false");
    });

    test(`${look}: folding from outside while an option has focus moves focus to the group head`, async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu look=${look} .groups=${GROUPS} .open=${["status"]}></tc-filter-menu>`);
      checkbox(el, "Won").focus();
      el.open = [];
      await settle();
      await until(() => document.activeElement === head(el, "Status"));
    });

    test(`${look}: removing a chip moves focus to the next chip's ×, then the previous, then the first group head`, async () => {
      const wrap = await fixture(html`<div style="width: 800px"><tc-filter-menu look=${look} .groups=${GROUPS} .value=${{ status: ["new", "won"], "my region": ["eu"] }}></tc-filter-menu></div>`);
      const el = wrap.firstElementChild as TcFilterMenu;
      const first = byLabel(el, "Remove New")!;
      first.focus();
      first.click();
      await settle();
      await until(() => document.activeElement === byLabel(el, "Remove Won"));
      const lastX = byLabel(el, "Remove Europe")!;
      lastX.focus();
      lastX.click();
      await settle();
      await until(() => document.activeElement === byLabel(el, "Remove Won"));
      (document.activeElement as HTMLElement).click();
      await settle();
      await until(() => document.activeElement === head(el, "Status"));
    });

    test(`${look}: Clear all (disabled once empty) hands focus to the first group head`, async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu look=${look} .groups=${GROUPS} .value=${{ status: ["new"] }}></tc-filter-menu>`);
      const clear = el.querySelector<HTMLButtonElement>(".ui-fm__clear")!;
      clear.focus();
      clear.click();
      await settle();
      expect(clear.disabled).toBe(true);
      await until(() => document.activeElement === head(el, "Status"));
    });
  }

  test('clean: chips stay on one line; "+N" shows every hidden chip (removable) and folds back', async () => {
    const many = { status: ["new", "won"], "my region": ["eu"] };
    const wrap = await fixture(html`<div style="width: 150px"><tc-filter-menu look="clean" .groups=${GROUPS} .value=${many}></tc-filter-menu></div>`);
    const el = wrap.firstElementChild as TcFilterMenu;
    await settle();
    const more = el.querySelector<HTMLButtonElement>(".ui-fm__chips > .ui-fm__more")!;
    expect(more.getAttribute("aria-expanded")).toBe("false");
    const hidden = Number(more.querySelector(".ui-fm__roll")!.textContent!.slice(1));
    expect(hidden).toBeGreaterThan(0);
    expect(el.querySelectorAll(".ui-fm__chips > .ui-fm__chip:not(.ui-fm__more)")).toHaveLength(3 - hidden);
    expect(more.querySelector(".ui-fm__sr")!.textContent).toMatch(new RegExp(`^Show ${hidden} more: `));
    more.click();
    await settle();
    expect(byLabel(el, "Remove New")).toBeTruthy();
    expect(byLabel(el, "Remove Europe")).toBeTruthy();
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(more.textContent).toBe("Show less");
    more.click();
    await settle();
    expect(el.querySelectorAll(".ui-fm__chips > .ui-fm__chip:not(.ui-fm__more)")).toHaveLength(3 - hidden);
    // Wide enough, every chip fits and there's no "+N"
    wrap.style.width = "800px";
    await expect.poll(() => el.querySelector(".ui-fm__chips > .ui-fm__more"), { timeout: 3000 }).toBeNull();
    await settle();
    expect(el.querySelectorAll(".ui-fm__chips > .ui-fm__chip")).toHaveLength(3);
  });

  describe("windowing", () => {
    const N = 5000;
    const LONG: FilterGroup[] = [
      { id: "tag", label: "Tag", options: Array.from({ length: N }, (_, i) => ({ id: `t${i}`, label: `Tag ${i}` })) },
      { id: "status", label: "Status", options: [{ id: "new", label: "New" }] },
    ];

    test("a group with thousands of options renders only the ones near the viewport, with spacers for the rest", async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu .groups=${LONG}></tc-filter-menu>`);
      const rendered = el.querySelectorAll('.ui-fm__panel-inner[data-group="tag"] .ui-fm__option').length;
      expect(rendered).toBeGreaterThan(0);
      expect(rendered).toBeLessThan(200);
      const panel = el.querySelector<HTMLElement>('.ui-fm__panel-inner[data-group="tag"]')!;
      // The spacers keep the full height: about N rows
      const row = panel.querySelector<HTMLElement>(".ui-fm__option")!.offsetHeight;
      expect(panel.scrollHeight).toBeGreaterThan(N * row * 0.95);
      // The count shows every option
      expect(head(el, "Tag").querySelector(".ui-fm__group-count")!.textContent).toBe(String(N));
    });

    test("scrolling the page moves the window", async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu .groups=${LONG}></tc-filter-menu>`);
      const panel = el.querySelector<HTMLElement>('.ui-fm__panel-inner[data-group="tag"]')!;
      expect(panel.querySelector('[data-key="o:tag:t2500"]')).toBeNull();
      const row = panel.querySelector<HTMLElement>(".ui-fm__option")!.offsetHeight;
      window.scrollTo(0, panel.getBoundingClientRect().top + window.scrollY + 2500 * row);
      await expect.poll(() => !!panel.querySelector('[data-key="o:tag:t2500"]'), { timeout: 3000 }).toBe(true);
      await settle();
      expect(panel.querySelector('[data-key="o:tag:t0"]')).toBeNull();
      window.scrollTo(0, 0);
    });

    test("End and ↑ reach options outside the window; picking one works and the form gets it", async () => {
      const form = await fixture<HTMLFormElement>(html`<form><tc-filter-menu name="f" .groups=${LONG}></tc-filter-menu></form>`);
      const el = form.querySelector("tc-filter-menu")!;
      head(el, "Tag").focus();
      // End goes to the last head; ↑ from there to the last option of the long group
      await key(document.activeElement!, "End");
      expect(document.activeElement).toBe(head(el, "Status"));
      await key(document.activeElement!, "ArrowUp");
      await until(() => (document.activeElement as HTMLElement).dataset.key === `o:tag:t${N - 1}`);
      await key(document.activeElement!, " ");
      expect(new FormData(form).getAll("f[tag]")).toEqual([`t${N - 1}`]);
      expect(checkbox(el, `Tag ${N - 1}`).getAttribute("aria-checked")).toBe("true");
      window.scrollTo(0, 0);
    });

    test("the focused option stays rendered when the page scrolls away from it", async () => {
      const el = await fixture<TcFilterMenu>(html`<tc-filter-menu .groups=${LONG}></tc-filter-menu>`);
      const first = checkbox(el, "Tag 0");
      first.focus();
      const panel = el.querySelector<HTMLElement>('.ui-fm__panel-inner[data-group="tag"]')!;
      window.scrollTo(0, panel.getBoundingClientRect().top + window.scrollY + 3000 * first.offsetHeight);
      await expect.poll(() => !!panel.querySelector('[data-key="o:tag:t3000"]'), { timeout: 3000 }).toBe(true);
      await settle();
      expect(document.activeElement).toBe(first);
      expect(first.isConnected).toBe(true);
      // Its place is kept: spacers on both sides add up to the full list
      expect(Math.abs(panel.scrollHeight - N * first.offsetHeight)).toBeLessThan(first.offsetHeight * 3);
      window.scrollTo(0, 0);
    });
  });

  test("React wrapper: controlled value with uncontrolled open groups – a group opened by hand stays open when the value changes", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    function App() {
      const [value, setValue] = React.useState<Record<string, string[]>>({});
      return React.createElement(FilterMenu, { groups: GROUPS, value, onChange: setValue, title: "Filter leads" });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-filter-menu")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Filter leads");
    await act(async () => head(el, "Region").click());
    await settle();
    expect(head(el, "Region").getAttribute("aria-expanded")).toBe("true");
    await act(async () => checkbox(el, "Europe").click());
    await settle();
    expect(picked(el)).toEqual({ "my region": ["eu"] });
    expect(head(el, "Region").getAttribute("aria-expanded")).toBe("true");
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-filter-menu name="f" .groups=${GROUPS} .value=${{ status: ["new"] }}></tc-filter-menu>
      <tc-filter-menu look="clean" heading="Clean" .groups=${GROUPS} .value=${{ status: ["new"] }}></tc-filter-menu>
    </div>`);
    // Chips fade in: check the colours they settle on
    document.getAnimations().forEach((a) => a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
