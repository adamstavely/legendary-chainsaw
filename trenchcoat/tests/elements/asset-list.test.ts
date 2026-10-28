/*
 * <tc-asset-list> in real browsers: groups and counts, masked identifiers and revealing them, statuses, Open, the
 * roving keyboard across groups, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/asset-list";
import type { AssetGroup, AssetOpen, AssetRevealedChange, TcAssetList } from "../../src/elements/asset-list";
import { AssetList } from "../../src/elements/react/asset-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const GROUPS: AssetGroup[] = [
  {
    id: "v",
    label: "Vehicles",
    assets: [
      { id: "car", kind: "car", name: "Audi A6", identifier: "AB-441-KX", identifierLabel: "Plate", detail: "Black · 2023", link: "Registered to customer", status: "confirmed" },
      { id: "bike", kind: "motorcycle", name: "BMW R1250", status: "suspected" },
    ],
  },
  { id: "empty", label: "Boats", assets: [] },
  {
    id: "d",
    label: "Devices",
    assets: [
      { id: "phone", kind: "phone", name: "iPhone 15", identifier: "356938035643809", identifierLabel: "IMEI", status: "in-analysis" },
      { id: "key", kind: "drive", name: "USB key", identifier: "A1", status: "custom" },
    ],
  },
];

const rowOf = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") => fixture<TcAssetList>(html`<tc-asset-list look=${look} description="Review." .groups=${GROUPS}></tc-asset-list>`);

describe("tc-asset-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: groups with headers and counts, empty groups left out, a row per asset with its details and status`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("asl");
      expect(el.dataset.look).toBe(look);
      const heads = [...el.querySelectorAll(".ui-asl__group-head")].map((h) => h.textContent!.replace(/\s+/g, " ").trim());
      expect(heads).toEqual(["Vehicles2 assets", "Devices2 assets"]);
      expect(el.querySelector(".ui-asl__total")!.textContent!.replace(/\s+/g, " ").trim()).toBe("4 assets");
      const car = rowOf(el, "car");
      expect(car.querySelector(".ui-asl__name")!.textContent).toBe("Audi A6");
      expect(car.querySelector(".ui-asl__detail")!.textContent).toBe("Black · 2023");
      expect(car.querySelector(".ui-asl__link")!.textContent).toBe("Registered to customer");
      expect(car.querySelector(".ui-asl__pill")!.textContent!.trim()).toBe("Confirmed");
      expect(rowOf(el, "phone").querySelector(".ui-asl__pill")!.textContent!.trim()).toBe("In analysis");
      // A status the element doesn't know is named from its key, in a neutral tone
      expect(rowOf(el, "key").querySelector(".ui-asl__pill")!.textContent!.trim()).toBe("Custom");
      expect(rowOf(el, "key").dataset.tone).toBe("neutral");
      // One tab stop across all groups
      expect(el.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
    });
  }

  test("identifiers are masked to their last four until revealed; a reveal is cancelable and announced", async () => {
    const el = await make();
    const id = () => rowOf(el, "car").querySelector(".ui-asl__id")!;
    expect(id().textContent!.replace(/\s+/g, " ").trim()).toBe("Plate •••• 1-KXending 1-KX, hidden");
    // Too short to mask: no reveal button
    expect(rowOf(el, "key").querySelector(".ui-asl__reveal")).toBeNull();
    const seen: AssetRevealedChange[] = [];
    el.addEventListener("tc-revealed-change", (e) => seen.push((e as CustomEvent<AssetRevealedChange>).detail));
    const reveal = rowOf(el, "car").querySelector<HTMLButtonElement>(".ui-asl__reveal")!;
    expect(reveal.getAttribute("aria-label")).toBe("Show plate, Audi A6");
    reveal.click();
    await settle();
    expect(id().textContent!.replace(/\s+/g, " ").trim()).toBe("Plate AB-441-KX");
    expect(reveal.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Audi A6 plate shown");
    expect(seen).toEqual([{ revealed: ["car"], id: "car", shown: true }]);
    el.addEventListener("tc-revealed-change", (e) => e.preventDefault());
    reveal.click();
    await settle();
    expect(el.revealed).toEqual(["car"]);
    // masked off shows everything
    el.masked = false;
    await settle();
    expect(rowOf(el, "phone").querySelector(".ui-asl__id")!.textContent!.replace(/\s+/g, " ").trim()).toBe("IMEI 356938035643809");
    expect(el.querySelector(".ui-asl__reveal")).toBeNull();
  });

  test("Open fires tc-open with the asset and its group", async () => {
    const el = await make();
    const seen: AssetOpen[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent<AssetOpen>).detail));
    const open = rowOf(el, "phone").querySelector<HTMLButtonElement>(".ui-asl__open")!;
    expect(open.getAttribute("aria-label")).toBe("Open iPhone 15");
    open.click();
    expect(seen.map((s) => [s.asset.id, s.group])).toEqual([["phone", "d"]]);
  });

  test("keyboard: ↑ ↓ move between rows across groups, ← → between a row's buttons, Home / End to the ends", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-at");
    el.querySelector<HTMLElement>('[data-at="0:1"]')!.focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('button[tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowLeft");
    expect(at()).toBe("0:0");
    await press("ArrowDown");
    // The motorcycle has no identifier: the move lands on its Open
    expect(at()).toBe("1:1");
    await press("ArrowDown");
    expect(at()).toBe("2:1");
    await press("ArrowLeft");
    expect(at()).toBe("2:0");
    await press("End");
    expect(at()).toBe("3:1");
    await press("Home");
    expect(at()).toBe("0:1");
  });

  test("an empty element says so; renamed statuses and the open label apply", async () => {
    const el = await fixture<TcAssetList>(html`<tc-asset-list></tc-asset-list>`);
    expect(el.querySelector(".ui-asl__empty")!.textContent).toBe("No assets on record.");
    el.groups = GROUPS;
    el.statuses = { custom: { label: "Lost", tone: "danger" } };
    el.openLabel = "View";
    await settle();
    expect(rowOf(el, "key").querySelector(".ui-asl__pill")!.textContent!.trim()).toBe("Lost");
    expect(rowOf(el, "key").querySelector(".ui-asl__open")!.textContent!.trim()).toBe("View");
  });

  test("React wrapper: controlled revealed stays until the parent changes it; onOpen gets the asset", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[][] = [];
    const opened: string[] = [];
    await act(async () =>
      root.render(React.createElement(AssetList, { title: "Fleet", groups: GROUPS, revealed: [], onRevealedChange: (r) => void asked.push(r), onOpen: (a, g) => void opened.push(`${a.id}@${g}`) })),
    );
    await settle();
    const el = host.querySelector("tc-asset-list")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Fleet");
    rowOf(el, "car").querySelector<HTMLButtonElement>(".ui-asl__reveal")!.click();
    await settle();
    expect(asked).toEqual([["car"]]);
    expect(el.revealed).toEqual([]);
    rowOf(el, "bike").querySelector<HTMLButtonElement>(".ui-asl__open")!.click();
    expect(opened).toEqual(["bike@v"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-asset-list description="Review." .groups=${GROUPS} .revealed=${["phone"]}></tc-asset-list>
        <tc-asset-list look="clean" .groups=${GROUPS}></tc-asset-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
