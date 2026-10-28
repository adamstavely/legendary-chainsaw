/*
 * <tc-ops-overview> in real browsers: the status line and health pill, tiles with values, change badges in words and
 * tone by which way is good, sparklines, actionable tiles and their keyboard, the React wrapper and axe in both looks
 * and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/ops-overview";
import type { OpsAction, OpsTile, TcOpsOverview } from "../../src/elements/ops-overview";
import { OpsOverview } from "../../src/elements/react/ops-overview";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TILES: OpsTile[] = [
  { id: "cases", label: "Active cases", value: 1200, change: 2, sub: "tracked", trend: [1, 3, 2, 5] },
  { id: "alerts", label: "Alerts", value: 5, change: 4, goodWhen: "down" },
  { id: "time", label: "Resolution", value: "1.8 d", change: -1, goodWhen: "down" },
  { id: "flat", label: "Teams", value: 3, change: 0 },
  { id: "risk", label: "Critical risk", value: 3, change: 1, goodWhen: "none", tone: "danger" },
];

const tile = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-opo__tile[data-id="${id}"]`)!;
const text = (n: Element | null) => n!.textContent!.replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", actionable = false) =>
  fixture<TcOpsOverview>(
    html`<tc-ops-overview look=${look} locale="en-US" heading="Command overview" status="All operations active" health="nominal" change-label="since last week" ?actionable=${actionable} .tiles=${TILES}></tc-ops-overview>`,
  );

describe("tc-ops-overview", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the status line, health pill and a tile each with its label, value and sub-line`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("opo");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Command overview");
      expect(text(el.querySelector(".ui-opo__health"))).toBe("Feeds nominal");
      expect(el.querySelectorAll(".ui-opo__tile")).toHaveLength(5);
      expect(text(tile(el, "cases").querySelector(".ui-opo__label"))).toBe("Active cases");
      expect(text(tile(el, "cases").querySelector(".ui-opo__value"))).toBe("1,200");
      expect(text(tile(el, "cases").querySelector(".ui-opo__sub"))).toBe("tracked");
      expect(tile(el, "cases").querySelector(".ui-opo__spark path")).toBeTruthy();
      expect(tile(el, "risk").querySelector(".ui-opo__value")!.getAttribute("data-tone")).toBe("danger");
      // Not actionable: no buttons
      expect(el.querySelector("button.ui-opo__tile")).toBeNull();
      expect(el.querySelector(".ui-opo__tiles")!.getAttribute("aria-labelledby")).toBeTruthy();
    });
  }

  test("change badges: the sign, words for screen readers, and green or red by which way is good", async () => {
    const el = await make();
    const badge = (id: string) => tile(el, id).querySelector<HTMLElement>(".ui-opo__change")!;
    expect(badge("cases").getAttribute("data-tone")).toBe("success");
    expect(text(badge("cases"))).toBe("+2up 2 since last week");
    // Alerts going up is bad; resolution time going down is good
    expect(badge("alerts").getAttribute("data-tone")).toBe("danger");
    expect(badge("time").getAttribute("data-tone")).toBe("success");
    expect(text(badge("time"))).toBe("−1down 1 since last week");
    expect(badge("flat").getAttribute("data-tone")).toBe("neutral");
    expect(text(badge("flat").querySelector(".ui-opo__sr"))).toBe("no change since last week");
    expect(badge("risk").getAttribute("data-tone")).toBe("neutral");
  });

  test("health: degraded and down, with renamed labels; no health hides the pill", async () => {
    const el = await make();
    el.health = "degraded";
    await settle();
    expect(text(el.querySelector(".ui-opo__health"))).toBe("Feeds degraded");
    el.healthLabels = { down: "Systems down" };
    el.health = "down";
    await settle();
    expect(text(el.querySelector(".ui-opo__health"))).toBe("Systems down");
    el.health = undefined;
    await settle();
    expect(el.querySelector(".ui-opo__health")).toBeNull();
  });

  test("actionable tiles are buttons with one tab stop; arrows, Home and End move; a press fires tc-action", async () => {
    const el = await make("standard", true);
    const seen: OpsAction[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent<OpsAction>).detail));
    const buttons = el.querySelectorAll<HTMLButtonElement>("button.ui-opo__tile");
    expect(buttons).toHaveLength(5);
    expect(el.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
    buttons[0].focus();
    const at = () => (document.activeElement as HTMLElement | null)?.dataset.id;
    for (const [k, want] of [
      ["ArrowRight", "alerts"],
      ["ArrowDown", "time"],
      ["End", "risk"],
      ["ArrowLeft", "flat"],
      ["Home", "cases"],
    ] as const) {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    }
    tile(el, "alerts").click();
    expect(seen.map((s) => s.id)).toEqual(["alerts"]);
  });

  test("an empty element says so", async () => {
    const el = await fixture<TcOpsOverview>(html`<tc-ops-overview></tc-ops-overview>`);
    expect(text(el.querySelector(".ui-opo__empty"))).toBe("Nothing to show yet.");
  });

  test("React wrapper: title and onAction", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    await act(async () => root.render(React.createElement(OpsOverview, { title: "Ops", tiles: TILES, actionable: true, onAction: (id, t) => void seen.push(`${id}:${t.label}`) })));
    await settle();
    const el = host.querySelector("tc-ops-overview")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Ops");
    tile(el, "time").click();
    expect(seen).toEqual(["time:Resolution"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-ops-overview status="All operations active" health="degraded" actionable .tiles=${TILES}></tc-ops-overview>
        <tc-ops-overview look="clean" health="nominal" .tiles=${TILES}></tc-ops-overview>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
