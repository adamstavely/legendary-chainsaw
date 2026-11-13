/*
 * <tc-data-region> in real browsers: where the data lives in words, the region cards, each step's checks with the
 * problem in words and focus on the field to fix, the confirmation by typing the workspace's name, cancelable
 * tc-step-change / tc-target-change / tc-migrate, the progress steps and their announcements, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/data-region";
import type { DataRegionItem, DataRegionMigrate, DataRegionOption, DataRegionProgressStep, DataRegionStepChange, TcDataRegion } from "../../src/elements/data-region";
import { DataRegion } from "../../src/elements/react/data-region";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const REGIONS: DataRegionOption[] = [
  { id: "eu-fra", name: "EU – Frankfurt", latency: "About 20 ms" },
  { id: "eu-dub", name: "EU – Dublin", latency: "About 35 ms", note: "Same jurisdiction" },
  { id: "ap-syd", name: "AP – Sydney", latency: "About 290 ms", unavailable: ["large-1"] },
];
const STORED: DataRegionItem[] = [
  { label: "Conversations", inRegion: true },
  { label: "Model processing", inRegion: false, note: "Runs in the EU and US" },
];
const PROGRESS: DataRegionProgressStep[] = [
  { id: "prep", label: "Preparing", status: "done" },
  { id: "copy", label: "Copying data", status: "active", detail: "62%" },
  { id: "index", label: "Re-indexing", status: "pending" },
];

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcDataRegion>(
    html`<tc-data-region look=${look} workspace="Halvorsen Research" current="eu-fra" locale="en-GB" .regions=${REGIONS} .stored=${STORED} .impact=${{ downtime: "About 2 hours of read-only time", reindexed: ["Search index", "Embeddings"] }}></tc-data-region>`,
  );
const radio = (el: Element, id: string) => el.querySelector<HTMLInputElement>(`input[type="radio"][value="${id}"]`)!;
const next = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-drg__next")!;
const title = (el: Element) => el.querySelector(".ui-drg__step-title")!.textContent;
const input = (field: HTMLInputElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("tc-data-region", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: where the data lives in words, the region cards, and the steps`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("drg");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-drg__where")!.textContent).toContain("EU – Frankfurt");
      const items = [...el.querySelectorAll(".ui-drg__item")].map((i) => i.textContent!.replace(/\s+/g, " ").trim());
      expect(items).toEqual(["Conversations In this region", "Model processing Outside this region · Runs in the EU and US"]);
      expect(el.querySelector("legend")!.textContent).toBe("Move the data to");
      expect(radio(el, "eu-fra").disabled).toBe(true);
      expect(radio(el, "eu-fra").closest("label")!.textContent).toContain("Current");
      expect(radio(el, "ap-syd").closest("label")!.textContent).toContain("large-1 not yet available in AP – Sydney");
      expect(el.querySelector('[aria-current="step"]')!.textContent).toContain("Choose");
      expect(title(el)).toBe("Choose");
      expect(el.querySelector(".ui-drg__back")).toBeNull();
    });
  }

  test("each step is checked: no region, no date, no time – the problem in words, aria-invalid and focus on the field", async () => {
    const el = await make();
    next(el).click();
    await settle();
    expect(el.querySelector(".ui-drg__error")!.textContent).toBe("Choose a region to move to.");
    expect(el.querySelector("fieldset")!.getAttribute("aria-invalid")).toBe("true");
    await expect.poll(() => (document.activeElement as HTMLInputElement | null)?.value).toBe("eu-dub");
    expect(el.step).toBe("choose");
    radio(el, "eu-dub").click();
    await settle();
    expect(el.target).toBe("eu-dub");
    expect(el.querySelector(".ui-drg__error")).toBeNull();
    next(el).click();
    await settle();
    expect(el.step).toBe("impact");
    await expect.poll(() => document.activeElement?.classList.contains("ui-drg__step-title")).toBe(true);
    expect(el.querySelector(".ui-drg__impact")!.textContent).toContain("About 2 hours of read-only time");
    expect(el.querySelector(".ui-drg__impact")!.textContent).toContain("Search index, Embeddings");
    next(el).click();
    await settle();
    expect(el.step).toBe("schedule");
    next(el).click();
    await settle();
    expect(el.querySelector(".ui-drg__error")!.textContent).toBe("Choose a date.");
    await expect.poll(() => (document.activeElement as HTMLInputElement | null)?.type).toBe("date");
    input(el.querySelector<HTMLInputElement>('input[type="date"]')!, "2026-11-21");
    await settle();
    next(el).click();
    await settle();
    expect(el.querySelector(".ui-drg__error")!.textContent).toBe("Choose a time.");
    input(el.querySelector<HTMLInputElement>('input[type="time"]')!, "22:00");
    const zone = el.querySelector<HTMLSelectElement>("select")!;
    zone.value = "Europe/Berlin";
    zone.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    next(el).click();
    await settle();
    expect(el.step).toBe("confirm");
    // Browsers differ on a comma after the weekday
    expect(el.querySelector(".ui-drg__summary")!.textContent).toMatch(/^Move Halvorsen Research from EU – Frankfurt to EU – Dublin on Sat,? 21 Nov 2026 at 22:00, Europe\/Berlin\.$/);
    // Back goes one step back
    el.querySelector<HTMLButtonElement>(".ui-drg__back")!.click();
    await settle();
    expect(el.step).toBe("schedule");
  });

  test("Confirm: the workspace's name must be typed exactly; tc-migrate is cancelable; then Progress announces its active step", async () => {
    const el = await make();
    el.target = "eu-dub";
    el.step = "schedule";
    await settle();
    input(el.querySelector<HTMLInputElement>('input[type="date"]')!, "2026-11-21");
    input(el.querySelector<HTMLInputElement>('input[type="time"]')!, "22:00");
    next(el).click();
    await settle();
    const start = el.querySelector<HTMLButtonElement>(".ui-drg__start")!;
    const field = el.querySelector<HTMLInputElement>('input[data-field="confirm"]')!;
    expect(el.querySelector(`label[for="${field.id}"]`)!.textContent).toBe("Type Halvorsen Research to confirm");
    input(field, "halvorsen research");
    await settle();
    start.click();
    await settle();
    expect(el.querySelector(".ui-drg__error")!.textContent).toBe("Type the workspace's name exactly as shown.");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    const migrations: DataRegionMigrate[] = [];
    el.addEventListener("tc-migrate", (e) => migrations.push((e as CustomEvent<DataRegionMigrate>).detail));
    el.addEventListener("tc-migrate", (e) => e.preventDefault(), { once: true });
    input(el.querySelector<HTMLInputElement>('input[data-field="confirm"]')!, "Halvorsen Research");
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-drg__start")!.click();
    await settle();
    expect(el.step).toBe("confirm");
    el.querySelector<HTMLInputElement>('input[data-field="confirm"]')!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();
    expect(migrations).toEqual([
      { region: "eu-dub", at: "2026-11-21T22:00", timeZone: "UTC" },
      { region: "eu-dub", at: "2026-11-21T22:00", timeZone: "UTC" },
    ]);
    expect(el.step).toBe("progress");
    expect(el.querySelector(".ui-drg__actions")).toBeNull();
    el.progress = PROGRESS;
    await settle();
    const rows = [...el.querySelectorAll(".ui-drg__progress-item")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());
    expect(rows).toEqual(["Preparing Done", "Copying data In progress · 62%", "Re-indexing Waiting"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Copying data: In progress");
    el.progress = PROGRESS.map((p) => (p.id === "copy" ? { ...p, status: "done" as const } : p.id === "index" ? { ...p, status: "active" as const } : p));
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Re-indexing: In progress");
  });

  test("controlled: a prevented step or target change keeps the value; renamed labels", async () => {
    const el = await make();
    const steps: DataRegionStepChange[] = [];
    el.addEventListener("tc-step-change", (e) => steps.push((e as CustomEvent<DataRegionStepChange>).detail));
    el.addEventListener("tc-target-change", (e) => e.preventDefault(), { once: true });
    radio(el, "eu-dub").click();
    await settle();
    expect(el.target).toBe(null);
    expect(radio(el, "eu-dub").checked).toBe(false);
    radio(el, "eu-dub").click();
    await settle();
    el.addEventListener("tc-step-change", (e) => e.preventDefault(), { once: true });
    next(el).click();
    await settle();
    expect(el.step).toBe("choose");
    expect(steps).toEqual([{ step: "impact", previous: "choose" }]);
    el.labels = { next: "Continue", steps: { choose: "Region" } };
    await settle();
    expect(next(el).textContent!.trim()).toBe("Continue");
    expect(title(el)).toBe("Region");
  });

  test("narrow: the steps shorten to Step 1 of 5 and nothing overflows", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-data-region workspace="W" current="eu-fra" .regions=${REGIONS} .stored=${STORED}></tc-data-region></div>`);
    const el = wrap.querySelector("tc-data-region")!;
    await expect.poll(() => getComputedStyle(el.querySelector(".ui-drg__steps-short")!).display).toBe("block");
    expect(el.querySelector(".ui-drg__steps-short")!.textContent).toBe("Step 1 of 5 · Choose");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React wrapper: uncontrolled step survives re-renders; controlled stays until the parent changes it; return false stays on Confirm", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(DataRegion, {
        title: "Residency",
        workspace: "W",
        current: "eu-fra",
        regions: REGIONS,
        defaultTarget: "eu-dub",
        onStepChange: (s) => void seen.push(s),
        onTargetChange: (t) => void seen.push(t),
        "data-n": n,
      } as React.ComponentProps<typeof DataRegion>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-data-region")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Residency");
    radio(el, "ap-syd").click();
    await settle();
    next(el).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.step).toBe("impact");
    expect(el.target).toBe("ap-syd");
    expect(seen).toEqual(["ap-syd", "impact"]);
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () =>
      root2.render(
        React.createElement(DataRegion, { workspace: "W", current: "eu-fra", regions: REGIONS, step: "confirm", target: "eu-dub", onStepChange: (s) => void seen.push(s), onMigrate: () => false }),
      ),
    );
    await settle();
    const el2 = host2.querySelector("tc-data-region")!;
    input(el2.querySelector<HTMLInputElement>('input[data-field="confirm"]')!, "W");
    await settle();
    el2.querySelector<HTMLButtonElement>(".ui-drg__start")!.click();
    await settle();
    expect(el2.step).toBe("confirm");
    el2.querySelector<HTMLButtonElement>(".ui-drg__back")!.click();
    await settle();
    expect(el2.step).toBe("confirm");
    expect(seen.at(-1)).toBe("schedule");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, on Choose, Confirm with a problem and Progress`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-data-region heading="Data region" workspace="W" current="eu-fra" .regions=${REGIONS} .stored=${STORED}></tc-data-region>
        <tc-data-region look="clean" workspace="W" current="eu-fra" step="confirm" target="eu-dub" .regions=${REGIONS}></tc-data-region>
        <tc-data-region workspace="W" current="eu-fra" step="progress" .regions=${REGIONS} .progress=${PROGRESS}></tc-data-region>
      </div>`);
      await finish(wrap);
      const confirm = wrap.querySelectorAll("tc-data-region")[1];
      confirm.querySelector<HTMLButtonElement>(".ui-drg__start")!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
