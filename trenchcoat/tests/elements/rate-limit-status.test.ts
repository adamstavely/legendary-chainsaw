/*
 * <tc-rate-limit-status> in real browsers: the rows tightest first, the meters with their value text, the headroom in
 * words with the reset countdown from `now` and from its own clock, 429s and the sparkline in words, the sort with its
 * cancelable event, renamed labels, the empty state, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/rate-limit-status";
import {
  rateLimitCountdown,
  rateLimitHeadroom,
  rateLimitShare,
  type RateLimitRow,
  type RateLimitSortChange,
  type TcRateLimitStatus,
} from "../../src/elements/rate-limit-status";
import { RateLimitStatus } from "../../src/elements/react/rate-limit-status";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = new Date(2026, 10, 13, 10, 30).getTime();
const ROWS: RateLimitRow[] = [
  {
    id: "small",
    provider: "Model provider",
    model: "small-2",
    tier: "Tier 3",
    requests: { used: 3900, limit: 10000 },
    inputTokens: { used: 1_150_000, limit: 2_000_000 },
    throttled: 0,
    history: [0.3, 0.4, 0.5, 0.45],
  },
  {
    id: "large",
    provider: "Model provider",
    model: "large-1",
    tier: "Tier 3",
    requests: { used: 4620, limit: 5000 },
    inputTokens: { used: 812_000, limit: 800_000 },
    outputTokens: { used: 96_000, limit: 160_000 },
    resetAt: NOW + 18_000,
    throttled: 37,
    history: [0.8, 0.9, 1.02],
  },
  {
    id: "alt",
    provider: "Another provider",
    model: "general-3",
    requests: { used: 410, limit: 500 },
    throttled: 1,
  },
];

const rowEl = (el: Element, model: string) => [...el.querySelectorAll<HTMLElement>(".ui-rlst__row")].find((r) => r.querySelector(".ui-rlst__model")!.textContent === model)!;
const models = (el: Element) => [...el.querySelectorAll(".ui-rlst__model")].map((m) => m.textContent);
const make = (look: "standard" | "clean" = "standard") => fixture<TcRateLimitStatus>(html`<tc-rate-limit-status look=${look} .rows=${ROWS} .now=${NOW} locale="en-US"></tc-rate-limit-status>`);

describe("tc-rate-limit-status", () => {
  test("rateLimitShare, rateLimitHeadroom and rateLimitCountdown", () => {
    expect(rateLimitShare(ROWS[1])).toBeCloseTo(1.015);
    expect(rateLimitHeadroom(ROWS[0])).toBe("plenty");
    expect(rateLimitHeadroom(ROWS[1])).toBe("limited");
    expect(rateLimitHeadroom(ROWS[2])).toBe("near");
    expect(rateLimitHeadroom({ id: "x", provider: "p", model: "m" })).toBe("plenty");
    expect(rateLimitCountdown(18_000)).toBe("18 s");
    expect(rateLimitCountdown(17_200)).toBe("18 s");
    expect(rateLimitCountdown(125_000)).toBe("2 min 5 s");
    expect(rateLimitCountdown(120_000)).toBe("2 min");
    expect(rateLimitCountdown(-5)).toBe("0 s");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: rows tightest first, meters with value text, headroom and 429s in words`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rlst");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Rate limits");
      expect(models(el)).toEqual(["large-1", "general-3", "small-2"]);
      const large = rowEl(el, "large-1");
      const meters = large.querySelectorAll('[role="meter"]');
      expect(meters).toHaveLength(3);
      const input = meters[1];
      expect(input.getAttribute("aria-valuetext")).toBe("812,000 of 800,000 input tokens a minute, 101%");
      expect(input.getAttribute("aria-valuenow")).toBe("800000");
      expect(input.getAttribute("aria-valuemax")).toBe("800000");
      const label = el.querySelector(`#${CSS.escape(input.getAttribute("aria-labelledby")!)}`)!;
      expect(label.textContent).toBe("Input tokens / min");
      expect(large.querySelector(".ui-rlst__headroom")!.textContent!.trim()).toBe("Limited – resets in 18 s");
      expect(large.querySelector(".ui-rlst__headroom")!.getAttribute("data-tone")).toBe("danger");
      expect(rowEl(el, "general-3").querySelector(".ui-rlst__headroom")!.textContent!.trim()).toBe("Near limit");
      expect(rowEl(el, "small-2").querySelector(".ui-rlst__headroom")!.textContent!.trim()).toBe("Plenty");
      expect(large.querySelector(".ui-rlst__throttled")!.textContent).toBe("37 rate-limited requests in the last hour");
      expect(rowEl(el, "general-3").querySelector(".ui-rlst__throttled")!.textContent).toBe("1 rate-limited request in the last hour");
      expect(rowEl(el, "small-2").querySelector(".ui-rlst__throttled")!.textContent).toBe("No rate-limited requests in the last hour");
      expect(large.querySelector(".ui-rlst__spark-text")!.textContent).toBe("Peak in the last hour: 102% of the limit");
      expect(large.querySelector(".ui-rlst__spark svg")!.getAttribute("aria-hidden")).toBe("true");
      expect(rowEl(el, "general-3").querySelector(".ui-rlst__spark")).toBeNull();
      expect(rowEl(el, "general-3").querySelectorAll('[role="meter"]')).toHaveLength(1);
      expect(el.querySelector(".ui-rlst__count")!.textContent).toBe("1 limited");
      expect(large.querySelector(".ui-rlst__tier")!.textContent).toBe("Tier 3");
      expect(rowEl(el, "general-3").querySelector(".ui-rlst__tier")).toBeNull();
    });
  }

  test("the countdown follows `now`, and Limited stands alone without a reset time", async () => {
    const el = await make();
    el.now = NOW + 15_000;
    await settle();
    expect(rowEl(el, "large-1").querySelector(".ui-rlst__headroom")!.textContent!.trim()).toBe("Limited – resets in 3 s");
    el.rows = [{ ...ROWS[1], resetAt: undefined }];
    await settle();
    expect(el.querySelector(".ui-rlst__headroom")!.textContent!.trim()).toBe("Limited");
  });

  test("its own clock ticks without `now`", async () => {
    const el = await fixture<TcRateLimitStatus>(html`<tc-rate-limit-status .rows=${[{ ...ROWS[1], resetAt: Date.now() + 50_000 }]}></tc-rate-limit-status>`);
    const read = () => el.querySelector(".ui-rlst__headroom")?.textContent?.trim() ?? "";
    await expect.poll(read).toMatch(/^Limited – resets in \d+ s$/);
    const first = read();
    await expect.poll(read, { timeout: 4000 }).not.toBe(first);
  });

  test("sort: the select fires a cancelable tc-sort-change, and the rows follow", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-sort-change", (e) => seen.push((e as unknown as CustomEvent<RateLimitSortChange>).detail.sort));
    const select = el.querySelector<HTMLSelectElement>(".ui-rlst__sort select")!;
    expect(select.closest("label")!.textContent).toContain("Sort");
    select.value = "name";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.sort).toBe("name");
    expect(models(el)).toEqual(["general-3", "large-1", "small-2"]);
    el.addEventListener("tc-sort-change", (e) => e.preventDefault(), { once: true });
    select.value = "tightest";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.sort).toBe("name");
    expect(select.value).toBe("name");
    expect(seen).toEqual(["name", "tightest"]);
    el.hideSort = true;
    await settle();
    expect(el.querySelector(".ui-rlst__sort")).toBeNull();
  });

  test("renamed labels, and the empty state", async () => {
    const el = await make();
    el.labels = { headroom: { limited: "Throttled" }, resetsIn: "clears in", metrics: { requests: "RPM" }, limitedCount: "{n} throttled" };
    await settle();
    expect(rowEl(el, "large-1").querySelector(".ui-rlst__headroom")!.textContent!.trim()).toBe("Throttled – clears in 18 s");
    expect(rowEl(el, "large-1").querySelector(".ui-rlst__metric-label")!.textContent).toBe("RPM");
    expect(el.querySelector(".ui-rlst__count")!.textContent).toBe("1 throttled");
    expect(rowEl(el, "small-2").querySelector(".ui-rlst__headroom")!.textContent!.trim()).toBe("Plenty");
    el.rows = [];
    await settle();
    expect(el.querySelector(".ui-rlst__empty")!.textContent).toBe("No providers connected yet");
    expect(el.querySelector(".ui-rlst__sort")).toBeNull();
    expect(el.querySelector(".ui-rlst__count")).toBeNull();
  });

  test("React wrapper: uncontrolled sort survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RateLimitStatus, { title: "Limits", rows: ROWS, now: NOW, onSortChange: (s) => void seen.push(s), "data-n": n } as React.ComponentProps<typeof RateLimitStatus>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-rate-limit-status")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Limits");
    const select = () => el.querySelector<HTMLSelectElement>(".ui-rlst__sort select")!;
    select().value = "name";
    select().dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.sort).toBe("name");
    expect(seen).toEqual(["name"]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(RateLimitStatus, { rows: ROWS, sort: "tightest", onSortChange: (s) => void seen.push(s) })));
    await settle();
    const el2 = host2.querySelector("tc-rate-limit-status")!;
    const select2 = el2.querySelector<HTMLSelectElement>(".ui-rlst__sort select")!;
    select2.value = "name";
    select2.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el2.sort).toBe("tightest");
    expect(seen.at(-1)).toBe("name");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-rate-limit-status .rows=${ROWS} .now=${NOW}></tc-rate-limit-status>
        <tc-rate-limit-status look="clean" .rows=${ROWS} .now=${NOW}></tc-rate-limit-status>
        <tc-rate-limit-status look="clean" .rows=${[]}></tc-rate-limit-status>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
