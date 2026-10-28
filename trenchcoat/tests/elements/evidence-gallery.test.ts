/*
 * <tc-evidence-gallery> in real browsers: the filter and its counts, the summary, the grid's tiles and the table's rows,
 * tc-filter-change and tc-alt-change (and preventDefault), one grid column when narrow, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/evidence-gallery";
import type { EvidenceAltChange, EvidenceFilterChange, EvidenceItem, TcEvidenceGallery } from "../../src/elements/evidence-gallery";
import type { TcImageGrid } from "../../src/elements/image-grid";
import type { TcSegmentedControl } from "../../src/elements/segmented-control";
import { EvidenceGallery } from "../../src/elements/react/evidence-gallery";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const img = (fill: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="${fill}"/></svg>`)}`;
const ITEMS: EvidenceItem[] = [
  { id: "dock", title: "Loading bay", kind: "Photo", src: img("#345"), alt: "Loading bay at dawn", attestation: "attested", claims: 3, source: "Camera 2" },
  { id: "note", title: "Delivery note", kind: "Scan", src: img("#ddd"), alt: "Signed delivery note", attestation: "attested", claims: 1, source: "Driver app" },
  { id: "box", title: "Pallet damage", kind: "Photo", src: img("#c96"), alt: "Split box", attestation: "unverified", claims: 2 },
  { id: "door", title: "Dock door", kind: "Photo", src: img("#222"), alt: "", attestation: "failed", claims: 0, source: "Unknown upload" },
];

const make = (look: "standard" | "clean" = "standard", width = 1200) =>
  fixture<TcEvidenceGallery>(html`<tc-evidence-gallery look=${look} style=${`width: ${width}px`} heading="Evidence" subtitle="Claim 2291" .items=${ITEMS}></tc-evidence-gallery>`);
const grid = (el: Element) => el.querySelector<TcImageGrid>("tc-image-grid")!;
const seg = (el: Element) => el.querySelector<TcSegmentedControl>("tc-segmented-control")!;
const summary = (el: Element) => el.querySelector(".ui-evg__summary")!.textContent!.replace(/\s+/g, " ").trim();
const rowIds = (el: Element) => (el.querySelector("tc-data-table") as unknown as { rows: { id: string }[] }).rows.map((r) => r.id);
/** Picks an option in the inner filter the way a click does: through its cancelable change event */
const pick = (el: Element, value: string) =>
  seg(el).dispatchEvent(new CustomEvent("tc-value-change", { detail: { value }, bubbles: true, composed: true, cancelable: true }));

describe("tc-evidence-gallery", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the filter with counts, the summary, the grid's tiles and the table's rows; the pieces share the look`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("evg");
      expect(el.dataset.look).toBe(look);
      for (const child of el.querySelectorAll("tc-segmented-control, tc-image-grid, tc-data-table")) expect((child as HTMLElement).dataset.look).toBe(look);
      expect(seg(el).options.map((o) => `${o.label} ${o.badge}`)).toEqual(["All 4", "Attested 2", "Unverified 1", "Failed 1"]);
      expect(seg(el).getAttribute("aria-label") ?? seg(el).querySelector("[aria-label]")?.getAttribute("aria-label")).toBe("Show");
      expect(summary(el)).toBe("4 items · 2 attested · 6 linked claims");
      const tiles = grid(el).tiles;
      expect(tiles.map((t) => t.id)).toEqual(["dock", "note", "box", "door"]);
      expect(tiles[0]).toMatchObject({ label: "Loading bay", badge: "Attested", badgeTone: "success", meta: "3 claims" });
      expect(tiles[1].meta).toBe("1 claim");
      expect(tiles[2].badgeTone).toBe("warning");
      expect(tiles[3].badgeTone).toBe("danger");
      expect(grid(el).heading).toBe("Evidence");
      expect(grid(el).prompt).toBe("Claim 2291");
      expect(rowIds(el)).toEqual(["dock", "note", "box", "door"]);
      expect(el.querySelector("tc-data-table")!.hasAttribute("readonly")).toBe(true);
    });
  }

  test("picking a filter: tc-filter-change, then only those items in the grid, the table and the summary", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent<EvidenceFilterChange>).detail.filter));
    // The inner control's own event doesn't reach the page
    let inner = 0;
    document.body.addEventListener("tc-value-change", () => inner++);
    pick(el, "attested");
    await settle();
    expect(seen).toEqual(["attested"]);
    expect(inner).toBe(0);
    expect(el.filter).toBe("attested");
    expect(grid(el).tiles.map((t) => t.id)).toEqual(["dock", "note"]);
    expect(rowIds(el)).toEqual(["dock", "note"]);
    expect(summary(el)).toBe("2 items · 2 attested · 4 linked claims");
    pick(el, "failed");
    await settle();
    expect(summary(el)).toBe("1 item · 0 attested · 0 linked claims");
    // An unknown value is ignored
    pick(el, "everything");
    await settle();
    expect(el.filter).toBe("failed");
  });

  test("preventDefault on tc-filter-change keeps the filter (controlled use)", async () => {
    const el = await make();
    el.addEventListener("tc-filter-change", (e) => e.preventDefault());
    pick(el, "unverified");
    await settle();
    expect(el.filter).toBe("all");
    expect(grid(el).tiles).toHaveLength(4);
    el.filter = "unverified";
    await settle();
    expect(grid(el).tiles.map((t) => t.id)).toEqual(["box"]);
  });

  test("editing an alt text in the grid: tc-alt-change with the item; kept until the items change; preventDefault keeps the old one", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-alt-change", (e) => {
      const d = (e as CustomEvent<EvidenceAltChange>).detail;
      seen.push(`${d.item.id}: ${d.alt}`);
    });
    const edit = (id: string, alt: string) =>
      grid(el).dispatchEvent(
        new CustomEvent("tc-tiles-change", { detail: { tiles: grid(el).tiles.map((t) => (t.id === id ? { ...t, alt } : t)) }, bubbles: true, composed: true, cancelable: true }),
      );
    let inner = 0;
    document.body.addEventListener("tc-tiles-change", () => inner++);
    edit("door", "Dock door, shutter closed");
    await settle();
    expect(seen).toEqual(["door: Dock door, shutter closed"]);
    expect(inner).toBe(0);
    expect(grid(el).tiles.find((t) => t.id === "door")!.alt).toBe("Dock door, shutter closed");
    // Refused by the page: the old text stays
    el.addEventListener("tc-alt-change", (e) => e.preventDefault(), { once: true });
    edit("dock", "Something else");
    await settle();
    expect(grid(el).tiles.find((t) => t.id === "dock")!.alt).toBe("Loading bay at dawn");
    // New items: the edits are dropped
    el.items = ITEMS.map((i) => ({ ...i }));
    await settle();
    expect(grid(el).tiles.find((t) => t.id === "door")!.alt).toBe("");
  });

  test("narrow: the grid shows one column, and the table goes under the grid", async () => {
    const el = await make("standard", 400);
    await expect.poll(() => grid(el).columns).toBe(1);
    const [g, t] = [grid(el).getBoundingClientRect(), el.querySelector("tc-data-table")!.getBoundingClientRect()];
    expect(t.top).toBeGreaterThanOrEqual(g.bottom - 1);
    el.style.width = "1200px";
    await expect.poll(() => grid(el).columns).toBe(2);
  });

  test("renamed states and an empty gallery", async () => {
    const el = await make();
    el.attestationLabels = { attested: "Verified" };
    await settle();
    expect(seg(el).options[1].label).toBe("Verified");
    expect(grid(el).tiles[0].badge).toBe("Verified");
    el.items = [];
    await settle();
    expect(summary(el)).toBe("0 items · 0 attested · 0 linked claims");
    expect(grid(el).tiles).toEqual([]);
  });

  test("React wrapper: title, a controlled filter, onFilterChange and onAltChange", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "1200px";
    document.body.append(host);
    const root = createRoot(host);
    const filters: string[] = [];
    const alts: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(EvidenceGallery, { title: "Exhibits", items: ITEMS, filter: "all", onFilterChange: (f) => void filters.push(f), onAltChange: (item, alt) => void alts.push(`${item.id}:${alt}`) }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-evidence-gallery")!;
    expect(grid(el).heading).toBe("Exhibits");
    await act(async () => void pick(el, "failed"));
    await settle();
    // Controlled: reported, but the parent didn't change it
    expect(filters).toEqual(["failed"]);
    expect(el.filter).toBe("all");
    grid(el).dispatchEvent(new CustomEvent("tc-tiles-change", { detail: { tiles: grid(el).tiles.map((t) => (t.id === "door" ? { ...t, alt: "A door" } : t)) }, bubbles: true, cancelable: true }));
    expect(alts).toEqual(["door:A door"]);
    await act(async () => root.unmount());
  });

  test("React wrapper, uncontrolled: the filter survives parent re-renders", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const render = (n: number) => root.render(React.createElement(EvidenceGallery, { items: ITEMS, subtitle: `Render ${n}` }));
    await act(async () => render(1));
    const el = host.querySelector("tc-evidence-gallery")!;
    await act(async () => void pick(el, "attested"));
    await act(async () => render(2));
    await settle();
    expect(el.filter).toBe("attested");
    expect(grid(el).prompt).toBe("Render 2");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 1200px; background: var(--tc-surface-base)">
        <tc-evidence-gallery heading="Evidence" .items=${ITEMS}></tc-evidence-gallery>
        <tc-evidence-gallery look="clean" heading="Evidence, clean" .items=${ITEMS.slice(0, 2)}></tc-evidence-gallery>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
