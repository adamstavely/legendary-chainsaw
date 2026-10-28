/*
 * <tc-biometric-status> in real browsers: a listbox of modalities with icon, detail, status and quality, the count
 * enrolled, the match score, selecting a row, the keyboard, controlled use, the React wrapper and axe in both looks
 * and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/biometric-status";
import type { BiometricModality, BiometricSelectedChange, TcBiometricStatus } from "../../src/elements/biometric-status";
import { BiometricStatus } from "../../src/elements/react/biometric-status";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const MODS: BiometricModality[] = [
  { id: "face", label: "Face", kind: "face", detail: "Front and profile", status: "enrolled", quality: 0.96 },
  { id: "prints", label: "Fingerprints", kind: "fingerprint", detail: "9 of 10", status: "partial", quality: 0.784 },
  { id: "iris", label: "Iris", kind: "iris", status: "in-progress", quality: 0.5, qualityLabel: "Progress" },
  { id: "palm", label: "Palm", kind: "palm", status: "on-file", quality: 0.88 },
  { id: "sig", label: "Signature", kind: "signature", status: "expired" },
  { id: "dna", label: "DNA", status: "missing" },
];

const row = (el: Element, i: number) => el.querySelector<HTMLElement>(`[data-row="${i}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", selected: string | null = null) =>
  fixture<TcBiometricStatus>(html`<tc-biometric-status look=${look} description="Visitor badge." .modalities=${MODS} .match=${{ label: "Photo ID match", value: 0.972 }} .selected=${selected}></tc-biometric-status>`);

describe("tc-biometric-status", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a listbox with a row per modality, its icon, status and quality, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("bios");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Biometrics");
      const options = list.querySelectorAll('[role="option"]');
      expect(options).toHaveLength(6);
      expect(list.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect([...options].map((o) => o.querySelector(".ui-bios__pill")!.textContent!.replace(", ", ""))).toEqual(["Enrolled", "Partial", "In progress", "On file", "Expired", "Missing"]);
      expect(row(el, 0).textContent!.replace(/\s+/g, " ").replace(/ ,/g, ",").trim()).toBe("Face, Front and profile, Enrolled, Quality 96%");
      // Each row has an icon, every status a mark
      expect(options[0].querySelector(".ui-bios__icon svg")).toBeTruthy();
      expect(options[5].querySelector(".ui-bios__pill svg")).toBeTruthy();
    });
  }

  test("the count enrolled, the match score and quality: percentages, a row's own label, none when not given", async () => {
    const el = await make();
    expect(el.querySelector(".ui-bios__count-num")!.textContent).toBe("2 of 6");
    expect(el.querySelector(".ui-bios__match-label")!.textContent).toBe("Photo ID match");
    expect(el.querySelector(".ui-bios__match-value")!.textContent).toBe("97.2%");
    expect(row(el, 1).querySelector(".ui-bios__pct")!.textContent).toBe(", Quality 78.4%");
    expect(row(el, 2).querySelector(".ui-bios__pct")!.textContent).toBe(", Progress 50%");
    expect(row(el, 4).querySelector(".ui-bios__meter")).toBeNull();
    el.enrolledStatuses = ["enrolled", "on-file", "partial"];
    el.qualityLabel = "Confidence";
    el.statusLabels = { "in-progress": "Modelling" };
    await settle();
    expect(el.querySelector(".ui-bios__count-num")!.textContent).toBe("3 of 6");
    expect(row(el, 0).querySelector(".ui-bios__pct")!.textContent).toBe(", Confidence 96%");
    expect(row(el, 2).querySelector(".ui-bios__pill")!.textContent).toContain("Modelling");
    el.match = null;
    await settle();
    expect(el.querySelector(".ui-bios__match")).toBeNull();
  });

  test("click or Enter selects a row; again or Escape clears it; tc-selected-change fires with the modality", async () => {
    const el = await make();
    const seen: BiometricSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<BiometricSelectedChange>).detail));
    row(el, 2).click();
    await settle();
    expect(el.selected).toBe("iris");
    expect(row(el, 2).getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Selected Iris");
    row(el, 2).click();
    await settle();
    expect(el.selected).toBeNull();
    key(row(el, 0), "Enter");
    await settle();
    expect(el.selected).toBe("face");
    key(row(el, 0), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(seen.map((s) => [s.selected, s.modality?.label])).toEqual([
      ["iris", "Iris"],
      [null, undefined],
      ["face", "Face"],
      [null, undefined],
    ]);
  });

  test("keyboard: ↑ ↓ move between rows, Home / End to the ends, Space selects", async () => {
    const el = await make();
    row(el, 0).focus();
    const at = () => Number((document.activeElement as HTMLElement).dataset.row);
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('[role="option"][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowDown");
    expect(at()).toBe(1);
    await press("End");
    expect(at()).toBe(5);
    await press("ArrowDown");
    expect(at()).toBe(5);
    await press("Home");
    expect(at()).toBe(0);
    await press("ArrowUp");
    expect(at()).toBe(0);
    await press(" ");
    expect(el.selected).toBe("face");
  });

  test("controlled: preventDefault() keeps the selection; a selected row going away clears it; empty renders", async () => {
    const el = await make("standard", "palm");
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    row(el, 0).click();
    await settle();
    expect(el.selected).toBe("palm");
    el.modalities = MODS.filter((m) => m.id !== "palm");
    await settle();
    expect(el.selected).toBeNull();
    const empty = await fixture<TcBiometricStatus>(html`<tc-biometric-status heading="Enrolment"></tc-biometric-status>`);
    expect(empty.querySelector(".ui-bios__empty")).toBeTruthy();
    expect(empty.querySelector('[role="listbox"]')).toBeNull();
    expect(empty.querySelector(".tc-head__title")!.textContent).toBe("Enrolment");
  });

  test("React wrapper: an uncontrolled selection survives parent re-renders; onSelectedChange gets the modality", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(BiometricStatus, {
        title: "Enrolment",
        modalities: MODS,
        onSelectedChange: (s, m) => void seen.push([s, m?.status]),
        "data-n": n,
      } as React.ComponentProps<typeof BiometricStatus>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-biometric-status")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Enrolment");
    row(el, 1).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("prints");
    expect(seen).toEqual([["prints", "partial"]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(BiometricStatus, { modalities: MODS, selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-biometric-status")!;
    row(el, 3).click();
    await settle();
    expect(asked).toEqual(["palm"]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-biometric-status description="Visitor badge." .modalities=${MODS} .match=${{ label: "Photo ID match", value: 0.972, detail: "Against the passport photo" }} selected="face"></tc-biometric-status>
        <tc-biometric-status look="clean" .modalities=${MODS}></tc-biometric-status>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
